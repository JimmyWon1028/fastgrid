function resolvePivotWorkspaceHostElement(element) {
  if (typeof element === 'string') {
    if (typeof document === 'undefined') {
      return null;
    }
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function assign(target, source) {
  var key;
  source = source || {};
  for (key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }
  return target;
}

function normalizePositiveNumber(value, fallback) {
  value = Number(value);
  return isFinite(value) && value > 0 ? value : fallback;
}

function normalizeChartSize(value, fallback) {
  var match;
  var fraction;
  var percent;
  if (typeof value === 'string') {
    match = value.trim().match(/^(\d+(?:\.\d+)?)%$/);
    if (match) {
      percent = Number(match[1]);
      if (isFinite(percent) && percent > 0 && percent <= 100) {
        return percent + '%';
      }
    }
    match = value.trim().match(/^(\d+(?:\.\d+)?)fr$/i);
    if (match) {
      fraction = Number(match[1]);
      if (isFinite(fraction) && fraction > 0) {
        return fraction + 'fr';
      }
    }
  }
  value = Number(value);
  return isFinite(value) && value > 0 ? value : fallback;
}

function normalizeLayout(value) {
  value = String(value || 'Auto').toLowerCase();
  if (value === 'horizontal') {
    return 'Horizontal';
  }
  if (value === 'vertical') {
    return 'Vertical';
  }
  return 'Auto';
}

function normalizePivotWorkspaceChartType(value) {
  value = String(value || 'Column').toLowerCase();
  if (value === 'bar') {
    return 'Bar';
  }
  if (value === 'line') {
    return 'Line';
  }
  if (value === 'pie') {
    return 'Pie';
  }
  return 'Column';
}

function getPivotWorkspaceMessageValue(source, path) {
  var value = source;
  var parts = String(path || '').split('.');
  var i;
  for (i = 0; i < parts.length; i += 1) {
    if (!value || typeof value !== 'object') {
      return null;
    }
    value = value[parts[i]];
  }
  return typeof value === 'string' ? value : null;
}

function getEngineOptions(options) {
  var result = assign({}, options.engineOptions);
  var names = [
    'itemsSource',
    'fields',
    'rowFields',
    'columnFields',
    'valueFields',
    'filterFields',
    'showRowTotals',
    'showColumnTotals',
    'totalsBeforeData',
    'showZeros',
    'autoGenerateFields',
    'asyncBatchSize'
  ];
  var i;
  for (i = 0; i < names.length; i += 1) {
    if (Object.prototype.hasOwnProperty.call(options, names[i])) {
      result[names[i]] = options[names[i]];
    }
  }
  return result;
}

function getChildOptions(base, override, engine) {
  var result = assign({}, override);
  if (!Object.prototype.hasOwnProperty.call(result, 'locale')) {
    result.locale = base.locale;
  }
  if (!Object.prototype.hasOwnProperty.call(result, 'messages') && base.messages) {
    result.messages = base.messages;
  }
  result.itemsSource = engine;
  return result;
}

export function normalizePivotWorkspaceOptions(options) {
  options = options || {};
  return assign({
    locale: 'en',
    messages: null,
    layout: 'Auto',
    compactBreakpoint: 1050,
    splitterSize: 7,
    splitterStep: 16,
    panelSize: 300,
    chartSize: '40%',
    verticalPanelSize: 190,
    verticalChartSize: 190,
    minPanelSize: 220,
    minGridSize: 320,
    minChartSize: 240,
    minVerticalPanelSize: 120,
    minVerticalGridSize: 180,
    minVerticalChartSize: 120,
    showPanel: true,
    showChart: true,
    showHeaders: true,
    showControls: true,
    panelTitle: null,
    gridTitle: null,
    chartTitle: null,
    panelOptions: {},
    gridOptions: {},
    chartOptions: {},
    engineOptions: {},
    layoutChanged: null,
    paneSizeChanged: null
  }, options);
}

export function resolvePivotWorkspaceChartSize(value, constraints) {
  var percentMatch = typeof value === 'string' ? value.match(/^(\d+(?:\.\d+)?)%$/) : null;
  var fractionMatch = typeof value === 'string' ? value.match(/^(\d+(?:\.\d+)?)fr$/i) : null;
  var fraction;
  var splitterCount;
  var available;
  if (!percentMatch && !fractionMatch) {
    return normalizePositiveNumber(value, 350);
  }
  splitterCount = (constraints.panelVisible !== false ? 1 : 0) +
    (constraints.chartVisible !== false ? 1 : 0);
  available = Number(constraints.totalSize) -
    splitterCount * Number(constraints.splitterSize) -
    (constraints.panelVisible !== false ? Number(constraints.panelSize) : 0);
  available = Math.max(0, available);
  if (percentMatch) {
    return Math.round(available * Number(percentMatch[1]) / 100);
  }
  fraction = Number(fractionMatch[1]);
  return Math.round(available * fraction / (1 + fraction));
}

export function resolvePivotWorkspaceLayout(layout, width, breakpoint) {
  layout = normalizeLayout(layout);
  if (layout !== 'Auto') {
    return layout;
  }
  return Number(width) < normalizePositiveNumber(breakpoint, 1050) ? 'Vertical' : 'Horizontal';
}

export function fitPivotWorkspacePaneSizes(sizes, constraints) {
  var panelVisible = constraints.panelVisible !== false;
  var chartVisible = constraints.chartVisible !== false;
  var splitterCount = (panelVisible ? 1 : 0) + (chartVisible ? 1 : 0);
  var available = Math.max(0, Number(constraints.totalSize) -
    splitterCount * Number(constraints.splitterSize) -
    Number(constraints.minGridSize));
  var panel = panelVisible ? Math.max(Number(constraints.minPanelSize), Number(sizes.panel) || 0) : 0;
  var chart = chartVisible ? Math.max(Number(constraints.minChartSize), Number(sizes.chart) || 0) : 0;
  var overflow = panel + chart - available;
  var amount;
  if (overflow > 0 && chartVisible) {
    amount = Math.min(overflow, Math.max(0, chart - Number(constraints.minChartSize)));
    chart -= amount;
    overflow -= amount;
  }
  if (overflow > 0 && panelVisible) {
    amount = Math.min(overflow, Math.max(0, panel - Number(constraints.minPanelSize)));
    panel -= amount;
    overflow -= amount;
  }
  if (overflow > 0 && chartVisible) {
    amount = Math.min(overflow, chart);
    chart -= amount;
    overflow -= amount;
  }
  if (overflow > 0 && panelVisible) {
    panel = Math.max(0, panel - overflow);
  }
  return {
    panel: Math.round(panel),
    chart: Math.round(chart)
  };
}

export function calculatePivotWorkspacePaneSize(kind, startSize, delta, constraints) {
  var panelVisible = constraints.panelVisible !== false;
  var chartVisible = constraints.chartVisible !== false;
  var splitterCount = (panelVisible ? 1 : 0) + (chartVisible ? 1 : 0);
  var otherSize = kind === 'panel' ?
    (chartVisible ? Number(constraints.chartSize) : 0) :
    (panelVisible ? Number(constraints.panelSize) : 0);
  var minimum = kind === 'panel' ? Number(constraints.minPanelSize) : Number(constraints.minChartSize);
  var maximum = Number(constraints.totalSize) -
    splitterCount * Number(constraints.splitterSize) -
    Number(constraints.minGridSize) -
    otherSize;
  var value = Number(startSize) + (kind === 'chart' ? -Number(delta) : Number(delta));
  maximum = Math.max(0, maximum);
  minimum = Math.min(Math.max(0, minimum), maximum);
  return Math.round(Math.max(minimum, Math.min(maximum, value)));
}

export function createPivotWorkspaceFactory(
  Control,
  registerControl,
  unregisterControl,
  PivotEngine,
  PivotPanel,
  PivotGrid,
  PivotChart,
  FabGrid
) {
  function PivotWorkspace(element, options) {
    var host = resolvePivotWorkspaceHostElement(element);
    var source;
    if (!host) {
      throw new TypeError('PivotWorkspace host element was not found.');
    }
    Control.call(this);
    this.hostElement = host;
    this.root = host;
    this.options = normalizePivotWorkspaceOptions(options);
    this.options.layout = normalizeLayout(this.options.layout);
    this.locale = this.options.locale || 'en';
    this.messages = this.options.messages || null;
    this._disposed = false;
    this._layout = null;
    this._panelVisible = this.options.showPanel !== false;
    this._chartVisible = this.options.showChart !== false;
    this._horizontalSizes = {
      panel: normalizePositiveNumber(this.options.panelSize, 300),
      chart: normalizePositiveNumber(this.options.chartSize, 350)
    };
    this._horizontalChartSize = normalizeChartSize(this.options.chartSize, '40%');
    this.options.chartSize = this._horizontalChartSize;
    this._verticalSizes = {
      panel: normalizePositiveNumber(this.options.verticalPanelSize, 190),
      chart: normalizePositiveNumber(this.options.verticalChartSize, 190)
    };
    this._dragState = null;
    this._fallbackFullscreenPane = null;
    this._resizeFrame = 0;
    this._documentPointerMoveHandler = this._handleDocumentPointerMove.bind(this);
    this._documentPointerUpHandler = this._handleDocumentPointerUp.bind(this);
    source = this.options.engine || this.options.itemsSource;
    this._engine = source instanceof PivotEngine ? source : new PivotEngine(getEngineOptions(this.options));
    this._createDom();
    this._createChildren();
    this._createControls();
    this._bindEngineEvents();
    this._bindEvents();
    this._observeSize();
    registerControl(host, this);
    this.applyLocaleToDom();
    this.resize();
  }

  PivotWorkspace.prototype = Object.create(Control.prototype);
  PivotWorkspace.prototype.constructor = PivotWorkspace;

  PivotWorkspace.prototype._createDom = function() {
    this.hostElement.innerHTML = '';
    this.hostElement.classList.add('fg-root', 'fg-pivot-workspace');
    this.hostElement.setAttribute('role', 'group');
    if (this.options.showHeaders === false) {
      this.hostElement.classList.add('fg-pivot-workspace-headers-hidden');
    }
    this.panelPane = this._createPane('panel');
    this.panelSplitter = this._createSplitter('panel');
    this.gridPane = this._createPane('grid');
    this.chartSplitter = this._createSplitter('chart');
    this.chartPane = this._createPane('chart');
    this.hostElement.appendChild(this.panelPane.pane);
    this.hostElement.appendChild(this.panelSplitter);
    this.hostElement.appendChild(this.gridPane.pane);
    this.hostElement.appendChild(this.chartSplitter);
    this.hostElement.appendChild(this.chartPane.pane);
  };

  PivotWorkspace.prototype._createPane = function(name) {
    var pane = document.createElement('section');
    var header = document.createElement('div');
    var title = document.createElement('span');
    var actions = document.createElement('span');
    var body = document.createElement('div');
    pane.className = 'fg-pivot-workspace-pane fg-pivot-workspace-' + name + '-pane';
    pane.setAttribute('data-pane', name);
    header.className = 'fg-pivot-workspace-pane-header';
    header.setAttribute('role', 'heading');
    header.setAttribute('aria-level', '2');
    title.className = 'fg-pivot-workspace-pane-title';
    actions.className = 'fg-pivot-workspace-pane-actions';
    body.className = 'fg-pivot-workspace-pane-body fg-pivot-workspace-' + name + '-host';
    header.appendChild(title);
    header.appendChild(actions);
    pane.appendChild(header);
    pane.appendChild(body);
    return {
      pane: pane,
      header: header,
      title: title,
      actions: actions,
      body: body
    };
  };

  PivotWorkspace.prototype._createSplitter = function(name) {
    var splitter = document.createElement('div');
    splitter.className = 'fg-pivot-workspace-splitter fg-pivot-workspace-' + name + '-splitter';
    splitter.setAttribute('data-splitter', name);
    splitter.setAttribute('role', 'separator');
    splitter.setAttribute('tabindex', '0');
    splitter.setAttribute('aria-valuemin', '0');
    return splitter;
  };

  PivotWorkspace.prototype._createChildren = function() {
    var panelOptions = getChildOptions(this.options, this.options.panelOptions, this._engine);
    var gridOptions = getChildOptions(this.options, this.options.gridOptions, this._engine);
    var chartOptions = getChildOptions(this.options, this.options.chartOptions, this._engine);
    chartOptions.selectionSource = null;
    this.panel = new PivotPanel(this.panelPane.body, panelOptions);
    this.grid = new PivotGrid(this.gridPane.body, gridOptions);
    chartOptions.selectionSource = this.grid;
    this.chart = new PivotChart(this.chartPane.body, chartOptions);
  };

  PivotWorkspace.prototype._createControls = function() {
    var chartTypes = ['Column', 'Bar', 'Line', 'Pie'];
    var i;
    var option;
    this.progressElement = document.createElement('span');
    this.progressElement.className = 'fg-pivot-workspace-progress';
    this.progressElement.setAttribute('role', 'status');
    this.progressElement.setAttribute('aria-live', 'polite');
    this.cancelRefreshButton = document.createElement('button');
    this.cancelRefreshButton.type = 'button';
    this.cancelRefreshButton.className = 'fg-pivot-workspace-control fg-pivot-workspace-cancel';
    this.cancelRefreshButton.style.display = 'none';
    this.gridPane.actions.appendChild(this.progressElement);
    this.gridPane.actions.appendChild(this.cancelRefreshButton);
    if (this.options.showControls === false) {
      return;
    }
    this.panelToggleButton = document.createElement('button');
    this.panelToggleButton.type = 'button';
    this.panelToggleButton.className = 'fg-pivot-workspace-control';
    this.chartToggleButton = document.createElement('button');
    this.chartToggleButton.type = 'button';
    this.chartToggleButton.className = 'fg-pivot-workspace-control';
    this.chartTypeSelect = document.createElement('select');
    this.chartTypeSelect.className = 'fg-pivot-workspace-control fg-pivot-workspace-chart-type';
    this.gridFullscreenButton = document.createElement('button');
    this.gridFullscreenButton.type = 'button';
    this.gridFullscreenButton.className =
      'fg-pivot-workspace-control fg-pivot-workspace-fullscreen icon-fullscreen';
    this.chartFullscreenButton = document.createElement('button');
    this.chartFullscreenButton.type = 'button';
    this.chartFullscreenButton.className =
      'fg-pivot-workspace-control fg-pivot-workspace-fullscreen icon-fullscreen';
    for (i = 0; i < chartTypes.length; i += 1) {
      option = document.createElement('option');
      option.value = chartTypes[i];
      this.chartTypeSelect.appendChild(option);
    }
    this.gridPane.actions.appendChild(this.panelToggleButton);
    this.gridPane.actions.appendChild(this.chartToggleButton);
    this.gridPane.actions.appendChild(this.gridFullscreenButton);
    this.chartPane.actions.appendChild(this.chartTypeSelect);
    this.chartPane.actions.appendChild(this.chartFullscreenButton);
  };

  PivotWorkspace.prototype._bindEvents = function() {
    this.addEventListener(this.panelSplitter, 'pointerdown', this._handleSplitterPointerDown.bind(this));
    this.addEventListener(this.chartSplitter, 'pointerdown', this._handleSplitterPointerDown.bind(this));
    this.addEventListener(this.panelSplitter, 'keydown', this._handleSplitterKeyDown.bind(this));
    this.addEventListener(this.chartSplitter, 'keydown', this._handleSplitterKeyDown.bind(this));
    this.addEventListener(this.cancelRefreshButton, 'click', function() {
      this.cancelRefresh();
    }.bind(this));
    if (this.panelToggleButton) {
      this.addEventListener(this.panelToggleButton, 'click', function() {
        this.setPanelVisible(!this._panelVisible);
      }.bind(this));
    }
    if (this.chartToggleButton) {
      this.addEventListener(this.chartToggleButton, 'click', function() {
        this.setChartVisible(!this._chartVisible);
      }.bind(this));
    }
    if (this.chartTypeSelect) {
      this.addEventListener(this.chartTypeSelect, 'change', function(event) {
        this.setChartType(event.target.value);
      }.bind(this));
    }
    if (this.gridFullscreenButton) {
      this.addEventListener(this.gridFullscreenButton, 'click', function() {
        this.togglePaneFullscreen('grid');
      }.bind(this));
    }
    if (this.chartFullscreenButton) {
      this.addEventListener(this.chartFullscreenButton, 'click', function() {
        this.togglePaneFullscreen('chart');
      }.bind(this));
    }
    this.addEventListener(document, 'fullscreenchange', this._handleFullscreenChange.bind(this));
    this.addEventListener(document, 'webkitfullscreenchange', this._handleFullscreenChange.bind(this));
    this.addEventListener(document, 'keydown', this._handleFullscreenKeyDown.bind(this), true);
  };

  PivotWorkspace.prototype._bindEngineEvents = function() {
    if (!this._engine) {
      return;
    }
    this._engineUpdatingHandler = this._handleEngineUpdating.bind(this);
    this._engineProgressHandler = this._handleEngineProgress.bind(this);
    this._engineUpdatedHandler = this._handleEngineUpdated.bind(this);
    this._engineErrorHandler = this._handleEngineError.bind(this);
    this._engine.updatingView.addHandler(this._engineUpdatingHandler, this);
    this._engine.progress.addHandler(this._engineProgressHandler, this);
    this._engine.updatedView.addHandler(this._engineUpdatedHandler, this);
    this._engine.error.addHandler(this._engineErrorHandler, this);
  };

  PivotWorkspace.prototype._unbindEngineEvents = function() {
    if (!this._engine) {
      return;
    }
    if (this._engineUpdatingHandler) {
      this._engine.updatingView.removeHandler(this._engineUpdatingHandler, this);
      this._engine.progress.removeHandler(this._engineProgressHandler, this);
      this._engine.updatedView.removeHandler(this._engineUpdatedHandler, this);
      this._engine.error.removeHandler(this._engineErrorHandler, this);
    }
    this._engineUpdatingHandler = null;
    this._engineProgressHandler = null;
    this._engineUpdatedHandler = null;
    this._engineErrorHandler = null;
  };

  PivotWorkspace.prototype._handleEngineUpdating = function(sender, args) {
    this.hostElement.classList.add('fg-pivot-workspace-updating');
    this.progressElement.textContent = args && args.async ?
      this.getText('pivot.workspace.progress').replace('{progress}', '0') : '';
    this.cancelRefreshButton.style.display = args && args.async ? '' : 'none';
  };

  PivotWorkspace.prototype._handleEngineProgress = function(sender, args) {
    var progress = Math.round(Math.max(0, Math.min(1, Number(args && args.progress) || 0)) * 100);
    this.progressElement.textContent = this.getText('pivot.workspace.progress')
      .replace('{progress}', String(progress));
  };

  PivotWorkspace.prototype._handleEngineUpdated = function() {
    this.hostElement.classList.remove('fg-pivot-workspace-updating', 'fg-pivot-workspace-error');
    this.progressElement.textContent = '';
    this.cancelRefreshButton.style.display = 'none';
  };

  PivotWorkspace.prototype._handleEngineError = function(sender, args) {
    var error = args && args.error;
    this.hostElement.classList.remove('fg-pivot-workspace-updating');
    this.hostElement.classList.add('fg-pivot-workspace-error');
    this.progressElement.textContent = this.getText('pivot.workspace.error') +
      (error && error.message ? ': ' + error.message : '');
    this.cancelRefreshButton.style.display = 'none';
  };

  PivotWorkspace.prototype._observeSize = function() {
    var self = this;
    if (typeof ResizeObserver === 'function') {
      this._resizeObserver = new ResizeObserver(function() {
        self._scheduleResize();
      });
      this._resizeObserver.observe(this.hostElement);
    } else if (typeof window !== 'undefined') {
      this._windowResizeHandler = this._scheduleResize.bind(this);
      this.addEventListener(window, 'resize', this._windowResizeHandler);
    }
  };

  PivotWorkspace.prototype.getText = function(path) {
    var locales = FabGrid.locales || {};
    var localeName = this.locale || 'en';
    var baseName = localeName.split('-')[0];
    return getPivotWorkspaceMessageValue(this.messages, path) ||
      getPivotWorkspaceMessageValue(locales[localeName], path) ||
      getPivotWorkspaceMessageValue(locales[baseName], path) ||
      getPivotWorkspaceMessageValue(locales.en, path) || path;
  };

  PivotWorkspace.prototype.applyLocaleToDom = function() {
    this.hostElement.setAttribute('aria-label', this.getText('pivot.workspace.ariaLabel'));
    this.panelPane.title.textContent = this.options.panelTitle || this.getText('pivot.workspace.panelTitle');
    this.gridPane.title.textContent = this.options.gridTitle || this.getText('pivot.workspace.gridTitle');
    this.chartPane.title.textContent = this.options.chartTitle || this.getText('pivot.workspace.chartTitle');
    this.cancelRefreshButton.textContent = this.getText('pivot.workspace.cancel');
    this.cancelRefreshButton.setAttribute('aria-label', this.getText('pivot.workspace.cancel'));
    this.panelSplitter.setAttribute('aria-label', this.getText('pivot.workspace.panelSplitter'));
    this.chartSplitter.setAttribute('aria-label', this.getText('pivot.workspace.chartSplitter'));
    this._syncVisibilityControls();
    this._syncChartTypeControl();
    this._syncFullscreenControls();
  };

  PivotWorkspace.prototype._syncVisibilityControls = function() {
    if (this.panelToggleButton) {
      this.panelToggleButton.textContent = this.getText(
        this._panelVisible ? 'pivot.workspace.hidePanel' : 'pivot.workspace.showPanel'
      );
      this.panelToggleButton.setAttribute('aria-expanded', this._panelVisible ? 'true' : 'false');
    }
    if (this.chartToggleButton) {
      this.chartToggleButton.textContent = this.getText(
        this._chartVisible ? 'pivot.workspace.hideChart' : 'pivot.workspace.showChart'
      );
      this.chartToggleButton.setAttribute('aria-expanded', this._chartVisible ? 'true' : 'false');
    }
  };

  PivotWorkspace.prototype._syncChartTypeControl = function() {
    var chartType;
    var options;
    var i;
    if (this.chartTypeSelect) {
      this.chartTypeSelect.setAttribute('aria-label', this.getText('pivot.workspace.chartType'));
      chartType = normalizePivotWorkspaceChartType(this.chart ? this.chart.chartType : null);
      options = this.chartTypeSelect.options;
      for (i = 0; i < options.length; i += 1) {
        options[i].textContent = this.getText(
          'pivot.workspace.chartTypes.' + String(options[i].value).toLowerCase()
        );
      }
      this.chartTypeSelect.value = chartType;
    }
  };

  PivotWorkspace.prototype._getNativeFullscreenElement = function() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  };

  PivotWorkspace.prototype._getFullscreenElement = function() {
    return this._getNativeFullscreenElement() || this._fallbackFullscreenPane;
  };

  PivotWorkspace.prototype._getFullscreenPane = function(name) {
    if (name === 'grid') {
      return this.gridPane.pane;
    }
    if (name === 'chart') {
      return this.chartPane.pane;
    }
    return null;
  };

  PivotWorkspace.prototype.isPaneFullscreen = function(name) {
    return this._getFullscreenElement() === this._getFullscreenPane(name);
  };

  PivotWorkspace.prototype.isPaneFullscreenAvailable = function(name) {
    return Boolean(this._getFullscreenPane(name));
  };

  PivotWorkspace.prototype._syncFullscreenControls = function() {
    var gridFullscreen;
    var chartFullscreen;
    var gridLabel;
    var chartLabel;
    if (!this.gridFullscreenButton || !this.chartFullscreenButton) {
      return;
    }
    gridFullscreen = this.isPaneFullscreen('grid');
    chartFullscreen = this.isPaneFullscreen('chart');
    gridLabel = this.getText(
      gridFullscreen ? 'pivot.workspace.exitFullscreen' : 'pivot.workspace.gridFullscreen'
    );
    chartLabel = this.getText(
      chartFullscreen ? 'pivot.workspace.exitFullscreen' : 'pivot.workspace.chartFullscreen'
    );
    this.gridFullscreenButton.setAttribute('aria-label', gridLabel);
    this.gridFullscreenButton.setAttribute('title', gridLabel);
    this.gridFullscreenButton.setAttribute('aria-pressed', gridFullscreen ? 'true' : 'false');
    this.gridFullscreenButton.disabled = !this.isPaneFullscreenAvailable('grid');
    this.chartFullscreenButton.setAttribute('aria-label', chartLabel);
    this.chartFullscreenButton.setAttribute('title', chartLabel);
    this.chartFullscreenButton.setAttribute('aria-pressed', chartFullscreen ? 'true' : 'false');
    this.chartFullscreenButton.disabled = !this.isPaneFullscreenAvailable('chart');
  };

  PivotWorkspace.prototype.togglePaneFullscreen = function(name) {
    var pane = this._getFullscreenPane(name);
    var action;
    var context;
    var result;
    if (!pane) {
      return false;
    }
    if (this._fallbackFullscreenPane === pane) {
      this._setFallbackFullscreen(null);
      return true;
    }
    if (this.isPaneFullscreen(name)) {
      action = document.exitFullscreen || document.webkitExitFullscreen;
      context = document;
    } else {
      action = pane.requestFullscreen || pane.webkitRequestFullscreen;
      context = pane;
    }
    if (typeof action !== 'function') {
      this._setFallbackFullscreen(pane);
      return true;
    }
    try {
      result = action.call(context);
      if (result && typeof result.catch === 'function') {
        result.catch(function() {
          this._setFallbackFullscreen(pane);
        }.bind(this));
      }
      return result || true;
    } catch (error) {
      this._setFallbackFullscreen(pane);
      return true;
    }
  };

  PivotWorkspace.prototype._setFallbackFullscreen = function(pane) {
    if (this._fallbackFullscreenPane) {
      this._fallbackFullscreenPane.classList.remove('fg-pivot-workspace-pane-fullscreen');
    }
    this._fallbackFullscreenPane = pane || null;
    if (this._fallbackFullscreenPane) {
      this._fallbackFullscreenPane.classList.add('fg-pivot-workspace-pane-fullscreen');
    }
    this._syncFullscreenControls();
    this._scheduleResize();
  };

  PivotWorkspace.prototype._handleFullscreenKeyDown = function(event) {
    if (event.key !== 'Escape' || !this._fallbackFullscreenPane) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this._setFallbackFullscreen(null);
  };

  PivotWorkspace.prototype._handleFullscreenChange = function() {
    if (this._disposed) {
      return;
    }
    this._syncFullscreenControls();
    this._scheduleResize();
  };

  PivotWorkspace.prototype._getActiveSizes = function() {
    return this._layout === 'Vertical' ? this._verticalSizes : this._horizontalSizes;
  };

  PivotWorkspace.prototype._getConstraints = function() {
    var vertical = this._layout === 'Vertical';
    return {
      totalSize: vertical ? this.hostElement.clientHeight : this.hostElement.clientWidth,
      splitterSize: normalizePositiveNumber(this.options.splitterSize, 7),
      minPanelSize: vertical ?
        normalizePositiveNumber(this.options.minVerticalPanelSize, 120) :
        normalizePositiveNumber(this.options.minPanelSize, 220),
      minGridSize: vertical ?
        normalizePositiveNumber(this.options.minVerticalGridSize, 180) :
        normalizePositiveNumber(this.options.minGridSize, 320),
      minChartSize: vertical ?
        normalizePositiveNumber(this.options.minVerticalChartSize, 120) :
        normalizePositiveNumber(this.options.minChartSize, 240),
      panelVisible: this._panelVisible,
      chartVisible: this._chartVisible
    };
  };

  PivotWorkspace.prototype._applyPaneSizes = function() {
    var sizes = this._getActiveSizes();
    var constraints = this._getConstraints();
    var requested = {
      panel: sizes.panel,
      chart: sizes.chart
    };
    var fitted;
    constraints.panelSize = sizes.panel;
    if (this._layout === 'Horizontal' && constraints.chartVisible) {
      requested.chart = resolvePivotWorkspaceChartSize(this._horizontalChartSize, constraints);
    }
    fitted = constraints.totalSize > 0 ?
      fitPivotWorkspacePaneSizes(requested, constraints) : requested;
    if (constraints.panelVisible) {
      sizes.panel = fitted.panel;
    }
    if (constraints.chartVisible) {
      sizes.chart = fitted.chart;
    }
    this.hostElement.style.setProperty('--fg-pivot-workspace-panel-size', sizes.panel + 'px');
    this.hostElement.style.setProperty('--fg-pivot-workspace-chart-size', sizes.chart + 'px');
    this.hostElement.style.setProperty(
      '--fg-pivot-workspace-splitter-size',
      normalizePositiveNumber(this.options.splitterSize, 7) + 'px'
    );
    this.panelSplitter.setAttribute('aria-valuenow', String(sizes.panel));
    this.chartSplitter.setAttribute('aria-valuenow', String(sizes.chart));
    this.panelSplitter.setAttribute('aria-valuemax', String(Math.max(sizes.panel, constraints.totalSize)));
    this.chartSplitter.setAttribute('aria-valuemax', String(Math.max(sizes.chart, constraints.totalSize)));
  };

  PivotWorkspace.prototype._applyVisibility = function() {
    this.hostElement.classList.toggle('fg-pivot-workspace-panel-hidden', !this._panelVisible);
    this.hostElement.classList.toggle('fg-pivot-workspace-chart-hidden', !this._chartVisible);
    this.panelPane.pane.setAttribute('aria-hidden', this._panelVisible ? 'false' : 'true');
    this.chartPane.pane.setAttribute('aria-hidden', this._chartVisible ? 'false' : 'true');
    this._syncVisibilityControls();
  };

  PivotWorkspace.prototype._applyLayout = function(layout) {
    var changed = this._layout !== layout;
    this._layout = layout;
    this.hostElement.classList.toggle('fg-pivot-workspace-horizontal', layout === 'Horizontal');
    this.hostElement.classList.toggle('fg-pivot-workspace-vertical', layout === 'Vertical');
    this.panelSplitter.setAttribute('aria-orientation', layout === 'Horizontal' ? 'vertical' : 'horizontal');
    this.chartSplitter.setAttribute('aria-orientation', layout === 'Horizontal' ? 'vertical' : 'horizontal');
    if (changed && typeof this.options.layoutChanged === 'function') {
      this.options.layoutChanged(this, { layout: layout });
    }
  };

  PivotWorkspace.prototype._scheduleResize = function() {
    var self = this;
    var schedule;
    if (this._disposed || this._resizeFrame) {
      return;
    }
    schedule = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : function(callback) {
      return setTimeout(callback, 0);
    };
    this._resizeFrame = schedule(function() {
      self._resizeFrame = 0;
      self.resize();
    });
  };

  PivotWorkspace.prototype._resizeChildren = function() {
    if (this.grid && typeof this.grid.refresh === 'function') {
      this.grid.refresh();
    }
    if (this.chart && typeof this.chart.resize === 'function') {
      this.chart.resize();
    }
  };

  PivotWorkspace.prototype.resize = function() {
    var layout;
    if (this._disposed) {
      return this;
    }
    layout = resolvePivotWorkspaceLayout(
      this.options.layout,
      this.hostElement.clientWidth,
      this.options.compactBreakpoint
    );
    this._applyLayout(layout);
    this._applyVisibility();
    this._applyPaneSizes();
    this._resizeChildren();
    return this;
  };

  PivotWorkspace.prototype._getPointerCoordinate = function(event) {
    return this._layout === 'Horizontal' ? event.clientX : event.clientY;
  };

  PivotWorkspace.prototype._handleSplitterPointerDown = function(event) {
    var kind;
    var sizes;
    if (event.button != null && event.button !== 0) {
      return;
    }
    kind = event.currentTarget.getAttribute('data-splitter');
    if ((kind === 'panel' && !this._panelVisible) || (kind === 'chart' && !this._chartVisible)) {
      return;
    }
    event.preventDefault();
    sizes = this._getActiveSizes();
    this._dragState = {
      kind: kind,
      pointerId: event.pointerId,
      startCoordinate: this._getPointerCoordinate(event),
      startSize: sizes[kind],
      layout: this._layout
    };
    this.hostElement.classList.add('fg-pivot-workspace-resizing');
    document.addEventListener('pointermove', this._documentPointerMoveHandler, false);
    document.addEventListener('pointerup', this._documentPointerUpHandler, false);
    document.addEventListener('pointercancel', this._documentPointerUpHandler, false);
  };

  PivotWorkspace.prototype._handleDocumentPointerMove = function(event) {
    var state = this._dragState;
    var sizes;
    var constraints;
    var delta;
    if (!state || (state.pointerId != null && event.pointerId !== state.pointerId)) {
      return;
    }
    event.preventDefault();
    if (state.layout !== this._layout) {
      this._endSplitterDrag();
      return;
    }
    sizes = this._getActiveSizes();
    constraints = this._getConstraints();
    constraints.panelSize = sizes.panel;
    constraints.chartSize = sizes.chart;
    delta = this._getPointerCoordinate(event) - state.startCoordinate;
    sizes[state.kind] = calculatePivotWorkspacePaneSize(
      state.kind,
      state.startSize,
      delta,
      constraints
    );
    if (state.kind === 'chart' && this._layout === 'Horizontal') {
      this._horizontalChartSize = sizes.chart;
      this.options.chartSize = sizes.chart;
    }
    this._applyPaneSizes();
    this._scheduleResize();
  };

  PivotWorkspace.prototype._handleDocumentPointerUp = function(event) {
    if (!this._dragState ||
        (this._dragState.pointerId != null && event.pointerId !== this._dragState.pointerId)) {
      return;
    }
    this._endSplitterDrag(true);
  };

  PivotWorkspace.prototype._endSplitterDrag = function(notify) {
    var sizes = this._getActiveSizes();
    document.removeEventListener('pointermove', this._documentPointerMoveHandler, false);
    document.removeEventListener('pointerup', this._documentPointerUpHandler, false);
    document.removeEventListener('pointercancel', this._documentPointerUpHandler, false);
    this.hostElement.classList.remove('fg-pivot-workspace-resizing');
    this._dragState = null;
    if (notify && typeof this.options.paneSizeChanged === 'function') {
      this.options.paneSizeChanged(this, {
        layout: this._layout,
        panelSize: sizes.panel,
        chartSize: sizes.chart
      });
    }
  };

  PivotWorkspace.prototype._handleSplitterKeyDown = function(event) {
    var kind = event.currentTarget.getAttribute('data-splitter');
    var horizontal = this._layout === 'Horizontal';
    var direction = 0;
    var sizes;
    var constraints;
    if ((horizontal && event.key === 'ArrowLeft') || (!horizontal && event.key === 'ArrowUp')) {
      direction = -1;
    } else if ((horizontal && event.key === 'ArrowRight') || (!horizontal && event.key === 'ArrowDown')) {
      direction = 1;
    }
    if (!direction) {
      return;
    }
    event.preventDefault();
    sizes = this._getActiveSizes();
    constraints = this._getConstraints();
    constraints.panelSize = sizes.panel;
    constraints.chartSize = sizes.chart;
    sizes[kind] = calculatePivotWorkspacePaneSize(
      kind,
      sizes[kind],
      direction * normalizePositiveNumber(this.options.splitterStep, 16),
      constraints
    );
    if (kind === 'chart' && this._layout === 'Horizontal') {
      this._horizontalChartSize = sizes.chart;
      this.options.chartSize = sizes.chart;
    }
    this._applyPaneSizes();
    this._resizeChildren();
    if (typeof this.options.paneSizeChanged === 'function') {
      this.options.paneSizeChanged(this, {
        layout: this._layout,
        panelSize: sizes.panel,
        chartSize: sizes.chart
      });
    }
  };

  PivotWorkspace.prototype.setPanelVisible = function(visible) {
    this._panelVisible = visible !== false;
    this.options.showPanel = this._panelVisible;
    this.resize();
    return this;
  };

  PivotWorkspace.prototype.setChartVisible = function(visible) {
    this._chartVisible = visible !== false;
    this.options.showChart = this._chartVisible;
    this.resize();
    return this;
  };

  PivotWorkspace.prototype.setChartType = function(type) {
    type = normalizePivotWorkspaceChartType(type);
    this.chart.setType(type);
    if (this.chartTypeSelect) {
      this.chartTypeSelect.value = type;
    }
    return this;
  };

  PivotWorkspace.prototype.setPaneSizes = function(panelSize, chartSize) {
    var sizes = this._getActiveSizes();
    if (panelSize != null) {
      sizes.panel = normalizePositiveNumber(panelSize, sizes.panel);
    }
    if (chartSize != null) {
      if (this._layout === 'Horizontal') {
        this._horizontalChartSize = normalizeChartSize(chartSize, this._horizontalChartSize);
        this.options.chartSize = this._horizontalChartSize;
        if (typeof this._horizontalChartSize === 'number') {
          sizes.chart = this._horizontalChartSize;
        }
      } else {
        sizes.chart = normalizePositiveNumber(chartSize, sizes.chart);
      }
    }
    this.resize();
    return this;
  };

  PivotWorkspace.prototype.setLocale = function(locale, messages) {
    this.locale = locale || 'en';
    this.options.locale = this.locale;
    if (messages !== undefined) {
      this.messages = messages;
      this.options.messages = messages;
    }
    this.panel.setLocale(this.locale, messages);
    this.grid.setLocale(this.locale, messages);
    this.chart.setLocale(this.locale, messages);
    this.applyLocaleToDom();
    return this;
  };

  PivotWorkspace.prototype.setEngine = function(engine) {
    if (!(engine instanceof PivotEngine)) {
      throw new TypeError('PivotWorkspace engine must be a fabui.pivot.PivotEngine instance.');
    }
    if (this._engine === engine) {
      return this;
    }
    this._unbindEngineEvents();
    this._engine = engine;
    this.panel.setItemsSource(engine);
    this.grid.setPivotEngine(engine);
    this.chart.setItemsSource(engine);
    this._bindEngineEvents();
    return this;
  };

  PivotWorkspace.prototype.setItemsSource = function(source) {
    if (source instanceof PivotEngine) {
      return this.setEngine(source);
    }
    if (!Array.isArray(source)) {
      throw new TypeError('PivotWorkspace itemsSource must be an Array or fabui.pivot.PivotEngine.');
    }
    this._engine.setItemsSource(source);
    return this;
  };

  PivotWorkspace.prototype.refreshAsync = function(options) {
    return this._engine.refreshAsync(options);
  };

  PivotWorkspace.prototype.cancelRefresh = function() {
    var cancelled = this._engine && this._engine.cancelRefresh();
    if (cancelled) {
      this.hostElement.classList.remove('fg-pivot-workspace-updating');
      this.progressElement.textContent = this.getText('pivot.workspace.cancelled');
      this.cancelRefreshButton.style.display = 'none';
    }
    return cancelled;
  };

  PivotWorkspace.prototype.dispose = function() {
    if (this._disposed) {
      return;
    }
    this._disposed = true;
    this._unbindEngineEvents();
    this._endSplitterDrag(false);
    this._setFallbackFullscreen(null);
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._resizeFrame) {
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this._resizeFrame);
      } else {
        clearTimeout(this._resizeFrame);
      }
      this._resizeFrame = 0;
    }
    if (this.chart) {
      this.chart.dispose();
    }
    if (this.grid) {
      this.grid.dispose();
    }
    if (this.panel) {
      this.panel.dispose();
    }
    this.removeEventListener();
    unregisterControl(this.hostElement, this);
    this.hostElement.innerHTML = '';
    this.hostElement.classList.remove(
      'fg-root',
      'fg-pivot-workspace',
      'fg-pivot-workspace-horizontal',
      'fg-pivot-workspace-vertical',
      'fg-pivot-workspace-panel-hidden',
      'fg-pivot-workspace-chart-hidden',
      'fg-pivot-workspace-headers-hidden',
      'fg-pivot-workspace-resizing',
      'fg-pivot-workspace-updating',
      'fg-pivot-workspace-error'
    );
    this._engine = null;
    this.panel = null;
    this.grid = null;
    this.chart = null;
    this.panelToggleButton = null;
    this.chartToggleButton = null;
    this.chartTypeSelect = null;
    this.gridFullscreenButton = null;
    this.chartFullscreenButton = null;
    this.progressElement = null;
    this.cancelRefreshButton = null;
  };

  Object.defineProperties(PivotWorkspace.prototype, {
    engine: {
      get: function() { return this._engine; },
      set: function(value) { this.setEngine(value); }
    },
    itemsSource: {
      get: function() { return this._engine ? this._engine.itemsSource : []; },
      set: function(value) { this.setItemsSource(value); }
    },
    layout: {
      get: function() { return this._layout; },
      set: function(value) {
        this.options.layout = normalizeLayout(value);
        this.resize();
      }
    },
    showPanel: {
      get: function() { return this._panelVisible; },
      set: function(value) { this.setPanelVisible(value); }
    },
    showChart: {
      get: function() { return this._chartVisible; },
      set: function(value) { this.setChartVisible(value); }
    },
    panelSize: {
      get: function() { return this._getActiveSizes().panel; },
      set: function(value) { this.setPaneSizes(value, null); }
    },
    chartSize: {
      get: function() { return this._getActiveSizes().chart; },
      set: function(value) { this.setPaneSizes(null, value); }
    },
    chartType: {
      get: function() {
        return this.chart ? normalizePivotWorkspaceChartType(this.chart.chartType) : 'Column';
      },
      set: function(value) { this.setChartType(value); }
    }
  });

  return PivotWorkspace;
}
