// @ts-nocheck
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Briefcase,
  DollarSign,
  Download,
  MoreVertical,
  CalendarDays,
  List,
  Sparkles,
  ArrowUpDown,
  CreditCard,
  Building2,
  Check,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  InfluencerAdminService,
  type InfluencerBookingItem,
  type BookingStats,
} from '../../../lib/services/influencer.service';
import { BookingDrawer } from './BookingDrawer';
import { BookingCalendar } from './BookingCalendar';
import { RejectionDialog } from './RejectionDialog';
import { cn } from '@/lib/utils';

export function InfluencerBookingsScreen() {
  const [viewMode, setViewMode] = React.useState<'table' | 'calendar'>('table');
  const [bookings, setBookings] = React.useState<InfluencerBookingItem[]>([]);
  const [stats, setStats] = React.useState<BookingStats>({
    totalBookings: 0,
    pendingApproval: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = React.useState<string>('ALL');

  // Selected Booking Drawer
  const [selectedBooking, setSelectedBooking] = React.useState<InfluencerBookingItem | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Rejection / Cancellation Modal state
  const [rejectionModal, setRejectionModal] = React.useState<{
    open: boolean;
    bookingId: number | null;
    action: 'reject' | 'cancel';
    bookingNumber: string;
    loading: boolean;
  }>({
    open: false,
    bookingId: null,
    action: 'reject',
    bookingNumber: '',
    loading: false,
  });

  // Payment Status Dialog state
  const [paymentModal, setPaymentModal] = React.useState<{
    open: boolean;
    bookingId: number | null;
    currentStatus: string;
    newStatus: string;
    loading: boolean;
  }>({
    open: false,
    bookingId: null,
    currentStatus: '',
    newStatus: 'PAID',
    loading: false,
  });

  // Fetch data
  const fetchData = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [bookingsRes, statsRes] = await Promise.all([
        InfluencerAdminService.getBookings({
          search: searchTerm.trim() || undefined,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          paymentStatus: paymentFilter === 'ALL' ? undefined : paymentFilter,
        }),
        InfluencerAdminService.getBookingStats(),
      ]);

      setBookings(bookingsRes.items || []);
      setStats(statsRes || { totalBookings: 0, pendingApproval: 0, totalRevenue: 0 });
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
      toast.error('Failed to load bookings data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, statusFilter, paymentFilter]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Approve
  const handleApprove = async (id: number) => {
    try {
      await InfluencerAdminService.approveBooking(id);
      toast.success('Booking approved successfully');
      fetchData(true);
      if (selectedBooking?.id === id) {
        setSelectedBooking((prev) => prev ? { ...prev, bookingStatus: 'CONFIRMED' } : null);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to approve booking');
    }
  };

  // Handle Complete
  const handleComplete = async (id: number) => {
    try {
      await InfluencerAdminService.updateBookingStatus(id, 'COMPLETED');
      toast.success('Booking marked as completed');
      fetchData(true);
      if (selectedBooking?.id === id) {
        setSelectedBooking((prev) => prev ? { ...prev, bookingStatus: 'COMPLETED' } : null);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update booking');
    }
  };

  // Handle Reject confirm
  const handleRejectConfirm = async (reason: string) => {
    if (!rejectionModal.bookingId) return;
    setRejectionModal((prev) => ({ ...prev, loading: true }));
    try {
      if (rejectionModal.action === 'reject') {
        await InfluencerAdminService.rejectBooking(rejectionModal.bookingId, reason);
        toast.success('Booking rejected');
      } else {
        await InfluencerAdminService.cancelBooking(rejectionModal.bookingId, reason);
        toast.success('Booking cancelled');
      }
      setRejectionModal((prev) => ({ ...prev, open: false, loading: false }));
      fetchData(true);
      if (selectedBooking?.id === rejectionModal.bookingId) {
        setDrawerOpen(false);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Action failed');
      setRejectionModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Handle Payment Status Update
  const handlePaymentStatusSave = async () => {
    if (!paymentModal.bookingId) return;
    setPaymentModal((prev) => ({ ...prev, loading: true }));
    try {
      await InfluencerAdminService.updatePaymentStatus(
        paymentModal.bookingId,
        paymentModal.newStatus
      );
      toast.success('Payment status updated');
      setPaymentModal((prev) => ({ ...prev, open: false, loading: false }));
      fetchData(true);
      if (selectedBooking?.id === paymentModal.bookingId) {
        setSelectedBooking((prev) => prev ? { ...prev, paymentStatus: paymentModal.newStatus } : null);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update payment status');
      setPaymentModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (bookings.length === 0) {
      toast.error('No bookings to export');
      return;
    }
    const headers = ['Booking ID', 'Influencer', 'Brand', 'Contact Person', 'Email', 'Phone', 'Campaign Date', 'Amount (INR)', 'Payment Status', 'Booking Status', 'Created At'];
    const rows = bookings.map((b) => [
      b.bookingId,
      `"${b.influencer?.name || ''}"`,
      `"${b.brandName || ''}"`,
      `"${b.contactPerson || ''}"`,
      b.email || '',
      b.mobileNumber || '',
      b.campaignDate ? new Date(b.campaignDate).toLocaleDateString() : '',
      b.totalAmount || 0,
      b.paymentStatus || '',
      b.bookingStatus || '',
      b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `influencer_bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Bookings exported to CSV');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[#E8F1EC] text-[#163A2E] flex items-center justify-center shadow-sm shrink-0">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold tracking-wider text-[#20C466] uppercase">
                    CAMPAIGN MANAGEMENT
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0 border-emerald-200 bg-emerald-50 text-emerald-800">
                    Live Schedules
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold text-[#163A2E] mt-0.5">
                  Influencer Bookings
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Manage campaign bookings, approval workflows, calendar schedules, and payment verification.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                <Download className="h-4 w-4 mr-1.5 text-slate-500" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                <RefreshCw className={cn('h-4 w-4 mr-1.5 text-slate-500', refreshing && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 border-b border-slate-200 -mb-[1px] overflow-x-auto">
            <Link
              href="/admin/influencers"
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent hover:border-slate-300 transition-colors whitespace-nowrap"
            >
              Influencer Hub
            </Link>
            <Link
              href="/admin/influencers/applications"
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent hover:border-slate-300 transition-colors whitespace-nowrap"
            >
              Influencer Applications
            </Link>
            <Link
              href="/admin/influencers/bookings"
              className="px-4 py-2.5 text-sm font-semibold text-[#163A2E] border-b-2 border-[#20C466] transition-colors whitespace-nowrap flex items-center gap-2"
            >
              Influencer Bookings
              {stats.pendingApproval > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {stats.pendingApproval}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Bookings */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm relative overflow-hidden flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total Bookings
              </p>
              <h3 className="text-2xl font-bold text-[#163A2E]">
                {loading ? '—' : stats.totalBookings}
              </h3>
              <p className="text-xs text-slate-400">All recorded campaigns</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
              <Briefcase className="h-6 w-6" />
            </div>
          </div>

          {/* Pending Approval */}
          <div className="bg-white rounded-2xl border border-amber-200/80 p-5 shadow-sm relative overflow-hidden flex items-center justify-between bg-gradient-to-br from-white to-amber-50/30">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                Pending Approval
              </p>
              <h3 className="text-2xl font-bold text-amber-900">
                {loading ? '—' : stats.pendingApproval}
              </h3>
              <p className="text-xs text-amber-600/80">Requires admin action</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          {/* Paid Revenue */}
          <div className="bg-white rounded-2xl border border-emerald-200/80 p-5 shadow-sm relative overflow-hidden flex items-center justify-between bg-gradient-to-br from-white to-emerald-50/30">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                  Paid Revenue
                </p>
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-emerald-100 text-emerald-800">
                  Verified
                </Badge>
              </div>
              <h3 className="text-2xl font-bold text-emerald-950">
                {loading ? '—' : `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`}
              </h3>
              <p className="text-xs text-emerald-700/80">Strictly verified paid campaigns</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters & View Toggle */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by ID, influencer, brand or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm rounded-lg border-slate-200 focus-visible:ring-[#20C466]"
              />
            </div>

            {/* Booking Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[170px] h-9 text-sm rounded-lg border-slate-200">
                <SelectValue placeholder="Booking Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending Approval</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Payment Status Filter */}
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-[170px] h-9 text-sm rounded-lg border-slate-200">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Payments</SelectItem>
                <SelectItem value="PAID">Paid Only</SelectItem>
                <SelectItem value="PENDING">Pending Payment</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Switcher: Table vs Calendar */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto border border-slate-200/60">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className={cn(
                'h-7 px-3 text-xs font-medium rounded-md transition-all',
                viewMode === 'table'
                  ? 'bg-[#163A2E] text-white shadow-sm hover:bg-[#163A2E]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              )}
            >
              <List className="h-3.5 w-3.5 mr-1.5" />
              Table View
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={cn(
                'h-7 px-3 text-xs font-medium rounded-md transition-all',
                viewMode === 'calendar'
                  ? 'bg-[#163A2E] text-white shadow-sm hover:bg-[#163A2E]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              )}
            >
              <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
              Campaign Calendar
            </Button>
          </div>
        </div>

        {/* View Content */}
        {viewMode === 'calendar' ? (
          <div className="space-y-4">
            <BookingCalendar
              bookings={bookings}
              onSelectBooking={(b) => {
                setSelectedBooking(b);
                setDrawerOpen(true);
              }}
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center space-y-3">
                <div className="h-8 w-8 mx-auto border-2 border-[#20C466] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500">Loading campaign bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">No Bookings Found</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  {searchTerm || statusFilter !== 'ALL' || paymentFilter !== 'ALL'
                    ? 'No bookings match your current search and filter criteria.'
                    : 'No customer campaign bookings have been created yet.'}
                </p>
                {(searchTerm || statusFilter !== 'ALL' || paymentFilter !== 'ALL') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('ALL');
                      setPaymentFilter('ALL');
                    }}
                    className="mt-2"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Responsive Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">Booking Info</th>
                        <th className="py-3.5 px-4">Influencer</th>
                        <th className="py-3.5 px-4">Brand / Customer</th>
                        <th className="py-3.5 px-4">Campaign Date</th>
                        <th className="py-3.5 px-4">Amount</th>
                        <th className="py-3.5 px-4">Payment</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.map((booking) => {
                        const isPending = booking.bookingStatus === 'PENDING';
                        const isConfirmed = booking.bookingStatus === 'CONFIRMED';
                        const isPaid = booking.paymentStatus === 'PAID';

                        return (
                          <tr
                            key={booking.id}
                            className="hover:bg-slate-50/60 transition-colors group"
                          >
                            {/* Booking ID & Date */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 group-hover:text-[#163A2E]">
                                  {booking.bookingId}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : '—'}
                                </span>
                              </div>
                            </td>

                            {/* Influencer */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-emerald-100 text-[#163A2E] font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                                  {booking.influencer?.profileImage ? (
                                    <img
                                      src={booking.influencer.profileImage}
                                      alt={booking.influencer.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    booking.influencer?.name?.charAt(0) || 'I'
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-900 truncate">
                                    {booking.influencer?.name || 'Unknown Influencer'}
                                  </p>
                                  {booking.influencer?.categoryName && (
                                    <span className="text-[11px] text-slate-400">
                                      {booking.influencer.categoryName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Brand / Customer */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900">
                                  {booking.brandName || '—'}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {booking.customer?.name || booking.contactPerson || '—'}
                                </span>
                              </div>
                            </td>

                            {/* Campaign Date */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-xs font-medium">
                                  {booking.campaignDate
                                    ? new Date(booking.campaignDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })
                                    : '—'}
                                </span>
                              </div>
                            </td>

                            {/* Amount */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-[#163A2E]">
                                  ₹{(booking.totalAmount || 0).toLocaleString('en-IN')}
                                </span>
                                {booking.package?.name && (
                                  <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                                    {booking.package.name}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Payment Status */}
                            <td className="py-3.5 px-4">
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[11px] font-medium capitalize',
                                  isPaid
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    : booking.paymentStatus === 'FAILED'
                                    ? 'border-rose-200 bg-rose-50 text-rose-800'
                                    : 'border-amber-200 bg-amber-50 text-amber-800'
                                )}
                              >
                                {booking.paymentStatus || 'PENDING'}
                              </Badge>
                            </td>

                            {/* Booking Status */}
                            <td className="py-3.5 px-4">
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[11px] font-medium capitalize',
                                  booking.bookingStatus === 'CONFIRMED'
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    : booking.bookingStatus === 'COMPLETED'
                                    ? 'border-blue-200 bg-blue-50 text-blue-800'
                                    : booking.bookingStatus === 'CANCELLED' || booking.bookingStatus === 'REJECTED'
                                    ? 'border-rose-200 bg-rose-50 text-rose-800'
                                    : 'border-amber-200 bg-amber-50 text-amber-800'
                                )}
                              >
                                {booking.bookingStatus}
                              </Badge>
                            </td>

                            {/* Actions Dropdown */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setDrawerOpen(true);
                                  }}
                                  className="h-8 px-2.5 text-xs text-slate-700 hover:text-[#163A2E] hover:bg-slate-100"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  View
                                </Button>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel className="text-xs text-slate-500">Actions</DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedBooking(booking);
                                        setDrawerOpen(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4 mr-2 text-slate-400" />
                                      View Details
                                    </DropdownMenuItem>

                                    {isPending && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() => handleApprove(booking.id)}
                                          className="text-emerald-700 focus:text-emerald-800 focus:bg-emerald-50"
                                        >
                                          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                                          Approve Booking
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setRejectionModal({
                                              open: true,
                                              bookingId: booking.id,
                                              action: 'reject',
                                              bookingNumber: booking.bookingId,
                                              loading: false,
                                            });
                                          }}
                                          className="text-rose-600 focus:text-rose-700 focus:bg-rose-50"
                                        >
                                          <XCircle className="h-4 w-4 mr-2 text-rose-500" />
                                          Reject Booking
                                        </DropdownMenuItem>
                                      </>
                                    )}

                                    {isConfirmed && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() => handleComplete(booking.id)}
                                          className="text-blue-700 focus:text-blue-800 focus:bg-blue-50"
                                        >
                                          <Check className="h-4 w-4 mr-2 text-blue-600" />
                                          Mark as Completed
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setRejectionModal({
                                              open: true,
                                              bookingId: booking.id,
                                              action: 'cancel',
                                              bookingNumber: booking.bookingId,
                                              loading: false,
                                            });
                                          }}
                                          className="text-rose-600 focus:text-rose-700 focus:bg-rose-50"
                                        >
                                          <XCircle className="h-4 w-4 mr-2 text-rose-500" />
                                          Cancel Booking
                                        </DropdownMenuItem>
                                      </>
                                    )}

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setPaymentModal({
                                          open: true,
                                          bookingId: booking.id,
                                          currentStatus: booking.paymentStatus,
                                          newStatus: booking.paymentStatus === 'PAID' ? 'PENDING' : 'PAID',
                                          loading: false,
                                        });
                                      }}
                                    >
                                      <CreditCard className="h-4 w-4 mr-2 text-slate-400" />
                                      Update Payment
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile / Tablet Card View */}
                <div className="lg:hidden divide-y divide-slate-100">
                  {bookings.map((booking) => {
                    const isPending = booking.bookingStatus === 'PENDING';
                    const isPaid = booking.paymentStatus === 'PAID';

                    return (
                      <div key={booking.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-semibold text-slate-900 text-sm">
                              {booking.bookingId}
                            </span>
                            <p className="text-xs text-slate-400">
                              {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : '—'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] font-medium capitalize',
                                isPaid
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                  : 'border-amber-200 bg-amber-50 text-amber-800'
                              )}
                            >
                              {booking.paymentStatus || 'PENDING'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] font-medium capitalize',
                                booking.bookingStatus === 'CONFIRMED'
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                  : booking.bookingStatus === 'COMPLETED'
                                  ? 'border-blue-200 bg-blue-50 text-blue-800'
                                  : 'border-amber-200 bg-amber-50 text-amber-800'
                              )}
                            >
                              {booking.bookingStatus}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-full bg-emerald-100 text-[#163A2E] font-bold text-xs flex items-center justify-center shrink-0">
                            {booking.influencer?.profileImage ? (
                              <img
                                src={booking.influencer.profileImage}
                                alt={booking.influencer.name}
                                className="h-full w-full object-cover rounded-full"
                              />
                            ) : (
                              booking.influencer?.name?.charAt(0) || 'I'
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {booking.influencer?.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              Brand: <span className="font-medium text-slate-700">{booking.brandName}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-[#163A2E]">
                              ₹{(booking.totalAmount || 0).toLocaleString('en-IN')}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {booking.campaignDate ? new Date(booking.campaignDate).toLocaleDateString() : '—'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                          {isPending && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(booking.id)}
                              className="h-8 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                              Approve
                            </Button>
                          )}
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setDrawerOpen(true);
                            }}
                            className="h-8 text-xs bg-[#163A2E] hover:bg-[#163A2E]/90 text-white"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Booking Drawer */}
      <BookingDrawer
        booking={selectedBooking}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApprove={handleApprove}
        onReject={(id) => {
          setRejectionModal({
            open: true,
            bookingId: id,
            action: 'reject',
            bookingNumber: selectedBooking?.bookingId || '',
            loading: false,
          });
        }}
        onCancel={(id) => {
          setRejectionModal({
            open: true,
            bookingId: id,
            action: 'cancel',
            bookingNumber: selectedBooking?.bookingId || '',
            loading: false,
          });
        }}
        onComplete={handleComplete}
        onUpdatePaymentStatus={(id, paymentStatus) => {
          setPaymentModal({
            open: true,
            bookingId: id,
            currentStatus: selectedBooking?.paymentStatus || '',
            newStatus: paymentStatus,
            loading: false,
          });
        }}
      />

      {/* Rejection / Cancellation Dialog */}
      <RejectionDialog
        open={rejectionModal.open}
        onOpenChange={(open) => setRejectionModal((prev) => ({ ...prev, open }))}
        title={rejectionModal.action === 'reject' ? 'Reject Booking' : 'Cancel Booking'}
        description={
          rejectionModal.action === 'reject'
            ? `Please specify why booking ${rejectionModal.bookingNumber} is being rejected. This reason will be logged with the booking record.`
            : `Please specify the cancellation reason for booking ${rejectionModal.bookingNumber}.`
        }
        targetName={rejectionModal.bookingNumber}
        actionLabel={rejectionModal.action === 'reject' ? 'Reject Booking' : 'Confirm Cancellation'}
        loading={rejectionModal.loading}
        onConfirm={handleRejectConfirm}
      />

      {/* Payment Status Update Dialog */}
      <Dialog
        open={paymentModal.open}
        onOpenChange={(open) => setPaymentModal((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-[#163A2E]">Update Payment Status</DialogTitle>
            <DialogDescription>
              Select the verified payment status for this campaign booking.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Payment Status</label>
              <Select
                value={paymentModal.newStatus}
                onValueChange={(val) => setPaymentModal((prev) => ({ ...prev, newStatus: val }))}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">PAID (Verified)</SelectItem>
                  <SelectItem value="PENDING">PENDING (Awaiting Payment)</SelectItem>
                  <SelectItem value="FAILED">FAILED (Transaction Failed)</SelectItem>
                  <SelectItem value="REFUNDED">REFUNDED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-slate-500">
              Note: Changing payment status to <strong>PAID</strong> will reflect immediately in the verified revenue metrics.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaymentModal((prev) => ({ ...prev, open: false }))}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handlePaymentStatusSave}
              disabled={paymentModal.loading}
              className="bg-[#163A2E] hover:bg-[#163A2E]/90 text-white"
            >
              {paymentModal.loading ? 'Updating...' : 'Save Payment Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}