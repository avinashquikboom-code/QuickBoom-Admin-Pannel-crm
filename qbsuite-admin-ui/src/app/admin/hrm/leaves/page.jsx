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
const mockLeaves = [
    {
        id: 'LEV-501',
        employeeId: 'EMP-1007',
        employeeName: 'Chloe Dupont',
        employeeAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        department: 'Marketing',
        leaveType: 'Maternity / Parental',
        startDate: '2026-03-20',
        endDate: '2026-06-20',
        totalDays: 60,
        reason: 'Parental leave under company family care program',
        status: 'approved',
        appliedOn: '2026-02-15',
    },
    {
        id: 'LEV-502',
        employeeId: 'EMP-1003',
        employeeName: 'Priya Sharma',
        employeeAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        department: 'Product & Design',
        leaveType: 'Annual Leave',
        startDate: '2026-04-06',
        endDate: '2026-04-10',
        totalDays: 5,
        reason: 'Annual family holiday and recharge',
        status: 'pending',
        appliedOn: '2026-03-22',
    },
    {
        id: 'LEV-503',
        employeeId: 'EMP-1002',
        employeeName: 'Alexander Vance',
        employeeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        department: 'Engineering',
        leaveType: 'Sick Leave',
        startDate: '2026-03-23',
        endDate: '2026-03-24',
        totalDays: 2,
        reason: 'Flu symptoms with doctor consultation prescription',
        status: 'approved',
        appliedOn: '2026-03-23',
    },
    {
        id: 'LEV-504',
        employeeId: 'EMP-1009',
        employeeName: 'Amara Okafor',
        employeeAvatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150',
        department: 'Engineering',
        leaveType: 'Casual Leave',
        startDate: '2026-03-27',
        endDate: '2026-03-27',
        totalDays: 1,
        reason: 'Personal family appointment',
        status: 'pending',
        appliedOn: '2026-03-24',
    },
];
export default function LeaveManagementPage() {
    const [leaves, setLeaves] = React.useState(mockLeaves);
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
            await new Promise((resolve) => {
                setTimeout(resolve, 320);
            });
            setLeaves((prev) => prev.map((l) => l.id === item.id
                ? {
                    ...l,
                    status: isApprove ? 'approved' : 'rejected',
                    reviewNote: note || undefined,
                }
                : l));
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
                toast.error('Unable to update leave request. Please try again.');
                throw error;
            }
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleApplyLeave = (e) => {
        e.preventDefault();
        const newLeave = {
            id: `LEV-${500 + leaves.length + 1}`,
            employeeId: 'EMP-1004',
            employeeName: formData.employeeName,
            employeeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
            department: 'Human Resources',
            leaveType: formData.leaveType,
            startDate: formData.startDate,
            endDate: formData.endDate,
            totalDays: Number(formData.totalDays) || 1,
            reason: formData.reason,
            status: 'pending',
            appliedOn: new Date().toISOString().split('T')[0],
        };
        setLeaves((prev) => [newLeave, ...prev]);
        setApplyDialogOpen(false);
        toast.success('Leave Application Submitted', {
            description: `Leave recorded for ${newLeave.employeeName}.`,
        });
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
            cell: (l) => (<div className="flex items-center justify-end gap-1.5">
          {l.status === 'pending' ? (<>
              <Button size="sm" onClick={() => handleApprove(l)} className="h-7.5 px-2.5 bg-brand hover:bg-primary-hover text-primary-foreground text-xs font-semibold">
                <FontAwesomeIcon icon={faCheck} className="size-3.5 mr-1"/>
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleReject(l)} className="h-7.5 px-2 border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs">
                <FontAwesomeIcon icon={faXmark} className="size-3.5"/>
              </Button>
            </>) : (<span className="text-xs text-slate-400 italic">Processed</span>)}
        </div>),
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
      <DataTable columns={columns} data={filtered} pageSize={8} emptyState={<div className="py-8 text-center text-slate-500">No leave applications found.</div>}/>

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
