'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
export default function CustomersPage() {
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const query = useQuery({ queryKey: ['customers-list', search], refetchInterval: 15000, queryFn: async () => { const r: any = await api.get('/customers', { params: { search } }); return r.data ?? r; } });
  const customers = Array.isArray(query.data) ? query.data : [];
  const createAccount = async (id: number) => {
    const password = window.prompt('Set an initial customer password (at least 10 characters). Share it securely with the customer.');
    if (!password) return;
    try { await api.post(`/customers/${id}/account`, { password }); await query.refetch(); } catch(e) { setError(getErrorMessage(e)); }
  };
  return <div className="space-y-5"><h1 className="text-2xl font-bold">Customers</h1><p>Won leads appear here as Inactive. Status follows verified subscriptions.</p>
    <input aria-label="Search customers" className="border rounded-lg p-3" placeholder="Search customers" value={search} onChange={e => setSearch(e.target.value)} />
    {(error || query.error) && <p role="alert" className="text-red-700">{error || getErrorMessage(query.error)}</p>}
    {query.isLoading ? <p>Loading customers…</p> : <div className="overflow-x-auto"><table className="w-full bg-white rounded-xl"><thead><tr>{['Customer', 'Email', 'Status', 'Plan', 'Purchase Date', 'Activation Date', 'Actions'].map(h => <th className="p-4 text-left" key={h}>{h}</th>)}</tr></thead><tbody>{customers.map((c: any) => {
      const isPending = c.subscriptionStatus === 'PENDING_ACTIVATION';
      const isActive = c.status === 'ACTIVE';
      const statusLabel = isActive ? 'Active' : isPending ? 'Pending Activation' : 'Inactive';
      const statusStyle = isActive
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : isPending
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : 'bg-slate-100 text-slate-600 border-slate-200';
      const formatDate = (val: string | null) => {
        if (!val) return '—';
        const d = new Date(val);
        return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      };
      return <tr key={c.id} className="border-t">
        <td className="p-4 font-medium">{c.companyName}</td>
        <td className="p-4">{c.email || '—'}</td>
        <td className="p-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusStyle}`}>
            {statusLabel}
          </span>
        </td>
        <td className="p-4">{c.planName || 'No active plan'}</td>
        <td className="p-4 text-sm text-slate-600">{formatDate(c.purchaseDate || c.createdAt)}</td>
        <td className="p-4 text-sm text-slate-600">{formatDate(c.activationDate || c.subscriptionStartDate)}</td>
        <td className="p-4 space-x-3"><Link className="text-emerald-700 font-medium" href={`/subscribe?customerId=${c.id}`}>Choose plan</Link>{!c.userId && c.email && <button onClick={() => createAccount(c.id)}>Create login</button>}</td>
      </tr>;
    })}</tbody></table>{!customers.length && <p className="p-5">No customers found.</p>}</div>}
  </div>;
}
