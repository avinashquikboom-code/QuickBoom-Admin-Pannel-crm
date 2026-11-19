'use client';

import * as React from 'react';
import { Upload, FileText, Download, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { loadEmployees } from '@/modules/hrm/hrm-api';
import { captureError, importCsvLeads, previewCsvLeadFile, validateCsvLeadImport } from './capture-api';
import { toast } from '@/hooks/use-toast';

const LIMIT = 5 * 1024 * 1024;
const FIELDS = [
  ['title', 'Lead Name', false, ['lead name', 'name', 'title']],
  ['businessName', 'Company Name', false, ['business name', 'company name', 'company']],
  ['phone', 'Mobile Number', false, ['mobile', 'mobile number', 'phone', 'phone number', 'telephone']],
  ['email', 'Email Address', false, ['email', 'email address']],
  ['website', 'Website', false, ['website', 'web site', 'url']],
  ['address', 'Address', false, ['address', 'street address']],
  ['city', 'City', false, ['city']],
  ['state', 'State', false, ['state', 'province']],
  ['country', 'Country', false, ['country']],
  ['category', 'Category', false, ['category', 'industry']],
  ['source', 'Lead Source', false, ['source', 'lead source']],
];

const bodyOf = (payload) => payload?.data && typeof payload.data === 'object' ? payload.data : payload;
const autoMap = (headers = []) => Object.fromEntries(FIELDS.map(([key, , , aliases]) => {
  const found = headers.find((header) => aliases.includes(String(header).trim().toLowerCase()));
  return [key, found || ''];
}));

export function CsvLeadImportDialog({ open, onOpenChange, onImported }) {
  const [file, setFile] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const [mapping, setMapping] = React.useState({});
  const [employees, setEmployees] = React.useState([]);
  const [employeeId, setEmployeeId] = React.useState('');
  const [validation, setValidation] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [busy, setBusy] = React.useState('');
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    loadEmployees({ status: 'ACTIVE' }).then((rows) => setEmployees(rows.filter((row) => String(row.status).toLowerCase() === 'active' && row.userId != null))).catch(() => setEmployees([]));
  }, [open]);

  const reset = () => { setFile(null); setPreview(null); setMapping({}); setEmployeeId(''); setValidation(null); setResult(null); setBusy(''); };
  const close = (next) => { if (!next && busy) return; if (!next) reset(); onOpenChange(next); };
  const chooseFile = async (candidate) => {
    if (!candidate) return;
    if (!candidate.name.toLowerCase().endsWith('.csv') || candidate.size > LIMIT) {
      toast.error(candidate.size > LIMIT ? 'CSV file must be 5 MB or smaller.' : 'Choose a .csv file.');
      return;
    }
    setBusy('preview'); setResult(null); setValidation(null);
    try {
      const data = bodyOf(await previewCsvLeadFile(candidate));
      setFile(candidate); setPreview(data); setMapping(autoMap(data.headers));
    } catch (error) { toast.error(captureError(error)); }
    finally { setBusy(''); }
  };

  const validate = async () => {
    if (!file) return;
    if (!mapping.businessName && !mapping.title) { toast.error('Map a column to Lead Name or Company Name.'); return; }
    setBusy('validate');
    try { setValidation(bodyOf(await validateCsvLeadImport(file, mapping))); }
    catch (error) { toast.error(captureError(error)); }
    finally { setBusy(''); }
  };

  const runImport = async () => {
    if (!file || !validation || !employeeId) { toast.error('Select an active employee and validate the CSV first.'); return; }
    if (!validation.readyToImport) { toast.error('There are no valid non-duplicate rows to import.'); return; }
    const employee = employees.find((row) => String(row.recordId) === employeeId);
    const confirmed = window.confirm(`Confirm CSV import\nFile: ${file.name}\nTotal rows: ${validation.totalRows}\nValid rows: ${validation.validRows}\nDuplicate rows: ${validation.duplicateRows}\nInvalid rows: ${validation.invalidRows}\nExpected leads to import: ${validation.readyToImport}\nAssigned employee: ${employee?.name || 'the selected employee'} (${employee?.employeeCode || employee?.recordId})`);
    if (!confirmed) return;
    setBusy('import');
    try {
      const imported = bodyOf(await importCsvLeads(file, mapping, employeeId));
      setResult(imported); setValidation(null); onImported?.();
      toast.success(imported.message || 'CSV import completed.');
    } catch (error) { toast.error(captureError(error)); }
    finally { setBusy(''); }
  };

  const downloadSample = () => {
    const csv = [['Lead Name', 'Company Name', 'Mobile Number', 'Email Address', 'Website', 'Address', 'City', 'State', 'Country', 'Lead Source'], ['Riya Mehta', 'Mehta Foods', '+919876543210', 'riya@example.com', 'https://example.com', '12 MG Road', 'Pune', 'Maharashtra', 'India', 'CSV Import']];
    saveCsv('data-capture-sample.csv', csv);
  };
  const downloadErrors = () => {
    const errors = validation?.rowErrors || result?.rowResults || [];
    saveCsv('csv-import-errors.csv', [['Row', 'Status', 'Reason'], ...errors.map((row) => [row.rowNumber, row.duplicate ? 'DUPLICATE' : row.status || 'INVALID', (row.errors || []).join('; ')])]);
  };

  return <Dialog open={open} onOpenChange={close}>
    <DialogContent className="max-h-[92dvh] w-[min(960px,calc(100%-1rem))] max-w-none gap-3 overflow-y-auto p-4 sm:p-6" showCloseButton={!busy}>
      <DialogHeader><DialogTitle className="text-lg font-bold text-slate-900">Import CSV leads</DialogTitle><DialogDescription>Upload, map and validate records, then assign all imported leads to one active employee. Maximum 5 MB and 100 rows per import.</DialogDescription></DialogHeader>

      {!result ? <>
        <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files?.[0]); }} className={`rounded-xl border border-dashed p-5 text-center ${dragging ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300 bg-slate-50/60'}`}>
          <Upload className="mx-auto size-7 text-emerald-800" />
          <p className="mt-2 text-sm font-semibold">Drop a CSV here or browse files</p>
          <p className="mt-1 text-xs text-slate-500">CSV only · Maximum 5 MB · Up to 100 data rows</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={Boolean(busy)}>Browse CSV</Button>
            <Button type="button" variant="outline" onClick={downloadSample}><Download className="mr-1 size-4" />Sample CSV</Button>
          </div>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} />
        </div>
        {busy === 'preview' && <p className="text-sm text-slate-500">Reading and checking CSV structure…</p>}
        {file && preview && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white p-3 text-sm"><span className="flex items-center gap-2"><FileText className="size-4 text-emerald-800" />{file.name} · {(file.size / 1024).toFixed(1)} KB · {preview.totalRows} rows</span><Button variant="ghost" size="sm" onClick={reset} disabled={Boolean(busy)}><X className="mr-1 size-4" />Replace</Button></div>}

        {preview && !result && <>
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <section className="min-w-0 rounded-xl border bg-white p-3"><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold">Map CSV columns</h3><span className="text-xs text-slate-500">{preview.headers.length} columns</span></div><div className="grid gap-2 sm:grid-cols-2">{FIELDS.map(([key, label, required]) => <label key={key} className="grid gap-1 text-xs text-slate-600">{label}{required ? ' *' : ''}<select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm" value={mapping[key] || '__none'} onChange={(event) => { setMapping({ ...mapping, [key]: event.target.value === '__none' ? '' : event.target.value }); setValidation(null); }}><option value="__none">Not mapped</option>{preview.headers.map((header) => <option key={header} value={header}>{header}</option>)}</select></label>)}</div></section>
            <section className="rounded-xl border bg-white p-3"><h3 className="text-sm font-semibold">Assign leads to</h3><p className="mb-2 mt-1 text-xs text-slate-500">Choose an active employee in this workspace. No employee is selected by default.</p><select aria-label="Assign imported leads to employee" className="h-10 w-full rounded-md border border-slate-200 bg-white px-2 text-sm" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}><option value="">Select employee</option>{employees.map((employee) => <option key={employee.recordId} value={String(employee.recordId)}>{employee.name} · {employee.employeeCode || employee.recordId} · {employee.department || 'No department'} · {employee.status}</option>)}</select>{employees.length === 0 && <p className="mt-2 text-xs text-amber-700">No active, assignable employees were returned.</p>}</section>
          </div>
          <section className="overflow-hidden rounded-xl border bg-white"><div className="border-b bg-slate-50 px-3 py-2 text-xs font-semibold">Preview · first {preview.previewRows.length} of {preview.totalRows} rows</div><div className="max-h-52 overflow-auto"><table className="min-w-full text-left text-xs"><thead className="sticky top-0 bg-white"><tr><th className="px-3 py-2">Row</th>{preview.headers.map((header) => <th key={header} className="px-3 py-2">{header}</th>)}</tr></thead><tbody>{preview.previewRows.map((row) => <tr key={row.rowNumber} className="border-t"><td className="px-3 py-2">{row.rowNumber}</td>{preview.headers.map((_, index) => <td key={index} className="max-w-48 truncate px-3 py-2">{row.values[index] || '—'}</td>)}</tr>)}</tbody></table></div></section>
        </>}

        {validation && <section className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[['Total CSV Rows', validation.totalRows], ['Valid Rows', validation.validRows], ['Invalid Rows', validation.invalidRows], ['Duplicate Rows', validation.duplicateRows]].map(([label, value]) => <div key={label} className="rounded-lg bg-white p-2"><p className="text-[11px] text-slate-500">{label}</p><p className="text-lg font-bold">{value ?? 0}</p></div>)}</div><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm"><p className="font-semibold">Ready to import: {validation.readyToImport} lead(s)</p>{validation.rowErrors?.length > 0 && <Button variant="outline" size="sm" onClick={downloadErrors}><Download className="mr-1 size-4" />Download error report</Button>}</div></section>}

        <div className="flex flex-wrap justify-end gap-2 border-t pt-3"><Button variant="outline" onClick={() => close(false)} disabled={Boolean(busy)}>Cancel</Button>{preview && <Button variant="outline" onClick={validate} disabled={Boolean(busy) || (!mapping.businessName && !mapping.title)}>{busy === 'validate' ? 'Validating…' : 'Validate rows'}</Button>}{validation && <Button onClick={runImport} disabled={Boolean(busy) || !employeeId || !validation.readyToImport}>{busy === 'import' ? 'Importing…' : `Import ${validation.readyToImport} leads`}</Button>}</div>
      </> : <div className="space-y-4"><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-5 text-emerald-700" /><div><h3 className="font-semibold text-emerald-950">Import finished</h3><p className="mt-1 text-sm text-emerald-900">{result.message}</p></div></div></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[['Total rows', result.totalRows], ['Imported', result.imported], ['Duplicates', result.duplicateRows], ['Invalid / failed', Number(result.invalidRows || 0) + Number(result.failed || 0)]].map(([label, value]) => <div key={label} className="rounded-lg border p-3"><p className="text-xs text-slate-500">{label}</p><p className="text-xl font-bold">{value ?? 0}</p></div>)}</div><div className="text-xs text-slate-600">Assigned to {result.assignedEmployee?.employeeCode || 'selected employee'}. Imported records use the existing CRM Leads pipeline.</div>{result.rowResults?.length > 0 && <Button variant="outline" onClick={downloadErrors}><AlertTriangle className="mr-1 size-4" />Download skipped / failed rows</Button>}<div className="flex justify-end border-t pt-3"><Button onClick={() => close(false)}>Done</Button></div></div>}
    </DialogContent>
  </Dialog>;
}

function saveCsv(name, rows) {
  const safeCell = (value) => {
    const text = String(value ?? '').replace(/[\r\n]+/g, ' ');
    return `"${(/^[=+\-@\t]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`;
  };
  const output = rows.map((row) => row.map(safeCell).join(',')).join('\r\n');
  const blob = new Blob([output], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url);
}
