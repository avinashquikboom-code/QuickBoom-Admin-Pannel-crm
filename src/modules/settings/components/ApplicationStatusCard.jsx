'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faServer } from '@fortawesome/free-solid-svg-icons';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';

export function ApplicationStatusCard({ statusData, configVersion }) {
  const status = statusData?.status || 'HEALTHY';
  const version = statusData?.version || configVersion || '1.0.0';
  const environment = statusData?.environment || 'PRODUCTION';
  const lastUpdated = statusData?.lastUpdated;
  const lastSyncedAt = statusData?.lastSyncedAt;

  const formatDate = (dateString) => {
    if (!dateString) return 'System Initialized';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateString);
    }
  };

  return (
    <Card className="border border-[#E2E8E5] bg-white p-4 sm:p-5 shadow-xs rounded-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faServer} className="text-[#163A2E] size-3.5" />
          Application Status
        </h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
          <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
          {status}
        </span>
      </div>

      <div className="space-y-3 text-xs sm:text-sm">
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500">System Version</span>
          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
            v{version}
          </span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500">Environment</span>
          <Badge className="bg-[#163A2E] text-white text-[10px] font-semibold uppercase">
            {environment}
          </Badge>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500">Last Updated</span>
          <span className="font-semibold text-slate-800 text-xs text-right truncate max-w-[170px]" title={formatDate(lastUpdated)}>
            {formatDate(lastUpdated)}
          </span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-slate-500">Last Synced</span>
          <span className="font-semibold text-slate-800 text-xs text-right truncate max-w-[170px]" title={formatDate(lastSyncedAt)}>
            {lastSyncedAt ? formatDate(lastSyncedAt) : 'Just now'}
          </span>
        </div>
      </div>
    </Card>
  );
}
