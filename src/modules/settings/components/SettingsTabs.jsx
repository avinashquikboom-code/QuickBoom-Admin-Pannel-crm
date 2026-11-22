'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';

export function SettingsTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="relative border-b border-[#E2E8E5] bg-white rounded-xl shadow-2xs p-1.5 sm:p-2">
      <nav
        className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none"
        aria-label="Settings Tabs"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                isActive
                  ? 'bg-[#163A2E] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-[#E8F1EC] hover:text-[#163A2E]'
              }`}
            >
              <FontAwesomeIcon
                icon={tab.icon}
                className={`size-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
