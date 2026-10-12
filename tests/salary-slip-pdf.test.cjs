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

const pdfHelperPath = path.resolve(__dirname, '../lib/pdf-download.util.ts');
const pdfHelper = new Module(pdfHelperPath);
let pdfRequest;
const pdfErrorToasts = [];
pdfHelper.require = (name) => {
  if (name === './api') return { default: { get: (...args) => pdfRequest(...args) } };
  if (name === 'react-hot-toast') return { toast: { loading: () => {}, error: (message) => pdfErrorToasts.push(message) } };
  if (name === './utils') return { getErrorMessage: (err) => err.message };
  throw new Error(`Unexpected import ${name}`);
};
pdfHelper._compile(ts.transpileModule(fs.readFileSync(pdfHelperPath, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, pdfHelperPath);
test('accepts wrapped and interceptor-unwrapped valid PDF bytes', async () => {
  const blob = new Blob(['%PDF-1.7\nfixture\n%%EOF\n'], { type: 'application/pdf' });
  assert.equal(await pdfHelper.exports.extractPdfBlob(blob), blob);
  assert.equal(await pdfHelper.exports.extractPdfBlob({ data: blob }), blob);
});
test('rejects a server error response instead of downloading it as PDF', async () => {
  await assert.rejects(pdfHelper.exports.extractPdfBlob(new Blob(['{"message":"Salary slip not found"}'], { type: 'application/json' })), /Salary slip not found/);
  await assert.rejects(pdfHelper.exports.extractPdfBlob(new Blob(['<html>Login<\/html>'], { type: 'text/html' })), /web page instead of a PDF/);
});
test('rejects empty and incomplete PDF responses', async () => {
  await assert.rejects(pdfHelper.exports.extractPdfBlob(new Blob([])), /empty PDF/);
  await assert.rejects(pdfHelper.exports.extractPdfBlob(new Blob(['%PDF-1.7\ntruncated'])), /incomplete PDF/);
});

test('shows status and response type when the API sends a placeholder instead of PDF', async () => {
  pdfRequest = async (_endpoint, config) => {
    const body = new Blob(['{"message":"Download salary slip PDF"}'], { type: 'application/json' });
    return config.transformResponse[0](body, { 'content-type': 'application/json; charset=utf-8' }, 200);
  };
  await assert.rejects(pdfHelper.exports.downloadPdfFromEndpoint('/admin/payroll/slips/109/download', 'slip.pdf'), /Download salary slip PDF/);
  assert.equal(pdfErrorToasts.at(-1), 'PDF request failed (HTTP 200; application/json): Download salary slip PDF');
});
test('shows the actual failure status and decoded server message', async () => {
  pdfRequest = async () => {
    throw { response: { status: 403, data: new Blob(['{"message":"Forbidden"}'], { type: 'application/json' }) } };
  };
  await assert.rejects(pdfHelper.exports.downloadPdfFromEndpoint('/admin/payroll/slips/109/download', 'slip.pdf'));
  assert.equal(pdfErrorToasts.at(-1), 'PDF request failed (HTTP 403): Forbidden');
});
