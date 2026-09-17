'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Check,
  X,
  Instagram,
  Youtube,
  Globe,
  Ban,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  InfluencerAdminService,
  InfluencerItem,
  InfluencerApplicationsResponse,
} from '@/lib/services/influencer.service';
import {
  AdminPageHero,
  AdminStatCard,
  AdminFormDrawer,
  AdminStatusTabs,
} from '@/components/admin';

export default function InfluencerApplicationsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'>('PENDING');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Review Drawer & Modals
  const [selectedApplication, setSelectedApplication] = useState<InfluencerItem | null>(null);
  const [rejectModalTarget, setRejectModalTarget] = useState<InfluencerItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [suspendModalTarget, setSuspendModalTarget] = useState<InfluencerItem | null>(null);

  // Queries
  const { data: appData, isLoading } = useQuery<InfluencerApplicationsResponse>({
    queryKey: ['admin-influencer-applications', search, selectedStatus, selectedCategory],
    queryFn: () =>
      InfluencerAdminService.getApplications({
        search: search.trim() || undefined,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
      }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-influencer-categories'],
    queryFn: () => InfluencerAdminService.getCategories(),
  });

  const applications = appData?.items || [];
  const counts = appData?.counts || { total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 };

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return InfluencerAdminService.approveInfluencer(id);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-influencer-applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-influencers'] });
      toast.success(res?.message || 'Influencer approved and live in Mobile Hub!');
      if (selectedApplication) {
        setSelectedApplication(null);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to approve influencer');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return InfluencerAdminService.rejectInfluencer(id, reason);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-influencer-applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-influencers'] });
      toast.success(res?.message || 'Influencer application rejected');
      setRejectModalTarget(null);
      setRejectionReason('');
      if (selectedApplication) {
        setSelectedApplication(null);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reject influencer');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async (id: number) => {
      return InfluencerAdminService.suspendInfluencer(id);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-influencer-applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-influencers'] });
      toast.success(res?.message || 'Influencer suspended and removed from mobile listings');
      setSuspendModalTarget(null);
      if (selectedApplication) {
        setSelectedApplication(null);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to suspend influencer');
    },
  });

  const handleOpenReject = (app: InfluencerItem) => {
    setRejectModalTarget(app);
    setRejectionReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectModalTarget) return;
    if (!rejectionReason.trim()) {
      toast.error('Please enter a valid rejection reason');
      return;
    }
    rejectMutation.mutate({ id: rejectModalTarget.id, reason: rejectionReason.trim() });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            Pending Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
            <Ban className="w-3.5 h-3.5 text-gray-600" />
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Hero */}
      <AdminPageHero
        title="Influencer Applications"
        description="Review, verify, and approve creator self-registrations before they become visible in the customer Mobile Influencer Hub."
        badge={{ text: 'Approval Workflow', icon: UserCheck, variant: 'emerald' }}
      />

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Applications"
          value={counts.total}
          icon={UserCheck}
          iconBg="slate"
        />
        <AdminStatCard
          title="Pending Review"
          value={counts.pending}
          icon={Clock}
          iconBg="amber"
        />
        <AdminStatCard
          title="Approved Creators"
          value={counts.approved}
          icon={CheckCircle2}
          iconBg="primary"
        />
        <AdminStatCard
          title="Rejected / Suspended"
          value={counts.rejected + counts.suspended}
          icon={AlertCircle}
          iconBg="rose"
        />
      </div>

      {/* Tabs & Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <AdminStatusTabs<any>
            activeTab={selectedStatus}
            onChange={(val) => setSelectedStatus(val)}
            tabs={[
              { key: 'ALL', label: 'All', count: counts.total },
              { key: 'APPROVED', label: 'Approved', count: counts.approved },
              { key: 'PENDING', label: 'Pending', count: counts.pending },
              { key: 'REJECTED', label: 'Rejected', count: counts.rejected },
              { key: 'SUSPENDED', label: 'Suspended', count: counts.suspended },
            ]}
          />

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search creator, email, mobile..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Applications List Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              Loading applications...
            </div>
          ) : applications.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              <UserCheck className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="font-semibold">No influencer applications found</p>
              <p className="text-xs text-gray-400 mt-1">
                Applications submitted by creators will appear here for review.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/50">
                  <th className="py-3 px-4">Creator</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Followers</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {app.profileImage || app.avatarUrl ? (
                            <img
                              src={app.profileImage || app.avatarUrl || ''}
                              alt={app.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-bold text-gray-400 text-sm">
                              {app.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{app.name}</p>
                          <p className="text-[11px] text-gray-500 font-mono">
                            {app.handle || `@creator_${app.id}`}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium border border-gray-200">
                        {app.category?.name || app.categoryName || 'General'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-gray-900 font-medium">{app.email || '—'}</p>
                      <p className="text-gray-500 text-[11px]">{app.phone || '—'}</p>
                    </td>

                    <td className="py-3.5 px-4 text-gray-700">
                      <p>{app.city || app.location || 'India'}</p>
                      {app.localArea && (
                        <p className="text-gray-400 text-[11px]">{app.localArea}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-gray-800">
                        {app.followersCount || `${app.followers.toLocaleString()}`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(app.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(app.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedApplication(app)}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all font-medium flex items-center gap-1"
                          title="Review profile"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-600" />
                          <span>Review</span>
                        </button>

                        {app.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => approveMutation.mutate(app.id)}
                              disabled={approveMutation.isPending}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all flex items-center gap-1"
                              title="Approve and make live"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>

                            <button
                              onClick={() => handleOpenReject(app)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium transition-all flex items-center gap-1"
                              title="Reject application"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {app.status === 'APPROVED' && (
                          <button
                            onClick={() => setSuspendModalTarget(app)}
                            className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-medium transition-all flex items-center gap-1"
                            title="Suspend creator"
                          >
                            <Ban className="w-3.5 h-3.5 text-amber-700" />
                            <span>Suspend</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Application Review Drawer */}
      <AdminFormDrawer
        isOpen={Boolean(selectedApplication)}
        onClose={() => setSelectedApplication(null)}
        title="Application Review"
        subtitle={selectedApplication ? `Reviewing ${selectedApplication.name} (@${selectedApplication.handle || 'creator'})` : ''}
        size="lg"
        hideFooter={true}
      >
        {selectedApplication && (
          <div className="space-y-6 text-xs text-gray-700">
            {/* Creator Profile Header */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {selectedApplication.profileImage || selectedApplication.avatarUrl ? (
                  <img
                    src={selectedApplication.profileImage || selectedApplication.avatarUrl || ''}
                    alt={selectedApplication.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-gray-400 text-xl">
                    {selectedApplication.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {selectedApplication.name}
                  </h3>
                  {getStatusBadge(selectedApplication.status)}
                </div>
                <p className="text-gray-500 font-mono text-xs">{selectedApplication.handle}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[11px] font-medium text-gray-600">
                    Category: {selectedApplication.category?.name || selectedApplication.categoryName || 'General'}
                  </span>
                  <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[11px] font-medium text-gray-600">
                    Followers: {selectedApplication.followersCount || selectedApplication.followers.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Rejection Alert if Rejected */}
            {selectedApplication.status === 'REJECTED' && selectedApplication.rejectionReason && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-rose-900">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Rejection Reason</span>
                </div>
                <p className="text-rose-700 text-xs pl-5">{selectedApplication.rejectionReason}</p>
                {selectedApplication.rejectedAt && (
                  <p className="text-[11px] text-rose-500 pl-5">
                    Rejected on {new Date(selectedApplication.rejectedAt).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            )}

            {/* Bio */}
            <div>
              <label className="font-semibold text-gray-900 block mb-1.5">Bio & Description</label>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 leading-relaxed">
                {selectedApplication.bio || 'No bio submitted.'}
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-gray-900 block mb-1">Email Address</label>
                <p className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 font-medium">
                  {selectedApplication.email || '—'}
                </p>
              </div>
              <div>
                <label className="font-semibold text-gray-900 block mb-1">Mobile Number</label>
                <p className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 font-medium">
                  {selectedApplication.phone || '—'}
                </p>
              </div>
            </div>

            {/* Location & Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-gray-900 block mb-1">Location / City</label>
                <p className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 font-medium">
                  {selectedApplication.city ? `${selectedApplication.city}, ` : ''}{selectedApplication.location || 'India'}
                </p>
              </div>
              <div>
                <label className="font-semibold text-gray-900 block mb-1">Starting Fee</label>
                <p className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 font-semibold text-emerald-700">
                  {selectedApplication.startingPrice ? `₹${selectedApplication.startingPrice.toLocaleString()}` : 'Not specified'}
                </p>
              </div>
            </div>

            {/* Social Profiles */}
            <div>
              <label className="font-semibold text-gray-900 block mb-2">Social Profiles</label>
              <div className="space-y-2">
                {selectedApplication.instagramHandle && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                    <Instagram className="w-4 h-4 text-pink-600" />
                    <span className="font-medium text-gray-800">Instagram:</span>
                    <span className="text-primary font-mono text-xs truncate">
                      {selectedApplication.instagramHandle}
                    </span>
                  </div>
                )}
                {selectedApplication.youtubeHandle && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                    <Youtube className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-gray-800">YouTube:</span>
                    <span className="text-primary font-mono text-xs truncate">
                      {selectedApplication.youtubeHandle}
                    </span>
                  </div>
                )}
                {selectedApplication.socialLinks && typeof selectedApplication.socialLinks === 'object' && (
                  Object.entries(selectedApplication.socialLinks).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-800 capitalize">{k}:</span>
                      <span className="text-primary font-mono text-xs truncate">{String(v)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Action Bar inside Drawer */}
            <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
              >
                Close
              </button>

              {selectedApplication.status === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenReject(selectedApplication)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject Application</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => approveMutation.mutate(selectedApplication.id)}
                    disabled={approveMutation.isPending}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Make Live</span>
                  </button>
                </>
              )}

              {selectedApplication.status === 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => setSuspendModalTarget(selectedApplication)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <Ban className="w-4 h-4" />
                  <span>Suspend Creator</span>
                </button>
              )}

              {selectedApplication.status === 'REJECTED' && (
                <button
                  type="button"
                  onClick={() => approveMutation.mutate(selectedApplication.id)}
                  disabled={approveMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Re-evaluate & Approve</span>
                </button>
              )}

              {selectedApplication.status === 'SUSPENDED' && (
                <button
                  type="button"
                  onClick={() => approveMutation.mutate(selectedApplication.id)}
                  disabled={approveMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Reactivate Creator</span>
                </button>
              )}
            </div>
          </div>
        )}
      </AdminFormDrawer>

      {/* Reject Reason Modal */}
      {rejectModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Reject Application</h3>
                <p className="text-xs text-gray-500">
                  Rejecting {rejectModalTarget.name}. Please provide a clear reason.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Rejection Reason (visible to applicant) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Social media profile could not be verified or lacks engagement."
                className="w-full text-xs p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectModalTarget(null);
                  setRejectionReason('');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejectMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50 flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Ban className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Suspend Influencer</h3>
                <p className="text-xs text-gray-500">
                  Suspension will immediately remove {suspendModalTarget.name} from the Customer Mobile Influencer Hub.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed bg-amber-50 border border-amber-200 p-3 rounded-lg">
              Existing bookings will remain intact, but customers will not be able to view this profile or book new packages.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSuspendModalTarget(null)}
                className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => suspendMutation.mutate(suspendModalTarget.id)}
                disabled={suspendMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50 flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Confirm Suspension</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
