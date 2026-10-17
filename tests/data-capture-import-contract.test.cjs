const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadApi(api) {
  const code = ts.transpileModule(fs.readFileSync(require.resolve('../lib/data-capture-api.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const scope = { exports: {}, require: (name) => { assert.equal(name, './api'); return { default: api }; }, process: { env: { NODE_ENV: 'production' } } };
  vm.runInNewContext(code, scope);
  return scope.exports;
}
const lead = { id: 7, companyName: 'Contract fixture' };
const place = { id: 3, importedLeadId: 7, isImported: true, status: 'LEAD_CREATED', createdAt: '2026-10-17T00:00:00Z', source: 'GOOGLE_PLACES' };

test('uses the production-registered single-record create-lead route', async () => {
  const calls = [];
  const { dataCaptureApi } = loadApi({ post: async (...args) => { calls.push(args); return { success: true, data: { lead, place } }; } });
  const result = await dataCaptureApi.importLead(3);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], '/data-capture/3/create-lead');
  assert.equal(result.lead.id, 7);
  assert.equal(result.record.importedLeadId, 7);
  assert.equal(result.record.capturedAt, place.createdAt);
});

test('accepts newer record responses and retains already-imported information', () => {
  const { normalizeLeadImportResponse } = loadApi({});
  const result = normalizeLeadImportResponse({ data: { lead, record: { ...place, capturedAt: place.createdAt }, alreadyImported: true } });
  assert.equal(result.record.importedLeadId, 7);
  assert.equal(result.alreadyImported, true);
});

test('does not manufacture import success when the response lacks a persisted matching link', () => {
  const { normalizeLeadImportResponse } = loadApi({});
  for (const record of [{}, { ...place, importedLeadId: 8 }, { ...place, isImported: false }, { ...place, status: 'REJECTED' }]) {
    assert.throws(() => normalizeLeadImportResponse({ data: { lead, place: record } }), /verified Lead link/);
  }
});

for (const status of [400, 404, 409, 500]) {
  test(`preserves HTTP ${status} errors without a fallback PATCH or false success`, async () => {
    const error = { response: { status, data: { message: `Backend ${status} detail` } } };
    let patchCount = 0;
    const { dataCaptureApi } = loadApi({ post: async () => { throw error; }, patch: async () => { patchCount++; } });
    await assert.rejects(dataCaptureApi.importLead(3), (received) => received === error);
    assert.equal(patchCount, 0);
  });
}

test('posts only explicit capture IDs to the registered bulk import endpoint', async () => {
  const calls = [];
  const result = { imported: [{ captureId: 3, leadId: 7 }], alreadyImported: [], skipped: [], failed: [] };
  const { dataCaptureApi } = loadApi({ post: async (...args) => { calls.push(args); return { success: true, data: result }; } });
  assert.equal((await dataCaptureApi.importLeads([3])).data, result);
  assert.equal(calls[0][0], '/data-capture/import-to-leads');
  assert.equal(JSON.stringify(calls[0][1]), '{"ids":[3]}');
});

function loadWorkflow() {
  const code = ts.transpileModule(fs.readFileSync(require.resolve('../lib/data-capture-workflow.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const scope = { exports: {} };
  vm.runInNewContext(code, scope);
  return scope.exports;
}

test('mixed selection transitions from Validate 3 to Import 3 without touching the existing Lead', () => {
  const { getDataCaptureSelection, getDataCaptureWorkflow } = loadWorkflow();
  const records = [{ id: 1, status: 'LEAD_CREATED', importedLeadId: 7, isImported: true },
    ...[2, 3, 4].map(id => ({ id, status: 'CAPTURED' })),
    { id: 5, status: 'REJECTED' }, { id: 6, status: 'DUPLICATE' }, { id: 8, status: 'VALIDATED' }];
  const ids = [1, 2, 3, 4, 5, 6, 99];
  const before = getDataCaptureSelection(records, ids);
  assert.equal(before.captured.length, 3);
  assert.equal(before.validated.length, 0);
  before.captured.forEach(record => { record.status = 'VALIDATED'; });
  const after = getDataCaptureSelection(records, ids);
  assert.equal(after.captured.length, 0);
  assert.equal(JSON.stringify(after.validated.map(record => record.id)), '[2,3,4]');
  after.validated.forEach(record => { record.status = 'LEAD_CREATED'; record.isImported = true; });
  assert.equal(getDataCaptureSelection(records, ids).validated.length, 0);
  assert.equal(getDataCaptureWorkflow({ status: 'LEAD_IMPORTED' }).isImported, true);
});
