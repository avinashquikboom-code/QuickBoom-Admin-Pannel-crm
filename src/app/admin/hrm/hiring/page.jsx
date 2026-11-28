'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Link2,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Badge } from '@/components/common/Badge';
import { FormDrawer, DrawerFormField } from '@/components/common/drawers/FormDrawer';
import { toast } from '@/hooks/use-toast';
import api from '../../../../../lib/api';

const STATUS_OPTIONS = [
  { value: 'NEW_APPLICATION', label: 'New Application', color: 'bg-sky-100 text-sky-800' },
  { value: 'PENDING', label: 'Pending', color: 'bg-amber-100 text-amber-800' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'INTERVIEW_COMPLETED', label: 'Interview Completed', color: 'bg-purple-100 text-purple-800' },
  { value: 'SELECTED', label: 'Selected', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'REJECTED', label: 'Rejected', color: 'bg-rose-100 text-rose-800' },
  { value: 'ON_HOLD', label: 'On Hold', color: 'bg-slate-100 text-slate-700' },
  { value: 'OFFER_SENT', label: 'Offer Sent', color: 'bg-teal-100 text-teal-800' },
  { value: 'JOINED', label: 'Joined', color: 'bg-green-100 text-green-800' },
];

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s]));

const DEFAULT_FIELD_CONFIG = {
  candidateName: { required: true, visible: true },
  mobileNumber: { required: true, visible: true },
  email: { required: true, visible: true },
  departmentId: { required: true, visible: true },
  currentSalary: { required: false, visible: true },
  expectedSalary: { required: false, visible: true },
  experience: { required: true, visible: true },
  resume: { required: false, visible: true },
};

export default function HiringManagementPage() {
  const [activeTab, setActiveTab] = useState('applications');
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {},
    byDepartment: [],
  });
  const [forms, setForms] = useState([]);
  const [qrMap, setQrMap] = useState({});
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Drawers
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [newForm, setNewForm] = useState({
    title: '',
    description: '',
    departmentIds: [],
    expiresAt: '',
    isActive: true,
    fieldConfig: DEFAULT_FIELD_CONFIG,
  });

  const [addCandidateOpen, setAddCandidateOpen] = useState(false);
  const [candidateSaving, setCandidateSaving] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    candidateName: '',
    countryCode: '+91',
    mobileNumber: '',
    email: '',
    departmentId: '',
    currentSalary: '',
    expectedSalary: '',
    experience: '',
    interviewStatus: 'NEW_APPLICATION',
    remarks: '',
    assignedHrId: '',
  });

  const [editDrawerApp, setEditDrawerApp] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const [scheduleDrawerApp, setScheduleDrawerApp] = useState(null);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [schedulePayload, setSchedulePayload] = useState({
    interviewDate: '',
    interviewTime: '11:00',
    mode: 'IN_PERSON',
    location: '',
    meetingLink: '',
    interviewerName: '',
    notes: '',
    notifyCandidate: true,
  });

  const [convertDrawerApp, setConvertDrawerApp] = useState(null);
  const [convertSaving, setConvertSaving] = useState(false);
  const [convertPayload, setConvertPayload] = useState({
    employeeCode: '',
    departmentId: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    monthlySalary: '',
    password: '',
    mobileLoginEnabled: true,
  });

  const getPublicUrl = useCallback((token) => {
    if (typeof window === 'undefined') return `/apply/${token}`;
    return `${window.location.origin}/apply/${token}`;
  }, []);

  const loadMetadata = useCallback(async () => {
    try {
      const [deptRes, empRes] = await Promise.all([
        api.get('/departments').catch(() => ({ data: [] })),
        api.get('/employees', { params: { limit: 200 } }).catch(() => ({ data: [] })),
      ]);
      const deptList = Array.isArray(deptRes?.data)
        ? deptRes.data
        : deptRes?.data?.data || deptRes?.data?.items || [];
      const empList = Array.isArray(empRes?.data)
        ? empRes.data
        : empRes?.data?.data || empRes?.data?.items || [];
      setDepartments(deptList);
      setEmployees(empList);
    } catch {
      // ignore metadata fallback
    }
  }, []);

  const loadHiringData = useCallback(async () => {
    try {
      setLoading(true);
      const [appsRes, formsRes] = await Promise.all([
        api.get('/hiring/applications', {
          params: {
            ...(search ? { search } : {}),
            ...(statusFilter ? { status: statusFilter } : {}),
            ...(departmentFilter ? { departmentId: departmentFilter } : {}),
            ...(fromDate ? { fromDate } : {}),
            ...(toDate ? { toDate } : {}),
          },
        }),
        api.get('/hiring/forms'),
      ]);

      const appPayload = appsRes?.data?.data || appsRes?.data || {};
      setApplications(appPayload.rows || []);
      setStats(appPayload.stats || { total: 0, byStatus: {}, byDepartment: [] });

      const formList = formsRes?.data?.data || formsRes?.data || [];
      setForms(Array.isArray(formList) ? formList : []);
    } catch (err) {
      toast({
        title: 'Failed to load hiring data',
        description: err?.response?.data?.message || err?.message || 'Unexpected error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, departmentFilter, fromDate, toDate]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    loadHiringData();
  }, [loadHiringData]);

  useEffect(() => {
    let active = true;
    (async () => {
      const next = {};
      for (const f of forms) {
        if (!f?.token) continue;
        try {
          next[f.id] = await QRCode.toDataURL(getPublicUrl(f.token), { width: 180, margin: 1 });
        } catch {
          // ignore qr error
        }
      }
      if (active) setQrMap(next);
    })();
    return () => {
      active = false;
    };
  }, [forms, getPublicUrl]);

  const handleCopyLink = async (token) => {
    const url = getPublicUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied', description: url });
    } catch {
      toast({ title: 'Public Link', description: url });
    }
  };

  const handleDownloadQr = (form) => {
    const dataUrl = qrMap[form.id];
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `hiring-qr-${form.id}.png`;
    a.click();
  };

  const handleCreateForm = async (e) => {
    e.preventDefault();
    if (!newForm.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    try {
      setFormSaving(true);
      await api.post('/hiring/forms', {
        title: newForm.title.trim(),
        description: newForm.description.trim() || undefined,
        departmentIds: newForm.departmentIds.map(Number),
        expiresAt: newForm.expiresAt || undefined,
        isActive: newForm.isActive,
        fieldConfig: newForm.fieldConfig,
      });
      toast({ title: 'Hiring form link created' });
      setCreateFormOpen(false);
      setNewForm({
        title: '',
        description: '',
        departmentIds: [],
        expiresAt: '',
        isActive: true,
        fieldConfig: DEFAULT_FIELD_CONFIG,
      });
      loadHiringData();
    } catch (err) {
      toast({
        title: 'Failed to create hiring form',
        description: err?.response?.data?.message || err?.message,
        variant: 'destructive',
      });
    } finally {
      setFormSaving(false);
    }
  };

  const handleToggleFormActive = async (form) => {
    try {
      await api.patch(`/hiring/forms/${form.id}`, { isActive: !form.isActive });
      toast({ title: form.isActive ? 'Hiring form disabled' : 'Hiring form enabled' });
      loadHiringData();
    } catch (err) {
      toast({
        title: 'Failed to update form status',
        description: err?.response?.data?.message || err?.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    try {
      setCandidateSaving(true);
      await api.post('/hiring/applications', {
        ...newCandidate,
        departmentId: newCandidate.departmentId ? Number(newCandidate.departmentId) : undefined,
        currentSalary: newCandidate.currentSalary ? Number(newCandidate.currentSalary) : undefined,
        expectedSalary: newCandidate.expectedSalary ? Number(newCandidate.expectedSalary) : undefined,
        assignedHrId: newCandidate.assignedHrId ? Number(newCandidate.assignedHrId) : undefined,
      });
      toast({ title: 'Candidate added successfully' });
      setAddCandidateOpen(false);
      setNewCandidate({
        candidateName: '',
        countryCode: '+91',
        mobileNumber: '',
        email: '',
        departmentId: '',
        currentSalary: '',
        expectedSalary: '',
        experience: '',
        interviewStatus: 'NEW_APPLICATION',
        remarks: '',
        assignedHrId: '',
      });
      loadHiringData();
    } catch (err) {
      toast({
        title: 'Failed to add candidate',
        description: err?.response?.data?.message || err?.message,
        variant: 'destructive',
      });
    } finally {
      setCandidateSaving(false);
    }
  };

  const handleUpdateCandidate = async (e) => {
    e.preventDefault();
    if (!editDrawerApp) return;
    try {
      setEditSaving(true);
      await api.patch(`/hiring/applications/${editDrawerApp.id}`, {
        candidateName: editDrawerApp.candidateName,
        mobileNumber: editDrawerApp.mobileNumber,
        email: editDrawerApp.email,
        departmentId: editDrawerApp.departmentId ? Number(editDrawerApp.departmentId) : undefined,
        currentSalary:
          editDrawerApp.currentSalary !== '' && editDrawerApp.currentSalary !== null
            ? Number(editDrawerApp.currentSalary)
            : undefined,
        expectedSalary:
          editDrawerApp.expectedSalary !== '' && editDrawerApp.expectedSalary !== null
            ? Number(editDrawerApp.expectedSalary)
            : undefined,
        experience: editDrawerApp.experience,
        interviewStatus: editDrawerApp.interviewStatus,
        remarks: editDrawerApp.remarks,
        assignedHrId: editDrawerApp.assignedHrId ? Number(editDrawerApp.assignedHrId) : undefined,
        notifyCandidate: true,
      });
      toast({ title: 'Candidate updated' });
      setEditDrawerApp(null);
      loadHiringData();
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err?.response?.data?.message || err?.message,
        variant: 'destructive',
      });
    } finally {
      setEditSaving(false);
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!scheduleDrawerApp) return;
    try {
      setScheduleSaving(true);
      await api.post(`/hiring/applications/${scheduleDrawerApp.id}/interview`, schedulePayload);
      toast({ title: 'Interview scheduled and candidate notified' });
      setScheduleDrawerApp(null);
      loadHiringData();
    } catch (err) {
      toast({
        title: 'Failed to schedule interview',
        description: err?.response?.data?.message || err?.message,
        variant: 'destructive',
      });
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleConvertToEmployee = async (e) => {
    e.preventDefault();
    if (!convertDrawerApp) return;
    try {
      setConvertSaving(true);
      await api.post(`/hiring/applications/${convertDrawerApp.id}/convert`, {
        employeeCode: convertPayload.employeeCode || undefined,
        departmentId: convertPayload.departmentId ? Number(convertPayload.departmentId) : undefined,
        joiningDate: convertPayload.joiningDate,
        monthlySalary: convertPayload.monthlySalary ? Number(convertPayload.monthlySalary) : undefined,
        password: convertPayload.password || undefined,
        mobileLoginEnabled: convertPayload.mobileLoginEnabled,
      });
      toast({ title: 'Candidate converted to Employee!' });
      setConvertDrawerApp(null);
      loadHiringData();
    } catch (err) {
      toast({
        title: 'Conversion failed',
        description: err?.response?.data?.message || err?.message,
        variant: 'destructive',
      });
    } finally {
      setConvertSaving(false);
    }
  };

  const handleDownloadResume = async (app) => {
    try {
      const res = await api.get(`/hiring/applications/${app.id}/resume`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = app.resumeFilename || `resume-${app.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast({
        title: 'Resume unavailable',
        description: err?.response?.data?.message || 'Could not download resume.',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async (format) => {
    try {
      const res = await api.get('/hiring/applications/export', {
        params: {
          format,
          ...(search ? { search } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(departmentFilter ? { departmentId: departmentFilter } : {}),
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `hiring-report.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast({
        title: 'Export failed',
        description: err?.response?.data?.message || err?.message,
        variant: 'destructive',
      });
    }
  };

  const kpiCards = useMemo(() => {
    const bs = stats.byStatus || {};
    return [
      { label: 'Total Applications', value: stats.total || 0, icon: Users, accent: 'text-slate-700 bg-slate-100' },
      { label: 'New / Pending', value: (bs.NEW_APPLICATION || 0) + (bs.PENDING || 0), icon: Briefcase, accent: 'text-sky-700 bg-sky-100' },
      { label: 'Interview Scheduled', value: bs.INTERVIEW_SCHEDULED || 0, icon: CalendarClock, accent: 'text-indigo-700 bg-indigo-100' },
      { label: 'Selected / Offer Sent', value: (bs.SELECTED || 0) + (bs.OFFER_SENT || 0), icon: CheckCircle2, accent: 'text-emerald-700 bg-emerald-100' },
      { label: 'Joined Employees', value: bs.JOINED || 0, icon: UserCheck, accent: 'text-green-800 bg-green-100' },
    ];
  }, [stats]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Hiring & Recruitment"
        description="Manage public hiring form links, QR codes, candidate pipeline, interviews, and employee onboarding."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setCreateFormOpen(true)}>
              <Link2 className="mr-1.5 h-4 w-4" />
              Create Hiring Link
            </Button>
            <Button onClick={() => setAddCandidateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Candidate
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{card.label}</span>
                <span className={`rounded-lg p-2 ${card.accent}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Department-wise summary pills */}
      {Array.isArray(stats.byDepartment) && stats.byDepartment.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Department Pipeline:
          </span>
          {stats.byDepartment.map((d) => (
            <span
              key={d.departmentName}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800"
            >
              {d.departmentName}
              <strong className="text-emerald-700">{d.count}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('applications')}
          className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'applications'
              ? 'border-emerald-700 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Candidate Applications ({applications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('forms')}
          className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'forms'
              ? 'border-emerald-700 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Hiring Form Links & QR ({forms.length})
        </button>
      </div>

      {activeTab === 'applications' ? (
        <div className="space-y-4">
          {/* Filters & Exports */}
          <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, mobile, email..."
                  className="pl-9"
                />
              </div>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                <Download className="mr-1 h-3.5 w-3.5" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')}>
                <FileSpreadsheet className="mr-1 h-3.5 w-3.5" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                <FileText className="mr-1 h-3.5 w-3.5" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={loadHiringData}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Candidate Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Candidate & Email</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Interview Date & Time</th>
                  <th className="px-4 py-3">Current / Expected</th>
                  <th className="px-4 py-3">Experience</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Remarks</th>
                  <th className="px-4 py-3">Resume</th>
                  <th className="px-4 py-3">Applied On</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Assigned HR</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-sm text-slate-500">
                      Loading candidate applications...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-sm text-slate-500">
                      No candidate applications found.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => {
                    const statusMeta = STATUS_MAP[app.interviewStatus] || {
                      label: app.interviewStatus,
                      color: 'bg-slate-100 text-slate-700',
                    };
                    return (
                      <tr key={app.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{app.candidateName}</div>
                          <div className="text-[11px] text-slate-500">{app.email}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {app.countryCode} {app.mobileNumber}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {app.department?.name || '-'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {app.interviewDate ? (
                            <div>
                              <div className="font-medium text-slate-900">{app.interviewDate}</div>
                              <div className="text-[11px] text-slate-500">
                                {app.interviewTime || ''} {app.interviewMode ? `• ${app.interviewMode}` : ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">Not scheduled</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div>Cur: {app.currentSalary ?? '-'}</div>
                          <div className="text-[11px] text-slate-500">
                            Exp: {app.expectedSalary ?? '-'}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">{app.experience || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusMeta.color}`}>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="max-w-[180px] truncate px-4 py-3" title={app.remarks || ''}>
                          {app.remarks || '-'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {app.resumeKey ? (
                            <button
                              type="button"
                              onClick={() => handleDownloadResume(app)}
                              className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline"
                            >
                              <Download className="h-3.5 w-3.5" /> Resume
                            </button>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {app.applicationDate
                            ? new Date(app.applicationDate).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {app.hiringForm?.title || 'Manual Entry'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {app.assignedHr
                            ? `${app.assignedHr.firstName || ''} ${app.assignedHr.lastName || ''}`.trim()
                            : '-'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditDrawerApp({ ...app })}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setScheduleDrawerApp(app);
                                setSchedulePayload({
                                  interviewDate: app.interviewDate || new Date().toISOString().slice(0, 10),
                                  interviewTime: app.interviewTime || '11:00',
                                  mode: app.interviewMode || 'IN_PERSON',
                                  location: app.interviewLocation || '',
                                  meetingLink: app.meetingLink || '',
                                  interviewerName: '',
                                  notes: '',
                                  notifyCandidate: true,
                                });
                              }}
                            >
                              Schedule
                            </Button>
                            {!app.convertedEmployeeId && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setConvertDrawerApp(app);
                                  setConvertPayload({
                                    employeeCode: '',
                                    departmentId: app.departmentId ? String(app.departmentId) : '',
                                    joiningDate: new Date().toISOString().slice(0, 10),
                                    monthlySalary: app.expectedSalary ? String(app.expectedSalary) : '',
                                    password: '',
                                    mobileLoginEnabled: true,
                                  });
                                }}
                              >
                                <UserPlus className="mr-1 h-3.5 w-3.5" /> Convert
                              </Button>
                            )}
                          </div>
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
        /* Hiring Form Links & QR Codes Tab */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {forms.map((form) => {
            const url = getPublicUrl(form.token);
            const expired = form.expiresAt && new Date(form.expiresAt) < new Date();
            return (
              <div
                key={form.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{form.title}</h3>
                      {form.description && (
                        <p className="mt-1 text-xs text-slate-500">{form.description}</p>
                      )}
                    </div>
                    <Badge variant={form.isActive && !expired ? 'success' : 'secondary'}>
                      {expired ? 'Expired' : form.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    {qrMap[form.id] ? (
                      <img
                        src={qrMap[form.id]}
                        alt={`QR for ${form.title}`}
                        className="h-24 w-24 rounded-lg border border-slate-200 p-1"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
                        <QrCode className="h-8 w-8" />
                      </div>
                    )}
                    <div className="space-y-1 text-xs text-slate-600">
                      <div>
                        Submissions: <strong className="text-slate-900">{form.submissionCount || 0}</strong>
                      </div>
                      <div>
                        Expires:{' '}
                        <strong className="text-slate-900">
                          {form.expiresAt ? new Date(form.expiresAt).toLocaleDateString() : 'Never'}
                        </strong>
                      </div>
                      <div className="max-w-[200px] truncate text-[11px] text-emerald-700" title={url}>
                        {url}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <Button variant="outline" size="sm" onClick={() => handleCopyLink(form.token)}>
                    <Copy className="mr-1 h-3.5 w-3.5" /> Copy Link
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadQr(form)}>
                    <Download className="mr-1 h-3.5 w-3.5" /> QR PNG
                  </Button>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleFormActive(form)}
                    className="ml-auto"
                  >
                    {form.isActive ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>
            );
          })}
          {forms.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-500">
              No hiring form links created yet. Click &quot;Create Hiring Link&quot; to generate one.
            </div>
          )}
        </div>
      )}

      {/* Create Hiring Form Drawer */}
      <FormDrawer
        open={createFormOpen}
        onOpenChange={setCreateFormOpen}
        title="Create Public Hiring Form Link"
        description="Generate a shareable link and QR code for candidates to apply without logging in."
        onSubmit={handleCreateForm}
        submitLabel={formSaving ? 'Creating...' : 'Create Hiring Link'}
        loading={formSaving}
      >
        <DrawerFormField label="Form Title" required>
          <Input
            required
            value={newForm.title}
            onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
            placeholder="e.g. Sales & Telecaller Walk-In Hiring"
          />
        </DrawerFormField>
        <DrawerFormField label="Description">
          <Input
            value={newForm.description}
            onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
            placeholder="Short role summary or instructions"
          />
        </DrawerFormField>
        <DrawerFormField label="Expiry Date (Optional)">
          <Input
            type="date"
            value={newForm.expiresAt}
            onChange={(e) => setNewForm({ ...newForm, expiresAt: e.target.value })}
          />
        </DrawerFormField>
        <DrawerFormField label="Applicable Departments (Leave empty for all)">
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3">
            {departments.map((d) => {
              const checked = newForm.departmentIds.includes(d.id);
              return (
                <label key={d.id} className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? newForm.departmentIds.filter((x) => x !== d.id)
                        : [...newForm.departmentIds, d.id];
                      setNewForm({ ...newForm, departmentIds: next });
                    }}
                  />
                  {d.name}
                </label>
              );
            })}
          </div>
        </DrawerFormField>
        <DrawerFormField label="Required Fields">
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3 text-xs">
            {['currentSalary', 'expectedSalary', 'experience', 'resume'].map((key) => (
              <label key={key} className="flex items-center gap-2 text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(newForm.fieldConfig[key]?.required)}
                  onChange={(e) =>
                    setNewForm({
                      ...newForm,
                      fieldConfig: {
                        ...newForm.fieldConfig,
                        [key]: { ...newForm.fieldConfig[key], required: e.target.checked },
                      },
                    })
                  }
                />
                Require {key}
              </label>
            ))}
          </div>
        </DrawerFormField>
      </FormDrawer>

      {/* Manual Add Candidate Drawer */}
      <FormDrawer
        open={addCandidateOpen}
        onOpenChange={setAddCandidateOpen}
        title="Add Candidate Manually"
        description="Record a walk-in or referral candidate directly into the recruitment pipeline."
        onSubmit={handleAddCandidate}
        submitLabel={candidateSaving ? 'Saving...' : 'Add Candidate'}
        loading={candidateSaving}
      >
        <DrawerFormField label="Candidate Name" required>
          <Input
            required
            value={newCandidate.candidateName}
            onChange={(e) => setNewCandidate({ ...newCandidate, candidateName: e.target.value })}
          />
        </DrawerFormField>
        <div className="grid grid-cols-2 gap-3">
          <DrawerFormField label="Mobile Number" required>
            <Input
              required
              value={newCandidate.mobileNumber}
              onChange={(e) => setNewCandidate({ ...newCandidate, mobileNumber: e.target.value })}
            />
          </DrawerFormField>
          <DrawerFormField label="Email Address" required>
            <Input
              type="email"
              required
              value={newCandidate.email}
              onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
            />
          </DrawerFormField>
        </div>
        <DrawerFormField label="Department" required>
          <select
            required
            value={newCandidate.departmentId}
            onChange={(e) => setNewCandidate({ ...newCandidate, departmentId: e.target.value })}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </DrawerFormField>
        <div className="grid grid-cols-2 gap-3">
          <DrawerFormField label="Current Salary">
            <Input
              type="number"
              value={newCandidate.currentSalary}
              onChange={(e) => setNewCandidate({ ...newCandidate, currentSalary: e.target.value })}
            />
          </DrawerFormField>
          <DrawerFormField label="Expected Salary">
            <Input
              type="number"
              value={newCandidate.expectedSalary}
              onChange={(e) => setNewCandidate({ ...newCandidate, expectedSalary: e.target.value })}
            />
          </DrawerFormField>
        </div>
        <DrawerFormField label="Experience" required>
          <Input
            required
            value={newCandidate.experience}
            onChange={(e) => setNewCandidate({ ...newCandidate, experience: e.target.value })}
            placeholder="e.g. 2 Years"
          />
        </DrawerFormField>
        <DrawerFormField label="Remarks">
          <Input
            value={newCandidate.remarks}
            onChange={(e) => setNewCandidate({ ...newCandidate, remarks: e.target.value })}
          />
        </DrawerFormField>
      </FormDrawer>

      {/* Edit Candidate Drawer */}
      <FormDrawer
        open={Boolean(editDrawerApp)}
        onOpenChange={(open) => !open && setEditDrawerApp(null)}
        title="Edit Candidate & Status"
        description="Update candidate details, HR assignment, interview status, and remarks."
        onSubmit={handleUpdateCandidate}
        submitLabel={editSaving ? 'Saving...' : 'Save Changes'}
        loading={editSaving}
      >
        {editDrawerApp && (
          <>
            <DrawerFormField label="Candidate Name">
              <Input
                value={editDrawerApp.candidateName || ''}
                onChange={(e) =>
                  setEditDrawerApp({ ...editDrawerApp, candidateName: e.target.value })
                }
              />
            </DrawerFormField>
            <div className="grid grid-cols-2 gap-3">
              <DrawerFormField label="Mobile">
                <Input
                  value={editDrawerApp.mobileNumber || ''}
                  onChange={(e) =>
                    setEditDrawerApp({ ...editDrawerApp, mobileNumber: e.target.value })
                  }
                />
              </DrawerFormField>
              <DrawerFormField label="Email">
                <Input
                  type="email"
                  value={editDrawerApp.email || ''}
                  onChange={(e) => setEditDrawerApp({ ...editDrawerApp, email: e.target.value })}
                />
              </DrawerFormField>
            </div>
            <DrawerFormField label="Interview Status">
              <select
                value={editDrawerApp.interviewStatus || 'NEW_APPLICATION'}
                onChange={(e) =>
                  setEditDrawerApp({ ...editDrawerApp, interviewStatus: e.target.value })
                }
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </DrawerFormField>
            <DrawerFormField label="Assigned HR Employee">
              <select
                value={editDrawerApp.assignedHrId || ''}
                onChange={(e) =>
                  setEditDrawerApp({ ...editDrawerApp, assignedHrId: e.target.value })
                }
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </DrawerFormField>
            <DrawerFormField label="Remarks">
              <Input
                value={editDrawerApp.remarks || ''}
                onChange={(e) => setEditDrawerApp({ ...editDrawerApp, remarks: e.target.value })}
              />
            </DrawerFormField>
          </>
        )}
      </FormDrawer>

      {/* Schedule Interview Drawer */}
      <FormDrawer
        open={Boolean(scheduleDrawerApp)}
        onOpenChange={(open) => !open && setScheduleDrawerApp(null)}
        title="Schedule / Reschedule Interview"
        description={
          scheduleDrawerApp
            ? `Schedule interview for ${scheduleDrawerApp.candidateName}`
            : ''
        }
        onSubmit={handleScheduleInterview}
        submitLabel={scheduleSaving ? 'Scheduling...' : 'Save Interview'}
        loading={scheduleSaving}
      >
        <div className="grid grid-cols-2 gap-3">
          <DrawerFormField label="Interview Date" required>
            <Input
              type="date"
              required
              value={schedulePayload.interviewDate}
              onChange={(e) =>
                setSchedulePayload({ ...schedulePayload, interviewDate: e.target.value })
              }
            />
          </DrawerFormField>
          <DrawerFormField label="Interview Time" required>
            <Input
              type="time"
              required
              value={schedulePayload.interviewTime}
              onChange={(e) =>
                setSchedulePayload({ ...schedulePayload, interviewTime: e.target.value })
              }
            />
          </DrawerFormField>
        </div>
        <DrawerFormField label="Interview Mode">
          <select
            value={schedulePayload.mode}
            onChange={(e) => setSchedulePayload({ ...schedulePayload, mode: e.target.value })}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="IN_PERSON">In-Person</option>
            <option value="ONLINE">Online</option>
          </select>
        </DrawerFormField>
        {schedulePayload.mode === 'IN_PERSON' ? (
          <DrawerFormField label="Office Location">
            <Input
              value={schedulePayload.location}
              onChange={(e) => setSchedulePayload({ ...schedulePayload, location: e.target.value })}
              placeholder="e.g. Head Office, 3rd Floor"
            />
          </DrawerFormField>
        ) : (
          <DrawerFormField label="Meeting Link">
            <Input
              value={schedulePayload.meetingLink}
              onChange={(e) =>
                setSchedulePayload({ ...schedulePayload, meetingLink: e.target.value })
              }
              placeholder="https://meet.google.com/..."
            />
          </DrawerFormField>
        )}
        <DrawerFormField label="Interviewer Name">
          <Input
            value={schedulePayload.interviewerName}
            onChange={(e) =>
              setSchedulePayload({ ...schedulePayload, interviewerName: e.target.value })
            }
          />
        </DrawerFormField>
        <DrawerFormField label="Notes">
          <Input
            value={schedulePayload.notes}
            onChange={(e) => setSchedulePayload({ ...schedulePayload, notes: e.target.value })}
          />
        </DrawerFormField>
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={schedulePayload.notifyCandidate}
            onChange={(e) =>
              setSchedulePayload({ ...schedulePayload, notifyCandidate: e.target.checked })
            }
          />
          Send Email & WhatsApp notification to candidate
        </label>
      </FormDrawer>

      {/* Convert Candidate to Employee Drawer */}
      <FormDrawer
        open={Boolean(convertDrawerApp)}
        onOpenChange={(open) => !open && setConvertDrawerApp(null)}
        title="Convert Candidate to Employee"
        description={
          convertDrawerApp
            ? `Onboard ${convertDrawerApp.candidateName} as a QB Suite employee.`
            : ''
        }
        onSubmit={handleConvertToEmployee}
        submitLabel={convertSaving ? 'Converting...' : 'Create Employee'}
        loading={convertSaving}
      >
        <DrawerFormField label="Joining Date" required>
          <Input
            type="date"
            required
            value={convertPayload.joiningDate}
            onChange={(e) => setConvertPayload({ ...convertPayload, joiningDate: e.target.value })}
          />
        </DrawerFormField>
        <DrawerFormField label="Department">
          <select
            value={convertPayload.departmentId}
            onChange={(e) =>
              setConvertPayload({ ...convertPayload, departmentId: e.target.value })
            }
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="">Use Candidate Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </DrawerFormField>
        <DrawerFormField label="Monthly Salary">
          <Input
            type="number"
            value={convertPayload.monthlySalary}
            onChange={(e) =>
              setConvertPayload({ ...convertPayload, monthlySalary: e.target.value })
            }
          />
        </DrawerFormField>
        <DrawerFormField label="Employee Code (Optional)">
          <Input
            value={convertPayload.employeeCode}
            onChange={(e) =>
              setConvertPayload({ ...convertPayload, employeeCode: e.target.value })
            }
            placeholder="Auto-generated if blank"
          />
        </DrawerFormField>
        <DrawerFormField label="Initial Password (Optional)">
          <Input
            type="password"
            value={convertPayload.password}
            onChange={(e) => setConvertPayload({ ...convertPayload, password: e.target.value })}
            placeholder="Default password if blank"
          />
        </DrawerFormField>
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={convertPayload.mobileLoginEnabled}
            onChange={(e) =>
              setConvertPayload({ ...convertPayload, mobileLoginEnabled: e.target.checked })
            }
          />
          Enable Mobile App Login
        </label>
      </FormDrawer>
    </div>
  );
}
