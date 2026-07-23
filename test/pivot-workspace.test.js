import test from 'node:test';
import assert from 'node:assert/strict';
import fabui from '../src/fabui.js';
import {
  calculatePivotWorkspacePaneSize,
  fitPivotWorkspacePaneSizes,
  normalizePivotWorkspaceOptions,
  normalizePivotWorkspaceTheme,
  resolvePivotWorkspaceChartSize,
  resolvePivotWorkspaceLayout
} from '../src/pivot/pivot-workspace.js?v=20260717-pivot-workspace-test-v5';

test('FabUI publishes PivotWorkspace only through the pivot namespace', function() {
  assert.equal(typeof fabui.pivot.PivotWorkspace, 'function');
  assert.equal(Object.getPrototypeOf(fabui.pivot.PivotWorkspace.prototype), fabui.Control.prototype);
  assert.equal(fabui.PivotWorkspace, undefined);
});

test('PivotWorkspace defaults to an adaptive three-pane layout', function() {
  var options = normalizePivotWorkspaceOptions();

  assert.equal(options.layout, 'Auto');
  assert.equal(options.showPanel, true);
  assert.equal(options.showChart, true);
  assert.equal(options.showControls, true);
  assert.equal(options.panelSize, 300);
  assert.equal(options.chartSize, '40%');
  assert.equal(options.compactBreakpoint, 1050);
  assert.equal(options.theme, 'inherit');
  assert.equal(fabui.pivot.PivotWorkspace.themes.length, 19);
  assert.equal(typeof fabui.pivot.PivotWorkspace.prototype.setTheme, 'function');
  assert.equal(normalizePivotWorkspaceTheme('dark-hive'), 'dark-hive');
  assert.equal(normalizePivotWorkspaceTheme('pepper'), 'pepper-grinder');
});

test('PivotWorkspace resolves fixed, percentage, and fractional chart widths', function() {
  var constraints = {
    totalSize: 1200,
    splitterSize: 7,
    panelSize: 300,
    panelVisible: true,
    chartVisible: true
  };

  assert.equal(resolvePivotWorkspaceChartSize(350, constraints), 350);
  assert.equal(resolvePivotWorkspaceChartSize('40%', constraints), 354);
  assert.equal(resolvePivotWorkspaceChartSize('1fr', constraints), 443);
  assert.equal(resolvePivotWorkspaceChartSize('2fr', constraints), 591);
  constraints.panelVisible = false;
  assert.equal(resolvePivotWorkspaceChartSize('40%', constraints), 477);
});

test('PivotWorkspace keeps a percentage chart definition until it is changed', function() {
  var workspace = Object.create(fabui.pivot.PivotWorkspace.prototype);
  var resizeCalls = 0;

  workspace._layout = 'Horizontal';
  workspace._horizontalSizes = { panel: 300, chart: 350 };
  workspace._verticalSizes = { panel: 190, chart: 190 };
  workspace._horizontalChartSize = '40%';
  workspace.options = { chartSize: '40%' };
  workspace.resize = function() {
    resizeCalls += 1;
    return workspace;
  };

  workspace.setPaneSizes(null, '35%');
  assert.equal(workspace._horizontalChartSize, '35%');
  assert.equal(workspace.options.chartSize, '35%');
  assert.equal(resizeCalls, 1);

  workspace.setPaneSizes(null, 420);
  assert.equal(workspace._horizontalChartSize, 420);
  assert.equal(workspace.options.chartSize, 420);
  assert.equal(workspace._horizontalSizes.chart, 420);

  workspace.setPaneSizes(null, '1fr');
  assert.equal(workspace._horizontalChartSize, '1fr');
  assert.equal(workspace.options.chartSize, '1fr');
});

test('PivotWorkspace chart type API normalizes the type and synchronizes the control', function() {
  var workspace = Object.create(fabui.pivot.PivotWorkspace.prototype);
  var selected = null;

  workspace.chart = {
    setType: function(type) {
      selected = type;
    }
  };
  workspace.chartTypeSelect = { value: '' };

  workspace.setChartType('pie');
  assert.equal(selected, 'Pie');
  assert.equal(workspace.chartTypeSelect.value, 'Pie');

  workspace.chartType = 'unsupported';
  assert.equal(selected, 'Column');
  assert.equal(workspace.chartTypeSelect.value, 'Column');
});

test('PivotWorkspace toggles fullscreen for the complete Grid and Chart panes', function() {
  var workspace = Object.create(fabui.pivot.PivotWorkspace.prototype);
  var originalDocument = globalThis.document;
  var fullscreenElement = null;
  var requested = [];
  var exited = 0;

  workspace.gridPane = {
    pane: {
      requestFullscreen: function() {
        requested.push('grid');
        fullscreenElement = workspace.gridPane.pane;
        return true;
      }
    }
  };
  workspace.chartPane = {
    pane: {
      requestFullscreen: function() {
        requested.push('chart');
        fullscreenElement = workspace.chartPane.pane;
        return true;
      }
    }
  };
  globalThis.document = {
    get fullscreenElement() {
      return fullscreenElement;
    },
    exitFullscreen: function() {
      exited += 1;
      fullscreenElement = null;
      return true;
    }
  };

  try {
    assert.equal(workspace.isPaneFullscreenAvailable('grid'), true);
    assert.equal(workspace.togglePaneFullscreen('grid'), true);
    assert.deepEqual(requested, ['grid']);
    assert.equal(workspace.isPaneFullscreen('grid'), true);
    assert.equal(workspace.togglePaneFullscreen('grid'), true);
    assert.equal(exited, 1);
    assert.equal(workspace.togglePaneFullscreen('chart'), true);
    assert.deepEqual(requested, ['grid', 'chart']);
    assert.equal(workspace.isPaneFullscreen('chart'), true);
  } finally {
    globalThis.document = originalDocument;
  }
});

test('PivotWorkspace falls back to CSS fullscreen and closes it with Escape', function() {
  var workspace = Object.create(fabui.pivot.PivotWorkspace.prototype);
  var originalDocument = globalThis.document;
  var classes = [];
  var prevented = 0;
  var stopped = 0;
  var pane = {
    classList: {
      add: function(name) {
        if (classes.indexOf(name) < 0) {
          classes.push(name);
        }
      },
      remove: function(name) {
        classes = classes.filter(function(item) { return item !== name; });
      }
    }
  };

  workspace.gridPane = { pane: pane };
  workspace.chartPane = { pane: { classList: pane.classList } };
  workspace._fallbackFullscreenPane = null;
  workspace._syncFullscreenControls = function() {};
  workspace._scheduleResize = function() {};
  globalThis.document = {
    fullscreenElement: null,
    webkitFullscreenElement: null
  };

  try {
    assert.equal(workspace.togglePaneFullscreen('grid'), true);
    assert.equal(workspace.isPaneFullscreen('grid'), true);
    assert.equal(classes.indexOf('fg-pivot-workspace-pane-fullscreen') >= 0, true);
    workspace._handleFullscreenKeyDown({
      key: 'Escape',
      preventDefault: function() { prevented += 1; },
      stopPropagation: function() { stopped += 1; }
    });
    assert.equal(workspace.isPaneFullscreen('grid'), false);
    assert.equal(classes.indexOf('fg-pivot-workspace-pane-fullscreen'), -1);
    assert.equal(prevented, 1);
    assert.equal(stopped, 1);
  } finally {
    globalThis.document = originalDocument;
  }
});

test('PivotWorkspace resolves automatic and explicit layouts', function() {
  assert.equal(resolvePivotWorkspaceLayout('Auto', 1200, 1050), 'Horizontal');
  assert.equal(resolvePivotWorkspaceLayout('Auto', 900, 1050), 'Vertical');
  assert.equal(resolvePivotWorkspaceLayout('Horizontal', 600, 1050), 'Horizontal');
  assert.equal(resolvePivotWorkspaceLayout('Vertical', 1600, 1050), 'Vertical');
});

test('PivotWorkspace fits optional panes while preserving Grid space', function() {
  var fitted = fitPivotWorkspacePaneSizes({
    panel: 300,
    chart: 350
  }, {
    totalSize: 800,
    splitterSize: 7,
    minPanelSize: 220,
    minGridSize: 320,
    minChartSize: 240,
    panelVisible: true,
    chartVisible: true
  });

  assert.deepEqual(fitted, {
    panel: 226,
    chart: 240
  });
  assert.deepEqual(fitPivotWorkspacePaneSizes({
    panel: 300,
    chart: 350
  }, {
    totalSize: 900,
    splitterSize: 7,
    minPanelSize: 220,
    minGridSize: 320,
    minChartSize: 240,
    panelVisible: false,
    chartVisible: true
  }), {
    panel: 0,
    chart: 350
  });
});

test('PivotWorkspace splitter calculations resize from the correct edge', function() {
  var constraints = {
    totalSize: 1200,
    splitterSize: 7,
    minPanelSize: 220,
    minGridSize: 320,
    minChartSize: 240,
    panelSize: 300,
    chartSize: 350,
    panelVisible: true,
    chartVisible: true
  };

  assert.equal(calculatePivotWorkspacePaneSize('panel', 300, 100, constraints), 400);
  assert.equal(calculatePivotWorkspacePaneSize('chart', 350, 100, constraints), 250);
  assert.equal(calculatePivotWorkspacePaneSize('panel', 300, -500, constraints), 220);
  assert.equal(calculatePivotWorkspacePaneSize('chart', 350, -500, constraints), 566);
});

test('PivotWorkspace binds document pointer handlers only during splitter drag', function() {
  var workspace = Object.create(fabui.pivot.PivotWorkspace.prototype);
  var originalDocument = globalThis.document;
  var added = [];
  var removed = [];
  var classes = [];

  workspace._layout = 'Horizontal';
  workspace._panelVisible = true;
  workspace._chartVisible = true;
  workspace._horizontalSizes = { panel: 300, chart: 350 };
  workspace._verticalSizes = { panel: 190, chart: 190 };
  workspace._documentPointerMoveHandler = function() {};
  workspace._documentPointerUpHandler = function() {};
  workspace.options = {};
  workspace.hostElement = {
    classList: {
      add: function(name) { classes.push(name); },
      remove: function(name) {
        classes = classes.filter(function(item) { return item !== name; });
      }
    }
  };
  globalThis.document = {
    addEventListener: function(type, handler) {
      added.push({ type: type, handler: handler });
    },
    removeEventListener: function(type, handler) {
      removed.push({ type: type, handler: handler });
    }
  };

  try {
    workspace._handleSplitterPointerDown({
      button: 0,
      pointerId: 7,
      clientX: 300,
      clientY: 100,
      currentTarget: {
        getAttribute: function() { return 'panel'; }
      },
      preventDefault: function() {}
    });
    assert.deepEqual(added.map(function(item) { return item.type; }), [
      'pointermove',
      'pointerup',
      'pointercancel'
    ]);
    assert.equal(classes.indexOf('fg-pivot-workspace-resizing') >= 0, true);

    workspace._handleDocumentPointerUp({ pointerId: 7 });
    assert.deepEqual(removed.map(function(item) { return item.type; }), [
      'pointermove',
      'pointerup',
      'pointercancel'
    ]);
    assert.equal(workspace._dragState, null);
    assert.equal(classes.indexOf('fg-pivot-workspace-resizing'), -1);
  } finally {
    globalThis.document = originalDocument;
  }
});

test('PivotWorkspace pointer cancel restores the pane size without committing', function() {
  var workspace = Object.create(fabui.pivot.PivotWorkspace.prototype);
  var applied = 0;
  var scheduled = 0;
  var notified = null;

  workspace._layout = 'Horizontal';
  workspace._horizontalSizes = { panel: 460, chart: 350 };
  workspace._dragState = {
    kind: 'panel',
    pointerId: 9,
    startSize: 300,
    layout: 'Horizontal'
  };
  workspace.options = {};
  workspace._applyPaneSizes = function() {
    applied += 1;
  };
  workspace._scheduleResize = function() {
    scheduled += 1;
  };
  workspace._endSplitterDrag = function(notify) {
    notified = notify;
    this._dragState = null;
  };

  workspace._handleDocumentPointerUp({
    type: 'pointercancel',
    pointerId: 9
  });

  assert.equal(workspace._horizontalSizes.panel, 300);
  assert.equal(applied, 1);
  assert.equal(scheduled, 1);
  assert.equal(notified, false);
  assert.equal(workspace._dragState, null);
});

test('PivotWorkspace mirrors async progress and cancellation state', function() {
  var workspace = Object.create(fabui.pivot.PivotWorkspace.prototype);
  var classes = [];
  var cancelled = 0;

  workspace.hostElement = {
    classList: {
      add: function(name) {
        if (classes.indexOf(name) < 0) classes.push(name);
      },
      remove: function() {
        var names = Array.prototype.slice.call(arguments);
        classes = classes.filter(function(name) { return names.indexOf(name) < 0; });
      }
    }
  };
  workspace.progressElement = { textContent: '' };
  workspace.cancelRefreshButton = { style: { display: 'none' } };
  workspace._engine = {
    cancelRefresh: function() {
      cancelled += 1;
      return true;
    }
  };
  workspace.getText = function(path) {
    return {
      'pivot.workspace.progress': 'Aggregating {progress}%',
      'pivot.workspace.cancelled': 'Cancelled'
    }[path] || path;
  };

  workspace._handleEngineUpdating(null, { async: true });
  assert.equal(classes.indexOf('fg-pivot-workspace-updating') >= 0, true);
  assert.equal(workspace.cancelRefreshButton.style.display, '');
  workspace._handleEngineProgress(null, { progress: 0.42 });
  assert.equal(workspace.progressElement.textContent, 'Aggregating 42%');
  assert.equal(workspace.cancelRefresh(), true);
  assert.equal(cancelled, 1);
  assert.equal(workspace.progressElement.textContent, 'Cancelled');
  assert.equal(workspace.cancelRefreshButton.style.display, 'none');
});
