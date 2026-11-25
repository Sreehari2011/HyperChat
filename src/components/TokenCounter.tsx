import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TokenCounterProps {
  tokens: number;
  maxTokens?: number;
  isGhostMode?: boolean;
  className?: string;
}

export default function TokenCounter({ 
  tokens, 
  maxTokens = 32000, 
  isGhostMode = false,
  className = '' 
}: TokenCounterProps) {
  if (tokens <= 0) return null;

  const calculateProgressRatio = (count: number, max: number): number => {
    if (count <= 0) return 0;
    const normalized = Math.min(count / max, 1);
    const logRatio = Math.min(1, Math.log10(count + 1) / Math.log10(max + 1));
    const ratio = 0.65 * logRatio + 0.35 * Math.sqrt(normalized);
    return Math.min(1, Math.max(0.06, ratio));
  };

  const circleRadius = 7.5;
  const circumference = 2 * Math.PI * circleRadius;
  const progressRatio = calculateProgressRatio(tokens, maxTokens);
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 4 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 4 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={`flex items-center gap-2 select-none pointer-events-auto ${className}`}
        title={`Session tokens: ${tokens.toLocaleString()} ${tokens === 1 ? 'token' : 'tokens'}`}
      >
        <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 -rotate-90 transform" viewBox="0 0 20 20">
            {/* Background Track */}
            <circle
              cx="10"
              cy="10"
              r={circleRadius}
              className="text-zinc-700/60"
              strokeWidth="1.8"
              stroke="currentColor"
              fill="none"
            />
            {/* Progress Arc */}
            <circle
              cx="10"
              cy="10"
              r={circleRadius}
              className={`transition-all duration-200 ease-out ${
                isGhostMode 
                  ? 'text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.7)]' 
                  : 'text-zinc-300'
              }`}
              strokeWidth="1.8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
            />
          </svg>
        </div>
        <span 
          className="font-display italic text-xs text-zinc-300 tracking-wide whitespace-nowrap"
          style={{ fontFamily: '"IBM Plex Serif", Georgia, serif' }}
        >
          {tokens.toLocaleString()} {tokens === 1 ? 'token' : 'tokens'}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
