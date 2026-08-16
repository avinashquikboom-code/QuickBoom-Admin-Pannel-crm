'use client';

import React from 'react';

export type StatusVariant =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'present'
  | 'absent'
  | 'late'
  | 'remote'
  | 'working'
  | 'break'
  | 'checked_out'
  | 'paid'
  | 'unpaid'
  | 'processing'
  | 'completed'
  | 'failed';

export interface AdminStatusBadgeProps {
  status: StatusVariant | string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function AdminStatusBadge({
  status,
  label,
  size = 'md',
  className = '',
}: AdminStatusBadgeProps) {
  const normStatus = status.toLowerCase().replace(/[\s-]/g, '_');

  const variantStyles: Record<string, string> = {
    active: 'bg-[#E8F9EE] text-[#1AA14D] border-[#23C45E]/30',
    approved: 'bg-[#E8F9EE] text-[#1AA14D] border-[#23C45E]/30',
    completed: 'bg-[#E8F9EE] text-[#1AA14D] border-[#23C45E]/30',
    present: 'bg-[#E8F9EE] text-[#1AA14D] border-[#23C45E]/30',
    working: 'bg-[#E8F9EE] text-[#1AA14D] border-[#23C45E]/30',
    paid: 'bg-[#E8F9EE] text-[#1AA14D] border-[#23C45E]/30',

    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    late: 'bg-amber-50 text-amber-700 border-amber-200',
    break: 'bg-amber-50 text-amber-700 border-amber-200',
    processing: 'bg-amber-50 text-amber-700 border-amber-200',

    remote: 'bg-indigo-50 text-indigo-700 border-indigo-200',

    absent: 'bg-rose-50 text-rose-700 border-rose-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    failed: 'bg-rose-50 text-rose-700 border-rose-200',
    unpaid: 'bg-rose-50 text-rose-700 border-rose-200',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200',
    checked_out: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const style = variantStyles[normStatus] || 'bg-slate-100 text-slate-700 border-slate-200';
  const displayLabel = label || status.replace(/_/g, ' ');

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]';

  return (
    <span
      className={`inline-flex items-center font-black uppercase tracking-wider rounded-full border ${sizeClasses} ${style} ${className}`}
    >
      {displayLabel}
    </span>
  );
}
