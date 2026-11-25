import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, MoreHorizontal, Trash2, X, Flag, Edit2, FolderOpen } from 'lucide-react';
import { Project } from '../types';

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
  onRenameProject 
}: ProjectsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenFor(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const confirmDelete = () => {
    if (projectToDelete) {
      onDeleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim(), newProjectDescription.trim());
      setNewProjectName('');
      setNewProjectDescription('');
      setIsCreateModalOpen(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#151515] text-[#e4e4e7]">
      <div className="max-w-6xl w-full mx-auto px-6 sm:px-8 py-8 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-serif text-zinc-100">Projects</h1>
          
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search size={16} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="bg-[#222] border border-[#333] rounded-full py-1.5 pl-9 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-all w-[180px] focus:w-[240px]"
              />
            </div>
            
            <button className="flex items-center gap-2 bg-[#222] border border-[#333] hover:bg-[#2c2c2c] transition-colors rounded-full px-4 py-1.5 text-sm text-zinc-300">
              <span className="text-zinc-500">Sort by</span>
              Last updated
              <ChevronDown size={14} strokeWidth={2} className="text-zinc-500 ml-1" />
            </button>
            
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-zinc-100 hover:bg-white text-zinc-900 font-medium px-4 py-1.5 rounded-full text-sm transition-colors cursor-pointer"
            >
              New Project
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-12">
          {filteredProjects.length === 0 ? (
            <div className="text-center text-zinc-500 mt-20 text-sm">
              {searchQuery ? `No projects matching "${searchQuery}"` : 'No projects found'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map(project => (
                <div 
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className="group relative flex flex-col text-left bg-[#181818] border border-[#262626] hover:bg-[#1d1d1d] hover:border-[#383838] transition-all rounded-xl p-4 min-h-[110px] cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[15px] font-medium text-zinc-200 pr-2">{project.name}</h3>
                    <div className="relative flex items-center" ref={menuOpenFor === project.id ? menuRef : null}>
                      <div className="flex items-center overflow-hidden">
                        {project.isFlagged && (
                          <div className={`flex items-center justify-center transition-all duration-300 ${menuOpenFor === project.id ? 'mr-1 opacity-100' : 'mr-0 group-hover:mr-1 opacity-100 group-hover:opacity-100'}`}>
                             <Flag size={14} className="text-amber-500/80 flex-shrink-0" strokeWidth={2.5} />
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenFor(menuOpenFor === project.id ? null : project.id);
                          }}
                          className={`flex items-center justify-center rounded-md hover:bg-[#333] text-zinc-400 hover:text-zinc-200 transition-all duration-300 ${menuOpenFor === project.id ? 'opacity-100 bg-[#333] text-zinc-200 w-7 h-7' : project.isFlagged ? 'opacity-0 w-0 h-7 group-hover:opacity-100 group-hover:w-7 overflow-hidden' : 'opacity-0 group-hover:opacity-100 w-7 h-7'}`}
                        >
                          <MoreHorizontal size={16} strokeWidth={2} className="flex-shrink-0" />
                        </button>
                      </div>
                      
                      {menuOpenFor === project.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-[#222] border border-[#333] rounded-lg shadow-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100 flex flex-col">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onWorkOnProject(project);
                              setMenuOpenFor(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-[#333] hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                          >
                            <FolderOpen size={14} strokeWidth={2} />
                            Work on it
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleProjectFlag(project.id);
                              setMenuOpenFor(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-[#333] hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                          >
                            <Flag size={14} strokeWidth={2} />
                            {project.isFlagged ? 'Unflag' : 'Flag'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newTitle = prompt('Enter new project name:', project.name);
                              if (newTitle) onRenameProject(project.id, newTitle);
                              setMenuOpenFor(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-[#333] hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                          >
                            <Edit2 size={14} strokeWidth={2} />
                            Edit
                          </button>
                          <div className="h-px bg-[#333] my-1 mx-2" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete(project);
                              setMenuOpenFor(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-[#333] hover:text-red-300 transition-colors flex items-center gap-2 whitespace-nowrap"
                          >
                            <Trash2 size={14} strokeWidth={2} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-end w-full mt-2">
                    {project.description && (
                      <div className="text-[13px] text-zinc-400 leading-relaxed mb-4 line-clamp-3">
                        {project.description}
                      </div>
                    )}
                    <div className="text-[13px] text-zinc-500 mt-auto">
                      {project.dateString}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-zinc-100">Delete Project</h2>
              <button 
                onClick={() => setProjectToDelete(null)}
                className="p-1.5 rounded-lg hover:bg-[#222] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
              Are you sure you want to delete <span className="font-medium text-zinc-200">"{projectToDelete.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-[#2a2a2a] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => {
            setIsCreateModalOpen(false);
            setNewProjectName('');
            setNewProjectDescription('');
          }}
        >
          <div 
            className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-zinc-100">New Project</h2>
              <button 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewProjectName('');
                  setNewProjectDescription('');
                }}
                className="p-1.5 rounded-lg hover:bg-[#222] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newProjectName.trim()) {
                  handleCreateProject();
                }
              }}
              className="flex flex-col"
            >
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="projectName" className="text-sm font-medium text-zinc-300">
                    Project Name
                  </label>
                  <input 
                    id="projectName"
                    type="text"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Website Redesign"
                    className="bg-[#222] border border-[#333] rounded-lg px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                    autoFocus
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="projectDescription" className="text-sm font-medium text-zinc-300">
                    Description <span className="text-zinc-500 font-normal">(Optional)</span>
                  </label>
                  <textarea 
                    id="projectDescription"
                    rows={6}
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Briefly describe what this project is about..."
                    className="bg-[#222] border border-[#333] rounded-lg px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors min-h-[150px] resize-y"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end">
                <button 
                  type="submit"
                  disabled={!newProjectName.trim()}
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
