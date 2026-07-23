import test from 'node:test';
import assert from 'node:assert/strict';
import {
  comparePreparedValues,
  compareValues,
  createDictionary,
  getByBinding,
  isSafeBinding,
  prepareSortValue,
  setByBinding
} from '../src/grid/fabgrid-data.js';

test('safe binding reads and writes nested values', function() {
  var item = { customer: { name: 'Ada' } };
  assert.equal(getByBinding(item, 'customer.name'), 'Ada');
  assert.equal(setByBinding(item, 'customer.address.city', 'Taipei'), true);
  assert.equal(item.customer.address.city, 'Taipei');
});

test('dangerous bindings cannot access object prototypes', function() {
  var item = {};
  assert.equal(isSafeBinding('__proto__.polluted'), false);
  assert.equal(isSafeBinding('constructor.prototype.polluted'), false);
  assert.equal(getByBinding(item, '__proto__.polluted'), undefined);
  assert.equal(setByBinding(item, '__proto__.polluted', true), false);
  assert.equal({}.polluted, undefined);
});

test('dictionary accepts special group keys without prototype collisions', function() {
  var dictionary = createDictionary();
  dictionary.__proto__ = 'group';
  assert.equal(dictionary.__proto__, 'group');
  assert.equal(Object.getPrototypeOf(dictionary), null);
});

test('value comparison follows column data types', function() {
  assert.ok(compareValues('10', 2, 'number') > 0);
  assert.ok(compareValues('2026-07-12', '2026-07-11', 'date') > 0);
  assert.ok(compareValues(true, false, 'boolean') > 0);
  assert.ok(compareValues('Beta', 'alpha', 'string') > 0);
  assert.ok(compareValues(null, 'value', 'string') < 0);
});

test('prepared sort values preserve comparison semantics without repeated conversion', function() {
  assert.equal(prepareSortValue('10', 'number'), 10);
  assert.equal(prepareSortValue('2026-07-12', 'date'), new Date('2026-07-12').getTime());
  assert.equal(prepareSortValue(true, 'boolean'), 1);
  assert.equal(prepareSortValue('Beta', 'string'), 'beta');
  assert.ok(comparePreparedValues(10, 2) > 0);
  assert.ok(comparePreparedValues(null, 'value') < 0);
});
