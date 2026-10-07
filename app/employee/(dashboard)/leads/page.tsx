'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Trash2,
  Check,
  Phone,
  MapPin,
  Globe,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  X,
  Building2,
  CheckCircle2,
  AlertCircle,
  Filter,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
  Share2,
  Calendar,
  Mail,
  User,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import api from '@/lib/api';
import { useEmployeeAuthStore } from '@/lib/employee-store';
import { hasPermission } from '@/lib/access-control';
import { toast } from 'react-hot-toast';
import EmployeeSideSheet from '@/components/EmployeeSideSheet';

// ── Social Media URL Helper ───────────────────────────────────────────────────

function buildSocialUrl(platform: string, rawVal: any): string {
  if (!rawVal) return '#';
  const val = String(rawVal).trim();
  if (!val || val === 'N/A' || val === 'null') return '#';
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  const clean = val.replace(/^@/, '');
  switch (platform.toLowerCase()) {
    case 'instagram':
      return `https://instagram.com/${clean}`;
    case 'facebook':
      return `https://facebook.com/${clean}`;
    case 'linkedin':
      return clean.includes('/') ? `https://linkedin.com/${clean}` : `https://linkedin.com/in/${clean}`;
    case 'youtube':
      return `https://youtube.com/@${clean}`;
    case 'twitter':
    case 'x':
      return `https://x.com/${clean}`;
    case 'website':
    default:
      return `https://${clean}`;
  }
}

// ── Lead Stage Color Resolver ────────────────────────────────────────────────

function getStageDisplay(
  lead: { stageId?: number | string | null; status?: string | null },
  stagesList: any[]
): { label: string; color: string; bgColor: string; borderColor: string } {
  // 1. Try match by stageId
  if (lead.stageId && stagesList.length > 0) {
    const found = stagesList.find((s: any) => String(s.id) === String(lead.stageId));
    if (found) {
      return {
        label: found.name || found.label || 'Stage',
        color: found.color || '#2563EB',
        bgColor: found.bgColor || '#EFF6FF',
        borderColor: found.color ? `${found.color}40` : '#DBEAFE',
      };
    }
  }

  // 2. Try match by status key
  const statusKey = (lead.status || '').toUpperCase();
  if (stagesList.length > 0) {
    const found = stagesList.find(
      (s: any) => (s.key && s.key.toUpperCase() === statusKey) || (s.name && s.name.toUpperCase() === statusKey)
    );
    if (found) {
      return {
        label: found.name || found.label || statusKey,
        color: found.color || '#2563EB',
        bgColor: found.bgColor || '#EFF6FF',
        borderColor: found.color ? `${found.color}40` : '#DBEAFE',
      };
    }
  }

  // 3. Built-in standard status fallbacks
  switch (statusKey) {
    case 'NEW':
      return { label: 'New', color: '#2563EB', bgColor: '#EFF6FF', borderColor: '#BFDBFE' };
    case 'CONTACTED':
      return { label: 'Contacted', color: '#D97706', bgColor: '#FFFBEB', borderColor: '#FDE68A' };
    case 'FOLLOW_UP':
    case 'FOLLOW-UP':
    case 'QUALIFIED':
      return { label: 'Follow-up', color: '#7C3AED', bgColor: '#F5F3FF', borderColor: '#DDD6FE' };
    case 'VISIT_SCHEDULED':
      return { label: 'Visit Scheduled', color: '#0891B2', bgColor: '#ECFEFF', borderColor: '#A5F3FC' };
    case 'VISIT_DONE':
      return { label: 'Visit Done', color: '#0D9488', bgColor: '#F0FDFA', borderColor: '#99F6E4' };
    case 'DETAILS_SENT':
      return { label: 'Details Sent', color: '#4F46E5', bgColor: '#EEF2FF', borderColor: '#C7D2FE' };
    case 'FINAL_CALL':
      return { label: 'Final Call', color: '#EA580C', bgColor: '#FFF7ED', borderColor: '#FFEDD5' };
    case 'WON':
    case 'CONVERTED':
      return { label: 'Won', color: '#16A34A', bgColor: '#F0FDF4', borderColor: '#BBF7D0' };
    case 'LOST':
      return { label: 'Lost', color: '#DC2626', bgColor: '#FEF2F2', borderColor: '#FECACA' };
    default:
      return { label: statusKey || 'New', color: '#475569', bgColor: '#F8FAFC', borderColor: '#E2E8F0' };
  }
}

export default function EmployeeLeadsPage() {
  const user = useEmployeeAuthStore((state) => state.user);
  const token = useEmployeeAuthStore((state) => state.token);

  // Permissions
  const canView = hasPermission(user, ['leads.view', 'LEADS:VIEW', 'leads', 'employee.leads.view']);
  const canCreate = hasPermission(user, ['leads.create', 'LEADS:CREATE', 'leads.manage']);
  const canDelete = hasPermission(user, ['leads.delete', 'LEADS:DELETE', 'leads.manage']);

  // Data States
  const [leads, setLeads] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageId, setSelectedStageId] = useState<string>('ALL');

  // Multi-Selection State
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [leadDetailDrawer, setLeadDetailDrawer] = useState<any | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<any | null>(null);

  // Action Loading
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Lead Form State
  const [newLeadForm, setNewLeadForm] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    source: 'Google Places',
    stageId: '',
    notes: '',
  });

  // ── Fetch Leads, Stages & Metrics ──────────────────────────────────────────
  const fetchLeadsData = useCallback(
    async (isRefresh = false) => {
      if (!token) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const authHeader = { headers: { Authorization: `Bearer ${token}` } };

        const [leadsRes, stagesRes, metricsRes] = await Promise.allSettled([
          api.get('/leads', {
            ...authHeader,
            params: {
              search: searchQuery.trim() || undefined,
              stageId: selectedStageId !== 'ALL' && !isNaN(Number(selectedStageId)) ? selectedStageId : undefined,
              status: selectedStageId !== 'ALL' && isNaN(Number(selectedStageId)) ? selectedStageId : undefined,
              limit: 100,
            },
          }),
          api.get('/leads/stages', authHeader),
          api.get('/leads/metrics', authHeader),
        ]);

        if (leadsRes.status === 'fulfilled') {
          const val = leadsRes.value as any;
          const items = val?.data?.data || val?.data?.items || val?.data || val?.items || (Array.isArray(val) ? val : []);
          setLeads(Array.isArray(items) ? items : []);
        }

        if (stagesRes.status === 'fulfilled') {
          const val = stagesRes.value as any;
          const sItems = val?.data?.data || val?.data?.items || val?.data || val?.items || (Array.isArray(val) ? val : []);
          setStages(Array.isArray(sItems) ? sItems : []);
        }

        if (metricsRes.status === 'fulfilled') {
          const val = metricsRes.value as any;
          setMetrics(val?.data?.data || val?.data || val);
        }
      } catch (err) {
        console.error('[EMPLOYEE_LEADS] Error loading leads:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, searchQuery, selectedStageId]
  );

  useEffect(() => {
    fetchLeadsData();
  }, [fetchLeadsData]);

  // ── Multi-select Handlers ──────────────────────────────────────────────────
  const toggleSelectLead = (id: number) => {
    setSelectedLeadIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((l) => l.id).filter(Boolean));
    }
  };

  // ── Single Lead Delete ─────────────────────────────────────────────────────
  const handleDeleteSingleLead = async (leadId: number) => {
    if (!token) return;
    setIsDeleting(true);
    try {
      await api.delete(`/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Lead deleted successfully', { icon: '🗑️' });
      setLeadToDelete(null);
      if (leadDetailDrawer?.id === leadId) setLeadDetailDrawer(null);
      setSelectedLeadIds((prev) => prev.filter((id) => id !== leadId));
      await fetchLeadsData(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete lead';
      toast.error(typeof msg === 'string' ? msg : 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Bulk Delete Leads ──────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    if (!token || selectedLeadIds.length === 0) return;
    setIsDeleting(true);
    try {
      await api.post(
        '/leads/bulk-delete',
        { ids: selectedLeadIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${selectedLeadIds.length} leads deleted successfully`, { icon: '🗑️' });
      setIsBulkDeleteModalOpen(false);
      setSelectedLeadIds([]);
      await fetchLeadsData(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete selected leads';
      toast.error(typeof msg === 'string' ? msg : 'Bulk delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Create New Lead ────────────────────────────────────────────────────────
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!newLeadForm.companyName.trim()) {
      toast.error('Lead / Company name is required');
      return;
    }
    if (!newLeadForm.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    setIsSubmittingLead(true);
    try {
      const payload: any = {
        companyName: newLeadForm.companyName.trim(),
        firstName: newLeadForm.firstName.trim() || undefined,
        lastName: newLeadForm.lastName.trim() || undefined,
        phone: newLeadForm.phone.trim(),
        email: newLeadForm.email.trim() || undefined,
        city: newLeadForm.city.trim() || undefined,
        state: newLeadForm.state.trim() || undefined,
        source: newLeadForm.source || 'Google Places',
        notes: newLeadForm.notes.trim() || undefined,
      };

      if (newLeadForm.stageId) {
        payload.stageId = Number(newLeadForm.stageId);
      }

      await api.post('/leads', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Lead created successfully!', { icon: '✅' });
      setIsAddModalOpen(false);
      setNewLeadForm({
        companyName: '',
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        city: '',
        state: '',
        source: 'Google Places',
        stageId: '',
        notes: '',
      });
      await fetchLeadsData(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create lead';
      toast.error(typeof msg === 'string' ? msg : 'Creation failed');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // ── Update Lead Stage Directly ─────────────────────────────────────────────
  const handleUpdateLeadStage = async (leadId: number, newStageId: string, newStatusName: string) => {
    if (!token) return;
    try {
      await api.patch(
        `/leads/${leadId}/status`,
        {
          stageId: !isNaN(Number(newStageId)) ? Number(newStageId) : undefined,
          status: newStatusName,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Stage updated to ${newStatusName}`);
      if (leadDetailDrawer) {
        setLeadDetailDrawer((prev: any) => ({
          ...prev,
          stageId: Number(newStageId),
          status: newStatusName,
        }));
      }
      await fetchLeadsData(true);
    } catch {
      toast.error('Failed to update stage');
    }
  };

  // ── Filter Tabs Configuration ──────────────────────────────────────────────
  // Construct filter tabs using actual backend stages and metrics
  const filterTabs = useMemo(() => {
    const tabs: Array<{ id: string; name: string; count: number; color?: string }> = [
      { id: 'ALL', name: 'All', count: Number(metrics?.total || leads.length) },
    ];

    if (stages.length > 0) {
      stages.forEach((stg: any) => {
        const stageKey = (stg.key || '').toLowerCase();
        let c = 0;
        if (metrics) {
          if (stageKey === 'new') c = Number(metrics.new || 0);
          else if (stageKey === 'contacted') c = Number(metrics.contacted || 0);
          else if (stageKey === 'qualified' || stageKey === 'follow_up' || stageKey === 'follow-up')
            c = Number(metrics.qualified || 0);
          else if (stageKey === 'converted' || stageKey === 'won') c = Number(metrics.converted || 0);
          else if (stageKey === 'lost') c = Number(metrics.lost || 0);
          else if (metrics[stageKey] !== undefined) c = Number(metrics[stageKey]);
          else c = leads.filter((l) => String(l.stageId) === String(stg.id)).length;
        } else {
          c = leads.filter((l) => String(l.stageId) === String(stg.id)).length;
        }

        tabs.push({
          id: String(stg.id),
          name: stg.name || stg.label || 'Stage',
          count: c,
          color: stg.color,
        });
      });
    } else {
      // Default common stages fallback
      const defaults = [
        { id: 'NEW', name: 'New', count: Number(metrics?.new || 0) },
        { id: 'CONTACTED', name: 'Contacted', count: Number(metrics?.contacted || 0) },
        { id: 'FOLLOW_UP', name: 'Follow-up', count: Number(metrics?.qualified || 0) },
        { id: 'VISIT_SCHEDULED', name: 'Visit Scheduled', count: 0 },
        { id: 'VISIT_DONE', name: 'Visit Done', count: 0 },
        { id: 'DETAILS_SENT', name: 'Details Sent', count: 0 },
        { id: 'FINAL_CALL', name: 'Final Call', count: 0 },
        { id: 'WON', name: 'Won', count: Number(metrics?.converted || 0) },
        { id: 'LOST', name: 'Lost', count: Number(metrics?.lost || 0) },
      ];
      tabs.push(...defaults);
    }

    return tabs;
  }, [stages, metrics, leads]);

  if (!canView) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          Your employee role does not have authorization to view the Leads Pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── 1. PAGE HEADER ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Leads Pipeline</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Manage & track your leads</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Delete Selected Leads Button */}
          {canDelete && selectedLeadIds.length > 0 && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Delete Selected ({selectedLeadIds.length})</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => fetchLeadsData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Refresh Leads"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {/* + Add Lead Button */}
          {canCreate && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-[#23C45E] hover:bg-[#1AA14D] text-white shadow-md shadow-[#23C45E]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Lead</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 2. SEARCH BAR ───────────────────────────────────────────────────── */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search leads by name, phone, city..."
          className="w-full pl-12 pr-10 py-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-emerald-500 focus:border-emerald-500 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── 3. HORIZONTALLY ALIGNED STAGE FILTERS ────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filterTabs.map((tab) => {
          const isSelected = selectedStageId === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setSelectedStageId(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#23C45E] text-white shadow-md shadow-[#23C45E]/20'
                  : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {isSelected ? (
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              ) : tab.color ? (
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tab.color }} />
              ) : null}
              <span>{tab.name}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black leading-tight ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── SELECTION CONTROL BAR ───────────────────────────────────────────── */}
      {leads.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="select-all-leads"
              checked={selectedLeadIds.length > 0 && selectedLeadIds.length === leads.length}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
            />
            <label htmlFor="select-all-leads" className="font-bold text-slate-700 cursor-pointer">
              {selectedLeadIds.length === 0
                ? 'Select All Leads'
                : `Selected ${selectedLeadIds.length} of ${leads.length}`}
            </label>
          </div>

          <span className="font-semibold text-slate-400">
            Showing {leads.length} lead{leads.length === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {/* ── 4 & 5. RESPONSIVE DESKTOP LEAD CARDS GRID ───────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 max-w-lg mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900">No leads found</h3>
          <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
            {searchQuery
              ? `No leads matched "${searchQuery}". Try clearing search or changing filters.`
              : 'There are currently no leads in this stage. Add your first lead or use Data Capture.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Clear Search
              </button>
            )}
            {canCreate && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#23C45E] text-white hover:bg-[#1AA14D] cursor-pointer"
              >
                + Add Lead
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {leads.map((lead) => {
            const isChecked = selectedLeadIds.includes(lead.id);
            const leadTitle =
              lead.companyName ||
              [lead.firstName, lead.lastName].filter(Boolean).join(' ') ||
              lead.title ||
              'Business Lead';
            const leadPhone = lead.phone || lead.mobile || 'No Phone';
            const leadCity = lead.city || lead.state || lead.address || 'Location N/A';
            const stageConfig = getStageDisplay(lead, stages);
            const social = lead.socialMedia || {};
            const sourceName = lead.source || lead.leadSource || 'Google Places';

            return (
              <div
                key={lead.id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between gap-4 group ${
                  isChecked
                    ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-md'
                    : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Top Row: Checkbox, Name, Stage badge */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectLead(lead.id)}
                        className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                      />
                      <h3
                        onClick={() => setLeadDetailDrawer(lead)}
                        className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug cursor-pointer"
                        title={leadTitle}
                      >
                        {leadTitle}
                      </h3>
                    </div>

                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border"
                      style={{
                        backgroundColor: stageConfig.bgColor,
                        color: stageConfig.color,
                        borderColor: stageConfig.borderColor,
                      }}
                    >
                      {stageConfig.label}
                    </span>
                  </div>

                  {/* Middle Row: Phone & City/Location */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 font-medium pl-6">
                    <div className="flex items-center gap-1 text-slate-700 font-semibold">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{leadPhone}</span>
                    </div>

                    {leadCity && (
                      <>
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[140px]">{leadCity}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Social Media Icons (if available) */}
                <div className="pl-6 flex items-center gap-2">
                  {social?.instagram && (
                    <a
                      href={buildSocialUrl('instagram', social.instagram)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                      title="Instagram"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {social?.facebook && (
                    <a
                      href={buildSocialUrl('facebook', social.facebook)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Facebook"
                    >
                      <Facebook className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {social?.linkedin && (
                    <a
                      href={buildSocialUrl('linkedin', social.linkedin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-sky-700 hover:bg-sky-50 rounded-md transition-colors"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {social?.youtube && (
                    <a
                      href={buildSocialUrl('youtube', social.youtube)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="YouTube"
                    >
                      <Youtube className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {(social?.twitter || social?.x) && (
                    <a
                      href={buildSocialUrl('x', social.twitter || social.x)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                      title="X"
                    >
                      <Twitter className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {(social?.website || lead.website) && (
                    <a
                      href={buildSocialUrl('website', social.website || lead.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                      title="Website"
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Bottom Row: Source & Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>Source: {sourceName}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {canDelete && (
                      <button
                        onClick={() => setLeadToDelete(lead)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => setLeadDetailDrawer(lead)}
                      className="flex items-center gap-1 px-2.5 py-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 6. LEAD DETAILS DRAWER ──────────────────────────────────── */}
      <EmployeeSideSheet
        open={!!leadDetailDrawer}
        onClose={() => setLeadDetailDrawer(null)}
        title={
          leadDetailDrawer
            ? leadDetailDrawer.companyName ||
              [leadDetailDrawer.firstName, leadDetailDrawer.lastName].filter(Boolean).join(' ') ||
              'Lead Details'
            : 'Lead Details'
        }
        subtitle={leadDetailDrawer ? `Lead ID #${leadDetailDrawer.id}` : undefined}
        icon={<Building2 className="w-5 h-5" />}
        footer={
          <div className="w-full flex items-center justify-between gap-3">
            {canDelete && leadDetailDrawer ? (
              <button
                type="button"
                onClick={() => {
                  setLeadToDelete(leadDetailDrawer);
                }}
                className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
              >
                Delete Lead
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={() => setLeadDetailDrawer(null)}
              className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        }
      >
        {leadDetailDrawer && (
          <div className="space-y-4">
            {/* Stage Selector */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-600">Current Stage</span>
              <select
                value={String(leadDetailDrawer.stageId || leadDetailDrawer.status || '')}
                onChange={(e) => {
                  const sel = stages.find((s) => String(s.id) === e.target.value);
                  const name = sel ? sel.name : e.target.value;
                  handleUpdateLeadStage(leadDetailDrawer.id, e.target.value, name);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-emerald-500"
              >
                {stages.map((stg) => (
                  <option key={stg.id} value={String(stg.id)}>
                    {stg.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-bold">Contact Phone</span>
                <a
                  href={`tel:${leadDetailDrawer.phone}`}
                  className="font-black text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{leadDetailDrawer.phone || '—'}</span>
                </a>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-bold">Email Address</span>
                <span className="font-semibold text-slate-800">{leadDetailDrawer.email || '—'}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-bold">City / Location</span>
                <span className="font-semibold text-slate-800">
                  {[leadDetailDrawer.city, leadDetailDrawer.state].filter(Boolean).join(', ') || '—'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-bold">Lead Source</span>
                <span className="font-black text-slate-800">
                  {leadDetailDrawer.source || leadDetailDrawer.leadSource || 'Google Places'}
                </span>
              </div>
            </div>

            {/* Notes */}
            {leadDetailDrawer.notes && (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-xs">
                <span className="font-bold text-amber-800 block mb-1">Notes:</span>
                <p className="text-slate-700 leading-relaxed">{leadDetailDrawer.notes}</p>
              </div>
            )}
          </div>
        )}
      </EmployeeSideSheet>

      {/* ── 7. ADD LEAD DRAWER ───────────────────────────────────────────────── */}
      <EmployeeSideSheet
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Lead"
        subtitle="Create a new prospect record"
        icon={<Plus className="w-4 h-4" />}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-lead-form"
              disabled={isSubmittingLead}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#23C45E] hover:bg-[#1AA14D] text-white shadow-md shadow-[#23C45E]/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
            >
              {isSubmittingLead && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmittingLead ? 'Creating...' : 'Create Lead'}</span>
            </button>
          </>
        }
      >
        <form id="add-lead-form" onSubmit={handleCreateLead} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Company / Business Name *</label>
            <input
              type="text"
              required
              value={newLeadForm.companyName}
              onChange={(e) => setNewLeadForm((prev) => ({ ...prev, companyName: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-emerald-500"
              placeholder="e.g. Lemon Tree Premier"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">First Name</label>
              <input
                type="text"
                value={newLeadForm.firstName}
                onChange={(e) => setNewLeadForm((prev) => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-emerald-500"
                placeholder="Contact first name"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Last Name</label>
              <input
                type="text"
                value={newLeadForm.lastName}
                onChange={(e) => setNewLeadForm((prev) => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-emerald-500"
                placeholder="Contact last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={newLeadForm.phone}
                onChange={(e) => setNewLeadForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-emerald-500"
                placeholder="+91..."
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
              <input
                type="email"
                value={newLeadForm.email}
                onChange={(e) => setNewLeadForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-emerald-500"
                placeholder="name@business.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">City</label>
              <input
                type="text"
                value={newLeadForm.city}
                onChange={(e) => setNewLeadForm((prev) => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-emerald-500"
                placeholder="e.g. Vadodara"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">State</label>
              <input
                type="text"
                value={newLeadForm.state}
                onChange={(e) => setNewLeadForm((prev) => ({ ...prev, state: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-emerald-500"
                placeholder="e.g. Gujarat"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Initial Stage</label>
              <select
                value={newLeadForm.stageId}
                onChange={(e) => setNewLeadForm((prev) => ({ ...prev, stageId: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-emerald-500 bg-white"
              >
                <option value="">Default (New)</option>
                {stages.map((stg) => (
                  <option key={stg.id} value={String(stg.id)}>
                    {stg.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Lead Source</label>
              <select
                value={newLeadForm.source}
                onChange={(e) => setNewLeadForm((prev) => ({ ...prev, source: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-emerald-500 bg-white"
              >
                <option value="Google Places">Google Places</option>
                <option value="Website">Website</option>
                <option value="Manual">Manual</option>
                <option value="Referral">Referral</option>
                <option value="Cold Call">Cold Call</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Notes</label>
            <textarea
              rows={3}
              value={newLeadForm.notes}
              onChange={(e) => setNewLeadForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-emerald-500 resize-none"
              placeholder="Additional context or requirements..."
            />
          </div>
        </form>
      </EmployeeSideSheet>


      {/* ── 8. BULK DELETE CONFIRMATION MODAL ───────────────────────────────── */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-slate-900 text-lg">Delete Selected Leads?</h3>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to delete {selectedLeadIds.length} selected lead
                {selectedLeadIds.length === 1 ? '' : 's'}? This action can be undone from Recycle Bin.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleBulkDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. SINGLE DELETE CONFIRMATION MODAL ─────────────────────────────── */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-slate-900 text-lg">Delete Lead?</h3>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to delete &quot;{leadToDelete.companyName || 'this lead'}&quot;?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setLeadToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={() => handleDeleteSingleLead(leadToDelete.id)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Lead'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
