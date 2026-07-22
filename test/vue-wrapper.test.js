import test from 'node:test';
import assert from 'node:assert/strict';
import { createFabGridVue, createGridOptions, normalizeColumnProps, toKebabCase } from '../packages/fabgrid-vue/src/fabgrid-vue.js';

test('Vue wrapper converts core event names to kebab case', function() {
  assert.equal(toKebabCase('selectionChanged'), 'selection-changed');
  assert.equal(toKebabCase('cellEditEnded'), 'cell-edit-ended');
  assert.equal(toKebabCase('filterChanged'), 'filter-changed');
});

test('Vue wrapper forwards filter changed events', function() {
  var handler;
  var emitted = [];
  var Vue = { component: function() {} };
  var plugin = createFabGridVue(Vue, { FabGrid: function() {} });
  var vm = {
    control: {
      filterChanged: {
        addHandler: function(value) { handler = value; }
      }
    },
    _eventBindings: [],
    $emit: function(name, args) { emitted.push({ name: name, args: args }); }
  };

  plugin.FabGrid.methods.bindGridEvents.call(vm);
  handler(null, { source: 'clearFilter', cleared: true });

  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].name, 'filter-changed');
  assert.equal(emitted[0].args.cleared, true);
});

test('Vue wrapper normalizes declarative column props', function() {
  var cellTemplate = function(ctx) { return ctx.text; };
  assert.deepEqual(normalizeColumnProps({ binding: 'amount', width: 120, visible: true, cellTemplate: cellTemplate, ignored: 'x' }), {
    binding: 'amount', width: 120, visible: true, cellTemplate: cellTemplate
  });
});

test('Vue wrapper gives columns prop precedence over declared columns', function() {
  var vm = {
    itemsSource: [{ id: 1 }],
    columns: [{ binding: 'id' }],
    gridOptions: { rowHeight: 31 },
    getDeclaredColumns: function() { return [{ binding: 'name' }]; }
  };
  ['allowEditing', 'allowFiltering', 'allowSorting', 'allowResizing', 'alternatingRowStep', 'filterMode', 'frozenColumns', 'frozenRightColumns', 'isReadOnly', 'locale', 'pagination', 'pager', 'remote', 'url', 'method', 'loader'].forEach(function(name) {
    vm[name] = undefined;
  });
  assert.deepEqual(createGridOptions(vm), {
    rowHeight: 31,
    itemsSource: vm.itemsSource,
    columns: vm.columns
  });
});

test('Vue wrapper forwards cell selection options', function() {
  var vm = {
    itemsSource: [],
    columns: [],
    gridOptions: {},
    selectionMode: 'CellRange',
    highlightActiveRow: false,
    getDeclaredColumns: function() { return []; }
  };

  assert.equal(createGridOptions(vm).selectionMode, 'CellRange');
  assert.equal(createGridOptions(vm).highlightActiveRow, false);
});

test('Vue wrapper routes filter options through the core setters', function() {
  var Vue = { component: function() {} };
  var plugin = createFabGridVue(Vue, { FabGrid: function() {} });
  var calls = [];
  var vm = {
    control: {
      options: {},
      setAllowFiltering: function(value) { calls.push(value); },
      setFilterMode: function(value) { calls.push(value); },
      invalidate: function() {}
    }
  };

  plugin.FabGrid.methods.applyGridOptions.call(vm, {
    allowFiltering: false,
    filterMode: ['searchRow', 'excel'],
    rowHeight: 36
  });

  assert.deepEqual(calls, [false, ['searchRow', 'excel']]);
  assert.equal(vm.control.options.rowHeight, 36);
});

test('Vue wrapper plugin registers FabGrid components', function() {
  var registered = {};
  var Vue = { component: function(name, component) { registered[name] = component; } };
  var plugin = createFabGridVue(Vue, { FabGrid: function() {} });
  plugin.install(Vue);
  assert.equal(registered.FabGrid.name, 'FabGrid');
  assert.equal(registered.FabGridColumn.name, 'FabGridColumn');
  assert.equal(registered.FabPivotPanel.name, 'FabPivotPanel');
  assert.equal(registered.FabPivotGrid.name, 'FabPivotGrid');
  assert.equal(registered.FabPivotChart.name, 'FabPivotChart');
  assert.equal(registered.FabPivotWorkspace.name, 'FabPivotWorkspace');
  assert.equal(registered.FabPivotSlicer.name, 'FabPivotSlicer');
});

test('Vue wrapper removes event handlers and disposes the core control', function() {
  var removed = 0;
  var disposed = 0;
  var Vue = { component: function() {} };
  var plugin = createFabGridVue(Vue, { FabGrid: function() {} });
  var vm = {
    _eventBindings: [{
      event: { removeHandler: function() { removed += 1; } },
      handler: function() {}
    }],
    control: { dispose: function() { disposed += 1; } }
  };
  plugin.FabGrid.methods.destroyControl.call(vm);
  assert.equal(removed, 1);
  assert.equal(disposed, 1);
  assert.equal(vm.control, null);
});
