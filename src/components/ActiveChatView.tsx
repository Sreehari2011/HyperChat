import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Pencil, Copy, RotateCcw, Ghost } from 'lucide-react';
import ChatInput from './ChatInput';
import TokenCounter from './TokenCounter';
import { ChatSession, Project, Skill, ChatAttachment, ChatTodo, ChatDeliverable } from '../types';
import { stripHiddenProjectDetails, estimateTokens } from '../utils';

interface ActiveChatViewProps {
  chat: ChatSession;
  onSendMessage: (message: string, isGhostMode?: boolean, attachments?: { id: string; name: string; size: number }[]) => void;
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
  onToggleTodo?: (chatId: string, todoId: string) => void;
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
  onLoadSkill,
  onToggleTodo
}: ActiveChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [draftTokens, setDraftTokens] = useState(0);
  const [isRhsOpen, setIsRhsOpen] = useState(true);

  // Local overrides for todo completion to provide immediate responsive feedback
  const [toggledTodoIds, setToggledTodoIds] = useState<Record<string, boolean>>({});

  // Reset toggled state when switching chats
  useEffect(() => {
    setToggledTodoIds({});
    setIsRhsOpen(true);
  }, [chat.id]);

  // Aggregate uploads, todos, and deliverables from chat session and message content
  const { uploads, todos, deliverables } = useMemo(() => {
    const gatheredUploads: ChatAttachment[] = [...(chat.uploads || [])];
    const gatheredTodos: ChatTodo[] = [...(chat.todos || [])];
    const gatheredDeliverables: ChatDeliverable[] = [...(chat.deliverables || [])];

    const seenUploadNames = new Set(gatheredUploads.map(u => u.name));
    const seenTodoTitles = new Set(gatheredTodos.map(t => t.title.toLowerCase().trim()));
    const seenDeliverableNames = new Set(gatheredDeliverables.map(d => d.name));

    (chat.messages || []).forEach((msg) => {
      // 1. Process attachments
      if (msg.attachments) {
        msg.attachments.forEach(att => {
          if (!seenUploadNames.has(att.name)) {
            seenUploadNames.add(att.name);
            gatheredUploads.push(att);
          }
        });
      }

      // Parse [Attached: filename (size)] in message content
      const attachRegex = /\[Attached:\s*([^(\]]+)(?:\s*\(([^)]+)\))?\]/g;
      let match: RegExpExecArray | null;
      while ((match = attachRegex.exec(msg.content)) !== null) {
        const name = match[1].trim();
        const size = match[2] ? match[2].trim() : 'Attached';
        if (!seenUploadNames.has(name)) {
          seenUploadNames.add(name);
          gatheredUploads.push({
            id: `att-${name}-${gatheredUploads.length}`,
            name,
            size,
            uploadedAt: msg.timestamp
          });
        }
      }

      // 2. Process todos
      if (msg.todos) {
        msg.todos.forEach(t => {
          const key = t.title.toLowerCase().trim();
          if (!seenTodoTitles.has(key)) {
            seenTodoTitles.add(key);
            gatheredTodos.push(t);
          }
        });
      }

      // Parse checklist tasks from assistant messages: e.g. - [ ] Step 1: ... or - [x] ...
      if (msg.role === 'assistant') {
        const lines = msg.content.split('\n');
        lines.forEach(line => {
          const trimmed = line.trim();
          const todoMatch = trimmed.match(/^[-*]\s*\[([ xX])\]\s*(?:(Step\s*\d+[:.]?)\s*)?(.*)$/i);
          if (todoMatch) {
            const completed = todoMatch[1].toLowerCase() === 'x';
            const stepPrefix = todoMatch[2] ? `${todoMatch[2]} ` : '';
            const title = stepPrefix + todoMatch[3].trim();
            const cleanKey = title.toLowerCase().trim();
            if (cleanKey && !seenTodoTitles.has(cleanKey)) {
              seenTodoTitles.add(cleanKey);
              gatheredTodos.push({
                id: `todo-${gatheredTodos.length + 1}`,
                title,
                completed,
                stepNumber: gatheredTodos.length + 1
              });
            }
          }
        });
      }

      // 3. Process deliverables
      if (msg.deliverables) {
        msg.deliverables.forEach(d => {
          if (!seenDeliverableNames.has(d.name)) {
            seenDeliverableNames.add(d.name);
            gatheredDeliverables.push(d);
          }
        });
      }

      // Parse code block deliverables with file="filename" or filename="filename"
      if (msg.role === 'assistant') {
        const codeBlockRegex = /```(?:[a-zA-Z0-9_-]+)?(?:\s+(?:file|filename)="?([^"\n\r]+)"?)?\n([\s\S]*?)```/g;
        let cbMatch: RegExpExecArray | null;
        while ((cbMatch = codeBlockRegex.exec(msg.content)) !== null) {
          const fileParam = cbMatch[1]?.trim();
          const codeContent = cbMatch[2];
          if (fileParam && !seenDeliverableNames.has(fileParam)) {
            seenDeliverableNames.add(fileParam);
            gatheredDeliverables.push({
              id: `deliv-${fileParam}-${gatheredDeliverables.length}`,
              name: fileParam,
              content: codeContent,
              size: `${codeContent.split('\n').length} lines`,
              timestamp: msg.timestamp
            });
          }
        }

        // Parse list of deliverables matching pattern: - `filename.ext`
        const deliverableListRegex = /(?:Delivered|Generated files|Deliverables)[\s\S]*?(?:-|\*)\s*`?([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)`?(?:\s*\(([^)\n]+)\))?/gi;
        let dMatch: RegExpExecArray | null;
        while ((dMatch = deliverableListRegex.exec(msg.content)) !== null) {
          const name = dMatch[1]?.trim();
          const desc = dMatch[2]?.trim();
          if (name && !seenDeliverableNames.has(name) && name.includes('.')) {
            seenDeliverableNames.add(name);
            gatheredDeliverables.push({
              id: `deliv-${name}-${gatheredDeliverables.length}`,
              name,
              size: desc || 'Delivered file',
              timestamp: msg.timestamp
            });
          }
        }
      }
    });

    // Apply local toggle overrides
    const finalTodos = gatheredTodos.map(t => {
      if (toggledTodoIds[t.id] !== undefined) {
        return { ...t, completed: toggledTodoIds[t.id] };
      }
      return t;
    });

    return {
      uploads: gatheredUploads,
      todos: finalTodos,
      deliverables: gatheredDeliverables
    };
  }, [chat, toggledTodoIds]);

  const hasAnyRhsItems = uploads.length > 0 || todos.length > 0 || deliverables.length > 0;

  const handleToggleTodo = (todoId: string) => {
    const currentStatus = todos.find(t => t.id === todoId)?.completed ?? false;
    setToggledTodoIds(prev => ({ ...prev, [todoId]: !currentStatus }));
    onToggleTodo?.(chat.id, todoId);
  };

  // Calculate sum of entire message session
  const sessionMessagesTokens = useMemo(() => {
    return (chat.messages || []).reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
  }, [chat.messages]);

  const totalSessionTokens = sessionMessagesTokens + draftTokens;
  const maxModelTokens = selectedModel === 'cisai-ultra' ? 1000000 : selectedModel === 'cisai-pro' ? 128000 : 32000;
  const isAgentChat = Boolean(chat.agentId || chat.agentName);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  return (
    <div className="flex-1 flex h-full w-full overflow-hidden bg-[#151515]">
      {/* Central Chat Column */}
      <div className="flex-1 flex flex-col h-full bg-[#151515] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full z-10 pointer-events-none flex flex-col">
          <div className="bg-[#151515] pt-5 px-6 pb-2 flex items-center gap-2">
            {!isAgentChat && chat.isGhost && (
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

            <div className="pointer-events-auto ml-auto pl-2 shrink-0 flex items-center gap-3">
              <TokenCounter 
                tokens={totalSessionTokens} 
                maxTokens={maxModelTokens}
                isGhostMode={!isAgentChat && chat.isGhost}
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
            isGhostMode={!isAgentChat && chat.isGhost}
            disableGhostMode={isAgentChat}
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
