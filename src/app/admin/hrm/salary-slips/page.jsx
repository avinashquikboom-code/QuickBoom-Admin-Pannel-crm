'use client';
import { formatCurrency } from "@/lib/currency";

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/Select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/common/Drawer';
import { mockPayrollRecords } from '@/lib/mock-data';
import { toast } from '@/hooks/use-toast';
import { faDownload, faMagnifyingGlass, faPrint } from '@fortawesome/free-solid-svg-icons';
import { faEnvelope, faFileLines } from '@fortawesome/free-regular-svg-icons';
export default function SalarySlipsPage() {
    const [records] = React.useState(mockPayrollRecords);
    const [search, setSearch] = React.useState('');
    const [selectedMonth, setSelectedMonth] = React.useState('all');
    const [activeSlip, setActiveSlip] = React.useState(null);
    const filtered = React.useMemo(() => {
        return records.filter((r) => {
            const matchSearch = r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
                r.employeeId.toLowerCase().includes(search.toLowerCase()) ||
                r.id.toLowerCase().includes(search.toLowerCase());
            const matchMonth = selectedMonth === 'all' || r.month === selectedMonth;
            return matchSearch && matchMonth;
        });
    }, [records, search, selectedMonth]);
    const columns = [
        {
            header: 'Slip Number & Date',
            cell: (r) => (<div className="flex flex-col">
          <span className="font-mono font-semibold text-slate-900 text-xs">
            {r.id}
          </span>
          <span className="text-xs text-slate-400">{r.month}</span>
        </div>),
        },
        {
            header: 'Employee',
            cell: (r) => (<div className="flex items-center gap-2.5">
          <Avatar className="size-8 border border-slate-200">
            <AvatarImage src={r.employeeAvatar} alt={r.employeeName}/>
            <AvatarFallback className="bg-brand text-primary-foreground text-xs">
              {r.employeeName.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 text-xs">
              {r.employeeName}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {r.employeeId} • {r.department}
            </span>
          </div>
        </div>),
        },
        {
            header: 'Gross Earnings',
            cell: (r) => (<span className="font-semibold text-xs text-slate-800">
          {formatCurrency(r.grossPay)}
        </span>),
        },
        {
            header: 'Deductions',
            cell: (r) => (<span className="font-semibold text-xs text-rose-600">
          -{formatCurrency(r.totalDeductions)}
        </span>),
        },
        {
            header: 'Net Take-Home',
            cell: (r) => (<span className="font-bold text-sm text-brand-dark">
          {formatCurrency(r.netPay)}
        </span>),
        },
        {
            header: 'Actions',
            className: 'text-right',
            cell: (r) => (<div className="flex items-center justify-end gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setActiveSlip(r)} className="h-7.5 px-2.5 border-slate-200 text-slate-700 hover:text-brand-dark hover:bg-brand-light text-xs">
            <FontAwesomeIcon icon={faFileLines} className="size-3.5 mr-1 text-slate-400"/>
            View Slip
          </Button>
          <Button size="sm" variant="ghost" onClick={() => toast.success(`Downloaded payslip for ${r.employeeName}`)} className="h-7.5 px-2 text-slate-600 hover:text-slate-900">
            <FontAwesomeIcon icon={faDownload} className="size-3.5"/>
          </Button>
        </div>),
        },
    ];
    return (<div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Salary Slips Repository" description="Search, view, download and distribute official monthly compensation slips to personnel." actions={<Button size="sm" onClick={() => toast.success('Sent payslips to all employees via email')} className="bg-brand hover:bg-primary-hover text-primary-foreground font-medium text-xs h-9">
            <FontAwesomeIcon icon={faEnvelope} className="size-4 mr-1.5"/>
            Email All Slips
          </Button>}/>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1 sm:max-w-xs">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"/>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by slip ID, employee name..." className="h-9 pl-8 pr-3 text-xs border-slate-200 bg-slate-50/50 focus-visible:bg-white"/>
        </div>

        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="h-9 text-xs border-slate-200 w-44 bg-slate-50/50">
            <SelectValue placeholder="Pay Period"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All Periods
            </SelectItem>
            <SelectItem value="March 2026" className="text-xs">
              March 2026
            </SelectItem>
            <SelectItem value="February 2026" className="text-xs">
              February 2026
            </SelectItem>
            <SelectItem value="January 2026" className="text-xs">
              January 2026
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filtered} pageSize={8} emptyState={<div className="py-8 text-center text-slate-500">No salary slips found.</div>}/>

      {/* Salary Slip Drawer */}
      <Sheet open={!!activeSlip} onOpenChange={() => setActiveSlip(null)}>
        <SheetContent side="right" className="sm:max-w-[600px] w-full p-0 flex flex-col gap-0 bg-white border-l border-slate-200/90 shadow-2xl rounded-l-2xl overflow-hidden">
          <SheetHeader className="border-b border-slate-200/80 px-6 py-4.5 text-left">
            <div className="flex items-start justify-between pr-6">
              <div>
                <SheetTitle className="text-lg font-bold text-brand-dark tracking-tight">
                  QB Suite Payslip
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-400 mt-0.5">
                  Pay Period: {activeSlip?.month}
                </SheetDescription>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-800 text-xs">
                  {activeSlip?.id}
                </span>
                <p className="text-[11px] text-brand-dark font-semibold uppercase mt-0.5">
                  Status: {activeSlip?.status}
                </p>
              </div>
            </div>
          </SheetHeader>

          {activeSlip && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg flex justify-between border border-slate-200/80">
                <div>
                  <span className="font-bold text-slate-900 block text-sm">
                    {activeSlip.employeeName}
                  </span>
                  <span className="text-slate-500">
                    {activeSlip.designation} • {activeSlip.department}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-slate-700 block">
                    {activeSlip.bankAccount}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border border-slate-200/80 p-3.5 rounded-lg bg-white">
                <div className="space-y-1.5">
                  <span className="font-bold uppercase text-[10px] text-slate-400 block pb-1 border-b">
                    Gross Earnings
                  </span>
                  <div className="flex justify-between">
                    <span>Basic Salary:</span>
                    <span>{formatCurrency(activeSlip.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Allowances:</span>
                    <span>{formatCurrency(activeSlip.allowances)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t">
                    <span>Gross Pay:</span>
                    <span>{formatCurrency(activeSlip.grossPay)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-bold uppercase text-[10px] text-slate-400 block pb-1 border-b">
                    Deductions
                  </span>
                  <div className="flex justify-between">
                    <span>Income Tax:</span>
                    <span className="text-rose-600">-{formatCurrency(activeSlip.deductions.tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Social Security:</span>
                    <span className="text-rose-600">-{formatCurrency(activeSlip.deductions.insurance)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t text-rose-700">
                    <span>Total Deductions:</span>
                    <span>-{formatCurrency(activeSlip.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3.5 bg-brand-light rounded-xl border border-brand-light">
                <span className="font-bold text-brand-dark text-sm">
                  Net Salary Disbursed
                </span>
                <span className="text-xl font-bold text-brand-dark">
                  {formatCurrency(activeSlip.netPay)}
                </span>
              </div>
            </div>
          )}

          <div className="shrink-0 flex items-center justify-end gap-2 border-t border-slate-200/80 bg-slate-50/80 px-6 py-4">
            <Button variant="outline" size="sm" onClick={() => toast.success('Printed slip')} className="h-9 px-4 text-xs border-slate-200">
              <FontAwesomeIcon icon={faPrint} className="size-3.5 mr-1.5"/>
              Print
            </Button>
            <Button size="sm" onClick={() => {
              toast.success('Downloaded PDF slip');
              setActiveSlip(null);
            }} className="h-9 px-4 bg-brand hover:bg-primary-hover text-primary-foreground text-xs font-semibold">
              <FontAwesomeIcon icon={faDownload} className="size-3.5 mr-1.5"/>
              Download
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>);
}
