export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  displayText?: string;
  projectContext?: {
    projectId: string;
    projectName: string;
    details: string;
  };
  skillContext?: {
    skillId: string;
    skillName: string;
    details: string;
  };
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
  isFlagged: boolean;
  messages: Message[];
  agentId?: string;
  agentName?: string;
  isGhost?: boolean;
}

export interface ProjectFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: string;
  tokens?: number | string;
  content?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  updatedAt: number;
  dateString?: string;
  files?: ProjectFile[];
  syncFiles?: ProjectFile[];
  isFlagged?: boolean;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: 'builtin' | 'custom';
  content?: string;
  author?: string;
  updatedAt?: number;
  dateString?: string;
  isLoaded?: boolean;
  files?: ProjectFile[];
}

export interface SubAgent {
  id: string;
  name: string;
  description?: string;
  instructions: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  instructions?: string;
  model?: string;
  avatarColor?: string;
  author?: string;
  updatedAt: number;
  dateString?: string;
  tools?: string[];
  subAgents?: SubAgent[];
  category?: 'builtin' | 'custom';
}

export type ViewState = 'new' | 'all' | 'chat' | 'projects' | 'project_details' | 'skills' | 'skill_editor' | 'agents' | 'agent_template' | 'agent_chat';
