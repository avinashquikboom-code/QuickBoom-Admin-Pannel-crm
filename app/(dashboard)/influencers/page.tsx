'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Plus,
  Search,
  Users,
  Award,
  Sparkles,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Package,
  Calendar,
  Layers,
  Check,
  X,
  Instagram,
  Youtube,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  InfluencerAdminService,
  InfluencerItem,
  InfluencerCategoryItem,
} from '@/lib/services/influencer.service';
import {
  AdminPageHero,
  AdminStatCard,
  AdminFormDrawer,
  AdminConfirmDialog,
} from '@/components/admin';

export default function InfluencersPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Drawer & Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<InfluencerItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InfluencerItem | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formHandle, setFormHandle] = useState('');
  const [formProfileImage, setFormProfileImage] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('');
  const [formPlatform, setFormPlatform] = useState('INSTAGRAM');
  const [formCategoryId, setFormCategoryId] = useState<number | undefined>(undefined);
  const [formLocation, setFormLocation] = useState('India');
  const [formCity, setFormCity] = useState('');
  const [formLocalArea, setFormLocalArea] = useState('');
  const [formFollowers, setFormFollowers] = useState(50000);
  const [formFollowersCount, setFormFollowersCount] = useState('50K');
  const [formEngagementRate, setFormEngagementRate] = useState(4.5);
  const [formStartingPrice, setFormStartingPrice] = useState(5000);
  const [formBio, setFormBio] = useState('');
  const [formLanguages, setFormLanguages] = useState('English, Hindi');
  const [formInstagramHandle, setFormInstagramHandle] = useState('');
  const [formYoutubeHandle, setFormYoutubeHandle] = useState('');
  const [formIsVerified, setFormIsVerified] = useState(true);
  const [formTopCreator, setFormTopCreator] = useState(false);
  const [formIsFeatured, setFormIsFeatured] = useState(true);
  const [formStatus, setFormStatus] = useState('ACTIVE');

  // Queries
  const { data: influencers = [], isLoading } = useQuery({
    queryKey: ['admin-influencers', search, selectedCategory, selectedStatus],
    queryFn: () =>
      InfluencerAdminService.getInfluencers({
        search: search.trim() || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-influencer-categories'],
    queryFn: () => InfluencerAdminService.getCategories(),
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-influencer-stats'],
    queryFn: () => InfluencerAdminService.getBookingStats(),
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<InfluencerItem>) => {
      if (editingInfluencer) {
        return InfluencerAdminService.updateInfluencer(editingInfluencer.id, data);
      }
      return InfluencerAdminService.createInfluencer(data);
    },
    onSuccess: () => {
      toast.success(editingInfluencer ? 'Influencer updated' : 'Influencer created');
      queryClient.invalidateQueries({ queryKey: ['admin-influencers'] });
      setIsDrawerOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save influencer');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => InfluencerAdminService.deleteInfluencer(id),
    onSuccess: () => {
      toast.success('Influencer deactivated');
      queryClient.invalidateQueries({ queryKey: ['admin-influencers'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to deactivate influencer');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      InfluencerAdminService.updateInfluencer(id, {
        status,
        isActive: status === 'ACTIVE',
      }),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-influencers'] });
    },
  });

  const handleOpenCreate = () => {
    resetForm();
    setEditingInfluencer(null);
    if (categories.length > 0) {
      setFormCategoryId(categories[0].id);
    }
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (item: InfluencerItem) => {
    setEditingInfluencer(item);
    setFormName(item.name);
    setFormHandle(item.handle || '');
    setFormProfileImage(item.profileImage || item.avatarUrl || '');
    setFormCoverImage(item.coverImage || '');
    setFormPlatform(item.platform || 'INSTAGRAM');
    setFormCategoryId(item.categoryId || undefined);
    setFormLocation(item.location || 'India');
    setFormCity(item.city || '');
    setFormLocalArea(item.localArea || '');
    setFormFollowers(item.followers || 0);
    setFormFollowersCount(item.followersCount || `${item.followers || 0}`);
    setFormEngagementRate(item.engagementRate || 0);
    setFormStartingPrice(item.startingPrice || 5000);
    setFormBio(item.bio || '');
    setFormLanguages((item.languages || ['English', 'Hindi']).join(', '));
    setFormInstagramHandle(item.instagramHandle || '');
    setFormYoutubeHandle(item.youtubeHandle || '');
    setFormIsVerified(item.isVerified);
    setFormTopCreator(item.topCreator);
    setFormIsFeatured(item.isFeatured);
    setFormStatus(item.status || (item.isActive ? 'ACTIVE' : 'INACTIVE'));
    setIsDrawerOpen(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormHandle('');
    setFormProfileImage('');
    setFormCoverImage('');
    setFormPlatform('INSTAGRAM');
    setFormLocation('India');
    setFormCity('');
    setFormLocalArea('');
    setFormFollowers(50000);
    setFormFollowersCount('50K');
    setFormEngagementRate(4.5);
    setFormStartingPrice(5000);
    setFormBio('');
    setFormLanguages('English, Hindi');
    setFormInstagramHandle('');
    setFormYoutubeHandle('');
    setFormIsVerified(true);
    setFormTopCreator(false);
    setFormIsFeatured(true);
    setFormStatus('ACTIVE');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Name is required');
      return;
    }

    const langs = formLanguages
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    saveMutation.mutate({
      name: formName.trim(),
      handle: formHandle.trim() || undefined,
      profileImage: formProfileImage.trim() || undefined,
      avatarUrl: formProfileImage.trim() || undefined,
      coverImage: formCoverImage.trim() || undefined,
      platform: formPlatform,
      categoryId: formCategoryId,
      location: formLocation.trim() || 'India',
      city: formCity.trim() || undefined,
      localArea: formLocalArea.trim() || undefined,
      followers: Number(formFollowers),
      followersCount: formFollowersCount.trim() || `${formFollowers}`,
      engagementRate: Number(formEngagementRate),
      startingPrice: Number(formStartingPrice),
      bio: formBio.trim() || undefined,
      languages: langs,
      instagramHandle: formInstagramHandle.trim() || undefined,
      youtubeHandle: formYoutubeHandle.trim() || undefined,
      isVerified: formIsVerified,
      topCreator: formTopCreator,
      isFeatured: formIsFeatured,
      status: formStatus,
      isActive: formStatus === 'ACTIVE',
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Header */}
      <AdminPageHero
        title="Influencer Hub Management"
        description="Manage verified creators, tier pricing packages, booking availabilities and collaborations."
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/influencers/bookings"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-xs transition-all"
            >
              <Package className="w-4 h-4 text-emerald-600" />
              Manage Bookings
            </Link>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Influencer
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Influencers"
          value={influencers.length}
          icon={Users}
          iconBg="primary"
        />
        <AdminStatCard
          title="Active Bookings"
          value={stats?.totalBookings ?? 0}
          icon={Package}
          iconBg="blue"
        />
        <AdminStatCard
          title="Pending Approvals"
          value={stats?.pendingApproval ?? 0}
          icon={Award}
          iconBg="amber"
        />
        <AdminStatCard
          title="Campaign Revenue"
          value={`₹${(stats?.totalRevenue ?? 0).toLocaleString()}`}
          icon={Sparkles}
          iconBg="primary"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, handle, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id.toString()}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Influencers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Creator</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Platform</th>
                <th className="py-3.5 px-4">Followers</th>
                <th className="py-3.5 px-4">Engagement</th>
                <th className="py-3.5 px-4">Starting Price</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading creators...
                  </td>
                </tr>
              ) : influencers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No creators found matching criteria.
                  </td>
                </tr>
              ) : (
                influencers.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.profileImage || item.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={item.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            {item.name}
                            {item.isVerified && (
                              <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-50" />
                            )}
                            {item.topCreator && (
                              <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-800 rounded">
                                TOP
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            {item.handle || item.city || 'India'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {item.category?.name || item.categoryName || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                        {item.platform === 'YOUTUBE' ? (
                          <Youtube className="w-4 h-4 text-red-500" />
                        ) : (
                          <Instagram className="w-4 h-4 text-pink-500" />
                        )}
                        {item.platform}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700">
                      {item.followersCount || item.followers.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">
                      {item.engagementRate}%
                    </td>
                    <td className="py-3 px-4 font-black text-slate-800">
                      ₹{(item.startingPrice || 5000).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: item.id,
                            status: item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                          })
                        }
                        className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all ${
                          item.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {item.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/influencers/${item.id}`}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-emerald-600 rounded-lg transition-colors"
                          title="Manage Packages & Availability"
                        >
                          <Package className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                          title="Edit Creator"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Deactivate Creator"
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
      </div>

      {/* Add / Edit Drawer */}
      <AdminFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingInfluencer ? 'Edit Influencer Profile' : 'Add New Influencer'}
        subtitle="Configure profile info, social handles, starting price, and badges."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Ananya Sharma"
              required
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Handle
              </label>
              <input
                type="text"
                value={formHandle}
                onChange={(e) => setFormHandle(e.target.value)}
                placeholder="@ananya_lifestyle"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Platform
              </label>
              <select
                value={formPlatform}
                onChange={(e) => setFormPlatform(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="INSTAGRAM">Instagram</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="TIKTOK">TikTok</option>
                <option value="SNAPCHAT">Snapchat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Category
              </label>
              <select
                value={formCategoryId ?? ''}
                onChange={(e) => setFormCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                City / Location
              </label>
              <input
                type="text"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                placeholder="Ahmedabad"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Profile Image URL
            </label>
            <input
              type="url"
              value={formProfileImage}
              onChange={(e) => setFormProfileImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Followers Count
              </label>
              <input
                type="text"
                value={formFollowersCount}
                onChange={(e) => setFormFollowersCount(e.target.value)}
                placeholder="125K"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Engagement Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formEngagementRate}
                onChange={(e) => setFormEngagementRate(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Starting Price (₹)
              </label>
              <input
                type="number"
                value={formStartingPrice}
                onChange={(e) => setFormStartingPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Bio / Tagline
            </label>
            <textarea
              rows={3}
              value={formBio}
              onChange={(e) => setFormBio(e.target.value)}
              placeholder="Fashion & lifestyle creator specializing in high-aesthetic reels..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Languages (Comma separated)
            </label>
            <input
              type="text"
              value={formLanguages}
              onChange={(e) => setFormLanguages(e.target.value)}
              placeholder="Hindi, English, Gujarati"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsVerified}
                onChange={(e) => setFormIsVerified(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="text-xs font-bold text-slate-700">Verified Badge</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formTopCreator}
                onChange={(e) => setFormTopCreator(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="text-xs font-bold text-slate-700">Top Creator</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsFeatured}
                onChange={(e) => setFormIsFeatured(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="text-xs font-bold text-slate-700">Featured</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving...' : editingInfluencer ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* Delete / Deactivate Confirm Dialog */}
      <AdminConfirmDialog
        isOpen={!!deleteTarget}
        title="Deactivate Creator"
        description={`Are you sure you want to deactivate ${deleteTarget?.name}? They will no longer appear in the customer mobile app.`}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        onClose={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
