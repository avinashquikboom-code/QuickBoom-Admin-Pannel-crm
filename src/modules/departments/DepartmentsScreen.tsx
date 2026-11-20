'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, DataTableColumnHeader, AdminRowActions } from '@/components/data-table';
import { KpiGrid } from '@/components/common/KpiCard';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faBuilding, faPlus, faDownload, faRotate, faEllipsis, faEye, faPenToSquare, faTrash, faToggleOn, faBoxArchive, faUsers, faCheck, faCircleMinus, faCalendar, faEyeSlash, type IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { readSession } from '@/lib/auth/admin-session';
import { useAuthStore } from '../../../lib/store';
import { isUserAdmin } from '../../../lib/access-control';
import { DepartmentDrawer } from './DepartmentDrawer';
import { apiError, bulkDeleteDepartments, changeDepartmentStatus, deleteDepartment, exportDepartments, listDepartments, type Department } from './department-api';
import { PermanentDeleteDialog } from '@/components/common/PermanentDeleteDialog';
import { AdminBulkSelectionToolbar, AdminBulkDeleteButton } from '@/components/admin/bulk-selection';

const DepartmentTable = DataTable as unknown as React.ComponentType<{
  columns: ColumnDef<Department>[];
  data: Department[];
  enableRowSelection: boolean;
  onSelectionChange?: (rows: Department[]) => void;
  selectionResetToken?: number;
  isLoading: boolean;
  searchPlaceholder: string;
  emptyState: React.ReactNode;
  caption: string;
  pageSize: number;
  className: string;
}>;

function Icon({ icon, className }: { icon: IconDefinition; className?: string }) {
  return <FontAwesomeIcon icon={icon} size={undefined} label={undefined} className={className} />;
}

const StatsGrid = KpiGrid as React.ComponentType<{ cards: Array<Record<string, unknown>> }>;
const StatusTabs = SegmentedTabs as React.ComponentType<{
  tabs: Array<{ label: string; value: string; count?: string | number }>;
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
}>;
const DeleteDialog = PermanentDeleteDialog as unknown as React.ComponentType<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  recordName?: string;
  count?: number;
  noun?: string;
  warningNote?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}>;
const BulkToolbar = AdminBulkSelectionToolbar as unknown as React.ComponentType<{
  count: number;
  noun?: string;
  children: React.ReactNode;
  onClear: () => void;
}>;
const BulkDeleteBtn = AdminBulkDeleteButton as unknown as React.ComponentType<{
  count?: number;
  label?: string;
  loading?: boolean;
  onClick: () => void;
}>;

type Filter = 'all' | 'active' | 'inactive' | 'archived';
type Confirmation = { record: Department; action: 'delete' | 'status' | 'archive' };

function Status({ active }: { active: boolean }) {
  return (
    <Badge render={undefined} className={`h-auto gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${active ? 'border-emerald-200/80 bg-[#E8F8EE] text-[#169F4D]' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
      <span className={`size-1.5 rounded-full ${active ? 'bg-[#1FC45B]' : 'bg-slate-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </Badge>
  );
}

function MobileLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-400 md:hidden">{children}</span>;
}

function AnimatedMetric({ value, loading }: { value: number | string; loading: boolean }) {
  const [display, setDisplay] = React.useState<number | string>(value);
  const [highlight, setHighlight] = React.useState(false);
  const previous = React.useRef<number | string>(value);
  React.useEffect(() => {
    if (loading || typeof value !== 'number' || typeof previous.current !== 'number' || previous.current === value) {
      setDisplay(value);
      previous.current = value;
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
    } else {
      const start = previous.current;
      const duration = 420;
      const startedAt = performance.now();
      let frame = 0;
      const step = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        setDisplay(Math.round(start + (value - start) * progress));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
      setHighlight(true);
      const timer = window.setTimeout(() => setHighlight(false), 700);
      previous.current = value;
      return () => { cancelAnimationFrame(frame); window.clearTimeout(timer); };
    }
    previous.current = value;
  }, [value, loading]);
  return <span className={`inline-block rounded-md transition-colors duration-300 motion-reduce:transition-none ${highlight ? 'bg-emerald-50 text-[#169F4D]' : ''}`}>{loading ? '—' : display}</span>;
}

export function DepartmentsScreen() {
  const [records, setRecords] = React.useState<Department[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);
  const [filter, setFilter] = React.useState<Filter>('all');
  const [mobileSort, setMobileSort] = React.useState('name');
  const authUser = useAuthStore((state) => state.user);
  const [sessionUser, setSessionUser] = React.useState<unknown>(null);
  const [drawer, setDrawer] = React.useState<{ id: number | null; mode: 'create' | 'edit' | 'view' } | null>(null);
  const [confirmation, setConfirmation] = React.useState<Confirmation | null>(null);
  const [selectedDepartments, setSelectedDepartments] = React.useState<Department[]>([]);
  const [selectionResetToken, setSelectionResetToken] = React.useState(0);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [mutating, setMutating] = React.useState(false);
  const mutationLock = React.useRef(false);
  const [actionError, setActionError] = React.useState('');
  const [visibleColumns, setVisibleColumns] = React.useState({ code: true, employeesCount: true, isActive: true, createdAt: true });

  React.useEffect(() => {
    setSessionUser(readSession()?.user ?? null);
  }, [authUser]);
  const canManage = isUserAdmin(authUser) || isUserAdmin(sessionUser);

  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    listDepartments(controller.signal)
      .then(setRecords)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setRecords([]);
          setError(apiError(err));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refresh]);

  const counts = React.useMemo(() => ({
    all: records.length,
    active: records.filter((department) => department.isActive).length,
    inactive: records.filter((department) => !department.isActive).length,
    archived: 0,
    employees: records.reduce((sum, department) => sum + department.employeesCount, 0),
  }), [records]);

  const filtered = React.useMemo(() => {
    const visible = records.filter((department) => {
      if (filter === 'archived') return false;
      if (filter === 'all') return true;
      return department.isActive === (filter === 'active');
    });
    return visible.sort((a, b) => {
      if (mobileSort === 'employees') return b.employeesCount - a.employeesCount;
      if (mobileSort === 'code') return a.code.localeCompare(b.code);
      return a.name.localeCompare(b.name) * (mobileSort === 'name-desc' ? -1 : 1);
    });
  }, [records, filter, mobileSort]);

  const ask = React.useCallback((record: Department, action: Confirmation['action']) => {
    setActionError('');
    setConfirmation({ record, action });
  }, []);

  async function confirmAction() {
    if (!confirmation || confirmation.action === 'archive' || mutationLock.current || !canManage) return;
    mutationLock.current = true;
    setMutating(true);
    setActionError('');
    try {
      if (confirmation.action === 'delete') toast.success(await deleteDepartment(confirmation.record.id));
      else {
        await changeDepartmentStatus(confirmation.record.id, !confirmation.record.isActive);
        toast.success(`Department ${confirmation.record.isActive ? 'deactivated' : 'activated'}`);
      }
      setConfirmation(null);
      setRefresh((value) => value + 1);
    } catch (err) {
      setActionError(apiError(err));
    } finally {
      mutationLock.current = false;
      setMutating(false);
    }
  }

  async function confirmBulkDelete() {
    if (!selectedDepartments.length || mutationLock.current || !canManage) return;
    mutationLock.current = true;
    setMutating(true);
    setActionError('');
    try {
      const ids = selectedDepartments.map((d) => d.id);
      const res = await bulkDeleteDepartments(ids);
      toast.success(res.message || 'Department deletion request completed.');
      if (res.blockedDetails?.length) {
        toast.error(res.blockedDetails.map((item) => `#${item.id}: ${item.reason}`).join('\n'));
      }
      setSelectedDepartments([]);
      setSelectionResetToken((v) => v + 1);
      setBulkDeleteOpen(false);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      mutationLock.current = false;
      setMutating(false);
    }
  }

  const columns = React.useMemo<ColumnDef<Department>[]>(() => [
    {
      id: 'select',
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all departments on this page"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={!table.getIsAllPageRowsSelected() && table.getIsSomePageRowsSelected()}
          onCheckedChange={(checked: boolean) => table.toggleAllPageRowsSelected(!!checked)}
          className="border-slate-300"
        />
      ),
      cell: ({ row }) => (
        <label className="flex items-center gap-2">
          <Checkbox
            aria-label={`Select ${row.original.name}`}
            checked={row.getIsSelected()}
            onCheckedChange={(checked: boolean) => row.toggleSelected(!!checked)}
            className="border-slate-300"
          />
          <span className="text-xs text-slate-400 md:hidden">Select department</span>
        </label>
      ),
      meta: { className: 'max-md:col-span-2' },
    },
    {
      accessorKey: 'name',
      enableHiding: false,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Department Name" className="" />,
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#5EC269]/25 bg-[#E8F8EE] text-[#169F4D]">
            <Icon icon={faBuilding} className="size-4 text-[#5EC269]" />
          </div>
          <div className="min-w-0">
            <button type="button" onClick={() => setDrawer({ id: row.original.id, mode: 'view' })} className="truncate text-left text-sm font-semibold text-[#172033] hover:text-[#169F4D] focus-visible:underline">
              {row.original.name}
            </button>
            <p className="mt-0.5 line-clamp-1 max-w-sm text-[11px] leading-relaxed text-slate-400">
              {row.original.description || 'No description added.'}
            </p>
          </div>
        </div>
      ),
      meta: { className: 'min-w-0 md:min-w-[240px] max-md:col-span-2' },
    },
    {
      accessorKey: 'code',
      meta: { className: visibleColumns.code ? '' : 'hidden', headClassName: visibleColumns.code ? '' : 'hidden' },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Department Code" className="" />,
      cell: ({ row }) => (
        <>
          <MobileLabel>Department Code</MobileLabel>
          <Badge render={undefined} variant="outline" className="h-auto rounded-md border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] font-semibold text-slate-700">
            {row.original.code}
          </Badge>
        </>
      ),
    },
    {
      accessorKey: 'employeesCount',
      meta: { className: visibleColumns.employeesCount ? '' : 'hidden', headClassName: visibleColumns.employeesCount ? '' : 'hidden' },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Employees" className="" />,
      cell: ({ row }) => (
        <>
          <MobileLabel>Employees</MobileLabel>
          <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
            {row.original.employeesCount}
          </span>
        </>
      ),
    },
    {
      accessorKey: 'isActive',
      meta: { className: visibleColumns.isActive ? '' : 'hidden', headClassName: visibleColumns.isActive ? '' : 'hidden' },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" className="" />,
      cell: ({ row }) => (
        <>
          <MobileLabel>Status</MobileLabel>
          <Status active={row.original.isActive} />
        </>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created Date" className="" />,
      cell: ({ row }) => <><MobileLabel>Created Date</MobileLabel><span className="text-xs text-slate-600">{new Date(row.original.createdAt).toLocaleDateString()}</span></>,
      meta: { className: visibleColumns.createdAt ? '' : 'hidden', headClassName: visibleColumns.createdAt ? '' : 'hidden' },
    },
    {
      id: 'actions',
      enableHiding: false,
      header: 'Actions',
      cell: ({ row }) => (
        <AdminRowActions
          row={row}
          recordName={row.original.name}
          disabled={mutating || loading}
          onView={() => setDrawer({ id: row.original.id, mode: 'view' })}
          viewLabel="View Details"
          onEdit={canManage ? () => setDrawer({ id: row.original.id, mode: 'edit' }) : undefined}
          editLabel="Edit Department"
          customActions={canManage ? [
            {
              label: 'Change Status',
              icon: faToggleOn,
              onClick: () => ask(row.original, 'status'),
            },
            {
              label: 'Archive Department',
              icon: faBoxArchive,
              onClick: () => ask(row.original, 'archive'),
            },
          ] : []}
          onDelete={canManage ? () => ask(row.original, 'delete') : undefined}
          deleteLabel="Delete Department"
          confirmDelete={false}
        />
      ),
      meta: { className: 'max-md:col-span-2 max-md:flex max-md:justify-end max-md:border-t max-md:border-slate-100' },
    },
  ], [ask, canManage, mutating, loading, visibleColumns]);

  const countLabel = (value: number) => (loading || error ? '—' : value);
  const tabs = [
    { label: 'All', value: 'all', count: countLabel(counts.all) },
    { label: 'Active', value: 'active', count: countLabel(counts.active) },
    { label: 'Inactive', value: 'inactive', count: countLabel(counts.inactive) },
    { label: 'Archived', value: 'archived', count: countLabel(counts.archived) },
  ];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Departments"
        category="Master Management"
        icon={faBuilding}
        description="Manage departments, organize teams and configure organizational structure."
        actions={(
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button
              variant="outline"
              className="h-9 border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs"
              title="Export records in the selected status tab"
              disabled={loading || !!error || filtered.length === 0}
              onClick={() => {
                exportDepartments(filtered);
                toast.success('Departments exported');
              }}
            >
              <Icon icon={faDownload} className="size-3.5 text-slate-500" />
              Export CSV
            </Button>
            {canManage && (
              <Button className="h-9 bg-[#1FC45B] text-xs font-bold text-white hover:bg-[#169F4D]" onClick={() => setDrawer({ id: null, mode: 'create' })}>
                <Icon icon={faPlus} className="size-3.5" />
                Add Department
              </Button>
            )}
          </div>
        )}
      />

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
      <StatsGrid
        cards={[
          { title: 'Total Departments', value: <AnimatedMetric value={counts.all} loading={loading || !!error} />, description: 'Records returned by the department API', icon: faBuilding },
          { title: 'Active Departments', value: <AnimatedMetric value={counts.active} loading={loading || !!error} />, description: 'Currently operational', icon: faCheck, iconColor: 'text-[#169F4D]', iconBg: 'border-[#5EC269]/20 bg-[#E8F8EE]' },
          { title: 'Inactive Departments', value: <AnimatedMetric value={counts.inactive} loading={loading || !!error} />, description: 'Marked inactive', icon: faCircleMinus, iconColor: 'text-slate-500', iconBg: 'border-slate-200 bg-slate-50' },
          { title: 'Total Assigned Employees', value: <AnimatedMetric value={counts.employees} loading={loading || !!error} />, description: 'Assigned across listed departments', icon: faUsers },
        ]}
      />
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusTabs tabs={tabs} value={filter} onChange={(value) => setFilter(value as Filter)} ariaLabel="Department status" className="max-w-full" />
        <Button variant="outline" className="h-9 gap-2 self-start bg-white text-xs" disabled={loading || mutating} onClick={() => setRefresh((value) => value + 1)}>
          <Icon icon={faRotate} className={`size-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <section aria-label="Department results" aria-busy={loading} className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" className="h-8 gap-2 bg-white text-xs"><Icon icon={faEyeSlash} className="size-3" /> Columns</Button>} />
            <DropdownMenuContent align="end" className="w-48 bg-white">
              {([['code', 'Department Code'], ['employeesCount', 'Employees'], ['isActive', 'Status'], ['createdAt', 'Created Date']] as const).map(([key, label]) => (
                <DropdownMenuCheckboxItem key={key} checked={visibleColumns[key]} onCheckedChange={(checked: any) => setVisibleColumns((current) => ({ ...current, [key]: Boolean(checked) }))}>{label}</DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="md:hidden">
          <Select value={mobileSort} onValueChange={(value: string | null) => { if (value) setMobileSort(value); }}>
            <SelectTrigger aria-label="Sort departments" className="w-full bg-white"><SelectValue className="" /></SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="name" className="text-sm">Name: A–Z</SelectItem>
              <SelectItem value="name-desc" className="text-sm">Name: Z–A</SelectItem>
              <SelectItem value="code" className="text-sm">Department code</SelectItem>
              <SelectItem value="employees" className="text-sm">Most employees</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {selectedDepartments.length > 0 && canManage && (
          <BulkToolbar
            count={selectedDepartments.length}
            noun="departments"
            onClear={() => {
              setSelectedDepartments([]);
              setSelectionResetToken((v) => v + 1);
            }}
          >
            <BulkDeleteBtn
              count={selectedDepartments.length}
              onClick={() => setBulkDeleteOpen(true)}
              loading={mutating}
            />
          </BulkToolbar>
        )}
        {error ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <h3 className="font-semibold text-rose-800">Unable to load departments</h3>
            <p className="mt-2 text-sm text-rose-700">{error}</p>
            <Button variant="outline" className="mt-4 bg-white" onClick={() => setRefresh((value) => value + 1)}>Try again</Button>
          </div>
        ) : (
          <DepartmentTable
            key={`${filter}-${refresh}-${mobileSort}`}
            columns={columns}
            data={filtered}
            enableRowSelection
            onSelectionChange={(selected) => setSelectedDepartments(selected)}
            selectionResetToken={selectionResetToken}
            isLoading={loading}
            searchPlaceholder="Search departments or codes…"
            emptyState={filter === 'archived' ? (
              <div className="py-8">
                <Icon icon={faBoxArchive} className="mx-auto mb-3 size-7 text-slate-300" />
                <p className="font-semibold text-slate-700">No archived departments</p>
                <p className="mx-auto mt-1 max-w-md text-slate-500">The department API stores Active and Inactive only. Archived is shown so the count stays accurate: there are no archived records to load.</p>
              </div>
            ) : (
              <div className="py-8">
                <Icon icon={faBuilding} className="mx-auto mb-3 size-7 text-slate-300" />
                <p className="font-semibold text-slate-700">No departments found</p>
                <p className="mt-1 text-slate-500">Try another search or status filter, or add a department.</p>
              </div>
            )}
            caption="Departments directory"
            pageSize={10}
            className="min-w-0 overflow-hidden [&_td]:whitespace-normal max-md:[&_thead]:sr-only max-md:[&_table]:block max-md:[&_tbody]:block max-md:[&_tbody_tr]:mb-3 max-md:[&_tbody_tr]:grid max-md:[&_tbody_tr]:grid-cols-2 max-md:[&_tbody_tr]:gap-x-1 max-md:[&_tbody_tr]:rounded-xl max-md:[&_tbody_tr]:border max-md:[&_tbody_tr]:border-slate-200 max-md:[&_tbody_tr]:p-3 max-md:[&_td]:block max-md:[&_td]:min-w-0 max-md:[&_td]:border-0 max-md:[&_td]:px-2 max-md:[&_td]:py-2 max-md:[&_td[colspan]]:col-span-2"
          />
        )}
      </section>

      {drawer && (
        <DepartmentDrawer
          key={`${drawer.mode}-${drawer.id}`}
          {...drawer}
          onClose={() => setDrawer(null)}
          onSaved={() => {
            setDrawer(null);
            setRefresh((value) => value + 1);
          }}
        />
      )}

      <DeleteDialog
        open={Boolean(confirmation && confirmation.action === 'delete')}
        onOpenChange={(open: boolean) => { if (!open && !mutationLock.current) setConfirmation(null); }}
        recordName={confirmation?.record?.name}
        noun="department"
        warningNote="If employees are assigned, the department will be set to Inactive instead. Otherwise it will be permanently deleted and linked designations will be unassigned."
        loading={mutating}
        onConfirm={confirmAction}
      />

      <DeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        count={selectedDepartments.length}
        noun="department"
        warningNote="Departments with active employees will be set to Inactive to preserve employee organizational history."
        loading={mutating}
        onConfirm={confirmBulkDelete}
      />

      <Dialog open={Boolean(confirmation && confirmation.action !== 'delete')} onOpenChange={(open: boolean) => { if (!open && !mutationLock.current) setConfirmation(null); }}>
        <DialogContent className="sm:max-w-md" showCloseButton={!mutating}>
          <DialogHeader className="pr-5">
            <DialogTitle className="text-lg">
              {confirmation?.action === 'archive' ? 'Archive department?' : 'Change department status?'}
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              {confirmation?.action === 'archive'
                ? `“${confirmation.record.name}” cannot be archived. The department API only supports Active and Inactive.`
                : `Set “${confirmation?.record.name}” to ${confirmation?.record.isActive ? 'Inactive' : 'Active'}?`}
            </DialogDescription>
          </DialogHeader>
          {actionError && <p role="alert" className="text-sm text-rose-600">{actionError}</p>}
          <DialogFooter className="">
            <Button variant="outline" className="" disabled={mutating} onClick={() => setConfirmation(null)}>
              {confirmation?.action === 'archive' ? 'Close' : 'Cancel'}
            </Button>
            {confirmation?.action !== 'archive' && (
              <Button
                className="bg-[#1FC45B] text-white hover:bg-[#169F4D]"
                disabled={mutating}
                onClick={confirmAction}
              >
                {mutating ? 'Saving…' : 'Confirm'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
