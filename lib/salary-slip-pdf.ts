import { downloadPdfFromEndpoint, viewPdfFromEndpoint } from './pdf-download.util';

// Relative to the configured API base, with its Bearer/tenant interceptors.
export function salarySlipPdfEndpoint(id: number | string): string {
  return `/admin/payroll/slips/${encodeURIComponent(String(id))}/download`;
}

export function downloadSalarySlip(id: number | string) {
  return downloadPdfFromEndpoint(salarySlipPdfEndpoint(id), `salary-slip-${id}.pdf`);
}

export function viewSalarySlip(id: number | string) {
  return viewPdfFromEndpoint(salarySlipPdfEndpoint(id));
}
