'use client';

import Link from 'next/link';
import { ArrowUpRight, Database } from 'lucide-react';

const format = (value) => value == null ? '—' : Number(value).toLocaleString('en-IN');

export function DataCaptureCard({ data, loading }) {
  const usage = data?.usage || {};
  const captured = usage.totalLeadsCaptured;
  const processed = usage.validatedCount;
  const pending = data?.pending;
  const rejected = data?.rejected;
  const values = [
    ['Total captured', captured],
    ['Processed', processed],
    ['Pending', pending],
    ['Rejected', rejected],
  ];
  const successRate = captured > 0 && processed != null ? Math.round((processed / captured) * 100) : null;

  return <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Database className="size-4" /></span><div><h2 className="font-bold text-slate-900">Data Capture</h2><p className="text-xs text-slate-500">Counts from captured record and usage APIs</p></div></div>
      <Link href="/admin/data-capture" className="inline-flex items-center gap-1 text-xs font-semibold text-brand">View all <ArrowUpRight className="size-3.5" /></Link>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {values.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{loading ? '…' : format(value)}</p></div>)}
    </div>
    <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-600"><span>Validation rate among captured records</span><strong>{successRate == null ? '—' : `${successRate}%`}</strong></div>
    {usage.totalExtractions != null && <p className="mt-2 text-[11px] text-slate-500">{format(usage.totalExtractions)} extraction jobs · source breakdown and dated trend are not provided by the usage API.</p>}
  </section>;
}

export function CampaignMetricsCard({ whatsappStats }) {
  const stats = whatsappStats?.data || whatsappStats || {};
  const hasWhatsAppCount = Number.isFinite(Number(stats.total));
  return <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
    <div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><ArrowUpRight className="size-4" /></span><div><h2 className="font-bold text-slate-900">Campaign Performance</h2><p className="text-xs text-slate-500">Only backend-supported totals are shown</p></div></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-slate-100 p-3"><p className="text-xs font-semibold text-slate-700">WhatsApp</p><p className="mt-2 text-xl font-bold text-slate-900">{hasWhatsAppCount ? Number(stats.total).toLocaleString('en-IN') : '—'}</p><p className="text-[11px] text-slate-500">Campaigns · sent, delivered, read, and failed recipient totals are not available in the stats API.</p></div>
      <div className="rounded-xl border border-slate-100 p-3"><p className="text-xs font-semibold text-slate-700">Email</p><p className="mt-2 text-sm font-semibold text-slate-700">Metrics unavailable</p><p className="text-[11px] text-slate-500">No email campaign analytics endpoint supplies sent, delivery, open, click, or unique recipient aggregates.</p></div>
    </div>
  </section>;
}

export function CampaignMetricsGap({ whatsappStats }) {
  return <CampaignMetricsCard whatsappStats={whatsappStats} />;
}
