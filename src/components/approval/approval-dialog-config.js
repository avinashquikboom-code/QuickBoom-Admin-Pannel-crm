import { formatCurrency } from '@/lib/currency';

/** @typedef {'overtime' | 'leave' | 'expense' | 'payroll-batch' | 'generic'} RequestType */

/**
 * @typedef {object} RequestDecisionCopy
 * @property {string} title
 * @property {string} description
 * @property {string} primaryLabel
 * @property {string} noteLabel
 * @property {string} notePlaceholder
 * @property {boolean} noteRequired
 * @property {Array<{ label: string, value: string, highlight?: boolean, fullWidth?: boolean }>} summary
 */

const MAX_NOTE = 500;

export { MAX_NOTE };

/**
 * @param {import('@/lib/mock-data').OvertimeRequest | Record<string, unknown>} item
 * @param {'approve' | 'reject'} mode
 * @returns {RequestDecisionCopy}
 */
export function overtimeDecisionCopy(item, mode) {
  const hours = item?.hours;
  const amount = formatCurrency(item?.estimatedAmount);

  if (mode === 'approve') {
    return {
      title: `Approve Overtime (${hours}h)`,
      description: `Authorize payment of ${amount} for ${item?.employeeName} under project "${item?.project}".`,
      primaryLabel: 'Approve & Credit',
      noteLabel: 'Optional Manager Note',
      notePlaceholder: 'e.g. Critical release crunch approved.',
      noteRequired: false,
      summary: [
        { label: 'Employee Name', value: item?.employeeName },
        { label: 'Project', value: item?.project },
        { label: 'Overtime Hours', value: `${hours}h`, highlight: true },
        { label: 'Requested Amount', value: amount, highlight: true },
        { label: 'Request Date', value: item?.date, fullWidth: true },
      ],
    };
  }

  return {
    title: 'Reject Overtime Request',
    description: `Decline overtime request for ${item?.employeeName}. Provide a clear rejection reason for the employee record.`,
    primaryLabel: 'Reject Request',
    noteLabel: 'Reason for Rejection',
    notePlaceholder: 'Please explain why this request is being rejected...',
    noteRequired: true,
    summary: [
      { label: 'Employee Name', value: item?.employeeName },
      { label: 'Project', value: item?.project },
      { label: 'Overtime Hours', value: `${hours}h` },
      { label: 'Requested Amount', value: amount },
      { label: 'Request Date', value: item?.date, fullWidth: true },
    ],
  };
}

/**
 * @param {Record<string, unknown>} item
 * @param {'approve' | 'reject'} mode
 * @returns {RequestDecisionCopy}
 */
export function leaveDecisionCopy(item, mode) {
  const days = item?.totalDays;

  if (mode === 'approve') {
    return {
      title: `Approve Leave Request (${days} ${days === 1 ? 'Day' : 'Days'})`,
      description: `Grant ${days} day(s) of ${item?.leaveType} to ${item?.employeeName} from ${item?.startDate} to ${item?.endDate}.`,
      primaryLabel: 'Approve Leave',
      noteLabel: 'Optional Manager Note',
      notePlaceholder: 'e.g. Coverage arranged with the team lead.',
      noteRequired: false,
      summary: [
        { label: 'Employee Name', value: item?.employeeName },
        { label: 'Leave Type', value: item?.leaveType },
        { label: 'From Date', value: item?.startDate },
        { label: 'To Date', value: item?.endDate },
        { label: 'Total Days', value: `${days} ${days === 1 ? 'Day' : 'Days'}`, highlight: true, fullWidth: true },
      ],
    };
  }

  return {
    title: 'Reject Leave Request',
    description: `Decline leave application for ${item?.employeeName}. A rejection reason is required.`,
    primaryLabel: 'Reject Leave',
    noteLabel: 'Reason for Rejection',
    notePlaceholder: 'Please explain why this request is being rejected...',
    noteRequired: true,
    summary: [
      { label: 'Employee Name', value: item?.employeeName },
      { label: 'Leave Type', value: item?.leaveType },
      { label: 'From Date', value: item?.startDate },
      { label: 'To Date', value: item?.endDate },
      { label: 'Total Days', value: `${days} ${days === 1 ? 'Day' : 'Days'}`, fullWidth: true },
    ],
  };
}

/**
 * @param {Record<string, unknown>} item
 * @param {'approve' | 'reject'} mode
 * @returns {RequestDecisionCopy}
 */
export function expenseDecisionCopy(item, mode) {
  const amount = formatCurrency(item?.amount);

  if (mode === 'approve') {
    return {
      title: `Approve Expense Claim (${amount})`,
      description: `Approve reimbursement for ${item?.employeeName} under "${item?.category}".`,
      primaryLabel: 'Approve & Reimburse',
      noteLabel: 'Optional Manager Note',
      notePlaceholder: 'e.g. Verified receipt and manager clearance.',
      noteRequired: false,
      summary: [
        { label: 'Employee Name', value: item?.employeeName },
        { label: 'Expense Category', value: item?.category },
        { label: 'Requested Amount', value: amount, highlight: true },
        { label: 'Submission Date', value: item?.date },
      ],
    };
  }

  return {
    title: 'Reject Expense Claim',
    description: `Decline expense claim for ${item?.employeeName}. Specify the compliance or policy reason.`,
    primaryLabel: 'Reject Claim',
    noteLabel: 'Reason for Rejection',
    notePlaceholder: 'Please explain why this request is being rejected...',
    noteRequired: true,
    summary: [
      { label: 'Employee Name', value: item?.employeeName },
      { label: 'Expense Category', value: item?.category },
      { label: 'Requested Amount', value: amount },
      { label: 'Submission Date', value: item?.date },
    ],
  };
}

/**
 * @param {RequestType} requestType
 * @param {Record<string, unknown>} item
 * @param {'approve' | 'reject'} mode
 * @returns {RequestDecisionCopy}
 */
export function getRequestDecisionCopy(requestType, item, mode) {
  switch (requestType) {
    case 'overtime':
      return overtimeDecisionCopy(item, mode);
    case 'leave':
      return leaveDecisionCopy(item, mode);
    case 'expense':
      return expenseDecisionCopy(item, mode);
    default:
      return {
        title: mode === 'approve' ? 'Confirm Approval' : 'Confirm Rejection',
        description: 'Review the request details before continuing.',
        primaryLabel: mode === 'approve' ? 'Confirm Approval' : 'Reject Request',
        noteLabel: mode === 'approve' ? 'Optional Manager Note' : 'Reason for Rejection',
        notePlaceholder:
          mode === 'approve'
            ? 'Add an optional note for the employee record.'
            : 'Please explain why this request is being rejected...',
        noteRequired: mode === 'reject',
        summary: [],
      };
  }
}
