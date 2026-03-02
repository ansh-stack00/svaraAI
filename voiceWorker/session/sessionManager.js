const { LatencyTracker } = require("./latencyTracker")
const { extractNextChunk } = require("../audio/chunker")
const { AudioPlayer } = require("../audio/audioPlayer")
const { streamChat } = require("../providers/llm")

const {
  fetchAndDecodeAudio,
  prewarmElevenLabs,
} = require("../providers/elevenlabs")
const {
  createLiveKitSession,
  attachIncomingAudio,
} = require("../livekit/livekitClient")
const {
  getAgent,
  getCall,
  insertTranscript,
} = require("../db/supabase")

const {
  createClient: createDeepgramClient,
  LiveTranscriptionEvents,
} = require("@deepgram/sdk")

class SessionManager {
  constructor(ws, req) {
    this.ws = ws
    this.req = req
    this.lat = new LatencyTracker()
    this.sequenceNumber = 0
  }

  async start() {
    try {
      const params = new URLSearchParams(
        this.req.url.split("?")[1]
      )

      const callId = params.get("call_id")
      const agentId = params.get("agent_id")
      const roomName = params.get("room_name")

      if (!callId || !agentId || !roomName) {
        this.ws.close()
        return
      }

      const agent = await getAgent(agentId)
      const call = await getCall(callId)

      const userId = call.user_id

      // ── Deepgram ─────────────────────────
      const deepgram = createDeepgramClient(
        process.env.DEEPGRAM_API_KEY
      )

      const dgLive = deepgram.listen.live({
        model: "nova-2",
        interim_results: true,
        utterance_end_ms: 500,
        vad_events: true,
        encoding: "linear16",
        sample_rate: 48000,
        channels: 1,
      })

      await new Promise((resolve, reject) => {
        dgLive.on(LiveTranscriptionEvents.Open, resolve)
        dgLive.on(LiveTranscriptionEvents.Error, reject)
      })

      // ── LiveKit ──────────────────────────
      const { room, audioSource } =
        await createLiveKitSession(roomName)

      const player = new AudioPlayer(audioSource)
      player.start()

      attachIncomingAudio(room, (frame) => {
        if (dgLive.getReadyState() === 1) {
          dgLive.send(
            Buffer.from(
              frame.data.buffer,
              frame.data.byteOffset,
              frame.data.byteLength
            )
          )
        }
      })

      prewarmElevenLabs(agent.voice_id)

      this.ws.send(JSON.stringify({ type: "ready" }))

      // ── Transcript Handling ──────────────
      dgLive.on(
        LiveTranscriptionEvents.Transcript,
        async (data) => {
          const text =
            data.channel?.alternatives?.[0]?.transcript?.trim()

          if (!text || !data.is_final) return

          this.ws.send(
            JSON.stringify({
              type: "transcript",
              speaker: "user",
              text,
            })
          )

          insertTranscript({
            call_id: callId,
            user_id: userId,
            speaker: "user",
            text,
            is_final: true,
            sequence_number: ++this.sequenceNumber,
          })

          player.cancel()
          const myGenId = player.genId

          const stream = await streamChat(
            agent.system_prompt,
            text
          )

          let fullResponse = ""
          let buffer = ""

          for await (const part of stream) {
            if (player.genId !== myGenId) break

            const token =
              part.choices[0]?.delta?.content || ""
            if (!token) continue

            fullResponse += token
            buffer += token

            let extracted
            while (
              (extracted = extractNextChunk(buffer))
            ) {
              buffer = extracted.rest

              const frames =
                await fetchAndDecodeAudio(
                  extracted.chunk,
                  agent.voice_id
                )

              player.push(frames, myGenId)
            }
          }

          if (buffer.trim()) {
            const frames =
              await fetchAndDecodeAudio(
                buffer,
                agent.voice_id
              )
            player.push(frames, myGenId)
          }

          player.endGeneration(myGenId)

          insertTranscript({
            call_id: callId,
            user_id: userId,
            speaker: "agent",
            text: fullResponse,
            is_final: true,
            sequence_number: ++this.sequenceNumber,
          })

          this.ws.send(
            JSON.stringify({
              type: "transcript",
              speaker: "agent",
              text: fullResponse,
            })
          )
        }
      )

      this.ws.on("close", () => {
        player.cancel()
        player.stop()
        room.disconnect()
        dgLive.finish()
      })
    } catch (err) {
      console.error("Session error:", err)
      this.ws.close()
    }
  }
}

module.exports = { SessionManager }