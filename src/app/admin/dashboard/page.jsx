'use client';
import { formatCurrency } from "@/lib/currency";


import { BusinessAnalyticsGrid } from '@/components/dashboard/BusinessAnalyticsGrid';
import * as React from 'react';
import {
    faBullseye,
    faBuilding,
    faIndianRupeeSign,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { StatCard } from '@/components/common/StatCard';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { AttendanceOverview } from '@/components/dashboard/AttendanceOverview';
import { LeadsOverviewChart } from '@/components/dashboard/LeadsOverviewChart';
import { LeadPipeline } from '@/components/dashboard/LeadPipeline';
import { TaskSummaryCards } from '@/components/dashboard/TaskSummaryCards';
import { RecentLeadsTable } from '@/components/dashboard/RecentLeadsTable';
import { TopPerformers } from '@/components/dashboard/TopPerformers';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { mockDashboardKpi } from '@/lib/mock-data';

export default function AdminDashboardPage() {
    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <WelcomeBanner />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Employees"
                    value={mockDashboardKpi.totalEmployees}
                    change={mockDashboardKpi.totalEmployeesChange}
                    changeType="positive"
                    icon={faUsers}
                    iconColor="text-brand"
                    iconBg="bg-brand-light"
                    description="vs last month"
                />
                <StatCard
                    title="Active Leads"
                    value={mockDashboardKpi.activeLeads}
                    change={mockDashboardKpi.activeLeadsChange}
                    changeType="positive"
                    icon={faBullseye}
                    iconColor="text-brand"
                    iconBg="bg-brand-light"
                    description="vs last month"
                />
                <StatCard
                    title="Total Customers"
                    value={mockDashboardKpi.totalCustomers}
                    change={mockDashboardKpi.totalCustomersChange}
                    changeType="positive"
                    icon={faBuilding}
                    iconColor="text-brand"
                    iconBg="bg-brand-light"
                    description="vs last month"
                />
                <StatCard
                    title="This Month Sales"
                    value={`${formatCurrency(mockDashboardKpi.monthSales)}`}
                    change={mockDashboardKpi.monthSalesChange}
                    changeType="positive"
                    icon={faIndianRupeeSign}
                    iconColor="text-brand"
                    iconBg="bg-brand-light"
                    description="vs last month"
                />
            </div>

            {/* Analytics: Attendance + Leads */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <AttendanceOverview />
                <LeadsOverviewChart />
            </div>

            {/* Pipeline + Tasks */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <LeadPipeline />
                <TaskSummaryCards />
            </div>

            <BusinessAnalyticsGrid />
            <RecentLeadsTable />

            {/* Performance + Activity */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <TopPerformers />
                <ActivityTimeline />
            </div>

            <QuickActions />

            <RecentActivity />
        </div>
    );
}
