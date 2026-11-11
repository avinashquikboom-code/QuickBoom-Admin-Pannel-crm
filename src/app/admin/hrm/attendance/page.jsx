'use client';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { AttendanceFilters } from '@/modules/hrm/components/attendance/AttendanceFilters';
import { AttendanceTable } from '@/modules/hrm/components/attendance/AttendanceTable';
import { Button } from '@/components/common/Button';
import { toast } from '@/hooks/use-toast';
import { faCircleXmark, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { faCalendarCheck, faCalendarXmark } from '@fortawesome/free-regular-svg-icons';
import { hrmError, loadLiveDashboard, loadOvertime } from '@/modules/hrm/hrm-api';
import { HrmNotice } from '@/modules/hrm/HrmNotice';
export default function AttendancePage() {
    const [records, setRecords] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [refresh, setRefresh] = React.useState(0);
    const [overtime, setOvertime] = React.useState([]);
    const [otType, setOtType] = React.useState('');
    const [otStatus, setOtStatus] = React.useState('');
    React.useEffect(() => {
        let active = true;
        setLoading(true);
        loadLiveDashboard().then((result) => { if (active) setRecords(result.records); }).catch((err) => { if (active) setError(hrmError(err)); }).finally(() => { if (active) setLoading(false); });
        loadOvertime({ limit: 20, overtimeType: otType || undefined, status: otStatus || undefined }).then((result) => { if (active) setOvertime(result.rows || []); }).catch(() => { if (active) setOvertime([]); });
        return () => { active = false; };
    }, [refresh, otType, otStatus]);
    const [search, setSearch] = React.useState('');
    const [selectedDept, setSelectedDept] = React.useState('All Departments');
    const [selectedStatus, setSelectedStatus] = React.useState('all');
    const filtered = React.useMemo(() => {
        return records.filter((rec) => {
            const matchSearch = rec.employeeName.toLowerCase().includes(search.toLowerCase()) ||
                rec.employeeId.toLowerCase().includes(search.toLowerCase());
            const matchDept = selectedDept === 'All Departments' || rec.department === selectedDept;
            const matchStatus = selectedStatus === 'all' || rec.status === selectedStatus;
            return matchSearch && matchDept && matchStatus;
        });
    }, [records, search, selectedDept, selectedStatus]);
    const handleExport = () => {
        toast.success('Attendance Report Exported', {
            description: `Exported ${filtered.length} records to CSV.`,
        });
    };
    const presentCount = records.filter((r) => r.status === 'present').length;
    const lateCount = records.filter((r) => r.status === 'late').length;
    const onLeaveCount = records.filter((r) => r.status === 'on_leave').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;
    return (<div className="max-w-none space-y-4 sm:space-y-6 w-full min-w-0 overflow-x-hidden">
      <PageHeader title="Attendance & Time Clock" description="Daily punch in/out timestamps, break tracking, working duration, and automated late arrival detection." actions={<Button size="sm" onClick={handleExport} className="bg-brand hover:bg-primary-hover text-primary-foreground font-medium text-xs h-9">
            <FontAwesomeIcon icon={faCalendarCheck} className="size-4 mr-1.5"/>
            Generate Timesheet
          </Button>}/>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 min-[440px]:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-brand-light bg-brand-light/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-brand-dark uppercase">
              Present Today
            </span>
            <FontAwesomeIcon icon={faCalendarCheck} className="size-4 text-brand"/>
          </div>
          <p className="text-xl font-bold text-brand-dark mt-1">
            {presentCount} Employees
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-700 uppercase">
              Late Arrivals
            </span>
            <FontAwesomeIcon icon={faTriangleExclamation} className="size-4 text-amber-600"/>
          </div>
          <p className="text-xl font-bold text-amber-800 mt-1">
            {lateCount} Employees
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-brand-light bg-brand-light/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-brand-dark uppercase">
              Approved Leave
            </span>
            <FontAwesomeIcon icon={faCalendarXmark} className="size-4 text-brand"/>
          </div>
          <p className="text-xl font-bold text-brand-dark mt-1">
            {onLeaveCount} Employees
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700 uppercase">
              Unexcused Absent
            </span>
            <FontAwesomeIcon icon={faCircleXmark} className="size-4 text-rose-600"/>
          </div>
          <p className="text-xl font-bold text-rose-800 mt-1">
            {absentCount} Employees
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <AttendanceFilters search={search} onSearchChange={setSearch} selectedDept={selectedDept} onDeptChange={setSelectedDept} selectedStatus={selectedStatus} onStatusChange={setSelectedStatus} onExport={handleExport} departments={['All Departments', ...new Set(records.map((row) => row.department).filter(Boolean))]} />

      {/* Attendance Table */}
      <HrmNotice loading={loading} error={error} onRetry={() => setRefresh((value) => value + 1)} />
      {!loading && !error && <AttendanceTable records={filtered} />}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Overtime attendance</h2>
          <div className="flex gap-2">
            <select className="h-9 rounded-md border border-slate-200 px-2 text-xs" value={otType} onChange={(event) => setOtType(event.target.value)}>
              <option value="">All types</option>
              <option value="BEFORE_SHIFT">Before shift</option>
              <option value="AFTER_SHIFT">After shift</option>
            </select>
            <select className="h-9 rounded-md border border-slate-200 px-2 text-xs" value={otStatus} onChange={(event) => setOtStatus(event.target.value)}>
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="text-slate-500"><tr><th className="py-2">Employee</th><th>Date</th><th>Type</th><th>Approved window</th><th>Actual</th><th>Status</th></tr></thead>
            <tbody>
              {overtime.map((row) => <tr key={row.id} className="border-t border-slate-100"><td className="py-2">{row.employeeName}<div className="text-slate-500">{row.employeeCode}</div></td><td>{String(row.overtimeDate || '').slice(0, 10)}</td><td>{row.overtimeType}</td><td>{row.startTime} – {row.endTime}</td><td>{row.actualHours == null ? '—' : `${row.actualHours} h`}</td><td>{row.sessionStatus || row.approvalStatus}</td></tr>)}
              {overtime.length === 0 && <tr><td className="py-4 text-slate-500" colSpan={6}>No overtime records for these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>);
}
