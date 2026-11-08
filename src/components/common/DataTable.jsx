'use client';
import * as React from 'react';
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { faArrowDown, faArrowUp, faArrowsUpDown, faColumns, faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Pagination } from './Pagination';
import { legacyValue, searchableText } from '@/lib/table-utils';
import { toast } from 'sonner';

const EMPTY = [];
function DataTableContent({ columns, data = EMPTY, pageSize = 10, emptyState, isLoading = false, enableRowSelection = false, rowActions = EMPTY, label = 'Records', initialSorting = EMPTY }) {
  const [sorting, setSorting] = React.useState(() => initialSorting);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [status, setStatus] = React.useState('all');
  const statuses = React.useMemo(() => [...new Set(data.map((row) => row.status).filter(Boolean))].sort(), [data]);
  const filtered = React.useMemo(() => status === 'all' ? data : data.filter((row) => row.status === status), [data, status]);
  const definitions = React.useMemo(() => {
    const result = columns.map((column, index) => ({
      id: column.id || column.accessorKey || `column-${index}`,
      accessorFn: (row) => legacyValue(row, column),
      header: column.header,
      enableSorting: column.enableSorting ?? (typeof column.header === 'string' && !/action/i.test(column.header) && (data.length === 0 || legacyValue(data[0], column) != null)),
      enableHiding: column.enableHiding ?? true,
      cell: ({ row, getValue }) => column.cell ? column.cell(row.original) : getValue(),
      meta: { label: column.label || (typeof column.header === 'string' ? column.header : `Column ${index + 1}`), className: column.className, headClassName: column.headClassName },
    }));
    if (enableRowSelection) result.unshift({ id: '__select', enableSorting: false, enableHiding: false,
      header: ({ table }) => <Checkbox aria-label="Select page" checked={table.getIsAllPageRowsSelected()} indeterminate={table.getIsSomePageRowsSelected()} onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)} />,
      cell: ({ row }) => <Checkbox aria-label={`Select record ${row.id}`} checked={row.getIsSelected()} onCheckedChange={(checked) => row.toggleSelected(checked)} />,
    });
    result.push({ id: '__menu', header: 'Record actions', enableSorting: false, enableHiding: false,
      cell: ({ row }) => <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for record ${row.id}`} />}><FontAwesomeIcon icon={faEllipsis} /></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={async () => { try { await navigator.clipboard.writeText(String(row.original.id ?? row.id)); toast.success('Record ID copied'); } catch { toast.error('Unable to access the clipboard'); } }}>Copy record ID</DropdownMenuItem>
          {rowActions.map((action) => <DropdownMenuItem key={action.label} onClick={() => action.onSelect(row.original)}>{action.label}</DropdownMenuItem>)}
        </DropdownMenuContent></DropdownMenu>,
    });
    return result;
  }, [columns, data, enableRowSelection, rowActions]);
  // TanStack v8 uses live getters; keep this hook outside React Compiler memoization.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: filtered, columns: definitions,
    state: { sorting, globalFilter, columnVisibility, rowSelection },
    onSortingChange: setSorting, onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility, onRowSelectionChange: setRowSelection,
    enableRowSelection, getRowId: (row, index) => String(row.id ?? index),
    globalFilterFn: (row, _id, value) => searchableText(row.original).toLowerCase().includes(value.toLowerCase()),
    getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: Math.max(1, Math.floor(pageSize) || 10) } },
  });
  if (isLoading) return <div role="status" aria-label={`Loading ${label}`} className="space-y-3 rounded-xl border p-4">{[1,2,3].map((key) => <Skeleton key={key} className="h-10 w-full" />)}</div>;
  const total = table.getFilteredRowModel().rows.length;
  const pagination = table.getState().pagination;
  return <div className="min-w-0 rounded-xl border bg-card shadow-xs">
    <div className="flex flex-wrap items-center gap-3 border-b p-3">
      <Input aria-label={`Search ${label}`} placeholder={`Search ${label.toLowerCase()}…`} value={globalFilter} onChange={(event) => table.setGlobalFilter(event.target.value)} className="w-full sm:max-w-xs" />
      {statuses.length > 0 && <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label={`Filter ${label} by status`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.map((value) => <SelectItem key={value} value={value}>{value.replaceAll('_', ' ')}</SelectItem>)}</SelectContent></Select>}
      <DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" size="sm" />}><FontAwesomeIcon icon={faColumns} />Columns</DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48">
        {table.getAllLeafColumns().filter((column) => column.getCanHide()).map((column) => <DropdownMenuCheckboxItem key={column.id} checked={column.getIsVisible()} disabled={column.getIsVisible() && table.getVisibleLeafColumns().filter((item) => item.getCanHide()).length === 1} onCheckedChange={(value) => column.toggleVisibility(value)}>{column.columnDef.meta.label}</DropdownMenuCheckboxItem>)}
      </DropdownMenuContent></DropdownMenu>
      {enableRowSelection && <span className="text-xs text-muted-foreground" aria-live="polite">{table.getFilteredSelectedRowModel().rows.length} selected</span>}
    </div>
    <Table><TableCaption className="sr-only">{label}: searchable, sortable and paginated</TableCaption><TableHeader>{table.getHeaderGroups().map((group) => <TableRow key={group.id}>{group.headers.map((header) => <TableHead key={header.id} aria-sort={header.column.getIsSorted() === 'asc' ? 'ascending' : header.column.getIsSorted() === 'desc' ? 'descending' : 'none'} className={header.column.columnDef.meta?.headClassName}>
      {header.column.getCanSort() ? <Button variant="ghost" size="sm" onClick={header.column.getToggleSortingHandler()} aria-label={`Sort by ${header.column.columnDef.header}`}>{flexRender(header.column.columnDef.header, header.getContext())}<FontAwesomeIcon icon={header.column.getIsSorted() === 'asc' ? faArrowUp : header.column.getIsSorted() === 'desc' ? faArrowDown : faArrowsUpDown} className="size-3" /></Button> : flexRender(header.column.columnDef.header, header.getContext())}
    </TableHead>)}</TableRow>)}</TableHeader><TableBody>
      {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={table.getVisibleLeafColumns().length} className="h-40 whitespace-normal text-center text-muted-foreground">{emptyState || 'No records found.'}</TableCell></TableRow>}
    </TableBody></Table>
    <div className="flex flex-col gap-3 border-t p-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span aria-live="polite">{total ? pagination.pageIndex * pagination.pageSize + 1 : 0}–{Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)} of {total} results</span>
      <div className="flex flex-wrap items-center gap-2"><Select value={String(pagination.pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}><SelectTrigger aria-label="Rows per page"><SelectValue /></SelectTrigger><SelectContent>{[...new Set([pageSize,10,25,50])].sort((a,b) => a-b).map((size) => <SelectItem key={size} value={String(size)}>{size} per page</SelectItem>)}</SelectContent></Select>
        <Pagination page={pagination.pageIndex + 1} totalPages={Math.max(1, table.getPageCount())} onPageChange={(page) => table.setPageIndex(page - 1)} /></div>
    </div>
  </div>;
}

// TanStack filtering measures time internally. A boundary lets Next.js stream
// the interactive table without reading unstable timing values during prerender.
export function DataTable(props) {
  return <React.Suspense fallback={<Skeleton aria-label="Loading table" className="h-72 w-full" />}><DataTableContent {...props} /></React.Suspense>;
}
