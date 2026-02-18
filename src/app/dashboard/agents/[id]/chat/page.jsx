'use client';

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { ChatWindow } from "@/components/chat/chatWindow";
import { ChatInput } from "@/components/chat/chatInput";

export default function ChatPage() {
  const params = useParams();
  const agentId = params.id;
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  async function sendMessage(text) {
    const newMessage = { role: "user", content: text };
    setMessages(prev => [...prev, newMessage]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: agentId,
        query: text,
      }),
    });

    const data = await res.json();

    const assistantMessage = {
      role: "assistant",
      content: data.response,
    };

    setMessages(prev => [...prev, assistantMessage]);
  }

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6 py-10">
      
      <div className="w-full max-w-4xl h-[80vh] flex flex-col 
        bg-white/5 backdrop-blur-xl 
        border border-white/10 
        rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
          <h1 className="text-lg font-semibold text-white">
            AI Assistant
          </h1>
          <p className="text-sm text-slate-400">
            Ask anything and get instant responses
          </p>
        </div>

        {/* conversation window  */}
        <div className="flex-1 max-w-4xl  px-6 py-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Start a conversation 👋
            </div>
          )}

          <ChatWindow messages={messages} />
          <div ref={bottomRef} />
        </div>

        {/* Input  box*/}
        <div className="border-t border-white/10 bg-white/5 p-4">
          <ChatInput onSend={sendMessage} />
        </div>

      </div>
    </div>
  );
}
