'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { bulkDeleteCompanies, crmError, loadCompanies, removeCompany, saveCompany, sessionCan } from '@/modules/crm/crm-api';
import { PermanentDeleteDialog } from '@/components/common/PermanentDeleteDialog';
import { AdminBulkSelectionToolbar, AdminBulkDeleteButton } from '@/components/admin/bulk-selection';

const blank = { name: '', industry: '', website: '', email: '', phone: '', address: '', city: '', state: '', status: 'ACTIVE', notes: '' };

export default function CompaniesRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [selectedCompanies, setSelectedCompanies] = React.useState([]);
  const clearSelectionRef = React.useRef(null);

  React.useEffect(() => setAllowed(sessionCan('COMPANY') || sessionCan('CRM')), []);
  const load = React.useCallback((query) => loadCompanies({ page: query.page, limit: 20, search: query.search || undefined, status: query.status || undefined, industry: query.industry || undefined }), []);

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await removeCompany(pendingDelete.id);
      toast.success(`Company "${pendingDelete.name}" permanently deleted`);
      setPendingDelete(null);
      setRefreshToken((v) => v + 1);
    } catch (err) {
      toast.error(crmError(err));
    } finally {
      setDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (!selectedCompanies.length || deleting) return;
    setDeleting(true);
    try {
      const ids = selectedCompanies.map((c) => c.id);
      const res = await bulkDeleteCompanies(ids, true);
      const count = res?.data?.deletedCount ?? res?.deletedCount ?? ids.length;
      toast.success(`${count} companies permanently deleted`);
      clearSelectionRef.current?.();
      setSelectedCompanies([]);
      setBulkDeleteOpen(false);
      setRefreshToken((v) => v + 1);
    } catch (err) {
      toast.error(crmError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <CrmScreen
        title="Companies"
        description="Companies returned by the companies API."
        actionLabel="Add company"
        canCreate={allowed}
        load={load}
        blank={blank}
        refreshToken={refreshToken}
        enableSelection={allowed}
        onSelectionChange={setSelectedCompanies}
        toolbar={({ selected, clearSelection }) => {
          clearSelectionRef.current = clearSelection;
          if (!selected?.length || !allowed) return null;
          return (
            <AdminBulkSelectionToolbar
              count={selected.length}
              noun="companies"
              onClear={clearSelection}
            >
              <AdminBulkDeleteButton
                count={selected.length}
                onClick={() => setBulkDeleteOpen(true)}
                loading={deleting}
              />
            </AdminBulkSelectionToolbar>
          );
        }}
        filters={[{ key: 'status', label: 'All statuses', options: ['ACTIVE', 'INACTIVE'].map((value) => ({ value, label: value })) }]}
        columns={[{ header: 'Company', accessorKey: 'name' }, { header: 'Industry', cell: (row) => row.industry || '—' }, { header: 'Website', cell: (row) => row.website || row.domain || '—' }, { header: 'Email', cell: (row) => row.email || '—' }, { header: 'Phone', cell: (row) => row.phone || '—' }, { header: 'City', cell: (row) => row.city || '—' }, { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || 'active').toLowerCase()} /> }]}
        renderForm={(form, setForm) => <div className="grid gap-3 sm:grid-cols-2">{['name', 'industry', 'website', 'email', 'phone', 'address', 'city', 'state'].map((key) => <Field key={key} label={key}><Input required={key === 'name'} value={form[key] || ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></Field>)}</div>}
        onSave={async (form, id) => { await saveCompany(form, id); toast.success(id ? 'Company updated' : 'Company created'); }}
        rowActions={(reload) => allowed ? [{ label: 'Delete', onSelect: (row) => setPendingDelete(row) }] : []}
        detail={(row) => <div className="space-y-1 text-sm"><p>{row.name}</p><p>{row.industry || 'No industry'} · {row.website || 'No website'}</p><p>{row.address || ''} {row.city || ''} {row.state || ''}</p><p>{row.email || 'No email'} · {row.phone || 'No phone'}</p><p>Contacts and deals are available on the contact and deal records that reference this company.</p></div>}
      />
      <PermanentDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        recordName={pendingDelete?.name}
        noun="company"
        warningNote="Linked contacts and deals will be unlinked from this company."
        loading={deleting}
        onConfirm={confirmDelete}
      />
      <PermanentDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        count={selectedCompanies.length}
        noun="company"
        warningNote="Selected companies will be removed. All linked contacts and deals will be safely unlinked."
        loading={deleting}
        onConfirm={confirmBulkDelete}
      />
    </>
  );
}
function Field({ label, children }) { return <Label className="grid gap-1 text-xs capitalize">{label}{children}</Label>; }
