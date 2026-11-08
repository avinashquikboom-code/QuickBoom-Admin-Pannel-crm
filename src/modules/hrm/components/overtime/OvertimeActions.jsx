'use client';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/common/Tabs';
import { Input } from '@/components/common/Input';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
export function OvertimeActions({ activeTab, onTabChange, search, onSearchChange, counts, }) {
    return (<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-auto">
        <TabsList className="bg-slate-100 p-1 h-9">
          <TabsTrigger value="all" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-brand-dark">
            All ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-brand-dark">
            Pending ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value="approved" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-brand-dark">
            Approved ({counts.approved})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-brand-dark">
            Rejected ({counts.rejected})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative w-full sm:w-64">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"/>
        <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search employee, project..." className="h-9 pl-8 pr-3 text-xs border-slate-200 bg-slate-50/50 focus-visible:bg-white"/>
      </div>
    </div>);
}
