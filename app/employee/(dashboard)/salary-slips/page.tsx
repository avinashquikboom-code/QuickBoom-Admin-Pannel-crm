'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  FileText,
  Download,
  Eye,
  RefreshCw,
  CalendarCheck,
  Building2,
  CreditCard,
  User,
  ChevronDown,
  ChevronUp,
  Printer,
  X,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import api from '@/lib/api';
import { useEmployeeAuthStore } from '@/lib/employee-store';
import { toast } from 'react-hot-toast';
import EmployeeSideSheet from '@/components/EmployeeSideSheet';

// ── Formatting Utilities ─────────────────────────────────────────────────────

function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const parts = abs.toFixed(2).split('.');
  const intPart = parts[0];
  const decPart = parts[1];
  let formattedInt = intPart;
  if (intPart.length > 3) {
    const lastThree = intPart.substring(intPart.length - 3);
    const rest = intPart.substring(0, intPart.length - 3);
    const formattedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedInt = `${formattedRest},${lastThree}`;
  }
  return `${isNegative ? '-' : ''}₹${formattedInt}.${decPart}`;
}

function formatDisplayDate(raw?: string | null): string {
  if (!raw || !raw.trim()) return '—';
  try {
    const dt = new Date(raw.trim());
    if (isNaN(dt.getTime())) return raw;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
  } catch {
    return raw;
  }
}

function maskAccountNumber(raw?: string | null): string {
  if (!raw || !raw.trim()) return '—';
  const clean = raw.trim();
  if (clean.length <= 4) return clean;
  const last4 = clean.substring(clean.length - 4);
  return `XXXX XXXX ${last4}`;
}

// ── Interface ────────────────────────────────────────────────────────────────

interface SalarySlipItem {
  id: string;
  month: string;
  year?: number;
  date: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  specialAllowance: number;
  commission: number;
  overtime: number;
  bonus: number;
  reimbursement: number;
  grossSalary: number;
  pf: number;
  esi: number;
  professionalTax: number;
  tds: number;
  otherDeductions: number;
  loanDeduction: number;
  unpaidLeaveDeduction: number;
  deductions: number;
  netSalary: number;
  status: string;
  downloadUrl?: string;
  slipNumber?: string;
  paymentMode?: string;
  paymentReference?: string;
  workingDays?: number;
  presentDays?: number;
  paidLeaves?: number;
  unpaidLeaves?: number;
  bankDetails?: Record<string, any>;
  employeeDetails?: Record<string, any>;
  payrollItem?: Record<string, any>;
}

export default function SalarySlipsPage() {
  const user = useEmployeeAuthStore((state) => state.user);
  const token = useEmployeeAuthStore((state) => state.token);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [slips, setSlips] = useState<SalarySlipItem[]>([]);
  const [profile, setProfile] = useState<any>(null);

  // Collapsible cards state
  const [isEmployeeInfoExpanded, setIsEmployeeInfoExpanded] = useState(true);
  const [isBankDetailsExpanded, setIsBankDetailsExpanded] = useState(true);

  // View modal state
  const [selectedSlip, setSelectedSlip] = useState<SalarySlipItem | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (isManualRefresh = false) => {
      if (!token) return;
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const authHeader = { headers: { Authorization: `Bearer ${token}` } };

        const [slipsRes, profRes] = await Promise.allSettled([
          api.get('/admin/payroll/slips', authHeader),
          api.get('/employees/profile/me', authHeader),
        ]);

        if (profRes.status === 'fulfilled') {
          const val = profRes.value as any;
          setProfile(val?.data?.data || val?.data || val);
        }

        if (slipsRes.status === 'fulfilled') {
          const val = slipsRes.value as any;
          const rawData = val?.data?.data || val?.data?.slips || val?.data?.items || val?.data || (Array.isArray(val) ? val : []);
          const list: any[] = Array.isArray(rawData) ? rawData : [];

          const parsedSlips: SalarySlipItem[] = list.map((item: any) => {
            const pi = item.payrollItem || {};
            const net = Number(item.netSalary ?? pi.netSalary ?? 0);
            const gross = Number(item.grossSalary ?? pi.grossSalary ?? net);
            const deduct = Number(item.totalDeductions ?? item.deductions ?? pi.totalDeductions ?? 0);
            const basic = Number(pi.basicSalary ?? item.basicSalary ?? 0);
            const hra = Number(pi.hra ?? item.hra ?? 0);
            const allow = Number(pi.allowances ?? item.allowances ?? 0);
            const special = Number(pi.specialAllowance ?? item.specialAllowance ?? 0);
            const comm = Number(pi.commission ?? item.commission ?? 0);
            const ovt = Number(pi.overtime ?? item.overtime ?? 0);
            const bon = Number(pi.bonus ?? item.bonus ?? 0);
            const reimb = Number(pi.reimbursement ?? item.reimbursement ?? 0);
            const pf = Number(pi.pf ?? item.pf ?? 0);
            const esi = Number(pi.esi ?? item.esi ?? 0);
            const pt = Number(pi.professionalTax ?? item.professionalTax ?? 0);
            const tds = Number(pi.tds ?? item.tds ?? 0);
            const otherDed = Number(pi.otherDeductions ?? item.otherDeductions ?? 0);
            const loanDed = Number(pi.loanDeduction ?? item.loanDeduction ?? 0);
            const unpaidLeaveDed = Number(pi.unpaidLeaveDeduction ?? item.unpaidLeaveDeduction ?? 0);

            const emp = item.employee || null;
            const bDetails = item.bankDetails || emp?.bankDetails || null;
            const slipNum = item.slipNumber?.toString();
            const pMode = item.paymentMode || item.paymentMethod || pi.paymentMode || 'Bank Transfer';
            const pRef = item.paymentReference || item.transactionId || slipNum || '—';

            return {
              id: String(item.id || ''),
              month: String(item.payPeriod || item.monthName || item.month || 'Current Month'),
              year: item.year ? Number(item.year) : undefined,
              date: String(item.generatedAt || item.date || item.createdAt || ''),
              basicSalary: basic,
              hra,
              allowances: allow,
              specialAllowance: special,
              commission: comm,
              overtime: ovt,
              bonus: bon,
              reimbursement: reimb,
              grossSalary: gross,
              pf,
              esi,
              professionalTax: pt,
              tds,
              otherDeductions: otherDed,
              loanDeduction: loanDed,
              unpaidLeaveDeduction: unpaidLeaveDed,
              deductions: deduct,
              netSalary: net,
              status: String(item.status || 'PAID'),
              downloadUrl: item.pdfUrl || item.downloadUrl,
              slipNumber: slipNum,
              paymentMode: pMode,
              paymentReference: pRef,
              workingDays: pi.workingDays,
              presentDays: pi.presentDays,
              paidLeaves: pi.paidLeaveDays || pi.paidLeaves,
              unpaidLeaves: pi.unpaidLeaveDays || pi.unpaidLeaves,
              bankDetails: bDetails,
              employeeDetails: emp,
              payrollItem: pi,
            };
          });

          setSlips(parsedSlips);
        } else {
          // If the backend request failed
          console.warn('Could not load salary slips:', slipsRes.reason);
          setError('Unable to load salary information.');
        }
      } catch (err: any) {
        console.error('Fetch salary slips error:', err);
        setError('Unable to load salary information.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const latestSlip = useMemo(() => (slips.length > 0 ? slips[0] : null), [slips]);

  // ── PDF Generation & Download ──────────────────────────────────────────────
  const handleDownloadPdf = async (slip: SalarySlipItem) => {
    setIsDownloadingPdf(true);
    const toastId = toast.loading(`Generating salary slip PDF for ${slip.month}...`);

    try {
      // 1. Try server official PDF stream first
      try {
        const authHeader = {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob' as const,
        };
        const res = await api.get(`/admin/payroll/slips/${slip.id}/pdf`, authHeader);
        if (res.data) {
          const blob = new Blob([res.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const safeFilename = `salary_slip_${slip.month.replace(/[\/\\:*?"<>| ]+/g, '_')}.pdf`;
          link.download = safeFilename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success('Salary slip downloaded successfully', { id: toastId });
          setIsDownloadingPdf(false);
          return;
        }
      } catch (_) {
        // Fallback to client-side branded PDF generation
      }

      // If direct download url is given, open it
      if (slip.downloadUrl && slip.downloadUrl.startsWith('http')) {
        window.open(slip.downloadUrl, '_blank');
        toast.success('Salary slip downloaded successfully', { id: toastId });
        setIsDownloadingPdf(false);
        return;
      }

      // 2. Client-side branded PDF generation using jsPDF + jspdf-autotable
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Brand Header Banner
      doc.setFillColor(15, 118, 62); // Emerald Primary #0F763E
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('QUICKBOOM BUSINESS SUITE', 14, 12);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(220, 252, 231);
      doc.text('OFFICIAL SALARY & PAYROLL SLIP', 14, 18);
      doc.text(`Pay Period: ${slip.month}`, 14, 23);

      doc.setFontSize(8);
      doc.text(`Slip No: ${slip.slipNumber || slip.id || 'N/A'}`, pageWidth - 14, 12, { align: 'right' });
      doc.text(`Disbursed On: ${formatDisplayDate(slip.date)}`, pageWidth - 14, 18, { align: 'right' });
      doc.text(`Status: ${(slip.status || 'PAID').toUpperCase()}`, pageWidth - 14, 23, { align: 'right' });

      // Employee Information Section
      let cursorY = 36;
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('EMPLOYEE & DISBURSEMENT DETAILS', 14, cursorY);

      cursorY += 4;
      const empName = profile?.name || (profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : user?.firstName || 'Employee');
      const empCode = profile?.employeeCode || (user as any)?.employeeCode || 'EMP-004';
      const desig = profile?.designation?.name || profile?.designation || (user as any)?.designation || 'Telesales Executive';
      const dept = profile?.department?.name || profile?.department || (user as any)?.department || 'BPO Call Center';
      const joinDate = formatDisplayDate(profile?.joiningDate || (user as any)?.joiningDate);
      const bDetails = slip.bankDetails || profile?.bankDetails;
      const bankName = bDetails?.bankName || '—';
      const accNo = maskAccountNumber(bDetails?.accountNumber);
      const pMode = slip.paymentMode || 'Bank Transfer';

      autoTable(doc, {
        startY: cursorY,
        theme: 'plain',
        styles: { fontSize: 8.5, cellPadding: 2, textColor: [51, 65, 85] },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 35 },
          1: { cellWidth: 55 },
          2: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 35 },
          3: { cellWidth: 55 },
        },
        body: [
          ['Employee Name:', empName, 'Joining Date:', joinDate],
          ['Employee ID:', empCode, 'Employment Type:', profile?.employmentType || 'Full-Time'],
          ['Designation:', String(desig), 'Payment Mode:', pMode],
          ['Department:', String(dept), 'Bank Name:', bankName],
          ['Payment Ref:', slip.paymentReference || '—', 'Account No:', accNo],
        ],
      });

      cursorY = (doc as any).lastAutoTable.finalY + 8;

      // Earnings & Deductions Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('SALARY BREAKDOWN', 14, cursorY);

      cursorY += 4;

      const earningsItems = [
        ['Basic Salary', formatCurrency(slip.basicSalary)],
        ['HRA Allowance', formatCurrency(slip.hra)],
        ['Allowances & Special', formatCurrency(slip.allowances + slip.specialAllowance)],
        ...(slip.commission > 0 ? [['Earned Commission', formatCurrency(slip.commission)]] : []),
        ...(slip.reimbursement > 0 ? [['Expense Reimbursement', formatCurrency(slip.reimbursement)]] : []),
      ];

      const deductionsItems = [
        ['Provident Fund (PF)', formatCurrency(slip.pf)],
        ['ESI Contribution', formatCurrency(slip.esi)],
        ['TDS / Income Tax', formatCurrency(slip.tds)],
        ...(slip.loanDeduction > 0 ? [['Loan EMI Deduction', formatCurrency(slip.loanDeduction)]] : []),
        ...(slip.unpaidLeaveDeduction > 0 ? [['Loss of Pay (LOP)', formatCurrency(slip.unpaidLeaveDeduction)]] : []),
      ];

      const maxRows = Math.max(earningsItems.length, deductionsItems.length);
      const combinedBody: string[][] = [];

      for (let i = 0; i < maxRows; i++) {
        const earn = earningsItems[i] || ['', ''];
        const ded = deductionsItems[i] || ['', ''];
        combinedBody.push([earn[0], earn[1], ded[0], ded[1]]);
      }

      // Append distinct totals row as the final row
      combinedBody.push([
        'Total Gross Salary',
        formatCurrency(slip.grossSalary),
        'Total Deductions',
        formatCurrency(slip.deductions),
      ]);

      autoTable(doc, {
        startY: cursorY,
        theme: 'grid',
        head: [['EARNINGS', 'AMOUNT', 'DEDUCTIONS', 'AMOUNT']],
        headStyles: {
          fillColor: [15, 118, 62],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
        },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
          2: { cellWidth: 55 },
          3: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] },
        },
        body: combinedBody,
        didParseCell: (data) => {
          if (data.row.index === combinedBody.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 245, 249];
          }
        },
      });

      cursorY = (doc as any).lastAutoTable.finalY + 8;

      // Net Payable Banner in PDF
      doc.setFillColor(232, 249, 238);
      doc.roundedRect(14, cursorY, pageWidth - 28, 18, 3, 3, 'F');
      doc.setDrawColor(35, 196, 94);
      doc.roundedRect(14, cursorY, pageWidth - 28, 18, 3, 3, 'D');

      doc.setTextColor(21, 128, 61);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('NET PAYABLE (TAKE HOME SALARY)', 20, cursorY + 7);

      doc.setFontSize(14);
      doc.text(formatCurrency(slip.netSalary), 20, cursorY + 14);

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Confidential Document — Generated electronically by QB Suite', pageWidth - 20, cursorY + 11, { align: 'right' });

      // Save PDF
      const safeFilename = `salary_slip_${slip.month.replace(/[\/\\:*?"<>| ]+/g, '_')}.pdf`;
      doc.save(safeFilename);

      toast.success('Salary slip downloaded successfully', { id: toastId });
    } catch (err: any) {
      console.error('PDF export error:', err);
      toast.error('Unable to download salary slip PDF.', { id: toastId });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── 1. Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-emerald-100 text-[#16A34A] flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-5 h-5 text-[#16A34A]" />
            </span>
            Salary Slips & Payroll
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            View your monthly salary slips, payroll details and payment information.
          </p>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={refreshing || loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-60"
          title="Refresh salary information"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* ── Error State ────────────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <h3 className="font-bold text-sm text-rose-900">Unable to load salary information.</h3>
              <p className="text-xs text-rose-700 mt-0.5">Please check your network connection or try again.</p>
            </div>
          </div>
          <button
            onClick={() => fetchData(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── Loading Skeleton State ─────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          {/* Hero Skeleton */}
          <div className="w-full h-64 rounded-3xl bg-slate-200/80" />
          {/* Button Row Skeleton */}
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 rounded-xl bg-slate-200/80" />
            <div className="h-12 rounded-xl bg-slate-200/80" />
          </div>
          {/* 2-col info cards Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-60 rounded-2xl bg-slate-200/80" />
            <div className="h-60 rounded-2xl bg-slate-200/80" />
          </div>
          {/* History table Skeleton */}
          <div className="h-64 rounded-2xl bg-slate-200/80" />
        </div>
      ) : slips.length === 0 ? (
        /* ── Empty State ────────────────────────────────────────────────────── */
        <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#16A34A] mx-auto flex items-center justify-center mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900">No Salary Slips Available</h3>
          <p className="text-sm font-medium text-slate-500 max-w-md mx-auto mt-1.5">
            Your monthly salary slips will appear here once payroll is processed.
          </p>
        </div>
      ) : (
        <>
          {/* ── 2. Latest Salary Slip — Hero Card ───────────────────────────── */}
          {latestSlip && (
            <div className="w-full p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0F763E] via-[#128843] to-[#16A34A] text-white shadow-xl shadow-emerald-900/15 relative overflow-hidden">
              {/* Subtle background decoration */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none blur-xl" />
              <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-black/5 pointer-events-none blur-2xl" />

              <div className="relative z-10">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-extrabold tracking-widest text-emerald-100/90 uppercase">
                      LATEST SALARY SLIP
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5 tracking-tight">
                      {latestSlip.month}
                    </h2>
                  </div>

                  <span className="px-3 py-1 rounded-lg bg-white/20 border border-white/25 text-white text-xs font-black tracking-wider uppercase backdrop-blur-xs">
                    [{latestSlip.status || 'PAID'}]
                  </span>
                </div>

                {/* Net Payable Highlight */}
                <div className="mt-6 sm:mt-7">
                  <span className="text-xs sm:text-sm font-medium text-emerald-100/90 block">Net Payable</span>
                  <div className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-1">
                    {formatCurrency(latestSlip.netSalary)}
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-emerald-100/90 mt-2">
                    <CalendarCheck className="w-4 h-4 text-emerald-200" />
                    <span>Disbursed on: {formatDisplayDate(latestSlip.date)}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/20 my-6" />

                {/* Bottom Summary Boxes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white/12 backdrop-blur-xs rounded-xl p-3 sm:p-3.5 border border-white/10">
                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-100/90 uppercase tracking-wider block truncate">
                      Basic
                    </span>
                    <p className="text-sm sm:text-base font-black text-white mt-1 truncate">
                      {formatCurrency(latestSlip.basicSalary)}
                    </p>
                  </div>

                  <div className="bg-white/12 backdrop-blur-xs rounded-xl p-3 sm:p-3.5 border border-white/10">
                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-100/90 uppercase tracking-wider block truncate">
                      Allowances
                    </span>
                    <p className="text-sm sm:text-base font-black text-white mt-1 truncate">
                      {formatCurrency(latestSlip.allowances + latestSlip.specialAllowance)}
                    </p>
                  </div>

                  <div className="bg-white/12 backdrop-blur-xs rounded-xl p-3 sm:p-3.5 border border-white/10">
                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-100/90 uppercase tracking-wider block truncate">
                      Reimbursement
                    </span>
                    <p className="text-sm sm:text-base font-black text-white mt-1 truncate">
                      {formatCurrency(latestSlip.reimbursement)}
                    </p>
                  </div>

                  <div className="bg-white/12 backdrop-blur-xs rounded-xl p-3 sm:p-3.5 border border-white/10">
                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-100/90 uppercase tracking-wider block truncate">
                      Total Deductions
                    </span>
                    <p className="text-sm sm:text-base font-black text-white mt-1 truncate">
                      {formatCurrency(latestSlip.deductions)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 3. Action Buttons ───────────────────────────────────────────── */}
          {latestSlip && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary: View Salary Slip */}
              <button
                type="button"
                onClick={() => setSelectedSlip(latestSlip)}
                className="h-12 w-full px-6 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-sm shadow-emerald-600/20 hover:shadow-md transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4 text-white" />
                <span>View Salary Slip</span>
              </button>

              {/* Secondary: Download PDF */}
              <button
                type="button"
                onClick={() => handleDownloadPdf(latestSlip)}
                disabled={isDownloadingPdf}
                className="h-12 w-full px-6 rounded-xl bg-white hover:bg-emerald-50 border-2 border-[#16A34A] text-[#16A34A] font-bold text-sm flex items-center justify-center gap-2.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                <Download className="w-4 h-4 text-[#16A34A]" />
                <span>Download PDF</span>
              </button>
            </div>
          )}

          {/* ── 4 & 5. Employee Info + Bank & Payment (Desktop 2-Col) ────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 4. Employee Information Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setIsEmployeeInfoExpanded((prev) => !prev)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 truncate">Employee Information</h3>
                </div>
                <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  {isEmployeeInfoExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {isEmployeeInfoExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-xs pt-3">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Employee Name
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate" title={profile?.name || user?.firstName}>
                        {profile?.name || (profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : `${user?.firstName || ''} ${user?.lastName || ''}`.trim()) || '—'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Joining Date
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">
                        {formatDisplayDate(profile?.joiningDate || (user as any)?.joiningDate)}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Employee ID
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-[#16A34A] mt-0.5 truncate">
                        {profile?.employeeCode || (user as any)?.employeeCode || (user as any)?.employee?.employeeCode || 'EMP-004'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Employment Type
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 uppercase truncate">
                        {profile?.employmentType || 'FULL_TIME'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Designation
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 uppercase truncate" title={profile?.designation?.name || profile?.designation}>
                        {profile?.designation?.name || profile?.designation || (user as any)?.designation || 'TELESALES EXECUTIVE'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Location
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 uppercase truncate" title={profile?.branch || 'Head Office'}>
                        {profile?.branch || (user as any)?.branch || 'QUIKBOOM MARKETING'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Department
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 uppercase truncate" title={profile?.department?.name || profile?.department}>
                        {profile?.department?.name || profile?.department || (user as any)?.department || 'BPO CALL CENTER'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Reporting Manager
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">
                        {profile?.manager || profile?.reportingManager || 'Direct Reporting'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Bank & Payment Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setIsBankDetailsExpanded((prev) => !prev)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 truncate">Bank & Payment Details</h3>
                </div>
                <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  {isBankDetailsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {isBankDetailsExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-xs pt-3">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Payment Mode
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">
                        {latestSlip?.paymentMode || 'Bank Transfer'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Bank Name
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">
                        {latestSlip?.bankDetails?.bankName || profile?.bankDetails?.bankName || '—'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Account Number
                      </span>
                      <p className="text-xs sm:text-sm font-mono font-bold text-slate-900 mt-0.5 truncate">
                        {maskAccountNumber(latestSlip?.bankDetails?.accountNumber || profile?.bankDetails?.accountNumber)}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        IFSC Code
                      </span>
                      <p className="text-xs sm:text-sm font-mono font-bold text-slate-900 mt-0.5 truncate">
                        {latestSlip?.bankDetails?.ifscCode || profile?.bankDetails?.ifscCode || '—'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Payment Reference
                      </span>
                      <p className="text-xs sm:text-sm font-mono font-bold text-slate-900 mt-0.5 truncate" title={latestSlip?.paymentReference}>
                        {latestSlip?.paymentReference || latestSlip?.slipNumber || 'SLIP-202610-0013'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Disbursement Date
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 truncate">
                        {formatDisplayDate(latestSlip?.date)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 6. Payslip History ──────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Payslip History</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  View and download your monthly salary slips
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                {slips.length} {slips.length === 1 ? 'Slip' : 'Slips'}
              </span>
            </div>

            {/* Desktop Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Month</th>
                    <th className="px-5 py-3.5">Disbursement Date</th>
                    <th className="px-5 py-3.5">Net Payable</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {slips.map((slip) => {
                    const statusText = (slip.status || 'PAID').toUpperCase();
                    const isPaid = statusText.includes('PAID');

                    return (
                      <tr key={slip.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-bold text-slate-900 text-sm block">{slip.month}</span>
                          <span className="text-[11px] font-mono text-slate-400 mt-0.5 block">
                            {slip.slipNumber || `SLIP-${slip.id.slice(0, 8)}`}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <CalendarCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formatDisplayDate(slip.date)}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-black text-slate-900">
                            {formatCurrency(slip.netSalary)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              isPaid
                                ? 'bg-emerald-50 text-[#1AA14D] border-emerald-200/60'
                                : 'bg-amber-50 text-amber-700 border-amber-200/60'
                            }`}
                          >
                            {statusText}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedSlip(slip)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#1AA14D] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="View slip details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(slip)}
                              disabled={isDownloadingPdf}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 text-slate-500 hover:text-[#1AA14D] hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── 7. Detailed Salary Slip Drawer ───────────────────────────────────── */}
      <EmployeeSideSheet
        open={!!selectedSlip}
        onClose={() => setSelectedSlip(null)}
        title={selectedSlip ? `Payslip for ${selectedSlip.month}` : 'Official Salary Slip'}
        subtitle={selectedSlip ? `Slip No: ${selectedSlip.slipNumber || selectedSlip.id}` : undefined}
        icon={<FileText className="w-5 h-5" />}
        maxWidthClass="sm:max-w-[560px] md:max-w-[640px]"
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelectedSlip(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs cursor-pointer transition-colors"
            >
              Close
            </button>

            {selectedSlip && (
              <button
                type="button"
                onClick={() => handleDownloadPdf(selectedSlip)}
                disabled={isDownloadingPdf}
                className="px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span>Download PDF</span>
              </button>
            )}
          </>
        }
      >
        {selectedSlip && (
          <div className="space-y-5 text-xs">
            {/* Employee Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Employee</span>
                <p className="font-bold text-slate-900 truncate">
                  {profile?.name || (profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : user?.firstName || 'Employee')}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase">ID</span>
                <p className="font-bold text-[#16A34A] truncate">
                  {profile?.employeeCode || (user as any)?.employeeCode || 'EMP-004'}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Designation</span>
                <p className="font-bold text-slate-900 truncate">
                  {profile?.designation?.name || profile?.designation || (user as any)?.designation || 'Telesales Executive'}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Disbursed</span>
                <p className="font-bold text-slate-900 truncate">
                  {formatDisplayDate(selectedSlip.date)}
                </p>
              </div>
            </div>

            {/* Salary Breakdown Table */}
            {(() => {
              const earningsItems: [string, number][] = [
                ['Basic Salary', selectedSlip.basicSalary || 0],
                ['HRA Allowance', selectedSlip.hra || 0],
                ['Allowances & Special', (selectedSlip.allowances || 0) + (selectedSlip.specialAllowance || 0)],
              ];
              if (selectedSlip.commission > 0) earningsItems.push(['Earned Commission', selectedSlip.commission]);
              if (selectedSlip.reimbursement > 0) earningsItems.push(['Expense Reimbursement', selectedSlip.reimbursement]);

              const deductionsItems: [string, number][] = [
                ['Provident Fund (PF)', selectedSlip.pf || 0],
                ['ESI Contribution', selectedSlip.esi || 0],
                ['TDS / Income Tax', selectedSlip.tds || 0],
              ];
              if (selectedSlip.loanDeduction > 0) deductionsItems.push(['Loan EMI Deduction', selectedSlip.loanDeduction]);
              if (selectedSlip.unpaidLeaveDeduction > 0) deductionsItems.push(['Loss of Pay (LOP)', selectedSlip.unpaidLeaveDeduction]);

              const maxRows = Math.max(earningsItems.length, deductionsItems.length);

              return (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#0F763E] text-white">
                          <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[11px] w-[30%]">EARNINGS</th>
                          <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[11px] text-right w-[20%]">AMOUNT</th>
                          <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[11px] w-[30%] border-l border-emerald-700/60">DEDUCTIONS</th>
                          <th className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[11px] text-right w-[20%]">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {Array.from({ length: maxRows }).map((_, idx) => {
                          const earn = earningsItems[idx];
                          const ded = deductionsItems[idx];
                          return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                              <td className="py-2.5 px-3.5 text-slate-700 font-medium">{earn ? earn[0] : ''}</td>
                              <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 whitespace-nowrap tabular-nums">
                                {earn ? formatCurrency(earn[1]) : ''}
                              </td>
                              <td className="py-2.5 px-3.5 text-slate-700 font-medium border-l border-slate-100">{ded ? ded[0] : ''}</td>
                              <td className="py-2.5 px-3.5 text-right font-bold text-rose-600 whitespace-nowrap tabular-nums">
                                {ded ? formatCurrency(ded[1]) : ''}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Totals Row */}
                        <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-200">
                          <td className="py-2.5 px-3.5 text-slate-900 font-black">Total Gross Salary</td>
                          <td className="py-2.5 px-3.5 text-right font-black text-slate-900 whitespace-nowrap tabular-nums">
                            {formatCurrency(selectedSlip.grossSalary)}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-900 font-black border-l border-slate-200">Total Deductions</td>
                          <td className="py-2.5 px-3.5 text-right font-black text-rose-600 whitespace-nowrap tabular-nums">
                            {formatCurrency(selectedSlip.deductions)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Net Payable Section */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#E8F9EE] border border-[#86EFAC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <span className="text-[11px] font-black uppercase text-[#15803D] tracking-wider block">
                        NET PAYABLE (TAKE HOME SALARY)
                      </span>
                      <p className="text-2xl sm:text-3xl font-black text-[#15803D] mt-0.5 tabular-nums">
                        {formatCurrency(selectedSlip.netSalary)}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                        Confidential Document — Generated electronically by QB Suite
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </EmployeeSideSheet>

    </div>
  );
}