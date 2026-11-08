'use client';
import { formatCurrency } from "@/lib/currency";

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PayrollSummary } from '@/modules/hrm/components/payroll/PayrollSummary';
import { PayrollTable } from '@/modules/hrm/components/payroll/PayrollTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/common/Drawer';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { mockPayrollRecords } from '@/lib/mock-data';
import { toast } from '@/hooks/use-toast';
import { faDownload, faPrint, faWallet } from '@fortawesome/free-solid-svg-icons';
import { faEnvelope } from '@fortawesome/free-regular-svg-icons';
export default function PayrollPage() {
    const [records, setRecords] = React.useState(mockPayrollRecords);
    const [selectedMonth, setSelectedMonth] = React.useState('March 2026');
    const [selectedRecord, setSelectedRecord] = React.useState(null);
    const [payslipOpen, setPayslipOpen] = React.useState(false);
    const [runBatchOpen, setRunBatchOpen] = React.useState(false);
    const handleRunPayrollBatch = () => {
        setRecords((prev) => prev.map((r) => ({
            ...r,
            status: 'paid',
            paymentDate: new Date().toISOString().split('T')[0],
        })));
        setRunBatchOpen(false);
        toast.success('Payroll Batch Executed Successfully', {
            description: `Disbursed payments to all ${records.length} employees for ${selectedMonth}.`,
        });
    };
    const handleMarkPaid = (rec) => {
        setRecords((prev) => prev.map((r) => r.id === rec.id
            ? {
                ...r,
                status: 'paid',
                paymentDate: new Date().toISOString().split('T')[0],
            }
            : r));
        toast.success(`Disbursed salary of ${formatCurrency(rec.netPay)} to ${rec.employeeName}`);
    };
    const handleViewPayslip = (rec) => {
        setSelectedRecord(rec);
        setPayslipOpen(true);
    };
    return (<div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Payroll & Compensation Management" description="Calculate monthly salaries, tax withholding, overtime credits, reimbursements, and payslip generation." actions={<div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.success('Exported Monthly Payroll to Excel/CSV')} className="border-slate-200 text-slate-700 hover:text-brand-dark text-xs h-9">
              <FontAwesomeIcon icon={faDownload} className="size-3.5 mr-1 text-slate-400"/>
              Export Bank File
            </Button>
            <Button size="sm" onClick={() => setRunBatchOpen(true)} className="bg-brand hover:bg-primary-hover text-primary-foreground font-medium text-xs h-9">
              <FontAwesomeIcon icon={faWallet} className="size-4 mr-1.5"/>
              Run Payroll Batch
            </Button>
          </div>}/>

      {/* Summary Cards */}
      <PayrollSummary records={records}/>

      {/* Payroll Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Salary Register — {selectedMonth}
            </h3>
            <Badge className="bg-brand-light text-brand-dark border-brand-light text-[10px]">
              Ready for processing
            </Badge>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Cutoff Date: Mar 25, 2026
          </span>
        </div>

        <PayrollTable records={records} onViewPayslip={handleViewPayslip} onMarkPaid={handleMarkPaid}/>
      </div>

      {/* Payslip Drawer */}
      <Sheet open={payslipOpen} onOpenChange={setPayslipOpen}>
        <SheetContent side="right" className="sm:max-w-[600px] w-full p-0 flex flex-col gap-0 bg-white border-l border-slate-200/90 shadow-2xl rounded-l-2xl overflow-hidden">
          <SheetHeader className="border-b border-slate-200/80 px-6 py-4.5 text-left">
            <div className="flex items-start justify-between pr-6">
              <div>
                <div className="flex items-center gap-2">
                  <SheetTitle className="font-bold text-lg text-brand-dark tracking-tight">
                    QB Suite Inc.
                  </SheetTitle>
                  <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1 rounded">
                    Official Payslip
                  </span>
                </div>
                <SheetDescription className="text-[11px] text-slate-400 mt-0.5">
                  100 Montgomery St, Suite 1400, San Francisco, CA
                </SheetDescription>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-semibold text-slate-900">
                  {selectedRecord?.id}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pay Period: {selectedRecord?.month}
                </p>
              </div>
            </div>
          </SheetHeader>

          {selectedRecord && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
              {/* Employee Summary */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">
                    Employee Name
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedRecord.employeeName}
                  </span>
                  <span className="text-slate-500 block">
                    {selectedRecord.designation} • {selectedRecord.department}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase">
                    Disbursement Account
                  </span>
                  <span className="font-mono text-slate-800">
                    {selectedRecord.bankAccount}
                  </span>
                  <span className="text-brand-dark font-semibold block uppercase text-[10px]">
                    Status: {selectedRecord.status}
                  </span>
                </div>
              </div>

              {/* Earnings vs Deductions Table */}
              <div className="grid grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-900 uppercase text-[11px] pb-1 border-b block">
                    Earnings
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Basic Salary</span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(selectedRecord.basicSalary)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Allowances</span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(selectedRecord.allowances)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Overtime Pay</span>
                    <span className="font-semibold text-amber-700">
                      +{formatCurrency(selectedRecord.overtimePay)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reimbursements</span>
                    <span className="font-semibold text-brand-dark">
                      +{formatCurrency(selectedRecord.reimbursements)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold">
                    <span>Total Gross</span>
                    <span>{formatCurrency(selectedRecord.grossPay)}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-900 uppercase text-[11px] pb-1 border-b block">
                    Deductions
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Income Tax (FIT)</span>
                    <span className="font-semibold text-rose-600">
                      -{formatCurrency(selectedRecord.deductions.tax)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Health Insurance</span>
                    <span className="font-semibold text-rose-600">
                      -{formatCurrency(selectedRecord.deductions.insurance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Provident / 401(k)</span>
                    <span className="font-semibold text-rose-600">
                      -{formatCurrency(selectedRecord.deductions.providentFund)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Other Pre-Tax</span>
                    <span className="font-semibold text-rose-600">
                      -{formatCurrency(selectedRecord.deductions.other)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold text-rose-700">
                    <span>Total Deductions</span>
                    <span>-{formatCurrency(selectedRecord.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay Callout */}
              <div className="flex items-center justify-between p-3.5 bg-brand-light rounded-xl border border-brand-light">
                <div>
                  <span className="text-brand-dark font-semibold text-[11px] uppercase tracking-wider block">
                    Net Take-Home Pay
                  </span>
                  <span className="text-xs text-brand">
                    Direct Deposit into {selectedRecord.bankAccount}
                  </span>
                </div>
                <span className="text-2xl font-bold text-brand-dark">
                  {formatCurrency(selectedRecord.netPay)}
                </span>
              </div>
            </div>
          )}

          {selectedRecord && (
            <div className="shrink-0 flex items-center justify-between border-t border-slate-200/80 bg-slate-50/80 px-6 py-4">
              <Button variant="outline" size="sm" onClick={() => toast.success(`Payslip sent to ${selectedRecord.employeeName}'s email`)} className="h-9 px-4 text-xs border-slate-200">
                <FontAwesomeIcon icon={faEnvelope} className="size-3.5 mr-1.5"/>
                Email Payslip
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => toast.success('Sending to connected office printer...')} className="h-9 px-4 text-xs border-slate-200">
                  <FontAwesomeIcon icon={faPrint} className="size-3.5 mr-1.5"/>
                  Print
                </Button>
                <Button size="sm" onClick={() => {
                  toast.success(`Downloaded ${selectedRecord.id}.pdf`);
                  setPayslipOpen(false);
                }} className="h-9 px-4 bg-brand hover:bg-primary-hover text-primary-foreground font-medium text-xs">
                  <FontAwesomeIcon icon={faDownload} className="size-3.5 mr-1.5"/>
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Run Batch Confirmation Dialog */}
      <ConfirmDialog open={runBatchOpen} onOpenChange={setRunBatchOpen} title="Execute Monthly Payroll Batch" description={`This will trigger automated disbursement for all ${records.length} employees in ${selectedMonth} totaling ${formatCurrency(records.reduce((acc, r) => acc + r.netPay, 0))}.`} variant="success" confirmLabel="Confirm & Disburse Funds" onConfirm={handleRunPayrollBatch}/>
    </div>);
}
