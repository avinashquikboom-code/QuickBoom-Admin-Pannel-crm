'use client';

import { cn } from '@/lib/utils';
import { INTEGRATION_STATUS } from '@/config/integrations';

const LABELS = {
  [INTEGRATION_STATUS.NOT_CONFIGURED]: 'Not Configured',
  [INTEGRATION_STATUS.CONFIGURED]: 'Configured',
  [INTEGRATION_STATUS.CONNECTED]: 'Connected',
  [INTEGRATION_STATUS.CONNECTION_FAILED]: 'Connection Failed',
  [INTEGRATION_STATUS.TESTING]: 'Testing…',
};

const STYLES = {
  [INTEGRATION_STATUS.NOT_CONFIGURED]: 'bg-slate-100 text-slate-600 border-slate-200',
  [INTEGRATION_STATUS.CONFIGURED]: 'bg-brand-light text-brand-dark border-brand/25',
  [INTEGRATION_STATUS.CONNECTED]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  [INTEGRATION_STATUS.CONNECTION_FAILED]: 'bg-rose-50 text-rose-700 border-rose-200',
  [INTEGRATION_STATUS.TESTING]: 'bg-amber-50 text-amber-800 border-amber-200',
};

export function IntegrationStatusBadge({ status, className }) {
  const key = status && STYLES[status] ? status : INTEGRATION_STATUS.NOT_CONFIGURED;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        STYLES[key],
        className,
      )}
    >
      {LABELS[key]}
    </span>
  );
}
