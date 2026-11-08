'use client';

import * as React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { mockLeadPipelineStages } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

// Progressive green shades from light to primary across the pipeline.
const STAGE_STYLES = [
    'bg-brand-light text-brand-dark',
    'bg-primary-muted text-brand-dark',
    'bg-primary-border/70 text-brand-dark',
    'bg-primary-highlight/35 text-sidebar',
    'bg-brand text-primary-foreground',
];

export function LeadPipeline() {
    const total = mockLeadPipelineStages.reduce((sum, s) => sum + s.count, 0);

    return (
        <Card className="border border-slate-200/90 bg-white shadow-xs">
            <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <CardTitle className="text-base font-bold text-slate-900">
                            Lead Pipeline
                        </CardTitle>
                        <CardDescription className="mt-1 text-xs text-slate-500">
                            {total} leads across {mockLeadPipelineStages.length} stages
                        </CardDescription>
                    </div>
                    <Link
                        href="/admin/crm/leads"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark"
                    >
                        View All
                        <FontAwesomeIcon icon={faArrowRight} className="size-3" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="p-5 pt-2">
                <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1">
                    {mockLeadPipelineStages.map((stage, index) => (
                        <React.Fragment key={stage.stage}>
                            <div
                                className={cn(
                                    'flex min-w-24 flex-1 flex-col items-center justify-center rounded-xl px-3 py-4 text-center transition-transform hover:-translate-y-0.5',
                                    STAGE_STYLES[index % STAGE_STYLES.length]
                                )}
                            >
                                <span className="text-xl font-bold leading-none">{stage.count}</span>
                                <span className="mt-1.5 text-[11px] font-semibold">{stage.stage}</span>
                            </div>
                            {index < mockLeadPipelineStages.length - 1 && (
                                <div className="flex items-center text-slate-300">
                                    <FontAwesomeIcon icon={faArrowRight} className="size-3" />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
