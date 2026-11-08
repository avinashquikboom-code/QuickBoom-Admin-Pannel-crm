'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  AlertCircle,
  Eye,
  Check,
  X,
  User,
  Building2,
  Instagram,
  FileText,
  Filter,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  InfluencerAdminService,
  InfluencerBookingItem,
  BookingStats,
} from '@/lib/services/influencer.service';
import {
  AdminPageHeader,
  AdminStatCard,
  AdminFormDrawer,
  AdminConfirmDialog,
} from '@/components/admin';

export default function InfluencerBookingsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  // Drawer / Action State
  const [selectedBooking, setSelectedBooking] = useState<InfluencerBookingItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<InfluencerBookingItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelTarget, setCancelTarget] = useState<InfluencerBookingItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Queries
  const { data: stats, isLoading: loadingStats } = useQuery<BookingStats>({
    queryKey: ['admin-influencer-booking-stats'],
    queryFn: () => InfluencerAdminService.getBookingStats(),
  });

  const { data: bookingData, isLoading: loadingBookings } = useQuery<{ items: InfluencerBookingItem[]; total: number }>({
    queryKey: ['admin-influencer-bookings', search, statusFilter, paymentFilter],
    queryFn: () =>
      InfluencerAdminService.getBookings({
        search: search || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        paymentStatus: paymentFilter === 'ALL' ? undefined : paymentFilter,
      }),
  });

  const bookings = bookingData?.items || [];

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      await InfluencerAdminService.approveBooking(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-influencer-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-influencer-booking-stats'] });
      toast.success('Booking confirmed and approved');
      if (selectedBooking) {
        setSelectedBooking(null);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to approve booking');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      await InfluencerAdminService.rejectBooking(id, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-influencer-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-influencer-booking-stats'] });
      toast.success('Booking rejected');
      setRejectTarget(null);
      setRejectReason('');
      if (selectedBooking) {
        setSelectedBooking(null);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reject booking');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      await InfluencerAdminService.cancelBooking(id, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-influencer-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-influencer-booking-stats'] });
      toast.success('Booking cancelled');
      setCancelTarget(null);
      setCancelReason('');
      if (selectedBooking) {
        setSelectedBooking(null);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      await InfluencerAdminService.updatePaymentStatus(id, 'PAID');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-influencer-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-influencer-booking-stats'] });
      toast.success('Payment verified and marked as PAID');
      if (selectedBooking) {
        setSelectedBooking((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus: 'PAID',
                bookingStatus: prev.bookingStatus === 'PENDING' ? 'CONFIRMED' : prev.bookingStatus,
              }
            : null,
        );
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to verify payment');
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-500 border border-sky-500/20">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
            {status}
          </span>
        );
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Paid
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            Pending
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/20">
            Refunded
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
            Failed
          </span>
        );
      default:
        return <span className="text-xs text-muted-foreground">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <AdminPageHeader
        title="Influencer Bookings"
        description="Manage end-to-end campaign bookings, approve requests, and verify payment settlements."
        icon={Calendar}
        iconColor="text-emerald-600"
        badge={{ text: 'Campaign Bookings', icon: Calendar, variant: 'emerald' }}
        breadcrumbs={[
          { label: 'Influencers', href: '/influencers' },
          { label: 'Bookings' },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          title="Total Bookings"
          value={loadingStats ? '...' : (stats?.totalBookings || 0).toString()}
          icon={Calendar}
          iconBg="primary"
        />
        <AdminStatCard
          title="Pending Approval"
          value={loadingStats ? '...' : (stats?.pendingApproval || 0).toString()}
          icon={Clock}
          iconBg="amber"
        />
        <AdminStatCard
          title="Total Campaign Revenue"
          value={loadingStats ? '...' : `₹${(stats?.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          iconBg="primary"
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Booking ID, creator, or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered input-sm w-full pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select select-bordered select-sm text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="select select-bordered select-sm text-xs"
          >
            <option value="ALL">All Payments</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="p-3">Booking ID</th>
                <th className="p-3">Creator</th>
                <th className="p-3">Brand / Customer</th>
                <th className="p-3">Campaign Date</th>
                <th className="p-3">Package & Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Payment</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingBookings ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Loading bookings...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground space-y-2">
                    <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                    <p className="font-semibold text-foreground">No bookings found</p>
                    <p className="text-xs">No campaign bookings match the selected filters.</p>
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <span className="font-mono font-bold text-primary">{b.bookingId}</span>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-foreground">{b.influencer?.name || 'Creator'}</div>
                      <div className="text-[11px] text-muted-foreground">{b.influencer?.categoryName || 'General'}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-foreground">{b.brandName || b.businessName}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {b.contactPerson} • {b.mobileNumber}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-foreground">
                        {new Date(b.campaignDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-foreground">₹{b.totalAmount.toLocaleString()}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {b.package?.name || 'Custom Package'}
                      </div>
                    </td>

                    <td className="p-3">{getStatusBadge(b.bookingStatus)}</td>

                    <td className="p-3">{getPaymentBadge(b.paymentStatus)}</td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          title="View Details"
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {b.bookingStatus === 'PENDING' && (
                          <>
                            <button
                              onClick={() => approveMutation.mutate(b.id)}
                              disabled={approveMutation.isPending}
                              title="Approve Booking"
                              className="p-1.5 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setRejectTarget(b)}
                              title="Reject Booking"
                              className="p-1.5 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
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

      {/* Booking Details Drawer */}
      <AdminFormDrawer
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title={`Booking ${selectedBooking?.bookingId}`}
        subtitle="Complete campaign booking information and breakdown"
      >
        {selectedBooking && (
          <div className="space-y-5 text-xs">
            {/* Status overview */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Booking Status</span>
                {getStatusBadge(selectedBooking.bookingStatus)}
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Payment Status</span>
                {getPaymentBadge(selectedBooking.paymentStatus)}
              </div>
            </div>

            {/* Influencer Info */}
            <div className="space-y-2 border-b border-border pb-3">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" /> Creator Information
              </h4>
              <p className="text-sm font-semibold text-foreground">{selectedBooking.influencer?.name}</p>
              <p className="text-muted-foreground">Category: {selectedBooking.influencer?.categoryName || 'N/A'}</p>
            </div>

            {/* Campaign Deliverables */}
            <div className="space-y-2 border-b border-border pb-3">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Campaign & Deliverable
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Campaign Date:</span>
                  <p className="font-semibold text-foreground">
                    {new Date(selectedBooking.campaignDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Selected Package:</span>
                  <p className="font-semibold text-foreground">{selectedBooking.package?.name || 'Custom'}</p>
                </div>
              </div>
              {selectedBooking.campaignObjective && (
                <div className="mt-2">
                  <span className="text-muted-foreground">Campaign Objective:</span>
                  <p className="text-foreground bg-muted p-2 rounded mt-0.5">{selectedBooking.campaignObjective}</p>
                </div>
              )}
              {selectedBooking.notes && (
                <div className="mt-2">
                  <span className="text-muted-foreground">Special Instructions:</span>
                  <p className="text-foreground bg-muted p-2 rounded mt-0.5">{selectedBooking.notes}</p>
                </div>
              )}
            </div>

            {/* Brand / Contact Info */}
            <div className="space-y-2 border-b border-border pb-3">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" /> Brand Contact
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Brand / Business:</span>
                  <p className="font-semibold text-foreground">{selectedBooking.brandName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Contact Person:</span>
                  <p className="font-semibold text-foreground">{selectedBooking.contactPerson}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Mobile:</span>
                  <p className="font-semibold text-foreground">{selectedBooking.mobileNumber}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-semibold text-foreground">{selectedBooking.email}</p>
                </div>
              </div>
              {selectedBooking.instagramId && (
                <div className="mt-1">
                  <span className="text-muted-foreground">Instagram ID:</span>
                  <p className="font-semibold text-foreground">@{selectedBooking.instagramId}</p>
                </div>
              )}
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-2 border-b border-border pb-3">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-primary" /> Authoritative Pricing Breakdown
              </h4>
              <div className="space-y-1.5 bg-muted/40 p-3 rounded-lg border border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Package Fee:</span>
                  <span className="font-semibold">₹{selectedBooking.packageAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Fee:</span>
                  <span className="font-semibold">₹{selectedBooking.platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (18%):</span>
                  <span className="font-semibold">₹{selectedBooking.gst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border font-bold text-sm text-foreground">
                  <span>Total Amount Paid:</span>
                  <span className="text-primary">₹{selectedBooking.totalAmount.toLocaleString()}</span>
                </div>
              </div>
              {selectedBooking.razorpayPaymentId && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  Razorpay Payment ID: {selectedBooking.razorpayPaymentId}
                </p>
              )}
            </div>

            {/* Quick Actions inside drawer */}
            <div className="pt-2 flex flex-wrap justify-end gap-2">
              {selectedBooking.paymentStatus === 'PENDING' && (
                <button
                  onClick={() => verifyPaymentMutation.mutate(selectedBooking.id)}
                  disabled={verifyPaymentMutation.isPending}
                  className="btn btn-outline btn-success btn-sm"
                >
                  {verifyPaymentMutation.isPending ? 'Verifying...' : 'Verify Payment (Mark Paid)'}
                </button>
              )}
              {selectedBooking.bookingStatus === 'PENDING' && (
                <>
                  <button
                    onClick={() => approveMutation.mutate(selectedBooking.id)}
                    disabled={approveMutation.isPending}
                    className="btn btn-primary btn-sm"
                  >
                    Approve Booking
                  </button>
                  <button
                    onClick={() => {
                      setRejectTarget(selectedBooking);
                    }}
                    className="btn btn-outline btn-error btn-sm"
                  >
                    Reject
                  </button>
                </>
              )}
              {selectedBooking.bookingStatus === 'CONFIRMED' && (
                <button
                  onClick={() => {
                    setCancelTarget(selectedBooking);
                  }}
                  className="btn btn-outline btn-error btn-sm"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          </div>
        )}
      </AdminFormDrawer>

      {/* Reject Drawer */}
      <AdminFormDrawer
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject Campaign Booking"
        subtitle={`Booking ID: ${rejectTarget?.bookingId}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Provide a clear reason for rejecting this campaign request.
          </p>
          <div>
            <label className="block text-xs font-semibold mb-1">Rejection Reason *</label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Creator schedule conflict, inappropriate content requirements..."
              className="textarea textarea-bordered w-full text-xs"
            />
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={() => setRejectTarget(null)}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={rejectMutation.isPending}
              onClick={() => {
                if (rejectTarget) {
                  rejectMutation.mutate({
                    id: rejectTarget.id,
                    reason: rejectReason || 'Declined by administrator',
                  });
                }
              }}
              className="btn btn-error btn-sm"
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </AdminFormDrawer>

      {/* Cancel Drawer */}
      <AdminFormDrawer
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Confirmed Booking"
        subtitle={`Booking ID: ${cancelTarget?.bookingId}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Are you sure you want to cancel this confirmed booking?
          </p>
          <div>
            <label className="block text-xs font-semibold mb-1">Cancellation Reason *</label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
              className="textarea textarea-bordered w-full text-xs"
            />
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={() => setCancelTarget(null)}
              className="btn btn-ghost btn-sm"
            >
              Close
            </button>
            <button
              type="button"
              disabled={cancelMutation.isPending}
              onClick={() => {
                if (cancelTarget) {
                  cancelMutation.mutate({
                    id: cancelTarget.id,
                    reason: cancelReason || 'Cancelled by admin',
                  });
                }
              }}
              className="btn btn-error btn-sm"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          </div>
        </div>
      </AdminFormDrawer>
    </div>
  );
}
