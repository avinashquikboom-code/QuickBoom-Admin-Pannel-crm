'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faClockRotateLeft,
  faLayerGroup,
  faDatabase,
  faServer,
} from '@fortawesome/free-solid-svg-icons';

export function DataSummaryCards({ overview }) {
  const lastBackupStr = overview?.lastBackup
    ? new Date(overview.lastBackup).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'No backup yet';

  const totalRecords = Number(overview?.tenantRecords || 0).toLocaleString();
  const dbSize = overview?.databaseSize || '0 MB';
  const health = overview?.health || 'HEALTHY';

  const stats = [
    {
      label: 'Last Backup',
      value: lastBackupStr,
      subtext: 'Checksum-verified snapshot',
      icon: faClockRotateLeft,
    },
    {
      label: 'Total Data',
      value: `${totalRecords} records`,
      subtext: 'Tenant database records',
      icon: faLayerGroup,
    },
    {
      label: 'Database Size',
      value: dbSize,
      subtext: 'PostgreSQL storage volume',
      icon: faDatabase,
    },
    {
      label: 'Database Health',
      value: health,
      subtext: 'Operational & synchronized',
      icon: faServer,
      isHealth: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 min-[440px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs flex items-start justify-between gap-3 min-w-0"
        >
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block truncate">
              {stat.label}
            </span>
            <div className="flex items-center gap-2">
              {stat.isHealth && (
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              )}
              <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                {stat.value}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 truncate">{stat.subtext}</p>
          </div>

          <div className="size-10 rounded-xl bg-[#E8F1EC] text-[#163A2E] flex items-center justify-center shrink-0 border border-emerald-100">
            <FontAwesomeIcon icon={stat.icon} className="size-4.5" />
          </div>
        </div>
      ))}
    </div>
  );
}
