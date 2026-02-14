"use client";

import axios from "axios";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2 } from "lucide-react";

export function AgentForm({ initialData, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [error, setError] = useState("");
  const [voices, setVoices] = useState([]);

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
      const response = await axios.get("/api/voices");
      const voiceList = response.data.voices || [];
      setVoices(voiceList);

      if (voiceList.length > 0 && !initialData) {
        setFormData((prev) => ({
          ...prev,
          voice_id: voiceList[0].id,
        }));
      }
    } catch (err) {
      setError("Failed to fetch voices. Check ElevenLabs API key.");
    } finally {
      setLoadingVoices(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = initialData
        ? `/api/agents/${initialData.id}`
        : "/api/agents";

      const method = initialData?.id ? "put" : "post";

      const response = await axios({
        method,
        url,
        data: formData,
      });

      if (response.status === 200 || response.status === 201) {
        onSuccess();
      }
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6  p-6 backdrop-blur-lg shadow-xl"
    >
      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/30">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Agent Name */}
      <div className="space-y-2">
        <Label className="text-slate-700 font-medium">
          Agent Name 
        </Label>
        <Input
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          placeholder="e.g, Customer Support Bot"
          required
          className=" "
        />
      </div>

      {/* System Prompt */}
      <div className="space-y-2">
        <Label className="text-slate-700 font-medium">
          System Prompt 
        </Label>
        <Textarea
          value={formData.system_prompt}
          onChange={(e) =>
            setFormData({
              ...formData,
              system_prompt: e.target.value,
            })
          }
          placeholder="Describe how this agent should behave..."
          required
          className="min-h-[120px] resize-none"
        />
        <p className="text-xs text-slate-400">
          This defines your AI’s behavior and personality.
        </p>
      </div>

      {/* Voice Selector */}
      <div className="space-y-2">
        <Label className="text-slate-700 font-medium">
          Voice 
        </Label>

        {loadingVoices ? (
          <div className="flex items-center gap-2 p-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading voices...</span>
          </div>
        ) : (
          <select
            className="w-full bg-slate-700 border text-white rounded-lg p-2.5 "
            value={formData.voice_id}
            onChange={(e) =>
              setFormData({
                ...formData,
                voice_id: e.target.value,
              })
            }
            required
          >
            <option value="">Select a voice...</option>
            {voices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-400 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/40 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : initialData ? (
            "Update Agent"
          ) : (
            "Create Agent"
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 border-slate-600 text-slate-700 bg-slate-100 hover:bg-slate-300"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
