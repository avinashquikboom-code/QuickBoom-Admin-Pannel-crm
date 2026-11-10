'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataTable, DataTableColumnHeader } from '@/components/data-table';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faDownload, faPlus, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { HrmNotice, HrmStats } from '@/modules/hrm/HrmNotice';
import {
  archiveAnnouncement,
  createAnnouncement,
  hrmError,
  loadAnnouncement,
  loadAnnouncements,
  publishAnnouncement,
  removeAnnouncement,
  scheduleAnnouncement,
  updateAnnouncement,
} from '@/modules/hrm/hrm-api';
import { downloadCsv, loadDepartments } from '@/modules/master/master-api';

const STATUSES = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'];
const AUDIENCES = ['ALL', 'DEPARTMENT', 'EMPLOYEES'];
const emptyForm = { title: '', description: '', category: 'GENERAL', audience: 'ALL', departmentId: '', publishAt: '', expiresAt: '' };

export default function AnnouncementsPage() {
  const [rows, setRows] = React.useState([]);
  const [summary, setSummary] = React.useState({});
  const [pagination, setPagination] = React.useState({ page: 1, totalPages: 1 });
  const [departments, setDepartments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [departmentId, setDepartmentId] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [refresh, setRefresh] = React.useState(0);
  const [form, setForm] = React.useState(emptyForm);
  const [editing, setEditing] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const [detail, setDetail] = React.useState(null);
  const [pendingDelete, setPendingDelete] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const debouncedSearch = useDebounced(search);

  React.useEffect(() => { setPage(1); }, [debouncedSearch, status, audience, departmentId, dateFrom, dateTo]);
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    loadAnnouncements({
      page, limit: 20, search: debouncedSearch || undefined, status: status || undefined, audience: audience || undefined,
      departmentId: departmentId || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined,
    }).then(async (result) => {
      const departmentRows = await loadDepartments().catch(() => []);
      if (!active) return;
      setRows(result.rows);
      setSummary(result.summary || {});
      setPagination(result.pagination || {});
      setDepartments(departmentRows);
      setError('');
    }).catch((err) => { if (active) setError(hrmError(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [audience, dateFrom, dateTo, debouncedSearch, departmentId, page, refresh, status]);

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const values = { ...form, departmentId: form.departmentId ? Number(form.departmentId) : undefined, publishAt: form.publishAt || undefined, expiresAt: form.expiresAt || undefined };
    try {
      if (editing) await updateAnnouncement(editing.id, values);
      else await createAnnouncement(values);
      toast.success(editing ? 'Announcement updated' : 'Announcement created');
      setOpen(false);
      setRefresh((value) => value + 1);
    } catch (err) { toast.error(hrmError(err)); } finally { setSaving(false); }
  };

  const run = async (action, id, success) => {
    try { await action(id); toast.success(success); setRefresh((value) => value + 1); }
    catch (err) { toast.error(hrmError(err)); }
  };

  const columns = React.useMemo(() => [
    { accessorKey: 'title', header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />, cell: ({ row }) => <div><p className="font-semibold text-slate-900">{row.original.title}</p><p className="line-clamp-1 text-[11px] text-slate-500">{row.original.description}</p></div> },
    { accessorKey: 'category', header: ({ column }) => <DataTableColumnHeader column={column} title="Category" /> },
    { accessorKey: 'audience', header: ({ column }) => <DataTableColumnHeader column={column} title="Audience" /> },
    { accessorKey: 'departmentName', header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />, cell: ({ row }) => row.original.departmentName || '—' },
    { accessorKey: 'publishAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Published" />, cell: ({ row }) => dateLabel(row.original.publishAt) },
    { accessorKey: 'expiresAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Expiry" />, cell: ({ row }) => dateLabel(row.original.expiresAt) },
    { accessorKey: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title="Status" /> },
    { id: 'actions', cell: ({ row }) => <Actions row={row.original} onView={async (item) => setDetail(await loadAnnouncement(item.id).catch((err) => { toast.error(hrmError(err)); return item; }))} onEdit={(item) => { setEditing(item); setForm(formFrom(item)); setOpen(true); }} onPublish={(item) => run(publishAnnouncement, item.id, 'Announcement published')} onSchedule={(item) => { const value = window.prompt('Schedule date and time (YYYY-MM-DDTHH:mm)'); if (value) run((id) => scheduleAnnouncement(id, new Date(value).toISOString()), item.id, 'Announcement scheduled'); }} onArchive={(item) => run(archiveAnnouncement, item.id, 'Announcement archived')} onDelete={setPendingDelete} /> },
  ], []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 overflow-x-hidden">
      <PageHeader title="Announcements" description="Create, manage and distribute company announcements." actions={<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><Button type="button" variant="outline" className="h-9 text-xs" onClick={() => setRefresh((value) => value + 1)}><FontAwesomeIcon icon={faRotateRight} className="size-3.5" /> Refresh</Button><Button type="button" variant="outline" className="h-9 text-xs" onClick={() => rows.length ? downloadCsv('announcements.csv', rows.map((row) => ({ title: row.title, category: row.category, audience: row.audience, department: row.departmentName, publishAt: row.publishAt || '', expiresAt: row.expiresAt || '', status: row.status }))) : toast.error('There are no announcements to export')}><FontAwesomeIcon icon={faDownload} className="size-3.5" /> Export CSV</Button><Button type="button" className="h-9 bg-brand text-xs text-primary-foreground" onClick={() => { setEditing(null); setForm(emptyForm); setOpen(true); }}><FontAwesomeIcon icon={faPlus} className="size-3.5" /> Add announcement</Button></div>} />
      <HrmStats items={[{ label: 'Total announcements', value: summary.total ?? 0 }, { label: 'Published', value: summary.published ?? 0 }, { label: 'Scheduled', value: summary.scheduled ?? 0 }, { label: 'Drafts', value: summary.drafts ?? 0 }, { label: 'Archived', value: summary.archived ?? 0 }]} />
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search announcements" className="h-9 text-xs xl:col-span-2" />
        <Choice value={status} onChange={setStatus} placeholder="Status" options={STATUSES} />
        <Choice value={departmentId} onChange={setDepartmentId} placeholder="Department" options={departments.map((item) => ({ value: String(item.id), label: item.name }))} />
        <Choice value={audience} onChange={setAudience} placeholder="Audience" options={AUDIENCES} />
        <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-2"><Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-9 text-xs" /><Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-9 text-xs" /></div>
      </div>
      <HrmNotice loading={loading} error={error} onRetry={() => setRefresh((value) => value + 1)} empty={!loading && !error && rows.length === 0 ? 'No announcements match these filters.' : ''} />
      <div className="grid gap-3 md:hidden">{rows.map((row) => <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="font-semibold">{row.title}</p><p className="mt-1 text-xs text-slate-500">{row.category} · {row.audience} · {row.status}</p><p className="mt-1 text-xs text-slate-500">{row.departmentName || 'All departments'} · {dateLabel(row.publishAt)}</p></article>)}</div>
      {rows.length ? <div className="hidden md:block"><DataTable columns={columns} data={rows} hideSearch pageSize={20} emptyState="" /></div> : null}
      <div className="flex justify-end gap-2 text-xs"><Button type="button" variant="outline" className="h-9" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button type="button" variant="outline" className="h-9" disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage((value) => value + 1)}>Next</Button></div>
      <FormDrawer open={open} onOpenChange={setOpen} title={editing ? 'Edit announcement' : 'Add announcement'} description="Drafts stay unpublished until you publish or schedule them." submitLabel={editing ? 'Save changes' : 'Create draft'} loading={saving} onSubmit={save}>
        <div className="grid gap-3"><Label>Title</Label><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required className="h-9 text-xs" /><Label>Description</Label><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required /><Label>Category</Label><Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="h-9 text-xs" /><Label>Audience</Label><Choice value={form.audience} onChange={(value) => setForm({ ...form, audience: value })} placeholder="Audience" options={AUDIENCES} allowEmpty={false} /><Label>Department</Label><Choice value={form.departmentId} onChange={(value) => setForm({ ...form, departmentId: value })} placeholder="No department" options={departments.map((item) => ({ value: String(item.id), label: item.name }))} /><Label>Publish date</Label><Input type="datetime-local" value={form.publishAt} onChange={(event) => setForm({ ...form, publishAt: event.target.value })} className="h-9 text-xs" /><Label>Expiry date</Label><Input type="datetime-local" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} className="h-9 text-xs" /></div>
      </FormDrawer>
      <FormDrawer open={Boolean(detail)} onOpenChange={(next) => { if (!next) setDetail(null); }} showFooter={false} title={detail?.title || 'Announcement'} description={detail?.status || ''}>{detail ? <dl className="space-y-2 text-xs">{[['Category', detail.category], ['Audience', detail.audience], ['Department', detail.departmentName || '—'], ['Publish', dateLabel(detail.publishAt)], ['Expiry', dateLabel(detail.expiresAt)], ['Description', detail.description]].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-slate-500">{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}</dl> : null}</FormDrawer>
      <ConfirmDialog open={Boolean(pendingDelete)} onOpenChange={(next) => { if (!next) setPendingDelete(null); }} title="Delete announcement?" description={`Delete “${pendingDelete?.title || ''}”? Published announcements must be archived first.`} confirmLabel="Delete" variant="destructive" onConfirm={async () => { if (!pendingDelete) return; try { await removeAnnouncement(pendingDelete.id); toast.success('Announcement deleted'); setPendingDelete(null); setRefresh((value) => value + 1); } catch (err) { toast.error(hrmError(err)); } }} />
    </div>
  );
}

function Actions({ row, onView, onEdit, onPublish, onSchedule, onArchive, onDelete }) {
  return <div className="flex flex-wrap justify-end gap-1"><Button type="button" variant="ghost" className="h-8 px-2 text-xs" onClick={() => onView(row)}>View</Button><Button type="button" variant="ghost" className="h-8 px-2 text-xs" onClick={() => onEdit(row)}>Edit</Button>{row.status !== 'PUBLISHED' && row.status !== 'ARCHIVED' ? <Button type="button" variant="outline" className="h-8 px-2 text-xs" onClick={() => onPublish(row)}>Publish</Button> : null}{row.status !== 'ARCHIVED' ? <Button type="button" variant="outline" className="h-8 px-2 text-xs" onClick={() => onSchedule(row)}>Schedule</Button> : null}{row.status !== 'ARCHIVED' ? <Button type="button" variant="outline" className="h-8 px-2 text-xs" onClick={() => onArchive(row)}>Archive</Button> : null}{row.status !== 'PUBLISHED' ? <Button type="button" variant="outline" className="h-8 px-2 text-xs text-rose-600" onClick={() => onDelete(row)}>Delete</Button> : null}</div>;
}

function Choice({ value, onChange, placeholder, options, allowEmpty = true }) {
  return <Select value={value || (allowEmpty ? 'all' : options[0]?.value || options[0])} onValueChange={(next) => onChange(next === 'all' ? '' : next)}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{allowEmpty ? <SelectItem value="all">{placeholder}</SelectItem> : null}{options.map((option) => { const item = typeof option === 'string' ? { value: option, label: option } : option; return <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>; })}</SelectContent></Select>;
}

function formFrom(row) {
  return { title: row.title || '', description: row.description || '', category: row.category || 'GENERAL', audience: row.audience || 'ALL', departmentId: row.departmentId ? String(row.departmentId) : '', publishAt: localInput(row.publishAt), expiresAt: localInput(row.expiresAt) };
}
function localInput(value) { return value ? String(value).slice(0, 16) : ''; }
function dateLabel(value) { return value ? String(value).slice(0, 16).replace('T', ' ') : '—'; }
function useDebounced(value) { const [debounced, setDebounced] = React.useState(value); React.useEffect(() => { const timer = setTimeout(() => setDebounced(value), 300); return () => clearTimeout(timer); }, [value]); return debounced; }
