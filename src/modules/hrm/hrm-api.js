import axios from 'axios';
import api from '../../../lib/api';

export function hrmError(error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const raw = error.response?.data?.message ?? error.response?.data?.errors;
    const text = Array.isArray(raw) ? raw.map(String).join('. ') : typeof raw === 'string' ? raw : '';
    if (status === 401) return 'Your session has expired. Please sign in again.';
    if (status === 403) return text || 'You do not have permission for this HRM action.';
    if (status === 404) return text || 'The requested HRM record was not found.';
    if (status === 409) return text || 'This record already exists.';
    if (status === 400) return text || 'The HRM request was rejected. Check the details and try again.';
    if (status && status >= 500) return text || 'The server could not complete this HRM request.';
    if (!error.response) return 'Unable to reach the server. Check your connection and retry.';
    return text || 'The HRM request failed. Please try again.';
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function listFrom(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (payload.data && Array.isArray(payload.data.employees)) return payload.data.employees;
  if (payload.data && Array.isArray(payload.data.allBreaks)) return payload.data.allBreaks;
  return [];
}

function clock(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function minutesLabel(minutes) {
  const value = Number(minutes) || 0;
  return `${Math.floor(value / 60)}h ${value % 60}m`;
}

function personName(record) {
  return record?.name || `${record?.firstName || ''} ${record?.lastName || ''}`.trim() || 'Employee';
}

export async function loadEmployees(params = {}) {
  const payload = await api.get('/employees', { params: { page: 1, limit: 100, ...params } });
  return listFrom(payload).map((employee) => {
    const status = String(employee.status || 'ACTIVE').toLowerCase();
    return {
      ...employee,
      recordId: employee.id,
      id: String(employee.employeeCode || employee.employeeId || employee.id),
      firstName: employee.firstName || personName(employee).split(' ')[0] || '—',
      lastName: employee.lastName || personName(employee).split(' ').slice(1).join(' '),
      name: personName(employee),
      department: typeof employee.department === 'string' ? employee.department : employee.departmentName || employee.department?.name || 'General',
      designation: typeof employee.designation === 'string' ? employee.designation : employee.designationName || employee.designation?.name || 'Staff',
      status: status === 'active' ? 'active' : status === 'on_leave' || status === 'on leave' ? 'on_leave' : status,
      employmentType: employee.employmentType || '—',
      joinDate: employee.joiningDate ? String(employee.joiningDate).slice(0, 10) : '—',
      phone: employee.phone || '—',
      email: employee.email || '—',
      registeredSalary: employee.registeredSalary ?? employee.salary?.registered ?? employee.salary?.basic ?? null,
      salary: employee.salary || null,
    };
  });
}

export async function createEmployee(values) {
  await api.post('/employees', values);
}

export function updateEmployee(id, values) {
  return api.patch(`/employees/${id}`, values);
}

export function deactivateEmployee(id) {
  return api.delete(`/employees/${id}`);
}

export async function loadLiveDashboard(date) {
  const payload = await api.get('/admin/hrms/live-dashboard', { params: date ? { date } : {} });
  const body = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
  const employees = Array.isArray(body?.employees) ? body.employees : [];
  return {
    summary: body?.summary || {},
    offices: Array.isArray(body?.offices) ? body.offices : [],
    records: employees.map((employee) => ({
      employeeName: personName(employee),
      employeeId: String(employee.employeeCode || employee.id),
      department: employee.department || 'General',
      punchIn: clock(employee.punchIn),
      punchOut: clock(employee.punchOut),
      breakDuration: minutesLabel(employee.totalBreakMinutesToday),
      workingHours: minutesLabel(employee.workingMinutes),
      lateDuration: employee.isLate ? `${employee.lateMinutes || 0}m` : '',
      status: employee.isLate ? 'late' : String(employee.attendanceStatus || employee.currentStatus || 'absent').toLowerCase(),
    })),
  };
}

export async function loadBreaks(date) {
  const payload = await api.get('/admin/hrms/live-breaks', { params: date ? { date } : {} });
  const body = payload?.data && !Array.isArray(payload.data) ? payload.data : {};
  const rows = Array.isArray(body.allBreaks) ? body.allBreaks : listFrom(payload);
  return {
    active: body.onBreakCount || 0,
    records: rows.map((item, index) => ({
      id: String(item.id || `${item.employeeId}-${index}`),
      employeeId: String(item.employeeCode || item.employeeId || ''),
      employeeName: item.employeeName || 'Employee',
      department: item.department || 'General',
      breakType: 'Recorded break',
      startTime: clock(item.breakStart),
      endTime: item.breakEnd ? clock(item.breakEnd) : 'In progress',
      duration: `${Number(item.duration || item.currentBreakMinutes || 0)}m`,
      status: item.breakEnd ? 'completed' : 'active',
      overstayMinutes: 0,
    })),
  };
}

export async function loadLeaves() {
  const payload = await api.get('/leaves/requests', { params: { page: 1, limit: 100 } });
  return listFrom(payload).map((leave) => ({
    ...leave,
    recordId: leave.id,
    id: String(leave.id),
    employeeId: String(leave.employeeCode || leave.employeeId || ''),
    employeeName: leave.employeeName || 'Employee',
    department: leave.department || 'General',
    leaveType: typeof leave.leaveType === 'string' ? leave.leaveType : leave.leaveType?.name || 'Leave',
    startDate: leave.fromDate || leave.startDate || '',
    endDate: leave.toDate || leave.endDate || '',
    totalDays: Number(leave.days ?? leave.totalDays ?? 0),
    reason: leave.reason || '',
    status: String(leave.status || '').toLowerCase(),
    appliedOn: leave.createdAt ? String(leave.createdAt).slice(0, 10) : '',
  }));
}

export function decideLeave(id, approve, reason) {
  return api.patch(approve ? `/leaves/requests/${id}/approve` : `/leaves/requests/${id}/reject`, approve ? {} : { reason: reason || 'Rejected' });
}

export function submitLeave(values) {
  return api.post('/leaves/requests', values);
}

export async function loadClaims() {
  const payload = await api.get('/claims', { params: { page: 1, limit: 100 } });
  return listFrom(payload).map((claim) => ({
    ...claim,
    recordId: claim.id,
    id: String(claim.id),
    employeeName: claim.employeeName || 'Employee',
    department: claim.department || 'General',
    category: claim.category || '—',
    description: claim.description || '',
    amount: Number(claim.amount || 0),
    status: String(claim.status || '').toLowerCase(),
    claimDate: claim.claimDate ? String(claim.claimDate).slice(0, 10) : '',
  }));
}

export function decideClaim(id, approve, note) {
  return api.patch(approve ? `/claims/${id}/approve` : `/claims/${id}/reject`, { remarks: note || undefined, reason: note || undefined });
}

export async function loadPayrollItems() {
  const payload = await api.get('/admin/payroll', { params: { page: 1, limit: 20 } });
  const batches = listFrom(payload);
  return batches.flatMap((batch) => (batch.items || []).map((item) => {
    const employee = item.employee || {};
    const month = `${batch.month}/${batch.year}`;
    return {
      recordId: item.id,
      id: String(item.id),
      employeeName: personName(employee),
      employeeId: String(employee.employeeCode || employee.id || ''),
      department: employee.department?.name || 'General',
      registeredSalary: Number(item.registeredSalary || item.basicSalary || 0),
      basicSalary: Number(item.basicSalary || 0),
      allowances: 0,
      overtimePay: Number(item.commission || 0),
      reimbursements: Number(item.reimbursement || 0),
      grossPay: Number(item.grossSalary || 0),
      totalDeductions: Number(item.totalDeductions || 0),
      deductions: { tax: 0 },
      netPay: Number(item.netSalary || 0),
      status: String(item.status || batch.status || '').toLowerCase(),
      month,
      paymentDate: item.paidAt ? String(item.paidAt).slice(0, 10) : '',
    };
  }));
}

export function payPayrollItem(id) {
  return api.post(`/admin/payroll/items/${id}/pay`, {});
}

function targetPayload(payload) {
  if (payload?.rows) return payload;
  if (payload?.data?.rows) return payload.data;
  return payload?.data || payload || { rows: [], employees: [], teams: [] };
}

export async function loadSalaryTargets(month, year) {
  const payload = await api.get('/admin/payroll/targets', { params: { month, year } });
  return targetPayload(payload);
}

export function saveSalaryTarget(body) {
  return api.post('/admin/payroll/targets', body);
}

export function approveSalaryTarget(body) {
  return api.post('/admin/payroll/targets/approve', body);
}

export async function loadSalarySlips() {
  const payload = await api.get('/admin/payroll/slips', { params: { page: 1, limit: 100 } });
  return listFrom(payload).map((slip) => {
    const employee = slip.employee || {};
    return {
      recordId: slip.id,
      id: String(slip.slipNumber || slip.id),
      employeeName: personName(employee),
      employeeId: String(employee.employeeCode || slip.employeeId || ''),
      department: employee.department?.name || 'General',
      month: slip.payPeriod || '',
      grossPay: Number(slip.grossSalary || 0),
      totalDeductions: Number(slip.totalDeductions || 0),
      netPay: Number(slip.netSalary || 0),
      status: String(slip.status || '').toLowerCase(),
      registeredSalary: Number(slip.registeredSalary || slip.basicSalary || 0),
      basicSalary: Number(slip.basicSalary || 0),
      allowances: Number(slip.allowances || 0),
      deductions: { tax: 0 },
    };
  });
}

export async function loadReportSummary() {
  const payload = await api.get('/reports/summary');
  return payload?.data?.workforce ? payload.data : payload?.workforce ? payload : payload?.data || {};
}

export async function loadReport(type) {
  const payload = await api.get('/reports/data', { params: { type, page: 1, limit: 100 } });
  return listFrom(payload);
}

export async function loadOffices() {
  const payload = await api.get('/offices', { params: { page: 1, limit: 100 } });
  return listFrom(payload).map((office) => ({
    id: office.id,
    name: office.name,
    code: office.code || '—',
    head: [office.city, office.state].filter(Boolean).join(', ') || '—',
    members: office.employeesCount || 0,
    status: office.isActive === false ? 'Inactive' : 'Active',
    createdOn: office.createdAt ? String(office.createdAt).slice(0, 10) : '',
    description: [office.address, office.city].filter(Boolean).join(', '),
  }));
}

export async function loadTeams() {
  const payload = await api.get('/teams', { params: { page: 1, limit: 100 } });
  return listFrom(payload).map((team) => ({
    id: team.id,
    name: team.name,
    code: team.code || `TEAM-${team.id}`,
    head: team.leader?.name || team.leaderName || 'Unassigned',
    members: team.membersCount ?? team._count?.members ?? (Array.isArray(team.members) ? team.members.length : 0),
    status: team.isActive === false ? 'Inactive' : 'Active',
    createdOn: team.createdAt ? String(team.createdAt).slice(0, 10) : '',
    description: team.description || '',
  }));
}

export function saveOffice(values, id) {
  const body = { name: values.name, code: values.code || undefined, address: values.description || undefined, city: values.head || undefined, isActive: values.status !== 'Inactive' };
  return id ? api.patch(`/offices/${id}`, body) : api.post('/offices', body);
}

export function removeOffice(id) {
  return api.delete(`/offices/${id}`);
}

export function saveTeam(values, id) {
  const body = { name: values.name, description: values.description || undefined, isActive: values.status !== 'Inactive' };
  return id ? api.patch(`/teams/${id}`, body) : api.post('/teams', body);
}

export function removeTeam(id) {
  return api.delete(`/teams/${id}`);
}

function objectFrom(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) return payload.data;
  return payload;
}

export function sessionCanAction(moduleName, action) {
  if (typeof window === 'undefined') return false;
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('quikboom-next-auth-storage') || '{}')?.state?.user || null;
  } catch {
    user = null;
  }
  if (!user) return false;
  const wanted = String(action || '').toUpperCase();
  const permissions = Array.isArray(user.permissions) ? user.permissions : null;
  if (permissions) {
    return permissions.some((permission) => {
      const code = String(typeof permission === 'string' ? permission : permission?.code || `${permission?.module}:${permission?.action}`).toUpperCase();
      const [module, permissionAction] = code.split(':');
      return code === '*' || ((module === String(moduleName).toUpperCase() || module === 'HRM') && ['ALL', 'MANAGE', wanted, wanted === 'EDIT' ? 'UPDATE' : 'DEACTIVATE'].includes(permissionAction));
    });
  }
  return sessionCan(moduleName);
}

export function sessionCan(moduleName) {
  if (typeof window === 'undefined') return false;
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('quikboom-next-auth-storage') || '{}')?.state?.user || null;
  } catch {
    user = null;
  }
  if (!user) return false;
  const role = String(user.role || user.accountType || '').toUpperCase();
  const employeeOnly = role === 'EMPLOYEE' || String(user.roleType || '').toUpperCase() === 'EMPLOYEE';
  const permissions = Array.isArray(user.permissions) ? user.permissions : null;
  if (permissions) {
    return permissions.some((permission) => {
      const code = String(typeof permission === 'string' ? permission : permission?.code || `${permission?.module}:${permission?.action}`).toUpperCase();
      return code === '*' || code.startsWith(`${String(moduleName).toUpperCase()}:`) || code.includes(String(moduleName).toUpperCase());
    });
  }
  return !employeeOnly;
}

export async function loadShifts(params = {}) {
  const [list, metrics] = await Promise.all([
    api.get('/shifts', { params }),
    api.get('/shifts/metrics'),
  ]);
  return { rows: listFrom(list), metrics: objectFrom(metrics) };
}

export async function loadShift(id) {
  const payload = await api.get(`/shifts/${id}`);
  return objectFrom(payload);
}

export function saveShift(values, id) {
  const body = {
    name: values.name,
    code: values.code,
    startTime: values.startTime,
    endTime: values.endTime,
    durationHours: values.durationHours === '' ? undefined : Number(values.durationHours),
    breakDurationMinutes: values.breakDurationMinutes === '' ? undefined : Number(values.breakDurationMinutes),
    gracePeriodMinutes: values.gracePeriodMinutes === '' ? undefined : Number(values.gracePeriodMinutes),
    status: values.status || 'ACTIVE',
    isNightShift: Boolean(values.isNightShift),
    isRotational: Boolean(values.isRotational),
    workingDays: values.workingDays,
    notes: values.notes || undefined,
  };
  return id ? api.patch(`/shifts/${id}`, body) : api.post('/shifts', body);
}

export function removeShift(id) {
  return api.delete(`/shifts/${id}`);
}

export function assignShift(id, employeeIds) {
  return api.post(`/shifts/${id}/assign`, { employeeIds: employeeIds.map(Number) });
}

export async function loadRemoteRequests(params = {}) {
  const payload = await api.get('/remote-requests', { params });
  return {
    rows: listFrom(payload),
    summary: payload?.summary || {},
    pagination: payload?.pagination || payload?.meta || {},
  };
}

export function submitRemoteRequest(values) {
  return api.post('/remote-requests', values);
}

export function decideRemoteRequest(id, approve, rejectionReason) {
  return approve
    ? api.patch(`/remote-requests/${id}/approve`)
    : api.patch(`/remote-requests/${id}/reject`, { rejectionReason });
}

export async function loadLiveLocations() {
  const payload = await api.get('/admin/location/live');
  return listFrom(payload);
}

export async function loadLocationHistory(employeeId, date) {
  const payload = await api.get('/admin/location/history', { params: { employeeId, date } });
  return listFrom(payload);
}

export async function loadGeofences() {
  const payload = await api.get('/admin/branches');
  return listFrom(payload);
}

export function saveGeofence(values) {
  return api.post('/admin/branches', {
    name: values.name,
    city: values.city || undefined,
    latitude: Number(values.latitude),
    longitude: Number(values.longitude),
    radiusMeters: values.radiusMeters === '' ? undefined : Number(values.radiusMeters),
  });
}

export async function loadCommissions(params = {}) {
  const payload = await api.get('/commissions/admin', { params });
  return {
    rows: listFrom(payload),
    summary: payload?.summary || {},
    pagination: payload?.meta || payload?.pagination || {},
  };
}

export function updateCommissionStatus(id, status, notes) {
  return api.patch(`/commissions/${id}/status`, { status, notes: notes || undefined });
}

export async function loadCommissionConfigs() {
  const [designations, employees] = await Promise.all([
    api.get('/commissions/configs/designations'),
    api.get('/commissions/configs/employees'),
  ]);
  return { designations: listFrom(designations), employees: listFrom(employees) };
}

export function saveDesignationCommission(values) {
  return api.patch(`/commissions/configs/designations/${values.designationId}`, {
    designationId: Number(values.designationId),
    commissionEnabled: Boolean(values.commissionEnabled),
    commissionType: values.commissionType,
    commissionRate: Number(values.commissionRate),
  });
}

export function saveEmployeeCommission(values) {
  return api.post('/commissions/configs/employees', {
    employeeId: Number(values.employeeId),
    commissionType: values.commissionType,
    commissionValue: Number(values.commissionValue),
    status: values.status || 'ACTIVE',
  });
}

export async function loadLoans(params = {}) {
  const [list, metrics, types] = await Promise.all([
    api.get('/admin/loans', { params }),
    api.get('/admin/loans/metrics'),
    api.get('/master/loan-types'),
  ]);
  return {
    rows: listFrom(list),
    metrics: objectFrom(metrics),
    types: listFrom(types),
    pagination: list?.pagination || list?.meta || {},
  };
}

export function submitLoan(values) {
  return api.post('/admin/loans', values);
}

export function approveLoan(id, values) {
  return api.patch(`/admin/loans/${id}/approve`, values);
}

export function rejectLoan(id, rejectionReason) {
  return api.patch(`/admin/loans/${id}/reject`, { rejectionReason });
}

export function removeLoan(id) {
  return api.delete(`/admin/loans/${id}`);
}

export async function loadOvertime(params = {}) {
  const [list, summary] = await Promise.all([
    api.get('/admin/hrm/overtime', { params }),
    api.get('/admin/hrm/overtime/summary', { params }),
  ]);
  return { rows: listFrom(list), summary: objectFrom(summary), pagination: list?.meta || list?.data?.meta || {} };
}

export async function loadOvertimeRequest(id) {
  return objectFrom(await api.get(`/admin/hrm/overtime/${id}`));
}

export function createOvertime(values) {
  return api.post('/admin/hrm/overtime', values);
}

export function approveOvertime(id, values) {
  return api.patch(`/admin/hrm/overtime/${id}/approve`, values);
}

export function rejectOvertime(id, values) {
  return api.patch(`/admin/hrm/overtime/${id}/reject`, values);
}

export function cancelOvertime(id, values = {}) {
  return api.patch(`/admin/hrm/overtime/${id}/cancel`, values);
}

export async function previewOvertime(id, approvedMinutes) {
  return objectFrom(await api.get(`/admin/hrm/overtime/${id}/preview`, { params: { approvedMinutes } }));
}

export async function loadAnnouncements(params = {}) {
  const [list, summary] = await Promise.all([
    api.get('/admin/hrm/announcements', { params }),
    api.get('/admin/hrm/announcements/summary', { params }),
  ]);
  return { rows: listFrom(list), summary: objectFrom(summary), pagination: list?.meta || {} };
}

export const loadAnnouncement = async (id) => objectFrom(await api.get(`/admin/hrm/announcements/${id}`));
export const createAnnouncement = (values) => api.post('/admin/hrm/announcements', values);
export const updateAnnouncement = (id, values) => api.patch(`/admin/hrm/announcements/${id}`, values);
export const publishAnnouncement = (id) => api.patch(`/admin/hrm/announcements/${id}/publish`);
export const scheduleAnnouncement = (id, publishAt) => api.patch(`/admin/hrm/announcements/${id}/schedule`, { publishAt });
export const archiveAnnouncement = (id) => api.patch(`/admin/hrm/announcements/${id}/archive`);
export const removeAnnouncement = (id) => api.delete(`/admin/hrm/announcements/${id}`);

export const missingHrmApis = {
  overtime: '',
  announcements: '',
  attendanceCorrection: 'The attendance API records punch in, punch out, and breaks. It does not provide an admin correction endpoint.',
  breakPolicy: 'Break history comes from live attendance. There is no separate break-policy configuration API.',
  shiftHistory: 'Shift assignment is current. The API does not return a separate shift-change history.',
  loanRepayment: 'Loan records include EMI, tenure, and remaining balance. There is no repayment-transaction history API.',
  loanTypeField: 'Loan types come from master data. A loan record does not store a loan-type id, so the selected scheme is saved in the loan notes with its rate and tenure.',
  loanPayroll: 'Approving a loan stores EMI and remaining balance. Payroll does not expose a separate loan-deduction posting API.',
  geoMap: 'Google Maps renders only when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is configured. Coordinates are still listed from the location API.',
};
