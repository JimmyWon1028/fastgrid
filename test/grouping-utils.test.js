import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAggregate,
  createGroupBuckets,
  getGroupKey,
  getGroupStateKey,
  installFabGridData,
  normalizeGroupConfigs
} from '../src/grid/fabgrid-data.js';

function createInstalledGrid(rows, groups, columns) {
  function TestGrid() {}
  installFabGridData(TestGrid, {
    DEFAULT_OPTIONS: { pageSize: 10 },
    formatNumberDisplayText: function(value) { return String(value); },
    getColumnSearchKey: function(column) { return column.binding; },
    mergeOptions: function(base, override) { return Object.assign({}, base, override); },
    normalizeColumnSearchOperator: function(operator) { return operator || ''; },
    rowMatchesColumnSearch: function() { return true; },
    rowMatchesSearch: function() { return true; }
  });
  var grid = new TestGrid();
  grid.options = { rowGroups: groups || [], pagination: false, remote: false };
  grid.columns = columns || [];
  grid.rowGroupState = Object.create(null);
  grid.getColumn = function(binding) {
    return this.columns.find(function(column) { return column.binding === binding; }) || null;
  };
  grid.source = rows || [];
  grid.view = rows || [];
  grid.dataView = rows || [];
  return grid;
}

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

test('data installer owns grouped view and aggregate coordination', function() {
  var rows = [
    { region: 'TW', amount: 10 },
    { region: 'TW', amount: 20 },
    { region: 'JP', amount: 5 }
  ];
  var columns = [
    { binding: 'region', header: 'Region' },
    { binding: 'amount', header: 'Amount', aggregate: 'sum', dataType: 'number' }
  ];
  var grid = createInstalledGrid(rows, [{ binding: 'region' }], columns);
  var view = grid.createGroupedView(rows);

  assert.equal(view.length, 5);
  assert.equal(grid.isRowGroup(view[0]), true);
  assert.equal(view[0].label, 'Region: TW');
  assert.equal(view[0].aggregates.amount, 30);
  assert.equal(view[3].label, 'Region: JP');
  assert.equal(grid.getRowGroupAggregateValue(view[3], columns[1]), 5);
});

test('clear filter resets every local filter condition', function() {
  var grid = createInstalledGrid([], [], []);
  var calls = [];
  grid.filterPredicate = function() { return true; };
  grid.searchText = 'vendor';
  grid.columnSearchValues = { status: 'approved' };
  grid.columnSearchOperators = { status: 'equal' };
  grid.cancelHeaderSearchTimer = function() { calls.push('cancel'); };
  grid.hideFilterMenu = function() { calls.push('hide'); };
  grid.updateColumnSearchState = function() { calls.push('update'); };
  grid.applyFilterChange = function(resetHorizontalScroll) {
    calls.push(['apply', resetHorizontalScroll]);
  };

  grid.clearFilter();

  assert.equal(grid.filterPredicate, null);
  assert.equal(grid.searchText, '');
  assert.deepEqual(grid.columnSearchValues, {});
  assert.deepEqual(grid.columnSearchOperators, {});
  assert.deepEqual(calls, ['cancel', 'hide', 'update', ['apply', false]]);
});

test('filter changed fires after applying and clearing a filter', function() {
  var grid = createInstalledGrid([{ id: 1 }, { id: 2 }], [], []);
  var events = [];

  grid.applyView = function() {
    this.view = this.filterPredicate ? this.source.filter(this.filterPredicate) : this.source.slice();
  };
  grid.resetScroll = function() {};
  grid.resetVerticalScroll = function() {};
  grid.refresh = function() {};
  grid.cancelHeaderSearchTimer = function() {};
  grid.hideFilterMenu = function() {};
  grid.updateColumnSearchState = function() {};
  grid.emit = function(name, args) {
    events.push({ name: name, args: args });
    return true;
  };

  grid.setFilter(function(item) { return item.id === 2; });
  grid.clearFilter();

  assert.equal(events.length, 2);
  assert.equal(events[0].name, 'filterChanged');
  assert.equal(events[0].args.source, 'setFilter');
  assert.equal(events[0].args.active, true);
  assert.equal(events[0].args.cleared, false);
  assert.equal(events[0].args.viewRowCount, 1);
  assert.deepEqual(events[0].args.view, [{ id: 2 }]);
  assert.equal(events[1].name, 'filterChanged');
  assert.equal(events[1].args.source, 'clearFilter');
  assert.equal(events[1].args.active, false);
  assert.equal(events[1].args.cleared, true);
  assert.equal(events[1].args.viewRowCount, 2);
});
