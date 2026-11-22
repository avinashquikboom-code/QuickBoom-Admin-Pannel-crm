'use client';

export function HrmNotice({ error, loading, onRetry, empty, children, loadingSkeleton = false }) {
  if (loading) {
    if (loadingSkeleton) {
      return (
        <div role="status" aria-label="Loading resource usage" className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
          <span className="sr-only">Loading resource usage…</span>
          <div className="h-5 w-44 animate-pulse rounded bg-slate-100" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
          <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
        </div>
      );
    }
    return <div role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading HRM records…</div>;
  }
  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        <p>{error}</p>
        {onRetry && <button type="button" className="mt-3 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold" onClick={onRetry}>Try again</button>}
      </div>
    );
  }
  if (empty) {
    if (typeof empty !== 'string') return empty;
    return <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">{empty}</div>;
  }
  return children || null;
}

export function HrmStats({ items, layout = 'default' }) {
  const hasIcons = items.some((item) => item.icon);
  return (
    <div className={hasIcons ? `grid w-full min-w-0 gap-3 ${layout === 'mobile-stack' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-2 xl:grid-cols-4'}` : 'grid w-full min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))]'}>
      {items.map((item) => (
        <div key={item.label} className={`flex h-full min-w-0 rounded-2xl border border-[#E2E8E5] bg-white p-4 shadow-sm ${hasIcons ? 'group min-h-[104px] items-center justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0' : 'flex-col justify-between'}`}>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-[#718078]">{item.label}</p>
            <p className="mt-2 truncate text-2xl font-bold tracking-tight text-[#163A2E]">{item.value ?? '—'}</p>
          </div>
          {item.icon && (
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${item.iconTone || 'bg-[#EAF7EF] text-[#173D30]'}`}>
              <item.icon className="size-5" aria-hidden="true" />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function HrmGap({ title, detail }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5 text-xs sm:text-sm text-amber-900 break-words">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 leading-relaxed">{detail}</p>
    </div>
  );
}
