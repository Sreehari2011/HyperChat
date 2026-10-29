import React, { useState, useEffect } from 'react';
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
  const [projects, setProjects] = useState<Project[]>([
    {
      id: generateId(),
      name: 'test',
      instructions: '',
      dateString: 'just now',
      updatedAt: Date.now(),
      files: [
        { 
          id: generateId(), 
          name: 'ControlPanel.tsx', 
          type: 'file', 
          tokens: 1150,
          size: '1.2k tokens', 
          content: `import React, { useState } from 'react';\n\nexport default function ControlPanel() {\n  const [status, setStatus] = useState('active');\n  return (\n    <div className="control-panel">\n      <h2>Control Panel</h2>\n      <p>System state: {status}</p>\n    </div>\n  );\n}` 
        },
        { 
          id: generateId(), 
          name: 'DataPanel.tsx', 
          type: 'file', 
          tokens: 1400,
          size: '1.4k tokens', 
          content: `import React from 'react';\n\nexport function DataPanel({ telemetry }: { telemetry: Record<string, number> }) {\n  return (\n    <div className="data-panel">\n      <h3>Telemetry Metrics</h3>\n    </div>\n  );\n}` 
        },
        { 
          id: generateId(), 
          name: 'globals.css', 
          type: 'file', 
          tokens: 122,
          size: '122 tokens', 
          content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  --bg-primary: #121212;\n  --text-main: #f4f4f5;\n}` 
        },
        { 
          id: generateId(), 
          name: 'layout.tsx', 
          type: 'file', 
          tokens: 175,
          size: '175 tokens', 
          content: `export default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}` 
        },
        { 
          id: generateId(), 
          name: 'page.tsx', 
          type: 'file', 
          tokens: 3800,
          size: '3.8k tokens', 
          content: `'use client';\n\nimport React from 'react';\nimport ControlPanel from './ControlPanel';\n\nexport default function Page() {\n  return (\n    <main className="min-h-screen p-8">\n      <ControlPanel />\n    </main>\n  );\n}` 
        },
        { 
          id: generateId(), 
          name: 'main.py', 
          type: 'file', 
          tokens: 3400,
          size: '3.4k tokens', 
          content: `"""\nHypervisor Daemon Core\n"""\nimport logging\n\ndef run():\n    logging.info("Core orchestrator initialized")\n\nif __name__ == "__main__":\n    run()` 
        },
        { 
          id: generateId(), 
          name: 'test_orchestrator.py', 
          type: 'file', 
          tokens: 5125,
          size: '5.1k tokens', 
          content: `import unittest\n\nclass TestOrchestration(unittest.TestCase):\n    def test_startup(self):\n        self.assertTrue(True)` 
        },
        { 
          id: generateId(), 
          name: 'utils.py', 
          type: 'file', 
          tokens: 198,
          size: '198 tokens', 
          content: `import hashlib\n\ndef hash_string(val: str) -> str:\n    return hashlib.sha256(val.encode()).hexdigest()` 
        }
      ]
    },
    {
      id: generateId(),
      name: 'Hypervisor',
      description: 'Frontier AI orchestration core and system hypervisor.',
      dateString: 'May 17',
      updatedAt: Date.now() - 8640000000,
      files: [
        { id: generateId(), name: 'hypervisor_core.ts', type: 'file', tokens: 3100, size: '3.1k tokens', content: '// Core Hypervisor orchestrator\nexport class HypervisorCore {\n  constructor() {\n    console.log("Core initialized");\n  }\n}' },
        { id: generateId(), name: 'architecture.md', type: 'file', tokens: 1200, size: '1.2k tokens', content: '# Hypervisor Architecture\n- Micro-kernel task dispatch\n- Isolated sandboxing\n- Context streaming' }
      ]
    },
    {
      id: generateId(),
      name: 'Yantraksh',
      description: 'Yantraksh is a completely automated framework that can test a web application autonomously thus replacing the QA. The Yantraksh can be triggered both...',
      dateString: 'Dec 14, 2025',
      updatedAt: Date.now() - 86400000 * 30,
      files: [
        { id: generateId(), name: 'yantraksh_runner.py', type: 'file', tokens: 2025, size: '2.0k tokens', content: '# Autonomous QA execution engine\ndef run_suite():\n    pass' },
        { id: generateId(), name: 'test_plan.json', type: 'file', tokens: 625, size: '625 tokens', content: '{\n  "target": "web_app",\n  "heuristics": ["accessibility", "functional", "performance"]\n}' }
      ]
    }
  ]);

  const [skills, setSkills] = useState<Skill[]>([
    {
      id: 'skill-test-1',
      name: 'This is a Test skill',
      description: 'This is a Test skill. it does nothing and is created as part of the development process',
      category: 'custom',
      author: 'you',
      dateString: 'just now',
      updatedAt: Date.now(),
      content: 'This is a test skill. it does nothing and is created as part of the development process',
      isLoaded: false
    },
    {
      id: 'skill-audit',
      name: 'audit',
      description: 'Comprehensive system inspection and logic audit for validating code compliance, dependencies, and security boundaries.',
      category: 'builtin',
      author: 'Hypervisor Core',
      dateString: 'System Builtin',
      updatedAt: Date.now(),
      content: 'Rule: Rigorously audit architecture invariants, permissions, security headers, and execution invariants before code deployment.',
      isLoaded: true
    }
  ]);

  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'agent-hypervisor-3-4',
      name: 'Hypervisor-3.4',
      description: 'Cyber Agent with Advanced Vulnerability Assessment, Penetration Testing and Exploitation Capabilities.',
      instructions: 'You are Hypervisor-3.4, an advanced cybersecurity and systems resilience agent. You specialize in vulnerability assessments, security architecture analysis, penetration testing methodologies, attack surface mapping, and defensive remediation strategies.',
      model: 'cisai-pro',
      category: 'builtin',
      author: 'Hypervisor Core',
      dateString: 'Builtin',
      updatedAt: Date.now(),
      tools: ['Vulnerability Scanner', 'Network Auditor', 'Remediation Engine'],
      subAgents: [
        {
          id: 'subagent-vuln-assessment',
          name: 'Vulnerability Assessment Module',
          description: 'Identifies CVEs, misconfigurations, and outdated dependencies across system assets.',
          instructions: 'Perform structured vulnerability scans and risk classifications. Analyze dependency trees, CVE databases, and configuration settings to produce detailed CVSS scoring and remediation plans.'
        },
        {
          id: 'subagent-pentest-auditor',
          name: 'Penetration Testing Auditor',
          description: 'Evaluates perimeter defenses and simulates attack paths within authorized scopes.',
          instructions: 'Conduct penetration testing reviews and threat modeling. Assess authentication boundaries, input sanitization, access control mechanisms, and privilege escalation risks.'
        },
        {
          id: 'subagent-exploit-defense',
          name: 'Exploitation Feasibility & Remediation',
          description: 'Analyzes vulnerability exploitability and designs defensive patches and WAF rules.',
          instructions: 'Evaluate whether detected flaws can be practically exploited in targeted environments. Prioritize defensive engineering, virtual patches, firewall rules, and long-term security controls.'
        }
      ]
    },
    {
      id: 'agent-hyperqa',
      name: 'HyperQA',
      description: 'Software testing and Quality Assurance Agent',
      instructions: 'You are HyperQA, an advanced Software Testing and Quality Assurance Agent. You specialize in test strategy formulation, end-to-end automation, edge-case generation, regression analysis, load/stress evaluation, and continuous quality governance.',
      model: 'cisai-pro',
      category: 'builtin',
      author: 'Hypervisor Core',
      dateString: 'Builtin',
      updatedAt: Date.now(),
      tools: ['Automated Test Runner', 'API Contract Inspector', 'Coverage Profiler'],
      subAgents: [
        {
          id: 'subagent-test-automation',
          name: 'Test Automation Specialist',
          description: 'Designs robust unit, integration, and E2E automation suites (Playwright, Vitest, Jest).',
          instructions: 'Generate resilient, decoupled test suites with thorough mocking and fixture strategies. Ensure comprehensive coverage across happy paths and critical failure paths.'
        },
        {
          id: 'subagent-edge-case-validator',
          name: 'Regression & Edge-Case Validator',
          description: 'Analyzes boundary conditions, concurrency race hazards, and regression vulnerability.',
          instructions: 'Rigorously stress system invariants. Identify boundary thresholds, null/empty state handling, asynchronous race conditions, and simulate mutation testing to expose blind spots.'
        },
        {
          id: 'subagent-api-contract-tester',
          name: 'API & Contract Verification',
          description: 'Validates REST, GraphQL, and RPC schemas, authentication headers, and error codes.',
          instructions: 'Audit API contracts against specifications (OpenAPI/GraphQL). Verify status code conventions, rate-limit resilience, payload validation, and data serialization fidelity.'
        }
      ]
    }
  ]);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

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
  };

  const handleOpenAgentChat = (agent: Agent) => {
    setLoadedAgent(agent);
    setActiveAgentId(agent.id);
    if (agent.model) {
      if (agent.model === 'cisai-lite' || agent.model === 'cisai-pro' || agent.model === 'cisai-ultra') {
        setSelectedModel(agent.model);
      } else {
        setSelectedModel('cisai-pro');
      }
    }
    setCurrentView('agent_chat');
    setActiveChatId(null);
  };

  const handleConfigureAgent = (agent: Agent) => {
    setActiveAgentId(agent.id);
    setCurrentView('agent_template');
    setActiveChatId(null);
  };

  const handleCreateAgent = (name: string, description: string, instructions: string, model = 'Gemini 2.5 Flash') => {
    const newAgent: Agent = {
      id: generateId(),
      name,
      description,
      instructions,
      model,
      dateString: 'just now',
      updatedAt: Date.now(),
      tools: ['Standard Tools'],
      subAgents: []
    };
    setAgents(prev => [newAgent, ...prev]);
  };

  const handleUpdateAgent = (id: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    if (loadedAgent?.id === id) {
      setLoadedAgent(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleDeleteAgent = (id: string) => {
    setAgents(prev => prev.filter(a => a.id !== id));
    if (activeAgentId === id || loadedAgent?.id === id) {
      setLoadedAgent(null);
      handleViewAgents();
    }
  };

  const handleSelectSkill = (id: string) => {
    const target = skills.find(s => s.id === id);
    if (target?.category === 'builtin') {
      return; // Builtin skills cannot be Edited, Deleted or Configured
    }
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
      author: 'User',
      dateString: 'just now',
      updatedAt: Date.now(),
      isLoaded: false
    };
    setSkills(prev => [newSkill, ...prev]);
  };

  const handleUpdateSkill = (id: string, updates: Partial<Skill>) => {
    setSkills(prev => prev.map(s => {
      if (s.id === id && s.category === 'builtin') return s;
      return s.id === id ? { ...s, ...updates } : s;
    }));
    if (loadedSkill?.id === id && loadedSkill.category !== 'builtin') {
      setLoadedSkill(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleDeleteSkill = (id: string) => {
    const target = skills.find(s => s.id === id);
    if (target?.category === 'builtin') return;
    setSkills(prev => prev.filter(s => s.id !== id));
    if (loadedSkill?.id === id) {
      setLoadedSkill(null);
    }
  };

  const handleToggleLoadSkill = (id: string) => {
    const targetSkill = skills.find(s => s.id === id);
    if (!targetSkill) return;

    if (loadedSkill?.id === id) {
      // Unload
      setLoadedSkill(null);
      setSkills(prev => prev.map(s => s.id === id ? { ...s, isLoaded: false } : s));
    } else {
      // Load Skill - navigate to chat input with the tab before cursor
      setLoadedSkill(targetSkill);
      setSkills(prev => prev.map(s => s.id === id ? { ...s, isLoaded: true } : { ...s, isLoaded: false }));
      setCurrentView('new');
      setActiveChatId(null);
    }
  };

  const handleUnloadSkill = () => {
    if (loadedSkill) {
      setSkills(prev => prev.map(s => s.id === loadedSkill.id ? { ...s, isLoaded: false } : s));
    }
    setLoadedSkill(null);
  };

  const handleSelectChat = (id: string) => {
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
  };

  const handleLoadProject = (project: Project) => {
    setLoadedProject(project);
  };

  const handleLoadSkill = (skill: Skill) => {
    setLoadedSkill(skill);
    setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, isLoaded: true } : { ...s, isLoaded: false }));
  };

  const handleUnloadProject = () => {
    setLoadedProject(null);
  };

  const handleDeleteChat = (id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) {
      handleNewChat();
    }
  };

  const handleToggleFlag = (id: string) => {
    setChats(prev => prev.map(c => 
      c.id === id ? { ...c, isFlagged: !c.isFlagged } : c
    ));
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    setChats(prev => prev.map(c => 
      c.id === id ? { ...c, title: newTitle } : c
    ));
  };

  const handleToggleProjectFlag = (id: string) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, isFlagged: !p.isFlagged } : p
    ));
  };

  const handleRenameProject = (id: string, newTitle: string) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, name: newTitle } : p
    ));
  };

  const handleSendMessage = (content: string, isGhostMode?: boolean) => {
    const projectPayload = loadedProject ? formatProjectContent(loadedProject) : '';
    const skillPayload = loadedSkill ? formatSkillContent(loadedSkill) : '';

    const payloads: string[] = [];
    if (projectPayload) payloads.push(projectPayload);
    if (skillPayload) payloads.push(skillPayload);
    const fullContent = payloads.length > 0 ? `${payloads.join('\n\n')}\n\n${content}` : content;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: fullContent,
      displayText: content,
      projectContext: loadedProject ? {
        projectId: loadedProject.id,
        projectName: loadedProject.name,
        details: projectPayload
      } : undefined,
      skillContext: loadedSkill ? {
        skillId: loadedSkill.id,
        skillName: loadedSkill.name,
        details: skillPayload
      } : undefined,
      timestamp: Date.now()
    };

    // Assistant response
    let assistantText = "I'm a simulated agent response based on your prompt. I can assist you with coding, writing, analysis, and much more.";
    if (loadedAgent) {
      if (loadedAgent.name.toLowerCase().includes('hypervisor')) {
        assistantText = `**${loadedAgent.name} Core Activated**\n\nI have initialized the security telemetry and vulnerability analysis engine. System architecture analyzed. How can I assist with your penetration testing, threat modeling, or exploit defense assessment?`;
      } else if (loadedAgent.name.toLowerCase().includes('hyperqa')) {
        assistantText = `**${loadedAgent.name} Engine Ready**\n\nTest execution harness and API contract verifiers stand ready. I can construct unit/E2E test suites, probe boundary conditions, and validate continuous testing pipelines.`;
      } else {
        assistantText = `**${loadedAgent.name} Loaded**\n\nI am operating under the instructions and specialized configuration for ${loadedAgent.name}.\n\nHow can I assist you with your request today?`;
      }
    } else if (loadedProject && loadedSkill) {
      assistantText = `I have loaded both the **${loadedProject.name}** project and the **${loadedSkill.name}** skill. How can I assist you?`;
    } else if (loadedProject) {
      assistantText = `I have loaded the contents and context from **${loadedProject.name}**${loadedProject.files && loadedProject.files.length > 0 ? ` (${loadedProject.files.length} file${loadedProject.files.length > 1 ? 's' : ''})` : ''}. How can I assist you with this project?`;
    } else if (loadedSkill) {
      assistantText = `I have loaded the **${loadedSkill.name}** skill into this chat. How can I assist you?`;
    }

    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: assistantText,
      timestamp: Date.now() + 1000
    };

    if (currentView === 'new' || currentView === 'agent_chat' || !activeChatId) {
      const newChat: ChatSession = {
        id: generateId(),
        title: (isGhostMode ? '👻 ' : '') + content.slice(0, 40) + (content.length > 40 ? '...' : ''),
        updatedAt: Date.now(),
        isFlagged: false,
        messages: [userMessage, assistantMessage],
        agentId: loadedAgent?.id,
        agentName: loadedAgent?.name,
        isGhost: isGhostMode
      };
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setCurrentView('chat');
    } else {
      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return {
            ...c,
            updatedAt: Date.now(),
            messages: [...c.messages, userMessage, assistantMessage]
          };
        }
        return c;
      }));
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId);
  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeSkill = skills.find(s => s.id === activeSkillId);
  const activeAgent = agents.find(a => a.id === activeAgentId);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#151515]">
      <Sidebar 
        chats={chats}
        projects={projects}
        currentView={currentView}
        activeChatId={activeChatId}
        activeProjectId={activeProjectId}
        isOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
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
        onDeleteProject={(id) => setProjects(prev => prev.filter(p => p.id !== id))}
        onToggleProjectFlag={handleToggleProjectFlag}
        onRenameProject={handleRenameProject}
      />
      
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
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
            onDeleteProject={(id) => setProjects(prev => prev.filter(p => p.id !== id))} 
            onCreateProject={(name, description) => {
              const newProject: Project = {
                id: generateId(),
                name,
                description,
                dateString: 'just now',
                updatedAt: Date.now(),
                files: []
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
            onUpdateProject={(id, updates) => setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))}
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
        
        {currentView === 'chat' && activeChat && (
          <ActiveChatView 
            chat={activeChat}
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
      </main>
    </div>
  );
}
