"use client";
import { AnalyticsChart } from '@/components/common/AnalyticsChart';
import { dashboardAnalytics } from '../data/dashboard-analytics';
const series = [{"key": "active", "label": "Active customers"}, {"key": "newCustomers", "label": "New customers"}];
export function CustomerGrowthChart({ data = dashboardAnalytics, loading = false, sample = true } = {}) {
  return <AnalyticsChart title="Customer Growth" description="Active and new customer accounts" kind="area" monetary={false} data={data} series={series} loading={loading} sample={sample} />;
}
