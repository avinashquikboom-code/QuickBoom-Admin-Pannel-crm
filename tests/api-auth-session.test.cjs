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
    if (name === './store') return { useAuthStore: { getState: () => state, setState: patch => Object.assign(state, patch) } };
    if (name === './employee-store') return { useEmployeeAuthStore: { getState: () => employee, setState: patch => Object.assign(employee, patch) } };
    if (name === 'react-hot-toast') return { toast: { error() {} } };
    if (name === './utils') return { getErrorMessage: error => error.message };
    throw new Error(`Unexpected import ${name}`);
  }, window, localStorage: { getItem: key => storage.get(key) || null },
  Buffer, Date, FormData, atob, process: { env: { NODE_ENV: 'production' } }, console });
  return { exports, storage, window, state, employee, hooks, axios };
}
const config = () => ({ method: 'get', url: '/employees/12', headers: new AxiosHeaders(), params: {} });
test('Lead GET uses a refresh token rotated in another tab even when access token is unchanged', async () => {
  const f = fixture();
  f.window.location.pathname = '/leads';
  f.storage.set('quikboom-next-auth-storage', JSON.stringify({ state: {
    token: f.state.token, refreshToken: 'rotated-refresh', user: f.state.user,
  } }));
  let calls = 0;
  f.axios.post = async (_url, body) => {
    calls++;
    assert.equal(body.refreshToken, 'rotated-refresh');
    return { data: { accessToken: token(1, 4500000000), refreshToken: 'next-refresh' } };
  };
  const request = await f.hooks.request({ ...config(), url: '/leads', params: { limit: 1, status: 'NEW' } });
  const retry = await f.hooks.error({ config: request, response: { status: 401 } });
  assert.equal(calls, 1);
  assert.equal(retry.url, '/leads');
  assert.deepEqual(retry.params, { limit: 1, status: 'NEW' });
  assert.equal(retry.headers.get('Authorization'), `Bearer ${f.state.token}`);
});

test('concurrent refresh with Web Locks reuses a rotated refresh pair when access token is identical', async () => {
  const f = fixture();
  let tail = Promise.resolve(), calls = 0;
  f.window.navigator = { locks: { request(_name, run) {
    const result = tail.then(run); tail = result.catch(() => {}); return result;
  } } };
  const access = f.state.token;
  f.axios.post = async () => {
    calls++;
    return { data: { accessToken: access, refreshToken: `rotated-${calls}` } };
  };
  assert.deepEqual(await Promise.all([
    f.exports.performTokenRefresh(), f.exports.performTokenRefresh(),
  ]), [access, access]);
  assert.equal(calls, 1);
});

test('expired Lead GET refreshes before sending; rejected refresh requires login', async () => {
  const f = fixture(); f.window.location.pathname = '/leads'; f.state.token = token(1, 1);
  let calls = 0;
  f.axios.post = async () => {
    calls++;
    return { data: { accessToken: token(1, 4500000000), refreshToken: 'rotated' } };
  };
  const request = await f.hooks.request({ ...config(), url: '/leads', params: { limit: 1, status: 'NEW' } });
  assert.equal(calls, 1);
  assert.equal(request.headers.get('Authorization'), `Bearer ${f.state.token}`);
  f.state.token = 'invalid-token';
  const invalidRequest = await f.hooks.request({ ...config(), url: '/leads' });
  f.axios.post = async () => { throw { response: { status: 401 } }; };
  await assert.rejects(f.hooks.error({ config: invalidRequest, response: { status: 401 } }));
  assert.equal(f.state.token, null);
  assert.equal(f.state.refreshToken, null);
  assert.equal(f.window.location.href, '/login');
});

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

test('Lead stage PATCH refreshes an expired token before sending the mutation', async () => {
  const f = fixture();
  f.window.location.pathname = '/leads';
  f.state.token = token(1, 1);
  const next = token(1, 4500000000);
  let calls = 0;
  f.axios.post = async (url, body) => {
    calls++;
    assert.equal(url, 'https://example.test/api/v1/auth/refresh');
    assert.equal(body.refreshToken, 'fixture-refresh');
    return { data: { data: { accessToken: next, refreshToken: 'rotated' } } };
  };
  const request = { ...config(), method: 'patch', url: '/leads/943/status', data: { status: 'FOLLOW_UP', stageId: 4 } };
  const sent = await f.hooks.request(request);
  assert.equal(calls, 1);
  assert.equal(sent.headers.get('Authorization'), `Bearer ${next}`);
  assert.equal(sent.url, '/leads/943/status');
  assert.equal(sent.method, 'patch');
  assert.equal(sent.data.status, 'FOLLOW_UP');
});

test('generic Lead stage 401 refreshes and replays the same PATCH and payload once', async () => {
  const f = fixture();
  f.window.location.pathname = '/leads';
  const request = await f.hooks.request({ ...config(), method: 'patch', url: '/leads/943/status', data: { status: 'CONTACTED', stageId: 2 } });
  const next = token(1, 4500000000);
  let calls = 0;
  f.axios.post = async () => { calls++; return { data: { data: { tokens: { accessToken: next, refreshToken: 'rotated' } } } }; };
  const retry = await f.hooks.error({ config: request, response: { status: 401, data: { success: false, message: 'Invalid or expired authentication token' } } });
  assert.equal(calls, 1);
  assert.equal(retry.headers.get('Authorization'), `Bearer ${next}`);
  assert.equal(retry.url, request.url);
  assert.equal(retry.method, 'patch');
  assert.equal(retry.data, request.data);
  assert.equal(retry._retry, true);
});

test('transient proactive refresh failure stops the expired PATCH and permits a later retry', async () => {
  const f = fixture(); f.state.token = token(1, 1);
  const unavailable = { response: { status: 503 }, message: 'Refresh temporarily unavailable' };
  f.axios.post = async () => { throw unavailable; };
  const request = { ...config(), method: 'patch', url: '/leads/943/status', data: { status: 'NEW' } };
  await assert.rejects(f.hooks.request(request), error => error === unavailable);
  assert.equal(request.headers.has('Authorization'), false);
  assert.equal(f.state.refreshToken, 'fixture-refresh');
  assert.equal(f.window.location.href, '');
  f.axios.post = async () => ({ data: { accessToken: token(1, 4500000000), refreshToken: 'rotated' } });
  const retry = await f.hooks.request({ ...config(), method: 'patch', url: '/leads/943/status', data: request.data });
  assert.equal(retry.headers.get('Authorization'), `Bearer ${f.state.token}`);
});

test('revoked proactive refresh stops the Lead update and requires login', async () => {
  const f = fixture(); f.window.location.pathname = '/leads'; f.state.token = token(1, 1);
  f.axios.post = async () => { throw { response: { status: 401 } }; };
  await assert.rejects(f.hooks.request({ ...config(), method: 'patch', url: '/leads/943/status' }));
  assert.equal(f.state.token, null);
  assert.equal(f.window.location.href, '/login');
});

for (const pathname of ['/data-capture', '/employee/data-capture']) {
  test(`import uses the complete session rotated by another tab: ${pathname}`, async () => {
    const f = fixture(); f.window.location.pathname = pathname;
    const employee = pathname.startsWith('/employee/');
    const state = employee ? f.employee : f.state;
    const next = token(state.user.id, 4500000000);
    f.storage.set(employee ? 'qb-employee-auth-storage' : 'quikboom-next-auth-storage', JSON.stringify({ state: {
      token: next, refreshToken: 'rotated-in-another-tab', user: state.user,
    } }));
    const sent = await f.hooks.request({ ...config(), method: 'post', url: '/data-capture/import-to-leads', data: { ids: [101] } });
    assert.equal(sent.headers.get('Authorization'), `Bearer ${next}`);
    assert.equal(state.token, next);
    assert.equal(state.refreshToken, 'rotated-in-another-tab');
    assert.deepEqual(sent.data, { ids: [101] });
  });
}
test('logout in another tab removes the stale import credentials', async () => {
  const f = fixture();
  f.storage.set('quikboom-next-auth-storage', JSON.stringify({ state: { token: null, refreshToken: null, user: null } }));
  const sent = await f.hooks.request({ ...config(), method: 'post', url: '/data-capture/import-to-leads', data: { ids: [101] } });
  assert.equal(sent.headers.has('Authorization'), false);
  assert.equal(f.state.refreshToken, null);
});
test('two tabs sharing a rotating refresh token serialize through Web Locks', async () => {
  const first = fixture(), second = fixture();
  let tail = Promise.resolve(), calls = 0;
  const locks = { request(_name, run) { const result = tail.then(run); tail = result.catch(() => {}); return result; } };
  first.window.navigator = second.window.navigator = { locks };
  const next = token(1, 4500000000);
  first.axios.post = second.axios.post = async () => { calls++; return { data: { accessToken: next, refreshToken: 'rotated' } }; };
  first.state.updateTokens = function(access, refreshToken) {
    this.token = access; this.refreshToken = refreshToken;
    const persisted = JSON.stringify({ state: { user: this.user, token: access, refreshToken } });
    first.storage.set('quikboom-next-auth-storage', persisted);
    second.storage.set('quikboom-next-auth-storage', persisted);
  };
  const tokens = await Promise.all([first.exports.performTokenRefresh(), second.exports.performTokenRefresh()]);
  assert.deepEqual(tokens, [next, next]);
  assert.equal(calls, 1);
  assert.equal(second.state.refreshToken, 'rotated');
});
test('bulk import refreshes a rejected token and replays exactly the same JSON once', async () => {
  const f = fixture();
  const request = await f.hooks.request({ ...config(), method: 'post', url: '/data-capture/import-to-leads', data: { ids: [101, 102] } });
  let calls = 0;
  f.axios.post = async () => { calls++; return { data: { accessToken: token(1, 4500000000), refreshToken: 'rotated' } }; };
  const retry = await f.hooks.error({ config: request, response: { status: 401 } });
  assert.equal(calls, 1);
  assert.equal(retry.method, 'post'); assert.equal(retry.url, request.url); assert.equal(retry.data, request.data);
  await assert.rejects(f.hooks.error({ config: retry, response: { status: 401 } }));
  assert.equal(calls, 1); assert.equal(f.state.token, null);
});
test('bulk import permission denial remains 403 without refreshing or replaying', async () => {
  const f = fixture();
  const request = await f.hooks.request({ ...config(), method: 'post', url: '/data-capture/import-to-leads', data: { ids: [101] } });
  const error = { config: request, response: { status: 403, data: { message: 'Access denied' } } };
  await assert.rejects(f.hooks.error(error), caught => caught === error);
  assert.ok(f.state.token);
});

test('freshly refreshed token is not downgraded by stale persisted storage during retry', async () => {
  const f = fixture();
  const oldExpired = token(1, 1000);
  f.state.token = oldExpired;
  f.storage.set('quikboom-next-auth-storage', JSON.stringify({ state: { user: f.state.user, token: oldExpired, refreshToken: 'fixture-refresh' } }));

  const nextFresh = token(1, 4500000000);
  f.axios.post = async () => ({ data: { accessToken: nextFresh, refreshToken: 'rotated-refresh' } });

  const request = await f.hooks.request({ ...config(), method: 'post', url: '/data-capture/import-to-leads', data: { ids: [55] } });
  // Proactive refresh ran because oldExpired had exp <= Date.now() + 15000
  assert.equal(request.headers.get('Authorization'), `Bearer ${nextFresh}`);
  assert.equal(f.state.token, nextFresh);
  assert.equal(f.exports.getPersistedAuthSession().token, nextFresh);
});
