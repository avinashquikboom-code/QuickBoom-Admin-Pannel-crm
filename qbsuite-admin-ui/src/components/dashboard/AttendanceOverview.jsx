"use client";
import { AnalyticsChart } from '@/components/common/AnalyticsChart';
import { mockAttendanceOverview } from '@/lib/mock-data';
const series = [{ key: 'present', label: 'Present' }, { key: 'onLeave', label: 'On leave' }, { key: 'absent', label: 'Absent' }, { key: 'notCheckedIn', label: 'Not checked in' }];
const data = [{ date: '2026-03-24', ...mockAttendanceOverview }];
export function AttendanceOverview() { return <AnalyticsChart title="Attendance Overview" description="Workforce check-in distribution" data={data} series={series} kind="pie" sample />; }
