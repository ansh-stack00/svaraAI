'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VoiceCallInterface } from '@/components/voice/Interface';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';


export default function AgentCallPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgent();
  }, [agentId]);

  async function fetchAgent() {
    try {
      setLoading(true);
      const response = await fetch(`/api/agents/${agentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch agent');
      }
      
      const data = await response.json();
      setAgent(data.agent);
    } catch (error) {
      console.error('Error fetching agent:', error);
      router.push('/dashboard/agents');
    } finally {
      setLoading(false);
    }
  }

  function handleCallEnd() {
    router.push('/dashboard/agents');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Agent not found</p>
        <Link href="/dashboard/agents">
          <Button variant="outline" className="mt-4">
            Back to Agents
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/agents">
          <Button variant="ghost" size="sm" className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Agents
          </Button>
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Agent</h1>
          {agent.description && (
            <p className="text-gray-600 mt-1">{agent.description}</p>
          )}
        </div>
      </div>

      {/* Voice Call Interface */}
      <VoiceCallInterface
        agentId={agent.id}
        agentName={agent.name}
        onCallEnd={handleCallEnd}
      />
    </div>
  );
}