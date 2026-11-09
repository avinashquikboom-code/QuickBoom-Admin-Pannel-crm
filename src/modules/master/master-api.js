import api from '../../../lib/api';
import { hrmError, listFrom, sessionCan } from '@/modules/hrm/hrm-api';

export { hrmError as masterError, sessionCan };

function objectFrom(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) return payload.data;
  return payload;
}

export const MASTER_MODULES = {
  'employee-types': {
    type: 'EMPLOYEE_TYPE',
    path: '/master/employee-types',
    metricKey: 'employeeCount',
    metricLabel: 'Staff count',
    categoryLabel: 'Classification',
  },
  'work-types': {
    type: 'WORK_TYPE',
    path: '/master/work-types',
    metricKey: 'itemCount',
    metricLabel: 'Work items',
    categoryLabel: 'Category',
  },
  'loan-types': {
    type: 'LOAN_TYPE',
    path: '/master/loan-types',
    metricKey: null,
    metricLabel: 'Interest',
    categoryLabel: 'Category',
  },
  'payment-methods': {
    type: 'PAYMENT_METHOD',
    path: '/master/payment-methods',
    metricKey: 'transactionsCount',
    metricLabel: 'Transactions',
    categoryLabel: 'Settlement type',
  },
};

export async function loadMasterItems(slug) {
  const module = MASTER_MODULES[slug];
  const payload = await api.get(module.path);
  return {
    rows: listFrom(payload).map((row) => normalizeMasterRow(row)),
    extra: {
      activeLoansCount: payload?.activeLoansCount ?? payload?.data?.activeLoansCount,
      gatewayConfig: payload?.gatewayConfig || payload?.data?.gatewayConfig || null,
    },
  };
}

export function normalizeMasterRow(row) {
  const meta = row?.meta && typeof row.meta === 'object' ? row.meta : {};
  return {
    ...row,
    meta,
    status: row.isActive === false ? 'Inactive' : 'Active',
    category: row.category || row.type || '',
    maxMonths: row.maxMonths ?? meta.maxMonths ?? '',
    interestRate: row.interestRate ?? meta.interestRate ?? '',
    requiresApproval: row.requiresApproval ?? meta.requiresApproval ?? false,
    mode: row.mode || meta.mode || '',
  };
}

export function saveMasterItem(slug, values, existing) {
  const module = MASTER_MODULES[slug];
  const meta = { ...(existing?.meta || {}) };
  if (slug === 'loan-types') {
    meta.maxMonths = Number(values.maxMonths);
    meta.interestRate = Number(values.interestRate);
    meta.requiresApproval = values.requiresApproval === true;
  }
  if (slug === 'payment-methods' && values.mode) meta.mode = values.mode;
  const body = {
    type: module.type,
    name: values.name.trim(),
    code: values.code.trim(),
    category: values.category?.trim() || null,
    description: values.description?.trim() || null,
    sortOrder: values.sortOrder === '' || values.sortOrder === undefined ? 0 : Number(values.sortOrder),
    isActive: values.isActive !== false,
    meta,
  };
  return existing?.id ? api.patch(`/master/items/${existing.id}`, body) : api.post('/master/items', body);
}

export const removeMasterItem = (id) => api.delete(`/master/items/${id}`);

export async function loadDesignations(params) {
  const payload = await api.get('/designations', { params });
  const rows = listFrom(payload).map((row) => ({
    ...row,
    status: row.isActive === false || String(row.status || '').toUpperCase() === 'INACTIVE' ? 'Inactive' : 'Active',
  }));
  const meta = payload?.meta || payload?.data?.meta || {};
  return { rows, meta };
}

export async function loadDesignation(id) {
  return objectFrom(await api.get(`/designations/${id}`));
}

export function saveDesignation(values, id) {
  const body = {
    name: values.name.trim(),
    code: values.code?.trim() || undefined,
    departmentId: values.departmentId ? Number(values.departmentId) : undefined,
    description: values.description?.trim() || undefined,
    level: values.level === '' || values.level === undefined ? undefined : Number(values.level),
    isActive: values.isActive !== false,
    crmMobileAccess: values.crmMobileAccess === true,
  };
  return id ? api.patch(`/designations/${id}`, body) : api.post('/designations', body);
}

export const removeDesignation = (id) => api.delete(`/designations/${id}`);

export async function loadDepartments() {
  const payload = await api.get('/departments', { params: { page: 1, limit: 100, isActive: true } });
  return listFrom(payload);
}

export async function loadLeavePolicyScreen() {
  const [policies, types] = await Promise.all([
    api.get('/leaves/policies'),
    api.get('/leaves/types'),
  ]);
  const overview = objectFrom(policies);
  const leave = overview.leave || policies?.leave || null;
  return {
    policy: leave,
    persisted: Boolean(leave?.id),
    leaveTypes: listFrom(types),
  };
}

export function saveLeavePolicy(values) {
  return api.post('/leaves/policies/leave', {
    name: values.name?.trim() || undefined,
    officeId: values.officeId ? Number(values.officeId) : null,
    allowHalfDay: values.allowHalfDay === true,
    allowBackdatedLeave: values.allowBackdatedLeave === true,
    maxBackdatedDays: Number(values.maxBackdatedDays),
    allowFutureLeave: values.allowFutureLeave === true,
    maxFutureDays: Number(values.maxFutureDays),
    allowProbationLeave: values.allowProbationLeave === true,
    includeHolidaysInLeave: values.includeHolidaysInLeave === true,
    includeWeekendsInLeave: values.includeWeekendsInLeave === true,
    minNoticePeriodDays: Number(values.minNoticePeriodDays),
    maxConsecutiveDays: Number(values.maxConsecutiveDays),
    requiresManagerApproval: values.requiresManagerApproval === true,
    requiresHrApproval: values.requiresHrApproval === true,
    requiresAttachmentAboveDays: Number(values.requiresAttachmentAboveDays),
    isActive: values.isActive !== false,
  });
}

export function downloadCsv(filename, rows) {
  const headers = Object.keys(rows[0] || {});
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((key) => {
      const value = row[key] == null ? '' : String(row[key]);
      return `"${value.replaceAll('"', '""')}"`;
    }).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
