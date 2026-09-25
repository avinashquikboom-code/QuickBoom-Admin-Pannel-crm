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
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-slate-700/60 shadow-xl space-y-2">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#23C45E]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            {breadcrumbContext && (
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                {breadcrumbContext}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {Icon && (
                <div className="w-9 h-9 rounded-xl bg-white/10 text-white border border-white/15 flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Icon className="w-5 h-5 text-[#23C45E]" />
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight break-words">
                {title}
              </h1>
              {badge && (
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-[#23C45E] border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed mt-1">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Main Form Body */}
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
