'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faCheck, faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';

export function DataTableFacetedFilter({ column, title, options }) {
    const facets = column?.getFacetedUniqueValues();
    const selectedValues = new Set(column?.getFilterValue() || []);

    return (
        <Popover>
            <PopoverTrigger
                render={
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-dashed border-slate-300 text-xs font-medium gap-1.5"
                    />
                }
            >
                <FontAwesomeIcon icon={faCirclePlus} className="size-3 text-slate-400" />
                <span>{title}</span>
                {selectedValues?.size > 0 && (
                    <>
                        <Separator orientation="vertical" className="mx-1 h-4" />
                        <Badge
                            variant="secondary"
                            className="rounded-sm px-1 font-normal lg:hidden text-[10px]"
                        >
                            {selectedValues.size}
                        </Badge>
                        <div className="hidden gap-1 lg:flex">
                            {selectedValues.size > 2 ? (
                                <Badge
                                    variant="secondary"
                                    className="rounded-sm px-1 font-normal text-[10px]"
                                >
                                    {selectedValues.size} selected
                                </Badge>
                            ) : (
                                options
                                    .filter((option) => selectedValues.has(option.value))
                                    .map((option) => (
                                        <Badge
                                            variant="secondary"
                                            key={option.value}
                                            className="rounded-sm px-1 font-normal text-[10px]"
                                        >
                                            {option.label}
                                        </Badge>
                                    ))
                            )}
                        </div>
                    </>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2 bg-white border border-slate-200 shadow-md" align="start">
                <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">
                        Filter by {title}
                    </p>
                    <Separator className="my-1" />
                    <div className="max-h-[220px] overflow-y-auto space-y-0.5">
                        {options.map((option) => {
                            const isSelected = selectedValues.has(option.value);
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        if (isSelected) {
                                            selectedValues.delete(option.value);
                                        } else {
                                            selectedValues.add(option.value);
                                        }
                                        const filterValues = Array.from(selectedValues);
                                        column?.setFilterValue(
                                            filterValues.length ? filterValues : undefined
                                        );
                                    }}
                                    className={cn(
                                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-left transition-colors',
                                        isSelected
                                            ? 'bg-brand/10 text-brand-dark font-medium'
                                            : 'text-slate-700 hover:bg-slate-100'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'size-3.5 rounded border flex items-center justify-center transition-colors',
                                            isSelected
                                                ? 'border-brand bg-brand text-white'
                                                : 'border-slate-300 bg-white'
                                        )}
                                    >
                                        {isSelected && <FontAwesomeIcon icon={faCheck} className="size-2 text-white" />}
                                    </div>
                                    <span className="flex-1 truncate">{option.label}</span>
                                    {facets?.get(option.value) && (
                                        <span className="font-mono text-[10px] text-slate-400">
                                            {facets.get(option.value)}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {selectedValues.size > 0 && (
                        <>
                            <Separator className="my-1" />
                            <button
                                onClick={() => column?.setFilterValue(undefined)}
                                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 py-1 font-medium transition-colors"
                            >
                                Clear filters
                            </button>
                        </>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

