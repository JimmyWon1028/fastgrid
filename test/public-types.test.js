import test from 'node:test';
import assert from 'node:assert/strict';
import fabui from '../src/fabui.js';
import {
  createXlsxFiles,
  getExcelColumnName
} from '../src/grid/fabgrid-export.js?v=20260717-pivot-excel-hidden-rows-v1';

test('FabUI publishes Row and GroupRow through FabGrid only', function() {
  assert.equal(typeof fabui.FabGrid.Row, 'function');
  assert.equal(typeof fabui.FabGrid.GroupRow, 'function');
  assert.equal(Object.getPrototypeOf(fabui.FabGrid.GroupRow.prototype), fabui.FabGrid.Row.prototype);
  assert.equal(fabui.grid, undefined);
});

test('FabUI publishes PivotGrid and its data model', function() {
  assert.equal(typeof fabui.pivot.PivotEngine, 'function');
  assert.equal(typeof fabui.pivot.PivotField, 'function');
  assert.equal(typeof fabui.pivot.PivotGrid, 'function');
  assert.equal(typeof fabui.pivot.PivotPanel, 'function');
  assert.equal(typeof fabui.pivot.PivotSlicer, 'function');
  assert.equal(Object.getPrototypeOf(fabui.pivot.PivotGrid.prototype), fabui.FabGrid.prototype);
  assert.equal(Object.getPrototypeOf(fabui.pivot.PivotPanel.prototype), fabui.Control.prototype);
  assert.equal(Object.getPrototypeOf(fabui.pivot.PivotSlicer.prototype), fabui.Control.prototype);
  assert.equal(fabui.pivot.PivotAggregate.Sum, 'Sum');
  assert.equal(fabui.pivot.PivotAggregate.WeightedAverage, 'WeightedAverage');
  assert.equal(fabui.pivot.PivotShowAs.RunningTotal, 'RunningTotal');
  assert.equal(fabui.pivot.PivotShowTotals.Subtotals, 'Subtotals');
  assert.equal(fabui.PivotEngine, undefined);
  assert.equal(fabui.PivotGrid, undefined);
});

test('PivotPanel moves fields between view areas through the shared engine', function() {
  var engine = new fabui.pivot.PivotEngine({
    itemsSource: [{ region: 'North', sales: 10, cost: 4 }],
    fields: [
      { binding: 'region', header: 'Region' },
      { binding: 'sales', header: 'Sales', dataType: 'number' },
      { binding: 'cost', header: 'Cost', dataType: 'number' }
    ],
    rowFields: ['region'],
    valueFields: ['sales', 'cost']
  });
  var panel = Object.create(fabui.pivot.PivotPanel.prototype);

  panel._engine = engine;
  panel.restrictDragging = false;
  panel.areaLists = {
    fields: {},
    filterFields: {},
    rowFields: {},
    columnFields: {},
    valueFields: {}
  };

  assert.equal(panel.moveField('region', 'columnFields', 0), true);
  assert.deepEqual(engine.rowFields.map(function(field) { return field.key; }), []);
  assert.deepEqual(engine.columnFields.map(function(field) { return field.key; }), ['Region']);
  assert.equal(panel.setSortDirection('region', 1), true);
  assert.equal(engine.getField('region').sortDirection, 1);
  assert.equal(panel.moveField('cost', 'valueFields', 0), true);
  assert.deepEqual(engine.valueFields.map(function(field) { return field.key; }), ['Cost', 'Sales']);
  assert.equal(panel.setAggregate('sales', 'Average'), true);
  assert.equal(engine.getField('sales').aggregate, 'Average');
  assert.equal(panel.setShowAs('sales', 'PercentOfGrandTotal'), true);
  assert.equal(engine.getField('sales').showAs, 'PercentOfGrandTotal');
  assert.equal(typeof panel.viewDefinition, 'string');
});

test('PivotPanel applies a multi-value filter draft only on confirmation', function() {
  var engine = new fabui.pivot.PivotEngine({
    itemsSource: [
      { region: 'North', sales: 10 },
      { region: 'South', sales: 20 }
    ],
    fields: [
      { binding: 'region', header: 'Region' },
      { binding: 'sales', header: 'Sales', dataType: 'number' }
    ],
    filterFields: ['Region'],
    rowFields: ['Region'],
    valueFields: ['Sales']
  });
  var panel = Object.create(fabui.pivot.PivotPanel.prototype);

  panel._engine = engine;
  panel._filterMenuFieldKey = 'Region';
  panel._filterMenuValues = ['North', 'South'];
  panel._filterDraftKeys = {
    'string:North': true,
    'string:South': false
  };
  panel.hideFilterMenu = function() {
    panel._filterMenuFieldKey = null;
  };

  assert.equal(engine.getField('Region').filter, null);
  assert.equal(panel.applyFilterMenu(), true);
  assert.deepEqual(engine.getField('Region').filter, { values: ['North'] });
  assert.equal(engine.pivotView.filteredCount, 1);
});

test('PivotPanel opens the sorting popup from row and column field items', function() {
  var engine = new fabui.pivot.PivotEngine({
    itemsSource: [{ region: 'North', platform: 'Web', sales: 10 }],
    fields: [
      { binding: 'region', header: 'Region' },
      { binding: 'platform', header: 'Platform' },
      { binding: 'sales', header: 'Sales', dataType: 'number' }
    ],
    rowFields: ['region'],
    columnFields: ['platform'],
    valueFields: ['sales']
  });
  var panel = Object.create(fabui.pivot.PivotPanel.prototype);
  var item = {
    nodeType: 1,
    parentElement: null,
    hasAttribute: function(name) {
      return name === 'data-field-key' || name === 'data-area-item';
    },
    getAttribute: function(name) {
      if (name === 'data-field-key') return 'Region';
      if (name === 'data-area-item') return 'rowFields';
      return null;
    }
  };
  var shownField = null;
  var prevented = false;
  var stopped = false;

  panel._engine = engine;
  panel.hostElement = {};
  panel.hideAggregateMenu = function() {};
  panel.hideSortMenu = function() {};
  panel.showSortMenu = function(field) { shownField = field; };
  panel._handleContextMenu({
    target: item,
    clientX: 20,
    clientY: 30,
    preventDefault: function() { prevented = true; },
    stopPropagation: function() { stopped = true; }
  });

  assert.equal(shownField, engine.getField('Region'));
  assert.equal(prevented, true);
  assert.equal(stopped, true);
});

test('PivotPanel closes the sorting popup with Escape', function() {
  var panel = Object.create(fabui.pivot.PivotPanel.prototype);
  var hidden = false;
  var prevented = false;
  var stopped = false;

  panel.isAggregateMenuOpen = function() { return false; };
  panel.isSortMenuOpen = function() { return true; };
  panel.hideAggregateMenu = function() {};
  panel.hideSortMenu = function() { hidden = true; };
  panel._handleKeyDown({
    key: 'Escape',
    preventDefault: function() { prevented = true; },
    stopPropagation: function() { stopped = true; }
  });

  assert.equal(hidden, true);
  assert.equal(prevented, true);
  assert.equal(stopped, true);
});

test('PivotPanel pointer outside closes each menu and pointer inside keeps its menu open', function() {
  var panel = Object.create(fabui.pivot.PivotPanel.prototype);
  var aggregateOpen = true;
  var sortOpen = true;
  var hidden = {
    aggregate: 0,
    sort: 0
  };
  var aggregateInside = {};
  var outside = {};

  panel.aggregateMenu = {
    contains: function(target) { return target === aggregateInside; }
  };
  panel.sortMenu = {
    contains: function() { return false; }
  };
  panel.isAggregateMenuOpen = function() { return aggregateOpen; };
  panel.isSortMenuOpen = function() { return sortOpen; };
  panel.hideAggregateMenu = function() {
    aggregateOpen = false;
    hidden.aggregate += 1;
  };
  panel.hideSortMenu = function() {
    sortOpen = false;
    hidden.sort += 1;
  };

  panel._handleDocumentPointerDown({ target: aggregateInside });
  assert.deepEqual(hidden, {
    aggregate: 0,
    sort: 1
  });

  panel._handleDocumentPointerDown({ target: outside });
  assert.deepEqual(hidden, {
    aggregate: 1,
    sort: 1
  });
});

test('PivotPanel binds the document pointer listener only while a menu is open', function() {
  var panel = Object.create(fabui.pivot.PivotPanel.prototype);
  var originalDocument = globalThis.document;
  var aggregateOpen = false;
  var sortOpen = false;
  var added = 0;
  var removed = 0;

  panel._managedEventListeners = [];
  panel._documentPointerDownBound = false;
  panel._documentPointerDownHandler = function() {};
  panel.isAggregateMenuOpen = function() { return aggregateOpen; };
  panel.isSortMenuOpen = function() { return sortOpen; };
  globalThis.document = {
    addEventListener: function() { added += 1; },
    removeEventListener: function() { removed += 1; }
  };

  try {
    panel._syncDocumentMenuPointerListener();
    assert.equal(added, 0);

    aggregateOpen = true;
    panel._syncDocumentMenuPointerListener();
    panel._syncDocumentMenuPointerListener();
    assert.equal(added, 1);

    aggregateOpen = false;
    sortOpen = true;
    panel._syncDocumentMenuPointerListener();
    assert.equal(removed, 0);

    sortOpen = false;
    panel._syncDocumentMenuPointerListener();
    assert.equal(removed, 1);
  } finally {
    panel.removeEventListener();
    globalThis.document = originalDocument;
  }
});

test('PivotPanel drag indicator reports the insertion index without counting the dragged field', function() {
  var panel = Object.create(fabui.pivot.PivotPanel.prototype);
  var originalDocument = globalThis.document;
  var insertedBefore = null;
  var appended = null;
  var removed = null;
  var items = [
    createItem('sales', 0),
    createItem('downloads', 30),
    createItem('revenue', 60)
  ];
  var list = {
    querySelectorAll: function() { return items; },
    insertBefore: function(node, anchor) {
      insertedBefore = anchor;
      node.parentNode = list;
    },
    appendChild: function(node) {
      appended = node;
      node.parentNode = list;
    },
    removeChild: function(node) {
      removed = node;
      node.parentNode = null;
    }
  };

  function createItem(key, top) {
    return {
      getAttribute: function(name) { return name === 'data-field-key' ? key : null; },
      getBoundingClientRect: function() { return { top: top, height: 30 }; }
    };
  }

  globalThis.document = {
    createElement: function() {
      return {
        className: '',
        parentNode: null,
        setAttribute: function() {}
      };
    }
  };
  panel._dragFieldKey = 'sales';
  panel._dragTargetArea = null;
  panel._dragTargetIndex = Infinity;
  panel._dropIndicator = null;

  try {
    assert.equal(panel._showDropIndicator(list, 'valueFields', 35), 0);
    assert.equal(insertedBefore, items[1]);
    panel._clearDropIndicator();
    assert.equal(removed !== null, true);
    assert.equal(panel._showDropIndicator(list, 'valueFields', 88), 2);
    assert.equal(appended, panel._dropIndicator);
  } finally {
    panel._clearDropIndicator();
    globalThis.document = originalDocument;
  }
});

test('PivotPanel binds document pointer handlers only during a touch drag', function() {
  var panel = Object.create(fabui.pivot.PivotPanel.prototype);
  var originalDocument = globalThis.document;
  var added = [];
  var removed = [];
  var item = {
    nodeType: 1,
    parentElement: null,
    hasAttribute: function(name) {
      return name === 'data-field-key' || name === 'data-area-item';
    },
    getAttribute: function(name) {
      if (name === 'data-field-key') return 'Region';
      if (name === 'data-area-item') return 'rowFields';
      return null;
    },
    closest: function() { return item; },
    classList: {
      add: function() {}
    }
  };

  panel.hostElement = {
    querySelectorAll: function() { return []; }
  };
  panel._touchPointerMoveHandler = function() {};
  panel._touchPointerUpHandler = function() {};
  panel._dropIndicator = null;
  panel._dragTargetArea = null;
  panel._dragTargetIndex = Infinity;
  globalThis.document = {
    addEventListener: function(type) { added.push(type); },
    removeEventListener: function(type) { removed.push(type); }
  };

  try {
    panel._handleTouchPointerDown({
      pointerType: 'touch',
      pointerId: 8,
      target: item,
      preventDefault: function() {}
    });
    assert.deepEqual(added, ['pointermove', 'pointerup', 'pointercancel']);
    assert.equal(panel._touchDragState.pointerId, 8);

    panel._handleTouchPointerUp({
      type: 'pointercancel',
      pointerId: 8
    });
    assert.deepEqual(removed, ['pointermove', 'pointerup', 'pointercancel']);
    assert.equal(panel._touchDragState, null);
  } finally {
    globalThis.document = originalDocument;
  }
});

test('PivotGrid closes its context menu with Escape', function() {
  var grid = Object.create(fabui.pivot.PivotGrid.prototype);
  var hidden = false;
  var prevented = false;
  var stopped = false;

  grid.isDetailOpen = function() { return false; };
  grid.isTopLeftMenuOpen = function() { return true; };
  grid.hideTopLeftMenu = function() { hidden = true; };
  grid.handleKeyDown({
    key: 'Escape',
    preventDefault: function() { prevented = true; },
    stopPropagation: function() { stopped = true; }
  });

  assert.equal(hidden, true);
  assert.equal(prevented, true);
  assert.equal(stopped, true);
});

test('PivotGrid closes its context menu on outside pointer but keeps inside pointer', function() {
  var grid = Object.create(fabui.pivot.PivotGrid.prototype);
  var hidden = 0;
  var root = {
    nodeType: 1,
    classList: { contains: function() { return false; } },
    parentElement: null,
    parentNode: null
  };
  var menu = {
    nodeType: 1,
    className: 'fg-top-left-menu',
    classList: {
      contains: function(name) { return name === 'fg-top-left-menu'; }
    },
    parentElement: root,
    parentNode: root
  };
  var inside = {
    nodeType: 1,
    classList: { contains: function() { return false; } },
    parentElement: menu,
    parentNode: menu
  };
  var outside = {
    nodeType: 1,
    classList: { contains: function() { return false; } },
    parentElement: null,
    parentNode: null
  };

  grid.root = root;
  grid.isTopLeftMenuOpen = function() { return true; };
  grid.hideTopLeftMenu = function() { hidden += 1; };
  grid.isFilterMenuOpen = function() { return false; };
  grid.isColumnChooserOpen = function() { return false; };
  grid.getFilterMenuItemAtEvent = function() { return null; };

  grid.handleFilterMenuClick({ target: inside });
  assert.equal(hidden, 0);

  grid.handleFilterMenuClick({ target: outside });
  assert.equal(hidden, 1);
});

test('PivotGrid routes its header fullscreen menu action through FabGrid', function() {
  var grid = Object.create(fabui.pivot.PivotGrid.prototype);
  var fullscreenCalls = 0;
  var hidden = false;
  var prevented = false;
  var stopped = false;
  var item = {
    nodeType: 1,
    classList: {
      contains: function(name) { return name === 'fg-top-left-menu-item'; }
    },
    getAttribute: function(name) {
      return name === 'data-action' ? 'pivot-fullscreen' : null;
    }
  };

  grid.topLeftMenu = {};
  grid._pivotContext = { cellType: fabui.CellType.ColumnHeader, column: null };
  grid.hideTopLeftMenu = function() { hidden = true; };
  grid.toggleFullscreen = function() { fullscreenCalls += 1; };
  grid.handleTopLeftMenuClick({
    target: item,
    preventDefault: function() { prevented = true; },
    stopPropagation: function() { stopped = true; }
  });

  assert.equal(fullscreenCalls, 1);
  assert.equal(hidden, true);
  assert.equal(prevented, true);
  assert.equal(stopped, true);
});

test('PivotGrid row field context menu swaps one expand and collapse all action', function() {
  var originalDocument = globalThis.document;
  var grid = Object.create(fabui.pivot.PivotGrid.prototype);
  var appended = null;

  function createNode() {
    return {
      children: [],
      attributes: {},
      appendChild: function(child) {
        this.children.push(child);
        return child;
      },
      setAttribute: function(name, value) {
        this.attributes[name] = String(value);
      }
    };
  }

  globalThis.document = {
    createDocumentFragment: createNode,
    createElement: createNode
  };
  grid._pivotContext = {
    cellType: fabui.CellType.Cell,
    row: 0,
    column: {
      _pivotRowField: { key: 'quarter', header: 'Quarter' }
    }
  };
  grid.view = [{ __pivotMeta: { key: 'q1', isSubtotal: true } }];
  grid._pivotRowEntriesByKey = {
    q1: { isSubtotal: true }
  };
  grid._pivotColumnEntriesByKey = {
    web: { isSubtotal: true }
  };
  grid._pivotRowCollapsed = {};
  grid._pivotColumnCollapsed = {};
  grid.topLeftMenu = {
    innerHTML: '',
    appendChild: function(fragment) {
      appended = fragment.children;
    }
  };
  grid.getText = function(path) { return path; };

  try {
    grid.renderTopLeftMenu();
    assert.deepEqual(appended.slice(0, 2).map(function(item) {
      return item.attributes['data-action'];
    }), [
      'pivot-collapse-all',
      'pivot-sort'
    ]);
    grid._pivotRowCollapsed.q1 = true;
    grid.renderTopLeftMenu();
    assert.deepEqual(appended.slice(0, 2).map(function(item) {
      return item.attributes['data-action'];
    }), [
      'pivot-collapse-all',
      'pivot-sort'
    ]);
    grid._pivotColumnCollapsed.web = true;
    grid.renderTopLeftMenu();
    assert.deepEqual(appended.slice(0, 2).map(function(item) {
      return item.attributes['data-action'];
    }), [
      'pivot-expand-all',
      'pivot-sort'
    ]);
  } finally {
    globalThis.document = originalDocument;
  }
});

test('PivotGrid row field context menu routes expand and collapse all actions', function() {
  var grid = Object.create(fabui.pivot.PivotGrid.prototype);
  var action = 'pivot-expand-all';
  var expanded = 0;
  var collapsed = 0;
  var item = {
    nodeType: 1,
    classList: {
      contains: function(name) { return name === 'fg-top-left-menu-item'; }
    },
    getAttribute: function(name) {
      return name === 'data-action' ? action : null;
    }
  };

  grid.topLeftMenu = {};
  grid._pivotContext = {
    cellType: fabui.CellType.Cell,
    row: 0,
    column: { _pivotRowField: { key: 'quarter' } }
  };
  grid.view = [{ __pivotMeta: { key: 'q1' } }];
  grid.hideTopLeftMenu = function() {};
  grid.expandAll = function() { expanded += 1; };
  grid.collapseAll = function() { collapsed += 1; };

  grid.handleTopLeftMenuClick({
    target: item,
    preventDefault: function() {},
    stopPropagation: function() {}
  });
  action = 'pivot-collapse-all';
  grid.handleTopLeftMenuClick({
    target: item,
    preventDefault: function() {},
    stopPropagation: function() {}
  });

  assert.equal(expanded, 1);
  assert.equal(collapsed, 1);
});

test('PivotGrid mirrors filter fields above row field headers and applies their selected value', function() {
  var engine = new fabui.pivot.PivotEngine({
    itemsSource: [
      { quarter: 'Q1', region: 'North', platform: 'Web', sales: 10 },
      { quarter: 'Q1', region: 'South', platform: 'Web', sales: 20 }
    ],
    fields: [
      { binding: 'quarter', header: 'Quarter' },
      { binding: 'region', header: 'Region' },
      { binding: 'platform', header: 'Platform' },
      { binding: 'sales', header: 'Sales', dataType: 'number' }
    ],
    rowFields: ['quarter'],
    columnFields: ['platform'],
    valueFields: ['sales'],
    filterFields: ['region']
  });
  var grid = Object.create(fabui.pivot.PivotGrid.prototype);

  grid._pivotEngine = engine;
  grid._pivotView = engine.pivotView;
  grid._pivotDataHeaderLevelCount = grid._getPivotDataHeaderLevelCount();
  assert.deepEqual(engine.pivotView.filterFields.map(function(field) { return field.key; }), ['Region']);
  assert.equal(grid._getPivotHeaderLevelCount(), 2);

  grid._handlePivotFilterFieldChange({
    target: {
      classList: { contains: function(name) { return name === 'fg-pivot-filter-field-select'; } },
      getAttribute: function(name) { return name === 'data-pivot-field' ? 'region' : null; },
      selectedOptions: [{ _pivotFilterValue: 'North' }]
    }
  });

  assert.deepEqual(engine.getField('region').filter, { values: ['North'] });
  assert.equal(engine.pivotView.filteredCount, 1);
});

test('PivotGrid row field headers reuse the FabGrid sort indicators', function() {
  var originalDocument = globalThis.document;
  var grid = Object.create(fabui.pivot.PivotGrid.prototype);

  function createElement(tagName) {
    return {
      tagName: tagName,
      className: '',
      style: {},
      children: [],
      attributes: {},
      appendChild: function(child) {
        this.children.push(child);
        return child;
      },
      setAttribute: function(name, value) {
        this.attributes[name] = String(value);
      }
    };
  }

  grid.options = { allowResizing: false };
  grid._pivotColumnCollapsed = {};
  grid.createFormatItemEventArgs = null;
  globalThis.document = { createElement: createElement };

  try {
    [
      { direction: 0, wrapClassName: 'fg-sort-wrap fg-sort-wrap-none', className: 'fg-sort fg-sort-none' },
      { direction: 1, className: 'fg-sort fg-sort-asc' },
      { direction: -1, className: 'fg-sort fg-sort-desc' }
    ].forEach(function(expectation) {
      var cell = grid._createPivotHeaderCell({
        label: 'Quarter',
        left: 0,
        top: 0,
        width: 120,
        height: 30,
        col: 0,
        className: 'fg-pivot-row-field-header',
        field: { key: 'quarter', header: 'Quarter' },
        sortable: true,
        sortDirection: expectation.direction
      });
      var title = cell.children[0];
      var sortWrap = title.children[1];

      assert.equal(sortWrap.className, expectation.wrapClassName || 'fg-sort-wrap');
      assert.equal(sortWrap.children[0].className, 'fg-sort-order');
      assert.equal(sortWrap.children[1].className, expectation.className);
      assert.equal(sortWrap.children[1].attributes['aria-hidden'], 'true');
    });
  } finally {
    globalThis.document = originalDocument;
  }
});

test('PivotGrid row field sorting cycles default, ascending, descending, and default', function() {
  var field = { key: 'quarter', sortDirection: 0 };
  var refreshCount = 0;
  var changedCount = 0;
  var grid = Object.create(fabui.pivot.PivotGrid.prototype);

  grid._pivotEngine = {
    getField: function(reference) {
      return reference === field.key ? field : null;
    },
    refresh: function() {
      refreshCount += 1;
    },
    emit: function(name, args) {
      if (name === 'viewDefinitionChanged' &&
          args.property === 'sortDirection' &&
          args.field === field) {
        changedCount += 1;
      }
    }
  };

  assert.equal(grid.togglePivotFieldSort(field.key), true);
  assert.equal(field.sortDirection, 1);
  assert.equal(grid.togglePivotFieldSort(field.key), true);
  assert.equal(field.sortDirection, -1);
  assert.equal(grid.togglePivotFieldSort(field.key), true);
  assert.equal(field.sortDirection, 0);
  assert.equal(refreshCount, 3);
  assert.equal(changedCount, 3);
});

test('PivotGrid merges repeated row field values into collapsible group spans', function() {
  var engine = new fabui.pivot.PivotEngine({
    itemsSource: [
      { quarter: 'Q1', agent: 'Amy', sales: 10 },
      { quarter: 'Q1', agent: 'Ben', sales: 20 },
      { quarter: 'Q2', agent: 'Cindy', sales: 30 }
    ],
    fields: [
      { binding: 'quarter', header: 'Quarter' },
      { binding: 'agent', header: 'Agent' },
      { binding: 'sales', header: 'Sales', dataType: 'number' }
    ],
    rowFields: ['quarter', 'agent'],
    valueFields: ['sales'],
    showRowTotals: fabui.pivot.PivotShowTotals.Subtotals
  });
  var grid = Object.create(fabui.pivot.PivotGrid.prototype);
  var groups = grid._buildPivotRowGroups(engine.pivotView.rows, 2);
  var q1Group = groups[0][0];
  var q2Group = groups[0][3];

  assert.equal(q1Group.start, 0);
  assert.equal(q1Group.end, 2);
  assert.equal(groups[0][1], q1Group);
  assert.equal(groups[0][2], q1Group);
  assert.equal(q1Group.toggleKey, engine.pivotView.rowEntries[2].key);
  assert.equal(q2Group.start, 3);
  assert.equal(q2Group.end, 4);
  assert.equal(q2Group.toggleKey, engine.pivotView.rowEntries[4].key);
  assert.equal(groups[1][0].start, 0);
  assert.equal(groups[1][0].end, 0);
  assert.equal(groups[1][2], undefined);
});

test('PivotGrid keeps subtotal toggles out of the cell range pointer flow', function() {
  var grid = Object.create(fabui.pivot.PivotGrid.prototype);
  var root = {
    nodeType: 1,
    classList: { contains: function() { return false; } },
    parentElement: null
  };
  var toggle = {
    nodeType: 1,
    classList: {
      contains: function(name) { return name === 'fg-pivot-row-toggle'; }
    },
    parentElement: root
  };

  grid.root = root;
  assert.doesNotThrow(function() {
    grid.handlePointerDown({ target: toggle, button: 0 });
  });
});

test('PivotGrid exports collapsed child rows and columns and keeps them hidden', function() {
  var engine = new fabui.pivot.PivotEngine({
    itemsSource: [
      { region: 'North', salesperson: 'Amy', platform: 'Mobile', product: 'A', sales: 10 },
      { region: 'North', salesperson: 'Ben', platform: 'Mobile', product: 'B', sales: 20 },
      { region: 'North', salesperson: 'Amy', platform: 'Web', product: 'A', sales: 30 }
    ],
    fields: [
      { binding: 'region', header: 'Region' },
      { binding: 'salesperson', header: 'Salesperson' },
      { binding: 'platform', header: 'Platform' },
      { binding: 'product', header: 'Product' },
      { binding: 'sales', header: 'Sales', dataType: 'number', aggregate: 'Sum' }
    ],
    rowFields: ['region', 'salesperson'],
    columnFields: ['platform', 'product'],
    valueFields: ['sales'],
    showRowTotals: fabui.pivot.PivotShowTotals.Subtotals,
    showColumnTotals: fabui.pivot.PivotShowTotals.Subtotals
  });
  var view = engine.pivotView;
  var subtotal = view.columnEntries.find(function(entry) {
    return entry.isSubtotal && entry.path.length === 1;
  });
  var rowSubtotal = view.rowEntries.find(function(entry) {
    return entry.isSubtotal && entry.path.length === 1;
  });
  var grid = Object.create(fabui.pivot.PivotGrid.prototype);
  var columns;
  var rows;
  var hiddenColumns;
  var hiddenRows;
  var files;
  var sheetXml;
  var hiddenColumnCount;
  var hiddenRowCount;
  var hiddenRowXml;

  grid._pivotEngine = engine;
  grid._pivotView = view;
  grid._pivotRowCollapsed = Object.create(null);
  grid._pivotRowEntriesByKey = Object.create(null);
  grid._pivotColumnCollapsed = Object.create(null);
  grid._pivotColumnEntriesByKey = Object.create(null);
  grid.options = { showRowFieldHeaders: true };
  view.rowEntries.forEach(function(entry) {
    grid._pivotRowEntriesByKey[entry.key] = entry;
  });
  view.columnEntries.forEach(function(entry) {
    grid._pivotColumnEntriesByKey[entry.key] = entry;
  });
  assert.ok(subtotal);
  assert.ok(rowSubtotal);
  grid._pivotRowCollapsed[rowSubtotal.key] = true;
  grid._pivotColumnCollapsed[subtotal.key] = true;

  columns = grid._createPivotColumns(view);
  rows = grid._getExcelExportRows();
  hiddenColumns = columns.filter(function(column) { return column.visible === false; });
  hiddenRows = rows.filter(function(row) { return grid._isExcelExportRowHidden(row); });
  files = createXlsxFiles(columns, rows, {
    isRowHidden: function(row, rowIndex) {
      return grid._isExcelExportRowHidden(row, rowIndex);
    }
  });
  sheetXml = files.find(function(file) { return file.name === 'xl/worksheets/sheet1.xml'; }).content;
  hiddenColumnCount = (sheetXml.match(/<col [^>]* hidden="1"/g) || []).length;
  hiddenRowCount = (sheetXml.match(/<row [^>]* hidden="1"/g) || []).length;
  hiddenRowXml = (sheetXml.match(/<row [^>]* hidden="1"[^>]*>.*?<\/row>/g) || []).join('');

  assert.equal(columns.length, view.rowFields.length + view.dataColumns.length);
  assert.equal(rows.length, view.rows.length);
  assert.ok(hiddenColumns.length > 0);
  assert.ok(hiddenRows.length > 0);
  assert.equal(hiddenColumnCount, hiddenColumns.length);
  assert.equal(hiddenRowCount, hiddenRows.length);
  assert.match(hiddenRowXml, /Amy|Ben/);
  assert.match(hiddenRowXml, /<v>\d+<\/v>/);
  assert.match(sheetXml, new RegExp('<dimension ref="A1:' + getExcelColumnName(columns.length)));
  assert.equal(grid._isExcelExportRowHidden(view.rows[view.rowEntries.indexOf(rowSubtotal)]), false);
  assert.equal(columns.filter(function(column) {
    return column._pivotDataColumn && column._pivotDataColumn.entry.key === subtotal.key;
  }).every(function(column) { return column.visible !== false; }), true);
});
