'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
    faAnglesLeft,
    faAnglesRight,
    faChevronLeft,
    faChevronRight,
} from '@fortawesome/free-solid-svg-icons';

export function DataTablePagination({ table }) {
    const selectedCount = table.getFilteredSelectedRowModel().rows.length;
    const totalCount = table.getFilteredRowModel().rows.length;
    const pageSize = table.getState().pagination.pageSize;
    const pageIndex = table.getState().pagination.pageIndex;
    const pageCount = table.getPageCount();

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
            <div className="flex-1 text-xs text-muted-foreground">
                {selectedCount > 0 ? (
                    <span>
                        <strong>{selectedCount}</strong> of <strong>{totalCount}</strong> row(s) selected.
                    </span>
                ) : (
                    <span>
                        Showing <strong>{totalCount > 0 ? pageIndex * pageSize + 1 : 0}</strong> to{' '}
                        <strong>{Math.min((pageIndex + 1) * pageSize, totalCount)}</strong> of{' '}
                        <strong>{totalCount}</strong> entries
                    </span>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-8">
                <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-slate-600">Rows per page</p>
                    <Select
                        value={`${pageSize}`}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value));
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px] text-xs">
                            <SelectValue placeholder={pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 30, 50, 100].map((size) => (
                                <SelectItem key={size} value={`${size}`} className="text-xs">
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-xs font-medium text-slate-700">
                    Page {pageIndex + 1} of {Math.max(1, pageCount)}
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon-sm"
                        className="hidden lg:flex"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                        aria-label="Go to first page"
                    >
                        <FontAwesomeIcon icon={faAnglesLeft} className="size-3" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        aria-label="Go to previous page"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} className="size-3" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        aria-label="Go to next page"
                    >
                        <FontAwesomeIcon icon={faChevronRight} className="size-3" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon-sm"
                        className="hidden lg:flex"
                        onClick={() => table.setPageIndex(pageCount - 1)}
                        disabled={!table.getCanNextPage()}
                        aria-label="Go to last page"
                    >
                        <FontAwesomeIcon icon={faAnglesRight} className="size-3" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

