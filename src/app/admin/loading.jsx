export default function AdminLoading() {
  return (
    <div className="flex min-h-48 items-center justify-center" role="status" aria-live="polite">
      <span className="size-5 animate-spin rounded-full border-2 border-emerald-600/25 border-t-emerald-600" />
      <span className="sr-only">Loading admin page</span>
    </div>
  );
}
