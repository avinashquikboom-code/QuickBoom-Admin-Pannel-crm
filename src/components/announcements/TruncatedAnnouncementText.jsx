'use client';

import * as React from 'react';

export function TruncatedAnnouncementText({
  text,
  label = 'Announcement',
  isTitle = false,
  className = '',
}) {
  const content = text == null ? '' : String(text).trim();
  if (!content) return <span className="text-slate-400">—</span>;

  return (
    <span
      title={`${label}: ${content}`}
      className={`block w-full min-w-0 truncate ${
        isTitle
          ? 'text-sm font-semibold text-[#142D25]'
          : 'text-xs text-[#64748B]'
      } ${className}`}
    >
      {content}
    </span>
  );
}
