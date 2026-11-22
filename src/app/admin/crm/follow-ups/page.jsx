'use client';

import * as React from 'react';
import { PageTitleCard } from '@/components/common/PageTitleCard';
import {
  Search,
  Filter,
  Phone,
  PhoneCall,
  Mail,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit,
  X,
  User,
  Users,
  MessageSquare,
  MapPin,
  CalendarClock,
  MoreHorizontal,
  Check,
  CalendarDays,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { toast } from '@/hooks/use-toast';
import {
  loadEmployees,
  loadLeads,
  logFollowUp,
  personName,
  sessionCan,
  crmError,
} from '@/modules/crm/crm-api';
import { cn } from '@/lib/utils';

// Helper: Format YYYY-MM-DD from date string
function dayOf(value) {
  if (!value) return '';
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return String(value).slice(0, 10);
  }
}

// Helper: Today YYYY-MM-DD
function today() {
  return new Date().toISOString().slice(0, 10);
}

// Helper: Pretty date formatting
function formatDisplayDate(value) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value).slice(0, 10);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(value).slice(0, 10);
  }
}

// Helper: Pretty time formatting
function formatDisplayTime(timeStr, dateStr) {
  if (timeStr) {
    // If it's already "10:30" or "10:30 AM"
    if (timeStr.includes(':')) return timeStr;
  }
  if (dateStr) {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      }
    } catch {
      // fallback
    }
  }
  return timeStr || '—';
}

// Helper: Determine state of lead follow-up
function followUpState(row) {
  const next = dayOf(row.nextFollowUpDate);
  const hasHistory = row.latestFollowUp || (row.followUpHistory && row.followUpHistory.length > 0);
  if (!next && hasHistory) return 'completed';
  if (!next) return 'unscheduled';
  if (next < today()) return 'overdue';
  if (next === today()) return 'today';
  return 'upcoming';
}

// Helper: Normalize lead record from possible nested properties
function leadRecord(row) {
  return row?.lead?.id
    ? {
        ...row,
        ...row.lead,
        id: row.lead.id,
        phone: row.lead.mobileNumber || row.phone,
        companyName: row.lead.companyName || row.companyName,
      }
    : row;
}

// Helper: Lead display label
function leadLabel(row) {
  const lead = leadRecord(row);
  if (!lead?.id) return 'Not Linked';
  const person = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
  return person || lead.name || lead.title || lead.companyName || `Lead #${lead.id}`;
}

// Follow-up type badge helper
function FollowUpTypeBadge({ type }) {
  const rawType = String(type || 'CALL').toUpperCase();

  if (rawType === 'WHATSAPP') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 shadow-2xs">
        <MessageSquare className="size-3 text-emerald-600" />
        WhatsApp
      </span>
    );
  }
  if (rawType === 'EMAIL') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-800 shadow-2xs">
        <Mail className="size-3 text-purple-600" />
        Email
      </span>
    );
  }
  if (rawType === 'MEETING') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 shadow-2xs">
        <Users className="size-3 text-indigo-600" />
        Meeting
      </span>
    );
  }
  if (rawType === 'VISIT') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 shadow-2xs">
        <MapPin className="size-3 text-amber-600" />
        Visit
      </span>
    );
  }
  if (rawType === 'OTHER') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 shadow-2xs">
        <Clock className="size-3 text-slate-500" />
        Other
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 shadow-2xs">
      <Phone className="size-3 text-blue-600" />
      Call
    </span>
  );
}

// Follow-up status pill
function FollowUpStatusPill({ row }) {
  const state = followUpState(row);

  if (state === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 shadow-2xs">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Completed
      </span>
    );
  }
  if (state === 'overdue') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 shadow-2xs">
        <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
        Overdue
      </span>
    );
  }
  if (state === 'today') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-[#E8F1EC] px-2.5 py-0.5 text-xs font-semibold text-[#173D30] shadow-2xs">
        <span className="size-1.5 rounded-full bg-[#20C466]" />
        Today
      </span>
    );
  }
  if (state === 'upcoming') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-800 shadow-2xs">
        <span className="size-1.5 rounded-full bg-sky-500" />
        Upcoming
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
      <span className="size-1.5 rounded-full bg-slate-400" />
      Unscheduled
    </span>
  );
}

// Export follow-ups to CSV
function exportFollowUpsToCsv(rows) {
  if (!rows || rows.length === 0) {
    toast.error('No follow-up records available to export.');
    return;
  }

  const headers = [
    'Lead ID',
    'Lead Name',
    'Company',
    'Mobile Number',
    'Email',
    'Status',
    'Follow-up Date',
    'Follow-up Time',
    'Follow-up Type',
    'Notes',
    'Latest Outcome',
    'Assigned Employee',
    'Deal Title',
    'Deal Stage',
  ];

  const escapeCell = (val) => {
    const s = String(val ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvRows = [
    headers.join(','),
    ...rows.map((row) => {
      const rec = leadRecord(row);
      const state = followUpState(row);
      const assigned = personName(row.assignedTo || row.employee);
      return [
        escapeCell(rec.id),
        escapeCell(leadLabel(row)),
        escapeCell(rec.companyName || '—'),
        escapeCell(rec.phone || rec.mobileNumber || '—'),
        escapeCell(rec.email || '—'),
        escapeCell(state.toUpperCase()),
        escapeCell(row.nextFollowUpDate ? dayOf(row.nextFollowUpDate) : (row.latestFollowUp?.createdAt ? dayOf(row.latestFollowUp.createdAt) : 'Not Scheduled')),
        escapeCell(row.nextFollowUpTime || row.latestFollowUp?.followUpTime || '—'),
        escapeCell(row.latestFollowUp?.type || 'CALL'),
        escapeCell(row.latestFollowUp?.notes || row.workNotes || '—'),
        escapeCell(row.latestFollowUp?.outcome || '—'),
        escapeCell(assigned || 'Unassigned'),
        escapeCell(row.deal?.title || '—'),
        escapeCell(row.deal?.stage || '—'),
      ].join(',');
    }),
  ];

  const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `crm-follow-ups-${today()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success(`Exported ${rows.length} follow-up records.`);
}

export default function FollowUpsRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [employees, setEmployees] = React.useState([]);
  const [rawLeads, setRawLeads] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [selectedLeadId, setSelectedLeadId] = React.useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState('');
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  // Sorting
  const [sortKey, setSortKey] = React.useState('nextFollowUpDate');
  const [sortDir, setSortDir] = React.useState('asc');

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);

  // Selection
  const [selectedIds, setSelectedIds] = React.useState([]);

  // Drawers & Modals
  const [logDrawerOpen, setLogDrawerOpen] = React.useState(false);
  const [logForm, setLogForm] = React.useState({
    leadId: '',
    type: 'CALL',
    outcome: '',
    notes: '',
    nextFollowUpDate: '',
    nextFollowUpTime: '',
  });
  const [savingLog, setSavingLog] = React.useState(false);

  // Reschedule Drawer
  const [rescheduleLead, setRescheduleLead] = React.useState(null);
  const [rescheduleDate, setRescheduleDate] = React.useState('');
  const [rescheduleTime, setRescheduleTime] = React.useState('');
  const [rescheduleNotes, setRescheduleNotes] = React.useState('');
  const [savingReschedule, setSavingReschedule] = React.useState(false);

  // Detail View Drawer
  const [detailLead, setDetailLead] = React.useState(null);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load Permissions & Sales Employees
  React.useEffect(() => {
    setAllowed(sessionCan('LEADS') || sessionCan('CRM'));
    loadEmployees({ salesOnly: true })
      .then(setEmployees)
      .catch(() => setEmployees([]));
  }, []);

  // Fetch Leads with Follow-ups from Backend
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadLeads({
        limit: 100,
        followUps: true,
      });
      const rows = Array.isArray(result?.rows) ? result.rows : [];
      setRawLeads(rows);
      setError('');
    } catch (err) {
      setError(crmError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData, refresh]);

  // KPI Calculations across all loaded leads
  const kpiStats = React.useMemo(() => {
    let total = 0;
    let completed = 0;
    let pending = 0;
    let overdue = 0;

    for (const lead of rawLeads) {
      const state = followUpState(lead);
      const hasFollowUp = lead.nextFollowUpDate || lead.latestFollowUp || (lead.followUpHistory && lead.followUpHistory.length > 0);
      if (hasFollowUp) {
        total += 1;
        if (state === 'completed') completed += 1;
        if (state === 'today' || state === 'upcoming') pending += 1;
        if (state === 'overdue') overdue += 1;
      }
    }

    return { total, completed, pending, overdue };
  }, [rawLeads]);

  // Filtered Leads
  const filteredRows = React.useMemo(() => {
    return rawLeads.filter((row) => {
      const rec = leadRecord(row);
      const state = followUpState(row);

      // Status filter
      if (statusFilter === 'TODAY' && state !== 'today') return false;
      if (statusFilter === 'UPCOMING' && state !== 'upcoming') return false;
      if (statusFilter === 'PENDING' && state !== 'today' && state !== 'upcoming') return false;
      if (statusFilter === 'OVERDUE' && state !== 'overdue') return false;
      if (statusFilter === 'COMPLETED' && state !== 'completed') return false;
      if (statusFilter === 'UNSCHEDULED' && state !== 'unscheduled') return false;

      // Lead selector
      if (selectedLeadId && String(rec.id) !== String(selectedLeadId)) return false;

      // Employee selector
      if (selectedEmployeeId) {
        const empId = String(row.assignedToId || row.assignedTo?.id || row.employee?.id || '');
        if (empId !== String(selectedEmployeeId)) return false;
      }

      // Date filter
      if (dateFilter) {
        const nextDay = dayOf(row.nextFollowUpDate);
        const lastDay = dayOf(row.latestFollowUp?.createdAt);
        if (nextDay !== dateFilter && lastDay !== dateFilter) return false;
      }

      // Search term
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const nameMatch = leadLabel(row).toLowerCase().includes(q);
        const compMatch = (rec.companyName || '').toLowerCase().includes(q);
        const phoneMatch = (rec.phone || rec.mobileNumber || '').toLowerCase().includes(q);
        const emailMatch = (rec.email || '').toLowerCase().includes(q);
        const notesMatch = (row.latestFollowUp?.notes || row.workNotes || '').toLowerCase().includes(q);
        if (!nameMatch && !compMatch && !phoneMatch && !emailMatch && !notesMatch) return false;
      }

      return true;
    });
  }, [rawLeads, statusFilter, selectedLeadId, selectedEmployeeId, dateFilter, debouncedSearch]);

  // Sorting
  const sortedRows = React.useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === 'name') {
        valA = leadLabel(a).toLowerCase();
        valB = leadLabel(b).toLowerCase();
      } else if (sortKey === 'company') {
        valA = (leadRecord(a).companyName || '').toLowerCase();
        valB = (leadRecord(b).companyName || '').toLowerCase();
      } else if (sortKey === 'nextFollowUpDate') {
        valA = a.nextFollowUpDate ? new Date(a.nextFollowUpDate).getTime() : 0;
        valB = b.nextFollowUpDate ? new Date(b.nextFollowUpDate).getTime() : 0;
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }

      valA = String(valA || '');
      valB = String(valB || '');
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortKey, sortDir]);

  // Paginated Rows
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const paginatedRows = sortedRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setStatusFilter('ALL');
    setSelectedLeadId('');
    setSelectedEmployeeId('');
    setDateFilter('');
    setCurrentPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    debouncedSearch || statusFilter !== 'ALL' || selectedLeadId || selectedEmployeeId || dateFilter
  );

  // Open Log Drawer for a specific lead or new
  const handleOpenLogDrawer = (lead = null) => {
    if (lead) {
      setLogForm({
        leadId: String(lead.id),
        type: 'CALL',
        outcome: '',
        notes: '',
        nextFollowUpDate: '',
        nextFollowUpTime: '',
      });
    } else {
      setLogForm({
        leadId: rawLeads[0]?.id ? String(rawLeads[0].id) : '',
        type: 'CALL',
        outcome: '',
        notes: '',
        nextFollowUpDate: '',
        nextFollowUpTime: '',
      });
    }
    setLogDrawerOpen(true);
  };

  // Submit Log Follow-up
  const handleSaveLog = async (e) => {
    e.preventDefault();
    if (!logForm.leadId) {
      toast.error('Please select a lead.');
      return;
    }
    if (!logForm.outcome.trim()) {
      toast.error('Please enter an outcome for this follow-up.');
      return;
    }

    setSavingLog(true);
    try {
      await logFollowUp(logForm.leadId, {
        type: logForm.type,
        outcome: logForm.outcome.trim(),
        notes: logForm.notes?.trim() || undefined,
        nextFollowUpDate: logForm.nextFollowUpDate || undefined,
        nextFollowUpTime: logForm.nextFollowUpTime || undefined,
        schedule: false,
      });
      toast.success('Follow-up logged successfully');
      setLogDrawerOpen(false);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(crmError(err));
    } finally {
      setSavingLog(false);
    }
  };

  // Mark follow-up as completed immediately
  const handleMarkCompleted = async (lead) => {
    try {
      await logFollowUp(lead.id, {
        outcome: 'Completed',
        notes: 'Follow-up call completed',
        schedule: false,
      });
      toast.success(`Follow-up for "${leadLabel(lead)}" marked as completed`);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(crmError(err));
    }
  };

  // Open Reschedule Modal
  const handleOpenReschedule = (lead) => {
    setRescheduleLead(lead);
    setRescheduleDate(lead.nextFollowUpDate ? dayOf(lead.nextFollowUpDate) : today());
    setRescheduleTime(lead.nextFollowUpTime || '10:00 AM');
    setRescheduleNotes('');
  };

  // Submit Reschedule
  const handleSaveReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleLead) return;
    if (!rescheduleDate) {
      toast.error('Please select a rescheduled follow-up date.');
      return;
    }

    setSavingReschedule(true);
    try {
      await logFollowUp(rescheduleLead.id, {
        schedule: true,
        nextFollowUpDate: rescheduleDate,
        nextFollowUpTime: rescheduleTime || undefined,
        notes: rescheduleNotes?.trim() || 'Rescheduled follow-up slot',
      });
      toast.success(`Follow-up for "${leadLabel(rescheduleLead)}" rescheduled`);
      setRescheduleLead(null);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(crmError(err));
    } finally {
      setSavingReschedule(false);
    }
  };

  // Select all rows on current page
  const handleSelectAll = (checked) => {
    if (checked) {
      const pageIds = paginatedRows.map((r) => r.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = new Set(paginatedRows.map((r) => r.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  const isAllCurrentSelected =
    paginatedRows.length > 0 && paginatedRows.every((r) => selectedIds.includes(r.id));

  return (
    <div className="space-y-5 pb-28 w-full min-w-0">
      {/* 1. Page Title Card */}
      <PageTitleCard
        moduleName="CRM"
        breadcrumb="Follow-ups"
        title="Follow-ups"
        description="Scheduled lead follow-ups. Completed calls stay in history and are not treated as the next follow-up."
        icon={PhoneCall}
        badge={`${kpiStats.total} Total`}
        badgeVariant="green"
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => exportFollowUpsToCsv(sortedRows)}
              disabled={loading || sortedRows.length === 0}
              className="h-10 gap-1.5 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#173D30] shadow-2xs"
            >
              <Download className="size-3.5 text-slate-500" />
              <span>Export Follow-ups</span>
            </Button>

            {allowed && (
              <Button
                type="button"
                size="sm"
                onClick={() => handleOpenLogDrawer(null)}
                className="h-10 gap-1.5 rounded-xl bg-[#173D30] hover:bg-[#123026] text-white text-xs font-semibold shadow-xs"
              >
                <Phone className="size-3.5 text-[#20C466]" />
                <span>Log Follow-up</span>
              </Button>
            )}
          </>
        }
      />

      {/* 2. Four Responsive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Follow-ups */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Total Follow-ups</span>
            <div className="size-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
              <CalendarClock className="size-4 text-slate-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#173D30] tracking-tight">
              {kpiStats.total}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">All scheduled & completed records</p>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#173D30]" />
        </div>

        {/* Card 2: Completed (Green styling) */}
        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-900">Completed</span>
            <div className="size-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-300">
              <CheckCircle2 className="size-4 text-emerald-700" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-900 tracking-tight">
              {kpiStats.completed}
            </div>
            <p className="text-[11px] text-emerald-700/80 mt-0.5">Finished calls logged in history</p>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#10B981]" />
        </div>

        {/* Card 3: Pending (Amber styling) */}
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/40 p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-900">Pending</span>
            <div className="size-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-300">
              <Clock className="size-4 text-amber-700" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-900 tracking-tight">
              {kpiStats.pending}
            </div>
            <p className="text-[11px] text-amber-700/80 mt-0.5">Scheduled for today & upcoming</p>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#F59E0B]" />
        </div>

        {/* Card 4: Overdue (Red styling) */}
        <div className="rounded-2xl border border-rose-200/90 bg-rose-50/40 p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-900">Overdue</span>
            <div className="size-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center border border-rose-300">
              <AlertTriangle className="size-4 text-rose-700" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-rose-900 tracking-tight">
              {kpiStats.overdue}
            </div>
            <p className="text-[11px] text-rose-700/80 mt-0.5">Action required past scheduled date</p>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#EF4444]" />
        </div>
      </div>

      {/* 3. Modern Filter Panel */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Search Input: Debounced (Lead Name, Company, Mobile, Email) */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search follow-ups by lead name, company, mobile or email..."
              className="pl-10 pr-9 h-10 text-xs rounded-xl border-slate-200 bg-slate-50/60 focus:bg-white"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Controls / Toggle on mobile */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFiltersOpen((v) => !v)}
              className="lg:hidden h-10 gap-1.5 rounded-xl border-slate-200 text-xs font-semibold text-slate-700"
            >
              <SlidersHorizontal className="size-3.5" />
              <span>Filters {hasActiveFilters && '•'}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRefresh((v) => v + 1)}
              disabled={loading}
              className="h-10 px-3 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#173D30]"
              title="Refresh Records"
            >
              <RotateCcw className={cn('size-3.5 text-slate-500', loading && 'animate-spin')} />
              <span className="hidden sm:inline ml-1.5">Refresh</span>
            </Button>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-10 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
              >
                <X className="size-3.5 mr-1" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filter Selectors Bar */}
        <div
          className={cn(
            'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100',
            !filtersOpen && 'hidden lg:grid'
          )}
        >
          {/* 1. Follow-up Status Selector */}
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-slate-600">Status</Label>
            <select
              aria-label="Filter by Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="ALL">All Follow-ups</option>
              <option value="TODAY">Today ({kpiStats.pending > 0 ? 'Active' : '0'})</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="PENDING">Pending (Today + Upcoming)</option>
              <option value="OVERDUE">Overdue ({kpiStats.overdue})</option>
              <option value="COMPLETED">Completed ({kpiStats.completed})</option>
              <option value="UNSCHEDULED">Unscheduled</option>
            </select>
          </div>

          {/* 2. Lead Selector */}
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-slate-600">Lead</Label>
            <select
              aria-label="Filter by Lead"
              value={selectedLeadId}
              onChange={(e) => {
                setSelectedLeadId(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="">All Leads</option>
              {rawLeads.map((lead) => {
                const rec = leadRecord(lead);
                return (
                  <option key={lead.id} value={lead.id}>
                    {leadLabel(lead)} {rec.companyName ? `(${rec.companyName})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 3. Employee Selector */}
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-slate-600">Assigned Employee</Label>
            <select
              aria-label="Filter by Assigned Employee"
              value={selectedEmployeeId}
              onChange={(e) => {
                setSelectedEmployeeId(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="">All Employees</option>
              {employees
                .filter((emp) => emp.id || emp.userId)
                .map((emp) => (
                  <option key={emp.id || emp.userId} value={emp.userId || emp.id}>
                    {personName(emp)} {emp.department?.name ? `(${emp.department.name})` : ''}
                  </option>
                ))}
            </select>
          </div>

          {/* 4. Follow-up Date Picker */}
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-slate-600">Follow-up Date</Label>
            <Input
              type="date"
              aria-label="Filter by Date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 text-xs rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* 4. Follow-ups Table Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden flex flex-col">
        {loading ? (
          /* Loading Skeleton Table */
          <div className="w-full overflow-x-auto min-w-0">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F3F8F5] text-[11px] font-semibold text-slate-700">
                  <th className="py-3 px-3.5 w-10 text-center">#</th>
                  <th className="py-3 px-3.5 min-w-[180px]">Lead Name</th>
                  <th className="py-3 px-3 min-w-[140px]">Company Name</th>
                  <th className="py-3 px-3 min-w-[120px]">Mobile Number</th>
                  <th className="py-3 px-3 min-w-[150px]">Email</th>
                  <th className="py-3 px-3 min-w-[120px]">Follow-up Date</th>
                  <th className="py-3 px-3 min-w-[100px]">Follow-up Time</th>
                  <th className="py-3 px-3 min-w-[110px]">Follow-up Type</th>
                  <th className="py-3 px-3 min-w-[180px]">Follow-up Notes</th>
                  <th className="py-3 px-3 text-right min-w-[110px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-3.5 text-center">
                      <div className="size-4 bg-slate-200 rounded mx-auto" />
                    </td>
                    <td className="py-3.5 px-3.5">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-slate-200" />
                        <div className="space-y-1">
                          <div className="h-3.5 w-24 bg-slate-200 rounded" />
                          <div className="h-2.5 w-16 bg-slate-200 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-3.5 w-20 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-3.5 w-24 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-3.5 w-28 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-4 w-20 bg-slate-200 rounded-full" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-3.5 w-16 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-4 w-16 bg-slate-200 rounded-full" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-3.5 w-32 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="h-6 w-16 bg-slate-200 rounded ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-12 text-center text-xs text-rose-700 bg-rose-50/40 space-y-3">
            <AlertTriangle className="size-8 text-rose-500 mx-auto" />
            <div>
              <p className="font-bold text-sm text-rose-800">Failed to load follow-up records</p>
              <p className="text-xs text-rose-600 mt-1 max-w-md mx-auto">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefresh((v) => v + 1)}
              className="mt-2 text-xs border-rose-200 text-rose-700 hover:bg-rose-100"
            >
              <RotateCcw className="size-3.5 mr-1.5" />
              <span>Retry Request</span>
            </Button>
          </div>
        ) : paginatedRows.length === 0 ? (
          /* Empty State */
          <div className="p-14 text-center text-xs text-slate-500 space-y-4">
            <div className="size-14 rounded-2xl bg-emerald-50 text-[#173D30] border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
              <CalendarClock className="size-7 text-[#20C466]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-900">No follow-ups found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {hasActiveFilters
                  ? 'There are no follow-ups matching your current filters. Try resetting the search or filter options.'
                  : 'There are no follow-ups scheduled yet. Log your first follow-up call to start tracking.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-8.5 rounded-xl border-slate-200 text-xs font-semibold"
                >
                  Clear Filters
                </Button>
              )}
              {allowed && (
                <Button
                  size="sm"
                  onClick={() => handleOpenLogDrawer(null)}
                  className="h-8.5 rounded-xl bg-[#173D30] hover:bg-[#123026] text-white text-xs font-semibold gap-1.5"
                >
                  <Phone className="size-3.5 text-[#20C466]" />
                  <span>Log Follow-up</span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="w-full overflow-x-auto min-w-0">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F3F8F5] text-[11px] font-semibold text-slate-700 select-none">
                  {/* 1. Checkbox */}
                  <th className="py-3 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      aria-label="Select all follow-ups on page"
                      checked={isAllCurrentSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="size-3.5 rounded border-slate-300 text-[#173D30] focus:ring-1 focus:ring-[#173D30]"
                    />
                  </th>

                  {/* 2. Lead Name */}
                  <th
                    className="py-3 px-3.5 cursor-pointer hover:text-[#173D30] transition-colors min-w-[180px]"
                    onClick={() => handleSort('name')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Lead Name</span>
                      {sortKey === 'name' ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="size-3 text-[#173D30]" />
                        ) : (
                          <ArrowDown className="size-3 text-[#173D30]" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3 text-slate-400" />
                      )}
                    </span>
                  </th>

                  {/* 3. Company Name */}
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-[#173D30] transition-colors min-w-[140px]"
                    onClick={() => handleSort('company')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Company Name</span>
                      {sortKey === 'company' ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="size-3 text-[#173D30]" />
                        ) : (
                          <ArrowDown className="size-3 text-[#173D30]" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3 text-slate-400" />
                      )}
                    </span>
                  </th>

                  {/* 4. Mobile Number */}
                  <th className="py-3 px-3 min-w-[120px]">Mobile Number</th>

                  {/* 5. Email */}
                  <th className="py-3 px-3 min-w-[150px]">Email</th>

                  {/* 6. Follow-up Date */}
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-[#173D30] transition-colors min-w-[130px]"
                    onClick={() => handleSort('nextFollowUpDate')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Follow-up Date</span>
                      {sortKey === 'nextFollowUpDate' ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="size-3 text-[#173D30]" />
                        ) : (
                          <ArrowDown className="size-3 text-[#173D30]" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3 text-slate-400" />
                      )}
                    </span>
                  </th>

                  {/* 7. Follow-up Time */}
                  <th className="py-3 px-3 min-w-[100px]">Follow-up Time</th>

                  {/* 8. Follow-up Type */}
                  <th className="py-3 px-3 min-w-[110px]">Follow-up Type</th>

                  {/* 9. Follow-up Notes */}
                  <th className="py-3 px-3 min-w-[180px]">Follow-up Notes</th>

                  {/* 10. Actions */}
                  <th className="py-3 px-3 text-right min-w-[120px]">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedRows.map((row) => {
                  const rec = leadRecord(row);
                  const isSelected = selectedIds.includes(row.id);
                  const initial = (leadLabel(row) || 'L')[0]?.toUpperCase();
                  const notesText =
                    row.latestFollowUp?.notes || row.workNotes || row.latestFollowUp?.outcome || '—';
                  const followUpType = row.latestFollowUp?.type || 'CALL';
                  const dateScheduled = row.nextFollowUpDate
                    ? formatDisplayDate(row.nextFollowUpDate)
                    : row.latestFollowUp?.createdAt
                    ? formatDisplayDate(row.latestFollowUp.createdAt)
                    : 'Not Scheduled';
                  const timeScheduled = formatDisplayTime(
                    row.nextFollowUpTime || row.latestFollowUp?.followUpTime,
                    row.nextFollowUpDate
                  );
                  const isScheduled = Boolean(row.nextFollowUpDate);

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'transition-colors hover:bg-[#F8FBF9] group',
                        isSelected && 'bg-emerald-50/40'
                      )}
                    >
                      {/* 1. Checkbox */}
                      <td className="py-3.5 px-3.5 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Select lead ${leadLabel(row)}`}
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, row.id]);
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== row.id));
                            }
                          }}
                          className="size-3.5 rounded border-slate-300 text-[#173D30] focus:ring-1 focus:ring-[#173D30]"
                        />
                      </td>

                      {/* 2. Lead Name */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-7 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-[#173D30] border border-emerald-200 shrink-0">
                            {initial}
                          </span>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setDetailLead(row)}
                              className="font-bold text-slate-900 text-xs truncate hover:text-[#173D30] hover:underline text-left block max-w-[170px]"
                              title="View Lead Details"
                            >
                              {leadLabel(row)}
                            </button>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              ID #{rec.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Company Name */}
                      <td className="py-3.5 px-3">
                        {rec.companyName ? (
                          <div className="flex items-center gap-1.5 text-slate-700 max-w-[160px] truncate" title={rec.companyName}>
                            <Building2 className="size-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{rec.companyName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* 4. Mobile Number */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {rec.phone || rec.mobileNumber ? (
                          <a
                            href={`tel:${rec.phone || rec.mobileNumber}`}
                            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-[#173D30] hover:underline font-mono text-xs"
                          >
                            <Phone className="size-3 text-slate-400" />
                            <span>{rec.phone || rec.mobileNumber}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* 5. Email */}
                      <td className="py-3.5 px-3">
                        {rec.email ? (
                          <a
                            href={`mailto:${rec.email}`}
                            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-[#173D30] hover:underline text-xs max-w-[150px] truncate"
                            title={rec.email}
                          >
                            <Mail className="size-3 text-slate-400 shrink-0" />
                            <span className="truncate">{rec.email}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* 6. Follow-up Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-slate-800 block">
                            {dateScheduled}
                          </span>
                          <FollowUpStatusPill row={row} />
                        </div>
                      </td>

                      {/* 7. Follow-up Time */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600 text-xs font-mono">
                          <Clock className="size-3 text-slate-400 shrink-0" />
                          <span>{timeScheduled}</span>
                        </div>
                      </td>

                      {/* 8. Follow-up Type */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <FollowUpTypeBadge type={followUpType} />
                      </td>

                      {/* 9. Follow-up Notes */}
                      <td className="py-3.5 px-3">
                        <p
                          className="text-xs text-slate-600 max-w-[200px] truncate cursor-pointer hover:text-slate-900"
                          title={notesText !== '—' ? notesText : 'No notes recorded'}
                          onClick={() => setDetailLead(row)}
                        >
                          {notesText}
                        </p>
                      </td>

                      {/* 10. Actions */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => setDetailLead(row)}
                            title="View Follow-up History & Lead Details"
                            className="size-7 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#173D30] flex items-center justify-center transition-colors"
                          >
                            <Eye className="size-3.5" />
                          </button>

                          {/* Quick Mark Completed (if scheduled) */}
                          {allowed && isScheduled && (
                            <button
                              type="button"
                              onClick={() => handleMarkCompleted(row)}
                              title="Mark Follow-up as Completed"
                              className="size-7 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-center transition-colors"
                            >
                              <Check className="size-3.5" />
                            </button>
                          )}

                          {/* Reschedule */}
                          {allowed && (
                            <button
                              type="button"
                              onClick={() => handleOpenReschedule(row)}
                              title="Reschedule Follow-up"
                              className="size-7 rounded-lg text-amber-600 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-center transition-colors"
                            >
                              <CalendarClock className="size-3.5" />
                            </button>
                          )}

                          {/* Log Follow-up / New Note */}
                          {allowed && (
                            <button
                              type="button"
                              onClick={() => handleOpenLogDrawer(row)}
                              title="Log Call Outcome"
                              className="size-7 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-center transition-colors"
                            >
                              <PhoneCall className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Pagination Footer (Inside Card) */}
        {!loading && !error && sortedRows.length > 0 && (
          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                Showing{' '}
                <span className="font-semibold text-slate-800">
                  {(currentPage - 1) * rowsPerPage + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-800">
                  {Math.min(currentPage * rowsPerPage, sortedRows.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-800">
                  {sortedRows.length}
                </span>{' '}
                follow-ups
              </div>

              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                <span>Rows per page:</span>
                <select
                  aria-label="Rows per page"
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="h-8 gap-1 rounded-lg text-xs border-slate-200 text-slate-700 hover:text-[#173D30]"
              >
                <ChevronLeft className="size-3.5" />
                <span>Previous</span>
              </Button>

              <span className="px-2 font-medium text-slate-700">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="h-8 gap-1 rounded-lg text-xs border-slate-200 text-slate-700 hover:text-[#173D30]"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Log Follow-up Form Drawer */}
      <FormDrawer
        open={logDrawerOpen}
        onOpenChange={setLogDrawerOpen}
        title="Log Follow-up"
        description="Record follow-up outcome and schedule next call if needed. Completed calls remain in history."
        onSubmit={handleSaveLog}
        loading={savingLog}
      >
        <div className="space-y-4 text-xs">
          {/* Lead Selector */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Select Lead *</Label>
            <select
              aria-label="Select Lead"
              required
              value={logForm.leadId}
              onChange={(e) => setLogForm({ ...logForm, leadId: e.target.value })}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="">Choose a lead...</option>
              {rawLeads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {leadLabel(lead)} {lead.companyName ? `(${lead.companyName})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Follow-up Type */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Follow-up Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'CALL', label: 'Call', icon: Phone },
                { type: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare },
                { type: 'EMAIL', label: 'Email', icon: Mail },
                { type: 'MEETING', label: 'Meeting', icon: Users },
                { type: 'VISIT', label: 'Visit', icon: MapPin },
                { type: 'OTHER', label: 'Other', icon: Clock },
              ].map((item) => {
                const IconComponent = item.icon;
                const active = logForm.type === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setLogForm({ ...logForm, type: item.type })}
                    className={cn(
                      'flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all',
                      active
                        ? 'bg-emerald-50 text-[#173D30] border-emerald-300 ring-1 ring-[#20C466]/40 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <IconComponent className="size-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Call Outcome */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Call Outcome *</Label>
            <Input
              required
              value={logForm.outcome}
              onChange={(e) => setLogForm({ ...logForm, outcome: e.target.value })}
              placeholder="e.g. Connected - Discussed pricing, callback requested"
              className="h-9 text-xs"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                'Connected - Interested',
                'Call Back Later',
                'No Answer / Busy',
                'Not Interested',
                'Demo Scheduled',
                'Follow-up Completed',
              ].map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setLogForm({ ...logForm, outcome: pill })}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium transition-colors"
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>

          {/* Next Follow-up Date & Time (Optional) */}
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
            <span className="text-[11px] font-bold text-slate-700 block">
              Schedule Next Follow-up (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600">Next Date</Label>
                <Input
                  type="date"
                  value={logForm.nextFollowUpDate}
                  onChange={(e) => setLogForm({ ...logForm, nextFollowUpDate: e.target.value })}
                  className="h-8.5 text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-600">Next Time</Label>
                <Input
                  value={logForm.nextFollowUpTime}
                  onChange={(e) => setLogForm({ ...logForm, nextFollowUpTime: e.target.value })}
                  placeholder="e.g. 11:30 AM"
                  className="h-8.5 text-xs bg-white"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              Leave blank if this completes the interaction cycle with no further call required.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Detailed Notes</Label>
            <textarea
              rows={3}
              value={logForm.notes}
              onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
              placeholder="Add conversation notes, client feedback, next steps..."
              className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            />
          </div>
        </div>
      </FormDrawer>

      {/* 7. Reschedule Follow-up Drawer */}
      <FormDrawer
        open={Boolean(rescheduleLead)}
        onOpenChange={(open) => {
          if (!open) setRescheduleLead(null);
        }}
        title={`Reschedule Follow-up: ${rescheduleLead ? leadLabel(rescheduleLead) : ''}`}
        description="Pick a new scheduled date and time. This updates the next follow-up slot without creating duplicates."
        onSubmit={handleSaveReschedule}
        loading={savingReschedule}
      >
        {rescheduleLead && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Lead:</span>
                <span className="font-bold text-slate-900">{leadLabel(rescheduleLead)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Company:</span>
                <span className="text-slate-800">{leadRecord(rescheduleLead).companyName || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Current Slot:</span>
                <span className="font-mono text-slate-700">
                  {rescheduleLead.nextFollowUpDate ? dayOf(rescheduleLead.nextFollowUpDate) : 'None'}{' '}
                  {rescheduleLead.nextFollowUpTime || ''}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">New Follow-up Date *</Label>
              <Input
                type="date"
                required
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">New Follow-up Time</Label>
              <Input
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                placeholder="e.g. 02:30 PM"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Rescheduling Reason / Notes</Label>
              <textarea
                rows={3}
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                placeholder="e.g. Client requested callback on Monday afternoon after review."
                className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
              />
            </div>
          </div>
        )}
      </FormDrawer>

      {/* 8. Comprehensive Detail Drawer with Completed Follow-up History */}
      <FormDrawer
        open={Boolean(detailLead)}
        onOpenChange={(open) => {
          if (!open) setDetailLead(null);
        }}
        title={detailLead ? `Follow-up Dossier: ${leadLabel(detailLead)}` : 'Follow-up Details'}
        description="Lead information, scheduled slot and complete follow-up call history."
        showFooter={false}
      >
        {detailLead && (
          <div className="space-y-5 text-xs">
            {/* Header Identity Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{leadLabel(detailLead)}</h4>
                  <p className="text-xs text-slate-500">
                    {leadRecord(detailLead).companyName || 'Individual Prospect'}
                  </p>
                </div>
                <FollowUpStatusPill row={detailLead} />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Mobile Number</span>
                  {leadRecord(detailLead).phone || leadRecord(detailLead).mobileNumber ? (
                    <a
                      href={`tel:${leadRecord(detailLead).phone || leadRecord(detailLead).mobileNumber}`}
                      className="text-slate-800 font-mono font-semibold hover:underline"
                    >
                      {leadRecord(detailLead).phone || leadRecord(detailLead).mobileNumber}
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block">Email Address</span>
                  {leadRecord(detailLead).email ? (
                    <a
                      href={`mailto:${leadRecord(detailLead).email}`}
                      className="text-slate-800 font-medium hover:underline truncate block"
                    >
                      {leadRecord(detailLead).email}
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Representative</span>
                  <span className="text-slate-800 font-medium">
                    {personName(detailLead.assignedTo || detailLead.employee) || 'Unassigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Deal Status</span>
                  <span className="text-slate-800 font-medium">
                    {detailLead.deal?.title ? `${detailLead.deal.title} (${detailLead.deal.stage || '—'})` : 'No active deal'}
                  </span>
                </div>
              </div>
            </div>

            {/* Upcoming Follow-up Card */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#173D30] flex items-center gap-1.5">
                  <CalendarClock className="size-4 text-[#20C466]" />
                  <span>Next Scheduled Follow-up</span>
                </span>
                {allowed && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const l = detailLead;
                      setDetailLead(null);
                      handleOpenReschedule(l);
                    }}
                    className="h-7 text-[10px] px-2 border-emerald-300 text-[#173D30] hover:bg-emerald-100"
                  >
                    Reschedule
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-800">
                {detailLead.nextFollowUpDate ? (
                  <span className="font-semibold">
                    {formatDisplayDate(detailLead.nextFollowUpDate)} at{' '}
                    {formatDisplayTime(detailLead.nextFollowUpTime, detailLead.nextFollowUpDate)}
                  </span>
                ) : (
                  <span className="text-slate-500 italic">Not scheduled yet</span>
                )}
              </p>
            </div>

            {/* Completed Follow-up History Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Clock className="size-3.5 text-slate-500" />
                  <span>Completed Follow-up History</span>
                </h4>
                <span className="text-[10px] font-semibold text-slate-400">
                  {(detailLead.followUpHistory || (detailLead.latestFollowUp ? [detailLead.latestFollowUp] : [])).length} recorded
                </span>
              </div>

              {(() => {
                const history =
                  detailLead.followUpHistory && detailLead.followUpHistory.length > 0
                    ? detailLead.followUpHistory
                    : detailLead.latestFollowUp
                    ? [detailLead.latestFollowUp]
                    : [];

                if (history.length === 0) {
                  return (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No completed follow-up history for this lead.
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5">
                    {history.map((item, idx) => (
                      <div
                        key={item.id || item.createdAt || idx}
                        className="p-3 rounded-xl border border-slate-200/80 bg-white shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                            <span>{item.outcome || 'Call Completed'}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDisplayDate(item.createdAt || item.followUpDate)}
                          </span>
                        </div>

                        {item.notes && (
                          <p className="text-xs text-slate-600 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                            {item.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                          <span>Recorded outcome</span>
                          {item.followUpTime && <span>Time: {item.followUpTime}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              {allowed && (
                <Button
                  size="sm"
                  onClick={() => {
                    const l = detailLead;
                    setDetailLead(null);
                    handleOpenLogDrawer(l);
                  }}
                  className="w-full h-8.5 rounded-xl bg-[#173D30] hover:bg-[#123026] text-white text-xs font-semibold gap-1.5"
                >
                  <Phone className="size-3.5 text-[#20C466]" />
                  <span>Log New Outcome</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </FormDrawer>
    </div>
  );
}
