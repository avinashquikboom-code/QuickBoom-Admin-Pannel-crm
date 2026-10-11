const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Module = require('node:module');
// Execute the actual small TS adapter, without starting Next or calling any API.
const filename = path.resolve(__dirname, '../lib/commission-ledger.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const adapter = new Module(filename);
adapter._compile(compiled, filename);
const { normalizeCommissionLedgerResponse } = adapter.exports;
const payload = { statusCode: 200, success: true, data: [{ id: 1, customerId: 50, employeeId: 10, commissionAmount: 300 }], summary: { totalCommission: 300, approvedCommission: 150, paidCommission: 150 }, meta: { total: 1, page: 1, limit: 15, totalPages: 1 } };

test('actual interceptor response retains real rows and sibling summary/pagination', () => {
  const result = normalizeCommissionLedgerResponse(payload);
  assert.equal(result.data[0].id, 1);
  assert.equal(result.summary.totalCommission, 300);
  assert.equal(result.meta.total, 1);
});
test('raw Axios and nested envelopes preserve the same ledger', () => {
  assert.deepEqual(normalizeCommissionLedgerResponse({ data: payload }), normalizeCommissionLedgerResponse(payload));
});
test('genuinely empty persisted result stays empty and keeps its actual totals', () => {
  const result = normalizeCommissionLedgerResponse({ ...payload, data: [], meta: { ...payload.meta, total: 0 }, summary: { totalCommission: 0 } });
  assert.equal(result.data.length, 0); assert.equal(result.meta.total, 0);
});
test('discarded metadata, malformed and failed responses cannot masquerade as no records', () => {
  assert.throws(() => normalizeCommissionLedgerResponse(payload.data));
  assert.throws(() => normalizeCommissionLedgerResponse({ data: [], success: false }));
  assert.throws(() => normalizeCommissionLedgerResponse({ data: [], summary: {}, meta: {} }));
});
