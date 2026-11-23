'use client';

import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { truncateWords } from '@/lib/truncate-words.mjs';

export { truncateWords };

/**
 * TruncatedText
 *
 * Provides pure CSS single-line truncation with ellipsis (...) without slicing strings in JavaScript.
 * On hover/focus: displays full text in a Radix/Base-UI Tooltip (and native title attribute fallback).
 * On tap/click (mobile/touch devices): displays full text in an interactive Popover.
 *
 * @param {Object} props
 * @param {string|number|null} [props.value]
 * @param {string|number|null} [props.text]
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.className]
 * @param {string} [props.maxWidth]
 * @param {string} [props.label]
 */
export function TruncatedText({
  value = undefined,
  text = undefined,
  children = undefined,
  className = '',
  maxWidth = 'max-w-xs',
  label = 'Full Details',
} = {}) {
  const raw = value !== undefined ? value : text !== undefined ? text : children;
  if (raw == null || raw === '') {
    return <span className="text-slate-400">—</span>;
  }

  const original = String(raw).trim();
  if (!original) {
    return <span className="text-slate-400">—</span>;
  }

  return (
    <Popover>
      <TooltipProvider delay={150}>
        <Tooltip>
          <TooltipTrigger
            render={
              <PopoverTrigger
                type="button"
                aria-label={`View full details: ${original}`}
                className={`truncate-text block w-full min-w-0 text-left cursor-pointer border-0 bg-transparent p-0 font-inherit text-inherit transition-colors hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:rounded-xs ${maxWidth} ${className}`}
              />
            }
          >
            <span
              title={original}
              className="truncate-text block w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {original}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="start"
            className="z-50 max-w-[min(26rem,calc(100vw-2rem))] whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-xl"
          >
            {label ? (
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
                {label}
              </span>
            ) : null}
            {original}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent
        align="start"
        side="bottom"
        className="z-50 max-h-72 w-80 max-w-[calc(100vw-2rem)] overflow-auto rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-800 shadow-xl"
      >
        {label ? (
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            {label}
          </div>
        ) : null}
        <div className="whitespace-pre-wrap break-words text-slate-700">
          {original}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default TruncatedText;
