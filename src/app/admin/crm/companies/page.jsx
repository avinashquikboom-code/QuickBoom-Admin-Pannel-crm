'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Button } from '@/components/common/Button';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { bulkDeleteCompanies, crmError, loadCompanies, removeCompany, saveCompany, sessionCan } from '@/modules/crm/crm-api';
import { PermanentDeleteDialog } from '@/components/common/PermanentDeleteDialog';
import { AdminBulkSelectionToolbar, AdminBulkDeleteButton } from '@/components/admin/bulk-selection';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  FileSpreadsheet,
  Globe,
  Mail,
  MapPin,
  Phone,
  Upload,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react';
import api from '../../../../../lib/api';

const COMPANY_STATUSES = ['ACTIVE', 'INACTIVE'];
const blank = {
  name: '',
  domain: '',
  website: '',
  industry: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  postalCode: '',
  status: 'ACTIVE',
  notes: '',
};

export default function CompaniesRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [selectedCompanies, setSelectedCompanies] = React.useState([]);
  const [importOpen, setImportOpen] = React.useState(false);
  const [importRows, setImportRows] = React.useState([]);
  const [importFileName, setImportFileName] = React.useState('');
  const [importError, setImportError] = React.useState('');
  const [importResult, setImportResult] = React.useState(null);
  const [importBusy, setImportBusy] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState(0);
  const inputRef = React.useRef(null);
  const clearSelectionRef = React.useRef(null);

  React.useEffect(() => {
    setAllowed(sessionCan('COMPANY') || sessionCan('CRM'));
  }, []);

  const load = React.useCallback((query) => loadCompanies({
    page: query.page,
    limit: 20,
    search: query.search || undefined,
    status: query.status || undefined,
    industry: query.industry || undefined,
  }), []);

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await removeCompany(pendingDelete.id);
      toast.success(`Company "${pendingDelete.name}" permanently deleted`);
      setPendingDelete(null);
      setRefreshToken((value) => value + 1);
    } catch (err) {
      toast.error(crmError(err));
    } finally {
      setDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (!selectedCompanies.length || deleting) return;
    setDeleting(true);
    try {
      const ids = selectedCompanies.map((c) => c.id);
      const res = await bulkDeleteCompanies(ids, true);
      const count = res?.data?.deletedCount ?? res?.deletedCount ?? ids.length;
      toast.success(`${count} companies permanently deleted`);
      clearSelectionRef.current?.();
      setSelectedCompanies([]);
      setBulkDeleteOpen(false);
      setRefreshToken((value) => value + 1);
    } catch (err) {
      toast.error(crmError(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleFile = async (file) => {
    setImportError('');
    setImportResult(null);
    setImportRows([]);
    setImportFileName('');
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
      setImportError('Choose a CSV file to import companies.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImportError('The CSV file must be 2 MB or smaller.');
      return;
    }
    try {
      const parsed = parseCompanyCsv(await file.text());
      if (!parsed.length) throw new Error('The CSV has a header row but no company records.');
      if (parsed.length > 1000) throw new Error('Import up to 1,000 company records per CSV file.');
      setImportRows(parsed);
      setImportFileName(file.name);
    } catch (error) {
      setImportError(error?.message || 'Could not read this CSV file.');
    }
  };

  const runImport = async () => {
    const validRows = importRows.filter((item) => !item.error);
    if (!validRows.length || importBusy) return;
    setImportBusy(true);
    setImportProgress(0);
    let created = 0;
    let duplicates = 0;
    let failed = importRows.filter((item) => item.error).length;
    const seen = new Set();
    const failures = importRows.filter((item) => item.error).slice(0, 3).map((item) => `Row ${item.rowNumber}: ${item.error}`);

    for (let index = 0; index < validRows.length; index += 1) {
      const item = validRows[index];
      const company = item.company;
      const nameKey = company.name?.trim().toLowerCase();
      const emailKey = company.email?.trim().toLowerCase();
      const phoneKey = (company.phone || '').replace(/\D/g, '');
      const localKey = nameKey || emailKey || phoneKey;

      try {
        if (localKey && seen.has(localKey)) {
          duplicates += 1;
        } else {
          if (localKey) seen.add(localKey);
          const duplicateResponse = await api.post('/companies/check-duplicate', {
            name: company.name,
            phone: company.phone || undefined,
            email: company.email || undefined,
          }).catch(() => null);

          const duplicateData = duplicateResponse?.data || duplicateResponse;
          if (duplicateData?.isDuplicate) {
            duplicates += 1;
          } else {
            await saveCompany(company);
            created += 1;
          }
        }
      } catch (error) {
        failed += 1;
        if (failures.length < 6) failures.push(`Row ${item.rowNumber}: ${crmError(error)}`);
      }
      setImportProgress(Math.round(((index + 1) / validRows.length) * 100));
    }

    const result = { created, duplicates, failed, failures };
    setImportResult(result);
    setImportBusy(false);
    if (created) setRefreshToken((value) => value + 1);
    if (created) toast.success(`${created} compan${created === 1 ? 'y' : 'ies'} imported`);
  };

  const closeImport = () => {
    if (importBusy) return;
    setImportOpen(false);
    setImportRows([]);
    setImportFileName('');
    setImportError('');
    setImportResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const openImport = () => {
    setImportOpen(true);
    setImportError('');
    setImportResult(null);
  };

  return (
    <>
      <CrmScreen
        appearance="companies"
        collapsibleFilters
        title="Companies"
        description="Companies returned by the companies API."
        actionLabel="Add Company"
        canCreate={allowed}
        extraHeaderActions={
          allowed ? (
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"
              onClick={openImport}
            >
              <Upload className="mr-2 size-4" />
              Import Companies
            </Button>
          ) : null
        }
        load={load}
        blank={blank}
        refreshToken={refreshToken}
        enableSelection={allowed}
        onSelectionChange={setSelectedCompanies}
        emptyState={({ onAdd }) => (
          <CompanyEmptyState onAdd={onAdd} onImport={openImport} allowed={allowed} />
        )}
        stats={(result) => {
          const metrics = result.metrics || {};
          const total = metrics.total ?? result.pagination?.total ?? 0;
          const active = metrics.active ?? 0;
          const inactive = metrics.inactive ?? Math.max(0, total - active);
          const rows = result.rows || [];
          const sumLinked = rows.reduce((acc, row) => acc + (row.contacts?.length || 0), 0);
          const linkedContacts = metrics.linkedContacts ?? sumLinked;

          return [
            { label: 'Total Companies', value: total, icon: Building2, iconTone: 'bg-[#EAF7EF] text-[#173D30]' },
            { label: 'Active Companies', value: active, icon: CheckCircle2, iconTone: 'bg-emerald-50 text-emerald-700' },
            { label: 'Inactive Companies', value: inactive, icon: XCircle, iconTone: 'bg-slate-100 text-slate-600' },
            { label: 'Linked Contacts', value: linkedContacts, icon: UsersRound, iconTone: 'bg-violet-50 text-violet-700' },
          ];
        }}
        filters={[
          {
            key: 'status',
            label: 'All statuses',
            options: COMPANY_STATUSES.map((value) => ({ value, label: titleCase(value) })),
          },
        ]}
        columns={[
          {
            header: 'Company Name',
            accessorKey: 'name',
            className: 'min-w-[210px]',
            cell: (row) => <CompanyName row={row} />,
          },
          {
            header: 'Domain',
            className: 'min-w-[170px]',
            cell: (row) => {
              const domain = row.domain || cleanDomain(row.website);
              const url = formatUrl(row.website || row.domain);
              if (!domain && !url) return <span className="text-slate-400">—</span>;
              return (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-[200px] items-center gap-1.5 text-sm text-[#173D30] underline-offset-4 hover:underline"
                >
                  <Globe className="size-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{domain || url}</span>
                  <ExternalLink className="size-3 shrink-0 opacity-60" />
                </a>
              );
            },
          },
          {
            header: 'Email',
            accessorKey: 'email',
            className: 'min-w-[200px]',
            cell: (row) =>
              row.email ? (
                <a
                  href={`mailto:${row.email}`}
                  className="inline-flex max-w-[220px] items-center gap-2 text-sm text-slate-600 hover:text-[#173D30]"
                >
                  <Mail className="size-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{row.email}</span>
                </a>
              ) : (
                <span className="text-slate-400">—</span>
              ),
          },
          {
            header: 'Phone',
            accessorKey: 'phone',
            className: 'min-w-[150px]',
            cell: (row) =>
              row.phone ? (
                <a
                  href={`tel:${row.phone}`}
                  className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-[#173D30]"
                >
                  <Phone className="size-3.5 shrink-0 text-slate-400" />
                  {row.phone}
                </a>
              ) : (
                <span className="text-slate-400">—</span>
              ),
          },
          {
            header: 'Status',
            accessorKey: 'status',
            className: 'min-w-[120px]',
            cell: (row) => <StatusBadge status={String(row.status || 'active').toLowerCase()} />,
          },
          {
            header: 'Linked Contacts',
            className: 'min-w-[140px]',
            cell: (row) => {
              const count = row.contacts?.length ?? 0;
              return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                  <UsersRound className="size-3 text-slate-400" />
                  {count} {count === 1 ? 'contact' : 'contacts'}
                </span>
              );
            },
          },
          {
            header: 'Created At',
            accessorKey: 'createdAt',
            className: 'min-w-[130px]',
            cell: (row) => <span className="text-sm text-slate-600">{formatDate(row.createdAt)}</span>,
          },
        ]}
        renderForm={(form, setForm) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Company Name">
              <Input
                required
                placeholder="e.g. Acme Corporation"
                value={form.name || ''}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </Field>
            <Field label="Industry">
              <Input
                placeholder="e.g. Technology, Finance, Retail"
                value={form.industry || ''}
                onChange={(event) => setForm({ ...form, industry: event.target.value })}
              />
            </Field>
            <Field label="Domain">
              <Input
                placeholder="e.g. acme.com"
                value={form.domain || ''}
                onChange={(event) => setForm({ ...form, domain: event.target.value })}
              />
            </Field>
            <Field label="Website">
              <Input
                placeholder="e.g. https://www.acme.com"
                value={form.website || ''}
                onChange={(event) => setForm({ ...form, website: event.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                placeholder="e.g. contact@acme.com"
                value={form.email || ''}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </Field>
            <Field label="Phone">
              <Input
                placeholder="e.g. +1 (555) 123-4567"
                value={form.phone || ''}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </Field>
            <Field label="Address">
              <Input
                placeholder="Street address"
                value={form.address || ''}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
              />
            </Field>
            <Field label="City">
              <Input
                placeholder="City"
                value={form.city || ''}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
              />
            </Field>
            <Field label="State">
              <Input
                placeholder="State / Region"
                value={form.state || ''}
                onChange={(event) => setForm({ ...form, state: event.target.value })}
              />
            </Field>
            <Field label="Country">
              <Input
                placeholder="Country"
                value={form.country || ''}
                onChange={(event) => setForm({ ...form, country: event.target.value })}
              />
            </Field>
            <Field label="Status">
              <select
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                value={form.status || 'ACTIVE'}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                {COMPANY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {titleCase(status)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Notes">
              <Input
                placeholder="Optional notes or details"
                value={form.notes || ''}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </Field>
          </div>
        )}
        onSave={async (form, id) => {
          if (!id) {
            const check = await api
              .post('/companies/check-duplicate', {
                name: form.name,
                email: form.email || undefined,
                phone: form.phone || undefined,
              })
              .then((r) => r.data || r)
              .catch(() => null);

            if (check?.isDuplicate) {
              const proceed = window.confirm(
                `A company matching this record already exists (${check.matchReason || 'Duplicate detected'}). Do you still want to proceed?`
              );
              if (!proceed) return;
            }
          }

          await saveCompany(form, id);
          toast.success(id ? 'Company updated' : 'Company created');
        }}
        rowActions={() => (allowed ? [{ label: 'Delete', onSelect: (row) => setPendingDelete(row) }] : [])}
        detail={(row) => <CompanyDetail row={row} />}
        toolbar={({ selected, clearSelection }) => {
          clearSelectionRef.current = clearSelection;
          if (!selected?.length || !allowed) return null;
          return (
            <AdminBulkSelectionToolbar count={selected.length} noun="companies" onClear={clearSelection}>
              <AdminBulkDeleteButton
                count={selected.length}
                onClick={() => setBulkDeleteOpen(true)}
                loading={deleting}
              />
            </AdminBulkSelectionToolbar>
          );
        }}
      />

      <PermanentDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        recordName={pendingDelete?.name}
        noun="company"
        warningNote="Linked contacts and deals will be unlinked from this company."
        loading={deleting}
        onConfirm={confirmDelete}
      />
      <PermanentDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        count={selectedCompanies.length}
        noun="company"
        warningNote="Selected companies will be permanently removed. Linked contacts and deals will be unlinked."
        loading={deleting}
        onConfirm={confirmBulkDelete}
      />

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      {importOpen && (
        <ImportCompaniesDialog
          fileName={importFileName}
          rows={importRows}
          error={importError}
          result={importResult}
          busy={importBusy}
          progress={importProgress}
          onClose={closeImport}
          onChoose={() => inputRef.current?.click()}
          onImport={runImport}
        />
      )}
    </>
  );
}

function CompanyName({ row }) {
  const name = row.name || 'Unnamed Company';
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF7EF] text-xs font-bold text-[#173D30]">
        {initials || 'CO'}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[#172033]">{name}</span>
        {row.industry && <span className="block truncate text-xs text-slate-400">{row.industry}</span>}
      </span>
    </span>
  );
}

function CompanyDetail({ row }) {
  const domain = row.domain || cleanDomain(row.website);
  const url = formatUrl(row.website || row.domain);
  const contacts = row.contacts || [];
  const deals = row.deals || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-[#F5FAF7] p-4">
        <CompanyName row={row} />
        <StatusBadge status={String(row.status || 'active').toLowerCase()} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Detail
          icon={Globe}
          label="Domain / Website"
          value={
            url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#173D30] hover:underline"
              >
                {domain || url}
                <ExternalLink className="size-3" />
              </a>
            ) : null
          }
        />
        <Detail icon={Mail} label="Email" value={row.email} />
        <Detail icon={Phone} label="Phone" value={row.phone} />
        <Detail
          icon={MapPin}
          label="Location"
          value={[row.address, row.city, row.state, row.country].filter(Boolean).join(', ')}
        />
        <Detail icon={CalendarDays} label="Created At" value={formatDate(row.createdAt)} />
        <Detail icon={UsersRound} label="Linked Contacts" value={`${contacts.length} contact(s)`} />
      </div>

      {row.notes && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-medium text-slate-500">Notes</p>
          <p className="mt-1 text-sm text-slate-700">{row.notes}</p>
        </div>
      )}

      {contacts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Contacts ({contacts.length})
          </h4>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {contacts.slice(0, 5).map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 text-sm">
                <span className="font-medium text-slate-800">
                  {contact.firstName} {contact.lastName}
                </span>
                <span className="text-xs text-slate-500">{contact.email || contact.phone || 'No direct contact'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {deals.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Deals ({deals.length})
          </h4>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {deals.slice(0, 5).map((deal) => (
              <div key={deal.id} className="flex items-center justify-between p-3 text-sm">
                <span className="font-medium text-slate-800">{deal.title || 'Untitled Deal'}</span>
                <span className="text-xs text-slate-500">{deal.amount ? `$${deal.amount}` : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
      <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Icon className="size-3.5" />
        {label}
      </p>
      <div className="mt-1.5 truncate text-sm font-medium text-slate-800">{value || '—'}</div>
    </div>
  );
}

function CompanyEmptyState({ onAdd, onImport, allowed }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#DCE8E0] bg-white px-5 py-12 text-center shadow-sm sm:py-16">
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#EAF7EF] text-[#173D30]">
        <Building2 className="size-8" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-lg font-bold text-[#172033]">No companies found.</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        There are no companies matching your current filters.
      </p>
      {allowed && (
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button
            onClick={onAdd}
            className="h-10 rounded-xl bg-[#173D30] px-4 font-semibold text-white hover:bg-[#205541]"
          >
            Add Company
          </Button>
          <Button
            variant="outline"
            onClick={onImport}
            className="h-10 rounded-xl border-slate-200 px-4 font-semibold"
          >
            <Upload className="mr-2 size-4" />
            Import Companies
          </Button>
        </div>
      )}
    </div>
  );
}

function ImportCompaniesDialog({
  fileName,
  rows,
  error,
  result,
  busy,
  progress,
  onClose,
  onChoose,
  onImport,
}) {
  const validCount = rows.filter((item) => !item.error).length;
  const invalidCount = rows.length - validCount;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-import-title"
        className="flex max-h-[min(88vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 id="company-import-title" className="text-lg font-bold text-[#172033]">
              Import Companies
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload a CSV file through the companies API. Matches by name, email, or phone are safely skipped.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close import"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5 sm:p-6">
          <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-dashed border-emerald-200 bg-[#F5FAF7] p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                <FileSpreadsheet className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">Choose a CSV file</p>
                <p className="text-xs text-slate-500">Up to 1,000 rows and 2 MB</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(
                  'name,domain,website,industry,email,phone,address,city,state,country,status\nAcme Corp,acme.com,https://acme.com,Technology,contact@acme.com,+15551234567,100 Market St,San Francisco,CA,USA,ACTIVE'
                )}`}
                download="company-import-template.csv"
                className="rounded-lg px-3 py-2 text-xs font-semibold text-[#173D30] hover:bg-white"
              >
                Download template
              </a>
              <Button type="button" variant="outline" onClick={onChoose} disabled={busy} className="h-9 rounded-lg">
                <Upload className="mr-2 size-4" />
                Choose CSV
              </Button>
            </div>
          </div>

          {fileName && <p className="truncate text-xs font-medium text-slate-600">Selected: {fileName}</p>}
          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          )}

          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">
                  {validCount} ready
                </span>
                {invalidCount > 0 && (
                  <span className="rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700">
                    {invalidCount} need attention
                  </span>
                )}
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                  {rows.length} rows
                </span>
              </div>
              <div className="max-h-64 overflow-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">Row</th>
                      <th className="px-3 py-2.5">Company</th>
                      <th className="px-3 py-2.5">Domain</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.slice(0, 100).map((item) => (
                      <tr key={item.rowNumber}>
                        <td className="px-3 py-2.5 text-slate-500">{item.rowNumber}</td>
                        <td className="px-3 py-2.5">
                          <span className="block max-w-[180px] truncate font-medium text-slate-700">
                            {item.company.name}
                          </span>
                          <span className="block max-w-[180px] truncate text-slate-500">
                            {item.company.email || item.company.phone || item.company.industry || 'No details'}
                          </span>
                        </td>
                        <td className="max-w-[160px] truncate px-3 py-2.5 text-slate-600">
                          {item.company.domain || item.company.website || '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          {item.error ? (
                            <span className="text-rose-700">{item.error}</span>
                          ) : (
                            <span className="text-emerald-700">Ready</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 100 && (
                  <p className="border-t bg-slate-50 p-2 text-center text-xs text-slate-500">
                    Showing first 100 preview rows; all {rows.length} rows are included in the import.
                  </p>
                )}
              </div>
            </div>
          )}

          {busy && (
            <div className="space-y-2" role="status">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Importing companies…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#20C466] transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Created', value: result.created, color: 'text-emerald-700' },
                  { label: 'Duplicates', value: result.duplicates, color: 'text-amber-700' },
                  { label: 'Failed', value: result.failed, color: 'text-rose-700' },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xl font-bold text-slate-800">{item.value}</p>
                    <p className={`text-xs font-medium ${item.color}`}>{item.label}</p>
                  </div>
                ))}
              </div>
              {result.failures?.length > 0 && (
                <ul className="max-h-24 list-disc space-y-1 overflow-auto pl-4 text-xs text-slate-600">
                  {result.failures.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <p className="text-xs text-slate-500">
            Required column: name. Domain, website, email, phone, and industry are recommended.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy} className="rounded-lg">
              {result ? 'Done' : 'Cancel'}
            </Button>
            {!result && (
              <Button
                type="button"
                onClick={onImport}
                disabled={busy || validCount === 0}
                className="rounded-lg bg-[#173D30] font-semibold text-white hover:bg-[#205541]"
              >
                {busy ? 'Importing…' : `Import ${validCount || ''} Companies`}
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function parseCompanyCsv(text) {
  const records = parseCsv(text);
  if (!records.length) return [];
  const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const headers = records.shift().map(normalize);
  const indexOf = (...names) => headers.findIndex((header) => names.includes(header));
  const nameIndex = indexOf('name', 'companyname', 'company', 'organization');
  if (nameIndex < 0) throw new Error('Add a company name column (e.g. name or companyName) to the CSV.');

  const fieldIndexes = {
    domain: indexOf('domain', 'website', 'url', 'web'),
    website: indexOf('website', 'web', 'domain', 'url'),
    industry: indexOf('industry', 'sector', 'vertical'),
    email: indexOf('email', 'emailaddress', 'companyemail'),
    phone: indexOf('phone', 'phonenumber', 'telephone'),
    address: indexOf('address', 'street', 'streetaddress'),
    city: indexOf('city'),
    state: indexOf('state', 'province'),
    country: indexOf('country'),
    postalCode: indexOf('postalcode', 'zip', 'zipcode', 'pincode'),
    status: indexOf('status', 'companystatus'),
    notes: indexOf('notes', 'description'),
  };

  return records
    .filter((row) => row.some((cell) => String(cell || '').trim()))
    .map((row, offset) => {
      const name = String(row[nameIndex] || '').trim();
      const get = (key) => (fieldIndexes[key] >= 0 ? String(row[fieldIndexes[key]] || '').trim() : '');
      let error = '';
      if (!name) error = 'Company name is required.';
      const email = get('email');
      if (!error && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        error = 'Email address is invalid.';
      }
      const status = get('status').toUpperCase() || 'ACTIVE';
      if (!error && !COMPANY_STATUSES.includes(status)) {
        error = `Unsupported status: ${status}. Must be ACTIVE or INACTIVE.`;
      }

      const domainVal = get('domain');
      const websiteVal = get('website');

      return {
        rowNumber: offset + 2,
        error,
        company: {
          name,
          domain: domainVal || cleanDomain(websiteVal) || undefined,
          website: websiteVal || formatUrl(domainVal) || undefined,
          industry: get('industry') || undefined,
          email: email || undefined,
          phone: get('phone') || undefined,
          address: get('address') || undefined,
          city: get('city') || undefined,
          state: get('state') || undefined,
          country: get('country') || undefined,
          postalCode: get('postalCode') || undefined,
          status,
          notes: get('notes') || undefined,
        },
      };
    });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  const input = String(text || '').replace(/^\uFEFF/, '');
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === '"') {
      if (quoted && input[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(value);
      value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[index + 1] === '\n') index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }
  if (quoted) throw new Error('The CSV contains an unclosed quoted value.');
  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}

function formatUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function cleanDomain(url) {
  if (!url) return '';
  return url.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
}

function titleCase(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function Field({ label, children }) {
  return <Label className="grid gap-1 text-xs">{label}{children}</Label>;
}
