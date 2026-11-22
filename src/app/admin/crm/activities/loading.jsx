export default function ActivitiesLoading() {
  return (
    <div role="status" aria-live="polite" className="w-full space-y-5 sm:space-y-6 pb-24">
      <span className="sr-only">Loading Activities</span>
      {/* Title Card Skeleton */}
      <div className="h-28 w-full animate-pulse rounded-2xl border border-slate-200 bg-white" />
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 min-[440px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
      {/* Filter Toolbar Skeleton */}
      <div className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      {/* Table Skeleton */}
      <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
    </div>
  );
}
