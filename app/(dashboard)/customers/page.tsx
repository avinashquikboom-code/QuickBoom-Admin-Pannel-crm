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
    {query.isLoading ? <p>Loading customers…</p> : <div className="overflow-x-auto"><table className="w-full bg-white rounded-xl"><thead><tr>{['Customer', 'Email', 'Status', 'Plan', 'Actions'].map(h => <th className="p-4 text-left" key={h}>{h}</th>)}</tr></thead><tbody>{customers.map((c: any) => <tr key={c.id} className="border-t"><td className="p-4">{c.companyName}</td><td className="p-4">{c.email || '—'}</td><td className={`p-4 font-bold ${c.status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-500'}`}>{c.status === 'ACTIVE' ? 'Active' : 'Inactive'}</td><td className="p-4">{c.planName || 'No active plan'}</td><td className="p-4 space-x-3"><Link className="text-emerald-700" href={`/subscribe?customerId=${c.id}`}>Choose plan</Link>{!c.userId && c.email && <button onClick={() => createAccount(c.id)}>Create login</button>}</td></tr>)}</tbody></table>{!customers.length && <p className="p-5">No customers found.</p>}</div>}
  </div>;
}
