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
  const isImported = !isRejected && (Boolean(linkedLeadId) || record?.isImported === true || status === 'LEAD_CREATED');
  return {
    status,
    leadId: linkedLeadId,
    displayStatus: isImported ? 'LEAD_CREATED' : status || 'UNKNOWN',
    isRejected,
    isImported,
    isValidated: !isImported && status === 'VALIDATED',
    canDecide: !isImported && ['CAPTURED', 'PENDING', 'NEW'].includes(status),
  };
}
