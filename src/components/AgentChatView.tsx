import React, { useState } from 'react';
import { ArrowLeft, Bot, Sparkles } from 'lucide-react';
import ChatInput from './ChatInput';
import TokenCounter from './TokenCounter';
import { Agent, Project, Skill, getModelMaxTokens } from '../types';

interface AgentChatViewProps {
  agent: Agent;
  onSendMessage: (message: string, isGhostMode?: boolean) => void;
  onBack: () => void;
  loadedProject?: Project | null;
  onUnloadProject?: () => void;
  loadedSkill?: Skill | null;
  onUnloadSkill?: () => void;
  selectedModel?: string;
  onSelectModel?: (model: string) => void;
  projects?: Project[];
  skills?: Skill[];
  onLoadProject?: (project: Project) => void;
  onLoadSkill?: (skill: Skill) => void;
}

export default function AgentChatView({
  agent,
  onSendMessage,
  onBack,
  loadedProject,
  onUnloadProject,
  loadedSkill,
  onUnloadSkill,
  selectedModel,
  onSelectModel,
  projects,
  skills,
  onLoadProject,
  onLoadSkill,
}: AgentChatViewProps) {
  const [draftTokens, setDraftTokens] = useState(0);
  const subAgentCount = agent.subAgents?.length || 0;

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-ink-900 no-scrollbar">
      <div className="flex h-14 shrink-0 items-center justify-between px-5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[13px] font-medium text-ink-200 transition-colors hover:text-ink-50"
        >
          <ArrowLeft size={15} />
          Agents
        </button>
        <TokenCounter tokens={draftTokens} maxTokens={getModelMaxTokens(selectedModel)} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-10">
        <div className="w-full max-w-[720px] animate-slide-up">
          {/* agent hero */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ink-750 to-ink-850 ring-1 ring-ink-600">
              <Bot size={22} className="text-amber-200/90" />
            </div>
            <h1 className="font-serif text-[26px] font-light tracking-tight text-ink-50">{agent.name}</h1>
            {agent.description && (
              <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-200">{agent.description}</p>
            )}
            {subAgentCount > 0 && (
              <span className="mt-3 flex items-center gap-1.5 rounded-full border border-ink-600 bg-ink-850 px-3 py-1 text-[11px] text-ink-200">
                <Sparkles size={11} className="text-amber-200/80" />
                {subAgentCount} sub-agent{subAgentCount > 1 ? 's' : ''} standing by
              </span>
            )}
          </div>

          <ChatInput
            onSendMessage={onSendMessage}
            isInitial
            disableGhostMode
            loadedProject={loadedProject}
            onUnloadProject={onUnloadProject}
            loadedSkill={loadedSkill}
            onUnloadSkill={onUnloadSkill}
            selectedModel={selectedModel}
            onSelectModel={onSelectModel}
            projects={projects}
            skills={skills}
            onLoadProject={onLoadProject}
            onLoadSkill={onLoadSkill}
            onTokenCountChange={setDraftTokens}
          />
        </div>
      </div>
    </div>
  );
}
