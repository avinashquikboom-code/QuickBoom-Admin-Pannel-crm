"use client";
import { AnalyticsChart } from '@/components/common/AnalyticsChart';
import { dashboardAnalytics } from '../data/dashboard-analytics';
const series = [{"key": "completed", "label": "Completed"}, {"key": "pending", "label": "Pending"}];
export function ProductionOverviewChart({ data = dashboardAnalytics, loading = false, sample = true } = {}) {
  return <AnalyticsChart title="Production Overview" description="Production orders by completion status" kind="bar" monetary={false} data={data} series={series} loading={loading} sample={sample} />;
}
