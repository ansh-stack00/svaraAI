'use client';

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { ChatWindow } from "@/components/chat/chatWindow";
import { ChatInput } from "@/components/chat/chatInput";

export default function ChatPage() {
  const params = useParams();
  const agentId = params.id;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  async function sendMessage(text) {
    const newMessage = { role: "user", content: text };
    setMessages(prev => [...prev, newMessage]);
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, query: text }),
    });

    const data = await res.json();
    setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    setLoading(false);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{
      fontFamily: "'Geist', 'DM Mono', monospace",
      background: "#f9f9f8",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 24px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 780,
        background: "#fff",
        border: "1px solid #e5e5e3",
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "82vh",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)"
      }}>

        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid #f0f0ee",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fff"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "#1a1a1a",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16
            }}>🤖</div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>AI Assistant</p>
              <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>Ask anything and get instant responses</p>
            </div>
          </div>

          {/* Online indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#aaa" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            Online
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 18
        }}>
          {messages.length === 0 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: "100%", flexDirection: "column", gap: 10
            }}>
              <span style={{ fontSize: 36 }}>👋</span>
              <p style={{ color: "#bbb", fontSize: 13, margin: 0 }}>Start a conversation</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            return (
              <div key={i} style={{
                display: "flex",
                flexDirection: isUser ? "row-reverse" : "row",
                alignItems: "flex-start",
                gap: 10
              }}>
                {/* Avatar */}
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  background: isUser ? "#6366f1" : "#1a1a1a",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13
                }}>
                  {isUser ? "👤" : "🤖"}
                </div>

                {/* Bubble */}
                <div style={{ maxWidth: "72%" }}>
                  <p style={{
                    fontSize: 11, color: "#aaa", marginBottom: 4,
                    textAlign: isUser ? "right" : "left"
                  }}>
                    {isUser ? "You" : "Assistant"}
                  </p>
                  <div style={{
                    background: isUser ? "#1a1a1a" : "#f4f4f2",
                    color: isUser ? "#fff" : "#1a1a1a",
                    padding: "10px 14px",
                    borderRadius: isUser ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                    fontSize: 13, lineHeight: 1.65
                  }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "#1a1a1a",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13
              }}>🤖</div>
              <div style={{
                background: "#f4f4f2", padding: "10px 16px",
                borderRadius: "4px 12px 12px 12px", display: "flex", gap: 4, alignItems: "center"
              }}>
                {[0, 1, 2].map(n => (
                  <span key={n} style={{
                    width: 6, height: 6, borderRadius: "50%", background: "#aaa",
                    display: "inline-block",
                    animation: "bounce 1.2s infinite",
                    animationDelay: `${n * 0.2}s`
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ borderTop: "1px solid #f0f0ee", padding: "14px 16px", background: "#fff" }}>
          <ChatInput onSend={sendMessage} disabled={loading} />
        </div>

      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}