'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Database,
  Building2,
  Award,
  Users,
  Calendar,
  FileText,
  Briefcase,
  Activity,
  CheckSquare,
  Kanban,
  Target,
  Layers,
  CreditCard,
  DollarSign,
  Banknote,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

import { AdminPageHeader, AdminButton } from '@/components/admin';

export default function MasterHubPage() {
  const { data: summaryRes, isLoading, refetch } = useQuery({
    queryKey: ['master-summary'],
    queryFn: async () => {
      const res: any = await api.get('/master/summary');
      return res?.data || res || {};
    },
  });

  const summary = summaryRes?.data || summaryRes || {};

  const masterModules = [
    {
      title: 'Departments',
      href: '/master/departments',
      icon: Building2,
      count: summary.departmentsCount,
      countLabel: 'Active Departments',
      description: 'Centralized HRM departments, codes, and assigned personnel counts.',
      category: 'Workforce',
      color: '#3B82F6',
    },
    {
      title: 'Designations',
      href: '/master/designations',
      icon: Award,
      count: summary.designationsCount,
      countLabel: 'Active Designations',
      description: 'Role titles, hierarchy levels, and department-linked designations.',
      category: 'Workforce',
      color: '#8B5CF6',
    },
    {
      title: 'Employee Types',
      href: '/master/employee-types',
      icon: Users,
      count: summary.totalEmployees,
      countLabel: 'Workforce Members',
      description: 'Classification for full-time on-roll staff and gig/freelancer contractors.',
      category: 'Workforce',
      color: '#10B981',
    },
    {
      title: 'Leave Types',
      href: '/master/leave-types',
      icon: Calendar,
      count: summary.leaveTypesCount,
      countLabel: 'Leave Types',
      description: 'Annual quota, carry-forward rules, and paid/unpaid classifications.',
      category: 'HRM & Leave',
      color: '#F59E0B',
    },
    {
      title: 'Leave Policies',
      href: '/master/leave-policies',
      icon: FileText,
      count: 'Configured',
      countLabel: 'Policy Rules',
      description: 'Approval workflows, backdated application limits, and weekend inclusions.',
      category: 'HRM & Leave',
      color: '#6366F1',
    },
    {
      title: 'Work Types',
      href: '/master/work-types',
      icon: Briefcase,
      count: summary.totalWorkItems,
      countLabel: 'Active Work Items',
      description: 'Deliverable categories across Reels, video editing, posts, shoots, and ads.',
      category: 'Production',
      color: '#06B6D4',
    },
    {
      title: 'Activity Types',
      href: '/master/activity-types',
      icon: Activity,
      count: '8 Types',
      countLabel: 'Supported Channels',
      description: 'Calendar schedules, client shoots, review sessions, and CRM touchpoints.',
      category: 'Production',
      color: '#EC4899',
    },
    {
      title: 'Task Status',
      href: '/master/task-status',
      icon: CheckSquare,
      count: '9 Stages',
      countLabel: 'Pipeline States',
      description: 'Lifecycle stages tracking internal assignments to customer app approval.',
      category: 'Production',
      color: '#14B8A6',
    },
    {
      title: 'Lead Stages',
      href: '/master/lead-stages',
      icon: Kanban,
      count: summary.leadStagesCount,
      countLabel: 'Active Pipeline Stages',
      description: 'Dynamic CRM sales funnel stages with drag-and-drop sort ordering.',
      category: 'Sales & CRM',
      color: '#EA580C',
    },
    {
      title: 'Lead Sources',
      href: '/master/lead-sources',
      icon: Target,
      count: summary.totalLeads,
      countLabel: 'Total Leads Tracked',
      description: 'Inbound and outbound customer acquisition channels and attribution.',
      category: 'Sales & CRM',
      color: '#E11D48',
    },
    {
      title: 'Subscription Plans',
      href: '/master/subscription-plans',
      icon: Layers,
      count: summary.plansCount,
      countLabel: 'Pricing Packages',
      description: 'SaaS recurring subscription plans, user quotas, and creative service limits.',
      category: 'Billing',
      color: '#4F46E5',
    },
    {
      title: 'Expense Categories',
      href: '/master/expense-categories',
      icon: CreditCard,
      count: summary.totalClaims,
      countLabel: 'Claims Processed',
      description: 'Eligible reimbursement expense heads and monthly policy ceilings.',
      category: 'Payroll & HRM',
      color: '#059669',
    },
    {
      title: 'Loan Types',
      href: '/master/loan-types',
      icon: DollarSign,
      count: summary.totalLoans,
      countLabel: 'Loans Recorded',
      description: 'Workforce emergency loans, equipment financing, and advance salary rules.',
      category: 'Payroll & HRM',
      color: '#D97706',
    },
    {
      title: 'Payment Methods',
      href: '/master/payment-methods',
      icon: Banknote,
      count: 'Configured',
      countLabel: 'Gateways & Offline',
      description: 'Razorpay checkout configuration, offline bank transfers, and receipts.',
      category: 'Billing',
      color: '#0284C7',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <AdminPageHeader
        title="System Master Reference Data"
        description="Centralized single source of truth for all reusable master records, categories, workflows, and system policies used across HRM, CRM, Production, and Billing."
        icon={Database}
        iconColor="text-indigo-600"
        badge={{
          text: 'Master Data Registry',
          icon: Database,
          variant: 'indigo',
        }}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Master Data' },
        ]}
        actions={
          <AdminButton
            variant="outline"
            size="md"
            icon={RefreshCw}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Refresh Counts
          </AdminButton>
        }
      />

      {/* Grid of 14 Master Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {masterModules.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link
              key={idx}
              href={item.href}
              className="group p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#23C45E]/40 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: item.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {item.category}
                  </span>
                </div>

                <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-base font-black text-slate-900 block leading-none">
                    {item.count !== undefined ? item.count : '—'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    {item.countLabel}
                  </span>
                </div>

                <div className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-[#23C45E] flex items-center justify-center transition-colors">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
