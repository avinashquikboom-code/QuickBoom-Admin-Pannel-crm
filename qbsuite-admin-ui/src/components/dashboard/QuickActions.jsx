'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
    faBullhorn,
    faCalendarCheck,
    faFileInvoice,
    faListCheck,
    faUserPlus,
    faUserTie,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';

export function QuickActions() {
    const router = useRouter();

    const actions = [
        {
            label: 'Add Employee',
            description: 'Onboard a new team member',
            icon: faUserTie,
            onClick: () => router.push('/admin/hrm/employees'),
        },
        {
            label: 'Add Lead',
            description: 'Capture a new sales lead',
            icon: faUserPlus,
            onClick: () => router.push('/admin/crm/leads'),
        },
        {
            label: 'Create Task',
            description: 'Assign work to your team',
            icon: faListCheck,
            onClick: () => router.push('/admin/production/dashboard'),
        },
        {
            label: 'Approve Leave',
            description: 'Review pending requests',
            icon: faCalendarCheck,
            onClick: () => router.push('/admin/hrm/leaves'),
        },
        {
            label: 'Generate Payslip',
            description: 'Run payroll documents',
            icon: faFileInvoice,
            onClick: () => router.push('/admin/hrm/salary-slips'),
        },
        {
            label: 'Send Announcement',
            description: 'Broadcast to employees',
            icon: faBullhorn,
            onClick: () => router.push('/admin/hrm/announcements'),
        },
    ];

    return (
        <Card className="border border-slate-200/90 bg-white shadow-xs">
            <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-bold text-slate-900">Quick Actions</CardTitle>
                <CardDescription className="mt-1 text-xs text-slate-500">
                    Jump straight into common admin tasks
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 p-5 pt-2 sm:grid-cols-3 lg:grid-cols-6">
                {actions.map((action) => (
                    <button
                        key={action.label}
                        type="button"
                        onClick={action.onClick}
                        className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:border-brand-light hover:shadow-md"
                    >
                        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-light text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                            <FontAwesomeIcon icon={action.icon} className="size-4.5" />
                        </span>
                        <span className="text-xs font-semibold text-slate-800">{action.label}</span>
                        <span className="text-[10px] leading-tight text-slate-500">
                            {action.description}
                        </span>
                    </button>
                ))}
            </CardContent>
        </Card>
    );
}
