'use client';

import * as React from 'react';
import { Search, UserCheck, X, Check, ChevronDown, User, ShieldAlert } from 'lucide-react';
import { loadEmployees } from '@/modules/crm/crm-api';
import { loadDepartments } from '@/modules/master/master-api';
import { cn } from '@/lib/utils';

/**
 * Filter only active employees belonging to the Sales Department or BPO/Incentive team
 */
export function filterSalesEmployees(employees = [], departments = []) {
  const salesDeptIds = new Set(
    (departments || [])
      .filter((d) => /SALES|BPO/i.test(d.name || '') || /SALES|BPO/i.test(d.code || ''))
      .map((d) => d.id)
  );

  return (employees || []).filter((emp) => {
    // 1. Must be active
    const isActive = String(emp.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
    if (!isActive) return false;

    // 2. Department check
    const deptId = emp.department?.id || emp.departmentId;
    if (deptId && salesDeptIds.has(deptId)) return true;

    const deptName = emp.departmentName || emp.department?.name || '';
    const deptCode = emp.department?.code || '';
    if (/SALES|BPO/i.test(deptName) || /SALES|BPO/i.test(deptCode)) return true;

    // 3. Designation check
    const desigName = emp.designationName || emp.designation?.name || '';
    const desigCode = emp.designation?.code || '';
    if (/SALES|BPO/i.test(desigName) || /SALES|BPO/i.test(desigCode)) return true;

    // 4. Team check
    if (Array.isArray(emp.teamMembers) && emp.teamMembers.some((tm) => /SALES|BPO/i.test(tm?.team?.name || ''))) {
      return true;
    }

    return false;
  });
}

/**
 * Reusable Sales Employee Selector Dropdown
 */
export function SalesEmployeeSelect({
  value,
  onChange,
  employees: propEmployees,
  departments: propDepartments,
  placeholder = 'Select Sales Representative...',
  allowClear = true,
  disabled = false,
  className = '',
  size = 'default', // 'sm' | 'default'
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [fetchedEmployees, setFetchedEmployees] = React.useState([]);
  const [fetchedDepartments, setFetchedDepartments] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const containerRef = React.useRef(null);

  // Load dynamically if not provided as props
  React.useEffect(() => {
    if (propEmployees && propEmployees.length > 0) return;
    let active = true;
    setLoading(true);
    Promise.all([
      loadEmployees({ salesOnly: true }).catch(() => []),
      loadDepartments().catch(() => []),
    ])
      .then(([emps, depts]) => {
        if (!active) return;
        setFetchedEmployees(emps || []);
        setFetchedDepartments(depts || []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [propEmployees]);

  const allEmployees = propEmployees || fetchedEmployees;
  const allDepartments = propDepartments || fetchedDepartments;

  const salesEmployees = React.useMemo(() => {
    const filtered = filterSalesEmployees(allEmployees, allDepartments);
    // If strict filter yields 0 due to custom department taxonomy, fall back to all active employees
    if (filtered.length === 0 && allEmployees.length > 0) {
      return allEmployees.filter((e) => String(e.status || 'ACTIVE').toUpperCase() === 'ACTIVE');
    }
    return filtered;
  }, [allEmployees, allDepartments]);

  // Find currently selected employee
  const selectedEmployee = React.useMemo(() => {
    if (!value) return null;
    return allEmployees.find(
      (e) =>
        String(e.recordId || e.id) === String(value) ||
        String(e.userId) === String(value) ||
        String(e.employeeCode) === String(value)
    );
  }, [value, allEmployees]);

  // Close on outside click
  React.useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  // Filtered by search term
  const filteredList = React.useMemo(() => {
    if (!search.trim()) return salesEmployees;
    const q = search.toLowerCase().trim();
    return salesEmployees.filter((e) => {
      const name = String(e.name || `${e.firstName || ''} ${e.lastName || ''}`).toLowerCase();
      const code = String(e.employeeCode || e.id || '').toLowerCase();
      const desig = String(e.designationName || e.designation?.name || '').toLowerCase();
      return name.includes(q) || code.includes(q) || desig.includes(q);
    });
  }, [salesEmployees, search]);

  const handleSelect = (emp) => {
    if (!emp) {
      onChange?.(null, null);
    } else {
      onChange?.(emp.recordId || emp.id, emp);
    }
    setOpen(false);
    setSearch('');
  };

  const isSmall = size === 'sm';

  return (
    <div ref={containerRef} className={cn('relative w-full text-xs', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white text-left transition-all',
          isSmall ? 'h-8 px-2.5 py-1 text-[11px]' : 'h-10 px-3 py-2 text-xs sm:text-sm',
          open && 'border-emerald-600 ring-2 ring-emerald-500/20',
          disabled && 'cursor-not-allowed bg-slate-50 opacity-60'
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedEmployee ? (
            <>
              <div className="flex size-5 sm:size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-[#16A34A]">
                {(selectedEmployee.name?.[0] || 'S').toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 truncate">
                <span className="font-semibold text-slate-900">
                  {selectedEmployee.name || `${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                </span>
                <span className="ml-1.5 font-mono text-[10px] text-slate-400">
                  ({selectedEmployee.employeeCode || selectedEmployee.id})
                </span>
              </div>
            </>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1.5 text-slate-400">
          {allowClear && selectedEmployee && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(null);
              }}
              className="p-0.5 rounded-full hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[260px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          {/* Search Input */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Sales representative..."
              className="w-full h-8 pl-8 pr-3 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:border-emerald-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-thin">
            {/* Unassigned Option */}
            {allowClear && (
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-slate-50',
                  !value && 'bg-emerald-50 text-emerald-800 font-semibold'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <User className="size-3.5" />
                  </div>
                  <div>
                    <p className="font-medium">Unassigned</p>
                    <p className="text-[10px] text-slate-400">Keep lead without an assigned rep</p>
                  </div>
                </div>
                {!value && <Check className="size-4 text-[#16A34A]" />}
              </button>
            )}

            {loading ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Loading Sales Department representatives...
              </div>
            ) : filteredList.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching active Sales employees found
              </div>
            ) : (
              filteredList.map((emp) => {
                const isSelected =
                  String(emp.recordId || emp.id) === String(value) ||
                  String(emp.userId) === String(value);
                const initial = (emp.name?.[0] || emp.firstName?.[0] || 'S').toUpperCase();

                return (
                  <button
                    key={emp.recordId || emp.id}
                    type="button"
                    onClick={() => handleSelect(emp)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition-colors hover:bg-emerald-50/60',
                      isSelected && 'bg-emerald-50 text-emerald-900 font-semibold'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100/80 font-bold text-[#16A34A] ring-1 ring-emerald-200/60">
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate font-semibold text-slate-900">
                            {emp.name || `${emp.firstName} ${emp.lastName}`}
                          </p>
                          <span className="shrink-0 rounded bg-slate-100 px-1 py-0.2 font-mono text-[9px] text-slate-500">
                            {emp.employeeCode || emp.id}
                          </span>
                        </div>
                        <p className="truncate text-[10px] text-slate-400">
                          {emp.designationName || emp.designation?.name || 'Sales Rep'} ·{' '}
                          {emp.departmentName || emp.department?.name || 'Sales Department'}
                        </p>
                      </div>
                    </div>

                    {isSelected && <Check className="size-4 text-[#16A34A] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
