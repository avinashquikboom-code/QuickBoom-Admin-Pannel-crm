"use client";
import { AnalyticsChart } from '@/components/common/AnalyticsChart';
import { dashboardAnalytics } from '../data/dashboard-analytics';
const series = [{"key": "gross", "label": "Gross pay"}, {"key": "net", "label": "Net pay"}];
export function PayrollAnalyticsChart({ data = dashboardAnalytics, loading = false, sample = true } = {}) {
  return <AnalyticsChart title="Payroll Analytics" description="Gross payroll compared with net disbursement" kind="bar" monetary={true} data={data} series={series} loading={loading} sample={sample} />;
}
