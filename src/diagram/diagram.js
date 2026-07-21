var DIAGRAM_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];
var DIAGRAM_SVG_NS = 'http://www.w3.org/2000/svg';
var nextDiagramItemId = 1;
var nextDiagramInstanceId = 1;
var DIAGRAM_PAPER_SIZES = {
  A3: { width: 1123, height: 1587 },
  A4: { width: 794, height: 1123 },
  A5: { width: 559, height: 794 },
  Letter: { width: 816, height: 1056 },
  Legal: { width: 816, height: 1344 }
};
var DIAGRAM_SHAPES = [
  { type: 'text', category: 'general', label: 'textShape' },
  { type: 'rectangle', category: 'general', label: 'rectangle' },
  { type: 'ellipse', category: 'general', label: 'ellipse' },
  { type: 'cross', category: 'general', label: 'cross' },
  { type: 'triangle', category: 'general', label: 'triangle' },
  { type: 'diamond', category: 'general', label: 'diamond' },
  { type: 'heart', category: 'general', label: 'heart' },
  { type: 'pentagon', category: 'general', label: 'pentagon' },
  { type: 'hexagon', category: 'general', label: 'hexagon' },
  { type: 'octagon', category: 'general', label: 'octagon' },
  { type: 'star', category: 'general', label: 'star' },
  { type: 'arrowUp', category: 'general', label: 'arrowUp' },
  { type: 'arrowDown', category: 'general', label: 'arrowDown' },
  { type: 'arrowLeft', category: 'general', label: 'arrowLeft' },
  { type: 'arrowRight', category: 'general', label: 'arrowRight' },
  { type: 'arrowUpDown', category: 'general', label: 'arrowUpDown' },
  { type: 'arrowLeftRight', category: 'general', label: 'arrowLeftRight' },
  { type: 'roundedRectangle', category: 'general', label: 'roundedRectangle' },
  { type: 'cloud', category: 'general', label: 'cloud' },
  { type: 'process', category: 'flowchart', label: 'process' },
  { type: 'decision', category: 'flowchart', label: 'decision' },
  { type: 'terminator', category: 'flowchart', label: 'terminator' },
  { type: 'predefinedProcess', category: 'flowchart', label: 'predefinedProcess' },
  { type: 'document', category: 'flowchart', label: 'document' },
  { type: 'multipleDocuments', category: 'flowchart', label: 'multipleDocuments' },
  { type: 'manualInput', category: 'flowchart', label: 'manualInput' },
  { type: 'preparation', category: 'flowchart', label: 'preparation' },
  { type: 'data', category: 'flowchart', label: 'dataShape' },
  { type: 'database', category: 'flowchart', label: 'database' },
  { type: 'directData', category: 'flowchart', label: 'directData' },
  { type: 'internalStorage', category: 'flowchart', label: 'internalStorage' },
  { type: 'paperTape', category: 'flowchart', label: 'paperTape' },
  { type: 'manualOperation', category: 'flowchart', label: 'manualOperation' },
  { type: 'delay', category: 'flowchart', label: 'delay' },
  { type: 'storedData', category: 'flowchart', label: 'storedData' },
  { type: 'sequentialData', category: 'flowchart', label: 'sequentialData' },
  { type: 'merge', category: 'flowchart', label: 'merge' },
  { type: 'onPageReference', category: 'flowchart', label: 'onPageReference' },
  { type: 'summingJunction', category: 'flowchart', label: 'summingJunction' },
  { type: 'orJunction', category: 'flowchart', label: 'orJunction' },
  { type: 'display', category: 'flowchart', label: 'display' },
  {
    type: 'dfdEntity',
    category: 'dfd',
    label: 'dfdEntity',
    width: 140,
    height: 70
  },
  {
    type: 'dfdProcess',
    category: 'dfd',
    label: 'dfdProcess',
    width: 100,
    height: 100
  },
  {
    type: 'dfdDataStore',
    category: 'dfd',
    label: 'dfdDataStore',
    width: 140,
    height: 60
  },
  {
    type: 'orgChartImageLeft',
    category: 'orgChart',
    label: 'orgChartImageLeft',
    width: 180,
    height: 80
  },
  {
    type: 'orgChartImageRight',
    category: 'orgChart',
    label: 'orgChartImageRight',
    width: 180,
    height: 80
  },
  {
    type: 'orgChartImageTop',
    category: 'orgChart',
    label: 'orgChartImageTop',
    width: 110,
    height: 150
  }
];
var DIAGRAM_CONNECTOR_TOOLS = [
  {
    type: 'dfdDataFlow',
    category: 'dfd',
    label: 'dfdDataFlow',
    connectorType: 'curved'
  },
  {
    type: 'dfdSCurve',
    category: 'dfd',
    label: 'dfdSCurve',
    connectorType: 'sCurve'
  }
];
var DIAGRAM_TOOLBOX_ITEMS = DIAGRAM_SHAPES.concat(DIAGRAM_CONNECTOR_TOOLS);
var DIAGRAM_TOOLBOX_CATEGORIES = ['general', 'flowchart', 'dfd', 'orgChart'];
var DIAGRAM_TOOLBOX_COLLAPSED_DEFAULTS = {
  general: false,
  flowchart: true,
  dfd: true,
  orgChart: true
};
var DIAGRAM_CONNECTION_POINTS = [
  { name: 'top', x: 0.5, y: 0 },
  { name: 'rightTop', x: 1, y: 1 / 3 },
  { name: 'rightBottom', x: 1, y: 2 / 3 },
  { name: 'bottom', x: 0.5, y: 1 },
  { name: 'leftBottom', x: 0, y: 2 / 3 },
  { name: 'leftTop', x: 0, y: 1 / 3 }
];

function diagramAssign(target) {
  var source;
  var key;
  var index;
  for (index = 1; index < arguments.length; index += 1) {
    source = arguments[index] || {};
    for (key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
    }
  }
  return target;
}

function diagramNumber(value, fallback) {
  value = Number(value);
  return isFinite(value) ? value : fallback;
}

function diagramCommonProperty(items, key) {
  var value = items.length ? items[0][key] : '';
  var index;
  for (index = 1; index < items.length; index += 1) {
    if (items[index][key] !== value) {
      return { mixed: true, value: '' };
    }
  }
  return { mixed: false, value: value };
}

function diagramBoolean(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    value = value.trim().toLowerCase();
    if (value === 'false' || value === '0' || value === 'no') return false;
    if (value === 'true' || value === '1' || value === 'yes' || value === '') return true;
  }
  return Boolean(value);
}

export function diagramEventTargetsInteractiveControl(event, boundary) {
  var target = event && event.target;
  var tagName;
  var role;
  var contentEditable;
  while (target && target !== boundary) {
    tagName = String(target.tagName || '').toLowerCase();
    if (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      tagName === 'option' ||
      tagName === 'button' ||
      tagName === 'a'
    ) return true;
    if (target.isContentEditable) return true;
    if (typeof target.getAttribute === 'function') {
      contentEditable = target.getAttribute('contenteditable');
      if (
        contentEditable != null &&
        (
          String(contentEditable).toLowerCase() === '' ||
          String(contentEditable).toLowerCase() === 'true' ||
          String(contentEditable).toLowerCase() === 'plaintext-only'
        )
      ) return true;
      role = String(target.getAttribute('role') || '').toLowerCase();
      if (
        role === 'textbox' ||
        role === 'combobox' ||
        role === 'spinbutton' ||
        role === 'button' ||
        role === 'link' ||
        role === 'checkbox' ||
        role === 'radio' ||
        role === 'slider'
      ) return true;
    }
    target = target.parentElement;
  }
  return false;
}

function normalizeDiagramToolboxCollapsed(value, fallback) {
  var result = diagramAssign(
    {},
    DIAGRAM_TOOLBOX_COLLAPSED_DEFAULTS,
    fallback && typeof fallback === 'object' ? fallback : {}
  );
  value = value && typeof value === 'object' ? value : {};
  DIAGRAM_TOOLBOX_CATEGORIES.forEach(function(category) {
    if (Object.prototype.hasOwnProperty.call(value, category)) {
      result[category] = diagramBoolean(value[category], result[category]);
    }
  });
  return result;
}

export function normalizeDiagramToolboxOrder(value, fallback) {
  var result = [];
  function append(categories) {
    if (!Array.isArray(categories)) return;
    categories.forEach(function(category) {
      category = String(category || '');
      if (
        DIAGRAM_TOOLBOX_CATEGORIES.indexOf(category) >= 0 &&
        result.indexOf(category) < 0
      ) {
        result.push(category);
      }
    });
  }
  append(value);
  append(fallback);
  append(DIAGRAM_TOOLBOX_CATEGORIES);
  return result;
}

export function reorderDiagramToolboxOrder(
  order,
  sourceCategory,
  targetCategory,
  after
) {
  var result = normalizeDiagramToolboxOrder(order);
  var sourceIndex = result.indexOf(String(sourceCategory || ''));
  var targetIndex;
  if (sourceIndex < 0) return result;
  result.splice(sourceIndex, 1);
  targetIndex = result.indexOf(String(targetCategory || ''));
  if (targetIndex < 0) {
    result.splice(sourceIndex, 0, String(sourceCategory));
    return result;
  }
  result.splice(targetIndex + (after ? 1 : 0), 0, String(sourceCategory));
  return result;
}

export function constrainDiagramFloatingToolbox(
  left,
  top,
  width,
  height,
  workspaceWidth,
  workspaceHeight
) {
  width = Math.max(0, diagramNumber(width, 0));
  height = Math.max(0, diagramNumber(height, 0));
  workspaceWidth = Math.max(0, diagramNumber(workspaceWidth, 0));
  workspaceHeight = Math.max(0, diagramNumber(workspaceHeight, 0));
  return {
    left: diagramClamp(
      diagramNumber(left, 0),
      0,
      Math.max(0, workspaceWidth - width)
    ),
    top: diagramClamp(
      diagramNumber(top, 0),
      0,
      Math.max(0, workspaceHeight - height)
    )
  };
}

export function constrainDiagramViewToolbar(
  left,
  top,
  width,
  height,
  hostWidth,
  hostHeight
) {
  return constrainDiagramFloatingToolbox(
    left,
    top,
    width,
    height,
    hostWidth,
    hostHeight
  );
}

export function diagramViewportCanPan(
  scrollWidth,
  scrollHeight,
  clientWidth,
  clientHeight
) {
  return diagramNumber(scrollWidth, 0) > diagramNumber(clientWidth, 0) + 1 ||
    diagramNumber(scrollHeight, 0) > diagramNumber(clientHeight, 0) + 1;
}

export function diagramToolboxShouldDock(clientX, workspaceLeft, threshold) {
  threshold = Math.max(0, diagramNumber(threshold, 56));
  return diagramNumber(clientX, Infinity) <=
    diagramNumber(workspaceLeft, 0) + threshold;
}

export function diagramPropertiesShouldDock(
  clientX,
  workspaceLeft,
  workspaceWidth,
  threshold
) {
  threshold = Math.max(0, diagramNumber(threshold, 56));
  return diagramNumber(clientX, -Infinity) >=
    diagramNumber(workspaceLeft, 0) +
    Math.max(0, diagramNumber(workspaceWidth, 0)) -
    threshold;
}

export function normalizeDiagramDockSide(value, fallback) {
  value = String(value || '').toLowerCase();
  if (value === 'left' || value === 'right') return value;
  fallback = String(fallback || '').toLowerCase();
  return fallback === 'right' ? 'right' : 'left';
}

export function normalizeDiagramSameSideDockMode(value) {
  return String(value || '').toLowerCase() === 'stacked' ?
    'stacked' :
    'tabs';
}

export function getDiagramPanelDockSide(
  clientX,
  workspaceLeft,
  workspaceWidth,
  threshold
) {
  if (diagramToolboxShouldDock(clientX, workspaceLeft, threshold)) {
    return 'left';
  }
  if (diagramPropertiesShouldDock(
    clientX,
    workspaceLeft,
    workspaceWidth,
    threshold
  )) {
    return 'right';
  }
  return '';
}

function readDiagramToolboxState(key) {
  var value;
  if (!key || typeof window === 'undefined') return null;
  try {
    value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
}

function writeDiagramToolboxState(key, value) {
  if (!key || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    return;
  }
}

function diagramClamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function diagramClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function diagramSize(value, fallback) {
  if (value == null || value === '') value = fallback;
  return typeof value === 'number' ? value + 'px' : String(value);
}

function normalizeDiagramPaperSize(value) {
  value = String(value || 'A4');
  return DIAGRAM_PAPER_SIZES[value] ? value : 'A4';
}

function normalizeDiagramPaperOrientation(value) {
  return String(value || '').toLowerCase() === 'portrait' ?
    'portrait' :
    'landscape';
}

function getDiagramPaperDimensions(size, orientation) {
  var definition = DIAGRAM_PAPER_SIZES[normalizeDiagramPaperSize(size)];
  orientation = normalizeDiagramPaperOrientation(orientation);
  return orientation === 'landscape' ? {
    width: definition.height,
    height: definition.width
  } : {
    width: definition.width,
    height: definition.height
  };
}

function resolveDiagramElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function restoreDiagramAttribute(element, name, value) {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

function createDiagramSvgElement(name, attributes) {
  var element = document.createElementNS(DIAGRAM_SVG_NS, name);
  var key;
  attributes = attributes || {};
  for (key in attributes) {
    if (Object.prototype.hasOwnProperty.call(attributes, key)) {
      element.setAttribute(key, String(attributes[key]));
    }
  }
  return element;
}

function diagramItemId(prefix) {
  var id = prefix + nextDiagramItemId;
  nextDiagramItemId += 1;
  return id;
}

function diagramElementIsFullscreen(element) {
  var activeElement = document.fullscreenElement ||
    document.webkitFullscreenElement ||
    null;
  if (activeElement) return activeElement === element;
  if (!element || typeof element.matches !== 'function') return false;
  try {
    if (element.matches(':fullscreen')) return true;
  } catch (error) {
    // Ignore unsupported fullscreen selectors.
  }
  try {
    return element.matches(':-webkit-full-screen');
  } catch (error) {
    return false;
  }
}

function diagramElementBorderSize(element) {
  var rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height
  };
}

function diagramOnNextFrame(callback) {
  var requestFrame = window.requestAnimationFrame || function(handler) {
    return setTimeout(handler, 0);
  };
  return requestFrame.call(window, callback);
}

function normalizeDiagramShapeType(value) {
  value = String(value || 'rectangle');
  return DIAGRAM_SHAPES.some(function(shape) {
    return shape.type === value;
  }) ? value : 'rectangle';
}

function normalizeDiagramFontSize(value) {
  return Math.min(96, Math.max(8, diagramNumber(value, 14)));
}

function diagramTextDecoration(item, hyperlink) {
  var decorations = [];
  if (item.fontUnderline || hyperlink) decorations.push('underline');
  if (item.fontStrikethrough) decorations.push('line-through');
  return decorations.join(' ');
}

function normalizeDiagramNode(node, index) {
  var result = diagramAssign({}, node || {});
  result.id = String(result.id == null || result.id === '' ?
    diagramItemId('node-') :
    result.id);
  result.type = normalizeDiagramShapeType(result.type);
  result.text = String(result.text == null ? ('Node ' + (index + 1)) : result.text);
  result.x = diagramNumber(result.x, 80 + (index % 4) * 190);
  result.y = diagramNumber(result.y, 70 + Math.floor(index / 4) * 130);
  result.width = Math.max(40, diagramNumber(result.width, 140));
  result.height = Math.max(30, diagramNumber(result.height, 72));
  result.fill = String(result.fill || '#ffffff');
  result.stroke = String(result.stroke || '#5b6b7c');
  result.strokeWidth = Math.max(1, diagramNumber(result.strokeWidth, 1.5));
  result.textColor = String(result.textColor || '#1f2937');
  result.fontSize = normalizeDiagramFontSize(result.fontSize);
  result.fontBold = result.fontBold === true;
  result.fontItalic = result.fontItalic === true;
  result.fontUnderline = result.fontUnderline === true;
  result.fontStrikethrough = result.fontStrikethrough === true;
  result.hyperlink = String(result.hyperlink || '').trim();
  result.hyperlinkTrigger = normalizeDiagramHyperlinkTrigger(
    result.hyperlinkTrigger
  );
  return result;
}

function normalizeDiagramConnector(connector, index) {
  var result = diagramAssign({}, connector || {});
  var controlX = Number(result.controlX);
  var controlY = Number(result.controlY);
  result.id = String(result.id == null || result.id === '' ?
    diagramItemId('connector-') :
    result.id);
  result.from = String(result.from == null ? '' : result.from);
  result.to = String(result.to == null ? '' : result.to);
  result.fromPoint = normalizeDiagramConnectionPoint(result.fromPoint);
  result.toPoint = normalizeDiagramConnectionPoint(result.toPoint);
  result.type = ['straight', 'curved', 'sCurve'].indexOf(result.type) >= 0 ?
    result.type :
    'orthogonal';
  result.text = String(result.text == null ? '' : result.text);
  result.stroke = String(result.stroke || '#4b5563');
  result.strokeWidth = Math.max(1, diagramNumber(result.strokeWidth, 1.5));
  result.fontSize = normalizeDiagramFontSize(result.fontSize);
  result.fontBold = result.fontBold === true;
  result.fontItalic = result.fontItalic === true;
  result.fontUnderline = result.fontUnderline === true;
  result.fontStrikethrough = result.fontStrikethrough === true;
  result.lineStyle = result.lineStyle === 'dashed' ? 'dashed' : 'solid';
  result.arrowDirection = [
    'none',
    'end',
    'start',
    'both'
  ].indexOf(result.arrowDirection) >= 0 ?
    result.arrowDirection :
    'end';
  if (
    result.controlX != null &&
    result.controlY != null &&
    isFinite(controlX) &&
    isFinite(controlY)
  ) {
    result.controlX = controlX;
    result.controlY = controlY;
  } else {
    delete result.controlX;
    delete result.controlY;
  }
  result._index = index;
  return result;
}

export function normalizeDiagramData(data) {
  var nodes = Array.isArray(data) ? data : data && Array.isArray(data.nodes) ? data.nodes : [];
  var connectors = data && Array.isArray(data.connectors) ?
    data.connectors :
    data && Array.isArray(data.edges) ? data.edges : [];
  var normalizedNodes = nodes.map(normalizeDiagramNode);
  var nodeIds = Object.create(null);
  normalizedNodes.forEach(function(node) {
    nodeIds[node.id] = true;
  });
  return {
    nodes: normalizedNodes,
    connectors: connectors.map(normalizeDiagramConnector).filter(function(connector) {
      return nodeIds[connector.from] && nodeIds[connector.to] && connector.from !== connector.to;
    }).map(function(connector) {
      delete connector._index;
      return connector;
    })
  };
}

export function normalizeDiagramTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return DIAGRAM_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

export function normalizeDiagramLocale(value) {
  value = String(value || 'en').trim().replace(/_/g, '-');
  if (/^zh-(?:TW|Hant)(?:-|$)/i.test(value)) return 'zh-TW';
  if (/^zh-(?:CN|Hans)(?:-|$)/i.test(value) || /^zh$/i.test(value)) return 'zh-CN';
  return 'en';
}

export function normalizeDiagramHyperlink(value) {
  var source = String(value == null ? '' : value).trim();
  if (!source) return '';
  if (/^(?:https?:|mailto:|tel:|javascript:)/i.test(source)) return source;
  if (/^[a-z][a-z0-9+.-]*:/i.test(source)) return '';
  if (/^(?:\/|\.\/|\.\.\/|#|\?)/.test(source)) return source;
  return 'https://' + source;
}

export function normalizeDiagramHyperlinkTrigger(value) {
  return String(value || '').toLowerCase() === 'dblclick' ?
    'dblclick' :
    'click';
}

export function diagramNodeHyperlinkMatchesTrigger(node, trigger) {
  return Boolean(normalizeDiagramHyperlink(node && node.hyperlink)) &&
    normalizeDiagramHyperlinkTrigger(node && node.hyperlinkTrigger) ===
      normalizeDiagramHyperlinkTrigger(trigger);
}

function findDiagramTheme(element) {
  var current = resolveDiagramElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < DIAGRAM_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + DIAGRAM_THEMES[index])) {
        return DIAGRAM_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

function diagramNodeCenter(node) {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2
  };
}

function diagramNodeTextBox(node) {
  var imageOnLeft = node.type === 'orgChartImageLeft';
  var imageOnRight = node.type === 'orgChartImageRight';
  var imageOnTop = node.type === 'orgChartImageTop';
  var width = imageOnLeft || imageOnRight ?
    node.width * 0.52 :
    imageOnTop ?
      node.width * 0.82 :
      node.width;
  var height = imageOnTop ? node.height * 0.36 : node.height;
  return {
    x: imageOnLeft ?
      node.x + node.width * 0.69 :
      imageOnRight ?
        node.x + node.width * 0.31 :
        node.x + node.width / 2,
    y: imageOnTop ?
      node.y + node.height * 0.76 :
      node.y + node.height / 2,
    width: width,
    height: height
  };
}

function diagramShapePolygon(node) {
  var x = node.x;
  var y = node.y;
  var width = node.width;
  var height = node.height;
  var centerX = x + width / 2;
  var centerY = y + height / 2;
  var points;
  var index;
  var angle;
  var radius;
  if (node.type === 'triangle') {
    return [
      { x: centerX, y: y },
      { x: x + width, y: y + height },
      { x: x, y: y + height }
    ];
  }
  if (node.type === 'decision' || node.type === 'diamond') {
    return [
      { x: centerX, y: y },
      { x: x + width, y: centerY },
      { x: centerX, y: y + height },
      { x: x, y: centerY }
    ];
  }
  if (node.type === 'pentagon') {
    return [
      { x: centerX, y: y },
      { x: x + width, y: y + height * 0.38 },
      { x: x + width * 0.82, y: y + height },
      { x: x + width * 0.18, y: y + height },
      { x: x, y: y + height * 0.38 }
    ];
  }
  if (node.type === 'heart') {
    return [
      { x: centerX, y: y + height * 0.22 },
      { x: x + width * 0.68, y: y },
      { x: x + width * 0.92, y: y + height * 0.05 },
      { x: x + width, y: y + height * 0.25 },
      { x: x + width * 0.95, y: y + height * 0.48 },
      { x: centerX, y: y + height },
      { x: x + width * 0.05, y: y + height * 0.48 },
      { x: x, y: y + height * 0.25 },
      { x: x + width * 0.08, y: y + height * 0.05 },
      { x: x + width * 0.32, y: y }
    ];
  }
  if (node.type === 'hexagon' || node.type === 'preparation') {
    return [
      { x: x + width * 0.2, y: y },
      { x: x + width * 0.8, y: y },
      { x: x + width, y: centerY },
      { x: x + width * 0.8, y: y + height },
      { x: x + width * 0.2, y: y + height },
      { x: x, y: centerY }
    ];
  }
  if (node.type === 'octagon') {
    return [
      { x: x + width * 0.28, y: y },
      { x: x + width * 0.72, y: y },
      { x: x + width, y: y + height * 0.28 },
      { x: x + width, y: y + height * 0.72 },
      { x: x + width * 0.72, y: y + height },
      { x: x + width * 0.28, y: y + height },
      { x: x, y: y + height * 0.72 },
      { x: x, y: y + height * 0.28 }
    ];
  }
  if (node.type === 'star') {
    points = [];
    for (index = 0; index < 10; index += 1) {
      angle = -Math.PI / 2 + index * Math.PI / 5;
      radius = index % 2 === 0 ? 1 : 0.42;
      points.push({
        x: centerX + Math.cos(angle) * width / 2 * radius,
        y: centerY + Math.sin(angle) * height / 2 * radius
      });
    }
    return points;
  }
  if (node.type === 'cross') {
    return [
      { x: x + width * 0.35, y: y },
      { x: x + width * 0.65, y: y },
      { x: x + width * 0.65, y: y + height * 0.35 },
      { x: x + width, y: y + height * 0.35 },
      { x: x + width, y: y + height * 0.65 },
      { x: x + width * 0.65, y: y + height * 0.65 },
      { x: x + width * 0.65, y: y + height },
      { x: x + width * 0.35, y: y + height },
      { x: x + width * 0.35, y: y + height * 0.65 },
      { x: x, y: y + height * 0.65 },
      { x: x, y: y + height * 0.35 },
      { x: x + width * 0.35, y: y + height * 0.35 }
    ];
  }
  if (node.type === 'arrowLeft') {
    return [
      { x: x, y: centerY },
      { x: x + width * 0.42, y: y },
      { x: x + width * 0.42, y: y + height * 0.3 },
      { x: x + width, y: y + height * 0.3 },
      { x: x + width, y: y + height * 0.7 },
      { x: x + width * 0.42, y: y + height * 0.7 },
      { x: x + width * 0.42, y: y + height }
    ];
  }
  if (node.type === 'arrowRight') {
    return [
      { x: x + width, y: centerY },
      { x: x + width * 0.58, y: y },
      { x: x + width * 0.58, y: y + height * 0.3 },
      { x: x, y: y + height * 0.3 },
      { x: x, y: y + height * 0.7 },
      { x: x + width * 0.58, y: y + height * 0.7 },
      { x: x + width * 0.58, y: y + height }
    ];
  }
  if (node.type === 'arrowUp') {
    return [
      { x: centerX, y: y },
      { x: x + width, y: y + height * 0.42 },
      { x: x + width * 0.65, y: y + height * 0.42 },
      { x: x + width * 0.65, y: y + height },
      { x: x + width * 0.35, y: y + height },
      { x: x + width * 0.35, y: y + height * 0.42 },
      { x: x, y: y + height * 0.42 }
    ];
  }
  if (node.type === 'arrowDown') {
    return [
      { x: x + width * 0.35, y: y },
      { x: x + width * 0.65, y: y },
      { x: x + width * 0.65, y: y + height * 0.58 },
      { x: x + width, y: y + height * 0.58 },
      { x: centerX, y: y + height },
      { x: x, y: y + height * 0.58 },
      { x: x + width * 0.35, y: y + height * 0.58 }
    ];
  }
  if (node.type === 'arrowUpDown') {
    return [
      { x: centerX, y: y },
      { x: x + width, y: y + height * 0.28 },
      { x: x + width * 0.65, y: y + height * 0.28 },
      { x: x + width * 0.65, y: y + height * 0.72 },
      { x: x + width, y: y + height * 0.72 },
      { x: centerX, y: y + height },
      { x: x, y: y + height * 0.72 },
      { x: x + width * 0.35, y: y + height * 0.72 },
      { x: x + width * 0.35, y: y + height * 0.28 },
      { x: x, y: y + height * 0.28 }
    ];
  }
  if (node.type === 'arrowLeftRight') {
    return [
      { x: x, y: centerY },
      { x: x + width * 0.28, y: y },
      { x: x + width * 0.28, y: y + height * 0.35 },
      { x: x + width * 0.72, y: y + height * 0.35 },
      { x: x + width * 0.72, y: y },
      { x: x + width, y: centerY },
      { x: x + width * 0.72, y: y + height },
      { x: x + width * 0.72, y: y + height * 0.65 },
      { x: x + width * 0.28, y: y + height * 0.65 },
      { x: x + width * 0.28, y: y + height }
    ];
  }
  if (node.type === 'data' || node.type === 'manualInput') {
    return [
      {
        x: x + width * (node.type === 'manualInput' ? 0.18 : 0.15),
        y: y
      },
      { x: x + width, y: y },
      {
        x: x + width * (node.type === 'manualInput' ? 1 : 0.85),
        y: y + height
      },
      { x: x, y: y + height }
    ];
  }
  if (node.type === 'manualOperation') {
    return [
      { x: x, y: y },
      { x: x + width, y: y },
      { x: x + width * 0.82, y: y + height },
      { x: x + width * 0.18, y: y + height }
    ];
  }
  if (node.type === 'merge') {
    return [
      { x: x, y: y },
      { x: x + width, y: y },
      { x: centerX, y: y + height }
    ];
  }
  if (node.type === 'paperTape') {
    return [
      { x: x, y: y + height * 0.18 },
      { x: x + width * 0.25, y: y + height * 0.08 },
      { x: x + width * 0.5, y: y + height * 0.18 },
      { x: x + width * 0.75, y: y + height * 0.28 },
      { x: x + width, y: y + height * 0.18 },
      { x: x + width, y: y + height * 0.82 },
      { x: x + width * 0.75, y: y + height * 0.72 },
      { x: x + width * 0.5, y: y + height * 0.82 },
      { x: x + width * 0.25, y: y + height * 0.92 },
      { x: x, y: y + height * 0.82 }
    ];
  }
  if (node.type === 'storedData') {
    return [
      { x: x + width * 0.12, y: y },
      { x: x + width * 0.88, y: y },
      { x: x + width, y: centerY },
      { x: x + width * 0.88, y: y + height },
      { x: x + width * 0.12, y: y + height },
      { x: x, y: centerY }
    ];
  }
  if (node.type === 'display') {
    return [
      { x: x + width * 0.16, y: y },
      { x: x + width * 0.72, y: y },
      { x: x + width, y: centerY },
      { x: x + width * 0.72, y: y + height },
      { x: x + width * 0.16, y: y + height },
      { x: x, y: centerY }
    ];
  }
  if (node.type === 'delay') {
    return [
      { x: x, y: y },
      { x: x + width * 0.56, y: y },
      { x: x + width * 0.83, y: y + height * 0.08 },
      { x: x + width, y: centerY },
      { x: x + width * 0.83, y: y + height * 0.92 },
      { x: x + width * 0.56, y: y + height },
      { x: x, y: y + height }
    ];
  }
  if (node.type === 'document') {
    return [
      { x: x, y: y },
      { x: x + width, y: y },
      { x: x + width, y: y + height * 0.82 },
      { x: x + width * 0.75, y: y + height * 0.73 },
      { x: x + width * 0.5, y: y + height * 0.82 },
      { x: x + width * 0.25, y: y + height * 0.91 },
      { x: x, y: y + height * 0.82 }
    ];
  }
  return null;
}

function diagramRayPolygonIntersection(center, target, points) {
  var rayX = target.x - center.x;
  var rayY = target.y - center.y;
  var result = null;
  var bestDistance = Infinity;
  var index;
  var start;
  var end;
  var edgeX;
  var edgeY;
  var offsetX;
  var offsetY;
  var denominator;
  var distance;
  var edgePosition;
  for (index = 0; index < points.length; index += 1) {
    start = points[index];
    end = points[(index + 1) % points.length];
    edgeX = end.x - start.x;
    edgeY = end.y - start.y;
    offsetX = start.x - center.x;
    offsetY = start.y - center.y;
    denominator = rayX * edgeY - rayY * edgeX;
    if (Math.abs(denominator) < 0.000001) continue;
    distance = (offsetX * edgeY - offsetY * edgeX) / denominator;
    edgePosition = (offsetX * rayY - offsetY * rayX) / denominator;
    if (
      distance >= 0 &&
      edgePosition >= 0 &&
      edgePosition <= 1 &&
      distance < bestDistance
    ) {
      bestDistance = distance;
      result = {
        x: center.x + rayX * distance,
        y: center.y + rayY * distance
      };
    }
  }
  return result;
}

export function getDiagramShapeBoundaryPoint(node, target) {
  var center = diagramNodeCenter(node);
  var dx = target.x - center.x;
  var dy = target.y - center.y;
  var radiusX = node.width / 2;
  var radiusY = node.height / 2;
  var scale;
  var polygon;
  var intersection;
  if (!dx && !dy) return center;
  polygon = diagramShapePolygon(node);
  if (polygon) {
    intersection = diagramRayPolygonIntersection(center, target, polygon);
    if (intersection) return intersection;
  }
  if (
    node.type === 'ellipse' ||
    node.type === 'dfdProcess' ||
    node.type === 'terminator' ||
    node.type === 'cloud' ||
    node.type === 'directData' ||
    node.type === 'sequentialData' ||
    node.type === 'onPageReference' ||
    node.type === 'summingJunction' ||
    node.type === 'orJunction'
  ) {
    scale = 1 / Math.sqrt(
      (dx * dx) / (radiusX * radiusX) +
      (dy * dy) / (radiusY * radiusY)
    );
  } else {
    scale = Math.min(
      dx ? radiusX / Math.abs(dx) : Infinity,
      dy ? radiusY / Math.abs(dy) : Infinity
    );
  }
  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale
  };
}

function diagramConnectionSide(name) {
  if (name === 'top' || name === 'bottom') return name;
  if (name.indexOf('right') === 0) return 'right';
  if (name.indexOf('left') === 0) return 'left';
  return '';
}

function diagramConnectionDirection(side) {
  if (side === 'top') return { x: 0, y: -1 };
  if (side === 'right') return { x: 1, y: 0 };
  if (side === 'bottom') return { x: 0, y: 1 };
  return { x: -1, y: 0 };
}

function diagramAutoConnectionCandidates(node) {
  var center = diagramNodeCenter(node);
  return [{
    side: 'top',
    point: getDiagramShapeBoundaryPoint(node, {
      x: center.x,
      y: node.y - Math.max(1, node.height)
    })
  }, {
    side: 'right',
    point: getDiagramShapeBoundaryPoint(node, {
      x: node.x + node.width + Math.max(1, node.width),
      y: center.y
    })
  }, {
    side: 'bottom',
    point: getDiagramShapeBoundaryPoint(node, {
      x: center.x,
      y: node.y + node.height + Math.max(1, node.height)
    })
  }, {
    side: 'left',
    point: getDiagramShapeBoundaryPoint(node, {
      x: node.x - Math.max(1, node.width),
      y: center.y
    })
  }];
}

function diagramConnectionCandidates(node, pointName) {
  var normalized = normalizeDiagramConnectionPoint(pointName);
  if (!normalized) return diagramAutoConnectionCandidates(node);
  return [{
    side: diagramConnectionSide(normalized),
    pointName: normalized,
    point: getDiagramConnectionPoint(node, normalized)
  }];
}

export function findBestDiagramConnectionPoints(
  fromNode,
  toNode,
  fromPoint,
  toPoint
) {
  var fromCandidates = diagramConnectionCandidates(fromNode, fromPoint);
  var toCandidates = diagramConnectionCandidates(toNode, toPoint);
  var scale = Math.max(
    1,
    diagramNumber(fromNode.width, 1),
    diagramNumber(fromNode.height, 1),
    diagramNumber(toNode.width, 1),
    diagramNumber(toNode.height, 1)
  );
  var best = null;
  fromCandidates.forEach(function(fromCandidate) {
    toCandidates.forEach(function(toCandidate) {
      var dx = toCandidate.point.x - fromCandidate.point.x;
      var dy = toCandidate.point.y - fromCandidate.point.y;
      var distance = Math.max(0.000001, Math.sqrt(dx * dx + dy * dy));
      var fromDirection = diagramConnectionDirection(fromCandidate.side);
      var toDirection = diagramConnectionDirection(toCandidate.side);
      var fromFacing = (
        dx * fromDirection.x +
        dy * fromDirection.y
      ) / distance;
      var toFacing = (
        -dx * toDirection.x -
        dy * toDirection.y
      ) / distance;
      var score = distance +
        (2 - fromFacing - toFacing) * scale;
      if (fromFacing <= 0) score += scale * 6;
      if (toFacing <= 0) score += scale * 6;
      if (!best || score < best.score) {
        best = {
          start: fromCandidate.point,
          end: toCandidate.point,
          fromPoint: fromCandidate.pointName || '',
          toPoint: toCandidate.pointName || '',
          fromSide: fromCandidate.side,
          toSide: toCandidate.side,
          score: score
        };
      }
    });
  });
  return best;
}

export function calculateDiagramMoveAlignment(
  nodes,
  connectors,
  movingNodeIds,
  threshold
) {
  var nodeMap = {};
  var movingMap = {};
  var xOffset = null;
  var yOffset = null;
  threshold = Math.max(0, diagramNumber(threshold, 10));
  (nodes || []).forEach(function(node) {
    nodeMap[String(node.id)] = node;
  });
  (movingNodeIds || []).forEach(function(id) {
    movingMap[String(id)] = true;
  });
  function keepNearest(current, candidate) {
    if (
      Math.abs(candidate) <= 0.001 ||
      Math.abs(candidate) > threshold
    ) return current;
    return current == null || Math.abs(candidate) < Math.abs(current) ?
      candidate :
      current;
  }
  (connectors || []).forEach(function(connector) {
    var fromMoving = movingMap[String(connector.from)] === true;
    var toMoving = movingMap[String(connector.to)] === true;
    var fromNode;
    var toNode;
    var points;
    var fromAxis;
    var toAxis;
    var offset;
    if (
      fromMoving === toMoving ||
      String(connector.type || 'orthogonal') !== 'orthogonal' ||
      connector.controlX != null ||
      connector.controlY != null
    ) return;
    fromNode = nodeMap[String(connector.from)];
    toNode = nodeMap[String(connector.to)];
    if (!fromNode || !toNode) return;
    points = findBestDiagramConnectionPoints(
      fromNode,
      toNode,
      connector.fromPoint,
      connector.toPoint
    );
    fromAxis = points.fromSide === 'top' || points.fromSide === 'bottom' ?
      'vertical' :
      'horizontal';
    toAxis = points.toSide === 'top' || points.toSide === 'bottom' ?
      'vertical' :
      'horizontal';
    if (fromAxis === 'horizontal' && toAxis === 'horizontal') {
      offset = fromMoving ?
        points.end.y - points.start.y :
        points.start.y - points.end.y;
      yOffset = keepNearest(yOffset, offset);
    } else if (fromAxis === 'vertical' && toAxis === 'vertical') {
      offset = fromMoving ?
        points.end.x - points.start.x :
        points.start.x - points.end.x;
      xOffset = keepNearest(xOffset, offset);
    }
  });
  return {
    x: xOffset == null ? 0 : xOffset,
    y: yOffset == null ? 0 : yOffset
  };
}

export function getDiagramConnectionPoint(node, name) {
  var descriptor = DIAGRAM_CONNECTION_POINTS.find(function(point) {
    return point.name === name;
  });
  if (!descriptor) return null;
  return getDiagramShapeBoundaryPoint(node, {
    x: node.x + node.width * descriptor.x,
    y: node.y + node.height * descriptor.y
  });
}

export function findDiagramNodesInRect(nodes, rect) {
  var left = Math.min(rect.x, rect.x + rect.width);
  var top = Math.min(rect.y, rect.y + rect.height);
  var right = Math.max(rect.x, rect.x + rect.width);
  var bottom = Math.max(rect.y, rect.y + rect.height);
  return (nodes || []).filter(function(node) {
    return node.x <= right &&
      node.x + node.width >= left &&
      node.y <= bottom &&
      node.y + node.height >= top;
  });
}

function normalizeDiagramConnectionPoint(value) {
  value = String(value == null ? '' : value);
  return DIAGRAM_CONNECTION_POINTS.some(function(point) {
    return point.name === value;
  }) ? value : '';
}

function calculateDiagramCurve(start, end, customControl) {
  var dx = end.x - start.x;
  var dy = end.y - start.y;
  var length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
  var bend = Math.min(90, Math.max(28, length * 0.18));
  var control = customControl || {
    x: (start.x + end.x) / 2 - dy / length * bend,
    y: (start.y + end.y) / 2 + dx / length * bend
  };
  return {
    path: 'M ' + start.x + ' ' + start.y +
      ' Q ' + control.x + ' ' + control.y +
      ' ' + end.x + ' ' + end.y,
    label: {
      x: start.x * 0.25 + control.x * 0.5 + end.x * 0.25,
      y: start.y * 0.25 + control.y * 0.5 + end.y * 0.25
    },
    control: control
  };
}

function calculateDiagramSCurve(start, end, customControl, fromSide, toSide) {
  var dx = end.x - start.x;
  var dy = end.y - start.y;
  var length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
  var handleLength = Math.min(140, Math.max(36, length * 0.45));
  var directions = {
    top: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    bottom: { x: 0, y: 1 },
    left: { x: -1, y: 0 }
  };
  var fromDirection;
  var toDirection;
  var firstControl;
  var secondControl;
  var label;
  var offsetX;
  var offsetY;
  if (!directions[fromSide] || !directions[toSide]) {
    if (Math.abs(dx) >= Math.abs(dy)) {
      fromSide = dx >= 0 ? 'right' : 'left';
      toSide = dx >= 0 ? 'left' : 'right';
    } else {
      fromSide = dy >= 0 ? 'bottom' : 'top';
      toSide = dy >= 0 ? 'top' : 'bottom';
    }
  }
  fromDirection = directions[fromSide];
  toDirection = directions[toSide];
  firstControl = {
    x: start.x + fromDirection.x * handleLength,
    y: start.y + fromDirection.y * handleLength
  };
  secondControl = {
    x: end.x + toDirection.x * handleLength,
    y: end.y + toDirection.y * handleLength
  };
  label = {
    x: (start.x + firstControl.x * 3 + secondControl.x * 3 + end.x) / 8,
    y: (start.y + firstControl.y * 3 + secondControl.y * 3 + end.y) / 8
  };
  if (customControl) {
    offsetX = (customControl.x - label.x) * 4 / 3;
    offsetY = (customControl.y - label.y) * 4 / 3;
    firstControl.x += offsetX;
    firstControl.y += offsetY;
    secondControl.x += offsetX;
    secondControl.y += offsetY;
    label = {
      x: customControl.x,
      y: customControl.y
    };
  }
  return {
    path: 'M ' + start.x + ' ' + start.y +
      ' C ' + firstControl.x + ' ' + firstControl.y +
      ' ' + secondControl.x + ' ' + secondControl.y +
      ' ' + end.x + ' ' + end.y,
    label: label,
    control: {
      x: label.x,
      y: label.y
    }
  };
}

function calculateDiagramOrthogonalMidpoint(start, end, startAxis) {
  var firstLength = startAxis === 'horizontal' ?
    Math.abs(end.x - start.x) :
    Math.abs(end.y - start.y);
  var secondLength = startAxis === 'horizontal' ?
    Math.abs(end.y - start.y) :
    Math.abs(end.x - start.x);
  var distance = (firstLength + secondLength) / 2;
  var xDirection = end.x < start.x ? -1 : end.x > start.x ? 1 : 0;
  var yDirection = end.y < start.y ? -1 : end.y > start.y ? 1 : 0;
  if (distance <= firstLength) {
    return startAxis === 'horizontal' ? {
      x: start.x + xDirection * distance,
      y: start.y
    } : {
      x: start.x,
      y: start.y + yDirection * distance
    };
  }
  distance -= firstLength;
  return startAxis === 'horizontal' ? {
    x: end.x,
    y: start.y + yDirection * distance
  } : {
    x: start.x + xDirection * distance,
    y: end.y
  };
}

export function calculateDiagramConnectorPath(
  fromNode,
  toNode,
  type,
  fromPoint,
  toPoint,
  controlX,
  controlY
) {
  var points = findBestDiagramConnectionPoints(
    fromNode,
    toNode,
    fromPoint,
    toPoint
  );
  var start = points.start;
  var end = points.end;
  var hasControl = controlX != null &&
    controlY != null &&
    isFinite(Number(controlX)) &&
    isFinite(Number(controlY));
  var customControl = hasControl ? {
    x: Number(controlX),
    y: Number(controlY)
  } : null;
  var control;
  var middle;
  var curve;
  var orientation = '';
  var startAxis = points.fromSide === 'top' ||
    points.fromSide === 'bottom' ?
    'vertical' :
    'horizontal';
  var endAxis = points.toSide === 'top' ||
    points.toSide === 'bottom' ?
    'vertical' :
    'horizontal';
  var path;
  if (type === 'straight') {
    control = customControl || {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    };
    path = 'M ' + start.x + ' ' + start.y +
      (customControl ?
        ' L ' + control.x + ' ' + control.y :
        '') +
      ' L ' + end.x + ' ' + end.y;
    middle = control;
  } else if (type === 'curved') {
    curve = calculateDiagramCurve(start, end, customControl);
    path = curve.path;
    middle = curve.label;
    control = curve.control;
  } else if (type === 'sCurve') {
    curve = calculateDiagramSCurve(
      start,
      end,
      customControl,
      points.fromSide,
      points.toSide
    );
    path = curve.path;
    middle = curve.label;
    control = curve.control;
  } else if (startAxis === 'horizontal' && endAxis === 'vertical') {
    orientation = 'horizontal';
    control = {
      x: customControl ? customControl.x : end.x,
      y: customControl ? customControl.y : start.y
    };
    middle = customControl ?
      control :
      calculateDiagramOrthogonalMidpoint(start, end, startAxis);
    path = customControl ?
      'M ' + start.x + ' ' + start.y +
        ' H ' + control.x +
        ' V ' + control.y +
        ' H ' + end.x +
        ' V ' + end.y :
      'M ' + start.x + ' ' + start.y +
        ' H ' + end.x +
        ' V ' + end.y;
  } else if (startAxis === 'vertical' && endAxis === 'horizontal') {
    orientation = 'vertical';
    control = {
      x: customControl ? customControl.x : start.x,
      y: customControl ? customControl.y : end.y
    };
    middle = customControl ?
      control :
      calculateDiagramOrthogonalMidpoint(start, end, startAxis);
    path = customControl ?
      'M ' + start.x + ' ' + start.y +
        ' V ' + control.y +
        ' H ' + control.x +
        ' V ' + end.y +
        ' H ' + end.x :
      'M ' + start.x + ' ' + start.y +
        ' V ' + end.y +
        ' H ' + end.x;
  } else if (startAxis === 'horizontal') {
    orientation = 'horizontal';
    control = {
      x: customControl ? customControl.x : (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    };
    middle = control;
    path = 'M ' + start.x + ' ' + start.y +
      ' H ' + control.x +
      ' V ' + end.y +
      ' H ' + end.x;
  } else {
    orientation = 'vertical';
    control = {
      x: (start.x + end.x) / 2,
      y: customControl ? customControl.y : (start.y + end.y) / 2
    };
    middle = control;
    path = 'M ' + start.x + ' ' + start.y +
      ' V ' + control.y +
      ' H ' + end.x +
      ' V ' + end.y;
  }
  return {
    path: path,
    start: start,
    end: end,
    label: middle,
    control: control,
    orientation: orientation,
    fromSide: points.fromSide,
    toSide: points.toSide
  };
}

export function calculateDiagramNodeResize(node, direction, dx, dy, minWidth, minHeight) {
  var result = diagramAssign({}, node);
  var right = node.x + node.width;
  var bottom = node.y + node.height;
  minWidth = Math.max(20, diagramNumber(minWidth, 40));
  minHeight = Math.max(20, diagramNumber(minHeight, 30));
  direction = String(direction || '');
  if (direction.indexOf('e') >= 0) result.width = Math.max(minWidth, node.width + dx);
  if (direction.indexOf('s') >= 0) result.height = Math.max(minHeight, node.height + dy);
  if (direction.indexOf('w') >= 0) {
    result.width = Math.max(minWidth, node.width - dx);
    result.x = right - result.width;
  }
  if (direction.indexOf('n') >= 0) {
    result.height = Math.max(minHeight, node.height - dy);
    result.y = bottom - result.height;
  }
  return result;
}

export function calculateDiagramGroupBounds(nodes) {
  var items = (nodes || []).filter(Boolean);
  var left;
  var top;
  var right;
  var bottom;
  if (!items.length) return null;
  left = Math.min.apply(null, items.map(function(node) {
    return node.x;
  }));
  top = Math.min.apply(null, items.map(function(node) {
    return node.y;
  }));
  right = Math.max.apply(null, items.map(function(node) {
    return node.x + node.width;
  }));
  bottom = Math.max.apply(null, items.map(function(node) {
    return node.y + node.height;
  }));
  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2
  };
}

export function calculateDiagramGroupResize(
  nodes,
  bounds,
  direction,
  point,
  minWidth,
  minHeight
) {
  var items = (nodes || []).filter(Boolean);
  var handleX;
  var handleY;
  var vectorX;
  var vectorY;
  var currentX;
  var currentY;
  var divisor;
  var scale;
  var minimumScale;
  bounds = bounds || calculateDiagramGroupBounds(items);
  if (!bounds || !items.length) return { scale: 1, nodes: [] };
  direction = String(direction || 'se');
  minWidth = Math.max(20, diagramNumber(minWidth, 40));
  minHeight = Math.max(20, diagramNumber(minHeight, 30));
  handleX = direction.indexOf('w') >= 0 ?
    bounds.x :
    bounds.x + bounds.width;
  handleY = direction.indexOf('n') >= 0 ?
    bounds.y :
    bounds.y + bounds.height;
  vectorX = handleX - bounds.centerX;
  vectorY = handleY - bounds.centerY;
  currentX = diagramNumber(point && point.x, handleX) - bounds.centerX;
  currentY = diagramNumber(point && point.y, handleY) - bounds.centerY;
  divisor = vectorX * vectorX + vectorY * vectorY;
  scale = divisor > 0 ?
    (currentX * vectorX + currentY * vectorY) / divisor :
    1;
  minimumScale = items.reduce(function(minimum, node) {
    return Math.max(
      minimum,
      minWidth / Math.max(1, node.width),
      minHeight / Math.max(1, node.height)
    );
  }, 0.01);
  scale = Math.max(minimumScale, scale);
  return {
    scale: scale,
    nodes: items.map(function(node) {
      return diagramAssign({}, node, {
        x: bounds.centerX + (node.x - bounds.centerX) * scale,
        y: bounds.centerY + (node.y - bounds.centerY) * scale,
        width: node.width * scale,
        height: node.height * scale
      });
    })
  };
}

export function calculateDiagramPageZoom(
  viewportWidth,
  viewportHeight,
  pageWidth,
  pageHeight,
  padding,
  minZoom,
  maxZoom
) {
  var availableWidth;
  var availableHeight;
  var zoom;
  padding = Math.max(0, diagramNumber(padding, 0));
  minZoom = Math.max(0.01, diagramNumber(minZoom, 0.25));
  maxZoom = Math.max(minZoom, diagramNumber(maxZoom, 2));
  pageWidth = Math.max(1, diagramNumber(pageWidth, 1));
  pageHeight = Math.max(1, diagramNumber(pageHeight, 1));
  availableWidth = Math.max(1, diagramNumber(viewportWidth, 1) - padding * 2);
  availableHeight = Math.max(1, diagramNumber(viewportHeight, 1) - padding * 2);
  zoom = Math.min(availableWidth / pageWidth, availableHeight / pageHeight);
  return diagramClamp(zoom, minZoom, maxZoom);
}

export function calculateDiagramViewportOffset(
  viewportRect,
  svgRect,
  scrollLeft,
  scrollTop,
  clientLeft,
  clientTop
) {
  return {
    x: svgRect.left - viewportRect.left -
      diagramNumber(clientLeft, 0) +
      diagramNumber(scrollLeft, 0),
    y: svgRect.top - viewportRect.top -
      diagramNumber(clientTop, 0) +
      diagramNumber(scrollTop, 0)
  };
}

export function calculateDiagramAnchoredScroll(
  scrollOffset,
  anchorOffset,
  contentOffsetBefore,
  oldZoom,
  contentOffsetAfter,
  newZoom
) {
  oldZoom = Math.max(0.0001, diagramNumber(oldZoom, 1));
  newZoom = Math.max(0.0001, diagramNumber(newZoom, oldZoom));
  return Math.max(
    0,
    (
      (
        diagramNumber(scrollOffset, 0) +
        diagramNumber(anchorOffset, 0) -
        diagramNumber(contentOffsetBefore, 0)
      ) / oldZoom
    ) * newZoom +
    diagramNumber(contentOffsetAfter, 0) -
    diagramNumber(anchorOffset, 0)
  );
}

export function diagramFullscreenSizeChanged(previous, next) {
  if (!previous || !next) return true;
  return Math.abs(previous.width - next.width) > 0.5 ||
    Math.abs(previous.height - next.height) > 0.5;
}

function diagramDownloadBlob(blob, filename) {
  var anchor = document.createElement('a');
  var url = URL.createObjectURL(blob);
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(function() {
    URL.revokeObjectURL(url);
  }, 0);
}

export function createDiagramFactory(
  Control,
  registerControl,
  unregisterControl,
  Button,
  EditBox,
  Menu,
  Tabs
) {
  var localePacks = {
    en: {
      diagram: 'Diagram',
      toolbox: 'Toolbox',
      resizeToolbox: 'Resize toolbox',
      resizeToolboxHeight: 'Resize toolbox height',
      resizeProperties: 'Resize properties',
      resizePropertiesHeight: 'Resize properties height',
      dragToolbox: 'Drag to float or dock toolbox',
      dragProperties: 'Drag to float or dock properties',
      dragViewToolbar: 'Drag to move view toolbar',
      searchShapes: 'Search shapes',
      general: 'General',
      flowchart: 'Flowchart',
      dfd: 'DFD',
      orgChart: 'Organizational Chart',
      dfdEntity: 'Entity',
      dfdProcess: 'Process',
      dfdDataStore: 'Data Store',
      dfdDataFlow: 'Data Flow',
      dfdSCurve: 'S Curve',
      orgChartImageLeft: 'Image on Left',
      orgChartImageRight: 'Image on Right',
      orgChartImageTop: 'Image on Top',
      paperSettings: 'Paper Settings',
      paperSize: 'Paper Size',
      paperOrientation: 'Orientation',
      snapSize: 'Snap Size',
      portrait: 'Portrait',
      landscape: 'Landscape',
      apply: 'Apply',
      cancel: 'Cancel',
      rectangle: 'Rectangle',
      roundedRectangle: 'Rounded rectangle',
      ellipse: 'Ellipse',
      triangle: 'Triangle',
      diamond: 'Diamond',
      heart: 'Heart',
      pentagon: 'Pentagon',
      hexagon: 'Hexagon',
      octagon: 'Octagon',
      star: 'Star',
      cross: 'Cross',
      arrowUp: 'Up arrow',
      arrowDown: 'Down arrow',
      arrowLeft: 'Left arrow',
      arrowRight: 'Right arrow',
      arrowUpDown: 'Up-down arrow',
      arrowLeftRight: 'Left-right arrow',
      cloud: 'Cloud',
      textShape: 'Text',
      process: 'Process',
      decision: 'Decision',
      terminator: 'Terminator',
      document: 'Document',
      multipleDocuments: 'Multiple documents',
      dataShape: 'Data',
      database: 'Database',
      predefinedProcess: 'Predefined process',
      manualInput: 'Manual input',
      preparation: 'Preparation',
      directData: 'Direct data',
      internalStorage: 'Internal storage',
      paperTape: 'Paper tape',
      manualOperation: 'Manual operation',
      delay: 'Delay',
      storedData: 'Stored data',
      sequentialData: 'Sequential data',
      merge: 'Merge',
      onPageReference: 'On-page reference',
      summingJunction: 'Summing junction',
      orJunction: 'OR',
      display: 'Display',
      undo: 'Undo',
      redo: 'Redo',
      deleteItem: 'Delete',
      clearPage: 'Clear Page',
      downloadJson: 'Download',
      loadJson: 'Load',
      connect: 'Connect',
      connectStraight: 'Straight connector',
      connectOrthogonal: 'Orthogonal connector',
      connectCurved: 'Curved connector',
      connectSCurve: 'S Curve connector',
      readOnly: 'Read only',
      properties: 'Properties',
      noSelection: 'Select a shape or connector.',
      multipleSelection: '{0} shapes selected.',
      text: 'Text',
      fontSize: 'Font size',
      textStyle: 'Text style',
      bold: 'Bold',
      italic: 'Italic',
      underline: 'Underline',
      strikethrough: 'Strikethrough',
      x: 'X',
      y: 'Y',
      width: 'Width',
      height: 'Height',
      hyperlink: 'Hyperlink',
      hyperlinkTrigger: 'Hyperlink trigger',
      hyperlinkSingleClick: 'Single click',
      hyperlinkDoubleClick: 'Double click',
      fill: 'Fill',
      stroke: 'Stroke',
      lineStyle: 'Line style',
      solid: 'Solid',
      dashed: 'Dashed',
      arrowDirection: 'Arrow',
      arrowNone: 'None',
      arrowEnd: 'To End',
      arrowStart: 'To Start',
      arrowBoth: 'Both Directions',
      reorderToolboxGroup: 'Drag to reorder toolbox group',
      zoomOut: 'Zoom out',
      zoomIn: 'Zoom in',
      fit: 'Fit',
      grid: 'Grid',
      fullscreen: 'Full screen',
      exitFullscreen: 'Exit full screen',
      presentation: 'Slide show',
      exitPresentation: 'Exit slide show',
      exportPng: 'Export PNG',
      exportSvg: 'Export SVG',
      print: 'Print',
      connectSource: 'Select the source shape.',
      connectTarget: 'Select the target shape.',
      itemAdded: 'Item added',
      itemChanged: 'Item changed',
      itemRemoved: 'Item removed'
    },
    'zh-TW': {
      diagram: '圖表設計器',
      toolbox: '工具箱',
      resizeToolbox: '調整工具箱寬度',
      resizeToolboxHeight: '調整工具箱高度',
      resizeProperties: '調整屬性寬度',
      resizePropertiesHeight: '調整屬性高度',
      dragToolbox: '拖曳以浮動或停靠工具箱',
      dragProperties: '拖曳以浮動或停靠屬性',
      dragViewToolbar: '拖曳以移動檢視工具列',
      searchShapes: '搜尋圖形',
      general: '一般',
      flowchart: '流程圖',
      dfd: 'DFD',
      orgChart: '組織圖',
      dfdEntity: '外部實體',
      dfdProcess: '處理程序',
      dfdDataStore: '資料儲存',
      dfdDataFlow: '資料流',
      dfdSCurve: 'S 弧線',
      orgChartImageLeft: '圖片在左側',
      orgChartImageRight: '圖片在右側',
      orgChartImageTop: '圖片在上方',
      paperSettings: '紙張設定',
      paperSize: '紙張尺寸',
      paperOrientation: '紙張方向',
      snapSize: '吸附間距',
      portrait: '直向',
      landscape: '橫向',
      apply: '套用',
      cancel: '取消',
      rectangle: '矩形',
      roundedRectangle: '圓角矩形',
      ellipse: '橢圓',
      triangle: '三角形',
      diamond: '菱形',
      heart: '愛心',
      pentagon: '五邊形',
      hexagon: '六邊形',
      octagon: '八邊形',
      star: '星形',
      cross: '十字形',
      arrowUp: '向上箭頭',
      arrowDown: '向下箭頭',
      arrowLeft: '向左箭頭',
      arrowRight: '向右箭頭',
      arrowUpDown: '上下箭頭',
      arrowLeftRight: '左右箭頭',
      cloud: '雲朵',
      textShape: '文字',
      process: '處理程序',
      decision: '判斷',
      terminator: '開始／結束',
      document: '文件',
      multipleDocuments: '多重文件',
      dataShape: '資料',
      database: '資料庫',
      predefinedProcess: '預定義處理',
      manualInput: '手動輸入',
      preparation: '準備',
      directData: '直接資料',
      internalStorage: '內部儲存',
      paperTape: '紙帶',
      manualOperation: '手動操作',
      delay: '延遲',
      storedData: '儲存資料',
      sequentialData: '循序資料',
      merge: '合併',
      onPageReference: '頁內連接點',
      summingJunction: '加總接點',
      orJunction: 'OR 接點',
      display: '顯示',
      undo: '復原',
      redo: '重做',
      deleteItem: '刪除',
      clearPage: '清除頁面',
      downloadJson: '下載',
      loadJson: '載入',
      connect: '連線',
      connectStraight: '直線',
      connectOrthogonal: '直角線',
      connectCurved: '弧線',
      connectSCurve: 'S 線',
      readOnly: '唯讀',
      properties: '屬性',
      noSelection: '請選取圖形或連線。',
      multipleSelection: '已選取 {0} 個圖形。',
      text: '文字',
      fontSize: '文字大小',
      textStyle: '文字樣式',
      bold: '粗體',
      italic: '斜體',
      underline: '底線',
      strikethrough: '刪除線',
      x: 'X',
      y: 'Y',
      width: '寬度',
      height: '高度',
      hyperlink: '超連結',
      hyperlinkTrigger: '觸發方式',
      hyperlinkSingleClick: '單擊觸發',
      hyperlinkDoubleClick: '雙擊觸發',
      fill: '填滿',
      stroke: '框線',
      lineStyle: '線條',
      solid: '實線',
      dashed: '虛線',
      arrowDirection: '箭頭',
      arrowNone: '無箭頭',
      arrowEnd: '指向終點',
      arrowStart: '指向起點',
      arrowBoth: '雙向箭頭',
      reorderToolboxGroup: '拖曳調整工具列順序',
      zoomOut: '縮小',
      zoomIn: '放大',
      fit: '符合',
      grid: '格線',
      fullscreen: '全螢幕',
      exitFullscreen: '離開全螢幕',
      presentation: '投影片展示',
      exitPresentation: '離開投影片展示',
      exportPng: '匯出 PNG',
      exportSvg: '匯出 SVG',
      print: '列印',
      connectSource: '請選擇起點圖形。',
      connectTarget: '請選擇終點圖形。',
      itemAdded: '已新增項目',
      itemChanged: '已修改項目',
      itemRemoved: '已刪除項目'
    },
    'zh-CN': {
      diagram: '图表设计器',
      toolbox: '工具箱',
      resizeToolbox: '调整工具箱宽度',
      resizeToolboxHeight: '调整工具箱高度',
      resizeProperties: '调整属性宽度',
      resizePropertiesHeight: '调整属性高度',
      dragToolbox: '拖曳以浮动或停靠工具箱',
      dragProperties: '拖曳以浮动或停靠属性',
      dragViewToolbar: '拖曳以移动查看工具栏',
      searchShapes: '搜索图形',
      general: '常规',
      flowchart: '流程图',
      dfd: 'DFD',
      orgChart: '组织结构图',
      dfdEntity: '外部实体',
      dfdProcess: '处理过程',
      dfdDataStore: '数据存储',
      dfdDataFlow: '数据流',
      dfdSCurve: 'S 弧线',
      orgChartImageLeft: '图片在左侧',
      orgChartImageRight: '图片在右侧',
      orgChartImageTop: '图片在上方',
      paperSettings: '纸张设置',
      paperSize: '纸张尺寸',
      paperOrientation: '纸张方向',
      snapSize: '吸附间距',
      portrait: '纵向',
      landscape: '横向',
      apply: '应用',
      cancel: '取消',
      rectangle: '矩形',
      roundedRectangle: '圆角矩形',
      ellipse: '椭圆',
      triangle: '三角形',
      diamond: '菱形',
      heart: '爱心',
      pentagon: '五边形',
      hexagon: '六边形',
      octagon: '八边形',
      star: '星形',
      cross: '十字形',
      arrowUp: '向上箭头',
      arrowDown: '向下箭头',
      arrowLeft: '向左箭头',
      arrowRight: '向右箭头',
      arrowUpDown: '上下箭头',
      arrowLeftRight: '左右箭头',
      cloud: '云朵',
      textShape: '文本',
      process: '处理程序',
      decision: '判断',
      terminator: '开始／结束',
      document: '文档',
      multipleDocuments: '多重文档',
      dataShape: '数据',
      database: '数据库',
      predefinedProcess: '预定义处理',
      manualInput: '手动输入',
      preparation: '准备',
      directData: '直接数据',
      internalStorage: '内部存储',
      paperTape: '纸带',
      manualOperation: '手动操作',
      delay: '延迟',
      storedData: '存储数据',
      sequentialData: '顺序数据',
      merge: '合并',
      onPageReference: '页内连接点',
      summingJunction: '汇总接点',
      orJunction: 'OR 接点',
      display: '显示',
      undo: '撤销',
      redo: '重做',
      deleteItem: '删除',
      clearPage: '清除页面',
      downloadJson: '下载',
      loadJson: '载入',
      connect: '连接',
      connectStraight: '直线',
      connectOrthogonal: '直角线',
      connectCurved: '弧线',
      connectSCurve: 'S 线',
      readOnly: '只读',
      properties: '属性',
      noSelection: '请选择图形或连接线。',
      multipleSelection: '已选择 {0} 个图形。',
      text: '文本',
      fontSize: '文字大小',
      textStyle: '文字样式',
      bold: '粗体',
      italic: '斜体',
      underline: '下划线',
      strikethrough: '删除线',
      x: 'X',
      y: 'Y',
      width: '宽度',
      height: '高度',
      hyperlink: '超链接',
      hyperlinkTrigger: '触发方式',
      hyperlinkSingleClick: '单击触发',
      hyperlinkDoubleClick: '双击触发',
      fill: '填充',
      stroke: '边框',
      lineStyle: '线条',
      solid: '实线',
      dashed: '虚线',
      arrowDirection: '箭头',
      arrowNone: '无箭头',
      arrowEnd: '指向终点',
      arrowStart: '指向起点',
      arrowBoth: '双向箭头',
      reorderToolboxGroup: '拖曳调整工具栏顺序',
      zoomOut: '缩小',
      zoomIn: '放大',
      fit: '适合',
      grid: '网格',
      fullscreen: '全屏',
      exitFullscreen: '退出全屏',
      presentation: '幻灯片放映',
      exitPresentation: '退出幻灯片放映',
      exportPng: '导出 PNG',
      exportSvg: '导出 SVG',
      print: '打印',
      connectSource: '请选择起点图形。',
      connectTarget: '请选择终点图形。',
      itemAdded: '已添加项目',
      itemChanged: '已修改项目',
      itemRemoved: '已删除项目'
    }
  };
  var defaults = {
    width: '100%',
    height: 620,
    nodes: [],
    connectors: [],
    paperSize: 'A4',
    paperOrientation: 'landscape',
    pageWidth: 1123,
    pageHeight: 794,
    pageColor: '#ffffff',
    showGrid: true,
    snapToGrid: true,
    gridSize: 20,
    zoomLevel: 1,
    minZoom: 0.25,
    maxZoom: 2,
    toolbox: true,
    toolboxSearch: true,
    toolboxWidth: 260,
    toolboxMinWidth: 140,
    toolboxMaxWidth: 420,
    toolboxHeight: 520,
    toolboxMinHeight: 180,
    toolboxMaxHeight: 720,
    toolboxFloating: false,
    toolboxFloatLeft: 12,
    toolboxFloatTop: 12,
    toolboxDockSide: 'left',
    toolboxCollapsed: DIAGRAM_TOOLBOX_COLLAPSED_DEFAULTS,
    toolboxOrder: DIAGRAM_TOOLBOX_CATEGORIES,
    toolboxStateKey: '',
    propertiesPanel: true,
    propertiesWidth: 230,
    propertiesMinWidth: 180,
    propertiesMaxWidth: 420,
    propertiesHeight: 520,
    propertiesMinHeight: 180,
    propertiesMaxHeight: 720,
    propertiesFloating: false,
    propertiesFloatLeft: 12,
    propertiesFloatTop: 12,
    propertiesDockSide: 'right',
    sameSideDockMode: 'tabs',
    sameSideDockTab: 'toolbox',
    mainToolbar: true,
    viewToolbar: true,
    viewToolbarLeft: null,
    viewToolbarTop: null,
    contextMenu: true,
    readOnly: false,
    disabled: false,
    locale: 'en',
    theme: 'inherit',
    ariaLabel: '',
    onSelectionChanged: null,
    onItemClick: null,
    onItemDblClick: null,
    onChanged: null,
    onJsonLoaded: null,
    onLoadError: null,
    onHyperlinkClick: null,
    onReadOnlyChanged: null
  };

  function Diagram(element, options) {
    var paperDimensions;
    var savedDiagramData;
    var savedPanelState;
    var savedPaper;
    var savedPropertiesPanel;
    var savedToolboxPanel;
    var savedToolboxState;
    var savedViewToolbar;
    var sourceOptions = options || {};
    if (!(this instanceof Diagram)) return new Diagram(element, options);
    this.hostElement = resolveDiagramElement(element);
    if (!this.hostElement) throw new Error('fabui.Diagram requires a host element.');
    if (this.hostElement.__fabuiDiagram) return this.hostElement.__fabuiDiagram;
    Control.call(this);
    this._listeners = {};
    this._destroyed = false;
    this._interaction = null;
    this._selected = null;
    this._selectedNodeIds = [];
    this._suppressClick = false;
    this._inlineTextEditor = null;
    this._contextMenu = null;
    this._contextMenuHost = null;
    this._dockTabs = null;
    this._dockTabsToolboxPanel = null;
    this._dockTabsPropertiesPanel = null;
    this._syncingDockTabs = false;
    this._fullscreenResizeObserver = null;
    this._fullscreenViewportSize = null;
    this._fullscreenViewState = null;
    this._panelResize = null;
    this._toolboxPanelDrag = null;
    this._propertiesPanelDrag = null;
    this._floatingPanelFront = 'properties';
    this._viewToolbarDrag = null;
    this._jsonFileReader = null;
    this._toolboxOrderDrag = null;
    this._toolboxDropCategory = '';
    this._toolboxDropAfter = false;
    this._onToolboxOrderPointerMove = null;
    this._onToolboxOrderPointerEnd = null;
    this._onPanelResizePointerMove = null;
    this._onPanelResizePointerEnd = null;
    this._onToolboxPanelPointerDown = null;
    this._onPropertiesPanelPointerDown = null;
    this._onToolboxPanelPointerMove = null;
    this._onToolboxPanelPointerEnd = null;
    this._onPropertiesPanelPointerMove = null;
    this._onPropertiesPanelPointerEnd = null;
    this._onViewToolbarPointerMove = null;
    this._onViewToolbarPointerEnd = null;
    this._lastItemClick = null;
    this._connectMode = false;
    this._connectType = 'orthogonal';
    this._connectSourceId = '';
    this._buttonControls = [];
    this._toolboxButtonControls = [];
    this._toolbarButtons = {};
    this._editBoxControls = [];
    this._propertyEditors = [];
    this._toolboxFilter = '';
    this._instanceId = nextDiagramInstanceId;
    nextDiagramInstanceId += 1;
    this._original = {
      html: this.hostElement.innerHTML,
      className: this.hostElement.getAttribute('class'),
      style: this.hostElement.getAttribute('style'),
      role: this.hostElement.getAttribute('role'),
      ariaLabel: this.hostElement.getAttribute('aria-label'),
      tabIndex: this.hostElement.getAttribute('tabindex')
    };
    this._themeSource = this.hostElement.parentElement || document.body;
    this.options = diagramAssign({}, defaults, sourceOptions);
    this.options.locale = normalizeDiagramLocale(this.options.locale);
    this.options.paperSize = normalizeDiagramPaperSize(this.options.paperSize);
    this.options.paperOrientation = normalizeDiagramPaperOrientation(
      this.options.paperOrientation
    );
    if (
      !Object.prototype.hasOwnProperty.call(sourceOptions, 'pageWidth') &&
      !Object.prototype.hasOwnProperty.call(sourceOptions, 'pageHeight')
    ) {
      paperDimensions = getDiagramPaperDimensions(
        this.options.paperSize,
        this.options.paperOrientation
      );
      this.options.pageWidth = paperDimensions.width;
      this.options.pageHeight = paperDimensions.height;
    }
    this.options.gridSize = Math.max(5, diagramNumber(this.options.gridSize, 20));
    this.options.toolboxMinWidth = Math.max(
      100,
      diagramNumber(this.options.toolboxMinWidth, 140)
    );
    this.options.toolboxMaxWidth = Math.max(
      this.options.toolboxMinWidth,
      diagramNumber(this.options.toolboxMaxWidth, 420)
    );
    this.options.toolboxWidth = diagramClamp(
      diagramNumber(this.options.toolboxWidth, 260),
      this.options.toolboxMinWidth,
      this.options.toolboxMaxWidth
    );
    this.options.toolboxMinHeight = Math.max(
      120,
      diagramNumber(this.options.toolboxMinHeight, 180)
    );
    this.options.toolboxMaxHeight = Math.max(
      this.options.toolboxMinHeight,
      diagramNumber(this.options.toolboxMaxHeight, 720)
    );
    this.options.toolboxHeight = diagramClamp(
      diagramNumber(this.options.toolboxHeight, 520),
      this.options.toolboxMinHeight,
      this.options.toolboxMaxHeight
    );
    this.options.toolboxFloating = diagramBoolean(
      this.options.toolboxFloating,
      false
    );
    this.options.toolboxFloatLeft = Math.max(
      0,
      diagramNumber(this.options.toolboxFloatLeft, 12)
    );
    this.options.toolboxFloatTop = Math.max(
      0,
      diagramNumber(this.options.toolboxFloatTop, 12)
    );
    this.options.toolboxDockSide = normalizeDiagramDockSide(
      this.options.toolboxDockSide,
      'left'
    );
    this.options.toolboxCollapsed = normalizeDiagramToolboxCollapsed(
      this.options.toolboxCollapsed
    );
    this.options.toolboxOrder = normalizeDiagramToolboxOrder(
      this.options.toolboxOrder
    );
    this.options.toolboxStateKey = String(this.options.toolboxStateKey || '');
    this.options.propertiesMinWidth = Math.max(
      120,
      diagramNumber(this.options.propertiesMinWidth, 180)
    );
    this.options.propertiesMaxWidth = Math.max(
      this.options.propertiesMinWidth,
      diagramNumber(this.options.propertiesMaxWidth, 420)
    );
    this.options.propertiesWidth = diagramClamp(
      diagramNumber(this.options.propertiesWidth, 230),
      this.options.propertiesMinWidth,
      this.options.propertiesMaxWidth
    );
    this.options.propertiesMinHeight = Math.max(
      120,
      diagramNumber(this.options.propertiesMinHeight, 180)
    );
    this.options.propertiesMaxHeight = Math.max(
      this.options.propertiesMinHeight,
      diagramNumber(this.options.propertiesMaxHeight, 720)
    );
    this.options.propertiesHeight = diagramClamp(
      diagramNumber(this.options.propertiesHeight, 520),
      this.options.propertiesMinHeight,
      this.options.propertiesMaxHeight
    );
    this.options.propertiesFloating = diagramBoolean(
      this.options.propertiesFloating,
      false
    );
    this.options.propertiesFloatLeft = Math.max(
      0,
      diagramNumber(this.options.propertiesFloatLeft, 12)
    );
    this.options.propertiesFloatTop = Math.max(
      0,
      diagramNumber(this.options.propertiesFloatTop, 12)
    );
    this.options.propertiesDockSide = normalizeDiagramDockSide(
      this.options.propertiesDockSide,
      'right'
    );
    this.options.sameSideDockMode = normalizeDiagramSameSideDockMode(
      this.options.sameSideDockMode
    );
    this.options.sameSideDockTab =
      this.options.sameSideDockTab === 'properties' ?
        'properties' :
        'toolbox';
    if (
      this.options.viewToolbarLeft == null ||
      this.options.viewToolbarTop == null ||
      !isFinite(Number(this.options.viewToolbarLeft)) ||
      !isFinite(Number(this.options.viewToolbarTop))
    ) {
      this.options.viewToolbarLeft = null;
      this.options.viewToolbarTop = null;
    } else {
      this.options.viewToolbarLeft = Math.max(
        0,
        Number(this.options.viewToolbarLeft)
      );
      this.options.viewToolbarTop = Math.max(
        0,
        Number(this.options.viewToolbarTop)
      );
    }
    savedToolboxState = readDiagramToolboxState(
      this.options.toolboxStateKey
    );
    savedDiagramData = savedToolboxState &&
      savedToolboxState.diagram &&
      typeof savedToolboxState.diagram === 'object' &&
      Array.isArray(savedToolboxState.diagram.nodes) ?
      savedToolboxState.diagram :
      null;
    savedPanelState = savedToolboxState &&
      savedToolboxState.panels &&
      typeof savedToolboxState.panels === 'object' ?
      savedToolboxState.panels :
      null;
    savedToolboxPanel = savedPanelState &&
      savedPanelState.toolbox &&
      typeof savedPanelState.toolbox === 'object' ?
      savedPanelState.toolbox :
      null;
    savedPropertiesPanel = savedPanelState &&
      savedPanelState.properties &&
      typeof savedPanelState.properties === 'object' ?
      savedPanelState.properties :
      null;
    savedViewToolbar = savedToolboxState &&
      savedToolboxState.viewToolbar &&
      typeof savedToolboxState.viewToolbar === 'object' ?
      savedToolboxState.viewToolbar :
      null;
    savedPaper = savedToolboxState &&
      savedToolboxState.paper &&
      typeof savedToolboxState.paper === 'object' ?
      savedToolboxState.paper :
      savedDiagramData &&
        savedDiagramData.page &&
        typeof savedDiagramData.page === 'object' ?
        savedDiagramData.page :
        null;
    if (savedToolboxPanel) {
      this.options.toolbox = diagramBoolean(
        savedToolboxPanel.visible,
        this.options.toolbox
      );
      this.options.toolboxFloating = diagramBoolean(
        savedToolboxPanel.floating,
        this.options.toolboxFloating
      );
      this.options.toolboxFloatLeft = Math.max(
        0,
        diagramNumber(
          savedToolboxPanel.left,
          this.options.toolboxFloatLeft
        )
      );
      this.options.toolboxFloatTop = Math.max(
        0,
        diagramNumber(
          savedToolboxPanel.top,
          this.options.toolboxFloatTop
        )
      );
      this.options.toolboxWidth = diagramClamp(
        diagramNumber(savedToolboxPanel.width, this.options.toolboxWidth),
        this.options.toolboxMinWidth,
        this.options.toolboxMaxWidth
      );
      this.options.toolboxHeight = diagramClamp(
        diagramNumber(savedToolboxPanel.height, this.options.toolboxHeight),
        this.options.toolboxMinHeight,
        this.options.toolboxMaxHeight
      );
      this.options.toolboxDockSide = normalizeDiagramDockSide(
        savedToolboxPanel.dockSide,
        this.options.toolboxDockSide
      );
    }
    if (savedPropertiesPanel) {
      this.options.propertiesPanel = diagramBoolean(
        savedPropertiesPanel.visible,
        this.options.propertiesPanel
      );
      this.options.propertiesFloating = diagramBoolean(
        savedPropertiesPanel.floating,
        this.options.propertiesFloating
      );
      this.options.propertiesFloatLeft = Math.max(
        0,
        diagramNumber(
          savedPropertiesPanel.left,
          this.options.propertiesFloatLeft
        )
      );
      this.options.propertiesFloatTop = Math.max(
        0,
        diagramNumber(
          savedPropertiesPanel.top,
          this.options.propertiesFloatTop
        )
      );
      this.options.propertiesWidth = diagramClamp(
        diagramNumber(
          savedPropertiesPanel.width,
          this.options.propertiesWidth
        ),
        this.options.propertiesMinWidth,
        this.options.propertiesMaxWidth
      );
      this.options.propertiesHeight = diagramClamp(
        diagramNumber(
          savedPropertiesPanel.height,
          this.options.propertiesHeight
        ),
        this.options.propertiesMinHeight,
        this.options.propertiesMaxHeight
      );
      this.options.propertiesDockSide = normalizeDiagramDockSide(
        savedPropertiesPanel.dockSide,
        this.options.propertiesDockSide
      );
    }
    if (savedPaper) {
      this.options.paperSize = normalizeDiagramPaperSize(savedPaper.size);
      this.options.paperOrientation = normalizeDiagramPaperOrientation(
        savedPaper.orientation
      );
      paperDimensions = getDiagramPaperDimensions(
        this.options.paperSize,
        this.options.paperOrientation
      );
      this.options.pageWidth = Math.max(
        300,
        diagramNumber(savedPaper.width, paperDimensions.width)
      );
      this.options.pageHeight = Math.max(
        240,
        diagramNumber(savedPaper.height, paperDimensions.height)
      );
      if (savedPaper.color != null) {
        this.options.pageColor = String(savedPaper.color);
      }
      if (savedPaper.gridSize != null) {
        this.options.gridSize = Math.max(
          5,
          diagramNumber(savedPaper.gridSize, this.options.gridSize)
        );
      }
    }
    if (
      savedViewToolbar &&
      savedViewToolbar.left != null &&
      savedViewToolbar.top != null &&
      isFinite(Number(savedViewToolbar.left)) &&
      isFinite(Number(savedViewToolbar.top))
    ) {
      this.options.viewToolbarLeft = Math.max(
        0,
        Number(savedViewToolbar.left)
      );
      this.options.viewToolbarTop = Math.max(
        0,
        Number(savedViewToolbar.top)
      );
    }
    this._sameSideDockTab = savedToolboxState && (
      savedToolboxState.dockTab === 'toolbox' ||
      savedToolboxState.dockTab === 'properties'
    ) ? savedToolboxState.dockTab : this.options.sameSideDockTab;
    this.options.sameSideDockTab = this._sameSideDockTab;
    if (savedToolboxState && savedToolboxState.dockMode != null) {
      this.options.sameSideDockMode = normalizeDiagramSameSideDockMode(
        savedToolboxState.dockMode
      );
    }
    this._toolboxCollapsed = normalizeDiagramToolboxCollapsed(
      savedToolboxState,
      this.options.toolboxCollapsed
    );
    this._toolboxOrder = normalizeDiagramToolboxOrder(
      savedToolboxState && savedToolboxState.order,
      this.options.toolboxOrder
    );
    this.options.toolboxOrder = this._toolboxOrder.slice();
    this.options.pageWidth = Math.max(300, diagramNumber(this.options.pageWidth, 1200));
    this.options.pageHeight = Math.max(240, diagramNumber(this.options.pageHeight, 800));
    this.options.minZoom = Math.max(0.1, diagramNumber(this.options.minZoom, 0.25));
    this.options.maxZoom = Math.max(
      this.options.minZoom,
      diagramNumber(this.options.maxZoom, 2)
    );
    this.options.zoomLevel = diagramClamp(
      diagramNumber(this.options.zoomLevel, 1),
      this.options.minZoom,
      this.options.maxZoom
    );
    this._data = normalizeDiagramData(savedDiagramData || {
      nodes: this.options.nodes,
      connectors: this.options.connectors
    });
    this.options.nodes = this._data.nodes;
    this.options.connectors = this._data.connectors;
    this._resetHistory();
    this._build();
    this._mountContextMenu();
    this._bind();
    this.setLocale(this.options.locale);
    this.setTheme(this.options.theme);
    this.render();
    this.hostElement.__fabuiDiagram = this;
    registerControl(this.hostElement, this);
    this._fire('ContentReady');
  }

  Diagram.prototype = Object.create(Control.prototype);
  Diagram.prototype.constructor = Diagram;

  Diagram.prototype._build = function() {
    var root = this.hostElement;
    var workspace = document.createElement('div');
    var toolbox = document.createElement('aside');
    var toolboxHeader = document.createElement('div');
    var searchHost = document.createElement('input');
    var toolboxGroups = document.createElement('div');
    var toolboxResizerLeft = document.createElement('div');
    var toolboxResizerRight = document.createElement('div');
    var toolboxResizerTop = document.createElement('div');
    var toolboxResizerBottom = document.createElement('div');
    var viewport = document.createElement('div');
    var svg = createDiagramSvgElement('svg', {
      class: 'fui-diagram-svg',
      role: 'img'
    });
    var properties = document.createElement('aside');
    var propertiesResizerLeft = document.createElement('div');
    var propertiesResizerRight = document.createElement('div');
    var propertiesResizerTop = document.createElement('div');
    var propertiesResizerBottom = document.createElement('div');
    var propertiesHeader = document.createElement('div');
    var propertiesBody = document.createElement('div');
    var dockTabsHost = document.createElement('div');
    var dockStackHost = document.createElement('div');
    var toolbar = document.createElement('div');
    var viewToolbar = document.createElement('div');
    var jsonFileInput = document.createElement('input');
    root.textContent = '';
    root.classList.add('fui-diagram');
    root.style.width = diagramSize(this.options.width, '100%');
    root.style.height = diagramSize(this.options.height, 620);
    root.setAttribute('role', 'application');
    root.setAttribute('aria-label', this.options.ariaLabel || localePacks.en.diagram);
    root.setAttribute('aria-disabled', this.options.disabled ? 'true' : 'false');
    root.setAttribute('aria-readonly', this.options.readOnly ? 'true' : 'false');
    root.tabIndex = this.options.disabled ? -1 : 0;
    toolbar.className = 'fui-diagram-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbox.className = 'fui-diagram-toolbox';
    toolboxHeader.className = 'fui-diagram-pane-header';
    toolboxHeader.setAttribute(
      'title',
      localePacks.en.dragToolbox
    );
    toolboxHeader.setAttribute('data-diagram-toolbox-panel-drag', '');
    searchHost.className = 'fui-diagram-toolbox-search-source';
    searchHost.type = 'text';
    toolboxGroups.className = 'fui-diagram-toolbox-groups';
    toolbox.appendChild(toolboxHeader);
    if (this.options.toolboxSearch) toolbox.appendChild(searchHost);
    toolbox.appendChild(toolboxGroups);
    toolboxResizerLeft.className =
      'fui-diagram-panel-resizer fui-diagram-toolbox-resizer ' +
      'fui-diagram-panel-resizer-left';
    toolboxResizerLeft.setAttribute('role', 'separator');
    toolboxResizerLeft.setAttribute('aria-orientation', 'vertical');
    toolboxResizerLeft.setAttribute('aria-label', localePacks.en.resizeToolbox);
    toolboxResizerLeft.setAttribute('data-diagram-panel-resizer', 'toolbox');
    toolboxResizerLeft.setAttribute('data-diagram-resizer-edge', 'left');
    toolboxResizerLeft.tabIndex = this.options.disabled ? -1 : 0;
    toolboxResizerRight.className =
      'fui-diagram-panel-resizer fui-diagram-toolbox-resizer ' +
      'fui-diagram-panel-resizer-right';
    toolboxResizerRight.setAttribute('role', 'separator');
    toolboxResizerRight.setAttribute('aria-orientation', 'vertical');
    toolboxResizerRight.setAttribute('aria-label', localePacks.en.resizeToolbox);
    toolboxResizerRight.setAttribute('data-diagram-panel-resizer', 'toolbox');
    toolboxResizerRight.setAttribute('data-diagram-resizer-edge', 'right');
    toolboxResizerRight.tabIndex = this.options.disabled ? -1 : 0;
    toolboxResizerTop.className =
      'fui-diagram-panel-resizer fui-diagram-toolbox-resizer ' +
      'fui-diagram-panel-resizer-top';
    toolboxResizerTop.setAttribute('role', 'separator');
    toolboxResizerTop.setAttribute('aria-orientation', 'horizontal');
    toolboxResizerTop.setAttribute(
      'aria-label',
      localePacks.en.resizeToolboxHeight
    );
    toolboxResizerTop.setAttribute('data-diagram-panel-resizer', 'toolbox');
    toolboxResizerTop.setAttribute('data-diagram-resizer-edge', 'top');
    toolboxResizerTop.tabIndex = this.options.disabled ? -1 : 0;
    toolboxResizerBottom.className =
      'fui-diagram-panel-resizer fui-diagram-toolbox-resizer ' +
      'fui-diagram-panel-resizer-bottom';
    toolboxResizerBottom.setAttribute('role', 'separator');
    toolboxResizerBottom.setAttribute('aria-orientation', 'horizontal');
    toolboxResizerBottom.setAttribute(
      'aria-label',
      localePacks.en.resizeToolboxHeight
    );
    toolboxResizerBottom.setAttribute('data-diagram-panel-resizer', 'toolbox');
    toolboxResizerBottom.setAttribute('data-diagram-resizer-edge', 'bottom');
    toolboxResizerBottom.tabIndex = this.options.disabled ? -1 : 0;
    viewport.className = 'fui-diagram-viewport';
    viewport.tabIndex = -1;
    svg.setAttribute('viewBox', '0 0 ' + this.options.pageWidth + ' ' + this.options.pageHeight);
    viewport.appendChild(svg);
    properties.className = 'fui-diagram-properties';
    propertiesHeader.className = 'fui-diagram-pane-header';
    propertiesHeader.setAttribute(
      'title',
      localePacks.en.dragProperties
    );
    propertiesHeader.setAttribute(
      'data-diagram-properties-panel-drag',
      ''
    );
    propertiesBody.className = 'fui-diagram-properties-body';
    properties.appendChild(propertiesHeader);
    properties.appendChild(propertiesBody);
    propertiesResizerLeft.className =
      'fui-diagram-panel-resizer fui-diagram-properties-resizer ' +
      'fui-diagram-panel-resizer-left';
    propertiesResizerLeft.setAttribute('role', 'separator');
    propertiesResizerLeft.setAttribute('aria-orientation', 'vertical');
    propertiesResizerLeft.setAttribute(
      'aria-label',
      localePacks.en.resizeProperties
    );
    propertiesResizerLeft.setAttribute(
      'data-diagram-panel-resizer',
      'properties'
    );
    propertiesResizerLeft.setAttribute('data-diagram-resizer-edge', 'left');
    propertiesResizerLeft.tabIndex = this.options.disabled ? -1 : 0;
    propertiesResizerRight.className =
      'fui-diagram-panel-resizer fui-diagram-properties-resizer ' +
      'fui-diagram-panel-resizer-right';
    propertiesResizerRight.setAttribute('role', 'separator');
    propertiesResizerRight.setAttribute('aria-orientation', 'vertical');
    propertiesResizerRight.setAttribute(
      'aria-label',
      localePacks.en.resizeProperties
    );
    propertiesResizerRight.setAttribute(
      'data-diagram-panel-resizer',
      'properties'
    );
    propertiesResizerRight.setAttribute('data-diagram-resizer-edge', 'right');
    propertiesResizerRight.tabIndex = this.options.disabled ? -1 : 0;
    propertiesResizerTop.className =
      'fui-diagram-panel-resizer fui-diagram-properties-resizer ' +
      'fui-diagram-panel-resizer-top';
    propertiesResizerTop.setAttribute('role', 'separator');
    propertiesResizerTop.setAttribute('aria-orientation', 'horizontal');
    propertiesResizerTop.setAttribute(
      'aria-label',
      localePacks.en.resizePropertiesHeight
    );
    propertiesResizerTop.setAttribute(
      'data-diagram-panel-resizer',
      'properties'
    );
    propertiesResizerTop.setAttribute('data-diagram-resizer-edge', 'top');
    propertiesResizerTop.tabIndex = this.options.disabled ? -1 : 0;
    propertiesResizerBottom.className =
      'fui-diagram-panel-resizer fui-diagram-properties-resizer ' +
      'fui-diagram-panel-resizer-bottom';
    propertiesResizerBottom.setAttribute('role', 'separator');
    propertiesResizerBottom.setAttribute('aria-orientation', 'horizontal');
    propertiesResizerBottom.setAttribute(
      'aria-label',
      localePacks.en.resizePropertiesHeight
    );
    propertiesResizerBottom.setAttribute(
      'data-diagram-panel-resizer',
      'properties'
    );
    propertiesResizerBottom.setAttribute('data-diagram-resizer-edge', 'bottom');
    propertiesResizerBottom.tabIndex = this.options.disabled ? -1 : 0;
    dockTabsHost.className = 'fui-diagram-dock-tabs';
    dockTabsHost.hidden = true;
    dockStackHost.className = 'fui-diagram-dock-stack';
    dockStackHost.hidden = true;
    workspace.className = 'fui-diagram-workspace';
    workspace.appendChild(toolbox);
    workspace.appendChild(toolboxResizerLeft);
    workspace.appendChild(toolboxResizerRight);
    workspace.appendChild(toolboxResizerTop);
    workspace.appendChild(toolboxResizerBottom);
    workspace.appendChild(viewport);
    workspace.appendChild(properties);
    workspace.appendChild(propertiesResizerLeft);
    workspace.appendChild(propertiesResizerRight);
    workspace.appendChild(propertiesResizerTop);
    workspace.appendChild(propertiesResizerBottom);
    workspace.appendChild(dockTabsHost);
    workspace.appendChild(dockStackHost);
    viewToolbar.className = 'fui-diagram-view-toolbar';
    viewToolbar.setAttribute('role', 'toolbar');
    viewToolbar.setAttribute('title', localePacks.en.dragViewToolbar);
    viewToolbar.setAttribute('aria-label', localePacks.en.dragViewToolbar);
    jsonFileInput.type = 'file';
    jsonFileInput.accept = 'application/json,.json';
    jsonFileInput.hidden = true;
    jsonFileInput.className = 'fui-diagram-json-file-input';
    root.appendChild(toolbar);
    root.appendChild(workspace);
    root.appendChild(viewToolbar);
    root.appendChild(jsonFileInput);
    this.toolbarElement = toolbar;
    this.workspaceElement = workspace;
    this.toolboxElement = toolbox;
    this.toolboxHeaderElement = toolboxHeader;
    this.toolboxSearchElement = searchHost;
    this.toolboxGroupsElement = toolboxGroups;
    this.toolboxResizerElement = toolboxResizerRight;
    this.toolboxResizerLeftElement = toolboxResizerLeft;
    this.toolboxResizerRightElement = toolboxResizerRight;
    this.toolboxResizerTopElement = toolboxResizerTop;
    this.toolboxResizerBottomElement = toolboxResizerBottom;
    this.viewportElement = viewport;
    this.svgElement = svg;
    this.propertiesElement = properties;
    this.propertiesResizerLeftElement = propertiesResizerLeft;
    this.propertiesResizerRightElement = propertiesResizerRight;
    this.propertiesResizerTopElement = propertiesResizerTop;
    this.propertiesResizerBottomElement = propertiesResizerBottom;
    this.propertiesHeaderElement = propertiesHeader;
    this.propertiesBodyElement = propertiesBody;
    this.dockTabsElement = dockTabsHost;
    this.dockStackElement = dockStackHost;
    this.viewToolbarElement = viewToolbar;
    this.jsonFileInputElement = jsonFileInput;
    this._mountDockTabs();
    this._renderToolbars();
    this._renderToolbox();
    this._mountToolboxSearch();
    this._syncStructure();
  };

  Diagram.prototype._mountDockTabs = function() {
    var self = this;
    var messages = localePacks[this.options.locale];
    if (typeof Tabs !== 'function') return;
    this._dockTabs = new Tabs(this.dockTabsElement, {
      fit: true,
      border: true,
      justified: true,
      narrow: true,
      draggable: false,
      tabPosition: 'bottom',
      selected: this._sameSideDockTab === 'properties' ? 1 : 0,
      locale: this.options.locale,
      theme: 'inherit',
      tabs: [
        { title: messages.toolbox },
        { title: messages.properties }
      ],
      onSelect: function(title, index) {
        if (self._syncingDockTabs) return;
        self._sameSideDockTab = index === 1 ?
          'properties' :
          'toolbox';
        self.options.sameSideDockTab = self._sameSideDockTab;
        self._syncStructure();
        self._saveToolboxState();
      }
    });
    this._dockTabsToolboxPanel = this._dockTabs.getTab(0);
    this._dockTabsPropertiesPanel = this._dockTabs.getTab(1);
  };

  Diagram.prototype._detachDockTabsPanels = function() {
    if (
      this.toolboxElement &&
      this.toolboxElement.parentNode !== this.workspaceElement
    ) {
      this.workspaceElement.insertBefore(
        this.toolboxElement,
        this.toolboxResizerLeftElement
      );
    }
    if (
      this.propertiesElement &&
      this.propertiesElement.parentNode !== this.workspaceElement
    ) {
      this.workspaceElement.insertBefore(
        this.propertiesElement,
        this.propertiesResizerLeftElement
      );
    }
    return this;
  };

  Diagram.prototype._syncDockTabsStructure = function(active) {
    var activeIndex;
    var activeWidth;
    var side = this.options.toolboxDockSide;
    active = Boolean(active && this._dockTabs);
    this.workspaceElement.classList.toggle(
      'fui-diagram-same-side-dock-tabs',
      active
    );
    this.workspaceElement.classList.toggle(
      'fui-diagram-same-side-dock-tabs-left',
      active && side === 'left'
    );
    this.workspaceElement.classList.toggle(
      'fui-diagram-same-side-dock-tabs-right',
      active && side === 'right'
    );
    if (!active) {
      this.dockTabsElement.hidden = true;
      return this;
    }
    this.dockTabsElement.hidden = false;
    if (this.toolboxElement.parentNode !== this._dockTabsToolboxPanel) {
      this._dockTabsToolboxPanel.appendChild(this.toolboxElement);
    }
    if (
      this.propertiesElement.parentNode !==
      this._dockTabsPropertiesPanel
    ) {
      this._dockTabsPropertiesPanel.appendChild(this.propertiesElement);
    }
    activeIndex = this._sameSideDockTab === 'properties' ? 1 : 0;
    activeWidth = activeIndex === 1 ?
      this.options.propertiesWidth :
      this.options.toolboxWidth;
    this.workspaceElement.style.setProperty(
      '--fui-diagram-dock-tabs-width',
      activeWidth + 'px'
    );
    this._syncingDockTabs = true;
    this._dockTabs.select(activeIndex, true);
    this._syncingDockTabs = false;
    this._dockTabs.resize();
    return this;
  };

  Diagram.prototype._syncDockStackStructure = function(active) {
    var side = this.options.toolboxDockSide;
    active = Boolean(active);
    this.workspaceElement.classList.toggle(
      'fui-diagram-same-side-dock-stack',
      active
    );
    this.workspaceElement.classList.toggle(
      'fui-diagram-same-side-dock-stack-left',
      active && side === 'left'
    );
    this.workspaceElement.classList.toggle(
      'fui-diagram-same-side-dock-stack-right',
      active && side === 'right'
    );
    if (!active) {
      this.dockStackElement.hidden = true;
      return this;
    }
    this.dockStackElement.hidden = false;
    if (this.toolboxElement.parentNode !== this.dockStackElement) {
      this.dockStackElement.appendChild(this.toolboxElement);
    }
    if (this.propertiesElement.parentNode !== this.dockStackElement) {
      this.dockStackElement.appendChild(this.propertiesElement);
    }
    this.workspaceElement.style.setProperty(
      '--fui-diagram-dock-stack-width',
      this.options.toolboxWidth + 'px'
    );
    return this;
  };

  Diagram.prototype._mountContextMenu = function() {
    var self = this;
    var messages = localePacks[this.options.locale];
    var host;
    if (!this.options.contextMenu || typeof Menu !== 'function') return;
    host = document.createElement('div');
    host.className = 'fui-diagram-context-menu';
    host.hidden = true;
    this.hostElement.appendChild(host);
    this._contextMenuHost = host;
    this._contextMenu = new Menu(host, {
      minWidth: 150,
      hideOnUnhover: false,
      locale: this.options.locale,
      theme: 'inherit',
      ariaLabel: messages.diagram,
      items: [{
        name: 'exportPng',
        text: messages.exportPng,
        iconCls: 'icon-export'
      }, {
        name: 'exportSvg',
        text: messages.exportSvg,
        iconCls: 'icon-export'
      }, {
        separator: true
      }, {
        name: 'print',
        text: messages.print,
        iconCls: 'icon-print'
      }, {
        separator: true
      }, {
        name: 'fullscreen',
        text: messages.presentation,
        iconCls: 'icon-projector-screen'
      }],
      onClick: function(item) {
        if (item.name === 'exportPng') {
          self.exportPng('fabui-diagram.png');
        } else if (item.name === 'exportSvg') {
          self.exportSvg('fabui-diagram.svg');
        } else if (item.name === 'print') {
          self.print();
        } else if (item.name === 'fullscreen') {
          self.togglePresentationFullscreen();
        }
      }
    });
  };

  Diagram.prototype._createToolbarButton = function(
    container,
    name,
    text,
    handler,
    toggle,
    iconCls
  ) {
    var self = this;
    var host = document.createElement('a');
    var control;
    host.href = 'javascript:void(0)';
    host.className = 'fui-diagram-command fui-diagram-command-' + name;
    host.textContent = text;
    host.setAttribute('data-diagram-command', name);
    container.appendChild(host);
    control = new Button(host, {
      text: text,
      iconCls: iconCls || '',
      plain: true,
      toggle: toggle === true,
      disabled: this.options.disabled === true,
      theme: 'inherit',
      onClick: function() {
        handler.call(self);
      }
    });
    this._buttonControls.push(control);
    this._toolbarButtons[name] = control;
    return control;
  };

  Diagram.prototype._createToolbarSeparator = function(container) {
    var separator = document.createElement('span');
    separator.className = 'fui-diagram-toolbar-separator';
    separator.setAttribute('role', 'separator');
    separator.setAttribute('aria-orientation', 'vertical');
    container.appendChild(separator);
    return separator;
  };

  Diagram.prototype._renderToolbars = function() {
    var self = this;
    this.toolbarElement.textContent = '';
    this.viewToolbarElement.textContent = '';
    this._buttonControls.forEach(function(control) {
      control.dispose();
    });
    this._buttonControls = [];
    this._toolbarButtons = {};
    if (this.options.mainToolbar) {
      this._createToolbarButton(
        this.toolbarElement,
        'download',
        'Download',
        function() {
          self.export('fabui-diagram.json');
        },
        false,
        'icon-save'
      );
      this._createToolbarButton(
        this.toolbarElement,
        'load',
        'Load',
        this.loadJsonFile,
        false,
        'icon-import'
      );
      this._createToolbarSeparator(this.toolbarElement);
      this._createToolbarButton(
        this.toolbarElement,
        'exportPng',
        'Export PNG',
        function() {
          self.exportPng('fabui-diagram.png');
        },
        false,
        'icon-export'
      );
      this._createToolbarButton(
        this.toolbarElement,
        'exportSvg',
        'Export SVG',
        function() {
          self.exportSvg('fabui-diagram.svg');
        },
        false,
        'icon-export'
      );
      this._createToolbarButton(
        this.toolbarElement,
        'print',
        'Print',
        this.print,
        false,
        'icon-print'
      );
      this._createToolbarSeparator(this.toolbarElement);
      this._createToolbarButton(
        this.toolbarElement,
        'undo',
        '',
        this.undo,
        false,
        'icon-undo'
      );
      this._createToolbarButton(
        this.toolbarElement,
        'redo',
        '',
        this.redo,
        false,
        'icon-redo'
      );
      this._createToolbarButton(this.toolbarElement, 'delete', 'Delete', this.removeSelected);
      this._createToolbarButton(
        this.toolbarElement,
        'clear',
        'Clear Page',
        this.clearPage,
        false,
        'icon-clear'
      );
      this._createToolbarSeparator(this.toolbarElement);
      this._createToolbarButton(
        this.toolbarElement,
        'connectStraight',
        '',
        function() {
          self.setConnectMode(self._connectMode, 'straight');
        },
        true,
        'icon-diagram-connect-straight'
      );
      this._createToolbarButton(
        this.toolbarElement,
        'connectOrthogonal',
        '',
        function() {
          self.setConnectMode(self._connectMode, 'orthogonal');
        },
        true,
        'icon-diagram-connect-orthogonal'
      );
      this._createToolbarButton(
        this.toolbarElement,
        'connectCurved',
        '',
        function() {
          self.setConnectMode(self._connectMode, 'curved');
        },
        true,
        'icon-diagram-connect-curved'
      );
      this._createToolbarButton(
        this.toolbarElement,
        'connectSCurve',
        '',
        function() {
          self.setConnectMode(self._connectMode, 'sCurve');
        },
        true,
        'icon-diagram-connect-s-curve'
      );
      this._createToolbarButton(this.toolbarElement, 'connect', 'Connect', function() {
        self.setConnectMode(!self._connectMode);
      }, true);
      this._createToolbarSeparator(this.toolbarElement);
      this._createToolbarButton(this.toolbarElement, 'toolbox', 'Toolbox', function() {
        self.options.toolbox = !self.options.toolbox;
        self._syncStructure();
        self._syncToolbarStates();
        self._saveToolboxState();
      }, true);
      this._createToolbarButton(this.toolbarElement, 'properties', 'Properties', function() {
        self.options.propertiesPanel = !self.options.propertiesPanel;
        self._syncStructure();
        self._syncToolbarStates();
        self._saveToolboxState();
      }, true);
      this._createToolbarButton(this.toolbarElement, 'readOnly', 'Read only', function() {
        self.setReadOnly(!self.options.readOnly);
      }, true);
    }
    if (this.options.viewToolbar) {
      this._createToolbarButton(this.viewToolbarElement, 'zoomOut', '−', function() {
        self.setZoom(self.options.zoomLevel - 0.1);
      });
      this.zoomLabelElement = document.createElement('span');
      this.zoomLabelElement.className = 'fui-diagram-zoom-label';
      this.viewToolbarElement.appendChild(this.zoomLabelElement);
      this._createToolbarButton(this.viewToolbarElement, 'zoomIn', '+', function() {
        self.setZoom(self.options.zoomLevel + 0.1);
      });
      this._createToolbarButton(this.viewToolbarElement, 'fit', 'Fit', this.fitToContent);
      this._createToolbarButton(this.viewToolbarElement, 'grid', 'Grid', function() {
        self.setShowGrid(!self.options.showGrid);
      }, true);
      this._createToolbarButton(
        this.viewToolbarElement,
        'presentation',
        '',
        this.togglePresentationFullscreen,
        false,
        'icon-projector-screen'
      );
      this._createToolbarButton(
        this.viewToolbarElement,
        'fullscreen',
        '',
        this.toggleFullscreen,
        false,
        'icon-fullscreen'
      );
    }
  };

  Diagram.prototype._mountToolboxSearch = function() {
    var self = this;
    if (!this.options.toolboxSearch || !this.toolboxSearchElement) return;
    this.toolboxSearchControl = new EditBox(this.toolboxSearchElement, {
      editor: 'text',
      width: '100%',
      prompt: localePacks[this.options.locale].searchShapes,
      theme: 'inherit',
      onChange: function(value) {
        self._filterToolbox(value);
      }
    });
    this._editBoxControls.push(this.toolboxSearchControl);
  };

  Diagram.prototype._createToolboxPreview = function(type) {
    var vertical = [
      'arrowUp',
      'arrowDown',
      'arrowUpDown'
    ].indexOf(type) >= 0;
    var circular = type === 'dfdProcess';
    var svg = createDiagramSvgElement('svg', {
      class: 'fui-diagram-shape-preview',
      viewBox: '0 0 60 42',
      'aria-hidden': 'true',
      focusable: 'false',
      'data-diagram-preview-shape': type
    });
    var node = {
      type: type,
      x: vertical ? 17 : circular ? 13 : 6,
      y: vertical ? 2 : circular ? 4 : 6,
      width: vertical ? 26 : circular ? 34 : 48,
      height: vertical ? 38 : circular ? 34 : 30,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.5
    };
    var shape;
    if (type === 'dfdDataFlow') {
      shape = createDiagramSvgElement('path', {
        d: 'M 5 29 Q 28 5 55 24 M 47 18 L 55 24 L 47 28',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': 1.5,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      });
    } else if (type === 'dfdSCurve') {
      shape = createDiagramSvgElement('path', {
        d: 'M 5 30 C 24 30 36 11 55 11 M 47 7 L 55 11 L 48 17',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': 1.5,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      });
    } else if (type === 'text') {
      shape = createDiagramSvgElement('text', {
        x: 30,
        y: 31,
        fill: 'currentColor',
        'font-family': 'Arial, sans-serif',
        'font-size': 28,
        'font-weight': 700,
        'text-anchor': 'middle'
      });
      shape.textContent = 'T';
    } else {
      shape = this._createShapeElement(node);
      shape.setAttribute('class', 'fui-diagram-toolbox-preview-shape');
      if (type.indexOf('orgChart') === 0) {
        shape.appendChild(this._createOrgChartPreviewLines(node));
      }
    }
    svg.appendChild(shape);
    return svg;
  };

  Diagram.prototype._renderToolbox = function() {
    var self = this;
    this._toolboxButtonControls.forEach(function(control) {
      control.dispose();
    });
    this._toolboxButtonControls = [];
    this.toolboxGroupsElement.textContent = '';
    this._toolboxOrder.forEach(function(category) {
      var group = document.createElement('section');
      var title = document.createElement('h3');
      var toggle = document.createElement('a');
      var dragHandle = document.createElement('a');
      var items = document.createElement('div');
      var label = self.messages ? self.messages[category] : category;
      var control;
      var dragControl;
      group.className = 'fui-diagram-toolbox-group';
      group.setAttribute('data-diagram-category', category);
      title.className = 'fui-diagram-toolbox-title';
      toggle.href = 'javascript:void(0)';
      toggle.className = 'fui-diagram-toolbox-toggle';
      toggle.draggable = false;
      toggle.setAttribute('data-diagram-toolbox-toggle', category);
      toggle.setAttribute(
        'aria-controls',
        'fui-diagram-toolbox-' + self._instanceId + '-' + category
      );
      items.className = 'fui-diagram-toolbox-items';
      items.id = 'fui-diagram-toolbox-' + self._instanceId + '-' + category;
      dragHandle.href = 'javascript:void(0)';
      dragHandle.className = 'fui-diagram-toolbox-drag-handle';
      dragHandle.draggable = false;
      dragHandle.setAttribute('data-diagram-toolbox-drag', category);
      dragHandle.setAttribute(
        'aria-label',
        (self.messages ? self.messages.reorderToolboxGroup : 'Reorder') +
          ': ' + label
      );
      dragHandle.title = self.messages ?
        self.messages.reorderToolboxGroup :
        'Drag to reorder toolbox group';
      DIAGRAM_TOOLBOX_ITEMS.filter(function(shape) {
        return shape.category === category;
      }).forEach(function(shape) {
        var button = document.createElement('button');
        var preview = self._createToolboxPreview(shape.type);
        var label = document.createElement('span');
        button.type = 'button';
        button.className = 'fui-diagram-shape-item';
        button.draggable = !shape.connectorType;
        if (shape.connectorType) {
          button.setAttribute('data-diagram-connector-tool', shape.connectorType);
          button.setAttribute('aria-pressed', 'false');
        } else {
          button.setAttribute('data-diagram-shape', shape.type);
          if (shape.category === 'dfd' || shape.category === 'orgChart') {
            button.setAttribute(
              'data-diagram-default-text',
              self.messages ? self.messages[shape.label] : shape.type
            );
          }
          if (shape.width) {
            button.setAttribute('data-diagram-default-width', shape.width);
          }
          if (shape.height) {
            button.setAttribute('data-diagram-default-height', shape.height);
          }
        }
        button.setAttribute('data-search-text', String(
          self.messages ? self.messages[shape.label] : shape.type
        ).toLowerCase());
        label.className = 'fui-diagram-shape-label';
        label.textContent = self.messages ? self.messages[shape.label] : shape.type;
        button.appendChild(preview);
        button.appendChild(label);
        items.appendChild(button);
      });
      title.appendChild(toggle);
      title.appendChild(dragHandle);
      group.appendChild(title);
      group.appendChild(items);
      self.toolboxGroupsElement.appendChild(group);
      control = new Button(toggle, {
        text: label,
        plain: true,
        disabled: self.options.disabled === true,
        theme: 'inherit'
      });
      self._toolboxButtonControls.push(control);
      dragControl = new Button(dragHandle, {
        text: '',
        iconCls: 'icon-drag-vertical',
        plain: true,
        disabled: self.options.disabled === true,
        theme: 'inherit'
      });
      self._toolboxButtonControls.push(dragControl);
    });
    this._filterToolbox(this._toolboxFilter);
  };

  Diagram.prototype._filterToolbox = function(value) {
    var search = String(value || '').trim().toLowerCase();
    var self = this;
    var connectorTools;
    var index;
    this._toolboxFilter = search;
    Array.prototype.forEach.call(
      this.toolboxGroupsElement.querySelectorAll('.fui-diagram-shape-item'),
      function(item) {
        item.hidden = Boolean(search) &&
          item.getAttribute('data-search-text').indexOf(search) < 0;
      }
    );
    Array.prototype.forEach.call(
      this.toolboxGroupsElement.querySelectorAll('.fui-diagram-toolbox-group'),
      function(group) {
        var category = group.getAttribute('data-diagram-category');
        var collapsed = Boolean(self._toolboxCollapsed[category]);
        var items = group.querySelector('.fui-diagram-toolbox-items');
        var toggle = group.querySelector('[data-diagram-toolbox-toggle]');
        group.hidden = !group.querySelector('.fui-diagram-shape-item:not([hidden])');
        items.hidden = collapsed;
        group.classList.toggle('fui-diagram-toolbox-group-collapsed', collapsed);
        toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      }
    );
    connectorTools = this.toolboxGroupsElement.querySelectorAll(
      '[data-diagram-connector-tool]'
    );
    for (index = 0; index < connectorTools.length; index += 1) {
      connectorTools[index].classList.toggle(
        'fui-diagram-shape-item-selected',
        this._connectMode &&
        connectorTools[index].getAttribute('data-diagram-connector-tool') ===
          this._connectType
      );
      connectorTools[index].setAttribute(
        'aria-pressed',
        this._connectMode &&
        connectorTools[index].getAttribute('data-diagram-connector-tool') ===
          this._connectType ?
          'true' :
          'false'
      );
    }
  };

  Diagram.prototype._saveToolboxState = function() {
    var state = diagramAssign({}, this._toolboxCollapsed);
    state.order = this._toolboxOrder.slice();
    state.panels = {
      toolbox: {
        visible: this.options.toolbox,
        floating: this.options.toolboxFloating,
        dockSide: this.options.toolboxDockSide,
        left: this.options.toolboxFloatLeft,
        top: this.options.toolboxFloatTop,
        width: this.options.toolboxWidth,
        height: this.options.toolboxHeight
      },
      properties: {
        visible: this.options.propertiesPanel,
        floating: this.options.propertiesFloating,
        dockSide: this.options.propertiesDockSide,
        left: this.options.propertiesFloatLeft,
        top: this.options.propertiesFloatTop,
        width: this.options.propertiesWidth,
        height: this.options.propertiesHeight
      }
    };
    state.viewToolbar = {
      left: this.options.viewToolbarLeft,
      top: this.options.viewToolbarTop
    };
    state.paper = this.getPaper();
    state.diagram = this.getData();
    state.dockTab = this._sameSideDockTab;
    state.dockMode = this.options.sameSideDockMode;
    writeDiagramToolboxState(
      this.options.toolboxStateKey,
      state
    );
  };

  Diagram.prototype._clearToolboxDropIndicator = function() {
    Array.prototype.forEach.call(
      this.toolboxGroupsElement.querySelectorAll(
        '.fui-diagram-toolbox-group-drop-before,' +
        '.fui-diagram-toolbox-group-drop-after'
      ),
      function(group) {
        group.classList.remove('fui-diagram-toolbox-group-drop-before');
        group.classList.remove('fui-diagram-toolbox-group-drop-after');
      }
    );
    this._toolboxDropCategory = '';
    this._toolboxDropAfter = false;
  };

  Diagram.prototype._moveToolboxGroup = function(
    sourceCategory,
    targetCategory,
    after
  ) {
    var nextOrder = reorderDiagramToolboxOrder(
      this._toolboxOrder,
      sourceCategory,
      targetCategory,
      after
    );
    if (nextOrder.join('|') === this._toolboxOrder.join('|')) return false;
    this._toolboxOrder = nextOrder;
    this.options.toolboxOrder = nextOrder.slice();
    this._saveToolboxState();
    this._renderToolbox();
    return true;
  };

  Diagram.prototype._bindToolboxOrderInteraction = function() {
    var self = this;
    this._unbindToolboxOrderInteraction();
    this._onToolboxOrderPointerMove = function(event) {
      var state = self._toolboxOrderDrag;
      var target;
      var group;
      var category;
      var rect;
      var after;
      if (!state || event.pointerId !== state.pointerId) return;
      event.preventDefault();
      target = document.elementFromPoint(event.clientX, event.clientY);
      group = target && target.closest ?
        target.closest('.fui-diagram-toolbox-group') :
        null;
      if (!group) {
        self._clearToolboxDropIndicator();
        return;
      }
      category = group.getAttribute('data-diagram-category');
      if (!category || category === state.sourceCategory) {
        self._clearToolboxDropIndicator();
        return;
      }
      rect = group.getBoundingClientRect();
      after = event.clientY > rect.top + rect.height / 2;
      self._clearToolboxDropIndicator();
      self._toolboxDropCategory = category;
      self._toolboxDropAfter = after;
      group.classList.add(
        after ?
          'fui-diagram-toolbox-group-drop-after' :
          'fui-diagram-toolbox-group-drop-before'
      );
    };
    this._onToolboxOrderPointerEnd = function(event) {
      var state = self._toolboxOrderDrag;
      var targetCategory;
      var after;
      if (!state || event.pointerId !== state.pointerId) return;
      targetCategory = self._toolboxDropCategory;
      after = self._toolboxDropAfter;
      self._toolboxOrderDrag = null;
      Array.prototype.forEach.call(
        self.toolboxGroupsElement.querySelectorAll(
          '.fui-diagram-toolbox-group-dragging'
        ),
        function(group) {
          group.classList.remove('fui-diagram-toolbox-group-dragging');
        }
      );
      self._clearToolboxDropIndicator();
      self._unbindToolboxOrderInteraction();
      if (event.type !== 'pointercancel' && targetCategory) {
        self._moveToolboxGroup(
          state.sourceCategory,
          targetCategory,
          after
        );
      }
    };
    document.addEventListener(
      'pointermove',
      this._onToolboxOrderPointerMove
    );
    document.addEventListener(
      'pointerup',
      this._onToolboxOrderPointerEnd
    );
    document.addEventListener(
      'pointercancel',
      this._onToolboxOrderPointerEnd
    );
  };

  Diagram.prototype._unbindToolboxOrderInteraction = function() {
    if (!this._onToolboxOrderPointerMove) return;
    document.removeEventListener(
      'pointermove',
      this._onToolboxOrderPointerMove
    );
    document.removeEventListener(
      'pointerup',
      this._onToolboxOrderPointerEnd
    );
    document.removeEventListener(
      'pointercancel',
      this._onToolboxOrderPointerEnd
    );
    this._onToolboxOrderPointerMove = null;
    this._onToolboxOrderPointerEnd = null;
  };

  Diagram.prototype._syncStructure = function() {
    var availableHeight;
    var propertiesHidden;
    var propertiesFloating;
    var propertiesTabActive;
    var sameSideDocked;
    var sameSideDockStack;
    var sameSideDockTabs;
    var toolboxHidden;
    var toolboxFloating;
    var toolboxTabActive;
    this.toolboxElement.hidden = !this.options.toolbox || this.options.readOnly;
    toolboxHidden = this.toolboxElement.hidden;
    toolboxFloating = this.options.toolboxFloating &&
      !toolboxHidden;
    this.toolboxResizerLeftElement.hidden = toolboxHidden || (
      !toolboxFloating && this.options.toolboxDockSide === 'left'
    );
    this.toolboxResizerRightElement.hidden = toolboxHidden || (
      !toolboxFloating && this.options.toolboxDockSide === 'right'
    );
    this.toolboxResizerTopElement.hidden = !toolboxFloating;
    this.toolboxResizerBottomElement.hidden = !toolboxFloating;
    this.propertiesElement.hidden = !this.options.propertiesPanel || this.options.readOnly;
    propertiesHidden = this.propertiesElement.hidden;
    propertiesFloating = this.options.propertiesFloating &&
      !propertiesHidden;
    sameSideDocked = !toolboxHidden &&
      !propertiesHidden &&
      !toolboxFloating &&
      !propertiesFloating &&
      this.options.toolboxDockSide === this.options.propertiesDockSide;
    sameSideDockTabs = sameSideDocked &&
      this.options.sameSideDockMode === 'tabs';
    sameSideDockStack = sameSideDocked &&
      this.options.sameSideDockMode === 'stacked';
    this._syncDockStackStructure(false);
    this._syncDockTabsStructure(sameSideDockTabs);
    this._syncDockStackStructure(sameSideDockStack);
    if (!sameSideDocked) this._detachDockTabsPanels();
    this.propertiesResizerLeftElement.hidden = propertiesHidden || (
      !propertiesFloating && this.options.propertiesDockSide === 'left'
    );
    this.propertiesResizerRightElement.hidden = propertiesHidden || (
      !propertiesFloating && this.options.propertiesDockSide === 'right'
    );
    this.propertiesResizerTopElement.hidden = !propertiesFloating;
    this.propertiesResizerBottomElement.hidden = !propertiesFloating;
    if (sameSideDockTabs) {
      toolboxTabActive = this._sameSideDockTab === 'toolbox';
      propertiesTabActive = !toolboxTabActive;
      this.toolboxResizerLeftElement.hidden = !toolboxTabActive ||
        this.options.toolboxDockSide === 'left';
      this.toolboxResizerRightElement.hidden = !toolboxTabActive ||
        this.options.toolboxDockSide === 'right';
      this.propertiesResizerLeftElement.hidden = !propertiesTabActive ||
        this.options.propertiesDockSide === 'left';
      this.propertiesResizerRightElement.hidden = !propertiesTabActive ||
        this.options.propertiesDockSide === 'right';
    } else if (sameSideDockStack) {
      this.propertiesResizerLeftElement.hidden = true;
      this.propertiesResizerRightElement.hidden = true;
    }
    this.toolbarElement.hidden = !this.options.mainToolbar;
    this.viewToolbarElement.hidden = !this.options.viewToolbar;
    this.workspaceElement.classList.toggle(
      'fui-diagram-toolbox-right',
      this.options.toolboxDockSide === 'right'
    );
    this.workspaceElement.classList.toggle(
      'fui-diagram-properties-left',
      this.options.propertiesDockSide === 'left'
    );
    this.workspaceElement.classList.toggle(
      'fui-diagram-toolbox-floating',
      toolboxFloating
    );
    this.workspaceElement.classList.toggle(
      'fui-diagram-no-toolbox',
      toolboxHidden || toolboxFloating
    );
    this.workspaceElement.classList.toggle(
      'fui-diagram-no-properties',
      propertiesHidden || propertiesFloating
    );
    this.workspaceElement.classList.toggle(
      'fui-diagram-properties-floating',
      propertiesFloating
    );
    this._syncFloatingPanelStack();
    this.workspaceElement.style.setProperty(
      '--fui-diagram-toolbox-width',
      this.options.toolboxWidth + 'px'
    );
    this.workspaceElement.style.setProperty(
      '--fui-diagram-properties-width',
      this.options.propertiesWidth + 'px'
    );
    availableHeight = this.workspaceElement.clientHeight;
    if (toolboxFloating && availableHeight > 0) {
      this.options.toolboxHeight = diagramClamp(
        this.options.toolboxHeight,
        this.options.toolboxMinHeight,
        Math.max(
          this.options.toolboxMinHeight,
          Math.min(this.options.toolboxMaxHeight, availableHeight)
        )
      );
    }
    if (propertiesFloating && availableHeight > 0) {
      this.options.propertiesHeight = diagramClamp(
        this.options.propertiesHeight,
        this.options.propertiesMinHeight,
        Math.max(
          this.options.propertiesMinHeight,
          Math.min(this.options.propertiesMaxHeight, availableHeight)
        )
      );
    }
    this.workspaceElement.style.setProperty(
      '--fui-diagram-toolbox-height',
      this.options.toolboxHeight + 'px'
    );
    this.workspaceElement.style.setProperty(
      '--fui-diagram-properties-height',
      this.options.propertiesHeight + 'px'
    );
    [
      this.toolboxResizerLeftElement,
      this.toolboxResizerRightElement
    ].forEach(function(element) {
      element.setAttribute(
        'aria-valuemin',
        String(this.options.toolboxMinWidth)
      );
      element.setAttribute(
        'aria-valuemax',
        String(this.options.toolboxMaxWidth)
      );
      element.setAttribute(
        'aria-valuenow',
        String(this.options.toolboxWidth)
      );
    }, this);
    [
      this.propertiesResizerLeftElement,
      this.propertiesResizerRightElement
    ].forEach(function(element) {
      element.setAttribute(
        'aria-valuemin',
        String(this.options.propertiesMinWidth)
      );
      element.setAttribute(
        'aria-valuemax',
        String(this.options.propertiesMaxWidth)
      );
      element.setAttribute(
        'aria-valuenow',
        String(this.options.propertiesWidth)
      );
    }, this);
    [
      this.toolboxResizerTopElement,
      this.toolboxResizerBottomElement
    ].forEach(function(element) {
      element.setAttribute(
        'aria-valuemin',
        String(this.options.toolboxMinHeight)
      );
      element.setAttribute(
        'aria-valuemax',
        String(this.options.toolboxMaxHeight)
      );
      element.setAttribute(
        'aria-valuenow',
        String(this.options.toolboxHeight)
      );
    }, this);
    [
      this.propertiesResizerTopElement,
      this.propertiesResizerBottomElement
    ].forEach(function(element) {
      element.setAttribute(
        'aria-valuemin',
        String(this.options.propertiesMinHeight)
      );
      element.setAttribute(
        'aria-valuemax',
        String(this.options.propertiesMaxHeight)
      );
      element.setAttribute(
        'aria-valuenow',
        String(this.options.propertiesHeight)
      );
    }, this);
    if (toolboxFloating) {
      this._setToolboxFloatPosition(
        this.options.toolboxFloatLeft,
        this.options.toolboxFloatTop
      );
    }
    if (propertiesFloating) {
      this._setPropertiesFloatPosition(
        this.options.propertiesFloatLeft,
        this.options.propertiesFloatTop
      );
    }
    this._syncViewToolbarPosition();
  };

  Diagram.prototype._syncFloatingPanelStack = function() {
    var bothFloating = this.options.toolboxFloating &&
      this.options.propertiesFloating &&
      !this.toolboxElement.hidden &&
      !this.propertiesElement.hidden;
    this.workspaceElement.classList.toggle(
      'fui-diagram-floating-front-toolbox',
      bothFloating && this._floatingPanelFront === 'toolbox'
    );
    this.workspaceElement.classList.toggle(
      'fui-diagram-floating-front-properties',
      bothFloating && this._floatingPanelFront === 'properties'
    );
    return this;
  };

  Diagram.prototype._bringFloatingPanelToFront = function(panel) {
    if (
      !this.options.toolboxFloating ||
      !this.options.propertiesFloating
    ) return this._syncFloatingPanelStack();
    this._floatingPanelFront = panel === 'toolbox' ?
      'toolbox' :
      'properties';
    return this._syncFloatingPanelStack();
  };

  Diagram.prototype._bind = function() {
    var self = this;
    this._onSvgPointerDown = function(event) {
      self._handlePointerDown(event);
    };
    this._onSvgClick = function(event) {
      self._handleSvgClick(event);
    };
    this._onSvgDblClick = function(event) {
      self._handleSvgDblClick(event);
    };
    this._onToolboxClick = function(event) {
      var toggle = event.target.closest('[data-diagram-toolbox-toggle]');
      var connectorTool = event.target.closest('[data-diagram-connector-tool]');
      var category;
      var item = event.target.closest('[data-diagram-shape]');
      var nodeOptions;
      if (toggle && !self.options.disabled && !self.options.readOnly) {
        category = toggle.getAttribute('data-diagram-toolbox-toggle');
        self._toolboxCollapsed[category] = !self._toolboxCollapsed[category];
        self._saveToolboxState();
        self._filterToolbox(self._toolboxFilter);
        return;
      }
      if (connectorTool && !self.options.disabled && !self.options.readOnly) {
        self.setConnectMode(
          !(self._connectMode && self._connectType ===
            connectorTool.getAttribute('data-diagram-connector-tool')),
          connectorTool.getAttribute('data-diagram-connector-tool')
        );
        return;
      }
      if (item && !self.options.disabled && !self.options.readOnly) {
        nodeOptions = {
          type: item.getAttribute('data-diagram-shape')
        };
        if (item.hasAttribute('data-diagram-default-text')) {
          nodeOptions.text = item.getAttribute('data-diagram-default-text');
        }
        if (item.hasAttribute('data-diagram-default-width')) {
          nodeOptions.width = Number(
            item.getAttribute('data-diagram-default-width')
          );
        }
        if (item.hasAttribute('data-diagram-default-height')) {
          nodeOptions.height = Number(
            item.getAttribute('data-diagram-default-height')
          );
        }
        self.addNode(nodeOptions);
      }
    };
    this._onToolboxDragStart = function(event) {
      var item = event.target.closest('[data-diagram-shape]');
      if (
        !item ||
        !event.dataTransfer ||
        self.options.disabled ||
        self.options.readOnly
      ) return;
      event.dataTransfer.setData('text/x-fabui-diagram-shape', item.getAttribute('data-diagram-shape'));
      event.dataTransfer.setData(
        'text/x-fabui-diagram-shape-text',
        item.getAttribute('data-diagram-default-text') || ''
      );
      event.dataTransfer.setData(
        'text/x-fabui-diagram-shape-width',
        item.getAttribute('data-diagram-default-width') || ''
      );
      event.dataTransfer.setData(
        'text/x-fabui-diagram-shape-height',
        item.getAttribute('data-diagram-default-height') || ''
      );
      event.dataTransfer.effectAllowed = 'copy';
    };
    this._onToolboxOrderPointerDown = function(event) {
      var dragHandle = event.target.closest('[data-diagram-toolbox-drag]');
      var category;
      var group;
      if (
        !dragHandle ||
        event.button !== 0 ||
        self.options.disabled ||
        self.options.readOnly
      ) return;
      event.preventDefault();
      category = dragHandle.getAttribute('data-diagram-toolbox-drag');
      group = dragHandle.closest('.fui-diagram-toolbox-group');
      if (!category || !group) return;
      self._toolboxOrderDrag = {
        pointerId: event.pointerId,
        sourceCategory: category
      };
      self._clearToolboxDropIndicator();
      group.classList.add('fui-diagram-toolbox-group-dragging');
      self._bindToolboxOrderInteraction();
    };
    this._onViewportDragOver = function(event) {
      if (event.dataTransfer) event.preventDefault();
    };
    this._onViewportDrop = function(event) {
      var type = event.dataTransfer ?
        event.dataTransfer.getData('text/x-fabui-diagram-shape') :
        '';
      var text = event.dataTransfer ?
        event.dataTransfer.getData('text/x-fabui-diagram-shape-text') :
        '';
      var width = event.dataTransfer ?
        event.dataTransfer.getData('text/x-fabui-diagram-shape-width') :
        '';
      var height = event.dataTransfer ?
        event.dataTransfer.getData('text/x-fabui-diagram-shape-height') :
        '';
      var point;
      var nodeOptions;
      if (!type || self.options.disabled || self.options.readOnly) return;
      event.preventDefault();
      point = self._eventPoint(event);
      nodeOptions = {
        type: type,
        x: point.x - (width ? Number(width) / 2 : 70),
        y: point.y - (height ? Number(height) / 2 : 36)
      };
      if (text) nodeOptions.text = text;
      if (width) nodeOptions.width = Number(width);
      if (height) nodeOptions.height = Number(height);
      self.addNode(nodeOptions);
    };
    this._onViewportContextMenu = function(event) {
      if (!self._contextMenu || self.options.disabled) return;
      event.preventDefault();
      self._syncToolbarStates();
      self._contextMenu.show({
        left: event.pageX,
        top: event.pageY
      });
    };
    this._onJsonFileChange = function(event) {
      var input = event.currentTarget;
      var file = input.files && input.files[0];
      var reader;
      if (!file) return;
      input.value = '';
      if (
        self._jsonFileReader &&
        self._jsonFileReader.readyState === 1
      ) {
        self._jsonFileReader.abort();
      }
      reader = new FileReader();
      self._jsonFileReader = reader;
      reader.onload = function() {
        self._jsonFileReader = null;
        if (self._destroyed) return;
        try {
          self.import(String(reader.result || ''));
          diagramOnNextFrame(function() {
            if (!self._destroyed) self.fitToPage();
          });
          self._fire('JsonLoaded', {
            file: file,
            data: self.getData()
          });
        } catch (error) {
          self._fire('LoadError', {
            file: file,
            error: error
          });
        }
      };
      reader.onerror = function() {
        self._jsonFileReader = null;
        if (self._destroyed) return;
        self._fire('LoadError', {
          file: file,
          error: reader.error
        });
      };
      reader.readAsText(file);
    };
    this._onKeyDown = function(event) {
      self._handleKeyDown(event);
    };
    this._onViewportWheel = function(event) {
      self._handleViewportWheel(event);
    };
    this._onPanelResizePointerDown = function(event) {
      var edge = event.currentTarget.getAttribute(
        'data-diagram-resizer-edge'
      );
      var panel = event.currentTarget.getAttribute(
        'data-diagram-panel-resizer'
      );
      var floating = panel === 'toolbox' ?
        self.options.toolboxFloating :
        self.options.propertiesFloating;
      if (
        event.button !== 0 ||
        self.options.disabled ||
        self.options.readOnly ||
        event.currentTarget.hidden
      ) return;
      event.preventDefault();
      self._bringFloatingPanelToFront(panel);
      self._panelResize = {
        panel: panel,
        edge: edge,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startWidth: panel === 'toolbox' ?
          self.options.toolboxWidth :
          self.options.propertiesWidth,
        startHeight: panel === 'toolbox' ?
          self.options.toolboxHeight :
          self.options.propertiesHeight,
        startLeft: panel === 'toolbox' ?
          self.options.toolboxFloatLeft :
          self.options.propertiesFloatLeft,
        startTop: panel === 'toolbox' ?
          self.options.toolboxFloatTop :
          self.options.propertiesFloatTop,
        workspaceWidth: self.workspaceElement.clientWidth,
        workspaceHeight: self.workspaceElement.clientHeight,
        floating: floating
      };
      self.hostElement.classList.add(
        'fui-diagram-panel-resizing',
        edge === 'left' || edge === 'right' ?
          'fui-diagram-panel-resizing-horizontal' :
          'fui-diagram-panel-resizing-vertical',
        'fui-diagram-' + panel + '-resizing'
      );
      self._bindPanelResizeInteraction();
    };
    this._onPanelResizeKeyDown = function(event) {
      var edge = event.currentTarget.getAttribute(
        'data-diagram-resizer-edge'
      );
      var horizontal = edge === 'left' || edge === 'right';
      var movementX = 0;
      var movementY = 0;
      var panel = event.currentTarget.getAttribute(
        'data-diagram-panel-resizer'
      );
      var startHeight;
      var startLeft;
      var startTop;
      var startWidth;
      if (self.options.disabled || self.options.readOnly) return;
      if (horizontal && event.key === 'ArrowLeft') {
        movementX = event.shiftKey ? -30 : -10;
      } else if (horizontal && event.key === 'ArrowRight') {
        movementX = event.shiftKey ? 30 : 10;
      } else if (!horizontal && event.key === 'ArrowUp') {
        movementY = event.shiftKey ? -30 : -10;
      } else if (!horizontal && event.key === 'ArrowDown') {
        movementY = event.shiftKey ? 30 : 10;
      } else {
        return;
      }
      event.preventDefault();
      startWidth = panel === 'toolbox' ?
        self.options.toolboxWidth :
        self.options.propertiesWidth;
      startLeft = panel === 'toolbox' ?
        self.options.toolboxFloatLeft :
        self.options.propertiesFloatLeft;
      startHeight = panel === 'toolbox' ?
        self.options.toolboxHeight :
        self.options.propertiesHeight;
      startTop = panel === 'toolbox' ?
        self.options.toolboxFloatTop :
        self.options.propertiesFloatTop;
      self._resizePanelFromEdge(
        panel,
        edge,
        startWidth,
        startHeight,
        startLeft,
        startTop,
        movementX,
        movementY,
        self.workspaceElement.clientWidth,
        self.workspaceElement.clientHeight
      );
    };
    this._onToolboxHeaderPointerDown = function(event) {
      var toolboxRect;
      var workspaceRect;
      if (
        event.button !== 0 ||
        self.options.disabled ||
        self.options.readOnly ||
        self.toolboxElement.hidden
      ) return;
      event.preventDefault();
      toolboxRect = self.toolboxElement.getBoundingClientRect();
      workspaceRect = self.workspaceElement.getBoundingClientRect();
      self._toolboxPanelDrag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        grabX: event.clientX - toolboxRect.left,
        grabY: event.clientY - toolboxRect.top,
        workspaceLeft: workspaceRect.left,
        workspaceTop: workspaceRect.top,
        workspaceWidth: workspaceRect.width,
        originalFloating: self.options.toolboxFloating,
        originalDockSide: self.options.toolboxDockSide,
        originalLeft: self.options.toolboxFloatLeft,
        originalTop: self.options.toolboxFloatTop,
        moved: false,
        dockSide: ''
      };
      self.hostElement.classList.add(
        'fui-diagram-toolbox-panel-dragging'
      );
      self._bindToolboxPanelInteraction();
    };
    this._onPropertiesHeaderPointerDown = function(event) {
      var propertiesRect;
      var workspaceRect;
      if (
        event.button !== 0 ||
        self.options.disabled ||
        self.options.readOnly ||
        self.propertiesElement.hidden
      ) return;
      event.preventDefault();
      propertiesRect = self.propertiesElement.getBoundingClientRect();
      workspaceRect = self.workspaceElement.getBoundingClientRect();
      self._propertiesPanelDrag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        grabX: event.clientX - propertiesRect.left,
        grabY: event.clientY - propertiesRect.top,
        workspaceLeft: workspaceRect.left,
        workspaceTop: workspaceRect.top,
        workspaceWidth: workspaceRect.width,
        originalFloating: self.options.propertiesFloating,
        originalDockSide: self.options.propertiesDockSide,
        originalLeft: self.options.propertiesFloatLeft,
        originalTop: self.options.propertiesFloatTop,
        moved: false,
        dockSide: ''
      };
      self.hostElement.classList.add(
        'fui-diagram-properties-panel-dragging'
      );
      self._bindPropertiesPanelInteraction();
    };
    this._onToolboxPanelPointerDown = function() {
      self._bringFloatingPanelToFront('toolbox');
    };
    this._onPropertiesPanelPointerDown = function() {
      self._bringFloatingPanelToFront('properties');
    };
    this._onViewToolbarPointerDown = function(event) {
      if (
        event.button !== 0 ||
        self.options.disabled ||
        self.viewToolbarElement.hidden ||
        event.target.closest('.fui-button')
      ) return;
      event.preventDefault();
      self._viewToolbarDrag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startLeft: self.viewToolbarElement.offsetLeft,
        startTop: self.viewToolbarElement.offsetTop,
        originalLeft: self.options.viewToolbarLeft,
        originalTop: self.options.viewToolbarTop,
        moved: false
      };
      self.hostElement.classList.add(
        'fui-diagram-view-toolbar-dragging'
      );
      self._bindViewToolbarInteraction();
    };
    this._onFullscreenChange = function() {
      var presentationFullscreen = diagramElementIsFullscreen(
        self.viewportElement
      );
      var editorFullscreen = diagramElementIsFullscreen(self.hostElement);
      var fullscreen = presentationFullscreen || editorFullscreen;
      var contextMenuParent;
      var viewState;
      if (self._contextMenuHost) {
        contextMenuParent = presentationFullscreen ?
          self.viewportElement :
          editorFullscreen ? self.hostElement : document.body;
        if (self._contextMenuHost.parentNode !== contextMenuParent) {
          contextMenuParent.appendChild(self._contextMenuHost);
        }
      }
      if (fullscreen) {
        if (!self._fullscreenViewState) {
          self._fullscreenViewState = {
            zoomLevel: self.options.zoomLevel,
            scrollLeft: self.viewportElement.scrollLeft,
            scrollTop: self.viewportElement.scrollTop
          };
        }
        self.hostElement.classList.toggle(
          'fui-diagram-fullscreen-editor',
          editorFullscreen
        );
        self.viewportElement.classList.toggle(
          'fui-diagram-fullscreen-presentation',
          presentationFullscreen
        );
        self._fullscreenViewportSize = diagramElementBorderSize(
          self.viewportElement
        );
        if (
          !self._fullscreenResizeObserver &&
          typeof ResizeObserver !== 'undefined'
        ) {
          self._fullscreenResizeObserver = new ResizeObserver(function() {
            var nextSize;
            if (
              self._destroyed ||
              (
                !self.hostElement.classList.contains(
                  'fui-diagram-fullscreen-editor'
                ) &&
                !self.viewportElement.classList.contains(
                  'fui-diagram-fullscreen-presentation'
                )
              )
            ) return;
            nextSize = diagramElementBorderSize(self.viewportElement);
            if (!diagramFullscreenSizeChanged(
              self._fullscreenViewportSize,
              nextSize
            )) return;
            self._fullscreenViewportSize = nextSize;
            diagramOnNextFrame(function() {
              if (
                !self._destroyed &&
                (
                  self.hostElement.classList.contains(
                    'fui-diagram-fullscreen-editor'
                  ) ||
                  self.viewportElement.classList.contains(
                    'fui-diagram-fullscreen-presentation'
                  )
                )
              ) {
                self._fullscreenViewportSize = diagramElementBorderSize(
                  self.viewportElement
                );
                self.fitToPage(24);
              }
            });
          });
          self._fullscreenResizeObserver.observe(self.viewportElement);
        }
        diagramOnNextFrame(function() {
          diagramOnNextFrame(function() {
            if (
              !self._destroyed &&
              (
                self.hostElement.classList.contains(
                  'fui-diagram-fullscreen-editor'
                ) ||
                self.viewportElement.classList.contains(
                  'fui-diagram-fullscreen-presentation'
                )
              )
            ) {
              self._fullscreenViewportSize = diagramElementBorderSize(
                self.viewportElement
              );
              self.fitToPage(24);
            }
          });
        });
      } else {
        if (self._fullscreenResizeObserver) {
          self._fullscreenResizeObserver.disconnect();
          self._fullscreenResizeObserver = null;
        }
        self._fullscreenViewportSize = null;
        self.viewportElement.classList.remove(
          'fui-diagram-fullscreen-presentation'
        );
        self.hostElement.classList.remove(
          'fui-diagram-fullscreen-editor'
        );
        viewState = self._fullscreenViewState;
        self._fullscreenViewState = null;
        if (viewState) {
          diagramOnNextFrame(function() {
            if (
              self._destroyed ||
              diagramElementIsFullscreen(self.viewportElement) ||
              diagramElementIsFullscreen(self.hostElement)
            ) return;
            self.setZoom(viewState.zoomLevel);
            self.viewportElement.scrollLeft = viewState.scrollLeft;
            self.viewportElement.scrollTop = viewState.scrollTop;
          });
        }
      }
      self._syncToolbarStates();
      diagramOnNextFrame(function() {
        if (!self._destroyed) self._syncViewToolbarPosition();
      });
    };
    this.addEventListener(this.svgElement, 'pointerdown', this._onSvgPointerDown);
    this.addEventListener(this.svgElement, 'click', this._onSvgClick);
    this.addEventListener(this.svgElement, 'dblclick', this._onSvgDblClick);
    this.addEventListener(this.toolboxGroupsElement, 'click', this._onToolboxClick);
    this.addEventListener(this.toolboxGroupsElement, 'dragstart', this._onToolboxDragStart);
    this.addEventListener(
      this.toolboxGroupsElement,
      'pointerdown',
      this._onToolboxOrderPointerDown
    );
    this.addEventListener(this.viewportElement, 'dragover', this._onViewportDragOver);
    this.addEventListener(this.viewportElement, 'drop', this._onViewportDrop);
    this.addEventListener(
      this.viewportElement,
      'wheel',
      this._onViewportWheel,
      false,
      false
    );
    this.addEventListener(
      this.viewportElement,
      'contextmenu',
      this._onViewportContextMenu
    );
    this.addEventListener(
      this.jsonFileInputElement,
      'change',
      this._onJsonFileChange
    );
    [
      this.toolboxResizerLeftElement,
      this.toolboxResizerRightElement,
      this.toolboxResizerTopElement,
      this.toolboxResizerBottomElement,
      this.propertiesResizerLeftElement,
      this.propertiesResizerRightElement,
      this.propertiesResizerTopElement,
      this.propertiesResizerBottomElement
    ].forEach(function(element) {
      self.addEventListener(
        element,
        'pointerdown',
        self._onPanelResizePointerDown
      );
      self.addEventListener(
        element,
        'keydown',
        self._onPanelResizeKeyDown
      );
    });
    this.addEventListener(
      this.toolboxHeaderElement,
      'pointerdown',
      this._onToolboxHeaderPointerDown
    );
    this.addEventListener(
      this.propertiesHeaderElement,
      'pointerdown',
      this._onPropertiesHeaderPointerDown
    );
    this.addEventListener(
      this.toolboxElement,
      'pointerdown',
      this._onToolboxPanelPointerDown
    );
    this.addEventListener(
      this.propertiesElement,
      'pointerdown',
      this._onPropertiesPanelPointerDown
    );
    this.addEventListener(
      this.viewToolbarElement,
      'pointerdown',
      this._onViewToolbarPointerDown
    );
    this.addEventListener(this.hostElement, 'keydown', this._onKeyDown);
    this.addEventListener(document, 'fullscreenchange', this._onFullscreenChange);
    this.addEventListener(
      document,
      'webkitfullscreenchange',
      this._onFullscreenChange
    );
  };

  Diagram.prototype._resizePanelFromEdge = function(
    panel,
    edge,
    startWidth,
    startHeight,
    startLeft,
    startTop,
    movementX,
    movementY,
    workspaceWidth,
    workspaceHeight,
    skipSave
  ) {
    var floatingOption = panel === 'toolbox' ?
      'toolboxFloating' :
      'propertiesFloating';
    var heightOption = panel === 'toolbox' ?
      'toolboxHeight' :
      'propertiesHeight';
    var leftOption = panel === 'toolbox' ?
      'toolboxFloatLeft' :
      'propertiesFloatLeft';
    var maxHeight = panel === 'toolbox' ?
      this.options.toolboxMaxHeight :
      this.options.propertiesMaxHeight;
    var maxWidth = panel === 'toolbox' ?
      this.options.toolboxMaxWidth :
      this.options.propertiesMaxWidth;
    var minHeight = panel === 'toolbox' ?
      this.options.toolboxMinHeight :
      this.options.propertiesMinHeight;
    var minWidth = panel === 'toolbox' ?
      this.options.toolboxMinWidth :
      this.options.propertiesMinWidth;
    var topOption = panel === 'toolbox' ?
      'toolboxFloatTop' :
      'propertiesFloatTop';
    var widthOption = panel === 'toolbox' ?
      'toolboxWidth' :
      'propertiesWidth';
    var floating = this.options[floatingOption];
    var height;
    var width;
    if (edge === 'left' || edge === 'right') {
      if (floating && workspaceWidth > 0) {
        maxWidth = Math.min(
          maxWidth,
          edge === 'left' ?
            startLeft + startWidth :
            workspaceWidth - startLeft
        );
      }
      width = diagramClamp(
        startWidth + (edge === 'left' ? -movementX : movementX),
        minWidth,
        Math.max(minWidth, maxWidth)
      );
      this.options[widthOption] = width;
      if (floating && edge === 'left') {
        this.options[leftOption] = Math.max(
          0,
          startLeft + startWidth - width
        );
      }
    } else {
      if (floating && workspaceHeight > 0) {
        maxHeight = Math.min(
          maxHeight,
          edge === 'top' ?
            startTop + startHeight :
            workspaceHeight - startTop
        );
      }
      height = diagramClamp(
        startHeight + (edge === 'top' ? -movementY : movementY),
        minHeight,
        Math.max(minHeight, maxHeight)
      );
      this.options[heightOption] = height;
      if (floating && edge === 'top') {
        this.options[topOption] = Math.max(
          0,
          startTop + startHeight - height
        );
      }
    }
    this._syncStructure();
    if (!skipSave) this._saveToolboxState();
    return this;
  };

  Diagram.prototype._bindPanelResizeInteraction = function() {
    var self = this;
    this._unbindPanelResizeInteraction();
    this._onPanelResizePointerMove = function(event) {
      var state = self._panelResize;
      if (!state || event.pointerId !== state.pointerId) return;
      event.preventDefault();
      self._resizePanelFromEdge(
        state.panel,
        state.edge,
        state.startWidth,
        state.startHeight,
        state.startLeft,
        state.startTop,
        event.clientX - state.startX,
        event.clientY - state.startY,
        state.workspaceWidth,
        state.workspaceHeight,
        true
      );
    };
    this._onPanelResizePointerEnd = function(event) {
      var state = self._panelResize;
      if (!state || event.pointerId !== state.pointerId) return;
      if (event.type === 'pointercancel') {
        self._resizePanelFromEdge(
          state.panel,
          state.edge,
          state.startWidth,
          state.startHeight,
          state.startLeft,
          state.startTop,
          0,
          0,
          state.workspaceWidth,
          state.workspaceHeight,
          true
        );
      }
      self._saveToolboxState();
      self._panelResize = null;
      self.hostElement.classList.remove(
        'fui-diagram-panel-resizing',
        'fui-diagram-panel-resizing-horizontal',
        'fui-diagram-panel-resizing-vertical',
        'fui-diagram-toolbox-resizing',
        'fui-diagram-properties-resizing'
      );
      self._unbindPanelResizeInteraction();
    };
    document.addEventListener(
      'pointermove',
      this._onPanelResizePointerMove
    );
    document.addEventListener(
      'pointerup',
      this._onPanelResizePointerEnd
    );
    document.addEventListener(
      'pointercancel',
      this._onPanelResizePointerEnd
    );
  };

  Diagram.prototype._unbindPanelResizeInteraction = function() {
    if (!this._onPanelResizePointerMove) return;
    document.removeEventListener(
      'pointermove',
      this._onPanelResizePointerMove
    );
    document.removeEventListener(
      'pointerup',
      this._onPanelResizePointerEnd
    );
    document.removeEventListener(
      'pointercancel',
      this._onPanelResizePointerEnd
    );
    this._onPanelResizePointerMove = null;
    this._onPanelResizePointerEnd = null;
  };

  Diagram.prototype._setToolboxFloatPosition = function(left, top) {
    var position = constrainDiagramFloatingToolbox(
      left,
      top,
      this.toolboxElement.offsetWidth,
      this.toolboxElement.offsetHeight,
      this.workspaceElement.clientWidth,
      this.workspaceElement.clientHeight
    );
    this.options.toolboxFloatLeft = position.left;
    this.options.toolboxFloatTop = position.top;
    this.workspaceElement.style.setProperty(
      '--fui-diagram-toolbox-left',
      position.left + 'px'
    );
    this.workspaceElement.style.setProperty(
      '--fui-diagram-toolbox-top',
      position.top + 'px'
    );
    return this;
  };

  Diagram.prototype._setViewToolbarPosition = function(left, top) {
    var position = constrainDiagramViewToolbar(
      left,
      top,
      this.viewToolbarElement.offsetWidth,
      this.viewToolbarElement.offsetHeight,
      this.hostElement.clientWidth,
      this.hostElement.clientHeight
    );
    this.options.viewToolbarLeft = position.left;
    this.options.viewToolbarTop = position.top;
    this.viewToolbarElement.style.left = position.left + 'px';
    this.viewToolbarElement.style.top = position.top + 'px';
    this.viewToolbarElement.style.right = 'auto';
    this.viewToolbarElement.style.bottom = 'auto';
    return this;
  };

  Diagram.prototype._syncViewToolbarPosition = function() {
    if (
      this.options.viewToolbarLeft == null ||
      this.options.viewToolbarTop == null
    ) {
      this.viewToolbarElement.style.removeProperty('left');
      this.viewToolbarElement.style.removeProperty('top');
      this.viewToolbarElement.style.removeProperty('right');
      this.viewToolbarElement.style.removeProperty('bottom');
      return this;
    }
    return this._setViewToolbarPosition(
      this.options.viewToolbarLeft,
      this.options.viewToolbarTop
    );
  };

  Diagram.prototype._bindViewToolbarInteraction = function() {
    var self = this;
    this._unbindViewToolbarInteraction();
    this._onViewToolbarPointerMove = function(event) {
      var state = self._viewToolbarDrag;
      if (!state || event.pointerId !== state.pointerId) return;
      if (
        !state.moved &&
        Math.abs(event.clientX - state.startX) < 4 &&
        Math.abs(event.clientY - state.startY) < 4
      ) return;
      event.preventDefault();
      state.moved = true;
      self._setViewToolbarPosition(
        state.startLeft + event.clientX - state.startX,
        state.startTop + event.clientY - state.startY
      );
    };
    this._onViewToolbarPointerEnd = function(event) {
      var state = self._viewToolbarDrag;
      if (!state || event.pointerId !== state.pointerId) return;
      if (event.type === 'pointercancel') {
        self.options.viewToolbarLeft = state.originalLeft;
        self.options.viewToolbarTop = state.originalTop;
        self._syncViewToolbarPosition();
      } else if (state.moved) {
        self._saveToolboxState();
      }
      self._viewToolbarDrag = null;
      self.hostElement.classList.remove(
        'fui-diagram-view-toolbar-dragging'
      );
      self._unbindViewToolbarInteraction();
    };
    document.addEventListener(
      'pointermove',
      this._onViewToolbarPointerMove
    );
    document.addEventListener(
      'pointerup',
      this._onViewToolbarPointerEnd
    );
    document.addEventListener(
      'pointercancel',
      this._onViewToolbarPointerEnd
    );
  };

  Diagram.prototype._unbindViewToolbarInteraction = function() {
    if (!this._onViewToolbarPointerMove) return;
    document.removeEventListener(
      'pointermove',
      this._onViewToolbarPointerMove
    );
    document.removeEventListener(
      'pointerup',
      this._onViewToolbarPointerEnd
    );
    document.removeEventListener(
      'pointercancel',
      this._onViewToolbarPointerEnd
    );
    this._onViewToolbarPointerMove = null;
    this._onViewToolbarPointerEnd = null;
  };

  Diagram.prototype._bindToolboxPanelInteraction = function() {
    var self = this;
    this._unbindToolboxPanelInteraction();
    this._onToolboxPanelPointerMove = function(event) {
      var left;
      var state = self._toolboxPanelDrag;
      var top;
      if (!state || event.pointerId !== state.pointerId) return;
      if (
        !state.moved &&
        Math.abs(event.clientX - state.startX) < 4 &&
        Math.abs(event.clientY - state.startY) < 4
      ) return;
      event.preventDefault();
      state.moved = true;
      left = event.clientX - state.workspaceLeft - state.grabX;
      top = event.clientY - state.workspaceTop - state.grabY;
      if (!self.options.toolboxFloating) {
        self.floatToolbox(left, top, true);
      } else {
        self._setToolboxFloatPosition(left, top);
      }
      state.dockSide = getDiagramPanelDockSide(
        event.clientX,
        state.workspaceLeft,
        state.workspaceWidth,
        56
      );
      self.workspaceElement.classList.toggle(
        'fui-diagram-toolbox-dock-preview-left',
        state.dockSide === 'left'
      );
      self.workspaceElement.classList.toggle(
        'fui-diagram-toolbox-dock-preview-right',
        state.dockSide === 'right'
      );
    };
    this._onToolboxPanelPointerEnd = function(event) {
      var state = self._toolboxPanelDrag;
      if (!state || event.pointerId !== state.pointerId) return;
      if (event.type === 'pointercancel') {
        if (state.originalFloating) {
          self.options.toolboxDockSide = state.originalDockSide;
          self.floatToolbox(
            state.originalLeft,
            state.originalTop,
            true
          );
        } else {
          self.dockToolbox(state.originalDockSide, true);
        }
      } else if (state.moved && state.dockSide) {
        self.dockToolbox(state.dockSide, true);
      }
      if (state.moved) self._saveToolboxState();
      self._toolboxPanelDrag = null;
      self.hostElement.classList.remove(
        'fui-diagram-toolbox-panel-dragging'
      );
      self.workspaceElement.classList.remove(
        'fui-diagram-toolbox-dock-preview-left',
        'fui-diagram-toolbox-dock-preview-right'
      );
      self._unbindToolboxPanelInteraction();
    };
    document.addEventListener(
      'pointermove',
      this._onToolboxPanelPointerMove
    );
    document.addEventListener(
      'pointerup',
      this._onToolboxPanelPointerEnd
    );
    document.addEventListener(
      'pointercancel',
      this._onToolboxPanelPointerEnd
    );
  };

  Diagram.prototype._unbindToolboxPanelInteraction = function() {
    if (!this._onToolboxPanelPointerMove) return;
    document.removeEventListener(
      'pointermove',
      this._onToolboxPanelPointerMove
    );
    document.removeEventListener(
      'pointerup',
      this._onToolboxPanelPointerEnd
    );
    document.removeEventListener(
      'pointercancel',
      this._onToolboxPanelPointerEnd
    );
    this._onToolboxPanelPointerMove = null;
    this._onToolboxPanelPointerEnd = null;
  };

  Diagram.prototype._setPropertiesFloatPosition = function(left, top) {
    var position = constrainDiagramFloatingToolbox(
      left,
      top,
      this.propertiesElement.offsetWidth,
      this.propertiesElement.offsetHeight,
      this.workspaceElement.clientWidth,
      this.workspaceElement.clientHeight
    );
    this.options.propertiesFloatLeft = position.left;
    this.options.propertiesFloatTop = position.top;
    this.workspaceElement.style.setProperty(
      '--fui-diagram-properties-left',
      position.left + 'px'
    );
    this.workspaceElement.style.setProperty(
      '--fui-diagram-properties-top',
      position.top + 'px'
    );
    return this;
  };

  Diagram.prototype._bindPropertiesPanelInteraction = function() {
    var self = this;
    this._unbindPropertiesPanelInteraction();
    this._onPropertiesPanelPointerMove = function(event) {
      var left;
      var state = self._propertiesPanelDrag;
      var top;
      if (!state || event.pointerId !== state.pointerId) return;
      if (
        !state.moved &&
        Math.abs(event.clientX - state.startX) < 4 &&
        Math.abs(event.clientY - state.startY) < 4
      ) return;
      event.preventDefault();
      state.moved = true;
      left = event.clientX - state.workspaceLeft - state.grabX;
      top = event.clientY - state.workspaceTop - state.grabY;
      if (!self.options.propertiesFloating) {
        self.floatProperties(left, top, true);
      } else {
        self._setPropertiesFloatPosition(left, top);
      }
      state.dockSide = getDiagramPanelDockSide(
        event.clientX,
        state.workspaceLeft,
        state.workspaceWidth,
        56
      );
      self.workspaceElement.classList.toggle(
        'fui-diagram-properties-dock-preview-left',
        state.dockSide === 'left'
      );
      self.workspaceElement.classList.toggle(
        'fui-diagram-properties-dock-preview-right',
        state.dockSide === 'right'
      );
    };
    this._onPropertiesPanelPointerEnd = function(event) {
      var state = self._propertiesPanelDrag;
      if (!state || event.pointerId !== state.pointerId) return;
      if (event.type === 'pointercancel') {
        if (state.originalFloating) {
          self.options.propertiesDockSide = state.originalDockSide;
          self.floatProperties(
            state.originalLeft,
            state.originalTop,
            true
          );
        } else {
          self.dockProperties(state.originalDockSide, true);
        }
      } else if (state.moved && state.dockSide) {
        self.dockProperties(state.dockSide, true);
      }
      if (state.moved) self._saveToolboxState();
      self._propertiesPanelDrag = null;
      self.hostElement.classList.remove(
        'fui-diagram-properties-panel-dragging'
      );
      self.workspaceElement.classList.remove(
        'fui-diagram-properties-dock-preview-left',
        'fui-diagram-properties-dock-preview-right'
      );
      self._unbindPropertiesPanelInteraction();
    };
    document.addEventListener(
      'pointermove',
      this._onPropertiesPanelPointerMove
    );
    document.addEventListener(
      'pointerup',
      this._onPropertiesPanelPointerEnd
    );
    document.addEventListener(
      'pointercancel',
      this._onPropertiesPanelPointerEnd
    );
  };

  Diagram.prototype._unbindPropertiesPanelInteraction = function() {
    if (!this._onPropertiesPanelPointerMove) return;
    document.removeEventListener(
      'pointermove',
      this._onPropertiesPanelPointerMove
    );
    document.removeEventListener(
      'pointerup',
      this._onPropertiesPanelPointerEnd
    );
    document.removeEventListener(
      'pointercancel',
      this._onPropertiesPanelPointerEnd
    );
    this._onPropertiesPanelPointerMove = null;
    this._onPropertiesPanelPointerEnd = null;
  };

  Diagram.prototype._eventPoint = function(event) {
    var rect = this.svgElement.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * this.options.pageWidth / rect.width,
      y: (event.clientY - rect.top) * this.options.pageHeight / rect.height
    };
  };

  Diagram.prototype._snap = function(value) {
    return this.options.snapToGrid ?
      Math.round(value / this.options.gridSize) * this.options.gridSize :
      value;
  };

  Diagram.prototype._isNodeSelected = function(id) {
    return this._selectedNodeIds.indexOf(String(id)) >= 0;
  };

  Diagram.prototype._setNodeSelection = function(ids, primaryId, silent) {
    var self = this;
    var unique = [];
    (ids || []).forEach(function(id) {
      id = String(id);
      if (self.getNode(id) && unique.indexOf(id) < 0) unique.push(id);
    });
    primaryId = String(primaryId == null ? '' : primaryId);
    if (unique.length && unique.indexOf(primaryId) < 0) primaryId = unique[unique.length - 1];
    this._selectedNodeIds = unique;
    this._selected = unique.length ? {
      type: 'node',
      id: primaryId || unique[unique.length - 1]
    } : null;
    this._renderCanvas();
    this._renderProperties();
    if (!silent) this._fireSelectionChanged();
    return this;
  };

  Diagram.prototype._fireSelectionChanged = function() {
    var item = this._selected ?
      (this._selected.type === 'node' ?
        this.getNode(this._selected.id) :
        this.getConnector(this._selected.id)) :
      null;
    this._fire('SelectionChanged', {
      itemType: this._selected ? this._selected.type : null,
      item: item,
      selection: this._selected ? diagramAssign({}, this._selected) : null,
      selections: this.getSelections()
    });
  };

  Diagram.prototype._handlePointerDown = function(event) {
    var connectionPoint = event.target.closest('[data-diagram-connection-point]');
    var resizeHandle = event.target.closest('[data-diagram-resize]');
    var groupResizeHandle = resizeHandle &&
      resizeHandle.hasAttribute('data-diagram-group-resize');
    var nodeElement = event.target.closest('[data-diagram-node]');
    var nodeTextElement = event.target.closest('[data-diagram-node-text]');
    var connectorElement = event.target.closest('[data-diagram-connector]');
    var connectNodeElement = nodeElement || connectionPoint || resizeHandle;
    var node;
    var connector;
    var from;
    var to;
    var geometry;
    var point;
    var additive;
    var selectedIds;
    var now;
    var isDoubleClick;
    if (
      event.button !== 0 ||
      this.options.disabled
    ) return;
    this.hostElement.focus({ preventScroll: true });
    if (this.options.readOnly) return;
    if (this._inlineTextEditor) this._closeInlineTextEditor(true);
    point = this._eventPoint(event);
    additive = event.shiftKey || event.ctrlKey || event.metaKey;
    if (this._connectMode) {
      event.preventDefault();
      if (!connectNodeElement) return;
      node = this.getNode(connectNodeElement.getAttribute('data-node-id'));
      if (!node) return;
      this._connectSourceId = node.id;
      this._interaction = {
        pointerId: event.pointerId,
        type: 'connect',
        connectorType: this._connectType,
        autoConnect: true,
        nodeId: node.id,
        sourcePoint: '',
        pointerStartPoint: point,
        startPoint: point,
        currentPoint: point,
        targetNodeId: '',
        targetPoint: '',
        changed: false
      };
      this.hostElement.classList.add('fui-diagram-interacting');
      this._bindDocumentInteraction();
      this._renderCanvas();
      return;
    }
    if (connectionPoint) {
      node = this.getNode(connectionPoint.getAttribute('data-node-id'));
      if (!node) return;
      event.preventDefault();
      this._interaction = {
        pointerId: event.pointerId,
        type: 'connect',
        connectorType: 'orthogonal',
        autoConnect: false,
        nodeId: node.id,
        sourcePoint: connectionPoint.getAttribute('data-diagram-connection-point'),
        startPoint: getDiagramConnectionPoint(
          node,
          connectionPoint.getAttribute('data-diagram-connection-point')
        ),
        currentPoint: point,
        targetNodeId: '',
        targetPoint: '',
        changed: false
      };
      this.hostElement.classList.add('fui-diagram-interacting');
      this._bindDocumentInteraction();
      this._renderCanvas();
      return;
    }
    if (connectorElement) {
      connector = this.getConnector(
        connectorElement.getAttribute('data-connector-id')
      );
      if (!connector) return;
      from = this.getNode(connector.from);
      to = this.getNode(connector.to);
      if (!from || !to) return;
      event.preventDefault();
      this.selectItem('connector', connector.id);
      geometry = calculateDiagramConnectorPath(
        from,
        to,
        connector.type,
        connector.fromPoint,
        connector.toPoint,
        connector.controlX,
        connector.controlY
      );
      this._interaction = {
        pointerId: event.pointerId,
        type: 'connector-drag',
        connectorId: connector.id,
        startPoint: point,
        startConnector: diagramAssign({}, connector),
        startGeometry: geometry,
        changed: false
      };
      this.hostElement.classList.add('fui-diagram-interacting');
      this._bindDocumentInteraction();
      return;
    }
    if (!resizeHandle && !nodeElement) {
      this._lastItemClick = null;
      event.preventDefault();
      if (!additive) {
        this._selected = null;
        this._selectedNodeIds = [];
        this._renderCanvas();
        this._renderProperties();
      }
      if (this._viewportCanPan() && !additive) {
        this._interaction = {
          pointerId: event.pointerId,
          type: 'pan',
          startClientX: event.clientX,
          startClientY: event.clientY,
          startScrollLeft: this.viewportElement.scrollLeft,
          startScrollTop: this.viewportElement.scrollTop,
          changed: false
        };
        this.hostElement.classList.add('fui-diagram-panning');
      } else {
        this._interaction = {
          pointerId: event.pointerId,
          type: 'marquee',
          startPoint: point,
          currentPoint: point,
          startSelection: this._selectedNodeIds.slice(),
          additive: additive,
          changed: false
        };
      }
      this.hostElement.classList.add('fui-diagram-interacting');
      this._bindDocumentInteraction();
      return;
    }
    node = this.getNode(
      (resizeHandle || nodeElement).getAttribute('data-node-id')
    );
    if (!node) return;
    event.preventDefault();
    now = Date.now();
    isDoubleClick = !resizeHandle &&
      this._lastItemClick &&
      this._lastItemClick.type === 'node' &&
      this._lastItemClick.id === node.id &&
      this._lastItemClick.onText === Boolean(nodeTextElement) &&
      now - this._lastItemClick.time <= 450;
    this._lastItemClick = isDoubleClick ? null : {
      type: 'node',
      id: node.id,
      onText: Boolean(nodeTextElement),
      time: now
    };
    if (isDoubleClick) {
      this.selectItem('node', node.id);
      this._fire('ItemDblClick', {
        itemType: 'node',
        item: node
      });
      if (nodeTextElement && normalizeDiagramHyperlink(node.hyperlink)) {
        if (diagramNodeHyperlinkMatchesTrigger(node, 'dblclick')) {
          this._openNodeHyperlink(node);
        }
        this._suppressClick = true;
        return;
      }
      this._beginNodeTextEdit(node.id);
      this._suppressClick = true;
      return;
    }
    selectedIds = this._selectedNodeIds.slice();
    if (additive && !resizeHandle) {
      if (this._isNodeSelected(node.id)) {
        selectedIds = selectedIds.filter(function(id) {
          return id !== node.id;
        });
      } else {
        selectedIds.push(node.id);
      }
      this._setNodeSelection(selectedIds, node.id);
      this._suppressClick = true;
      if (!this._isNodeSelected(node.id)) return;
    } else if (
      !this._isNodeSelected(node.id) ||
      (resizeHandle && !groupResizeHandle)
    ) {
      this._setNodeSelection([node.id], node.id);
    }
    selectedIds = this._selectedNodeIds.slice();
    this._interaction = {
      pointerId: event.pointerId,
      type: groupResizeHandle ?
        'group-resize' :
        resizeHandle ? 'resize' : 'move',
      direction: resizeHandle ?
        resizeHandle.getAttribute('data-diagram-resize') :
        '',
      nodeId: node.id,
      startPoint: point,
      startNode: diagramAssign({}, node),
      startNodes: this._selectedNodeIds.map(function(id) {
        return diagramAssign({}, this.getNode(id));
      }, this),
      startBounds: groupResizeHandle ?
        calculateDiagramGroupBounds(
          this._selectedNodeIds.map(this.getNode.bind(this)).filter(Boolean)
        ) :
        null,
      startConnectors: groupResizeHandle ?
        this._data.connectors.filter(function(item) {
          return selectedIds.indexOf(item.from) >= 0 &&
            selectedIds.indexOf(item.to) >= 0 &&
            item.controlX != null &&
            item.controlY != null;
        }).map(function(item) {
          return diagramAssign({}, item);
        }) :
        [],
      hyperlinkTrigger: nodeTextElement &&
        diagramNodeHyperlinkMatchesTrigger(node, 'click') ?
        'click' :
        '',
      changed: false
    };
    this.hostElement.classList.add('fui-diagram-interacting');
    this._bindDocumentInteraction();
  };

  Diagram.prototype._bindDocumentInteraction = function() {
    var self = this;
    this._unbindDocumentInteraction();
    this._onDocumentPointerMove = function(event) {
      self._handlePointerMove(event);
    };
    this._onDocumentPointerEnd = function(event) {
      self._finishPointerInteraction(event);
    };
    document.addEventListener('pointermove', this._onDocumentPointerMove);
    document.addEventListener('pointerup', this._onDocumentPointerEnd);
    document.addEventListener('pointercancel', this._onDocumentPointerEnd);
  };

  Diagram.prototype._unbindDocumentInteraction = function() {
    if (!this._onDocumentPointerMove) return;
    document.removeEventListener('pointermove', this._onDocumentPointerMove);
    document.removeEventListener('pointerup', this._onDocumentPointerEnd);
    document.removeEventListener('pointercancel', this._onDocumentPointerEnd);
    this._onDocumentPointerMove = null;
    this._onDocumentPointerEnd = null;
  };

  Diagram.prototype._viewportCanPan = function() {
    return diagramViewportCanPan(
      this.viewportElement.scrollWidth,
      this.viewportElement.scrollHeight,
      this.viewportElement.clientWidth,
      this.viewportElement.clientHeight
    );
  };

  Diagram.prototype._handlePointerMove = function(event) {
    var state = this._interaction;
    var node;
    var connector;
    var point;
    var dx;
    var dy;
    var controlX;
    var controlY;
    var resized;
    var rect;
    var selectedIds;
    var target;
    var targetNode;
    var connectionPoints;
    var alignment;
    var groupResize;
    if (!state || event.pointerId !== state.pointerId) return;
    event.preventDefault();
    if (state.type === 'pan') {
      this.viewportElement.scrollLeft = state.startScrollLeft -
        (event.clientX - state.startClientX);
      this.viewportElement.scrollTop = state.startScrollTop -
        (event.clientY - state.startClientY);
      state.changed = Math.abs(
        this.viewportElement.scrollLeft - state.startScrollLeft
      ) > 1 || Math.abs(
        this.viewportElement.scrollTop - state.startScrollTop
      ) > 1;
      return;
    }
    point = this._eventPoint(event);
    if (state.type === 'marquee') {
      state.currentPoint = point;
      rect = {
        x: state.startPoint.x,
        y: state.startPoint.y,
        width: point.x - state.startPoint.x,
        height: point.y - state.startPoint.y
      };
      selectedIds = findDiagramNodesInRect(this._data.nodes, rect).map(function(item) {
        return item.id;
      });
      if (state.additive) {
        state.startSelection.forEach(function(id) {
          if (selectedIds.indexOf(id) < 0) selectedIds.push(id);
        });
      }
      this._selectedNodeIds = selectedIds;
      this._selected = selectedIds.length ? {
        type: 'node',
        id: selectedIds[selectedIds.length - 1]
      } : null;
      state.changed = Math.abs(rect.width) > 2 || Math.abs(rect.height) > 2;
      this._renderCanvas();
      this._renderProperties();
      return;
    }
    if (state.type === 'connect') {
      state.currentPoint = point;
      target = document.elementFromPoint(event.clientX, event.clientY);
      target = target && target.closest ? target.closest(
        state.autoConnect ?
          '[data-diagram-node], [data-node-id]' :
          '[data-diagram-connection-point]'
      ) : null;
      state.targetNodeId = target ? target.getAttribute('data-node-id') : '';
      state.targetPoint = target && !state.autoConnect ?
        target.getAttribute('data-diagram-connection-point') :
        '';
      if (state.targetNodeId === state.nodeId) {
        state.targetNodeId = '';
        state.targetPoint = '';
      }
      if (state.autoConnect && state.targetNodeId) {
        node = this.getNode(state.nodeId);
        targetNode = this.getNode(state.targetNodeId);
        if (node && targetNode) {
          connectionPoints = findBestDiagramConnectionPoints(node, targetNode);
          state.startPoint = connectionPoints.start;
          state.currentPoint = connectionPoints.end;
        }
      } else if (state.autoConnect) {
        state.startPoint = state.pointerStartPoint;
        state.currentPoint = point;
      }
      state.changed = true;
      this._renderCanvas();
      return;
    }
    if (state.type === 'connector-drag') {
      connector = this.getConnector(state.connectorId);
      if (!connector) return;
      dx = point.x - state.startPoint.x;
      dy = point.y - state.startPoint.y;
      if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) return;
      controlX = state.startGeometry.control.x;
      controlY = state.startGeometry.control.y;
      if (connector.type === 'curved') {
        controlX += dx * 2;
        controlY += dy * 2;
      } else if (connector.type === 'sCurve') {
        controlX += dx;
        controlY += dy;
      } else if (connector.type === 'orthogonal') {
        if (state.startGeometry.orientation === 'horizontal') controlX += dx;
        else controlY += dy;
      } else {
        controlX += dx;
        controlY += dy;
      }
      connector.controlX = this._snap(controlX);
      connector.controlY = this._snap(controlY);
      state.changed = true;
      this._renderCanvas();
      return;
    }
    if (state.type === 'group-resize') {
      groupResize = calculateDiagramGroupResize(
        state.startNodes,
        state.startBounds,
        state.direction,
        point,
        40,
        30
      );
      groupResize.nodes.forEach(function(resizedNode) {
        var current = this.getNode(resizedNode.id);
        if (!current) return;
        current.x = resizedNode.x;
        current.y = resizedNode.y;
        current.width = resizedNode.width;
        current.height = resizedNode.height;
      }, this);
      state.startConnectors.forEach(function(startConnector) {
        var current = this.getConnector(startConnector.id);
        if (!current) return;
        current.controlX = state.startBounds.centerX + (
          startConnector.controlX - state.startBounds.centerX
        ) * groupResize.scale;
        current.controlY = state.startBounds.centerY + (
          startConnector.controlY - state.startBounds.centerY
        ) * groupResize.scale;
      }, this);
      state.changed = Math.abs(groupResize.scale - 1) > 0.001;
      this._renderCanvas();
      return;
    }
    node = this.getNode(state.nodeId);
    if (!node) return;
    dx = point.x - state.startPoint.x;
    dy = point.y - state.startPoint.y;
    if (state.type === 'move') {
      state.startNodes.forEach(function(startNode) {
        var current = this.getNode(startNode.id);
        if (!current) return;
        current.x = this._snap(startNode.x + dx);
        current.y = this._snap(startNode.y + dy);
      }, this);
      alignment = calculateDiagramMoveAlignment(
        this._data.nodes,
        this._data.connectors,
        state.startNodes.map(function(startNode) {
          return startNode.id;
        }),
        Math.max(5, Math.min(16, this.options.gridSize * 0.75))
      );
      if (alignment.x || alignment.y) {
        state.startNodes.forEach(function(startNode) {
          var current = this.getNode(startNode.id);
          if (!current) return;
          current.x += alignment.x;
          current.y += alignment.y;
        }, this);
      }
    } else {
      resized = calculateDiagramNodeResize(
        state.startNode,
        state.direction,
        dx,
        dy,
        40,
        30
      );
      node.x = this._snap(resized.x);
      node.y = this._snap(resized.y);
      node.width = Math.max(40, this._snap(resized.width));
      node.height = Math.max(30, this._snap(resized.height));
    }
    state.changed = true;
    this._renderCanvas();
  };

  Diagram.prototype._finishPointerInteraction = function(event) {
    var state = this._interaction;
    var node;
    var connector;
    var target;
    var connectorData;
    var changedSelection;
    if (!state || event.pointerId !== state.pointerId) return;
    if (state.type === 'connect' && event.type !== 'pointercancel') {
      target = document.elementFromPoint(event.clientX, event.clientY);
      target = target && target.closest ? target.closest(
        state.autoConnect ?
          '[data-diagram-node], [data-node-id]' :
          '[data-diagram-connection-point]'
      ) : null;
      if (target) {
        state.targetNodeId = target.getAttribute('data-node-id');
        state.targetPoint = state.autoConnect ?
          '' :
          target.getAttribute('data-diagram-connection-point');
      }
      if (state.targetNodeId && state.targetNodeId !== state.nodeId) {
        connectorData = {
          from: state.nodeId,
          to: state.targetNodeId,
          type: state.connectorType
        };
        if (!state.autoConnect) {
          connectorData.fromPoint = state.sourcePoint;
          connectorData.toPoint = state.targetPoint;
        }
        this.addConnector(connectorData);
        if (state.autoConnect) this.setConnectMode(false);
      }
    }
    if (state.type === 'marquee') {
      changedSelection = state.startSelection.join('|') !==
        this._selectedNodeIds.join('|');
    }
    node = this.getNode(state.nodeId);
    if (event.type === 'pointercancel') {
      if (state.startConnector) {
        connector = this.getConnector(state.startConnector.id);
        if (connector) {
          delete connector.controlX;
          delete connector.controlY;
          diagramAssign(connector, state.startConnector);
        }
      }
      if (state.startNodes) {
        state.startNodes.forEach(function(startNode) {
          var current = this.getNode(startNode.id);
          if (current) diagramAssign(current, startNode);
        }, this);
      }
      if (state.startConnectors) {
        state.startConnectors.forEach(function(startConnector) {
          var current = this.getConnector(startConnector.id);
          if (current) diagramAssign(current, startConnector);
        }, this);
      }
      if (state.type === 'marquee') {
        this._selectedNodeIds = state.startSelection.slice();
        this._selected = this._selectedNodeIds.length ? {
          type: 'node',
          id: this._selectedNodeIds[this._selectedNodeIds.length - 1]
        } : null;
      }
      if (state.type === 'pan') {
        this.viewportElement.scrollLeft = state.startScrollLeft;
        this.viewportElement.scrollTop = state.startScrollTop;
      }
      this._renderCanvas();
    }
    this._interaction = null;
    this.hostElement.classList.remove(
      'fui-diagram-interacting',
      'fui-diagram-panning'
    );
    this._unbindDocumentInteraction();
    if (event.type !== 'pointercancel' && state.type === 'pan') {
      if (state.changed) {
        this._lastItemClick = null;
        this._suppressClick = true;
      }
    } else if (event.type !== 'pointercancel' && state.type === 'marquee') {
      if (state.changed) this._suppressClick = true;
      if (changedSelection) this._fireSelectionChanged();
      this._renderCanvas();
      this._renderProperties();
    } else if (
      event.type !== 'pointercancel' &&
      state.type === 'move' &&
      !state.changed &&
      state.hyperlinkTrigger === 'click' &&
      node
    ) {
      this._lastItemClick = null;
      this._suppressClick = true;
      this._fire('ItemClick', {
        itemType: 'node',
        item: node
      });
      this._openNodeHyperlink(node);
    } else if (
      event.type !== 'pointercancel' &&
      (
        state.type === 'move' ||
        state.type === 'resize' ||
        state.type === 'group-resize'
      ) &&
      state.changed
    ) {
      this._lastItemClick = null;
      this._suppressClick = true;
      this._commit('change', {
        itemType: 'node',
        item: node,
        items: this._selectedNodeIds.map(this.getNode.bind(this))
      });
      this._renderProperties();
    } else if (
      event.type !== 'pointercancel' &&
      state.type === 'connector-drag' &&
      state.changed
    ) {
      connector = this.getConnector(state.connectorId);
      this._lastItemClick = null;
      this._suppressClick = true;
      this._commit('change', {
        itemType: 'connector',
        item: connector
      });
      this._renderProperties();
    } else if (state.type === 'connect') {
      this._connectSourceId = '';
      this._suppressClick = true;
      this._renderCanvas();
    }
  };

  Diagram.prototype._handleSvgClick = function(event) {
    var nodeElement = event.target.closest('[data-diagram-node]');
    var nodeTextElement = event.target.closest('[data-diagram-node-text]');
    var connectorElement = event.target.closest('[data-diagram-connector]');
    var id;
    var node;
    var now;
    var isDoubleClick;
    if (this._suppressClick) {
      this._suppressClick = false;
      return;
    }
    if (event.target.closest('[data-diagram-connection-point]')) return;
    if (nodeElement) {
      id = nodeElement.getAttribute('data-node-id');
      if (this._connectMode) {
        this._handleConnectNode(id);
        return;
      }
      this.selectItem('node', id);
      node = this.getNode(id);
      this._fire('ItemClick', { itemType: 'node', item: node });
      if (
        nodeTextElement &&
        diagramNodeHyperlinkMatchesTrigger(node, 'click')
      ) {
        this._lastItemClick = null;
        this._openNodeHyperlink(node);
      } else if (
        !nodeTextElement ||
        !diagramNodeHyperlinkMatchesTrigger(node, 'dblclick')
      ) {
        this._lastItemClick = null;
      }
      return;
    }
    if (connectorElement) {
      id = connectorElement.getAttribute('data-connector-id');
      now = Date.now();
      isDoubleClick = this._lastItemClick &&
        this._lastItemClick.type === 'connector' &&
        this._lastItemClick.id === id &&
        now - this._lastItemClick.time <= 450;
      this._lastItemClick = isDoubleClick ? null : {
        type: 'connector',
        id: id,
        time: now
      };
      this.selectItem('connector', id);
      this._fire('ItemClick', {
        itemType: 'connector',
        item: this.getConnector(id)
      });
      if (isDoubleClick && !this.options.readOnly && !this.options.disabled) {
        this._fire('ItemDblClick', {
          itemType: 'connector',
          item: this.getConnector(id)
        });
        this._beginConnectorTextEdit(id);
      }
      return;
    }
    if (!event.target.closest('[data-diagram-resize]')) this.clearSelection();
  };

  Diagram.prototype._handleSvgDblClick = function(event) {
    var nodeElement = event.target.closest('[data-diagram-node]');
    var nodeTextElement = event.target.closest('[data-diagram-node-text]');
    var connectorElement = event.target.closest('[data-diagram-connector]');
    var type;
    var id;
    if (!nodeElement && !connectorElement) {
      return;
    }
    if (nodeTextElement && nodeTextElement.classList.contains(
      'fui-diagram-node-text-linked'
    )) {
      event.preventDefault();
      return;
    }
    type = nodeElement ? 'node' : 'connector';
    id = (nodeElement || connectorElement).getAttribute(
      nodeElement ? 'data-node-id' : 'data-connector-id'
    );
    if (
      this._inlineTextEditor &&
      this._inlineTextEditor.itemType === type &&
      this._inlineTextEditor.itemId === id
    ) {
      event.preventDefault();
      return;
    }
    this._fire('ItemDblClick', {
      itemType: type,
      item: type === 'node' ? this.getNode(id) : this.getConnector(id)
    });
    if (
      !this._inlineTextEditor &&
      !this.options.readOnly &&
      !this.options.disabled
    ) {
      event.preventDefault();
      this.selectItem(type, id);
      if (type === 'node') this._beginNodeTextEdit(id);
      else this._beginConnectorTextEdit(id);
    }
  };

  Diagram.prototype._positionInlineTextEditor = function() {
    var state = this._inlineTextEditor;
    var node;
    var nodeElements;
    var nodeElement;
    var connector;
    var from;
    var to;
    var geometry;
    var zoom;
    var svgOffset;
    var index;
    var textBox;
    if (!state) return;
    svgOffset = calculateDiagramViewportOffset(
      this.viewportElement.getBoundingClientRect(),
      this.svgElement.getBoundingClientRect(),
      this.viewportElement.scrollLeft,
      this.viewportElement.scrollTop,
      this.viewportElement.clientLeft,
      this.viewportElement.clientTop
    );
    if (state.itemType === 'node') {
      node = this.getNode(state.itemId);
      if (!node) {
        this._closeInlineTextEditor(false);
        return;
      }
      zoom = this.options.zoomLevel;
      textBox = diagramNodeTextBox(node);
      state.host.style.width = Math.max(
        24,
        textBox.width * zoom - 8
      ) + 'px';
      state.host.style.height = Math.max(
        22,
        textBox.height * zoom - 8
      ) + 'px';
      state.host.style.left = Math.round(
        svgOffset.x + textBox.x * zoom
      ) + 'px';
      state.host.style.top = Math.round(
        svgOffset.y + textBox.y * zoom
      ) + 'px';
      state.host.style.setProperty(
        '--fui-diagram-inline-font-size',
        Math.max(10, node.fontSize * zoom) + 'px'
      );
      state.host.style.setProperty(
        '--fui-diagram-inline-text-color',
        node.textColor
      );
      state.textbox.style.fontWeight = node.fontBold ? '700' : '400';
      state.textbox.style.fontStyle = node.fontItalic ? 'italic' : 'normal';
      state.textbox.style.textDecoration = diagramTextDecoration(
        node,
        Boolean(normalizeDiagramHyperlink(node.hyperlink))
      );
      if (state.nodeElement) {
        state.nodeElement.classList.remove('fui-diagram-node-editing');
      }
      state.nodeElement = null;
      nodeElements = this.svgElement.querySelectorAll('[data-diagram-node]');
      for (index = 0; index < nodeElements.length; index += 1) {
        if (nodeElements[index].getAttribute('data-node-id') === state.itemId) {
          nodeElement = nodeElements[index];
          break;
        }
      }
      if (nodeElement) {
        nodeElement.classList.add('fui-diagram-node-editing');
        state.nodeElement = nodeElement;
      }
      if (state.resizeEditor) state.resizeEditor();
      return;
    }
    connector = this.getConnector(state.itemId);
    if (!connector) {
      this._closeInlineTextEditor(false);
      return;
    }
    zoom = this.options.zoomLevel;
    state.textbox.style.fontSize = Math.max(10, connector.fontSize * zoom) + 'px';
    state.textbox.style.fontWeight = connector.fontBold ? '700' : '400';
    state.textbox.style.fontStyle = connector.fontItalic ? 'italic' : 'normal';
    state.textbox.style.textDecoration = diagramTextDecoration(connector, false);
    from = this.getNode(connector.from);
    to = this.getNode(connector.to);
    if (!from || !to) {
      this._closeInlineTextEditor(false);
      return;
    }
    geometry = calculateDiagramConnectorPath(
      from,
      to,
      connector.type,
      connector.fromPoint,
      connector.toPoint,
      connector.controlX,
      connector.controlY
    );
    state.host.style.width = '180px';
    state.host.style.left =
      Math.round(
        svgOffset.x + geometry.label.x * this.options.zoomLevel
      ) + 'px';
    state.host.style.top =
      Math.round(
        svgOffset.y + (
          geometry.label.y - Math.max(12, connector.fontSize * 0.85)
        ) * this.options.zoomLevel
      ) + 'px';
  };

  Diagram.prototype._beginInlineTextEdit = function(type, id) {
    var self = this;
    var item = type === 'node' ? this.getNode(id) : this.getConnector(id);
    var host;
    var input;
    var control;
    var textbox;
    var state;
    if (!item) return;
    this._closeInlineTextEditor(true);
    host = document.createElement('div');
    input = document.createElement(type === 'node' ? 'textarea' : 'input');
    host.className = 'fui-diagram-inline-text-editor fui-diagram-inline-' +
      type + '-editor';
    if (type === 'node') {
      input.rows = 1;
    } else {
      input.type = 'text';
    }
    input.value = item.text;
    host.appendChild(input);
    this.viewportElement.appendChild(host);
    control = new EditBox(input, {
      editor: 'text',
      width: '100%',
      height: type === 'node' ? '100%' : 30,
      multiline: type === 'node',
      value: item.text,
      theme: 'inherit'
    });
    textbox = control.textbox();
    state = {
      itemType: type,
      itemId: item.id,
      host: host,
      control: control,
      textbox: textbox,
      onKeyDown: null,
      onBlur: null,
      onInput: null,
      onPointerDown: null
    };
    state.resizeEditor = function() {
      var maximumHeight;
      if (state.itemType !== 'node') return;
      maximumHeight = Math.max(18, state.host.clientHeight - 4);
      state.textbox.style.height = '1px';
      state.textbox.style.height = Math.min(
        maximumHeight,
        Math.max(18, state.textbox.scrollHeight)
      ) + 'px';
    };
    state.onKeyDown = function(event) {
      if (
        event.key === 'Enter' &&
        (state.itemType !== 'node' || event.ctrlKey || event.metaKey)
      ) {
        event.preventDefault();
        self._closeInlineTextEditor(true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        self._closeInlineTextEditor(false);
      }
    };
    state.onInput = function() {
      state.resizeEditor();
    };
    state.onBlur = function() {
      setTimeout(function() {
        if (self._inlineTextEditor === state) {
          self._closeInlineTextEditor(true);
        }
      }, 0);
    };
    state.onPointerDown = function(event) {
      event.stopPropagation();
    };
    textbox.addEventListener('keydown', state.onKeyDown);
    textbox.addEventListener('input', state.onInput);
    textbox.addEventListener('blur', state.onBlur);
    host.addEventListener('pointerdown', state.onPointerDown);
    this._inlineTextEditor = state;
    this._positionInlineTextEditor();
    textbox.focus();
    textbox.select();
  };

  Diagram.prototype._beginNodeTextEdit = function(id) {
    this._beginInlineTextEdit('node', id);
  };

  Diagram.prototype._beginConnectorTextEdit = function(id) {
    this._beginInlineTextEdit('connector', id);
  };

  Diagram.prototype._closeInlineTextEditor = function(commit) {
    var state = this._inlineTextEditor;
    var item;
    var value;
    var changed = false;
    if (!state) return;
    this._inlineTextEditor = null;
    state.textbox.removeEventListener('keydown', state.onKeyDown);
    state.textbox.removeEventListener('input', state.onInput);
    state.textbox.removeEventListener('blur', state.onBlur);
    state.host.removeEventListener('pointerdown', state.onPointerDown);
    if (state.nodeElement) {
      state.nodeElement.classList.remove('fui-diagram-node-editing');
    }
    item = state.itemType === 'node' ?
      this.getNode(state.itemId) :
      this.getConnector(state.itemId);
    value = state.control.getValue();
    state.control.dispose();
    if (state.host.parentNode) state.host.parentNode.removeChild(state.host);
    if (commit && item && item.text !== String(value == null ? '' : value)) {
      item.text = String(value == null ? '' : value);
      changed = true;
    }
    if (changed) {
      this._commit('change', {
        itemType: state.itemType,
        item: item
      });
      this.render();
    }
  };

  Diagram.prototype._closeConnectorTextEditor = function(commit) {
    this._closeInlineTextEditor(commit);
  };

  Diagram.prototype._handleConnectNode = function(id) {
    if (!this._connectSourceId) {
      this._connectSourceId = id;
      this.selectItem('node', id);
      this._renderCanvas();
      return;
    }
    if (this._connectSourceId !== id) {
      this.addConnector({
        from: this._connectSourceId,
        to: id,
        type: this._connectType
      });
    }
    this._connectSourceId = '';
    this.setConnectMode(false);
  };

  Diagram.prototype._handleKeyDown = function(event) {
    var selectedNodes;
    var delta = event.shiftKey ? 10 : 1;
    var modifier = event.ctrlKey || event.metaKey;
    if (this.options.disabled) return;
    if (diagramEventTargetsInteractiveControl(event, this.hostElement)) return;
    if (
      !this.options.readOnly &&
      modifier &&
      String(event.key).toLowerCase() === 'z'
    ) {
      event.preventDefault();
      if (event.shiftKey) this.redo();
      else this.undo();
      return;
    }
    if (
      !this.options.readOnly &&
      modifier &&
      String(event.key).toLowerCase() === 'y'
    ) {
      event.preventDefault();
      this.redo();
      return;
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && !this.options.readOnly) {
      event.preventDefault();
      this.removeSelected();
      return;
    }
    if (event.key === 'Escape') {
      this.setConnectMode(false);
      this.clearSelection();
      return;
    }
    if (!this._selected || this._selected.type !== 'node' || this.options.readOnly) return;
    selectedNodes = this._selectedNodeIds.map(this.getNode.bind(this)).filter(Boolean);
    if (!selectedNodes.length) return;
    if (event.key === 'ArrowLeft') {
      selectedNodes.forEach(function(node) { node.x -= delta; });
    } else if (event.key === 'ArrowRight') {
      selectedNodes.forEach(function(node) { node.x += delta; });
    } else if (event.key === 'ArrowUp') {
      selectedNodes.forEach(function(node) { node.y -= delta; });
    } else if (event.key === 'ArrowDown') {
      selectedNodes.forEach(function(node) { node.y += delta; });
    } else {
      return;
    }
    event.preventDefault();
    this._renderCanvas();
    this._commit('change', {
      itemType: 'node',
      item: selectedNodes[selectedNodes.length - 1],
      items: selectedNodes
    });
    this._renderProperties();
  };

  Diagram.prototype._handleViewportWheel = function(event) {
    var delta;
    var factor;
    if (this.options.disabled || !event.deltaY) return;
    event.preventDefault();
    delta = event.deltaY;
    if (event.deltaMode === 1) delta *= 16;
    else if (event.deltaMode === 2) delta *= this.viewportElement.clientHeight;
    delta = diagramClamp(delta, -100, 100);
    factor = Math.pow(2, -delta / 500);
    this._setZoomAtPoint(
      this.options.zoomLevel * factor,
      event.clientX,
      event.clientY
    );
  };

  Diagram.prototype._createShapeElement = function(node) {
    var shape;
    var points;
    var path;
    var centerX = node.x + node.width / 2;
    var centerY = node.y + node.height / 2;
    var radiusX = node.width / 2;
    var radiusY = node.height / 2;
    var index;
    var angle;
    var radius;
    points = [
      'triangle', 'decision', 'diamond', 'pentagon', 'hexagon',
      'preparation', 'octagon', 'star', 'cross', 'arrowUp',
      'arrowDown', 'arrowLeft', 'arrowRight', 'arrowUpDown',
      'arrowLeftRight', 'data', 'manualInput', 'manualOperation', 'merge'
    ].indexOf(node.type) >= 0 ? diagramShapePolygon(node) : null;
    if (node.type === 'heart') {
      path = 'M ' + centerX + ' ' + (node.y + node.height) +
        ' C ' + (node.x + node.width * 0.42) + ' ' + (node.y + node.height * 0.78) +
        ' ' + node.x + ' ' + (node.y + node.height * 0.52) +
        ' ' + node.x + ' ' + (node.y + node.height * 0.28) +
        ' C ' + node.x + ' ' + (node.y + node.height * 0.02) +
        ' ' + (node.x + node.width * 0.32) + ' ' + node.y +
        ' ' + centerX + ' ' + (node.y + node.height * 0.22) +
        ' C ' + (node.x + node.width * 0.68) + ' ' + node.y +
        ' ' + (node.x + node.width) + ' ' + (node.y + node.height * 0.02) +
        ' ' + (node.x + node.width) + ' ' + (node.y + node.height * 0.28) +
        ' C ' + (node.x + node.width) + ' ' + (node.y + node.height * 0.52) +
        ' ' + (node.x + node.width * 0.58) + ' ' + (node.y + node.height * 0.78) +
        ' ' + centerX + ' ' + (node.y + node.height) + ' Z';
      shape = createDiagramSvgElement('path', { d: path });
    } else if (points) {
      shape = createDiagramSvgElement('polygon', {
        points: points.map(function(point) {
          return point.x + ',' + point.y;
        }).join(' ')
      });
    } else if (
      node.type === 'summingJunction' ||
      node.type === 'orJunction'
    ) {
      shape = createDiagramSvgElement('g');
      shape.appendChild(createDiagramSvgElement('ellipse', {
        cx: centerX,
        cy: centerY,
        rx: radiusX,
        ry: radiusY
      }));
      if (node.type === 'summingJunction') {
        shape.appendChild(createDiagramSvgElement('path', {
          d: 'M ' + centerX + ' ' + node.y +
            ' V ' + (node.y + node.height) +
            ' M ' + node.x + ' ' + centerY +
            ' H ' + (node.x + node.width),
          fill: 'none'
        }));
      } else {
        shape.appendChild(createDiagramSvgElement('path', {
          d: 'M ' + (node.x + node.width * 0.15) + ' ' +
            (node.y + node.height * 0.15) +
            ' L ' + (node.x + node.width * 0.85) + ' ' +
            (node.y + node.height * 0.85) +
            ' M ' + (node.x + node.width * 0.85) + ' ' +
            (node.y + node.height * 0.15) +
            ' L ' + (node.x + node.width * 0.15) + ' ' +
            (node.y + node.height * 0.85),
          fill: 'none'
        }));
      }
    } else if (
      node.type === 'ellipse' ||
      node.type === 'dfdProcess' ||
      node.type === 'terminator' ||
      node.type === 'onPageReference'
    ) {
      shape = createDiagramSvgElement('ellipse', {
        cx: centerX,
        cy: centerY,
        rx: radiusX,
        ry: radiusY
      });
    } else if (node.type === 'dfdDataStore') {
      shape = createDiagramSvgElement('g');
      shape.appendChild(createDiagramSvgElement('rect', {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        fill: node.fill,
        stroke: 'none'
      }));
      shape.appendChild(createDiagramSvgElement('path', {
        d: 'M ' + node.x + ' ' + node.y +
          ' H ' + (node.x + node.width) +
          ' M ' + node.x + ' ' + (node.y + node.height) +
          ' H ' + (node.x + node.width),
        fill: 'none'
      }));
    } else if (node.type.indexOf('orgChart') === 0) {
      shape = createDiagramSvgElement('g');
      shape.appendChild(createDiagramSvgElement('rect', {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        rx: Math.min(8, node.width * 0.06),
        ry: Math.min(8, node.height * 0.08),
        class: 'fui-diagram-org-card'
      }));
      shape.appendChild(createDiagramSvgElement('rect', {
        x: node.type === 'orgChartImageRight' ?
          node.x + node.width * 0.62 :
          node.type === 'orgChartImageTop' ?
            node.x + node.width * 0.26 :
            node.x + node.width * 0.06,
        y: node.type === 'orgChartImageTop' ?
          node.y + node.height * 0.07 :
          node.y + node.height * 0.14,
        width: node.type === 'orgChartImageTop' ?
          node.width * 0.48 :
          node.width * 0.32,
        height: node.type === 'orgChartImageTop' ?
          node.height * 0.44 :
          node.height * 0.72,
        rx: Math.min(5, node.width * 0.03),
        ry: Math.min(5, node.height * 0.05),
        fill: node.stroke,
        stroke: 'none',
        class: 'fui-diagram-org-image'
      }));
    } else if (node.type === 'multipleDocuments') {
      shape = createDiagramSvgElement('g');
      [
        { x: node.x + node.width * 0.16, y: node.y, width: node.width * 0.84 },
        { x: node.x + node.width * 0.08, y: node.y + node.height * 0.1, width: node.width * 0.84 },
        { x: node.x, y: node.y + node.height * 0.2, width: node.width * 0.84 }
      ].forEach(function(page) {
        shape.appendChild(createDiagramSvgElement('path', {
          d: 'M ' + page.x + ' ' + page.y +
            ' H ' + (page.x + page.width) +
            ' V ' + (node.y + node.height * 0.84) +
            ' Q ' + (page.x + page.width * 0.75) + ' ' +
            (node.y + node.height * 0.68) +
            ' ' + (page.x + page.width * 0.5) + ' ' +
            (node.y + node.height * 0.84) +
            ' Q ' + (page.x + page.width * 0.25) + ' ' +
            (node.y + node.height) +
            ' ' + page.x + ' ' + (node.y + node.height * 0.84) + ' Z'
        }));
      });
    } else if (node.type === 'directData' || node.type === 'sequentialData') {
      path = 'M ' + (node.x + node.width * 0.15) + ' ' + node.y +
        ' H ' + (node.x + node.width * 0.85) +
        ' C ' + (node.x + node.width) + ' ' + node.y +
        ' ' + (node.x + node.width) + ' ' + (node.y + node.height) +
        ' ' + (node.x + node.width * 0.85) + ' ' + (node.y + node.height) +
        ' H ' + (node.x + node.width * 0.15) +
        ' C ' + node.x + ' ' + (node.y + node.height) +
        ' ' + node.x + ' ' + node.y +
        ' ' + (node.x + node.width * 0.15) + ' ' + node.y + ' Z';
      shape = createDiagramSvgElement('path', { d: path });
    } else if (node.type === 'internalStorage') {
      shape = createDiagramSvgElement('g');
      shape.appendChild(createDiagramSvgElement('rect', {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height
      }));
      shape.appendChild(createDiagramSvgElement('path', {
        d: 'M ' + (node.x + node.width * 0.14) + ' ' + node.y +
          ' V ' + (node.y + node.height) +
          ' M ' + node.x + ' ' + (node.y + node.height * 0.18) +
          ' H ' + (node.x + node.width),
        fill: 'none'
      }));
    } else if (node.type === 'paperTape') {
      path = 'M ' + node.x + ' ' + (node.y + node.height * 0.18) +
        ' Q ' + (node.x + node.width * 0.25) + ' ' + node.y +
        ' ' + (node.x + node.width * 0.5) + ' ' + (node.y + node.height * 0.18) +
        ' Q ' + (node.x + node.width * 0.75) + ' ' +
        (node.y + node.height * 0.36) +
        ' ' + (node.x + node.width) + ' ' + (node.y + node.height * 0.18) +
        ' V ' + (node.y + node.height * 0.82) +
        ' Q ' + (node.x + node.width * 0.75) + ' ' +
        (node.y + node.height) +
        ' ' + (node.x + node.width * 0.5) + ' ' + (node.y + node.height * 0.82) +
        ' Q ' + (node.x + node.width * 0.25) + ' ' +
        (node.y + node.height * 0.64) +
        ' ' + node.x + ' ' + (node.y + node.height * 0.82) + ' Z';
      shape = createDiagramSvgElement('path', { d: path });
    } else if (node.type === 'storedData') {
      path = 'M ' + (node.x + node.width * 0.15) + ' ' + node.y +
        ' H ' + (node.x + node.width * 0.85) +
        ' C ' + (node.x + node.width) + ' ' + node.y +
        ' ' + (node.x + node.width) + ' ' + (node.y + node.height) +
        ' ' + (node.x + node.width * 0.85) + ' ' + (node.y + node.height) +
        ' H ' + (node.x + node.width * 0.15) +
        ' C ' + (node.x + node.width * 0.32) + ' ' +
        (node.y + node.height * 0.75) +
        ' ' + (node.x + node.width * 0.32) + ' ' +
        (node.y + node.height * 0.25) +
        ' ' + (node.x + node.width * 0.15) + ' ' + node.y + ' Z';
      shape = createDiagramSvgElement('path', { d: path });
    } else if (node.type === 'decision' || node.type === 'triangle') {
      points = node.type === 'triangle' ? [
        centerX + ',' + node.y,
        (node.x + node.width) + ',' + (node.y + node.height),
        node.x + ',' + (node.y + node.height)
      ] : [
        centerX + ',' + node.y,
        (node.x + node.width) + ',' + centerY,
        centerX + ',' + (node.y + node.height),
        node.x + ',' + centerY
      ];
      shape = createDiagramSvgElement('polygon', { points: points.join(' ') });
    } else if (
      node.type === 'pentagon' ||
      node.type === 'hexagon' ||
      node.type === 'preparation'
    ) {
      points = node.type === 'pentagon' ? [
        centerX + ',' + node.y,
        (node.x + node.width) + ',' + (node.y + node.height * 0.38),
        (node.x + node.width * 0.82) + ',' + (node.y + node.height),
        (node.x + node.width * 0.18) + ',' + (node.y + node.height),
        node.x + ',' + (node.y + node.height * 0.38)
      ] : [
        (node.x + node.width * 0.2) + ',' + node.y,
        (node.x + node.width * 0.8) + ',' + node.y,
        (node.x + node.width) + ',' + centerY,
        (node.x + node.width * 0.8) + ',' + (node.y + node.height),
        (node.x + node.width * 0.2) + ',' + (node.y + node.height),
        node.x + ',' + centerY
      ];
      shape = createDiagramSvgElement('polygon', { points: points.join(' ') });
    } else if (node.type === 'star') {
      points = [];
      for (index = 0; index < 10; index += 1) {
        angle = -Math.PI / 2 + index * Math.PI / 5;
        radius = index % 2 === 0 ? 1 : 0.42;
        points.push(
          (centerX + Math.cos(angle) * radiusX * radius) + ',' +
          (centerY + Math.sin(angle) * radiusY * radius)
        );
      }
      shape = createDiagramSvgElement('polygon', { points: points.join(' ') });
    } else if (node.type === 'cross') {
      points = [
        (node.x + node.width * 0.35) + ',' + node.y,
        (node.x + node.width * 0.65) + ',' + node.y,
        (node.x + node.width * 0.65) + ',' + (node.y + node.height * 0.35),
        (node.x + node.width) + ',' + (node.y + node.height * 0.35),
        (node.x + node.width) + ',' + (node.y + node.height * 0.65),
        (node.x + node.width * 0.65) + ',' + (node.y + node.height * 0.65),
        (node.x + node.width * 0.65) + ',' + (node.y + node.height),
        (node.x + node.width * 0.35) + ',' + (node.y + node.height),
        (node.x + node.width * 0.35) + ',' + (node.y + node.height * 0.65),
        node.x + ',' + (node.y + node.height * 0.65),
        node.x + ',' + (node.y + node.height * 0.35),
        (node.x + node.width * 0.35) + ',' + (node.y + node.height * 0.35)
      ];
      shape = createDiagramSvgElement('polygon', { points: points.join(' ') });
    } else if (node.type === 'arrowLeft' || node.type === 'arrowRight') {
      points = node.type === 'arrowLeft' ? [
        node.x + ',' + centerY,
        (node.x + node.width * 0.42) + ',' + node.y,
        (node.x + node.width * 0.42) + ',' + (node.y + node.height * 0.3),
        (node.x + node.width) + ',' + (node.y + node.height * 0.3),
        (node.x + node.width) + ',' + (node.y + node.height * 0.7),
        (node.x + node.width * 0.42) + ',' + (node.y + node.height * 0.7),
        (node.x + node.width * 0.42) + ',' + (node.y + node.height)
      ] : [
        (node.x + node.width) + ',' + centerY,
        (node.x + node.width * 0.58) + ',' + node.y,
        (node.x + node.width * 0.58) + ',' + (node.y + node.height * 0.3),
        node.x + ',' + (node.y + node.height * 0.3),
        node.x + ',' + (node.y + node.height * 0.7),
        (node.x + node.width * 0.58) + ',' + (node.y + node.height * 0.7),
        (node.x + node.width * 0.58) + ',' + (node.y + node.height)
      ];
      shape = createDiagramSvgElement('polygon', { points: points.join(' ') });
    } else if (
      node.type === 'data' ||
      node.type === 'manualInput'
    ) {
      points = [
        (node.x + node.width * (node.type === 'manualInput' ? 0.18 : 0.15)) +
          ',' + node.y,
        (node.x + node.width) + ',' + node.y,
        (node.x + node.width * (node.type === 'manualInput' ? 1 : 0.85)) +
          ',' + (node.y + node.height),
        node.x + ',' + (node.y + node.height)
      ];
      shape = createDiagramSvgElement('polygon', { points: points.join(' ') });
    } else if (node.type === 'document') {
      path = 'M ' + node.x + ' ' + node.y +
        ' H ' + (node.x + node.width) +
        ' V ' + (node.y + node.height * 0.82) +
        ' Q ' + (node.x + node.width * 0.75) + ' ' + (node.y + node.height * 0.65) +
        ' ' + (node.x + node.width * 0.5) + ' ' + (node.y + node.height * 0.82) +
        ' Q ' + (node.x + node.width * 0.25) + ' ' + (node.y + node.height) +
        ' ' + node.x + ' ' + (node.y + node.height * 0.82) + ' Z';
      shape = createDiagramSvgElement('path', { d: path });
    } else if (node.type === 'database') {
      path = 'M ' + node.x + ' ' + (node.y + node.height * 0.16) +
        ' C ' + node.x + ' ' + node.y +
        ' ' + (node.x + node.width) + ' ' + node.y +
        ' ' + (node.x + node.width) + ' ' + (node.y + node.height * 0.16) +
        ' V ' + (node.y + node.height * 0.84) +
        ' C ' + (node.x + node.width) + ' ' + (node.y + node.height) +
        ' ' + node.x + ' ' + (node.y + node.height) +
        ' ' + node.x + ' ' + (node.y + node.height * 0.84) + ' Z' +
        ' M ' + node.x + ' ' + (node.y + node.height * 0.16) +
        ' C ' + node.x + ' ' + (node.y + node.height * 0.32) +
        ' ' + (node.x + node.width) + ' ' + (node.y + node.height * 0.32) +
        ' ' + (node.x + node.width) + ' ' + (node.y + node.height * 0.16);
      shape = createDiagramSvgElement('path', { d: path });
    } else if (node.type === 'predefinedProcess') {
      path = 'M ' + node.x + ' ' + node.y +
        ' H ' + (node.x + node.width) +
        ' V ' + (node.y + node.height) +
        ' H ' + node.x + ' Z' +
        ' M ' + (node.x + node.width * 0.14) + ' ' + node.y +
        ' V ' + (node.y + node.height) +
        ' M ' + (node.x + node.width * 0.86) + ' ' + node.y +
        ' V ' + (node.y + node.height);
      shape = createDiagramSvgElement('path', { d: path });
    } else if (node.type === 'delay') {
      path = 'M ' + node.x + ' ' + node.y +
        ' H ' + (node.x + node.width * 0.56) +
        ' C ' + (node.x + node.width) + ' ' + node.y +
        ' ' + (node.x + node.width) + ' ' + (node.y + node.height) +
        ' ' + (node.x + node.width * 0.56) + ' ' + (node.y + node.height) +
        ' H ' + node.x + ' Z';
      shape = createDiagramSvgElement('path', { d: path });
    } else if (node.type === 'display') {
      path = 'M ' + (node.x + node.width * 0.16) + ' ' + node.y +
        ' H ' + (node.x + node.width * 0.72) +
        ' Q ' + (node.x + node.width) + ' ' + centerY +
        ' ' + (node.x + node.width * 0.72) + ' ' + (node.y + node.height) +
        ' H ' + (node.x + node.width * 0.16) +
        ' Q ' + node.x + ' ' + centerY +
        ' ' + (node.x + node.width * 0.16) + ' ' + node.y + ' Z';
      shape = createDiagramSvgElement('path', { d: path });
    } else if (node.type === 'cloud') {
      path = 'M ' + (node.x + node.width * 0.2) + ' ' + (node.y + node.height * 0.78) +
        ' C ' + (node.x - node.width * 0.03) + ' ' + (node.y + node.height * 0.72) +
        ' ' + node.x + ' ' + (node.y + node.height * 0.36) +
        ' ' + (node.x + node.width * 0.23) + ' ' + (node.y + node.height * 0.38) +
        ' C ' + (node.x + node.width * 0.24) + ' ' + (node.y + node.height * 0.08) +
        ' ' + (node.x + node.width * 0.58) + ' ' + (node.y + node.height * 0.02) +
        ' ' + (node.x + node.width * 0.68) + ' ' + (node.y + node.height * 0.27) +
        ' C ' + (node.x + node.width * 0.96) + ' ' + (node.y + node.height * 0.18) +
        ' ' + (node.x + node.width * 1.08) + ' ' + (node.y + node.height * 0.57) +
        ' ' + (node.x + node.width * 0.86) + ' ' + (node.y + node.height * 0.72) +
        ' C ' + (node.x + node.width * 0.7) + ' ' + (node.y + node.height) +
        ' ' + (node.x + node.width * 0.35) + ' ' + (node.y + node.height * 0.98) +
        ' ' + (node.x + node.width * 0.2) + ' ' + (node.y + node.height * 0.78) + ' Z';
      shape = createDiagramSvgElement('path', { d: path });
    } else {
      shape = createDiagramSvgElement('rect', {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        rx: node.type === 'roundedRectangle' ? 12 : 0,
        ry: node.type === 'roundedRectangle' ? 12 : 0
      });
    }
    shape.setAttribute('class', 'fui-diagram-node-shape');
    shape.setAttribute('fill', node.type === 'text' ? 'transparent' : node.fill);
    shape.setAttribute('stroke', node.type === 'text' ? 'transparent' : node.stroke);
    shape.setAttribute('stroke-width', node.strokeWidth);
    return shape;
  };

  Diagram.prototype._createOrgChartPreviewLines = function(node) {
    var imageOnTop = node.type === 'orgChartImageTop';
    var imageOnRight = node.type === 'orgChartImageRight';
    var startX = imageOnTop ?
      node.x + node.width * 0.18 :
      imageOnRight ?
        node.x + node.width * 0.08 :
        node.x + node.width * 0.46;
    var endX = imageOnTop ?
      node.x + node.width * 0.82 :
      imageOnRight ?
        node.x + node.width * 0.54 :
        node.x + node.width * 0.92;
    var startY = imageOnTop ?
      node.y + node.height * 0.62 :
      node.y + node.height * 0.34;
    var gap = imageOnTop ? node.height * 0.11 : node.height * 0.18;
    return createDiagramSvgElement('path', {
      d: 'M ' + startX + ' ' + startY + ' H ' + endX +
        ' M ' + startX + ' ' + (startY + gap) + ' H ' + endX +
        ' M ' + startX + ' ' + (startY + gap * 2) +
        ' H ' + (startX + (endX - startX) * 0.72),
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2.5,
      opacity: 0.38,
      class: 'fui-diagram-org-preview-lines'
    });
  };

  Diagram.prototype._renderNodeText = function(group, node) {
    var source = String(node.text || '');
    var textBox = diagramNodeTextBox(node);
    var fontSize = normalizeDiagramFontSize(node.fontSize);
    var lineHeight = Math.round(fontSize * 1.3);
    var hasHyperlink = Boolean(normalizeDiagramHyperlink(node.hyperlink));
    var text = createDiagramSvgElement('text', {
      x: textBox.x,
      y: textBox.y,
      fill: node.textColor,
      'font-size': fontSize,
      'font-weight': node.fontBold ? 700 : 400,
      'font-style': node.fontItalic ? 'italic' : 'normal',
      'text-decoration': diagramTextDecoration(node, hasHyperlink),
      'text-anchor': 'middle',
      class: 'fui-diagram-node-text' + (
        hasHyperlink ?
          ' fui-diagram-node-text-linked' :
          ''
      ),
      'data-diagram-node-text': '',
      'data-node-id': node.id
    });
    var paragraphs = source.split(/\r?\n/);
    var lines = [];
    var maxChars = Math.max(2, Math.floor(textBox.width / (fontSize * 0.57)));
    paragraphs.forEach(function(paragraph) {
      var hasWhitespace = /\s/.test(paragraph);
      var words = hasWhitespace ? paragraph.split(/\s+/) : paragraph.split('');
      var line = '';
      if (!paragraph) {
        lines.push('');
        return;
      }
      words.forEach(function(word) {
        var next = line ? line + (hasWhitespace ? ' ' : '') + word : word;
        if (next.length > maxChars && line) {
          lines.push(line);
          line = word;
        } else {
          line = next;
        }
      });
      lines.push(line);
    });
    if (!lines.length) lines.push('');
    lines = lines.slice(0, 4);
    lines.forEach(function(value, index) {
      var tspan = createDiagramSvgElement('tspan', {
        x: textBox.x,
        dy: index === 0 ? (-(lines.length - 1) * lineHeight / 2) : lineHeight
      });
      tspan.textContent = value;
      text.appendChild(tspan);
    });
    group.appendChild(text);
  };

  Diagram.prototype._renderConnectionPoints = function(layer, node) {
    var state = this._interaction;
    if (this.options.readOnly) return;
    DIAGRAM_CONNECTION_POINTS.forEach(function(descriptor) {
      var point = getDiagramConnectionPoint(node, descriptor.name);
      var isTarget = state && state.type === 'connect' &&
        state.targetNodeId === node.id &&
        state.targetPoint === descriptor.name;
      var handle = createDiagramSvgElement('circle', {
        cx: point.x,
        cy: point.y,
        r: 5,
        class: 'fui-diagram-connection-point' +
          (isTarget ? ' fui-diagram-connection-point-target' : ''),
        'data-diagram-connection-point': descriptor.name,
        'data-node-id': node.id
      });
      layer.appendChild(handle);
    });
  };

  Diagram.prototype._renderSelection = function(
    layer,
    node,
    primary,
    showConnectionPoints
  ) {
    var directions = [
      ['nw', node.x, node.y],
      ['n', node.x + node.width / 2, node.y],
      ['ne', node.x + node.width, node.y],
      ['e', node.x + node.width, node.y + node.height / 2],
      ['se', node.x + node.width, node.y + node.height],
      ['s', node.x + node.width / 2, node.y + node.height],
      ['sw', node.x, node.y + node.height],
      ['w', node.x, node.y + node.height / 2]
    ];
    var outline = createDiagramSvgElement('rect', {
      x: node.x - 4,
      y: node.y - 4,
      width: node.width + 8,
      height: node.height + 8,
      class: 'fui-diagram-selection-outline'
    });
    layer.appendChild(outline);
    if (this.options.readOnly) return;
    if (primary) {
      directions.forEach(function(item) {
        var handle = createDiagramSvgElement('rect', {
          x: item[1] - 4,
          y: item[2] - 4,
          width: 8,
          height: 8,
          class: 'fui-diagram-resize-handle fui-diagram-resize-' + item[0],
          'data-diagram-resize': item[0],
          'data-node-id': node.id
        });
        layer.appendChild(handle);
      });
    }
    if (showConnectionPoints !== false) {
      this._renderConnectionPoints(layer, node);
    }
  };

  Diagram.prototype._renderGroupSelection = function(layer, nodes) {
    var bounds = calculateDiagramGroupBounds(nodes);
    var primaryId = this._selected ? this._selected.id : '';
    var handles;
    if (!bounds || nodes.length < 2) return;
    handles = [
      ['nw', bounds.x, bounds.y],
      ['ne', bounds.x + bounds.width, bounds.y],
      ['se', bounds.x + bounds.width, bounds.y + bounds.height],
      ['sw', bounds.x, bounds.y + bounds.height]
    ];
    layer.appendChild(createDiagramSvgElement('rect', {
      x: bounds.x - 7,
      y: bounds.y - 7,
      width: bounds.width + 14,
      height: bounds.height + 14,
      class: 'fui-diagram-group-selection-outline'
    }));
    if (this.options.readOnly) return;
    handles.forEach(function(item) {
      layer.appendChild(createDiagramSvgElement('rect', {
        x: item[1] - 5,
        y: item[2] - 5,
        width: 10,
        height: 10,
        class: 'fui-diagram-resize-handle fui-diagram-group-resize-handle ' +
          'fui-diagram-resize-' + item[0],
        'data-diagram-resize': item[0],
        'data-diagram-group-resize': '',
        'data-node-id': primaryId
      }));
    });
  };

  Diagram.prototype._renderCanvas = function() {
    var self = this;
    var svg = this.svgElement;
    var previewCurve;
    var previewPath;
    var selectedConnector;
    var selectedFrom;
    var selectedTo;
    var selectedGeometry;
    var selectedNodes;
    var defs = createDiagramSvgElement('defs');
    var pattern = createDiagramSvgElement('pattern', {
      id: 'fui-diagram-grid-' + this._instanceId,
      width: this.options.gridSize,
      height: this.options.gridSize,
      patternUnits: 'userSpaceOnUse'
    });
    var gridBackground = createDiagramSvgElement('rect', {
      x: 0,
      y: 0,
      width: this.options.gridSize,
      height: this.options.gridSize,
      fill: this.options.pageColor
    });
    var gridPath = createDiagramSvgElement('path', {
      d: 'M ' + this.options.gridSize + ' 0 L 0 0 0 ' + this.options.gridSize,
      class: 'fui-diagram-grid-line',
      fill: 'none',
      stroke: '#d1d5db',
      'stroke-width': 1
    });
    var marker = createDiagramSvgElement('marker', {
      id: 'fui-diagram-arrow-' + this._instanceId,
      viewBox: '0 0 10 10',
      refX: 9,
      refY: 5,
      markerWidth: 7,
      markerHeight: 7,
      orient: 'auto-start-reverse'
    });
    var markerPath = createDiagramSvgElement('path', {
      d: 'M 0 0 L 10 5 L 0 10 z',
      class: 'fui-diagram-arrow',
      fill: 'context-stroke'
    });
    var page = createDiagramSvgElement('rect', {
      x: 0,
      y: 0,
      width: this.options.pageWidth,
      height: this.options.pageHeight,
      fill: this.options.showGrid ?
        'url(#fui-diagram-grid-' + this._instanceId + ')' :
        this.options.pageColor,
      class: 'fui-diagram-page'
    });
    var connectorLayer = createDiagramSvgElement('g', {
      class: 'fui-diagram-connectors'
    });
    var nodeLayer = createDiagramSvgElement('g', {
      class: 'fui-diagram-nodes'
    });
    var selectionLayer = createDiagramSvgElement('g', {
      class: 'fui-diagram-selection'
    });
    svg.setAttribute(
      'viewBox',
      '0 0 ' + this.options.pageWidth + ' ' + this.options.pageHeight
    );
    svg.textContent = '';
    pattern.appendChild(gridBackground);
    pattern.appendChild(gridPath);
    marker.appendChild(markerPath);
    defs.appendChild(pattern);
    defs.appendChild(marker);
    svg.appendChild(defs);
    svg.appendChild(page);
    this._data.connectors.forEach(function(connector) {
      var from = self.getNode(connector.from);
      var to = self.getNode(connector.to);
      var geometry;
      var group;
      var hitPath;
      var path;
      var label;
      var labelBackground;
      var labelBounds;
      var labelY;
      if (!from || !to) return;
      geometry = calculateDiagramConnectorPath(
        from,
        to,
        connector.type,
        connector.fromPoint,
        connector.toPoint,
        connector.controlX,
        connector.controlY
      );
      group = createDiagramSvgElement('g', {
        class: 'fui-diagram-connector' +
          (self._selected && self._selected.type === 'connector' &&
          self._selected.id === connector.id ? ' fui-diagram-connector-selected' : ''),
        'data-diagram-connector': '',
        'data-connector-id': connector.id
      });
      hitPath = createDiagramSvgElement('path', {
        d: geometry.path,
        class: 'fui-diagram-connector-hit',
        fill: 'none',
        stroke: 'transparent',
        'stroke-width': 14
      });
      path = createDiagramSvgElement('path', {
        d: geometry.path,
        class: 'fui-diagram-connector-line',
        fill: 'none',
        stroke: connector.stroke,
        'stroke-width': connector.strokeWidth,
        'stroke-dasharray': connector.lineStyle === 'dashed' ? '7 5' : '',
        'marker-start': connector.arrowDirection === 'start' ||
          connector.arrowDirection === 'both' ?
          'url(#fui-diagram-arrow-' + self._instanceId + ')' :
          '',
        'marker-end': connector.arrowDirection === 'end' ||
          connector.arrowDirection === 'both' ?
          'url(#fui-diagram-arrow-' + self._instanceId + ')' :
          ''
      });
      group.appendChild(hitPath);
      group.appendChild(path);
      connectorLayer.appendChild(group);
      if (connector.text) {
        labelY = geometry.label.y - Math.max(12, connector.fontSize * 0.85);
        label = createDiagramSvgElement('text', {
          x: geometry.label.x,
          y: labelY,
          'font-size': connector.fontSize,
          'font-weight': connector.fontBold ? 700 : 400,
          'font-style': connector.fontItalic ? 'italic' : 'normal',
          'text-decoration': diagramTextDecoration(connector, false),
          class: 'fui-diagram-connector-label',
          'text-anchor': 'middle'
        });
        label.textContent = connector.text;
        group.appendChild(label);
        try {
          labelBounds = label.getBBox();
        } catch (error) {
          labelBounds = null;
        }
        if (!labelBounds || !labelBounds.width || !labelBounds.height) {
          labelBounds = {
            x: geometry.label.x - Math.max(
              18,
              connector.text.length * connector.fontSize * 0.57
            ) / 2,
            y: labelY - connector.fontSize,
            width: Math.max(
              18,
              connector.text.length * connector.fontSize * 0.57
            ),
            height: connector.fontSize * 1.2
          };
        }
        labelBackground = createDiagramSvgElement('rect', {
          x: labelBounds.x - 4,
          y: labelBounds.y - 2,
          width: labelBounds.width + 8,
          height: labelBounds.height + 5,
          rx: 2,
          ry: 2,
          fill: self.options.pageColor,
          class: 'fui-diagram-connector-label-background'
        });
        group.insertBefore(labelBackground, label);
      }
    });
    if (
      this._selected &&
      this._selected.type === 'connector' &&
      !this.options.readOnly
    ) {
      selectedConnector = this.getConnector(this._selected.id);
      selectedFrom = selectedConnector ?
        this.getNode(selectedConnector.from) :
        null;
      selectedTo = selectedConnector ?
        this.getNode(selectedConnector.to) :
        null;
      if (selectedConnector && selectedFrom && selectedTo) {
        selectedGeometry = calculateDiagramConnectorPath(
          selectedFrom,
          selectedTo,
          selectedConnector.type,
          selectedConnector.fromPoint,
          selectedConnector.toPoint,
          selectedConnector.controlX,
          selectedConnector.controlY
        );
        selectionLayer.appendChild(createDiagramSvgElement('circle', {
          cx: selectedGeometry.label.x,
          cy: selectedGeometry.label.y,
          r: 6,
          class: 'fui-diagram-connector-control',
          'data-diagram-connector': '',
          'data-connector-id': selectedConnector.id
        }));
      }
    }
    selectedNodes = this._selectedNodeIds.map(this.getNode.bind(this)).filter(Boolean);
    this._data.nodes.forEach(function(node) {
      var group = createDiagramSvgElement('g', {
        class: 'fui-diagram-node' +
          (self._isNodeSelected(node.id) ? ' fui-diagram-node-selected' : '') +
          (self._connectSourceId === node.id ? ' fui-diagram-connect-source' : ''),
        'data-diagram-node': '',
        'data-node-id': node.id
      });
      group.appendChild(self._createShapeElement(node));
      self._renderNodeText(group, node);
      nodeLayer.appendChild(group);
      if (self._isNodeSelected(node.id)) {
        self._renderSelection(
          selectionLayer,
          node,
          selectedNodes.length === 1 &&
            self._selected && self._selected.id === node.id,
          selectedNodes.length === 1
        );
      }
    });
    if (selectedNodes.length > 1) {
      this._renderGroupSelection(selectionLayer, selectedNodes);
    }
    if (this._interaction && this._interaction.type === 'connect') {
      this._data.nodes.forEach(function(node) {
        if (!self._isNodeSelected(node.id)) {
          self._renderConnectionPoints(selectionLayer, node);
        }
      });
      if (this._interaction.connectorType === 'curved') {
        previewCurve = calculateDiagramCurve(
          this._interaction.startPoint,
          this._interaction.currentPoint
        );
        previewPath = previewCurve.path;
      } else if (this._interaction.connectorType === 'sCurve') {
        previewCurve = calculateDiagramSCurve(
          this._interaction.startPoint,
          this._interaction.currentPoint
        );
        previewPath = previewCurve.path;
      } else {
        previewPath = 'M ' + this._interaction.startPoint.x + ' ' +
          this._interaction.startPoint.y + ' L ' +
          this._interaction.currentPoint.x + ' ' +
          this._interaction.currentPoint.y;
      }
      selectionLayer.appendChild(createDiagramSvgElement('path', {
        d: previewPath,
        class: 'fui-diagram-connector-preview'
      }));
    }
    if (this._interaction && this._interaction.type === 'marquee') {
      selectionLayer.appendChild(createDiagramSvgElement('rect', {
        x: Math.min(
          this._interaction.startPoint.x,
          this._interaction.currentPoint.x
        ),
        y: Math.min(
          this._interaction.startPoint.y,
          this._interaction.currentPoint.y
        ),
        width: Math.abs(
          this._interaction.currentPoint.x - this._interaction.startPoint.x
        ),
        height: Math.abs(
          this._interaction.currentPoint.y - this._interaction.startPoint.y
        ),
        class: 'fui-diagram-marquee'
      }));
    }
    svg.appendChild(connectorLayer);
    svg.appendChild(nodeLayer);
    svg.appendChild(selectionLayer);
    svg.style.width = Math.round(this.options.pageWidth * this.options.zoomLevel) + 'px';
    svg.style.height = Math.round(this.options.pageHeight * this.options.zoomLevel) + 'px';
    this.viewportElement.classList.toggle(
      'fui-diagram-viewport-pannable',
      this._viewportCanPan()
    );
    this._positionInlineTextEditor();
    this._syncToolbarStates();
  };

  Diagram.prototype._disposePropertyEditors = function() {
    this._propertyEditors.forEach(function(control) {
      control.dispose();
    });
    this._propertyEditors = [];
  };

  Diagram.prototype._propertyField = function(
    label,
    item,
    key,
    editor,
    options,
    container
  ) {
    var self = this;
    var row = document.createElement('label');
    var caption = document.createElement('span');
    var input = document.createElement('input');
    var control;
    caption.textContent = label;
    row.className = 'fui-diagram-property-row';
    caption.className = 'fui-diagram-property-label';
    input.value = item[key] == null ? '' : String(item[key]);
    row.appendChild(caption);
    row.appendChild(input);
    (container || this.propertiesBodyElement).appendChild(row);
    control = new EditBox(input, diagramAssign({
      editor: editor,
      spinner: editor === 'number',
      width: '100%',
      theme: 'inherit',
      value: item[key],
      onChange: function(value) {
        if (editor === 'number') {
          value = diagramNumber(value, item[key]);
          if (key === 'width') value = Math.max(40, value);
          if (key === 'height') value = Math.max(30, value);
          if (key === 'fontSize') value = normalizeDiagramFontSize(value);
        }
        if (key === 'hyperlink') {
          value = String(value == null ? '' : value).trim();
        }
        if (key === 'hyperlinkTrigger') {
          value = normalizeDiagramHyperlinkTrigger(value);
        }
        item[key] = value;
        self._renderCanvas();
        self._commit('change', {
          itemType: self._selected.type,
          item: item
        });
      }
    }, options || {}));
    this._propertyEditors.push(control);
  };

  Diagram.prototype._paperPropertyField = function(
    label,
    key,
    editor,
    options
  ) {
    var self = this;
    var row = document.createElement('label');
    var caption = document.createElement('span');
    var input = document.createElement('input');
    var value = key === 'size' ?
      this.options.paperSize :
      key === 'orientation' ?
        this.options.paperOrientation :
        this.options.gridSize;
    var control;
    caption.textContent = label;
    row.className = 'fui-diagram-property-row';
    row.setAttribute('data-diagram-paper-property', key);
    caption.className = 'fui-diagram-property-label';
    input.value = String(value);
    row.appendChild(caption);
    row.appendChild(input);
    this.propertiesBodyElement.appendChild(row);
    control = new EditBox(input, diagramAssign({
      editor: editor,
      spinner: editor === 'number',
      width: '100%',
      theme: 'inherit',
      value: value,
      disabled: this.options.disabled || this.options.readOnly,
      onChange: function(nextValue) {
        var size = self.options.paperSize;
        var orientation = self.options.paperOrientation;
        var gridSize = self.options.gridSize;
        if (key === 'size') {
          size = normalizeDiagramPaperSize(nextValue);
        } else if (key === 'orientation') {
          orientation = normalizeDiagramPaperOrientation(nextValue);
        } else {
          gridSize = Math.max(5, diagramNumber(nextValue, gridSize));
        }
        self.setPaper(size, orientation, gridSize);
      }
    }, options || {}));
    this._propertyEditors.push(control);
  };

  Diagram.prototype._multiPropertyField = function(
    label,
    items,
    key,
    editor,
    options,
    container
  ) {
    var self = this;
    var common = diagramCommonProperty(items, key);
    var row = document.createElement('label');
    var caption = document.createElement('span');
    var input = document.createElement('input');
    var control;
    caption.textContent = label;
    row.className = 'fui-diagram-property-row';
    caption.className = 'fui-diagram-property-label';
    input.value = common.mixed || common.value == null ? '' : String(common.value);
    if (common.mixed) input.placeholder = '—';
    row.appendChild(caption);
    row.appendChild(input);
    (container || this.propertiesBodyElement).appendChild(row);
    control = new EditBox(input, diagramAssign({
      editor: editor,
      spinner: editor === 'number',
      width: '100%',
      theme: 'inherit',
      value: common.mixed ? '' : common.value,
      onChange: function(value) {
        if (editor === 'number') {
          value = diagramNumber(value, items[0][key]);
          if (key === 'width') value = Math.max(40, value);
          if (key === 'height') value = Math.max(30, value);
          if (key === 'fontSize') value = normalizeDiagramFontSize(value);
        }
        items.forEach(function(item) {
          item[key] = value;
        });
        self._renderCanvas();
        self._commit('change', {
          itemType: 'node',
          items: items
        });
      }
    }, options || {}));
    this._propertyEditors.push(control);
  };

  Diagram.prototype._renderPaperProperties = function() {
    var title = document.createElement('div');
    title.className = 'fui-diagram-property-section-title';
    title.textContent = this.messages.paperSettings;
    this.propertiesBodyElement.appendChild(title);
    this._paperPropertyField(
      this.messages.paperSize,
      'size',
      'combo',
      {
        editable: false,
        limitToList: true,
        data: Object.keys(DIAGRAM_PAPER_SIZES).map(function(size) {
          return { value: size, text: size };
        })
      }
    );
    this._paperPropertyField(
      this.messages.paperOrientation,
      'orientation',
      'combo',
      {
        editable: false,
        limitToList: true,
        data: [
          { value: 'landscape', text: this.messages.landscape },
          { value: 'portrait', text: this.messages.portrait }
        ]
      }
    );
    this._paperPropertyField(
      this.messages.snapSize,
      'gridSize',
      'number',
      { min: 5, precision: 0 }
    );
  };

  Diagram.prototype._propertyTextStyle = function(item) {
    var self = this;
    var items = Array.isArray(item) ? item : [item];
    var field = document.createElement('div');
    var caption = document.createElement('span');
    var controls = document.createElement('div');
    var styles = [
      { key: 'fontBold', text: 'B', label: this.messages.bold },
      { key: 'fontItalic', text: 'I', label: this.messages.italic },
      { key: 'fontUnderline', text: 'U', label: this.messages.underline },
      { key: 'fontStrikethrough', text: 'S', label: this.messages.strikethrough }
    ];
    field.className = 'fui-diagram-property-text-style';
    caption.className = 'fui-diagram-property-label';
    controls.className = 'fui-diagram-property-text-style-buttons';
    caption.textContent = this.messages.textStyle;
    field.appendChild(caption);
    field.appendChild(controls);
    this.propertiesBodyElement.appendChild(field);
    styles.forEach(function(style) {
      var host = document.createElement('a');
      var control;
      host.setAttribute('title', style.label);
      host.setAttribute('aria-label', style.label);
      host.setAttribute('data-diagram-text-style', style.key);
      controls.appendChild(host);
      control = new Button(host, {
        text: style.text,
        width: '100%',
        height: 30,
        toggle: true,
        selected: items.every(function(target) {
          return target[style.key] === true;
        }),
        outline: true,
        theme: 'inherit',
        onClick: function(button, event) {
          items.forEach(function(target) {
            target[style.key] = event.selected === true;
          });
          self._renderCanvas();
          self._commit('change', {
            itemType: items.length > 1 ? 'node' : self._selected.type,
            item: items.length === 1 ? items[0] : null,
            items: items
          });
        }
      });
      self._propertyEditors.push(control);
    });
  };

  Diagram.prototype._renderMultiProperties = function(items) {
    var title = document.createElement('div');
    var sizeFields = document.createElement('div');
    title.className = 'fui-diagram-property-section-title';
    title.textContent = this.messages.multipleSelection.replace(
      '{0}',
      String(items.length)
    );
    this.propertiesBodyElement.appendChild(title);
    this._multiPropertyField(
      this.messages.fontSize,
      items,
      'fontSize',
      'number',
      { precision: 0, min: 8, max: 96 }
    );
    this._propertyTextStyle(items);
    sizeFields.className = 'fui-diagram-property-pair';
    this.propertiesBodyElement.appendChild(sizeFields);
    this._multiPropertyField(
      this.messages.width,
      items,
      'width',
      'number',
      { precision: 0, min: 40 },
      sizeFields
    );
    this._multiPropertyField(
      this.messages.height,
      items,
      'height',
      'number',
      { precision: 0, min: 30 },
      sizeFields
    );
    this._multiPropertyField(this.messages.fill, items, 'fill', 'color');
    this._multiPropertyField(this.messages.stroke, items, 'stroke', 'color');
  };

  Diagram.prototype._renderProperties = function() {
    var item;
    var positionFields;
    var selectedNodes;
    var sizeFields;
    this._disposePropertyEditors();
    this.propertiesBodyElement.textContent = '';
    if (!this._selected) {
      this._renderPaperProperties();
      return;
    }
    if (this._selected.type === 'node' && this._selectedNodeIds.length > 1) {
      selectedNodes = this._selectedNodeIds.map(
        this.getNode.bind(this)
      ).filter(Boolean);
      this._renderMultiProperties(selectedNodes);
      return;
    }
    item = this._selected.type === 'node' ?
      this.getNode(this._selected.id) :
      this.getConnector(this._selected.id);
    if (!item) {
      this._renderPaperProperties();
      return;
    }
    this._propertyField(this.messages.text, item, 'text', 'text');
    this._propertyField(
      this.messages.fontSize,
      item,
      'fontSize',
      'number',
      { precision: 0, min: 8, max: 96 }
    );
    this._propertyTextStyle(item);
    if (this._selected.type === 'node') {
      this._propertyField(
        this.messages.hyperlink,
        item,
        'hyperlink',
        'text'
      );
      this._propertyField(
        this.messages.hyperlinkTrigger,
        item,
        'hyperlinkTrigger',
        'combo',
        {
          editable: false,
          limitToList: true,
          data: [
            {
              value: 'click',
              text: this.messages.hyperlinkSingleClick
            },
            {
              value: 'dblclick',
              text: this.messages.hyperlinkDoubleClick
            }
          ]
        }
      );
      positionFields = document.createElement('div');
      positionFields.className = 'fui-diagram-property-pair';
      this.propertiesBodyElement.appendChild(positionFields);
      this._propertyField(
        this.messages.x,
        item,
        'x',
        'number',
        { precision: 0 },
        positionFields
      );
      this._propertyField(
        this.messages.y,
        item,
        'y',
        'number',
        { precision: 0 },
        positionFields
      );
      sizeFields = document.createElement('div');
      sizeFields.className = 'fui-diagram-property-pair';
      this.propertiesBodyElement.appendChild(sizeFields);
      this._propertyField(
        this.messages.width,
        item,
        'width',
        'number',
        { precision: 0, min: 40 },
        sizeFields
      );
      this._propertyField(
        this.messages.height,
        item,
        'height',
        'number',
        { precision: 0, min: 30 },
        sizeFields
      );
      this._propertyField(this.messages.fill, item, 'fill', 'color');
      this._propertyField(this.messages.stroke, item, 'stroke', 'color');
    } else {
      this._propertyField(this.messages.stroke, item, 'stroke', 'color');
      this._propertyField(this.messages.lineStyle, item, 'lineStyle', 'combo', {
        editable: false,
        limitToList: true,
        data: [
          { value: 'solid', text: this.messages.solid },
          { value: 'dashed', text: this.messages.dashed }
        ]
      });
      this._propertyField(
        this.messages.arrowDirection,
        item,
        'arrowDirection',
        'combo',
        {
          editable: false,
          limitToList: true,
          data: [
            { value: 'none', text: this.messages.arrowNone },
            { value: 'end', text: this.messages.arrowEnd },
            { value: 'start', text: this.messages.arrowStart },
            { value: 'both', text: this.messages.arrowBoth }
          ]
        }
      );
    }
  };

  Diagram.prototype._syncToolbarStates = function() {
    var undo = this._toolbarButtons.undo;
    var redo = this._toolbarButtons.redo;
    var remove = this._toolbarButtons.delete;
    var clear = this._toolbarButtons.clear;
    var load = this._toolbarButtons.load;
    var connect = this._toolbarButtons.connect;
    var connectTypes = [{
      button: this._toolbarButtons.connectStraight,
      type: 'straight'
    }, {
      button: this._toolbarButtons.connectOrthogonal,
      type: 'orthogonal'
    }, {
      button: this._toolbarButtons.connectCurved,
      type: 'curved'
    }, {
      button: this._toolbarButtons.connectSCurve,
      type: 'sCurve'
    }];
    var toolbox = this._toolbarButtons.toolbox;
    var properties = this._toolbarButtons.properties;
    var readOnlyButton = this._toolbarButtons.readOnly;
    var grid = this._toolbarButtons.grid;
    var fullscreen = this._toolbarButtons.fullscreen;
    var presentation = this._toolbarButtons.presentation;
    var fullscreenText;
    var presentationText;
    var editingDisabled = this.options.disabled || this.options.readOnly;
    if (undo) {
      if (!editingDisabled && this.canUndo()) undo.enable();
      else undo.disable();
    }
    if (redo) {
      if (!editingDisabled && this.canRedo()) redo.enable();
      else redo.disable();
    }
    if (remove) {
      if (!editingDisabled && this._selected) remove.enable();
      else remove.disable();
    }
    if (clear) {
      if (
        !editingDisabled &&
        (this._data.nodes.length || this._data.connectors.length)
      ) clear.enable();
      else clear.disable();
    }
    if (load) {
      if (editingDisabled) load.disable();
      else load.enable();
    }
    if (connect) {
      if (editingDisabled) connect.disable();
      else connect.enable();
      if (this._connectMode) connect.select(true);
      else connect.unselect(true);
    }
    connectTypes.forEach(function(item) {
      if (!item.button) return;
      if (editingDisabled) item.button.disable();
      else item.button.enable();
      if (item.type === this._connectType) item.button.select(true);
      else item.button.unselect(true);
    }, this);
    if (toolbox) {
      if (editingDisabled) toolbox.disable();
      else toolbox.enable();
      if (this.options.toolbox && !this.options.readOnly) toolbox.select(true);
      else toolbox.unselect(true);
    }
    if (properties) {
      if (editingDisabled) properties.disable();
      else properties.enable();
      if (this.options.propertiesPanel && !this.options.readOnly) {
        properties.select(true);
      }
      else properties.unselect(true);
    }
    if (readOnlyButton) {
      if (this.options.disabled) readOnlyButton.disable();
      else readOnlyButton.enable();
      if (this.options.readOnly) readOnlyButton.select(true);
      else readOnlyButton.unselect(true);
    }
    if (grid) {
      if (this.options.showGrid) grid.select(true);
      else grid.unselect(true);
    }
    if (this.zoomLabelElement) {
      this.zoomLabelElement.textContent = Math.round(this.options.zoomLevel * 100) + '%';
    }
    if (fullscreen) {
      fullscreenText = diagramElementIsFullscreen(this.hostElement) ?
        this.messages.exitFullscreen :
        this.messages.fullscreen;
      fullscreen.setText('');
      fullscreen.hostElement.title = fullscreenText;
      fullscreen.hostElement.setAttribute('aria-label', fullscreenText);
    }
    if (presentation) {
      presentationText = diagramElementIsFullscreen(this.viewportElement) ?
        this.messages.exitPresentation :
        this.messages.presentation;
      presentation.setText('');
      presentation.hostElement.title = presentationText;
      presentation.hostElement.setAttribute('aria-label', presentationText);
    }
    if (this._contextMenu) {
      this._contextMenu.setText({
        target: this._contextMenu.findItem('fullscreen').target,
        text: diagramElementIsFullscreen(this.viewportElement) ?
          this.messages.exitPresentation :
          this.messages.presentation
      });
    }
  };

  Diagram.prototype._resetHistory = function() {
    this._history = [diagramClone(this._data)];
    this._historyIndex = 0;
    this.hasChanges = false;
  };

  Diagram.prototype._commit = function(action, detail) {
    this._history = this._history.slice(0, this._historyIndex + 1);
    this._history.push(diagramClone(this._data));
    this._historyIndex = this._history.length - 1;
    this.hasChanges = true;
    this._saveToolboxState();
    this._syncToolbarStates();
    this._fire('Changed', diagramAssign({
      action: action,
      data: this.getData()
    }, detail || {}));
  };

  Diagram.prototype._fire = function(name, detail) {
    var callback = this.options['on' + name];
    var listeners = (this._listeners[name.toLowerCase()] || []).slice();
    var eventDetail = diagramAssign({ diagram: this }, detail || {});
    if (typeof callback === 'function') {
      callback.call(this.hostElement, this, eventDetail);
    }
    listeners.forEach(function(listener) {
      listener.call(this, eventDetail);
    }, this);
  };

  Diagram.prototype.render = function() {
    this._renderCanvas();
    this._renderProperties();
    this._syncToolbarStates();
    return this;
  };

  Diagram.prototype.getData = function() {
    var data = diagramClone(this._data);
    data.page = this.getPaper();
    return data;
  };

  Diagram.prototype.setData = function(data, preserveHistory) {
    var page = data && data.page;
    var dimensions;
    this._closeInlineTextEditor(false);
    if (page) {
      this.options.paperSize = normalizeDiagramPaperSize(page.size);
      this.options.paperOrientation = normalizeDiagramPaperOrientation(
        page.orientation
      );
      dimensions = getDiagramPaperDimensions(
        this.options.paperSize,
        this.options.paperOrientation
      );
      this.options.pageWidth = Math.max(
        300,
        diagramNumber(page.width, dimensions.width)
      );
      this.options.pageHeight = Math.max(
        240,
        diagramNumber(page.height, dimensions.height)
      );
      if (page.color != null) {
        this.options.pageColor = String(page.color);
      }
      if (page.gridSize != null) {
        this.options.gridSize = Math.max(
          5,
          diagramNumber(page.gridSize, this.options.gridSize)
        );
      }
    }
    this._data = normalizeDiagramData(data);
    this.options.nodes = this._data.nodes;
    this.options.connectors = this._data.connectors;
    this._selected = null;
    this._selectedNodeIds = [];
    this._connectSourceId = '';
    if (!preserveHistory) this._resetHistory();
    this.render();
    this._saveToolboxState();
    return this;
  };

  Diagram.prototype.getNode = function(id) {
    id = String(id == null ? '' : id);
    return this._data.nodes.find(function(node) {
      return node.id === id;
    }) || null;
  };

  Diagram.prototype.getConnector = function(id) {
    id = String(id == null ? '' : id);
    return this._data.connectors.find(function(connector) {
      return connector.id === id;
    }) || null;
  };

  Diagram.prototype.addNode = function(node) {
    var viewportRect;
    var normalized;
    node = diagramAssign({}, node || {});
    if (node.x == null || node.y == null) {
      viewportRect = {
        x: this.viewportElement.scrollLeft / this.options.zoomLevel +
          this.viewportElement.clientWidth / this.options.zoomLevel / 2,
        y: this.viewportElement.scrollTop / this.options.zoomLevel +
          this.viewportElement.clientHeight / this.options.zoomLevel / 2
      };
      if (node.x == null) node.x = viewportRect.x - 70;
      if (node.y == null) node.y = viewportRect.y - 36;
    }
    node.x = this._snap(node.x);
    node.y = this._snap(node.y);
    normalized = normalizeDiagramNode(node, this._data.nodes.length);
    this._data.nodes.push(normalized);
    this.selectItem('node', normalized.id, true);
    this._commit('add', { itemType: 'node', item: normalized });
    this.render();
    return normalized;
  };

  Diagram.prototype.addConnector = function(connector) {
    var normalized = normalizeDiagramConnector(connector, this._data.connectors.length);
    if (
      !this.getNode(normalized.from) ||
      !this.getNode(normalized.to) ||
      normalized.from === normalized.to
    ) return null;
    delete normalized._index;
    this._data.connectors.push(normalized);
    this.selectItem('connector', normalized.id, true);
    this._commit('add', { itemType: 'connector', item: normalized });
    this.render();
    return normalized;
  };

  Diagram.prototype.removeSelected = function() {
    var selected = this._selected;
    var removed;
    var removedIds;
    var removedItems;
    if (!selected || this.options.readOnly) return this;
    this._closeInlineTextEditor(false);
    if (selected.type === 'node') {
      removed = this.getNode(selected.id);
      removedIds = this._selectedNodeIds.slice();
      removedItems = removedIds.map(this.getNode.bind(this)).filter(Boolean);
      this._data.nodes = this._data.nodes.filter(function(node) {
        return removedIds.indexOf(node.id) < 0;
      });
      this._data.connectors = this._data.connectors.filter(function(connector) {
        return removedIds.indexOf(connector.from) < 0 &&
          removedIds.indexOf(connector.to) < 0;
      });
    } else {
      removed = this.getConnector(selected.id);
      this._data.connectors = this._data.connectors.filter(function(connector) {
        return connector.id !== selected.id;
      });
    }
    this._selected = null;
    this._selectedNodeIds = [];
    this._commit('remove', {
      itemType: selected.type,
      item: removed,
      items: removedItems || (removed ? [removed] : [])
    });
    this.render();
    return this;
  };

  Diagram.prototype.clearPage = function() {
    if (
      this.options.readOnly ||
      (!this._data.nodes.length && !this._data.connectors.length)
    ) return this;
    this._closeInlineTextEditor(false);
    this._data = {
      nodes: [],
      connectors: []
    };
    this._selected = null;
    this._selectedNodeIds = [];
    this._connectMode = false;
    this._connectSourceId = '';
    this.hostElement.classList.remove('fui-diagram-connect-mode');
    this._commit('clear', {
      itemType: 'page'
    });
    this.render();
    return this;
  };

  Diagram.prototype.selectItem = function(type, id, silent) {
    var item = type === 'node' ? this.getNode(id) : this.getConnector(id);
    if (!item) return this;
    if (type === 'node') {
      if (
        this._selectedNodeIds.length === 1 &&
        this._selectedNodeIds[0] === String(id)
      ) return this;
      return this._setNodeSelection([id], id, silent);
    }
    if (
      this._selected &&
      this._selected.type === type &&
      this._selected.id === String(id)
    ) return this;
    this._selectedNodeIds = [];
    this._selected = { type: type, id: String(id) };
    this._renderCanvas();
    this._renderProperties();
    if (!silent) this._fireSelectionChanged();
    return this;
  };

  Diagram.prototype.clearSelection = function() {
    if (!this._selected && !this._selectedNodeIds.length) return this;
    this._selected = null;
    this._selectedNodeIds = [];
    this._renderCanvas();
    this._renderProperties();
    this._fireSelectionChanged();
    return this;
  };

  Diagram.prototype.getSelection = function() {
    return this._selected ? diagramAssign({}, this._selected) : null;
  };

  Diagram.prototype.getSelections = function() {
    if (this._selectedNodeIds.length) {
      return this._selectedNodeIds.map(function(id) {
        return { type: 'node', id: id };
      });
    }
    return this._selected ? [diagramAssign({}, this._selected)] : [];
  };

  Diagram.prototype.setConnectMode = function(enabled, type) {
    var connectorTools;
    var index;
    if (type != null) {
      this._connectType = ['straight', 'curved', 'sCurve'].indexOf(type) >= 0 ?
        type :
        'orthogonal';
    }
    this._connectMode = Boolean(enabled) && !this.options.readOnly;
    if (!this._connectMode) this._connectSourceId = '';
    this.hostElement.classList.toggle('fui-diagram-connect-mode', this._connectMode);
    connectorTools = this.toolboxGroupsElement.querySelectorAll(
      '[data-diagram-connector-tool]'
    );
    for (index = 0; index < connectorTools.length; index += 1) {
      connectorTools[index].classList.toggle(
        'fui-diagram-shape-item-selected',
        this._connectMode &&
        connectorTools[index].getAttribute('data-diagram-connector-tool') ===
          this._connectType
      );
      connectorTools[index].setAttribute(
        'aria-pressed',
        this._connectMode &&
        connectorTools[index].getAttribute('data-diagram-connector-tool') ===
          this._connectType ?
          'true' :
          'false'
      );
    }
    this._renderCanvas();
    this._syncToolbarStates();
    return this;
  };

  Diagram.prototype.canUndo = function() {
    return this._historyIndex > 0;
  };

  Diagram.prototype.canRedo = function() {
    return this._historyIndex < this._history.length - 1;
  };

  Diagram.prototype.undo = function() {
    if (!this.canUndo()) return this;
    this._closeInlineTextEditor(false);
    this._historyIndex -= 1;
    this._data = diagramClone(this._history[this._historyIndex]);
    this._selected = null;
    this._selectedNodeIds = [];
    this.hasChanges = this._historyIndex !== 0;
    this._saveToolboxState();
    this.render();
    this._fire('Changed', { action: 'undo', data: this.getData() });
    return this;
  };

  Diagram.prototype.redo = function() {
    if (!this.canRedo()) return this;
    this._closeInlineTextEditor(false);
    this._historyIndex += 1;
    this._data = diagramClone(this._history[this._historyIndex]);
    this._selected = null;
    this._selectedNodeIds = [];
    this.hasChanges = true;
    this._saveToolboxState();
    this.render();
    this._fire('Changed', { action: 'redo', data: this.getData() });
    return this;
  };

  Diagram.prototype.setZoom = function(value) {
    var oldZoom = this.options.zoomLevel;
    var centerX = (this.viewportElement.scrollLeft + this.viewportElement.clientWidth / 2) / oldZoom;
    var centerY = (this.viewportElement.scrollTop + this.viewportElement.clientHeight / 2) / oldZoom;
    this.options.zoomLevel = diagramClamp(
      diagramNumber(value, oldZoom),
      this.options.minZoom,
      this.options.maxZoom
    );
    this._renderCanvas();
    this.viewportElement.scrollLeft =
      centerX * this.options.zoomLevel - this.viewportElement.clientWidth / 2;
    this.viewportElement.scrollTop =
      centerY * this.options.zoomLevel - this.viewportElement.clientHeight / 2;
    return this;
  };

  Diagram.prototype._setZoomAtPoint = function(value, clientX, clientY) {
    var viewportRect = this.viewportElement.getBoundingClientRect();
    var svgRect = this.svgElement.getBoundingClientRect();
    var oldZoom = this.options.zoomLevel;
    var oldOffset = calculateDiagramViewportOffset(
      viewportRect,
      svgRect,
      this.viewportElement.scrollLeft,
      this.viewportElement.scrollTop,
      this.viewportElement.clientLeft,
      this.viewportElement.clientTop
    );
    var anchorX = diagramNumber(clientX, viewportRect.left) -
      viewportRect.left -
      this.viewportElement.clientLeft;
    var anchorY = diagramNumber(clientY, viewportRect.top) -
      viewportRect.top -
      this.viewportElement.clientTop;
    var nextOffset;
    this.options.zoomLevel = diagramClamp(
      diagramNumber(value, oldZoom),
      this.options.minZoom,
      this.options.maxZoom
    );
    if (this.options.zoomLevel === oldZoom) return this;
    this._renderCanvas();
    viewportRect = this.viewportElement.getBoundingClientRect();
    svgRect = this.svgElement.getBoundingClientRect();
    nextOffset = calculateDiagramViewportOffset(
      viewportRect,
      svgRect,
      this.viewportElement.scrollLeft,
      this.viewportElement.scrollTop,
      this.viewportElement.clientLeft,
      this.viewportElement.clientTop
    );
    this.viewportElement.scrollLeft = calculateDiagramAnchoredScroll(
      this.viewportElement.scrollLeft,
      anchorX,
      oldOffset.x,
      oldZoom,
      nextOffset.x,
      this.options.zoomLevel
    );
    this.viewportElement.scrollTop = calculateDiagramAnchoredScroll(
      this.viewportElement.scrollTop,
      anchorY,
      oldOffset.y,
      oldZoom,
      nextOffset.y,
      this.options.zoomLevel
    );
    this._positionInlineTextEditor();
    return this;
  };

  Diagram.prototype.fitToContent = function() {
    var bounds;
    var padding = 80;
    var width;
    var height;
    var zoom;
    if (!this._data.nodes.length) return this.setZoom(1);
    bounds = this._data.nodes.reduce(function(result, node) {
      result.left = Math.min(result.left, node.x);
      result.top = Math.min(result.top, node.y);
      result.right = Math.max(result.right, node.x + node.width);
      result.bottom = Math.max(result.bottom, node.y + node.height);
      return result;
    }, {
      left: Infinity,
      top: Infinity,
      right: -Infinity,
      bottom: -Infinity
    });
    width = bounds.right - bounds.left + padding * 2;
    height = bounds.bottom - bounds.top + padding * 2;
    zoom = Math.min(
      this.viewportElement.clientWidth / width,
      this.viewportElement.clientHeight / height
    );
    this.setZoom(zoom);
    this.viewportElement.scrollLeft = Math.max(
      0,
      (bounds.left - padding) * this.options.zoomLevel
    );
    this.viewportElement.scrollTop = Math.max(
      0,
      (bounds.top - padding) * this.options.zoomLevel
    );
    return this;
  };

  Diagram.prototype.fitToPage = function(padding) {
    var zoom;
    padding = Math.max(0, diagramNumber(padding, 12));
    zoom = calculateDiagramPageZoom(
      this.viewportElement.clientWidth,
      this.viewportElement.clientHeight,
      this.options.pageWidth,
      this.options.pageHeight,
      padding,
      this.options.minZoom,
      this.options.maxZoom
    );
    this.setZoom(zoom);
    this.viewportElement.scrollLeft = 0;
    this.viewportElement.scrollTop = 0;
    return this;
  };

  Diagram.prototype.setShowGrid = function(value) {
    this.options.showGrid = diagramBoolean(value, true);
    this._renderCanvas();
    return this;
  };

  Diagram.prototype.getPaper = function() {
    return {
      size: this.options.paperSize,
      orientation: this.options.paperOrientation,
      width: this.options.pageWidth,
      height: this.options.pageHeight,
      color: this.options.pageColor,
      gridSize: this.options.gridSize
    };
  };

  Diagram.prototype.setPaper = function(size, orientation, gridSize) {
    var dimensions;
    var changed;
    size = normalizeDiagramPaperSize(size);
    orientation = normalizeDiagramPaperOrientation(orientation);
    gridSize = gridSize == null ?
      this.options.gridSize :
      Math.max(5, diagramNumber(gridSize, this.options.gridSize));
    dimensions = getDiagramPaperDimensions(size, orientation);
    changed = this.options.paperSize !== size ||
      this.options.paperOrientation !== orientation ||
      this.options.pageWidth !== dimensions.width ||
      this.options.pageHeight !== dimensions.height ||
      this.options.gridSize !== gridSize;
    this.options.paperSize = size;
    this.options.paperOrientation = orientation;
    this.options.pageWidth = dimensions.width;
    this.options.pageHeight = dimensions.height;
    this.options.gridSize = gridSize;
    this.render();
    if (changed) {
      this.hasChanges = true;
      this._saveToolboxState();
      this._fire('Changed', {
        action: 'pageChange',
        itemType: 'page',
        item: this.getPaper(),
        data: this.getData()
      });
    }
    return this;
  };

  Diagram.prototype.toggleFullscreen = function() {
    var exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
    var requestFullscreen = this.hostElement.requestFullscreen ||
      this.hostElement.webkitRequestFullscreen;
    if (diagramElementIsFullscreen(this.hostElement)) {
      if (exitFullscreen) exitFullscreen.call(document);
    } else if (requestFullscreen) {
      requestFullscreen.call(this.hostElement);
    }
    return this;
  };

  Diagram.prototype.togglePresentationFullscreen = function() {
    var exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
    var requestFullscreen = this.viewportElement.requestFullscreen ||
      this.viewportElement.webkitRequestFullscreen;
    if (diagramElementIsFullscreen(this.viewportElement)) {
      if (exitFullscreen) exitFullscreen.call(document);
    } else if (requestFullscreen) {
      requestFullscreen.call(this.viewportElement);
    }
    return this;
  };

  Diagram.prototype.loadJsonFile = function() {
    if (
      this.options.disabled ||
      this.options.readOnly ||
      !this.jsonFileInputElement
    ) return this;
    this.jsonFileInputElement.click();
    return this;
  };

  Diagram.prototype._openNodeHyperlink = function(node) {
    var url = normalizeDiagramHyperlink(node && node.hyperlink);
    var opened;
    if (!url || this.options.disabled) return false;
    if (/^javascript:/i.test(url)) {
      window.location.href = url;
    } else {
      opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (opened) opened.opener = null;
    }
    this._fire('HyperlinkClick', {
      itemType: 'node',
      item: node,
      url: url
    });
    return true;
  };

  Diagram.prototype.import = function(source) {
    var data = typeof source === 'string' ? JSON.parse(source) : source;
    return this.setData(data);
  };

  Diagram.prototype.export = function(filename) {
    var json = JSON.stringify(this.getData(), null, 2);
    if (filename) {
      diagramDownloadBlob(
        new Blob([json], { type: 'application/json;charset=utf-8' }),
        filename
      );
    }
    return json;
  };

  Diagram.prototype._serializeSvg = function(includeGrid) {
    var clone = this.svgElement.cloneNode(true);
    var gridPattern = clone.querySelector(
      'pattern[id^="fui-diagram-grid-"]'
    );
    var page = clone.querySelector('.fui-diagram-page');
    var selection = clone.querySelector('.fui-diagram-selection');
    var serializer = new XMLSerializer();
    clone.setAttribute('xmlns', DIAGRAM_SVG_NS);
    clone.style.width = this.options.pageWidth + 'px';
    clone.style.height = this.options.pageHeight + 'px';
    if (!includeGrid) {
      if (page) page.setAttribute('fill', this.options.pageColor);
      if (gridPattern) gridPattern.parentNode.removeChild(gridPattern);
    }
    if (selection) selection.parentNode.removeChild(selection);
    return serializer.serializeToString(clone);
  };

  Diagram.prototype.getSvg = function() {
    return this._serializeSvg(true);
  };

  Diagram.prototype.exportSvg = function(filename) {
    var svg = this.getSvg();
    if (filename) {
      diagramDownloadBlob(
        new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }),
        filename
      );
    }
    return svg;
  };

  Diagram.prototype.exportPng = function(filename, scale) {
    var self = this;
    var svg = this.getSvg();
    scale = diagramClamp(diagramNumber(scale, 2), 0.25, 4);
    return new Promise(function(resolve, reject) {
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      var image = new Image();
      var url = URL.createObjectURL(
        new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
      );
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas 2D context is unavailable.'));
        return;
      }
      canvas.width = Math.max(1, Math.round(self.options.pageWidth * scale));
      canvas.height = Math.max(1, Math.round(self.options.pageHeight * scale));
      image.onload = function() {
        URL.revokeObjectURL(url);
        context.fillStyle = self.options.pageColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function(blob) {
          if (!blob) {
            reject(new Error('Unable to export Diagram as PNG.'));
            return;
          }
          if (filename) diagramDownloadBlob(blob, filename);
          resolve(blob);
        }, 'image/png');
      };
      image.onerror = function() {
        URL.revokeObjectURL(url);
        reject(new Error('Unable to render Diagram SVG for PNG export.'));
      };
      image.src = url;
    });
  };

  Diagram.prototype.print = function() {
    var frame = document.createElement('iframe');
    var frameDocument;
    var frameWindow;
    var cleanupTimer;
    var cleaned = false;
    var pageRule;
    var svg;

    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      clearTimeout(cleanupTimer);
      if (frame.parentNode) frame.parentNode.removeChild(frame);
    }

    frame.className = 'fui-diagram-print-frame';
    frame.title = this.messages.print;
    frame.setAttribute('aria-hidden', 'true');
    document.body.appendChild(frame);
    frameWindow = frame.contentWindow;
    frameDocument = frame.contentDocument || (
      frameWindow ? frameWindow.document : null
    );
    if (!frameWindow || !frameDocument) {
      cleanup();
      return false;
    }

    svg = this._serializeSvg(false);
    pageRule = this.options.paperSize + ' ' + this.options.paperOrientation;
    frameDocument.open();
    frameDocument.write(
      '<!doctype html><html><head><meta charset="utf-8">' +
      '<title>' + this.messages.diagram + '</title>' +
      '<style>@page{size:' + pageRule + ';margin:0}' +
      'html,body{box-sizing:border-box;width:100%;height:100%;' +
      'margin:0;overflow:hidden}' +
      'html{padding:0}' +
      'body{display:flex;padding:12mm;align-items:center;' +
      'justify-content:center}' +
      'svg{display:block;width:100%!important;height:100%!important;' +
      'max-width:100%;max-height:100%;break-inside:avoid;' +
      'page-break-inside:avoid}</style></head><body>' +
      svg +
      '</body></html>'
    );
    frameDocument.close();
    frameWindow.addEventListener('afterprint', cleanup, { once: true });
    cleanupTimer = setTimeout(cleanup, 60000);
    setTimeout(function() {
      frameWindow.focus();
      frameWindow.print();
    }, 0);
    return true;
  };

  Diagram.prototype.setLocale = function(locale) {
    this.options.locale = normalizeDiagramLocale(locale);
    this.messages = localePacks[this.options.locale];
    this.hostElement.setAttribute(
      'aria-label',
      this.options.ariaLabel || this.messages.diagram
    );
    this.toolboxHeaderElement.textContent = this.messages.toolbox;
    this.toolboxHeaderElement.setAttribute(
      'title',
      this.messages.dragToolbox
    );
    this.propertiesHeaderElement.setAttribute(
      'title',
      this.messages.dragProperties
    );
    this.viewToolbarElement.setAttribute(
      'title',
      this.messages.dragViewToolbar
    );
    this.viewToolbarElement.setAttribute(
      'aria-label',
      this.messages.dragViewToolbar
    );
    [
      this.toolboxResizerLeftElement,
      this.toolboxResizerRightElement
    ].forEach(function(element) {
      element.setAttribute('aria-label', this.messages.resizeToolbox);
    }, this);
    [
      this.toolboxResizerTopElement,
      this.toolboxResizerBottomElement
    ].forEach(function(element) {
      element.setAttribute('aria-label', this.messages.resizeToolboxHeight);
    }, this);
    [
      this.propertiesResizerLeftElement,
      this.propertiesResizerRightElement
    ].forEach(function(element) {
      element.setAttribute('aria-label', this.messages.resizeProperties);
    }, this);
    [
      this.propertiesResizerTopElement,
      this.propertiesResizerBottomElement
    ].forEach(function(element) {
      element.setAttribute(
        'aria-label',
        this.messages.resizePropertiesHeight
      );
    }, this);
    this.propertiesHeaderElement.textContent = this.messages.properties;
    if (this._dockTabs) {
      this._dockTabs.setLocale(this.options.locale);
      this._dockTabs.update(0, { title: this.messages.toolbox });
      this._dockTabs.update(1, { title: this.messages.properties });
    }
    if (this.toolboxSearchControl) {
      this.toolboxSearchControl.textbox().setAttribute(
        'placeholder',
        this.messages.searchShapes
      );
    }
    this._renderToolbox();
    if (this._toolbarButtons.delete) this._toolbarButtons.delete.setText(this.messages.deleteItem);
    if (this._toolbarButtons.clear) this._toolbarButtons.clear.setText(this.messages.clearPage);
    if (this._toolbarButtons.download) {
      this._toolbarButtons.download.setText(this.messages.downloadJson);
    }
    if (this._toolbarButtons.load) {
      this._toolbarButtons.load.setText(this.messages.loadJson);
    }
    if (this._toolbarButtons.exportPng) {
      this._toolbarButtons.exportPng.setText(this.messages.exportPng);
    }
    if (this._toolbarButtons.exportSvg) {
      this._toolbarButtons.exportSvg.setText(this.messages.exportSvg);
    }
    if (this._toolbarButtons.print) {
      this._toolbarButtons.print.setText(this.messages.print);
    }
    if (this._toolbarButtons.connect) this._toolbarButtons.connect.setText(this.messages.connect);
    [{
      button: this._toolbarButtons.connectStraight,
      text: this.messages.connectStraight
    }, {
      button: this._toolbarButtons.connectOrthogonal,
      text: this.messages.connectOrthogonal
    }, {
      button: this._toolbarButtons.connectCurved,
      text: this.messages.connectCurved
    }, {
      button: this._toolbarButtons.connectSCurve,
      text: this.messages.connectSCurve
    }].forEach(function(item) {
      if (!item.button) return;
      item.button.hostElement.title = item.text;
      item.button.hostElement.setAttribute('aria-label', item.text);
    });
    if (this._toolbarButtons.toolbox) {
      this._toolbarButtons.toolbox.setText(this.messages.toolbox);
    }
    if (this._toolbarButtons.properties) this._toolbarButtons.properties.setText(this.messages.properties);
    if (this._toolbarButtons.readOnly) {
      this._toolbarButtons.readOnly.setText(this.messages.readOnly);
    }
    if (this._toolbarButtons.fit) this._toolbarButtons.fit.setText(this.messages.fit);
    if (this._toolbarButtons.grid) this._toolbarButtons.grid.setText(this.messages.grid);
    if (this._toolbarButtons.undo) {
      this._toolbarButtons.undo.hostElement.title = this.messages.undo;
      this._toolbarButtons.undo.hostElement.setAttribute(
        'aria-label',
        this.messages.undo
      );
    }
    if (this._toolbarButtons.redo) {
      this._toolbarButtons.redo.hostElement.title = this.messages.redo;
      this._toolbarButtons.redo.hostElement.setAttribute(
        'aria-label',
        this.messages.redo
      );
    }
    if (this._contextMenu) {
      this._contextMenu.setLocale(this.options.locale);
      this._contextMenu.hostElement.setAttribute(
        'aria-label',
        this.messages.diagram
      );
      this._contextMenu.setText({
        target: this._contextMenu.findItem('exportPng').target,
        text: this.messages.exportPng
      });
      this._contextMenu.setText({
        target: this._contextMenu.findItem('exportSvg').target,
        text: this.messages.exportSvg
      });
      this._contextMenu.setText({
        target: this._contextMenu.findItem('print').target,
        text: this.messages.print
      });
      this._contextMenu.setText({
        target: this._contextMenu.findItem('fullscreen').target,
        text: diagramElementIsFullscreen(this.viewportElement) ?
          this.messages.exitPresentation :
          this.messages.presentation
      });
    }
    this._renderProperties();
    this._syncToolbarStates();
    return this;
  };

  Diagram.prototype.setTheme = function(theme) {
    var index;
    this.options.theme = theme == null ? 'inherit' : theme;
    this.theme = this.options.theme === 'inherit' ?
      findDiagramTheme(this._themeSource) :
      normalizeDiagramTheme(this.options.theme);
    for (index = 0; index < DIAGRAM_THEMES.length; index += 1) {
      this.hostElement.classList.remove('fg-theme-' + DIAGRAM_THEMES[index]);
    }
    this.hostElement.classList.add('fg-theme-' + this.theme);
    this._buttonControls.forEach(function(control) {
      control.setTheme('inherit');
    });
    if (this._contextMenu) this._contextMenu.setTheme('inherit');
    if (this._dockTabs) this._dockTabs.setTheme('inherit');
    this._editBoxControls.concat(this._propertyEditors).forEach(function(control) {
      if (control._control && typeof control._control.setTheme === 'function') {
        control.setTheme('inherit');
      }
    });
    return this;
  };

  Diagram.prototype.setReadOnly = function(value) {
    var nextValue = diagramBoolean(value, false);
    var changed = this.options.readOnly !== nextValue;
    this.options.readOnly = nextValue;
    this.hostElement.setAttribute(
      'aria-readonly',
      this.options.readOnly ? 'true' : 'false'
    );
    if (this.options.readOnly) this._closeInlineTextEditor(false);
    this.setConnectMode(false);
    this._syncStructure();
    this.render();
    if (changed) {
      this._fire('ReadOnlyChanged', {
        readOnly: this.options.readOnly
      });
    }
    return this;
  };

  Diagram.prototype.getSameSideDockMode = function() {
    return this.options.sameSideDockMode;
  };

  Diagram.prototype.setSameSideDockMode = function(mode, skipSave) {
    this.options.sameSideDockMode = normalizeDiagramSameSideDockMode(mode);
    this._syncStructure();
    if (!skipSave) this._saveToolboxState();
    return this;
  };

  Diagram.prototype.getToolboxWidth = function() {
    return this.options.toolboxWidth;
  };

  Diagram.prototype.setToolboxWidth = function(width, skipSave) {
    this.options.toolboxWidth = diagramClamp(
      diagramNumber(width, this.options.toolboxWidth),
      this.options.toolboxMinWidth,
      this.options.toolboxMaxWidth
    );
    this._syncStructure();
    if (!skipSave) this._saveToolboxState();
    return this;
  };

  Diagram.prototype.getToolboxHeight = function() {
    return this.options.toolboxHeight;
  };

  Diagram.prototype.setToolboxHeight = function(height, skipSave) {
    this.options.toolboxHeight = diagramClamp(
      diagramNumber(height, this.options.toolboxHeight),
      this.options.toolboxMinHeight,
      this.options.toolboxMaxHeight
    );
    this._syncStructure();
    if (!skipSave) this._saveToolboxState();
    return this;
  };

  Diagram.prototype.getPropertiesWidth = function() {
    return this.options.propertiesWidth;
  };

  Diagram.prototype.setPropertiesWidth = function(width, skipSave) {
    this.options.propertiesWidth = diagramClamp(
      diagramNumber(width, this.options.propertiesWidth),
      this.options.propertiesMinWidth,
      this.options.propertiesMaxWidth
    );
    this._syncStructure();
    if (!skipSave) this._saveToolboxState();
    return this;
  };

  Diagram.prototype.getPropertiesHeight = function() {
    return this.options.propertiesHeight;
  };

  Diagram.prototype.setPropertiesHeight = function(height, skipSave) {
    this.options.propertiesHeight = diagramClamp(
      diagramNumber(height, this.options.propertiesHeight),
      this.options.propertiesMinHeight,
      this.options.propertiesMaxHeight
    );
    this._syncStructure();
    if (!skipSave) this._saveToolboxState();
    return this;
  };

  Diagram.prototype.isToolboxFloating = function() {
    return this.options.toolboxFloating;
  };

  Diagram.prototype.floatToolbox = function(left, top, skipSave) {
    this.options.toolboxFloating = true;
    if (left != null) {
      this.options.toolboxFloatLeft = Math.max(
        0,
        diagramNumber(left, this.options.toolboxFloatLeft)
      );
    }
    if (top != null) {
      this.options.toolboxFloatTop = Math.max(
        0,
        diagramNumber(top, this.options.toolboxFloatTop)
      );
    }
    this._syncStructure();
    this._bringFloatingPanelToFront('toolbox');
    if (!skipSave) this._saveToolboxState();
    return this;
  };

  Diagram.prototype.dockToolbox = function(side, skipSave) {
    side = normalizeDiagramDockSide(
      side,
      this.options.toolboxDockSide
    );
    this.options.toolboxFloating = false;
    this.options.toolboxDockSide = side;
    if (
      !this.options.propertiesFloating &&
      side === this.options.propertiesDockSide
    ) {
      this._sameSideDockTab = 'toolbox';
      this.options.sameSideDockTab = 'toolbox';
    }
    this.workspaceElement.classList.remove(
      'fui-diagram-toolbox-dock-preview-left',
      'fui-diagram-toolbox-dock-preview-right'
    );
    this._syncStructure();
    if (!skipSave) this._saveToolboxState();
    return this;
  };

  Diagram.prototype.isPropertiesFloating = function() {
    return this.options.propertiesFloating;
  };

  Diagram.prototype.floatProperties = function(left, top, skipSave) {
    this.options.propertiesFloating = true;
    if (left != null) {
      this.options.propertiesFloatLeft = Math.max(
        0,
        diagramNumber(left, this.options.propertiesFloatLeft)
      );
    }
    if (top != null) {
      this.options.propertiesFloatTop = Math.max(
        0,
        diagramNumber(top, this.options.propertiesFloatTop)
      );
    }
    this._syncStructure();
    this._bringFloatingPanelToFront('properties');
    if (!skipSave) this._saveToolboxState();
    return this;
  };

  Diagram.prototype.dockProperties = function(side, skipSave) {
    side = normalizeDiagramDockSide(
      side,
      this.options.propertiesDockSide
    );
    this.options.propertiesFloating = false;
    this.options.propertiesDockSide = side;
    if (
      !this.options.toolboxFloating &&
      side === this.options.toolboxDockSide
    ) {
      this._sameSideDockTab = 'properties';
      this.options.sameSideDockTab = 'properties';
    }
    this.workspaceElement.classList.remove(
      'fui-diagram-properties-dock-preview-left',
      'fui-diagram-properties-dock-preview-right'
    );
    this._syncStructure();
    if (!skipSave) this._saveToolboxState();
    return this;
  };

  Diagram.prototype.on = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!name || typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  Diagram.prototype.off = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!this._listeners[name]) return this;
    this._listeners[name] = listener ?
      this._listeners[name].filter(function(item) { return item !== listener; }) :
      [];
    return this;
  };

  Diagram.prototype.destroy = function() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._closeInlineTextEditor(false);
    if (this._contextMenu) {
      this._contextMenu.dispose();
      this._contextMenu = null;
      this._contextMenuHost = null;
    }
    if (this._fullscreenResizeObserver) {
      this._fullscreenResizeObserver.disconnect();
      this._fullscreenResizeObserver = null;
    }
    this._fullscreenViewportSize = null;
    this._fullscreenViewState = null;
    if (this._jsonFileReader && this._jsonFileReader.readyState === 1) {
      this._jsonFileReader.abort();
    }
    this._jsonFileReader = null;
    this._panelResize = null;
    this._unbindPanelResizeInteraction();
    this._toolboxPanelDrag = null;
    this._unbindToolboxPanelInteraction();
    this._propertiesPanelDrag = null;
    this._unbindPropertiesPanelInteraction();
    this._viewToolbarDrag = null;
    this._unbindViewToolbarInteraction();
    this._toolboxOrderDrag = null;
    this._unbindToolboxOrderInteraction();
    this._unbindDocumentInteraction();
    this.removeEventListener();
    this._detachDockTabsPanels();
    if (this._dockTabs) {
      this._dockTabs.dispose();
      this._dockTabs = null;
      this._dockTabsToolboxPanel = null;
      this._dockTabsPropertiesPanel = null;
    }
    this._buttonControls.forEach(function(control) {
      control.dispose();
    });
    this._toolboxButtonControls.forEach(function(control) {
      control.dispose();
    });
    this._editBoxControls.forEach(function(control) {
      control.dispose();
    });
    this._disposePropertyEditors();
    unregisterControl(this.hostElement, this);
    delete this.hostElement.__fabuiDiagram;
    restoreDiagramAttribute(this.hostElement, 'class', this._original.className);
    restoreDiagramAttribute(this.hostElement, 'style', this._original.style);
    restoreDiagramAttribute(this.hostElement, 'role', this._original.role);
    restoreDiagramAttribute(this.hostElement, 'aria-label', this._original.ariaLabel);
    restoreDiagramAttribute(this.hostElement, 'tabindex', this._original.tabIndex);
    this.hostElement.innerHTML = this._original.html;
    this._listeners = {};
  };

  Diagram.prototype.dispose = Diagram.prototype.destroy;
  Diagram.defaults = defaults;
  Diagram.locales = localePacks;
  Diagram.themes = DIAGRAM_THEMES.slice();
  Diagram.shapes = DIAGRAM_SHAPES.map(function(shape) {
    return diagramAssign({}, shape);
  });
  Diagram.connectorTools = DIAGRAM_CONNECTOR_TOOLS.map(function(tool) {
    return diagramAssign({}, tool);
  });
  Diagram.paperSizes = diagramClone(DIAGRAM_PAPER_SIZES);
  Diagram.connectionPoints = DIAGRAM_CONNECTION_POINTS.map(function(point) {
    return diagramAssign({}, point);
  });
  Diagram.getControl = function(element) {
    element = resolveDiagramElement(element);
    return element && element.__fabuiDiagram ? element.__fabuiDiagram : null;
  };
  Diagram.normalizeLocale = normalizeDiagramLocale;
  Diagram.normalizeTheme = normalizeDiagramTheme;
  Diagram.normalizeData = normalizeDiagramData;
  return Diagram;
}
