import {
  createPivotPathKey,
  pivotValuesEqual
} from './pivot-utils.js?v=20260717-pivot-typed-values-v1';

export function createPivotGridFactory(FabGrid, PivotEngine) {
  var baseApplyLocaleToDom = FabGrid.prototype.applyLocaleToDom;
  var baseCreateBodyCell = FabGrid.prototype.createBodyCell;
  var baseCreateDom = FabGrid.prototype.createDom;
  var baseDispose = FabGrid.prototype.dispose;
  var baseGetHeaderHeight = FabGrid.prototype.getHeaderHeight;
  var baseHandleClick = FabGrid.prototype.handleClick;
  var baseHandleContextMenu = FabGrid.prototype.handleContextMenu;
  var baseHandleDblClick = FabGrid.prototype.handleDblClick;
  var baseHandleKeyDown = FabGrid.prototype.handleKeyDown;
  var baseHandlePointerDown = FabGrid.prototype.handlePointerDown;
  var baseRenderHeaders = FabGrid.prototype.renderHeaders;
  var baseSetItemsSource = FabGrid.prototype.setItemsSource;
  var baseSetLocale = FabGrid.prototype.setLocale;

  function assign(target, source) {
    var key;
    for (key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
    return target;
  }

  function closestByClass(target, className, boundary) {
    var node = target && target.nodeType === 1 ? target : target ? target.parentElement : null;
    while (node) {
      if (node.classList && node.classList.contains(className)) {
        return node;
      }
      if (node === boundary) {
        break;
      }
      node = node.parentElement;
    }
    return null;
  }

  function getPivotFieldSortDirection(field) {
    var value = field ? field.sortDirection : 0;
    var text;
    if (value === 1 || value === -1) {
      return value;
    }
    text = String(value == null ? '' : value).toLowerCase();
    if (text === 'asc' || text === 'ascending') {
      return 1;
    }
    if (text === 'desc' || text === 'descending') {
      return -1;
    }
    return 0;
  }

  function getPivotSortMenuKey(field) {
    var direction = getPivotFieldSortDirection(field);
    return direction === 0 ? 'pivot.sortAscending' :
      direction === 1 ? 'pivot.sortDescending' : 'pivot.clearSort';
  }

  function getRowGroupMenuState(entriesByKey, collapsed) {
    var hasGroups = false;
    var hasExpanded = false;
    var key;
    entriesByKey = entriesByKey || {};
    collapsed = collapsed || {};
    for (key in entriesByKey) {
      if (entriesByKey[key].isSubtotal) {
        hasGroups = true;
        if (!collapsed[key]) {
          hasExpanded = true;
          break;
        }
      }
    }
    return {
      hasGroups: hasGroups,
      hasExpanded: hasExpanded
    };
  }

  function isHiddenByCollapsedEntry(entry, collapsed) {
    var key;
    var length;
    if (!entry || !entry.path) {
      return false;
    }
    for (length = 1; length < entry.path.length; length += 1) {
      key = createPivotPathKey(entry.path.slice(0, length));
      if (collapsed[key]) {
        return true;
      }
    }
    return false;
  }

  function getNumberDigits(format, fallback) {
    var match = String(format || '').match(/^[ncp](\d+)$/i);
    return match ? Math.max(0, Number(match[1])) : fallback;
  }

  function formatPivotValue(value, field, locale) {
    var format = String(field && field.format || '');
    var type = format.charAt(0).toLowerCase();
    var digits;
    var options;
    if (value == null || value === '') {
      return '';
    }
    if (typeof value !== 'number') {
      return String(value);
    }
    if (type === 'p') {
      digits = getNumberDigits(format, 0);
      return new Intl.NumberFormat(locale || undefined, {
        style: 'percent',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      }).format(value);
    }
    digits = getNumberDigits(format, type === 'c' ? 2 : 0);
    options = {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    };
    if (type === 'c') {
      options.style = 'currency';
      options.currency = field.currency || 'USD';
    }
    return new Intl.NumberFormat(locale || undefined, options).format(value);
  }

  function createMenuItem(action, label, iconClass, active, disabled) {
    var item = document.createElement('button');
    var icon = document.createElement('span');
    var text = document.createElement('span');
    item.type = 'button';
    item.className = 'fg-top-left-menu-item' + (active ? ' fg-top-left-menu-item-active' : '');
    item.setAttribute('role', 'menuitem');
    item.setAttribute('data-action', action);
    item.disabled = disabled === true;
    if (disabled === true) {
      item.setAttribute('aria-disabled', 'true');
    }
    icon.className = 'fg-top-left-menu-icon' + (iconClass ? ' ' + iconClass : '');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = active ? '✓' : '';
    text.className = 'fg-top-left-menu-label';
    text.textContent = label;
    item.appendChild(icon);
    item.appendChild(text);
    return item;
  }

  function PivotGrid(element, options) {
    var sourceOptions = options || {};
    var engine = sourceOptions.engine || sourceOptions.itemsSource || null;
    var baseOptions = assign({}, sourceOptions);
    this._pivotConstructing = true;
    this._pivotEngine = null;
    this._pivotView = null;
    this._pivotDataHeaderLevelCount = 1;
    this._pivotHeaderLevelCount = 1;
    this._pivotHeaderRowHeight = Math.max(24, Number(sourceOptions.pivotHeaderHeight || sourceOptions.headerHeight) || 32);
    this._pivotRowCollapsed = Object.create(null);
    this._pivotColumnCollapsed = Object.create(null);
    this._pivotRowEntriesByKey = Object.create(null);
    this._pivotColumnEntriesByKey = Object.create(null);
    this._pivotRowGroups = [];
    this._pivotContext = null;
    this._pivotDetailGrid = null;
    this._pivotUpdatedHandler = this._handlePivotUpdated.bind(this);
    baseOptions.itemsSource = [];
    baseOptions.columns = [];
    baseOptions.allowEditing = false;
    baseOptions.editOnSelect = false;
    baseOptions.allowFiltering = false;
    baseOptions.filterMode = false;
    baseOptions.showColumnChooser = false;
    baseOptions.showRowHeaders = false;
    baseOptions.allowSorting = false;
    baseOptions.allowDragging = 'None';
    baseOptions.allowPinning = false;
    baseOptions.pagination = false;
    baseOptions.frozenColumns = 0;
    baseOptions.copyHeaders = sourceOptions.copyHeaders || 'All';
    baseOptions.selectionMode = sourceOptions.selectionMode || 'CellRange';
    FabGrid.call(this, element, baseOptions);
    this._pivotConstructing = false;
    if (engine) {
      this.setPivotEngine(engine);
    }
  }

  PivotGrid.prototype = Object.create(FabGrid.prototype);
  PivotGrid.prototype.constructor = PivotGrid;

  PivotGrid.prototype.createDom = function() {
    var overlay;
    var dialog;
    var header;
    var title;
    var close;
    var body;
    baseCreateDom.call(this);
    this.root.classList.add('fg-pivot-grid');
    overlay = document.createElement('div');
    dialog = document.createElement('div');
    header = document.createElement('div');
    title = document.createElement('strong');
    close = document.createElement('button');
    body = document.createElement('div');
    overlay.className = 'fg-pivot-detail-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    dialog.className = 'fg-pivot-detail-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    header.className = 'fg-pivot-detail-header';
    title.className = 'fg-pivot-detail-title';
    close.className = 'fg-pivot-detail-close';
    close.type = 'button';
    close.textContent = '×';
    body.className = 'fg-pivot-detail-body';
    header.appendChild(title);
    header.appendChild(close);
    dialog.appendChild(header);
    dialog.appendChild(body);
    overlay.appendChild(dialog);
    this.root.appendChild(overlay);
    this.pivotDetailOverlay = overlay;
    this.pivotDetailDialog = dialog;
    this.pivotDetailTitle = title;
    this.pivotDetailClose = close;
    this.pivotDetailBody = body;
    this.addEventListener(this.headerFrozen, 'change', this._handlePivotFilterFieldChange.bind(this));
    this.applyLocaleToDom();
  };

  PivotGrid.prototype.applyLocaleToDom = function() {
    baseApplyLocaleToDom.call(this);
    if (this.pivotDetailDialog) {
      this.pivotDetailDialog.setAttribute('aria-label', this.getText('pivot.detailTitle'));
    }
    if (this.pivotDetailClose) {
      this.pivotDetailClose.setAttribute('aria-label', this.getText('pivot.closeDetail'));
      this.pivotDetailClose.title = this.getText('pivot.closeDetail');
    }
  };

  PivotGrid.prototype.setItemsSource = function(value, silent) {
    if (this._pivotConstructing) {
      return baseSetItemsSource.call(this, value, silent);
    }
    return this.setPivotEngine(value, silent);
  };

  PivotGrid.prototype.setLocale = function(locale, messages, silent) {
    if (!this._pivotConstructing && this._pivotEngine) {
      this._applyPivotView(true);
    }
    baseSetLocale.call(this, locale, messages, silent);
    return this;
  };

  PivotGrid.prototype.setPivotEngine = function(engine, silent) {
    if (!(engine instanceof PivotEngine)) {
      throw new TypeError('PivotGrid itemsSource must be a fabui.pivot.PivotEngine instance.');
    }
    if (this._pivotEngine === engine) {
      return this;
    }
    if (this._pivotEngine && this._pivotEngine.updatedView) {
      this._pivotEngine.updatedView.removeHandler(this._pivotUpdatedHandler, this);
    }
    this._pivotEngine = engine;
    engine.updatedView.addHandler(this._pivotUpdatedHandler, this);
    this._applyPivotView(silent === true);
    return this;
  };

  PivotGrid.prototype._handlePivotUpdated = function() {
    this._applyPivotView(false);
  };

  PivotGrid.prototype._applyPivotView = function(silent) {
    var view = this._pivotEngine ? this._pivotEngine.pivotView : null;
    var selectionState = this._capturePivotSelectionState();
    var selectionChanged;
    var rowEntries;
    var columnEntries;
    var visibleRows = [];
    var columns = [];
    var i;
    this._pivotView = view;
    this._pivotRowEntriesByKey = Object.create(null);
    this._pivotColumnEntriesByKey = Object.create(null);
    this._pivotRowGroups = [];
    if (!view) {
      baseSetItemsSource.call(this, [], true);
      FabGrid.prototype.setColumns.call(this, [], true);
      if (!silent) this.refresh();
      return;
    }
    rowEntries = view.rowEntries;
    columnEntries = view.columnEntries;
    for (i = 0; i < rowEntries.length; i += 1) {
      this._pivotRowEntriesByKey[rowEntries[i].key] = rowEntries[i];
    }
    for (i = 0; i < rowEntries.length; i += 1) {
      if (!isHiddenByCollapsedEntry(rowEntries[i], this._pivotRowCollapsed)) {
        visibleRows.push(view.rows[i]);
      }
    }
    for (i = 0; i < columnEntries.length; i += 1) {
      this._pivotColumnEntriesByKey[columnEntries[i].key] = columnEntries[i];
    }
    columns = this._createPivotColumns(view);
    this._pivotRowGroups = this._buildPivotRowGroups(visibleRows, view.rowFields.length);
    this._pivotDataHeaderLevelCount = this._getPivotDataHeaderLevelCount();
    this._pivotHeaderLevelCount = this._getPivotHeaderLevelCount();
    this.options.frozenColumns = view.rowFields.length;
    FabGrid.prototype.setColumns.call(this, columns, true);
    baseSetItemsSource.call(this, visibleRows, true);
    selectionChanged = this._restorePivotSelectionState(selectionState);
    this.syncHeaderLayout();
    if (!silent) {
      this.refresh();
      if (selectionChanged) {
        this.emit('selectionChanged', this.getSelectionEventArgs(
          this.selection.row,
          this.selection.col,
          this.selectionAnchor.row,
          this.selectionAnchor.col
        ));
      }
    }
  };

  PivotGrid.prototype._capturePivotSelectionState = function() {
    var anchor = this.selectionAnchor || this.selection;
    return {
      activeRowKey: this._getPivotSelectionRowKey(this.selection.row),
      activeColumnKey: this._getPivotSelectionColumnKey(this.selection.col),
      anchorRowKey: this._getPivotSelectionRowKey(anchor.row),
      anchorColumnKey: this._getPivotSelectionColumnKey(anchor.col),
      activeRow: this.selection.row,
      activeCol: this.selection.col,
      anchorRow: anchor.row,
      anchorCol: anchor.col
    };
  };

  PivotGrid.prototype._getPivotSelectionRowKey = function(rowIndex) {
    var row = this.view && this.view[rowIndex];
    return row && row.__pivotMeta ? row.__pivotMeta.key : null;
  };

  PivotGrid.prototype._getPivotSelectionColumnKey = function(columnIndex) {
    var column = this.visibleColumns && this.visibleColumns[columnIndex];
    var dataColumn = column && column._pivotDataColumn;
    if (!column) {
      return null;
    }
    return dataColumn ?
      'value:' + dataColumn.entry.key + ':' + dataColumn.valueField.key :
      'row:' + column.binding;
  };

  PivotGrid.prototype._findPivotSelectionRow = function(key, fallback) {
    var entry;
    var i;
    if (key != null) {
      for (i = 0; i < this.view.length; i += 1) {
        entry = this.view[i] && this.view[i].__pivotMeta;
        if (entry && entry.key === key) {
          return i;
        }
      }
    }
    return fallback;
  };

  PivotGrid.prototype._findPivotSelectionColumn = function(key, fallback) {
    var i;
    if (key != null) {
      for (i = 0; i < this.visibleColumns.length; i += 1) {
        if (this._getPivotSelectionColumnKey(i) === key) {
          return i;
        }
      }
    }
    return fallback;
  };

  PivotGrid.prototype._restorePivotSelectionState = function(state) {
    var previous = {
      row: this.selection.row,
      col: this.selection.col,
      anchorRow: (this.selectionAnchor || this.selection).row,
      anchorCol: (this.selectionAnchor || this.selection).col
    };
    if (state) {
      this.selection = {
        row: this._findPivotSelectionRow(state.activeRowKey, state.activeRow),
        col: this._findPivotSelectionColumn(state.activeColumnKey, state.activeCol)
      };
      this.selectionAnchor = {
        row: this._findPivotSelectionRow(state.anchorRowKey, state.anchorRow),
        col: this._findPivotSelectionColumn(state.anchorColumnKey, state.anchorCol)
      };
    }
    this.clampSelection();
    this.rowSelection = this.view.length ? this.selection.row : null;
    return previous.row !== this.selection.row ||
      previous.col !== this.selection.col ||
      previous.anchorRow !== this.selectionAnchor.row ||
      previous.anchorCol !== this.selectionAnchor.col;
  };

  PivotGrid.prototype._createPivotColumns = function(view) {
    var columns = [];
    var self = this;
    var field;
    var dataColumn;
    var i;
    for (i = 0; i < view.rowFields.length; i += 1) {
      field = view.rowFields[i];
      columns.push({
        binding: '__pivot_row_' + i,
        header: this.options.showRowFieldHeaders === false ? '' : field.header,
        width: field.width,
        minWidth: 72,
        align: field.align || 'left',
        dataType: field.dataType,
        readOnly: true,
        isReadOnly: true,
        _pivotRowField: field,
        _pivotRowFieldIndex: i,
        formatter: createRowFieldFormatter(this, field, i)
      });
    }
    for (i = 0; i < view.dataColumns.length; i += 1) {
      dataColumn = view.dataColumns[i];
      field = dataColumn.valueField;
      columns.push({
        binding: dataColumn.binding,
        header: field.header,
        width: field.width,
        minWidth: 72,
        align: field.align || 'right',
        dataType: field.dataType || 'number',
        format: field.format,
        visible: !isHiddenByCollapsedEntry(dataColumn.entry, this._pivotColumnCollapsed),
        readOnly: true,
        isReadOnly: true,
        _pivotDataColumn: dataColumn,
        formatter: function(value, item, column) {
          return formatPivotValue(value, column._pivotDataColumn.valueField, self.locale);
        }
      });
    }
    return columns;
  };

  PivotGrid.prototype._getExcelExportRows = function() {
    return this._pivotView && Array.isArray(this._pivotView.rows) ? this._pivotView.rows : (this.view || []);
  };

  PivotGrid.prototype._isExcelExportRowHidden = function(row) {
    var entry = row && row.__pivotMeta;
    return Boolean(entry && isHiddenByCollapsedEntry(entry, this._pivotRowCollapsed));
  };

  function createRowFieldFormatter(grid, field, fieldIndex) {
    return function(value, item) {
      var entry = item && item.__pivotMeta;
      if (!entry) {
        return value == null ? '' : String(value);
      }
      if (entry.isGrandTotal) {
        return fieldIndex === 0 ? grid.getText('pivot.grandTotal') : '';
      }
      if (entry.isSubtotal && fieldIndex === entry.path.length) {
        return grid.getText('pivot.total');
      }
      return fieldIndex < entry.path.length ? grid._pivotEngine.formatFieldValue(field, value, grid.locale) : '';
    };
  }

  PivotGrid.prototype._buildPivotRowGroups = function(rows, fieldCount) {
    var groups = [];
    var rowGroups;
    var current;
    var entry;
    var key;
    var fieldIndex;
    var rowIndex;
    rows = rows || [];
    for (fieldIndex = 0; fieldIndex < fieldCount; fieldIndex += 1) {
      rowGroups = [];
      current = null;
      for (rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
        entry = rows[rowIndex] && rows[rowIndex].__pivotMeta;
        if (!entry || entry.isGrandTotal || entry.path.length <= fieldIndex) {
          current = null;
          continue;
        }
        key = createPivotPathKey(entry.path.slice(0, fieldIndex + 1));
        if (!current || current.key !== key) {
          current = {
            key: key,
            fieldIndex: fieldIndex,
            start: rowIndex,
            end: rowIndex,
            toggleKey: null
          };
        } else {
          current.end = rowIndex;
        }
        if (entry.isSubtotal && entry.path.length === fieldIndex + 1) {
          current.toggleKey = entry.key;
        }
        rowGroups[rowIndex] = current;
      }
      groups[fieldIndex] = rowGroups;
    }
    return groups;
  };

  PivotGrid.prototype._getPivotDataHeaderLevelCount = function() {
    var columnFieldCount = this._pivotView ? this._pivotView.columnFields.length : 0;
    var valueFieldCount = this._pivotView ? this._pivotView.valueFields.length : 0;
    return Math.max(1, columnFieldCount + (valueFieldCount > 1 || columnFieldCount === 0 ? 1 : 0));
  };

  PivotGrid.prototype._getPivotHeaderLevelCount = function() {
    var filterFieldCount = this._pivotView ? this._pivotView.filterFields.length : 0;
    return Math.max(this._pivotDataHeaderLevelCount || 1, filterFieldCount + (filterFieldCount ? 1 : 0));
  };

  PivotGrid.prototype.getHeaderHeight = function() {
    if (!this._pivotView) {
      return baseGetHeaderHeight.call(this);
    }
    return this._pivotHeaderLevelCount * this._pivotHeaderRowHeight;
  };

  PivotGrid.prototype.getHeaderTitleHeight = function() {
    return this.getHeaderHeight();
  };

  PivotGrid.prototype.renderHeaders = function(colRange) {
    var frozenFragment;
    var scrollFragment;
    var dataColumns;
    var groups;
    var column;
    var cell;
    var i;
    var level;
    var dataLevelOffset;
    var hasFilterFields;
    var rowFieldTop;
    if (!this._pivotView) {
      baseRenderHeaders.call(this, colRange);
      return;
    }
    this.headerFrozen.innerHTML = '';
    this.headerFrozenRight.innerHTML = '';
    this.headerCanvas.innerHTML = '';
    frozenFragment = document.createDocumentFragment();
    scrollFragment = document.createDocumentFragment();
    hasFilterFields = this._pivotView.filterFields.length > 0;
    rowFieldTop = hasFilterFields ? (this._pivotHeaderLevelCount - 1) * this._pivotHeaderRowHeight : 0;
    if (hasFilterFields && this.frozenWidth > 0) {
      for (level = 0; level < this._pivotView.filterFields.length; level += 1) {
        frozenFragment.appendChild(this._createPivotFilterFieldHeader(
          this._pivotView.filterFields[level],
          level
        ));
      }
    }
    for (i = 0; i < this.frozenColumns; i += 1) {
      column = this.visibleColumns[i];
      cell = this._createPivotHeaderCell({
        label: column.header,
        left: column._left,
        top: rowFieldTop,
        width: column._width,
        height: hasFilterFields ? this._pivotHeaderRowHeight : this.getHeaderHeight(),
        col: i,
        className: 'fg-pivot-row-field-header',
        field: column._pivotRowField,
        sortable: Boolean(column._pivotRowField),
        sortDirection: getPivotFieldSortDirection(column._pivotRowField)
      });
      frozenFragment.appendChild(cell);
    }
    dataColumns = this.visibleColumns.slice(this.frozenColumns, this.scrollableColumnEnd);
    dataLevelOffset = this._pivotHeaderLevelCount - this._pivotDataHeaderLevelCount;
    for (level = 0; level < this._pivotDataHeaderLevelCount; level += 1) {
      groups = this._createPivotHeaderGroups(dataColumns, level, level + dataLevelOffset);
      for (i = 0; i < groups.length; i += 1) {
        if (groups[i].endCol < colRange.start || groups[i].startCol >= colRange.end) {
          continue;
        }
        scrollFragment.appendChild(this._createPivotHeaderCell(groups[i]));
      }
    }
    this.headerFrozen.appendChild(frozenFragment);
    this.headerCanvas.appendChild(scrollFragment);
  };

  PivotGrid.prototype._createPivotFilterFieldHeader = function(field, level) {
    var cell = document.createElement('div');
    var title = document.createElement('span');
    var label = document.createElement('span');
    var select = this._createPivotFilterFieldSelect(field);
    cell.className = 'fg-header-cell fg-pivot-header-cell fg-pivot-filter-field-header';
    cell.style.left = '0px';
    cell.style.top = (level * this._pivotHeaderRowHeight) + 'px';
    cell.style.width = this.frozenWidth + 'px';
    cell.style.height = this._pivotHeaderRowHeight + 'px';
    cell.setAttribute('data-pivot-field', field.key);
    cell.setAttribute('role', 'columnheader');
    cell.title = field.header;
    title.className = 'fg-header-title fg-pivot-header-title';
    title.style.height = this._pivotHeaderRowHeight + 'px';
    label.className = 'fg-header-label fg-pivot-filter-field-label';
    label.textContent = field.header;
    title.appendChild(label);
    title.appendChild(select);
    cell.appendChild(title);
    return cell;
  };

  PivotGrid.prototype._createPivotFilterFieldSelect = function(field) {
    var select = document.createElement('select');
    var all = document.createElement('option');
    var source = this._pivotEngine ? this._pivotEngine.itemsSource : [];
    var filterValues = field.filter && Array.isArray(field.filter.values) ? field.filter.values : null;
    var hasSingleFilter = !!(filterValues && filterValues.length === 1);
    var current = hasSingleFilter ? filterValues[0] : undefined;
    var values = [];
    var value;
    var option;
    var filtered;
    var exists;
    var i;
    var j;
    select.className = 'fg-pivot-filter-field-select';
    select.setAttribute('data-pivot-field', field.key);
    select.setAttribute('aria-label', this.getText('pivot.panel.filterField', { field: field.header }));
    all.value = '';
    all.textContent = this.getText('pivot.panel.allValues');
    all._pivotAllValues = true;
    all.selected = !field.filter;
    select.appendChild(all);
    if (field.filter && !hasSingleFilter) {
      filtered = document.createElement('option');
      filtered.value = '__pivot_filtered__';
      filtered.textContent = this.getText('pivot.filteredValues');
      filtered._pivotKeepFilter = true;
      filtered.selected = true;
      select.appendChild(filtered);
    }
    for (i = 0; i < source.length && values.length < 200; i += 1) {
      value = field.getItemValue(source[i]);
      exists = false;
      for (j = 0; j < values.length; j += 1) {
        if (pivotValuesEqual(values[j], value, field.dataType)) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        values.push(value);
      }
    }
    values.sort(function(left, right) {
      return String(left == null ? '' : left).localeCompare(String(right == null ? '' : right), undefined, { numeric: true });
    });
    for (i = 0; i < values.length; i += 1) {
      option = document.createElement('option');
      option.value = String(i + 1);
      option.textContent = this._pivotEngine.formatFieldValue(field, values[i], this.locale) || this.getText('filter.blankValue');
      option._pivotFilterValue = values[i];
      option.selected = hasSingleFilter && pivotValuesEqual(current, values[i], field.dataType);
      select.appendChild(option);
    }
    return select;
  };

  PivotGrid.prototype._handlePivotFilterFieldChange = function(event) {
    var select = event.target;
    var selected;
    var field;
    if (!select || !select.classList || !select.classList.contains('fg-pivot-filter-field-select') || !this._pivotEngine) {
      return;
    }
    selected = select.selectedOptions && select.selectedOptions[0];
    field = this._pivotEngine.getField(select.getAttribute('data-pivot-field'));
    if (!field || this._pivotEngine.filterFields.indexOf(field) < 0 || !selected || selected._pivotKeepFilter) {
      return;
    }
    field.filter = selected._pivotAllValues ? null : { values: [selected._pivotFilterValue] };
    this._pivotEngine.emit('viewDefinitionChanged', { property: 'filter', field: field });
    this._pivotEngine.refresh();
  };

  PivotGrid.prototype._createPivotHeaderGroups = function(columns, level, topLevel) {
    var groups = [];
    var current = null;
    var descriptor;
    var column;
    var i;
    for (i = 0; i < columns.length; i += 1) {
      column = columns[i];
      descriptor = this._getPivotHeaderDescriptor(column, level);
      if (!current || current.key !== descriptor.key) {
        current = {
          key: descriptor.key,
          label: descriptor.label,
          left: column._left - this.frozenWidth,
          top: (topLevel == null ? level : topLevel) * this._pivotHeaderRowHeight,
          width: column._width,
          height: this._pivotHeaderRowHeight,
          col: column._viewIndex,
          startCol: column._viewIndex,
          endCol: column._viewIndex,
          className: 'fg-pivot-column-header',
          entry: descriptor.entry,
          field: descriptor.field,
          toggle: descriptor.toggle
        };
        groups.push(current);
      } else {
        current.width += column._width;
        current.endCol = column._viewIndex;
      }
    }
    return groups;
  };

  PivotGrid.prototype._getPivotHeaderDescriptor = function(column, level) {
    var dataColumn = column._pivotDataColumn;
    var entry = dataColumn.entry;
    var columnFields = this._pivotView.columnFields;
    var hasValueLevel = this._pivotView.valueFields.length > 1 || columnFields.length === 0;
    var field = level < columnFields.length ? columnFields[level] : dataColumn.valueField;
    var label = '';
    var key;
    var toggle = false;
    if (level < columnFields.length) {
      if (entry.isGrandTotal) {
        label = level === 0 ? this.getText('pivot.grandTotal') : '';
      } else if (level < entry.path.length) {
        label = this._pivotEngine.formatFieldValue(field, entry.path[level], this.locale);
      } else if (entry.isSubtotal && level === entry.path.length) {
        label = this.getText('pivot.total');
        toggle = this.options.collapsibleSubtotals !== false;
      }
      key = 'axis:' + level + ':' + JSON.stringify(entry.path.slice(0, Math.min(level + 1, entry.path.length))) +
        ':' + (entry.isSubtotal ? 'subtotal' : entry.isGrandTotal ? 'grand' : 'leaf') + ':' + label;
    } else if (hasValueLevel) {
      label = dataColumn.valueField.header;
      key = 'value:' + dataColumn.binding;
    } else {
      label = dataColumn.valueField.header;
      key = 'value:' + dataColumn.binding;
    }
    return {
      key: key,
      label: label,
      entry: entry,
      field: field,
      toggle: toggle
    };
  };

  PivotGrid.prototype._createPivotHeaderCell = function(options) {
    var cell = document.createElement('div');
    var title = document.createElement('span');
    var label = document.createElement('span');
    var sortWrap;
    var sortOrder;
    var sort;
    var toggle;
    var resize;
    cell.className = 'fg-header-cell fg-pivot-header-cell ' + (options.className || '');
    cell.style.left = options.left + 'px';
    cell.style.top = options.top + 'px';
    cell.style.width = options.width + 'px';
    cell.style.height = options.height + 'px';
    cell.setAttribute('data-col', options.col);
    cell.setAttribute('role', 'columnheader');
    if (options.field) {
      cell.setAttribute('data-pivot-field', options.field.key);
      cell.title = options.field.header;
    }
    title.className = 'fg-header-title fg-pivot-header-title';
    title.style.height = options.height + 'px';
    label.className = 'fg-header-label';
    label.textContent = options.label || '';
    if (options.toggle && options.entry) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'fg-pivot-toggle fg-pivot-column-toggle';
      toggle.setAttribute('data-pivot-key', options.entry.key);
      toggle.setAttribute('aria-expanded', this._pivotColumnCollapsed[options.entry.key] ? 'false' : 'true');
      toggle.setAttribute('aria-label', this.getText(
        this._pivotColumnCollapsed[options.entry.key] ? 'pivot.expandGroup' : 'pivot.collapseGroup'
      ));
      toggle.textContent = this._pivotColumnCollapsed[options.entry.key] ? '+' : '−';
      title.appendChild(toggle);
    }
    title.appendChild(label);
    if (options.sortable) {
      sortWrap = document.createElement('span');
      sortOrder = document.createElement('span');
      sort = document.createElement('span');
      sortWrap.className = 'fg-sort-wrap' + (options.sortDirection ? '' : ' fg-sort-wrap-none');
      sortOrder.className = 'fg-sort-order';
      sort.className = 'fg-sort' + (options.sortDirection === 1 ? ' fg-sort-asc' :
        options.sortDirection === -1 ? ' fg-sort-desc' : ' fg-sort-none');
      sort.setAttribute('aria-hidden', 'true');
      sortWrap.appendChild(sortOrder);
      sortWrap.appendChild(sort);
      title.appendChild(sortWrap);
    }
    cell.appendChild(title);
    if (this.options.allowResizing !== false && options.startCol === options.endCol) {
      resize = document.createElement('span');
      resize.className = 'fg-resize';
      resize.setAttribute('data-resize-col', options.col);
      cell.appendChild(resize);
    }
    if (typeof this.createFormatItemEventArgs === 'function') {
      this.raiseFormatItem(this.createFormatItemEventArgs(this.columnHeaders, cell,
        Math.floor(options.top / this._pivotHeaderRowHeight), options.col, {
          column: this.visibleColumns[options.col] || null,
          value: options.label
        }));
    }
    return cell;
  };

  PivotGrid.prototype.createBodyCell = function(rowIndex, colIndex, pane, selectionRange) {
    var cell = baseCreateBodyCell.call(this, rowIndex, colIndex, pane, selectionRange);
    var item = this.view[rowIndex];
    var entry = item && item.__pivotMeta;
    var column = this.visibleColumns[colIndex];
    var group;
    var renderStart;
    var renderEnd;
    var label;
    var toggle;
    if (!cell || !entry || !column) {
      return cell;
    }
    if (column._pivotRowField) {
      cell.classList.add('fg-pivot-row-field-cell');
      group = this._pivotRowGroups[column._pivotRowFieldIndex] &&
        this._pivotRowGroups[column._pivotRowFieldIndex][rowIndex];
      if (group && (group.end > group.start || group.toggleKey)) {
        renderStart = Math.max(group.start, this.rowRange ? this.rowRange.start : group.start);
        renderEnd = Math.min(group.end, this.rowRange ? this.rowRange.end - 1 : group.end);
        if (rowIndex !== renderStart) {
          cell.classList.add('fg-pivot-row-merged-covered');
          cell.style.visibility = 'hidden';
        } else {
          cell.classList.add('fg-pivot-row-merged-cell');
          cell.style.height = ((renderEnd - renderStart + 1) * this.options.rowHeight) + 'px';
          cell.style.zIndex = '2';
          cell.setAttribute('aria-rowspan', group.end - group.start + 1);
          label = document.createElement('span');
          label.className = 'fg-pivot-row-merged-label';
          while (cell.firstChild) {
            label.appendChild(cell.firstChild);
          }
          if (group.toggleKey && this.options.collapsibleSubtotals !== false) {
            toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'fg-pivot-toggle fg-pivot-row-toggle';
            toggle.setAttribute('data-pivot-key', group.toggleKey);
            toggle.setAttribute('aria-expanded', this._pivotRowCollapsed[group.toggleKey] ? 'false' : 'true');
            toggle.setAttribute('aria-label', this.getText(
              this._pivotRowCollapsed[group.toggleKey] ? 'pivot.expandGroup' : 'pivot.collapseGroup'
            ));
            toggle.textContent = this._pivotRowCollapsed[group.toggleKey] ? '+' : '−';
            cell.appendChild(toggle);
          }
          cell.appendChild(label);
        }
      }
    }
    if (entry.isSubtotal || entry.isGrandTotal ||
      (column._pivotDataColumn && (column._pivotDataColumn.entry.isSubtotal || column._pivotDataColumn.entry.isGrandTotal))) {
      cell.classList.add('fg-pivot-total-cell');
    }
    return cell;
  };

  PivotGrid.prototype.handlePointerDown = function(event) {
    if (closestByClass(event.target, 'fg-pivot-row-toggle', this.root) ||
        closestByClass(event.target, 'fg-pivot-column-toggle', this.root)) {
      return;
    }
    baseHandlePointerDown.call(this, event);
  };

  PivotGrid.prototype.handleClick = function(event) {
    var detailDialog = closestByClass(event.target, 'fg-pivot-detail-dialog', this.root);
    var rowToggle = closestByClass(event.target, 'fg-pivot-row-toggle', this.root);
    var columnToggle = closestByClass(event.target, 'fg-pivot-column-toggle', this.root);
    var rowHeader = closestByClass(event.target, 'fg-pivot-row-field-header', this.root);
    if (closestByClass(event.target, 'fg-pivot-filter-field-select', this.root)) {
      return;
    }
    if (closestByClass(event.target, 'fg-pivot-detail-close', this.root) || event.target === this.pivotDetailOverlay) {
      event.preventDefault();
      event.stopPropagation();
      this.hideDetail();
      return;
    }
    if (detailDialog) {
      return;
    }
    if (rowToggle) {
      event.preventDefault();
      event.stopPropagation();
      this.toggleRowSubtotal(rowToggle.getAttribute('data-pivot-key'));
      return;
    }
    if (columnToggle) {
      event.preventDefault();
      event.stopPropagation();
      this.toggleColumnSubtotal(columnToggle.getAttribute('data-pivot-key'));
      return;
    }
    if (rowHeader && this._pivotEngine) {
      event.preventDefault();
      event.stopPropagation();
      this.togglePivotFieldSort(rowHeader.getAttribute('data-pivot-field'));
      return;
    }
    baseHandleClick.call(this, event);
  };

  PivotGrid.prototype.handleDblClick = function(event) {
    var dialog = closestByClass(event.target, 'fg-pivot-detail-dialog', this.root);
    var cell = closestByClass(event.target, 'fg-cell', this.root);
    var row;
    var col;
    if (dialog) {
      return;
    }
    if (cell && this.options.showDetailOnDoubleClick !== false) {
      row = Number(cell.getAttribute('data-row'));
      col = Number(cell.getAttribute('data-col'));
      if (this.showDetail(row, col)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
    baseHandleDblClick.call(this, event);
  };

  PivotGrid.prototype.handleKeyDown = function(event) {
    if (event.key === 'Escape' && this.isDetailOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.hideDetail();
      return;
    }
    if (event.key === 'Escape' && this.isTopLeftMenuOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.hideTopLeftMenu();
      return;
    }
    baseHandleKeyDown.call(this, event);
  };

  PivotGrid.prototype.handleContextMenu = function(event) {
    var hit;
    if (this.options.customContextMenu === false) {
      baseHandleContextMenu.call(this, event);
      return;
    }
    hit = this.hitTest(event);
    if (!hit || (hit.cellType !== FabGrid.CellType.Cell && hit.cellType !== FabGrid.CellType.ColumnHeader)) {
      this.hideTopLeftMenu();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this._pivotContext = hit;
    this.showTopLeftMenu(event.clientX, event.clientY);
  };

  PivotGrid.prototype.renderTopLeftMenu = function() {
    var context = this._pivotContext;
    var column = context && context.column;
    var field = column && (column._pivotRowField || column._pivotDataColumn && column._pivotDataColumn.valueField);
    var entry = context && context.cellType === FabGrid.CellType.Cell && this.view[context.row] ? this.view[context.row].__pivotMeta :
      column && column._pivotDataColumn ? column._pivotDataColumn.entry : null;
    var fragment = document.createDocumentFragment();
    var aggregate;
    var aggregates = ['Sum', 'Count', 'Average', 'Min', 'Max'];
    var rowGroupState;
    var columnGroupState;
    var hasGroups;
    var hasExpandedGroups;
    var i;
    this.topLeftMenu.innerHTML = '';
    if (context && context.cellType === FabGrid.CellType.Cell && column && column._pivotDataColumn) {
      fragment.appendChild(createMenuItem('pivot-detail', this.getText('pivot.showDetail'), 'icon-refwin'));
    }
    if (entry && entry.isSubtotal && !(column && column._pivotRowField)) {
      fragment.appendChild(createMenuItem(
        context.cellType === FabGrid.CellType.Cell ? 'pivot-toggle-row' : 'pivot-toggle-column',
        this.getText((context.cellType === FabGrid.CellType.Cell ? this._pivotRowCollapsed : this._pivotColumnCollapsed)[entry.key] ?
          'pivot.expandGroup' : 'pivot.collapseGroup'),
        this._pivotRowCollapsed[entry.key] || this._pivotColumnCollapsed[entry.key] ? 'icon-expand' : 'icon-collapse'
      ));
    }
    if (column && column._pivotRowField) {
      rowGroupState = getRowGroupMenuState(this._pivotRowEntriesByKey, this._pivotRowCollapsed);
      columnGroupState = getRowGroupMenuState(this._pivotColumnEntriesByKey, this._pivotColumnCollapsed);
      hasGroups = rowGroupState.hasGroups || columnGroupState.hasGroups;
      hasExpandedGroups = rowGroupState.hasExpanded || columnGroupState.hasExpanded;
      fragment.appendChild(createMenuItem(
        hasExpandedGroups ? 'pivot-collapse-all' : 'pivot-expand-all',
        this.getText(hasExpandedGroups ? 'pivot.collapseAll' : 'pivot.expandAll'),
        hasExpandedGroups ? 'icon-collapse' : 'icon-expand',
        false,
        !hasGroups
      ));
      fragment.appendChild(createMenuItem('pivot-sort', this.getText(
        getPivotSortMenuKey(column._pivotRowField)
      ), 'icon-sort'));
    }
    if (column && column._pivotDataColumn) {
      for (i = 0; i < aggregates.length; i += 1) {
        aggregate = aggregates[i];
        fragment.appendChild(createMenuItem(
          'pivot-aggregate-' + aggregate.toLowerCase(),
          this.getText('pivot.aggregate') + ': ' + this.getText('pivot.aggregates.' + aggregate.toLowerCase()),
          'icon-measure',
          field.aggregate === aggregate
        ));
      }
    }
    if (field) {
      fragment.appendChild(createMenuItem('pivot-remove-field', this.getText('pivot.removeField'), 'icon-clear'));
    }
    fragment.appendChild(createMenuItem('pivot-export-excel', this.getText('topLeftMenu.exportExcel'), 'icon-excel'));
    fragment.appendChild(createMenuItem('pivot-export-csv', this.getText('topLeftMenu.exportCsv'), 'icon-export'));
    if (context && context.cellType === FabGrid.CellType.ColumnHeader) {
      fragment.appendChild(createMenuItem(
        'pivot-fullscreen',
        this.getText(this.isFullscreen() ? 'topLeftMenu.exitFullscreen' : 'topLeftMenu.fullscreen'),
        'icon-fullscreen',
        false,
        !this.isFullscreenAvailable()
      ));
    }
    this.topLeftMenu.appendChild(fragment);
  };

  PivotGrid.prototype.handleTopLeftMenuClick = function(event) {
    var item = closestByClass(event.target, 'fg-top-left-menu-item', this.topLeftMenu);
    var action;
    var context = this._pivotContext;
    var column = context && context.column;
    var field = column && (column._pivotRowField || column._pivotDataColumn && column._pivotDataColumn.valueField);
    var entry = context && context.cellType === FabGrid.CellType.Cell && this.view[context.row] ? this.view[context.row].__pivotMeta :
      column && column._pivotDataColumn ? column._pivotDataColumn.entry : null;
    if (!item) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    action = item.getAttribute('data-action');
    this.hideTopLeftMenu();
    if (action === 'pivot-detail') {
      this.showDetail(context.row, context.viewCol);
    } else if (action === 'pivot-toggle-row' && entry) {
      this.toggleRowSubtotal(entry.key);
    } else if (action === 'pivot-toggle-column' && entry) {
      this.toggleColumnSubtotal(entry.key);
    } else if (action === 'pivot-expand-all') {
      this.expandAll();
    } else if (action === 'pivot-collapse-all') {
      this.collapseAll();
    } else if (action === 'pivot-sort' && field) {
      this.togglePivotFieldSort(field.key);
    } else if (action.indexOf('pivot-aggregate-') === 0 && field) {
      field.aggregate = action.slice('pivot-aggregate-'.length).replace(/^./, function(character) {
        return character.toUpperCase();
      });
      this._pivotEngine.emit('viewDefinitionChanged', {
        property: 'aggregate',
        field: field
      });
      this._pivotEngine.refresh();
    } else if (action === 'pivot-remove-field' && field) {
      this._pivotEngine.removeField(field);
    } else if (action === 'pivot-export-excel') {
      this.exportExcel('pivot.xlsx');
    } else if (action === 'pivot-export-csv') {
      this.exportCsv('pivot.csv');
    } else if (action === 'pivot-fullscreen') {
      this.toggleFullscreen();
    }
  };

  PivotGrid.prototype.togglePivotFieldSort = function(fieldReference) {
    var field = this._pivotEngine && this._pivotEngine.getField(fieldReference);
    var direction;
    if (!field) {
      return false;
    }
    direction = getPivotFieldSortDirection(field);
    field.sortDirection = direction === 0 ? 1 : direction === 1 ? -1 : 0;
    this._pivotEngine.emit('viewDefinitionChanged', {
      property: 'sortDirection',
      field: field
    });
    this._pivotEngine.refresh();
    return true;
  };

  PivotGrid.prototype.toggleRowSubtotal = function(key) {
    if (!this._pivotRowEntriesByKey[key]) {
      return false;
    }
    this._pivotRowCollapsed[key] = !this._pivotRowCollapsed[key];
    this._applyPivotView(false);
    return true;
  };

  PivotGrid.prototype.toggleColumnSubtotal = function(key) {
    if (!this._pivotColumnEntriesByKey[key]) {
      return false;
    }
    this._pivotColumnCollapsed[key] = !this._pivotColumnCollapsed[key];
    this._applyPivotView(false);
    return true;
  };

  PivotGrid.prototype.expandAll = function() {
    this._pivotRowCollapsed = Object.create(null);
    this._pivotColumnCollapsed = Object.create(null);
    this._applyPivotView(false);
  };

  PivotGrid.prototype.collapseAll = function() {
    var key;
    this._pivotRowCollapsed = Object.create(null);
    this._pivotColumnCollapsed = Object.create(null);
    for (key in this._pivotRowEntriesByKey) {
      if (this._pivotRowEntriesByKey[key].isSubtotal) {
        this._pivotRowCollapsed[key] = true;
      }
    }
    for (key in this._pivotColumnEntriesByKey) {
      if (this._pivotColumnEntriesByKey[key].isSubtotal) {
        this._pivotColumnCollapsed[key] = true;
      }
    }
    this._applyPivotView(false);
  };

  PivotGrid.prototype.getCellKeys = function(row, col) {
    var item = this.view[row];
    var column = this.visibleColumns[col];
    if (!item || !column || !column._pivotDataColumn) {
      return null;
    }
    return this._pivotEngine.getKeys(item, column._pivotDataColumn.entry);
  };

  PivotGrid.prototype.showDetail = function(row, col) {
    var item = this.view[row];
    var column = this.visibleColumns[col];
    var detail;
    var columns;
    var self = this;
    if (!item || !column || !column._pivotDataColumn || !this._pivotEngine) {
      return false;
    }
    detail = this._pivotEngine.getDetail(item, column._pivotDataColumn.entry);
    columns = this._pivotEngine.fields.filter(function(field) {
      return field.visible !== false && field.binding;
    }).map(function(field) {
      return {
        binding: field.binding,
        header: field.header,
        width: field.width,
        dataType: field.dataType,
        format: field.format,
        align: field.align,
        readOnly: true
      };
    });
    this.hideDetail();
    this.pivotDetailTitle.textContent = this.getText('pivot.detailTitle') + ' · ' +
      this.getText('pivot.detailCount', { count: detail.length });
    this.pivotDetailOverlay.style.display = 'flex';
    this.pivotDetailOverlay.setAttribute('aria-hidden', 'false');
    this._pivotDetailGrid = new FabGrid(this.pivotDetailBody, {
      itemsSource: detail,
      columns: columns,
      allowEditing: false,
      allowFiltering: true,
      filterMode: ['excel'],
      showRowHeaders: true,
      selectionMode: 'CellRange',
      locale: this.locale,
      messages: this.options.messages
    });
    window.setTimeout(function() {
      if (self.pivotDetailClose) {
        self.pivotDetailClose.focus();
      }
    }, 0);
    return true;
  };

  PivotGrid.prototype.hideDetail = function() {
    if (this._pivotDetailGrid) {
      this._pivotDetailGrid.dispose();
      this._pivotDetailGrid = null;
    }
    if (this.pivotDetailBody) {
      this.pivotDetailBody.innerHTML = '';
    }
    if (this.pivotDetailOverlay) {
      this.pivotDetailOverlay.style.display = 'none';
      this.pivotDetailOverlay.setAttribute('aria-hidden', 'true');
    }
  };

  PivotGrid.prototype.isDetailOpen = function() {
    return !!(this.pivotDetailOverlay && this.pivotDetailOverlay.style.display === 'flex');
  };

  PivotGrid.prototype.dispose = function() {
    this.hideDetail();
    if (this._pivotEngine && this._pivotEngine.updatedView) {
      this._pivotEngine.updatedView.removeHandler(this._pivotUpdatedHandler, this);
    }
    this._pivotEngine = null;
    this._pivotRowGroups = [];
    baseDispose.call(this);
  };

  Object.defineProperties(PivotGrid.prototype, {
    engine: {
      get: function() {
        return this._pivotEngine;
      }
    },
    itemsSource: {
      get: function() {
        return this._pivotEngine;
      },
      set: function(value) {
        this.setPivotEngine(value);
      }
    },
    collapsibleSubtotals: {
      get: function() {
        return this.options.collapsibleSubtotals !== false;
      },
      set: function(value) {
        this.options.collapsibleSubtotals = value !== false;
        this.render();
      }
    },
    showDetailOnDoubleClick: {
      get: function() {
        return this.options.showDetailOnDoubleClick !== false;
      },
      set: function(value) {
        this.options.showDetailOnDoubleClick = value !== false;
      }
    }
  });

  PivotGrid.PivotEngine = PivotEngine;
  PivotGrid.themes = (FabGrid.themes || []).slice();
  return PivotGrid;
}
