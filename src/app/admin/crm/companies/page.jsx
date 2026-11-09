'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { loadCompanies, removeCompany, saveCompany, sessionCan } from '@/modules/crm/crm-api';

const blank = { name: '', industry: '', website: '', email: '', phone: '', address: '', city: '', state: '', status: 'ACTIVE', notes: '' };

export default function CompaniesRoute() {
  const [allowed, setAllowed] = React.useState(false);
  React.useEffect(() => setAllowed(sessionCan('COMPANY') || sessionCan('CRM')), []);
  const load = React.useCallback((query) => loadCompanies({ page: query.page, limit: 20, search: query.search || undefined, status: query.status || undefined, industry: query.industry || undefined }), []);
  return <CrmScreen title="Companies" description="Companies returned by the companies API." actionLabel="Add company" canCreate={allowed} load={load} blank={blank}
    filters={[{ key: 'status', label: 'All statuses', options: ['ACTIVE', 'INACTIVE'].map((value) => ({ value, label: value })) }]}
    columns={[{ header: 'Company', accessorKey: 'name' }, { header: 'Industry', cell: (row) => row.industry || '—' }, { header: 'Website', cell: (row) => row.website || row.domain || '—' }, { header: 'Email', cell: (row) => row.email || '—' }, { header: 'Phone', cell: (row) => row.phone || '—' }, { header: 'City', cell: (row) => row.city || '—' }, { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || 'active').toLowerCase()} /> }]}
    renderForm={(form, setForm) => <div className="grid gap-3 sm:grid-cols-2">{['name', 'industry', 'website', 'email', 'phone', 'address', 'city', 'state'].map((key) => <Field key={key} label={key}><Input required={key === 'name'} value={form[key] || ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></Field>)}</div>}
    onSave={async (form, id) => { await saveCompany(form, id); toast.success(id ? 'Company updated' : 'Company created'); }}
    rowActions={(reload) => allowed ? [{ label: 'Delete', onSelect: async (row) => { await removeCompany(row.id); reload((value) => value + 1); } }] : []}
    detail={(row) => <div className="space-y-1 text-sm"><p>{row.name}</p><p>{row.industry || 'No industry'} · {row.website || 'No website'}</p><p>{row.address || ''} {row.city || ''} {row.state || ''}</p><p>{row.email || 'No email'} · {row.phone || 'No phone'}</p><p>Contacts and deals are available on the contact and deal records that reference this company.</p></div>}
  />;
}
function Field({ label, children }) { return <Label className="grid gap-1 text-xs capitalize">{label}{children}</Label>; }
