const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(api = {}) {
  const code = ts.transpileModule(fs.readFileSync(require.resolve('../lib/leads-api.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const scope = { exports: {}, process: { env: { NODE_ENV: 'production' } }, require: () => ({ default: api }) };
  vm.runInNewContext(code, scope);
  return scope.exports;
}
const rows = [{ id: 1, source: 'MANUAL', status: 'NEW' }, { id: 2, source: 'DATA_CAPTURE', status: 'NEW' }];
const pagination = { page: 1, limit: 20, total: 2, totalPages: 1 };
test('actual Nest envelope renders manual and imported Leads and preserves sibling pagination', async () => {
  const { leadsApi } = load({ get: async (path, config) => {
    assert.equal(path, '/leads');
    assert.equal(config.params.status, undefined);
    assert.equal(config.params.source, undefined);
    return { success: true, statusCode: 200, data: rows, pagination, total: 2, totalPages: 1 };
  } });
  const result = await leadsApi.list({ page: 1, limit: 20 });
  assert.equal(result.data, rows);
  assert.equal(result.total, 2);
  assert.equal(result.page, 1);
});
test('preserves nested list envelopes and later server pages without slicing again', () => {
  const result = load().normalizeLeadList({ data: { data: rows, total: 42, page: 3, totalPages: 3 } });
  assert.equal(result.data.length, 2);
  assert.equal(result.page, 3);
  assert.equal(result.total, 42);
});
test('valid empty list stays empty', () => {
  const result = load().normalizeLeadList({ data: [], pagination: { page: 1, total: 0, totalPages: 0 } });
  assert.equal(result.data.length, 0);
  assert.equal(result.total, 0);
});
test('malformed and failed responses are errors instead of misleading empty lists', () => {
  for (const value of [{}, { data: rows }, { success: false, data: [], pagination }]) {
    assert.throws(() => load().normalizeLeadList(value));
  }
});
test('HTTP errors propagate to the existing page error state', async () => {
  const error = new Error('Forbidden');
  await assert.rejects(load({ get: async () => { throw error; } }).leadsApi.list({}), e => e === error);
});
