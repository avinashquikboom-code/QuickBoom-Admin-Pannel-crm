'use client';

import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { truncateWords } from '@/lib/truncate-words.mjs';

export { truncateWords };

export function TruncatedText({ value, maxWords = 10, className = '' }) {
  if (value == null || value === '') return null;

  const original = String(value);
  const shortened = truncateWords(original, maxWords);
  if (shortened === original) return original;

  return (
    <Popover>
      <PopoverTrigger
        aria-label={`${shortened} Show full text`}
        title={original}
        className={`inline max-w-full cursor-pointer appearance-none border-0 bg-transparent p-0 text-left align-baseline text-inherit underline decoration-dotted decoration-slate-400 underline-offset-2 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 ${className}`}
      >
        {shortened}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-64 max-w-[min(24rem,calc(100vw-2rem))] overflow-auto whitespace-pre-wrap break-words border border-emerald-100 bg-white text-sm leading-5 text-slate-800 shadow-lg"
      >
        {original}
      </PopoverContent>
    </Popover>
  );
}
