"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Link as LinkIcon, FileText, Type } from "lucide-react";


export function KnowledgeUploadForm({ agentId, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    content: "",
    url: "",
    file: null ,
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append("agent_id", agentId);
      data.append("type", type);
      data.append("name", formData.name);

      if (type === "text") data.append("content", formData.content);
      if (type === "url") data.append("url", formData.url);
      if (type === "pdf" && formData.file) data.append("file", formData.file);

      const res = await fetch("/api/knowledge", {
        method: "POST",
        body: data,
      });

      if (!res.ok) throw new Error("Upload failed");

      onSuccess();
    } catch (err) {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
      <div className="mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Add Knowledge Source
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Upload content or connect external resources
          </p>
        </div>
    <form onSubmit={handleSubmit} className="space-y-6">

      <Input
        placeholder="Knowledge Name (e.g. React Docs)"
        value={formData.name}
        onChange={(e) =>
          setFormData({ ...formData, name: e.target.value })
        }
        required
        className="bg-secondary border-border/40"
      />

      {/* Type Selector */}
      <div className="flex gap-2">
        {["text", "url", "pdf"].map((option) => (
          <Button
            key={option}
            type="button"
            variant={type === option ? "default" : "outline"}
            onClick={() => setType(option)}
            className="flex-1 capitalize "
          >
            {option === "text" && <Type className="w-4 h-4 mr-2" />}
            {option === "url" && <LinkIcon className="w-4 h-4 mr-2" />}
            {option === "pdf" && <FileText className="w-4 h-4 mr-2" />}
            {option}
          </Button>
        ))}
      </div>

      {type === "text" && (
        <Textarea
          placeholder="Paste your content here..."
          className="min-h-[200px] bg-secondary border-border/40"
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          required
        />
      )}

      {type === "url" && (
        <Input
          placeholder="https://example.com/docs"
          className="bg-secondary border-border/40"
          value={formData.url}
          onChange={(e) =>
            setFormData({ ...formData, url: e.target.value })
          }
          required
        />
      )}

      {type === "pdf" && (
        <div className="border border-dashed border-border/40 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) =>
              setFormData({
                ...formData,
                file: e.target.files?.[0] || null,
              })
            }
          />
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-accent hover:bg-accent/90 text-black "
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2 " />
              Upload Knowledge
            </>
          )}
        </Button>

        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
    </div>
  );
}
