'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Button } from '@/components/common/Button';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import {
  bulkDeleteCustomers,
  crmError,
  customerRelations,
  loadCustomers,
  loadEmployees,
  personName,
  removeCustomer,
  saveCustomer,
  sessionCan,
  subscribeCustomerRefresh,
} from '@/modules/crm/crm-api';
import { PermanentDeleteDialog } from '@/components/common/PermanentDeleteDialog';
import { AdminBulkSelectionToolbar, AdminBulkDeleteButton } from '@/components/admin/bulk-selection';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  Mail,
  MapPin,
  Phone,
  Plus,
  RotateCw,
  Trash2,
  Upload,
  User,
  UsersRound,
  X,
  XCircle,
  Briefcase,
  Check,
} from 'lucide-react';
import api from '../../../../../lib/api';

const CUSTOMER_STATUSES = ['ACTIVE', 'INACTIVE', 'UPCOMING'];
const CUSTOMER_TYPES = ['ENTERPRISE', 'SMB', 'RETAIL', 'INDIVIDUAL', 'PARTNER'];

const blank = {
  name: '',
  companyName: '',
  email: '',
  phone: '',
  customerType: 'ENTERPRISE',
  industry: '',
  status: 'ACTIVE',
  isActive: true,
  assignedEmployeeId: '',
  city: '',
  state: '',
  country: 'India',
  address: '',
  notes: '',
};

export default function CustomersRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [employees, setEmployees] = React.useState([]);
  const [pendingDelete, setPendingDelete] = React.useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [selectedCustomers, setSelectedCustomers] = React.useState([]);

  // Import Dialog states
  const [importOpen, setImportOpen] = React.useState(false);
  const [importRows, setImportRows] = React.useState([]);
  const [importFileName, setImportFileName] = React.useState('');
  const [importError, setImportError] = React.useState('');
  const [importResult, setImportResult] = React.useState(null);
  const [importBusy, setImportBusy] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState(0);

  const fileInputRef = React.useRef(null);
  const clearSelectionRef = React.useRef(null);

  React.useEffect(() => {
    setAllowed(sessionCan('CUSTOMER') || sessionCan('CRM'));
    loadEmployees()
      .then(setEmployees)
      .catch(() => setEmployees([]));
  }, []);

  React.useEffect(() => {
    return subscribeCustomerRefresh(() => setRefreshToken((value) => value + 1));
  }, []);

  const load = React.useCallback(
    (query) =>
      loadCustomers({
        page: query.page,
        limit: 20,
        search: query.search || undefined,
        status: query.status || undefined,
        assignedEmployee: query.assignedEmployee || undefined,
      }),
    []
  );

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await removeCustomer(pendingDelete.id);
      toast.success(`Customer "${pendingDelete.name}" deleted successfully`);
      setPendingDelete(null);
      setRefreshToken((value) => value + 1);
    } catch (err) {
      toast.error(crmError(err));
    } finally {
      setDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (!selectedCustomers.length || deleting) return;
    setDeleting(true);
    try {
      const ids = selectedCustomers.map((c) => c.id);
      const res = await bulkDeleteCustomers(ids);
      const count = res?.deletedCount ?? ids.length;
      toast.success(`${count} customer${count === 1 ? '' : 's'} deleted successfully`);
      clearSelectionRef.current?.();
      setSelectedCustomers([]);
      setBulkDeleteOpen(false);
      setRefreshToken((value) => value + 1);
    } catch (err) {
      toast.error(crmError(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (row) => {
    const nextActive = !Boolean(row.isActive);
    try {
      await api.patch(`/customers/${row.id}`, { isActive: nextActive });
      toast.success(`Customer marked as ${nextActive ? 'Active' : 'Inactive'}`);
      setRefreshToken((value) => value + 1);
    } catch (err) {
      toast.error(crmError(err));
    }
  };

  const handleFile = async (file) => {
    setImportError('');
    setImportResult(null);
    setImportRows([]);
    setImportFileName('');
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
      setImportError('Please choose a CSV file to import customers.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImportError('The CSV file must be 2 MB or smaller.');
      return;
    }
    try {
      const parsed = parseCustomerCsv(await file.text());
      if (!parsed.length) throw new Error('The CSV has a header row but no customer records.');
      if (parsed.length > 1000) throw new Error('Import up to 1,000 customer records per CSV file.');
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
    const failures = importRows
      .filter((item) => item.error)
      .slice(0, 3)
      .map((item) => `Row ${item.rowNumber}: ${item.error}`);

    for (let index = 0; index < validRows.length; index += 1) {
      const item = validRows[index];
      const customer = item.customer;
      const phoneKey = (customer.phone || '').replace(/\D/g, '');
      const emailKey = customer.email?.trim().toLowerCase();
      const localKey = phoneKey || emailKey || customer.name?.trim().toLowerCase();

      try {
        if (localKey && seen.has(localKey)) {
          duplicates += 1;
        } else {
          if (localKey) seen.add(localKey);
          await saveCustomer(customer);
          created += 1;
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
    if (created) toast.success(`${created} customer${created === 1 ? '' : 's'} imported successfully`);
  };

  const closeImport = () => {
    if (importBusy) return;
    setImportOpen(false);
    setImportRows([]);
    setImportFileName('');
    setImportError('');
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openImport = () => {
    setImportOpen(true);
    setImportError('');
    setImportResult(null);
  };

  return (
    <>
      <CrmScreen
        appearance="customers"
        collapsibleFilters
        title="Customers"
        description="Tenant customers, assignment, and related deals, visits, and activities."
        actionLabel="Add Customer"
        canCreate={allowed}
        extraHeaderActions={
          allowed ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"
              onClick={openImport}
            >
              <Upload className="mr-2 size-4" />
              Import Customers
            </Button>
          ) : null
        }
        load={load}
        blank={blank}
        refreshToken={refreshToken}
        enableSelection={allowed}
        onSelectionChange={setSelectedCustomers}
        emptyState={({ onAdd }) => (
          <CustomerEmptyState onAdd={onAdd} onImport={openImport} allowed={allowed} />
        )}
        stats={(result) => {
          const metrics = result.metrics || {};
          const counts = result.counts || {};
          const total = counts.all ?? result.pagination?.total ?? metrics.totalCustomers ?? 0;
          const active = counts.active ?? metrics.activeCustomers ?? 0;
          const inactive = counts.inactive ?? metrics.inactiveCustomers ?? Math.max(0, total - active);
          const upcoming = counts.upcoming ?? 0;

          return [
            { label: 'Total Customers', value: total, icon: UsersRound, iconTone: 'bg-[#EAF7EF] text-[#173D30]' },
            { label: 'Active Customers', value: active, icon: CheckCircle2, iconTone: 'bg-emerald-50 text-emerald-700' },
            { label: 'Inactive Customers', value: inactive, icon: CircleAlert, iconTone: 'bg-slate-100 text-slate-600' },
            { label: 'Upcoming', value: upcoming, icon: CalendarDays, iconTone: 'bg-amber-50 text-amber-700' },
          ];
        }}
        filters={[
          {
            key: 'status',
            label: 'All categories',
            options: [
              { value: '', label: 'All categories' },
              { value: 'ACTIVE', label: 'Active (Plan)' },
              { value: 'INACTIVE', label: 'Inactive (Won)' },
              { value: 'UPCOMING', label: 'Upcoming (Final Call)' },
            ],
          },
          {
            key: 'assignedEmployee',
            label: 'All employees',
            options: [
              { value: '', label: 'All employees' },
              ...employees.map((emp) => ({ value: emp.name, label: emp.name })),
            ],
          },
        ]}
        columns={({ open }) => [
          {
            header: 'Customer',
            accessorKey: 'name',
            className: 'min-w-[220px]',
            cell: (row) => <CustomerName row={row} onOpen={() => open(row)} />,
          },
          {
            header: 'Company',
            accessorKey: 'companyName',
            className: 'min-w-[170px]',
            cell: (row) =>
              row.companyName ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Building2 className="size-3.5 text-slate-400" />
                  <span className="truncate max-w-[150px]">{row.companyName}</span>
                </span>
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
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[#173D30]"
                >
                  <Phone className="size-3.5 shrink-0 text-slate-400" />
                  <span>{row.phone}</span>
                </a>
              ) : (
                <span className="text-slate-400">—</span>
              ),
          },
          {
            header: 'Email',
            accessorKey: 'email',
            className: 'min-w-[190px]',
            cell: (row) =>
              row.email ? (
                <a
                  href={`mailto:${row.email}`}
                  className="inline-flex max-w-[180px] items-center gap-1.5 text-sm text-slate-600 transition hover:text-[#173D30]"
                >
                  <Mail className="size-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{row.email}</span>
                </a>
              ) : (
                <span className="text-slate-400">—</span>
              ),
          },
          {
            header: 'Type',
            accessorKey: 'customerType',
            className: 'min-w-[120px]',
            cell: (row) =>
              row.customerType ? (
                <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  {row.customerType}
                </span>
              ) : (
                <span className="text-slate-400">—</span>
              ),
          },
          {
            header: 'Assigned',
            className: 'min-w-[160px]',
            cell: (row) => {
              const assignedName = personName(row.assignedEmployee) || row.assignedEmployee;
              if (!assignedName || assignedName === 'Unassigned') {
                return <span className="text-slate-400 text-xs">Unassigned</span>;
              }
              return (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <span className="flex size-6 items-center justify-center rounded-full bg-[#EAF7EF] text-[10px] font-bold text-[#173D30]">
                    {assignedName[0]?.toUpperCase() || 'U'}
                  </span>
                  <span className="truncate max-w-[120px]">{assignedName}</span>
                </span>
              );
            },
          },
          {
            header: 'Category',
            className: 'min-w-[130px]',
            cell: (row) => (
              <StatusBadge status={String(row.customerStatus || row.status || 'inactive').toLowerCase()} />
            ),
          },
          {
            header: 'Status',
            className: 'min-w-[110px]',
            cell: (row) => {
              const isActive = row.isActive !== false;
              return (
                <button
                  type="button"
                  onClick={() => handleToggleActive(row)}
                  title={`Click to mark as ${isActive ? 'Inactive' : 'Active'}`}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                  />
                  {isActive ? 'Active' : 'Inactive'}
                </button>
              );
            },
          },
        ]}
        renderForm={(form, setForm) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Customer Name *">
              <Input
                required
                placeholder="e.g. Acme Enterprise"
                value={form.name || ''}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </Field>
            <Field label="Company Name">
              <Input
                placeholder="e.g. Acme Corp"
                value={form.companyName || ''}
                onChange={(event) => setForm({ ...form, companyName: event.target.value })}
              />
            </Field>
            <Field label="Phone Number *">
              <Input
                required
                placeholder="e.g. +91 98765 43210"
                value={form.phone || ''}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </Field>
            <Field label="Email Address">
              <Input
                type="email"
                placeholder="e.g. contact@acme.com"
                value={form.email || ''}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </Field>
            <Field label="Customer Type">
              <select
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                value={form.customerType || 'ENTERPRISE'}
                onChange={(event) => setForm({ ...form, customerType: event.target.value })}
              >
                {CUSTOMER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Industry">
              <Input
                placeholder="e.g. Information Technology"
                value={form.industry || ''}
                onChange={(event) => setForm({ ...form, industry: event.target.value })}
              />
            </Field>
            <Field label="Category Status">
              <select
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                value={form.status || 'ACTIVE'}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                {CUSTOMER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {titleCase(status)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Assigned Employee">
              <select
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                value={form.assignedEmployeeId || ''}
                onChange={(event) => setForm({ ...form, assignedEmployeeId: event.target.value })}
              >
                <option value="">Unassigned</option>
                {employees.map((employee) => (
                  <option key={employee.recordId} value={employee.recordId}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="City">
              <Input
                placeholder="e.g. Mumbai"
                value={form.city || ''}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
              />
            </Field>
            <Field label="State / Province">
              <Input
                placeholder="e.g. Maharashtra"
                value={form.state || ''}
                onChange={(event) => setForm({ ...form, state: event.target.value })}
              />
            </Field>
            <Field label="Street Address">
              <Input
                placeholder="e.g. 101, Business Park, BKC"
                value={form.address || ''}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
              />
            </Field>
            <Field label="Account Status">
              <select
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                value={form.isActive !== false ? 'true' : 'false'}
                onChange={(event) => setForm({ ...form, isActive: event.target.value === 'true' })}
              >
                <option value="true">Active Account</option>
                <option value="false">Inactive Account</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <Input
                  placeholder="Optional details, requirements, or custom notes"
                  value={form.notes || ''}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                />
              </Field>
            </div>
          </div>
        )}
        onSave={async (form, id) => {
          await saveCustomer(form, id);
          toast.success(id ? 'Customer updated successfully' : 'Customer created successfully');
        }}
        rowActions={() =>
          allowed
            ? [
                {
                  label: 'Toggle Active',
                  onSelect: (row) => handleToggleActive(row),
                },
                {
                  label: 'Delete',
                  onSelect: (row) => setPendingDelete(row),
                },
              ]
            : []
        }
        detail={(row) => <CustomerDetail row={row} onEdit={() => {}} />}
        toolbar={({ selected, clearSelection }) => {
          clearSelectionRef.current = clearSelection;
          if (!selected?.length || !allowed) return null;
          return (
            <AdminBulkSelectionToolbar count={selected.length} noun="customers" onClear={clearSelection}>
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
        noun="customer"
        warningNote="All related data owned by this customer will be permanently removed."
        loading={deleting}
        onConfirm={confirmDelete}
      />

      <PermanentDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        count={selectedCustomers.length}
        noun="customer"
        warningNote="Selected customers and all their related data will be permanently removed."
        loading={deleting}
        onConfirm={confirmBulkDelete}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {importOpen && (
        <ImportCustomersDialog
          fileName={importFileName}
          rows={importRows}
          error={importError}
          result={importResult}
          busy={importBusy}
          progress={importProgress}
          onClose={closeImport}
          onChoose={() => fileInputRef.current?.click()}
          onImport={runImport}
        />
      )}
    </>
  );
}

function CustomerName({ row, onOpen }) {
  const name = row.name || 'Unnamed Customer';
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen();
      }}
      className="flex min-w-0 cursor-pointer items-center gap-3 text-left group"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF7EF] text-xs font-bold text-[#173D30] transition group-hover:bg-[#d9f2e3]">
        {initials || 'CU'}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[#172033] group-hover:text-[#173D30] group-hover:underline">
          {name}
        </span>
        {row.companyName && (
          <span className="block truncate text-xs text-slate-400">{row.companyName}</span>
        )}
      </span>
    </div>
  );
}

function CustomerDetail({ row }) {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [related, setRelated] = React.useState({ deals: [], visits: [], activities: [] });
  const [loadingRelated, setLoadingRelated] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let active = true;
    setLoadingRelated(true);
    customerRelations(row.id)
      .then((data) => {
        if (active) setRelated(data);
      })
      .catch((err) => {
        if (active) setError(crmError(err));
      })
      .finally(() => {
        if (active) setLoadingRelated(false);
      });
    return () => {
      active = false;
    };
  }, [row.id]);

  const assignedName = personName(row.assignedEmployee) || row.assignedEmployee || 'Unassigned';

  return (
    <div className="space-y-4">
      {/* Customer Header Card */}
      <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-[#F5FAF7] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-bold text-[#173D30] shadow-sm">
            {(row.name || 'CU')
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0])
              .join('')
              .toUpperCase()}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-[#172033]">{row.name}</h3>
            <p className="truncate text-xs text-slate-500">
              {row.companyName ? `${row.companyName} · ` : ''}
              {row.customerType || 'Customer'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={String(row.customerStatus || row.status || 'inactive').toLowerCase()} />
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              row.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {row.isActive !== false ? 'Active Account' : 'Inactive Account'}
          </span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {row.phone && (
          <a
            href={`tel:${row.phone}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#173D30]"
          >
            <Phone className="size-3.5 text-slate-400" />
            Call {row.phone}
          </a>
        )}
        {row.email && (
          <a
            href={`mailto:${row.email}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#173D30]"
          >
            <Mail className="size-3.5 text-slate-400" />
            Email {row.email}
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'deals', label: `Deals (${related.deals?.length || 0})` },
          { id: 'visits', label: `Visits (${related.visits?.length || 0})` },
          { id: 'activities', label: `Activities (${related.activities?.length || 0})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-3 py-2 text-xs font-semibold transition ${
              activeTab === tab.id
                ? 'border-[#173D30] text-[#173D30]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail icon={Phone} label="Phone Number" value={row.phone} />
            <Detail icon={Mail} label="Email Address" value={row.email} />
            <Detail icon={Building2} label="Company Name" value={row.companyName} />
            <Detail icon={Briefcase} label="Customer Type" value={row.customerType} />
            <Detail icon={User} label="Assigned Employee" value={assignedName} />
            <Detail icon={MapPin} label="Location" value={[row.address, row.city, row.state, row.country].filter(Boolean).join(', ')} />
            <Detail icon={CalendarDays} label="Created At" value={formatDate(row.createdAt)} />
            <Detail icon={Clock} label="Category Status" value={titleCase(row.status || 'ACTIVE')} />
          </div>

          {row.notes && (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Notes</p>
              <p className="mt-1 text-sm text-slate-700 leading-relaxed">{row.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'deals' && (
        <div className="space-y-2">
          {error && <p className="text-xs text-rose-600">{error}</p>}
          {loadingRelated ? (
            <p className="py-6 text-center text-xs text-slate-500">Loading deals…</p>
          ) : related.deals?.length > 0 ? (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {related.deals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between p-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-800">{deal.title || 'Untitled Deal'}</p>
                    <p className="text-xs text-slate-500">Stage: {deal.stage?.name || deal.stage || 'In Progress'}</p>
                  </div>
                  <span className="font-bold text-[#173D30]">
                    {deal.amount ? `₹${Number(deal.amount).toLocaleString()}` : '—'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
              No deals associated with this customer.
            </div>
          )}
        </div>
      )}

      {activeTab === 'visits' && (
        <div className="space-y-2">
          {error && <p className="text-xs text-rose-600">{error}</p>}
          {loadingRelated ? (
            <p className="py-6 text-center text-xs text-slate-500">Loading visits…</p>
          ) : related.visits?.length > 0 ? (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {related.visits.map((visit) => (
                <div key={visit.id} className="flex items-center justify-between p-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-800">{visit.purpose || 'Client Visit'}</p>
                    <p className="text-xs text-slate-500">
                      {visit.location || visit.address || 'Location recorded'} · {formatDate(visit.date)}
                    </p>
                  </div>
                  <StatusBadge status={String(visit.status || 'scheduled').toLowerCase()} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
              No scheduled or completed visits for this customer.
            </div>
          )}
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="space-y-2">
          {error && <p className="text-xs text-rose-600">{error}</p>}
          {loadingRelated ? (
            <p className="py-6 text-center text-xs text-slate-500">Loading activities…</p>
          ) : related.activities?.length > 0 ? (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {related.activities.map((act) => (
                <div key={act.id} className="p-3 text-sm">
                  <p className="font-medium text-slate-800">{act.description || act.title || 'Customer Activity'}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{formatDate(act.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
              No logged activities for this customer.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Icon className="size-3.5 text-slate-400" />
        {label}
      </p>
      <div className="mt-1 truncate text-sm font-semibold text-slate-800">{value || '—'}</div>
    </div>
  );
}

function CustomerEmptyState({ onAdd, onImport, allowed }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#DCE8E0] bg-white px-5 py-12 text-center shadow-sm sm:py-16">
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#EAF7EF] text-[#173D30]">
        <UsersRound className="size-8" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-lg font-bold text-[#172033]">No customers found</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        There are no customers matching your search or filters.
      </p>
      {allowed && (
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button
            onClick={onAdd}
            className="h-10 rounded-xl bg-[#173D30] px-4 font-semibold text-white hover:bg-[#205541]"
          >
            <Plus className="mr-2 size-4" />
            Add Customer
          </Button>
          <Button
            variant="outline"
            onClick={onImport}
            className="h-10 rounded-xl border-slate-200 px-4 font-semibold"
          >
            <Upload className="mr-2 size-4" />
            Import Customers
          </Button>
        </div>
      )}
    </div>
  );
}

function ImportCustomersDialog({
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
        aria-labelledby="customer-import-title"
        className="flex max-h-[min(88vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 id="customer-import-title" className="text-lg font-bold text-[#172033]">
              Import Customers
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload a CSV file of customer records. Phone number is required for each customer.
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
                <p className="text-xs text-slate-500">Up to 1,000 records, 2 MB max</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(
                  'name,companyName,email,phone,customerType,industry,status,city,address,notes\nAcme Solutions,Acme Group,contact@acme.com,+919876543210,ENTERPRISE,Technology,ACTIVE,Mumbai,101 BKC,Enterprise account'
                )}`}
                download="customer-import-template.csv"
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
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
            >
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
                      <th className="px-3 py-2.5">Customer</th>
                      <th className="px-3 py-2.5">Phone</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.slice(0, 100).map((item) => (
                      <tr key={item.rowNumber}>
                        <td className="px-3 py-2.5 text-slate-500">{item.rowNumber}</td>
                        <td className="px-3 py-2.5">
                          <span className="block max-w-[180px] truncate font-medium text-slate-700">
                            {item.customer.name}
                          </span>
                          <span className="block max-w-[180px] truncate text-slate-500">
                            {item.customer.companyName || item.customer.email || 'No company'}
                          </span>
                        </td>
                        <td className="max-w-[140px] truncate px-3 py-2.5 text-slate-600">
                          {item.customer.phone || '—'}
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
                <span>Importing customers…</span>
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
            Required columns: name, phone. Company, email, and type are optional.
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
                {busy ? 'Importing…' : `Import ${validCount || ''} Customers`}
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function parseCustomerCsv(text) {
  const records = parseCsv(text);
  if (!records.length) return [];
  const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const headers = records.shift().map(normalize);
  const indexOf = (...names) => headers.findIndex((header) => names.includes(header));
  const nameIndex = indexOf('name', 'customername', 'fullname', 'client');
  if (nameIndex < 0) throw new Error('Add a customer name column (e.g. name or customerName) to the CSV.');

  const fieldIndexes = {
    companyName: indexOf('companyname', 'company', 'organization', 'businessname'),
    email: indexOf('email', 'emailaddress'),
    phone: indexOf('phone', 'phonenumber', 'mobile', 'telephone'),
    customerType: indexOf('customertype', 'type', 'segment'),
    industry: indexOf('industry', 'sector'),
    status: indexOf('status', 'category'),
    city: indexOf('city'),
    state: indexOf('state'),
    country: indexOf('country'),
    address: indexOf('address', 'street'),
    notes: indexOf('notes', 'description', 'remarks'),
  };

  return records
    .filter((row) => row.some((cell) => String(cell || '').trim()))
    .map((row, offset) => {
      const name = String(row[nameIndex] || '').trim();
      const get = (key) => (fieldIndexes[key] >= 0 ? String(row[fieldIndexes[key]] || '').trim() : '');
      let error = '';
      if (!name) error = 'Customer name is required.';
      const phone = get('phone');
      if (!error && !phone) {
        error = 'Phone number is required.';
      }
      const email = get('email');
      if (!error && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        error = 'Email address is invalid.';
      }

      const status = get('status').toUpperCase() || 'ACTIVE';

      return {
        rowNumber: offset + 2,
        error,
        customer: {
          name,
          companyName: get('companyName') || undefined,
          email: email || undefined,
          phone,
          customerType: get('customerType').toUpperCase() || 'ENTERPRISE',
          industry: get('industry') || undefined,
          status,
          city: get('city') || undefined,
          state: get('state') || undefined,
          country: get('country') || 'India',
          address: get('address') || undefined,
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
  return <Label className="grid gap-1.5 text-xs font-semibold text-slate-700">{label}{children}</Label>;
}
