import { Project, Skill, Agent } from './types';

export function formatRelativeTime(date: number | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function estimateTokens(fileOrContent: string | { content?: string; size?: string | number; tokens?: number | string }): number {
  if (typeof fileOrContent === 'string') {
    return Math.max(1, Math.round(fileOrContent.length / 4));
  }
  const file = fileOrContent;
  if (file.tokens !== undefined && file.tokens !== null) {
    if (typeof file.tokens === 'number') return file.tokens;
    const parsed = parseInt(String(file.tokens));
    if (!isNaN(parsed)) return parsed;
  }
  if (typeof file.size === 'number' && file.size > 0) {
    return Math.max(1, Math.round(file.size / 4));
  }
  if (typeof file.size === 'string' && file.size.trim()) {
    const s = file.size.trim().toLowerCase();
    const val = parseFloat(s);
    if (!isNaN(val)) {
      if (s.includes('mb')) return Math.max(1, Math.round((val * 1024 * 1024) / 4));
      if (s.includes('kb') || s.includes('k')) return Math.max(1, Math.round((val * 1024) / 4));
      return Math.max(1, Math.round(val / 4));
    }
  }
  if (file.content && file.content.length > 0) {
    return Math.max(1, Math.round(file.content.length / 4));
  }
  return 120;
}

export function formatTokenCount(fileOrSize: string | number | { content?: string; size?: string | number; tokens?: number | string }): string {
  let count: number;
  if (typeof fileOrSize === 'number') {
    count = fileOrSize > 0 ? Math.round(fileOrSize / 4) : 0;
  } else if (typeof fileOrSize === 'string') {
    count = estimateTokens({ size: fileOrSize });
  } else {
    count = estimateTokens(fileOrSize);
  }

  if (count >= 10000) {
    return `${(count / 1000).toFixed(1)}k tokens`;
  }
  return `${count.toLocaleString()} tokens`;
}

export function formatProjectContent(project: Project): string {
  let output = `[PROJECT CONTEXT: ${project.name}]\n`;
  if (project.description) {
    output += `Description: ${project.description}\n`;
  }
  if (project.instructions) {
    output += `Instructions: ${project.instructions}\n`;
  }
  if (project.dateString) {
    output += `Last Modified: ${project.dateString}\n`;
  }
  if (project.files && project.files.length > 0) {
    output += `Files and Contents:\n`;
    for (const file of project.files) {
      output += `--- File: ${file.name} (${file.type}${file.size ? `, ${file.size}` : ''}) ---\n`;
      if (file.content) {
        output += `${file.content}\n`;
      }
    }
  } else {
    output += `Files: (No files uploaded)\n`;
  }
  output += `[END PROJECT CONTEXT]`;
  return output;
}

export function formatSkillContent(skill: Skill): string {
  let output = `[SKILL CONTEXT: ${skill.name}]\n`;
  if (skill.description) {
    output += `Description: ${skill.description}\n`;
  }
  if (skill.content) {
    output += `Instructions:\n${skill.content}\n`;
  }
  if (skill.files && skill.files.length > 0) {
    output += `Files and Reference Data:\n`;
    for (const file of skill.files) {
      output += `--- File: ${file.name} (${file.size || ''}) ---\n`;
      if (file.content) {
        output += `${file.content}\n`;
      }
    }
  }
  output += `[END SKILL CONTEXT]`;
  return output;
}

export function formatAgentContent(agent: Agent): string {
  let output = `[AGENT CONTEXT: ${agent.name}]\n`;
  if (agent.description) {
    output += `Description: ${agent.description}\n`;
  }
  if (agent.instructions) {
    output += `Guidelines & System Instructions:\n${agent.instructions}\n`;
  }
  if (agent.model) {
    output += `Model: ${agent.model}\n`;
  }
  if (agent.tools && agent.tools.length > 0) {
    output += `Tools: ${agent.tools.join(', ')}\n`;
  }
  if (agent.subAgents && agent.subAgents.length > 0) {
    output += `Sub-Agents (${agent.subAgents.length}):\n`;
    for (const [idx, sub] of agent.subAgents.entries()) {
      output += `  ${idx + 1}. ${sub.name}${sub.description ? ` (${sub.description})` : ''}\n`;
      if (sub.instructions) {
        output += `     Instructions: ${sub.instructions}\n`;
      }
    }
  }
  output += `[END AGENT CONTEXT]`;
  return output;
}

export function stripHiddenProjectDetails(text: string): string {
  if (!text) return '';
  return text
    .replace(/\[PROJECT CONTEXT:[\s\S]*?\[END PROJECT CONTEXT\]\s*/g, '')
    .replace(/\[SKILL CONTEXT:[\s\S]*?\[END SKILL CONTEXT\]\s*/g, '')
    .replace(/\[AGENT CONTEXT:[\s\S]*?\[END AGENT CONTEXT\]\s*/g, '')
    .trim();
}
