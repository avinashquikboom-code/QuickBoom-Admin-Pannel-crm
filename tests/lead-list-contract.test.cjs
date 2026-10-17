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
  const result = load().normalizeLeadList({ data: { data: rows, total: 42, page: 3, limit: 20, totalPages: 3 } });
  assert.equal(result.data.length, 2);
  assert.equal(result.page, 3);
  assert.equal(result.total, 42);
});
test('valid empty list stays empty', () => {
  const result = load().normalizeLeadList({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
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

test('legacy flat totals use actual request page/limit and calculate page count', () => {
  const result = load().normalizeLeadList({ data: rows, total: 42 }, { page: 2, limit: 10 });
  assert.equal(result.page, 2);
  assert.equal(result.pagination.limit, 10);
  assert.equal(result.totalPages, 5);
});
test('accepts meta pagination with pageSize', () => {
  const result = load().normalizeLeadList({ data: rows, meta: { page: 1, pageSize: 10, total: 2, totalPages: 1 } });
  assert.equal(result.pagination.limit, 10);
});
test('does not manufacture totals or accept invalid/inconsistent metadata', () => {
  const normalize = load().normalizeLeadList;
  for (const response of [
    { data: rows },
    { data: rows, total: '2' },
    { data: rows, total: 2, pagination: { page: 0, limit: 20 } },
    { data: rows, total: 2, totalPages: 9 },
  ]) assert.throws(() => normalize(response, { page: 1, limit: 20 }));
});

test('handles real production API response with meta envelope', () => {
  const prodResponse = {
    statusCode: 200,
    success: true,
    message: 'Operation completed successfully',
    data: rows,
    meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
  };
  const result = load().normalizeLeadList(prodResponse, { page: 1, limit: 20 });
  assert.equal(result.data.length, 2);
  assert.equal(result.total, 2);
  assert.equal(result.page, 1);
  assert.equal(result.limit, 20);
  assert.equal(result.totalPages, 1);
  assert.equal(result.pagination.page, 1);
  assert.equal(result.pagination.limit, 20);
  assert.equal(result.pagination.total, 2);
  assert.equal(result.pagination.totalPages, 1);
});

test('handles response with items array instead of data', () => {
  const itemsResponse = {
    statusCode: 200,
    success: true,
    message: 'Operation completed successfully',
    items: rows,
    pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
  };
  const result = load().normalizeLeadList(itemsResponse);
  assert.equal(result.data.length, 2);
  assert.equal(result.items.length, 2);
  assert.equal(result.total, 2);
  assert.equal(result.page, 1);
});

test('leadsApi.list passes search, status, page, and limit query params correctly', async () => {
  let capturedConfig;
  const { leadsApi } = load({
    get: async (path, config) => {
      capturedConfig = config;
      return {
        statusCode: 200,
        success: true,
        data: rows,
        pagination: { page: 2, limit: 10, total: 12, totalPages: 2 },
      };
    },
  });
  const result = await leadsApi.list({ page: 2, limit: 10, search: 'Acme', status: 'NEW' });
  assert.equal(capturedConfig.params.page, 2);
  assert.equal(capturedConfig.params.limit, 10);
  assert.equal(capturedConfig.params.search, 'Acme');
  assert.equal(capturedConfig.params.status, 'NEW');
  assert.equal(result.page, 2);
  assert.equal(result.limit, 10);
  assert.equal(result.total, 12);
  assert.equal(result.totalPages, 2);
});

