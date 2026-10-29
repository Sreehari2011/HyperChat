import React, { useState, useEffect, useRef } from 'react';
import { Skill, ProjectFile } from '../types';
import { 
  ArrowLeft, 
  Check, 
  MoreHorizontal, 
  Trash2, 
  FilePenLine,
  Upload,
  X
} from 'lucide-react';

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

interface SkillEditorViewProps {
  skill: Skill;
  onBack: () => void;
  onUpdateSkill: (id: string, updates: Partial<Skill>) => void;
  onDeleteSkill: (id: string) => void;
  onToggleLoadSkill?: (id: string) => void;
  isLoaded?: boolean;
}

export default function SkillEditorView({
  skill,
  onBack,
  onUpdateSkill,
  onDeleteSkill,
  onToggleLoadSkill,
  isLoaded = false
}: SkillEditorViewProps) {
  const [name, setName] = useState(skill.name);
  const [description, setDescription] = useState(skill.description || '');
  const [content, setContent] = useState(skill.content || '');
  const [files, setFiles] = useState<ProjectFile[]>(skill.files || []);
  const [isInstructionsSaved, setIsInstructionsSaved] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    setName(skill.name);
    setDescription(skill.description || '');
    setContent(skill.content || '');
    setFiles(skill.files || []);
  }, [skill.id]);

  // Automatically save name and description modifications without needing to click any button
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (skill.category === 'builtin') return;

    const timer = setTimeout(() => {
      onUpdateSkill(skill.id, {
        name: name.trim() || 'Untitled Skill',
        description: description.trim(),
        updatedAt: Date.now()
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [name, description, skill.id, skill.category]);

  const handleBlurName = () => {
    if (skill.category === 'builtin') return;
    onUpdateSkill(skill.id, {
      name: name.trim() || 'Untitled Skill',
      updatedAt: Date.now()
    });
  };

  const handleBlurDescription = () => {
    if (skill.category === 'builtin') return;
    onUpdateSkill(skill.id, {
      description: description.trim(),
      updatedAt: Date.now()
    });
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const processFiles = (fileList: FileList | File[]) => {
    const newFiles: ProjectFile[] = [];
    const readers: Promise<void>[] = [];

    Array.from(fileList).forEach(file => {
      const p = new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const textContent = typeof reader.result === 'string' ? reader.result : '';
          newFiles.push({
            id: Math.random().toString(36).substring(2, 11),
            name: file.name,
            type: 'file',
            size: formatBytes(file.size),
            content: textContent
          });
          resolve();
        };
        reader.onerror = () => {
          newFiles.push({
            id: Math.random().toString(36).substring(2, 11),
            name: file.name,
            type: 'file',
            size: formatBytes(file.size),
            content: `// Binary or non-text file: ${file.name}`
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

      // Auto-append or populate instruction content if it has text
      let updatedContent = content;
      newFiles.forEach(f => {
        if (f.content && !f.content.startsWith('// Binary')) {
          if (!updatedContent.trim()) {
            updatedContent = f.content;
          } else {
            updatedContent = `${updatedContent}\n\n/* Attached: ${f.name} */\n${f.content}`;
          }
        }
      });
      setContent(updatedContent);

      onUpdateSkill(skill.id, {
        files: updatedFiles,
        content: updatedContent,
        updatedAt: Date.now()
      });

      if (fileInputRef.current) fileInputRef.current.value = '';
      setNotification(`Uploaded ${newFiles.length === 1 ? newFiles[0].name : `${newFiles.length} files`}`);
      setTimeout(() => setNotification(null), 3000);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onUpdateSkill(skill.id, {
      files: updatedFiles,
      updatedAt: Date.now()
    });
  };

  const handleInsertFileContent = (file: ProjectFile) => {
    if (!file.content) return;
    const newContent = content.trim() 
      ? `${content}\n\n/* Content from ${file.name}: */\n${file.content}`
      : file.content;
    
    setContent(newContent);
    setNotification(`Inserted contents of ${file.name} into instructions`);
    setTimeout(() => setNotification(null), 2500);
  };

  const isDirty = 
    name.trim() !== (skill.name || '') ||
    description.trim() !== (skill.description || '') ||
    content !== (skill.content || '') ||
    JSON.stringify(files) !== JSON.stringify(skill.files || []);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#141414] text-[#e4e4e7] overflow-y-auto no-scrollbar">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        id="skill-file-upload-input"
      />

      <div className="max-w-5xl w-full mx-auto px-5 sm:px-8 py-7 flex flex-col min-h-full">
        
        {/* Skill Header */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-start justify-between gap-4">
            {/* Title & Description Input Area */}
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <button 
                  type="button"
                  onClick={onBack}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer shrink-0 group text-2xl font-serif"
                  title="Back to Skills"
                >
                  <ArrowLeft size={19} className="text-zinc-400 group-hover:text-zinc-100 transition-transform group-hover:-translate-x-0.5" />
                  <span>Skills</span>
                  <span className="text-zinc-600 select-none ml-1">/</span>
                </button>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleBlurName}
                  readOnly={skill.category === 'builtin'}
                  className="text-2xl font-serif text-zinc-100 bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder:text-zinc-600 flex-1 min-w-0"
                  placeholder="Skill Name"
                />
                {skill.category === 'builtin' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide shrink-0 bg-[#242424] text-zinc-400 border border-[#333]">
                    Builtin (Read-only)
                  </span>
                )}
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleBlurDescription}
                readOnly={skill.category === 'builtin'}
                rows={2}
                className="text-sm text-zinc-400 bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder:text-zinc-600 resize-none leading-relaxed w-full"
                placeholder="This skill does... Add a brief summary"
              />
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                <span>Created by {skill.author || 'you'}</span>
                {skill.updatedAt && (
                  <>
                    <span className="text-zinc-700">•</span>
                    <span>
                      Updated {new Date(skill.updatedAt).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </>
                )}
                {files.length > 0 && (
                  <>
                    <span className="text-zinc-700">•</span>
                    <span>{files.length} {files.length === 1 ? 'file' : 'files'} attached</span>
                  </>
                )}
              </div>
            </div>

            {/* Top Right Action: Three Dots Options */}
            <div className="flex items-center gap-2.5 shrink-0 pt-1">
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-[#252525] border border-[#2a2a2a] rounded-full transition-colors cursor-pointer"
                  title="More actions"
                >
                  <MoreHorizontal size={16} />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-[#1d1d1d] border border-[#2f2f2f] rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {onToggleLoadSkill && (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleLoadSkill(skill.id);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs text-zinc-200 hover:bg-[#282828] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <FilePenLine size={13} className="text-zinc-400" />
                        <span>{isLoaded ? 'Unload skill' : 'Load skill'}</span>
                      </button>
                    )}

                    {skill.category !== 'builtin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setShowDeleteConfirm(true);
                        }}
                        className={`w-full px-3.5 py-2 text-left text-xs text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 flex items-center gap-2 transition-colors cursor-pointer ${onToggleLoadSkill ? 'border-t border-[#262626]' : ''}`}
                      >
                        <Trash2 size={13} />
                        <span>Delete skill</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Floating feedback notification */}
        {notification && (
          <div className="mb-4 px-3.5 py-2 bg-[#202020] border border-[#333] rounded-lg text-xs text-zinc-200 flex items-center justify-between animate-in fade-in duration-150">
            <span className="flex items-center gap-2">
              <Check size={13} className="text-emerald-500" />
              {notification}
            </span>
            <button 
              onClick={() => setNotification(null)}
              className="text-zinc-500 hover:text-zinc-300 p-0.5"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Instructions Container with Drag and Drop - Modern & Sleek */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border rounded-xl overflow-hidden transition-all relative bg-[#181818] ${
            isDragging 
              ? 'border-blue-500/70 bg-[#1b1e24]' 
              : 'border-[#262626] hover:border-[#303030]'
          }`}
        >
          {isDragging && (
            <div className="absolute inset-0 bg-[#161a22]/90 backdrop-blur-xs rounded-xl border-2 border-dashed border-blue-500/80 flex flex-col items-center justify-center gap-2 z-20 pointer-events-none">
              <Upload size={24} className="text-blue-400 animate-bounce" />
              <p className="text-sm font-medium text-blue-200">Drop files here to upload to skill</p>
            </div>
          )}

          {/* Top Bar with actions */}
          <div className="px-4 py-3 flex items-center justify-between gap-3 bg-[#181818]">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-zinc-200">
                Skill Instructions
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                {charCount > 0 ? `${charCount} chars (${wordCount} words)` : 'Empty'}
              </span>
            </div>

            {skill.category !== 'builtin' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerUpload}
                  className="flex items-center gap-1.5 bg-[#1f1f1f] hover:bg-[#272727] border border-[#2d2d2d] hover:border-[#3d3d3d] text-zinc-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs"
                >
                  <Upload size={13} />
                  <span>Upload File</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateSkill(skill.id, { content: content.trim(), updatedAt: Date.now() });
                    setIsInstructionsSaved(true);
                    setTimeout(() => setIsInstructionsSaved(false), 2000);
                  }}
                  className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                >
                  {isInstructionsSaved ? 'Saved' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {/* Full-bleed Editor Surface */}
          <div className="border-t border-[#222] bg-[#141414] p-4 flex flex-col gap-3">
            <textarea 
              value={content}
              onChange={e => setContent(e.target.value)}
              readOnly={skill.category === 'builtin'}
              rows={18}
              placeholder="Write the instructions, context, and operational rules for this skill..."
              className="w-full bg-transparent border-none text-xs text-zinc-200 focus:outline-none resize-y min-h-[360px] leading-relaxed font-sans placeholder:text-zinc-600 p-0"
            />

            {/* Uploaded File Chips */}
            {files.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#202020]">
                {files.map(file => (
                  <div 
                    key={file.id} 
                    className="inline-flex items-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] text-zinc-300 text-xs px-2.5 py-1 rounded-lg group"
                  >
                    <Upload size={11} className="text-zinc-500" />
                    <span className="max-w-[160px] truncate font-mono text-[11px]" title={file.name}>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-zinc-500 hover:text-zinc-200 p-0.5 rounded hover:bg-[#252525] transition-colors cursor-pointer"
                      title="Remove uploaded file"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#1c1c1c] border border-[#2c2c2c] rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col">
            <h3 className="text-base font-medium text-zinc-100 mb-2">Delete skill?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Are you sure you want to delete <strong className="text-zinc-200">{skill.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-[#252525] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSkill(skill.id);
                  setShowDeleteConfirm(false);
                  onBack();
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

