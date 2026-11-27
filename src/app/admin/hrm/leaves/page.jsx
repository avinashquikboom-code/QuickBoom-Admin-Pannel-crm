'use client';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { RequestDecisionDialogSwitch } from '@/components/approval';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { FormDrawer, DrawerFormField } from '@/components/common/drawers/FormDrawer';
import { Label } from '@/components/common/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/Select';
import { toast } from '@/hooks/use-toast';
import { faCheck, faEye, faHeartPulse, faMagnifyingGlass, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { faCalendarCheck, faCalendarXmark } from '@fortawesome/free-regular-svg-icons';
import { cancelLeaveRequest, decideLeave, hrmError, loadLeaves, submitLeave } from '@/modules/hrm/hrm-api';
import { HrmNotice } from '@/modules/hrm/HrmNotice';
import { AdminRowActions } from '@/components/common/AdminRowActions';
import api from '../../../../../lib/api';

const FALLBACK_LEAVE_TYPES = [
    { id: null, name: 'Annual Leave' },
    { id: null, name: 'Sick Leave' },
    { id: null, name: 'Casual Leave' },
    { id: null, name: 'Earned Leave' },
    { id: null, name: 'Unpaid Leave' },
    { id: null, name: 'Maternity / Parental' },
];

export default function LeaveManagementPage() {
    const todayStr = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
    const [leaves, setLeaves] = React.useState([]);
    const [employees, setEmployees] = React.useState([]);
    const [leaveTypes, setLeaveTypes] = React.useState(FALLBACK_LEAVE_TYPES);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [refresh, setRefresh] = React.useState(0);
    React.useEffect(() => {
        let active = true;
        Promise.all([
            loadLeaves(),
            api.get('/employees', { params: { limit: 200 } }).catch(() => ({ data: [] })),
            api.get('/leaves/types').catch(() => ({ data: [] })),
        ])
            .then(([rows, empRes, typeRes]) => {
                if (!active) return;
                setLeaves(rows);
                const empList = Array.isArray(empRes?.data) ? empRes.data : Array.isArray(empRes) ? empRes : [];
                setEmployees(empList);
                const rawTypes = Array.isArray(typeRes?.data) ? typeRes.data : Array.isArray(typeRes) ? typeRes : [];
                if (rawTypes.length > 0) {
                    setLeaveTypes(rawTypes.map((t) => ({ id: t.id, name: t.name || t.leaveType || 'Leave' })));
                }
            })
            .catch((err) => { if (active) setError(hrmError(err)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [refresh]);
    const [search, setSearch] = React.useState('');
    const [selectedType, setSelectedType] = React.useState('all');
    const [selectedStatus, setSelectedStatus] = React.useState('all');
    const [confirmDialog, setConfirmDialog] = React.useState({
        open: false,
        type: null,
        item: null,
    });
    const [reviewNote, setReviewNote] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const [detailItem, setDetailItem] = React.useState(null);
    const [applyDialogOpen, setApplyDialogOpen] = React.useState(false);
    const [formData, setFormData] = React.useState({
        employeeId: '',
        employeeName: '',
        leaveType: 'Annual Leave',
        leaveTypeId: '',
        durationType: 'FULL_DAY',
        halfDaySession: 'FIRST_HALF',
        startDate: todayStr,
        endDate: todayStr,
        totalDays: 1,
        reason: '',
        isExceptional: false,
        exceptionalReason: '',
    });
    const filtered = React.useMemo(() => {
        return leaves.filter((l) => {
            const matchSearch = l.employeeName.toLowerCase().includes(search.toLowerCase()) ||
                l.reason.toLowerCase().includes(search.toLowerCase()) ||
                l.id.toLowerCase().includes(search.toLowerCase());
            const matchType = selectedType === 'all' || l.leaveType === selectedType;
            const matchStatus = selectedStatus === 'all' || l.status === selectedStatus;
            return matchSearch && matchType && matchStatus;
        });
    }, [leaves, search, selectedType, selectedStatus]);
    const handleApprove = (item) => {
        setReviewNote('');
        setConfirmDialog({
            open: true,
            type: 'approve',
            item,
        });
    };
    const handleReject = (item) => {
        setReviewNote('');
        setConfirmDialog({
            open: true,
            type: 'reject',
            item,
        });
    };
    const handleSubmitDecision = async (note) => {
        if (!confirmDialog.item || !confirmDialog.type) {
            return;
        }
        if (confirmDialog.item.status !== 'pending') {
            toast.error('This leave request was already processed.');
            throw new Error('already-processed');
        }
        const item = confirmDialog.item;
        const isApprove = confirmDialog.type === 'approve';
        setSubmitting(true);
        try {
            await decideLeave(item.recordId, isApprove, note, {
                isExceptional: Boolean(isApprove && note?.trim()),
                exceptionalReason: isApprove ? note?.trim() : undefined,
            });
            setRefresh((value) => value + 1);
            if (isApprove) {
                toast.success(`Leave Approved for ${item.employeeName}`, {
                    description: `${item.totalDays} day(s) deducted from balance.`,
                });
            }
            else {
                toast.error(`Leave Request Rejected for ${item.employeeName}`);
            }
            setConfirmDialog({ open: false, type: null, item: null });
            setReviewNote('');
        }
        catch (error) {
            if (error?.message !== 'already-processed') {
                toast.error(hrmError(error));
                throw error;
            }
        }
        finally {
            setSubmitting(false);
        }
    };
    const computedDays = React.useMemo(() => {
        if (formData.durationType === 'HALF_DAY') return 0.5;
        if (!formData.startDate || !formData.endDate) return 1;
        const s = new Date(formData.startDate);
        const e = new Date(formData.endDate);
        if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 1;
        return Math.round((e - s) / 86_400_000) + 1;
    }, [formData.durationType, formData.startDate, formData.endDate]);

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        try {
            const isHalfDay = formData.durationType === 'HALF_DAY';
            await submitLeave({
                ...(formData.employeeId ? { employeeId: Number(formData.employeeId) } : {}),
                ...(formData.leaveTypeId ? { leaveTypeId: Number(formData.leaveTypeId) } : {}),
                leaveTypeName: formData.leaveType,
                durationType: formData.durationType,
                halfDaySession: isHalfDay ? formData.halfDaySession : undefined,
                fromDate: formData.startDate,
                toDate: isHalfDay ? formData.startDate : formData.endDate,
                days: computedDays,
                reason: formData.reason.trim() || 'Leave application',
                isExceptional: formData.isExceptional || undefined,
                exceptionalReason: formData.isExceptional ? formData.exceptionalReason : undefined,
            });
            setApplyDialogOpen(false);
            setRefresh((value) => value + 1);
            toast.success('Leave applied and auto-approved for employee');
        } catch (err) {
            toast.error(hrmError(err));
        }
    };
    const columns = [
        {
            header: 'Employee',
            cell: (l) => (<div className="flex items-center gap-3">
          <Avatar className="size-9 border border-slate-200">
            <AvatarImage src={l.employeeAvatar} alt={l.employeeName}/>
            <AvatarFallback className="bg-brand text-primary-foreground text-xs">
              {l.employeeName.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 leading-tight">
              {l.employeeName}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {l.employeeId} • {l.department}
            </span>
          </div>
        </div>),
        },
        {
            header: 'Leave Type',
            cell: (l) => (<Badge variant="outline" className="bg-slate-50 text-slate-800 border-slate-200 text-xs font-medium py-0.5">
          {l.leaveType}
        </Badge>),
        },
        {
            header: 'Duration',
            cell: (l) => (<div className="flex flex-col text-xs">
          <span className="font-bold text-slate-900">
            {l.totalDays} {l.totalDays === 1 ? 'Day' : 'Days'}
          </span>
          <span className="text-slate-500">
            {l.startDate} to {l.endDate}
          </span>
        </div>),
        },
        {
            header: 'Reason',
            cell: (l) => (<p className="text-xs text-slate-600 max-w-xs truncate" title={l.reason}>
          {l.reason}
        </p>),
        },
        {
            header: 'Status',
            cell: (l) => (
                <div className="flex flex-col items-start gap-1">
                    <StatusBadge status={l.status}/>
                    {l.appliedBySource === 'ADMIN' && (
                        <span className="text-[10px] font-semibold text-[#107569] bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                            Applied by Admin{l.appliedByName ? `: ${l.appliedByName}` : ''}
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: 'Actions',
            className: 'text-right',
            cell: (l) => (
                <div className="flex items-center justify-end">
                    <AdminRowActions
                        record={l}
                        recordName={`${l.employeeName}'s leave application`}
                        actions={[
                            {
                                label: 'View Details',
                                icon: faEye,
                                onClick: () => setDetailItem(l),
                            },
                            ...(l.status === 'pending'
                                ? [
                                    {
                                        label: 'Approve Leave',
                                        icon: faCheck,
                                        onClick: () => handleApprove(l),
                                    },
                                    {
                                        label: 'Reject Leave',
                                        icon: faXmark,
                                        variant: 'destructive',
                                        confirm: {
                                            title: `Reject Leave for ${l.employeeName}?`,
                                            description: `Are you sure you want to reject this leave request?`,
                                            confirmLabel: 'Reject',
                                            variant: 'destructive',
                                        },
                                        onClick: () => handleReject(l),
                                    },
                                ]
                                : []),
                            ...((l.status === 'pending' || l.status === 'approved')
                                ? [
                                    {
                                        label: 'Cancel Leave',
                                        icon: faXmark,
                                        variant: 'destructive',
                                        confirm: {
                                            title: `Cancel Leave for ${l.employeeName}?`,
                                            description: l.status === 'approved'
                                                ? 'Cancelling this approved leave will restore the deducted leave balance and recalculate attendance.'
                                                : 'Are you sure you want to cancel this pending leave request?',
                                            confirmLabel: 'Cancel Leave',
                                            variant: 'destructive',
                                        },
                                        onClick: async () => {
                                            try {
                                                await cancelLeaveRequest(l.recordId);
                                                setRefresh((value) => value + 1);
                                                toast.success('Leave cancelled and balance/attendance updated');
                                            } catch (err) {
                                                toast.error(hrmError(err));
                                            }
                                        },
                                    },
                                ]
                                : []),
                        ]}
                    />
                </div>
            ),
        },
    ];
    return (<div className="max-w-none space-y-4 sm:space-y-6 w-full min-w-0 overflow-x-hidden">
      <PageHeader title="Leave Management & Absence Tracking" description="Review vacation requests, sick leaves, parental allowances, and team holiday calendars." actions={<Button size="sm" onClick={() => setApplyDialogOpen(true)} className="bg-brand hover:bg-primary-hover text-primary-foreground font-medium text-xs h-9">
            <FontAwesomeIcon icon={faPlus} className="size-4 mr-1.5"/>
            Apply Leave On Behalf
          </Button>}/>

      {/* KPI Balance Strip */}
      <div className="grid grid-cols-1 min-[440px]:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-700 uppercase">
              Pending Requests
            </span>
            <FontAwesomeIcon icon={faCalendarXmark} className="size-4 text-amber-600"/>
          </div>
          <p className="text-xl font-bold text-amber-800 mt-1">
            {leaves.filter((l) => l.status === 'pending').length} Requests
          </p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            6 total days awaiting approval
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-brand-light bg-brand-light/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-brand-dark uppercase">
              Currently On Leave
            </span>
            <FontAwesomeIcon icon={faCalendarCheck} className="size-4 text-brand"/>
          </div>
          <p className="text-xl font-bold text-brand-dark mt-1">
            1 Team Member
          </p>
          <p className="text-[11px] text-brand-dark mt-0.5">
            Chloe Dupont (Parental leave)
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Average Annual Balance
            </span>
            <FontAwesomeIcon icon={faHeartPulse} className="size-4 text-brand"/>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">
            18.5 Days / Emp
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Standard 24-day statutory policy
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs w-full min-w-0">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"/>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee, reason..." className="h-9 pl-8 pr-3 text-xs border-slate-200 bg-slate-50/50 focus-visible:bg-white w-full"/>
        </div>

        <div className="flex flex-col min-[480px]:flex-row flex-wrap items-stretch min-[480px]:items-center gap-2 w-full sm:w-auto">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="h-9 text-xs border-slate-200 w-full min-[480px]:w-44 bg-slate-50/50">
              <SelectValue placeholder="Leave Type"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Leave Types
              </SelectItem>
              <SelectItem value="Annual Leave" className="text-xs">
                Annual Leave
              </SelectItem>
              <SelectItem value="Sick Leave" className="text-xs">
                Sick Leave
              </SelectItem>
              <SelectItem value="Casual Leave" className="text-xs">
                Casual Leave
              </SelectItem>
              <SelectItem value="Maternity / Parental" className="text-xs">
                Maternity / Parental
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="h-9 text-xs border-slate-200 w-full min-[480px]:w-32 bg-slate-50/50">
              <SelectValue placeholder="Status"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Status
              </SelectItem>
              <SelectItem value="pending" className="text-xs">
                Pending
              </SelectItem>
              <SelectItem value="approved" className="text-xs">
                Approved
              </SelectItem>
              <SelectItem value="rejected" className="text-xs">
                Rejected
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <HrmNotice loading={loading} error={error} onRetry={() => setRefresh((value) => value + 1)} />
      {!loading && !error && <DataTable hideToolbar columns={columns} data={filtered} pageSize={8} emptyState={<div className="py-8 text-center text-slate-500">No leave applications found.</div>}/>}

      <RequestDecisionDialogSwitch
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!submitting) {
            setConfirmDialog((prev) => ({ ...prev, open }));
          }
        }}
        mode={confirmDialog.type}
        requestType="leave"
        item={confirmDialog.item}
        note={reviewNote}
        onNoteChange={setReviewNote}
        loading={submitting}
        onSubmit={handleSubmitDecision}
      />

      {/* Apply Leave FormDrawer */}
      <FormDrawer
        open={applyDialogOpen}
        onOpenChange={setApplyDialogOpen}
        title="Submit Leave Application"
        description="Record a full-day or half-day absence on behalf of an employee."
        onSubmit={handleApplyLeave}
        submitLabel="Submit Application"
        size="standard"
      >
        <div className="space-y-4">
          {/* Section 1: Employee & Leave Type */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Employee & Leave Category
            </div>

            <DrawerFormField label="Employee" required>
              {employees.length > 0 ? (
                <Select
                  value={formData.employeeId}
                  onValueChange={(val) => {
                    const emp = employees.find((item) => String(item.id) === val);
                    setFormData((prev) => ({
                      ...prev,
                      employeeId: val,
                      employeeName: emp ? `${emp.firstName} ${emp.lastName}`.trim() : prev.employeeName,
                    }));
                  }}
                >
                  <SelectTrigger className="h-9 text-xs w-full bg-white">
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={String(emp.id)} className="text-xs">
                        {emp.firstName} {emp.lastName} ({emp.employeeCode || `EMP-${emp.id}`})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  required
                  placeholder="Enter employee name"
                  value={formData.employeeName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, employeeName: e.target.value }))}
                  className="h-9 text-xs bg-white"
                />
              )}
            </DrawerFormField>

            <DrawerFormField label="Leave Type" required>
              <Select
                value={formData.leaveType}
                onValueChange={(val) => {
                  const matched = leaveTypes.find((t) => t.name === val);
                  setFormData((prev) => ({
                    ...prev,
                    leaveType: val,
                    leaveTypeId: matched?.id ? String(matched.id) : '',
                  }));
                }}
              >
                <SelectTrigger className="h-9 text-xs w-full bg-white">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((lt) => (
                    <SelectItem key={lt.id || lt.name} value={lt.name} className="text-xs">
                      {lt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </DrawerFormField>
          </div>

          {/* Section 2: Duration & Schedule */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Duration & Schedule
            </div>

            <DrawerFormField label="Leave Duration" required>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'FULL_DAY', session: 'FIRST_HALF', label: 'Full Day' },
                  { key: 'HALF_DAY', session: 'FIRST_HALF', label: 'First Half' },
                  { key: 'HALF_DAY', session: 'SECOND_HALF', label: 'Second Half' },
                ].map((opt) => {
                  const isSelected =
                    opt.key === 'FULL_DAY'
                      ? formData.durationType === 'FULL_DAY'
                      : formData.durationType === 'HALF_DAY' && formData.halfDaySession === opt.session;
                  return (
                    <button
                      key={`${opt.key}-${opt.session}`}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          durationType: opt.key,
                          halfDaySession: opt.session,
                          endDate: opt.key === 'HALF_DAY' ? prev.startDate : prev.endDate,
                        }))
                      }
                      className={`h-9 rounded-lg border text-xs font-semibold transition-all ${
                        isSelected
                          ? 'border-[#107569] bg-[#107569] text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </DrawerFormField>

            <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3">
              <DrawerFormField label={formData.durationType === 'HALF_DAY' ? 'Leave Date' : 'Start Date'} required>
                <Input
                  required
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                      endDate:
                        prev.durationType === 'HALF_DAY' || prev.endDate < e.target.value
                          ? e.target.value
                          : prev.endDate,
                    }))
                  }
                  className="h-9 text-xs bg-white"
                />
              </DrawerFormField>

              {formData.durationType !== 'HALF_DAY' && (
                <DrawerFormField label="End Date" required>
                  <Input
                    required
                    type="date"
                    min={formData.startDate}
                    value={formData.endDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="h-9 text-xs bg-white"
                  />
                </DrawerFormField>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs">
              <span className="font-medium text-emerald-900">Calculated Leave Duration</span>
              <span className="font-bold text-[#107569]">
                {computedDays === 0.5
                  ? `0.5 Day (${formData.halfDaySession === 'SECOND_HALF' ? 'Second Half' : 'First Half'})`
                  : `${computedDays} ${computedDays === 1 ? 'Day' : 'Days'}`}
              </span>
            </div>
          </div>

          {/* Section 3: Reason & Admin Override */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
            <DrawerFormField label="Reason for Absence" required>
              <textarea
                required
                rows={3}
                placeholder="Enter reason for leave..."
                value={formData.reason}
                onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#107569]/30"
              />
            </DrawerFormField>

            <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isExceptional}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isExceptional: e.target.checked }))}
                  className="size-4 rounded accent-[#107569]"
                />
                <span>Exceptional Admin Override (bypass advance notice / same-day cutoff)</span>
              </label>
              {formData.isExceptional && (
                <Input
                  required
                  placeholder="Mandatory exceptional approval reason"
                  value={formData.exceptionalReason}
                  onChange={(e) => setFormData((prev) => ({ ...prev, exceptionalReason: e.target.value }))}
                  className="h-9 text-xs bg-slate-50"
                />
              )}
            </div>
          </div>
        </div>
      </FormDrawer>

      {/* Leave Details Drawer */}
      <FormDrawer
        open={Boolean(detailItem)}
        onOpenChange={(open) => { if (!open) setDetailItem(null); }}
        title="Leave Application Details"
        description={detailItem ? `${detailItem.employeeName} (${detailItem.employeeCode || 'EMP'})` : ''}
        onSubmit={(e) => { e.preventDefault(); setDetailItem(null); }}
        submitLabel="Close"
        size="standard"
      >
        {detailItem && (
          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
              <div className="flex justify-between"><span className="text-slate-500">Leave Type</span><span className="font-semibold text-slate-900">{detailItem.leaveType}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Status</span><StatusBadge status={detailItem.status} /></div>
              <div className="flex justify-between"><span className="text-slate-500">Duration</span><span className="font-semibold text-slate-900">{detailItem.totalDays} {detailItem.totalDays === 1 ? 'Day' : 'Days'} ({detailItem.durationType === 'HALF_DAY' ? (detailItem.halfDaySession === 'SECOND_HALF' ? 'Second Half' : 'First Half') : 'Full Day'})</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Dates</span><span className="font-medium text-slate-800">{detailItem.startDate} to {detailItem.endDate}</span></div>
              {detailItem.halfStartTime && detailItem.halfEndTime && (
                <div className="flex justify-between"><span className="text-slate-500">Half-Day Window</span><span className="font-medium text-slate-800">{detailItem.halfStartTime} – {detailItem.halfEndTime}</span></div>
              )}
              <div className="flex justify-between"><span className="text-slate-500">Applied On</span><span className="font-medium text-slate-800">{detailItem.createdAt ? String(detailItem.createdAt).slice(0, 16).replace('T', ' ') : (detailItem.appliedOn || '—')}</span></div>
              {detailItem.appliedBySource === 'ADMIN' && (
                <div className="flex justify-between"><span className="text-slate-500">Source</span><span className="font-semibold text-[#107569]">Applied by Admin ({detailItem.appliedByName || 'Admin'})</span></div>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Reason</div>
              <p className="text-slate-700 leading-relaxed">{detailItem.reason || 'No reason provided.'}</p>
            </div>
            {detailItem.isExceptional && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Exceptional Approval Override</div>
                <p className="text-amber-900">{detailItem.exceptionalReason || 'Approved with admin override.'}</p>
              </div>
            )}
          </div>
        )}
      </FormDrawer>
    </div>);
}
