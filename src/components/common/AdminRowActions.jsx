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
    faBan,
    faBoxArchive,
    faCheck,
    faCheckDouble,
    faCircleInfo,
    faCopy,
    faDownload,
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
 * Determine a standard Font Awesome icon if none is explicitly provided
 */
function resolveActionIcon(icon, label = '') {
    if (icon) return icon;
    const l = label.toLowerCase();
    if (l.includes('view') || l.includes('detail') || l.includes('dossier') || l.includes('review') || l.includes('profile')) return faEye;
    if (l.includes('edit') || l.includes('modify') || l.includes('update')) return faPenToSquare;
    if (l.includes('delete') || l.includes('remove')) return faTrashCan;
    if (l.includes('download') || l.includes('export') || l.includes('pdf')) return faDownload;
    if (l.includes('approve')) return faCheck;
    if (l.includes('pay')) return faCheckDouble;
    if (l.includes('cancel') || l.includes('reject')) return faBan;
    if (l.includes('copy')) return faCopy;
    if (l.includes('archive')) return faBoxArchive;
    if (l.includes('restore')) return faRotateLeft;
    if (l.includes('status') || l.includes('toggle') || l.includes('activate') || l.includes('deactivate')) return faToggleOn;
    return faCircleInfo;
}

/**
 * Identify if an action is destructive
 */
function isDestructiveAction(variant, label = '') {
    if (variant === 'destructive') return true;
    const l = label.toLowerCase();
    return l.includes('delete') || l.includes('remove');
}

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
    viewIcon,
    onEdit,
    editLabel = 'Edit',
    editIcon,
    onDuplicate,
    duplicateLabel = 'Duplicate',
    duplicateIcon,
    onToggleStatus,
    statusLabel,
    onArchive,
    archiveLabel = 'Archive',
    archiveIcon,
    confirmArchive = false,
    onRestore,
    restoreLabel = 'Restore',
    restoreIcon,
    onDelete,
    deleteLabel = 'Delete',
    deleteIcon,
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
            item.invoiceNo ||
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

    // Assemble list of standard non-destructive actions
    const standardActions = [];

    if (onView) {
        standardActions.push({
            id: 'view',
            label: viewLabel,
            icon: resolveActionIcon(viewIcon, viewLabel),
            onClick: () => onView(item),
        });
    }

    if (onEdit) {
        standardActions.push({
            id: 'edit',
            label: editLabel,
            icon: resolveActionIcon(editIcon, editLabel),
            onClick: () => onEdit(item),
        });
    }

    if (onDuplicate) {
        standardActions.push({
            id: 'duplicate',
            label: duplicateLabel,
            icon: resolveActionIcon(duplicateIcon, duplicateLabel),
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
            icon: resolveActionIcon(restoreIcon, restoreLabel),
            onClick: () => onRestore(item),
        });
    }

    // Merge customActions and explicit actions prop
    const rawCustomList = [...customActions, ...actions].filter((a) => !a.hidden);

    const nonDestructiveCustom = rawCustomList
        .filter((a) => !isDestructiveAction(a.variant, a.label))
        .map((a) => ({
            id: a.id || a.label,
            label: a.label,
            icon: resolveActionIcon(a.icon, a.label),
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
        }));

    const combinedStandard = [...standardActions, ...nonDestructiveCustom];

    // Destructive actions
    const destructiveActions = [];

    if (onArchive) {
        destructiveActions.push({
            id: 'archive',
            label: archiveLabel,
            icon: resolveActionIcon(archiveIcon, archiveLabel),
            onClick: handleArchive,
            isDestructive: false,
            isArchive: true,
        });
    }

    const destructiveCustom = rawCustomList
        .filter((a) => isDestructiveAction(a.variant, a.label))
        .map((a) => ({
            id: a.id || a.label,
            label: a.label,
            icon: resolveActionIcon(a.icon || faTrashCan, a.label),
            disabled: a.disabled,
            isDestructive: true,
            onClick: () => {
                const needsConfirm = a.confirm !== false;
                if (needsConfirm) {
                    setConfirmState({
                        open: true,
                        title: (typeof a.confirm === 'object' && a.confirm?.title) || `Delete ${title}?`,
                        description: (typeof a.confirm === 'object' && a.confirm?.description) || 'Are you sure you want to proceed? This action cannot be undone.',
                        confirmLabel: (typeof a.confirm === 'object' && a.confirm?.confirmLabel) || 'Delete',
                        variant: (typeof a.confirm === 'object' && a.confirm?.variant) || 'destructive',
                        onConfirm: () => (a.onClick ? a.onClick(item) : a.onSelect?.(item)),
                    });
                } else if (a.onClick) {
                    a.onClick(item);
                } else if (a.onSelect) {
                    a.onSelect(item);
                }
            },
        }));

    destructiveActions.push(...destructiveCustom);

    if (onDelete) {
        destructiveActions.push({
            id: 'delete',
            label: deleteLabel,
            icon: resolveActionIcon(deleteIcon, deleteLabel),
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
