import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import fabui from '../src/fabui.js';
import {
  calculateDiagramAnchoredScroll,
  calculateDiagramConnectorPath,
  calculateDiagramGroupBounds,
  calculateDiagramGroupResize,
  calculateDiagramMoveAlignment,
  calculateDiagramNodeResize,
  calculateDiagramPageZoom,
  calculateDiagramViewportOffset,
  constrainDiagramFloatingToolbox,
  constrainDiagramViewToolbar,
  createDiagramFactory,
  diagramEventTargetsInteractiveControl,
  diagramFullscreenSizeChanged,
  diagramNodeHyperlinkMatchesTrigger,
  diagramPropertiesShouldDock,
  diagramToolboxShouldDock,
  diagramViewportCanPan,
  findBestDiagramConnectionPoints,
  findDiagramNodesInRect,
  getDiagramConnectionPoint,
  getDiagramPanelDockSide,
  getDiagramShapeBoundaryPoint,
  normalizeDiagramDockSide,
  normalizeDiagramData,
  normalizeDiagramHyperlink,
  normalizeDiagramHyperlinkTrigger,
  normalizeDiagramLocale,
  normalizeDiagramSameSideDockMode,
  normalizeDiagramTheme,
  normalizeDiagramToolboxOrder,
  reorderDiagramToolboxOrder
} from '../src/diagram/diagram.js';

test('FabUI core publishes Diagram as a Control', function() {
  assert.equal(typeof fabui.Diagram, 'function');
  assert.equal(Object.getPrototypeOf(fabui.Diagram.prototype), fabui.Control.prototype);
});

test('Diagram preserves native keys inside property editors and controls', function() {
  var host = {
    tagName: 'DIV',
    parentElement: null
  };
  var removed = 0;
  var undone = 0;
  var prevented = 0;
  var diagram = {
    hostElement: host,
    options: {
      disabled: false,
      readOnly: false
    },
    removeSelected: function() {
      removed += 1;
    },
    undo: function() {
      undone += 1;
    }
  };

  function createTarget(tagName, parentElement, attributes) {
    return {
      tagName: tagName,
      parentElement: parentElement,
      isContentEditable: false,
      getAttribute: function(name) {
        return attributes && attributes[name] != null ?
          attributes[name] :
          null;
      }
    };
  }

  ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].forEach(function(tagName) {
    var target = createTarget(tagName, host);
    assert.equal(
      diagramEventTargetsInteractiveControl({ target: target }, host),
      true
    );
    fabui.Diagram.prototype._handleKeyDown.call(diagram, {
      target: target,
      key: 'Backspace',
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
      preventDefault: function() {
        prevented += 1;
      }
    });
  });

  fabui.Diagram.prototype._handleKeyDown.call(diagram, {
    target: createTarget('INPUT', host),
    key: 'z',
    shiftKey: false,
    ctrlKey: true,
    metaKey: false,
    preventDefault: function() {
      prevented += 1;
    }
  });

  assert.equal(
    diagramEventTargetsInteractiveControl({
      target: createTarget('SPAN', host, { role: 'textbox' })
    }, host),
    true
  );
  assert.equal(removed, 0);
  assert.equal(undone, 0);
  assert.equal(prevented, 0);

  fabui.Diagram.prototype._handleKeyDown.call(diagram, {
    target: host,
    key: 'Delete',
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    preventDefault: function() {
      prevented += 1;
    }
  });
  assert.equal(removed, 1);
  assert.equal(prevented, 1);

  diagram.options.readOnly = true;
  fabui.Diagram.prototype._handleKeyDown.call(diagram, {
    target: host,
    key: 'z',
    shiftKey: false,
    ctrlKey: true,
    metaKey: false,
    preventDefault: function() {
      prevented += 1;
    }
  });
  assert.equal(undone, 0);
  assert.equal(prevented, 1);
});

test('Diagram exposes the documented overview defaults', function() {
  assert.equal(fabui.Diagram.defaults.showGrid, true);
  assert.equal(fabui.Diagram.defaults.snapToGrid, true);
  assert.equal(fabui.Diagram.defaults.gridSize, 20);
  assert.equal(fabui.Diagram.defaults.toolbox, true);
  assert.equal(fabui.Diagram.defaults.toolboxWidth, 260);
  assert.equal(fabui.Diagram.defaults.toolboxMinWidth, 140);
  assert.equal(fabui.Diagram.defaults.toolboxMaxWidth, 420);
  assert.equal(fabui.Diagram.defaults.toolboxHeight, 520);
  assert.equal(fabui.Diagram.defaults.toolboxMinHeight, 180);
  assert.equal(fabui.Diagram.defaults.toolboxMaxHeight, 720);
  assert.equal(fabui.Diagram.defaults.toolboxFloating, false);
  assert.equal(fabui.Diagram.defaults.toolboxFloatLeft, 12);
  assert.equal(fabui.Diagram.defaults.toolboxFloatTop, 12);
  assert.equal(fabui.Diagram.defaults.toolboxDockSide, 'left');
  assert.deepEqual(fabui.Diagram.defaults.toolboxCollapsed, {
    general: false,
    flowchart: true,
    dfd: true,
    orgChart: true
  });
  assert.deepEqual(fabui.Diagram.defaults.toolboxOrder, [
    'general',
    'flowchart',
    'dfd',
    'orgChart'
  ]);
  assert.equal(fabui.Diagram.defaults.toolboxStateKey, '');
  assert.equal(fabui.Diagram.defaults.propertiesPanel, true);
  assert.equal(fabui.Diagram.defaults.propertiesWidth, 230);
  assert.equal(fabui.Diagram.defaults.propertiesMinWidth, 180);
  assert.equal(fabui.Diagram.defaults.propertiesMaxWidth, 420);
  assert.equal(fabui.Diagram.defaults.propertiesHeight, 520);
  assert.equal(fabui.Diagram.defaults.propertiesMinHeight, 180);
  assert.equal(fabui.Diagram.defaults.propertiesMaxHeight, 720);
  assert.equal(fabui.Diagram.defaults.propertiesFloating, false);
  assert.equal(fabui.Diagram.defaults.propertiesFloatLeft, 12);
  assert.equal(fabui.Diagram.defaults.propertiesFloatTop, 12);
  assert.equal(fabui.Diagram.defaults.propertiesDockSide, 'right');
  assert.equal(fabui.Diagram.defaults.sameSideDockMode, 'tabs');
  assert.equal(fabui.Diagram.defaults.sameSideDockTab, 'toolbox');
  assert.equal(fabui.Diagram.defaults.viewToolbarLeft, null);
  assert.equal(fabui.Diagram.defaults.viewToolbarTop, null);
  assert.equal(fabui.Diagram.defaults.readOnly, false);
  assert.equal(fabui.Diagram.defaults.paperSize, 'A4');
  assert.equal(fabui.Diagram.defaults.paperOrientation, 'landscape');
  assert.equal(fabui.Diagram.defaults.pageWidth, 1123);
  assert.equal(fabui.Diagram.defaults.pageHeight, 794);
  assert.equal(fabui.Diagram.defaults.contextMenu, true);
  assert.equal(fabui.Diagram.defaults.onJsonLoaded, null);
  assert.equal(fabui.Diagram.defaults.onLoadError, null);
  assert.equal(fabui.Diagram.defaults.onHyperlinkClick, null);
  assert.equal(fabui.Diagram.defaults.onReadOnlyChanged, null);
  assert.deepEqual(fabui.Diagram.paperSizes.A4, {
    width: 794,
    height: 1123
  });
  assert.equal(fabui.Diagram.shapes.length, 47);
  assert.equal(fabui.Diagram.connectorTools.length, 2);
  assert.equal(fabui.Diagram.connectorTools[0].connectorType, 'curved');
  assert.equal(fabui.Diagram.connectorTools[1].connectorType, 'sCurve');
  assert.ok(fabui.Diagram.shapes.some(function(shape) {
    return shape.type === 'database';
  }));
  assert.ok(fabui.Diagram.shapes.some(function(shape) {
    return shape.type === 'cloud';
  }));
  ['diamond', 'heart', 'octagon', 'arrowUp', 'arrowDown',
    'arrowUpDown', 'arrowLeftRight'].forEach(function(type) {
    assert.ok(fabui.Diagram.shapes.some(function(shape) {
      return shape.type === type && shape.category === 'general';
    }));
  });
  ['multipleDocuments', 'directData', 'internalStorage', 'paperTape',
    'manualOperation', 'storedData', 'sequentialData', 'merge',
    'onPageReference', 'summingJunction', 'orJunction'].forEach(function(type) {
    assert.ok(fabui.Diagram.shapes.some(function(shape) {
      return shape.type === type && shape.category === 'flowchart';
    }));
  });
  ['dfdEntity', 'dfdProcess', 'dfdDataStore'].forEach(function(type) {
    assert.ok(fabui.Diagram.shapes.some(function(shape) {
      return shape.type === type && shape.category === 'dfd';
    }));
  });
  ['orgChartImageLeft', 'orgChartImageRight', 'orgChartImageTop'].forEach(function(type) {
    assert.ok(fabui.Diagram.shapes.some(function(shape) {
      return shape.type === type && shape.category === 'orgChart';
    }));
  });
});

test('Diagram publishes complete locales and all themes', function() {
  assert.deepEqual(Object.keys(fabui.Diagram.locales), ['en', 'zh-TW', 'zh-CN']);
  assert.deepEqual(
    Object.keys(fabui.Diagram.locales['zh-TW']),
    Object.keys(fabui.Diagram.locales.en)
  );
  assert.deepEqual(
    Object.keys(fabui.Diagram.locales['zh-CN']),
    Object.keys(fabui.Diagram.locales.en)
  );
  assert.equal(fabui.Diagram.locales['zh-TW'].toolbox, '工具箱');
  assert.equal(fabui.Diagram.locales['zh-TW'].resizeToolbox, '調整工具箱寬度');
  assert.equal(
    fabui.Diagram.locales['zh-TW'].dragToolbox,
    '拖曳以浮動或停靠工具箱'
  );
  assert.equal(
    fabui.Diagram.locales['zh-TW'].dragProperties,
    '拖曳以浮動或停靠屬性'
  );
  assert.equal(fabui.Diagram.locales['zh-TW'].clearPage, '清除頁面');
  assert.equal(fabui.Diagram.locales['zh-TW'].downloadJson, '下載');
  assert.equal(fabui.Diagram.locales['zh-TW'].loadJson, '載入');
  assert.equal(fabui.Diagram.locales['zh-TW'].readOnly, '唯讀');
  assert.equal(fabui.Diagram.locales['zh-TW'].hyperlink, '超連結');
  assert.equal(fabui.Diagram.locales['zh-TW'].hyperlinkTrigger, '觸發方式');
  assert.equal(fabui.Diagram.locales['zh-TW'].hyperlinkSingleClick, '單擊觸發');
  assert.equal(fabui.Diagram.locales['zh-TW'].hyperlinkDoubleClick, '雙擊觸發');
  assert.equal(fabui.Diagram.locales.en.fontSize, 'Font size');
  assert.equal(fabui.Diagram.locales['zh-TW'].textStyle, '文字樣式');
  assert.equal(fabui.Diagram.locales['zh-TW'].strikethrough, '刪除線');
  assert.equal(fabui.Diagram.locales['zh-CN'].underline, '下划线');
  assert.equal(fabui.Diagram.locales.en.fit, 'Fit');
  assert.equal(fabui.Diagram.locales['zh-TW'].fit, '符合');
  assert.equal(fabui.Diagram.locales['zh-CN'].fit, '适合');
  assert.equal(fabui.Diagram.locales['zh-TW'].presentation, '投影片展示');
  assert.equal(
    fabui.Diagram.locales['zh-TW'].exitPresentation,
    '離開投影片展示'
  );
  assert.equal(fabui.Diagram.locales['zh-TW'].dfdDataFlow, '資料流');
  assert.equal(fabui.Diagram.locales.en.dfdSCurve, 'S Curve');
  assert.equal(fabui.Diagram.locales['zh-TW'].dfdSCurve, 'S 弧線');
  assert.equal(fabui.Diagram.locales['zh-CN'].dfdSCurve, 'S 弧线');
  assert.equal(fabui.Diagram.locales.en.connectStraight, 'Straight connector');
  assert.equal(fabui.Diagram.locales['zh-TW'].connectOrthogonal, '直角線');
  assert.equal(fabui.Diagram.locales['zh-CN'].connectCurved, '弧线');
  assert.equal(fabui.Diagram.locales['zh-TW'].connectSCurve, 'S 線');
  assert.equal(fabui.Diagram.locales['zh-TW'].orgChart, '組織圖');
  assert.equal(fabui.Diagram.locales['zh-TW'].arrowDirection, '箭頭');
  assert.equal(fabui.Diagram.locales['zh-TW'].arrowBoth, '雙向箭頭');
  assert.equal(fabui.Diagram.locales.en.snapSize, 'Snap Size');
  assert.equal(fabui.Diagram.locales['zh-TW'].snapSize, '吸附間距');
  assert.equal(fabui.Diagram.locales['zh-CN'].snapSize, '吸附间距');
  assert.equal(fabui.Diagram.locales['zh-CN'].properties, '属性');
  assert.equal(fabui.Diagram.themes.length, 19);
  assert.equal(normalizeDiagramTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeDiagramTheme(' BLACK '), 'black');
  assert.equal(normalizeDiagramLocale('zh_Hant_TW'), 'zh-TW');
  assert.equal(normalizeDiagramLocale('zh-Hans'), 'zh-CN');
});

test('Diagram paper settings preserve and apply the grid snap size', function() {
  var changedEvent = null;
  var renderCount = 0;
  var saveCount = 0;
  var diagram = {
    options: {
      paperSize: 'A4',
      paperOrientation: 'landscape',
      pageWidth: 1123,
      pageHeight: 794,
      pageColor: '#ffffff',
      gridSize: 20
    },
    render: function() {
      renderCount += 1;
      return this;
    },
    getPaper: fabui.Diagram.prototype.getPaper,
    getData: function() {
      return { page: this.getPaper() };
    },
    _saveToolboxState: function() {
      saveCount += 1;
    },
    _fire: function(name, detail) {
      changedEvent = { name: name, detail: detail };
    }
  };

  assert.equal(diagram.getPaper().gridSize, 20);
  fabui.Diagram.prototype.setPaper.call(
    diagram,
    'A4',
    'landscape',
    32
  );
  assert.equal(diagram.options.gridSize, 32);
  assert.equal(diagram.getPaper().gridSize, 32);
  assert.equal(renderCount, 1);
  assert.equal(changedEvent.name, 'Changed');
  assert.equal(changedEvent.detail.action, 'pageChange');
  assert.equal(changedEvent.detail.data.page.gridSize, 32);
  assert.equal(saveCount, 1);

  fabui.Diagram.prototype.setPaper.call(
    diagram,
    'A4',
    'landscape',
    2
  );
  assert.equal(diagram.options.gridSize, 5);
  assert.equal(saveCount, 2);
});

test('Diagram toolbox order normalizes and reorders known groups', function() {
  assert.deepEqual(
    normalizeDiagramToolboxOrder(['dfd', 'invalid', 'dfd', 'general']),
    ['dfd', 'general', 'flowchart', 'orgChart']
  );
  assert.deepEqual(
    reorderDiagramToolboxOrder(
      ['general', 'flowchart', 'dfd', 'orgChart'],
      'orgChart',
      'general',
      false
    ),
    ['orgChart', 'general', 'flowchart', 'dfd']
  );
  assert.deepEqual(
    reorderDiagramToolboxOrder(
      ['general', 'flowchart', 'dfd', 'orgChart'],
      'general',
      'dfd',
      true
    ),
    ['flowchart', 'dfd', 'general', 'orgChart']
  );
});

test('Diagram floating toolbox stays in workspace and docks at left edge', function() {
  assert.deepEqual(
    constrainDiagramFloatingToolbox(480, 350, 266, 300, 700, 600),
    { left: 434, top: 300 }
  );
  assert.deepEqual(
    constrainDiagramFloatingToolbox(-20, -15, 266, 300, 700, 600),
    { left: 0, top: 0 }
  );
  assert.equal(diagramToolboxShouldDock(145, 100, 56), true);
  assert.equal(diagramToolboxShouldDock(157, 100, 56), false);
});

test('Diagram view toolbar stays inside the Diagram host', function() {
  assert.deepEqual(
    constrainDiagramViewToolbar(880, 610, 280, 38, 1000, 620),
    { left: 720, top: 582 }
  );
  assert.deepEqual(
    constrainDiagramViewToolbar(-30, -20, 280, 38, 1000, 620),
    { left: 0, top: 0 }
  );
});

test('Diagram floating properties dock at the workspace right edge', function() {
  assert.equal(
    diagramPropertiesShouldDock(744, 100, 700, 56),
    true
  );
  assert.equal(
    diagramPropertiesShouldDock(743, 100, 700, 56),
    false
  );
  assert.equal(getDiagramPanelDockSide(120, 100, 700, 56), 'left');
  assert.equal(getDiagramPanelDockSide(760, 100, 700, 56), 'right');
  assert.equal(getDiagramPanelDockSide(400, 100, 700, 56), '');
  assert.equal(normalizeDiagramDockSide('RIGHT', 'left'), 'right');
  assert.equal(normalizeDiagramDockSide('invalid', 'right'), 'right');
});

test('Diagram brings the clicked floating panel to the front', function() {
  var classes = new Set();
  var diagram = {
    options: {
      toolboxFloating: true,
      propertiesFloating: true
    },
    toolboxElement: { hidden: false },
    propertiesElement: { hidden: false },
    workspaceElement: {
      classList: {
        toggle: function(name, enabled) {
          if (enabled) classes.add(name);
          else classes.delete(name);
        }
      }
    },
    _floatingPanelFront: 'properties',
    _syncFloatingPanelStack: fabui.Diagram.prototype._syncFloatingPanelStack
  };

  fabui.Diagram.prototype._bringFloatingPanelToFront.call(
    diagram,
    'toolbox'
  );
  assert.equal(
    classes.has('fui-diagram-floating-front-toolbox'),
    true
  );
  assert.equal(
    classes.has('fui-diagram-floating-front-properties'),
    false
  );

  fabui.Diagram.prototype._bringFloatingPanelToFront.call(
    diagram,
    'properties'
  );
  assert.equal(
    classes.has('fui-diagram-floating-front-toolbox'),
    false
  );
  assert.equal(
    classes.has('fui-diagram-floating-front-properties'),
    true
  );
});

test('Diagram docks both panels independently on the same side', function() {
  var saved = 0;
  var diagram = Object.create(fabui.Diagram.prototype);
  diagram.options = {
    toolboxFloating: true,
    toolboxDockSide: 'left',
    propertiesFloating: false,
    propertiesDockSide: 'right'
  };
  diagram.workspaceElement = {
    classList: {
      remove: function() {}
    }
  };
  diagram._syncStructure = function() {};
  diagram._saveToolboxState = function() {
    saved += 1;
  };
  diagram.dockToolbox('right');
  assert.equal(diagram.options.toolboxFloating, false);
  assert.equal(diagram.options.toolboxDockSide, 'right');
  assert.equal(diagram.options.propertiesDockSide, 'right');
  assert.equal(diagram.options.sameSideDockTab, 'toolbox');
  diagram.dockProperties('right');
  assert.equal(diagram.options.propertiesFloating, false);
  assert.equal(diagram.options.propertiesDockSide, 'right');
  assert.equal(diagram.options.toolboxDockSide, 'right');
  assert.equal(diagram.options.sameSideDockTab, 'properties');
  diagram.dockToolbox('left');
  diagram.dockProperties('left');
  assert.equal(diagram.options.toolboxDockSide, 'left');
  assert.equal(diagram.options.propertiesDockSide, 'left');
  assert.equal(diagram.options.sameSideDockTab, 'properties');
  assert.equal(saved, 4);
});

test('Diagram switches same-side panels between tabs and stacked modes', function() {
  var saved = 0;
  var synced = 0;
  var diagram = Object.create(fabui.Diagram.prototype);
  diagram.options = { sameSideDockMode: 'tabs' };
  diagram._syncStructure = function() {
    synced += 1;
  };
  diagram._saveToolboxState = function() {
    saved += 1;
  };

  assert.equal(normalizeDiagramSameSideDockMode('STACKED'), 'stacked');
  assert.equal(normalizeDiagramSameSideDockMode('invalid'), 'tabs');
  diagram.setSameSideDockMode('stacked');
  assert.equal(diagram.getSameSideDockMode(), 'stacked');
  diagram.setSameSideDockMode('tabs');
  assert.equal(diagram.getSameSideDockMode(), 'tabs');
  assert.equal(synced, 2);
  assert.equal(saved, 2);
});

test('Diagram resizes docked and floating panels from either edge', function() {
  var diagram = Object.create(fabui.Diagram.prototype);
  var synced = 0;
  diagram.options = {
    toolboxWidth: 260,
    toolboxMinWidth: 140,
    toolboxMaxWidth: 420,
    toolboxHeight: 520,
    toolboxMinHeight: 180,
    toolboxMaxHeight: 720,
    toolboxFloating: false,
    toolboxFloatLeft: 12,
    toolboxFloatTop: 12,
    propertiesWidth: 230,
    propertiesMinWidth: 180,
    propertiesMaxWidth: 420,
    propertiesHeight: 520,
    propertiesMinHeight: 180,
    propertiesMaxHeight: 720,
    propertiesFloating: true,
    propertiesFloatLeft: 100,
    propertiesFloatTop: 80
  };
  diagram._syncStructure = function() {
    synced += 1;
  };
  diagram._saveToolboxState = function() {};

  diagram._resizePanelFromEdge(
    'toolbox',
    'right',
    260,
    520,
    12,
    12,
    40,
    0,
    1000,
    800,
    true
  );
  assert.equal(diagram.options.toolboxWidth, 300);
  assert.equal(diagram.options.toolboxFloatLeft, 12);

  diagram._resizePanelFromEdge(
    'properties',
    'left',
    230,
    520,
    100,
    80,
    20,
    0,
    1000,
    800,
    true
  );
  assert.equal(diagram.options.propertiesWidth, 210);
  assert.equal(diagram.options.propertiesFloatLeft, 120);

  diagram._resizePanelFromEdge(
    'properties',
    'left',
    230,
    520,
    100,
    80,
    -300,
    0,
    1000,
    800,
    true
  );
  assert.equal(diagram.options.propertiesWidth, 330);
  assert.equal(diagram.options.propertiesFloatLeft, 0);

  diagram._resizePanelFromEdge(
    'properties',
    'bottom',
    230,
    520,
    100,
    80,
    0,
    40,
    1000,
    800,
    true
  );
  assert.equal(diagram.options.propertiesHeight, 560);
  assert.equal(diagram.options.propertiesFloatTop, 80);

  diagram.options.toolboxFloating = true;
  diagram._resizePanelFromEdge(
    'toolbox',
    'top',
    260,
    300,
    12,
    100,
    0,
    20,
    1000,
    800,
    true
  );
  assert.equal(diagram.options.toolboxHeight, 280);
  assert.equal(diagram.options.toolboxFloatTop, 120);
  assert.equal(synced, 5);
});

test('Diagram hyperlink normalization keeps supported links and script actions', function() {
  assert.equal(normalizeDiagramHyperlink('example.com/path'), 'https://example.com/path');
  assert.equal(normalizeDiagramHyperlink('https://example.com'), 'https://example.com');
  assert.equal(normalizeDiagramHyperlink('mailto:test@example.com'), 'mailto:test@example.com');
  assert.equal(normalizeDiagramHyperlink('#diagram-section'), '#diagram-section');
  assert.equal(
    normalizeDiagramHyperlink("javascript:alert('12345')"),
    "javascript:alert('12345')"
  );
  assert.equal(normalizeDiagramHyperlink('data:text/html,test'), '');
  assert.equal(normalizeDiagramHyperlink(''), '');
  assert.equal(normalizeDiagramHyperlinkTrigger('dblclick'), 'dblclick');
  assert.equal(normalizeDiagramHyperlinkTrigger('click'), 'click');
  assert.equal(normalizeDiagramHyperlinkTrigger('unknown'), 'click');
  assert.equal(
    diagramNodeHyperlinkMatchesTrigger({
      hyperlink: 'https://example.com',
      hyperlinkTrigger: 'dblclick'
    }, 'dblclick'),
    true
  );
  assert.equal(
    diagramNodeHyperlinkMatchesTrigger({
      hyperlink: 'https://example.com',
      hyperlinkTrigger: 'dblclick'
    }, 'click'),
    false
  );
  assert.equal(
    diagramNodeHyperlinkMatchesTrigger({
      hyperlink: '',
      hyperlinkTrigger: 'click'
    }, 'click'),
    false
  );
});

test('Diagram normalizes nodes and only keeps valid connectors', function() {
  var source = {
    nodes: [
      {
        id: 'a',
        text: 'A',
        width: 10,
        fontSize: 120,
        fontBold: true,
        fontItalic: true,
        fontUnderline: true,
        fontStrikethrough: true,
        hyperlink: ' https://example.com ',
        hyperlinkTrigger: 'dblclick'
      },
      { id: 'b', text: 'B', type: 'decision' }
    ],
    edges: [
      {
        id: 'ab',
        from: 'a',
        to: 'b',
        controlX: 180,
        controlY: 90,
        fontSize: 6,
        fontBold: true,
        fontItalic: true,
        fontUnderline: true,
        fontStrikethrough: true
      },
      { id: 'missing', from: 'a', to: 'c' },
      { id: 'self', from: 'a', to: 'a' }
    ]
  };
  var result = normalizeDiagramData(source);
  assert.equal(result.nodes.length, 2);
  assert.equal(result.nodes[0].width, 40);
  assert.equal(result.nodes[0].hyperlink, 'https://example.com');
  assert.equal(result.nodes[0].hyperlinkTrigger, 'dblclick');
  assert.equal(result.nodes[0].fontSize, 96);
  assert.equal(result.nodes[0].fontBold, true);
  assert.equal(result.nodes[0].fontItalic, true);
  assert.equal(result.nodes[0].fontUnderline, true);
  assert.equal(result.nodes[0].fontStrikethrough, true);
  assert.equal(result.nodes[1].hyperlinkTrigger, 'click');
  assert.equal(result.nodes[1].type, 'decision');
  assert.deepEqual(result.connectors.map(function(item) { return item.id; }), ['ab']);
  assert.equal(result.connectors[0].controlX, 180);
  assert.equal(result.connectors[0].controlY, 90);
  assert.equal(result.connectors[0].arrowDirection, 'end');
  assert.equal(result.connectors[0].fontSize, 8);
  assert.equal(result.connectors[0].fontBold, true);
  assert.equal(result.connectors[0].fontItalic, true);
  assert.equal(result.connectors[0].fontUnderline, true);
  assert.equal(result.connectors[0].fontStrikethrough, true);
  assert.equal(source.nodes[0].width, 10);
});

test('Diagram normalizes all connector arrow directions', function() {
  var result = normalizeDiagramData({
    nodes: [
      { id: 'a' },
      { id: 'b' }
    ],
    connectors: [
      { id: 'none', from: 'a', to: 'b', arrowDirection: 'none' },
      { id: 'end', from: 'a', to: 'b', arrowDirection: 'end' },
      { id: 'start', from: 'a', to: 'b', arrowDirection: 'start' },
      { id: 'both', from: 'a', to: 'b', arrowDirection: 'both' },
      { id: 'invalid', from: 'a', to: 'b', arrowDirection: 'invalid' }
    ]
  });
  assert.deepEqual(result.connectors.map(function(connector) {
    return connector.arrowDirection;
  }), ['none', 'end', 'start', 'both', 'end']);
});

test('Diagram connector paths and resize geometry are deterministic', function() {
  var from = { x: 0, y: 20, width: 100, height: 60 };
  var to = { x: 300, y: 20, width: 100, height: 60 };
  var sCurveTo = { x: 300, y: 180, width: 100, height: 60 };
  var geometry = calculateDiagramConnectorPath(from, to, 'orthogonal');
  var curved = calculateDiagramConnectorPath(from, to, 'curved');
  var sCurve = calculateDiagramConnectorPath(from, sCurveTo, 'sCurve');
  var adjustedSCurve = calculateDiagramConnectorPath(
    from,
    sCurveTo,
    'sCurve',
    '',
    '',
    220,
    150
  );
  var adjustedCurve = calculateDiagramConnectorPath(
    from,
    to,
    'curved',
    '',
    '',
    200,
    160
  );
  var adjustedStraight = calculateDiagramConnectorPath(
    from,
    to,
    'straight',
    '',
    '',
    200,
    160
  );
  var resized = calculateDiagramNodeResize(from, 'nw', 30, 20, 40, 30);
  assert.equal(geometry.path, 'M 100 50 H 200 V 50 H 300');
  assert.match(curved.path, /^M 100 50 Q /);
  assert.notEqual(curved.label.y, 50);
  assert.equal(adjustedCurve.path, 'M 100 50 Q 200 160 300 50');
  assert.deepEqual(adjustedCurve.control, { x: 200, y: 160 });
  assert.deepEqual(adjustedCurve.label, { x: 200, y: 105 });
  assert.equal(adjustedStraight.path, 'M 100 50 L 200 160 L 300 50');
  assert.match(sCurve.path, /^M 100 50 C /);
  assert.deepEqual(sCurve.label, { x: 200, y: 130 });
  assert.match(adjustedSCurve.path, /^M 100 50 C /);
  assert.deepEqual(adjustedSCurve.control, { x: 220, y: 150 });
  assert.deepEqual(adjustedSCurve.label, { x: 220, y: 150 });
  assert.deepEqual(geometry.start, { x: 100, y: 50 });
  assert.equal(resized.x, 30);
  assert.equal(resized.y, 40);
  assert.equal(resized.width, 70);
  assert.equal(resized.height, 40);
});

test('Diagram group resize scales node sizes and spacing around the center', function() {
  var nodes = [{
    id: 'a',
    x: 0,
    y: 0,
    width: 100,
    height: 100
  }, {
    id: 'b',
    x: 200,
    y: 0,
    width: 100,
    height: 100
  }];
  var bounds = calculateDiagramGroupBounds(nodes);
  var resized = calculateDiagramGroupResize(
    nodes,
    bounds,
    'se',
    { x: 225, y: 75 },
    40,
    30
  );
  assert.deepEqual(bounds, {
    x: 0,
    y: 0,
    width: 300,
    height: 100,
    centerX: 150,
    centerY: 50
  });
  assert.equal(resized.scale, 0.5);
  assert.deepEqual(resized.nodes.map(function(node) {
    return {
      id: node.id,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height
    };
  }), [{
    id: 'a',
    x: 75,
    y: 25,
    width: 50,
    height: 50
  }, {
    id: 'b',
    x: 175,
    y: 25,
    width: 50,
    height: 50
  }]);
  assert.equal(resized.nodes[1].x - (
    resized.nodes[0].x + resized.nodes[0].width
  ), 50);
});

test('Diagram aligns nearly straight connectors while moving nodes', function() {
  var nodes = [{
    id: 'source',
    type: 'ellipse',
    x: 20,
    y: 100,
    width: 120,
    height: 80
  }, {
    id: 'target',
    type: 'rectangle',
    x: 260,
    y: 107,
    width: 140,
    height: 60
  }];
  var connector = {
    id: 'connector',
    from: 'source',
    to: 'target',
    type: 'orthogonal'
  };
  var alignment = calculateDiagramMoveAlignment(
    nodes,
    [connector],
    ['source'],
    10
  );
  var verticalNodes = [{
    id: 'top',
    type: 'rectangle',
    x: 100,
    y: 20,
    width: 80,
    height: 60
  }, {
    id: 'bottom',
    type: 'rectangle',
    x: 107,
    y: 240,
    width: 60,
    height: 80
  }];
  var geometry;

  assert.deepEqual(alignment, { x: 0, y: -3 });
  nodes[0].y += alignment.y;
  geometry = calculateDiagramConnectorPath(
    nodes[0],
    nodes[1],
    connector.type
  );
  assert.equal(geometry.start.y, geometry.end.y);
  assert.deepEqual(
    calculateDiagramMoveAlignment(nodes, [connector], ['source'], 2),
    { x: 0, y: 0 }
  );
  assert.deepEqual(
    calculateDiagramMoveAlignment(nodes, [{
      id: 'custom',
      from: 'source',
      to: 'target',
      type: 'orthogonal',
      controlX: 190,
      controlY: 150
    }], ['source'], 10),
    { x: 0, y: 0 }
  );
  assert.deepEqual(
    calculateDiagramMoveAlignment(verticalNodes, [{
      id: 'vertical',
      from: 'top',
      to: 'bottom',
      type: 'orthogonal'
    }], ['top'], 10),
    { x: -3, y: 0 }
  );
});

test('Diagram calculates a whole-page zoom within the configured limits', function() {
  assert.equal(
    calculateDiagramPageZoom(792, 605, 1123, 794, 12, 0.25, 2),
    768 / 1123
  );
  assert.equal(
    calculateDiagramPageZoom(792, 605, 794, 1123, 12, 0.25, 2),
    581 / 1123
  );
  assert.equal(
    calculateDiagramPageZoom(100, 100, 1123, 794, 12, 0.25, 2),
    0.25
  );
});

test('Diagram wheel zoom follows the pointer anchor', function() {
  var prevented = 0;
  var zoomRequest;
  var diagram = {
    options: {
      disabled: false,
      zoomLevel: 1
    },
    viewportElement: {
      clientHeight: 600
    },
    _setZoomAtPoint: function(zoom, clientX, clientY) {
      zoomRequest = {
        zoom: zoom,
        clientX: clientX,
        clientY: clientY
      };
    }
  };
  fabui.Diagram.prototype._handleViewportWheel.call(diagram, {
    deltaY: -100,
    deltaMode: 0,
    clientX: 320,
    clientY: 240,
    preventDefault: function() {
      prevented += 1;
    }
  });
  assert.equal(prevented, 1);
  assert.ok(zoomRequest.zoom > 1);
  assert.equal(zoomRequest.clientX, 320);
  assert.equal(zoomRequest.clientY, 240);
  assert.equal(
    calculateDiagramAnchoredScroll(200, 300, 0, 1, 0, 1.2),
    300
  );
  assert.equal(
    calculateDiagramAnchoredScroll(0, 300, 100, 0.5, 0, 1),
    100
  );
});

test('Diagram fullscreen resize ignores stable viewport border size', function() {
  var initial = { width: 1440, height: 900 };
  assert.equal(diagramFullscreenSizeChanged(null, initial), true);
  assert.equal(
    diagramFullscreenSizeChanged(initial, { width: 1440, height: 900 }),
    false
  );
  assert.equal(
    diagramFullscreenSizeChanged(initial, { width: 1439.6, height: 900.4 }),
    false
  );
  assert.equal(
    diagramFullscreenSizeChanged(initial, { width: 1360, height: 900 }),
    true
  );
});

test('Diagram inline editor offset follows centered and scrolled SVG positions', function() {
  assert.deepEqual(calculateDiagramViewportOffset(
    { left: 100, top: 50 },
    { left: 131.5, top: 72.25 },
    0,
    0,
    0,
    0
  ), {
    x: 31.5,
    y: 22.25
  });
  assert.deepEqual(calculateDiagramViewportOffset(
    { left: 100, top: 50 },
    { left: -60, top: -40 },
    160,
    90,
    0,
    0
  ), {
    x: 0,
    y: 0
  });
});

test('Diagram auto connectors choose facing ports again after nodes move', function() {
  var lower = {
    type: 'orgChartImageRight',
    x: 40,
    y: 234,
    width: 187,
    height: 82
  };
  var upperRight = {
    type: 'orgChartImageLeft',
    x: 227,
    y: 48,
    width: 185,
    height: 83
  };
  var directlyAbove = {
    type: 'orgChartImageLeft',
    x: 41,
    y: 48,
    width: 185,
    height: 83
  };
  var diagonalPoints = findBestDiagramConnectionPoints(lower, upperRight);
  var diagonalPath = calculateDiagramConnectorPath(
    lower,
    upperRight,
    'orthogonal'
  );
  var verticalPoints = findBestDiagramConnectionPoints(lower, directlyAbove);
  assert.equal(diagonalPoints.fromSide, 'right');
  assert.equal(diagonalPoints.toSide, 'bottom');
  assert.equal(diagonalPath.path, 'M 227 275 H 319.5 V 131');
  assert.equal(verticalPoints.fromSide, 'top');
  assert.equal(verticalPoints.toSide, 'bottom');
});

test('Diagram exposes six connection points and preserves explicit connector ports', function() {
  var node = { x: 20, y: 30, width: 120, height: 90 };
  var data = normalizeDiagramData({
    nodes: [
      { id: 'a', x: 20, y: 30, width: 120, height: 90 },
      { id: 'b', x: 300, y: 30, width: 120, height: 90 }
    ],
    connectors: [{
      id: 'ab',
      from: 'a',
      to: 'b',
      fromPoint: 'rightTop',
      toPoint: 'leftBottom'
    }]
  });
  var geometry = calculateDiagramConnectorPath(
    data.nodes[0],
    data.nodes[1],
    'straight',
    data.connectors[0].fromPoint,
    data.connectors[0].toPoint
  );
  assert.equal(fabui.Diagram.connectionPoints.length, 6);
  assert.deepEqual(getDiagramConnectionPoint(node, 'top'), { x: 80, y: 30 });
  assert.deepEqual(getDiagramConnectionPoint(node, 'rightBottom'), { x: 140, y: 90 });
  assert.deepEqual(geometry.start, { x: 140, y: 60 });
  assert.deepEqual(geometry.end, { x: 300, y: 90 });
});

test('Diagram DFD shapes remain editable node types', function() {
  var dfdTypes = ['dfdEntity', 'dfdProcess', 'dfdDataStore'];
  var data = normalizeDiagramData({
    nodes: dfdTypes.map(function(type, index) {
      return {
        id: 'dfd-' + index,
        type: type,
        text: 'DFD ' + index
      };
    })
  });
  assert.deepEqual(
    data.nodes.map(function(node) {
      return { type: node.type, text: node.text };
    }),
    [
      { type: 'dfdEntity', text: 'DFD 0' },
      { type: 'dfdProcess', text: 'DFD 1' },
      { type: 'dfdDataStore', text: 'DFD 2' }
    ]
  );
});

test('Diagram organization chart shapes remain editable node types', function() {
  var types = ['orgChartImageLeft', 'orgChartImageRight', 'orgChartImageTop'];
  var data = normalizeDiagramData({
    nodes: types.map(function(type, index) {
      return {
        id: 'org-' + index,
        type: type,
        text: 'Org ' + index
      };
    })
  });

  assert.deepEqual(data.nodes.map(function(node) {
    return { type: node.type, text: node.text };
  }), [
    { type: 'orgChartImageLeft', text: 'Org 0' },
    { type: 'orgChartImageRight', text: 'Org 1' },
    { type: 'orgChartImageTop', text: 'Org 2' }
  ]);
});

test('Diagram connector endpoints stay on each rendered shape boundary', function() {
  var ellipse = {
    type: 'ellipse',
    x: 0,
    y: 0,
    width: 120,
    height: 80
  };
  var decision = {
    type: 'decision',
    x: 200,
    y: 0,
    width: 120,
    height: 80
  };
  var ellipsePoint = getDiagramConnectionPoint(ellipse, 'rightTop');
  var decisionPoint = getDiagramShapeBoundaryPoint(decision, { x: 100, y: 40 });
  var ellipseEquation =
    Math.pow((ellipsePoint.x - 60) / 60, 2) +
    Math.pow((ellipsePoint.y - 40) / 40, 2);
  assert.ok(Math.abs(ellipseEquation - 1) < 0.000001);
  assert.deepEqual(decisionPoint, { x: 200, y: 40 });
  assert.ok(ellipsePoint.x < 120);
});

test('Diagram marquee selection returns every intersecting node', function() {
  var nodes = [
    { id: 'a', x: 20, y: 20, width: 80, height: 50 },
    { id: 'b', x: 140, y: 20, width: 80, height: 50 },
    { id: 'c', x: 280, y: 20, width: 80, height: 50 }
  ];
  assert.deepEqual(
    findDiagramNodesInRect(nodes, { x: 10, y: 10, width: 210, height: 80 })
      .map(function(node) { return node.id; }),
    ['a', 'b']
  );
  assert.deepEqual(
    findDiagramNodesInRect(nodes, { x: 230, y: 90, width: -100, height: -80 })
      .map(function(node) { return node.id; }),
    ['b']
  );
});

test('Diagram pans only when the page exceeds its viewport', function() {
  assert.equal(diagramViewportCanPan(800, 600, 800, 600), false);
  assert.equal(diagramViewportCanPan(801, 600, 800, 600), false);
  assert.equal(diagramViewportCanPan(802, 600, 800, 600), true);
  assert.equal(diagramViewportCanPan(800, 620, 800, 600), true);
});

test('Diagram factory exposes data, history, editing and export APIs', function() {
  function Control() {
    this._managedEventListeners = [];
  }
  Control.prototype.addEventListener = function() {};
  Control.prototype.removeEventListener = function() {};
  function Button() {}
  function EditBox() {}
  function Menu() {}
  var Diagram = createDiagramFactory(
    Control,
    function() {},
    function() {},
    Button,
    EditBox,
    Menu
  );
  assert.equal(Diagram.prototype.dispose, Diagram.prototype.destroy);
  assert.equal(typeof Diagram.prototype.addNode, 'function');
  assert.equal(typeof Diagram.prototype.addConnector, 'function');
  assert.equal(typeof Diagram.prototype.getSelections, 'function');
  assert.equal(typeof Diagram.prototype.undo, 'function');
  assert.equal(typeof Diagram.prototype.redo, 'function');
  assert.equal(typeof Diagram.prototype.fitToContent, 'function');
  assert.equal(typeof Diagram.prototype.fitToPage, 'function');
  assert.equal(typeof Diagram.prototype.exportSvg, 'function');
  assert.equal(typeof Diagram.prototype.exportPng, 'function');
  assert.equal(typeof Diagram.prototype.print, 'function');
  assert.equal(typeof Diagram.prototype.import, 'function');
  assert.equal(typeof Diagram.prototype.getPaper, 'function');
  assert.equal(typeof Diagram.prototype.setPaper, 'function');
  assert.equal(typeof Diagram.prototype.getSameSideDockMode, 'function');
  assert.equal(typeof Diagram.prototype.setSameSideDockMode, 'function');
  assert.equal(typeof Diagram.prototype.getToolboxWidth, 'function');
  assert.equal(typeof Diagram.prototype.setToolboxWidth, 'function');
  assert.equal(typeof Diagram.prototype.getToolboxHeight, 'function');
  assert.equal(typeof Diagram.prototype.setToolboxHeight, 'function');
  assert.equal(typeof Diagram.prototype.getPropertiesWidth, 'function');
  assert.equal(typeof Diagram.prototype.setPropertiesWidth, 'function');
  assert.equal(typeof Diagram.prototype.getPropertiesHeight, 'function');
  assert.equal(typeof Diagram.prototype.setPropertiesHeight, 'function');
  assert.equal(typeof Diagram.prototype.isToolboxFloating, 'function');
  assert.equal(typeof Diagram.prototype.floatToolbox, 'function');
  assert.equal(typeof Diagram.prototype.dockToolbox, 'function');
  assert.equal(typeof Diagram.prototype.isPropertiesFloating, 'function');
  assert.equal(typeof Diagram.prototype.floatProperties, 'function');
  assert.equal(typeof Diagram.prototype.dockProperties, 'function');
  assert.equal(typeof Diagram.prototype.clearPage, 'function');
  assert.equal(typeof Diagram.prototype.toggleFullscreen, 'function');
  assert.equal(
    typeof Diagram.prototype.togglePresentationFullscreen,
    'function'
  );
  assert.equal(typeof Diagram.prototype.loadJsonFile, 'function');
});

test('Diagram source composes FabUI controls and manages pointer listeners by interaction', function() {
  var source = readFileSync(
    new URL('../src/diagram/diagram.js', import.meta.url),
    'utf8'
  );
  var css = readFileSync(
    new URL('../src/diagram/diagram.css', import.meta.url),
    'utf8'
  );
  var iconCss = readFileSync(
    new URL('../src/fabui.icon.css', import.meta.url),
    'utf8'
  );
  assert.match(source, /control = new Button\(host/);
  assert.match(source, /'icon-undo'/);
  assert.match(source, /'icon-redo'/);
  assert.doesNotMatch(source, /'↶'|'↷'/);
  assert.match(source, /'aria-label',\s*this\.messages\.undo/);
  assert.match(source, /'aria-label',\s*this\.messages\.redo/);
  assert.match(source, /new EditBox\(this\.toolboxSearchElement/);
  assert.match(source, /control = new EditBox\(input/);
  assert.equal(
    (source.match(/spinner: editor === 'number'/g) || []).length,
    3
  );
  assert.match(source, /Diagram\.prototype\._renderPaperProperties/);
  assert.match(source, /'data-diagram-paper-property', key/);
  assert.match(source, /self\.setPaper\(size, orientation, gridSize\)/);
  assert.match(
    source,
    /if \(!this\._selected\) \{\s*this\._renderPaperProperties\(\);/
  );
  assert.doesNotMatch(source, /_openPaperSettings|new Window\(host/);
  assert.match(source, /this\._contextMenu = new Menu\(host/);
  assert.match(source, /this\.viewportElement,\s*'contextmenu'/);
  assert.match(source, /name: 'exportPng'/);
  assert.match(source, /name: 'exportSvg'/);
  assert.match(source, /name: 'print'/);
  assert.match(source, /name: 'fullscreen'/);
  assert.match(source, /text: messages\.presentation/);
  assert.match(
    source,
    /'exportPng',\s*'Export PNG',\s*function\(\) \{\s*self\.exportPng\('fabui-diagram\.png'\)/
  );
  assert.match(
    source,
    /'exportSvg',\s*'Export SVG',\s*function\(\) \{\s*self\.exportSvg\('fabui-diagram\.svg'\)/
  );
  assert.match(source, /'print',\s*'Print',\s*this\.print/);
  assert.match(
    source,
    /this\.viewToolbarElement,\s*'presentation',\s*'',\s*this\.togglePresentationFullscreen,\s*false,\s*'icon-projector-screen'/
  );
  assert.match(
    source,
    /this\.viewToolbarElement,\s*'fullscreen',\s*'',\s*this\.toggleFullscreen,\s*false,\s*'icon-fullscreen'/
  );
  assert.match(source, /this\._toolbarButtons\.exportPng\.setText\(this\.messages\.exportPng\)/);
  assert.match(source, /this\._toolbarButtons\.exportSvg\.setText\(this\.messages\.exportSvg\)/);
  assert.match(source, /this\._toolbarButtons\.print\.setText\(this\.messages\.print\)/);
  assert.match(
    source,
    /var presentation = this\._toolbarButtons\.presentation;[\s\S]*presentation\.setText\(''\);[\s\S]*presentation\.hostElement\.setAttribute\('aria-label', presentationText\)/
  );
  assert.match(source, /this\.messages\.exitPresentation/);
  assert.doesNotMatch(source, /oppositeDiagramDockSide/);
  assert.match(source, /'fui-diagram-toolbox-right'/);
  assert.match(source, /'fui-diagram-properties-left'/);
  assert.match(
    source,
    /Diagram\.prototype\._createToolbarSeparator = function\(container\)/
  );
  assert.equal((
    source.match(/this\._createToolbarSeparator\(this\.toolbarElement\);/g) || []
  ).length, 4);
  assert.match(
    source,
    /'download',\s*'Download',[\s\S]*?'load',\s*'Load',[\s\S]*?_createToolbarSeparator\(this\.toolbarElement\);[\s\S]*?'exportPng',[\s\S]*?'print',[\s\S]*?_createToolbarSeparator\(this\.toolbarElement\);[\s\S]*?'undo',[\s\S]*?'clear',[\s\S]*?_createToolbarSeparator\(this\.toolbarElement\);[\s\S]*?'connectStraight',[\s\S]*?'connectOrthogonal',[\s\S]*?'connectCurved',[\s\S]*?'connectSCurve',[\s\S]*?'connect',[\s\S]*?_createToolbarSeparator\(this\.toolbarElement\);[\s\S]*?'toolbox',[\s\S]*?'readOnly'/
  );
  assert.match(source, /self\.setConnectMode\(self\._connectMode, 'straight'\)/);
  assert.match(source, /self\.setConnectMode\(self\._connectMode, 'orthogonal'\)/);
  assert.match(source, /self\.setConnectMode\(self\._connectMode, 'curved'\)/);
  assert.match(source, /self\.setConnectMode\(self\._connectMode, 'sCurve'\)/);
  assert.match(source, /self\.setConnectMode\(!self\._connectMode\);/);
  assert.match(
    source,
    /if \(item\.type === this\._connectType\) item\.button\.select\(true\)/
  );
  assert.match(
    source,
    /labelY = geometry\.label\.y - Math\.max\(12, connector\.fontSize \* 0\.85\)/
  );
  assert.match(source, /'font-size': connector\.fontSize/);
  assert.match(source, /'font-weight': connector\.fontBold \? 700 : 400/);
  assert.match(source, /'font-style': connector\.fontItalic \? 'italic' : 'normal'/);
  assert.match(source, /'text-decoration': diagramTextDecoration\(connector, false\)/);
  assert.match(
    source,
    /geometry\.label\.y - Math\.max\(12, connector\.fontSize \* 0\.85\)[\s\S]*this\.options\.zoomLevel/
  );
  assert.match(source, /labelBounds = label\.getBBox\(\)/);
  assert.match(
    source,
    /fill: self\.options\.pageColor,[\s\S]*class: 'fui-diagram-connector-label-background'/
  );
  assert.match(source, /group\.insertBefore\(labelBackground, label\)/);
  assert.match(
    source,
    /this\.viewToolbarElement,\s*'grid',[\s\S]*?this\.viewToolbarElement,\s*'presentation',[\s\S]*?this\.viewToolbarElement,\s*'fullscreen'/
  );
  assert.match(source, /fullscreen\.setText\(''\)/);
  assert.match(
    css,
    /\.fui-diagram-toolbar-separator\s*\{[^}]*width: 1px;[^}]*height: 22px;[^}]*background: var\(--fui-diagram-border\);/s
  );
  assert.match(
    css,
    /\.fui-diagram-connector-label-background\s*\{[^}]*pointer-events: none;/s
  );
  assert.match(iconCss, /\.icon-diagram-connect-straight/);
  assert.match(iconCss, /\.icon-diagram-connect-orthogonal/);
  assert.match(iconCss, /\.icon-diagram-connect-curved/);
  assert.match(iconCss, /\.icon-diagram-connect-s-curve/);
  assert.match(
    iconCss,
    /\.icon-projector-screen\s*\{[^}]*projector-screen\.png/s
  );
  assert.deepEqual(
    readFileSync(new URL('../src/theme/images/projector-screen.png', import.meta.url)),
    readFileSync(new URL('../res/projector-screen.png', import.meta.url))
  );
  assert.match(iconCss, /mask-image: url\("data:image\/svg\+xml/);
  assert.match(iconCss, /d='M2 9h16'/);
  assert.match(iconCss, /d='M3 15V9h12V3'/);
  assert.match(iconCss, /d='M2 14Q8 3 18 9'/);
  assert.match(iconCss, /d='M2 5c5 0 5 8 10 8 3 0 4-2 6-5'/);
  assert.doesNotMatch(iconCss, /M13 5l4 4-4 4/);
  assert.doesNotMatch(iconCss, /M11 7l4-4 4 4/);
  assert.match(source, /Diagram\.prototype\.exportPng = function\(/);
  assert.match(source, /Diagram\.prototype\.print = function\(\)/);
  assert.match(source, /accept = 'application\/json,\.json'/);
  assert.match(source, /self\.export\('fabui-diagram\.json'\)/);
  assert.match(source, /'load',\s*'Load',[\s\S]*?'icon-import'/);
  assert.match(
    iconCss,
    /\.icon-import\s*\{[^}]*theme\/images\/import\.png/s
  );
  assert.match(source, /Diagram\.prototype\.loadJsonFile = function\(\)/);
  assert.match(source, /reader = new FileReader\(\)/);
  assert.match(source, /input\.value = ''/);
  assert.match(source, /self\.import\(String\(reader\.result \|\| ''\)\)/);
  assert.match(source, /self\._fire\('JsonLoaded'/);
  assert.match(source, /self\._fire\('LoadError'/);
  assert.match(source, /this\._jsonFileReader\.abort\(\)/);
  assert.match(
    source,
    /this\.jsonFileInputElement,\s*'change',\s*this\._onJsonFileChange/
  );
  assert.match(
    source,
    /this\._propertyField\(\s*this\.messages\.hyperlink,\s*item,\s*'hyperlink',\s*'text'/
  );
  assert.match(
    source,
    /this\._propertyField\(\s*this\.messages\.hyperlinkTrigger,\s*item,\s*'hyperlinkTrigger',\s*'combo'/
  );
  assert.match(
    source,
    /this\._propertyField\(\s*this\.messages\.fontSize,\s*item,\s*'fontSize',\s*'number'/
  );
  assert.match(source, /Diagram\.prototype\._propertyTextStyle = function\(item\)/);
  assert.match(source, /key: 'fontBold', text: 'B'/);
  assert.match(source, /key: 'fontItalic', text: 'I'/);
  assert.match(source, /key: 'fontUnderline', text: 'U'/);
  assert.match(source, /key: 'fontStrikethrough', text: 'S'/);
  assert.match(
    source,
    /toggle: true,[\s\S]*selected: items\.every\(function\(target\)/
  );
  assert.match(
    source,
    /items\.forEach\(function\(target\)[\s\S]*target\[style\.key\] = event\.selected === true/
  );
  assert.match(source, /Diagram\.prototype\._multiPropertyField/);
  assert.match(source, /Diagram\.prototype\._renderMultiProperties/);
  assert.match(
    source,
    /this\._renderMultiProperties\(selectedNodes\)/
  );
  assert.match(
    source,
    /this\._multiPropertyField\([\s\S]*this\.messages\.fontSize[\s\S]*'fontSize'[\s\S]*this\.messages\.width[\s\S]*'width'[\s\S]*this\.messages\.height[\s\S]*'height'[\s\S]*this\.messages\.fill[\s\S]*'fill'[\s\S]*this\.messages\.stroke[\s\S]*'stroke'/
  );
  assert.match(source, /'data-diagram-node-text': ''/);
  assert.match(source, /normalizeDiagramHyperlink\(node\.hyperlink\)/);
  assert.match(
    source,
    /diagramNodeHyperlinkMatchesTrigger\(node, 'dblclick'\)/
  );
  assert.match(
    source,
    /diagramNodeHyperlinkMatchesTrigger\(node, 'click'\)/
  );
  assert.match(
    source,
    /state\.hyperlinkTrigger === 'click'[\s\S]*?this\._openNodeHyperlink\(node\)/
  );
  assert.match(
    source,
    /window\.open\(url, '_blank', 'noopener,noreferrer'\)/
  );
  assert.match(source, /window\.location\.href = url/);
  assert.match(source, /this\._fire\('HyperlinkClick'/);
  assert.match(source, /Diagram\.prototype\._serializeSvg = function\(includeGrid\)/);
  assert.match(source, /page\.setAttribute\('fill', this\.options\.pageColor\)/);
  assert.match(source, /gridPattern\.parentNode\.removeChild\(gridPattern\)/);
  assert.match(source, /svg = this\._serializeSvg\(false\)/);
  assert.match(source, /document\.createElement\('iframe'\)/);
  assert.match(source, /frameWindow\.addEventListener\('afterprint', cleanup/);
  assert.match(
    source,
    /pageRule = this\.options\.paperSize \+ ' ' \+ this\.options\.paperOrientation/
  );
  assert.match(source, /'<style>@page\{size:' \+ pageRule \+ ';margin:0\}'/);
  assert.match(
    source,
    /'html,body\{box-sizing:border-box;width:100%;height:100%;'/
  );
  assert.match(source, /'body\{display:flex;padding:12mm;align-items:center;'/);
  assert.match(
    source,
    /'svg\{display:block;width:100%!important;height:100%!important;'/
  );
  assert.match(source, /'page-break-inside:avoid\}<\/style><\/head><body>'/);
  assert.doesNotMatch(source, /window\.open\('', '_blank'\)/);
  assert.doesNotMatch(source, /var printWindow/);
  assert.match(
    source,
    /diagramElementIsFullscreen\(this\.viewportElement\)/
  );
  assert.match(
    source,
    /diagramElementIsFullscreen\(this\.hostElement\)/
  );
  assert.match(source, /self\.togglePresentationFullscreen\(\)/);
  assert.match(source, /requestFullscreen\.call\(this\.hostElement\)/);
  assert.match(source, /requestFullscreen\.call\(this\.viewportElement\)/);
  assert.match(source, /self\.fitToPage\(24\)/);
  assert.match(source, /zoomLevel: self\.options\.zoomLevel/);
  assert.match(source, /self\.setZoom\(viewState\.zoomLevel\)/);
  assert.match(source, /new ResizeObserver\(function\(\)/);
  assert.match(source, /diagramElementBorderSize\(self\.viewportElement\)/);
  assert.match(source, /diagramFullscreenSizeChanged\(/);
  assert.match(source, /_fullscreenResizeObserver\.disconnect\(\)/);
  assert.match(source, /'webkitfullscreenchange'/);
  assert.match(source, /this\._contextMenu\.dispose\(\)/);
  assert.doesNotMatch(source, /state\.applyButton|_lastItemClick\.type === 'canvas'/);
  assert.match(source, /new Button\(toggle/);
  assert.match(source, /data-diagram-toolbox-toggle/);
  assert.match(source, /this\.toolboxResizerLeftElement/);
  assert.match(source, /this\.toolboxResizerTopElement/);
  assert.match(source, /this\.propertiesResizerRightElement/);
  assert.match(source, /this\.propertiesResizerBottomElement/);
  assert.match(source, /Diagram\.prototype\._bindPanelResizeInteraction/);
  assert.match(source, /Diagram\.prototype\._unbindPanelResizeInteraction/);
  assert.match(source, /Diagram\.prototype\._resizePanelFromEdge/);
  assert.match(source, /Diagram\.prototype\.setToolboxWidth/);
  assert.match(source, /Diagram\.prototype\.setToolboxHeight/);
  assert.match(source, /Diagram\.prototype\.setPropertiesWidth/);
  assert.match(source, /Diagram\.prototype\.setPropertiesHeight/);
  assert.match(
    source,
    /document\.addEventListener\(\s*'pointermove',\s*this\._onPanelResizePointerMove/
  );
  assert.match(
    source,
    /document\.removeEventListener\(\s*'pointermove',\s*this\._onPanelResizePointerMove/
  );
  assert.match(
    source,
    /event\.type === 'pointercancel'[\s\S]*self\._resizePanelFromEdge\([\s\S]*state\.startWidth/
  );
  assert.match(source, /data-diagram-toolbox-panel-drag/);
  assert.match(source, /Diagram\.prototype\._bindToolboxPanelInteraction/);
  assert.match(source, /Diagram\.prototype\._unbindToolboxPanelInteraction/);
  assert.match(source, /Diagram\.prototype\.floatToolbox/);
  assert.match(source, /Diagram\.prototype\.dockToolbox/);
  assert.match(
    source,
    /state\.dockSide = getDiagramPanelDockSide\([\s\S]*state\.workspaceWidth/
  );
  assert.match(
    source,
    /document\.addEventListener\(\s*'pointermove',\s*this\._onToolboxPanelPointerMove/
  );
  assert.match(
    source,
    /document\.removeEventListener\(\s*'pointermove',\s*this\._onToolboxPanelPointerMove/
  );
  assert.match(source, /data-diagram-properties-panel-drag/);
  assert.match(source, /Diagram\.prototype\._bindPropertiesPanelInteraction/);
  assert.match(source, /Diagram\.prototype\._unbindPropertiesPanelInteraction/);
  assert.match(source, /Diagram\.prototype\.floatProperties/);
  assert.match(source, /Diagram\.prototype\.dockProperties/);
  assert.match(
    source,
    /state\.dockSide = getDiagramPanelDockSide\([\s\S]*state\.workspaceWidth/
  );
  assert.match(
    source,
    /document\.addEventListener\(\s*'pointermove',\s*this\._onPropertiesPanelPointerMove/
  );
  assert.match(
    source,
    /document\.removeEventListener\(\s*'pointermove',\s*this\._onPropertiesPanelPointerMove/
  );
  assert.match(source, /data-diagram-connector-tool/);
  assert.match(source, /self\._createToolboxPreview\(shape\.type\)/);
  assert.match(
    source,
    /var DIAGRAM_TOOLBOX_CATEGORIES = \['general', 'flowchart', 'dfd', 'orgChart'\]/
  );
  assert.match(source, /type: 'orgChartImageLeft'/);
  assert.match(source, /type: 'orgChartImageRight'/);
  assert.match(source, /type: 'orgChartImageTop'/);
  assert.match(source, /Diagram\.prototype\._createOrgChartPreviewLines/);
  assert.match(source, /var textBox = diagramNodeTextBox\(node\)/);
  assert.match(source, /var circular = type === 'dfdProcess'/);
  assert.match(source, /if \(this\._connectMode\) \{[\s\S]*autoConnect: true/);
  assert.match(
    source,
    /state\.autoConnect \?[\s\S]*'\[data-diagram-node\], \[data-node-id\]'/
  );
  assert.match(source, /state\.startPoint = connectionPoints\.start/);
  assert.match(source, /state\.currentPoint = connectionPoints\.end/);
  assert.match(source, /if \(!state\.autoConnect\) \{/);
  assert.match(source, /if \(state\.autoConnect\) this\.setConnectMode\(false\)/);
  assert.match(
    source,
    /self\.options\.toolbox = !self\.options\.toolbox;[\s\S]*self\._syncStructure\(\)/
  );
  assert.match(source, /var toolbox = this\._toolbarButtons\.toolbox/);
  assert.match(
    source,
    /if \(this\.options\.toolbox && !this\.options\.readOnly\) toolbox\.select\(true\)/
  );
  assert.match(source, /this\._bindDocumentInteraction\(\)/);
  assert.match(source, /this\._unbindDocumentInteraction\(\)/);
  assert.match(source, /this\.hostElement\.focus\(\{ preventScroll: true \}\);/);
  assert.match(
    source,
    /this\.addEventListener\(\s*this\.viewportElement,\s*'wheel',\s*this\._onViewportWheel,\s*false,\s*false/
  );
  assert.match(source, /data-diagram-connection-point/);
  assert.match(source, /type: 'marquee'/);
  assert.match(source, /type: 'pan'/);
  assert.match(source, /Diagram\.prototype\._renderGroupSelection/);
  assert.match(source, /'data-diagram-group-resize': ''/);
  assert.match(source, /type: groupResizeHandle \?[\s\S]*'group-resize'/);
  assert.match(
    source,
    /groupResize = calculateDiagramGroupResize\([\s\S]*state\.startNodes[\s\S]*state\.startBounds/
  );
  assert.match(
    source,
    /current\.x = resizedNode\.x;[\s\S]*current\.y = resizedNode\.y;[\s\S]*current\.width = resizedNode\.width;[\s\S]*current\.height = resizedNode\.height/
  );
  assert.match(
    source,
    /startConnector\.controlX - state\.startBounds\.centerX[\s\S]*groupResize\.scale/
  );
  assert.match(source, /startScrollLeft: this\.viewportElement\.scrollLeft/);
  assert.match(
    source,
    /this\.viewportElement\.scrollLeft = state\.startScrollLeft -/
  );
  assert.match(source, /this\._beginConnectorTextEdit\(id\)/);
  assert.match(source, /this\._beginNodeTextEdit\(id\)/);
  assert.match(source, /svgOffset\.x \+ textBox\.x \* zoom/);
  assert.match(source, /svgOffset\.y \+ textBox\.y \* zoom/);
  assert.match(source, /findBestDiagramConnectionPoints\(/);
  assert.match(source, /this\.messages\.arrowDirection/);
  assert.match(source, /'marker-start': connector\.arrowDirection === 'start'/);
  assert.match(source, /'marker-end': connector\.arrowDirection === 'end'/);
  assert.match(source, /Diagram\.prototype\.fitToPage = function\(padding\)/);
  assert.match(source, /type: 'connector-drag'/);
  assert.match(source, /connector\.controlX = this\._snap\(controlX\)/);
  assert.match(source, /connector\.controlY = this\._snap\(controlY\)/);
  assert.equal((
    source.match(
      /svg\.setAttribute\(\s*'viewBox',\s*'0 0 ' \+ this\.options\.pageWidth \+ ' ' \+ this\.options\.pageHeight\s*\)/g
    ) || []
  ).length, 2);
  assert.match(source, /source\.split\(\/\\r\?\\n\/\)/);
  assert.match(source, /new EditBox\(input/);
  assert.match(source, /registerControl\(this\.hostElement, this\)/);
  assert.match(source, /unregisterControl\(this\.hostElement, this\)/);
  assert.match(css, /var\(--fui-panel-bg/);
  assert.match(css, /var\(--fui-control-selected/);
  assert.match(css, /\.fui-diagram-connection-point/);
  assert.match(css, /\.fui-diagram-connector-control/);
  assert.match(
    css,
    /\.fui-diagram-connect-mode \.fui-diagram-viewport \*/
  );
  assert.match(
    iconCss,
    /\.icon-undo\s*\{[^}]*theme\/images\/undo\.png/s
  );
  assert.match(
    iconCss,
    /\.icon-redo\s*\{[^}]*theme\/images\/redo\.png/s
  );
  assert.match(iconCss, /\.icon-drag-vertical/);
  assert.match(
    iconCss,
    /\.icon-drag-vertical\s*\{[^}]*repeating-linear-gradient/s
  );
  assert.doesNotMatch(
    iconCss,
    /\.icon-drag-vertical\s*\{[^}]*radial-gradient/s
  );
  assert.match(
    css,
    /\.fui-diagram-viewport\s*\{[^}]*display: flex;[^}]*overflow: auto;/s
  );
  assert.match(
    css,
    /\.fui-diagram:fullscreen,[\s\S]*\.fui-diagram\.fui-diagram-fullscreen-editor[\s\S]*width: 100vw !important;[\s\S]*height: 100vh !important;/
  );
  assert.match(
    css,
    /\.fui-diagram\s*\{[^}]*outline: 0;/s
  );
  assert.doesNotMatch(
    css,
    /\.fui-diagram:fullscreen > \.fui-diagram-view-toolbar/
  );
  assert.match(
    css,
    /\.fui-diagram-viewport:fullscreen,[\s\S]*\.fui-diagram-viewport\.fui-diagram-fullscreen-presentation[\s\S]*padding: 24px;/
  );
  assert.match(
    css,
    /\.fui-diagram-svg\s*\{[^}]*flex: 0 0 auto;[^}]*margin: auto;/s
  );
  assert.match(css, /\.fui-diagram-marquee/);
  assert.match(css, /\.fui-diagram-viewport\.fui-diagram-viewport-pannable/);
  assert.match(css, /\.fui-diagram-panning \.fui-diagram-viewport/);
  assert.match(css, /\.fui-diagram-inline-text-editor/);
  assert.match(css, /\.fui-diagram-inline-node-editor \.fui-textbox/);
  assert.match(css, /\.fui-diagram-node-editing \.fui-diagram-node-text/);
  assert.match(
    css,
    /\.fui-diagram-node-text-linked\s*\{[^}]*pointer-events: auto;[^}]*cursor: pointer;/s
  );
  assert.doesNotMatch(
    css,
    /\.fui-diagram-node-text,\s*\.fui-diagram-connector-label\s*\{[^}]*font-size:/s
  );
  assert.match(
    css,
    /\.fui-diagram-property-text-style-buttons\s*\{[^}]*display: grid;[^}]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/s
  );
  assert.match(css, /data-diagram-text-style="fontBold"/);
  assert.match(css, /data-diagram-text-style="fontItalic"/);
  assert.match(css, /data-diagram-text-style="fontUnderline"/);
  assert.match(css, /data-diagram-text-style="fontStrikethrough"/);
  assert.match(
    css,
    /\.fui-diagram-group-selection-outline\s*\{[^}]*stroke-dasharray: 7 4;[^}]*pointer-events: none;/s
  );
  assert.match(css, /\.fui-diagram-group-resize-handle/);
  assert.match(css, /\.fui-diagram-toolbox-toggle\.fui-button/);
  assert.match(css, /\.fui-diagram-toolbox-resizer/);
  assert.match(
    css,
    /\.fui-diagram-toolbox\s*\{[^}]*border-right: 1px solid var\(--fui-diagram-border\);[^}]*border-left: 0;/s
  );
  assert.match(
    css,
    /\.fui-diagram-workspace\.fui-diagram-toolbox-right:not\(\s*\.fui-diagram-toolbox-floating\s*\) \.fui-diagram-toolbox\s*\{[^}]*border-right: 0;[^}]*border-left: 1px solid var\(--fui-diagram-border\);/s
  );
  assert.match(css, /\.fui-diagram-properties-resizer/);
  assert.match(
    css,
    /\.fui-diagram-property-pair\s*\{[^}]*display: grid;[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);[^}]*gap: 8px;/s
  );
  assert.match(
    css,
    /\.fui-diagram-panel-resizer\s*\{[^}]*border: 0;[^}]*background: transparent;[^}]*touch-action: none;/s
  );
  assert.match(
    css,
    /\.fui-diagram-panel-resizer-left,\s*\.fui-diagram-panel-resizer-right\s*\{[^}]*width: 6px;[^}]*cursor: col-resize;/s
  );
  assert.match(
    css,
    /\.fui-diagram-panel-resizer-top,\s*\.fui-diagram-panel-resizer-bottom\s*\{[^}]*height: 6px;[^}]*cursor: row-resize;/s
  );
  assert.match(
    css,
    /\.fui-diagram-toolbox > \.fui-diagram-pane-header,\s*\.fui-diagram-properties > \.fui-diagram-pane-header\s*\{[^}]*cursor: grab;/s
  );
  assert.match(css, /\.fui-diagram-toolbox-panel-dragging/);
  assert.match(css, /\.fui-diagram-properties-panel-dragging/);
  assert.match(css, /\.fui-diagram-floating-front-toolbox/);
  assert.match(css, /\.fui-diagram-floating-front-properties/);
  assert.match(css, /\.fui-diagram-same-side-dock-tabs-left/);
  assert.match(css, /\.fui-diagram-same-side-dock-tabs-right/);
  assert.match(css, /\.fui-diagram-same-side-dock-stack-left/);
  assert.match(css, /\.fui-diagram-same-side-dock-stack-right/);
  assert.match(css, /grid-template-areas: "dock-tabs viewport"/);
  assert.match(css, /grid-template-areas: "viewport dock-tabs"/);
  assert.match(css, /grid-template-areas: "dock-stack viewport"/);
  assert.match(css, /grid-template-areas: "viewport dock-stack"/);
  assert.match(
    css,
    /\.fui-diagram-dock-stack > \.fui-diagram-toolbox,[\s\S]*?\.fui-diagram-dock-stack > \.fui-diagram-properties\s*\{[^}]*grid-area: auto;/
  );
  assert.match(css, /\.fui-diagram-dock-tabs\.fui-tabs/);
  assert.match(
    css,
    /\.fui-diagram-dock-tabs\.fui-tabs \.fui-tabs-header\s*\{[^}]*z-index: 5;/s
  );
  assert.match(source, /this\._dockTabs = new Tabs\(this\.dockTabsElement/);
  assert.match(source, /tabPosition: 'bottom'/);
  assert.match(source, /justified: true/);
  assert.match(source, /Diagram\.prototype\._syncDockTabsStructure/);
  assert.match(source, /Diagram\.prototype\._syncDockStackStructure/);
  assert.match(source, /state\.dockTab = this\._sameSideDockTab/);
  assert.match(source, /state\.dockMode = this\.options\.sameSideDockMode/);
  assert.match(source, /snapSize: 'Snap Size'/);
  assert.match(source, /snapSize: '吸附間距'/);
  assert.match(source, /snapSize: '吸附间距'/);
  assert.match(
    source,
    /this\._paperPropertyField\([\s\S]*this\.messages\.snapSize,[\s\S]*'gridSize',[\s\S]*'number'/
  );
  assert.doesNotMatch(source, /snapSizeControl|snapSizeInput/);
  assert.match(source, /gridSize: this\.options\.gridSize/);
  assert.match(source, /page\.gridSize != null/);
  assert.match(
    source,
    /Math\.max\(5, Math\.min\(16, this\.options\.gridSize \* 0\.75\)\)/
  );
  assert.match(
    css,
    /fui-diagram-floating-front-toolbox[\s\S]*?\.fui-diagram-toolbox\s*\{[^}]*z-index: 14;/
  );
  assert.match(
    css,
    /fui-diagram-floating-front-properties[\s\S]*?\.fui-diagram-properties\s*\{[^}]*z-index: 14;/
  );
  assert.match(source, /Diagram\.prototype\._bringFloatingPanelToFront/);
  assert.match(
    source,
    /this\.toolboxElement,\s*'pointerdown',\s*this\._onToolboxPanelPointerDown/
  );
  assert.match(
    source,
    /this\.propertiesElement,\s*'pointerdown',\s*this\._onPropertiesPanelPointerDown/
  );
  assert.match(css, /\.fui-diagram-view-toolbar-dragging/);
  assert.match(
    css,
    /\.fui-diagram-view-toolbar\s*\{[^}]*cursor: grab;[^}]*touch-action: none;/s
  );
  assert.match(
    css,
    /\.fui-diagram-workspace\.fui-diagram-toolbox-floating[\s\S]*\.fui-diagram-toolbox/
  );
  assert.doesNotMatch(css, /\.fui-diagram-toolbox-resizer::after/);
  assert.match(css, /\.fui-diagram-toolbox-dock-preview-left::before/);
  assert.match(css, /\.fui-diagram-toolbox-dock-preview-right::after/);
  assert.match(
    css,
    /\.fui-diagram-workspace\.fui-diagram-properties-floating[\s\S]*\.fui-diagram-properties/
  );
  assert.match(css, /\.fui-diagram-properties-dock-preview-left::before/);
  assert.match(css, /\.fui-diagram-properties-dock-preview-right::after/);
  assert.match(css, /\.fui-diagram-workspace\.fui-diagram-toolbox-right\.fui-diagram-properties-left/);
  assert.match(css, /grid-template-areas: "properties viewport toolbox"/);
  assert.match(css, /grid-template-areas: "toolbox properties viewport"/);
  assert.match(css, /grid-template-areas: "viewport toolbox properties"/);
  assert.match(
    css,
    /\.fui-diagram-workspace\.fui-diagram-properties-left:not\(\s*\.fui-diagram-properties-floating\s*\) \.fui-diagram-properties\s*\{[^}]*border-right: 1px solid var\(--fui-diagram-border\);[^}]*border-left: 0;/s
  );
  assert.match(css, /\.fui-diagram-print-frame/);
  assert.match(css, /var\(--fui-diagram-toolbox-width, 260px\)/);
  assert.match(css, /var\(--fui-diagram-properties-width, 230px\)/);
  assert.match(css, /var\(--fui-diagram-toolbox-height, 520px\)/);
  assert.match(css, /var\(--fui-diagram-properties-height, 520px\)/);
  assert.match(
    source,
    /savedToolboxState = readDiagramToolboxState\([\s\S]*this\.options\.toolboxStateKey/
  );
  assert.match(source, /state\.panels = \{/);
  assert.match(
    source,
    /state\.viewToolbar = \{[\s\S]*left: this\.options\.viewToolbarLeft[\s\S]*top: this\.options\.viewToolbarTop/
  );
  assert.match(source, /savedToolboxState\.viewToolbar/);
  assert.match(source, /savedToolboxState\.paper/);
  assert.match(source, /savedToolboxState\.diagram/);
  assert.match(source, /savedDiagramData = savedToolboxState/);
  assert.match(
    source,
    /this\._data = normalizeDiagramData\(savedDiagramData \|\| \{/
  );
  assert.match(source, /state\.paper = this\.getPaper\(\)/);
  assert.match(source, /state\.diagram = this\.getData\(\)/);
  assert.match(
    source,
    /Diagram\.prototype\._commit = function\(action, detail\)[\s\S]*this\._saveToolboxState\(\)/
  );
  assert.match(
    source,
    /Diagram\.prototype\.undo = function\(\)[\s\S]*this\._saveToolboxState\(\)/
  );
  assert.match(
    source,
    /Diagram\.prototype\.redo = function\(\)[\s\S]*this\._saveToolboxState\(\)/
  );
  assert.match(source, /Diagram\.prototype\._bindViewToolbarInteraction/);
  assert.match(
    source,
    /document\.addEventListener\(\s*'pointermove',\s*this\._onViewToolbarPointerMove/
  );
  assert.match(
    source,
    /document\.removeEventListener\(\s*'pointermove',\s*this\._onViewToolbarPointerMove/
  );
  assert.match(
    source,
    /positionFields\.className = 'fui-diagram-property-pair'[\s\S]*this\.messages\.x[\s\S]*positionFields[\s\S]*this\.messages\.y[\s\S]*positionFields/
  );
  assert.match(
    source,
    /sizeFields\.className = 'fui-diagram-property-pair'[\s\S]*this\.messages\.width[\s\S]*sizeFields[\s\S]*this\.messages\.height[\s\S]*sizeFields/
  );
  assert.match(
    source,
    /properties: \{[\s\S]*width: this\.options\.propertiesWidth[\s\S]*height: this\.options\.propertiesHeight/
  );
  assert.match(source, /savedToolboxState\.panels/);
  assert.match(source, /self\._saveToolboxState\(\)/);
  assert.match(source, /data-diagram-toolbox-drag/);
  assert.match(source, /Diagram\.prototype\._bindToolboxOrderInteraction/);
  assert.match(
    source,
    /document\.addEventListener\(\s*'pointermove',\s*this\._onToolboxOrderPointerMove/
  );
  assert.match(
    source,
    /document\.removeEventListener\(\s*'pointermove',\s*this\._onToolboxOrderPointerMove/
  );
  assert.match(source, /event\.type !== 'pointercancel' && targetCategory/);
  assert.match(source, /state\.order = this\._toolboxOrder\.slice\(\)/);
  assert.match(
    source,
    /self\._moveToolboxGroup\(\s*state\.sourceCategory,\s*targetCategory,\s*after/
  );
  assert.match(source, /'clear',\s*'Clear Page',\s*this\.clearPage/);
  assert.match(source, /Diagram\.prototype\.clearPage = function\(\)/);
  assert.match(source, /this\._commit\('clear', \{/);
  assert.match(
    source,
    /'readOnly',\s*'Read only',\s*function\(\) \{[\s\S]*self\.setReadOnly\(!self\.options\.readOnly\)/
  );
  assert.match(source, /this\.toolbarElement\.hidden = !this\.options\.mainToolbar;/);
  assert.match(source, /if \(this\.options\.readOnly\) readOnlyButton\.select\(true\)/);
  assert.match(source, /var editingDisabled = this\.options\.disabled \|\| this\.options\.readOnly/);
  assert.match(source, /this\._fire\('ReadOnlyChanged', \{[\s\S]*readOnly: this\.options\.readOnly/);
  assert.match(
    css,
    /\.fui-diagram-toolbox-toggle\.fui-button::before\s*\{[^}]*font-size: 20px;/s
  );
  assert.match(css, /\.fui-diagram-toolbox-items\[hidden\]/);
  assert.match(css, /\.fui-diagram-toolbox-preview-shape/);
  assert.match(css, /\.fui-diagram-toolbox-drag-handle\.fui-button/);
  assert.match(css, /\.fui-diagram-toolbox-group-drop-before::before/);
  assert.match(css, /fill: none/);
  assert.doesNotMatch(css, /\.fui-diagram-toolbox-preview-shape \* \{[^}]*stroke:/);
  assert.match(css, /\.fui-diagram-shape-item-selected/);
  assert.match(css, /\.fui-diagram-property-section-title/);
  assert.doesNotMatch(css, /\.fui-diagram-paper-form/);
  assert.doesNotMatch(css, /\.fui-diagram-paper-actions/);
});

test('Diagram demos reproduce the manufacturing process reference layout', function() {
  var devHtml = readFileSync(
    new URL('../demo/dev-diagram.html', import.meta.url),
    'utf8'
  );
  var buildHtml = readFileSync(
    new URL('../demo/diagram.html', import.meta.url),
    'utf8'
  );
  var demoScript = readFileSync(
    new URL('../demo/js/diagram-demo.js', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(devHtml, /centerInitialData/);
  assert.doesNotMatch(buildHtml, /centerInitialData/);
  assert.match(devHtml, /id="diagram-dock-mode"/);
  assert.match(buildHtml, /id="diagram-dock-mode"/);
  assert.doesNotMatch(demoScript, /function centerDiagramDataOnPaper/);
  assert.match(
    demoScript,
    /id: 'title',[\s\S]*?text: '生產製造流程',[\s\S]*?fontSize: 28,[\s\S]*?fontUnderline: true/
  );
  assert.match(demoScript, /id: 'customer-order',[\s\S]*?type: 'dfdDataStore'/);
  assert.match(demoScript, /id: 'manufacturing-order',[\s\S]*?type: 'dfdProcess'/);
  assert.match(demoScript, /id: 'warehouse-issue',[\s\S]*?type: 'dfdProcess'/);
  assert.match(demoScript, /id: 'production-operation',[\s\S]*?type: 'dfdProcess'/);
  assert.match(demoScript, /id: 'finished-stock',[\s\S]*?type: 'dfdProcess'/);
  assert.equal((demoScript.match(/type: 'dfdProcess'/g) || []).length, 4);
  assert.equal((demoScript.match(/width: 106,\n\s+height: 106/g) || []).length, 4);
  assert.match(demoScript, /id: 'manufacturing-details',[\s\S]*?type: 'dfdDataStore'/);
  assert.match(demoScript, /id: 'close-order',[\s\S]*?type: 'text'/);
  assert.match(
    demoScript,
    /id: 'c1',[\s\S]*?from: 'customer-order',[\s\S]*?to: 'manufacturing-order',[\s\S]*?text: 'Email或傳真'/
  );
  assert.match(demoScript, /from: 'production-progress',[\s\S]*?to: 'production-operation'/);
  assert.equal((demoScript.match(/type: 'sCurve'/g) || []).length, 9);
  assert.doesNotMatch(demoScript, /type: 'curved'/);
  assert.match(demoScript, /showGrid:\s*false/);
  assert.doesNotMatch(demoScript, /text: '收到訂單'/);
  assert.match(demoScript, /onReadOnlyChanged: function\(instance, event\)/);
  assert.match(demoScript, /syncReadOnlyControl\(event\.readOnly\)/);
  assert.match(
    demoScript,
    /diagram\.setSameSideDockMode\(dockModeSelect\.value\)/
  );
  assert.match(demoScript, /diagram\.setData\(demoData\)/);
  assert.match(
    demoScript,
    /toolboxStateKey:\s*'fabui\.diagram\.demo\.toolbox'/
  );
});

test('Diagram is wired into future browser and CSS builds', function() {
  var build = readFileSync(
    new URL('../build/build.cjs', import.meta.url),
    'utf8'
  );
  var diagramBuild = readFileSync(
    new URL('../build/build-diagram.cjs', import.meta.url),
    'utf8'
  );
  var javascriptEntry = readFileSync(
    new URL('../src/fabui.js', import.meta.url),
    'utf8'
  );
  var cssEntry = readFileSync(
    new URL('../src/fabui.css', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(build, /'diagram\/diagram\.js'/);
  assert.doesNotMatch(build, /global\.fabui\.Diagram/);
  assert.match(
    diagramBuild,
    /global\.fabui\.Diagram = createDiagramFactory/
  );
  assert.match(diagramBuild, /Load fabui\.js before diagram\.js\./);
  assert.doesNotMatch(diagramBuild, /global\.fabui\.Window/);
  assert.match(diagramBuild, /'diagram\.min\.css'/);
  assert.match(javascriptEntry, /Diagram: Diagram/);
  assert.match(cssEntry, /diagram\/diagram\.css/);
});
