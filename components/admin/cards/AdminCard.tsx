'use client';

import React from 'react';

export interface AdminCardProps {
  title?: string;
  description?: string;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function AdminCard({
  title,
  description,
  headerActions,
  footer,
  children,
  className = '',
  bodyClassName = 'p-6',
}: AdminCardProps) {
  const hasHeader = title || description || headerActions;

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden ${className}`}>
      {hasHeader && (
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
          <div>
            {title && <h3 className="text-base font-black text-slate-900 tracking-tight">{title}</h3>}
            {description && <p className="text-xs text-slate-500 font-medium mt-0.5">{description}</p>}
          </div>
          {headerActions && <div className="flex items-center gap-2 shrink-0">{headerActions}</div>}
        </div>
      )}

      <div className={bodyClassName}>{children}</div>

      {footer && <div className="p-4 border-t border-slate-100 bg-slate-50/60">{footer}</div>}
    </div>
  );
}

export const StandardCard = AdminCard;
export const SectionCard = AdminCard;
export type StandardCardProps = AdminCardProps;
export type SectionCardProps = AdminCardProps;
