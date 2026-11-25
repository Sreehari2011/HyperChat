import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  ArrowUp,
  Check,
  Paperclip,
  Folder,
  FilePenLine,
  X,
  Ghost,
  ChevronDown,
  Search,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Project, Skill, CHAT_MODELS, getModelLabel, getModelMaxTokens } from '../types';
import { formatTokenCount, estimateTokens } from '../utils';
import { Menu } from './ui';

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
}

interface ChatInputProps {
  onSendMessage: (message: string, isGhostMode?: boolean, attachments?: AttachedFile[]) => void;
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
  isGhostMode?: boolean;
  onToggleGhostMode?: (enabled: boolean) => void;
  onTokenCountChange?: (count: number) => void;
  disableGhostMode?: boolean;
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
  isGhostMode,
  onToggleGhostMode,
  onTokenCountChange,
  disableGhostMode = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [ghost, setGhost] = useState(false);
  const [projectQuery, setProjectQuery] = useState('');
  const [skillQuery, setSkillQuery] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  const activeGhost = !disableGhostMode && (isGhostMode ?? ghost);
  const activeModelId = selectedModel || 'cisai-lite';

  /* textarea auto-resize */
  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
      const h = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(h, 24), 200)}px`;
    }
  }, [message]);

  /* focus when context attaches */
  useEffect(() => {
    if ((loadedProject || loadedSkill) && textareaRef.current) textareaRef.current.focus();
  }, [loadedProject, loadedSkill]);

  /* close attach menu on outside click */
  useEffect(() => {
    if (!isAttachMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setIsAttachMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [isAttachMenuOpen]);

  useEffect(() => {
    if (!isModelMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [isModelMenuOpen]);

  const handleFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setAttachedFiles(prev => [
      ...prev,
      ...Array.from(files).map(f => ({
        id: Math.random().toString(36).substring(2, 9),
        name: f.name,
        size: f.size,
      })),
    ]);
    e.target.value = '';
    textareaRef.current?.focus();
  };

  const removeAttachedFile = (id: string) => setAttachedFiles(prev => prev.filter(f => f.id !== id));

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed && attachedFiles.length === 0) return;

    let payload = trimmed;
    if (attachedFiles.length > 0) {
      const names = attachedFiles.map(f => `[Attached: ${f.name} (${formatFileSize(f.size)})]`).join(' ');
      payload = trimmed ? `${trimmed}\n\n${names}` : names;
    }

    onSendMessage(payload, activeGhost, attachedFiles.length > 0 ? [...attachedFiles] : undefined);
    setMessage('');
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* token estimate */
  const messageTokens = message.trim() ? estimateTokens(message) : 0;
  const attachedTokens = attachedFiles.reduce((acc, f) => acc + estimateTokens({ size: f.size }), 0);
  const projectTokens = loadedProject
    ? (loadedProject.files || []).reduce((acc, f) => acc + (typeof f.tokens === 'number' ? f.tokens : estimateTokens(f)), 0)
    : 0;
  const skillTokens = loadedSkill
    ? (loadedSkill.files?.length
        ? loadedSkill.files.reduce((acc, f) => acc + (typeof f.tokens === 'number' ? f.tokens : estimateTokens(f)), 0)
        : estimateTokens(loadedSkill.content || ''))
    : 0;
  const usedTokens = messageTokens + attachedTokens + projectTokens + skillTokens;
  const maxTokens = getModelMaxTokens(activeModelId);

  useEffect(() => {
    onTokenCountChange?.(usedTokens);
  }, [usedTokens, onTokenCountChange]);

  const filteredProjects = projects.filter(p =>
    !projectQuery.trim() ||
    p.name.toLowerCase().includes(projectQuery.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(projectQuery.toLowerCase())
  );
  const filteredSkills = skills.filter(s =>
    !skillQuery.trim() ||
    s.name.toLowerCase().includes(skillQuery.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(skillQuery.toLowerCase())
  );

  const hasContent = message.trim().length > 0 || attachedFiles.length > 0;

  /* ── Context picker modal (projects + skills in ONE overlay, tabs) ── */
  const picker = isPickerOpen && createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 animate-fade-in"
      onMouseDown={e => { if (e.target === e.currentTarget) { setIsPickerOpen(false); setProjectQuery(''); setSkillQuery(''); } }}
    >
      <div
        className="card flex max-h-[75vh] w-full max-w-lg flex-col overflow-hidden bg-ink-800 animate-pop-in"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h3 className="text-sm font-medium text-ink-50">Add context</h3>
          <button className="icon-btn" onClick={() => setIsPickerOpen(false)} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-2 px-5 pb-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              className="input-base !rounded-full pl-9 !py-2 text-[13px]"
              placeholder="Search projects and skills…"
              value={projectQuery || skillQuery}
              onChange={e => { setProjectQuery(e.target.value); setSkillQuery(e.target.value); }}
              autoFocus
            />
          </div>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-4">
          {filteredProjects.length > 0 && (
            <div className="mb-3">
              <div className="px-1.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-ink-300">Projects</div>
              {filteredProjects.map(project => {
                const isLoaded = loadedProject?.id === project.id;
                return (
                  <button
                    key={project.id}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
                    onClick={() => {
                      if (isLoaded) onUnloadProject?.();
                      else onLoadProject?.(project);
                      setIsPickerOpen(false);
                    }}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${isLoaded ? 'border-amber-200/30 bg-amber-100/10 text-amber-200' : 'border-ink-600 bg-ink-750 text-ink-200'}`}>
                      <Folder size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-ink-50">{project.name}</div>
                      <div className="truncate text-[11px] text-ink-300">{project.files?.length || 0} files · {project.dateString || ''}</div>
                    </div>
                    {isLoaded && <Check size={15} className="shrink-0 text-amber-200" />}
                  </button>
                );
              })}
            </div>
          )}
          {filteredSkills.length > 0 && (
            <div>
              <div className="px-1.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-ink-300">Skills</div>
              {filteredSkills.map(skill => {
                const isLoaded = loadedSkill?.id === skill.id;
                return (
                  <button
                    key={skill.id}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
                    onClick={() => {
                      if (isLoaded) onUnloadSkill?.();
                      else onLoadSkill?.(skill);
                      setIsPickerOpen(false);
                    }}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${isLoaded ? 'border-amber-200/30 bg-amber-100/10 text-amber-200' : 'border-ink-600 bg-ink-750 text-ink-200'}`}>
                      <FilePenLine size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-ink-50">{skill.name}</div>
                      <div className="truncate text-[11px] text-ink-300">{skill.category === 'builtin' ? 'Builtin' : 'Created by me'}</div>
                    </div>
                    {isLoaded && <Check size={15} className="shrink-0 text-amber-200" />}
                  </button>
                );
              })}
            </div>
          )}
          {filteredProjects.length === 0 && filteredSkills.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Sparkles size={20} className="text-ink-400" />
              <p className="text-[13px] text-ink-300">No projects or skills match your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <input type="file" ref={fileInputRef} multiple onChange={handleFilesAdded} className="hidden" />

      <div className={`mx-auto w-full ${isInitial ? 'max-w-[720px]' : 'max-w-[720px]'} ${isInitial ? '' : ''}`}>
        {picker}

        <div
          className={`relative rounded-[26px] border transition-all duration-200 ${
            activeGhost
              ? 'border-ink-500 bg-[#232326] shadow-[0_0_32px_rgba(255,255,255,0.05)]'
              : 'border-ink-600 bg-[#1c1c1c] shadow-lg shadow-black/40 focus-within:border-ink-400'
          }`}
          onClick={() => textareaRef.current?.focus()}
        >
          {/* ghost banner */}
          {activeGhost && (
            <div className="flex items-center justify-between rounded-t-[26px] border-b border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-ink-100">
              <span className="flex items-center gap-2 font-medium">
                <Ghost size={13} /> Ghost mode — this chat won't be saved to history
              </span>
              <button
                className="text-ink-200 underline-offset-2 hover:text-ink-50 hover:underline"
                onClick={e => { e.stopPropagation(); setGhost(false); onToggleGhostMode?.(false); }}
              >
                Turn off
              </button>
            </div>
          )}

          {/* context + attachment chips */}
          {(loadedProject || loadedSkill || attachedFiles.length > 0) && (
            <div className="flex flex-wrap gap-1.5 px-4 pt-3">
              {loadedProject && (
                <div className="flex items-center gap-1.5 rounded-full border border-ink-500 bg-ink-750 py-1 pl-2.5 pr-1.5 text-xs text-ink-100">
                  <Folder size={12} className="text-amber-200/80" />
                  <span className="max-w-[180px] truncate font-medium">{loadedProject.name}</span>
                  <button className="rounded-full p-0.5 text-ink-300 hover:bg-white/[0.08] hover:text-ink-50" onClick={e => { e.stopPropagation(); onUnloadProject?.(); }} aria-label="Remove project">
                    <X size={11} strokeWidth={2.5} />
                  </button>
                </div>
              )}
              {loadedSkill && (
                <div className="flex items-center gap-1.5 rounded-full border border-ink-500 bg-ink-750 py-1 pl-2.5 pr-1.5 text-xs text-ink-100">
                  <FilePenLine size={12} className="text-amber-200/80" />
                  <span className="max-w-[180px] truncate font-medium">{loadedSkill.name}</span>
                  <button className="rounded-full p-0.5 text-ink-300 hover:bg-white/[0.08] hover:text-ink-50" onClick={e => { e.stopPropagation(); onUnloadSkill?.(); }} aria-label="Remove skill">
                    <X size={11} strokeWidth={2.5} />
                  </button>
                </div>
              )}
              {attachedFiles.map(file => (
                <div key={file.id} className="flex items-center gap-1.5 rounded-full border border-ink-500 bg-ink-750 py-1 pl-2.5 pr-1.5 text-xs text-ink-100">
                  <FileText size={12} className="text-ink-200" />
                  <span className="max-w-[160px] truncate font-medium">{file.name}</span>
                  <span className="hidden text-[10px] text-ink-300 sm:inline">{formatTokenCount(file.size)}</span>
                  <button className="rounded-full p-0.5 text-ink-300 hover:bg-white/[0.08] hover:text-ink-50" onClick={e => { e.stopPropagation(); removeAttachedFile(file.id); }} aria-label="Remove file">
                    <X size={11} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* textarea */}
          <div className="px-4 pt-3 pb-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeGhost ? 'Message HyperChat (not saved)…' : 'Message HyperChat…'}
              className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-ink-50 outline-none placeholder:text-ink-300"
              rows={1}
            />
          </div>

          {/* bottom bar */}
          <div className="flex items-center justify-between px-3 pb-3 pt-1" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-1">
              {/* attach button */}
              <div className="relative" ref={attachMenuRef}>
                <button
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                    isAttachMenuOpen
                      ? 'bg-ink-600 text-ink-50 rotate-45'
                      : 'text-ink-200 hover:bg-white/[0.07] hover:text-ink-50'
                  }`}
                  onClick={() => setIsAttachMenuOpen(v => !v)}
                  title="Attach"
                >
                  <Plus size={18} strokeWidth={2} />
                </button>
                {isAttachMenuOpen && (
                  <div className="menu-panel absolute bottom-full left-0 mb-2 animate-pop-in">
                    <button className="menu-item" onClick={() => { setIsAttachMenuOpen(false); fileInputRef.current?.click(); }}>
                      <Paperclip size={14} /> Add files
                    </button>
                    <button className="menu-item" onClick={() => { setIsAttachMenuOpen(false); setIsPickerOpen(true); }}>
                      <Folder size={14} /> Projects & skills
                    </button>
                  </div>
                )}
              </div>

              {/* ghost toggle */}
              {!disableGhostMode && (
                <button
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                    activeGhost
                      ? 'bg-white/[0.09] text-ink-50'
                      : 'text-ink-200 hover:bg-white/[0.07] hover:text-ink-50'
                  }`}
                  onClick={() => { const next = !activeGhost; setGhost(next); onToggleGhostMode?.(next); }}
                  title={activeGhost ? 'Turn off Ghost mode' : 'Ghost mode — temporary chat'}
                >
                  <Ghost size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* model selector */}
              <div className="relative" ref={modelMenuRef}>
                <button
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-ink-200 transition-colors hover:bg-white/[0.07] hover:text-ink-50"
                  onClick={() => setIsModelMenuOpen(v => !v)}
                >
                  <span>{getModelLabel(activeModelId)}</span>
                  <ChevronDown size={13} className={`transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isModelMenuOpen && (
                  <div className="menu-panel absolute bottom-full right-0 mb-2 w-64 animate-pop-in">
                    {CHAT_MODELS.map(model => {
                      const isSelected = activeModelId === model.id;
                      return (
                        <button
                          key={model.id}
                          className="menu-item !items-start !gap-2.5 !py-2.5"
                          onClick={() => { onSelectModel?.(model.id); setIsModelMenuOpen(false); }}
                        >
                          <div className="flex w-full items-center justify-between gap-3">
                            <div className="min-w-0 text-left">
                              <div className={`text-[13px] font-medium ${isSelected ? 'text-ink-50' : 'text-ink-100'}`}>{model.label}</div>
                              <div className="text-[11px] text-ink-300">{model.description}</div>
                            </div>
                            {isSelected && <Check size={14} className="shrink-0 text-amber-200" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* send */}
              <button
                onClick={handleSend}
                disabled={!hasContent}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                  hasContent
                    ? 'bg-amber-100 text-ink-950 hover:bg-amber-50 active:scale-95'
                    : 'bg-ink-600 text-ink-300'
                }`}
                title="Send message"
                aria-label="Send message"
              >
                <ArrowUp size={17} strokeWidth={2.25} />
              </button>
            </div>
          </div>
        </div>

        {/* token readout */}
        <div className="mt-2 text-center text-[11px] text-ink-300">
          {usedTokens > 0
            ? `${usedTokens.toLocaleString()} / ${maxTokens.toLocaleString()} tokens in context`
            : isInitial
              ? 'HyperChat can make mistakes. Verify important information.'
              : ''}
        </div>
      </div>
    </>
  );
}
