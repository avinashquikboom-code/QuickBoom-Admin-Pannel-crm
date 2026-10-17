/** Uses DataCapturePlace.status and isImported from the list/detail API contract. */
export function getDataCaptureWorkflow(record?: {
  status?: string | null;
  isImported?: boolean;
  importedLeadId?: number;
} | null) {
  const status = String(record?.status ?? '').trim().toUpperCase();
  const isRejected = status === 'REJECTED';
  const leadId = Number(record?.importedLeadId);
  const linkedLeadId = Number.isInteger(leadId) && leadId > 0 ? leadId : null;
  const isImported = !isRejected && (Boolean(linkedLeadId) || record?.isImported === true || ['LEAD_CREATED', 'LEAD_IMPORTED'].includes(status));
  const isValidated = !isImported && status === 'VALIDATED';
  const canDecide = !isImported && ['CAPTURED', 'PENDING', 'NEW'].includes(status);
  const isDuplicate = !isImported && status === 'DUPLICATE';

  return {
    status,
    leadId: linkedLeadId,
    displayStatus: isImported ? 'LEAD_IMPORTED' : status || 'UNKNOWN',
    isRejected,
    isImported,
    isValidated,
    canDecide,
    isDuplicate,
  };
}

export function normalizeDataCaptureStatus(record?: {
  status?: string | null;
  isImported?: boolean;
  importedLeadId?: number;
} | null): string {
  const wf = getDataCaptureWorkflow(record);
  if (wf.isImported) return 'LEAD_IMPORTED';
  if (wf.isValidated) return 'VALIDATED';
  if (wf.isRejected) return 'REJECTED';
  if (wf.isDuplicate) return 'DUPLICATE';
  return 'CAPTURED';
}

export function isCaptured(record?: any): boolean {
  return getDataCaptureWorkflow(record).canDecide;
}

export function isValidated(record?: any): boolean {
  return getDataCaptureWorkflow(record).isValidated;
}

export function isLeadImported(record?: any): boolean {
  return getDataCaptureWorkflow(record).isImported;
}

export function isRejected(record?: any): boolean {
  return getDataCaptureWorkflow(record).isRejected;
}

export function isDuplicate(record?: any): boolean {
  return getDataCaptureWorkflow(record).isDuplicate;
}

/** Only visible, selected rows can participate in page-scoped bulk actions. */
export function getDataCaptureSelection<T extends { id?: number; status?: string | null; isImported?: boolean; importedLeadId?: number }>(records: T[], ids: number[]) {
  const selected = records.filter(record => record.id != null && ids.includes(Number(record.id)));
  return {
    selected,
    captured: selected.filter(record => isCaptured(record)),
    validated: selected.filter(record => isValidated(record)),
    imported: selected.filter(record => isLeadImported(record)),
    rejected: selected.filter(record => isRejected(record)),
    duplicate: selected.filter(record => isDuplicate(record)),
    deletable: selected.filter(record => !isLeadImported(record)),
  };
}
