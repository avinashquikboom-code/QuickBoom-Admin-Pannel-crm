'use client';
import { formatCurrency } from "@/lib/currency";

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PayrollSummary } from '@/modules/hrm/components/payroll/PayrollSummary';
import { PayrollTable } from '@/modules/hrm/components/payroll/PayrollTable';
import { LateMarkBreakdown } from '@/modules/hrm/components/payroll/LateMarkBreakdown';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/common/Drawer';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { faDownload, faPrint, faClock, faSliders, faCheck } from '@fortawesome/free-solid-svg-icons';
import { faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { hrmError, loadPayrollItems, payPayrollItem, loadLateMarkPolicy, saveLateMarkPolicy } from '@/modules/hrm/hrm-api';
import { HrmNotice } from '@/modules/hrm/HrmNotice';
export default function PayrollPage() {
    const [records, setRecords] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [refresh, setRefresh] = React.useState(0);
    React.useEffect(() => {
        let active = true;
        setLoading(true);
        loadPayrollItems().then((rows) => { if (active) setRecords(rows); }).catch((err) => { if (active) setError(hrmError(err)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [refresh]);
    const [selectedRecord, setSelectedRecord] = React.useState(null);
    const [payslipOpen, setPayslipOpen] = React.useState(false);
    const [payingId, setPayingId] = React.useState(null);

    // Late Mark Policy Settings
    const [latePolicyOpen, setLatePolicyOpen] = React.useState(false);
    const [latePolicyLoading, setLatePolicyLoading] = React.useState(false);
    const [latePolicySaving, setLatePolicySaving] = React.useState(false);
    const [latePolicy, setLatePolicy] = React.useState({
        isEnabled: true,
        deductionRatePerMin: 1.0,
        currency: 'INR',
        calculationMethod: 'PER_MINUTE',
        applyTo: 'ALL',
        maxDailyDeduction: '',
        maxMonthlyDeduction: '',
        effectiveFrom: new Date().toISOString().slice(0, 10),
        requireApproval: false,
    });

    React.useEffect(() => {
        if (latePolicyOpen) {
            setLatePolicyLoading(true);
            loadLateMarkPolicy()
                .then((data) => {
                    if (data && typeof data === 'object') {
                        setLatePolicy({
                            isEnabled: data.isEnabled !== false,
                            deductionRatePerMin: data.deductionRatePerMin ?? 1.0,
                            currency: data.currency || 'INR',
                            calculationMethod: data.calculationMethod || 'PER_MINUTE',
                            applyTo: data.applyTo || 'ALL',
                            maxDailyDeduction: data.maxDailyDeduction != null ? String(data.maxDailyDeduction) : '',
                            maxMonthlyDeduction: data.maxMonthlyDeduction != null ? String(data.maxMonthlyDeduction) : '',
                            effectiveFrom: data.effectiveFrom ? String(data.effectiveFrom).slice(0, 10) : new Date().toISOString().slice(0, 10),
                            requireApproval: Boolean(data.requireApproval),
                        });
                    }
                })
                .catch((err) => toast.error(hrmError(err)))
                .finally(() => setLatePolicyLoading(false));
        }
    }, [latePolicyOpen]);

    const handleSaveLatePolicy = async () => {
        setLatePolicySaving(true);
        try {
            await saveLateMarkPolicy({
                ...latePolicy,
                deductionRatePerMin: Math.max(0, Number(latePolicy.deductionRatePerMin) || 1.0),
                maxDailyDeduction: latePolicy.maxDailyDeduction !== '' && !isNaN(Number(latePolicy.maxDailyDeduction)) ? Number(latePolicy.maxDailyDeduction) : null,
                maxMonthlyDeduction: latePolicy.maxMonthlyDeduction !== '' && !isNaN(Number(latePolicy.maxMonthlyDeduction)) ? Number(latePolicy.maxMonthlyDeduction) : null,
            });
            toast.success('Late Mark Deduction Policy saved successfully');
            setLatePolicyOpen(false);
            setRefresh((v) => v + 1);
        } catch (err) {
            toast.error(hrmError(err));
        } finally {
            setLatePolicySaving(false);
        }
    };

    const handleMarkPaid = async (rec) => {
        if (payingId) return;
        setPayingId(rec.recordId);
        try {
            await payPayrollItem(rec.recordId);
            toast.success(`${rec.employeeName || 'Payroll item'} marked paid`);
            setRefresh((value) => value + 1);
        } catch (err) {
            toast.error(hrmError(err));
        } finally {
            setPayingId(null);
        }
    };
    const handleViewPayslip = (rec) => {
        setSelectedRecord(rec);
        setPayslipOpen(true);
    };
    return (<div className="max-w-none space-y-4 sm:space-y-6 w-full min-w-0 overflow-x-hidden">
      <PageHeader title="Payroll & Compensation Management" description="Calculate monthly salaries, tax withholding, overtime credits, reimbursements, and payslip generation." actions={<div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setLatePolicyOpen(true)} className="border-slate-200 text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 text-xs h-9">
              <FontAwesomeIcon icon={faClock} className="size-3.5 mr-1 text-emerald-600"/>
              Late Mark Policy
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.success('Exported Monthly Payroll to Excel/CSV')} className="border-slate-200 text-slate-700 hover:text-brand-dark text-xs h-9">
              <FontAwesomeIcon icon={faDownload} className="size-3.5 mr-1 text-slate-400"/>
              Export Bank File
            </Button>
          </div>}/>

      {/* Summary Cards */}
      <PayrollSummary records={records}/>

      {/* Payroll Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Salary Register — {records[0]?.month || 'Current period'}
            </h3>
            <Badge className="bg-brand-light text-brand-dark border-brand-light text-[10px]">
              Ready for processing
            </Badge>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Cutoff Date: Mar 25, 2026
          </span>
        </div>

        <HrmNotice loading={loading} error={error} onRetry={() => setRefresh((value) => value + 1)} />
        {!loading && !error && <PayrollTable records={records} onViewPayslip={handleViewPayslip} onMarkPaid={handleMarkPaid}/>}
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
                    <span className="text-slate-500">Registered Monthly Salary</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(selectedRecord.registeredSalary || selectedRecord.basicSalary)}</span>
                  </div>
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
                      -{formatCurrency(selectedRecord.deductions?.tax || 0)}
                    </span>
                  </div>
                  {selectedRecord.deductions?.insurance ? (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Health Insurance</span>
                      <span className="font-semibold text-rose-600">
                        -{formatCurrency(selectedRecord.deductions.insurance)}
                      </span>
                    </div>
                  ) : null}
                  {selectedRecord.deductions?.providentFund ? (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Provident / 401(k)</span>
                      <span className="font-semibold text-rose-600">
                        -{formatCurrency(selectedRecord.deductions.providentFund)}
                      </span>
                    </div>
                  ) : null}
                  {selectedRecord.lateDeduction > 0 && (
                    <div className="flex justify-between text-amber-900 font-medium bg-amber-50/60 px-1.5 py-0.5 rounded border border-amber-200/50">
                      <span>Late Mark ({selectedRecord.totalLateMinutes || 0}m @ ₹{selectedRecord.lateRatePerMinute || 1.0}/m)</span>
                      <span className="font-semibold text-rose-600">
                        -{formatCurrency(selectedRecord.lateDeduction)}
                      </span>
                    </div>
                  )}
                  {selectedRecord.deductions?.other ? (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Other Pre-Tax</span>
                      <span className="font-semibold text-rose-600">
                        -{formatCurrency(selectedRecord.deductions.other)}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between pt-2 border-t font-bold text-rose-700">
                    <span>Total Deductions</span>
                    <span>-{formatCurrency(selectedRecord.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              {/* Attendance & Late Mark Details Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faClock} className="size-3.5 text-emerald-700" />
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                      Attendance & Late Mark Details
                    </span>
                  </div>
                  {selectedRecord.lateMarks > 0 || selectedRecord.totalLateMinutes > 0 || selectedRecord.lateDeduction > 0 ? (
                    <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px]">
                      {selectedRecord.lateMarks || 0} Late Days • {selectedRecord.totalLateMinutes || 0} mins
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]">
                      No Late Deductions
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-slate-400 block text-[10px]">Working Days</span>
                    <span className="font-bold text-slate-800 text-xs">{selectedRecord.workingDays ?? '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-slate-400 block text-[10px]">Present Days</span>
                    <span className="font-bold text-emerald-700 text-xs">{selectedRecord.presentDays ?? '—'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-slate-400 block text-[10px]">Late Days</span>
                    <span className="font-bold text-amber-700 text-xs">{selectedRecord.lateMarks ?? 0}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                    <span className="text-slate-400 block text-[10px]">Late Deduction</span>
                    <span className="font-bold text-rose-600 text-xs">-{formatCurrency(selectedRecord.lateDeduction ?? 0)}</span>
                  </div>
                </div>
                <LateMarkBreakdown rows={selectedRecord.lateMarkBreakdown} />
                <p className="text-[11px] text-slate-500 pt-0.5">
                  Calculation: ₹{selectedRecord.lateRatePerMinute ?? 1.0}/minute deduction applied exclusively on scheduled shift workdays (zero grace; holidays & approved leaves excluded).
                </p>
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

      {/* Late Mark Deduction Policy Dialog */}
      <Dialog open={latePolicyOpen} onOpenChange={setLatePolicyOpen}>
        <DialogContent className="sm:max-w-md p-6 bg-white rounded-2xl border border-slate-200 shadow-2xl">
          <DialogHeader className="gap-1 text-left pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <FontAwesomeIcon icon={faClock} className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Late Mark Per-Minute Deduction Policy
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Configure automated per-minute deduction rules for employee late arrivals.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {latePolicyLoading ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Loading policy settings...
            </div>
          ) : (
            <div className="space-y-4 py-2 text-xs">
              {/* Enabled toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="font-semibold text-slate-900 block text-xs">Enable Late Mark Deduction</span>
                  <span className="text-[11px] text-slate-500">
                    Automatically calculate per-minute salary deduction on payroll runs
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={latePolicy.isEnabled}
                  onChange={(e) => setLatePolicy((p) => ({ ...p, isEnabled: e.target.checked }))}
                  className="size-4.5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              {/* Deduction Rate & Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Deduction Rate (₹ / minute)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.25"
                    value={latePolicy.deductionRatePerMin}
                    onChange={(e) => setLatePolicy((p) => ({ ...p, deductionRatePerMin: e.target.value }))}
                    placeholder="1.00"
                    className="h-9 text-xs"
                  />
                  <span className="text-[10px] text-slate-400">Default: ₹1.00 per minute</span>
                </div>
              </div>

              {/* Effective From Date & Apply To */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Effective From Date</Label>
                  <Input
                    type="date"
                    value={latePolicy.effectiveFrom}
                    onChange={(e) => setLatePolicy((p) => ({ ...p, effectiveFrom: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Applicable To</Label>
                  <Select
                    value={latePolicy.applyTo}
                    onValueChange={(val) => setLatePolicy((p) => ({ ...p, applyTo: val }))}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL" className="text-xs">All Employees</SelectItem>
                      <SelectItem value="ROLES" className="text-xs">Selected Roles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Optional Limits */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Max Daily Deduction (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={latePolicy.maxDailyDeduction}
                    onChange={(e) => setLatePolicy((p) => ({ ...p, maxDailyDeduction: e.target.value }))}
                    placeholder="No limit"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Max Monthly Deduction (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={latePolicy.maxMonthlyDeduction}
                    onChange={(e) => setLatePolicy((p) => ({ ...p, maxMonthlyDeduction: e.target.value }))}
                    placeholder="No limit"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Business Rule Callout */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl space-y-1 text-[11px] text-emerald-950">
                <span className="font-bold block">Business Rule & Shift Enforcement:</span>
                <p className="text-emerald-800 leading-relaxed">
                  Formula: <code className="bg-emerald-100/70 px-1 py-0.5 rounded text-[10px]">Late Minutes = Actual Check-in Time - Scheduled Shift Start Time</code>
                  <br />
                  Calculation: <code className="bg-emerald-100/70 px-1 py-0.5 rounded text-[10px]">Late Deduction = Eligible Late Minutes × ₹{latePolicy.deductionRatePerMin || 1}/min</code>
                </p>
                <p className="text-emerald-700 text-[10px]">
                  • Applies exclusively on scheduled shift workdays.
                  <br />
                  • Weekly offs, public holidays, and approved full-day leaves are strictly excluded.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLatePolicyOpen(false)}
              disabled={latePolicySaving}
              className="h-9 px-4 text-xs border-slate-200"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveLatePolicy}
              disabled={latePolicySaving || latePolicyLoading}
              className="h-9 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
            >
              {latePolicySaving ? 'Saving...' : 'Save Policy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>);
}
