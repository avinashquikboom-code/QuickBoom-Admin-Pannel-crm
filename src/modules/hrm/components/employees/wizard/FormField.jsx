'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Search, ChevronDown, Check, X, AlertCircle } from 'lucide-react';

export function SectionHeader({ title, description, icon: Icon, badge }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/50">
            <Icon className="size-4" />
          </div>
        )}
        <div>
          <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">{title}</h4>
          {description && <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {badge && (
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-[#16A34A] ring-1 ring-emerald-200/50">
          {badge}
        </span>
      )}
    </div>
  );
}

export function FormField({
  label,
  required,
  optional,
  error,
  touched,
  hint,
  children,
  className,
  id,
}) {
  const showError = Boolean(error && (touched === undefined || touched === true));

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-slate-700 flex items-center gap-1 select-none">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
          {optional && !required && (
            <span className="text-[10px] font-normal text-slate-400 ml-0.5">(Optional)</span>
          )}
        </label>
      </div>
      <div className="relative">{children}</div>
      {showError && (
        <p className="flex items-center gap-1 text-[11px] font-medium text-rose-600 mt-1 animate-fadeIn">
          <AlertCircle className="size-3 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      {hint && !showError && (
        <p className="text-[11px] text-slate-400 mt-1">{hint}</p>
      )}
    </div>
  );
}

export function InputField({
  label,
  required,
  optional,
  error,
  touched,
  hint,
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'text',
  disabled = false,
  className,
  icon: Icon,
  prefixText,
  suffixText,
  ...props
}) {
  const showError = Boolean(error && (touched === undefined || touched === true));

  return (
    <FormField
      label={label}
      required={required}
      optional={optional}
      error={error}
      touched={touched}
      hint={hint}
      className={className}
    >
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="size-4" />
          </div>
        )}
        {prefixText && (
          <span className="absolute left-3 text-xs font-semibold text-slate-500 pointer-events-none">
            {prefixText}
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={cn(
            'w-full h-10 rounded-xl border bg-white px-3 text-xs sm:text-[13px] font-medium text-slate-800 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-1',
            Icon && 'pl-9',
            prefixText && 'pl-8',
            suffixText && 'pr-8',
            showError
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-400 bg-rose-50/20'
              : 'border-slate-200 focus:border-[#16A34A] focus:ring-[#16A34A]',
            disabled && 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-100'
          )}
          {...props}
        />
        {suffixText && (
          <span className="absolute right-3 text-xs font-medium text-slate-400 pointer-events-none">
            {suffixText}
          </span>
        )}
      </div>
    </FormField>
  );
}

/**
 * Premium Searchable Dropdown
 */
export function SearchableSelect({
  label,
  required,
  optional,
  error,
  touched,
  hint,
  options = [],
  value,
  onChange,
  onBlur,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search options...',
  disabled = false,
  className,
  emptyText = 'No matching options found',
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef(null);
  const searchInputRef = React.useRef(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const showError = Boolean(error && (touched === undefined || touched === true));

  // Filter options
  const filtered = React.useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label?.toLowerCase().includes(q) ||
        opt.subtext?.toLowerCase().includes(q) ||
        opt.code?.toLowerCase().includes(q)
    );
  }, [options, search]);

  // Handle outside click to close
  React.useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (open) {
          setOpen(false);
          setSearch('');
          onBlur?.();
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onBlur]);

  // Focus search input when opened
  React.useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [open]);

  return (
    <FormField
      label={label}
      required={required}
      optional={optional}
      error={error}
      touched={touched}
      hint={hint}
      className={className}
    >
      <div ref={containerRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setOpen((prev) => !prev);
              if (!open) setSearch('');
            }
          }}
          className={cn(
            'flex w-full h-10 items-center justify-between rounded-xl border bg-white px-3 text-left text-xs sm:text-[13px] transition-colors focus:outline-none focus:ring-1 select-none',
            showError
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-400 bg-rose-50/20'
              : 'border-slate-200 focus:border-[#16A34A] focus:ring-[#16A34A]',
            disabled && 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-100',
            open && 'ring-1 ring-[#16A34A] border-[#16A34A]'
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
            {selectedOption ? (
              <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                <span className="font-semibold text-slate-800 truncate">{selectedOption.label}</span>
                {selectedOption.subtext && (
                  <span className="text-[11px] text-slate-400 truncate">({selectedOption.subtext})</span>
                )}
                {selectedOption.badge && (
                  <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-[#16A34A]">
                    {selectedOption.badge}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400 font-normal truncate">{placeholder}</span>
            )}
          </div>
          <ChevronDown className={cn('size-3.5 text-slate-400 transition-transform shrink-0 ml-1.5', open && 'rotate-180 text-[#16A34A]')} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl py-1.5 overflow-hidden animate-fadeIn">
            {/* Search Input */}
            <div className="px-2 pb-1.5 pt-0.5 border-b border-slate-100">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 size-3.5 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-8 rounded-lg bg-slate-50 pl-8 pr-7 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#16A34A]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-400">{emptyText}</div>
              ) : (
                filtered.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => {
                        onChange(opt.value, opt);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors',
                        isSelected
                          ? 'bg-emerald-50 text-[#16A34A] font-semibold'
                          : 'text-slate-700 hover:bg-slate-50 font-medium',
                        opt.disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
                      )}
                    >
                      <div className="min-w-0 flex-1 truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{opt.label}</span>
                          {opt.badge && (
                            <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-bold text-slate-500">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.subtext && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5 font-normal">
                            {opt.subtext}
                          </p>
                        )}
                      </div>
                      {isSelected && <Check className="size-3.5 text-[#16A34A] shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </FormField>
  );
}
