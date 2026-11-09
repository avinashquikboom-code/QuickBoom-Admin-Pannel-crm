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

export function AdminBulkSelectionToolbar({ count = 0, children, onClear }) {
  if (!count) return null;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#E2E8E5] bg-[#E8F1EC] p-3 md:flex-row md:items-center md:justify-between">
      <AdminSelectionSummary count={count} onClear={onClear} />
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function AdminBulkActions({ children }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}
