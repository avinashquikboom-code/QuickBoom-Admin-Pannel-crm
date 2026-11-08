'use client';
import { formatCurrency } from "@/lib/currency";

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/Tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { RequestDecisionDialogSwitch } from '@/components/approval';
import { mockOvertimeRequests, mockExpenseClaims, mockAnnouncements, } from '@/lib/mock-data';
import { toast } from '@/hooks/use-toast';
import { faArrowRight, faBullhorn, faCheck, faClock, faIndianRupeeSign, faXmark } from '@fortawesome/free-solid-svg-icons';
export function RecentActivity() {
    const [overtimes, setOvertimes] = React.useState(mockOvertimeRequests);
    const [expenses, setExpenses] = React.useState(mockExpenseClaims);
    // Dialog state
    const [dialogState, setDialogState] = React.useState({
        open: false,
        mode: null,
        requestType: null,
        item: null,
    });
    const [reviewNote, setReviewNote] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);

    const openDecision = (mode, requestType, item) => {
        setReviewNote('');
        setDialogState({
            open: true,
            mode,
            requestType,
            item,
        });
    };

    const handleSubmitDecision = async (note) => {
        const { mode, requestType, item } = dialogState;
        if (!item || !mode || !requestType) {
            return;
        }
        if (item.status !== 'pending') {
            toast.error('This request was already processed.');
            throw new Error('already-processed');
        }
        setSubmitting(true);
        try {
            await new Promise((resolve) => {
                setTimeout(resolve, 320);
            });
            const isApprove = mode === 'approve';
            if (requestType === 'overtime') {
                setOvertimes((prev) => prev.map((o) => (o.id === item.id
                    ? {
                        ...o,
                        status: isApprove ? 'approved' : 'rejected',
                        reviewNote: note || undefined,
                    }
                    : o)));
                if (isApprove) {
                    toast.success(`Overtime Approved for ${item.employeeName}`, {
                        description: `${item.hours} hrs (${formatCurrency(item.estimatedAmount)}) credited.`,
                    });
                }
                else {
                    toast.error(`Overtime Rejected for ${item.employeeName}`);
                }
            }
            else if (requestType === 'expense') {
                setExpenses((prev) => prev.map((e) => (e.id === item.id
                    ? {
                        ...e,
                        status: isApprove ? 'approved' : 'rejected',
                        reviewNote: note || undefined,
                    }
                    : e)));
                if (isApprove) {
                    toast.success(`Claim Approved for ${item.employeeName}`, {
                        description: `${formatCurrency(item.amount)} approved for reimbursement.`,
                    });
                }
                else {
                    toast.error(`Claim Rejected for ${item.employeeName}`);
                }
            }
            setDialogState({ open: false, mode: null, requestType: null, item: null });
            setReviewNote('');
        }
        catch (error) {
            if (error?.message !== 'already-processed') {
                toast.error('Unable to update this request. Please try again.');
                throw error;
            }
        }
        finally {
            setSubmitting(false);
        }
    };
    return (<Card className="border border-slate-200/90 bg-white shadow-xs">
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Operations & Requests Inbox
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Live approvals and recent announcements across QB Suite HRM
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <Tabs defaultValue="overtime" className="w-full">
          <TabsList className="bg-slate-100 p-1 mb-4 h-9">
            <TabsTrigger value="overtime" className="text-xs data-[state=active]:bg-white data-[state=active]:text-brand-dark data-[state=active]:shadow-xs font-semibold">
              <FontAwesomeIcon icon={faClock} className="size-3.5 mr-1.5"/>
              Overtime Requests
            </TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs data-[state=active]:bg-white data-[state=active]:text-brand-dark data-[state=active]:shadow-xs font-semibold">
              <FontAwesomeIcon icon={faIndianRupeeSign} className="size-3.5 mr-1.5"/>
              Expense Claims
            </TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs data-[state=active]:bg-white data-[state=active]:text-brand-dark data-[state=active]:shadow-xs font-semibold">
              <FontAwesomeIcon icon={faBullhorn} className="size-3.5 mr-1.5"/>
              Announcements
            </TabsTrigger>
          </TabsList>

          {/* Overtime Tab Content */}
          <TabsContent value="overtime" className="space-y-3 m-0">
            {overtimes.slice(0, 4).map((ot) => (<div key={ot.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9 border border-slate-200">
                    <AvatarImage src={ot.employeeAvatar} alt={ot.employeeName}/>
                    <AvatarFallback className="bg-brand text-primary-foreground text-xs">
                      {ot.employeeName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {ot.employeeName}
                      </span>
                      <StatusBadge status={ot.status} showIcon={false}/>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {ot.reason}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>{ot.department}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-600">
                        {ot.hours}h ({formatCurrency(ot.estimatedAmount)})
                      </span>
                      <span>•</span>
                      <span>Date: {ot.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {ot.status === 'pending' ? (<>
                      <Button size="sm" onClick={() => openDecision('approve', 'overtime', ot)} className="h-8 bg-brand hover:bg-primary-hover text-primary-foreground text-xs px-2.5 font-medium">
                        <FontAwesomeIcon icon={faCheck} className="size-3.5 mr-1"/>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openDecision('reject', 'overtime', ot)} className="h-8 border-slate-200 text-slate-600 hover:text-rose-600 text-xs px-2.5">
                        <FontAwesomeIcon icon={faXmark} className="size-3.5 mr-1"/>
                        Reject
                      </Button>
                    </>) : (<span className="text-xs text-slate-400 italic">
                      Processed
                    </span>)}
                </div>
              </div>))}
            <div className="pt-2 text-right">
              <Link href="/hrm/overtime" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark">
                View all overtime requests
                <FontAwesomeIcon icon={faArrowRight} className="size-3.5"/>
              </Link>
            </div>
          </TabsContent>

          {/* Expenses Tab Content */}
          <TabsContent value="expenses" className="space-y-3 m-0">
            {expenses.slice(0, 4).map((exp) => (<div key={exp.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9 border border-slate-200">
                    <AvatarImage src={exp.employeeAvatar} alt={exp.employeeName}/>
                    <AvatarFallback className="bg-brand text-primary-foreground text-xs">
                      {exp.employeeName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {exp.employeeName}
                      </span>
                      <StatusBadge status={exp.status} showIcon={false}/>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {exp.description}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span className="font-semibold text-brand-dark">
                        {exp.category}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(exp.amount)}
                      </span>
                      <span>•</span>
                      <span>{exp.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {exp.status === 'pending' ? (<>
                      <Button size="sm" onClick={() => openDecision('approve', 'expense', exp)} className="h-8 bg-brand hover:bg-primary-hover text-primary-foreground text-xs px-2.5 font-medium">
                        <FontAwesomeIcon icon={faCheck} className="size-3.5 mr-1"/>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openDecision('reject', 'expense', exp)} className="h-8 border-slate-200 text-slate-600 hover:text-rose-600 text-xs px-2.5">
                        <FontAwesomeIcon icon={faXmark} className="size-3.5 mr-1"/>
                        Reject
                      </Button>
                    </>) : (<span className="text-xs text-slate-400 italic">
                      Processed
                    </span>)}
                </div>
              </div>))}
            <div className="pt-2 text-right">
              <Link href="/hrm/expenses" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark">
                View all expense claims
                <FontAwesomeIcon icon={faArrowRight} className="size-3.5"/>
              </Link>
            </div>
          </TabsContent>

          {/* Announcements Tab Content */}
          <TabsContent value="announcements" className="space-y-3 m-0">
            {mockAnnouncements.slice(0, 3).map((ann) => (<div key={ann.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {ann.title}
                    </span>
                    {ann.isImportant && (<span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded">
                        Urgent
                      </span>)}
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {ann.createdAt}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {ann.content}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>Author: {ann.author.name}</span>
                  <span className="font-medium text-brand-dark">
                    Audience: {ann.targetAudience}
                  </span>
                </div>
              </div>))}
            <div className="pt-2 text-right">
              <Link href="/hrm/announcements" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark">
                Manage announcements
                <FontAwesomeIcon icon={faArrowRight} className="size-3.5"/>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <RequestDecisionDialogSwitch
        open={dialogState.open}
        onOpenChange={(open) => {
          if (!submitting) {
            setDialogState((prev) => ({ ...prev, open }));
          }
        }}
        mode={dialogState.mode}
        requestType={dialogState.requestType}
        item={dialogState.item}
        note={reviewNote}
        onNoteChange={setReviewNote}
        loading={submitting}
        onSubmit={handleSubmitDecision}
      />
    </Card>);
}
