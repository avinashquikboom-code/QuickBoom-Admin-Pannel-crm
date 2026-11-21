'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  FileText,
  Download,
  Upload,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Building,
  Phone,
  Mail,
  Globe,
  Calendar,
  User,
  MoreVertical,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Eye,
  Edit,
  Share2,
  Layers,
  Briefcase,
  Tag,
  Clock,
  Send,
  UserCheck,
} from 'lucide-react';
import {
  stageLabel,
  PRIORITIES,
  SOURCE_OPTIONS,
  blank,
  unwrap,
  persistLead,
  LeadForm,
  Field,
  socialFormValues,
  SocialLinks,
  LeadAvatar,
  LeadPhotos,
} from '@/modules/crm/ManualLeadDrawer';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Button } from '@/components/common/Button';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  AdminBulkActions,
  AdminBulkSelectionToolbar,
  AdminSelectCheckbox,
} from '@/components/admin/bulk-selection';
import { toast } from '@/hooks/use-toast';
import {
  addLeadNote,
  archiveLeads,
  bulkAssignLeads,
  bulkLeadPriority,
  bulkLeadStatus,
  checkLeadDuplicate,
  convertLead,
  crmError,
  listLeadPage,
  loadEmployees,
  loadLeadNotes,
  loadLeadStages,
  loadLeads,
  personName,
  removeLead,
  saveLead,
  sessionCan,
} from '@/modules/crm/crm-api';
import { loadDepartments } from '@/modules/master/master-api';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faBuilding,
  faEnvelope,
  faGlobe,
  faLink,
  faLocationDot,
  faPhone,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import {
  faFacebook,
  faInstagram,
  faLinkedin,
  faPinterest,
  faTiktok,
  faWhatsapp,
  faXTwitter,
  faYoutube,
} from '@fortawesome/free-brands-svg-icons';
import { cn } from '@/lib/utils';

function filtersFrom(query) {
  return {
    leadId:
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('leadId') || undefined
        : undefined,
    captureJobId:
      query.captureJobId ||
      (typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('captureJobId') || undefined
        : undefined),
    search: query.search || undefined,
    status: query.status || undefined,
    priority: query.priority || undefined,
    source: query.source || undefined,
    assignedToId: query.assignedToId || undefined,
    from: query.from ? new Date(query.from).toISOString() : undefined,
    to: query.to ? new Date(`${query.to}T23:59:59`).toISOString() : undefined,
  };
}

async function matchingIds(query) {
  const ids = [];
  for (let page = 1; page <= 20; page += 1) {
    const result = await listLeadPage({ ...filtersFrom(query), page, limit: 100 });
    ids.push(...result.rows.map((row) => row.id).filter(Boolean));
    if (page >= Number(result.pagination?.totalPages || 1)) break;
  }
  return [...new Set(ids)];
}

function downloadCsv(rows) {
  const headers = [
    'Name',
    'Company',
    'Phone',
    'Email',
    'Source',
    'Priority',
    'Assigned',
    'Status',
    'Created',
  ];
  const lines = rows.map((row) =>
    [
      personName(row),
      row.companyName,
      row.phone,
      row.email,
      row.source,
      row.priority,
      personName(row.assignedTo || row.employee),
      row.status,
      String(row.createdAt || '').slice(0, 10),
    ]
      .map((value) => `"${String(value || '').replace(/"/g, '""')}"`)
      .join(',')
  );
  const blob = new Blob([[headers.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function PriorityBadge({ priority }) {
  const p = String(priority || '').toUpperCase();
  const styles = {
    URGENT: 'bg-rose-50 text-rose-700 border-rose-200',
    HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
    MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
    LOW: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  const dots = {
    URGENT: 'bg-rose-500',
    HIGH: 'bg-amber-500',
    MEDIUM: 'bg-blue-500',
    LOW: 'bg-slate-400',
  };
  const currentStyle = styles[p] || styles.LOW;
  const currentDot = dots[p] || dots.LOW;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border shadow-2xs shrink-0',
        currentStyle
      )}
    >
      <span className={cn('size-1.5 rounded-full', currentDot)} />
      {p || '—'}
    </span>
  );
}

function StageBadge({ stage, status, stages = [] }) {
  const match = stages.find(
    (s) =>
      String(s.id) === String(stage?.id) ||
      s.key === status ||
      s.name === stage?.name ||
      String(s.key || '').toUpperCase() === String(status || '').toUpperCase()
  );
  const name = stage?.name || match?.name || stageLabel(status, stages);
  const color = stage?.color || match?.color || '#16A34A';
  const bgColor = stage?.bgColor || match?.bgColor || `${color}18`;
  const borderColor = stage?.borderColor || match?.borderColor || `${color}40`;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border shadow-2xs whitespace-nowrap"
      style={{
        color: color,
        backgroundColor: bgColor,
        borderColor: borderColor,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}

export default function LeadsRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [canDelete, setCanDelete] = React.useState(false);
  const [sources, setSources] = React.useState([]);
  const [employees, setEmployees] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [stages, setStages] = React.useState([]);
  const [importOpen, setImportOpen] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  // Table Data & State
  const [rows, setRows] = React.useState([]);
  const [payload, setPayload] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  // Filters State
  const [query, setQuery] = React.useState({
    search: '',
    status: '',
    priority: '',
    source: '',
    assignedToId: '',
    from: '',
    to: '',
    page: 1,
    limit: 20,
  });

  // Sorting
  const [sortKey, setSortKey] = React.useState('createdAt');
  const [sortDir, setSortDir] = React.useState('desc');

  // Selection
  const [selectedIds, setSelectedIds] = React.useState([]);

  // Detail Dossier Drawer
  const [selectedLead, setSelectedLead] = React.useState(null);

  // Form Drawer (Create & Edit)
  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState({ ...blank });
  const [editingId, setEditingId] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  // Row Action Confirmation Dialog
  const [confirmState, setConfirmState] = React.useState(null);

  // Load Permissions & Meta options on mount
  React.useEffect(() => {
    setAllowed(sessionCan('LEADS') || sessionCan('CRM'));
    setCanDelete(sessionCan('LEADS') || sessionCan('CRM'));
    loadEmployees({ salesOnly: true }).then(setEmployees).catch(() => setEmployees([]));
    loadDepartments().then(setDepartments).catch(() => setDepartments([]));
    loadLeadStages().then(setStages).catch(() => setStages([]));

    // Check URL parameters for direct filters
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlStatus = searchParams.get('status');
      const urlSearch = searchParams.get('search');
      if (urlStatus || urlSearch) {
        setQuery((prev) => ({
          ...prev,
          status: urlStatus || prev.status,
          search: urlSearch || prev.search,
        }));
      }
    }
  }, []);

  // Fetch Leads
  const fetchLeads = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadLeads({
        page: query.page,
        limit: query.limit || 20,
        ...filtersFrom(query),
      });
      setRows(result.rows || []);
      setPayload(result);
      setSources(result.sources || []);
      setError('');
    } catch (err) {
      setError(crmError(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  React.useEffect(() => {
    fetchLeads();
  }, [fetchLeads, reloadKey]);

  // Combined source options
  const sourceOptions = React.useMemo(() => {
    const names = (sources || []).map((source) => source.name || source.code).filter(Boolean);
    return [...new Set([...SOURCE_OPTIONS, ...names])];
  }, [sources]);

  // Active stages
  const activeStages = React.useMemo(() => {
    return stages.filter((stage) => stage.isActive !== false);
  }, [stages]);

  // Sorted Rows
  const sortedRows = React.useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      if (sortKey === 'name' || sortKey === 'leadName') {
        valA = personName(a);
        valB = personName(b);
      } else if (sortKey === 'assigned') {
        valA = personName(a.assignedTo || a.employee);
        valB = personName(b.assignedTo || b.employee);
      }
      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Selection helpers
  const isAllSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rows.map((r) => r.id));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Reset all filters
  const handleResetFilters = () => {
    setQuery({
      search: '',
      status: '',
      priority: '',
      source: '',
      assignedToId: '',
      from: '',
      to: '',
      page: 1,
      limit: 20,
    });
    setSelectedIds([]);
  };

  // Active filter count
  const activeFilterCount = [
    query.search,
    query.status,
    query.priority,
    query.source,
    query.assignedToId,
    query.from,
    query.to,
  ].filter(Boolean).length;

  // Handle Save Lead
  const handleSaveLead = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await persistLead(form, editingId);
      toast.success(editingId ? 'Lead updated successfully' : 'Lead created successfully');
      setFormOpen(false);
      setEditingId(null);
      setReloadKey((prev) => prev + 1);
    } catch (err) {
      toast.error(crmError(err));
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Form
  const handleEditLead = (row) => {
    setEditingId(row.id);
    setForm({
      ...blank,
      ...row,
      leadName: personName(row) === '—' ? '' : personName(row),
      assignedToId: row.employeeId || row.assignedToId || '',
      imageUrl: row.imageUrl || '',
      ...socialFormValues(row),
    });
    setFormOpen(true);
  };

  // Metrics from API
  const totalLeadsCount = payload.metrics?.total ?? payload.pagination?.total ?? rows.length;

  return (
    <div className="space-y-5 pb-16 w-full min-w-0">
      {/* 1. Header with Breadcrumbs, Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>CRM</span>
            <span>/</span>
            <span className="font-semibold text-[#173D30]">Leads</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#173D30] tracking-tight">
              Leads
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[#173D30] border border-emerald-200">
              <span className="size-1.5 rounded-full bg-[#20C466]" />
              {totalLeadsCount} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Create leads manually and manage existing CRM leads individually or in bulk.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/admin/crm/proposals"
            className="inline-flex items-center gap-1.5 h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#173D30] transition-colors shadow-2xs"
          >
            <FileText className="size-3.5 text-slate-500" />
            <span>Proposal History</span>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            className="h-9 gap-1.5 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#173D30] shadow-2xs"
          >
            <Upload className="size-3.5 text-slate-500" />
            <span>Import CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCsv(rows)}
            disabled={rows.length === 0}
            className="h-9 gap-1.5 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#173D30] shadow-2xs"
          >
            <Download className="size-3.5 text-slate-500" />
            <span>Export</span>
          </Button>

          {allowed && (
            <Button
              size="sm"
              onClick={() => {
                setEditingId(null);
                setForm({ ...blank });
                setFormOpen(true);
              }}
              className="h-9 gap-1.5 rounded-xl bg-[#173D30] hover:bg-[#123026] text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="size-4 text-[#20C466]" />
              <span>Add Lead</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Interactive Stage KPI Statistics Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Layers className="size-3.5 text-[#20C466]" />
            Pipeline Stages Overview
          </span>
          {query.status && (
            <button
              type="button"
              onClick={() => setQuery((p) => ({ ...p, status: '', page: 1 }))}
              className="text-[11px] font-semibold text-[#173D30] hover:underline flex items-center gap-1"
            >
              <RotateCcw className="size-3" />
              Show all stages
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2.5">
          {/* Total Leads Card */}
          <button
            type="button"
            onClick={() => setQuery((p) => ({ ...p, status: '', page: 1 }))}
            className={cn(
              'flex flex-col text-left p-3 rounded-xl border transition-all shadow-2xs',
              !query.status
                ? 'bg-emerald-50/70 border-[#20C466] ring-2 ring-[#20C466]/30 shadow-xs'
                : 'bg-white border-slate-200/90 hover:border-emerald-300'
            )}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-semibold text-slate-600 truncate">Total Leads</span>
              <span className="size-2 rounded-full bg-[#20C466]" />
            </div>
            <span className="text-xl font-bold text-[#173D30] tracking-tight">
              {totalLeadsCount}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Across all stages</span>
          </button>

          {/* Dynamic Stage Cards */}
          {activeStages.map((stage) => {
            const isSelected =
              query.status === stage.key ||
              query.status === stage.name ||
              (stage.key && query.status.toUpperCase() === stage.key.toUpperCase());
            const stageCount = stage.leadsCount ?? 0;
            const stageColor = stage.color || '#20C466';

            return (
              <button
                key={stage.id || stage.key}
                type="button"
                onClick={() => {
                  setQuery((prev) => ({
                    ...prev,
                    status: isSelected ? '' : stage.key,
                    page: 1,
                  }));
                }}
                className={cn(
                  'flex flex-col text-left p-3 rounded-xl border transition-all shadow-2xs relative overflow-hidden',
                  isSelected
                    ? 'bg-emerald-50/70 border-[#20C466] ring-2 ring-[#20C466]/30 shadow-xs'
                    : 'bg-white border-slate-200/90 hover:border-emerald-300'
                )}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: stageColor }}
                />
                <div className="flex items-center justify-between gap-1 mb-1 mt-0.5">
                  <span
                    className="text-[11px] font-semibold text-slate-700 truncate"
                    title={stage.name}
                  >
                    {stage.name}
                  </span>
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: stageColor }}
                  />
                </div>
                <span className="text-xl font-bold text-slate-900 tracking-tight">
                  {stageCount}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {isSelected ? 'Filtered' : 'Click to filter'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Comprehensive Filter Bar & Active Filter Chips */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            <Input
              value={query.search}
              onChange={(e) => setQuery({ ...query, search: e.target.value, page: 1 })}
              placeholder="Search leads by name, company, email, phone..."
              className="pl-9 pr-8 h-9 text-xs rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
            />
            {query.search && (
              <button
                type="button"
                onClick={() => setQuery({ ...query, search: '', page: 1 })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Stage Filter */}
          <div>
            <select
              aria-label="Filter by stage"
              value={query.status}
              onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="">All stages</option>
              {activeStages.map((stage) => (
                <option key={stage.id || stage.key} value={stage.key}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              aria-label="Filter by priority"
              value={query.priority}
              onChange={(e) => setQuery({ ...query, priority: e.target.value, page: 1 })}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="">All priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <select
              aria-label="Filter by source"
              value={query.source}
              onChange={(e) => setQuery({ ...query, source: e.target.value, page: 1 })}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="">All sources</option>
              {sourceOptions.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Filter */}
          <div>
            <select
              aria-label="Filter by Sales employee"
              value={query.assignedToId}
              onChange={(e) => setQuery({ ...query, assignedToId: e.target.value, page: 1 })}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="">All Sales employees</option>
              {employees.map((emp) => (
                <option key={emp.recordId} value={String(emp.recordId)}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary filters row: Dates & Quick Action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">Date Range:</span>
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                aria-label="From Date"
                value={query.from}
                onChange={(e) => setQuery({ ...query, from: e.target.value, page: 1 })}
                className="h-8 text-xs rounded-lg border-slate-200 w-32"
              />
              <span className="text-slate-400">to</span>
              <Input
                type="date"
                aria-label="To Date"
                value={query.to}
                onChange={(e) => setQuery({ ...query, to: e.target.value, page: 1 })}
                className="h-8 text-xs rounded-lg border-slate-200 w-32"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReloadKey((v) => v + 1)}
              className="h-8 gap-1 rounded-lg text-xs border-slate-200 text-slate-600 hover:text-[#173D30]"
            >
              <RotateCcw className="size-3" />
              <span>Refresh</span>
            </Button>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 text-xs text-rose-600 hover:bg-rose-50"
              >
                Clear all filters
              </Button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400">Active filters:</span>
            {query.search && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                Search: &ldquo;{query.search}&rdquo;
                <button
                  onClick={() => setQuery({ ...query, search: '', page: 1 })}
                  className="hover:text-rose-600"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            {query.status && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                Stage: {stageLabel(query.status, stages)}
                <button
                  onClick={() => setQuery({ ...query, status: '', page: 1 })}
                  className="hover:text-rose-600"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            {query.priority && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md text-[11px]">
                Priority: {query.priority}
                <button
                  onClick={() => setQuery({ ...query, priority: '', page: 1 })}
                  className="hover:text-rose-600"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            {query.source && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                Source: {query.source}
                <button
                  onClick={() => setQuery({ ...query, source: '', page: 1 })}
                  className="hover:text-rose-600"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            {query.assignedToId && (
              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md text-[11px]">
                Assigned:{' '}
                {employees.find((e) => String(e.recordId) === query.assignedToId)?.name ||
                  query.assignedToId}
                <button
                  onClick={() => setQuery({ ...query, assignedToId: '', page: 1 })}
                  className="hover:text-rose-600"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            {(query.from || query.to) && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                Date: {query.from || 'Start'} to {query.to || 'Now'}
                <button
                  onClick={() => setQuery({ ...query, from: '', to: '', page: 1 })}
                  className="hover:text-rose-600"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4. Bulk Actions Toolbar (Visible when rows selected) */}
      {selectedIds.length > 0 && (
        <BulkActionBar
          query={query}
          selectedIds={selectedIds}
          selectedRows={rows.filter((r) => selectedIds.includes(r.id))}
          total={payload.pagination?.total || rows.length}
          reload={() => setReloadKey((v) => v + 1)}
          employees={employees}
          departments={departments}
          stages={activeStages}
          canDelete={canDelete}
          onClear={() => setSelectedIds([])}
        />
      )}

      {/* 5. Main Leads Table & Responsive Layout */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <span className="inline-block size-6 animate-spin rounded-full border-2 border-[#173D30] border-t-transparent" />
            <p>Loading CRM leads...</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center text-xs text-rose-700 bg-rose-50/50 space-y-2">
            <AlertTriangle className="size-6 text-rose-500 mx-auto" />
            <p className="font-semibold">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReloadKey((v) => v + 1)}
              className="mt-2 text-xs"
            >
              Retry
            </Button>
          </div>
        ) : sortedRows.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Briefcase className="size-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No leads found</p>
            <p className="text-[11px] text-slate-400">
              {activeFilterCount > 0
                ? 'Try clearing some filters to see matching records.'
                : 'Get started by creating your first CRM lead.'}
            </p>
            {activeFilterCount > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="mt-2 text-xs"
              >
                Clear all filters
              </Button>
            ) : allowed ? (
              <Button
                size="sm"
                onClick={() => {
                  setEditingId(null);
                  setForm({ ...blank });
                  setFormOpen(true);
                }}
                className="mt-2 bg-[#173D30] text-white text-xs"
              >
                Add Lead
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="w-full overflow-x-auto min-w-0">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 select-none">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="size-4 rounded border-slate-300 text-[#173D30] focus:ring-[#20C466]"
                      aria-label="Select all on this page"
                    />
                  </th>
                  <th
                    className="py-3 px-3.5 cursor-pointer hover:text-slate-900 transition-colors min-w-[200px]"
                    onClick={() => handleSort('name')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Lead & Business</span>
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
                  <th className="py-3 px-3 min-w-[130px]">Social Media</th>
                  <th className="py-3 px-3 min-w-[170px]">Contact Info</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[140px]"
                    onClick={() => handleSort('assigned')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Assigned</span>
                      {sortKey === 'assigned' ? (
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
                  <th className="py-3 px-3 min-w-[110px]">Source</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[100px]"
                    onClick={() => handleSort('priority')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Priority</span>
                      {sortKey === 'priority' ? (
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
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[105px]"
                    onClick={() => handleSort('createdAt')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Created</span>
                      {sortKey === 'createdAt' ? (
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
                  <th className="py-3 px-3 min-w-[130px]">Stage</th>
                  <th className="py-3 px-3 text-right min-w-[90px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRows.map((row) => {
                  const isRowSelected = selectedIds.includes(row.id);

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'transition-colors hover:bg-slate-50/80 group',
                        isRowSelected && 'bg-emerald-50/30'
                      )}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => toggleSelectRow(row.id)}
                          className="size-4 rounded border-slate-300 text-[#173D30] focus:ring-[#20C466]"
                          aria-label={`Select ${personName(row)}`}
                        />
                      </td>

                      {/* Lead Avatar, Name & Company */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-3">
                          <LeadAvatar lead={row} />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setSelectedLead(row)}
                              className="font-bold text-slate-900 hover:text-[#173D30] hover:underline text-xs text-left truncate block max-w-[200px]"
                              title={personName(row)}
                            >
                              {personName(row)}
                            </button>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                              {row.companyName ? (
                                <span
                                  className="truncate font-medium text-slate-700 max-w-[130px]"
                                  title={row.companyName}
                                >
                                  {row.companyName}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">No company</span>
                              )}
                              {row.category ? (
                                <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] text-slate-600 truncate max-w-[90px]">
                                  {row.category}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Social Media Links */}
                      <td className="py-3 px-3">
                        <SocialLinks lead={row} />
                      </td>

                      {/* Contact Info (Phone & Email) */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          {row.phone ? (
                            <a
                              href={`tel:${row.phone}`}
                              className="flex items-center gap-1.5 font-medium text-slate-800 hover:text-[#20C466] transition-colors"
                              title={`Call ${row.phone}`}
                            >
                              <Phone className="size-3 text-slate-400 shrink-0" />
                              <span className="truncate">{row.phone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                          {row.email ? (
                            <a
                              href={`mailto:${row.email}`}
                              className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-[#20C466] transition-colors"
                              title={`Email ${row.email}`}
                            >
                              <Mail className="size-3 text-slate-400 shrink-0" />
                              <span className="truncate">{row.email}</span>
                            </a>
                          ) : null}
                        </div>
                      </td>

                      {/* Assigned Employee & Department */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="flex size-6 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-[#173D30] border border-emerald-200 shrink-0">
                            {(personName(row.assignedTo || row.employee) || 'U')[0]}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800 text-xs">
                              {personName(row.assignedTo || row.employee)}
                            </p>
                            {row.assignedTeam ? (
                              <p className="text-[10px] text-slate-400 truncate">
                                {row.assignedTeam}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 whitespace-nowrap">
                          {/google/i.test(row.source || '') ? 'Google Maps' : row.source || '—'}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3">
                        <PriorityBadge priority={row.priority} />
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {row.createdAt ? String(row.createdAt).slice(0, 10) : '—'}
                      </td>

                      {/* Stage Badge */}
                      <td className="py-3 px-3">
                        <StageBadge
                          stage={row.stage}
                          status={row.status}
                          stages={stages}
                        />
                      </td>

                      {/* Row Actions Menu */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedLead(row)}
                            title="View Lead Dossier"
                            className="size-7 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center transition-colors"
                          >
                            <Eye className="size-3.5" />
                          </button>

                          {allowed && (
                            <button
                              type="button"
                              onClick={() => handleEditLead(row)}
                              title="Edit Lead"
                              className="size-7 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center transition-colors"
                            >
                              <Edit className="size-3.5" />
                            </button>
                          )}

                          {allowed && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmState({
                                  type: 'convert',
                                  lead: row,
                                })
                              }
                              title="Convert to Deal / Customer"
                              className="size-7 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-[#173D30] flex items-center justify-center transition-colors"
                            >
                              <UserCheck className="size-3.5" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmState({
                                  type: 'delete',
                                  lead: row,
                                })
                              }
                              title="Delete Lead"
                              className="size-7 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="size-3.5" />
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
      </div>

      {/* 6. Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 px-1">
        <div>
          Showing{' '}
          <span className="font-semibold text-slate-800">
            {rows.length === 0 ? 0 : (query.page - 1) * (query.limit || 20) + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-slate-800">
            {Math.min(query.page * (query.limit || 20), payload.pagination?.total || rows.length)}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-slate-800">
            {payload.pagination?.total || rows.length}
          </span>{' '}
          leads
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={query.page <= 1}
            onClick={() => setQuery((p) => ({ ...p, page: p.page - 1 }))}
            className="h-8 gap-1 rounded-lg text-xs"
          >
            <ChevronLeft className="size-3.5" />
            <span>Previous</span>
          </Button>

          <span className="px-2 font-medium text-slate-700">
            Page {payload.pagination?.page || query.page} of{' '}
            {payload.pagination?.totalPages || 1}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={query.page >= (payload.pagination?.totalPages || 1)}
            onClick={() => setQuery((p) => ({ ...p, page: p.page + 1 }))}
            className="h-8 gap-1 rounded-lg text-xs"
          >
            <span>Next</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* 7. Drawers & Modals */}

      {/* Lead Create / Edit Drawer */}
      <FormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingId ? 'Edit Lead' : 'Add Lead'}
        description="Fill details to persist to CRM database."
        onSubmit={handleSaveLead}
        loading={saving}
      >
        <LeadForm
          form={form}
          setForm={setForm}
          sources={sourceOptions}
          employees={employees}
          departments={departments}
          stages={stages}
        />
      </FormDrawer>

      {/* Lead Detail Dossier Drawer */}
      <FormDrawer
        open={Boolean(selectedLead)}
        onOpenChange={(open) => {
          if (!open) setSelectedLead(null);
        }}
        title="Lead Dossier"
        description="Detailed record profile and pipeline status."
        showFooter={false}
      >
        {selectedLead && (
          <LeadDossierContent
            lead={selectedLead}
            stages={stages}
            onEdit={() => {
              const row = selectedLead;
              setSelectedLead(null);
              handleEditLead(row);
            }}
          />
        )}
      </FormDrawer>

      {/* CSV Import Drawer */}
      <CsvImportPanel
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => setReloadKey((v) => v + 1)}
      />

      {/* Single / Confirm Action Dialog */}
      <ConfirmDialog
        open={Boolean(confirmState)}
        onOpenChange={() => setConfirmState(null)}
        variant={confirmState?.type === 'convert' ? 'default' : 'destructive'}
        title={
          confirmState?.type === 'convert'
            ? 'Convert Lead to Deal & Customer'
            : 'Delete Lead'
        }
        description={
          confirmState?.type === 'convert'
            ? `Are you sure you want to request conversion for "${personName(
                confirmState?.lead
              )}"? This creates customer and deal entries.`
            : `Are you sure you want to archive "${personName(
                confirmState?.lead
              )}"? This action soft-deletes the lead record.`
        }
        confirmLabel={confirmState?.type === 'convert' ? 'Convert' : 'Delete'}
        onConfirm={async () => {
          if (!confirmState?.lead) return;
          const lead = confirmState.lead;
          setConfirmState(null);

          if (confirmState.type === 'convert') {
            try {
              await convertLead(lead.id, {
                companyName: lead.companyName,
                dealTitle: lead.title || lead.companyName,
              });
              toast.success('Lead conversion requested successfully');
              setReloadKey((v) => v + 1);
            } catch (err) {
              toast.error(crmError(err));
            }
          } else if (confirmState.type === 'delete') {
            try {
              await removeLead(lead.id);
              toast.success('Lead archived successfully');
              setReloadKey((v) => v + 1);
            } catch (err) {
              toast.error(crmError(err));
            }
          }
        }}
      />
    </div>
  );
}

/**
 * Bulk Action Bar for multi-selection operations
 */
function BulkActionBar({
  query,
  selectedIds,
  selectedRows,
  total,
  reload,
  employees,
  departments,
  stages = [],
  canDelete,
  onClear,
}) {
  const [selectAllMatching, setSelectAllMatching] = React.useState(false);
  const [assignedToId, setAssignedToId] = React.useState('');
  const [assignedTeam, setAssignedTeam] = React.useState('');
  const [status, setStatus] = React.useState('NEW');
  const [priority, setPriority] = React.useState('MEDIUM');
  const [confirm, setConfirm] = React.useState(null);

  const count = selectAllMatching ? Number(total || 0) : selectedIds.length;

  const target = async () => {
    if (selectAllMatching) return { selectAll: true, filters: filtersFrom(query) };
    return { ids: selectedIds };
  };

  const run = async (action) => {
    try {
      const body = await target();
      const result = unwrap(await action(body));
      toast.success(
        `${result.success ?? result.count ?? 0} updated, ${result.failed ?? 0} failed.`
      );
      if (result.failures?.length) toast.error(result.failures[0].message);
      onClear();
      reload();
    } catch (err) {
      toast.error(crmError(err));
    }
  };

  const archive = async () => {
    try {
      const ids = selectAllMatching ? await matchingIds(query) : selectedIds;
      const result = unwrap(await archiveLeads(ids));
      toast.success(result.message || `${result.count ?? ids.length} leads archived.`);
      onClear();
      reload();
    } catch (err) {
      toast.error(crmError(err));
    }
  };

  return (
    <div className="space-y-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1">
      <AdminBulkSelectionToolbar count={count} onClear={onClear}>
        <AdminBulkActions>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mr-2">
            <AdminSelectCheckbox
              checked={selectAllMatching}
              onChange={setSelectAllMatching}
              label="Select all matching leads across all pages"
            />
            <span>All matching ({total})</span>
          </label>

          {/* Assign Employee & Team */}
          <select
            aria-label="Assign employee"
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs"
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
          >
            <option value="">Choose Employee</option>
            {employees.map((emp) => (
              <option key={emp.recordId} value={emp.recordId}>
                {emp.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Assign department"
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs"
            value={assignedTeam}
            onChange={(e) => setAssignedTeam(e.target.value)}
          >
            <option value="">Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              assignedToId
                ? run((body) =>
                    bulkAssignLeads({
                      ...body,
                      assignedToId: Number(assignedToId),
                      assignedTeam: assignedTeam || undefined,
                    })
                  )
                : toast.error('Choose an employee.')
            }
            className="h-8 text-xs font-semibold"
          >
            Assign
          </Button>

          {/* Update Status */}
          <select
            aria-label="Update stage"
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {stages.map((stage) => (
              <option key={stage.id || stage.key} value={stage.key}>
                {stage.name}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="outline"
            onClick={() => run((body) => bulkLeadStatus({ ...body, status }))}
            className="h-8 text-xs font-semibold"
          >
            Set Stage
          </Button>

          {/* Update Priority */}
          <select
            aria-label="Update priority"
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {PRIORITIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="outline"
            onClick={() => run((body) => bulkLeadPriority({ ...body, priority }))}
            className="h-8 text-xs font-semibold"
          >
            Set Priority
          </Button>

          {/* Bulk Export */}
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              if (!selectAllMatching) {
                downloadCsv(selectedRows);
                return;
              }
              const rows = [];
              let total = 0;
              for (let page = 1; page <= 20; page += 1) {
                const result = await listLeadPage({ ...filtersFrom(query), page, limit: 100 });
                rows.push(...result.rows);
                total = Number(result.pagination?.total || rows.length);
                if (page >= Number(result.pagination?.totalPages || 1)) break;
              }
              downloadCsv(rows);
              if (total > rows.length) {
                toast.error(`Exported ${rows.length} of ${total} matching leads.`);
              }
            }}
            className="h-8 text-xs font-semibold"
          >
            Export
          </Button>

          {/* Bulk Archive / Delete */}
          {canDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setConfirm('archive')}
              className="h-8 text-xs font-semibold"
            >
              Archive
            </Button>
          )}

          {canDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setConfirm('delete')}
              className="h-8 text-xs font-semibold"
            >
              Delete
            </Button>
          )}
        </AdminBulkActions>
      </AdminBulkSelectionToolbar>

      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={() => setConfirm(null)}
        variant="destructive"
        title={confirm === 'delete' ? 'Delete selected leads' : 'Archive selected leads'}
        description={`${count} leads will be soft-deleted using the existing lead archive API.`}
        confirmLabel="Continue"
        onConfirm={() => {
          setConfirm(null);
          archive();
        }}
      />
    </div>
  );
}

/**
 * Rich Lead Dossier View inside Sheet
 */
function LeadDossierContent({ lead, stages = [], onEdit }) {
  return (
    <div className="space-y-4 text-xs">
      {/* Top Profile Summary Card */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <LeadAvatar lead={lead} />
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-slate-900 truncate">{personName(lead)}</h3>
              <p className="text-slate-600 truncate">
                {lead.companyName || 'No company'}
                {lead.category ? ` · ${lead.category}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <StageBadge stage={lead.stage} status={lead.status} stages={stages} />
            <PriorityBadge priority={lead.priority} />
          </div>
        </div>

        {/* Quick Contact Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80">
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-[#173D30] font-semibold hover:bg-emerald-100 transition-colors"
            >
              <Phone className="size-3 text-[#20C466]" />
              Call
            </a>
          )}
          {lead.phone && (
            <a
              href={`https://wa.me/${String(lead.phone).replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-100 transition-colors"
            >
              <FontAwesomeIcon icon={faWhatsapp} className="size-3 text-emerald-600" />
              WhatsApp
            </a>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
            >
              <Mail className="size-3 text-slate-500" />
              Email
            </a>
          )}
          {lead.website && (
            <a
              href={
                /^https?:\/\//i.test(lead.website)
                  ? lead.website
                  : `https://${lead.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
            >
              <Globe className="size-3 text-slate-500" />
              Website
            </a>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            className="h-7 text-xs ml-auto gap-1"
          >
            <Edit className="size-3" />
            Edit Lead
          </Button>
        </div>
      </div>

      {/* Lead Photos */}
      <LeadPhotos lead={lead} />

      {/* Contact & Location Details */}
      <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2">
        <h4 className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
          <Building className="size-3.5 text-[#20C466]" />
          Contact & Location
        </h4>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-400 block">Mobile Phone:</span>
            <span className="font-medium text-slate-800">{lead.phone || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Email Address:</span>
            <span className="font-medium text-slate-800 truncate block">{lead.email || '—'}</span>
          </div>
          <div className="col-span-2">
            <span className="text-slate-400 block">Address:</span>
            <span className="font-medium text-slate-800">
              {[lead.address, lead.city, lead.state, lead.country, lead.pincode]
                .filter(Boolean)
                .join(', ') || 'No address specified'}
            </span>
          </div>
        </div>
      </div>

      {/* Sales Pipeline & Assignment Details */}
      <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2">
        <h4 className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
          <Briefcase className="size-3.5 text-[#20C466]" />
          Pipeline & Assignment
        </h4>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-400 block">Estimated Deal Value:</span>
            <span className="font-bold text-[#173D30]">
              {lead.value ? `₹${Number(lead.value).toLocaleString('en-IN')}` : '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Lead Source:</span>
            <span className="font-medium text-slate-800">{lead.source || 'Manual'}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Assigned Sales Employee:</span>
            <span className="font-medium text-slate-800">
              {personName(lead.assignedTo || lead.employee)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Assigned Department:</span>
            <span className="font-medium text-slate-800">{lead.assignedTeam || '—'}</span>
          </div>
        </div>
      </div>

      {/* Social Media Links */}
      <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2">
        <h4 className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
          <Share2 className="size-3.5 text-[#20C466]" />
          Social Media Profiles
        </h4>
        <SocialLinks lead={lead} />
      </div>

      {/* Notes & History */}
      <LeadNotes id={lead.id} />
    </div>
  );
}

/**
 * Lead Notes Component with Inline Addition
 */
function LeadNotes({ id }) {
  const [notes, setNotes] = React.useState([]);
  const [content, setContent] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const refresh = React.useCallback(() => {
    loadLeadNotes(id)
      .then(setNotes)
      .catch(() => setNotes([]));
  }, [id]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await addLeadNote(id, content);
      setContent('');
      refresh();
      toast.success('Note added');
    } catch (err) {
      toast.error('Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2.5">
      <h4 className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
        <MessageSquare className="size-3.5 text-[#20C466]" />
        Lead Activity & Notes
      </h4>

      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-slate-400 italic text-[11px]">No notes logged yet for this lead.</p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-700"
            >
              <p className="leading-relaxed">{note.content || note.note || note.text}</p>
              {note.createdAt && (
                <span className="text-[9px] text-slate-400 block mt-1">
                  {new Date(note.createdAt).toLocaleString()}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAddNote} className="flex gap-2 pt-1 border-t border-slate-100">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add an internal note or call summary..."
          className="h-8 text-xs rounded-lg"
        />
        <Button
          type="submit"
          disabled={!content.trim() || submitting}
          size="sm"
          className="h-8 bg-[#173D30] hover:bg-[#123026] text-white text-xs shrink-0"
        >
          Save
        </Button>
      </form>
    </div>
  );
}

/**
 * CSV Bulk Import Drawer
 */
function CsvImportPanel({ open, onOpenChange, onImported }) {
  const [text, setText] = React.useState('');
  const [summary, setSummary] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const run = async () => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      toast.error('Paste a header row and at least one lead.');
      return;
    }
    const headers = lines[0].split(',').map((item) => item.trim().toLowerCase());
    setLoading(true);
    let imported = 0;
    let existing = 0;
    let failed = 0;
    for (const line of lines.slice(1)) {
      const cells = line.split(',').map((item) => item.trim());
      const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] || '']));
      const form = {
        leadName: row.name || row['lead name'] || row.lead || '',
        companyName: row.company || row['company name'] || '',
        phone: row.phone || row.mobile || '',
        email: row.email || '',
        website: row.website || '',
        address: row.address || '',
        city: row.city || '',
        state: row.state || '',
        country: row.country || '',
        pincode: row.pincode || '',
        source: row.source || 'Manual',
        category: row.category || '',
        priority: (row.priority || 'MEDIUM').toUpperCase(),
        status: (row.status || 'NEW').toUpperCase(),
        value: row.value || '',
        notes: row.notes || '',
      };
      try {
        await persistLead(form);
        imported += 1;
      } catch (err) {
        if (/already exists|duplicate|match/i.test(err.message || '')) existing += 1;
        else failed += 1;
      }
    }
    setSummary({ imported, existing, failed, total: lines.length - 1 });
    setLoading(false);
    onImported?.();
  };

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Bulk Import Leads"
      description="Create leads through the existing lead API. Columns: name, company, phone, email, website, address, city, state, country, pincode, source, category, priority, status, value, notes."
      showFooter={false}
    >
      <div className="space-y-3 text-xs">
        <textarea
          aria-label="CSV leads"
          className="min-h-40 w-full rounded-xl border border-slate-200 p-2.5 font-mono text-xs focus:ring-1 focus:ring-[#173D30]"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="name,company,phone,email&#10;Asha Rao,Northwind,9820012345,asha@northwind.example"
        />
        <Button
          onClick={run}
          disabled={loading}
          className="w-full bg-[#173D30] hover:bg-[#123026] text-white"
        >
          {loading ? 'Importing leads...' : 'Import rows'}
        </Button>
        {summary && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
            <p className="font-semibold">Import Summary:</p>
            <p>
              Processed: {summary.total} | Imported: {summary.imported} | Existing:{' '}
              {summary.existing} | Failed: {summary.failed}
            </p>
          </div>
        )}
      </div>
    </FormDrawer>
  );
}
