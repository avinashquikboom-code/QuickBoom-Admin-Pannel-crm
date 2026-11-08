import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency, CURRENCY_CODE, CURRENCY_LOCALE, CURRENCY_SYMBOL, CURRENCY_LABEL } from './currency.js';

test('INR formatting uses Indian grouping and two decimal places', () => {
    const cases = new Map([
        [0, '₹0.00'],
        [1000, '₹1,000.00'],
        [10000, '₹10,000.00'],
        [100000, '₹1,00,000.00'],
        [1000000, '₹10,00,000.00'],
        [10000000, '₹1,00,00,000.00'],
        [1234.56, '₹1,234.56'],
        [-123456.78, '-₹1,23,456.78'],
    ]);
    for (const [input, expected] of cases) assert.equal(formatCurrency(input), expected);
    assert.equal(CURRENCY_CODE, 'INR');
    assert.equal(CURRENCY_SYMBOL, '₹');
    assert.equal(CURRENCY_LOCALE, 'en-IN');
    assert.equal(CURRENCY_LABEL, 'INR (₹)');
});

test('numeric API strings are presented without changing their values', () => {
    const record = Object.freeze({ salary: '100000.25', paid: 50000 });
    assert.equal(formatCurrency(record.salary), '₹1,00,000.25');
    assert.equal(formatCurrency(record.paid), '₹50,000.00');
    assert.deepEqual(record, { salary: '100000.25', paid: 50000 });
});

test('missing or invalid amounts are unavailable, not zero', () => {
    for (const value of [null, undefined, '', '  ', NaN, Infinity, 'invalid', false, {}]) {
        assert.equal(formatCurrency(value), '—');
    }
});
