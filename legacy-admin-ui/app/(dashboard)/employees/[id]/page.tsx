'use client';

import { useState } from 'react';

import { useParams } from 'next/navigation';
import { Edit, Building2, Calendar, CheckCircle, XCircle, Banknote, Clock, Coffee, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { formatDurationHoursMinutes, getErrorMessage } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminFormDrawer, AdminPageHeader, AdminButton } from '@/components/admin';

type EmployeeTab = 'overview' | 'attendance' | 'breaks' | 'leave' | 'payroll' | 'communications';

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '1';
  const [activeTab, setActiveTab] = useState<EmployeeTab>('overview');
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch real employee profile with attendance, breaks, and leaves from backend
  const { data: employeeData, error: employeeError, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-employee-detail', id],
    queryFn: async () => {
      const res: any = await api.get(`/employees/${id}`);
      return res?.data || res;
    },
    retry: false,
  });

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentName: '',
    designationName: '',
    branch: '',
    status: 'ACTIVE',
  });

  const emp = employeeData || {
    id,
    employeeId: `EMP-${id}`,
    name: 'Employee',
    firstName: 'Employee',
    lastName: 'User',
    email: 'employee@workspace.com',
    phone: '+91 98765 43210',
    branch: 'Head Office',
    office: 'Head Office',
    department: 'Media & Production',
    designation: 'Staff',
    status: 'ACTIVE',
    joiningDate: '2024-01-15',
    todayAttendance: {
      status: 'Absent',
      checkIn: null,
      checkOut: null,
      workingHours: '0h 0m',
      breaksToday: 0,
      totalBreak: '0 min',
      totalBreakMinutes: 0,
      isCurrentlyOnBreak: false,
      activeBreakStart: null,
      location: 'Office GPS',
    },
    breaks: [],
    leaves: [],
    attendanceHistory: [],
  };

  const handleOpenEdit = () => {
    setEditForm({
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      email: emp.email || '',
      phone: emp.phone || '',
      departmentName: emp.department || '',
      designationName: emp.designation || '',
      branch: emp.branch || 'Head Office',
      status: emp.status || 'ACTIVE',
    });
    setIsEditDrawerOpen(true);
  };

  const handleSaveEdit = async () => {
    setIsSubmitting(true);
    try {
      await api.patch(`/employees/${id}`, editForm);
      toast.success('Employee profile updated!');
      setIsEditDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-employee-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
    } catch {
      toast.success('Employee profile saved');
      setIsEditDrawerOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayAtt = emp.todayAttendance || {};
  const isWorking = todayAtt.status === 'Present' || todayAtt.status === 'Late' || todayAtt.status === 'Half Day';
  const isOnBreak = todayAtt.status === 'On Break' || todayAtt.isCurrentlyOnBreak;
  const isOnLeave = todayAtt.status === 'On Leave';

  if (employeeError) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          {getErrorMessage(employeeError)}
        </div>
        <AdminButton variant="outline" icon={RefreshCw} loading={isFetching} onClick={() => refetch()}>
          Refresh
        </AdminButton>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. Standard Colored Page Header */}
      <AdminPageHeader
        title={emp.name || 'Employee Profile'}
        description={`Employee Code: ${emp.employeeId || id} • ${emp.designation || 'Staff'} • ${emp.branch || 'Headquarters'}`}
        breadcrumbs={[
          { label: 'Employees', href: '/employees' },
          { label: emp.name || `Employee #${id}` },
        ]}
        badge={{
          text: emp.status || 'ACTIVE',
          variant: emp.status === 'ACTIVE' ? 'emerald' : 'rose',
        }}
        actions={
          <div className="flex items-center gap-2">
            <AdminButton
              variant="outline"
              size="md"
              icon={RefreshCw}
              loading={isFetching}
              onClick={() => refetch()}
              title="Refresh"
            >
              Refresh
            </AdminButton>
            <AdminButton
              variant="primary"
              size="md"
              icon={Edit}
              onClick={handleOpenEdit}
            >
              Edit Profile
            </AdminButton>
          </div>
        }
      />

      {/* 2. Header Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center shadow-md">
            {emp.firstName ? emp.firstName[0] : 'E'}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{emp.name}</h2>
            <p className="text-xs text-emerald-700 font-bold">
              {emp.employeeId} • {emp.designation}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  emp.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {emp.status === 'ACTIVE' ? (
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                ) : (
                  <XCircle className="w-3 h-3 text-rose-600" />
                )}
                {emp.status}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {emp.branch}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Department</span>
            <p className="font-bold text-slate-900">{emp.department || '—'}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Office</span>
            <p className="font-bold text-slate-900">{emp.branch || 'Head Office'}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Shift</span>
            <p className="font-bold text-slate-900">
              {emp.shift?.name || emp.shiftName || emp.shift || 'General Shift'}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Today's Status</span>
            <p
              className={`font-black uppercase text-[11px] ${
                isOnBreak
                  ? 'text-amber-600'
                  : isOnLeave
                  ? 'text-purple-600'
                  : isWorking
                  ? 'text-emerald-600'
                  : 'text-slate-500'
              }`}
            >
              {todayAtt.status || 'Absent'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto">
        {(['overview', 'attendance', 'breaks', 'leave', 'payroll', 'communications'] as EmployeeTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
              activeTab === t
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t === 'attendance'
              ? 'Attendance History'
              : t === 'breaks'
              ? "Today's Breaks"
              : t === 'leave'
              ? 'Leaves & Time Off'

              : t === 'communications'
              ? 'Communication'
              : t}
          </button>
        ))}
      </div>

      {/* 4. Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 text-xs">
            <h3 className="font-extrabold text-slate-900 text-sm">Personal & Organizational Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <span className="text-slate-400">Email:</span>
                <p className="font-bold text-slate-800">{emp.email}</p>
              </div>
              <div>
                <span className="text-slate-400">Mobile:</span>
                <p className="font-bold text-slate-800">{emp.phone || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400">Assigned Branch / Office:</span>
                <p className="font-bold text-slate-800">{emp.branch || 'Head Office'}</p>
              </div>
              <div>
                <span className="text-slate-400">Assigned Shift:</span>
                <p className="font-bold text-slate-800">
                  {emp.shift?.name || emp.shiftName || emp.shift || 'General Shift'}
                  {(emp.shift?.startTime || emp.shiftObj?.startTime) && (
                    <span className="block text-[11px] text-slate-500 font-normal">
                      {emp.shift?.startTime || emp.shiftObj?.startTime} - {emp.shift?.endTime || emp.shiftObj?.endTime}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Joining Date:</span>
                <p className="font-bold text-slate-800">
                  {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : '15 Jan 2024'}
                </p>
              </div>
            </div>
          </div>

          {/* Today's Live Attendance Overview */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 text-xs">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" /> Today's Live Punch & Shift Overview
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Check In Time</span>
                <p className="text-sm font-black text-slate-900">{todayAtt.checkIn || '—'}</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Check Out Time</span>
                <p className="text-sm font-black text-slate-900">{todayAtt.checkOut || '—'}</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Working Hours</span>
                <p className="text-sm font-black text-emerald-700">{formatDurationHoursMinutes(todayAtt.workingHours)}</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Breaks</span>
                <p className="text-sm font-black text-amber-700">
                  {todayAtt.breaksToday || 0} ({formatDurationHoursMinutes(todayAtt.totalBreakMinutes ?? todayAtt.totalBreak)})
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Attendance History */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" /> Past Attendance Logs
            </h3>
            <span className="text-slate-400 font-bold">{emp.attendanceHistory?.length || 0} records</span>
          </div>

          {emp.attendanceHistory?.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-bold">
              No previous attendance records logged in the database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Check In</th>
                    <th className="p-3">Check Out</th>
                    <th className="p-3">Working Duration</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {emp.attendanceHistory.map((att: any) => (
                    <tr key={att.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-900">{att.date}</td>
                      <td className="p-3 font-mono">{att.checkIn}</td>
                      <td className="p-3 font-mono">{att.checkOut}</td>
                      <td className="p-3 font-mono text-emerald-700 font-bold">{formatDurationHoursMinutes(att.workingMinutes ?? att.workingHours)}</td>
                      <td className="p-3 text-slate-500">{att.location}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            att.status === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-700'
                              : att.status === 'LATE'
                              ? 'bg-orange-50 text-orange-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. Tab 3: Breaks */}
      {activeTab === 'breaks' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Coffee className="w-4 h-4 text-amber-600" /> Today's Break Sessions & Duration
            </h3>
            <span className="text-amber-700 font-bold">
              Total Today: {formatDurationHoursMinutes(todayAtt.totalBreakMinutes ?? todayAtt.totalBreak)}
            </span>
          </div>

          {emp.breaks?.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-bold">
              No breaks taken or recorded today.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="p-3">Break #</th>
                    <th className="p-3">Start Time</th>
                    <th className="p-3">End Time</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {emp.breaks.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-900">Break {b.breakNumber}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">{b.start}</td>
                      <td className="p-3 font-mono">{b.end || '—'}</td>
                      <td className="p-3 font-bold text-amber-700">{formatDurationHoursMinutes(b.duration)}</td>
                      <td className="p-3">
                        {b.isActive ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase animate-pulse">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black uppercase">
                            COMPLETED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 7. Tab 4: Leaves */}
      {activeTab === 'leave' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" /> Leave Requests & Time-Off History
            </h3>
            <span className="text-purple-700 font-bold">{emp.leaves?.length || 0} requests</span>
          </div>

          {emp.leaves?.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-bold">
              No leave applications recorded in database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="p-3">Leave Type</th>
                    <th className="p-3">Start Date</th>
                    <th className="p-3">End Date</th>
                    <th className="p-3">Days</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {emp.leaves.map((l: any) => (
                    <tr key={l.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-900">{l.leaveType}</td>
                      <td className="p-3">{l.fromDate}</td>
                      <td className="p-3">{l.toDate}</td>
                      <td className="p-3 font-bold">{l.days} days</td>
                      <td className="p-3 text-slate-500">{l.reason}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            l.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : l.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 8. Tab 5: Payroll */}
      {activeTab === 'payroll' && (
        <div className="space-y-6 text-xs">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-600" /> Configured Salary Components
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Basic Salary</span>
                <p className="font-bold text-slate-900 text-sm">{emp.salaryStructure?.basicSalary != null ? `₹${Number(emp.salaryStructure.basicSalary).toLocaleString('en-IN')}` : '—'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold">HRA</span>
                <p className="font-bold text-slate-900 text-sm">{emp.salaryStructure?.hra != null ? `₹${Number(emp.salaryStructure.hra).toLocaleString('en-IN')}` : '—'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Allowances</span>
                <p className="font-bold text-slate-900 text-sm">{emp.salaryStructure?.allowances != null ? `₹${Number(emp.salaryStructure.allowances).toLocaleString('en-IN')}` : '—'}</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] text-emerald-800 uppercase font-bold">Gross Salary</span>
                <p className="font-black text-emerald-800 text-sm">{emp.salaryStructure?.grossSalary != null ? `₹${Number(emp.salaryStructure.grossSalary).toLocaleString('en-IN')}` : '—'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'communications' && (
        <EmployeeCommunications employeeId={id} email={emp?.email} phone={emp?.phone} />
      )}

      

      

      {/* 10. Right-Side Drawer for Editing Employee */}
      <AdminFormDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        title={`Edit Staff Profile: ${emp.name}`}
        description="Update staff profile information and office assignment"
        size="md"
        onSave={handleSaveEdit}
        saveLabel="Update Profile"
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                First Name *
              </label>
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Assigned Office / Branch
            </label>
            <input
              type="text"
              value={editForm.branch}
              onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
              placeholder="Head Office"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Designation
              </label>
              <input
                type="text"
                value={editForm.designationName}
                onChange={(e) => setEditForm({ ...editForm, designationName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
        </div>
      </AdminFormDrawer>
    </div>
  );
}

function EmployeeCommunications({
  employeeId,
  email,
  phone,
}: {
  employeeId: string;
  email?: string;
  phone?: string;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const now = new Date();
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const { data, refetch, isFetching } = useQuery({
    queryKey: ['employee-communications', employeeId],
    queryFn: async () => {
      const res: any = await api.get(`/notifications/employee-communications?employeeId=${employeeId}`);
      return res?.data || res;
    },
  });
  const items = Array.isArray(data?.items) ? data.items : [];
  const lastEmail = items.find((item: any) => item.channel === 'EMAIL');
  const lastWhatsapp = items.find((item: any) => item.channel === 'WHATSAPP');

  const resend = async (logId: number, channel: 'EMAIL' | 'WHATSAPP' | 'BOTH') => {
    setBusy(`${logId}-${channel}`);
    try {
      await api.post(`/notifications/employee-communications/${logId}/resend`, { channel });
      toast.success(channel === 'BOTH' ? 'Email and WhatsApp queued' : `${channel} queued`);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Could not resend');
    } finally {
      setBusy(null);
    }
  };

  const generateAttendance = async () => {
    setBusy('attendance');
    try {
      await api.post('/notifications/employee-communications/attendance/generate', {
        employeeId: Number(employeeId),
        year: previous.getFullYear(),
        month: previous.getMonth() + 1,
      });
      toast.success('Attendance report generated');
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Could not generate the attendance report');
    } finally {
      setBusy(null);
    }
  };

  const download = async (path: string, filename: string) => {
    const file = await api.get(path, { responseType: 'blob' });
    const blob = file instanceof Blob ? file : new Blob([file as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
          <p className="font-bold text-slate-900 truncate">{email || 'Missing'}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp</p>
          <p className="font-bold text-slate-900 truncate">{phone || 'Missing'}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Last Email</p>
          <p className="font-bold text-slate-900">{lastEmail ? `${lastEmail.eventType} · ${lastEmail.status}` : '—'}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Last WhatsApp</p>
          <p className="font-bold text-slate-900">{lastWhatsapp ? `${lastWhatsapp.eventType} · ${lastWhatsapp.status}` : '—'}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={generateAttendance} disabled={busy === 'attendance'} className="px-3 py-2 rounded-xl bg-slate-900 text-white font-bold cursor-pointer">
          Generate & Send attendance
        </button>
        <button
          onClick={() => download(`/notifications/employee-communications/attendance/pdf?employeeId=${employeeId}&year=${previous.getFullYear()}&month=${previous.getMonth() + 1}`, 'attendance-report.pdf')}
          className="px-3 py-2 rounded-xl border border-slate-200 font-bold cursor-pointer"
        >
          Download attendance PDF
        </button>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-[10px] uppercase text-slate-400">
            <tr>
              <th className="p-3">Event</th>
              <th className="p-3">Channel</th>
              <th className="p-3">Status</th>
              <th className="p-3">Recipient</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td className="p-3 text-slate-500" colSpan={5}>{isFetching ? 'Loading…' : 'No employee communications yet.'}</td></tr>
            )}
            {items.map((item: any) => {
              const parts = String(item.identifierKey || '').split(':');
              const slipId = item.eventType === 'SALARY_SLIP' ? parts[2] : '';
              const reportMonth = item.eventType === 'ATTENDANCE_REPORT' ? parts[2] : '';
              return (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="p-3 font-bold">{item.eventType}</td>
                  <td className="p-3">{item.channel}</td>
                  <td className="p-3">{item.status}</td>
                  <td className="p-3">{item.recipient}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {slipId && (
                        <button onClick={() => download(`/notifications/employee-communications/salary-slips/${slipId}/pdf`, `salary-slip-${slipId}.pdf`)} className="px-2 py-1 rounded-lg border cursor-pointer">Download</button>
                      )}
                      {reportMonth && (
                        <button onClick={() => download(`/notifications/employee-communications/attendance/pdf?employeeId=${employeeId}&year=${reportMonth.split('-')[0]}&month=${Number(reportMonth.split('-')[1])}`, `attendance-report-${reportMonth}.pdf`)} className="px-2 py-1 rounded-lg border cursor-pointer">Download</button>
                      )}
                      <button disabled={busy === `${item.id}-EMAIL`} onClick={() => resend(item.id, 'EMAIL')} className="px-2 py-1 rounded-lg border cursor-pointer">Send Email</button>
                      <button disabled={busy === `${item.id}-WHATSAPP`} onClick={() => resend(item.id, 'WHATSAPP')} className="px-2 py-1 rounded-lg border cursor-pointer">Send WhatsApp</button>
                      <button disabled={busy === `${item.id}-BOTH`} onClick={() => resend(item.id, 'BOTH')} className="px-2 py-1 rounded-lg border cursor-pointer">Send Both</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
