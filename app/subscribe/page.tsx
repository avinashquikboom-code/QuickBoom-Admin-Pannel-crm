'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getErrorMessage } from '@/lib/utils';

declare global { interface Window { Razorpay: any } }
const money = (paise: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);
const unwrap = (r: any) => r?.data ?? r;
export default function SubscribePage() {
  const { user, setAuth } = useAuthStore();
  const [plans, setPlans] = useState<any[]>([]);
  const [cycle, setCycle] = useState('MONTHLY');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [customerId, setCustomerId] = useState<number>();
  const [account, setAccount] = useState<any>(null);
  const [checkout, setCheckout] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keys, setKeys] = useState<Record<string, string>>({});
  useEffect(() => {
    api.get('/plans').then(r => setPlans(unwrap(r))).catch(e => setError(getErrorMessage(e)));
    const id = Number(new URLSearchParams(window.location.search).get('customerId'));
    if (id > 0) setCustomerId(id);
  }, []);
  const refresh = async () => {
    const r = await api.get(customerId ? `/customers/${customerId}` : '/customers/me');
    setAccount(unwrap(r));
  };
  useEffect(() => {
    if (!user) return;
    refresh().catch(e => setError(getErrorMessage(e)));
    const timer = setInterval(() => refresh().catch(e => setError(getErrorMessage(e))), 15000);
    return () => clearInterval(timer);
  }, [user, customerId]);
  const login = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try { const r = unwrap(await api.post('/auth/login', { email, password, appType: 'CUSTOMER' })); setAuth(r.user, r.accessToken || r.tokens.accessToken, r.refreshToken || r.tokens.refreshToken); }
    catch(e) { setError(getErrorMessage(e)); } finally { setBusy(false); }
  };
  const purchase = async (plan: any) => {
    if (!user) { setMessage('Sign in below to purchase a plan.'); return; }
    setBusy(true); setError(''); setMessage('');
    const selection = `${customerId || 'self'}:${plan.id}:${cycle}`;
    const storageKey = `qb-checkout:${user.id}:${selection}`;
    const key = keys[selection] || sessionStorage.getItem(storageKey) || crypto.randomUUID();
    sessionStorage.setItem(storageKey, key); setKeys(k => ({ ...k, [selection]: key }));
    try {
      const order = unwrap(await api.post('/payments/razorpay/order', { planId: plan.id, billingCycle: cycle, idempotencyKey: key, ...(customerId ? { customerId } : {}) }));
      if (order.status === 'PAID') { await refresh(); setMessage('This purchase is already paid.'); return; }
      setCheckout({ ...order, planName: plan.name, storageKey, selection });
    } catch(e) { setError(getErrorMessage(e)); } finally { setBusy(false); }
  };
  const pay = () => {
    if (!window.Razorpay) { setError('Payment gateway is still loading. Please retry.'); return; }
    const order = checkout;
    setBusy(true);
    const widget = new window.Razorpay({ key: order.keyId, amount: order.totalPaise, currency: 'INR', order_id: order.orderId, name: 'Quickboom', description: order.planName,
      handler: async (response: any) => {
        try {
          await api.post('/payments/razorpay/verify', { ...response, planId: order.planId, billingCycle: order.billingCycle });
          sessionStorage.removeItem(order.storageKey); setKeys(k => { const next = { ...k }; delete next[order.selection]; return next; });
          await refresh(); setCheckout(null); setMessage('Payment verified. Your subscription is active.');
        } catch(e) { setError(getErrorMessage(e)); setMessage('Payment confirmation is pending. Your status will refresh automatically.'); }
        finally { setBusy(false); }
      }, modal: { ondismiss: () => { setBusy(false); setMessage('Checkout closed. You can retry the same order.'); } } });
    widget.on('payment.failed', () => { setBusy(false); setError('Payment failed. Your account has not been activated by this attempt. You can retry.'); });
    widget.open();
  };
  const breakdown = (p: any) => <dl className="space-y-2 text-sm">
    <div className="flex justify-between"><dt>Base amount</dt><dd>{money(p.basePaise)}</dd></div>
    {p.discountPaise > 0 && <div className="flex justify-between text-emerald-700"><dt>Yearly discount ({p.yearlyDiscountBps / 100}%)</dt><dd>−{money(p.discountPaise)}</dd></div>}
    <div className="flex justify-between"><dt>Taxable amount</dt><dd>{money(p.taxablePaise)}</dd></div>
    <div className="flex justify-between"><dt>GST ({p.taxRateBps / 100}%)</dt><dd>{money(p.gstPaise)}</dd></div>
    <div className="flex justify-between border-t pt-2 font-bold"><dt>Total payable</dt><dd>{money(p.totalPaise)}</dd></div>
  </dl>;
  return <main className="max-w-6xl mx-auto px-5 py-12 space-y-8">
    <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
    <header className="text-center space-y-3"><h1 className="text-3xl font-bold">Choose your growth plan</h1><p>Transparent pricing. GST shown before you pay.</p>
      {account && <p>Customer: {account.companyName} · <strong className={account.status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-600'}>{account.status === 'ACTIVE' ? 'Active' : 'Inactive'}</strong></p>}
      <div className="inline-flex rounded-full border bg-white p-1">{['MONTHLY', 'YEARLY'].map(c => <button key={c} onClick={() => { setCycle(c); setCheckout(null); }} className={`px-5 py-2 rounded-full ${cycle === c ? 'bg-emerald-600 text-white' : ''}`}>{c === 'MONTHLY' ? 'Monthly' : 'Yearly'}</button>)}</div>
    </header>
    {error && <p role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl">{error}</p>}
    {message && <p role="status" className="p-4 bg-emerald-50 text-emerald-800 rounded-xl">{message}</p>}
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">{plans.filter(p => p.pricing?.[cycle]).map(plan => { const price = plan.pricing[cycle]; return <article key={plan.id} className={`relative bg-white border-2 rounded-3xl p-6 flex flex-col gap-5 ${plan.isRecommended ? 'border-emerald-500 shadow-lg' : 'border-slate-200'}`}>
      {plan.isRecommended && <span className="self-start rounded-full px-3 py-1 bg-emerald-600 text-white text-xs font-bold">Most Popular</span>}
      <div><h2 className="text-xl font-bold">{plan.name}</h2><p className="text-slate-500">{plan.subtitle}</p></div>
      <div>{price.discountPaise > 0 && <><p className="line-through text-slate-400">{money(price.basePaise)}/year</p><p className="text-emerald-700 font-bold">Save {price.yearlyDiscountBps / 100}%</p></>}<p className="text-3xl font-bold">{money(price.taxablePaise)}<span className="text-sm font-normal">/{cycle === 'YEARLY' ? 'year' : 'month'}</span></p></div>
      {breakdown(price)}<ul className="space-y-3 flex-1">{plan.features.map((f: string, i: number) => <li className="flex gap-2 text-sm" key={i}><span className="text-emerald-600">✓</span>{f}</li>)}</ul>
      <button disabled={busy} onClick={() => purchase(plan)} className="bg-emerald-600 text-white font-bold rounded-xl py-3 disabled:opacity-50">Purchase Now</button>
    </article>; })}</section>
    {!user && <form onSubmit={login} className="max-w-sm mx-auto p-6 rounded-2xl bg-white border space-y-4"><h2 className="font-bold">Customer sign in</h2><label className="block">Email<input className="border rounded-lg p-2 w-full" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" /></label><label className="block">Password<input className="border rounded-lg p-2 w-full" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label><button disabled={busy} className="bg-emerald-600 text-white rounded-lg p-3 w-full">Sign in</button></form>}
    {checkout && <section className="max-w-lg mx-auto bg-white border rounded-2xl p-6 space-y-4"><h2 className="font-bold">Confirm {checkout.planName} · {checkout.billingCycle === 'YEARLY' ? 'Yearly' : 'Monthly'}</h2>{breakdown(checkout)}<button disabled={busy} onClick={pay} className="bg-emerald-600 text-white rounded-lg p-3 w-full disabled:opacity-50">Pay {money(checkout.totalPaise)}</button></section>}
    {account?.subscriptions?.filter((s: any) => s.status === 'ACTIVE').map((s: any) => <div key={s.id} className="bg-white rounded-xl border p-4 flex justify-between gap-4"><p>{s.plan.name} · Ends {new Date(s.endDate).toLocaleDateString()}</p><button className="text-red-700" onClick={async () => { try { await api.post(`/subscriptions/${s.id}/cancel`); await refresh(); } catch(e) { setError(getErrorMessage(e)); } }}>Cancel subscription</button></div>)}
  </main>;
}
