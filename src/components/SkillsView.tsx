import React, { useState } from 'react';
import { Search, MoreVertical, Pencil, Trash2, Flag, FilePenLine, Plus, Upload } from 'lucide-react';
import { Skill } from '../types';
import { Menu, ConfirmDialog, Modal, Field } from './ui';

interface SkillsViewProps {
  skills: Skill[];
  onCreateSkill: (name: string, description: string, content: string) => void;
  onUpdateSkill: (id: string, updates: Partial<Skill>) => void;
  onDeleteSkill: (id: string) => void;
  onToggleLoadSkill: (id: string) => void;
  onSelectSkill: (id: string) => void;
  loadedSkill?: Skill | null;
}

type TabType = 'library' | 'created' | 'builtin';

export default function SkillsView({
  skills,
  onCreateSkill,
  onUpdateSkill,
  onDeleteSkill,
  onToggleLoadSkill,
  onSelectSkill,
  loadedSkill,
}: SkillsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newContent, setNewContent] = useState('');
  const [renaming, setRenaming] = useState<Skill | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleting, setDeleting] = useState<Skill | null>(null);

  const filteredSkills = skills.filter(skill => {
    if (activeTab === 'builtin' && skill.category !== 'builtin') return false;
    if (activeTab === 'created' && skill.category !== 'custom') return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      skill.name.toLowerCase().includes(q) ||
      skill.description.toLowerCase().includes(q) ||
      (skill.author || '').toLowerCase().includes(q)
    );
  });

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreateSkill(newName.trim(), newDesc.trim(), newContent.trim());
    setNewName('');
    setNewDesc('');
    setNewContent('');
    setIsCreateOpen(false);
  };

  const submitRename = () => {
    if (renaming && renameValue.trim()) {
      onUpdateSkill(renaming.id, { name: renameValue.trim(), updatedAt: Date.now() });
    }
    setRenaming(null);
  };

  const skillMenuItems = (skill: Skill) => [
    {
      label: loadedSkill?.id === skill.id ? 'Unload skill' : 'Load skill',
      icon: <Upload size={14} />,
      onSelect: () => onToggleLoadSkill(skill.id),
    },
    ...(skill.category !== 'builtin'
      ? [
          { label: 'Edit skill', icon: <Pencil size={14} />, onSelect: () => onSelectSkill(skill.id) },
          { label: 'Rename', icon: <FilePenLine size={14} />, onSelect: () => { setRenaming(skill); setRenameValue(skill.name); } },
          { label: 'Delete', icon: <Trash2 size={14} />, danger: true, separatorBefore: true, onSelect: () => setDeleting(skill) },
        ]
      : []),
  ];

  const tabs: { id: TabType; label: string }[] = [
    { id: 'library', label: 'Library' },
    { id: 'created', label: 'Created by me' },
    { id: 'builtin', label: 'Builtin' },
  ];

  return (
    <div className="no-scrollbar flex h-full flex-1 flex-col overflow-y-auto bg-ink-900">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-8">
        {/* header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-[22px] font-light text-ink-50">Skills</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search skills…"
                className="search-input"
              />
            </div>
            <button className="btn-primary" onClick={() => setIsCreateOpen(true)}>
              <Plus size={15} /> New skill
            </button>
          </div>
        </div>

        {/* tabs */}
        <div className="mb-6 flex items-center gap-1 border-b border-ink-800 pb-3">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                activeTab === tab.id ? 'bg-white/[0.07] text-ink-50' : 'text-ink-200 hover:bg-white/[0.04] hover:text-ink-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* content */}
        <div className="flex-1 pb-12">
          {filteredSkills.length === 0 ? (
            <div className="mt-20 flex flex-col items-center gap-3 text-center">
              <FilePenLine size={24} className="text-ink-400" />
              <p className="text-sm text-ink-200">
                {searchQuery
                  ? `No skills matching "${searchQuery}"`
                  : activeTab === 'created'
                    ? 'No skills created yet — write one to teach the agent a reusable playbook.'
                    : 'No skills here yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredSkills.map(skill => {
                const isLoaded = loadedSkill?.id === skill.id;
                return (
                  <div
                    key={skill.id}
                    className="card group flex cursor-pointer flex-col p-4"
                    onClick={() => {
                      if (skill.category !== 'builtin') onSelectSkill(skill.id);
                      else onToggleLoadSkill(skill.id);
                    }}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <h3 className="truncate text-[14px] font-medium text-ink-50">{skill.name}</h3>
                        <span className={`badge shrink-0 border ${isLoaded
                          ? 'border-amber-200/30 bg-amber-100/10 text-amber-200'
                          : skill.category === 'builtin'
                            ? 'border-ink-600 bg-ink-750 text-ink-200'
                            : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'}`}>
                          {isLoaded ? 'Loaded' : skill.category === 'builtin' ? 'Builtin' : 'Mine'}
                        </span>
                      </div>
                      <div onClick={e => e.stopPropagation()}>
                        <Menu items={skillMenuItems(skill)}>
                          {({ open, toggle }) => (
                            <button
                              onClick={toggle}
                              className={`rounded-md p-1 text-ink-300 transition-all hover:bg-white/[0.08] hover:text-ink-50 ${
                                open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              aria-label="Skill options"
                            >
                              <MoreVertical size={15} />
                            </button>
                          )}
                        </Menu>
                      </div>
                    </div>
                    <p className="line-clamp-2 text-[12.5px] leading-relaxed text-ink-200">{skill.description}</p>
                    <div className="mt-auto flex items-center gap-2 pt-3 text-[11px] text-ink-300">
                      <span>{skill.dateString || ''}</span>
                      {skill.author && <><span>·</span><span>{skill.author}</span></>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* create modal */}
      {isCreateOpen && (
        <Modal
          title="New skill"
          subtitle="Skills are reusable instruction packs your chats can load."
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
              <input className="input-base" autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. sql-auditor" />
            </Field>
            <Field label="Description" hint="optional">
              <textarea className="input-base min-h-[70px] resize-y" rows={3} value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What does this skill accomplish?" />
            </Field>
            <Field label="Instructions" hint="optional">
              <textarea className="input-base min-h-[90px] resize-y" rows={4} value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Rules and guidelines written into every chat that loads it…" />
            </Field>
          </form>
        </Modal>
      )}

      {/* rename modal */}
      {renaming && (
        <Modal
          title="Rename skill"
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
          title="Delete skill"
          message={<>Delete <span className="font-medium text-ink-50">“{deleting.name}”</span>? This cannot be undone.</>}
          onConfirm={() => { onDeleteSkill(deleting.id); setDeleting(null); }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
