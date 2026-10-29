import React, { useState, useRef, useEffect } from 'react';
import { Skill } from '../types';
import { 
  Search, 
  MoreHorizontal, 
  MoreVertical,
  Pencil, 
  Trash2, 
  Edit3, 
  X
} from 'lucide-react';

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
  loadedSkill
}: SkillsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Menu dropdown state
  const [activeMenuSkillId, setActiveMenuSkillId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillContent, setNewSkillContent] = useState('');

  const [renamingSkill, setRenamingSkill] = useState<Skill | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [deletingSkill, setDeletingSkill] = useState<Skill | null>(null);

  // Close dropdown menu on outside click or scroll
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuSkillId(null);
      }
    };
    const handleScroll = () => {
      setActiveMenuSkillId(null);
    };

    if (activeMenuSkillId) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeMenuSkillId]);

  // Filter skills based on active tab and search query
  const filteredSkills = skills.filter(skill => {
    // Tab filtering
    if (activeTab === 'builtin' && skill.category !== 'builtin') return false;
    if (activeTab === 'created' && skill.category !== 'custom') return false;
    // 'library' includes all skills

    // Search query filtering
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      skill.name.toLowerCase().includes(query) ||
      skill.description.toLowerCase().includes(query) ||
      (skill.author && skill.author.toLowerCase().includes(query))
    );
  });

  const handleOpenMenu = (e: React.MouseEvent, skillId: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right
    });
    setActiveMenuSkillId(activeMenuSkillId === skillId ? null : skillId);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    onCreateSkill(newSkillName.trim(), newSkillDesc.trim(), newSkillContent.trim());
    setNewSkillName('');
    setNewSkillDesc('');
    setNewSkillContent('');
    setIsNewModalOpen(false);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingSkill || !renameValue.trim()) return;
    onUpdateSkill(renamingSkill.id, {
      name: renameValue.trim(),
      updatedAt: Date.now()
    });
    setRenamingSkill(null);
  };

  const activeSkillForMenu = skills.find(s => s.id === activeMenuSkillId);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#151515] text-[#e4e4e7] overflow-y-auto no-scrollbar">
      <div className="max-w-6xl w-full mx-auto px-6 sm:px-8 py-8 flex flex-col h-full">
        
        {/* Top Header: Matching History and Projects Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-serif text-zinc-100">Skills</h1>
        </div>

        {/* Subheader Row: Tabs on Left, Search bar + New Skill button on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
          
          {/* Tabs: Library, Created by Me, Builtin */}
          <div className="flex items-center gap-1 self-start">
            <button
              onClick={() => {
                setActiveTab('library');
                setActiveMenuSkillId(null);
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
                setActiveMenuSkillId(null);
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
                setActiveMenuSkillId(null);
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

          {/* Search bar + New Skill Button together */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search size={16} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search skills..."
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
              onClick={() => {
                setNewSkillName('');
                setNewSkillDesc('');
                setNewSkillContent('');
                setIsNewModalOpen(true);
              }}
              className="bg-zinc-100 hover:bg-white text-zinc-900 font-medium px-4 py-1.5 rounded-full text-sm transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              New Skill
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 pb-12">
          {filteredSkills.length === 0 ? (
            <div className="text-center text-zinc-500 mt-20 text-sm">
              {searchQuery 
                ? `No skills matching "${searchQuery}".` 
                : activeTab === 'created'
                ? 'No skills created'
                : 'No skills found.'}
            </div>
          ) : activeTab === 'library' ? (
            /* LIBRARY: 2-COLUMN COMPACT CARD GRID (REDUCED HEIGHT) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSkills.map(skill => (
                <div
                  key={skill.id}
                  onClick={() => {
                    if (skill.category !== 'builtin') {
                      onSelectSkill(skill.id);
                    } else {
                      onToggleLoadSkill(skill.id);
                    }
                  }}
                  className={`bg-[#181818] border border-[#262626] rounded-xl p-3.5 sm:p-4 flex flex-col justify-start transition-colors group relative cursor-pointer hover:border-[#383838]`}
                >
                  {/* Card Top: Title, Tag, and Three Dots (•••) */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="text-sm font-medium text-zinc-100 truncate">
                        {skill.name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide shrink-0 ${
                        skill.category === 'builtin'
                          ? 'bg-[#242424] text-zinc-400 border border-[#333]'
                          : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                      }`}>
                        {skill.category === 'builtin' ? 'Builtin' : 'Created by Me'}
                      </span>
                    </div>

                    {/* Three Dots Button */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenMenu(e, skill.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-500 hover:text-zinc-200 hover:bg-[#252525] rounded-md cursor-pointer shrink-0"
                      title="Skill options"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                  </div>

                  {/* Description: Compact reduced height line-clamp-2 */}
                  <p className="text-xs text-zinc-400 mt-1.5 leading-snug line-clamp-2 font-normal">
                    {skill.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            /* CREATED BY ME / BUILTIN: EXACTLY LIKE HISTORY SESSIONS */
            <div className="flex flex-col">
              {filteredSkills.map(skill => (
                <div
                  key={skill.id}
                  onClick={() => {
                    if (skill.category !== 'builtin') {
                      onSelectSkill(skill.id);
                    } else {
                      onToggleLoadSkill(skill.id);
                    }
                  }}
                  className="group flex items-center justify-between py-4 border-b border-[#222] hover:bg-[#1a1a1a] px-4 -mx-4 rounded-xl transition-colors cursor-pointer"
                  onMouseLeave={() => {
                    if (activeMenuSkillId === skill.id) setActiveMenuSkillId(null);
                  }}
                >
                  {/* Left: Skill title */}
                  <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-4">
                    <span className="text-zinc-300 font-medium truncate text-[15px]">
                      {skill.name}
                    </span>
                  </div>

                  {/* Right: Date fading to three-dots MoreVertical, exactly as in History sessions */}
                  <div className="flex items-center relative shrink-0" onClick={e => e.stopPropagation()}>
                    <span className={`text-sm text-zinc-500 transition-opacity ${activeMenuSkillId === skill.id ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}>
                      {skill.dateString || 'Recently'}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleOpenMenu(e, skill.id)}
                      className={`p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-[#282828] rounded-lg transition-all absolute right-0 cursor-pointer ${
                        activeMenuSkillId === skill.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      title="Skill options"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Floating Context Dropdown Menu for Skills */}
      {activeMenuSkillId && activeSkillForMenu && menuPosition && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`
          }}
          className="bg-[#1d1d1d] border border-[#2f2f2f] rounded-xl shadow-2xl py-1.5 w-44 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {activeSkillForMenu.category === 'builtin' ? (
            /* For builtin skills: cannot be Edited, Deleted or Configured. Only Load / Unload */
            <button
              onClick={() => {
                onToggleLoadSkill(activeSkillForMenu.id);
                setActiveMenuSkillId(null);
              }}
              className="w-full px-3.5 py-2 text-left text-xs text-zinc-200 hover:bg-[#282828] flex items-center transition-colors cursor-pointer"
            >
              <span>{activeSkillForMenu.isLoaded || loadedSkill?.id === activeSkillForMenu.id ? "Unload Skill" : "Load Skill"}</span>
            </button>
          ) : (
            /* For custom skills: Load/Unload, Edit, Rename, Delete */
            <>
              <button
                onClick={() => {
                  onToggleLoadSkill(activeSkillForMenu.id);
                  setActiveMenuSkillId(null);
                }}
                className="w-full px-3.5 py-2 text-left text-xs text-zinc-200 hover:bg-[#282828] flex items-center transition-colors cursor-pointer"
              >
                <span>{activeSkillForMenu.isLoaded || loadedSkill?.id === activeSkillForMenu.id ? "Unload Skill" : "Load Skill"}</span>
              </button>

              <button
                onClick={() => {
                  onSelectSkill(activeSkillForMenu.id);
                  setActiveMenuSkillId(null);
                }}
                className="w-full px-3.5 py-2 text-left text-xs text-zinc-200 hover:bg-[#282828] flex items-center gap-2.5 transition-colors cursor-pointer border-t border-[#262626]"
              >
                <Pencil size={13} className="text-zinc-400" />
                <span>Edit Skill</span>
              </button>

              <button
                onClick={() => {
                  setRenamingSkill(activeSkillForMenu);
                  setRenameValue(activeSkillForMenu.name);
                  setActiveMenuSkillId(null);
                }}
                className="w-full px-3.5 py-2 text-left text-xs text-zinc-200 hover:bg-[#282828] flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Edit3 size={13} className="text-zinc-400" />
                <span>Rename Skill</span>
              </button>

              <button
                onClick={() => {
                  setDeletingSkill(activeSkillForMenu);
                  setActiveMenuSkillId(null);
                }}
                className="w-full px-3.5 py-2 text-left text-xs text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-[#262626]"
              >
                <Trash2 size={13} />
                <span>Delete Skill</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Modal 1: New Skill */}
      {isNewModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setIsNewModalOpen(false)}
        >
          <div 
            className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-zinc-100">New Skill</h2>
              <button 
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#222] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="newSkillName" className="text-sm font-medium text-zinc-300">
                    Skill Name
                  </label>
                  <input
                    id="newSkillName"
                    type="text"
                    required
                    value={newSkillName}
                    onChange={e => setNewSkillName(e.target.value)}
                    placeholder="e.g. data-dictionary or sql-auditor"
                    className="bg-[#222] border border-[#333] rounded-lg px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                    autoFocus
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="newSkillDesc" className="text-sm font-medium text-zinc-300">
                    Description <span className="text-zinc-500 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="newSkillDesc"
                    rows={6}
                    value={newSkillDesc}
                    onChange={e => setNewSkillDesc(e.target.value)}
                    placeholder="Describe what this skill accomplishes, how it should be used, or its guidelines..."
                    className="bg-[#222] border border-[#333] rounded-lg px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors min-h-[150px] resize-y"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={!newSkillName.trim()}
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Rename Skill */}
      {renamingSkill && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setRenamingSkill(null)}
        >
          <div 
            className="bg-[#1a1a1a] border border-[#333] rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-zinc-100">Rename Skill</h2>
              <button 
                onClick={() => setRenamingSkill(null)}
                className="p-1.5 rounded-lg hover:bg-[#222] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="flex flex-col">
              <div className="flex flex-col gap-1.5 mb-6">
                <label htmlFor="renameSkillInput" className="text-sm font-medium text-zinc-300">
                  New Name
                </label>
                <input
                  id="renameSkillInput"
                  type="text"
                  required
                  autoFocus
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  className="bg-[#222] border border-[#333] rounded-lg px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setRenamingSkill(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!renameValue.trim()}
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Delete Confirmation */}
      {deletingSkill && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setDeletingSkill(null)}
        >
          <div 
            className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-zinc-100">Delete Skill</h2>
              <button 
                onClick={() => setDeletingSkill(null)}
                className="p-1.5 rounded-lg hover:bg-[#222] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <p className="text-sm text-zinc-400 mb-6">
              Are you sure you want to delete <span className="font-medium text-zinc-200">"{deletingSkill.name}"</span>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => setDeletingSkill(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-[#2a2a2a] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => {
                  onDeleteSkill(deletingSkill.id);
                  setDeletingSkill(null);
                }}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer"
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
