'use client';

import React, { useState } from 'react';
import {
  Share2,
  Plus,
  Search,
  Building2,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Calendar,
  RefreshCw,
  SlidersHorizontal,
  User,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Twitter,
  Globe,
  Briefcase,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  AdminPageHero,
  AdminStatCard,
  AdminFormDrawer,
  AdminPagination,
  AdminConfirmDialog,
  CustomerDetailsDrawer,
} from '@/components/admin';
import {
  SocialMediaService,
  SocialMediaHandlerItem,
  CreateSocialMediaHandlerPayload,
  UpdateSocialMediaHandlerPayload,
} from '@/lib/services/social-media.service';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';

const PLATFORMS = [
  { value: 'ALL', label: 'All Platforms' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'TWITTER', label: 'Twitter / X' },
  { value: 'OTHER', label: 'Other' },
];

const WORK_TYPES = [
  'Content Posting',
  'Reel Creation',
  'Ad Campaign',
  'Graphic Design',
  'Story Management',
  'Full Social Media Handling',
];

export default function SocialMediaHandlersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Drawer / Modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingHandler, setEditingHandler] = useState<SocialMediaHandlerItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SocialMediaHandlerItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [viewingCustomerModalId, setViewingCustomerModalId] = useState<number | string | null>(null);

  // Form states
  const [formCustomerId, setFormCustomerId] = useState<string>('');
  const [formPlatform, setFormPlatform] = useState<string>('INSTAGRAM');
  const [formAccountName, setFormAccountName] = useState<string>('');
  const [formAccountUrl, setFormAccountUrl] = useState<string>('');
  const [formSocialMediaId, setFormSocialMediaId] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formHandlerName, setFormHandlerName] = useState<string>('');
  const [formHandlerPhone, setFormHandlerPhone] = useState<string>('');
  const [formHandlerEmail, setFormHandlerEmail] = useState<string>('');
  const [formWorkType, setFormWorkType] = useState<string>('Content Posting');
  const [formStatus, setFormStatus] = useState<string>('ACTIVE');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formStartDate, setFormStartDate] = useState<string>('');
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formDurationDays, setFormDurationDays] = useState<number>(30);

  // 1. Fetch Customers for dropdown selection
  const { data: customers = [] } = useQuery({
    queryKey: ['admin-customers-dropdown'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/customers', { params: { limit: 100 } });
        const items = res?.data?.items || res?.data?.data || res?.items || res?.data || (Array.isArray(res) ? res : []);
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
  });

  // 2. Fetch Handlers Query
  const {
    data: handlersResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin-social-media-handlers', page, pageSize, search, selectedPlatform, selectedStatus, selectedCustomerId],
    refetchInterval: 10000,
    queryFn: async () => {
      const params: any = {
        page,
        limit: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedPlatform !== 'ALL') params.platform = selectedPlatform;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (selectedCustomerId !== 'ALL') params.customerId = selectedCustomerId;

      return SocialMediaService.getHandlers(params);
    },
  });

  const handlerItems: SocialMediaHandlerItem[] = handlersResponse?.items || [];
  const pagination = handlersResponse?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateSocialMediaHandlerPayload) => SocialMediaService.createHandler(payload),
    onSuccess: () => {
      toast.success('Social Media Handler added successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-social-media-handlers'] });
      setIsDrawerOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateSocialMediaHandlerPayload }) =>
      SocialMediaService.updateHandler(id, payload),
    onSuccess: () => {
      toast.success('Social Media Handler updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-social-media-handlers'] });
      setIsDrawerOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => SocialMediaService.deleteHandler(id),
    onSuccess: () => {
      toast.success('Social Media Handler deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-social-media-handlers'] });
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const resetForm = () => {
    setEditingHandler(null);
    setFormCustomerId(customers.length > 0 ? String(customers[0].id) : '');
    setFormPlatform('INSTAGRAM');
    setFormAccountName('');
    setFormAccountUrl('');
    setFormSocialMediaId('');
    setFormPassword('');
    setShowPassword(false);
    setFormHandlerName('');
    setFormHandlerPhone('');
    setFormHandlerEmail('');
    setFormWorkType('Content Posting');
    setFormStatus('ACTIVE');
    setFormNotes('');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setFormDurationDays(30);
  };

  const openCreateDrawer = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (item: SocialMediaHandlerItem) => {
    setEditingHandler(item);
    setFormCustomerId(String(item.customerId));
    setFormPlatform(item.platform);
    setFormAccountName(item.accountName);
    setFormAccountUrl(item.accountUrl || '');
    setFormSocialMediaId(item.socialMediaId || item.accountName || '');
    setFormPassword(item.password || '');
    setShowPassword(false);
    setFormHandlerName(item.handlerName || '');
    setFormHandlerPhone(item.handlerPhone || '');
    setFormHandlerEmail(item.handlerEmail || '');
    setFormWorkType(item.workType || 'Content Posting');
    setFormStatus(item.status);
    setFormNotes(item.notes || '');
    setFormStartDate(item.startDate ? item.startDate.split('T')[0] : '');
    setFormEndDate(item.endDate ? item.endDate.split('T')[0] : '');
    setFormDurationDays(item.durationDays || 30);
    setIsDrawerOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAccountName.trim()) {
      toast.error('Please enter the account name / handle');
      return;
    }
    if (!formCustomerId && !editingHandler) {
      toast.error('Please select a customer');
      return;
    }

    const payload: CreateSocialMediaHandlerPayload = {
      customerId: Number(formCustomerId),
      platform: formPlatform,
      accountName: formAccountName.trim(),
      accountUrl: formAccountUrl.trim() || undefined,
      socialMediaId: formSocialMediaId.trim() || undefined,
      password: formPassword.trim() || undefined,
      handlerName: formHandlerName.trim() || undefined,
      handlerPhone: formHandlerPhone.trim() || undefined,
      handlerEmail: formHandlerEmail.trim() || undefined,
      workType: formWorkType,
      status: formStatus,
      notes: formNotes.trim() || undefined,
      startDate: formStartDate ? new Date(formStartDate).toISOString() : undefined,
      endDate: formEndDate ? new Date(formEndDate).toISOString() : undefined,
      durationDays: formDurationDays,
    };

    if (editingHandler) {
      updateMutation.mutate({ id: editingHandler.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toUpperCase()) {
      case 'INSTAGRAM':
        return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'FACEBOOK':
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'YOUTUBE':
        return <Youtube className="w-4 h-4 text-red-600" />;
      case 'LINKEDIN':
        return <Linkedin className="w-4 h-4 text-sky-600" />;
      case 'TWITTER':
        return <Twitter className="w-4 h-4 text-cyan-500" />;
      default:
        return <Globe className="w-4 h-4 text-slate-500" />;
    }
  };

  const activeCount = handlerItems.filter((h) => h.status === 'ACTIVE').length;
  const instaCount = handlerItems.filter((h) => h.platform === 'INSTAGRAM').length;
  const fbCount = handlerItems.filter((h) => h.platform === 'FACEBOOK').length;

  return (
    <div className="space-y-6">
      {/* 1. Page Hero */}
      <AdminPageHero
        title="SSM ACCOUNT ACCESS DETAILS"
        description="Manage and review submitted SSM account access details"
        badge={{ text: 'Campaign Hub', icon: Share2, variant: 'purple' }}
        actions={
          <button
            onClick={openCreateDrawer}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add SSM Account</span>
          </button>
        }
      />

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard title="Total Handlers" value={pagination.total} icon={Share2} />
        <AdminStatCard title="Active Accounts" value={activeCount} icon={CheckCircle2} />
        <AdminStatCard title="Instagram Accounts" value={instaCount} icon={Instagram} />
        <AdminStatCard title="Facebook Accounts" value={fbCount} icon={Facebook} />
      </div>

      {/* 3. Filters & Search */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by account handle, customer name, handler name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Customer Filter */}
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Customer"
              className="text-xs font-semibold bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none"
            >
              <option value="ALL">All Customers</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.companyName} (#{c.id})
                </option>
              ))}
            </select>

            {/* Platform Filter */}
            <select
              value={selectedPlatform}
              onChange={(e) => {
                setSelectedPlatform(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Platform"
              className="text-xs font-semibold bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Status"
              className="text-xs font-semibold bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PAUSED">Paused</option>
            </select>

            <button
              onClick={() => refetch()}
              className="p-2 border border-border rounded-lg bg-background text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh handlers"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Platform & Account</th>
                <th className="py-3.5 px-4 font-semibold">Assigned Handler</th>
                <th className="py-3.5 px-4 font-semibold">Work Type</th>
                <th className="py-3.5 px-4 font-semibold">Schedule Period</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Loading social media handlers...</span>
                    </div>
                  </td>
                </tr>
              ) : handlerItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Share2 className="w-8 h-8 mx-auto text-muted-foreground/50" />
                      <p className="text-base font-semibold text-foreground">No handlers found</p>
                      <p className="text-xs text-muted-foreground">
                        {search || selectedPlatform !== 'ALL' || selectedCustomerId !== 'ALL'
                          ? 'No handlers match your filters.'
                          : 'Get started by creating your first social media handler for a customer.'}
                      </p>
                      <button
                        onClick={openCreateDrawer}
                        className="mt-4 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                      >
                        + Add Handler
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                handlerItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.customerId) {
                            setViewingCustomerModalId(item.customerId);
                          }
                        }}
                        className="font-semibold text-foreground text-left hover:text-[#1AA14D] transition-colors cursor-pointer block"
                      >
                        {item.customer?.name || item.customer?.companyName || `Customer #${item.customerId}`}
                      </button>
                      {item.customer?.email && (
                        <div className="text-xs text-muted-foreground">{item.customer.email}</div>
                      )}
                    </td>

                    {/* Platform & Account */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(item.platform)}
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-1">
                            {item.accountName}
                            {item.accountUrl && (
                              <a
                                href={item.accountUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">
                            {item.platform}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Handler */}
                    <td className="py-3.5 px-4">
                      {item.handlerName ? (
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-1">
                            <User className="w-3 h-3 text-muted-foreground" />
                            {item.handlerName}
                          </div>
                          {item.handlerPhone && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5" /> {item.handlerPhone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">Unassigned</span>
                      )}
                    </td>

                    {/* Work Type */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {item.workType || 'Content Posting'}
                      </span>
                    </td>

                    {/* Schedule */}
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      {item.startDate ? (
                        <div>
                          <span>{new Date(item.startDate).toLocaleDateString()}</span>
                          {item.endDate && (
                            <span> → {new Date(item.endDate).toLocaleDateString()}</span>
                          )}
                          <div className="text-[10px] text-muted-foreground/70">
                            {item.durationDays || 30} days duration
                          </div>
                        </div>
                      ) : (
                        <span>Ongoing</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'PAUSED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {item.status === 'ACTIVE' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-slate-400" />
                        )}
                        {item.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditDrawer(item)}
                          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit Handler"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(item);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-700 transition-colors"
                          title="Delete Handler"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <AdminPagination
          page={pagination.page}
          pageSize={pagination.limit}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* 5. Create / Edit Drawer */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingHandler ? 'Edit SSM Account Details' : 'Add SSM Account'}
        subtitle="Manage and review submitted SSM account access details"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Customer Organization *
            </label>
            <select
              value={formCustomerId}
              onChange={(e) => setFormCustomerId(e.target.value)}
              required
              disabled={Boolean(editingHandler)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select a customer...</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.companyName} (#{c.id})
                </option>
              ))}
            </select>
          </div>

          {/* Platform & Account Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Platform *
              </label>
              <select
                value={formPlatform}
                onChange={(e) => setFormPlatform(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="INSTAGRAM">Instagram</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="TWITTER">Twitter / X</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Account Handle / Name *
              </label>
              <input
                type="text"
                value={formAccountName}
                onChange={(e) => setFormAccountName(e.target.value)}
                placeholder="e.g. @carefitnessgym"
                required
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Account URL */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Account Profile URL
            </label>
            <input
              type="url"
              value={formAccountUrl}
              onChange={(e) => setFormAccountUrl(e.target.value)}
              placeholder="https://instagram.com/carefitnessgym"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Social Media ID & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Social Media ID
              </label>
              <input
                type="text"
                value={formSocialMediaId}
                onChange={(e) => setFormSocialMediaId(e.target.value)}
                placeholder="e.g. carefitness_official"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Enter account password"
                  className="w-full px-3 py-2 pr-10 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Handler Executive Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Handler Name
              </label>
              <input
                type="text"
                value={formHandlerName}
                onChange={(e) => setFormHandlerName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Handler Phone
              </label>
              <input
                type="tel"
                value={formHandlerPhone}
                onChange={(e) => setFormHandlerPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Handler Email
              </label>
              <input
                type="email"
                value={formHandlerEmail}
                onChange={(e) => setFormHandlerEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Work Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Work Type
              </label>
              <select
                value={formWorkType}
                onChange={(e) => setFormWorkType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {WORK_TYPES.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Dates & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Duration (Days)
              </label>
              <input
                type="number"
                value={formDurationDays}
                onChange={(e) => setFormDurationDays(Number(e.target.value))}
                min={1}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Notes & Execution Guidelines
            </label>
            <textarea
              rows={3}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="e.g. Post 3 reels per week, ensure customer brand guidelines are followed..."
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {editingHandler ? 'Save Changes' : 'SUBMIT ACCOUNT DETAILS'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* 6. Delete Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
        title="Delete Social Media Handler"
        description={`Are you sure you want to delete ${deleteTarget?.accountName} (${deleteTarget?.platform})? This action cannot be undone.`}
        confirmLabel="Delete Handler"
        variant="danger"
        loading={deleteMutation.isPending}
      />

      {/* 7. Customer Details Right-Side Drawer */}
      <CustomerDetailsDrawer
        customerId={viewingCustomerModalId}
        isOpen={!!viewingCustomerModalId}
        onClose={() => setViewingCustomerModalId(null)}
      />
    </div>
  );
}
