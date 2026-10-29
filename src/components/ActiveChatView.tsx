import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Pencil, Copy, RotateCcw, Ghost } from 'lucide-react';
import ChatInput from './ChatInput';
import TokenCounter from './TokenCounter';
import { ChatSession, Project, Skill } from '../types';
import { stripHiddenProjectDetails, estimateTokens } from '../utils';

interface ActiveChatViewProps {
  chat: ChatSession;
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

export default function ActiveChatView({ 
  chat, 
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
  onLoadSkill
}: ActiveChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [draftTokens, setDraftTokens] = useState(0);

  // Calculate sum of entire message session
  const sessionMessagesTokens = useMemo(() => {
    return (chat.messages || []).reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
  }, [chat.messages]);

  const totalSessionTokens = sessionMessagesTokens + draftTokens;
  const maxModelTokens = selectedModel === 'cisai-ultra' ? 1000000 : selectedModel === 'cisai-pro' ? 128000 : 32000;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#151515] relative">
      <div className="absolute top-0 left-0 w-full z-10 pointer-events-none flex flex-col">
        <div className="bg-[#151515] pt-5 px-6 pb-2 flex items-center gap-2">
          {chat.isGhost && (
            <span className="pointer-events-auto ml-2 px-2.5 py-0.5 rounded text-[11px] font-medium bg-white/[0.08] text-white border border-white/20 shrink-0 flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,255,255,0.12)]">
              <Ghost size={12} className="text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
              Ghost Mode - Your chats will be Secrets
            </span>
          )}
          {chat.agentName && (
            <span className="pointer-events-auto ml-2 px-2 py-0.5 rounded text-[11px] font-medium bg-[#242424] text-zinc-300 border border-[#333] shrink-0">
              {chat.agentName}
            </span>
          )}
          <h2 className="text-zinc-400 text-sm font-medium tracking-wide pointer-events-auto px-2 truncate flex-1 min-w-0" title={chat.title}>
            {chat.title}
          </h2>
          <div className="pointer-events-auto ml-auto pl-2 shrink-0">
            <TokenCounter 
              tokens={totalSessionTokens} 
              maxTokens={maxModelTokens}
              isGhostMode={chat.isGhost}
            />
          </div>
        </div>
        <div className="h-12 bg-gradient-to-b from-[#151515] to-transparent"></div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-8 no-scrollbar pt-24">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          {chat.messages.map((msg) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id} 
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group`}
            >
              <div 
                className={`px-5 py-3.5 rounded-2xl max-w-[85%] text-[15px] leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-[#2a2a2a] text-zinc-100 rounded-br-sm mr-5' 
                    : 'text-zinc-300'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {msg.displayText || stripHiddenProjectDetails(msg.content) || msg.content}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="flex items-center gap-2 mt-2 mr-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-xs text-zinc-500 mr-1 font-medium">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                  <button className="text-zinc-500 hover:text-zinc-300 transition-colors" title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button className="text-zinc-500 hover:text-zinc-300 transition-colors" title="Copy">
                    <Copy size={14} />
                  </button>
                </div>
              )}
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mt-2 px-5">
                  <button className="text-zinc-500 hover:text-zinc-300 transition-colors" title="Copy">
                    <Copy size={14} />
                  </button>
                  <button className="text-zinc-500 hover:text-zinc-300 transition-colors" title="Retry">
                    <RotateCcw size={14} />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="p-4 bg-gradient-to-t from-[#151515] to-transparent">
        <ChatInput 
          onSendMessage={onSendMessage} 
          isGhostMode={chat.isGhost}
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
  );
}
