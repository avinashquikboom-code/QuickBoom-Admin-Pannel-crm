import api from '@/lib/api';

export type ReportModuleType = 'ATTENDANCE' | 'PAYROLL' | 'LEAVES' | 'EMPLOYEES' | 'VISITS';

export interface ReportSummary {
  dateRange: {
    from: string;
    to: string;
  };
  workforce: {
    total: number;
    active: number;
  };
  attendance: {
    totalRecords: number;
    present: number;
    absent: number;
    halfDay: number;
    late: number;
    onLeave: number;
    presentRate: string;
    totalWorkingHours: number;
    avgWorkingHours: string;
  };
  leaves: {
    pending: number;
    approved: number;
    total: number;
  };
  payroll: {
    slipsGenerated: number;
    grossSalary: number;
    totalDeductions: number;
    netDisbursed: number;
  };
  visits: {
    total: number;
  };
  revenue: {
    invoicesCount: number;
    totalRevenue: number;
  };
}

export interface ReportQueryFilters {
  type?: ReportModuleType;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  branch?: string;
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
  customerId?: number | string;
}

export interface ReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReportDataResponse<T = any> {
  type: ReportModuleType;
  items: T[];
  pagination: ReportPagination;
}

export interface ExportReportPayload {
  reportType: ReportModuleType;
  format?: 'CSV' | 'PDF';
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  branch?: string;
  department?: string;
  search?: string;
}

export interface ExportReportResult {
  success: boolean;
  reportType: string;
  format: 'CSV' | 'PDF';
  filename: string;
  data: string;
  rowsCount: number;
  generatedAt: string;
}

export const ReportsService = {
  /**
   * Fetch high-level analytical KPI summaries calculated live from DB
   */
  async getSummary(params?: { dateFrom?: string; dateTo?: string; customerId?: string | number }): Promise<ReportSummary> {
    const res = await api.get('/reports/summary', { params });
    return res.data?.data || res.data;
  },

  /**
   * Fetch paginated list-based report data with filters and date range
   */
  async getReportData<T = any>(filters: ReportQueryFilters): Promise<ReportDataResponse<T>> {
    const res = await api.get('/reports/data', { params: filters });
    return res.data?.data || res.data;
  },

  /**
   * Trigger real CSV/PDF report download export
   */
  async exportReport(payload: ExportReportPayload): Promise<ExportReportResult> {
    const res = await api.post('/reports/export', payload);
    return res.data?.data || res.data;
  },
};

export default ReportsService;
