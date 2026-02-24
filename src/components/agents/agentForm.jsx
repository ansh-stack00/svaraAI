"use client";

import axios from "axios";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export function AgentForm({ initialData, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState([]);
  const [loadingVoices, setLoadingVoices] = useState(true);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    system_prompt: initialData?.system_prompt || "",
    voice_id: initialData?.voice_id || "",
  });

  useEffect(() => {
    fetchVoices();
  }, []);

  async function fetchVoices() {
    try {
      const res = await axios.get("/api/voices");
      const voiceList = res.data.voices || [];
      setVoices(voiceList);

      if (voiceList.length > 0 && !formData.voice_id) {
        setFormData((prev) => ({
          ...prev,
          voice_id: voiceList[0].id,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVoices(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const method = initialData?.id ? "put" : "post";
      const url = initialData?.id
        ? `/api/agents/${initialData.id}`
        : "/api/agents";

      await axios({ method, url, data: formData });
      onSuccess();
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label className="text-gray-700">Agent Name</Label>
        <Input
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          required
        />
      </div>

      <div>
        <Label className="text-gray-700 m-1.5">System Prompt</Label>
        <Textarea
          value={formData.system_prompt}
          onChange={(e) =>
            setFormData({ ...formData, system_prompt: e.target.value })
          }
          required
          className="min-h-[120px] max-h-[300px] overflow-y-auto resize-none field-sizing-fixed "
        />
      </div>

      <div>
        <Label className="text-white">Voice</Label>

        {loadingVoices ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading voices...
          </div>
        ) : (
          <select
            className="w-full bg-slate-800 text-white p-2 rounded"
            value={formData.voice_id}
            onChange={(e) =>
              setFormData({ ...formData, voice_id: e.target.value })
            }
            required
          >
            {voices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : initialData?.id ? "Update" : "Create"}
        </Button>

        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}