'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export interface AdminFormPageProps {
  title: string;
  description?: string;
  backHref: string;
  backLabel?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  badge?: string;
  icon?: any;
  breadcrumbContext?: string;
}

export function AdminFormPage({
  title,
  description,
  backHref,
  backLabel = 'Back',
  maxWidthClass = 'max-w-4xl',
  children,
  headerActions,
  badge,
  icon: Icon,
  breadcrumbContext,
}: AdminFormPageProps) {
  const router = useRouter();

  return (
    <div className="w-full pb-16">
      <div className={`mx-auto ${maxWidthClass} space-y-6`}>
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all shadow-2xs hover:shadow-xs group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:-translate-x-0.5 transition-transform" />
            <span>{backLabel}</span>
          </Link>

          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>

        {/* Page Header Banner */}
        <div className="admin-page-header bg-brand text-slate-900 px-4 py-3.5 sm:px-5 sm:py-4.5 rounded-2xl border border-brand-700/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-white/90 text-brand-900 border border-brand-900/20 flex items-center justify-center shadow-2xs shrink-0">
                <Icon className="w-5 h-5 text-brand-900" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              {breadcrumbContext && (
                <div className="text-[11px] font-semibold text-slate-900 uppercase tracking-wider mb-0.5">
                  {breadcrumbContext}
                </div>
              )}
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-[22px] md:text-[24px] font-bold text-slate-900 tracking-tight leading-tight break-words">
                  {title}
                </h1>
                {badge && (
                  <span className="px-2.5 py-0.5 bg-white/90 text-brand-900 border border-brand-900/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {badge}
                  </span>
                )}
              </div>
              {description && (
                <p className="text-[13px] sm:text-sm text-slate-900 font-normal leading-relaxed mt-1 max-w-2xl">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Form Body */}
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
