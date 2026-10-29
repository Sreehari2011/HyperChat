import React, { useState, useRef, useEffect } from 'react';
import { Agent } from '../types';
import { 
  Search, 
  MoreHorizontal, 
  Trash2, 
  X, 
  Edit3
} from 'lucide-react';

interface AgentsViewProps {
  agents: Agent[];
  onCreateAgent: (name: string, description: string, instructions: string, model?: string) => void;
  onUpdateAgent: (id: string, updates: Partial<Agent>) => void;
  onDeleteAgent: (id: string) => void;
  onSelectAgent?: (agent: Agent) => void;
}

export default function AgentsView({
  agents,
  onCreateAgent,
  onUpdateAgent,
  onDeleteAgent,
  onSelectAgent
}: AgentsViewProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'created' | 'builtin'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Menu dropdown state
  const [activeMenuAgentId, setActiveMenuAgentId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentDescription, setNewAgentDescription] = useState('');
  const [newAgentInstructions, setNewAgentInstructions] = useState('');
  const [newAgentModel, setNewAgentModel] = useState('Gemini 2.5 Flash');

  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editInstructions, setEditInstructions] = useState('');

  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Close dropdown menu on outside click or scroll
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuAgentId(null);
      }
    };
    const handleScroll = () => {
      setActiveMenuAgentId(null);
    };

    if (activeMenuAgentId) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeMenuAgentId]);

  // Filter agents based on search query and active tab
  const filteredAgents = agents.filter(agent => {
    if (activeTab === 'builtin' && agent.category !== 'builtin') return false;
    if (activeTab === 'created' && agent.category === 'builtin') return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(query) ||
      agent.description.toLowerCase().includes(query) ||
      (agent.instructions && agent.instructions.toLowerCase().includes(query)) ||
      (agent.model && agent.model.toLowerCase().includes(query))
    );
  });

  const handleOpenMenu = (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right
    });
    setActiveMenuAgentId(activeMenuAgentId === agentId ? null : agentId);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim() || !newAgentDescription.trim()) return;
    onCreateAgent(
      newAgentName.trim(),
      newAgentDescription.trim(),
      newAgentInstructions.trim(),
      newAgentModel
    );
    setNewAgentName('');
    setNewAgentDescription('');
    setNewAgentInstructions('');
    setIsCreateModalOpen(false);
    setNotification(`Created agent "${newAgentName.trim()}"`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent || !editName.trim() || !editDescription.trim()) return;
    onUpdateAgent(editingAgent.id, {
      name: editName.trim(),
      description: editDescription.trim(),
      instructions: editInstructions.trim(),
      updatedAt: Date.now()
    });
    setEditingAgent(null);
    setNotification(`Updated agent "${editName.trim()}"`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteConfirm = () => {
    if (deletingAgent) {
      onDeleteAgent(deletingAgent.id);
      setNotification(`Deleted agent "${deletingAgent.name}"`);
      setDeletingAgent(null);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const activeAgentForMenu = agents.find(a => a.id === activeMenuAgentId);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#151515] text-[#e4e4e7] overflow-y-auto no-scrollbar">
      <div className="max-w-6xl w-full mx-auto px-6 sm:px-8 py-8 flex flex-col h-full">
        
        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-4 right-8 bg-[#222] border border-[#333] text-zinc-200 text-xs px-3.5 py-2 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {notification}
          </div>
        )}

        {/* Top Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-serif text-zinc-100">Agents</h1>
        </div>

        {/* Subheader Row: Tab "All" on Left, Search bar + Create Agent button on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
          
          {/* Tabs: Library, Created by Me, Builtin */}
          <div className="flex items-center gap-1 self-start">
            <button
              onClick={() => {
                setActiveTab('library');
                setActiveMenuAgentId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'library'
                  ? 'bg-[#252525] text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Library
            </button>
            <button
              onClick={() => {
                setActiveTab('created');
                setActiveMenuAgentId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'created'
                  ? 'bg-[#252525] text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Created by Me
            </button>
            <button
              onClick={() => {
                setActiveTab('builtin');
                setActiveMenuAgentId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'builtin'
                  ? 'bg-[#252525] text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Builtin
            </button>
          </div>

          {/* Search bar + Create Agent Button */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search 
                size={16} 
                strokeWidth={2} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search agents..."
                className="bg-[#222] border border-[#333] rounded-full py-1.5 pl-9 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-all w-[180px] focus:w-[240px]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              id="create-agent-btn"
              onClick={() => {
                setNewAgentName('');
                setNewAgentDescription('');
                setNewAgentInstructions('');
                setNewAgentModel('Gemini 2.5 Flash');
                setIsCreateModalOpen(true);
              }}
              className="bg-zinc-100 hover:bg-white text-zinc-900 font-medium px-4 py-1.5 rounded-full text-sm transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              Create Agent
            </button>
          </div>
        </div>

        {/* Content Area: 2 Columns Agent Cards */}
        <div className="flex-1 pb-12">
          {filteredAgents.length === 0 ? (
            <div className="text-center text-zinc-500 mt-20 text-sm">
              {searchQuery 
                ? `No agents matching "${searchQuery}".` 
                : 'No agents created'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredAgents.map(agent => (
                <div
                  key={agent.id}
                  onClick={() => onSelectAgent?.(agent)}
                  className={`bg-[#181818] border border-[#262626] rounded-xl p-4 flex flex-col justify-between transition-colors group relative hover:border-[#383838] ${
                    onSelectAgent ? 'cursor-pointer' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-sm font-medium text-zinc-100 truncate min-w-0">
                          {agent.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide shrink-0 ${
                          agent.category === 'builtin'
                            ? 'bg-[#242424] text-zinc-400 border border-[#333]'
                            : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                        }`}>
                          {agent.category === 'builtin' ? 'Builtin' : 'Created by Me'}
                        </span>
                      </div>

                      {/* Three Dots Button - only for custom agents */}
                      {agent.category !== 'builtin' && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenMenu(e, agent.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-500 hover:text-zinc-200 hover:bg-[#252525] rounded-md cursor-pointer shrink-0"
                          title="Agent options"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      )}
                    </div>

                    {/* Agent Description */}
                    {agent.description && (
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed line-clamp-2 font-normal">
                        {agent.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Floating Context Dropdown Menu for Agent */}
      {activeMenuAgentId && activeAgentForMenu && menuPosition && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`
          }}
          className="bg-[#1d1d1d] border border-[#2f2f2f] rounded-xl shadow-2xl py-1.5 w-44 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {activeAgentForMenu.category !== 'builtin' && (
            <>
              <button
                onClick={() => {
                  setEditingAgent(activeAgentForMenu);
                  setEditName(activeAgentForMenu.name);
                  setEditDescription(activeAgentForMenu.description || '');
                  setEditInstructions(activeAgentForMenu.instructions || '');
                  setActiveMenuAgentId(null);
                }}
                className="w-full px-3.5 py-2 text-left text-xs text-zinc-200 hover:bg-[#282828] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Edit3 size={13} className="text-zinc-400" />
                <span>Edit Agent</span>
              </button>

              <button
                onClick={() => {
                  setDeletingAgent(activeAgentForMenu);
                  setActiveMenuAgentId(null);
                }}
                className="w-full px-3.5 py-2 text-left text-xs text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 flex items-center gap-2 transition-colors cursor-pointer border-t border-[#262626]"
              >
                <Trash2 size={13} />
                <span>Delete Agent</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Create Agent Modal */}
      {isCreateModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => {
            setIsCreateModalOpen(false);
            setNewAgentName('');
            setNewAgentDescription('');
          }}
        >
          <div 
            className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-zinc-100">New Agent</h2>
              <button 
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewAgentName('');
                  setNewAgentDescription('');
                }}
                className="p-1.5 rounded-lg hover:bg-[#222] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="agentName" className="text-sm font-medium text-zinc-300">
                    Name
                  </label>
                  <input
                    id="agentName"
                    type="text"
                    required
                    autoFocus
                    value={newAgentName}
                    onChange={e => setNewAgentName(e.target.value)}
                    placeholder="Agent name"
                    className="bg-[#222] border border-[#333] rounded-lg px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="agentDescription" className="text-sm font-medium text-zinc-300">
                    Description
                  </label>
                  <textarea
                    id="agentDescription"
                    rows={6}
                    required
                    value={newAgentDescription}
                    onChange={e => setNewAgentDescription(e.target.value)}
                    placeholder="Agent description"
                    className="bg-[#222] border border-[#333] rounded-lg px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors min-h-[150px] resize-y"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={!newAgentName.trim() || !newAgentDescription.trim()}
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      {editingAgent && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setEditingAgent(null)}
        >
          <div 
            className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-zinc-100">Edit Agent</h2>
              <button 
                type="button"
                onClick={() => setEditingAgent(null)}
                className="p-1.5 rounded-lg hover:bg-[#222] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="editAgentName" className="text-sm font-medium text-zinc-300">
                    Name
                  </label>
                  <input
                    id="editAgentName"
                    type="text"
                    required
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Agent name"
                    className="bg-[#222] border border-[#333] rounded-lg px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="editAgentDescription" className="text-sm font-medium text-zinc-300">
                    Description
                  </label>
                  <textarea
                    id="editAgentDescription"
                    rows={6}
                    required
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    placeholder="Agent description"
                    className="bg-[#222] border border-[#333] rounded-lg px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors min-h-[150px] resize-y"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={!editName.trim() || !editDescription.trim()}
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAgent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-9 h-9 rounded-full bg-rose-950/40 border border-rose-800/40 flex items-center justify-center">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-100">Delete Agent</h3>
                <p className="text-xs text-zinc-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300">
              Are you sure you want to delete <span className="font-semibold text-zinc-100">"{deletingAgent.name}"</span>?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAgent(null)}
                className="px-4 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-[#252525] rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="bg-rose-600 hover:bg-rose-500 text-white font-medium px-4 py-1.5 rounded-full text-xs transition-colors cursor-pointer"
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
