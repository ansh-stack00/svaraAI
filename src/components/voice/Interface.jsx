'use client'

import { useState, useRef } from 'react'
import { Room, RoomEvent } from 'livekit-client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Loader2,
  Circle,
  Copy,
  Check,
} from 'lucide-react'

export function VoiceCallInterface({
  agentId,
  agentName,
  onCallEnd,
}) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [callId, setCallId] = useState(null)
  const [transcript, setTranscript] = useState([])
  const [error, setError] = useState('')
  const [callDuration, setCallDuration] = useState(0)
  const [copied, setCopied] = useState(false)

  const roomRef = useRef(null)
  const wsRef = useRef(null)
  const audioElementsRef = useRef([])
  const durationIntervalRef = useRef(null)
  const transcriptEndRef = useRef(null)

  /* ========================================= */
  /* 🔊 ATTACH AUDIO                           */
  /* ========================================= */

  function attachAudio(track, identity) {
    const audioEl = track.attach()
    audioEl.autoplay = true
    audioEl.playsInline = true
    audioEl.volume = 1.0
    audioEl.style.display = 'none'

    document.body.appendChild(audioEl)
    audioElementsRef.current.push(audioEl)

    audioEl.play().catch(() => {
      console.warn('Autoplay blocked')
    })
  }

  /* ========================================= */
  /* 🚀 START CALL                             */
  /* ========================================= */

  async function startCall() {
    try {
      setIsConnecting(true)
      setError('')
      setCallDuration(0)
      setTranscript([])

      // Unlock mic + audio context
      await navigator.mediaDevices.getUserMedia({ audio: true })
      const AudioCtx =
        window.AudioContext
      if (AudioCtx) {
        const ctx = new AudioCtx()
        await ctx.resume()
      }

      // Create call
      const callResponse = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId }),
      })

      const { call_id, room_name, agent } = await callResponse.json()
      setCallId(call_id)

      // Get LiveKit token
      const tokenResponse = await fetch('/api/livekitToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_name,
          participant_name: `user-${Date.now()}`,
        }),
      })

      const { token, ws_url } = await tokenResponse.json()

      const room = new Room({ autoSubscribe: true })
      roomRef.current = room

      // Track subscriptions
      room.on(
        RoomEvent.TrackSubscribed,
        (track, publication, participant) => {
          if (track.kind === 'audio') {
            attachAudio(track, participant.identity)
          }
        }
      )

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        participant.trackPublications.forEach((pub) => {
          if (pub.track && pub.kind === 'audio') {
            attachAudio(pub.track, participant.identity)
          }
        })
      })

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach()
      })

      room.on(RoomEvent.Connected, async () => {
        setIsConnected(true)
        setIsConnecting(false)

        await room.localParticipant.setMicrophoneEnabled(true)

        // Start duration timer
        durationIntervalRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1)
        }, 1000)

        // Start voice WS
        setupVoicePipeline(call_id, agent.id, room_name)
      })

      await room.connect(ws_url, token)
    } catch (err) {
      console.error(err)
      setError('Failed to start call. Please try again.')
      setIsConnecting(false)
    }
  }

  /* ========================================= */
  /* 🔌 VOICE SERVER                           */
  /* ========================================= */

  function setupVoicePipeline(callId,agentID,roomName) {
    const ws = new WebSocket(
      `ws://localhost:8080?call_id=${callId}&agent_id=${agentID}&room_name=${roomName}`
    )

    wsRef.current = ws

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)

      if (message.type === 'transcript') {
        setTranscript((prev) => [
          ...prev,
          { speaker: message.speaker, text: message.text },
        ])

        setTimeout(() => {
          transcriptEndRef.current?.scrollIntoView({
            behavior: 'smooth',
          })
        }, 0)
      }
    }
  }

  /* ========================================= */
  /* 📞 END CALL                               */
  /* ========================================= */

  async function endCall() {
    try {
      if (callId) {
        await fetch('/api/calls', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ call_id: callId }),
        })
      }

      cleanup()
      onCallEnd?.()
    } catch (err) {
      console.error(err)
    }
  }

  function cleanup() {
    if (roomRef.current) {
      roomRef.current.disconnect()
      roomRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    audioElementsRef.current.forEach((el) => {
      el.pause()
      el.remove()
    })
    audioElementsRef.current = []

    setIsConnected(false)
  }

  /* ========================================= */
  /* 🎤 MUTE                                   */
  /* ========================================= */

  async function toggleMute() {
    if (!roomRef.current) return
    const newMuted = !isMuted
    await roomRef.current.localParticipant.setMicrophoneEnabled(!newMuted)
    setIsMuted(newMuted)
  }

  /* ========================================= */
  /* 📋 COPY CALL ID                           */
  /* ========================================= */

  function copyCallId() {
    if (!callId) return
    navigator.clipboard.writeText(callId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /* ========================================= */
  /* ⏱ FORMAT TIME                             */
  /* ========================================= */

  function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  /* ========================================= */
  /* UI                                        */
  /* ========================================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-8">
            <div className="flex flex-col items-center gap-8">

              <div className="relative">
                <div
                  className={`w-40 h-40 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl transition-all ${
                    isConnected ? 'ring-4 ring-primary/30 animate-pulse' : ''
                  }`}
                >
                  <Phone className="w-20 h-20 text-white" />
                </div>

                {isConnected && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-3 shadow-lg animate-pulse">
                    <Circle className="w-4 h-4 text-white fill-white" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">{agentName}</h1>
                <p className="text-sm text-muted-foreground">
                  {!isConnected && !isConnecting && 'Ready to connect'}
                  {isConnecting && 'Connecting...'}
                  {isConnected &&
                    `Connected • ${formatDuration(callDuration)}`}
                </p>
              </div>

              {isConnected && callId && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-lg">
                  <span className="text-xs font-mono">
                    Call ID: {callId.slice(0, 8)}...
                  </span>
                  <button onClick={copyCallId}>
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}

              <div className="flex gap-4 flex-wrap justify-center">
                {!isConnected && !isConnecting && (
                  <Button onClick={startCall}>
                    <Phone className="w-5 h-5 mr-2" />
                    Start Call
                  </Button>
                )}

                {isConnecting && (
                  <Button disabled>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Connecting...
                  </Button>
                )}

                {isConnected && (
                  <>
                    <Button
                      onClick={toggleMute}
                      variant={isMuted ? 'destructive' : 'outline'}
                    >
                      {isMuted ? <MicOff /> : <Mic />}
                      {isMuted ? 'Unmute' : 'Mute'}
                    </Button>

                    <Button variant="destructive" onClick={endCall}>
                      <PhoneOff className="mr-2" />
                      End Call
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {isConnected && (
          <Card className="shadow-lg p-6">
            <h2 className="font-semibold mb-4">Live Transcript</h2>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {transcript.map((t, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg ${
                    t.speaker === 'user'
                      ? 'bg-primary/10 ml-8'
                      : 'bg-accent/10 mr-8'
                  }`}
                >
                  <span className="text-xs font-semibold">
                    {t.speaker === 'user' ? 'You' : agentName}
                  </span>
                  <p className="text-sm">{t.text}</p>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </Card>
        )}

        {error && (
          <Card className="border-destructive/50 bg-destructive/5 p-4">
            <p className="text-destructive text-sm">{error}</p>
          </Card>
        )}
      </div>
    </div>
  )
}
