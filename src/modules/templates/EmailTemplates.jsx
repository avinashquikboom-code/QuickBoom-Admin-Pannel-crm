'use client';

import * as React from 'react';
import api from '../../../lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiGrid } from '@/components/common/KpiCard';
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
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import {
  downloadCsv,
  rowsOf,
  pageOf,
  Pager,
  Field,
  TemplateTable,
  TemplateToolbar,
  StatusBadge,
} from './template-shared';
import { EmailRichTextEditor } from './EmailRichTextEditor';
import { EmailTemplatePreviewDialog } from './EmailTemplatePreviewDialog';

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'INACTIVE', 'ARCHIVED'];

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
  const [togglingId, setTogglingId] = React.useState(null);

  React.useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [search]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await api.get('/email/templates', {
        params: {
          page,
          limit,
          search: debouncedSearch || undefined,
          status,
          sort: 'updatedAt:desc',
        },
      });
      const root = payload?.data && typeof payload.data === 'object' ? payload : payload;
      const list = rowsOf(root);
      const pagination = pageOf(root, { page, totalPages: 1, total: list.length });
      setRows(list);
      setPages(Math.max(1, Number(pagination.totalPages) || 1));
      setTotal(Number(pagination.total) || list.length);
      const statsPayload = root?.stats ?? root?.data?.stats;
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
      setError(err?.response?.data?.message || 'Email templates could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, status]);

  React.useEffect(() => {
    load();
  }, [load]);

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

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('ALL');
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
    setTogglingId(row.id);
    try {
      await api.patch(`/email/templates/${row.id}/status`, {
        isActive: row.deletedAt ? true : !row.isActive,
      });
      toast.success('Template status updated');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update status');
    } finally {
      setTogglingId(null);
    }
  }

  const filtersActive = Boolean(search.trim()) || status !== 'ALL';

  return (
    <div className="min-w-0 w-full max-w-full space-y-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <PageHeader
        title="Email Templates"
        icon={faEnvelope}
        description="Database-backed email templates used by lead stage notifications."
      />

      <KpiGrid
        className="grid-cols-1 min-[440px]:grid-cols-2 lg:grid-cols-4"
        cards={[
          { title: 'Total Templates', value: stats.total, icon: faEnvelope },
          { title: 'Active', value: stats.active, icon: faEnvelope },
          { title: 'Inactive', value: stats.inactive, icon: faEnvelope },
          { title: 'Sent', value: stats.sent, icon: faPaperPlane },
        ]}
      />

      <div className="flex min-w-0 w-full flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
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
          onExport={() =>
            downloadCsv(
              'email-templates.csv',
              [
                { key: 'name', label: 'Name' },
                { key: 'key', label: 'Code' },
                { key: 'subject', label: 'Subject' },
              ],
              rows,
            )
          }
        />
        <Button type="button" className="h-10 w-full shrink-0 lg:w-auto" onClick={openCreate}>
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Add Email Template
        </Button>
      </div>

      {filtersActive ? (
        <p className="text-xs text-slate-500">Filters applied — pagination keeps your search and status.</p>
      ) : null}

      <div className="hidden md:block">
        <TemplateTable
          loading={loading}
          error={error}
          rows={rows}
          empty="No email templates match this view."
          columns={['Name', 'Code', 'Subject', 'Status', 'Actions']}
          render={(row) => (
            <tr key={row.id} className="border-t border-[#E2E8E5]">
              <td className="max-w-[200px] px-3 py-3">
                <span className="font-medium">{row.name}</span>
                {row.description ? (
                  <p className="mt-0.5 truncate text-xs text-slate-500" title={row.description}>
                    {row.description}
                  </p>
                ) : null}
              </td>
              <td className="px-3 py-3 font-mono text-xs">{row.key}</td>
              <td className="max-w-xs px-3 py-3">
                <span title={row.subject}>{truncate(row.subject, 56)}</span>
              </td>
              <td className="px-3 py-3">
                <StatusBadge row={row} />
              </td>
              <td className="whitespace-nowrap px-3 py-3">
                <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-[#163A2E]" onClick={() => openEdit(row)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-[#163A2E]"
                  disabled={togglingId === row.id}
                  onClick={() => toggleRowStatus(row)}
                >
                  {row.deletedAt ? 'Restore' : row.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </td>
            </tr>
          )}
        />
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <p className="rounded-xl border border-[#E2E8E5] bg-white p-5 text-sm text-[#718078]">Loading templates…</p>
        ) : error ? (
          <p className="rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700">{error}</p>
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-[#E2E8E5] bg-white p-5 text-sm text-[#718078]">No email templates match this view.</p>
        ) : (
          rows.map((row) => (
            <article
              key={row.id}
              className="min-w-0 space-y-3 rounded-xl border border-[#E2E8E5] bg-white p-4"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <h3 className="min-w-0 break-words text-base font-semibold text-[#172B24]">{row.name}</h3>
                <StatusBadge row={row} />
              </div>
              <p className="break-all font-mono text-xs text-slate-600">{row.key}</p>
              <p className="break-words text-sm text-slate-700">
                <span className="text-xs font-semibold uppercase text-slate-400">Subject</span>
                <br />
                {row.subject}
              </p>
              <div className="flex min-w-0 flex-wrap gap-2">
                <Button type="button" variant="outline" className="min-h-10 flex-1" onClick={() => openEdit(row)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-10 flex-1"
                  disabled={togglingId === row.id}
                  onClick={() => toggleRowStatus(row)}
                >
                  {row.deletedAt ? 'Restore' : row.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
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
              onClick={() => setPreviewOpen(true)}
            >
              <FontAwesomeIcon icon={faEye} className="mr-2" />
              Preview
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              className="h-9 w-full sm:w-auto"
              onClick={() => setDrawer(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="h-9 w-full sm:w-auto">
              {saving ? 'Saving…' : 'Save Template'}
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
        onOpenChange={setPreviewOpen}
        subject={form.subject}
        body={form.body}
        code={form.key}
      />
    </div>
  );
}
