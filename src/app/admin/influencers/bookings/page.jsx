'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { approveBooking, cancelBooking, loadBookings, rejectBooking, sessionCan, socialError, socialGaps, updateBookingStatus } from '@/modules/social/social-api';

export default function InfluencerBookingsPage() {
  const [allowed, setAllowed] = React.useState(false);
  React.useEffect(() => setAllowed(sessionCan('INFLUENCER')), []);
  const load = React.useCallback((query) => loadBookings(query), []);
  return <CrmScreen title="Influencer Bookings" description="Campaign bookings with the status and payment fields stored on each booking." canCreate={false} load={load}
    gap={{ title: 'Calendar', detail: socialGaps.calendar }}
    stats={(payload) => [{ label: 'Bookings', value: payload.stats?.totalBookings }, { label: 'Pending approval', value: payload.stats?.pendingApproval }, { label: 'Paid revenue', value: payload.stats?.totalRevenue }]}
    filters={[{ key: 'status', label: 'All statuses', options: ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'].map((value) => ({ value, label: value })) }]}
    columns={[
      { header: 'Booking', cell: (row) => row.bookingId },
      { header: 'Influencer', cell: (row) => row.influencer?.name || '—' },
      { header: 'Brand', cell: (row) => row.brandName || row.businessName || '—' },
      { header: 'Customer', cell: (row) => row.customer?.companyName || row.customer?.name || '—' },
      { header: 'Campaign date', cell: (row) => String(row.campaignDate || '').slice(0, 10) },
      { header: 'Amount', cell: (row) => row.totalAmount ?? '—' },
      { header: 'Payment', cell: (row) => <StatusBadge status={String(row.paymentStatus || '').toLowerCase()} /> },
      { header: 'Status', cell: (row) => <StatusBadge status={String(row.bookingStatus || '').toLowerCase()} /> },
    ]}
    rowActions={(reload) => allowed ? [
      { label: 'Approve', onSelect: (row) => run(() => approveBooking(row.id), reload) },
      { label: 'Reject', onSelect: (row) => { const reason = window.prompt('Rejection reason') || undefined; return run(() => rejectBooking(row.id, reason), reload); } },
      { label: 'Complete', onSelect: (row) => run(() => updateBookingStatus(row.id, 'COMPLETED'), reload) },
      { label: 'Cancel', onSelect: (row) => { const reason = window.prompt('Cancellation reason') || undefined; return run(() => cancelBooking(row.id, reason), reload); } },
    ] : []}
    detail={(row) => <div className="space-y-1 text-sm"><p className="font-medium">{row.bookingId} · {row.influencer?.name}</p><p>{row.contactPerson} · {row.email} · {row.mobileNumber}</p><p>{row.campaignObjective || 'No objective'}</p><p>{row.notes || 'No notes'}</p><p>{row.rejectionReason || ''}</p></div>}
  />;
}

async function run(action, reload) {
  try { await action(); reload((value) => value + 1); } catch (error) { toast.error(socialError(error)); }
}
