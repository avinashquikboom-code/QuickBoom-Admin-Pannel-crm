'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  ArrowLeft,
  Search,
  Plus,
  Edit2,
  Trash2,
  Send,
  Eye,
  CheckCircle2,
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
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { AdminFormDrawer } from '@/components/admin/dialogs/AdminFormDrawer';

interface EmailTemplate {
  id: number;
  customerId?: number | null;
  name: string;
  key: string;
  subject: string;
  body: string;
  description?: string | null;
  category?: string;
  supportedVariables: string[];
  isSystem: boolean;
  isActive: boolean;
  updatedAt: string;
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'AUTH', label: 'Authentication' },
  { id: 'HR', label: 'HR & Onboarding' },
  { id: 'LEAVE', label: 'Leaves' },
  { id: 'CRM', label: 'CRM & Leads' },
  { id: 'GENERAL', label: 'General' },
];

const COMMON_VARIABLES = [
  'customerName',
  'companyName',
  'leadTitle',
  'contactEmail',
  'supportPhone',
  'userName',
  'email',
  'otp',
  'resetLink',
  'loginUrl',
  'temporaryPassword',
  'designation',
  'leaveType',
  'startDate',
  'endDate',
  'approverName',
  'remarks',
  'leadContact',
  'leadPhone',
  'leadCity',
  'leadValue',
  'companyLogoUrl',
  'primaryColor',
];

export default function EmailTemplatesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isTestSendModalOpen, setIsTestSendModalOpen] = useState(false);

  // Selected / Active Template Form State
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    key: '',
    subject: '',
    body: '',
    description: '',
    category: 'GENERAL',
    isActive: true,
    supportedVariables: [] as string[],
  });

  // Test Send State
  const [testRecipient, setTestRecipient] = useState(user?.email || 'admin@quickboom.com');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Fetch Templates
  const {
    data: templates = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<EmailTemplate[]>({
    queryKey: ['email-templates', selectedCategory, statusFilter, searchQuery],
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
      toast.success('Template status updated');
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update template status');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/email/templates/${id}`);
    },
    onSuccess: () => {
      toast.success('Email template removed');
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete template');
    },
  });

  // Save Mutation (Create or Update)
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (data.id && data.id > 0) {
        return api.put(`/email/templates/${data.id}`, {
          name: data.name,
          key: data.key,
          subject: data.subject,
          body: data.body,
          description: data.description,
          category: data.category,
          isActive: data.isActive,
          supportedVariables: data.supportedVariables,
        });
      } else {
        return api.post('/email/templates', {
          name: data.name,
          key: data.key,
          subject: data.subject,
          body: data.body,
          description: data.description,
          category: data.category,
          isActive: data.isActive,
          supportedVariables: data.supportedVariables,
        });
      }
    },
    onSuccess: () => {
      toast.success(formData.id > 0 ? 'Template updated successfully' : 'Template created successfully');
      setIsEditModalOpen(false);
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
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
  <h2 style="color: #0f172a; margin-top: 0;">Notification from {{companyName}}</h2>
  <p style="color: #475569; font-size: 15px;">Hello {{userName}},</p>
  <p style="color: #475569; font-size: 15px;">This is an automated notification regarding your account.</p>
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="color: #94a3b8; font-size: 12px;">Warm regards,<br /><strong>{{companyName}}</strong></p>
</div>`,
      description: '',
      category: 'GENERAL',
      isActive: true,
      supportedVariables: ['companyName', 'userName'],
    });
    setIsEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      id: template.id,
      name: template.name,
      key: template.key,
      subject: template.subject,
      body: template.body,
      description: template.description || '',
      category: template.category || 'GENERAL',
      isActive: template.isActive,
      supportedVariables: template.supportedVariables || [],
    });
    setIsEditModalOpen(true);
  };

  // Open Preview in Right-side Drawer
  const handleOpenPreview = (template: EmailTemplate) => {
    handleOpenEdit(template);
  };

  // Open Test Send Modal
  const handleOpenTestSend = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsTestSendModalOpen(true);
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

  // Insert variable into active field
  const handleInsertVariable = (varName: string) => {
    const placeholder = `{{${varName}}}`;
    setFormData((prev) => ({
      ...prev,
      body: prev.body + (prev.body.endsWith(' ') || prev.body.endsWith('\n') ? '' : ' ') + placeholder,
      supportedVariables: prev.supportedVariables.includes(varName)
        ? prev.supportedVariables
        : [...prev.supportedVariables, varName],
    }));
    toast.success(`Inserted {{${varName}}}`);
  };

  // Safe sample preview renderer
  const renderInterpolatedPreview = (text: string) => {
    const sampleVars: Record<string, string> = {
      customerName: 'Acme Technologies Ltd',
      companyName: 'QuickBoom Technologies',
      leadTitle: 'Acme Technologies Ltd',
      contactEmail: 'billing@acme.com',
      supportPhone: '+91 8000 123 456',
      userName: 'Alex Smith',
      otp: '748291',
      email: 'alex.smith@example.com',
      temporaryPassword: 'QB-Pass992',
      resetLink: 'https://crm.quickboom.com/reset-password',
      loginUrl: 'https://crm.quickboom.com/login',
      designation: 'Senior Account Executive',
      leaveType: 'Casual Leave',
      startDate: new Date().toLocaleDateString('en-IN'),
      endDate: new Date(Date.now() + 86400000 * 3).toLocaleDateString('en-IN'),
      approverName: 'Manager Sarah',
      remarks: 'Approved as discussed in 1-on-1 meeting.',
      rejectionReason: 'Urgent sprint deployment scheduled.',
      recipientName: 'Vikram Patel',
      leadContact: 'Vikram Patel',
      leadPhone: '+91 98765 43210',
      leadCity: 'Mumbai',
      leadValue: '2,50,000',
      leadNotes: 'Enterprise CRM implementation request.',
      primaryColor: '#16A34A',
      logoUrl: 'https://admin.qbapp.online/logo.png',
      companyLogoUrl: 'https://admin.qbapp.online/logo.png',
      companyLogo: 'https://admin.qbapp.online/logo.png',
      logo: 'https://admin.qbapp.online/logo.png',
    };

    let interpolated = text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, v) => sampleVars[v] || match);
    // Replace CID image references with public absolute HTTPS logo and dynamic primary color
    interpolated = interpolated
      .replace(/cid:quikboom-logo/g, 'https://admin.qbapp.online/logo.png')
      .replace(/src=["']\/logo\.png["']/g, 'src="https://admin.qbapp.online/logo.png"')
      .replace(/src=["']\/app_logo\.png["']/g, 'src="https://admin.qbapp.online/logo.png"')
      .replace(/src=["']logo\.png["']/g, 'src="https://admin.qbapp.online/logo.png"')
      .replace(/src=["']app_logo\.png["']/g, 'src="https://admin.qbapp.online/logo.png"')
      .replace(/linear-gradient\(135deg,\s*#0f172a,\s*#1e293b\)/g, '#16A34A');

    // If template body has no HTML header or tags, wrap with branded layout preview
    if (
      !interpolated.includes('<html') &&
      !interpolated.includes('<!DOCTYPE') &&
      !interpolated.includes('<body') &&
      !interpolated.includes('class="email-header"')
    ) {
      return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
        <div style="background-color: #16A34A; padding: 20px 24px; text-align: center; color: #ffffff;">
          <img src="https://admin.qbapp.online/logo.png" alt="QuickBoom Technologies" width="140" style="display: block; width: 140px; max-width: 100%; height: auto; margin: 0 auto 8px; border: 0;" />
          <h2 style="margin: 0; font-size: 16px; font-weight: 800; color: #ffffff;">QuickBoom Technologies</h2>
        </div>
        <div style="padding: 24px; font-size: 14px; line-height: 1.6; color: #334155;">
          ${
            interpolated.includes('<p') || interpolated.includes('<div')
              ? interpolated
              : interpolated
                  .split(/\n\n+/)
                  .map((p) => `<p style="margin: 0 0 12px;">${p.replace(/\n/g, '<br/>')}</p>`)
                  .join('')
          }
        </div>
      </div>`;
    }

    return interpolated;
  };

  // Stats Counters
  const totalCount = templates.length;
  const activeCount = templates.filter((t) => t.isActive).length;
  const systemCount = templates.filter((t) => t.isSystem).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 text-slate-800 animate-in fade-in duration-200">
      {/* Top Banner & Action Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Link
                href="/settings"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white transition-all backdrop-blur-xs"
                title="Back to Settings"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email Infrastructure
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Email Template Configuration
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
              Configure system and transactional email templates dispatched via corporate SMTP. Supports dynamic variable interpolation for OTPs, onboarding, leave updates, and notifications.
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

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Templates</p>
            <p className="text-2xl font-black text-[#1AA14D] mt-1">{activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1AA14D] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Events</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{systemCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Disabled</p>
            <p className="text-2xl font-black text-slate-500 mt-1">{inactiveCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Status Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search template name, key, subject..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Template Grid */}
      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading email templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
          <Mail className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-black text-slate-800">No Email Templates Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No templates matched your current filters. Create a new custom template or reset search filters.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((tpl) => {
            const isEmailOtp = tpl.key === 'EMAIL_OTP';
            return (
              <div
                key={tpl.id}
                className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between ${
                  tpl.isActive ? 'border-slate-200/80' : 'border-slate-200/60 bg-slate-50/50 opacity-80'
                }`}
              >
                <div className="p-5 space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {tpl.key}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {tpl.category || 'GENERAL'}
                        </span>
                        {tpl.isSystem ? (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-sm bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                            System
                          </span>
                        ) : (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-sm bg-emerald-50 text-[#1AA14D] border border-emerald-200 uppercase">
                            Custom
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{tpl.name}</h3>
                    </div>

                    {/* Active Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer shrink-0" title="Toggle active status">
                      <input
                        type="checkbox"
                        checked={tpl.isActive}
                        onChange={() => toggleMutation.mutate(tpl.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1AA14D]" />
                    </label>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {tpl.description || 'Dispatched on corresponding system event via configured SMTP.'}
                  </p>

                  {/* Subject Preview */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-xs">
                    <span className="font-bold text-slate-400 text-[10px] uppercase block mb-0.5">Subject:</span>
                    <p className="font-semibold text-slate-800 truncate" title={tpl.subject}>
                      {tpl.subject}
                    </p>
                  </div>

                  {/* Variables Badges */}
                  {tpl.supportedVariables && tpl.supportedVariables.length > 0 && (
                    <div>
                      <span className="font-bold text-slate-400 text-[10px] uppercase block mb-1">Variables:</span>
                      <div className="flex flex-wrap gap-1">
                        {tpl.supportedVariables.slice(0, 4).map((v) => (
                          <span
                            key={v}
                            className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60"
                          >
                            &#123;&#123;{v}&#125;&#125;
                          </span>
                        ))}
                        {tpl.supportedVariables.length > 4 && (
                          <span className="text-[10px] font-bold text-slate-400 self-center">
                            +{tpl.supportedVariables.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 rounded-b-2xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenPreview(tpl)}
                      className="p-2 hover:bg-slate-200/80 rounded-xl text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Preview Template"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenTestSend(tpl)}
                      className="p-2 hover:bg-blue-100 rounded-xl text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                      title="Send Test Email"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(tpl)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>

                    {!tpl.isSystem && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete template "${tpl.name}"?`)) {
                            deleteMutation.mutate(tpl.id);
                          }
                        }}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                        title="Delete Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= EDIT / CREATE RIGHT-SIDE SHEET ================= */}
      <AdminFormDrawer
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={formData.id > 0 ? 'Edit Email Template' : 'Create Email Template'}
        description={formData.name || 'Configure template content and dynamic variables'}
        icon={Mail}
        maxWidth="sm:max-w-[650px] lg:max-w-[750px] w-full"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2.5">
              {formData.id > 0 && (
                <button
                  type="button"
                  onClick={() => handleOpenTestSend({ ...selectedTemplate, ...formData } as any)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-all border border-blue-200 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-blue-600" /> Test Send
                </button>
              )}

              <button
                type="button"
                onClick={() => saveMutation.mutate(formData)}
                disabled={saveMutation.isPending || !formData.name.trim() || !formData.subject.trim() || !formData.body.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1AA14D] hover:bg-[#168940] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {saveMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 text-emerald-200" /> Save Changes</>
                )}
              </button>
            </div>
          </div>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Template Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Customer Welcome & Website"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              />
            </div>

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
                  setFormData({ ...formData, key: e.target.value.toUpperCase().replace(/[\s-]+/g, '_') })
                }
                placeholder="e.g. CUSTOMER_WELCOME"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-emerald-400 focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="AUTH">Authentication (AUTH)</option>
                <option value="HR">HR & Onboarding (HR)</option>
                <option value="LEAVE">Leaves & Attendance (LEAVE)</option>
                <option value="CRM">CRM & Leads (CRM)</option>
                <option value="GENERAL">General System (GENERAL)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  Active Template (Dispatched on trigger)
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g. Welcome to {{companyName}}, {{customerName}}!"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Automated notification dispatched upon customer onboarding"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            />
          </div>

          {/* Dynamic Variables Helper Palette */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">Insert Dynamic Placeholder</label>
              <span className="text-[10px] text-slate-400">Click any variable chip to insert</span>
            </div>
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl max-h-28 overflow-y-auto">
              {COMMON_VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleInsertVariable(v)}
                  className="px-2 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  + &#123;&#123;{v}&#125;&#125;
                </button>
              ))}
            </div>
          </div>

          {/* Email Body Editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Email Body (HTML / Text) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Supports rich HTML & dynamic variables</span>
            </div>
            <textarea
              required
              rows={8}
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-medium focus:ring-2 focus:ring-emerald-400 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Integrated Live Email Preview Inside Right-Side Sheet */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#23C45E]" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Live Email Preview</h3>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200/60">
                Real-Time Sample Data
              </span>
            </div>

            <div className="bg-slate-100/80 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 font-bold text-[10px] uppercase block">Rendered Subject:</span>
              <p className="text-slate-900 font-extrabold mt-0.5">
                {renderInterpolatedPreview(formData.subject || 'Subject will appear here')}
              </p>
            </div>

            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 shadow-inner overflow-hidden">
              <div
                dangerouslySetInnerHTML={{
                  __html: renderInterpolatedPreview(formData.body || '<p class="text-slate-400 italic">Email body is empty...</p>'),
                }}
                className="text-xs bg-white p-5 rounded-xl border border-slate-200 shadow-xs prose max-w-none"
              />
            </div>
          </div>
        </form>
      </AdminFormDrawer>

      {/* TEST SEND MODAL */}
      {isTestSendModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Send Test Email</h3>
                  <p className="text-xs text-slate-500 font-medium">Dispatches via corporate SMTP server</p>
                </div>
              </div>
              <button
                onClick={() => setIsTestSendModalOpen(false)}
                className="p-2 hover:bg-slate-200/70 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200/70 text-xs text-blue-900">
                <p className="font-bold">Template: {selectedTemplate.name} ({selectedTemplate.key})</p>
                <p className="text-[11px] text-blue-700 mt-0.5 truncate">
                  Subject: {selectedTemplate.subject}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Recipient Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="admin@yourcompany.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Ensure your SMTP server is active in Settings → SMTP Email Integration.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTestSendModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isSendingTest || !testRecipient.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSendingTest ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="w-3.5 h-3.5" /> Dispatch Test</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
