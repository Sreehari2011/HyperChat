import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Agent, SubAgent } from '../types';
import { ArrowLeft, Plus, Trash2, MessageSquare } from 'lucide-react';

interface AgentTemplateViewProps {
  agent: Agent;
  onBack: () => void;
  onUpdateAgent: (id: string, updates: Partial<Agent>) => void;
  onStartChat?: (agent: Agent) => void;
}

export default function AgentTemplateView({ agent, onBack, onUpdateAgent, onStartChat }: AgentTemplateViewProps) {
  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description || '');
  const [instructions, setInstructions] = useState(agent.instructions || '');
  const [isMainInstructionsExpanded, setIsMainInstructionsExpanded] = useState(false);
  const [isMainSaved, setIsMainSaved] = useState(false);

  // Sub-agents state
  const [subAgents, setSubAgents] = useState<SubAgent[]>(agent.subAgents || []);
  const [expandedSubAgentIds, setExpandedSubAgentIds] = useState<Set<string>>(new Set());
  const [savedSubAgentIds, setSavedSubAgentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setName(agent.name);
    setDescription(agent.description || '');
    setInstructions(agent.instructions || '');
    setSubAgents(agent.subAgents || []);
  }, [agent]);

  const handleNameBlur = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== agent.name) {
      onUpdateAgent(agent.id, { name: trimmed });
    }
  };

  const handleDescBlur = () => {
    const trimmed = description.trim();
    if (trimmed !== (agent.description || '')) {
      onUpdateAgent(agent.id, { description: trimmed });
    }
  };

  const handleSaveMainInstructions = () => {
    onUpdateAgent(agent.id, { instructions: instructions.trim() });
    setIsMainSaved(true);
    setTimeout(() => setIsMainSaved(false), 2000);
  };

  const handleAddSubAgent = () => {
    const newId = Math.random().toString(36).substring(2, 11);
    const newSubAgentIndex = subAgents.length + 1;
    const newSubAgent: SubAgent = {
      id: newId,
      name: `Sub-agent ${newSubAgentIndex}`,
      description: '',
      instructions: ''
    };
    const updated = [...subAgents, newSubAgent];
    setSubAgents(updated);
    onUpdateAgent(agent.id, { subAgents: updated });
    
    // Automatically expand the newly created sub-agent's instruction window
    setExpandedSubAgentIds(prev => new Set(prev).add(newId));
  };

  const handleDeleteSubAgent = (subAgentId: string) => {
    const updated = subAgents.filter(s => s.id !== subAgentId);
    setSubAgents(updated);
    onUpdateAgent(agent.id, { subAgents: updated });
    setExpandedSubAgentIds(prev => {
      const next = new Set(prev);
      next.delete(subAgentId);
      return next;
    });
  };

  const handleUpdateSubAgentField = (subAgentId: string, field: keyof SubAgent, value: string) => {
    const updated = subAgents.map(s => s.id === subAgentId ? { ...s, [field]: value } : s);
    setSubAgents(updated);
    onUpdateAgent(agent.id, { subAgents: updated });
  };

  const toggleSubAgentExpand = (subAgentId: string) => {
    setExpandedSubAgentIds(prev => {
      const next = new Set(prev);
      if (next.has(subAgentId)) {
        next.delete(subAgentId);
      } else {
        next.add(subAgentId);
      }
      return next;
    });
  };

  const handleSaveSubAgentInstructions = (subAgentId: string) => {
    onUpdateAgent(agent.id, { subAgents });
    setSavedSubAgentIds(prev => new Set(prev).add(subAgentId));
    setTimeout(() => {
      setSavedSubAgentIds(prev => {
        const next = new Set(prev);
        next.delete(subAgentId);
        return next;
      });
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#151515] text-[#e4e4e7] overflow-y-auto no-scrollbar">
      <div className="max-w-6xl w-full mx-auto px-6 sm:px-8 py-8 flex flex-col min-h-full">
        
        {/* Agent Header (Similar to Project Window) */}
        <div className="flex flex-col gap-3 mb-8">
          {/* Agent Title Row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <button 
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer shrink-0 group text-2xl font-serif"
                title="Back to Agents"
              >
                <ArrowLeft size={19} className="text-zinc-400 group-hover:text-zinc-100 transition-transform group-hover:-translate-x-0.5" />
                <span>Agents</span>
                <span className="text-zinc-600 select-none ml-1">/</span>
              </button>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameBlur}
                className="text-2xl font-serif text-zinc-100 bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder:text-zinc-600 flex-1 min-w-0"
                placeholder="Agent Name"
              />
              {agent.category === 'builtin' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide shrink-0 bg-[#242424] text-zinc-400 border border-[#333]">
                  Builtin
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide shrink-0 bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                  Created by Me
                </span>
              )}
            </div>

            {onStartChat && (
              <button
                type="button"
                onClick={() => onStartChat(agent)}
                className="flex items-center gap-2 bg-[#252525] hover:bg-[#303030] text-zinc-200 border border-[#383838] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
              >
                <MessageSquare size={13} />
                <span>Chat with Agent</span>
              </button>
            )}
          </div>

          {/* Agent Description below Name */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescBlur}
            className="text-sm text-zinc-400 bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder:text-zinc-600 resize-none min-h-[44px]"
            placeholder="Add a description for this agent..."
          />
        </div>

        {/* Main Agent Guidelines Box (Design identical to Project Window Instructions) */}
        <div className="bg-[#191919] border border-[#2a2a2a] rounded-xl p-4 sm:p-5 flex flex-col transition-all mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-zinc-200">Agent Guidelines</h2>
            
            <button
              type="button"
              onClick={() => setIsMainInstructionsExpanded(!isMainInstructionsExpanded)}
              className="w-7 h-7 rounded-full bg-[#202020] hover:bg-[#282828] border border-[#2e2e2e] hover:border-[#3a3a3a] text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all cursor-pointer"
              title={isMainInstructionsExpanded ? "Collapse guidelines" : "Edit guidelines"}
            >
              <Plus 
                size={15} 
                strokeWidth={2} 
                className={`transition-transform duration-300 ease-out ${isMainInstructionsExpanded ? 'rotate-45 text-zinc-200' : ''}`}
              />
            </button>
          </div>

          <p className="text-xs text-zinc-500 mt-1">
            Define the overall mission, role constraints, and primary directives for this agent.
          </p>

          {/* Smooth Animated Instructions Section */}
          <div className="flex flex-col">
            <motion.div
              initial={false}
              animate={{
                height: isMainInstructionsExpanded ? 'auto' : 0,
                opacity: isMainInstructionsExpanded ? 1 : 0
              }}
              transition={{
                duration: 0.32,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="overflow-hidden will-change-[height,opacity]"
            >
              <div className="pt-3.5 pb-1 flex flex-col gap-3">
                <textarea 
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  rows={8}
                  placeholder="Provide core guidelines, instructions, and directives for this agent..."
                  className="w-full bg-[#141414] border border-[#2e2e2e] focus:border-[#4a4a4a] rounded-xl p-4 text-sm text-zinc-200 focus:outline-none resize-y min-h-[200px] leading-relaxed font-sans"
                />
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-xs text-zinc-500">
                    {instructions.trim().length > 0 ? `${instructions.length} characters` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveMainInstructions}
                    className="w-[72px] py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-full text-sm font-medium transition-colors cursor-pointer flex items-center justify-center shadow-xs whitespace-nowrap"
                  >
                    {isMainSaved ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Collapsed Instruction Preview */}
            <motion.div
              initial={false}
              animate={{
                height: !isMainInstructionsExpanded && instructions && instructions.trim().length > 0 ? 'auto' : 0,
                opacity: !isMainInstructionsExpanded && instructions && instructions.trim().length > 0 ? 1 : 0
              }}
              transition={{
                duration: 0.25,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="overflow-hidden will-change-[height,opacity]"
            >
              <div 
                onClick={() => setIsMainInstructionsExpanded(true)}
                className="mt-3.5 bg-[#141414] border border-[#282828] hover:border-[#383838] rounded-xl p-3.5 text-xs text-zinc-400 font-mono line-clamp-3 cursor-pointer transition-colors leading-relaxed group"
              >
                <div className="text-[11px] font-sans text-zinc-500 mb-1 flex items-center justify-between">
                  <span>Current Guidelines:</span>
                  <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Click to edit</span>
                </div>
                {instructions}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Sub-Agents Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-medium text-zinc-100">Sub-Agents</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#242424] text-zinc-400 font-medium border border-[#303030]">
                  {subAgents.length}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Configure specialized sub-agents with their own distinct instructions and roles.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddSubAgent}
              className="flex items-center gap-1.5 bg-[#222] hover:bg-[#2a2a2a] text-zinc-200 hover:text-white border border-[#333] hover:border-[#444] px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus size={14} />
              Add Sub-agent
            </button>
          </div>

          {/* Sub-Agents List */}
          {subAgents.length > 0 && (
            <div className="flex flex-col gap-4 mt-2">
              {subAgents.map((subAgent, index) => {
                const isExpanded = expandedSubAgentIds.has(subAgent.id);
                const isSaved = savedSubAgentIds.has(subAgent.id);
                const hasInstructions = !!subAgent.instructions?.trim();

                return (
                  <div
                    key={subAgent.id}
                    className="bg-[#191919] border border-[#2a2a2a] hover:border-[#333] rounded-xl p-4 sm:p-5 flex flex-col transition-all"
                  >
                    {/* Sub-Agent Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        {/* Sub-agent name input */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-medium text-zinc-500 bg-[#222] px-2 py-0.5 rounded border border-[#2d2d2d] shrink-0">
                            #{index + 1}
                          </span>
                          <input
                            type="text"
                            value={subAgent.name}
                            onChange={(e) => handleUpdateSubAgentField(subAgent.id, 'name', e.target.value)}
                            placeholder={`Sub-agent ${index + 1} Name`}
                            className="text-base font-medium text-zinc-100 bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder:text-zinc-600 flex-1 min-w-0"
                          />
                        </div>

                        {/* Sub-agent description input */}
                        <input
                          type="text"
                          value={subAgent.description || ''}
                          onChange={(e) => handleUpdateSubAgentField(subAgent.id, 'description', e.target.value)}
                          placeholder="Add a role or description for this sub-agent..."
                          className="text-xs text-zinc-400 bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder:text-zinc-600 w-full"
                        />
                      </div>

                      {/* Right action buttons: Toggle Instructions & Delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleSubAgentExpand(subAgent.id)}
                          className="w-7 h-7 rounded-full bg-[#202020] hover:bg-[#282828] border border-[#2e2e2e] hover:border-[#3a3a3a] text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all cursor-pointer"
                          title={isExpanded ? "Collapse sub-agent instructions" : "Expand sub-agent instructions"}
                        >
                          <Plus 
                            size={14} 
                            strokeWidth={2} 
                            className={`transition-transform duration-300 ease-out ${isExpanded ? 'rotate-45 text-zinc-200' : ''}`}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSubAgent(subAgent.id)}
                          className="w-7 h-7 rounded-full bg-[#202020] hover:bg-[#2a1c1c] border border-[#2e2e2e] hover:border-red-900/60 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                          title="Delete sub-agent"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Sub-agent Instruction Window */}
                    <div className="mt-3.5 border-t border-[#252525] pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-zinc-300">Instruction Window</span>
                          <span className="text-[11px] text-zinc-500">
                            {hasInstructions ? `${subAgent.instructions.length} chars` : 'Empty'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSubAgentExpand(subAgent.id)}
                          className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                        >
                          {isExpanded ? 'Hide' : 'Expand'}
                        </button>
                      </div>

                      {/* Expandable Textarea Section */}
                      <motion.div
                        initial={false}
                        animate={{
                          height: isExpanded ? 'auto' : 0,
                          opacity: isExpanded ? 1 : 0
                        }}
                        transition={{
                          duration: 0.28,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        className="overflow-hidden will-change-[height,opacity]"
                      >
                        <div className="pt-1 pb-1 flex flex-col gap-2.5">
                          <textarea
                            value={subAgent.instructions}
                            onChange={(e) => handleUpdateSubAgentField(subAgent.id, 'instructions', e.target.value)}
                            rows={6}
                            placeholder={`Define instructions, guidelines, workflows, or rules specific to ${subAgent.name || 'this sub-agent'}...`}
                            className="w-full bg-[#141414] border border-[#2e2e2e] focus:border-[#4a4a4a] rounded-xl p-3.5 text-xs text-zinc-200 focus:outline-none resize-y min-h-[140px] leading-relaxed font-sans placeholder:text-zinc-600"
                          />
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-[11px] text-zinc-500">
                              {hasInstructions ? `${subAgent.instructions.length} characters` : ''}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSaveSubAgentInstructions(subAgent.id)}
                              className="px-3.5 py-1 bg-zinc-100 hover:bg-white text-zinc-900 rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center justify-center shadow-xs"
                            >
                              {isSaved ? 'Saved' : 'Save'}
                            </button>
                          </div>
                        </div>
                      </motion.div>

                      {/* Collapsed Instruction Preview */}
                      <motion.div
                        initial={false}
                        animate={{
                          height: !isExpanded && hasInstructions ? 'auto' : 0,
                          opacity: !isExpanded && hasInstructions ? 1 : 0
                        }}
                        transition={{
                          duration: 0.22,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        className="overflow-hidden will-change-[height,opacity]"
                      >
                        <div
                          onClick={() => toggleSubAgentExpand(subAgent.id)}
                          className="bg-[#141414] border border-[#262626] hover:border-[#383838] rounded-lg p-2.5 text-xs text-zinc-400 font-mono line-clamp-2 cursor-pointer transition-colors leading-relaxed"
                          title="Click to expand instructions"
                        >
                          {subAgent.instructions}
                        </div>
                      </motion.div>

                      {/* Empty Collapsed Hint */}
                      {!isExpanded && !hasInstructions && (
                        <div
                          onClick={() => toggleSubAgentExpand(subAgent.id)}
                          className="text-[11px] text-zinc-600 hover:text-zinc-400 cursor-pointer transition-colors py-1 flex items-center gap-1.5"
                        >
                          <Plus size={11} />
                          <span>Add instructions for this sub-agent</span>
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
    </div>
  );
}
