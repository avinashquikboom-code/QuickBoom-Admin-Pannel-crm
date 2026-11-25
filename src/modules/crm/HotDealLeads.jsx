'use client';

import * as React from 'react';
import Link from 'next/link';
import { crmError, listLeadPage, loadLeadStages, personName } from './crm-api';
import { HotDealIndicator } from './HotDealIndicator';

export function HotDealLeads() {
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState({ rows: [], pagination: {} });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const refresh = React.useCallback(async (signal) => {
    try {
      const stages = await loadLeadStages();
      const stage = stages.find((item) => String(item.key).toUpperCase() === 'HOT_DEAL' && item.isActive !== false && !item.deletedAt);
      if (!stage) throw new Error('The Hot Deal stage is not available.');
      const result = await listLeadPage({ stageId: stage.id, search: search || undefined, page, limit: 20 });
      if (signal.cancelled) return;
      setData(result); setError('');
    } catch (err) {
      if (!signal.cancelled) { setError(crmError(err)); setData({ rows: [], pagination: {} }); }
    } finally { if (!signal.cancelled) setLoading(false); }
  }, [search, page]);
  React.useEffect(() => {
    const signal = { cancelled: false };
    setLoading(true);
    const initial = setTimeout(() => refresh(signal), 300);
    const interval = setInterval(() => { if (document.visibilityState === 'visible') refresh(signal); }, 30000);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(signal); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { signal.cancelled = true; clearTimeout(initial); clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, [refresh]);
  const totalPages = Number(data.pagination?.totalPages || 1);
  return <section className="rounded-xl border bg-white p-4 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-slate-900">Hot Deal leads ({data.pagination?.total ?? 0})</h2>
      <input aria-label="Search Hot Deal leads" className="rounded-md border px-3 py-2 text-sm" placeholder="Search leads" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div>
    {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : loading ? <p className="text-sm text-slate-500">Loading leads…</p> : data.rows.length === 0 ? <p className="text-sm text-slate-500">No Hot Deal leads found.</p> :
      <ul className="divide-y">{data.rows.map((lead) => <li key={lead.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-2"><Link href={`/admin/crm/leads?leadId=${encodeURIComponent(lead.id)}`} className="font-semibold text-slate-900 hover:underline">{lead.companyName || personName(lead)}</Link><HotDealIndicator lead={lead} /></div>
        <span className="text-slate-500">{lead.phone || '—'} · {personName(lead.assignedTo || lead.employee)}</span>
      </li>)}</ul>}
    <div className="flex items-center justify-end gap-3 text-sm"><button disabled={page <= 1} onClick={() => setPage((v) => v - 1)} className="disabled:opacity-40">Previous</button><span>Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage((v) => v + 1)} className="disabled:opacity-40">Next</button></div>
  </section>;
}
