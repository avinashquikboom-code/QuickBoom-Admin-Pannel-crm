/**
 * Client-side PDF generation for Report exports.
 * Uses jspdf + jspdf-autotable for tabular layout.
 */

import type { ReportModuleType } from '@/lib/services/reports.service';

export interface PdfReportOptions {
  module: ReportModuleType;
  dateFrom: string;
  dateTo: string;
  statusFilter: string;
  search?: string;
  items: any[];
  summaryData?: any;
}

const COLUMN_MAP: Record<ReportModuleType, { header: string; key: string | ((item: any) => string) }[]> = {
  ATTENDANCE: [
    { header: 'Date', key: 'date' },
    { header: 'Employee Code', key: 'employeeCode' },
    { header: 'Employee Name', key: 'employeeName' },
    { header: 'Department', key: 'department' },
    { header: 'Status', key: 'status' },
    { header: 'Punch In', key: (r: any) => r.punchIn ? new Date(r.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-' },
    { header: 'Punch Out', key: (r: any) => r.punchOut ? new Date(r.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-' },
    { header: 'Hours Worked', key: (r: any) => r.workingHours != null ? r.workingHours + ' hrs' : '-' },
    { header: 'Break (hrs)', key: (r: any) => r.breakDuration > 0 ? r.breakDuration + 'h' : '-' },
    { header: 'Office / Mode', key: (r: any) => (r.office || '') + (r.workMode ? ' (' + r.workMode + ')' : '') },
  ],
  PAYROLL: [
    { header: 'Slip No', key: 'slipNumber' },
    { header: 'Pay Period', key: 'payPeriod' },
    { header: 'Employee Code', key: 'employeeCode' },
    { header: 'Employee Name', key: 'employeeName' },
    { header: 'Department', key: 'department' },
    { header: 'Gross Salary (INR)', key: (r: any) => Number(r.grossSalary || 0).toLocaleString('en-IN') },
    { header: 'Deductions (INR)', key: (r: any) => Number(r.totalDeductions || 0).toLocaleString('en-IN') },
    { header: 'Net Payout (INR)', key: (r: any) => Number(r.netSalary || 0).toLocaleString('en-IN') },
    { header: 'Status', key: 'status' },
  ],
  LEAVES: [
    { header: 'Employee Code', key: 'employeeCode' },
    { header: 'Employee Name', key: 'employeeName' },
    { header: 'Department', key: 'department' },
    { header: 'Leave Type', key: 'leaveType' },
    { header: 'From Date', key: 'fromDate' },
    { header: 'To Date', key: 'toDate' },
    { header: 'Days', key: (r: any) => String(r.days ?? '') },
    { header: 'Reason', key: (r: any) => (r.reason || '').substring(0, 60) },
    { header: 'Status', key: 'status' },
  ],
  EMPLOYEES: [
    { header: 'Employee Code', key: 'employeeCode' },
    { header: 'Full Name', key: 'name' },
    { header: 'Email', key: 'email' },
    { header: 'Department', key: 'department' },
    { header: 'Designation', key: 'designation' },
    { header: 'Branch', key: 'office' },
    { header: 'Status', key: 'status' },
    { header: 'Joining Date', key: 'joiningDate' },
  ],
  VISITS: [
    { header: 'Date', key: 'date' },
    { header: 'Time', key: 'time' },
    { header: 'Client Name', key: 'clientName' },
    { header: 'Purpose', key: 'purpose' },
    { header: 'Location', key: 'location' },
    { header: 'Staff Code', key: 'employeeCode' },
    { header: 'Staff Name', key: 'assignedEmployee' },
    { header: 'Status', key: 'status' },
  ],
};

const MODULE_TITLE: Record<ReportModuleType, string> = {
  ATTENDANCE: 'Attendance Report',
  PAYROLL: 'Payroll and Salary Ledger',
  LEAVES: 'Leave Requests Report',
  EMPLOYEES: 'Employee Roster Report',
  VISITS: 'Field Client Visits Report',
};

function buildSummaryRows(module: ReportModuleType, summaryData: any): string[][] {
  if (!summaryData) return [];
  switch (module) {
    case 'ATTENDANCE':
      return [
        ['Total Records', String(summaryData.attendance?.totalRecords ?? 0)],
        ['Present', String(summaryData.attendance?.present ?? 0)],
        ['Absent', String(summaryData.attendance?.absent ?? 0)],
        ['Half Day', String(summaryData.attendance?.halfDay ?? 0)],
        ['Late', String(summaryData.attendance?.late ?? 0)],
        ['Attendance Rate', String(summaryData.attendance?.presentRate ?? '-')],
        ['Total Working Hours', (summaryData.attendance?.totalWorkingHours ?? 0) + ' hrs'],
      ];
    case 'PAYROLL':
      return [
        ['Slips Generated', String(summaryData.payroll?.slipsGenerated ?? 0)],
        ['Total Gross Salary', 'INR ' + Number(summaryData.payroll?.grossSalary ?? 0).toLocaleString('en-IN')],
        ['Total Deductions', 'INR ' + Number(summaryData.payroll?.totalDeductions ?? 0).toLocaleString('en-IN')],
        ['Net Disbursed', 'INR ' + Number(summaryData.payroll?.netDisbursed ?? 0).toLocaleString('en-IN')],
      ];
    case 'LEAVES':
      return [
        ['Total Requests', String(summaryData.leaves?.total ?? 0)],
        ['Pending', String(summaryData.leaves?.pending ?? 0)],
        ['Approved', String(summaryData.leaves?.approved ?? 0)],
      ];
    case 'EMPLOYEES':
      return [
        ['Total Employees', String(summaryData.workforce?.total ?? 0)],
        ['Active', String(summaryData.workforce?.active ?? 0)],
      ];
    case 'VISITS':
      return [['Total Visits', String(summaryData.visits?.total ?? 0)]];
    default:
      return [];
  }
}

export async function exportReportAsPdf(options: PdfReportOptions): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const { module, dateFrom, dateTo, statusFilter, search, items, summaryData } = options;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryColor: [number, number, number] = [30, 41, 59];
  const accentColor: [number, number, number] = [35, 196, 94];

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(MODULE_TITLE[module], 10, 10);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 220, 180);
  doc.text('QuickBoom CRM - Reports and Data Export Center', 10, 16);
  const now = new Date();
  const generatedAt = now.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  doc.setFontSize(7);
  doc.setTextColor(180, 200, 180);
  doc.text('Generated: ' + generatedAt, pageWidth - 10, 10, { align: 'right' });

  // Filter Meta Row
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 22, pageWidth, 12, 'F');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const filterParts: string[] = [
    'Date Range: ' + dateFrom + ' to ' + dateTo,
    (statusFilter && statusFilter !== 'ALL') ? 'Status: ' + statusFilter : '',
    search ? 'Search: "' + search + '"' : '',
  ].filter(Boolean);
  doc.text(filterParts.join('   |   '), 10, 30);

  let cursorY = 38;

  // Summary Section
  const summaryRows = buildSummaryRows(module, summaryData);
  if (summaryRows.length > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Report Summary', 10, cursorY);
    cursorY += 3;
    autoTable(doc, {
      startY: cursorY,
      head: [summaryRows.map((r) => r[0])],
      body: [summaryRows.map((r) => r[1])],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5, halign: 'center', textColor: [30, 41, 59] as any },
      headStyles: { fillColor: [241, 245, 249] as any, textColor: [71, 85, 105] as any, fontStyle: 'bold' },
      bodyStyles: { fillColor: [255, 255, 255] as any, fontStyle: 'bold' },
      margin: { left: 10, right: 10 },
      tableWidth: 'auto',
    });
    cursorY = (doc as any).lastAutoTable.finalY + 6;
  }

  // Main Data Table
  const cols = COLUMN_MAP[module];
  const headers = cols.map((c) => c.header);
  const rows = items.map((item) =>
    cols.map((c) => {
      if (typeof c.key === 'function') return (c.key as (item: any) => string)(item) ?? '-';
      return item[c.key as string] != null ? String(item[c.key as string]) : '-';
    }),
  );

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Data Records (' + items.length + ' rows shown on current page)', 10, cursorY);
  cursorY += 3;

  autoTable(doc, {
    startY: cursorY,
    head: [headers],
    body: rows,
    theme: 'striped',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] as any, overflow: 'linebreak' },
    headStyles: { fillColor: primaryColor as any, textColor: [255, 255, 255] as any, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] as any },
    margin: { left: 10, right: 10 },
    didDrawPage: () => {
      const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
      const totalPages = doc.getNumberOfPages();
      doc.setFillColor(...accentColor);
      doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);
      doc.text('QuickBoom CRM - Confidential | For internal use only', 10, pageHeight - 2.5);
      doc.text('Page ' + pageNum + ' of ' + totalPages, pageWidth - 10, pageHeight - 2.5, { align: 'right' });
    },
  });

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save('report_' + module.toLowerCase() + '_' + dateStr + '.pdf');
}
