import { getByBinding } from '../src/grid/fabgrid-data.js';
import { createFabGridFactory } from '../src/grid/fabgrid.js';

var ROW_COUNT = 20000;
var COLUMN_COUNT = 50;
var RUN_COUNT = 3;

function createRows() {
  return Array.from({ length: ROW_COUNT }, function(value, rowIndex) {
    var data = {};
    var columnIndex;
    data.c0 = ((rowIndex * 2654435761) >>> 0).toString(36);
    data.c1 = '2026-' +
      String(rowIndex % 12 + 1).padStart(2, '0') + '-' +
      String(rowIndex % 28 + 1).padStart(2, '0');
    for (columnIndex = 2; columnIndex < COLUMN_COUNT; columnIndex += 1) {
      data['c' + columnIndex] = rowIndex * COLUMN_COUNT + columnIndex;
    }
    if (rowIndex === ROW_COUNT - 1) {
      data.c49 = 'needle';
    }
    return { id: rowIndex, data: data };
  });
}

function createColumns() {
  return Array.from({ length: COLUMN_COUNT }, function(value, index) {
    return {
      binding: 'data.c' + index,
      dataType: index === 1 ? 'date' : index === 0 ? 'string' : 'number',
      visible: true,
      _width: 120
    };
  });
}

function median(values) {
  var sorted = values.slice().sort(function(a, b) {
    return a - b;
  });
  return sorted[Math.floor(sorted.length / 2)];
}

function measure(callback) {
  var values = [];
  var start;
  var index;
  callback();
  for (index = 0; index < RUN_COUNT; index += 1) {
    start = performance.now();
    callback();
    values.push(performance.now() - start);
  }
  return median(values);
}

function createDataPipelineGrid(rows, columns) {
  var FabGrid = createFabGridFactory({});
  var sortStates = [];
  var grid = Object.create(FabGrid.prototype);
  grid.options = {
    filterMode: false,
    remote: false,
    pagination: false,
    rowGroups: []
  };
  grid.source = rows;
  grid.columns = columns;
  grid.excelFilters = {};
  grid.filterPredicate = null;
  grid.searchText = '';
  grid.columnSearchValues = {};
  grid.columnSearchOperators = {};
  grid.hasColumnSearch = false;
  grid.getSortStates = function() {
    return sortStates;
  };
  grid.setBenchmarkSortStates = function(value) {
    sortStates = value;
  };
  grid.captureSelectionState = function() {
    return null;
  };
  grid.captureSelectedRowChangeState = function() {
    return null;
  };
  grid.isTreeGrid = function() {
    return false;
  };
  grid.createGroupedView = function(value) {
    return value;
  };
  grid.refreshInvalidItemRows = function() {};
  grid.restoreSelectionState = function() {};
  grid.clampSelection = function() {};
  grid.syncEditingWithView = function() {};
  return grid;
}

var rows = createRows();
var columns = createColumns();
var grid = createDataPipelineGrid(rows, columns);
var bindingChecksum = 0;
var bindingMs;
var filterMs;
var sortMs;
var rowRange;
var columnRange;
var renderedCellUpperBound;

bindingMs = measure(function() {
  var index;
  var checksum = 0;
  for (index = 0; index < rows.length; index += 1) {
    checksum += getByBinding(rows[index], 'data.c49') === 'needle' ? 1 : 0;
  }
  bindingChecksum += checksum;
});

grid.searchText = 'needle';
filterMs = measure(function() {
  grid.applyView();
});
if (grid.view.length !== 1) {
  throw new Error('Global search benchmark returned an unexpected row count.');
}

grid.searchText = '';
grid.setBenchmarkSortStates([
  { column: columns[1], direction: 1 },
  { column: columns[0], direction: 1 }
]);
sortMs = measure(function() {
  grid.applyView();
});

grid.options = {
  rowHeight: 32,
  overscanRows: 8,
  fastScrollOverscanRows: 64,
  overscanColumns: 3,
  frozenColumns: 1,
  frozenRightColumns: 1
};
grid.emit = function() {};
grid.scrollState = {
  top: 100000,
  left: 2400,
  directionY: 1,
  extraRows: 12
};
grid.view = rows;
grid.updateLayout();
rowRange = grid.getRowRange({
  scrollTop: 100000,
  contentHeight: 640
});
columnRange = grid.getColumnRange(2400, 760);
renderedCellUpperBound =
  (rowRange.end - rowRange.start) *
  (grid.frozenColumns + columnRange.end - columnRange.start + grid.frozenRightColumns);

if (renderedCellUpperBound >= ROW_COUNT * COLUMN_COUNT) {
  throw new Error('Two-axis virtualization did not bound the rendered cell count.');
}

console.log(JSON.stringify({
  dataset: {
    rows: ROW_COUNT,
    columns: COLUMN_COUNT,
    cells: ROW_COUNT * COLUMN_COUNT
  },
  medianMs: {
    bindingScan: Number(bindingMs.toFixed(2)),
    globalSearch: Number(filterMs.toFixed(2)),
    twoColumnSort: Number(sortMs.toFixed(2))
  },
  virtualization: {
    rowRange: rowRange,
    columnRange: columnRange,
    renderedCellUpperBound: renderedCellUpperBound
  },
  bindingChecksum: bindingChecksum
}, null, 2));
