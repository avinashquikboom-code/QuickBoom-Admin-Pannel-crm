export default function CustomerDashboardLoading() {
  return (
    <div role="status" aria-live="polite" className="w-full space-y-5 sm:space-y-6 pb-24">
      <span className="sr-only">Loading Dashboard</span>
      {/* Title Card Skeleton */}
      <div className="h-28 w-full animate-pulse rounded-2xl border border-slate-200 bg-white" />
      {/* Filter Bar Skeleton */}
      <div className="h-16 w-full animate-pulse rounded-2xl border border-slate-200 bg-white" />
      {/* 8 KPI Cards Skeleton */}
      <div className="grid grid-cols-1 min-[440px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
      {/* 2 Animated Analytics Graphs Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6 w-full">
        <div className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
      {/* 3 Invoice Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
      {/* Two-Column Tables Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
        <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}
