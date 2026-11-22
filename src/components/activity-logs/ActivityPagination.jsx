'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/common/Button';

export function ActivityPagination({
  page = 1,
  limit = 20,
  total = 0,
  totalPages = 1,
  onPageChange,
  onLimitChange,
  className = '',
}) {
  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-slate-200/80 bg-[#F7F9F8]/60 text-xs text-slate-600 rounded-b-2xl ${className}`}
    >
      {/* 1. Range Info & Rows Selector */}
      <div className="flex flex-wrap items-center gap-3 order-2 sm:order-1 text-center sm:text-left justify-center sm:justify-start">
        <span>
          Showing <strong className="text-slate-900">{startRecord}</strong>–
          <strong className="text-slate-900">{endRecord}</strong> of{' '}
          <strong className="text-slate-900">{Number(total || 0).toLocaleString()}</strong> logs
        </span>

        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 text-slate-500">
          <span className="text-[11px] text-slate-400">Rows:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="h-7 rounded-md border border-slate-200 bg-white px-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#163A2E] cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* 2. Page Navigation Controls */}
      <div className="flex items-center gap-1 order-1 sm:order-2 shrink-0">
        {/* First Page */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-600 hover:bg-white"
          title="First page"
        >
          <ChevronsLeft className="size-3.5" />
        </Button>

        {/* Previous Page */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 px-2 rounded-lg border-slate-200 text-slate-600 hover:bg-white flex items-center gap-1"
          title="Previous page"
        >
          <ChevronLeft className="size-3.5" />
          <span className="hidden md:inline">Prev</span>
        </Button>

        {/* Numeric Page Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((p) => {
            const isCurrent = p === page;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`size-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#163A2E] text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-8 px-2 rounded-lg border-slate-200 text-slate-600 hover:bg-white flex items-center gap-1"
          title="Next page"
        >
          <span className="hidden md:inline">Next</span>
          <ChevronRight className="size-3.5" />
        </Button>

        {/* Last Page */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-600 hover:bg-white"
          title="Last page"
        >
          <ChevronsRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
