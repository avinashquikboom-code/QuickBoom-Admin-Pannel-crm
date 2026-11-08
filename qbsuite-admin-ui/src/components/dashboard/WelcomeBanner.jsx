'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faChartLine, faRocket, faUsers } from '@fortawesome/free-solid-svg-icons';

function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
}

const subscribe = () => () => {};

export function WelcomeBanner() {
    // Current time is unstable during prerender; resolve it client-side.
    const salutation = React.useSyncExternalStore(subscribe, greeting, () => 'Welcome');
    return (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sidebar via-sidebar-secondary to-brand-dark p-6 sm:p-8 text-white shadow-md">
            {/* Decorative illustration (pure CSS, right side) */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-64 sm:block">
                <div className="absolute -right-10 -top-10 size-44 rounded-full bg-white/10" />
                <div className="absolute right-16 top-10 size-24 rounded-full bg-white/10" />
                <div className="absolute right-6 bottom-4 flex items-end gap-2">
                    <span className="w-3 rounded-t-md bg-brand/80" style={{ height: '2.5rem' }} />
                    <span className="w-3 rounded-t-md bg-brand" style={{ height: '3.5rem' }} />
                    <span className="w-3 rounded-t-md bg-white/70" style={{ height: '2rem' }} />
                    <span className="w-3 rounded-t-md bg-brand-light/90" style={{ height: '4.5rem' }} />
                </div>
            </div>

            <div className="relative max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                    QB Suite Admin Panel
                </p>
                <h1 className="mt-1.5 text-2xl font-bold sm:text-3xl">
                    {salutation}, Admin
                </h1>
                <p className="mt-2 text-sm text-white/80">
                    Here&apos;s what&apos;s happening in your organization today.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-white/80">
                    <span className="inline-flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faUsers} className="size-3.5 text-brand-light" />
                        Workforce
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faChartLine} className="size-3.5 text-brand-light" />
                        Sales
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faRocket} className="size-3.5 text-brand-light" />
                        Operations
                    </span>
                </div>
            </div>
        </section>
    );
}
