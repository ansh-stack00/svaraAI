require("dotenv").config()
const http = require("http")
const WebSocket = require("ws")
const { SessionManager } = require("./session/sessionManager")

const server = http.createServer()
const wss = new WebSocket.Server({ server })

wss.on("connection", (ws, req) => {
  const session = new SessionManager(ws, req)
  session.start().catch(console.error)
})

server.listen(8080, () => {
  console.log("Voice WebRTC Server running on port 8080")
})