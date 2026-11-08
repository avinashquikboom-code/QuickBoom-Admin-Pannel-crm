'use client';
import { EmployeePerformanceChart } from '@/modules/hrm/components/EmployeePerformanceChart';
import { PayrollAnalyticsChart } from '@/modules/hrm/components/PayrollAnalyticsChart';
import { formatCurrency } from "@/lib/currency";

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { AttendanceChart } from '@/components/dashboard/AttendanceChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { mockKpiData } from '@/lib/mock-data';
import { faClock, faIndianRupeeSign, faTriangleExclamation, faUserPlus, faUsers, faWallet } from '@fortawesome/free-solid-svg-icons';
import { faCalendarCheck, faCalendarXmark } from '@fortawesome/free-regular-svg-icons';
export default function HrmDashboardPage() {
    return (<div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader title="HRM Operations Dashboard" description="Comprehensive people operations, real-time attendance tracking, pending approvals, and payroll processing." badge={<Badge className="bg-brand-light text-brand-dark border-brand-light text-xs font-semibold px-2 py-0.5">
            Human Resources Portal
          </Badge>} actions={<div className="flex items-center gap-2">
            <Link href="/admin/hrm/attendance">
              <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:text-brand-dark text-xs h-9">
                <FontAwesomeIcon icon={faCalendarCheck} className="size-4 mr-1.5 text-brand"/>
                Live Attendance
              </Button>
            </Link>
            <Link href="/admin/hrm/employees">
              <Button size="sm" className="bg-brand hover:bg-primary-hover text-primary-foreground text-xs h-9 font-medium">
                <FontAwesomeIcon icon={faUserPlus} className="size-4 mr-1.5"/>
                Add Employee
              </Button>
            </Link>
          </div>}/>

      {/* 8 Primary HRM KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Workforce" value={mockKpiData.totalEmployees} change={mockKpiData.totalEmployeesChange} changeType="positive" icon={faUsers} iconColor="text-brand" iconBg="bg-brand-light"/>
        <StatCard title="Present Today" value={mockKpiData.presentToday} change={`${mockKpiData.presentPercentage}% attendance rate`} changeType="positive" icon={faCalendarCheck} iconColor="text-brand" iconBg="bg-brand-light"/>
        <StatCard title="Late Arrivals" value={mockKpiData.lateToday} change="Flagged for manager review" changeType="neutral" icon={faTriangleExclamation} iconColor="text-amber-600" iconBg="bg-amber-50"/>
        <StatCard title="On Approved Leave" value={mockKpiData.onLeaveToday} change="Scheduled vacation & medical" changeType="neutral" icon={faCalendarXmark} iconColor="text-brand-dark" iconBg="bg-brand-light"/>
        <StatCard title="Pending Overtime" value={mockKpiData.pendingOvertime} change="3 requests awaiting signoff" changeType="neutral" icon={faClock} iconColor="text-amber-600" iconBg="bg-amber-50" badge="Action Required"/>
        <StatCard title="Expense Claims" value={`${formatCurrency(mockKpiData.pendingExpensesAmount)}`} change={`${mockKpiData.pendingExpenses} pending review`} changeType="neutral" icon={faIndianRupeeSign} iconColor="text-brand" iconBg="bg-brand-light"/>
        <StatCard title="Unexcused Absentees" value={mockKpiData.absentToday} change="Requires HR outreach" changeType="negative" icon={faTriangleExclamation} iconColor="text-rose-600" iconBg="bg-rose-50"/>
        <StatCard title="Monthly Payroll" value={formatCurrency(mockKpiData.monthlyPayroll)} change={mockKpiData.monthlyPayrollChange} changeType="positive" icon={faWallet} iconColor="text-brand-dark" iconBg="bg-brand-light"/>
      </div>

      {/* Main HRM Analytics & Operations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart />
        <RecentActivity />
      </div>
<div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2"><EmployeePerformanceChart /><PayrollAnalyticsChart /></div>    </div>);
}
