'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
    faCircleCheck,
    faCircleExclamation,
    faListCheck,
    faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { mockTaskSummary } from '@/lib/mock-data';

const ITEMS = [
    {
        key: 'total',
        label: 'Total Tasks',
        value: mockTaskSummary.total,
        icon: faListCheck,
        iconColor: 'text-brand',
        iconBg: 'bg-brand-light',
    },
    {
        key: 'inProgress',
        label: 'In Progress',
        value: mockTaskSummary.inProgress,
        icon: faSpinner,
        iconColor: 'text-sky-600',
        iconBg: 'bg-sky-50',
    },
    {
        key: 'completed',
        label: 'Completed',
        value: mockTaskSummary.completed,
        icon: faCircleCheck,
        iconColor: 'text-brand-dark',
        iconBg: 'bg-brand-light',
    },
    {
        key: 'overdue',
        label: 'Overdue',
        value: mockTaskSummary.overdue,
        icon: faCircleExclamation,
        iconColor: 'text-rose-600',
        iconBg: 'bg-rose-50',
    },
];

export function TaskSummaryCards() {
    return (
        <Card className="border border-slate-200/90 bg-white shadow-xs">
            <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-bold text-slate-900">Task Summary</CardTitle>
                <CardDescription className="mt-1 text-xs text-slate-500">
                    Team task status across all projects
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 p-5 pt-2">
                {ITEMS.map((item) => (
                    <div
                        key={item.key}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition-colors hover:border-brand-light"
                    >
                        <div
                            className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${item.iconBg} ${item.iconColor}`}
                        >
                            <FontAwesomeIcon icon={item.icon} className="size-4.5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl font-bold leading-tight text-slate-900">{item.value}</p>
                            <p className="truncate text-[11px] font-medium text-slate-500">{item.label}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
