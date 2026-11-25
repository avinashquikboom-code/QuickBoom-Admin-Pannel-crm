'use client';

import * as React from 'react';
import api from '../../../lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/common/KpiCard';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faEnvelope,
  faPaperPlane,
  faPlus,
  faEye,
  faCircleCheck,
  faCircleXmark,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { AnimatedCounter } from '@/components/dashboard/AnimatedCounter';
import { sessionCan, sessionCanAction } from '@/modules/hrm/hrm-api';
import {
  downloadCsv,
  rowsOf,
  pageOf,
  envelope,
  Pager,
  Field,
  TemplateTable,
  TemplateToolbar,
  StatusBadge,
} from './template-shared';
import { EmailRichTextEditor } from './EmailRichTextEditor';
import { EmailTemplatePreviewDialog } from './EmailTemplatePreviewDialog';
import { AdminRowActions } from '@/components/common/AdminRowActions';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Trash2 } from 'lucide-react';

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'INACTIVE'];
const DEFAULT_SORT = 'updatedAt:desc';
const SORT_OPTIONS = [
  { value: DEFAULT_SORT, label: 'Recently updated' },
  { value: 'name:asc', label: 'Name A–Z' },
  { value: 'name:desc', label: 'Name Z–A' },
  { value: 'key:asc', label: 'Code A–Z' },
  { value: 'key:desc', label: 'Code Z–A' },
  { value: 'isActive:asc', label: 'Status: inactive first' },
  { value: 'isActive:desc', label: 'Status: active first' },
];

const EMPTY_FORM = {
  name: '',
  key: '',
  subject: '',
  body: '',
  description: '',
  category: 'GENERAL',
  isActive: true,
};

function truncate(text, max = 48) {
  const value = String(text ?? '').trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function validateForm(form) {
  const errors = {};
  if (!form.name?.trim()) errors.name = 'Name is required.';
  if (!form.key?.trim()) errors.key = 'Code is required.';
  if (!form.subject?.trim()) errors.subject = 'Subject is required.';
  if (!form.body?.trim()) errors.body = 'HTML body is required.';
  return errors;
}

export function EmailTemplates() {
  const [rows, setRows] = React.useState([]);
  const [stats, setStats] = React.useState({ total: 0, active: 0, inactive: 0, archived: 0, sent: 0 });
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [status, setStatus] = React.useState('ALL');
  const [sort, setSort] = React.useState(DEFAULT_SORT);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [pages, setPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [drawer, setDrawer] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewData, setPreviewData] = React.useState(null);
  const [busyRowId, setBusyRowId] = React.useState(null);
  const [exporting, setExporting] = React.useState(false);

  // Deletion and Selection state
  const [selectedIds, setSelectedIds] = React.useState(new Set());
  const [deletingTemplate, setDeletingTemplate] = React.useState(null);
  const [deleteReason, setDeleteReason] = React.useState('');
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [bulkDeleting, setBulkDeleting] = React.useState(false);
  const [bulkDeleteReason, setBulkDeleteReason] = React.useState('');
  const [permissionReady, setPermissionReady] = React.useState(false);
  const [permissions, setPermissions] = React.useState({
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
  });
  const requestId = React.useRef(0);

  React.useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [search]);

  React.useEffect(() => {
    setPermissions({
      canView: sessionCan('EMAIL_TEMPLATE'),
      canCreate: sessionCanAction('EMAIL_TEMPLATES', 'CREATE'),
      canEdit: sessionCanAction('EMAIL_TEMPLATES', 'EDIT'),
      canDelete: sessionCanAction('EMAIL_TEMPLATES', 'DELETE'),
      canExport: sessionCanAction('EMAIL_TEMPLATES', 'EXPORT'),
    });
    setPermissionReady(true);
  }, []);

  const load = React.useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const payload = await api.get('/email/templates', {
        params: {
          page,
          limit,
          search: debouncedSearch || undefined,
          status,
          sort,
        },
      });
      const root = envelope(payload);
      const list = rowsOf(root);
      const pagination = pageOf(root, { page, totalPages: 1, total: list.length });
      if (currentRequestId !== requestId.current) return;
      setRows(list);
      setPages(Math.max(1, Number(pagination.totalPages) || 1));
      setTotal(Number(pagination.total) || list.length);
      let statsPayload = root?.stats ?? root?.data?.stats ?? payload?.stats ?? payload?.data?.stats;
      if (!statsPayload || (statsPayload.total === 0 && list.length > 0)) {
        try {
          const statsRes = await api.get('/email/templates/stats');
          const rawStats = statsRes?.data?.stats ?? statsRes?.data ?? statsRes?.stats ?? statsRes;
          if (rawStats && typeof rawStats === 'object' && ('total' in rawStats || 'active' in rawStats)) {
            statsPayload = rawStats;
          }
        } catch {}
      }
      if (statsPayload) {
        setStats({
          total: Number(statsPayload.total) || 0,
          active: Number(statsPayload.active) || 0,
          inactive: Number(statsPayload.inactive) || 0,
          archived: Number(statsPayload.archived) || 0,
          sent: Number(statsPayload.sent) || 0,
        });
      }
    } catch (err) {
      if (currentRequestId === requestId.current) {
        setError(err?.response?.data?.message || 'Email templates could not be loaded.');
      }
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }, [page, limit, debouncedSearch, status, sort]);

  React.useEffect(() => {
    if (!permissionReady || !permissions.canView) return;
    load();
  }, [load, permissionReady, permissions.canView]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setDrawer(true);
  };

  const openEdit = (row) => {
    setForm({
      id: row.id,
      name: row.name || row.templateName || '',
      key: row.key || row.identifierKey || '',
      subject: row.subject || '',
      body: row.body || '',
      description: row.description || '',
      category: row.category || 'GENERAL',
      isActive: row.deletedAt ? false : row.isActive !== false,
    });
    setFieldErrors({});
    setDrawer(true);
  };

  const previewTemplate = (row) => {
    setPreviewData({
      subject: row.subject || '',
      body: row.body || '',
      key: row.key || row.identifierKey || '',
    });
    setPreviewOpen(true);
  };

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('ALL');
    setSort(DEFAULT_SORT);
    setPage(1);
  };

  async function save(event) {
    event.preventDefault();
    const errors = validateForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        key: form.key.trim(),
        subject: form.subject.trim(),
        body: form.body,
        description: form.description?.trim() || undefined,
        category: form.category || 'GENERAL',
        isActive: form.isActive !== false,
      };
      if (form.id) await api.put(`/email/templates/${form.id}`, body);
      else await api.post('/email/templates', body);
      toast.success('Email template saved');
      setDrawer(false);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save the template');
    } finally {
      setSaving(false);
    }
  }

  async function toggleRowStatus(row) {
    setBusyRowId(row.id);
    try {
      await api.patch(`/email/templates/${row.id}/status`, {
        isActive: row.deletedAt ? true : !row.isActive,
      });
      toast.success('Template status updated');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update status');
    } finally {
      setBusyRowId(null);
    }
  }

  const isAllPageSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const isSomePageSelected = rows.some((r) => selectedIds.has(r.id)) && !isAllPageSelected;

  const handleToggleSelectAll = (checked) => {
    const next = new Set(selectedIds);
    if (checked) {
      rows.forEach((r) => next.add(r.id));
    } else {
      rows.forEach((r) => next.delete(r.id));
    }
    setSelectedIds(next);
  };

  const handleToggleRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  async function confirmDeleteTemplate() {
    if (!deletingTemplate) return;
    setBusyRowId(deletingTemplate.id);
    try {
      const res = envelope(
        await api.delete(`/email/templates/${deletingTemplate.id}`, {
          data: { reason: deleteReason ? deleteReason.trim() : undefined },
        }),
      );
      toast.success(res?.message || `Email template "${deletingTemplate.name}" permanently deleted.`);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deletingTemplate.id);
        return next;
      });
      setDeletingTemplate(null);
      setDeleteReason('');
      if (rows.length === 1 && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      }
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not permanently delete the template');
    } finally {
      setBusyRowId(null);
    }
  }

  async function handleBulkDelete() {
    if (!selectedIds.size || bulkDeleting) return;
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const response = envelope(
        await api.delete('/email/templates/bulk', {
          data: {
            ids,
            reason: bulkDeleteReason ? bulkDeleteReason.trim() : undefined,
          },
        }),
      );

      if (response?.success) {
        if (response.failedCount > 0) {
          toast.warning(response.message || `Deleted ${response.deletedCount} email templates. ${response.failedCount} failed.`);
        } else {
          toast.success(response.message || `Successfully permanently deleted ${response.deletedCount} email template(s).`);
        }
      } else {
        toast.error(response?.message || 'Failed to delete selected templates.');
      }

      setBulkDeleteOpen(false);
      setBulkDeleteReason('');
      setSelectedIds(new Set());

      if (rows.length <= ids.length && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      }
      await load();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to execute bulk deletion.';
      toast.error(Array.isArray(msg) ? msg.join(' ') : msg);
    } finally {
      setBulkDeleting(false);
    }
  }

  async function deleteTemplate(row) {
    setDeletingTemplate(row);
  }

  async function exportTemplates() {
    setExporting(true);
    try {
      const exportRows = [];
      let exportPage = 1;
      let totalPages = 1;
      do {
        const payload = await api.get('/email/templates', {
          params: {
            page: exportPage,
            limit: 100,
            search: debouncedSearch || undefined,
            status,
            sort,
          },
        });
        const root = envelope(payload);
        exportRows.push(...rowsOf(root));
        const pagination = pageOf(root, { totalPages: 1 });
        totalPages = Math.max(1, Number(pagination.totalPages) || 1);
        exportPage += 1;
      } while (exportPage <= totalPages);

      if (exportRows.length === 0) {
        toast.error('There are no email templates to export');
        return;
      }

      downloadCsv(
        'email-templates.csv',
        [
          { key: 'name', label: 'Name' },
          { key: 'key', label: 'Code' },
          { key: 'subject', label: 'Subject' },
          { key: 'statusLabel', label: 'Status' },
        ],
        exportRows.map((row) => ({
          ...row,
          statusLabel: row.deletedAt ? 'Archived' : row.isActive === false ? 'Inactive' : 'Active',
        })),
      );
      toast.success(`${exportRows.length} email templates exported`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not export email templates');
    } finally {
      setExporting(false);
    }
  }

  const filtersActive = Boolean(search.trim()) || status !== 'ALL';

  if (permissionReady && !permissions.canView) {
    return (
      <div className="min-w-0 space-y-4">
        <PageHeader
          title="Email Templates"
          icon={faEnvelope}
          description="Database-backed email templates used by lead stage notifications."
        />
        <div role="alert" className="rounded-2xl border border-amber-200 bg-white p-5 text-sm text-amber-900 shadow-xs">
          You do not have permission to view email templates.
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="animate-in fade-in slide-in-from-top-2 duration-500 motion-reduce:animate-none">
        <PageHeader
          title="Email Templates"
          icon={faEnvelope}
          description="Database-backed email templates used by lead stage notifications."
        />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 min-[440px]:grid-cols-2 min-[1200px]:grid-cols-4 sm:gap-4">
        {[
          { title: 'Total Templates', value: stats.total, icon: faEnvelope, iconColor: 'text-[#173D30]', iconBg: 'bg-emerald-50 border-emerald-100' },
          { title: 'Active', value: stats.active, icon: faCircleCheck, iconColor: 'text-emerald-700', iconBg: 'bg-emerald-50 border-emerald-100' },
          { title: 'Inactive', value: stats.inactive, icon: faCircleXmark, iconColor: 'text-slate-500', iconBg: 'bg-slate-50 border-slate-200' },
          { title: 'Sent', value: stats.sent, icon: faPaperPlane, iconColor: 'text-teal-700', iconBg: 'bg-teal-50 border-teal-100' },
        ].map((card, index) => (
          <div
            key={card.title}
            className="animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <KpiCard
              {...card}
              value={<AnimatedCounter value={card.value} showIndicator={false} highlightOnChange={false} />}
              className="min-h-[120px] hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            />
          </div>
        ))}
      </div>

      <div className="flex min-w-0 w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <TemplateToolbar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          status={status}
          onStatusChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          statuses={STATUS_OPTIONS}
          onClear={clearFilters}
          sort={sort}
          sortOptions={SORT_OPTIONS}
          onSortChange={(value) => {
            setSort(value);
            setPage(1);
          }}
          onExport={exportTemplates}
          exporting={exporting}
          canExport={permissions.canExport}
        />
        {permissions.canCreate ? (
          <Button
            type="button"
            className="h-10 w-full shrink-0 bg-[#163A2E] text-white transition hover:-translate-y-px hover:bg-[#0f2e24] active:translate-y-0 lg:w-auto"
            onClick={openCreate}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add Email Template
          </Button>
        ) : null}
      </div>

      {filtersActive ? (
        <p className="text-xs text-slate-500">Filters applied — pagination keeps your search and status.</p>
      ) : null}

      {/* Bulk Action Bar (when rows are selected) */}
      {selectedIds.size > 0 && permissions.canDelete && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50/80 border border-emerald-200/90 p-2.5 px-3.5 mb-3 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#163A2E]">
            <span className="size-2 rounded-full bg-[#20C466]" />
            <span>
              {selectedIds.size} {selectedIds.size === 1 ? 'template' : 'templates'} selected
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              (Selection applies to current page)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClearSelection}
              className="h-7 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Clear Selection
            </Button>
            <Button
              type="button"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={bulkDeleting}
              className="h-7.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>Bulk Delete ({selectedIds.size})</span>
            </Button>
          </div>
        </div>
      )}

      <div className="hidden md:block">
        <TemplateTable
          loading={loading}
          error={error}
          rows={rows}
          empty="No email templates match this view."
          columns={[
            {
              key: 'checkbox',
              className: 'w-12 text-center',
              render: (
                <Checkbox
                  aria-label="Select all email templates on this page"
                  checked={isAllPageSelected}
                  indeterminate={isSomePageSelected}
                  onCheckedChange={(checked) => handleToggleSelectAll(Boolean(checked))}
                />
              ),
            },
            'Name',
            'Code',
            'Subject',
            'Status',
            { key: 'actions', className: 'text-right', label: 'Actions' },
          ]}
          loadingSkeleton
          onRetry={load}
          render={(row) => (
            <tr key={row.id} className={`border-t border-[#E2E8E5] transition-colors hover:bg-[#F7FAF8] ${selectedIds.has(row.id) ? 'bg-emerald-50/40' : ''}`}>
              <td className="w-12 px-3 py-3 text-center sm:px-4">
                <Checkbox
                  aria-label={`Select template ${row.name}`}
                  checked={selectedIds.has(row.id)}
                  onCheckedChange={() => handleToggleRow(row.id)}
                />
              </td>
              <td className="max-w-[240px] px-3 py-3 sm:px-4">
                <span className="font-medium">{row.name}</span>
                {row.description ? (
                  <p className="mt-0.5 truncate text-xs text-slate-500" title={row.description}>
                    {row.description}
                  </p>
                ) : null}
              </td>
              <td className="px-3 py-3 font-mono text-xs sm:px-4">{row.key}</td>
              <td className="max-w-xs px-3 py-3 sm:px-4">
                <span className="block max-w-[360px] truncate" title={row.subject}>{truncate(row.subject, 56)}</span>
              </td>
              <td className="px-3 py-3 sm:px-4">
                <StatusBadge row={row} />
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-right sm:px-4">
                <AdminRowActions
                  record={row}
                  recordName={row.name}
                  permissions={{
                    canView: true,
                    canEdit: permissions.canEdit,
                    canDelete: permissions.canDelete && !row.isSystem,
                    canToggle: permissions.canEdit,
                  }}
                  onView={() => previewTemplate(row)}
                  viewLabel="Preview"
                  viewIcon={faEye}
                  onEdit={permissions.canEdit ? () => openEdit(row) : undefined}
                  editLabel="Edit Template"
                  onToggleStatus={permissions.canEdit ? () => toggleRowStatus(row) : undefined}
                  statusLabel={row.deletedAt ? 'Restore Template' : row.isActive ? 'Deactivate Template' : 'Activate Template'}
                  onDelete={permissions.canDelete && !row.isSystem ? () => deleteTemplate(row) : undefined}
                  deleteLabel="Permanently Delete"
                  deleteDescription={`Permanently delete "${row.name}"? This action cannot be undone.`}
                  disabled={busyRowId === row.id}
                />
              </td>
            </tr>
          )}
        />
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <div role="status" aria-label="Loading email templates" className="space-y-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="space-y-3 rounded-xl border border-[#E2E8E5] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
                  <div className="h-6 w-16 animate-pulse rounded-full bg-slate-100 motion-reduce:animate-none" />
                </div>
                <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
                <div className="h-3 w-full animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700">
            <p>{error}</p>
            <Button type="button" variant="outline" className="mt-3 min-h-10" onClick={load}>Try again</Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D5E2DB] bg-white px-5 py-8 text-center">
            <FontAwesomeIcon icon={faEnvelope} className="text-xl text-[#7C9B8C]" />
            <p className="mt-3 text-sm font-semibold text-[#172B24]">No email templates found</p>
            <p className="mt-1 text-sm text-[#718078]">Try changing the search or status filter.</p>
          </div>
        ) : (
          rows.map((row) => (
            <article
              key={row.id}
              className={`min-w-0 space-y-3 rounded-xl border border-[#E2E8E5] bg-white p-4 shadow-xs transition-all hover:-translate-y-px hover:border-emerald-200 hover:shadow-sm ${selectedIds.has(row.id) ? 'border-emerald-300 ring-1 ring-emerald-400/30' : ''}`}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Checkbox
                    aria-label={`Select template ${row.name}`}
                    checked={selectedIds.has(row.id)}
                    onCheckedChange={() => handleToggleRow(row.id)}
                    className="mt-1 shrink-0"
                  />
                  <h3 className="min-w-0 break-words text-base font-semibold text-[#172B24]">{row.name}</h3>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge row={row} />
                  <AdminRowActions
                    record={row}
                    recordName={row.name}
                    permissions={{
                      canView: true,
                      canEdit: permissions.canEdit,
                      canDelete: permissions.canDelete && !row.isSystem,
                      canToggle: permissions.canEdit,
                    }}
                    onView={() => previewTemplate(row)}
                    viewLabel="Preview"
                    viewIcon={faEye}
                    onEdit={permissions.canEdit ? () => openEdit(row) : undefined}
                    editLabel="Edit Template"
                    onToggleStatus={permissions.canEdit ? () => toggleRowStatus(row) : undefined}
                    statusLabel={row.isActive ? 'Deactivate Template' : 'Activate Template'}
                    onDelete={permissions.canDelete && !row.isSystem ? () => deleteTemplate(row) : undefined}
                    deleteLabel="Permanently Delete"
                    deleteDescription={`Permanently delete "${row.name}"? This action cannot be undone.`}
                    disabled={busyRowId === row.id}
                  />
                </div>
              </div>
              <p className="break-all font-mono text-xs text-slate-600">{row.key}</p>
              {row.description ? <p className="break-words text-xs text-slate-500">{row.description}</p> : null}
              <p className="break-words text-sm text-slate-700">
                <span className="text-xs font-semibold uppercase text-slate-400">Subject</span>
                <br />
                {row.subject}
              </p>
            </article>
          ))
        )}
      </div>

      <Pager
        page={page}
        pages={pages}
        limit={limit}
        total={total}
        onPage={setPage}
        onLimit={(value) => {
          setLimit(value);
          setPage(1);
        }}
      />

      <FormDrawer
        open={drawer}
        onOpenChange={setDrawer}
        title={form.id ? 'Edit Email Template' : 'Add Email Template'}
        description="Templates support {{variables}} in subject and body. HTML is sanitized on save."
        loading={saving}
        onSubmit={save}
        submitLabel="Save Template"
        size="sm"
        contentClassName="sm:max-w-[min(520px,calc(100vw-1rem))] max-md:max-w-full"
        bodyClassName="space-y-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        footerExtra={
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              className="mr-auto h-9 w-full sm:w-auto"
              onClick={() => {
                setPreviewData({
                  subject: form.subject,
                  body: form.body,
                  key: form.key,
                });
                setPreviewOpen(true);
              }}
            >
              <FontAwesomeIcon icon={faEye} className="mr-2" />
              Preview
            </Button>
          </div>
        }
      >
        <Field label="Name" required error={fieldErrors.name}>
          <Input
            value={form.name || ''}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="w-full"
            autoComplete="off"
          />
        </Field>
        <Field label="Code" required error={fieldErrors.key} hint="Uppercase identifier used by automations.">
          <Input
            value={form.key || ''}
            onChange={(event) =>
              setForm({
                ...form,
                key: event.target.value.toUpperCase().replace(/[\s-]+/g, '_'),
              })
            }
            className="w-full font-mono"
            autoComplete="off"
          />
        </Field>
        <Field label="Subject" required error={fieldErrors.subject}>
          <Input
            value={form.subject || ''}
            onChange={(event) => setForm({ ...form, subject: event.target.value })}
            className="w-full"
          />
        </Field>
        <Field label="Description">
          <Input
            value={form.description || ''}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className="w-full"
          />
        </Field>
        <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="min-w-0 text-sm font-medium text-slate-700">Active</span>
          <Switch
            checked={form.isActive !== false}
            onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
            aria-label="Template active"
          />
        </div>
        <Field label="HTML body" required error={fieldErrors.body}>
          <EmailRichTextEditor
            value={form.body || ''}
            onChange={(next) => setForm({ ...form, body: next })}
            disabled={saving}
          />
        </Field>
      </FormDrawer>

      <EmailTemplatePreviewDialog
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) setPreviewData(null);
        }}
        subject={previewData?.subject ?? form.subject}
        body={previewData?.body ?? form.body}
        code={previewData?.key ?? form.key}
      />

      {/* ── Single Delete Confirmation Dialog ──────────────────────── */}
      {deletingTemplate && (
        <ConfirmDialog
          open={Boolean(deletingTemplate)}
          onOpenChange={(open) => {
            if (!open && !busyRowId) {
              setDeletingTemplate(null);
              setDeleteReason('');
            }
          }}
          title="Permanently Delete Template?"
          description={`You are about to permanently delete "${deletingTemplate.name}". This action cannot be undone.`}
          confirmLabel={busyRowId === deletingTemplate.id ? 'Deleting…' : 'Permanently Delete'}
          variant="destructive"
          loading={busyRowId === deletingTemplate.id}
          closeOnConfirm={false}
          onConfirm={confirmDeleteTemplate}
          details={(
            <div className="space-y-3 text-left">
              <dl className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-xs">
                <div><dt className="text-slate-400">Template Name</dt><dd className="font-semibold text-slate-800 break-words">{deletingTemplate.name}</dd></div>
                <div><dt className="text-slate-400">Code</dt><dd className="font-semibold text-slate-800 font-mono">{deletingTemplate.key}</dd></div>
                <div><dt className="text-slate-400">Category</dt><dd className="font-semibold text-slate-800">{deletingTemplate.category || 'General'}</dd></div>
                <div><dt className="text-slate-400">Status</dt><dd className="font-semibold text-slate-800">{deletingTemplate.isActive ? 'Active' : 'Inactive'}</dd></div>
              </dl>
              <p className="text-xs text-rose-600">
                This action will permanently delete this email template from the database. Existing email logs and dispatch history will be safely preserved without template references.
              </p>
            </div>
          )}
          note={{
            label: 'Deletion reason (optional for audit log)',
            value: deleteReason,
            onChange: setDeleteReason,
            placeholder: 'e.g., Obsolete or replaced with new design',
          }}
        />
      )}

      {/* ── Bulk Delete Confirmation Dialog ──────────────────────── */}
      {bulkDeleteOpen && (
        <ConfirmDialog
          open={bulkDeleteOpen}
          onOpenChange={(open) => {
            if (!open && !bulkDeleting) {
              setBulkDeleteOpen(false);
              setBulkDeleteReason('');
            }
          }}
          title="Permanently Delete Templates?"
          description={`You are about to permanently delete ${selectedIds.size} selected template(s). This action cannot be undone.`}
          confirmLabel={bulkDeleting ? 'Deleting…' : 'Permanently Delete'}
          variant="destructive"
          loading={bulkDeleting}
          closeOnConfirm={false}
          onConfirm={handleBulkDelete}
          details={(
            <div className="space-y-3 text-left">
              <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-1">
                <p className="font-semibold text-slate-700">Selected templates ({selectedIds.size}):</p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-600 max-h-32 overflow-y-auto">
                  {rows
                    .filter((r) => selectedIds.has(r.id))
                    .slice(0, 8)
                    .map((r) => (
                      <li key={r.id} className="truncate">
                        {r.name} <span className="font-mono text-slate-400">({r.key})</span>
                      </li>
                    ))}
                  {selectedIds.size > 8 && (
                    <li className="text-slate-400 italic">
                      ...and {selectedIds.size - 8} more
                    </li>
                  )}
                </ul>
              </div>
              <p className="text-xs text-rose-600">
                This action permanently removes the selected email templates from the database. Historical email logs will be preserved. System templates cannot be deleted.
              </p>
            </div>
          )}
          note={{
            label: 'Deletion reason (optional for audit log)',
            value: bulkDeleteReason,
            onChange: setBulkDeleteReason,
            placeholder: 'e.g., Bulk deletion of obsolete templates',
          }}
        />
      )}
    </div>
  );
}
