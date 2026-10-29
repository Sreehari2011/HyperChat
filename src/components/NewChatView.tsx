import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import ChatInput from './ChatInput';
import TokenCounter from './TokenCounter';
import { Project, Skill } from '../types';

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
  onLoadSkill
}: NewChatViewProps) {
  const [greeting, setGreeting] = useState("How can I help you today?");
  const [draftTokens, setDraftTokens] = useState(0);
  const maxModelTokens = selectedModel === 'cisai-ultra' ? 1000000 : selectedModel === 'cisai-pro' ? 128000 : 32000;

  useEffect(() => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    
    const dynamicGreetings = [
      `Good ${timeOfDay}. How can I assist you?`,
      `Good ${timeOfDay}. What shall we explore?`,
      "How can I help you today?",
      "What's on your mind?",
      "Ready to begin?"
    ];
    
    setGreeting(dynamicGreetings[Math.floor(Math.random() * dynamicGreetings.length)]);
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full items-center justify-center p-6 relative">
      <div className="absolute top-5 right-6 z-20 pointer-events-auto">
        <TokenCounter 
          tokens={draftTokens} 
          maxTokens={maxModelTokens}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-3xl flex flex-col items-center justify-center mb-12 gap-6"
      >
        <div className="flex items-center gap-3 text-zinc-400">
          <h1 className="text-4xl md:text-5xl font-display text-zinc-200 tracking-tight text-center">
            {greeting}
          </h1>
        </div>
        
        <div className="w-full">
          <ChatInput 
            onSendMessage={onSendMessage} 
            isInitial={true} 
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
      </motion.div>
    </div>
  );
}
