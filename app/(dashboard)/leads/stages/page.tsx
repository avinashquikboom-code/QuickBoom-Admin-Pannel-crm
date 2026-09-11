'use client';

import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  AlertCircle,
  RefreshCw,
  Check,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import {
  AdminPageHeader,
  AdminDataTable,
  ColumnDef,
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
  });

  // 1. Fetch Stages Query (No static mock data fallback!)
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
  });

  const stages: LeadStageItem[] = React.useMemo(() => {
    if (!stagesData) return [];
    return [...stagesData].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [stagesData]);

  // 2. Create Stage Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.post('/leads/stages', payload);
      return res;
    },
    onSuccess: () => {
      toast.success('Lead stage created successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-lead-stages'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stages'] });
      closeDrawer();
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  // 3. Update Stage Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      const res = await api.patch(`/leads/stages/${id}`, data);
      return res;
    },
    onSuccess: () => {
      toast.success('Lead stage updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-lead-stages'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stages'] });
      closeDrawer();
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  // 4. Delete Stage Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/leads/stages/${id}`);
      return res;
    },
    onSuccess: () => {
      toast.success('Lead stage deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-lead-stages'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stages'] });
      setDeletingStage(null);
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
      setDeletingStage(null);
    },
  });

  // Open Drawer for Create
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
    });
    setDrawerOpen(true);
  };

  // Open Drawer for Edit
  const handleOpenEdit = (stage: LeadStageItem) => {
    setEditingStage(stage);
    setFormData({
      name: stage.name || stage.label || '',
      color: stage.color || '#0284C7',
      bgColor: stage.bgColor || '#E0F2FE',
      borderColor: stage.borderColor || '#BAE6FD',
      sortOrder: stage.sortOrder ?? 1,
      isActive: stage.isActive ?? true,
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingStage(null);
  };

  // Save Form Handler
  const handleSaveStage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a stage name.');
      return;
    }

    if (editingStage) {
      updateMutation.mutate({
        id: editingStage.id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Toggle Active/Inactive directly from table
  const handleToggleActive = (stage: LeadStageItem) => {
    const nextState = !stage.isActive;
    updateMutation.mutate({
      id: stage.id,
      data: { isActive: nextState },
    });
  };

  // Handle Delete Click with Safety Guard
  const handleDeleteClick = (stage: LeadStageItem) => {
    if (stage.leadsCount > 0) {
      toast.error(
        `Cannot delete stage "${stage.name}" because it is assigned to ${stage.leadsCount} lead(s). Please reassign existing leads or deactivate the stage instead.`
      );
      return;
    }
    setDeletingStage(stage);
  };

  // Preset color selector helper
  const handleSelectPresetColor = (preset: typeof PRESET_COLORS[0]) => {
    setFormData((prev) => ({
      ...prev,
      color: preset.hex,
      bgColor: preset.bg,
      borderColor: preset.border,
    }));
  };

  // Table Columns Definition matching reference design
  const columns: ColumnDef<LeadStageItem>[] = [
    {
      key: 'index',
      header: '#',
      headerClassName: 'w-14 text-center',
      className: 'w-14 text-center font-bold text-slate-500',
      render: (_item, index) => index + 1,
    },
    {
      key: 'name',
      header: 'Stage Name',
      render: (stage) => {
        const bg = stage.bgColor || '#F1F5F9';
        const color = stage.color || '#334155';
        const border = stage.borderColor || '#E2E8F0';

        return (
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider shadow-2xs"
              style={{
                backgroundColor: bg,
                color: color,
                borderColor: border,
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
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (stage) => {
        const active = stage.isActive;
        return (
          <button
            type="button"
            onClick={() => handleToggleActive(stage)}
            title={active ? 'Click to deactivate stage' : 'Click to activate stage'}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              active
                ? 'bg-emerald-50 text-[#1AA14D] border-emerald-200/80 hover:bg-emerald-100/60'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/60'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                active ? 'bg-[#23C45E] shadow-xs' : 'bg-slate-400'
              }`}
            />
            {active ? 'Active' : 'Inactive'}
          </button>
        );
      },
    },
    {
      key: 'color',
      header: 'Color',
      render: (stage) => {
        const hex = stage.color || '#0284C7';
        return (
          <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-700">
            <span
              className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs shrink-0"
              style={{ backgroundColor: hex }}
            />
            <span>{hex}</span>
          </div>
        );
      },
    },
    {
      key: 'sortOrder',
      header: 'Sort Order',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (stage) => (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
          {stage.sortOrder}
        </span>
      ),
    },
    {
      key: 'leadsCount',
      header: 'Leads Count',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (stage) => {
        const count = stage.leadsCount ?? 0;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
              count > 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {count} {count === 1 ? 'lead' : 'leads'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (stage) => (
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
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Stage Management"
        description="Create and manage lead stages. These stages will be used in lead management and visible to authorized users."
        badge={{ text: 'Leads Module', icon: Layers }}
        actions={
          <div className="flex items-center gap-2">
            <AdminButton
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => refetch()}
              loading={isFetching}
            >
              Refresh
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
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
              <p className="text-xs text-rose-600">
                {getErrorMessage(error) || 'An unexpected error occurred while loading stages.'}
              </p>
            </div>
          </div>
          <AdminButton
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => refetch()}
          >
            Retry Loading
          </AdminButton>
        </div>
      )}

      {/* Stages Table */}
      {!isError && (
        <AdminDataTable
          columns={columns}
          data={stages}
          loading={isLoading}
          emptyTitle="No lead stages found."
          emptyDescription="Configure stages above to guide sales pipelines and mobile lead progress tracking."
          keyExtractor={(item) => String(item.id)}
        />
      )}

      {/* Add / Edit Stage Drawer */}
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
          <AdminFormField label="Stage Name *" required hint="Descriptive label displayed across Admin Panel and Customer Mobile.">
            <AdminInput
              type="text"
              required
              placeholder="e.g. Interested, Proposal Sent, Follow-up"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </AdminFormField>

          {/* Color Palette & Custom Hex */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Stage Theme Color *
            </label>
            <p className="text-[11px] text-slate-500">
              Select a coordinated preset color or enter a custom hex value.
            </p>

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
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-slate-300"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span className="truncate text-slate-700 text-[11px]">{preset.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Hex Picker Row */}
            <div className="flex items-center gap-3 pt-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    color: e.target.value,
                    bgColor: `${e.target.value}1A`,
                    borderColor: `${e.target.value}4D`,
                  })
                }
                className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white"
              />
              <div className="flex-1">
                <AdminInput
                  type="text"
                  placeholder="#0284C7"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      color: e.target.value,
                      bgColor: `${e.target.value}1A`,
                      borderColor: `${e.target.value}4D`,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Sort Order */}
          <AdminFormField label="Sort Order *" required hint="Determines sequential position in dropdowns and pipeline views.">
            <AdminInput
              type="number"
              required
              min={0}
              max={100}
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
            />
          </AdminFormField>

          {/* Active Status Switch */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Stage Availability</span>
              <span className="text-[11px] text-slate-500 block">
                Active stages appear in lead creation and assignment dropdowns.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                formData.isActive
                  ? 'bg-emerald-50 text-[#1AA14D] border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  formData.isActive ? 'bg-[#23C45E]' : 'bg-slate-400'
                }`}
              />
              {formData.isActive ? 'Active' : 'Inactive'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* Delete Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={Boolean(deletingStage)}
        onClose={() => setDeletingStage(null)}
        onConfirm={() => deletingStage && deleteMutation.mutate(deletingStage.id)}
        title="Delete Lead Stage"
        description={`Are you sure you want to delete stage "${deletingStage?.name || deletingStage?.label}"? This action cannot be undone.`}
        confirmLabel="Delete Stage"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
