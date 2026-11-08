import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/lib/utils';
import { faCheckCircle, faCircleXmark, faClock, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { faCalendarXmark } from '@fortawesome/free-regular-svg-icons';
export function StatusBadge({ status, className, showIcon = true }) {
    const normalized = status.toLowerCase().replace(/[\s-]/g, '_');
    switch (normalized) {
        // Active / Approved / Paid / Present / Won / Converted
        case 'active':
        case 'approved':
        case 'paid':
        case 'present':
        case 'won':
        case 'converted':
            return (<Badge variant="outline" className={cn('inline-flex items-center gap-1.5 border-brand-light bg-brand-light text-brand-dark font-medium capitalize py-0.5 px-2.5 shadow-none', className)}>
          {showIcon && <FontAwesomeIcon icon={faCheckCircle} className="size-3.5 text-brand shrink-0"/>}
          <span>{status.replace('_', ' ')}</span>
        </Badge>);
        // Pending / Processing / Late / Normal / Negotiation / Proposal / Contacted
        case 'pending':
        case 'processing':
        case 'late':
        case 'negotiation':
        case 'proposal':
        case 'contacted':
            return (<Badge variant="outline" className={cn('inline-flex items-center gap-1.5 border-amber-200 bg-amber-50 text-amber-700 font-medium capitalize py-0.5 px-2.5 shadow-none', className)}>
          {showIcon && <FontAwesomeIcon icon={faClock} className="size-3.5 text-amber-600 shrink-0"/>}
          <span>{status.replace('_', ' ')}</span>
        </Badge>);
        // Inactive / Rejected / Absent / High / Lost / Closed Lost / Overdue
        case 'inactive':
        case 'rejected':
        case 'absent':
        case 'lost':
        case 'closed_lost':
        case 'overdue':
            return (<Badge variant="outline" className={cn('inline-flex items-center gap-1.5 border-rose-200 bg-rose-50 text-rose-700 font-medium capitalize py-0.5 px-2.5 shadow-none', className)}>
          {showIcon && <FontAwesomeIcon icon={faCircleXmark} className="size-3.5 text-rose-600 shrink-0"/>}
          <span>{status.replace('_', ' ')}</span>
        </Badge>);
        // On Leave / Half Day / Qualified / Discovery / New
        case 'on_leave':
        case 'half_day':
        case 'qualified':
        case 'discovery':
        case 'new':
            return (<Badge variant="outline" className={cn('inline-flex items-center gap-1.5 border-brand-light bg-brand-light text-brand-dark font-medium capitalize py-0.5 px-2.5 shadow-none', className)}>
          {showIcon && <FontAwesomeIcon icon={faCalendarXmark} className="size-3.5 text-brand shrink-0"/>}
          <span>{status.replace('_', ' ')}</span>
        </Badge>);
        // Priority badges
        case 'high':
            return (<Badge variant="outline" className={cn('inline-flex items-center gap-1 border-rose-300 bg-rose-50 text-rose-700 font-semibold uppercase text-[11px] py-0.5 px-2 shadow-none', className)}>
          {showIcon && <FontAwesomeIcon icon={faTriangleExclamation} className="size-3 text-rose-600 shrink-0"/>}
          <span>High Priority</span>
        </Badge>);
        case 'normal':
            return (<Badge variant="outline" className={cn('inline-flex items-center gap-1 border-slate-200 bg-slate-100 text-slate-700 font-medium text-[11px] py-0.5 px-2 shadow-none', className)}>
          <span>Normal</span>
        </Badge>);
        case 'low':
            return (<Badge variant="outline" className={cn('inline-flex items-center gap-1 border-slate-200 bg-slate-50 text-slate-500 font-medium text-[11px] py-0.5 px-2 shadow-none', className)}>
          <span>Low</span>
        </Badge>);
        default:
            return (<Badge variant="outline" className={cn('inline-flex items-center gap-1 border-slate-200 bg-slate-100 text-slate-700 capitalize py-0.5 px-2.5 shadow-none', className)}>
          <span>{status}</span>
        </Badge>);
    }
}
