'use client';

import * as React from 'react';
import { Search, RotateCw, Filter, X, Calendar } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

export function ActivityFilterToolbar({
  search = '',
  onSearchChange,
  action = '',
  onActionChange,
  module = '',
  onModuleChange,
  userId = '',
  onUserIdChange,
  startDate = '',
  onStartDateChange,
  endDate = '',
  onEndDateChange,
  onRefresh,
  onClearFilters,
  loading = false,
  modulesList = [],
  actionsList = [],
  usersList = [],
  className = '',
}) {
  const hasActiveFilters = Boolean(
    search || action || module || userId || startDate || endDate
  );

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs space-y-3 ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-2.5 sm:gap-3 items-center">
        {/* 1. Search Activity Logs */}
        <div className="lg:col-span-3 sm:col-span-2 relative min-w-0">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search logs by description, IP, or ID..."
            className="pl-9 h-9.5 text-xs sm:text-sm rounded-xl border-slate-200 focus-visible:ring-[#163A2E]"
          />
        </div>

        {/* 2. Action Filter */}
        <div className="lg:col-span-2 sm:col-span-1 min-w-0">
          <select
            value={action}
            onChange={(e) => onActionChange(e.target.value)}
            className="h-9.5 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#163A2E] cursor-pointer"
          >
            <option value="">All Actions</option>
            {actionsList.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Module Filter */}
        <div className="lg:col-span-2 sm:col-span-1 min-w-0">
          <select
            value={module}
            onChange={(e) => onModuleChange(e.target.value)}
            className="h-9.5 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#163A2E] cursor-pointer"
          >
            <option value="">All Modules</option>
            {modulesList.map((mod) => (
              <option key={mod} value={mod}>
                {mod}
              </option>
            ))}
          </select>
        </div>

        {/* 4. User Filter */}
        <div className="lg:col-span-2 sm:col-span-1 min-w-0">
          <select
            value={userId}
            onChange={(e) => onUserIdChange(e.target.value)}
            className="h-9.5 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#163A2E] cursor-pointer"
          >
            <option value="">All Users</option>
            {usersList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || `User #${u.id}`}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Date Range Pickers (Start Date & End Date) */}
        <div className="lg:col-span-2 sm:col-span-2 grid grid-cols-2 gap-2 min-w-0">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="h-9.5 text-xs rounded-xl border-slate-200 px-2"
            title="Start date filter"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="h-9.5 text-xs rounded-xl border-slate-200 px-2"
            title="End date filter"
          />
        </div>

        {/* 6. Action Buttons (Refresh & Clear) */}
        <div className="lg:col-span-1 sm:col-span-1 flex items-center justify-end gap-1.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-9.5 px-3 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-[#E8F1EC] hover:text-[#163A2E] rounded-xl cursor-pointer w-full sm:w-auto"
            title="Refresh logs"
          >
            <RotateCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="inline sm:hidden ml-1">Refresh</span>
          </Button>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="h-9.5 px-2.5 text-xs font-semibold border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
              title="Clear all filters"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
