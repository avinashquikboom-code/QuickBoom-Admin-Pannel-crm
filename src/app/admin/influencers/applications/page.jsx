'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { approveApplication, loadApplications, rejectApplication, sessionCan, socialError } from '@/modules/social/social-api';

export default function InfluencerApplicationsPage() {
  const [allowed, setAllowed] = React.useState(false);
  React.useEffect(() => setAllowed(sessionCan('INFLUENCER')), []);
  const load = React.useCallback((query) => loadApplications({ search: query.search || undefined, status: query.status || undefined }), []);
  return <CrmScreen title="Influencer Applications" description="Applications are influencer records waiting for approval, rejection, or suspension." canCreate={false} load={load}
    stats={(payload) => [{ label: 'Total', value: payload.counts?.total }, { label: 'Pending', value: payload.counts?.pending }, { label: 'Approved', value: payload.counts?.approved }, { label: 'Rejected', value: payload.counts?.rejected }, { label: 'Suspended', value: payload.counts?.suspended }]}
    filters={[{ key: 'status', label: 'All statuses', options: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((value) => ({ value, label: value })) }]}
    columns={[
      { header: 'Applicant', cell: (row) => row.name },
      { header: 'Contact', cell: (row) => row.email || row.phone || '—' },
      { header: 'Platform', cell: (row) => row.platform || '—' },
      { header: 'Category', cell: (row) => row.categoryName || '—' },
      { header: 'Applied', cell: (row) => String(row.createdAt || '').slice(0, 10) },
      { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || '').toLowerCase()} /> },
    ]}
    rowActions={(reload) => allowed ? [
      { label: 'Approve', onSelect: async (row) => { try { await approveApplication(row.id); reload((value) => value + 1); toast.success('Application approved'); } catch (error) { toast.error(socialError(error)); } } },
      { label: 'Reject', onSelect: async (row) => { const reason = window.prompt('Rejection reason'); if (!reason) return; try { await rejectApplication(row.id, reason); reload((value) => value + 1); } catch (error) { toast.error(socialError(error)); } } },
    ] : []}
    detail={(row) => <div className="space-y-1 text-sm"><p className="font-medium">{row.name} · {row.handle || 'No handle'}</p><p>{row.email || 'No email'} · {row.phone || 'No phone'}</p><p>{row.city || 'No city'} · {row.followersCount || row.followers || 0} followers</p><p>Instagram {row.instagramHandle || '—'} · YouTube {row.youtubeHandle || '—'}</p><p>Review note: {row.rejectionReason || 'None'}</p></div>}
  />;
}
