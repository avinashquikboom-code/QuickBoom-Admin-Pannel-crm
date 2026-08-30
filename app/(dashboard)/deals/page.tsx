'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  DollarSign,
  Briefcase,
  TrendingUp,
  Award,
  Calendar,
  Building,
  User,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Edit,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  ChevronRight,
  Filter,
  BarChart3,
  Kanban,
  Table as TableIcon,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  AdminPageHero,
  AdminStatCard,
  AdminFormDrawer,
  AdminPagination,
  DealDetailsDrawer,
  CompanyDetailsDrawer,
} from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

export default function DealsPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'KANBAN' | 'TABLE'>('KANBAN');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [assignedFilter, setAssignedFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals & Drawers
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMoveStageOpen, setIsMoveStageOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [viewingDealId, setViewingDealId] = useState<number | string | null>(null);
  const [viewingCompanyId, setViewingCompanyId] = useState<number | string | null>(null);

  // Form State
  const [form, setForm] = useState({
    id: '',
    title: '',
    amount: 150000,
    currency: 'INR',
    probability: 50,
    companyId: '',
    contactId: '',
    leadId: '',
    assignedToId: '',
    stageId: '',
    pipelineId: '',
    expectedClosing: '',
    source: 'CRM',
    description: '',
    notes: '',
  });

  // Stage Move Form
  const [moveStageForm, setMoveStageForm] = useState({
    stageId: '',
    isWon: false,
    isLost: false,
    lostReason: '',
  });

  // 1. Fetch Deals
  const { data: dealsResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-deals-list', search, stageFilter, statusFilter, assignedFilter, page, pageSize],
    queryFn: async () => {
      try {
        const res: any = await api.get('/deals', {
          params: {
            search: search || undefined,
            stageId: stageFilter !== 'ALL' ? stageFilter : undefined,
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            assignedToId: assignedFilter !== 'ALL' ? assignedFilter : undefined,
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

  const deals: any[] = dealsResponse?.items || [];
  const pagination = dealsResponse?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  // 2. Fetch Metrics
  const { data: metricsData } = useQuery({
    queryKey: ['admin-deals-metrics'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/deals/metrics');
        return res?.data || res;
      } catch {
        return null;
      }
    },
  });

  // 3. Fetch Companies
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

  // 4. Fetch Contacts
  const { data: contactsData } = useQuery({
    queryKey: ['admin-contacts-dropdown'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/contacts', { params: { limit: 100 } });
        const items = res?.data?.data || res?.data?.items || res?.data || res;
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
  });

  // 5. Fetch Employees
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
  const contacts: any[] = Array.isArray(contactsData) ? contactsData : [];
  const employees: any[] = Array.isArray(employeesData) ? employeesData : [];

  const metrics = {
    total: metricsData?.total ?? deals.length,
    open: metricsData?.open ?? deals.filter((d) => !d.isWon && !d.isLost).length,
    pipelineValue: metricsData?.pipelineValue ?? 0,
    wonValue: metricsData?.wonValue ?? 0,
  };

  // Pipeline Stages Definition (Dynamic / Fallback)
  const defaultStages = [
    { id: '1', name: 'Qualified', color: 'border-blue-300 bg-blue-50/60 text-blue-700' },
    { id: '2', name: 'Proposal', color: 'border-purple-300 bg-purple-50/60 text-purple-700' },
    { id: '3', name: 'Negotiation', color: 'border-amber-300 bg-amber-50/60 text-amber-700' },
    { id: '4', name: 'Won', color: 'border-emerald-300 bg-emerald-50/60 text-emerald-700' },
  ];

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim() || 'New Deal',
        amount: Number(form.amount),
        currency: form.currency || 'INR',
        probability: Number(form.probability),
        companyId: form.companyId || undefined,
        contactId: form.contactId || undefined,
        leadId: form.leadId || undefined,
        assignedToId: form.assignedToId || undefined,
        stageId: form.stageId || undefined,
        pipelineId: form.pipelineId || undefined,
        expectedClosing: form.expectedClosing ? new Date(form.expectedClosing).toISOString() : undefined,
        source: form.source || 'CRM',
        description: form.description.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      if (form.id) {
        return api.patch(`/deals/${form.id}`, payload);
      } else {
        return api.post('/deals', payload);
      }
    },
    onSuccess: () => {
      toast.success(form.id ? 'Deal updated successfully' : 'Deal created in pipeline');
      setIsDrawerOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-deals-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-deals-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Move Stage Mutation
  const moveStageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDeal) return;
      return api.patch(`/deals/${selectedDeal.id}/stage`, {
        stageId: moveStageForm.stageId,
        isWon: moveStageForm.isWon,
        isLost: moveStageForm.isLost,
      });
    },
    onSuccess: () => {
      toast.success('Deal stage updated');
      setIsMoveStageOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-deals-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-deals-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Mark Won / Lost Quick Mutations
  const markDealStatus = async (deal: any, isWon: boolean, isLost: boolean) => {
    try {
      await api.patch(`/deals/${deal.id}`, { isWon, isLost });
      toast.success(isWon ? '🎉 Deal marked as WON!' : 'Deal marked as LOST');
      queryClient.invalidateQueries({ queryKey: ['admin-deals-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-deals-metrics'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      return api.delete(`/deals/${id}`);
    },
    onSuccess: () => {
      toast.success('Deal archived');
      queryClient.invalidateQueries({ queryKey: ['admin-deals-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-deals-metrics'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const resetForm = () => {
    setForm({
      id: '',
      title: '',
      amount: 150000,
      currency: 'INR',
      probability: 50,
      companyId: '',
      contactId: '',
      leadId: '',
      assignedToId: '',
      stageId: '',
      pipelineId: '',
      expectedClosing: '',
      source: 'CRM',
      description: '',
      notes: '',
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (d: any) => {
    setSelectedDeal(d);
    setForm({
      id: String(d.id),
      title: d.title || '',
      amount: Number(d.amount || 0),
      currency: d.currency || 'INR',
      probability: Number(d.probability || 50),
      companyId: d.companyId ? String(d.companyId) : '',
      contactId: d.contactId ? String(d.contactId) : '',
      leadId: d.leadId ? String(d.leadId) : '',
      assignedToId: d.assignedToId ? String(d.assignedToId) : '',
      stageId: d.stageId ? String(d.stageId) : '',
      pipelineId: d.pipelineId ? String(d.pipelineId) : '',
      expectedClosing: d.expectedClosing ? new Date(d.expectedClosing).toISOString().split('T')[0] : '',
      source: d.source || 'CRM',
      description: d.description || '',
      notes: d.notes || '',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenMoveStage = (d: any) => {
    setSelectedDeal(d);
    setMoveStageForm({
      stageId: d.stageId ? String(d.stageId) : '1',
      isWon: d.isWon || false,
      isLost: d.isLost || false,
      lostReason: d.lostReason || '',
    });
    setIsMoveStageOpen(true);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 text-slate-800 animate-in fade-in-50 duration-200">
      {/* 1. HERO CARD */}
      <AdminPageHero
        badge={{
          text: 'REVENUE PIPELINE',
          icon: TrendingUp,
          variant: 'emerald',
        }}
        title="Deals"
        description="Track pipeline opportunities, stages, deal amounts, win/loss probabilities and revenue forecasts."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/10 p-1 rounded-2xl border border-white/10 backdrop-blur-xs">
              <button
                onClick={() => setViewMode('KANBAN')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'KANBAN' ? 'bg-[#23C45E] text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'TABLE' ? 'bg-[#23C45E] text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl border border-white/10 text-xs font-black transition-all cursor-pointer backdrop-blur-xs disabled:opacity-50 active:scale-95"
              title="Refresh deals"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#23C45E]' : ''}`} />
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Deal</span>
            </button>
          </div>
        }
      />

      {/* 2. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Deals"
          value={isLoading ? '...' : metrics.total}
          description="In all sales stages"
          icon={Briefcase}
          iconBg="primary"
        />
        <AdminStatCard
          title="Open Opportunities"
          value={isLoading ? '...' : metrics.open}
          description="Active negotiation"
          icon={Sparkles}
          iconBg="blue"
        />
        <AdminStatCard
          title="Pipeline Value"
          value={isLoading ? '...' : `₹${Number(metrics.pipelineValue || 0).toLocaleString('en-IN')}`}
          description="Potential active revenue"
          icon={TrendingUp}
          iconBg="purple"
        />
        <AdminStatCard
          title="Won Revenue"
          value={isLoading ? '...' : `₹${Number(metrics.wonValue || 0).toLocaleString('en-IN')}`}
          description="Closed won deals"
          icon={Award}
          iconBg="primary"
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
              placeholder="Search deals by title, company, value..."
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
            <option value="ALL">All Outcomes (Open / Won / Lost)</option>
            <option value="OPEN">OPEN DEALS</option>
            <option value="WON">WON</option>
            <option value="LOST">LOST</option>
          </select>

          <select
            value={assignedFilter}
            onChange={(e) => {
              setAssignedFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Deal Owners</option>
            {employees.map((emp) => (
              <option key={emp.id} value={String(emp.id)}>
                {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`} ({emp.employeeCode})
              </option>
            ))}
          </select>

          <select
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          >
            <option value="ALL">All Stages</option>
            <option value="1">Qualified</option>
            <option value="2">Proposal</option>
            <option value="3">Negotiation</option>
            <option value="4">Won</option>
          </select>
        </div>
      </div>

      {/* 4. MAIN CONTENT: KANBAN vs TABLE VIEW */}
      {viewMode === 'KANBAN' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {defaultStages.map((stage) => {
            const stageDeals = deals.filter((d) => {
              if (stage.name === 'Won') return d.isWon || d.stage?.name?.toLowerCase() === 'won' || String(d.stageId) === stage.id;
              if (stage.name === 'Negotiation') return d.stage?.name?.toLowerCase() === 'negotiation' || String(d.stageId) === '3';
              if (stage.name === 'Proposal') return d.stage?.name?.toLowerCase() === 'proposal' || String(d.stageId) === '2';
              return !d.isWon && (d.stage?.name?.toLowerCase() === 'qualified' || String(d.stageId) === '1' || !d.stageId);
            });

            const stageTotalAmount = stageDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

            return (
              <div
                key={stage.id}
                className="bg-slate-100/80 rounded-3xl p-4 border border-slate-200/80 space-y-3 min-h-[500px]"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs uppercase tracking-wider text-slate-800">{stage.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-slate-700 font-extrabold text-[10px] shadow-2xs">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="font-extrabold text-xs text-slate-700">
                    ₹{Number(stageTotalAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Stage Cards */}
                <div className="space-y-3">
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all text-xs space-y-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingDealId(deal.id)}
                          className="font-extrabold text-slate-900 group-hover:text-[#1AA14D] text-sm leading-snug line-clamp-2 text-left cursor-pointer"
                        >
                          {deal.title}
                        </button>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[#1AA14D] font-extrabold text-[10px] shrink-0">
                          {deal.probability}%
                        </span>
                      </div>

                      <div className="space-y-1 text-slate-500 font-medium">
                        {deal.company && (
                          <button
                            type="button"
                            onClick={() => setViewingCompanyId(deal.company.id)}
                            className="flex items-center gap-1.5 text-slate-700 font-bold hover:text-blue-600 text-left cursor-pointer"
                          >
                            <Building className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span className="truncate">{deal.company.name}</span>
                          </button>
                        )}
                        {deal.contact && (
                          <p className="flex items-center gap-1.5 text-[11px]">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{deal.contact.firstName} {deal.contact.lastName}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <p className="font-black text-slate-900 text-sm">
                          ₹{Number(deal.amount || 0).toLocaleString('en-IN')}
                        </p>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenMoveStage(deal)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                            title="Move Stage"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(deal)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                            title="Edit Deal"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="py-12 text-center text-slate-400 text-xs font-bold">
                      No deals in {stage.name}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-5">Deal Opportunity</th>
                  <th className="py-4 px-4">Organization</th>
                  <th className="py-4 px-4">Deal Amount</th>
                  <th className="py-4 px-4">Stage</th>
                  <th className="py-4 px-4">Probability</th>
                  <th className="py-4 px-4">Owner</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400 font-bold animate-pulse">
                      Loading pipeline deals...
                    </td>
                  </tr>
                ) : deals.length > 0 ? (
                  deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center font-black shrink-0 shadow-2xs">
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setViewingDealId(deal.id)}
                              className="font-extrabold text-slate-900 hover:text-purple-600 text-sm truncate block transition-colors text-left cursor-pointer"
                            >
                              {deal.title}
                            </button>
                            <p className="text-slate-400 font-medium text-[11px]">#{deal.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {deal.company ? (
                          <button
                            type="button"
                            onClick={() => setViewingCompanyId(deal.company.id)}
                            className="font-bold text-slate-800 hover:text-blue-600 flex items-center gap-1 text-left cursor-pointer"
                          >
                            <Building className="w-3.5 h-3.5 text-purple-600" /> {deal.company.name}
                          </button>
                        ) : (
                          <span className="text-slate-400 font-bold italic">Individual Account</span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-black text-slate-900 text-sm">
                        ₹{Number(deal.amount || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase">
                          {deal.stage?.name || 'Pipeline'}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-700">
                        {deal.probability}%
                      </td>

                      <td className="py-4 px-4">
                        {deal.assignedTo ? (
                          <span className="font-bold text-slate-800">
                            {deal.assignedTo.firstName} {deal.assignedTo.lastName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingDealId(deal.id)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-purple-600 transition-colors cursor-pointer"
                            title="View Deal"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {!deal.isWon && (
                            <button
                              onClick={() => markDealStatus(deal, true, false)}
                              className="p-2 hover:bg-emerald-50 rounded-xl text-slate-500 hover:text-[#1AA14D] transition-colors cursor-pointer"
                              title="Mark as Won"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(deal)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Edit Deal"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Archive deal "${deal.title}"?`)) {
                                deleteMutation.mutate(deal.id);
                              }
                            }}
                            className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Archive Deal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <p className="font-bold text-sm text-slate-600">No deals found</p>
                      <p className="text-xs text-slate-400 mt-1">Create new pipeline opportunities</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Server-Side Pagination for Table View */}
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
      )}

      {/* 5. ADD / EDIT DEAL DRAWER */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={form.id ? 'Edit Deal Opportunity' : 'Add New Deal'}
        subtitle="Manage deal details, value, pipeline stage, and assignments"
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
              <DollarSign className="w-3.5 h-3.5 text-[#23C45E]" /> Deal Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Enterprise Cloud ERP Deployment"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Deal Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Win Probability (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.probability}
                  onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Expected Closing Date</label>
                <input
                  type="date"
                  value={form.expectedClosing}
                  onChange={(e) => setForm({ ...form, expectedClosing: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Pipeline Stage</label>
                <select
                  value={form.stageId}
                  onChange={(e) => setForm({ ...form, stageId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="">-- Default (Qualified) --</option>
                  <option value="1">Qualified (25%)</option>
                  <option value="2">Proposal (50%)</option>
                  <option value="3">Negotiation (75%)</option>
                  <option value="4">Won (100%)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-purple-600" /> Account Affiliation & Ownership
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Primary Contact Person</label>
                <select
                  value={form.contactId}
                  onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="">-- No Contact --</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.firstName} {c.lastName} ({c.company?.name || 'Direct'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Assigned Deal Owner</label>
                <select
                  value={form.assignedToId}
                  onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="">-- Unassigned --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={String(emp.id)}>
                      {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Source</label>
                <input
                  type="text"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Deal Notes & Scope</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Key contract conditions, deliverables..."
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
              {saveMutation.isPending ? 'Saving...' : form.id ? 'Save Changes' : 'Create Deal'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* 6. MOVE STAGE MODAL */}
      <AdminFormDrawer
        isOpen={isMoveStageOpen}
        onClose={() => setIsMoveStageOpen(false)}
        title="Update Deal Stage"
        subtitle={selectedDeal ? `Deal: ${selectedDeal.title}` : ''}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            moveStageMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Select Stage *</label>
            <select
              value={moveStageForm.stageId}
              onChange={(e) => setMoveStageForm({ ...moveStageForm, stageId: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            >
              <option value="1">1. Qualified (25%)</option>
              <option value="2">2. Proposal (50%)</option>
              <option value="3">3. Negotiation (75%)</option>
              <option value="4">4. Won (100%)</option>
            </select>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={moveStageForm.isWon}
                onChange={(e) => setMoveStageForm({ ...moveStageForm, isWon: e.target.checked, isLost: false })}
                className="w-4 h-4 text-[#23C45E] rounded-md"
              />
              <span className="text-xs font-bold text-emerald-800">Mark deal as WON 🎉</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={moveStageForm.isLost}
                onChange={(e) => setMoveStageForm({ ...moveStageForm, isLost: e.target.checked, isWon: false })}
                className="w-4 h-4 text-rose-500 rounded-md"
              />
              <span className="text-xs font-bold text-rose-800">Mark deal as LOST</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsMoveStageOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={moveStageMutation.isPending}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs cursor-pointer"
            >
              {moveStageMutation.isPending ? 'Updating...' : 'Update Stage'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* Deal Details Right-Side Drawer */}
      <DealDetailsDrawer
        dealId={viewingDealId}
        isOpen={!!viewingDealId}
        onClose={() => setViewingDealId(null)}
        onEdit={(d) => {
          setSelectedDeal(d);
          setForm({
            id: d.id,
            title: d.title,
            amount: d.amount,
            currency: d.currency || 'INR',
            probability: d.probability || 60,
            stageId: d.stageId || '',
            pipelineId: d.pipelineId || '',
            companyId: d.companyId || '',
            contactId: d.contactId || '',
            leadId: d.leadId || '',
            assignedToId: d.assignedToId || '',
            expectedClosing: d.expectedCloseDate ? d.expectedCloseDate.split('T')[0] : '',
            source: d.source || 'INBOUND',
            description: d.description || '',
            notes: d.notes || '',
          });
          setIsDrawerOpen(true);
        }}
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
