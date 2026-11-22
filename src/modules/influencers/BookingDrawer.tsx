// @ts-nocheck
'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  DollarSign,
  User,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
  CreditCard,
} from 'lucide-react';
import { Instagram } from './SocialIcons';
import { type InfluencerBookingItem } from '../../../lib/services/influencer.service';

interface BookingDrawerProps {
  booking: InfluencerBookingItem | null;
  open: boolean;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onCancel: (id: number) => void;
  onComplete: (id: number) => void;
  onUpdatePaymentStatus: (id: number, paymentStatus: string) => void;
}

export function BookingDrawer({
  booking,
  open,
  onClose,
  onApprove,
  onReject,
  onCancel,
  onComplete,
  onUpdatePaymentStatus,
}: BookingDrawerProps) {
  if (!booking) return null;

  const isPending = booking.bookingStatus === 'PENDING';
  const isConfirmed = booking.bookingStatus === 'CONFIRMED';
  const isCompleted = booking.bookingStatus === 'COMPLETED';
  const isRejected = booking.bookingStatus === 'REJECTED';
  const isCancelled = booking.bookingStatus === 'CANCELLED';

  const isPaid = booking.paymentStatus === 'PAID';

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent
        side="right"
        className="h-full gap-0 overflow-hidden bg-white p-0 data-[side=right]:!w-full data-[side=right]:!max-w-none data-[side=right]:sm:!w-[68vw] data-[side=right]:sm:!max-w-[68vw] data-[side=right]:lg:!w-[540px] data-[side=right]:lg:!max-w-[540px]"
      >
        {/* Header */}
        <SheetHeader className="border-b border-slate-100 bg-[#F7F9F8] px-5 py-5 pr-12 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-[#169F4D]">
              <Calendar className="size-5" />
            </span>
            <div className="min-w-0">
              <SheetTitle className="text-lg font-bold text-slate-900 truncate">
                Booking #{booking.bookingId}
              </SheetTitle>
              <SheetDescription className="mt-0.5 text-xs text-slate-500">
                Created on{' '}
                {booking.createdAt
                  ? new Date(booking.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Status Overview Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Booking Status Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Booking Status
              </span>
              <div className="flex items-center gap-1.5">
                {isCompleted && (
                  <Badge className="bg-emerald-100 text-emerald-800 text-xs font-bold border-0 shadow-none">
                    Completed
                  </Badge>
                )}
                {isConfirmed && (
                  <Badge className="bg-blue-100 text-blue-800 text-xs font-bold border-0 shadow-none">
                    Confirmed
                  </Badge>
                )}
                {isPending && (
                  <Badge className="bg-amber-100 text-amber-800 text-xs font-bold border-0 shadow-none">
                    Pending Approval
                  </Badge>
                )}
                {isRejected && (
                  <Badge className="bg-rose-100 text-rose-800 text-xs font-bold border-0 shadow-none">
                    Rejected
                  </Badge>
                )}
                {isCancelled && (
                  <Badge className="bg-slate-200 text-slate-700 text-xs font-bold border-0 shadow-none">
                    Cancelled
                  </Badge>
                )}
              </div>
            </div>

            {/* Payment Status Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Payment Status
              </span>
              <div className="flex items-center gap-1.5">
                <Badge
                  className={cn(
                    'text-xs font-bold border-0 shadow-none',
                    isPaid
                      ? 'bg-emerald-100 text-emerald-800'
                      : booking.paymentStatus === 'FAILED'
                      ? 'bg-rose-100 text-rose-800'
                      : booking.paymentStatus === 'REFUNDED'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-amber-100 text-amber-800'
                  )}
                >
                  {booking.paymentStatus || 'PENDING'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Rejection / Cancellation Reason if present */}
          {booking.rejectionReason && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1">
              <span className="font-bold text-rose-800 uppercase tracking-wider block text-[10px]">
                Reason Recorded
              </span>
              <p className="text-rose-900 leading-relaxed">{booking.rejectionReason}</p>
            </div>
          )}

          {/* Influencer Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Assigned Creator
            </span>
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-emerald-50 border border-emerald-100 shrink-0 flex items-center justify-center overflow-hidden">
                {booking.influencer?.profileImage ? (
                  <img
                    src={booking.influencer.profileImage}
                    alt={booking.influencer.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <User className="size-5 text-[#163A2E]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {booking.influencer?.name || 'Creator'}
                </h4>
                <p className="text-xs text-slate-500 truncate">
                  {booking.influencer?.categoryName || 'Influencer'}
                </p>
              </div>
            </div>
          </div>

          {/* Campaign & Client Info */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Campaign & Client Details
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Brand Name</span>
                <span className="font-bold text-slate-900">{booking.brandName || booking.businessName}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Campaign Date</span>
                <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-emerald-600" />
                  {booking.campaignDate
                    ? new Date(booking.campaignDate).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Contact Person</span>
                <span className="font-semibold text-slate-800">{booking.contactPerson}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Contact Email</span>
                <span className="font-semibold text-slate-800">{booking.email}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Mobile Phone</span>
                <span className="font-semibold text-slate-800">{booking.mobileNumber}</span>
              </div>
            </div>

            {/* Campaign Objective & Notes */}
            {booking.campaignObjective && (
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-600">Objective</span>
                <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {booking.campaignObjective}
                </p>
              </div>
            )}
            {booking.notes && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-600">Client Notes</span>
                <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {booking.notes}
                </p>
              </div>
            )}
          </div>

          {/* Pricing & Financial Breakdown */}
          <div className="p-4 rounded-xl border border-slate-200 bg-[#F7F9F8] space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Payment Breakdown
            </span>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-600">Package Amount</span>
              <span className="font-semibold text-slate-900">
                ₹{Number(booking.packageAmount || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-600">Platform Convenience Fee</span>
              <span className="font-semibold text-slate-900">
                ₹{Number(booking.platformFee ?? 500).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-600">GST (18%)</span>
              <span className="font-semibold text-slate-900">
                ₹{Number(booking.gst || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-slate-200 text-sm font-extrabold text-[#163A2E]">
              <span>Total Amount</span>
              <span>₹{Number(booking.totalAmount || 0).toLocaleString()}</span>
            </div>

            {/* Update Payment Status Control */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200/80">
              <span className="text-xs font-bold text-slate-700">Update Payment:</span>
              <Select
                value={booking.paymentStatus || 'PENDING'}
                onValueChange={(val) => {
                  if (val && val !== booking.paymentStatus) {
                    onUpdatePaymentStatus(booking.id, val);
                  }
                }}
              >
                <SelectTrigger className="h-8 w-32 bg-white text-xs border-slate-200 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="PAID">PAID</SelectItem>
                  <SelectItem value="FAILED">FAILED</SelectItem>
                  <SelectItem value="REFUNDED">REFUNDED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-[#F7F9F8] px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-slate-200 text-xs font-semibold"
          >
            Close
          </Button>

          <div className="flex items-center gap-2">
            {!isCancelled && !isRejected && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose();
                  onCancel(booking.id);
                }}
                className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </Button>
            )}

            {isPending && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onReject(booking.id);
                  }}
                  className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                >
                  Reject
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    onClose();
                    onApprove(booking.id);
                  }}
                  className="rounded-xl bg-[#20C466] hover:bg-[#1bb05b] text-white text-xs font-bold"
                >
                  Approve Booking
                </Button>
              </>
            )}

            {isConfirmed && (
              <Button
                type="button"
                onClick={() => {
                  onClose();
                  onComplete(booking.id);
                }}
                className="rounded-xl bg-[#163A2E] hover:bg-[#204c3d] text-white text-xs font-bold"
              >
                Mark Completed
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
