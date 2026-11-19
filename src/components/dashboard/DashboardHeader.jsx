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
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-[#F7F9F8] to-emerald-50/30 p-4 sm:p-6 shadow-xs">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Greeting, Date & Live Badge */}
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100/70 text-[#163A2E]">
              <Sparkles className="size-4 text-[#163A2E]" />
            </span>
            <h1 className="truncate text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              {greeting}, <span className="text-[#163A2E]">{adminName}</span>
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
              {todayStr}
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="truncate text-slate-500">
              QB Suite Executive Management Dashboard
            </span>
            {lastUpdated && (
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
