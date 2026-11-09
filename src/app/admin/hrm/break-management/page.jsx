'use client';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { faCheckCircle, faClock, faMagnifyingGlass, faMugHot, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { hrmError, loadBreaks } from '@/modules/hrm/hrm-api';
import { HrmNotice } from '@/modules/hrm/HrmNotice';
export default function BreakManagementPage() {
    const [breaks, setBreaks] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    React.useEffect(() => {
        let active = true;
        loadBreaks().then((result) => { if (active) setBreaks(result.records); }).catch((err) => { if (active) setError(hrmError(err)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);
    const [search, setSearch] = React.useState('');
    const [selectedType, setSelectedType] = React.useState('all');
    const filtered = React.useMemo(() => {
        return breaks.filter((b) => {
            const matchSearch = b.employeeName.toLowerCase().includes(search.toLowerCase()) ||
                b.employeeId.toLowerCase().includes(search.toLowerCase());
            const matchType = selectedType === 'all' || b.breakType === selectedType;
            return matchSearch && matchType;
        });
    }, [breaks, search, selectedType]);
    const columns = [
        {
            header: 'Employee',
            cell: (rec) => (<div className="flex items-center gap-3">
          <Avatar className="size-8 border border-slate-200">
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
            header: 'Break Type',
            cell: (rec) => (<Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-medium text-xs shadow-none">
          {rec.breakType}
        </Badge>),
        },
        {
            header: 'Start Time',
            cell: (rec) => (<span className="font-mono text-xs font-medium text-slate-700">
          {rec.startTime}
        </span>),
        },
        {
            header: 'End Time',
            cell: (rec) => (<span className="font-mono text-xs font-medium text-slate-700">
          {rec.endTime || (<span className="text-brand-dark font-bold animate-pulse">In Progress</span>)}
        </span>),
        },
        {
            header: 'Duration',
            cell: (rec) => (<span className="font-semibold text-xs text-slate-900">
          {rec.duration}
        </span>),
        },
        {
            header: 'Policy Compliance',
            cell: (rec) => {
                if (rec.status === 'exceeded') {
                    return (<span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
              <FontAwesomeIcon icon={faTriangleExclamation} className="size-3"/>
              Overstay (+{rec.overstayMinutes}m)
            </span>);
                }
                if (rec.status === 'active') {
                    return (<span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-dark bg-brand-light border border-brand-light px-2 py-0.5 rounded">
              <FontAwesomeIcon icon={faClock} className="size-3"/>
              Active Now
            </span>);
                }
                return (<span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-dark bg-brand-light border border-brand-light px-2 py-0.5 rounded">
            <FontAwesomeIcon icon={faCheckCircle} className="size-3"/>
            Within Policy
          </span>);
            },
        },
    ];
    return (<div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Break & Interval Management" description="Monitor lunch and short break durations in compliance with workplace time policies." />

      {/* Break Policy KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Standard Lunch Policy
            </span>
            <FontAwesomeIcon icon={faMugHot} className="size-4 text-brand"/>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">60 Minutes</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Default allocated midday window
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-brand-light bg-brand-light/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-brand-dark uppercase">
              Active On Break Now
            </span>
            <FontAwesomeIcon icon={faClock} className="size-4 text-brand"/>
          </div>
          <p className="text-xl font-bold text-brand-dark mt-1">1 Employee</p>
          <p className="text-[11px] text-brand mt-0.5">
            Priya Sharma (Product Design)
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700 uppercase">
              Policy Overstay Flags
            </span>
            <FontAwesomeIcon icon={faTriangleExclamation} className="size-4 text-rose-600"/>
          </div>
          <p className="text-xl font-bold text-rose-800 mt-1">2 Flags Today</p>
          <p className="text-[11px] text-rose-600 mt-0.5">
            Automatically flagged for review
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1 sm:max-w-xs">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"/>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by employee name..." className="h-9 pl-8 pr-3 text-xs border-slate-200 bg-slate-50/50 focus-visible:bg-white"/>
        </div>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="h-9 text-xs border-slate-200 w-44 bg-slate-50/50">
            <SelectValue placeholder="Break Type"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All Break Types
            </SelectItem>
            <SelectItem value="Lunch Break" className="text-xs">
              Lunch Break
            </SelectItem>
            <SelectItem value="Coffee Break" className="text-xs">
              Coffee Break
            </SelectItem>
            <SelectItem value="Personal Break" className="text-xs">
              Personal Break
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <HrmNotice loading={loading} error={error} />
      {!loading && !error && <DataTable hideToolbar columns={columns} data={filtered} pageSize={8} emptyState={<div className="py-8 text-center text-slate-500">No break logs recorded.</div>}/>}
    </div>);
}
