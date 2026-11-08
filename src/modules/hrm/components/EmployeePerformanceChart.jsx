"use client";
import { AnalyticsChart } from '@/components/common/AnalyticsChart';
import { dashboardAnalytics } from '../data/dashboard-analytics';
const series = [{"key": "completed", "label": "Completed"}, {"key": "assigned", "label": "Assigned"}];
export function EmployeePerformanceChart({ data = dashboardAnalytics, loading = false, sample = true } = {}) {
  return <AnalyticsChart title="Employee Performance" description="Tasks completed by the workforce" kind="line" monetary={false} data={data} series={series} loading={loading} sample={sample} />;
}
