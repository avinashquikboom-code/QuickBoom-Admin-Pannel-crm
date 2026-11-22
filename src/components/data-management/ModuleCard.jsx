'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faUsers,
  faBriefcase,
  faCalendarDays,
  faMoneyBillWave,
  faFileLines,
  faDatabase,
  faLayerGroup,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';

function getModuleIcon(id = '') {
  const lower = id.toLowerCase();
  if (lower.includes('customer') || lower.includes('contact')) return faUsers;
  if (lower.includes('lead') || lower.includes('crm') || lower.includes('deal')) return faBriefcase;
  if (lower.includes('attendance') || lower.includes('shift') || lower.includes('leave')) return faCalendarDays;
  if (lower.includes('expense') || lower.includes('payroll') || lower.includes('salary') || lower.includes('commission') || lower.includes('loan')) return faMoneyBillWave;
  if (lower.includes('proposal') || lower.includes('template') || lower.includes('document')) return faFileLines;
  if (lower.includes('master') || lower.includes('department') || lower.includes('designation')) return faLayerGroup;
  return faDatabase;
}

export function ModuleCard({
  module,
  recordsCount = 0,
  isSelected,
  onToggle,
  disabled = false,
}) {
  const icon = getModuleIcon(module.id);
  const tablesCount = module.tables?.length || 0;

  return (
    <label
      className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-150 min-h-[140px] select-none ${
        disabled
          ? 'cursor-not-allowed opacity-60 border-slate-200 bg-slate-50'
          : isSelected
          ? 'cursor-pointer border-[#163A2E] bg-[#E8F1EC]/40 shadow-xs ring-1 ring-[#163A2E]/20'
          : 'cursor-pointer border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                isSelected
                  ? 'bg-[#163A2E] text-white'
                  : 'bg-slate-100 text-slate-600 group-hover:bg-[#E8F1EC] group-hover:text-[#163A2E]'
              }`}
            >
              <FontAwesomeIcon icon={icon} className="size-3.5" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
              {module.name}
            </span>
          </div>

          <input
            type="checkbox"
            checked={isSelected}
            disabled={disabled}
            onChange={onToggle}
            className="size-4.5 rounded border-slate-300 text-[#163A2E] focus:ring-[#163A2E] accent-[#163A2E] cursor-pointer shrink-0 mt-0.5"
          />
        </div>

        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
          {module.available ? module.description : module.reason}
        </p>
      </div>

      <div className="pt-3 mt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
        <span className="font-semibold text-[#163A2E] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
          {Number(recordsCount).toLocaleString()} records
        </span>
        <span className="text-slate-400 font-medium">
          {tablesCount} {tablesCount === 1 ? 'table' : 'tables'}
        </span>
      </div>
    </label>
  );
}
