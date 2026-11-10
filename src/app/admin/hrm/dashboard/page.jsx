'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faClock, faRotate, faUsers } from '@fortawesome/free-solid-svg-icons';
import { faCalendarCheck, faCalendarXmark } from '@fortawesome/free-regular-svg-icons';
import { hrmError, loadClaims, loadLeaves, loadLiveDashboard, loadReportSummary } from '@/modules/hrm/hrm-api';
import { HrmNotice } from '@/modules/hrm/HrmNotice';

export default function HrmDashboardPage() {
  const [summary, setSummary] = React.useState(null);
  const [reports, setReports] = React.useState(null);
  const [pendingLeaves, setPendingLeaves] = React.useState(0);
  const [pendingClaims, setPendingClaims] = React.useState(0);
  const [departments, setDepartments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.allSettled([loadLiveDashboard(), loadReportSummary(), loadLeaves(), loadClaims()]).then((results) => {
      if (!active) return;
      const [live, report, leaves, claims] = results;
      if (live.status === 'fulfilled') {
        setSummary(live.value.summary);
        const counts = {};
        live.value.records.forEach((row) => { counts[row.department] = (counts[row.department] || 0) + 1; });
        setDepartments(Object.entries(counts).map(([name, count]) => ({ name, count })));
      }
      if (report.status === 'fulfilled') setReports(report.value);
      if (leaves.status === 'fulfilled') setPendingLeaves(leaves.value.filter((row) => row.status === 'pending').length);
      if (claims.status === 'fulfilled') setPendingClaims(claims.value.filter((row) => row.status === 'pending').length);
      const failed = results.filter((result) => result.status === 'rejected');
      if (failed.length === results.length) setError(hrmError(failed[0].reason));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  const value = (number) => (loading ? '—' : number ?? 0);
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="HRM Operations Dashboard"
        description="People, attendance, leave, claims, and payroll figures returned by the HRM APIs."
        badge={<Badge className="border-brand-light bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand-dark">Human Resources</Badge>}
        actions={<Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => setRefresh((item) => item + 1)}><FontAwesomeIcon icon={faRotate} className="mr-1.5 size-3.5" />Refresh</Button>}
      />
      <HrmNotice loading={false} error={error} onRetry={() => setRefresh((item) => item + 1)} />
      <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Workforce" value={value(summary?.totalEmployees ?? reports?.workforce?.total)} icon={faUsers} iconColor="text-brand" iconBg="bg-brand-light" />
        <StatCard title="Present Today" value={value(summary?.present)} icon={faCalendarCheck} iconColor="text-brand" iconBg="bg-brand-light" />
        <StatCard title="Absent Today" value={value(summary?.absent)} icon={faCalendarXmark} iconColor="text-rose-600" iconBg="bg-rose-50" />
        <StatCard title="Late Today" value={value(summary?.late)} icon={faClock} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="On Break" value={value(summary?.onBreak)} icon={faClock} iconColor="text-brand-dark" iconBg="bg-brand-light" />
        <StatCard title="Pending Leave" value={value(pendingLeaves)} icon={faCalendarXmark} iconColor="text-brand-dark" iconBg="bg-brand-light" />
        <StatCard title="Pending Claims" value={value(pendingClaims)} icon={faUsers} iconColor="text-brand" iconBg="bg-brand-light" />
        <StatCard title="Payroll Net" value={loading ? '—' : Number(reports?.payroll?.netDisbursed || 0).toLocaleString('en-IN')} icon={faUsers} iconColor="text-brand-dark" iconBg="bg-brand-light" />
      </div>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Department distribution</h2>
          <Link href="/admin/hrm/attendance" className="text-xs font-semibold text-brand-dark">Open attendance</Link>
        </div>
        {departments.length === 0 ? <p className="text-sm text-slate-500">No live department counts were returned.</p> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((department) => (
              <div key={department.name} className="rounded-lg border border-slate-100 px-3 py-2">
                <p className="text-sm font-medium text-slate-800">{department.name}</p>
                <p className="text-xs text-slate-500">{department.count} employees in today’s attendance</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
