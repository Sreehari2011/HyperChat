import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  MessageSquarePlus, 
  MessagesSquare, 
  Settings, 
  PanelLeftClose, 
  PanelLeftOpen,
  Folder,
  FolderOpen,
  Key,
  LogOut,
  X,
  MoreVertical,
  Flag,
  Edit2,
  Trash2,
  FilePenLine,
  Bot,
  Plug
} from 'lucide-react';
import { ChatSession, ViewState, Project } from '../types';

interface SidebarProps {
  chats: ChatSession[];
  projects: Project[];
  currentView: ViewState;
  activeChatId: string | null;
  activeProjectId?: string | null;
  isOpen?: boolean;
  onToggleSidebar?: () => void;
  onNewChat: () => void;
  onViewAllChats: () => void;
  onViewProjects: () => void;
  onViewSkills?: () => void;
  onViewAgents?: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onToggleFlag: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onSelectProject: (id: string) => void;
  onWorkOnProject?: (project: Project) => void;
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
  isOpen: controlledIsOpen,
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
  onRenameProject
}: SidebarProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const handleToggleOpen = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isSignoutModalOpen, setIsSignoutModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuPopupRef = useRef<HTMLDivElement>(null);
  const [userMenuPos, setUserMenuPos] = useState<{ bottom: number; left: number; width: number } | null>(null);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isUserMenuClick = 
        (userMenuRef.current && userMenuRef.current.contains(target)) ||
        (userMenuPopupRef.current && userMenuPopupRef.current.contains(target));
      if (!isUserMenuClick) {
        setUserMenuOpen(false);
      }
      // Also close context menus
      const isMenuClick = (event.target as Element).closest('.sidebar-context-menu');
      if (!isMenuClick) {
        setActiveMenuId(null);
      }
    }

    const handleResize = () => {
      setUserMenuOpen(false);
      setActiveMenuId(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleToggleUserMenu = () => {
    if (!userMenuOpen) {
      if (userButtonRef.current) {
        const rect = userButtonRef.current.getBoundingClientRect();
        setUserMenuPos({
          bottom: window.innerHeight - rect.top + 8,
          left: rect.left,
          width: isOpen ? rect.width : 240,
        });
      }
      setUserMenuOpen(true);
    } else {
      setUserMenuOpen(false);
    }
  };

  const flaggedChats = chats.filter(c => c.isFlagged && !c.isGhost);
  const flaggedProjects = projects.filter(p => p.isFlagged);
  const recentChats = [...chats].filter(c => !c.isGhost).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 30);

  const renderProjectItem = (project: Project, category: string) => {
    const menuId = `${project.id}-${category}`;
    const isActive = currentView === 'project_details' && activeProjectId === project.id;
    return (
    <div
      key={menuId}
      className={`flex items-center justify-between group px-3 py-2 rounded-lg text-sm transition-colors duration-150 text-left w-full cursor-pointer relative ${
        isActive 
          ? 'bg-[#27272a] text-white font-medium border border-white/10 shadow-sm' 
          : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200 border border-transparent'
      } ${activeMenuId === menuId ? 'z-50' : 'z-0'}`}
      onClick={() => onSelectProject(project.id)}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden pr-6">
        <Folder size={14} className="flex-shrink-0" />
        <span className="truncate block w-full">{project.name}</span>
      </div>
      
      <button 
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
          setActiveMenuId(activeMenuId === menuId ? null : menuId);
        }}
        className={`absolute right-1 p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-[#333] transition-all ${activeMenuId === menuId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      >
        <MoreVertical size={14} strokeWidth={2} />
      </button>

      {activeMenuId === menuId && menuPos && createPortal(
        <div 
          className="fixed bg-[#222] border border-[#333] rounded-lg shadow-xl shadow-black/50 py-1 w-40 z-[100] flex flex-col animate-in fade-in zoom-in-95 duration-100 sidebar-context-menu"
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onWorkOnProject) {
                onWorkOnProject(project);
              } else {
                onSelectProject(project.id);
              }
              setActiveMenuId(null);
            }}
            className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-[#333] hover:text-white text-left w-full whitespace-nowrap"
          >
            <FolderOpen size={14} strokeWidth={2} />
            Work on it
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleProjectFlag(project.id);
              setActiveMenuId(null);
            }}
            className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-[#333] hover:text-white text-left w-full whitespace-nowrap"
          >
            <Flag size={14} strokeWidth={2} />
            {project.isFlagged ? 'Unflag' : 'Flag'}
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const newTitle = prompt('Enter new project name:', project.name);
              if (newTitle) onRenameProject(project.id, newTitle);
              setActiveMenuId(null);
            }}
            className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-[#333] hover:text-white text-left w-full"
          >
            <Edit2 size={14} strokeWidth={2} />
            Rename
          </button>
          <div className="h-px bg-[#333] my-1 mx-2" />
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDeleteProject(project.id);
              setActiveMenuId(null);
            }}
            className="flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-[#333] hover:text-red-300 text-left w-full"
          >
            <Trash2 size={14} strokeWidth={2} />
            Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  );
  }

  const renderChatItem = (chat: ChatSession, category: string) => {
    const menuId = `${chat.id}-${category}`;
    const isActive = activeChatId === chat.id && currentView === 'chat';
    return (
    <div
      key={menuId}
      className={`flex items-center justify-between group px-3 py-2 rounded-lg text-sm transition-colors duration-150 text-left w-full cursor-pointer relative ${
        isActive 
          ? 'bg-[#27272a] text-white font-medium border border-white/10 shadow-sm' 
          : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200 border border-transparent'
      } ${activeMenuId === menuId ? 'z-50' : 'z-0'}`}
      onClick={() => onSelectChat(chat.id)}
    >
      <div className="flex-1 min-w-0 overflow-hidden pr-6">
        <span className="truncate block w-full">{chat.title}</span>
      </div>
      
      <button 
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
          setActiveMenuId(activeMenuId === menuId ? null : menuId);
        }}
        className={`absolute right-1 p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-[#333] transition-all ${activeMenuId === menuId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      >
        <MoreVertical size={14} strokeWidth={2} />
      </button>

      {activeMenuId === menuId && menuPos && createPortal(
        <div 
          className="fixed bg-[#222] border border-[#333] rounded-lg shadow-xl shadow-black/50 py-1 w-36 z-[100] flex flex-col animate-in fade-in zoom-in-95 duration-100 sidebar-context-menu"
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleFlag(chat.id);
              setActiveMenuId(null);
            }}
            className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-[#333] hover:text-white text-left w-full"
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
            className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-[#333] hover:text-white text-left w-full"
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
            className="flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-[#333] hover:text-red-300 text-left w-full"
          >
            <Trash2 size={14} strokeWidth={2} />
            Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  );
  }

  const isNewChatActive = currentView === 'new';
  const isHistoryActive = currentView === 'all';
  const isProjectsActive = currentView === 'projects' || (currentView === 'project_details' && !activeChatId && !activeProjectId);
  const isSkillsActive = currentView === 'skills' || currentView === 'skill_editor';
  const isAgentsActive = currentView === 'agents' || currentView === 'agent_template' || currentView === 'agent_chat';

  const renderNavItem = (
    label: string,
    icon: React.ReactNode,
    isActive: boolean,
    onClick: () => void,
    title?: string
  ) => (
    <button 
      onClick={onClick}
      className={`flex items-center rounded-lg text-left w-full h-10 group cursor-pointer relative px-2.5 transition-colors duration-150 ${
        isActive 
          ? 'bg-[#27272a] text-white font-medium' 
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
      }`}
      title={!isOpen ? (title || label) : undefined}
    >
      <div className="flex items-center min-w-0 overflow-hidden relative z-10 w-full">
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150 ${
            isActive
              ? 'bg-[#38383c] border border-white/20 text-white shadow-inner' 
              : 'bg-[#181818] border border-[#262626] text-zinc-400 group-hover:bg-[#202022] group-hover:border-[#38383c] group-hover:text-zinc-200'
          }`}>
            {icon}
          </div>
        </div>
        {isOpen && (
          <span 
            className={`whitespace-nowrap text-sm ml-2.5 overflow-hidden truncate ${
              isActive ? 'font-medium text-white' : 'font-normal text-zinc-400 group-hover:text-zinc-200'
            }`}
          >
            {label}
          </span>
        )}
      </div>
    </button>
  );

  return (
    <aside 
      className={`flex flex-col h-full bg-[#111] border-r border-[#222] flex-shrink-0 overflow-hidden select-none relative ${
        isOpen ? 'w-[290px]' : 'w-16'
      }`}
    >
      <div className="flex items-center justify-between px-3 h-[60px] flex-shrink-0 overflow-hidden">
        <div className="flex items-center min-w-0 overflow-hidden">
          {isOpen && (
            <button
              onClick={onNewChat}
              className="text-2xl font-semibold text-zinc-100 tracking-wide font-serif whitespace-nowrap overflow-hidden hover:text-white text-left ml-1 cursor-pointer"
            >
              Hypervisor
            </button>
          )}
        </div>
        <button 
          onClick={handleToggleOpen}
          className="w-10 h-10 flex items-center justify-center hover:bg-white/[0.06] rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0 cursor-pointer"
          title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isOpen ? <PanelLeftClose size={20} strokeWidth={1.5} /> : <PanelLeftOpen size={20} strokeWidth={1.5} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar py-2 flex flex-col gap-6 px-3">
        <div className="flex flex-col gap-1 w-full flex-shrink-0">
          {renderNavItem(
            "New chat",
            <MessageSquarePlus size={14} strokeWidth={1.5} />,
            isNewChatActive,
            onNewChat
          )}
          
          {renderNavItem(
            "History",
            <MessagesSquare size={14} strokeWidth={1.5} />,
            isHistoryActive,
            onViewAllChats
          )}
          
          {renderNavItem(
            "Projects",
            <Folder size={14} strokeWidth={1.5} />,
            isProjectsActive,
            onViewProjects
          )}
          
          {renderNavItem(
            "Skills",
            <FilePenLine size={14} strokeWidth={1.5} />,
            isSkillsActive,
            onViewSkills || (() => {})
          )}

          {renderNavItem(
            "Agents",
            <Bot size={14} strokeWidth={1.5} />,
            isAgentsActive,
            onViewAgents || (() => {})
          )}

          {renderNavItem(
            "Connectors",
            <Plug size={14} strokeWidth={1.5} />,
            false,
            () => {}
          )}
        </div>

        {isOpen && (
          <div className="flex flex-col gap-6 min-h-0 min-w-0 w-full overflow-hidden">
            {(flaggedChats.length > 0 || flaggedProjects.length > 0) && (
              <div className="flex flex-col gap-0.5 w-full min-w-0">
                <div className="text-xs font-medium text-zinc-500 tracking-wider px-3 mb-1 whitespace-nowrap">
                  Flagged
                </div>
                {flaggedProjects.map(project => renderProjectItem(project, 'flagged'))}
                {flaggedChats.map(chat => renderChatItem(chat, 'flagged'))}
              </div>
            )}

            {recentChats.length > 0 && (
              <div className="flex flex-col gap-0.5 w-full min-w-0">
                <div className="text-xs font-medium text-zinc-500 tracking-wider px-3 mb-1 whitespace-nowrap">
                  Recents
                </div>
                {recentChats.map(chat => renderChatItem(chat, 'recent'))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[#222] p-3 flex-shrink-0 relative" ref={userMenuRef}>
        <button 
          ref={userButtonRef}
          onClick={handleToggleUserMenu}
          className="flex items-center rounded-lg hover:bg-white/[0.05] transition-colors group w-full overflow-hidden h-10 cursor-pointer px-1"
          title={!isOpen ? "User Menu" : undefined}
        >
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-200 group-hover:ring-2 ring-zinc-700 transition-colors flex-shrink-0 ml-1">
            SH
          </div>
          {isOpen && (
            <span className="text-sm font-medium text-zinc-300 group-hover:text-white whitespace-nowrap ml-3 overflow-hidden">
              Sreehari H
            </span>
          )}
        </button>
        
        {userMenuOpen && userMenuPos && createPortal(
          <div 
            ref={userMenuPopupRef}
            className="fixed bg-[#222] border border-[#333] rounded-lg shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-100"
            style={{
              bottom: `${userMenuPos.bottom}px`,
              left: `${userMenuPos.left}px`,
              width: `${userMenuPos.width}px`
            }}
          >
            <div className="flex flex-col py-1">
              <button 
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-[#333] hover:text-zinc-100 transition-colors text-left whitespace-nowrap"
              >
                <Settings size={16} className="text-zinc-400" />
                Settings
              </button>
              <button 
                onClick={() => {
                  setIsApiKeyModalOpen(true);
                  setUserMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-[#333] hover:text-zinc-100 transition-colors text-left whitespace-nowrap"
              >
                <Key size={16} className="text-zinc-400" />
                Link API key
              </button>
              <div className="h-px bg-[#333] my-1"></div>
              <button 
                onClick={() => {
                  setIsSignoutModalOpen(true);
                  setUserMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[#333] hover:text-red-300 transition-colors text-left whitespace-nowrap"
              >
                <LogOut size={16} className="text-red-400" />
                Logout
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Signout Confirmation Modal */}
      {isSignoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-zinc-100">Logout</h2>
              <button 
                onClick={() => setIsSignoutModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#222] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsSignoutModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-[#2a2a2a] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setIsSignoutModalOpen(false);
                  // Add actual signout logic here later
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-zinc-100">Link API Key</h2>
              <button 
                onClick={() => setIsApiKeyModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#222] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-300">Endpoint <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors" 
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-300">API Key <span className="text-red-400">*</span></label>
                <input 
                  type="password" 
                  className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors" 
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsApiKeyModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-[#2a2a2a] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setIsApiKeyModalOpen(false);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                Link
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
