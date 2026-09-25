'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface AdminStatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  iconBg?: 'primary' | 'blue' | 'purple' | 'amber' | 'rose' | 'slate';
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AdminStatCard({
  title,
  value,
  description,
  icon: Icon,
  iconBg = 'primary',
  trend,
  trendType = 'positive',
  loading = false,
  onClick,
  className = '',
}: AdminStatCardProps) {
  const bgMap = {
    primary: 'bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/20',
    blue: 'bg-blue-50 text-blue-600 border border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border border-purple-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
  };

  const trendColors = {
    positive: 'text-[#1AA14D]',
    negative: 'text-rose-600',
    neutral: 'text-slate-500',
  };

  const TrendIcon = trendType === 'positive' ? TrendingUp : trendType === 'negative' ? TrendingDown : Minus;

  if (loading) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs animate-pulse space-y-3 min-w-0">
        <div className="h-3 bg-slate-200 rounded-md w-24" />
        <div className="h-7 bg-slate-200 rounded-md w-16" />
        <div className="h-3 bg-slate-100 rounded-md w-32" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between transition-all duration-200 min-w-0 min-h-[110px] ${
        onClick ? 'cursor-pointer hover:border-[#23C45E] hover:shadow-sm active:scale-[0.99]' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2 min-w-0">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate block">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${bgMap[iconBg]}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-2 min-w-0">
        <p className="text-2xl font-black text-slate-900 tracking-tight truncate break-words">
          {value}
        </p>

        {(description || trend) && (
          <div className="flex items-center gap-1.5 mt-1 min-w-0 flex-wrap">
            {trend && (
              <span className={`inline-flex items-center gap-0.5 text-[11px] font-extrabold ${trendColors[trendType]}`}>
                <TrendIcon className="w-3 h-3" />
                {trend}
              </span>
            )}
            {description && (
              <span className="text-[11px] font-medium text-slate-500 truncate">
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const StatCard = AdminStatCard;
export type StatCardProps = AdminStatCardProps;
