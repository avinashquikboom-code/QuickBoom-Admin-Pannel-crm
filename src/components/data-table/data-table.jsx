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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableCaption,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTableToolbar } from './data-table-toolbar';
import { DataTablePagination } from './data-table-pagination';
import { cn } from '@/lib/utils';
import { searchableText } from '@/lib/table-utils';

export function DataTable({
    columns,
    data = [],
    searchKey,
    searchPlaceholder,
    facetedFilters,
    toolbarActions,
    isLoading = false,
    emptyState = 'No records found.',
    hideSearch = false,
    pageSize = 10,
    enableRowSelection = false,
    onSelectionChange,
    selectionResetToken = 0,
    bulkActions,
    className,
    caption,
}) {
    const [sorting, setSorting] = React.useState([]);
    const [columnFilters, setColumnFilters] = React.useState([]);
    const [columnVisibility, setColumnVisibility] = React.useState({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [globalFilter, setGlobalFilter] = React.useState('');

    React.useEffect(() => {
        setRowSelection((prev) => (Object.keys(prev).length === 0 ? prev : {}));
    }, [selectionResetToken]);

    const resolvedColumns = React.useMemo(() => {
        if (!enableRowSelection) return columns;
        if (columns.some((c) => c.id === '__select' || c.id === 'select')) return columns;
        return [
            {
                id: '__select',
                enableSorting: false,
                enableHiding: false,
                header: ({ table }) => (
                    <input
                        type="checkbox"
                        aria-label="Select all rows on current page"
                        checked={table.getIsAllPageRowsSelected()}
                        ref={(el) => {
                            if (el) el.indeterminate = table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected();
                        }}
                        onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
                        className="size-4 rounded border-slate-300 accent-[#163A2E] cursor-pointer"
                    />
                ),
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={row.getIsSelected()}
                        onChange={(e) => row.toggleSelected(e.target.checked)}
                        className="size-4 rounded border-slate-300 accent-[#163A2E] cursor-pointer"
                    />
                ),
                meta: { className: 'w-10 px-3', headClassName: 'w-10 px-3' },
            },
            ...columns,
        ];
    }, [columns, enableRowSelection]);

    // TanStack table instance
    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data,
        columns: resolvedColumns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            globalFilter,
        },
        enableRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: (row, _id, value) =>
            searchableText(row.original).toLowerCase().includes(String(value).toLowerCase()),
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: {
            pagination: {
                pageSize,
            },
        },
    });

    const onSelectionChangeRef = React.useRef(onSelectionChange);
    onSelectionChangeRef.current = onSelectionChange;

    const isFirstRender = React.useRef(true);
    React.useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            if (Object.keys(rowSelection).length === 0) return;
        }
        if (typeof onSelectionChangeRef.current === 'function') {
            const selected = table.getSelectedRowModel().flatRows.map((r) => r.original);
            onSelectionChangeRef.current(selected);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rowSelection]);

    return (
        <div className={cn('min-w-0 max-w-full space-y-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden', className)}>
            <DataTableToolbar
                table={table}
                searchKey={searchKey}
                searchPlaceholder={searchPlaceholder}
                facetedFilters={facetedFilters}
                actions={toolbarActions}
                hideSearch={hideSearch}
            />

            <div className="relative overflow-x-auto">
                <Table className="w-full text-xs text-left">
                    {caption && <TableCaption className="sr-only">{caption}</TableCaption>}
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="border-b border-emerald-100/90 bg-[#F4FAF6]">
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        colSpan={header.colSpan}
                                        className={cn(
                                            'py-3.5 px-4 text-xs font-semibold text-[#163A2E] tracking-wider',
                                            header.column.id === 'actions' && 'text-right',
                                            header.column.columnDef.meta?.headClassName
                                        )}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : header.column.id === 'actions'
                                              ? 'Actions'
                                              : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                ))}
                            </tr>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={columns.length} className="h-12 px-4 py-3">
                                        <Skeleton className="h-6 w-full rounded-md" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    className="hover:bg-[#F9FCFA] transition-colors border-b border-slate-100/80 data-[state=selected]:bg-[#EAF8EC]/70"
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
                                    colSpan={columns.length}
                                    className="h-32 text-center text-xs text-muted-foreground"
                                >
                                    {emptyState}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataTablePagination table={table} />
        </div>
    );
}

