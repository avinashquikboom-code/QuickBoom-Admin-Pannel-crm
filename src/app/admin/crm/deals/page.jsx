'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageTitleCard } from '@/components/common/PageTitleCard';
import {
  Search,
  Filter,
  Plus,
  Download,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Building,
  Phone,
  Mail,
  Calendar,
  User,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit,
  Briefcase,
  AlertTriangle,
  Handshake,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Sparkles,
  Layers,
  Percent,
} from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Button } from '@/components/common/Button';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from '@/hooks/use-toast';
import {
  crmError,
  loadDealStages,
  loadDeals,
  loadEmployees,
  loadCompanies,
  loadContacts,
  loadLeads,
  moveDealStage,
  personName,
  removeDeal,
  removeDeals,
  saveDeal,
  sessionCan,
} from '@/modules/crm/crm-api';
import { sessionCanAction } from '@/modules/hrm/hrm-api';
import { cn } from '@/lib/utils';
import { HotDealLeads } from '@/modules/crm/HotDealLeads';

const blankDeal = {
  title: '',
  amount: '',
  stageId: '',
  status: 'OPEN',
  probability: '50',
  expectedClosing: '',
  assignedToId: '',
  leadId: '',
  companyId: '',
  contactId: '',
  currency: 'INR',
  description: '',
  notes: '',
};

export function formatCurrency(amount, currency = 'INR') {
  const num = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return `₹${num.toLocaleString('en-IN')}`;
  }
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(value).slice(0, 10);
  }
}

function downloadDealsCsv(rows) {
  const headers = [
    'Deal Name',
    'Company',
    'Deal Value',
    'Currency',
    'Stage',
    'Probability (%)',
    'Owner',
    'Status',
    'Expected Close',
    'Created Date',
  ];
  const lines = rows.map((row) =>
    [
      row.title || '',
      row.company?.name || row.lead?.companyName || '',
      row.amount || 0,
      row.currency || 'INR',
      row.stage?.name || '',
      row.probability ?? '',
      personName(row.assignedTo),
      row.isWon ? 'Won' : row.isLost ? 'Lost' : 'Open',
      String(row.expectedClosing || '').slice(0, 10),
      String(row.createdAt || '').slice(0, 10),
    ]
      .map((val) => `"${String(val || '').replace(/"/g, '""')}"`)
      .join(',')
  );
  const blob = new Blob([[headers.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `deals-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function DealStatusBadge({ isWon, isLost, status, stageName }) {
  if (isWon || status === 'WON') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs whitespace-nowrap">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Won
      </span>
    );
  }
  if (isLost || status === 'LOST') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs whitespace-nowrap">
        <span className="size-1.5 rounded-full bg-rose-500" />
        Lost
      </span>
    );
  }
  if (stageName === 'Final Call' || status === 'FINAL_CALL') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs whitespace-nowrap">
        <span className="size-1.5 rounded-full bg-amber-500" />
        Final Call
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs whitespace-nowrap">
      <span className="size-1.5 rounded-full bg-blue-500" />
      Open
    </span>
  );
}

function DealStageBadge({ stage, won, lost }) {
  if (won) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs whitespace-nowrap">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Won
      </span>
    );
  }
  if (lost) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs whitespace-nowrap">
        <span className="size-1.5 rounded-full bg-rose-500" />
        Lost
      </span>
    );
  }
  const name = stage?.name || '—';
  const color = stage?.color || '#20C466';

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs whitespace-nowrap"
      style={{
        color: color,
        backgroundColor: `${color}14`,
        borderColor: `${color}40`,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}

function ProbabilityPill({ probability }) {
  if (probability == null || probability === '') {
    return <span className="text-slate-400 text-xs">—</span>;
  }
  const val = Number(probability);
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let barColor = 'bg-slate-500';

  if (val >= 75) {
    badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    barColor = 'bg-[#20C466]';
  } else if (val >= 40) {
    badgeStyle = 'bg-blue-50 text-blue-800 border-blue-200';
    barColor = 'bg-blue-500';
  } else if (val > 0) {
    badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
    barColor = 'bg-amber-500';
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border shadow-2xs',
          badgeStyle
        )}
      >
        {val}%
      </span>
      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${Math.min(val, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function DealsRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [canDelete, setCanDelete] = React.useState(false);
  const [employees, setEmployees] = React.useState([]);
  const [stages, setStages] = React.useState([]);
  const [companies, setCompanies] = React.useState([]);
  const [leads, setLeads] = React.useState([]);
  const [contacts, setContacts] = React.useState([]);

  // Table Data & State
  const [rows, setRows] = React.useState([]);
  const [payload, setPayload] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [reloadKey, setReloadKey] = React.useState(0);

  // Filters State
  const [query, setQuery] = React.useState({
    search: '',
    stage: '',
    status: '',
    assignedToId: '',
    closeFrom: '',
    closeTo: '',
    page: 1,
    limit: 20,
  });

  // Debounced search text
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((prev) => {
        if (prev.search === searchTerm) return prev;
        return { ...prev, search: searchTerm, page: 1 };
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sorting State
  const [sortKey, setSortKey] = React.useState('createdAt');
  const [sortDir, setSortDir] = React.useState('desc');

  // Selection State
  const [selectedIds, setSelectedIds] = React.useState([]);

  // Detail Dossier Drawer
  const [selectedDeal, setSelectedDeal] = React.useState(null);

  // Form Drawer (Create & Edit)
  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState({ ...blankDeal });
  const [editingId, setEditingId] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  // Delete Confirmation Dialog
  const [pendingDelete, setPendingDelete] = React.useState(null);

  // Load Permissions & Meta on mount
  React.useEffect(() => {
    setAllowed(sessionCan('DEAL') || sessionCan('CRM'));
    setCanDelete(
      sessionCanAction('DEALS', 'DELETE') ||
        sessionCanAction('DEAL', 'DELETE') ||
        sessionCanAction('CRM', 'DELETE')
    );
    loadEmployees({ salesOnly: true }).then(setEmployees).catch(() => setEmployees([]));
    loadDealStages(false).then((result) => setStages(result.stages || [])).catch(() => setStages([]));
    loadCompanies({ limit: 100 }).then((r) => setCompanies(r.rows || [])).catch(() => setCompanies([]));
    loadLeads({ limit: 100 }).then((r) => setLeads(r.rows || [])).catch(() => setLeads([]));
    loadContacts({ limit: 100 }).then((r) => setContacts(r.rows || [])).catch(() => setContacts([]));
  }, []);

  // Fetch Deals
  const fetchDeals = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadDeals({
        page: query.page,
        limit: query.limit || 20,
        search: query.search || undefined,
        stage: query.stage || undefined,
        status: query.status || undefined,
        assignedToId: query.assignedToId || undefined,
        closeFrom: query.closeFrom || undefined,
        closeTo: query.closeTo || undefined,
      });
      setRows(result.rows || []);
      setPayload(result);
      if (result.stages?.length && !stages.length) {
        setStages(result.stages);
      }
      setError('');
    } catch (err) {
      setError(crmError(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [query, stages.length]);

  React.useEffect(() => {
    fetchDeals();
  }, [fetchDeals, reloadKey]);

  // KPI Statistics directly from API metrics & actual data
  const metrics = payload.metrics || {};
  const totalDealsCount =
    metrics.total ?? payload.pagination?.total ?? rows.length;
  const openDealsCount =
    metrics.open ?? rows.filter((r) => !r.isWon && !r.isLost).length;
  const wonValueAmount =
    metrics.wonValue ??
    rows
      .filter((r) => r.isWon)
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const pipelineValueAmount =
    metrics.pipelineValue ??
    rows
      .filter((r) => !r.isWon && !r.isLost)
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // Sorting
  const sortedRows = React.useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      if (sortKey === 'title') {
        valA = String(a.title || '').toLowerCase();
        valB = String(b.title || '').toLowerCase();
      } else if (sortKey === 'company') {
        valA = String(a.company?.name || a.lead?.companyName || '').toLowerCase();
        valB = String(b.company?.name || b.lead?.companyName || '').toLowerCase();
      } else if (sortKey === 'amount') {
        valA = Number(a.amount) || 0;
        valB = Number(b.amount) || 0;
        return sortDir === 'asc' ? valA - valB : valB - valA;
      } else if (sortKey === 'probability') {
        valA = Number(a.probability) || 0;
        valB = Number(b.probability) || 0;
        return sortDir === 'asc' ? valA - valB : valB - valA;
      } else if (sortKey === 'assigned') {
        valA = personName(a.assignedTo).toLowerCase();
        valB = personName(b.assignedTo).toLowerCase();
      } else if (sortKey === 'stage') {
        valA = String(a.stage?.name || '').toLowerCase();
        valB = String(b.stage?.name || '').toLowerCase();
      } else if (sortKey === 'createdAt') {
        valA = new Date(a.createdAt || 0).getTime();
        valB = new Date(b.createdAt || 0).getTime();
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }
      valA = String(valA || '');
      valB = String(valB || '');
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
  const isAllSelected =
    rows.length > 0 && rows.every((r) => selectedIds.includes(r.id));
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

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setQuery({
      search: '',
      stage: '',
      status: '',
      assignedToId: '',
      closeFrom: '',
      closeTo: '',
      page: 1,
      limit: 20,
    });
    setSelectedIds([]);
  };

  const activeFilterCount = [
    query.search,
    query.stage,
    query.status,
    query.assignedToId,
    query.closeFrom,
    query.closeTo,
  ].filter(Boolean).length;

  // Save Deal
  const handleSaveDeal = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Deal title is required.');
      return;
    }
    if (form.amount === '' || Number.isNaN(Number(form.amount))) {
      toast.error('Deal amount must be a valid number.');
      return;
    }

    setSaving(true);
    try {
      const isWon = form.status === 'WON';
      const isLost = form.status === 'LOST';

      await saveDeal(
        {
          ...form,
          amount: Number(form.amount),
          probability:
            form.probability === '' ? undefined : Number(form.probability),
          leadId: form.leadId || undefined,
          companyId: form.companyId || undefined,
          contactId: form.contactId || undefined,
          assignedToId: form.assignedToId || undefined,
          stageId: form.stageId || undefined,
          isWon,
          isLost,
        },
        editingId
      );

      toast.success(editingId ? 'Deal updated successfully' : 'Deal created successfully');
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
  const handleEditDeal = (row) => {
    setEditingId(row.id);
    setForm({
      ...blankDeal,
      title: row.title || '',
      amount: String(row.amount ?? ''),
      stageId: String(row.stageId || row.stage?.id || ''),
      status: row.isWon ? 'WON' : row.isLost ? 'LOST' : 'OPEN',
      probability: String(row.probability ?? '50'),
      expectedClosing: row.expectedClosing ? String(row.expectedClosing).slice(0, 10) : '',
      assignedToId: String(row.assignedToId || row.assignedTo?.id || ''),
      leadId: String(row.leadId || row.lead?.id || ''),
      companyId: String(row.companyId || row.company?.id || ''),
      contactId: String(row.contactId || row.contact?.id || ''),
      currency: row.currency || 'INR',
      description: row.description || '',
      notes: row.notes || '',
    });
    setFormOpen(true);
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    const { rows: targetRows, single } = pendingDelete;
    setPendingDelete(null);

    try {
      if (single) {
        await removeDeal(targetRows[0].id);
        toast.success('Deal deleted successfully');
      } else {
        const ids = targetRows.map((r) => r.id);
        const res = await removeDeals(ids);
        const body = res?.data || res;
        const count = body?.success ?? ids.length;
        toast.success(`${count} deal${count === 1 ? '' : 's'} deleted successfully`);
      }
      setSelectedIds([]);
      setReloadKey((v) => v + 1);
    } catch (err) {
      toast.error(crmError(err));
    }
  };

  return (
    <div className="space-y-5 pb-28 w-full min-w-0">
      {/* 1. Page Title Card */}
      <PageTitleCard
        moduleName="CRM"
        breadcrumb="Hot Leads"
        title="Hot Leads"
        description="Sales pipeline, including deals waiting on a final customer decision."
        icon={Handshake}
        badge={`${totalDealsCount} Total`}
        badgeVariant="green"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadDealsCsv(rows)}
              disabled={rows.length === 0}
              className="h-10 gap-1.5 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#173D30] shadow-2xs"
            >
              <Download className="size-3.5 text-slate-500" />
              <span>Export</span>
            </Button>

            {allowed && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    ...blankDeal,
                    stageId: stages[0]?.id ? String(stages[0].id) : '',
                  });
                  setFormOpen(true);
                }}
                className="h-10 gap-1.5 rounded-xl bg-[#173D30] hover:bg-[#123026] text-white text-xs font-semibold shadow-xs"
              >
                <Plus className="size-4 text-[#20C466]" />
                <span>Add Deal</span>
              </Button>
            )}
          </>
        }
      />

      <HotDealLeads />

      {/* 2. Four KPI Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Deals */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Total Deals</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-[#173D30] flex items-center justify-center border border-emerald-100">
              <Handshake className="size-4 text-[#20C466]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#173D30] tracking-tight">
              {totalDealsCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">All sales pipeline records</p>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#20C466]" />
        </div>

        {/* Card 2: Open Deals */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Open Deals</span>
            <div className="size-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <Clock className="size-4 text-blue-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {openDealsCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Active deals in negotiation</p>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
        </div>

        {/* Card 3: Won Value */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Won Value</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="size-4 text-[#16A34A]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[#16A34A] tracking-tight truncate">
              {formatCurrency(wonValueAmount)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Closed & won revenue</p>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#16A34A]" />
        </div>

        {/* Card 4: Pipeline Value */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Pipeline Value</span>
            <div className="size-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
              <TrendingUp className="size-4 text-purple-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight truncate">
              {formatCurrency(pipelineValueAmount)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Total open deal potential</p>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
        </div>
      </div>

      {/* 3. Search and Comprehensive Filter Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Debounced Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search deals by title, company, contact, lead..."
              className="pl-9 pr-8 h-9 text-xs rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setQuery((prev) => ({ ...prev, search: '', page: 1 }));
                }}
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
              value={query.stage}
              onChange={(e) => setQuery({ ...query, stage: e.target.value, page: 1 })}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="">All stages</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.name}>
                  {stage.name} {stage.isActive === false ? '(inactive)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              aria-label="Filter by status"
              value={query.status}
              onChange={(e) => setQuery({ ...query, status: e.target.value, page: 1 })}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
              <option value="FINAL_CALL">Final Call</option>
            </select>
          </div>

          {/* Employee Filter */}
          <div>
            <select
              aria-label="Filter by owner"
              value={query.assignedToId}
              onChange={(e) => setQuery({ ...query, assignedToId: e.target.value, page: 1 })}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="">All owners</option>
              {employees.map((emp) => (
                <option key={emp.recordId} value={String(emp.userId || emp.recordId)}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Action */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReloadKey((v) => v + 1)}
              className="h-9 w-full gap-1 rounded-xl text-xs border-slate-200 text-slate-700 hover:text-[#173D30] hover:bg-slate-50"
            >
              <RotateCcw className="size-3.5" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Date Filters & Active Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">Expected Closing:</span>
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                aria-label="Expected Close From"
                value={query.closeFrom}
                onChange={(e) => setQuery({ ...query, closeFrom: e.target.value, page: 1 })}
                className="h-8 text-xs rounded-lg border-slate-200 w-32"
              />
              <span className="text-slate-400">to</span>
              <Input
                type="date"
                aria-label="Expected Close To"
                value={query.closeTo}
                onChange={(e) => setQuery({ ...query, closeTo: e.target.value, page: 1 })}
                className="h-8 text-xs rounded-lg border-slate-200 w-32"
              />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 text-xs text-rose-600 hover:bg-rose-50"
            >
              Clear all filters ({activeFilterCount})
            </Button>
          )}
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400">Active filters:</span>
            {query.search && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                Search: &ldquo;{query.search}&rdquo;
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setQuery({ ...query, search: '', page: 1 });
                  }}
                  className="hover:text-rose-600"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            {query.stage && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                Stage: {query.stage}
                <button
                  onClick={() => setQuery({ ...query, stage: '', page: 1 })}
                  className="hover:text-rose-600"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            {query.status && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md text-[11px]">
                Status: {query.status}
                <button
                  onClick={() => setQuery({ ...query, status: '', page: 1 })}
                  className="hover:text-rose-600"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            {query.assignedToId && (
              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md text-[11px]">
                Owner:{' '}
                {employees.find((e) => String(e.userId || e.recordId) === query.assignedToId)?.name ||
                  query.assignedToId}
                <button
                  onClick={() => setQuery({ ...query, assignedToId: '', page: 1 })}
                  className="hover:text-rose-600"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            {(query.closeFrom || query.closeTo) && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                Close Date: {query.closeFrom || 'Start'} to {query.closeTo || 'Now'}
                <button
                  onClick={() => setQuery({ ...query, closeFrom: '', closeTo: '', page: 1 })}
                  className="hover:text-rose-600"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4. Bulk Selection Toolbar (When rows selected) */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <span className="flex size-5 items-center justify-center rounded-full bg-[#173D30] text-white text-[10px]">
              {selectedIds.length}
            </span>
            <span>Selected deal{selectedIds.length === 1 ? '' : 's'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const selectedRows = rows.filter((r) => selectedIds.includes(r.id));
                downloadDealsCsv(selectedRows);
              }}
              className="h-8 text-xs font-semibold border-slate-200 bg-white"
            >
              Export Selected
            </Button>

            {canDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  setPendingDelete({
                    rows: rows.filter((r) => selectedIds.includes(r.id)),
                    single: false,
                  })
                }
                className="h-8 text-xs font-semibold"
              >
                Delete Selected
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="h-8 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* 5. Main Deals Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="w-full overflow-x-auto min-w-0">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 min-w-[180px]">Deal Name</th>
                  <th className="py-3 px-3 min-w-[140px]">Company</th>
                  <th className="py-3 px-3 min-w-[120px]">Deal Value</th>
                  <th className="py-3 px-3 min-w-[120px]">Stage</th>
                  <th className="py-3 px-3 min-w-[100px]">Probability</th>
                  <th className="py-3 px-3 min-w-[140px]">Owner</th>
                  <th className="py-3 px-3 min-w-[110px]">Created Date</th>
                  <th className="py-3 px-3 min-w-[100px]">Status</th>
                  <th className="py-3 px-3 text-right min-w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-3 text-center">
                      <div className="size-4 bg-slate-200 rounded mx-auto" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-3.5 w-32 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-3 w-24 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-4 w-20 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-5 w-20 bg-slate-200 rounded-full" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-4 w-12 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-3 w-20 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-3 w-16 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-5 w-16 bg-slate-200 rounded-full" />
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="h-5 w-16 bg-slate-200 rounded ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <div className="p-14 text-center text-xs text-slate-500 space-y-3">
            <div className="size-12 rounded-2xl bg-emerald-50 text-[#173D30] border border-emerald-100 flex items-center justify-center mx-auto">
              <Handshake className="size-6 text-[#20C466]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">No deals found</h3>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                There are no deals matching your current filters.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              {activeFilterCount > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-xs rounded-xl"
                >
                  Reset Filters
                </Button>
              ) : null}
              {allowed && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      ...blankDeal,
                      stageId: stages[0]?.id ? String(stages[0].id) : '',
                    });
                    setFormOpen(true);
                  }}
                  className="bg-[#173D30] hover:bg-[#123026] text-white text-xs rounded-xl"
                >
                  Add Deal
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto min-w-0">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 select-none">
                  {/* 1. Checkbox */}
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="size-4 rounded border-slate-300 text-[#173D30] focus:ring-[#20C466]"
                      aria-label="Select all on this page"
                    />
                  </th>

                  {/* 2. Deal Name */}
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[180px]"
                    onClick={() => handleSort('title')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Deal Name</span>
                      {sortKey === 'title' ? (
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

                  {/* 3. Company */}
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[140px]"
                    onClick={() => handleSort('company')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Company</span>
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

                  {/* 4. Deal Value */}
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[120px]"
                    onClick={() => handleSort('amount')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Deal Value</span>
                      {sortKey === 'amount' ? (
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

                  {/* 5. Stage */}
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[120px]"
                    onClick={() => handleSort('stage')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Stage</span>
                      {sortKey === 'stage' ? (
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

                  {/* 6. Probability */}
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[110px]"
                    onClick={() => handleSort('probability')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Probability</span>
                      {sortKey === 'probability' ? (
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

                  {/* 7. Owner */}
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[140px]"
                    onClick={() => handleSort('assigned')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Owner</span>
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

                  {/* 8. Created Date */}
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[105px]"
                    onClick={() => handleSort('createdAt')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Created Date</span>
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

                  {/* 9. Status */}
                  <th className="py-3 px-3 min-w-[95px]">Status</th>

                  {/* 10. Actions */}
                  <th className="py-3 px-3 text-right min-w-[95px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRows.map((row) => {
                  const isRowSelected = selectedIds.includes(row.id);
                  const ownerName = personName(row.assignedTo);
                  const ownerInitial = (ownerName || 'U')[0]?.toUpperCase();
                  const companyName =
                    row.company?.name || row.lead?.companyName || null;

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'transition-colors hover:bg-slate-50/80 group',
                        isRowSelected && 'bg-emerald-50/30'
                      )}
                    >
                      {/* 1. Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => toggleSelectRow(row.id)}
                          className="size-4 rounded border-slate-300 text-[#173D30] focus:ring-[#20C466]"
                          aria-label={`Select ${row.title}`}
                        />
                      </td>

                      {/* 2. Deal Name */}
                      <td className="py-3.5 px-3">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setSelectedDeal(row)}
                            className="font-bold text-slate-900 hover:text-[#173D30] hover:underline text-xs text-left truncate block max-w-[200px]"
                            title={row.title}
                          >
                            {row.title}
                          </button>
                          {row.lead && (
                            <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                              Lead:{' '}
                              {personName(row.lead) !== '—'
                                ? personName(row.lead)
                                : row.lead.companyName || `#${row.lead.id}`}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Company */}
                      <td className="py-3.5 px-3">
                        {companyName ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Building className="size-3 text-slate-400 shrink-0" />
                            <span
                              className="font-medium text-slate-800 text-xs truncate max-w-[130px]"
                              title={companyName}
                            >
                              {companyName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">—</span>
                        )}
                      </td>

                      {/* 4. Deal Value */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900 text-xs">
                          {formatCurrency(row.amount, row.currency)}
                        </span>
                      </td>

                      {/* 5. Stage */}
                      <td className="py-3.5 px-3">
                        <DealStageBadge
                          stage={row.stage}
                          won={row.isWon}
                          lost={row.isLost}
                        />
                      </td>

                      {/* 6. Probability */}
                      <td className="py-3.5 px-3">
                        <ProbabilityPill probability={row.probability} />
                      </td>

                      {/* 7. Owner */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex size-6 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-[#173D30] border border-emerald-200 shrink-0">
                            {ownerInitial}
                          </span>
                          <span
                            className="truncate font-medium text-slate-800 text-xs max-w-[110px]"
                            title={ownerName}
                          >
                            {ownerName}
                          </span>
                        </div>
                      </td>

                      {/* 8. Created Date */}
                      <td className="py-3.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {formatDate(row.createdAt)}
                      </td>

                      {/* 9. Status */}
                      <td className="py-3.5 px-3">
                        <DealStatusBadge
                          isWon={row.isWon}
                          isLost={row.isLost}
                          status={row.status}
                          stageName={row.stage?.name}
                        />
                      </td>

                      {/* 10. Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedDeal(row)}
                            title="View Deal Dossier"
                            className="size-7 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center transition-colors"
                          >
                            <Eye className="size-3.5" />
                          </button>

                          {allowed && (
                            <button
                              type="button"
                              onClick={() => handleEditDeal(row)}
                              title="Edit Deal"
                              className="size-7 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 flex items-center justify-center transition-colors"
                            >
                              <Edit className="size-3.5" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() =>
                                setPendingDelete({
                                  rows: [row],
                                  single: true,
                                })
                              }
                              title="Delete Deal"
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

      {/* 6. Pagination Bar with Rows-Per-Page Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 px-1 pt-1">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-800">
              {rows.length === 0 ? 0 : (query.page - 1) * (query.limit || 20) + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(
                query.page * (query.limit || 20),
                payload.pagination?.total || rows.length
              )}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-800">
              {payload.pagination?.total || rows.length}
            </span>{' '}
            deals
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
            <span className="text-slate-500">Rows per page:</span>
            <select
              aria-label="Rows per page"
              value={query.limit || 20}
              onChange={(e) =>
                setQuery((p) => ({ ...p, limit: Number(e.target.value), page: 1 }))
              }
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
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

      {/* Add / Edit Deal Form Drawer */}
      <FormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingId ? 'Edit Deal' : 'Add Deal'}
        description="Fill sales pipeline deal details to persist to CRM database."
        onSubmit={handleSaveDeal}
        loading={saving}
      >
        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-xs font-semibold text-slate-700">
              Deal Title <span className="text-rose-500">*</span>
            </Label>
            <Input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Enterprise CRM Annual Subscription"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">
              Deal Value (Amount in {form.currency || 'INR'}) <span className="text-rose-500">*</span>
            </Label>
            <Input
              required
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="e.g. 250000"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Pipeline Stage</Label>
            <select
              value={form.stageId}
              onChange={(e) => setForm({ ...form, stageId: e.target.value })}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="">Choose Stage</option>
              {stages.map((stg) => (
                <option key={stg.id} value={stg.id}>
                  {stg.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Deal Status</Label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="OPEN">Open (In Progress)</option>
              <option value="WON">Won (Closed Won)</option>
              <option value="LOST">Lost (Closed Lost)</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">
              Win Probability (%)
            </Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={form.probability}
              onChange={(e) => setForm({ ...form, probability: e.target.value })}
              placeholder="e.g. 70"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Expected Closing Date</Label>
            <Input
              type="date"
              value={form.expectedClosing}
              onChange={(e) => setForm({ ...form, expectedClosing: e.target.value })}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Assigned Owner</Label>
            <select
              value={form.assignedToId}
              onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="">Unassigned</option>
              {employees.map((emp) => (
                <option key={emp.recordId} value={String(emp.userId || emp.recordId)}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Linked Lead</Label>
            <select
              value={form.leadId}
              onChange={(e) => setForm({ ...form, leadId: e.target.value })}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="">None / Not linked</option>
              {leads.map((ld) => (
                <option key={ld.id} value={String(ld.id)}>
                  {personName(ld) !== '—' ? personName(ld) : ld.companyName || `Lead #${ld.id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Linked Company</Label>
            <select
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="">None / Not linked</option>
              {companies.map((cmp) => (
                <option key={cmp.id} value={String(cmp.id)}>
                  {cmp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Linked Contact</Label>
            <select
              value={form.contactId}
              onChange={(e) => setForm({ ...form, contactId: e.target.value })}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="">None / Not linked</option>
              {contacts.map((cnt) => (
                <option key={cnt.id} value={String(cnt.id)}>
                  {personName(cnt)} {cnt.companyName ? `(${cnt.companyName})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Notes / Details</Label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Add key deal context, decision makers, or negotiation background..."
              className="h-20 w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            />
          </div>
        </div>
      </FormDrawer>

      {/* Deal Dossier Drawer */}
      <FormDrawer
        open={Boolean(selectedDeal)}
        onOpenChange={(open) => {
          if (!open) setSelectedDeal(null);
        }}
        title="Deal Dossier"
        description="Comprehensive sales pipeline details and stage management."
        showFooter={false}
      >
        {selectedDeal && (
          <DealDossierContent
            deal={selectedDeal}
            stages={stages}
            onEdit={() => {
              const d = selectedDeal;
              setSelectedDeal(null);
              handleEditDeal(d);
            }}
            onReload={() => {
              setReloadKey((v) => v + 1);
              setSelectedDeal(null);
            }}
          />
        )}
      </FormDrawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        variant="destructive"
        title={pendingDelete?.single ? 'Delete this deal?' : 'Delete selected deals?'}
        description={
          pendingDelete?.single
            ? `Are you sure you want to delete "${pendingDelete.rows[0]?.title}"? Linked lead and customer records will remain intact.`
            : `Are you sure you want to delete ${pendingDelete?.rows.length} selected deals?`
        }
        confirmLabel={pendingDelete?.single ? 'Delete Deal' : 'Delete Selected'}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

/**
 * Detailed Deal Dossier component shown inside drawer
 */
function DealDossierContent({ deal, stages = [], onEdit, onReload }) {
  const [stageId, setStageId] = React.useState(String(deal.stageId || deal.stage?.id || ''));
  const [moving, setMoving] = React.useState(false);

  const handleStageChange = async (newStageId) => {
    setStageId(newStageId);
    setMoving(true);
    try {
      await moveDealStage(deal.id, newStageId);
      toast.success('Deal stage moved successfully');
      onReload?.();
    } catch (err) {
      toast.error(crmError(err));
    } finally {
      setMoving(false);
    }
  };

  const handleMarkWon = async () => {
    try {
      await saveDeal({ isWon: true, isLost: false }, deal.id);
      toast.success('Deal marked as WON!');
      onReload?.();
    } catch (err) {
      toast.error(crmError(err));
    }
  };

  const handleMarkLost = async () => {
    try {
      await saveDeal({ isWon: false, isLost: true }, deal.id);
      toast.success('Deal marked as LOST');
      onReload?.();
    } catch (err) {
      toast.error(crmError(err));
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Profile Overview Card */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">{deal.title}</h3>
            <p className="text-slate-600 mt-0.5">
              {deal.company?.name || deal.lead?.companyName || 'No company specified'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <DealStatusBadge
              isWon={deal.isWon}
              isLost={deal.isLost}
              status={deal.status}
              stageName={deal.stage?.name}
            />
            <span className="text-lg font-bold text-[#173D30]">
              {formatCurrency(deal.amount, deal.currency)}
            </span>
          </div>
        </div>

        {/* Quick Outcome Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80">
          {!deal.isWon && (
            <Button
              size="sm"
              onClick={handleMarkWon}
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
            >
              <CheckCircle2 className="size-3" />
              Mark Won
            </Button>
          )}

          {!deal.isLost && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkLost}
              className="h-7 text-xs text-rose-600 hover:bg-rose-50 border-rose-200 gap-1"
            >
              <XCircle className="size-3" />
              Mark Lost
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            className="h-7 text-xs ml-auto gap-1 border-slate-200"
          >
            <Edit className="size-3" />
            Edit Deal
          </Button>
        </div>
      </div>

      {/* Stage Progression Selector */}
      <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2">
        <h4 className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
          <Layers className="size-3.5 text-[#20C466]" />
          Move Deal Stage
        </h4>
        <div className="flex items-center gap-2">
          <select
            value={stageId}
            disabled={moving}
            onChange={(e) => handleStageChange(e.target.value)}
            className="h-8 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
          >
            {stages.map((stg) => (
              <option key={stg.id} value={stg.id}>
                {stg.name}
              </option>
            ))}
          </select>
          {moving && (
            <span className="text-[11px] text-slate-400 animate-pulse">Moving...</span>
          )}
        </div>
      </div>

      {/* Key Deal Details */}
      <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2">
        <h4 className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
          <Briefcase className="size-3.5 text-[#20C466]" />
          Deal Metrics & Timing
        </h4>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-400 block">Win Probability:</span>
            <span className="font-semibold text-slate-800">{deal.probability ?? 50}%</span>
          </div>
          <div>
            <span className="text-slate-400 block">Expected Closing:</span>
            <span className="font-semibold text-slate-800">
              {formatDate(deal.expectedClosing)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Assigned Owner:</span>
            <span className="font-semibold text-slate-800">
              {personName(deal.assignedTo)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Created Date:</span>
            <span className="font-semibold text-slate-800">
              {formatDate(deal.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Linked Lead Details */}
      {deal.lead && (
        <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2">
          <h4 className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
            <User className="size-3.5 text-[#20C466]" />
            Linked Lead Profile
          </h4>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block">Lead Name:</span>
              <span className="font-semibold text-slate-800">{personName(deal.lead)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Phone:</span>
              <span className="font-semibold text-slate-800">
                {deal.lead.phone || deal.lead.mobileNumber || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Email:</span>
              <span className="font-semibold text-slate-800 truncate block">
                {deal.lead.email || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Lead Source:</span>
              <span className="font-semibold text-slate-800">{deal.lead.source || '—'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Notes / Description */}
      {(deal.notes || deal.description) && (
        <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
          <h4 className="font-semibold text-slate-800 text-xs">Deal Notes & Background</h4>
          <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            {deal.notes || deal.description}
          </p>
        </div>
      )}
    </div>
  );
}
