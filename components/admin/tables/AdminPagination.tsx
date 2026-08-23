'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

export interface AdminPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
  className?: string;
  showPageSizeSelector?: boolean;
  showItemCount?: boolean;
}

export function AdminPagination({
  page,
  pageSize,
  total,
  totalPages: customTotalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  disabled = false,
  className = '',
  showPageSizeSelector = true,
  showItemCount = true,
}: AdminPaginationProps) {
  const totalPages = customTotalPages || Math.max(Math.ceil(total / pageSize), 1);

  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  // Generate sliding window of page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div
      className={`px-4 py-3.5 sm:px-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 ${className}`}
    >
      {/* 1. Item count & Page size selector */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        {showItemCount && (
          <span className="font-bold text-slate-500">
            Showing <strong className="text-slate-900 font-black">{startItem}</strong> -{' '}
            <strong className="text-slate-900 font-black">{endItem}</strong> of{' '}
            <strong className="text-slate-900 font-black">{(total || 0).toLocaleString()}</strong> records
          </span>
        )}

        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={disabled}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#23C45E] cursor-pointer disabled:opacity-50"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Navigation Controls */}
      <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={disabled || page <= 1}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="First page"
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          disabled={disabled || page <= 1}
          className="px-2.5 py-1.5 rounded-xl font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Prev</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 font-bold">
                  ...
                </span>
              );
            }

            const pageNum = Number(p);
            const isCurrent = pageNum === page;

            return (
              <button
                key={`page-${pageNum}`}
                type="button"
                onClick={() => onPageChange(pageNum)}
                disabled={disabled}
                className={`min-w-[28px] h-7 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#23C45E] text-slate-950 shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                } disabled:opacity-50`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(page + 1, totalPages))}
          disabled={disabled || page >= totalPages}
          className="px-2.5 py-1.5 rounded-xl font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1"
          aria-label="Next page"
        >
          <span className="hidden md:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={disabled || page >= totalPages}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Last page"
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
