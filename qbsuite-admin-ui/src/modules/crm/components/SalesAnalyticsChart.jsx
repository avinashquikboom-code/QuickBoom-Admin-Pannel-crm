"use client";
import { AnalyticsChart } from '@/components/common/AnalyticsChart';
import { dashboardAnalytics } from '../data/dashboard-analytics';
const series = [{"key": "sales", "label": "Sales"}, {"key": "target", "label": "Target"}];
export function SalesAnalyticsChart({ data = dashboardAnalytics, loading = false, sample = true } = {}) {
  return <AnalyticsChart title="Sales Analytics" description="Won sales compared with targets" kind="bar" monetary={true} data={data} series={series} loading={loading} sample={sample} />;
}
