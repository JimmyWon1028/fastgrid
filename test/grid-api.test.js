import test from 'node:test';
import assert from 'node:assert/strict';
import { createFabGridFactory } from '../src/grid/fabgrid.js';

test('setRowHeaderWidth normalizes the width and refreshes the grid', function() {
  var FabGrid = createFabGridFactory({});
  var refreshCount = 0;
  var grid = {
    options: { rowHeaderWidth: 60 },
    refresh: function() {
      refreshCount += 1;
    }
  };

  FabGrid.prototype.setRowHeaderWidth.call(grid, 80);
  assert.equal(grid.options.rowHeaderWidth, 80);
  assert.equal(refreshCount, 1);

  FabGrid.prototype.setRowHeaderWidth.call(grid, -20);
  assert.equal(grid.options.rowHeaderWidth, 0);
  assert.equal(refreshCount, 2);

  FabGrid.prototype.setRowHeaderWidth.call(grid, 'invalid');
  assert.equal(grid.options.rowHeaderWidth, 60);
  assert.equal(refreshCount, 3);
});

test('active cell border defaults to two pixels', function() {
  var FabGrid = createFabGridFactory({});
  var descriptor = Object.getOwnPropertyDescriptor(FabGrid.prototype, 'activeCellBorder');
  var applyCount = 0;
  var grid = {
    options: {},
    applyThemeOptions: function() {
      applyCount += 1;
    }
  };

  assert.equal(descriptor.get.call(grid), 2);
  descriptor.set.call(grid, 'invalid');
  assert.equal(grid.options.activeCellBorder, 2);
  assert.equal(applyCount, 1);
});

test('frozen divider decorates only actual boundary cells', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    frozenColumns: 2,
    scrollableColumnEnd: 6,
    frozenRightWidth: 120
  };
  var leftCell = { className: 'fg-cell' };
  var scrollCell = { className: 'fg-cell' };
  var rightCell = { className: 'fg-cell' };
  var normalCell = { className: 'fg-cell' };

  FabGrid.prototype.decorateFrozenDividerCell.call(grid, leftCell, 1, 'left');
  FabGrid.prototype.decorateFrozenDividerCell.call(grid, scrollCell, 5, 'scroll');
  FabGrid.prototype.decorateFrozenDividerCell.call(grid, rightCell, 6, 'right');
  FabGrid.prototype.decorateFrozenDividerCell.call(grid, normalCell, 4, 'scroll');

  assert.match(leftCell.className, /fg-frozen-divider-left/);
  assert.match(scrollCell.className, /fg-frozen-divider-right-neighbor/);
  assert.match(rightCell.className, /fg-frozen-divider-right/);
  assert.equal(normalCell.className, 'fg-cell');
});

test('filter changed is exposed as a Wijmo-compatible event', function() {
  var FabGrid = createFabGridFactory({});
  var grid = { wijmoEvents: {} };

  FabGrid.prototype.createWijmoEvents.call(grid);

  assert.equal(typeof grid.filterChanged.addHandler, 'function');
  assert.equal(grid.wijmoEvents.filterChanged, grid.filterChanged);
});

test('updated view can be bound from constructor options', function() {
  var FabGrid = createFabGridFactory({});
  var sender;
  var received;
  var grid = {
    wijmoEvents: {},
    options: {
      updatedView: function(value, args) {
        sender = value;
        received = args;
      }
    }
  };

  FabGrid.prototype.createWijmoEvents.call(grid);
  FabGrid.prototype.bindOptionEvent.call(grid, 'updatedView');
  grid.updatedView.raise(grid, { totalRows: 3 });

  assert.equal(sender, grid);
  assert.deepEqual(received, { totalRows: 3 });
});
