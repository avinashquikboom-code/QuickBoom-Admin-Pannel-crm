'use client';
import { formatCurrency } from "@/lib/currency";

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { Sheet, SheetContent, } from '@/components/common/Drawer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { toast } from '@/hooks/use-toast';
import { faIndianRupeeSign, faLocationDot, faPhone, faUser, faUsers, faWallet } from '@fortawesome/free-solid-svg-icons';
import { faCalendar, faEnvelope } from '@fortawesome/free-regular-svg-icons';
export function EmployeeDetail({ employee, open, onOpenChange, }) {
    if (!employee)
        return null;
    return (<Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto p-0 bg-white">
        {/* Cover / Header */}
        <div className="bg-gradient-to-r from-brand-dark to-brand p-6 text-white">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 border-2 border-white/80 shadow-md">
              <AvatarImage src={employee.avatar} alt={employee.name}/>
              <AvatarFallback className="bg-brand-dark text-primary-foreground font-bold text-lg">
                {employee.firstName[0]}
                {employee.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white leading-tight">
                  {employee.name}
                </h2>
                <StatusBadge status={employee.status} showIcon={false}/>
              </div>
              <p className="text-xs text-brand-light font-medium">
                {employee.designation}
              </p>
              <p className="text-[11px] text-brand-light font-mono">
                {employee.id} • {employee.department}
              </p>
            </div>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6 space-y-6">
          {/* Quick Contact & Location */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Contact & Work Location
            </h4>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500">
                  <FontAwesomeIcon icon={faEnvelope} className="size-4 text-brand shrink-0"/>
                  Email
                </span>
                <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                  {employee.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500">
                  <FontAwesomeIcon icon={faPhone} className="size-4 text-brand shrink-0"/>
                  Phone
                </span>
                <span className="font-semibold text-slate-900">
                  {employee.phone}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500">
                  <FontAwesomeIcon icon={faLocationDot} className="size-4 text-brand shrink-0"/>
                  Location
                </span>
                <span className="font-semibold text-slate-900">
                  {employee.location}
                </span>
              </div>
            </div>
          </div>

          {/* Job & Employment Profile */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Employment Details
            </h4>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500">
                  <FontAwesomeIcon icon={faUsers} className="size-4 text-brand shrink-0"/>
                  Employment Type
                </span>
                <span className="font-semibold text-slate-900">
                  {employee.employmentType}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500">
                  <FontAwesomeIcon icon={faCalendar} className="size-4 text-brand shrink-0"/>
                  Join Date
                </span>
                <span className="font-semibold text-slate-900">
                  {employee.joinDate}
                </span>
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Compensation & Salary Structure
            </h4>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500">
                  <FontAwesomeIcon icon={faIndianRupeeSign} className="size-4 text-brand shrink-0"/>
                  Basic Monthly
                </span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(employee.salary.basic)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Monthly Allowances</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(employee.salary.allowances)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Overtime Hourly Rate</span>
                <span className="font-semibold text-brand-dark">
                  {formatCurrency(employee.salary.hourlyRate)}/hr
                </span>
              </div>
            </div>
          </div>

          {/* Bank Disbursement */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Disbursement & Banking
            </h4>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500">
                  <FontAwesomeIcon icon={faWallet} className="size-4 text-brand shrink-0"/>
                  Bank Name
                </span>
                <span className="font-semibold text-slate-900">
                  {employee.bankDetails.bankName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Account Number</span>
                <span className="font-mono text-slate-700">
                  {employee.bankDetails.accountNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Emergency Contact
            </h4>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500">
                  <FontAwesomeIcon icon={faUser} className="size-4 text-rose-500 shrink-0"/>
                  Contact Person
                </span>
                <span className="font-semibold text-slate-900">
                  {employee.emergencyContact.name} ({employee.emergencyContact.relationship})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Emergency Phone</span>
                <span className="font-semibold text-slate-900">
                  {employee.emergencyContact.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-2 flex items-center gap-2">
            <Button className="flex-1 bg-brand hover:bg-primary-hover text-primary-foreground font-semibold text-xs h-9" onClick={() => {
            toast.success(`Generated Profile Summary for ${employee.name}`);
            onOpenChange(false);
        }}>
              Export Profile (PDF)
            </Button>
            <Button variant="outline" className="border-slate-200 text-slate-700 text-xs h-9" onClick={() => {
            toast.info(`Sent direct notification to ${employee.email}`);
        }}>
              Message
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>);
}
