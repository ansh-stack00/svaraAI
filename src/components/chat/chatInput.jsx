'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ChatInput({ onSend }) {
  const [text, setText] = useState("");

  function handleSend() {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  }

  return (
    <div className="flex gap-2 outline-blue-900 ">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 border rounded-lg px-3 py-2 text-gray-900 shadow-2xl "
        placeholder="Ask something..."
      />
      <Button onClick={handleSend} >Send</Button>
    </div>
  );
}
