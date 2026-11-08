'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
    faClock,
    faFileInvoice,
    faPlaneDeparture,
    faUserPlus,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { mockActivityTimeline } from '@/lib/mock-data';

const TYPE_STYLES = {
    checkin: { icon: faClock, classes: 'bg-brand-light text-brand' },
    lead: { icon: faUserPlus, classes: 'bg-sky-50 text-sky-600' },
    leave: { icon: faPlaneDeparture, classes: 'bg-amber-50 text-amber-600' },
    payroll: { icon: faFileInvoice, classes: 'bg-brand-light text-brand-dark' },
};

export function ActivityTimeline() {
    return (
        <Card className="border border-slate-200/90 bg-white shadow-xs">
            <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-bold text-slate-900">Recent Activities</CardTitle>
                <CardDescription className="mt-1 text-xs text-slate-500">
                    Latest events across your organization
                </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2">
                <ol className="relative ml-3 space-y-5 border-l-2 border-slate-100">
                    {mockActivityTimeline.map((activity) => {
                        const style = TYPE_STYLES[activity.type] ?? TYPE_STYLES.checkin;
                        return (
                            <li key={activity.id} className="relative pl-6">
                                <span
                                    className={`absolute -left-[15px] flex size-7 items-center justify-center rounded-full border-2 border-white shadow-xs ${style.classes}`}
                                >
                                    <FontAwesomeIcon icon={style.icon} className="size-3" />
                                </span>
                                <p className="text-sm font-medium leading-snug text-slate-800">
                                    {activity.description}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    <span className="font-semibold text-slate-600">{activity.employeeName}</span>
                                    {' · '}
                                    {activity.timestamp}
                                </p>
                            </li>
                        );
                    })}
                </ol>
            </CardContent>
        </Card>
    );
}
