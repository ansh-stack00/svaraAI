'use client'

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { MicOff } from 'lucide-react'

export function ChatInput({ onSend }) {
  const [text, setText] = useState("")
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setIsListening(true)
      console.log("Voice recognition started")
    }

    recognition.onresult = (event) => {
      const transcript =
        event.results[event.resultIndex][0].transcript
      setText(transcript)
      console.log("You said:", transcript)
    }

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
  }, [])

  function handleVoice() {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
  }

  function handleSend() {
    if (!text.trim()) return
    onSend(text)
    setText("")
  }

  return (
    <div className="flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 border rounded-lg px-3 py-2 text-gray-900 shadow-2xl"
        placeholder="Ask something..."
      />

      <Button
        type="button"
        variant="outline"
        onClick={handleVoice}
      >
        {isListening ? "🎙️ Listening..." : <MicOff/>}
      </Button>

      <Button onClick={handleSend}>
        Send
      </Button>
    </div>
  )
}