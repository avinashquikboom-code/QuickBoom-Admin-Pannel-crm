'use client';

import React from 'react';
import { Inbox, Loader2 } from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface AdminDataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  mobileMode?: 'scroll' | 'cards';
  keyExtractor?: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  className?: string;
  minWidth?: string;
}

export function AdminDataTable<T>({
  columns,
  data,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display right now.',
  mobileMode = 'scroll',
  keyExtractor,
  onRowClick,
  className = '',
  minWidth = 'min-w-[650px]',
}: AdminDataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#23C45E] mx-auto" />
        <p className="text-xs font-bold text-slate-500">Loading data...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Inbox className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-black text-slate-900">{emptyTitle}</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden ${className}`}>
      <div className="overflow-x-auto custom-scrollbar">
        <table className={`w-full text-xs text-left ${minWidth}`}>
          <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-wider border-b border-slate-100">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`p-4 ${col.headerClassName || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {data.map((item, index) => {
              const rowKey = keyExtractor ? keyExtractor(item, index) : (item as any)?.id || index;
              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`hover:bg-slate-50/60 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`p-4 ${col.className || ''}`}>
                      {col.render ? col.render(item, index) : (item as any)[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
