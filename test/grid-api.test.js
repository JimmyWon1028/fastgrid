import test from 'node:test';
import assert from 'node:assert/strict';
import { createFabGridFactory } from '../src/grid/fabgrid.js';
import { createEditorDefinitions } from '../src/editbox/editbox-definitions.js?v=20260721-grid-number-spinner-v1';
import { applyHeaderCellStyle } from '../src/grid/fabgrid-view.js?v=20260720-initial-search-focus-v1';
import { Control } from '../src/core/control.js?v=20260716-control-events-v3';
import { CellType, GroupRow, Row, createGridPanel } from '../src/grid/fabgrid-types.js?v=20260716-row-types-v1';

function createFakeElement(classNames, attributes, rect) {
  var values = attributes || {};
  return {
    nodeType: 1,
    parentElement: null,
    classList: {
      contains: function(name) {
        return classNames.indexOf(name) >= 0;
      }
    },
    hasAttribute: function(name) {
      return Object.prototype.hasOwnProperty.call(values, name);
    },
    getAttribute: function(name) {
      return this.hasAttribute(name) ? String(values[name]) : null;
    },
    getBoundingClientRect: function() {
      return rect || { left: 0, top: 0, right: 100, bottom: 32, width: 100, height: 32 };
    }
  };
}

test('empty pagination render keeps using its internal DOM after pager alias is overwritten', function() {
  var FabGrid = createFabGridFactory({});
  var pagerElement = { style: {} };
  var paginationElement = {
    style: {},
    innerHTML: '',
    setAttribute: function(name, value) {
      this[name] = value;
    }
  };
  var grid = {
    options: {
      pageSize: 10,
      pageNumber: 1,
      pageList: [10],
      showPageList: false,
      showPageInfo: true,
      showRefresh: false
    },
    paginationTotal: 0,
    pager: { pageNumber: 1, pageSize: 10 },
    pagination: { pageNumber: 1 },
    _pagerElement: pagerElement,
    _paginationElement: paginationElement,
    getPaginationHeight: function() {
      return 35;
    },
    getText: function(path, data) {
      if (path === 'pagination.displayMsg') {
        return data.from + '-' + data.to + '-' + data.total;
      }
      return path;
    },
    createPaginationButton: FabGrid.prototype.createPaginationButton
  };

  assert.doesNotThrow(function() {
    FabGrid.prototype.renderPagination.call(grid);
  });
  assert.equal(pagerElement.style.height, '35px');
  assert.equal(paginationElement.style.display, 'flex');
  assert.match(paginationElement.innerHTML, />0-0-0</);
});

test('host resize observer invalidates an empty grid after its layout becomes visible', function() {
  var FabGrid = createFabGridFactory({});
  var OriginalResizeObserver = globalThis.ResizeObserver;
  var observedHost = null;
  var disconnected = false;
  var callback;
  var invalidations = 0;
  var grid = {
    host: {},
    _resizeObserver: null,
    invalidate: function() {
      invalidations += 1;
    }
  };

  globalThis.ResizeObserver = function(nextCallback) {
    callback = nextCallback;
    this.observe = function(host) {
      observedHost = host;
    };
    this.disconnect = function() {
      disconnected = true;
    };
  };

  try {
    FabGrid.prototype.bindResizeObserver.call(grid);
    assert.equal(observedHost, grid.host);

    callback();
    assert.equal(invalidations, 1);

    FabGrid.prototype.unbindResizeObserver.call(grid);
    assert.equal(disconnected, true);
    assert.equal(grid._resizeObserver, null);
  } finally {
    if (OriginalResizeObserver === undefined) {
      delete globalThis.ResizeObserver;
    } else {
      globalThis.ResizeObserver = OriginalResizeObserver;
    }
  }
});

test('initial search row focuses the first visible column input', function() {
  var FabGrid = createFabGridFactory({});
  var focusedColumn = null;
  var grid = {
    disposed: false,
    options: {
      allowFiltering: true,
      showSearchRow: true
    },
    visibleColumns: [
      { _viewIndex: 0, binding: 'name' },
      { _viewIndex: 1, binding: 'country' }
    ],
    focusHeaderSearchInput: function(colIndex) {
      focusedColumn = colIndex;
      return true;
    }
  };

  assert.equal(FabGrid.prototype.focusInitialHeaderSearchInput.call(grid), true);
  assert.equal(focusedColumn, 0);

  grid.options.showSearchRow = false;
  focusedColumn = null;
  assert.equal(FabGrid.prototype.focusInitialHeaderSearchInput.call(grid), false);
  assert.equal(focusedColumn, null);
});

test('header render preserves the active search input and caret', function() {
  var FabGrid = createFabGridFactory({});
  var input = {
    selectionStart: 2,
    selectionEnd: 4,
    getAttribute: function(name) {
      return name === 'data-col' ? '1' : null;
    }
  };
  var grid = {
    headerSearchFocusRequest: null,
    getActiveHeaderSearchInput: function() {
      return input;
    }
  };

  assert.equal(FabGrid.prototype.captureActiveHeaderSearchFocus.call(grid), true);
  assert.deepEqual(grid.headerSearchFocusRequest, {
    col: 1,
    selectionStart: 2,
    selectionEnd: 4,
    attempts: 1
  });
});

test('search row down arrow focuses the same-row active cell before grid navigation', function() {
  var FabGrid = createFabGridFactory({});
  var selectedRows = [];
  var scrolledRows = [];
  var prevented = 0;
  var stopped = 0;
  var rootFocuses = 0;
  var grid = {
    options: {
      allowFiltering: true,
      showSearchRow: true,
      multiSelectRows: false,
      editOnSelect: true
    },
    view: [{ id: 1 }, { id: 2 }, { id: 3 }],
    selection: { row: 0, col: 1 },
    root: {
      focus: function() {
        rootFocuses += 1;
      }
    },
    selectRow: function(row, col) {
      selectedRows.push([row, col]);
      this.selection = { row: row, col: col };
    },
    select: function() {
      throw new Error('single-row navigation must use selectRow');
    },
    scrollIntoView: function(row, col, options) {
      scrolledRows.push([row, col, options.directionY]);
    }
  };
  var downEvent = {
    key: 'ArrowDown',
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault: function() { prevented += 1; },
    stopPropagation: function() { stopped += 1; }
  };
  assert.equal(FabGrid.prototype.handleHeaderSearchRowNavigation.call(grid, downEvent, 0), true);
  assert.deepEqual(selectedRows, [[0, 0]]);
  assert.deepEqual(scrolledRows, [[0, 0, 0]]);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
  assert.equal(rootFocuses, 1);

  grid.selection = { row: 2, col: 0 };
  assert.equal(FabGrid.prototype.handleHeaderSearchRowNavigation.call(grid, downEvent, 0), true);
  assert.deepEqual(selectedRows, [[0, 0]]);
  assert.deepEqual(scrolledRows, [[0, 0, 0], [2, 0, 0]]);
  assert.equal(prevented, 2);
  assert.equal(stopped, 2);
  assert.equal(rootFocuses, 2);

  grid.options.showSearchRow = false;
  assert.equal(FabGrid.prototype.handleHeaderSearchRowNavigation.call(grid, downEvent, 0), false);
  assert.deepEqual(selectedRows, [[0, 0]]);
  assert.deepEqual(scrolledRows, [[0, 0, 0], [2, 0, 0]]);
  assert.equal(prevented, 2);
  assert.equal(stopped, 2);
  assert.equal(rootFocuses, 2);
});

test('first-row up arrow focuses the same-column search input only while search row is visible', function() {
  var FabGrid = createFabGridFactory({});
  var focusedColumns = [];
  var prevented = 0;
  var stopped = 0;
  var grid = {
    options: {
      allowFiltering: true,
      showSearchRow: true
    },
    focusHeaderSearchInput: function(col) {
      focusedColumns.push(col);
      return true;
    }
  };
  var upEvent = {
    key: 'ArrowUp',
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault: function() { prevented += 1; },
    stopPropagation: function() { stopped += 1; }
  };

  assert.equal(FabGrid.prototype.handleFirstRowSearchFocus.call(grid, upEvent, 0, 1), true);
  assert.deepEqual(focusedColumns, [1]);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);

  grid.options.showSearchRow = false;
  assert.equal(FabGrid.prototype.handleFirstRowSearchFocus.call(grid, upEvent, 0, 1), false);
  assert.deepEqual(focusedColumns, [1]);

  grid.options.showSearchRow = true;
  assert.equal(FabGrid.prototype.handleFirstRowSearchFocus.call(grid, upEvent, 1, 1), false);
  assert.deepEqual(focusedColumns, [1]);
});

test('frozen column counts are normalized before layout', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    columns: [
      { visible: true, _width: 100 },
      { visible: true, _width: 120 },
      { visible: true, _width: 140 }
    ],
    options: {
      rowHeight: 32,
      overscanRows: 8,
      fastScrollOverscanRows: 64,
      overscanColumns: 3,
      frozenColumns: 1.8,
      frozenRightColumns: 0.9
    },
    emit: function() {}
  };

  FabGrid.prototype.updateLayout.call(grid);

  assert.equal(grid.options.frozenColumns, 1);
  assert.equal(grid.options.frozenRightColumns, 0);
  assert.equal(grid._frozenColumns, 1);
  assert.equal(grid._frozenRightColumns, 0);
  assert.equal(grid.frozenWidth, 100);
});

test('hostElement exposes the FabGrid host', function() {
  var FabGrid = createFabGridFactory({});
  var host = {};
  var grid = Object.create(FabGrid.prototype);

  grid.host = host;

  assert.equal(grid.hostElement, host);
});

test('theme stylesheet filename defines the default FabGrid theme', function() {
  var FabGrid = createFabGridFactory({});
  var documentRef = {
    querySelectorAll: function() {
      return [
        { getAttribute: function() { return '/assets/fabui/fabui.lite.min.css'; } },
        { getAttribute: function() { return '/assets/fabui/fabui.mono-red.min.css?v=20260721'; } }
      ];
    }
  };

  assert.equal(FabGrid.resolveStylesheetTheme(documentRef), 'mono-red');
  assert.equal(FabGrid.resolveStylesheetTheme({
    querySelectorAll: function() {
      return [{ getAttribute: function() { return '/assets/fabui/fabui.unknown.min.css'; } }];
    }
  }), '');
});

test('FabGrid inherits managed DOM event listener methods from Control', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);

  assert.equal(grid instanceof Control, true);
  assert.equal(typeof grid.addEventListener, 'function');
  assert.equal(typeof grid.removeEventListener, 'function');
});

test('hitTest identifies data cells and nested cell template content', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var host = createFakeElement([]);
  var root = createFakeElement(['fg-root']);
  var cell = createFakeElement(['fg-cell'], { 'data-row': 2, 'data-col': 1 }, {
    left: 100,
    top: 64,
    right: 220,
    bottom: 96,
    width: 120,
    height: 32
  });
  var content = createFakeElement(['template-content']);
  var hit;

  root.parentElement = host;
  cell.parentElement = root;
  content.parentElement = cell;
  grid.host = host;
  grid.root = root;
  grid.cells = createGridPanel(grid, CellType.Cell);
  grid.columnHeaders = createGridPanel(grid, CellType.ColumnHeader);
  grid.rowHeaders = createGridPanel(grid, CellType.RowHeader);
  grid.topLeftCells = createGridPanel(grid, CellType.TopLeft);
  grid.columnFooters = createGridPanel(grid, CellType.ColumnFooter);
  grid.bottomLeftCells = createGridPanel(grid, CellType.BottomLeft);
  grid.visibleColumns = [
    { binding: 'id', _index: 0 },
    { binding: 'name', _index: 4 }
  ];

  hit = grid.hitTest({ target: content, pageX: 150, pageY: 80 });

  assert.equal(hit.cellType, CellType.Cell);
  assert.equal(hit.panel, grid.cells);
  assert.equal(hit.row, 2);
  assert.equal(hit.col, 4);
  assert.equal(hit.viewCol, 1);
  assert.equal(hit.column, grid.visibleColumns[1]);
  assert.equal(hit.target, content);
  assert.equal(hit.isSearchRow, false);
  assert.deepEqual(hit.range, { row: 2, col: 4, row2: 2, col2: 4 });
});

test('hitTest reports the Search Row as a ColumnHeader panel cell', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var host = createFakeElement([]);
  var root = createFakeElement(['fg-root']);
  var headerCell = createFakeElement(['fg-header-cell'], { 'data-col': 3 }, {
    left: 100,
    top: 0,
    right: 220,
    bottom: 64,
    width: 120,
    height: 64
  });
  var search = createFakeElement(['fg-header-search']);
  var input = createFakeElement(['fg-header-search-input']);
  var hit;

  root.parentElement = host;
  headerCell.parentElement = root;
  search.parentElement = headerCell;
  input.parentElement = search;
  grid.host = host;
  grid.root = root;
  grid.options = { rowHeight: 32, headerHeight: 32, showSearchRow: true, allowFiltering: true };
  grid.cells = createGridPanel(grid, CellType.Cell);
  grid.columnHeaders = createGridPanel(grid, CellType.ColumnHeader);
  grid.rowHeaders = createGridPanel(grid, CellType.RowHeader);
  grid.topLeftCells = createGridPanel(grid, CellType.TopLeft);
  grid.columnFooters = createGridPanel(grid, CellType.ColumnFooter);
  grid.bottomLeftCells = createGridPanel(grid, CellType.BottomLeft);
  grid.visibleColumns = [
    { binding: 'id', _index: 0 },
    { binding: 'name', _index: 1 },
    { binding: 'amount', _index: 2 },
    { binding: 'status', _index: 5 }
  ];

  hit = grid.hitTest({ target: input, pageX: 150, pageY: 48 });

  assert.equal(hit.cellType, CellType.ColumnHeader);
  assert.equal(hit.panel, grid.columnHeaders);
  assert.equal(hit.row, 1);
  assert.equal(hit.col, 5);
  assert.equal(hit.viewCol, 3);
  assert.equal(hit.column, grid.visibleColumns[3]);
  assert.equal(hit.isSearchRow, true);
});

test('row collection exposes compatible Row and GroupRow instances', function() {
  var FabGrid = createFabGridFactory({});
  var dataItem = { id: 1 };
  var groupItem = { __fgRowType: 'group', level: 1, items: [dataItem], collapsed: true };
  var footerItem = { __fgRowType: 'groupFooter', level: 1, items: [dataItem] };
  var grid = Object.create(FabGrid.prototype);
  var rows;

  grid.view = [groupItem, dataItem, footerItem];
  grid._rowCollection = null;
  rows = grid.rows;

  assert.equal(FabGrid.Row, Row);
  assert.equal(FabGrid.GroupRow, GroupRow);
  assert.equal(rows[0] instanceof Row, true);
  assert.equal(rows[0] instanceof GroupRow, true);
  assert.equal(rows[0].level, 1);
  assert.equal(rows[0].hasChildren, true);
  assert.equal(rows[0].isCollapsed, true);
  assert.equal(rows[1] instanceof Row, true);
  assert.equal(rows[1] instanceof GroupRow, false);
  assert.equal(rows[1].dataItem, dataItem);
  assert.equal(rows[1].dataIndex, 1);
  assert.equal(rows[2] instanceof Row, true);
  assert.equal(rows[2] instanceof GroupRow, true);
  assert.equal(rows[2].isGroupFooter, true);

  grid.options = { multiSelectRows: false };
  grid.selection = { row: 1, col: 0 };
  grid.rowSelection = null;
  grid.selectedRowMap = {};
  assert.equal(grid.selectedRows[0], rows[1]);

  grid.options.multiSelectRows = true;
  grid.selectedRowMap = { 0: true, 1: true };
  assert.deepEqual(grid.selectedRows, [rows[0], rows[1]]);
});

test('row range uses a positive normalized row height', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    options: { rowHeight: 0, overscanRows: 0 },
    scrollState: null,
    view: new Array(20)
  };
  var range = FabGrid.prototype.getRowRange.call(grid, {
    scrollTop: 0,
    contentHeight: 320
  });

  assert.deepEqual(range, { start: 0, end: 11 });
});

test('event dispatch uses a stable handler snapshot', function() {
  var FabGrid = createFabGridFactory({});
  var calls = [];
  var grid = Object.create(FabGrid.prototype);
  var first;

  grid.events = {};
  grid.wijmoEvents = {};
  first = function() {
    calls.push('first');
    grid.off('changed', first);
  };
  grid.on('changed', first);
  grid.on('changed', function() {
    calls.push('second');
  });

  grid.emit('changed', {});
  assert.deepEqual(calls, ['first', 'second']);
});

test('Wijmo-compatible events use a stable handler snapshot', function() {
  var FabGrid = createFabGridFactory({});
  var calls = [];
  var grid = { wijmoEvents: {} };
  var first;

  FabGrid.prototype.createWijmoEvents.call(grid);
  first = function() {
    calls.push('first');
    grid.updatedView.removeHandler(first);
  };
  grid.updatedView.addHandler(first);
  grid.updatedView.addHandler(function() {
    calls.push('second');
  });

  grid.updatedView.raise(grid, {});
  assert.deepEqual(calls, ['first', 'second']);
});

test('format item exposes FabUI cell types, panels and row data items', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var receivedSender;
  var receivedArgs;
  var cell = {};

  grid.options = { headerDisplayMode: 'header', rowHeaderHeader: '', footerLabel: '' };
  grid.columns = [{ binding: 'amount', header: 'Amount', footer: 30, _index: 0 }];
  grid.view = [{ amount: 12 }];
  grid._rowCollection = null;
  grid.events = {};
  grid.wijmoEvents = {};
  grid.isRowGroup = function() { return false; };
  grid.isRowGroupFooter = function() { return false; };
  grid.cells = createGridPanel(grid, CellType.Cell);
  grid.columnHeaders = createGridPanel(grid, CellType.ColumnHeader);
  grid.columnFooters = createGridPanel(grid, CellType.ColumnFooter);

  FabGrid.prototype.createWijmoEvents.call(grid);
  grid.formatItem.addHandler(function(sender, args) {
    receivedSender = sender;
    receivedArgs = args;
  });

  grid.raiseFormatItem(grid.createFormatItemEventArgs(grid.cells, cell, 0, 0, {
    item: grid.view[0],
    column: grid.columns[0],
    value: 12
  }));

  assert.equal(CellType.Cell, 1);
  assert.equal(CellType.ColumnHeader, 2);
  assert.equal(CellType.ColumnFooter, 5);
  assert.equal(FabGrid.CellType, CellType);
  assert.equal(grid.cells.getCellData(0, 0, false), 12);
  assert.equal(grid.columnHeaders.getCellData(0, 0, false), 'Amount');
  assert.equal(grid.columnFooters.getCellData(0, 0, false), 30);
  assert.equal(grid.rows[0].dataItem, grid.view[0]);
  assert.equal(receivedSender, grid);
  assert.equal(receivedArgs.panel, grid.cells);
  assert.equal(receivedArgs.panel.cellType, CellType.Cell);
  assert.equal(receivedArgs.cell, cell);
  assert.equal(receivedArgs.data, grid.view[0]);
  assert.equal(receivedArgs.getColumn(), grid.columns[0]);
  assert.equal(receivedArgs.getRow().dataItem, grid.view[0]);
  assert.deepEqual(receivedArgs.range, { row: 0, col: 0, row2: 0, col2: 0 });
});

test('truncated Excel filter values preserve unseen selections', function() {
  var FabGrid = createFabGridFactory({});
  var column = { binding: 'country' };
  var applied = null;
  var grid = {
    options: { excelFilterMaxValues: 2 },
    source: [
      { country: 'A' },
      { country: 'B' },
      { country: 'C' }
    ],
    isTreeGrid: function() { return false; },
    getCellDisplayText: function(item, targetColumn, value) { return String(value); },
    getText: function() { return '(blank)'; },
    getExcelFilterRows: FabGrid.prototype.getExcelFilterRows,
    getExcelFilterValueItems: FabGrid.prototype.getExcelFilterValueItems,
    clearExcelFilter: function() { applied = null; },
    setExcelFilter: function(targetColumn, filter) { applied = filter; }
  };
  var visibleItems = grid.getExcelFilterValueItems(column);

  assert.equal(visibleItems.length, 2);
  assert.equal(visibleItems.truncated, true);
  grid.excelFilterDraft = {
    column: column,
    valueItems: visibleItems,
    selectedKeys: {
      'string:A': false,
      'string:B': true
    },
    defaultSelected: true,
    truncated: true
  };

  FabGrid.prototype.handleExcelFilterMenuAction.call(grid, {
    getAttribute: function() { return 'apply'; }
  });

  assert.deepEqual(applied, { type: 'values', values: ['B', 'C'] });
});

test('observed array mutations are batched into one refresh', async function() {
  var FabGrid = createFabGridFactory({});
  var applyCount = 0;
  var refreshCount = 0;
  var grid = {
    options: { observeItemsSource: true },
    disposed: false,
    _suppressObservedItemChange: 0,
    _handlingObservedItemChange: false,
    _observedItemsChangeQueued: false,
    applyView: function() { applyCount += 1; },
    refresh: function() { refreshCount += 1; },
    handleObservedItemsSourceChange: FabGrid.prototype.handleObservedItemsSourceChange
  };
  var rows = FabGrid.prototype.createObservedItemsSource.call(grid,
    Array.from({ length: 1000 }, function(value, index) { return { id: index }; }));

  rows.splice(0, 500);
  await Promise.resolve();

  assert.equal(applyCount, 1);
  assert.equal(refreshCount, 1);
});

test('scrolling inside the rendered overscan range avoids a full render', function() {
  var FabGrid = createFabGridFactory({});
  var scheduled = 0;
  var rendered = 0;
  var grid = {
    options: { syncScrollRender: true },
    editing: null,
    bodyScroll: { scrollTop: 64, scrollLeft: 0 },
    hideInvalidTip: function() {},
    isFilterMenuOpen: function() { return false; },
    isColumnChooserOpen: function() { return false; },
    isDateboxPanelOpen: function() { return false; },
    isComboboxPanelOpen: function() { return false; },
    isColorPanelOpen: function() { return false; },
    updateScrollState: function() {},
    syncFixedPaneScrollOffset: function() {},
    syncHeaderFooterScrollPosition: function() {},
    updateHorizontalScrollbar: function() {},
    updateVerticalScrollbar: function() {},
    shouldRenderScrollImmediately: function() { return false; },
    scheduleRender: function() { scheduled += 1; },
    render: function() { rendered += 1; },
    emit: function() {}
  };

  FabGrid.prototype.handleScroll.call(grid);

  assert.equal(scheduled, 0);
  assert.equal(rendered, 0);
});

test('scroll-linked header distance uses refreshed scroll metrics after columns shrink', function() {
  var FabGrid = createFabGridFactory({});
  var propertyName = '';
  var propertyValue = '';
  var grid = Object.create(FabGrid.prototype);

  grid.useScrollLinkedHorizontal = true;
  grid.bodyScroll = {
    clientWidth: 1236,
    scrollWidth: 1264
  };
  grid.root = {
    style: {
      setProperty: function(name, value) {
        propertyName = name;
        propertyValue = value;
      }
    }
  };

  grid.updateScrollLinkedHorizontalDistance();

  assert.equal(propertyName, '--fg-scroll-linked-horizontal-distance');
  assert.equal(propertyValue, '-28px');
});

test('scroll-linked header distance schedules one post-layout correction', function() {
  var FabGrid = createFabGridFactory({});
  var originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  var callback = null;
  var updates = 0;
  var grid = Object.create(FabGrid.prototype);

  grid.useScrollLinkedHorizontal = true;
  grid.bodyScroll = {};
  grid.scrollLinkedHorizontalRaf = 0;
  grid.disposed = false;
  grid.updateScrollLinkedHorizontalDistance = function() { updates += 1; };
  globalThis.requestAnimationFrame = function(handler) {
    callback = handler;
    return 7;
  };

  try {
    grid.scheduleScrollLinkedHorizontalDistanceUpdate();
    grid.scheduleScrollLinkedHorizontalDistanceUpdate();
    assert.equal(grid.scrollLinkedHorizontalRaf, 7);
    assert.equal(typeof callback, 'function');
    callback();
    assert.equal(grid.scrollLinkedHorizontalRaf, 0);
    assert.equal(updates, 1);
  } finally {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
  }
});

test('refresh delegates layout work to render once', function() {
  var FabGrid = createFabGridFactory({});
  var layouts = 0;
  var renders = 0;
  var grid = {
    emit: function() { return true; },
    updateLayout: function() { layouts += 1; },
    render: function() { renders += 1; }
  };

  FabGrid.prototype.refresh.call(grid);

  assert.equal(layouts, 0);
  assert.equal(renders, 1);
});

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

test('active cell border defaults to one pixel', function() {
  var FabGrid = createFabGridFactory({});
  var descriptor = Object.getOwnPropertyDescriptor(FabGrid.prototype, 'activeCellBorder');
  var applyCount = 0;
  var grid = {
    options: {},
    applyThemeOptions: function() {
      applyCount += 1;
    }
  };

  assert.equal(descriptor.get.call(grid), 1);
  descriptor.set.call(grid, 'invalid');
  assert.equal(grid.options.activeCellBorder, 1);
  assert.equal(applyCount, 1);
});

test('columns use columnMinWidth unless they define their own minimum width', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    options: { columnMinWidth: 24 },
    columns: [],
    updateLayout: function() {},
    refresh: function() {}
  };

  FabGrid.prototype.setColumns.call(grid, [
    { binding: 'compact', width: 10 },
    { binding: 'custom', width: 10, minWidth: 30 }
  ], true);

  assert.equal(grid.columns[0].minWidth, 24);
  assert.equal(grid.columns[0]._width, 24);
  assert.equal(grid.columns[1].minWidth, 30);
  assert.equal(grid.columns[1]._width, 30);
});

test('select defaults to the first visible column and aligns hidden rows at the viewport start', function() {
  var FabGrid = createFabGridFactory({});
  var applied = [];
  var scrolled = [];
  var grid = {
    options: { rowHeight: 32 },
    selection: { row: 0, col: 0 },
    bodyScroll: { scrollTop: 0 },
    applyCellSelection: function(anchorRow, anchorCol, row, col) {
      applied.push([anchorRow, anchorCol, row, col]);
      this.selection = { row: row, col: col };
      return true;
    },
    getScrollableContentHeight: function() {
      return 96;
    },
    scrollIntoView: function(row, col, options) {
      scrolled.push([row, col, options]);
    }
  };

  assert.equal(FabGrid.prototype.select.call(grid, 8), true);
  assert.deepEqual(applied[0], [8, 0, 8, 0]);
  assert.deepEqual(scrolled, [[8, 0, { alignY: 'start' }]]);

  scrolled.length = 0;
  assert.equal(FabGrid.prototype.select.call(grid, 1, 2), true);
  assert.deepEqual(applied[1], [1, 2, 1, 2]);
  assert.deepEqual(scrolled, []);
});

test('scrollIntoView start alignment clamps at the final viewport', function() {
  var FabGrid = createFabGridFactory({});
  var renderCount = 0;
  var grid = {
    options: { rowHeight: 32 },
    bodyScroll: {
      clientHeight: 96,
      clientWidth: 200,
      scrollHeight: 320,
      scrollLeft: 0,
      scrollTop: 0
    },
    visibleColumns: [{ _left: 0, _width: 80 }],
    frozenColumns: 0,
    frozenWidth: 0,
    frozenRightWidth: 0,
    scrollableColumnEnd: 1,
    getScrollableContentHeight: function() {
      return 96;
    },
    getFixedLeftWidth: function() {
      return 0;
    },
    render: function() {
      renderCount += 1;
    }
  };

  FabGrid.prototype.scrollIntoView.call(grid, 4, 0, { alignY: 'start' });
  assert.equal(grid.bodyScroll.scrollTop, 128);

  FabGrid.prototype.scrollIntoView.call(grid, 9, 0, { alignY: 'start' });
  assert.equal(grid.bodyScroll.scrollTop, 224);
  assert.equal(renderCount, 2);
});

test('unselectRow clears a checked row without toggling an unchecked row on', function() {
  var FabGrid = createFabGridFactory({});
  var first = { id: 1 };
  var second = { id: 2 };
  var renderCount = 0;
  var events = [];
  var grid = Object.create(FabGrid.prototype);

  grid.options = { multiSelectRows: true };
  grid.view = [first, second];
  grid.selectedRowMap = { 0: true };
  grid.selectedItemRefs = [first];
  grid._selectedItemSet = new WeakSet([first]);
  grid.isRowGroup = function() {
    return false;
  };
  grid.isRowGroupFooter = function() {
    return false;
  };
  grid.emit = function(name, args) {
    events.push([name, args]);
  };
  grid.render = function() {
    renderCount += 1;
  };

  assert.equal(grid.unselectRow(0), true);
  assert.equal(grid.isRowSelected(0), false);
  assert.equal(grid.isItemSelected(first), false);
  assert.equal(renderCount, 1);
  assert.deepEqual(events, [
    ['selectionChanged', { row: 0, selected: false }],
    ['rowSelectionChanged', { row: 0, selected: false }]
  ]);

  assert.equal(grid.unselectRow(1), false);
  assert.equal(grid.isRowSelected(1), false);
  assert.equal(renderCount, 1);
});

test('number cell editor spinner uses the shared definition and keeps editing active', function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var grid = Object.create(FabGrid.prototype);
  var attributes = {};
  var prevented = false;

  grid.editing = { row: 0, col: 0 };
  grid.visibleColumns = [{
    binding: 'amount',
    dataType: 'number',
    precision: 2,
    editor: { type: 'number', spinner: 'left', increment: 0.25, min: 0, max: 2 }
  }];
  grid.editorConfig = { type: 'number', options: { spinner: 'left', increment: 0.25, min: 0, max: 2 } };
  grid.editorSpinner = {};
  grid.editorSpinnerIncrease = { disabled: false };
  grid.editorSpinnerDecrease = { disabled: false };
  grid.editor = {
    value: '1.25',
    focus: function() {},
    select: function() {},
    setAttribute: function(name, value) { attributes[name] = value; },
    removeAttribute: function(name) { delete attributes[name]; }
  };

  assert.equal(grid.spinEditorValue(1), true);
  assert.equal(grid.editor.value, '1.50');
  assert.equal(attributes['aria-valuenow'], '1.5');
  assert.equal(grid.handleNumberSpinnerKeyDown({
    key: 'ArrowDown',
    preventDefault: function() { prevented = true; }
  }), true);
  assert.equal(prevented, true);
  assert.equal(grid.editor.value, '1.25');
  assert.ok(grid.editing);
});

test('time cell editor uses the shared definition for aliases, values, validation and spinner', function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var grid = Object.create(FabGrid.prototype);
  var selectedRange = null;
  var column = {
    binding: 'startedAt',
    dataType: 'time',
    editor: { type: 'timebox', mask: '99:99:99', spinner: true }
  };

  grid.editing = { row: 0, col: 0 };
  grid.visibleColumns = [column];
  grid.editorConfig = { type: 'time', options: { mask: '99:99:99', spinner: true } };
  grid.editorSpinner = {};
  grid.editorSpinnerIncrease = { disabled: false };
  grid.editorSpinnerDecrease = { disabled: false };
  grid.editor = {
    value: '12:34:56',
    selectionStart: 4,
    focus: function() {},
    setSelectionRange: function(start, end) { selectedRange = [start, end]; },
    setAttribute: function() {},
    removeAttribute: function() {}
  };
  grid.getText = function(path) { return path; };
  grid.isRowGroupFooter = function() { return false; };

  assert.equal(grid.getEditorText('123456', column), '12:34:56');
  assert.equal(grid.getEditorValue(column), '123456');
  assert.equal(grid.getCellDisplayText({}, column, '123456'), '12:34:56');
  assert.equal(grid.validateCellValue({}, column, '24:00:00', 0, 0), null);
  assert.deepEqual(grid.validateCellValue({}, column, '24:00:01', 0, 0), {
    type: 'time',
    message: 'validation.invalidTime',
    value: '24:00:01'
  });
  assert.equal(grid.spinEditorValue(1), true);
  assert.equal(grid.editor.value, '12:35:56');
  assert.deepEqual(selectedRange, [3, 5]);

  column.editor = 'time';
  column.dataType = 'string';
  grid.editor.value = '09:30';
  assert.equal(grid.getEditorText('0930', column), '09:30');
  assert.equal(grid.getEditorValue(column), '0930');

  column.editor = { type: 'time', autoUnmask: false };
  assert.equal(grid.getEditorValue(column), '09:30');

  column.editor = null;
  column.dataType = 'time';
  assert.equal(grid.getEditorText('1745', column), '17:45');
});

test('editor icon host stays inside the active editor border', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var cell = {
    getBoundingClientRect: function() {
      return { left: 110, top: 210, width: 120, height: 32 };
    }
  };

  grid.editing = { row: 0, col: 0 };
  grid.visibleColumns = [{}];
  grid.root = {
    querySelector: function() {
      return cell;
    }
  };
  grid.body = {
    getBoundingClientRect: function() {
      return { left: 10, top: 10 };
    }
  };
  grid.bodyScroll = { clientWidth: 600, scrollLeft: 0, scrollTop: 0 };
  grid.editor = { style: {} };
  grid.editorIconHost = { style: { width: '22px' } };
  grid.editorConfig = { type: 'combo' };
  grid.editorIconConfigs = [];
  grid.options = { activeCellBorder: 2, rowHeight: 32 };
  Object.defineProperty(grid, 'frozenColumns', {
    configurable: true,
    value: 0
  });
  grid.scrollableColumnEnd = 1;
  grid.getEditorIconHostWidth = function() {
    return 22;
  };
  grid.positionComboboxPanel = function() {};

  FabGrid.prototype.positionEditor.call(grid);

  assert.equal(grid.editor.style.top, '200px');
  assert.equal(grid.editor.style.height, '32px');
  assert.equal(grid.editorIconHost.style.left, '196px');
  assert.equal(grid.editorIconHost.style.top, '203px');
  assert.equal(grid.editorIconHost.style.height, '26px');
  assert.equal(grid.editorIconHost.style.width, '22px');
});

test('cell templates support Wijmo-compatible function and string contracts', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var item = { name: 'Alpha', amount: 4200 };
  var column = {
    binding: 'amount',
    format: 'n0',
    cellTemplate: '<span class="${value > 4000 ? \'big-val\' : \'small-val\'}">${text}:${item.name}:${row.index}:${col.binding}</span>'
  };
  var cell = { innerHTML: '', textContent: '' };
  var directCell = { innerHTML: 'default', textContent: '' };
  var functionContext;

  grid.view = [item];
  grid._rowCollection = null;
  grid.isRowGroup = function() { return false; };
  grid.isRowGroupFooter = function() { return false; };

  assert.equal(grid.applyCellTemplate(cell, item, column, item.amount, '4,200', 0), true);
  assert.equal(cell.innerHTML, '<span class="big-val">4,200:Alpha:0:amount</span>');

  column.cellTemplate = function(ctx, target) {
    functionContext = ctx;
    target.textContent = ctx.item.name;
    return null;
  };
  assert.equal(grid.applyCellTemplate(directCell, item, column, item.amount, '4,200', 0), true);
  assert.equal(directCell.innerHTML, 'default');
  assert.equal(directCell.textContent, 'Alpha');
  assert.equal(functionContext.col, column);
  assert.equal(functionContext.row, grid.rows[0]);
  assert.equal(functionContext.value, 4200);
  assert.equal(functionContext.text, '4,200');
});

test('runtime cellTemplate assignment invalidates the grid', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var invalidateCount = 0;

  grid.disposed = false;
  grid.columns = [];
  grid.options = {};
  grid.updateLayout = function() {};
  grid.refresh = function() {};
  grid.invalidate = function() { invalidateCount += 1; };
  FabGrid.prototype.setColumns.call(grid, [{ binding: 'name' }], true);

  assert.equal(grid.columns[0].cellTemplate, null);
  grid.columns[0].cellTemplate = function(ctx) { return ctx.text; };
  assert.equal(typeof grid.columns[0].cellTemplate, 'function');
  assert.equal(invalidateCount, 1);
  grid.columns[0].cellTemplate = null;
  assert.equal(invalidateCount, 2);
});

test('setHeaderCellStyle stores styles by exact binding and redraws headers', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var inputStyle = {
    backgroundColor: '#fff4cc',
    color: '#663c00',
    'font-weight': 700
  };
  var renderCount = 0;

  grid.columns = [
    { binding: 'orderNo', header: 'Order No.' },
    { binding: 'customer', header: 'Customer' }
  ];
  grid.headerCellStyles = Object.create(null);
  grid.columnRange = { start: 0, end: 2 };
  grid.root = {};
  grid.disposed = false;
  grid.renderHeaders = function(range) {
    assert.deepEqual(range, grid.columnRange);
    renderCount += 1;
  };

  assert.equal(grid.setHeaderCellStyle('orderNo', inputStyle), true);
  assert.deepEqual(grid.headerCellStyles.orderNo, inputStyle);
  assert.notEqual(grid.headerCellStyles.orderNo, inputStyle);
  inputStyle.color = '#000000';
  assert.equal(grid.headerCellStyles.orderNo.color, '#663c00');
  assert.equal(renderCount, 1);

  assert.equal(grid.setHeaderCellStyle('Order No.', { color: 'red' }), false);
  assert.equal(grid.setHeaderCellStyle('missing', { color: 'red' }), false);
  assert.equal(grid.setHeaderCellStyle('orderNo', 'color: red'), false);
  assert.equal(renderCount, 1);

  assert.equal(grid.setHeaderCellStyle('orderNo', null), true);
  assert.equal(Object.prototype.hasOwnProperty.call(grid.headerCellStyles, 'orderNo'), false);
  assert.equal(renderCount, 2);
});

test('header cell custom styles merge after grid styles and override duplicates', function() {
  var style = {
    left: '20px',
    width: '120px',
    height: '32px',
    color: 'rgb(0, 0, 0)',
    setProperty: function(name, value) {
      this[name] = value;
    }
  };

  applyHeaderCellStyle(style, {
    width: '180px',
    color: '#c00000',
    backgroundColor: '#fff4cc',
    'font-weight': 700,
    '--custom-header-accent': '#c00000'
  });

  assert.equal(style.left, '20px');
  assert.equal(style.height, '32px');
  assert.equal(style.width, '180px');
  assert.equal(style.color, '#c00000');
  assert.equal(style.backgroundColor, '#fff4cc');
  assert.equal(style['font-weight'], '700');
  assert.equal(style['--custom-header-accent'], '#c00000');
});

test('selection mode exposes Cell and CellRange with active row highlighting enabled by default', function() {
  var FabGrid = createFabGridFactory({});
  var modeDescriptor = Object.getOwnPropertyDescriptor(FabGrid.prototype, 'selectionMode');
  var highlightDescriptor = Object.getOwnPropertyDescriptor(FabGrid.prototype, 'highlightActiveRow');
  var renderCount = 0;
  var grid = {
    options: { selectionMode: 'Cell', highlightActiveRow: true },
    selection: { row: 2, col: 1 },
    selectionAnchor: { row: 0, col: 0 },
    render: function() { renderCount += 1; }
  };

  assert.deepEqual(FabGrid.SelectionMode, { Cell: 'Cell', CellRange: 'CellRange' });
  assert.equal(highlightDescriptor.get.call(grid), true);

  modeDescriptor.set.call(grid, 'cell-range');
  assert.equal(grid.options.selectionMode, 'CellRange');
  modeDescriptor.set.call(grid, 'unsupported');
  assert.equal(grid.options.selectionMode, 'Cell');
  assert.deepEqual(grid.selectionAnchor, { row: 2, col: 1 });

  highlightDescriptor.set.call(grid, false);
  assert.equal(grid.options.highlightActiveRow, false);
  assert.equal(renderCount, 3);
});

test('cell range selection preserves an anchor and exposes a normalized selected range', function() {
  var FabGrid = createFabGridFactory({});
  var events = [];
  var grid = Object.create(FabGrid.prototype);

  grid.options = { selectionMode: 'CellRange', multiSelectRows: false, highlightActiveRow: true };
  grid.view = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
  grid.visibleColumns = [{ binding: 'a' }, { binding: 'b' }, { binding: 'c' }];
  grid.selection = { row: 0, col: 0 };
  grid.selectionAnchor = { row: 0, col: 0 };
  grid.rowSelection = 0;
  grid.emit = function(name, args) {
    events.push({ name: name, args: args });
    return true;
  };
  grid.render = function() {};

  assert.equal(grid.selectRange(3, 2, 1, 0), true);
  assert.deepEqual(grid.selectionAnchor, { row: 3, col: 2 });
  assert.deepEqual(grid.selection, { row: 1, col: 0 });
  assert.deepEqual(grid.getSelectionRange(), { row: 1, col: 0, row2: 3, col2: 2 });
  assert.deepEqual(grid.selectedRanges, [{ row: 1, col: 0, row2: 3, col2: 2 }]);
  assert.deepEqual(events.find(function(entry) { return entry.name === 'selectionChanged'; }).args.range,
    { row: 1, col: 0, row2: 3, col2: 2 });
});

test('cell range pointer tracking recognizes a double click on the same cell', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);

  grid.cellRangeClickCandidate = null;

  assert.equal(grid.isCellRangePointerDoubleClick({
    detail: 0,
    timeStamp: 100,
    clientX: 40,
    clientY: 50
  }, 2, 1), false);
  assert.equal(grid.isCellRangePointerDoubleClick({
    detail: 0,
    timeStamp: 300,
    clientX: 42,
    clientY: 52
  }, 2, 1), true);
  assert.equal(grid.cellRangeClickCandidate, null);
  assert.equal(grid.isCellRangePointerDoubleClick({
    detail: 2,
    timeStamp: 800,
    clientX: 80,
    clientY: 90
  }, 3, 2), false);
  assert.equal(grid.isCellRangePointerDoubleClick({
    detail: 2,
    timeStamp: 900,
    clientX: 82,
    clientY: 92
  }, 3, 2), true);

  grid.cellRangeClickCandidate = {
    row: 1,
    col: 1,
    time: 1000,
    clientX: 20,
    clientY: 20
  };
  assert.equal(grid.isCellRangePointerDoubleClick({
    detail: 2,
    timeStamp: 1100,
    clientX: 20,
    clientY: 20
  }, 1, 2), false);
});

test('pointer cancel ends a cell range drag without scheduling a double click', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var scheduled = 0;

  grid.cellRangeDragState = {
    pointerId: 7,
    startRow: 2,
    startCol: 1,
    isDoubleClick: true,
    didMove: false
  };
  grid.cellRangeAutoScrollRaf = 0;
  grid.cellRangeClickCandidate = { row: 2, col: 1 };
  grid.suppressCellRangeClick = false;
  grid.suppressCellRangeClickEvent = false;
  grid.scheduleCellDblClick = function() { scheduled += 1; };

  assert.equal(grid.finishCellRangeDrag({ type: 'pointercancel', pointerId: 7 }), true);
  assert.equal(scheduled, 0);
  assert.equal(grid.cellRangeClickCandidate, null);
  assert.equal(grid.suppressCellRangeClick, false);
  assert.equal(grid.suppressCellRangeClickEvent, false);
});

test('selecting the unchanged cell range does not render again', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var renderCount = 0;

  grid.options = { selectionMode: 'CellRange', multiSelectRows: false };
  grid.view = [{ a: 1 }];
  grid.visibleColumns = [{ binding: 'a' }];
  grid.selection = { row: 0, col: 0 };
  grid.selectionAnchor = { row: 0, col: 0 };
  grid.rowSelection = 0;
  grid.render = function() { renderCount += 1; };

  assert.equal(grid.select(0, 0), true);
  assert.equal(renderCount, 0);
});

test('document pointer handlers are bound only for an active interaction', function() {
  var FabGrid = createFabGridFactory({});
  var originalDocument = globalThis.document;
  var added = [];
  var removed = [];
  var grid = Object.create(FabGrid.prototype);

  globalThis.document = {
    addEventListener: function(name, handler) { added.push([name, handler]); },
    removeEventListener: function(name, handler) { removed.push([name, handler]); }
  };
  try {
    grid._boundPointerMove = function() {};
    grid._boundPointerUp = function() {};
    grid._boundVerticalScrollbarPointerMove = function() {};
    grid._boundVerticalScrollbarPointerUp = function() {};
    grid._boundHorizontalScrollbarPointerMove = function() {};
    grid._boundHorizontalScrollbarPointerUp = function() {};
    grid.pointerInteractionEventsBound = false;
    grid.verticalScrollbarDragEventsBound = false;
    grid.horizontalScrollbarDragEventsBound = false;

    grid.bindPointerInteractionEvents();
    grid.bindPointerInteractionEvents();
    grid.bindVerticalScrollbarDragEvents();
    grid.bindVerticalScrollbarDragEvents();
    grid.bindHorizontalScrollbarDragEvents();
    grid.bindHorizontalScrollbarDragEvents();
    assert.equal(added.length, 9);

    grid.unbindPointerInteractionEvents();
    grid.unbindVerticalScrollbarDragEvents();
    grid.unbindHorizontalScrollbarDragEvents();
    assert.equal(removed.length, 9);
  } finally {
    if (originalDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = originalDocument;
    }
  }
});

test('active row highlighting is visual and keeps multi-selected rows visible', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);

  grid.options = { multiSelectRows: false, highlightActiveRow: true };
  grid.selection = { row: 2, col: 0 };
  grid.rowSelection = 2;
  grid.selectedRowMap = {};

  assert.equal(grid.shouldHighlightRow(2), true);
  grid.options.highlightActiveRow = false;
  assert.equal(grid.shouldHighlightRow(2), false);

  grid.options.multiSelectRows = true;
  grid.selectedRowMap = { 1: true };
  assert.equal(grid.shouldHighlightRow(1), true);
  assert.equal(grid.shouldHighlightRow(2), false);
});

test('cell range copy returns a rectangular TSV and skips synthetic group rows', function() {
  var FabGrid = createFabGridFactory({});
  var group = { __fgRowType: 'group' };
  var grid = Object.create(FabGrid.prototype);

  grid.options = { selectionMode: 'CellRange' };
  grid.view = [{ a: 'A1', b: 'B1' }, group, { a: 'A2', b: 'B2' }];
  grid.visibleColumns = [{ binding: 'a' }, { binding: 'b' }];
  grid.selectionAnchor = { row: 0, col: 0 };
  grid.selection = { row: 2, col: 1 };
  grid.isRowGroup = function(item) { return item === group; };
  grid.isRowGroupFooter = function() { return false; };
  grid.getCellData = function(row, col) {
    return grid.view[row][grid.visibleColumns[col].binding];
  };

  assert.equal(grid.getSelectedText(), 'A1\tB1\nA2\tB2');
});

test('alternating row step controls grouped row banding', function() {
  var FabGrid = createFabGridFactory({});
  var descriptor = Object.getOwnPropertyDescriptor(FabGrid.prototype, 'alternatingRowStep');
  var renderCount = 0;
  var grid = {
    options: {},
    render: function() {
      renderCount += 1;
    }
  };

  assert.equal(descriptor.get.call(grid), 1);

  descriptor.set.call(grid, 2.9);
  assert.equal(grid.options.alternatingRowStep, 2);
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6, 7].map(function(rowIndex) {
      return FabGrid.prototype.isAlternatingRow.call(grid, rowIndex);
    }),
    [false, false, true, true, false, false, true, true]
  );

  descriptor.set.call(grid, false);
  assert.equal(grid.options.alternatingRowStep, false);
  assert.equal(FabGrid.prototype.isAlternatingRow.call(grid, 1), false);

  descriptor.set.call(grid, 0);
  assert.equal(grid.options.alternatingRowStep, false);
  assert.equal(renderCount, 3);
});

test('JSON API exports source or view rows and imports through setItemsSource', async function() {
  var FabGrid = createFabGridFactory({});
  var imported = null;
  var sourceRows = [{ id: 1 }, { id: 2 }];
  var groupRow = { __fgRowType: 'group' };
  var footerRow = { __fgRowType: 'groupFooter' };
  var grid = {
    source: sourceRows,
    view: [groupRow, sourceRows[1], footerRow],
    isRowGroup: function(row) { return row === groupRow; },
    isRowGroupFooter: function(row) { return row === footerRow; },
    setItemsSource: function(rows) { imported = rows; }
  };

  assert.equal(FabGrid.prototype.getJson.call(grid), '[{"id":1},{"id":2}]');
  assert.equal(FabGrid.prototype.getJson.call(grid, { viewOnly: true, space: 2 }), '[\n  {\n    "id": 2\n  }\n]');
  assert.equal(await FabGrid.prototype.importJson.call(grid, '{"rows":[{"id":9}]}'), true);
  assert.deepEqual(imported, [{ id: 9 }]);
  await assert.rejects(FabGrid.prototype.importJson.call(grid, '{"id":9}'), /must be an array/);
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

test('grid popup opens from the column header row only', function() {
  var FabGrid = createFabGridFactory({});
  var shown = [];
  var hidden = 0;
  var prevented = 0;
  var stopped = 0;
  var grid = {
    hideTopLeftMenu: function() { hidden += 1; },
    showTopLeftMenu: function(x, y) { shown.push([x, y]); }
  };
  var headerTitle = { nodeType: 1, className: 'fg-header-title', parentNode: null };
  var headerLabel = { nodeType: 1, className: 'fg-header-label', parentNode: headerTitle };
  var rowHeader = { nodeType: 1, className: 'fg-row-header-top', parentNode: null };

  FabGrid.prototype.handleContextMenu.call(grid, {
    target: headerLabel,
    clientX: 120,
    clientY: 36,
    preventDefault: function() { prevented += 1; },
    stopPropagation: function() { stopped += 1; }
  });
  FabGrid.prototype.handleContextMenu.call(grid, {
    target: rowHeader,
    clientX: 12,
    clientY: 36
  });

  assert.deepEqual(shown, [[120, 36]]);
  assert.equal(hidden, 1);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
});

test('TreeGrid popup opens from every tree column data cell', function() {
  var FabGrid = createFabGridFactory({});
  var shown = [];
  var prevented = 0;
  var stopped = 0;
  var cell = {
    nodeType: 1,
    className: 'fg-cell fg-tree-cell',
    parentNode: null,
    getAttribute: function(name) {
      if (name === 'data-row' || name === 'data-col') {
        return '0';
      }
      return null;
    }
  };
  var content = {
    nodeType: 1,
    className: 'fg-tree-cell-content',
    parentNode: cell
  };
  var grid = {
    options: { childItemsPath: 'children', treeColumn: 0 },
    visibleColumns: [{ binding: 'name' }],
    _treeRowInfos: [{ item: { name: 'Leaf' }, hasChildren: false, collapsed: false }],
    getTreeColumnIndex: FabGrid.prototype.getTreeColumnIndex,
    getTreeRowInfo: FabGrid.prototype.getTreeRowInfo,
    handleTreeContextMenu: FabGrid.prototype.handleTreeContextMenu,
    hideTopLeftMenu: function() {},
    showTopLeftMenu: function(x, y, mode) {
      shown.push([x, y, mode]);
    }
  };

  FabGrid.prototype.handleContextMenu.call(grid, {
    target: content,
    clientX: 80,
    clientY: 120,
    preventDefault: function() { prevented += 1; },
    stopPropagation: function() { stopped += 1; }
  });

  assert.deepEqual(shown, [[80, 120, 'tree']]);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
});

test('TreeGrid context menu exposes one bulk toggle action', function() {
  var FabGrid = createFabGridFactory({});
  var info = { item: { name: 'Parent' }, hasChildren: true, collapsed: false };
  var collapsed = 0;
  var expanded = 0;
  var emitted = [];
  var grid = {
    view: [info.item],
    _treeRowInfos: [info],
    getTreeRowInfo: FabGrid.prototype.getTreeRowInfo,
    hasExpandedTreeNode: FabGrid.prototype.hasExpandedTreeNode,
    getText: function(path) {
      return path === 'tree.collapseAll' ? '全部疊合' : '全部展開';
    },
    collapseGroupsToLevel: function(level) {
      collapsed += level === 0 ? 1 : 100;
    },
    expandAllTreeNodes: function() {
      expanded += 1;
    },
    emit: function(name, args) {
      emitted.push([name, args.collapsed]);
    }
  };

  assert.deepEqual(FabGrid.prototype.getTreeContextMenuItem.call(grid), {
    action: 'tree-collapse-all',
    icon: '▸',
    label: '全部疊合'
  });
  assert.equal(FabGrid.prototype.handleTreeContextMenuAction.call(grid, 'tree-collapse-all'), true);

  info.collapsed = true;
  assert.deepEqual(FabGrid.prototype.getTreeContextMenuItem.call(grid), {
    action: 'tree-expand-all',
    icon: '▾',
    label: '全部展開'
  });
  assert.equal(FabGrid.prototype.handleTreeContextMenuAction.call(grid, 'tree-expand-all'), true);
  assert.equal(FabGrid.prototype.handleTreeContextMenuAction.call(grid, 'unknown'), false);
  assert.equal(collapsed, 1);
  assert.equal(expanded, 1);
  assert.deepEqual(emitted, [
    ['treeContextMenuAction', true],
    ['treeContextMenuAction', false]
  ]);
});

test('filter icon click opens its menu without sorting the column', function() {
  var FabGrid = createFabGridFactory({});
  var menuCalls = 0;
  var sortCalls = 0;
  var prevented = 0;
  var stopped = 0;
  var header = {
    nodeType: 1,
    className: 'fg-header-cell',
    parentNode: null,
    getAttribute: function(name) {
      return name === 'data-col' ? '2' : null;
    }
  };
  var filterIcon = {
    nodeType: 1,
    className: 'fg-filter-icon',
    parentNode: header,
    getAttribute: function(name) {
      return name === 'data-col' ? '2' : null;
    }
  };
  var grid = {
    busy: false,
    fixedPaneTouchClickUntil: 0,
    suppressClick: false,
    options: { allowSorting: true },
    showFilterMenu: function(colIndex, anchor) {
      menuCalls += colIndex === 2 && anchor === filterIcon ? 1 : 100;
    },
    toggleSort: function() {
      sortCalls += 1;
    }
  };

  FabGrid.prototype.handleClick.call(grid, {
    target: filterIcon,
    shiftKey: false,
    preventDefault: function() { prevented += 1; },
    stopPropagation: function() { stopped += 1; }
  });

  assert.equal(menuCalls, 1);
  assert.equal(sortCalls, 0);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
});

test('escape closes the Excel-like filter popup without applying its draft', function() {
  var FabGrid = createFabGridFactory({});
  var hidden = 0;
  var prevented = 0;
  var stopped = 0;
  var draft = { selectedKeys: { TW: false } };
  var grid = {
    selection: { row: 0, col: 0 },
    busy: false,
    editing: null,
    excelFilterDraft: draft,
    filterMenu: { style: { display: 'block' } },
    hideFilterMenu: function() {
      hidden += 1;
    },
    isFilterMenuOpen: FabGrid.prototype.isFilterMenuOpen
  };
  var popupSearch = {
    nodeType: 1,
    tagName: 'INPUT',
    className: 'fg-excel-filter-search',
    parentNode: null
  };

  FabGrid.prototype.handleKeyDown.call(grid, {
    key: 'Escape',
    target: popupSearch,
    preventDefault: function() { prevented += 1; },
    stopPropagation: function() { stopped += 1; }
  });

  assert.equal(hidden, 1);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
  assert.equal(grid.excelFilterDraft, draft);
});

test('escape closes the shared Grid context menu', function() {
  var FabGrid = createFabGridFactory({});
  var hidden = 0;
  var prevented = 0;
  var stopped = 0;
  var grid = {
    selection: { row: 0, col: 0 },
    busy: false,
    editing: null,
    isFilterMenuOpen: function() { return false; },
    isTopLeftMenuOpen: function() { return true; },
    hideTopLeftMenu: function() { hidden += 1; }
  };

  FabGrid.prototype.handleKeyDown.call(grid, {
    key: 'Escape',
    target: { nodeType: 1, tagName: 'DIV', className: 'fg-cell', parentNode: null },
    preventDefault: function() { prevented += 1; },
    stopPropagation: function() { stopped += 1; }
  });

  assert.equal(hidden, 1);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
});

test('escape closes the column chooser popup', function() {
  var FabGrid = createFabGridFactory({});
  var hidden = 0;
  var prevented = 0;
  var stopped = 0;
  var grid = {
    selection: { row: 0, col: 0 },
    busy: false,
    editing: null,
    isFilterMenuOpen: function() { return false; },
    isTopLeftMenuOpen: function() { return false; },
    isColumnChooserOpen: function() { return true; },
    hideColumnChooser: function() { hidden += 1; }
  };

  FabGrid.prototype.handleKeyDown.call(grid, {
    key: 'Escape',
    target: { nodeType: 1, tagName: 'BUTTON', className: 'fg-column-chooser-trigger', parentNode: null },
    preventDefault: function() { prevented += 1; },
    stopPropagation: function() { stopped += 1; }
  });

  assert.equal(hidden, 1);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
});

test('pointer outside closes the column chooser but pointer inside keeps it open', function() {
  var FabGrid = createFabGridFactory({});
  var hidden = 0;
  var open = true;
  var grid = {
    isColumnChooserOpen: function() { return open; },
    hideColumnChooser: function() {
      hidden += 1;
      open = false;
    },
    getFilterMenuItemAtEvent: function() { return null; }
  };
  var chooser = { nodeType: 1, className: 'fg-column-chooser', parentNode: null };
  var inside = { nodeType: 1, className: 'fg-column-chooser-check', parentNode: chooser };
  var outside = { nodeType: 1, className: 'outside', parentNode: null };

  grid.isTopLeftMenuOpen = function() { return false; };
  grid.isFilterMenuOpen = function() { return false; };
  FabGrid.prototype.handleFilterMenuClick.call(grid, { target: inside });
  assert.equal(hidden, 0);

  FabGrid.prototype.handleFilterMenuClick.call(grid, { target: outside });
  assert.equal(hidden, 1);
});

test('pointer outside closes every open Grid menu', function() {
  var FabGrid = createFabGridFactory({});
  var hidden = {
    topLeft: 0,
    filter: 0,
    chooser: 0
  };
  var grid = {
    isTopLeftMenuOpen: function() { return true; },
    hideTopLeftMenu: function() { hidden.topLeft += 1; },
    isFilterMenuOpen: function() { return true; },
    hideFilterMenu: function() { hidden.filter += 1; },
    isColumnChooserOpen: function() { return true; },
    hideColumnChooser: function() { hidden.chooser += 1; },
    getFilterMenuItemAtEvent: function() { return null; }
  };
  var outside = { nodeType: 1, className: 'outside', parentNode: null };

  FabGrid.prototype.handleFilterMenuClick.call(grid, { target: outside });

  assert.deepEqual(hidden, {
    topLeft: 1,
    filter: 1,
    chooser: 1
  });
});

test('document pointer leaves shared combo and color popup lifecycle to popup classes', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    isTopLeftMenuOpen: function() { return false; },
    getFilterMenuItemAtEvent: function() { return null; },
    filterMenu: { style: { display: 'none' } },
    isColumnChooserOpen: function() { return false; },
    editor: { nodeType: 1, className: 'fg-editor', parentNode: null },
    editing: null
  };
  var outside = { nodeType: 1, className: 'outside', parentNode: null };
  assert.doesNotThrow(function() {
    FabGrid.prototype.handleDocumentMouseDown.call(grid, { target: outside });
  });
});

test('filter changed is exposed as a Wijmo-compatible event', function() {
  var FabGrid = createFabGridFactory({});
  var grid = { wijmoEvents: {} };

  FabGrid.prototype.createWijmoEvents.call(grid);

  assert.equal(typeof grid.filterChanged.addHandler, 'function');
  assert.equal(grid.wijmoEvents.filterChanged, grid.filterChanged);
});

test('constructor filter rules initialize Search Row values and operators', function() {
  var FabGrid = createFabGridFactory({});
  var columns = [
    { binding: 'status', header: 'Status', dataType: 'string' },
    { binding: 'amount', header: 'Amount', dataType: 'number' }
  ];
  var grid = {
    options: {
      remote: false,
      allowFiltering: false,
      showSearchRow: false,
      filterRules: JSON.stringify([
        { field: 'status', op: 'eq', value: '草稿' },
        { field: 'amount', op: 'gte', value: 1000 },
        { field: 'serverOnly', op: 'eq', value: '保留' },
        { field: 'status', op: 'invalid', value: 'ignored' }
      ])
    },
    columns: columns,
    columnSearchValues: {},
    columnSearchOperators: {},
    hasColumnSearch: false,
    getColumn: function(value) {
      return columns.find(function(column) {
        return column.binding === value;
      }) || null;
    }
  };

  var applied = FabGrid.prototype.applyInitialFilterRules.call(grid, grid.options.filterRules);

  assert.deepEqual(applied, [
    { field: 'status', op: 'eq', value: '草稿' },
    { field: 'amount', op: 'gte', value: '1000' }
  ]);
  assert.equal(grid.options.showSearchRow, true);
  assert.equal(grid.options.allowFiltering, true);
  assert.equal(grid.hasColumnSearch, true);
  assert.deepEqual(grid.columnSearchValues, {
    'binding:status': '草稿',
    'binding:amount': '1000'
  });
  assert.deepEqual(grid.columnSearchOperators, {
    'binding:status': 'eq',
    'binding:amount': 'gte'
  });
  assert.deepEqual(grid.options.filterRules, [
    { field: 'status', op: 'eq', value: '草稿' },
    { field: 'amount', op: 'gte', value: '1000' },
    { field: 'serverOnly', op: 'eq', value: '保留' }
  ]);
  assert.equal(FabGrid.prototype.getColumnSearchValue.call(grid, columns[0]), '草稿');
  assert.equal(FabGrid.prototype.getColumnSearchOperator.call(grid, columns[1]), 'gte');
  assert.deepEqual(FabGrid.prototype.getRemoteFilterParams.call(grid), {
    q: undefined,
    filterRules: JSON.stringify([
      { field: 'status', op: 'eq', value: '草稿' },
      { field: 'amount', op: 'gte', value: '1000' },
      { field: 'serverOnly', op: 'eq', value: '保留' }
    ])
  });
});

test('remote constructor filter rules preserve custom operators', function() {
  var FabGrid = createFabGridFactory({});
  var columns = [
    { binding: 'contains', dataType: 'string' },
    { binding: 'starts', dataType: 'string' },
    { binding: 'ends', dataType: 'string' },
    { binding: 'notContains', dataType: 'string' },
    { binding: 'notStarts', dataType: 'string' },
    { binding: 'notEnds', dataType: 'string' }
  ];
  var grid = {
    options: {
      remote: true,
      allowFiltering: false,
      showSearchRow: false,
      filterRules: [
        { field: 'ignored', op: '%..%', value: '' },
        { field: 'contains', op: '%..%', value: 'A' },
        { field: 'starts', op: '..%', value: 'B' },
        { field: 'ends', op: '%..', value: 'C' },
        { field: 'notContains', op: '!%..%', value: 'D' },
        { field: 'notStarts', op: '!..%', value: 'E' },
        { field: 'notEnds', op: '!%..', value: 'F' },
        { field: 'serverOnly', op: '<>', value: 'S' }
      ]
    },
    columns: columns,
    columnSearchValues: {},
    columnSearchOperators: {},
    hasColumnSearch: false,
    searchText: '',
    getColumn: function(value) {
      return columns.find(function(column) {
        return column.binding === value;
      }) || null;
    }
  };

  var applied = FabGrid.prototype.applyInitialFilterRules.call(grid, grid.options.filterRules);

  assert.deepEqual(applied, [
    { field: 'contains', op: '%..%', value: 'A' },
    { field: 'starts', op: '..%', value: 'B' },
    { field: 'ends', op: '%..', value: 'C' },
    { field: 'notContains', op: '!%..%', value: 'D' },
    { field: 'notStarts', op: '!..%', value: 'E' },
    { field: 'notEnds', op: '!%..', value: 'F' }
  ]);
  assert.equal(grid.options.allowFiltering, true);
  assert.equal(grid.options.showSearchRow, true);
  assert.deepEqual(grid.columnSearchValues, {
    'binding:contains': 'A',
    'binding:starts': 'B',
    'binding:ends': 'C',
    'binding:notContains': 'D',
    'binding:notStarts': 'E',
    'binding:notEnds': 'F'
  });
  assert.deepEqual(grid.columnSearchOperators, {
    'binding:contains': 'contains',
    'binding:starts': 'starts',
    'binding:ends': 'ends',
    'binding:notContains': 'not-contains',
    'binding:notStarts': 'not-starts',
    'binding:notEnds': 'not-ends'
  });
  assert.deepEqual(FabGrid.prototype.getRemoteFilterParams.call(grid), {
    q: undefined,
    filterRules: JSON.stringify([
      { field: 'contains', op: '%..%', value: 'A' },
      { field: 'starts', op: '..%', value: 'B' },
      { field: 'ends', op: '%..', value: 'C' },
      { field: 'notContains', op: '!%..%', value: 'D' },
      { field: 'notStarts', op: '!..%', value: 'E' },
      { field: 'notEnds', op: '!%..', value: 'F' },
      { field: 'serverOnly', op: '<>', value: 'S' }
    ])
  });
});

test('remote in filter rules serialize array values as comma-separated text', function() {
  var FabGrid = createFabGridFactory({});
  var columns = [
    { binding: 'facno', dataType: 'string' }
  ];
  var grid = {
    options: {
      remote: true,
      allowFiltering: true,
      showSearchRow: false,
      filterRules: [
        { field: 'facno', op: 'in', value: ['ZU001', 'AV001'] }
      ]
    },
    columns: columns,
    columnSearchValues: {},
    columnSearchOperators: {},
    excelFilters: {},
    hasColumnSearch: false,
    searchText: '',
    getColumn: function(value) {
      return columns.find(function(column) {
        return column.binding === value;
      }) || null;
    }
  };

  FabGrid.prototype.applyInitialFilterRules.call(grid, grid.options.filterRules);
  assert.deepEqual(grid.options.filterRules, [
    { field: 'facno', op: 'in', value: 'ZU001,AV001' }
  ]);
  assert.deepEqual(grid.columnSearchValues, {
    'binding:facno': 'ZU001,AV001'
  });
  assert.deepEqual(FabGrid.prototype.getRemoteFilterParams.call(grid), {
    q: undefined,
    filterRules: '[{"field":"facno","op":"in","value":"ZU001,AV001"}]'
  });

  grid.options.showSearchRow = false;
  grid.options.filterRules = [];
  grid.columnSearchValues = {};
  grid.excelFilters = {
    'binding:facno': { type: 'values', values: ['ZU001', 'AV001'] }
  };
  assert.deepEqual(FabGrid.prototype.getRemoteFilterParams.call(grid), {
    q: undefined,
    filterRules: '[{"field":"facno","op":"in","value":"ZU001,AV001"}]'
  });
});

test('setFilterRules replaces runtime rules and updates Search Row state once', function() {
  var FabGrid = createFabGridFactory({});
  var columns = [
    { binding: 'stus2', header: 'Status 2', dataType: 'string' }
  ];
  var changes = [];
  var grid = {
    options: {
      remote: true,
      allowFiltering: true,
      showSearchRow: true,
      filterRules: [{ field: 'old', op: 'eq', value: 'old' }]
    },
    columns: columns,
    columnSearchValues: { 'binding:stus2': 'old' },
    columnSearchOperators: { 'binding:stus2': 'eq' },
    hasColumnSearch: true,
    getColumn: function(value) {
      return columns.find(function(column) {
        return column.binding === value;
      }) || null;
    },
    cancelHeaderSearchTimer: function() {},
    hideFilterMenu: function() {},
    updateColumnSearchState: function() {
      this.hasColumnSearch = Object.keys(this.columnSearchValues).length > 0;
    },
    applyFilterChange: function(resetHorizontalScroll, source) {
      changes.push([resetHorizontalScroll, source]);
    }
  };
  grid.applyInitialFilterRules = FabGrid.prototype.applyInitialFilterRules;
  grid.getRemoteFilterParams = FabGrid.prototype.getRemoteFilterParams;

  FabGrid.prototype.setFilterRules.call(grid, [
    { field: 'stus2', op: '!%..%', value: 'I' },
    { field: 'stus3', op: '<>', value: 'S' }
  ]);

  assert.deepEqual(grid.options.filterRules, [
    { field: 'stus2', op: '!%..%', value: 'I' },
    { field: 'stus3', op: '<>', value: 'S' }
  ]);
  assert.deepEqual(grid.columnSearchValues, {
    'binding:stus2': 'I'
  });
  assert.deepEqual(grid.columnSearchOperators, {
    'binding:stus2': 'not-contains'
  });
  assert.equal(grid.hasColumnSearch, true);
  assert.deepEqual(changes, [[true, 'setFilterRules']]);

  grid.columnSearchValues['binding:stus2'] = 'Updated';
  var currentRules = FabGrid.prototype.getFilterRules.call(grid);
  assert.deepEqual(currentRules, [
    { field: 'stus2', op: '!%..%', value: 'Updated' },
    { field: 'stus3', op: '<>', value: 'S' }
  ]);
  currentRules[0].value = 'Changed outside';
  assert.equal(FabGrid.prototype.getFilterRules.call(grid)[0].value, 'Updated');

  FabGrid.prototype.setFilterRules.call(grid, []);
  assert.deepEqual(grid.options.filterRules, []);
  assert.deepEqual(grid.columnSearchValues, {});
  assert.deepEqual(grid.columnSearchOperators, {});
  assert.equal(grid.hasColumnSearch, false);
  assert.deepEqual(FabGrid.prototype.getFilterRules.call(grid), []);
  assert.deepEqual(changes, [
    [true, 'setFilterRules'],
    [true, 'setFilterRules']
  ]);
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

test('search row mode changes clear the other column filter mode', function() {
  var FabGrid = createFabGridFactory({});
  var events = [];
  var applies = [];
  var grid = {
    options: { showSearchRow: false },
    searchText: 'quick',
    excelFilters: { country: { type: 'values', values: ['TW'] } },
    columnSearchValues: {},
    columnSearchOperators: {},
    hasColumnSearch: false,
    cancelHeaderSearchTimer: function() {},
    hideFilterMenu: function() {},
    applyFilterChange: function(reset, source) {
      applies.push({ reset: reset, source: source });
    },
    emit: function(name, args) {
      events.push({ name: name, args: args });
    }
  };

  FabGrid.prototype.setShowSearchRow.call(grid, true);
  assert.deepEqual(grid.excelFilters, {});
  assert.equal(grid.searchText, 'quick');
  assert.equal(events[0].args.clearedFilter, true);

  grid.columnSearchValues = { country: 'T' };
  grid.columnSearchOperators = { country: 'starts' };
  grid.hasColumnSearch = true;
  FabGrid.prototype.setShowSearchRow.call(grid, false);

  assert.deepEqual(grid.columnSearchValues, {});
  assert.deepEqual(grid.columnSearchOperators, {});
  assert.equal(grid.hasColumnSearch, false);
  assert.equal(grid.searchText, 'quick');
  assert.deepEqual(applies, [
    { reset: true, source: 'searchRowVisibility' },
    { reset: true, source: 'searchRowVisibility' }
  ]);
});

test('allow filtering false clears both column filter modes and keeps quick search', function() {
  var FabGrid = createFabGridFactory({});
  var applies = [];
  var quickFilter = function(item) { return item.country === 'TW'; };
  var grid = {
    options: { allowFiltering: true, showSearchRow: true },
    searchText: 'quick',
    filterPredicate: quickFilter,
    columnSearchValues: { country: 'T' },
    columnSearchOperators: { country: 'starts' },
    hasColumnSearch: true,
    excelFilters: { country: { type: 'values', values: ['TW'] } },
    cancelHeaderSearchTimer: function() {},
    hideFilterMenu: function() {},
    applyFilterChange: function(reset, source) {
      applies.push({ reset: reset, source: source });
    }
  };

  FabGrid.prototype.setAllowFiltering.call(grid, false);

  assert.equal(grid.options.allowFiltering, false);
  assert.equal(grid.options.showSearchRow, true);
  assert.equal(grid.searchText, 'quick');
  assert.equal(grid.filterPredicate, quickFilter);
  assert.deepEqual(grid.columnSearchValues, {});
  assert.deepEqual(grid.columnSearchOperators, {});
  assert.equal(grid.hasColumnSearch, false);
  assert.deepEqual(grid.excelFilters, {});
  assert.deepEqual(applies, [{ reset: true, source: 'allowFiltering' }]);
});

test('excel value filters are applied only while search row is hidden', function() {
  var FabGrid = createFabGridFactory({});
  var columns = [
    { binding: 'country', dataType: 'string', visible: true },
    { binding: 'amount', dataType: 'number', visible: true }
  ];
  var grid = {
    options: {
      showSearchRow: false,
      remote: false,
      pagination: false,
      rowGroups: []
    },
    source: [
      { country: 'Taiwan', amount: 10 },
      { country: 'Japan', amount: 20 },
      { country: 'Germany', amount: 30 }
    ],
    columns: columns,
    excelFilters: { 'binding:country': { type: 'values', values: ['Taiwan', 'Japan'] } },
    filterPredicate: null,
    searchText: '',
    columnSearchValues: {},
    columnSearchOperators: {},
    hasColumnSearch: false,
    getSortStates: function() { return []; },
    captureSelectionState: function() { return null; },
    isTreeGrid: function() { return false; },
    createGroupedView: function(rows) { return rows; },
    refreshInvalidItemRows: function() {},
    restoreSelectionState: function() {},
    clampSelection: function() {},
    syncEditingWithView: function() {}
  };

  FabGrid.prototype.applyView.call(grid);
  assert.deepEqual(grid.view.map(function(item) { return item.country; }), ['Taiwan', 'Japan']);

  grid.options.showSearchRow = true;
  FabGrid.prototype.applyView.call(grid);
  assert.equal(grid.view.length, 3);
});

test('time search row compares formatted time values', function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var column = { binding: 'startedAt', dataType: 'time', visible: true, editor: 'time' };
  var grid = {
    options: {
      showSearchRow: true,
      remote: false,
      pagination: false,
      rowGroups: []
    },
    source: [
      { startedAt: '0930' },
      { startedAt: '1030' }
    ],
    columns: [column],
    excelFilters: {},
    filterPredicate: null,
    searchText: '',
    columnSearchValues: { 'binding:startedAt': '09:3' },
    columnSearchOperators: { 'binding:startedAt': 'starts' },
    hasColumnSearch: true,
    getSortStates: function() { return []; },
    captureSelectionState: function() { return null; },
    isTreeGrid: function() { return false; },
    createGroupedView: function(rows) { return rows; },
    refreshInvalidItemRows: function() {},
    restoreSelectionState: function() {},
    clampSelection: function() {},
    syncEditingWithView: function() {}
  };

  FabGrid.prototype.applyView.call(grid);
  assert.deepEqual(grid.view, [{ startedAt: '0930' }]);
});
