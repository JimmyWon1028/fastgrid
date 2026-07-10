/*! FastGrid ESM | performance-first data grid */
export function createFastGridFactory() {
  'use strict';

  var DEFAULT_OPTIONS = {
    rowHeight: 32,
    headerHeight: 32,
    overscanRows: 8,
    fastScrollOverscanRows: 64,
    overscanColumns: 3,
    frozenColumns: 0,
    frozenRightColumns: 0,
    rowHeaderWidth: 60,
    rowHeaderHeader: '',
    showRowHeaders: true,
    showFooter: false,
    footerHeight: 32,
    footerLabel: '',
    multiSelectRows: false,
    selectionCheckboxWidth: 44,
    allowSorting: true,
    allowEditing: true,
    editOnSelect: false,
    allowResizing: true,
    allowDragging: 'None',
    allowMerging: 'None',
    allowPinning: false,
    headerDisplayMode: 'header',
    headerToggleKey: false,
    showSearchRow: false,
    searchRowHeight: null,
    searchDelay: 200,
    alternatingRows: false,
    alternatingRowBackground: '#fafafa',
    autoClipboard: true,
    copyHeaders: 'None',
    locale: null,
    messages: null,
    exportBusyText: null,
    frozenRows: 0,
    syncScrollRender: true,
    itemFormatter: null,
    selectionMode: 'Cell',
    rowGroups: [],
    columns: [],
    observeItemsSource: false,
    itemsSource: []
  };
  var FASTGRID_INTERNAL_LOCALES = {};

  function FastGrid(element, options) {
    this.host = typeof element === 'string' ? document.querySelector(element) : element;
    if (!this.host) {
      throw new Error('FastGrid host element was not found.');
    }

    this.options = mergeOptions(DEFAULT_OPTIONS, options || {});
    this.options.showRowHeaders = normalizeRowHeaderMode(this.options.showRowHeaders);
    this.setLocale(this.options.locale, this.options.messages, true);
    if (this.options.isReadOnly === true) {
      this.options.allowEditing = false;
    }
    this.events = {};
    this.wijmoEvents = {};
    this.columns = [];
    this.source = [];
    this.view = [];
    this.dataView = [];
    this.rowGroupState = {};
    this.filterPredicate = null;
    this.searchText = '';
    this.columnSearchValues = {};
    this.columnSearchOperators = {};
    this.hasColumnSearch = false;
    this.sortState = null;
    this.sortStates = [];
    this.headerDisplayMode = normalizeHeaderDisplayMode(this.options.headerDisplayMode);
    this.columnOffsets = [];
    this.totalWidth = 0;
    this._frozenColumns = 0;
    this._frozenRightColumns = 0;
    this.frozenWidth = 0;
    this.frozenRightWidth = 0;
    this.frozenRightStartLeft = 0;
    this.scrollableColumnEnd = 0;
    this.scrollableWidth = 0;
    this.rowRange = { start: 0, end: 0 };
    this.columnRange = { start: 0, end: 0 };
    this.renderContentHeight = 0;
    this.scrollState = {
      top: 0,
      left: 0,
      directionY: 0,
      extraRows: 0
    };
    this.renderedScrollTop = 0;
    this.selection = { row: 0, col: 0 };
    this.rowSelection = null;
    this.selectedRowMap = {};
    this.selectedItemRefs = [];
    this._selectedItemSet = typeof WeakSet === 'function' ? new WeakSet() : null;
    this.hoverRow = null;
    this.editing = null;
    this.editorConfig = null;
    this.editorIconConfigs = [];
    this.dateboxState = null;
    this.dateboxTarget = null;
    this.comboboxTarget = null;
    this.headerSearchFocusRequest = null;
    this.headerSearchFocusRaf = 0;
    this.comboboxItems = [];
    this.comboboxActiveIndex = -1;
    this.filterMenuColumn = null;
    this.invalidItems = [];
    this._invalidItemMap = {};
    this._validationErrorSeq = 0;
    this._asyncValidationSeq = 0;
    this._asyncValidationMap = {};
    this._validationItems = [];
    this._validationItemIds = [];
    this.busy = false;
    this.raf = 0;
    this.disposed = false;
    this.resizeState = null;
    this.columnDragState = null;
    this.columnDragTargetCell = null;
    this.columnDragIndicator = null;
    this.verticalScrollbarDrag = null;
    this.fixedPaneTouchTap = null;
    this.fixedPaneTouchClickUntil = 0;
    this.suppressClick = false;
    this.copyBuffer = '';
    this.headerSearchTimer = 0;
    this._suppressObservedItemChange = 0;
    this._handlingObservedItemChange = false;
    this.cells = { grid: this, cellType: 'Cell' };
    this.columnHeaders = { grid: this, cellType: 'ColumnHeader' };
    this.rowHeaders = { grid: this, cellType: 'RowHeader' };
    this.topLeftCells = { grid: this, cellType: 'TopLeft' };
    this.bottomLeftCells = { grid: this, cellType: 'BottomLeft' };

    this._boundScroll = bind(this, this.handleScroll);
    this._boundClick = bind(this, this.handleClick);
    this._boundDblClick = bind(this, this.handleDblClick);
    this._boundKeyDown = bind(this, this.handleKeyDown);
    this._boundMouseMove = bind(this, this.handleMouseMove);
    this._boundMouseLeave = bind(this, this.handleMouseLeave);
    this._boundPointerDown = bind(this, this.handlePointerDown);
    this._boundPointerMove = bind(this, this.handlePointerMove);
    this._boundPointerUp = bind(this, this.handlePointerUp);
    this._boundVerticalScrollbarPointerDown = bind(this, this.handleVerticalScrollbarPointerDown);
    this._boundVerticalScrollbarPointerMove = bind(this, this.handleVerticalScrollbarPointerMove);
    this._boundVerticalScrollbarPointerUp = bind(this, this.handleVerticalScrollbarPointerUp);
    this._boundVerticalScrollbarWheel = bind(this, this.handleVerticalScrollbarWheel);
    this._boundFixedPaneWheel = bind(this, this.handleFixedPaneWheel);
    this._boundFixedPaneTouchStart = bind(this, this.handleFixedPaneTouchStart);
    this._boundFixedPaneTouchEnd = bind(this, this.handleFixedPaneTouchEnd);
    this._boundEditorBeforeInput = bind(this, this.handleEditorBeforeInput);
    this._boundEditorInput = bind(this, this.handleEditorInput);
    this._boundEditorCopy = bind(this, this.handleEditorCopy);
    this._boundHeaderSearchBeforeInput = bind(this, this.handleHeaderSearchBeforeInput);
    this._boundHeaderSearchInput = bind(this, this.handleHeaderSearchInput);
    this._boundEditorTriggerClick = bind(this, this.handleEditorTriggerClick);
    this._boundDateboxClick = bind(this, this.handleDateboxClick);
    this._boundDateboxChange = bind(this, this.handleDateboxChange);
    this._boundComboboxMouseDown = bind(this, this.handleComboboxMouseDown);
    this._boundFilterMenuClick = bind(this, this.handleFilterMenuClick);
    this._boundDocumentMouseDown = bind(this, this.handleDocumentMouseDown);
    this._boundBusyEvent = bind(this, this.blockBusyEvent);
    this._boundResize = bind(this, this.invalidate);

    this.setColumns(this.options.columns || [], true);
    this.setItemsSource(this.options.itemsSource || [], true);
    this.createWijmoEvents();
    this.createDom();
    this.bindDomEvents();
    this.refresh();
  }

  FastGrid.prototype.on = function(name, handler) {
    if (!this.events[name]) {
      this.events[name] = [];
    }
    this.events[name].push(handler);
    return this;
  };

  FastGrid.prototype.off = function(name, handler) {
    var list = this.events[name];
    var i;
    if (!list) {
      return this;
    }
    for (i = list.length - 1; i >= 0; i -= 1) {
      if (list[i] === handler) {
        list.splice(i, 1);
      }
    }
    return this;
  };

  FastGrid.prototype.emit = function(name, detail) {
    var list = this.events[name];
    var wijmoEvent = this.wijmoEvents ? this.wijmoEvents[name] : null;
    var i;
    detail = detail || {};
    if (list) {
      for (i = 0; i < list.length; i += 1) {
        if (list[i](detail) === false) {
          detail.cancel = true;
        }
      }
    }
    if (wijmoEvent && wijmoEvent.raise(this, detail) === false) {
      detail.cancel = true;
    }
    return detail.cancel !== true;
  };

  FastGrid.prototype.createWijmoEvents = function() {
    var names = [
      'autoGeneratedColumns',
      'autoSizedColumn',
      'autoSizedRow',
      'autoSizingColumn',
      'autoSizingRow',
      'beginningEdit',
      'bigCheckboxesChanged',
      'cellEditEnding',
      'cellEditEnded',
      'columnGroupCollapsedChanged',
      'columnGroupCollapsedChanging',
      'copied',
      'copiedCell',
      'copying',
      'copyingCell',
      'deletedRow',
      'deletingRow',
      'draggedColumn',
      'draggedRow',
      'draggingColumn',
      'draggingRow',
      'formatItem',
      'groupCollapsedChanged',
      'groupCollapsedChanging',
      'itemsSourceChanged',
      'itemsSourceChanging',
      'loadedRows',
      'loadingRows',
      'pasted',
      'pastedCell',
      'pasting',
      'pastingCell',
      'prepareCellForEdit',
      'refreshed',
      'refreshing',
      'resizedColumn',
      'resizedRow',
      'resizingColumn',
      'resizingRow',
      'rowAdded',
      'rowEditEnded',
      'rowEditEnding',
      'rowEditStarted',
      'rowEditStarting',
      'scrollPositionChanged',
      'selectionChanged',
      'selectionChanging',
      'sortedColumn',
      'sortingColumn',
      'updatedLayout',
      'updatedView',
      'updatingLayout',
      'updatingView'
    ];
    var i;
    var event;
    for (i = 0; i < names.length; i += 1) {
      event = createWijmoEvent(this, names[i]);
      this.wijmoEvents[names[i]] = event;
      this[names[i]] = event;
    }
  };

  FastGrid.prototype.setLocale = function(locale, messages, silent) {
    this.options.locale = normalizeLocaleName(locale || this.options.locale || getDefaultLocaleName());
    this.options.messages = messages || this.options.messages || null;
    this.locale = this.options.locale;
    this.messages = createLocaleMessages(this.locale, this.options.messages);
    if (!silent && this.root) {
      this.applyLocaleToDom();
      if (this.dateboxPanel && window.getComputedStyle(this.dateboxPanel).display !== 'none') {
        this.renderDateboxPanel();
      }
      if (this.filterMenuColumn && this.isFilterMenuOpen()) {
        this.renderFilterMenu(this.filterMenuColumn);
      }
      this.render();
    }
  };

  FastGrid.prototype.getText = function(path, data) {
    return formatLocaleText(getLocaleValue(this.messages, path), data);
  };

  FastGrid.prototype.createDom = function() {
    var root = document.createElement('div');
    root.className = 'fg-root';
    root.tabIndex = 0;
    root.setAttribute('role', 'grid');

    root.innerHTML =
      '<div class="fg-header">' +
        '<div class="fg-row-header-top"></div>' +
        '<div class="fg-selection-top"></div>' +
        '<div class="fg-header-frozen"></div>' +
        '<div class="fg-header-frozen-right"></div>' +
        '<div class="fg-header-scroll"><div class="fg-header-canvas"></div></div>' +
      '</div>' +
      '<div class="fg-body">' +
        '<div class="fg-body-scroll">' +
          '<div class="fg-size-layer"></div>' +
          '<div class="fg-cell-layer"></div>' +
        '</div>' +
        '<div class="fg-scrollbar-v"><div class="fg-scrollbar-v-track"><div class="fg-scrollbar-v-thumb"></div></div></div>' +
        '<div class="fg-row-header-pane"><div class="fg-row-header-layer"></div></div>' +
        '<div class="fg-selection-pane"><div class="fg-selection-layer"></div></div>' +
        '<div class="fg-frozen-pane"><div class="fg-frozen-layer"></div></div>' +
        '<div class="fg-frozen-pane-right"><div class="fg-frozen-layer-right"></div></div>' +
        '<input class="fg-editor textbox-f" type="text">' +
        '<div class="fg-editor-icons"><button class="fg-editor-trigger" type="button"></button></div>' +
        '<div class="fg-datebox-panel" role="dialog"></div>' +
        '<div class="fg-combobox-panel" role="listbox"></div>' +
        '<div class="fg-invalid-tip" role="tooltip"></div>' +
        '<div class="fg-empty"></div>' +
        '<div class="fg-busy-overlay" aria-live="polite"><div class="fg-busy-panel"><span class="fg-busy-spinner"></span><span class="fg-busy-text"></span></div></div>' +
      '</div>' +
      '<div class="fg-filter-menu" role="menu"></div>' +
      '<div class="fg-footer">' +
        '<div class="fg-footer-row-header"></div>' +
        '<div class="fg-footer-selection"></div>' +
        '<div class="fg-footer-frozen"></div>' +
        '<div class="fg-footer-frozen-right"></div>' +
        '<div class="fg-footer-scroll"><div class="fg-footer-canvas"></div></div>' +
      '</div>';

    this.host.innerHTML = '';
    this.host.appendChild(root);

    this.root = root;
    this.header = root.querySelector('.fg-header');
    this.rowHeaderTop = root.querySelector('.fg-row-header-top');
    this.selectionTop = root.querySelector('.fg-selection-top');
    this.headerFrozen = root.querySelector('.fg-header-frozen');
    this.headerFrozenRight = root.querySelector('.fg-header-frozen-right');
    this.headerScroll = root.querySelector('.fg-header-scroll');
    this.headerCanvas = root.querySelector('.fg-header-canvas');
    this.body = root.querySelector('.fg-body');
    this.bodyScroll = root.querySelector('.fg-body-scroll');
    this.sizeLayer = root.querySelector('.fg-size-layer');
    this.cellLayer = root.querySelector('.fg-cell-layer');
    this.verticalScrollbar = root.querySelector('.fg-scrollbar-v');
    this.verticalScrollbarTrack = root.querySelector('.fg-scrollbar-v-track');
    this.verticalScrollbarThumb = root.querySelector('.fg-scrollbar-v-thumb');
    this.rowHeaderPane = root.querySelector('.fg-row-header-pane');
    this.rowHeaderLayer = root.querySelector('.fg-row-header-layer');
    this.selectionPane = root.querySelector('.fg-selection-pane');
    this.selectionLayer = root.querySelector('.fg-selection-layer');
    this.frozenPane = root.querySelector('.fg-frozen-pane');
    this.frozenLayer = root.querySelector('.fg-frozen-layer');
    this.frozenRightPane = root.querySelector('.fg-frozen-pane-right');
    this.frozenRightLayer = root.querySelector('.fg-frozen-layer-right');
    this.editor = root.querySelector('.fg-editor');
    this.editorIconHost = root.querySelector('.fg-editor-icons');
    this.editorTrigger = root.querySelector('.fg-editor-trigger');
    this.dateboxPanel = root.querySelector('.fg-datebox-panel');
    this.comboboxPanel = root.querySelector('.fg-combobox-panel');
    this.filterMenu = root.querySelector('.fg-filter-menu');
    this.invalidTip = root.querySelector('.fg-invalid-tip');
    this.footer = root.querySelector('.fg-footer');
    this.footerRowHeader = root.querySelector('.fg-footer-row-header');
    this.footerSelection = root.querySelector('.fg-footer-selection');
    this.footerFrozen = root.querySelector('.fg-footer-frozen');
    this.footerFrozenRight = root.querySelector('.fg-footer-frozen-right');
    this.footerScroll = root.querySelector('.fg-footer-scroll');
    this.footerCanvas = root.querySelector('.fg-footer-canvas');
    this.empty = root.querySelector('.fg-empty');
    this.busyOverlay = root.querySelector('.fg-busy-overlay');
    this.busyText = root.querySelector('.fg-busy-text');
    this.syncHeaderLayout();
    this.applyLocaleToDom();
    this.applyThemeOptions();
  };

  FastGrid.prototype.applyLocaleToDom = function() {
    if (this.editor) {
      this.editor.setAttribute('aria-label', this.getText('aria.cellEditor'));
    }
    if (this.editorTrigger) {
      this.editorTrigger.setAttribute('aria-label', this.getEditorTriggerLabel());
    }
    if (this.dateboxPanel) {
      this.dateboxPanel.setAttribute('aria-label', this.getText('aria.datePicker'));
    }
    if (this.comboboxPanel) {
      this.comboboxPanel.setAttribute('aria-label', this.getText('aria.comboBoxOptions'));
    }
    if (this.empty) {
      this.empty.textContent = this.getText('emptyText');
    }
  };

  FastGrid.prototype.getEditorTriggerLabel = function() {
    if (this.editorIconConfigs && this.editorIconConfigs.length) {
      return this.editorIconConfigs[0].ariaLabel || this.editorIconConfigs[0].label || this.editorIconConfigs[0].title || this.getText('aria.cellEditor');
    }
    return this.editorConfig && this.editorConfig.type === 'combobox' ?
      this.getText('aria.openComboBox') :
      this.getText('aria.openDatePicker');
  };

  FastGrid.prototype.applyThemeOptions = function() {
    if (this.root && this.options.alternatingRowBackground) {
      this.root.style.setProperty('--fg-cell-alt-bg', String(this.options.alternatingRowBackground));
    }
  };

  FastGrid.prototype.bindDomEvents = function() {
    this.bodyScroll.addEventListener('scroll', this._boundScroll);
    this.verticalScrollbar.addEventListener('pointerdown', this._boundVerticalScrollbarPointerDown);
    this.verticalScrollbar.addEventListener('wheel', this._boundVerticalScrollbarWheel, { passive: false });
    document.addEventListener('pointermove', this._boundVerticalScrollbarPointerMove);
    document.addEventListener('pointerup', this._boundVerticalScrollbarPointerUp);
    this.root.addEventListener('click', this._boundClick);
    this.root.addEventListener('pointerdown', this._boundFilterMenuClick, true);
    this.root.addEventListener('mousedown', this._boundFilterMenuClick, true);
    this.root.addEventListener('dblclick', this._boundDblClick);
    this.root.addEventListener('keydown', this._boundKeyDown);
    this.root.addEventListener('mousemove', this._boundMouseMove);
    this.root.addEventListener('mouseleave', this._boundMouseLeave);
    this.root.addEventListener('pointerdown', this._boundPointerDown);
    this.root.addEventListener('wheel', this._boundFixedPaneWheel, { passive: false });
    this.root.addEventListener('touchstart', this._boundFixedPaneTouchStart, { passive: true });
    this.root.addEventListener('touchend', this._boundFixedPaneTouchEnd, { passive: true });
    this.root.addEventListener('touchcancel', this._boundFixedPaneTouchEnd, { passive: true });
    this.root.addEventListener('wheel', this._boundBusyEvent, { passive: false });
    this.root.addEventListener('touchmove', this._boundBusyEvent, { passive: false });
    this.editor.addEventListener('input', this._boundEditorInput);
    this.editor.addEventListener('copy', this._boundEditorCopy);
    this.header.addEventListener('beforeinput', this._boundHeaderSearchBeforeInput);
    this.header.addEventListener('input', this._boundHeaderSearchInput);
    this.editorIconHost.addEventListener('click', this._boundEditorTriggerClick);
    this.dateboxPanel.addEventListener('click', this._boundDateboxClick);
    this.dateboxPanel.addEventListener('change', this._boundDateboxChange);
    this.comboboxPanel.addEventListener('mousedown', this._boundComboboxMouseDown);
    this.filterMenu.addEventListener('pointerdown', this._boundFilterMenuClick, true);
    this.filterMenu.addEventListener('mousedown', this._boundFilterMenuClick, true);
    this.filterMenu.addEventListener('click', this._boundFilterMenuClick);
    document.addEventListener('pointerdown', this._boundFilterMenuClick, true);
    document.addEventListener('mousedown', this._boundFilterMenuClick, true);
    document.addEventListener('click', this._boundFilterMenuClick, true);
    document.addEventListener('mousedown', this._boundDocumentMouseDown);
    document.addEventListener('pointermove', this._boundPointerMove);
    document.addEventListener('pointerup', this._boundPointerUp);
    this.editor.addEventListener('beforeinput', this._boundEditorBeforeInput);
    window.addEventListener('resize', this._boundResize);
  };

  FastGrid.prototype.setItemsSource = function(rows, silent) {
    if (!silent && this.emit('itemsSourceChanging', { rows: rows || [] }) === false) {
      return;
    }
    if (!silent && this.emit('loadingRows', { rows: rows || [] }) === false) {
      return;
    }
    this.source = this.createObservedItemsSource(rows || []);
    this.applyView();
    if (!silent) {
      this.emit('itemsSourceChanged', { rows: this.source });
      this.emit('loadedRows', { rows: this.view });
      this.refresh();
    }
  };

  FastGrid.prototype.createObservedItemsSource = function(rows) {
    var grid = this;
    var proxyCache;
    var proxySet;

    if (this.options.observeItemsSource !== true || typeof Proxy !== 'function' || !Array.isArray(rows)) {
      return rows;
    }

    proxyCache = typeof WeakMap === 'function' ? new WeakMap() : null;
    proxySet = typeof WeakSet === 'function' ? new WeakSet() : null;

    function canObserve(value) {
      return value && typeof value === 'object' &&
        (Array.isArray(value) || Object.prototype.toString.call(value) === '[object Object]');
    }

    function isInternalProperty(property) {
      return typeof property === 'string' && property.indexOf('__fg') === 0;
    }

    function observe(value) {
      var proxy;
      if (!canObserve(value)) {
        return value;
      }
      if (proxySet && proxySet.has(value)) {
        return value;
      }
      if (proxyCache && proxyCache.has(value)) {
        return proxyCache.get(value);
      }
      proxy = new Proxy(value, {
        get: function(target, property) {
          return observe(target[property]);
        },
        set: function(target, property, nextValue) {
          var previousValue = target[property];
          var observedValue = observe(nextValue);
          target[property] = observedValue;
          if (previousValue !== observedValue && !isInternalProperty(property)) {
            grid.handleObservedItemsSourceChange();
          }
          return true;
        },
        deleteProperty: function(target, property) {
          var changed = Object.prototype.hasOwnProperty.call(target, property);
          delete target[property];
          if (changed && !isInternalProperty(property)) {
            grid.handleObservedItemsSourceChange();
          }
          return true;
        }
      });
      if (proxyCache) {
        proxyCache.set(value, proxy);
      }
      if (proxySet) {
        proxySet.add(proxy);
      }
      return proxy;
    }

    return observe(rows);
  };

  FastGrid.prototype.handleObservedItemsSourceChange = function() {
    if (this.disposed || this._suppressObservedItemChange || this._handlingObservedItemChange) {
      return;
    }
    this._handlingObservedItemChange = true;
    try {
      this.applyView();
      this.refresh();
    } finally {
      this._handlingObservedItemChange = false;
    }
  };

  FastGrid.prototype.setColumns = function(columns, silent) {
    var i;
    var col;
    this.columns = [];
    for (i = 0; i < (columns || []).length; i += 1) {
      col = mergeOptions({
        binding: '',
        header: '',
        width: 120,
        minWidth: 48,
        align: '',
        dataType: 'string',
        visible: true,
        formatter: null,
        footer: null,
        footerFormatter: null,
        aggregate: null,
        editor: null,
        thousandsSeparator: null,
        mask: '',
        autoUnmask: false,
        maskValueIncludesLiterals: null,
        readOnly: false
      }, columns[i]);
      col.editor = normalizeEditorConfig(col.editor, col);
      col._index = i;
      col._width = Math.max(toNumber(col.width, 120), toNumber(col.minWidth, 48));
      this.columns.push(col);
    }
    this.updateLayout();
    if (!silent) {
      this.refresh();
    }
  };

  FastGrid.prototype.setRowGroups = function(groups, silent) {
    this.options.rowGroups = Array.isArray(groups) ? groups.slice() : [];
    this.applyView();
    this.resetVerticalScroll();
    if (!silent) {
      this.refresh();
    }
  };

  FastGrid.prototype.setFrozenColumns = function(count) {
    this.options.frozenColumns = Math.max(0, toNumber(count, 0));
    this.updateLayout();
    this.refresh();
  };

  FastGrid.prototype.setFrozenRightColumns = function(count) {
    this.options.frozenRightColumns = Math.max(0, toNumber(count, 0));
    this.updateLayout();
    this.refresh();
  };

  FastGrid.prototype.setShowRowHeaders = function(value) {
    this.options.showRowHeaders = normalizeRowHeaderMode(value);
    this.updateLayout();
    this.refresh();
  };

  FastGrid.prototype.setShowFooter = function(value) {
    this.options.showFooter = value === true;
    this.refresh();
  };

  FastGrid.prototype.setShowSearchRow = function(value) {
    this.options.showSearchRow = value === true;
    if (!this.options.showSearchRow) {
      this.cancelHeaderSearchTimer();
      this.hideFilterMenu();
    }
    this.applyView();
    this.resetScroll();
    this.refresh();
  };

  FastGrid.prototype.setEditMode = function(value) {
    var enabled = value === true;
    this.options.allowEditing = enabled;
    this.options.editOnSelect = enabled;
    if (!enabled) {
      this.finishEditing(false);
    }
    this.render();
  };

  FastGrid.prototype.setMultiSelectRows = function(value) {
    this.options.multiSelectRows = value === true;
    if (!this.options.multiSelectRows) {
      this.selectedRowMap = {};
      this.resetSelectedItemSelection([]);
      if (this.rowSelection == null && this.view.length) {
        this.rowSelection = this.selection.row;
      }
    }
    this.updateLayout();
    this.refresh();
  };

  FastGrid.prototype.setHeaderDisplayMode = function(mode) {
    mode = normalizeHeaderDisplayMode(mode);
    this.options.headerDisplayMode = mode;
    this.headerDisplayMode = mode;
    if (this.root) {
      this.renderHeaders(this.columnRange);
    }
  };

  FastGrid.prototype.toggleHeaderDisplayMode = function() {
    this.setHeaderDisplayMode(this.headerDisplayMode === 'binding' ? 'header' : 'binding');
    return this.headerDisplayMode;
  };

  FastGrid.prototype.getHeaderDisplayMode = function() {
    return this.headerDisplayMode || 'header';
  };

  FastGrid.prototype.setFilter = function(predicate) {
    this.filterPredicate = typeof predicate === 'function' ? predicate : null;
    this.applyView();
    this.resetScroll();
    this.refresh();
  };

  FastGrid.prototype.clearFilter = function() {
    this.filterPredicate = null;
    this.searchText = '';
    this.columnSearchValues = {};
    this.columnSearchOperators = {};
    this.cancelHeaderSearchTimer();
    this.hideFilterMenu();
    this.updateColumnSearchState();
    this.applyView();
    this.resetVerticalScroll();
    this.refresh();
  };

  FastGrid.prototype.setSearch = function(text) {
    this.searchText = String(text || '').toLowerCase();
    this.applyView();
    this.resetScroll();
    this.refresh();
  };

  FastGrid.prototype.setColumnSearch = function(column, value) {
    var col = typeof column === 'number' ? this.visibleColumns[column] || this.columns[column] : typeof column === 'object' ? column : this.getColumn(column);
    var key;
    if (!col) {
      return;
    }
    this.cancelHeaderSearchTimer();
    key = getColumnSearchKey(col);
    value = String(value == null ? '' : value).trim();
    if (value) {
      this.columnSearchValues[key] = value;
    } else {
      delete this.columnSearchValues[key];
    }
    this.updateColumnSearchState();
    this.applyView();
    this.resetVerticalScroll();
    this.refresh();
  };

  FastGrid.prototype.setColumnSearchOperator = function(column, operator) {
    var col = typeof column === 'number' ? this.visibleColumns[column] || this.columns[column] : typeof column === 'object' ? column : this.getColumn(column);
    var key;
    if (!col) {
      return;
    }
    key = getColumnSearchKey(col);
    operator = normalizeColumnSearchOperator(operator);
    if (operator) {
      this.columnSearchOperators[key] = operator;
    } else {
      delete this.columnSearchOperators[key];
    }
    this.hideFilterMenu();
    this.applyView();
    this.resetVerticalScroll();
    this.refresh();
  };

  FastGrid.prototype.applyHeaderSearch = function(colIndex, selectionStart, selectionEnd) {
    this.applyView();
    this.resetVerticalScroll();
    this.refresh();
    this.focusHeaderSearchInput(colIndex, selectionStart, selectionEnd);
  };

  FastGrid.prototype.clearColumnSearch = function() {
    this.columnSearchValues = {};
    this.columnSearchOperators = {};
    this.cancelHeaderSearchTimer();
    this.updateColumnSearchState();
    this.applyView();
    this.resetScroll();
    this.refresh();
  };

  FastGrid.prototype.clearSearchConditions = function(source) {
    this.searchText = '';
    this.columnSearchValues = {};
    this.columnSearchOperators = {};
    this.cancelHeaderSearchTimer();
    this.hideFilterMenu();
    this.updateColumnSearchState();
    this.applyView();
    this.resetVerticalScroll();
    this.refresh();
    this.emit('searchCleared', { source: source || 'api' });
  };

  FastGrid.prototype.cancelHeaderSearchTimer = function() {
    if (this.headerSearchTimer) {
      window.clearTimeout(this.headerSearchTimer);
      this.headerSearchTimer = 0;
    }
  };

  FastGrid.prototype.scheduleHeaderSearch = function(colIndex, selectionStart, selectionEnd) {
    var self = this;
    var delay = Math.max(0, toNumber(this.options.searchDelay, DEFAULT_OPTIONS.searchDelay));
    this.cancelHeaderSearchTimer();
    if (delay === 0) {
      this.applyHeaderSearch(colIndex, selectionStart, selectionEnd);
      return;
    }
    this.headerSearchTimer = window.setTimeout(function() {
      var activeInput = self.getActiveHeaderSearchInput();
      self.headerSearchTimer = 0;
      if (activeInput) {
        colIndex = toNumber(activeInput.getAttribute('data-col'), colIndex);
        selectionStart = activeInput.selectionStart;
        selectionEnd = activeInput.selectionEnd;
        self.applyHeaderSearch(colIndex, selectionStart, selectionEnd);
      } else {
        self.applyView();
        self.resetVerticalScroll();
        self.refresh();
      }
    }, delay);
  };

  FastGrid.prototype.refresh = function() {
    if (this.emit('refreshing', {}) === false) {
      return;
    }
    this.updateLayout();
    this.render();
    this.emit('refreshed', {});
  };

  FastGrid.prototype.invalidate = function() {
    this.scheduleRender();
  };

  FastGrid.prototype.getHeaderHeight = function() {
    return toNumber(this.options.headerHeight, DEFAULT_OPTIONS.headerHeight) + this.getSearchRowHeight();
  };

  FastGrid.prototype.getHeaderTitleHeight = function() {
    return toNumber(this.options.headerHeight, DEFAULT_OPTIONS.headerHeight);
  };

  FastGrid.prototype.getSearchRowHeight = function() {
    var fallback = toNumber(this.options.rowHeight, DEFAULT_OPTIONS.rowHeight);
    var height = this.options.searchRowHeight == null ? fallback : toNumber(this.options.searchRowHeight, fallback);
    return this.options.showSearchRow === true ? Math.max(22, height) : 0;
  };

  FastGrid.prototype.syncHeaderLayout = function() {
    var height = this.getHeaderHeight();
    var titleHeight = this.getHeaderTitleHeight();
    var searchHeight = this.getSearchRowHeight();
    if (!this.header || !this.body) {
      return;
    }
    this.root.style.setProperty('--fg-header-title-height', titleHeight + 'px');
    this.root.style.setProperty('--fg-search-row-height', searchHeight + 'px');
    this.header.style.height = height + 'px';
    this.body.style.top = height + 'px';
  };

  FastGrid.prototype.dispose = function() {
    var name;
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
    }
    if (this.headerSearchFocusRaf) {
      cancelAnimationFrame(this.headerSearchFocusRaf);
      this.headerSearchFocusRaf = 0;
    }
    this.cancelHeaderSearchTimer();
    this.finishEditing(false);
    this.bodyScroll.removeEventListener('scroll', this._boundScroll);
    this.verticalScrollbar.removeEventListener('pointerdown', this._boundVerticalScrollbarPointerDown);
    this.verticalScrollbar.removeEventListener('wheel', this._boundVerticalScrollbarWheel);
    document.removeEventListener('pointermove', this._boundVerticalScrollbarPointerMove);
    document.removeEventListener('pointerup', this._boundVerticalScrollbarPointerUp);
    this.root.removeEventListener('click', this._boundClick);
    this.root.removeEventListener('pointerdown', this._boundFilterMenuClick, true);
    this.root.removeEventListener('mousedown', this._boundFilterMenuClick, true);
    this.root.removeEventListener('dblclick', this._boundDblClick);
    this.root.removeEventListener('keydown', this._boundKeyDown);
    this.root.removeEventListener('mousemove', this._boundMouseMove);
    this.root.removeEventListener('mouseleave', this._boundMouseLeave);
    this.root.removeEventListener('pointerdown', this._boundPointerDown);
    this.root.removeEventListener('wheel', this._boundFixedPaneWheel);
    this.root.removeEventListener('touchstart', this._boundFixedPaneTouchStart);
    this.root.removeEventListener('touchend', this._boundFixedPaneTouchEnd);
    this.root.removeEventListener('touchcancel', this._boundFixedPaneTouchEnd);
    this.root.removeEventListener('wheel', this._boundBusyEvent);
    this.root.removeEventListener('touchmove', this._boundBusyEvent);
    this.editor.removeEventListener('input', this._boundEditorInput);
    this.editor.removeEventListener('copy', this._boundEditorCopy);
    this.header.removeEventListener('beforeinput', this._boundHeaderSearchBeforeInput);
    this.header.removeEventListener('input', this._boundHeaderSearchInput);
    this.editorIconHost.removeEventListener('click', this._boundEditorTriggerClick);
    this.dateboxPanel.removeEventListener('click', this._boundDateboxClick);
    this.dateboxPanel.removeEventListener('change', this._boundDateboxChange);
    this.comboboxPanel.removeEventListener('mousedown', this._boundComboboxMouseDown);
    this.filterMenu.removeEventListener('pointerdown', this._boundFilterMenuClick, true);
    this.filterMenu.removeEventListener('mousedown', this._boundFilterMenuClick, true);
    this.filterMenu.removeEventListener('click', this._boundFilterMenuClick);
    document.removeEventListener('pointerdown', this._boundFilterMenuClick, true);
    document.removeEventListener('mousedown', this._boundFilterMenuClick, true);
    document.removeEventListener('click', this._boundFilterMenuClick, true);
    document.removeEventListener('mousedown', this._boundDocumentMouseDown);
    document.removeEventListener('pointermove', this._boundPointerMove);
    document.removeEventListener('pointerup', this._boundPointerUp);
    this.editor.removeEventListener('beforeinput', this._boundEditorBeforeInput);
    window.removeEventListener('resize', this._boundResize);
    this.host.innerHTML = '';
    this.events = {};
    for (name in this.wijmoEvents) {
      if (Object.prototype.hasOwnProperty.call(this.wijmoEvents, name)) {
        this.wijmoEvents[name].clearHandlers();
      }
    }
  };

  FastGrid.prototype.setBusy = function(value, text) {
    this.busy = value === true;
    if (!this.busyOverlay) {
      return;
    }
    this.root.setAttribute('aria-busy', this.busy ? 'true' : 'false');
    if (this.busyText) {
      this.busyText.textContent = text || this.options.exportBusyText || this.getText('workingText');
    }
    this.busyOverlay.style.display = this.busy ? 'flex' : 'none';
  };

  FastGrid.prototype.blockBusyEvent = function(event) {
    if (!this.busy) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  FastGrid.prototype.handleFixedPaneTouchStart = function(event) {
    var touch;
    var target;
    this.fixedPaneTouchTap = null;
    if (this.busy || !this.bodyScroll || event.touches.length !== 1) {
      return;
    }
    touch = event.touches[0];
    target = this.getFixedPaneTouchTarget(touch.clientX, touch.clientY);
    if (!target) {
      return;
    }
    this.fixedPaneTouchTap = {
      x: touch.clientX,
      y: touch.clientY,
      row: target.row,
      col: target.col,
      area: target.area
    };
  };

  FastGrid.prototype.handleFixedPaneTouchEnd = function(event) {
    var state = this.fixedPaneTouchTap;
    var touch;
    var dx;
    var dy;
    if (!state || this.busy || event.type === 'touchcancel') {
      this.fixedPaneTouchTap = null;
      return;
    }
    touch = event.changedTouches && event.changedTouches[0];
    this.fixedPaneTouchTap = null;
    if (!touch) {
      return;
    }
    dx = Math.abs(touch.clientX - state.x);
    dy = Math.abs(touch.clientY - state.y);
    if (dx > 8 || dy > 8) {
      return;
    }
    this.selectFixedPaneTouchRow(state.row, state.col, state.area);
  };

  FastGrid.prototype.selectFixedPaneTouchRow = function(rowIndex, colIndex, area) {
    if (rowIndex < 0 || rowIndex >= this.view.length) {
      return;
    }
    if (this.editing && (this.editing.row !== rowIndex || this.editing.col !== colIndex)) {
      if (this.finishEditing(true) === false) {
        return;
      }
    }
    if (area === 'selection' || area === 'rowHeader') {
      this.toggleRowSelection(rowIndex, colIndex);
    } else if (this.shouldEditOnSelect(rowIndex, colIndex)) {
      this.selectRow(rowIndex, colIndex);
    } else {
      this.toggleRowSelection(rowIndex, colIndex);
    }
    this.scrollIntoView(rowIndex, colIndex);
    this.fixedPaneTouchClickUntil = Date.now() + 700;
    this.root.focus();
  };

  FastGrid.prototype.getFixedPaneTouchTarget = function(clientX, clientY) {
    var bodyRect;
    var rowIndex;
    var target;
    if (!this.bodyScroll || !this.view.length) {
      return null;
    }
    bodyRect = this.bodyScroll.getBoundingClientRect();
    if (clientY < bodyRect.top || clientY > bodyRect.bottom) {
      return null;
    }
    rowIndex = Math.floor((this.bodyScroll.scrollTop + clientY - bodyRect.top) / this.options.rowHeight);
    if (rowIndex < 0 || rowIndex >= this.view.length) {
      return null;
    }
    target = this.getFixedPaneTouchColumn(clientX, clientY, this.frozenPane, 0, this.frozenColumns, 'left');
    if (target) {
      target.row = rowIndex;
      return target;
    }
    target = this.getFixedPaneTouchColumn(clientX, clientY, this.frozenRightPane, this.scrollableColumnEnd, this.visibleColumns.length, 'right');
    if (target) {
      target.row = rowIndex;
      return target;
    }
    if (isPointInElement(clientX, clientY, this.selectionPane)) {
      return { row: rowIndex, col: this.selection.col, area: 'selection' };
    }
    if (isPointInElement(clientX, clientY, this.rowHeaderPane)) {
      return { row: rowIndex, col: this.selection.col, area: 'rowHeader' };
    }
    return null;
  };

  FastGrid.prototype.getFixedPaneTouchColumn = function(clientX, clientY, pane, startCol, endCol, area) {
    var rect;
    var localX;
    var i;
    var column;
    if (!pane || pane.style.display === 'none' || !isPointInElement(clientX, clientY, pane)) {
      return null;
    }
    rect = pane.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right) {
      return null;
    }
    localX = clientX - rect.left;
    for (i = startCol; i < endCol; i += 1) {
      column = this.visibleColumns[i];
      if (!column) {
        continue;
      }
      if (area === 'right') {
        if (localX >= column._left - this.frozenRightStartLeft && localX < column._left - this.frozenRightStartLeft + column._width) {
          return { col: i, area: area };
        }
      } else if (localX >= column._left && localX < column._left + column._width) {
        return { col: i, area: area };
      }
    }
    return null;
  };

  FastGrid.prototype.handleFixedPaneWheel = function(event) {
    var isFixedTarget;
    var isScrollableTarget;
    var maxScrollTop;
    var maxScrollLeft;
    var deltaFactor = 1;
    var deltaX;
    var deltaY;
    var nextTop;
    var nextLeft;
    if (this.busy || !this.bodyScroll || event.ctrlKey) {
      return;
    }
    isFixedTarget = this.isFixedPaneScrollTarget(event.target);
    isScrollableTarget = !!closest(event.target, 'fg-body-scroll');
    if (!isFixedTarget && !isScrollableTarget) {
      return;
    }
    if (event.deltaMode === 1) {
      deltaFactor = Math.max(1, this.options.rowHeight);
    } else if (event.deltaMode === 2) {
      deltaFactor = Math.max(1, this.getScrollableContentHeight());
    }
    deltaX = event.deltaX * deltaFactor;
    deltaY = event.deltaY * deltaFactor;
    if (event.shiftKey && !deltaX && deltaY) {
      deltaX = deltaY;
      deltaY = 0;
    }
    maxScrollTop = Math.max(0, this.bodyScroll.scrollHeight - this.bodyScroll.clientHeight);
    maxScrollLeft = Math.max(0, this.bodyScroll.scrollWidth - this.bodyScroll.clientWidth);
    nextTop = clamp(this.bodyScroll.scrollTop + deltaY, 0, maxScrollTop);
    nextLeft = clamp(this.bodyScroll.scrollLeft + deltaX, 0, maxScrollLeft);
    if (nextTop === this.bodyScroll.scrollTop && nextLeft === this.bodyScroll.scrollLeft) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.bodyScroll.scrollTop = nextTop;
    this.bodyScroll.scrollLeft = nextLeft;
    this.handleScroll();
  };

  FastGrid.prototype.isFixedPaneScrollTarget = function(target) {
    return !!(
      closest(target, 'fg-frozen-pane') ||
      closest(target, 'fg-frozen-pane-right') ||
      closest(target, 'fg-row-header-pane') ||
      closest(target, 'fg-selection-pane')
    );
  };

  FastGrid.prototype.applyView = function() {
    var rows = this.source.slice();
    var filterPredicate = this.filterPredicate;
    var searchText = this.searchText;
    var columnSearchValues = this.options.showSearchRow === true && this.hasColumnSearch ? this.columnSearchValues : null;
    var columnSearchOperators = this.options.showSearchRow === true && this.hasColumnSearch ? this.columnSearchOperators : null;
    var columns = this.columns;
    var sortStates = this.getSortStates();
    var selectionState = this.captureSelectionState();
    var indexedRows;

    if (filterPredicate || searchText || columnSearchValues) {
      rows = rows.filter(function(item, index) {
        if (filterPredicate && !filterPredicate(item, index)) {
          return false;
        }
        if (!searchText) {
          return !columnSearchValues || rowMatchesColumnSearch(item, columns, columnSearchValues, columnSearchOperators);
        }
        return rowMatchesSearch(item, columns, searchText) && (!columnSearchValues || rowMatchesColumnSearch(item, columns, columnSearchValues, columnSearchOperators));
      });
    }

    if (sortStates.length) {
      indexedRows = rows.map(function(item, index) {
        return { item: item, index: index };
      });
      indexedRows.sort(function(a, b) {
        var comparison;
        var sortState;
        var i;
        for (i = 0; i < sortStates.length; i += 1) {
          sortState = sortStates[i];
          comparison = compareValues(
            getByBinding(a.item, sortState.column.binding),
            getByBinding(b.item, sortState.column.binding),
            sortState.column.dataType
          ) * sortState.direction;
          if (comparison) {
            return comparison;
          }
        }
        return a.index - b.index;
      });
      rows = indexedRows.map(function(entry) {
        return entry.item;
      });
    }

    this.dataView = rows;
    this.view = this.createGroupedView(rows);
    this.refreshInvalidItemRows();
    this.restoreSelectionState(selectionState);
    this.clampSelection();
    this.syncEditingWithView();
  };

  FastGrid.prototype.createGroupedView = function(rows) {
    var groups = Array.isArray(this.options.rowGroups) ? this.options.rowGroups : [];
    var configs = [];
    var output = [];
    var i;
    for (i = 0; i < groups.length && configs.length < 3; i += 1) {
      if (groups[i]) {
        configs.push(groups[i]);
      }
    }
    if (!configs.length) {
      return rows;
    }

    this.appendGroupedRows(output, rows, configs, 0, '');
    return output;
  };

  FastGrid.prototype.appendGroupedRows = function(output, rows, configs, level, parentStateKey) {
    var config = configs[level];
    var buckets = [];
    var lookup = {};
    var item;
    var key;
    var bucket;
    var stateKey;
    var i;
    if (!config) {
      return;
    }
    for (i = 0; i < rows.length; i += 1) {
      item = rows[i];
      key = this.getRowGroupKey(item, config, i);
      if (!Object.prototype.hasOwnProperty.call(lookup, key)) {
        bucket = {
          key: key,
          items: [],
          firstItem: item
        };
        lookup[key] = bucket;
        buckets.push(bucket);
      }
      lookup[key].items.push(item);
    }
    for (i = 0; i < buckets.length; i += 1) {
      bucket = buckets[i];
      stateKey = this.getRowGroupStateKey(parentStateKey, bucket.key, level);
      item = this.createRowGroupItem(bucket, config, level, stateKey);
      output.push(item);
      if (!item.collapsed) {
        if (level + 1 < configs.length) {
          this.appendGroupedRows(output, bucket.items, configs, level + 1, stateKey);
        } else {
          Array.prototype.push.apply(output, bucket.items);
        }
      }
    }
  };

  FastGrid.prototype.getRowGroupStateKey = function(parentStateKey, key, level) {
    if (!parentStateKey && level === 0) {
      return key;
    }
    return parentStateKey + '\u001f' + level + ':' + key;
  };

  FastGrid.prototype.getRowGroupKey = function(item, config, index) {
    var getter = config.key || config.getKey;
    var bindings = config.bindings || config.binding || config.fields || config.field;
    var values = [];
    var i;
    if (typeof getter === 'function') {
      return String(getter({ grid: this, item: item, row: index }));
    }
    if (!Array.isArray(bindings)) {
      bindings = bindings == null ? [] : [bindings];
    }
    for (i = 0; i < bindings.length; i += 1) {
      values.push(getByBinding(item, bindings[i]));
    }
    return values.join('_');
  };

  FastGrid.prototype.createRowGroupItem = function(bucket, config, level, stateKey) {
    var formatter = config.header || config.formatter || config.label;
    var headerText = this.getRowGroupHeaderText(config);
    var label;
    var item = {
      __fgRowType: 'group',
      key: bucket.key,
      stateKey: stateKey,
      level: level,
      items: bucket.items,
      count: bucket.items.length,
      collapsed: this.rowGroupState[stateKey] === true,
      aggregates: this.calculateRowGroupAggregates(bucket.items)
    };
    if (typeof formatter === 'function') {
      label = formatter({
        grid: this,
        key: bucket.key,
        item: bucket.firstItem,
        items: bucket.items,
        count: bucket.items.length,
        level: level,
        config: config,
        header: headerText
      });
    } else {
      label = headerText ? headerText + ': ' + bucket.key : bucket.key;
    }
    item.label = label == null ? '' : String(label);
    return item;
  };

  FastGrid.prototype.getRowGroupHeaderText = function(config) {
    var bindings = config && (config.bindings || config.binding || config.fields || config.field);
    var labels = [];
    var column;
    var i;
    if (!Array.isArray(bindings)) {
      bindings = bindings == null ? [] : [bindings];
    }
    for (i = 0; i < bindings.length; i += 1) {
      column = this.getColumn(bindings[i]);
      labels.push(column && column.header ? column.header : String(bindings[i]));
    }
    return labels.join(' + ');
  };

  FastGrid.prototype.createRowGroupFooterItem = function(group) {
    return {
      __fgRowType: 'groupFooter',
      key: group.key,
      stateKey: group.stateKey,
      level: group.level,
      group: group,
      items: group.items,
      count: group.count,
      aggregates: group.aggregates
    };
  };

  FastGrid.prototype.calculateRowGroupAggregates = function(rows) {
    var values = {};
    var i;
    var column;
    for (i = 0; i < this.columns.length; i += 1) {
      column = this.columns[i];
      if (column.aggregate && column.binding) {
        values[column.binding] = this.calculateAggregateForRows(column.aggregate, column, rows);
      }
    }
    return values;
  };

  FastGrid.prototype.updateLayout = function() {
    var i;
    var left = 0;
    var visibleColumns = [];
    var frozenCount;
    var frozenRightCount;

    this.emit('updatingLayout', {});
    for (i = 0; i < this.columns.length; i += 1) {
      if (this.columns[i].visible !== false) {
        visibleColumns.push(this.columns[i]);
      }
    }
    this.visibleColumns = visibleColumns;
    frozenCount = Math.min(Math.max(0, toNumber(this.options.frozenColumns, 0)), visibleColumns.length);
    frozenRightCount = Math.min(
      Math.max(0, toNumber(this.options.frozenRightColumns, 0)),
      Math.max(0, visibleColumns.length - frozenCount)
    );
    this._frozenColumns = frozenCount;
    this._frozenRightColumns = frozenRightCount;
    this.columnOffsets = [];

    for (i = 0; i < visibleColumns.length; i += 1) {
      visibleColumns[i]._viewIndex = i;
      visibleColumns[i]._left = left;
      this.columnOffsets.push(left);
      left += visibleColumns[i]._width;
    }

    this.totalWidth = left;
    this.scrollableColumnEnd = Math.max(frozenCount, visibleColumns.length - frozenRightCount);
    this.frozenWidth = frozenCount > 0 ? visibleColumns[frozenCount - 1]._left + visibleColumns[frozenCount - 1]._width : 0;
    this.frozenRightStartLeft = frozenRightCount > 0 && visibleColumns[this.scrollableColumnEnd] ? visibleColumns[this.scrollableColumnEnd]._left : this.totalWidth;
    this.frozenRightWidth = frozenRightCount > 0 ? this.totalWidth - this.frozenRightStartLeft : 0;
    this.scrollableWidth = Math.max(0, this.totalWidth - this.frozenWidth - this.frozenRightWidth);
    this.emit('updatedLayout', {});
  };

  FastGrid.prototype.resetScroll = function() {
    if (this.bodyScroll) {
      this.bodyScroll.scrollTop = 0;
      this.bodyScroll.scrollLeft = 0;
    }
  };

  FastGrid.prototype.resetVerticalScroll = function() {
    if (this.bodyScroll) {
      this.bodyScroll.scrollTop = 0;
    }
  };

  FastGrid.prototype.scheduleRender = function() {
    var self = this;
    if (this.raf || this.disposed) {
      return;
    }
    this.raf = requestAnimationFrame(function() {
      self.raf = 0;
      self.render();
    });
  };

  FastGrid.prototype.handleScroll = function() {
    this.hideInvalidTip();
    if (this.isFilterMenuOpen()) {
      this.hideFilterMenu();
    }
    if (this.isDateboxPanelOpen()) {
      this.hideDateboxPanel();
    }
    if (this.isComboboxPanelOpen()) {
      this.hideComboboxPanel();
    }
    this.updateScrollState();
    this.syncFixedPaneScrollOffset();
    this.updateVerticalScrollbar();
    if (this.shouldRenderScrollImmediately()) {
      if (this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
      }
      this.render();
    } else {
      this.scheduleRender();
    }
    if (this.editing) {
      this.positionEditor();
    }
    this.emit('scrollPositionChanged', {
      scrollTop: this.bodyScroll.scrollTop,
      scrollLeft: this.bodyScroll.scrollLeft
    });
  };

  FastGrid.prototype.updateScrollState = function() {
    var top = this.bodyScroll ? this.bodyScroll.scrollTop : 0;
    var left = this.bodyScroll ? this.bodyScroll.scrollLeft : 0;
    var rowHeight = Math.max(1, toNumber(this.options.rowHeight, 32));
    var maxExtraRows = Math.max(0, toNumber(this.options.fastScrollOverscanRows, 64));
    var rowDelta = Math.ceil(Math.abs(top - this.scrollState.top) / rowHeight);
    var targetExtraRows = Math.min(maxExtraRows, rowDelta * 2);
    if (top > this.scrollState.top) {
      this.scrollState.directionY = 1;
    } else if (top < this.scrollState.top) {
      this.scrollState.directionY = -1;
    }
    this.scrollState.extraRows = Math.max(targetExtraRows, Math.floor(this.scrollState.extraRows * 0.65));
    this.scrollState.top = top;
    this.scrollState.left = left;
  };

  FastGrid.prototype.syncFixedPaneScrollOffset = function() {
    var offset;
    var transform;
    if (this.options.syncScrollRender === false || !this.bodyScroll) {
      return;
    }
    offset = this.renderedScrollTop - this.bodyScroll.scrollTop;
    transform = offset ? 'translate3d(0,' + offset + 'px,0)' : '';
    this.frozenLayer.style.transform = transform;
    this.frozenRightLayer.style.transform = transform;
    this.rowHeaderLayer.style.transform = transform;
    this.selectionLayer.style.transform = transform;
  };

  FastGrid.prototype.resetFixedPaneScrollOffset = function() {
    this.renderedScrollTop = this.bodyScroll ? this.bodyScroll.scrollTop : 0;
    this.frozenLayer.style.transform = '';
    this.frozenRightLayer.style.transform = '';
    this.rowHeaderLayer.style.transform = '';
    this.selectionLayer.style.transform = '';
  };

  FastGrid.prototype.updateVerticalScrollbar = function(metrics, totalHeight, bodyPaneBottom) {
    var footerHeight;
    var scrollbarGutterSize;
    var footerOffsetBottom;
    var trackHeight;
    var contentHeight;
    var maxScrollTop;
    var thumbHeight;
    var maxThumbTop;
    var thumbTop;
    if (!this.verticalScrollbar || !this.verticalScrollbarThumb || !this.bodyScroll) {
      return;
    }
    metrics = metrics || this.getViewportMetrics();
    totalHeight = totalHeight == null ? this.view.length * this.options.rowHeight : totalHeight;
    if (bodyPaneBottom == null) {
      footerHeight = this.getFooterHeight();
      scrollbarGutterSize = this.getScrollbarGutterSize();
      footerOffsetBottom = footerHeight > 0 && totalHeight < metrics.contentHeight ?
        Math.max(0, metrics.height - scrollbarGutterSize - totalHeight - footerHeight) :
        scrollbarGutterSize;
      bodyPaneBottom = footerOffsetBottom + footerHeight;
    }
    trackHeight = Math.max(0, metrics.height - bodyPaneBottom);
    contentHeight = Math.max(0, metrics.contentHeight);
    maxScrollTop = Math.max(0, totalHeight - contentHeight);
    if (trackHeight <= 0 || maxScrollTop <= 0) {
      this.verticalScrollbar.style.display = 'none';
      return;
    }
    thumbHeight = Math.max(24, Math.min(trackHeight, Math.round(trackHeight * contentHeight / Math.max(contentHeight, totalHeight))));
    maxThumbTop = Math.max(0, trackHeight - thumbHeight);
    thumbTop = maxThumbTop > 0 ? Math.round((this.bodyScroll.scrollTop / maxScrollTop) * maxThumbTop) : 0;
    this.verticalScrollbar.style.display = 'block';
    this.verticalScrollbar.style.bottom = bodyPaneBottom + 'px';
    this.verticalScrollbarThumb.style.height = thumbHeight + 'px';
    this.verticalScrollbarThumb.style.transform = 'translate3d(0,' + thumbTop + 'px,0)';
  };

  FastGrid.prototype.getVerticalScrollbarDragInfo = function() {
    var metrics = this.getViewportMetrics();
    var totalHeight = this.view.length * this.options.rowHeight;
    var contentHeight = Math.max(0, metrics.contentHeight);
    var maxScrollTop = Math.max(0, totalHeight - contentHeight);
    var trackRect;
    var thumbRect;
    var trackHeight;
    var thumbHeight;
    if (!this.verticalScrollbarTrack || !this.verticalScrollbarThumb || maxScrollTop <= 0) {
      return null;
    }
    trackRect = this.verticalScrollbarTrack.getBoundingClientRect();
    thumbRect = this.verticalScrollbarThumb.getBoundingClientRect();
    trackHeight = Math.max(0, trackRect.height);
    thumbHeight = Math.max(0, thumbRect.height);
    if (trackHeight <= 0 || thumbHeight <= 0 || trackHeight <= thumbHeight) {
      return null;
    }
    return {
      maxScrollTop: maxScrollTop,
      maxThumbTop: trackHeight - thumbHeight,
      trackTop: trackRect.top,
      thumbHeight: thumbHeight
    };
  };

  FastGrid.prototype.handleVerticalScrollbarPointerDown = function(event) {
    var info;
    var thumbTop;
    if (this.busy || !this.bodyScroll) {
      return;
    }
    info = this.getVerticalScrollbarDragInfo();
    if (!info) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (event.target !== this.verticalScrollbarThumb) {
      thumbTop = clamp(event.clientY - info.trackTop - info.thumbHeight / 2, 0, info.maxThumbTop);
      this.bodyScroll.scrollTop = info.maxScrollTop * (thumbTop / info.maxThumbTop);
    }
    if (this.verticalScrollbar && this.verticalScrollbar.setPointerCapture && event.pointerId != null) {
      this.verticalScrollbar.setPointerCapture(event.pointerId);
    }
    this.verticalScrollbarDrag = {
      startY: event.clientY,
      startScrollTop: this.bodyScroll.scrollTop,
      maxScrollTop: info.maxScrollTop,
      maxThumbTop: info.maxThumbTop,
      pointerId: event.pointerId
    };
    this.root.classList.add('fg-scrollbar-v-dragging');
  };

  FastGrid.prototype.handleVerticalScrollbarPointerMove = function(event) {
    var state = this.verticalScrollbarDrag;
    var delta;
    if (!state || !this.bodyScroll) {
      return;
    }
    if (state.pointerId != null && event.pointerId != null && state.pointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    delta = event.clientY - state.startY;
    this.bodyScroll.scrollTop = clamp(state.startScrollTop + (delta / state.maxThumbTop) * state.maxScrollTop, 0, state.maxScrollTop);
  };

  FastGrid.prototype.handleVerticalScrollbarPointerUp = function(event) {
    if (!this.verticalScrollbarDrag) {
      return;
    }
    if (this.verticalScrollbar && this.verticalScrollbar.releasePointerCapture && event.pointerId != null) {
      try {
        this.verticalScrollbar.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Pointer capture may already be released by the browser.
      }
    }
    this.verticalScrollbarDrag = null;
    this.root.classList.remove('fg-scrollbar-v-dragging');
  };

  FastGrid.prototype.handleVerticalScrollbarWheel = function(event) {
    var maxScrollTop;
    var nextTop;
    if (!this.bodyScroll) {
      return;
    }
    maxScrollTop = Math.max(0, this.bodyScroll.scrollHeight - this.bodyScroll.clientHeight);
    nextTop = clamp(this.bodyScroll.scrollTop + event.deltaY, 0, maxScrollTop);
    if (nextTop === this.bodyScroll.scrollTop) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.bodyScroll.scrollTop = nextTop;
  };

  FastGrid.prototype.shouldRenderScrollImmediately = function() {
    var metrics;
    var visibleRowStart;
    var visibleRowEnd;
    var viewportWidth;
    var nextColumnRange;
    if (this.options.syncScrollRender === false || !this.bodyScroll || !this.view.length) {
      return false;
    }
    metrics = this.getViewportMetrics();
    visibleRowStart = Math.floor(metrics.scrollTop / this.options.rowHeight);
    visibleRowEnd = Math.min(this.view.length, Math.ceil((metrics.scrollTop + metrics.contentHeight) / this.options.rowHeight));
    if (
      visibleRowStart < this.rowRange.start ||
      visibleRowEnd > this.rowRange.end
    ) {
      return true;
    }
    viewportWidth = Math.max(
      0,
      metrics.width - this.getFixedLeftWidth() - this.frozenWidth - this.frozenRightWidth
    );
    nextColumnRange = this.getColumnRange(metrics.scrollLeft, viewportWidth);
    return nextColumnRange.start < this.columnRange.start ||
      nextColumnRange.end > this.columnRange.end;
  };

  FastGrid.prototype.render = function() {
    var metrics;
    var rowRange;
    var colRange;
    var scrollLeft;
    var scrollableViewportWidth;
    var totalHeight;
    var renderedCells;
    var rowHeaderWidth;
    var selectionCheckboxWidth;
    var fixedLeftWidth;
    var scrollbarGutterSize;
    var verticalScrollbarGutterSize;
    var footerHeight;
    var footerOffsetBottom;
    var footerTop;
    var bodyPaneBottom;
    var headerHeight;

    if (this.disposed) {
      return;
    }

    if (this.emit('updatingView', {}) === false) {
      return;
    }
    this.resetFixedPaneScrollOffset();
    this.updateLayout();
    this.syncHeaderLayout();
    footerHeight = this.getFooterHeight();
    headerHeight = this.getHeaderHeight();
    this.body.style.bottom = '0px';
    metrics = this.getViewportMetrics();
    scrollbarGutterSize = this.getScrollbarGutterSize();
    verticalScrollbarGutterSize = this.getVerticalScrollbarGutterSize();
    this.root.style.setProperty('--fg-scrollbar-gutter-size', scrollbarGutterSize + 'px');
    rowHeaderWidth = this.getRowHeaderWidth();
    selectionCheckboxWidth = this.getSelectionCheckboxWidth();
    fixedLeftWidth = rowHeaderWidth + selectionCheckboxWidth;
    rowRange = this.getRowRange(metrics);
    this.renderContentHeight = metrics.contentHeight;
    scrollableViewportWidth = Math.max(0, metrics.width - fixedLeftWidth - this.frozenWidth - this.frozenRightWidth);
    scrollLeft = this.bodyScroll.scrollLeft;
    colRange = this.getColumnRange(scrollLeft, scrollableViewportWidth);

    this.rowRange = rowRange;
    this.columnRange = colRange;
    totalHeight = this.view.length * this.options.rowHeight;
    footerOffsetBottom = footerHeight > 0 && totalHeight < metrics.contentHeight ?
      Math.max(0, metrics.height - scrollbarGutterSize - totalHeight - footerHeight) :
      scrollbarGutterSize;
    footerTop = footerHeight > 0 && footerOffsetBottom > scrollbarGutterSize ?
      headerHeight + totalHeight :
      null;
    bodyPaneBottom = footerOffsetBottom + footerHeight;

    this.sizeLayer.style.width = Math.max(metrics.width, fixedLeftWidth + this.frozenWidth + this.scrollableWidth + this.frozenRightWidth) + 'px';
    this.sizeLayer.style.height = (totalHeight + footerHeight) + 'px';
    this.rowHeaderTop.style.width = rowHeaderWidth + 'px';
    this.rowHeaderTop.style.height = this.getHeaderHeight() + 'px';
    this.rowHeaderTop.style.display = rowHeaderWidth > 0 ? 'flex' : 'none';
    this.renderTopLeftSearchCount(this.rowHeaderTop, this.shouldShowRowHeaderText() ? this.options.rowHeaderHeader : '', this.shouldShowRowHeaderText());
    this.rowHeaderPane.style.width = rowHeaderWidth + 'px';
    this.rowHeaderPane.style.bottom = bodyPaneBottom + 'px';
    this.rowHeaderPane.style.display = rowHeaderWidth > 0 ? 'block' : 'none';
    this.selectionTop.style.left = rowHeaderWidth + 'px';
    this.selectionTop.style.width = selectionCheckboxWidth + 'px';
    this.selectionTop.style.height = this.getHeaderHeight() + 'px';
    this.selectionTop.style.display = selectionCheckboxWidth > 0 ? 'flex' : 'none';
    this.renderTopLeftSearchCount(this.selectionTop, '', selectionCheckboxWidth > 0 && rowHeaderWidth <= 0);
    this.selectionPane.style.left = rowHeaderWidth + 'px';
    this.selectionPane.style.width = selectionCheckboxWidth + 'px';
    this.selectionPane.style.bottom = bodyPaneBottom + 'px';
    this.selectionPane.style.display = selectionCheckboxWidth > 0 ? 'block' : 'none';
    this.headerFrozen.style.width = this.frozenWidth + 'px';
    this.headerFrozen.style.left = fixedLeftWidth + 'px';
    this.headerScroll.style.left = (fixedLeftWidth + this.frozenWidth) + 'px';
    this.headerScroll.style.right = (this.frozenRightWidth + verticalScrollbarGutterSize) + 'px';
    this.frozenPane.style.width = this.frozenWidth + 'px';
    this.frozenPane.style.left = fixedLeftWidth + 'px';
    this.frozenPane.style.bottom = bodyPaneBottom + 'px';
    this.frozenPane.style.display = this.frozenWidth > 0 ? 'block' : 'none';
    this.headerFrozenRight.style.width = this.frozenRightWidth + 'px';
    this.headerFrozenRight.style.right = verticalScrollbarGutterSize + 'px';
    this.headerFrozenRight.style.display = this.frozenRightWidth > 0 ? 'block' : 'none';
    this.frozenRightPane.style.width = this.frozenRightWidth + 'px';
    this.frozenRightPane.style.right = verticalScrollbarGutterSize + 'px';
    this.frozenRightPane.style.bottom = bodyPaneBottom + 'px';
    this.frozenRightPane.style.display = this.frozenRightWidth > 0 ? 'block' : 'none';
    this.headerCanvas.style.width = this.scrollableWidth + 'px';
    this.headerCanvas.style.transform = 'translate3d(' + (-scrollLeft) + 'px,0,0)';
    this.footer.style.height = footerHeight + 'px';
    this.footer.style.top = footerTop == null ? '' : footerTop + 'px';
    this.footer.style.bottom = footerTop == null ? scrollbarGutterSize + 'px' : '';
    this.footer.style.display = footerHeight > 0 ? 'block' : 'none';
    this.footerRowHeader.style.width = rowHeaderWidth + 'px';
    this.footerRowHeader.style.display = rowHeaderWidth > 0 ? 'flex' : 'none';
    this.footerRowHeader.textContent = this.shouldShowRowHeaderText() ? this.options.footerLabel : '';
    this.footerSelection.style.left = rowHeaderWidth + 'px';
    this.footerSelection.style.width = selectionCheckboxWidth + 'px';
    this.footerSelection.style.display = selectionCheckboxWidth > 0 ? 'block' : 'none';
    this.footerFrozen.style.left = fixedLeftWidth + 'px';
    this.footerFrozen.style.width = this.frozenWidth + 'px';
    this.footerFrozen.style.display = this.frozenWidth > 0 ? 'block' : 'none';
    this.footerScroll.style.left = (fixedLeftWidth + this.frozenWidth) + 'px';
    this.footerScroll.style.right = (this.frozenRightWidth + verticalScrollbarGutterSize) + 'px';
    this.footerFrozenRight.style.right = verticalScrollbarGutterSize + 'px';
    this.footerFrozenRight.style.width = this.frozenRightWidth + 'px';
    this.footerFrozenRight.style.display = this.frozenRightWidth > 0 ? 'block' : 'none';
    this.footerCanvas.style.width = this.scrollableWidth + 'px';
    this.footerCanvas.style.transform = 'translate3d(' + (-scrollLeft) + 'px,0,0)';
    this.updateVerticalScrollbar(metrics, totalHeight, bodyPaneBottom);

    this.renderHeaders(colRange);
    this.renderFooter(colRange);
    this.renderRowHeaders(rowRange);
    this.renderSelectionCheckboxes(rowRange);
    renderedCells = this.renderBody(rowRange, colRange);
    this.renderSelection();
    this.empty.style.display = this.view.length ? 'none' : 'flex';

    this.emit('viewportChanged', {
      rowStart: rowRange.start,
      rowEnd: rowRange.end,
      columnStart: colRange.start,
      columnEnd: colRange.end,
      renderedCells: renderedCells,
      totalRows: this.view.length
    });
    this.emit('updatedView', {
      rowStart: rowRange.start,
      rowEnd: rowRange.end,
      columnStart: colRange.start,
      columnEnd: colRange.end,
      renderedCells: renderedCells,
      totalRows: this.view.length
    });
    this.restoreHeaderSearchFocus();
  };

  FastGrid.prototype.getViewportMetrics = function() {
    return {
      width: this.bodyScroll.clientWidth,
      height: this.bodyScroll.clientHeight,
      contentHeight: this.getScrollableContentHeight(),
      scrollTop: this.bodyScroll.scrollTop,
      scrollLeft: this.bodyScroll.scrollLeft
    };
  };

  FastGrid.prototype.getScrollableContentHeight = function() {
    var height = this.bodyScroll ? this.bodyScroll.clientHeight : 0;
    height -= this.getFooterHeight();
    return Math.max(0, height);
  };

  FastGrid.prototype.getRowRange = function(metrics) {
    var rowHeight = this.options.rowHeight;
    var overscanRows = Math.max(0, toNumber(this.options.overscanRows, 8));
    var extraRows = this.scrollState ? Math.max(0, toNumber(this.scrollState.extraRows, 0)) : 0;
    var beforeRows = overscanRows;
    var afterRows = overscanRows;
    var visibleStart = Math.floor(metrics.scrollTop / rowHeight);
    var visibleCount = Math.ceil(metrics.contentHeight / rowHeight);
    var start;
    var count;
    if (this.scrollState && this.scrollState.directionY > 0) {
      afterRows += extraRows;
    } else if (this.scrollState && this.scrollState.directionY < 0) {
      beforeRows += extraRows;
    } else {
      beforeRows += Math.ceil(extraRows / 2);
      afterRows += Math.ceil(extraRows / 2);
    }
    start = visibleStart - beforeRows;
    count = visibleCount + beforeRows + afterRows + 1;
    start = Math.max(0, start);
    return {
      start: start,
      end: Math.min(this.view.length, start + count)
    };
  };

  FastGrid.prototype.getScrollbarGutterSize = function() {
    return Math.max(0, this.bodyScroll.offsetHeight - this.bodyScroll.clientHeight);
  };

  FastGrid.prototype.getVerticalScrollbarGutterSize = function() {
    return Math.max(0, this.bodyScroll.offsetWidth - this.bodyScroll.clientWidth);
  };

  FastGrid.prototype.getColumnRange = function(scrollLeft, viewportWidth) {
    var columns = this.visibleColumns;
    var frozen = this.frozenColumns;
    var scrollEnd = this.scrollableColumnEnd;
    var start;
    var end;
    var limit;
    var i;

    if (scrollEnd <= frozen || viewportWidth <= 0) {
      return { start: frozen, end: frozen };
    }

    start = findColumnByOffset(columns, frozen, scrollEnd, this.frozenWidth + scrollLeft);
    start = Math.max(frozen, start - this.options.overscanColumns);
    limit = this.frozenWidth + scrollLeft + viewportWidth;
    end = start;
    for (i = start; i < scrollEnd; i += 1) {
      end = i + 1;
      if (columns[i]._left > limit) {
        break;
      }
    }
    end = Math.min(scrollEnd, end + this.options.overscanColumns);
    return { start: start, end: end };
  };

  FastGrid.prototype.getRowHeaderWidth = function() {
    if (this.options.showRowHeaders === false) {
      return 0;
    }
    if (this.options.showRowHeaders === 'cell') {
      return 18;
    }
    return Math.max(0, toNumber(this.options.rowHeaderWidth, DEFAULT_OPTIONS.rowHeaderWidth));
  };

  FastGrid.prototype.shouldShowRowHeaderText = function() {
    return this.options.showRowHeaders !== false && this.options.showRowHeaders !== 'cell';
  };

  FastGrid.prototype.getSelectionCheckboxWidth = function() {
    if (this.options.multiSelectRows !== true) {
      return 0;
    }
    return Math.max(28, toNumber(this.options.selectionCheckboxWidth, 44));
  };

  FastGrid.prototype.getFooterHeight = function() {
    if (this.options.showFooter !== true) {
      return 0;
    }
    return Math.max(0, toNumber(this.options.footerHeight, DEFAULT_OPTIONS.footerHeight));
  };

  FastGrid.prototype.renderTopLeftSearchCount = function(element, title, showCount) {
    var label = element.querySelector('.fg-top-title');
    var count = element.querySelector('.fg-search-count');
    if (!label) {
      label = document.createElement('span');
      label.className = 'fg-top-title';
      element.insertBefore(label, element.firstChild);
    }
    if (!count) {
      count = document.createElement('span');
      count.className = 'fg-search-count';
      element.appendChild(count);
    }
    label.textContent = title || '';
    count.textContent = showCount && this.hasActiveFilter() ? String(this.view.length) : '';
  };

  FastGrid.prototype.hasActiveFilter = function() {
    return !!this.filterPredicate || !!this.searchText || (this.options.showSearchRow === true && this.hasColumnSearch);
  };

  FastGrid.prototype.getFixedLeftWidth = function() {
    return this.getRowHeaderWidth() + this.getSelectionCheckboxWidth();
  };

  FastGrid.prototype.renderHeaders = function(colRange) {
    var frozenFragment = document.createDocumentFragment();
    var frozenRightFragment = document.createDocumentFragment();
    var scrollFragment = document.createDocumentFragment();
    var i;
    var col;

    this.headerFrozen.innerHTML = '';
    this.headerFrozenRight.innerHTML = '';
    this.headerCanvas.innerHTML = '';

    for (i = 0; i < this.frozenColumns; i += 1) {
      col = this.visibleColumns[i];
      frozenFragment.appendChild(this.createHeaderCell(col, col._left, true));
    }

    for (i = colRange.start; i < colRange.end; i += 1) {
      col = this.visibleColumns[i];
      scrollFragment.appendChild(this.createHeaderCell(col, col._left - this.frozenWidth, false));
    }

    for (i = this.scrollableColumnEnd; i < this.visibleColumns.length; i += 1) {
      col = this.visibleColumns[i];
      frozenRightFragment.appendChild(this.createHeaderCell(col, col._left - this.frozenRightStartLeft, true));
    }

    this.headerFrozen.appendChild(frozenFragment);
    this.headerFrozenRight.appendChild(frozenRightFragment);
    this.headerCanvas.appendChild(scrollFragment);
  };

  FastGrid.prototype.renderVisibleRows = function() {
    this.resetFixedPaneScrollOffset();
    this.renderRowHeaders(this.rowRange);
    this.renderSelectionCheckboxes(this.rowRange);
    this.renderBody(this.rowRange, this.columnRange);
    this.renderSelection();
  };

  FastGrid.prototype.renderFooter = function(colRange) {
    var frozenFragment = document.createDocumentFragment();
    var frozenRightFragment = document.createDocumentFragment();
    var scrollFragment = document.createDocumentFragment();
    var i;
    var col;

    this.footerFrozen.innerHTML = '';
    this.footerFrozenRight.innerHTML = '';
    this.footerCanvas.innerHTML = '';
    if (!this.getFooterHeight()) {
      return;
    }

    for (i = 0; i < this.frozenColumns; i += 1) {
      col = this.visibleColumns[i];
      frozenFragment.appendChild(this.createFooterCell(col, col._left));
    }

    for (i = colRange.start; i < colRange.end; i += 1) {
      col = this.visibleColumns[i];
      scrollFragment.appendChild(this.createFooterCell(col, col._left - this.frozenWidth));
    }

    for (i = this.scrollableColumnEnd; i < this.visibleColumns.length; i += 1) {
      col = this.visibleColumns[i];
      frozenRightFragment.appendChild(this.createFooterCell(col, col._left - this.frozenRightStartLeft));
    }

    this.footerFrozen.appendChild(frozenFragment);
    this.footerFrozenRight.appendChild(frozenRightFragment);
    this.footerCanvas.appendChild(scrollFragment);
  };

  FastGrid.prototype.createFooterCell = function(column, left) {
    var cell = document.createElement('div');
    var label = document.createElement('span');
    var text = this.getFooterCellText(column);
    cell.className = 'fg-footer-cell';
    if (column.align) {
      cell.className += ' fg-align-' + column.align;
    }
    if (column.color) {
      cell.style.color = column.color;
    }
    cell.style.left = left + 'px';
    cell.style.width = column._width + 'px';
    cell.style.height = this.getFooterHeight() + 'px';
    cell.style.textAlign = normalizeTextAlign(column.align);
    cell.style.justifyContent = normalizeJustifyContent(column.align);
    cell.setAttribute('data-col', column._viewIndex);
    label.className = 'fg-footer-label';
    label.style.textAlign = normalizeTextAlign(column.align);
    label.textContent = text;
    cell.appendChild(label);
    return cell;
  };

  FastGrid.prototype.getFooterCellText = function(column) {
    var value;
    var args;
    if (typeof column.footer === 'function') {
      args = {
        grid: this,
        column: column,
        rows: this.view,
        aggregate: column.aggregate
      };
      value = column.footer(args);
      return value == null ? '' : String(value);
    }
    if (column.footer != null) {
      return String(column.footer);
    }
    if (!column.aggregate) {
      return '';
    }
    value = this.calculateAggregate(column.aggregate, column);
    return this.formatAggregateValue(value, column);
  };

  FastGrid.prototype.calculateAggregate = function(aggregate, column) {
    return this.calculateAggregateForRows(aggregate, column, this.dataView || this.view);
  };

  FastGrid.prototype.calculateAggregateForRows = function(aggregate, column, rows) {
    var count = 0;
    var sum = 0;
    var min = null;
    var max = null;
    var i;
    var value;
    var number;
    var name;
    if (typeof aggregate === 'function') {
      return aggregate({
        grid: this,
        column: column,
        rows: rows,
        getValue: function(item) {
          return getByBinding(item, column.binding);
        }
      });
    }
    name = String(aggregate).toLowerCase();
    if (name === 'count') {
      return rows.length;
    }
    for (i = 0; i < rows.length; i += 1) {
      value = getByBinding(rows[i], column.binding);
      if (value == null || value === '') {
        continue;
      }
      number = Number(value);
      if (isNaN(number)) {
        continue;
      }
      sum += number;
      count += 1;
      if (min == null || number < min) {
        min = number;
      }
      if (max == null || number > max) {
        max = number;
      }
    }
    if (name === 'avg' || name === 'average') {
      return count ? sum / count : null;
    }
    if (name === 'min') {
      return min;
    }
    if (name === 'max') {
      return max;
    }
    return count ? sum : null;
  };

  FastGrid.prototype.formatAggregateValue = function(value, column, rows) {
    var formatted;
    if (value == null) {
      return '';
    }
    if (typeof column.footerFormatter === 'function') {
      formatted = column.footerFormatter(value, column, rows || this.dataView || this.view);
      return formatted == null ? '' : String(formatted);
    }
    if (typeof column.formatter === 'function') {
      formatted = column.formatter(value, null, column);
      return formatted == null ? '' : String(formatted);
    }
    if (column && column.dataType === 'number') {
      return formatNumberDisplayText(value, column);
    }
    return String(value);
  };

  FastGrid.prototype.renderRowHeaders = function(rowRange) {
    var fragment = document.createDocumentFragment();
    var r;
    var cell;
    this.rowHeaderLayer.innerHTML = '';
    if (!this.getRowHeaderWidth()) {
      return;
    }
    for (r = rowRange.start; r < rowRange.end; r += 1) {
      cell = this.createRowHeaderCell(r);
      if (cell) {
        fragment.appendChild(cell);
      }
    }
    this.rowHeaderLayer.appendChild(fragment);
  };

  FastGrid.prototype.renderSelectionCheckboxes = function(rowRange) {
    var fragment = document.createDocumentFragment();
    var checkbox;
    var r;
    var cell;
    this.selectionTop.innerHTML = '';
    this.selectionLayer.innerHTML = '';
    if (!this.getSelectionCheckboxWidth()) {
      return;
    }

    checkbox = document.createElement('input');
    checkbox.className = 'fg-selection-checkbox fg-selection-check-all';
    checkbox.type = 'checkbox';
    checkbox.setAttribute('aria-label', this.getText('aria.selectAllRows'));
    checkbox.checked = this.view.length > 0 && this.getSelectedRowCount() === this.view.length;
    checkbox.indeterminate = this.getSelectedRowCount() > 0 && this.getSelectedRowCount() < this.view.length;
    this.selectionTop.appendChild(checkbox);

    for (r = rowRange.start; r < rowRange.end; r += 1) {
      cell = this.createSelectionCell(r);
      if (cell) {
        fragment.appendChild(cell);
      }
    }
    this.selectionLayer.appendChild(fragment);
  };

  FastGrid.prototype.createSelectionCell = function(rowIndex) {
    var row = this.view[rowIndex];
    var cell = document.createElement('div');
    var checkbox = document.createElement('input');
    var groupSelectionState = this.isRowGroup(row) ? this.getRowGroupSelectionState(row) : null;
    var top = rowIndex * this.options.rowHeight - this.bodyScroll.scrollTop;
    var height = this.getVisibleRowHeight(top);
    if (height <= 0) {
      return null;
    }
    cell.className = 'fg-selection-cell';
    if (this.options.alternatingRows && rowIndex % 2 === 1) {
      cell.className += ' fg-row-even fg-row-alt';
    }
    if (this.hoverRow === rowIndex) {
      cell.className += ' fg-row-hovered';
    }
    if (this.isRowSelected(rowIndex)) {
      cell.className += ' fg-row-selected';
    }
    if (this.isRowGroupFooter(row)) {
      cell.className += ' fg-row-group-footer-cell';
    }
    cell.style.top = top + 'px';
    cell.style.width = this.getSelectionCheckboxWidth() + 'px';
    cell.style.height = height + 'px';
    cell.setAttribute('data-row', rowIndex);
    if (this.isRowGroupFooter(row)) {
      return cell;
    }
    checkbox.className = 'fg-selection-checkbox fg-selection-check';
    checkbox.type = 'checkbox';
    checkbox.checked = groupSelectionState ? groupSelectionState.checked : this.isRowSelected(rowIndex);
    checkbox.indeterminate = groupSelectionState ? groupSelectionState.indeterminate : false;
    checkbox.setAttribute('aria-label', this.getText('aria.selectRow', { rowNumber: rowIndex + 1 }));
    checkbox.setAttribute('data-row', rowIndex);
    cell.appendChild(checkbox);
    return cell;
  };

  FastGrid.prototype.createRowHeaderCell = function(rowIndex) {
    var row = this.view[rowIndex];
    var cell = document.createElement('div');
    var top = rowIndex * this.options.rowHeight - this.bodyScroll.scrollTop;
    var height = this.getVisibleRowHeight(top);
    if (height <= 0) {
      return null;
    }
    cell.className = 'fg-row-header-cell';
    if (this.options.alternatingRows && rowIndex % 2 === 1) {
      cell.className += ' fg-row-even fg-row-alt';
    }
    if (this.hoverRow === rowIndex) {
      cell.className += ' fg-row-hovered';
    }
    if (this.isRowSelected(rowIndex)) {
      cell.className += ' fg-row-selected';
    }
    if (this.isRowGroupFooter(row)) {
      cell.className += ' fg-row-group-footer-cell';
    }
    cell.style.top = top + 'px';
    cell.style.width = this.getRowHeaderWidth() + 'px';
    cell.style.height = height + 'px';
    cell.setAttribute('data-row', rowIndex);
    cell.textContent = this.isRowGroupFooter(row) ? '' : this.shouldShowRowHeaderText() ? String(rowIndex + 1) : '';
    return cell;
  };

  FastGrid.prototype.createHeaderCell = function(column, left, frozen) {
    var cell = document.createElement('div');
    var title = document.createElement('span');
    var label = document.createElement('span');
    var sortWrap = document.createElement('span');
    var sortOrder = document.createElement('span');
    var sort = document.createElement('span');
    var filterIcon = document.createElement('span');
    var resize = document.createElement('span');
    var search;
    var input;
    var searchIcons;
    var searchEditorConfig;
    var sortDirection = this.getSortDirection(column);
    var sortIndex = this.getSortIndex(column);
    var sortCount = this.getSortStates().length;
    var searchOperator = this.getColumnSearchOperator(column);

    cell.className = 'fg-header-cell';
    if (column.align) {
      cell.className += ' fg-header-align-' + column.align;
    }
    cell.style.left = left + 'px';
    cell.style.width = column._width + 'px';
    cell.style.height = this.getHeaderHeight() + 'px';
    cell.setAttribute('data-col', column._viewIndex);
    cell.setAttribute('data-frozen', frozen ? '1' : '0');
    title.className = 'fg-header-title';
    title.style.height = this.getHeaderTitleHeight() + 'px';
    label.className = 'fg-header-label';
    label.textContent = this.getHeaderCellText(column);
    sortWrap.className = 'fg-sort-wrap' + (sortDirection ? '' : ' fg-sort-wrap-none');
    sortOrder.className = 'fg-sort-order';
    sortOrder.textContent = sortCount > 1 && sortIndex >= 0 ? String(sortIndex + 1) : '';
    sort.className = 'fg-sort' + (sortDirection === 1 ? ' fg-sort-asc' : sortDirection === -1 ? ' fg-sort-desc' : ' fg-sort-none');
    sort.setAttribute('aria-hidden', 'true');
    resize.className = 'fg-resize';
    resize.setAttribute('data-resize-col', column._viewIndex);
    title.appendChild(label);
    sortWrap.appendChild(sortOrder);
    sortWrap.appendChild(sort);
    title.appendChild(sortWrap);
    cell.appendChild(title);
    if (this.options.showSearchRow === true) {
      searchEditorConfig = getColumnEditorConfig(column);
      searchIcons = getColumnSearchIconConfigs(column);
      filterIcon.className = 'fg-filter-icon' + (searchOperator ? ' fg-filter-icon-active' : '');
      filterIcon.textContent = searchOperator ? getColumnSearchOperatorSymbol(searchOperator) : '';
      filterIcon.setAttribute('data-col', column._viewIndex);
      filterIcon.setAttribute('aria-hidden', 'true');
      title.appendChild(filterIcon);
      search = document.createElement('span');
      input = document.createElement('input');
      search.className = 'fg-header-search';
      search.style.height = this.getSearchRowHeight() + 'px';
      input.className = 'fg-header-search-input';
      input.type = 'text';
      input.inputMode = column.dataType === 'number' ? 'decimal' : isDateLikeEditorType(searchEditorConfig.type) ? 'numeric' : 'search';
      input.value = this.getColumnSearchValue(column);
      input.style.textAlign = normalizeTextAlign(column.align);
      input.style.paddingRight = searchIcons.length ? (getIconConfigWidth(searchIcons, 22) + 8) + 'px' : '';
      input.setAttribute('data-col', column._viewIndex);
      input.setAttribute('aria-label', this.getHeaderCellText(column));
      input.setAttribute('autocomplete', 'off');
      if (searchIcons.length) {
        search.className += ' fg-header-search-with-icons';
      }
      search.appendChild(input);
      this.renderHeaderSearchIcons(search, column, searchIcons);
      cell.appendChild(search);
    }
    if (this.options.allowResizing) {
      cell.appendChild(resize);
    }
    return cell;
  };

  FastGrid.prototype.renderHeaderSearchIcons = function(search, column, iconConfigs) {
    var host;
    var button;
    var icon;
    var i;
    if (!iconConfigs || !iconConfigs.length) {
      return;
    }
    host = document.createElement('span');
    host.className = 'fg-header-search-icons';
    for (i = 0; i < iconConfigs.length; i += 1) {
      icon = iconConfigs[i];
      button = document.createElement('button');
      button.type = 'button';
      button.className = trimText('fg-header-search-icon fg-editor-trigger-custom ' + normalizeClassName(icon.iconCls || icon.className || icon.iconClass || icon.icon || ''));
      button.setAttribute('data-col', column._viewIndex);
      button.setAttribute('data-icon-index', i);
      button.setAttribute('aria-label', icon.ariaLabel || icon.label || icon.title || this.getHeaderCellText(column));
      button.title = icon.title || '';
      button.textContent = icon.text || '';
      button.style.width = Math.max(18, toNumber(icon.width, 22)) + 'px';
      host.appendChild(button);
    }
    search.appendChild(host);
  };

  FastGrid.prototype.getColumnSearchValue = function(column) {
    var value = this.columnSearchValues[getColumnSearchKey(column)];
    var mask = getEditorMask(column);
    if (value == null) {
      return '';
    }
    if (mask) {
      return formatMaskText(value, { mask: mask });
    }
    return String(value);
  };

  FastGrid.prototype.getColumnSearchOperator = function(column) {
    return normalizeColumnSearchOperator(this.columnSearchOperators[getColumnSearchKey(column)]);
  };

  FastGrid.prototype.showFilterMenu = function(colIndex, anchor) {
    var column = this.visibleColumns[colIndex];
    if (!column || !this.filterMenu) {
      return;
    }
    this.filterMenuColumn = column;
    this.renderFilterMenu(column);
    this.filterMenu.style.display = 'block';
    this.positionFilterMenu(anchor);
  };

  FastGrid.prototype.renderFilterMenu = function(column) {
    var items = this.getColumnSearchOperatorItems(column);
    var active = this.getColumnSearchOperator(column);
    var colIndex = column ? column._viewIndex : -1;
    var fragment = document.createDocumentFragment();
    var item;
    var icon;
    var label;
    var i;
    var self = this;
    var handler;
    this.filterMenu.innerHTML = '';
    for (i = 0; i < items.length; i += 1) {
      item = document.createElement('div');
      icon = document.createElement('span');
      label = document.createElement('span');
      item.className = 'fg-filter-menu-item' +
        (items[i].operator ? '' : ' fg-filter-menu-clear') +
        (items[i].operator && items[i].operator === active ? ' fg-filter-menu-item-active' : '');
      item.setAttribute('role', 'menuitem');
      item.setAttribute('data-col', colIndex);
      item.setAttribute('data-operator', items[i].operator);
      item.setAttribute('tabindex', '-1');
      icon.className = 'fg-filter-menu-funnel';
      icon.setAttribute('aria-hidden', 'true');
      label.className = 'fg-filter-menu-label';
      label.textContent = items[i].label;
      item.appendChild(icon);
      item.appendChild(label);
      handler = createFilterMenuItemHandler(self, column, items[i].operator);
      item.addEventListener('pointerdown', handler, true);
      item.addEventListener('mousedown', handler, true);
      item.addEventListener('mouseup', handler, true);
      item.addEventListener('click', handler, true);
      fragment.appendChild(item);
    }
    this.filterMenu.appendChild(fragment);
  };

  FastGrid.prototype.getColumnSearchOperatorItems = function(column) {
    var definitions = getColumnSearchOperatorDefinitions(column);
    var items = [];
    var i;
    var definition;
    for (i = 0; i < definitions.length; i += 1) {
      definition = definitions[i];
      items.push({
        operator: definition.operator,
        symbol: definition.symbol,
        label: this.getColumnSearchOperatorLabel(definition)
      });
    }
    return items;
  };

  FastGrid.prototype.getColumnSearchOperatorLabel = function(definition) {
    var label;
    if (!definition.operator) {
      return this.getText('filter.clear') || 'Clear';
    }
    label = this.getText(definition.labelKey, { symbol: definition.symbol });
    return label || definition.symbol;
  };

  FastGrid.prototype.positionFilterMenu = function(anchor) {
    var rootRect;
    var anchorRect;
    var menuWidth;
    var menuHeight;
    var left;
    var top;
    if (!this.filterMenu || !anchor || this.filterMenu.style.display !== 'block') {
      return;
    }
    rootRect = this.root.getBoundingClientRect();
    anchorRect = anchor.getBoundingClientRect();
    menuWidth = this.filterMenu.offsetWidth;
    menuHeight = this.filterMenu.offsetHeight;
    left = anchorRect.left - rootRect.left - menuWidth + anchorRect.width + 4;
    top = anchorRect.bottom - rootRect.top + 2;
    left = Math.max(0, Math.min(left, rootRect.width - menuWidth - 2));
    top = Math.max(0, Math.min(top, rootRect.height - menuHeight - 2));
    this.filterMenu.style.left = left + 'px';
    this.filterMenu.style.top = top + 'px';
  };

  FastGrid.prototype.hideFilterMenu = function() {
    if (this.filterMenu) {
      this.filterMenu.style.display = 'none';
      this.filterMenu.innerHTML = '';
    }
    this.filterMenuColumn = null;
  };

  FastGrid.prototype.isFilterMenuOpen = function() {
    return !!(this.filterMenu && this.filterMenu.style.display === 'block');
  };

  FastGrid.prototype.handleFilterMenuClick = function(event) {
    var item = closest(event.target, 'fg-filter-menu-item') || this.getFilterMenuItemAtEvent(event);
    var operator;
    var colIndex;
    var column;
    if (!item) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    operator = item.getAttribute('data-operator') || '';
    colIndex = toNumber(item.getAttribute('data-col'), -1);
    column = this.visibleColumns[colIndex] || this.filterMenuColumn;
    if (!column) {
      this.hideFilterMenu();
      return;
    }
    this.selectFilterMenuOperator(column, operator, event);
  };

  FastGrid.prototype.selectFilterMenuOperator = function(column, operator, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!column) {
      this.hideFilterMenu();
      return;
    }
    this.setColumnSearchOperator(column, operator);
  };

  FastGrid.prototype.getFilterMenuItemAtEvent = function(event) {
    var x;
    var y;
    var element;
    var items;
    var rect;
    var i;
    if (!this.isFilterMenuOpen() || event.clientX == null || event.clientY == null) {
      return null;
    }
    x = event.clientX;
    y = event.clientY;
    if (document.elementFromPoint) {
      element = document.elementFromPoint(x, y);
      element = closest(element, 'fg-filter-menu-item');
      if (element) {
        return element;
      }
    }
    items = this.filterMenu.querySelectorAll('.fg-filter-menu-item');
    for (i = 0; i < items.length; i += 1) {
      rect = items[i].getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return items[i];
      }
    }
    return null;
  };

  FastGrid.prototype.getHeaderCellText = function(column) {
    if (!column) {
      return '';
    }
    if (this.headerDisplayMode === 'binding') {
      return column.binding == null ? '' : String(column.binding);
    }
    return column.header || column.binding || '';
  };

  FastGrid.prototype.renderBody = function(rowRange, colRange) {
    var frozenFragment = document.createDocumentFragment();
    var frozenRightFragment = document.createDocumentFragment();
    var scrollFragment = document.createDocumentFragment();
    var rendered = 0;
    var cell;
    var r;
    var c;

    this.frozenLayer.innerHTML = '';
    this.frozenRightLayer.innerHTML = '';
    this.cellLayer.innerHTML = '';

    for (r = rowRange.start; r < rowRange.end; r += 1) {
      if (this.isRowGroup(this.view[r])) {
        cell = this.createRowGroupCell(r, 'left');
        if (cell) {
          frozenFragment.appendChild(cell);
          rendered += 1;
        }
        cell = this.createRowGroupCell(r, 'scroll');
        if (cell) {
          scrollFragment.appendChild(cell);
          rendered += 1;
        }
        cell = this.createRowGroupCell(r, 'right');
        if (cell) {
          frozenRightFragment.appendChild(cell);
          rendered += 1;
        }
        continue;
      }
      for (c = 0; c < this.frozenColumns; c += 1) {
        cell = this.createBodyCell(r, c, 'left');
        if (cell) {
          frozenFragment.appendChild(cell);
          rendered += 1;
        }
      }
      for (c = colRange.start; c < colRange.end; c += 1) {
        cell = this.createBodyCell(r, c, 'scroll');
        if (cell) {
          scrollFragment.appendChild(cell);
          rendered += 1;
        }
      }
      for (c = this.scrollableColumnEnd; c < this.visibleColumns.length; c += 1) {
        cell = this.createBodyCell(r, c, 'right');
        if (cell) {
          frozenRightFragment.appendChild(cell);
          rendered += 1;
        }
      }
    }

    this.frozenLayer.appendChild(frozenFragment);
    this.frozenRightLayer.appendChild(frozenRightFragment);
    this.cellLayer.appendChild(scrollFragment);
    return rendered;
  };

  FastGrid.prototype.isRowGroup = function(item) {
    return !!(item && item.__fgRowType === 'group');
  };

  FastGrid.prototype.isRowGroupFooter = function(item) {
    return !!(item && item.__fgRowType === 'groupFooter');
  };

  FastGrid.prototype.createRowGroupCell = function(rowIndex, pane) {
    var group = this.view[rowIndex];
    var cell = document.createElement('div');
    var expander = document.createElement('span');
    var label = document.createElement('span');
    var summaryInfos;
    var summary;
    var fixedLeftWidth = this.getFixedLeftWidth();
    var top = rowIndex * this.options.rowHeight;
    var viewportTop = top - this.bodyScroll.scrollTop;
    var height = this.getVisibleRowHeight(viewportTop);
    var paneStart = 0;
    var paneEnd = this.visibleColumns.length;
    var paneLeft = fixedLeftWidth;
    var paneWidth = Math.max(this.totalWidth, this.bodyScroll.clientWidth - fixedLeftWidth);
    var paneTop = top;
    var summaryLeftOffset = 0;
    var showLabel = true;
    var isSelected = this.selection.row === rowIndex;
    var isFirstPane;
    var isLastPane;
    var i;
    if (!group || height <= 0) {
      return null;
    }

    if (pane === 'left') {
      if (!this.frozenWidth) {
        return null;
      }
      paneEnd = this.frozenColumns;
      paneLeft = 0;
      paneWidth = this.frozenWidth;
      paneTop = viewportTop;
    } else if (pane === 'scroll') {
      if (!this.scrollableWidth) {
        return null;
      }
      paneStart = this.frozenColumns;
      paneEnd = this.scrollableColumnEnd;
      paneLeft = fixedLeftWidth + this.frozenWidth;
      paneWidth = this.scrollableWidth;
      summaryLeftOffset = this.frozenWidth;
      showLabel = this.frozenColumns === 0;
    } else if (pane === 'right') {
      if (!this.frozenRightWidth) {
        return null;
      }
      paneStart = this.scrollableColumnEnd;
      paneLeft = 0;
      paneWidth = this.frozenRightWidth;
      paneTop = viewportTop;
      summaryLeftOffset = this.frozenRightStartLeft;
      showLabel = paneStart === 0;
    }

    isFirstPane = pane === 'left' ||
      (pane === 'scroll' && !this.frozenWidth) ||
      (pane === 'right' && !this.frozenWidth && !this.scrollableWidth);
    isLastPane = pane === 'right' ||
      (pane === 'scroll' && !this.frozenRightWidth) ||
      (pane === 'left' && !this.scrollableWidth && !this.frozenRightWidth);
    cell.className = 'fg-cell fg-row-group-cell fg-row-group-pane-' + pane;
    if (isSelected) {
      cell.className += ' fg-row-group-selected';
      if (isFirstPane) {
        cell.className += ' fg-row-group-selected-start';
      }
      if (isLastPane) {
        cell.className += ' fg-row-group-selected-end';
      }
    }
    cell.style.left = paneLeft + 'px';
    cell.style.top = paneTop + 'px';
    cell.style.width = paneWidth + 'px';
    cell.style.height = height + 'px';
    cell.style.setProperty('--fg-row-group-indent', (group.level || 0) * 16 + 'px');
    cell.style.backgroundColor = '#e1e1e1';
    cell.style.backgroundImage = 'none';
    cell.setAttribute('data-row', rowIndex);
    cell.setAttribute('data-row-group', group.key);
    cell.setAttribute('role', showLabel ? 'rowheader' : 'gridcell');
    if (showLabel) {
      expander.className = 'fg-row-group-expander';
      expander.textContent = group.collapsed ? '▸' : '▾';
      label.className = 'fg-row-group-label';
      label.textContent = group.label;
      cell.appendChild(expander);
      cell.appendChild(label);
    }
    summaryInfos = this.getRowGroupSummaryInfos(group);
    for (i = 0; i < summaryInfos.length; i += 1) {
      if (summaryInfos[i].columnIndex < paneStart || summaryInfos[i].columnIndex >= paneEnd) {
        continue;
      }
      summary = document.createElement('span');
      summary.className = 'fg-row-group-summary';
      summary.textContent = summaryInfos[i].text;
      summary.style.left = (summaryInfos[i].left - summaryLeftOffset) + 'px';
      summary.style.width = summaryInfos[i].width + 'px';
      summary.style.textAlign = summaryInfos[i].textAlign;
      summary.style.justifyContent = summaryInfos[i].justifyContent;
      if (summaryInfos[i].color) {
        summary.style.color = summaryInfos[i].color;
      }
      cell.appendChild(summary);
    }
    return cell;
  };

  FastGrid.prototype.getRowGroupSummaryInfos = function(group) {
    var summaries = [];
    var i;
    var column;
    var value;
    if (!group || !group.aggregates) {
      return summaries;
    }
    for (i = 0; i < this.visibleColumns.length; i += 1) {
      column = this.visibleColumns[i];
      if (column && column.aggregate) {
        value = this.getRowGroupAggregateValue(group, column);
        value = this.formatAggregateValue(value, column, group.items);
        if (value) {
          summaries.push({
            columnIndex: i,
            text: value == null ? '' : String(value),
            left: column._left,
            width: column._width,
            textAlign: normalizeTextAlign(column.align),
            justifyContent: normalizeJustifyContent(column.align),
            color: column.color || ''
          });
        }
      }
    }
    return summaries;
  };

  FastGrid.prototype.getRowGroupAggregateValue = function(group, column) {
    if (column.binding && Object.prototype.hasOwnProperty.call(group.aggregates, column.binding)) {
      return group.aggregates[column.binding];
    }
    return this.calculateAggregateForRows(column.aggregate, column, group.items || []);
  };

  FastGrid.prototype.getRowGroupFooterValue = function(footer, column) {
    if (!footer || !column || !column.aggregate) {
      return '';
    }
    return this.getRowGroupAggregateValue(footer, column);
  };

  FastGrid.prototype.createBodyCell = function(rowIndex, colIndex, pane) {
    var row = this.view[rowIndex];
    var column = this.visibleColumns[colIndex];
    var value = this.isRowGroupFooter(row) ? this.getRowGroupFooterValue(row, column) : getByBinding(row, column.binding);
    var cell = document.createElement('div');
    var isFrozen = pane === true || pane === 'left' || pane === 'right';
    var left = this.getFixedLeftWidth() + column._left;
    var top = isFrozen ? rowIndex * this.options.rowHeight - this.bodyScroll.scrollTop : rowIndex * this.options.rowHeight;
    var viewportTop = rowIndex * this.options.rowHeight - this.bodyScroll.scrollTop;
    var height = this.getVisibleRowHeight(viewportTop);

    if (height <= 0) {
      return null;
    }

    if (pane === true || pane === 'left') {
      left = column._left;
    } else if (pane === 'right') {
      left = column._left - this.frozenRightStartLeft;
    }

    cell.className = 'fg-cell';
    if (this.options.alternatingRows && rowIndex % 2 === 1) {
      cell.className += ' fg-row-even fg-row-alt';
    }
    if (column.align) {
      cell.className += ' fg-align-' + column.align;
    }
    if (column.color) {
      cell.style.color = column.color;
    }
    if (this.hoverRow === rowIndex) {
      cell.className += ' fg-row-hovered';
    }
    if (this.isRowSelected(rowIndex)) {
      cell.className += ' fg-row-selected';
    }
    if (this.isRowGroupFooter(row)) {
      cell.className += ' fg-row-group-footer-cell';
    }
    if (this.selection.row === rowIndex && this.selection.col === colIndex) {
      cell.className += ' fg-selected';
    }
    if (this.getCellValidationError(row, column)) {
      cell.className += ' fg-cell-invalid';
      cell.setAttribute('aria-invalid', 'true');
    }
    cell.style.left = left + 'px';
    cell.style.top = top + 'px';
    cell.style.width = column._width + 'px';
    cell.style.height = height + 'px';
    cell.setAttribute('data-row', rowIndex);
    cell.setAttribute('data-col', colIndex);
    cell.setAttribute('role', 'gridcell');
    this.renderCellContent(cell, row, column, value, rowIndex, colIndex);
    return cell;
  };

  FastGrid.prototype.getVisibleRowHeight = function(viewportTop) {
    return this.options.rowHeight;
  };

  FastGrid.prototype.renderCellContent = function(cell, item, column, value, rowIndex, colIndex) {
    var text = value == null ? '' : String(value);
    var args;
    if (this.isRowGroupFooter(item)) {
      text = column.aggregate ? this.formatAggregateValue(value, column, item.items) : '';
      cell.textContent = text == null ? '' : String(text);
      return;
    }
    if (getColumnEditorConfig(column).type === 'combobox') {
      text = getComboboxTextByValue(value, getColumnEditorConfig(column));
    }
    if (column.dataType === 'number' && value != null && value !== '' &&
      (shouldUseThousandsSeparator(column) || getNumberPrecision(column) != null)) {
      text = formatNumberDisplayText(value, column);
    }
    if (getExplicitEditorMask(column)) {
      text = formatMaskText(value, getMaskOptions(column, getExplicitEditorMask(column)));
    }
    if (typeof column.formatter === 'function') {
      text = column.formatter(value, item, column);
    }
    cell.textContent = text == null ? '' : String(text);
    args = {
      grid: this,
      panel: this.cells,
      cell: cell,
      item: item,
      column: column,
      value: value,
      row: rowIndex,
      col: colIndex,
      rowIndex: rowIndex,
      colIndex: colIndex
    };
    if (typeof this.options.formatCell === 'function') {
      this.options.formatCell(args);
    }
    if (typeof this.options.itemFormatter === 'function') {
      this.options.itemFormatter(this.cells, rowIndex, colIndex, cell);
    }
    this.emit('formatItem', args);
  };

  FastGrid.prototype.renderSelection = function() {
    if (this.editing) {
      this.positionEditor();
    }
  };

  FastGrid.prototype.handleClick = function(event) {
    var filterMenuItem = closest(event.target, 'fg-filter-menu-item');
    var searchIcon = closest(event.target, 'fg-header-search-icon');
    var searchInput = closest(event.target, 'fg-header-search-input');
    var filterIcon = closest(event.target, 'fg-filter-icon');
    var resize = closest(event.target, 'fg-resize');
    var selectAll = closest(event.target, 'fg-selection-check-all');
    var selectionCheck = closest(event.target, 'fg-selection-check');
    var header = closest(event.target, 'fg-header-cell');
    var rowHeader = closest(event.target, 'fg-row-header-cell');
    var selectionCell = closest(event.target, 'fg-selection-cell');
    var groupExpander = closest(event.target, 'fg-row-group-expander');
    var cell = closest(event.target, 'fg-cell');
    var colIndex;
    var rowIndex;

    if (this.busy) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (this.fixedPaneTouchClickUntil && Date.now() < this.fixedPaneTouchClickUntil) {
      this.fixedPaneTouchClickUntil = 0;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (filterMenuItem) {
      this.handleFilterMenuClick(event);
      return;
    }

    if (searchIcon) {
      this.handleHeaderSearchIconClick(event, searchIcon);
      return;
    }

    if (searchInput) {
      event.stopPropagation();
      return;
    }

    if (filterIcon) {
      event.preventDefault();
      event.stopPropagation();
      colIndex = toNumber((header || filterIcon).getAttribute('data-col'), -1);
      if (colIndex < 0 && header) {
        colIndex = toNumber(header.getAttribute('data-col'), -1);
      }
      this.showFilterMenu(colIndex, filterIcon);
      return;
    }

    if (this.suppressClick && (resize || header)) {
      this.suppressClick = false;
      event.preventDefault();
      return;
    }
    this.suppressClick = false;

    if (resize) {
      event.preventDefault();
      return;
    }

    if (selectAll) {
      event.preventDefault();
      event.stopPropagation();
      this.setAllRowsSelected(selectAll.checked);
      this.root.focus();
      return;
    }

    if (selectionCheck || selectionCell) {
      event.preventDefault();
      event.stopPropagation();
      rowIndex = toNumber((selectionCheck || selectionCell).getAttribute('data-row'), 0);
      this.toggleRowSelection(rowIndex);
      this.root.focus();
      return;
    }

    if (header && this.options.allowSorting) {
      colIndex = toNumber(header.getAttribute('data-col'), -1);
      this.toggleSort(colIndex, event.shiftKey === true);
      return;
    }

    if (rowHeader) {
      rowIndex = toNumber(rowHeader.getAttribute('data-row'), 0);
      if (this.isRowGroup(this.view[rowIndex]) || this.isRowGroupFooter(this.view[rowIndex])) {
        this.root.focus();
        return;
      }
      this.toggleRowSelection(rowIndex);
      this.root.focus();
      return;
    }

    if (cell) {
      rowIndex = toNumber(cell.getAttribute('data-row'), 0);
      colIndex = toNumber(cell.getAttribute('data-col'), 0);
      if (this.isRowGroup(this.view[rowIndex])) {
        if (groupExpander) {
          this.toggleRowGroup(rowIndex);
        } else {
          this.select(rowIndex, this.selection.col);
          this.scrollIntoView(rowIndex, this.selection.col);
        }
        this.root.focus();
        return;
      }
      if (this.isRowGroupFooter(this.view[rowIndex])) {
        this.root.focus();
        return;
      }
      if (this.editing && (this.editing.row !== rowIndex || this.editing.col !== colIndex)) {
        if (this.finishEditing(true) === false) {
          event.preventDefault();
          return;
        }
      }
      if (this.shouldEditOnSelect(rowIndex, colIndex)) {
        this.selectRow(rowIndex, colIndex);
      } else {
        this.toggleRowSelection(rowIndex, colIndex);
      }
      this.scrollIntoView(rowIndex, colIndex);
      if (this.shouldEditOnSelect(rowIndex, colIndex)) {
        if (this.startEditing(rowIndex, colIndex)) {
          return;
        }
      }
      this.root.focus();
    }
  };

  FastGrid.prototype.toggleRowGroup = function(rowIndex) {
    var group = this.view[rowIndex];
    if (!this.isRowGroup(group)) {
      return;
    }
    if (this.emit('groupCollapsedChanging', { group: group, collapsed: !group.collapsed }) === false) {
      return;
    }
    this.rowGroupState[group.stateKey || group.key] = !group.collapsed;
    this.applyView();
    this.clampSelection();
    this.render();
    this.emit('groupCollapsedChanged', { group: group, collapsed: this.rowGroupState[group.stateKey || group.key] === true });
  };

  FastGrid.prototype.toggleAllRowGroups = function() {
    var groups = [];
    var shouldCollapse = false;
    var i;
    var group;
    for (i = 0; i < this.view.length; i += 1) {
      group = this.view[i];
      if (this.isRowGroup(group)) {
        groups.push(group);
        if (!group.collapsed) {
          shouldCollapse = true;
        }
      }
    }
    if (!groups.length) {
      return;
    }
    if (shouldCollapse) {
      for (i = 0; i < groups.length; i += 1) {
        this.rowGroupState[groups[i].stateKey || groups[i].key] = true;
      }
    } else {
      this.rowGroupState = {};
    }
    this.applyView();
    this.clampSelection();
    this.render();
  };

  FastGrid.prototype.handleHeaderSearchBeforeInput = function(event) {
    var input = closest(event.target, 'fg-header-search-input');
    var colIndex;
    var column;
    var config;
    var text;
    if (!input || event.isComposing || event.data == null) {
      return;
    }
    colIndex = toNumber(input.getAttribute('data-col'), -1);
    column = this.visibleColumns[colIndex];
    if (!column) {
      return;
    }
    config = getColumnEditorConfig(column);
    text = String(event.data);
    if (isDateLikeEditorType(config.type) && /[^0-9]/.test(text)) {
      event.preventDefault();
    }
  };

  FastGrid.prototype.handleHeaderSearchInput = function(event) {
    var input = closest(event.target, 'fg-header-search-input');
    var colIndex;
    var column;
    var selectionStart;
    var selectionEnd;
    var config;
    var mask;
    var formatted;
    var key;
    var value;
    if (!input) {
      return;
    }
    colIndex = toNumber(input.getAttribute('data-col'), -1);
    column = this.visibleColumns[colIndex];
    if (!column) {
      return;
    }
    config = getColumnEditorConfig(column);
    mask = getEditorMask(column);
    if (mask) {
      formatted = formatMaskText(input.value, { mask: mask });
      if (formatted !== input.value) {
        input.value = formatted;
        input.setSelectionRange(formatted.length, formatted.length);
      }
    } else if (isDateLikeEditorType(config.type)) {
      formatted = sanitizeDateEditorText(input.value);
      if (formatted !== input.value) {
        input.value = formatted;
        input.setSelectionRange(formatted.length, formatted.length);
      }
    }
    if (this.dateboxTarget && this.dateboxTarget.type === 'search' && this.dateboxTarget.input === input) {
      this.syncDateboxPanelToTarget(this.dateboxTarget);
      if (this.isDateboxPanelOpen()) {
        this.renderDateboxPanel();
      }
    }
    if (this.comboboxTarget && this.comboboxTarget.type === 'search' && this.comboboxTarget.input === input && this.isComboboxPanelOpen()) {
      this.renderComboboxPanel(false);
      this.setComboboxActiveIndex(this.getComboboxInitialActiveIndex());
      this.positionHeaderSearchComboboxPanel(input);
    }
    selectionStart = input.selectionStart;
    selectionEnd = input.selectionEnd;
    key = getColumnSearchKey(column);
    value = String(input.value || '').trim();
    if (value) {
      this.columnSearchValues[key] = value;
    } else {
      delete this.columnSearchValues[key];
    }
    this.updateColumnSearchState();
    this.scheduleHeaderSearch(colIndex, selectionStart, selectionEnd);
  };

  FastGrid.prototype.handleHeaderSearchIconClick = function(event, button) {
    var colIndex = toNumber(button.getAttribute('data-col'), -1);
    var column = this.visibleColumns[colIndex];
    var icons;
    var iconIndex;
    var iconConfig;
    var handler;
    var input;
    var result;
    if (!column) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    icons = getColumnSearchIconConfigs(column);
    iconIndex = toNumber(button.getAttribute('data-icon-index'), -1);
    iconConfig = icons[iconIndex];
    handler = iconConfig && (iconConfig.onClick || iconConfig.click || iconConfig.handler);
    input = this.header.querySelector('.fg-header-search-input[data-col="' + colIndex + '"]');
    if (iconConfig && iconConfig.builtin === 'datebox') {
      this.showHeaderSearchDateboxPanel(input, column);
      return;
    }
    if (iconConfig && iconConfig.builtin === 'combobox') {
      this.showHeaderSearchComboboxPanel(input, column, true);
      return;
    }
    if (typeof handler === 'function') {
      result = handler.call(this, this.createHeaderSearchIconArgs(event, button, input, column, iconConfig, iconIndex));
    }
    if (result !== false && (!iconConfig || iconConfig.keepFocus !== false) && input) {
      input.focus();
    }
  };

  FastGrid.prototype.createHeaderSearchIconArgs = function(event, button, input, column, iconConfig, iconIndex) {
    return {
      grid: this,
      column: column,
      col: column ? column._viewIndex : -1,
      input: input || null,
      editor: input || null,
      value: input ? input.value : '',
      text: input ? input.value : '',
      button: button,
      icon: iconConfig || null,
      iconIndex: iconIndex == null ? -1 : iconIndex,
      icons: column ? getColumnSearchIconConfigs(column) : [],
      event: event
    };
  };

  FastGrid.prototype.handleHeaderSearchKeyDown = function(event, input) {
    var colIndex;
    var column;
    var direction;
    var nextCol;
    if (this.handleMaskedHeaderSearchDelete(event, input)) {
      return true;
    }
    if (this.handleHeaderSearchComboboxKeyDown(event, input)) {
      return true;
    }
    if (event.key !== 'Enter' && event.key !== 'Tab') {
      return false;
    }
    colIndex = toNumber(input.getAttribute('data-col'), -1);
    if (colIndex < 0) {
      return false;
    }
    column = this.visibleColumns[colIndex];
    event.preventDefault();
    event.stopPropagation();
    this.normalizeHeaderSearchComboboxText(input, column);
    direction = event.shiftKey ? -1 : 1;
    nextCol = colIndex + direction;
    this.cancelHeaderSearchTimer();
    this.applyView();
    this.resetVerticalScroll();
    this.refresh();
    if (nextCol < 0 || nextCol >= this.visibleColumns.length) {
      this.focusHeaderSearchInput(colIndex);
    } else {
      this.moveHeaderSearchFocus(colIndex, direction);
    }
    return true;
  };

  FastGrid.prototype.normalizeHeaderSearchComboboxText = function(input, column) {
    var config;
    var value;
    var text;
    var key;
    if (!input || !column) {
      return;
    }
    config = getColumnEditorConfig(column);
    if (!config || config.type !== 'combobox') {
      return;
    }
    value = String(input.value || '').trim();
    if (!value) {
      return;
    }
    text = getComboboxTextByValue(value, config);
    if (text !== input.value) {
      input.value = text;
      key = getColumnSearchKey(column);
      this.columnSearchValues[key] = String(text).trim();
      this.updateColumnSearchState();
    }
  };

  FastGrid.prototype.handleHeaderSearchComboboxKeyDown = function(event, input) {
    var colIndex;
    var column;
    if (!input) {
      return false;
    }
    colIndex = toNumber(input.getAttribute('data-col'), -1);
    column = this.visibleColumns[colIndex];
    if (!column || getColumnEditorConfig(column).type !== 'combobox') {
      return false;
    }
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      this.showHeaderSearchComboboxPanel(input, column, true);
      return true;
    }
    if (!this.isComboboxPanelOpen() || !this.comboboxTarget || this.comboboxTarget.input !== input) {
      return false;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.setComboboxActiveIndex(this.comboboxActiveIndex + 1);
      return true;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.setComboboxActiveIndex(this.comboboxActiveIndex - 1);
      return true;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.selectComboboxActiveOption();
      return true;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.hideComboboxPanel();
      input.focus();
      return true;
    }
    return false;
  };

  FastGrid.prototype.handleMaskedHeaderSearchDelete = function(event, input) {
    var colIndex;
    var column;
    var mask;
    var raw;
    var start;
    var end;
    var deleteStart;
    var deleteEnd;
    var nextRaw;
    var nextText;
    var nextCaret;
    if (!input || (event.key !== 'Backspace' && event.key !== 'Delete')) {
      return false;
    }
    colIndex = toNumber(input.getAttribute('data-col'), -1);
    column = this.visibleColumns[colIndex];
    mask = getEditorMask(column);
    if (!column || !mask) {
      return false;
    }
    event.preventDefault();
    event.stopPropagation();
    start = input.selectionStart == null ? input.value.length : input.selectionStart;
    end = input.selectionEnd == null ? start : input.selectionEnd;
    raw = extractMaskCharacters(input.value, mask);
    deleteStart = countMaskCharactersBeforeCaret(input.value, mask, start);
    deleteEnd = countMaskCharactersBeforeCaret(input.value, mask, end);
    if (start === end) {
      if (event.key === 'Backspace') {
        if (deleteStart <= 0) {
          return true;
        }
        deleteStart -= 1;
      } else if (deleteStart >= raw.length) {
        return true;
      } else {
        deleteEnd += 1;
      }
    }
    nextRaw = raw.slice(0, deleteStart) + raw.slice(deleteEnd);
    nextText = applyMask(nextRaw, mask);
    nextCaret = getMaskCaretPosition(nextText, mask, deleteStart);
    input.value = nextText;
    input.setSelectionRange(nextCaret, nextCaret);
    this.handleHeaderSearchInput({ target: input });
    return true;
  };

  FastGrid.prototype.moveHeaderSearchFocus = function(colIndex, direction) {
    var nextCol = colIndex + direction;
    if (nextCol < 0 || nextCol >= this.visibleColumns.length) {
      return;
    }
    this.scrollHeaderSearchColumnIntoView(nextCol, direction);
    this.render();
    this.requestHeaderSearchFocus(nextCol);
  };

  FastGrid.prototype.scrollHeaderSearchColumnIntoView = function(col, direction) {
    var column = this.visibleColumns[col];
    var viewportWidth;
    var scrollLeft;
    var columnLeft;
    var columnRight;
    var margin = 12;
    if (!column || col < this.frozenColumns || col >= this.scrollableColumnEnd) {
      return;
    }
    viewportWidth = Math.max(0, this.bodyScroll.clientWidth - this.getFixedLeftWidth() - this.frozenWidth - this.frozenRightWidth);
    scrollLeft = this.bodyScroll.scrollLeft;
    columnLeft = column._left - this.frozenWidth;
    columnRight = columnLeft + column._width;
    if (direction > 0 && columnRight + margin > scrollLeft + viewportWidth) {
      this.bodyScroll.scrollLeft = Math.max(0, columnRight - viewportWidth + margin);
    } else if (direction < 0 && columnLeft - margin < scrollLeft) {
      this.bodyScroll.scrollLeft = Math.max(0, columnLeft - margin);
    } else if (columnLeft < scrollLeft) {
      this.bodyScroll.scrollLeft = Math.max(0, columnLeft);
    } else if (columnRight > scrollLeft + viewportWidth) {
      this.bodyScroll.scrollLeft = Math.max(0, columnRight - viewportWidth);
    }
  };

  FastGrid.prototype.getActiveHeaderSearchInput = function() {
    var active = document.activeElement;
    if (!active || !this.header || !this.header.contains(active)) {
      return null;
    }
    return closest(active, 'fg-header-search-input');
  };

  FastGrid.prototype.focusHeaderSearchInput = function(colIndex, selectionStart, selectionEnd) {
    var input = this.header.querySelector('.fg-header-search-input[data-col="' + colIndex + '"]');
    if (!input) {
      return false;
    }
    input.focus();
    if (selectionStart != null && input.setSelectionRange) {
      input.setSelectionRange(selectionStart, selectionEnd == null ? selectionStart : selectionEnd);
    }
    return true;
  };

  FastGrid.prototype.focusHeaderSearchInputLater = function(colIndex, selectionStart, selectionEnd) {
    this.requestHeaderSearchFocus(colIndex, selectionStart, selectionEnd);
  };

  FastGrid.prototype.requestHeaderSearchFocus = function(colIndex, selectionStart, selectionEnd) {
    this.headerSearchFocusRequest = {
      col: colIndex,
      selectionStart: selectionStart,
      selectionEnd: selectionEnd,
      attempts: 4
    };
    this.restoreHeaderSearchFocus();
    this.scheduleHeaderSearchFocusRestore();
  };

  FastGrid.prototype.scheduleHeaderSearchFocusRestore = function() {
    var self = this;
    if (this.headerSearchFocusRaf || !this.headerSearchFocusRequest || this.disposed) {
      return;
    }
    this.headerSearchFocusRaf = window.requestAnimationFrame(function() {
      self.headerSearchFocusRaf = 0;
      self.restoreHeaderSearchFocus();
      if (self.headerSearchFocusRequest) {
        self.scheduleHeaderSearchFocusRestore();
      }
    });
  };

  FastGrid.prototype.restoreHeaderSearchFocus = function() {
    var request = this.headerSearchFocusRequest;
    if (!request) {
      return;
    }
    this.focusHeaderSearchInput(request.col, request.selectionStart, request.selectionEnd);
    request.attempts -= 1;
    if (request.attempts <= 0) {
      this.headerSearchFocusRequest = null;
    }
  };

  FastGrid.prototype.updateColumnSearchState = function() {
    var key;
    this.hasColumnSearch = false;
    for (key in this.columnSearchValues) {
      if (Object.prototype.hasOwnProperty.call(this.columnSearchValues, key) && String(this.columnSearchValues[key] || '').trim()) {
        this.hasColumnSearch = true;
        return;
      }
    }
  };

  FastGrid.prototype.canDragColumns = function() {
    var mode = this.options.allowDragging;
    if (mode === true) {
      return true;
    }
    mode = mode == null ? '' : String(mode).toLowerCase();
    return mode === 'columns' || mode === 'column' || mode === 'all';
  };

  FastGrid.prototype.startColumnDrag = function(event, header, colIndex) {
    var column = this.visibleColumns[colIndex];
    var headerRect;
    var title;
    var titleRect;
    if (!column || !this.canDragColumns()) {
      return;
    }
    headerRect = header.getBoundingClientRect();
    title = header.querySelector('.fg-header-title');
    titleRect = title ? title.getBoundingClientRect() : headerRect;
    this.columnDragState = {
      column: column,
      sourceIndex: colIndex,
      partition: this.getColumnDragPartition(colIndex),
      startX: event.clientX,
      startY: event.clientY,
      pointerOffsetX: event.clientX - headerRect.left,
      pointerOffsetY: event.clientY - titleRect.top,
      sourceLeft: headerRect.left,
      sourceTop: titleRect.top,
      previewWidth: headerRect.width,
      previewHeight: titleRect.height,
      pointerId: event.pointerId,
      pointerTarget: header,
      active: false,
      target: null
    };
  };

  FastGrid.prototype.getColumnDragPartition = function(colIndex) {
    if (colIndex < this.frozenColumns) {
      return 'left';
    }
    if (colIndex >= this.scrollableColumnEnd) {
      return 'right';
    }
    return 'main';
  };

  FastGrid.prototype.getColumnDragPartitionRange = function(partition) {
    if (partition === 'left') {
      return { start: 0, end: this.frozenColumns };
    }
    if (partition === 'right') {
      return { start: this.scrollableColumnEnd, end: this.visibleColumns.length };
    }
    return { start: this.frozenColumns, end: this.scrollableColumnEnd };
  };

  FastGrid.prototype.getColumnDragTarget = function(clientX, clientY, state) {
    var range = this.getColumnDragPartitionRange(state.partition);
    var headerRect = this.header.getBoundingClientRect();
    var cell;
    var rect;
    var column;
    var beforeColumn;
    var position;
    var i;
    if (clientY < headerRect.top || clientY > headerRect.bottom) {
      return null;
    }
    for (i = range.start; i < range.end; i += 1) {
      cell = this.root.querySelector('.fg-header-cell[data-col="' + i + '"]');
      if (!cell) {
        continue;
      }
      rect = cell.getBoundingClientRect();
      if (clientX < rect.left || clientX > rect.right) {
        continue;
      }
      column = this.visibleColumns[i];
      position = clientX < rect.left + rect.width / 2 ? 'before' : 'after';
      beforeColumn = position === 'before' ? column :
        i + 1 < range.end ? this.visibleColumns[i + 1] : this.visibleColumns[range.end] || null;
      return {
        index: i,
        position: position,
        beforeColumn: beforeColumn,
        cell: cell
      };
    }
    return null;
  };

  FastGrid.prototype.getColumnDragDestinationIndex = function(column, beforeColumn) {
    var sourceIndex = this.columns.indexOf(column);
    var targetIndex = beforeColumn ? this.columns.indexOf(beforeColumn) : this.columns.length;
    if (sourceIndex < 0) {
      return -1;
    }
    if (targetIndex > sourceIndex) {
      targetIndex -= 1;
    }
    return targetIndex;
  };

  FastGrid.prototype.isColumnDragMoveNeeded = function(state, target) {
    return this.getColumnDragDestinationIndex(state.column, target.beforeColumn) !== this.columns.indexOf(state.column);
  };

  FastGrid.prototype.setColumnDragTarget = function(target) {
    if (this.columnDragTargetCell) {
      this.columnDragTargetCell.classList.remove('fg-column-drag-before', 'fg-column-drag-after');
    }
    this.columnDragTargetCell = target ? target.cell : null;
    this.updateColumnDragIndicator(target);
  };

  FastGrid.prototype.updateColumnDragIndicator = function(target) {
    var rootRect;
    var headerRect;
    var cellRect;
    var left;
    if (!target) {
      if (this.columnDragIndicator) {
        this.columnDragIndicator.style.display = 'none';
      }
      return;
    }
    if (!this.columnDragIndicator) {
      this.columnDragIndicator = document.createElement('div');
      this.columnDragIndicator.className = 'fg-column-drop-indicator';
      this.root.appendChild(this.columnDragIndicator);
    }
    rootRect = this.root.getBoundingClientRect();
    headerRect = this.header.getBoundingClientRect();
    cellRect = target.cell.getBoundingClientRect();
    left = (target.position === 'before' ? cellRect.left : cellRect.right) - rootRect.left;
    this.columnDragIndicator.style.display = 'block';
    this.columnDragIndicator.style.left = Math.round(left) + 'px';
    this.columnDragIndicator.style.top = Math.round(headerRect.top - rootRect.top) + 'px';
    this.columnDragIndicator.style.height = Math.round(headerRect.height) + 'px';
  };

  FastGrid.prototype.showColumnDragPreview = function(state) {
    var preview;
    var title;
    if (state.preview) {
      return;
    }
    preview = document.createElement('div');
    preview.className = state.pointerTarget.className + ' fg-column-drag-preview';
    preview.setAttribute('aria-hidden', 'true');
    title = state.pointerTarget.querySelector('.fg-header-title');
    if (title) {
      preview.appendChild(title.cloneNode(true));
    }
    preview.style.width = state.previewWidth + 'px';
    preview.style.height = state.previewHeight + 'px';
    this.root.appendChild(preview);
    state.preview = preview;
  };

  FastGrid.prototype.updateColumnDragPreview = function(event, state) {
    if (!state.preview) {
      return;
    }
    state.preview.style.left = event.clientX - state.pointerOffsetX + 'px';
    state.preview.style.top = event.clientY - state.pointerOffsetY + 'px';
  };

  FastGrid.prototype.removeColumnDragPreview = function(state) {
    if (state.preview && state.preview.parentNode) {
      state.preview.parentNode.removeChild(state.preview);
    }
    state.preview = null;
  };

  FastGrid.prototype.returnColumnDragPreview = function(state) {
    var preview = state.preview;
    var headerRect;
    var title;
    var titleRect;
    if (!preview) {
      return;
    }
    if (state.pointerTarget && state.pointerTarget.isConnected) {
      headerRect = state.pointerTarget.getBoundingClientRect();
      title = state.pointerTarget.querySelector('.fg-header-title');
      titleRect = title ? title.getBoundingClientRect() : headerRect;
      state.sourceLeft = headerRect.left;
      state.sourceTop = titleRect.top;
    }
    preview.getBoundingClientRect();
    preview.classList.add('fg-column-drag-returning');
    preview.style.left = state.sourceLeft + 'px';
    preview.style.top = state.sourceTop + 'px';
    window.setTimeout(function() {
      if (preview.parentNode) {
        preview.parentNode.removeChild(preview);
      }
    }, 230);
    state.preview = null;
  };

  FastGrid.prototype.updateColumnDrag = function(event) {
    var state = this.columnDragState;
    var target;
    var from;
    var to;
    if (!state || (state.pointerId != null && event.pointerId != null && state.pointerId !== event.pointerId)) {
      return;
    }
    if (!state.active) {
      if (Math.abs(event.clientX - state.startX) < 5 && Math.abs(event.clientY - state.startY) < 5) {
        return;
      }
      state.active = true;
      this.root.classList.add('fg-column-dragging');
      this.showColumnDragPreview(state);
      if (state.pointerTarget && state.pointerTarget.setPointerCapture && event.pointerId != null) {
        state.pointerTarget.setPointerCapture(event.pointerId);
      }
    }
    event.preventDefault();
    this.updateColumnDragPreview(event, state);
    target = this.getColumnDragTarget(event.clientX, event.clientY, state);
    if (!target || !this.isColumnDragMoveNeeded(state, target)) {
      target = null;
    }
    if (state.target && target && state.target.beforeColumn === target.beforeColumn && state.target.position === target.position) {
      return;
    }
    from = state.sourceIndex;
    to = target ? this.getColumnDragDestinationIndex(state.column, target.beforeColumn) : -1;
    if (target && this.emit('draggingColumn', {
      column: state.column,
      from: from,
      to: to,
      position: target.position
    }) === false) {
      target = null;
    }
    state.target = target;
    this.setColumnDragTarget(target);
  };

  FastGrid.prototype.moveColumnBefore = function(column, beforeColumn) {
    var sourceIndex = this.columns.indexOf(column);
    var destinationIndex = this.getColumnDragDestinationIndex(column, beforeColumn);
    var selectedColumn = this.visibleColumns[this.selection.col] || null;
    if (sourceIndex < 0 || destinationIndex < 0 || sourceIndex === destinationIndex) {
      return false;
    }
    this.columns.splice(sourceIndex, 1);
    this.columns.splice(destinationIndex, 0, column);
    this.updateLayout();
    if (selectedColumn) {
      this.selection.col = Math.max(0, this.visibleColumns.indexOf(selectedColumn));
    }
    this.render();
    return true;
  };

  FastGrid.prototype.finishColumnDrag = function(event) {
    var state = this.columnDragState;
    var moved = false;
    var shouldReturn = false;
    var destinationIndex;
    if (!state || (state.pointerId != null && event.pointerId != null && state.pointerId !== event.pointerId)) {
      return;
    }
    if (state.active) {
      event.preventDefault();
      this.suppressClick = true;
      if (state.target && this.isColumnDragMoveNeeded(state, state.target)) {
        if (!this.editing || this.finishEditing(true) !== false) {
          destinationIndex = this.getColumnDragDestinationIndex(state.column, state.target.beforeColumn);
          moved = this.moveColumnBefore(state.column, state.target.beforeColumn);
          if (moved) {
            this.emit('draggedColumn', {
              column: state.column,
              from: state.sourceIndex,
              to: destinationIndex,
              position: state.target.position
            });
          }
        }
      }
      shouldReturn = !moved;
    }
    if (state.pointerTarget && state.pointerTarget.releasePointerCapture && event.pointerId != null) {
      try {
        state.pointerTarget.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Ignore a pointer that was already released by the browser.
      }
    }
    this.setColumnDragTarget(null);
    if (shouldReturn) {
      this.returnColumnDragPreview(state);
    } else {
      this.removeColumnDragPreview(state);
    }
    this.root.classList.remove('fg-column-dragging');
    this.columnDragState = null;
  };

  FastGrid.prototype.handlePointerDown = function(event) {
    var resize = closest(event.target, 'fg-resize');
    var header = closest(event.target, 'fg-header-cell');
    var colIndex;
    if (this.busy) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.button != null && event.button !== 0) {
      return;
    }
    if (resize && this.options.allowResizing !== false) {
      this.startResize(event, toNumber(resize.getAttribute('data-resize-col'), 0));
      return;
    }
    if (!header || closest(event.target, 'fg-header-search') || closest(event.target, 'fg-filter-icon')) {
      return;
    }
    colIndex = toNumber(header.getAttribute('data-col'), -1);
    if (colIndex >= 0) {
      this.startColumnDrag(event, header, colIndex);
    }
  };

  FastGrid.prototype.handleDblClick = function(event) {
    var cell = closest(event.target, 'fg-cell');
    var rowHeader = closest(event.target, 'fg-row-header-cell');
    var rowIndex;
    if (this.busy) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (this.handleTopLeftSearchDblClick(event)) {
      return;
    }
    if (rowHeader) {
      rowIndex = toNumber(rowHeader.getAttribute('data-row'), -1);
      if (rowIndex === 0 && this.isRowGroup(this.view[rowIndex])) {
        event.preventDefault();
        event.stopPropagation();
        this.toggleAllRowGroups();
        this.root.focus();
      }
      return;
    }
    if (!cell || !this.options.allowEditing) {
      return;
    }
    this.startEditing(toNumber(cell.getAttribute('data-row'), 0), toNumber(cell.getAttribute('data-col'), 0));
  };

  FastGrid.prototype.handleTopLeftSearchDblClick = function(event) {
    var searchCount = closest(event.target, 'fg-search-count');
    var topCell;
    if (!searchCount || this.options.showSearchRow !== true) {
      return false;
    }
    topCell = closest(event.target, 'fg-row-header-top') || closest(event.target, 'fg-selection-top');
    if (topCell !== this.rowHeaderTop && topCell !== this.selectionTop) {
      return false;
    }
    event.preventDefault();
    event.stopPropagation();
    this.clearSearchConditions('topLeftSearchCell');
    return true;
  };

  FastGrid.prototype.handleMouseMove = function(event) {
    var rowHeader = closest(event.target, 'fg-row-header-cell');
    var selectionCell = closest(event.target, 'fg-selection-cell');
    var cell = closest(event.target, 'fg-cell');
    var nextRow = null;
    if (rowHeader) {
      nextRow = toNumber(rowHeader.getAttribute('data-row'), null);
    } else if (selectionCell) {
      nextRow = toNumber(selectionCell.getAttribute('data-row'), null);
    } else if (cell) {
      nextRow = toNumber(cell.getAttribute('data-row'), null);
    }
    this.updateInvalidTip(cell);
    if (this.hoverRow !== nextRow) {
      this.hoverRow = nextRow;
      this.renderVisibleRows();
    }
  };

  FastGrid.prototype.handleMouseLeave = function() {
    this.hideInvalidTip();
    if (this.hoverRow !== null) {
      this.hoverRow = null;
      this.renderVisibleRows();
    }
  };

  FastGrid.prototype.updateInvalidTip = function(cell) {
    var rowIndex;
    var colIndex;
    var row;
    var column;
    var error;
    if (!cell || !this.invalidTip || cell.className.indexOf('fg-cell-invalid') < 0) {
      this.hideInvalidTip();
      return;
    }
    rowIndex = toNumber(cell.getAttribute('data-row'), -1);
    colIndex = toNumber(cell.getAttribute('data-col'), -1);
    row = this.view[rowIndex];
    column = this.visibleColumns[colIndex];
    error = this.getCellValidationError(row, column);
    if (!error) {
      this.hideInvalidTip();
      return;
    }
    this.showInvalidTip(cell, error.message || this.getText('validation.invalidValue'));
  };

  FastGrid.prototype.showInvalidTip = function(cell, message) {
    var cellRect = cell.getBoundingClientRect();
    var bodyRect = this.body.getBoundingClientRect();
    var tip = this.invalidTip;
    var left;
    var top;
    var maxLeft;
    if (!tip) {
      return;
    }
    tip.textContent = message;
    tip.style.display = 'block';
    left = cellRect.right - bodyRect.left + 8;
    top = cellRect.top - bodyRect.top + Math.max(4, (cellRect.height - tip.offsetHeight) / 2);
    maxLeft = this.body.clientWidth - tip.offsetWidth - 8;
    if (left > maxLeft) {
      left = cellRect.left - bodyRect.left - tip.offsetWidth - 8;
    }
    if (left < 8) {
      left = Math.min(maxLeft, Math.max(8, cellRect.left - bodyRect.left));
      top = cellRect.bottom - bodyRect.top + 6;
    }
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  };

  FastGrid.prototype.hideInvalidTip = function() {
    if (this.invalidTip) {
      this.invalidTip.style.display = 'none';
    }
  };

  FastGrid.prototype.isHeaderToggleKey = function(event) {
    return isHotKey(event, this.options.headerToggleKey);
  };

  FastGrid.prototype.handleKeyDown = function(event) {
    var row = this.selection.row;
    var col = this.selection.col;
    var targetName = event.target && event.target.tagName ? event.target.tagName.toUpperCase() : '';
    var searchInput = closest(event.target, 'fg-header-search-input');

    if (this.busy) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (searchInput && this.handleHeaderSearchKeyDown(event, searchInput)) {
      return;
    }

    if (this.isHeaderToggleKey(event)) {
      event.preventDefault();
      event.stopPropagation();
      this.toggleHeaderDisplayMode();
      return;
    }

    if (this.editing) {
      if (event.target === this.editor && this.handleMaskedEditorDelete(event)) {
        return;
      }
      if (event.target === this.editor && this.handleComboboxKeyDown(event)) {
        return;
      }
      if (event.target === this.editor && this.shouldBlockEditorKey(event)) {
        event.preventDefault();
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        if (event.shiftKey) {
          this.commitEditingAndMoveLeft();
        } else {
          this.commitEditingAndMoveRight();
        }
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.commitEditingAndMoveVertical(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.commitEditingAndMoveVertical(-1);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.finishEditing(false);
      }
      return;
    }

    if (targetName === 'INPUT' && event.target !== this.editor) {
      return;
    }

    if (this.options.autoClipboard !== false && (event.ctrlKey || event.metaKey) && !event.altKey && String(event.key).toLowerCase() === 'c') {
      event.preventDefault();
      this.copySelection();
      return;
    }

    if (event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space') {
      event.preventDefault();
      if (this.options.multiSelectRows === true && this.view.length) {
        this.toggleRowSelection(row, col);
        this.scrollIntoView(row, col);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      row += 1;
      event.preventDefault();
      this.moveVertical(row, col);
      return;
    } else if (event.key === 'ArrowUp') {
      row -= 1;
      event.preventDefault();
      this.moveVertical(row, col);
      return;
    } else if (event.key === 'ArrowRight') {
      col += 1;
    } else if (event.key === 'ArrowLeft') {
      col -= 1;
    } else if (event.key === 'Enter' || event.key === 'F2') {
      if (this.options.allowEditing) {
        event.preventDefault();
        this.startEditing(row, col);
      }
      return;
    } else {
      return;
    }
    event.preventDefault();
    this.moveCell(row, col);
  };

  FastGrid.prototype.moveCell = function(row, col) {
    var next;
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    if (this.options.editOnSelect === true) {
      next = this.findEditableCellInRow(row, col, col >= this.selection.col ? 1 : -1);
      if (next) {
        row = next.row;
        col = next.col;
      }
      this.select(row, col);
      this.scrollIntoView(row, col);
      if (this.shouldEditOnSelect(row, col)) {
        this.startEditing(row, col, { selectRow: this.options.multiSelectRows !== true });
      }
      return;
    }
    this.selectRow(row, col);
    this.scrollIntoView(row, col);
  };

  FastGrid.prototype.moveVertical = function(row, col) {
    var next;
    var direction = row > this.selection.row ? 1 : row < this.selection.row ? -1 : 0;
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    if (this.options.editOnSelect === true) {
      if (!this.isCellEditable(this.selection.row, this.selection.col)) {
        if (this.options.multiSelectRows === true) {
          this.select(row, col);
        } else {
          this.selectRow(row, col);
        }
        this.scrollIntoView(row, col, { directionY: direction });
        return;
      }
      next = this.findEditableCellInRow(row, col, 1);
      if (next) {
        this.select(next.row, next.col);
        this.scrollIntoView(next.row, next.col, { directionY: direction });
        this.startEditing(next.row, next.col, { selectRow: this.options.multiSelectRows !== true });
      }
      return;
    }
    if (this.options.multiSelectRows === true) {
      this.select(row, col);
      this.scrollIntoView(row, col, { directionY: direction });
      return;
    }
    this.selectRow(row, col);
    this.scrollIntoView(row, col, { directionY: direction });
  };

  FastGrid.prototype.select = function(row, col) {
    var nextRowSelection;
    var rowSelectionChanged;
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    nextRowSelection = this.options.multiSelectRows === true ? null : row;
    rowSelectionChanged = this.rowSelection !== nextRowSelection;
    if (this.selection.row === row && this.selection.col === col && !rowSelectionChanged) {
      this.render();
      return;
    }
    if (this.emit('selectionChanging', { row: row, col: col }) === false) {
      return;
    }
    if (rowSelectionChanged && this.options.multiSelectRows !== true && this.emit('rowSelectionChanging', { row: nextRowSelection }) === false) {
      return;
    }
    this.rowSelection = nextRowSelection;
    this.selection = { row: row, col: col };
    this.emit('selectionChanged', { row: row, col: col });
    if (rowSelectionChanged && this.options.multiSelectRows !== true) {
      this.emit('rowSelectionChanged', { row: nextRowSelection });
    }
    this.render();
  };

  FastGrid.prototype.selectRow = function(row, col) {
    var item;
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = col == null ? this.selection.col : col;
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    if (this.emit('rowSelectionChanging', { row: row }) === false) {
      return;
    }
    this.rowSelection = row;
    if (this.options.multiSelectRows === true) {
      this.selectedRowMap[row] = true;
      item = this.view[row];
      if (!this.isRowGroup(item) && !this.isRowGroupFooter(item)) {
        this.setItemSelectionState(item, true);
      }
    }
    this.selection = {
      row: row,
      col: col
    };
    this.emit('selectionChanged', { row: row, col: col });
    this.emit('rowSelectionChanged', { row: row });
    this.render();
  };

  FastGrid.prototype.toggleRowSelection = function(row, col) {
    var item;
    var groupState;
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = col == null ? this.selection.col : col;
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    if (this.options.multiSelectRows !== true) {
      this.selectRow(row, col);
      return;
    }
    item = this.view[row];
    if (this.isRowGroup(item)) {
      groupState = this.getRowGroupSelectionState(item);
      this.setItemsSelectionState(item.items || [], !groupState.checked);
    } else {
      this.setItemSelectionState(item, !this.isItemSelected(item));
    }
    this.rebuildSelectedRowMap();
    this.rowSelection = row;
    this.selection = { row: row, col: col };
    this.emit('selectionChanged', { row: row, col: col });
    this.emit('rowSelectionChanged', { row: row });
    this.render();
  };

  FastGrid.prototype.setAllRowsSelected = function(selected) {
    this.resetSelectedItemSelection(this.options.multiSelectRows === true && selected ? (this.dataView || []).slice() : []);
    this.rebuildSelectedRowMap();
    this.emit('selectionChanged', { allRows: selected === true });
    this.render();
  };

  FastGrid.prototype.isRowSelected = function(row) {
    if (this.options.multiSelectRows === true) {
      return this.selectedRowMap[row] === true;
    }
    return this.rowSelection === row;
  };

  FastGrid.prototype.getSelectedRowCount = function() {
    var count = 0;
    var key;
    for (key in this.selectedRowMap) {
      if (Object.prototype.hasOwnProperty.call(this.selectedRowMap, key) && this.selectedRowMap[key]) {
        count += 1;
      }
    }
    return count;
  };

  FastGrid.prototype.isItemSelected = function(item) {
    if (!item) {
      return false;
    }
    if (this._selectedItemSet && isWeakSetValue(item)) {
      return this._selectedItemSet.has(item);
    }
    return this.selectedItemRefs.indexOf(item) >= 0;
  };

  FastGrid.prototype.setItemSelectionState = function(item, selected) {
    var index;
    if (!item || this.isRowGroup(item) || this.isRowGroupFooter(item)) {
      return;
    }
    index = this.selectedItemRefs.indexOf(item);
    if (selected && index < 0) {
      this.selectedItemRefs.push(item);
      if (this._selectedItemSet && isWeakSetValue(item)) {
        this._selectedItemSet.add(item);
      }
    } else if (!selected && index >= 0) {
      this.selectedItemRefs.splice(index, 1);
      if (this._selectedItemSet && isWeakSetValue(item)) {
        this._selectedItemSet.delete(item);
      }
    }
  };

  FastGrid.prototype.resetSelectedItemSelection = function(items) {
    var item;
    var i;
    items = Array.isArray(items) ? items : [];
    this.selectedItemRefs = [];
    this._selectedItemSet = typeof WeakSet === 'function' ? new WeakSet() : null;
    for (i = 0; i < items.length; i += 1) {
      item = items[i];
      if (this._selectedItemSet && isWeakSetValue(item)) {
        if (this._selectedItemSet.has(item)) {
          continue;
        }
        this._selectedItemSet.add(item);
      } else if (this.selectedItemRefs.indexOf(item) >= 0) {
        continue;
      }
      this.selectedItemRefs.push(item);
    }
  };

  FastGrid.prototype.setItemsSelectionState = function(items, selected) {
    var i;
    for (i = 0; i < items.length; i += 1) {
      this.setItemSelectionState(items[i], selected);
    }
  };

  FastGrid.prototype.getRowGroupSelectionState = function(group) {
    var items = group && Array.isArray(group.items) ? group.items : [];
    var selectedCount = 0;
    var i;
    for (i = 0; i < items.length; i += 1) {
      if (this.isItemSelected(items[i])) {
        selectedCount += 1;
      }
    }
    return {
      checked: items.length > 0 && selectedCount === items.length,
      indeterminate: selectedCount > 0 && selectedCount < items.length,
      selectedCount: selectedCount,
      totalCount: items.length
    };
  };

  FastGrid.prototype.syncSelectedItemRefsFromView = function() {
    var item;
    var i;
    if (this.options.multiSelectRows !== true) {
      return;
    }
    for (i = 0; i < this.view.length; i += 1) {
      item = this.view[i];
      if (!this.isRowGroup(item) && !this.isRowGroupFooter(item)) {
        this.setItemSelectionState(item, this.selectedRowMap[i] === true);
      }
    }
  };

  FastGrid.prototype.rebuildSelectedRowMap = function() {
    var next = {};
    var item;
    var i;
    if (this.options.multiSelectRows !== true) {
      this.selectedRowMap = next;
      return;
    }
    for (i = 0; i < this.view.length; i += 1) {
      item = this.view[i];
      if ((this.isRowGroup(item) && this.getRowGroupSelectionState(item).checked) ||
          (!this.isRowGroup(item) && !this.isRowGroupFooter(item) && this.isItemSelected(item))) {
        next[i] = true;
      }
    }
    this.selectedRowMap = next;
  };

  FastGrid.prototype.captureSelectionState = function() {
    var selectedItems = [];
    var key;
    var index;
    if (this.options.multiSelectRows === true) {
      this.syncSelectedItemRefsFromView();
      for (key in this.selectedRowMap) {
        if (Object.prototype.hasOwnProperty.call(this.selectedRowMap, key) && this.selectedRowMap[key]) {
          index = toNumber(key, -1);
          if (index >= 0 && index < this.view.length) {
            selectedItems.push(this.view[index]);
          }
        }
      }
    }
    return {
      rowSelectionItem: this.rowSelection != null ? this.view[this.rowSelection] : null,
      activeItem: this.view[this.selection.row] || null,
      selectedItems: selectedItems
    };
  };

  FastGrid.prototype.restoreSelectionState = function(state) {
    var rowIndex;
    var activeIndex;
    var i;
    if (!state) {
      return;
    }
    if (this.options.multiSelectRows === true) {
      for (i = 0; i < state.selectedItems.length; i += 1) {
        if (!this.isRowGroup(state.selectedItems[i]) && !this.isRowGroupFooter(state.selectedItems[i])) {
          this.setItemSelectionState(state.selectedItems[i], true);
        }
      }
      this.rebuildSelectedRowMap();
    }
    rowIndex = findRowIndexByItem(this.view, state.rowSelectionItem);
    this.rowSelection = rowIndex >= 0 ? rowIndex : null;
    activeIndex = findRowIndexByItem(this.view, state.activeItem);
    if (activeIndex >= 0) {
      this.selection.row = activeIndex;
    } else if (this.rowSelection != null) {
      this.selection.row = this.rowSelection;
    }
  };

  FastGrid.prototype.pruneSelectedRows = function() {
    this.syncSelectedItemRefsFromView();
    this.rebuildSelectedRowMap();
  };

  FastGrid.prototype.copySelection = function() {
    var text = this.getSelectedText();
    var args;
    if (text == null) {
      return false;
    }
    args = {
      row: this.selection.row,
      col: this.selection.col,
      text: text,
      data: text
    };
    if (this.emit('copying', args) === false) {
      return false;
    }
    if (this.emit('copyingCell', args) === false) {
      return false;
    }
    text = args.text == null ? '' : String(args.text);
    this.copyText(text);
    args.text = text;
    args.data = text;
    this.emit('copied', args);
    this.emit('copiedCell', args);
    this.emit('cellCopied', {
      row: this.selection.row,
      col: this.selection.col,
      text: text
    });
    return true;
  };

  FastGrid.prototype.getSelectedText = function() {
    var value = this.getCellData(this.selection.row, this.selection.col);
    var column = this.visibleColumns[this.selection.col];
    var mask = getExplicitEditorMask(column);
    if (mask) {
      return getMaskCopyText(value, getMaskOptions(column, mask));
    }
    if (column && column.dataType === 'number') {
      return getNumberCopyText(value);
    }
    return value == null ? '' : String(value);
  };

  FastGrid.prototype.copyText = function(text) {
    var self = this;
    this.copyBuffer = text;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function() {
        self.copyTextWithTextarea(text);
      });
      return;
    }
    this.copyTextWithTextarea(text);
  };

  FastGrid.prototype.copyTextWithTextarea = function(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.left = '-1000px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (error) {
      this.emit('copyFailed', { error: error, text: text });
    }
    document.body.removeChild(textarea);
    this.root.focus();
  };

  FastGrid.prototype.clampSelection = function() {
    this.selection.row = clamp(this.selection.row, 0, Math.max(0, this.view.length - 1));
    this.selection.col = clamp(this.selection.col, 0, Math.max(0, this.visibleColumns ? this.visibleColumns.length - 1 : 0));
    if (this.options.multiSelectRows !== true && this.rowSelection == null && this.view.length) {
      this.rowSelection = this.selection.row;
    }
    if (this.rowSelection != null && this.rowSelection >= this.view.length) {
      this.rowSelection = this.view.length ? this.view.length - 1 : null;
    }
  };

  FastGrid.prototype.scrollIntoView = function(row, col, options) {
    var rowTop = row * this.options.rowHeight;
    var rowBottom = rowTop + this.options.rowHeight;
    var colObj = this.visibleColumns[col];
    var contentHeight = this.getScrollableContentHeight();
    var currentTop = this.bodyScroll.scrollTop;
    var currentBottom = currentTop + contentHeight;
    var lastFullRowTop = currentBottom - this.options.rowHeight;
    var partialBottomHeight;
    var scrollableViewportWidth = Math.max(0, this.bodyScroll.clientWidth - this.getFixedLeftWidth() - this.frozenWidth - this.frozenRightWidth);
    var scrollLeft;
    if (!colObj) {
      return;
    }
    options = options || {};
    if (options.directionY > 0 && rowTop >= lastFullRowTop) {
      this.bodyScroll.scrollTop = Math.max(0, rowBottom - contentHeight);
    } else if (rowTop < currentTop) {
      this.bodyScroll.scrollTop = rowTop;
    } else if (rowBottom > currentBottom) {
      this.bodyScroll.scrollTop = rowBottom - contentHeight;
    } else if (options.directionY > 0 && contentHeight > this.options.rowHeight) {
      partialBottomHeight = currentBottom - rowBottom;
      if (partialBottomHeight > 0 && partialBottomHeight < this.options.rowHeight) {
        this.bodyScroll.scrollTop = Math.max(0, rowBottom - contentHeight);
      }
    }
    if (col >= this.frozenColumns && col < this.scrollableColumnEnd) {
      scrollLeft = this.bodyScroll.scrollLeft;
      if (colObj._left - this.frozenWidth < scrollLeft) {
        this.bodyScroll.scrollLeft = colObj._left - this.frozenWidth;
      } else if (colObj._left + colObj._width - this.frozenWidth > scrollLeft + scrollableViewportWidth) {
        this.bodyScroll.scrollLeft = colObj._left + colObj._width - this.frozenWidth - scrollableViewportWidth;
      }
    }
    this.render();
  };

  FastGrid.prototype.startEditing = function(row, col, options) {
    var column = this.visibleColumns[col];
    var item = this.view[row];
    var args;
    var value;
    var shouldSelectRow = !options || options.selectRow !== false;
    if (!this.isCellEditable(row, col) || !item) {
      return false;
    }
    args = { row: row, col: col, column: column, item: item };
    if (this.emit('beginningEdit', args) === false) {
      return false;
    }
    if (this.emit('cellEditStarting', args) === false) {
      return false;
    }
    value = getByBinding(item, column.binding);
    if (shouldSelectRow) {
      this.rowSelection = row;
      if (this.options.multiSelectRows === true) {
        this.selectedRowMap[row] = true;
        this.setItemSelectionState(item, true);
      }
    }
    this.selection = { row: row, col: col };
    this.editorConfig = getColumnEditorConfig(column);
    this.editing = { row: row, col: col, item: item, original: value, editor: this.editorConfig };
    this.configureEditor(column);
    this.editor.value = this.getEditorText(value, column);
    if (this.editorConfig.type === 'combobox') {
      this.editing.comboboxValue = value;
    }
    this.editor.style.textAlign = normalizeTextAlign(column.align);
    this.editor.style.display = 'block';
    this.render();
    this.positionEditor();
    this.editor.focus();
    this.editor.select();
    return true;
  };

  FastGrid.prototype.configureEditor = function(column) {
    var config = getColumnEditorConfig(column);
    var type = config.type;
    var hasBuiltInEditorIcon = isDateLikeEditorType(type) || type === 'combobox';
    var iconConfigs = hasBuiltInEditorIcon ? [] : getEditorIconConfigs(config);
    var hasEditorIcons = hasBuiltInEditorIcon || iconConfigs.length > 0;
    this.editorConfig = config;
    this.editorIconConfigs = iconConfigs;
    this.renderEditorIcons(type, iconConfigs);
    this.editor.className = 'fg-editor textbox-f fg-editor-' + type + ' ' + type + '-f' + (hasEditorIcons ? ' fg-editor-with-icons' : '');
    this.editor.setAttribute('data-editor-type', type);
    this.editor.setAttribute('autocomplete', 'off');
    this.editor.type = 'text';
    this.editor.inputMode = type === 'numberbox' ? 'decimal' : isDateLikeEditorType(type) ? 'numeric' : 'text';
    this.editor.style.paddingRight = hasEditorIcons ? (getEditorIconConfigWidth(iconConfigs, type) + 6) + 'px' : '';
    this.editorIconHost.style.display = hasEditorIcons ? 'flex' : 'none';
    if (!isDateLikeEditorType(type)) {
      this.hideDateboxPanel();
    }
    if (type !== 'combobox') {
      this.hideComboboxPanel();
    }
  };

  FastGrid.prototype.renderEditorIcons = function(type, iconConfigs) {
    var fragment = document.createDocumentFragment();
    var button;
    var icon;
    var i;
    this.editorIconHost.innerHTML = '';
    if (iconConfigs && iconConfigs.length) {
      for (i = 0; i < iconConfigs.length; i += 1) {
        icon = iconConfigs[i];
        button = document.createElement('button');
        button.type = 'button';
        button.className = trimText('fg-editor-trigger fg-editor-trigger-custom ' + normalizeClassName(icon.iconCls || icon.className || icon.iconClass || icon.icon || ''));
        button.setAttribute('data-icon-index', i);
        button.setAttribute('aria-label', icon.ariaLabel || icon.label || icon.title || this.getText('aria.cellEditor'));
        button.title = icon.title || '';
        button.textContent = icon.text || '';
        button.style.width = Math.max(18, toNumber(icon.width, 22)) + 'px';
        fragment.appendChild(button);
      }
    } else {
      button = document.createElement('button');
      button.type = 'button';
      button.className = trimText('fg-editor-trigger fg-editor-trigger-' + type + (isDateLikeEditorType(type) ? ' icon-datebox' : ''));
      button.setAttribute('aria-label', this.getEditorTriggerLabel());
      button.style.width = '22px';
      fragment.appendChild(button);
    }
    this.editorIconHost.appendChild(fragment);
    this.editorTrigger = this.editorIconHost.querySelector('.fg-editor-trigger');
  };

  FastGrid.prototype.getEditorText = function(value, column) {
    var config = getColumnEditorConfig(column);
    var mask = getExplicitEditorMask(column);
    if (value == null) {
      return '';
    }
    if (mask) {
      return formatMaskText(value, getMaskOptions(column, mask));
    }
    if (config.type === 'numberbox') {
      return formatNumberEditorText(value, shouldUseThousandsSeparator(column), getNumberPrecision(column));
    }
    if (config.type === 'datebox') {
      return formatDateboxEditorText(value, config, column);
    }
    if (config.type === 'yymmbox') {
      return formatYymmboxEditorText(value, config, column);
    }
    if (config.type === 'combobox') {
      return getComboboxTextByValue(value, config);
    }
    return String(value);
  };

  FastGrid.prototype.shouldBlockEditorKey = function(event) {
    var edit = this.editing;
    var column;
    var config;
    var key;
    if (!edit || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) {
      return false;
    }
    key = event.key || '';
    if (key.length !== 1) {
      return false;
    }
    column = this.visibleColumns[edit.col];
    if (!column) {
      return false;
    }
    config = getColumnEditorConfig(column);
    if (isDateLikeEditorType(config.type)) {
      return !isDigitKey(key);
    }
    if (config.type === 'numberbox') {
      return !isNumberEditorTextAllowed(this.editor, key);
    }
    return false;
  };

  FastGrid.prototype.handleMaskedEditorDelete = function(event) {
    var edit = this.editing;
    var column;
    var mask;
    var raw;
    var start;
    var end;
    var deleteStart;
    var deleteEnd;
    var nextRaw;
    var nextText;
    var nextCaret;
    if (!edit || (event.key !== 'Backspace' && event.key !== 'Delete')) {
      return false;
    }
    column = this.visibleColumns[edit.col];
    mask = getEditorMask(column);
    if (!column || !mask) {
      return false;
    }
    event.preventDefault();
    start = this.editor.selectionStart == null ? this.editor.value.length : this.editor.selectionStart;
    end = this.editor.selectionEnd == null ? start : this.editor.selectionEnd;
    raw = extractMaskCharacters(this.editor.value, mask);
    deleteStart = countMaskCharactersBeforeCaret(this.editor.value, mask, start);
    deleteEnd = countMaskCharactersBeforeCaret(this.editor.value, mask, end);
    if (start === end) {
      if (event.key === 'Backspace') {
        if (deleteStart <= 0) {
          return true;
        }
        deleteStart -= 1;
      } else if (deleteStart >= raw.length) {
        return true;
      } else {
        deleteEnd += 1;
      }
    }
    nextRaw = raw.slice(0, deleteStart) + raw.slice(deleteEnd);
    nextText = applyMask(nextRaw, mask);
    nextCaret = getMaskCaretPosition(nextText, mask, deleteStart);
    this.editor.value = nextText;
    this.editor.setSelectionRange(nextCaret, nextCaret);
    return true;
  };

  FastGrid.prototype.handleEditorBeforeInput = function(event) {
    var edit = this.editing;
    var column;
    var config;
    var text;
    if (!edit || event.isComposing || event.data == null) {
      return;
    }
    column = this.visibleColumns[edit.col];
    if (!column) {
      return;
    }
    config = getColumnEditorConfig(column);
    text = String(event.data);
    if (isDateLikeEditorType(config.type) && /[^0-9]/.test(text)) {
      event.preventDefault();
      return;
    }
    if (config.type === 'numberbox' && !isNumberEditorTextAllowed(this.editor, text)) {
      event.preventDefault();
    }
  };

  FastGrid.prototype.handleEditorInput = function() {
    var edit = this.editing;
    var column;
    var config;
    var formatted;
    var mask;
    if (!edit) {
      return;
    }
    column = this.visibleColumns[edit.col];
    config = column ? getColumnEditorConfig(column) : null;
    mask = getEditorMask(column);
    if (mask) {
      formatted = formatMaskText(this.editor.value, { mask: mask });
      if (formatted !== this.editor.value) {
        this.editor.value = formatted;
        this.editor.setSelectionRange(formatted.length, formatted.length);
      }
      if (config && isDateLikeEditorType(config.type)) {
        this.syncDateboxPanelToEditor();
      }
      return;
    }
    if (!column || !config) {
      return;
    }
    if (config.type === 'datebox') {
      formatted = sanitizeDateEditorText(this.editor.value);
      if (formatted !== this.editor.value) {
        this.editor.value = formatted;
        this.editor.setSelectionRange(formatted.length, formatted.length);
      }
      this.syncDateboxPanelToEditor();
      return;
    }
    if (config.type === 'yymmbox') {
      formatted = sanitizeYymmboxEditorText(this.editor.value);
      if (formatted !== this.editor.value) {
        this.editor.value = formatted;
        this.editor.setSelectionRange(formatted.length, formatted.length);
      }
      this.syncDateboxPanelToEditor();
      return;
    }
    if (config.type === 'combobox') {
      if (this.editing) {
        this.editing.comboboxValue = null;
      }
      if (this.isComboboxPanelOpen()) {
        this.renderComboboxPanel(false);
        this.setComboboxActiveIndex(this.getComboboxInitialActiveIndex());
        this.positionEditor();
      }
      return;
    }
    if (config.type === 'numberbox') {
      formatted = formatNumberEditorText(sanitizeNumberEditorText(this.editor.value), shouldUseThousandsSeparator(column));
      if (formatted !== this.editor.value) {
        this.editor.value = formatted;
        this.editor.setSelectionRange(formatted.length, formatted.length);
      }
    }
  };

  FastGrid.prototype.handleEditorCopy = function(event) {
    var edit = this.editing;
    var column;
    var start;
    var end;
    var next;
    var text;
    var clipboardData;
    if (!edit) {
      return;
    }
    column = this.visibleColumns[edit.col];
    if (column && getColumnEditorConfig(column).type === 'numberbox') {
      start = this.editor.selectionStart;
      end = this.editor.selectionEnd;
      if (start == null || end == null || start === end) {
        return;
      }
      if (start > end) {
        next = start;
        start = end;
        end = next;
      }
      text = getNumberCopyText(this.editor.value.slice(start, end));
      clipboardData = event.clipboardData || window.clipboardData;
      if (!clipboardData || !clipboardData.setData) {
        return;
      }
      clipboardData.setData('text/plain', text);
      this.copyBuffer = text;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (!column || !getExplicitEditorMask(column)) {
      return;
    }
    start = this.editor.selectionStart;
    end = this.editor.selectionEnd;
    if (start == null || end == null || start === end) {
      return;
    }
    if (start > end) {
      next = start;
      start = end;
      end = next;
    }
    text = getMaskCopyText(this.editor.value.slice(start, end), getMaskOptions(column, getExplicitEditorMask(column)));
    clipboardData = event.clipboardData || window.clipboardData;
    if (!clipboardData || !clipboardData.setData) {
      return;
    }
    clipboardData.setData('text/plain', text);
    this.copyBuffer = text;
    event.preventDefault();
    event.stopPropagation();
  };

  FastGrid.prototype.handleEditorTriggerClick = function(event) {
    var button = closest(event.target, 'fg-editor-trigger');
    var iconConfig;
    var iconIndex;
    var handler;
    var result;
    if (!button) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (!this.editing || !this.editorConfig) {
      return;
    }
    iconIndex = button.hasAttribute('data-icon-index') ? toNumber(button.getAttribute('data-icon-index'), -1) : -1;
    if (iconIndex >= 0) {
      iconConfig = this.editorIconConfigs[iconIndex];
      handler = iconConfig && (iconConfig.onClick || iconConfig.click || iconConfig.handler);
      if (typeof handler === 'function') {
        result = handler.call(this, this.createEditorButtonArgs(event, button, iconConfig, iconIndex));
      }
      if (result !== false && (!iconConfig || iconConfig.keepFocus !== false)) {
        this.editor.focus();
      }
      return;
    }
    if (isDateLikeEditorType(this.editorConfig.type)) {
      if (this.dateboxPanel.style.display === 'block') {
        this.hideDateboxPanel();
      } else {
        this.showDateboxPanel();
      }
      this.editor.focus();
      return;
    }
    if (this.editorConfig.type === 'combobox') {
      if (this.comboboxPanel.style.display === 'block') {
        this.hideComboboxPanel();
      } else {
        this.showComboboxPanel(true);
      }
      this.editor.focus();
    }
  };

  FastGrid.prototype.createEditorButtonArgs = function(event, button, iconConfig, iconIndex) {
    var edit = this.editing || {};
    var column = this.visibleColumns[edit.col] || null;
    var item = this.view[edit.row] || null;
    return {
      grid: this,
      row: edit.row,
      col: edit.col,
      column: column,
      item: item,
      value: this.getEditorValue(),
      text: this.editor ? this.editor.value : '',
      original: edit.original,
      editor: this.editor,
      button: button || this.editorTrigger,
      icon: iconConfig || null,
      iconIndex: iconIndex == null ? -1 : iconIndex,
      icons: this.editorIconConfigs || [],
      event: event
    };
  };

  FastGrid.prototype.handleDateboxClick = function(event) {
    var day = closest(event.target, 'fg-datebox-day');
    var monthButton = closest(event.target, 'fg-datebox-month');
    var control = closest(event.target, 'fg-datebox-control');
    var target = this.dateboxTarget;
    var action;
    var date;
    var month;
    if (!target || !target.input || !target.config || !isDateLikeEditorType(target.config.type)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (monthButton) {
      month = toNumber(monthButton.getAttribute('data-month'), this.dateboxState ? this.dateboxState.month : 0);
      if (target.config.type === 'yymmbox') {
        this.applyDateboxTargetDate(new Date(this.dateboxState ? this.dateboxState.year : new Date().getFullYear(), clamp(month, 0, 11), 1));
        return;
      }
      this.dateboxState = {
        year: this.dateboxState ? this.dateboxState.year : new Date().getFullYear(),
        month: clamp(month, 0, 11),
        selected: this.dateboxState ? this.dateboxState.selected : null,
        mode: 'calendar'
      };
      this.renderDateboxPanel();
      return;
    }
    if (day && !hasClass(day, 'fg-datebox-disabled')) {
      date = parseDateValue(day.getAttribute('data-date'));
      if (date) {
        this.applyDateboxTargetDate(date);
      }
      return;
    }
    if (!control) {
      return;
    }
    action = control.getAttribute('data-action');
    if (action === 'months') {
      this.dateboxState.mode = 'months';
      this.renderDateboxPanel();
      return;
    }
    if (action === 'close') {
      this.hideDateboxPanel();
      target.input.focus();
      return;
    }
    if (action === 'today') {
      date = new Date();
      this.dateboxState = {
        year: date.getFullYear(),
        month: date.getMonth(),
        selected: date,
        mode: 'calendar'
      };
      this.renderDateboxPanel();
      this.applyDateboxTargetDate(date);
      return;
    }
    this.moveDateboxMonth(action);
  };

  FastGrid.prototype.handleDateboxChange = function(event) {
    var input = closest(event.target, 'fg-datebox-year-input');
    var target = this.dateboxTarget;
    var year;
    if (!input || !target || !target.config || !isDateLikeEditorType(target.config.type)) {
      return;
    }
    year = clamp(toNumber(input.value, this.dateboxState ? this.dateboxState.year : new Date().getFullYear()), 1, 9999);
    this.dateboxState = this.dateboxState || {
      year: year,
      month: new Date().getMonth(),
      selected: null,
      mode: 'months'
    };
    this.dateboxState.year = year;
    this.dateboxState.mode = 'months';
    this.renderDateboxPanel();
  };

  FastGrid.prototype.handleDocumentMouseDown = function(event) {
    if (closest(event.target, 'fg-filter-menu-item') || this.getFilterMenuItemAtEvent(event)) {
      this.handleFilterMenuClick(event);
      return;
    }
    if (this.filterMenu && this.filterMenu.style.display === 'block') {
      if (closest(event.target, 'fg-filter-menu') || closest(event.target, 'fg-filter-icon')) {
        return;
      }
      this.hideFilterMenu();
    }
    if (this.dateboxPanel && this.dateboxPanel.style.display === 'block') {
      if (
        (this.dateboxTarget && event.target === this.dateboxTarget.input) ||
        event.target === this.editor ||
        closest(event.target, 'fg-editor-icons') ||
        closest(event.target, 'fg-header-search-icons') ||
        closest(event.target, 'fg-datebox-panel')
      ) {
        return;
      }
      this.hideDateboxPanel();
    }
    if (this.comboboxPanel && this.comboboxPanel.style.display === 'block') {
      if (
        (this.comboboxTarget && event.target === this.comboboxTarget.input) ||
        event.target === this.editor ||
        closest(event.target, 'fg-editor-icons') ||
        closest(event.target, 'fg-header-search-icons') ||
        closest(event.target, 'fg-combobox-panel')
      ) {
        return;
      }
      this.hideComboboxPanel();
    }
    if (!this.editing) {
      return;
    }
  };

  FastGrid.prototype.handleComboboxKeyDown = function(event) {
    if (!this.editorConfig || this.editorConfig.type !== 'combobox') {
      return false;
    }
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      this.showComboboxPanel(true);
      return true;
    }
    if (!this.isComboboxPanelOpen()) {
      return false;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.setComboboxActiveIndex(this.comboboxActiveIndex + 1);
      return true;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.setComboboxActiveIndex(this.comboboxActiveIndex - 1);
      return true;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.selectComboboxActiveOption();
      return true;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.hideComboboxPanel();
      return true;
    }
    return false;
  };

  FastGrid.prototype.shouldEditOnSelect = function(row, col) {
    return this.options.editOnSelect === true && this.isCellEditable(row, col);
  };

  FastGrid.prototype.isCellEditable = function(row, col) {
    var column = this.visibleColumns[col];
    return this.options.allowEditing !== false &&
      row >= 0 &&
      row < this.view.length &&
      !this.isRowGroup(this.view[row]) &&
      !this.isRowGroupFooter(this.view[row]) &&
      !!column &&
      column.readOnly !== true;
  };

  FastGrid.prototype.commitEditingAndMoveRight = function() {
    var edit = this.editing;
    var next;
    if (!edit) {
      return false;
    }
    next = this.findNextEditableCell(edit.row, edit.col + 1);
    if (this.finishEditing(true) === false) {
      return false;
    }
    if (next) {
      this.select(next.row, next.col);
      this.scrollIntoView(next.row, next.col);
      this.startEditing(next.row, next.col, { selectRow: this.options.multiSelectRows !== true });
    }
    return true;
  };

  FastGrid.prototype.commitEditingAndMoveLeft = function() {
    var edit = this.editing;
    var next;
    if (!edit) {
      return false;
    }
    next = this.findPreviousEditableCell(edit.row, edit.col - 1);
    if (this.finishEditing(true) === false) {
      return false;
    }
    if (next) {
      this.select(next.row, next.col);
      this.scrollIntoView(next.row, next.col);
      this.startEditing(next.row, next.col, { selectRow: this.options.multiSelectRows !== true });
    }
    return true;
  };

  FastGrid.prototype.commitEditingAndMoveVertical = function(direction) {
    var edit = this.editing;
    var next;
    if (!edit) {
      return false;
    }
    next = this.findEditableCellInRow(edit.row + direction, edit.col, direction >= 0 ? 1 : -1);
    if (this.finishEditing(true) === false) {
      return false;
    }
    if (next) {
      this.select(next.row, next.col);
      this.scrollIntoView(next.row, next.col, { directionY: direction });
      this.startEditing(next.row, next.col, { selectRow: this.options.multiSelectRows !== true });
    }
    return true;
  };

  FastGrid.prototype.findNextEditableCell = function(row, col) {
    var r;
    var c;
    for (r = row; r < this.view.length; r += 1) {
      for (c = r === row ? col : 0; c < this.visibleColumns.length; c += 1) {
        if (this.isCellEditable(r, c)) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  };

  FastGrid.prototype.findPreviousEditableCell = function(row, col) {
    var r;
    var c;
    for (r = row; r >= 0; r -= 1) {
      for (c = r === row ? col : this.visibleColumns.length - 1; c >= 0; c -= 1) {
        if (this.isCellEditable(r, c)) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  };

  FastGrid.prototype.findEditableCellInRow = function(row, col, direction) {
    var c;
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    if (this.isCellEditable(row, col)) {
      return { row: row, col: col };
    }
    direction = direction < 0 ? -1 : 1;
    for (c = col + direction; c >= 0 && c < this.visibleColumns.length; c += direction) {
      if (this.isCellEditable(row, c)) {
        return { row: row, col: c };
      }
    }
    for (c = col - direction; c >= 0 && c < this.visibleColumns.length; c -= direction) {
      if (this.isCellEditable(row, c)) {
        return { row: row, col: c };
      }
    }
    return null;
  };

  FastGrid.prototype.positionEditor = function() {
    var edit = this.editing;
    var column;
    var cell;
    var cellRect;
    var bodyRect;
    var left;
    var top;
    var width;
    var height;
    var isScrollableEditor;
    if (!edit) {
      return;
    }
    column = this.visibleColumns[edit.col];
    if (!column) {
      return;
    }
    cell = this.root.querySelector('.fg-cell[data-row="' + edit.row + '"][data-col="' + edit.col + '"]');
    if (cell) {
      cellRect = cell.getBoundingClientRect();
      bodyRect = this.body.getBoundingClientRect();
      left = cellRect.left - bodyRect.left;
      top = cellRect.top - bodyRect.top;
      width = cellRect.width;
      height = cellRect.height;
    } else if (edit.col < this.frozenColumns) {
      left = this.getFixedLeftWidth() + column._left;
      top = edit.row * this.options.rowHeight - this.bodyScroll.scrollTop;
      width = column._width;
      height = this.options.rowHeight;
    } else if (edit.col >= this.scrollableColumnEnd) {
      left = this.bodyScroll.clientWidth - this.frozenRightWidth + column._left - this.frozenRightStartLeft;
      top = edit.row * this.options.rowHeight - this.bodyScroll.scrollTop;
      width = column._width;
      height = this.options.rowHeight;
    } else {
      left = this.getFixedLeftWidth() + column._left - this.bodyScroll.scrollLeft;
      top = edit.row * this.options.rowHeight - this.bodyScroll.scrollTop;
      width = column._width;
      height = this.options.rowHeight;
    }
    this.editor.style.left = left + 'px';
    this.editor.style.top = top + 'px';
    this.editor.style.width = width + 'px';
    this.editor.style.height = height + 'px';
    isScrollableEditor = edit.col >= this.frozenColumns && edit.col < this.scrollableColumnEnd;
    this.editor.style.zIndex = isScrollableEditor ? '3' : '10';
    this.editorIconHost.style.zIndex = isScrollableEditor ? '3' : '11';
    if (this.editorConfig && (isDateLikeEditorType(this.editorConfig.type) || this.editorConfig.type === 'combobox' || (this.editorIconConfigs && this.editorIconConfigs.length))) {
      this.editorIconHost.style.left = (left + width - this.getEditorIconHostWidth() - 2) + 'px';
      this.editorIconHost.style.top = top + 'px';
      this.editorIconHost.style.height = height + 'px';
    }
    if (this.editorConfig && isDateLikeEditorType(this.editorConfig.type)) {
      this.positionDateboxPanel(left, top + height, width);
    }
    if (this.editorConfig && this.editorConfig.type === 'combobox') {
      this.positionComboboxPanel(left, top + height, width);
    }
  };

  FastGrid.prototype.showDateboxPanel = function() {
    if (!this.editing || !this.editorConfig || !isDateLikeEditorType(this.editorConfig.type)) {
      return;
    }
    this.dateboxTarget = {
      type: 'editor',
      input: this.editor,
      column: this.visibleColumns[this.editing.col],
      config: this.editorConfig
    };
    this.syncDateboxPanelToEditor();
    this.renderDateboxPanel();
    this.dateboxPanel.style.display = 'block';
    this.positionEditor();
  };

  FastGrid.prototype.showHeaderSearchDateboxPanel = function(input, column) {
    var config = getColumnEditorConfig(column);
    if (!input || !column || !config || !isDateLikeEditorType(config.type)) {
      return;
    }
    this.dateboxTarget = {
      type: 'search',
      input: input,
      column: column,
      config: config
    };
    this.hideComboboxPanel();
    this.syncDateboxPanelToTarget(this.dateboxTarget);
    this.renderDateboxPanel();
    this.dateboxPanel.style.display = 'block';
    this.positionHeaderSearchDateboxPanel(input);
    input.focus();
  };

  FastGrid.prototype.showComboboxPanel = function(showAll) {
    if (!this.editing || !this.editorConfig || this.editorConfig.type !== 'combobox') {
      return;
    }
    this.comboboxTarget = {
      type: 'editor',
      input: this.editor,
      column: this.visibleColumns[this.editing.col],
      config: this.editorConfig
    };
    this.hideDateboxPanel();
    this.renderComboboxPanel(showAll === true);
    this.comboboxPanel.style.display = 'block';
    this.setComboboxActiveIndex(this.getComboboxInitialActiveIndex());
    this.positionEditor();
  };

  FastGrid.prototype.showHeaderSearchComboboxPanel = function(input, column, showAll) {
    var config = getColumnEditorConfig(column);
    if (!input || !column || !config || config.type !== 'combobox') {
      return;
    }
    this.comboboxTarget = {
      type: 'search',
      input: input,
      column: column,
      config: config
    };
    this.hideDateboxPanel();
    this.renderComboboxPanel(showAll === true);
    this.comboboxPanel.style.display = 'block';
    this.setComboboxActiveIndex(this.getComboboxInitialActiveIndex());
    this.positionHeaderSearchComboboxPanel(input);
    input.focus();
  };

  FastGrid.prototype.hideDateboxPanel = function() {
    if (this.dateboxPanel) {
      this.dateboxPanel.style.display = 'none';
    }
    this.dateboxTarget = null;
  };

  FastGrid.prototype.hideComboboxPanel = function() {
    if (this.comboboxPanel) {
      this.comboboxPanel.style.display = 'none';
    }
    this.comboboxTarget = null;
    this.comboboxActiveIndex = -1;
  };

  FastGrid.prototype.getEditorIconHostWidth = function() {
    if (!this.editorIconHost || this.editorIconHost.style.display === 'none') {
      return 0;
    }
    return Math.max(18, Math.ceil(this.editorIconHost.offsetWidth || 0));
  };

  FastGrid.prototype.isDateboxPanelOpen = function() {
    return !!this.dateboxPanel && this.dateboxPanel.style.display === 'block';
  };

  FastGrid.prototype.positionHeaderSearchDateboxPanel = function(input) {
    var inputRect;
    var bodyRect;
    var left;
    var top;
    if (!input || !this.body) {
      return;
    }
    inputRect = input.getBoundingClientRect();
    bodyRect = this.body.getBoundingClientRect();
    left = inputRect.left - bodyRect.left;
    top = inputRect.bottom - bodyRect.top;
    this.positionDateboxPanel(left, top, inputRect.width);
  };

  FastGrid.prototype.positionHeaderSearchComboboxPanel = function(input) {
    var inputRect;
    var bodyRect;
    var left;
    var top;
    if (!input || !this.body) {
      return;
    }
    inputRect = input.getBoundingClientRect();
    bodyRect = this.body.getBoundingClientRect();
    left = inputRect.left - bodyRect.left;
    top = inputRect.bottom - bodyRect.top;
    this.positionComboboxPanel(left, top, inputRect.width);
  };

  FastGrid.prototype.isComboboxPanelOpen = function() {
    return !!this.comboboxPanel && this.comboboxPanel.style.display === 'block';
  };

  FastGrid.prototype.renderComboboxPanel = function(showAll) {
    var target = this.comboboxTarget || {
      type: 'editor',
      input: this.editor,
      column: this.editing ? this.visibleColumns[this.editing.col] : null,
      config: this.editorConfig
    };
    var config = target && target.config ? target.config : {};
    var items = getComboboxData(config);
    var query = showAll === true || !target || !target.input ? '' : String(target.input.value || '').toLowerCase();
    var fragment = document.createDocumentFragment();
    var item;
    var text;
    var value;
    var option;
    var matched = 0;
    var i;
    this.comboboxItems = [];
    this.comboboxActiveIndex = -1;
    this.comboboxPanel.innerHTML = '';
    for (i = 0; i < items.length; i += 1) {
      item = items[i];
      text = getComboboxItemText(item, config);
      value = String(getComboboxItemValue(item, config));
      if (query && text.toLowerCase().indexOf(query) < 0 && value.toLowerCase().indexOf(query) < 0) {
        continue;
      }
      option = document.createElement('button');
      option.type = 'button';
      option.className = 'fg-combobox-option';
      option.setAttribute('role', 'option');
      option.setAttribute('data-index', this.comboboxItems.length);
      renderComboboxOptionContent(option, text, value, config);
      fragment.appendChild(option);
      this.comboboxItems.push(item);
      matched += 1;
    }
    if (!matched) {
      option = document.createElement('div');
      option.className = 'fg-combobox-empty';
      option.textContent = '沒有符合項目';
      fragment.appendChild(option);
    }
    this.comboboxPanel.appendChild(fragment);
  };

  FastGrid.prototype.handleComboboxMouseDown = function(event) {
    var option = closest(event.target, 'fg-combobox-option');
    var index;
    if (!option || !this.comboboxTarget || !this.comboboxTarget.config || this.comboboxTarget.config.type !== 'combobox') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    index = toNumber(option.getAttribute('data-index'), -1);
    this.selectComboboxOption(index);
  };

  FastGrid.prototype.getComboboxInitialActiveIndex = function() {
    var target = this.comboboxTarget || {
      type: 'editor',
      input: this.editor,
      column: this.editing ? this.visibleColumns[this.editing.col] : null,
      config: this.editorConfig
    };
    var config = target && target.config ? target.config : {};
    var text = target && target.input ? String(target.input.value || '') : '';
    var i;
    for (i = 0; i < this.comboboxItems.length; i += 1) {
      if (getComboboxItemText(this.comboboxItems[i], config) === text ||
        String(getComboboxItemValue(this.comboboxItems[i], config)) === text) {
        return i;
      }
    }
    return this.comboboxItems.length ? 0 : -1;
  };

  FastGrid.prototype.setComboboxActiveIndex = function(index) {
    var options;
    var i;
    var option;
    if (!this.comboboxItems.length) {
      this.comboboxActiveIndex = -1;
      return;
    }
    index = clamp(index, 0, this.comboboxItems.length - 1);
    this.comboboxActiveIndex = index;
    options = this.comboboxPanel.querySelectorAll('.fg-combobox-option');
    for (i = 0; i < options.length; i += 1) {
      option = options[i];
      if (i === index) {
        option.className = 'fg-combobox-option fg-combobox-active';
        option.setAttribute('aria-selected', 'true');
        if (option.scrollIntoView) {
          option.scrollIntoView({ block: 'nearest' });
        }
      } else {
        option.className = 'fg-combobox-option';
        option.setAttribute('aria-selected', 'false');
      }
    }
  };

  FastGrid.prototype.selectComboboxActiveOption = function() {
    if (this.comboboxActiveIndex < 0) {
      return;
    }
    this.selectComboboxOption(this.comboboxActiveIndex);
  };

  FastGrid.prototype.selectComboboxOption = function(index) {
    var item = this.comboboxItems[index];
    var target = this.comboboxTarget || {
      type: 'editor',
      input: this.editor,
      column: this.editing ? this.visibleColumns[this.editing.col] : null,
      config: this.editorConfig
    };
    var config = target && target.config ? target.config : {};
    if (item == null) {
      return;
    }
    if (target.type === 'editor' && this.editing) {
      this.editing.comboboxValue = getComboboxItemValue(item, config);
      target.input.value = getComboboxItemText(item, config);
    } else if (target.input) {
      target.input.value = getComboboxItemText(item, config);
      target.input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    this.hideComboboxPanel();
    if (target.input) {
      target.input.focus();
    }
  };

  FastGrid.prototype.syncDateboxPanelToEditor = function() {
    this.syncDateboxPanelToTarget(this.dateboxTarget || {
      type: 'editor',
      input: this.editor,
      column: this.editing ? this.visibleColumns[this.editing.col] : null,
      config: this.editorConfig
    });
  };

  FastGrid.prototype.syncDateboxPanelToTarget = function(target) {
    var date;
    if (!target || !target.input || !target.config) {
      date = null;
    } else {
      date = parseDateboxEditorValue(target.input.value, target.config);
    }
    if (!date && target && target.type === 'editor' && this.editing) {
      date = target.config.type === 'yymmbox' ?
        parseYymmboxValue(this.editing.yymmboxValue || this.editing.original) :
        parseDateValue(this.editing.dateboxValue || this.editing.original);
    }
    if (!date) {
      date = new Date();
    }
    this.dateboxState = {
      year: date.getFullYear(),
      month: date.getMonth(),
      selected: date,
      mode: target && target.config && target.config.type === 'yymmbox' ? 'months' : 'calendar'
    };
  };

  FastGrid.prototype.applyDateboxTargetDate = function(date) {
    var target = this.dateboxTarget;
    var text;
    if (!target || !target.input || !target.config) {
      return;
    }
    if (target.type === 'editor' && this.editing) {
      if (target.config.type === 'yymmbox') {
        this.editing.yymmboxValue = formatYymmboxDataText(date, target.column);
        target.input.value = formatYymmboxEditorText(date, target.config, target.column);
      } else {
        this.editing.dateboxValue = formatDateIso(date);
        target.input.value = formatDateboxEditorText(date, target.config, target.column);
      }
    } else {
      text = target.config.type === 'yymmbox' ?
        formatYymmboxEditorText(date, target.config, target.column) :
        formatDateboxEditorText(date, target.config, target.column);
      target.input.value = text;
      target.input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    this.hideDateboxPanel();
    target.input.focus();
  };

  FastGrid.prototype.moveDateboxMonth = function(action) {
    var state = this.dateboxState || {
      year: new Date().getFullYear(),
      month: new Date().getMonth(),
      selected: null,
      mode: 'calendar'
    };
    var date = new Date(state.year, state.month, 1);
    if (action === 'prev-year') {
      date.setFullYear(date.getFullYear() - 1);
    } else if (action === 'next-year') {
      date.setFullYear(date.getFullYear() + 1);
    } else if (action === 'prev-month') {
      date.setMonth(date.getMonth() - 1);
    } else if (action === 'next-month') {
      date.setMonth(date.getMonth() + 1);
    }
    this.dateboxState = {
      year: date.getFullYear(),
      month: date.getMonth(),
      selected: state.selected,
      mode: state.mode || 'calendar'
    };
    this.renderDateboxPanel();
  };

  FastGrid.prototype.renderDateboxPanel = function() {
    var state = this.dateboxState || {};
    var year = state.year || new Date().getFullYear();
    var month = state.month == null ? new Date().getMonth() : state.month;
    var mode = state.mode || 'calendar';
    var selectedIso = state.selected ? formatDateIso(state.selected) : '';
    var todayIso = formatDateIso(new Date());
    var first = new Date(year, month, 1);
    var start = new Date(year, month, 1 - first.getDay());
    var labels = this.getWeekdayNames();
    var html = [];
    var i;
    var d;
    var iso;
    var className;
    html.push('<div class="fg-datebox-header">');
    html.push('<button type="button" class="fg-datebox-control" data-action="prev-year">«</button>');
    html.push('<button type="button" class="fg-datebox-control" data-action="prev-month">‹</button>');
    html.push('<button type="button" class="fg-datebox-control fg-datebox-title fg-datebox-title-button" data-action="months">' + this.getMonthTitle(year, month) + '</button>');
    html.push('<button type="button" class="fg-datebox-control" data-action="next-month">›</button>');
    html.push('<button type="button" class="fg-datebox-control" data-action="next-year">»</button>');
    html.push('</div>');
    if (mode === 'months') {
      this.renderDateboxMonthView(html, year, month);
      if (!this.dateboxTarget || !this.dateboxTarget.config || this.dateboxTarget.config.type !== 'yymmbox') {
        this.renderDateboxFooter(html);
      }
      this.dateboxPanel.innerHTML = html.join('');
      return;
    }
    html.push('<div class="fg-datebox-weekdays">');
    for (i = 0; i < labels.length; i += 1) {
      html.push('<span>' + escapeHtml(labels[i]) + '</span>');
    }
    html.push('</div>');
    html.push('<div class="fg-datebox-days">');
    for (i = 0; i < 42; i += 1) {
      d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      iso = formatDateIso(d);
      className = 'fg-datebox-day';
      if (d.getMonth() !== month) {
        className += ' fg-datebox-other-month';
      }
      if (d.getDay() === 0) {
        className += ' fg-datebox-sunday';
      } else if (d.getDay() === 6) {
        className += ' fg-datebox-saturday';
      }
      if (iso === todayIso) {
        className += ' fg-datebox-today';
      }
      if (iso === selectedIso) {
        className += ' fg-datebox-selected';
      }
      html.push('<button type="button" class="' + className + '" data-date="' + iso + '">' + d.getDate() + '</button>');
    }
    html.push('</div>');
    this.renderDateboxFooter(html);
    this.dateboxPanel.innerHTML = html.join('');
  };

  FastGrid.prototype.renderDateboxMonthView = function(html, year, month) {
    var labels = this.getMonthNames();
    var i;
    var className;
    html.push('<div class="fg-datebox-month-view">');
    html.push('<div class="fg-datebox-year-row">');
    html.push('<button type="button" class="fg-datebox-control fg-datebox-year-control" data-action="prev-year">«</button>');
    html.push('<input class="fg-datebox-year-input" type="number" min="1" max="9999" value="' + year + '" aria-label="' + escapeHtml(this.getText('aria.year')) + '">');
    html.push('<button type="button" class="fg-datebox-control fg-datebox-year-control" data-action="next-year">»</button>');
    html.push('</div>');
    html.push('<div class="fg-datebox-months">');
    for (i = 0; i < labels.length; i += 1) {
      className = 'fg-datebox-month';
      if (i === month) {
        className += ' fg-datebox-month-selected';
      }
      html.push('<button type="button" class="' + className + '" data-month="' + i + '">' + escapeHtml(labels[i]) + '</button>');
    }
    html.push('</div>');
    html.push('</div>');
  };

  FastGrid.prototype.renderDateboxFooter = function(html) {
    html.push('<div class="fg-datebox-footer">');
    html.push('<button type="button" class="fg-datebox-control fg-datebox-footer-button" data-action="today">' + escapeHtml(this.getText('datebox.today')) + '</button>');
    html.push('<button type="button" class="fg-datebox-control fg-datebox-footer-button" data-action="close">' + escapeHtml(this.getText('datebox.close')) + '</button>');
    html.push('</div>');
  };

  FastGrid.prototype.getMonthNames = function() {
    var names = this.getText('datebox.months');
    return names && names.length ? names : [];
  };

  FastGrid.prototype.getWeekdayNames = function() {
    var names = this.getText('datebox.weekdays');
    return names && names.length ? names : [];
  };

  FastGrid.prototype.getMonthTitle = function(year, month) {
    var names = this.getMonthNames();
    return escapeHtml(formatLocaleText(this.getText('datebox.monthTitle'), {
      month: names[month] || String(month + 1),
      year: year
    }));
  };

  FastGrid.prototype.positionDateboxPanel = function(left, top, width) {
    var panelWidth = Math.max(250, width);
    var maxLeft = Math.max(0, this.root.clientWidth - panelWidth - 2);
    var maxTop = Math.max(0, this.root.clientHeight - 282);
    this.dateboxPanel.style.left = clamp(left, 0, maxLeft) + 'px';
    this.dateboxPanel.style.top = clamp(top, 0, maxTop) + 'px';
    this.dateboxPanel.style.width = panelWidth + 'px';
  };

  FastGrid.prototype.positionComboboxPanel = function(left, top, width) {
    var maxWidth = Math.max(120, this.root.clientWidth - 4);
    var contentWidth = this.measureComboboxPanelWidth();
    var panelWidth = Math.min(maxWidth, Math.max(120, width, contentWidth));
    var maxLeft = Math.max(0, this.root.clientWidth - panelWidth - 2);
    var maxTop = Math.max(0, this.root.clientHeight - 180);
    this.comboboxPanel.style.left = clamp(left, 0, maxLeft) + 'px';
    this.comboboxPanel.style.top = clamp(top, 0, maxTop) + 'px';
    this.comboboxPanel.style.width = panelWidth + 'px';
  };

  FastGrid.prototype.measureComboboxPanelWidth = function() {
    var previousWidth;
    var width;
    if (!this.comboboxPanel) {
      return 0;
    }
    previousWidth = this.comboboxPanel.style.width;
    this.comboboxPanel.style.width = 'auto';
    width = Math.ceil(this.comboboxPanel.scrollWidth || this.comboboxPanel.offsetWidth || 0);
    this.comboboxPanel.style.width = previousWidth;
    return width + 2;
  };

  FastGrid.prototype.clearEditingState = function() {
    this.editing = null;
    this.editorConfig = null;
    this.editorIconConfigs = [];
    this.dateboxState = null;
    this.comboboxItems = [];
    if (this.editor) {
      this.editor.style.display = 'none';
    }
    if (this.editorIconHost) {
      this.editorIconHost.style.display = 'none';
    }
    this.hideInvalidTip();
    this.hideDateboxPanel();
    this.hideComboboxPanel();
  };

  FastGrid.prototype.syncEditingWithView = function() {
    var edit = this.editing;
    if (!edit) {
      return;
    }
    if (edit.row < 0 || edit.row >= this.view.length || (edit.item && this.view[edit.row] !== edit.item)) {
      this.clearEditingState();
    }
  };

  FastGrid.prototype.finishEditing = function(commit) {
    var edit = this.editing;
    var column;
    var item;
    var value;
    var validationValue;
    var validationError;
    var args;
    if (!edit) {
      return false;
    }
    column = this.visibleColumns[edit.col];
    item = this.view[edit.row];
    if (commit && item && column) {
      value = this.getEditorValue(column);
      if (column.dataType === 'number') {
        value = roundNumberValue(parseValue(value, column.dataType), column);
        validationValue = value;
      } else {
        validationValue = value;
        value = parseValue(value, column.dataType);
      }
      validationError = this.validateCellValue(item, column, validationValue, edit.row, edit.col);
      args = {
        row: edit.row,
        col: edit.col,
        column: column,
        item: item,
        value: value,
        previousValue: edit.original,
        validationError: validationError
      };
      if (this.emit('cellEditEnding', args) === false) {
        return false;
      }
      this._suppressObservedItemChange += 1;
      try {
        setByBinding(item, column.binding, args.value);
      } finally {
        this._suppressObservedItemChange -= 1;
      }
      if (isPromiseLike(args.validationError)) {
        this.setPendingCellValidation(item, column, args.validationError, args.value, edit.row, edit.col);
      } else if (args.validationError) {
        this.setCellValidationError(item, column, args.validationError, edit.row, edit.col);
      } else {
        this.clearCellValidationError(item, column);
      }
      this.emit('cellEditEnded', args);
    }
    this.clearEditingState();
    this.applyView();
    this.render();
    this.root.focus();
    return true;
  };

  FastGrid.prototype.validateCellValue = function(item, column, value, rowIndex, colIndex) {
    var self = this;
    var config = getColumnEditorConfig(column);
    var args;
    var result;
    if (!item || !column) {
      return null;
    }
    if (typeof column.validate === 'function') {
      args = {
        grid: this,
        item: item,
        column: column,
        value: value,
        binding: column.binding,
        rowIndex: rowIndex,
        rowNumber: rowIndex >= 0 ? rowIndex + 1 : null,
        colIndex: colIndex,
        colNumber: colIndex >= 0 ? colIndex + 1 : null
      };
      result = column.validate(args);
      if (isPromiseLike(result)) {
        return result.then(function(nextResult) {
          return normalizeValidationResult(nextResult, value, 'custom', self) || getDefaultValidationErrorForGrid(self, config, value);
        });
      }
      result = normalizeValidationResult(result, value, 'custom', this);
      if (result) {
        return result;
      }
    }
    return getDefaultValidationErrorForGrid(this, config, value);
  };

  FastGrid.prototype.setPendingCellValidation = function(item, column, promise, value, rowIndex, colIndex) {
    var self = this;
    var key = this.getValidationErrorKey(item, column);
    var seq;
    if (!key) {
      return;
    }
    this._asyncValidationSeq += 1;
    seq = this._asyncValidationSeq;
    this._asyncValidationMap[key] = seq;
    promise.then(function(result) {
      if (self.disposed || self._asyncValidationMap[key] !== seq) {
        return;
      }
      if (result) {
        self.setCellValidationError(item, column, result, rowIndex, colIndex);
      } else {
        self.clearCellValidationError(item, column);
      }
      self.applyView();
      self.render();
    }).catch(function(error) {
      if (self.disposed || self._asyncValidationMap[key] !== seq) {
        return;
      }
      self.setCellValidationError(item, column, {
        type: 'async',
        message: error && error.message ? error.message : self.getText('validation.invalidValue'),
        value: value
      }, rowIndex, colIndex);
      self.applyView();
      self.render();
    });
  };

  function getDefaultValidationErrorForGrid(grid, config, value) {
    var options = config && config.options ? config.options : {};
    var text;
    var validDate;
    var message;
    if (!config) {
      return null;
    }
    if (config.type === 'combobox' && options.limitToList === true) {
      text = value == null ? '' : String(value).trim();
      if (text === '' || isComboboxValueInList(value, config)) {
        return null;
      }
      message = grid ? grid.getText('validation.comboboxLimitToList') : 'Please select a valid item';
      return {
        type: 'combobox',
        message: options.limitToListMessage || message,
        value: value
      };
    }
    if (config.type !== 'datebox') {
      return null;
    }
    text = value == null ? '' : String(value).trim();
    if (text === '') {
      return null;
    }
    validDate = parseDateValue(text);
    if (validDate) {
      return null;
    }
    return {
      type: 'date',
      message: grid ? grid.getText('validation.invalidDate') : 'Invalid date',
      value: value
    };
  }

  FastGrid.prototype.getValidationErrorKey = function(item, column) {
    var id;
    var nextId;
    if (!item || !column) {
      return '';
    }
    if (!item.__fgValidationId) {
      this._validationErrorSeq += 1;
      nextId = 'r' + this._validationErrorSeq;
      try {
        Object.defineProperty(item, '__fgValidationId', {
          value: nextId,
          enumerable: false
        });
      } catch (error) {
        try {
          item.__fgValidationId = nextId;
        } catch (assignError) {
          return this.getFallbackValidationId(item) + '::' + (column.binding || column.header || column._index);
        }
      }
    }
    id = item.__fgValidationId;
    return id + '::' + (column.binding || column.header || column._index);
  };

  FastGrid.prototype.getFallbackValidationId = function(item) {
    var i;
    for (i = 0; i < this._validationItems.length; i += 1) {
      if (this._validationItems[i] === item) {
        return this._validationItemIds[i];
      }
    }
    this._validationErrorSeq += 1;
    this._validationItems.push(item);
    this._validationItemIds.push('r' + this._validationErrorSeq);
    return this._validationItemIds[this._validationItemIds.length - 1];
  };

  FastGrid.prototype.setCellValidationError = function(item, column, error, rowIndex, colIndex) {
    var key = this.getValidationErrorKey(item, column);
    var existingIndex;
    var next;
    if (!key) {
      return;
    }
    delete this._asyncValidationMap[key];
    rowIndex = toNumber(rowIndex, -1);
    colIndex = toNumber(colIndex, column ? column._viewIndex : -1);
    next = mergeOptions({
      key: key,
      item: item,
      column: column,
      binding: column.binding,
      rowIndex: rowIndex,
      rowNumber: rowIndex >= 0 ? rowIndex + 1 : null,
      colIndex: colIndex,
      colNumber: colIndex >= 0 ? colIndex + 1 : null,
      message: this.getText('validation.invalidValue'),
      value: null
    }, error || {});
    if (Object.prototype.hasOwnProperty.call(this._invalidItemMap, key)) {
      existingIndex = this._invalidItemMap[key];
      this.invalidItems[existingIndex] = next;
      return;
    }
    this._invalidItemMap[key] = this.invalidItems.length;
    this.invalidItems.push(next);
  };

  FastGrid.prototype.clearCellValidationError = function(item, column) {
    var key = this.getValidationErrorKey(item, column);
    var index;
    var last;
    if (key) {
      delete this._asyncValidationMap[key];
    }
    if (key && Object.prototype.hasOwnProperty.call(this._invalidItemMap, key)) {
      index = this._invalidItemMap[key];
      last = this.invalidItems.pop();
      delete this._invalidItemMap[key];
      if (last && index < this.invalidItems.length) {
        this.invalidItems[index] = last;
        this._invalidItemMap[last.key] = index;
      }
    }
  };

  FastGrid.prototype.getCellValidationError = function(item, column) {
    var key = this.getValidationErrorKey(item, column);
    if (!key || !Object.prototype.hasOwnProperty.call(this._invalidItemMap, key)) {
      return null;
    }
    return this.invalidItems[this._invalidItemMap[key]] || null;
  };

  FastGrid.prototype.refreshInvalidItemRows = function() {
    var rowLookup = {};
    var i;
    var item;
    var id;
    var rowIndex;
    var entry;
    if (!this.invalidItems.length) {
      return;
    }
    for (i = 0; i < this.view.length; i += 1) {
      item = this.view[i];
      id = this.getExistingValidationId(item);
      if (id) {
        rowLookup[id] = i;
      }
    }
    for (i = 0; i < this.invalidItems.length; i += 1) {
      entry = this.invalidItems[i];
      rowIndex = Object.prototype.hasOwnProperty.call(rowLookup, getValidationRowId(entry.key)) ?
        rowLookup[getValidationRowId(entry.key)] :
        -1;
      entry.rowIndex = rowIndex;
      entry.rowNumber = rowIndex >= 0 ? rowIndex + 1 : null;
    }
  };

  FastGrid.prototype.getExistingValidationId = function(item) {
    var i;
    if (!item) {
      return '';
    }
    if (item.__fgValidationId) {
      return item.__fgValidationId;
    }
    for (i = 0; i < this._validationItems.length; i += 1) {
      if (this._validationItems[i] === item) {
        return this._validationItemIds[i];
      }
    }
    return '';
  };

  FastGrid.prototype.getEditorValue = function(column) {
    if (!column && this.editing) {
      column = this.visibleColumns[this.editing.col];
    }
    var config = getColumnEditorConfig(column);
    var mask = getExplicitEditorMask(column);
    if (mask) {
      return getMaskDataValue(this.editor.value, getMaskOptions(column, mask));
    }
    if (config.type === 'datebox') {
      return getDateboxDataValue(this.editor.value, config, this.editing);
    }
    if (config.type === 'yymmbox') {
      return getYymmboxDataValue(this.editor.value, config, this.editing, column);
    }
    if (config.type === 'combobox') {
      return getComboboxDataValue(this.editor.value, config, this.editing);
    }
    return this.editor.value;
  };

  FastGrid.prototype.toggleSort = function(colIndex, multiSort) {
    var column = this.visibleColumns[colIndex];
    var sortStates = this.getSortStates();
    var sortIndex;
    var currentState;
    var nextSortStates;
    var direction = 1;
    if (!column) {
      return;
    }
    sortIndex = this.getSortIndex(column);
    currentState = sortIndex >= 0 ? sortStates[sortIndex] : null;
    if (currentState) {
      if (currentState.direction === 1) {
        direction = -1;
      } else if (currentState.direction === -1) {
        direction = 0;
      }
    }
    if (this.emit('sortingColumn', {
      column: column,
      direction: direction,
      multiSort: multiSort === true,
      sortIndex: sortIndex
    }) === false) {
      return;
    }
    nextSortStates = multiSort === true ? sortStates.slice() : [];
    if (direction) {
      if (multiSort === true && sortIndex >= 0) {
        nextSortStates[sortIndex] = { column: column, direction: direction };
      } else if (multiSort === true) {
        nextSortStates.push({ column: column, direction: direction });
      } else {
        nextSortStates = [{ column: column, direction: direction }];
      }
    } else if (multiSort === true && sortIndex >= 0) {
      nextSortStates.splice(sortIndex, 1);
    }
    this.sortStates = nextSortStates;
    this.sortState = nextSortStates.length ? nextSortStates[0] : null;
    this.applyView();
    this.resetScroll();
    this.render();
    this.emit('sortedColumn', {
      column: column,
      direction: direction,
      multiSort: multiSort === true,
      sortIndex: this.getSortIndex(column),
      sortStates: this.getSortStates().slice()
    });
  };

  FastGrid.prototype.getSortGlyph = function(column) {
    var direction = this.getSortDirection(column);
    if (!direction) {
      return '';
    }
    return direction === 1 ? '▲' : '▼';
  };

  FastGrid.prototype.getSortDirection = function(column) {
    var index = this.getSortIndex(column);
    var sortStates = this.getSortStates();
    return index >= 0 ? sortStates[index].direction : 0;
  };

  FastGrid.prototype.getSortIndex = function(column) {
    var sortStates = this.getSortStates();
    var i;
    for (i = 0; i < sortStates.length; i += 1) {
      if (sortStates[i].column === column) {
        return i;
      }
    }
    return -1;
  };

  FastGrid.prototype.getSortStates = function() {
    if (Array.isArray(this.sortStates) && this.sortStates.length) {
      return this.sortStates;
    }
    return this.sortState && this.sortState.direction ? [this.sortState] : [];
  };

  FastGrid.prototype.startResize = function(event, colIndex) {
    var column = this.visibleColumns[colIndex];
    if (!column) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (event.target && event.target.setPointerCapture && event.pointerId != null) {
      event.target.setPointerCapture(event.pointerId);
    }
    this.resizeState = {
      column: column,
      startX: event.clientX,
      startWidth: column._width,
      pointerId: event.pointerId
    };
    document.body.classList.add('fg-resizing-active');
  };

  FastGrid.prototype.handlePointerMove = function(event) {
    var state = this.resizeState;
    var width;
    if (!state) {
      this.updateColumnDrag(event);
      return;
    }
    event.preventDefault();
    width = Math.max(toNumber(state.column.minWidth, 48), state.startWidth + event.clientX - state.startX);
    if (this.emit('resizingColumn', { column: state.column, width: width }) === false) {
      return;
    }
    state.column._width = width;
    state.column.width = width;
    this.updateLayout();
    this.render();
  };

  FastGrid.prototype.handlePointerUp = function(event) {
    if (!this.resizeState) {
      this.finishColumnDrag(event);
      return;
    }
    this.emit('resizedColumn', { column: this.resizeState.column });
    this.suppressClick = true;
    this.resizeState = null;
    document.body.classList.remove('fg-resizing-active');
  };

  FastGrid.prototype.getCellData = function(row, col) {
    var item = this.view[row];
    var column = this.visibleColumns[col];
    if (this.isRowGroup(item)) {
      return undefined;
    }
    if (this.isRowGroupFooter(item)) {
      return this.getRowGroupFooterValue(item, column);
    }
    return item && column ? getByBinding(item, column.binding) : undefined;
  };

  FastGrid.prototype.setCellData = function(row, col, value) {
    var item = this.view[row];
    var column = this.visibleColumns[col];
    if (!item || !column || this.isRowGroup(item) || this.isRowGroupFooter(item)) {
      return false;
    }
    this._suppressObservedItemChange += 1;
    try {
      setByBinding(item, column.binding, parseValue(getExplicitEditorMask(column) ?
        getMaskDataValue(value, getMaskOptions(column, getExplicitEditorMask(column))) :
        value, column.dataType));
    } finally {
      this._suppressObservedItemChange -= 1;
    }
    this.applyView();
    this.render();
    return true;
  };

  FastGrid.prototype.getColumn = function(value) {
    var i;
    if (typeof value === 'number') {
      return this.visibleColumns[value] || this.columns[value] || null;
    }
    for (i = 0; i < this.columns.length; i += 1) {
      if (this.columns[i].binding === value || this.columns[i].header === value || this.columns[i].name === value) {
        return this.columns[i];
      }
    }
    return null;
  };

  FastGrid.prototype.getClipString = function() {
    return this.getSelectedText();
  };

  FastGrid.prototype.setClipString = function(text) {
    return this.setCellData(this.selection.row, this.selection.col, text);
  };

  FastGrid.prototype.selectAll = function() {
    this.rowSelection = null;
    this.selection = { row: 0, col: 0 };
    this.emit('selectionChanged', { row: 0, col: 0, all: true });
    this.render();
  };

  FastGrid.prototype.getCsv = function(visibleOnly) {
    var columns = visibleOnly === false ? this.columns : this.visibleColumns;
    var lines = [];
    var i;
    var r;
    var row;
    var values;
    lines.push(columns.map(function(col) {
      return csvEscape(col.header || col.binding);
    }).join(','));
    for (r = 0; r < this.view.length; r += 1) {
      row = this.view[r];
      if (this.isRowGroup(row) || this.isRowGroupFooter(row)) {
        continue;
      }
      values = [];
      for (i = 0; i < columns.length; i += 1) {
        values.push(csvEscape(getByBinding(row, columns[i].binding)));
      }
      lines.push(values.join(','));
    }
    return lines.join('\n');
  };

  FastGrid.prototype.exportCsv = function(filename, visibleOnly) {
    var csv = this.getCsv(visibleOnly);
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    var url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename || 'fastgrid.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  FastGrid.prototype.getExcelBlob = function(visibleOnly) {
    var columns = visibleOnly === false ? this.columns : this.visibleColumns;
    var files = createXlsxFiles(columns, this.dataView || this.view, {
      frozenColumns: visibleOnly === false ? 0 : this.frozenColumns,
      grid: this,
      formatCell: this.options.formatCell,
      excelCellStyle: this.options.excelCellStyle,
      includeFooter: this.getFooterHeight() > 0
    });
    return new Blob([createZip(files)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  };

  FastGrid.prototype.exportExcel = function(filename, visibleOnly) {
    var self = this;
    if (this.busy) {
      return Promise.resolve(false);
    }
    this.setBusy(true, this.options.exportBusyText || this.getText('exportBusyText'));
    this.emit('excelExporting', { filename: filename || 'fastgrid.xlsx' });
    return new Promise(function(resolve, reject) {
      requestAnimationFrame(function() {
        setTimeout(function() {
          var blob;
          var link;
          var url;
          try {
            blob = self.getExcelBlob(visibleOnly);
            link = document.createElement('a');
            url = URL.createObjectURL(blob);
            link.href = url;
            link.download = filename || 'fastgrid.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            self.emit('excelExported', { filename: link.download, blob: blob });
            resolve(true);
          } catch (error) {
            self.emit('excelExportFailed', { filename: filename || 'fastgrid.xlsx', error: error });
            reject(error);
          } finally {
            self.setBusy(false);
          }
        }, 0);
      });
    });
  };

  function mergeOptions(base, override) {
    var result = {};
    var key;
    for (key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) {
        result[key] = base[key];
      }
    }
    for (key in override) {
      if (Object.prototype.hasOwnProperty.call(override, key)) {
        result[key] = override[key];
      }
    }
    return result;
  }

  function getLocaleMap() {
    return typeof FASTGRID_LOCALES !== 'undefined' ? FASTGRID_LOCALES : FASTGRID_INTERNAL_LOCALES;
  }

  function getDefaultLocaleName() {
    return typeof FASTGRID_DEFAULT_LOCALE !== 'undefined' ? FASTGRID_DEFAULT_LOCALE : 'zh-TW';
  }

  function normalizeLocaleName(locale) {
    var name = locale == null ? '' : String(locale);
    var lower = name.toLowerCase();
    var locales = getLocaleMap();
    if (Object.prototype.hasOwnProperty.call(locales, name)) {
      return name;
    }
    if (lower === 'zh' || lower === 'zh-tw' || lower === 'zh-hant' || lower === 'zh-hant-tw' || lower === 'tw') {
      return 'zh-TW';
    }
    if (lower === 'zh-cn' || lower === 'zh-hans' || lower === 'zh-hans-cn' || lower === 'cn') {
      return 'zh-CN';
    }
    if (lower === 'en' || lower.indexOf('en-') === 0) {
      return 'en';
    }
    return Object.prototype.hasOwnProperty.call(locales, getDefaultLocaleName()) ? getDefaultLocaleName() : 'en';
  }

  function normalizeHeaderDisplayMode(mode) {
    mode = mode == null ? 'header' : String(mode).toLowerCase();
    if (mode === 'binding' || mode === 'field' || mode === 'name' || mode === 'binging') {
      return 'binding';
    }
    return 'header';
  }

  function normalizeRowHeaderMode(value) {
    var mode;
    if (value === false || value == null) {
      return false;
    }
    mode = String(value).toLowerCase();
    if (mode === 'false' || mode === 'none' || mode === 'off' || mode === 'hidden') {
      return false;
    }
    if (mode === 'cell' || mode === 'cells' || mode === 'blank') {
      return 'cell';
    }
    return true;
  }

  function isHotKey(event, hotKey) {
    var keys;
    var i;
    var text;
    var parts;
    var key = '';
    var expected = {
      alt: false,
      ctrl: false,
      meta: false,
      shift: false
    };
    if (!hotKey || hotKey === 'none') {
      return false;
    }
    if (typeof hotKey === 'function') {
      return hotKey(event) === true;
    }
    if (Array.isArray(hotKey)) {
      for (i = 0; i < hotKey.length; i += 1) {
        if (isHotKey(event, hotKey[i])) {
          return true;
        }
      }
      return false;
    }
    text = String(hotKey).toLowerCase().replace(/\s+/g, '');
    if (!text) {
      return false;
    }
    parts = text.split('+');
    for (i = 0; i < parts.length; i += 1) {
      if (parts[i] === 'alt' || parts[i] === 'option') {
        expected.alt = true;
      } else if (parts[i] === 'ctrl' || parts[i] === 'control') {
        expected.ctrl = true;
      } else if (parts[i] === 'cmd' || parts[i] === 'command' || parts[i] === 'meta') {
        expected.meta = true;
      } else if (parts[i] === 'shift') {
        expected.shift = true;
      } else {
        key = parts[i];
      }
    }
    if (event.altKey !== expected.alt || event.ctrlKey !== expected.ctrl || event.metaKey !== expected.meta || event.shiftKey !== expected.shift) {
      return false;
    }
    keys = [
      String(event.key || '').toLowerCase(),
      String(event.code || '').toLowerCase()
    ];
    return keys.indexOf(key) >= 0;
  }

  function createLocaleMessages(locale, overrides) {
    var locales = getLocaleMap();
    var baseName = normalizeLocaleName(locale);
    var fallbackName = getDefaultLocaleName();
    var messages = {};
    if (locales.en) {
      mergeLocaleMessages(messages, locales.en);
    }
    if (locales[fallbackName] && fallbackName !== 'en') {
      mergeLocaleMessages(messages, locales[fallbackName]);
    }
    if (locales[baseName]) {
      mergeLocaleMessages(messages, locales[baseName]);
    }
    if (overrides) {
      mergeLocaleMessages(messages, overrides);
    }
    return messages;
  }

  function mergeLocaleMessages(target, source) {
    var key;
    var value;
    if (!source) {
      return target;
    }
    for (key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        value = source[key];
        if (isPlainObject(value)) {
          target[key] = mergeLocaleMessages(isPlainObject(target[key]) ? target[key] : {}, value);
        } else if (Array.isArray(value)) {
          target[key] = value.slice();
        } else {
          target[key] = value;
        }
      }
    }
    return target;
  }

  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
  }

  function getLocaleValue(messages, path) {
    var parts = String(path || '').split('.');
    var value = messages;
    var i;
    for (i = 0; i < parts.length; i += 1) {
      if (value == null) {
        return '';
      }
      value = value[parts[i]];
    }
    return value == null ? '' : value;
  }

  function formatLocaleText(value, data) {
    if (typeof value !== 'string') {
      return value;
    }
    if (!data) {
      return value;
    }
    return value.replace(/\{([^}]+)\}/g, function(match, key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : match;
    });
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function trimText(value) {
    return String(value == null ? '' : value).replace(/^\s+|\s+$/g, '');
  }

  function normalizeClassName(value) {
    return trimText(value).replace(/\./g, ' ');
  }

  function normalizeEditorConfig(editor, column) {
    var type;
    var options;
    if (editor == null || editor === true) {
      type = getDefaultEditorType(column);
      options = {};
    } else if (typeof editor === 'string') {
      type = editor;
      options = {};
    } else if (typeof editor === 'object') {
      type = editor.type || getDefaultEditorType(column);
      options = getEditorOptions(editor);
    } else {
      type = getDefaultEditorType(column);
      options = {};
    }
    type = normalizeEditorType(type);
    return {
      type: type,
      options: options
    };
  }

  function getColumnEditorConfig(column) {
    if (column && column.editor) {
      return normalizeEditorConfig(column.editor, column);
    }
    return normalizeEditorConfig(null, column || {});
  }

  function getEditorOptions(editor) {
    var result = {};
    var direct = {};
    var key;
    for (key in editor) {
      if (Object.prototype.hasOwnProperty.call(editor, key) && key !== 'type' && key !== 'options') {
        direct[key] = editor[key];
      }
    }
    result = mergeOptions(result, direct);
    result = mergeOptions(result, editor.options || {});
    return result;
  }

  function getEditorIconConfigs(config) {
    var options = config && config.options ? config.options : {};
    return normalizeIconConfigs(config && config.icons ? config.icons : options.icons);
  }

  function getColumnSearchIconConfigs(column) {
    var search = column && column.search && typeof column.search === 'object' ? column.search : null;
    var config;
    if (search && Object.prototype.hasOwnProperty.call(search, 'icons')) {
      return normalizeIconConfigs(search.icons);
    }
    if (column && Object.prototype.hasOwnProperty.call(column, 'searchIcons')) {
      return normalizeIconConfigs(column.searchIcons);
    }
    config = getColumnEditorConfig(column);
    if (config && isDateLikeEditorType(config.type)) {
      return [{ iconCls: 'icon-datebox', builtin: 'datebox' }];
    }
    if (config && config.type === 'combobox') {
      return [{ iconCls: 'fg-editor-trigger-combobox', builtin: 'combobox' }];
    }
    return [];
  }

  function normalizeIconConfigs(icons) {
    var result = [];
    var i;
    var icon;
    if (!icons) {
      return result;
    }
    if (!Array.isArray(icons)) {
      icons = [icons];
    }
    for (i = 0; i < icons.length; i += 1) {
      icon = icons[i];
      if (icon === false || icon == null) {
        continue;
      }
      if (typeof icon === 'function') {
        icon = { onClick: icon };
      } else if (typeof icon === 'string') {
        icon = { iconCls: icon };
      }
      if (typeof icon === 'object') {
        result.push(icon);
      }
    }
    return result;
  }

  function getEditorIconConfigWidth(icons, type) {
    if (!icons || !icons.length) {
      return isDateLikeEditorType(type) || type === 'combobox' ? 22 : 0;
    }
    return getIconConfigWidth(icons, 22);
  }

  function getIconConfigWidth(icons, fallback) {
    var width = 0;
    var i;
    if (!icons || !icons.length) {
      return 0;
    }
    for (i = 0; i < icons.length; i += 1) {
      width += Math.max(18, toNumber(icons[i].width, fallback));
    }
    return width;
  }

  function getEditorMask(column) {
    var mask = getExplicitEditorMask(column);
    var config;
    if (!column) {
      return '';
    }
    if (mask) {
      return mask;
    }
    config = getColumnEditorConfig(column);
    if (config.type === 'datebox') {
      return '9999/99/99';
    }
    if (config.type === 'yymmbox') {
      return '9999/99';
    }
    return '';
  }

  function getExplicitEditorMask(column) {
    var config;
    var options;
    if (!column) {
      return '';
    }
    if (column.mask) {
      return column.mask;
    }
    config = getColumnEditorConfig(column);
    options = config && config.options ? config.options : {};
    return config && config.mask ? config.mask : options.mask || '';
  }

  function getMaskOptions(column, mask) {
    var config = getColumnEditorConfig(column);
    var options = config && config.options ? config.options : {};
    return {
      mask: mask || getExplicitEditorMask(column),
      autoUnmask: column && column.autoUnmask != null ? column.autoUnmask : options.autoUnmask,
      maskValueIncludesLiterals: column && column.maskValueIncludesLiterals != null ?
        column.maskValueIncludesLiterals :
        options.maskValueIncludesLiterals,
      maskIncludesLiterals: column && column.maskIncludesLiterals != null ?
        column.maskIncludesLiterals :
        options.maskIncludesLiterals,
      maskLiteralsInValue: column && column.maskLiteralsInValue != null ?
        column.maskLiteralsInValue :
        options.maskLiteralsInValue
    };
  }

  function getDefaultEditorType(column) {
    if (column && column.dataType === 'number') {
      return 'numberbox';
    }
    if (column && column.dataType === 'date') {
      return 'datebox';
    }
    return 'textbox';
  }

  function shouldUseThousandsSeparator(column) {
    var config = getColumnEditorConfig(column);
    var options = config && config.options ? config.options : {};
    if (column && column.thousandsSeparator != null) {
      return column.thousandsSeparator === true;
    }
    if (column && column.useThousandsSeparator != null) {
      return column.useThousandsSeparator === true;
    }
    if (column && column.showThousandsSeparator != null) {
      return column.showThousandsSeparator === true;
    }
    if (options.thousandsSeparator != null) {
      return options.thousandsSeparator === true;
    }
    if (options.useThousandsSeparator != null) {
      return options.useThousandsSeparator === true;
    }
    if (options.showThousandsSeparator != null) {
      return options.showThousandsSeparator === true;
    }
    return false;
  }

  function getNumberPrecision(column) {
    var config = getColumnEditorConfig(column);
    var options = config && config.options ? config.options : {};
    var value = null;
    if (column && column.precision != null) {
      value = column.precision;
    } else if (options.precision != null) {
      value = options.precision;
    }
    if (value == null || value === false || value === '') {
      return null;
    }
    value = Number(value);
    if (!isFinite(value) || value < 0) {
      return null;
    }
    return Math.floor(value);
  }

  function roundNumberValue(value, column) {
    var precision = getNumberPrecision(column);
    var factor;
    if (value == null || precision == null || typeof value !== 'number' || !isFinite(value)) {
      return value;
    }
    factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  function formatNumberDisplayText(value, column) {
    return formatNumberEditorText(value, shouldUseThousandsSeparator(column), getNumberPrecision(column));
  }

  function normalizeEditorType(type) {
    type = String(type || 'textbox').toLowerCase();
    if (type === 'number' || type === 'numeric') {
      return 'numberbox';
    }
    if (type === 'date' || type === 'calendar') {
      return 'datebox';
    }
    if (type === 'yymm' || type === 'month' || type === 'monthbox' || type === 'yearmonth') {
      return 'yymmbox';
    }
    if (type === 'combo' || type === 'select' || type === 'dropdown') {
      return 'combobox';
    }
    if (type === 'numberbox' || type === 'datebox' || type === 'yymmbox' || type === 'combobox') {
      return type;
    }
    return 'textbox';
  }

  function getComboboxData(config) {
    var options = config && config.options ? config.options : {};
    return Array.isArray(options.data) ? options.data : [];
  }

  function getComboboxValueField(config) {
    var options = config && config.options ? config.options : {};
    return options.valueField || 'value';
  }

  function getComboboxTextField(config) {
    var options = config && config.options ? config.options : {};
    return options.textField || 'text';
  }

  function getComboboxItemValue(item, config) {
    var field = getComboboxValueField(config);
    var textField = getComboboxTextField(config);
    var value;
    if (item && typeof item === 'object') {
      value = getByBinding(item, field);
      if (value == null && textField !== field) {
        value = getByBinding(item, textField);
      }
      return value == null ? '' : value;
    }
    return item == null ? '' : item;
  }

  function getComboboxItemText(item, config) {
    var field = getComboboxTextField(config);
    var valueField = getComboboxValueField(config);
    var text;
    if (item && typeof item === 'object') {
      text = getByBinding(item, field);
      if (text == null && valueField !== field) {
        text = getByBinding(item, valueField);
      }
      return text == null ? '' : String(text);
    }
    return item == null ? '' : String(item);
  }

  function shouldShowComboboxValueInList(config) {
    var options = config && config.options ? config.options : {};
    return options.showValueInList === true || options.showValue === true || options.showCode === true;
  }

  function renderComboboxOptionContent(option, text, value, config) {
    var textSpan;
    var valueSpan;
    option.textContent = '';
    textSpan = document.createElement('span');
    textSpan.className = 'fg-combobox-option-text';
    textSpan.textContent = text;
    option.appendChild(textSpan);
    if (shouldShowComboboxValueInList(config) && value !== '' && value !== text) {
      valueSpan = document.createElement('span');
      valueSpan.className = 'fg-combobox-option-value';
      valueSpan.textContent = '(' + value + ')';
      option.appendChild(valueSpan);
      option.setAttribute('aria-label', text + ' (' + value + ')');
    }
  }

  function getComboboxTextByValue(value, config) {
    var items = getComboboxData(config);
    var item;
    var i;
    for (i = 0; i < items.length; i += 1) {
      item = items[i];
      if (String(getComboboxItemValue(item, config)) === String(value)) {
        return getComboboxItemText(item, config);
      }
    }
    return value == null ? '' : String(value);
  }

  function getComboboxValueByText(text, config) {
    var items = getComboboxData(config);
    var item;
    var i;
    for (i = 0; i < items.length; i += 1) {
      item = items[i];
      if (getComboboxItemText(item, config) === text) {
        return getComboboxItemValue(item, config);
      }
    }
    return text;
  }

  function isComboboxValueInList(value, config) {
    var items = getComboboxData(config);
    var text = value == null ? '' : String(value);
    var item;
    var i;
    for (i = 0; i < items.length; i += 1) {
      item = items[i];
      if (String(getComboboxItemValue(item, config)) === text || getComboboxItemText(item, config) === text) {
        return true;
      }
    }
    return false;
  }

  function getComboboxDataValue(text, config, edit) {
    var selectedText;
    if (edit && edit.comboboxValue != null) {
      selectedText = getComboboxTextByValue(edit.comboboxValue, config);
      if (selectedText === text) {
        return edit.comboboxValue;
      }
    }
    return getComboboxValueByText(text, config);
  }

  function formatDateboxText(value, config) {
    var date = parseDateValue(value);
    var formatter = config && config.options ? config.options.formatter : null;
    if (date && typeof formatter === 'function') {
      return formatter(date);
    }
    if (date) {
      return formatDateIso(date);
    }
    return value == null ? '' : String(value);
  }

  function formatDateboxEditorText(value, config, column) {
    var date = parseDateValue(value);
    var text = date ? formatDateboxText(date, config) : value;
    var mask = getEditorMask(column);
    if (mask) {
      return formatMaskText(text, { mask: mask });
    }
    if (date) {
      return formatDateDigits(date);
    }
    return sanitizeDateEditorText(text);
  }

  function formatYymmboxEditorText(value, config, column) {
    var date = parseYymmboxValue(value);
    var text = date ? formatYymmboxDataText(date, column) : value;
    var mask = getEditorMask(column);
    if (mask) {
      return formatMaskText(text, { mask: mask });
    }
    return sanitizeYymmboxEditorText(text);
  }

  function getDateboxDataValue(value, config, edit) {
    var parser = config && config.options ? config.options.parser : null;
    var parsed;
    if (edit && edit.dateboxValue && value === formatDateboxText(edit.dateboxValue, config)) {
      return edit.dateboxValue;
    }
    if (typeof parser === 'function') {
      parsed = parser(value);
      if (parsed instanceof Date && !isNaN(parsed.getTime())) {
        return formatDateIso(parsed);
      }
      if (parsed != null) {
        return parsed;
      }
    }
    parsed = parseDateValue(value);
    return parsed ? formatDateIso(parsed) : value;
  }

  function parseDateboxEditorValue(value, config) {
    var parser = config && config.options ? config.options.parser : null;
    var parsed;
    if (typeof parser === 'function') {
      parsed = parser(value);
      if (parsed instanceof Date && !isNaN(parsed.getTime())) {
        return parsed;
      }
      return config && config.type === 'yymmbox' ? parseYymmboxValue(parsed) : parseDateValue(parsed);
    }
    return config && config.type === 'yymmbox' ? parseYymmboxValue(value) : parseDateValue(value);
  }

  function getYymmboxDataValue(value, config, edit, column) {
    var parser = config && config.options ? config.options.parser : null;
    var parsed;
    var date;
    if (edit && edit.yymmboxValue && value === formatYymmboxEditorText(edit.yymmboxValue, config, column)) {
      return edit.yymmboxValue;
    }
    if (typeof parser === 'function') {
      parsed = parser(value);
      if (parsed instanceof Date && !isNaN(parsed.getTime())) {
        return formatYymmboxDataText(parsed, column);
      }
      if (parsed != null) {
        return parsed;
      }
    }
    date = parseYymmboxValue(value);
    if (date) {
      return formatYymmboxDataText(date, column);
    }
    return getMaskDataValue(value, getMaskOptions(column, getEditorMask(column)));
  }

  function parseYymmboxValue(value) {
    var text;
    var match;
    var year;
    var month;
    if (value instanceof Date && !isNaN(value.getTime())) {
      return new Date(value.getFullYear(), value.getMonth(), 1);
    }
    if (value == null || value === '') {
      return null;
    }
    text = String(value).trim();
    match = text.match(/^(\d{4})[-\/](\d{1,2})$/);
    if (!match) {
      match = text.match(/^(\d{4})(\d{2})$/);
    }
    if (!match) {
      return null;
    }
    year = Number(match[1]);
    month = Number(match[2]) - 1;
    if (year < 1 || month < 0 || month > 11) {
      return null;
    }
    return new Date(year, month, 1);
  }

  function formatYymmboxDataText(value, column) {
    var date = parseYymmboxValue(value);
    var mask;
    var text;
    if (!date) {
      return value == null ? '' : String(value);
    }
    text = date.getFullYear() + pad2(date.getMonth() + 1);
    mask = getEditorMask(column);
    if (mask && !isMaskAutoUnmask(getMaskOptions(column, mask))) {
      return applyMask(text, mask);
    }
    return text;
  }

  function parseDateValue(value) {
    var text;
    var match;
    var year;
    var month;
    var day;
    var date;
    if (value instanceof Date && !isNaN(value.getTime())) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }
    if (value == null || value === '') {
      return null;
    }
    text = String(value).trim();
    match = text.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
    if (!match) {
      match = text.match(/^(\d{4})(\d{2})(\d{2})$/);
    }
    if (!match) {
      return null;
    }
    year = Number(match[1]);
    month = Number(match[2]) - 1;
    day = Number(match[3]);
    date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      return null;
    }
    return date;
  }

  function formatDateIso(date) {
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
  }

  function formatDateDigits(date) {
    return date.getFullYear() + pad2(date.getMonth() + 1) + pad2(date.getDate());
  }

  function isDateLikeEditorType(type) {
    return type === 'datebox' || type === 'yymmbox';
  }

  function pad2(value) {
    value = Number(value);
    return value < 10 ? '0' + value : String(value);
  }

  function bind(context, fn) {
    return function() {
      return fn.apply(context, arguments);
    };
  }

  function createWijmoEvent(grid, name) {
    var handlers = [];
    return {
      addHandler: function(handler, self) {
        if (typeof handler === 'function') {
          handlers.push({ handler: handler, self: self || null });
        }
        return this;
      },
      removeHandler: function(handler, self) {
        var i;
        for (i = handlers.length - 1; i >= 0; i -= 1) {
          if (handlers[i].handler === handler && (self == null || handlers[i].self === self)) {
            handlers.splice(i, 1);
          }
        }
        return this;
      },
      raise: function(sender, args) {
        var i;
        args = args || {};
        for (i = 0; i < handlers.length; i += 1) {
          if (handlers[i].handler.call(handlers[i].self || grid, sender || grid, args) === false) {
            args.cancel = true;
          }
        }
        return args.cancel !== true;
      },
      clearHandlers: function() {
        handlers.length = 0;
      }
    };
  }

  function defineWijmoCompatibility(FastGridCtor) {
    var eventNames = [
      'autoGeneratedColumns',
      'autoSizedColumn',
      'autoSizedRow',
      'autoSizingColumn',
      'autoSizingRow',
      'beginningEdit',
      'bigCheckboxesChanged',
      'cellEditEnding',
      'cellEditEnded',
      'columnGroupCollapsedChanged',
      'columnGroupCollapsedChanging',
      'copied',
      'copiedCell',
      'copying',
      'copyingCell',
      'deletedRow',
      'deletingRow',
      'draggedColumn',
      'draggedRow',
      'draggingColumn',
      'draggingRow',
      'formatItem',
      'groupCollapsedChanged',
      'groupCollapsedChanging',
      'itemsSourceChanged',
      'itemsSourceChanging',
      'loadedRows',
      'loadingRows',
      'pasted',
      'pastedCell',
      'pasting',
      'pastingCell',
      'prepareCellForEdit',
      'refreshed',
      'refreshing',
      'resizedColumn',
      'resizedRow',
      'resizingColumn',
      'resizingRow',
      'rowAdded',
      'rowEditEnded',
      'rowEditEnding',
      'rowEditStarted',
      'rowEditStarting',
      'scrollPositionChanged',
      'selectionChanged',
      'selectionChanging',
      'sortedColumn',
      'sortingColumn',
      'updatedLayout',
      'updatedView',
      'updatingLayout',
      'updatingView'
    ];
    var i;
    var name;

    Object.defineProperties(FastGridCtor.prototype, {
      itemsSource: {
        get: function() {
          return this.source;
        },
        set: function(value) {
          this.setItemsSource(value || []);
        }
      },
      collectionView: {
        get: function() {
          return this.view;
        }
      },
      rows: {
        get: function() {
          return this.view;
        }
      },
      frozenColumns: {
        get: function() {
          return this._frozenColumns || 0;
        },
        set: function(value) {
          this.setFrozenColumns(value);
        }
      },
      frozenRightColumns: {
        get: function() {
          return this._frozenRightColumns || 0;
        },
        set: function(value) {
          this.setFrozenRightColumns(value);
        }
      },
      showRowHeaders: {
        get: function() {
          return this.options.showRowHeaders;
        },
        set: function(value) {
          this.setShowRowHeaders(value);
        }
      },
      showFooter: {
        get: function() {
          return this.options.showFooter === true;
        },
        set: function(value) {
          this.setShowFooter(value);
        }
      },
      editMode: {
        get: function() {
          return this.options.allowEditing !== false && this.options.editOnSelect === true;
        },
        set: function(value) {
          this.setEditMode(value);
        }
      },
      multiSelectRows: {
        get: function() {
          return this.options.multiSelectRows === true;
        },
        set: function(value) {
          this.setMultiSelectRows(value);
        }
      },
      selectedItems: {
        get: function() {
          var rows;
          var item;
          var i;
          if (this.options.multiSelectRows === true) {
            rows = [];
            for (i = 0; i < this.view.length; i += 1) {
              if (this.selectedRowMap[i]) {
                rows.push(this.view[i]);
              }
            }
            return rows;
          }
          item = this.view[this.selection.row];
          return item ? [item] : [];
        }
      },
      selectedRows: {
        get: function() {
          var row = this.rowSelection != null ? this.rowSelection : this.selection.row;
          var item = this.view[row];
          var rows;
          var i;
          if (this.options.multiSelectRows === true) {
            rows = [];
            for (i = 0; i < this.view.length; i += 1) {
              if (this.selectedRowMap[i]) {
                rows.push({ index: i, dataItem: this.view[i] });
              }
            }
            return rows;
          }
          return item ? [{ index: row, dataItem: item }] : [];
        }
      },
      selectedRanges: {
        get: function() {
          return [{
            row: this.selection.row,
            col: this.selection.col,
            row2: this.selection.row,
            col2: this.selection.col
          }];
        }
      },
      scrollPosition: {
        get: function() {
          return {
            x: this.bodyScroll ? this.bodyScroll.scrollLeft : 0,
            y: this.bodyScroll ? this.bodyScroll.scrollTop : 0
          };
        },
        set: function(value) {
          if (!this.bodyScroll || !value) {
            return;
          }
          this.bodyScroll.scrollLeft = toNumber(value.x, this.bodyScroll.scrollLeft);
          this.bodyScroll.scrollTop = toNumber(value.y, this.bodyScroll.scrollTop);
          this.render();
        }
      },
      scrollSize: {
        get: function() {
          return {
            width: this.totalWidth,
            height: this.view.length * this.options.rowHeight
          };
        }
      },
      viewRange: {
        get: function() {
          return {
            row: this.rowRange.start,
            col: this.columnRange.start,
            row2: Math.max(this.rowRange.start, this.rowRange.end - 1),
            col2: Math.max(this.columnRange.start, this.columnRange.end - 1)
          };
        }
      },
      activeCell: {
        get: function() {
          return this.root ? this.root.querySelector('.fg-cell.fg-selected, .fg-cell.fg-row-group-selected') : null;
        }
      },
      activeEditor: {
        get: function() {
          return this.editing ? this.editor : null;
        }
      },
      isReadOnly: {
        get: function() {
          return this.options.allowEditing === false;
        },
        set: function(value) {
          this.options.allowEditing = value === true ? false : true;
          if (value === true) {
            this.options.editOnSelect = false;
            this.finishEditing(false);
          }
        }
      },
      itemFormatter: {
        get: function() {
          return this.options.itemFormatter;
        },
        set: function(value) {
          this.options.itemFormatter = typeof value === 'function' ? value : null;
          this.render();
        }
      },
      autoClipboard: {
        get: function() {
          return this.options.autoClipboard;
        },
        set: function(value) {
          this.options.autoClipboard = value !== false;
        }
      },
      allowSorting: {
        get: function() {
          return this.options.allowSorting;
        },
        set: function(value) {
          this.options.allowSorting = value !== false;
        }
      },
      allowResizing: {
        get: function() {
          return this.options.allowResizing;
        },
        set: function(value) {
          this.options.allowResizing = value !== false;
          this.render();
        }
      },
      allowDragging: {
        get: function() {
          return this.options.allowDragging;
        },
        set: function(value) {
          this.options.allowDragging = value;
        }
      },
      allowMerging: {
        get: function() {
          return this.options.allowMerging;
        },
        set: function(value) {
          this.options.allowMerging = value;
        }
      },
      allowPinning: {
        get: function() {
          return this.options.allowPinning;
        },
        set: function(value) {
          this.options.allowPinning = value === true;
        }
      },
      alternatingRows: {
        get: function() {
          return this.options.alternatingRows === true;
        },
        set: function(value) {
          this.options.alternatingRows = value === true;
          this.render();
        }
      },
      alternatingRowBackground: {
        get: function() {
          return this.options.alternatingRowBackground;
        },
        set: function(value) {
          this.options.alternatingRowBackground = value || '#fafafa';
          this.applyThemeOptions();
          this.render();
        }
      },
      copyHeaders: {
        get: function() {
          return this.options.copyHeaders;
        },
        set: function(value) {
          this.options.copyHeaders = value;
        }
      },
      frozenRows: {
        get: function() {
          return toNumber(this.options.frozenRows, 0);
        },
        set: function(value) {
          this.options.frozenRows = Math.max(0, toNumber(value, 0));
        }
      },
      selectionMode: {
        get: function() {
          return this.options.selectionMode;
        },
        set: function(value) {
          this.options.selectionMode = value || 'Cell';
        }
      }
    });

    for (i = 0; i < eventNames.length; i += 1) {
      name = eventNames[i];
      defineWijmoOnMethod(FastGridCtor, name);
    }
  }

  function defineWijmoOnMethod(FastGridCtor, eventName) {
    var methodName = 'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
    if (FastGridCtor.prototype[methodName]) {
      return;
    }
    FastGridCtor.prototype[methodName] = function(args) {
      return this.emit(eventName, args || {});
    };
  }

  function toNumber(value, fallback) {
    var number = Number(value);
    return isNaN(number) ? fallback : number;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function closest(target, className) {
    if (target && target.nodeType !== 1) {
      target = target.parentNode;
    }
    while (target && target.nodeType === 1) {
      if (hasClass(target, className)) {
        return target;
      }
      target = target.parentNode;
    }
    return null;
  }

  function isPointInElement(clientX, clientY, element) {
    var rect;
    if (!element) {
      return false;
    }
    rect = element.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  }

  function createFilterMenuItemHandler(grid, column, operator) {
    return function(event) {
      grid.selectFilterMenuOperator(column, operator, event);
    };
  }

  function hasClass(element, className) {
    return (' ' + element.className + ' ').indexOf(' ' + className + ' ') >= 0;
  }

  function normalizeTextAlign(value) {
    value = String(value || '').toLowerCase();
    if (value === 'right' || value === 'center') {
      return value;
    }
    return 'left';
  }

  function normalizeJustifyContent(value) {
    value = String(value || '').toLowerCase();
    if (value === 'right') {
      return 'flex-end';
    }
    if (value === 'center') {
      return 'center';
    }
    return 'flex-start';
  }

  function findRowIndexByItem(rows, item) {
    var i;
    if (item == null) {
      return -1;
    }
    for (i = 0; i < rows.length; i += 1) {
      if (rows[i] === item) {
        return i;
      }
    }
    return -1;
  }

  function isWeakSetValue(value) {
    return value !== null && (typeof value === 'object' || typeof value === 'function');
  }

  function rowMatchesSearch(item, columns, searchText) {
    var i;
    var value;
    for (i = 0; i < columns.length; i += 1) {
      if (columns[i].visible === false) {
        continue;
      }
      value = getByBinding(item, columns[i].binding);
      if (value != null && String(value).toLowerCase().indexOf(searchText) >= 0) {
        return true;
      }
    }
    return false;
  }

  function rowMatchesColumnSearch(item, columns, searchValues, searchOperators) {
    var i;
    var column;
    var text;
    var key;
    var operator;
    for (i = 0; i < columns.length; i += 1) {
      column = columns[i];
      if (column.visible === false) {
        continue;
      }
      key = getColumnSearchKey(column);
      text = searchValues[key];
      if (!text) {
        continue;
      }
      operator = searchOperators ? searchOperators[key] : '';
      if (!columnValueMatchesSearch(getByBinding(item, column.binding), column, text, operator)) {
        return false;
      }
    }
    return true;
  }

  function columnValueMatchesSearch(value, column, searchText, operator) {
    var expected;
    var actual;
    var dateConfig;
    var sourceDate;
    var targetDate;
    var sourceText;
    var alternateSourceText;
    var targetText;
    if (searchText == null || String(searchText).trim() === '') {
      return true;
    }
    if (value == null) {
      return false;
    }
    operator = normalizeColumnSearchOperator(operator);
    if (column.dataType === 'number') {
      expected = parseValue(searchText, 'number');
      actual = parseValue(value, 'number');
      if (expected == null || actual == null) {
        return false;
      }
      operator = operator || 'eq';
      if (operator === 'gte') {
        return actual >= expected;
      }
      if (operator === 'gt') {
        return actual > expected;
      }
      if (operator === 'lte') {
        return actual <= expected;
      }
      if (operator === 'lt') {
        return actual < expected;
      }
      if (operator === 'ne') {
        return actual !== expected;
      }
      return actual === expected;
    }
    dateConfig = getColumnEditorConfig(column);
    if (dateConfig && isDateLikeEditorType(dateConfig.type)) {
      operator = operator || 'starts';
      sourceDate = parseDateboxEditorValue(value, dateConfig);
      targetDate = parseDateboxEditorValue(searchText, dateConfig);
      if (isComparisonSearchOperator(operator) && sourceDate && targetDate) {
        sourceText = dateConfig.type === 'yymmbox' ? formatYymmboxDataText(sourceDate, column) : formatDateIso(sourceDate);
        targetText = dateConfig.type === 'yymmbox' ? formatYymmboxDataText(targetDate, column) : formatDateIso(targetDate);
      } else {
        sourceText = sourceDate ?
          (dateConfig.type === 'yymmbox' ? formatYymmboxEditorText(sourceDate, dateConfig, column) : formatDateboxEditorText(sourceDate, dateConfig, column)).toLowerCase() :
          String(value).toLowerCase();
        targetText = String(searchText).toLowerCase();
      }
    } else if (dateConfig && dateConfig.type === 'combobox') {
      sourceText = getComboboxTextByValue(value, dateConfig).toLowerCase();
      alternateSourceText = String(value).toLowerCase();
      targetText = String(searchText).toLowerCase();
      operator = operator || 'starts';
    } else {
      sourceText = String(value).toLowerCase();
      targetText = String(searchText).toLowerCase();
      operator = operator || 'starts';
    }
    if (alternateSourceText != null && alternateSourceText !== sourceText && searchTextMatchesOperator(alternateSourceText, targetText, operator)) {
      return true;
    }
    return searchTextMatchesOperator(sourceText, targetText, operator);
  }

  function searchTextMatchesOperator(sourceText, targetText, operator) {
    if (operator === 'contains') {
      return sourceText.indexOf(targetText) >= 0;
    }
    if (operator === 'ends') {
      return sourceText.lastIndexOf(targetText) === sourceText.length - targetText.length;
    }
    if (operator === 'not-starts') {
      return sourceText.indexOf(targetText) !== 0;
    }
    if (operator === 'not-contains') {
      return sourceText.indexOf(targetText) < 0;
    }
    if (operator === 'not-ends') {
      return sourceText.lastIndexOf(targetText) !== sourceText.length - targetText.length;
    }
    if (operator === 'gte') {
      return sourceText >= targetText;
    }
    if (operator === 'gt') {
      return sourceText > targetText;
    }
    if (operator === 'lte') {
      return sourceText <= targetText;
    }
    if (operator === 'lt') {
      return sourceText < targetText;
    }
    if (operator === 'ne') {
      return sourceText !== targetText;
    }
    if (operator === 'eq') {
      return sourceText === targetText;
    }
    return sourceText.indexOf(targetText) === 0;
  }

  function isComparisonSearchOperator(operator) {
    return operator === 'gte' ||
      operator === 'gt' ||
      operator === 'lte' ||
      operator === 'lt' ||
      operator === 'ne' ||
      operator === 'eq';
  }

  function getColumnSearchOperatorDefinitions(column) {
    if (isColumnSearchComparable(column)) {
      return [
        { operator: 'gte', symbol: '≥', labelKey: 'filter.greaterThanOrEqual' },
        { operator: 'gt', symbol: '>', labelKey: 'filter.greaterThan' },
        { operator: 'lte', symbol: '≤', labelKey: 'filter.lessThanOrEqual' },
        { operator: 'lt', symbol: '<', labelKey: 'filter.lessThan' },
        { operator: 'ne', symbol: '≠', labelKey: 'filter.notEqual' },
        { operator: 'eq', symbol: '=', labelKey: 'filter.equal' },
        { operator: '', symbol: '', labelKey: 'filter.clear' }
      ];
    }
    return [
      { operator: 'starts', symbol: '^', labelKey: 'filter.startsWith' },
      { operator: 'contains', symbol: '∋', labelKey: 'filter.contains' },
      { operator: 'ends', symbol: '$', labelKey: 'filter.endsWith' },
      { operator: 'not-starts', symbol: '!^', labelKey: 'filter.notStartsWith' },
      { operator: 'not-contains', symbol: '!∋', labelKey: 'filter.notContains' },
      { operator: 'not-ends', symbol: '!$', labelKey: 'filter.notEndsWith' },
      { operator: 'gte', symbol: '≥', labelKey: 'filter.greaterThanOrEqual' },
      { operator: 'gt', symbol: '>', labelKey: 'filter.greaterThan' },
      { operator: 'lte', symbol: '≤', labelKey: 'filter.lessThanOrEqual' },
      { operator: 'lt', symbol: '<', labelKey: 'filter.lessThan' },
      { operator: 'ne', symbol: '≠', labelKey: 'filter.notEqual' },
      { operator: 'eq', symbol: '=', labelKey: 'filter.equal' },
      { operator: '', symbol: '', labelKey: 'filter.clear' }
    ];
  }

  function isColumnSearchComparable(column) {
    var config;
    if (!column) {
      return false;
    }
    if (column.dataType === 'number') {
      return true;
    }
    config = getColumnEditorConfig(column);
    return config && isDateLikeEditorType(config.type);
  }

  function normalizeColumnSearchOperator(operator) {
    operator = String(operator || '').toLowerCase();
    if (
      operator === 'starts' ||
      operator === 'contains' ||
      operator === 'ends' ||
      operator === 'not-starts' ||
      operator === 'not-contains' ||
      operator === 'not-ends' ||
      operator === 'gte' ||
      operator === 'gt' ||
      operator === 'lte' ||
      operator === 'lt' ||
      operator === 'ne' ||
      operator === 'eq'
    ) {
      return operator;
    }
    return '';
  }

  function getColumnSearchOperatorSymbol(operator) {
    operator = normalizeColumnSearchOperator(operator);
    if (operator === 'starts') {
      return '^';
    }
    if (operator === 'contains') {
      return '∋';
    }
    if (operator === 'ends') {
      return '$';
    }
    if (operator === 'not-starts') {
      return '!^';
    }
    if (operator === 'not-contains') {
      return '!∋';
    }
    if (operator === 'not-ends') {
      return '!$';
    }
    if (operator === 'gte') {
      return '≥';
    }
    if (operator === 'gt') {
      return '>';
    }
    if (operator === 'lte') {
      return '≤';
    }
    if (operator === 'lt') {
      return '<';
    }
    if (operator === 'ne') {
      return '≠';
    }
    if (operator === 'eq') {
      return '=';
    }
    return '';
  }

  function getColumnSearchKey(column) {
    if (!column) {
      return '';
    }
    return column.binding != null && column.binding !== '' ? 'binding:' + column.binding : 'index:' + column._index;
  }

  function compareValues(a, b, type) {
    if (a == null && b == null) {
      return 0;
    }
    if (a == null) {
      return -1;
    }
    if (b == null) {
      return 1;
    }
    if (type === 'number') {
      return Number(a) - Number(b);
    }
    if (type === 'date') {
      return new Date(a).getTime() - new Date(b).getTime();
    }
    if (type === 'boolean') {
      return (a ? 1 : 0) - (b ? 1 : 0);
    }
    a = String(a).toLowerCase();
    b = String(b).toLowerCase();
    if (a < b) {
      return -1;
    }
    if (a > b) {
      return 1;
    }
    return 0;
  }

  function parseValue(value, type) {
    var text;
    var number;
    if (type === 'number') {
      if (value == null) {
        return null;
      }
      text = stripNumberGroupSeparators(value).trim();
      if (text === '' || text === '-' || text === '.' || text === '-.') {
        return null;
      }
      number = Number(text);
      return isFinite(number) ? number : null;
    }
    if (type === 'boolean') {
      return value === true || value === 'true' || value === '1' || value === 'yes' || value === 'Y';
    }
    return value;
  }

  function getMaskDataValue(value, column) {
    var raw = extractMaskCharacters(value, column.mask);
    if (isMaskValueIncludingLiterals(column)) {
      return applyMask(raw, column.mask);
    }
    return raw;
  }

  function getValidationRowId(key) {
    var index = String(key || '').indexOf('::');
    return index >= 0 ? String(key).slice(0, index) : '';
  }

  function normalizeValidationResult(result, value, type, grid) {
    var message = grid ? grid.getText('validation.invalidValue') : 'Invalid value';
    if (result == null || result === false || result === '') {
      return null;
    }
    if (typeof result === 'string') {
      return {
        type: type || 'custom',
        message: result,
        value: value
      };
    }
    if (result === true) {
      return {
        type: type || 'custom',
        message: message,
        value: value
      };
    }
    if (typeof result === 'object') {
      return mergeOptions({
        type: type || 'custom',
        message: message,
        value: value
      }, result);
    }
    return null;
  }

  function isPromiseLike(value) {
    return value && typeof value.then === 'function';
  }

  function getMaskCopyText(value, column) {
    if (isMaskValueIncludingLiterals(column)) {
      return formatMaskText(value, column);
    }
    return extractMaskCharacters(value, column.mask);
  }

  function formatMaskText(value, column) {
    var raw = extractMaskCharacters(value, column.mask);
    return applyMask(raw, column.mask);
  }

  function countMaskCharactersBeforeCaret(value, mask, caret) {
    return extractMaskCharacters(String(value == null ? '' : value).slice(0, caret), mask).length;
  }

  function getMaskCaretPosition(value, mask, rawIndex) {
    var text = String(value == null ? '' : value);
    var tokenIndex = 0;
    var tokens = getMaskTokens(mask);
    var i;
    var ch;
    if (rawIndex <= 0) {
      return 0;
    }
    for (i = 0; i < text.length && tokenIndex < tokens.length; i += 1) {
      ch = text.charAt(i);
      if (isMaskCharAllowed(ch, tokens[tokenIndex])) {
        tokenIndex += 1;
        if (tokenIndex >= rawIndex) {
          return i + 1;
        }
      }
    }
    return text.length;
  }

  function isMaskValueIncludingLiterals(column) {
    return !isMaskAutoUnmask(column);
  }

  function isMaskAutoUnmask(column) {
    if (column.autoUnmask === true) {
      return true;
    }
    if (column.autoUnmask === false) {
      return false;
    }
    return column.maskValueIncludesLiterals === false ||
      column.maskIncludesLiterals === false ||
      column.maskLiteralsInValue === false;
  }

  function extractMaskCharacters(value, mask) {
    var text = value == null ? '' : String(value);
    var chars = [];
    var tokenIndex = 0;
    var tokens = getMaskTokens(mask);
    var i;
    var ch;
    if (!mask || !tokens.length) {
      return text;
    }
    for (i = 0; i < text.length && tokenIndex < tokens.length; i += 1) {
      ch = text.charAt(i);
      if (isMaskCharAllowed(ch, tokens[tokenIndex])) {
        chars.push(ch);
        tokenIndex += 1;
      }
    }
    return chars.join('');
  }

  function applyMask(raw, mask) {
    var value = raw == null ? '' : String(raw);
    var output = '';
    var rawIndex = 0;
    var i;
    var token;
    var ch;
    if (!mask) {
      return value;
    }
    for (i = 0; i < mask.length; i += 1) {
      token = getMaskToken(mask.charAt(i));
      if (!token) {
        if (rawIndex > 0) {
          output += mask.charAt(i);
        }
        continue;
      }
      ch = findNextMaskChar(value, rawIndex, token);
      if (!ch) {
        break;
      }
      output += ch.value;
      rawIndex = ch.nextIndex;
    }
    return output;
  }

  function findNextMaskChar(value, start, token) {
    var i;
    var ch;
    for (i = start; i < value.length; i += 1) {
      ch = value.charAt(i);
      if (isMaskCharAllowed(ch, token)) {
        return {
          value: ch,
          nextIndex: i + 1
        };
      }
    }
    return null;
  }

  function getMaskTokens(mask) {
    var tokens = [];
    var i;
    var token;
    for (i = 0; i < String(mask || '').length; i += 1) {
      token = getMaskToken(mask.charAt(i));
      if (token) {
        tokens.push(token);
      }
    }
    return tokens;
  }

  function getMaskToken(ch) {
    if (ch === '9') {
      return 'digit';
    }
    if (ch === 'A') {
      return 'letter';
    }
    if (ch === '*') {
      return 'alphanumeric';
    }
    return '';
  }

  function isMaskCharAllowed(ch, token) {
    if (token === 'digit') {
      return /[0-9]/.test(ch);
    }
    if (token === 'letter') {
      return /[A-Za-z]/.test(ch);
    }
    if (token === 'alphanumeric') {
      return /[0-9A-Za-z]/.test(ch);
    }
    return false;
  }

  function stripNumberGroupSeparators(value) {
    return String(value).replace(/,/g, '');
  }

  function isDigitKey(key) {
    return /^[0-9]$/.test(key);
  }

  function isNumberEditorTextAllowed(editor, text) {
    var start = editor.selectionStart == null ? editor.value.length : editor.selectionStart;
    var end = editor.selectionEnd == null ? start : editor.selectionEnd;
    var next = editor.value.slice(0, start) + text + editor.value.slice(end);
    return stripNumberGroupSeparators(next).trim() === sanitizeNumberEditorText(next);
  }

  function sanitizeNumberEditorText(value) {
    var text = stripNumberGroupSeparators(value).trim();
    var output = '';
    var hasDecimal = false;
    var i;
    var ch;
    for (i = 0; i < text.length; i += 1) {
      ch = text.charAt(i);
      if (isDigitKey(ch)) {
        output += ch;
      } else if (ch === '.' && !hasDecimal) {
        output += ch;
        hasDecimal = true;
      } else if (ch === '-' && output === '') {
        output = '-';
      }
    }
    return output;
  }

  function sanitizeDateEditorText(value) {
    return String(value == null ? '' : value).replace(/[^0-9]/g, '').slice(0, 8);
  }

  function sanitizeYymmboxEditorText(value) {
    return String(value == null ? '' : value).replace(/[^0-9]/g, '').slice(0, 6);
  }

  function getNumberCopyText(value) {
    return stripNumberGroupSeparators(value == null ? '' : value).trim();
  }

  function formatNumberEditorText(value, useThousandsSeparator, precision) {
    var text = stripNumberGroupSeparators(value).trim();
    var number;
    var sign = '';
    var hasDecimal;
    var parts;
    var integer;
    var decimal;
    if (text === '') {
      return '';
    }
    if (text === '-') {
      return text;
    }
    if (!/^-?\d*(?:\.\d*)?$/.test(text)) {
      return String(value);
    }
    if (precision != null) {
      number = Number(text);
      if (isFinite(number)) {
        text = number.toFixed(precision);
      }
    }
    if (text.charAt(0) === '-') {
      sign = text.charAt(0);
      text = text.slice(1);
    }
    hasDecimal = text.indexOf('.') >= 0;
    parts = text.split('.');
    integer = parts[0] || '0';
    decimal = parts.length > 1 ? parts[1] : '';
    integer = integer.replace(/^0+(?=\d)/, '');
    if (useThousandsSeparator === true) {
      integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return sign + integer + (hasDecimal ? '.' + decimal : '');
  }

  function getByBinding(item, binding) {
    var parts;
    var i;
    var value = item;
    if (!item || !binding) {
      return undefined;
    }
    parts = String(binding).split('.');
    for (i = 0; i < parts.length; i += 1) {
      if (value == null) {
        return undefined;
      }
      value = value[parts[i]];
    }
    return value;
  }

  function setByBinding(item, binding, value) {
    var parts = String(binding).split('.');
    var target = item;
    var i;
    for (i = 0; i < parts.length - 1; i += 1) {
      if (!target[parts[i]]) {
        target[parts[i]] = {};
      }
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = value;
  }

  function findColumnByOffset(columns, start, end, offset) {
    var low = start;
    var high = end - 1;
    var mid;
    var col;
    var result = start;
    while (low <= high) {
      mid = Math.floor((low + high) / 2);
      col = columns[mid];
      if (col._left + col._width <= offset) {
        low = mid + 1;
      } else {
        result = mid;
        high = mid - 1;
      }
    }
    return result;
  }

  function csvEscape(value) {
    var text = value == null ? '' : String(value);
    if (text.indexOf('"') >= 0 || text.indexOf(',') >= 0 || text.indexOf('\n') >= 0) {
      return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
  }

  function createXlsxFiles(columns, rows, options) {
    var now = new Date().toISOString();
    var registry = createExcelStyleRegistry();
    var worksheet = createWorksheetXml(columns, rows, options || {}, registry);
    return [
      {
        name: '[Content_Types].xml',
        content: '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
          '<Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
          '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
          '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
          '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
          '</Types>'
      },
      {
        name: '_rels/.rels',
        content: '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
          '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
          '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
          '</Relationships>'
      },
      {
        name: 'docProps/app.xml',
        content: '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
          '<Application>FastGrid</Application>' +
          '</Properties>'
      },
      {
        name: 'docProps/core.xml',
        content: '<?xml version="1.0" encoding="UTF-8"?>' +
          '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
          '<dc:creator>FastGrid</dc:creator>' +
          '<cp:lastModifiedBy>FastGrid</cp:lastModifiedBy>' +
          '<dcterms:created xsi:type="dcterms:W3CDTF">' + now + '</dcterms:created>' +
          '<dcterms:modified xsi:type="dcterms:W3CDTF">' + now + '</dcterms:modified>' +
          '</cp:coreProperties>'
      },
      {
        name: 'xl/workbook.xml',
        content: '<?xml version="1.0" encoding="UTF-8"?>' +
          '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
          '<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>' +
          '</workbook>'
      },
      {
        name: 'xl/_rels/workbook.xml.rels',
        content: '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
          '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
          '</Relationships>'
      },
      {
        name: 'xl/styles.xml',
        content: createExcelStylesXml(registry)
      },
      {
        name: 'xl/worksheets/sheet1.xml',
        content: worksheet
      }
    ];
  }

  function createExcelStyleRegistry() {
    var registry = {
      fonts: [
        { bold: false, color: null },
        { bold: true, color: 'FF1F2937' }
      ],
      fills: [
        null,
        { gray125: true },
        { color: 'FFF5F7FA' }
      ],
      xfs: [
        { fontId: 0, fillId: 0, borderId: 0, align: '', numFmtId: 0 },
        { fontId: 1, fillId: 2, borderId: 1, align: 'center', numFmtId: 0 },
        { fontId: 0, fillId: 0, borderId: 1, align: '', numFmtId: 0 },
        { fontId: 0, fillId: 0, borderId: 1, align: 'right', numFmtId: 0 },
        { fontId: 0, fillId: 0, borderId: 1, align: 'center', numFmtId: 0 }
      ],
      numFmts: [],
      fontMap: { 'normal|': 0, 'bold|FF1F2937': 1 },
      fillMap: { none: 0, gray125: 1, FFF5F7FA: 2 },
      numFmtMap: {},
      nextNumFmtId: 164,
      xfMap: {
        '0|0|0|0|': 0,
        '1|2|1|center|0': 1,
        '0|0|1||0': 2,
        '0|0|1|right|0': 3,
        '0|0|1|center|0': 4
      }
    };
    return registry;
  }

  function createExcelStylesXml(registry) {
    var xml = [];
    var i;
    xml.push('<?xml version="1.0" encoding="UTF-8"?>');
    xml.push('<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">');
    if (registry.numFmts.length) {
      xml.push('<numFmts count="' + registry.numFmts.length + '">');
      for (i = 0; i < registry.numFmts.length; i += 1) {
        xml.push('<numFmt numFmtId="' + registry.numFmts[i].id + '" formatCode="' + xmlEscape(registry.numFmts[i].code) + '"/>');
      }
      xml.push('</numFmts>');
    }
    xml.push('<fonts count="' + registry.fonts.length + '">');
    for (i = 0; i < registry.fonts.length; i += 1) {
      xml.push(createExcelFontXml(registry.fonts[i]));
    }
    xml.push('</fonts>');
    xml.push('<fills count="' + registry.fills.length + '">');
    for (i = 0; i < registry.fills.length; i += 1) {
      xml.push(createExcelFillXml(registry.fills[i]));
    }
    xml.push('</fills>');
    xml.push('<borders count="2">');
    xml.push('<border><left/><right/><top/><bottom/><diagonal/></border>');
    xml.push('<border>');
    xml.push('<left style="thin"><color rgb="FFD7DEE8"/></left>');
    xml.push('<right style="thin"><color rgb="FFD7DEE8"/></right>');
    xml.push('<top style="thin"><color rgb="FFD7DEE8"/></top>');
    xml.push('<bottom style="thin"><color rgb="FFD7DEE8"/></bottom>');
    xml.push('<diagonal/>');
    xml.push('</border>');
    xml.push('</borders>');
    xml.push('<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>');
    xml.push('<cellXfs count="' + registry.xfs.length + '">');
    for (i = 0; i < registry.xfs.length; i += 1) {
      xml.push(createExcelXfXml(registry.xfs[i]));
    }
    xml.push('</cellXfs>');
    xml.push('<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>');
    xml.push('</styleSheet>');
    return xml.join('');
  }

  function createExcelFontXml(font) {
    var xml = ['<font>'];
    if (font.bold) {
      xml.push('<b/>');
    }
    xml.push('<sz val="11"/>');
    if (font.color) {
      xml.push('<color rgb="' + font.color + '"/>');
    }
    xml.push('<name val="Arial"/>');
    xml.push('</font>');
    return xml.join('');
  }

  function createExcelFillXml(fill) {
    if (!fill) {
      return '<fill><patternFill patternType="none"/></fill>';
    }
    if (fill.gray125) {
      return '<fill><patternFill patternType="gray125"/></fill>';
    }
    return '<fill><patternFill patternType="solid"><fgColor rgb="' + fill.color + '"/><bgColor indexed="64"/></patternFill></fill>';
  }

  function createExcelXfXml(xf) {
    var numFmtId = xf.numFmtId || 0;
    var xml = '<xf numFmtId="' + numFmtId + '" fontId="' + xf.fontId + '" fillId="' + xf.fillId + '" borderId="' + xf.borderId + '" xfId="0"';
    if (numFmtId) {
      xml += ' applyNumberFormat="1"';
    }
    if (xf.fontId) {
      xml += ' applyFont="1"';
    }
    if (xf.fillId) {
      xml += ' applyFill="1"';
    }
    if (xf.borderId) {
      xml += ' applyBorder="1"';
    }
    if (xf.align) {
      xml += ' applyAlignment="1"><alignment horizontal="' + xf.align + '" vertical="center"/></xf>';
      return xml;
    }
    if (xf.borderId) {
      xml += ' applyAlignment="1"><alignment vertical="center"/></xf>';
      return xml;
    }
    return xml + '/>';
  }

  function registerExcelCellStyle(registry, style) {
    var fontId = registerExcelFont(registry, style);
    var fillId = registerExcelFill(registry, style);
    var numFmtId = registerExcelNumberFormat(registry, style.numFmtCode || style.numberFormat || '');
    var borderId = 1;
    var align = style.align || '';
    var key = fontId + '|' + fillId + '|' + borderId + '|' + align + '|' + numFmtId;
    if (registry.xfMap[key] != null) {
      return registry.xfMap[key];
    }
    registry.xfs.push({
      fontId: fontId,
      fillId: fillId,
      borderId: borderId,
      align: align,
      numFmtId: numFmtId
    });
    registry.xfMap[key] = registry.xfs.length - 1;
    return registry.xfs.length - 1;
  }

  function registerExcelFont(registry, style) {
    var color = style.color || null;
    var bold = style.bold === true;
    var key = (bold ? 'bold' : 'normal') + '|' + (color || '');
    if (registry.fontMap[key] != null) {
      return registry.fontMap[key];
    }
    registry.fonts.push({ bold: bold, color: color });
    registry.fontMap[key] = registry.fonts.length - 1;
    return registry.fonts.length - 1;
  }

  function registerExcelFill(registry, style) {
    var color = style.backgroundColor || null;
    if (!color) {
      return 0;
    }
    if (registry.fillMap[color] != null) {
      return registry.fillMap[color];
    }
    registry.fills.push({ color: color });
    registry.fillMap[color] = registry.fills.length - 1;
    return registry.fills.length - 1;
  }

  function registerExcelNumberFormat(registry, code) {
    code = code || '';
    if (!code) {
      return 0;
    }
    if (registry.numFmtMap[code] != null) {
      return registry.numFmtMap[code];
    }
    registry.numFmts.push({
      id: registry.nextNumFmtId,
      code: code
    });
    registry.numFmtMap[code] = registry.nextNumFmtId;
    registry.nextNumFmtId += 1;
    return registry.numFmtMap[code];
  }

  function createWorksheetXml(columns, rows, options, registry) {
    var includeFooter = options.includeFooter === true && options.grid;
    var dataMaxRow = rows.length + 1;
    var maxRow = dataMaxRow + (includeFooter ? 1 : 0);
    var maxCol = Math.max(columns.length, 1);
    var xml = [];
    var r;
    var c;
    var row;
    var styleResolver = createExcelStyleResolver(options);
    xml.push('<?xml version="1.0" encoding="UTF-8"?>');
    xml.push('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">');
    xml.push('<dimension ref="A1:' + getExcelColumnName(maxCol) + maxRow + '"/>');
    xml.push(createSheetViewsXml(Math.min(toNumber(options.frozenColumns, 0), columns.length)));
    xml.push(createColumnWidthXml(columns));
    xml.push('<sheetData>');
    xml.push('<row r="1" ht="22" customHeight="1">');
    for (c = 0; c < columns.length; c += 1) {
      xml.push(createExcelCell(1, c + 1, columns[c].header || columns[c].binding, 'string', 1));
    }
    xml.push('</row>');
    for (r = 0; r < rows.length; r += 1) {
      row = rows[r];
      xml.push('<row r="' + (r + 2) + '">');
      for (c = 0; c < columns.length; c += 1) {
        xml.push(createExcelCell(
          r + 2,
          c + 1,
          getByBinding(row, columns[c].binding),
          columns[c].dataType,
          getExcelCellStyle(columns[c], row, r, c, options, registry, styleResolver)
        ));
      }
      xml.push('</row>');
    }
    if (includeFooter) {
      xml.push(createExcelFooterRowXml(rows.length + 2, columns, options.grid));
    }
    if (styleResolver.dispose) {
      styleResolver.dispose();
    }
    xml.push('</sheetData>');
    xml.push('<autoFilter ref="A1:' + getExcelColumnName(maxCol) + dataMaxRow + '"/>');
    xml.push('</worksheet>');
    return xml.join('');
  }

  function createExcelFooterRowXml(rowIndex, columns, grid) {
    var xml = [];
    var c;
    var value;
    xml.push('<row r="' + rowIndex + '">');
    for (c = 0; c < columns.length; c += 1) {
      value = grid.getFooterCellText(columns[c]);
      xml.push(createExcelCell(rowIndex, c + 1, value, 'string', getExcelFooterCellStyle(columns[c])));
    }
    xml.push('</row>');
    return xml.join('');
  }

  function createSheetViewsXml(frozenColumns) {
    var topLeftCell = getExcelColumnName(frozenColumns + 1) + '2';
    var activePane = frozenColumns > 0 ? 'bottomRight' : 'bottomLeft';
    var pane = '<pane ySplit="1"';
    if (frozenColumns > 0) {
      pane += ' xSplit="' + frozenColumns + '"';
    }
    pane += ' topLeftCell="' + topLeftCell + '" activePane="' + activePane + '" state="frozen"/>';
    return '<sheetViews><sheetView workbookViewId="0">' + pane + '</sheetView></sheetViews>';
  }

  function createColumnWidthXml(columns) {
    var xml = [];
    var width;
    var i;
    if (!columns.length) {
      return '';
    }
    xml.push('<cols>');
    for (i = 0; i < columns.length; i += 1) {
      width = Math.max(8, Math.min(80, Math.round(toNumber(columns[i]._width || columns[i].width, 120) / 7)));
      xml.push('<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + width + '" customWidth="1"/>');
    }
    xml.push('</cols>');
    return xml.join('');
  }

  function getExcelCellStyle(column, item, rowIndex, colIndex, options, registry, styleResolver) {
    var baseStyle = getExcelBaseCellStyle(column);
    var extraStyle = styleResolver(item, column, rowIndex, colIndex);
    if (extraStyle) {
      if (!extraStyle.align) {
        extraStyle.align = baseStyle.align;
      }
      if (!extraStyle.numFmtCode && !extraStyle.numberFormat && baseStyle.numFmtCode) {
        extraStyle.numFmtCode = baseStyle.numFmtCode;
      }
      return registerExcelCellStyle(registry, extraStyle);
    }
    if (baseStyle.numFmtCode) {
      return registerExcelCellStyle(registry, baseStyle);
    }
    if (baseStyle.id) {
      return baseStyle.id;
    }
    return 2;
  }

  function getExcelBaseCellStyle(column) {
    var numberFormat;
    if (column.align === 'right' || column.dataType === 'number') {
      numberFormat = getExcelNumberFormatCode(column);
      if (numberFormat) {
        return { align: 'right', numFmtCode: numberFormat };
      }
      return { id: 3, align: 'right' };
    }
    if (column.align === 'center' || column.dataType === 'boolean') {
      return { id: 4, align: 'center' };
    }
    return { id: 2, align: '' };
  }

  function getExcelFooterCellStyle(column) {
    if (column.align === 'right' || column.dataType === 'number') {
      return 3;
    }
    if (column.align === 'center' || column.dataType === 'boolean') {
      return 4;
    }
    return 2;
  }

  function getExcelNumberFormatCode(column) {
    var precision;
    var decimalPart = '';
    var integerPart;
    if (!column || column.dataType !== 'number') {
      return '';
    }
    precision = getNumberPrecision(column);
    integerPart = shouldUseThousandsSeparator(column) ? '#,##0' : '0';
    if (precision != null) {
      decimalPart = precision > 0 ? '.' + repeatString('0', precision) : '';
    } else if (shouldUseThousandsSeparator(column)) {
      decimalPart = '.############';
    } else {
      return '';
    }
    return integerPart + decimalPart;
  }

  function repeatString(text, count) {
    var output = '';
    while (count > 0) {
      output += text;
      count -= 1;
    }
    return output;
  }

  function createExcelStyleResolver(options) {
    var sampleCell = null;
    var formatCell = options.formatCell;
    var customStyle = options.excelCellStyle;
    var grid = options.grid;
    var resolver;
    if (grid && grid.root && typeof document !== 'undefined' && typeof formatCell === 'function') {
      sampleCell = document.createElement('div');
      sampleCell.style.position = 'absolute';
      sampleCell.style.visibility = 'hidden';
      sampleCell.style.pointerEvents = 'none';
      sampleCell.style.top = '-10000px';
      sampleCell.style.left = '-10000px';
      grid.root.appendChild(sampleCell);
    }
    resolver = function(item, column, rowIndex, colIndex) {
      var value = getByBinding(item, column.binding);
      var style = null;
      var fromCell;
      var override;
      if (sampleCell) {
        sampleCell.removeAttribute('style');
        sampleCell.style.position = 'absolute';
        sampleCell.style.visibility = 'hidden';
        sampleCell.style.pointerEvents = 'none';
        sampleCell.style.top = '-10000px';
        sampleCell.style.left = '-10000px';
        sampleCell.className = 'fg-cell' + (column.align ? ' fg-align-' + column.align : '');
        sampleCell.removeAttribute('data-row');
        sampleCell.removeAttribute('data-col');
        sampleCell.textContent = value == null ? '' : String(value);
        formatCell({
          grid: grid,
          cell: sampleCell,
          item: item,
          column: column,
          value: value,
          rowIndex: rowIndex,
          colIndex: colIndex
        });
        fromCell = getExcelStyleFromComputedCell(sampleCell);
        if (fromCell) {
          style = fromCell;
        }
      }
      if (typeof customStyle === 'function') {
        override = customStyle({
          grid: grid,
          item: item,
          column: column,
          value: value,
          rowIndex: rowIndex,
          colIndex: colIndex,
          style: style || {}
        });
        if (override) {
          style = mergeExcelStyle(style || {}, normalizeExcelStyle(override));
        }
      }
      return style;
    };
    if (sampleCell) {
      resolver.dispose = function() {
        if (sampleCell && sampleCell.parentNode) {
          sampleCell.parentNode.removeChild(sampleCell);
        }
      };
    }
    return resolver;
  }

  function getExcelStyleFromComputedCell(cell) {
    var computed = window.getComputedStyle(cell);
    var style = {};
    var color = cssColorToExcelColor(computed.color);
    var backgroundColor = cssColorToExcelColor(computed.backgroundColor);
    if (color && color !== 'FF1F2937' && color !== 'FF111827') {
      style.color = color;
    }
    if (backgroundColor && backgroundColor !== 'FFFFFFFF') {
      style.backgroundColor = backgroundColor;
    }
    if (Number(computed.fontWeight) >= 600 || computed.fontWeight === 'bold') {
      style.bold = true;
    }
    if (computed.textAlign === 'right' || computed.justifyContent === 'flex-end') {
      style.align = 'right';
    } else if (computed.textAlign === 'center' || computed.justifyContent === 'center') {
      style.align = 'center';
    }
    return Object.keys(style).length ? style : null;
  }

  function normalizeExcelStyle(style) {
    return {
      color: cssColorToExcelColor(style.color || style.textColor || ''),
      backgroundColor: cssColorToExcelColor(style.backgroundColor || style.background || ''),
      bold: style.bold === true || style.fontWeight === 'bold' || Number(style.fontWeight) >= 600,
      align: normalizeExcelAlign(style.align || style.textAlign || ''),
      numFmtCode: style.numFmtCode || style.numberFormat || ''
    };
  }

  function mergeExcelStyle(base, override) {
    var result = {};
    var key;
    for (key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) {
        result[key] = base[key];
      }
    }
    for (key in override) {
      if (Object.prototype.hasOwnProperty.call(override, key) && override[key]) {
        result[key] = override[key];
      }
    }
    return result;
  }

  function normalizeExcelAlign(value) {
    if (value === 'right' || value === 'center' || value === 'left') {
      return value;
    }
    return '';
  }

  function cssColorToExcelColor(value) {
    var match;
    var hex;
    if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') {
      return '';
    }
    if (value.charAt(0) === '#') {
      hex = value.length === 4 ?
        value.charAt(1) + value.charAt(1) + value.charAt(2) + value.charAt(2) + value.charAt(3) + value.charAt(3) :
        value.slice(1, 7);
      return 'FF' + hex.toUpperCase();
    }
    match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
    if (!match || match[4] === '0') {
      return '';
    }
    return 'FF' + toHexByte(match[1]) + toHexByte(match[2]) + toHexByte(match[3]);
  }

  function toHexByte(value) {
    var hex = Math.max(0, Math.min(255, Number(value))).toString(16).toUpperCase();
    return hex.length === 1 ? '0' + hex : hex;
  }

  function createExcelCell(row, col, value, type, styleId) {
    var ref = getExcelColumnName(col) + row;
    var style = styleId ? ' s="' + styleId + '"' : '';
    if (value == null) {
      return '<c r="' + ref + '"' + style + ' t="inlineStr"><is><t></t></is></c>';
    }
    if (type === 'number' && typeof value !== 'boolean' && isFinite(Number(value))) {
      return '<c r="' + ref + '"' + style + '><v>' + Number(value) + '</v></c>';
    }
    if (type === 'boolean') {
      return '<c r="' + ref + '"' + style + ' t="b"><v>' + (parseValue(value, 'boolean') ? '1' : '0') + '</v></c>';
    }
    return '<c r="' + ref + '"' + style + ' t="inlineStr"><is><t' + getXmlSpaceAttribute(value) + '>' + xmlEscape(value) + '</t></is></c>';
  }

  function getExcelColumnName(index) {
    var name = '';
    var number = index;
    while (number > 0) {
      number -= 1;
      name = String.fromCharCode(65 + (number % 26)) + name;
      number = Math.floor(number / 26);
    }
    return name;
  }

  function getXmlSpaceAttribute(value) {
    var text = String(value);
    return /^\s|\s$|\s\s/.test(text) ? ' xml:space="preserve"' : '';
  }

  function xmlEscape(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function createZip(files) {
    var localParts = [];
    var centralParts = [];
    var offset = 0;
    var i;
    var file;
    var data;
    var nameBytes;
    var crc;
    var dateParts = getZipDateParts(new Date());
    for (i = 0; i < files.length; i += 1) {
      file = files[i];
      data = stringToUtf8Bytes(file.content);
      nameBytes = stringToUtf8Bytes(file.name);
      crc = crc32(data);
      localParts.push(createZipLocalHeader(nameBytes, data, crc, dateParts));
      localParts.push(data);
      centralParts.push(createZipCentralHeader(nameBytes, data, crc, offset, dateParts));
      offset += localParts[localParts.length - 2].length + data.length;
    }
    return concatUint8Arrays(localParts.concat(centralParts, [
      createZipEndRecord(centralParts, offset)
    ]));
  }

  function createZipLocalHeader(nameBytes, data, crc, dateParts) {
    var header = new Uint8Array(30 + nameBytes.length);
    writeUint32(header, 0, 0x04034b50);
    writeUint16(header, 4, 20);
    writeUint16(header, 6, 2048);
    writeUint16(header, 8, 0);
    writeUint16(header, 10, dateParts.time);
    writeUint16(header, 12, dateParts.date);
    writeUint32(header, 14, crc);
    writeUint32(header, 18, data.length);
    writeUint32(header, 22, data.length);
    writeUint16(header, 26, nameBytes.length);
    writeUint16(header, 28, 0);
    header.set(nameBytes, 30);
    return header;
  }

  function createZipCentralHeader(nameBytes, data, crc, offset, dateParts) {
    var header = new Uint8Array(46 + nameBytes.length);
    writeUint32(header, 0, 0x02014b50);
    writeUint16(header, 4, 20);
    writeUint16(header, 6, 20);
    writeUint16(header, 8, 2048);
    writeUint16(header, 10, 0);
    writeUint16(header, 12, dateParts.time);
    writeUint16(header, 14, dateParts.date);
    writeUint32(header, 16, crc);
    writeUint32(header, 20, data.length);
    writeUint32(header, 24, data.length);
    writeUint16(header, 28, nameBytes.length);
    writeUint16(header, 30, 0);
    writeUint16(header, 32, 0);
    writeUint16(header, 34, 0);
    writeUint16(header, 36, 0);
    writeUint32(header, 38, 0);
    writeUint32(header, 42, offset);
    header.set(nameBytes, 46);
    return header;
  }

  function createZipEndRecord(centralParts, centralOffset) {
    var size = 0;
    var i;
    var header = new Uint8Array(22);
    for (i = 0; i < centralParts.length; i += 1) {
      size += centralParts[i].length;
    }
    writeUint32(header, 0, 0x06054b50);
    writeUint16(header, 8, centralParts.length);
    writeUint16(header, 10, centralParts.length);
    writeUint32(header, 12, size);
    writeUint32(header, 16, centralOffset);
    writeUint16(header, 20, 0);
    return header;
  }

  function getZipDateParts(date) {
    var year = Math.max(1980, date.getFullYear());
    return {
      time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
      date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
    };
  }

  function writeUint16(bytes, offset, value) {
    bytes[offset] = value & 255;
    bytes[offset + 1] = (value >>> 8) & 255;
  }

  function writeUint32(bytes, offset, value) {
    bytes[offset] = value & 255;
    bytes[offset + 1] = (value >>> 8) & 255;
    bytes[offset + 2] = (value >>> 16) & 255;
    bytes[offset + 3] = (value >>> 24) & 255;
  }

  function stringToUtf8Bytes(text) {
    var encoded;
    var bytes;
    var i;
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(text);
    }
    encoded = unescape(encodeURIComponent(text));
    bytes = new Uint8Array(encoded.length);
    for (i = 0; i < encoded.length; i += 1) {
      bytes[i] = encoded.charCodeAt(i);
    }
    return bytes;
  }

  function concatUint8Arrays(parts) {
    var total = 0;
    var output;
    var offset = 0;
    var i;
    for (i = 0; i < parts.length; i += 1) {
      total += parts[i].length;
    }
    output = new Uint8Array(total);
    for (i = 0; i < parts.length; i += 1) {
      output.set(parts[i], offset);
      offset += parts[i].length;
    }
    return output;
  }

  function crc32(bytes) {
    var table = getCrcTable();
    var crc = -1;
    var i;
    for (i = 0; i < bytes.length; i += 1) {
      crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 255];
    }
    return (crc ^ -1) >>> 0;
  }

  function getCrcTable() {
    var table = [];
    var c;
    var n;
    var k;
    if (getCrcTable.cache) {
      return getCrcTable.cache;
    }
    for (n = 0; n < 256; n += 1) {
      c = n;
      for (k = 0; k < 8; k += 1) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c >>> 0;
    }
    getCrcTable.cache = table;
    return table;
  }

  defineWijmoCompatibility(FastGrid);

  FastGrid.locales = getLocaleMap();
  FastGrid.defaultLocale = getDefaultLocaleName();
  FastGrid.addLocale = function(name, messages) {
    if (name && messages) {
      FastGrid.locales[String(name)] = messages;
    }
    return FastGrid;
  };

  return FastGrid;
}

var FastGrid = createFastGridFactory();
var FastGridLocales = FastGrid.locales;
export { FastGrid, FastGridLocales };
export default FastGrid;
