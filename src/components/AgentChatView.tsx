import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, X } from 'lucide-react';
import ChatInput from './ChatInput';
import TokenCounter from './TokenCounter';
import { Agent, Project, Skill } from '../types';

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
  onLoadSkill
}: AgentChatViewProps) {
  const [isExtensionVisible, setIsExtensionVisible] = useState(true);
  const [draftTokens, setDraftTokens] = useState(0);
  const maxModelTokens = selectedModel === 'cisai-ultra' ? 1000000 : selectedModel === 'cisai-pro' ? 128000 : 32000;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#151515] relative overflow-hidden">
      {/* Top Navigation */}
      <div className="w-full px-6 py-4 flex items-center justify-between z-10">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer group"
          title="Back to Agents"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          <span>Agents</span>
        </button>
        <TokenCounter tokens={draftTokens} maxTokens={maxModelTokens} />
      </div>

      {/* Main Dedicated Agent Chat Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-3xl flex flex-col items-center justify-center mb-12 gap-5"
        >
          {/* Agent Name */}
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <h1 className="text-2xl md:text-3xl font-display text-zinc-200 tracking-tight text-center">
              {agent.name}
            </h1>
            {agent.description && (
              <p className="text-xs md:text-sm text-zinc-400 text-center max-w-lg line-clamp-2 font-normal leading-relaxed">
                {agent.description}
              </p>
            )}
          </div>
          
          <div className="w-full mt-2">
            <ChatInput 
              onSendMessage={onSendMessage} 
              isInitial={true} 
              disableGhostMode={true}
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
              extensionBanner={isExtensionVisible ? (
                <div className="w-full px-5 pt-3 pb-6 bg-[#191919] border-t border-x border-[#333] rounded-t-xl flex items-center justify-between text-xs transition-all select-none shadow-xs">
                  <div className="flex items-center min-w-0 pr-2">
                    <span className="text-zinc-400 truncate text-xs sm:text-[13px] tracking-wide">
                      You are working with <span className="font-medium text-zinc-200">{agent.name}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExtensionVisible(false)}
                    className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-[#262626] rounded transition-colors cursor-pointer shrink-0"
                    title="Dismiss alert"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : undefined}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
