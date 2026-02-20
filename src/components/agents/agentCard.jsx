"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Edit2,
  Trash2,
  Phone,
  MoreVertical,
  Brain,
  MessageSquareText
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export function AgentCard({
  agent,
  onEdit,
  onDelete,
  onCall,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Are you sure you want to delete "${agent.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      await onDelete(agent.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="relative p-6 bg-slate-800/60 border-slate-700 hover:border-purple-500/40 hover:shadow-lg transition-all duration-300 group">

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-md">
            <Bot className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-white truncate">
              {agent.name}
            </h3>

            {agent.description && (
              <p className="text-sm text-slate-400 truncate">
                {agent.description}
              </p>
            )}
          </div>
            <div className="text-xs text-slate-500 p-2">
              Created {formatDate(agent.created_at)}
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMenu(!showMenu)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-slate-700" />
          </Button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 py-1">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(agent);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-800 flex items-center gap-2 text-slate-200"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Agent
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleDelete();
                  }}
                  disabled={deleting}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-800 text-red-400 flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? "Deleting..." : "Delete Agent"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Prompt Preview */}
      <div className="mb-5">
        <p className="text-sm text-slate-400 line-clamp-2">
          {agent.system_prompt}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700  ">
        

        <div className="flex gap-2">

          {/* Knowledge Button */}
          <Link href={`/dashboard/agents/${agent.id}/knowledge`}>
            <Button
              size="sm"
              variant="outline"
              className="gap-2  text-purple-700  hover:cursor-pointer  "
            >
              <Brain className="w-3 h-3" />
              Knowledge
            </Button>
          </Link>

          {/* Call Button */}
     {/* onCall && */}     {( 
          <Link href={`/dashboard/agents/${agent.id}/call`}>
            <Button
              size="sm"
              // onClick={() => onCall(agent.id)}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Phone className="w-3 h-3" />
              Call
            </Button>
          </Link>
          )}
          <Link href={`/dashboard/agents/${agent.id}/chat`}>
            <Button
              size="sm"
              // onClick={() => onCall(agent.id)}
              className="gap-2 bg-blue-400 hover:bg-blue-700 text-white"
            >
              <MessageSquareText className="w-3 h-3" />
              chat
            </Button>
          </Link>
        </div>
        
      </div>
      
    </Card>
  );
}
