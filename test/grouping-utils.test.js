import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAggregate,
  createGroupBuckets,
  getGroupKey,
  getGroupStateKey,
  normalizeGroupConfigs
} from '../src/grid/fabgrid-data.js';

test('group configs ignore empty entries and limit nesting', function() {
  var configs = normalizeGroupConfigs([{ binding: 'a' }, null, { binding: 'b' }, { binding: 'c' }, { binding: 'd' }], 3);
  assert.deepEqual(configs.map(function(config) { return config.binding; }), ['a', 'b', 'c']);
});

test('aggregates support numeric operations and custom callbacks', function() {
  var rows = [{ amount: 10 }, { amount: '20' }, { amount: null }, { amount: 'x' }];
  var column = { binding: 'amount' };
  assert.equal(calculateAggregate('sum', column, rows, null), 30);
  assert.equal(calculateAggregate('avg', column, rows, null), 15);
  assert.equal(calculateAggregate('min', column, rows, null), 10);
  assert.equal(calculateAggregate('max', column, rows, null), 20);
  assert.equal(calculateAggregate('count', column, rows, null), 4);
  assert.equal(calculateAggregate(function(args) { return args.rows.length + args.getValue(args.rows[0]); }, column, rows, null), 14);
});

test('group buckets preserve input order and special keys', function() {
  var rows = [{ group: '__proto__', id: 1 }, { group: 'A', id: 2 }, { group: '__proto__', id: 3 }];
  var buckets = createGroupBuckets(rows, { binding: 'group' }, null);
  assert.deepEqual(buckets.map(function(bucket) { return bucket.key; }), ['__proto__', 'A']);
  assert.deepEqual(buckets[0].items.map(function(item) { return item.id; }), [1, 3]);
});

test('group keys support multiple bindings and custom getters', function() {
  assert.equal(getGroupKey({ region: 'TW', year: 2026 }, { bindings: ['region', 'year'] }, 0, null), 'TW_2026');
  assert.equal(getGroupKey({ id: 7 }, { key: function(args) { return args.item.id + ':' + args.row; } }, 2, null), '7:2');
  assert.equal(getGroupStateKey('', 'TW', 0), 'TW');
  assert.equal(getGroupStateKey('TW', '2026', 1), 'TW\u001f1:2026');
});
