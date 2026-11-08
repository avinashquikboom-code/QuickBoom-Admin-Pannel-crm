'use client';
import { formatCurrency } from "@/lib/currency";


import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faTrophy } from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { mockTopPerformers } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const RANGES = ['This Month', 'Last Month'];

const RANK_STYLES = [
    'bg-amber-100 text-amber-700',
    'bg-slate-200 text-slate-600',
    'bg-orange-100 text-orange-700',
];

function initials(name) {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

export function TopPerformers() {
    const [range, setRange] = React.useState('This Month');

    return (
        <Card className="border border-slate-200/90 bg-white shadow-xs">
            <CardHeader className="p-5 pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faTrophy} className="size-4 text-amber-500" />
                        <div>
                            <CardTitle className="text-base font-bold text-slate-900">
                                Top Performing Employees
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs text-slate-500">
                                Ranked by revenue generated
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                        {RANGES.map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setRange(r)}
                                className={cn(
                                    'rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors',
                                    range === r
                                        ? 'bg-white text-brand-dark shadow-xs'
                                        : 'text-slate-500 hover:text-slate-700'
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-5 pt-2">
                <ul className="divide-y divide-slate-100">
                    {mockTopPerformers.map((person, index) => (
                        <li key={person.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                            <span
                                className={cn(
                                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                                    RANK_STYLES[index] ?? 'bg-slate-100 text-slate-500'
                                )}
                            >
                                {index + 1}
                            </span>
                            <Avatar className="size-9 border border-slate-200">
                                <AvatarImage src={person.avatar} alt={person.name} />
                                <AvatarFallback className="bg-brand-light text-brand-dark text-xs font-semibold">
                                    {initials(person.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-900">{person.name}</p>
                                <p className="truncate text-xs text-slate-500">{person.designation}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-900">
                                    {formatCurrency(person.revenue)}
                                </p>
                                <p className="text-[11px] font-medium text-brand-dark">
                                    {person.conversions} conversions
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
