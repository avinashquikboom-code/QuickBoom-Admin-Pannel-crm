import test from 'node:test';
import assert from 'node:assert/strict';
import { filterChartRows, pieTotals } from '../src/lib/chart-data.js';
import { legacyValue, searchableText } from '../src/lib/table-utils.js';
test('date filters are inclusive, ordered and scoped to the actual dataset', () => {
 const data = [{ date:'2026-06-28', count:3 },{ date:'2026-04-28', count:1 },{ date:'2026-05-28', count:2 }];
 assert.deepEqual(filterChartRows(data, {from:'2026-04-28',to:'2026-05-28'}).map(row=>row.count), [1,2]);
 assert.equal(filterChartRows(data,{period:'30'}).length,1);
 assert.equal(filterChartRows(data,{from:'2027-01-01'}).length,0);
 assert.equal(data[0].count,3);
});
test('pie totals reflect filtered rows and handle zero and missing values', () => {
 assert.deepEqual(pieTotals([{present:0},{present:3},{}],[{key:'present',label:'Present'}]).map(row=>row.value),[3]);
 assert.deepEqual(filterChartRows([]),[]);
});
test('legacy tables sort raw monetary values and search nested records', () => {
 assert.equal(legacyValue({grossPay:100000},{header:'Gross Pay'}),100000);
 assert.equal(legacyValue({employeeName:'Priya'},{header:'Employee'}),'Priya');
 assert.equal(legacyValue({salary:{basic:50000}},{accessorKey:'salary.basic'}),50000);
 assert.match(searchableText({id:1, employee:{name:'Priya',role:'Designer'}}),/Priya Designer/);
});
