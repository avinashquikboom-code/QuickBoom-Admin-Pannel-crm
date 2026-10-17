const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, imports = {}) {
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: name => name in imports ? imports[name] : require(name), Intl, Date });
  return exports;
}
const helpers = load('lib/customer-plan.ts');
const now = Date.parse('2026-10-17T12:00:00Z');
const active = { id: 1, status: 'ACTIVE', startDate: '2026-10-01', endDate: '2027-10-01', plan: { name: 'Premium' }, checkout: { status: 'PAID' } };
test('chooses paid current plan ahead of a newer cancelled plan', () => {
  const result = helpers.customerPlanSummary([ { ...active, id: 2, status: 'CANCELLED' }, active ], now);
  assert.equal(result.displayed.id, 1); assert.equal(result.hasPlan, true);
});
test('pending, expired, cancelled, and empty subscriptions have distinct states', () => {
  assert.equal(helpers.customerPlanSummary([], now).hasPlan, false);
  assert.equal(helpers.subscriptionStatus({ ...active, endDate: '2026-10-01' }, now), 'Expired');
  assert.equal(helpers.subscriptionStatus({ ...active, status: 'CANCELLED' }, now), 'Cancelled');
  const pending = { ...active, status: 'PENDING_ACTIVATION', startDate: '2026-10-19' };
  assert.equal(helpers.customerPlanSummary([pending], now).pending, pending);
  assert.equal(helpers.customerPlanSummary([{ ...active, checkout: { status: 'FAILED' } }], now).hasPlan, false);
});
function render(query, canAssignPlan = true) {
  const { CustomerPlanDrawer } = load('components/admin/drawers/CustomerPlanDrawer.tsx', {
    react: React,
    'next/link': ({ children, ...props }) => React.createElement('a', props, children),
    '@tanstack/react-query': { useQuery: () => query },
    'lucide-react': { CreditCard: () => null },
    '@/lib/api': {}, '@/lib/utils': { getErrorMessage: e => e.message },
    '@/lib/customer-plan': helpers,
    '../dialogs/AdminFormDrawer': { AdminFormDrawer: ({ children }) => React.createElement('div', null, children) },
  });
  return renderToStaticMarkup(React.createElement(CustomerPlanDrawer, { customer: { id: 7, companyName: 'Actual Customer' }, onClose() {}, canAssignPlan }));
}
test('loading and backend errors are not rendered as empty subscription success', () => {
  assert.match(render({ isLoading: true }), /Loading subscription details/);
  const html = render({ isError: true, error: new Error('Access denied') });
  assert.match(html, /Access denied/); assert.match(html, /Retry/); assert.doesNotMatch(html, /No Active Plan/);
});
test('empty customer shows assignment link only when permitted', () => {
  const query = { data: { companyName: 'Actual Customer', subscriptions: [] } };
  assert.match(render(query), /No Active Plan/);
  assert.match(render(query), /\/subscribe\?customerId=7/);
  assert.doesNotMatch(render(query, false), /Choose a plan/);
});
for (const billingCycle of ['MONTHLY', 'YEARLY']) {
  test(`renders saved ${billingCycle} checkout totals, GST, references, and dates`, () => {
    const subscription = { ...active, startDate: '2020-01-01', endDate: '2099-01-01', activationDate: '2020-01-01', createdAt: '2019-12-30', checkout: {
      status: 'PAID', billingCycle, basePaise: 1200000, discountPaise: 120000,
      taxablePaise: 1080000, taxRateBps: 1800, gstPaise: 194400, totalPaise: 1274400,
      paymentId: 'payment-reference', orderId: 'order-reference',
    } };
    const html = render({ data: { companyName: 'Actual Customer', subscriptions: [subscription] } });
    for (const text of ['Premium', billingCycle === 'MONTHLY' ? 'Monthly' : 'Yearly', 'GST (18%)', '12,744.00', '1,944.00', '1,200.00', 'payment-reference', 'Scheduled activation date', 'Activation date', 'Expiry date']) assert.ok(html.includes(text), text);
  });
}
