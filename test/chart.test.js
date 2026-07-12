import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeChartType } from '../src/chart/chart.js';

test('Chart supports only the four documented chart types', function() {
  assert.equal(normalizeChartType('column'), 'column');
  assert.equal(normalizeChartType('bar'), 'bar');
  assert.equal(normalizeChartType('line'), 'line');
  assert.equal(normalizeChartType('pie'), 'pie');
  assert.equal(normalizeChartType('Column'), 'column');
  assert.equal(normalizeChartType('LineSymbols'), 'line');
  assert.equal(normalizeChartType('unknown'), 'column');
});
