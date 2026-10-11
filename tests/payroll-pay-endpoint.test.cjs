const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const page = fs.readFileSync(path.resolve(__dirname, '../app/(dashboard)/payroll/page.tsx'), 'utf8');
const controllerPath = path.resolve(__dirname, '../../quickboom-crm-backend/src/modules/payroll/payroll.controller.ts');

function payMutationSource() {
  const start = page.indexOf('const payItemMutation = useMutation(');
  assert.ok(start >= 0, 'payItemMutation not found');
  return page.slice(start, page.indexOf('const disburseMutation', start));
}

test('Mark as Paid posts the payroll item id to /admin/payroll/items/:id/pay', () => {
  const src = payMutationSource();
  assert.match(src, /api\.post\(`\/admin\/payroll\/items\/\$\{itemId\}\/pay`/);
  assert.match(page, /payItemMutation\.mutate\(payTarget\.id\)/);
  assert.match(page, /onClick=\{\(\) => setPayTarget\(item\)\}/);
});

test('frontend path matches the backend controller route', { skip: !fs.existsSync(controllerPath) }, () => {
  const controller = fs.readFileSync(controllerPath, 'utf8');
  assert.match(controller, /@Controller\('admin\/payroll'\)/);
  assert.match(controller, /@Post\('items\/:itemId\/pay'\)/);
});

test('API errors surface to the user and an already-paid conflict refreshes the list', () => {
  const src = payMutationSource();
  assert.match(src, /onError:[\s\S]*toast\.error\(getErrorMessage\(err\)\)/);
  assert.match(src, /status === 409[\s\S]*setPayTarget\(null\)[\s\S]*invalidateQueries\(\{ queryKey: \['admin-current-payroll'\] \}\)/);
});
