"use client";
import { AnalyticsChart } from '@/components/common/AnalyticsChart';
import { dashboardAnalytics } from '../data/dashboard-analytics';
const series = [{"key": "revenue", "label": "Revenue"}];
export function MonthlyRevenueChart({ data = dashboardAnalytics, loading = false, sample = true } = {}) {
  return <AnalyticsChart title="Monthly Revenue" description="Revenue received by month" kind="area" monetary={true} data={data} series={series} loading={loading} sample={sample} />;
}
