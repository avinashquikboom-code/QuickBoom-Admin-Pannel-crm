'use client';

import * as React from 'react';
import { cn } from 'cn';

/**
 * @param {{ fields: Array<{ label: string, value: React.ReactNode, highlight?: boolean, fullWidth?: boolean }> }} props
 */
export function ApprovalSummary({ fields, className }) {
  if (!fields?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 gap-2.5',
        className,
      )}
    >
      {fields.map((field) => (
        <div
          key={field.label}
          className={cn(
            'rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 py-3',
            field.fullWidth && 'sm:col-span-2',
            field.highlight && 'border-brand/25 bg-brand-light/30',
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {field.label}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 leading-snug wrap-break-word">
            {field.value ?? '—'}
          </p>
        </div>
      ))}
    </div>
  );
}
