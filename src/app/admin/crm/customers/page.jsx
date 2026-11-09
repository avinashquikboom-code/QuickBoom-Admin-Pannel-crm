'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { crmError, customerRelations, loadCustomers, loadEmployees, personName, saveCustomer, sessionCan } from '@/modules/crm/crm-api';

const blank = { name: '', companyName: '', email: '', phone: '', customerType: '', industry: '', status: 'ACTIVE', assignedEmployeeId: '', city: '', address: '', notes: '' };

export default function CustomersRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [employees, setEmployees] = React.useState([]);
  React.useEffect(() => { setAllowed(sessionCan('CUSTOMER') || sessionCan('CRM')); loadEmployees().then(setEmployees).catch(() => setEmployees([])); }, []);
  const load = React.useCallback((query) => loadCustomers({ page: query.page, limit: 20, search: query.search || undefined, status: query.status || undefined }), []);
  return <CrmScreen title="Customers" description="Tenant customers, assignment, and related deals, visits, and activities." actionLabel="Add customer" canCreate={allowed} load={load} blank={blank}
    stats={(result) => [{ label: 'Total', value: result.metrics?.totalCustomers }, { label: 'Active', value: result.metrics?.activeCustomers }, { label: 'Inactive', value: result.metrics?.inactiveCustomers }, { label: 'Open deals', value: result.metrics?.customersWithOpenDeals }]}
    filters={[{ key: 'status', label: 'All statuses', options: ['ACTIVE', 'INACTIVE'].map((value) => ({ value, label: value })) }]}
    columns={[{ header: 'Customer', cell: (row) => row.name || row.companyName }, { header: 'Company', cell: (row) => row.companyName || '—' }, { header: 'Phone', cell: (row) => row.phone || '—' }, { header: 'Email', cell: (row) => row.email || '—' }, { header: 'Type', cell: (row) => row.customerType || '—' }, { header: 'Assigned', cell: (row) => personName(row.assignedEmployee) || row.assignedEmployee || '—' }, { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || (row.isActive === false ? 'inactive' : 'active')).toLowerCase()} /> }]}
    renderForm={(form, setForm) => <div className="grid gap-3 sm:grid-cols-2"><Field label="Name"><Input required value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="Company"><Input value={form.companyName || ''} onChange={(event) => setForm({ ...form, companyName: event.target.value })} /></Field><Field label="Phone"><Input required value={form.phone || ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field><Field label="Email"><Input value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field><Field label="Type"><Input value={form.customerType || ''} onChange={(event) => setForm({ ...form, customerType: event.target.value })} /></Field><Field label="Industry"><Input value={form.industry || ''} onChange={(event) => setForm({ ...form, industry: event.target.value })} /></Field><Field label="City"><Input value={form.city || ''} onChange={(event) => setForm({ ...form, city: event.target.value })} /></Field><Field label="Assigned employee"><select className="h-9 rounded-md border px-2 text-sm" value={form.assignedEmployeeId || ''} onChange={(event) => setForm({ ...form, assignedEmployeeId: event.target.value })}><option value="">Unassigned</option>{employees.map((employee) => <option key={employee.recordId} value={employee.recordId}>{employee.name}</option>)}</select></Field></div>}
    onSave={async (form, id) => { await saveCustomer(form, id); toast.success(id ? 'Customer updated' : 'Customer created'); }}
    detail={(row) => <CustomerDetail row={row} />}
  />;
}

function CustomerDetail({ row }) {
  const [related, setRelated] = React.useState({ deals: [], visits: [], activities: [] });
  const [error, setError] = React.useState('');
  React.useEffect(() => { customerRelations(row.id).then(setRelated).catch((err) => setError(crmError(err))); }, [row.id]);
  return <div className="space-y-3 text-sm"><p>{row.name} · {row.phone} · {row.email || 'No email'}</p><p>{row.address || ''} {row.city || ''}</p>{error && <p className="text-rose-600">{error}</p>}<p>Deals: {related.deals.length} · Visits: {related.visits.length} · Activities: {related.activities.length}</p>{related.deals.slice(0, 5).map((deal) => <p key={deal.id}>Deal {deal.title} · {deal.amount}</p>)}{related.visits.slice(0, 5).map((visit) => <p key={visit.id}>Visit {visit.purpose} · {String(visit.date || '').slice(0, 10)}</p>)}</div>;
}

function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
