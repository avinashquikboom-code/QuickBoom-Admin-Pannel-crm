'use client';

import * as React from 'react';
import api from '../../../../../lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { crmError } from '@/modules/crm/crm-api';

export default function ProposalHistoryPage() {
  const [rows, setRows] = React.useState([]);
  const [meta, setMeta] = React.useState({ page: 1, total: 0, limit: 20 });
  const [filters, setFilters] = React.useState({ search: '', type: '', status: '', startDate: '', endDate: '' });
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [openRow, setOpenRow] = React.useState(null);
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get('/admin/leads/plan-proposals', { params: { ...filters, page, limit: 20 } }).then((result) => {
      if (!active) return;
      const body = result?.data && !Array.isArray(result.data) && result.data.data ? result.data : result;
      setRows(Array.isArray(body?.data) ? body.data : []);
      setMeta(body?.meta || { page, total: 0, limit: 20 });
    }).catch((err) => { if (active) setError(crmError(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, page]);
  const update = (field, value) => { setPage(1); setFilters((old) => ({ ...old, [field]: value })); };
  const pdf = async (row) => {
    try {
      const blob = await api.get(`/admin/leads/${row.leadId}/plan-proposals/${row.id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `proposal-${row.leadId}-${row.version}.pdf`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) { setError(crmError(err)); }
  };
  return <div className="space-y-5">
    <PageHeader title="Proposal history" description="Saved proposal versions and current delivery results." />
    <div className="grid gap-2 md:grid-cols-5">
      <Input aria-label="Search proposals" placeholder="Search lead or plan" value={filters.search} onChange={(e) => update('search', e.target.value)} />
      <select aria-label="Proposal type" className="rounded-md border p-2" value={filters.type} onChange={(e) => update('type', e.target.value)}><option value="">All types</option><option value="DEFAULT">Standard</option><option value="CUSTOM">Custom</option></select>
      <select aria-label="Proposal status" className="rounded-md border p-2" value={filters.status} onChange={(e) => update('status', e.target.value)}><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="SENT">Sent</option><option value="PARTIAL">Partial</option><option value="FAILED">Failed</option></select>
      <Input aria-label="Start date" type="date" value={filters.startDate} onChange={(e) => update('startDate', e.target.value)} />
      <Input aria-label="End date" type="date" value={filters.endDate} onChange={(e) => update('endDate', e.target.value)} />
    </div>
    {error && <div role="alert" className="text-red-700">{error}</div>}
    {loading ? <p>Loading proposals…</p> : !rows.length ? <p>No proposals found.</p> : <div className="space-y-3">{rows.map((row) => <section className="rounded-xl border bg-white p-4" key={row.id}>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{row.planName || 'Proposal'} · v{row.version}</h2><p className="text-sm text-slate-600">{row.lead?.companyName || [row.lead?.firstName, row.lead?.lastName].filter(Boolean).join(' ')} · Lead #{row.leadId} · {row.proposalType}</p></div><span>{row.status}</span></div>
      <p className="mt-2 text-sm">Amount: {row.planPrice == null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(row.planPrice)} · Created: {new Date(row.createdAt).toLocaleDateString()} · By: {[row.createdBy?.firstName, row.createdBy?.lastName].filter(Boolean).join(' ') || '—'}</p>
      <p className="mt-1 text-sm">Email: {row.emailStatus} · WhatsApp: {row.whatsappStatus}</p>
      <div className="mt-3 flex flex-wrap gap-2"><Button type="button" onClick={() => setOpenRow(openRow === row.id ? null : row.id)}>Details</Button><Button type="button" onClick={() => pdf(row)}>Download PDF</Button></div>
      {openRow === row.id && <div className="mt-3 text-sm"><p>Requirements: {row.customerRequirements || '—'}</p><p>Email error: {row.emailError || '—'}</p><p>WhatsApp error: {row.whatsappError || '—'}</p><p>Retries: {row.retryCount}</p><p>Sent: {row.sentAt ? new Date(row.sentAt).toLocaleString() : '—'}</p></div>}
    </section>)}</div>}
    <div className="flex items-center gap-3"><Button type="button" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page} · {meta.total} proposals</span><Button type="button" disabled={loading || page * meta.limit >= meta.total} onClick={() => setPage(page + 1)}>Next</Button></div>
  </div>;
}
