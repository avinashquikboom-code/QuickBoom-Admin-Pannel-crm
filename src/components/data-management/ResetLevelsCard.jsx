'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faLayerGroup,
  faBuilding,
  faGlobe,
  faLock,
} from '@fortawesome/free-solid-svg-icons';

export function ResetLevelsCard({ scope, onSelectScope, isSuperAdmin = false, busy = false }) {
  const levels = [
    {
      id: 'selected',
      title: 'Selected Modules',
      description: 'Reset only the specifically checked business modules.',
      icon: faLayerGroup,
      badge: 'Targeted',
      allowed: true,
    },
    {
      id: 'application',
      title: 'Full Tenant Reset',
      description: 'Reset all approved business modules for the active tenant.',
      icon: faBuilding,
      badge: 'Full Tenant',
      allowed: true,
    },
    {
      id: 'global',
      title: 'Global Reset',
      description: 'Reset data across every tenant in the database.',
      icon: faGlobe,
      badge: isSuperAdmin ? 'Global' : 'Super Admin Only',
      allowed: isSuperAdmin,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-xs sm:text-sm font-bold text-slate-900">Reset Levels</h3>
        <p className="text-[11px] text-slate-500">Choose the operational scope for data clearing</p>
      </div>

      <div className="space-y-2.5">
        {levels.map((level) => {
          const isSelected = scope === level.id;
          const isDisabled = !level.allowed || busy;

          return (
            <button
              key={level.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectScope(level.id)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex items-start gap-3 relative ${
                isDisabled
                  ? 'cursor-not-allowed opacity-50 border-slate-200 bg-slate-50'
                  : isSelected
                  ? 'cursor-pointer border-[#163A2E] bg-[#E8F1EC]/60 ring-1 ring-[#163A2E]/20 shadow-xs'
                  : 'cursor-pointer border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div
                className={`size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  isSelected ? 'bg-[#163A2E] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <FontAwesomeIcon icon={level.icon} className="size-3.5" />
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    {level.title}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      level.id === 'global'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {level.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {level.description}
                </p>
              </div>

              {/* Radio Indicator */}
              <div className="absolute right-3.5 top-4">
                <div
                  className={`size-4 rounded-full border flex items-center justify-center ${
                    isSelected
                      ? 'border-[#163A2E] bg-[#163A2E]'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
