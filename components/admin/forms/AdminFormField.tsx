'use client';

import React from 'react';

export interface AdminFormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AdminFormField({
  label,
  required,
  hint,
  error,
  fullWidth = false,
  children,
  className = '',
}: AdminFormFieldProps) {
  return (
    <div className={`space-y-1.5 ${fullWidth ? 'col-span-full' : ''} ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
          {required && <span className="text-rose-500 ml-1 font-black">*</span>}
        </label>
      </div>

      {children}

      {hint && !error && <p className="text-[11px] text-slate-400 font-medium">{hint}</p>}
      {error && <p className="text-[11px] text-rose-500 font-bold">{error}</p>}
    </div>
  );
}
