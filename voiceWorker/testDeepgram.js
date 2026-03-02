require("dotenv").config()
const WebSocket = require("ws")

console.log("API Key:", process.env.DEEPGRAM_API_KEY ? "Found" : "MISSING")

const ws = new WebSocket(
  "wss://api.deepgram.com/v1/listen?model=nova-2&encoding=linear16&sample_rate=48000",
  { headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` } }
)

ws.on("open", () => {
  console.log("✅ WebSocket connected successfully!")
  ws.close()
})

ws.on("error", (err) => {
  console.log("❌ WebSocket error:", err.message)
  console.log("Error code:", err.code)
})

ws.on("close", (code, reason) => {
  console.log("Closed with code:", code, "reason:", reason.toString())
})

setTimeout(() => {
  console.log("Timed out — no connection after 10s")
  process.exit(1)
}, 10000)