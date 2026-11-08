'use client';
import { CURRENCY_LABEL, formatCurrency } from "@/lib/currency";

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, } from '@/components/common/Drawer';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { toast } from '@/hooks/use-toast';
import { faCheck, faDownload, faPaperclip, faXmark } from '@fortawesome/free-solid-svg-icons';
export function ExpenseDetail({ claim, open, onOpenChange, onApprove, onReject, }) {
    if (!claim)
        return null;
    return (<Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto p-6 bg-white space-y-6">
        <SheetHeader className="p-0 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">{claim.id}</span>
            <StatusBadge status={claim.status}/>
          </div>
          <SheetTitle className="text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(claim.amount)}
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-500">
            Submitted by {claim.employeeName} ({claim.department}) on {claim.submittedDate}
          </SheetDescription>
        </SheetHeader>

        {/* Breakdown Card */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Category</span>
            <Badge variant="outline" className="bg-white text-brand-dark border-brand-light">
              {claim.category}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Expense Date</span>
            <span className="font-semibold text-slate-800">{claim.date}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Reimbursement Currency</span>
            <span className="font-mono text-slate-800">{CURRENCY_LABEL}</span>
          </div>
          <div className="pt-2 border-t border-slate-200/60">
            <span className="text-slate-500 block mb-1">Expense Description</span>
            <p className="text-slate-800 leading-relaxed font-medium">
              {claim.description}
            </p>
          </div>
        </div>

        {/* Receipt Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faPaperclip} className="size-4 text-brand"/>
              Attached Receipt Document
            </span>
            <Button variant="ghost" size="sm" onClick={() => toast.success(`Downloading ${claim.receiptName}`)} className="h-6 text-[11px] text-brand hover:text-brand-dark p-0">
              <FontAwesomeIcon icon={faDownload} className="size-3 mr-1"/>
              Download
            </Button>
          </div>
          <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100 aspect-video flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={claim.receiptUrl} alt={claim.receiptName} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"/>
          </div>
          <p className="text-[11px] text-slate-400 text-center font-mono">
            {claim.receiptName} • Verified tax invoice
          </p>
        </div>

        {/* Review Notes / Audit Log */}
        {claim.reviewedBy && (<div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 space-y-1 text-xs">
            <span className="font-bold text-slate-800">
              Audit Note ({claim.reviewedBy})
            </span>
            <p className="text-slate-600 italic">{claim.reviewNote}</p>
            <p className="text-[10px] text-slate-400 pt-1">
              Reviewed on {claim.reviewDate}
            </p>
          </div>)}

        {/* Action Buttons */}
        {claim.status === 'pending' && onApprove && onReject && (<div className="pt-2 flex items-center gap-2">
            <Button className="flex-1 bg-brand hover:bg-primary-hover text-primary-foreground text-xs font-semibold h-9" onClick={() => {
                onApprove(claim);
                onOpenChange(false);
            }}>
              <FontAwesomeIcon icon={faCheck} className="size-4 mr-1.5"/>
              Approve Claim
            </Button>
            <Button variant="outline" className="border-slate-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold h-9" onClick={() => {
                onReject(claim);
                onOpenChange(false);
            }}>
              <FontAwesomeIcon icon={faXmark} className="size-4 mr-1.5"/>
              Reject
            </Button>
          </div>)}
      </SheetContent>
    </Sheet>);
}
