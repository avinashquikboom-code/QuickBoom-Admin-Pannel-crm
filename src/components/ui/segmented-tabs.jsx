'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function SegmentedTabs({
    tabs = [],
    value,
    onChange,
    className,
    ariaLabel = 'Filter tabs',
}) {
    return (
        <div
            role="tablist"
            aria-label={ariaLabel}
            className={cn(
                'inline-flex items-center gap-1 rounded-xl bg-slate-100/80 p-1 border border-slate-200/60 overflow-x-auto max-w-full scrollbar-none',
                className
            )}
        >
            {tabs.map((tab) => {
                const isActive = value === tab.value;
                return (
                    <button
                        key={tab.value}
                        role="tab"
                        type="button"
                        aria-selected={isActive}
                        onClick={() => onChange?.(tab.value)}
                        className={cn(
                            'group relative inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-brand/40',
                            isActive
                                ? 'bg-brand-light text-brand-dark font-semibold shadow-2xs border border-brand/20'
                                : 'text-slate-500 hover:bg-white/60 hover:text-slate-900'
                        )}
                    >
                        <span>{tab.label}</span>
                        {typeof tab.count !== 'undefined' && tab.count !== null && (
                            <span
                                className={cn(
                                    'inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums min-w-4.5',
                                    isActive
                                        ? 'bg-brand/20 text-brand-dark'
                                        : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300 group-hover:text-slate-700'
                                )}
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

