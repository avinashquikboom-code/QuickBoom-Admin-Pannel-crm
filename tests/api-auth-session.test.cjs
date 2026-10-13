const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { AxiosHeaders } = require('axios');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/api.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
}).outputText;
const token = (id, exp = 4000000000) => `test.${Buffer.from(JSON.stringify({ sub: id, exp })).toString('base64url')}.fixture`;
function fixture() {
  const storage = new Map(), hooks = {}, window = { location: { pathname: '/employees/12', href: '' } };
  const state = { token: token(1), refreshToken: 'fixture-refresh', user: { id: 1, customerId: 5 }, _hasHydrated: true,
    updateTokens(access, refresh) { this.token = access; this.refreshToken = refresh; },
    logout() { this.token = null; this.refreshToken = null; this.user = null; } };
  const employee = { ...state, user: { id: 2 }, token: token(2) };
  const client = { defaults: { baseURL: 'https://example.test/api/v1', headers: { common: {} } },
    interceptors: { request: { use(ok) { hooks.request = ok; } }, response: { use(ok, fail) { hooks.error = fail; } } },
    request: async config => config };
  const axios = { create: () => client, post: async () => { throw new Error('Unexpected network call'); } }, exports = {};
  vm.runInNewContext(source, { exports, require(name) {
    if (name === 'axios') return axios;
    if (name === './store') return { useAuthStore: { getState: () => state } };
    if (name === './employee-store') return { useEmployeeAuthStore: { getState: () => employee } };
    if (name === 'react-hot-toast') return { toast: { error() {} } };
    if (name === './utils') return { getErrorMessage: error => error.message };
    throw new Error(`Unexpected import ${name}`);
  }, window, localStorage: { getItem: key => storage.get(key) || null },
  Buffer, Date, FormData, atob, process: { env: { NODE_ENV: 'production' } }, console });
  return { exports, storage, window, state, employee, hooks, axios };
}
const config = () => ({ method: 'get', url: '/employees/12', headers: new AxiosHeaders(), params: {} });
test('current session wins over later-expiring legacy credentials; request uses Bearer', async () => {
  const f = fixture(); f.storage.set('accessToken', token(99, 5000000000));
  f.storage.set('refreshToken', 'unrelated');
  const session = f.exports.getPersistedAuthSession();
  assert.equal(session.token, f.state.token); assert.equal(session.refreshToken, f.state.refreshToken);
  const sent = await f.hooks.request(config());
  assert.equal(sent.headers.get('Authorization'), `Bearer ${f.state.token}`);
});
test('hydration preserves the persisted pair; employee portal cannot borrow admin credentials', () => {
  const f = fixture(); f.state._hasHydrated = false;
  f.storage.set('quikboom-next-auth-storage', JSON.stringify({ state: { token: token(3), refreshToken: 'persisted', user: { id: 3 } } }));
  f.storage.set('refreshToken', 'unrelated');
  assert.equal(f.exports.getPersistedAuthSession().user.id, 3);
  assert.equal(f.exports.getPersistedAuthSession().refreshToken, 'persisted');
  f.window.location.pathname = '/employee/dashboard'; f.employee.logout();
  assert.equal(f.exports.getPersistedAuthSession().token, null);
});
test('logout strips stale Authorization and tenant headers without resurrecting legacy token', async () => {
  const f = fixture(); f.state.logout(); f.storage.set('accessToken', token(99));
  const request = config(); request.headers.set('Authorization', 'Bearer fixture'); request.headers.set('x-customer-id', '99');
  const sent = await f.hooks.request(request);
  assert.equal(sent.headers.has('Authorization'), false); assert.equal(sent.headers.has('x-customer-id'), false);
});
test('concurrent refresh shares one request and saves rotated credentials', async () => {
  const f = fixture(); let finish, calls = 0;
  f.axios.post = () => { calls++; return new Promise(resolve => { finish = resolve; }); };
  const first = f.exports.performTokenRefresh(), second = f.exports.performTokenRefresh(), next = token(1, 4500000000);
  finish({ data: { data: { tokens: { accessToken: next, refreshToken: 'rotated' } } } });
  assert.deepEqual(await Promise.all([first, second]), [next, next]);
  assert.equal(calls, 1); assert.equal(f.state.token, next); assert.equal(f.state.refreshToken, 'rotated');
});
test('refresh completing after account switching cannot replace the new session', async () => {
  const f = fixture(); let finish;
  f.axios.post = () => new Promise(resolve => { finish = resolve; });
  const pending = f.exports.performTokenRefresh();
  f.state.user = { id: 2 }; f.state.token = token(2); f.state.refreshToken = 'new-account';
  finish({ data: { accessToken: token(1), refreshToken: 'old-account' } });
  await assert.rejects(pending, /session changed/); assert.equal(f.state.refreshToken, 'new-account');
});
test('refresh rejection clears credentials, navigates to login, and preserves backend 401', async () => {
  const f = fixture(), request = await f.hooks.request(config());
  const error = { config: request, response: { status: 401, data: { message: 'Invalid or expired authentication token' } } };
  f.axios.post = async () => { throw { response: { status: 401 } }; };
  await assert.rejects(f.hooks.error(error), caught => caught === error);
  assert.equal(f.state.token, null); assert.equal(f.window.location.href, '/login');
});
test('late 401 reuses refreshed token and retry is bounded', async () => {
  const f = fixture(), request = await f.hooks.request(config()); f.state.token = token(1, 4500000000);
  const retry = await f.hooks.error({ config: request, response: { status: 401 } });
  assert.equal(retry.headers.get('Authorization'), `Bearer ${f.state.token}`); assert.equal(retry._retry, true);
  await assert.rejects(f.hooks.error({ config: retry, response: { status: 401 } })); assert.equal(f.state.token, null);
});
