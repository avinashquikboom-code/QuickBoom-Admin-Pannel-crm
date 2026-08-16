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
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {badge && (
              <span className="px-2.5 py-0.5 bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                {badge}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {title}
            </h1>
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Main Form Body */}
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
