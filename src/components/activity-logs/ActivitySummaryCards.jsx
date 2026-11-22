'use client';

import * as React from 'react';
import { Layers, PlusCircle, RefreshCw, Trash2 } from 'lucide-react';

export function ActivitySummaryCards({
  total = 0,
  creates = 0,
  updates = 0,
  deletes = 0,
  loading = false,
  className = '',
}) {
  const cards = [
    {
      id: 'total',
      label: 'Total Logs',
      value: total,
      description: 'Audit records logged',
      icon: Layers,
      iconContainer: 'bg-[#E8F1EC] text-[#163A2E] border-emerald-100',
      valueColor: 'text-slate-900',
    },
    {
      id: 'creates',
      label: 'Creates',
      value: creates,
      description: 'New entities created',
      icon: PlusCircle,
      iconContainer: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      valueColor: 'text-emerald-700',
    },
    {
      id: 'updates',
      label: 'Updates',
      value: updates,
      description: 'Modifications & edits',
      icon: RefreshCw,
      iconContainer: 'bg-blue-50 text-blue-700 border-blue-200/80',
      valueColor: 'text-blue-700',
    },
    {
      id: 'deletes',
      label: 'Deletes',
      value: deletes,
      description: 'Purged / deleted records',
      icon: Trash2,
      iconContainer: 'bg-rose-50 text-rose-700 border-rose-200/80',
      valueColor: 'text-rose-700',
    },
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 min-w-0 transition-all hover:border-slate-300"
          >
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                {card.label}
              </span>
              <p className={`text-xl sm:text-2xl font-extrabold tracking-tight ${card.valueColor}`}>
                {loading ? (
                  <span className="inline-block h-6 w-14 animate-pulse rounded bg-slate-100" />
                ) : (
                  Number(card.value || 0).toLocaleString()
                )}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {card.description}
              </p>
            </div>

            <div
              className={`flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl border shadow-2xs ${card.iconContainer}`}
            >
              <Icon className="size-5 sm:size-6" aria-hidden="true" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
