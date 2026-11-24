'use client';

import * as React from 'react';

/** A searchable, keyboard-operable selector whose results remain in the drawer flow. */
export function TemplateSelector({ label, items, value, onChange, disabled, loading, kind, isEligible }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  const listId = React.useId();
  const root = React.useRef(null);
  const selected = items.find((item) => String(item.id) === String(value));
  const results = items.filter((item) => [item.name, item.templateName, item.subject, item.language, item.category, item.status].some((part) => String(part || '').toLowerCase().includes(query.trim().toLowerCase())));
  React.useEffect(() => { if (open) root.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }); }, [open]);
  React.useEffect(() => { if (open && results[active]) document.getElementById(`${listId}-${results[active].id}`)?.scrollIntoView({ block: 'nearest' }); }, [active, open, listId, results]);
  React.useEffect(() => { const close = (event) => { if (!root.current?.contains(event.target)) setOpen(false); }; document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close); }, []);
  const choose = (item) => { if (item && isEligible(item)) { onChange(String(item.id)); setOpen(false); setQuery(''); } };
  return <div ref={root} className="min-w-0 space-y-1">
    <label htmlFor={`${listId}-input`} className="text-sm font-medium">{label}</label>
    <div className="flex gap-2"><input id={`${listId}-input`} role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={open && results[active] ? `${listId}-${results[active].id}` : undefined} disabled={disabled} value={open ? query : (selected?.name || '')} placeholder={selected ? selected.name : 'Search templates…'} onFocus={() => { setOpen(true); setQuery(''); setActive(Math.max(0, results.findIndex((item) => String(item.id) === String(value)))); }} onChange={(event) => { setQuery(event.target.value); setActive(0); setOpen(true); }} onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActive((index) => Math.min(index + 1, results.length - 1)); } else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((index) => Math.max(index - 1, 0)); } else if (event.key === 'Enter' && open) { event.preventDefault(); choose(results[active]); } else if (event.key === 'Escape') { event.preventDefault(); setOpen(false); } }} className="h-10 min-w-0 flex-1 rounded-md border border-[#E2E8E5] px-3 text-sm" />{value && !disabled && <button type="button" className="rounded-md border px-3 text-sm" onClick={() => { onChange(''); setQuery(''); }}>Clear</button>}</div>
    {open && <div id={listId} role="listbox" className="max-h-56 overflow-y-auto rounded-md border border-[#E2E8E5] bg-white shadow-sm">{loading ? <p className="p-3 text-sm text-slate-500">Loading templates…</p> : !results.length ? <p className="p-3 text-sm text-slate-500">{items.length ? 'No results found.' : 'No templates available.'}</p> : results.map((item, index) => <div id={`${listId}-${item.id}`} role="option" aria-selected={String(item.id) === String(value)} aria-disabled={!isEligible(item)} key={item.id} onMouseEnter={() => setActive(index)} onClick={() => choose(item)} className={`cursor-pointer border-b px-3 py-2 text-sm last:border-0 ${index === active ? 'bg-emerald-50' : ''} ${String(item.id) === String(value) ? 'font-semibold text-emerald-800' : ''} ${!isEligible(item) ? 'opacity-50' : ''}`}><div>{item.name}</div><div className="text-xs font-normal text-slate-500">{kind === 'email' ? [item.subject, item.isActive === false ? 'Inactive' : 'Active', item.updatedAt && `Updated ${new Date(item.updatedAt).toLocaleDateString()}`].filter(Boolean).join(' · ') : [item.templateName, item.language, item.category, item.status].filter(Boolean).join(' · ')}</div></div>)}</div>}
  </div>;
}

export function requiredVariables(template, kind) {
  if (!template) return [];
  const text = kind === 'email' ? [template.subject, template.body] : [template.headerContent, template.body, template.footer, JSON.stringify(template.buttons || '')];
  return [...new Set(text.flatMap((part) => [...String(part || '').matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((match) => match[1])))];
}

export function VariableMapping({ template, kind, value, onChange, disabled }) {
  const variables = requiredVariables(template, kind);
  let mapping = {};
  try { mapping = value ? JSON.parse(value) : {}; } catch { /* Existing malformed data is reported on save. */ }
  const sources = kind === 'email' ? [['leadName', 'Lead name'], ['companyName', 'Company name'], ['leadPhone', 'Customer phone'], ['customerEmail', 'Customer email'], ['assignedEmployeeName', 'Assigned employee name'], ['stage', 'Lead stage']] : [['leadName', 'Lead name'], ['businessName', 'Business name'], ['phone', 'Customer phone'], ['assignedEmployeeName', 'Assigned employee name'], ['assignedEmployeePhone', 'Assigned employee phone'], ['companyName', 'Company name'], ['stage', 'Lead stage']];
  const set = (key, source) => onChange(JSON.stringify({ ...mapping, [key]: source }, null, 2));
  if (!template) return null;
  return <div className="space-y-2"><h4 className="text-sm font-semibold">Required variables</h4>{variables.length === 0 ? <p className="text-xs text-slate-500">No variables detected.</p> : variables.map((key) => { const source = mapping[key] || ''; const custom = source && !sources.some(([id]) => id === source); return <div key={key} className="grid gap-1 sm:grid-cols-[1fr_2fr] sm:items-center"><span className="text-sm font-mono">{`{{${key}}}`}</span><div><select aria-label={`Mapping for ${key}`} disabled={disabled} className="h-10 w-full rounded-md border border-[#E2E8E5] bg-white px-2 text-sm" value={custom ? '__custom' : source} onChange={(event) => set(key, event.target.value === '__custom' ? ' ' : event.target.value)}><option value="">Select a field</option>{sources.map(([id, label]) => <option value={id} key={id}>{label}</option>)}<option value="__custom">Custom value</option></select>{custom && <input aria-label={`Custom value for ${key}`} disabled={disabled} className="mt-1 h-10 w-full rounded-md border px-2 text-sm" value={source} onChange={(event) => set(key, event.target.value || ' ')} placeholder="Enter a value" />}</div></div>; })}</div>;
}
