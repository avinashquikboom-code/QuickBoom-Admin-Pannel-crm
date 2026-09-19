'use client';

import React from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export interface PaymentReceiptData {
  receiptNumber: string;
  receiptDate?: string | Date;
  customer: {
    id?: number | string;
    name: string;
    email?: string;
    phone?: string;
    businessName?: string;
  };
  transaction: {
    mode?: string;
    ref?: string;
    orderRef?: string;
    status?: string;
    paymentDate?: string | Date;
  };
  plan: {
    name: string;
    billingCycle?: string;
    notes?: string;
  };
  pricing: {
    baseAmount: number;
    taxAmount: number;
    totalAmount: number;
    cgst?: number;
    sgst?: number;
  };
}

interface PaymentReceiptProps {
  data: PaymentReceiptData;
  className?: string;
}

export default function PaymentReceipt({ data, className = '' }: PaymentReceiptProps) {
  const { customer, transaction, plan, pricing } = data;

  const receiptDateFormatted = data.receiptDate
    ? formatDate(data.receiptDate)
    : formatDate(new Date());

  const baseAmt = Number(pricing.baseAmount || 0);
  const taxAmt = Number(pricing.taxAmount || 0);
  const totalAmt = Number(pricing.totalAmount || baseAmt + taxAmt);
  const cgstAmt = pricing.cgst !== undefined ? Number(pricing.cgst) : taxAmt / 2;
  const sgstAmt = pricing.sgst !== undefined ? Number(pricing.sgst) : taxAmt / 2;

  const paymentModeLabel = transaction.mode
    ? (transaction.mode.toUpperCase() === 'OFFLINE' || transaction.mode.toUpperCase() === 'CASH' || transaction.mode.toUpperCase() === 'BANK_TRANSFER'
        ? 'Offline / Cash (Admin Approved)'
        : transaction.mode.toUpperCase() === 'RAZORPAY' || transaction.mode.toUpperCase() === 'ONLINE'
        ? 'Online (Razorpay Verified)'
        : transaction.mode)
    : 'Online (Razorpay Verified)';

  const paymentStatus = transaction.status || 'CONFIRMED (PAID)';

  return (
    <div
      className={`receipt w-full max-w-[900px] mx-auto bg-white text-slate-900 font-sans p-6 sm:p-8 md:p-10 rounded-2xl border border-slate-200/90 shadow-sm print:p-0 print:border-none print:shadow-none print:max-w-none ${className}`}
      style={{ boxSizing: 'border-box' }}
    >
      <style jsx global>{`
        @page {
          size: A4;
          margin: 10mm;
        }
        @media print {
          body {
            margin: 0;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .no-print {
            display: none !important;
          }
          .receipt {
            width: 100% !important;
            max-width: none !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER: Company Info & Receipt Header                 */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-200">
        {/* Left: Company Details */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-base shadow-sm">
              QB
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight">
              QUIKBOOM CRM
            </h1>
          </div>
          <div className="text-xs sm:text-[13px] text-slate-500 font-medium leading-relaxed">
            <p className="font-semibold text-slate-800">QuikBoom Marketing Solutions Pvt Ltd</p>
            <p>Dynasty Business Park, Andheri-Kurla Road, Mumbai, Maharashtra 400059</p>
            <p className="text-[11px] text-slate-500 pt-0.5">
              GSTIN: <span className="font-mono font-bold text-slate-700">27AABCT3518Q1Z4</span> | PAN: <span className="font-mono font-bold text-slate-700">AABCT3518Q</span> | State: 27 (MH)
            </p>
          </div>
        </div>

        {/* Right: Receipt Meta */}
        <div className="text-left md:text-right space-y-1 shrink-0 pt-2 md:pt-0">
          <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-900 text-xs font-black tracking-wider uppercase">
            PAYMENT RECEIPT
          </span>
          <p className="font-mono font-bold text-emerald-600 text-sm sm:text-base tracking-wide">
            {data.receiptNumber}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Customer Voucher Copy</p>
          <p className="text-xs text-slate-600 font-semibold">
            Receipt Date: <span className="font-bold text-slate-900">{receiptDateFormatted}</span>
          </p>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. CUSTOMER & TRANSACTION DETAILS (Balanced 2-Column Grid)    */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 py-6 border-b border-slate-200">
        {/* Left Column: PAID BY CUSTOMER */}
        <div className="bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
              PAID BY CUSTOMER
            </h2>
            <p className="text-sm sm:text-base font-bold text-slate-900 break-words">
              {customer.name || 'Valued Customer'}
            </p>
            {customer.businessName && (
              <p className="text-xs font-semibold text-slate-700 mt-0.5 break-words">
                {customer.businessName}
              </p>
            )}
          </div>
          <div className="space-y-1 text-xs text-slate-600 border-t border-slate-200/60 pt-2.5">
            <p className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Email:</span>
              <span className="font-medium text-slate-900 break-all text-right">{customer.email || 'N/A'}</span>
            </p>
            <p className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Phone:</span>
              <span className="font-medium text-slate-900 text-right">{customer.phone || 'N/A'}</span>
            </p>
            {customer.id && (
              <p className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Customer ID:</span>
                <span className="font-mono font-bold text-slate-800 text-right">#{customer.id}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Column: TRANSACTION DETAILS */}
        <div className="bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
              TRANSACTION DETAILS
            </h2>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="break-words">{paymentModeLabel}</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-200/60 pt-2.5">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <span className="text-slate-500 shrink-0">Transaction Ref:</span>
              <span
                className="font-mono font-bold text-slate-900 text-left sm:text-right"
                style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
              >
                {transaction.ref || 'N/A'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <span className="text-slate-500 shrink-0">Order Reference:</span>
              <span
                className="font-mono font-bold text-slate-900 text-left sm:text-right"
                style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
              >
                {transaction.orderRef || '#QB-ORD'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-slate-500">Payment Status:</span>
              <span className="inline-flex items-center gap-1 font-black text-[11px] text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full uppercase">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {paymentStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. ITEM / PLAN DESCRIPTION TABLE                              */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="py-6 border-b border-slate-200">
        {/* Desktop / Tablet Table View */}
        <div className="hidden sm:block overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Item / Plan Description</th>
                <th className="py-3 px-4">Billing Cycle</th>
                <th className="py-3 px-4 text-right">Base Amount</th>
                <th className="py-3 px-4 text-right">Tax (18%)</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 text-center text-slate-500 font-bold">1</td>
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  <div className="text-[13px]">{plan.name || 'Subscription Plan'}</div>
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                    Receipt Ref: {data.receiptNumber} • Installment Settlement
                  </div>
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-700 uppercase">
                  {plan.billingCycle || 'Monthly'}
                </td>
                <td className="py-3.5 px-4 text-right font-semibold text-slate-800 whitespace-nowrap">
                  {formatCurrency(baseAmt)}
                </td>
                <td className="py-3.5 px-4 text-right font-semibold text-slate-800 whitespace-nowrap">
                  {formatCurrency(taxAmt)}
                </td>
                <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm whitespace-nowrap">
                  {formatCurrency(totalAmt)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile View: Stacked Card */}
        <div className="sm:hidden bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-start justify-between gap-2 border-b border-slate-200/80 pb-2.5">
            <div>
              <p className="font-bold text-slate-900 text-sm">{plan.name || 'Subscription Plan'}</p>
              <p className="text-[11px] text-slate-500">Ref: {data.receiptNumber}</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold uppercase shrink-0">
              {plan.billingCycle || 'Monthly'}
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Base Amount:</span>
              <span className="font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(baseAmt)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax (GST 18%):</span>
              <span className="font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(taxAmt)}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-200">
              <span>Amount Paid:</span>
              <span className="text-emerald-700 whitespace-nowrap">{formatCurrency(totalAmt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 4. TAX SUMMARY & PAYMENT SUMMARY (Balanced 2-Column Grid)     */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 py-6 border-b border-slate-200">
        {/* Left Box: Tax Summary */}
        <div className="bg-slate-50/80 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-3">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-700 pb-1.5 border-b border-slate-200">
            TAX SUMMARY (GST 18%)
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>CGST (9.0%):</span>
              <span className="font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(cgstAmt)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>SGST (9.0%):</span>
              <span className="font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(sgstAmt)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200/60">
              <span>Total Tax Component:</span>
              <span className="whitespace-nowrap">{formatCurrency(taxAmt)}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-200 text-[11px] font-black text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Payment Status: Confirmed & Received</span>
          </div>
        </div>

        {/* Right Box: Payment Summary */}
        <div className="bg-slate-50/80 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-3">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-700 pb-1.5 border-b border-slate-200">
            PAYMENT SUMMARY
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Base Amount:</span>
              <span className="font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(baseAmt)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax Amount (18%):</span>
              <span className="font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(taxAmt)}</span>
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-300">
              <span className="font-black text-xs sm:text-sm text-emerald-800">Amount Received:</span>
              <span className="font-black text-base sm:text-lg text-emerald-600 whitespace-nowrap">
                {formatCurrency(totalAmt)}
              </span>
            </div>
            <div className="flex justify-between text-[11px] pt-1">
              <span className="text-slate-500">Voucher Type:</span>
              <span className="font-black text-emerald-700 uppercase tracking-wide">
                OFFICIAL RECEIPT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 5. VERIFICATION STAMP & AUTHORIZED SIGNATORY                 */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-6 border-b border-slate-200">
        {/* Paid Stamp Badge */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300/80 shadow-xs self-start sm:self-auto">
          <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
          <div>
            <p className="font-black text-base leading-none text-emerald-800 tracking-wider">
              PAID
            </p>
            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
              Official Payment Receipt • Verified
            </p>
          </div>
        </div>

        {/* Authorized Signatory */}
        <div className="text-left sm:text-right space-y-1 w-full sm:w-auto">
          <p className="font-bold text-xs sm:text-sm text-slate-900">
            For QuikBoom Marketing Solutions Pvt Ltd
          </p>
          <div className="h-6 sm:h-8"></div>
          <p className="text-xs font-semibold text-slate-500 border-t border-slate-300 pt-1 inline-block min-w-[160px] text-center sm:text-right">
            Authorized Signatory
          </p>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 6. NOTES & FOOTER                                            */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="pt-5 text-center space-y-1.5 text-[11px] text-slate-500">
        <p className="leading-relaxed">
          <strong>Note:</strong> This is a computer-generated payment voucher confirming receipt of payment. Final Tax Invoice will be issued upon completion of 100% full plan payment.
        </p>
        <p className="font-medium text-slate-600 pt-1">
          QuikBoom CRM • Support: <a href="mailto:support@quikboom.com" className="text-emerald-700 underline">support@quikboom.com</a> • <a href="https://quikboom.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline">https://quikboom.com</a>
        </p>
      </div>
    </div>
  );
}
