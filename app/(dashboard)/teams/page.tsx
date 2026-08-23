'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminFormDrawer, AdminPagination } from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

interface TeamMemberRecord {
  id: number;
  teamId: number;
  employeeId: number;
  role: string;
  employee: {
    id: number;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    department?: { name: string };
    designation?: { name: string };
  };
}

interface TeamRecord {
  id: number;
  customerId: number;
  name: string;
  description?: string;
  leaderId?: number;
  leader?: {
    id: number;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  members: TeamMemberRecord[];
  createdAt: string;
}

export default function TeamsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedTeam, setSelectedTeam] = useState<TeamRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLeaderId, setFormLeaderId] = useState('');

  // Add Member state
  const [memberEmployeeId, setMemberEmployeeId] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');

  // Queries
  const { data: teamsResponse, isLoading: isTeamsLoading, refetch: refetchTeams } = useQuery({
    queryKey: ['teams-list', searchQuery, page, pageSize],
    queryFn: async () => {
      const params: any = { page, limit: pageSize };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res: any = await api.get('/teams', { params });
      const items = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
      const pagination = res.pagination || res.meta || res.data?.pagination || {
        page,
        pageSize,
        total: Array.isArray(items) ? items.length : 0,
        totalPages: 1,
      };
      return {
        items: Array.isArray(items) ? items : [],
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

  const { data: employeesList = [] } = useQuery({
    queryKey: ['employees-simple-list'],
    queryFn: async () => {
      const res = await api.get('/employees');
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
      setFormName('');
      setFormDescription('');
      setFormLeaderId('');
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
      setIsAddMemberOpen(false);
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
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const res = await api.delete(`/teams/${teamId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Team deleted');
      queryClient.invalidateQueries({ queryKey: ['teams-list'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Please specify a team name');
      return;
    }
    createTeamMutation.mutate({
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      leaderId: formLeaderId ? Number(formLeaderId) : undefined,
    });
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !memberEmployeeId) {
      toast.error('Please select an employee');
      return;
    }
    addMemberMutation.mutate({
      teamId: selectedTeam.id,
      payload: {
        employeeId: Number(memberEmployeeId),
        role: memberRole,
      },
    });
  };

  const filteredTeams = teamsList.filter((team: TeamRecord) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      team.name.toLowerCase().includes(q) ||
      team.description?.toLowerCase().includes(q) ||
      team.members?.some((m) =>
        `${m.employee?.firstName} ${m.employee?.lastName}`.toLowerCase().includes(q)
      )
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Team & Squad Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize staff into operational units, assign team leads, and manage member rosters.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchTeams()}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search team name or member..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Team Cards Grid */}
      {isTeamsLoading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
          Loading team roster...
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-slate-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No teams found. Click "Create Team" to set up your first functional squad.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team: TeamRecord) => (
            <div
              key={team.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-700/60">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{team.name}</h3>
                    {team.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {team.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete team "${team.name}"?`)) {
                        deleteTeamMutation.mutate(team.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                    title="Delete Team"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {team.leader && (
                  <div className="mt-4 p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/40 rounded-lg flex items-center gap-2 text-xs">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="font-semibold text-indigo-900 dark:text-indigo-300">Team Lead: </span>
                      <span className="text-slate-700 dark:text-slate-300">{team.leader.firstName} {team.leader.lastName}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Members List */}
              <div className="p-5 flex-1">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  <span>Assigned Members ({team.members?.length || 0})</span>
                  <button
                    onClick={() => {
                      setSelectedTeam(team);
                      setMemberEmployeeId('');
                      setIsAddMemberOpen(true);
                    }}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium normal-case"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add Member
                  </button>
                </div>

                {(!team.members || team.members.length === 0) ? (
                  <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                    No members assigned yet
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {team.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-300">
                            {m.employee?.firstName?.slice(0, 1) || 'E'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {m.employee?.firstName} {m.employee?.lastName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {m.employee?.designation?.name || 'Staff'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            removeMemberMutation.mutate({ teamId: team.id, employeeId: m.employeeId })
                          }
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                          title="Remove from team"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

          {/* Server-Side Pagination */}
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

      {/* Create Team Drawer */}
      <AdminFormDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Team"
        subtitle="Set up a functional squad or project team"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mobile Engineering, Enterprise Sales..."
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Team Description
            </label>
            <textarea
              rows={3}
              placeholder="Operational responsibilities and scope"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Designate Team Leader
            </label>
            <select
              value={formLeaderId}
              onChange={(e) => setFormLeaderId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- No Leader (Unassigned) --</option>
              {employeesList.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTeamMutation.isPending}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50"
            >
              {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* Add Member Drawer */}
      <AdminFormDrawer
        isOpen={isAddMemberOpen}
        onClose={() => {
          setIsAddMemberOpen(false);
          setSelectedTeam(null);
        }}
        title={`Assign Member to ${selectedTeam?.name}`}
        subtitle="Add an employee to this team's roster"
      >
        <form onSubmit={handleAddMemberSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Employee <span className="text-red-500">*</span>
            </label>
            <select
              value={memberEmployeeId}
              onChange={(e) => setMemberEmployeeId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Employee --</option>
              {employeesList.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Role in Team
            </label>
            <select
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="MEMBER">Member</option>
              <option value="SPECIALIST">Specialist / Contributor</option>
              <option value="COORDINATOR">Coordinator</option>
              <option value="DEPUTY_LEAD">Deputy Lead</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsAddMemberOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addMemberMutation.isPending}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50"
            >
              {addMemberMutation.isPending ? 'Assigning...' : 'Assign to Team'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>
    </div>
  );
}
