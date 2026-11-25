import React, { useState } from 'react';
import { Search, MoreVertical, Bot, Pencil, Trash2, Plus, MessageSquare, Settings2 } from 'lucide-react';
import { Agent } from '../types';
import { Menu, ConfirmDialog, Modal, Field, Toast } from './ui';

interface AgentsViewProps {
  agents: Agent[];
  onCreateAgent: (name: string, description: string, instructions: string) => void;
  onUpdateAgent: (id: string, updates: Partial<Agent>) => void;
  onDeleteAgent: (id: string) => void;
  onSelectAgent: (agent: Agent) => void;
  onConfigureAgent: (agent: Agent) => void;
}

type TabType = 'library' | 'created' | 'builtin';

export default function AgentsView({
  agents,
  onCreateAgent,
  onUpdateAgent,
  onDeleteAgent,
  onSelectAgent,
  onConfigureAgent,
}: AgentsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [deleting, setDeleting] = useState<Agent | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editInstructions, setEditInstructions] = useState('');

  const flash = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const filteredAgents = agents.filter(agent => {
    if (activeTab === 'builtin' && agent.category !== 'builtin') return false;
    if (activeTab === 'created' && agent.category === 'builtin') return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(q) ||
      agent.description.toLowerCase().includes(q)
    );
  });

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDesc.trim()) return;
    onCreateAgent(newName.trim(), newDesc.trim(), newInstructions.trim());
    setNewName('');
    setNewDesc('');
    setNewInstructions('');
    setIsCreateOpen(false);
    flash(`Created agent "${newName.trim()}"`);
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editName.trim() || !editDesc.trim()) return;
    onUpdateAgent(editing.id, {
      name: editName.trim(),
      description: editDesc.trim(),
      instructions: editInstructions.trim(),
      updatedAt: Date.now(),
    });
    setEditing(null);
    flash(`Updated agent "${editName.trim()}"`);
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'library', label: 'Library' },
    { id: 'created', label: 'Created by me' },
    { id: 'builtin', label: 'Builtin' },
  ];

  return (
    <div className="no-scrollbar flex h-full flex-1 flex-col overflow-y-auto bg-ink-900">
      {notification && <Toast message={notification} />}

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-8">
        {/* header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-[22px] font-light text-ink-50">Agents</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search agents…"
                className="search-input"
              />
            </div>
            <button className="btn-primary" onClick={() => setIsCreateOpen(true)}>
              <Plus size={15} /> New agent
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

        {/* cards */}
        <div className="flex-1 pb-12">
          {filteredAgents.length === 0 ? (
            <div className="mt-20 flex flex-col items-center gap-3 text-center">
              <Bot size={26} className="text-ink-400" />
              <p className="text-sm text-ink-200">
                {searchQuery
                  ? `No agents matching "${searchQuery}"`
                  : activeTab === 'created'
                    ? 'No agents created yet — build a specialist with its own instructions.'
                    : 'No agents here yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredAgents.map(agent => (
                <div
                  key={agent.id}
                  className="card group flex cursor-pointer flex-col p-4"
                  onClick={() => onSelectAgent(agent)}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-750">
                        <Bot size={15} className="text-amber-200/80" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-[14px] font-medium text-ink-50">{agent.name}</h3>
                      </div>
                      <span className={`badge shrink-0 border ${
                        agent.category === 'builtin'
                          ? 'border-ink-600 bg-ink-750 text-ink-200'
                          : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                      }`}>
                        {agent.category === 'builtin' ? 'Builtin' : 'Mine'}
                      </span>
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                      <Menu
                        items={[
                          { label: 'Chat', icon: <MessageSquare size={14} />, onSelect: () => onSelectAgent(agent) },
                          { label: 'Configure', icon: <Settings2 size={14} />, onSelect: () => onConfigureAgent(agent) },
                          ...(agent.category !== 'builtin'
                            ? [
                                { label: 'Edit', icon: <Pencil size={14} />, onSelect: () => { setEditing(agent); setEditName(agent.name); setEditDesc(agent.description || ''); setEditInstructions(agent.instructions || ''); } },
                                { label: 'Delete', icon: <Trash2 size={14} />, danger: true, separatorBefore: true, onSelect: () => setDeleting(agent) },
                              ]
                            : []),
                        ]}
                      >
                        {({ open, toggle }) => (
                          <button
                            onClick={toggle}
                            className={`rounded-md p-1 text-ink-300 transition-all hover:bg-white/[0.08] hover:text-ink-50 ${
                              open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                            aria-label="Agent options"
                          >
                            <MoreVertical size={15} />
                          </button>
                        )}
                      </Menu>
                    </div>
                  </div>

                  <p className="line-clamp-2 text-[12.5px] leading-relaxed text-ink-200">{agent.description}</p>

                  <div className="mt-auto flex items-center gap-2.5 pt-3 text-[11px] text-ink-300">
                    {agent.subAgents && agent.subAgents.length > 0 && (
                      <span>{agent.subAgents.length} sub-agent{agent.subAgents.length > 1 ? 's' : ''}</span>
                    )}
                    <span className="ml-auto flex items-center gap-1 text-ink-200 transition-colors group-hover:text-ink-50">
                      <MessageSquare size={11} /> Chat
                    </span>
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
          title="New agent"
          subtitle="Agents run with their own instructions, tools and sub-agents."
          onClose={() => setIsCreateOpen(false)}
          widthClass="max-w-lg"
          footer={
            <>
              <button className="btn-ghost" onClick={() => setIsCreateOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={submitCreate as unknown as () => void} disabled={!newName.trim() || !newDesc.trim()}>Create</button>
            </>
          }
        >
          <form onSubmit={submitCreate}>
            <Field label="Name">
              <input className="input-base" autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Code Reviewer" />
            </Field>
            <Field label="Description">
              <textarea className="input-base min-h-[70px] resize-y" rows={3} value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What does this agent specialize in?" />
            </Field>
            <Field label="Instructions" hint="optional">
              <textarea className="input-base min-h-[90px] resize-y" rows={4} value={newInstructions} onChange={e => setNewInstructions(e.target.value)} placeholder="Core guidelines and directives for this agent…" />
            </Field>
          </form>
        </Modal>
      )}

      {/* edit modal */}
      {editing && (
        <Modal
          title="Edit agent"
          onClose={() => setEditing(null)}
          widthClass="max-w-lg"
          footer={
            <>
              <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" onClick={submitEdit as unknown as () => void} disabled={!editName.trim() || !editDesc.trim()}>Save changes</button>
            </>
          }
        >
          <form onSubmit={submitEdit}>
            <Field label="Name">
              <input className="input-base" autoFocus value={editName} onChange={e => setEditName(e.target.value)} />
            </Field>
            <Field label="Description">
              <textarea className="input-base min-h-[70px] resize-y" rows={3} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
            </Field>
            <Field label="Instructions" hint="optional">
              <textarea className="input-base min-h-[90px] resize-y" rows={4} value={editInstructions} onChange={e => setEditInstructions(e.target.value)} />
            </Field>
          </form>
        </Modal>
      )}

      {/* delete confirm */}
      {deleting && (
        <ConfirmDialog
          title="Delete agent"
          message={<>Delete <span className="font-medium text-ink-50">“{deleting.name}”</span>? This cannot be undone.</>}
          onConfirm={() => { onDeleteAgent(deleting.id); setDeleting(null); flash(`Deleted agent "${deleting.name}"`); }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
