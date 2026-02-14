"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, Link as LinkIcon, Type } from "lucide-react";

export function KnowledgeSourceCard({ source, onDelete }) {

  function getIcon() {
    if (source.type === "url") return <LinkIcon className="w-5 h-5 text-blue-400" />;
    if (source.type === "pdf") return <FileText className="w-5 h-5 text-red-400" />;
    if (source.type === "text") return <Type className="w-5 h-5 text-purple-400" />;
    return <FileText className="w-5 h-5 text-gray-400" />;
  }

  return (
    <Card className="p-5 bg-slate-800 border border-slate-700 rounded-xl hover:border-accent/40 hover:shadow-lg transition-all duration-200">
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className="p-3 bg-slate-700 rounded-xl">
            {getIcon()}
          </div>

          <div>
            <h4 className="text-white font-semibold text-lg">
              {source.name}
            </h4>
            <p className="text-xs text-slate-400 capitalize mt-1">
              {source.type}
            </p>
          </div>
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => onDelete(source.id)}
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </Button>
      </div>
    </Card>
  );
}
