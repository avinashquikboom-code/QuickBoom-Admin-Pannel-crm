'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Search,
  Plus,
  Edit2,
  Copy,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Sparkles,
  Shield,
  Layers,
  Code2,
  Key,
  Info,
  X,
  Send,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface EmailTemplate {
  id: number;
  customerId?: number | null;
  name: string;
  templateName?: string;
  key: string;
  identifierKey?: string;
  subject: string;
  body: string;
  description?: string | null;
  category?: string;
  supportedVariables: string[];
  isSystem: boolean;
  isActive: boolean;
  updatedAt: string;
  createdAt?: string;
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'CRM', label: 'CRM & Leads (CRM)' },
  { id: 'AUTH', label: 'Authentication' },
  { id: 'HR', label: 'HR & Onboarding' },
  { id: 'LEAVE', label: 'Leaves' },
  { id: 'GENERAL', label: 'General' },
];

const TELECALLER_VARIABLES = [
  { key: 'leadTitle', label: '{{leadTitle}}', desc: 'Lead / Client Name (e.g. Mr. Raj Sharma)' },
  { key: 'userName', label: '{{userName}}', desc: 'Telecaller / Agent Name (e.g. Avinash)' },
  { key: 'email', label: '{{email}}', desc: 'Sender Email (e.g. sales@quikboom.com)' },
  { key: 'startDate', label: '{{startDate}}', desc: 'Scheduled Visit Date (e.g. 25 September 2026)' },
  { key: 'startTime', label: '{{startTime}}', desc: 'Scheduled Visit Time (e.g. 11:30 AM)' },
];

export default function CrmEmailTemplatesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('CRM');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTestSendModalOpen, setIsTestSendModalOpen] = useState(false);

  // Selected Template
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    key: '',
    subject: '',
    body: '',
    description: '',
    category: 'CRM',
    isActive: true,
    supportedVariables: [] as string[],
  });

  // Test Send State
  const [testRecipient, setTestRecipient] = useState(user?.email || 'admin@quikboom.com');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Fetch Templates
  const {
    data: templates = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<EmailTemplate[]>({
    queryKey: ['crm-email-templates', selectedCategory, statusFilter, searchQuery],
    queryFn: async () => {
      const params: any = {};
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (statusFilter === 'ACTIVE') params.isActive = 'true';
      if (statusFilter === 'INACTIVE') params.isActive = 'false';
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res: any = await api.get('/email/templates', { params });
      return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    },
  });

  // Toggle Active Mutation
  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.patch(`/email/templates/${id}/toggle`);
    },
    onSuccess: () => {
      toast.success('Template status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-email-templates'] });
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update template status');
    },
  });

  // Duplicate Mutation
  const duplicateMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.post(`/email/templates/${id}/duplicate`);
    },
    onSuccess: (res: any) => {
      toast.success('Template duplicated successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-email-templates'] });
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to duplicate template');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/email/templates/${id}`);
    },
    onSuccess: () => {
      toast.success('Email template removed');
      setIsDeleteModalOpen(false);
      setTemplateToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['crm-email-templates'] });
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete template');
    },
  });

  // Save Mutation (Create / Update)
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        name: data.name.trim(),
        templateName: data.name.trim(),
        key: data.key.trim().toUpperCase(),
        identifierKey: data.key.trim().toUpperCase(),
        subject: data.subject.trim(),
        body: data.body,
        description: data.description?.trim() || undefined,
        category: data.category?.trim().toUpperCase() || 'CRM',
        isActive: data.isActive,
        supportedVariables: data.supportedVariables,
      };

      if (data.id && data.id > 0) {
        return api.put(`/email/templates/${data.id}`, payload);
      } else {
        return api.post('/email/templates', payload);
      }
    },
    onSuccess: () => {
      toast.success(formData.id > 0 ? 'Template updated successfully' : 'Template created successfully');
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['crm-email-templates'] });
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save template');
    },
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedTemplate(null);
    setFormData({
      id: 0,
      name: '',
      key: '',
      subject: '',
      body: `Dear {{leadTitle}},\n\nThank you for your interest in QUIKBOOM Digital Marketing Agency.\n\nRegards,\n\n{{userName}}\n\nQUIKBOOM Digital Marketing Agency\n\n{{email}}`,
      description: '',
      category: 'CRM',
      isActive: true,
      supportedVariables: ['leadTitle', 'userName', 'email'],
    });
    setIsEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      id: template.id,
      name: template.templateName || template.name,
      key: template.identifierKey || template.key,
      subject: template.subject,
      body: template.body,
      description: template.description || '',
      category: template.category || 'CRM',
      isActive: template.isActive,
      supportedVariables: template.supportedVariables || [],
    });
    setIsEditModalOpen(true);
  };

  // Open View Modal
  const handleOpenView = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsViewModalOpen(true);
  };

  // Open Preview Modal
  const handleOpenPreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewModalOpen(true);
  };

  // Open Test Send Modal
  const handleOpenTestSend = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsTestSendModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = (template: EmailTemplate) => {
    if (template.isSystem) {
      toast.error('System email templates cannot be deleted. You can deactivate them instead.');
      return;
    }
    setTemplateToDelete(template);
    setIsDeleteModalOpen(true);
  };

  // Execute Test Send
  const handleSendTestEmail = async () => {
    if (!testRecipient.trim()) {
      toast.error('Please enter a recipient email address');
      return;
    }
    if (!selectedTemplate) return;

    setIsSendingTest(true);
    try {
      const res: any = await api.post('/email/templates/test-send', {
        to: testRecipient.trim(),
        templateId: selectedTemplate.id,
        templateKey: selectedTemplate.key,
        subject: selectedTemplate.subject,
        body: selectedTemplate.body,
      });
      toast.success(res?.message || res?.data?.message || `Test email dispatched to ${testRecipient}`);
      setIsTestSendModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to send test email');
    } finally {
      setIsSendingTest(false);
    }
  };

  // Insert variable into active body editor
  const handleInsertVariable = (varName: string) => {
    const placeholder = `{{${varName}}}`;
    setFormData((prev) => ({
      ...prev,
      body: prev.body + (prev.body.endsWith(' ') || prev.body.endsWith('\n') ? '' : ' ') + placeholder,
      supportedVariables: prev.supportedVariables.includes(varName)
        ? prev.supportedVariables
        : [...prev.supportedVariables, varName],
    }));
    toast.success(`Inserted ${placeholder}`);
  };

  // Render Preview using Exact Sample Data
  const renderSamplePreview = (text: string) => {
    const sampleVars: Record<string, string> = {
      leadTitle: 'Mr. Raj Sharma',
      userName: 'Avinash',
      email: 'sales@quikboom.com',
      startDate: '25 September 2026',
      startTime: '11:30 AM',
      companyName: 'QUIKBOOM Digital Marketing Agency',
      primaryColor: '#16A34A',
      logoUrl: 'https://admin.qbapp.online/logo.png',
    };

    const interpolated = text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, v) => sampleVars[v] || match);
    // Replace CID image references with public absolute HTTPS logo and dynamic primary color
    return interpolated
      .replace(/cid:quikboom-logo/g, 'https://admin.qbapp.online/logo.png')
      .replace(/src=["']\/logo\.png["']/g, 'src="https://admin.qbapp.online/logo.png"')
      .replace(/src=["']\/app_logo\.png["']/g, 'src="https://admin.qbapp.online/logo.png"')
      .replace(/linear-gradient\(135deg,\s*#0f172a,\s*#1e293b\)/g, '#16A34A');
  };

  // Convert plain text body with link styling for preview
  const formatBodyForPreview = (content: string) => {
    if (!content) return '';
    if (content.includes('<html') || content.includes('<!DOCTYPE') || content.includes('<body')) {
      return content;
    }

    const lines = content.split('\n');
    return lines
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return '<br />';
        if (trimmed === 'Visit QUIKBOOM Website') {
          return '<div style="margin: 16px 0; text-align: center;"><a href="https://quikboom.com" target="_blank" style="display: inline-block; padding: 10px 24px; background-color: #16A34A; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Visit QUIKBOOM Website &rarr;</a></div>';
        }
        return `<p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: #334155;">${trimmed}</p>`;
      })
      .join('\n');
  };

  // Stats Counters
  const totalCount = templates.length;
  const activeCount = templates.filter((t) => t.isActive).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in duration-200">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
              <span>CRM</span>
              <span>/</span>
              <span className="text-white">Email Templates</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Email Templates
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
              Manage CRM customer communication templates. Automatically dispatched as leads progress through the Telecaller CRM pipeline.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              title="Refresh Templates"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-blue-300' : ''}`} />
            </button>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 bg-[#1AA14D] hover:bg-[#168940] text-white px-5 py-3 rounded-2xl font-black text-xs shadow-lg shadow-emerald-900/30 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" /> Create Template
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Templates</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Active</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inactive</p>
            <p className="text-2xl font-black text-slate-600 mt-1">{inactiveCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, key, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All Status' : st === 'ACTIVE' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Template Name</th>
                <th className="py-3.5 px-4">Identifier Key</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Updated At</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading email templates...
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No email templates found matching the criteria.
                  </td>
                </tr>
              ) : (
                templates.map((tpl) => (
                  <tr key={tpl.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Template Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{tpl.templateName || tpl.name}</span>
                        {tpl.isSystem && (
                          <span
                            title="System Template"
                            className="p-1 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                          >
                            <Shield className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      {tpl.description && (
                        <p className="text-[11px] font-normal text-slate-400 line-clamp-1 mt-0.5">
                          {tpl.description}
                        </p>
                      )}
                    </td>

                    {/* Identifier Key */}
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 text-[11px]">
                      {tpl.identifierKey || tpl.key}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                        {tpl.category === 'CRM' ? 'CRM & Leads' : tpl.category || 'General'}
                      </span>
                    </td>

                    {/* Subject */}
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate font-medium">
                      {tpl.subject}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleMutation.mutate(tpl.id)}
                        disabled={toggleMutation.isPending}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black cursor-pointer transition-all ${
                          tpl.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                        }`}
                        title="Click to toggle Active / Inactive"
                      >
                        {tpl.isActive ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactive
                          </>
                        )}
                      </button>
                    </td>

                    {/* Updated At */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(tpl.updatedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {/* Preview */}
                        <button
                          onClick={() => handleOpenPreview(tpl)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Preview Template with Sample Data"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* View */}
                        <button
                          onClick={() => handleOpenView(tpl)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="View Details"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(tpl)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit Template"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => duplicateMutation.mutate(tpl.id)}
                          disabled={duplicateMutation.isPending}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-50"
                          title="Duplicate Template"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Test Send */}
                        <button
                          onClick={() => handleOpenTestSend(tpl)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Send Test Email"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        {!tpl.isSystem && (
                          <button
                            onClick={() => handleConfirmDelete(tpl)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= EDIT / CREATE MODAL ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {formData.id > 0 ? 'Edit Email Template' : 'Create Email Template'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {formData.id > 0
                    ? `Update template "${formData.name}" and placeholders.`
                    : 'Define a new reusable email template with variable interpolation.'}
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 overflow-y-auto space-y-4 flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Template Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Template Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. New Lead – QUIKBOOM"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>

                {/* Identifier Key */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Identifier Key <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={selectedTemplate?.isSystem}
                    value={formData.key}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        key: e.target.value.toUpperCase().replace(/[\s-]+/g, '_'),
                      })
                    }
                    placeholder="e.g. QUIKBOOM_NEW_LEAD"
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  {selectedTemplate?.isSystem && (
                    <p className="text-[10px] text-slate-400 mt-1">System identifier keys are protected.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-700"
                  >
                    <option value="CRM">CRM & Leads (CRM)</option>
                    <option value="AUTH">Authentication</option>
                    <option value="HR">HR & Onboarding</option>
                    <option value="LEAVE">Leaves</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                  <span className="text-xs font-bold text-slate-700">
                    {formData.isActive ? 'Active (Ready for automatic sending)' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Thank You for Connecting with QUIKBOOM"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              {/* Available Variables Bar */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-blue-600" /> Available Variables
                  </span>
                  <span className="text-[10px] text-slate-400">Click variable to insert into body</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TELECALLER_VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => handleInsertVariable(v.key)}
                      title={v.desc}
                      className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-mono font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Body (Multiline Text or HTML) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={10}
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Enter email content with {{variables}}..."
                  className="w-full p-3 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Sent automatically when a new inquiry connects with QUIKBOOM"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveMutation.mutate(formData)}
                disabled={saveMutation.isPending || !formData.name.trim() || !formData.subject.trim() || !formData.body.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {formData.id > 0 ? 'Save Changes' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PREVIEW MODAL (Exact Sample Data) ================= */}
      {isPreviewModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Eye className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Email Preview</h3>
                  <p className="text-xs text-slate-400">Rendered with verified sample lead data</p>
                </div>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Card Container */}
            <div className="py-4 overflow-y-auto space-y-4 flex-1 pr-1">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="font-bold w-16 text-slate-400">To:</span>
                  <span className="font-mono text-slate-800 font-semibold">sales@quikboom.com</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="font-bold w-16 text-slate-400">Subject:</span>
                  <span className="font-bold text-slate-900">
                    {renderSamplePreview(selectedTemplate.subject)}
                  </span>
                </div>
              </div>

              {/* Rendered Email Body Box */}
              <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-xs">
                {/* Responsive Header banner */}
                <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 tracking-tight">QUIKBOOM</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Digital Marketing Agency</p>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-lg uppercase tracking-wider">
                    {selectedTemplate.identifierKey || selectedTemplate.key}
                  </span>
                </div>

                {/* Email Body Content */}
                <div
                  className="text-xs text-slate-700 leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{
                    __html: formatBodyForPreview(renderSamplePreview(selectedTemplate.body)),
                  }}
                />

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
                  Sent via <strong>QUIKBOOM Digital Marketing Agency</strong> • CRM
                </div>
              </div>

              {/* Sample Variables Legend */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1 font-mono">
                <p className="font-bold text-slate-700 mb-1 font-sans">Sample Data Injected:</p>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>leadTitle = Mr. Raj Sharma</div>
                  <div>userName = Avinash</div>
                  <div>email = sales@quikboom.com</div>
                  <div>startDate = 25 September 2026</div>
                  <div>startTime = 11:30 AM</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW MODAL ================= */}
      {isViewModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <Info className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-slate-900">Template Details</h3>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto space-y-3 text-xs flex-1">
              <div>
                <span className="text-slate-400 font-bold block mb-0.5">Template Name</span>
                <span className="font-bold text-slate-900 text-sm">{selectedTemplate.templateName || selectedTemplate.name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-0.5">Identifier Key</span>
                <span className="font-mono font-bold text-blue-600">{selectedTemplate.identifierKey || selectedTemplate.key}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-0.5">Category</span>
                <span className="font-semibold text-slate-800">{selectedTemplate.category || 'CRM'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-0.5">Subject</span>
                <span className="font-semibold text-slate-800">{selectedTemplate.subject}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-1">Body Template</span>
                <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] whitespace-pre-wrap text-slate-700">
                  {selectedTemplate.body}
                </pre>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-0.5">Status</span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    selectedTemplate.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {selectedTemplate.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TEST SEND MODAL ================= */}
      {isTestSendModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Send className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-slate-900">Send Test Email</h3>
              </div>
              <button
                onClick={() => setIsTestSendModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <p className="text-slate-600 font-medium">
                Dispatches a live test email rendered with sample variables via configured SMTP server.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  required
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTestSendModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isSendingTest || !testRecipient.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm disabled:opacity-50"
              >
                {isSendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {isDeleteModalOpen && templateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 text-center mb-1">
              Delete Email Template?
            </h3>
            <p className="text-xs text-slate-500 text-center mb-6">
              Are you sure you want to remove <strong>{templateToDelete.name}</strong> ({templateToDelete.key})? Historical email logs will remain preserved.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTemplateToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(templateToDelete.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
