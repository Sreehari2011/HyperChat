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
  const [chats, setChats] = useState<ChatSession[]>([
    {
      id: 'chat-rbac-system',
      title: 'Full-Stack RBAC & Auth Architecture',
      updatedAt: Date.now() - 3600000 * 2,
      isFlagged: false,
      uploads: [
        {
          id: 'up-1',
          name: 'system-spec.pdf',
          size: '248.5 KB',
          type: 'application/pdf',
          uploadedAt: Date.now() - 3600000 * 2,
          content: 'Technical Specification: Role-Based Access Control Architecture\n- User roles: Admin, Auditor, Engineer, Guest\n- Token issuance: JWT RS256 with 15m expiration\n- Refresh token rotation in HTTP-only secure cookie'
        },
        {
          id: 'up-2',
          name: 'security-requirements.md',
          size: '14.2 KB',
          type: 'text/markdown',
          uploadedAt: Date.now() - 3600000 * 2,
          content: '# Security Invariants\n1. All admin mutation routes require explicit MFA challenge.\n2. Revocation list checked via redis cache.'
        }
      ],
      todos: [
        {
          id: 'td-1',
          title: 'Define User & Role models in database schema',
          completed: true,
          stepNumber: 1,
          description: 'Prisma models with composite indices on tenant_id + role_id'
        },
        {
          id: 'td-2',
          title: 'Implement password hashing & JWT token issuance',
          completed: true,
          stepNumber: 2,
          description: 'Argon2id password hashing with RS256 JWT key signing'
        },
        {
          id: 'td-3',
          title: 'Add role-based access control (RBAC) middleware',
          completed: false,
          stepNumber: 3,
          description: 'Express permission guard verifying user capabilities'
        },
        {
          id: 'td-4',
          title: 'Write end-to-end authentication test suites',
          completed: false,
          stepNumber: 4,
          description: 'Playwright & Vitest integration suites for auth matrix'
        }
      ],
      deliverables: [
        {
          id: 'deliv-1',
          name: 'auth.controller.ts',
          type: 'typescript',
          size: '142 lines',
          content: `import { Request, Response } from 'express';\nimport { AuthService } from '../services/auth.service';\n\nexport class AuthController {\n  static async login(req: Request, res: Response) {\n    const { email, password } = req.body;\n    const session = await AuthService.authenticate(email, password);\n    res.cookie('token', session.token, { httpOnly: true, secure: true });\n    return res.json({ user: session.user });\n  }\n\n  static async logout(_req: Request, res: Response) {\n    res.clearCookie('token');\n    return res.status(204).send();\n  }\n}`,
          timestamp: Date.now() - 3600000 * 2
        },
        {
          id: 'deliv-2',
          name: 'rbac.middleware.ts',
          type: 'typescript',
          size: '88 lines',
          content: `import { Request, Response, NextFunction } from 'express';\n\nexport function requirePermission(permission: string) {\n  return (req: Request, res: Response, next: NextFunction) => {\n    const userPermissions = (req as any).user?.permissions || [];\n    if (!userPermissions.includes(permission)) {\n      return res.status(403).json({ error: 'Forbidden: Insufficient capabilities' });\n    }\n    next();\n  };\n}`,
          timestamp: Date.now() - 3600000 * 2
        },
        {
          id: 'deliv-3',
          name: 'schema.prisma',
          type: 'prisma',
          size: '64 lines',
          content: `model User {\n  id           String   @id @default(uuid())\n  email        String   @unique\n  passwordHash String\n  roleId       String\n  role         Role     @relation(fields: [roleId], references: [id])\n  createdAt    DateTime @default(now())\n}\n\nmodel Role {\n  id          String   @id @default(uuid())\n  name        String   @unique\n  permissions String[]\n  users       User[]\n}`,
          timestamp: Date.now() - 3600000 * 2
        }
      ],
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'I have attached our security requirements and architecture specification. Please design our RBAC system, organize the execution plan into clear steps, and deliver the core middleware and controllers.\n\n[Attached: system-spec.pdf (248.5 KB)] [Attached: security-requirements.md (14.2 KB)]',
          timestamp: Date.now() - 3600000 * 2
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: `I've analyzed **system-spec.pdf** and **security-requirements.md**. Here is the multi-step implementation plan for your RBAC system:

- [x] Step 1: Define User & Role models in database schema
- [x] Step 2: Implement password hashing & JWT token issuance
- [ ] Step 3: Add role-based access control (RBAC) middleware
- [ ] Step 4: Write end-to-end authentication test suites

I have prepared the first set of deliverables for you:
- \`auth.controller.ts\` (Login/logout endpoints with secure HTTP-only cookies)
- \`rbac.middleware.ts\` (Permission guard and authorization matrix)
- \`schema.prisma\` (Database schema with User and Role definitions)

Check the "In this Chat" panel on the right to view your uploaded files, monitor todo progress, and inspect delivered files.`,
          timestamp: Date.now() - 3600000 * 2 + 1000
        }
      ]
    },
    {
      id: 'chat-simple-query',
      title: 'Python List Comprehensions vs Generators',
      updatedAt: Date.now() - 86400000,
      isFlagged: false,
      messages: [
        {
          id: 'msg-simple-1',
          role: 'user',
          content: 'What is the key difference between list comprehensions and generator expressions in Python?',
          timestamp: Date.now() - 86400000
        },
        {
          id: 'msg-simple-2',
          role: 'assistant',
          content: 'The key difference is memory usage and evaluation time:\n\n1. **List comprehension** `[x for x in data]` computes all elements immediately and stores the entire list in memory.\n2. **Generator expression** `(x for x in data)` produces elements lazily on demand using the iterator protocol, maintaining constant memory overhead.',
          timestamp: Date.now() - 86400000 + 1000
        }
      ]
    }
  ]);
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
          commitMessage: 'feat(ui): add interactive control panel and state handlers',
          timeAgo: '5 days ago',
          content: `import React, { useState } from 'react';\n\nexport default function ControlPanel() {\n  const [status, setStatus] = useState('active');\n  return (\n    <div className="control-panel">\n      <h2>Control Panel</h2>\n      <p>System state: {status}</p>\n    </div>\n  );\n}` 
        },
        { 
          id: generateId(), 
          name: 'DataPanel.tsx', 
          type: 'file', 
          tokens: 1400,
          size: '1.4k tokens', 
          commitMessage: 'feat(telemetry): stream telemetry metrics and health checks',
          timeAgo: 'last week',
          content: `import React from 'react';\n\nexport function DataPanel({ telemetry }: { telemetry: Record<string, number> }) {\n  return (\n    <div className="data-panel">\n      <h3>Telemetry Metrics</h3>\n    </div>\n  );\n}` 
        },
        { 
          id: generateId(), 
          name: 'globals.css', 
          type: 'file', 
          tokens: 122,
          size: '122 tokens', 
          commitMessage: 'style: update base Tailwind tokens and root color scheme',
          timeAgo: '3 weeks ago',
          content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  --bg-primary: #121212;\n  --text-main: #f4f4f5;\n}` 
        },
        { 
          id: generateId(), 
          name: 'layout.tsx', 
          type: 'file', 
          tokens: 175,
          size: '175 tokens', 
          commitMessage: 'chore(layout): wrap root tree with metadata and providers',
          timeAgo: 'last month',
          content: `export default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}` 
        },
        { 
          id: generateId(), 
          name: 'page.tsx', 
          type: 'file', 
          tokens: 3800,
          size: '3.8k tokens', 
          commitMessage: 'feat(page): mount client control interface',
          timeAgo: '3 weeks ago',
          content: `'use client';\n\nimport React from 'react';\nimport ControlPanel from './ControlPanel';\n\nexport default function Page() {\n  return (\n    <main className="min-h-screen p-8">\n      <ControlPanel />\n    </main>\n  );\n}` 
        },
        { 
          id: generateId(), 
          name: 'main.py', 
          type: 'file', 
          tokens: 3400,
          size: '3.4k tokens', 
          commitMessage: 'fix(ollama): keyless env config and /v1 base URL normaliz...',
          timeAgo: '5 days ago',
          content: `"""\nHypervisor Daemon Core\n"""\nimport logging\n\ndef run():\n    logging.info("Core orchestrator initialized")\n\nif __name__ == "__main__":\n    run()` 
        },
        { 
          id: generateId(), 
          name: 'test_orchestrator.py', 
          type: 'file', 
          tokens: 5125,
          size: '5.1k tokens', 
          commitMessage: 'test: add unit test coverage for hypervisor orchestrator',
          timeAgo: 'last month',
          content: `import unittest\n\nclass TestOrchestration(unittest.TestCase):\n    def test_startup(self):\n        self.assertTrue(True)` 
        },
        { 
          id: generateId(), 
          name: '.env.example', 
          type: 'file', 
          tokens: 110,
          size: '110 tokens', 
          commitMessage: 'Translate all Chinese text to English',
          timeAgo: '3 weeks ago',
          content: `API_KEY=your_key_here\nDATABASE_URL=postgres://localhost:5432/app\nPORT=3000` 
        },
        { 
          id: generateId(), 
          name: '.gitignore', 
          type: 'file', 
          tokens: 95,
          size: '95 tokens', 
          commitMessage: 'merge main (resolve .gitignore: keep both entries)',
          timeAgo: '3 weeks ago',
          content: `node_modules\n.DS_Store\n.env\ndist\nbuild` 
        },
        { 
          id: generateId(), 
          name: 'utils.py', 
          type: 'file', 
          tokens: 198,
          size: '198 tokens', 
          commitMessage: 'refactor(crypto): export sha256 hashing helper',
          timeAgo: 'last month',
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

  const handleToggleTodo = (chatId: string, todoId: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const updatedTodos = (chat.todos || []).map(t => 
          t.id === todoId ? { ...t, completed: !t.completed } : t
        );
        return {
          ...chat,
          todos: updatedTodos
        };
      }
      return chat;
    }));
  };

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

    const userAttachments = attachments && attachments.length > 0 ? attachments.map(a => ({
      id: a.id,
      name: a.name,
      size: typeof a.size === 'number' ? `${(a.size / 1024).toFixed(1)} KB` : a.size,
      uploadedAt: Date.now()
    })) : undefined;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: fullContent,
      displayText: content,
      attachments: userAttachments,
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
    let assistantTodos: any[] | undefined;
    let assistantDeliverables: any[] | undefined;

    const lower = content.toLowerCase();
    const needsPlan = lower.includes('plan') || lower.includes('step') || lower.includes('todo') || lower.includes('build') || lower.includes('design') || (userAttachments && userAttachments.length > 0);

    if (loadedAgent) {
      if (loadedAgent.name.toLowerCase().includes('hypervisor')) {
        assistantText = `**${loadedAgent.name} Core Activated**\n\nI have initialized the security telemetry and vulnerability analysis engine. System architecture analyzed. How can I assist with your penetration testing, threat modeling, or exploit defense assessment?`;
      } else if (loadedAgent.name.toLowerCase().includes('hyperqa')) {
        assistantText = `**${loadedAgent.name} Engine Ready**\n\nTest execution harness and API contract verifiers stand ready. I can construct unit/E2E test suites, probe boundary conditions, and validate continuous testing pipelines.`;
      } else {
        assistantText = `**${loadedAgent.name} Loaded**\n\nI am operating under the instructions and specialized configuration for ${loadedAgent.name}.\n\nHow can I assist you with your request today?`;
      }
    } else if (needsPlan) {
      assistantTodos = [
        { id: generateId(), title: 'Analyze requirements and dependencies', completed: true, stepNumber: 1, description: 'Reviewed specifications and context parameters' },
        { id: generateId(), title: 'Implement architecture core and state handlers', completed: false, stepNumber: 2, description: 'Engine logic and integration pathways' },
        { id: generateId(), title: 'Validate edge-case behaviors and telemetry', completed: false, stepNumber: 3, description: 'Continuous assurance and test validation' }
      ];
      assistantDeliverables = [
        {
          id: generateId(),
          name: 'solution_artifact.ts',
          type: 'typescript',
          size: '48 lines',
          content: `// Solution artifact generated for: ${content.slice(0, 35)}...\nexport class SolutionEngine {\n  constructor(private config: Record<string, unknown> = {}) {}\n\n  async execute() {\n    console.log("Solution engine executing workflow");\n    return { status: "success", timestamp: Date.now() };\n  }\n}`,
          timestamp: Date.now()
        }
      ];
      assistantText = `I have reviewed your request${userAttachments ? ` and processed the attached file(s)` : ''}.\n\n### Execution Plan:\n- [x] Step 1: Analyze requirements and dependencies\n- [ ] Step 2: Implement architecture core and state handlers\n- [ ] Step 3: Validate edge-case behaviors and telemetry\n\n### Deliverables:\n- \`solution_artifact.ts\` (Generated implementation)\n\nCheck the "In this Chat" panel on the right side to view your uploads, monitor todos, and inspect deliverables.`;
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
      todos: assistantTodos,
      deliverables: assistantDeliverables,
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
        isGhost: isGhostMode,
        uploads: userAttachments ? [...userAttachments] : [],
        todos: assistantTodos ? [...assistantTodos] : [],
        deliverables: assistantDeliverables ? [...assistantDeliverables] : []
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
            messages: [...c.messages, userMessage, assistantMessage],
            uploads: userAttachments ? [...(c.uploads || []), ...userAttachments] : c.uploads,
            todos: assistantTodos ? [...(c.todos || []), ...assistantTodos] : c.todos,
            deliverables: assistantDeliverables ? [...(c.deliverables || []), ...assistantDeliverables] : c.deliverables
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
            onToggleTodo={handleToggleTodo}
          />
        )}
      </main>
    </div>
  );
}
