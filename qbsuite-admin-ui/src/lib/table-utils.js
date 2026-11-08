export function searchableText(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(searchableText).join(' ');
  if (typeof value === 'object') return Object.values(value).map(searchableText).join(' ');
  return String(value);
}
const normalize = (value) => String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
const aliases = { estimatedvalue: ['value'], contact: ['name'], organization: ['company'], closeddeals: ['dealsCount'], revenue: ['totalRevenue'], claimidemployee: ['employeeName'], datesubmitted: ['submittedDate','date'], receipt: ['receiptName'], breaktime: ['breakDuration'], latedelay: ['lateDuration'], deductions: ['totalDeductions'], netpayable: ['netPay'], overtimeclaims: ['overtimePay'],  employee: ['employeeName', 'name'], customer: ['name', 'customerName'], lead: ['name', 'businessName'], gross: ['grossPay'], net: ['netPay'], amount: ['amount', 'estimatedAmount'], rate: ['hourlyRate'], date: ['date', 'createdAt'], role: ['designation', 'role'] };
export function legacyValue(row, column) {
  if (column.accessorFn) return column.accessorFn(row);
  if (column.sortValue) return column.sortValue(row);
  if (column.accessorKey) return column.accessorKey.split('.').reduce((value, key) => value?.[key], row);
  const key = normalize(column.header);
  const exact = Object.keys(row).find((field) => normalize(field) === key);
  if (exact) return row[exact];
  return (aliases[key] || []).map((field) => row[field]).find((value) => value != null) ?? null;
}
