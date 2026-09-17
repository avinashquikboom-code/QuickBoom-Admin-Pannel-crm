'use client';

import React from 'react';

export interface AdminStatusTabItem<T = string> {
  key: T;
  label: string;
  count?: number | string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface AdminStatusTabsProps<T = string> {
  tabs: AdminStatusTabItem<T>[];
  activeTab: T;
  onChange: (key: T) => void;
  className?: string;
  autoSortAlphabetical?: boolean;
}

export function sortTabsAlphabetical<T>(tabs: AdminStatusTabItem<T>[]): AdminStatusTabItem<T>[] {
  const allTab = tabs.find((t) => t.label.trim().toLowerCase().startsWith('all'));
  const otherTabs = tabs.filter((t) => t !== allTab);

  otherTabs.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

  return allTab ? [allTab, ...otherTabs] : otherTabs;
}

export function AdminStatusTabs<T extends string | number>({
  tabs,
  activeTab,
  onChange,
  className = '',
  autoSortAlphabetical = true,
}: AdminStatusTabsProps<T>) {
  const displayTabs = autoSortAlphabetical ? sortTabsAlphabetical(tabs) : tabs;

  return (
    <div className={`flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 ${className}`}>
      {displayTabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;

        return (
          <button
            key={String(tab.key)}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 select-none ${
              isActive
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
