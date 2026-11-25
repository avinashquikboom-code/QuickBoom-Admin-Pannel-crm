'use client';

import * as React from 'react';
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  FileText,
  FilterX,
  Megaphone,
  Plus,
  RefreshCw,
  Send,
  Archive,
  Trash2,
  ImagePlus,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TruncatedAnnouncementText } from '@/components/announcements/TruncatedAnnouncementText';
import { GlobalExport } from '@/components/export/GlobalExport';
import { HrmNotice } from '@/modules/hrm/HrmNotice';
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
  uploadAnnouncementImage,
} from '@/modules/hrm/hrm-api';
import { downloadCsv, loadDepartments } from '@/modules/master/master-api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const STATUSES = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'];
const CATEGORIES = ['GENERAL', 'HOLIDAY', 'POLICY', 'URGENT', 'EVENT'];
const AUDIENCES = ['ALL', 'DEPARTMENT', 'EMPLOYEES'];

const STATUS_BADGE = {
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SCHEDULED: 'bg-amber-50 text-amber-700 border-amber-200',
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  ARCHIVED: 'bg-zinc-100 text-zinc-500 border-zinc-200',
};

const CATEGORY_BADGE = {
  GENERAL: 'bg-[#E8F1EC] text-[#123D32] border-[#CDE2D6]',
  HOLIDAY: 'bg-purple-50 text-purple-700 border-purple-200',
  POLICY: 'bg-blue-50 text-blue-700 border-blue-200',
  URGENT: 'bg-rose-50 text-rose-700 border-rose-200',
  EVENT: 'bg-teal-50 text-teal-700 border-teal-200',
};

const emptyForm = {
  title: '',
  description: '',
  imageUrl: '',
  previewUrl: '',
  category: 'GENERAL',
  audience: 'ALL',
  departmentId: '',
  publishAt: '',
  expiresAt: '',
};

export default function AnnouncementsPage({ embedded = false }) {
  const [rows, setRows] = React.useState([]);
  const [summary, setSummary] = React.useState({});
  const [pagination, setPagination] = React.useState({ page: 1, totalPages: 1, total: 0 });
  const [departments, setDepartments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  // Filters
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [departmentId, setDepartmentId] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [refresh, setRefresh] = React.useState(0);

  // Modals / Drawers
  const [form, setForm] = React.useState(emptyForm);
  const [editing, setEditing] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const [detail, setDetail] = React.useState(null);
  const [scheduleTarget, setScheduleTarget] = React.useState(null);
  const [scheduleDateTime, setScheduleDateTime] = React.useState('');
  const [pendingDelete, setPendingDelete] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [busyId, setBusyId] = React.useState(null);

  const debouncedSearch = useDebounced(search);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, category, audience, departmentId, dateFrom, dateTo]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      loadAnnouncements({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        status: status || undefined,
        category: category || undefined,
        audience: audience || undefined,
        departmentId: departmentId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
      loadDepartments().catch(() => []),
    ])
      .then(([result, departmentRows]) => {
        if (!active) return;
        const filteredRows = category
          ? (result.rows || []).filter((r) => String(r.category || '').toUpperCase() === category)
          : result.rows || [];
        setRows(filteredRows);
        setSummary(result.summary || {});
        setPagination(result.pagination || { page: 1, totalPages: 1, total: filteredRows.length });
        setDepartments(Array.isArray(departmentRows) ? departmentRows : []);
        setError('');
      })
      .catch((err) => {
        if (active) setError(hrmError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [audience, category, dateFrom, dateTo, debouncedSearch, departmentId, page, refresh, status]);

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setCategory('');
    setAudience('');
    setDepartmentId('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || status || category || audience || departmentId || dateFrom || dateTo);

  const saveAnnouncementWithMode = async (mode = 'DRAFT') => {
    if (saving) return;
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required.');
      return;
    }
    if (mode === 'SCHEDULE' && !form.publishAt) {
      toast.error('Select a Publish Date & Time to schedule this announcement.');
      return;
    }

    setSaving(true);
    const values = {
      title: form.title.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl ? form.imageUrl.trim() : undefined,
      category: form.category || 'GENERAL',
      audience: form.audience || 'ALL',
      departmentId: form.departmentId ? Number(form.departmentId) : undefined,
      publishAt: form.publishAt ? new Date(form.publishAt).toISOString() : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    };

    try {
      let saved;
      if (editing) {
        saved = await updateAnnouncement(editing.id, values);
      } else {
        saved = await createAnnouncement(values);
      }
      const recordId = saved?.data?.id || saved?.id || editing?.id;

      if (mode === 'PUBLISH' && recordId) {
        await publishAnnouncement(recordId);
        toast.success(editing ? 'Announcement updated & published' : 'Announcement created & published');
      } else if (mode === 'SCHEDULE' && recordId) {
        await scheduleAnnouncement(recordId, new Date(form.publishAt).toISOString());
        toast.success('Announcement scheduled');
      } else {
        toast.success(editing ? 'Announcement updated' : 'Announcement saved as draft');
      }

      setOpen(false);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be 5 MB or smaller.');
      return;
    }
    setUploadingImage(true);
    try {
      const res = await uploadAnnouncementImage(file);
      const uploaded = res?.data?.data || res?.data || res || {};
      const nextUrl = uploaded.imageUrl || '';
      const nextPreview = uploaded.previewUrl || nextUrl;
      setForm((prev) => ({ ...prev, imageUrl: nextUrl, previewUrl: nextPreview }));
      toast.success('Announcement image uploaded');
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setUploadingImage(false);
    }
  };

  const runRowAction = async (action, id, successMsg) => {
    setBusyId(id);
    try {
      await action(id);
      toast.success(successMsg);
      setRefresh((v) => v + 1);
      if (detail?.id === id) {
        const updated = await loadAnnouncement(id).catch(() => null);
        if (updated) setDetail(updated);
      }
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setBusyId(null);
    }
  };

  const openScheduleModal = (item) => {
    setScheduleTarget(item);
    const defaultDt = item.publishAt
      ? localInput(item.publishAt)
      : localInput(new Date(Date.now() + 3600 * 1000).toISOString());
    setScheduleDateTime(defaultDt);
  };

  const confirmSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleTarget || !scheduleDateTime) {
      toast.error('Please choose a valid date and time.');
      return;
    }
    setBusyId(scheduleTarget.id);
    try {
      await scheduleAnnouncement(scheduleTarget.id, new Date(scheduleDateTime).toISOString());
      toast.success('Announcement scheduled successfully');
      setScheduleTarget(null);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(hrmError(err));
    } finally {
      setBusyId(null);
    }
  };

  const kpiCards = [
    { key: '', label: 'Total Announcements', value: summary.total ?? 0, icon: Megaphone, accent: 'text-[#123D32] bg-[#E8F1EC]' },
    { key: 'PUBLISHED', label: 'Published', value: summary.published ?? 0, icon: CheckCircle2, accent: 'text-emerald-700 bg-emerald-50' },
    { key: 'SCHEDULED', label: 'Scheduled', value: summary.scheduled ?? 0, icon: CalendarClock, accent: 'text-amber-700 bg-amber-50' },
    { key: 'DRAFT', label: 'Drafts', value: summary.drafts ?? 0, icon: FileText, accent: 'text-slate-700 bg-slate-100' },
    { key: 'ARCHIVED', label: 'Archived', value: summary.archived ?? 0, icon: Archive, accent: 'text-zinc-600 bg-zinc-100' },
  ];

  const handleExportCsv = () => {
    if (!rows.length) {
      toast.error('There are no announcements to export.');
      return;
    }
    downloadCsv(
      'announcements.csv',
      rows.map((row) => ({
        Title: row.title,
        Description: row.description,
        Category: row.category,
        Audience: row.audience,
        Department: row.departmentName || 'All',
        PublishedAt: formatDisplayDate(row.publishAt),
        ExpiresAt: formatDisplayDate(row.expiresAt),
        Status: row.status,
      })),
    );
  };

  return (
    <div className="w-full min-w-0 max-w-none space-y-5">
      {!embedded ? (
        <PageHeader
          title="Announcements"
          description="Create, schedule, and distribute company-wide or department announcements."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" className="h-9 text-xs" onClick={() => setRefresh((v) => v + 1)}>
                <RefreshCw className="mr-1.5 size-3.5" />
                Refresh
              </Button>
              <GlobalExport
                module="announcements"
                title="Company Announcements Report"
                filters={{ search: debouncedSearch || undefined, status: status || undefined, audience: audience || undefined, departmentId: departmentId || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }}
                currentPageRows={rows}
                page={page}
                limit={20}
              />
              <Button
                type="button"
                className="h-9 bg-[#123D32] text-xs text-white hover:bg-[#176B50]"
                onClick={() => {
                  setEditing(null);
                  setForm(emptyForm);
                  setOpen(true);
                }}
              >
                <Plus className="mr-1.5 size-3.5" />
                Add Announcement
              </Button>
            </div>
          }
        />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2E8E5] bg-white px-5 py-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#E8F1EC] text-[#123D32]">
              <BellRing className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#142D25]">Company Announcements</h2>
              <p className="text-xs text-[#64748B]">Create, schedule, and distribute announcements to employees and departments.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="h-9 text-xs" onClick={() => setRefresh((v) => v + 1)}>
              <RefreshCw className="mr-1.5 size-3.5" />
              Refresh
            </Button>
            <Button type="button" variant="outline" className="h-9 text-xs" onClick={handleExportCsv}>
              <Download className="mr-1.5 size-3.5" />
              Export CSV
            </Button>
            <Button
              type="button"
              className="h-9 bg-[#123D32] text-xs text-white hover:bg-[#176B50]"
              onClick={() => {
                setEditing(null);
                setForm(emptyForm);
                setOpen(true);
              }}
            >
              <Plus className="mr-1.5 size-3.5" />
              Add Announcement
            </Button>
          </div>
        </div>
      )}

      {/* Clickable KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const active = status === card.key;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => setStatus((prev) => (prev === card.key ? '' : card.key))}
              className={cn(
                'flex items-center justify-between rounded-2xl border bg-white p-4 text-left transition hover:border-[#123D32]/40 hover:shadow-xs',
                active ? 'border-[#123D32] ring-2 ring-[#123D32]/15' : 'border-[#E2E8E5]',
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  {card.label}
                </p>
                <p className="mt-1.5 text-2xl font-bold text-[#142D25]">{card.value}</p>
              </div>
              <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', card.accent)}>
                <Icon className="size-5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-[#E2E8E5] bg-white p-3.5 shadow-xs">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-7">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or description..."
            className="h-9 text-xs lg:col-span-2"
          />
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-lg border border-[#E2E8E5] bg-white px-2.5 text-xs font-medium text-[#142D25] outline-none focus:border-[#123D32]"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{formatLabel(c)}</option>
            ))}
          </select>
          <select
            aria-label="Filter by audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="h-9 rounded-lg border border-[#E2E8E5] bg-white px-2.5 text-xs font-medium text-[#142D25] outline-none focus:border-[#123D32]"
          >
            <option value="">All Audiences</option>
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>{formatLabel(a)}</option>
            ))}
          </select>
          <select
            aria-label="Filter by department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="h-9 rounded-lg border border-[#E2E8E5] bg-white px-2.5 text-xs font-medium text-[#142D25] outline-none focus:border-[#123D32]"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={String(d.id)}>{d.name}</option>
            ))}
          </select>
          <Input
            type="date"
            aria-label="From date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 text-xs"
          />
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              aria-label="To date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 flex-1 text-xs"
            />
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetFilters}
                title="Reset filters"
                className="h-9 shrink-0 px-2.5 text-xs"
              >
                <FilterX className="size-3.5" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <HrmNotice
        loading={loading}
        error={error}
        onRetry={() => setRefresh((v) => v + 1)}
        empty={!loading && !error && rows.length === 0 ? 'No announcements match these filters.' : ''}
      />

      {/* Mobile Cards */}
      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <article
            key={row.id}
            className="space-y-2.5 rounded-2xl border border-[#E2E8E5] bg-white p-4 shadow-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <TruncatedAnnouncementText text={row.title} isTitle label="Title" />
                <TruncatedAnnouncementText text={row.description} label="Description" className="mt-0.5" />
              </div>
              <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold', STATUS_BADGE[row.status] || STATUS_BADGE.DRAFT)}>
                {formatLabel(row.status)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#64748B]">
              <span className={cn('rounded-md border px-1.5 py-0.5 font-medium', CATEGORY_BADGE[row.category] || CATEGORY_BADGE.GENERAL)}>
                {formatLabel(row.category)}
              </span>
              <span>Audience: {formatLabel(row.audience)}</span>
              <span>•</span>
              <span>{row.departmentName || 'All Departments'}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
              <span className="text-[11px] text-[#64748B]">
                Published: {formatDisplayDate(row.publishAt)}
              </span>
              <RowActionButtons
                row={row}
                busy={busyId === row.id}
                onView={async () => setDetail(await loadAnnouncement(row.id).catch(() => row))}
                onEdit={() => {
                  setEditing(row);
                  setForm(formFrom(row));
                  setOpen(true);
                }}
                onPublish={() => runRowAction(publishAnnouncement, row.id, 'Announcement published')}
                onSchedule={() => openScheduleModal(row)}
                onArchive={() => runRowAction(archiveAnnouncement, row.id, 'Announcement archived')}
                onDelete={() => setPendingDelete(row)}
              />
            </div>
          </article>
        ))}
      </div>

      {/* Desktop Table (Clean layout, zero text overlap) */}
      {rows.length > 0 ? (
        <div className="hidden overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white shadow-xs md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] table-fixed border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E2E8E5] bg-[#F8FAF9] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  <th className="w-[30%] px-4 py-3">Announcement</th>
                  <th className="w-[10%] px-3 py-3">Category</th>
                  <th className="w-[10%] px-3 py-3">Audience</th>
                  <th className="w-[11%] px-3 py-3">Department</th>
                  <th className="w-[13%] px-3 py-3">Published</th>
                  <th className="w-[12%] px-3 py-3">Expiry</th>
                  <th className="w-[10%] px-3 py-3">Status</th>
                  <th className="w-[190px] px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-[#F3F8F5]/60">
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center gap-3 min-w-0">
                        {row.imageUrl ? (
                          <img
                            src={row.previewUrl || row.imageUrl}
                            alt=""
                            className="size-10 shrink-0 rounded-lg border border-[#E2E8E5] object-cover"
                          />
                        ) : null}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <TruncatedAnnouncementText text={row.title} isTitle label="Title" />
                          <TruncatedAnnouncementText text={row.description} label="Description" />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <span className={cn('inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold', CATEGORY_BADGE[row.category] || CATEGORY_BADGE.GENERAL)}>
                        {formatLabel(row.category)}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 align-middle text-xs font-medium text-[#142D25]">
                      {formatLabel(row.audience)}
                    </td>
                    <td className="px-3 py-3.5 align-middle truncate text-xs text-[#475569]">
                      {row.departmentName || 'All'}
                    </td>
                    <td className="px-3 py-3.5 align-middle text-xs text-[#475569]">
                      {formatDisplayDate(row.publishAt)}
                    </td>
                    <td className="px-3 py-3.5 align-middle text-xs text-[#475569]">
                      {formatDisplayDate(row.expiresAt)}
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <span className={cn('inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', STATUS_BADGE[row.status] || STATUS_BADGE.DRAFT)}>
                        {formatLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 align-middle text-right">
                      <RowActionButtons
                        row={row}
                        busy={busyId === row.id}
                        onView={async () => setDetail(await loadAnnouncement(row.id).catch(() => row))}
                        onEdit={() => {
                          setEditing(row);
                          setForm(formFrom(row));
                          setOpen(true);
                        }}
                        onPublish={() => runRowAction(publishAnnouncement, row.id, 'Announcement published')}
                        onSchedule={() => openScheduleModal(row)}
                        onArchive={() => runRowAction(archiveAnnouncement, row.id, 'Announcement archived')}
                        onDelete={() => setPendingDelete(row)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-[#64748B]">
        <span>
          Page {page} of {pagination.totalPages || 1} ({pagination.total ?? rows.length} total)
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-8 px-3 text-xs" disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>
            Previous
          </Button>
          <Button type="button" variant="outline" className="h-8 px-3 text-xs" disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage((v) => v + 1)}>
            Next
          </Button>
        </div>
      </div>

      {/* Add / Edit Drawer */}
      <FormDrawer
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'Edit Announcement' : 'Create Announcement'}
        description="Publish immediately, schedule for later, or save as a draft."
        showFooter={false}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveAnnouncementWithMode('DRAFT');
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Q4 Townhall & Holiday Schedule"
              required
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Write the full announcement message..."
              rows={4}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Announcement Image (Optional)</Label>
            {form.previewUrl || form.imageUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-[#E2E8E5] bg-[#F8FAF9]">
                <img
                  src={form.previewUrl || form.imageUrl}
                  alt="Announcement preview"
                  className="h-40 w-full object-cover"
                />
                <div className="flex items-center justify-between border-t border-[#E2E8E5] bg-white px-3 py-2 text-xs">
                  <span className="truncate text-[#64748B]">Image attached</span>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer font-semibold text-[#123D32] hover:underline">
                      Replace
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e.target.files?.[0])}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, imageUrl: '', previewUrl: '' }))}
                      className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:underline"
                    >
                      <X className="size-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleImageUpload(e.dataTransfer.files?.[0]);
                }}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAF9] px-4 py-5 text-center transition hover:border-[#123D32] hover:bg-[#F3F8F5]"
              >
                <ImagePlus className="size-6 text-[#123D32]" />
                <span className="mt-1.5 text-xs font-semibold text-[#142D25]">
                  {uploadingImage ? 'Uploading image...' : 'Click to upload or drag & drop'}
                </span>
                <span className="mt-0.5 text-[11px] text-[#64748B]">
                  JPG, PNG, or WebP (max 5MB)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={(e) => handleImageUpload(e.target.files?.[0])}
                />
              </label>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-9 w-full rounded-lg border border-[#E2E8E5] bg-white px-2.5 text-sm outline-none focus:border-[#123D32]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{formatLabel(c)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <select
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
                className="h-9 w-full rounded-lg border border-[#E2E8E5] bg-white px-2.5 text-sm outline-none focus:border-[#123D32]"
              >
                {AUDIENCES.map((a) => (
                  <option key={a} value={a}>{formatLabel(a)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Department (Optional)</Label>
            <select
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              className="h-9 w-full rounded-lg border border-[#E2E8E5] bg-white px-2.5 text-sm outline-none focus:border-[#123D32]"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={String(d.id)}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Publish Date &amp; Time</Label>
              <Input
                type="datetime-local"
                value={form.publishAt}
                onChange={(e) => setForm({ ...form, publishAt: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Expiry Date &amp; Time</Label>
              <Input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#E2E8E5] pt-4">
            <Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="outline" disabled={saving}>
              {editing ? 'Save Changes' : 'Save Draft'}
            </Button>
            {form.publishAt ? (
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => saveAnnouncementWithMode('SCHEDULE')}
                className="border-amber-300 text-amber-800 hover:bg-amber-50"
              >
                <CalendarClock className="mr-1.5 size-3.5" />
                Schedule
              </Button>
            ) : null}
            <Button
              type="button"
              disabled={saving}
              onClick={() => saveAnnouncementWithMode('PUBLISH')}
              className="bg-[#123D32] text-white hover:bg-[#176B50]"
            >
              <Send className="mr-1.5 size-3.5" />
              {saving ? 'Saving...' : 'Publish Now'}
            </Button>
          </div>
        </form>
      </FormDrawer>

      {/* Interactive Schedule Modal */}
      <FormDrawer
        open={Boolean(scheduleTarget)}
        onOpenChange={(next) => { if (!next) setScheduleTarget(null); }}
        title="Schedule Announcement"
        description={scheduleTarget?.title || ''}
        showFooter={false}
        size="sm"
      >
        <form onSubmit={confirmSchedule} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Publish Date &amp; Time</Label>
            <Input
              type="datetime-local"
              value={scheduleDateTime}
              onChange={(e) => setScheduleDateTime(e.target.value)}
              required
              className="h-10 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setScheduleDateTime(localInput(new Date(Date.now() + 3600 * 1000).toISOString()))}
            >
              In 1 Hour
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                d.setHours(9, 0, 0, 0);
                setScheduleDateTime(localInput(d.toISOString()));
              }}
            >
              Tomorrow 9:00 AM
            </Button>
          </div>
          <div className="flex justify-end gap-2 border-t border-[#E2E8E5] pt-4">
            <Button type="button" variant="outline" onClick={() => setScheduleTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#123D32] text-white hover:bg-[#176B50]">
              Confirm Schedule
            </Button>
          </div>
        </form>
      </FormDrawer>

      {/* View Detail Drawer */}
      <FormDrawer
        open={Boolean(detail)}
        onOpenChange={(next) => { if (!next) setDetail(null); }}
        showFooter={false}
        title={detail?.title || 'Announcement Details'}
        description={detail ? `${formatLabel(detail.category)} • ${formatLabel(detail.status)}` : ''}
      >
        {detail ? (
          <div className="space-y-4">
            {detail.imageUrl ? (
              <img
                src={detail.previewUrl || detail.imageUrl}
                alt={detail.title}
                className="max-h-56 w-full rounded-xl border border-[#E2E8E5] object-cover"
              />
            ) : null}
            <div className="rounded-xl border border-[#E2E8E5] bg-[#F8FAF9] p-4 text-sm leading-relaxed text-[#142D25] whitespace-pre-wrap">
              {detail.description}
            </div>
            <dl className="divide-y divide-slate-100 rounded-xl border border-[#E2E8E5] bg-white px-4 text-xs">
              {[
                ['Status', formatLabel(detail.status)],
                ['Category', formatLabel(detail.category)],
                ['Audience', formatLabel(detail.audience)],
                ['Department', detail.departmentName || 'All Departments'],
                ['Published At', formatDisplayDate(detail.publishAt)],
                ['Expires At', formatDisplayDate(detail.expiresAt)],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="font-medium text-[#64748B]">{label}</dt>
                  <dd className="font-semibold text-[#142D25]">{val}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              {detail.status !== 'PUBLISHED' && detail.status !== 'ARCHIVED' ? (
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#123D32] text-white hover:bg-[#176B50]"
                  onClick={() => runRowAction(publishAnnouncement, detail.id, 'Announcement published')}
                >
                  <Send className="mr-1.5 size-3.5" />
                  Publish Now
                </Button>
              ) : null}
              {detail.status !== 'ARCHIVED' ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => runRowAction(archiveAnnouncement, detail.id, 'Announcement archived')}
                >
                  <Archive className="mr-1.5 size-3.5" />
                  Archive
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </FormDrawer>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => { if (!next) setPendingDelete(null); }}
        title="Delete announcement?"
        description={`Delete “${pendingDelete?.title || ''}”? Published announcements must be archived first.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await removeAnnouncement(pendingDelete.id);
            toast.success('Announcement deleted');
            setPendingDelete(null);
            setRefresh((v) => v + 1);
          } catch (err) {
            toast.error(hrmError(err));
          }
        }}
      />
    </div>
  );
}

function RowActionButtons({ row, busy, onView, onEdit, onPublish, onSchedule, onArchive, onDelete }) {
  return (
    <div className="inline-flex items-center justify-end gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={onView}
        title="View details"
        className="flex size-8 items-center justify-center rounded-lg border border-transparent text-[#64748B] transition hover:border-[#E2E8E5] hover:bg-slate-50 hover:text-[#142D25]"
      >
        <Eye className="size-4" />
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onEdit}
        title="Edit announcement"
        className="flex size-8 items-center justify-center rounded-lg border border-transparent text-[#64748B] transition hover:border-[#E2E8E5] hover:bg-slate-50 hover:text-[#142D25]"
      >
        <Edit3 className="size-4" />
      </button>
      {row.status !== 'PUBLISHED' && row.status !== 'ARCHIVED' ? (
        <button
          type="button"
          disabled={busy}
          onClick={onPublish}
          title="Publish now"
          className="flex size-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
        >
          <Send className="size-3.5" />
        </button>
      ) : null}
      {row.status !== 'ARCHIVED' ? (
        <button
          type="button"
          disabled={busy}
          onClick={onSchedule}
          title="Schedule"
          className="flex size-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 transition hover:bg-amber-100"
        >
          <CalendarClock className="size-3.5" />
        </button>
      ) : null}
      {row.status !== 'ARCHIVED' ? (
        <button
          type="button"
          disabled={busy}
          onClick={onArchive}
          title="Archive"
          className="flex size-8 items-center justify-center rounded-lg border border-transparent text-[#64748B] transition hover:border-[#E2E8E5] hover:bg-slate-50 hover:text-[#142D25]"
        >
          <Archive className="size-3.5" />
        </button>
      ) : null}
      {row.status !== 'PUBLISHED' ? (
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          title="Delete"
          className="flex size-8 items-center justify-center rounded-lg border border-transparent text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
        >
          <Trash2 className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function formFrom(row) {
  return {
    title: row.title || '',
    description: row.description || '',
    imageUrl: row.imageUrl || '',
    previewUrl: row.previewUrl || row.imageUrl || '',
    category: row.category || 'GENERAL',
    audience: row.audience || 'ALL',
    departmentId: row.departmentId ? String(row.departmentId) : '',
    publishAt: localInput(row.publishAt),
    expiresAt: localInput(row.expiresAt),
  };
}

function localInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 16);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDisplayDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 16).replace('T', ' ');
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatLabel(val) {
  if (!val) return '—';
  return String(val)
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function useDebounced(value) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), 300);
    return () => clearTimeout(timer);
  }, [value]);
  return debounced;
}
