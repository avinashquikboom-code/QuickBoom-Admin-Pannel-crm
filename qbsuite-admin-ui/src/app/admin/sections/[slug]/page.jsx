'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { KpiGrid } from '@/components/common/KpiCard';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
    DataTable,
    DataTableColumnHeader,
    DataTableRowActions,
} from '@/components/data-table';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
    faPlus,
    faDownload,
    faBuilding,
    faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import { getSectionConfig } from '@/config/admin-sections';

export default function SectionPage() {
    return (
        <React.Suspense fallback={<div className="p-8 text-center text-slate-400">Loading workspace...</div>}>
            <SectionPageContent />
        </React.Suspense>
    );
}

function SectionPageContent() {
    const params = useParams();
    const raw = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    const slug = String(raw || 'departments').toLowerCase();

    // Look up section configuration from centralized registry
    const config = getSectionConfig(slug) || {
        id: slug,
        name: slug.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
        slug,
        category: 'MODULE MANAGEMENT',
        title: slug.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
        icon: faBuilding,
        singular: slug.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
        description: `Manage organizational ${slug.replaceAll('-', ' ')} records, assign owners, and track performance.`,
        headLabel: 'Owner / Lead',
        metricLabel: 'Volume / Units',
        initialRecords: [
            { id: 'REC-01', name: 'Standard Operations Unit', code: 'OPS-01', head: 'Marcus Brody', members: 24, status: 'Active', createdOn: '10 Jan 2026', description: 'Primary operational unit.' },
            { id: 'REC-02', name: 'Secondary Unit', code: 'SEC-02', head: 'Sarah Jenkins', members: 16, status: 'Active', createdOn: '15 Jan 2026', description: 'Regional support team.' },
        ],
    };

    const [records, setRecords] = React.useState(config.initialRecords);
    const [selectedTab, setSelectedTab] = React.useState('all');

    // Drawer state
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [editingRecord, setEditingRecord] = React.useState(null);

    // View details state
    const [viewingRecord, setViewingRecord] = React.useState(null);
    const [viewDrawerOpen, setViewDrawerOpen] = React.useState(false);

    // Delete confirmation state
    const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
    const [recordToDelete, setRecordToDelete] = React.useState(null);

    // Form fields
    const [formName, setFormName] = React.useState('');
    const [formCode, setFormCode] = React.useState('');
    const [formHead, setFormHead] = React.useState('');
    const [formMembers, setFormMembers] = React.useState(0);
    const [formDesc, setFormDesc] = React.useState('');
    const [formStatus, setFormStatus] = React.useState('Active');

    // Sync records on slug change
    React.useEffect(() => {
        setRecords(config.initialRecords);
        setSelectedTab('all');
    }, [slug, config.initialRecords]);

    // Segmented tab counts
    const allCount = records.length;
    const activeCount = records.filter((r) => r.status === 'Active').length;
    const inactiveCount = records.filter((r) => r.status === 'Inactive').length;
    const totalMetric = records.reduce((sum, r) => sum + (Number(r.members) || 0), 0);

    const tabs = [
        { label: 'All', value: 'all', count: allCount },
        { label: 'Active', value: 'active', count: activeCount },
        { label: 'Inactive', value: 'inactive', count: inactiveCount },
        { label: 'Archived', value: 'archived', count: 0 },
    ];

    // Filtered by Segmented Tab
    const tabFilteredRecords = React.useMemo(() => {
        if (selectedTab === 'active') return records.filter((r) => r.status === 'Active');
        if (selectedTab === 'inactive') return records.filter((r) => r.status === 'Inactive');
        if (selectedTab === 'archived') return [];
        return records;
    }, [records, selectedTab]);

    // Open Drawer for Create
    const handleOpenCreate = () => {
        setEditingRecord(null);
        setFormName('');
        setFormCode('');
        setFormHead('');
        setFormMembers(0);
        setFormDesc('');
        setFormStatus('Active');
        setDrawerOpen(true);
    };

    // Open Drawer for Edit
    const handleOpenEdit = React.useCallback((record) => {
        setEditingRecord(record);
        setFormName(record.name);
        setFormCode(record.code);
        setFormHead(record.head);
        setFormMembers(record.members || 0);
        setFormDesc(record.description || '');
        setFormStatus(record.status || 'Active');
        setDrawerOpen(true);
    }, []);

    // Open View Details Drawer
    const handleOpenView = React.useCallback((record) => {
        setViewingRecord(record);
        setViewDrawerOpen(true);
    }, []);

    // Open Delete Confirm
    const handleOpenDelete = React.useCallback((record) => {
        setRecordToDelete(record);
        setConfirmDeleteOpen(true);
    }, []);

    // Confirm Delete
    const handleConfirmDelete = () => {
        if (!recordToDelete) return;
        setRecords((prev) => prev.filter((r) => r.id !== recordToDelete.id));
        toast.success(`${config.singular} Deleted`, {
            description: `"${recordToDelete.name}" has been removed from the system.`,
        });
        setConfirmDeleteOpen(false);
        setRecordToDelete(null);
    };

    // Save Form (Create or Edit)
    const handleSaveForm = (e) => {
        e.preventDefault();
        if (!formName.trim()) {
            toast.error('Validation error', { description: 'Please provide a valid name.' });
            return;
        }

        if (editingRecord) {
            setRecords((prev) =>
                prev.map((r) =>
                    r.id === editingRecord.id
                        ? {
                              ...r,
                              name: formName.trim(),
                              code: formCode.trim() || r.code,
                              head: formHead.trim() || r.head,
                              members: Number(formMembers) || 0,
                              description: formDesc.trim(),
                              status: formStatus,
                          }
                        : r
                )
            );
            toast.success(`${config.singular} Updated`, {
                description: `"${formName.trim()}" has been updated successfully.`,
            });
        } else {
            const prefix = config.singular.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'SEC');
            const newRecord = {
                id: `${prefix}-${String(records.length + 1).padStart(2, '0')}`,
                name: formName.trim(),
                code: formCode.trim() || `${prefix}-${String(records.length + 1).padStart(2, '0')}`,
                head: formHead.trim() || 'Unassigned',
                members: Number(formMembers) || 0,
                status: formStatus,
                createdOn: 'Today',
                description: formDesc.trim() || `Newly registered ${config.singular.toLowerCase()}.`,
            };
            setRecords((prev) => [newRecord, ...prev]);
            toast.success(`${config.singular} Created`, {
                description: `"${formName.trim()}" has been added to ${config.title}.`,
            });
        }
        setDrawerOpen(false);
    };

    const handleExport = () => {
        toast.info('Export Started', {
            description: `Exporting ${records.length} ${config.title.toLowerCase()} records to CSV format.`,
        });
    };

    // TanStack Table Column Definitions
    const columns = React.useMemo(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all rows"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label={`Select row ${row.id}`}
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: 'name',
                header: ({ column }) => <DataTableColumnHeader column={column} title={`${config.singular} Name`} />,
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-brand/10 text-brand-dark flex items-center justify-center font-bold text-xs shrink-0 border border-brand/20">
                            <FontAwesomeIcon icon={config.icon} className="size-4 text-brand" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-900 leading-tight truncate">
                                {row.original.name}
                            </span>
                            <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {row.original.description || row.original.head}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: 'code',
                header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
                cell: ({ row }) => (
                    <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-slate-50 text-slate-700 border-slate-200">
                        {row.original.code}
                    </Badge>
                ),
            },
            {
                accessorKey: 'head',
                header: ({ column }) => <DataTableColumnHeader column={column} title={config.headLabel || 'Lead / Assigned'} />,
                cell: ({ row }) => {
                    const initials = (row.original.head || 'NA')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2);
                    return (
                        <div className="flex items-center gap-2">
                            <div className="size-6.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center border border-emerald-200 shrink-0">
                                {initials}
                            </div>
                            <span className="text-xs font-medium text-slate-700 truncate">{row.original.head}</span>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'members',
                header: ({ column }) => <DataTableColumnHeader column={column} title={config.metricLabel || 'Volume / Count'} />,
                cell: ({ row }) => (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                        {row.original.members}
                    </div>
                ),
            },
            {
                accessorKey: 'status',
                header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
                cell: ({ row }) => {
                    const status = row.original.status || 'Active';
                    const isActive = status === 'Active';
                    return (
                        <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                                isActive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                        >
                            <span
                                className={`size-1.5 rounded-full ${
                                    isActive ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                            />
                            {status}
                        </div>
                    );
                },
                filterFn: (row, id, value) => {
                    return value.includes(row.getValue(id));
                },
            },
            {
                id: 'actions',
                cell: ({ row }) => (
                    <DataTableRowActions
                        row={row}
                        onView={handleOpenView}
                        onEdit={handleOpenEdit}
                        onDelete={handleOpenDelete}
                    />
                ),
            },
        ],
        [config.singular, config.icon, config.headLabel, config.metricLabel, handleOpenView, handleOpenEdit, handleOpenDelete]
    );

    // Dynamic KPI Cards
    const kpis = [
        {
            title: `Total ${config.title}`,
            value: allCount,
            change: '+12%',
            trend: 'up',
            subtitle: 'vs previous quarter',
            icon: config.icon,
        },
        {
            title: `Active ${config.title}`,
            value: activeCount,
            change: '+8%',
            trend: 'up',
            subtitle: 'Operational and running',
            icon: faCheck,
        },
        {
            title: 'Inactive / Pending',
            value: inactiveCount,
            change: '0%',
            trend: 'neutral',
            subtitle: 'Requires review',
            icon: config.icon,
        },
        {
            title: `Total ${config.metricLabel || 'Staff Volume'}`,
            value: totalMetric,
            change: '+15%',
            trend: 'up',
            subtitle: 'Across all active entities',
            icon: config.icon,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Standardized Reusable PageHeader (NO BREADCRUMBS) */}
            <PageHeader
                category={config.category}
                title={config.title}
                description={config.description}
                icon={config.icon}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            className="h-9 px-3.5 text-xs font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs gap-2"
                        >
                            <FontAwesomeIcon icon={faDownload} className="size-3.5 text-slate-500" />
                            <span>Export CSV</span>
                        </Button>
                        <Button
                            onClick={handleOpenCreate}
                            className="h-9 px-4 text-xs font-bold bg-brand hover:bg-brand-dark text-primary-foreground shadow-sm gap-2"
                        >
                            <FontAwesomeIcon icon={faPlus} className="size-3.5" />
                            <span>Add {config.singular}</span>
                        </Button>
                    </div>
                }
            />

            {/* KPI Summary Cards */}
            <KpiGrid items={kpis} />

            {/* Segmented Status Filter Tabs */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
                <SegmentedTabs
                    tabs={tabs}
                    value={selectedTab}
                    onChange={setSelectedTab}
                />
            </div>

            {/* Standardized TanStack React Table */}
            <DataTable
                columns={columns}
                data={tabFilteredRecords}
                searchKey="name"
                searchPlaceholder={`Search ${config.title.toLowerCase()} by name, code or lead...`}
                filterColumn="status"
                filterTitle="Status"
                filterOptions={[
                    { label: 'Active', value: 'Active' },
                    { label: 'Inactive', value: 'Inactive' },
                ]}
            />

            {/* Right-Side Add / Edit FormDrawer */}
            <FormDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                size="simple"
                title={editingRecord ? `Edit ${config.singular}` : `Create New ${config.singular}`}
                description={
                    editingRecord
                        ? `Update details and organizational scope for ${editingRecord.name}.`
                        : `Fill out the required information to register a new ${config.singular.toLowerCase()}.`
                }
                submitLabel={editingRecord ? 'Save Changes' : `Create ${config.singular}`}
                onSubmit={handleSaveForm}
            >
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="sec-name" className="text-xs font-semibold text-slate-700">
                            {config.singular} Name <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="sec-name"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder={`e.g. Enterprise ${config.singular}`}
                            className="h-9 text-xs"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="sec-code" className="text-xs font-semibold text-slate-700">
                            {config.singular} Code / Ref
                        </Label>
                        <Input
                            id="sec-code"
                            value={formCode}
                            onChange={(e) => setFormCode(e.target.value)}
                            placeholder="e.g. CODE-01"
                            className="h-9 text-xs font-mono uppercase"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="sec-head" className="text-xs font-semibold text-slate-700">
                            {config.headLabel || 'Lead / Assigned'}
                        </Label>
                        <Input
                            id="sec-head"
                            value={formHead}
                            onChange={(e) => setFormHead(e.target.value)}
                            placeholder="e.g. Marcus Brody"
                            className="h-9 text-xs"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="sec-members" className="text-xs font-semibold text-slate-700">
                            {config.metricLabel || 'Volume / Count'}
                        </Label>
                        <Input
                            id="sec-members"
                            type="number"
                            value={formMembers}
                            onChange={(e) => setFormMembers(Number(e.target.value) || 0)}
                            placeholder="0"
                            className="h-9 text-xs"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="sec-status" className="text-xs font-semibold text-slate-700">
                            Status
                        </Label>
                        <Select value={formStatus} onValueChange={setFormStatus}>
                            <SelectTrigger id="sec-status" className="h-9 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="sec-desc" className="text-xs font-semibold text-slate-700">
                            Description & Operational Scope
                        </Label>
                        <Textarea
                            id="sec-desc"
                            value={formDesc}
                            onChange={(e) => setFormDesc(e.target.value)}
                            placeholder={`Briefly describe the responsibilities and scope of this ${config.singular.toLowerCase()}...`}
                            rows={3}
                            className="text-xs resize-none"
                        />
                    </div>
                </div>
            </FormDrawer>

            {/* Right-Side View Details Drawer */}
            <FormDrawer
                open={viewDrawerOpen}
                onOpenChange={setViewDrawerOpen}
                size="simple"
                title={viewingRecord?.name || `${config.singular} Details`}
                description={`Reference ID: ${viewingRecord?.id || ''}`}
                showFooter={false}
            >
                {viewingRecord && (
                    <div className="space-y-5">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-medium">Status</span>
                                <Badge
                                    variant="outline"
                                    className={`text-[10px] font-semibold py-0.5 px-2 rounded-full border ${
                                        viewingRecord.status === 'Active'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}
                                >
                                    {viewingRecord.status}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-medium">Code Identifier</span>
                                <span className="font-mono text-xs font-semibold text-slate-800">{viewingRecord.code}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-medium">{config.headLabel || 'Lead / Assigned'}</span>
                                <span className="text-xs font-semibold text-slate-800">{viewingRecord.head}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-medium">{config.metricLabel || 'Volume / Units'}</span>
                                <span className="text-xs font-bold text-brand-dark bg-brand-light px-2 py-0.5 rounded-md">
                                    {viewingRecord.members}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-medium">Registered Date</span>
                                <span className="text-xs text-slate-600">{viewingRecord.createdOn}</span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Operational Description</h4>
                            <p className="text-xs text-slate-600 leading-relaxed p-3 rounded-lg bg-white border border-slate-200">
                                {viewingRecord.description || 'No additional scope details provided.'}
                            </p>
                        </div>

                        <div className="pt-2 flex gap-2">
                            <Button
                                onClick={() => {
                                    setViewDrawerOpen(false);
                                    handleOpenEdit(viewingRecord);
                                }}
                                className="flex-1 bg-brand hover:bg-brand-dark text-primary-foreground font-semibold text-xs h-9"
                            >
                                Edit {config.singular}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setViewDrawerOpen(false)}
                                className="flex-1 text-xs h-9"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </FormDrawer>

            {/* Confirm Delete Alert Dialog */}
            <ConfirmDialog
                open={confirmDeleteOpen}
                onOpenChange={setConfirmDeleteOpen}
                title={`Delete ${config.singular}?`}
                description={`Are you sure you want to delete "${recordToDelete?.name}"? Associated operational links will need to be reallocated.`}
                confirmLabel="Yes, Delete"
                cancelLabel="Cancel"
                variant="destructive"
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}
