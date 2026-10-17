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
