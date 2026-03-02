class LatencyTracker {
  constructor() {
    this.log = []
  }

  record(label, ms, extra = {}) {
    this.log.push({ label, ms, ...extra, ts: Date.now() })
    const extraStr = Object.keys(extra).length
      ? " " + JSON.stringify(extra)
      : ""
    console.log(`[LAT] ${label}: ${ms}ms${extraStr}`)
  }

  summary() {
    if (!this.log.length) return
    console.log("\nLATENCY SUMMARY ")
    const groups = {}
    for (const e of this.log) {
      if (!groups[e.label]) groups[e.label] = []
      groups[e.label].push(e.ms)
    }
    for (const [label, vals] of Object.entries(groups)) {
      const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
      const min = Math.min(...vals)
      const max = Math.max(...vals)
      const p95 =
        vals.sort((a, b) => a - b)[Math.floor(vals.length * 0.95)] ?? max

      console.log(
        `${label.padEnd(32)}: avg=${avg}ms min=${min}ms max=${max}ms p95=${p95}ms`
      )
    }
  }
}

module.exports = { LatencyTracker }