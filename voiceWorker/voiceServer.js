require("dotenv").config()
const http = require("http")
const WebSocket = require("ws")
const { AccessToken } = require("livekit-server-sdk")
const {
  Room,
  RoomEvent,
  AudioSource,
  LocalAudioTrack,
  TrackSource,
  AudioStream,
  AudioFrame,
} = require("@livekit/rtc-node")
const { createClient } = require("@supabase/supabase-js")
const {
  createClient: createDeepgramClient,
  LiveTranscriptionEvents,
} = require("@deepgram/sdk")
const OpenAI = require("openai")
const { spawn } = require("child_process")
const { Readable } = require("stream")
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg")

process.on("uncaughtException", (err) => {
  if (
    err.message?.includes("InvalidState") ||
    err.message?.includes("failed to capture frame") ||
    err.message?.includes("RtcError")
  ) {
    console.warn("Suppressed captureFrame crash:", err.message)
  } else {
    console.error("Uncaught exception:", err)
    process.exit(1)
  }
})

process.on("unhandledRejection", (reason) => {
  if (
    reason?.message?.includes("InvalidState") ||
    reason?.message?.includes("failed to capture frame")
  ) return
  console.error("Unhandled rejection:", reason)
})

const server = http.createServer()
const wss = new WebSocket.Server({ server })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const deepgramClient = createDeepgramClient(process.env.DEEPGRAM_API_KEY)
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
})

const latencyLog = []

function logLatency(label, ms, extra = {}) {
  const entry = { label, ms, ...extra, ts: new Date().toISOString() }
  latencyLog.push(entry)
  console.log(`[LATENCY] ${label}: ${ms}ms`, Object.keys(extra).length ? JSON.stringify(extra) : "")
}

function printLatencySummary() {
  if (latencyLog.length === 0) return
  console.log("\n===== LATENCY SUMMARY =====")
  const groups = {}
  for (const entry of latencyLog) {
    if (!groups[entry.label]) groups[entry.label] = []
    groups[entry.label].push(entry.ms)
  }
  for (const [label, values] of Object.entries(groups)) {
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    const min = Math.min(...values)
    const max = Math.max(...values)
    console.log(`  ${label}: avg=${avg}ms  min=${min}ms  max=${max}ms  samples=${values.length}`)
  }
  console.log("===========================\n")
}

setInterval(printLatencySummary, 60000)

wss.on("connection", async (ws, req) => {
  console.log("WebSocket connected")
  try {
    const params = new URLSearchParams(req.url.split("?")[1])
    const callId = params.get("call_id")
    const agentId = params.get("agent_id")
    const roomName = params.get("room_name")

    if (!callId || !agentId || !roomName) {
      console.log("Missing params")
      ws.close()
      return
    }

    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      console.log("Agent not found")
      ws.close()
      return
    }

    const { data: call, error: callError } = await supabase
      .from("calls")
      .select("*")
      .eq("id", callId)
      .single()

    if (callError || !call) {
      console.log("Call not found")
      ws.close()
      return
    }

    const userId = call.user_id
    console.log("Agent loaded | Voice ID:", agent.voice_id)
    console.log("User ID:", userId)

    const deepgramLive = deepgramClient.listen.live({
      model: "nova-2",
      interim_results: false,
      encoding: "linear16",
      sample_rate: 48000,
      channels: 1,
    })

    const deepgramConnectStart = Date.now()
    await new Promise((resolve, reject) => {
      deepgramLive.on(LiveTranscriptionEvents.Open, () => {
        logLatency("deepgram_connect", Date.now() - deepgramConnectStart)
        console.log("Deepgram connected")
        resolve()
      })
      deepgramLive.on(LiveTranscriptionEvents.Error, reject)
      setTimeout(() => reject(new Error("Deepgram timeout")), 5000)
    })

    const audioSource = new AudioSource(48000, 1)
    const audioTrack = LocalAudioTrack.createAudioTrack("agent-voice", audioSource)

    let audioReadyResolve
    const audioReadyPromise = new Promise(resolve => {
      audioReadyResolve = resolve
    })

    let ttsQueue = Promise.resolve()

    const state = {
      isSpeaking: false,
      bargingIn: false,
      sequenceNumber: 0,
      generationId: 0,
    }

    const botToken = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      { identity: "agent-bot", ttl: "10m" }
    )
    botToken.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })
    const jwt = await botToken.toJwt()

    const room = new Room()

    room.on(RoomEvent.TrackSubscribed, async (track, publication, participant) => {
      console.log("Track subscribed from:", participant.identity, "| Kind:", track.kind)
      if (track.kind === 1 && participant.identity !== "agent-bot") {
        console.log("Starting audio capture from:", participant.identity)
        try {
          const audioStream = new AudioStream(track)
          for await (const frame of audioStream) {
            if (deepgramLive.getReadyState() === 1) {
              const pcm = Buffer.from(
                frame.data.buffer,
                frame.data.byteOffset,
                frame.data.byteLength
              )
              deepgramLive.send(pcm)
            }
          }
        } catch (err) {
          if (!err.message?.includes("closed")) {
            console.error("Audio stream error:", err)
          }
        }
      }
    })

    const livekitConnectStart = Date.now()
    await room.connect(process.env.LIVEKIT_URL, jwt)
    logLatency("livekit_connect", Date.now() - livekitConnectStart)
    console.log("Bot joined room:", roomName)

    await room.localParticipant.publishTrack(audioTrack, {
      name: "agent-voice",
      source: TrackSource.SOURCE_MICROPHONE,
    })
    console.log("Audio track published")

    await new Promise(resolve => setTimeout(resolve, 1500))
    audioReadyResolve()
    console.log("Audio ready")

    ws.send(JSON.stringify({ type: "ready" }))
    console.log("READY sent to frontend")

    deepgramLive.on(LiveTranscriptionEvents.Transcript, async (data) => {
      try {
        const alt = data.channel?.alternatives?.[0]
        const text = alt?.transcript?.trim()
        const isFinal = data.is_final

        if (!text || !isFinal) return

        const t0 = Date.now()
        console.log("User:", text)
        ws.send(JSON.stringify({ type: "transcript", speaker: "user", text }))

        state.sequenceNumber++
        const userSeq = state.sequenceNumber

        supabase.from("transcripts").insert({
          call_id: callId,
          user_id: userId,
          speaker: "user",
          text,
          is_final: true,
          sequence_number: userSeq,
        }).then(({ error }) => {
          if (error) console.error("User transcript DB error:", error)
        })

        if (state.isSpeaking || ttsQueue !== Promise.resolve()) {
          console.log("BARGE-IN - cancelling current speech")
          state.bargingIn = true
          state.isSpeaking = false
        }

        state.generationId++
        const myGenerationId = state.generationId

        ttsQueue = Promise.resolve()

        const llmStart = Date.now()
        const stream = await openai.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: agent.system_prompt },
            { role: "user", content: text },
          ],
          max_tokens: 150,
          stream: true,
        })

        logLatency("llm_stream_open", Date.now() - llmStart)
        console.log("LLM stream started:", Date.now() - t0, "ms")

        let fullResponse = ""
        let sentenceBuffer = ""
        let firstChunkTime = null
        let firstSentenceTime = null
        let sentenceCount = 0

        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content || ""
          if (!token) continue

          if (!firstChunkTime) {
            firstChunkTime = Date.now()
            logLatency("llm_first_token", firstChunkTime - t0)
            console.log("First LLM token:", firstChunkTime - t0, "ms")
          }

          fullResponse += token
          sentenceBuffer += token

          const sentenceEnd = sentenceBuffer.search(/[.!?]\s/)
          if (sentenceEnd !== -1) {
            const sentence = sentenceBuffer.slice(0, sentenceEnd + 1).trim()
            sentenceBuffer = sentenceBuffer.slice(sentenceEnd + 2)

            if (sentence) {
              const sentenceForTTS = sentence
              const sentenceGenId = myGenerationId
              const sentenceIndex = ++sentenceCount

              if (sentenceIndex === 1) {
                firstSentenceTime = Date.now()
                logLatency("llm_first_sentence", firstSentenceTime - t0)
              }

              ttsQueue = ttsQueue.then(async () => {
                await audioReadyPromise

                if (state.generationId !== sentenceGenId) {
                  console.log("Skipping stale TTS sentence (barge-in)")
                  return
                }

                state.bargingIn = false
                const ttsStart = Date.now()
                await streamTTS(sentenceForTTS, agent.voice_id, audioSource, state, sentenceGenId, t0, sentenceIndex)
                logLatency("tts_sentence_total", Date.now() - ttsStart, { sentenceIndex })
              }).catch(err => console.error("TTS queue error:", err))
            }
          }
        }

        const llmTotalTime = Date.now() - llmStart
        logLatency("llm_total", llmTotalTime)
        console.log("Total LLM:", Date.now() - t0, "ms | Response:", fullResponse.slice(0, 60))

        const remaining = sentenceBuffer.trim()
        if (remaining) {
          const remainingGenId = myGenerationId
          const remainingIndex = ++sentenceCount

          ttsQueue = ttsQueue.then(async () => {
            await audioReadyPromise

            if (state.generationId !== remainingGenId) {
              console.log("Skipping stale remaining TTS (barge-in)")
              return
            }

            state.bargingIn = false
            const ttsStart = Date.now()
            await streamTTS(remaining, agent.voice_id, audioSource, state, remainingGenId, t0, remainingIndex)
            logLatency("tts_sentence_total", Date.now() - ttsStart, { sentenceIndex: remainingIndex })
          }).catch(err => console.error("TTS queue error:", err))
        }

        ws.send(JSON.stringify({ type: "transcript", speaker: "agent", text: fullResponse }))

        state.sequenceNumber++
        const agentSeq = state.sequenceNumber

        supabase.from("transcripts").insert({
          call_id: callId,
          user_id: userId,
          speaker: "agent",
          text: fullResponse,
          is_final: true,
          sequence_number: agentSeq,
        }).then(({ error }) => {
          if (error) console.error("Agent transcript DB error:", error)
        })

      } catch (err) {
        console.error("Transcript handler error:", err)
      }
    })

    ws.on("close", () => {
      console.log("WebSocket closed - cleaning up")
      ttsQueue.finally(() => {
        state.isSpeaking = false
        state.bargingIn = true
        room.disconnect()
        deepgramLive.finish()
        printLatencySummary()
        console.log("Cleanup complete")
      })
    })

  } catch (err) {
    console.error("Fatal error:", err)
    ws.close()
  }
})

async function streamTTS(text, voiceId, audioSource, state, genId, turnStart, sentenceIndex) {
  if (state.bargingIn || state.generationId !== genId) {
    console.log("Skipping TTS - stale or barged in")
    return
  }

  console.log("Starting TTS:", text.slice(0, 60))
  const ttsStart = Date.now()

  let response
  try {
    const fetchStart = Date.now()
    response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_flash_v2_5",
          optimize_streaming_latency: 4,
        }),
      }
    )
    logLatency("elevenlabs_fetch", Date.now() - fetchStart, { sentenceIndex })
  } catch (err) {
    console.log("TTS fetch aborted or failed:", err.message)
    return
  }

  if (state.bargingIn || state.generationId !== genId) {
    console.log("Barge-in during ElevenLabs fetch - skipping")
    return
  }

  console.log("ElevenLabs fetch:", Date.now() - ttsStart, "ms | status:", response.status)

  if (!response.ok) {
    console.error("ElevenLabs error:", await response.text())
    return
  }

  const nodeStream = Readable.fromWeb(response.body)
  const pcmChunks = []

  const ffmpegStart = Date.now()
  await new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegInstaller.path, [
      "-f", "mp3",
      "-i", "pipe:0",
      "-f", "s16le",
      "-ar", "48000",
      "-ac", "1",
      "pipe:1",
    ])

    ffmpeg.stderr.on("data", () => {})
    ffmpeg.on("error", reject)
    ffmpeg.stdout.on("data", (chunk) => {
      if (!state.bargingIn && state.generationId === genId) {
        pcmChunks.push(chunk)
      }
    })
    ffmpeg.on("close", (code) => {
      logLatency("ffmpeg_decode", Date.now() - ffmpegStart, { sentenceIndex })
      console.log("FFmpeg done:", Date.now() - ffmpegStart, "ms | code:", code)
      resolve()
    })

    nodeStream.pipe(ffmpeg.stdin)
    nodeStream.on("error", (err) => { ffmpeg.stdin.destroy(); reject(err) })
    ffmpeg.stdin.on("error", (err) => { if (err.code !== "EPIPE") reject(err) })
  })

  if (state.bargingIn || state.generationId !== genId) {
    console.log("Barge-in after FFmpeg - skipping frames")
    state.isSpeaking = false
    return
  }

  const FRAME_SIZE = 960
  const allPcm = Buffer.concat(pcmChunks)
  const samples = new Int16Array(allPcm.buffer, allPcm.byteOffset, allPcm.byteLength / 2)
  const totalFrames = Math.floor(samples.length / FRAME_SIZE)

  if (sentenceIndex === 1 && turnStart) {
    logLatency("turn_to_first_audio", Date.now() - turnStart, { sentenceIndex })
    console.log("Turn-to-first-audio latency:", Date.now() - turnStart, "ms")
  }

  console.log("Sending", totalFrames, "frames to LiveKit")

  const frameStart = Date.now()
  state.isSpeaking = true

  for (let i = 0; i + FRAME_SIZE <= samples.length; i += FRAME_SIZE) {
    if (state.bargingIn || state.generationId !== genId) {
      console.log("Barge-in during frame send - stopping")
      break
    }

    const slice = samples.slice(i, i + FRAME_SIZE)
    const frame = new AudioFrame(slice, 48000, 1, FRAME_SIZE)
    try {
      await audioSource.captureFrame(frame)
    } catch (err) {
      console.warn("captureFrame error:", err.message)
      break
    }
  }

  logLatency("livekit_frame_send", Date.now() - frameStart, { sentenceIndex, totalFrames })

  state.isSpeaking = false
  console.log("TTS complete:", Date.now() - ttsStart, "ms")
}

server.listen(8080, () => {
  console.log("Voice WebRTC Server running on port 8080")
})