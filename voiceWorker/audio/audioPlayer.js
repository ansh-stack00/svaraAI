const { AudioFrame } = require("@livekit/rtc-node")

class AudioPlayer {
  constructor(audioSource) {
    this.audioSource = audioSource
    this.queue = []
    this.running = false
    this.genId = 0
    this._wake = null
    this._firstFrameSent = false
  }

  push(frames, genId, onFirstFrame) {
    if (genId !== this.genId) return

    for (let i = 0; i < frames.length; i++) {
      this.queue.push({
        samples: frames[i],
        genId,
        onFirstFrame: i === 0 ? onFirstFrame : null,
      })
    }

    this._wake?.()
    this._wake = null
  }

  endGeneration(genId) {
    if (genId !== this.genId) return

    this.queue.push({ end: true, genId })
    this._wake?.()
    this._wake = null
  }

  cancel() {
    this.genId++
    this.queue = []
    this._firstFrameSent = false
    this._wake?.()
    this._wake = null
  }

  async start() {
    this.running = true

    while (this.running) {
      if (!this.queue.length) {
        await new Promise((r) => (this._wake = r))
        continue
      }

      const item = this.queue.shift()
      if (!item) continue
      if (item.genId !== this.genId) continue
      if (item.end) continue

      if (item.onFirstFrame && !this._firstFrameSent) {
        this._firstFrameSent = true
        try {
          item.onFirstFrame()
        } catch (_) {}
      }

      try {
        await this.audioSource.captureFrame(
          new AudioFrame(
            item.samples,
            48000,
            1,
            item.samples.length
          )
        )
      } catch (err) {
        console.warn("captureFrame error:", err.message)
      }
    }
  }

  stop() {
    this.running = false
    this._wake?.()
    this._wake = null
  }
}

module.exports = { AudioPlayer }