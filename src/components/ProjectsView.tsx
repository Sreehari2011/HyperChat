import React, { useState } from 'react';
import { Search, MoreVertical, Folder, FolderOpen, Flag, Pencil, Trash2, FileCode2, Plus } from 'lucide-react';
import { Project } from '../types';
import { Menu, ConfirmDialog, Modal, Field } from './ui';

interface ProjectsViewProps {
  projects: Project[];
  onDeleteProject: (id: string) => void;
  onCreateProject: (name: string, description: string) => void;
  onSelectProject: (id: string) => void;
  onWorkOnProject: (project: Project) => void;
  onToggleProjectFlag: (id: string) => void;
  onRenameProject: (id: string, newTitle: string) => void;
}

export default function ProjectsView({
  projects,
  onDeleteProject,
  onCreateProject,
  onSelectProject,
  onWorkOnProject,
  onToggleProjectFlag,
  onRenameProject,
}: ProjectsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [renaming, setRenaming] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const submitRename = () => {
    if (renaming && renameValue.trim()) onRenameProject(renaming.id, renameValue.trim());
    setRenaming(null);
  };

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreateProject(newName.trim(), newDescription.trim());
    setNewName('');
    setNewDescription('');
    setIsCreateOpen(false);
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-ink-900 no-scrollbar">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-8">
        {/* header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-[22px] font-light text-ink-50">Projects</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search projects…"
                className="search-input"
              />
            </div>
            <button className="btn-primary" onClick={() => setIsCreateOpen(true)}>
              <Plus size={15} /> New project
            </button>
          </div>
        </div>

        {/* grid */}
        <div className="flex-1 pb-12">
          {filteredProjects.length === 0 ? (
            <div className="mt-20 flex flex-col items-center gap-3 text-center">
              <Folder size={26} className="text-ink-400" />
              <p className="text-sm text-ink-200">
                {searchQuery ? `No projects matching "${searchQuery}"` : 'No projects yet — create one to give your chats persistent context.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map(project => (
                <div
                  key={project.id}
                  className="card group relative flex min-h-[124px] cursor-pointer flex-col p-4"
                  onClick={() => onSelectProject(project.id)}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-[14px] font-medium text-ink-50">{project.name}</h3>
                    <div onClick={e => e.stopPropagation()}>
                      <Menu
                        items={[
                          { label: 'Work on it', icon: <FolderOpen size={14} />, onSelect: () => onWorkOnProject(project) },
                          { label: project.isFlagged ? 'Unflag' : 'Flag', icon: <Flag size={14} />, onSelect: () => onToggleProjectFlag(project.id) },
                          { label: 'Rename', icon: <Pencil size={14} />, onSelect: () => { setRenaming(project); setRenameValue(project.name); } },
                          { label: 'Delete', icon: <Trash2 size={14} />, danger: true, separatorBefore: true, onSelect: () => setDeleting(project) },
                        ]}
                      >
                        {({ open, toggle }) => (
                          <button
                            onClick={toggle}
                            className={`rounded-md p-1 text-ink-300 transition-all hover:bg-white/[0.08] hover:text-ink-50 ${
                              open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                            aria-label="Project options"
                          >
                            <MoreVertical size={15} />
                          </button>
                        )}
                      </Menu>
                    </div>
                  </div>
                  {project.description && (
                    <p className="line-clamp-2 text-[12.5px] leading-relaxed text-ink-200">{project.description}</p>
                  )}
                  <div className="mt-auto flex items-center gap-2.5 pt-3 text-[11.5px] text-ink-300">
                    {project.isFlagged && <Flag size={11} className="text-amber-400/80" strokeWidth={2.25} />}
                    <span className="flex items-center gap-1">
                      <FileCode2 size={11} />
                      {project.files?.length || 0}
                    </span>
                    <span>·</span>
                    <span>{project.dateString || ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* create modal */}
      {isCreateOpen && (
        <Modal
          title="New project"
          subtitle="Projects carry files and instructions into every chat that loads them."
          onClose={() => setIsCreateOpen(false)}
          widthClass="max-w-lg"
          footer={
            <>
              <button className="btn-ghost" onClick={() => setIsCreateOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={submitCreate as unknown as () => void} disabled={!newName.trim()}>Create</button>
            </>
          }
        >
          <form onSubmit={submitCreate}>
            <Field label="Name">
              <input className="input-base" autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Website redesign" />
            </Field>
            <Field label="Description" hint="optional">
              <textarea
                className="input-base min-h-[90px] resize-y"
                rows={4}
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="What is this project about?"
              />
            </Field>
          </form>
        </Modal>
      )}

      {/* rename modal */}
      {renaming && (
        <Modal
          title="Rename project"
          onClose={() => setRenaming(null)}
          footer={
            <>
              <button className="btn-ghost" onClick={() => setRenaming(null)}>Cancel</button>
              <button className="btn-primary" onClick={submitRename} disabled={!renameValue.trim()}>Rename</button>
            </>
          }
        >
          <Field label="New name">
            <input
              className="input-base"
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitRename(); }}
            />
          </Field>
        </Modal>
      )}

      {/* delete confirm */}
      {deleting && (
        <ConfirmDialog
          title="Delete project"
          message={<>Delete <span className="font-medium text-ink-50">“{deleting.name}”</span> and its files? This cannot be undone.</>}
          onConfirm={() => { onDeleteProject(deleting.id); setDeleting(null); }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
