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

function registeredSalaryOf(employee) {
  const structure = Array.isArray(employee.salaryStructures) ? employee.salaryStructures[0] : employee.salaryStructure;
  const candidates = [employee.registeredSalary, employee.monthlySalary, employee.salary?.registered, employee.salary?.gross, employee.salary?.basic, structure?.grossSalary, structure?.basicSalary];
  const found = candidates.find((value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)));
  return found == null ? null : Number(found);
}

export async function loadEmployees(params = {}) {
  const payload = await api.get('/employees', { params: { page: 1, limit: 100, ...params } });
  return listFrom(payload).map((employee) => {
    const status = String(employee.status || 'ACTIVE').toLowerCase();
    const shiftName =
      employee.shiftName ||
      (typeof employee.shift === 'string' ? employee.shift : employee.shift?.name) ||
      employee.shiftObj?.name ||
      null;
    const shiftTiming =
      employee.shiftObj?.startTime && employee.shiftObj?.endTime
        ? `${employee.shiftObj.startTime} - ${employee.shiftObj.endTime}`
        : employee.shift?.startTime && employee.shift?.endTime
        ? `${employee.shift.startTime} - ${employee.shift.endTime}`
        : null;

    return {
      ...employee,
      recordId: employee.id,
      id: String(employee.employeeCode || employee.employeeId || employee.id),
      firstName: employee.firstName || personName(employee).split(' ')[0] || '—',
      lastName: employee.lastName || personName(employee).split(' ').slice(1).join(' '),
      name: personName(employee),
      department: typeof employee.department === 'string' ? employee.department : employee.departmentName || employee.department?.name || 'General',
      designation: employee.designationId === null ? '—' : (employee.designationObj?.name || employee.designationName || (typeof employee.designation === 'string' ? employee.designation : employee.designation?.name) || '—'),
      shift: shiftName,
      shiftName: shiftName,
      shiftTiming: shiftTiming,
      status: status === 'active' ? 'active' : status === 'on_leave' || status === 'on leave' ? 'on_leave' : status,
      employmentType: employee.employmentType || '—',
      joinDate: employee.joiningDate ? String(employee.joiningDate).slice(0, 10) : '—',
      phone: employee.phone || '—',
      email: employee.email || '—',
      registeredSalary: registeredSalaryOf(employee),
      salary: employee.salary || null,
    };
  });
}

export async function createEmployee(values) {
  await api.post('/employees', values);
}

export function updateEmployee(id, values, customerId) {
  return api.patch(`/employees/${id}`, values, {
    params: customerId ? { customerId } : undefined,
  });
}

export async function deleteEmployee(id) {
  const res = await api.delete(`/employees/${id}`);
  return res?.data || res;
}

export async function bulkDeleteEmployees(ids) {
  const res = await api.post('/employees/bulk-delete', { ids });
  return res?.data || res;
}

export async function deactivateEmployee(id) {
  const res = await api.post(`/employees/${id}/deactivate`);
  return res?.data || res;
}

export async function activateEmployee(id) {
  const res = await api.post(`/employees/${id}/activate`);
  return res?.data || res;
}

export async function loadLiveDashboard(date, period) {
  const params = {};
  if (date) params.date = date;
  if (period) params.period = period;
  const payload = await api.get('/admin/hrms/live-dashboard', { params });
  const body = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
  const employees = Array.isArray(body?.employees) ? body.employees : [];
  return {
    summary: body?.summary || {},
    departments: Array.isArray(body?.departments) ? body.departments : [],
    birthdays: Array.isArray(body?.birthdays) ? body.birthdays : [],
    onLeaveToday: Array.isArray(body?.onLeaveToday) ? body.onLeaveToday : [],
    remoteToday: Array.isArray(body?.remoteToday) ? body.remoteToday : [],
    recentActivities: Array.isArray(body?.recentActivities) ? body.recentActivities : [],
    periodAttendance: body?.periodAttendance || null,
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
    activeBreaks: Array.isArray(body.activeBreaks) ? body.activeBreaks : [],
    records: rows.map((item, index) => {
      const dur = Number(item.duration || item.currentBreakMinutes || 0);
      const isEnded = Boolean(item.breakEnd || item.endTime);
      const isOverstay = Number(item.overstayMinutes || 0) > 0 || dur > 60;
      const overstayMins = Number(item.overstayMinutes || (dur > 60 ? dur - 60 : 0));
      return {
        id: String(item.id || `${item.employeeId}-${index}`),
        employeeId: String(item.employeeCode || item.employeeId || ''),
        employeeName: item.employeeName || 'Employee',
        department: item.department || 'General',
        breakType: item.breakType || (dur > 30 ? 'Lunch Break' : 'Coffee Break'),
        startTime: clock(item.breakStart || item.startTime),
        endTime: isEnded ? clock(item.breakEnd || item.endTime) : '',
        duration: `${dur}m`,
        status: !isEnded ? 'active' : isOverstay ? 'exceeded' : 'completed',
        overstayMinutes: overstayMins,
      };
    }),
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
      deductions: { tax: 0, late: Number(item.lateDeduction || 0) },
      lateMarks: Number(item.lateMarks || 0),
      lateDeduction: Number(item.lateDeduction || 0),
      totalLateMinutes: Number(item.totalLateMinutes || 0),
      lateRatePerMinute: Number(item.lateRatePerMinute ?? 1.0),
      lateMarkBreakdown: item.lateMarkBreakdown || [],
      workingDays: item.workingDays || 0,
      presentDays: item.presentDays || 0,
      absentDays: item.absentDays || 0,
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
      designation: employee.designation?.name || 'Employee',
      bankAccount: slip.bankAccount || employee.bankDetails?.accountNumber || '—',
      month: slip.payPeriod || '',
      grossPay: Number(slip.grossSalary || 0),
      totalDeductions: Number(slip.totalDeductions || 0),
      netPay: Number(slip.netSalary || 0),
      status: String(slip.status || '').toLowerCase(),
      registeredSalary: Number(slip.registeredSalary || slip.basicSalary || 0),
      basicSalary: Number(slip.basicSalary || 0),
      allowances: Number(slip.allowances || 0),
      deductions: {
        tax: Number(slip.tds || 0),
        insurance: Number(slip.esi || 0),
        pf: Number(slip.pf || 0),
        loan: Number(slip.loanDeduction || 0),
        lop: Number(slip.unpaidLeaveDeduction || 0),
        late: Number(slip.lateDeduction || 0),
      },
      lateMarks: Number(slip.lateMarks || 0),
      lateDeduction: Number(slip.lateDeduction || 0),
      totalLateMinutes: Number(slip.totalLateMinutes || 0),
      lateRatePerMinute: Number(slip.lateRatePerMinute ?? 1.0),
      lateMarkBreakdown: slip.lateMarkBreakdown || [],
      workingDays: slip.workingDays || 0,
      presentDays: slip.presentDays || 0,
      absentDays: slip.absentDays || 0,
    };
  });
}

export async function loadLateMarkPolicy() {
  const payload = await api.get('/admin/payroll/late-mark-policy');
  return payload?.data || payload || {};
}

export async function saveLateMarkPolicy(data) {
  const payload = await api.post('/admin/payroll/late-mark-policy', data);
  return payload?.data || payload || {};
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

export async function loadTeams(query = {}) {
  const params = {
    page: query.page || 1,
    limit: query.limit || 20,
    search: query.search || undefined,
    status: query.status && query.status !== 'ALL' ? query.status : undefined,
  };
  const payload = await api.get('/teams', { params });
  const rawList = listFrom(payload);
  const items = rawList.map((team) => {
    let code = team.code;
    let capacity = team.capacity;
    let description = team.cleanDescription ?? team.description ?? '';
    if (!code || !capacity) {
      const match = String(description).match(/^\[([A-Z0-9_-]+)\](?:\[CAP:(\d+)\])?\s*(.*)$/is);
      if (match) {
        if (!code) code = match[1];
        if (!capacity && match[2]) capacity = parseInt(match[2], 10);
        description = match[3] || '';
      }
    }
    const memberCount = team.memberCount ?? team.membersCount ?? team._count?.members ?? (Array.isArray(team.members) ? team.members.length : 0);
    return {
      ...team,
      id: team.id,
      name: team.name,
      code: code || `POD-${String(team.id).padStart(3, '0')}`,
      capacity: capacity ? Number(capacity) : Math.max(10, memberCount + 2),
      head: team.leader?.name || (team.leader ? `${team.leader.firstName || ''} ${team.leader.lastName || ''}`.trim() : null) || team.leaderName || 'Unassigned',
      leader: team.leader || null,
      leaderId: team.leaderId || team.leader?.id || null,
      members: Array.isArray(team.members) ? team.members : [],
      memberCount,
      membersCount: memberCount,
      isActive: team.isActive !== false,
      status: team.isActive === false ? 'Inactive' : 'Active',
      createdAt: team.createdAt,
      createdOn: team.createdAt ? String(team.createdAt).slice(0, 10) : '',
      description,
    };
  });

  const pagination = payload?.data?.pagination || payload?.pagination || {
    page: params.page,
    limit: params.limit,
    total: payload?.data?.meta?.total ?? payload?.meta?.total ?? payload?.data?.total ?? items.length,
    totalPages: payload?.data?.meta?.totalPages ?? payload?.meta?.totalPages ?? payload?.data?.totalPages ?? 1,
  };

  // Attach properties to items array so both array-based and object-based consumption work
  items.items = items;
  items.data = items;
  items.pagination = pagination;
  items.total = pagination.total;
  items.totalPages = pagination.totalPages;

  return items;
}

export async function loadTeamStats() {
  try {
    const res = await api.get('/teams/stats');
    const data = res?.data || res;
    if (data && typeof data.total === 'number') {
      return data;
    }
  } catch (err) {
    console.warn('Failed to fetch /teams/stats endpoint, using fallback calculation', err);
  }
  return null;
}

export async function getTeam(id) {
  const res = await api.get(`/teams/${id}`);
  const team = res?.data || res;
  if (!team) return null;
  let code = team.code;
  let capacity = team.capacity;
  let description = team.cleanDescription ?? team.description ?? '';
  if (!code || !capacity) {
    const match = String(description).match(/^\[([A-Z0-9_-]+)\](?:\[CAP:(\d+)\])?\s*(.*)$/is);
    if (match) {
      if (!code) code = match[1];
      if (!capacity && match[2]) capacity = parseInt(match[2], 10);
      description = match[3] || '';
    }
  }
  const memberCount = team.memberCount ?? team.membersCount ?? team._count?.members ?? (Array.isArray(team.members) ? team.members.length : 0);
  return {
    ...team,
    code: code || `POD-${String(team.id).padStart(3, '0')}`,
    capacity: capacity ? Number(capacity) : Math.max(10, memberCount + 2),
    head: team.leader?.name || (team.leader ? `${team.leader.firstName || ''} ${team.leader.lastName || ''}`.trim() : null) || 'Unassigned',
    memberCount,
    description,
    status: team.isActive === false ? 'Inactive' : 'Active',
  };
}

export function saveOffice(values, id) {
  const body = { name: values.name, code: values.code || undefined, address: values.description || undefined, city: values.head || undefined, isActive: values.status !== 'Inactive' };
  return id ? api.patch(`/offices/${id}`, body) : api.post('/offices', body);
}

export function removeOffice(id) {
  return api.delete(`/offices/${id}`);
}

export function saveTeam(values, id) {
  const body = {
    name: values.name?.trim(),
    code: values.code?.trim(),
    capacity: values.capacity ? Number(values.capacity) : undefined,
    description: values.description?.trim() || undefined,
    leaderId: values.leaderId ? Number(values.leaderId) : null,
    memberIds: Array.isArray(values.memberIds) ? values.memberIds.map(Number) : undefined,
    isActive: values.isActive !== undefined ? Boolean(values.isActive) : values.status !== 'Inactive',
  };
  return id ? api.patch(`/teams/${id}`, body) : api.post('/teams', body);
}

export function setTeamStatus(id, isActive) {
  return api.patch(`/teams/${id}`, { isActive });
}

export function removeTeam(id, permanent = false) {
  return api.delete(`/teams/${id}`, { params: { permanent: String(permanent) } });
}

export function addTeamMember(teamId, { employeeId, role = 'MEMBER' }) {
  return api.post(`/teams/${teamId}/members`, { employeeId: Number(employeeId), role });
}

export function removeTeamMember(teamId, employeeId) {
  return api.delete(`/teams/${teamId}/members/${employeeId}`);
}

export async function transferTeamMember(fromTeamId, toTeamId, employeeId) {
  await api.post(`/teams/${toTeamId}/members`, { employeeId: Number(employeeId) });
  if (fromTeamId && Number(fromTeamId) !== Number(toTeamId)) {
    await api.delete(`/teams/${fromTeamId}/members/${employeeId}`);
  }
}

function objectFrom(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) return payload.data;
  return payload;
}

function sessionUser() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem('quikboom-next-auth-storage') || '{}')?.state?.user || null;
  } catch {
    return null;
  }
}

function isAdminSession(user) {
  const roles = [user?.role, user?.roleType, user?.accountType, ...(Array.isArray(user?.roles) ? user.roles : [])];
  return roles.some((role) => ['SUPERADMIN', 'COMPANYADMIN', 'CUSTOMERADMIN', 'TENANTADMIN', 'ADMIN', 'CUSTOMER'].includes(String(role?.type || role?.name || role || '').toUpperCase().replace(/[\s_-]+/g, '')));
}

export function sessionCanAction(moduleName, action) {
  const user = sessionUser();
  if (!user) return false;
  if (isAdminSession(user)) return true;
  const wanted = String(action || '').toUpperCase();
  const modules = [String(moduleName).toUpperCase(), String(moduleName).toUpperCase().replace(/S$/, ''), 'HRM'];
  const permissions = Array.isArray(user.permissions) ? user.permissions : null;
  if (permissions) {
    return permissions.some((permission) => {
      const code = String(typeof permission === 'string' ? permission : permission?.code || `${permission?.module}:${permission?.action}`).toUpperCase();
      const [module, permissionAction] = code.split(':');
      return code === '*' || (modules.includes(module) && ['ALL', 'MANAGE', wanted, wanted === 'EDIT' ? 'UPDATE' : wanted === 'DELETE' ? 'DEACTIVATE' : wanted].includes(permissionAction));
    });
  }
  return sessionCan(moduleName);
}

export function sessionCan(moduleName) {
  const user = sessionUser();
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

export function assignShift(id, employeeIds, options = {}) {
  const body = {
    employeeIds: employeeIds.map(Number),
    ...(options.reason ? { reason: options.reason } : {}),
    ...(options.effectiveFrom ? { effectiveFrom: options.effectiveFrom } : {}),
  };
  return api.post(`/shifts/${id}/assign`, body);
}

export function unassignShift(id, employeeIds, reason) {
  const body = {
    employeeIds: employeeIds.map(Number),
    ...(reason ? { reason } : {}),
  };
  return api.post(id ? `/shifts/${id}/unassign` : '/shifts/unassign', body);
}

export async function loadShiftHistory(params = {}) {
  const payload = await api.get('/shifts/history', { params });
  return {
    rows: listFrom(payload),
    pagination: payload?.pagination || payload?.meta || { total: listFrom(payload).length },
  };
}

export async function loadEmployeeShiftHistory(employeeId) {
  const payload = await api.get(`/shifts/history/${employeeId}`);
  return {
    rows: listFrom(payload),
    pagination: payload?.pagination || payload?.meta || { total: listFrom(payload).length },
  };
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

export async function loadDeductions(params = {}) {
  const payload = await api.get('/admin/payroll/deductions', { params });
  const body = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
  const rows = (Array.isArray(payload?.data) ? payload.data : listFrom(payload)).map((row) => ({
    ...row,
    recordId: row.id,
    employeeName: row.employeeName || personName(row.employee),
    employeeId: String(row.employeeCode || row.employee?.employeeCode || row.employeeId || ''),
    department: row.department || row.employee?.department?.name || 'General',
    designation: row.designation || row.employee?.designation?.name || 'Staff',
    amount: Number(row.amount || 0),
    payrollMonthLabel: row.payrollMonthName ? `${row.payrollMonthName} ${row.payrollYear || ''}`.trim() : `${row.payrollMonth}/${row.payrollYear}`,
    createdOn: row.createdAt ? String(row.createdAt).slice(0, 10) : '—',
  }));
  return {
    rows,
    summary: body?.summary || payload?.summary || {},
    pagination: payload?.pagination || payload?.meta || {},
  };
}

export function createDeduction(values) {
  return api.post('/admin/payroll/deductions', values);
}

export function approveDeduction(id) {
  return api.patch(`/admin/payroll/deductions/${id}/approve`, {});
}

export function rejectDeduction(id, reason) {
  return api.patch(`/admin/payroll/deductions/${id}/reject`, { reason });
}

export function reverseDeduction(id, reason) {
  return api.patch(`/admin/payroll/deductions/${id}/reverse`, { reason });
}

export function removeDeduction(id) {
  return api.delete(`/admin/payroll/deductions/${id}`);
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

export async function loadOvertimeNotifications() {
  const body = await api.get('/admin/hrm/overtime/notifications');
  return Array.isArray(body) ? body : body?.data || [];
}

export function retryOvertimeNotification(id) {
  return api.post(`/admin/hrm/overtime/notifications/${id}/retry`);
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

export function decideOvertimeCancellation(id, values) {
  return api.patch(`/admin/hrm/overtime/${id}/cancellation-decision`, values);
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

export async function loadHrmReportDashboard(params = {}) {
  return objectFrom(await api.get('/admin/hrm/reports/dashboard', { params }));
}

export function loadHrmReportSettings() {
  return api.get('/admin/hrm/reports/settings');
}

export function saveHrmReportSettings(values) {
  return api.patch('/admin/hrm/reports/settings', values);
}

export function generateHrmReports(values) {
  return api.post('/admin/hrm/reports/generate', values);
}

export function retryHrmDelivery(id) {
  return api.post(`/admin/hrm/reports/retry/${id}`);
}

export async function hrmReportDownload(id) {
  return objectFrom(await api.get(`/admin/hrm/reports/download/${id}`));
}

export async function loadCommissionWallet() {
  const [dashboard, employees, withdrawals, rules] = await Promise.all([
    api.get('/commissions/admin/wallet/dashboard'),
    api.get('/commissions/admin/wallet/employees'),
    api.get('/commissions/admin/wallet/withdrawals'),
    api.get('/commissions/admin/wallet/rules'),
  ]);
  const unwrap = (payload) => payload?.data ?? payload ?? {};
  return {
    dashboard: unwrap(dashboard),
    employees: listFrom(employees),
    withdrawals: listFrom(withdrawals),
    rules: listFrom(rules),
  };
}

export function decideWithdrawal(id, action, body = {}) {
  return api.patch(`/commissions/admin/wallet/withdrawals/${id}/${action}`, body);
}

export function saveCommissionSlab(values) {
  return api.post('/commissions/admin/wallet/rules', values);
}

export function loadLateReport(kind, params = {}) {
  return api.get(`/admin/late-mark-reports/${kind}`, { params });
}

export function loadLateReportSettings() {
  return api.get('/admin/late-mark-reports/email-settings');
}

export function saveLateReportSettings(values) {
  return api.patch('/admin/late-mark-reports/email-settings', values);
}

export function loadLateReportHistory() {
  return api.get('/admin/late-mark-reports/email-history');
}

export function retryLateReport(id) {
  return api.post(`/admin/late-mark-reports/email-history/${id}/retry`);
}

export function exportLateReport(params) {
  return api.get('/admin/late-mark-reports/export', { params });
}

export const missingHrmApis = {
  overtime: '',
  announcements: '',
  attendanceCorrection: 'The attendance API records punch in, punch out, and breaks. It does not provide an admin correction endpoint.',
  breakPolicy: 'Break history comes from live attendance. There is no separate break-policy configuration API.',
  shiftHistory: '',
  loanRepayment: 'Loan records include EMI, tenure, and remaining balance. There is no repayment-transaction history API.',
  loanTypeField: 'Loan types come from master data. A loan record does not store a loan-type id, so the selected scheme is saved in the loan notes with its rate and tenure.',
  loanPayroll: 'Approving a loan stores EMI and remaining balance. Payroll does not expose a separate loan-deduction posting API.',
  geoMap: 'Google Maps renders only when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is configured. Coordinates are still listed from the location API.',
};
