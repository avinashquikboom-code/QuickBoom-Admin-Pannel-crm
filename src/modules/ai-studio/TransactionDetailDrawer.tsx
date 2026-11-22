// @ts-nocheck
'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Coins,
  Calendar,
  User,
  Building2,
  FileText,
  CreditCard,
  Hash,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface TransactionDetailDrawerProps {
  transaction: any | null;
  open: boolean;
  onClose: () => void;
}

export function TransactionDetailDrawer({
  transaction,
  open,
  onClose,
}: TransactionDetailDrawerProps) {
  if (!transaction) return null;

  const isPositive = (transaction.amount || 0) > 0 || transaction.type === 'PURCHASE' || transaction.type === 'GRANT';

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 flex flex-col bg-white">
        <SheetHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#20C466]">
              TRANSACTION AUDIT
            </span>
            <Badge
              variant="outline"
              className={
                isPositive
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-slate-100 text-slate-800'
              }
            >
              {transaction.type || 'USAGE'}
            </Badge>
          </div>
          <SheetTitle className="text-xl font-bold text-[#163A2E] mt-1">
            Transaction #{transaction.id}
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-500">
            Recorded on {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : '—'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Credit Amount Highlight Box */}
          <div className={`rounded-2xl p-5 border flex items-center justify-between ${
            isPositive
              ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
              : 'bg-slate-50 border-slate-200/80 text-slate-900'
          }`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Amount Changed
              </p>
              <h2 className="text-3xl font-extrabold flex items-center gap-1 mt-1">
                {isPositive ? (
                  <ArrowUpRight className="size-6 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="size-6 text-rose-600" />
                )}
                {isPositive ? `+${Math.abs(transaction.amount || 0)}` : `-${Math.abs(transaction.amount || 0)}`}
                <span className="text-base font-normal text-slate-500 ml-1">Credits</span>
              </h2>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Balance After
              </p>
              <p className="text-xl font-bold text-[#163A2E] mt-1">
                {transaction.balanceAfter ?? '—'} Credits
              </p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Customer Information
            </h4>
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-emerald-100 text-[#163A2E] flex items-center justify-center font-bold text-sm shrink-0">
                <User className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {transaction.customer?.companyName || transaction.customer?.name || `Customer #${transaction.customerId}`}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  ID: #{transaction.customerId}
                </p>
                {transaction.customer?.email && (
                  <p className="text-xs text-slate-500">{transaction.customer.email}</p>
                )}
                {transaction.customer?.phone && (
                  <p className="text-xs text-slate-500">{transaction.customer.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="rounded-2xl border border-slate-200 p-4 space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-slate-400">
              Technical Details
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-slate-400">Service Code</span>
                <p className="font-medium text-slate-800 font-mono text-[11px]">
                  {transaction.serviceCode || 'MANUAL_GRANT'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">Wallet ID</span>
                <p className="font-medium text-slate-800">
                  #{transaction.walletId || '—'}
                </p>
              </div>
              {transaction.generationId && (
                <div className="space-y-1">
                  <span className="text-slate-400">Generation ID</span>
                  <p className="font-medium text-slate-800 font-mono">
                    #{transaction.generationId}
                  </p>
                </div>
              )}
              {transaction.paymentId && (
                <div className="space-y-1">
                  <span className="text-slate-400">Payment ID</span>
                  <p className="font-medium text-slate-800 font-mono truncate">
                    {transaction.paymentId}
                  </p>
                </div>
              )}
            </div>

            {transaction.notes && (
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="text-slate-400">Audit Notes / Reason</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                  {transaction.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
