'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Building2,
  User,
  Trash2,
  RefreshCw,
  AlertCircle,
  UserPlus,
  ShieldCheck,
  Mail,
  Phone,
  Briefcase,
  Edit,
  Eye,
  Check,
  X,
  Calendar,
  CheckCircle2,
  XCircle,
  MoreVertical,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminFormDrawer, AdminPagination } from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

interface EmployeeRecord {
  id: number;
  employeeCode?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  designation?: { name?: string } | string;
  department?: { name?: string } | string;
}

interface TeamMemberRecord {
  id: number;
  teamId: number;
  employeeId: number;
  role: string;
  joinedAt?: string;
  employee: EmployeeRecord;
}

interface TeamRecord {
  id: number;
  customerId: number;
  name: string;
  description?: string;
  leaderId?: number;
  isActive: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  leader?: EmployeeRecord;
  members: TeamMemberRecord[];
  memberCount: number;
  createdAt: string;
  updatedAt?: string;
}

export default function TeamsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals & Drawers state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamRecord | null>(null);
  const [viewingTeam, setViewingTeam] = useState<TeamRecord | null>(null);
  const [addingMemberTeam, setAddingMemberTeam] = useState<TeamRecord | null>(null);

  // Create Form State
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createLeaderId, setCreateLeaderId] = useState<string>('');
  const [createMemberIds, setCreateMemberIds] = useState<number[]>([]);
  const [createIsActive, setCreateIsActive] = useState(true);

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLeaderId, setEditLeaderId] = useState<string>('');
  const [editMemberIds, setEditMemberIds] = useState<number[]>([]);
  const [editIsActive, setEditIsActive] = useState(true);

  // Add Member State
  const [memberEmployeeId, setMemberEmployeeId] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');

  // 1. Fetch Teams List from real backend API
  const { data: teamsResponse, isLoading: isTeamsLoading, refetch: refetchTeams } = useQuery({
    queryKey: ['teams-list', searchQuery, statusFilter, page, pageSize],
    queryFn: async () => {
      const params: any = { page, limit: pageSize };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res: any = await api.get('/teams', { params });
      const items = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
      const pagination = res.pagination || res.meta || res.data?.pagination || {
        page,
        pageSize,
        total: Array.isArray(items) ? items.length : 0,
        totalPages: 1,
      };
      return {
        items: Array.isArray(items) ? (items as TeamRecord[]) : [],
        pagination: {
          page: Number(pagination.page) || page,
          pageSize: Number(pagination.pageSize || pagination.limit) || pageSize,
          total: Number(pagination.total) || (Array.isArray(items) ? items.length : 0),
          totalPages: Number(pagination.totalPages) || 1,
        },
      };
    },
  });

  const teamsList: TeamRecord[] = teamsResponse?.items || [];
  const teamsPagination = teamsResponse?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  // 2. Fetch Employee Master Roster for Select Dropdowns
  const { data: employeesList = [] } = useQuery<EmployeeRecord[]>({
    queryKey: ['employees-simple-list'],
    queryFn: async () => {
      const res = await api.get('/employees', { params: { limit: 200 } });
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : data?.employees || [];
    },
  });

  // Mutations
  const createTeamMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/teams', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Team created successfully');
      setIsCreateOpen(false);
      resetCreateForm();
      queryClient.invalidateQueries({ queryKey: ['teams-list'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await api.put(`/teams/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Team updated successfully');
      setEditingTeam(null);
      queryClient.invalidateQueries({ queryKey: ['teams-list'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ teamId, payload }: { teamId: number; payload: any }) => {
      const res = await api.post(`/teams/${teamId}/members`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Member assigned to team');
      setAddingMemberTeam(null);
      setMemberEmployeeId('');
      setMemberRole('MEMBER');
      queryClient.invalidateQueries({ queryKey: ['teams-list'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ teamId, employeeId }: { teamId: number; employeeId: number }) => {
      const res = await api.delete(`/teams/${teamId}/members/${employeeId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Member removed from team');
      queryClient.invalidateQueries({ queryKey: ['teams-list'] });
      if (viewingTeam) {
        setViewingTeam((prev) =>
          prev
            ? {
                ...prev,
                members: prev.members.filter((m) => m.employeeId !== m.employeeId),
                memberCount: Math.max(0, prev.memberCount - 1),
              }
            : null
        );
      }
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async ({ id, permanent }: { id: number; permanent?: boolean }) => {
      const res = await api.delete(`/teams/${id}`, {
        params: { permanent: permanent ? 'true' : 'false' },
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Team deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['teams-list'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Helpers
  const resetCreateForm = () => {
    setCreateName('');
    setCreateDescription('');
    setCreateLeaderId('');
    setCreateMemberIds([]);
    setCreateIsActive(true);
  };

  const handleOpenEdit = (team: TeamRecord) => {
    setEditingTeam(team);
    setEditName(team.name || '');
    setEditDescription(team.description || '');
    setEditLeaderId(team.leaderId ? String(team.leaderId) : '');
    setEditMemberIds((team.members || []).map((m) => m.employeeId));
    setEditIsActive(team.isActive ?? true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      toast.error('Please enter a team name');
      return;
    }
    createTeamMutation.mutate({
      name: createName.trim(),
      description: createDescription.trim() || undefined,
      leaderId: createLeaderId ? Number(createLeaderId) : undefined,
      memberIds: createMemberIds,
      isActive: createIsActive,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;
    if (!editName.trim()) {
      toast.error('Please enter a team name');
      return;
    }
    updateTeamMutation.mutate({
      id: editingTeam.id,
      payload: {
        name: editName.trim(),
        description: editDescription.trim() || null,
        leaderId: editLeaderId ? Number(editLeaderId) : null,
        memberIds: editMemberIds,
        isActive: editIsActive,
      },
    });
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingMemberTeam || !memberEmployeeId) {
      toast.error('Please select an employee');
      return;
    }
    addMemberMutation.mutate({
      teamId: addingMemberTeam.id,
      payload: {
        employeeId: Number(memberEmployeeId),
        role: memberRole,
      },
    });
  };

  const toggleCreateMemberSelection = (empId: number) => {
    setCreateMemberIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const toggleEditMemberSelection = (empId: number) => {
    setEditMemberIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  // KPIs
  const totalTeams = teamsPagination.total ?? teamsList.length;
  const totalMembers = teamsList.reduce((acc, t) => acc + (t.members?.length || 0), 0);
  const assignedLeads = teamsList.filter((t) => t.leaderId || t.leader).length;
  const activeTeams = teamsList.filter((t) => t.isActive).length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. Page Hero Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#23C45E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-[#23C45E] border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#23C45E] animate-pulse" />
                HRM • Workforce Units
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Team Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Organize personnel into functional project units, assign designated team leaders, and manage member rosters with real-time backend synchronization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => refetchTeams()}
              disabled={isTeamsLoading}
              className="p-2.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl border border-white/10 text-xs font-black transition-all cursor-pointer backdrop-blur-xs disabled:opacity-50 active:scale-95"
              title="Refresh Teams"
            >
              <RefreshCw className={`w-4 h-4 ${isTeamsLoading ? 'animate-spin text-[#23C45E]' : ''}`} />
            </button>
            <button
              onClick={() => {
                resetCreateForm();
                setIsCreateOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer group active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>+ Create Team</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Teams */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-400">
              Total Teams
            </span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {isTeamsLoading ? '...' : totalTeams}
            </p>
            <span className="text-xs font-bold text-slate-500 mt-0.5 block">
              Registered units
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Members */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-400">
              Assigned Members
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {isTeamsLoading ? '...' : totalMembers}
            </p>
            <span className="text-xs font-bold text-emerald-700 mt-0.5 block">
              Personnel in teams
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-[#23C45E]" />
          </div>
        </div>

        {/* Assigned Leads */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-400">
              Team Leaders
            </span>
            <p className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">
              {isTeamsLoading ? '...' : assignedLeads}
            </p>
            <span className="text-xs font-bold text-indigo-700 mt-0.5 block">
              Leadership appointed
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Active Teams */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-400">
              Active Teams
            </span>
            <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">
              {isTeamsLoading ? '...' : activeTeams}
            </p>
            <span className="text-xs font-bold text-slate-500 mt-0.5 block">
              Operational status
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams by name, leader, or members..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-stretch sm:self-auto">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => {
            const active = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st === 'ALL' ? 'All Teams' : st === 'ACTIVE' ? 'Active' : 'Inactive'}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Team Cards Grid */}
      {isTeamsLoading ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
          <p className="text-xs font-semibold text-slate-500">Loading teams from server...</p>
        </div>
      ) : teamsList.length === 0 ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-200/80 text-center space-y-4">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No teams found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or status filter.'
                : 'Get started by creating your first organizational team unit.'}
            </p>
          </div>
          <button
            onClick={() => {
              resetCreateForm();
              setIsCreateOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
          >
            + Create New Team
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamsList.map((team: TeamRecord) => {
              const leaderName = team.leader
                ? `${team.leader.firstName || ''} ${team.leader.lastName || ''}`.trim() || team.leader.name
                : null;

              return (
                <div
                  key={team.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-slate-100 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-600 transition-colors">
                            {team.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              team.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {team.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {team.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                            {team.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setViewingTeam(team)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Full Team Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(team)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Team"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Are you sure you want to delete team "${team.name}"? This action cannot be undone.`
                              )
                            ) {
                              deleteTeamMutation.mutate({ id: team.id, permanent: true });
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Team"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Team Leader Banner */}
                    <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {leaderName ? leaderName.charAt(0) : <ShieldCheck className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-black text-indigo-500 tracking-wider">
                            Team Leader
                          </div>
                          <div className="text-xs font-bold text-slate-900">
                            {leaderName || <span className="text-slate-400 italic">Unassigned</span>}
                          </div>
                        </div>
                      </div>
                      {team.leader?.employeeCode && (
                        <span className="text-[10px] font-mono text-indigo-600 bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
                          {team.leader.employeeCode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Members List */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        <span>Roster Members ({team.members?.length || 0})</span>
                        <button
                          onClick={() => {
                            setAddingMemberTeam(team);
                            setMemberEmployeeId('');
                            setMemberRole('MEMBER');
                          }}
                          className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold normal-case cursor-pointer text-xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> + Add Member
                        </button>
                      </div>

                      {(!team.members || team.members.length === 0) ? (
                        <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          No members assigned yet
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {team.members.map((m) => {
                            const empName: string =
                              (m.employee
                                ? `${m.employee.firstName || ''} ${m.employee.lastName || ''}`.trim() || m.employee.name
                                : '') || 'Staff';
                            const empDesig = typeof m.employee?.designation === 'object'
                              ? m.employee.designation?.name
                              : m.employee?.designation || m.role;

                            return (
                              <div
                                key={m.id}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 text-xs transition-colors"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                                    {empName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900">{empName}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">
                                      {empDesig || 'Team Member'}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    removeMemberMutation.mutate({
                                      teamId: team.id,
                                      employeeId: m.employeeId,
                                    })
                                  }
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Remove from team"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span>Created {new Date(team.createdAt).toLocaleDateString()}</span>
                      <button
                        onClick={() => setViewingTeam(team)}
                        className="text-indigo-600 hover:underline font-bold cursor-pointer"
                      >
                        View Full Roster &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 5. Server-Side Pagination */}
          <AdminPagination
            page={page}
            pageSize={pageSize}
            total={teamsPagination.total}
            totalPages={teamsPagination.totalPages}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            disabled={isTeamsLoading}
          />
        </>
      )}

      {/* 6. Create Team Drawer */}
      <AdminFormDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Team"
        subtitle="Establish an operational department, squad, or project team"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Team Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. SSM Creative Crew, Reels Editing Squad..."
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Responsibilities
            </label>
            <textarea
              rows={3}
              placeholder="Primary functions, deliverables, and assignments handled by this team..."
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Designated Team Leader
            </label>
            <select
              value={createLeaderId}
              onChange={(e) => setCreateLeaderId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium cursor-pointer"
            >
              <option value="">-- No Leader Assigned (Optional) --</option>
              {employeesList.map((emp) => {
                const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name;
                return (
                  <option key={emp.id} value={emp.id}>
                    {name} ({emp.employeeCode || 'ID: ' + emp.id})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Initial Team Members ({createMemberIds.length} selected)
              </label>
              <span className="text-[10px] text-slate-400">Click to toggle</span>
            </div>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 divide-y divide-slate-100">
              {employeesList.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">Loading employees...</div>
              ) : (
                employeesList.map((emp) => {
                  const isSelected = createMemberIds.includes(emp.id);
                  const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name;
                  return (
                    <div
                      key={emp.id}
                      onClick={() => toggleCreateMemberSelection(emp.id)}
                      className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span>{name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {emp.employeeCode}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="createActive"
              checked={createIsActive}
              onChange={(e) => setCreateIsActive(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <label htmlFor="createActive" className="text-xs font-bold text-slate-700 cursor-pointer">
              Set team as active
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTeamMutation.isPending}
              className="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* 7. Edit Team Drawer */}
      <AdminFormDrawer
        isOpen={!!editingTeam}
        onClose={() => setEditingTeam(null)}
        title={`Edit Team: ${editingTeam?.name}`}
        subtitle="Update operational details, leader assignment, and member roster"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Team Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Responsibilities
            </label>
            <textarea
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Designated Team Leader
            </label>
            <select
              value={editLeaderId}
              onChange={(e) => setEditLeaderId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium cursor-pointer"
            >
              <option value="">-- No Leader Assigned --</option>
              {employeesList.map((emp) => {
                const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name;
                return (
                  <option key={emp.id} value={emp.id}>
                    {name} ({emp.employeeCode || 'ID: ' + emp.id})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Assigned Team Members ({editMemberIds.length} selected)
              </label>
              <span className="text-[10px] text-slate-400">Click to toggle</span>
            </div>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 divide-y divide-slate-100">
              {employeesList.map((emp) => {
                const isSelected = editMemberIds.includes(emp.id);
                const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name;
                return (
                  <div
                    key={emp.id}
                    onClick={() => toggleEditMemberSelection(emp.id)}
                    className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50 text-indigo-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <span>{name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {emp.employeeCode}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="editActive"
              checked={editIsActive}
              onChange={(e) => setEditIsActive(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <label htmlFor="editActive" className="text-xs font-bold text-slate-700 cursor-pointer">
              Active operational status
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingTeam(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateTeamMutation.isPending}
              className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {updateTeamMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* 8. Team Details View Modal */}
      {viewingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    {viewingTeam.name}
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                        viewingTeam.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {viewingTeam.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Team ID: #{viewingTeam.id}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingTeam(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
              {viewingTeam.description && (
                <div>
                  <div className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">
                    Description & Scope
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                    {viewingTeam.description}
                  </p>
                </div>
              )}

              {/* Leader Profile */}
              <div>
                <div className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Designated Leader
                </div>
                {viewingTeam.leader ? (
                  <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                        {(viewingTeam.leader.firstName || viewingTeam.leader.name || 'L').charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {`${viewingTeam.leader.firstName || ''} ${viewingTeam.leader.lastName || ''}`.trim() || viewingTeam.leader.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {typeof viewingTeam.leader.designation === 'object'
                            ? viewingTeam.leader.designation?.name
                            : viewingTeam.leader.designation || 'Team Leader'}
                        </div>
                      </div>
                    </div>
                    {viewingTeam.leader.email && (
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{viewingTeam.leader.email}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No leader assigned to this team
                  </div>
                )}
              </div>

              {/* Members Roster */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  <span>Assigned Personnel ({viewingTeam.members?.length || 0})</span>
                  <button
                    onClick={() => {
                      setAddingMemberTeam(viewingTeam);
                      setMemberEmployeeId('');
                      setMemberRole('MEMBER');
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-bold normal-case cursor-pointer flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> + Add Member
                  </button>
                </div>

                {(!viewingTeam.members || viewingTeam.members.length === 0) ? (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No members in this team yet.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    {viewingTeam.members.map((m) => {
                      const empName: string =
                        (m.employee
                          ? `${m.employee.firstName || ''} ${m.employee.lastName || ''}`.trim() || m.employee.name
                          : '') || 'Staff';
                      return (
                        <div key={m.id} className="p-3 flex items-center justify-between hover:bg-slate-50/50 transition">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                              {empName.charAt(0)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{empName}</div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                {m.employee?.employeeCode} • {typeof m.employee?.designation === 'object' ? m.employee.designation?.name : m.employee?.designation || m.role}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              removeMemberMutation.mutate({
                                teamId: viewingTeam.id,
                                employeeId: m.employeeId,
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Created on {new Date(viewingTeam.createdAt).toLocaleDateString()}
              </span>
              <button
                type="button"
                onClick={() => setViewingTeam(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Add Member Drawer */}
      <AdminFormDrawer
        isOpen={!!addingMemberTeam}
        onClose={() => setAddingMemberTeam(null)}
        title={`Assign Member to ${addingMemberTeam?.name}`}
        subtitle="Add an employee from the master roster to this team"
      >
        <form onSubmit={handleAddMemberSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Employee <span className="text-rose-500">*</span>
            </label>
            <select
              value={memberEmployeeId}
              onChange={(e) => setMemberEmployeeId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium cursor-pointer"
            >
              <option value="">-- Choose Employee --</option>
              {employeesList.map((emp) => {
                const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name;
                return (
                  <option key={emp.id} value={emp.id}>
                    {name} ({emp.employeeCode || 'ID: ' + emp.id})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Role in Team
            </label>
            <select
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium cursor-pointer"
            >
              <option value="MEMBER">Member</option>
              <option value="SPECIALIST">Specialist / Contributor</option>
              <option value="COORDINATOR">Coordinator</option>
              <option value="DEPUTY_LEAD">Deputy Lead</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddingMemberTeam(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addMemberMutation.isPending}
              className="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {addMemberMutation.isPending ? 'Assigning...' : 'Assign to Team'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>
    </div>
  );
}
