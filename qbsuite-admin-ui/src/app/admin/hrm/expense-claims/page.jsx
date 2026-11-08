'use client';
import { formatCurrency } from "@/lib/currency";

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ExpenseTable } from '@/modules/hrm/components/expenses/ExpenseTable';
import { ExpenseDetail } from '@/modules/hrm/components/expenses/ExpenseDetail';
import { RequestDecisionDialogSwitch } from '@/components/approval';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/Select';
import { mockExpenseClaims } from '@/lib/mock-data';
import { toast } from '@/hooks/use-toast';
import { faCheckCircle, faClock, faIndianRupeeSign, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
export default function ExpenseClaimsPage() {
    const [claims, setClaims] = React.useState(mockExpenseClaims);
    const [search, setSearch] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState('all');
    const [selectedStatus, setSelectedStatus] = React.useState('all');
    const [selectedClaim, setSelectedClaim] = React.useState(null);
    const [detailOpen, setDetailOpen] = React.useState(false);
    // Dialog state
    const [confirmDialog, setConfirmDialog] = React.useState({
        open: false,
        type: null,
        item: null,
    });
    const [reviewNote, setReviewNote] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const filtered = React.useMemo(() => {
        return claims.filter((claim) => {
            const matchSearch = claim.employeeName.toLowerCase().includes(search.toLowerCase()) ||
                claim.description.toLowerCase().includes(search.toLowerCase()) ||
                claim.id.toLowerCase().includes(search.toLowerCase());
            const matchCategory = selectedCategory === 'all' || claim.category === selectedCategory;
            const matchStatus = selectedStatus === 'all' || claim.status === selectedStatus;
            return matchSearch && matchCategory && matchStatus;
        });
    }, [claims, search, selectedCategory, selectedStatus]);
    const handleOpenApprove = (claim) => {
        setReviewNote('');
        setConfirmDialog({
            open: true,
            type: 'approve',
            item: claim,
        });
    };
    const handleOpenReject = (claim) => {
        setReviewNote('');
        setConfirmDialog({
            open: true,
            type: 'reject',
            item: claim,
        });
    };
    const handleSubmitDecision = async (note) => {
        if (!confirmDialog.item || !confirmDialog.type) {
            return;
        }
        if (confirmDialog.item.status !== 'pending') {
            toast.error('This expense claim was already processed.');
            throw new Error('already-processed');
        }
        const item = confirmDialog.item;
        const isApprove = confirmDialog.type === 'approve';
        setSubmitting(true);
        try {
            await new Promise((resolve) => {
                setTimeout(resolve, 320);
            });
            const updatedStatus = isApprove ? 'approved' : 'rejected';
            setClaims((prev) => prev.map((c) => c.id === item.id
                ? {
                    ...c,
                    status: updatedStatus,
                    reviewedBy: 'Alexander Vance',
                    reviewDate: new Date().toISOString().split('T')[0],
                    reviewNote: note ||
                        (isApprove
                            ? 'Reimbursement verified and approved'
                            : 'Claim declined by policy compliance officer'),
                }
                : c));
            if (isApprove) {
                toast.success(`Expense Approved for ${item.employeeName}`, {
                    description: `${formatCurrency(item.amount)} scheduled for next payroll cycle.`,
                });
            }
            else {
                toast.error(`Expense Claim Rejected for ${item.employeeName}`);
            }
            setConfirmDialog({ open: false, type: null, item: null });
            setReviewNote('');
        }
        catch (error) {
            if (error?.message !== 'already-processed') {
                toast.error('Unable to update expense claim. Please try again.');
                throw error;
            }
        }
        finally {
            setSubmitting(false);
        }
    };
    const pendingAmount = claims
        .filter((c) => c.status === 'pending')
        .reduce((acc, curr) => acc + curr.amount, 0);
    const approvedAmount = claims
        .filter((c) => c.status === 'approved')
        .reduce((acc, curr) => acc + curr.amount, 0);
    return (<div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Expense Claims & Reimbursements" description="Review corporate travel, equipment allowances, subscriptions, and receipts for payroll reimbursement."/>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-700 uppercase">
              Pending Reimbursements
            </span>
            <FontAwesomeIcon icon={faClock} className="size-4 text-amber-600"/>
          </div>
          <p className="text-xl font-bold text-amber-800 mt-1">
            {formatCurrency(pendingAmount)}
          </p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            {claims.filter((c) => c.status === 'pending').length} claims awaiting review
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-brand-light bg-brand-light/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-brand-dark uppercase">
              Approved This Month
            </span>
            <FontAwesomeIcon icon={faCheckCircle} className="size-4 text-brand"/>
          </div>
          <p className="text-xl font-bold text-brand-dark mt-1">
            {formatCurrency(approvedAmount)}
          </p>
          <p className="text-[11px] text-brand-dark mt-0.5">
            {claims.filter((c) => c.status === 'approved').length} processed successfully
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Total Claims Logged
            </span>
            <FontAwesomeIcon icon={faIndianRupeeSign} className="size-4 text-brand"/>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {claims.length} Total Submissions
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">March 2026 reporting cycle</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1 sm:max-w-xs">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"/>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search claim, employee, receipt..." className="h-9 pl-8 pr-3 text-xs border-slate-200 bg-slate-50/50 focus-visible:bg-white"/>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-9 text-xs border-slate-200 w-44 bg-slate-50/50">
              <SelectValue placeholder="Category"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Categories
              </SelectItem>
              <SelectItem value="Travel" className="text-xs">
                Travel
              </SelectItem>
              <SelectItem value="Equipment & Hardware" className="text-xs">
                Equipment & Hardware
              </SelectItem>
              <SelectItem value="Software / Subscriptions" className="text-xs">
                Software & SaaS
              </SelectItem>
              <SelectItem value="Meals & Entertainment" className="text-xs">
                Meals & Entertainment
              </SelectItem>
              <SelectItem value="Training & Education" className="text-xs">
                Training & Education
              </SelectItem>
              <SelectItem value="Office Supplies" className="text-xs">
                Office Supplies
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

      {/* Expense Table */}
      <ExpenseTable claims={filtered} onApprove={handleOpenApprove} onReject={handleOpenReject} onViewDetail={(claim) => {
            setSelectedClaim(claim);
            setDetailOpen(true);
        }}/>

      {/* Expense Detail Sheet */}
      <ExpenseDetail claim={selectedClaim} open={detailOpen} onOpenChange={setDetailOpen} onApprove={handleOpenApprove} onReject={handleOpenReject}/>

      <RequestDecisionDialogSwitch
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!submitting) {
            setConfirmDialog((prev) => ({ ...prev, open }));
          }
        }}
        mode={confirmDialog.type}
        requestType="expense"
        item={confirmDialog.item}
        note={reviewNote}
        onNoteChange={setReviewNote}
        loading={submitting}
        onSubmit={handleSubmitDecision}
      />
    </div>);
}
