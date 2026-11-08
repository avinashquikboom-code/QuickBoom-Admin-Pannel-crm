"use client";
import { AnalyticsChart } from '@/components/common/AnalyticsChart';
import { mockLeadsTrend } from '@/lib/mock-data';
const months = { Mar: '03' };
const data = mockLeadsTrend.map((row) => ({ ...row, date: `2026-${months[row.date.split(' ')[0]]}-${row.date.split(' ')[1].padStart(2,'0')}` }));
const series = [{ key: 'leads', label: 'Leads' }];
export function LeadsOverviewChart() { return <AnalyticsChart title="Leads Overview" description="Lead captures by date" data={data} series={series} sample />; }
