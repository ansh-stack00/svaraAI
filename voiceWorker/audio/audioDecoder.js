const { spawn } = require("child_process")
const { Readable } = require("stream")
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg")

// MP3 → PCM 16bit → Int16Array frames
function decodeAudioToFrames(response, onLatency) {
  const SAMPLE_RATE = 48000
  const FRAME_SIZE = 960
  const FRAME_BYTES = FRAME_SIZE * 2

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegInstaller.path, [
      "-f", "mp3",
      "-i", "pipe:0",
      "-f", "s16le",
      "-ar", String(SAMPLE_RATE),
      "-ac", "1",
      "pipe:1",
    ])

    const frames = []
    let pcmBuffer = Buffer.alloc(0)
    const decodeStart = Date.now()

    ffmpeg.stderr.on("data", () => {})
    ffmpeg.on("error", reject)

    ffmpeg.stdout.on("data", (chunk) => {
      pcmBuffer = Buffer.concat([pcmBuffer, chunk])

      while (pcmBuffer.length >= FRAME_BYTES) {
        const frameData = pcmBuffer.slice(0, FRAME_BYTES)
        pcmBuffer = pcmBuffer.slice(FRAME_BYTES)

        const samples = new Int16Array(FRAME_SIZE)
        samples.set(
          new Int16Array(
            frameData.buffer,
            frameData.byteOffset,
            FRAME_SIZE
          )
        )

        frames.push(samples)
      }
    })

    ffmpeg.on("close", () => {
      // Flush partial frame
      if (pcmBuffer.length >= 2) {
        const len = Math.floor(pcmBuffer.length / 2)
        const samples = new Int16Array(len)
        samples.set(
          new Int16Array(
            pcmBuffer.buffer,
            pcmBuffer.byteOffset,
            len
          )
        )
        frames.push(samples)
      }

      onLatency?.("decode", Date.now() - decodeStart)
      resolve(frames)
    })

    const nodeStream = Readable.fromWeb(response.body)
    nodeStream.pipe(ffmpeg.stdin)

    nodeStream.on("error", (err) => {
      ffmpeg.stdin.destroy()
      reject(err)
    })

    ffmpeg.stdin.on("error", (err) => {
      if (err.code !== "EPIPE") reject(err)
    })
  })
}

module.exports = { decodeAudioToFrames }