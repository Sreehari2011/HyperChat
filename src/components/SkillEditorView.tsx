import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, MoreVertical, Trash2, FilePenLine, Upload, X, Save } from 'lucide-react';
import { Skill, ProjectFile } from '../types';
import { Menu, ConfirmDialog, Toast } from './ui';

interface SkillEditorViewProps {
  skill: Skill;
  onBack: () => void;
  onUpdateSkill: (id: string, updates: Partial<Skill>) => void;
  onDeleteSkill: (id: string) => void;
  onToggleLoadSkill: (id: string) => void;
  isLoaded: boolean;
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export default function SkillEditorView({
  skill,
  onBack,
  onUpdateSkill,
  onDeleteSkill,
  onToggleLoadSkill,
  isLoaded,
}: SkillEditorViewProps) {
  const [name, setName] = useState(skill.name);
  const [description, setDescription] = useState(skill.description || '');
  const [content, setContent] = useState(skill.content || '');
  const [files, setFiles] = useState<ProjectFile[]>(skill.files || []);
  const [isDragging, setIsDragging] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isBuiltin = skill.category === 'builtin';

  useEffect(() => {
    setName(skill.name);
    setDescription(skill.description || '');
    setContent(skill.content || '');
    setFiles(skill.files || []);
  }, [skill.id]);

  const flash = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleNameBlur = () => {
    if (isBuiltin) return;
    if (name.trim() && name.trim() !== skill.name) {
      onUpdateSkill(skill.id, { name: name.trim(), updatedAt: Date.now() });
    }
  };

  const handleDescBlur = () => {
    if (isBuiltin) return;
    if (description.trim() !== (skill.description || '')) {
      onUpdateSkill(skill.id, { description: description.trim(), updatedAt: Date.now() });
    }
  };

  const processFiles = (fileList: FileList | File[]) => {
    const newFiles: ProjectFile[] = [];
    const readers: Promise<void>[] = [];

    Array.from(fileList).forEach(file => {
      const p = new Promise<void>(resolve => {
        const reader = new FileReader();
        reader.onload = () => {
          const text = typeof reader.result === 'string' ? reader.result : '';
          newFiles.push({
            id: Math.random().toString(36).substring(2, 11),
            name: file.name,
            type: 'file',
            size: formatBytes(file.size),
            content: text,
          });
          resolve();
        };
        reader.onerror = () => {
          newFiles.push({
            id: Math.random().toString(36).substring(2, 11),
            name: file.name,
            type: 'file',
            size: formatBytes(file.size),
            content: `// Binary or non-text file: ${file.name}`,
          });
          resolve();
        };
        reader.readAsText(file);
      });
      readers.push(p);
    });

    Promise.all(readers).then(() => {
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      let updatedContent = content;
      newFiles.forEach(f => {
        if (f.content && !f.content.startsWith('// Binary')) {
          if (!updatedContent.trim()) updatedContent = f.content;
          else updatedContent = `${updatedContent}\n\n/* Attached: ${f.name} */\n${f.content}`;
        }
      });
      setContent(updatedContent);
      onUpdateSkill(skill.id, { files: updatedFiles, content: updatedContent, updatedAt: Date.now() });
      if (fileInputRef.current) fileInputRef.current.value = '';
      flash(`Uploaded ${newFiles.length === 1 ? newFiles[0].name : `${newFiles.length} files`}`);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) processFiles(e.target.files);
  };

  const handleDeleteFile = (fileId: string) => {
    const updated = files.filter(f => f.id !== fileId);
    setFiles(updated);
    onUpdateSkill(skill.id, { files: updated, updatedAt: Date.now() });
  };

  const saveContent = () => {
    onUpdateSkill(skill.id, { content: content.trim(), updatedAt: Date.now() });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1600);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="no-scrollbar h-full flex-1 overflow-y-auto bg-ink-900">
      {notification && <Toast message={notification} />}

      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-6 py-8">
        {/* header */}
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <button onClick={onBack} className="icon-btn -ml-2 shrink-0" title="Back to skills">
                <ArrowLeft size={17} />
              </button>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={handleNameBlur}
                readOnly={isBuiltin}
                className="min-w-0 flex-1 border-none bg-transparent p-0 font-serif text-[24px] font-light text-ink-50 outline-none placeholder:text-ink-400"
                placeholder="Skill name"
              />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isLoaded && (
                <span className="badge border border-amber-200/30 bg-amber-100/10 text-amber-200">Loaded</span>
              )}
              <Menu
                items={[
                  { label: isLoaded ? 'Unload skill' : 'Load skill', icon: <Upload size={14} />, onSelect: () => onToggleLoadSkill(skill.id) },
                  ...(!isBuiltin
                    ? [{ label: 'Delete skill', icon: <Trash2 size={14} />, danger: true, separatorBefore: true, onSelect: () => setShowDeleteConfirm(true) } as const]
                    : []),
                ]}
              >
                {({ open, toggle }) => (
                  <button
                    onClick={toggle}
                    className={`icon-btn border border-ink-600 ${open ? 'bg-white/[0.06]' : ''}`}
                    aria-label="More actions"
                  >
                    <MoreVertical size={16} />
                  </button>
                )}
              </Menu>
            </div>
          </div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={handleDescBlur}
            readOnly={isBuiltin}
            rows={2}
            className="resize-none border-none bg-transparent p-0 text-[13px] text-ink-200 outline-none placeholder:text-ink-300"
            placeholder="This skill does… add a brief summary"
          />
          <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-ink-300">
            <span>Created by {skill.author || 'you'}</span>
            {skill.updatedAt && <><span>·</span><span>Updated {new Date(skill.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></>}
            {files.length > 0 && <><span>·</span><span>{files.length} file{files.length > 1 ? 's' : ''}</span></>}
          </div>
        </div>

        {/* editor surface with drag & drop */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
          onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files); }}
          className={`card relative overflow-hidden transition-all ${
            isDragging ? 'border-amber-200/50 !bg-[#231d14]' : ''
          }`}
        >
          {isDragging && (
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-200/60 bg-black/60 backdrop-blur-sm">
              <Upload size={22} className="text-amber-200" />
              <p className="text-[13px] font-medium text-amber-100">Drop files to attach to this skill</p>
            </div>
          )}

          {/* top bar */}
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <FilePenLine size={14} className="text-ink-200" />
              <span className="text-[13px] font-medium text-ink-100">Skill instructions</span>
              <span className="font-mono text-[11px] text-ink-300">
                {content.length > 0 ? `${content.length} chars · ${wordCount} words` : 'Empty'}
              </span>
            </div>
            {!isBuiltin && (
              <div className="flex items-center gap-2">
                <button className="btn-secondary !py-1.5 !px-3 !text-xs" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={12} /> Upload
                </button>
                <button className={`btn-primary !py-1.5 !px-3.5 !text-xs ${justSaved ? '!bg-emerald-400' : ''}`} onClick={saveContent}>
                  {justSaved ? <Check size={12} /> : <Save size={12} />}
                  {justSaved ? 'Saved' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {/* textarea */}
          <div className="flex flex-col gap-3 border-t border-ink-700 bg-[#141414] p-4">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              readOnly={isBuiltin}
              rows={14}
              className="w-full resize-y border-none bg-transparent p-0 text-[12.5px] leading-relaxed text-ink-100 outline-none placeholder:text-ink-400"
              placeholder="Write the instructions, context and operational rules for this skill…"
            />
            {files.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t border-ink-800 pt-3">
                {files.map(file => (
                  <span key={file.id} className="group flex items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-750 px-2.5 py-1 text-[11px] text-ink-200">
                    <Upload size={10} className="text-ink-300" />
                    <span className="max-w-[160px] truncate font-mono" title={file.name}>{file.name}</span>
                    <button
                      className="rounded p-0.5 text-ink-300 hover:bg-white/[0.08] hover:text-ink-50"
                      onClick={() => handleDeleteFile(file.id)}
                      aria-label="Remove file"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* delete confirm */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete skill"
          message={<>Delete <span className="font-medium text-ink-50">“{skill.name}”</span>? This cannot be undone.</>}
          onConfirm={() => { onDeleteSkill(skill.id); setShowDeleteConfirm(false); onBack(); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      <input type="file" ref={fileInputRef} multiple onChange={handleFileUpload} className="hidden" />
    </div>
  );
}
