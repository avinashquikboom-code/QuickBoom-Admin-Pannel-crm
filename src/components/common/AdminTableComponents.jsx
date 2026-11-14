'use client';

import * as React from 'react';
import { PageHeader as BasePageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
    faColumns,
    faEllipsis,
    faEye,
    faInbox,
    faMagnifyingGlass,
    faPen,
    faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';

/**
 * 1. AdminPageHeader - Consistent header across all administrative listing screens
 */
export function AdminPageHeader({
    title,
    description,
    icon,
    category,
    actions,
    primaryAction,
    exportAction,
    onRefresh,
    isRefreshing = false,
    className,
}) {
    return (
        <BasePageHeader
            title={title}
            description={description}
            icon={icon}
            category={category}
            className={className}
            actions={
                <div className="flex flex-wrap items-center gap-2">
                    {exportAction}
                    {primaryAction}
                    {actions}
                </div>
            }
        />
    );
}

/**
 * 2. AdminStatsCards - Top summary statistics cards strip
 */
export function AdminStatsCards({ items = [], className }) {
    if (!items || items.length === 0) return null;
    return (
        <div
            className={cn(
                'grid grid-cols-2 gap-3 sm:grid-cols-4',
                items.length === 3 && 'sm:grid-cols-3',
                items.length === 2 && 'sm:grid-cols-2',
                className
            )}
        >
            {items.map((item, idx) => {
                const borderBg =
                    item.variant === 'success'
                        ? 'border-emerald-100 bg-[#E8F8EE]/50 text-[#169F4D]'
                        : item.variant === 'danger' || item.variant === 'destructive'
                        ? 'border-rose-100 bg-rose-50/50 text-rose-700'
                        : item.variant === 'warning'
                        ? 'border-amber-100 bg-amber-50/50 text-amber-700'
                        : 'border-slate-200/80 bg-white text-slate-800';

                return (
                    <div
                        key={item.label || idx}
                        className={cn(
                            'p-3.5 rounded-2xl border shadow-2xs transition-all flex flex-col justify-between',
                            borderBg
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                {item.label}
                            </span>
                            {item.icon && (
                                <span className="text-slate-400">
                                    <FontAwesomeIcon icon={item.icon} className="size-3.5" />
                                </span>
                            )}
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-xl font-bold text-slate-900 leading-none">
                                {item.value ?? '—'}
                            </span>
                            {item.change && (
                                <span
                                    className={cn(
                                        'text-[10px] font-semibold',
                                        item.changeType === 'decrease'
                                            ? 'text-rose-600'
                                            : 'text-emerald-600'
                                    )}
                                >
                                    {item.change}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/**
 * 3. AdminTableContainer - Master design system white rounded container
 */
export function AdminTableContainer({ children, className }) {
    return (
        <div
            className={cn(
                'min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden',
                className
            )}
        >
            {children}
        </div>
    );
}

/**
 * 4. AdminTableToolbar - Flexible responsive table toolbar
 */
export function AdminTableToolbar({
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Search records…',
    statusValue,
    onStatusChange,
    statusOptions = [],
    selectedCount = 0,
    columnSelector,
    actions,
    className,
}) {
    return (
        <div
            className={cn(
                'flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 p-3.5 bg-white',
                className
            )}
        >
            <div className="flex min-w-0 flex-1 flex-wrap flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {onSearchChange && (
                    <div className="relative w-full sm:max-w-xs">
                        <FontAwesomeIcon
                            icon={faMagnifyingGlass}
                            className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400"
                        />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="h-9 w-full pl-9 pr-3 text-xs border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-brand rounded-xl"
                        />
                    </div>
                )}

                {statusOptions.length > 0 && onStatusChange && (
                    <Select value={statusValue} onValueChange={onStatusChange}>
                        <SelectTrigger className="h-9 text-xs border-slate-200 bg-slate-50/50 rounded-xl min-w-[130px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="all" className="text-xs">
                                All statuses
                            </SelectItem>
                            {statusOptions.map((opt) => (
                                <SelectItem
                                    key={typeof opt === 'string' ? opt : opt.value}
                                    value={typeof opt === 'string' ? opt : opt.value}
                                    className="text-xs"
                                >
                                    {typeof opt === 'string'
                                        ? opt.replace(/_/g, ' ')
                                        : opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            <div className="flex max-w-full flex-wrap items-center gap-2.5 self-end sm:self-auto">
                {selectedCount > 0 && (
                    <span className="text-xs font-semibold text-[#169F4D] bg-[#E8F8EE] border border-emerald-200/80 px-2.5 py-1 rounded-full whitespace-nowrap">
                        {selectedCount} selected
                    </span>
                )}
                {columnSelector}
                {actions}
            </div>
        </div>
    );
}

/**
 * 5. AdminDataTable - Standardized TanStack Table wrapper
 */
export const AdminDataTable = DataTable;

/**
 * 6. AdminMobileRecordCard - Clean card rendering for mobile viewports
 */
export function AdminMobileRecordCard({
    title,
    subtitle,
    avatar,
    badge,
    details = [],
    actions,
    className,
    onClick,
}) {
    return (
        <div
            onClick={onClick}
            className={cn(
                'rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3 transition-colors',
                onClick && 'cursor-pointer hover:border-emerald-300',
                className
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                    {avatar}
                    <div className="min-w-0 flex flex-col">
                        <span className="font-semibold text-slate-900 text-sm truncate">
                            {title}
                        </span>
                        {subtitle && (
                            <span className="text-xs text-slate-400 truncate">{subtitle}</span>
                        )}
                    </div>
                </div>
                {badge && <div className="shrink-0">{badge}</div>}
            </div>

            {details.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    {details.map((item, idx) => (
                        <div key={idx} className="flex flex-col">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                {item.label}
                            </span>
                            <span className="font-medium text-slate-700 truncate mt-0.5">
                                {item.value ?? '—'}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {actions && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}

/**
 * 7. AdminStatusBadge - Re-export of standard StatusBadge
 */
export const AdminStatusBadge = StatusBadge;

import { AdminRowActions } from '@/components/common/AdminRowActions';
export { AdminRowActions };

/**
 * 8. AdminTableActions - Standard compact row actions
 */
export function AdminTableActions({
    row,
    record,
    recordName,
    onView,
    onEdit,
    onDelete,
    onToggleStatus,
    onArchive,
    customActions = [],
    moreActions = [],
    actions = [],
    useDropdownOnly = false,
}) {
    if (useDropdownOnly || moreActions.length > 0 || actions.length > 0) {
        return (
            <div className="flex items-center justify-end">
                <AdminRowActions
                    row={row}
                    record={record}
                    recordName={recordName}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                    onArchive={onArchive}
                    customActions={[...customActions, ...moreActions]}
                    actions={actions}
                />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-end gap-1">
            {onView && (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onView}
                    title="View details"
                    className="h-8 w-8 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                >
                    <FontAwesomeIcon icon={faEye} className="size-3.5" />
                    <span className="sr-only">View</span>
                </Button>
            )}
            {onEdit && (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onEdit}
                    title="Edit record"
                    className="h-8 w-8 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                >
                    <FontAwesomeIcon icon={faPen} className="size-3.5" />
                    <span className="sr-only">Edit</span>
                </Button>
            )}
            {onDelete && (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onDelete}
                    title="Delete record"
                    className="h-8 w-8 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                >
                    <FontAwesomeIcon icon={faTrashCan} className="size-3.5" />
                    <span className="sr-only">Delete</span>
                </Button>
            )}
            {customActions}
        </div>
    );
}

/**
 * 9. AdminColumnSelector - Standard Column visibility selector
 */
export function AdminColumnSelector({ columns = [], onToggle, isVisible }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs border-slate-200 bg-slate-50/50 hover:bg-slate-100 rounded-xl gap-1.5 text-slate-600 font-medium"
                    />
                }
            >
                <FontAwesomeIcon icon={faColumns} className="size-3 text-slate-400" />
                <span>Columns</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-48 bg-white border-slate-200 shadow-md rounded-xl p-1"
            >
                {columns.map((col) => (
                    <DropdownMenuCheckboxItem
                        key={col.id}
                        checked={isVisible ? isVisible(col.id) : col.visible}
                        onCheckedChange={(val) => onToggle && onToggle(col.id, !!val)}
                        className="text-xs rounded-lg"
                    >
                        {col.label || col.id}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * 10. AdminPagination - Re-export of standard pagination
 */
export const AdminPagination = Pagination;

/**
 * 11. AdminEmptyState - Standard empty state placeholder
 */
export function AdminEmptyState({
    title = 'No records found',
    description = 'There are no items matching your criteria.',
    icon = faInbox,
    action,
    className,
}) {
    return (
        <div
            className={cn(
                'py-12 px-4 text-center flex flex-col items-center justify-center space-y-3 bg-white',
                className
            )}
        >
            <div className="size-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <FontAwesomeIcon icon={icon} className="size-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">{title}</h4>
            <p className="text-xs text-slate-400 max-w-sm">{description}</p>
            {action && <div className="pt-2">{action}</div>}
        </div>
    );
}

/**
 * 12. AdminLoadingSkeleton - Standard skeleton loader for tables
 */
export function AdminLoadingSkeleton({ rows = 5, className }) {
    return (
        <div
            className={cn(
                'space-y-3 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs',
                className
            )}
        >
            <div className="h-9 w-64 bg-slate-100 animate-pulse rounded-xl" />
            <div className="space-y-2 pt-2">
                {Array.from({ length: rows }).map((_, i) => (
                    <Skeleton key={i} className="h-11 w-full rounded-xl" />
                ))}
            </div>
        </div>
    );
}

/**
 * 13. AdminFilterDropdown - Reusable select dropdown for custom filters
 */
export function AdminFilterDropdown({
    value,
    onChange,
    options = [],
    placeholder = 'Filter',
    className,
}) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger
                className={cn(
                    'h-9 text-xs border-slate-200 bg-slate-50/50 rounded-xl min-w-[130px]',
                    className
                )}
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="bg-white">
                {options.map((opt) => (
                    <SelectItem
                        key={typeof opt === 'string' ? opt : opt.value}
                        value={typeof opt === 'string' ? opt : opt.value}
                        className="text-xs"
                    >
                        {typeof opt === 'string' ? opt : opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

