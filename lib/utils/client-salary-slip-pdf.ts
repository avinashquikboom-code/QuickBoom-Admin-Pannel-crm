import { toast } from 'react-hot-toast';

function formatInr(val: any): string {
  const num = Number(val || 0);
  const isNeg = num < 0;
  const abs = Math.abs(num);
  const parts = abs.toFixed(2).split('.');
  const intPart = parts[0];
  const decPart = parts[1];
  let formattedInt = intPart;
  if (intPart.length > 3) {
    const lastThree = intPart.substring(intPart.length - 3);
    const rest = intPart.substring(0, intPart.length - 3);
    const formattedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedInt = `${formattedRest},${lastThree}`;
  }
  return `${isNeg ? '-' : ''}Rs. ${formattedInt}.${decPart}`;
}

function maskAccount(raw?: string | null): string {
  if (!raw || !raw.trim()) return '—';
  const clean = raw.trim();
  if (clean.length <= 4) return clean;
  return `XXXX XXXX ${clean.substring(clean.length - 4)}`;
}

export async function generateClientSalarySlipPdfBlob(slip: any): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 14;
  const printableWidth = pageWidth - margin * 2; // 182mm

  // 1. Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(margin, 12, printableWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('QUICKBOOM BUSINESS SUITE', margin + 6, 20);

  doc.setTextColor(34, 197, 94); // Emerald 500
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('OFFICIAL SALARY & PAYROLL STATEMENT', margin + 6, 26);

  doc.setTextColor(203, 213, 225); // Slate 300
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Pay Period: ${slip.payPeriod || slip.monthName || 'Current Cycle'}`, margin + 6, 31);

  // Right-aligned header metadata
  const rightX = margin + printableWidth - 6;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`Slip No: ${slip.slipNumber || slip.id || 'N/A'}`, rightX, 20, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Disbursed Date: ${slip.date || new Date().toISOString().split('T')[0]}`, rightX, 25, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94);
  doc.text(`Status: ${(slip.status || 'GENERATED').toUpperCase()}`, rightX, 30, { align: 'right' });

  // 2. Employee & Bank Details Table
  const emp = slip.employee || {};
  const bDetails =
    typeof emp.bankDetails === 'string'
      ? JSON.parse(emp.bankDetails || '{}')
      : emp.bankDetails || slip.bankDetails || {};

  const empRows = [
    [
      { content: 'Employee Name:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
      { content: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee', styles: { fontStyle: 'bold', textColor: [15, 23, 42] } },
      { content: 'Employee ID:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
      { content: emp.employeeCode || '—', styles: { fontStyle: 'bold', textColor: [15, 23, 42] } },
    ],
    [
      { content: 'Designation:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
      { content: emp.designation?.name || emp.designation || slip.designation || 'General', styles: { textColor: [15, 23, 42] } },
      { content: 'Department:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
      { content: emp.department?.name || emp.department || slip.department || 'General', styles: { textColor: [15, 23, 42] } },
    ],
    [
      { content: 'Bank Name:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
      { content: bDetails.bankName || '—', styles: { textColor: [15, 23, 42] } },
      { content: 'Account No:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
      { content: maskAccount(bDetails.accountNumber), styles: { textColor: [15, 23, 42] } },
    ],
  ];

  autoTable(doc, {
    startY: 40,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    head: [[{ content: 'EMPLOYEE & DISBURSEMENT DETAILS', colSpan: 4, styles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' } }]],
    body: empRows as any,
  });

  // 3. Attendance Summary Table
  const att = slip.attendanceSummary || {};
  const pi = slip.payrollItem || {};
  const attRows = [
    [
      'Total Days',
      String(att.calendarDays ?? slip.calendarDays ?? 30),
      'Working Days',
      String(att.workingDays ?? slip.workingDays ?? pi.workingDays ?? 0),
      'Present Days',
      String(att.presentDays ?? slip.presentDays ?? pi.presentDays ?? 0),
    ],
    [
      'Absent Days',
      String(att.absentDays ?? slip.absentDays ?? pi.absentDays ?? 0),
      'Paid Leaves',
      String(att.paidLeaveDays ?? slip.paidLeaveDays ?? pi.paidLeaveDays ?? 0),
      'Unpaid Leaves',
      String(att.unpaidLeaveDays ?? slip.unpaidLeaveDays ?? pi.unpaidLeaveDays ?? 0),
    ],
    [
      'Weekly Offs',
      String(att.weeklyOffDays ?? slip.weeklyOffDays ?? pi.weeklyOffDays ?? 0),
      'Holidays',
      String(att.holidayDays ?? slip.holidayDays ?? pi.holidayDays ?? 0),
      'Overtime',
      String(att.overtimeLabel || slip.overtimeHours || '0h 00m'),
    ],
  ];

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 4,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, halign: 'center' },
    head: [[{ content: 'ATTENDANCE SUMMARY', colSpan: 6, styles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' } }]],
    body: attRows,
  });

  // 4. Earnings & Deductions Breakdown
  const basic = Number(slip.basicSalary ?? pi.basicSalary ?? 0);
  const hra = Number(slip.hra ?? pi.hra ?? 0);
  const allowances = Number(slip.allowances ?? pi.allowances ?? 0) + Number(slip.specialAllowance ?? pi.specialAllowance ?? 0);
  const bonus = Number(slip.bonus ?? pi.bonus ?? 0);
  const commission = Number(slip.commission ?? pi.commission ?? pi.commissionPayout ?? 0);
  const reimbursement = Number(slip.reimbursement ?? pi.reimbursement ?? 0);
  const gross = Number(slip.grossSalary ?? (basic + hra + allowances + bonus + commission + reimbursement));

  const pf = Number(slip.pf ?? pi.pf ?? 0);
  const esi = Number(slip.esi ?? pi.esi ?? 0);
  const tds = Number(slip.tds ?? pi.tds ?? 0);
  const loan = Number(slip.loanDeduction ?? pi.loanDeduction ?? 0);
  const lop = Number(slip.unpaidLeaveDeduction ?? pi.unpaidLeaveDeduction ?? pi.lopDeduction ?? 0);
  const otherDed = Number(slip.otherDeductions ?? pi.otherDeductions ?? 0);
  const totalDed = Number(slip.totalDeductions ?? (pf + esi + tds + loan + lop + otherDed));
  const net = Number(slip.netSalary ?? Math.max(0, gross - totalDed));

  const earningsList: [string, number][] = [
    ['Basic Salary', basic],
    ['HRA Allowance', hra],
    ['Allowances & Special', allowances],
  ];
  if (bonus > 0) earningsList.push(['Bonus / Incentives', bonus]);
  if (commission > 0) earningsList.push(['Commission', commission]);
  if (reimbursement > 0) earningsList.push(['Expense Reimbursement', reimbursement]);

  const deductionsList: [string, number][] = [
    ['Provident Fund (PF)', pf],
    ['ESI Contribution', esi],
    ['TDS / Income Tax', tds],
  ];
  if (loan > 0) deductionsList.push(['Loan EMI Deduction', loan]);
  if (lop > 0) deductionsList.push(['Loss of Pay (LOP)', lop]);
  if (otherDed > 0) deductionsList.push(['Other Deductions', otherDed]);

  const maxRows = Math.max(earningsList.length, deductionsList.length);
  const financialRows: any[] = [];
  for (let i = 0; i < maxRows; i++) {
    const earn = earningsList[i];
    const ded = deductionsList[i];
    financialRows.push([
      earn ? earn[0] : '',
      earn ? formatInr(earn[1]) : '',
      ded ? ded[0] : '',
      ded ? formatInr(ded[1]) : '',
    ]);
  }

  // Totals row
  financialRows.push([
    { content: 'Total Gross Salary', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
    { content: formatInr(gross), styles: { fontStyle: 'bold', halign: 'right', fillColor: [248, 250, 252] } },
    { content: 'Total Deductions', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
    { content: formatInr(totalDed), styles: { fontStyle: 'bold', halign: 'right', textColor: [220, 38, 38], fillColor: [248, 250, 252] } },
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 4,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    head: [
      [
        { content: 'EARNINGS', colSpan: 2, styles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' } },
        { content: 'DEDUCTIONS', colSpan: 2, styles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold' } },
      ],
      [
        { content: 'Component', styles: { fontStyle: 'bold' } },
        { content: 'Amount', styles: { fontStyle: 'bold', halign: 'right' } },
        { content: 'Component', styles: { fontStyle: 'bold' } },
        { content: 'Amount', styles: { fontStyle: 'bold', halign: 'right' } },
      ],
    ],
    columnStyles: {
      1: { halign: 'right' },
      3: { halign: 'right' },
    },
    body: financialRows,
  });

  // 5. Net Payable Banner
  const netY = (doc as any).lastAutoTable.finalY + 5;
  doc.setFillColor(236, 253, 245); // Emerald 50
  doc.setDrawColor(34, 197, 94); // Emerald 500
  doc.roundedRect(margin, netY, printableWidth, 20, 2, 2, 'FD');

  doc.setTextColor(21, 128, 61); // Emerald 700
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('NET PAYABLE (TAKE HOME SALARY)', margin + 6, netY + 8);

  doc.setFontSize(14);
  doc.text(formatInr(net), margin + 6, netY + 16);

  doc.setTextColor(100, 116, 139); // Slate 500
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Confidential Document — Generated electronically by QB Suite', rightX, netY + 12, { align: 'right' });

  // Convert jsPDF document to binary Blob
  const arrayBuffer = doc.output('arraybuffer');
  return new Blob([arrayBuffer], { type: 'application/pdf' });
}

export async function generateAndDownloadSalarySlipPdf(slip: any, filename: string): Promise<void> {
  const toastId = 'pdf-dl';
  try {
    toast.loading('Generating official salary slip PDF...', { id: toastId });
    const blob = await generateClientSalarySlipPdfBlob(slip);

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);

    toast.success('Official salary slip PDF downloaded successfully', { id: toastId });
  } catch (err: any) {
    toast.error('Failed to generate salary slip PDF', { id: toastId });
    throw err;
  }
}

export async function generateAndViewSalarySlipPdf(slip: any): Promise<void> {
  const toastId = 'pdf-view';
  try {
    toast.loading('Opening official salary slip PDF...', { id: toastId });
    const blob = await generateClientSalarySlipPdfBlob(slip);
    const url = window.URL.createObjectURL(blob);
    const preview = window.open(url, '_blank');
    if (!preview) {
      window.URL.revokeObjectURL(url);
      throw new Error('PDF viewing was blocked by browser. Please allow popups or click Download.');
    }
    window.setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    toast.dismiss(toastId);
  } catch (err: any) {
    toast.error('Failed to view salary slip PDF', { id: toastId });
    throw err;
  }
}
