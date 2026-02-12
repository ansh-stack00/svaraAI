"use client";
import axios from "axios";
import { useState , useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2, Play } from "lucide-react";

export function AgentForm({ initialData, onSuccess, onCancel }){

    const [loading , setLoading] = useState(false);
    const [loadingVoices, setLoadingVoices] = useState(true);
    const [error, setError] = useState("");
    const [voices, setVoices] = useState([]);
    const [playingPreview, setPlayingPreview] = useState(null);

    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        system_prompt: initialData?.system_prompt || "",
        voice_id: initialData?.voice_id || ""

    })

    useEffect(() => {
        fetchVoices();
    }, [])

    async function fetchVoices(){
        try {
            const response = await axios.get("/api/voices");
            setVoices(response.data.voices || []);

            if(response.data.voices.length > 0 && !initialData){
                setFormData((prev) => ({ ...prev, voice_id: response.data.voices[0].id }))
            }
            
        } catch (error) {
            setError("Failed to fetch voices");
        } finally {
            setLoadingVoices(false);
        }

    }

    async function handleSubmit(e){

        e.preventDefault();
        setLoading(true);
        setError("");

        try{
            const url = initialData ? `/api/agents/${initialData.id}` : "/api/agents";
            const method = initialData?.id ? "put" : "post";

            const response = await axios({
                method,
                url,
                headers: {
                    "Content-Type": "application/json"
                },
                data: formData
            })

            if(response.status === 200 || response.status === 201){
                onSuccess();
            }

        } catch (error) {
            setError(error.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    }


    return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-100 text-red-600 text-sm rounded">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div>
        <Label>Agent Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          required
        />
      </div>

      <div>
        <Label>System Prompt *</Label>
        <Textarea
          value={formData.system_prompt}
          onChange={(e) =>
            setFormData({ ...formData, system_prompt: e.target.value })
          }
          required
          className="min-h-[120px]"
        />
      </div>

      <div>
        <Label>Voice *</Label>

        {loadingVoices ? (
          <Loader2 className="animate-spin w-4 h-4" />
        ) : (
          <select
            className="w-full border rounded p-2"
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
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : initialData ? "Update Agent" : "Create Agent"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}