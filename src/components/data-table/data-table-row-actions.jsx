'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
    faEllipsis,
    faEye,
    faPenToSquare,
    faTrash,
} from '@fortawesome/free-solid-svg-icons';

export function DataTableRowActions({
    row,
    onView,
    onEdit,
    onDelete,
    customActions = [],
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-7 rounded-lg text-slate-500 hover:text-slate-900"
                        aria-label={`Actions for record ${row.id}`}
                    />
                }
            >
                <FontAwesomeIcon icon={faEllipsis} className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-white border border-slate-200 shadow-md">
                <DropdownMenuGroup>
                    {onView && (
                        <DropdownMenuItem
                            onClick={() => onView(row.original)}
                            className="text-xs cursor-pointer gap-2"
                        >
                            <FontAwesomeIcon icon={faEye} className="size-3 text-slate-400" />
                            <span>View details</span>
                        </DropdownMenuItem>
                    )}
                    {onEdit && (
                        <DropdownMenuItem
                            onClick={() => onEdit(row.original)}
                            className="text-xs cursor-pointer gap-2"
                        >
                            <FontAwesomeIcon icon={faPenToSquare} className="size-3 text-slate-400" />
                            <span>Edit</span>
                        </DropdownMenuItem>
                    )}
                    {customActions.map((action, i) => (
                        <DropdownMenuItem
                            key={i}
                            onClick={() => action.onClick(row.original)}
                            className="text-xs cursor-pointer gap-2"
                        >
                            {action.icon && (
                                <FontAwesomeIcon icon={action.icon} className="size-3 text-slate-400" />
                            )}
                            <span>{action.label}</span>
                        </DropdownMenuItem>
                    ))}
                    {onDelete && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(row.original)}
                                className="text-xs cursor-pointer gap-2 text-rose-600 focus:text-rose-700 focus:bg-rose-50"
                            >
                                <FontAwesomeIcon icon={faTrash} className="size-3 text-rose-500" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

