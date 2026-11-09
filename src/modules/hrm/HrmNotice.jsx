'use client';

export function HrmNotice({ error, loading, onRetry, empty, children }) {
  if (loading) {
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
    return <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">{empty}</div>;
  }
  return children || null;
}

export function HrmStats({ items }) {
  return (
    <div className="grid grid-cols-1 min-[440px]:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs min-w-0 flex flex-col justify-between h-full">
          <p className="truncate text-xs font-medium text-slate-500">{item.label}</p>
          <p className="truncate mt-1 text-xl sm:text-2xl font-bold text-slate-900">{item.value ?? '—'}</p>
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
