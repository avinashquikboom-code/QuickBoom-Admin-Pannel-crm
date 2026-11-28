'use client';

import * as React from 'react';
import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  Mail,
  MessageSquare,
  Bell,
  Play,
  RefreshCw,
  Search,
  Target,
  Users,
  X,
} from 'lucide-react';
import api from '../../../../../lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { toast } from '@/hooks/use-toast';

function statusPillClass(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'SENT') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (s === 'FAILED') return 'bg-rose-50 text-rose-700 border border-rose-200';
  if (s === 'SKIPPED') return 'bg-slate-100 text-slate-600 border border-slate-200';
  return 'bg-amber-50 text-amber-700 border border-amber-200';
}

function scoreColorClass(score) {
  const n = Number(score || 0);
  if (n >= 100) return { text: 'text-emerald-700', bar: 'bg-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
  if (n >= 70) return { text: 'text-amber-700', bar: 'bg-amber-500', bg: 'bg-amber-50 border-amber-200' };
  return { text: 'text-rose-700', bar: 'bg-rose-600', bg: 'bg-rose-50 border-rose-200' };
}

function initials(name) {
  return String(name || 'E')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

export default function TelecallerPerformancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [activeTab, setActiveTab] = React.useState('performance');
  const [rows, setRows] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [limitation, setLimitation] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filters, setFilters] = React.useState({
    fromDate: today,
    toDate: today,
    departmentId: 'ALL',
    achievementStatus: 'ALL',
  });
  const [detail, setDetail] = React.useState(null);
  const [detailRowMeta, setDetailRowMeta] = React.useState(null);
  const [deliveryHistory, setDeliveryHistory] = React.useState([]);
  const [triggeringSchedule, setTriggeringSchedule] = React.useState(false);

  const loadDashboard = React.useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, deptRes, histRes] = await Promise.all([
        api.get('/telecaller-targets/dashboard', {
          params: {
            fromDate: filters.fromDate,
            toDate: filters.toDate,
            ...(filters.departmentId !== 'ALL' ? { departmentId: filters.departmentId } : {}),
            ...(filters.achievementStatus !== 'ALL' ? { achievementStatus: filters.achievementStatus } : {}),
          },
        }),
        api.get('/departments', { params: { limit: 100 } }).catch(() => ({ data: [] })),
        api.get('/telecaller-targets/reports/history', { params: { businessDate: filters.toDate } }).catch(() => ({ data: [] })),
      ]);
      const data = dashRes?.data || dashRes || {};
      setRows(data.rows || []);
      setLimitation(data.callVerificationLimitation || '');
      const deptList = Array.isArray(deptRes?.data) ? deptRes.data : Array.isArray(deptRes) ? deptRes : [];
      setDepartments(deptList);
      const histList = histRes?.data?.data || histRes?.data || [];
      setDeliveryHistory(Array.isArray(histList) ? histList : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load performance dashboard');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const filteredRows = React.useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.trim().toLowerCase();
    return rows.filter(
      (r) =>
        String(r.employeeName || '').toLowerCase().includes(q) ||
        String(r.employeeCode || '').toLowerCase().includes(q) ||
        String(r.department || '').toLowerCase().includes(q),
    );
  }, [rows, searchTerm]);

  const kpis = React.useMemo(() => {
    const totalEmployees = filteredRows.length;
    const totalAssigned = filteredRows.reduce((s, r) => s + Number(r.assignedTargets || 0), 0);
    const totalAchieved = filteredRows.reduce((s, r) => s + Number(r.actualAchievements || 0), 0);
    const totalRewards = filteredRows.reduce((s, r) => s + Number(r.rewardPoints || 0), 0);
    const avgScore =
      totalEmployees > 0
        ? filteredRows.reduce((s, r) => s + Number(r.overallScore || 0), 0) / totalEmployees
        : 0;
    const goodCount = filteredRows.filter((r) => Number(r.overallScore || 0) >= 100).length;
    const avgCount = filteredRows.filter((r) => Number(r.overallScore || 0) >= 70 && Number(r.overallScore || 0) < 100).length;
    const poorCount = filteredRows.filter((r) => Number(r.overallScore || 0) < 70).length;
    return {
      totalEmployees,
      totalAssigned,
      totalAchieved,
      totalRewards,
      avgScore: avgScore.toFixed(1),
      goodCount,
      avgCount,
      poorCount,
    };
  }, [filteredRows]);

  const handleExport = async (format) => {
    try {
      const res = await api.get('/telecaller-targets/dashboard/export', {
        params: {
          format,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          ...(filters.departmentId !== 'ALL' ? { departmentId: filters.departmentId } : {}),
          ...(filters.achievementStatus !== 'ALL' ? { achievementStatus: filters.achievementStatus } : {}),
        },
        responseType: 'blob',
      });
      const blob = new Blob([res], {
        type:
          format === 'pdf'
            ? 'application/pdf'
            : format === 'xlsx'
              ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `telecaller-performance-${filters.fromDate}-to-${filters.toDate}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(`Export (${format.toUpperCase()}) failed`);
    }
  };

  const handleRetryReport = async (reportId) => {
    try {
      await api.post(`/telecaller-targets/reports/${reportId}/retry`, {});
      toast.success('Report delivery retry triggered');
      loadDashboard();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Retry failed');
    }
  };

  const openEmployeeDetail = async (row) => {
    try {
      const res = await api.get(`/telecaller-targets/dashboard/employee/${row.employeeId}`, {
        params: { range: 'custom', fromDate: filters.fromDate, toDate: filters.toDate },
      });
      setDetailRowMeta(row);
      setDetail(res?.data || res);
    } catch {
      toast.error('Failed to load employee details');
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Telecaller Performance Dashboard"
        description="Monitor daily targets, call achievements, reward points, and automated 10:00 PM IST report deliveries."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => handleExport('csv')}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => handleExport('xlsx')}>
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Excel
            </Button>
            <Button size="sm" className="h-9 bg-brand text-xs text-white hover:bg-primary-hover" onClick={() => handleExport('pdf')}>
              <FileText className="mr-1.5 h-3.5 w-3.5" /> Export PDF
            </Button>
          </div>
        }
      />

      {/* Executive KPI Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Telecallers</span>
            <span className="rounded-lg bg-slate-100 p-2 text-slate-700">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{kpis.totalEmployees}</div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">{kpis.goodCount} Good</span>
            <span className="rounded bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-700">{kpis.avgCount} Avg</span>
            <span className="rounded bg-rose-50 px-1.5 py-0.5 font-semibold text-rose-700">{kpis.poorCount} Poor</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Targets Achieved</span>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
              <Target className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-700">{kpis.totalAchieved}</span>
            <span className="text-xs font-medium text-slate-400">/ {kpis.totalAssigned} assigned</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Remaining: <strong className="text-slate-700">{Math.max(0, kpis.totalAssigned - kpis.totalAchieved)}</strong>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Avg Performance Score</span>
            <span className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
              <BarChart3 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{kpis.avgScore}%</div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full transition-all ${scoreColorClass(kpis.avgScore).bar}`}
              style={{ width: `${Math.min(100, Number(kpis.avgScore))}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Reward Points Earned</span>
            <span className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Award className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">+{kpis.totalRewards} pts</div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            <Clock className="h-3 w-3 text-emerald-600" />
            Auto-reports scheduled at 10:00 PM IST
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 items-end">
          <div className="space-y-1 lg:col-span-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Search Employee</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, code, department..."
                className="h-9 pl-9 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">From Date</label>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">To Date</label>
            <Input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Department</label>
            <select
              value={filters.departmentId}
              onChange={(e) => setFilters((f) => ({ ...f, departmentId: e.target.value }))}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-emerald-600"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</label>
              <select
                value={filters.achievementStatus}
                onChange={(e) => setFilters((f) => ({ ...f, achievementStatus: e.target.value }))}
                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-emerald-600"
              >
                <option value="ALL">All Statuses</option>
                <option value="EXCEEDED">Exceeded</option>
                <option value="COMPLETED">Completed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="NOT_STARTED">Not Started</option>
              </select>
            </div>
            <Button variant="outline" size="sm" className="h-9 px-2.5" onClick={loadDashboard} title="Refresh">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Subtle Telemetry Note */}
      {limitation && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-[11.5px] text-slate-600">
          <Info className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span>{limitation}</span>
        </div>
      )}

      {/* Workspace Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('performance')}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'performance'
                ? 'border-emerald-700 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Employee Performance ({filteredRows.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('delivery')}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'delivery'
                ? 'border-emerald-700 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            10:00 PM Delivery History ({deliveryHistory.length})
          </button>
        </div>

        {activeTab === 'delivery' && (
          <Button
            size="sm"
            variant="outline"
            disabled={triggeringSchedule}
            className="mb-1.5 h-8 text-xs"
            onClick={async () => {
              setTriggeringSchedule(true);
              try {
                await api.post('/telecaller-targets/reports/run-scheduled', { businessDate: filters.toDate });
                toast.success('Scheduled daily report job executed');
                loadDashboard();
              } catch (err) {
                toast.error(err?.response?.data?.message || 'Failed to trigger reports');
              } finally {
                setTriggeringSchedule(false);
              }
            }}
          >
            <Play className="mr-1.5 h-3 w-3" />
            {triggeringSchedule ? 'Running...' : 'Run Daily Reports Now'}
          </Button>
        )}
      </div>

      {/* Tab 1: Employee Performance Table */}
      {activeTab === 'performance' ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Shift & Attendance</th>
                  <th className="px-4 py-3 text-right">Assigned</th>
                  <th className="px-4 py-3 text-right">Achieved</th>
                  <th className="px-4 py-3 text-right">Pending</th>
                  <th className="px-4 py-3">Performance Score</th>
                  <th className="px-4 py-3 text-right">Rewards</th>
                  <th className="px-4 py-3">Report Delivery</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                      Loading telecaller performance...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                      No employee target performance found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r) => {
                    const sc = scoreColorClass(r.overallScore);
                    return (
                      <tr key={r.employeeId} className="transition hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800">
                              {initials(r.employeeName)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{r.employeeName}</div>
                              <div className="text-[11px] text-slate-500">
                                {r.employeeCode} · {r.department}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-700">{r.shiftName || 'Standard Shift'}</div>
                          <span className="mt-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            {r.attendanceStatus || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700">{r.assignedTargets}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-700">{r.actualAchievements}</td>
                        <td className="px-4 py-3 text-right font-medium text-amber-700">{r.pendingTargets}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${sc.bar}`}
                                style={{ width: `${Math.min(100, Number(r.overallScore || 0))}%` }}
                              />
                            </div>
                            <span className={`w-11 text-right font-bold ${sc.text}`}>{r.overallScore}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                            +{r.rewardPoints || 0} pts
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {r.latestReportId ? (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${statusPillClass(r.emailStatus)}`}>
                                <Mail className="h-2.5 w-2.5" /> {r.emailStatus}
                              </span>
                              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${statusPillClass(r.whatsappStatus)}`}>
                                <MessageSquare className="h-2.5 w-2.5" /> {r.whatsappStatus}
                              </span>
                              {(r.emailStatus === 'FAILED' || r.whatsappStatus === 'FAILED') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-5 px-1.5 text-[10px]"
                                  onClick={() => handleRetryReport(r.latestReportId)}
                                >
                                  Retry
                                </Button>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-600">
                              <Clock className="h-3 w-3 text-slate-400" /> Scheduled 10:00 PM
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7.5 text-xs font-medium"
                            onClick={() => openEmployeeDetail(r)}
                          >
                            View Report
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab 2: 10:00 PM Daily Report Delivery History */
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Classification</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">WhatsApp</th>
                  <th className="px-4 py-3">Push Notification</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveryHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      No scheduled reports recorded for {filters.toDate}. Reports trigger automatically at 10:00 PM IST.
                    </td>
                  </tr>
                ) : (
                  deliveryHistory.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {rep.employee ? `${rep.employee.firstName} ${rep.employee.lastName}` : `Emp #${rep.employeeId}`}
                        {rep.isProvisional && (
                          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                            Provisional
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            rep.classification === 'GOOD'
                              ? 'success'
                              : rep.classification === 'AVERAGE'
                                ? 'warning'
                                : 'destructive'
                          }
                        >
                          {rep.classification}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-semibold ${statusPillClass(rep.emailStatus)}`}>
                          <Mail className="h-3 w-3" /> {rep.emailStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-semibold ${statusPillClass(rep.whatsappStatus)}`}>
                          <MessageSquare className="h-3 w-3" /> {rep.whatsappStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-semibold ${statusPillClass(rep.pushStatus)}`}>
                          <Bell className="h-3 w-3" /> {rep.pushStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px]"
                          onClick={async () => {
                            const res = await api.get(`/telecaller-targets/reports/${rep.id}/pdf`, { responseType: 'blob' });
                            const url = URL.createObjectURL(new Blob([res], { type: 'application/pdf' }));
                            window.open(url, '_blank');
                          }}
                        >
                          Preview PDF
                        </Button>
                        {(rep.emailStatus === 'FAILED' || rep.whatsappStatus === 'FAILED' || rep.pushStatus === 'FAILED') && (
                          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => handleRetryReport(rep.id)}>
                            Retry Failed
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-Over Employee Performance Detail Drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[1px]">
          <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {detailRowMeta?.employeeName || `Employee #${detail.employeeId}`}
                </h3>
                <p className="text-xs text-slate-500">
                  {detailRowMeta?.employeeCode ? `${detailRowMeta.employeeCode} · ` : ''}
                  {detail.fromDate} to {detail.toDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[11px] text-slate-500">Overall Score</div>
                  <div className={`mt-1 text-xl font-bold ${scoreColorClass(detail.overallScore).text}`}>
                    {detail.overallScore}%
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[11px] text-slate-500">Call Connection</div>
                  <div className="mt-1 text-xl font-bold text-slate-900">{detail.callConnectionRate}%</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[11px] text-slate-500">Lead Conversion</div>
                  <div className="mt-1 text-xl font-bold text-slate-900">{detail.leadConversionRate}%</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[11px] text-slate-500">Targets Met</div>
                  <div className="mt-1 flex items-center gap-1 text-xl font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    {detail.completedTargets}/{detail.completedTargets + detail.missedTargets}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Metric Breakdown</h4>
                {(detail.metricsSummary || []).map((m) => {
                  const sc = scoreColorClass(m.achievementPct);
                  return (
                    <div key={m.metricKey} className="rounded-xl border border-slate-200 p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-800">{m.metricLabel}</span>
                        <span className={sc.text}>
                          {m.actual} / {m.target} ({m.achievementPct}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${sc.bar}`} style={{ width: `${Math.min(100, m.achievementPct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
