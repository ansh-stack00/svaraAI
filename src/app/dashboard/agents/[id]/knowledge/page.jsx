"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { KnowledgeUploadForm } from "@/components/knowledge/knowledgeUploadForm";
import { KnowledgeSourceCard } from "@/components/knowledge/KnowledgeCard";
import { Button } from "@/components/ui/button";
import { Plus, Brain } from "lucide-react";

export default function AgentKnowledgePage() {
  const { id } = useParams();
  const [sources, setSources] = useState([]);
  const [showUpload, setShowUpload] = useState(false);

  async function fetchSources() {
    const res = await fetch(`/api/knowledge?agent_id=${id}`);
    const data = await res.json();
    setSources(data.sources || []);
  }

  useEffect(() => {
    fetchSources();
  }, []);

  async function handleDelete(id) {
    await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    fetchSources();
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 space-y-8">

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Brain className="w-6 h-6 text-accent" />
            Knowledge Base
          </h1>
          <p className="text-slate-400 mt-1">
            Upload documents and give your agent intelligence
          </p>
        </div>

        <Button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-accent hover:bg-accent/90 text-black"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Knowledge
        </Button>
      </div>

      {showUpload && (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <KnowledgeUploadForm
            agentId={id}
            onSuccess={() => {
              setShowUpload(false);
              fetchSources();
            }}
            onCancel={() => setShowUpload(false)}
          />
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((source) => (
          <KnowledgeSourceCard
            key={source.id}
            source={source}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
