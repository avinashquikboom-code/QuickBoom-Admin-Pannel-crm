'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { loadCommissionSettings, saveCommissionSetting } from '@/modules/suite/suite-api';

export default function CommissionSettingsPage() {
  const load = React.useCallback(() => loadCommissionSettings().then((rows) => ({ rows })), []);
  return <CrmScreen title="Commission Settings" description="Designation commission configuration." actionLabel="Save configuration" canCreate={false} load={load} blank={{ designationId: '', commissionEnabled: true, commissionType: 'PERCENTAGE', commissionRate: '' }}
    columns={[
      { header: 'Designation', cell: (row) => row.designationName || row.name || row.designationId },
      { header: 'Type', cell: (row) => row.commissionType || '—' },
      { header: 'Rate', cell: (row) => row.commissionRate ?? '—' },
      { header: 'Status', cell: (row) => <StatusBadge status={row.commissionEnabled ? 'active' : 'inactive'} /> },
    ]}
    renderForm={(form, setForm) => <div className="grid gap-3"><Field label="Designation ID"><Input required value={form.designationId || ''} onChange={(event) => setForm({ ...form, designationId: event.target.value })} /></Field><Field label="Rate"><Input type="number" min="0" required value={form.commissionRate ?? ''} onChange={(event) => setForm({ ...form, commissionRate: event.target.value })} /></Field><Field label="Type"><select className="h-9 rounded-md border px-2 text-sm" value={form.commissionType || 'PERCENTAGE'} onChange={(event) => setForm({ ...form, commissionType: event.target.value })}><option>PERCENTAGE</option><option>FIXED</option></select></Field></div>}
    onSave={async (form) => { await saveCommissionSetting(form); toast.success('Commission setting saved'); }}
  />;
}
function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
