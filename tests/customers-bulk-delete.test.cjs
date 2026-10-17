const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/customers-api.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
function load(post) {
  const exports = {};
  vm.runInNewContext(source, { exports, require: () => ({ post }) });
  return exports.customersApi;
}
for (const ids of [[2], [2, 3]]) {
  test(`deletes ${ids.length} selected customer(s) using authenticated client POST and actual count`, async () => {
    const api = load(async (url, body) => {
      assert.equal(url, '/customers/bulk-delete');
      assert.equal(body.ids, ids); assert.equal(body.cancelSubscriptions, false);
      return { success: true, data: { deletedCount: ids.length, ids } };
    });
    assert.equal((await api.bulkDelete(ids)).deletedCount, ids.length);
  });
}
test('rejects invalid selections before making a request', async () => {
  const api = load(() => assert.fail('must not send'));
  for (const ids of [[], [0], ['2'], [1.5], Array(101).fill(2)]) await assert.rejects(api.bulkDelete(ids));
});
test('preserves auth, permission, protected-dependency and server errors', async () => {
  for (const status of [401, 403, 400, 404, 500]) {
    const error = { response: { status } };
    const api = load(async () => { throw error; });
    await assert.rejects(api.bulkDelete([2]), caught => caught === error);
  }
});
test('does not manufacture a deleted count from an invalid success response', async () => {
  await assert.rejects(load(async () => ({ success: true })).bulkDelete([2]), /could not be verified/);
});
