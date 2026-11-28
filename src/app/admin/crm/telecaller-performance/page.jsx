'use client';

import * as React from 'react';
import api from '../../../../../lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { toast } from '@/hooks/use-toast';

export default function TelecallerPerformancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [rows, setRows] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [limitation, setLimitation] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState({
    fromDate: today,
    toDate: today,
    departmentId: 'ALL',
    achievementStatus: 'ALL',
  });
  const [detail, setDetail] = React.useState(null);
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
        type: format === 'pdf' ? 'application/pdf' : format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv',
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

  const openEmployeeDetail = async (employeeId) => {
    try {
      const res = await api.get(`/telecaller-targets/dashboard/employee/${employeeId}`, {
        params: { range: 'custom', fromDate: filters.fromDate, toDate: filters.toDate },
      });
      setDetail(res?.data || res);
    } catch {
      toast.error('Failed to load employee details');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Telecaller Performance Dashboard"
        description="Track employee-wise targets, call connection, lead conversion, daily/weekly/monthly trends, and automated report deliveries."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs h-9" onClick={() => handleExport('csv')}>Export CSV</Button>
            <Button variant="outline" size="sm" className="text-xs h-9" onClick={() => handleExport('xlsx')}>Export Excel</Button>
            <Button size="sm" className="bg-brand text-white text-xs h-9" onClick={() => handleExport('pdf')}>Export PDF</Button>
          </div>
        }
      />

      {limitation && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          {limitation}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input type="date" value={filters.fromDate} onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))} className="h-9 text-xs" />
        <Input type="date" value={filters.toDate} onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))} className="h-9 text-xs" />
        <Select value={filters.departmentId} onValueChange={(v) => setFilters((f) => ({ ...f, departmentId: v }))}>
          <SelectTrigger className="h-9 text-xs w-full"><SelectValue placeholder="All Departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={String(d.id)} className="text-xs">{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.achievementStatus} onValueChange={(v) => setFilters((f) => ({ ...f, achievementStatus: v }))}>
          <SelectTrigger className="h-9 text-xs w-full"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
            <SelectItem value="EXCEEDED" className="text-xs">Exceeded</SelectItem>
            <SelectItem value="COMPLETED" className="text-xs">Completed</SelectItem>
            <SelectItem value="IN_PROGRESS" className="text-xs">In Progress</SelectItem>
            <SelectItem value="NOT_STARTED" className="text-xs">Not Started</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Employee Performance Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Shift / Attendance</th>
                <th className="px-4 py-3 text-right">Assigned</th>
                <th className="px-4 py-3 text-right">Achieved</th>
                <th className="px-4 py-3 text-right">Pending</th>
                <th className="px-4 py-3 text-right">Score %</th>
                <th className="px-4 py-3 text-right">Reward Pts</th>
                <th className="px-4 py-3">Report Delivery</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading performance data...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No employee target performance found for this filter.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.employeeId} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{r.employeeName}</div>
                      <div className="text-[11px] text-slate-500">{r.employeeCode} · {r.department}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{r.shiftName}</div>
                      <Badge className="mt-0.5 bg-slate-100 text-slate-700 text-[10px]">{r.attendanceStatus}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{r.assignedTargets}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">{r.actualAchievements}</td>
                    <td className="px-4 py-3 text-right text-amber-700">{r.pendingTargets}</td>
                    <td className="px-4 py-3 text-right font-bold">{r.overallScore}%</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600">+{r.rewardPoints || 0}</td>
                    <td className="px-4 py-3">
                      {r.latestReportId ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge className={r.emailStatus === 'SENT' ? 'bg-emerald-100 text-emerald-800 text-[10px]' : 'bg-rose-100 text-rose-800 text-[10px]'}>
                            Email: {r.emailStatus}
                          </Badge>
                          <Badge className={r.whatsappStatus === 'SENT' ? 'bg-emerald-100 text-emerald-800 text-[10px]' : 'bg-rose-100 text-rose-800 text-[10px]'}>
                            WA: {r.whatsappStatus}
                          </Badge>
                          {(r.emailStatus === 'FAILED' || r.whatsappStatus === 'FAILED') && (
                            <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={() => handleRetryReport(r.latestReportId)}>
                              Retry
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">Pending punch-out</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openEmployeeDetail(r.employeeId)}>
                        View Report
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scheduled Report Delivery History (Email / WhatsApp / Push) */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">10:00 PM Daily Report Delivery History ({filters.toDate})</h3>
            <p className="text-xs text-slate-500">Independent Email, WhatsApp, and Push delivery statuses with PDF preview and retry.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={triggeringSchedule}
            className="text-xs h-8"
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
            {triggeringSchedule ? 'Running...' : 'Run Daily Reports Now'}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5">Classification</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">WhatsApp</th>
                <th className="px-4 py-2.5">Push</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deliveryHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">No scheduled reports recorded for {filters.toDate}.</td>
                </tr>
              ) : (
                deliveryHistory.map((rep) => (
                  <tr key={rep.id}>
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      {rep.employee ? `${rep.employee.firstName} ${rep.employee.lastName}` : `Emp #${rep.employeeId}`}
                      {rep.isProvisional && <span className="ml-1.5 text-[10px] rounded bg-amber-100 text-amber-800 px-1.5 py-0.5">Provisional</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={rep.classification === 'GOOD' ? 'success' : rep.classification === 'AVERAGE' ? 'warning' : 'destructive'}>
                        {rep.classification}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">{rep.emailStatus}</td>
                    <td className="px-4 py-2.5">{rep.whatsappStatus}</td>
                    <td className="px-4 py-2.5">{rep.pushStatus}</td>
                    <td className="px-4 py-2.5 text-right space-x-1.5">
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

      {/* Employee Performance Detail Card */}
      {detail && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Employee Performance Detail (#{detail.employeeId})</h3>
              <p className="text-xs text-slate-500">{detail.fromDate} to {detail.toDate}</p>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setDetail(null)}>Close</Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg border p-3"><div className="text-slate-500">Overall Score</div><div className="text-lg font-bold">{detail.overallScore}%</div></div>
            <div className="rounded-lg border p-3"><div className="text-slate-500">Call Connection</div><div className="text-lg font-bold">{detail.callConnectionRate}%</div></div>
            <div className="rounded-lg border p-3"><div className="text-slate-500">Lead Conversion</div><div className="text-lg font-bold">{detail.leadConversionRate}%</div></div>
            <div className="rounded-lg border p-3"><div className="text-slate-500">Completed / Missed</div><div className="text-lg font-bold">{detail.completedTargets} / {detail.missedTargets}</div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(detail.metricsSummary || []).map((m) => (
              <div key={m.metricKey} className="rounded-lg border border-slate-200 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between font-semibold">
                  <span>{m.metricLabel}</span>
                  <span>{m.actual} / {m.target} ({m.achievementPct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#107569]" style={{ width: `${Math.min(100, m.achievementPct)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
