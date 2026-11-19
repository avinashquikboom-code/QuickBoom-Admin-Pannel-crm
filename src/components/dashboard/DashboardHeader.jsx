'use client';

import * as React from 'react';
import { Calendar, RotateCw, Filter, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useAuthStore } from '../../../lib/store';
import { readSession } from '@/lib/auth/admin-session';
import { cn } from '@/lib/utils';

export function DashboardHeader({
  dateFrom,
  dateTo,
  onDateChange,
  onRefresh,
  loading,
}) {
  const authUser = useAuthStore((state) => state.user);
  const [sessionUser, setSessionUser] = React.useState(null);
  const [activePreset, setActivePreset] = React.useState('30D');
  const [showCustomRange, setShowCustomRange] = React.useState(false);

  React.useEffect(() => {
    const user = readSession()?.user;
    if (user) setSessionUser(user);
  }, []);

  const adminName =
    authUser?.firstName ||
    authUser?.fullName ||
    sessionUser?.firstName ||
    sessionUser?.fullName ||
    sessionUser?.name ||
    'Admin';

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const todayStr = React.useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  const handlePreset = (preset) => {
    setActivePreset(preset);
    const now = new Date();
    const to = now.toISOString().split('T')[0];

    if (preset === 'Today') {
      setShowCustomRange(false);
      onDateChange(to, to);
    } else if (preset === '7D') {
      setShowCustomRange(false);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
      onDateChange(fromDate.toISOString().split('T')[0], to);
    } else if (preset === '30D') {
      setShowCustomRange(false);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);
      onDateChange(fromDate.toISOString().split('T')[0], to);
    } else if (preset === 'Month') {
      setShowCustomRange(false);
      const fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      onDateChange(fromDate.toISOString().split('T')[0], to);
    } else if (preset === 'Last Month') {
      setShowCustomRange(false);
      const fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const toDate = new Date(now.getFullYear(), now.getMonth(), 0);
      onDateChange(fromDate.toISOString().split('T')[0], toDate.toISOString().split('T')[0]);
    } else if (preset === 'Year') {
      setShowCustomRange(false);
      const fromDate = new Date(now.getFullYear(), 0, 1);
      onDateChange(fromDate.toISOString().split('T')[0], to);
    } else if (preset === 'Custom') {
      setShowCustomRange((prev) => !prev);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/20 p-4 sm:p-6 shadow-xs">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Greeting & Date */}
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
              <Sparkles className="size-4 text-brand-dark" />
            </span>
            <h1 className="truncate text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {greeting}, <span className="text-brand-dark">{adminName}</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500">
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <Calendar className="size-3.5 text-slate-400" />
              {todayStr}
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="truncate text-slate-500">
              QB Suite Executive Management Dashboard
            </span>
          </div>
        </div>

        {/* Right: Date Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Presets */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            {['Today', '7D', '30D', 'Month', 'Last Month', 'Custom'].map((preset) => {
              const isSelected = activePreset === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                    isSelected
                      ? 'bg-brand text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  {preset}
                </button>
              );
            })}
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 gap-1.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-dark transition-all duration-200 active:scale-95"
          >
            <RotateCw
              className={cn('size-3.5 text-slate-500', loading && 'animate-spin text-brand')}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Expandable Custom Date Range Selector */}
      {showCustomRange && (
        <div className="mt-4 border-t border-slate-200/80 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1 min-w-[140px] flex-1 sm:flex-initial">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                From Date
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateChange(e.target.value, dateTo)}
                className="h-8 text-xs bg-white border-slate-200 rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[140px] flex-1 sm:flex-initial">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                To Date
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => onDateChange(dateFrom, e.target.value)}
                className="h-8 text-xs bg-white border-slate-200 rounded-lg"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onDateChange('', '');
                setActivePreset('30D');
                setShowCustomRange(false);
              }}
              className="h-8 rounded-lg text-xs"
            >
              Reset Dates
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
