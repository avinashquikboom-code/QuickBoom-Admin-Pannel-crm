'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faSliders } from '@fortawesome/free-solid-svg-icons';

export function DataTableViewOptions({ table }) {
    const columns = table
        .getAllColumns()
        .filter(
            (column) =>
                typeof column.accessorFn !== 'undefined' && column.getCanHide()
        );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto hidden h-8 gap-1.5 lg:flex text-xs font-medium border-slate-200"
                    />
                }
            >
                <FontAwesomeIcon icon={faSliders} className="size-3 text-slate-500" />
                <span>View</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[170px] bg-white border-slate-200 shadow-md">
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs font-semibold text-slate-700">Toggle columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {columns.map((column) => {
                        const label =
                            column.columnDef.meta?.label ||
                            (typeof column.columnDef.header === 'string'
                                ? column.columnDef.header
                                : column.id);

                        return (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                className="capitalize text-xs cursor-pointer"
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                            >
                                {label}
                            </DropdownMenuCheckboxItem>
                        );
                    })}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

