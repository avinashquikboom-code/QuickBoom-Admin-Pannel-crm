'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Award,
  Layers,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  InfluencerAdminService,
  InfluencerItem,
  InfluencerPackageItem,
  InfluencerAvailabilityItem,
} from '@/lib/services/influencer.service';
import {
  AdminFormDrawer,
  AdminConfirmDialog,
} from '@/components/admin';

export default function InfluencerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const influencerId = Number(params?.id);

  const [activeTab, setActiveTab] = useState<'packages' | 'availability'>('packages');

  // Package Form State
  const [isPkgDrawerOpen, setIsPkgDrawerOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<InfluencerPackageItem | null>(null);
  const [pkgDeleteTarget, setPkgDeleteTarget] = useState<InfluencerPackageItem | null>(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgType, setPkgType] = useState('REEL');
  const [pkgDescription, setPkgDescription] = useState('');
  const [pkgDuration, setPkgDuration] = useState('30s Reel');
  const [pkgPrice, setPkgPrice] = useState<number>(5000);
  const [pkgIsPopular, setPkgIsPopular] = useState(false);
  const [pkgStatus, setPkgStatus] = useState('ACTIVE');
  const [pkgSortOrder, setPkgSortOrder] = useState(0);

  // Availability Form State
  const [isAvailModalOpen, setIsAvailModalOpen] = useState(false);
  const [availDeleteTarget, setAvailDeleteTarget] = useState<InfluencerAvailabilityItem | null>(null);
  const [availDate, setAvailDate] = useState('');
  const [availIsAvailable, setAvailIsAvailable] = useState(true);
  const [availStartTime, setAvailStartTime] = useState('');
  const [availEndTime, setAvailEndTime] = useState('');

  // Queries
  const { data: influencer, isLoading: loadingInfluencer } = useQuery<InfluencerItem>({
    queryKey: ['admin-influencer', influencerId],
    queryFn: () => InfluencerAdminService.getInfluencerById(influencerId),
    enabled: !isNaN(influencerId),
  });

  const { data: packages = [], isLoading: loadingPackages } = useQuery<InfluencerPackageItem[]>({
    queryKey: ['admin-influencer-packages', influencerId],
    queryFn: () => InfluencerAdminService.getPackages(influencerId),
    enabled: !isNaN(influencerId),
  });

  const { data: availability = [], isLoading: loadingAvailability } = useQuery<InfluencerAvailabilityItem[]>({
    queryKey: ['admin-influencer-availability', influencerId],
    queryFn: () => InfluencerAdminService.getAvailability(influencerId),
    enabled: !isNaN(influencerId),
  });

  // Package Mutations
  const savePkgMutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<InfluencerPackageItem> = {
        name: pkgName,
        type: pkgType,
        description: pkgDescription,
        duration: pkgDuration,
        price: Number(pkgPrice),
        isPopular: pkgIsPopular,
        status: pkgStatus,
        sortOrder: Number(pkgSortOrder),
      };
      if (editingPkg) {
        return InfluencerAdminService.updatePackage(editingPkg.id, payload);
      }
      return InfluencerAdminService.createPackage(influencerId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-influencer-packages', influencerId] });
      queryClient.invalidateQueries({ queryKey: ['admin-influencers'] });
      toast.success(editingPkg ? 'Package updated' : 'Package created');
      setIsPkgDrawerOpen(false);
      resetPkgForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save package');
    },
  });

  const deletePkgMutation = useMutation({
    mutationFn: async (id: number) => {
      await InfluencerAdminService.deletePackage(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-influencer-packages', influencerId] });
      queryClient.invalidateQueries({ queryKey: ['admin-influencers'] });
      toast.success('Package deleted');
      setPkgDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete package');
    },
  });

  // Availability Mutations
  const saveAvailMutation = useMutation({
    mutationFn: async () => {
      return InfluencerAdminService.setAvailability(influencerId, {
        date: availDate,
        isAvailable: availIsAvailable,
        startTime: availStartTime || undefined,
        endTime: availEndTime || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-influencer-availability', influencerId] });
      toast.success('Availability saved');
      setIsAvailModalOpen(false);
      resetAvailForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to set availability');
    },
  });

  const deleteAvailMutation = useMutation({
    mutationFn: async (id: number) => {
      await InfluencerAdminService.deleteAvailability(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-influencer-availability', influencerId] });
      toast.success('Availability removed');
      setAvailDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete availability');
    },
  });

  const resetPkgForm = () => {
    setEditingPkg(null);
    setPkgName('');
    setPkgType('REEL');
    setPkgDescription('');
    setPkgDuration('30s Reel');
    setPkgPrice(5000);
    setPkgIsPopular(false);
    setPkgStatus('ACTIVE');
    setPkgSortOrder(0);
  };

  const openEditPkg = (pkg: InfluencerPackageItem) => {
    setEditingPkg(pkg);
    setPkgName(pkg.name);
    setPkgType(pkg.type);
    setPkgDescription(pkg.description || '');
    setPkgDuration(pkg.duration || '');
    setPkgPrice(pkg.price);
    setPkgIsPopular(pkg.isPopular);
    setPkgStatus(pkg.status);
    setPkgSortOrder(pkg.sortOrder || 0);
    setIsPkgDrawerOpen(true);
  };

  const resetAvailForm = () => {
    setAvailDate('');
    setAvailIsAvailable(true);
    setAvailStartTime('');
    setAvailEndTime('');
  };

  if (loadingInfluencer) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!influencer) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Influencer not found</p>
        <Link href="/influencers" className="btn btn-outline">
          Back to Influencers
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation & Profile Summary */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/influencers')}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Influencers
        </button>

        <Link
          href={`/influencers/bookings?search=${encodeURIComponent(influencer.name)}`}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          View Bookings ({influencer._count?.bookings || 0})
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Hero Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-muted border border-border flex-shrink-0">
            {influencer.profileImage || influencer.avatarUrl ? (
              <img
                src={(influencer.profileImage || influencer.avatarUrl) || undefined}
                alt={influencer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-xl text-muted-foreground">
                {influencer.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{influencer.name}</h1>
              {influencer.handle && (
                <span className="text-xs text-muted-foreground">@{influencer.handle}</span>
              )}
              {influencer.isVerified && (
                <CheckCircle2 className="w-4 h-4 text-sky-500" />
              )}
              {influencer.isFeatured && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Sparkles className="w-3 h-3" /> Featured
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-muted font-medium">
                {influencer.categoryName || 'General'}
              </span>
              <span>Platform: <strong className="text-foreground">{influencer.platform}</strong></span>
              <span>Followers: <strong className="text-foreground">{(influencer.followers || 0).toLocaleString()}</strong></span>
              <span>Engagement: <strong className="text-foreground">{influencer.engagementRate}%</strong></span>
              <span>City: <strong className="text-foreground">{influencer.city || influencer.location || 'India'}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              influencer.isActive
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}
          >
            {influencer.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('packages')}
          className={`px-5 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'packages'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="w-4 h-4" />
          Packages ({packages.length})
        </button>
        <button
          onClick={() => setActiveTab('availability')}
          className={`px-5 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'availability'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Availability & Dates ({availability.length})
        </button>
      </div>

      {/* TAB 1: PACKAGES */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Define service packages available for customers to book with {influencer.name}.
            </p>
            <button
              onClick={() => {
                resetPkgForm();
                setIsPkgDrawerOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Package
            </button>
          </div>

          {loadingPackages ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Loading packages...</div>
          ) : packages.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center space-y-3">
              <Package className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <h3 className="font-semibold text-foreground">No Packages Created Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Add standard deliverables like 30s Reel, Story Shoutout, Dedicated Video, or Store Visit.
              </p>
              <button
                onClick={() => {
                  resetPkgForm();
                  setIsPkgDrawerOpen(true);
                }}
                className="btn btn-primary btn-sm mt-2"
              >
                Create First Package
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-card border border-border rounded-xl p-5 relative flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded bg-primary/10">
                          {pkg.type}
                        </span>
                        {pkg.isPopular && (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-amber-500 px-2 py-0.5 rounded bg-amber-500/10">
                            Popular
                          </span>
                        )}
                        <h3 className="font-bold text-base text-foreground mt-2">{pkg.name}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-foreground">₹{pkg.price.toLocaleString()}</div>
                        {pkg.duration && (
                          <span className="text-[11px] text-muted-foreground flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" /> {pkg.duration}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-3 mb-4">
                      {pkg.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span
                      className={`font-semibold ${
                        pkg.status === 'ACTIVE' ? 'text-emerald-500' : 'text-muted-foreground'
                      }`}
                    >
                      {pkg.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditPkg(pkg)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPkgDeleteTarget(pkg)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AVAILABILITY */}
      {activeTab === 'availability' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Configure blackout dates or open slots for campaign scheduling.
            </p>
            <button
              onClick={() => {
                resetAvailForm();
                setIsAvailModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Set Date Availability
            </button>
          </div>

          {loadingAvailability ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Loading availability...</div>
          ) : availability.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center space-y-3">
              <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <h3 className="font-semibold text-foreground">No Explicit Date Rules Set</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                By default, all dates are open unless explicitly marked unavailable or booked.
              </p>
              <button
                onClick={() => {
                  resetAvailForm();
                  setIsAvailModalOpen(true);
                }}
                className="btn btn-primary btn-sm mt-2"
              >
                Set Specific Date Status
              </button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Booked?</th>
                    <th className="p-3">Time Window</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {availability.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">
                        {new Date(item.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.isAvailable
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          {item.isAvailable ? 'Available' : 'Blocked / Unavailable'}
                        </span>
                      </td>
                      <td className="p-3">
                        {item.isBooked ? (
                          <span className="text-amber-500 font-semibold">Booked</span>
                        ) : (
                          <span className="text-muted-foreground">Open</span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {item.startTime && item.endTime
                          ? `${item.startTime} - ${item.endTime}`
                          : 'Full Day'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setAvailDeleteTarget(item)}
                          className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Package Form Drawer */}
      <AdminFormDrawer
        isOpen={isPkgDrawerOpen}
        onClose={() => setIsPkgDrawerOpen(false)}
        title={editingPkg ? 'Edit Package' : 'Create Package'}
        subtitle={`Configure package for ${influencer.name}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            savePkgMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold mb-1">Package Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. 1 Instagram Reel (30-60s)"
              value={pkgName}
              onChange={(e) => setPkgName(e.target.value)}
              className="input input-bordered w-full text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Type *</label>
              <select
                value={pkgType}
                onChange={(e) => setPkgType(e.target.value)}
                className="select select-bordered w-full text-xs"
              >
                <option value="REEL">Reel</option>
                <option value="STORY">Story</option>
                <option value="POST">Post / Carousel</option>
                <option value="COMBO">Combo (Reel + Story)</option>
                <option value="VISIT">Store Visit / Event</option>
                <option value="CUSTOM">Custom Deliverable</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Price (₹) *</label>
              <input
                type="number"
                min="100"
                required
                value={pkgPrice}
                onChange={(e) => setPkgPrice(Number(e.target.value))}
                className="input input-bordered w-full text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Duration / Format</label>
            <input
              type="text"
              placeholder="e.g. 30-60 Seconds / 24 Hours"
              value={pkgDuration}
              onChange={(e) => setPkgDuration(e.target.value)}
              className="input input-bordered w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Deliverable Description</label>
            <textarea
              rows={3}
              placeholder="Detailed description of what is included in this package..."
              value={pkgDescription}
              onChange={(e) => setPkgDescription(e.target.value)}
              className="textarea textarea-bordered w-full text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Status</label>
              <select
                value={pkgStatus}
                onChange={(e) => setPkgStatus(e.target.value)}
                className="select select-bordered w-full text-xs"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Sort Order</label>
              <input
                type="number"
                value={pkgSortOrder}
                onChange={(e) => setPkgSortOrder(Number(e.target.value))}
                className="input input-bordered w-full text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPopular"
              checked={pkgIsPopular}
              onChange={(e) => setPkgIsPopular(e.target.checked)}
              className="checkbox checkbox-primary checkbox-sm"
            />
            <label htmlFor="isPopular" className="text-xs font-medium cursor-pointer">
              Mark as &quot;Popular Choice&quot; badge
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={() => setIsPkgDrawerOpen(false)}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savePkgMutation.isPending}
              className="btn btn-primary btn-sm"
            >
              {savePkgMutation.isPending ? 'Saving...' : editingPkg ? 'Update Package' : 'Create Package'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* Availability Modal / Drawer */}
      <AdminFormDrawer
        isOpen={isAvailModalOpen}
        onClose={() => setIsAvailModalOpen(false)}
        title="Set Availability Rule"
        subtitle={`Define availability for ${influencer.name}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveAvailMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold mb-1">Select Date *</label>
            <input
              type="date"
              required
              value={availDate}
              onChange={(e) => setAvailDate(e.target.value)}
              className="input input-bordered w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Status *</label>
            <select
              value={availIsAvailable ? 'true' : 'false'}
              onChange={(e) => setAvailIsAvailable(e.target.value === 'true')}
              className="select select-bordered w-full text-xs"
            >
              <option value="true">Available (Open for booking)</option>
              <option value="false">Blocked (Unavailable / Busy)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Start Time (Optional)</label>
              <input
                type="time"
                value={availStartTime}
                onChange={(e) => setAvailStartTime(e.target.value)}
                className="input input-bordered w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">End Time (Optional)</label>
              <input
                type="time"
                value={availEndTime}
                onChange={(e) => setAvailEndTime(e.target.value)}
                className="input input-bordered w-full text-xs"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={() => setIsAvailModalOpen(false)}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveAvailMutation.isPending}
              className="btn btn-primary btn-sm"
            >
              {saveAvailMutation.isPending ? 'Saving...' : 'Save Availability'}
            </button>
          </div>
        </form>
      </AdminFormDrawer>

      {/* Delete Package Confirmation */}
      <AdminConfirmDialog
        isOpen={!!pkgDeleteTarget}
        onClose={() => setPkgDeleteTarget(null)}
        onConfirm={() => {
          if (pkgDeleteTarget) deletePkgMutation.mutate(pkgDeleteTarget.id);
        }}
        title="Delete Package"
        description={`Are you sure you want to delete the package "${pkgDeleteTarget?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Delete Availability Confirmation */}
      <AdminConfirmDialog
        isOpen={!!availDeleteTarget}
        onClose={() => setAvailDeleteTarget(null)}
        onConfirm={() => {
          if (availDeleteTarget) deleteAvailMutation.mutate(availDeleteTarget.id);
        }}
        title="Remove Availability Rule"
        description="Are you sure you want to remove this date rule?"
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  );
}
