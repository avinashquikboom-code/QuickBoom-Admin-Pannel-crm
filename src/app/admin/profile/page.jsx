'use client';

import * as React from 'react';
import api from '../../../../lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Avatar, AvatarFallback } from '@/components/common/Avatar';
import { adminProfile } from '@/lib/auth/admin-profile';

export default function AdminProfilePage() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get('/auth/profile').then((payload) => {
      const record = payload?.data ?? payload;
      if (!record || typeof record !== 'object' || !record.id) {
        throw new Error('Unable to load your profile. Please try again.');
      }
      if (active) setUser(record);
    }).catch(() => {
      if (active) setError('Unable to load your profile. Check your connection or sign in again, then retry.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [refresh]);

  const profile = adminProfile(user);
  const fields = [
    ['Full name', profile.name],
    ['Email', profile.email],
    ['Role', profile.role],
    ['Phone', user?.phone],
    ['User ID', user?.userId ?? user?.id],
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-5">
      <PageHeader title="Admin Profile" description="Your signed-in account details." actions={
        <Button variant="outline" disabled={loading} onClick={() => setRefresh((value) => value + 1)}>Refresh</Button>
      } />
      {loading ? <p role="status" className="text-sm text-slate-500">Loading your profile…</p> : error ? (
        <div role="alert" className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p>{error}</p>
          <Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>Try again</Button>
        </div>
      ) : user && (
        <section aria-label="Account details" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-6 flex min-w-0 items-center gap-3">
            <Avatar className="size-12 shrink-0"><AvatarFallback className="bg-brand text-primary-foreground font-semibold">{profile.initials}</AvatarFallback></Avatar>
            <div className="min-w-0 break-words"><h2 className="text-lg font-semibold text-slate-900">{profile.name}</h2><p className="text-sm text-slate-500">{profile.role}</p></div>
          </div>
          <dl className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
            {fields.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm text-slate-900">{value || 'Not provided'}</dd></div>)}
          </dl>
        </section>
      )}
    </div>
  );
}
