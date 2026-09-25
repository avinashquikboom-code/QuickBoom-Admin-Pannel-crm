'use client';

import React, { useState, useRef } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  AlertCircle,
  RefreshCw,
  GripVertical,
  ArrowUpDown,
  Kanban,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import {
  AdminPageHeader,
  AdminButton,
  AdminFormDrawer,
  AdminConfirmDialog,
  AdminFormField,
  AdminInput,
} from '@/components/admin';

interface LeadStageItem {
  id: number;
  key: string;
  name: string;
  label?: string;
  color: string;
  bgColor?: string;
  borderColor?: string;
  sortOrder: number;
  isActive: boolean;
  isSystem?: boolean;
  leadsCount: number;
  emailEnabled?: boolean;
  emailTemplateId?: number | null;
  emailTemplate?: {
    id: number;
    name: string;
    key?: string;
  } | null;
  whatsappEnabled?: boolean;
  whatsappTemplateId?: number | null;
  whatsappTemplate?: {
    id: number;
    name: string;
    templateName: string;
    status: string;
    language?: string;
  } | null;
}

const PRESET_COLORS = [
  { name: 'Sky Blue', hex: '#0284C7', bg: '#E0F2FE', border: '#BAE6FD' },
  { name: 'Amber', hex: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
  { name: 'Purple', hex: '#8B5CF6', bg: '#F3E8FF', border: '#E9D5FF' },
  { name: 'Indigo', hex: '#4F46E5', bg: '#EEF2FF', border: '#E0E7FF' },
  { name: 'Cyan', hex: '#06B6D4', bg: '#CFFAFE', border: '#A5F3FC' },
  { name: 'Orange', hex: '#EA580C', bg: '#FFEDD5', border: '#FED7AA' },
  { name: 'Emerald', hex: '#16A34A', bg: '#DCFCE7', border: '#BBF7D0' },
  { name: 'Rose Red', hex: '#DC2626', bg: '#FFE4E6', border: '#FECDD3' },
  { name: 'Slate Gray', hex: '#64748B', bg: '#F1F5F9', border: '#E2E8F0' },
];

export default function LeadStagesPage() {
  const queryClient = useQueryClient();

  // Drawer / Dialog states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<LeadStageItem | null>(null);
  const [deletingStage, setDeletingStage] = useState<LeadStageItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    sortOrder: 1,
    isActive: true,
    emailEnabled: true,
    emailTemplateId: null as number | null,
    whatsappEnabled: true,
    whatsappTemplateId: null as number | null,
  });

  // Drag-and-drop state
  const [localStages, setLocalStages] = useState<LeadStageItem[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // ── Fetch Stages ────────────────────────────────────────────────────
  const {
    data: stagesData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-lead-stages'],
    queryFn: async () => {
      const res: any = await api.get('/leads/stages?includeInactive=true');
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      return items as LeadStageItem[];
    },
    staleTime: 0,
  });

  // ── Fetch WhatsApp Meta Templates ───────────────────────────────────
  const { data: whatsappTemplatesData = [] } = useQuery({
    queryKey: ['admin-meta-templates-approved'],
    queryFn: async () => {
      const res: any = await api.get('/templates/meta?status=APPROVED&limit=100').catch(() => null);
      const items = Array.isArray(res?.data?.items)
        ? res.data.items
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      return items as Array<{ id: number; name: string; templateName: string; language: string; status: string }>;
    },
    staleTime: 60000,
  });

  // ── Fetch Email Templates ───────────────────────────────────────────
  const { data: emailTemplatesData = [] } = useQuery({
    queryKey: ['admin-email-templates'],
    queryFn: async () => {
      const res: any = await api.get('/email/templates?limit=100').catch(() => null);
      const items = Array.isArray(res?.data?.items)
        ? res.data.items
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      return items as Array<{ id: number; name: string; key?: string; subject?: string }>;
    },
    staleTime: 60000,
  });

  // Sorted list — prefer local optimistic state during drag
  const stages: LeadStageItem[] = React.useMemo(() => {
    const source = localStages ?? stagesData ?? [];
    return [...source].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [localStages, stagesData]);

  // ── Create Stage ─────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => api.post('/leads/stages', payload),
    onSuccess: () => {
      toast.success('Lead stage created!');
      setLocalStages(null);
      queryClient.invalidateQueries({ queryKey: ['admin-lead-stages'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stages'] });
      closeDrawer();
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  // ── Update Stage ─────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) =>
      api.patch(`/leads/stages/${id}`, data),
    onSuccess: () => {
      toast.success('Lead stage updated!');
      setLocalStages(null);
      queryClient.invalidateQueries({ queryKey: ['admin-lead-stages'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stages'] });
      closeDrawer();
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  });

  // ── Delete Stage ─────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/leads/stages/${id}`),
    onSuccess: () => {
      toast.success('Lead stage deleted!');
      setLocalStages(null);
      queryClient.invalidateQueries({ queryKey: ['admin-lead-stages'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stages'] });
      setDeletingStage(null);
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
      setDeletingStage(null);
    },
  });

  // ── Reorder Stages (Bulk PATCH) ───────────────────────────────────────
  const reorderMutation = useMutation({
    mutationFn: async (reordered: LeadStageItem[]) => {
      const payload = reordered.map((s, idx) => ({ id: s.id, sortOrder: idx + 1 }));
      return api.patch('/leads/stages/reorder', { stages: payload });
    },
    onSuccess: () => {
      toast.success('Stage order saved!', { id: 'stage-reorder' });
      queryClient.invalidateQueries({ queryKey: ['admin-lead-stages'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stages'] });
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err) || 'Failed to save order. Reverting.');
      setLocalStages(null);
      queryClient.invalidateQueries({ queryKey: ['admin-lead-stages'] });
    },
  });

  // ── Drag-and-Drop ─────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = index;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    (e.currentTarget as HTMLElement).style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setIsDragging(false);
    setDragOverId(null);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDragOver = (e: React.DragEvent, index: number, stageId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverItem.current = index;
    setDragOverId(stageId);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragItem.current === null || dragItem.current === dropIndex) {
      setIsDragging(false);
      setDragOverId(null);
      return;
    }
    const reordered = [...stages];
    const [dragged] = reordered.splice(dragItem.current, 1);
    reordered.splice(dropIndex, 0, dragged);
    const withNewOrder = reordered.map((s, idx) => ({ ...s, sortOrder: idx + 1 }));
    setLocalStages(withNewOrder);
    setIsDragging(false);
    setDragOverId(null);
    reorderMutation.mutate(reordered);
  };

  // ── Form Helpers ───────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingStage(null);
    const nextOrder = stages.length > 0 ? Math.max(...stages.map((s) => s.sortOrder)) + 1 : 1;
    setFormData({
      name: '',
      color: '#0284C7',
      bgColor: '#E0F2FE',
      borderColor: '#BAE6FD',
      sortOrder: nextOrder,
      isActive: true,
      emailEnabled: true,
      emailTemplateId: null,
      whatsappEnabled: true,
      whatsappTemplateId: null,
    });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (stage: LeadStageItem) => {
    setEditingStage(stage);
    setFormData({
      name: stage.name || stage.label || '',
      color: stage.color || '#0284C7',
      bgColor: stage.bgColor || '#E0F2FE',
      borderColor: stage.borderColor || '#BAE6FD',
      sortOrder: stage.sortOrder ?? 1,
      isActive: stage.isActive ?? true,
      emailEnabled: stage.emailEnabled ?? true,
      emailTemplateId: stage.emailTemplateId ?? stage.emailTemplate?.id ?? null,
      whatsappEnabled: stage.whatsappEnabled ?? true,
      whatsappTemplateId: stage.whatsappTemplateId ?? stage.whatsappTemplate?.id ?? null,
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => { setDrawerOpen(false); setEditingStage(null); };

  const handleSaveStage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) { toast.error('Please enter a stage name.'); return; }
    if (editingStage) {
      updateMutation.mutate({ id: editingStage.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleActive = (stage: LeadStageItem) => {
    updateMutation.mutate({ id: stage.id, data: { isActive: !stage.isActive } });
  };

  const handleDeleteClick = (stage: LeadStageItem) => {
    if ((stage.leadsCount ?? 0) > 0) {
      toast.error(`Cannot delete "${stage.name}" — it has ${stage.leadsCount} lead(s). Deactivate it instead.`);
      return;
    }
    setDeletingStage(stage);
  };

  const handleSelectPresetColor = (preset: (typeof PRESET_COLORS)[0]) => {
    setFormData((prev) => ({ ...prev, color: preset.hex, bgColor: preset.bg, borderColor: preset.border }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Stage Management"
        description="Drag rows to reorder stages. Reordering instantly updates Admin Panel, Pipeline, and Mobile App — no code change required."
        icon={Kanban}
        iconColor="text-emerald-600"
        badge={{ text: 'Lead Stages Master', icon: Kanban, variant: 'emerald' }}
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Leads', href: '/leads' },
          { label: 'Stage Management' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <AdminButton
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={() => {
                setLocalStages(null);
                refetch();
              }}
              disabled={isFetching}
            >
              Refresh
            </AdminButton>
            <AdminButton
              variant="primary"
              size="md"
              icon={Plus}
              onClick={handleOpenCreate}
            >
              Add Stage
            </AdminButton>
          </div>
        }
      />

      {/* Error State */}
      {isError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Failed to load lead stages</h4>
              <p className="text-xs text-rose-600">{getErrorMessage(error) || 'An unexpected error occurred.'}</p>
            </div>
          </div>
          <AdminButton variant="outline" size="sm" icon={RefreshCw} onClick={() => refetch()}>Retry</AdminButton>
        </div>
      )}

      {/* Reorder Hint */}
      {!isError && stages.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 border border-sky-200 rounded-2xl text-xs font-semibold text-sky-700">
          <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
          <span>
            Drag the <GripVertical className="inline w-3.5 h-3.5 text-sky-500" /> handle to reorder.
            Order syncs to backend instantly — Flutter and Admin Panel update automatically.
          </span>
        </div>
      )}

      {/* Stages Table */}
      {!isError && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 font-bold animate-pulse text-sm">Loading stages...</div>
          ) : stages.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <Layers className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-500">No lead stages found.</p>
              <p className="text-xs text-slate-400">Add your first stage to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-3 w-10"></th>
                    <th className="py-4 px-3 w-10 text-center">#</th>
                    <th className="py-4 px-4">Stage Name</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Email Automation</th>
                    <th className="py-4 px-4">WhatsApp Automation</th>
                    <th className="py-4 px-4">Color</th>
                    <th className="py-4 px-4 text-center">Leads</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {stages.map((stage, index) => {
                    const isDragTarget = dragOverId === stage.id && isDragging;
                    return (
                      <tr
                        key={stage.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, index, stage.id)}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`transition-all group ${
                          isDragTarget
                            ? 'bg-sky-50 border-t-2 border-sky-400 shadow-inner'
                            : 'hover:bg-slate-50/80'
                        }`}
                        style={{ cursor: isDragging ? 'grabbing' : 'default' }}
                      >
                        {/* Drag Handle */}
                        <td className="py-4 px-3">
                          <div className="flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors cursor-grab active:cursor-grabbing" title="Drag to reorder">
                            <GripVertical className="w-4 h-4" />
                          </div>
                        </td>

                        {/* Position */}
                        <td className="py-4 px-3 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-black text-[11px]">
                            {index + 1}
                          </span>
                        </td>

                        {/* Stage Name Badge */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider shadow-2xs"
                              style={{
                                backgroundColor: stage.bgColor || '#F1F5F9',
                                color: stage.color || '#334155',
                                borderColor: stage.borderColor || '#E2E8F0',
                              }}
                            >
                              {stage.name || stage.label || stage.key}
                            </span>
                            {stage.isSystem && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold uppercase">
                                System
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Active Toggle */}
                        <td className="py-4 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(stage)}
                            title={stage.isActive ? 'Click to deactivate' : 'Click to activate'}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                              stage.isActive
                                ? 'bg-emerald-50 text-[#1AA14D] border-emerald-200/80 hover:bg-emerald-100/60'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/60'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${stage.isActive ? 'bg-[#23C45E] shadow-xs' : 'bg-slate-400'}`} />
                            {stage.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        {/* Email Automation Badge */}
                        <td className="py-4 px-4">
                          {stage.emailEnabled === false ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-400 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Disabled
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200" title={stage.emailTemplate?.name || (stage.emailTemplateId ? `Template #${stage.emailTemplateId}` : 'Auto-match')}>
                                <Mail className="w-3 h-3 text-blue-500" />
                                <span className="truncate max-w-[130px]">
                                  {stage.emailTemplate?.name || (stage.emailTemplateId ? `Template #${stage.emailTemplateId}` : 'Auto-match')}
                                </span>
                              </span>
                            </div>
                          )}
                        </td>

                        {/* WhatsApp Automation Badge */}
                        <td className="py-4 px-4">
                          {stage.whatsappEnabled === false ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-400 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Disabled
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-[#128C7E] border border-emerald-200" title={stage.whatsappTemplate?.templateName || (stage.whatsappTemplateId ? `Template #${stage.whatsappTemplateId}` : 'Auto-match')}>
                                <MessageSquare className="w-3 h-3 text-[#23C45E]" />
                                <span className="truncate max-w-[140px]">
                                  {stage.whatsappTemplate?.templateName || stage.whatsappTemplate?.name || (stage.whatsappTemplateId ? `Template #${stage.whatsappTemplateId}` : 'Auto-match')}
                                </span>
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Color */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-700">
                            <span
                              className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs shrink-0"
                              style={{ backgroundColor: stage.color || '#0284C7' }}
                            />
                            <span>{stage.color || '#0284C7'}</span>
                          </div>
                        </td>

                        {/* Leads Count */}
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            (stage.leadsCount ?? 0) > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {stage.leadsCount ?? 0} {stage.leadsCount === 1 ? 'lead' : 'leads'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(stage)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Edit stage"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(stage)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete stage"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
      )}

      {/* Add / Edit Drawer */}
      <AdminFormDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        title={editingStage ? 'Edit Lead Stage' : 'Add Lead Stage'}
        description="Configure stage name, color theme, sort priority, and availability."
        icon={Layers}
        size="md"
        onSave={handleSaveStage}
        saveLabel={editingStage ? 'Update Stage' : 'Create Stage'}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
        <form onSubmit={handleSaveStage} className="space-y-6">
          {/* Stage Name */}
          <AdminFormField label="Stage Name *" required hint="Label shown across Admin Panel, Mobile App, and pipeline views.">
            <AdminInput
              type="text"
              required
              placeholder="e.g. Call Back, Details Sent, Negotiation"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </AdminFormField>

          {/* Color Palette */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Stage Theme Color *</label>
            <p className="text-[11px] text-slate-500">Select a preset or enter a custom hex value.</p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {PRESET_COLORS.map((preset) => {
                const isSelected = formData.color.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPresetColor(preset)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-slate-50 font-bold'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full shrink-0 border border-slate-300" style={{ backgroundColor: preset.hex }} />
                    <span className="truncate text-slate-700 text-[11px]">{preset.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value, bgColor: `${e.target.value}1A`, borderColor: `${e.target.value}4D` })
                }
                className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white"
              />
              <div className="flex-1">
                <AdminInput
                  type="text"
                  placeholder="#0284C7"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value, bgColor: `${e.target.value}1A`, borderColor: `${e.target.value}4D` })
                  }
                />
              </div>
            </div>
          </div>

          {/* Sort Order */}
          <AdminFormField label="Sort Order" hint="Position in dropdowns and pipeline. Drag rows in the table for visual reordering.">
            <AdminInput
              type="number"
              min={0}
              max={999}
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
            />
          </AdminFormField>

          {/* Automatic Messaging Configurations */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">Stage Automations</span>
              <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">Automatic Dispatch</span>
            </div>

            {/* Email Automation Card */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Email Automation</span>
                    <span className="text-[11px] text-slate-500 block">Send automatic email to customer on entering this stage</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, emailEnabled: !formData.emailEnabled })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    formData.emailEnabled
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${formData.emailEnabled ? 'bg-blue-600' : 'bg-slate-400'}`} />
                  {formData.emailEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {formData.emailEnabled && (
                <div className="pt-2 border-t border-slate-200/60">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Select Email Template</label>
                  <select
                    value={formData.emailTemplateId || ''}
                    onChange={(e) => setFormData({ ...formData, emailTemplateId: e.target.value ? Number(e.target.value) : null })}
                    className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Default (Auto-matched by stage key)</option>
                    {emailTemplatesData?.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} {tpl.key ? `(${tpl.key})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* WhatsApp Automation Card */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-[#128C7E]">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">WhatsApp Automation</span>
                    <span className="text-[11px] text-slate-500 block">Send specific WhatsApp template on entering this stage</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, whatsappEnabled: !formData.whatsappEnabled })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    formData.whatsappEnabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${formData.whatsappEnabled ? 'bg-[#23C45E]' : 'bg-slate-400'}`} />
                  {formData.whatsappEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {formData.whatsappEnabled && (
                <div className="pt-2 border-t border-slate-200/60">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Configured WhatsApp Meta Template</label>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Meta APPROVED Only</span>
                  </div>
                  <select
                    value={formData.whatsappTemplateId || ''}
                    onChange={(e) => setFormData({ ...formData, whatsappTemplateId: e.target.value ? Number(e.target.value) : null })}
                    className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">Default (Auto-matched by stage key)</option>
                    {whatsappTemplatesData?.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name || tpl.templateName} ({tpl.templateName}) [{tpl.language || 'en'}]
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Selected template will be delivered via Meta Cloud API when a lead transitions to this stage.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Active Status */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Stage Availability</span>
              <span className="text-[11px] text-slate-500 block">Active stages appear in lead creation dropdowns.</span>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                formData.isActive ? 'bg-emerald-50 text-[#1AA14D] border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${formData.isActive ? 'bg-[#23C45E]' : 'bg-slate-400'}`} />
              {formData.isActive ? 'Active' : 'Inactive'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={Boolean(deletingStage)}
        onClose={() => setDeletingStage(null)}
        onConfirm={() => {
          if (deletingStage) {
            deleteMutation.mutate(deletingStage.id);
          }
        }}
        title="Delete Lead Stage"
        description={`Are you sure you want to delete "${deletingStage?.name || deletingStage?.label}"? This action cannot be undone.`}
        confirmLabel="Delete Stage"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
