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
                'relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300',
                onClick && 'cursor-pointer hover:-translate-y-0.5',
                className
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                        {title}
                    </p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-slate-900">
                            {value}
                        </span>
                        {change && (
                            <span
                                className={cn(
                                    'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold',
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
                            'flex size-11 items-center justify-center rounded-xl border shrink-0',
                            iconBg,
                            iconColor
                        )}
                    >
                        <KpiCardIcon icon={icon} className="size-5" />
                    </div>
                )}
            </div>
        </div>
    );
}

export function KpiGrid({ cards = [], className }) {
    return (
        <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
            {cards.map((card, i) => (
                <KpiCard key={i} {...card} />
            ))}
        </div>
    );
}

