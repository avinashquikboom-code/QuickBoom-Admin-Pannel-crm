'use client';

import * as React from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  History,
  Printer,
  Settings2,
  X,
} from 'lucide-react';
import {
  countMatchingExportRecords,
  executeExportDownload,
  executeZipBundleDownload,
  fetchExportHistory,
  fetchExportSchemas,
  generatePdfPreviewUrl,
  triggerBlobDownload,
} from '@/lib/export/export-client';
import { toast } from '@/hooks/use-toast';

export function GlobalExport({
  module,
  title,
  filters = {},
  selectedIds = [],
  currentPageRows = [],
  customColumns = null,
  customSummary = null,
  page = 1,
  limit = 20,
  supportsZip = false,
  className = '',
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [configOpen, setConfigOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [previewState, setPreviewState] = React.useState(null); // { blob, blobUrl, filename }

  const [busy, setBusy] = React.useState(false);
  const [schemas, setSchemas] = React.useState([]);
  const [historyRows, setHistoryRows] = React.useState([]);
  const [matchingCount, setMatchingCount] = React.useState(null);

  // Configuration state
  const [format, setFormat] = React.useState('pdf');
  const [scope, setScope] = React.useState('ALL_FILTERED');
  const [orientation, setOrientation] = React.useState('landscape');
  const [includeSummary, setIncludeSummary] = React.useState(true);
  const [includeBranding, setIncludeBranding] = React.useState(true);
  const [includeFilters, setIncludeFilters] = React.useState(true);
  const [dateFrom, setDateFrom] = React.useState(filters.fromDate || filters.dateFrom || '');
  const [dateTo, setDateTo] = React.useState(filters.toDate || filters.dateTo || '');
  const [columnsState, setColumnsState] = React.useState([]);

  const menuRef = React.useRef(null);

  React.useEffect(() => {
    const onOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const activeSchema = React.useMemo(
    () => schemas.find((s) => s.module === module) || null,
    [schemas, module],
  );

  const openConfigModal = async () => {
    setMenuOpen(false);
    setConfigOpen(true);
    setDateFrom(filters.fromDate || filters.dateFrom || '');
    setDateTo(filters.toDate || filters.dateTo || '');
    try {
      const [schemaList, count] = await Promise.all([
        schemas.length ? Promise.resolve(schemas) : fetchExportSchemas(),
        countMatchingExportRecords(module, filters).catch(() => null),
      ]);
      if (!schemas.length) setSchemas(schemaList);
      setMatchingCount(count);
      const found = schemaList.find((s) => s.module === module);
      const cols = customColumns || found?.columns || [];
      setColumnsState(cols.map((c) => ({ ...c, selected: true })));
      if (found?.defaultOrientation) setOrientation(found.defaultOrientation);
    } catch {
      // Non-blocking
    }
  };

  const openHistoryModal = async () => {
    setMenuOpen(false);
    setHistoryOpen(true);
    try {
      const rows = await fetchExportHistory();
      setHistoryRows(rows);
    } catch {
      setHistoryRows([]);
    }
  };

  const buildPayload = (overrideFormat, overrideScope) => {
    const chosenFormat = overrideFormat || format;
    const chosenScope = overrideScope || scope;
    const mergedFilters = {
      ...filters,
      ...(dateFrom ? { fromDate: dateFrom } : {}),
      ...(dateTo ? { toDate: dateTo } : {}),
    };
    const selectedColumnKeys = columnsState.length
      ? columnsState.filter((c) => c.selected).map((c) => c.key)
      : undefined;

    return {
      module,
      format: chosenFormat,
      scope: chosenScope,
      selectedIds: chosenScope === 'SELECTED' ? selectedIds : undefined,
      columns: selectedColumnKeys,
      orientation,
      includeSummary,
      includeBranding,
      includeFilters,
      filters: mergedFilters,
      page,
      limit,
      customTitle: title,
      customColumns: customColumns || undefined,
      customRows: customColumns && chosenScope === 'CURRENT_PAGE' ? currentPageRows : undefined,
      customSummary: customSummary || undefined,
    };
  };

  const handleQuickExport = async (fmt) => {
    setMenuOpen(false);
    if (busy) return;
    setBusy(true);
    try {
      const payload = buildPayload(fmt, selectedIds.length > 0 ? 'SELECTED' : 'ALL_FILTERED');
      if (fmt === 'print') {
        const preview = await generatePdfPreviewUrl(payload);
        setPreviewState(preview);
      } else {
        const res = await executeExportDownload(payload);
        toast.success(`Exported ${res.filename}`);
      }
    } catch (err) {
      toast.error(err?.message || 'Export failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleZipDownload = async () => {
    setMenuOpen(false);
    if (!selectedIds.length) {
      toast.error('Select at least one record to download as ZIP.');
      return;
    }
    setBusy(true);
    try {
      const res = await executeZipBundleDownload(module, selectedIds);
      toast.success(`Downloaded ${res.filename}`);
    } catch (err) {
      toast.error(err?.message || 'ZIP export failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfiguredSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const payload = buildPayload(format === 'print' ? 'pdf' : format, scope);
      if (format === 'print' || format === 'pdf_preview') {
        const preview = await generatePdfPreviewUrl(payload);
        setConfigOpen(false);
        setPreviewState(preview);
      } else {
        const res = await executeExportDownload(payload);
        toast.success(`Exported ${res.filename}`);
        setConfigOpen(false);
      }
    } catch (err) {
      toast.error(err?.message || 'Export failed.');
    } finally {
      setBusy(false);
    }
  };

  const moveColumn = (index, dir) => {
    setColumnsState((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <div ref={menuRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        disabled={busy}
        onClick={() => setMenuOpen((prev) => !prev)}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#E2E8E5] bg-white px-3.5 text-xs font-semibold text-[#142D25] shadow-xs transition hover:border-[#123D32]/40 hover:bg-[#F3F8F5] disabled:opacity-60"
      >
        <Download className="size-3.5 text-[#123D32]" />
        <span>{busy ? 'Exporting...' : 'Export'}</span>
        {selectedIds.length > 0 ? (
          <span className="rounded-full bg-[#123D32] px-1.5 py-0.5 text-[10px] font-bold text-white">
            {selectedIds.length}
          </span>
        ) : null}
        <ChevronDown className="size-3.5 text-[#64748B]" />
      </button>

      {menuOpen ? (
        <div className="absolute right-0 z-50 mt-1.5 w-60 overflow-hidden rounded-xl border border-[#E2E8E5] bg-white py-1.5 shadow-xl">
          <button
            type="button"
            onClick={() => handleQuickExport('pdf')}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-[#142D25] hover:bg-[#F3F8F5]"
          >
            <FileText className="size-4 text-rose-600" />
            Export PDF
          </button>
          <button
            type="button"
            onClick={() => handleQuickExport('xlsx')}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-[#142D25] hover:bg-[#F3F8F5]"
          >
            <FileSpreadsheet className="size-4 text-emerald-700" />
            Export Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => handleQuickExport('csv')}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-[#142D25] hover:bg-[#F3F8F5]"
          >
            <Download className="size-4 text-[#123D32]" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => handleQuickExport('print')}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-[#142D25] hover:bg-[#F3F8F5]"
          >
            <Printer className="size-4 text-slate-600" />
            Preview &amp; Print PDF
          </button>
          {supportsZip || activeSchema?.supportsZip ? (
            <button
              type="button"
              onClick={handleZipDownload}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-[#142D25] hover:bg-[#F3F8F5]"
            >
              <FolderArchive className="size-4 text-amber-600" />
              Download Selected as ZIP
            </button>
          ) : null}
          <div className="my-1 border-t border-[#E2E8E5]" />
          <button
            type="button"
            onClick={openConfigModal}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-semibold text-[#123D32] hover:bg-[#F3F8F5]"
          >
            <Settings2 className="size-4" />
            Configure Export...
          </button>
          <button
            type="button"
            onClick={openHistoryModal}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-[#64748B] hover:bg-[#F3F8F5]"
          >
            <History className="size-4" />
            Export History
          </button>
        </div>
      ) : null}

      {/* Export Configuration Modal */}
      {configOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleConfiguredSubmit}
            className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#E2E8E5] bg-[#F3F8F5] px-5 py-3.5">
              <div>
                <h3 className="text-sm font-bold text-[#142D25]">Configure Export</h3>
                <p className="text-xs text-[#64748B]">
                  {matchingCount !== null
                    ? `${matchingCount.toLocaleString('en-IN')} matching records available`
                    : 'Customize format, scope, columns, and PDF layout'}
                </p>
              </div>
              <button type="button" onClick={() => setConfigOpen(false)} className="rounded-lg p-1 text-[#64748B] hover:bg-white">
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="font-semibold text-[#142D25]">Export Format</span>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#E2E8E5] bg-white px-2.5 text-xs outline-none focus:border-[#123D32]"
                  >
                    <option value="pdf">PDF Document (.pdf)</option>
                    <option value="xlsx">Excel Workbook (.xlsx)</option>
                    <option value="csv">UTF-8 CSV (.csv)</option>
                    <option value="print">PDF Preview &amp; Print</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="font-semibold text-[#142D25]">Record Scope</span>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#E2E8E5] bg-white px-2.5 text-xs outline-none focus:border-[#123D32]"
                  >
                    <option value="ALL_FILTERED">All Filtered Records ({matchingCount ?? 'All'})</option>
                    {selectedIds.length > 0 ? (
                      <option value="SELECTED">Selected Records ({selectedIds.length})</option>
                    ) : null}
                    <option value="CURRENT_PAGE">Current Page Only</option>
                    <option value="ALL_AUTHORIZED">All Authorized Records</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="font-semibold text-[#142D25]">From Date</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#E2E8E5] px-2.5 text-xs outline-none focus:border-[#123D32]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-[#142D25]">To Date</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#E2E8E5] px-2.5 text-xs outline-none focus:border-[#123D32]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-[#142D25]">PDF Orientation</span>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#E2E8E5] bg-white px-2.5 text-xs outline-none focus:border-[#123D32]"
                  >
                    <option value="landscape">Landscape (Wide)</option>
                    <option value="portrait">Portrait</option>
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap gap-4 rounded-xl border border-[#E2E8E5] bg-[#F8FAF9] px-3.5 py-2.5">
                <label className="inline-flex items-center gap-2 font-medium text-[#142D25]">
                  <input type="checkbox" checked={includeSummary} onChange={(e) => setIncludeSummary(e.target.checked)} className="accent-[#123D32]" />
                  Report Summary
                </label>
                <label className="inline-flex items-center gap-2 font-medium text-[#142D25]">
                  <input type="checkbox" checked={includeBranding} onChange={(e) => setIncludeBranding(e.target.checked)} className="accent-[#123D32]" />
                  Company Branding
                </label>
                <label className="inline-flex items-center gap-2 font-medium text-[#142D25]">
                  <input type="checkbox" checked={includeFilters} onChange={(e) => setIncludeFilters(e.target.checked)} className="accent-[#123D32]" />
                  Applied Filters &amp; Timestamp
                </label>
              </div>

              {columnsState.length > 0 ? (
                <div className="space-y-1.5">
                  <span className="font-semibold text-[#142D25]">Columns &amp; Order</span>
                  <div className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-[#E2E8E5]">
                    {columnsState.map((col, idx) => (
                      <div key={col.key} className="flex items-center justify-between px-3 py-1.5">
                        <label className="flex items-center gap-2 font-medium text-[#142D25]">
                          <input
                            type="checkbox"
                            checked={col.selected}
                            onChange={() =>
                              setColumnsState((prev) =>
                                prev.map((c, i) => (i === idx ? { ...c, selected: !c.selected } : c)),
                              )
                            }
                            className="accent-[#123D32]"
                          />
                          {col.label}
                        </label>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => moveColumn(idx, -1)} className="rounded p-1 text-slate-500 hover:bg-slate-100">
                            <ArrowUp className="size-3" />
                          </button>
                          <button type="button" onClick={() => moveColumn(idx, 1)} className="rounded p-1 text-slate-500 hover:bg-slate-100">
                            <ArrowDown className="size-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#E2E8E5] bg-[#F8FAF9] px-5 py-3">
              <button
                type="button"
                onClick={() => setConfigOpen(false)}
                className="rounded-xl border border-[#E2E8E5] bg-white px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#142D25]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#123D32] px-4 py-2 text-xs font-semibold text-white hover:bg-[#176B50] disabled:opacity-60"
              >
                <Check className="size-3.5" />
                {busy ? 'Generating...' : 'Generate Export'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* PDF Preview & Print Modal */}
      {previewState ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
          <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E2E8E5] bg-[#F3F8F5] px-5 py-3">
              <span className="text-sm font-bold text-[#142D25]">PDF Preview — {previewState.filename}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const frame = document.getElementById('qb-pdf-preview-frame');
                    frame?.contentWindow?.print();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8E5] bg-white px-3 py-1.5 text-xs font-semibold text-[#142D25] hover:bg-slate-50"
                >
                  <Printer className="size-3.5" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => triggerBlobDownload(previewState.blob, previewState.filename)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#123D32] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#176B50]"
                >
                  <Download className="size-3.5" />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(previewState.blobUrl);
                    setPreviewState(null);
                  }}
                  className="rounded-lg p-1.5 text-[#64748B] hover:bg-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <iframe
              id="qb-pdf-preview-frame"
              src={previewState.blobUrl}
              title="PDF Export Preview"
              className="h-full w-full flex-1 bg-slate-100"
            />
          </div>
        </div>
      ) : null}

      {/* Export History Modal */}
      {historyOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E2E8E5] bg-[#F3F8F5] px-5 py-3.5">
              <h3 className="text-sm font-bold text-[#142D25]">Recent Export History</h3>
              <button type="button" onClick={() => setHistoryOpen(false)} className="rounded-lg p-1 text-[#64748B] hover:bg-white">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {historyRows.length === 0 ? (
                <p className="py-10 text-center text-xs text-[#64748B]">No recent exports recorded in this session.</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8E5] text-[11px] uppercase text-[#64748B]">
                      <th className="py-2 pr-3">Report</th>
                      <th className="py-2 px-2">Format</th>
                      <th className="py-2 px-2">Records</th>
                      <th className="py-2 px-2">Size</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 pl-2 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyRows.map((h) => (
                      <tr key={h.jobId}>
                        <td className="py-2 pr-3 font-medium text-[#142D25]">{h.reportName}</td>
                        <td className="py-2 px-2">{h.format}</td>
                        <td className="py-2 px-2">{h.recordCount}</td>
                        <td className="py-2 px-2">{h.fileSizeBytes ? `${Math.round(h.fileSizeBytes / 1024)} KB` : '—'}</td>
                        <td className="py-2 px-2">
                          <span className={h.status === 'COMPLETED' ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-600'}>
                            {h.status}
                          </span>
                        </td>
                        <td className="py-2 pl-2 text-right text-[#64748B]">
                          {new Date(h.requestedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
