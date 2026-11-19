'use client';

export function AdminSelectCheckbox({ checked, indeterminate = false, onChange, label = 'Select row', disabled = false }) {
  return (
    <input
      aria-label={label}
      type="checkbox"
      checked={Boolean(checked)}
      disabled={disabled}
      ref={(node) => {
        if (node) node.indeterminate = Boolean(indeterminate) && !checked;
      }}
      onChange={(event) => onChange?.(event.target.checked)}
      className="size-4 rounded border-slate-300 accent-[#163A2E]"
    />
  );
}

export function AdminSelectionSummary({ count = 0, noun = 'records', onClear }) {
  if (!count) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-[#172B24]">
      <span className="font-medium">{count} {noun} selected</span>
      {onClear && <button type="button" className="text-xs font-medium text-[#163A2E] underline" onClick={onClear}>Clear selection</button>}
    </div>
  );
}

export function AdminBulkSelectionToolbar({ count = 0, noun = 'records', children, onClear }) {
  if (!count) return null;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#E2E8E5] bg-[#E8F1EC] p-3 md:flex-row md:items-center md:justify-between">
      <AdminSelectionSummary count={count} noun={noun} onClear={onClear} />
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function AdminBulkActions({ children }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function AdminBulkDeleteButton({ onClick, loading = false, label = 'Delete Selected', count }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
    >
      <svg className="size-3.5 fill-current" viewBox="0 0 448 512">
        <path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z"/>
      </svg>
      <span>{loading ? 'Deleting…' : count ? `Delete ${count} Selected` : label}</span>
    </button>
  );
}
