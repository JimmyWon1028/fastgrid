function resolvePivotPanelHostElement(element) {
  if (typeof element === 'string') {
    return typeof document === 'undefined' ? null : document.querySelector(element);
  }
  return element && element.nodeType === 1 ? element : null;
}

function getPivotPanelMessageValue(messages, path) {
  var parts = String(path || '').split('.');
  var value = messages;
  var i;
  for (i = 0; i < parts.length; i += 1) {
    if (!value || typeof value !== 'object') {
      return null;
    }
    value = value[parts[i]];
  }
  return typeof value === 'string' ? value : null;
}

function formatPivotPanelMessage(text, data) {
  return String(text || '').replace(/\{([^}]+)\}/g, function(match, key) {
    return data && data[key] != null ? String(data[key]) : match;
  });
}

function closestWithAttribute(target, attribute, boundary) {
  var node = target && target.nodeType === 1 ? target : target ? target.parentElement : null;
  while (node) {
    if (node.hasAttribute && node.hasAttribute(attribute)) {
      return node;
    }
    if (node === boundary) {
      break;
    }
    node = node.parentElement;
  }
  return null;
}

function createButton(action, label, text) {
  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'fg-pivot-panel-action';
  button.setAttribute('data-action', action);
  button.setAttribute('aria-label', label);
  button.title = label;
  button.textContent = text;
  return button;
}

function createAggregateMenuItem(value, label, active, fieldKey) {
  var item = document.createElement('button');
  var icon = document.createElement('span');
  var text = document.createElement('span');
  item.type = 'button';
  item.className = 'fg-top-left-menu-item' + (active ? ' fg-top-left-menu-item-active' : '');
  item.setAttribute('role', 'menuitemradio');
  item.setAttribute('aria-checked', active ? 'true' : 'false');
  item.setAttribute('data-action', 'set-aggregate');
  item.setAttribute('data-aggregate', value);
  item.setAttribute('data-field-key', fieldKey);
  icon.className = 'fg-top-left-menu-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = active ? '✓' : '';
  text.className = 'fg-top-left-menu-label';
  text.textContent = label;
  item.appendChild(icon);
  item.appendChild(text);
  return item;
}

function normalizePivotPanelSortDirection(value) {
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

function createSortMenuItem(value, label, active, fieldKey) {
  var item = document.createElement('button');
  var icon = document.createElement('span');
  var text = document.createElement('span');
  item.type = 'button';
  item.className = 'fg-top-left-menu-item' + (active ? ' fg-top-left-menu-item-active' : '');
  item.setAttribute('role', 'menuitemradio');
  item.setAttribute('aria-checked', active ? 'true' : 'false');
  item.setAttribute('data-action', 'set-sort-direction');
  item.setAttribute('data-sort-direction', String(value));
  item.setAttribute('data-field-key', fieldKey);
  icon.className = 'fg-top-left-menu-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = active ? '✓' : '';
  text.className = 'fg-top-left-menu-label';
  text.textContent = label;
  item.appendChild(icon);
  item.appendChild(text);
  return item;
}

function createShowAsMenuItem(value, label, active, fieldKey) {
  var item = document.createElement('button');
  var icon = document.createElement('span');
  var text = document.createElement('span');
  item.type = 'button';
  item.className = 'fg-top-left-menu-item' + (active ? ' fg-top-left-menu-item-active' : '');
  item.setAttribute('role', 'menuitemradio');
  item.setAttribute('aria-checked', active ? 'true' : 'false');
  item.setAttribute('data-action', 'set-show-as');
  item.setAttribute('data-show-as', value);
  item.setAttribute('data-field-key', fieldKey);
  icon.className = 'fg-top-left-menu-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = active ? '✓' : '';
  text.className = 'fg-top-left-menu-label';
  text.textContent = label;
  item.appendChild(icon);
  item.appendChild(text);
  return item;
}

function getPivotPanelValueKey(value) {
  if (value instanceof Date) {
    return 'date:' + value.toISOString();
  }
  if (typeof value === 'number' && isNaN(value)) {
    return 'number:NaN';
  }
  return typeof value + ':' + String(value);
}

export function createPivotPanelFactory(Control, registerControl, unregisterControl, PivotEngine, FabGrid) {
  var areaDefinitions = [
    { name: 'filterFields', labelKey: 'pivot.panel.filters' },
    { name: 'columnFields', labelKey: 'pivot.panel.columns' },
    { name: 'rowFields', labelKey: 'pivot.panel.rows' },
    { name: 'valueFields', labelKey: 'pivot.panel.values' }
  ];

  function PivotPanel(element, options) {
    var host = resolvePivotPanelHostElement(element);
    options = options || {};
    if (!host) {
      throw new TypeError('PivotPanel host element was not found.');
    }
    Control.call(this);
    this.hostElement = host;
    this.options = options;
    this.locale = options.locale || 'en';
    this.messages = options.messages || null;
    this.restrictDragging = options.restrictDragging === true;
    this._engine = null;
    this._dragFieldKey = null;
    this._dragSourceArea = null;
    this._dragTargetArea = null;
    this._dragTargetIndex = Infinity;
    this._dropIndicator = null;
    this._aggregateMenuFieldKey = null;
    this._sortMenuFieldKey = null;
    this._filterMenuFieldKey = null;
    this._filterMenuValues = [];
    this._filterDraftKeys = Object.create(null);
    this._touchDragState = null;
    this._documentPointerDownBound = false;
    this._documentPointerDownHandler = this._handleDocumentPointerDown.bind(this);
    this._touchPointerMoveHandler = this._handleTouchPointerMove.bind(this);
    this._touchPointerUpHandler = this._handleTouchPointerUp.bind(this);
    this._updatedHandler = this.refresh.bind(this);
    this._createDom();
    this._bindEvents();
    registerControl(host, this);
    if (options.itemsSource || options.engine) {
      this.setItemsSource(options.itemsSource || options.engine);
    } else {
      this.refresh();
    }
  }

  PivotPanel.prototype = Object.create(Control.prototype);
  PivotPanel.prototype.constructor = PivotPanel;

  PivotPanel.prototype._createDom = function() {
    var header = document.createElement('div');
    var availableTitle = document.createElement('div');
    var available = document.createElement('div');
    var areas = document.createElement('div');
    var aggregateMenu = document.createElement('div');
    var sortMenu = document.createElement('div');
    var filterMenu = document.createElement('div');
    var section;
    var title;
    var list;
    var i;
    this.hostElement.innerHTML = '';
    this.hostElement.classList.add('fg-root', 'fg-pivot-panel');
    this.hostElement.setAttribute('role', 'region');
    if (!this.hostElement.hasAttribute('tabindex')) {
      this.hostElement.setAttribute('tabindex', '0');
    }
    header.className = 'fg-pivot-panel-header';
    availableTitle.className = 'fg-pivot-panel-section-title';
    available.className = 'fg-pivot-panel-list fg-pivot-panel-fields';
    available.setAttribute('data-area', 'fields');
    available.setAttribute('role', 'listbox');
    header.appendChild(availableTitle);
    header.appendChild(available);
    areas.className = 'fg-pivot-panel-areas';
    this.areaLists = { fields: available };
    this.areaTitles = { fields: availableTitle };
    for (i = 0; i < areaDefinitions.length; i += 1) {
      section = document.createElement('section');
      title = document.createElement('div');
      list = document.createElement('div');
      section.className = 'fg-pivot-panel-section';
      title.className = 'fg-pivot-panel-section-title';
      list.className = 'fg-pivot-panel-list fg-pivot-panel-drop-list';
      list.setAttribute('data-area', areaDefinitions[i].name);
      list.setAttribute('role', 'listbox');
      section.appendChild(title);
      section.appendChild(list);
      areas.appendChild(section);
      this.areaLists[areaDefinitions[i].name] = list;
      this.areaTitles[areaDefinitions[i].name] = title;
    }
    this.hostElement.appendChild(header);
    this.hostElement.appendChild(areas);
    aggregateMenu.className = 'fg-top-left-menu fg-pivot-panel-aggregate-menu';
    aggregateMenu.setAttribute('role', 'menu');
    aggregateMenu.setAttribute('aria-hidden', 'true');
    this.hostElement.appendChild(aggregateMenu);
    sortMenu.className = 'fg-top-left-menu fg-pivot-panel-sort-menu';
    sortMenu.setAttribute('role', 'menu');
    sortMenu.setAttribute('aria-hidden', 'true');
    this.hostElement.appendChild(sortMenu);
    filterMenu.className = 'fg-top-left-menu fg-pivot-panel-filter-menu';
    filterMenu.setAttribute('role', 'dialog');
    filterMenu.setAttribute('aria-modal', 'false');
    filterMenu.setAttribute('aria-hidden', 'true');
    this.hostElement.appendChild(filterMenu);
    this.availableFields = available;
    this.areasElement = areas;
    this.aggregateMenu = aggregateMenu;
    this.sortMenu = sortMenu;
    this.filterMenu = filterMenu;
    this.applyLocaleToDom();
  };

  PivotPanel.prototype._bindEvents = function() {
    this.addEventListener(this.hostElement, 'change', this._handleChange.bind(this));
    this.addEventListener(this.hostElement, 'input', this._handleInput.bind(this));
    this.addEventListener(this.hostElement, 'click', this._handleClick.bind(this));
    this.addEventListener(this.hostElement, 'contextmenu', this._handleContextMenu.bind(this));
    this.addEventListener(this.hostElement, 'dragstart', this._handleDragStart.bind(this));
    this.addEventListener(this.hostElement, 'dragover', this._handleDragOver.bind(this));
    this.addEventListener(this.hostElement, 'dragleave', this._handleDragLeave.bind(this));
    this.addEventListener(this.hostElement, 'drop', this._handleDrop.bind(this));
    this.addEventListener(this.hostElement, 'dragend', this._clearDragState.bind(this));
    this.addEventListener(this.hostElement, 'pointerdown', this._handleTouchPointerDown.bind(this));
    this.addEventListener(this.hostElement, 'keydown', this._handleKeyDown.bind(this));
  };

  PivotPanel.prototype.getText = function(path, data) {
    var locales = FabGrid.locales || {};
    var localeName = this.locale || 'en';
    var baseName = localeName.split('-')[0];
    var text = getPivotPanelMessageValue(this.messages, path) ||
      getPivotPanelMessageValue(locales[localeName], path) ||
      getPivotPanelMessageValue(locales[baseName], path) ||
      getPivotPanelMessageValue(locales.en, path) || path;
    return formatPivotPanelMessage(text, data);
  };

  PivotPanel.prototype.applyLocaleToDom = function() {
    var i;
    this.hostElement.setAttribute('aria-label', this.getText('pivot.panel.ariaLabel'));
    this.aggregateMenu.setAttribute('aria-label', this.getText('pivot.panel.aggregateMenu'));
    this.sortMenu.setAttribute('aria-label', this.getText('pivot.panel.sortMenu'));
    this.filterMenu.setAttribute('aria-label', this.getText('pivot.panel.filterMenu'));
    this.areaTitles.fields.textContent = this.getText('pivot.panel.fields');
    this.areaLists.fields.setAttribute('aria-label', this.getText('pivot.panel.fields'));
    for (i = 0; i < areaDefinitions.length; i += 1) {
      this.areaTitles[areaDefinitions[i].name].textContent = this.getText(areaDefinitions[i].labelKey);
      this.areaLists[areaDefinitions[i].name].setAttribute('aria-label', this.getText(areaDefinitions[i].labelKey));
    }
  };

  PivotPanel.prototype.setLocale = function(locale, messages) {
    this.locale = locale || 'en';
    if (messages !== undefined) {
      this.messages = messages;
    }
    this.applyLocaleToDom();
    this.refresh();
    return this;
  };

  PivotPanel.prototype.setItemsSource = function(engine) {
    if (!(engine instanceof PivotEngine)) {
      throw new TypeError('PivotPanel itemsSource must be a fabui.pivot.PivotEngine instance.');
    }
    if (this._engine === engine) {
      return this;
    }
    if (this._engine && this._engine.updatedView) {
      this._engine.updatedView.removeHandler(this._updatedHandler, this);
    }
    this._engine = engine;
    engine.updatedView.addHandler(this._updatedHandler, this);
    this.refresh();
    return this;
  };

  PivotPanel.prototype._getAssignedArea = function(field) {
    var i;
    var index;
    if (!this._engine) {
      return null;
    }
    for (i = 0; i < areaDefinitions.length; i += 1) {
      index = this._engine[areaDefinitions[i].name].indexOf(field);
      if (index >= 0) {
        return areaDefinitions[i].name;
      }
    }
    return null;
  };

  PivotPanel.prototype._createFieldItem = function(field) {
    var item = document.createElement('div');
    var label = document.createElement('label');
    var checkbox = document.createElement('input');
    var type = document.createElement('span');
    var text = document.createElement('span');
    item.className = 'fg-pivot-panel-field';
    item.draggable = true;
    item.setAttribute('data-field-key', field.key);
    item.setAttribute('data-area-item', 'fields');
    item.setAttribute('role', 'option');
    checkbox.type = 'checkbox';
    checkbox.className = 'fg-pivot-panel-field-check';
    checkbox.checked = !!this._getAssignedArea(field);
    checkbox.setAttribute('data-field-key', field.key);
    type.className = 'fg-pivot-panel-field-type';
    type.textContent = field.dataType === 'number' ? '#' : field.dataType === 'date' ? '▣' : 'A';
    type.setAttribute('aria-hidden', 'true');
    text.className = 'fg-pivot-panel-field-label';
    text.textContent = field.header;
    label.appendChild(checkbox);
    label.appendChild(type);
    label.appendChild(text);
    item.appendChild(label);
    return item;
  };

  PivotPanel.prototype._createAreaItem = function(field, area) {
    var item = document.createElement('div');
    var drag = document.createElement('span');
    var label = document.createElement('span');
    var actions = document.createElement('span');
    item.className = 'fg-pivot-panel-item' + (area === 'valueFields' ? ' fg-pivot-panel-value-item' : '');
    item.draggable = true;
    item.setAttribute('data-field-key', field.key);
    item.setAttribute('data-area-item', area);
    item.setAttribute('role', 'option');
    drag.className = 'fg-pivot-panel-drag';
    drag.textContent = '⋮⋮';
    drag.setAttribute('aria-hidden', 'true');
    label.className = 'fg-pivot-panel-item-label';
    label.textContent = field.header;
    label.title = field.header;
    item.appendChild(drag);
    item.appendChild(label);
    actions.className = 'fg-pivot-panel-item-actions';
    if (area === 'filterFields') {
      actions.appendChild(createButton('filter', this.getText('pivot.panel.editFilter'), '⌕'));
    }
    actions.appendChild(createButton('remove', this.getText('pivot.panel.removeField'), '×'));
    item.appendChild(actions);
    return item;
  };

  PivotPanel.prototype._renderArea = function(area) {
    var list = this.areaLists[area];
    var fields = this._engine ? this._engine[area] : [];
    var empty;
    var i;
    list.innerHTML = '';
    if (!fields.length) {
      empty = document.createElement('div');
      empty.className = 'fg-pivot-panel-empty';
      empty.textContent = this.getText('pivot.panel.dropFields');
      list.appendChild(empty);
      return;
    }
    for (i = 0; i < fields.length; i += 1) {
      list.appendChild(this._createAreaItem(fields[i], area));
    }
  };

  PivotPanel.prototype.refresh = function() {
    var i;
    this.hideAggregateMenu();
    this.hideSortMenu();
    this.hideFilterMenu();
    this.availableFields.innerHTML = '';
    if (this._engine) {
      for (i = 0; i < this._engine.fields.length; i += 1) {
        this.availableFields.appendChild(this._createFieldItem(this._engine.fields[i]));
      }
    }
    if (!this.availableFields.children.length) {
      this.availableFields.innerHTML = '<div class="fg-pivot-panel-empty">' +
        this.getText('pivot.panel.noFields') + '</div>';
    }
    for (i = 0; i < areaDefinitions.length; i += 1) {
      this._renderArea(areaDefinitions[i].name);
    }
    return this;
  };

  PivotPanel.prototype._getAreaKeys = function(area) {
    return this._engine[area].map(function(field) {
      return field.key;
    });
  };

  PivotPanel.prototype._applyAreas = function(areas, property) {
    var i;
    if (!this._engine) {
      return;
    }
    for (i = 0; i < areaDefinitions.length; i += 1) {
      this._engine.setViewFields(areaDefinitions[i].name, areas[areaDefinitions[i].name], true);
    }
    this._engine.emit('viewDefinitionChanged', { property: property || 'fields' });
    this._engine.refresh();
  };

  PivotPanel.prototype.moveField = function(fieldReference, targetArea, targetIndex) {
    var field = this._engine && this._engine.getField(fieldReference);
    var areas = {};
    var keys;
    var index;
    var i;
    if (!field || !this.areaLists[targetArea]) {
      return false;
    }
    if (targetArea !== 'fields' && this.restrictDragging &&
      ((targetArea === 'valueFields' && field.dataType !== 'number') ||
      ((targetArea === 'rowFields' || targetArea === 'columnFields') && field.dataType === 'number'))) {
      return false;
    }
    for (i = 0; i < areaDefinitions.length; i += 1) {
      keys = this._getAreaKeys(areaDefinitions[i].name).filter(function(key) {
        return key !== field.key;
      });
      areas[areaDefinitions[i].name] = keys;
    }
    if (targetArea !== 'fields') {
      keys = areas[targetArea];
      index = Math.max(0, Math.min(keys.length, Number(targetIndex)));
      if (!isFinite(index)) {
        index = keys.length;
      }
      keys.splice(index, 0, field.key);
    }
    if (targetArea !== 'filterFields') {
      field.filter = null;
    }
    this._applyAreas(areas, targetArea);
    return true;
  };

  PivotPanel.prototype.removeField = function(fieldReference, area) {
    var field = this._engine && this._engine.getField(fieldReference);
    var areas = {};
    var i;
    if (!field || !this.areaLists[area] || area === 'fields') {
      return false;
    }
    for (i = 0; i < areaDefinitions.length; i += 1) {
      areas[areaDefinitions[i].name] = this._getAreaKeys(areaDefinitions[i].name);
    }
    areas[area] = areas[area].filter(function(key) { return key !== field.key; });
    if (area === 'filterFields') {
      field.filter = null;
    }
    this._applyAreas(areas, area);
    return true;
  };

  PivotPanel.prototype._handleChange = function(event) {
    var fieldKey = event.target.getAttribute('data-field-key');
    var filterKey = event.target.getAttribute('data-filter-value-key');
    var field;
    if (filterKey) {
      this._filterDraftKeys[filterKey] = event.target.checked;
      this._renderFilterMenuValues();
      return;
    }
    if (event.target.hasAttribute('data-filter-select-all')) {
      this._setVisibleFilterDraft(event.target.checked);
      return;
    }
    if (event.target.classList.contains('fg-pivot-panel-field-check')) {
      field = this._engine && this._engine.getField(fieldKey);
      if (event.target.checked && field) {
        this.moveField(field, field.dataType === 'number' ? 'valueFields' : 'rowFields', Infinity);
      } else if (field) {
        this.moveField(field, 'fields', 0);
      }
    }
  };

  PivotPanel.prototype._handleInput = function(event) {
    if (event.target.classList.contains('fg-pivot-panel-filter-search')) {
      this._renderFilterMenuValues();
    }
  };

  PivotPanel.prototype._handleClick = function(event) {
    var actionElement = closestWithAttribute(event.target, 'data-action', this.hostElement);
    var item;
    var action;
    var area;
    var fieldKey;
    if (!actionElement || actionElement.tagName === 'SELECT') {
      return;
    }
    action = actionElement.getAttribute('data-action');
    if (action === 'filter-apply') {
      event.preventDefault();
      this.applyFilterMenu();
      return;
    }
    if (action === 'filter-cancel') {
      event.preventDefault();
      this.hideFilterMenu();
      return;
    }
    item = closestWithAttribute(actionElement, 'data-field-key', this.hostElement);
    if (!item) {
      return;
    }
    event.preventDefault();
    area = item.getAttribute('data-area-item');
    fieldKey = item.getAttribute('data-field-key');
    if (action === 'set-aggregate') {
      this.setAggregate(fieldKey, actionElement.getAttribute('data-aggregate'));
      this.hideAggregateMenu();
    } else if (action === 'set-show-as') {
      this.setShowAs(fieldKey, actionElement.getAttribute('data-show-as'));
      this.hideAggregateMenu();
    } else if (action === 'set-sort-direction') {
      this.setSortDirection(fieldKey, Number(actionElement.getAttribute('data-sort-direction')));
      this.hideSortMenu();
    } else if (action === 'remove') {
      this.removeField(fieldKey, area);
    } else if (action === 'filter') {
      this.hideAggregateMenu();
      this.hideSortMenu();
      this.showFilterMenu(fieldKey, actionElement);
    }
  };

  PivotPanel.prototype.setAggregate = function(fieldReference, aggregate) {
    var field = this._engine && this._engine.getField(fieldReference);
    var values = ['Sum', 'Count', 'Average', 'WeightedAverage', 'Min', 'Max'];
    if (!field || values.indexOf(aggregate) < 0 || this._engine.valueFields.indexOf(field) < 0) {
      return false;
    }
    if (field.aggregate === aggregate) {
      return true;
    }
    field.aggregate = aggregate;
    this._engine.emit('viewDefinitionChanged', { property: 'aggregate', field: field });
    this._engine.refresh();
    return true;
  };

  PivotPanel.prototype.setSortDirection = function(fieldReference, direction) {
    var field = this._engine && this._engine.getField(fieldReference);
    var normalized = normalizePivotPanelSortDirection(direction);
    if (!field || (this._engine.rowFields.indexOf(field) < 0 && this._engine.columnFields.indexOf(field) < 0)) {
      return false;
    }
    if (normalizePivotPanelSortDirection(field.sortDirection) === normalized) {
      return true;
    }
    field.sortDirection = normalized;
    this._engine.emit('viewDefinitionChanged', { property: 'sortDirection', field: field });
    this._engine.refresh();
    return true;
  };

  PivotPanel.prototype.setShowAs = function(fieldReference, showAs) {
    var field = this._engine && this._engine.getField(fieldReference);
    var values = [
      'NoCalculation',
      'PercentOfGrandTotal',
      'PercentOfRowTotal',
      'PercentOfColumnTotal',
      'DifferenceFromPrevious',
      'PercentDifferenceFromPrevious',
      'RunningTotal'
    ];
    if (!field || values.indexOf(showAs) < 0 || this._engine.valueFields.indexOf(field) < 0) {
      return false;
    }
    if (field.showAs === showAs) {
      return true;
    }
    field.showAs = showAs;
    this._engine.emit('viewDefinitionChanged', { property: 'showAs', field: field });
    this._engine.refresh();
    return true;
  };

  PivotPanel.prototype._handleContextMenu = function(event) {
    var item = closestWithAttribute(event.target, 'data-field-key', this.hostElement);
    var area = item && item.getAttribute('data-area-item');
    var field = item && this._engine ? this._engine.getField(item.getAttribute('data-field-key')) : null;
    if (field && area === 'valueFields') {
      event.preventDefault();
      event.stopPropagation();
      this.hideSortMenu();
      this.showAggregateMenu(field, event.clientX, event.clientY);
      return;
    }
    if (field && (area === 'rowFields' || area === 'columnFields')) {
      event.preventDefault();
      event.stopPropagation();
      this.hideAggregateMenu();
      this.showSortMenu(field, event.clientX, event.clientY);
      return;
    }
    this.hideAggregateMenu();
    this.hideSortMenu();
  };

  PivotPanel.prototype.showAggregateMenu = function(fieldReference, clientX, clientY) {
    var field = this._engine && this._engine.getField(fieldReference);
    var values = ['Sum', 'Count', 'Average', 'WeightedAverage', 'Min', 'Max'];
    var showAsValues = [
      'NoCalculation',
      'PercentOfGrandTotal',
      'PercentOfRowTotal',
      'PercentOfColumnTotal',
      'DifferenceFromPrevious',
      'PercentDifferenceFromPrevious',
      'RunningTotal'
    ];
    var title;
    var showAsTitle;
    var hostRect;
    var left;
    var top;
    var i;
    if (!field || this._engine.valueFields.indexOf(field) < 0) {
      return false;
    }
    this.aggregateMenu.innerHTML = '';
    title = document.createElement('div');
    title.className = 'fg-pivot-panel-menu-title';
    title.textContent = field.header;
    title.title = field.header;
    this.aggregateMenu.appendChild(title);
    for (i = 0; i < values.length; i += 1) {
      this.aggregateMenu.appendChild(createAggregateMenuItem(
        values[i],
        this.getText('pivot.aggregates.' + values[i].toLowerCase()),
        field.aggregate === values[i],
        field.key
      ));
    }
    showAsTitle = document.createElement('div');
    showAsTitle.className = 'fg-pivot-panel-menu-title';
    showAsTitle.textContent = this.getText('pivot.panel.showAs');
    this.aggregateMenu.appendChild(showAsTitle);
    for (i = 0; i < showAsValues.length; i += 1) {
      this.aggregateMenu.appendChild(createShowAsMenuItem(
        showAsValues[i],
        this.getText('pivot.showAs.' + showAsValues[i].replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()),
        field.showAs === showAsValues[i],
        field.key
      ));
    }
    this._aggregateMenuFieldKey = field.key;
    this.aggregateMenu.setAttribute('aria-label', this.getText('pivot.panel.aggregateField', { field: field.header }));
    this.aggregateMenu.style.display = 'block';
    this.aggregateMenu.setAttribute('aria-hidden', 'false');
    hostRect = this.hostElement.getBoundingClientRect();
    left = Number(clientX) - hostRect.left;
    top = Number(clientY) - hostRect.top;
    if (!isFinite(left)) left = 0;
    if (!isFinite(top)) top = 0;
    left = Math.max(0, Math.min(left, this.hostElement.clientWidth - this.aggregateMenu.offsetWidth));
    top = Math.max(0, Math.min(top, this.hostElement.clientHeight - this.aggregateMenu.offsetHeight));
    this.aggregateMenu.style.left = left + 'px';
    this.aggregateMenu.style.top = top + 'px';
    this._syncDocumentMenuPointerListener();
    this.hostElement.focus({ preventScroll: true });
    return true;
  };

  PivotPanel.prototype.hideAggregateMenu = function() {
    if (this.aggregateMenu) {
      this.aggregateMenu.style.display = 'none';
      this.aggregateMenu.setAttribute('aria-hidden', 'true');
    }
    this._aggregateMenuFieldKey = null;
    this._syncDocumentMenuPointerListener();
  };

  PivotPanel.prototype.isAggregateMenuOpen = function() {
    return !!(this.aggregateMenu && this.aggregateMenu.style.display === 'block');
  };

  PivotPanel.prototype.showSortMenu = function(fieldReference, clientX, clientY) {
    var field = this._engine && this._engine.getField(fieldReference);
    var direction;
    var values = [0, 1, -1];
    var labels = [
      'pivot.panel.sortDefault',
      'pivot.sortAscending',
      'pivot.sortDescending'
    ];
    var title;
    var hostRect;
    var left;
    var top;
    var i;
    if (!field || (this._engine.rowFields.indexOf(field) < 0 && this._engine.columnFields.indexOf(field) < 0)) {
      return false;
    }
    direction = normalizePivotPanelSortDirection(field.sortDirection);
    this.sortMenu.innerHTML = '';
    title = document.createElement('div');
    title.className = 'fg-pivot-panel-menu-title';
    title.textContent = field.header;
    title.title = field.header;
    this.sortMenu.appendChild(title);
    for (i = 0; i < values.length; i += 1) {
      this.sortMenu.appendChild(createSortMenuItem(
        values[i],
        this.getText(labels[i]),
        direction === values[i],
        field.key
      ));
    }
    this._sortMenuFieldKey = field.key;
    this.sortMenu.setAttribute('aria-label', this.getText('pivot.panel.sortField', { field: field.header }));
    this.sortMenu.style.display = 'block';
    this.sortMenu.setAttribute('aria-hidden', 'false');
    hostRect = this.hostElement.getBoundingClientRect();
    left = Number(clientX) - hostRect.left;
    top = Number(clientY) - hostRect.top;
    if (!isFinite(left)) left = 0;
    if (!isFinite(top)) top = 0;
    left = Math.max(0, Math.min(left, this.hostElement.clientWidth - this.sortMenu.offsetWidth));
    top = Math.max(0, Math.min(top, this.hostElement.clientHeight - this.sortMenu.offsetHeight));
    this.sortMenu.style.left = left + 'px';
    this.sortMenu.style.top = top + 'px';
    this._syncDocumentMenuPointerListener();
    this.hostElement.focus({ preventScroll: true });
    return true;
  };

  PivotPanel.prototype.hideSortMenu = function() {
    if (this.sortMenu) {
      this.sortMenu.style.display = 'none';
      this.sortMenu.setAttribute('aria-hidden', 'true');
    }
    this._sortMenuFieldKey = null;
    this._syncDocumentMenuPointerListener();
  };

  PivotPanel.prototype.isSortMenuOpen = function() {
    return !!(this.sortMenu && this.sortMenu.style.display === 'block');
  };

  PivotPanel.prototype.showFilterMenu = function(fieldReference, trigger) {
    var field = this._engine && this._engine.getField(fieldReference);
    var selected;
    var title;
    var search;
    var selectAllLabel;
    var selectAll;
    var selectAllText;
    var values;
    var footer;
    var cancel;
    var apply;
    var hostRect;
    var triggerRect;
    var left;
    var top;
    var i;
    if (!field || this._engine.filterFields.indexOf(field) < 0) {
      return false;
    }
    this._filterMenuFieldKey = field.key;
    this._filterMenuValues = getPivotSlicerValues(this._engine, field);
    selected = field.filter && Array.isArray(field.filter.values) ?
      field.filter.values : this._filterMenuValues;
    this._filterDraftKeys = Object.create(null);
    for (i = 0; i < selected.length; i += 1) {
      this._filterDraftKeys[getPivotPanelValueKey(selected[i])] = true;
    }
    this.filterMenu.innerHTML = '';
    title = document.createElement('div');
    title.className = 'fg-pivot-panel-menu-title';
    title.textContent = field.header;
    search = document.createElement('input');
    search.type = 'search';
    search.className = 'fg-pivot-panel-filter-search';
    search.placeholder = this.getText('pivot.panel.searchValues');
    selectAllLabel = document.createElement('label');
    selectAllLabel.className = 'fg-pivot-panel-filter-select-all';
    selectAll = document.createElement('input');
    selectAll.type = 'checkbox';
    selectAll.setAttribute('data-filter-select-all', '');
    selectAllText = document.createElement('span');
    selectAllText.textContent = this.getText('pivot.panel.selectAll');
    selectAllLabel.appendChild(selectAll);
    selectAllLabel.appendChild(selectAllText);
    values = document.createElement('div');
    values.className = 'fg-pivot-panel-filter-values';
    values.setAttribute('role', 'listbox');
    values.setAttribute('aria-multiselectable', 'true');
    footer = document.createElement('div');
    footer.className = 'fg-pivot-panel-filter-footer';
    cancel = createButton('filter-cancel', this.getText('pivot.panel.cancel'), this.getText('pivot.panel.cancel'));
    apply = createButton('filter-apply', this.getText('pivot.panel.apply'), this.getText('pivot.panel.apply'));
    footer.appendChild(cancel);
    footer.appendChild(apply);
    this.filterMenu.appendChild(title);
    this.filterMenu.appendChild(search);
    this.filterMenu.appendChild(selectAllLabel);
    this.filterMenu.appendChild(values);
    this.filterMenu.appendChild(footer);
    this.filterMenuSearch = search;
    this.filterMenuSelectAll = selectAll;
    this.filterMenuValuesElement = values;
    this._renderFilterMenuValues();
    this.filterMenu.style.display = 'flex';
    this.filterMenu.setAttribute('aria-hidden', 'false');
    hostRect = this.hostElement.getBoundingClientRect();
    triggerRect = trigger && trigger.getBoundingClientRect ? trigger.getBoundingClientRect() : hostRect;
    left = triggerRect.left - hostRect.left;
    top = triggerRect.bottom - hostRect.top;
    left = Math.max(0, Math.min(left, this.hostElement.clientWidth - this.filterMenu.offsetWidth));
    top = Math.max(0, Math.min(top, this.hostElement.clientHeight - this.filterMenu.offsetHeight));
    this.filterMenu.style.left = left + 'px';
    this.filterMenu.style.top = top + 'px';
    this._syncDocumentMenuPointerListener();
    search.focus({ preventScroll: true });
    return true;
  };

  PivotPanel.prototype._renderFilterMenuValues = function() {
    var field = this._engine && this._engine.getField(this._filterMenuFieldKey);
    var search;
    var value;
    var key;
    var text;
    var label;
    var input;
    var visibleCount = 0;
    var selectedCount = 0;
    var i;
    if (!field || !this.filterMenuValuesElement) {
      return;
    }
    search = String(this.filterMenuSearch.value || '').toLowerCase();
    this.filterMenuValuesElement.innerHTML = '';
    for (i = 0; i < this._filterMenuValues.length; i += 1) {
      value = this._filterMenuValues[i];
      key = getPivotPanelValueKey(value);
      text = this._engine.formatFieldValue(field, value, this.locale) || this.getText('pivot.panel.blankValue');
      if (search && text.toLowerCase().indexOf(search) < 0) {
        continue;
      }
      label = document.createElement('label');
      label.className = 'fg-pivot-panel-filter-value';
      label.setAttribute('role', 'option');
      input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = this._filterDraftKeys[key] === true;
      input.setAttribute('data-filter-value-key', key);
      label.setAttribute('aria-selected', input.checked ? 'true' : 'false');
      label.appendChild(input);
      label.appendChild(document.createTextNode(text));
      this.filterMenuValuesElement.appendChild(label);
      visibleCount += 1;
      if (input.checked) selectedCount += 1;
    }
    this.filterMenuSelectAll.checked = visibleCount > 0 && selectedCount === visibleCount;
    this.filterMenuSelectAll.indeterminate = selectedCount > 0 && selectedCount < visibleCount;
  };

  PivotPanel.prototype._setVisibleFilterDraft = function(selected) {
    var inputs = this.filterMenuValuesElement ?
      this.filterMenuValuesElement.querySelectorAll('input[data-filter-value-key]') : [];
    var i;
    for (i = 0; i < inputs.length; i += 1) {
      this._filterDraftKeys[inputs[i].getAttribute('data-filter-value-key')] = selected;
    }
    this._renderFilterMenuValues();
  };

  PivotPanel.prototype.applyFilterMenu = function() {
    var field = this._engine && this._engine.getField(this._filterMenuFieldKey);
    var selected;
    if (!field) {
      return false;
    }
    selected = this._filterMenuValues.filter(function(value) {
      return this._filterDraftKeys[getPivotPanelValueKey(value)] === true;
    }, this);
    field.filter = selected.length === this._filterMenuValues.length ? null : { values: selected };
    this.hideFilterMenu();
    this._engine.emit('viewDefinitionChanged', { property: 'filter', field: field });
    this._engine.refresh();
    return true;
  };

  PivotPanel.prototype.hideFilterMenu = function() {
    if (this.filterMenu) {
      this.filterMenu.style.display = 'none';
      this.filterMenu.setAttribute('aria-hidden', 'true');
    }
    this._filterMenuFieldKey = null;
    this._filterMenuValues = [];
    this._filterDraftKeys = Object.create(null);
    this.filterMenuSearch = null;
    this.filterMenuSelectAll = null;
    this.filterMenuValuesElement = null;
    this._syncDocumentMenuPointerListener();
  };

  PivotPanel.prototype.isFilterMenuOpen = function() {
    return !!(this.filterMenu && this.filterMenu.style.display === 'flex');
  };

  PivotPanel.prototype._syncDocumentMenuPointerListener = function() {
    var shouldBind = this.isAggregateMenuOpen() || this.isSortMenuOpen() || this.isFilterMenuOpen();
    if (shouldBind && !this._documentPointerDownBound) {
      this.addEventListener(document, 'pointerdown', this._documentPointerDownHandler);
      this._documentPointerDownBound = true;
    } else if (!shouldBind && this._documentPointerDownBound) {
      this.removeEventListener(document, 'pointerdown', this._documentPointerDownHandler);
      this._documentPointerDownBound = false;
    }
  };

  PivotPanel.prototype._handleDocumentPointerDown = function(event) {
    if (this.isAggregateMenuOpen() && !this.aggregateMenu.contains(event.target)) {
      this.hideAggregateMenu();
    }
    if (this.isSortMenuOpen() && !this.sortMenu.contains(event.target)) {
      this.hideSortMenu();
    }
    if (this.isFilterMenuOpen() && !this.filterMenu.contains(event.target)) {
      this.hideFilterMenu();
    }
  };

  PivotPanel.prototype._handleDragStart = function(event) {
    var item = closestWithAttribute(event.target, 'data-field-key', this.hostElement);
    if (!item) {
      return;
    }
    this._dragFieldKey = item.getAttribute('data-field-key');
    this._dragSourceArea = item.getAttribute('data-area-item');
    item.classList.add('fg-pivot-panel-dragging');
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', this._dragFieldKey);
    }
  };

  PivotPanel.prototype._handleDragOver = function(event) {
    var list = closestWithAttribute(event.target, 'data-area', this.hostElement);
    var area;
    if (!list || !this._dragFieldKey) {
      return;
    }
    event.preventDefault();
    area = list.getAttribute('data-area');
    this._showDropIndicator(list, area, event.clientY);
    list.classList.add('fg-pivot-panel-drop-active');
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  };

  PivotPanel.prototype._handleDragLeave = function(event) {
    var list = closestWithAttribute(event.target, 'data-area', this.hostElement);
    if (list && (!event.relatedTarget || !list.contains(event.relatedTarget))) {
      list.classList.remove('fg-pivot-panel-drop-active');
      if (this._dragTargetArea === list.getAttribute('data-area')) {
        this._clearDropIndicator();
      }
    }
  };

  PivotPanel.prototype._showDropIndicator = function(list, area, clientY) {
    var items;
    var candidates = [];
    var indicator;
    var anchor = null;
    var index;
    var rect;
    var i;
    this._clearDropIndicator();
    this._dragTargetArea = area;
    if (area === 'fields') {
      this._dragTargetIndex = Infinity;
      return Infinity;
    }
    items = list.querySelectorAll('[data-area-item="' + area + '"]');
    for (i = 0; i < items.length; i += 1) {
      if (items[i].getAttribute('data-field-key') !== this._dragFieldKey) {
        candidates.push(items[i]);
      }
    }
    index = candidates.length;
    for (i = 0; i < candidates.length; i += 1) {
      rect = candidates[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        index = i;
        anchor = candidates[i];
        break;
      }
    }
    indicator = document.createElement('div');
    indicator.className = 'fg-pivot-panel-insert-line';
    indicator.setAttribute('aria-hidden', 'true');
    if (anchor) {
      list.insertBefore(indicator, anchor);
    } else {
      list.appendChild(indicator);
    }
    this._dropIndicator = indicator;
    this._dragTargetIndex = index;
    return index;
  };

  PivotPanel.prototype._clearDropIndicator = function() {
    if (this._dropIndicator && this._dropIndicator.parentNode) {
      this._dropIndicator.parentNode.removeChild(this._dropIndicator);
    }
    this._dropIndicator = null;
    this._dragTargetArea = null;
    this._dragTargetIndex = Infinity;
  };

  PivotPanel.prototype._handleDrop = function(event) {
    var list = closestWithAttribute(event.target, 'data-area', this.hostElement);
    var area;
    var index = Infinity;
    if (!list || !this._dragFieldKey) {
      return;
    }
    event.preventDefault();
    area = list.getAttribute('data-area');
    if (area !== 'fields') {
      index = this._dragTargetArea === area ? this._dragTargetIndex :
        this._showDropIndicator(list, area, event.clientY);
    }
    this.moveField(this._dragFieldKey, area, index);
    this._clearDragState();
  };

  PivotPanel.prototype._handleKeyDown = function(event) {
    if (event.key === 'Escape' &&
        (this.isAggregateMenuOpen() || this.isSortMenuOpen() || this.isFilterMenuOpen())) {
      event.preventDefault();
      event.stopPropagation();
      if (this.isAggregateMenuOpen()) this.hideAggregateMenu();
      if (this.isSortMenuOpen()) this.hideSortMenu();
      if (this.isFilterMenuOpen()) this.hideFilterMenu();
      return;
    }
    if (event.key === 'Escape' && this._dragFieldKey) {
      event.preventDefault();
      this._clearDragState();
    }
  };

  PivotPanel.prototype._handleTouchPointerDown = function(event) {
    var dragHandle;
    var item;
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') {
      return;
    }
    dragHandle = event.target.closest ? event.target.closest('.fg-pivot-panel-drag') : null;
    item = dragHandle && closestWithAttribute(dragHandle, 'data-field-key', this.hostElement);
    if (!item) {
      return;
    }
    event.preventDefault();
    this._dragFieldKey = item.getAttribute('data-field-key');
    this._dragSourceArea = item.getAttribute('data-area-item');
    this._touchDragState = {
      pointerId: event.pointerId
    };
    item.classList.add('fg-pivot-panel-dragging');
    document.addEventListener('pointermove', this._touchPointerMoveHandler, false);
    document.addEventListener('pointerup', this._touchPointerUpHandler, false);
    document.addEventListener('pointercancel', this._touchPointerUpHandler, false);
  };

  PivotPanel.prototype._handleTouchPointerMove = function(event) {
    var target;
    var list;
    var area;
    if (!this._touchDragState ||
        (this._touchDragState.pointerId != null && event.pointerId !== this._touchDragState.pointerId)) {
      return;
    }
    event.preventDefault();
    target = document.elementFromPoint(event.clientX, event.clientY);
    list = closestWithAttribute(target, 'data-area', this.hostElement);
    if (!list) {
      this._clearDropIndicator();
      return;
    }
    area = list.getAttribute('data-area');
    this._showDropIndicator(list, area, event.clientY);
    list.classList.add('fg-pivot-panel-drop-active');
  };

  PivotPanel.prototype._handleTouchPointerUp = function(event) {
    var area;
    var index;
    if (!this._touchDragState ||
        (this._touchDragState.pointerId != null && event.pointerId !== this._touchDragState.pointerId)) {
      return;
    }
    if (event.type !== 'pointercancel' && this._dragTargetArea) {
      area = this._dragTargetArea;
      index = area === 'fields' ? Infinity : this._dragTargetIndex;
      this.moveField(this._dragFieldKey, area, index);
    }
    this._clearDragState();
  };

  PivotPanel.prototype._unbindTouchDragListeners = function() {
    document.removeEventListener('pointermove', this._touchPointerMoveHandler, false);
    document.removeEventListener('pointerup', this._touchPointerUpHandler, false);
    document.removeEventListener('pointercancel', this._touchPointerUpHandler, false);
    this._touchDragState = null;
  };

  PivotPanel.prototype._clearDragState = function() {
    var active = this.hostElement.querySelectorAll('.fg-pivot-panel-dragging, .fg-pivot-panel-drop-active');
    var i;
    this._clearDropIndicator();
    for (i = 0; i < active.length; i += 1) {
      active[i].classList.remove('fg-pivot-panel-dragging', 'fg-pivot-panel-drop-active');
    }
    this._dragFieldKey = null;
    this._dragSourceArea = null;
    this._unbindTouchDragListeners();
  };

  PivotPanel.prototype.dispose = function() {
    if (this._engine && this._engine.updatedView) {
      this._engine.updatedView.removeHandler(this._updatedHandler, this);
    }
    this.hideAggregateMenu();
    this.hideSortMenu();
    this.hideFilterMenu();
    this._unbindTouchDragListeners();
    this.removeEventListener();
    unregisterControl(this.hostElement, this);
    this.hostElement.innerHTML = '';
    this.hostElement.classList.remove('fg-root', 'fg-pivot-panel');
    this._engine = null;
  };

  Object.defineProperties(PivotPanel.prototype, {
    itemsSource: {
      get: function() { return this._engine; },
      set: function(value) { this.setItemsSource(value); }
    },
    engine: {
      get: function() { return this._engine; },
      set: function(value) { this.setItemsSource(value); }
    },
    fields: { get: function() { return this._engine ? this._engine.fields : []; } },
    filterFields: { get: function() { return this._engine ? this._engine.filterFields : []; } },
    rowFields: { get: function() { return this._engine ? this._engine.rowFields : []; } },
    columnFields: { get: function() { return this._engine ? this._engine.columnFields : []; } },
    valueFields: { get: function() { return this._engine ? this._engine.valueFields : []; } },
    isViewDefined: {
      get: function() {
        return !!(this._engine && this._engine.valueFields.length &&
          (this._engine.rowFields.length || this._engine.columnFields.length));
      }
    },
    viewDefinition: {
      get: function() {
        return this._engine ? JSON.stringify(this._engine.viewDefinition) : '';
      },
      set: function(value) {
        var definition = typeof value === 'string' ? JSON.parse(value) : value;
        if (this._engine) {
          this._engine.viewDefinition = definition;
        }
      }
    }
  });

  return PivotPanel;
}
import { getPivotSlicerValues } from './pivot-slicer.js?v=20260717-pivot-advanced-v1';
