'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableViewOptions } from './data-table-view-options';
import { DataTableFacetedFilter } from './data-table-faceted-filter';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faMagnifyingGlass, faRotateLeft } from '@fortawesome/free-solid-svg-icons';

export function DataTableToolbar({
    table,
    searchKey,
    searchPlaceholder = 'Filter records...',
    facetedFilters = [],
    actions,
}) {
    const isFiltered = table.getState().columnFilters.length > 0 || !!table.getState().globalFilter;

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100">
            <div className="flex flex-1 flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64 lg:w-72">
                    <FontAwesomeIcon
                        icon={faMagnifyingGlass}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400"
                    />
                    <Input
                        placeholder={searchPlaceholder}
                        value={
                            searchKey
                                ? table.getColumn(searchKey)?.getFilterValue() ?? ''
                                : table.getState().globalFilter ?? ''
                        }
                        onChange={(event) => {
                            if (searchKey) {
                                table.getColumn(searchKey)?.setFilterValue(event.target.value);
                            } else {
                                table.setGlobalFilter(event.target.value);
                            }
                        }}
                        className="h-8 pl-8 text-xs bg-slate-50/70 border-slate-200 focus-visible:bg-white focus-visible:ring-brand"
                    />
                </div>

                {facetedFilters.map((filter) => {
                    const col = table.getColumn(filter.columnKey);
                    if (!col) return null;
                    return (
                        <DataTableFacetedFilter
                            key={filter.columnKey}
                            column={col}
                            title={filter.title}
                            options={filter.options}
                        />
                    );
                })}

                {isFiltered && (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            table.resetColumnFilters();
                            table.setGlobalFilter('');
                        }}
                        className="h-8 px-2 text-xs text-slate-500 hover:text-slate-800 gap-1.5"
                    >
                        <FontAwesomeIcon icon={faRotateLeft} className="size-3" />
                        <span>Reset</span>
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-2">
                {actions}
                <DataTableViewOptions table={table} />
            </div>
        </div>
    );
}

