'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
    faBan,
    faBoxArchive,
    faCheck,
    faCheckDouble,
    faCircleInfo,
    faClockRotateLeft,
    faCopy,
    faDownload,
    faEllipsisVertical,
    faEye,
    faPaperPlane,
    faPenToSquare,
    faRotate,
    faRotateLeft,
    faToggleOff,
    faToggleOn,
    faTrashCan,
    faUserCheck,
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';

/**
 * Determine a standard Font Awesome icon if none is explicitly provided
 */
function resolveActionIcon(icon, label = '') {
    if (icon) return icon;
    const l = String(label || '').toLowerCase();
    if (l.includes('view') || l.includes('detail') || l.includes('dossier') || l.includes('review') || l.includes('profile') || l.includes('slip') || l.includes('payslip')) return faEye;
    if (l.includes('edit') || l.includes('modify') || l.includes('update') || l.includes('configure') || l.includes('custom limit')) return faPenToSquare;
    if (l.includes('delete') || l.includes('remove') || l.includes('suspend') || l.includes('disconnect') || l.includes('terminate')) return faTrashCan;
    if (l.includes('download') || l.includes('export') || l.includes('pdf')) return faDownload;
    if (l.includes('duplicate') || l.includes('copy') || l.includes('clone')) return faCopy;
    if (l.includes('assign') || l.includes('permission') || l.includes('role') || l.includes('member')) return faUserCheck;
    if (l.includes('approve')) return faCheck;
    if (l.includes('pay') || l.includes('mark paid') || l.includes('paid')) return faCheckDouble;
    if (l.includes('cancel') || l.includes('reject')) return faBan;
    if (l.includes('archive')) return faBoxArchive;
    if (l.includes('restore')) return faRotateLeft;
    if (l.includes('retry') || l.includes('sync') || l.includes('refresh')) return faRotate;
    if (l.includes('history') || l.includes('log') || l.includes('audit')) return faClockRotateLeft;
    if (l.includes('launch') || l.includes('send') || l.includes('publish') || l.includes('test')) return faPaperPlane;
    if (l.includes('status') || l.includes('toggle') || l.includes('activate') || l.includes('deactivate') || l.includes('enable') || l.includes('disable')) return faToggleOn;
    return faCircleInfo;
}

/**
 * Identify if an action is destructive
 */
function isDestructiveAction(variant, label = '') {
    if (variant === 'destructive' || variant === 'danger') return true;
    const l = String(label || '').toLowerCase();
    return (
        l.includes('delete') ||
        l.includes('remove') ||
        l.includes('suspend') ||
        l.includes('disconnect') ||
        l.includes('terminate') ||
        l.includes('reject')
    );
}

/**
 * MoreActionsMenu / AdminRowActions
 *
 * Standardized three-dot (⋮) More Actions dropdown component across the entire QB Suite Admin Panel.
 *
 * Features:
 * - Single vertical three-dot trigger (faEllipsisVertical).
 * - Clickable area: 36px (size-9), centered in table cell.
 * - Polished white dropdown menu with subtle border, soft shadow, rounded corners.
 * - Shows only supported and permitted actions for that row.
 * - Subtle divider before destructive actions (e.g. Delete, Disconnect).
 * - Red text and hover styling for destructive items.
 * - Built-in confirmation modal for Delete and any action with `confirm`.
 * - Portal-rendered to avoid clipping inside scrollable table containers.
 * - Keyboard accessible (Esc, Enter, arrow navigation).
 */
export function AdminRowActions({
    row,
    record,
    recordName,
    permissions,
    onAction,
    onView,
    viewLabel = 'View details',
    viewIcon,
    viewDisabled = false,
    onEdit,
    editLabel = 'Edit',
    editIcon,
    editDisabled = false,
    onToggleStatus,
    statusLabel,
    statusIcon,
    statusDisabled = false,
    onDuplicate,
    duplicateLabel = 'Duplicate',
    duplicateIcon,
    duplicateDisabled = false,
    onAssign,
    assignLabel = 'Assign',
    assignIcon,
    assignDisabled = false,
    onDownload,
    downloadLabel = 'Download',
    downloadIcon,
    downloadDisabled = false,
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
    deleteDescription,
    confirmDelete = true,
    deleteDisabled = false,
    actions = [],
    customActions = [],
    disabled = false,
    placement,
    align = 'end',
    side = 'bottom',
    size = 'sm',
    className,
    triggerClassName,
    contentClassName,
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
            item.companyName ||
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

    // Respect permissions object if supplied
    const canView = permissions ? (permissions.canView ?? permissions.VIEW ?? permissions.read ?? true) : true;
    const canEdit = permissions ? (permissions.canEdit ?? permissions.EDIT ?? permissions.update ?? permissions.write ?? true) : true;
    const canDelete = permissions ? (permissions.canDelete ?? permissions.DELETE ?? permissions.delete ?? true) : true;
    const canAssign = permissions ? (permissions.canAssign ?? permissions.ASSIGN ?? true) : true;
    const canDuplicate = permissions ? (permissions.canDuplicate ?? permissions.DUPLICATE ?? true) : true;
    const canDownload = permissions ? (permissions.canDownload ?? permissions.DOWNLOAD ?? true) : true;
    const canToggle = permissions ? (permissions.canToggle ?? permissions.STATUS ?? permissions.canEdit ?? true) : true;

    // Handle delete with optional confirmation
    const handleDelete = React.useCallback(() => {
        if (!onDelete) return;
        if (confirmDelete) {
            setConfirmState({
                open: true,
                title: `Delete ${title}?`,
                description: deleteDescription || `Are you sure you want to delete ${title}? This action cannot be undone.`,
                confirmLabel: 'Delete',
                variant: 'destructive',
                onConfirm: () => onDelete(item),
            });
        } else {
            onDelete(item);
        }
    }, [onDelete, confirmDelete, deleteDescription, title, item]);

    // Handle archive with optional confirmation
    const handleArchive = React.useCallback(() => {
        if (!onArchive) return;
        if (confirmArchive) {
            setConfirmState({
                open: true,
                title: `Archive ${title}?`,
                description: `Are you sure you want to archive ${title}?`,
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

    if (onView && canView) {
        standardActions.push({
            id: 'view',
            label: viewLabel,
            icon: resolveActionIcon(viewIcon, viewLabel),
            disabled: viewDisabled,
            onClick: () => {
                onView(item);
                onAction?.('view', item);
            },
        });
    }

    if (onEdit && canEdit) {
        standardActions.push({
            id: 'edit',
            label: editLabel,
            icon: resolveActionIcon(editIcon, editLabel),
            disabled: editDisabled,
            onClick: () => {
                onEdit(item);
                onAction?.('edit', item);
            },
        });
    }

    if (onDuplicate && canDuplicate) {
        standardActions.push({
            id: 'duplicate',
            label: duplicateLabel,
            icon: resolveActionIcon(duplicateIcon, duplicateLabel),
            disabled: duplicateDisabled,
            onClick: () => {
                onDuplicate(item);
                onAction?.('duplicate', item);
            },
        });
    }

    if (onAssign && canAssign) {
        standardActions.push({
            id: 'assign',
            label: assignLabel,
            icon: resolveActionIcon(assignIcon, assignLabel),
            disabled: assignDisabled,
            onClick: () => {
                onAssign(item);
                onAction?.('assign', item);
            },
        });
    }

    if (onDownload && canDownload) {
        standardActions.push({
            id: 'download',
            label: downloadLabel,
            icon: resolveActionIcon(downloadIcon, downloadLabel),
            disabled: downloadDisabled,
            onClick: () => {
                onDownload(item);
                onAction?.('download', item);
            },
        });
    }

    if (onToggleStatus && canToggle) {
        standardActions.push({
            id: 'status',
            label: statusLabel || (isRecordActive ? 'Deactivate' : 'Activate'),
            icon: statusIcon || (isRecordActive ? faToggleOff : faToggleOn),
            disabled: statusDisabled,
            onClick: () => {
                onToggleStatus(item);
                onAction?.('status', item);
            },
        });
    }

    if (onRestore) {
        standardActions.push({
            id: 'restore',
            label: restoreLabel,
            icon: resolveActionIcon(restoreIcon, restoreLabel),
            onClick: () => {
                onRestore(item);
                onAction?.('restore', item);
            },
        });
    }

    // Filter and merge customActions and explicit actions prop
    const rawCustomList = [...customActions, ...actions].filter((a) => {
        if (!a) return false;
        if (typeof a.hidden === 'function') return !a.hidden(item);
        if (a.hidden) return false;
        if (a.permission === false) return false;
        if (a.permissionKey && permissions && permissions[a.permissionKey] === false) return false;
        return true;
    });

    const nonDestructiveCustom = rawCustomList
        .filter((a) => !isDestructiveAction(a.variant, a.label))
        .map((a) => ({
            id: a.id || a.label,
            label: a.label,
            icon: resolveActionIcon(a.icon, a.label),
            disabled: typeof a.disabled === 'function' ? a.disabled(item) : a.disabled,
            separator: a.separator,
            onClick: () => {
                if (a.confirm) {
                    setConfirmState({
                        open: true,
                        title: a.confirm.title || `Confirm action for ${title}?`,
                        description: a.confirm.description || '',
                        confirmLabel: a.confirm.confirmLabel || 'Confirm',
                        variant: a.confirm.variant || 'default',
                        onConfirm: () => {
                            if (a.onClick) a.onClick(item);
                            else if (a.onSelect) a.onSelect(item);
                            onAction?.(a.id || a.label, item);
                        },
                    });
                } else {
                    if (a.onClick) a.onClick(item);
                    else if (a.onSelect) a.onSelect(item);
                    onAction?.(a.id || a.label, item);
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
            disabled: typeof a.disabled === 'function' ? a.disabled(item) : a.disabled,
            isDestructive: true,
            onClick: () => {
                const needsConfirm = a.confirm !== false;
                if (needsConfirm && a.confirm) {
                    setConfirmState({
                        open: true,
                        title: (typeof a.confirm === 'object' && a.confirm?.title) || `Delete ${title}?`,
                        description:
                            (typeof a.confirm === 'object' && a.confirm?.description) ||
                            'Are you sure you want to proceed? This action cannot be undone.',
                        confirmLabel: (typeof a.confirm === 'object' && a.confirm?.confirmLabel) || 'Delete',
                        variant: (typeof a.confirm === 'object' && a.confirm?.variant) || 'destructive',
                        onConfirm: () => {
                            if (a.onClick) a.onClick(item);
                            else if (a.onSelect) a.onSelect(item);
                            onAction?.(a.id || a.label, item);
                        },
                    });
                } else {
                    if (a.onClick) a.onClick(item);
                    else if (a.onSelect) a.onSelect(item);
                    onAction?.(a.id || a.label, item);
                }
            },
        }));

    destructiveActions.push(...destructiveCustom);

    if (onDelete && canDelete) {
        destructiveActions.push({
            id: 'delete',
            label: deleteLabel,
            icon: resolveActionIcon(deleteIcon, deleteLabel),
            disabled: deleteDisabled,
            onClick: handleDelete,
            isDestructive: true,
        });
    }

    const totalActions = combinedStandard.length + destructiveActions.length;
    if (totalActions === 0) return null;

    // Resolve side & align from placement if provided
    let resolvedAlign = align;
    let resolvedSide = side;
    if (placement) {
        if (placement.includes('end') || placement.includes('right')) resolvedAlign = 'end';
        else if (placement.includes('start') || placement.includes('left')) resolvedAlign = 'start';
        else if (placement.includes('center')) resolvedAlign = 'center';

        if (placement.startsWith('top')) resolvedSide = 'top';
        else if (placement.startsWith('bottom')) resolvedSide = 'bottom';
        else if (placement.startsWith('left')) resolvedSide = 'left';
        else if (placement.startsWith('right')) resolvedSide = 'right';
    }

    // Size variants for the trigger button
    const sizeClasses =
        size === 'lg'
            ? 'h-10 w-10 text-sm'
            : size === 'xs'
              ? 'h-7 w-7 text-xs'
              : 'h-9 w-9 text-xs'; // standard 36px

    return (
        <>
            <div className={cn('inline-flex items-center justify-center', className)}>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={disabled}
                                className={cn(
                                    sizeClasses,
                                    'rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors',
                                    'focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none',
                                    'data-[state=open]:bg-slate-100 data-[state=open]:text-slate-900',
                                    'data-popup-open:bg-slate-100 data-popup-open:text-slate-900',
                                    triggerClassName
                                )}
                                aria-label={`More actions for ${title}`}
                                title="More actions"
                            />
                        }
                    >
                        <FontAwesomeIcon icon={faEllipsisVertical} className="size-4" />
                        <span className="sr-only">More actions</span>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align={resolvedAlign}
                        side={resolvedSide}
                        sideOffset={4}
                        className={cn(
                            'w-auto min-w-[180px] max-w-xs bg-white border border-slate-200/90 shadow-xl rounded-xl p-1.5 space-y-0.5 z-50 text-xs font-normal text-slate-700 outline-none',
                            contentClassName
                        )}
                    >
                        {/* Standard Non-Destructive Actions */}
                        {combinedStandard.map((act) => (
                            <React.Fragment key={act.id}>
                                {act.separator && <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-slate-100" />}
                                <DropdownMenuItem
                                    disabled={disabled || act.disabled}
                                    onClick={act.onClick}
                                    className="group/item flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg cursor-pointer transition-colors outline-none select-none hover:bg-slate-100/90 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900 data-disabled:pointer-events-none data-disabled:opacity-50"
                                >
                                    {act.icon && (
                                        <FontAwesomeIcon
                                            icon={act.icon}
                                            className="size-3.5 shrink-0 text-slate-400 group-hover/item:text-slate-600 transition-colors"
                                        />
                                    )}
                                    <span className="truncate">{act.label}</span>
                                </DropdownMenuItem>
                            </React.Fragment>
                        ))}

                        {/* Subtle Divider before destructive actions */}
                        {combinedStandard.length > 0 && destructiveActions.length > 0 && (
                            <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-slate-100" />
                        )}

                        {/* Destructive Actions (Delete, Remove, etc.) */}
                        {destructiveActions.map((act) => (
                            <DropdownMenuItem
                                key={act.id}
                                disabled={disabled || act.disabled}
                                onClick={act.onClick}
                                variant="destructive"
                                className="group/item flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 rounded-lg cursor-pointer transition-colors outline-none select-none hover:bg-rose-50 hover:text-rose-700 focus:bg-rose-50 focus:text-rose-700 data-disabled:pointer-events-none data-disabled:opacity-50"
                            >
                                {act.icon && (
                                    <FontAwesomeIcon
                                        icon={act.icon}
                                        className="size-3.5 shrink-0 text-rose-500 group-hover/item:text-rose-600 transition-colors"
                                    />
                                )}
                                <span className="truncate">{act.label}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

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

// Re-export as MoreActionsMenu to fulfill component naming requirement
export const MoreActionsMenu = AdminRowActions;

export default AdminRowActions;
