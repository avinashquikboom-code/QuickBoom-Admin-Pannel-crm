'use client';

import React, { useState } from 'react';
import {
  Target,
  Search,
  CheckCircle,
  RefreshCw,
  Globe,
  Users,
  PhoneCall,
  Megaphone,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import {
  AdminPageHeader,
  AdminButton,
  AdminFormDrawer,
  AdminConfirmDialog,
  AdminFormField,
  AdminInput,
} from '@/components/admin';
import { getErrorMessage } from '@/lib/utils';

interface LeadSourceItem {
  id: number;
  code: string;
  name: string;
  description: string;
  count: number;
  isActive: boolean;
  isSystem: boolean;
}

export default function MasterLeadSourcesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Drawers & Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LeadSourceItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<LeadSourceItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    isActive: true,
  });

  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['master-lead-sources'],
    queryFn: async () => {
      const res: any = await api.get('/master/lead-sources');
      return res?.data || res || [];
    },
  });

  const sources: LeadSourceItem[] = Array.isArray(resData) ? resData : [];

  const filtered = sources.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getSourceIcon = (code: string) => {
    switch (code) {
      case 'WEBSITE': return Globe;
      case 'REFERRAL': return Users;
      case 'COLD_CALL': return PhoneCall;
      case 'CAMPAIGN': return Megaphone;
      default: return Target;
    }
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formData.code.trim() || !formData.name.trim()) {
        throw new Error('Code and Name are required');
      }

      if (editingItem) {
        return api.patch(`/master/items/${editingItem.id}`, {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim(),
          isActive: formData.isActive,
        });
      } else {
        return api.post('/master/items', {
          type: 'LEAD_SOURCE',
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim(),
          isActive: formData.isActive,
        });
      }
    },
    onSuccess: () => {
      toast.success(editingItem ? 'Lead source updated successfully' : 'Lead source created successfully');
      queryClient.invalidateQueries({ queryKey: ['master-lead-sources'] });
      queryClient.invalidateQueries({ queryKey: ['master-summary'] });
      setIsDrawerOpen(false);
      setEditingItem(null);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/master/items/${id}`);
    },
    onSuccess: () => {
      toast.success('Lead source deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['master-lead-sources'] });
      queryClient.invalidateQueries({ queryKey: ['master-summary'] });
      setDeletingItem(null);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      isActive: true,
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (item: LeadSourceItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
      isActive: item.isActive ?? true,
    });
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Lead Sources Master"
        description="Customer acquisition channels tracking origin, ROI attribution, and sales funnel entry points."
        icon={Target}
        iconColor="text-indigo-600"
        badge={{ text: 'CRM Acquisition', icon: Target, variant: 'indigo' }}
        breadcrumbs={[
          { label: 'Master Data', href: '/master' },
          { label: 'Lead Sources' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <AdminButton
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Refresh
            </AdminButton>
            <AdminButton
              variant="primary"
              size="md"
              icon={Plus}
              onClick={handleOpenCreate}
            >
              Add Lead Source
            </AdminButton>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search lead sources..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing <strong>{filtered.length}</strong> sources
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => {
          const Icon = getSourceIcon(s.code);
          return (
            <div
              key={s.id || s.code}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mr-1">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(s)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingItem(s)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-black text-slate-900 mt-3">{s.name}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  {s.description || 'Customer lead acquisition channel.'}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Attributed Leads</span>
                  <span className="text-base font-black text-slate-900">{s.count || 0} Leads</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-md">
                  {s.code}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT DRAWER */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingItem ? 'Edit Lead Source' : 'Add Lead Source'}
        description="Configure customer acquisition and advertising channel mapping."
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="px-5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs transition-all disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving...' : editingItem ? 'Update Source' : 'Create Source'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <AdminFormField label="Source Code" required hint="Uppercase identifier (e.g. TIKTOK_ADS, EXPO)">
            <AdminInput
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. TIKTOK_ADS"
            />
          </AdminFormField>

          <AdminFormField label="Channel Name" required hint="Display name in lead forms and analytics">
            <AdminInput
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. TikTok Ads Campaign"
            />
          </AdminFormField>

          <AdminFormField label="Description">
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Channel details, target segment, or tracking notes..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#23C45E]"
            />
          </AdminFormField>
        </div>
      </AdminFormDrawer>

      {/* CONFIRM DELETE DIALOG */}
      <AdminConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {
          if (deletingItem) deleteMutation.mutate(deletingItem.id);
        }}
        isLoading={deleteMutation.isPending}
        title="Delete Lead Source?"
        message={`Are you sure you want to delete "${deletingItem?.name}" (${deletingItem?.code})?`}
        confirmText="Delete Record"
        variant="danger"
      />
    </div>
  );
}
