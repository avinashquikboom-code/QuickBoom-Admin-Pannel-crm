'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
    faArrowDown,
    faArrowUp,
    faArrowsUpDown,
    faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';

export function DataTableColumnHeader({ column, title, className }) {
    if (!column.getCanSort()) {
        return <div className={cn('text-xs font-semibold text-slate-700', className)}>{title}</div>;
    }

    const isSorted = column.getIsSorted();

    return (
        <div className={cn('flex items-center space-x-2', className)}>
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-3 h-8 text-xs font-semibold text-slate-700 hover:text-slate-900 data-[state=open]:bg-accent"
                        />
                    }
                >
                    <span>{title}</span>
                    {isSorted === 'desc' ? (
                        <FontAwesomeIcon icon={faArrowDown} className="ml-1.5 size-3 text-brand" />
                    ) : isSorted === 'asc' ? (
                        <FontAwesomeIcon icon={faArrowUp} className="ml-1.5 size-3 text-brand" />
                    ) : (
                        <FontAwesomeIcon icon={faArrowsUpDown} className="ml-1.5 size-2.5 text-slate-400" />
                    )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-36 bg-white border-slate-200">
                    <DropdownMenuItem
                        onClick={() => column.toggleSorting(false)}
                        className="text-xs gap-2 cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faArrowUp} className="size-3 text-slate-400" />
                        <span>Asc</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => column.toggleSorting(true)}
                        className="text-xs gap-2 cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faArrowDown} className="size-3 text-slate-400" />
                        <span>Desc</span>
                    </DropdownMenuItem>
                    {column.getCanHide() && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => column.toggleVisibility(false)}
                                className="text-xs gap-2 cursor-pointer text-slate-500"
                            >
                                <FontAwesomeIcon icon={faEyeSlash} className="size-3 text-slate-400" />
                                <span>Hide column</span>
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

