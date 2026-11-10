'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { DataTable } from '@/components/common/DataTable';
import { toast } from '@/hooks/use-toast';
import { HrmNotice } from '@/modules/hrm/HrmNotice';
import { crmError, loadLeadLimits, saveEmployeeLimit, saveRoleLimit, sessionCan } from '@/modules/crm/crm-api';

export default function LeadLimitsRoute() {
  const [rows, setRows] = React.useState([]);
  const [roles, setRoles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);
  const [allowed, setAllowed] = React.useState(false);
  const [role, setRole] = React.useState({ roleName: '', dailyLimit: '', monthlyLimit: '', isActive: true });
  React.useEffect(() => setAllowed(sessionCan('LEAD') || sessionCan('CRM')), []);
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    loadLeadLimits().then((result) => { if (active) { setRows(result.employees); setRoles(result.roles); setError(''); } }).catch((err) => { if (active) setError(crmError(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);
  const visible = rows.filter((row) => `${row.name} ${row.employeeCode} ${row.role}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="max-w-none min-w-0 w-full space-y-6">
    <PageHeader title="Lead Limits" description="Effective daily and monthly lead capacity returned by the lead-generation limit API. Remaining capacity is calculated by the backend." />
    <div className="flex gap-2"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee or role" className="max-w-xs" /><Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>Refresh</Button></div>
    {allowed && <form className="grid gap-2 rounded-xl border bg-white p-3 sm:grid-cols-5" onSubmit={async (event) => { event.preventDefault(); try { await saveRoleLimit(role); setRefresh((value) => value + 1); toast.success('Role limit saved'); } catch (err) { toast.error(crmError(err)); } }}><Input placeholder="Role name" value={role.roleName} onChange={(event) => setRole({ ...role, roleName: event.target.value })} required /><Input type="number" placeholder="Daily" value={role.dailyLimit} onChange={(event) => setRole({ ...role, dailyLimit: event.target.value })} required /><Input type="number" placeholder="Monthly" value={role.monthlyLimit} onChange={(event) => setRole({ ...role, monthlyLimit: event.target.value })} required /><Button type="submit">Save role limit</Button></form>}
    <HrmNotice loading={loading} error={error} empty={!loading && !visible.length ? 'No employee lead limits were returned.' : ''} onRetry={() => setRefresh((value) => value + 1)}>
      <DataTable label="Lead limits" data={visible} columns={[{ header: 'Employee', cell: (row) => `${row.name} · ${row.employeeCode || ''}` }, { header: 'Role', accessorKey: 'role' }, { header: 'Daily limit', accessorKey: 'effectiveDailyLimit' }, { header: 'Used today', accessorKey: 'usedToday' }, { header: 'Remaining today', accessorKey: 'remainingToday' }, { header: 'Monthly limit', accessorKey: 'effectiveMonthlyLimit' }, { header: 'Used this month', accessorKey: 'usedThisMonth' }, { header: 'Remaining', accessorKey: 'remainingThisMonth' }]} rowActions={allowed ? [{ label: 'Set custom limit', onSelect: async (row) => { const dailyLimit = window.prompt('Daily limit. Leave blank to clear.', row.customDailyLimit ?? ''); if (dailyLimit === null) return; const monthlyLimit = window.prompt('Monthly limit. Leave blank to clear.', row.customMonthlyLimit ?? ''); if (monthlyLimit === null) return; try { await saveEmployeeLimit(row.employeeId, { dailyLimit, monthlyLimit }); setRefresh((value) => value + 1); } catch (err) { toast.error(crmError(err)); } } }] : []} />
    </HrmNotice>
    <section className="rounded-xl border bg-white p-4 text-sm"><h2 className="font-semibold">Role limits</h2>{roles.map((item) => <p key={item.id || item.roleName} className="mt-2">{item.roleName || item.name} · daily {item.dailyLimit} · monthly {item.monthlyLimit} · {item.isActive === false ? 'Inactive' : 'Active'}</p>)}{!roles.length && <p className="mt-2 text-slate-500">No role limits returned.</p>}</section>
  </div>;
}
