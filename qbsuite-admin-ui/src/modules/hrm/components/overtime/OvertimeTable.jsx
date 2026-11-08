'use client';
import { formatCurrency } from "@/lib/currency";

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { faCheck, faCircleInfo, faXmark } from '@fortawesome/free-solid-svg-icons';
export function OvertimeTable({ records, onApprove, onReject, onViewDetails, }) {
    const columns = [
        {
            header: 'Employee',
            cell: (ot) => (<div className="flex items-center gap-3">
          <Avatar className="size-9 border border-slate-200">
            <AvatarImage src={ot.employeeAvatar} alt={ot.employeeName}/>
            <AvatarFallback className="bg-brand text-primary-foreground text-xs">
              {ot.employeeName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 leading-tight">
              {ot.employeeName}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {ot.employeeId} • {ot.department}
            </span>
          </div>
        </div>),
        },
        {
            header: 'Date & Project',
            cell: (ot) => (<div className="flex flex-col">
          <span className="font-medium text-slate-800 text-xs">
            {ot.project}
          </span>
          <span className="text-xs text-slate-400">{ot.date}</span>
        </div>),
        },
        {
            header: 'Hours & Rate',
            cell: (ot) => (<div className="flex flex-col text-xs">
          <span className="font-bold text-slate-900">
            {ot.hours} hrs ({ot.rateMultiplier}x)
          </span>
          <span className="text-slate-400">{formatCurrency(ot.hourlyRate)}/hr base</span>
        </div>),
        },
        {
            header: 'Est. Amount',
            cell: (ot) => (<span className="font-bold text-sm text-brand-dark">
          {formatCurrency(ot.estimatedAmount)}
        </span>),
        },
        {
            header: 'Reason',
            cell: (ot) => (<p className="text-xs text-slate-600 max-w-xs truncate" title={ot.reason}>
          {ot.reason}
        </p>),
        },
        {
            header: 'Status',
            cell: (ot) => <StatusBadge status={ot.status}/>,
        },
        {
            header: 'Actions',
            className: 'text-right',
            cell: (ot) => (<div className="flex items-center justify-end gap-1.5">
          {ot.status === 'pending' ? (<>
              <Button size="sm" onClick={() => onApprove(ot)} className="h-7.5 px-2.5 bg-brand hover:bg-primary-hover text-primary-foreground text-xs font-semibold">
                <FontAwesomeIcon icon={faCheck} className="size-3.5 mr-1"/>
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => onReject(ot)} className="h-7.5 px-2 border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs">
                <FontAwesomeIcon icon={faXmark} className="size-3.5"/>
              </Button>
            </>) : (<Button size="sm" variant="ghost" onClick={() => onViewDetails(ot)} className="h-7.5 text-xs text-slate-500 hover:text-slate-800">
              <FontAwesomeIcon icon={faCircleInfo} className="size-3.5 mr-1 text-slate-400"/>
              Details
            </Button>)}
        </div>),
        },
    ];
    return (<DataTable columns={columns} data={records} pageSize={8} emptyState={<div className="py-8 text-center text-slate-500">
          No overtime requests found in this view.
        </div>}/>);
}
