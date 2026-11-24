'use client';

import * as React from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Users,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  X,
  Download,
  Trash2,
  Edit2,
  RefreshCw,
  Search,
  Sparkles,
  ChevronDown,
  Info,
  Check,
  ShieldCheck,
  Building,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { TruncatedText } from '@/components/common/TruncatedText';
import { SalesEmployeeSelect, filterSalesEmployees } from './SalesEmployeeSelect';
import { saveLead, checkLeadDuplicate, crmError } from '@/modules/crm/crm-api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Standard supported CRM fields
const CRM_FIELDS = [
  { key: 'leadName', label: 'Lead Name', required: false, aliases: ['name', 'lead name', 'full name', 'contact name', 'person name', 'lead'] },
  { key: 'companyName', label: 'Company Name', required: false, aliases: ['company', 'company name', 'business', 'business name', 'organization', 'firm'] },
  { key: 'phone', label: 'Phone Number', required: false, aliases: ['phone', 'mobile', 'contact', 'cell', 'phone number', 'mobile number', 'contact number'] },
  { key: 'email', label: 'Email Address', required: false, aliases: ['email', 'email address', 'mail'] },
  { key: 'website', label: 'Website', required: false, aliases: ['website', 'site', 'url', 'web'] },
  { key: 'address', label: 'Address', required: false, aliases: ['address', 'street', 'location'] },
  { key: 'city', label: 'City', required: false, aliases: ['city', 'town'] },
  { key: 'state', label: 'State', required: false, aliases: ['state', 'province', 'region'] },
  { key: 'country', label: 'Country', required: false, aliases: ['country', 'nation'] },
  { key: 'pincode', label: 'Pincode / Zip', required: false, aliases: ['pincode', 'pin code', 'zip', 'zipcode', 'postal code'] },
  { key: 'source', label: 'Lead Source', required: false, aliases: ['source', 'lead source', 'origin', 'channel'] },
  { key: 'category', label: 'Category', required: false, aliases: ['category', 'industry', 'business type', 'type', 'segment'] },
  { key: 'priority', label: 'Priority', required: false, aliases: ['priority', 'urgency', 'level'] },
  { key: 'rating', label: 'Rating', required: false, aliases: ['rating', 'google rating'] },
  { key: 'sourceDate', label: 'Source Record Date', required: false, aliases: ['added on', 'created at', 'date'] },
  { key: 'status', label: 'Status / Stage', required: false, aliases: ['status', 'stage', 'lead status', 'lead stage'] },
  { key: 'value', label: 'Estimated Value', required: false, aliases: ['value', 'deal value', 'amount', 'budget', 'revenue'] },
  { key: 'notes', label: 'Notes', required: false, aliases: ['notes', 'remarks', 'description', 'comment', 'comments'] },
  { key: 'employeeCode', label: 'Assigned Employee Code', required: false, aliases: ['employee code', 'sales rep', 'assigned to', 'rep code', 'emp code', 'assignee'] },
];

const LEAD_STATUSES = new Set(['NEW', 'CONTACTED', 'CALL_BACK', 'DETAILS_SENT', 'FOLLOW_UP', 'VISIT_SCHEDULED', 'VISIT_DONE', 'PROPOSAL_SENT', 'NEGOTIATION', 'FINAL_CALL', 'WON', 'LOST', 'VISIT', 'QUALIFIED', 'PROPOSAL', 'PAYMENT', 'WORK_STARTED', 'CANCELLED', 'CONVERTED']);
const normalizeStatus = (value) => String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');

function normalizeHeader(header) {
  return String(header || '').trim().toLowerCase().replace(/[_\W]+/g, ' ');
}

function autoDetectField(header) {
  const norm = normalizeHeader(header);
  for (const field of CRM_FIELDS) {
    if (norm === field.key.toLowerCase() || norm === field.label.toLowerCase()) {
      return field.key;
    }
    if (field.aliases.some((alias) => norm === alias)) {
      return field.key;
    }
  }
  return '';
}

function validateRow(row) {
  const errors = [];
  const name = String(row.leadName || row.companyName || '').trim();
  if (!name) {
    errors.push('Lead name or company name is required');
  }

  const phone = String(row.phone || '').trim();
  if (phone) {
    const numbers = phone.split(/\s*[/;,]\s*/);
    if (numbers.some((number) => { const digits = number.replace(/\D/g, ''); return !/^\+?[\d\s().-]+$/.test(number) || digits.length < 8 || digits.length > 15; })) {
      errors.push('Phone must have 8–15 digits');
    }
  }

  const email = String(row.email || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }

  const rating = String(row.rating || '').trim();
  if (rating && (!Number.isFinite(Number(rating)) || Number(rating) < 0 || Number(rating) > 5)) errors.push('Rating must be between 0 and 5');

  const val = String(row.value || '').trim();
  if (val && isNaN(Number(val))) {
    errors.push('Deal value must be numeric');
  }

  return errors;
}

export function BulkImportLeadsDrawer({
  open,
  onOpenChange,
  employees = [],
  departments = [],
  onImported,
}) {
  // Stepper state: 1: Upload, 2: Map & Validate, 3: Assign Employees, 4: Review & Import
  const [currentStep, setCurrentStep] = React.useState(1);

  // Step 1: Upload state
  const [uploadMode, setUploadMode] = React.useState('file'); // 'file' | 'paste'
  const [file, setFile] = React.useState(null);
  const [pastedText, setPastedText] = React.useState('');
  const [rawHeaders, setRawHeaders] = React.useState([]);
  const [rawRows, setRawRows] = React.useState([]);

  // Step 2: Mapping & Rows State
  const [mapping, setMapping] = React.useState({});
  const [processedRows, setProcessedRows] = React.useState([]);
  const [selectedRowIndices, setSelectedRowIndices] = React.useState(new Set());
  const [rowFilter, setRowFilter] = React.useState('all');
  const [previewPage, setPreviewPage] = React.useState(0);
  const [editingRow, setEditingRow] = React.useState(null);

  // Step 3: Assignment State
  // Mode: 'ALL' | 'INDIVIDUAL' | 'SELECTED' | 'ROUND_ROBIN' | 'UNASSIGNED'
  const [assignmentMode, setAssignmentMode] = React.useState('ROUND_ROBIN');
  const [globalAssigneeId, setGlobalAssigneeId] = React.useState(null);
  const [selectedRepIds, setSelectedRepIds] = React.useState(new Set());
  const [batchAssigneeId, setBatchAssigneeId] = React.useState(null);

  // Step 4: Import State
  const [duplicateAction] = React.useState('SKIP'); // 'SKIP' | 'UPDATE'
  const [importing, setImporting] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = React.useState(null);

  // Filter Sales Department employees
  const salesEmployees = React.useMemo(() => {
    return filterSalesEmployees(employees, departments);
  }, [employees, departments]);

  // Pre-select all sales reps for round-robin if empty
  React.useEffect(() => {
    if (salesEmployees.length > 0 && selectedRepIds.size === 0) {
      setSelectedRepIds(new Set(salesEmployees.map((e) => e.recordId || e.id)));
    }
  }, [salesEmployees]);

  // Reset drawer state when reopened
  React.useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setFile(null);
      setPastedText('');
      setRawHeaders([]);
      setRawRows([]);
      setProcessedRows([]);
      setImportResults(null);
      setImporting(false);
    }
  }, [open]);

  // Parse File (XLSX, XLS, CSV)
  const handleFileUpload = (uploadedFile) => {
    if (!uploadedFile) return;
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });

        if (!json || json.length < 2) {
          toast.error('The file appears empty or is missing data rows.');
          return;
        }

        const headers = json[0].map((h) => String(h || '').trim());
        const dataRows = json.slice(1).filter((r) => r.some((c) => String(c || '').trim() !== ''));

        setRawHeaders(headers);
        setRawRows(dataRows);

        // Auto map headers
        const initialMapping = {};
        headers.forEach((h, index) => {
          const detected = autoDetectField(h);
          if (detected) initialMapping[index] = detected;
        });
        setMapping(initialMapping);

        // Build processed rows
        applyMapping(headers, dataRows, initialMapping);
        toast.success(`Loaded ${dataRows.length} rows from ${uploadedFile.name}`);
        setCurrentStep(2);
      } catch (err) {
        toast.error('Failed to parse file: ' + (err.message || 'Invalid format'));
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  // Parse Pasted CSV
  const handleParsePasted = () => {
    const text = pastedText.trim();
    if (!text) {
      toast.error('Please paste CSV data with a header row.');
      return;
    }

    try {
      const workbook = XLSX.read(text, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });

      if (!json || json.length < 2) {
        toast.error('Paste at least one header row and one lead row.');
        return;
      }

      const headers = json[0].map((h) => String(h || '').trim());
      const dataRows = json.slice(1).filter((r) => r.some((c) => String(c || '').trim() !== ''));

      setRawHeaders(headers);
      setRawRows(dataRows);

      const initialMapping = {};
      headers.forEach((h, index) => {
        const detected = autoDetectField(h);
        if (detected) initialMapping[index] = detected;
      });
      setMapping(initialMapping);

      applyMapping(headers, dataRows, initialMapping);
      toast.success(`Parsed ${dataRows.length} leads successfully`);
      setCurrentStep(2);
    } catch (err) {
      toast.error('Failed to parse pasted text: ' + err.message);
    }
  };

  // Build processed rows from mapping
  const applyMapping = (headers, rowsList, fieldMapping) => {
    const mapped = rowsList.map((rowCells, idx) => {
      const rowObj = {
        _rowIndex: idx + 1,
        _cells: rowCells,
        _selected: true,
        assignedToId: null,
      };

      headers.forEach((h, hIdx) => {
        const crmKey = fieldMapping[hIdx];
        if (crmKey) {
          rowObj[crmKey] = String(rowCells[hIdx] ?? '').trim();
        }
      });

      // Try auto-matching employeeCode if present in sheet
      if (rowObj.employeeCode) {
        const matched = salesEmployees.find(
          (e) =>
            String(e.employeeCode).toLowerCase() === rowObj.employeeCode.toLowerCase() ||
            String(e.id).toLowerCase() === rowObj.employeeCode.toLowerCase()
        );
        if (matched) {
          rowObj.assignedToId = matched.recordId || matched.id;
        }
      }

      rowObj._warnings = [!rowObj.leadName && rowObj.companyName ? 'No separate contact name' : '', !rowObj.email ? 'Missing email' : '', !rowObj.website ? 'Missing website' : '', !rowObj.category ? 'Missing category' : '', rowObj.status && !LEAD_STATUSES.has(normalizeStatus(rowObj.status)) ? 'Unrecognized status; NEW will be used' : ''].filter(Boolean);
      const errors = validateRow(rowObj);
      rowObj._errors = errors;
      rowObj._isValid = errors.length === 0;

      return rowObj;
    });

    setProcessedRows(mapped);
    setSelectedRowIndices(new Set(mapped.map((_, i) => i)));
  };

  // Re-map when mapping changes
  const handleMappingChange = (header, crmKey) => {
    const nextMapping = { ...mapping, [header]: crmKey };
    setMapping(nextMapping);
    applyMapping(rawHeaders, rawRows, nextMapping);
  };

  // Update specific row (Inline or modal edit)
  const handleUpdateRow = (index, updatedRow) => {
    setProcessedRows((prev) => {
      const copy = [...prev];
      const errors = validateRow(updatedRow);
      const warnings = [!updatedRow.leadName && updatedRow.companyName ? 'No separate contact name' : '', !updatedRow.email ? 'Missing email' : '', !updatedRow.website ? 'Missing website' : '', !updatedRow.category ? 'Missing category' : '', updatedRow.status && !LEAD_STATUSES.has(normalizeStatus(updatedRow.status)) ? 'Unrecognized status; NEW will be used' : ''].filter(Boolean);
      copy[index] = {
        ...updatedRow,
        _warnings: warnings,
        _errors: errors,
        _isValid: errors.length === 0,
      };
      return copy;
    });
    setEditingRow(null);
    toast.success('Row updated and re-validated');
  };

  // Delete row from import
  const handleDeleteRow = (index) => {
    setProcessedRows((prev) => prev.filter((_, i) => i !== index));
    setRawRows((prev) => prev.filter((_, i) => i !== index));
    setSelectedRowIndices((prev) => new Set(Array.from(prev).filter((i) => i !== index).map((i) => i > index ? i - 1 : i)));
    toast.success('Row removed');
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const sampleHeaders = CRM_FIELDS.map((f) => f.label);
    const sampleRow1 = [
      'John Sharma',
      'Apex Solutions Pvt Ltd',
      '9876543210',
      'john.sharma@apexsol.com',
      'https://apexsol.com',
      '402 Trade Hub, S.G. Highway',
      'Ahmedabad',
      'Gujarat',
      'India',
      '380015',
      'Website',
      'Enterprise Software',
      '',
      '',
      'HIGH',
      'NEW',
      '150000',
      'Interested in ERP integration demo',
      salesEmployees[0]?.employeeCode || 'EMP-001',
    ];
    const sampleRow2 = [
      'Priya Mehta',
      'Mehta Logistics & Cargo',
      '9123456789',
      'priya@mehtalogistics.in',
      'https://mehtalogistics.in',
      'Plot 12, GIDC Estate',
      'Vadodara',
      'Gujarat',
      'India',
      '390010',
      'Referral',
      'Supply Chain',
      '',
      '',
      'MEDIUM',
      'NEW',
      '75000',
      'Follow up on Thursday regarding pricing sheet',
      salesEmployees[1]?.employeeCode || 'EMP-002',
    ];

    const ws = XLSX.utils.aoa_to_sheet([sampleHeaders, sampleRow1, sampleRow2]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads Template');
    XLSX.writeFile(wb, `quikboom-leads-sample-template.xlsx`);
    toast.success('Sample Excel template downloaded');
  };

  // Assignment Distribution Logic
  const handleApplyAssignment = () => {
    if (assignmentMode === 'ALL') {
      if (!globalAssigneeId) {
        toast.error('Please select an employee to assign all leads.');
        return;
      }
      setProcessedRows((prev) =>
        prev.map((row) => ({ ...row, assignedToId: globalAssigneeId }))
      );
      toast.success('Assigned all leads to selected employee');
    } else if (assignmentMode === 'SELECTED') {
      if (!batchAssigneeId) {
        toast.error('Please select an employee for the selected rows.');
        return;
      }
      setProcessedRows((prev) =>
        prev.map((row, idx) =>
          selectedRowIndices.has(idx) ? { ...row, assignedToId: batchAssigneeId } : row
        )
      );
      toast.success(`Assigned ${selectedRowIndices.size} selected leads`);
    } else if (assignmentMode === 'ROUND_ROBIN') {
      const activeRepIds = Array.from(selectedRepIds);
      if (activeRepIds.length === 0) {
        toast.error('Please check at least one Sales representative for equal distribution.');
        return;
      }
      setProcessedRows((prev) => {
        let repIdx = 0;
        return prev.map((row, idx) => {
          if (!selectedRowIndices.has(idx)) return row;
          const assignedId = activeRepIds[repIdx % activeRepIds.length];
          repIdx += 1;
          return { ...row, assignedToId: assignedId };
        });
      });
      toast.success(`Distributed leads equally among ${activeRepIds.length} Sales representatives`);
    } else if (assignmentMode === 'UNASSIGNED') {
      setProcessedRows((prev) => prev.map((row) => ({ ...row, assignedToId: null })));
      toast.success('All leads marked unassigned');
    }
  };

  // Live Assignment Summary calculation
  const assignmentSummary = React.useMemo(() => {
    const counts = {};
    let unassigned = 0;

    processedRows.filter((row) => row._isValid).forEach((row) => {
      if (row.assignedToId) {
        counts[row.assignedToId] = (counts[row.assignedToId] || 0) + 1;
      } else {
        unassigned += 1;
      }
    });

    const breakdown = salesEmployees.map((emp) => ({
      emp,
      count: counts[emp.recordId || emp.id] || 0,
    }));

    return {
      breakdown,
      unassigned,
      total: processedRows.filter((row) => row._isValid).length,
    };
  }, [processedRows, salesEmployees]);

  // Statistics for Step 2 & Step 4
  const stats = React.useMemo(() => {
    const total = processedRows.length;
    const valid = processedRows.filter((r) => r._isValid).length;
    const invalid = total - valid;
    const assigned = processedRows.filter((r) => r._isValid && r.assignedToId != null).length;
    return { total, valid, invalid, assigned, unassigned: valid - assigned };
  }, [processedRows]);

  // Final Import Execution
  const executeImport = async () => {
    const validRows = processedRows.filter((r) => r._isValid);
    if (validRows.length === 0) {
      toast.error('No valid leads available to import. Please review and fix invalid rows.');
      return;
    }

    setImporting(true);
    setImportProgress({ current: 0, total: validRows.length });

    let successful = 0;
    let failed = 0;
    let duplicatesSkipped = 0;
    const failedRows = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setImportProgress({ current: i + 1, total: validRows.length });

      try {
        const formPayload = {
          title: row.leadName || row.companyName,
          companyName: row.companyName || undefined,
          phone: row.phone ? row.phone.split(/\s*[/;,]\s*/)[0].replace(/[^\d+]/g, '') : undefined,
          email: row.email || undefined,
          website: row.website || undefined,
          address: row.address || undefined,
          city: row.city || undefined,
          state: row.state || undefined,
          country: row.country || undefined,
          pincode: row.pincode || undefined,
          source: row.source || 'Manual',
          category: row.category || undefined,
          priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(String(row.priority || '').toUpperCase()) ? String(row.priority).toUpperCase() : 'MEDIUM',
          status: LEAD_STATUSES.has(normalizeStatus(row.status)) ? normalizeStatus(row.status) : 'NEW',
          assignedToId: row.assignedToId ?? null,
          value: row.value || undefined,
          workNotes: [row.notes, ...rawHeaders.map((header, index) => !mapping[index] && row._cells?.[index] ? `${header}: ${row._cells[index]}` : ''), row.sourceDate ? `Source record date: ${row.sourceDate}` : '', row.priority && !['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(String(row.priority).toUpperCase()) ? `Original priority: ${row.priority}` : '', row.status && !LEAD_STATUSES.has(normalizeStatus(row.status)) ? `Original status: ${row.status}` : '', row.phone?.split(/\s*[/;,]\s*/).length > 1 ? `Additional phone numbers: ${row.phone.split(/\s*[/;,]\s*/).slice(1).join(', ')}` : ''].filter(Boolean).join('\n') || undefined,
          rating: row.rating || undefined,
        };

        // Check duplicate if skip requested
        if (duplicateAction === 'SKIP') {
          const dupRes = await checkLeadDuplicate(formPayload);
          const dupData = dupRes?.data || dupRes;
          if (dupData?.isDuplicate) {
            duplicatesSkipped += 1;
            continue;
          }
        }

        await saveLead(formPayload);
        successful += 1;
      } catch (err) {
        failed += 1;
        failedRows.push({
          ...row,
          _errorReason: crmError(err) || 'Import failed',
        });
      }
    }

    setImportResults({
      successful,
      failed,
      duplicatesSkipped,
      total: validRows.length,
      failedRows,
    });
    setImporting(false);
    onImported?.();
    toast.success(`Import complete: ${successful} leads imported`);
  };

  const handleDownloadInvalid = () => {
    const invalidRows = processedRows.filter((row) => !row._isValid);
    if (!invalidRows.length) return;
    const data = [
      [...rawHeaders, 'Validation errors'],
      ...invalidRows.map((row) => [...rawHeaders.map((_, index) => row._cells?.[index] ?? ''), row._errors.join('; ')]),
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(data), 'Invalid rows');
    XLSX.writeFile(workbook, 'invalid-leads.xlsx');
  };

  // Download Failed Rows CSV
  const handleDownloadFailedCsv = () => {
    if (!importResults?.failedRows?.length) return;
    const rowsToExport = importResults.failedRows.map((r) => ({
      'Lead Name': r.leadName || '',
      'Company Name': r.companyName || '',
      'Phone': r.phone || '',
      'Email': r.email || '',
      'Error Reason': r._errorReason || 'Validation error',
    }));
    const ws = XLSX.utils.json_to_sheet(rowsToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Failed Leads');
    XLSX.writeFile(wb, `failed-leads-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full h-full p-0 flex flex-col gap-0 bg-white border-l border-slate-200/90 shadow-2xl rounded-l-2xl max-w-full sm:max-w-[98vw] overflow-hidden"
      >
        {/* ── 1. Sticky Header ────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-200/80 bg-white px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-200/60">
              <Upload className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                Bulk Import Leads
              </h2>
              <p className="text-xs text-slate-500">
                Upload, validate, assign, and import leads into your CRM.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* ── 2. Horizontal 4-Step Stepper ───────────────────────────────── */}
        <div className="shrink-0 border-b border-slate-200 bg-slate-50/70 px-5 py-2.5 sm:px-7">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[
              { num: 1, title: 'Upload File' },
              { num: 2, title: 'Map & Validate' },
              { num: 3, title: 'Assign Employees' },
              { num: 4, title: 'Review & Import' },
            ].map((step, idx) => {
              const isCurrent = currentStep === step.num;
              const isPast = currentStep > step.num;
              const canClick = isPast || (step.num === 2 && rawRows.length > 0) || (step.num === 3 && processedRows.length > 0);

              return (
                <React.Fragment key={step.num}>
                  <button
                    type="button"
                    disabled={!canClick}
                    onClick={() => canClick && setCurrentStep(step.num)}
                    className={cn(
                      'flex items-center gap-2 group transition-all',
                      canClick ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                    )}
                  >
                    <div
                      className={cn(
                        'flex size-6 sm:size-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                        isCurrent && 'bg-[#16A34A] text-white shadow-xs ring-4 ring-emerald-500/15',
                        isPast && 'bg-emerald-100 text-emerald-800',
                        !isCurrent && !isPast && 'bg-slate-200 text-slate-600'
                      )}
                    >
                      {isPast ? <Check className="size-3.5" /> : step.num}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-semibold hidden md:inline',
                        isCurrent && 'text-slate-900',
                        isPast && 'text-emerald-800',
                        !isCurrent && !isPast && 'text-slate-500'
                      )}
                    >
                      {step.title}
                    </span>
                  </button>

                  {idx < 3 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 mx-2 sm:mx-4 transition-colors',
                        currentStep > idx + 1 ? 'bg-emerald-400' : 'bg-slate-200'
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── 3. Scrollable Content Body ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 space-y-6">
          {/* ───────────────── STEP 1: UPLOAD FILE ───────────────── */}
          {currentStep === 1 && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Method Switcher & Sample Download */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="inline-flex rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all',
                      uploadMode === 'file'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    <FileSpreadsheet className="size-3.5 text-emerald-600" />
                    <span>Upload Excel / CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('paste')}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all',
                      uploadMode === 'paste'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    <FileText className="size-3.5 text-blue-600" />
                    <span>Paste CSV Data</span>
                  </button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-[#16A34A] shadow-2xs"
                >
                  <Download className="size-3.5" />
                  <span>Download Sample Template</span>
                </Button>
              </div>

              {/* Upload Excel / CSV Zone */}
              {uploadMode === 'file' ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedFile = e.dataTransfer.files?.[0];
                    if (droppedFile) handleFileUpload(droppedFile);
                  }}
                  className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 text-center transition-all hover:border-emerald-500 hover:bg-emerald-50/20"
                >
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-xs ring-1 ring-slate-200 text-[#16A34A] mb-3">
                    <FileSpreadsheet className="size-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Drag and drop your spreadsheet here
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
                  </p>

                  <label className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] px-4 py-2 text-xs font-semibold text-white shadow-xs cursor-pointer transition-colors">
                    <Upload className="size-3.5" />
                    <span>Browse Files</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => {
                        const sel = e.target.files?.[0];
                        if (sel) handleFileUpload(sel);
                      }}
                    />
                  </label>

                  {file && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
                      <FileSpreadsheet className="size-4 text-[#16A34A]" />
                      <span className="font-semibold">{file.name}</span>
                      <span className="text-[10px] text-emerald-600">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Paste Data Zone */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800">
                      Paste CSV Records (Include Header Row)
                    </Label>
                    <span className="text-[11px] text-slate-400">
                      Format: Lead Name, Company, Phone, Email...
                    </span>
                  </div>
                  <textarea
                    rows={10}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Name, Company, Phone, Email, City, Priority&#10;Rajesh Patel, Patel Chem, 9876543210, rajesh@chem.com, Ahmedabad, HIGH&#10;Anita Roy, Roy Enterprises, 9123456789, anita@royent.com, Mumbai, MEDIUM"
                    className="w-full font-mono text-xs rounded-2xl border border-slate-200 bg-slate-50/50 p-4 focus:bg-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                  />
                  <Button
                    type="button"
                    onClick={handleParsePasted}
                    disabled={!pastedText.trim()}
                    className="w-full rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold h-10 shadow-xs"
                  >
                    <span>Parse Pasted Data & Continue</span>
                    <ArrowRight className="size-3.5 ml-1.5" />
                  </Button>
                </div>
              )}

              {/* Supported Columns Reference Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Info className="size-4 text-[#16A34A]" />
                  <span>Supported Column Headers</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Our smart column mapper automatically recognizes:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {CRM_FIELDS.map((f) => (
                    <span
                      key={f.key}
                      className={cn(
                        'rounded-md px-2 py-0.5 text-[10px] font-semibold font-mono',
                        f.required
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-white text-slate-600 border border-slate-200'
                      )}
                    >
                      {f.label} {f.required && '*'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ───────────────── STEP 2: MAP & VALIDATE ───────────────── */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Leads</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">{stats.total}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Valid Leads</p>
                  <p className="text-xl font-extrabold text-emerald-700 mt-0.5">{stats.valid}</p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Invalid Leads</p>
                  <p className="text-xl font-extrabold text-rose-700 mt-0.5">{stats.invalid}</p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Ready to Assign</p>
                  <p className="text-xl font-extrabold text-blue-700 mt-0.5">{stats.valid}</p>
                </div>
              </div>

              {/* Column Mapping Collapsible / Section */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-800">
                      Column Header Mapping ({rawHeaders.length} Columns Detected)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Verify and adjust column matches below
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
                  {rawHeaders.map((hdr, headerIndex) => {
                    const currentCrmKey = mapping[headerIndex] || '';
                    return (
                      <div
                        key={headerIndex}
                        className="rounded-xl border border-slate-100 bg-slate-50/60 p-2 text-xs space-y-1"
                      >
                        <p className="font-semibold text-slate-800 truncate" title={hdr}>
                          {hdr}
                        </p>
                        <select
                          value={currentCrmKey}
                          onChange={(e) => handleMappingChange(headerIndex, e.target.value)}
                          className="w-full h-7 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="">— Ignore Column —</option>
                          {CRM_FIELDS.map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.label} {f.required ? '(Required)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preview Table & Filtering */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 p-3 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-800">
                      Lead Validation Preview
                    </h3>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {processedRows.length} Rows
                    </span>
                  </div>

                  {stats.invalid > 0 && <button type="button" onClick={handleDownloadInvalid} className="text-xs font-semibold text-rose-700">Download invalid rows</button>}
                  <select aria-label="Filter rows" value={rowFilter} onChange={(e) => { setRowFilter(e.target.value); setPreviewPage(0); }} className="rounded-lg border border-slate-200 bg-white p-1 text-xs">
                    <option value="all">All Rows</option>
                    <option value="valid">Valid</option>
                    <option value="warnings">Warnings</option>
                    <option value="invalid">Invalid</option>
                  </select>
                </div>

                <div className="overflow-x-auto max-h-[420px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                        <th className="py-2.5 pl-4 pr-2">#</th>
                        {rawHeaders.map((header, index) => (
                          <th key={index} className="py-2.5 px-3 whitespace-nowrap">{header}</th>
                        ))}
                        <th className="py-2.5 px-3">Validation</th>
                        <th className="py-2.5 pl-2 pr-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {processedRows
                        .map((row, originalIdx) => ({ row, originalIdx }))
                        .filter(({ row }) => rowFilter === 'all' || (rowFilter === 'valid' && row._isValid) || (rowFilter === 'warnings' && row._isValid && row._warnings?.length) || (rowFilter === 'invalid' && !row._isValid))
                        .slice(previewPage * 50, (previewPage + 1) * 50)
                        .map(({ row, originalIdx }) => (
                          <tr
                            key={originalIdx}
                            className={cn(
                              'transition-colors',
                              row._isValid ? 'hover:bg-slate-50/70' : 'bg-rose-50/40 hover:bg-rose-50/70'
                            )}
                          >
                            <td className="py-2.5 pl-4 pr-2 font-mono text-slate-400 text-[11px]">
                              {row._rowIndex}
                            </td>
                            {rawHeaders.map((header, index) => (
                              <td key={index} className="py-2.5 px-3 text-slate-600 whitespace-nowrap" title={String(row._cells?.[index] ?? '')}>
                                {String(row._cells?.[index] ?? '')}
                              </td>
                            ))}
                            <td className="py-2.5 px-3">
                              {row._isValid ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                  <Check className="size-3" /> {row._warnings?.length ? `Valid — ${row._warnings.join(', ')}` : 'Valid'}
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200 cursor-help"
                                  title={row._errors.join(', ')}
                                >
                                  <AlertCircle className="size-3" /> {row._errors[0]}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 pl-2 pr-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingRow({ index: originalIdx, ...row })}
                                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                  title="Edit row details"
                                >
                                  <Edit2 className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(originalIdx)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  title="Remove row"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-3 text-xs">
                  <button type="button" disabled={previewPage === 0} onClick={() => setPreviewPage((p) => Math.max(0, p - 1))}>Previous</button>
                  <span>Page {previewPage + 1}</span>
                  <button type="button" disabled={(previewPage + 1) * 50 >= processedRows.filter((row) => rowFilter === 'all' || (rowFilter === 'valid' && row._isValid) || (rowFilter === 'warnings' && row._isValid && row._warnings?.length) || (rowFilter === 'invalid' && !row._isValid)).length} onClick={() => setPreviewPage((p) => p + 1)}>Next</button>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────── STEP 3: SALES EMPLOYEE ASSIGNMENT ───────────────── */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Header explanation banner */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-[#16A34A]">
                  <Users className="size-4.5" />
                  <span>Sales Department Employee Assignment</span>
                </div>
                <p className="text-slate-600">
                  Assign leads to active Sales Department representatives individually, in bulk, or distribute them equally via round-robin.
                </p>
              </div>

              {/* Assignment Mode Selector Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'ROUND_ROBIN', label: 'Distribute Equally', icon: Sparkles, desc: 'Round-robin across team' },
                  { id: 'ALL', label: 'Assign All to One', icon: UserCheck, desc: 'Single sales representative' },
                  { id: 'INDIVIDUAL', label: 'Assign Individually', icon: Users, desc: 'Per-row dropdown selector' },
                  { id: 'UNASSIGNED', label: 'Keep Unassigned', icon: X, desc: 'Import without assignment' },
                ].map((mode) => {
                  const isSel = assignmentMode === mode.id;
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setAssignmentMode(mode.id)}
                      className={cn(
                        'flex flex-col items-start gap-1 p-3 rounded-2xl border text-left transition-all cursor-pointer',
                        isSel
                          ? 'border-[#16A34A] bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn('size-4', isSel ? 'text-[#16A34A]' : 'text-slate-500')} />
                        <span className={cn('text-xs font-bold', isSel ? 'text-slate-900' : 'text-slate-700')}>
                          {mode.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{mode.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mode Controls */}
              {assignmentMode === 'ALL' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                  <Label className="text-xs font-bold text-slate-800">
                    Select Sales Representative to Receive All {processedRows.length} Leads:
                  </Label>
                  <div className="max-w-md">
                    <SalesEmployeeSelect
                      value={globalAssigneeId}
                      onChange={(id) => setGlobalAssigneeId(id)}
                      employees={employees}
                      departments={departments}
                      placeholder="Choose Sales Representative..."
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleApplyAssignment}
                    className="h-8 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold px-4"
                  >
                    Apply Assignment to All Leads
                  </Button>
                </div>
              )}

              {assignmentMode === 'ROUND_ROBIN' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Select Sales Representatives for Round-Robin Distribution:
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {processedRows.length} leads will be distributed equally among the checked representatives.
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={handleApplyAssignment}
                      className="h-8 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold px-4 shrink-0 shadow-xs"
                    >
                      <Sparkles className="size-3.5 mr-1" />
                      <span>Distribute Now ({selectedRepIds.size} Reps)</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                    {salesEmployees.map((emp) => {
                      const empId = emp.recordId || emp.id;
                      const isChecked = selectedRepIds.has(empId);
                      return (
                        <label
                          key={empId}
                          className={cn(
                            'flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all select-none',
                            isChecked
                              ? 'border-emerald-300 bg-emerald-50/50 text-slate-900'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const next = new Set(selectedRepIds);
                              if (e.target.checked) next.add(empId);
                              else next.delete(empId);
                              setSelectedRepIds(next);
                            }}
                            className="size-4 rounded text-[#16A34A] focus:ring-[#16A34A]"
                          />
                          <div className="min-w-0 flex-1 text-xs">
                            <p className="font-semibold truncate">{emp.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {emp.employeeCode || emp.id} · {emp.designationName || 'Sales'}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Live Assignment Summary Table */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">
                    Live Assignment Breakdown Summary
                  </h4>
                  <span className="text-xs font-bold text-[#16A34A]">
                    {stats.assigned} Assigned / {stats.unassigned} Unassigned
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
                  {assignmentSummary.breakdown.map(({ emp, count }) => (
                    <div
                      key={emp.recordId || emp.id}
                      className={cn(
                        'p-2.5 rounded-xl border text-xs',
                        count > 0
                          ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950 font-semibold'
                          : 'border-slate-100 bg-slate-50/50 text-slate-400'
                      )}
                    >
                      <p className="truncate text-[11px] font-bold">{emp.name}</p>
                      <p className="text-base font-extrabold mt-0.5 text-slate-900">
                        {count}{' '}
                        <span className="text-[10px] font-normal text-slate-400">leads</span>
                      </p>
                    </div>
                  ))}
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                    <p className="text-[11px] font-bold text-slate-500">Unassigned</p>
                    <p className="text-base font-extrabold mt-0.5 text-slate-700">
                      {assignmentSummary.unassigned}{' '}
                      <span className="text-[10px] font-normal text-slate-400">leads</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Per-Row Assignment Table (For Individual adjustments or verification) */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="border-b border-slate-100 p-3 bg-slate-50/60 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">
                    Lead Row Assignment List ({processedRows.length} Leads)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    You can override any individual lead assignment below
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                        <th className="py-2 pl-4 pr-2">#</th>
                        <th className="py-2 px-3">Lead Name</th>
                        <th className="py-2 px-3">Company</th>
                        <th className="py-2 px-3">City</th>
                        <th className="py-2 px-3">Assigned Sales Rep</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {processedRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2 pl-4 pr-2 font-mono text-slate-400 text-[11px]">
                            {row._rowIndex}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900 max-w-[150px] truncate">
                            {row.leadName}
                          </td>
                          <td className="py-2 px-3 text-slate-500 max-w-[140px] truncate">
                            {row.companyName || '—'}
                          </td>
                          <td className="py-2 px-3 text-slate-500">
                            {row.city || '—'}
                          </td>
                          <td className="py-2 px-3 w-64">
                            <SalesEmployeeSelect
                              value={row.assignedToId}
                              onChange={(newId) => {
                                setProcessedRows((prev) => {
                                  const copy = [...prev];
                                  copy[idx] = { ...copy[idx], assignedToId: newId };
                                  return copy;
                                });
                              }}
                              employees={employees}
                              departments={departments}
                              size="sm"
                              placeholder="Unassigned"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────── STEP 4: REVIEW & IMPORT ───────────────── */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* If import is completed, show Results View */}
              {importResults ? (
                <div className="rounded-2xl border border-emerald-200 bg-white p-6 space-y-6 shadow-sm">
                  <div className="text-center space-y-2">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-[#16A34A]">
                      <CheckCircle2 className="size-8" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Import Process Completed
                    </h3>
                    <p className="text-xs text-slate-500">
                      Leads have been processed and saved into your CRM workspace.
                    </p>
                  </div>

                  {/* Stat pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                      <p className="text-[10px] font-bold uppercase text-emerald-700">Successfully Imported</p>
                      <p className="text-2xl font-extrabold text-[#16A34A] mt-1">{importResults.successful}</p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                      <p className="text-[10px] font-bold uppercase text-amber-700">Duplicates Skipped</p>
                      <p className="text-2xl font-extrabold text-amber-700 mt-1">{importResults.duplicatesSkipped}</p>
                    </div>
                    <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3">
                      <p className="text-[10px] font-bold uppercase text-rose-700">Failed Records</p>
                      <p className="text-2xl font-extrabold text-rose-700 mt-1">{importResults.failed}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase text-slate-600">Total Processed</p>
                      <p className="text-2xl font-extrabold text-slate-900 mt-1">{importResults.total}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    {importResults.failed > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDownloadFailedCsv}
                        className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold h-10 px-4"
                      >
                        <Download className="size-3.5 mr-1.5" />
                        <span>Download {importResults.failed} Failed Records with Errors</span>
                      </Button>
                    )}

                    <Button
                      type="button"
                      onClick={() => onOpenChange(false)}
                      className="rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold h-10 px-6 shadow-xs"
                    >
                      <span>Done & View Leads</span>
                    </Button>
                  </div>
                </div>
              ) : (
                /* Pre-Import Review */
                <div className="space-y-5">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Valid</p>
                      <p className="text-xl font-extrabold text-slate-900 mt-0.5">{stats.valid}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-2xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Assigned</p>
                      <p className="text-xl font-extrabold text-[#16A34A] mt-0.5">{stats.assigned}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 shadow-2xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Unassigned</p>
                      <p className="text-xl font-extrabold text-slate-700 mt-0.5">{stats.unassigned}</p>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 shadow-2xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Sales Reps</p>
                      <p className="text-xl font-extrabold text-blue-700 mt-0.5">
                        {assignmentSummary.breakdown.filter((b) => b.count > 0).length}
                      </p>
                    </div>
                  </div>

                  {/* Duplicate Handling Options */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                    <Label className="text-xs font-bold text-slate-800">
                      Duplicate Lead Handling
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label
                        className={cn(
                          'flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all',
                          duplicateAction === 'SKIP'
                            ? 'border-emerald-300 bg-emerald-50/50 text-slate-900'
                            : 'border-slate-200 bg-white text-slate-600'
                        )}
                      >
                        <input
                          type="radio"
                          name="duplicateAction"
                          checked={duplicateAction === 'SKIP'}
                          readOnly
                          className="size-4 text-[#16A34A] focus:ring-[#16A34A]"
                        />
                        <div>
                          <p className="font-semibold">Skip duplicates (Recommended)</p>
                          <p className="text-[10px] text-slate-400">
                            Preserve existing records and skip any duplicates matching phone or email
                          </p>
                        </div>
                      </label>


                    </div>
                  </div>

                  {/* Progress Indicator (if active) */}
                  {importing && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-2 text-center">
                      <RefreshCw className="mx-auto size-7 text-[#16A34A] animate-spin" />
                      <h4 className="text-sm font-bold text-slate-900">
                        Importing Leads... ({importProgress.current} / {importProgress.total})
                      </h4>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden max-w-md mx-auto">
                        <div
                          className="bg-[#16A34A] h-full transition-all duration-200"
                          style={{
                            width: `${(importProgress.current / (importProgress.total || 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Creating leads, dispatching assignment notifications, and syncing database...
                      </p>
                    </div>
                  )}

                  {/* Final Review Table */}
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="border-b border-slate-100 p-3 bg-slate-50/60 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800">
                        Final Import Preview ({stats.valid} Valid Leads)
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Only valid rows will be imported
                      </span>
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                            <th className="py-2 pl-4 pr-2">#</th>
                            <th className="py-2 px-3">Lead Name</th>
                            <th className="py-2 px-3">Phone</th>
                            <th className="py-2 px-3">Company</th>
                            <th className="py-2 px-3">Source</th>
                            <th className="py-2 px-3">Assigned Sales Rep</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {processedRows
                            .filter((r) => r._isValid)
                            .map((row, idx) => {
                              const assignedRep = salesEmployees.find(
                                (e) => String(e.recordId || e.id) === String(row.assignedToId)
                              );
                              return (
                                <tr key={idx} className="hover:bg-slate-50/70">
                                  <td className="py-2 pl-4 pr-2 font-mono text-slate-400 text-[11px]">
                                    {row._rowIndex}
                                  </td>
                                  <td className="py-2 px-3 font-semibold text-slate-900 max-w-[150px] truncate">
                                    {row.leadName}
                                  </td>
                                  <td className="py-2 px-3 font-mono text-slate-600">
                                    {row.phone || '—'}
                                  </td>
                                  <td className="py-2 px-3 text-slate-600 max-w-[140px] truncate">
                                    {row.companyName || '—'}
                                  </td>
                                  <td className="py-2 px-3 text-slate-600">
                                    {row.source || 'Manual'}
                                  </td>
                                  <td className="py-2 px-3">
                                    {assignedRep ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                                        <UserCheck className="size-3 text-[#16A34A]" />
                                        {assignedRep.name}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic">Unassigned</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 4. Sticky Footer with Navigation Actions ─────────────────────── */}
        <div className="shrink-0 flex items-center justify-between border-t border-slate-200/80 bg-slate-50/90 px-5 py-3.5 sm:px-7">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (currentStep > 1 && !importResults) {
                setCurrentStep((s) => s - 1);
              } else {
                onOpenChange(false);
              }
            }}
            disabled={importing}
            className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 h-9 px-4"
          >
            {currentStep === 1 || importResults ? 'Close' : 'Back'}
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < 4 && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (currentStep === 1) {
                    if (uploadMode === 'file' && !file) {
                      toast.error('Please upload an Excel or CSV file first.');
                      return;
                    }
                    if (uploadMode === 'paste') {
                      handleParsePasted();
                      return;
                    }
                  }
                  if (currentStep === 2 && stats.valid === 0) {
                    toast.error('You need at least one valid lead to proceed.');
                    return;
                  }
                  setCurrentStep((s) => s + 1);
                }}
                disabled={(currentStep === 1 && !file && !pastedText.trim()) || (currentStep === 2 && stats.valid === 0)}
                className="h-9 px-5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight className="size-3.5 ml-1" />
              </Button>
            )}

            {currentStep === 4 && !importResults && (
              <Button
                type="button"
                size="sm"
                onClick={executeImport}
                disabled={importing || stats.valid === 0}
                className="h-9 px-6 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold shadow-xs transition-all"
              >
                {importing ? (
                  <>
                    <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <span>Import {stats.valid} Leads</span>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* ── Edit Row Modal (Inside Step 2) ─────────────────────────────── */}
        {editingRow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in">
            <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Edit Lead Details (Row #{editingRow._rowIndex})
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2">
                  <Label className="text-xs font-bold text-slate-800">
                    Lead Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={editingRow.leadName || ''}
                    onChange={(e) => setEditingRow({ ...editingRow, leadName: e.target.value })}
                    className="h-9 mt-1 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-800">Company Name</Label>
                  <Input
                    value={editingRow.companyName || ''}
                    onChange={(e) => setEditingRow({ ...editingRow, companyName: e.target.value })}
                    className="h-9 mt-1 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-800">Phone</Label>
                  <Input
                    value={editingRow.phone || ''}
                    onChange={(e) => setEditingRow({ ...editingRow, phone: e.target.value })}
                    className="h-9 mt-1 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-800">Email</Label>
                  <Input
                    value={editingRow.email || ''}
                    onChange={(e) => setEditingRow({ ...editingRow, email: e.target.value })}
                    className="h-9 mt-1 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-800">City</Label>
                  <Input
                    value={editingRow.city || ''}
                    onChange={(e) => setEditingRow({ ...editingRow, city: e.target.value })}
                    className="h-9 mt-1 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingRow(null)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleUpdateRow(editingRow.index, editingRow)}
                  className="rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
