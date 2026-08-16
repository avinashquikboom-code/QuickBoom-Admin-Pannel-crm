'use client';

import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { AdminButton } from '../buttons/AdminButton';

export interface AdminEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function AdminEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: AdminEmptyStateProps) {
  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200/80 shadow-xs p-12 text-center space-y-4 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto shadow-2xs">
        <Icon className="w-7 h-7" />
      </div>

      <div className="space-y-1 max-w-sm mx-auto">
        <h4 className="text-base font-black text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">{description}</p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <AdminButton variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </AdminButton>
        </div>
      )}
    </div>
  );
}
