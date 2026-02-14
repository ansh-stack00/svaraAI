"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AgentForm } from "@/components/agents/agentForm";
import { AgentCard } from "@/components/agents/agentCard";
import { Plus, Search, Loader2, Bot, Sparkles } from "lucide-react";
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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-100 mb-2">
                Your Agents
              </h1>
              <p className="text-lg text-muted-foreground">
                Create and manage your AI agents with knowledge base support
              </p>
            </div>

            <Button 
              onClick={() => setShowCreateDialog(true)} 
              className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12 px-6 rounded-lg"
            >
              <Plus className="w-5 h-5" />
              Create Agent
            </Button>
          </div>

          {/* Search Bar */}
          {agents.length > 0 && (
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search agents by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-secondary border-border/50 focus:border-accent/50 h-11 rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
            <p className="text-muted-foreground">Loading your agents...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && agents.length === 0 && (
          <div className="text-center py-20">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-accent/10 rounded-full">
                <Bot className="w-12 h-12 text-accent" />
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-3">
              No agents yet
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Get started by creating your first AI agent. You'll be able to upload knowledge bases (PDFs, TXT files, URLs) and customize its behavior.
            </p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-11 px-6 rounded-lg"
            >
              Create Your First Agent
            </Button>
          </div>
        )}

        {/* No Search Results */}
        {!loading && agents.length > 0 && filteredAgents.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg text-muted-foreground">No agents found matching your search</p>
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
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Agent</DialogTitle>
          </DialogHeader>
          <AgentForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingAgent} onOpenChange={() => setEditingAgent(null)}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Agent</DialogTitle>
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
    </main>
  );
}
