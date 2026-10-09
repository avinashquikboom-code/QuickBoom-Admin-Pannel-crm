/**
 * Client-side professional PDF generation for Payroll Governance Report.
 * Uses jsPDF + jspdf-autotable for multi-page tabular layout with clean pagination.
 */

export interface PayrollPdfItem {
  employeeCode: string;
  employeeName: string;
  department?: string;
  designation?: string;
  basicSalary: number;
  hra: number;
  medical?: number;
  travel?: number;
  allowances: number;
  specialAllowance: number;
  bonus: number;
  commission?: number;
  reimbursement?: number;
  grossSalary: number;
  pf?: number;
  esi?: number;
  professionalTax?: number;
  tds?: number;
  loanDeduction?: number;
  advanceDeduction?: number;
  otherDeductions?: number;
  totalDeductions: number;
  netSalary: number;
  status?: string;
  slipNumber?: string;
}

export interface GeneratePayrollPdfOptions {
  companyName: string;
  month: string;
  year: string;
  status: string;
  departmentName?: string;
  summary: {
    totalEmployees: number;
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
    totalDisbursed: number;
    pendingPayments: number;
    totalAdvances?: number;
    totalExpenseClaims?: number;
  };
  items: PayrollPdfItem[];
}

export const formatINR = (val: number | string | undefined | null): string => {
  const num = Number(val || 0);
  return '₹ ' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

export async function generatePayrollGovernancePdf(options: GeneratePayrollPdfOptions): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const emeraldAccent: [number, number, number] = [22, 163, 74]; // Emerald 600
  const slateLight: [number, number, number] = [241, 245, 249]; // Slate 100

  // 1. Top Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(options.companyName || 'QB Suite Enterprise', 12, 11);

  // Report Title
  doc.setTextColor(...emeraldAccent);
  doc.setFontSize(10);
  doc.text('PAYROLL GOVERNANCE REPORT', 12, 18);

  // Subtitle / Cycle
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    `Payroll Cycle: ${options.month} ${options.year}   |   Batch Status: ${options.status || 'UNPROCESSED'}   |   Department: ${options.departmentName || 'All Departments'}`,
    12,
    24
  );

  // Generation timestamp on right
  const now = new Date();
  const genDateStr = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const genTimeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setTextColor(203, 213, 225);
  doc.setFontSize(7.5);
  doc.text(`Generated: ${genDateStr} ${genTimeStr}`, pageWidth - 12, 12, { align: 'right' });
  doc.text('Standard: Statutory & Governance Audit Compliance', pageWidth - 12, 18, { align: 'right' });

  // 2. Executive Summary Metrics Table
  const hasAdvancesOrClaims = (options.summary.totalAdvances || 0) > 0 || (options.summary.totalExpenseClaims || 0) > 0;

  const summaryHead = [
    [
      'Total Employees',
      'Gross Salary Payout',
      'Total Deductions',
      'Net Salary Payout',
      'Total Disbursed',
      'Pending Payments',
      ...(hasAdvancesOrClaims ? ['Advances / Claims'] : []),
    ],
  ];

  const summaryBody = [
    [
      String(options.summary.totalEmployees),
      formatINR(options.summary.grossSalary),
      formatINR(options.summary.totalDeductions),
      formatINR(options.summary.netSalary),
      formatINR(options.summary.totalDisbursed),
      formatINR(options.summary.pendingPayments),
      ...(hasAdvancesOrClaims
        ? [`Adv: ${formatINR(options.summary.totalAdvances)} | Claims: ${formatINR(options.summary.totalExpenseClaims)}`]
        : []),
    ],
  ];

  autoTable(doc, {
    startY: 32,
    head: summaryHead,
    body: summaryBody,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      halign: 'center',
      textColor: primaryColor,
    },
    headStyles: {
      fillColor: slateLight,
      textColor: [51, 65, 85],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { fontStyle: 'bold', textColor: [15, 23, 42] },
      2: { fontStyle: 'bold', textColor: [225, 29, 72] }, // Rose 600
      3: { fontStyle: 'bold', textColor: [22, 163, 74] }, // Emerald 600
      4: { fontStyle: 'bold', textColor: [22, 163, 74] },
      5: { fontStyle: 'bold', textColor: [217, 119, 6] }, // Amber 600
    },
    margin: { left: 12, right: 12 },
  });

  const summaryEndY = (doc as any).lastAutoTable?.finalY || 45;

  // 3. Section Title for Itemized Employees
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`Employee Salary Structures & Disbursements (${options.items.length} Records)`, 12, summaryEndY + 6);

  // 4. Main Itemized Employee Table
  const tableHead = [
    [
      '#',
      'Emp Code',
      'Employee Name',
      'Department',
      'Basic (₹)',
      'HRA (₹)',
      'Allowances (₹)',
      'Bonus/Comm (₹)',
      'Gross Salary (₹)',
      'Deductions (₹)',
      'Net Salary (₹)',
      'Status',
      'Slip Ref',
    ],
  ];

  let sumBasic = 0;
  let sumHra = 0;
  let sumAllowances = 0;
  let sumBonus = 0;
  let sumGross = 0;
  let sumDeductions = 0;
  let sumNet = 0;

  const tableBody = options.items.map((item, idx) => {
    sumBasic += item.basicSalary || 0;
    sumHra += item.hra || 0;
    const itemAllowances = (item.allowances || 0) + (item.specialAllowance || 0) + (item.medical || 0) + (item.travel || 0);
    sumAllowances += itemAllowances;
    const itemBonus = (item.bonus || 0) + (item.commission || 0) + (item.reimbursement || 0);
    sumBonus += itemBonus;
    sumGross += item.grossSalary || 0;
    sumDeductions += item.totalDeductions || 0;
    sumNet += item.netSalary || 0;

    return [
      String(idx + 1),
      item.employeeCode || '—',
      item.employeeName || 'Unknown Employee',
      item.department || item.designation || 'General',
      Number(item.basicSalary || 0).toLocaleString('en-IN'),
      Number(item.hra || 0).toLocaleString('en-IN'),
      Number(itemAllowances).toLocaleString('en-IN'),
      Number(itemBonus).toLocaleString('en-IN'),
      Number(item.grossSalary || 0).toLocaleString('en-IN'),
      Number(item.totalDeductions || 0).toLocaleString('en-IN'),
      Number(item.netSalary || 0).toLocaleString('en-IN'),
      item.status || 'UNPROCESSED',
      item.slipNumber || '—',
    ];
  });

  const tableFoot = [
    [
      '',
      'TOTALS',
      `${options.items.length} Staff`,
      '',
      Number(sumBasic).toLocaleString('en-IN'),
      Number(sumHra).toLocaleString('en-IN'),
      Number(sumAllowances).toLocaleString('en-IN'),
      Number(sumBonus).toLocaleString('en-IN'),
      Number(sumGross).toLocaleString('en-IN'),
      Number(sumDeductions).toLocaleString('en-IN'),
      Number(sumNet).toLocaleString('en-IN'),
      '',
      '',
    ],
  ];

  autoTable(doc, {
    startY: summaryEndY + 9,
    head: tableHead,
    body: tableBody,
    foot: tableFoot,
    theme: 'grid',
    showHead: 'everyPage',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate 50
    },
    footStyles: {
      fillColor: [226, 232, 240], // Slate 200
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', halign: 'left', cellWidth: 20 },
      2: { fontStyle: 'bold', halign: 'left', cellWidth: 36 },
      3: { halign: 'left', cellWidth: 24 },
      4: { halign: 'right', cellWidth: 18 },
      5: { halign: 'right', cellWidth: 18 },
      6: { halign: 'right', cellWidth: 20 },
      7: { halign: 'right', cellWidth: 20 },
      8: { fontStyle: 'bold', halign: 'right', cellWidth: 22 },
      9: { halign: 'right', textColor: [225, 29, 72], cellWidth: 20 },
      10: { fontStyle: 'bold', halign: 'right', textColor: [22, 163, 74], cellWidth: 22 },
      11: { halign: 'center', cellWidth: 18 },
      12: { halign: 'center', cellWidth: 22 },
    },
    margin: { left: 12, right: 12, bottom: 16 },
  });

  // 5. Two-pass page numbering & footer branding
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Bottom running divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(12, pageHeight - 10, pageWidth - 12, pageHeight - 10);

    // Footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'QB Suite - Confidential Corporate Payroll Governance Document  •  Auto-Generated',
      12,
      pageHeight - 6
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - 12,
      pageHeight - 6,
      { align: 'right' }
    );
  }

  // 6. Download / Save
  const safeMonth = options.month.replace(/\s+/g, '_');
  const filename = `Payroll_Governance_Report_${safeMonth}_${options.year}.pdf`;
  doc.save(filename);
}
