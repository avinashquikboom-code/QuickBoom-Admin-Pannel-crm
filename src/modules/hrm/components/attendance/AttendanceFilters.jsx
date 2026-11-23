'use client';

import * as React from 'react';
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  X,
  RotateCcw,
} from 'lucide-react';
import { Input } from '@/components/common/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { Button } from '@/components/common/Button';

export function AttendanceFilters({
  search,
  onSearchChange,
  selectedDept,
  onDeptChange,
  selectedStatus,
  onStatusChange,
  selectedDate,
  onDateChange,
  onResetDate,
  isToday,
  onExport,
  departments = ['All Departments'],
  onResetFilters,
  hasActiveFilters,
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left Side: Search + Date Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by employee name or ID..."
              className="h-10 pl-9 pr-3 text-xs sm:text-sm rounded-xl border-slate-200 bg-slate-50/60 focus-visible:bg-white focus-visible:ring-[#107569] w-full"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Date Picker Controls with Today Jump */}
          {onDateChange && (
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-1">
              <button
                type="button"
                onClick={() => {
                  if (!selectedDate) return;
                  const prev = new Date(selectedDate);
                  prev.setDate(prev.getDate() - 1);
                  onDateChange(prev.toISOString().split('T')[0]);
                }}
                className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-[#107569] transition shadow-2xs"
                title="Previous Day"
              >
                <ChevronLeft className="size-4" />
              </button>

              <div className="relative flex items-center">
                <input
                  type="date"
                  value={selectedDate || ''}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-[#163A2E] focus:outline-none focus:ring-1 focus:ring-[#107569]"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!selectedDate) return;
                  const next = new Date(selectedDate);
                  next.setDate(next.getDate() + 1);
                  onDateChange(next.toISOString().split('T')[0]);
                }}
                className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-[#107569] transition shadow-2xs"
                title="Next Day"
              >
                <ChevronRight className="size-4" />
              </button>

              {!isToday && onResetDate && (
                <button
                  type="button"
                  onClick={onResetDate}
                  className="h-8 rounded-lg border border-emerald-200/80 bg-emerald-50 px-2.5 text-[11px] font-bold text-[#107569] hover:bg-emerald-100 transition"
                >
                  Today
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Department + Status + Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <div className="w-full sm:w-44">
            <Select value={selectedDept} onValueChange={onDeptChange}>
              <SelectTrigger className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 bg-slate-50/60 focus:ring-[#107569]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept} className="text-xs">
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-36">
            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 bg-slate-50/60 focus:ring-[#107569]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All Statuses
                </SelectItem>
                <SelectItem value="present" className="text-xs">
                  Present
                </SelectItem>
                <SelectItem value="late" className="text-xs">
                  Late
                </SelectItem>
                <SelectItem value="half_day" className="text-xs">
                  Half Day
                </SelectItem>
                <SelectItem value="on_leave" className="text-xs">
                  On Leave
                </SelectItem>
                <SelectItem value="absent" className="text-xs">
                  Absent
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && onResetFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-10 rounded-xl px-2.5 text-xs text-slate-500 hover:text-slate-800"
              title="Reset all filters"
            >
              <RotateCcw className="size-3.5 mr-1" />
              Reset
            </Button>
          )}

          {/* Export CSV button */}
          {onExport && (
            <Button
              onClick={onExport}
              className="h-10 rounded-xl bg-[#107569] hover:bg-[#0e6359] text-white px-3.5 text-xs font-semibold shadow-xs transition"
            >
              <Download className="size-3.5 mr-1.5" />
              Export CSV
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
