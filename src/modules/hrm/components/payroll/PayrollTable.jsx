'use client';
import { formatCurrency } from "@/lib/currency";

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { faFileLines } from '@fortawesome/free-regular-svg-icons';
export function PayrollTable({ records, onViewPayslip, onMarkPaid, }) {
    const columns = [
        {
            header: 'Employee',
            cell: (rec) => (<div className="flex items-center gap-3">
          <Avatar className="size-9 border border-slate-200">
            <AvatarImage src={rec.employeeAvatar} alt={rec.employeeName}/>
            <AvatarFallback className="bg-brand text-primary-foreground text-xs">
              {rec.employeeName.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 leading-tight">
              {rec.employeeName}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {rec.employeeId} • {rec.department}
            </span>
          </div>
        </div>),
        },
        {
            header: 'Basic Salary',
            cell: (rec) => (<span className="text-xs font-medium text-slate-800">
          {formatCurrency(rec.basicSalary)}
        </span>),
        },
        {
            header: 'Allowances',
            cell: (rec) => (<span className="text-xs font-medium text-slate-600">
          {formatCurrency(rec.allowances)}
        </span>),
        },
        {
            header: 'Overtime & Claims',
            cell: (rec) => (<div className="flex flex-col text-xs">
          <span className="text-amber-700 font-medium">
            +{formatCurrency(rec.overtimePay)} OT
          </span>
          <span className="text-brand-dark font-medium">
            +{formatCurrency(rec.reimbursements)} Claim
          </span>
        </div>),
        },
        {
            header: 'Gross Pay',
            cell: (rec) => (<span className="font-bold text-xs text-slate-900">
          {formatCurrency(rec.grossPay)}
        </span>),
        },
        {
            header: 'Deductions',
            cell: (rec) => (<div className="flex flex-col text-xs text-rose-600">
          <span className="font-semibold">
            -{formatCurrency(rec.totalDeductions)}
          </span>
          <span className="text-[10px] text-slate-400">
            Tax: {formatCurrency(rec.deductions.tax)}
          </span>
        </div>),
        },
        {
            header: 'Net Payable',
            cell: (rec) => (<span className="font-bold text-sm text-brand-dark">
          {formatCurrency(rec.netPay)}
        </span>),
        },
        {
            header: 'Status',
            cell: (rec) => <StatusBadge status={rec.status}/>,
        },
        {
            header: 'Actions',
            className: 'text-right',
            cell: (rec) => (<div className="flex items-center justify-end gap-1.5">
          <Button size="sm" variant="outline" onClick={() => onViewPayslip(rec)} className="h-7.5 px-2.5 border-slate-200 text-slate-700 hover:text-brand-dark hover:bg-brand-light text-xs">
            <FontAwesomeIcon icon={faFileLines} className="size-3.5 mr-1 text-slate-400"/>
            Payslip
          </Button>
          {rec.status === 'pending' && onMarkPaid && (<Button size="sm" onClick={() => onMarkPaid(rec)} className="h-7.5 px-2 bg-brand hover:bg-primary-hover text-primary-foreground text-xs font-semibold">
              <FontAwesomeIcon icon={faCheckDouble} className="size-3.5 mr-1"/>
              Pay
            </Button>)}
        </div>),
        },
    ];
    return (<DataTable columns={columns} data={records} pageSize={8} emptyState={<div className="py-8 text-center text-slate-500">
          No payroll records found for this period.
        </div>}/>);
}
