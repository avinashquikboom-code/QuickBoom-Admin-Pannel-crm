'use client';

import * as React from 'react';
import { ProviderLogo } from './ProviderLogos';
import { Button } from '@/components/ui/button';
import { AdminRowActions } from '@/components/common/AdminRowActions';
import { Clock, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function IntegrationStatusBadge({ status }) {
  const styles = {
    CONNECTED: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500 animate-pulse',
      label: 'Connected',
    },
    ERROR: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      label: 'Connection Error',
    },
    NOT_CONFIGURED: {
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
      label: 'Not Configured',
    },
    DISABLED: {
      bg: 'bg-slate-100 text-slate-500 border-slate-200',
      dot: 'bg-slate-400',
      label: 'Disabled',
    },
    TESTING: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500 animate-ping',
      label: 'Testing...',
    },
    NOT_TESTED: {
      bg: 'bg-emerald-50/60 text-[#173D30] border-emerald-200/60',
      dot: 'bg-[#173D30]',
      label: 'Configured',
    },
  };

  const current = styles[status] || styles.NOT_CONFIGURED;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${current.bg}`}
    >
      <span className={`size-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
}

export function IntegrationCard({
  row,
  label,
  category,
  description,
  status,
  isTesting,
  testedAt,
  errorMessage,
  successMessage,
  onConfigure,
  onTest,
  onToggleStatus,
  onDisconnect,
  isFeaturedAi = false,
}) {
  return (
    <article
      className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isFeaturedAi
          ? 'border-emerald-200/80 bg-gradient-to-b from-emerald-50/20 via-white to-white hover:border-emerald-400'
          : 'border-slate-200/90 hover:border-emerald-300'
      }`}
    >
      {/* Top Header: Logo, Name, Category & Actions */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50/80 shadow-2xs group-hover:bg-white group-hover:shadow-xs transition-all">
              <ProviderLogo provider={row.provider} size={28} />
              {isFeaturedAi && (
                <span className="absolute -top-1.5 -right-1.5 flex size-4.5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xs">
                  <Sparkles className="size-2.5" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-[#172033] group-hover:text-emerald-900 transition-colors">
                {label}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-block text-[11px] font-medium text-[#718096]">
                  {category}
                </span>
                {row.environment && (
                  <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                    {row.environment}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <IntegrationStatusBadge status={isTesting ? 'TESTING' : status} />
            <AdminRowActions
              record={row}
              recordName={label}
              disabled={isTesting}
              actions={[
                {
                  label: 'View Details',
                  onClick: () => onConfigure(row, 'view'),
                },
                {
                  label: 'Configure',
                  onClick: () => onConfigure(row, 'edit'),
                },
                {
                  label: 'Test Connection',
                  onClick: () => onTest(row),
                },
                ...(status !== 'NOT_CONFIGURED'
                  ? [
                      {
                        label: 'Disconnect',
                        variant: 'destructive',
                        confirm: false,
                        onClick: () => onDisconnect(row),
                      },
                    ]
                  : []),
              ]}
              onToggleStatus={row.configured ? () => onToggleStatus(row) : undefined}
              statusLabel={row.isEnabled ? 'Disable' : 'Enable'}
            />
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-xs leading-relaxed text-[#718096] line-clamp-2">
          {description}
        </p>
      </div>

      {/* Middle Status / Metadata Banner */}
      <div className="mt-4 space-y-2">
        {/* Error notification banner */}
        {errorMessage && status === 'ERROR' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 rounded-lg bg-rose-50/90 border border-rose-200/80 px-2.5 py-1.5 text-xs text-rose-700 cursor-help">
                  <AlertCircle className="size-3.5 shrink-0 text-rose-500" />
                  <span className="truncate flex-1 font-medium">{errorMessage}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                {errorMessage}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Success message banner */}
        {successMessage && !errorMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="truncate font-medium">{successMessage}</span>
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center justify-between text-[11px] text-[#718096] pt-1">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 text-slate-400" />
            <span>Last tested:</span>
          </span>
          <span className="font-medium text-slate-700">{testedAt || 'Never'}</span>
        </div>
      </div>

      {/* Card Actions */}
      <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          onClick={() => onConfigure(row)}
          className="h-9 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-emerald-50/60 hover:text-emerald-800 hover:border-emerald-300 transition-colors"
        >
          Configure
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isTesting}
          onClick={() => onTest(row)}
          className="h-9 text-xs font-semibold bg-emerald-50/40 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:text-emerald-900 transition-colors disabled:opacity-60"
        >
          {isTesting ? (
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className="size-3.5 animate-spin" />
              <span>Testing...</span>
            </span>
          ) : (
            'Test Connection'
          )}
        </Button>
      </div>
    </article>
  );
}
