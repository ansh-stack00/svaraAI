const { decodeAudioToFrames } = require("../audio/audioDecoder")

async function fetchAndDecodeAudio(text, voiceId, onLatency) {
  const fetchStart = Date.now()

  const response = await fetch(
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
        output_format: "mp3_22050_32",
      }),
    }
  )

  onLatency?.("fetch", Date.now() - fetchStart)

  return decodeAudioToFrames(response, onLatency)
}

function prewarmElevenLabs(voiceId) {
  fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: " ",
      model_id: "eleven_flash_v2_5",
    }),
  }).catch(() => {})
}

module.exports = { fetchAndDecodeAudio, prewarmElevenLabs }