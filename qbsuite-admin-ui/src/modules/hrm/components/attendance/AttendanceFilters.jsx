'use client';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { mockDepartments } from '@/lib/mock-data';
import { faDownload, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
export function AttendanceFilters({ search, onSearchChange, selectedDept, onDeptChange, selectedStatus, onStatusChange, onExport, }) {
    return (<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
      <div className="relative flex-1 sm:max-w-xs">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"/>
        <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search by employee name or ID..." className="h-9 pl-8 pr-3 text-xs border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-brand"/>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={selectedDept} onValueChange={onDeptChange}>
          <SelectTrigger className="h-9 text-xs border-slate-200 w-44 bg-slate-50/50">
            <SelectValue placeholder="Department"/>
          </SelectTrigger>
          <SelectContent>
            {mockDepartments.map((dept) => (<SelectItem key={dept} value={dept} className="text-xs">
                {dept}
              </SelectItem>))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="h-9 text-xs border-slate-200 w-32 bg-slate-50/50">
            <SelectValue placeholder="Status"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All Status
            </SelectItem>
            <SelectItem value="present" className="text-xs">
              Present
            </SelectItem>
            <SelectItem value="late" className="text-xs">
              Late
            </SelectItem>
            <SelectItem value="half_day" className="text-xs">
              Half Day
            </SelectItem>
            <SelectItem value="on_leave" className="text-xs">
              On Leave
            </SelectItem>
            <SelectItem value="absent" className="text-xs">
              Absent
            </SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={onExport} className="h-9 border-slate-200 text-slate-700 hover:text-brand-dark text-xs px-3">
          <FontAwesomeIcon icon={faDownload} className="size-3.5 mr-1 text-slate-400"/>
          Export
        </Button>
      </div>
    </div>);
}
