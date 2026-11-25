import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import NewChatView from './components/NewChatView';
import AllChatsView from './components/AllChatsView';
import ActiveChatView from './components/ActiveChatView';
import ProjectsView from './components/ProjectsView';
import ProjectDetailsView from './components/ProjectDetailsView';
import SkillsView from './components/SkillsView';
import SkillEditorView from './components/SkillEditorView';
import AgentsView from './components/AgentsView';
import AgentTemplateView from './components/AgentTemplateView';
import AgentChatView from './components/AgentChatView';
import { ChatSession, ViewState, Message, Project, Skill, Agent } from './types';
import { generateId, formatProjectContent, formatSkillContent } from './utils';

/* Seed agents shipped with the product (builtin library). */
const BUILTIN_AGENTS: Agent[] = [
  {
    id: 'agent-hypervisor',
    name: 'Hypervisor-3.4',
    description: 'Cyber agent with vulnerability assessment, penetration testing and defensive remediation capabilities.',
    instructions:
      'You are Hypervisor-3.4, an advanced cybersecurity agent. You specialize in vulnerability assessments, security architecture analysis, penetration testing methodologies, attack surface mapping, and defensive remediation strategies.',
    model: 'cisai-pro',
    category: 'builtin',
    author: 'HyperChat Core',
    dateString: 'Builtin',
    updatedAt: Date.now(),
    tools: ['Vulnerability Scanner', 'Network Auditor', 'Remediation Engine'],
    subAgents: [
      {
        id: 'sub-vuln-assessment',
        name: 'Vulnerability Assessment Module',
        description: 'Identifies CVEs, misconfigurations and outdated dependencies.',
        instructions: 'Perform structured vulnerability scans and risk classifications. Analyze dependency trees, CVE databases and configuration settings to produce CVSS scoring and remediation plans.',
      },
      {
        id: 'sub-pentest-auditor',
        name: 'Penetration Testing Auditor',
        description: 'Evaluates perimeter defenses within authorized scopes.',
        instructions: 'Conduct penetration testing reviews and threat modeling. Assess authentication boundaries, input sanitization, access control mechanisms and privilege escalation risks.',
      },
    ],
  },
  {
    id: 'agent-hyperqa',
    name: 'HyperQA',
    description: 'Software testing and quality assurance agent for test strategy, automation and regression analysis.',
    instructions:
      'You are HyperQA, an advanced software testing and QA agent. You specialize in test strategy formulation, end-to-end automation, edge-case generation, regression analysis, load/stress evaluation, and continuous quality governance.',
    model: 'cisai-pro',
    category: 'builtin',
    author: 'HyperChat Core',
    dateString: 'Builtin',
    updatedAt: Date.now(),
    tools: ['Automated Test Runner', 'API Contract Inspector', 'Coverage Profiler'],
    subAgents: [
      {
        id: 'sub-test-automation',
        name: 'Test Automation Specialist',
        description: 'Designs resilient unit, integration and E2E suites.',
        instructions: 'Generate resilient, decoupled test suites with thorough mocking and fixture strategies. Ensure coverage across happy paths and critical failure paths.',
      },
      {
        id: 'sub-edge-case-validator',
        name: 'Regression & Edge-Case Validator',
        description: 'Stress-tests boundary conditions and race hazards.',
        instructions: 'Rigorously stress system invariants. Identify boundary thresholds, null/empty state handling, asynchronous race conditions, and simulate mutation testing.',
      },
    ],
  },
];

/* Seed skill shipped with the product (builtin library). */
const BUILTIN_SKILLS: Skill[] = [
  {
    id: 'skill-audit',
    name: 'audit',
    description: 'Comprehensive system inspection and logic audit for validating code compliance, dependencies and security boundaries.',
    category: 'builtin',
    author: 'HyperChat Core',
    dateString: 'Builtin',
    updatedAt: Date.now(),
    content: 'Rule: Rigorously audit architecture invariants, permissions, security headers, and execution invariants before code deployment.',
    isLoaded: false,
  },
];

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('new');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [loadedProject, setLoadedProject] = useState<Project | null>(null);
  const [loadedSkill, setLoadedSkill] = useState<Skill | null>(null);
  const [loadedAgent, setLoadedAgent] = useState<Agent | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('cisai-lite');
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>(BUILTIN_SKILLS);
  const [agents, setAgents] = useState<Agent[]>(BUILTIN_AGENTS);

  /* ── navigation ── */
  const handleNewChat = () => {
    setCurrentView('new');
    setActiveChatId(null);
    setLoadedAgent(null);
  };

  const handleViewAllChats = () => {
    setCurrentView('all');
    setActiveChatId(null);
  };

  const handleViewProjects = () => {
    setCurrentView('projects');
    setActiveChatId(null);
  };

  const handleViewSkills = () => {
    setCurrentView('skills');
    setActiveChatId(null);
  };

  const handleViewAgents = () => {
    setCurrentView('agents');
    setActiveChatId(null);
    setLoadedAgent(null);
  };

  const handleSelectChat = (id: string) => {
    const chat = chats.find(c => c.id === id);
    if (chat?.agentId && chat.agentName) {
      const agent = agents.find(a => a.id === chat.agentId);
      if (agent) setLoadedAgent(agent);
    }
    setActiveChatId(id);
    setCurrentView('chat');
  };

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    setCurrentView('project_details');
  };

  const handleWorkOnProject = (project: Project) => {
    setLoadedProject(project);
    setCurrentView('new');
    setActiveChatId(null);
    setLoadedAgent(null);
  };

  /* ── agents ── */
  const handleOpenAgentChat = (agent: Agent) => {
    setLoadedAgent(agent);
    setActiveAgentId(agent.id);
    if (agent.model) setSelectedModel(agent.model);
    setCurrentView('agent_chat');
    setActiveChatId(null);
  };

  const handleConfigureAgent = (agent: Agent) => {
    setActiveAgentId(agent.id);
    setCurrentView('agent_template');
    setActiveChatId(null);
  };

  const handleCreateAgent = (name: string, description: string, instructions: string) => {
    const newAgent: Agent = {
      id: generateId(),
      name,
      description,
      instructions,
      dateString: 'just now',
      updatedAt: Date.now(),
      subAgents: [],
      category: 'custom',
    };
    setAgents(prev => [newAgent, ...prev]);
  };

  const handleUpdateAgent = (id: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
    if (loadedAgent?.id === id) {
      setLoadedAgent(prev => (prev ? { ...prev, ...updates } : null));
    }
  };

  const handleDeleteAgent = (id: string) => {
    setAgents(prev => prev.filter(a => a.id !== id));
    if (activeAgentId === id || loadedAgent?.id === id) {
      setLoadedAgent(null);
      handleViewAgents();
    }
  };

  /* ── skills ── */
  const handleSelectSkill = (id: string) => {
    const target = skills.find(s => s.id === id);
    if (target?.category === 'builtin') return; // builtin skills are read-only
    setActiveSkillId(id);
    setCurrentView('skill_editor');
    setActiveChatId(null);
  };

  const handleCreateSkill = (name: string, description: string, content: string) => {
    const newSkill: Skill = {
      id: generateId(),
      name,
      description,
      content,
      category: 'custom',
      author: 'you',
      dateString: 'just now',
      updatedAt: Date.now(),
      isLoaded: false,
    };
    setSkills(prev => [newSkill, ...prev]);
  };

  const handleUpdateSkill = (id: string, updates: Partial<Skill>) => {
    setSkills(prev => prev.map(s => {
      if (s.id !== id) return s;
      if (s.category === 'builtin') return s;
      return { ...s, ...updates };
    }));
    if (loadedSkill?.id === id && loadedSkill.category !== 'builtin') {
      setLoadedSkill(prev => (prev ? { ...prev, ...updates } : null));
    }
  };

  const handleDeleteSkill = (id: string) => {
    const target = skills.find(s => s.id === id);
    if (target?.category === 'builtin') return;
    setSkills(prev => prev.filter(s => s.id !== id));
    if (loadedSkill?.id === id) setLoadedSkill(null);
  };

  const handleToggleLoadSkill = (id: string) => {
    const target = skills.find(s => s.id === id);
    if (!target) return;

    if (loadedSkill?.id === id) {
      setLoadedSkill(null);
      setSkills(prev => prev.map(s => (s.id === id ? { ...s, isLoaded: false } : s)));
    } else {
      setLoadedSkill(target);
      setSkills(prev => prev.map(s => (s.id === id ? { ...s, isLoaded: true } : { ...s, isLoaded: false })));
      if (currentView !== 'new') {
        setCurrentView('new');
        setActiveChatId(null);
      }
    }
  };

  const handleLoadProject = (project: Project) => setLoadedProject(project);
  const handleLoadSkill = (skill: Skill) => {
    setLoadedSkill(skill);
    setSkills(prev => prev.map(s => (s.id === skill.id ? { ...s, isLoaded: true } : { ...s, isLoaded: false })));
  };
  const handleUnloadProject = () => setLoadedProject(null);
  const handleUnloadSkill = () => {
    if (loadedSkill) {
      setSkills(prev => prev.map(s => (s.id === loadedSkill.id ? { ...s, isLoaded: false } : s)));
    }
    setLoadedSkill(null);
  };

  /* ── chats, projects ── */
  const handleDeleteChat = (id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) handleNewChat();
  };

  const handleToggleFlag = (id: string) => {
    setChats(prev => prev.map(c => (c.id === id ? { ...c, isFlagged: !c.isFlagged } : c)));
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    setChats(prev => prev.map(c => (c.id === id ? { ...c, title: newTitle } : c)));
  };

  const handleToggleProjectFlag = (id: string) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, isFlagged: !p.isFlagged } : p)));
  };

  const handleRenameProject = (id: string, newTitle: string) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, name: newTitle } : p)));
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (loadedProject?.id === id) setLoadedProject(null);
    if (activeProjectId === id) {
      setActiveProjectId(null);
      setCurrentView('projects');
    }
  };

  /* ── message send (simulated backend) ── */
  const handleSendMessage = (
    content: string,
    isGhostMode?: boolean,
    attachments?: { id: string; name: string; size: number | string }[]
  ) => {
    const projectPayload = loadedProject ? formatProjectContent(loadedProject) : '';
    const skillPayload = loadedSkill ? formatSkillContent(loadedSkill) : '';
    const payloads: string[] = [];
    if (projectPayload) payloads.push(projectPayload);
    if (skillPayload) payloads.push(skillPayload);
    const fullContent = payloads.length > 0 ? `${payloads.join('\n\n')}\n\n${content}` : content;

    const userAttachments = attachments?.map(a => ({
      id: a.id,
      name: a.name,
      size: typeof a.size === 'number' ? `${(a.size / 1024).toFixed(1)} KB` : a.size,
      uploadedAt: Date.now(),
    }));

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: fullContent,
      displayText: content,
      attachments: userAttachments,
      projectContext: loadedProject ? { projectId: loadedProject.id, projectName: loadedProject.name, details: projectPayload } : undefined,
      skillContext: loadedSkill ? { skillId: loadedSkill.id, skillName: loadedSkill.name, details: skillPayload } : undefined,
      timestamp: Date.now(),
    };

    const lower = content.toLowerCase();
    const needsPlan = ['plan', 'step', 'todo', 'build', 'design', 'create'].some(k => lower.includes(k)) || (userAttachments?.length || 0) > 0;

    let assistantText: string;
    let assistantTodos: Message['todos'];
    let assistantDeliverables: Message['deliverables'];

    if (loadedAgent) {
      assistantText = `**${loadedAgent.name} ready.**\n\nI'm operating under my agent instructions and sub-agent configuration. Here's how I'd approach this:\n\n- Understand your request and constraints\n- Delegate specialised work to my sub-agents\n- Deliver reviewed, actionable output\n\nWhat would you like me to start with?`;
    } else if (needsPlan) {
      assistantTodos = [
        { id: generateId(), title: 'Analyze requirements and dependencies', completed: true, stepNumber: 1, description: 'Reviewed specifications and context parameters' },
        { id: generateId(), title: 'Implement architecture core and state handlers', completed: false, stepNumber: 2, description: 'Engine logic and integration pathways' },
        { id: generateId(), title: 'Validate edge-case behaviors and telemetry', completed: false, stepNumber: 3, description: 'Continuous assurance and test validation' },
      ];
      assistantDeliverables = [
        {
          id: generateId(),
          name: 'solution.ts',
          type: 'typescript',
          size: '12 lines',
          content: '// Draft solution artifact\nexport function solve(input: unknown) {\n  return input;\n}',
          timestamp: Date.now(),
        },
      ];
      assistantText = `Here's my plan for "${content.slice(0, 60)}${content.length > 60 ? '…' : ''}":\n\n- [x] Analyze requirements and dependencies\n- [ ] Implement architecture core and state handlers\n- [ ] Validate edge-case behaviors and telemetry\n\n\`solution.ts\` drafted — open it from the message below.`;
    } else if (loadedProject && loadedSkill) {
      assistantText = `I've loaded both the **${loadedProject.name}** project and the **${loadedSkill.name}** skill into this conversation. What would you like to work on?`;
    } else if (loadedProject) {
      assistantText = `I've loaded **${loadedProject.name}**${loadedProject.files?.length ? ` (${loadedProject.files.length} file${loadedProject.files.length > 1 ? 's' : ''})` : ''} as context. What would you like to do with it?`;
    } else if (loadedSkill) {
      assistantText = `I've loaded the **${loadedSkill.name}** skill into this chat. How can I apply it for you?`;
    } else {
      assistantText = `Here's my take on that:\n\n${content.slice(0, 200)}${content.length > 200 ? '…' : ''} is a good starting point — let me know the direction you'd like to go, or attach a project for deeper context.`;
    }

    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: assistantText,
      todos: assistantTodos,
      deliverables: assistantDeliverables,
      timestamp: Date.now() + 1000,
    };

    const isGhost = Boolean(isGhostMode);

    if (currentView === 'new' || currentView === 'agent_chat' || !activeChatId) {
      const newChat: ChatSession = {
        id: generateId(),
        title: content.slice(0, 48) + (content.length > 48 ? '…' : ''),
        updatedAt: Date.now(),
        isFlagged: false,
        messages: [userMessage, assistantMessage],
        agentId: loadedAgent?.id,
        agentName: loadedAgent?.name,
        isGhost: isGhost && !loadedAgent,
        uploads: isGhost ? [] : (userAttachments ? [...userAttachments] : []),
      };
      if (!isGhost) setChats(prev => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setCurrentView('chat');
    } else {
      setChats(prev =>
        prev.map(c => {
          if (c.id !== activeChatId) return c;
          return {
            ...c,
            updatedAt: Date.now(),
            messages: [...c.messages, userMessage, assistantMessage],
            uploads: userAttachments ? [...(c.uploads || []), ...userAttachments] : c.uploads,
          };
        })
      );
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId);
  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeSkill = skills.find(s => s.id === activeSkillId);
  const activeAgent = agents.find(a => a.id === activeAgentId);

  /* Ghost chats are never stored; render them from the in-memory id only */
  const renderChat = currentView === 'chat' && activeChatId
    ? chats.find(c => c.id === activeChatId)
    : undefined;
  const ghostChat: ChatSession | undefined =
    currentView === 'chat' && activeChatId && !renderChat
      ? {
          id: activeChatId,
          title: 'Ghost conversation',
          updatedAt: Date.now(),
          isFlagged: false,
          isGhost: true,
          messages: [],
        }
      : undefined;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-ink-900">
      <Sidebar
        chats={chats}
        projects={projects}
        currentView={currentView}
        activeChatId={activeChatId}
        activeProjectId={activeProjectId}
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onNewChat={handleNewChat}
        onViewAllChats={handleViewAllChats}
        onViewProjects={handleViewProjects}
        onViewSkills={handleViewSkills}
        onViewAgents={handleViewAgents}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onToggleFlag={handleToggleFlag}
        onRenameChat={handleRenameChat}
        onSelectProject={handleSelectProject}
        onWorkOnProject={handleWorkOnProject}
        onDeleteProject={handleDeleteProject}
        onToggleProjectFlag={handleToggleProjectFlag}
        onRenameProject={handleRenameProject}
      />

      <main className="relative flex h-full flex-1 flex-col overflow-hidden">
        {currentView === 'new' && (
          <NewChatView
            onSendMessage={handleSendMessage}
            loadedProject={loadedProject}
            onUnloadProject={handleUnloadProject}
            loadedSkill={loadedSkill}
            onUnloadSkill={handleUnloadSkill}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            projects={projects}
            skills={skills}
            onLoadProject={handleLoadProject}
            onLoadSkill={handleLoadSkill}
          />
        )}

        {currentView === 'all' && (
          <AllChatsView
            chats={chats}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
            onToggleFlag={handleToggleFlag}
            onRenameChat={handleRenameChat}
          />
        )}

        {currentView === 'projects' && (
          <ProjectsView
            projects={projects}
            onDeleteProject={handleDeleteProject}
            onCreateProject={(name, description) => {
              const newProject: Project = {
                id: generateId(),
                name,
                description,
                dateString: 'just now',
                updatedAt: Date.now(),
                files: [],
              };
              setProjects(prev => [newProject, ...prev]);
            }}
            onSelectProject={handleSelectProject}
            onWorkOnProject={handleWorkOnProject}
            onToggleProjectFlag={handleToggleProjectFlag}
            onRenameProject={handleRenameProject}
          />
        )}

        {currentView === 'project_details' && activeProject && (
          <ProjectDetailsView
            project={activeProject}
            onBack={handleViewProjects}
            onUpdateProject={(id, updates) =>
              setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...updates, dateString: 'just now', updatedAt: Date.now() } : p)))
            }
            onWorkOnProject={handleWorkOnProject}
          />
        )}

        {currentView === 'skills' && (
          <SkillsView
            skills={skills}
            onCreateSkill={handleCreateSkill}
            onUpdateSkill={handleUpdateSkill}
            onDeleteSkill={handleDeleteSkill}
            onToggleLoadSkill={handleToggleLoadSkill}
            onSelectSkill={handleSelectSkill}
            loadedSkill={loadedSkill}
          />
        )}

        {currentView === 'skill_editor' && activeSkill && (
          <SkillEditorView
            skill={activeSkill}
            onBack={handleViewSkills}
            onUpdateSkill={handleUpdateSkill}
            onDeleteSkill={handleDeleteSkill}
            onToggleLoadSkill={handleToggleLoadSkill}
            isLoaded={loadedSkill?.id === activeSkill.id}
          />
        )}

        {currentView === 'agents' && (
          <AgentsView
            agents={agents}
            onCreateAgent={handleCreateAgent}
            onUpdateAgent={handleUpdateAgent}
            onDeleteAgent={handleDeleteAgent}
            onSelectAgent={handleOpenAgentChat}
            onConfigureAgent={handleConfigureAgent}
          />
        )}

        {currentView === 'agent_chat' && loadedAgent && (
          <AgentChatView
            agent={loadedAgent}
            onSendMessage={handleSendMessage}
            onBack={handleViewAgents}
            loadedProject={loadedProject}
            onUnloadProject={handleUnloadProject}
            loadedSkill={loadedSkill}
            onUnloadSkill={handleUnloadSkill}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            projects={projects}
            skills={skills}
            onLoadProject={handleLoadProject}
            onLoadSkill={handleLoadSkill}
          />
        )}

        {currentView === 'agent_template' && activeAgent && (
          <AgentTemplateView
            agent={activeAgent}
            onBack={handleViewAgents}
            onUpdateAgent={handleUpdateAgent}
            onStartChat={handleOpenAgentChat}
          />
        )}

        {currentView === 'chat' && (renderChat || ghostChat) && (
          <ActiveChatView
            chat={renderChat || ghostChat!}
            onSendMessage={handleSendMessage}
            loadedProject={loadedProject}
            onUnloadProject={handleUnloadProject}
            loadedSkill={loadedSkill}
            onUnloadSkill={handleUnloadSkill}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            projects={projects}
            skills={skills}
            onLoadProject={handleLoadProject}
            onLoadSkill={handleLoadSkill}
          />
        )}

        {/* Fallback when a view's target was deleted mid-session */}
        {((currentView === 'chat' && !renderChat && !ghostChat) ||
          (currentView === 'project_details' && !activeProject) ||
          (currentView === 'skill_editor' && !activeSkill) ||
          (currentView === 'agent_template' && !activeAgent) ||
          (currentView === 'agent_chat' && !loadedAgent)) && (
          <div className="flex flex-1 items-center justify-center bg-ink-900">
            <button className="btn-secondary" onClick={handleNewChat}>Start a new chat</button>
          </div>
        )}
      </main>
    </div>
  );
}
