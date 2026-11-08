'use client';
import { formatCurrency } from "@/lib/currency";

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { OvertimeTable } from '@/modules/hrm/components/overtime/OvertimeTable';
import { OvertimeActions } from '@/modules/hrm/components/overtime/OvertimeActions';
import { RequestDecisionDialogSwitch } from '@/components/approval';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/common/Drawer';
import { Button } from '@/components/common/Button';
import { mockOvertimeRequests } from '@/lib/mock-data';
import { toast } from '@/hooks/use-toast';
import { faCheckCircle, faClock, faIndianRupeeSign } from '@fortawesome/free-solid-svg-icons';
export default function OvertimePage() {
    const [requests, setRequests] = React.useState(mockOvertimeRequests);
    const [activeTab, setActiveTab] = React.useState('all');
    const [search, setSearch] = React.useState('');
    // Confirmation dialogs
    const [confirmDialog, setConfirmDialog] = React.useState({
        open: false,
        type: null,
        item: null,
    });
    // Review note for approval/rejection
    const [reviewNote, setReviewNote] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    // Details dialog
    const [detailsItem, setDetailsItem] = React.useState(null);
    const counts = {
        all: requests.length,
        pending: requests.filter((r) => r.status === 'pending').length,
        approved: requests.filter((r) => r.status === 'approved').length,
        rejected: requests.filter((r) => r.status === 'rejected').length,
    };
    const filtered = React.useMemo(() => {
        return requests.filter((req) => {
            const matchTab = activeTab === 'all' || req.status === activeTab;
            const matchSearch = req.employeeName.toLowerCase().includes(search.toLowerCase()) ||
                req.project.toLowerCase().includes(search.toLowerCase()) ||
                req.reason.toLowerCase().includes(search.toLowerCase());
            return matchTab && matchSearch;
        });
    }, [requests, activeTab, search]);
    const handleApprove = (req) => {
        setReviewNote('');
        setConfirmDialog({
            open: true,
            type: 'approve',
            item: req,
        });
    };
    const handleReject = (req) => {
        setReviewNote('');
        setConfirmDialog({
            open: true,
            type: 'reject',
            item: req,
        });
    };
    const handleSubmitDecision = async (note) => {
        if (!confirmDialog.item || !confirmDialog.type) {
            return;
        }
        if (confirmDialog.item.status !== 'pending') {
            toast.error('This overtime request was already processed.');
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
            setRequests((prev) => prev.map((r) => r.id === item.id
                ? {
                    ...r,
                    status: updatedStatus,
                    reviewedBy: 'Alexander Vance',
                    reviewDate: new Date().toISOString().split('T')[0],
                    reviewNote: note || (isApprove ? 'Approved by Admin' : 'Rejected by Admin'),
                }
                : r));
            if (isApprove) {
                toast.success(`Overtime Approved for ${item.employeeName}`, {
                    description: `${item.hours}h credited (${formatCurrency(item.estimatedAmount)}).`,
                });
            }
            else {
                toast.error(`Overtime Rejected for ${item.employeeName}`);
            }
            setConfirmDialog({ open: false, type: null, item: null });
            setReviewNote('');
        }
        catch (error) {
            if (error?.message !== 'already-processed') {
                toast.error('Unable to update overtime request. Please try again.');
                throw error;
            }
        }
        finally {
            setSubmitting(false);
        }
    };
    const totalHours = requests
        .filter((r) => r.status === 'approved')
        .reduce((acc, curr) => acc + curr.hours, 0);
    const pendingAmount = requests
        .filter((r) => r.status === 'pending')
        .reduce((acc, curr) => acc + curr.estimatedAmount, 0);
    const approvedAmount = requests
        .filter((r) => r.status === 'approved')
        .reduce((acc, curr) => acc + curr.estimatedAmount, 0);
    return (<div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Overtime Approvals" description="Review, verify, and approve extra hours logged by engineering and operational personnel."/>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-700 uppercase">
              Pending Approvals
            </span>
            <FontAwesomeIcon icon={faClock} className="size-4 text-amber-600"/>
          </div>
          <p className="text-xl font-bold text-amber-800 mt-1">
            {counts.pending} Requests ({formatCurrency(pendingAmount)})
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-brand-light bg-brand-light/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-brand-dark uppercase">
              Approved Overtime
            </span>
            <FontAwesomeIcon icon={faCheckCircle} className="size-4 text-brand"/>
          </div>
          <p className="text-xl font-bold text-brand-dark mt-1">
            {counts.approved} Claims ({formatCurrency(approvedAmount)})
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Total Approved Extra Hours
            </span>
            <FontAwesomeIcon icon={faIndianRupeeSign} className="size-4 text-brand"/>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {totalHours} Total Hours
          </p>
        </div>
      </div>

      {/* Action Tabs & Search Toolbar */}
      <OvertimeActions activeTab={activeTab} onTabChange={setActiveTab} search={search} onSearchChange={setSearch} counts={counts}/>

      {/* Overtime Table */}
      <OvertimeTable records={filtered} onApprove={handleApprove} onReject={handleReject} onViewDetails={(req) => setDetailsItem(req)}/>

      <RequestDecisionDialogSwitch
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!submitting) {
            setConfirmDialog((prev) => ({ ...prev, open }));
          }
        }}
        mode={confirmDialog.type}
        requestType="overtime"
        item={confirmDialog.item}
        note={reviewNote}
        onNoteChange={setReviewNote}
        loading={submitting}
        onSubmit={handleSubmitDecision}
      />

      {/* Item Details Drawer */}
      <Sheet open={!!detailsItem} onOpenChange={() => setDetailsItem(null)}>
        <SheetContent side="right" className="sm:max-w-[480px] w-full p-0 flex flex-col gap-0 bg-white border-l border-slate-200/90 shadow-2xl rounded-l-2xl overflow-hidden">
          <SheetHeader className="border-b border-slate-200/80 px-6 py-4.5 text-left">
            <SheetTitle className="text-base font-bold text-slate-900">
              Overtime Request Details ({detailsItem?.id})
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500 mt-0.5">
              Review verification log and history.
            </SheetDescription>
          </SheetHeader>

          {detailsItem && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg space-y-2.5 border border-slate-200/80">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Employee</span>
                  <span className="font-semibold text-slate-900">{detailsItem.employeeName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Project</span>
                  <span className="font-semibold text-slate-900">{detailsItem.project}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Calculation</span>
                  <span className="font-semibold text-slate-900">
                    {detailsItem.hours} hrs @ {formatCurrency(detailsItem.hourlyRate)}/hr x {detailsItem.rateMultiplier} = {formatCurrency(detailsItem.estimatedAmount)}
                  </span>
                </div>
                <div className="space-y-1 pt-1">
                  <span className="text-slate-500">Reason</span>
                  <p className="text-slate-800 bg-white p-2.5 rounded border border-slate-200/80">{detailsItem.reason}</p>
                </div>
              </div>

              {detailsItem.reviewedBy && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1">
                  <span className="font-semibold text-slate-700">Review Note ({detailsItem.reviewedBy})</span>
                  <p className="text-slate-600 italic">{detailsItem.reviewNote}</p>
                </div>
              )}
            </div>
          )}

          <div className="shrink-0 flex items-center justify-end border-t border-slate-200/80 bg-slate-50/80 px-6 py-4">
            <Button variant="outline" size="sm" onClick={() => setDetailsItem(null)} className="h-9 px-4 text-xs font-medium text-slate-700">
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>);
}
