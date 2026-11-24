const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const parser = require('@babel/parser');

test('template modal sends submit flag only for creation and separately submits edits', () => {
  const source = fs.readFileSync('src/modules/templates/meta/WhatsAppTemplateModal.jsx', 'utf8');
  parser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
  assert.match(source, /!isEdit\s*\?\s*\{\s*submitToMeta:/);
  assert.match(source, /api\.put\(`\/templates\/meta\/\$\{template\.id\}`, payload\)/);
  assert.match(source, /api\.post\(`\/templates\/meta\/\$\{template\.id\}\/submit`/);
  assert.match(source, /sampleValues:\s*sampleVariables/);
  assert.doesNotMatch(source, /submitToMeta\s*\?\s*'PENDING'/);
});
