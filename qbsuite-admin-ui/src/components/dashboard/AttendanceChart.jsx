"use client";
import { AnalyticsChart } from '@/components/common/AnalyticsChart';
import { mockAttendanceTrend } from '@/lib/mock-data';
const data = mockAttendanceTrend.map((row) => ({ ...row, date: `2026-03-${row.date.split(' ')[1]}` }));
const series = [{ key: 'present', label: 'Present' }, { key: 'late', label: 'Late' }, { key: 'onLeave', label: 'On leave' }, { key: 'absent', label: 'Absent' }];
export function AttendanceChart() { return <AnalyticsChart title="Weekly Attendance Analysis" description="Workforce distribution" data={data} series={series} sample />; }
