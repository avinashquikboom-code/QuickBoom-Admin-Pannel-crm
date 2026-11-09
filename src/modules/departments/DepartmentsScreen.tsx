'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, DataTableColumnHeader } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faBuilding, faPlus, faDownload, faRotate, faEllipsis, faEye, faPenToSquare, faTrash, faToggleOn, faBoxArchive } from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { readSession } from '@/lib/auth/admin-session';
import { isUserAdmin } from '../../../lib/access-control';
import { DepartmentDrawer } from './DepartmentDrawer';
import { apiError, changeDepartmentStatus, deleteDepartment, exportDepartments, listDepartments, type Department } from './department-api';

// The shared JS table infers data as never[]; give this use a concrete TS contract.
const DepartmentTable = DataTable as unknown as React.ComponentType<{
  columns: ColumnDef<Department>[]; data: Department[]; enableRowSelection: boolean;
  isLoading: boolean; searchKey?: string; searchPlaceholder: string; facetedFilters?: undefined;
  toolbarActions?: React.ReactNode; emptyState: React.ReactNode; caption: string;
  pageSize: number; className: string;
}>;

type Filter = 'all' | 'active' | 'inactive';
type Confirmation = { record: Department; action: 'delete' | 'status' };
function Status({ active }: { active: boolean }) {
  return <Badge render={undefined} className={`gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${active ? 'border-green-200 bg-[#E8F8EE] text-[#169F4D]' : 'border-slate-200 bg-slate-100 text-slate-500'}`}><span className={`size-1.5 rounded-full ${active ? 'bg-[#1FC45B]' : 'bg-slate-400'}`} />{active ? 'Active' : 'Inactive'}</Badge>;
}
function MobileLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-400 md:hidden">{children}</span>;
}

export function DepartmentsScreen() {
  const [records, setRecords] = React.useState<Department[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);
  const [filter, setFilter] = React.useState<Filter>('all');
  const [mobileSort, setMobileSort] = React.useState('name');
  const [canManage, setCanManage] = React.useState(false);
  const [drawer, setDrawer] = React.useState<{ id: number | null; mode: 'create' | 'edit' | 'view' } | null>(null);
  const [confirmation, setConfirmation] = React.useState<Confirmation | null>(null);
  const [mutating, setMutating] = React.useState(false);
  const mutationLock = React.useRef(false);
  const [actionError, setActionError] = React.useState('');
  React.useEffect(() => {
    setCanManage(isUserAdmin(readSession()?.user));
    const controller = new AbortController();
    setLoading(true);
    setError('');
    listDepartments(controller.signal).then(setRecords)
      .catch((err: unknown) => { if (!controller.signal.aborted) { setRecords([]); setError(apiError(err)); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);

  const counts = {
    all: records.length,
    active: records.filter((d) => d.isActive).length,
    inactive: records.filter((d) => !d.isActive).length,
  };
  const filtered = React.useMemo(() => records.filter((d) => filter === 'all' || d.isActive === (filter === 'active')).sort((a, b) => {
    if (mobileSort === 'employees') return b.employeesCount - a.employeesCount;
    if (mobileSort === 'code') return a.code.localeCompare(b.code);
    return a.name.localeCompare(b.name) * (mobileSort === 'name-desc' ? -1 : 1);
  }), [records, filter, mobileSort]);
  const ask = React.useCallback((record: Department, action: Confirmation['action']) => {
    setActionError(''); setConfirmation({ record, action });
  }, []);
  async function confirmAction() {
    if (!confirmation || mutationLock.current || !canManage) return;
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
      setRefresh((v) => v + 1);
    } catch (err) { setActionError(apiError(err)); }
    finally { mutationLock.current = false; setMutating(false); }
  }
  const columns = React.useMemo<ColumnDef<Department>[]>(() => [
    {
      id: 'select', enableSorting: false, enableHiding: false,
      header: ({ table }) => <Checkbox aria-label="Select all departments on this page" checked={table.getIsAllPageRowsSelected()} indeterminate={!table.getIsAllPageRowsSelected() && table.getIsSomePageRowsSelected()} onCheckedChange={(checked: boolean) => table.toggleAllPageRowsSelected(!!checked)} className="border-slate-300" />,
      cell: ({ row }) => <label className="flex items-center gap-2"><Checkbox aria-label={`Select ${row.original.name}`} checked={row.getIsSelected()} onCheckedChange={(checked: boolean) => row.toggleSelected(!!checked)} className="border-slate-300" /><span className="text-xs text-slate-400 md:hidden">Select department</span></label>,
      meta: { className: 'max-md:col-span-2' },
    },
    {
      accessorKey: 'name', enableHiding: false,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Department Name" className="" />,
      cell: ({ row }) => <div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-green-100 bg-[#E8F8EE] text-[#169F4D]"><FontAwesomeIcon size={undefined} label={undefined} icon={faBuilding} className="size-4" /></div><div className="min-w-0"><button type="button" onClick={() => setDrawer({ id: row.original.id, mode: 'view' })} className="text-left text-sm font-semibold text-[#172033] hover:text-[#169F4D] focus-visible:underline">{row.original.name}</button><p className="mt-1 max-w-sm line-clamp-2 text-xs leading-relaxed text-slate-500">{row.original.description || 'No description added.'}</p></div></div>,
      meta: { className: 'min-w-0 md:min-w-[240px] max-md:col-span-2' },
    },
    { accessorKey: 'code', header: ({ column }) => <DataTableColumnHeader column={column} title="Department Code" className="" />, cell: ({ row }) => <><MobileLabel>Code</MobileLabel><span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs">{row.original.code}</span></> },
    {
      accessorKey: 'head', header: ({ column }) => <DataTableColumnHeader column={column} title="Head of Department" className="" />,
      cell: ({ row }) => <><MobileLabel>Head of Department</MobileLabel><div className="flex items-center gap-2"><span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">{row.original.headId ? row.original.head.split(/\s+/).map((n) => n[0]).slice(0, 2).join('') : '—'}</span><span className="text-xs">{row.original.head}</span></div></>,
    },
    { accessorKey: 'employeesCount', header: ({ column }) => <DataTableColumnHeader column={column} title="Employees" className="" />, cell: ({ row }) => <><MobileLabel>Employees</MobileLabel><Badge render={undefined} className="rounded-md border-slate-200 bg-slate-50 px-2.5 text-slate-600">{row.original.employeesCount}</Badge></> },
    { accessorKey: 'isActive', header: ({ column }) => <DataTableColumnHeader column={column} title="Status" className="" />, cell: ({ row }) => <><MobileLabel>Status</MobileLabel><Status active={row.original.isActive} /></> },
    {
      id: 'actions', enableHiding: false,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="text-slate-500" aria-label={`Actions for ${row.original.name}`} disabled={mutating || loading} />}><FontAwesomeIcon size={undefined} label={undefined} icon={faEllipsis} className="size-4" /></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 bg-white">
          <DropdownMenuItem inset={false} className="gap-2 text-xs" onClick={() => setDrawer({ id: row.original.id, mode: 'view' })}><FontAwesomeIcon size={undefined} label={undefined} icon={faEye} className="size-3" />View Details</DropdownMenuItem>
          {canManage && <>
            <DropdownMenuItem inset={false} className="gap-2 text-xs" onClick={() => setDrawer({ id: row.original.id, mode: 'edit' })}><FontAwesomeIcon size={undefined} label={undefined} icon={faPenToSquare} className="size-3" />Edit Department</DropdownMenuItem>
            <DropdownMenuItem inset={false} className="gap-2 text-xs" onClick={() => ask(row.original, 'status')}><FontAwesomeIcon size={undefined} label={undefined} icon={faToggleOn} className="size-3" />{row.original.isActive ? 'Set Inactive' : 'Set Active'}</DropdownMenuItem>
            <DropdownMenuItem inset={false} disabled className="gap-2 text-xs" title="Archiving is not supported by the department API."><FontAwesomeIcon size={undefined} label={undefined} icon={faBoxArchive} className="size-3" />Archive unavailable</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem inset={false} className="gap-2 text-xs text-rose-600" onClick={() => ask(row.original, 'delete')}><FontAwesomeIcon size={undefined} label={undefined} icon={faTrash} className="size-3" />Delete Department</DropdownMenuItem>
          </>}
        </DropdownMenuContent>
      </DropdownMenu>,
      meta: { className: 'max-md:col-span-2 max-md:flex max-md:justify-end max-md:border-t max-md:border-slate-100' },
    },
  ], [ask, canManage, mutating, loading]);

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader title="Departments" category="Master Management" icon={faBuilding} description="Manage departments, organize teams and configure organizational structure." actions={<div className="flex flex-wrap gap-2"><Button variant="outline" className="h-10 border-slate-200 bg-white text-xs" title="Export all records in the selected status tab" disabled={loading || !!error || filtered.length === 0} onClick={() => { exportDepartments(filtered); toast.success('Departments exported'); }}><FontAwesomeIcon size={undefined} label={undefined} icon={faDownload} className="size-3.5" />Export CSV</Button>{canManage && <Button className="h-10 bg-[#1FC45B] text-xs text-white hover:bg-[#169F4D]" onClick={() => setDrawer({ id: null, mode: 'create' })}><FontAwesomeIcon size={undefined} label={undefined} icon={faPlus} className="size-3.5" />Add Department</Button>}</div>} />
      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xs">
        <div role="tablist" aria-label="Department status" className="flex gap-1 overflow-x-auto">
          {(['all', 'active', 'inactive'] as const).map((value) => <button key={value} type="button" role="tab" id={`department-tab-${value}`} aria-controls="department-results" aria-selected={filter === value} tabIndex={filter === value ? 0 : -1} onKeyDown={(event) => {
              const values: Filter[] = ['all', 'active', 'inactive'];
              const index = values.indexOf(value);
              const next = event.key === 'ArrowRight' ? values[(index + 1) % 3] : event.key === 'ArrowLeft' ? values[(index + 2) % 3] : event.key === 'Home' ? 'all' : event.key === 'End' ? 'inactive' : null;
              if (next) { event.preventDefault(); setFilter(next); document.getElementById(`department-tab-${next}`)?.focus(); }
            }} onClick={() => setFilter(value)} className={`flex min-w-fit items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${filter === value ? 'bg-[#E8F8EE] text-[#169F4D]' : 'text-slate-500 hover:bg-slate-50'}`}>
            {value === 'all' ? 'All Departments' : value === 'active' ? 'Active' : 'Inactive'}<span className={`rounded-md px-2 py-0.5 text-xs ${filter === value ? 'bg-white text-[#169F4D]' : 'bg-slate-100 text-slate-500'}`}>{loading || error ? '—' : counts[value]}</span>
          </button>)}
          <button type="button" role="tab" aria-selected={false} disabled title="Departments currently support Active and Inactive only." className="flex min-w-fit items-center gap-2 rounded-xl px-4 py-3 text-sm text-slate-400">Archived <span className="text-[10px]">Unavailable</span></button>
        </div>
      </div>
      <section id="department-results" role="tabpanel" aria-labelledby={`department-tab-${filter}`} aria-busy={loading} className="min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-3 px-1"><div><h2 className="text-sm font-semibold text-[#172033]">Department directory</h2><p className="mt-1 text-xs text-slate-500">Your teams, ownership and organizational structure.</p></div><Button variant="outline" className="h-9 gap-2 text-xs" disabled={loading || mutating} onClick={() => setRefresh((v) => v + 1)}><FontAwesomeIcon size={undefined} label={undefined} icon={faRotate} className={`size-3 ${loading ? 'animate-spin' : ''}`} />Refresh</Button></div>
        <div className="md:hidden"><Select value={mobileSort} onValueChange={(value: string | null) => { if (value) setMobileSort(value); }}><SelectTrigger aria-label="Sort departments" className="w-full bg-white"><SelectValue className="" /></SelectTrigger><SelectContent className="bg-white"><SelectItem value="name" className="text-sm">Name: A–Z</SelectItem><SelectItem value="name-desc" className="text-sm">Name: Z–A</SelectItem><SelectItem value="code" className="text-sm">Department code</SelectItem><SelectItem value="employees" className="text-sm">Most employees</SelectItem></SelectContent></Select></div>
        {error ? <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6"><h3 className="font-semibold text-rose-800">Unable to load departments</h3><p className="mt-2 text-sm text-rose-700">{error}</p><Button variant="outline" className="mt-4 bg-white" onClick={() => setRefresh((v) => v + 1)}>Try again</Button></div> : <DepartmentTable
          key={`${filter}-${refresh}-${mobileSort}`} columns={columns} data={filtered} enableRowSelection isLoading={loading}
          searchKey={undefined} searchPlaceholder="Search departments, codes or heads…" facetedFilters={undefined} toolbarActions={undefined}
          emptyState={<div className="py-8"><FontAwesomeIcon size={undefined} label={undefined} icon={faBuilding} className="mx-auto mb-3 size-7 text-slate-300" /><p className="font-semibold text-slate-700">No departments found</p><p className="mt-1 text-slate-500">Try another search or status filter, or add a department.</p></div>}
          caption="Departments directory" pageSize={10}
          className="min-w-0 overflow-hidden [&_td]:whitespace-normal max-md:[&_thead]:sr-only max-md:[&_table]:block max-md:[&_tbody]:block max-md:[&_tbody_tr]:grid max-md:[&_tbody_tr]:grid-cols-2 max-md:[&_tbody_tr]:gap-x-1 max-md:[&_tbody_tr]:p-3 max-md:[&_td]:block max-md:[&_td]:min-w-0 max-md:[&_td]:px-2 max-md:[&_td]:py-2 max-md:[&_td[colspan]]:col-span-2"
        />}
      </section>
      {drawer && <DepartmentDrawer key={`${drawer.mode}-${drawer.id}`} {...drawer} onClose={() => setDrawer(null)} onSaved={() => { setDrawer(null); setRefresh((v) => v + 1); }} />}
      <Dialog open={!!confirmation} onOpenChange={(open: boolean) => { if (!open && !mutationLock.current) setConfirmation(null); }}>
        <DialogContent className="sm:max-w-md" showCloseButton={!mutating}>
          <DialogHeader className="pr-5"><DialogTitle className="text-lg">{confirmation?.action === 'delete' ? 'Delete department?' : 'Change department status?'}</DialogTitle><DialogDescription className="leading-relaxed">{confirmation?.action === 'delete' ? `Delete “${confirmation.record.name}”? If employees are assigned, the department will be set to Inactive instead. Otherwise it will be permanently deleted and linked designations will be unassigned.` : `Set “${confirmation?.record.name}” to ${confirmation?.record.isActive ? 'Inactive' : 'Active'}?`}</DialogDescription></DialogHeader>
          {actionError && <p role="alert" className="text-sm text-rose-600">{actionError}</p>}
          <DialogFooter className=""><Button variant="outline" className="" disabled={mutating} onClick={() => setConfirmation(null)}>Cancel</Button><Button className={confirmation?.action === 'delete' ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-[#1FC45B] text-white hover:bg-[#169F4D]'} disabled={mutating} onClick={confirmAction}>{mutating ? 'Saving…' : 'Confirm'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
