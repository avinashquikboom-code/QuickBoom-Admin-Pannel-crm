'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { cn } from '@/lib/utils';

function isFontAwesomeIconDefinition(icon) {
    return Boolean(icon && typeof icon === 'object' && 'iconName' in icon);
}

function KpiCardIcon({ icon, className }) {
    if (!icon) {
        return null;
    }
    if (isFontAwesomeIconDefinition(icon)) {
        return <FontAwesomeIcon icon={icon} className={className} />;
    }
    return React.createElement(icon, { className, strokeWidth: 2, 'aria-hidden': true });
}

export function KpiCard({
    title,
    value,
    change,
    changeType = 'positive',
    icon,
    iconColor = 'text-brand',
    iconBg = 'bg-brand/10 border-brand/20',
    description,
    className,
    onClick,
}) {
    return (
        <div
            onClick={onClick}
            className={cn(
                'relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 min-w-0 h-full flex flex-col justify-between',
                onClick && 'cursor-pointer hover:-translate-y-0.5',
                className
            )}
        >
            <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                        {title}
                    </p>
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
                            {value}
                        </span>
                        {change && (
                            <span
                                className={cn(
                                    'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold shrink-0',
                                    changeType === 'positive'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : changeType === 'negative'
                                        ? 'bg-rose-50 text-rose-700'
                                        : 'bg-slate-100 text-slate-600'
                                )}
                            >
                                {change}
                            </span>
                        )}
                    </div>
                    {description && (
                        <p className="text-xs text-slate-400 mt-1 truncate">
                            {description}
                        </p>
                    )}
                </div>

                {icon && (
                    <div
                        className={cn(
                            'flex size-10 sm:size-11 items-center justify-center rounded-xl border shrink-0',
                            iconBg,
                            iconColor
                        )}
                    >
                        <KpiCardIcon icon={icon} className="size-4.5 sm:size-5" />
                    </div>
                )}
            </div>
        </div>
    );
}

export function KpiGrid({ cards = [], items, className }) {
    const list = cards.length ? cards : items || [];
    return (
        <div className={cn('grid grid-cols-1 min-[440px]:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full', className)}>
            {list.map((card, i) => (
                <KpiCard key={i} {...card} />
            ))}
        </div>
    );
}

