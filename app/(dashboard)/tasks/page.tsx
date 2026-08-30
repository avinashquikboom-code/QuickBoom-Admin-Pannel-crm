'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  CheckSquare,
  Clock,
  AlertCircle,
  Users,
  Building,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Edit,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Filter,
  Image as ImageIcon,
  Check,
  X,
  AlertTriangle,
  UserCheck,
  FileText,
  Calendar,
  ExternalLink,
  UploadCloud,
  Flame,
  ArrowUpDown,
  Zap,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  AdminPageHero,
  AdminStatCard,
  AdminFormDrawer,
  AdminPagination,
  TaskDetailsDrawer,
} from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

export default function TasksPage() {
  const queryClient = useQueryClient();

  // Active Filters & Tabs
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'PENDING' | 'IN_PROGRESS' | 'OVERDUE' | 'UNDER_REVIEW' | 'COMPLETED' | 'REJECTED'
  >('ALL');
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [employeeFilter, setEmployeeFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'createdAt'>('priority');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals & Drawers
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReallocateModalOpen, setIsReallocateModalOpen] = useState(false);
  const [isSubmitProofOpen, setIsSubmitProofOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [viewingTaskId, setViewingTaskId] = useState<number | string | null>(null);

  // Forms State
  const [form, setForm] = useState({
    id: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    departmentId: '',
    employeeId: '',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    dueTime: '06:30 PM',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '09:00 AM',
    category: 'OPERATIONS',
    notes: '',
  });

  const [reallocateForm, setReallocateForm] = useState({
    employeeId: '',
    reason: '',
  });

  const [proofForm, setProofForm] = useState({
    fileUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80',
    fileName: 'on_site_completion_proof.jpg',
    comment: 'Completed on-site task requirements with photo verification.',
  });

  const [rejectReason, setRejectReason] = useState('');

  // 1. Fetch Tasks
  const { data: tasksResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-tasks-list', activeTab, search, departmentFilter, employeeFilter, priorityFilter, sortBy, page, pageSize],
    queryFn: async () => {
      try {
        const res: any = await api.get('/tasks', {
          params: {
            status: activeTab === 'OVERDUE' ? undefined : activeTab,
            isOverdue: activeTab === 'OVERDUE' ? 'true' : undefined,
            search: search || undefined,
            departmentId: departmentFilter !== 'ALL' ? departmentFilter : undefined,
            employeeId: employeeFilter !== 'ALL' ? employeeFilter : undefined,
            priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
            sortBy,
            page,
            limit: pageSize,
          },
        });
        const items = res?.data?.data || res?.data?.items || res?.data || res?.items || (Array.isArray(res) ? res : []);
        const pagination = res?.pagination || res?.meta || res?.data?.pagination || res?.data?.meta || {
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
      } catch {
        return { items: [], pagination: { page: 1, pageSize, total: 0, totalPages: 1 } };
      }
    },
  });

  const tasks: any[] = tasksResponse?.items || [];
  const pagination = tasksResponse?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  // 2. Fetch Metrics
  const { data: metricsData } = useQuery({
    queryKey: ['admin-tasks-metrics'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/tasks/metrics');
        return res?.data || res;
      } catch {
        return null;
      }
    },
  });

  // 3. Fetch Departments
  const { data: departmentsData } = useQuery({
    queryKey: ['admin-departments-dropdown'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/departments');
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  // 4. Fetch Employees
  const { data: employeesData } = useQuery({
    queryKey: ['admin-employees-dropdown'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/employees');
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  const departments: any[] = Array.isArray(departmentsData) ? departmentsData : [];
  const employees: any[] = Array.isArray(employeesData) ? employeesData : [];

  const metrics = {
    total: metricsData?.total ?? tasks.length,
    pending: metricsData?.pending ?? 0,
    inProgress: metricsData?.inProgress ?? 0,
    overdue: metricsData?.overdue ?? 0,
    completed: metricsData?.completed ?? 0,
    awaitingReview: metricsData?.awaitingReview ?? 0,
    urgent: metricsData?.urgent ?? 0,
    high: metricsData?.high ?? 0,
    overdueUrgent: metricsData?.overdueUrgent ?? 0,
    overdueHigh: metricsData?.overdueHigh ?? 0,
  };

  // Filter employees when department is selected in form
  const availableEmployees = form.departmentId
    ? employees.filter((e) => String(e.departmentId) === form.departmentId)
    : employees;

  // Save Task Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim() || 'New Task',
        description: form.description.trim() || 'Task description',
        priority: form.priority,
        departmentId: form.departmentId || undefined,
        employeeId: form.employeeId || undefined,
        dueDate: form.dueDate,
        dueTime: form.dueTime,
        startDate: form.startDate || undefined,
        startTime: form.startTime || undefined,
        category: form.category || 'OPERATIONS',
        notes: form.notes.trim() || undefined,
      };

      if (form.id) {
        return api.patch(`/tasks/${form.id}`, payload);
      } else {
        return api.post('/tasks', payload);
      }
    },
    onSuccess: () => {
      toast.success(form.id ? 'Task updated successfully' : 'Task created and allocated');
      setIsDrawerOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Reallocate Mutation
  const reallocateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTask) return;
      return api.post(`/tasks/${selectedTask.id}/reallocate`, {
        employeeId: reallocateForm.employeeId,
        reason: reallocateForm.reason,
      });
    },
    onSuccess: () => {
      toast.success('Task reallocated successfully');
      setIsReallocateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Submit Proof Mutation
  const submitProofMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTask) return;
      if (!proofForm.fileUrl.trim()) {
        throw new Error('Completion proof photo is required.');
      }
      return api.post(`/tasks/${selectedTask.id}/proof`, {
        fileUrl: proofForm.fileUrl.trim(),
        fileName: proofForm.fileName,
        comment: proofForm.comment,
      });
    },
    onSuccess: () => {
      toast.success('Photo proof submitted for HR review!');
      setIsSubmitProofOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Approve Task Mutation
  const approveMutation = useMutation({
    mutationFn: async (taskId: number | string) => {
      return api.post(`/tasks/${taskId}/approve`, { comment: 'Approved by HR Administrator.' });
    },
    onSuccess: () => {
      toast.success('Task approved and marked COMPLETED! 🎉');
      setIsReviewModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Reject Task Mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ taskId, reason }: { taskId: number | string; reason: string }) => {
      if (!reason.trim()) {
        throw new Error('Rejection reason is mandatory.');
      }
      return api.post(`/tasks/${taskId}/reject`, { rejectionReason: reason.trim() });
    },
    onSuccess: () => {
      toast.success('Task proof rejected. Reopened for employee corrections.');
      setIsReviewModalOpen(false);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      return api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      toast.success('Task archived');
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tasks-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const resetForm = () => {
    setForm({
      id: '',
      title: '',
      description: '',
      priority: 'MEDIUM',
      departmentId: '',
      employeeId: '',
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      dueTime: '06:30 PM',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00 AM',
      category: 'OPERATIONS',
      notes: '',
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (t: any) => {
    setSelectedTask(t);
    setForm({
      id: String(t.id),
      title: t.title || '',
      description: t.description || '',
      priority: t.priority || 'MEDIUM',
      departmentId: t.departmentId ? String(t.departmentId) : '',
      employeeId: t.employeeId ? String(t.employeeId) : '',
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
      dueTime: t.dueTime || '06:30 PM',
      startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '',
      startTime: t.startTime || '',
      category: t.category || 'OPERATIONS',
      notes: t.notes || '',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenReview = (t: any) => {
    setSelectedTask(t);
    setRejectReason('');
    setIsReviewModalOpen(true);
  };

  const handleOpenReallocate = (t: any) => {
    setSelectedTask(t);
    setReallocateForm({
      employeeId: t.employeeId ? String(t.employeeId) : '',
      reason: '',
    });
    setIsReallocateModalOpen(true);
  };

  const handleOpenSubmitProof = (t: any) => {
    setSelectedTask(t);
    setProofForm({
      fileUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80',
      fileName: 'on_site_completion_proof.jpg',
      comment: 'Verified and signed document attached.',
    });
    setIsSubmitProofOpen(true);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. HERO CARD */}
      <AdminPageHero
        badge={{
          text: 'TASK MANAGEMENT',
          icon: CheckSquare,
          variant: 'emerald',
        }}
        title="Employee Tasks"
        description="Create, allocate and track employee tasks, priority levels and completion proof."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl border border-white/10 text-xs font-black transition-all cursor-pointer backdrop-blur-xs disabled:opacity-50 active:scale-95"
              title="Refresh tasks"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#23C45E]' : ''}`} />
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Task</span>
            </button>
          </div>
        }
      />

      {/* 2. CRITICAL ATTENTION REQUIRED BANNER (OVERDUE URGENT / HIGH) */}
      {(metrics.overdueUrgent > 0 || metrics.overdueHigh > 0) && (
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 rounded-3xl p-4 sm:p-5 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight flex items-center gap-2">
                <span>Immediate HR Attention Required</span>
                <span className="px-2 py-0.5 rounded-full bg-white/30 text-white text-[10px] font-black uppercase">
                  {metrics.overdueUrgent + metrics.overdueHigh} Critical
                </span>
              </h3>
              <p className="text-xs text-rose-100 font-medium">
                {metrics.overdueUrgent} Urgent and {metrics.overdueHigh} High priority task(s) are past their deadline and pending completion.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTab('OVERDUE');
              setPriorityFilter('URGENT');
            }}
            className="px-4 py-2 bg-white text-rose-700 hover:bg-rose-50 font-extrabold rounded-2xl text-xs shadow-xs shrink-0 cursor-pointer transition-colors"
          >
            Filter Critical Overdue Tasks
          </button>
        </div>
      )}

      {/* 3. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <AdminStatCard
          title="Total Tasks"
          value={isLoading ? '...' : metrics.total}
          description="All tasks"
          icon={CheckSquare}
          iconBg="primary"
        />
        <AdminStatCard
          title="Urgent Tasks"
          value={isLoading ? '...' : metrics.urgent}
          description="Highest priority"
          icon={Flame}
          iconBg="rose"
        />
        <AdminStatCard
          title="High Priority"
          value={isLoading ? '...' : metrics.high}
          description="Key deliverables"
          icon={Zap}
          iconBg="amber"
        />
        <AdminStatCard
          title="Awaiting Review"
          value={isLoading ? '...' : metrics.awaitingReview}
          description="Proof submitted"
          icon={ImageIcon}
          iconBg="purple"
        />
        <AdminStatCard
          title="Overdue"
          value={isLoading ? '...' : metrics.overdue}
          description="Past due deadline"
          icon={AlertTriangle}
          iconBg="rose"
        />
        <AdminStatCard
          title="Completed"
          value={isLoading ? '...' : metrics.completed}
          description="Approved by HR"
          icon={CheckCircle2}
          iconBg="primary"
        />
      </div>

      {/* 4. TASK STATUS TABS & FILTERS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { key: 'ALL', label: 'All Tasks', count: metrics.total },
            { key: 'PENDING', label: 'Pending', count: metrics.pending },
            { key: 'IN_PROGRESS', label: 'In Progress', count: metrics.inProgress },
            { key: 'UNDER_REVIEW', label: 'Awaiting Review', count: metrics.awaitingReview },
            { key: 'OVERDUE', label: 'Overdue', count: metrics.overdue },
            { key: 'COMPLETED', label: 'Completed', count: metrics.completed },
            { key: 'REJECTED', label: 'Rejected', count: metricsData?.rejected ?? 0 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === tab.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter Toolbar & Sort Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title, ID, employee..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">🔴 URGENT (Critical)</option>
            <option value="HIGH">🟠 HIGH (Important)</option>
            <option value="MEDIUM">🔵 MEDIUM (Standard)</option>
            <option value="LOW">⚪ LOW (Non-critical)</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={String(dept.id)}>
                {dept.name}
              </option>
            ))}
          </select>

          <select
            value={employeeFilter}
            onChange={(e) => {
              setEmployeeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Allocated Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={String(emp.id)}>
                {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`} ({emp.employeeCode})
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-xs font-black text-emerald-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="priority">⚡ Sort: Urgent First</option>
            <option value="dueDate">📅 Sort: Nearest Due Date</option>
            <option value="createdAt">🕒 Sort: Recently Created</option>
          </select>
        </div>
      </div>

      {/* 5. MAIN TASKS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-5">Task ID & Title</th>
                <th className="py-4 px-4">Priority</th>
                <th className="py-4 px-4">Allocated Employee</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Due Date & Time</th>
                <th className="py-4 px-4">Proof</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 font-bold animate-pulse">
                    Loading employee tasks...
                  </td>
                </tr>
              ) : tasks.length > 0 ? (
                tasks.map((task) => {
                  const empName = task.employee
                    ? `${task.employee.firstName} ${task.employee.lastName}`
                    : 'Unassigned';
                  const hasProof = task.hasProof || (task.proofs && task.proofs.length > 0);
                  const isUrgent = task.priority === 'URGENT';
                  const isHigh = task.priority === 'HIGH';

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isUrgent
                          ? 'bg-rose-50/30 border-l-4 border-l-rose-500'
                          : isHigh
                          ? 'border-l-4 border-l-amber-400'
                          : ''
                      }`}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shrink-0 shadow-2xs ${
                              isUrgent
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : isHigh
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}
                          >
                            {isUrgent ? (
                              <Flame className="w-5 h-5 text-rose-600 animate-pulse" />
                            ) : isHigh ? (
                              <Zap className="w-5 h-5 text-amber-600" />
                            ) : (
                              <CheckSquare className="w-5 h-5 text-[#1AA14D]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setViewingTaskId(task.id)}
                              className="font-extrabold text-slate-900 hover:text-[#1AA14D] text-sm truncate block transition-colors max-w-[280px] text-left cursor-pointer"
                            >
                              {task.title}
                            </button>
                            <span className="text-slate-400 font-medium text-[11px] block">
                              {task.taskNumber || `TSK-${task.id}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            task.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs animate-pulse'
                              : task.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : task.priority === 'MEDIUM'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {task.priority === 'URGENT' && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />}
                          {task.priority}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {task.employee ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 font-extrabold flex items-center justify-center text-xs shrink-0">
                              {task.employee.firstName?.[0] || 'E'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate">{empName}</p>
                              <p className="text-slate-400 text-[11px] truncate">
                                {task.employee.designation?.name || task.employee.employeeCode}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-bold italic">Unallocated</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              task.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-[#1AA14D] border border-emerald-200'
                                : task.status === 'UNDER_REVIEW' || task.status === 'SUBMITTED'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : task.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : task.status === 'IN_PROGRESS'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {task.status === 'UNDER_REVIEW' ? 'Awaiting Review' : task.status}
                          </span>

                          {task.isOverdue && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black uppercase animate-pulse">
                              OVERDUE
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-800">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No Due Date'}
                        </p>
                        <p className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {task.dueTime || '06:30 PM'}
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        {hasProof ? (
                          <button
                            onClick={() => handleOpenReview(task)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold text-xs transition-colors cursor-pointer border border-amber-200"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                            <span>Proof Attached</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 font-medium text-[11px] italic">No Proof</span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingTaskId(task.id)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                            title="View Full Task Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {(task.status === 'UNDER_REVIEW' || task.status === 'SUBMITTED' || hasProof) && (
                            <button
                              onClick={() => handleOpenReview(task)}
                              className="p-2 hover:bg-emerald-50 rounded-xl text-slate-500 hover:text-[#1AA14D] transition-colors cursor-pointer"
                              title="Review Completion Proof"
                            >
                              <CheckSquare className="w-4 h-4" />
                            </button>
                          )}

                          {task.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleOpenSubmitProof(task)}
                              className="p-2 hover:bg-blue-50 rounded-xl text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Upload / Submit Photo Proof"
                            >
                              <UploadCloud className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenReallocate(task)}
                            className="p-2 hover:bg-purple-50 rounded-xl text-slate-500 hover:text-purple-600 transition-colors cursor-pointer"
                            title="Reallocate Task"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(task)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Edit Task"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Archive task "${task.title}"?`)) {
                                deleteMutation.mutate(task.id);
                              }
                            }}
                            className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Archive Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <p className="font-bold text-sm text-slate-600">No tasks found</p>
                    <p className="text-xs text-slate-400 mt-1">Create and allocate new employee tasks</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination */}
        <AdminPagination
          page={page}
          pageSize={pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          disabled={isLoading}
        />
      </div>

      {/* 6. CREATE / EDIT TASK DRAWER */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={form.id ? 'Edit Employee Task' : 'Create & Allocate Task'}
        subtitle="Specify task scope, priority level, employee allocation, deadline, and proof requirements"
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          {/* Section 1: Task Details */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-[#23C45E]" /> Task Details & Priority
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Complete Client Onboarding Audit"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Description & Scope *</label>
                <textarea
                  rows={3}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed instructions on work required and mandatory photo proof checklist..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Priority Level *</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="URGENT">🔴 URGENT (Critical / Immediate)</option>
                  <option value="HIGH">🟠 HIGH (Important)</option>
                  <option value="MEDIUM">🔵 MEDIUM (Standard)</option>
                  <option value="LOW">⚪ LOW (Non-critical)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Category</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. OPERATIONS, AUDIT, CLIENT_SUPPORT"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Employee Allocation */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-600" /> Employee Allocation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Filter by Department</label>
                <select
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value, employeeId: '' })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="">-- All Departments --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Allocate Employee *</label>
                <select
                  required
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="">-- Select Active Employee --</option>
                  {availableEmployees.map((emp) => (
                    <option key={emp.id} value={String(emp.id)}>
                      {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`} ({emp.employeeCode}) - {emp.designation?.name || 'Staff'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Due Date & Time */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" /> Deadline & Schedule
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Due Time *</label>
                <input
                  type="text"
                  required
                  value={form.dueTime}
                  onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
                  placeholder="e.g. 06:30 PM"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Internal Instructions & Photo Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Note: Photo proof of signed completion slip is mandatory for task approval."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md shadow-[#23C45E]/20"
            >
              {saveMutation.isPending ? 'Saving...' : form.id ? 'Save Changes' : 'Create & Allocate'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* 7. REVIEW PROOF MODAL (APPROVE / REJECT) */}
      <AdminFormDrawer
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Review Task Completion Proof"
        subtitle={selectedTask ? `Task: ${selectedTask.title} (${selectedTask.taskNumber || selectedTask.id})` : ''}
        size="lg"
      >
        {selectedTask && (
          <div className="space-y-5">
            {/* Task Info Snippet */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 text-sm">{selectedTask.title}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                  {selectedTask.status}
                </span>
              </div>
              <p className="text-slate-600 font-medium">{selectedTask.description}</p>
              <div className="flex items-center gap-4 text-slate-500 pt-1 text-[11px] font-semibold">
                <span>Priority: <strong>{selectedTask.priority}</strong></span>
                <span>Employee: {selectedTask.employee ? `${selectedTask.employee.firstName} ${selectedTask.employee.lastName}` : 'Unassigned'}</span>
                <span>Due: {selectedTask.dueTime} {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : ''}</span>
              </div>
            </div>

            {/* Uploaded Photo Proof Gallery */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#23C45E]" /> Uploaded Completion Proof Photo(s)
              </h4>

              {selectedTask.proofs && selectedTask.proofs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedTask.proofs.map((proof: any) => (
                    <div key={proof.id} className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs space-y-2">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-100 group">
                        <img
                          src={proof.fileUrl}
                          alt="Proof attachment"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                          onClick={() => setPreviewImage(proof.fileUrl)}
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewImage(proof.fileUrl)}
                          className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black text-white text-[10px] font-bold backdrop-blur-xs flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Zoom
                        </button>
                      </div>
                      <div className="text-[11px] space-y-0.5">
                        <p className="font-bold text-slate-900 truncate">{proof.fileName || 'proof_photo.jpg'}</p>
                        {proof.comment && <p className="text-slate-600 italic font-medium">&quot;{proof.comment}&quot;</p>}
                        <p className="text-slate-400 text-[10px]">
                          Uploaded: {proof.uploadedAt && !isNaN(new Date(proof.uploadedAt).getTime()) ? new Date(proof.uploadedAt).toLocaleString() : 'Recent'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-rose-50 rounded-2xl border border-rose-100 p-4">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                  <p className="text-xs font-black text-rose-800">No Photo Proof Attached</p>
                  <p className="text-[11px] text-rose-600 mt-0.5 font-medium">
                    Photo proof is mandatory for task verification.
                  </p>
                </div>
              )}
            </div>

            {/* Rejection Reason Form */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-[11px] font-bold text-slate-700 block">
                Rejection Reason (Required only if rejecting proof)
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Photo proof is blurry or incomplete. Please re-upload signed document."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            {/* Actions: Approve / Reject */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={rejectMutation.isPending}
                  onClick={() => {
                    if (!rejectReason.trim()) {
                      toast.error('Please enter a rejection reason.');
                      return;
                    }
                    rejectMutation.mutate({ taskId: selectedTask.id, reason: rejectReason });
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  <X className="w-4 h-4" />
                  <span>{rejectMutation.isPending ? 'Rejecting...' : 'Reject Proof'}</span>
                </button>

                <button
                  type="button"
                  disabled={approveMutation.isPending}
                  onClick={() => approveMutation.mutate(selectedTask.id)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md shadow-[#23C45E]/20 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{approveMutation.isPending ? 'Approving...' : 'Approve & Mark Completed'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminFormDrawer>

      {/* 8. REALLOCATE MODAL */}
      <AdminFormDrawer
        isOpen={isReallocateModalOpen}
        onClose={() => setIsReallocateModalOpen(false)}
        title="Reallocate Task"
        subtitle={selectedTask ? `Task: ${selectedTask.title}` : ''}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            reallocateMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Select New Employee *</label>
            <select
              required
              value={reallocateForm.employeeId}
              onChange={(e) => setReallocateForm({ ...reallocateForm, employeeId: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="">-- Select Active Employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={String(emp.id)}>
                  {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Reallocation Reason</label>
            <textarea
              rows={2}
              value={reallocateForm.reason}
              onChange={(e) => setReallocateForm({ ...reallocateForm, reason: e.target.value })}
              placeholder="e.g. Primary employee on sick leave, reassigning to senior executive..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsReallocateModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reallocateMutation.isPending}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs cursor-pointer"
            >
              {reallocateMutation.isPending ? 'Reallocating...' : 'Confirm Reallocation'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* 9. SUBMIT PROOF MODAL (MANDATORY PHOTO) */}
      <AdminFormDrawer
        isOpen={isSubmitProofOpen}
        onClose={() => setIsSubmitProofOpen(false)}
        title="Submit Completion Photo Proof"
        subtitle={selectedTask ? `For: ${selectedTask.title}` : ''}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitProofMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-medium">
            ⚠️ <strong>Mandatory Rule:</strong> Photo attachment is compulsory. The task cannot be submitted for completion without uploading at least one photo.
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Photo Proof URL *</label>
            <input
              type="text"
              required
              value={proofForm.fileUrl}
              onChange={(e) => setProofForm({ ...proofForm, fileUrl: e.target.value })}
              placeholder="https://res.cloudinary.com/... or uploaded photo link"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          {proofForm.fileUrl && (
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
              <img src={proofForm.fileUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Completion Comments</label>
            <textarea
              rows={2}
              value={proofForm.comment}
              onChange={(e) => setProofForm({ ...proofForm, comment: e.target.value })}
              placeholder="Explain how the work was completed..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsSubmitProofOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitProofMutation.isPending}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md shadow-[#23C45E]/20"
            >
              {submitProofMutation.isPending ? 'Submitting...' : 'Submit for HR Review'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* 10. IMAGE ZOOM PREVIEW MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden border border-white/20 p-2">
            <img src={previewImage} alt="Full resolution proof" className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Task Details Right-Side Drawer */}
      <TaskDetailsDrawer
        taskId={viewingTaskId}
        isOpen={!!viewingTaskId}
        onClose={() => setViewingTaskId(null)}
        onEdit={(t) => {
          setSelectedTask(t);
          setForm({
            id: String(t.id),
            title: t.title || '',
            description: t.description || '',
            priority: t.priority || 'MEDIUM',
            departmentId: t.departmentId ? String(t.departmentId) : '',
            employeeId: t.employeeId ? String(t.employeeId) : '',
            dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
            dueTime: t.dueTime || '06:30 PM',
            startDate: t.startDate ? t.startDate.split('T')[0] : '',
            startTime: t.startTime || '09:00 AM',
            category: t.category || 'OPERATIONS',
            notes: t.notes || '',
          });
          setIsDrawerOpen(true);
        }}
      />
    </div>
  );
}
