'use client';

import * as React from 'react';
import { Upload, FileText, Download, X, AlertTriangle, CheckCircle2, ArrowLeft, ArrowRight, FileSpreadsheet, LoaderCircle, Users, CircleCheck } from 'lucide-react';
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
  const [step, setStep] = React.useState(1);
  const [employeeSearch, setEmployeeSearch] = React.useState('');
  const inputRef = React.useRef(null);
  const importLock = React.useRef(false);

  React.useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    loadEmployees({ status: 'ACTIVE' }).then((rows) => setEmployees(rows.filter((row) => String(row.status).toLowerCase() === 'active' && row.userId != null))).catch(() => setEmployees([]));
  }, [open]);

  const reset = () => { setFile(null); setPreview(null); setMapping({}); setEmployeeId(''); setEmployeeSearch(''); setValidation(null); setResult(null); setBusy(''); setStep(1); if (inputRef.current) inputRef.current.value = ''; };
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
      setFile(candidate); setPreview(data); setMapping(autoMap(data.headers)); setValidation(null); setStep(2);
    } catch (error) { toast.error(captureError(error)); }
    finally { setBusy(''); }
  };

  const validate = async () => {
    if (!file) return;
    if (!mapping.businessName && !mapping.title) { toast.error('Map a column to Lead Name or Company Name.'); return; }
    setBusy('validate');
    try { setValidation(bodyOf(await validateCsvLeadImport(file, mapping))); setStep(4); }
    catch (error) { toast.error(captureError(error)); }
    finally { setBusy(''); }
  };

  const runImport = async () => {
    if (!file || !validation || !employeeId) { toast.error('Select an active employee and validate the CSV first.'); return; }
    if (!validation.readyToImport) { toast.error('There are no valid non-duplicate rows to import.'); return; }
    if (busy || importLock.current) return;
    importLock.current = true;
    setBusy('import');
    try {
      const imported = bodyOf(await importCsvLeads(file, mapping, employeeId));
      setResult(imported); setValidation(null); onImported?.();
      toast.success(imported.message || 'CSV import completed.');
    } catch (error) { toast.error(captureError(error)); }
    finally { importLock.current = false; setBusy(''); }
  };

  const downloadSample = () => {
    const csv = [['Lead Name', 'Company Name', 'Mobile Number', 'Email Address', 'Website', 'Address', 'City', 'State', 'Country', 'Lead Source'], ['Riya Mehta', 'Mehta Foods', '+919876543210', 'riya@example.com', 'https://example.com', '12 MG Road', 'Pune', 'Maharashtra', 'India', 'CSV Import']];
    saveCsv('data-capture-sample.csv', csv);
  };
  const downloadErrors = () => {
    const errors = validation?.rowErrors || result?.rowResults || [];
    saveCsv('csv-import-errors.csv', [['Row', 'Status', 'Reason'], ...errors.map((row) => [row.rowNumber, row.duplicate ? 'DUPLICATE' : row.status || 'INVALID', (row.errors || []).join('; ')])]);
  };

  const selectedEmployee = employees.find((row) => String(row.recordId) === employeeId);
  const filteredEmployees = employees.filter((employee) => {
    const haystack = [employee.name, employee.employeeCode, employee.recordId, employee.department].join(' ').toLowerCase();
    return haystack.includes(employeeSearch.trim().toLowerCase());
  });
  const hasNameMapping = Boolean(mapping.businessName || mapping.title);
  const resetValidationForMapping = (key, value) => {
    setMapping((current) => ({ ...current, [key]: value }));
    setValidation(null);
    setStep(2);
  };

  return <Dialog open={open} onOpenChange={close}>
    <DialogContent
      overlayClassName="z-[60] bg-slate-950/45 backdrop-blur-[1px] duration-300 motion-reduce:duration-0"
      className="fixed inset-y-0 right-0 left-auto top-0 z-[70] grid h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-none border-0 bg-white p-0 shadow-2xl outline-none sm:w-[75vw] lg:w-[640px] xl:w-[680px] sm:rounded-l-2xl data-open:animate-in data-open:slide-in-from-right data-open:fade-in-0 data-closed:animate-out data-closed:slide-out-to-right data-closed:fade-out-0 duration-300 motion-reduce:animate-none motion-reduce:transition-none"
      showCloseButton={false}
    >
      <DialogHeader className="relative flex-row items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#163A2E]"><FileSpreadsheet className="size-5" /></span>
          <div className="min-w-0">
            <DialogTitle className="text-base font-bold text-slate-900 sm:text-lg">Import CSV Leads</DialogTitle>
            <DialogDescription className="mt-1 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">Upload, map and validate records, then assign imported leads to an active employee.</DialogDescription>
          </div>
        </div>
        <button type="button" onClick={() => close(false)} disabled={Boolean(busy)} aria-label="Close CSV import drawer" className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"><X className="size-4" /></button>
      </DialogHeader>

      <main className="min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
        {!result ? <>
          <ol aria-label="CSV import steps" className="mb-5 grid grid-cols-4 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1.5 sm:gap-2 sm:p-2">
            {['Upload', 'Map fields', 'Assign', 'Review'].map((label, index) => {
              const number = index + 1; const active = step === number; const complete = step > number;
              return <li key={label} className={`flex min-w-0 items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[10px] font-semibold sm:gap-2 sm:px-2 sm:text-xs ${active ? 'bg-white text-[#163A2E] shadow-sm ring-1 ring-emerald-100' : complete ? 'text-emerald-800' : 'text-slate-400'}`}>
                <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] ${active ? 'bg-[#163A2E] text-white' : complete ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>{complete ? <CircleCheck className="size-3.5" /> : number}</span><span className="truncate">{label}</span>
              </li>;
            })}
          </ol>

          {step === 1 && <section className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-200 motion-reduce:animate-none">
            <StepHeading number="1" title="Upload CSV" description="Choose a CSV file to start. You can preview and map columns next." />
            <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files?.[0]); }} className={`rounded-2xl border border-dashed px-4 py-8 text-center transition-colors sm:px-6 ${dragging ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300 bg-slate-50/70 hover:border-emerald-400 hover:bg-emerald-50/40'}`}>
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-[#163A2E] shadow-sm ring-1 ring-slate-200"><Upload className="size-5" /></span>
              <p className="mt-4 text-sm font-semibold text-slate-900">Drop your CSV file here</p><p className="mt-1 text-xs text-slate-500">or browse from your device</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2"><Button type="button" onClick={() => inputRef.current?.click()} disabled={Boolean(busy)} className="bg-[#163A2E] text-white hover:bg-[#0f2e24]">Browse CSV</Button><Button type="button" variant="outline" onClick={downloadSample}><Download className="mr-1.5 size-4" />Download sample</Button></div>
              <p className="mt-4 text-[11px] text-slate-500">CSV only · Maximum 5 MB · Up to 100 data rows</p>
              <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} />
            </div>
            {file && preview && <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3"><span className="flex min-w-0 items-center gap-2 text-xs"><FileText className="size-4 shrink-0 text-emerald-800" /><span className="min-w-0"><span className="block truncate font-semibold text-slate-800">{file.name}</span><span className="text-slate-500">{(file.size / 1024).toFixed(1)} KB · {preview.totalRows} rows</span></span></span><Button type="button" variant="ghost" size="sm" onClick={reset} disabled={Boolean(busy)} className="shrink-0">Remove</Button></div>}
            {busy === 'preview' && <div role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />Reading and checking the CSV structure…</div>}
          </section>}

          {step === 2 && preview && <section className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200 motion-reduce:animate-none">
            <StepHeading number="2" title="Map CSV columns" description="Choose which CSV column matches each CRM field. Lead Name or Company Name is required." />
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <span className="flex min-w-0 items-center gap-2 text-xs sm:text-sm"><FileText className="size-4 shrink-0 text-[#163A2E]" /><span className="min-w-0"><span className="block truncate font-semibold text-slate-800">{file?.name}</span><span className="text-slate-500">{(file?.size / 1024).toFixed(1)} KB · {preview.totalRows} rows</span></span></span>
              <div className="flex shrink-0 gap-1"><Button variant="ghost" size="sm" onClick={reset} disabled={Boolean(busy)}><X className="mr-1 size-4" />Remove</Button><Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={Boolean(busy)}>Replace</Button></div>
              <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} />
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="grid grid-cols-1 gap-1 border-b bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 min-[420px]:grid-cols-[minmax(110px,.85fr)_minmax(0,1.15fr)] sm:px-4"><span>CRM field</span><span>CSV column</span></div>
              <div className="divide-y divide-slate-100 px-3 sm:px-4">
                {FIELDS.map(([key, label]) => {
                  const required = key === 'title' || key === 'businessName';
                  return <label key={key} className="grid min-w-0 grid-cols-1 items-center gap-1.5 py-2.5 min-[420px]:grid-cols-[minmax(110px,.85fr)_minmax(0,1.15fr)] sm:gap-3">
                    <span className="min-w-0 text-xs font-medium text-slate-700 sm:text-sm">{label}{required && <span className="ml-1 text-[10px] font-semibold text-emerald-800">Required*</span>}</span>
                    <select aria-label={`Map ${label} to CSV column`} className="h-10 min-w-0 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:text-sm" value={mapping[key] || '__none'} onChange={(event) => resetValidationForMapping(key, event.target.value === '__none' ? '' : event.target.value)}><option value="__none">Not mapped</option>{preview.headers.map((header) => <option key={header} value={header}>{header}</option>)}</select>
                  </label>;
                })}
              </div>
              <p className={`border-t px-3 py-2.5 text-xs sm:px-4 ${hasNameMapping ? 'bg-emerald-50/60 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{hasNameMapping ? 'Required lead identity is mapped.' : 'Map Lead Name or Company Name to continue.'} Optional fields can remain unmapped.</p>
            </div>
            <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-1 border-b bg-slate-50 px-3 py-2.5 sm:px-4"><h3 className="text-xs font-semibold text-slate-800 sm:text-sm">CSV preview</h3><span className="text-[11px] text-slate-500">First {preview.previewRows.length} of {preview.totalRows} rows</span></div>
              <div className="max-h-52 overflow-auto"><table className="min-w-full text-left text-xs"><thead className="sticky top-0 z-10 bg-white text-slate-500"><tr><th className="whitespace-nowrap px-3 py-2">Row</th>{preview.headers.map((header) => <th key={header} className="max-w-40 whitespace-nowrap px-3 py-2 font-medium">{header}</th>)}</tr></thead><tbody>{preview.previewRows.map((row) => <tr key={row.rowNumber} className="border-t border-slate-100"><td className="px-3 py-2 text-slate-500">{row.rowNumber}</td>{preview.headers.map((_, index) => <td key={index} className="max-w-40 truncate px-3 py-2 text-slate-700">{row.values[index] || '—'}</td>)}</tr>)}</tbody></table></div>
            </section>
          </section>}

          {step === 3 && <section className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200 motion-reduce:animate-none">
            <StepHeading number="3" title="Assign employee" description="Every imported lead will be assigned to the employee you select." />
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#163A2E]"><Users className="size-5" /></span><div><h3 className="text-sm font-semibold text-slate-900">Assign Leads To</h3><p className="mt-1 text-xs leading-5 text-slate-500">Search by employee name, ID or department. Only eligible active employees are listed.</p></div></div>
              <label className="mt-4 grid gap-1.5 text-xs font-medium text-slate-700">Search employees<input type="search" value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} placeholder="Search name, employee ID, department…" className="h-10 min-w-0 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
              <label className="mt-3 grid gap-1.5 text-xs font-medium text-slate-700">Employee <span className="text-rose-600">*</span><select aria-label="Assign imported leads to employee" className="h-11 min-w-0 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" value={employeeId} onChange={(event) => { setEmployeeId(event.target.value); setValidation(null); }}><option value="">Select an employee</option>{filteredEmployees.map((employee) => <option key={employee.recordId} value={String(employee.recordId)}>{employee.name} · {employee.employeeCode || employee.recordId}</option>)}</select></label>
              {employees.length === 0 && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">No active employees with an eligible account are available for assignment.</p>}
              {employees.length > 0 && filteredEmployees.length === 0 && <p className="mt-3 text-xs text-slate-500">No employees match that search.</p>}
              {selectedEmployee && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{selectedEmployee.name}</p><p className="mt-0.5 truncate text-xs text-slate-600">ID {selectedEmployee.employeeCode || selectedEmployee.recordId} · {selectedEmployee.department || 'No department'}</p></div><span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold capitalize text-emerald-800 ring-1 ring-emerald-100"><span className="size-1.5 rounded-full bg-emerald-600" />{selectedEmployee.status}</span></div>}
              <p className="mt-3 text-[11px] leading-5 text-slate-500">Assignment is checked again by the server when the import is submitted. No employee is selected by default.</p>
            </section>
          </section>}

          {step === 4 && validation && <section className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200 motion-reduce:animate-none">
            <StepHeading number="4" title="Validation summary" description="Review row results and assignment before importing valid records." />
            <div className="grid grid-cols-2 gap-2 min-[520px]:grid-cols-4">{[['Total Rows', validation.totalRows, 'text-slate-900'], ['Valid Rows', validation.validRows, 'text-emerald-800'], ['Invalid Rows', validation.invalidRows, 'text-rose-700'], ['Duplicate Rows', validation.duplicateRows, 'text-amber-700']].map(([label, value, color]) => <div key={label} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><p className="truncate text-[10px] font-medium text-slate-500 sm:text-xs">{label}</p><p className={`mt-1 text-xl font-bold ${color}`}>{value ?? 0}</p></div>)}</div>
            <div className="flex min-w-0 items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3"><CircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" /><div className="min-w-0 text-xs"><p className="font-semibold text-emerald-950">Ready to import {validation.readyToImport} lead(s)</p><p className="mt-1 break-words text-emerald-900">{file?.name} · assigned to {selectedEmployee?.name} ({selectedEmployee?.employeeCode || selectedEmployee?.recordId})</p></div></div>
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50 px-3 py-2.5 sm:px-4"><div><h3 className="text-xs font-semibold text-slate-900 sm:text-sm">Row validation</h3><p className="mt-0.5 text-[11px] text-slate-500">Invalid and duplicate rows will be skipped and reported.</p></div>{validation.rowErrors?.length > 0 && <Button variant="outline" size="sm" onClick={downloadErrors}><Download className="mr-1 size-4" />Error report</Button>}</div>
              {validation.rowErrors?.length > 0 ? <ul className="max-h-60 divide-y divide-slate-100 overflow-y-auto">{validation.rowErrors.map((row) => <li key={row.rowNumber} className="flex min-w-0 gap-3 px-3 py-2.5 text-xs sm:px-4"><span className="shrink-0 font-semibold text-slate-700">Row {row.rowNumber}</span><span className={`min-w-0 break-words ${row.duplicate ? 'text-amber-800' : 'text-rose-700'}`}>{(row.errors || []).join(' ')}</span><span className={`ml-auto shrink-0 text-[10px] font-semibold ${row.duplicate ? 'text-amber-700' : 'text-rose-700'}`}>{row.duplicate ? 'DUPLICATE' : 'INVALID'}</span></li>)}</ul> : <p className="p-4 text-xs text-emerald-800">All rows are valid and no duplicates were found.</p>}
            </section>
          </section>}
        </> : <section className="mx-auto max-w-lg space-y-4 py-6 animate-in fade-in slide-in-from-right-2 duration-200 motion-reduce:animate-none">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-700" /><div className="min-w-0"><h3 className="font-semibold text-emerald-950">Import finished</h3><p className="mt-1 break-words text-sm text-emerald-900">{result.message}</p></div></div></div>
          <div className="grid grid-cols-2 gap-2 min-[520px]:grid-cols-4">{[['Total rows', result.totalRows], ['Imported', result.imported], ['Duplicates', result.duplicateRows], ['Invalid / failed', Number(result.invalidRows || 0) + Number(result.failed || 0)]].map(([label, value]) => <div key={label} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3"><p className="truncate text-[10px] text-slate-500 sm:text-xs">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{value ?? 0}</p></div>)}</div>
          <p className="text-xs text-slate-600">Assigned to {result.assignedEmployee?.employeeCode || 'selected employee'}. Imported records use the existing CRM Leads pipeline.</p>
          {result.rowResults?.length > 0 && <Button variant="outline" onClick={downloadErrors}><AlertTriangle className="mr-1 size-4" />Download skipped / failed rows</Button>}
        </section>}
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
        {busy === 'import' && <div role="status" className="mb-3 flex items-center gap-2 text-xs font-medium text-[#163A2E]"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />Importing leads. Keep this drawer open…</div>}
        <div className="flex flex-col-reverse gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
          <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => close(false)} disabled={Boolean(busy)} className="min-h-10 flex-1 min-[420px]:flex-none">{result ? 'Close' : 'Cancel'}</Button>{!result && step > 1 && <Button type="button" variant="ghost" onClick={() => { setStep((value) => Math.max(1, value - 1)); setValidation(null); }} disabled={Boolean(busy)} className="min-h-10 flex-1 min-[420px]:flex-none"><ArrowLeft className="mr-1 size-4" />Back</Button>}</div>
          {result ? <Button type="button" onClick={() => close(false)} className="min-h-10 w-full bg-[#163A2E] text-white hover:bg-[#0f2e24] min-[420px]:w-auto">Done</Button> : step === 1 && file && preview ? <Button type="button" onClick={() => setStep(2)} disabled={Boolean(busy)} className="min-h-10 w-full bg-[#163A2E] text-white hover:bg-[#0f2e24] min-[420px]:w-auto">Continue to mapping<ArrowRight className="ml-2 size-4" /></Button> : step === 2 ? <Button type="button" onClick={() => setStep(3)} disabled={!hasNameMapping || Boolean(busy)} className="min-h-10 w-full bg-[#163A2E] text-white hover:bg-[#0f2e24] min-[420px]:w-auto">Continue to assignment<ArrowRight className="ml-2 size-4" /></Button> : step === 3 ? <Button type="button" onClick={validate} disabled={!file || !hasNameMapping || !employeeId || Boolean(busy)} className="min-h-10 w-full bg-[#163A2E] text-white hover:bg-[#0f2e24] min-[420px]:w-auto">{busy === 'validate' ? <><LoaderCircle className="mr-2 size-4 animate-spin motion-reduce:animate-none" />Validating…</> : <>Validate CSV<ArrowRight className="ml-2 size-4" /></>}</Button> : step === 4 ? <Button type="button" onClick={runImport} disabled={Boolean(busy) || !employeeId || !validation?.readyToImport} className="min-h-10 w-full bg-[#163A2E] text-white hover:bg-[#0f2e24] min-[420px]:w-auto">{busy === 'import' ? <><LoaderCircle className="mr-2 size-4 animate-spin motion-reduce:animate-none" />Importing…</> : `Import ${validation?.readyToImport || 0} Leads`}</Button> : <Button type="button" onClick={() => inputRef.current?.click()} disabled={Boolean(busy)} className="min-h-10 w-full bg-[#163A2E] text-white hover:bg-[#0f2e24] min-[420px]:w-auto">Choose CSV file<Upload className="ml-2 size-4" /></Button>}
        </div>
      </footer>
    </DialogContent>
  </Dialog>;
}

function StepHeading({ number, title, description }) {
  return <div className="flex items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-[#163A2E]">{number}</span><div className="min-w-0"><h2 className="text-sm font-semibold text-slate-900 sm:text-base">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">{description}</p></div></div>;
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
