'use client';

import * as React from 'react';
import api from '../../../lib/api';
import { rowsOf, pageOf, summaryOf, billingError } from '@/modules/customer/billing-api';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiGrid } from '@/components/common/KpiCard';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faLayerGroup, faCircleCheck, faCirclePause, faUsers, faCheck, faPlus, faDownload } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';

const initialForm = { name: '', code: '', description: '', monthlyPrice: '', yearlyPrice: '', userLimit: '', leadLimit: '', storageLimitBytes: '', features: '' };
const control = 'h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700';
const money = (amount) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(Number(amount));
const date = (value) => value ? new Date(value).toLocaleDateString() : '—';
const featuresOf = (plan) => Array.isArray(plan.features) ? plan.features.filter((feature) => typeof feature === 'string') : [];
const csvCell = (value) => `"${String(value ?? '').replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""')}"`;

export function SubscriptionPlans() {
  const [search, setSearch] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [sort, setSort] = React.useState('name');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(12);
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [revision, setRevision] = React.useState(0);
  const [form, setForm] = React.useState(null);
  const [editing, setEditing] = React.useState(null);
  const [detail, setDetail] = React.useState(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { const timer = setTimeout(() => { setPage(1); setQuery(search); }, 300); return () => clearTimeout(timer); }, [search]);
  React.useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api.get('/admin/plans', { params: { management: true, search: query, status, sort, page, limit } }).then((payload) => {
      if (!active) return;
      const meta = pageOf(payload);
      if (page > 1 && meta.total != null && (page - 1) * limit >= meta.total) { setPage(Math.max(1, Math.ceil(meta.total / limit))); return; }
      setResult({ rows: rowsOf(payload), meta, summary: summaryOf(payload) });
    }).catch((err) => { if (active) { setResult(null); setError(billingError(err)); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, status, sort, page, limit, revision]);
  const refresh = () => setRevision((n) => n + 1);
  const updateField = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const openForm = (plan) => {
    setEditing(plan || null);
    setForm(plan ? { ...initialForm, ...plan, features: featuresOf(plan).join('\n') } : { ...initialForm });
  };
  const save = async () => {
    if (!form.name.trim() || !form.code.trim()) { toast.error('Plan name and code are required.'); return; }
    for (const key of ['monthlyPrice', 'yearlyPrice', 'userLimit', 'leadLimit', 'storageLimitBytes']) {
      if (form[key] === '' || !Number.isFinite(Number(form[key])) || Number(form[key]) < 0 || (['userLimit', 'leadLimit', 'storageLimitBytes'].includes(key) && (!Number.isSafeInteger(Number(form[key])) || Number(form[key]) < 1))) { toast.error('Enter valid prices and positive whole-number limits.'); return; }
    }
    const payload = { name: form.name.trim(), code: form.code.trim(), description: form.description.trim(), monthlyPrice: Number(form.monthlyPrice), yearlyPrice: Number(form.yearlyPrice), userLimit: Number(form.userLimit), leadLimit: Number(form.leadLimit), storageLimitBytes: Number(form.storageLimitBytes), features: form.features.split('\n').map((x) => x.trim()).filter(Boolean) };
    setBusy(true);
    try { if (editing) await api.patch(`/admin/plans/${editing.id}`, payload); else await api.post('/admin/plans', payload); setForm(null); toast.success(editing ? 'Plan updated' : 'Plan created'); refresh(); } catch (err) { toast.error(billingError(err)); } finally { setBusy(false); }
  };
  const view = async (plan) => {
    setDetail(plan); setDetailLoading(true);
    if (plan.deletedAt) { setDetailLoading(false); return; }
    try { const payload = await api.get(`/admin/plans/${plan.id}`); setDetail((current) => current?.id === plan.id ? { ...current, ...(payload?.data && !Array.isArray(payload.data) ? payload.data : payload) } : current); } catch (err) { toast.error(billingError(err)); setDetail(null); } finally { setDetailLoading(false); }
  };
  const toggle = async (plan) => { setBusy(true); try { await api.patch(`/admin/plans/${plan.id}/status`, { isActive: !plan.isActive }); toast.success('Plan status updated'); refresh(); } catch (err) { toast.error(billingError(err)); } finally { setBusy(false); } };
  const remove = async () => { setBusy(true); try { await api.delete(`/admin/plans/${deleting.id}`); setDeleting(null); toast.success('Plan archived'); refresh(); } catch (err) { toast.error(billingError(err)); } finally { setBusy(false); } };
  const exportCsv = async () => {
    setBusy(true);
    try {
      let all = []; let current = 1; let total = 0;
      do { const response = await api.get('/admin/plans', { params: { management: true, search: query, status, sort, page: current, limit: 100 } }); const rows = rowsOf(response); all = all.concat(rows); total = pageOf(response).total ?? all.length; if (!rows.length) break; current++; } while (all.length < total);
      const lines = [['Name', 'Code', 'Description', 'Status', 'Subscribers', 'Seat capacity', 'Monthly price', 'Yearly price', 'Lead limit', 'Storage bytes', 'Features', 'Created'], ...all.map((p) => [p.name, p.code, p.description, p.deletedAt ? 'Archived' : p.isActive ? 'Active' : 'Inactive', p.subscriberCount, p.userLimit, p.monthlyPrice, p.yearlyPrice, p.leadLimit, p.storageLimitBytes, featuresOf(p).join('; '), p.createdAt])].map((row) => row.map(csvCell).join(','));
      const url = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'subscription-plans.csv'; link.click(); URL.revokeObjectURL(url);
    } catch (err) { toast.error(billingError(err)); } finally { setBusy(false); }
  };
  const rows = result?.rows || []; const meta = result?.meta || {}; const summary = result?.summary || {}; const pages = Math.max(1, Math.ceil((meta.total || 0) / limit));
  return <div className="min-w-0 space-y-5">
    <PageHeader category="Master Management → Subscription Plans" title="Subscription Plans" description="Manage enterprise tier quotas, feature gates, seat licenses and billing cycles." actions={<div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy || !result} onClick={exportCsv}><FontAwesomeIcon icon={faDownload} /> Export CSV</Button><Button disabled={busy || !result} onClick={() => openForm(null)}><FontAwesomeIcon icon={faPlus} /> Add Subscription Plan</Button></div>} />
    <KpiGrid cards={[{ title: 'Total Subscription Plans', value: summary.totalPlans ?? '—', icon: faLayerGroup }, { title: 'Active Subscription Plans', value: summary.activePlans ?? '—', icon: faCircleCheck }, { title: 'Inactive Plans', value: summary.inactivePlans ?? '—', icon: faCirclePause }, { title: 'Total Subscribers', value: summary.subscribers ?? '—', icon: faUsers }]} />
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3">
      <Input aria-label="Search plans" placeholder="Search name, code or description" className="min-w-0 flex-1 basis-48" value={search} onChange={(e) => setSearch(e.target.value)} />
      <select aria-label="Filter by status" className={control} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>{['all', 'active', 'inactive', 'archived'].map((v) => <option key={v} value={v}>{v[0].toUpperCase() + v.slice(1)}</option>)}</select>
      <select aria-label="Sort plans" className={control} value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}><option value="name">Plan name</option><option value="subscribers">Subscriber count</option><option value="seats">Seat capacity</option><option value="created">Created date</option></select>
    </div>
    {error ? <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-700"><p>{error}</p><Button variant="outline" className="mt-3" onClick={refresh}>Retry</Button></div> : loading ? <div aria-label="Loading plans" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1,2,3].map((i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-100" />)}</div> : rows.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">{query || status !== 'all' ? 'No plans match your filters.' : 'No subscription plans found.'}</div> : <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((plan) => <article key={plan.id} className="flex min-w-0 flex-col rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-sm">
      <div className="flex min-w-0 items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F1EC] text-[#163A2E]"><FontAwesomeIcon icon={faLayerGroup} /></div><div className="min-w-0 flex-1"><h2 className="break-words text-base font-bold text-slate-900">{plan.name}</h2><p className="break-all text-xs text-slate-500">{plan.code}</p></div><span className="shrink-0 rounded-full bg-[#E8F1EC] px-2 py-1 text-xs font-medium text-[#163A2E]">{plan.deletedAt ? 'Archived' : plan.isActive ? 'Active' : 'Inactive'}</span></div>
      <p className="mt-4 min-h-10 break-words text-sm text-slate-500">{plan.description || 'No description provided.'}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3"><div><p className="text-xs text-slate-500">Subscribers</p><p className="mt-1 font-semibold">{plan.subscriberCount}</p></div><div><p className="text-xs text-slate-500">Seat capacity</p><p className="mt-1 font-semibold">{plan.userLimit}</p></div></div>
      <div className="mt-4 flex-1"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Included features</p><div className="mt-2 flex flex-wrap gap-1.5">{featuresOf(plan).slice(0, 4).map((feature, i) => <span key={i} className="max-w-full break-words rounded-lg bg-[#E8F1EC] px-2 py-1 text-xs text-[#163A2E]"><FontAwesomeIcon icon={faCheck} className="mr-1" />{feature}</span>)}{!featuresOf(plan).length && <span className="text-xs text-slate-400">No features configured</span>}</div>{featuresOf(plan).length > 4 && <button type="button" onClick={() => view(plan)} className="mt-2 text-xs font-semibold text-[#163A2E] underline">View all features</button>}</div>
      <div className="mt-5 border-t border-slate-100 pt-4"><p className="text-lg font-bold text-[#163A2E]">{money(plan.monthlyPrice)} <span className="text-xs font-normal text-slate-500">/ month</span></p><p className="text-xs text-slate-500">{money(plan.yearlyPrice)} / year</p></div>
      <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => view(plan)}>View Details</Button>{!plan.deletedAt && <><Button size="sm" variant="outline" onClick={() => openForm(plan)}>Edit</Button><details className="relative"><summary className="flex h-8 cursor-pointer list-none items-center rounded-md border border-slate-200 px-3 text-xs font-medium">More</summary><div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"><button disabled={busy} className="block w-full rounded p-2 text-left text-xs hover:bg-slate-50" onClick={() => toggle(plan)}>{plan.isActive ? 'Deactivate' : 'Activate'}</button><button disabled={busy} className="block w-full rounded p-2 text-left text-xs text-rose-700 hover:bg-rose-50" onClick={() => setDeleting(plan)}>Delete</button></div></details></>}</div>
    </article>)}</div>}
    {!error && !loading && <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500"><span>{meta.total ?? 0} plans · Page {page} of {pages}</span><div className="flex items-center gap-2"><label htmlFor="plan-limit">Per page</label><select id="plan-limit" className={control} value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>{[12, 24, 50, 100].map((n) => <option key={n}>{n}</option>)}</select><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button></div></div>}
    <FormDrawer open={!!form} onOpenChange={(open) => { if (!open && !busy) setForm(null); }} title={editing ? 'Edit Subscription Plan' : 'Add Subscription Plan'} description="Configure billing, limits and included features." onSubmit={save} loading={busy} size="md">{form && <div className="space-y-5">{[['Basic information', [['name','Plan name'],['code','Plan code']]], ['Billing configuration', [['monthlyPrice','Monthly price'],['yearlyPrice','Yearly price']]], ['Quotas and limits', [['userLimit','Seat capacity'],['leadLimit','Lead limit'],['storageLimitBytes','Storage limit (bytes)']]]].map(([section, fields]) => <section key={section}><h3 className="mb-3 text-sm font-semibold text-[#163A2E]">{section}</h3><div className="grid gap-3 sm:grid-cols-2">{fields.map(([key,label]) => <label key={key} className="space-y-1 text-xs font-medium">{label}<Input required type={['monthlyPrice','yearlyPrice','userLimit','leadLimit','storageLimitBytes'].includes(key) ? 'number' : 'text'} min={['monthlyPrice','yearlyPrice'].includes(key) ? '0' : '1'} step={['monthlyPrice','yearlyPrice'].includes(key) ? 'any' : '1'} value={form[key]} onChange={(e) => updateField(key,e.target.value)} /></label>)}</div>{section === 'Basic information' && <label className="mt-3 block space-y-1 text-xs font-medium">Description<Textarea value={form.description} onChange={(e) => updateField('description',e.target.value)} /></label>}</section>)}<section><h3 className="mb-2 text-sm font-semibold text-[#163A2E]">Included features</h3><label className="space-y-1 text-xs font-medium">One feature per line<Textarea rows={6} value={form.features} onChange={(e) => updateField('features',e.target.value)} /></label></section></div>}</FormDrawer>
    <FormDrawer open={!!detail} onOpenChange={(open) => { if (!open) setDetail(null); }} title="Subscription Plan Details" showFooter={false} size="md">{detailLoading ? <p>Loading plan details…</p> : detail && <div className="space-y-5"><div><h3 className="break-words text-lg font-bold">{detail.name}</h3><p className="text-slate-500">{detail.code} · {detail.deletedAt ? 'Archived' : detail.isActive ? 'Active' : 'Inactive'}</p><p className="mt-2 break-words">{detail.description || 'No description provided.'}</p></div><dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">{[['Monthly price', money(detail.monthlyPrice)], ['Yearly price', money(detail.yearlyPrice)], ['Seat capacity', detail.userLimit], ['Subscribers', detail.subscriberCount], ['Lead limit', detail.leadLimit], ['Storage limit', `${detail.storageLimitBytes} bytes`], ['Created', date(detail.createdAt)], ['Updated', date(detail.updatedAt)]].map(([label,value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><dt className="text-slate-500">{label}</dt><dd className="mt-1 break-words font-semibold">{value ?? '—'}</dd></div>)}</dl><div><h4 className="font-semibold">Included features</h4><ul className="mt-2 space-y-1">{featuresOf(detail).map((f,i) => <li key={i} className="break-words">✓ {f}</li>)}</ul></div></div>}</FormDrawer>
    <ConfirmDialog open={!!deleting} onOpenChange={(open) => { if (!open && !busy) setDeleting(null); }} title={`Delete ${deleting?.name || 'plan'}?`} description="The plan will be archived. Plans with active subscribers cannot be deleted." confirmLabel="Delete" variant="destructive" loading={busy} closeOnConfirm={false} onConfirm={remove} />
  </div>;
}
