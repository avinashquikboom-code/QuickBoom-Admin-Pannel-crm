const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const parser = require('@babel/parser');
const generate = require('@babel/generator').default;

// Exercise the actual preview validation and mapping helpers without rendering the drawer.
const source = fs.readFileSync('src/modules/crm/components/BulkImportLeadsDrawer.jsx', 'utf8');
const tree = parser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
const needed = new Set(['CRM_FIELDS', 'normalizeHeader', 'autoDetectField', 'validateRow']);
const code = tree.program.body.filter((node) =>
  (node.type === 'FunctionDeclaration' && needed.has(node.id.name)) ||
  (node.type === 'VariableDeclaration' && node.declarations.some((d) => needed.has(d.id.name)))
).map((node) => generate(node).code).join('\n');
const helpers = vm.runInNewContext(`${code}\n({ autoDetectField, validateRow })`);

test('maps business and contact headers separately', () => {
  assert.equal(helpers.autoDetectField('Business Name'), 'companyName');
  assert.equal(helpers.autoDetectField('Contact Name'), 'leadName');
  assert.equal(helpers.autoDetectField('Contact Number'), 'phone');
  assert.equal(helpers.autoDetectField('Google Rating'), 'rating');
  assert.equal(helpers.autoDetectField('Added On'), 'sourceDate');
});

test('accepts business names without a contact person', () => {
  assert.equal(helpers.validateRow({ companyName: 'Pandav Restaurant', phone: '09876543210 / +91 98765 43210' }).length, 0);
  assert.ok(helpers.validateRow({}).some((message) => message.includes('name')));
});

test('reports malformed optional values and checks each phone', () => {
  assert.ok(helpers.validateRow({ companyName: 'Business', phone: '1234567890 / 12' }).some((message) => message.includes('Phone')));
  assert.ok(helpers.validateRow({ companyName: 'Business', email: 'wrong' }).some((message) => message.includes('email')));
});
