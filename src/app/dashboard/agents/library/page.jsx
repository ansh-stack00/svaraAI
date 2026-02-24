'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Heart,
  User,
  Calendar,
  Target,
  Wrench,
  MessageSquare,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useRouter } from "next/navigation"
import { AgentForm } from '@/components/agents/agentForm';
import { systemPrompts } from '@/lib/prompts';

const TEMPLATE_ICONS = {
  customer_support: Heart,
  sales: User,
  faq: MessageSquare,
  appointment: Calendar,
  lead_qualification: Target,
  technical_support: Wrench,
};

const QUICKSTART_TEMPLATES = [
  {
    id: 'customer_support',
    name: 'Customer Support Specialist',
    description:
      'Resolve product issues, answer questions, and ensure satisfying customer experiences.',
    icon: 'customer_support',
    system_prompt: systemPrompts.customer_support,
    suggested_voice_id: '21m00Tcm4TlvDq8ikWAM',
  },
  {
    id: 'lead_qualification',
    name: 'Lead Qualification Specialist',
    description:
      'Identify qualified prospects using BANT and connect them with sales.',
    icon: 'lead_qualification',
    system_prompt: systemPrompts.lead_qualification,
    suggested_voice_id: 'EXAVITQu4vr4xnSDxMaL',
  },
  {
    id: 'appointment',
    name: 'Appointment Scheduler',
    description:
      'Book appointments, manage calendars, and confirm details.',
    icon: 'appointment',
    system_prompt: systemPrompts.appointment,
    suggested_voice_id: '21m00Tcm4TlvDq8ikWAM',
  },
  {
    id: 'faq',
    name: 'Info Collector',
    description:
      'Answer frequently asked questions clearly and concisely.',
    icon: 'faq',
    system_prompt: systemPrompts.info_collector,
    suggested_voice_id: 'pNInz6obpgDQGcFmaJgB',
  },
];

export default function TemplateSelector({ onCancel }) {

    const router = useRouter()
    const [assistantName, setAssistantName] = useState('New Assistant');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [initialAgentData, setInitialAgentData] = useState(null);

  function handleTemplateClick(template) {
    setSelectedTemplate(template?.id || null);
  }

  function handleContinue() {
    if (!selectedTemplate) return;

    if (selectedTemplate === 'blank') {
      setInitialAgentData({
        name: assistantName,
        system_prompt: '',
        description: '',
        voice_id: '21m00Tcm4TlvDq8ikWAM',
      });
    } else {
      const template = QUICKSTART_TEMPLATES.find(
        (t) => t.id === selectedTemplate
      );

      if (template) {
        setInitialAgentData({
          name: assistantName,
          system_prompt: template.system_prompt,
          description: template.description,
          voice_id: template.suggested_voice_id,
        });
      }
    }

    setShowCreateDialog(true);
  }

  function handleFormSuccess() {
    setShowCreateDialog(false);
    router.push("/dashboard/agents")
  }

  return (
    <div className="space-y-6">
      {/* Assistant Name */}
      <div>
        <label className="block text-sm font-medium text-white mb-4">
          Assistant Name{' '}
          <span className="text-amber-500 text-xs">
            (Can be changed later)
          </span>
        </label>
        <Input
          value={assistantName}
          onChange={(e) => setAssistantName(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white h-12"
          placeholder="Enter assistant name"
        />
      </div>

      {/* Blank Template */}
      <button
        onClick={() => handleTemplateClick({ id: 'blank' })}
        className={cn(
          'w-full p-6 rounded-xl border-2 transition-all text-left',
          selectedTemplate === 'blank'
            ? 'border-teal-500 bg-teal-500/10'
            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center',
              selectedTemplate === 'blank'
                ? 'bg-teal-500'
                : 'bg-slate-700'
            )}
          >
            <Plus
              className={cn(
                'w-6 h-6',
                selectedTemplate === 'blank'
                  ? 'text-white'
                  : 'text-gray-400'
              )}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Blank Template
            </h3>
            <p className="text-sm text-gray-400">
              Start from scratch and fully customize your assistant.
            </p>
          </div>
        </div>
      </button>

      {/* Quickstart Templates */}
      <div className="grid gap-4 md:grid-cols-2">
        {QUICKSTART_TEMPLATES.map((template) => {
          const IconComponent = TEMPLATE_ICONS[template.icon];
          const isSelected = selectedTemplate === template.id;

          return (
            <button
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              className={cn(
                'p-6 rounded-xl border-2 transition-all text-left',
                isSelected
                  ? 'border-teal-500 bg-teal-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              )}
            >
              <div className="mb-4">
                <div
                  className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center mb-3',
                    isSelected ? 'bg-teal-500' : 'bg-slate-700'
                  )}
                >
                  <IconComponent
                    className={cn(
                      'w-6 h-6',
                      isSelected
                        ? 'text-white'
                        : 'text-gray-400'
                    )}
                  />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-400">
                  {template.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="text-gray-300 hover:text-white hover:bg-slate-800"
        >
          Close
        </Button>

        <Button
          onClick={handleContinue}
          disabled={!selectedTemplate}
          className="bg-teal-500 hover:bg-teal-600 text-white font-semibold px-6"
        >
          Create Assistant
        </Button>
      </div>

      {/* Create Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      >
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
            <DialogDescription>
                Configure your assistant settings and behavior.
            </DialogDescription>
          </DialogHeader>

          {initialAgentData && (
            <AgentForm
              initialData={initialAgentData}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowCreateDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}