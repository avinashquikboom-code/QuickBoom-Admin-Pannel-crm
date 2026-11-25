'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageTitleCard } from '@/components/common/PageTitleCard';
import {
  Users,
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
  LeadAvatar,
  LeadPhotos,
} from '@/modules/crm/ManualLeadDrawer';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Button } from '@/components/common/Button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  AdminBulkActions,
  AdminBulkSelectionToolbar,
  AdminSelectCheckbox,
} from '@/components/admin/bulk-selection';
import { toast } from '@/hooks/use-toast';
import { GlobalExport } from '@/components/export/GlobalExport';
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
import { BulkImportLeadsDrawer } from '@/modules/crm/components/BulkImportLeadsDrawer';
import { QuickAssignModal } from '@/modules/crm/components/QuickAssignModal';
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
import { HotDealIndicator } from '@/modules/crm/HotDealIndicator';

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
    status: query.stageId ? undefined : query.status || undefined,
    stageId: query.stageId || undefined,
    employeeIds: query.employeeIds || undefined,
    departmentId: query.departmentId || undefined,
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
    'Category',
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
      row.category || '',
      row.companyName || '',
      row.phone || '',
      row.email || '',
      row.source || '',
      row.priority || '',
      personName(row.assignedTo || row.employee),
      row.status || '',
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
  const normStatus = String(status || '').toUpperCase();
  const match =
    stages.find(
      (s) =>
        String(s.id) === String(stage?.id) ||
        String(s.key || '').toUpperCase() === normStatus ||
        s.name === stage?.name ||
        s.name?.toUpperCase() === normStatus
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

/**
 * Clickable brand social media icons with tooltips
 */
function SocialMediaIcons({ lead }) {
  const social =
    lead?.socialMedia && typeof lead.socialMedia === 'object' && !Array.isArray(lead.socialMedia)
      ? Object.fromEntries(
          Object.entries(lead.socialMedia).map(([k, v]) => [k.trim().toLowerCase(), v])
        )
      : {};

  const platforms = [
    {
      key: 'instagram',
      label: 'Instagram',
      icon: faInstagram,
      color: '#E1306C',
      bg: '#FDF2F8',
      val: social.instagram,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      icon: faFacebook,
      color: '#1877F2',
      bg: '#EFF6FF',
      val: social.facebook,
    },
    {
      key: 'youtube',
      label: 'YouTube',
      icon: faYoutube,
      color: '#FF0000',
      bg: '#FEF2F2',
      val: social.youtube,
    },
    {
      key: 'pinterest',
      label: 'Pinterest',
      icon: faPinterest,
      color: '#E60023',
      bg: '#FEF2F2',
      val: social.pinterest,
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      icon: faLinkedin,
      color: '#0A66C2',
      bg: '#F0F9FF',
      val: social.linkedin,
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: faWhatsapp,
      color: '#25D366',
      bg: '#F0FDF4',
      val:
        social.whatsapp ||
        social.whatsappurl ||
        (lead?.whatsapp && lead.whatsapp !== lead.phone
          ? `https://wa.me/${String(lead.whatsapp).replace(/\D/g, '')}`
          : null),
    },
    {
      key: 'twitter',
      label: 'Twitter / X',
      icon: faXTwitter,
      color: '#111111',
      bg: '#F8FAFC',
      val: social.twitter || social.x || social.twitter_x,
    },
    {
      key: 'tiktok',
      label: 'TikTok',
      icon: faTiktok,
      color: '#000000',
      bg: '#F8FAFC',
      val: social.tiktok,
    },
    {
      key: 'website',
      label: 'Website',
      icon: faGlobe,
      color: '#163A2E',
      bg: '#ECFDF5',
      val: lead?.website,
    },
  ];

  const links = platforms.flatMap((p) => {
    const raw = p.val;
    if (!raw) return [];
    let href = String(raw).trim();
    if (!/^https?:\/\//i.test(href)) {
      if (p.key === 'whatsapp' && /^\d+$/.test(href.replace(/\D/g, ''))) {
        href = `https://wa.me/${href.replace(/\D/g, '')}`;
      } else if (/^[\w.-]+\.[a-z]{2,}/i.test(href)) {
        href = `https://${href}`;
      } else {
        return [];
      }
    }
    return [{ ...p, href }];
  });

  if (links.length === 0) {
    return <span className="text-slate-300 text-xs">—</span>;
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {links.map((link) => (
        <a
          key={link.key}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          title={`${link.label}: ${link.href}`}
          aria-label={`${link.label}: ${link.href}`}
          className="size-6 rounded-md flex items-center justify-center transition-transform hover:scale-110 shadow-2xs border border-slate-200/60"
          style={{ color: link.color, backgroundColor: link.bg }}
        >
          <FontAwesomeIcon icon={link.icon} className="size-3" />
        </a>
      ))}
    </div>
  );
}

export default function LeadsRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [canDelete, setCanDelete] = React.useState(false);
  const [sources, setSources] = React.useState([]);
  const [employees, setEmployees] = React.useState([]);
  const [filterEmployees, setFilterEmployees] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [stages, setStages] = React.useState([]);
  const [stageError, setStageError] = React.useState('');
  const [importOpen, setImportOpen] = React.useState(false);
  const [quickAssignOpen, setQuickAssignOpen] = React.useState(false);
  const [quickAssignLeads, setQuickAssignLeads] = React.useState([]);
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
    employeeIds: '',
    departmentId: '',
    stageId: '',
    from: '',
    to: '',
    page: 1,
    limit: 20,
  });

  // Debounced search text
  const [searchTerm, setSearchTerm] = React.useState('');
  const [employeeSearch, setEmployeeSearch] = React.useState('');
  const requestSequence = React.useRef(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((prev) => {
        if (prev.search === searchTerm) return prev;
        return { ...prev, search: searchTerm, page: 1 };
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sorting
  const [sortKey, setSortKey] = React.useState('createdAt');
  const [sortDir, setSortDir] = React.useState('desc');

  // Selection
  const [selectedIds, setSelectedIds] = React.useState([]);

  React.useEffect(() => { setSelectedIds([]); }, [query.search, query.status, query.stageId, query.employeeIds, query.departmentId, query.priority, query.source, query.from, query.to]);

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
    (async () => { const all = []; for (let page = 1; page <= 100; page++) { const batch = await loadEmployees({ page, limit: 100 }); all.push(...batch); if (batch.length < 100) break; } setFilterEmployees(all.sort((a, b) => Number(/sales/i.test(b.department)) - Number(/sales/i.test(a.department)) || a.name.localeCompare(b.name))); })().catch(() => toast.error('Could not load employees.'));
    loadDepartments().then(setDepartments).catch(() => setDepartments([]));
    loadLeadStages().then(setStages).catch(() => { setStages([]); setStageError('Could not load pipeline stages. Refresh the page to retry.'); });

    // Check URL parameters for direct filters
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlStatus = searchParams.get('status');
      const urlSearch = searchParams.get('search');
      if (urlStatus || urlSearch) {
        if (urlSearch) setSearchTerm(urlSearch);
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
    const requestId = ++requestSequence.current;
    setLoading(true);
    setError('');
    try {
      const result = await loadLeads({
        page: query.page,
        limit: query.limit || 20,
        ...filtersFrom(query),
        includeCounts: true,
      });
      if (requestId !== requestSequence.current) return;
      if (!Array.isArray(result.pagination?.counts)) throw new Error('Pipeline counts are unavailable. Please retry.');
      setRows(result.rows || []);
      setPayload(result);
      setSources(result.sources || []);
      setError('');
    } catch (err) {
      if (requestId !== requestSequence.current) return;
      setError(crmError(err));
      setRows([]);
      setPayload({});
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, [query]);

  React.useEffect(() => {
    fetchLeads();
    return () => { requestSequence.current += 1; };
  }, [fetchLeads, reloadKey]);

  React.useEffect(() => {
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') setReloadKey((value) => value + 1); };
    window.addEventListener('focus', refreshWhenVisible);
    const timer = window.setInterval(refreshWhenVisible, 60000);
    return () => { window.removeEventListener('focus', refreshWhenVisible); window.clearInterval(timer); };
  }, []);

  // Combined source options
  const sourceOptions = React.useMemo(() => {
    const names = (sources || []).map((source) => source.name || source.code).filter(Boolean);
    return [...new Set([...SOURCE_OPTIONS, ...names])];
  }, [sources]);

  // Active stages from server
  const activeStages = React.useMemo(() => {
    return stages.filter((stage) => stage.isActive !== false);
  }, [stages]);

  // The list endpoint groups the full filtered database set, excluding only stage.
  const combinedStageCards = React.useMemo(() => {
    const counts = payload.pagination?.counts || [];
    return [...activeStages].sort((a, b) => Number(b.key === 'HOT_DEAL') - Number(a.key === 'HOT_DEAL')).map((stage) => {
      const canonical = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const aliases = [canonical(stage.key), canonical(stage.name)];
      const count = counts.filter((row) => Number(row.stageId) === Number(stage.id) || (row.stageId == null && aliases.includes(canonical(row.status)))).reduce((sum, row) => sum + Number(row.count || 0), 0);
      return { id: String(stage.id), key: stage.key, name: stage.name, color: stage.color || '#20C466', count };
    });
  }, [activeStages, payload.pagination]);

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
      } else if (sortKey === 'status') {
        valA = a.stage?.name || a.status || '';
        valB = b.stage?.name || b.status || '';
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
    setSearchTerm('');
    setQuery({
      search: '',
      status: '',
      priority: '',
      source: '',
      assignedToId: '',
      employeeIds: '',
      departmentId: '',
      stageId: '',
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
    query.employeeIds,
    query.departmentId,
    query.stageId,
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
  const totalLeadsCount = (payload.pagination?.counts || []).reduce((sum, item) => sum + Number(item.count || 0), 0);

  return (
    <div className="space-y-5 pb-28 w-full min-w-0">
      {/* 1. Page Title Card */}
      <PageTitleCard
        moduleName="CRM"
        breadcrumb="Leads"
        title="Leads"
        description="Create leads manually and manage existing CRM leads individually or in bulk."
        icon={Users}
        badge={loading ? 'Loading…' : error ? 'Counts unavailable' : `${totalLeadsCount} Total`}
        badgeVariant="green"
        actions={
          <>
            <Link
              href="/admin/crm/proposals"
              className="inline-flex items-center gap-1.5 h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#173D30] transition-colors shadow-2xs"
            >
              <FileText className="size-3.5 text-slate-500" />
              <span>View Proposals</span>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(true)}
              className="h-10 gap-1.5 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#173D30] shadow-2xs"
            >
              <Upload className="size-3.5 text-slate-500" />
              <span>Import CSV</span>
            </Button>

            <GlobalExport
              module="leads"
              title="CRM Leads Report"
              filters={filtersFrom(query)}
              selectedIds={selectedIds}
              currentPageRows={rows}
              page={query.page || 1}
              limit={query.limit || 20}
              supportsZip
            />

            {allowed && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingId(null);
                  setForm({ ...blank });
                  setFormOpen(true);
                }}
                className="h-10 gap-1.5 rounded-xl bg-[#173D30] hover:bg-[#123026] text-white text-xs font-semibold shadow-xs"
              >
                <Plus className="size-4 text-[#20C466]" />
                <span>Create Lead</span>
              </Button>
            )}
          </>
        }
      />

      {/* 2. Interactive Stage KPI Statistics Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Layers className="size-3.5 text-[#20C466]" />
            Pipeline Stages Overview
          </span>
          {(query.status || query.stageId) && (
            <button
              type="button"
              onClick={() => setQuery((p) => ({ ...p, status: '', stageId: '', page: 1 }))}
              className="text-[11px] font-semibold text-[#173D30] hover:underline flex items-center gap-1"
            >
              <RotateCcw className="size-3" />
              Show all stages
            </button>
          )}
        </div>

        {stageError && <p role="alert" className="text-xs text-red-700">{stageError}</p>}
        {error && <p role="alert" className="text-xs text-red-700">Pipeline counts unavailable: {error}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2.5">
          {/* Total Leads Card */}
          <button
            type="button"
            onClick={() => setQuery((p) => ({ ...p, status: '', stageId: '', page: 1 }))}
            className={cn(
              'flex flex-col text-left p-3 rounded-xl border transition-all shadow-2xs',
              !query.status && !query.stageId
                ? 'bg-emerald-50/70 border-[#20C466] ring-2 ring-[#20C466]/30 shadow-xs'
                : 'bg-white border-slate-200/90 hover:border-emerald-300'
            )}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-semibold text-slate-600 truncate">Total Leads</span>
              <span className="size-2 rounded-full bg-[#20C466]" />
            </div>
            <span className="text-xl font-bold text-[#173D30] tracking-tight">
              {loading ? '…' : error ? '—' : totalLeadsCount}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Across all stages</span>
          </button>

          {/* Dynamic 12 Lead Stages Cards + Extras */}
          {combinedStageCards.map((card) => {
            const isSelected = query.stageId === card.id || (!query.stageId && query.status === card.key);

            return (
              <button
                key={card.name}
                type="button"
                onClick={() => {
                  setQuery((prev) => ({
                    ...prev,
                    status: '',
                    stageId: isSelected ? '' : card.id,
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
                  style={{ backgroundColor: card.color }}
                />
                <div className="flex items-center justify-between gap-1 mb-1 mt-0.5">
                  <span
                    className="text-[11px] font-semibold text-slate-700 truncate"
                    title={card.name}
                  >
                    {card.key === 'HOT_DEAL' ? <HotDealIndicator lead={{ stage: { key: card.key } }} /> : card.name}
                  </span>
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: card.color }}
                  />
                </div>
                <span className="text-xl font-bold text-slate-900 tracking-tight">
                  {loading ? '…' : error ? '—' : card.count}
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
          {/* Debounced Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads by name, company, email, phone..."
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
              value={query.stageId || combinedStageCards.find((stage) => stage.key === query.status)?.id || ''}
              onChange={(e) => setQuery({ ...query, status: '', stageId: e.target.value, page: 1 })}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            >
              <option value="">All stages</option>
              {combinedStageCards.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
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

          <details className="relative">
            <summary className="h-9 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">{query.employeeIds ? `${query.employeeIds.split(',').length} selected` : 'All employees'}</summary>
            <div className="absolute right-0 z-30 mt-1 w-72 max-w-[85vw] rounded-xl border bg-white p-2 shadow-lg">
              <Input aria-label="Search employees" placeholder="Search name, code or department" value={employeeSearch} onChange={(e) => setEmployeeSearch(e.target.value)} className="h-9 text-xs" />
              <div className="max-h-56 overflow-y-auto py-1 text-xs">
                <button type="button" className="w-full rounded px-2 py-2 text-left hover:bg-emerald-50" onClick={() => setQuery((prev) => ({ ...prev, employeeIds: '', page: 1 }))}>All Employees</button>
                {[{ recordId: 'unassigned', name: 'Unassigned Leads' }, ...filterEmployees.filter((employee) => [employee.name, employee.employeeCode, employee.department].some((value) => String(value || '').toLowerCase().includes(employeeSearch.toLowerCase())))].map((employee) => {
                  const id = String(employee.recordId); const selected = query.employeeIds.split(',').filter(Boolean);
                  return <label key={id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-emerald-50"><input type="checkbox" checked={selected.includes(id)} onChange={() => setQuery((prev) => { const current = prev.employeeIds.split(',').filter(Boolean); return { ...prev, employeeIds: (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]).join(','), page: 1 }; })} /><span>{employee.name}{employee.employeeCode ? ` · ${employee.employeeCode}` : ''}{employee.department ? ` · ${employee.department}` : ''}</span></label>;
                })}
              </div>
            </div>
          </details>
          <select aria-label="Filter by department" value={query.departmentId} onChange={(e) => setQuery({ ...query, departmentId: e.target.value, page: 1 })} className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs"><option value="">All departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>
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
            {(query.status || query.stageId) && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                Stage: {query.stageId ? stages.find((stage) => String(stage.id) === query.stageId)?.name : stageLabel(query.status, stages)}
                <button
                  onClick={() => setQuery({ ...query, status: '', stageId: '', page: 1 })}
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
            {query.employeeIds && <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-purple-800">Assigned: {query.employeeIds.split(',').map((id) => id === 'unassigned' ? 'Unassigned' : filterEmployees.find((e) => String(e.recordId) === id)?.name || id).join(', ')} <button type="button" aria-label="Clear employee filter" onClick={() => setQuery({ ...query, employeeIds: '', page: 1 })}><X className="size-3" /></button></span>}
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
          onOpenQuickAssign={(leadsToAssign) => {
            setQuickAssignLeads(leadsToAssign);
            setQuickAssignOpen(true);
          }}
        />
      )}

      {/* 5. Main Leads Table (13 Columns Redesign) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="w-full overflow-x-auto min-w-0">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 min-w-[170px]">Lead</th>
                  <th className="py-3 px-3 min-w-[110px]">Category</th>
                  <th className="py-3 px-3 min-w-[130px]">Company</th>
                  <th className="py-3 px-3 min-w-[130px]">Social Media</th>
                  <th className="py-3 px-3 min-w-[120px]">Phone</th>
                  <th className="py-3 px-3 min-w-[140px]">Email</th>
                  <th className="py-3 px-3 min-w-[100px]">Source</th>
                  <th className="py-3 px-3 min-w-[90px]">Priority</th>
                  <th className="py-3 px-3 min-w-[130px]">Assigned Employee</th>
                  <th className="py-3 px-3 min-w-[100px]">Created Date</th>
                  <th className="py-3 px-3 min-w-[120px]">Stage</th>
                  <th className="py-3 px-3 text-right min-w-[110px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-3 text-center">
                      <div className="size-4 bg-slate-200 rounded mx-auto" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-slate-200" />
                        <div className="space-y-1">
                          <div className="h-3 w-24 bg-slate-200 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-3 w-16 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-3 w-20 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex gap-1">
                        <div className="size-5 rounded bg-slate-200" />
                        <div className="size-5 rounded bg-slate-200" />
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-3 w-20 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-3 w-24 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-4 w-14 bg-slate-200 rounded-md" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-4 w-12 bg-slate-200 rounded-full" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-3 w-20 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-3 w-16 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-4 w-16 bg-slate-200 rounded-full" />
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="h-4 w-12 bg-slate-200 rounded ml-auto" />
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
                Create Lead
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="w-full overflow-x-auto min-w-0">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 select-none">
                  {/* Column 1: Checkbox */}
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="size-4 rounded border-slate-300 text-[#173D30] focus:ring-[#20C466]"
                      aria-label="Select all on this page"
                    />
                  </th>

                  {/* Column 2: Lead */}
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[170px]"
                    onClick={() => handleSort('name')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Lead</span>
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

                  {/* Column 3: Category */}
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[110px]"
                    onClick={() => handleSort('category')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Category</span>
                      {sortKey === 'category' ? (
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

                  {/* Column 4: Company */}
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[130px]"
                    onClick={() => handleSort('companyName')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Company</span>
                      {sortKey === 'companyName' ? (
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

                  {/* Column 5: Social Media */}
                  <th className="py-3 px-3 min-w-[130px]">Social Media</th>

                  {/* Column 6: Phone */}
                  <th className="py-3 px-3 min-w-[120px]">Phone</th>

                  {/* Column 7: Email */}
                  <th className="py-3 px-3 min-w-[140px]">Email</th>

                  {/* Column 8: Source */}
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[100px]"
                    onClick={() => handleSort('source')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Source</span>
                      {sortKey === 'source' ? (
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

                  {/* Column 9: Priority */}
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[95px]"
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

                  {/* Column 10: Assigned Employee */}
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[130px]"
                    onClick={() => handleSort('assigned')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Assigned Employee</span>
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

                  {/* Column 11: Created Date */}
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

                  {/* Column 12: Stage */}
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[120px]"
                    onClick={() => handleSort('status')}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Stage</span>
                      {sortKey === 'status' ? (
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

                  {/* Column 13: Actions */}
                  <th className="py-3 px-3 text-right min-w-[110px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRows.map((row) => {
                  const isRowSelected = selectedIds.includes(row.id);
                  const assignedName = personName(row.assignedTo || row.employee);
                  const assignedInitial = (assignedName || 'U')[0]?.toUpperCase();

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'transition-colors hover:bg-slate-50/80 group',
                        isRowSelected && 'bg-emerald-50/30'
                      )}
                    >
                      {/* 1. Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => toggleSelectRow(row.id)}
                          className="size-4 rounded border-slate-300 text-[#173D30] focus:ring-[#20C466]"
                          aria-label={`Select ${personName(row)}`}
                        />
                      </td>

                      {/* 2. Lead (Avatar + Name) */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <LeadAvatar lead={row} />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setSelectedLead(row)}
                              className="font-bold text-slate-900 hover:text-[#173D30] hover:underline text-xs text-left truncate block max-w-[160px]"
                              title={personName(row)}
                            >
                              {personName(row)}
                            </button>
                            <HotDealIndicator lead={row} />
                            {row.title ? (
                              <span className="text-[10px] text-slate-400 truncate block">
                                {row.title}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* 3. Category */}
                      <td className="py-3 px-3">
                        {row.category ? (
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 truncate max-w-[110px]" title={row.category}>
                            {row.category}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* 4. Company */}
                      <td className="py-3 px-3">
                        {row.companyName ? (
                          <span
                            className="font-medium text-slate-800 text-xs truncate max-w-[130px] block"
                            title={row.companyName}
                          >
                            {row.companyName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">—</span>
                        )}
                      </td>

                      {/* 5. Social Media (Clickable Brand Icons) */}
                      <td className="py-3 px-3">
                        <SocialMediaIcons lead={row} />
                      </td>

                      {/* 6. Phone */}
                      <td className="py-3 px-3">
                        {row.phone ? (
                          <a
                            href={`tel:${row.phone}`}
                            className="inline-flex items-center gap-1.5 font-medium text-slate-800 hover:text-[#20C466] transition-colors whitespace-nowrap"
                            title={`Call ${row.phone}`}
                          >
                            <Phone className="size-3 text-slate-400 shrink-0" />
                            <span>{row.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* 7. Email */}
                      <td className="py-3 px-3">
                        {row.email ? (
                          <a
                            href={`mailto:${row.email}`}
                            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#20C466] transition-colors truncate max-w-[140px]"
                            title={`Email ${row.email}`}
                          >
                            <Mail className="size-3 text-slate-400 shrink-0" />
                            <span className="truncate">{row.email}</span>
                          </a>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* 8. Source */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 whitespace-nowrap">
                          {/google/i.test(row.source || '') ? 'Google Maps' : row.source || '—'}
                        </span>
                      </td>

                      {/* 9. Priority */}
                      <td className="py-3 px-3">
                        <PriorityBadge priority={row.priority} />
                      </td>

                      {/* 10. Assigned Employee */}
                      <td className="py-3 px-3">
                        <div
                          className={cn(
                            'flex items-center gap-2 group/assign',
                            allowed && 'cursor-pointer'
                          )}
                          onClick={() => {
                            if (allowed) {
                              setQuickAssignLeads([row]);
                              setQuickAssignOpen(true);
                            }
                          }}
                          title={allowed ? 'Click to assign or reassign sales representative' : undefined}
                        >
                          {row.assignedTo || row.employee ? (
                            <>
                              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-[#173D30] border border-emerald-200 shrink-0">
                                {assignedInitial}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-800 text-xs hover:text-[#16A34A] transition-colors" title={assignedName}>
                                  {assignedName}
                                </p>
                                <p className="text-[10px] font-mono text-slate-400 truncate">
                                  {row.employee?.employeeCode || row.assignedTo?.employeeCode || row.assignedTeam || ''}
                                </p>
                              </div>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-emerald-50 hover:text-emerald-800 transition-colors">
                              <User className="size-3 text-slate-400" />
                              <span>Unassigned</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 11. Created Date */}
                      <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {row.createdAt ? String(row.createdAt).slice(0, 10) : '—'}
                      </td>

                      {/* 12. Stage */}
                      <td className="py-3 px-3">
                        <StageBadge
                          stage={row.stage}
                          status={row.status}
                          stages={stages}
                        />
                      </td>

                      {/* 13. Actions */}
                      <td className="py-3 px-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger aria-label="Lead actions" className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-600">
                            <MoreVertical className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-60 rounded-xl border border-[#E2E8E5] bg-white p-2 shadow-xl">
                            <div className="px-2.5 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Lead actions</div>
                            <DropdownMenuItem className="gap-3 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 focus:bg-emerald-50 focus:text-[#123D32]" onClick={() => setSelectedLead(row)}>
                              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-[#107569]"><Eye className="size-4" /></span> View lead
                            </DropdownMenuItem>
                            {allowed && <DropdownMenuItem className="gap-3 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 focus:bg-emerald-50 focus:text-[#123D32]" onClick={() => { setQuickAssignLeads([row]); setQuickAssignOpen(true); }}>
                              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-[#107569]"><UserCheck className="size-4" /></span> Assign representative
                            </DropdownMenuItem>}
                            {allowed && <DropdownMenuItem className="gap-3 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 focus:bg-emerald-50 focus:text-[#123D32]" onClick={() => handleEditLead(row)}>
                              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-[#107569]"><Edit className="size-4" /></span> Edit lead
                            </DropdownMenuItem>}
                            {canDelete && <div className="my-1 border-t border-slate-100" />}
                            {canDelete && <DropdownMenuItem variant="destructive" className="gap-3 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-600 focus:bg-rose-50" onClick={() => setConfirmState({ type: 'delete', lead: row })}>
                              <span className="flex size-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><Trash2 className="size-4" /></span> Delete lead
                            </DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
            leads
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

      {/* Lead Create / Edit Drawer */}
      <FormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingId ? 'Edit Lead' : 'Create Lead'}
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

      {/* Bulk Import Leads Drawer (Redesigned 4-Step Wizard) */}
      <BulkImportLeadsDrawer
        open={importOpen}
        onOpenChange={setImportOpen}
        employees={employees}
        departments={departments}
        onImported={() => {
          setSelectedIds([]);
          setReloadKey((v) => v + 1);
        }}
      />

      {/* Quick Assign / Reassign Sales Representative Modal */}
      <QuickAssignModal
        open={quickAssignOpen}
        onOpenChange={setQuickAssignOpen}
        leads={quickAssignLeads}
        employees={employees}
        departments={departments}
        onAssigned={() => {
          setSelectedIds([]);
          setReloadKey((v) => v + 1);
        }}
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
  onOpenQuickAssign,
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

          {/* Assign Sales Representative Modal Action */}
          <Button
            size="sm"
            onClick={async () => {
              const ids = selectAllMatching ? await matchingIds(query) : selectedIds;
              const selectedObjects = ids.map((id) => {
                const found = (selectedRows || []).find((r) => r.id === id);
                return found || { id };
              });
              onOpenQuickAssign?.(selectedObjects);
            }}
            className="h-8 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold shadow-2xs gap-1.5"
          >
            <UserCheck className="size-3.5" />
            <span>Assign / Distribute</span>
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
        <SocialMediaIcons lead={lead} />
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


