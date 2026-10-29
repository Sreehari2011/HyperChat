import React, { useState } from 'react';
import { Search, MoreVertical, Flag, Edit2, Trash2 } from 'lucide-react';
import { ChatSession } from '../types';
import { formatRelativeTime } from '../utils';

interface AllChatsViewProps {
  chats: ChatSession[];
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onToggleFlag: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
}

export default function AllChatsView({ chats, onSelectChat, onDeleteChat, onToggleFlag, onRenameChat }: AllChatsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filteredChats = chats.filter(chat => 
    !chat.isGhost && chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#151515]">
      <div className="max-w-6xl w-full mx-auto px-6 sm:px-8 py-8 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-serif text-zinc-100">History</h1>
          <div className="relative group">
            <Search size={16} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search history..."
              className="bg-[#222] border border-[#333] rounded-full py-1.5 pl-9 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-all w-[180px] focus:w-[240px]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-12">
          {filteredChats.length === 0 ? (
            <div className="text-center text-zinc-500 mt-20 text-sm">
              {searchQuery ? `No history matching "${searchQuery}"` : 'No history found'}
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredChats.map(chat => (
                <div 
                  key={chat.id}
                  className="group flex items-center justify-between py-4 border-b border-[#222] hover:bg-[#1a1a1a] px-4 -mx-4 rounded-xl cursor-pointer transition-colors"
                  onClick={() => onSelectChat(chat.id)}
                  onMouseLeave={() => setActiveMenuId(null)}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {chat.isFlagged && <Flag size={14} className="text-amber-500/80 flex-shrink-0" strokeWidth={2.5} />}
                    <span className="text-zinc-300 font-medium truncate text-[15px]">{chat.title}</span>
                  </div>
                  
                  <div className="flex items-center relative" onClick={e => e.stopPropagation()}>
                    <span className={`text-sm text-zinc-500 transition-opacity ${activeMenuId === chat.id ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}>
                      {formatRelativeTime(chat.updatedAt)}
                    </span>
                    
                    <button 
                      onClick={() => setActiveMenuId(activeMenuId === chat.id ? null : chat.id)}
                      className={`absolute right-0 p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-[#333] transition-all ${activeMenuId === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    >
                      <MoreVertical size={18} strokeWidth={2} />
                    </button>

                    {activeMenuId === chat.id && (
                      <div className="absolute right-0 top-full mt-1 bg-[#222] border border-[#333] rounded-lg shadow-xl shadow-black/50 py-1 w-40 z-10 flex flex-col animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFlag(chat.id);
                            setActiveMenuId(null);
                          }}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-[#333] hover:text-white text-left"
                        >
                          <Flag size={14} strokeWidth={2} />
                          {chat.isFlagged ? 'Unflag' : 'Flag'}
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const newTitle = prompt('Enter new title:', chat.title);
                            if (newTitle) onRenameChat(chat.id, newTitle);
                            setActiveMenuId(null);
                          }}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-[#333] hover:text-white text-left"
                        >
                          <Edit2 size={14} strokeWidth={2} />
                          Rename
                        </button>
                        <div className="h-px bg-[#333] my-1 mx-2" />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                            setActiveMenuId(null);
                          }}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-[#333] hover:text-red-300 text-left"
                        >
                          <Trash2 size={14} strokeWidth={2} />
                          Delete
                        </button>
                      </div>
                    )}
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
