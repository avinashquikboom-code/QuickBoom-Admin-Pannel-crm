import test from 'node:test';
import assert from 'node:assert/strict';
import { truncateWords } from '../src/lib/truncate-words.mjs';

test('keeps a five-word value complete', () => {
  assert.equal(truncateWords('One two three four five'), 'One two three four five');
});

test('keeps exactly ten words complete', () => {
  assert.equal(truncateWords('one two three four five six seven eight nine ten'), 'one two three four five six seven eight nine ten');
});

test('truncates eleven words after word ten', () => {
  assert.equal(truncateWords('one two three four five six seven eight nine ten eleven'), 'one two three four five six seven eight nine ten...');
});

test('retains the original spacing within the visible portion', () => {
  assert.equal(truncateWords('one  two three four five six seven eight nine ten eleven'), 'one  two three four five six seven eight nine ten...');
});

test('handles null, undefined, empty, and custom limits', () => {
  assert.equal(truncateWords(null), '');
  assert.equal(truncateWords(undefined), '');
  assert.equal(truncateWords(''), '');
  assert.equal(truncateWords('a b c', 2), 'a b...');
});
