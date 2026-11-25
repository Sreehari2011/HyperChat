import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Pencil, Copy, RotateCcw, Ghost, Check, FileText } from 'lucide-react';
import ChatInput from './ChatInput';
import TokenCounter from './TokenCounter';
import { ChatSession, Project, Skill } from '../types';
import { stripHiddenContext, estimateTokens } from '../utils';
import { getModelMaxTokens } from '../types';

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
}

/* ── Mini markdown renderer: **bold**, `code`, ```blocks```, -/* lists, [x] todos ── */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith('**')) {
      parts.push(<strong key={`${keyPrefix}-b${i}`} className="font-semibold text-ink-50">{token.slice(2, -2)}</strong>);
    } else {
      parts.push(
        <code key={`${keyPrefix}-c${i}`} className="rounded bg-ink-700 px-1.5 py-0.5 font-mono text-[0.85em] text-amber-100">
          {token.slice(1, -1)}
        </code>
      );
    }
    last = m.index + token.length;
    i++;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MarkdownMessage({ content }: { content: string }) {
  const blocks = useMemo(() => {
    const lines = content.split('\n');
    const out: React.ReactNode[] = [];
    let codeBuffer: string[] | null = null;
    let listBuffer: React.ReactNode[] | null = null;

    const flushList = (key: string) => {
      if (listBuffer && listBuffer.length > 0) {
        out.push(<ul key={`ul-${key}`} className="my-2 flex flex-col gap-1.5 pl-1">{listBuffer}</ul>);
        listBuffer = null;
      }
    };

    lines.forEach((line, idx) => {
      if (line.trim().startsWith('```')) {
        if (codeBuffer === null) {
          flushList(`l${idx}`);
          codeBuffer = [];
        } else {
          out.push(
            <div key={`code-${idx}`} className="my-2 overflow-x-auto rounded-xl border border-ink-700 bg-[#121212]">
              <pre className="p-4 font-mono text-[12px] leading-relaxed text-ink-100">{codeBuffer.join('\n')}</pre>
            </div>
          );
          codeBuffer = null;
        }
        return;
      }
      if (codeBuffer !== null) { codeBuffer.push(line); return; }

      const trimmed = line.trim();
      const todoMatch = trimmed.match(/^[-*]\s*\[([ xX])\]\s*(.*)$/);
      const listMatch = trimmed.match(/^[-*]\s+(?!\[)(.*)$/);
      const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);

      if (todoMatch) {
        const done = todoMatch[1].toLowerCase() === 'x';
        (listBuffer ||= []).push(
          <li key={`li-${idx}`} className="flex items-start gap-2 text-[14px]">
            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${done ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400' : 'border-ink-500'}`}>
              {done && <Check size={10} strokeWidth={3} />}
            </span>
            <span className={done ? 'text-ink-300 line-through' : 'text-ink-100'}>{renderInline(todoMatch[2], `t${idx}`)}</span>
          </li>
        );
        return;
      }
      if (listMatch) {
        (listBuffer ||= []).push(
          <li key={`li-${idx}`} className="flex items-start gap-2 text-[14px] text-ink-100">
            <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-400" />
            <span>{renderInline(listMatch[1], `l${idx}`)}</span>
          </li>
        );
        return;
      }
      if (headingMatch) {
        flushList(`lh${idx}`);
        out.push(
          <div key={`h-${idx}`} className={`mt-3 mb-1.5 font-medium text-ink-50 ${headingMatch[1].length === 1 ? 'text-[16px]' : 'text-[14.5px]'}`}>
            {renderInline(headingMatch[2], `h${idx}`)}
          </div>
        );
        return;
      }
      if (!trimmed) {
        flushList(`e${idx}`);
        out.push(<div key={`sp-${idx}`} className="h-2" />);
        return;
      }
      flushList(`p${idx}`);
      out.push(<p key={`p-${idx}`} className="text-[14px] leading-relaxed text-ink-100">{renderInline(line, `p${idx}`)}</p>);
    });
    return out;
  }, [content]);

  return <div className="flex flex-col">{blocks}</div>;
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
}: ActiveChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [draftTokens, setDraftTokens] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAgentChat = Boolean(chat.agentId || chat.agentName);
  const sessionTokens = useMemo(
    () => (chat.messages || []).reduce((sum, msg) => sum + estimateTokens(msg.content), 0),
    [chat.messages]
  );
  const totalTokens = sessionTokens + draftTokens;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages.length, chat.id]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const actionBtn = 'flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-ink-300 transition-colors hover:bg-white/[0.06] hover:text-ink-100';

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-ink-900">
      {/* top bar */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-ink-800 px-5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {!isAgentChat && chat.isGhost && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-0.5 text-[11px] font-medium text-ink-50">
              <Ghost size={11} /> Ghost
            </span>
          )}
          {chat.agentName && (
            <span className="shrink-0 rounded-full border border-ink-600 bg-ink-750 px-2.5 py-0.5 text-[11px] font-medium text-ink-100">
              {chat.agentName}
            </span>
          )}
          <h2 className="truncate text-[13.5px] font-medium text-ink-200" title={chat.title}>
            {chat.title}
          </h2>
        </div>
        <TokenCounter tokens={totalTokens} maxTokens={getModelMaxTokens(selectedModel)} />
      </div>

      {/* messages */}
      <div className="no-scrollbar flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[720px] flex-col gap-7 px-4 py-8">
          {chat.messages.map(msg => (
            <div key={msg.id} className={`group flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
              {/* attachments on user msg */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className={`flex max-w-[85%] flex-wrap justify-end gap-1.5 ${msg.role === 'user' ? '' : ''}`}>
                  {msg.attachments.map(att => (
                    <span key={att.id} className="flex items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-750 px-2.5 py-1 text-[11px] text-ink-200">
                      <FileText size={11} /> {att.name}
                    </span>
                  ))}
                </div>
              )}

              {/* bubble */}
              {msg.role === 'user' ? (
                <div className="max-w-[85%] rounded-[20px] rounded-br-md bg-ink-750 px-4 py-3 text-[14.5px] leading-relaxed text-ink-50 ring-1 ring-ink-600/60">
                  <div className="whitespace-pre-wrap break-words">
                    {msg.displayText || stripHiddenContext(msg.content) || msg.content}
                  </div>
                </div>
              ) : (
                <div className="max-w-full text-ink-100">
                  <MarkdownMessage content={msg.content} />
                </div>
              )}

              {/* hover actions */}
              <div className={`flex items-center gap-1 ${msg.role === 'user' ? 'pr-1' : 'pl-1'} opacity-0 transition-opacity duration-150 group-hover:opacity-100`}>
                <span className="px-1 text-[11px] text-ink-300">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
                <button className={actionBtn} onClick={() => handleCopy(msg.id, msg.content)} title="Copy">
                  {copiedId === msg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
                {msg.role === 'user' ? (
                  <button className={actionBtn} title="Edit"><Pencil size={12} /></button>
                ) : (
                  <button className={actionBtn} title="Retry"><RotateCcw size={12} /></button>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* composer */}
      <div className="bg-gradient-to-t from-ink-900 via-ink-900 to-transparent pb-4 pt-2">
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
  );
}
