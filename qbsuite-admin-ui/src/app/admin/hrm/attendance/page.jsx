'use client';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { AttendanceFilters } from '@/modules/hrm/components/attendance/AttendanceFilters';
import { AttendanceTable } from '@/modules/hrm/components/attendance/AttendanceTable';
import { Button } from '@/components/common/Button';
import { FormDrawer, DrawerFormField } from '@/components/common/drawers/FormDrawer';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/Select';
import { mockAttendanceRecords } from '@/lib/mock-data';
import { toast } from '@/hooks/use-toast';
import { faCircleXmark, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { faCalendarCheck, faCalendarXmark } from '@fortawesome/free-regular-svg-icons';
export default function AttendancePage() {
    const [records, setRecords] = React.useState(mockAttendanceRecords);
    const [search, setSearch] = React.useState('');
    const [selectedDept, setSelectedDept] = React.useState('All Departments');
    const [selectedStatus, setSelectedStatus] = React.useState('all');
    // Edit / Manual adjustment dialog
    const [editDialogOpen, setEditDialogOpen] = React.useState(false);
    const [currentRecord, setCurrentRecord] = React.useState(null);
    const [punchInVal, setPunchInVal] = React.useState('');
    const [punchOutVal, setPunchOutVal] = React.useState('');
    const [statusVal, setStatusVal] = React.useState('present');
    const filtered = React.useMemo(() => {
        return records.filter((rec) => {
            const matchSearch = rec.employeeName.toLowerCase().includes(search.toLowerCase()) ||
                rec.employeeId.toLowerCase().includes(search.toLowerCase());
            const matchDept = selectedDept === 'All Departments' || rec.department === selectedDept;
            const matchStatus = selectedStatus === 'all' || rec.status === selectedStatus;
            return matchSearch && matchDept && matchStatus;
        });
    }, [records, search, selectedDept, selectedStatus]);
    const handleOpenEdit = (rec) => {
        setCurrentRecord(rec);
        setPunchInVal(rec.punchIn || '09:00 AM');
        setPunchOutVal(rec.punchOut || '05:00 PM');
        setStatusVal(rec.status);
        setEditDialogOpen(true);
    };
    const handleSaveAdjustment = (e) => {
        e.preventDefault();
        if (!currentRecord)
            return;
        setRecords((prev) => prev.map((r) => r.id === currentRecord.id
            ? {
                ...r,
                punchIn: punchInVal,
                punchOut: punchOutVal,
                status: statusVal,
            }
            : r));
        setEditDialogOpen(false);
        toast.success('Attendance punch updated', {
            description: `Manual punch adjustment saved for ${currentRecord.employeeName}.`,
        });
    };
    const handleExport = () => {
        toast.success('Attendance Report Exported', {
            description: `Exported ${filtered.length} records to CSV.`,
        });
    };
    const presentCount = records.filter((r) => r.status === 'present').length;
    const lateCount = records.filter((r) => r.status === 'late').length;
    const onLeaveCount = records.filter((r) => r.status === 'on_leave').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;
    return (<div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Attendance & Time Clock" description="Daily punch in/out timestamps, break tracking, working duration, and automated late arrival detection." actions={<Button size="sm" onClick={handleExport} className="bg-brand hover:bg-primary-hover text-primary-foreground font-medium text-xs h-9">
            <FontAwesomeIcon icon={faCalendarCheck} className="size-4 mr-1.5"/>
            Generate Timesheet
          </Button>}/>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
      <AttendanceFilters search={search} onSearchChange={setSearch} selectedDept={selectedDept} onDeptChange={setSelectedDept} selectedStatus={selectedStatus} onStatusChange={setSelectedStatus} onExport={handleExport}/>

      {/* Attendance Table */}
      <AttendanceTable records={filtered} onAdjustPunch={handleOpenEdit}/>

      {/* Manual Adjustment FormDrawer */}
      <FormDrawer
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Adjust Attendance Log"
        description={`Modify recorded punch times for ${currentRecord?.employeeName} (${currentRecord?.employeeId}).`}
        onSubmit={handleSaveAdjustment}
        submitLabel="Save Changes"
        size="standard"
      >
        <div className="grid grid-cols-2 gap-3">
          <DrawerFormField label="Punch In Time" required>
            <Input value={punchInVal} onChange={(e) => setPunchInVal(e.target.value)} placeholder="e.g. 08:50 AM" className="h-9 text-xs font-mono"/>
          </DrawerFormField>
          <DrawerFormField label="Punch Out Time" required>
            <Input value={punchOutVal} onChange={(e) => setPunchOutVal(e.target.value)} placeholder="e.g. 05:30 PM" className="h-9 text-xs font-mono"/>
          </DrawerFormField>
        </div>

        <DrawerFormField label="Attendance Status" required>
          <Select value={statusVal} onValueChange={(val) => setStatusVal(val)}>
            <SelectTrigger className="h-9 text-xs w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="present" className="text-xs">
                Present
              </SelectItem>
              <SelectItem value="late" className="text-xs">
                Late
              </SelectItem>
              <SelectItem value="half_day" className="text-xs">
                Half Day
              </SelectItem>
              <SelectItem value="on_leave" className="text-xs">
                On Leave
              </SelectItem>
              <SelectItem value="absent" className="text-xs">
                Absent
              </SelectItem>
            </SelectContent>
          </Select>
        </DrawerFormField>
      </FormDrawer>
    </div>);
}
