const { AccessToken } = require("livekit-server-sdk")
const {
  Room,
  RoomEvent,
  AudioSource,
  LocalAudioTrack,
  TrackSource,
  AudioStream,
} = require("@livekit/rtc-node")

async function createLiveKitSession(roomName) {
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: "agent-bot", ttl: "10m" }
  )

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  })

  const jwt = await token.toJwt()

  const room = new Room()
  await room.connect(process.env.LIVEKIT_URL, jwt)

  const audioSource = new AudioSource(48000, 1)
  const audioTrack = LocalAudioTrack.createAudioTrack(
    "agent-voice",
    audioSource
  )

  await room.localParticipant.publishTrack(audioTrack, {
    name: "agent-voice",
    source: TrackSource.SOURCE_MICROPHONE,
  })

  return {
    room,
    audioSource,
    audioTrack,
  }
}

function attachIncomingAudio(room, onFrame) {
  room.on(RoomEvent.TrackSubscribed, async (track, _pub, participant) => {
    if (track.kind !== 1 || participant.identity === "agent-bot") return

    const stream = new AudioStream(track)

    try {
      for await (const frame of stream) {
        onFrame(frame)
      }
    } catch (err) {
      if (!err.message?.includes("closed")) {
        console.error("LiveKit stream error:", err)
      }
    }
  })
}

module.exports = {
  createLiveKitSession,
  attachIncomingAudio,
}