import { downloadPdfFromEndpoint, viewPdfFromEndpoint } from './pdf-download.util';

const slipFilenameMap = new Map<string, string>();

export function buildSalarySlipFilename(slip: any): string {
  if (!slip) return 'salary-slip.pdf';
  if (typeof slip !== 'object') return `salary-slip-${slip}.pdf`;

  const empCode = slip.employee?.employeeCode;
  const empName = [slip.employee?.firstName, slip.employee?.lastName].filter(Boolean).join('_');
  const empIdentifier = empCode || empName || (slip.employeeId ? `EMP_${slip.employeeId}` : 'Employee');

  let periodStr = '';
  if (slip.year && slip.month) {
    periodStr = `${slip.year}_${String(slip.month).padStart(2, '0')}`;
  } else if (slip.payPeriod) {
    periodStr = String(slip.payPeriod).replace(/[\/\\:*?"<>| ]+/g, '_');
  }

  const cleanEmp = empIdentifier.replace(/[\/\\:*?"<>| ]+/g, '_');
  return periodStr ? `Salary_Slip_${cleanEmp}_${periodStr}.pdf` : `Salary_Slip_${cleanEmp}.pdf`;
}

export function registerSalarySlipMetadata(slip: any) {
  if (slip && slip.id !== undefined && slip.id !== null) {
    slipFilenameMap.set(String(slip.id), buildSalarySlipFilename(slip));
  }
}

// Relative to the configured API base, with its Bearer/tenant interceptors.
export function salarySlipPdfEndpoint(id: number | string): string {
  return `/admin/payroll/slips/${encodeURIComponent(String(id))}/download`;
}

export function downloadSalarySlip(id: number | string) {
  const customFilename = slipFilenameMap.get(String(id));
  return downloadPdfFromEndpoint(salarySlipPdfEndpoint(id), customFilename || `salary-slip-${id}.pdf`);
}

export function viewSalarySlip(id: number | string) {
  return viewPdfFromEndpoint(salarySlipPdfEndpoint(id));
}
