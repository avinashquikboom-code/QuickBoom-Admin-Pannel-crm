export default function DataCaptureLoading() {
  return (
    <div role="status" aria-live="polite" className="w-full space-y-4 p-4 sm:p-6">
      <span className="sr-only">Loading Data Capture</span>
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="h-14 animate-pulse rounded-xl border border-slate-200 bg-white" />
      <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}
