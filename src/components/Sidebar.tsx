import React, { useState } from 'react';
import {
  MessageSquarePlus,
  History,
  Folder,
  FilePenLine,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  MoreHorizontal,
  Flag,
  Trash2,
  Pencil,
  Ghost,
} from 'lucide-react';
import { ChatSession, ViewState, Project } from '../types';
import { Menu, Modal, Field } from './ui';

/* HyperChat wordmark — simple geometric mark + name */
function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2.5 overflow-hidden pl-1">
      <svg width="26" height="26" viewBox="0 0 32 32" className="shrink-0">
        <rect width="32" height="32" rx="8" fill="#e4a35a" />
        <path d="M16 7l8.5 15H7.5z" fill="#0d0d0d" />
        <circle cx="16" cy="18" r="2.4" fill="#e4a35a" />
      </svg>
      {!collapsed && (
        <span className="truncate text-[15px] font-semibold tracking-tight text-ink-50">
          HyperChat
        </span>
      )}
    </div>
  );
}

interface SidebarProps {
  chats: ChatSession[];
  projects: Project[];
  currentView: ViewState;
  activeChatId: string | null;
  activeProjectId: string | null;
  isOpen: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onViewAllChats: () => void;
  onViewProjects: () => void;
  onViewSkills: () => void;
  onViewAgents: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onToggleFlag: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onSelectProject: (id: string) => void;
  onWorkOnProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onToggleProjectFlag: (id: string) => void;
  onRenameProject: (id: string, newTitle: string) => void;
}

export default function Sidebar({
  chats,
  projects,
  currentView,
  activeChatId,
  activeProjectId,
  isOpen,
  onToggleSidebar,
  onNewChat,
  onViewAllChats,
  onViewProjects,
  onViewSkills,
  onViewAgents,
  onSelectChat,
  onDeleteChat,
  onToggleFlag,
  onRenameChat,
  onSelectProject,
  onWorkOnProject,
  onDeleteProject,
  onToggleProjectFlag,
  onRenameProject,
}: SidebarProps) {
  const [renaming, setRenaming] = useState<{ kind: 'chat' | 'project'; id: string; current: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const flaggedChats = chats.filter(c => c.isFlagged && !c.isGhost);
  const flaggedProjects = projects.filter(p => p.isFlagged);
  const recentChats = chats.filter(c => !c.isGhost).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20);

  const isProjectsActive = currentView === 'projects' || currentView === 'project_details';
  const isSkillsActive = currentView === 'skills' || currentView === 'skill_editor';
  const isAgentsActive = currentView === 'agents' || currentView === 'agent_template' || currentView === 'agent_chat';

  const navItems: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void }[] = [
    { label: 'New chat', icon: <MessageSquarePlus size={16} strokeWidth={1.75} />, active: currentView === 'new', onClick: onNewChat },
    { label: 'History', icon: <History size={16} strokeWidth={1.75} />, active: currentView === 'all' || currentView === 'chat', onClick: onViewAllChats },
    { label: 'Projects', icon: <Folder size={16} strokeWidth={1.75} />, active: isProjectsActive, onClick: onViewProjects },
    { label: 'Skills', icon: <FilePenLine size={16} strokeWidth={1.75} />, active: isSkillsActive, onClick: onViewSkills },
    { label: 'Agents', icon: <Bot size={16} strokeWidth={1.75} />, active: isAgentsActive, onClick: onViewAgents },
  ];

  const submitRename = () => {
    if (renaming && renameValue.trim()) {
      if (renaming.kind === 'chat') onRenameChat(renaming.id, renameValue.trim());
      else onRenameProject(renaming.id, renameValue.trim());
    }
    setRenaming(null);
  };

  const chatMenuItems = (chat: ChatSession) => [
    {
      label: chat.isFlagged ? 'Unflag' : 'Flag',
      icon: <Flag size={14} />,
      onSelect: () => onToggleFlag(chat.id),
    },
    {
      label: 'Rename',
      icon: <Pencil size={14} />,
      onSelect: () => { setRenaming({ kind: 'chat', id: chat.id, current: chat.title }); setRenameValue(chat.title); },
    },
    {
      label: 'Delete',
      icon: <Trash2 size={14} />,
      danger: true,
      separatorBefore: true,
      onSelect: () => onDeleteChat(chat.id),
    },
  ];

  const projectMenuItems = (project: Project) => [
    {
      label: 'Work on it',
      icon: <Folder size={14} />,
      onSelect: () => onWorkOnProject(project),
    },
    {
      label: project.isFlagged ? 'Unflag' : 'Flag',
      icon: <Flag size={14} />,
      onSelect: () => onToggleProjectFlag(project.id),
    },
    {
      label: 'Rename',
      icon: <Pencil size={14} />,
      onSelect: () => { setRenaming({ kind: 'project', id: project.id, current: project.name }); setRenameValue(project.name); },
    },
    {
      label: 'Delete',
      icon: <Trash2 size={14} />,
      danger: true,
      separatorBefore: true,
      onSelect: () => onDeleteProject(project.id),
    },
  ];

  const rowClasses = (active: boolean) =>
    `group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
      active
        ? 'bg-white/[0.07] text-ink-50'
        : 'text-ink-200 hover:bg-white/[0.04] hover:text-ink-50'
    }`;

  const renderChatRow = (chat: ChatSession, section: string) => {
    const active = activeChatId === chat.id && currentView === 'chat';
    return (
      <div key={`${chat.id}-${section}`} className={rowClasses(active)} onClick={() => onSelectChat(chat.id)} role="button">
        {chat.isFlagged && <Flag size={12} className="shrink-0 text-amber-400/80" strokeWidth={2.25} />}
        {chat.isGhost && <Ghost size={12} className="shrink-0 text-ink-300" strokeWidth={2} />}
        <span className="min-w-0 flex-1 truncate">{chat.title}</span>
        <Menu items={chatMenuItems(chat)}>
          {({ open, toggle }) => (
            <button
              onClick={toggle}
              className={`shrink-0 rounded-md p-1 text-ink-300 transition-all hover:bg-white/[0.08] hover:text-ink-50 ${
                open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              aria-label="Chat options"
            >
              <MoreHorizontal size={15} />
            </button>
          )}
        </Menu>
      </div>
    );
  };

  const renderProjectRow = (project: Project, section: string) => {
    const active = activeProjectId === project.id && currentView === 'project_details';
    return (
      <div key={`${project.id}-${section}`} className={rowClasses(active)} onClick={() => onSelectProject(project.id)} role="button">
        <Folder size={14} className="shrink-0 text-ink-300" strokeWidth={1.75} />
        <span className="min-w-0 flex-1 truncate">{project.name}</span>
        <Menu items={projectMenuItems(project)}>
          {({ open, toggle }) => (
            <button
              onClick={toggle}
              className={`shrink-0 rounded-md p-1 text-ink-300 transition-all hover:bg-white/[0.08] hover:text-ink-50 ${
                open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              aria-label="Project options"
            >
              <MoreHorizontal size={15} />
            </button>
          )}
        </Menu>
      </div>
    );
  };

  const sectionLabel = 'px-3 pb-1 pt-4 text-[11px] font-medium uppercase tracking-wider text-ink-300';

  return (
    <>
      <aside
        className={`flex h-full shrink-0 select-none flex-col border-r border-ink-700 bg-ink-950 transition-[width] duration-200 ${
          isOpen ? 'w-[264px]' : 'w-[68px]'
        }`}
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between px-3">
          {isOpen ? (
            <button onClick={onNewChat} className="cursor-pointer" title="New chat">
              <Logo collapsed={false} />
            </button>
          ) : (
            <button onClick={onNewChat} title="New chat" className="cursor-pointer">
              <Logo collapsed />
            </button>
          )}
          <button
            onClick={onToggleSidebar}
            className="icon-btn shrink-0"
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <PanelLeftClose size={17} strokeWidth={1.75} /> : <PanelLeftOpen size={17} strokeWidth={1.75} />}
          </button>
        </div>

        {/* Nav + lists */}
        <div className="no-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2">
          <div className="flex flex-col gap-0.5 pt-1">
            {navItems.map(item => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`flex h-9 w-full items-center gap-3 rounded-lg px-3 text-[13.5px] transition-colors ${
                  item.active
                    ? 'bg-white/[0.07] font-medium text-ink-50'
                    : 'text-ink-200 hover:bg-white/[0.04] hover:text-ink-50'
                } ${!isOpen ? 'justify-center px-0' : ''}`}
                title={!isOpen ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {isOpen && <span className="truncate text-left">{item.label}</span>}
              </button>
            ))}
          </div>

          {isOpen && (
            <div className="mt-1 flex flex-col">
              {(flaggedProjects.length > 0 || flaggedChats.length > 0) && (
                <div>
                  <div className={sectionLabel}>Flagged</div>
                  <div className="flex flex-col gap-0.5">
                    {flaggedProjects.map(p => renderProjectRow(p, 'flagged'))}
                    {flaggedChats.map(c => renderChatRow(c, 'flagged'))}
                  </div>
                </div>
              )}
              {recentChats.length > 0 && (
                <div>
                  <div className={sectionLabel}>Recents</div>
                  <div className="flex flex-col gap-0.5">{recentChats.map(c => renderChatRow(c, 'recent'))}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer / user */}
        <div className="shrink-0 border-t border-ink-700 p-3">
          <div className={`flex items-center gap-2.5 rounded-lg px-1 py-1 ${!isOpen ? 'justify-center' : ''}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ink-600 to-ink-750 text-[11px] font-semibold text-ink-50 ring-1 ring-ink-600">
              SH
            </div>
            {isOpen && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-ink-100">Sreehari H</div>
                <div className="text-[11px] text-ink-300">Free plan</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Rename modal */}
      {renaming && (
        <Modal
          title={`Rename ${renaming.kind === 'chat' ? 'chat' : 'project'}`}
          onClose={() => setRenaming(null)}
          footer={
            <>
              <button className="btn-ghost" onClick={() => setRenaming(null)}>Cancel</button>
              <button className="btn-primary" onClick={submitRename} disabled={!renameValue.trim()}>
                Rename
              </button>
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
    </>
  );
}
