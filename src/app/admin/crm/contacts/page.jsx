'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { loadCompanies, loadContacts, personName, removeContact, saveContact, sessionCan } from '@/modules/crm/crm-api';

const blank = { firstName: '', lastName: '', email: '', phone: '', designation: '', companyId: '', type: 'PROSPECT', status: 'ACTIVE' };

export default function ContactsRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [companies, setCompanies] = React.useState([]);
  React.useEffect(() => { setAllowed(sessionCan('CONTACT') || sessionCan('CRM')); loadCompanies({ page: 1, limit: 100 }).then((result) => setCompanies(result.rows)).catch(() => setCompanies([])); }, []);
  const load = React.useCallback((query) => loadContacts({ page: query.page, limit: 20, search: query.search || undefined, status: query.status || undefined, type: query.type || undefined }), []);
  return <CrmScreen title="Contacts" description="Contacts linked to companies through the contacts API." actionLabel="Add contact" canCreate={allowed} load={load} blank={blank}
    filters={[{ key: 'type', label: 'All types', options: ['CUSTOMER', 'VENDOR', 'PARTNER', 'PROSPECT'].map((value) => ({ value, label: value })) }, { key: 'status', label: 'All statuses', options: ['ACTIVE', 'INACTIVE'].map((value) => ({ value, label: value })) }]}
    columns={[{ header: 'Name', cell: (row) => personName(row) }, { header: 'Email', cell: (row) => row.email || '—' }, { header: 'Phone', cell: (row) => row.phone || row.mobile || '—' }, { header: 'Designation', cell: (row) => row.designation || '—' }, { header: 'Company', cell: (row) => row.company?.name || '—' }, { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || 'active').toLowerCase()} /> }]}
    renderForm={(form, setForm) => <div className="grid gap-3 sm:grid-cols-2"><Field label="First name"><Input required value={form.firstName || ''} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></Field><Field label="Last name"><Input required value={form.lastName || ''} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></Field><Field label="Email"><Input value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field><Field label="Phone"><Input value={form.phone || ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field><Field label="Designation"><Input value={form.designation || ''} onChange={(event) => setForm({ ...form, designation: event.target.value })} /></Field><Field label="Company"><select className="h-9 rounded-md border px-2 text-sm" value={form.companyId || ''} onChange={(event) => setForm({ ...form, companyId: event.target.value })}><option value="">None</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></Field><Field label="Type"><select className="h-9 rounded-md border px-2 text-sm" value={form.type || 'PROSPECT'} onChange={(event) => setForm({ ...form, type: event.target.value })}>{['CUSTOMER', 'VENDOR', 'PARTNER', 'PROSPECT'].map((type) => <option key={type}>{type}</option>)}</select></Field></div>}
    onSave={async (form, id) => { await saveContact(form, id); toast.success(id ? 'Contact updated' : 'Contact created'); }}
    rowActions={(reload) => allowed ? [{ label: 'Delete', onSelect: async (row) => { await removeContact(row.id); reload((value) => value + 1); } }] : []}
    detail={(row) => <p className="text-sm">{personName(row)} · {row.designation || 'No designation'} · {row.company?.name || 'No company'} · {row.email || 'No email'} · {row.phone || 'No phone'}</p>}
  />;
}
function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
