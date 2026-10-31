import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, ProjectFile } from '../types';
import { 
  Upload, 
  Github, 
  Folder, 
  FolderOpen, 
  X, 
  FileCode2, 
  FileText, 
  Check, 
  Plus, 
  ArrowLeft, 
  ChevronDown,
  Search,
  Eye,
  Trash2,
  MoreVertical,
  Copy
} from 'lucide-react';

interface ProjectDetailsViewProps {
  key?: React.Key;
  project: Project;
  onBack: () => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onWorkOnProject?: (project: Project) => void;
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts.pop()!.toUpperCase();
  }
  return 'FILE';
}

function formatTokenCount(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M tokens`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k tokens`;
  }
  return `${num} tokens`;
}

function getFileTokens(file: { tokens?: number | string; size?: string; content?: string }): string {
  if (file.tokens !== undefined && file.tokens !== null) {
    if (typeof file.tokens === 'number') {
      return formatTokenCount(file.tokens);
    }
    const tokenStr = String(file.tokens).trim();
    return tokenStr.toLowerCase().includes('token') ? tokenStr : `${tokenStr} tokens`;
  }

  if (file.content && file.content.length > 0) {
    const tokenCount = Math.max(1, Math.ceil(file.content.length / 4));
    return formatTokenCount(tokenCount);
  }

  if (file.size) {
    const sizeStr = file.size.toLowerCase().replace(/\s/g, '');
    if (sizeStr.includes('token')) {
      return file.size;
    }
    let bytes = 0;
    if (sizeStr.endsWith('kb')) {
      bytes = parseFloat(sizeStr.replace('kb', '')) * 1024;
    } else if (sizeStr.endsWith('mb')) {
      bytes = parseFloat(sizeStr.replace('mb', '')) * 1024 * 1024;
    } else if (sizeStr.endsWith('b')) {
      bytes = parseFloat(sizeStr.replace('b', ''));
    } else {
      bytes = parseFloat(sizeStr) || 1024;
    }
    const tokenCount = Math.max(1, Math.ceil(bytes / 4));
    return formatTokenCount(tokenCount);
  }

  return '250 tokens';
}

const KNOWN_COMMITS: Record<string, { commit: string; time: string }> = {
  'screenshots': { commit: 'README: Prune dead upstream links and fork-irrelevant s...', time: '3 weeks ago' },
  'scripts': { commit: 'feat(skill): php2shell - gated session.upload_progress LFI-...', time: 'last week' },
  'server': { commit: 'fix(ollama): keyless env config and /v1 base URL normaliz...', time: '5 days ago' },
  'sidequestion': { commit: 'Translate all Chinese text to English', time: '3 weeks ago' },
  'skills': { commit: 'feat(skills): bbot recursive recon orchestrator with policy ...', time: 'last week' },
  'traffic': { commit: 'Traffic ingest: capture operator browsing via a browser ex...', time: '3 weeks ago' },
  'web': { commit: 'ollama llm', time: 'last week' },
  '.dockerignore': { commit: 'chore(bench): 补 .dockerignore 忽略项, bench 容器不再挂...', time: 'last month' },
  '.env.example': { commit: 'Translate all Chinese text to English', time: '3 weeks ago' },
  '.gitattributes': { commit: 'fix(script): start.bat 改用 CRLF 并切 UTF-8 代码页', time: 'last month' },
  '.gitignore': { commit: 'merge main (resolve .gitignore: keep both entries)', time: '3 weeks ago' },
  'ControlPanel.tsx': { commit: 'feat(ui): add interactive control panel and state handlers', time: '5 days ago' },
  'DataPanel.tsx': { commit: 'feat(telemetry): stream telemetry metrics and health checks', time: 'last week' },
  'globals.css': { commit: 'style: update base Tailwind tokens and root color scheme', time: '3 weeks ago' },
  'layout.tsx': { commit: 'chore(layout): wrap root tree with metadata and providers', time: 'last month' },
  'page.tsx': { commit: 'feat(page): mount client control interface', time: '3 weeks ago' },
  'main.py': { commit: 'fix(ollama): keyless env config and /v1 base URL normaliz...', time: '5 days ago' },
  'test_orchestrator.py': { commit: 'test: add unit test coverage for hypervisor orchestrator', time: 'last month' },
  'utils.py': { commit: 'refactor(crypto): export sha256 hashing helper', time: 'last month' },
};

function getFileCommitMessage(file: ProjectFile, index: number): string {
  if (file.commitMessage) return file.commitMessage;
  if (KNOWN_COMMITS[file.name]) return KNOWN_COMMITS[file.name].commit;
  const ext = getFileExtension(file.name).toLowerCase();
  if (ext === 'tsx' || ext === 'jsx') return `feat(ui): implement ${file.name.replace(/\.[^/.]+$/, '')} component`;
  if (ext === 'ts' || ext === 'js') return `feat: implement logic and exports in ${file.name}`;
  if (ext === 'py') return `refactor: update runtime handlers in ${file.name}`;
  if (ext === 'css') return `style: update stylesheets in ${file.name}`;
  if (ext === 'md') return `docs: update documentation and schema`;
  if (ext === 'json') return `chore: update configuration schemas`;
  if (file.name.startsWith('.')) return `chore: update dotfile ${file.name}`;
  return `update ${file.name}`;
}

function getFileTimeAgo(file: ProjectFile, index: number): string {
  if (file.timeAgo) return file.timeAgo;
  if (KNOWN_COMMITS[file.name]) return KNOWN_COMMITS[file.name].time;
  const times = ['5 days ago', 'last week', '3 weeks ago', 'last month', '2 months ago'];
  return times[index % times.length];
}

function renderFileIcon(name: string, type: 'file' | 'folder' = 'file') {
  if (type === 'folder' || (!name.includes('.') && !name.startsWith('.'))) {
    return (
      <Folder 
        size={16} 
        className="text-zinc-400 flex-shrink-0" 
        strokeWidth={2}
      />
    );
  }
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'tsx' || ext === 'jsx' || ext === 'ts' || ext === 'js' || ext === 'py') {
    return <FileCode2 size={16} className="text-zinc-400 flex-shrink-0" strokeWidth={2} />;
  }
  return <FileText size={16} className="text-zinc-400 flex-shrink-0" strokeWidth={2} />;
}

const DEFAULT_SYNC_FILES: ProjectFile[] = [
  {
    id: 'sync-changelog',
    name: 'CHANGELOG.md',
    type: 'file',
    tokens: 450,
    size: '450 tokens',
    content: `# Project Sync Changelog\n\n## [Auto-Sync] Latest Updates\n- Automatically synchronized codebase changes\n- Updated documentation schemas\n- Verified component state tree integrity\n\n## [v1.0.0]\n- Initial repository sync generated by AI`
  },
  {
    id: 'sync-overview',
    name: 'PROJECT_OVERVIEW.md',
    type: 'file',
    tokens: 820,
    size: '820 tokens',
    content: `# Project Overview & State\n\n## Status: In Sync\nThis document is automatically generated and updated by AI as changes occur in the project files.\n\n### Summary\n- Project state synchronized\n- Latest change logs and technical summaries indexed\n- Automated documentation pipeline active`
  }
];

export default function ProjectDetailsView({ project, onBack, onUpdateProject, onWorkOnProject }: ProjectDetailsViewProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [githubRepoInput, setGithubRepoInput] = useState('');
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(true);
  const [isInstructionsSaved, setIsInstructionsSaved] = useState(false);
  const [instructionsInput, setInstructionsInput] = useState(project.instructions || '');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyContent = () => {
    if (selectedFile?.content) {
      navigator.clipboard.writeText(selectedFile.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSaveInstructions = () => {
    onUpdateProject(project.id, { instructions: instructionsInput.trim() });
    setIsInstructionsSaved(true);
    setTimeout(() => setIsInstructionsSaved(false), 2000);
  };

  useEffect(() => {
    setName(project.name);
    setDescription(project.description || '');
    setInstructionsInput(project.instructions || '');
  }, [project]);
  
  const handleNameBlur = () => {
    if (name.trim() !== project.name) {
      onUpdateProject(project.id, { name: name.trim() || 'Untitled Project' });
    }
  };

  const handleDescBlur = () => {
    if (description.trim() !== (project.description || '')) {
      onUpdateProject(project.id, { description: description.trim() });
    }
  };

  const files = project.files || [];
  const syncFiles = project.syncFiles && project.syncFiles.length > 0 ? project.syncFiles : DEFAULT_SYNC_FILES;

  const handleDeleteFile = (fileId: string) => {
    const updated = files.filter(f => f.id !== fileId);
    onUpdateProject(project.id, { files: updated });
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const newFiles: ProjectFile[] = [];
    const readers: Promise<void>[] = [];

    (Array.from(uploadedFiles) as File[]).forEach(file => {
      const p = new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const content = typeof reader.result === 'string' ? reader.result : '';
          const tokenCount = Math.max(1, Math.ceil(content.length / 4));
          newFiles.push({
            id: Math.random().toString(36).substring(2, 11),
            name: file.name,
            type: 'file',
            tokens: tokenCount,
            size: formatTokenCount(tokenCount),
            content
          });
          resolve();
        };
        reader.onerror = () => {
          const tokenCount = Math.max(1, Math.ceil(file.size / 4));
          newFiles.push({
            id: Math.random().toString(36).substring(2, 11),
            name: file.name,
            type: 'file',
            tokens: tokenCount,
            size: formatTokenCount(tokenCount),
            content: `// Binary or non-text file: ${file.name}`
          });
          resolve();
        };
        reader.readAsText(file);
      });
      readers.push(p);
    });

    Promise.all(readers).then(() => {
      onUpdateProject(project.id, { files: [...files, ...newFiles] });
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

  const handleImportGithub = () => {
    setIsImportModalOpen(true);
  };

  const handleConfirmGithubImport = () => {
    // Import repository sample files matching GitHub screenshot & project files
    const sampleRepoFiles: ProjectFile[] = [
      {
        id: Math.random().toString(36).substring(2, 11),
        name: 'screenshots',
        type: 'folder',
        tokens: 450,
        size: '450 tokens',
        commitMessage: 'README: Prune dead upstream links and fork-irrelevant s...',
        timeAgo: '3 weeks ago',
        content: '# Screenshots and asset directory'
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        name: 'scripts',
        type: 'folder',
        tokens: 1800,
        size: '1.8k tokens',
        commitMessage: 'feat(skill): php2shell - gated session.upload_progress LFI-...',
        timeAgo: 'last week',
        content: '# Deployment and maintenance automation scripts'
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        name: 'server',
        type: 'folder',
        tokens: 3400,
        size: '3.4k tokens',
        commitMessage: 'fix(ollama): keyless env config and /v1 base URL normaliz...',
        timeAgo: '5 days ago',
        content: '# Backend server and API proxy routing'
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        name: 'sidequestion',
        type: 'folder',
        tokens: 620,
        size: '620 tokens',
        commitMessage: 'Translate all Chinese text to English',
        timeAgo: '3 weeks ago',
        content: '# Side question handling module'
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        name: 'skills',
        type: 'folder',
        tokens: 4200,
        size: '4.2k tokens',
        commitMessage: 'feat(skills): bbot recursive recon orchestrator with policy ...',
        timeAgo: 'last week',
        content: '# Autonomous agent skill orchestrators'
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        name: 'traffic',
        type: 'folder',
        tokens: 950,
        size: '950 tokens',
        commitMessage: 'Traffic ingest: capture operator browsing via a browser ex...',
        timeAgo: '3 weeks ago',
        content: '# Traffic capture pipeline and network ingest'
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        name: 'web',
        type: 'folder',
        tokens: 2800,
        size: '2.8k tokens',
        commitMessage: 'ollama llm',
        timeAgo: 'last week',
        content: '# Frontend web client application'
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        name: '.dockerignore',
        type: 'file',
        tokens: 85,
        size: '85 tokens',
        commitMessage: 'chore(bench): 补 .dockerignore 忽略项, bench 容器不再挂...',
        timeAgo: 'last month',
        content: 'node_modules\n.git\n.env\n*.log\ndist'
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        name: '.env.example',
        type: 'file',
        tokens: 110,
        size: '110 tokens',
        commitMessage: 'Translate all Chinese text to English',
        timeAgo: '3 weeks ago',
        content: 'API_KEY=your_key_here\nDATABASE_URL=postgres://localhost:5432/app\nPORT=3000'
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        name: '.gitattributes',
        type: 'file',
        tokens: 65,
        size: '65 tokens',
        commitMessage: 'fix(script): start.bat 改用 CRLF 并切 UTF-8 代码页',
        timeAgo: 'last month',
        content: '* text=auto eol=lf\n*.bat text eol=crlf'
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        name: '.gitignore',
        type: 'file',
        tokens: 95,
        size: '95 tokens',
        commitMessage: 'merge main (resolve .gitignore: keep both entries)',
        timeAgo: '3 weeks ago',
        content: 'node_modules/\ndist/\n.env\n.DS_Store'
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        name: 'ControlPanel.tsx',
        type: 'file',
        tokens: 1150,
        size: '1.2k tokens',
        commitMessage: 'feat(ui): add interactive control panel and state handlers',
        timeAgo: '5 days ago',
        content: `import React, { useState } from 'react';\n\nexport default function ControlPanel() {\n  const [status, setStatus] = useState('active');\n  return (\n    <div className="control-panel">\n      <h2>Control Panel</h2>\n      <p>System state: {status}</p>\n    </div>\n  );\n}`
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        name: 'DataPanel.tsx',
        type: 'file',
        tokens: 1400,
        size: '1.4k tokens',
        commitMessage: 'feat(telemetry): stream telemetry metrics and health checks',
        timeAgo: 'last week',
        content: `import React from 'react';\n\nexport function DataPanel({ telemetry }: { telemetry: Record<string, number> }) {\n  return (\n    <div className="data-panel">\n      <h3>Telemetry Metrics</h3>\n    </div>\n  );\n}`
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        name: 'globals.css',
        type: 'file',
        tokens: 122,
        size: '122 tokens',
        commitMessage: 'style: update base Tailwind tokens and root color scheme',
        timeAgo: '3 weeks ago',
        content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  --bg-primary: #121212;\n  --text-main: #f4f4f5;\n}`
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        name: 'layout.tsx',
        type: 'file',
        tokens: 175,
        size: '175 tokens',
        commitMessage: 'chore(layout): wrap root tree with metadata and providers',
        timeAgo: 'last month',
        content: `export default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}`
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        name: 'page.tsx',
        type: 'file',
        tokens: 3800,
        size: '3.8k tokens',
        commitMessage: 'feat(page): mount client control interface',
        timeAgo: '3 weeks ago',
        content: `'use client';\n\nimport React from 'react';\nimport ControlPanel from './ControlPanel';\n\nexport default function Page() {\n  return (\n    <main className="min-h-screen p-8">\n      <ControlPanel />\n    </main>\n  );\n}`
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        name: 'main.py',
        type: 'file',
        tokens: 3400,
        size: '3.4k tokens',
        commitMessage: 'fix(ollama): keyless env config and /v1 base URL normaliz...',
        timeAgo: '5 days ago',
        content: `"""\nHypervisor Daemon Core\n"""\nimport logging\n\ndef run():\n    logging.info("Core orchestrator initialized")\n\nif __name__ == "__main__":\n    run()`
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        name: 'test_orchestrator.py',
        type: 'file',
        tokens: 5125,
        size: '5.1k tokens',
        commitMessage: 'test: add unit test coverage for hypervisor orchestrator',
        timeAgo: 'last month',
        content: `import unittest\n\nclass TestOrchestration(unittest.TestCase):\n    def test_startup(self):\n        self.assertTrue(True)`
      },
      {
        id: Math.random().toString(36).substring(2, 11),
        name: 'utils.py',
        type: 'file',
        tokens: 198,
        size: '198 tokens',
        commitMessage: 'refactor(crypto): export sha256 hashing helper',
        timeAgo: 'last month',
        content: `import hashlib\n\ndef hash_string(val: str) -> str:\n    return hashlib.sha256(val.encode()).hexdigest()`
      }
    ];

    // Filter out files that already exist by name
    const existingNames = new Set(files.map(f => f.name));
    const toAdd = sampleRepoFiles.filter(f => !existingNames.has(f.name));
    
    onUpdateProject(project.id, { files: [...files, ...toAdd] });
    setIsImportModalOpen(false);
    setGithubRepoInput('');
  };

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter(f => 
      f.name.toLowerCase().includes(q) || 
      (f.commitMessage && f.commitMessage.toLowerCase().includes(q))
    );
  }, [files, searchQuery]);

  const totalTokens = useMemo(() => {
    return files.reduce((acc, f) => {
      if (typeof f.tokens === 'number') return acc + f.tokens;
      if (f.content) return acc + Math.max(1, Math.ceil(f.content.length / 4));
      return acc + 250;
    }, 0);
  }, [files]);

  if (selectedFile) {
    const fileLines = selectedFile.content ? selectedFile.content.split('\n') : [];
    const ext = getFileExtension(selectedFile.name);

    return (
      <div className="flex-1 flex flex-col h-full bg-[#151515] text-[#e4e4e7] overflow-y-auto no-scrollbar">
        <div className="max-w-6xl w-full mx-auto px-6 sm:px-8 py-8 flex flex-col min-h-full">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-4 mb-8">
            {/* Breadcrumb Navigation: <- Projects / {ProjectName} / {FileName} */}
            <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
              <button 
                type="button"
                onClick={() => setSelectedFile(null)}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer group text-2xl font-serif shrink-0 mr-1"
                title={`Back to ${name}`}
              >
                <ArrowLeft size={19} className="text-zinc-400 group-hover:text-zinc-100 transition-transform group-hover:-translate-x-0.5" />
              </button>

              <button 
                type="button"
                onClick={onBack}
                className="text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer text-2xl font-serif"
                title="Back to Projects"
              >
                Projects
              </button>

              <span className="text-zinc-600 select-none text-2xl font-serif">/</span>

              <button 
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer text-2xl font-serif truncate max-w-[200px]"
                title={`Back to ${name}`}
              >
                {name}
              </button>

              <span className="text-zinc-600 select-none text-2xl font-serif">/</span>

              <span className="text-zinc-100 text-2xl font-serif truncate max-w-[320px]">
                {selectedFile.name}
              </span>
            </div>

            {/* Right Toolbar Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#202020] text-zinc-400 border border-[#2c2c2c]">
                {getFileTokens(selectedFile)}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#202020] text-zinc-400 border border-[#2c2c2c]">
                {ext}
              </span>
              <button 
                type="button"
                onClick={handleCopyContent}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#202020] hover:bg-[#282828] border border-[#2e2e2e] hover:border-[#3a3a3a] text-zinc-300 hover:text-white rounded-full text-xs font-medium transition-colors cursor-pointer"
                title="Copy file contents"
              >
                {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Code Content Area (Full Screen matching exact border/padding) */}
          <div className="flex-1 flex flex-col bg-[#181818] border border-[#262626] rounded-xl overflow-hidden shadow-xs pb-4">
            {/* Sub-header with line count and file info */}
            <div className="flex items-center justify-between px-5 py-3 bg-[#161616] border-b border-[#262626] text-xs text-zinc-400">
              <div className="flex items-center gap-2.5">
                <FileCode2 size={15} className="text-zinc-400" />
                <span className="font-mono text-zinc-300 font-medium">{selectedFile.name}</span>
              </div>
              <span className="font-mono text-zinc-500">
                {fileLines.length} {fileLines.length === 1 ? 'line' : 'lines'}
              </span>
            </div>

            {/* Code Body with Line Numbers */}
            <div className="flex-1 overflow-x-auto p-4 sm:p-5 font-mono text-xs leading-relaxed select-text bg-[#141414]">
              {selectedFile.content ? (
                <table className="border-collapse w-full">
                  <tbody>
                    {fileLines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-[#1a1a1a]/80 transition-colors">
                        <td className="text-zinc-600 select-none text-right pr-4 pl-1 w-12 align-top text-[11px] border-r border-[#222]">
                          {idx + 1}
                        </td>
                        <td className="text-zinc-200 whitespace-pre align-top select-text pl-4">
                          {line || '\n'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-zinc-600 italic py-20 text-center">
                  // No text content available for this file
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#151515] text-[#e4e4e7] overflow-y-auto no-scrollbar">
      <div className="max-w-6xl w-full mx-auto px-6 sm:px-8 py-8 flex flex-col min-h-full">
        
        {/* Project Header */}
        <div className="flex flex-col gap-3 mb-8">
          {/* Project Title Row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <button 
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer shrink-0 group text-2xl font-serif"
                title="Back to Projects"
              >
                <ArrowLeft size={19} className="text-zinc-400 group-hover:text-zinc-100 transition-transform group-hover:-translate-x-0.5" />
                <span>Projects</span>
                <span className="text-zinc-600 select-none ml-1">/</span>
              </button>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameBlur}
                className="text-2xl font-serif text-zinc-100 bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder:text-zinc-600 flex-1 min-w-0"
                placeholder="Project Name"
              />
            </div>
            {onWorkOnProject && (
              <button
                onClick={() => onWorkOnProject(project)}
                className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-1.5 rounded-full text-sm transition-colors font-medium shadow-xs shrink-0 cursor-pointer whitespace-nowrap"
              >
                <FolderOpen size={15} />
                Work on it
              </button>
            )}
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescBlur}
            className="text-sm text-zinc-400 bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder:text-zinc-600 resize-none min-h-[48px]"
            placeholder="Add a description..."
          />
        </div>

        {/* Project Instructions Box */}
        <div className="bg-[#181818] border border-[#262626] rounded-xl overflow-hidden mb-8 transition-colors shadow-xs">
          {/* Header Row inside the Box */}
          <div 
            onClick={() => {
              if (!isInstructionsExpanded) {
                setInstructionsInput(project.instructions || '');
              }
              setIsInstructionsExpanded(!isInstructionsExpanded);
            }}
            className="flex items-center justify-between px-4 py-3 cursor-pointer select-none group bg-[#181818]"
          >
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-medium text-zinc-200">Project Instructions</h2>
              <span className="text-[11px] text-zinc-500 font-mono">
                {instructionsInput.trim().length > 0 ? `${instructionsInput.length} chars` : 'Empty'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isInstructionsExpanded) {
                    setInstructionsInput(project.instructions || '');
                  }
                  setIsInstructionsExpanded(!isInstructionsExpanded);
                }}
                className="w-6 h-6 rounded-full bg-[#202020] hover:bg-[#282828] border border-[#2e2e2e] hover:border-[#3a3a3a] text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all cursor-pointer"
                title={isInstructionsExpanded ? "Collapse instructions" : "Edit instructions"}
              >
                <Plus 
                  size={14} 
                  strokeWidth={2} 
                  className={`transition-transform duration-300 ease-out ${isInstructionsExpanded ? 'rotate-45 text-zinc-200' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Instructions Content (Smooth Expandable Container) */}
          <div className="flex flex-col">
            <motion.div
              initial={false}
              animate={{
                height: isInstructionsExpanded ? 'auto' : 0,
                opacity: isInstructionsExpanded ? 1 : 0
              }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className={`will-change-[height,opacity] ${isInstructionsExpanded ? 'overflow-visible' : 'overflow-hidden'}`}
            >
              {/* Horizontal line separation (inset from sides) */}
              <div className="mx-4 h-px bg-[#262626]" />
              
              {/* Direct typeable field */}
              <div className="p-4 flex flex-col gap-3">
                <textarea 
                  value={instructionsInput}
                  onChange={e => setInstructionsInput(e.target.value)}
                  onBlur={() => {
                    if (instructionsInput.trim() !== (project.instructions || '')) {
                      onUpdateProject(project.id, { instructions: instructionsInput.trim() });
                    }
                  }}
                  rows={8}
                  placeholder="Add guidelines, context, and prompts to tailor how this project is handled..."
                  className="w-full bg-transparent border-none p-0 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-y min-h-[160px] leading-relaxed font-sans"
                />

                {/* Bottom Action Row below the instruction box */}
                <div className="flex items-center justify-between pt-3 pb-1 border-t border-[#262626]">
                  <span className="text-xs text-zinc-500 font-mono">
                    {instructionsInput.trim().length > 0 ? `${instructionsInput.length} characters` : '0 characters'}
                  </span>
                  
                  <button
                    type="button"
                    onClick={handleSaveInstructions}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-sm whitespace-nowrap flex items-center gap-1.5 ${
                      isInstructionsSaved 
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-zinc-100 hover:bg-white text-zinc-900 active:scale-95'
                    }`}
                    title="Save project instructions"
                  >
                    {isInstructionsSaved ? (
                      <>
                        <Check size={13} strokeWidth={2.5} />
                        <span>Saved</span>
                      </>
                    ) : (
                      <span>Save</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Collapsed One-line Instruction Preview */}
            <motion.div
              initial={false}
              animate={{
                height: !isInstructionsExpanded && project.instructions && project.instructions.trim().length > 0 ? 'auto' : 0,
                opacity: !isInstructionsExpanded && project.instructions && project.instructions.trim().length > 0 ? 1 : 0
              }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`will-change-[height,opacity] ${!isInstructionsExpanded ? 'overflow-visible' : 'overflow-hidden'}`}
            >
              <div className="mx-4 h-px bg-[#262626]" />
              <div 
                onClick={() => {
                  setInstructionsInput(project.instructions || '');
                  setIsInstructionsExpanded(true);
                }}
                className="px-4 py-2.5 text-xs text-zinc-400 font-mono truncate cursor-pointer hover:text-zinc-200 transition-colors flex items-center justify-between group/preview"
                title="Click to edit instructions"
              >
                <span className="truncate pr-4">{project.instructions}</span>
                <span className="text-[11px] text-zinc-500 group-hover/preview:text-zinc-300 font-sans shrink-0">Click to expand</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Project Sync Section */}
        <div className="flex flex-col gap-3 mb-8">
          <div className="flex items-center gap-2 pb-1">
            <h2 className="text-sm font-medium text-zinc-200">Project Sync</h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#202020] text-zinc-400 border border-[#2c2c2c]">
              {syncFiles.length}
            </span>
          </div>

          <div className="pt-0.5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {syncFiles.map(file => {
                const ext = getFileExtension(file.name);
                return (
                  <div 
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className="relative group bg-[#181818] hover:bg-[#202020] border border-[#262626] hover:border-[#363636] rounded-xl p-3 flex flex-col justify-between h-[104px] transition-all cursor-pointer select-none"
                  >
                    {/* Top: File name & token count */}
                    <div className="flex flex-col min-w-0 pr-2">
                      <span 
                        className="text-xs font-medium text-zinc-200 truncate group-hover:text-white transition-colors"
                        title={file.name}
                      >
                        {file.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {getFileTokens(file)}
                      </span>
                    </div>

                    {/* Bottom: Extension badge */}
                    <div className="flex items-center justify-between mt-auto pt-1.5">
                      <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#1f1f1f] border border-[#2d2d2d] text-zinc-400 tracking-wider">
                        {ext}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Files Section - History Listing Layout */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 pb-2">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-medium text-zinc-200">Files</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#202020] text-zinc-400 border border-[#2c2c2c]">
                {files.length}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative group">
                <Search size={15} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search files..."
                  className="bg-[#222] border border-[#333] rounded-full py-1.5 pl-9 pr-4 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-all w-[150px] sm:w-[200px]"
                />
              </div>

              <button 
                type="button"
                onClick={handleImportGithub}
                className="flex items-center gap-1.5 bg-[#222] border border-[#333] hover:bg-[#2c2c2c] transition-colors rounded-full px-3.5 py-1.5 text-xs text-zinc-300 cursor-pointer"
                title="Import files from GitHub repository"
              >
                <Github size={13} strokeWidth={2} />
                <span>Import</span>
              </button>
              
              <button 
                type="button"
                onClick={handleTriggerUpload}
                className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-900 font-medium px-3.5 py-1.5 rounded-full text-xs transition-colors cursor-pointer shadow-xs"
                title="Upload files"
              >
                <Upload size={13} strokeWidth={2} />
                <span>Upload</span>
              </button>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                multiple 
                className="hidden" 
              />
            </div>
          </div>

          {/* Files List - Exact History Listing Layout */}
          {filteredFiles.length === 0 ? (
            <div 
              onClick={handleTriggerUpload}
              className="py-12 text-center text-zinc-500 text-sm cursor-pointer hover:text-zinc-400 transition-colors"
            >
              {searchQuery ? `No files matching "${searchQuery}"` : 'No files in this project. Click to upload.'}
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredFiles.map((file, idx) => {
                const timeAgo = getFileTimeAgo(file, idx);
                return (
                  <div 
                    key={file.id}
                    className="group flex items-center justify-between py-3.5 border-b border-[#222] hover:bg-[#1a1a1a] px-4 -mx-4 rounded-xl cursor-pointer transition-colors"
                    onClick={() => setSelectedFile(file)}
                    onMouseLeave={() => {
                      if (activeMenuId === file.id) setActiveMenuId(null);
                    }}
                  >
                    <div className="flex items-center gap-3 overflow-hidden min-w-0 pr-4">
                      {renderFileIcon(file.name, file.type)}
                      <span className="text-zinc-300 font-medium truncate text-[15px] group-hover:text-zinc-100 transition-colors">
                        {file.name}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                        {getFileTokens(file)}
                      </span>
                    </div>

                    <div className="flex items-center relative shrink-0" onClick={e => e.stopPropagation()}>
                      <span className={`text-sm text-zinc-500 transition-opacity ${activeMenuId === file.id ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}>
                        {timeAgo}
                      </span>

                      <button 
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === file.id ? null : file.id)}
                        className={`absolute right-0 p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-[#333] transition-all cursor-pointer ${
                          activeMenuId === file.id ? 'opacity-100 bg-[#333] text-zinc-200' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        title="Options"
                      >
                        <MoreVertical size={18} strokeWidth={2} />
                      </button>

                      {activeMenuId === file.id && (
                        <div className="absolute right-0 top-full mt-1 bg-[#222] border border-[#333] rounded-lg shadow-xl shadow-black/50 py-1 w-36 z-20 flex flex-col animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(file);
                              setActiveMenuId(null);
                            }}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 hover:bg-[#333] hover:text-white text-left transition-colors cursor-pointer"
                          >
                            <Eye size={14} strokeWidth={2} />
                            View file
                          </button>
                          <div className="h-px bg-[#333] my-1 mx-2" />
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(file.id);
                              setActiveMenuId(null);
                            }}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-rose-400 hover:bg-[#333] hover:text-rose-300 text-left transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} strokeWidth={2} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* GitHub Import Modal */}
      {isImportModalOpen && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsImportModalOpen(false)}
        >
          <div 
            className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl shadow-2xl max-w-md w-full p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-200 font-medium">
                <Github size={18} />
                <span>Import from GitHub</span>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-[#282828] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-normal">
              Enter a GitHub repository URL or import standard project files directly into this project workspace.
            </p>

            <input 
              type="text" 
              placeholder="e.g. organization/repository"
              value={githubRepoInput}
              onChange={e => setGithubRepoInput(e.target.value)}
              className="bg-[#141414] border border-[#333] rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 rounded-full hover:bg-[#252525] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleConfirmGithubImport}
                className="px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-full text-sm font-medium transition-colors cursor-pointer shadow-xs whitespace-nowrap"
              >
                Import Files
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

