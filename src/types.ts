export interface ChatAttachment {
  id: string;
  name: string;
  size: number | string;
  type?: string;
  uploadedAt?: number;
  content?: string;
}

export interface ChatTodo {
  id: string;
  title: string;
  completed: boolean;
  stepNumber?: number;
  description?: string;
}

export interface ChatDeliverable {
  id: string;
  name: string;
  path?: string;
  type?: string;
  size?: string;
  content?: string;
  timestamp?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  displayText?: string;
  attachments?: ChatAttachment[];
  todos?: ChatTodo[];
  deliverables?: ChatDeliverable[];
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
  uploads?: ChatAttachment[];
  todos?: ChatTodo[];
  deliverables?: ChatDeliverable[];
}

export interface ProjectFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: string;
  tokens?: number | string;
  content?: string;
  timeAgo?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  updatedAt: number;
  dateString?: string;
  files?: ProjectFile[];
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
  author?: string;
  updatedAt: number;
  dateString?: string;
  tools?: string[];
  subAgents?: SubAgent[];
  category?: 'builtin' | 'custom';
}

export interface ChatModelInfo {
  id: string;
  label: string;
  description: string;
  maxTokens: number;
}

export const CHAT_MODELS: ChatModelInfo[] = [
  { id: 'cisai-lite', label: 'HyperChat Lite', description: 'Fast responses for everyday tasks', maxTokens: 32_000 },
  { id: 'cisai-pro', label: 'HyperChat Pro', description: 'Balanced reasoning and speed', maxTokens: 128_000 },
  { id: 'cisai-ultra', label: 'HyperChat Ultra', description: 'Deep reasoning for complex work', maxTokens: 1_000_000 },
];

export function getModelMaxTokens(modelId: string | undefined): number {
  return CHAT_MODELS.find(m => m.id === modelId)?.maxTokens ?? 32_000;
}

export function getModelLabel(modelId: string | undefined): string {
  return CHAT_MODELS.find(m => m.id === modelId)?.label ?? 'HyperChat Lite';
}

export type ViewState =
  | 'new' | 'all' | 'chat'
  | 'projects' | 'project_details'
  | 'skills' | 'skill_editor'
  | 'agents' | 'agent_template' | 'agent_chat';
