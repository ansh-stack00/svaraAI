"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Edit2, Trash2, Zap } from "lucide-react";

export function AgentCard({ agent, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const [hovering, setHovering] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${agent.name}"?`)) return;
    setDeleting(true);
    await onDelete(agent.id);
    setDeleting(false);
  }

  return (
    <Card className="relative p-6 bg-slate-800/50 border border-slate-700 backdrop-blur-lg hover:border-blue-500/40 transition-all duration-300 shadow-xl hover:shadow-blue-500/20">

  {/* Icon + Name */}
  <div className="flex items-center gap-3 mb-4">
    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
      <Bot className="w-5 h-5 text-white" />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-white">
        {agent.name}
      </h3>
      <p className="text-xs text-slate-400">
        AI Voice Agent
      </p>
    </div>
  </div>

  {/* Prompt */}
  <p className="text-sm text-slate-400 line-clamp-3 mb-6">
    {agent.system_prompt}
  </p>

  {/* Actions */}
  <div className="flex gap-2">
    <Button
      size="sm"
      onClick={() => onEdit(agent)}
      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
    >
      Edit
    </Button>

    <Button
      size="sm"
      variant="outline"
      onClick={handleDelete}
      disabled={deleting}
      className="border-red-500 text-red-400 hover:bg-red-500/10"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  </div>
</Card>

  );
}
