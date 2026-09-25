'use client';

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCw,
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  User,
  Building2,
  Tag,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  AdminPageHeader,
  AdminStatCard,
  AdminPagination,
  AdminFormDrawer,
  CustomerDetailsDrawer,
} from '@/components/admin';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

interface ScheduleItem {
  id: number;
  customerId: number;
  customerName: string;
  planId?: number;
  planName: string;
  subscriptionId?: number;
  month: number;
  year: number;
  monthYear: string;
  startDate: string;
  endDate: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
  title: string;
  notes?: string;
  assignedEmployeeId?: number;
  assignedEmployee: string;
}

export default function SchedulesPage() {
  const queryClient = useQueryClient();

  const now = new Date();
  const [viewMode, setViewMode] = useState<'CALENDAR' | 'LIST'>('CALENDAR');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Drawer / Selection state
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [viewingCustomerId, setViewingCustomerId] = useState<number | string | null>(null);

  // 1. Fetch Calendar View
  const { data: calendarData = [], isLoading: isCalLoading } = useQuery({
    queryKey: ['schedules-calendar', selectedMonth, selectedYear, statusFilter],
    queryFn: async () => {
      try {
        const params: any = { month: selectedMonth, year: selectedYear };
        if (statusFilter !== 'ALL') params.status = statusFilter;
        let res: any;
        try {
          res = await api.get('/works/calendar', { params });
        } catch {
          res = await api.get('/schedules/calendar', { params });
        }
        const items = res?.data?.activities || res?.activities || res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
    enabled: viewMode === 'CALENDAR',
  });

  // 2. Fetch Directory List
  const { data: listResponse, isLoading: isListLoading, refetch } = useQuery({
    queryKey: ['schedules-list', selectedMonth, selectedYear, statusFilter, search, page, pageSize],
    queryFn: async () => {
      try {
        const params: any = { page, limit: pageSize };
        if (statusFilter !== 'ALL') params.status = statusFilter;
        if (search.trim()) params.search = search.trim();
        const res: any = await api.get('/schedules', { params });
        const items = res?.data?.data || res?.data?.items || res?.items || res?.data || (Array.isArray(res) ? res : []);
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

  const schedulesList: ScheduleItem[] = listResponse?.items || [];
  const pagination = listResponse?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  // Update Status Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await api.patch(`/schedules/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Schedule updated successfully');
      setSelectedSchedule(null);
      queryClient.invalidateQueries({ queryKey: ['schedules-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['schedules-list'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleMonthChange = (delta: number) => {
    let nextMonth = selectedMonth + delta;
    let nextYear = selectedYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    } else if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }
    setSelectedMonth(nextMonth);
    setSelectedYear(nextYear);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const currentMonthName = monthNames[selectedMonth - 1];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            COMPLETED
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            IN PROGRESS
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            OVERDUE
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black inline-flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black inline-flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            PLANNED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. PAGE HEADER */}
      <AdminPageHeader
        badge={{
          text: 'DELIVERY AUTOMATION',
          icon: CalendarIcon,
          variant: 'emerald',
        }}
        title="Monthly Delivery Schedules"
        description="Automated monthly execution calendars & client milestone tracks anchored to plan activation dates."
        icon={CalendarIcon}
        iconColor="text-emerald-600"
        breadcrumbs={[
          { label: 'Operations', href: '/dashboard' },
          { label: 'Schedules' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setViewMode('CALENDAR')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'CALENDAR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setViewMode('LIST')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'LIST' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Directory
              </button>
            </div>
          </div>
        }
      />

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Scheduled"
          value={pagination.total || calendarData.length}
          icon={Layers}
          iconBg="primary"
        />
        <AdminStatCard
          title="Planned"
          value={calendarData.filter((c: any) => c.status === 'PLANNED').length}
          icon={CalendarIcon}
          iconBg="amber"
        />
        <AdminStatCard
          title="In Progress"
          value={calendarData.filter((c: any) => c.status === 'IN_PROGRESS').length}
          icon={Clock}
          iconBg="blue"
        />
        <AdminStatCard
          title="Completed"
          value={calendarData.filter((c: any) => c.status === 'COMPLETED').length}
          icon={CheckCircle2}
          iconBg="primary"
        />
      </div>

      {/* 3. CONTROLS BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={() => handleMonthChange(-1)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 text-xs font-black text-slate-900">
              {currentMonthName} {selectedYear}
            </span>
            <button
              onClick={() => handleMonthChange(1)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLANNED">Planned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {viewMode === 'LIST' && (
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer or plan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
            />
          </div>
        )}
      </div>

      {/* 4. CALENDAR VIEW */}
      {viewMode === 'CALENDAR' ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-slate-900 text-base">
                {currentMonthName} {selectedYear} Execution Timeline
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Showing all active client schedules anchored to this monthly cycle.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {calendarData.length} Schedules
            </span>
          </div>

          {calendarData.length === 0 ? (
            <div className="py-20 text-center text-slate-400 font-bold text-xs space-y-2">
              <CalendarIcon className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
              <p>No schedules found for {currentMonthName} {selectedYear}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {calendarData.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedSchedule(item);
                    setEditStatus(item.status);
                    setEditNotes(item.notes || '');
                  }}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">{item.customerName}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">{item.planName}</p>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.assignedEmployee || 'Unassigned'}</span>
                    </div>
                    <span>
                      {new Date(item.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} -{' '}
                      {new Date(item.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 5. DIRECTORY LIST VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Schedule ID</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Plan</th>
                  <th className="px-4 py-3.5">Cycle Month</th>
                  <th className="px-4 py-3.5">Start Date</th>
                  <th className="px-4 py-3.5">End Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Assigned Employee</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {schedulesList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-400 font-bold">
                      No monthly schedules matching query.
                    </td>
                  </tr>
                ) : (
                  schedulesList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-4 font-mono font-bold text-slate-500">#{item.id}</td>
                      <td className="px-4 py-4 font-bold text-slate-900">{item.customerName}</td>
                      <td className="px-4 py-4">{item.planName}</td>
                      <td className="px-4 py-4 font-bold text-slate-700">{monthNames[item.month - 1]} {item.year}</td>
                      <td className="px-4 py-4 text-slate-500">{new Date(item.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-4 text-slate-500">{new Date(item.endDate).toLocaleDateString()}</td>
                      <td className="px-4 py-4">{getStatusBadge(item.status)}</td>
                      <td className="px-4 py-4">{item.assignedEmployee}</td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedSchedule(item);
                            setEditStatus(item.status);
                            setEditNotes(item.notes || '');
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition-all cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
            disabled={isListLoading}
          />
        </div>
      )}

      {/* 6. DETAIL / EDIT RIGHT-SIDE DRAWER */}
      <AdminFormDrawer
        isOpen={!!selectedSchedule}
        onClose={() => setSelectedSchedule(null)}
        title="Schedule Milestone"
        description={selectedSchedule ? `#${selectedSchedule.id} • ${selectedSchedule.monthYear}` : ''}
        icon={CalendarIcon}
        maxWidth="sm:max-w-[500px]"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setSelectedSchedule(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedSchedule) {
                  updateMutation.mutate({
                    id: selectedSchedule.id,
                    payload: {
                      status: editStatus,
                      notes: editNotes,
                    },
                  });
                }
              }}
              disabled={updateMutation.isPending}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        {selectedSchedule && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-200/80">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">Customer:</span>
                <button
                  type="button"
                  onClick={() => setViewingCustomerId(selectedSchedule.customerId)}
                  className="font-black text-slate-900 hover:text-[#1AA14D] cursor-pointer"
                >
                  {selectedSchedule.customerName}
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Plan:</span>
                <span className="font-bold text-slate-800">{selectedSchedule.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Cycle Window:</span>
                <span className="font-bold text-slate-800">
                  {new Date(selectedSchedule.startDate).toLocaleDateString()} - {new Date(selectedSchedule.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Assigned To:</span>
                <span className="font-bold text-slate-800">{selectedSchedule.assignedEmployee}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1.5">
                Update Execution Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#23C45E]"
              >
                <option value="PLANNED">PLANNED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="OVERDUE">OVERDUE</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1.5">
                Delivery Notes / Deliverables
              </label>
              <textarea
                rows={4}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add execution updates, reel links, or milestone notes..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#23C45E]"
              />
            </div>
          </div>
        )}
      </AdminFormDrawer>

      {/* Customer Details Right-Side Drawer */}
      <CustomerDetailsDrawer
        customerId={viewingCustomerId}
        isOpen={!!viewingCustomerId}
        onClose={() => setViewingCustomerId(null)}
      />
    </div>
  );
}
