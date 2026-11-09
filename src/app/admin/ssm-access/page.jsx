'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { createHandler, loadHandlers, loadSocialAccounts, removeHandler, sessionCan, socialError, socialGaps, updateHandler } from '@/modules/social/social-api';

const blank = { platform: 'INSTAGRAM', accountName: '', accountUrl: '', socialMediaId: '', handlerName: '', handlerEmail: '', workType: '', status: 'ACTIVE', customerId: '', notes: '', password: '' };

export default function SsmAccessPage() {
  const [allowed, setAllowed] = React.useState(false);
  const [accounts, setAccounts] = React.useState([]);
  React.useEffect(() => setAllowed(sessionCan('SOCIAL')), []);
  React.useEffect(() => { loadSocialAccounts().then(setAccounts).catch(() => setAccounts([])); }, []);
  const load = React.useCallback((query) => loadHandlers(query), []);

  return <CrmScreen title="SSM Account Access Details" description="Social media handler records and connected accounts. Secrets are not shown." actionLabel="Add handler" canCreate={allowed} load={load} blank={blank}
    gap={{ title: 'Account secrets', detail: socialGaps.tokens }}
    below={() => <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{accounts.map((account) => <div key={account.id} className="rounded-xl border bg-white p-3 text-sm"><p className="font-medium">{account.accountName}</p><p>{account.platform} · {account.username || account.externalAccountId}</p><p>{account.customer?.companyName || account.customer?.name || `Customer ${account.customerId}`}</p><p>Token expiry {account.tokenExpiresAt ? String(account.tokenExpiresAt).slice(0, 10) : 'not returned'}</p><StatusBadge status={account.isConnected ? 'active' : 'inactive'} /></div>)}</div>}
    filters={[{ key: 'platform', label: 'All platforms', options: ['INSTAGRAM', 'FACEBOOK', 'YOUTUBE', 'LINKEDIN', 'TWITTER'].map((value) => ({ value, label: value })) }, { key: 'status', label: 'All statuses', options: ['ACTIVE', 'INACTIVE', 'PAUSED'].map((value) => ({ value, label: value })) }]}
    columns={[
      { header: 'Account', cell: (row) => row.accountName },
      { header: 'Platform', cell: (row) => row.platform },
      { header: 'Customer', cell: (row) => row.customer?.companyName || row.customer?.name || row.customerId },
      { header: 'Handler', cell: (row) => row.handlerName || '—' },
      { header: 'Access', cell: (row) => row.passwordOnFile ? 'Credential stored' : 'No credential flag' },
      { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || '').toLowerCase()} /> },
    ]}
    renderForm={(form, setForm) => <div className="grid gap-3 sm:grid-cols-2"><Field label="Platform"><Input required value={form.platform || ''} onChange={(event) => setForm({ ...form, platform: event.target.value })} /></Field><Field label="Account name"><Input required value={form.accountName || ''} onChange={(event) => setForm({ ...form, accountName: event.target.value })} /></Field><Field label="Account URL"><Input value={form.accountUrl || ''} onChange={(event) => setForm({ ...form, accountUrl: event.target.value })} /></Field><Field label="Account ID"><Input value={form.socialMediaId || ''} onChange={(event) => setForm({ ...form, socialMediaId: event.target.value })} /></Field><Field label="Customer ID"><Input value={form.customerId || ''} onChange={(event) => setForm({ ...form, customerId: event.target.value })} /></Field><Field label="Handler"><Input value={form.handlerName || ''} onChange={(event) => setForm({ ...form, handlerName: event.target.value })} /></Field><Field label="New password"><Input type="password" autoComplete="new-password" value={form.password || ''} onChange={(event) => setForm({ ...form, password: event.target.value })} /></Field><Field label="Notes"><Input value={form.notes || ''} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field></div>}
    onSave={async (form, id) => { if (id) await updateHandler(id, { ...form, password: '' }); else await createHandler(form); toast.success(id ? 'Handler updated' : 'Handler created'); }}
    rowActions={(reload) => allowed ? [{ label: 'Delete', onSelect: async (row) => { try { await removeHandler(row.id); reload((value) => value + 1); } catch (error) { toast.error(socialError(error)); } } }] : []}
    detail={(row) => <div className="space-y-1 text-sm"><p className="font-medium">{row.accountName}</p><p>{row.accountUrl || 'No URL'} · {row.socialMediaId || 'No account ID'}</p><p>{row.handlerName || 'No handler'} · {row.handlerEmail || 'No email'}</p><p>{row.notes || 'No notes'}</p></div>}
  />;
}

function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
