import React, { useEffect, useState } from 'react';
import { Code2, FileText, Layers, Wrench, Sparkles, PenLine, Globe, Zap } from 'lucide-react';
import ChatInput from './ChatInput';
import TokenCounter from './TokenCounter';
import { Project, Skill, getModelMaxTokens } from '../types';

interface NewChatViewProps {
  onSendMessage: (message: string, isGhostMode?: boolean) => void;
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

const SUGGESTIONS = [
  { icon: <Code2 size={14} />, label: 'Debug this stack trace' },
  { icon: <PenLine size={14} />, label: 'Draft a technical design doc' },
  { icon: <Layers size={14} />, label: 'Plan a full-stack feature' },
  { icon: <Wrench size={14} />, label: 'Refactor a messy module' },
  { icon: <Globe size={14} />, label: 'Explain an API contract' },
  { icon: <Zap size={14} />, label: 'Write a bash automation' },
];

export default function NewChatView({
  onSendMessage,
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
}: NewChatViewProps) {
  const [greeting, setGreeting] = useState('How can I help you today?');
  const [draftTokens, setDraftTokens] = useState(0);

  useEffect(() => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    setGreeting(`Good ${timeOfDay}, Sreehari`);
  }, []);

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-y-auto bg-ink-900 no-scrollbar">
      <div className="absolute right-6 top-5 z-10">
        <TokenCounter tokens={draftTokens} maxTokens={getModelMaxTokens(selectedModel)} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-[720px] animate-slide-up">
          {/* hero */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-ink-750 to-ink-850 ring-1 ring-ink-600">
              <Sparkles size={19} className="text-amber-200/90" />
            </div>
            <h1 className="font-serif text-[28px] font-light tracking-tight text-ink-50 md:text-[34px]">
              {greeting}
            </h1>
            <p className="mt-2 text-[13.5px] text-ink-200">
              Agents, projects and skills — all one conversation away.
            </p>
          </div>

          {/* composer */}
          <ChatInput
            onSendMessage={onSendMessage}
            isInitial
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

          {/* suggestion chips */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s.label}
                onClick={() => onSendMessage(s.label)}
                className="flex items-center gap-2 rounded-full border border-ink-600 bg-ink-850/60 px-3.5 py-1.5 text-[12.5px] text-ink-100 transition-all hover:border-ink-400 hover:bg-ink-750 hover:text-ink-50 active:scale-[0.97]"
              >
                <span className="text-ink-300">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
