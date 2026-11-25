import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Upload,
  Folder,
  FolderOpen,
  X,
  FileCode2,
  FileText,
  Check,
  Copy,
  ArrowLeft,
  Search,
  Eye,
  MoreVertical,
  Trash2,
  Plus,
  Save,
} from 'lucide-react';
import { Project, ProjectFile } from '../types';
import { formatTokenCount } from '../utils';
import { Menu } from './ui';

interface ProjectDetailsViewProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onWorkOnProject: (project: Project) => void;
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length > 1) return parts.pop()!.toUpperCase();
  return 'FILE';
}

function renderFileIcon(name: string, type: 'file' | 'folder' = 'file') {
  if (type === 'folder') return <Folder size={15} className="shrink-0 text-ink-300" strokeWidth={1.75} />;
  const ext = name.split('.').pop()?.toLowerCase();
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'json', 'html', 'css', 'sql', 'sh'].includes(ext || '')) {
    return <FileCode2 size={15} className="shrink-0 text-ink-200" strokeWidth={1.75} />;
  }
  return <FileText size={15} className="shrink-0 text-ink-300" strokeWidth={1.75} />;
}

export default function ProjectDetailsView({ project, onBack, onUpdateProject, onWorkOnProject }: ProjectDetailsViewProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [instructions, setInstructions] = useState(project.instructions || '');
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(project.name);
    setDescription(project.description || '');
    setInstructions(project.instructions || '');
    setSelectedFile(null);
  }, [project.id]);

  const files = project.files || [];

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter(f => f.name.toLowerCase().includes(q));
  }, [files, searchQuery]);

  const totalTokens = useMemo(
    () => files.reduce((acc, f) => acc + (typeof f.tokens === 'number' ? f.tokens : 0), 0),
    [files]
  );

  const handleNameBlur = () => {
    if (name.trim() && name.trim() !== project.name) {
      onUpdateProject(project.id, { name: name.trim() });
    }
  };

  const handleDescBlur = () => {
    if (description.trim() !== (project.description || '')) {
      onUpdateProject(project.id, { description: description.trim() });
    }
  };

  const handleSaveInstructions = () => {
    onUpdateProject(project.id, { instructions: instructions.trim() });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1600);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded || uploaded.length === 0) return;
    const newFiles: ProjectFile[] = [];
    const readers: Promise<void>[] = [];

    Array.from(uploaded).forEach(file => {
      const p = new Promise<void>(resolve => {
        const reader = new FileReader();
        reader.onload = () => {
          const content = typeof reader.result === 'string' ? reader.result : '';
          const tokens = Math.max(1, Math.ceil(content.length / 4));
          newFiles.push({ id: Math.random().toString(36).substring(2, 11), name: file.name, type: 'file', tokens, size: formatTokenCount(tokens), content });
          resolve();
        };
        reader.onerror = () => {
          newFiles.push({ id: Math.random().toString(36).substring(2, 11), name: file.name, type: 'file', size: formatTokenCount(file.size), content: `// Binary or non-text file: ${file.name}` });
          resolve();
        };
        reader.readAsText(file);
      });
      readers.push(p);
    });

    Promise.all(readers).then(() => {
      onUpdateProject(project.id, { files: [...files, ...newFiles] });
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

  const handleDeleteFile = (fileId: string) => {
    const updated = files.filter(f => f.id !== fileId);
    onUpdateProject(project.id, { files: updated });
    if (selectedFile?.id === fileId) setSelectedFile(null);
  };

  const handleCopyContent = () => {
    if (selectedFile?.content) {
      navigator.clipboard.writeText(selectedFile.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1600);
    }
  };

  /* ── File viewer ── */
  if (selectedFile) {
    const fileLines = selectedFile.content ? selectedFile.content.split('\n') : [];
    return (
      <div className="no-scrollbar h-full flex-1 overflow-y-auto bg-ink-900">
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-6 py-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-[15px]">
              <button onClick={() => setSelectedFile(null)} className="icon-btn -ml-2 shrink-0" title={`Back to ${name}`}>
                <ArrowLeft size={17} />
              </button>
              <button onClick={onBack} className="text-ink-200 hover:text-ink-50">Projects</button>
              <span className="text-ink-400">/</span>
              <button onClick={() => setSelectedFile(null)} className="max-w-[200px] truncate text-ink-200 hover:text-ink-50">{name}</button>
              <span className="text-ink-400">/</span>
              <span className="max-w-[280px] truncate font-medium text-ink-50">{selectedFile.name}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="badge border border-ink-600 bg-ink-750 font-mono text-ink-200">
                {getFileExtension(selectedFile.name)}
              </span>
              <button className="btn-secondary !py-1.5 !text-xs" onClick={handleCopyContent}>
                {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {isCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="card flex flex-1 flex-col overflow-hidden bg-[#141414]">
            <div className="flex items-center justify-between border-b border-ink-700 bg-ink-850 px-4 py-2.5 text-xs text-ink-200">
              <div className="flex items-center gap-2.5">
                <FileCode2 size={14} />
                <span className="font-mono text-ink-100">{selectedFile.name}</span>
              </div>
              <span className="font-mono text-ink-300">{fileLines.length} lines</span>
            </div>
            <div className="flex-1 overflow-x-auto p-4">
              {selectedFile.content ? (
                <table className="w-full border-collapse font-mono text-[12px] leading-relaxed">
                  <tbody>
                    {fileLines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="w-12 select-none border-r border-ink-700 pr-3 pl-1 text-right align-top text-[11px] text-ink-400">
                          {idx + 1}
                        </td>
                        <td className="whitespace-pre pl-4 align-top text-ink-100">{line || ' '}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 text-center font-mono text-xs italic text-ink-300">No preview available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Project home ── */
  return (
    <div className="no-scrollbar h-full flex-1 overflow-y-auto bg-ink-900">
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-6 py-8">
        {/* header */}
        <div className="mb-7 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <button onClick={onBack} className="icon-btn -ml-2 shrink-0" title="Back to projects">
                <ArrowLeft size={17} />
              </button>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={handleNameBlur}
                className="min-w-0 flex-1 border-none bg-transparent p-0 font-serif text-[24px] font-light text-ink-50 outline-none placeholder:text-ink-400"
                placeholder="Project name"
              />
            </div>
            <button className="btn-primary shrink-0" onClick={() => onWorkOnProject(project)}>
              <FolderOpen size={14} /> Work on it
            </button>
          </div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={handleDescBlur}
            className="resize-none border-none bg-transparent p-0 text-[13px] text-ink-200 outline-none placeholder:text-ink-300"
            placeholder="Add a description…"
            rows={2}
          />
        </div>

        {/* instructions */}
        <div className="card mb-7 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[13px] font-medium text-ink-100">Project instructions</h2>
              <span className="font-mono text-[11px] text-ink-300">
                {instructions.trim() ? `${instructions.length} chars` : 'Empty'}
              </span>
            </div>
            <button
              className="icon-btn"
              onClick={() => setIsInstructionsOpen(v => !v)}
              title={isInstructionsOpen ? 'Collapse' : 'Edit instructions'}
            >
              <Plus size={15} className={`transition-transform duration-200 ${isInstructionsOpen ? 'rotate-45' : ''}`} />
            </button>
          </div>

          {isInstructionsOpen ? (
            <div className="flex flex-col gap-3 border-t border-ink-700 p-4">
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                rows={6}
                className="input-base min-h-[120px] resize-y !text-[13px]"
                placeholder="Add guidelines, context and prompts to tailor how this project is handled…"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-ink-300">{instructions.length} characters</span>
                <button className={`btn-primary !py-1.5 !px-3.5 !text-xs ${justSaved ? '!bg-emerald-400' : ''}`} onClick={handleSaveInstructions}>
                  {justSaved ? <Check size={12} /> : <Save size={12} />}
                  {justSaved ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            instructions.trim() && (
              <button
                className="border-t border-ink-700 px-4 py-3 text-left text-[12px] text-ink-200 hover:text-ink-100"
                onClick={() => setIsInstructionsOpen(true)}
              >
                <span className="line-clamp-2">{instructions}</span>
                <span className="mt-1 block text-[11px] text-ink-300">Click to edit</span>
              </button>
            )
          )}
        </div>

        {/* files */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[13px] font-medium text-ink-100">Files</h2>
              <span className="badge border border-ink-600 bg-ink-750 font-mono text-ink-200">{files.length}</span>
              {totalTokens > 0 && <span className="font-mono text-[11px] text-ink-300">{formatTokenCount(totalTokens)}</span>}
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search files…"
                  className="search-input !w-44 !py-1.5 !text-xs"
                />
              </div>
              <button className="btn-secondary !py-1.5 !px-3.5 !text-xs" onClick={() => fileInputRef.current?.click()}>
                <Upload size={13} /> Upload
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
            </div>
          </div>

          {filteredFiles.length === 0 ? (
            <button
              className="mt-8 flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-ink-600 py-12 text-ink-300 transition-colors hover:border-ink-400 hover:text-ink-200"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={20} />
              <span className="text-[13px]">
                {searchQuery ? `No files matching "${searchQuery}"` : 'Drop in files — they become project context'}
              </span>
            </button>
          ) : (
            <div className="flex flex-col">
              {filteredFiles.map(file => (
                <div
                  key={file.id}
                  className="group flex cursor-pointer items-center justify-between border-b border-ink-800 px-4 py-3.5 transition-colors hover:bg-white/[0.03]"
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {renderFileIcon(file.name, file.type)}
                    <span className="truncate text-[13.5px] font-medium text-ink-100 group-hover:text-ink-50">{file.name}</span>
                    {file.tokens && <span className="shrink-0 font-mono text-[11px] text-ink-300">{formatTokenCount(file.tokens)}</span>}
                  </div>
                  <div className="flex shrink-0 items-center" onClick={e => e.stopPropagation()}>
                    <Menu
                      items={[
                        { label: 'View file', icon: <Eye size={14} />, onSelect: () => setSelectedFile(file) },
                        { label: 'Delete', icon: <Trash2 size={14} />, danger: true, separatorBefore: true, onSelect: () => handleDeleteFile(file.id) },
                      ]}
                    >
                      {({ open, toggle }) => (
                        <button
                          onClick={toggle}
                          className={`rounded-md p-1.5 text-ink-300 transition-all hover:bg-white/[0.08] hover:text-ink-50 ${
                            open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                          aria-label="File options"
                        >
                          <MoreVertical size={16} />
                        </button>
                      )}
                    </Menu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
