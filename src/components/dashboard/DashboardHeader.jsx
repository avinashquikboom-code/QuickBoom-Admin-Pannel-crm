'use client';

import * as React from 'react';
import { Calendar, RotateCw, Filter, Sparkles, Radio, CheckCircle2 } from 'lucide-react';
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
  liveState = 'live',
  lastUpdated = null,
}) {
  const authUser = useAuthStore((state) => state.user);
  const [sessionUser, setSessionUser] = React.useState(null);
  const [activePreset, setActivePreset] = React.useState('30D');
  const [showCustomRange, setShowCustomRange] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [todayStr, setTodayStr] = React.useState('');

  React.useEffect(() => {
    setMounted(true);
    const user = readSession()?.user;
    if (user) setSessionUser(user);
    setTodayStr(
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    );
  }, []);

  const adminName = mounted
    ? (authUser?.firstName ||
       authUser?.fullName ||
       sessionUser?.firstName ||
       sessionUser?.fullName ||
       sessionUser?.name ||
       'Super Admin')
    : 'Super Admin';

  const hour = new Date().getHours();
  const greeting = mounted
    ? (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening')
    : 'Welcome';

  const presets = [
    { key: 'Today', label: 'Today' },
    { key: '7D', label: 'Last 7 Days' },
    { key: '30D', label: 'Last 30 Days' },
    { key: 'Month', label: 'This Month' },
    { key: 'Last Month', label: 'Last Month' },
    { key: 'Custom', label: 'Custom' },
  ];

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
    } else if (preset === 'Custom') {
      setShowCustomRange((prev) => !prev);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E2E8E5] bg-gradient-to-r from-[#F0F7F4] via-white to-[#F0F7F4] p-4 sm:p-6 lg:p-7 shadow-xs">
      {/* Decorative Wave Accent */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-44 w-64 sm:h-56 sm:w-80 select-none text-emerald-600/10 sm:block hidden"
        aria-hidden="true"
      >
        <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <path d="M40 0C120 40 180 140 320 120V0H40Z" fill="currentColor" />
          <path d="M0 60C100 100 190 210 320 180V0H0V60Z" fill="currentColor" fillOpacity="0.5" />
          <circle cx="250" cy="50" r="40" stroke="currentColor" strokeWidth="8" strokeDasharray="6 6" fill="none" opacity="0.4" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Greeting, Date & Live Badge */}
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex size-9 sm:size-11 items-center justify-center rounded-xl bg-[#EAF7EF] text-[#173D30] border border-emerald-100 shadow-2xs">
              <Sparkles className="size-4 sm:size-5 text-[#173D30]" />
            </span>
            <h1 className="truncate text-xl sm:text-2xl lg:text-[28px] font-extrabold tracking-tight text-slate-900">
              {greeting}, <span className="text-[#173D30]">{adminName}</span>
            </h1>

            {/* Live Indicator Pill */}
            <div
              className={cn(
                'ml-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide',
                liveState === 'live'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                  : liveState === 'reconnecting'
                  ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              )}
            >
              <span
                className={cn(
                  'size-2 rounded-full',
                  liveState === 'live'
                    ? 'bg-emerald-500 animate-pulse'
                    : liveState === 'reconnecting'
                    ? 'bg-amber-500 animate-ping'
                    : 'bg-slate-400'
                )}
              />
              {liveState === 'live'
                ? 'Live Updates Active'
                : liveState === 'reconnecting'
                ? 'Reconnecting...'
                : 'Offline'}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <Calendar className="size-3.5 text-slate-400" />
              {todayStr || 'Today'}
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Here&apos;s what&apos;s happening across your business today.
          </p>
            {mounted && lastUpdated && (
              <>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="text-[11px] text-slate-400">
                  Last synced: {lastUpdated.toLocaleTimeString()}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Date Filter Presets & Refresh Action */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Presets */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs overflow-x-auto max-w-full">
            {presets.map((preset) => {
              const isSelected = activePreset === preset.key;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handlePreset(preset.key)}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#163A2E]',
                    isSelected
                      ? 'bg-[#163A2E] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Manual Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 gap-1.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#163A2E] transition-all duration-200 active:scale-95"
            title="Refresh live dashboard metrics"
          >
            <RotateCw
              className={cn('size-3.5 text-slate-500', loading && 'animate-spin text-[#163A2E]')}
            />
            <span className="hidden sm:inline">Sync</span>
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
