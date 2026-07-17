import {
  createDictionary,
  createRemoteRequest,
  createRemoteSortParams,
  getByBinding,
  installFabGridData,
  isSafeBinding,
  normalizePagination,
  normalizeRemoteData,
  setByBinding
} from './fabgrid-data.js';
import { installFabGridExport } from './fabgrid-export.js?v=20260717-pivot-excel-hidden-rows-v1';
import { installFabGridDrag } from './fabgrid-drag.js';
import { installFabGridTree } from './fabgrid-tree.js?v=20260717-tree-context-menu-v1';
import {
  applyMask,
  countMaskCharactersBeforeCaret,
  extractMaskCharacters,
  formatMaskText,
  getMaskCaretPosition,
  getMaskCopyText,
  getMaskTokens,
  isMaskAutoUnmask,
  isMaskCharAllowed,
  isMaskValueIncludingLiterals
} from './fabgrid-editor.js';
import { isPromiseLike, normalizeValidationResult } from './fabgrid-editor.js';
import { installFabGridView } from './fabgrid-view.js?v=20260717-scroll-linked-distance-v2';
import { installFabGridFilterUi } from './fabgrid-filter-ui.js?v=20260717-tree-context-menu-v1';
import { installFabGridSelection } from './fabgrid-selection.js?v=20260717-tree-context-menu-v1';
import { installFabGridEditorRuntime } from './fabgrid-editor-runtime.js?v=20260717-popup-outside-v1';
import { CellType, GroupRow, Row, createGridPanel } from './fabgrid-types.js?v=20260716-row-types-v1';
import { Control, registerControl, unregisterControl } from '../core/control.js?v=20260716-control-events-v3';

export function createFabGridFactory(editorDefinitions) {
  'use strict';

  editorDefinitions = editorDefinitions || {};

  var SELECTION_MODE = Object.freeze({
    Cell: 'Cell',
    CellRange: 'CellRange'
  });

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
    showColumnChooser: true,
    showFooter: false,
    footerHeight: 32,
    footerLabel: '',
    multiSelectRows: false,
    selectionCheckboxWidth: 44,
    allowSorting: true,
    allowFiltering: true,
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
    excelFilterMaxValues: 1000,
    alternatingRowStep: 1,
    autoClipboard: true,
    copyHeaders: 'None',
    locale: null,
    messages: null,
    exportBusyText: null,
    frozenRows: 0,
    syncScrollRender: true,
    itemFormatter: null,
    selectionMode: SELECTION_MODE.Cell,
    highlightActiveRow: true,
    activeCellBorder: 2,
    childItemsPath: null,
    treeColumn: null,
    treeIndent: 20,
    rowGroups: [],
    columns: [],
    observeItemsSource: false,
    remote: false,
    url: null,
    method: 'get',
    loader: null,
    loadMsg: null,
    pagination: false,
    pager: null,
    pageNumber: 1,
    pageSize: 10,
    pageList: [10, 20, 30, 40, 50],
    showPageList: false,
    showPageInfo: true,
    showRefresh: true,
    paginationHeight: 35,
    itemsSource: []
  };
  var FABGRID_INTERNAL_LOCALES = {};
  var DEFAULT_COLOR_PALETTE = [
    '#ffffff', '#000000', '#ff0000', '#ffc000', '#ffff00', '#92d050', '#00b050', '#00b0f0', '#0070c0', '#7030a0',
    '#f2f2f2', '#737373', '#ffe5e5', '#fff9e5', '#ffffe5', '#f3ffe5', '#e5fff1', '#e5f8ff', '#e5f4ff', '#f4e5ff',
    '#d9d9d9', '#595959', '#e6a1a1', '#e6d4a1', '#e5e6a1', '#c4e6a1', '#a1e6c0', '#a1d3e6', '#a1c9e6', '#c8a1e6',
    '#bfbfbf', '#404040', '#cc6666', '#ccb366', '#cccc66', '#9bcc66', '#66cc94', '#66b1cc', '#66a2cc', '#a066cc',
    '#a6a6a6', '#262626', '#b23636', '#b29436', '#b2b236', '#76b236', '#36b26e', '#3691b2', '#367eb2', '#7d36b2',
    '#8c8c8c', '#0d0d0d', '#990f0f', '#99770f', '#99990f', '#56990f', '#0f994e', '#0f7499', '#0f6099', '#5e0f99'
  ];

  function FabGrid(element, options) {
    Control.call(this);
    this.host = typeof element === 'string' ? document.querySelector(element) : element;
    if (!this.host) {
      throw new Error('FabGrid host element was not found.');
    }

    this.options = mergeOptions(DEFAULT_OPTIONS, options || {});
    normalizeGridOptions(this.options);
    this.applyPagerOptions();
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
    this._rowCollection = null;
    this.dataView = [];
    this.paginationTotal = 0;
    this.remoteLoading = false;
    this._remoteLoadSeq = 0;
    this.rowGroupState = createDictionary();
    this._treeCollapsedItems = [];
    this._treeRowInfos = [];
    this._treeInfoItems = [];
    this._treeInfoValues = [];
    this._treeInfoMap = typeof WeakMap === 'function' ? new WeakMap() : null;
    this._treeRootCount = 0;
    this.filterPredicate = null;
    this.searchText = '';
    this.columnSearchValues = {};
    this.columnSearchOperators = {};
    this.hasColumnSearch = false;
    this.excelFilters = {};
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
    this.nativeScrollbarGutters = null;
    this.useScrollLinkedHorizontal = supportsScrollLinkedHorizontal();
    this.rowRange = { start: 0, end: 0 };
    this.columnRange = { start: 0, end: 0 };
    this.renderContentHeight = 0;
    this._layoutReadyForRender = false;
    this.scrollState = {
      top: 0,
      left: 0,
      directionY: 0,
      extraRows: 0
    };
    this.renderedScrollTop = 0;
    this.selection = { row: 0, col: 0 };
    this.selectionAnchor = { row: 0, col: 0 };
    this.cellRangeDragState = null;
    this.cellRangeAutoScrollRaf = 0;
    this.suppressCellRangeClick = false;
    this.suppressCellRangeClickEvent = false;
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
    this.colorState = null;
    this.colorDragState = null;
    this.colorTarget = null;
    this.headerSearchFocusRequest = null;
    this.headerSearchFocusRaf = 0;
    this.comboboxItems = [];
    this.comboboxActiveIndex = -1;
    this.filterMenuColumn = null;
    this.filterMenuAnchor = null;
    this.excelFilterDraft = null;
    this.columnChooserAnchor = null;
    this.topLeftMenuMode = null;
    this.invalidItems = [];
    this._invalidItemMap = {};
    this._validationErrorSeq = 0;
    this._asyncValidationSeq = 0;
    this._asyncValidationMap = {};
    this._validationItems = [];
    this._validationItemIds = [];
    this.busy = false;
    this.raf = 0;
    this.scrollLinkedHorizontalRaf = 0;
    this.disposed = false;
    this.resizeState = null;
    this.columnDragState = null;
    this.columnDragTargetCell = null;
    this.columnDragIndicator = null;
    this.verticalScrollbarDrag = null;
    this.horizontalScrollbarDrag = null;
    this.pointerInteractionEventsBound = false;
    this.verticalScrollbarDragEventsBound = false;
    this.horizontalScrollbarDragEventsBound = false;
    this.fixedPaneTouchTap = null;
    this.fixedPaneTouchClickUntil = 0;
    this.suppressClick = false;
    this.cellRangeClickCandidate = null;
    this.copyBuffer = '';
    this.headerSearchTimer = 0;
    this.cellDblClickTimer = 0;
    this.pendingCellDblClick = null;
    this._autoSizeCanvas = null;
    this._autoSizeContext = null;
    this._suppressObservedItemChange = 0;
    this._handlingObservedItemChange = false;
    this._observedItemsChangeQueued = false;
    this.cells = createGridPanel(this, CellType.Cell);
    this.columnHeaders = createGridPanel(this, CellType.ColumnHeader);
    this.rowHeaders = createGridPanel(this, CellType.RowHeader);
    this.topLeftCells = createGridPanel(this, CellType.TopLeft);
    this.columnFooters = createGridPanel(this, CellType.ColumnFooter);
    this.bottomLeftCells = createGridPanel(this, CellType.BottomLeft);

    this._boundScroll = bind(this, this.handleScroll);
    this._boundClick = bind(this, this.handleClick);
    this._boundDblClick = bind(this, this.handleDblClick);
    this._boundContextMenu = bind(this, this.handleContextMenu);
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
    this._boundHorizontalScrollbarPointerDown = bind(this, this.handleHorizontalScrollbarPointerDown);
    this._boundHorizontalScrollbarPointerMove = bind(this, this.handleHorizontalScrollbarPointerMove);
    this._boundHorizontalScrollbarPointerUp = bind(this, this.handleHorizontalScrollbarPointerUp);
    this._boundFixedPaneWheel = bind(this, this.handleFixedPaneWheel);
    this._boundFixedPaneTouchStart = bind(this, this.handleFixedPaneTouchStart);
    this._boundFixedPaneTouchEnd = bind(this, this.handleFixedPaneTouchEnd);
    this._boundEditorBeforeInput = bind(this, this.handleEditorBeforeInput);
    this._boundEditorInput = bind(this, this.handleEditorInput);
    this._boundEditorCopy = bind(this, this.handleEditorCopy);
    this._boundHeaderSearchBeforeInput = bind(this, this.handleHeaderSearchBeforeInput);
    this._boundHeaderSearchInput = bind(this, this.handleHeaderSearchInput);
    this._boundHeaderSearchCompositionStart = bind(this, this.handleHeaderSearchCompositionStart);
    this._boundHeaderSearchCompositionEnd = bind(this, this.handleHeaderSearchCompositionEnd);
    this._boundEditorTriggerClick = bind(this, this.handleEditorTriggerClick);
    this._boundDateboxClick = bind(this, this.handleDateboxClick);
    this._boundDateboxChange = bind(this, this.handleDateboxChange);
    this._boundComboboxMouseDown = bind(this, this.handleComboboxMouseDown);
    this._boundColorPanelPointerDown = bind(this, this.handleColorPanelPointerDown);
    this._boundColorPanelPointerMove = bind(this, this.handleColorPanelPointerMove);
    this._boundColorPanelPointerUp = bind(this, this.handleColorPanelPointerUp);
    this._boundFilterMenuClick = bind(this, this.handleFilterMenuClick);
    this._boundExcelFilterMenuInput = bind(this, this.handleExcelFilterMenuInput);
    this._boundColumnChooserChange = bind(this, this.handleColumnChooserChange);
    this._boundTopLeftMenuClick = bind(this, this.handleTopLeftMenuClick);
    this._boundPaginationClick = bind(this, this.handlePaginationClick);
    this._boundPaginationChange = bind(this, this.handlePaginationChange);
    this._boundPaginationKeyDown = bind(this, this.handlePaginationKeyDown);
    this._boundDocumentMouseDown = bind(this, this.handleDocumentMouseDown);
    this._boundFullscreenChange = bind(this, this.handleFullscreenChange);
    this._boundBusyEvent = bind(this, this.blockBusyEvent);
    this._boundResize = bind(this, this.invalidate);

    this.setColumns(this.options.columns || [], true);
    this.setItemsSource(this.options.remote === true ? [] : (this.options.itemsSource || []), true);
    this.createWijmoEvents();
    this.bindOptionEvent('updatedView');
    this.createDom();
    this.bindDomEvents();
    this.bindRowDragEvents();
    this.refresh();
    registerControl(this.host, this);
    if (this.options.remote === true) {
      this.load();
    }
  }

  FabGrid.prototype = Object.create(Control.prototype);
  FabGrid.prototype.constructor = FabGrid;

  function supportsScrollLinkedHorizontal() {
    return typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('animation-timeline: scroll()') &&
      CSS.supports('scroll-timeline-name: --fg-horizontal-scroll') &&
      CSS.supports('timeline-scope: --fg-horizontal-scroll');
  }

  function measureNativeScrollbarGutters() {
    var probe;
    var content;
    var gutters = { width: 0, height: 0 };
    if (!document.body) {
      return gutters;
    }
    probe = document.createElement('div');
    content = document.createElement('div');
    probe.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:100px;height:100px;overflow:scroll;visibility:hidden;';
    content.style.cssText = 'width:200px;height:200px;';
    probe.appendChild(content);
    document.body.appendChild(probe);
    gutters.width = Math.max(0, probe.offsetWidth - probe.clientWidth);
    gutters.height = Math.max(0, probe.offsetHeight - probe.clientHeight);
    probe.remove();
    return gutters;
  }

  function findClosestGridElement(target, classNames, boundary) {
    var node = target && target.nodeType === 1 ? target : target ? target.parentElement : null;
    var i;
    while (node) {
      if (node.classList) {
        for (i = 0; i < classNames.length; i += 1) {
          if (node.classList.contains(classNames[i])) {
            return node;
          }
        }
      }
      if (node === boundary) {
        break;
      }
      node = node.parentElement;
    }
    return null;
  }

  function findClosestGridAttribute(target, name, boundary) {
    var node = target && target.nodeType === 1 ? target : target ? target.parentElement : null;
    while (node) {
      if (typeof node.hasAttribute === 'function' && node.hasAttribute(name)) {
        return node;
      }
      if (node === boundary) {
        break;
      }
      node = node.parentElement;
    }
    return null;
  }

  function isFiniteNumber(value) {
    return typeof value === 'number' && isFinite(value);
  }

  function getHitTestTarget(point, y) {
    var clientX;
    var clientY;
    if (point && point.target) {
      return point.target;
    }
    if (point && point.nodeType) {
      return point;
    }
    if (typeof document === 'undefined' || typeof document.elementFromPoint !== 'function') {
      return null;
    }
    if (typeof point === 'number') {
      clientX = point - (typeof window !== 'undefined' ? window.pageXOffset || 0 : 0);
      clientY = Number(y) - (typeof window !== 'undefined' ? window.pageYOffset || 0 : 0);
    } else if (point && typeof point === 'object') {
      clientX = point.clientX == null ? Number(point.x) - (typeof window !== 'undefined' ? window.pageXOffset || 0 : 0) : Number(point.clientX);
      clientY = point.clientY == null ? Number(point.y) - (typeof window !== 'undefined' ? window.pageYOffset || 0 : 0) : Number(point.clientY);
    }
    return isFiniteNumber(clientX) && isFiniteNumber(clientY) ? document.elementFromPoint(clientX, clientY) : null;
  }

  function getHitTestPoint(point, target) {
    var rect;
    var pageXOffset = typeof window !== 'undefined' ? window.pageXOffset || 0 : 0;
    var pageYOffset = typeof window !== 'undefined' ? window.pageYOffset || 0 : 0;
    if (point && point.pageX != null && point.pageY != null) {
      return { x: Number(point.pageX), y: Number(point.pageY) };
    }
    if (point && point.clientX != null && point.clientY != null) {
      return { x: Number(point.clientX) + pageXOffset, y: Number(point.clientY) + pageYOffset };
    }
    if (point && point.x != null && point.y != null) {
      return { x: Number(point.x), y: Number(point.y) };
    }
    if (target && typeof target.getBoundingClientRect === 'function') {
      rect = target.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 + pageXOffset,
        y: rect.top + rect.height / 2 + pageYOffset
      };
    }
    return { x: 0, y: 0 };
  }

  function createEmptyHitTestInfo(grid, target, point) {
    return {
      grid: grid,
      panel: null,
      cellType: CellType.None,
      row: -1,
      col: -1,
      viewCol: -1,
      column: null,
      range: null,
      target: target || null,
      point: point,
      isSearchRow: false,
      edgeTop: false,
      edgeRight: false,
      edgeBottom: false,
      edgeLeft: false,
      edgeFarTop: false,
      edgeFarRight: false,
      edgeFarBottom: false,
      edgeFarLeft: false
    };
  }

  FabGrid.prototype.on = function(name, handler) {
    if (!this.events[name]) {
      this.events[name] = [];
    }
    this.events[name].push(handler);
    return this;
  };

  FabGrid.prototype.off = function(name, handler) {
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

  FabGrid.prototype.emit = function(name, detail) {
    var list = this.events[name];
    var wijmoEvent = this.wijmoEvents ? this.wijmoEvents[name] : null;
    var i;
    detail = detail || {};
    if (list) {
      list = list.slice();
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

  FabGrid.prototype.createWijmoEvents = function() {
    var names = [
      'autoGeneratedColumns',
      'autoSizedColumn',
      'autoSizedRow',
      'autoSizingColumn',
      'autoSizingRow',
      'beforeLoad',
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
      'filterChanged',
      'formatItem',
      'groupCollapsedChanged',
      'groupCollapsedChanging',
      'itemsSourceChanged',
      'itemsSourceChanging',
      'loadedRows',
      'loadingRows',
      'loadError',
      'loadSuccess',
      'pasted',
      'pastedCell',
      'pasting',
      'pastingCell',
      'pageChanged',
      'pageChanging',
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

  FabGrid.prototype.bindOptionEvent = function(name) {
    var event = this.wijmoEvents ? this.wijmoEvents[name] : null;
    var handler = this.options ? this.options[name] : null;
    if (event && typeof event.addHandler === 'function' && typeof handler === 'function') {
      event.addHandler(handler, this);
    }
  };

  FabGrid.prototype.setLocale = function(locale, messages, silent) {
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
    if (this.isColumnChooserOpen()) {
      this.renderColumnChooser();
      this.positionColumnChooser(this.columnChooserAnchor);
    }
    if (this.isTopLeftMenuOpen()) {
      this.renderActiveTopLeftMenu();
    }
    this.render();
    }
  };

  FabGrid.prototype.getText = function(path, data) {
    return formatLocaleText(getLocaleValue(this.messages, path), data);
  };

  FabGrid.prototype.createDom = function() {
    var root = document.createElement('div');
    root.className = 'fg-root' + (this.useScrollLinkedHorizontal ? ' fg-scroll-linked-horizontal' : '');
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
        '<div class="fg-scrollbar-h"><div class="fg-scrollbar-h-track"><div class="fg-scrollbar-h-thumb"></div></div></div>' +
        '<div class="fg-row-header-pane"><div class="fg-row-header-layer"></div></div>' +
        '<div class="fg-selection-pane"><div class="fg-selection-layer"></div></div>' +
        '<div class="fg-frozen-pane"><div class="fg-frozen-layer"></div></div>' +
        '<div class="fg-frozen-pane-right"><div class="fg-frozen-layer-right"></div></div>' +
        '<input class="fg-editor textbox-f" type="text">' +
        '<div class="fg-editor-icons"><button class="fg-editor-trigger" type="button"></button></div>' +
        '<div class="fg-datebox-panel" role="dialog"></div>' +
        '<div class="fg-combobox-panel" role="listbox"></div>' +
        '<div class="fg-color-panel" role="dialog"></div>' +
        '<div class="fg-invalid-tip" role="tooltip"></div>' +
        '<div class="fg-empty"></div>' +
        '<div class="fg-busy-overlay" aria-live="polite"><div class="fg-busy-panel"><span class="fg-busy-spinner"></span><span class="fg-busy-text"></span></div></div>' +
      '</div>' +
      '<div class="fg-filter-menu" role="menu"></div>' +
      '<div class="fg-top-left-menu" role="menu"></div>' +
      '<div class="fg-column-chooser" role="dialog"></div>' +
      '<div class="fg-footer">' +
        '<div class="fg-footer-row-header"></div>' +
        '<div class="fg-footer-selection"></div>' +
        '<div class="fg-footer-frozen"></div>' +
        '<div class="fg-footer-frozen-right"></div>' +
        '<div class="fg-footer-scroll"><div class="fg-footer-canvas"></div></div>' +
      '</div>' +
      '<div class="fg-pager"><div class="fg-pagination" aria-label="Pagination"></div></div>' +
      '<div class="fg-remote-load-mask" aria-live="polite"><div class="fg-remote-load-panel"><span class="fg-remote-load-spinner pagination-loading"></span><span class="fg-remote-load-text"></span></div></div>';

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
    this.horizontalScrollbar = root.querySelector('.fg-scrollbar-h');
    this.horizontalScrollbarTrack = root.querySelector('.fg-scrollbar-h-track');
    this.horizontalScrollbarThumb = root.querySelector('.fg-scrollbar-h-thumb');
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
    this.colorPanel = root.querySelector('.fg-color-panel');
    this.filterMenu = root.querySelector('.fg-filter-menu');
    this.topLeftMenu = root.querySelector('.fg-top-left-menu');
    this.columnChooser = root.querySelector('.fg-column-chooser');
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
    this.pager = root.querySelector('.fg-pager');
    this.pagination = root.querySelector('.fg-pagination');
    this.remoteLoadMask = root.querySelector('.fg-remote-load-mask');
    this.remoteLoadText = root.querySelector('.fg-remote-load-text');
    this.syncHeaderLayout();
    this.applyLocaleToDom();
    this.applyThemeOptions();
  };

  FabGrid.prototype.applyLocaleToDom = function() {
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
    if (this.colorPanel) {
      this.colorPanel.setAttribute('aria-label', this.getText('aria.colorPicker'));
    }
    if (this.columnChooser) {
      this.columnChooser.setAttribute('aria-label', this.getText('aria.columnChooser'));
    }
    if (this.topLeftMenu) {
      this.topLeftMenu.setAttribute('aria-label', this.getText('topLeftMenu.ariaLabel'));
    }
    if (this.empty) {
      this.empty.textContent = this.getText('emptyText');
    }
    if (this.pagination) {
      this.pagination.setAttribute('aria-label', this.getText('pagination.ariaLabel'));
    }
  };

  FabGrid.prototype.getEditorTriggerLabel = function() {
    if (this.editorIconConfigs && this.editorIconConfigs.length) {
      return this.editorIconConfigs[0].ariaLabel || this.editorIconConfigs[0].label || this.editorIconConfigs[0].title || this.getText('aria.cellEditor');
    }
    if (this.editorConfig && this.editorConfig.type === 'combobox') {
      return this.getText('aria.openComboBox');
    }
    if (this.editorConfig && this.editorConfig.type === 'color') {
      return this.getText('aria.openColorPicker');
    }
    return this.getText('aria.openDatePicker');
  };

  FabGrid.prototype.applyThemeOptions = function() {
    if (this.root) {
      this.root.style.setProperty('--fg-active-cell-border', Math.max(0, toNumber(this.options.activeCellBorder, 2)) + 'px');
    }
  };

  FabGrid.prototype.bindDomEvents = function() {
    this.bodyScroll.addEventListener('scroll', this._boundScroll);
    this.verticalScrollbar.addEventListener('pointerdown', this._boundVerticalScrollbarPointerDown);
    this.verticalScrollbar.addEventListener('wheel', this._boundVerticalScrollbarWheel, { passive: false });
    this.horizontalScrollbar.addEventListener('pointerdown', this._boundHorizontalScrollbarPointerDown);
    this.root.addEventListener('click', this._boundClick);
    this.root.addEventListener('pointerdown', this._boundFilterMenuClick, true);
    this.root.addEventListener('mousedown', this._boundFilterMenuClick, true);
    this.root.addEventListener('dblclick', this._boundDblClick);
    this.root.addEventListener('contextmenu', this._boundContextMenu);
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
    this.header.addEventListener('compositionstart', this._boundHeaderSearchCompositionStart);
    this.header.addEventListener('compositionend', this._boundHeaderSearchCompositionEnd);
    this.editorIconHost.addEventListener('click', this._boundEditorTriggerClick);
    this.dateboxPanel.addEventListener('click', this._boundDateboxClick);
    this.dateboxPanel.addEventListener('change', this._boundDateboxChange);
    this.comboboxPanel.addEventListener('mousedown', this._boundComboboxMouseDown);
    this.colorPanel.addEventListener('pointerdown', this._boundColorPanelPointerDown);
    this.colorPanel.addEventListener('pointermove', this._boundColorPanelPointerMove);
    this.colorPanel.addEventListener('pointerup', this._boundColorPanelPointerUp);
    this.colorPanel.addEventListener('pointercancel', this._boundColorPanelPointerUp);
    this.filterMenu.addEventListener('pointerdown', this._boundFilterMenuClick, true);
    this.filterMenu.addEventListener('mousedown', this._boundFilterMenuClick, true);
    this.filterMenu.addEventListener('click', this._boundFilterMenuClick);
    this.filterMenu.addEventListener('input', this._boundExcelFilterMenuInput);
    this.filterMenu.addEventListener('change', this._boundExcelFilterMenuInput);
    this.columnChooser.addEventListener('change', this._boundColumnChooserChange);
    this.topLeftMenu.addEventListener('click', this._boundTopLeftMenuClick);
    this.pagination.addEventListener('click', this._boundPaginationClick);
    this.pagination.addEventListener('change', this._boundPaginationChange);
    this.pagination.addEventListener('keydown', this._boundPaginationKeyDown);
    document.addEventListener('pointerdown', this._boundFilterMenuClick, true);
    document.addEventListener('mousedown', this._boundFilterMenuClick, true);
    document.addEventListener('click', this._boundFilterMenuClick, true);
    document.addEventListener('mousedown', this._boundDocumentMouseDown);
    document.addEventListener('fullscreenchange', this._boundFullscreenChange);
    document.addEventListener('webkitfullscreenchange', this._boundFullscreenChange);
    this.editor.addEventListener('beforeinput', this._boundEditorBeforeInput);
    window.addEventListener('resize', this._boundResize);
  };























  FabGrid.prototype.setColumns = function(columns, silent) {
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
        cellTemplate: null,
        footer: null,
        footerFormatter: null,
        aggregate: null,
        editor: null,
        thousandsSeparator: null,
        mask: '',
        autoUnmask: null,
        maskValueIncludesLiterals: null,
        readOnly: false
      }, columns[i]);
      defineColumnCellTemplate(this, col, col.cellTemplate);
      col.editor = normalizeEditorConfig(col.editor, col);
      col._index = i;
      col._width = Math.max(1, toNumber(col.width, 120), toNumber(col.minWidth, 48));
      this.columns.push(col);
    }
    this.updateLayout();
    if (!silent) {
      this.refresh();
    }
  };

  function defineColumnCellTemplate(grid, column, initialValue) {
    var template = normalizeCellTemplate(initialValue);
    Object.defineProperty(column, 'cellTemplate', {
      configurable: true,
      enumerable: true,
      get: function() {
        return template;
      },
      set: function(value) {
        var normalized = normalizeCellTemplate(value);
        if (template === normalized) {
          return;
        }
        template = normalized;
        column._cellTemplateSource = null;
        column._cellTemplateRenderer = null;
        if (!grid.disposed && typeof grid.invalidate === 'function') {
          grid.invalidate();
        }
      }
    });
  }

  function normalizeCellTemplate(value) {
    return typeof value === 'function' || typeof value === 'string' ? value : null;
  }

  FabGrid.prototype.setColumnVisible = function(column, visible) {
    var target = column;
    var wasEditingTarget;
    if (typeof column === 'number') {
      target = this.columns[column] || this.visibleColumns[column];
    }
    if (!target || this.columns.indexOf(target) < 0) {
      return false;
    }
    wasEditingTarget = this.editing && this.visibleColumns[this.editing.col] === target;
    target.visible = visible !== false;
    this.updateLayout();
    if (wasEditingTarget) {
      this.finishEditing(false);
    }
    this.clampSelection();
    this.refresh();
    this.emit('columnVisibilityChanged', {
      column: target,
      visible: target.visible !== false
    });
    return true;
  };

  FabGrid.prototype.setFrozenColumns = function(count) {
    this.options.frozenColumns = normalizeNonNegativeInteger(count, 0);
    this.refresh();
  };

  FabGrid.prototype.setFrozenRightColumns = function(count) {
    this.options.frozenRightColumns = normalizeNonNegativeInteger(count, 0);
    this.refresh();
  };

  FabGrid.prototype.setRowHeaderWidth = function(width) {
    this.options.rowHeaderWidth = Math.max(0, toNumber(width, DEFAULT_OPTIONS.rowHeaderWidth));
    this.refresh();
  };

  FabGrid.prototype.getRowCollection = function() {
    var grid = this;
    if (!this._rowCollection) {
      this._rowCollection = this.view.map(function(dataItem, index) {
        var RowType = grid.isRowGroup(dataItem) || grid.isRowGroupFooter(dataItem) ? GroupRow : Row;
        return new RowType(grid, index, dataItem);
      });
    }
    return this._rowCollection;
  };

  FabGrid.prototype.setShowRowHeaders = function(value) {
    var mode = normalizeRowHeaderMode(value);
    var changed = this.options.showRowHeaders !== mode;
    this.options.showRowHeaders = mode;
    this.updateLayout();
    this.refresh();
    if (changed) {
      this.emit('rowHeaderModeChanged', {
        mode: mode,
        showRowHeaders: mode
      });
    }
  };

  FabGrid.prototype.setShowFooter = function(value) {
    this.options.showFooter = value === true;
    this.refresh();
  };

  FabGrid.prototype.setAllowFiltering = function(value) {
    var enabled = value !== false;
    var changed = this.options.allowFiltering !== enabled;
    if (!changed) {
      return;
    }
    this.options.allowFiltering = enabled;
    if (!enabled) {
      this.columnSearchValues = {};
      this.columnSearchOperators = {};
      this.hasColumnSearch = false;
      this.excelFilters = {};
    }
    this.cancelHeaderSearchTimer();
    this.hideFilterMenu();
    this.applyFilterChange(true, 'allowFiltering');
  };

  FabGrid.prototype.setShowSearchRow = function(value) {
    var visible = value === true;
    var changed = this.options.showSearchRow !== visible;
    var hadFilter;
    if (!changed) {
      return;
    }
    hadFilter = visible ? hasExcelFilterEntries(this.excelFilters) : this.hasColumnSearch === true;
    if (visible) {
      this.excelFilters = {};
    } else {
      this.columnSearchValues = {};
      this.columnSearchOperators = {};
      this.hasColumnSearch = false;
    }
    this.options.showSearchRow = visible;
    this.cancelHeaderSearchTimer();
    this.hideFilterMenu();
    this.applyFilterChange(true, 'searchRowVisibility');
    this.emit('searchRowVisibilityChanged', {
      visible: visible,
      showSearchRow: visible,
      clearedFilter: hadFilter
    });
  };

  FabGrid.prototype.setEditMode = function(value) {
    var enabled = value === true;
    this.options.allowEditing = enabled;
    this.options.editOnSelect = enabled;
    if (!enabled) {
      this.finishEditing(false);
    }
    this.render();
  };

  FabGrid.prototype.setMultiSelectRows = function(value) {
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

  FabGrid.prototype.setPage = function(pageNumber) {
    return this.selectPage(pageNumber, this.options.pageSize);
  };

  FabGrid.prototype.setPageSize = function(pageSize) {
    return this.selectPage(1, pageSize);
  };

  FabGrid.prototype.selectPage = function(pageNumber, pageSize) {
    var nextPageSize;
    var pageCount;
    var nextPageNumber;
    var args;
    nextPageSize = Math.max(1, Math.floor(toNumber(pageSize, this.options.pageSize)));
    pageCount = Math.max(1, Math.ceil(this.paginationTotal / nextPageSize));
    nextPageNumber = clamp(Math.floor(toNumber(pageNumber, 1)), 1, pageCount);
    args = {
      pageNumber: nextPageNumber,
      pageSize: nextPageSize,
      total: this.paginationTotal
    };
    if (this.emit('pageChanging', args) === false) {
      return false;
    }
    this.options.pageNumber = nextPageNumber;
    this.options.pageSize = nextPageSize;
    if (this.options.pager && typeof this.options.pager === 'object') {
      this.options.pager.pageNumber = nextPageNumber;
      this.options.pager.pageSize = nextPageSize;
    }
    if (this.options.remote === true) {
      this.resetVerticalScroll();
      this.renderPagination();
      return this.load().then(function(success) {
        if (success) {
          this.emit('pageChanged', args);
        }
        return success;
      }.bind(this));
    }
    this.applyView();
    this.resetVerticalScroll();
    this.refresh();
    this.emit('pageChanged', args);
    return true;
  };

  FabGrid.prototype.getPager = function() {
    return this.pager;
  };

  FabGrid.prototype.setHeaderDisplayMode = function(mode) {
    mode = normalizeHeaderDisplayMode(mode);
    this.options.headerDisplayMode = mode;
    this.headerDisplayMode = mode;
    if (this.root) {
      this.renderHeaders(this.columnRange);
    }
  };

  FabGrid.prototype.toggleHeaderDisplayMode = function() {
    this.setHeaderDisplayMode(this.headerDisplayMode === 'binding' ? 'header' : 'binding');
    return this.headerDisplayMode;
  };

  FabGrid.prototype.getHeaderDisplayMode = function() {
    return this.headerDisplayMode || 'header';
  };



















  FabGrid.prototype.cancelHeaderSearchTimer = function() {
    if (this.headerSearchTimer) {
      window.clearTimeout(this.headerSearchTimer);
      this.headerSearchTimer = 0;
    }
  };

  FabGrid.prototype.scheduleHeaderSearch = function(colIndex, selectionStart, selectionEnd) {
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
        self.applyFilterChange(false, 'headerSearch');
      }
    }, delay);
  };

  FabGrid.prototype.refresh = function() {
    if (this.emit('refreshing', {}) === false) {
      return;
    }
    this.render();
    this.emit('refreshed', {});
  };

  FabGrid.prototype.invalidate = function() {
    this.scheduleRender();
  };

  FabGrid.prototype.hitTest = function(point, y) {
    var target = getHitTestTarget(point, y);
    var hitPoint = getHitTestPoint(point, target);
    var info = createEmptyHitTestInfo(this, target, hitPoint);
    var ownerRoot = findClosestGridElement(target, ['fg-root'], this.host);
    var cell;
    var indexedElement;
    var rect;
    var pageXOffset = typeof window !== 'undefined' ? window.pageXOffset || 0 : 0;
    var pageYOffset = typeof window !== 'undefined' ? window.pageYOffset || 0 : 0;
    var x;
    var yPosition;
    var row;
    var col;
    var column;
    if (!target || ownerRoot !== this.root) {
      return info;
    }
    cell = findClosestGridElement(target, [
      'fg-cell',
      'fg-row-header-cell',
      'fg-selection-cell',
      'fg-header-cell',
      'fg-row-header-top',
      'fg-selection-top',
      'fg-footer-cell',
      'fg-footer-row-header',
      'fg-footer-selection'
    ], this.root);
    if (!cell) {
      return info;
    }
    if (cell.classList.contains('fg-header-cell')) {
      info.panel = this.columnHeaders;
      info.isSearchRow = !!findClosestGridElement(target, ['fg-header-search'], cell);
      if (!info.isSearchRow && this.getSearchRowHeight() > 0 && typeof cell.getBoundingClientRect === 'function') {
        rect = cell.getBoundingClientRect();
        info.isSearchRow = hitPoint.y - pageYOffset >= rect.top + this.getHeaderTitleHeight();
      }
      info.row = info.isSearchRow ? 1 : 0;
    } else if (cell.classList.contains('fg-row-header-cell') || cell.classList.contains('fg-selection-cell')) {
      info.panel = this.rowHeaders;
      row = parseInt(cell.getAttribute('data-row'), 10);
      info.row = isFiniteNumber(row) ? row : -1;
      info.col = 0;
    } else if (cell.classList.contains('fg-row-header-top') || cell.classList.contains('fg-selection-top')) {
      info.panel = this.topLeftCells;
      info.row = 0;
      info.col = 0;
    } else if (cell.classList.contains('fg-footer-cell')) {
      info.panel = this.columnFooters;
      info.row = 0;
    } else if (cell.classList.contains('fg-footer-row-header') || cell.classList.contains('fg-footer-selection')) {
      info.panel = this.bottomLeftCells;
      info.row = 0;
      info.col = 0;
    } else {
      info.panel = this.cells;
      row = parseInt(cell.getAttribute('data-row'), 10);
      info.row = isFiniteNumber(row) ? row : -1;
    }
    info.cellType = info.panel ? info.panel.cellType : CellType.None;
    if (info.col < 0) {
      indexedElement = findClosestGridAttribute(target, 'data-col', cell);
      col = parseInt(indexedElement ? indexedElement.getAttribute('data-col') : cell.getAttribute('data-col'), 10);
      info.viewCol = isFiniteNumber(col) ? col : -1;
      column = info.viewCol >= 0 && this.visibleColumns ? this.visibleColumns[info.viewCol] : null;
      info.column = column || null;
      info.col = column && column._index != null ? column._index : info.viewCol;
    }
    info.range = info.row >= 0 && info.col >= 0 ? {
      row: info.row,
      col: info.col,
      row2: info.row,
      col2: info.col
    } : null;
    info.mergedRange = null;
    info.cell = cell;
    if (typeof cell.getBoundingClientRect === 'function') {
      rect = cell.getBoundingClientRect();
      x = hitPoint.x - pageXOffset;
      yPosition = hitPoint.y - pageYOffset;
      info.edgeTop = Math.abs(yPosition - rect.top) <= 4;
      info.edgeRight = Math.abs(x - rect.right) <= 4;
      info.edgeBottom = Math.abs(yPosition - rect.bottom) <= 4;
      info.edgeLeft = Math.abs(x - rect.left) <= 4;
      info.edgeFarTop = Math.abs(yPosition - rect.top) <= 1;
      info.edgeFarRight = Math.abs(x - rect.right) <= 1;
      info.edgeFarBottom = Math.abs(yPosition - rect.bottom) <= 1;
      info.edgeFarLeft = Math.abs(x - rect.left) <= 1;
    }
    return info;
  };

  FabGrid.prototype.getHeaderHeight = function() {
    return toNumber(this.options.headerHeight, DEFAULT_OPTIONS.headerHeight) + this.getSearchRowHeight();
  };

  FabGrid.prototype.getHeaderTitleHeight = function() {
    return toNumber(this.options.headerHeight, DEFAULT_OPTIONS.headerHeight);
  };

  FabGrid.prototype.getSearchRowHeight = function() {
    var fallback = toNumber(this.options.rowHeight, DEFAULT_OPTIONS.rowHeight);
    var height = this.options.searchRowHeight == null ? fallback : toNumber(this.options.searchRowHeight, fallback);
    return this.options.allowFiltering !== false && this.options.showSearchRow === true ? Math.max(22, height) : 0;
  };

  FabGrid.prototype.syncHeaderLayout = function() {
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

  FabGrid.prototype.dispose = function() {
    var name;
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    unregisterControl(this.host, this);
    if (this.raf) {
      cancelAnimationFrame(this.raf);
    }
    if (this.scrollLinkedHorizontalRaf) {
      cancelAnimationFrame(this.scrollLinkedHorizontalRaf);
      this.scrollLinkedHorizontalRaf = 0;
    }
    if (this.headerSearchFocusRaf) {
      cancelAnimationFrame(this.headerSearchFocusRaf);
      this.headerSearchFocusRaf = 0;
    }
    if (this.cellRangeAutoScrollRaf) {
      cancelAnimationFrame(this.cellRangeAutoScrollRaf);
      this.cellRangeAutoScrollRaf = 0;
    }
    this.cellRangeDragState = null;
    this.cellRangeClickCandidate = null;
    this.suppressCellRangeClick = false;
    this.suppressCellRangeClickEvent = false;
    this.cancelPendingCellDblClick();
    this.cancelHeaderSearchTimer();
    this.finishEditing(false);
    this.unbindPointerInteractionEvents();
    this.unbindVerticalScrollbarDragEvents();
    this.unbindHorizontalScrollbarDragEvents();
    this.unbindRowDragEvents();
    this.removeEventListener();
    this.bodyScroll.removeEventListener('scroll', this._boundScroll);
    this.verticalScrollbar.removeEventListener('pointerdown', this._boundVerticalScrollbarPointerDown);
    this.verticalScrollbar.removeEventListener('wheel', this._boundVerticalScrollbarWheel);
    this.horizontalScrollbar.removeEventListener('pointerdown', this._boundHorizontalScrollbarPointerDown);
    this.root.removeEventListener('click', this._boundClick);
    this.root.removeEventListener('pointerdown', this._boundFilterMenuClick, true);
    this.root.removeEventListener('mousedown', this._boundFilterMenuClick, true);
    this.root.removeEventListener('dblclick', this._boundDblClick);
    this.root.removeEventListener('contextmenu', this._boundContextMenu);
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
    this.header.removeEventListener('compositionstart', this._boundHeaderSearchCompositionStart);
    this.header.removeEventListener('compositionend', this._boundHeaderSearchCompositionEnd);
    this.editorIconHost.removeEventListener('click', this._boundEditorTriggerClick);
    this.dateboxPanel.removeEventListener('click', this._boundDateboxClick);
    this.dateboxPanel.removeEventListener('change', this._boundDateboxChange);
    this.comboboxPanel.removeEventListener('mousedown', this._boundComboboxMouseDown);
    this.colorPanel.removeEventListener('pointerdown', this._boundColorPanelPointerDown);
    this.colorPanel.removeEventListener('pointermove', this._boundColorPanelPointerMove);
    this.colorPanel.removeEventListener('pointerup', this._boundColorPanelPointerUp);
    this.colorPanel.removeEventListener('pointercancel', this._boundColorPanelPointerUp);
    this.filterMenu.removeEventListener('pointerdown', this._boundFilterMenuClick, true);
    this.filterMenu.removeEventListener('mousedown', this._boundFilterMenuClick, true);
    this.filterMenu.removeEventListener('click', this._boundFilterMenuClick);
    this.filterMenu.removeEventListener('input', this._boundExcelFilterMenuInput);
    this.filterMenu.removeEventListener('change', this._boundExcelFilterMenuInput);
    this.columnChooser.removeEventListener('change', this._boundColumnChooserChange);
    this.topLeftMenu.removeEventListener('click', this._boundTopLeftMenuClick);
    this.pagination.removeEventListener('click', this._boundPaginationClick);
    this.pagination.removeEventListener('change', this._boundPaginationChange);
    this.pagination.removeEventListener('keydown', this._boundPaginationKeyDown);
    document.removeEventListener('pointerdown', this._boundFilterMenuClick, true);
    document.removeEventListener('mousedown', this._boundFilterMenuClick, true);
    document.removeEventListener('click', this._boundFilterMenuClick, true);
    document.removeEventListener('mousedown', this._boundDocumentMouseDown);
    document.removeEventListener('fullscreenchange', this._boundFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', this._boundFullscreenChange);
    this.editor.removeEventListener('beforeinput', this._boundEditorBeforeInput);
    window.removeEventListener('resize', this._boundResize);
    this._autoSizeCanvas = null;
    this._autoSizeContext = null;
    this.host.innerHTML = '';
    this.events = {};
    for (name in this.wijmoEvents) {
      if (Object.prototype.hasOwnProperty.call(this.wijmoEvents, name)) {
        this.wijmoEvents[name].clearHandlers();
      }
    }
  };

  FabGrid.prototype.setBusy = function(value, text) {
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

  FabGrid.prototype.blockBusyEvent = function(event) {
    if (!this.busy) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  FabGrid.prototype.handleFixedPaneTouchStart = function(event) {
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

  FabGrid.prototype.handleFixedPaneTouchEnd = function(event) {
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

  FabGrid.prototype.selectFixedPaneTouchRow = function(rowIndex, colIndex, area) {
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

  FabGrid.prototype.getFixedPaneTouchTarget = function(clientX, clientY) {
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

  FabGrid.prototype.getFixedPaneTouchColumn = function(clientX, clientY, pane, startCol, endCol, area) {
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

  FabGrid.prototype.handleFixedPaneWheel = function(event) {
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

  FabGrid.prototype.isFixedPaneScrollTarget = function(target) {
    return !!(
      closest(target, 'fg-frozen-pane') ||
      closest(target, 'fg-frozen-pane-right') ||
      closest(target, 'fg-row-header-pane') ||
      closest(target, 'fg-selection-pane')
    );
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
    return typeof FABGRID_LOCALES !== 'undefined' ? FABGRID_LOCALES : FABGRID_INTERNAL_LOCALES;
  }

  function getDefaultLocaleName() {
    return typeof FABGRID_DEFAULT_LOCALE !== 'undefined' ? FABGRID_DEFAULT_LOCALE : 'zh-TW';
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
    if (config && config.type === 'color') {
      return [{ iconCls: 'fg-editor-trigger-color', builtin: 'color' }];
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
      return isDateLikeEditorType(type) || type === 'combobox' || type === 'color' ? 22 : 0;
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
    var autoUnmask = column && column.autoUnmask != null ? column.autoUnmask : options.autoUnmask;
    if (autoUnmask == null && config.type === 'datebox') {
      autoUnmask = true;
    }
    return {
      mask: mask || getExplicitEditorMask(column),
      autoUnmask: autoUnmask,
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
    if (type === 'combo' || type === 'select' || type === 'dropdown') {
      return 'combobox';
    }
    if (type === 'colour' || type === 'colorbox' || type === 'colourbox') {
      return 'color';
    }
    if (type === 'numberbox' || type === 'datebox' || type === 'combobox' || type === 'color') {
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
    var formatter = config && config.options ? config.options.formatter : null;
    if (typeof formatter !== 'function' && editorDefinitions.datebox && typeof editorDefinitions.datebox.format === 'function') {
      return editorDefinitions.datebox.format(value, mergeOptions(config && config.options ? config.options : {}, { mask: mask }));
    }
    if (mask) {
      return formatMaskText(text, { mask: mask });
    }
    if (date) {
      return formatDateDigits(date);
    }
    return sanitizeDateEditorText(text);
  }

  function formatYearMonthEditorText(value, config, column) {
    var date = parseYearMonthValue(value);
    var text = date ? formatYearMonthDataText(date, column) : value;
    var mask = getEditorMask(column);
    if (editorDefinitions.datebox && typeof editorDefinitions.datebox.format === 'function') {
      return editorDefinitions.datebox.format(value, mergeOptions(config && config.options ? config.options : {}, { mask: mask || '9999/99' }));
    }
    if (mask) {
      return formatMaskText(text, { mask: mask });
    }
    return sanitizeYearMonthEditorText(text);
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
    if (editorDefinitions.datebox && typeof editorDefinitions.datebox.getDataValue === 'function') {
      return editorDefinitions.datebox.getDataValue(value, config && config.options ? config.options : {});
    }
    parsed = parseDateValue(value);
    return parsed ? formatDateIso(parsed) : value;
  }

  function parseDateboxEditorValue(value, config, column) {
    var parser = config && config.options ? config.options.parser : null;
    var parsed;
    var options = mergeOptions(config && config.options ? config.options : {}, { mask: getEditorMask(column) });
    if (typeof parser === 'function') {
      parsed = parser(value);
      if (parsed instanceof Date && !isNaN(parsed.getTime())) {
        return parsed;
      }
      return isYearMonthDateboxConfig(config, column) ? parseYearMonthValue(parsed) : parseDateValue(parsed);
    }
    if (config && editorDefinitions[config.type] && typeof editorDefinitions[config.type].parse === 'function') {
      return editorDefinitions[config.type].parse(value, options);
    }
    return isYearMonthDateboxConfig(config, column) ? parseYearMonthValue(value) : parseDateValue(value);
  }

  function parseYearMonthValue(value) {
    var text;
    var match;
    var year;
    var month;
    if (editorDefinitions.datebox && typeof editorDefinitions.datebox.parse === 'function') {
      return editorDefinitions.datebox.parse(value, { mask: '9999/99' });
    }
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

  function formatYearMonthDataText(value, column) {
    var date = parseYearMonthValue(value);
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
    if (editorDefinitions.datebox && typeof editorDefinitions.datebox.parse === 'function') {
      return editorDefinitions.datebox.parse(value, {});
    }
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
    return type === 'datebox';
  }

  function isYearMonthMask(mask) {
    mask = String(mask || '');
    return mask === '9999/99' || mask === '9999-99';
  }

  function isYearMonthDateboxConfig(config, column) {
    var options = config && config.options ? config.options : {};
    var mask = column ? getEditorMask(column) : options.mask;
    return Boolean(config && config.type === 'datebox' && isYearMonthMask(mask));
  }

  function isYearMonthDateboxTarget(target) {
    return Boolean(target && isYearMonthDateboxConfig(target.config, target.column));
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
        var snapshot = handlers.slice();
        args = args || {};
        for (i = 0; i < snapshot.length; i += 1) {
          if (snapshot[i].handler.call(snapshot[i].self || grid, sender || grid, args) === false) {
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

  function defineWijmoCompatibility(FabGridCtor) {
    var eventNames = [
      'autoGeneratedColumns',
      'autoSizedColumn',
      'autoSizedRow',
      'autoSizingColumn',
      'autoSizingRow',
      'beforeLoad',
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
      'filterChanged',
      'formatItem',
      'groupCollapsedChanged',
      'groupCollapsedChanging',
      'itemsSourceChanged',
      'itemsSourceChanging',
      'loadedRows',
      'loadingRows',
      'loadError',
      'loadSuccess',
      'pasted',
      'pastedCell',
      'pasting',
      'pastingCell',
      'pageChanged',
      'pageChanging',
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

    Object.defineProperties(FabGridCtor.prototype, {
      hostElement: {
        get: function() {
          return this.host;
        }
      },
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
          return this.getRowCollection();
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
          var rowCollection = this.rows;
          var rows;
          var i;
          if (this.options.multiSelectRows === true) {
            rows = [];
            for (i = 0; i < this.view.length; i += 1) {
              if (this.selectedRowMap[i]) {
                rows.push(rowCollection[i]);
              }
            }
            return rows;
          }
          return item ? [rowCollection[row]] : [];
        }
      },
      selectedRanges: {
        get: function() {
          return [this.getSelectionRange()];
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
      allowFiltering: {
        get: function() {
          return this.options.allowFiltering !== false;
        },
        set: function(value) {
          this.setAllowFiltering(value);
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
          this.render();
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
      alternatingRowStep: {
        get: function() {
          return normalizeAlternatingRowStep(this.options.alternatingRowStep);
        },
        set: function(value) {
          this.options.alternatingRowStep = normalizeAlternatingRowStep(value);
          this.render();
        }
      },
      activeCellBorder: {
        get: function() {
          return Math.max(0, toNumber(this.options.activeCellBorder, 2));
        },
        set: function(value) {
          this.options.activeCellBorder = Math.max(0, toNumber(value, 2));
          this.applyThemeOptions();
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
          this.options.selectionMode = normalizeSelectionMode(value);
          if (this.options.selectionMode === SELECTION_MODE.Cell) {
            this.selectionAnchor = {
              row: this.selection.row,
              col: this.selection.col
            };
          }
          this.render();
        }
      },
      highlightActiveRow: {
        get: function() {
          return this.options.highlightActiveRow !== false;
        },
        set: function(value) {
          this.options.highlightActiveRow = value !== false;
          this.render();
        }
      }
    });

    for (i = 0; i < eventNames.length; i += 1) {
      name = eventNames[i];
      defineWijmoOnMethod(FabGridCtor, name);
    }
  }

  function defineWijmoOnMethod(FabGridCtor, eventName) {
    var methodName = 'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
    if (FabGridCtor.prototype[methodName]) {
      return;
    }
    FabGridCtor.prototype[methodName] = function(args) {
      return this.emit(eventName, args || {});
    };
  }

  function toNumber(value, fallback) {
    var number = Number(value);
    return isFinite(number) ? number : fallback;
  }

  function normalizeNonNegativeInteger(value, fallback) {
    return Math.max(0, Math.floor(toNumber(value, fallback)));
  }

  function normalizePositiveNumber(value, fallback) {
    var number = toNumber(value, fallback);
    return number > 0 ? number : fallback;
  }

  function normalizeAlternatingRowStep(value) {
    var number;
    if (value === undefined) {
      return DEFAULT_OPTIONS.alternatingRowStep;
    }
    if (value === false) {
      return false;
    }
    number = Number(value);
    if (!isFinite(number) || number <= 0) {
      return false;
    }
    return Math.max(1, Math.floor(number));
  }

  function normalizeGridOptions(options) {
    options.rowHeight = normalizePositiveNumber(options.rowHeight, DEFAULT_OPTIONS.rowHeight);
    options.overscanRows = normalizeNonNegativeInteger(options.overscanRows, DEFAULT_OPTIONS.overscanRows);
    options.fastScrollOverscanRows = normalizeNonNegativeInteger(options.fastScrollOverscanRows, DEFAULT_OPTIONS.fastScrollOverscanRows);
    options.overscanColumns = normalizeNonNegativeInteger(options.overscanColumns, DEFAULT_OPTIONS.overscanColumns);
    options.frozenColumns = normalizeNonNegativeInteger(options.frozenColumns, DEFAULT_OPTIONS.frozenColumns);
    options.frozenRightColumns = normalizeNonNegativeInteger(options.frozenRightColumns, DEFAULT_OPTIONS.frozenRightColumns);
    options.alternatingRowStep = normalizeAlternatingRowStep(options.alternatingRowStep);
    options.selectionMode = normalizeSelectionMode(options.selectionMode);
    options.highlightActiveRow = options.highlightActiveRow !== false;
    return options;
  }

  function normalizeSelectionMode(value) {
    value = value == null ? '' : String(value).toLowerCase();
    return value === 'cellrange' || value === 'cell-range' || value === 'range' ?
      SELECTION_MODE.CellRange : SELECTION_MODE.Cell;
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

  function rowMatchesExcelFilters(item, columns, filters) {
    var selectedKeys;
    var column;
    var filter;
    var key;
    var value;
    var i;
    var j;
    for (i = 0; i < columns.length; i += 1) {
      column = columns[i];
      key = getColumnSearchKey(column);
      filter = filters[key];
      if (!filter) {
        continue;
      }
      value = getByBinding(item, column.binding);
      if (filter.type !== 'values' || !Array.isArray(filter.values)) {
        continue;
      }
      selectedKeys = filter._valueKeyMap;
      if (!selectedKeys) {
        selectedKeys = createDictionary();
        for (j = 0; j < filter.values.length; j += 1) {
          selectedKeys[getExcelFilterValueKey(filter.values[j])] = true;
        }
        try {
          Object.defineProperty(filter, '_valueKeyMap', { value: selectedKeys, configurable: true });
        } catch (error) {
          filter._valueKeyMap = selectedKeys;
        }
      }
      if (selectedKeys[getExcelFilterValueKey(value)] !== true) {
        return false;
      }
    }
    return true;
  }

  function getExcelFilterValueKey(value) {
    var type;
    var json;
    if (value == null) {
      return value === null ? 'null:' : 'undefined:';
    }
    if (value instanceof Date) {
      return 'date:' + value.getTime();
    }
    type = typeof value;
    if (type === 'number') {
      return 'number:' + (isNaN(value) ? 'NaN' : String(value));
    }
    if (type === 'string' || type === 'boolean' || type === 'bigint') {
      return type + ':' + String(value);
    }
    try {
      json = JSON.stringify(value);
    } catch (error) {
      json = String(value);
    }
    return type + ':' + json;
  }

  function hasExcelFilterEntries(filters) {
    var key;
    for (key in filters || {}) {
      if (Object.prototype.hasOwnProperty.call(filters, key) && filters[key]) {
        return true;
      }
    }
    return false;
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
      sourceDate = parseDateboxEditorValue(value, dateConfig, column);
      targetDate = parseDateboxEditorValue(searchText, dateConfig, column);
      if (isComparisonSearchOperator(operator) && sourceDate && targetDate) {
        sourceText = isYearMonthDateboxConfig(dateConfig, column) ? formatYearMonthDataText(sourceDate, column) : formatDateIso(sourceDate);
        targetText = isYearMonthDateboxConfig(dateConfig, column) ? formatYearMonthDataText(targetDate, column) : formatDateIso(targetDate);
      } else {
        sourceText = sourceDate ?
          (isYearMonthDateboxConfig(dateConfig, column) ? formatYearMonthEditorText(sourceDate, dateConfig, column) : formatDateboxEditorText(sourceDate, dateConfig, column)).toLowerCase() :
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

  function parseValue(value, type) {
    var text;
    var number;
    if (type === 'number') {
      if (editorDefinitions.numberbox && typeof editorDefinitions.numberbox.parse === 'function') {
        return editorDefinitions.numberbox.parse(value, { groupSeparator: ',' });
      }
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

  function stripNumberGroupSeparators(value) {
    if (editorDefinitions.numberbox && typeof editorDefinitions.numberbox.stripFormatting === 'function') {
      return editorDefinitions.numberbox.stripFormatting(value, { groupSeparator: ',' });
    }
    return String(value).replace(/,/g, '');
  }

  function isDigitKey(key) {
    return /^[0-9]$/.test(key);
  }

  function isNumberEditorTextAllowed(editor, text) {
    if (editorDefinitions.numberbox && typeof editorDefinitions.numberbox.isTextAllowed === 'function') {
      return editorDefinitions.numberbox.isTextAllowed(editor, text, { groupSeparator: ',' });
    }
    var start = editor.selectionStart == null ? editor.value.length : editor.selectionStart;
    var end = editor.selectionEnd == null ? start : editor.selectionEnd;
    var next = editor.value.slice(0, start) + text + editor.value.slice(end);
    return stripNumberGroupSeparators(next).trim() === sanitizeNumberEditorText(next);
  }

  function sanitizeNumberEditorText(value) {
    if (editorDefinitions.numberbox && typeof editorDefinitions.numberbox.sanitize === 'function') {
      return editorDefinitions.numberbox.sanitize(value, { groupSeparator: ',' });
    }
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
    if (editorDefinitions.datebox && typeof editorDefinitions.datebox.sanitize === 'function') {
      return editorDefinitions.datebox.sanitize(value, { mask: editorDefinitions.datebox.mask });
    }
    return String(value == null ? '' : value).replace(/[^0-9]/g, '').slice(0, 8);
  }

  function sanitizeYearMonthEditorText(value) {
    if (editorDefinitions.datebox && typeof editorDefinitions.datebox.sanitize === 'function') {
      return editorDefinitions.datebox.sanitize(value, { mask: '9999/99' });
    }
    return String(value == null ? '' : value).replace(/[^0-9]/g, '').slice(0, 6);
  }

  function getNumberCopyText(value) {
    if (editorDefinitions.numberbox && typeof editorDefinitions.numberbox.getCopyText === 'function') {
      return editorDefinitions.numberbox.getCopyText(value, { groupSeparator: ',' });
    }
    return stripNumberGroupSeparators(value == null ? '' : value).trim();
  }

  function formatNumberEditorText(value, useThousandsSeparator, precision) {
    if (editorDefinitions.numberbox && typeof editorDefinitions.numberbox.format === 'function') {
      return editorDefinitions.numberbox.format(value, {
        thousandsSeparator: useThousandsSeparator === true,
        precision: precision
      });
    }
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

  function normalizeColorValue(value) {
    if (editorDefinitions.color && typeof editorDefinitions.color.normalize === 'function') {
      return editorDefinitions.color.normalize(value);
    }
    var text = value == null ? '' : String(value).trim().toLowerCase();
    var hex;
    if (!text) return '';
    if (text.charAt(0) !== '#') text = '#' + text;
    hex = text.slice(1);
    if (!/^(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(hex)) return '';
    if (hex.length === 3 || hex.length === 4) {
      hex = hex.replace(/./g, function(character) { return character + character; });
    }
    return '#' + hex;
  }

  function parseColorValue(value) {
    if (editorDefinitions.color && typeof editorDefinitions.color.parse === 'function') {
      return editorDefinitions.color.parse(value);
    }
    return normalizeColorValue(value) || (value == null ? '' : String(value).trim());
  }

  function isColorValueValid(value) {
    if (editorDefinitions.color && typeof editorDefinitions.color.isValid === 'function') {
      return editorDefinitions.color.isValid(value);
    }
    return Boolean(normalizeColorValue(value));
  }

  function getColorPalette(config) {
    var options = config && config.options ? config.options : {};
    return Array.isArray(options.palette) && options.palette.length ? options.palette : DEFAULT_COLOR_PALETTE;
  }

  function getColorShowAlpha(config) {
    var options = config && config.options ? config.options : {};
    return options.showAlpha !== false;
  }

  function createColorState(value) {
    var color = normalizeColorValue(value) || '#ff0000';
    var hex = color.slice(1);
    var rgb;
    var hsv;
    if (hex.length === 6) {
      hex += 'ff';
    }
    rgb = {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16)
    };
    hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    hsv.a = parseInt(hex.slice(6, 8), 16) / 255;
    return hsv;
  }

  function rgbToHsv(red, green, blue) {
    var r = red / 255;
    var g = green / 255;
    var b = blue / 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var delta = max - min;
    var hue = 0;
    if (delta) {
      if (max === r) {
        hue = ((g - b) / delta) % 6;
      } else if (max === g) {
        hue = (b - r) / delta + 2;
      } else {
        hue = (r - g) / delta + 4;
      }
      hue *= 60;
      if (hue < 0) hue += 360;
    }
    return {
      h: hue,
      s: max === 0 ? 0 : delta / max,
      v: max
    };
  }

  function hsvToRgb(hue, saturation, value) {
    var chroma = value * saturation;
    var section = hue / 60;
    var x = chroma * (1 - Math.abs(section % 2 - 1));
    var m = value - chroma;
    var r = 0;
    var g = 0;
    var b = 0;
    if (section < 1) {
      r = chroma;
      g = x;
    } else if (section < 2) {
      r = x;
      g = chroma;
    } else if (section < 3) {
      g = chroma;
      b = x;
    } else if (section < 4) {
      g = x;
      b = chroma;
    } else if (section < 5) {
      r = x;
      b = chroma;
    } else {
      r = chroma;
      b = x;
    }
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }

  function colorStateToHex(state, showAlpha) {
    var rgb = hsvToRgb(state.h, state.s, state.v);
    var alpha = clamp(state.a == null ? 1 : state.a, 0, 1);
    var value = '#' + toHexColorPart(rgb.r) + toHexColorPart(rgb.g) + toHexColorPart(rgb.b);
    if (showAlpha && alpha < 0.999) {
      value += toHexColorPart(Math.round(alpha * 255));
    }
    return value;
  }

  function toHexColorPart(value) {
    var text = clamp(Math.round(value), 0, 255).toString(16);
    return text.length < 2 ? '0' + text : text;
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

  installFabGridView(FabGrid, {
    CellType: CellType,
    DEFAULT_OPTIONS: DEFAULT_OPTIONS,
    clamp: clamp,
    closest: closest,
    escapeHtml: escapeHtml,
    findColumnByOffset: findColumnByOffset,
    formatMaskText: formatMaskText,
    formatNumberDisplayText: formatNumberDisplayText,
    getByBinding: getByBinding,
    getColumnEditorConfig: getColumnEditorConfig,
    getColumnSearchIconConfigs: getColumnSearchIconConfigs,
    getColumnSearchKey: getColumnSearchKey,
    getColumnSearchOperatorSymbol: getColumnSearchOperatorSymbol,
    getComboboxTextByValue: getComboboxTextByValue,
    getEditorMask: getEditorMask,
    getExplicitEditorMask: getExplicitEditorMask,
    getIconConfigWidth: getIconConfigWidth,
    getMaskOptions: getMaskOptions,
    getNumberPrecision: getNumberPrecision,
    hasClass: hasClass,
    hasExcelFilterEntries: hasExcelFilterEntries,
    isDateLikeEditorType: isDateLikeEditorType,
    measureNativeScrollbarGutters: measureNativeScrollbarGutters,
    normalizeClassName: normalizeClassName,
    normalizeColorValue: normalizeColorValue,
    normalizeColumnSearchOperator: normalizeColumnSearchOperator,
    normalizeAlternatingRowStep: normalizeAlternatingRowStep,
    normalizeGridOptions: normalizeGridOptions,
    normalizeJustifyContent: normalizeJustifyContent,
    normalizeNonNegativeInteger: normalizeNonNegativeInteger,
    normalizePositiveNumber: normalizePositiveNumber,
    normalizeTextAlign: normalizeTextAlign,
    shouldUseThousandsSeparator: shouldUseThousandsSeparator,
    toNumber: toNumber,
    trimText: trimText
  });
  installFabGridFilterUi(FabGrid, {
    applyMask: applyMask,
    closest: closest,
    countMaskCharactersBeforeCaret: countMaskCharactersBeforeCaret,
    createColorState: createColorState,
    createDictionary: createDictionary,
    createFilterMenuItemHandler: createFilterMenuItemHandler,
    extractMaskCharacters: extractMaskCharacters,
    formatMaskText: formatMaskText,
    getByBinding: getByBinding,
    getColumnEditorConfig: getColumnEditorConfig,
    getColumnSearchIconConfigs: getColumnSearchIconConfigs,
    getColumnSearchKey: getColumnSearchKey,
    getColumnSearchOperatorDefinitions: getColumnSearchOperatorDefinitions,
    getComboboxTextByValue: getComboboxTextByValue,
    getEditorMask: getEditorMask,
    getExcelFilterValueKey: getExcelFilterValueKey,
    getMaskCaretPosition: getMaskCaretPosition,
    hasClass: hasClass,
    isDateLikeEditorType: isDateLikeEditorType,
    normalizeColorValue: normalizeColorValue,
    sanitizeDateEditorText: sanitizeDateEditorText,
    toNumber: toNumber,
    trimText: trimText
  });
  installFabGridSelection(FabGrid, {
    DEFAULT_OPTIONS: DEFAULT_OPTIONS,
    clamp: clamp,
    closest: closest,
    findRowIndexByItem: findRowIndexByItem,
    getByBinding: getByBinding,
    getColumnEditorConfig: getColumnEditorConfig,
    getExplicitEditorMask: getExplicitEditorMask,
    getMaskCopyText: getMaskCopyText,
    getMaskDataValue: getMaskDataValue,
    getMaskOptions: getMaskOptions,
    getNumberCopyText: getNumberCopyText,
    isHotKey: isHotKey,
    isSafeBinding: isSafeBinding,
    isWeakSetValue: isWeakSetValue,
    parseValue: parseValue,
    setByBinding: setByBinding,
    toNumber: toNumber
  });
  installFabGridEditorRuntime(FabGrid, {
    applyMask: applyMask,
    clamp: clamp,
    closest: closest,
    colorStateToHex: colorStateToHex,
    countMaskCharactersBeforeCaret: countMaskCharactersBeforeCaret,
    createColorState: createColorState,
    editorDefinitions: editorDefinitions,
    escapeHtml: escapeHtml,
    extractMaskCharacters: extractMaskCharacters,
    formatDateIso: formatDateIso,
    formatDateboxEditorText: formatDateboxEditorText,
    formatLocaleText: formatLocaleText,
    formatMaskText: formatMaskText,
    formatNumberEditorText: formatNumberEditorText,
    formatYearMonthDataText: formatYearMonthDataText,
    formatYearMonthEditorText: formatYearMonthEditorText,
    getByBinding: getByBinding,
    getColorPalette: getColorPalette,
    getColorShowAlpha: getColorShowAlpha,
    getColumnEditorConfig: getColumnEditorConfig,
    getComboboxData: getComboboxData,
    getComboboxDataValue: getComboboxDataValue,
    getComboboxItemText: getComboboxItemText,
    getComboboxItemValue: getComboboxItemValue,
    getComboboxTextByValue: getComboboxTextByValue,
    getDateboxDataValue: getDateboxDataValue,
    getEditorIconConfigWidth: getEditorIconConfigWidth,
    getEditorIconConfigs: getEditorIconConfigs,
    getEditorMask: getEditorMask,
    getExplicitEditorMask: getExplicitEditorMask,
    getMaskCaretPosition: getMaskCaretPosition,
    getMaskCopyText: getMaskCopyText,
    getMaskDataValue: getMaskDataValue,
    getMaskOptions: getMaskOptions,
    getNumberCopyText: getNumberCopyText,
    getNumberPrecision: getNumberPrecision,
    getValidationRowId: getValidationRowId,
    hasClass: hasClass,
    hsvToRgb: hsvToRgb,
    isColorValueValid: isColorValueValid,
    isComboboxValueInList: isComboboxValueInList,
    isDateLikeEditorType: isDateLikeEditorType,
    isDigitKey: isDigitKey,
    isNumberEditorTextAllowed: isNumberEditorTextAllowed,
    isPromiseLike: isPromiseLike,
    isSafeBinding: isSafeBinding,
    isYearMonthDateboxConfig: isYearMonthDateboxConfig,
    isYearMonthDateboxTarget: isYearMonthDateboxTarget,
    mergeOptions: mergeOptions,
    normalizeClassName: normalizeClassName,
    normalizeColorValue: normalizeColorValue,
    normalizeTextAlign: normalizeTextAlign,
    normalizeValidationResult: normalizeValidationResult,
    parseColorValue: parseColorValue,
    parseDateValue: parseDateValue,
    parseDateboxEditorValue: parseDateboxEditorValue,
    parseValue: parseValue,
    parseYearMonthValue: parseYearMonthValue,
    renderComboboxOptionContent: renderComboboxOptionContent,
    roundNumberValue: roundNumberValue,
    sanitizeDateEditorText: sanitizeDateEditorText,
    sanitizeNumberEditorText: sanitizeNumberEditorText,
    setByBinding: setByBinding,
    shouldUseThousandsSeparator: shouldUseThousandsSeparator,
    toNumber: toNumber,
    trimText: trimText
  });
  defineWijmoCompatibility(FabGrid);
  FabGrid.SelectionMode = SELECTION_MODE;
  FabGrid.CellType = CellType;
  FabGrid.Row = Row;
  FabGrid.GroupRow = GroupRow;
  installFabGridData(FabGrid, {
    DEFAULT_OPTIONS: DEFAULT_OPTIONS,
    formatNumberDisplayText: formatNumberDisplayText,
    getColumnSearchKey: getColumnSearchKey,
    mergeOptions: mergeOptions,
    normalizeColumnSearchOperator: normalizeColumnSearchOperator,
    rowMatchesExcelFilters: rowMatchesExcelFilters,
    rowMatchesColumnSearch: rowMatchesColumnSearch,
    rowMatchesSearch: rowMatchesSearch
  });
  installFabGridTree(FabGrid, {
    closest: closest,
    getByBinding: getByBinding,
    setByBinding: setByBinding,
    toNumber: toNumber
  });
  installFabGridDrag(FabGrid, {
    bind: bind,
    closest: closest,
    getByBinding: getByBinding,
    toNumber: toNumber
  });
  installFabGridExport(FabGrid, {
    getByBinding: getByBinding,
    getNumberPrecision: getNumberPrecision,
    parseValue: parseValue,
    shouldUseThousandsSeparator: shouldUseThousandsSeparator,
    toNumber: toNumber
  });

  FabGrid.locales = getLocaleMap();
  FabGrid.editorDefinitions = editorDefinitions;
  FabGrid.defaultLocale = getDefaultLocaleName();
  FabGrid.addLocale = function(name, messages) {
    if (name && messages) {
      FabGrid.locales[String(name)] = messages;
    }
    return FabGrid;
  };

  return FabGrid;
}
