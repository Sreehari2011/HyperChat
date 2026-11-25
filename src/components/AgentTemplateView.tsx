import React, { useState, useEffect } from 'react';
import { Agent, SubAgent } from '../types';
import { ArrowLeft, Plus, Trash2, MessageSquare, Save, Check, Bot, ChevronDown } from 'lucide-react';

interface AgentTemplateViewProps {
  agent: Agent;
  onBack: () => void;
  onUpdateAgent: (id: string, updates: Partial<Agent>) => void;
  onStartChat: (agent: Agent) => void;
}

export default function AgentTemplateView({ agent, onBack, onUpdateAgent, onStartChat }: AgentTemplateViewProps) {
  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description || '');
  const [instructions, setInstructions] = useState(agent.instructions || '');
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [subAgents, setSubAgents] = useState<SubAgent[]>(agent.subAgents || []);
  const [openSubIds, setOpenSubIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setName(agent.name);
    setDescription(agent.description || '');
    setInstructions(agent.instructions || '');
    setSubAgents(agent.subAgents || []);
    setOpenSubIds(new Set());
  }, [agent.id]);

  const handleNameBlur = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== agent.name) onUpdateAgent(agent.id, { name: trimmed });
  };

  const handleDescBlur = () => {
    const trimmed = description.trim();
    if (trimmed !== (agent.description || '')) onUpdateAgent(agent.id, { description: trimmed });
  };

  const saveInstructions = () => {
    onUpdateAgent(agent.id, { instructions: instructions.trim() });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1600);
  };

  const persistSubAgents = (updated: SubAgent[]) => {
    setSubAgents(updated);
    onUpdateAgent(agent.id, { subAgents: updated });
  };

  const addSubAgent = () => {
    const newSub: SubAgent = {
      id: Math.random().toString(36).substring(2, 11),
      name: `Sub-agent ${subAgents.length + 1}`,
      description: '',
      instructions: '',
    };
    persistSubAgents([...subAgents, newSub]);
    setOpenSubIds(prev => new Set(prev).add(newSub.id));
  };

  const deleteSubAgent = (id: string) => {
    persistSubAgents(subAgents.filter(s => s.id !== id));
    setOpenSubIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const updateSubAgentField = (id: string, field: keyof SubAgent, value: string) => {
    persistSubAgents(subAgents.map(s => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const toggleSub = (id: string) => {
    setOpenSubIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="no-scrollbar h-full flex-1 overflow-y-auto bg-ink-900">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-6 py-8">
        {/* header */}
        <div className="mb-7 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <button onClick={onBack} className="icon-btn -ml-2 shrink-0" title="Back to agents">
                <ArrowLeft size={17} />
              </button>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={handleNameBlur}
                className="min-w-0 flex-1 border-none bg-transparent p-0 font-serif text-[24px] font-light text-ink-50 outline-none placeholder:text-ink-400"
                placeholder="Agent name"
              />
              <span className={`badge shrink-0 border ${
                agent.category === 'builtin'
                  ? 'border-ink-600 bg-ink-750 text-ink-200'
                  : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
              }`}>
                {agent.category === 'builtin' ? 'Builtin' : 'Mine'}
              </span>
            </div>
            <button className="btn-primary shrink-0" onClick={() => onStartChat(agent)}>
              <MessageSquare size={14} /> Chat
            </button>
          </div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={handleDescBlur}
            rows={2}
            className="resize-none border-none bg-transparent p-0 text-[13px] text-ink-200 outline-none placeholder:text-ink-300"
            placeholder="Add a description for this agent…"
          />
        </div>

        {/* guidelines */}
        <div className="card mb-7 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Bot size={14} className="text-ink-200" />
              <h2 className="text-[13px] font-medium text-ink-100">Agent guidelines</h2>
              <span className="font-mono text-[11px] text-ink-300">
                {instructions.trim() ? `${instructions.length} chars` : 'Empty'}
              </span>
            </div>
            <button
              className="icon-btn"
              onClick={() => setIsInstructionsOpen(v => !v)}
              title={isInstructionsOpen ? 'Collapse' : 'Edit guidelines'}
            >
              <Plus size={15} className={`transition-transform duration-200 ${isInstructionsOpen ? 'rotate-45' : ''}`} />
            </button>
          </div>

          {isInstructionsOpen ? (
            <div className="flex flex-col gap-3 border-t border-ink-700 p-4">
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                rows={8}
                className="input-base min-h-[140px] resize-y !text-[13px]"
                placeholder="Define the mission, role constraints and primary directives for this agent…"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-ink-300">{instructions.length} characters</span>
                <button className={`btn-primary !py-1.5 !px-3.5 !text-xs ${justSaved ? '!bg-emerald-400' : ''}`} onClick={saveInstructions}>
                  {justSaved ? <Check size={12} /> : <Save size={12} />}
                  {justSaved ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            instructions.trim() && (
              <button
                className="border-t border-ink-700 px-4 py-3 text-left text-[12px] text-ink-200 hover:text-ink-100"
                onClick={() => setIsInstructionsOpen(true)}
              >
                <span className="line-clamp-2">{instructions}</span>
                <span className="mt-1 block text-[11px] text-ink-300">Click to edit</span>
              </button>
            )
          )}
        </div>

        {/* sub-agents */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[14px] font-medium text-ink-100">Sub-agents</h2>
                <span className="badge border border-ink-600 bg-ink-750 font-mono text-ink-200">{subAgents.length}</span>
              </div>
              <p className="mt-1 text-[11.5px] text-ink-300">Specialised workers with their own instructions and roles.</p>
            </div>
            <button className="btn-secondary !py-1.5 !px-3.5 !text-xs" onClick={addSubAgent}>
              <Plus size={13} /> Add sub-agent
            </button>
          </div>

          {subAgents.length === 0 ? (
            <button
              className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-ink-600 py-10 text-ink-300 transition-colors hover:border-ink-400 hover:text-ink-200"
              onClick={addSubAgent}
            >
              <Plus size={18} />
              <span className="text-[13px]">Add the first sub-agent</span>
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              {subAgents.map((sub, index) => {
                const isOpen = openSubIds.has(sub.id);
                return (
                  <div key={sub.id} className="card overflow-hidden">
                    <div className="flex items-start justify-between gap-3 p-4">
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 rounded border border-ink-600 bg-ink-750 px-1.5 py-0.5 font-mono text-[10px] text-ink-200">
                            #{index + 1}
                          </span>
                          <input
                            value={sub.name}
                            onChange={e => updateSubAgentField(sub.id, 'name', e.target.value)}
                            className="min-w-0 flex-1 border-none bg-transparent p-0 text-[14px] font-medium text-ink-50 outline-none"
                            placeholder={`Sub-agent ${index + 1} name`}
                          />
                        </div>
                        <input
                          value={sub.description || ''}
                          onChange={e => updateSubAgentField(sub.id, 'description', e.target.value)}
                          className="w-full border-none bg-transparent p-0 text-[12px] text-ink-200 outline-none placeholder:text-ink-400"
                          placeholder="Add a role or description…"
                        />
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button className="icon-btn" onClick={() => toggleSub(sub.id)} title={isOpen ? 'Collapse' : 'Expand instructions'}>
                          <ChevronDown size={15} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                          className="icon-btn hover:!bg-red-500/10 hover:!text-red-400"
                          onClick={() => deleteSubAgent(sub.id)}
                          title="Delete sub-agent"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="flex flex-col gap-2 border-t border-ink-700 bg-[#161616] p-4">
                        <textarea
                          value={sub.instructions}
                          onChange={e => updateSubAgentField(sub.id, 'instructions', e.target.value)}
                          rows={5}
                          className="input-base min-h-[100px] resize-y !text-[12.5px]"
                          placeholder={`Define instructions, workflows and rules specific to ${sub.name || 'this sub-agent'}…`}
                        />
                        <span className="text-[11px] text-ink-300">
                          {sub.instructions?.trim() ? `${sub.instructions.length} characters` : 'Empty'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
