'use client';

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { ChatInput } from "@/components/chat/chatInput";

export default function ChatPage() {
  const params = useParams();
  const agentId = params.id;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  const bottomRef = useRef(null);

 
  useEffect(() => {
    if (!agentId) return;

    async function createConversation() {
      try {
        const res = await fetch("/api/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("Failed to create conversation", data);
          return;
        }

        setConversationId(data.conversationId);
      } catch (err) {
        console.error("Conversation creation error:", err);
      }
    }

    createConversation();
  }, [agentId]);

  async function sendMessage(text) {
    if (!conversationId || loading) return;

    const userMessage = { role: "user", content: text };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          conversationId,   
          query: text,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Chat error:", data);
        setLoading(false);
        return;
      }

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (err) {
      console.error("Send message error:", err);
    }

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
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "#1a1a1a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              🤖
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                AI Assistant
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#aaa" }}>
                Ask anything and get instant responses
              </p>
            </div>
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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              flexDirection: "column",
              gap: 10
            }}>
              <span style={{ fontSize: 36 }}>👋</span>
              <p style={{ color: "#bbb", fontSize: 13 }}>
                {conversationId ? "Start a conversation" : "Initializing chat..."}
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === "user";

            return (
              <div key={i} style={{
                display: "flex",
                flexDirection: isUser ? "row-reverse" : "row",
                gap: 10
              }}>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: isUser ? "#6366f1" : "#1a1a1a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {isUser ? "👤" : "🤖"}
                </div>

                <div style={{
                  background: isUser ? "#1a1a1a" : "#f4f4f2",
                  color: isUser ? "#fff" : "#1a1a1a",
                  padding: "10px 14px",
                  borderRadius: 12,
                  maxWidth: "70%"
                }}>
                  {msg.content}
                </div>
              </div>
            );
          })}

          {loading && (
            <div>🤖 Typing...</div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          borderTop: "1px solid #f0f0ee",
          padding: "14px 16px"
        }}>
          <ChatInput
            onSend={sendMessage}
            disabled={loading || !conversationId}  
          />
        </div>

      </div>
    </div>
  );
}