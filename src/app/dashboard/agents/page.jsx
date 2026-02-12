"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AgentForm } from "@/components/agents/agentForm";
import { AgentCard } from "@/components/agents/agentCard";
import { Plus, Search, Loader2, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAgents(agents);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredAgents(
        agents.filter(
          (agent) =>
            agent.name.toLowerCase().includes(query) ||
            agent.system_prompt.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, agents]);

  async function fetchAgents() {
    try {
      setLoading(true);

        const response = await fetch("/api/agents");
        if (!response) {
            throw new Error("Failed to fetch agents");
        }

        const data = await response.json();
        setAgents(data.agents || []);

    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAgent(agentId) {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: "DELETE",
      });

      if (!response) {
        throw new Error("Failed to delete agent");
      }

      // safer state update
      setAgents((prev) => prev.filter((a) => a.id !== agentId));

    } catch (error) {
      console.error("Error deleting agent:", error);
      alert("Failed to delete agent. Please try again.");
    }
  }

  function handleEditAgent(agent) {
    setEditingAgent(agent);
  }

  function handleFormSuccess() {
    setShowCreateDialog(false);
    setEditingAgent(null);
    fetchAgents();
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Agents</h1>
          <p className="text-gray-600 mt-1">
            Create and manage your AI voice agents
          </p>
        </div>

        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Agent
        </Button>
      </div>

      {/* Search */}
      {agents.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      )}

      {/* Empty State */}
      {!loading && agents.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed">
          <Bot className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
          <Button onClick={() => setShowCreateDialog(true)}>
            Create Your First Agent
          </Button>
        </div>
      )}

      {/* No Search Results */}
      {!loading && agents.length > 0 && filteredAgents.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Search className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p>No agents found</p>
        </div>
      )}

      {/* Agents Grid */}
      {!loading && filteredAgents.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={handleEditAgent}
              onDelete={handleDeleteAgent}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
          </DialogHeader>

          <AgentForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingAgent} onOpenChange={() => setEditingAgent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
          </DialogHeader>

          {editingAgent && (
            <AgentForm
              initialData={editingAgent}
              onSuccess={handleFormSuccess}
              onCancel={() => setEditingAgent(null)}
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
