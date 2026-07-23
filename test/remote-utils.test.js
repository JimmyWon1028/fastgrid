import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRemoteRequest,
  createRemoteSortParams,
  normalizePagination,
  normalizeRemoteData,
  normalizeRemoteCredentials
} from '../src/grid/fabgrid-data.js';

test('pagination clamps page number and page size', function() {
  assert.deepEqual(normalizePagination(9, 10, 25, 10), { pageNumber: 3, pageSize: 10, pageCount: 3 });
  assert.deepEqual(normalizePagination(0, 0, 0, 20), { pageNumber: 1, pageSize: 1, pageCount: 1 });
});

test('remote sorting uses EasyUI sort and order parameters', function() {
  var params = createRemoteSortParams([
    { column: { binding: 'name' }, direction: 1 },
    { column: { binding: 'amount' }, direction: -1 }
  ]);
  assert.deepEqual(params, { sort: 'name,amount', order: 'asc,desc' });
});

test('remote response normalizes rows and numeric total', function() {
  var rows = [{ id: 1 }];
  assert.deepEqual(normalizeRemoteData({ rows: rows, total: '12' }), { rows: rows, total: 12 });
  assert.deepEqual(normalizeRemoteData(null), { rows: [], total: 0 });
});

test('remote request creates GET and POST descriptors', function() {
  var getRequest = createRemoteRequest('/api/items?active=1', 'get', { page: 2, q: 'grid' });
  var filterRules = JSON.stringify([{ field: 'status', op: 'eq', value: '草稿' }]);
  var postRequest = createRemoteRequest('/api/items', 'post', { page: 2, filterRules: filterRules }, 'include');
  var formData = new URLSearchParams(postRequest.options.body);
  assert.equal(getRequest.url, '/api/items?active=1&page=2&q=grid');
  assert.equal(getRequest.options.body, undefined);
  assert.equal(getRequest.options.credentials, 'same-origin');
  assert.equal(formData.get('page'), '2');
  assert.equal(formData.get('filterRules'), filterRules);
  assert.equal(postRequest.options.credentials, 'include');
  assert.equal(postRequest.options.headers['Content-Type'], 'application/x-www-form-urlencoded;charset=UTF-8');
  assert.throws(function() { createRemoteRequest('/api/items', 'delete', {}); }, /GET or POST/);
});

test('remote request credentials use Fetch-compatible values', function() {
  assert.equal(normalizeRemoteCredentials('include'), 'include');
  assert.equal(normalizeRemoteCredentials('omit'), 'omit');
  assert.equal(normalizeRemoteCredentials('same-origin'), 'same-origin');
  assert.equal(normalizeRemoteCredentials('INCLUDE'), 'include');
  assert.equal(normalizeRemoteCredentials('invalid'), 'same-origin');
  assert.equal(normalizeRemoteCredentials(null), 'same-origin');
});
