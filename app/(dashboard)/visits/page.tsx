'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  User,
  Building,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Edit,
  RefreshCw,
  Sparkles,
  AlertCircle,
  DollarSign,
  Phone,
  Navigation,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  AdminPageHeader,
  AdminButton,
  AdminStatCard,
  AdminFormDrawer,
  AdminPagination,
  VisitDetailsDrawer,
  CompanyDetailsDrawer,
} from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

export default function VisitsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [employeeFilter, setEmployeeFilter] = useState('ALL');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals / Drawers
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [viewingVisitId, setViewingVisitId] = useState<number | string | null>(null);
  const [viewingCompanyId, setViewingCompanyId] = useState<number | string | null>(null);

  // Form State
  const [form, setForm] = useState({
    id: '',
    customerName: '',
    purpose: '',
    visitType: 'CLIENT_MEETING',
    date: new Date().toISOString().split('T')[0],
    time: '10:30 AM',
    location: '',
    latitude: 0,
    longitude: 0,
    companyId: '',
    contactId: '',
    leadId: '',
    dealId: '',
    employeeId: '',
    status: 'SCHEDULED',
    notes: '',
    outcome: '',
    nextFollowUpDate: '',
  });

  // 1. Fetch Visits
  const { data: visitsResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-visits-list', search, statusFilter, employeeFilter, companyFilter, page, pageSize],
    queryFn: async () => {
      try {
        const res: any = await api.get('/visits', {
          params: {
            search: search || undefined,
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            employeeId: employeeFilter !== 'ALL' ? employeeFilter : undefined,
            companyId: companyFilter !== 'ALL' ? companyFilter : undefined,
            page,
            limit: pageSize,
          },
        });
        const items = res?.data?.items || res?.data?.data || res?.items || res?.data || (Array.isArray(res) ? res : []);
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

  const visits: any[] = visitsResponse?.items || [];
  const pagination = visitsResponse?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  // 2. Fetch Metrics
  const { data: metricsData } = useQuery({
    queryKey: ['admin-visits-metrics'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/visits/metrics');
        return res?.data || res;
      } catch {
        return null;
      }
    },
  });

  // 3. Fetch Companies for dropdown
  const { data: companiesData } = useQuery({
    queryKey: ['admin-companies-dropdown'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/companies', { params: { limit: 100 } });
        const items = res?.data?.data || res?.data?.items || res?.data || res;
        return Array.isArray(items) ? items : [];
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

  const companies: any[] = Array.isArray(companiesData) ? companiesData : [];
  const employees: any[] = Array.isArray(employeesData) ? employeesData : [];

  const metrics = {
    today: metricsData?.today ?? 0,
    upcoming: metricsData?.upcoming ?? visits.filter((v) => v.status === 'SCHEDULED').length,
    completed: metricsData?.completed ?? visits.filter((v) => v.status === 'COMPLETED').length,
    cancelled: metricsData?.cancelled ?? visits.filter((v) => v.status === 'CANCELLED').length,
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        customerName: form.customerName.trim() || 'Client Meeting',
        purpose: form.purpose.trim() || 'Client On-site Visit',
        visitType: form.visitType || 'CLIENT_MEETING',
        date: new Date(form.date).toISOString(),
        time: form.time || '10:00 AM',
        location: form.location.trim() || 'Client Office',
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        companyId: form.companyId || undefined,
        contactId: form.contactId || undefined,
        leadId: form.leadId || undefined,
        dealId: form.dealId || undefined,
        employeeId: form.employeeId || undefined,
        status: form.status || 'SCHEDULED',
        notes: form.notes.trim() || undefined,
        outcome: form.outcome.trim() || undefined,
        nextFollowUpDate: form.nextFollowUpDate ? new Date(form.nextFollowUpDate).toISOString() : undefined,
      };

      if (form.id) {
        return api.patch(`/visits/${form.id}`, payload);
      } else {
        return api.post('/visits', payload);
      }
    },
    onSuccess: () => {
      toast.success(form.id ? 'Visit updated successfully' : 'Visit scheduled successfully');
      setIsDrawerOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-visits-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-visits-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Quick Status Update Mutation (Complete / Cancel)
  const quickStatusMutation = useMutation({
    mutationFn: async ({ id, status, outcome }: { id: number | string; status: string; outcome?: string }) => {
      return api.patch(`/visits/${id}`, { status, outcome });
    },
    onSuccess: (_, vars) => {
      toast.success(`Visit marked as ${vars.status}`);
      queryClient.invalidateQueries({ queryKey: ['admin-visits-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-visits-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      return api.delete(`/visits/${id}`);
    },
    onSuccess: () => {
      toast.success('Visit removed successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-visits-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-visits-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const resetForm = () => {
    setForm({
      id: '',
      customerName: '',
      purpose: '',
      visitType: 'CLIENT_MEETING',
      date: new Date().toISOString().split('T')[0],
      time: '10:30 AM',
      location: '',
      latitude: 0,
      longitude: 0,
      companyId: '',
      contactId: '',
      leadId: '',
      dealId: '',
      employeeId: '',
      status: 'SCHEDULED',
      notes: '',
      outcome: '',
      nextFollowUpDate: '',
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (v: any) => {
    setSelectedVisit(v);
    setForm({
      id: String(v.id),
      customerName: v.customerName || v.clientName || '',
      purpose: v.purpose || '',
      visitType: v.visitType || 'CLIENT_MEETING',
      date: v.date ? new Date(v.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      time: v.time || '10:30 AM',
      location: v.location || '',
      latitude: v.latitude || 0,
      longitude: v.longitude || 0,
      companyId: v.companyId ? String(v.companyId) : '',
      contactId: v.contactId ? String(v.contactId) : '',
      leadId: v.leadId ? String(v.leadId) : '',
      dealId: v.dealId ? String(v.dealId) : '',
      employeeId: v.employeeId ? String(v.employeeId) : '',
      status: v.status || 'SCHEDULED',
      notes: v.notes || '',
      outcome: v.outcome || '',
      nextFollowUpDate: v.nextFollowUpDate ? new Date(v.nextFollowUpDate).toISOString().split('T')[0] : '',
    });
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. STANDARD PAGE HEADER */}
      <AdminPageHeader
        title="Visits"
        description="Track client field meetings, on-site audits, GPS check-ins and executive visits."
        icon={Navigation}
        iconColor="text-[#1AA14D]"
        badge={{
          text: 'CLIENT FIELD VISITS',
          icon: Navigation,
          variant: 'emerald',
        }}
        breadcrumbs={[
          { label: 'Workforce', href: '/employees' },
          { label: 'Visits' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <AdminButton
              variant="outline"
              size="md"
              icon={RefreshCw}
              loading={isFetching}
              onClick={() => refetch()}
              title="Refresh visits"
            >
              Refresh
            </AdminButton>

            <AdminButton
              variant="primary"
              size="md"
              icon={Plus}
              onClick={handleOpenCreate}
            >
              Schedule Visit
            </AdminButton>
          </div>
        }
      />

      {/* 2. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminStatCard
          title="Today's Visits"
          value={isLoading ? '...' : metrics.today}
          description="Scheduled for today"
          icon={Calendar}
          iconBg="primary"
        />
        <AdminStatCard
          title="Upcoming Visits"
          value={isLoading ? '...' : metrics.upcoming}
          description="In dispatch queue"
          icon={Clock}
          iconBg="blue"
        />
        <AdminStatCard
          title="Completed"
          value={isLoading ? '...' : metrics.completed}
          description="Successfully concluded"
          icon={CheckCircle2}
          iconBg="primary"
        />
        <AdminStatCard
          title="Cancelled"
          value={isLoading ? '...' : metrics.cancelled}
          description="Rescheduled or cancelled"
          icon={XCircle}
          iconBg="rose"
        />
      </div>

      {/* 3. FILTER TOOLBAR */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by client, purpose, location..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <select
            value={employeeFilter}
            onChange={(e) => {
              setEmployeeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Representatives</option>
            {employees.map((emp) => (
              <option key={emp.id} value={String(emp.id)}>
                {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`} ({emp.employeeCode})
              </option>
            ))}
          </select>

          <select
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Companies</option>
            {companies.map((comp) => (
              <option key={comp.id} value={String(comp.id)}>
                {comp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. MAIN VISITS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-5">Client / Organization</th>
                <th className="py-4 px-4">Visit Purpose</th>
                <th className="py-4 px-4">Location</th>
                <th className="py-4 px-4">Date & Time</th>
                <th className="py-4 px-4">Assigned Visitor</th>
                <th className="py-4 px-4">Visited By</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 font-bold animate-pulse">
                    Loading client visits...
                  </td>
                </tr>
              ) : visits.length > 0 ? (
                visits.map((visit) => {
                  const clientName = visit.customerName || visit.clientName || 'Client Meeting';
                  const repName = visit.employee
                    ? `${visit.employee.firstName} ${visit.employee.lastName}`
                    : visit.employeeName || 'Assigned Visitor';
                  const visitedByName = visit.completedBy || (visit.status === 'COMPLETED' ? null : null);

                  return (
                    <tr key={visit.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center font-black shrink-0 shadow-2xs">
                            {clientName[0] || 'V'}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setViewingVisitId(visit.id)}
                              className="font-extrabold text-slate-900 hover:text-blue-600 text-sm truncate block transition-colors text-left cursor-pointer"
                            >
                              {clientName}
                            </button>
                            {visit.company && (
                              <button
                                type="button"
                                onClick={() => setViewingCompanyId(visit.company.id)}
                                className="text-slate-400 hover:text-purple-600 font-medium text-[11px] flex items-center gap-1 text-left cursor-pointer"
                              >
                                <Building className="w-3 h-3" /> {visit.company.name}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-800">
                        <p className="truncate max-w-[200px]">{visit.purpose || 'On-site Demonstration'}</p>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{visit.visitType || 'MEETING'}</span>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-800 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{visit.location || 'Client HQ'}</span>
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-800">
                          {visit.date ? new Date(visit.date).toLocaleDateString() : 'Today'}
                        </p>
                        <p className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {visit.time || '10:30 AM'}
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" /> {repName}
                        </span>
                        {visit.scheduledBy && (
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                            By: {visit.scheduledBy}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {visitedByName ? (
                          <span className="font-extrabold text-[#1AA14D] text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#1AA14D]" /> {visitedByName}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            visit.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-[#1AA14D] border border-emerald-200'
                              : visit.status === 'CANCELLED'
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : visit.status === 'IN_PROGRESS'
                              ? 'bg-amber-50 text-amber-600 border border-amber-200'
                              : 'bg-blue-50 text-blue-600 border border-blue-200'
                          }`}
                        >
                          {visit.status || 'SCHEDULED'}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingVisitId(visit.id)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                            title="View Visit Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {visit.status !== 'COMPLETED' && (
                            <button
                              onClick={() => {
                                const outcome = prompt('Enter meeting outcome / key takeaways:');
                                if (outcome !== null) {
                                  quickStatusMutation.mutate({ id: visit.id, status: 'COMPLETED', outcome });
                                }
                              }}
                              className="p-2 hover:bg-emerald-50 rounded-xl text-slate-500 hover:text-[#1AA14D] transition-colors cursor-pointer"
                              title="Mark as Completed"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(visit)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Edit Visit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Remove visit record for "${clientName}"?`)) {
                                deleteMutation.mutate(visit.id);
                              }
                            }}
                            className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove Visit"
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
                    <p className="font-bold text-sm text-slate-600">No client visits found</p>
                    <p className="text-xs text-slate-400 mt-1">Schedule new field meetings or link from contacts</p>
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

      {/* 5. SCHEDULE / EDIT VISIT DRAWER */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={form.id ? 'Edit Visit Schedule' : 'Schedule Client Visit'}
        subtitle="Manage on-site visit details, assignment, and location info"
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-blue-600" /> Client & Purpose
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Client / Meeting Name *</label>
                <input
                  type="text"
                  required
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="e.g. Apex Tech Solutions HQ Visit"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Visit Purpose *</label>
                <input
                  type="text"
                  required
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  placeholder="e.g. Enterprise Solution Presentation"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Visit Type</label>
                <select
                  value={form.visitType}
                  onChange={(e) => setForm({ ...form, visitType: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="CLIENT_MEETING">Client Meeting</option>
                  <option value="DEMO">Product Demo</option>
                  <option value="AUDIT">On-site Audit</option>
                  <option value="SUPPORT">Technical Support</option>
                  <option value="CLOSING">Contract Closing</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Associated Company</label>
                <select
                  value={form.companyId}
                  onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="">-- No Company --</option>
                  {companies.map((comp) => (
                    <option key={comp.id} value={String(comp.id)}>
                      {comp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Assigned Field Representative</label>
                <select
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="">-- Select Field Rep --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={String(emp.id)}>
                      {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#23C45E]" /> Schedule & Location
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Time *</label>
                <input
                  type="text"
                  required
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  placeholder="e.g. 11:00 AM"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Location Address *</label>
                <input
                  type="text"
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. BKC Business Tower, Floor 4, Mumbai"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> Status & Notes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Next Follow-up Date</label>
                <input
                  type="date"
                  value={form.nextFollowUpDate}
                  onChange={(e) => setForm({ ...form, nextFollowUpDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Meeting Notes & Outcome</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Key discussion points or deliverables..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>
            </div>
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
              {saveMutation.isPending ? 'Saving...' : form.id ? 'Save Changes' : 'Confirm Visit Schedule'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* Visit Details Right-Side Drawer */}
      <VisitDetailsDrawer
        visitId={viewingVisitId}
        isOpen={!!viewingVisitId}
        onClose={() => setViewingVisitId(null)}
      />

      {/* Company Details Right-Side Drawer */}
      <CompanyDetailsDrawer
        companyId={viewingCompanyId}
        isOpen={!!viewingCompanyId}
        onClose={() => setViewingCompanyId(null)}
      />
    </div>
  );
}
