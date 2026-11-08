/**
 * Data Management UI-only helpers (no API / database calls).
 */

export const UI_ONLY_NOTICE =
  'UI preview only — no database queries or deletions are performed in this phase.';

const MODULE_CATALOG = [
  { key: 'crm', name: 'CRM (Leads, Contacts, Deals)', group: 'Sales & CRM', prismaModels: ['Lead', 'Contact', 'Deal'], dependencies: ['LeadNote'], relatedTables: ['leads', 'deals'], deletionEligible: true, totalRecords: 0 },
  { key: 'attendance', name: 'Attendance', group: 'HRM', prismaModels: ['Attendance'], dependencies: ['AttendanceBreak'], relatedTables: ['attendances'], deletionEligible: true, totalRecords: 0 },
  { key: 'leave', name: 'Leave Requests', group: 'HRM', prismaModels: ['LeaveRequest'], dependencies: [], relatedTables: ['leave_requests'], deletionEligible: true, totalRecords: 0 },
  { key: 'overtime', name: 'Overtime Requests', group: 'HRM', prismaModels: ['OvertimeRequest'], dependencies: [], relatedTables: ['overtime_requests'], deletionEligible: true, totalRecords: 0 },
  { key: 'payroll', name: 'Payroll & Salary Slips', group: 'HRM', prismaModels: ['Payroll', 'SalarySlip'], dependencies: ['PayrollItem'], relatedTables: ['payrolls'], deletionEligible: true, totalRecords: 0 },
  { key: 'claims', name: 'Claims & Expenses', group: 'HRM', prismaModels: ['EmployeeClaim'], dependencies: [], relatedTables: ['employee_claims'], deletionEligible: true, totalRecords: 0 },
  { key: 'loans', name: 'Employee Loans', group: 'HRM', prismaModels: ['EmployeeLoan'], dependencies: [], relatedTables: ['employee_loans'], deletionEligible: true, totalRecords: 0 },
  { key: 'works', name: 'Projects & Works', group: 'Operations', prismaModels: ['Work'], dependencies: ['WorkTask'], relatedTables: ['works'], deletionEligible: true, totalRecords: 0 },
  { key: 'tickets', name: 'Support Tickets', group: 'Operations', prismaModels: ['SupportTicket'], dependencies: ['TicketComment'], relatedTables: ['support_tickets'], deletionEligible: true, totalRecords: 0 },
  { key: 'finance', name: 'Invoices & Payments', group: 'Finance', prismaModels: ['Invoice', 'PaymentHistory'], dependencies: ['InvoiceItem'], relatedTables: ['invoices'], deletionEligible: true, totalRecords: 0 },
  { key: 'whatsapp', name: 'Notifications (messaging)', group: 'System', prismaModels: ['Notification'], dependencies: [], relatedTables: ['notifications'], deletionEligible: true, totalRecords: 0 },
];

export function getLocalOverview(customerId) {
  const id = customerId?.trim() ? Number(customerId) : 1;
  return {
    customerId: Number.isFinite(id) ? id : 1,
    totalDatabaseRecords: 0,
    totalBusinessModules: MODULE_CATALOG.length,
    backup: {
      available: false,
      verified: false,
      lastBackupAt: null,
      message: UI_ONLY_NOTICE,
    },
    lastDeletionOperation: null,
  };
}

export function getLocalModules() {
  return { modules: MODULE_CATALOG.map((m) => ({ ...m })) };
}

function resolveModuleKeys(payload) {
  if (payload.mode === 'all') {
    return MODULE_CATALOG.map((m) => m.key);
  }
  return payload.modules || [];
}

export function buildLocalDeletionPreview(payload) {
  const keys = resolveModuleKeys(payload);
  if (!keys.length) {
    throw new Error('Select at least one module.');
  }

  const byKey = Object.fromEntries(MODULE_CATALOG.map((m) => [m.key, m]));
  const rows = keys
    .filter((k) => byKey[k])
    .map((key) => {
      const mod = byKey[key];
      return {
        moduleKey: key,
        moduleName: mod.name,
        directRecords: 0,
        dependentRecords: 0,
        estimatedTotal: 0,
        relatedTables: mod.relatedTables,
        dateFilterApplied: payload.mode === 'date_range' && Boolean(payload.fromDate || payload.toDate),
        notes: UI_ONLY_NOTICE,
      };
    });

  const previewId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `preview-${Date.now()}`;

  return {
    previewId,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    mode: payload.mode,
    rows,
    totalEstimated: 0,
    dependencySummary: 'Counts unavailable until backend preview is connected.',
    protectedSummary: 'Authentication, roles, tenant configuration, and audit logs remain protected.',
    canConfirm: rows.length > 0,
    backup: getLocalOverview().backup,
  };
}

export function buildLocalExecuteResult(preview) {
  return {
    success: true,
    status: 'UI_ONLY',
    operationId: preview?.previewId,
    recordsDeleted: 0,
    failedModules: 0,
    message: UI_ONLY_NOTICE,
  };
}

export function createLocalHistoryEntry(preview) {
  return {
    id: `local-${Date.now()}`,
    action: 'DATA_DELETION_UI_PREVIEW',
    module: preview?.mode === 'all' ? 'ALL' : (preview?.rows || []).map((r) => r.moduleKey).join(', '),
    status: 'UI_ONLY',
    timestamp: new Date().toISOString(),
    performedBy: 'Admin (session)',
    details: { notice: UI_ONLY_NOTICE, previewId: preview?.previewId },
  };
}
