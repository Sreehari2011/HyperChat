import React, { useState } from 'react';
import { Search, MoreVertical, Flag, Pencil, Trash2, MessageSquare, Ghost } from 'lucide-react';
import { ChatSession } from '../types';
import { formatRelativeTime } from '../utils';
import { Menu, ConfirmDialog, Modal, Field } from './ui';

interface AllChatsViewProps {
  chats: ChatSession[];
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onToggleFlag: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
}

export default function AllChatsView({ chats, onSelectChat, onDeleteChat, onToggleFlag, onRenameChat }: AllChatsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [renaming, setRenaming] = useState<ChatSession | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleting, setDeleting] = useState<ChatSession | null>(null);

  const filteredChats = chats
    .filter(chat => !chat.isGhost && chat.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const submitRename = () => {
    if (renaming && renameValue.trim()) onRenameChat(renaming.id, renameValue.trim());
    setRenaming(null);
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-ink-900">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
        {/* header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="font-serif text-[22px] font-light text-ink-50">History</h1>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chats…"
              className="search-input"
            />
          </div>
        </div>

        {/* list */}
        <div className="no-scrollbar flex-1 overflow-y-auto pb-12">
          {filteredChats.length === 0 ? (
            <div className="mt-20 flex flex-col items-center gap-3 text-center">
              <MessageSquare size={24} className="text-ink-400" />
              <p className="text-sm text-ink-200">
                {searchQuery ? `No chats matching "${searchQuery}"` : 'No conversations yet — start a new chat.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredChats.map(chat => (
                <div
                  key={chat.id}
                  className="group flex cursor-pointer items-center justify-between border-b border-ink-800 px-4 py-4 transition-colors hover:bg-white/[0.03]"
                  onClick={() => onSelectChat(chat.id)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {chat.isFlagged && <Flag size={13} className="shrink-0 text-amber-400/80" strokeWidth={2.25} />}
                    {chat.isGhost && <Ghost size={13} className="shrink-0 text-ink-300" />}
                    <span className="truncate text-[14px] font-medium text-ink-100 group-hover:text-ink-50">{chat.title}</span>
                    {chat.agentName && (
                      <span className="hidden shrink-0 rounded-full border border-ink-600 bg-ink-750 px-2 py-0.5 text-[10px] text-ink-200 sm:inline">
                        {chat.agentName}
                      </span>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center" onClick={e => e.stopPropagation()}>
                    <span className="text-[12px] text-ink-300 transition-opacity group-hover:opacity-0">
                      {formatRelativeTime(chat.updatedAt)}
                    </span>
                    <Menu
                      items={[
                        { label: chat.isFlagged ? 'Unflag' : 'Flag', icon: <Flag size={14} />, onSelect: () => onToggleFlag(chat.id) },
                        { label: 'Rename', icon: <Pencil size={14} />, onSelect: () => { setRenaming(chat); setRenameValue(chat.title); } },
                        { label: 'Delete', icon: <Trash2 size={14} />, danger: true, separatorBefore: true, onSelect: () => setDeleting(chat) },
                      ]}
                    >
                      {({ open, toggle }) => (
                        <button
                          onClick={toggle}
                          className={`ml-1 rounded-md p-1.5 text-ink-300 transition-all hover:bg-white/[0.08] hover:text-ink-50 ${
                            open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                          aria-label="Chat options"
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

      {/* rename modal */}
      {renaming && (
        <Modal
          title="Rename chat"
          onClose={() => setRenaming(null)}
          footer={
            <>
              <button className="btn-ghost" onClick={() => setRenaming(null)}>Cancel</button>
              <button className="btn-primary" onClick={submitRename} disabled={!renameValue.trim()}>Rename</button>
            </>
          }
        >
          <Field label="New title">
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
          title="Delete chat"
          message={<>Delete <span className="font-medium text-ink-50">“{deleting.title}”</span>? This cannot be undone.</>}
          onConfirm={() => { onDeleteChat(deleting.id); setDeleting(null); }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
