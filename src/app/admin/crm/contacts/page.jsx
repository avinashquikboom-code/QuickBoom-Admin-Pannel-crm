'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { bulkDeleteContacts, crmError, loadCompanies, loadContacts, personName, removeContact, saveContact, sessionCan } from '@/modules/crm/crm-api';
import { PermanentDeleteDialog } from '@/components/common/PermanentDeleteDialog';
import { AdminBulkSelectionToolbar, AdminBulkDeleteButton } from '@/components/admin/bulk-selection';

const blank = { firstName: '', lastName: '', email: '', phone: '', designation: '', companyId: '', type: 'PROSPECT', status: 'ACTIVE' };

export default function ContactsRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [companies, setCompanies] = React.useState([]);
  const [pendingDelete, setPendingDelete] = React.useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [selectedContacts, setSelectedContacts] = React.useState([]);
  const clearSelectionRef = React.useRef(null);

  React.useEffect(() => { setAllowed(sessionCan('CONTACT') || sessionCan('CRM')); loadCompanies({ page: 1, limit: 100 }).then((result) => setCompanies(result.rows)).catch(() => setCompanies([])); }, []);
  const load = React.useCallback((query) => loadContacts({ page: query.page, limit: 20, search: query.search || undefined, status: query.status || undefined, type: query.type || undefined }), []);

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await removeContact(pendingDelete.id);
      toast.success(`Contact "${personName(pendingDelete)}" permanently deleted`);
      setPendingDelete(null);
      setRefreshToken((v) => v + 1);
    } catch (err) {
      toast.error(crmError(err));
    } finally {
      setDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (!selectedContacts.length || deleting) return;
    setDeleting(true);
    try {
      const ids = selectedContacts.map((c) => c.id);
      const res = await bulkDeleteContacts(ids, true);
      const count = res?.data?.deletedCount ?? res?.deletedCount ?? ids.length;
      toast.success(`${count} contacts permanently deleted`);
      clearSelectionRef.current?.();
      setSelectedContacts([]);
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
        title="Contacts"
        description="Contacts linked to companies through the contacts API."
        actionLabel="Add contact"
        canCreate={allowed}
        load={load}
        blank={blank}
        refreshToken={refreshToken}
        enableSelection={allowed}
        onSelectionChange={setSelectedContacts}
        toolbar={({ selected, clearSelection }) => {
          clearSelectionRef.current = clearSelection;
          if (!selected?.length || !allowed) return null;
          return (
            <AdminBulkSelectionToolbar
              count={selected.length}
              noun="contacts"
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
        filters={[{ key: 'type', label: 'All types', options: ['CUSTOMER', 'VENDOR', 'PARTNER', 'PROSPECT'].map((value) => ({ value, label: value })) }, { key: 'status', label: 'All statuses', options: ['ACTIVE', 'INACTIVE'].map((value) => ({ value, label: value })) }]}
        columns={[{ header: 'Name', cell: (row) => personName(row) }, { header: 'Email', cell: (row) => row.email || '—' }, { header: 'Phone', cell: (row) => row.phone || row.mobile || '—' }, { header: 'Designation', cell: (row) => row.designation || '—' }, { header: 'Company', cell: (row) => row.company?.name || '—' }, { header: 'Status', cell: (row) => <StatusBadge status={String(row.status || 'active').toLowerCase()} /> }]}
        renderForm={(form, setForm) => <div className="grid gap-3 sm:grid-cols-2"><Field label="First name"><Input required value={form.firstName || ''} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></Field><Field label="Last name"><Input required value={form.lastName || ''} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></Field><Field label="Email"><Input value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field><Field label="Phone"><Input value={form.phone || ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field><Field label="Designation"><Input value={form.designation || ''} onChange={(event) => setForm({ ...form, designation: event.target.value })} /></Field><Field label="Company"><select className="h-9 rounded-md border px-2 text-sm" value={form.companyId || ''} onChange={(event) => setForm({ ...form, companyId: event.target.value })}><option value="">None</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></Field><Field label="Type"><select className="h-9 rounded-md border px-2 text-sm" value={form.type || 'PROSPECT'} onChange={(event) => setForm({ ...form, type: event.target.value })}>{['CUSTOMER', 'VENDOR', 'PARTNER', 'PROSPECT'].map((type) => <option key={type}>{type}</option>)}</select></Field></div>}
        onSave={async (form, id) => { await saveContact(form, id); toast.success(id ? 'Contact updated' : 'Contact created'); }}
        rowActions={(reload) => allowed ? [{ label: 'Delete', onSelect: (row) => setPendingDelete(row) }] : []}
        detail={(row) => <p className="text-sm">{personName(row)} · {row.designation || 'No designation'} · {row.company?.name || 'No company'} · {row.email || 'No email'} · {row.phone || 'No phone'}</p>}
      />
      <PermanentDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        recordName={pendingDelete ? personName(pendingDelete) : ''}
        noun="contact"
        warningNote="Associated interaction records will be unlinked."
        loading={deleting}
        onConfirm={confirmDelete}
      />
      <PermanentDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        count={selectedContacts.length}
        noun="contact"
        warningNote="Selected contacts will be permanently removed from the system."
        loading={deleting}
        onConfirm={confirmBulkDelete}
      />
    </>
  );
}
function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
