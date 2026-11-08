'use client';
import { formatCurrency } from "@/lib/currency";

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { faCheck, faPaperclip, faXmark } from '@fortawesome/free-solid-svg-icons';
import { faEye } from '@fortawesome/free-regular-svg-icons';
export function ExpenseTable({ claims, onApprove, onReject, onViewDetail, }) {
    const columns = [
        {
            header: 'Claim ID & Employee',
            cell: (exp) => (<div className="flex items-center gap-3">
          <Avatar className="size-9 border border-slate-200">
            <AvatarImage src={exp.employeeAvatar} alt={exp.employeeName}/>
            <AvatarFallback className="bg-brand text-primary-foreground text-xs">
              {exp.employeeName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 leading-tight">
              {exp.employeeName}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {exp.id} • {exp.department}
            </span>
          </div>
        </div>),
        },
        {
            header: 'Category',
            cell: (exp) => (<Badge variant="outline" className="bg-slate-50 text-brand-dark border-brand-light text-xs font-medium py-0.5">
          {exp.category}
        </Badge>),
        },
        {
            header: 'Amount',
            cell: (exp) => (<span className="font-bold text-sm text-slate-900">
          {formatCurrency(exp.amount)}
        </span>),
        },
        {
            header: 'Date Submitted',
            cell: (exp) => (<div className="flex flex-col text-xs">
          <span className="font-medium text-slate-700">{exp.date}</span>
          <span className="text-slate-400">Sub: {exp.submittedDate}</span>
        </div>),
        },
        {
            header: 'Receipt',
            cell: (exp) => (<button onClick={() => onViewDetail(exp)} className="flex items-center gap-1 text-xs text-brand hover:text-brand-dark font-medium group">
          <FontAwesomeIcon icon={faPaperclip} className="size-3.5 text-slate-400 group-hover:text-brand"/>
          <span className="truncate max-w-[120px]">{exp.receiptName}</span>
        </button>),
        },
        {
            header: 'Status',
            cell: (exp) => <StatusBadge status={exp.status}/>,
        },
        {
            header: 'Actions',
            className: 'text-right',
            cell: (exp) => (<div className="flex items-center justify-end gap-1.5">
          {exp.status === 'pending' ? (<>
              <Button size="sm" onClick={() => onApprove(exp)} className="h-7.5 px-2.5 bg-brand hover:bg-primary-hover text-primary-foreground text-xs font-semibold">
                <FontAwesomeIcon icon={faCheck} className="size-3.5 mr-1"/>
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => onReject(exp)} className="h-7.5 px-2 border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs">
                <FontAwesomeIcon icon={faXmark} className="size-3.5"/>
              </Button>
            </>) : (<Button size="sm" variant="ghost" onClick={() => onViewDetail(exp)} className="h-7.5 text-xs text-slate-600 hover:text-slate-900">
              <FontAwesomeIcon icon={faEye} className="size-3.5 mr-1 text-slate-400"/>
              Review
            </Button>)}
        </div>),
        },
    ];
    return (<DataTable columns={columns} data={claims} pageSize={8} emptyState={<div className="py-8 text-center text-slate-500">
          No expense claims found matching filter criteria.
        </div>}/>);
}
