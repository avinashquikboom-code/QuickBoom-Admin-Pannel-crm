'use client';

import { Settings2, PlugZap } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/ui/button';
import { IntegrationStatusBadge } from './integration-status-badge';
import { INTEGRATION_STATUS } from '@/config/integrations';

export function IntegrationCard({ provider, icon: Icon, state, onConfigure, onTest }) {
  const status = state?.status ?? INTEGRATION_STATUS.NOT_CONFIGURED;
  const lastTested = state?.lastTestedAt ? new Date(state.lastTestedAt).toLocaleString() : '—';
  const meta = (provider.displayKeys || [])
    .map((key) => {
      const val = state?.values?.[key];
      if (!val || (provider.fields.find((f) => f.key === key)?.secret)) return null;
      return { key, val };
    })
    .filter(Boolean);

  return (
    <Card className="flex h-full flex-col border-slate-200/90 bg-white shadow-xs transition-shadow hover:shadow-sm">
      <CardHeader className="space-y-3 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-light text-brand">
              <Icon className="size-5" strokeWidth={2} aria-hidden />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{provider.name}</h3>
              <p className="text-[11px] text-slate-500">{provider.category}</p>
            </div>
          </div>
          <IntegrationStatusBadge status={status} />
        </div>
        <p className="text-xs leading-relaxed text-slate-600">{provider.description}</p>
      </CardHeader>
      <CardContent className="mt-auto flex flex-1 flex-col gap-4 pt-0">
        <dl className="space-y-1 text-[11px] text-slate-500">
          {meta.length > 0 ? (
            meta.map(({ key, val }) => (
              <div key={key} className="flex gap-2">
                <dt className="shrink-0 font-medium capitalize text-slate-600">{key}:</dt>
                <dd className="truncate text-slate-800">{val}</dd>
              </div>
            ))
          ) : (
            <p>No summary until configured.</p>
          )}
          <p>
            <span className="font-medium text-slate-600">Last tested:</span> {lastTested}
          </p>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="h-8 flex-1 bg-brand text-primary-foreground text-xs hover:bg-primary-hover sm:flex-none"
            onClick={() => onConfigure(provider.id)}
          >
            <Settings2 className="size-3.5" aria-hidden />
            Configure
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 flex-1 text-xs sm:flex-none"
            disabled={status === INTEGRATION_STATUS.NOT_CONFIGURED || status === INTEGRATION_STATUS.TESTING}
            onClick={() => onTest?.(provider.id)}
          >
            <PlugZap className="size-3.5" aria-hidden />
            Test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
