import React, { useState } from 'react';
import { 
  ChevronDown, 
  Paperclip, 
  CheckSquare, 
  Square, 
  PackageCheck, 
  PanelRightClose,
  FileCode,
  FileText,
  FileSpreadsheet,
  FileImage,
  ExternalLink,
  Copy,
  Check,
  X,
  Eye,
  Sparkles,
  Download
} from 'lucide-react';
import { ChatAttachment, ChatTodo, ChatDeliverable } from '../types';

interface ChatRhsMenuProps {
  uploads: ChatAttachment[];
  todos: ChatTodo[];
  deliverables: ChatDeliverable[];
  isOpen: boolean;
  onClose: () => void;
  onToggleTodo?: (id: string) => void;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext || '')) {
    return <FileImage size={15} className="text-amber-400 shrink-0" />;
  }
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'json', 'html', 'css', 'sql', 'sh'].includes(ext || '')) {
    return <FileCode size={15} className="text-emerald-400 shrink-0" />;
  }
  if (['csv', 'xlsx', 'xls'].includes(ext || '')) {
    return <FileSpreadsheet size={15} className="text-blue-400 shrink-0" />;
  }
  return <FileText size={15} className="text-zinc-400 shrink-0" />;
}

export default function ChatRhsMenu({
  uploads,
  todos,
  deliverables,
  isOpen,
  onClose,
  onToggleTodo
}: ChatRhsMenuProps) {
  // Accordion open/close states
  const [uploadsOpen, setUploadsOpen] = useState(true);
  const [deliveredOpen, setDeliveredOpen] = useState(true);

  // Preview modal state
  const [previewItem, setPreviewItem] = useState<{
    title: string;
    type: 'upload' | 'deliverable';
    content?: string;
    size?: string | number;
    meta?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // If none of the 3 items are present, the sidebar should not open
  const hasAnyItems = uploads.length > 0 || todos.length > 0 || deliverables.length > 0;
  if (!hasAnyItems || !isOpen) {
    return null;
  }

  const completedTodosCount = todos.filter(t => t.completed).length;
  const progressPercent = todos.length > 0 ? Math.round((completedTodosCount / todos.length) * 100) : 0;

  const handleCopyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <aside 
        className="w-[340px] flex flex-col h-full bg-[#111] border-l border-[#222] flex-shrink-0 select-none overflow-hidden relative z-20 animate-in slide-in-from-right duration-200"
        aria-label="In this chat sidebar"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-[60px] border-b border-[#222] flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base font-semibold text-zinc-100 tracking-wide font-serif truncate">
              In this Chat
            </span>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/[0.06] rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0 cursor-pointer"
            title="Collapse Sidebar"
          >
            <PanelRightClose size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Content sections */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 flex flex-col gap-4">
          
          {/* 1. UPLOADS DROPDOWN SECTION */}
          {uploads.length > 0 && (
            <div className="border border-[#222] bg-[#161616] rounded-xl overflow-hidden transition-colors">
              <button
                onClick={() => setUploadsOpen(prev => !prev)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-white/[0.03] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#222] flex items-center justify-center text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    <Paperclip size={13} strokeWidth={2} />
                  </div>
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-white">
                    Uploads
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#242424] text-zinc-400 border border-[#333] font-mono">
                    {uploads.length}
                  </span>
                </div>
                <ChevronDown 
                  size={15} 
                  className={`text-zinc-400 transition-transform duration-200 ${uploadsOpen ? 'rotate-180 text-zinc-200' : ''}`} 
                />
              </button>

              {uploadsOpen && (
                <div className="p-2 pt-0 flex flex-col gap-1.5 border-t border-[#222]/60">
                  {uploads.map((file) => (
                    <div 
                      key={file.id}
                      className="group/file flex items-center justify-between p-2 rounded-lg bg-[#1c1c1c] hover:bg-[#252525] border border-transparent hover:border-[#333] transition-all cursor-pointer"
                      onClick={() => setPreviewItem({
                        title: file.name,
                        type: 'upload',
                        content: file.content || `File: ${file.name}\nSize: ${typeof file.size === 'number' ? `${(file.size / 1024).toFixed(1)} KB` : file.size}\n\n[Uploaded in this session]`,
                        size: file.size,
                        meta: 'Uploaded file'
                      })}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        {getFileIcon(file.name)}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-zinc-200 truncate group-hover/file:text-white block">
                            {file.name}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {typeof file.size === 'number' ? `${(file.size / 1024).toFixed(1)} KB` : file.size}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-60 group-hover/file:opacity-100 transition-opacity">
                        <button 
                          className="p-1 text-zinc-400 hover:text-zinc-200 rounded"
                          title="Inspect uploaded file"
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. TODOS SECTION (Multi planning steps) */}
          {todos.length > 0 && (
            <div className="border border-[#222] bg-[#161616] rounded-xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#222] flex items-center justify-center text-zinc-300">
                    <CheckSquare size={13} strokeWidth={2} />
                  </div>
                  <span className="text-sm font-medium text-zinc-200">
                    Todos
                  </span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#242424] text-zinc-400 border border-[#333]">
                  {completedTodosCount}/{todos.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#222] h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500/80 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Steps list */}
              <div className="flex flex-col gap-2 mt-1">
                {todos.map((todo, index) => {
                  const stepNum = todo.stepNumber || index + 1;
                  return (
                    <div 
                      key={todo.id}
                      onClick={() => onToggleTodo?.(todo.id)}
                      className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors cursor-pointer group ${
                        todo.completed 
                          ? 'bg-[#181818] text-zinc-500 border border-[#202020]' 
                          : 'bg-[#1c1c1c] text-zinc-300 border border-transparent hover:border-[#333]'
                      }`}
                    >
                      <button 
                        type="button"
                        className="mt-0.5 flex-shrink-0 text-zinc-400 group-hover:text-zinc-200 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTodo?.(todo.id);
                        }}
                      >
                        {todo.completed ? (
                          <div className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                            <Check size={11} strokeWidth={2.5} />
                          </div>
                        ) : (
                          <Square size={14} className="text-zinc-500 group-hover:text-zinc-300" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                            Step {stepNum}
                          </span>
                          {todo.completed && (
                            <span className="text-[9px] uppercase tracking-wider font-medium text-emerald-400 bg-emerald-950/40 px-1 rounded border border-emerald-900/30">
                              Done
                            </span>
                          )}
                        </div>
                        <p className={`text-xs leading-relaxed ${todo.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                          {todo.title}
                        </p>
                        {todo.description && (
                          <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                            {todo.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. DELIVERED DROPDOWN SECTION */}
          {deliverables.length > 0 && (
            <div className="border border-[#222] bg-[#161616] rounded-xl overflow-hidden transition-colors">
              <button
                onClick={() => setDeliveredOpen(prev => !prev)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-white/[0.03] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#222] flex items-center justify-center text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    <PackageCheck size={13} strokeWidth={2} />
                  </div>
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-white">
                    Delivered
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#1b263b] text-blue-400 border border-blue-900/40 font-mono">
                    {deliverables.length}
                  </span>
                </div>
                <ChevronDown 
                  size={15} 
                  className={`text-zinc-400 transition-transform duration-200 ${deliveredOpen ? 'rotate-180 text-zinc-200' : ''}`} 
                />
              </button>

              {deliveredOpen && (
                <div className="p-2 pt-0 flex flex-col gap-1.5 border-t border-[#222]/60">
                  {deliverables.map((item) => (
                    <div 
                      key={item.id}
                      className="group/item flex items-center justify-between p-2 rounded-lg bg-[#1c1c1c] hover:bg-[#252525] border border-transparent hover:border-[#333] transition-all cursor-pointer"
                      onClick={() => setPreviewItem({
                        title: item.name,
                        type: 'deliverable',
                        content: item.content || `// Generated deliverable: ${item.name}\n// Created in this session\n\nexport const deliverable = {\n  name: "${item.name}",\n  timestamp: Date.now()\n};`,
                        size: item.size || 'Generated',
                        meta: item.type ? `Type: ${item.type}` : 'AI Generated Artifact'
                      })}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        {getFileIcon(item.name)}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-zinc-200 truncate group-hover/item:text-white block font-mono">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            {item.size || 'Generated artifact'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-60 group-hover/item:opacity-100 transition-opacity">
                        <button 
                          className="p-1 text-zinc-400 hover:text-zinc-200 rounded"
                          title="View delivered artifact"
                        >
                          <ExternalLink size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </aside>

      {/* Item Viewer / Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#262626] bg-[#141414]">
              <div className="flex items-center gap-3 min-w-0">
                {getFileIcon(previewItem.title)}
                <div className="flex flex-col min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-100 truncate font-mono">
                    {previewItem.title}
                  </h3>
                  <span className="text-xs text-zinc-400">
                    {previewItem.type === 'upload' ? 'Uploaded attachment' : 'Delivered artifact'} • {previewItem.meta || previewItem.size}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previewItem.content && (
                  <button 
                    onClick={() => handleCopyContent(previewItem.content || '')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#242424] hover:bg-[#303030] text-xs font-medium text-zinc-200 border border-[#333] transition-colors"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
                <button 
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 rounded-lg hover:bg-[#282828] text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 font-mono text-xs text-zinc-300 leading-relaxed bg-[#111] whitespace-pre-wrap selection:bg-zinc-700">
              {previewItem.content || 'No preview content available.'}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-[#262626] bg-[#141414] flex items-center justify-between text-xs text-zinc-500">
              <span>Hypervisor Chat Inspector</span>
              <button
                onClick={() => setPreviewItem(null)}
                className="px-3 py-1 rounded bg-[#242424] hover:bg-[#2e2e2e] text-zinc-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
