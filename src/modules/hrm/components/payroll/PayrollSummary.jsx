'use client';
import { formatCurrency } from "@/lib/currency";

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { faClock, faIndianRupeeSign, faGift, faPercent, faWallet } from '@fortawesome/free-solid-svg-icons';
export function PayrollSummary({ records }) {
    const totals = React.useMemo(() => {
        return records.reduce((acc, r) => {
            acc.basic += r.basicSalary;
            acc.allowances += r.allowances;
            acc.overtime += r.overtimePay;
            acc.reimbursements += r.reimbursements;
            acc.gross += r.grossPay;
            acc.deductions += r.totalDeductions;
            acc.net += r.netPay;
            return acc;
        }, {
            basic: 0,
            allowances: 0,
            overtime: 0,
            reimbursements: 0,
            gross: 0,
            deductions: 0,
            net: 0,
        });
    }, [records]);
    return (<div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <Card className="border border-slate-200 bg-white shadow-2xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Gross Earnings
            </span>
            <FontAwesomeIcon icon={faIndianRupeeSign} className="size-4 text-slate-400"/>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(totals.gross)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Basic: {formatCurrency(totals.basic)}
          </p>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white shadow-2xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Total Deductions
            </span>
            <FontAwesomeIcon icon={faPercent} className="size-4 text-rose-500"/>
          </div>
          <p className="text-xl font-bold text-rose-600 mt-1">
            -{formatCurrency(totals.deductions)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Tax & Social Security</p>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white shadow-2xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Overtime Added
            </span>
            <FontAwesomeIcon icon={faClock} className="size-4 text-amber-500"/>
          </div>
          <p className="text-xl font-bold text-amber-700 mt-1">
            +{formatCurrency(totals.overtime)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Approved extra hours</p>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white shadow-2xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Reimbursements
            </span>
            <FontAwesomeIcon icon={faGift} className="size-4 text-brand"/>
          </div>
          <p className="text-xl font-bold text-brand-dark mt-1">
            +{formatCurrency(totals.reimbursements)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Approved expense claims</p>
        </CardContent>
      </Card>

      <Card className="col-span-2 lg:col-span-1 border border-brand-light bg-brand-light/60 shadow-2xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-brand-dark uppercase">
              Net Payable Disbursed
            </span>
            <FontAwesomeIcon icon={faWallet} className="size-4 text-brand-dark"/>
          </div>
          <p className="text-xl font-bold text-brand-dark mt-1">
            {formatCurrency(totals.net)}
          </p>
          <p className="text-[11px] text-brand-dark font-medium mt-0.5">
            {records.length} Employees Scheduled
          </p>
        </CardContent>
      </Card>
    </div>);
}
