'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FormDrawer } from '@/components/common/drawers/FormDrawer';
import { HrmNotice } from '@/modules/hrm/HrmNotice';
import { createRole, loadPermissions, loadRoles, removeRole, saveRolePermissions, suiteError } from '@/modules/suite/suite-api';
import { toast } from '@/hooks/use-toast';

export default function RolesPage() {
  const [roles, setRoles] = React.useState([]);
  const [permissions, setPermissions] = React.useState([]);
  const [selected, setSelected] = React.useState([]);
  const [role, setRole] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([loadRoles(), loadPermissions()]).then(([roleRows, permissionRows]) => { if (active) { setRoles(roleRows); setPermissions(permissionRows); setError(''); } }).catch((err) => { if (active) setError(suiteError(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  const grouped = permissions.reduce((groups, item) => { const key = item.module || 'OTHER'; groups[key] = groups[key] || []; groups[key].push(item); return groups; }, {});

  return <div className="mx-auto max-w-7xl space-y-6">
    <PageHeader title="Roles & Permissions" description="Roles and the permission catalog returned by the auth API." actions={<Button onClick={() => setOpen(true)}>Add role</Button>} />
    <HrmNotice loading={loading} error={error} empty={!loading && !roles.length ? 'No roles returned.' : ''} onRetry={() => setRefresh((value) => value + 1)}>
      <div className="overflow-x-auto"><DataTable label="Roles" data={roles} columns={[
        { header: 'Role', cell: (row) => row.name },
        { header: 'Type', cell: (row) => row.type || '—' },
        { header: 'Permissions', cell: (row) => row.permissionsCount ?? row.permissions?.length ?? '—' },
        { header: 'Users', cell: (row) => row.usersCount ?? '—' },
        { header: 'Status', cell: (row) => <StatusBadge status={row.isActive === false ? 'inactive' : 'active'} /> },
      ]} rowActions={[
        { label: 'Permissions', onSelect: (row) => { setRole(row); setSelected((row.permissions || []).map((item) => item.key || `${item.module}:${item.action}`)); } },
        { label: 'Delete', onSelect: async (row) => { if (!window.confirm(`Deactivate ${row.name}?`)) return; try { await removeRole(row.id); setRefresh((value) => value + 1); } catch (err) { toast.error(suiteError(err)); } } },
      ]} /></div>
    </HrmNotice>
    <FormDrawer open={open} onOpenChange={setOpen} title="Add role" description="Creates a role. Assign permissions after it appears in the list." onSubmit={async (event) => { event.preventDefault(); try { await createRole({ name, description }); setOpen(false); setName(''); setDescription(''); setRefresh((value) => value + 1); } catch (err) { toast.error(suiteError(err)); } }}>
      <div className="grid gap-3"><Input required placeholder="Role name" value={name} onChange={(event) => setName(event.target.value)} /><Input placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} /></div>
    </FormDrawer>
    <FormDrawer open={Boolean(role)} onOpenChange={(next) => { if (!next) setRole(null); }} title={role?.name || 'Permissions'} description="Selected permissions are saved with the role update API." onSubmit={async (event) => { event.preventDefault(); try { await saveRolePermissions(role.id, selected); setRole(null); setRefresh((value) => value + 1); toast.success('Permissions saved'); } catch (err) { toast.error(suiteError(err)); } }}>
      <div className="max-h-[60vh] space-y-3 overflow-y-auto">{Object.entries(grouped).map(([module, items]) => <div key={module}><p className="text-xs font-semibold">{module}</p><div className="mt-1 grid gap-1">{items.map((item) => { const key = item.key || `${item.module}:${item.action}`; return <label key={key} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selected.includes(key)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, key] : current.filter((value) => value !== key))} />{item.label || `${item.action}`}</label>; })}</div></div>)}</div>
    </FormDrawer>
  </div>;
}
