'use client';
import { formatCurrency } from "@/lib/currency";

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { AttendanceChart } from '@/components/dashboard/AttendanceChart';
import { mockEmployees, mockKpiData } from '@/lib/mock-data';
import { toast } from '@/hooks/use-toast';
import { faChartLine, faDownload } from '@fortawesome/free-solid-svg-icons';
export default function HrmReportsPage() {
    const departmentCounts = React.useMemo(() => {
        const counts = {};
        mockEmployees.forEach((e) => {
            counts[e.department] = (counts[e.department] || 0) + 1;
        });
        return Object.entries(counts).map(([dept, count]) => ({
            dept,
            count,
            pct: Math.round((count / mockEmployees.length) * 100),
        }));
    }, []);
    const handleExport = (reportType) => {
        toast.success(`Exporting ${reportType}`, {
            description: 'Your report download will begin in a moment.',
        });
    };
    return (<div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader title="HRM Reports & People Analytics" description="Comprehensive workplace metrics, department headcounts, overtime cost exposure, and attendance ratios." actions={<div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('Payroll & Tax Audit')} className="border-slate-200 text-slate-700 text-xs h-9">
              <FontAwesomeIcon icon={faDownload} className="size-3.5 mr-1"/>
              Tax Audit File
            </Button>
            <Button size="sm" onClick={() => handleExport('Complete HRM Quarterly Report')} className="bg-brand hover:bg-primary-hover text-primary-foreground font-medium text-xs h-9">
              <FontAwesomeIcon icon={faDownload} className="size-3.5 mr-1"/>
              Export Full Report (PDF)
            </Button>
          </div>}/>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">
            Workforce Retention
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1">96.8%</p>
          <span className="text-[11px] text-brand font-medium">
            +2.4% vs industry median
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">
            Avg. Attendance Rate
          </span>
          <p className="text-2xl font-bold text-brand-dark mt-1">
            {mockKpiData.presentPercentage}%
          </p>
          <span className="text-[11px] text-brand-dark font-medium">
            Past 30 operational days
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">
            Total OT Expenditure
          </span>
          <p className="text-2xl font-bold text-amber-700 mt-1">{formatCurrency(1858)}</p>
          <span className="text-[11px] text-slate-500 font-medium">
            Across 18.5 approved hours
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">
            Monthly Payroll Cost
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(mockKpiData.monthlyPayroll)}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">
            March 2026 disbursement
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart />

        {/* Department Distribution */}
        <Card className="border border-slate-200/90 bg-white shadow-xs">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faChartLine} className="size-5 text-brand"/>
              <CardTitle className="text-base font-bold text-slate-900">
                Departmental Workforce Distribution
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Headcount ratio across core functional teams
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3.5">
            {departmentCounts.map((item) => (<div key={item.dept} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    {item.dept}
                  </span>
                  <span className="font-bold text-slate-900">
                    {item.count} Employees ({item.pct}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${item.pct * 2.5}%` }}/>
                </div>
              </div>))}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Total Active Divisions: 7</span>
              <span className="font-semibold text-brand-dark">All positions staffed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Downloads Table */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold text-slate-900">
            Standard Compliance & Audit Reports
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            One-click exports for accounting, state labor compliance, and executive reviews
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">
                  Annual W-2 & Pre-Tax Payroll Reconciliation
                </p>
                <p className="text-slate-400">Detailed tax withholding matrix per employee</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleExport('W-2 Reconciliation')} className="h-7.5 border-slate-200 text-xs text-slate-700">
                <FontAwesomeIcon icon={faDownload} className="size-3 mr-1"/>
                CSV
              </Button>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">
                  Overtime & Fair Labor Standards Act (FLSA) Audit
                </p>
                <p className="text-slate-400">Recorded hours, multipliers and justification notes</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleExport('FLSA Audit')} className="h-7.5 border-slate-200 text-xs text-slate-700">
                <FontAwesomeIcon icon={faDownload} className="size-3 mr-1"/>
                CSV
              </Button>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">
                  Employee Attendance & Punctuality Timesheets
                </p>
                <p className="text-slate-400">Complete raw punch timestamps and break intervals</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleExport('Timesheet Audit')} className="h-7.5 border-slate-200 text-xs text-slate-700">
                <FontAwesomeIcon icon={faDownload} className="size-3 mr-1"/>
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>);
}
