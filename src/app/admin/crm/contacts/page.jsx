'use client';

import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Button } from '@/components/common/Button';
import { toast } from '@/hooks/use-toast';
import { CrmScreen } from '@/modules/crm/CrmScreen';
import { crmError, loadCompanies, loadContacts, personName, removeContact, saveContact, sessionCan, bulkDeleteContacts } from '@/modules/crm/crm-api';
import { PermanentDeleteDialog } from '@/components/common/PermanentDeleteDialog';
import { AdminBulkSelectionToolbar, AdminBulkDeleteButton } from '@/components/admin/bulk-selection';
import { Building2, CalendarDays, CircleAlert, ContactRound, FileSpreadsheet, Mail, Phone, Upload, UsersRound, X } from 'lucide-react';
import api from '../../../../../lib/api';

const CONTACT_TYPES = ['CUSTOMER', 'VENDOR', 'PARTNER', 'PROSPECT'];
const CONTACT_STATUSES = ['ACTIVE', 'INACTIVE'];
const blank = { firstName: '', lastName: '', email: '', phone: '', designation: '', companyId: '', type: 'PROSPECT', status: 'ACTIVE' };

export default function ContactsRoute() {
  const [allowed, setAllowed] = React.useState(false);
  const [companies, setCompanies] = React.useState([]);
  const [pendingDelete, setPendingDelete] = React.useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [selectedContacts, setSelectedContacts] = React.useState([]);
  const [importOpen, setImportOpen] = React.useState(false);
  const [importRows, setImportRows] = React.useState([]);
  const [importFileName, setImportFileName] = React.useState('');
  const [importError, setImportError] = React.useState('');
  const [importResult, setImportResult] = React.useState(null);
  const [importBusy, setImportBusy] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState(0);
  const inputRef = React.useRef(null);
  const clearSelectionRef = React.useRef(null);

  React.useEffect(() => {
    setAllowed(sessionCan('CONTACT') || sessionCan('CRM'));
    loadCompanies({ page: 1, limit: 100 }).then((result) => setCompanies(result.rows)).catch(() => setCompanies([]));
  }, []);

  const load = React.useCallback((query) => loadContacts({
    page: query.page,
    limit: 20,
    search: query.search || undefined,
    status: query.status || undefined,
    type: query.type || undefined,
  }), []);

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await removeContact(pendingDelete.id);
      toast.success(`Contact "${personName(pendingDelete)}" permanently deleted`);
      setPendingDelete(null);
      setRefreshToken((value) => value + 1);
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
      const ids = selectedContacts.map((contact) => contact.id);
      const result = await bulkDeleteContacts(ids, true);
      const count = result?.data?.deletedCount ?? result?.deletedCount ?? ids.length;
      toast.success(`${count} contacts permanently deleted`);
      clearSelectionRef.current?.();
      setSelectedContacts([]);
      setBulkDeleteOpen(false);
      setRefreshToken((value) => value + 1);
    } catch (err) {
      toast.error(crmError(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleFile = async (file) => {
    setImportError('');
    setImportResult(null);
    setImportRows([]);
    setImportFileName('');
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
      setImportError('Choose a CSV file to import contacts.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImportError('The CSV file must be 2 MB or smaller.');
      return;
    }
    try {
      const allCompanies = await loadAllCompanies();
      setCompanies(allCompanies);
      const parsed = parseContactCsv(await file.text(), allCompanies);
      if (!parsed.length) throw new Error('The CSV has a header row but no contact records.');
      if (parsed.length > 1000) throw new Error('Import up to 1,000 contact records per CSV file.');
      setImportRows(parsed);
      setImportFileName(file.name);
    } catch (error) {
      setImportError(error?.message || 'Could not read this CSV file.');
    }
  };

  const runImport = async () => {
    const validRows = importRows.filter((item) => !item.error);
    if (!validRows.length || importBusy) return;
    setImportBusy(true);
    setImportProgress(0);
    let created = 0;
    let duplicates = 0;
    let failed = importRows.filter((item) => item.error).length;
    const seen = new Set();
    const failures = importRows.filter((item) => item.error).slice(0, 3).map((item) => `Row ${item.rowNumber}: ${item.error}`);

    for (let index = 0; index < validRows.length; index += 1) {
      const item = validRows[index];
      const contact = item.contact;
      const emailKey = contact.email?.trim().toLowerCase();
      const phoneKey = (contact.phone || '').replace(/\D/g, '');
      const localKey = emailKey ? `email:${emailKey}` : phoneKey ? `phone:${phoneKey}` : '';
      try {
        if (localKey && seen.has(localKey)) {
          duplicates += 1;
        } else {
          if (localKey) seen.add(localKey);
          if (contact.email || contact.phone) {
            const duplicateResponse = await api.post('/contacts/check-duplicate', {
              email: contact.email || undefined,
              phone: contact.phone || undefined,
              companyId: contact.companyId || undefined,
            });
            const duplicateData = duplicateResponse?.data || duplicateResponse;
            if (duplicateData?.isDuplicate) {
              duplicates += 1;
            } else {
              await saveContact(contact);
              created += 1;
            }
          } else {
            await saveContact(contact);
            created += 1;
          }
        }
      } catch (error) {
        failed += 1;
        if (failures.length < 6) failures.push(`Row ${item.rowNumber}: ${crmError(error)}`);
      }
      setImportProgress(Math.round(((index + 1) / validRows.length) * 100));
    }

    const result = { created, duplicates, failed, failures };
    setImportResult(result);
    setImportBusy(false);
    if (created) setRefreshToken((value) => value + 1);
    if (created) toast.success(`${created} contact${created === 1 ? '' : 's'} imported`);
  };

  const closeImport = () => {
    if (importBusy) return;
    setImportOpen(false);
    setImportRows([]);
    setImportFileName('');
    setImportError('');
    setImportResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const openImport = () => {
    setImportOpen(true);
    setImportError('');
    setImportResult(null);
  };

  return (
    <>
      <CrmScreen
        appearance="contacts"
        collapsibleFilters
        title="Contacted"
        description="Contacts linked to companies through the contacts API."
        actionLabel="Add Contact"
        canCreate={allowed}
        extraHeaderActions={allowed ? <Button type="button" variant="outline" className="h-9 rounded-xl border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50" onClick={openImport}><Upload className="mr-2 size-4" />Import Contacts</Button> : null}
        load={load}
        blank={blank}
        refreshToken={refreshToken}
        enableSelection={allowed}
        onSelectionChange={setSelectedContacts}
        emptyState={({ onAdd }) => <ContactEmptyState onAdd={onAdd} onImport={openImport} allowed={allowed} />}
        stats={(result) => [
          { label: 'Total Contacted', value: result.metrics?.total ?? result.pagination?.total, icon: UsersRound, iconTone: 'bg-[#EAF7EF] text-[#173D30]' },
          { label: 'Companies', value: result.metrics?.companies, icon: Building2, iconTone: 'bg-sky-50 text-sky-700' },
          { label: 'Phone Contacts', value: result.metrics?.phoneContacts, icon: Phone, iconTone: 'bg-violet-50 text-violet-700' },
          { label: 'Email Contacts', value: result.metrics?.emailContacts, icon: Mail, iconTone: 'bg-amber-50 text-amber-700' },
        ]}
        filters={[
          { key: 'type', label: 'All contact types', options: CONTACT_TYPES.map((value) => ({ value, label: titleCase(value) })) },
          { key: 'status', label: 'All statuses', options: CONTACT_STATUSES.map((value) => ({ value, label: titleCase(value) })) },
        ]}
        columns={[
          { header: 'Contact Name', className: 'min-w-[190px]', cell: (row) => <ContactName row={row} /> },
          { header: 'Company', className: 'min-w-[170px]', cell: (row) => row.company?.name ? <span className="inline-flex items-center gap-2 text-sm text-slate-700"><Building2 className="size-3.5 shrink-0 text-slate-400" /><span className="max-w-[220px] truncate">{row.company.name}</span></span> : <span className="text-slate-400">—</span> },
          { header: 'Contact Type', className: 'min-w-[130px]', cell: (row) => <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{titleCase(row.type || 'PROSPECT')}</span> },
          { header: 'Phone', className: 'min-w-[150px]', cell: (row) => (row.phone || row.mobile) ? <a href={`tel:${row.phone || row.mobile}`} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-[#173D30]"><Phone className="size-3.5 text-slate-400" />{row.phone || row.mobile}</a> : <span className="text-slate-400">—</span> },
          { header: 'Email', className: 'min-w-[210px]', cell: (row) => row.email ? <a href={`mailto:${row.email}`} className="inline-flex max-w-[240px] items-center gap-2 text-sm text-slate-600 hover:text-[#173D30]"><Mail className="size-3.5 shrink-0 text-slate-400" /><span className="truncate">{row.email}</span></a> : <span className="text-slate-400">—</span> },
          { header: 'Status', className: 'min-w-[120px]', cell: (row) => <StatusBadge status={String(row.status || 'active').toLowerCase()} /> },
          { header: 'Created Date', className: 'min-w-[130px]', cell: (row) => <span className="text-sm text-slate-600">{formatDate(row.createdAt)}</span> },
        ]}
        renderForm={(form, setForm) => <div className="grid gap-3 sm:grid-cols-2"><Field label="First name"><Input required value={form.firstName || ''} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></Field><Field label="Last name"><Input required value={form.lastName || ''} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></Field><Field label="Email"><Input type="email" value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field><Field label="Phone"><Input value={form.phone || ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field><Field label="Designation"><Input value={form.designation || ''} onChange={(event) => setForm({ ...form, designation: event.target.value })} /></Field><Field label="Company"><select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={form.companyId || ''} onChange={(event) => setForm({ ...form, companyId: event.target.value })}><option value="">No company</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></Field><Field label="Type"><select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={form.type || 'PROSPECT'} onChange={(event) => setForm({ ...form, type: event.target.value })}>{CONTACT_TYPES.map((type) => <option key={type} value={type}>{titleCase(type)}</option>)}</select></Field><Field label="Status"><select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={form.status || 'ACTIVE'} onChange={(event) => setForm({ ...form, status: event.target.value })}>{CONTACT_STATUSES.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></Field></div>}
        onSave={async (form, id) => { await saveContact(form, id); toast.success(id ? 'Contact updated' : 'Contact created'); }}
        rowActions={() => allowed ? [{ label: 'Delete', onSelect: (row) => setPendingDelete(row) }] : []}
        detail={(row) => <ContactDetail row={row} />}
        toolbar={({ selected, clearSelection }) => {
          clearSelectionRef.current = clearSelection;
          if (!selected?.length || !allowed) return null;
          return <AdminBulkSelectionToolbar count={selected.length} noun="contacts" onClear={clearSelection}><AdminBulkDeleteButton count={selected.length} onClick={() => setBulkDeleteOpen(true)} loading={deleting} /></AdminBulkSelectionToolbar>;
        }}
      />

      <PermanentDeleteDialog open={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) setPendingDelete(null); }} recordName={pendingDelete ? personName(pendingDelete) : ''} noun="contact" warningNote="Associated interaction records will be unlinked." loading={deleting} onConfirm={confirmDelete} />
      <PermanentDeleteDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} count={selectedContacts.length} noun="contact" warningNote="Selected contacts will be permanently removed from the system." loading={deleting} onConfirm={confirmBulkDelete} />

      <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
      {importOpen && <ImportContactsDialog
        fileName={importFileName}
        rows={importRows}
        error={importError}
        result={importResult}
        busy={importBusy}
        progress={importProgress}
        onClose={closeImport}
        onChoose={() => inputRef.current?.click()}
        onImport={runImport}
      />}
    </>
  );
}

function ContactName({ row }) {
  const name = personName(row);
  const initials = `${row.firstName || ''} ${row.lastName || ''}`.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF7EF] text-xs font-bold text-[#173D30]">{initials || 'C'}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[#172033]">{name}</span>
        {row.designation && <span className="block truncate text-xs text-slate-400">{row.designation}</span>}
      </span>
    </span>
  );
}

function ContactDetail({ row }) {
  return <div className="space-y-4"><div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-[#F5FAF7] p-4"><ContactName row={row} /><StatusBadge status={String(row.status || 'active').toLowerCase()} /></div><div className="grid gap-3 sm:grid-cols-2"><Detail icon={Mail} label="Email" value={row.email} /><Detail icon={Phone} label="Phone" value={row.phone || row.mobile} /><Detail icon={Building2} label="Company" value={row.company?.name} /><Detail icon={CalendarDays} label="Created" value={formatDate(row.createdAt)} /></div>{row.designation && <p className="text-sm text-slate-600">{row.designation}</p>}</div>;
}

function Detail({ icon: Icon, label, value }) {
  return <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3"><p className="flex items-center gap-2 text-xs font-medium text-slate-500"><Icon className="size-3.5" />{label}</p><p className="mt-1.5 truncate text-sm font-medium text-slate-800">{value || '—'}</p></div>;
}

function ContactEmptyState({ onAdd, onImport, allowed }) {
  return <div className="rounded-2xl border border-dashed border-[#DCE8E0] bg-white px-5 py-12 text-center shadow-sm sm:py-16"><div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#EAF7EF] text-[#173D30]"><ContactRound className="size-8" aria-hidden="true" /></div><h2 className="mt-5 text-lg font-bold text-[#172033]">No contacted records found.</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">There are no contacts matching your current filters.</p>{allowed && <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row"><Button onClick={onAdd} className="h-10 rounded-xl bg-[#173D30] px-4 font-semibold text-white hover:bg-[#205541]">Add Contact</Button><Button variant="outline" onClick={onImport} className="h-10 rounded-xl border-slate-200 px-4 font-semibold"><Upload className="mr-2 size-4" />Import Contacts</Button></div>}</div>;
}

function ImportContactsDialog({ fileName, rows, error, result, busy, progress, onClose, onChoose, onImport }) {
  const validCount = rows.filter((item) => !item.error).length;
  const invalidCount = rows.length - validCount;
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="contact-import-title" className="flex max-h-[min(88vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 id="contact-import-title" className="text-lg font-bold text-[#172033]">Import Contacts</h2><p className="mt-1 text-sm text-slate-500">Import a CSV through the existing contacts API. Existing email or phone matches are skipped.</p></div><button type="button" onClick={onClose} disabled={busy} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close import"><X className="size-4" /></button></div>
      <div className="space-y-4 overflow-y-auto p-5 sm:p-6">
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-dashed border-emerald-200 bg-[#F5FAF7] p-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm"><FileSpreadsheet className="size-5" /></span><div><p className="text-sm font-semibold text-slate-800">Choose a CSV file</p><p className="text-xs text-slate-500">Up to 1,000 rows and 2 MB</p></div></div><div className="flex flex-wrap items-center gap-2"><a href={`data:text/csv;charset=utf-8,${encodeURIComponent('firstName,lastName,email,phone,companyName,designation,type,status\nJane,Doe,jane@example.com,+15551234567,Acme Inc,Manager,PROSPECT,ACTIVE')}`} download="contact-import-template.csv" className="rounded-lg px-3 py-2 text-xs font-semibold text-[#173D30] hover:bg-white">Download template</a><Button type="button" variant="outline" onClick={onChoose} disabled={busy} className="h-9 rounded-lg"><Upload className="mr-2 size-4" />Choose CSV</Button></div></div>
        {fileName && <p className="truncate text-xs font-medium text-slate-600">Selected: {fileName}</p>}
        {error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><CircleAlert className="mt-0.5 size-4 shrink-0" />{error}</p>}
        {rows.length > 0 && <div className="space-y-3"><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">{validCount} ready</span>{invalidCount > 0 && <span className="rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700">{invalidCount} need attention</span>}<span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">{rows.length} rows</span></div><div className="max-h-64 overflow-auto rounded-xl border border-slate-200"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-50 text-slate-500"><tr><th className="px-3 py-2.5">Row</th><th className="px-3 py-2.5">Contact</th><th className="px-3 py-2.5">Company</th><th className="px-3 py-2.5">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.slice(0, 100).map((item) => <tr key={item.rowNumber}><td className="px-3 py-2.5 text-slate-500">{item.rowNumber}</td><td className="px-3 py-2.5"><span className="block max-w-[180px] truncate font-medium text-slate-700">{`${item.contact.firstName} ${item.contact.lastName}`.trim()}</span><span className="block max-w-[180px] truncate text-slate-500">{item.contact.email || item.contact.phone || 'No email or phone'}</span></td><td className="max-w-[160px] truncate px-3 py-2.5 text-slate-600">{item.companyName || '—'}</td><td className="px-3 py-2.5">{item.error ? <span className="text-rose-700">{item.error}</span> : <span className="text-emerald-700">Ready</span>}</td></tr>)}</tbody></table>{rows.length > 100 && <p className="border-t bg-slate-50 p-2 text-center text-xs text-slate-500">Showing first 100 preview rows; all {rows.length} rows are included in the import.</p>}</div></div>}
        {busy && <div className="space-y-2" role="status"><div className="flex justify-between text-xs text-slate-600"><span>Importing contacts…</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#20C466] transition-[width] duration-200" style={{ width: `${progress}%` }} /></div></div>}
        {result && <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="grid grid-cols-3 gap-2 text-center">{[{ label: 'Created', value: result.created, color: 'text-emerald-700' }, { label: 'Duplicates', value: result.duplicates, color: 'text-amber-700' }, { label: 'Failed', value: result.failed, color: 'text-rose-700' }].map((item) => <div key={item.label}><p className="text-xl font-bold text-slate-800">{item.value}</p><p className={`text-xs font-medium ${item.color}`}>{item.label}</p></div>)}</div>{result.failures?.length > 0 && <ul className="max-h-24 list-disc space-y-1 overflow-auto pl-4 text-xs text-slate-600">{result.failures.map((message) => <li key={message}>{message}</li>)}</ul>}</div>}
      </div>
      <div className="flex flex-col-reverse justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:px-6"><p className="text-xs text-slate-500">Required columns: firstName and lastName (or name). Company names must match existing companies.</p><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={busy} className="rounded-lg">{result ? 'Done' : 'Cancel'}</Button>{!result && <Button type="button" onClick={onImport} disabled={busy || validCount === 0} className="rounded-lg bg-[#173D30] font-semibold text-white hover:bg-[#205541]">{busy ? 'Importing…' : `Import ${validCount || ''} Contacts`}</Button>}</div></div>
    </section>
  </div>;
}

async function loadAllCompanies() {
  const first = await loadCompanies({ page: 1, limit: 100 });
  const companies = [...(first.rows || [])];
  const totalPages = Number(first.pagination?.totalPages || first.pagination?.meta?.totalPages || 1);
  for (let page = 2; page <= Math.min(totalPages, 100); page += 1) {
    const next = await loadCompanies({ page, limit: 100 });
    companies.push(...(next.rows || []));
  }
  return companies;
}

function parseContactCsv(text, companies) {
  const records = parseCsv(text);
  if (!records.length) return [];
  const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const headers = records.shift().map(normalize);
  const indexOf = (...names) => headers.findIndex((header) => names.includes(header));
  const nameIndex = indexOf('name', 'contactname', 'fullname');
  const firstIndex = indexOf('firstname', 'first', 'givenname');
  const lastIndex = indexOf('lastname', 'last', 'surname', 'familyname');
  if (firstIndex < 0 && nameIndex < 0) throw new Error('Add a firstName/lastName or name column to the CSV.');
  const fieldIndexes = {
    email: indexOf('email', 'emailaddress'),
    phone: indexOf('phone', 'phonenumber', 'mobile', 'mobilephone'),
    companyName: indexOf('company', 'companyname', 'account', 'accountname'),
    companyId: indexOf('companyid'),
    designation: indexOf('designation', 'jobtitle', 'title'),
    type: indexOf('type', 'contacttype'),
    status: indexOf('status', 'contactstatus'),
    notes: indexOf('notes', 'description'),
  };
  const companyByName = new Map();
  companies.forEach((company) => {
    const key = normalize(company.name);
    if (!companyByName.has(key)) companyByName.set(key, []);
    companyByName.get(key).push(company);
  });

  return records.filter((row) => row.some((cell) => String(cell || '').trim())).map((row, offset) => {
    const rawName = nameIndex >= 0 ? String(row[nameIndex] || '').trim() : '';
    const nameParts = rawName.split(/\s+/).filter(Boolean);
    const firstName = String(firstIndex >= 0 ? row[firstIndex] || '' : nameParts.shift() || '').trim();
    const lastName = String(lastIndex >= 0 ? row[lastIndex] || '' : nameParts.join(' ')).trim();
    const get = (key) => fieldIndexes[key] >= 0 ? String(row[fieldIndexes[key]] || '').trim() : '';
    const companyName = get('companyName');
    const requestedCompanyId = get('companyId');
    let companyId = '';
    let error = '';
    if (!firstName || !lastName) error = 'First and last name are required.';
    const email = get('email');
    if (!error && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error = 'Email address is invalid.';
    if (!error && requestedCompanyId) {
      const match = companies.find((company) => String(company.id) === requestedCompanyId);
      if (!match) error = 'Company ID does not match an available company.';
      else companyId = String(match.id);
    } else if (!error && companyName) {
      const matches = companyByName.get(normalize(companyName)) || [];
      if (matches.length === 1) companyId = String(matches[0].id);
      else error = matches.length > 1 ? 'Company name is ambiguous; use companyId.' : 'Company was not found.';
    }
    const type = get('type').toUpperCase() || 'PROSPECT';
    const status = get('status').toUpperCase() || 'ACTIVE';
    if (!error && !CONTACT_TYPES.includes(type)) error = `Unsupported contact type: ${type}.`;
    if (!error && !CONTACT_STATUSES.includes(status)) error = `Unsupported status: ${status}.`;
    return {
      rowNumber: offset + 2,
      companyName,
      error,
      contact: {
        firstName,
        lastName,
        email: email || undefined,
        phone: get('phone') || undefined,
        designation: get('designation') || undefined,
        companyId: companyId || undefined,
        type,
        status,
        notes: get('notes') || undefined,
      },
    };
  });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  const input = String(text || '').replace(/^\uFEFF/, '');
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === '"') {
      if (quoted && input[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(value); value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[index + 1] === '\n') index += 1;
      row.push(value); rows.push(row); row = []; value = '';
    } else value += char;
  }
  if (quoted) throw new Error('The CSV contains an unclosed quoted value.');
  if (value.length || row.length) { row.push(value); rows.push(row); }
  return rows;
}

function titleCase(value) {
  return String(value || '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function Field({ label, children }) { return <Label className="grid gap-1 text-xs">{label}{children}</Label>; }
