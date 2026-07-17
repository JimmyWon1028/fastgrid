export function installFabGridFilterUi(FabGrid, context) {
  var applyMask = context.applyMask;
  var closest = context.closest;
  var countMaskCharactersBeforeCaret = context.countMaskCharactersBeforeCaret;
  var createColorState = context.createColorState;
  var createDictionary = context.createDictionary;
  var createFilterMenuItemHandler = context.createFilterMenuItemHandler;
  var extractMaskCharacters = context.extractMaskCharacters;
  var formatMaskText = context.formatMaskText;
  var getByBinding = context.getByBinding;
  var getColumnEditorConfig = context.getColumnEditorConfig;
  var getColumnSearchIconConfigs = context.getColumnSearchIconConfigs;
  var getColumnSearchKey = context.getColumnSearchKey;
  var getColumnSearchOperatorDefinitions = context.getColumnSearchOperatorDefinitions;
  var getComboboxTextByValue = context.getComboboxTextByValue;
  var getEditorMask = context.getEditorMask;
  var getExcelFilterValueKey = context.getExcelFilterValueKey;
  var getMaskCaretPosition = context.getMaskCaretPosition;
  var hasClass = context.hasClass;
  var isDateLikeEditorType = context.isDateLikeEditorType;
  var normalizeColorValue = context.normalizeColorValue;
  var sanitizeDateEditorText = context.sanitizeDateEditorText;
  var toNumber = context.toNumber;
  var trimText = context.trimText;

  FabGrid.prototype.handleContextMenu = function(event) {
    var headerTitle = closest(event.target, 'fg-header-title');
    if (!headerTitle) {
      if (typeof this.handleTreeContextMenu === 'function' && this.handleTreeContextMenu(event)) {
        return;
      }
      this.hideTopLeftMenu();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.showTopLeftMenu(event.clientX, event.clientY, 'grid');
  };

  FabGrid.prototype.showTopLeftMenu = function(clientX, clientY, mode) {
    var rootRect;
    var menuWidth;
    var menuHeight;
    var left;
    var top;
    if (!this.topLeftMenu) {
      return;
    }
    this.hideFilterMenu();
    this.hideColumnChooser();
    this.topLeftMenuMode = mode || 'grid';
    this.renderActiveTopLeftMenu();
    this.topLeftMenu.style.visibility = 'hidden';
    this.topLeftMenu.style.display = 'block';
    rootRect = this.root.getBoundingClientRect();
    menuWidth = this.topLeftMenu.offsetWidth;
    menuHeight = this.topLeftMenu.offsetHeight;
    left = clientX - rootRect.left;
    top = clientY - rootRect.top;
    left = Math.max(2, Math.min(left, rootRect.width - menuWidth - 2));
    top = Math.max(2, Math.min(top, rootRect.height - menuHeight - 2));
    this.topLeftMenu.style.left = left + 'px';
    this.topLeftMenu.style.top = top + 'px';
    this.topLeftMenu.style.visibility = '';
  };

  FabGrid.prototype.renderActiveTopLeftMenu = function() {
    if (this.topLeftMenuMode === 'tree' && typeof this.renderTreeContextMenu === 'function') {
      this.renderTreeContextMenu();
      return;
    }
    this.topLeftMenuMode = 'grid';
    this.renderTopLeftMenu();
  };

  FabGrid.prototype.renderTopLeftMenu = function() {
    var rowHeaderMode = this.options.showRowHeaders;
    var rowHeaderItems = [
      {
        action: 'row-headers-off',
        label: this.getText('topLeftMenu.rowHeadersOff'),
        checked: rowHeaderMode === false
      },
      {
        action: 'row-headers-numbers',
        label: this.getText('topLeftMenu.rowHeadersNumbers'),
        checked: rowHeaderMode === true
      },
      {
        action: 'row-headers-cell',
        label: this.getText('topLeftMenu.rowHeadersCellOnly'),
        checked: rowHeaderMode === 'cell'
      }
    ];
    var items = [];
    if (this.options.allowFiltering !== false) {
      items.push({
        action: 'toggle-search-row',
        iconClass: 'icon-search',
        label: this.getText(this.options.showSearchRow === true ? 'topLeftMenu.hideSearchRow' : 'topLeftMenu.showSearchRow')
      });
    }
    items.push(
      {
        action: 'clear-filter',
        iconClass: 'icon-clear',
        label: this.getText('topLeftMenu.clearFilter')
      },
      {
        action: 'row-headers-menu',
        iconClass: 'icon-row-number',
        label: this.getText('topLeftMenu.rowHeaders'),
        children: rowHeaderItems
      },
      { action: 'export-excel', iconClass: 'icon-excel', label: this.getText('topLeftMenu.exportExcel') },
      { action: 'export-csv', iconClass: 'icon-export', label: this.getText('topLeftMenu.exportCsv') },
      {
        action: 'fullscreen',
        iconClass: 'icon-fullscreen',
        label: this.getText(this.isFullscreen() ? 'topLeftMenu.exitFullscreen' : 'topLeftMenu.fullscreen'),
        disabled: !this.isFullscreenAvailable()
      }
    );
    var fragment = document.createDocumentFragment();
    var item;
    var icon;
    var label;
    var arrow;
    var submenuWrap;
    var submenu;
    var child;
    var childItem;
    var i;
    var j;
    if (!this.topLeftMenu) {
      return;
    }
    this.topLeftMenu.setAttribute('aria-label', this.getText('topLeftMenu.ariaLabel'));
    this.topLeftMenu.innerHTML = '';
    for (i = 0; i < items.length; i += 1) {
      item = document.createElement('button');
      icon = document.createElement('span');
      label = document.createElement('span');
      item.type = 'button';
      item.className = 'fg-top-left-menu-item' + (items[i].checked ? ' fg-top-left-menu-item-active' : '');
      item.setAttribute('role', items[i].checked == null ? 'menuitem' : 'menuitemradio');
      if (items[i].checked != null) {
        item.setAttribute('aria-checked', items[i].checked ? 'true' : 'false');
      }
      item.setAttribute('data-action', items[i].action);
      item.disabled = items[i].disabled === true;
      icon.className = 'fg-top-left-menu-icon' + (items[i].iconClass ? ' ' + items[i].iconClass : '');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = items[i].checked ? '✓' : '';
      label.className = 'fg-top-left-menu-label';
      label.textContent = items[i].label;
      item.appendChild(icon);
      item.appendChild(label);
      if (!items[i].children) {
        fragment.appendChild(item);
        continue;
      }
      item.setAttribute('aria-haspopup', 'menu');
      item.setAttribute('aria-expanded', 'false');
      arrow = document.createElement('span');
      arrow.className = 'fg-top-left-menu-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '›';
      item.appendChild(arrow);
      submenuWrap = document.createElement('div');
      submenuWrap.className = 'fg-top-left-menu-submenu-wrap';
      submenu = document.createElement('div');
      submenu.className = 'fg-top-left-menu fg-top-left-submenu';
      submenu.setAttribute('role', 'menu');
      submenu.setAttribute('aria-label', items[i].label);
      for (j = 0; j < items[i].children.length; j += 1) {
        child = items[i].children[j];
        icon = document.createElement('span');
        label = document.createElement('span');
        childItem = document.createElement('button');
        childItem.type = 'button';
        childItem.className = 'fg-top-left-menu-item' +
          (child.checked ? ' fg-top-left-menu-item-active' : '');
        childItem.setAttribute('role', 'menuitemradio');
        childItem.setAttribute('aria-checked', child.checked ? 'true' : 'false');
        childItem.setAttribute('data-action', child.action);
        icon.className = 'fg-top-left-menu-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = child.checked ? '✓' : '';
        label.className = 'fg-top-left-menu-label';
        label.textContent = child.label;
        childItem.appendChild(icon);
        childItem.appendChild(label);
        submenu.appendChild(childItem);
      }
      submenuWrap.appendChild(item);
      submenuWrap.appendChild(submenu);
      fragment.appendChild(submenuWrap);
    }
    this.topLeftMenu.appendChild(fragment);
  };

  FabGrid.prototype.hideTopLeftMenu = function() {
    if (this.topLeftMenu) {
      this.topLeftMenu.style.display = 'none';
    }
    this.topLeftMenuMode = null;
  };

  FabGrid.prototype.isTopLeftMenuOpen = function() {
    return !!(this.topLeftMenu && this.topLeftMenu.style.display === 'block');
  };

  FabGrid.prototype.handleTopLeftMenuClick = function(event) {
    var item = closest(event.target, 'fg-top-left-menu-item');
    var action;
    var submenuWrap;
    var expanded;
    var result;
    if (!item || item.disabled) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    action = item.getAttribute('data-action');
    if (action === 'row-headers-menu') {
      submenuWrap = closest(item, 'fg-top-left-menu-submenu-wrap');
      expanded = submenuWrap && !submenuWrap.classList.contains('fg-top-left-menu-submenu-open');
      if (submenuWrap) {
        submenuWrap.classList.toggle('fg-top-left-menu-submenu-open', expanded);
      }
      item.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      return;
    }
    this.hideTopLeftMenu();
    if (typeof this.handleTreeContextMenuAction === 'function' &&
      this.handleTreeContextMenuAction(action)) {
      return;
    }
    if (action === 'toggle-search-row') {
      this.setShowSearchRow(this.options.showSearchRow !== true);
      return;
    }
    if (action === 'clear-filter') {
      this.clearFilter();
      return;
    }
    if (action === 'row-headers-off') {
      this.setShowRowHeaders(false);
      return;
    }
    if (action === 'row-headers-numbers') {
      this.setShowRowHeaders(true);
      return;
    }
    if (action === 'row-headers-cell') {
      this.setShowRowHeaders('cell');
      return;
    }
    if (action === 'export-excel') {
      result = this.exportExcel();
      if (result && typeof result.catch === 'function') {
        result.catch(function() {});
      }
      return;
    }
    if (action === 'export-csv') {
      this.exportCsv();
      return;
    }
    if (action === 'fullscreen') {
      this.toggleFullscreen();
    }
  };

  FabGrid.prototype.getFullscreenElement = function() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  };

  FabGrid.prototype.isFullscreen = function() {
    return this.getFullscreenElement() === this.root;
  };

  FabGrid.prototype.isFullscreenAvailable = function() {
    return this.isFullscreen() || typeof this.root.requestFullscreen === 'function' ||
      typeof this.root.webkitRequestFullscreen === 'function';
  };

  FabGrid.prototype.toggleFullscreen = function() {
    var action;
    var context;
    var result;
    if (this.isFullscreen()) {
      action = document.exitFullscreen || document.webkitExitFullscreen;
      context = document;
    } else {
      action = this.root.requestFullscreen || this.root.webkitRequestFullscreen;
      context = this.root;
    }
    if (typeof action !== 'function') {
      return false;
    }
    try {
      result = action.call(context);
      if (result && typeof result.catch === 'function') {
        result.catch(function() {});
      }
      return result || true;
    } catch (error) {
      return false;
    }
  };

  FabGrid.prototype.handleFullscreenChange = function() {
    if (this.disposed) {
      return;
    }
    if (this.isTopLeftMenuOpen()) {
      this.renderTopLeftMenu();
    }
    this.invalidate();
  };

  FabGrid.prototype.showFilterMenu = function(colIndex, anchor) {
    var column = this.visibleColumns[colIndex];
    if (this.options.allowFiltering === false || !column || !this.filterMenu) {
      return;
    }
    if (this.filterMenuColumn === column && this.isFilterMenuOpen()) {
      this.hideFilterMenu();
      return;
    }
    this.filterMenuColumn = column;
    this.filterMenuAnchor = anchor;
    this.renderFilterMenu(column);
    this.filterMenu.style.display = 'block';
    this.positionFilterMenu(anchor);
    if (anchor) {
      anchor.setAttribute('aria-expanded', 'true');
    }
  };

  FabGrid.prototype.renderFilterMenu = function(column) {
    if (this.options.showSearchRow !== true) {
      this.renderExcelFilterMenu(column);
      return;
    }
    this.filterMenu.className = 'fg-filter-menu';
    this.filterMenu.setAttribute('role', 'menu');
    this.filterMenu.setAttribute('aria-label', this.getText('filter.openMenu', { column: this.getHeaderCellText(column) }));
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

  FabGrid.prototype.renderExcelFilterMenu = function(column) {
    var filter = this.getExcelFilter(column);
    var valueItems = this.getExcelFilterValueItems(column);
    var selectedKeys = createDictionary();
    var selectedValues = filter && filter.type === 'values' ? filter.values : null;
    var container = document.createElement('div');
    var valuesPane = document.createElement('div');
    var footer = document.createElement('div');
    var i;
    var key;

    if (!this.excelFilterDraft || this.excelFilterDraft.column !== column) {
      if (selectedValues) {
        for (i = 0; i < selectedValues.length; i += 1) {
          selectedKeys[getExcelFilterValueKey(selectedValues[i])] = true;
        }
      } else {
        for (i = 0; i < valueItems.length; i += 1) {
          selectedKeys[valueItems[i].key] = true;
        }
      }
      this.excelFilterDraft = {
        column: column,
        search: '',
        valueItems: valueItems,
        selectedKeys: selectedKeys,
        defaultSelected: !selectedValues,
        truncated: valueItems.truncated === true
      };
    } else {
      this.excelFilterDraft.valueItems = valueItems;
      this.excelFilterDraft.truncated = valueItems.truncated === true;
      for (i = 0; i < valueItems.length; i += 1) {
        key = valueItems[i].key;
        if (!Object.prototype.hasOwnProperty.call(this.excelFilterDraft.selectedKeys, key) && !selectedValues) {
          this.excelFilterDraft.selectedKeys[key] = true;
        }
      }
    }

    container.className = 'fg-excel-filter';
    valuesPane.className = 'fg-excel-filter-pane fg-excel-filter-values-pane';
    this.renderExcelFilterValuesPane(valuesPane);

    footer.className = 'fg-excel-filter-footer';
    footer.appendChild(this.createExcelFilterButton('apply', this.getText('filter.apply')));
    footer.appendChild(this.createExcelFilterButton('cancel', this.getText('filter.cancel')));
    footer.appendChild(this.createExcelFilterButton('clear', this.getText('filter.clear')));

    container.appendChild(valuesPane);
    container.appendChild(footer);
    this.filterMenu.className = 'fg-filter-menu fg-excel-filter-menu';
    this.filterMenu.setAttribute('role', 'dialog');
    this.filterMenu.setAttribute('aria-label', this.getText('filter.openMenu', { column: this.getHeaderCellText(column) }));
    this.filterMenu.innerHTML = '';
    this.filterMenu.appendChild(container);
  };

  FabGrid.prototype.createExcelFilterButton = function(action, label, className) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = trimText((className || 'fg-excel-filter-action') + ' fg-excel-filter-button');
    button.setAttribute('data-excel-action', action);
    button.textContent = label;
    return button;
  };

  FabGrid.prototype.renderExcelFilterValuesPane = function(pane) {
    var search = document.createElement('input');
    var selectAllLabel = document.createElement('label');
    var selectAll = document.createElement('input');
    var selectAllText = document.createElement('span');
    var list = document.createElement('div');
    var item;
    var check;
    var text;
    var i;

    search.type = 'search';
    search.className = 'fg-excel-filter-search';
    search.value = this.excelFilterDraft.search;
    search.placeholder = this.getText('filter.searchValues');
    search.setAttribute('aria-label', this.getText('filter.searchValues'));

    selectAllLabel.className = 'fg-excel-filter-select-all';
    selectAll = document.createElement('input');
    selectAll.type = 'checkbox';
    selectAll.className = 'fg-excel-filter-select-all-check';
    selectAllText.textContent = this.getText('filter.selectAll');
    selectAllLabel.appendChild(selectAll);
    selectAllLabel.appendChild(selectAllText);

    list.className = 'fg-excel-filter-value-list';
    for (i = 0; i < this.excelFilterDraft.valueItems.length; i += 1) {
      item = document.createElement('label');
      check = document.createElement('input');
      text = document.createElement('span');
      item.className = 'fg-excel-filter-value-item';
      item.setAttribute('data-value-index', i);
      check.type = 'checkbox';
      check.className = 'fg-excel-filter-value-check';
      check.checked = this.excelFilterDraft.selectedKeys[this.excelFilterDraft.valueItems[i].key] === true;
      check.setAttribute('data-value-index', i);
      text.textContent = this.excelFilterDraft.valueItems[i].label;
      item.appendChild(check);
      item.appendChild(text);
      list.appendChild(item);
    }

    pane.appendChild(search);
    pane.appendChild(selectAllLabel);
    pane.appendChild(list);
    this.filterExcelValueList(this.excelFilterDraft.search, pane);
  };

  FabGrid.prototype.getExcelFilterValueItems = function(column, maxValues) {
    var rows = this.getExcelFilterRows();
    var seen = createDictionary();
    var result = [];
    var limit = maxValues === Infinity ? Infinity : Math.max(1, toNumber(maxValues, toNumber(this.options.excelFilterMaxValues, 1000)));
    var value;
    var key;
    var label;
    var i;
    var truncated = false;
    for (i = 0; i < rows.length; i += 1) {
      value = getByBinding(rows[i], column.binding);
      key = getExcelFilterValueKey(value);
      if (seen[key]) {
        continue;
      }
      seen[key] = true;
      if (result.length >= limit) {
        truncated = true;
        break;
      }
      label = this.getCellDisplayText(rows[i], column, value);
      result.push({
        key: key,
        value: value,
        label: label || this.getText('filter.blankValue')
      });
    }
    result.truncated = truncated;
    return result;
  };

  FabGrid.prototype.getExcelFilterRows = function() {
    var result = [];
    var self = this;
    function append(rows) {
      var children;
      var i;
      for (i = 0; i < (rows || []).length; i += 1) {
        result.push(rows[i]);
        if (typeof self.isTreeGrid === 'function' && self.isTreeGrid()) {
          children = self.getTreeChildren(rows[i]);
          if (children && children.length) {
            append(children);
          }
        }
      }
    }
    append(this.source);
    return result;
  };

  FabGrid.prototype.filterExcelValueList = function(searchText, pane) {
    var host = pane || this.filterMenu;
    var items = host ? host.querySelectorAll('.fg-excel-filter-value-item') : [];
    var search = String(searchText || '').toLowerCase();
    var i;
    for (i = 0; i < items.length; i += 1) {
      items[i].style.display = !search || items[i].textContent.toLowerCase().indexOf(search) >= 0 ? 'flex' : 'none';
    }
    this.syncExcelFilterSelectAllState(host);
  };

  FabGrid.prototype.syncExcelFilterSelectAllState = function(host) {
    var root = host || this.filterMenu;
    var selectAll = root ? root.querySelector('.fg-excel-filter-select-all-check') : null;
    var items = root ? root.querySelectorAll('.fg-excel-filter-value-item') : [];
    var visible = 0;
    var checked = 0;
    var check;
    var i;
    if (!selectAll) {
      return;
    }
    for (i = 0; i < items.length; i += 1) {
      if (items[i].style.display === 'none') {
        continue;
      }
      visible += 1;
      check = items[i].querySelector('.fg-excel-filter-value-check');
      if (check && check.checked) {
        checked += 1;
      }
    }
    selectAll.checked = visible > 0 && checked === visible;
    selectAll.indeterminate = checked > 0 && checked < visible;
  };

  FabGrid.prototype.getColumnSearchOperatorItems = function(column) {
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

  FabGrid.prototype.getColumnSearchOperatorLabel = function(definition) {
    var label;
    if (!definition.operator) {
      return this.getText('filter.clear') || 'Clear';
    }
    label = this.getText(definition.labelKey, { symbol: definition.symbol });
    return label || definition.symbol;
  };

  FabGrid.prototype.positionFilterMenu = function(anchor) {
    var rootRect;
    var anchorRect;
    var headerCell;
    var headerRect;
    var viewportWidth;
    var viewportHeight;
    var visibleLeft;
    var visibleRight;
    var visibleTop;
    var visibleBottom;
    var preferredLeft;
    var preferredTop;
    var belowTop;
    var aboveBottom;
    var availableBelow;
    var availableAbove;
    var availableHeight;
    var opensAbove;
    var valueList;
    var menuChromeHeight;
    var desiredHeight;
    var bottomShadowSpace;
    var isExcelFilterMenu;
    var menuWidth;
    var menuHeight;
    var left;
    var top;
    if (!this.filterMenu || !anchor || this.filterMenu.style.display !== 'block') {
      return;
    }
    this.filterMenu.style.height = '';
    rootRect = this.root.getBoundingClientRect();
    anchorRect = anchor.getBoundingClientRect();
    headerCell = closest(anchor, 'fg-header-cell');
    headerRect = headerCell ? headerCell.getBoundingClientRect() : anchorRect;
    viewportWidth = Math.max(0, window.innerWidth || document.documentElement.clientWidth || rootRect.right);
    viewportHeight = Math.max(0, window.innerHeight || document.documentElement.clientHeight || rootRect.bottom);
    isExcelFilterMenu = hasClass(this.filterMenu, 'fg-excel-filter-menu');
    bottomShadowSpace = isExcelFilterMenu ? 12 : 0;
    visibleLeft = Math.max(rootRect.left, 8);
    visibleRight = Math.min(rootRect.right, viewportWidth - 8);
    visibleTop = Math.max(rootRect.top, 8);
    visibleBottom = Math.max(
      visibleTop,
      Math.min(rootRect.bottom - bottomShadowSpace, viewportHeight - 8 - bottomShadowSpace)
    );
    menuWidth = this.filterMenu.offsetWidth;
    menuHeight = this.filterMenu.offsetHeight;
    belowTop = Math.max(anchorRect.bottom + 2, visibleTop);
    aboveBottom = Math.min(anchorRect.top - 2, visibleBottom);
    availableBelow = Math.max(0, visibleBottom - belowTop);
    availableAbove = Math.max(0, aboveBottom - visibleTop);
    desiredHeight = menuHeight;

    if (isExcelFilterMenu) {
      valueList = this.filterMenu.querySelector('.fg-excel-filter-value-list');
      if (valueList) {
        menuChromeHeight = Math.max(0, menuHeight - valueList.offsetHeight);
        desiredHeight = menuChromeHeight + valueList.scrollHeight;
      }
    }

    opensAbove = availableBelow < Math.min(desiredHeight, 280) && availableAbove > availableBelow;
    availableHeight = opensAbove ? availableAbove : availableBelow;
    if (isExcelFilterMenu) {
      menuHeight = Math.max(0, Math.min(desiredHeight, availableHeight));
      this.filterMenu.style.height = Math.floor(menuHeight) + 'px';
    }

    preferredLeft = isExcelFilterMenu ?
      headerRect.left :
      anchorRect.left - menuWidth + anchorRect.width + 4;
    preferredTop = opensAbove ? aboveBottom - menuHeight : belowTop;
    left = Math.max(visibleLeft, Math.min(preferredLeft, visibleRight - menuWidth)) - rootRect.left;
    top = Math.max(visibleTop, Math.min(preferredTop, visibleBottom - menuHeight)) - rootRect.top;
    this.filterMenu.style.left = left + 'px';
    this.filterMenu.style.top = top + 'px';
  };

  FabGrid.prototype.hideFilterMenu = function() {
    if (this.filterMenuAnchor) {
      this.filterMenuAnchor.setAttribute('aria-expanded', 'false');
    }
    if (this.filterMenu) {
      this.filterMenu.style.display = 'none';
      this.filterMenu.innerHTML = '';
    }
    this.filterMenuColumn = null;
    this.filterMenuAnchor = null;
    this.excelFilterDraft = null;
  };

  FabGrid.prototype.isFilterMenuOpen = function() {
    return !!(this.filterMenu && this.filterMenu.style.display === 'block');
  };

  FabGrid.prototype.toggleColumnChooser = function(anchor) {
    if (this.isColumnChooserOpen()) {
      this.hideColumnChooser();
      return;
    }
    this.showColumnChooser(anchor);
  };

  FabGrid.prototype.showColumnChooser = function(anchor) {
    if (!this.columnChooser || !anchor) {
      return;
    }
    this.hideFilterMenu();
    this.columnChooserAnchor = anchor;
    this.renderColumnChooser();
    this.columnChooser.style.display = 'grid';
    this.positionColumnChooser(anchor);
    this.renderColumnChooserTrigger();
  };

  FabGrid.prototype.renderColumnChooser = function() {
    var fragment;
    var item;
    var check;
    var label;
    var column;
    var columnCount;
    var rowsPerColumn;
    var i;
    if (!this.columnChooser) {
      return;
    }
    fragment = document.createDocumentFragment();
    columnCount = this.root && this.root.clientWidth <= 640 ? 2 : 4;
    rowsPerColumn = Math.ceil(this.columns.length / columnCount);
    this.columnChooser.style.gridTemplateRows = 'repeat(' + rowsPerColumn + ', max-content)';
    for (i = 0; i < this.columns.length; i += 1) {
      column = this.columns[i];
      item = document.createElement('label');
      check = document.createElement('input');
      label = document.createElement('span');
      item.className = 'fg-column-chooser-item';
      check.className = 'fg-column-chooser-check';
      check.type = 'checkbox';
      check.checked = column.visible !== false;
      check.setAttribute('data-column-index', i);
      label.className = 'fg-column-chooser-label';
      label.textContent = this.getHeaderCellText(column) || column.binding || String(i + 1);
      item.appendChild(check);
      item.appendChild(label);
      fragment.appendChild(item);
    }
    this.columnChooser.innerHTML = '';
    this.columnChooser.appendChild(fragment);
  };

  FabGrid.prototype.positionColumnChooser = function(anchor) {
    var rootRect;
    var anchorRect;
    var panelWidth;
    var panelHeight;
    var left;
    var top;
    if (!this.columnChooser || !anchor || this.columnChooser.style.display !== 'grid') {
      return;
    }
    rootRect = this.root.getBoundingClientRect();
    anchorRect = anchor.getBoundingClientRect();
    panelWidth = this.columnChooser.offsetWidth;
    panelHeight = this.columnChooser.offsetHeight;
    left = anchorRect.left - rootRect.left + 2;
    top = anchorRect.bottom - rootRect.top + 2;
    left = Math.max(2, Math.min(left, rootRect.width - panelWidth - 2));
    top = Math.max(2, Math.min(top, rootRect.height - panelHeight - 2));
    this.columnChooser.style.left = left + 'px';
    this.columnChooser.style.top = top + 'px';
  };

  FabGrid.prototype.hideColumnChooser = function() {
    var trigger;
    if (this.columnChooser) {
      this.columnChooser.style.display = 'none';
      this.columnChooser.innerHTML = '';
    }
    this.columnChooserAnchor = null;
    trigger = this.rowHeaderTop && this.rowHeaderTop.querySelector('.fg-column-chooser-trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }
  };

  FabGrid.prototype.isColumnChooserOpen = function() {
    return !!(this.columnChooser && this.columnChooser.style.display === 'grid');
  };

  FabGrid.prototype.handleColumnChooserChange = function(event) {
    var check = closest(event.target, 'fg-column-chooser-check');
    var columnIndex;
    if (!check) {
      return;
    }
    columnIndex = toNumber(check.getAttribute('data-column-index'), -1);
    if (!this.setColumnVisible(this.columns[columnIndex], check.checked)) {
      return;
    }
    this.renderColumnChooser();
    this.positionColumnChooser(this.columnChooserAnchor);
  };

  FabGrid.prototype.handleFilterMenuClick = function(event) {
    var excelAction = closest(event.target, 'fg-excel-filter-button');
    var item = closest(event.target, 'fg-filter-menu-item') || this.getFilterMenuItemAtEvent(event);
    var operator;
    var colIndex;
    var column;
    if (this.isTopLeftMenuOpen() && !closest(event.target, 'fg-top-left-menu')) {
      this.hideTopLeftMenu();
    }
    if (this.isFilterMenuOpen() &&
      !closest(event.target, 'fg-filter-menu') &&
      !closest(event.target, 'fg-filter-icon')) {
      this.hideFilterMenu();
    }
    if (this.isColumnChooserOpen() &&
      !closest(event.target, 'fg-column-chooser') &&
      !closest(event.target, 'fg-column-chooser-trigger')) {
      this.hideColumnChooser();
    }
    if (excelAction) {
      event.preventDefault();
      event.stopPropagation();
      if (event.type === 'click') {
        this.handleExcelFilterMenuAction(excelAction);
      }
      return;
    }
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

  FabGrid.prototype.handleExcelFilterMenuAction = function(target) {
    var action = target.getAttribute('data-excel-action') || '';
    var draft = this.excelFilterDraft;
    var selectedValues = [];
    var valueItems;
    var selected;
    var i;
    if (!draft || !draft.column) {
      this.hideFilterMenu();
      return;
    }
    if (action === 'cancel') {
      this.hideFilterMenu();
      return;
    }
    if (action === 'clear') {
      this.clearExcelFilter(draft.column);
      return;
    }
    if (action !== 'apply') {
      return;
    }
    valueItems = draft.truncated ? this.getExcelFilterValueItems(draft.column, Infinity) : draft.valueItems;
    for (i = 0; i < valueItems.length; i += 1) {
      selected = Object.prototype.hasOwnProperty.call(draft.selectedKeys, valueItems[i].key) ?
        draft.selectedKeys[valueItems[i].key] === true : draft.defaultSelected === true;
      if (selected) {
        selectedValues.push(valueItems[i].value);
      }
    }
    if (selectedValues.length === valueItems.length) {
      this.clearExcelFilter(draft.column);
      return;
    }
    this.setExcelFilter(draft.column, {
      type: 'values',
      values: selectedValues
    });
  };

  FabGrid.prototype.handleExcelFilterMenuInput = function(event) {
    var draft = this.excelFilterDraft;
    var target = event.target;
    var index;
    var item;
    var visibleItems;
    var check;
    var i;
    if (!draft || !target) {
      return;
    }
    if (hasClass(target, 'fg-excel-filter-search')) {
      draft.search = target.value;
      this.filterExcelValueList(target.value);
      return;
    }
    if (hasClass(target, 'fg-excel-filter-value-check')) {
      index = toNumber(target.getAttribute('data-value-index'), -1);
      item = draft.valueItems[index];
      if (item) {
        draft.selectedKeys[item.key] = target.checked === true;
      }
      this.syncExcelFilterSelectAllState();
      return;
    }
    if (!hasClass(target, 'fg-excel-filter-select-all-check')) {
      return;
    }
    visibleItems = this.filterMenu.querySelectorAll('.fg-excel-filter-value-item');
    for (i = 0; i < visibleItems.length; i += 1) {
      if (visibleItems[i].style.display === 'none') {
        continue;
      }
      check = visibleItems[i].querySelector('.fg-excel-filter-value-check');
      index = toNumber(visibleItems[i].getAttribute('data-value-index'), -1);
      item = draft.valueItems[index];
      if (check && item) {
        check.checked = target.checked === true;
        draft.selectedKeys[item.key] = target.checked === true;
      }
    }
    this.syncExcelFilterSelectAllState();
  };

  FabGrid.prototype.selectFilterMenuOperator = function(column, operator, event) {
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

  FabGrid.prototype.getFilterMenuItemAtEvent = function(event) {
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

  FabGrid.prototype.handleHeaderSearchBeforeInput = function(event) {
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

  FabGrid.prototype.handleHeaderSearchInput = function(event) {
    var input = closest(event.target, 'fg-header-search-input');
    var colIndex;
    var column;
    var selectionStart;
    var selectionEnd;
    var config;
    var mask;
    var formatted;
    var key;
    var color;
    var value;
    if (!input || event.isComposing === true) {
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
    if (this.colorTarget && this.colorTarget.type === 'search' && this.colorTarget.input === input && this.isColorPanelOpen()) {
      color = normalizeColorValue(input.value);
      if (color && !this.colorDragState) {
        this.colorState = createColorState(color);
        this.renderColorPanel();
        this.positionHeaderSearchColorPanel(input);
      }
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

  FabGrid.prototype.handleHeaderSearchCompositionStart = function(event) {
    if (closest(event.target, 'fg-header-search-input')) {
      this.cancelHeaderSearchTimer();
    }
  };

  FabGrid.prototype.handleHeaderSearchCompositionEnd = function(event) {
    if (closest(event.target, 'fg-header-search-input')) {
      this.handleHeaderSearchInput(event);
    }
  };

  FabGrid.prototype.handleHeaderSearchIconClick = function(event, button) {
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
    if (iconConfig && iconConfig.builtin === 'date') {
      this.showHeaderSearchDateboxPanel(input, column);
      return;
    }
    if (iconConfig && iconConfig.builtin === 'combo') {
      this.showHeaderSearchComboboxPanel(input, column, true);
      return;
    }
    if (iconConfig && iconConfig.builtin === 'color') {
      if (this.isColorPanelOpen() && this.colorTarget && this.colorTarget.input === input) {
        this.hideColorPanel();
      } else {
        this.showHeaderSearchColorPanel(input, column);
      }
      return;
    }
    if (typeof handler === 'function') {
      result = handler.call(this, this.createHeaderSearchIconArgs(event, button, input, column, iconConfig, iconIndex));
    }
    if (result !== false && (!iconConfig || iconConfig.keepFocus !== false) && input) {
      input.focus();
    }
  };

  FabGrid.prototype.createHeaderSearchIconArgs = function(event, button, input, column, iconConfig, iconIndex) {
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

  FabGrid.prototype.handleHeaderSearchKeyDown = function(event, input) {
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
    if (this.handleHeaderSearchColorKeyDown(event, input)) {
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
    this.applyFilterChange(false, 'headerSearch');
    if (nextCol < 0 || nextCol >= this.visibleColumns.length) {
      this.focusHeaderSearchInput(colIndex);
    } else {
      this.moveHeaderSearchFocus(colIndex, direction);
    }
    return true;
  };

  FabGrid.prototype.normalizeHeaderSearchComboboxText = function(input, column) {
    var config;
    var value;
    var text;
    var key;
    if (!input || !column) {
      return;
    }
    config = getColumnEditorConfig(column);
    if (!config || config.type !== 'combo') {
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

  FabGrid.prototype.handleHeaderSearchComboboxKeyDown = function(event, input) {
    var colIndex;
    var column;
    if (!input) {
      return false;
    }
    colIndex = toNumber(input.getAttribute('data-col'), -1);
    column = this.visibleColumns[colIndex];
    if (!column || getColumnEditorConfig(column).type !== 'combo') {
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

  FabGrid.prototype.handleHeaderSearchColorKeyDown = function(event, input) {
    var colIndex;
    var column;
    if (!input) {
      return false;
    }
    colIndex = toNumber(input.getAttribute('data-col'), -1);
    column = this.visibleColumns[colIndex];
    if (!column || getColumnEditorConfig(column).type !== 'color') {
      return false;
    }
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      this.showHeaderSearchColorPanel(input, column);
      return true;
    }
    if (event.key === 'Escape' && this.isColorPanelOpen() && this.colorTarget && this.colorTarget.input === input) {
      event.preventDefault();
      this.hideColorPanel();
      input.focus();
      return true;
    }
    return false;
  };

  FabGrid.prototype.handleMaskedHeaderSearchDelete = function(event, input) {
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

  FabGrid.prototype.moveHeaderSearchFocus = function(colIndex, direction) {
    var nextCol = colIndex + direction;
    if (nextCol < 0 || nextCol >= this.visibleColumns.length) {
      return;
    }
    this.scrollHeaderSearchColumnIntoView(nextCol, direction);
    this.render();
    this.requestHeaderSearchFocus(nextCol);
  };

  FabGrid.prototype.scrollHeaderSearchColumnIntoView = function(col, direction) {
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

  FabGrid.prototype.getActiveHeaderSearchInput = function() {
    var active = document.activeElement;
    if (!active || !this.header || !this.header.contains(active)) {
      return null;
    }
    return closest(active, 'fg-header-search-input');
  };

  FabGrid.prototype.focusHeaderSearchInput = function(colIndex, selectionStart, selectionEnd) {
    var input = this.header.querySelector('.fg-header-search-input[data-col="' + colIndex + '"]');
    if (!input) {
      return false;
    }
    this.headerScroll.scrollLeft = 0;
    try {
      input.focus({ preventScroll: true });
    } catch (error) {
      input.focus();
    }
    this.headerScroll.scrollLeft = 0;
    if (selectionStart != null && input.setSelectionRange) {
      input.setSelectionRange(selectionStart, selectionEnd == null ? selectionStart : selectionEnd);
    }
    return true;
  };

  FabGrid.prototype.focusHeaderSearchInputLater = function(colIndex, selectionStart, selectionEnd) {
    this.requestHeaderSearchFocus(colIndex, selectionStart, selectionEnd);
  };

  FabGrid.prototype.requestHeaderSearchFocus = function(colIndex, selectionStart, selectionEnd) {
    this.headerSearchFocusRequest = {
      col: colIndex,
      selectionStart: selectionStart,
      selectionEnd: selectionEnd,
      attempts: 4
    };
    this.restoreHeaderSearchFocus();
    this.scheduleHeaderSearchFocusRestore();
  };

  FabGrid.prototype.scheduleHeaderSearchFocusRestore = function() {
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

  FabGrid.prototype.restoreHeaderSearchFocus = function() {
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

  FabGrid.prototype.updateColumnSearchState = function() {
    var key;
    this.hasColumnSearch = false;
    for (key in this.columnSearchValues) {
      if (Object.prototype.hasOwnProperty.call(this.columnSearchValues, key) && String(this.columnSearchValues[key] || '').trim()) {
        this.hasColumnSearch = true;
        return;
      }
    }
  };
}
