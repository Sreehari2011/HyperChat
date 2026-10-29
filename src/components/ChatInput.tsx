import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, 
  ArrowUp, 
  ChevronDown, 
  Folder, 
  X, 
  FilePenLine, 
  Check, 
  Paperclip, 
  Search, 
  FileText,
  Layers,
  Ghost
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Skill } from '../types';
import { formatTokenCount, estimateTokens } from '../utils';

export const AVAILABLE_CHAT_MODELS = [
  'cisai-lite',
  'cisai-pro',
  'cisai-ultra',
] as const;

export type ChatModel = typeof AVAILABLE_CHAT_MODELS[number];

interface AttachedFile {
  id: string;
  name: string;
  size: number;
}

interface ChatInputProps {
  onSendMessage: (message: string, isGhostMode?: boolean) => void;
  isInitial?: boolean;
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
  extensionBanner?: React.ReactNode;
  isGhostMode?: boolean;
  onToggleGhostMode?: (enabled: boolean) => void;
  onTokenCountChange?: (count: number) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ChatInput({ 
  onSendMessage, 
  isInitial = false,
  loadedProject,
  onUnloadProject,
  loadedSkill,
  onUnloadSkill,
  selectedModel,
  onSelectModel,
  projects = [],
  skills = [],
  onLoadProject,
  onLoadSkill,
  extensionBanner,
  isGhostMode,
  onToggleGhostMode,
  onTokenCountChange
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [localModel, setLocalModel] = useState<string>('cisai-lite');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isLoadProjectModalOpen, setIsLoadProjectModalOpen] = useState(false);
  const [isImportSkillModalOpen, setIsImportSkillModalOpen] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [localGhostMode, setLocalGhostMode] = useState(false);
  const [isGhostHovered, setIsGhostHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeGhostMode = isGhostMode !== undefined ? isGhostMode : localGhostMode;

  const handleToggleGhost = () => {
    const next = !activeGhostMode;
    setLocalGhostMode(next);
    onToggleGhostMode?.(next);
  };

  const handleGhostMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsGhostHovered(true);
    }, 2000);
  };

  const handleGhostMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsGhostHovered(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeModel = selectedModel || localModel;

  const handleSelectModel = (model: string) => {
    setLocalModel(model);
    onSelectModel?.(model);
    setIsModelDropdownOpen(false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(target)) {
        setIsModelDropdownOpen(false);
      }
      if (plusMenuRef.current && !plusMenuRef.current.contains(target)) {
        setIsPlusMenuOpen(false);
      }
    }

    if (isModelDropdownOpen || isPlusMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModelDropdownOpen, isPlusMenuOpen]);

  // Adjust textarea height
  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 52), 220)}px`;
    }
  }, [message]);

  useEffect(() => {
    if ((loadedProject || loadedSkill) && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [loadedProject, loadedSkill]);

  const handleFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: AttachedFile[] = Array.from(files).map((file: File) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: file.size
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);
    // Reset file input value so same files can be re-selected if removed
    e.target.value = '';
    textareaRef.current?.focus();
  };

  const removeAttachedFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage && attachedFiles.length === 0) return;

    let payload = trimmedMessage;
    if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map(f => `[Attached: ${f.name} (${formatFileSize(f.size)})]`).join(' ');
      payload = trimmedMessage ? `${trimmedMessage}\n\n${fileNames}` : fileNames;
    }

    onSendMessage(payload, activeGhostMode);
    setMessage('');
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredProjects = projects.filter(p => {
    if (!projectSearchQuery.trim()) return true;
    const q = projectSearchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
  });

  const filteredSkills = skills.filter(s => {
    if (!skillSearchQuery.trim()) return true;
    const q = skillSearchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q));
  });

  // Calculate realtime token usage
  const messageTokens = message.trim() ? estimateTokens(message) : 0;
  const attachedFilesTokens = attachedFiles.reduce((acc, f) => acc + estimateTokens({ size: f.size }), 0);
  const loadedProjectTokens = loadedProject
    ? (loadedProject.files || []).reduce((acc, f) => {
        if (typeof f.tokens === 'number') return acc + f.tokens;
        if (typeof f.tokens === 'string') {
          const parsed = parseInt(f.tokens);
          if (!isNaN(parsed)) return acc + parsed;
        }
        return acc + estimateTokens(f);
      }, 0)
    : 0;
  const loadedSkillTokens = loadedSkill
    ? (loadedSkill.files && loadedSkill.files.length > 0
        ? loadedSkill.files.reduce((acc, f) => acc + (typeof f.tokens === 'number' ? f.tokens : estimateTokens(f)), 0)
        : estimateTokens(loadedSkill.content || ''))
    : 0;

  const currentUsedTokens = messageTokens + attachedFilesTokens + loadedProjectTokens + loadedSkillTokens;
  const maxModelTokens = activeModel === 'cisai-ultra' ? 1000000 : activeModel === 'cisai-pro' ? 128000 : 32000;

  useEffect(() => {
    onTokenCountChange?.(currentUsedTokens);
  }, [currentUsedTokens, onTokenCountChange]);

  // Dynamic progress calculation: gives clear, realtime visual feedback while typing
  const calculateProgressRatio = (tokens: number, maxTokens: number): number => {
    if (tokens <= 0) return 0;
    const normalized = Math.min(tokens / maxTokens, 1);
    const logRatio = Math.min(1, Math.log10(tokens + 1) / Math.log10(maxTokens + 1));
    const ratio = 0.65 * logRatio + 0.35 * Math.sqrt(normalized);
    return Math.min(1, Math.max(0.06, ratio));
  };

  const circleRadius = 7.5;
  const circumference = 2 * Math.PI * circleRadius;
  const progressRatio = calculateProgressRatio(currentUsedTokens, maxModelTokens);
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <>
      {/* Hidden file input for system file picker */}
      <input 
        type="file"
        ref={fileInputRef}
        multiple
        onChange={handleFilesAdded}
        className="hidden"
      />

      <div className="w-full max-w-3xl mx-auto flex flex-col relative">
        <AnimatePresence>
          {extensionBanner && (
            <motion.div
              key="extension-banner"
              initial={{ height: 0, marginBottom: 0, opacity: 0 }}
              animate={{ 
                height: 'auto', 
                marginBottom: -14, 
                opacity: 1,
                transition: { 
                  duration: 0.42, 
                  delay: 0.15,
                  ease: [0.16, 1, 0.3, 1] 
                }
              }}
              exit={{ 
                height: 0, 
                marginBottom: 0, 
                opacity: 0,
                transition: { 
                  duration: 0.26, 
                  delay: 0,
                  ease: [0.16, 1, 0.3, 1] 
                }
              }}
              className="relative z-0 mx-3.5 overflow-hidden"
            >
              <motion.div
                initial={{ y: 34 }}
                animate={{ 
                  y: 0,
                  transition: { 
                    duration: 0.42, 
                    delay: 0.15,
                    ease: [0.16, 1, 0.3, 1] 
                  }
                }}
                exit={{ 
                  y: 32,
                  transition: { 
                    duration: 0.26, 
                    delay: 0,
                    ease: [0.16, 1, 0.3, 1] 
                  }
                }}
              >
                {extensionBanner}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          className={`w-full flex flex-col rounded-2xl shadow-lg cursor-text relative z-10 transition-[background-color,border-color,box-shadow] duration-250 ease-out ${
            activeGhostMode 
              ? 'bg-[#232326] border border-white/40 ring-1 ring-white/10 shadow-[0_0_25px_rgba(255,255,255,0.06)]' 
              : 'bg-[#202020] border border-[#333]'
          } ${isInitial ? 'shadow-black/50' : ''}`}
          onClick={() => textareaRef.current?.focus()}
        >
          {/* Ghost Mode Top Warning Indicator */}
          <AnimatePresence initial={false}>
            {activeGhostMode && (
              <motion.div
                key="ghost-mode-warning-bar"
                initial={{ height: 0, opacity: 0 }}
                animate={{ 
                  height: 'auto', 
                  opacity: 1,
                  transition: { 
                    height: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.22, ease: 'easeOut' }
                  }
                }}
                exit={{ 
                  height: 0, 
                  opacity: 0,
                  transition: { 
                    height: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.15, ease: 'easeIn' }
                  }
                }}
                className="overflow-hidden"
              >
                <div className="border-b border-white/10 bg-white/[0.04] px-3.5 py-2 flex items-center justify-between text-xs rounded-t-2xl">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <Ghost size={14} className="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)] flex-shrink-0" />
                    <span>Ghost Mode - Your chats will be Secrets</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleGhost();
                    }}
                    className="text-zinc-400 hover:text-white text-[11px] underline cursor-pointer ml-2 flex-shrink-0 transition-colors"
                  >
                    Turn off
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        <div className="flex items-start flex-wrap gap-2 px-3.5 pt-3">
          {loadedProject && (
            <div 
              className="inline-flex items-center gap-1.5 bg-[#252525] border border-[#383838] text-zinc-200 text-xs py-1 px-2.5 rounded-lg flex-shrink-0 select-none animate-in fade-in zoom-in-95 duration-150 group transition-colors my-0.5"
              title={`Project: ${loadedProject.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Folder size={13} className="text-zinc-400 flex-shrink-0" />
              <span className="truncate max-w-[220px] font-medium text-zinc-200">{loadedProject.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnloadProject?.();
                }}
                className="ml-0.5 p-0.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#383838] rounded transition-colors flex-shrink-0 cursor-pointer"
                title="Remove project from chat"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          )}

          {loadedSkill && (
            <div 
              className="inline-flex items-center gap-1.5 bg-[#252525] border border-[#383838] text-zinc-200 text-xs py-1 px-2.5 rounded-lg flex-shrink-0 select-none animate-in fade-in zoom-in-95 duration-150 group transition-colors my-0.5"
              title={`Skill: ${loadedSkill.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <FilePenLine size={13} className="text-zinc-400 flex-shrink-0" strokeWidth={1.5} />
              <span className="truncate max-w-[220px] font-medium text-zinc-200">{loadedSkill.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnloadSkill?.();
                }}
                className="ml-0.5 p-0.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#383838] rounded transition-colors flex-shrink-0 cursor-pointer"
                title="Remove skill from chat"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          )}

          {attachedFiles.map(file => (
            <div 
              key={file.id}
              className="inline-flex items-center gap-1.5 bg-[#252525] border border-[#383838] text-zinc-200 text-xs py-1 px-2.5 rounded-lg flex-shrink-0 select-none animate-in fade-in zoom-in-95 duration-150 group transition-colors my-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Paperclip size={12} className="text-zinc-400 flex-shrink-0" />
              <span className="truncate max-w-[180px] font-medium text-zinc-200">{file.name}</span>
              <span className="text-[10px] text-zinc-500 font-normal">({formatTokenCount(file.size)})</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAttachedFile(file.id);
                }}
                className="ml-0.5 p-0.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#383838] rounded transition-colors flex-shrink-0 cursor-pointer"
                title="Remove file"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          ))}

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeGhostMode ? "Type in Ghost Mode (history not logged)..." : "Type something..."}
            className="flex-1 min-w-[200px] bg-transparent text-zinc-100 placeholder:text-zinc-500 py-1.5 outline-none resize-none min-h-[52px] max-h-[220px] text-sm leading-relaxed"
            rows={2}
          />
        </div>

        <div className="flex items-center justify-between px-2.5 pt-2 pb-2 gap-2 relative z-20" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            {/* Plus Button with Dropdown */}
            <div className="relative z-30" ref={plusMenuRef}>
              <button 
                type="button"
                onClick={() => setIsPlusMenuOpen(prev => !prev)}
                className={`p-2 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                  isPlusMenuOpen 
                    ? 'bg-[#333] text-zinc-100' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#333]'
                }`}
                title="Add options"
              >
                <Plus size={20} strokeWidth={2} className={`transition-transform duration-200 ${isPlusMenuOpen ? 'rotate-45' : ''}`} />
              </button>

              {/* Three Options Menu */}
              {isPlusMenuOpen && (
                <div 
                  className="absolute left-0 bottom-full mb-2.5 w-48 bg-[#1c1c1c] border border-[#333] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPlusMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium rounded-lg text-zinc-300 hover:text-white hover:bg-[#282828] transition-colors text-left cursor-pointer"
                    >
                      <Paperclip size={14} className="text-zinc-400" />
                      <span>Add Files</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPlusMenuOpen(false);
                        setIsLoadProjectModalOpen(true);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium rounded-lg text-zinc-300 hover:text-white hover:bg-[#282828] transition-colors text-left cursor-pointer"
                    >
                      <Folder size={14} className="text-zinc-400" />
                      <span>Load Project</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPlusMenuOpen(false);
                        setIsImportSkillModalOpen(true);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium rounded-lg text-zinc-300 hover:text-white hover:bg-[#282828] transition-colors text-left cursor-pointer"
                    >
                      <FilePenLine size={14} className="text-zinc-400" />
                      <span>Import Skill</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Ghost Mode (Incognito / Temporary Chat) Toggle */}
            <div className="relative z-30 flex items-center">
              <button 
                type="button"
                onClick={() => {
                  handleGhostMouseLeave();
                  handleToggleGhost();
                }}
                onMouseEnter={handleGhostMouseEnter}
                onMouseLeave={handleGhostMouseLeave}
                className={`p-2 rounded-full transition-colors flex-shrink-0 cursor-pointer relative ${
                  activeGhostMode 
                    ? 'hover:bg-white/[0.06]' 
                    : 'hover:bg-[#333]'
                }`}
                aria-label="Toggle Ghost Mode (Temporary chat)"
              >
                <Ghost 
                  size={19} 
                  strokeWidth={2} 
                  className={`transition-colors duration-200 ${
                    activeGhostMode 
                      ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.95)]' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`} 
                />
              </button>

              {/* Hover Tooltip: Ghost Mode */}
              <AnimatePresence>
                {isGhostHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 3, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none whitespace-nowrap"
                  >
                    <div className="bg-[#1c1c1f] border border-[#38383c] text-white text-xs font-medium px-2.5 py-1 rounded-md shadow-xl shadow-black/80 flex items-center justify-center">
                      <span>Ghost Mode</span>
                    </div>
                    {/* Tooltip arrow pointer */}
                    <div className="w-1.5 h-1.5 bg-[#1c1c1f] border-r border-b border-[#38383c] rotate-45 mx-auto -mt-1 shadow-sm" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative z-30" ref={modelDropdownRef}>
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen(prev => !prev)}
                className={`flex px-3 py-1.5 items-center text-xs font-medium gap-1.5 w-fit rounded-lg cursor-pointer transition-colors ${
                  isModelDropdownOpen 
                    ? 'bg-[#333] text-zinc-100' 
                    : 'text-zinc-400 hover:bg-[#333] hover:text-zinc-200'
                }`}
              >
                <span>{activeModel}</span>
                <ChevronDown 
                  size={14} 
                  strokeWidth={2} 
                  className={`transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180 text-zinc-200' : ''}`} 
                />
              </button>

              {isModelDropdownOpen && (
                <div 
                  className="absolute right-0 bottom-full mb-2.5 w-36 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col gap-0.5">
                    {AVAILABLE_CHAT_MODELS.map((model) => {
                      const isSelected = activeModel === model;
                      return (
                        <button
                          key={model}
                          type="button"
                          onClick={() => handleSelectModel(model)}
                          className={`flex items-center justify-between w-full px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors text-left cursor-pointer ${
                            isSelected
                              ? 'bg-[#2a2a2a] text-zinc-100'
                              : 'text-zinc-400 hover:bg-[#252525] hover:text-zinc-200'
                          }`}
                        >
                          <span>{model}</span>
                          {isSelected && <Check size={13} className="text-blue-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <button 
              type="button"
              onClick={handleSend}
              disabled={!message.trim() && attachedFiles.length === 0}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                message.trim() || attachedFiles.length > 0
                  ? 'bg-zinc-200 text-zinc-900 hover:bg-white' 
                  : 'bg-[#333] text-zinc-500 cursor-not-allowed'
              }`}
              title="Send message"
            >
              <ArrowUp size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Load Project Modal Popup */}
      {isLoadProjectModalOpen && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
          onClick={() => {
            setIsLoadProjectModalOpen(false);
            setProjectSearchQuery('');
          }}
        >
          <div 
            className="bg-[#181818] border border-[#2e2e2e] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#262626] flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-100">Load Project</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Attach a project context to your chat session</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLoadProjectModalOpen(false);
                  setProjectSearchQuery('');
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search Box */}
            <div className="px-6 pt-4 pb-2">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  type="text"
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  autoFocus
                  className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl pl-9 pr-3.5 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-[#444]"
                />
              </div>
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-12 text-xs text-zinc-500">
                  {projectSearchQuery ? `No projects matching "${projectSearchQuery}"` : 'No projects available'}
                </div>
              ) : (
                filteredProjects.map(project => {
                  const isCurrentLoaded = loadedProject?.id === project.id;
                  return (
                    <div
                      key={project.id}
                      onClick={() => {
                        if (isCurrentLoaded) {
                          onUnloadProject?.();
                        } else {
                          onLoadProject?.(project);
                        }
                        setIsLoadProjectModalOpen(false);
                        setProjectSearchQuery('');
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                        isCurrentLoaded
                          ? 'bg-[#222] border-blue-500/50 shadow-sm'
                          : 'bg-[#151515] border-[#262626] hover:bg-[#1e1e1e] hover:border-[#383838]'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          isCurrentLoaded ? 'bg-blue-950/40 text-blue-400 border border-blue-800/40' : 'bg-[#222] text-zinc-400 group-hover:text-zinc-200'
                        }`}>
                          <Folder size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold text-zinc-100 truncate">{project.name}</h4>
                            {isCurrentLoaded && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950/50 text-blue-400 border border-blue-800/50 font-medium">
                                Active
                              </span>
                            )}
                          </div>
                          {project.description && (
                            <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                              {project.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-1">
                            <span>{project.files?.length || 0} file{project.files?.length === 1 ? '' : 's'}</span>
                            {project.dateString && <span>• {project.dateString}</span>}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
                          isCurrentLoaded
                            ? 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 border border-rose-800/40'
                            : 'bg-[#262626] text-zinc-200 group-hover:bg-[#333] group-hover:text-white'
                        }`}
                      >
                        {isCurrentLoaded ? 'Unload' : 'Load Project'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Import Skill Modal Popup */}
      {isImportSkillModalOpen && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
          onClick={() => {
            setIsImportSkillModalOpen(false);
            setSkillSearchQuery('');
          }}
        >
          <div 
            className="bg-[#181818] border border-[#2e2e2e] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#262626] flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-100">Import Skill</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Select a skill from the library to load into your chat</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportSkillModalOpen(false);
                  setSkillSearchQuery('');
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search Box */}
            <div className="px-6 pt-4 pb-2">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  type="text"
                  value={skillSearchQuery}
                  onChange={(e) => setSkillSearchQuery(e.target.value)}
                  placeholder="Search skills in library..."
                  autoFocus
                  className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl pl-9 pr-3.5 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-[#444]"
                />
              </div>
            </div>

            {/* Skill List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              {filteredSkills.length === 0 ? (
                <div className="text-center py-12 text-xs text-zinc-500">
                  {skillSearchQuery ? `No skills matching "${skillSearchQuery}"` : 'No skills in library'}
                </div>
              ) : (
                filteredSkills.map(skill => {
                  const isCurrentLoaded = loadedSkill?.id === skill.id;
                  return (
                    <div
                      key={skill.id}
                      onClick={() => {
                        if (isCurrentLoaded) {
                          onUnloadSkill?.();
                        } else {
                          onLoadSkill?.(skill);
                        }
                        setIsImportSkillModalOpen(false);
                        setSkillSearchQuery('');
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                        isCurrentLoaded
                          ? 'bg-[#222] border-blue-500/50 shadow-sm'
                          : 'bg-[#151515] border-[#262626] hover:bg-[#1e1e1e] hover:border-[#383838]'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          isCurrentLoaded ? 'bg-blue-950/40 text-blue-400 border border-blue-800/40' : 'bg-[#222] text-zinc-400 group-hover:text-zinc-200'
                        }`}>
                          <FilePenLine size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold text-zinc-100 truncate">{skill.name}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                              skill.category === 'builtin'
                                ? 'bg-[#242424] text-zinc-400 border border-[#333]'
                                : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                            }`}>
                              {skill.category === 'builtin' ? 'Builtin' : 'Created by Me'}
                            </span>
                            {isCurrentLoaded && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950/50 text-blue-400 border border-blue-800/50 font-medium">
                                Active
                              </span>
                            )}
                          </div>
                          {skill.description && (
                            <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                              {skill.description}
                            </p>
                          )}
                          {skill.author && (
                            <div className="text-[10px] text-zinc-500 mt-1">
                              <span>By {skill.author}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
                          isCurrentLoaded
                            ? 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 border border-rose-800/40'
                            : 'bg-[#262626] text-zinc-200 group-hover:bg-[#333] group-hover:text-white'
                        }`}
                      >
                        {isCurrentLoaded ? 'Unload' : 'Import Skill'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
