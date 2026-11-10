'use client';

import * as React from 'react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    faArrowDown,
    faArrowUp,
    faArrowsUpDown,
    faColumns,
    faCopy,
    faEllipsis,
    faMagnifyingGlass,
    faInbox,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { AdminRowActions } from '@/components/common/AdminRowActions';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableCaption,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Pagination } from './Pagination';
import { legacyValue, searchableText } from '@/lib/table-utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const EMPTY = [];

function DataTableContent({
    columns,
    data = EMPTY,
    pageSize = 10,
    emptyState,
    isLoading = false,
    enableRowSelection = false,
    rowActions = EMPTY,
    label = 'Records',
    initialSorting = EMPTY,
    className,
    hideToolbar = false,
    hideSearch = false,
    toolbarActions,
    onSelectionChange,
    selectionResetToken = 0,
}) {
    const [sorting, setSorting] = React.useState(() => initialSorting);
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [columnVisibility, setColumnVisibility] = React.useState({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [status, setStatus] = React.useState('all');

    const statuses = React.useMemo(() => {
        return [...new Set(data.map((row) => row.status).filter(Boolean))].sort();
    }, [data]);

    const filtered = React.useMemo(() => {
        if (status === 'all') return data;
        return data.filter((row) => row.status === status);
    }, [data, status]);

    const definitions = React.useMemo(() => {
        const result = columns.map((column, index) => ({
            id: column.id || column.accessorKey || `column-${index}`,
            accessorFn: (row) => legacyValue(row, column),
            header: column.header,
            enableSorting:
                column.enableSorting ??
                (typeof column.header === 'string' &&
                    !/action/i.test(column.header) &&
                    (data.length === 0 || legacyValue(data[0], column) != null)),
            enableHiding: column.enableHiding ?? true,
            cell: ({ row, getValue }) =>
                column.cell ? column.cell(row.original) : getValue(),
            meta: {
                label:
                    column.label ||
                    (typeof column.header === 'string'
                        ? column.header
                        : `Column ${index + 1}`),
                className: column.className,
                headClassName: column.headClassName,
            },
        }));

        if (enableRowSelection) {
            result.unshift({
                id: '__select',
                enableSorting: false,
                enableHiding: false,
                header: ({ table }) => (
                    <Checkbox
                        aria-label="Select all rows"
                        checked={table.getIsAllPageRowsSelected()}
                        indeterminate={table.getIsSomePageRowsSelected()}
                        onCheckedChange={(checked) =>
                            table.toggleAllPageRowsSelected(!!checked)
                        }
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        aria-label={`Select record ${row.id}`}
                        checked={row.getIsSelected()}
                        onCheckedChange={(checked) => row.toggleSelected(!!checked)}
                    />
                ),
            });
        }

        const hasExistingActions = columns.some(
            (c) =>
                c.id === 'actions' ||
                c.id === '__menu' ||
                (typeof c.header === 'string' && /actions?/i.test(c.header))
        );

        if (!hasExistingActions || rowActions.length > 0) {
            result.push({
                id: '__menu',
                header: () => <span className="sr-only">Actions</span>,
                enableSorting: false,
                enableHiding: false,
                cell: ({ row }) => (
                    <div className="flex items-center justify-end">
                        <AdminRowActions
                            row={row}
                            actions={[
                                {
                                    label: 'Copy record ID',
                                    icon: faCopy,
                                    onClick: async () => {
                                        try {
                                            await navigator.clipboard.writeText(
                                                String(row.original.id ?? row.id)
                                            );
                                            toast.success('Record ID copied');
                                        } catch {
                                            toast.error('Unable to access the clipboard');
                                        }
                                    },
                                },
                                ...rowActions.map((action) => ({
                                    label: action.label,
                                    icon: action.icon,
                                    confirm: action.confirm,
                                    disabled: action.disabled,
                                    variant: action.variant || (action.label?.toLowerCase().includes('delete') ? 'destructive' : undefined),
                                    onClick: () => action.onSelect(row.original),
                                })),
                            ]}
                        />
                    </div>
                ),
            });
        }

        return result;
    }, [columns, data, enableRowSelection, rowActions]);

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: filtered,
        columns: definitions,
        state: { sorting, globalFilter, columnVisibility, rowSelection },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        enableRowSelection,
        getRowId: (row, index) => String(row.id ?? index),
        globalFilterFn: (row, _id, value) =>
            searchableText(row.original)
                .toLowerCase()
                .includes(String(value).toLowerCase()),
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: Math.max(1, Math.floor(pageSize) || 10),
            },
        },
    });

    React.useEffect(() => {
        table.setPageSize(Math.max(1, Math.floor(pageSize) || 10));
        // Apply the latest page size after this render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageSize]);

    React.useEffect(() => {
        setRowSelection({});
    }, [data, selectionResetToken]);

    const onSelectionChangeRef = React.useRef(onSelectionChange);
    onSelectionChangeRef.current = onSelectionChange;
    React.useEffect(() => {
        if (typeof onSelectionChangeRef.current !== 'function') return;
        onSelectionChangeRef.current(table.getSelectedRowModel().rows.map((row) => row.original));
        // table is read from this render; rowSelection and data are the selection inputs.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rowSelection, data]);

    if (isLoading) {
        return (
            <div
                role="status"
                aria-label={`Loading ${label}`}
                className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs"
            >
                <div className="h-9 w-64 max-w-full bg-slate-100 animate-pulse rounded-xl" />
                <div className="space-y-2 pt-2">
                    {[1, 2, 3, 4, 5].map((key) => (
                        <Skeleton key={key} className="h-11 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    const total = table.getFilteredRowModel().rows.length;
    const pagination = table.getState().pagination;

    return (
        <div
            className={cn(
                'min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden',
                className
            )}
        >
            {/* Standard Listing Toolbar */}
            {!hideToolbar && (
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 p-3.5 bg-white">
                    <div className="flex min-w-0 flex-1 flex-wrap flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        {!hideSearch && (
                            <div className="relative w-full sm:max-w-xs">
                                <FontAwesomeIcon
                                    icon={faMagnifyingGlass}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400"
                                />
                                <Input
                                    aria-label={`Search ${label}`}
                                    placeholder={`Search ${label.toLowerCase()}…`}
                                    value={globalFilter}
                                    onChange={(event) => table.setGlobalFilter(event.target.value)}
                                    className="h-9 w-full pl-9 pr-3 text-xs border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-brand rounded-xl"
                                />
                            </div>
                        )}

                        {statuses.length > 0 && (
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger
                                    aria-label={`Filter ${label} by status`}
                                    className="h-9 text-xs border-slate-200 bg-slate-50/50 rounded-xl min-w-[130px]"
                                >
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="all" className="text-xs">
                                        All statuses
                                    </SelectItem>
                                    {statuses.map((value) => (
                                        <SelectItem key={value} value={value} className="text-xs">
                                            {value.replaceAll('_', ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="flex max-w-full flex-wrap items-center gap-2.5 self-end sm:self-auto">
                        {toolbarActions}
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 text-xs border-slate-200 bg-slate-50/50 hover:bg-slate-100 rounded-xl gap-1.5 text-slate-600 font-medium"
                                    />
                                }
                            >
                                <FontAwesomeIcon icon={faColumns} className="size-3 text-slate-400" />
                                <span>Columns</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-48 bg-white border-slate-200 shadow-md rounded-xl p-1"
                            >
                                {table
                                    .getAllLeafColumns()
                                    .filter((column) => column.getCanHide())
                                    .map((column) => (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            checked={column.getIsVisible()}
                                            disabled={
                                                column.getIsVisible() &&
                                                table
                                                    .getVisibleLeafColumns()
                                                    .filter((item) => item.getCanHide()).length === 1
                                            }
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                            className="text-xs rounded-lg"
                                        >
                                            {column.columnDef.meta?.label || column.id}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {enableRowSelection && (
                            <span
                                className="text-xs font-semibold text-[#169F4D] bg-[#E8F8EE] border border-emerald-200/80 px-2.5 py-1 rounded-full whitespace-nowrap"
                                aria-live="polite"
                            >
                                {table.getFilteredSelectedRowModel().rows.length} selected
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Semantic table with contained horizontal scrolling */}
            <div className="relative w-full overflow-x-auto min-w-0">
            <Table className="w-full text-xs text-left">
                <TableCaption className="sr-only">
                    {label}: searchable, sortable and paginated
                </TableCaption>
                <TableHeader>
                    {table.getHeaderGroups().map((group) => (
                        <TableRow key={group.id} className="border-b border-emerald-100/90 bg-[#F4FAF6]">
                            {group.headers.map((header) => (
                                <TableHead
                                    key={header.id}
                                    aria-sort={
                                        header.column.getIsSorted() === 'asc'
                                            ? 'ascending'
                                            : header.column.getIsSorted() === 'desc'
                                            ? 'descending'
                                            : 'none'
                                    }
                                    className={cn(
                                        'py-3 px-4 text-xs font-semibold text-[#163A2E] tracking-wider',
                                        header.column.columnDef.meta?.headClassName
                                    )}
                                >
                                    {header.column.getCanSort() ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={header.column.getToggleSortingHandler()}
                                            aria-label={`Sort by ${header.column.columnDef.header}`}
                                            className="-ml-2 h-7 gap-1.5 text-xs font-semibold text-[#163A2E] hover:text-[#163A2E] hover:bg-emerald-100/40"
                                        >
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                            <FontAwesomeIcon
                                                icon={
                                                    header.column.getIsSorted() === 'asc'
                                                        ? faArrowUp
                                                        : header.column.getIsSorted() === 'desc'
                                                        ? faArrowDown
                                                        : faArrowsUpDown
                                                }
                                                className={cn(
                                                    'size-2.5',
                                                    header.column.getIsSorted()
                                                        ? 'text-[#1FC45B]'
                                                        : 'text-slate-400'
                                                )}
                                            />
                                        </Button>
                                    ) : (
                                        flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() ? 'selected' : undefined}
                                className="border-b border-slate-100/80 transition-colors hover:bg-[#F9FCFA] data-[state=selected]:bg-[#EAF8EC]/70"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                        key={cell.id}
                                        className={cn(
                                            'py-3.5 px-4 text-xs text-slate-700',
                                            cell.column.columnDef.meta?.className
                                        )}
                                    >
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={table.getVisibleLeafColumns().length}
                                className="h-44 whitespace-normal text-center text-muted-foreground p-8"
                            >
                                {emptyState || (
                                    <div className="py-6 flex flex-col items-center justify-center space-y-2">
                                        <div className="size-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                                            <FontAwesomeIcon icon={faInbox} className="size-5" />
                                        </div>
                                        <p className="font-semibold text-slate-700">No records found</p>
                                        <p className="text-xs text-slate-400 max-w-sm">
                                            No matching {label.toLowerCase()} available for the current filter.
                                        </p>
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            </div>

            {/* Standard Pagination Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-3.5 text-xs text-slate-500 bg-white">
                <span aria-live="polite" className="font-medium">
                    Showing{' '}
                    <strong className="text-slate-800 font-semibold">
                        {total ? pagination.pageIndex * pagination.pageSize + 1 : 0}
                    </strong>
                    –
                    <strong className="text-slate-800 font-semibold">
                        {Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)}
                    </strong>{' '}
                    of <strong className="text-slate-800 font-semibold">{total}</strong> {label.toLowerCase()}
                </span>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500">Rows per page:</span>
                        <Select
                            value={String(pagination.pageSize)}
                            onValueChange={(value) => table.setPageSize(Number(value))}
                        >
                            <SelectTrigger
                                aria-label="Rows per page"
                                className="h-8 w-20 text-xs border-slate-200 bg-slate-50/50 rounded-lg"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                {[...new Set([pageSize, 10, 20, 50, 100])]
                                    .sort((a, b) => a - b)
                                    .map((size) => (
                                        <SelectItem
                                            key={size}
                                            value={String(size)}
                                            className="text-xs"
                                        >
                                            {size}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Pagination
                        page={pagination.pageIndex + 1}
                        totalPages={Math.max(1, table.getPageCount())}
                        onPageChange={(page) => table.setPageIndex(page - 1)}
                    />
                </div>
            </div>
        </div>
    );
}

export function DataTable(props) {
    return (
        <React.Suspense
            fallback={
                <Skeleton
                    aria-label="Loading table"
                    className="h-72 w-full rounded-2xl"
                />
            }
        >
            <DataTableContent {...props} />
        </React.Suspense>
    );
}
