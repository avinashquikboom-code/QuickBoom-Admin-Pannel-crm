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
import { faCheck, faHeartPulse, faMagnifyingGlass, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { faCalendarCheck, faCalendarXmark } from '@fortawesome/free-regular-svg-icons';
import { decideLeave, hrmError, loadLeaves, submitLeave } from '@/modules/hrm/hrm-api';
import { HrmNotice } from '@/modules/hrm/HrmNotice';
import { AdminRowActions } from '@/components/common/AdminRowActions';
export default function LeaveManagementPage() {
    const [leaves, setLeaves] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [refresh, setRefresh] = React.useState(0);
    React.useEffect(() => {
        let active = true;
        loadLeaves().then((rows) => { if (active) setLeaves(rows); }).catch((err) => { if (active) setError(hrmError(err)); }).finally(() => { if (active) setLoading(false); });
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
    const [applyDialogOpen, setApplyDialogOpen] = React.useState(false);
    const [formData, setFormData] = React.useState({
        employeeName: 'Marcus Sterling',
        leaveType: 'Annual Leave',
        startDate: '2026-04-15',
        endDate: '2026-04-17',
        totalDays: 3,
        reason: 'Scheduled personal leave',
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
            await decideLeave(item.recordId, isApprove, note);
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
    const handleApplyLeave = async (e) => {
        e.preventDefault();
        try {
            await submitLeave({
                leaveTypeName: formData.leaveType,
                fromDate: formData.startDate,
                toDate: formData.endDate,
                days: Number(formData.totalDays) || 1,
                reason: formData.reason,
            });
            setApplyDialogOpen(false);
            setRefresh((value) => value + 1);
            toast.success('Leave application submitted');
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
            cell: (l) => <StatusBadge status={l.status}/>,
        },
        {
            header: 'Actions',
            className: 'text-right',
            cell: (l) => (
                <div className="flex items-center justify-end">
                    <AdminRowActions
                        record={l}
                        recordName={`${l.employeeName}'s leave application`}
                        actions={
                            l.status === 'pending'
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
                                : []
                        }
                    />
                </div>
            ),
        },
    ];
    return (<div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Leave Management & Absence Tracking" description="Review vacation requests, sick leaves, parental allowances, and team holiday calendars." actions={<Button size="sm" onClick={() => setApplyDialogOpen(true)} className="bg-brand hover:bg-primary-hover text-primary-foreground font-medium text-xs h-9">
            <FontAwesomeIcon icon={faPlus} className="size-4 mr-1.5"/>
            Apply Leave On Behalf
          </Button>}/>

      {/* KPI Balance Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1 sm:max-w-xs">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"/>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee, reason..." className="h-9 pl-8 pr-3 text-xs border-slate-200 bg-slate-50/50 focus-visible:bg-white"/>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="h-9 text-xs border-slate-200 w-44 bg-slate-50/50">
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
            <SelectTrigger className="h-9 text-xs border-slate-200 w-32 bg-slate-50/50">
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
        description="Record absence on behalf of an employee."
        onSubmit={handleApplyLeave}
        submitLabel="Submit Application"
        size="standard"
      >
        <DrawerFormField label="Employee Name" required>
          <Input required value={formData.employeeName} onChange={(e) => setFormData((prev) => ({ ...prev, employeeName: e.target.value }))} className="h-9 text-xs"/>
        </DrawerFormField>

        <DrawerFormField label="Leave Type" required>
          <Select value={formData.leaveType} onValueChange={(val) => setFormData((prev) => ({ ...prev, leaveType: val }))}>
            <SelectTrigger className="h-9 text-xs w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
        </DrawerFormField>

        <div className="grid grid-cols-2 gap-3">
          <DrawerFormField label="Start Date" required>
            <Input required type="date" value={formData.startDate} onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))} className="h-9 text-xs"/>
          </DrawerFormField>
          <DrawerFormField label="End Date" required>
            <Input required type="date" value={formData.endDate} onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))} className="h-9 text-xs"/>
          </DrawerFormField>
        </div>

        <DrawerFormField label="Total Days" required>
          <Input required type="number" value={formData.totalDays} onChange={(e) => setFormData((prev) => ({ ...prev, totalDays: Number(e.target.value) }))} className="h-9 text-xs"/>
        </DrawerFormField>

        <DrawerFormField label="Reason for Absence">
          <Input value={formData.reason} onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))} className="h-9 text-xs"/>
        </DrawerFormField>
      </FormDrawer>
    </div>);
}
