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
import { hrmError, loadLiveDashboard } from '@/modules/hrm/hrm-api';
import { HrmNotice } from '@/modules/hrm/HrmNotice';
export default function AttendancePage() {
    const [records, setRecords] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [refresh, setRefresh] = React.useState(0);
    React.useEffect(() => {
        let active = true;
        setLoading(true);
        loadLiveDashboard().then((result) => { if (active) setRecords(result.records); }).catch((err) => { if (active) setError(hrmError(err)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [refresh]);
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
    </div>);
}
