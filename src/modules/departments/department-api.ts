import { z } from 'zod';
import axios from 'axios';
import api from '../../../lib/api';

export const departmentSchema = z.object({
  id: z.number(), name: z.string(), code: z.string(), description: z.string().nullable(),
  headId: z.number().nullable(), head: z.string(), isActive: z.boolean(),
  employeesCount: z.number(), designationsCount: z.number(),
  createdAt: z.string(), updatedAt: z.string(),
});
export type Department = z.infer<typeof departmentSchema>;
export const departmentFormSchema = z.object({
  name: z.string().trim().min(1, 'Department name is required.'),
  code: z.string().trim(), description: z.string().trim(),
  headId: z.number().int().positive().nullable(), isActive: z.boolean(),
});
export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;
const employeeSchema = z.object({
  id: z.number(), name: z.string(), employeeCode: z.string().nullish(), email: z.string().nullish(),
});
export type DepartmentHead = z.infer<typeof employeeSchema>;
const metaSchema = z.object({ total: z.number(), page: z.number(), totalPages: z.number() });
// Use the shared admin client session. qbAdminSession would ignore the existing login store.
const config = { timeout: 30000 };

function responseText(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const message = (body as { message?: unknown; errors?: unknown }).message ?? (body as { errors?: unknown }).errors;
  if (Array.isArray(message)) return message.map(String).join('. ');
  if (typeof message === 'string') return message;
  if (message && typeof message === 'object' && typeof (message as { message?: unknown }).message === 'string') {
    return (message as { message: string }).message;
  }
  return '';
}

export function apiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const text = responseText(error.response?.data);
    if (status === 401) return 'Your session has expired. Please sign in again.';
    if (status === 403) return text || 'You do not have permission to manage departments.';
    if (status === 404) return text || 'This department could not be found.';
    if (status === 409) return text || 'A department with these details already exists.';
    if (status === 400) return text || 'Please check the department details and try again.';
    if (status && status >= 500) return text || 'The server could not complete this department request. Please try again.';
    if (!error.response) return 'Unable to reach the server. Check your connection and retry.';
    return text || 'The request failed. Please try again.';
  }
  if (error instanceof z.ZodError) return 'The server returned an unexpected response. Please refresh or contact support.';
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

// Read all pages before computing counts/exporting; never treat a partial page as the total.
// Filtering locally also avoids the backend's auto-seed branch on empty status queries.
export async function listDepartments(signal?: AbortSignal): Promise<Department[]> {
  const records: Department[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await api.get<unknown, unknown>('/departments', {
      ...config, signal, params: { page, limit: 100 },
    });
    const parsed = z.object({ data: z.array(departmentSchema), meta: metaSchema }).parse(response);
    if (parsed.meta.page !== page || (parsed.data.length === 0 && page < parsed.meta.totalPages)) {
      throw new Error('Unable to load all departments. Please refresh.');
    }
    records.push(...parsed.data);
    totalPages = parsed.meta.totalPages;
    page += 1;
  } while (page <= totalPages);
  return records;
}

export async function getDepartment(id: number, signal?: AbortSignal): Promise<Department> {
  const response = await api.get<unknown, { data: unknown }>(`/departments/${id}`, { ...config, signal });
  return departmentSchema.parse(response.data);
}
export async function saveDepartment(values: DepartmentFormValues, id?: number): Promise<void> {
  // Null explicitly clears an existing head; @IsOptional permits null in the current DTO.
  const body = departmentFormSchema.parse(values);
  if (id !== undefined) await api.patch(`/departments/${id}`, body, config);
  else await api.post('/departments', body, config);
}
export async function changeDepartmentStatus(id: number, isActive: boolean): Promise<void> {
  await api.patch(`/departments/${id}`, { isActive }, config);
}
export async function deleteDepartment(id: number): Promise<string> {
  const response = await api.delete<unknown, { data: { message: string; deactivated?: boolean; deleted?: boolean } }>(`/departments/${id}`, config);
  const result = z.object({ message: z.string(), deactivated: z.boolean().optional(), deleted: z.boolean().optional() }).parse(response.data);
  return result.message;
}
export async function listDepartmentHeads(search: string, page: number, signal?: AbortSignal) {
  const response = await api.get<unknown, unknown>('/employees', {
    ...config, signal, params: { search, page, limit: 30 },
  });
  return z.object({ data: z.array(employeeSchema), meta: metaSchema }).parse(response);
}

export function exportDepartments(records: Department[]) {
  const cell = (value: unknown) => {
    const text = String(value ?? '');
    // Prevent spreadsheet formulas when opening exported user-entered values.
    const safe = /^[=+\-@\t\r\n]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const rows = [
    ['Department Name', 'Department Code', 'Description', 'Employees', 'Status'],
    ...records.map((d) => [d.name, d.code, d.description, d.employeesCount, d.isActive ? 'Active' : 'Inactive']),
  ];
  const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map((r) => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'departments.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
