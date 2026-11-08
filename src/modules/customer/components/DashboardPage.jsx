'use client';

import * as React from 'react';
import { CustomerGrowthChart } from '@/modules/customer/components/CustomerGrowthChart';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { KpiGrid } from '@/components/common/KpiCard';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
    faUserGroup,
    faChartLine,
    faShieldHalved,
    faFileInvoiceDollar,
    faPlus,
    faDownload,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';

const initialCustomerAccounts = [
    { id: 'CUST-001', name: 'Tata Consultancy Services', tier: 'Enterprise Platinum', mrr: '₹4,50,000', seats: 450, renewalDate: '15 Jan 2027', status: 'Active' },
    { id: 'CUST-002', name: 'Infosys Global Technologies', tier: 'Enterprise Platinum', mrr: '₹3,80,000', seats: 380, renewalDate: '01 Mar 2027', status: 'Active' },
    { id: 'CUST-003', name: 'Wipro Digital Solutions', tier: 'Professional Tier', mrr: '₹1,50,000', seats: 150, renewalDate: '12 Apr 2026', status: 'Active' },
    { id: 'CUST-004', name: 'Swiggy Logistics Network', tier: 'Enterprise Growth', mrr: '₹2,20,000', seats: 220, renewalDate: '28 Jun 2026', status: 'Active' },
    { id: 'CUST-005', name: 'Zomato Operations Hub', tier: 'Enterprise Growth', mrr: '₹1,90,000', seats: 190, renewalDate: '10 Aug 2026', status: 'Active' },
];

export default function CustomerDashboardPage() {
    const [customers] = React.useState(initialCustomerAccounts);

    const kpis = [
        {
            title: 'Total Active Customers',
            value: 124,
            change: '+8 this quarter',
            trend: 'up',
            subtitle: 'Enterprise & growth accounts',
            icon: faUserGroup,
        },
        {
            title: 'Monthly Recurring (MRR)',
            value: '₹38.4L',
            change: '+14.2%',
            trend: 'up',
            subtitle: 'Annualized ARR run-rate',
            icon: faFileInvoiceDollar,
        },
        {
            title: 'Net Retention Rate',
            value: '118%',
            change: '+3.5%',
            trend: 'up',
            subtitle: 'Strong account expansion',
            icon: faChartLine,
        },
        {
            title: 'Subscription Health',
            value: '99.4%',
            change: '+0.2%',
            trend: 'up',
            subtitle: 'Active licenses renewed',
            icon: faShieldHalved,
        },
    ];

    const columns = [
        {
            header: 'Customer Account',
            accessorKey: 'name',
            cell: (item) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{item?.name}</span>
                    <span className="text-xs text-slate-400 font-mono">{item?.id} • {item?.tier}</span>
                </div>
            ),
        },
        {
            header: 'MRR Value',
            accessorKey: 'mrr',
            cell: (item) => (
                <span className="font-mono text-xs font-bold text-brand-dark">
                    {item?.mrr}
                </span>
            ),
        },
        {
            header: 'Licensed Seats',
            accessorKey: 'seats',
            cell: (item) => (
                <span className="font-mono text-xs font-semibold text-slate-700">
                    {item?.seats} seats
                </span>
            ),
        },
        {
            header: 'Renewal Date',
            accessorKey: 'renewalDate',
            cell: (item) => (
                <span className="text-xs text-slate-600">
                    {item?.renewalDate}
                </span>
            ),
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (item) => (
                <Badge variant="outline" className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                    {item?.status}
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                category="CUSTOMER MANAGEMENT"
                title="Customer Growth & Accounts"
                description="Monitor customer accounts, recurring revenue, licensed seat utilization, and renewals."
                icon={faUserGroup}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => toast.info('Exporting customer accounts data')}
                            className="h-9 px-3.5 text-xs font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 gap-2"
                        >
                            <FontAwesomeIcon icon={faDownload} className="size-3.5 text-slate-500" />
                            <span>Export CSV</span>
                        </Button>
                        <Button
                            onClick={() => toast.success('New customer onboarding modal ready')}
                            className="h-9 px-4 text-xs font-bold bg-brand hover:bg-brand-dark text-primary-foreground gap-2"
                        >
                            <FontAwesomeIcon icon={faPlus} className="size-3.5" />
                            <span>Add Customer</span>
                        </Button>
                    </div>
                }
            />

            {/* KPI Summary Cards */}
            <KpiGrid items={kpis} />

            {/* Customer Growth Chart */}
            <div className="grid min-w-0 grid-cols-1 gap-6">
                <CustomerGrowthChart />
            </div>

            {/* Active Customer Accounts Table */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Key Enterprise Accounts</h3>
                        <p className="text-xs text-slate-500">Overview of top enterprise client subscriptions, MRR contribution, and renewals.</p>
                    </div>
                </div>
                <DataTable
                    columns={columns}
                    data={customers}
                    emptyState="No customer accounts found."
                />
            </div>
        </div>
    );
}
