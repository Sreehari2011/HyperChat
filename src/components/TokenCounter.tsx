import React from 'react';
import { tokenProgressRatio } from '../utils';

interface TokenCounterProps {
  tokens: number;
  maxTokens?: number;
  className?: string;
}

export default function TokenCounter({ tokens, maxTokens = 32_000, className = '' }: TokenCounterProps) {
  if (tokens <= 0) return null;

  const radius = 7.5;
  const circumference = 2 * Math.PI * radius;
  const ratio = tokenProgressRatio(tokens, maxTokens);
  const strokeDashoffset = circumference * (1 - ratio);

  return (
    <div
      className={`flex select-none items-center gap-2 ${className}`}
      title={`Session tokens: ${tokens.toLocaleString()} / ${maxTokens.toLocaleString()}`}
    >
      <div className="relative flex h-4 w-4 items-center justify-center">
        <svg className="h-4 w-4 -rotate-90" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r={radius} className="text-ink-600" strokeWidth="1.8" stroke="currentColor" fill="none" />
          <circle
            cx="10"
            cy="10"
            r={radius}
            className="text-amber-200/90 transition-all duration-200 ease-out"
            strokeWidth="1.8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
          />
        </svg>
      </div>
      <span className="font-mono text-[11px] tracking-wide text-ink-200">
        {tokens.toLocaleString()}
      </span>
    </div>
  );
}
