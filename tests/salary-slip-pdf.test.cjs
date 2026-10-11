const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Module = require('node:module');
const filename = path.resolve(__dirname, '../lib/salary-slip-pdf.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const calls = [];
const adapter = new Module(filename);
adapter.require = (name) => {
  assert.equal(name, './pdf-download.util');
  return { downloadPdfFromEndpoint: async (...args) => calls.push(['download', ...args]), viewPdfFromEndpoint: async (...args) => calls.push(['view', ...args]) };
};
adapter._compile(compiled, filename);
test('View and Download use the deployed route through authenticated PDF helpers', async () => {
  await adapter.exports.downloadSalarySlip(109);
  await adapter.exports.viewSalarySlip(109);
  assert.deepEqual(calls, [ ['download', '/admin/payroll/slips/109/download', 'salary-slip-109.pdf'], ['view', '/admin/payroll/slips/109/download'] ]);
});
test('salary slip ID stays within its route segment', () => {
  assert.equal(adapter.exports.salarySlipPdfEndpoint('active-10'), '/admin/payroll/slips/active-10/download');
  assert.equal(adapter.exports.salarySlipPdfEndpoint('1/../../x'), '/admin/payroll/slips/1%2F..%2F..%2Fx/download');
});
test('page actions use the authenticated adapter without direct API navigation', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../app/(dashboard)/payroll/page.tsx'), 'utf8');
  assert.match(source, /downloadSalarySlip\(selectedSlip.id\)/);
  assert.match(source, /viewSalarySlip\(selectedSlip.id\)/);
  assert.doesNotMatch(source, /window.open\(`\/api\/v1\/admin\/payroll/);
});
