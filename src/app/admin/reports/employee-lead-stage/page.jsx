'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  BarChart3,
  Briefcase,
  Calendar,
  CalendarCheck,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  History,
  Percent,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../../../../../lib/api';
import { PageTitleCard } from '@/components/common/PageTitleCard';
import { KpiCard } from '@/components/common/KpiCard';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { HotDealIndicator } from '@/modules/crm/HotDealIndicator';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this_week', label: 'This Week' },
  { id: 'last_week', label: 'Last Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_year', label: 'This Year' },
  { id: 'last_year', label: 'Last Year' },
  { id: 'custom', label: 'Custom Range' },
];

const WEEKDAYS = [
  { id: 'ALL', label: 'All Days' },
  { id: 'MONDAY', label: 'Monday' },
  { id: 'TUESDAY', label: 'Tuesday' },
  { id: 'WEDNESDAY', label: 'Wednesday' },
  { id: 'THURSDAY', label: 'Thursday' },
  { id: 'FRIDAY', label: 'Friday' },
  { id: 'SATURDAY', label: 'Saturday' },
  { id: 'SUNDAY', label: 'Sunday' },
];

const EXPORT_MODES = [
  { id: 'all_complete', label: 'All Employees – Complete Report', desc: 'Summary + employee-grouped detailed lead tables' },
  { id: 'detailed', label: 'Employee-Wise with Detailed Leads', desc: 'Each executive summary followed by their leads' },
  { id: 'summary_only', label: 'Employee-Wise Summary Report', desc: 'Executive KPIs & dynamic stage counts' },
  { id: 'individual', label: 'Individual Employee Report', desc: 'Focused report for one selected executive' },
  { id: 'stage_wise', label: 'Stage-Wise Lead Report', desc: 'Leads grouped by dynamic CRM stages' },
];

const SECTION_TABS = [
  { id: 'all', label: 'All Sections' },
  { id: 'charts', label: 'Charts & Trends' },
  { id: 'employees', label: 'Employee Breakdown' },
  { id: 'history', label: 'Stage History' },
];

export default function EmployeeLeadStageReportPage() {
  const [preset, setPreset] = React.useState('this_month');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [dayOfWeek, setDayOfWeek] = React.useState('ALL');
  const [departmentId, setDepartmentId] = React.useState('ALL');
  const [stageKey, setStageKey] = React.useState('ALL');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState([]);
  const [countMode, setCountMode] = React.useState('current');
  const [activeTab, setActiveTab] = React.useState('all');

  const [exportOpen, setExportOpen] = React.useState(false);
  const [exportScope, setExportScope] = React.useState('all_complete');
  const [exportEmployeeId, setExportEmployeeId] = React.useState('');

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [exporting, setExporting] = React.useState('');
  const [report, setReport] = React.useState(null);

  const [drillTarget, setDrillTarget] = React.useState(null);
  const [drillPage, setDrillPage] = React.useState(1);
  const [drillSearch, setDrillSearch] = React.useState('');
  const [drillLoading, setDrillLoading] = React.useState(false);
  const [drillData, setDrillData] = React.useState({
    rows: [],
    pagination: { page: 1, total: 0, totalPages: 1 },
  });

  const buildParams = React.useCallback(
    (extra = {}) => ({
      preset,
      dateFrom: preset === 'custom' && dateFrom ? dateFrom : undefined,
      dateTo: preset === 'custom' && dateTo ? dateTo : undefined,
      dayOfWeek: dayOfWeek !== 'ALL' ? dayOfWeek : undefined,
      departmentId: departmentId !== 'ALL' ? departmentId : undefined,
      stageKey: stageKey !== 'ALL' ? stageKey : undefined,
      employeeIds: selectedEmployeeIds.length ? selectedEmployeeIds.join(',') : undefined,
      ...extra,
    }),
    [preset, dateFrom, dateTo, dayOfWeek, departmentId, stageKey, selectedEmployeeIds]
  );

  const loadReport = React.useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await api.get('/reports/employee-lead-stage', { params: buildParams() });
        const payload = res?.data?.data || res?.data || res;
        setReport(payload);
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || 'Failed to load report');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [buildParams]
  );

  React.useEffect(() => {
    loadReport();
  }, [loadReport]);

  const loadDrilldown = React.useCallback(
    async (target, page = 1, search = '') => {
      if (!target) return;
      setDrillLoading(true);
      try {
        const res = await api.get('/reports/employee-lead-stage/drilldown', {
          params: buildParams({
            drillEmployeeId: target.employeeId || undefined,
            drillStageKey: target.stageKey || undefined,
            mode: target.mode || 'current',
            page,
            limit: 15,
            search: search.trim() || undefined,
          }),
        });
        const payload = res?.data?.data || res?.data || {};
        setDrillData({
          rows: Array.isArray(payload.rows) ? payload.rows : [],
          pagination: payload.pagination || { page: 1, total: 0, totalPages: 1 },
        });
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load drill-down leads');
      } finally {
        setDrillLoading(false);
      }
    },
    [buildParams]
  );

  const openDrilldown = (target) => {
    setDrillTarget(target);
    setDrillPage(1);
    setDrillSearch('');
    loadDrilldown(target, 1, '');
  };

  React.useEffect(() => {
    if (!drillTarget) return;
    const t = setTimeout(() => loadDrilldown(drillTarget, drillPage, drillSearch), 200);
    return () => clearTimeout(t);
  }, [drillTarget, drillPage, drillSearch, loadDrilldown]);

  const handleExport = async (format, overrideScope, overrideEmployeeId) => {
    const scopeToUse = overrideScope || exportScope;
    const empIdToUse = overrideEmployeeId || (scopeToUse === 'individual' ? exportEmployeeId : '');
    if (scopeToUse === 'individual' && !empIdToUse) {
      toast.error('Please select an employee for Individual Employee Report');
      return;
    }
    setExporting(format);
    try {
      const response = await api.post(
        '/reports/employee-lead-stage/export',
        buildParams({
          format,
          mode: countMode,
          exportScope: scopeToUse,
          exportEmployeeId: empIdToUse || undefined,
        }),
        { responseType: 'blob' }
      );
      const blob = response instanceof Blob ? response : new Blob([response?.data || response]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = format === 'excel' ? 'xlsx' : format;
      a.download = `QuikBoom_Lead_Report_${scopeToUse}_${new Date().toISOString().slice(0, 10)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportOpen(false);
      toast.success(`Exported ${format.toUpperCase()} report`);
    } catch (err) {
      toast.error(err?.response?.data?.message || `Failed to export ${format.toUpperCase()}`);
    } finally {
      setExporting('');
    }
  };

  const resetFilters = () => {
    setPreset('this_month');
    setDateFrom('');
    setDateTo('');
    setDayOfWeek('ALL');
    setDepartmentId('ALL');
    setStageKey('ALL');
    setSelectedEmployeeIds([]);
  };

  const toggleEmployee = (id) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const summary = report?.summary || {};
  const stages = Array.isArray(report?.stages) ? report.stages : [];
  const employeeRows = Array.isArray(report?.employeeRows) ? report.employeeRows : [];
  const charts = report?.charts || {};
  const stageHistory = Array.isArray(report?.stageHistory) ? report.stageHistory : [];
  const employees = Array.isArray(report?.employees) ? report.employees : [];
  const departments = Array.isArray(report?.departments) ? report.departments : [];

  const showCharts = activeTab === 'all' || activeTab === 'charts';
  const showEmployees = activeTab === 'all' || activeTab === 'employees';
  const showHistory = activeTab === 'all' || activeTab === 'history';

  return (
    <div className="w-full min-w-0 space-y-5 pb-24">
      <PageTitleCard
        moduleName="ENTERPRISE REPORTS"
        breadcrumb="Employee-Wise Lead & Stage"
        title="Employee-Wise Lead & Stage Report"
        description="Executive pipeline performance, dynamic CRM stages, transition history, and lead drill-downs."
        badge={
          report?.dateRange
            ? `${report.dateRange.from} → ${report.dateRange.to}`
            : 'Live Data'
        }
        badgeVariant="green"
        icon={BarChart3}
        actions={
          <div className="relative flex flex-wrap items-center gap-2">
            <Link
              href="/admin/reports"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              <ArrowLeft className="size-3.5" />
              All Reports
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadReport(true)}
              disabled={refreshing || loading}
              className="h-10 gap-1.5 rounded-xl border-slate-200 bg-white px-3.5 text-xs font-semibold shadow-2xs"
            >
              <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
              Refresh
            </Button>

            <Button
              size="sm"
              onClick={() => handleExport('pdf')}
              disabled={Boolean(exporting)}
              className="h-10 gap-1.5 rounded-xl bg-[#173D30] px-4 text-xs font-semibold text-white shadow-xs hover:bg-[#123026]"
            >
              <FileText className="size-3.5 text-[#20C466]" />
              <span>{exporting === 'pdf' ? 'Exporting...' : 'Download PDF'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('excel')}
              disabled={Boolean(exporting)}
              className="h-10 gap-1.5 rounded-xl border-slate-200 bg-white px-3.5 text-xs font-semibold shadow-2xs"
            >
              <FileSpreadsheet className="size-3.5 text-emerald-600" />
              <span>{exporting === 'excel' ? '...' : 'Excel'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={Boolean(exporting)}
              className="h-10 gap-1.5 rounded-xl border-slate-200 bg-white px-3.5 text-xs font-semibold shadow-2xs"
            >
              <Download className="size-3.5 text-slate-600" />
              <span>{exporting === 'csv' ? '...' : 'CSV'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportOpen((v) => !v)}
              className="h-10 gap-1.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold shadow-2xs"
            >
              <span>Report Type</span>
              <ChevronDown className={cn('size-3.5 transition-transform', exportOpen && 'rotate-180')} />
            </Button>

            {exportOpen && (
              <div className="absolute right-0 top-12 z-40 w-[340px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Export Configuration
                  </span>
                  <button
                    type="button"
                    onClick={() => setExportOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <div className="mt-3 space-y-1.5">
                  {EXPORT_MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setExportScope(m.id)}
                      className={cn(
                        'w-full rounded-xl border p-2.5 text-left transition',
                        exportScope === m.id
                          ? 'border-[#173D30] bg-emerald-50/60'
                          : 'border-slate-100 hover:bg-slate-50'
                      )}
                    >
                      <div className="text-xs font-semibold text-slate-900">{m.label}</div>
                      <div className="text-[11px] text-slate-500">{m.desc}</div>
                    </button>
                  ))}
                </div>

                {exportScope === 'individual' && (
                  <div className="mt-3">
                    <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                      Select Executive
                    </label>
                    <select
                      value={exportEmployeeId}
                      onChange={(e) => setExportEmployeeId(e.target.value)}
                      className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800"
                    >
                      <option value="">Choose an employee...</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('pdf')}
                    disabled={Boolean(exporting)}
                    className="h-9 gap-1.5 rounded-xl border-slate-200 text-xs font-semibold"
                  >
                    <FileText className="size-3.5 text-rose-600" />
                    {exporting === 'pdf' ? '...' : 'PDF'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('excel')}
                    disabled={Boolean(exporting)}
                    className="h-9 gap-1.5 rounded-xl border-slate-200 text-xs font-semibold"
                  >
                    <FileSpreadsheet className="size-3.5 text-emerald-600" />
                    {exporting === 'excel' ? '...' : 'Excel'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleExport('csv')}
                    disabled={Boolean(exporting)}
                    className="h-9 gap-1.5 rounded-xl bg-[#173D30] text-xs font-semibold text-white hover:bg-[#123026]"
                  >
                    <Download className="size-3.5 text-[#20C466]" />
                    {exporting === 'csv' ? '...' : 'CSV'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        }
      />

      {/* Unified Filters Card */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Filter className="size-3.5 text-[#173D30]" />
            Filters &amp; Time Range (Asia/Kolkata)
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-8 gap-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-[#173D30]"
          >
            <RotateCcw className="size-3.5" />
            Reset All
          </Button>
        </div>

        {/* Date Preset Bar */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-1.5">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                preset === p.id
                  ? 'bg-[#173D30] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div
          className={cn(
            'grid grid-cols-1 gap-3 sm:grid-cols-2',
            preset === 'custom' ? 'lg:grid-cols-5' : 'lg:grid-cols-3'
          )}
        >
          {preset === 'custom' && (
            <>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-500">Day-Wise Filter</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700"
            >
              {WEEKDAYS.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-500">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-500">Lead Stage (Dynamic)</label>
            <select
              value={stageKey}
              onChange={(e) => setStageKey(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700"
            >
              <option value="ALL">All CRM Stages</option>
              {stages.map((s) => (
                <option key={s.key} value={s.key}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Employee Pills */}
        {employees.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">
                Sales Executives ({selectedEmployeeIds.length ? `${selectedEmployeeIds.length} selected` : 'All'})
              </span>
              {selectedEmployeeIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedEmployeeIds([])}
                  className="text-[11px] font-semibold text-[#173D30] hover:underline"
                >
                  Clear selection
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {employees.map((emp) => {
                const active = selectedEmployeeIds.includes(emp.id);
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => toggleEmployee(emp.id)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition',
                      active
                        ? 'border-[#173D30] bg-emerald-50 text-[#173D30] font-semibold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {emp.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 10 Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard title="Total Assigned Leads" value={loading ? '—' : summary.totalAssignedLeads ?? 0} icon={Users} />
        <KpiCard title="New Leads" value={loading ? '—' : summary.newLeads ?? 0} icon={Sparkles} iconColor="text-sky-600" iconBg="bg-sky-50 border-sky-200/80" />
        <KpiCard title="Total Leads Worked On" value={loading ? '—' : summary.totalLeadsWorkedOn ?? 0} icon={Briefcase} iconColor="text-indigo-600" iconBg="bg-indigo-50 border-indigo-200/80" />
        <KpiCard title="🔥 Hot Deals / Leads" value={loading ? '—' : summary.hotDeals ?? 0} icon={Flame} iconColor="text-orange-600" iconBg="bg-orange-50 border-orange-200/80" />
        <KpiCard title="Follow-Up Leads" value={loading ? '—' : summary.followUpLeads ?? 0} icon={CalendarClock} iconColor="text-amber-600" iconBg="bg-amber-50 border-amber-200/80" />
        <KpiCard title="Visits Scheduled" value={loading ? '—' : summary.visitsScheduled ?? 0} icon={Calendar} iconColor="text-violet-600" iconBg="bg-violet-50 border-violet-200/80" />
        <KpiCard title="Visits Completed" value={loading ? '—' : summary.visitsCompleted ?? 0} icon={CalendarCheck} iconColor="text-teal-600" iconBg="bg-teal-50 border-teal-200/80" />
        <KpiCard title="Won Leads" value={loading ? '—' : summary.wonLeads ?? 0} icon={Award} iconColor="text-emerald-700" iconBg="bg-emerald-50 border-emerald-200/80" />
        <KpiCard title="Lost Leads" value={loading ? '—' : summary.lostLeads ?? 0} icon={XCircle} iconColor="text-rose-600" iconBg="bg-rose-50 border-rose-200/80" />
        <KpiCard title="Conversion Rate" value={loading ? '—' : `${summary.conversionRate ?? 0}%`} icon={Percent} iconColor="text-[#173D30]" iconBg="bg-emerald-50 border-emerald-200/80" />
      </div>

      {/* Section View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
          {SECTION_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition',
                activeTab === t.id
                  ? 'bg-[#173D30] text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      {showCharts && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900">Employee-Wise Lead Performance</h3>
              <p className="text-xs text-slate-500">Assigned vs Worked On vs Won leads per executive</p>
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.employeePerformance || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="assigned" name="Assigned" fill="#0F172A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="workedOn" name="Worked On" fill="#0284C7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="won" name="Won" fill="#20C466" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900">Stage-Wise Lead Distribution</h3>
              <p className="text-xs text-slate-500">Live distribution across all active CRM stages</p>
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(charts.stageDistribution || []).filter((s) => s.count > 0)}
                      dataKey="count"
                      nameKey="stageName"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={2}
                    >
                      {(charts.stageDistribution || [])
                        .filter((s) => s.count > 0)
                        .map((entry) => (
                          <Cell key={entry.stageKey} fill={entry.color || '#0284C7'} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900">Daily Lead Activity Trend</h3>
              <p className="text-xs text-slate-500">New leads vs stage transitions per day (Asia/Kolkata)</p>
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.dailyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="assigned" name="Assigned Leads" stroke="#173D30" fill="#173D30" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="stageChanges" name="Stage Transitions" stroke="#0284C7" fill="#0284C7" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="won" name="Won Leads" stroke="#20C466" fill="#20C466" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900">Hot Deals vs Won Leads &amp; Conversion %</h3>
              <p className="text-xs text-slate-500">Executive conversion efficiency &amp; pipeline closing</p>
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.hotVsWon || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="hotDeals" name="Hot Deals / Hot Leads" fill="#EA580C" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="wonLeads" name="Won Leads" fill="#16A34A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Employee-Wise Dynamic Stage Breakdown Table */}
      {showEmployees && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Employee-Wise Stage Breakdown</h2>
              <p className="text-xs text-slate-500">
                Click any employee or stage count to drill down, or download an individual executive report.
              </p>
            </div>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCountMode('current')}
                className={cn(
                  'rounded-lg px-3 py-1 transition',
                  countMode === 'current' ? 'bg-white text-[#173D30] shadow-2xs' : 'text-slate-500'
                )}
              >
                Current Stage Counts
              </button>
              <button
                type="button"
                onClick={() => setCountMode('transition')}
                className={cn(
                  'rounded-lg px-3 py-1 transition',
                  countMode === 'transition' ? 'bg-white text-[#173D30] shadow-2xs' : 'text-slate-500'
                )}
              >
                Stage Transitions in Period
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-3 py-3">Dept</th>
                  <th className="px-3 py-3 text-right">Assigned</th>
                  <th className="px-3 py-3 text-right">Worked On</th>
                  <th className="px-3 py-3 text-right">Conv %</th>
                  {stages.map((s) => (
                    <th key={s.key} className="px-3 py-3 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right">Export</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeeRows.length === 0 ? (
                  <tr>
                    <td colSpan={6 + stages.length} className="px-4 py-10 text-center text-slate-500">
                      {loading ? 'Loading employee report...' : 'No employee lead records found for the selected filters.'}
                    </td>
                  </tr>
                ) : (
                  employeeRows.map((row) => (
                    <tr key={row.employeeId} className="hover:bg-emerald-50/30">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            openDrilldown({
                              title: `${row.name} — All Leads`,
                              employeeId: row.employeeId,
                              mode: countMode,
                            })
                          }
                          className="font-semibold text-[#173D30] hover:underline text-left"
                        >
                          {row.name}
                        </button>
                        <div className="text-[11px] text-slate-400">{row.employeeCode}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{row.departmentName}</td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-900">
                        <button
                          type="button"
                          onClick={() =>
                            openDrilldown({
                              title: `${row.name} — Assigned Leads`,
                              employeeId: row.employeeId,
                              mode: 'current',
                            })
                          }
                          className="hover:underline"
                        >
                          {row.totalAssignedLeads}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-sky-700">
                        <button
                          type="button"
                          onClick={() =>
                            openDrilldown({
                              title: `${row.name} — Leads Worked On`,
                              employeeId: row.employeeId,
                              mode: 'transition',
                            })
                          }
                          className="hover:underline"
                        >
                          {row.totalLeadsWorkedOn}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-emerald-700">
                        {row.conversionRate}%
                      </td>
                      {stages.map((s) => {
                        const val =
                          countMode === 'transition'
                            ? row.stageTransitionCounts?.[s.key] || 0
                            : row.stageCounts?.[s.key] || 0;
                        return (
                          <td key={s.key} className="px-3 py-3 text-right">
                            <button
                              type="button"
                              disabled={val === 0}
                              onClick={() =>
                                openDrilldown({
                                  title: `${row.name} — ${s.name}`,
                                  employeeId: row.employeeId,
                                  stageKey: s.key,
                                  mode: countMode,
                                })
                              }
                              className={cn(
                                'rounded-md px-2 py-0.5 font-semibold',
                                val > 0
                                  ? 'bg-slate-100 text-slate-900 hover:bg-emerald-100 hover:text-[#173D30]'
                                  : 'text-slate-300 cursor-default'
                              )}
                            >
                              {val}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            title={`Download ${row.name} PDF`}
                            onClick={() => handleExport('pdf', 'individual', String(row.employeeId))}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            PDF
                          </button>
                          <button
                            type="button"
                            title={`Download ${row.name} Excel`}
                            onClick={() => handleExport('excel', 'individual', String(row.employeeId))}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            XLSX
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Lead Stage History Table */}
      {showHistory && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 p-4">
            <div className="flex items-center gap-2">
              <History className="size-4 text-[#173D30]" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Lead Stage Transition History</h2>
                <p className="text-xs text-slate-500">Actual stage transitions performed in the selected period (Asia/Kolkata).</p>
              </div>
            </div>
            <Badge className="bg-slate-100 text-slate-700">{stageHistory.length} Transitions</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Lead / Business</th>
                  <th className="px-3 py-3">Previous Stage</th>
                  <th className="px-3 py-3">New Stage</th>
                  <th className="px-3 py-3">Employee Responsible</th>
                  <th className="px-3 py-3">Date &amp; Time (IST)</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stageHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No stage transitions recorded for the selected filters.
                    </td>
                  </tr>
                ) : (
                  stageHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{h.customerName}</div>
                        <div className="text-[11px] text-slate-500">{h.businessName}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{h.previousStage}</td>
                      <td className="px-3 py-3">
                        <Badge className="border border-emerald-200 bg-emerald-50 text-[#173D30]">
                          {h.newStage}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-800">{h.employeeName}</td>
                      <td className="px-3 py-3 text-slate-600">{h.changedAtFormatted}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[220px] truncate">{h.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Drill-Down Drawer */}
      <FormDrawer
        open={Boolean(drillTarget)}
        onOpenChange={(open) => {
          if (!open) setDrillTarget(null);
        }}
        title={drillTarget?.title || 'Lead Drill-Down'}
        description="Paginated lead records matching the selected employee, stage, and filters."
        size="xl"
        showFooter={false}
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, business, phone..."
              value={drillSearch}
              onChange={(e) => {
                setDrillSearch(e.target.value);
                setDrillPage(1);
              }}
              className="h-9 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs text-slate-800"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[780px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5">Customer &amp; Business</th>
                  <th className="px-3 py-2.5">Contact</th>
                  <th className="px-3 py-2.5">Current Stage</th>
                  <th className="px-3 py-2.5">Previous Stage</th>
                  <th className="px-3 py-2.5">Assigned Employee</th>
                  <th className="px-3 py-2.5">Stage Updated</th>
                  <th className="px-3 py-2.5">Follow-Up</th>
                  <th className="px-3 py-2.5 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drillLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      Loading leads...
                    </td>
                  </tr>
                ) : drillData.rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No matching leads found.
                    </td>
                  </tr>
                ) : (
                  drillData.rows.map((lead) => (
                    <tr key={lead.leadId} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/admin/crm/leads?leadId=${encodeURIComponent(lead.leadId)}`}
                          className="font-semibold text-[#173D30] hover:underline"
                        >
                          {lead.customerName}
                        </Link>
                        <div className="text-[11px] text-slate-500">{lead.businessName}</div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">{lead.contactNumber}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge className="bg-slate-100 text-slate-800">{lead.currentStage}</Badge>
                          {lead.isHotLead && (
                            <HotDealIndicator lead={{ stage: { key: lead.currentStageKey } }} />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">{lead.previousStage}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-700">{lead.assignedEmployee}</td>
                      <td className="px-3 py-2.5 text-slate-500">{lead.stageUpdatedAtFormatted}</td>
                      <td className="px-3 py-2.5 text-slate-500">{lead.followUpDateFormatted}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                        ₹{Number(lead.leadValue || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Total: {drillData.pagination.total} leads</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={drillPage <= 1}
                onClick={() => setDrillPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5 text-xs"
              >
                <ChevronLeft className="size-3.5" />
                Prev
              </Button>
              <span>
                Page {drillData.pagination.page} of {drillData.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={drillPage >= drillData.pagination.totalPages}
                onClick={() => setDrillPage((p) => p + 1)}
                className="h-8 px-2.5 text-xs"
              >
                Next
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </FormDrawer>
    </div>
  );
}
