import * as React from 'react';

export default function BannersLoading() {
  return (
    <div className="min-w-0 w-full max-w-full space-y-6 pb-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-28 rounded-2xl bg-slate-100 border border-slate-200/60" />

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-100 border border-slate-200/60" />
        ))}
      </div>

      {/* Toolbar Skeleton */}
      <div className="h-16 rounded-2xl bg-slate-100 border border-slate-200/60" />

      {/* Table Skeleton */}
      <div className="h-96 rounded-2xl bg-slate-100 border border-slate-200/60" />
    </div>
  );
}
