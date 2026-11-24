const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const helper = import(pathToFileURL(path.resolve('src/modules/templates/meta/template-response.mjs')));

test('reads a confirmed Meta ID from the actual Nest response envelope', async () => {
  const { confirmedTemplateOf } = await helper;
  const record = { id: 4, metaTemplateId: '123456789', status: 'PENDING' };
  assert.deepEqual(confirmedTemplateOf({ statusCode: 201, success: true, message: 'Operation completed successfully', data: record }), record);
  assert.deepEqual(confirmedTemplateOf(record), record);
});

test('does not report success when Meta has not confirmed an ID', async () => {
  const { confirmedTemplateOf } = await helper;
  assert.throws(() => confirmedTemplateOf({ success: true, data: { id: 4, metaTemplateId: null, syncError: 'Meta response was incomplete.' } }), /Meta response was incomplete/);
  assert.throws(() => confirmedTemplateOf({ success: true, data: { metaTemplateId: 'seed_sample' } }), /Sync templates/);
  assert.throws(() => confirmedTemplateOf({ success: false, message: 'Submission rejected', data: { metaTemplateId: '123' } }), /Submission rejected/);
});

test('reads saved drafts without requiring a Meta ID', async () => {
  const { templateRecordOf } = await helper;
  assert.equal(templateRecordOf({ success: true, data: { id: 4, metaTemplateId: null } }).id, 4);
});
