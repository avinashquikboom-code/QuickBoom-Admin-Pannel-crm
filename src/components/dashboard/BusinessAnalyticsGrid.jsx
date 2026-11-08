'use client';
import { MonthlyRevenueChart } from '@/modules/crm/components/MonthlyRevenueChart';
import { SalesAnalyticsChart } from '@/modules/crm/components/SalesAnalyticsChart';
import { EmployeePerformanceChart } from '@/modules/hrm/components/EmployeePerformanceChart';
import { PayrollAnalyticsChart } from '@/modules/hrm/components/PayrollAnalyticsChart';
import { ProductionOverviewChart } from '@/modules/production/components/ProductionOverviewChart';
import { CustomerGrowthChart } from '@/modules/customer/components/CustomerGrowthChart';
export function BusinessAnalyticsGrid() { return <section aria-label="Business analytics" className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2"><MonthlyRevenueChart /><SalesAnalyticsChart /><EmployeePerformanceChart /><PayrollAnalyticsChart /><ProductionOverviewChart /><CustomerGrowthChart /></section>; }
