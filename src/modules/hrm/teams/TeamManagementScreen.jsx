'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/common/Badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import {
  faPeopleGroup,
  faUsers,
  faUserTie,
  faUserPlus,
  faUserCheck,
  faArrowRightArrowLeft,
  faPlus,
  faDownload,
  faRotate,
  faSearch,
  faFilter,
  faCheckCircle,
  faBan,
  faClock,
  faEye,
  faPenToSquare,
  faTrashCan,
  faPowerOff,
  faChevronLeft,
  faChevronRight,
  faXmark,
  faSliders,
  faBoxArchive,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from '@/hooks/use-toast';
import {
  loadTeams,
  loadTeamStats,
  getTeam,
  saveTeam,
  setTeamStatus,
  removeTeam,
  addTeamMember,
  removeTeamMember,
  transferTeamMember,
  loadEmployees,
  sessionCan,
  hrmError,
} from '@/modules/hrm/hrm-api';

const DEFAULT_COLUMNS = {
  checkbox: true,
  name: true,
  code: true,
  lead: true,
  members: true,
  capacity: true,
  status: true,
  createdAt: true,
  actions: true,
};

const initialFormData = {
  name: '',
  code: '',
  description: '',
  leaderId: '',
  capacity: 10,
  memberIds: [],
  isActive: true,
};

function formatDate(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    return isNaN(d.getTime())
      ? '—'
      : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function getInitials(name = '') {
  const parts = String(name).trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'TM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TeamManagementScreen() {
  const [canManage, setCanManage] = React.useState(true);

  // Statistics
  const [stats, setStats] = React.useState({ total: 0, active: 0, inactive: 0, totalMembers: 0, lastUpdated: null });
  const [statsLoading, setStatsLoading] = React.useState(true);

  // Filters
  const [activeTab, setActiveTab] = React.useState('ALL'); // ALL | ACTIVE | INACTIVE | ARCHIVED
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [leadFilter, setLeadFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState('ALL');

  // Listing & Pagination
  const [teams, setTeams] = React.useState([]);
  const [allTeamsList, setAllTeamsList] = React.useState([]); // used for member transfer targets
  const [employees, setEmployees] = React.useState([]);
  const [pagination, setPagination] = React.useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [loading, setLoading] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Selection
  const [selectedIds, setSelectedIds] = React.useState(new Set());

  // Columns visibility
  const [columns, setColumns] = React.useState(DEFAULT_COLUMNS);
  const [showColPicker, setShowColPicker] = React.useState(false);

  // Add / Edit Modal state
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTeam, setEditingTeam] = React.useState(null);
  const [form, setForm] = React.useState(initialFormData);
  const [memberSearch, setMemberSearch] = React.useState('');
  const [formBusy, setFormBusy] = React.useState(false);

  // Details / Member Management Modal
  const [viewTeam, setViewTeam] = React.useState(null);
  const [viewLoading, setViewLoading] = React.useState(false);
  const [selectedNewMemberId, setSelectedNewMemberId] = React.useState('');
  const [transferringMember, setTransferringMember] = React.useState(null);
  const [transferTargetPodId, setTransferTargetPodId] = React.useState('');
  const [memberActionBusy, setMemberActionBusy] = React.useState(false);

  // Delete Confirmation
  const [deletingTeam, setDeletingTeam] = React.useState(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  // Check permissions & load employees on mount
  React.useEffect(() => {
    try {
      const allowed = sessionCan('HRM') || sessionCan('EMPLOYEES') || sessionCan('SETTINGS');
      setCanManage(allowed !== false);
    } catch {
      setCanManage(true);
    }

    loadEmployees({ limit: 200 })
      .then((rows) => setEmployees(Array.isArray(rows) ? rows : []))
      .catch((err) => console.warn('Could not preload employees:', err));
  }, []);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Tab change handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'ALL') setStatusFilter('ALL');
    else if (tab === 'ACTIVE') setStatusFilter('ACTIVE');
    else if (tab === 'INACTIVE' || tab === 'ARCHIVED') setStatusFilter('INACTIVE');
    setPage(1);
  };

  // Fetch Stats
  const fetchStats = React.useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await loadTeamStats();
      if (res && typeof res.total === 'number') {
        setStats({
          total: res.total || 0,
          active: res.active || 0,
          inactive: res.inactive || 0,
          totalMembers: res.totalMembers || 0,
          lastUpdated: res.lastUpdated || null,
        });
      }
    } catch (err) {
      console.warn('Failed to load team stats from endpoint', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Teams
  const fetchTeams = React.useCallback(async () => {
    setLoading(true);
    try {
      const query = {
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      };

      const res = await loadTeams(query);
      const items = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

      // Optional client-side lead filter if selected
      const filtered = leadFilter !== 'ALL'
        ? items.filter((t) => String(t.leaderId) === String(leadFilter))
        : items;

      setTeams(filtered);
      setAllTeamsList((prev) => (items.length > prev.length ? items : prev.length ? prev : items));

      const pag = res.pagination || {
        page,
        limit,
        total: res.total || items.length,
        totalPages: res.totalPages || Math.max(1, Math.ceil((res.total || items.length) / limit)),
      };

      setPagination({
        page: pag.page || page,
        limit: pag.limit || limit,
        total: pag.total || filtered.length,
        totalPages: pag.totalPages || Math.max(1, Math.ceil(filtered.length / limit)),
      });

      // Fallback stats computation if needed
      setStats((prev) => {
        if (prev.total === 0 && items.length > 0) {
          const activeCount = items.filter((t) => t.isActive).length;
          const memberTotal = items.reduce((sum, t) => sum + (t.memberCount || 0), 0);
          return {
            total: items.length,
            active: activeCount,
            inactive: items.length - activeCount,
            totalMembers: memberTotal,
            lastUpdated: items[0]?.updatedAt || items[0]?.createdAt || null,
          };
        }
        return prev;
      });
    } catch (err) {
      toast.error(hrmError(err) || 'Failed to load team pods.');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, leadFilter]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  React.useEffect(() => {
    fetchTeams();
  }, [fetchTeams, refreshKey]);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(teams.map((t) => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Toggle active/inactive status
  const handleToggleStatus = async (team) => {
    if (!canManage) {
      toast.error('You do not have permission to modify team pods.');
      return;
    }
    const nextState = !team.isActive;
    try {
      await setTeamStatus(team.id, nextState);
      toast.success(`Team Pod "${team.name}" ${nextState ? 'activated' : 'deactivated'} successfully.`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(hrmError(err) || 'Failed to update team status.');
    }
  };

  // Delete team confirm
  const handleDeleteConfirm = async () => {
    if (!deletingTeam) return;
    setDeleteBusy(true);
    try {
      await removeTeam(deletingTeam.id, true);
      toast.success(`Team Pod "${deletingTeam.name}" deleted successfully.`);
      setDeletingTeam(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deletingTeam.id);
        return next;
      });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(hrmError(err) || 'Failed to delete team pod. Make sure all members are unassigned first.');
    } finally {
      setDeleteBusy(false);
    }
  };

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingTeam(null);
    setForm(initialFormData);
    setMemberSearch('');
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (team) => {
    setEditingTeam(team);
    const existingMemberIds = Array.isArray(team.members)
      ? team.members.map((m) => m.employeeId || m.employee?.id || m.id).filter(Boolean)
      : [];

    setForm({
      name: team.name || '',
      code: team.code || `POD-${String(team.id).padStart(3, '0')}`,
      description: team.cleanDescription || team.description || '',
      leaderId: team.leaderId || team.leader?.id || '',
      capacity: team.capacity ? Number(team.capacity) : 10,
      memberIds: existingMemberIds,
      isActive: team.isActive !== false,
    });
    setMemberSearch('');
    setIsFormOpen(true);
  };

  // Open View Details / Member Management Modal
  const handleOpenView = async (team) => {
    setViewTeam(team);
    setViewLoading(true);
    setSelectedNewMemberId('');
    setTransferringMember(null);
    try {
      const detailed = await getTeam(team.id);
      if (detailed) setViewTeam(detailed);
    } catch (err) {
      console.warn('Could not load detailed team record:', err);
    } finally {
      setViewLoading(false);
    }
  };

  // Save Add/Edit form
  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Team Pod Name is required.');
      return;
    }
    if (!form.code.trim()) {
      toast.error('Pod Code is required.');
      return;
    }

    const cap = Number(form.capacity) || 10;
    if (form.memberIds.length > cap) {
      toast.error(`Assigned members (${form.memberIds.length}) exceed maximum capacity (${cap}).`);
      return;
    }

    setFormBusy(true);
    try {
      await saveTeam(
        {
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          capacity: cap,
          description: form.description?.trim(),
          leaderId: form.leaderId ? Number(form.leaderId) : null,
          memberIds: form.memberIds.map(Number),
          isActive: Boolean(form.isActive),
        },
        editingTeam?.id,
      );

      toast.success(editingTeam ? 'Team Pod updated successfully.' : 'Team Pod created successfully.');
      setIsFormOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(hrmError(err) || 'Failed to save team pod.');
    } finally {
      setFormBusy(false);
    }
  };

  // Toggle member selection in Add/Edit form
  const handleToggleMember = (empId) => {
    const idNum = Number(empId);
    setForm((prev) => {
      const exists = prev.memberIds.includes(idNum);
      const cap = Number(prev.capacity) || 10;
      if (!exists && prev.memberIds.length >= cap) {
        toast.error(`Cannot select more than ${cap} members. Increase capacity first.`);
        return prev;
      }
      const updated = exists
        ? prev.memberIds.filter((id) => id !== idNum)
        : [...prev.memberIds, idNum];
      return { ...prev, memberIds: updated };
    });
  };

  // Member management actions inside Details Modal
  const handleAddMemberToCurrentPod = async () => {
    if (!viewTeam || !selectedNewMemberId) return;
    const currentCount = viewTeam.members?.length || 0;
    const maxCap = viewTeam.capacity || 10;
    if (currentCount >= maxCap) {
      toast.error(`Cannot add member. Pod has reached maximum capacity of ${maxCap}.`);
      return;
    }

    setMemberActionBusy(true);
    try {
      await addTeamMember(viewTeam.id, { employeeId: Number(selectedNewMemberId), role: 'MEMBER' });
      toast.success('Member added to team pod successfully.');
      setSelectedNewMemberId('');
      // Reload view team
      const updated = await getTeam(viewTeam.id);
      if (updated) setViewTeam(updated);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(hrmError(err) || 'Failed to add member.');
    } finally {
      setMemberActionBusy(false);
    }
  };

  const handleRemoveMemberFromCurrentPod = async (employeeId, employeeName) => {
    if (!viewTeam) return;
    setMemberActionBusy(true);
    try {
      await removeTeamMember(viewTeam.id, employeeId);
      toast.success(`Removed ${employeeName || 'member'} from pod.`);
      const updated = await getTeam(viewTeam.id);
      if (updated) setViewTeam(updated);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(hrmError(err) || 'Failed to remove member.');
    } finally {
      setMemberActionBusy(false);
    }
  };

  const handleExecuteTransfer = async () => {
    if (!viewTeam || !transferringMember || !transferTargetPodId) return;
    setMemberActionBusy(true);
    try {
      await transferTeamMember(viewTeam.id, transferTargetPodId, transferringMember.id);
      toast.success(`Transferred ${transferringMember.name} to new team pod.`);
      setTransferringMember(null);
      setTransferTargetPodId('');
      const updated = await getTeam(viewTeam.id);
      if (updated) setViewTeam(updated);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(hrmError(err) || 'Failed to transfer member.');
    } finally {
      setMemberActionBusy(false);
    }
  };

  const handleMakeLead = async (employeeId, employeeName) => {
    if (!viewTeam) return;
    setMemberActionBusy(true);
    try {
      await saveTeam({ leaderId: Number(employeeId) }, viewTeam.id);
      toast.success(`${employeeName} is now the Team Lead.`);
      const updated = await getTeam(viewTeam.id);
      if (updated) setViewTeam(updated);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(hrmError(err) || 'Failed to change team lead.');
    } finally {
      setMemberActionBusy(false);
    }
  };

  // Export CSV
  const handleExportCsv = (selectedOnly = false) => {
    const listToExport = selectedOnly
      ? teams.filter((t) => selectedIds.has(t.id))
      : teams;

    if (!listToExport.length) {
      toast.error('No team pods available to export.');
      return;
    }

    const headers = [
      'Pod ID',
      'Team Pod Name',
      'Code',
      'Team Lead',
      'Member Count',
      'Capacity',
      'Capacity %',
      'Status',
      'Created At',
      'Description',
    ];

    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = listToExport.map((t) => {
      const cap = t.capacity || 10;
      const mem = t.memberCount || 0;
      const pct = cap > 0 ? Math.min(100, Math.round((mem / cap) * 100)) : 0;
      return [
        t.id,
        t.name || 'Untitled',
        t.code || `POD-${t.id}`,
        t.head || 'Unassigned',
        mem,
        cap,
        `${pct}%`,
        t.isActive ? 'Active' : 'Inactive',
        formatDate(t.createdAt),
        t.description || '',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\ufeff' +
      [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `team_pods_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${listToExport.length} team pod(s) to CSV.`);
  };

  // Unique list of team leads for filter dropdown
  const uniqueLeads = React.useMemo(() => {
    const map = new Map();
    teams.forEach((t) => {
      if (t.leaderId && t.head && t.head !== 'Unassigned') {
        map.set(String(t.leaderId), t.head);
      }
    });
    return Array.from(map.entries());
  }, [teams]);

  // Filtered employees for Add/Edit member search
  const filteredEmployeesForForm = React.useMemo(() => {
    if (!memberSearch.trim()) return employees;
    const q = memberSearch.toLowerCase();
    return employees.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.id?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q),
    );
  }, [employees, memberSearch]);

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 pb-12">
      {/* ── Hero Section ────────────────────────────────────────────── */}
      <PageHeader
        category="WORKFORCE MANAGEMENT"
        title="Team Management"
        icon={faPeopleGroup}
        description="Organize teams, assign team leads, track pod capacity, and distribute workloads."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleExportCsv(false)}
              disabled={loading || !teams.length}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-medium text-sm rounded-xl"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2 text-xs" />
              Export CSV
            </Button>
            {canManage && (
              <Button
                type="button"
                onClick={handleOpenCreate}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white shadow-sm transition-all font-semibold text-sm rounded-xl"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2 text-xs" />
                Add Team Pod
              </Button>
            )}
          </div>
        }
      />

      {/* ── Statistics Cards Grid (4 KPI Cards) ────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Team Pods */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Team Pods
            </span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <FontAwesomeIcon icon={faPeopleGroup} className="text-sm" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {statsLoading ? '—' : stats.total}
            </span>
            <span className="text-xs text-slate-500 font-medium">configured pods</span>
          </div>
        </div>

        {/* Active Pods */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Pods
            </span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <FontAwesomeIcon icon={faCheckCircle} className="text-sm" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 tracking-tight">
              {statsLoading ? '—' : stats.active}
            </span>
            <span className="text-xs text-emerald-600 font-medium">operational</span>
          </div>
        </div>

        {/* Inactive / Pending Pods */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Inactive / Pending
            </span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <FontAwesomeIcon icon={faBan} className="text-sm" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-700 tracking-tight">
              {statsLoading ? '—' : stats.inactive}
            </span>
            <span className="text-xs text-slate-500 font-medium">paused / archived</span>
          </div>
        </div>

        {/* Total Pod Members */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Pod Members
            </span>
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FontAwesomeIcon icon={faUsers} className="text-sm" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-800 tracking-tight">
              {statsLoading ? '—' : stats.totalMembers}
            </span>
            <span className="text-xs text-slate-500 font-medium">staff assigned</span>
          </div>
        </div>
      </div>

      {/* ── Status Tabs ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => handleTabChange('ALL')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === 'ALL'
              ? 'bg-[#16A34A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>All Pods</span>
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {stats.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('ACTIVE')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === 'ACTIVE'
              ? 'bg-[#16A34A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Active</span>
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {stats.active}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('INACTIVE')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === 'INACTIVE'
              ? 'bg-[#16A34A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Inactive</span>
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'INACTIVE' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {stats.inactive}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('ARCHIVED')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === 'ARCHIVED'
              ? 'bg-[#16A34A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Archived</span>
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'ARCHIVED' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {stats.inactive}
          </span>
        </button>
      </div>

      {/* ── Search & Filter Toolbar ────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8E5] bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Search Bar */}
        <div className="relative flex-1 min-w-[260px]">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
          />
          <Input
            type="text"
            placeholder="Search by pod name, code (e.g. POD-CORE), or lead..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 text-sm rounded-xl border-slate-200 focus:border-[#16A34A] focus:ring-[#16A34A]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>

        {/* Right: Team Lead Filter, Status Filter, Columns, Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Team Lead Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs">
            <FontAwesomeIcon icon={faUserTie} className="text-slate-400 text-xs" />
            <span>Lead:</span>
            <select
              value={leadFilter}
              onChange={(e) => {
                setLeadFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 outline-hidden cursor-pointer max-w-[140px] truncate"
            >
              <option value="ALL">All Leads</option>
              {uniqueLeads.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs">
            <FontAwesomeIcon icon={faFilter} className="text-slate-400 text-xs" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          {/* Column Visibility Picker */}
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowColPicker(!showColPicker)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-xl h-9 px-3"
            >
              <FontAwesomeIcon icon={faSliders} className="mr-1.5 text-xs" />
              Columns
            </Button>
            {showColPicker && (
              <div className="absolute right-0 top-full z-30 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg">
                <span className="block px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Visible Columns
                </span>
                <div className="space-y-1.5 pt-1">
                  {Object.entries({
                    code: 'Pod Code',
                    lead: 'Team Lead',
                    members: 'Pod Members',
                    capacity: 'Pod Capacity',
                    status: 'Status',
                    createdAt: 'Created Date',
                  }).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={columns[key]}
                        onChange={(e) =>
                          setColumns((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-[#16A34A] focus:ring-[#16A34A]"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            title="Refresh team pods"
            className="border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl size-9"
          >
            <FontAwesomeIcon icon={faRotate} className={`text-xs ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── Bulk Actions Bar ────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
              {selectedIds.size}
            </span>
            <span>pod(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleExportCsv(true)}
              className="border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-900 text-xs font-medium rounded-lg h-8"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-1.5 text-xs" />
              Export Selected
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              className="text-emerald-700 hover:text-emerald-900 text-xs h-8"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* ── Desktop & Tablet Team Pods Table ────────────────────────── */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {columns.checkbox && (
                  <th className="w-10 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={teams.length > 0 && selectedIds.size === teams.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-[#16A34A] focus:ring-[#16A34A]"
                    />
                  </th>
                )}
                <th className="px-4 py-3">Team Pod Name</th>
                {columns.code && <th className="px-4 py-3">Code</th>}
                {columns.lead && <th className="px-4 py-3">Team Lead</th>}
                {columns.members && <th className="px-4 py-3">Pod Members</th>}
                {columns.capacity && <th className="px-4 py-3 min-w-[140px]">Capacity</th>}
                {columns.status && <th className="px-4 py-3 text-center">Status</th>}
                {columns.createdAt && <th className="px-4 py-3">Created</th>}
                {columns.actions && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <FontAwesomeIcon icon={faRotate} className="animate-spin text-lg text-emerald-600 mb-2" />
                    <p className="text-xs">Loading team pods...</p>
                  </td>
                </tr>
              ) : teams.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-slate-500">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
                        <FontAwesomeIcon icon={faPeopleGroup} className="text-2xl" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">No Team Pods Found</h3>
                      <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                        {search || statusFilter !== 'ALL' || leadFilter !== 'ALL'
                          ? 'No team pods matched your active filters. Try adjusting your search query or filters.'
                          : 'No operational team pods exist yet. Create your first team pod to assign team leads and organize staff.'}
                      </p>
                      {canManage && (
                        <Button
                          type="button"
                          onClick={handleOpenCreate}
                          className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold rounded-xl"
                        >
                          <FontAwesomeIcon icon={faPlus} className="mr-1.5" />
                          Add Team Pod
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                teams.map((team) => {
                  const isSelected = selectedIds.has(team.id);
                  const memCount = team.memberCount || 0;
                  const cap = team.capacity || 10;
                  const ratio = cap > 0 ? Math.min(100, Math.round((memCount / cap) * 100)) : 0;
                  const progressColor =
                    ratio >= 100
                      ? 'bg-rose-500'
                      : ratio >= 80
                      ? 'bg-amber-500'
                      : 'bg-[#16A34A]';

                  return (
                    <tr
                      key={team.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      {columns.checkbox && (
                        <td className="px-4 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(team.id)}
                            className="rounded border-slate-300 text-[#16A34A] focus:ring-[#16A34A]"
                          />
                        </td>
                      )}

                      {/* Name & Description */}
                      <td className="px-4 py-3.5">
                        <div className="max-w-xs">
                          <h4
                            onClick={() => handleOpenView(team)}
                            className="font-semibold text-slate-900 hover:text-emerald-700 cursor-pointer line-clamp-1"
                            title={team.name}
                          >
                            {team.name || 'Untitled Team'}
                          </h4>
                          {team.description ? (
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5" title={team.description}>
                              {team.description}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 mt-0.5">No description</p>
                          )}
                        </div>
                      </td>

                      {/* Code Badge */}
                      {columns.code && (
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-semibold border border-slate-200">
                            {team.code}
                          </span>
                        </td>
                      )}

                      {/* Team Lead */}
                      {columns.lead && (
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 max-w-[180px]">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                              {getInitials(team.head)}
                            </div>
                            <div className="min-w-0">
                              <span className="block text-xs font-semibold text-slate-800 truncate" title={team.head}>
                                {team.head || 'Unassigned'}
                              </span>
                              {team.leader?.designation?.name && (
                                <span className="block text-[11px] text-slate-400 truncate">
                                  {team.leader.designation.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Pod Members Stack */}
                      {columns.members && (
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {/* Member Avatar Stack */}
                            <div className="flex -space-x-2 overflow-hidden">
                              {(team.members || []).slice(0, 3).map((m, idx) => (
                                <div
                                  key={m.id || idx}
                                  className="inline-block size-6 rounded-full ring-2 ring-white bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center uppercase shrink-0"
                                  title={m.employee?.name || `Member ${idx + 1}`}
                                >
                                  {getInitials(m.employee?.name)}
                                </div>
                              ))}
                            </div>
                            <span className="text-xs font-bold text-slate-700">
                              {memCount} {memCount === 1 ? 'member' : 'members'}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Capacity Progress Bar */}
                      {columns.capacity && (
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-800">
                                {memCount} / {cap}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500">{ratio}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                                style={{ width: `${ratio}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Status Toggle / Badge */}
                      {columns.status && (
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(team)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105"
                            title={`Click to ${team.isActive ? 'deactivate' : 'activate'}`}
                          >
                            <span
                              className={`size-2 rounded-full ${
                                team.isActive ? 'bg-emerald-600 ring-2 ring-emerald-200' : 'bg-slate-400'
                              }`}
                            />
                            <span className={team.isActive ? 'text-emerald-700' : 'text-slate-500'}>
                              {team.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </button>
                        </td>
                      )}

                      {/* Created At */}
                      {columns.createdAt && (
                        <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(team.createdAt)}
                        </td>
                      )}

                      {/* Actions */}
                      {columns.actions && (
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {/* View / Manage Members */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenView(team)}
                              className="size-8 text-slate-500 hover:text-slate-900 rounded-lg"
                              title="View details & members"
                            >
                              <FontAwesomeIcon icon={faEye} className="text-xs" />
                            </Button>

                            {/* Edit */}
                            {canManage && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(team)}
                                className="size-8 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg"
                                title="Edit team pod"
                              >
                                <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
                              </Button>
                            )}

                            {/* Toggle status */}
                            {canManage && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleStatus(team)}
                                className={`size-8 rounded-lg ${
                                  team.isActive
                                    ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-800'
                                    : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800'
                                }`}
                                title={team.isActive ? 'Deactivate pod' : 'Activate pod'}
                              >
                                <FontAwesomeIcon icon={faPowerOff} className="text-xs" />
                              </Button>
                            )}

                            {/* Delete */}
                            {canManage && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingTeam(team)}
                                className="size-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                                title="Delete pod"
                              >
                                <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Responsive Card Layout ───────────────────────────── */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            <FontAwesomeIcon icon={faRotate} className="animate-spin text-lg text-emerald-600 mb-2" />
            <p className="text-xs">Loading team pods...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mx-auto mb-3">
              <FontAwesomeIcon icon={faPeopleGroup} />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No Team Pods Found</h4>
            <p className="text-xs text-slate-500 mt-1 mb-3">
              No team pods matched your active filters.
            </p>
            {canManage && (
              <Button
                type="button"
                onClick={handleOpenCreate}
                size="sm"
                className="bg-[#16A34A] text-white rounded-xl text-xs"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-1.5" />
                Add Team Pod
              </Button>
            )}
          </div>
        ) : (
          teams.map((team) => {
            const memCount = team.memberCount || 0;
            const cap = team.capacity || 10;
            const ratio = cap > 0 ? Math.min(100, Math.round((memCount / cap) * 100)) : 0;
            const progressColor =
              ratio >= 100
                ? 'bg-rose-500'
                : ratio >= 80
                ? 'bg-amber-500'
                : 'bg-[#16A34A]';

            return (
              <div
                key={team.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
              >
                {/* Header row: Pod name, Code badge, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4
                        onClick={() => handleOpenView(team)}
                        className="font-bold text-slate-900 text-sm truncate hover:text-emerald-700 cursor-pointer"
                      >
                        {team.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold shrink-0">
                        {team.code}
                      </span>
                    </div>
                    {team.description && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{team.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(team)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                      team.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {team.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>

                {/* Team Lead & Member info */}
                <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-100 py-2.5">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Team Lead</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {team.head || 'Unassigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Members</span>
                    <span className="font-semibold text-slate-800">
                      {memCount} staff assigned
                    </span>
                  </div>
                </div>

                {/* Capacity Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Capacity Utilization</span>
                    <span className="font-bold text-slate-800">
                      {memCount} / {cap} ({ratio}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${progressColor}`}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Created {formatDate(team.createdAt)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenView(team)}
                      className="size-8 p-0 text-slate-600 rounded-lg"
                      title="View & manage members"
                    >
                      <FontAwesomeIcon icon={faEye} className="text-xs" />
                    </Button>
                    {canManage && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(team)}
                          className="size-8 p-0 text-emerald-600 rounded-lg"
                          title="Edit pod"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingTeam(team)}
                          className="size-8 p-0 text-rose-500 rounded-lg"
                          title="Delete pod"
                        >
                          <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 pt-2">
          <span>
            Showing page <strong>{pagination.page}</strong> of{' '}
            <strong>{pagination.totalPages}</strong> ({pagination.total} total pods)
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="border-slate-200 text-slate-700 rounded-lg h-8 px-2.5"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="mr-1 text-[10px]" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="border-slate-200 text-slate-700 rounded-lg h-8 px-2.5"
            >
              Next
              <FontAwesomeIcon icon={faChevronRight} className="ml-1 text-[10px]" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Add / Edit Team Pod Modal ───────────────────────────────── */}
      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingTeam ? 'Edit Team Pod' : 'Add New Team Pod'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure team pod code, leader, maximum capacity, and member roster.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 size-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Row 1: Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Team Pod Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    placeholder="e.g. Cloud Platform Core Pod"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="text-sm rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Unique Pod Code <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    placeholder="e.g. POD-CORE"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="text-sm font-mono rounded-xl uppercase"
                  />
                </div>
              </div>

              {/* Row 2: Team Lead & Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Designated Team Lead
                  </label>
                  <select
                    value={form.leaderId}
                    onChange={(e) => setForm({ ...form, leaderId: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-hidden focus:border-[#16A34A]"
                  >
                    <option value="">Select Team Lead (Optional)</option>
                    {employees.map((emp) => (
                      <option key={emp.recordId || emp.id} value={emp.recordId || emp.id}>
                        {emp.name} {emp.designation ? `(${emp.designation})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Maximum Capacity
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="10"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="text-sm rounded-xl"
                  />
                  <p className="text-[11px] text-slate-400">Total staff capacity allowed for this pod.</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Mission & Workload Description
                </label>
                <Textarea
                  placeholder="Outline pod responsibilities, microservices, or functional focus..."
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="text-xs rounded-xl"
                />
              </div>

              {/* Member Selection Section */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Assign Pod Members ({form.memberIds.length} of {form.capacity || 10} selected)
                  </label>
                  {form.memberIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, memberIds: [] })}
                      className="text-[11px] text-rose-600 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Member Search filter */}
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                  />
                  <Input
                    type="text"
                    placeholder="Filter staff by name, code, or department..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-8 text-xs h-9 rounded-xl"
                  />
                </div>

                {/* Employee Roster Selection List */}
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-slate-50/50 p-1">
                  {filteredEmployeesForForm.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No matching staff members found.
                    </div>
                  ) : (
                    filteredEmployeesForForm.map((emp) => {
                      const empId = Number(emp.recordId || emp.id);
                      const isSelected = form.memberIds.includes(empId);
                      return (
                        <div
                          key={empId}
                          onClick={() => handleToggleMember(empId)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'hover:bg-white text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by div click
                              className="rounded border-slate-300 text-[#16A34A] focus:ring-[#16A34A]"
                            />
                            <div className="size-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {getInitials(emp.name)}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs truncate block">{emp.name}</span>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {emp.designation || 'Staff'} • {emp.department || 'General'}
                              </span>
                            </div>
                          </div>
                          {String(form.leaderId) === String(empId) && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                              Lead
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div>
                  <span className="text-xs font-bold text-slate-800">Operational Status</span>
                  <p className="text-[11px] text-slate-500">
                    Enable this team pod for active assignment and workload tracking.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#16A34A]" />
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  disabled={formBusy}
                  className="rounded-xl border-slate-200 text-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formBusy}
                  className="bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl shadow-xs font-semibold"
                >
                  {formBusy ? (
                    <>
                      <FontAwesomeIcon icon={faRotate} className="animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : editingTeam ? (
                    'Save Pod'
                  ) : (
                    'Create Team Pod'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Team Details & Member Management Modal ──────────────────── */}
      {viewTeam && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <FontAwesomeIcon icon={faPeopleGroup} className="text-base" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{viewTeam.name}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200">
                      {viewTeam.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Team Lead: <strong className="text-slate-800">{viewTeam.head || 'Unassigned'}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewTeam(null)}
                className="text-slate-400 hover:text-slate-600 size-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Capacity Banner */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wider">
                    Pod Member Roster & Capacity
                  </span>
                  <span className="font-semibold text-slate-800">
                    {viewTeam.members?.length || 0} of {viewTeam.capacity || 10} Slots Filled
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      (viewTeam.members?.length || 0) >= (viewTeam.capacity || 10)
                        ? 'bg-rose-500'
                        : 'bg-[#16A34A]'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(((viewTeam.members?.length || 0) / (viewTeam.capacity || 10)) * 100),
                      )}%`,
                    }}
                  />
                </div>
                {viewTeam.description && (
                  <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                    {viewTeam.description}
                  </p>
                )}
              </div>

              {/* Inline Add Member Selector */}
              {canManage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-2">
                  <span className="block text-xs font-bold text-emerald-900">
                    Add New Member to this Pod
                  </span>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <select
                      value={selectedNewMemberId}
                      onChange={(e) => setSelectedNewMemberId(e.target.value)}
                      className="w-full sm:flex-1 h-9 px-3 rounded-lg border border-emerald-200 bg-white text-xs font-medium text-slate-800 outline-hidden focus:border-[#16A34A]"
                    >
                      <option value="">Select staff member to add...</option>
                      {employees
                        .filter(
                          (emp) =>
                            !(viewTeam.members || []).some(
                              (m) =>
                                Number(m.employeeId || m.employee?.id) === Number(emp.recordId || emp.id),
                            ),
                        )
                        .map((emp) => (
                          <option key={emp.recordId || emp.id} value={emp.recordId || emp.id}>
                            {emp.name} ({emp.designation || 'Staff'} • {emp.department || 'General'})
                          </option>
                        ))}
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddMemberToCurrentPod}
                      disabled={!selectedNewMemberId || memberActionBusy}
                      className="w-full sm:w-auto bg-[#16A34A] hover:bg-[#15803D] text-white text-xs rounded-lg h-9 font-semibold"
                    >
                      <FontAwesomeIcon icon={faUserPlus} className="mr-1.5" />
                      Add Member
                    </Button>
                  </div>
                </div>
              )}

              {/* Transfer Dialog sub-box if transferring */}
              {transferringMember && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900">
                      Transfer &quot;{transferringMember.name}&quot; to Another Pod
                    </span>
                    <button
                      type="button"
                      onClick={() => setTransferringMember(null)}
                      className="text-xs text-blue-500 hover:text-blue-800"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <select
                      value={transferTargetPodId}
                      onChange={(e) => setTransferTargetPodId(e.target.value)}
                      className="w-full sm:flex-1 h-9 px-3 rounded-lg border border-blue-200 bg-white text-xs font-medium text-slate-800 outline-hidden focus:border-blue-500"
                    >
                      <option value="">Select destination pod...</option>
                      {allTeamsList
                        .filter((t) => t.id !== viewTeam.id)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.code || `POD-${t.id}`})
                          </option>
                        ))}
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleExecuteTransfer}
                      disabled={!transferTargetPodId || memberActionBusy}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg h-9 font-semibold"
                    >
                      <FontAwesomeIcon icon={faArrowRightArrowLeft} className="mr-1.5" />
                      Confirm Transfer
                    </Button>
                  </div>
                </div>
              )}

              {/* Members Roster Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Current Pod Members ({viewTeam.members?.length || 0})
                </span>

                {(!viewTeam.members || viewTeam.members.length === 0) ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-xs">
                    No members currently assigned to this team pod.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white">
                    {viewTeam.members.map((m) => {
                      const emp = m.employee || {};
                      const empId = m.employeeId || emp.id;
                      const isLead =
                        String(viewTeam.leaderId) === String(empId) ||
                        m.role === 'LEADER';

                      return (
                        <div
                          key={m.id || empId}
                          className="flex items-center justify-between p-3 hover:bg-slate-50/60 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-8 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0">
                              {getInitials(emp.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-slate-900 truncate">
                                  {emp.name || 'Staff Member'}
                                </span>
                                {isLead && (
                                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                                    Team Lead
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 block truncate">
                                {emp.designation?.name || emp.designation || 'Staff'} •{' '}
                                {emp.department?.name || emp.department || 'General'}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons for this Member */}
                          {canManage && (
                            <div className="flex items-center gap-1 shrink-0">
                              {!isLead && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMakeLead(empId, emp.name)}
                                  className="text-[11px] text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-7 px-2 rounded-lg"
                                  title="Promote to Team Lead"
                                >
                                  Make Lead
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setTransferringMember({ id: empId, name: emp.name })
                                }
                                className="text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-7 px-2 rounded-lg"
                                title="Transfer to another pod"
                              >
                                <FontAwesomeIcon icon={faArrowRightArrowLeft} className="mr-1 text-[10px]" />
                                Transfer
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleRemoveMemberFromCurrentPod(empId, emp.name)
                                }
                                className="size-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                                title="Remove member from pod"
                              >
                                <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-3 bg-slate-50/50">
              {canManage && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const t = viewTeam;
                    setViewTeam(null);
                    handleOpenEdit(t);
                  }}
                  className="rounded-xl border-slate-200 text-xs"
                >
                  <FontAwesomeIcon icon={faPenToSquare} className="mr-1.5" />
                  Edit Pod Settings
                </Button>
              )}
              <Button
                type="button"
                onClick={() => setViewTeam(null)}
                className="bg-slate-900 text-white rounded-xl text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ──────────────────────────────── */}
      <ConfirmDialog
        open={Boolean(deletingTeam)}
        onOpenChange={(open) => !open && setDeletingTeam(null)}
        title="Delete Team Pod"
        description={`Are you sure you want to permanently delete the team pod "${deletingTeam?.name || ''}"? This action requires that all assigned staff members have been removed or transferred.`}
        confirmLabel="Delete Pod"
        variant="destructive"
        loading={deleteBusy}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
