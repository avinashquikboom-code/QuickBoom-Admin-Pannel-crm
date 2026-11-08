'use client';

import * as React from 'react';
import { ProductionOverviewChart } from '@/modules/production/components/ProductionOverviewChart';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { KpiGrid } from '@/components/common/KpiCard';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
    faIndustry,
    faCheck,
    faClock,
    faBoxesStacked,
    faPlus,
    faDownload,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';

const initialProductionBatches = [
    { id: 'BAT-101', name: 'Assembly Line Alpha Run #420', line: 'Plant Line 1', targetUnits: 15000, completedUnits: 14850, yieldRate: '99.0%', status: 'Active', updatedOn: 'Today' },
    { id: 'BAT-102', name: 'Precision CNC Machining Batch #9', line: 'CNC Bay 3', targetUnits: 6500, completedUnits: 6500, yieldRate: '100%', status: 'Completed', updatedOn: 'Yesterday' },
    { id: 'BAT-103', name: 'Packaging Automation Line Beta', line: 'Packing Unit 2', targetUnits: 25000, completedUnits: 18200, yieldRate: '98.5%', status: 'Active', updatedOn: 'Today' },
    { id: 'BAT-104', name: 'Industrial Servo Drive Fabrication', line: 'Sub-Assembly 4', targetUnits: 4200, completedUnits: 2100, yieldRate: '97.8%', status: 'In Progress', updatedOn: 'Today' },
    { id: 'BAT-105', name: 'Optical Micro-Sensor Assembly Run', line: 'Cleanroom Lab A', targetUnits: 8000, completedUnits: 7920, yieldRate: '99.2%', status: 'Active', updatedOn: 'Today' },
];

export default function ProductionDashboardPage() {
    const [batches] = React.useState(initialProductionBatches);

    const kpis = [
        {
            title: 'Active Production Lines',
            value: 4,
            change: '+1 line',
            trend: 'up',
            subtitle: 'Operational at 98.4% capacity',
            icon: faIndustry,
        },
        {
            title: 'Units Produced Today',
            value: '49,570',
            change: '+12.4%',
            trend: 'up',
            subtitle: 'Across all 5 assembly bays',
            icon: faCheck,
        },
        {
            title: 'Average Yield Rate',
            value: '98.9%',
            change: '+0.5%',
            trend: 'up',
            subtitle: 'Quality pass standard met',
            icon: faBoxesStacked,
        },
        {
            title: 'Pending Batch Runs',
            value: 3,
            change: '-2 queued',
            trend: 'neutral',
            subtitle: 'Scheduled for next shift',
            icon: faClock,
        },
    ];

    const columns = [
        {
            header: 'Batch Order',
            accessorKey: 'name',
            cell: (item) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{item?.name}</span>
                    <span className="text-xs text-slate-400 font-mono">{item?.id} • {item?.line}</span>
                </div>
            ),
        },
        {
            header: 'Target Units',
            accessorKey: 'targetUnits',
            cell: (item) => (
                <span className="font-mono text-xs font-semibold text-slate-700">
                    {item?.targetUnits?.toLocaleString()}
                </span>
            ),
        },
        {
            header: 'Completed Units',
            accessorKey: 'completedUnits',
            cell: (item) => (
                <span className="font-mono text-xs font-bold text-brand-dark">
                    {item?.completedUnits?.toLocaleString()}
                </span>
            ),
        },
        {
            header: 'Yield Rate',
            accessorKey: 'yieldRate',
            cell: (item) => (
                <Badge variant="outline" className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
                    {item?.yieldRate}
                </Badge>
            ),
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (item) => {
                const status = item?.status;
                const isActive = status === 'Active' || status === 'Completed';
                return (
                    <Badge
                        variant="outline"
                        className={`text-[11px] font-bold ${
                            isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                    >
                        {status}
                    </Badge>
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                category="OPERATIONS & MANUFACTURING"
                title="Production Overview"
                description="Live factory telemetry, batch yields, operational line velocity, and quality control metrics."
                icon={faIndustry}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => toast.info('Exporting batch records')}
                            className="h-9 px-3.5 text-xs font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 gap-2"
                        >
                            <FontAwesomeIcon icon={faDownload} className="size-3.5 text-slate-500" />
                            <span>Export Data</span>
                        </Button>
                        <Button
                            onClick={() => toast.success('New batch creation modal ready')}
                            className="h-9 px-4 text-xs font-bold bg-brand hover:bg-brand-dark text-primary-foreground gap-2"
                        >
                            <FontAwesomeIcon icon={faPlus} className="size-3.5" />
                            <span>Schedule Batch</span>
                        </Button>
                    </div>
                }
            />

            {/* KPI Summary Cards */}
            <KpiGrid items={kpis} />

            {/* Production Analytics Chart */}
            <div className="grid min-w-0 grid-cols-1 gap-6">
                <ProductionOverviewChart />
            </div>

            {/* Active Batches Table */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Live Production Batches</h3>
                        <p className="text-xs text-slate-500">Real-time telemetry and completion status across active production lines.</p>
                    </div>
                </div>
                <DataTable
                    columns={columns}
                    data={batches}
                    emptyState="No production runs currently active."
                />
            </div>
        </div>
    );
}
