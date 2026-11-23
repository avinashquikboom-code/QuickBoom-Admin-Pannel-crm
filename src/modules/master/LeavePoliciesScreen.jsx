'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faClock,
  faRotateRight,
  faDownload,
  faSearch,
  faXmark,
  faCircleCheck,
  faUsers,
  faChevronLeft,
  faChevronRight,
  faCalendarDays,
  faPenToSquare,
  faCircleInfo,
  faSliders,
  faUserCheck,
  faShieldHalved,
  faCheck,
  faMinus,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import {
  loadLeavePolicyScreen,
  saveLeavePolicy,
  downloadCsv,
  masterError,
} from './master-api';
import { loadOffices } from '@/modules/hrm/hrm-api';
import { TruncatedText } from '@/components/common/TruncatedText';

function useDebounced(value, delay) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function emptyLeaveForm() {
  return {
    name: 'Standard Leave Policy',
    officeId: '',
    allowHalfDay: true,
    allowBackdatedLeave: false,
    maxBackdatedDays: 3,
    allowFutureLeave: true,
    maxFutureDays: 90,
    allowProbationLeave: false,
    includeHolidaysInLeave: false,
    includeWeekendsInLeave: false,
    minNoticePeriodDays: 2,
    maxConsecutiveDays: 10,
    requiresManagerApproval: true,
    requiresHrApproval: true,
    requiresAttachmentAboveDays: 3,
    isActive: true,
  };
}

function leaveFormFromPolicy(policy) {
  if (!policy) return emptyLeaveForm();
  return {
    name: policy.name || 'Standard Leave Policy',
    officeId: policy.officeId ? String(policy.officeId) : '',
    allowHalfDay: policy.allowHalfDay !== false,
    allowBackdatedLeave: Boolean(policy.allowBackdatedLeave),
    maxBackdatedDays: policy.maxBackdatedDays ?? 3,
    allowFutureLeave: policy.allowFutureLeave !== false,
    maxFutureDays: policy.maxFutureDays ?? 90,
    allowProbationLeave: Boolean(policy.allowProbationLeave),
    includeHolidaysInLeave: Boolean(policy.includeHolidaysInLeave),
    includeWeekendsInLeave: Boolean(policy.includeWeekendsInLeave),
    minNoticePeriodDays: policy.minNoticePeriodDays ?? 2,
    maxConsecutiveDays: policy.maxConsecutiveDays ?? 10,
    requiresManagerApproval: policy.requiresManagerApproval !== false,
    requiresHrApproval: policy.requiresHrApproval !== false,
    requiresAttachmentAboveDays: policy.requiresAttachmentAboveDays ?? 3,
    isActive: policy.isActive !== false,
  };
}

function YesNoBadge({ value }) {
  const isYes = Boolean(value);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
        isYes
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
          : 'bg-slate-100 text-slate-600 border-slate-200'
      }`}
    >
      <FontAwesomeIcon icon={isYes ? faCheck : faMinus} className="size-2.5" />
      {isYes ? 'Yes' : 'No'}
    </span>
  );
}

function StatusBadge({ status }) {
  const active = status === 'Active';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
        active
          ? 'border-emerald-200/80 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-slate-100 text-slate-600'
      }`}
    >
      <span className={`size-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {status}
    </span>
  );
}

export function LeavePoliciesScreen({ config }) {
  const [policy, setPolicy] = React.useState(null);
  const [persisted, setPersisted] = React.useState(false);
  const [types, setTypes] = React.useState([]);
  const [offices, setOffices] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);

  // Search & Table
  const [query, setQuery] = React.useState('');
  const [sortField, setSortField] = React.useState('name');
  const [sortOrder, setSortOrder] = React.useState('asc');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Edit Drawer
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState(emptyLeaveForm());

  const debouncedQuery = useDebounced(query, 250);

  // Load data
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      loadLeavePolicyScreen(),
      loadOffices().catch(() => []),
    ])
      .then(([policyRes, officesRes]) => {
        if (!active) return;
        setPolicy(policyRes.policy || null);
        setPersisted(Boolean(policyRes.persisted));
        setTypes(policyRes.leaveTypes || policyRes.types || []);
        setOffices(officesRes || []);
      })
      .catch((err) => {
        if (!active) return;
        setError(masterError(err));
        toast.error(masterError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refresh]);

  // Open Edit Drawer
  const handleOpenEdit = () => {
    setForm(leaveFormFromPolicy(policy));
    setDrawerOpen(true);
  };

  // Save Policy
  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim()) {
      toast.error('Policy name is required');
      return;
    }
    setSaving(true);
    try {
      await saveLeavePolicy(form);
      toast.success(persisted ? 'Leave policy updated successfully' : 'Leave policy created successfully');
      setDrawerOpen(false);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(masterError(err));
    } finally {
      setSaving(false);
    }
  };

  // Export CSV
  const handleExport = () => {
    if (!policy && !types.length) {
      toast.error('No policy data to export');
      return;
    }

    const exportRows = [
      {
        section: 'Policy Overview',
        name: policy?.name || 'Standard Leave Policy',
        minNoticePeriodDays: policy?.minNoticePeriodDays ?? 2,
        maxConsecutiveDays: policy?.maxConsecutiveDays ?? 10,
        maxBackdatedDays: policy?.maxBackdatedDays ?? 3,
        maxFutureDays: policy?.maxFutureDays ?? 90,
        allowHalfDay: policy?.allowHalfDay !== false ? 'Yes' : 'No',
        allowBackdatedLeave: policy?.allowBackdatedLeave ? 'Yes' : 'No',
        allowFutureLeave: policy?.allowFutureLeave !== false ? 'Yes' : 'No',
        allowProbationLeave: policy?.allowProbationLeave ? 'Yes' : 'No',
        includeHolidaysInLeave: policy?.includeHolidaysInLeave ? 'Yes' : 'No',
        includeWeekendsInLeave: policy?.includeWeekendsInLeave ? 'Yes' : 'No',
        requiresManagerApproval: policy?.requiresManagerApproval !== false ? 'Yes' : 'No',
        requiresHrApproval: policy?.requiresHrApproval !== false ? 'Yes' : 'No',
        requiresAttachmentAboveDays: policy?.requiresAttachmentAboveDays ?? 3,
        status: policy?.isActive !== false ? 'Active' : 'Inactive',
      },
    ];

    types.forEach((t) => {
      exportRows.push({
        section: 'Leave Type Entitlement',
        name: t.name,
        code: t.code,
        annualAllowance: `${t.daysAllowedPerYear ?? 0} Days / Year`,
        carryForward: t.isCarryForward ? 'Yes' : 'No',
        status: t.isActive !== false ? 'Active' : 'Inactive',
      });
    });

    downloadCsv('leave-policy-configuration.csv', exportRows);
    toast.success('Leave policy data exported to CSV');
  };

  // Filtered & Sorted Leave Types
  const filteredTypes = React.useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return types;
    return types.filter((t) => {
      const match = [t.name, t.code, t.description].filter(Boolean).join(' ').toLowerCase();
      return match.includes(q);
    });
  }, [types, debouncedQuery]);

  const sortedTypes = React.useMemo(() => {
    return [...filteredTypes].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTypes, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedTypes.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedTypes = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTypes.slice(start, start + pageSize);
  }, [sortedTypes, currentPage, pageSize]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="w-full min-w-0 max-w-none space-y-4 sm:space-y-5 overflow-x-hidden">
      {/* ── 1. Page Header ─────────────────────────────────────────────────── */}
      <PageHeader
        category="MASTER MANAGEMENT"
        title="Leave Policies"
        description="Configure global notice periods, approval workflows, leave limits, and calendar rules."
        icon={faCalendarDays}
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRefresh((v) => v + 1)}
              disabled={loading}
              className="h-8.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <FontAwesomeIcon icon={faRotateRight} className={`size-3.5 mr-1.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
              className="h-8.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <FontAwesomeIcon icon={faDownload} className="size-3.5 mr-1.5 text-slate-500" />
              <span>Export CSV</span>
            </Button>
            <Button
              type="button"
              onClick={handleOpenEdit}
              className="h-8.5 rounded-xl bg-[#107569] px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-[#0e6359]"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="size-3.5 mr-1.5" />
              <span>{persisted ? 'Save Leave Policy' : 'Save Leave Policy'}</span>
            </Button>
          </div>
        }
      />

      {/* ── 2. Statistics Cards (4 Compact Cards) ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Policy Name */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Policy
            </p>
            <div className="min-w-0">
              <TruncatedText
                value={policy?.name || 'Standard Leave Policy'}
                maxWidth="max-w-[200px]"
                className="text-lg sm:text-xl font-extrabold tracking-tight text-[#111827]"
                label="Policy Name"
              />
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {persisted ? 'Stored tenant policy' : 'Default system policy'}
            </p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#107569] ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faShieldHalved} className="size-5" />
          </div>
        </div>

        {/* Card 2: Notice Days */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Notice Days
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-700">
              {loading ? '…' : (policy?.minNoticePeriodDays ?? 2)}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium truncate">Minimum notice required</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faClock} className="size-5" />
          </div>
        </div>

        {/* Card 3: Consecutive Days */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Consecutive Days
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#163A2E]">
              {loading ? '…' : (policy?.maxConsecutiveDays ?? 10)}
            </p>
            <p className="text-[11px] text-slate-400 truncate">Maximum continuous leave</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#107569] ring-1 ring-emerald-200/60">
            <FontAwesomeIcon icon={faCalendarDays} className="size-5" />
          </div>
        </div>

        {/* Card 4: Configured Leave Types */}
        <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-emerald-300">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Leave Types
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
              {loading ? '…' : types.length}
            </p>
            <p className="text-[11px] text-slate-400 truncate">Active classifications</p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-slate-200">
            <FontAwesomeIcon icon={faLayerGroup} className="size-5" />
          </div>
        </div>
      </div>

      {/* ── 3. Compact Informational Note (Resolving Warning Clutter) ──────── */}
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-2.5 text-xs text-emerald-900 shadow-2xs">
        <FontAwesomeIcon icon={faCircleInfo} className="size-4 shrink-0 text-[#107569]" />
        <p className="min-w-0 flex-1 leading-relaxed">
          <strong className="font-semibold text-emerald-950">Tenant Policy Overview: </strong>
          Leave policies define notice periods, leave limits, eligibility, and approval requirements across your organization.
        </p>
      </div>

      {/* ── 4. Redesigned Policy Details Section (Compact & Structured) ────── */}
      <section className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#107569] border border-emerald-200/70">
              <FontAwesomeIcon icon={faSliders} className="size-3.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {policy?.name || 'Standard Leave Policy'}
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                {persisted ? `Configured Tenant Record #${policy?.id}` : 'Default policy applied until customized'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={policy?.isActive !== false ? 'Active' : 'Inactive'} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenEdit}
              className="h-8 rounded-lg border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:text-[#107569] hover:bg-emerald-50"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="size-3 mr-1.5" />
              <span>Edit Settings</span>
            </Button>
          </div>
        </div>

        {/* Logical Settings Groups (3 Columns on Desktop, 2 on Tablet, 1 on Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 p-4 sm:p-5">
          {/* Group 1: Leave Eligibility */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <FontAwesomeIcon icon={faCircleCheck} className="size-3.5 text-[#107569]" />
              <span>Leave Eligibility</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Half Day Allowed</span>
                <YesNoBadge value={policy?.allowHalfDay !== false} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Probation Leave Allowed</span>
                <YesNoBadge value={policy?.allowProbationLeave} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Future Leave Allowed</span>
                <YesNoBadge value={policy?.allowFutureLeave !== false} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Backdated Leave Allowed</span>
                <YesNoBadge value={policy?.allowBackdatedLeave} />
              </div>
            </div>
          </div>

          {/* Group 2: Leave Limits */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <FontAwesomeIcon icon={faClock} className="size-3.5 text-[#107569]" />
              <span>Leave Limits</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Max Future Days</span>
                <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {policy?.maxFutureDays ?? 90} Days
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Max Backdated Days</span>
                <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {policy?.maxBackdatedDays ?? 3} Days
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Attachment Mandatory Above</span>
                <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {policy?.requiresAttachmentAboveDays ?? 3} Days
                </span>
              </div>
            </div>
          </div>

          {/* Group 3: Approval Rules */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <FontAwesomeIcon icon={faUserCheck} className="size-3.5 text-[#107569]" />
              <span>Approval Rules</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Manager Approval Required</span>
                <YesNoBadge value={policy?.requiresManagerApproval !== false} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">HR Approval Required</span>
                <YesNoBadge value={policy?.requiresHrApproval !== false} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Minimum Notice Period</span>
                <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {policy?.minNoticePeriodDays ?? 2} Days
                </span>
              </div>
            </div>
          </div>

          {/* Group 4: Calendar Rules */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <FontAwesomeIcon icon={faCalendarDays} className="size-3.5 text-[#107569]" />
              <span>Calendar Rules</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Count Holidays in Duration</span>
                <YesNoBadge value={policy?.includeHolidaysInLeave} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Count Weekends in Duration</span>
                <YesNoBadge value={policy?.includeWeekendsInLeave} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Max Consecutive Duration</span>
                <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {policy?.maxConsecutiveDays ?? 10} Days
                </span>
              </div>
            </div>
          </div>

          {/* Group 5: Policy Scope & Audit */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-2.5 md:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <FontAwesomeIcon icon={faShieldHalved} className="size-3.5 text-[#107569]" />
              <span>Policy Information & Scope</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/70">
                <span className="text-slate-500">Applicable Office Scope:</span>
                <span className="font-semibold text-slate-800">
                  {policy?.officeName || 'Company-wide (All Offices)'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/70">
                <span className="text-slate-500">Last Updated By:</span>
                <span className="font-semibold text-slate-800">
                  {policy?.updatedByName || 'Default System Policy'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Associated Leave Types Table ────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-slate-200/80">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Configured Leave Classifications
            </h3>
            <p className="text-[11px] text-slate-400">
              Leave types entitled to active employees under this policy.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none"
            />
            <Input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search leave types..."
              className="h-8.5 pl-9 pr-8 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-[#107569] rounded-xl w-full"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear search"
              >
                <FontAwesomeIcon icon={faXmark} className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {!loading && sortedTypes.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500">
            {query ? `No leave types matching “${query}”.` : 'No leave types configured for this tenant.'}
          </div>
        )}

        {/* Desktop Table View */}
        {!loading && sortedTypes.length > 0 && (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8E5] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#163A2E]">
                    {/* Leave Type Name */}
                    <th className="py-3.5 px-4 min-w-[200px]">
                      <button
                        type="button"
                        onClick={() => toggleSort('name')}
                        className="group flex items-center gap-1.5 font-bold uppercase cursor-pointer hover:text-[#107569]"
                      >
                        <span>Leave Type</span>
                        <span className="text-slate-400 group-hover:text-[#107569]">
                          {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      </button>
                    </th>

                    {/* Code */}
                    <th className="py-3.5 px-3 w-28">
                      <button
                        type="button"
                        onClick={() => toggleSort('code')}
                        className="group flex items-center gap-1.5 font-bold uppercase cursor-pointer hover:text-[#107569]"
                      >
                        <span>Code</span>
                        <span className="text-slate-400 group-hover:text-[#107569]">
                          {sortField === 'code' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      </button>
                    </th>

                    {/* Annual Allowance */}
                    <th className="py-3.5 px-3 min-w-[170px]">
                      <button
                        type="button"
                        onClick={() => toggleSort('daysAllowedPerYear')}
                        className="group flex items-center gap-1.5 font-bold uppercase cursor-pointer hover:text-[#107569]"
                      >
                        <span>Annual Allowance</span>
                        <span className="text-slate-400 group-hover:text-[#107569]">
                          {sortField === 'daysAllowedPerYear' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      </button>
                    </th>

                    {/* Carry Forward */}
                    <th className="py-3.5 px-3 w-32">
                      <button
                        type="button"
                        onClick={() => toggleSort('isCarryForward')}
                        className="group flex items-center gap-1.5 font-bold uppercase cursor-pointer hover:text-[#107569]"
                      >
                        <span>Carry Forward</span>
                        <span className="text-slate-400 group-hover:text-[#107569]">
                          {sortField === 'isCarryForward' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      </button>
                    </th>

                    {/* Status */}
                    <th className="py-3.5 px-4 w-28 text-right">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedTypes.map((row) => {
                    const isActive = row.status === 'Active' || row.isActive !== false;
                    const days = row.daysAllowedPerYear ?? (Number(String(row.head || '').match(/\d+/)?.[0]) || 0);

                    return (
                      <tr key={row.id || row.code} className="h-[50px] transition-colors hover:bg-slate-50/70">
                        {/* Name */}
                        <td className="py-2.5 px-4 min-w-0 max-w-[240px]">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg border border-emerald-200/70 bg-emerald-50 text-[#107569] shadow-2xs">
                              <FontAwesomeIcon icon={faClock} className="size-3" />
                            </div>
                            <span className="font-semibold text-xs text-slate-900 truncate" title={row.name}>
                              {row.name}
                            </span>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700 shadow-2xs">
                            {row.code || '—'}
                          </span>
                        </td>

                        {/* Allowance */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                            <span className="inline-flex items-center justify-center size-4.5 rounded-full bg-emerald-200/80 text-[10px] font-bold text-emerald-900 font-mono">
                              {days}D
                            </span>
                            <span>{days} Days / Year</span>
                          </div>
                        </td>

                        {/* Carry Forward */}
                        <td className="py-2.5 px-3">
                          <YesNoBadge value={row.isCarryForward} />
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-4 text-right">
                          <StatusBadge status={isActive ? 'Active' : 'Inactive'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="grid gap-2.5 p-3.5 md:hidden">
              {paginatedTypes.map((row) => {
                const isActive = row.status === 'Active' || row.isActive !== false;
                const days = row.daysAllowedPerYear ?? (Number(String(row.head || '').match(/\d+/)?.[0]) || 0);

                return (
                  <article
                    key={row.id || row.code}
                    className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{row.name}</p>
                        <p className="font-mono text-[10px] text-slate-500">{row.code || '—'}</p>
                      </div>
                      <StatusBadge status={isActive ? 'Active' : 'Inactive'} />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">Allowance:</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {days} Days / Year
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Carry Forward:</span>
                      <YesNoBadge value={row.isCarryForward} />
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200/80 bg-slate-50/50 px-4 py-3 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <span>
                  Showing {sortedTypes.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, sortedTypes.length)} of {sortedTypes.length} entries
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#107569]"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1 self-end sm:self-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 rounded-lg border-slate-200 text-xs"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="size-3 mr-1" />
                  <span>Prev</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setPage(pageNum)}
                        className={`size-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-[#107569] text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-200/60'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2 rounded-lg border-slate-200 text-xs"
                >
                  <span>Next</span>
                  <FontAwesomeIcon icon={faChevronRight} className="size-3 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 6. Save / Edit Leave Policy Drawer ─────────────────────────────── */}
      <FormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={persisted ? 'Save Leave Policy' : 'Create Leave Policy'}
        description="Settings are applied to all employee leave calculations across the selected office scope."
        saving={saving}
        onSubmit={handleSave}
        submitLabel={saving ? 'Saving...' : 'Save Policy'}
        size="medium"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Policy Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Office Scope</Label>
            <Select
              value={form.officeId || 'company'}
              onValueChange={(val) => setForm({ ...form, officeId: val === 'company' ? '' : val })}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Company-wide" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">Company-wide (All Offices)</SelectItem>
                {offices.map((office) => (
                  <SelectItem key={office.id} value={String(office.id)}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Limits & Rules */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-3">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Notice & Duration Constraints
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-600">Minimum Notice Period (Days)</Label>
                <Input
                  type="number"
                  min={0}
                  max={90}
                  value={form.minNoticePeriodDays}
                  onChange={(e) => setForm({ ...form, minNoticePeriodDays: Number(e.target.value) })}
                  className="h-8.5 text-xs bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-600">Max Consecutive Leave (Days)</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={form.maxConsecutiveDays}
                  onChange={(e) => setForm({ ...form, maxConsecutiveDays: Number(e.target.value) })}
                  className="h-8.5 text-xs bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-600">Max Backdated Days</Label>
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={form.maxBackdatedDays}
                  onChange={(e) => setForm({ ...form, maxBackdatedDays: Number(e.target.value) })}
                  className="h-8.5 text-xs bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-600">Max Future Booking Days</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={form.maxFutureDays}
                  onChange={(e) => setForm({ ...form, maxFutureDays: Number(e.target.value) })}
                  className="h-8.5 text-xs bg-white"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[11px] font-semibold text-slate-600">Attachment Mandatory Above (Days)</Label>
                <Input
                  type="number"
                  min={0}
                  max={30}
                  value={form.requiresAttachmentAboveDays}
                  onChange={(e) => setForm({ ...form, requiresAttachmentAboveDays: Number(e.target.value) })}
                  className="h-8.5 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Checkboxes & Boolean Rules */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-2.5">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Eligibility & Workflow Toggles
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                ['allowHalfDay', 'Allow Half-Day Requests'],
                ['allowBackdatedLeave', 'Allow Backdated Leave'],
                ['allowFutureLeave', 'Allow Future Leave Requests'],
                ['allowProbationLeave', 'Allow Leave During Probation'],
                ['includeHolidaysInLeave', 'Count Holidays in Leave Duration'],
                ['includeWeekendsInLeave', 'Count Weekends in Leave Duration'],
                ['requiresManagerApproval', 'Require Manager Approval'],
                ['requiresHrApproval', 'Require HR Approval'],
                ['isActive', 'Policy Active'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[key] === true}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    className="size-4 rounded text-[#107569] accent-[#107569]"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </FormDrawer>
    </div>
  );
}

export default LeavePoliciesScreen;
