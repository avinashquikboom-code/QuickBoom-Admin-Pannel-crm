'use client';

import React from 'react';
import { Filter } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface AdminFilterBarProps {
  children?: React.ReactNode;
  className?: string;
}

export function AdminFilterBar({ children, className = '' }: AdminFilterBarProps) {
  return (
    <div
      className={`bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}
    >
      {children}
    </div>
  );
}

export const FilterCard = AdminFilterBar;
export type FilterCardProps = AdminFilterBarProps;
