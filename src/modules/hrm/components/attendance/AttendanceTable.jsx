'use client';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { faClock, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
export function AttendanceTable({ records, onAdjustPunch, }) {
    const columns = [
        {
            header: 'Employee',
            cell: (rec) => (<div className="flex items-center gap-3">
          <Avatar className="size-9 border border-slate-200">
            <AvatarImage src={rec.employeeAvatar} alt={rec.employeeName}/>
            <AvatarFallback className="bg-brand text-primary-foreground text-xs">
              {rec.employeeName.slice(0, 2).toUpperCase()}
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
            header: 'Punch In',
            cell: (rec) => (<span className={`font-mono text-xs font-medium ${rec.punchIn ? 'text-slate-800' : 'text-slate-400 italic'}`}>
          {rec.punchIn || '—'}
        </span>),
        },
        {
            header: 'Punch Out',
            cell: (rec) => (<span className={`font-mono text-xs font-medium ${rec.punchOut ? 'text-slate-800' : 'text-slate-400 italic'}`}>
          {rec.punchOut || '—'}
        </span>),
        },
        {
            header: 'Break Time',
            cell: (rec) => (<span className="text-xs font-medium text-slate-600">
          {rec.breakDuration}
        </span>),
        },
        {
            header: 'Working Hours',
            cell: (rec) => (<span className="text-xs font-bold text-slate-900">
          {rec.workingHours}
        </span>),
        },
        {
            header: 'Late / Delay',
            cell: (rec) => rec.lateDuration ? (<span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <FontAwesomeIcon icon={faTriangleExclamation} className="size-3"/>
            {rec.lateDuration}
          </span>) : (<span className="text-xs text-slate-400 font-mono">—</span>),
        },
        {
            header: 'Status',
            cell: (rec) => <StatusBadge status={rec.status}/>,
        },
        {
            header: 'Actions',
            className: 'text-right',
            cell: (rec) => (<Button size="sm" variant="ghost" onClick={() => onAdjustPunch?.(rec)} className="h-8 text-xs text-slate-600 hover:text-brand-dark hover:bg-brand-light">
          <FontAwesomeIcon icon={faClock} className="size-3.5 mr-1 text-slate-400"/>
          Edit Log
        </Button>),
        },
    ];
    return (<DataTable columns={columns} data={records} pageSize={10} emptyState={<div className="py-8 text-center text-slate-500">
          No attendance records match the selected date or filters.
        </div>}/>);
}
