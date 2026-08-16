'use client';

import React from 'react';

export interface AdminFormSectionProps {
  title: string;
  description?: string;
  icon?: any;
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
}

export function AdminFormSection({
  title,
  description,
  icon: Icon,
  children,
  columns = 2,
}: AdminFormSectionProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-8 h-8 rounded-xl bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/20 flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">{title}</h2>
            {description && (
              <p className="text-xs text-slate-500 font-medium mt-0.5">{description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section Fields Grid */}
      <div className={`grid ${columnClasses} gap-5 sm:gap-6`}>
        {children}
      </div>
    </div>
  );
}
