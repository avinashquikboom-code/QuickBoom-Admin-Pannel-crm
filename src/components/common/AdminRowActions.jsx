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
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
    faBoxArchive,
    faCopy,
    faEllipsis,
    faEye,
    faPenToSquare,
    faRotateLeft,
    faToggleOff,
    faToggleOn,
    faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';

/**
 * AdminRowActions - Standard modern row actions menu across QB Suite Admin Panel
 *
 * Provides a clean three-dot horizontal button with green/teal hover state,
 * tooltip, and a modern dropdown menu with icons, proper spacing, destructive states,
 * and built-in confirmation dialogs.
 */
export function AdminRowActions({
    row,
    record,
    recordName,
    onView,
    viewLabel = 'View details',
    viewIcon = faEye,
    onEdit,
    editLabel = 'Edit',
    editIcon = faPenToSquare,
    onDuplicate,
    duplicateLabel = 'Duplicate',
    duplicateIcon = faCopy,
    onToggleStatus,
    statusLabel,
    onArchive,
    archiveLabel = 'Archive',
    archiveIcon = faBoxArchive,
    confirmArchive = false,
    onRestore,
    restoreLabel = 'Restore',
    restoreIcon = faRotateLeft,
    onDelete,
    deleteLabel = 'Delete',
    deleteIcon = faTrashCan,
    confirmDelete = true,
    actions = [],
    customActions = [],
    disabled = false,
    align = 'end',
    side = 'bottom',
    className,
}) {
    const item = row?.original ?? row ?? record ?? {};

    // Compute title for accessibility & confirmation dialogs
    const title = React.useMemo(() => {
        if (recordName) {
            return typeof recordName === 'function' ? recordName(item) : recordName;
        }
        return (
            item.name ||
            item.title ||
            item.employeeName ||
            item.fullName ||
            item.company ||
            item.invoiceNumber ||
            item.orderNumber ||
            item.email ||
            (item.id ? `Record #${item.id}` : 'this record')
        );
    }, [recordName, item]);

    // Internal confirm dialog state
    const [confirmState, setConfirmState] = React.useState({
        open: false,
        title: '',
        description: '',
        confirmLabel: 'Confirm',
        variant: 'default',
        onConfirm: () => {},
    });

    const isRecordActive = React.useMemo(() => {
        if (typeof item.isActive === 'boolean') return item.isActive;
        if (typeof item.status === 'string') {
            const s = item.status.toLowerCase();
            return s === 'active' || s === 'approved' || s === 'published';
        }
        return true;
    }, [item]);

    // Handle delete with optional confirmation
    const handleDelete = React.useCallback(() => {
        if (!onDelete) return;
        if (confirmDelete) {
            setConfirmState({
                open: true,
                title: `Delete ${title}?`,
                description: `Are you sure you want to delete this record? This action cannot be undone.`,
                confirmLabel: 'Delete',
                variant: 'destructive',
                onConfirm: () => onDelete(item),
            });
        } else {
            onDelete(item);
        }
    }, [onDelete, confirmDelete, title, item]);

    // Handle archive with optional confirmation
    const handleArchive = React.useCallback(() => {
        if (!onArchive) return;
        if (confirmArchive) {
            setConfirmState({
                open: true,
                title: `Archive ${title}?`,
                description: `Are you sure you want to archive this record?`,
                confirmLabel: 'Archive',
                variant: 'default',
                onConfirm: () => onArchive(item),
            });
        } else {
            onArchive(item);
        }
    }, [onArchive, confirmArchive, title, item]);

    // Assemble list of non-destructive actions
    const standardActions = [];

    if (onView) {
        standardActions.push({
            id: 'view',
            label: viewLabel,
            icon: viewIcon,
            onClick: () => onView(item),
        });
    }

    if (onEdit) {
        standardActions.push({
            id: 'edit',
            label: editLabel,
            icon: editIcon,
            onClick: () => onEdit(item),
        });
    }

    if (onDuplicate) {
        standardActions.push({
            id: 'duplicate',
            label: duplicateLabel,
            icon: duplicateIcon,
            onClick: () => onDuplicate(item),
        });
    }

    if (onToggleStatus) {
        standardActions.push({
            id: 'status',
            label: statusLabel || (isRecordActive ? 'Deactivate' : 'Activate'),
            icon: isRecordActive ? faToggleOff : faToggleOn,
            onClick: () => onToggleStatus(item),
        });
    }

    if (onRestore) {
        standardActions.push({
            id: 'restore',
            label: restoreLabel,
            icon: restoreIcon,
            onClick: () => onRestore(item),
        });
    }

    // Merge customActions and explicit actions prop
    const combinedStandard = [
        ...standardActions,
        ...customActions
            .filter((a) => !a.hidden && a.variant !== 'destructive')
            .map((a) => ({
                id: a.id || a.label,
                label: a.label,
                icon: a.icon,
                disabled: a.disabled,
                onClick: () => {
                    if (a.confirm) {
                        setConfirmState({
                            open: true,
                            title: a.confirm.title || `Confirm action for ${title}?`,
                            description: a.confirm.description || '',
                            confirmLabel: a.confirm.confirmLabel || 'Confirm',
                            variant: a.confirm.variant || 'default',
                            onConfirm: () => (a.onClick ? a.onClick(item) : a.onSelect?.(item)),
                        });
                    } else if (a.onClick) {
                        a.onClick(item);
                    } else if (a.onSelect) {
                        a.onSelect(item);
                    }
                },
            })),
        ...actions
            .filter((a) => !a.hidden && a.variant !== 'destructive')
            .map((a) => ({
                id: a.id || a.label,
                label: a.label,
                icon: a.icon,
                disabled: a.disabled,
                onClick: () => {
                    if (a.confirm) {
                        setConfirmState({
                            open: true,
                            title: a.confirm.title || `Confirm action for ${title}?`,
                            description: a.confirm.description || '',
                            confirmLabel: a.confirm.confirmLabel || 'Confirm',
                            variant: a.confirm.variant || 'default',
                            onConfirm: () => (a.onClick ? a.onClick(item) : a.onSelect?.(item)),
                        });
                    } else if (a.onClick) {
                        a.onClick(item);
                    } else if (a.onSelect) {
                        a.onSelect(item);
                    }
                },
            })),
    ];

    // Destructive actions (archive, delete, custom destructive)
    const destructiveActions = [];

    if (onArchive) {
        destructiveActions.push({
            id: 'archive',
            label: archiveLabel,
            icon: archiveIcon,
            onClick: handleArchive,
            isDestructive: false, // archive is warning / neutral
            isArchive: true,
        });
    }

    // Add any custom actions marked with variant: 'destructive'
    const customDestructive = [
        ...customActions.filter((a) => !a.hidden && a.variant === 'destructive'),
        ...actions.filter((a) => !a.hidden && a.variant === 'destructive'),
    ].map((a) => ({
        id: a.id || a.label,
        label: a.label,
        icon: a.icon || faTrashCan,
        disabled: a.disabled,
        isDestructive: true,
        onClick: () => {
            if (a.confirm) {
                setConfirmState({
                    open: true,
                    title: a.confirm.title || `Delete ${title}?`,
                    description: a.confirm.description || 'This action cannot be undone.',
                    confirmLabel: a.confirm.confirmLabel || 'Delete',
                    variant: 'destructive',
                    onConfirm: () => (a.onClick ? a.onClick(item) : a.onSelect?.(item)),
                });
            } else if (a.onClick) {
                a.onClick(item);
            } else if (a.onSelect) {
                a.onSelect(item);
            }
        },
    }));

    destructiveActions.push(...customDestructive);

    if (onDelete) {
        destructiveActions.push({
            id: 'delete',
            label: deleteLabel,
            icon: deleteIcon,
            onClick: handleDelete,
            isDestructive: true,
        });
    }

    const totalActions = combinedStandard.length + destructiveActions.length;
    if (totalActions === 0) return null;

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={disabled}
                            className={cn(
                                'size-8 rounded-lg border border-transparent text-slate-500',
                                'hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200/60',
                                'focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1',
                                'data-[state=open]:bg-emerald-50 data-[state=open]:text-emerald-800 data-[state=open]:border-emerald-200/80',
                                'transition-all duration-150 shrink-0 cursor-pointer',
                                className
                            )}
                            title="More actions"
                            aria-label={`More actions for ${title}`}
                        />
                    }
                >
                    <FontAwesomeIcon icon={faEllipsis} className="size-3.5" />
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align={align}
                    side={side}
                    sideOffset={4}
                    className="w-48 bg-white border border-slate-200/90 shadow-lg shadow-slate-200/60 rounded-xl p-1 z-50 text-xs"
                >
                    {combinedStandard.length > 0 && (
                        <DropdownMenuGroup>
                            {combinedStandard.map((act) => (
                                <DropdownMenuItem
                                    key={act.id}
                                    disabled={act.disabled}
                                    onClick={act.onClick}
                                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800 transition-colors cursor-pointer select-none"
                                >
                                    {act.icon && (
                                        <FontAwesomeIcon
                                            icon={act.icon}
                                            className="size-3.5 text-slate-400 shrink-0"
                                        />
                                    )}
                                    <span className="truncate">{act.label}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    )}

                    {destructiveActions.length > 0 && (
                        <>
                            {combinedStandard.length > 0 && (
                                <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-slate-100" />
                            )}
                            <DropdownMenuGroup>
                                {destructiveActions.map((act) => (
                                    <DropdownMenuItem
                                        key={act.id}
                                        disabled={act.disabled}
                                        onClick={act.onClick}
                                        className={cn(
                                            'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer select-none',
                                            act.isDestructive
                                                ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700 focus:bg-rose-50 focus:text-rose-700'
                                                : 'text-amber-700 hover:bg-amber-50 hover:text-amber-800 focus:bg-amber-50 focus:text-amber-800'
                                        )}
                                    >
                                        {act.icon && (
                                            <FontAwesomeIcon
                                                icon={act.icon}
                                                className={cn(
                                                    'size-3.5 shrink-0',
                                                    act.isDestructive
                                                        ? 'text-rose-500'
                                                        : 'text-amber-600'
                                                )}
                                            />
                                        )}
                                        <span className="truncate">{act.label}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuGroup>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Built-in Confirmation Dialog */}
            {confirmState.open && (
                <ConfirmDialog
                    open={confirmState.open}
                    onOpenChange={(open) =>
                        setConfirmState((prev) => ({ ...prev, open }))
                    }
                    title={confirmState.title}
                    description={confirmState.description}
                    confirmLabel={confirmState.confirmLabel}
                    variant={confirmState.variant}
                    onConfirm={confirmState.onConfirm}
                />
            )}
        </>
    );
}

export default AdminRowActions;
