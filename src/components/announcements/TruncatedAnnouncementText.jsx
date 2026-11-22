'use client';

import * as React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function TruncatedAnnouncementText({
  text,
  label = 'Announcement',
  isTitle = false,
  className = '',
}) {
  const content = text == null ? '' : String(text);
  if (!content) return <span className="text-slate-400">—</span>;

  return (
    <TooltipProvider delay={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            title={content}
            tabIndex={0}
            className={`block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-default select-text focus:outline-none focus-visible:ring-1 focus-visible:ring-[#163A2E] rounded ${
              isTitle
                ? 'font-semibold text-slate-900 text-xs sm:text-sm hover:text-[#163A2E] transition-colors'
                : 'text-[11px] sm:text-xs text-slate-500 hover:text-slate-700 transition-colors'
            } ${className}`}
          >
            {content}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="z-50 max-w-[280px] sm:max-w-[360px] md:max-w-[420px] rounded-xl border border-slate-800 bg-slate-900/95 px-3.5 py-2 text-xs font-normal text-white shadow-xl backdrop-blur-xs break-words"
        >
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
            {label}
          </span>
          <p className="leading-relaxed whitespace-pre-wrap">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
