"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Edit2, Trash2 } from "lucide-react";

export function AgentCard({ agent, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${agent.name}"?`)) return;
    setDeleting(true);
    await onDelete(agent.id);
    setDeleting(false);
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{agent.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {agent.system_prompt}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={() => onEdit(agent)}>
          <Edit2 className="w-4 h-4 mr-1" />
          Edit
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>
    </Card>
  );
}
