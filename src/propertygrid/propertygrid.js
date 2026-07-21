var PROPERTYGRID_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];

function propertyGridAssign(target) {
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

function propertyGridBoolean(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    value = value.trim().toLowerCase();
    if (value === 'false' || value === '0' || value === 'no') return false;
    if (value === 'true' || value === '1' || value === 'yes' || value === '') return true;
  }
  return Boolean(value);
}

function propertyGridSize(value) {
  if (value == null || value === '' || value === 'auto') return 'auto';
  return typeof value === 'number' ? value + 'px' : String(value);
}

function resolvePropertyGridElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function normalizePropertyGridLocale(value) {
  value = String(value || 'en').trim().replace(/_/g, '-');
  if (/^zh-(?:TW|Hant)(?:-|$)/i.test(value)) return 'zh-TW';
  if (/^zh-(?:CN|Hans)(?:-|$)/i.test(value) || /^zh$/i.test(value)) return 'zh-CN';
  return 'en';
}

export function normalizePropertyGridTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return PROPERTYGRID_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

function findPropertyGridTheme(element) {
  var current = resolvePropertyGridElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < PROPERTYGRID_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + PROPERTYGRID_THEMES[index])) {
        return PROPERTYGRID_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

function clonePropertyRow(row) {
  var copy = {};
  var key;
  row = row && typeof row === 'object' ? row : {};
  for (key in row) {
    if (Object.prototype.hasOwnProperty.call(row, key)) copy[key] = row[key];
  }
  return copy;
}

export function normalizePropertyGridData(data) {
  var rows = Array.isArray(data) ? data : data && Array.isArray(data.rows) ? data.rows : [];
  return rows.map(clonePropertyRow);
}

export function buildPropertyGridGroups(rows, groupField) {
  var groups = [];
  var groupMap = Object.create(null);
  var key;
  var record;
  (Array.isArray(rows) ? rows : []).forEach(function(row, index) {
    key = String(row && row[groupField] != null ? row[groupField] : '');
    record = groupMap[key];
    if (!record) {
      record = {
        value: key,
        rows: [],
        startIndex: index,
        collapsed: false
      };
      groupMap[key] = record;
      groups.push(record);
    }
    record.rows.push(row);
  });
  return groups;
}

export function normalizePropertyEditor(editor) {
  var result;
  var type;
  if (!editor) return null;
  result = typeof editor === 'string' ? { type: editor } : propertyGridAssign({}, editor);
  type = String(result.type || 'text').toLowerCase();
  if (type === 'textbox') type = 'text';
  if (type === 'numberbox' || type === 'numeric') type = 'number';
  if (type === 'datebox' || type === 'calendar') type = 'date';
  if (type === 'combobox' || type === 'select') type = 'combo';
  if (type === 'colorbox' || type === 'colour' || type === 'colourbox') type = 'color';
  if (type === 'checkbox' || type === 'bool') type = 'boolean';
  if (['text', 'number', 'date', 'combo', 'color', 'boolean'].indexOf(type) < 0) {
    type = 'text';
  }
  result.type = type;
  result.options = propertyGridAssign({}, result.options || {});
  return result;
}

function restorePropertyGridAttribute(element, name, value) {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

function escapePropertyGridHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function propertyGridValueEqual(first, second) {
  if (first === second) return true;
  if (first instanceof Date && second instanceof Date) {
    return first.getTime() === second.getTime();
  }
  return false;
}

export function createPropertyGridFactory(Control, registerControl, unregisterControl, EditBox) {
  var defaults = {
    width: 'auto',
    height: 'auto',
    fit: false,
    border: true,
    showHeader: true,
    showGroup: false,
    groupField: 'group',
    nameField: 'name',
    valueField: 'value',
    rowHeight: 28,
    striped: false,
    editable: true,
    columns: null,
    data: [],
    url: null,
    method: 'get',
    queryParams: {},
    loader: null,
    loadFilter: null,
    groupFormatter: null,
    locale: 'en',
    theme: 'inherit',
    ariaLabel: '',
    onBeforeLoad: null,
    onLoadSuccess: null,
    onLoadError: null,
    onBeforeSelect: null,
    onSelect: null,
    onUnselect: null,
    onClickRow: null,
    onDblClickRow: null,
    onClickCell: null,
    onDblClickCell: null,
    onBeforeEdit: null,
    onBeginEdit: null,
    onAfterEdit: null,
    onCancelEdit: null,
    onChange: null
  };
  var localePacks = {
    en: {
      propertyGrid: 'Property grid',
      name: 'Name',
      value: 'Value',
      expandGroup: 'Expand {group}',
      collapseGroup: 'Collapse {group}',
      trueText: 'True',
      falseText: 'False',
      loadError: 'Unable to load property data.'
    },
    'zh-TW': {
      propertyGrid: '屬性表',
      name: '名稱',
      value: '值',
      expandGroup: '展開{group}',
      collapseGroup: '收合{group}',
      trueText: '是',
      falseText: '否',
      loadError: '無法載入屬性資料。'
    },
    'zh-CN': {
      propertyGrid: '属性表',
      name: '名称',
      value: '值',
      expandGroup: '展开{group}',
      collapseGroup: '收起{group}',
      trueText: '是',
      falseText: '否',
      loadError: '无法加载属性数据。'
    }
  };

  function PropertyGrid(element, options) {
    if (!(this instanceof PropertyGrid)) return new PropertyGrid(element, options);
    this.hostElement = resolvePropertyGridElement(element);
    if (!this.hostElement) throw new Error('fabui.PropertyGrid requires a host element.');
    if (this.hostElement.__fabuiPropertyGrid) return this.hostElement.__fabuiPropertyGrid;
    Control.call(this);
    this._listeners = {};
    this._selectedIndex = -1;
    this._editingIndex = -1;
    this._editor = null;
    this._editorElement = null;
    this._editorType = '';
    this._editorOriginalValue = null;
    this._sort = null;
    this._collapsedGroups = Object.create(null);
    this._changes = { inserted: [], updated: [], deleted: [] };
    this._destroyed = false;
    this._loadSequence = 0;
    this._original = {
      html: this.hostElement.innerHTML,
      className: this.hostElement.getAttribute('class'),
      style: this.hostElement.getAttribute('style'),
      role: this.hostElement.getAttribute('role'),
      ariaLabel: this.hostElement.getAttribute('aria-label')
    };
    this._themeSource = this.hostElement.parentElement || document.body;
    this._options = propertyGridAssign({}, defaults, this._readElementOptions(), options || {});
    this._normalizeOptions();
    this._rows = normalizePropertyGridData(this._options.data);
    this._acceptedRows = this._rows.map(clonePropertyRow);
    this._build();
    this._bind();
    this.render();
    this.hostElement.__fabuiPropertyGrid = this;
    registerControl(this.hostElement, this);
    this.setTheme(this._options.theme);
    if (!this._rows.length && (this._options.url || this._options.loader)) this.reload();
  }

  PropertyGrid.prototype = Object.create(Control.prototype);
  PropertyGrid.prototype.constructor = PropertyGrid;

  PropertyGrid.prototype._readElementOptions = function() {
    var host = this.hostElement;
    var result = {};
    var value;
    value = host.getAttribute('data-theme') || host.getAttribute('theme');
    if (value) result.theme = value;
    value = host.getAttribute('data-locale') || host.getAttribute('locale');
    if (value) result.locale = value;
    value = host.getAttribute('data-url') || host.getAttribute('url');
    if (value) result.url = value;
    value = host.getAttribute('aria-label');
    if (value) result.ariaLabel = value;
    ['fit', 'border', 'showHeader', 'showGroup', 'striped', 'editable'].forEach(function(name) {
      var attribute = host.getAttribute('data-' + name.replace(/[A-Z]/g, function(letter) {
        return '-' + letter.toLowerCase();
      }));
      if (attribute != null) result[name] = propertyGridBoolean(attribute, false);
    });
    return result;
  };

  PropertyGrid.prototype._normalizeOptions = function() {
    this._options.fit = propertyGridBoolean(this._options.fit, false);
    this._options.border = propertyGridBoolean(this._options.border, true);
    this._options.showHeader = propertyGridBoolean(this._options.showHeader, true);
    this._options.showGroup = propertyGridBoolean(this._options.showGroup, false);
    this._options.striped = propertyGridBoolean(this._options.striped, false);
    this._options.editable = propertyGridBoolean(this._options.editable, true);
    this._options.rowHeight = Math.max(24, Number(this._options.rowHeight) || 28);
    this._options.locale = normalizePropertyGridLocale(this._options.locale);
    this._options.method = String(this._options.method || 'get').toLowerCase();
  };

  PropertyGrid.prototype._text = function(key, values) {
    var pack = localePacks[this._options.locale] || localePacks.en;
    return String(pack[key] || localePacks.en[key] || key).replace(/\{([^}]+)\}/g, function(match, name) {
      return values && values[name] != null ? values[name] : match;
    });
  };

  PropertyGrid.prototype._columns = function() {
    var configured = this._options.columns;
    var columns;
    if (Array.isArray(configured) && Array.isArray(configured[0])) configured = configured[0];
    columns = Array.isArray(configured) && configured.length ? configured : [{
      field: this._options.nameField,
      title: this._text('name'),
      width: '50%',
      sortable: false,
      resizable: true
    }, {
      field: this._options.valueField,
      title: this._text('value'),
      width: '50%',
      sortable: false,
      resizable: true
    }];
    return columns.slice(0, 2).map(function(column, index) {
      return propertyGridAssign({
        field: index ? this._options.valueField : this._options.nameField,
        title: index ? this._text('value') : this._text('name'),
        width: '50%',
        align: 'left',
        sortable: false,
        resizable: true,
        formatter: null,
        styler: null
      }, column || {});
    }, this);
  };

  PropertyGrid.prototype._build = function() {
    this.hostElement.textContent = '';
    this.hostElement.classList.add('fui-propertygrid');
    this.hostElement.classList.toggle('fui-propertygrid-borderless', !this._options.border);
    this.hostElement.classList.toggle('fui-propertygrid-striped', this._options.striped);
    this.hostElement.setAttribute('role', 'grid');
    this.hostElement.setAttribute('aria-label', this._options.ariaLabel || this._text('propertyGrid'));
    this.hostElement.style.width = this._options.fit ? '100%' : propertyGridSize(this._options.width);
    this.hostElement.style.height = this._options.fit ? '100%' : propertyGridSize(this._options.height);
    this._table = document.createElement('table');
    this._table.className = 'fui-propertygrid-table';
    this._head = document.createElement('thead');
    this._body = document.createElement('tbody');
    this._table.appendChild(this._head);
    this._table.appendChild(this._body);
    this.hostElement.appendChild(this._table);
  };

  PropertyGrid.prototype._bind = function() {
    this.addEventListener(this.hostElement, 'click', this._handleClick.bind(this));
    this.addEventListener(this.hostElement, 'dblclick', this._handleDblClick.bind(this));
    this.addEventListener(this.hostElement, 'keydown', this._handleKeyDown.bind(this));
  };

  PropertyGrid.prototype._invoke = function(name) {
    var handler = this._options[name];
    var args = Array.prototype.slice.call(arguments, 1);
    return typeof handler === 'function' ? handler.apply(this, args) : undefined;
  };

  PropertyGrid.prototype._emit = function(type, detail, cancelable) {
    var listeners = (this._listeners[type] || []).slice();
    var event = {
      type: type,
      target: this,
      detail: detail,
      defaultPrevented: false,
      preventDefault: function() {
        if (cancelable) this.defaultPrevented = true;
      }
    };
    listeners.forEach(function(listener) {
      listener.call(this, event);
    }, this);
    return !event.defaultPrevented;
  };

  PropertyGrid.prototype.on = function(type, listener) {
    if (type && typeof listener === 'function') {
      (this._listeners[String(type)] || (this._listeners[String(type)] = [])).push(listener);
    }
    return this;
  };

  PropertyGrid.prototype.off = function(type, listener) {
    var list = this._listeners[String(type)] || [];
    var index;
    if (!listener) {
      delete this._listeners[String(type)];
      return this;
    }
    for (index = list.length - 1; index >= 0; index -= 1) {
      if (list[index] === listener) list.splice(index, 1);
    }
    return this;
  };

  PropertyGrid.prototype._rowIndexFromTarget = function(target) {
    var row = target && target.closest ? target.closest('.fui-propertygrid-row') : null;
    return row && this.hostElement.contains(row) ? Number(row.getAttribute('data-row-index')) : -1;
  };

  PropertyGrid.prototype._cellFieldFromTarget = function(target) {
    var cell = target && target.closest ? target.closest('[data-field]') : null;
    return cell && this.hostElement.contains(cell) ? cell.getAttribute('data-field') : '';
  };

  PropertyGrid.prototype._handleClick = function(event) {
    var groupButton = event.target.closest('.fui-propertygrid-group-toggle');
    var header = event.target.closest('.fui-propertygrid-header-cell');
    var index;
    var field;
    if (groupButton && this.hostElement.contains(groupButton)) {
      this._toggleGroup(groupButton.getAttribute('data-group'));
      return;
    }
    if (header && this.hostElement.contains(header)) {
      this._sortByColumn(Number(header.getAttribute('data-column-index')));
      return;
    }
    index = this._rowIndexFromTarget(event.target);
    if (index < 0) return;
    field = this._cellFieldFromTarget(event.target);
    this.selectRow(index);
    this._invoke('onClickRow', index, this._rows[index]);
    this._emit('clickrow', { index: index, row: this._rows[index], originalEvent: event });
    this._invoke('onClickCell', index, field, this._rows[index][field]);
    this._emit('clickcell', {
      index: index,
      field: field,
      value: this._rows[index][field],
      originalEvent: event
    });
    if (field === this._options.valueField) this.beginEdit(index);
  };

  PropertyGrid.prototype._handleDblClick = function(event) {
    var index = this._rowIndexFromTarget(event.target);
    var field;
    if (index < 0) return;
    field = this._cellFieldFromTarget(event.target);
    this._invoke('onDblClickRow', index, this._rows[index]);
    this._emit('dblclickrow', { index: index, row: this._rows[index], originalEvent: event });
    this._invoke('onDblClickCell', index, field, this._rows[index][field]);
    this._emit('dblclickcell', {
      index: index,
      field: field,
      value: this._rows[index][field],
      originalEvent: event
    });
  };

  PropertyGrid.prototype._handleKeyDown = function(event) {
    if (this._editingIndex >= 0) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.cancelEdit();
      } else if (event.key === 'Enter' && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        this.endEdit();
      }
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectRow(Math.min(this._rows.length - 1, this._selectedIndex + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectRow(Math.max(0, this._selectedIndex - 1));
    } else if (event.key === 'Enter' && this._selectedIndex >= 0) {
      event.preventDefault();
      this.beginEdit(this._selectedIndex);
    }
  };

  PropertyGrid.prototype._sortByColumn = function(columnIndex) {
    var columns = this._columns();
    var column = columns[columnIndex];
    var direction;
    if (!column || !column.sortable) return;
    this.endEdit();
    direction = this._sort && this._sort.field === column.field && this._sort.order === 'asc' ?
      'desc' :
      'asc';
    this._sort = { field: column.field, order: direction };
    this._rows.sort(function(first, second) {
      var firstValue = first[column.field];
      var secondValue = second[column.field];
      if (firstValue == null) firstValue = '';
      if (secondValue == null) secondValue = '';
      if (typeof firstValue === 'number' && typeof secondValue === 'number') {
        return direction === 'asc' ? firstValue - secondValue : secondValue - firstValue;
      }
      firstValue = String(firstValue);
      secondValue = String(secondValue);
      return direction === 'asc' ?
        firstValue.localeCompare(secondValue) :
        secondValue.localeCompare(firstValue);
    });
    this.render();
    this._emit('sort', { field: column.field, order: direction });
  };

  PropertyGrid.prototype._renderHeader = function(columns) {
    var row;
    this._head.textContent = '';
    this._head.hidden = !this._options.showHeader;
    if (!this._options.showHeader) return;
    row = document.createElement('tr');
    row.className = 'fui-propertygrid-header';
    columns.forEach(function(column, index) {
      var cell = document.createElement('th');
      var label = document.createElement('span');
      cell.className = 'fui-propertygrid-header-cell';
      cell.setAttribute('data-column-index', index);
      cell.setAttribute('data-field', column.field);
      cell.setAttribute('scope', 'col');
      cell.style.width = propertyGridSize(column.width);
      cell.style.textAlign = column.align || 'left';
      cell.classList.toggle('fui-propertygrid-sortable', Boolean(column.sortable));
      if (this._sort && this._sort.field === column.field) {
        cell.setAttribute('aria-sort', this._sort.order === 'asc' ? 'ascending' : 'descending');
        cell.classList.add('fui-propertygrid-sorted-' + this._sort.order);
      }
      label.textContent = column.title == null ? column.field : String(column.title);
      cell.appendChild(label);
      row.appendChild(cell);
    }, this);
    this._head.appendChild(row);
  };

  PropertyGrid.prototype._formatCell = function(row, column, rowIndex) {
    var value = row[column.field];
    var formatted = typeof column.formatter === 'function' ?
      column.formatter.call(this, value, row, rowIndex) :
      value;
    return formatted == null ? '' : formatted;
  };

  PropertyGrid.prototype._renderPropertyRow = function(row, rowIndex, columns) {
    var tr = document.createElement('tr');
    tr.className = 'fui-propertygrid-row';
    tr.setAttribute('data-row-index', rowIndex);
    tr.setAttribute('role', 'row');
    tr.setAttribute('aria-selected', rowIndex === this._selectedIndex ? 'true' : 'false');
    tr.classList.toggle('fui-propertygrid-selected', rowIndex === this._selectedIndex);
    tr.style.height = this._options.rowHeight + 'px';
    columns.forEach(function(column) {
      var cell = document.createElement('td');
      var content = this._formatCell(row, column, rowIndex);
      var style = typeof column.styler === 'function' ?
        column.styler.call(this, row[column.field], row, rowIndex) :
        column.styler;
      cell.className = 'fui-propertygrid-cell fui-propertygrid-' +
        (column.field === this._options.valueField ? 'value' : 'name');
      cell.setAttribute('data-field', column.field);
      cell.setAttribute('role', 'gridcell');
      cell.style.textAlign = column.align || 'left';
      if (style && typeof style === 'string') cell.style.cssText += ';' + style;
      if (column.formatter) cell.innerHTML = String(content);
      else cell.textContent = content == null ? '' : String(content);
      tr.appendChild(cell);
    }, this);
    this._body.appendChild(tr);
  };

  PropertyGrid.prototype._renderGroup = function(group, columns) {
    var tr = document.createElement('tr');
    var cell = document.createElement('td');
    var button = document.createElement('button');
    var content = document.createElement('span');
    var collapsed = Boolean(this._collapsedGroups[group.value]);
    var html = typeof this._options.groupFormatter === 'function' ?
      this._options.groupFormatter.call(this, group.value, group.rows) :
      escapePropertyGridHtml(group.value);
    tr.className = 'fui-propertygrid-group';
    tr.setAttribute('role', 'row');
    cell.colSpan = columns.length;
    cell.setAttribute('role', 'gridcell');
    button.className = 'fui-propertygrid-group-toggle';
    button.type = 'button';
    button.setAttribute('data-group', group.value);
    button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    button.setAttribute(
      'aria-label',
      this._text(collapsed ? 'expandGroup' : 'collapseGroup', { group: group.value })
    );
    content.className = 'fui-propertygrid-group-text';
    content.innerHTML = html == null ? '' : String(html);
    button.appendChild(content);
    cell.appendChild(button);
    tr.appendChild(cell);
    this._body.appendChild(tr);
  };

  PropertyGrid.prototype.render = function() {
    var columns = this._columns();
    var groups;
    this._body.textContent = '';
    this._renderHeader(columns);
    if (this._options.showGroup) {
      groups = buildPropertyGridGroups(this._rows, this._options.groupField);
      groups.forEach(function(group) {
        this._renderGroup(group, columns);
        if (!this._collapsedGroups[group.value]) {
          group.rows.forEach(function(row) {
            this._renderPropertyRow(row, this._rows.indexOf(row), columns);
          }, this);
        }
      }, this);
    } else {
      this._rows.forEach(function(row, index) {
        this._renderPropertyRow(row, index, columns);
      }, this);
    }
    return this;
  };

  PropertyGrid.prototype._toggleGroup = function(value) {
    if (this._collapsedGroups[value]) this.expandGroup(this._groupIndex(value));
    else this.collapseGroup(this._groupIndex(value));
  };

  PropertyGrid.prototype._groupIndex = function(value) {
    var groups = this.groups();
    var index;
    for (index = 0; index < groups.length; index += 1) {
      if (groups[index].value === value) return index;
    }
    return -1;
  };

  PropertyGrid.prototype.groups = function() {
    var groups = buildPropertyGridGroups(this._rows, this._options.groupField);
    groups.forEach(function(group) {
      group.collapsed = Boolean(this._collapsedGroups[group.value]);
    }, this);
    return groups;
  };

  PropertyGrid.prototype.expandGroup = function(groupIndex) {
    var groups = this.groups();
    var targets = groupIndex == null ? groups : [groups[Number(groupIndex)]];
    targets.forEach(function(group) {
      if (group) delete this._collapsedGroups[group.value];
    }, this);
    this.render();
    this._emit('groupexpand', { groupIndex: groupIndex == null ? null : Number(groupIndex) });
    return this;
  };

  PropertyGrid.prototype.collapseGroup = function(groupIndex) {
    var groups = this.groups();
    var targets = groupIndex == null ? groups : [groups[Number(groupIndex)]];
    this.endEdit();
    targets.forEach(function(group) {
      if (group) this._collapsedGroups[group.value] = true;
    }, this);
    this.render();
    this._emit('groupcollapse', { groupIndex: groupIndex == null ? null : Number(groupIndex) });
    return this;
  };

  PropertyGrid.prototype.showGroup = function() {
    this._options.showGroup = true;
    return this.render();
  };

  PropertyGrid.prototype.hideGroup = function() {
    this._options.showGroup = false;
    return this.render();
  };

  PropertyGrid.prototype.showHeader = function() {
    this._options.showHeader = true;
    return this.render();
  };

  PropertyGrid.prototype.hideHeader = function() {
    this._options.showHeader = false;
    return this.render();
  };

  PropertyGrid.prototype.selectRow = function(index) {
    var previous = this._selectedIndex;
    index = Math.floor(Number(index));
    if (!isFinite(index) || index < 0 || index >= this._rows.length) return this;
    if (previous === index) return this;
    if (
      this._invoke('onBeforeSelect', index, this._rows[index]) === false ||
      !this._emit('beforeselect', { index: index, row: this._rows[index] }, true)
    ) return this;
    if (this._editingIndex >= 0 && this._editingIndex !== index) this.endEdit();
    if (previous >= 0) {
      this._invoke('onUnselect', previous, this._rows[previous]);
      this._emit('unselect', { index: previous, row: this._rows[previous] });
    }
    this._selectedIndex = index;
    this.render();
    this._invoke('onSelect', index, this._rows[index]);
    this._emit('select', { index: index, row: this._rows[index] });
    return this;
  };

  PropertyGrid.prototype.getSelected = function() {
    return this._rows[this._selectedIndex] || null;
  };

  PropertyGrid.prototype._valueCell = function(index) {
    var row = this._body.querySelector(
      '.fui-propertygrid-row[data-row-index="' + index + '"]'
    );
    var cells;
    var target = null;
    if (!row) return null;
    cells = row.querySelectorAll('[data-field]');
    Array.prototype.some.call(cells, function(cell) {
      if (cell.getAttribute('data-field') === String(this._options.valueField)) {
        target = cell;
        return true;
      }
      return false;
    }, this);
    return target;
  };

  PropertyGrid.prototype.beginEdit = function(index) {
    var row;
    var editor;
    var cell;
    var input;
    var options;
    index = Math.floor(Number(index));
    if (!this._options.editable || index < 0 || index >= this._rows.length) return this;
    row = this._rows[index];
    editor = normalizePropertyEditor(row.editor);
    if (!editor) return this;
    if (this._editingIndex === index) return this;
    if (this._editingIndex >= 0) this.endEdit();
    if (
      this._invoke('onBeforeEdit', index, row) === false ||
      !this._emit('beforeedit', { index: index, row: row }, true)
    ) return this;
    this._selectedIndex = index;
    this.render();
    cell = this._valueCell(index);
    if (!cell) return this;
    cell.textContent = '';
    cell.classList.add('fui-propertygrid-editing');
    this._editingIndex = index;
    this._editorOriginalValue = row[this._options.valueField];
    this._editorType = editor.type;
    if (editor.type === 'boolean') {
      input = document.createElement('select');
      input.className = 'fui-propertygrid-boolean-editor';
      input.innerHTML =
        '<option value="true">' + escapePropertyGridHtml(this._text('trueText')) + '</option>' +
        '<option value="false">' + escapePropertyGridHtml(this._text('falseText')) + '</option>';
      input.value = propertyGridBoolean(this._editorOriginalValue, false) ? 'true' : 'false';
      cell.appendChild(input);
      this._editorElement = input;
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.className = 'fui-propertygrid-editor-source';
      cell.appendChild(input);
      options = propertyGridAssign({}, editor.options, {
        editor: editor.type,
        width: '100%',
        height: this._options.rowHeight - 2,
        theme: 'inherit'
      });
      this._editor = new EditBox(input, options);
      this._editor.setValue(this._editorOriginalValue, true);
      this._editorElement = this._editor.textbox();
    }
    this._editorElement.focus();
    if (this._editorElement.select) this._editorElement.select();
    this._invoke('onBeginEdit', index, row);
    this._emit('beginedit', { index: index, row: row });
    return this;
  };

  PropertyGrid.prototype._editorValue = function() {
    if (this._editingIndex < 0) return undefined;
    if (this._editor) {
      if (this._editorType === 'number') return this._editor.getNumber();
      return this._editor.getValue();
    }
    return this._editorElement && this._editorElement.value === 'true';
  };

  PropertyGrid.prototype._destroyEditor = function() {
    if (this._editorElement) this.removeEventListener(this._editorElement);
    if (this._editor) this._editor.destroy();
    this._editor = null;
    this._editorElement = null;
    this._editorType = '';
  };

  PropertyGrid.prototype._markUpdated = function(row) {
    if (this._changes.inserted.indexOf(row) >= 0) return;
    if (this._changes.updated.indexOf(row) < 0) this._changes.updated.push(row);
  };

  PropertyGrid.prototype.endEdit = function(index) {
    var editingIndex = this._editingIndex;
    var row;
    var oldValue;
    var newValue;
    var changes = {};
    if (editingIndex < 0 || (index != null && Number(index) !== editingIndex)) return this;
    row = this._rows[editingIndex];
    oldValue = this._editorOriginalValue;
    newValue = this._editorValue();
    this._destroyEditor();
    this._editingIndex = -1;
    this._editorOriginalValue = null;
    if (!propertyGridValueEqual(oldValue, newValue)) {
      row[this._options.valueField] = newValue;
      changes[this._options.valueField] = newValue;
      this._markUpdated(row);
      this._invoke('onChange', editingIndex, row, newValue, oldValue);
      this._emit('change', {
        index: editingIndex,
        row: row,
        newValue: newValue,
        oldValue: oldValue
      });
    }
    this.render();
    this._invoke('onAfterEdit', editingIndex, row, changes);
    this._emit('afteredit', { index: editingIndex, row: row, changes: changes });
    return this;
  };

  PropertyGrid.prototype.cancelEdit = function(index) {
    var editingIndex = this._editingIndex;
    var row;
    if (editingIndex < 0 || (index != null && Number(index) !== editingIndex)) return this;
    row = this._rows[editingIndex];
    this._destroyEditor();
    this._editingIndex = -1;
    this._editorOriginalValue = null;
    this.render();
    this._invoke('onCancelEdit', editingIndex, row);
    this._emit('canceledit', { index: editingIndex, row: row });
    return this;
  };

  PropertyGrid.prototype.validateRow = function(index) {
    index = index == null ? this._editingIndex : Number(index);
    if (index !== this._editingIndex || !this._editorElement) return true;
    return typeof this._editorElement.checkValidity === 'function' ?
      this._editorElement.checkValidity() :
      true;
  };

  PropertyGrid.prototype.getEditor = function(index) {
    index = index == null ? this._editingIndex : Number(index);
    if (index !== this._editingIndex) return null;
    return {
      actions: this._editor || null,
      target: this._editorElement,
      field: this._options.valueField,
      type: this._editorType
    };
  };

  PropertyGrid.prototype.getRows = function() {
    return this._rows;
  };

  PropertyGrid.prototype.loadData = function(data) {
    if (this._editingIndex >= 0) this.cancelEdit();
    if (typeof this._options.loadFilter === 'function') {
      data = this._options.loadFilter.call(this, data);
    }
    this._rows = normalizePropertyGridData(data);
    this._acceptedRows = this._rows.map(clonePropertyRow);
    this._selectedIndex = -1;
    this._changes = { inserted: [], updated: [], deleted: [] };
    this.render();
    this._invoke('onLoadSuccess', data);
    this._emit('loadsuccess', { data: data, rows: this._rows });
    return this;
  };

  PropertyGrid.prototype.appendRow = function(row) {
    return this.insertRow({ index: this._rows.length, row: row });
  };

  PropertyGrid.prototype.insertRow = function(param) {
    var row = clonePropertyRow(param && param.row);
    var index = param && param.index != null ? Number(param.index) : this._rows.length;
    index = Math.max(0, Math.min(this._rows.length, isFinite(index) ? Math.floor(index) : this._rows.length));
    this.endEdit();
    this._rows.splice(index, 0, row);
    this._changes.inserted.push(row);
    this.render();
    return this;
  };

  PropertyGrid.prototype.updateRow = function(param) {
    var index = param && Number(param.index);
    var row = this._rows[index];
    if (!row || !param.row) return this;
    this.endEdit();
    propertyGridAssign(row, param.row);
    this._markUpdated(row);
    this.render();
    return this;
  };

  PropertyGrid.prototype.deleteRow = function(index) {
    var row;
    index = Number(index);
    if (!this._rows[index]) return this;
    this.endEdit();
    row = this._rows.splice(index, 1)[0];
    if (this._changes.inserted.indexOf(row) >= 0) {
      this._changes.inserted.splice(this._changes.inserted.indexOf(row), 1);
    } else if (this._changes.deleted.indexOf(row) < 0) {
      this._changes.deleted.push(row);
    }
    if (this._changes.updated.indexOf(row) >= 0) {
      this._changes.updated.splice(this._changes.updated.indexOf(row), 1);
    }
    if (this._selectedIndex >= this._rows.length) this._selectedIndex = this._rows.length - 1;
    this.render();
    return this;
  };

  PropertyGrid.prototype.refreshRow = function() {
    return this.render();
  };

  PropertyGrid.prototype.getChanges = function(type) {
    type = type == null ? '' : String(type).toLowerCase();
    if (type === 'inserted' || type === 'updated' || type === 'deleted') {
      return this._changes[type].slice();
    }
    return this._changes.inserted.concat(this._changes.updated, this._changes.deleted);
  };

  PropertyGrid.prototype.acceptChanges = function() {
    this.endEdit();
    this._acceptedRows = this._rows.map(clonePropertyRow);
    this._changes = { inserted: [], updated: [], deleted: [] };
    return this;
  };

  PropertyGrid.prototype.rejectChanges = function() {
    this.cancelEdit();
    this._rows = this._acceptedRows.map(clonePropertyRow);
    this._selectedIndex = -1;
    this._changes = { inserted: [], updated: [], deleted: [] };
    return this.render();
  };

  PropertyGrid.prototype.options = function() {
    return propertyGridAssign({}, this._options);
  };

  PropertyGrid.prototype.setOptions = function(options) {
    this.endEdit();
    this.removeEventListener();
    propertyGridAssign(this._options, options || {});
    this._normalizeOptions();
    this._build();
    this._bind();
    this.render();
    this.setTheme(this._options.theme);
    return this;
  };

  PropertyGrid.prototype.resize = function(width, height) {
    if (width != null) this._options.width = width;
    if (height != null) this._options.height = height;
    this.hostElement.style.width = this._options.fit ? '100%' : propertyGridSize(this._options.width);
    this.hostElement.style.height = this._options.fit ? '100%' : propertyGridSize(this._options.height);
    return this;
  };

  PropertyGrid.prototype.setLocale = function(locale, messages) {
    if (locale && messages) {
      localePacks[String(locale)] = propertyGridAssign({}, localePacks.en, messages);
    }
    this._options.locale = normalizePropertyGridLocale(locale);
    this.hostElement.setAttribute('aria-label', this._options.ariaLabel || this._text('propertyGrid'));
    return this.render();
  };

  PropertyGrid.prototype.setTheme = function(theme) {
    var index;
    this._options.theme = theme == null ? 'inherit' : theme;
    this.theme = this._options.theme === 'inherit' ?
      findPropertyGridTheme(this._themeSource) :
      normalizePropertyGridTheme(this._options.theme);
    for (index = 0; index < PROPERTYGRID_THEMES.length; index += 1) {
      this.hostElement.classList.remove('fg-theme-' + PROPERTYGRID_THEMES[index]);
    }
    this.hostElement.classList.add('fg-theme-' + this.theme);
    return this;
  };

  PropertyGrid.prototype.reload = function(params) {
    var self = this;
    var sequence = ++this._loadSequence;
    var query = propertyGridAssign({}, this._options.queryParams, params || {});
    var request;
    if (
      this._invoke('onBeforeLoad', query) === false ||
      !this._emit('beforeload', { params: query }, true)
    ) return Promise.resolve(false);
    if (typeof this._options.loader === 'function') {
      try {
        request = this._options.loader.call(this, query);
      } catch (error) {
        request = Promise.reject(error);
      }
    } else if (this._options.url && typeof fetch === 'function') {
      if (this._options.method === 'get') {
        request = fetch(this._options.url + (
          this._options.url.indexOf('?') >= 0 ? '&' : '?'
        ) + new URLSearchParams(query).toString()).then(function(response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.json();
        });
      } else {
        request = fetch(this._options.url, {
          method: this._options.method.toUpperCase(),
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(query)
        }).then(function(response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.json();
        });
      }
    } else {
      return Promise.resolve(false);
    }
    return Promise.resolve(request).then(function(data) {
      if (self._destroyed || sequence !== self._loadSequence) return false;
      self.loadData(data);
      return true;
    }).catch(function(error) {
      if (self._destroyed || sequence !== self._loadSequence) return false;
      self._invoke('onLoadError', error);
      self._emit('loaderror', { error: error });
      return false;
    });
  };

  PropertyGrid.prototype.destroy = function() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._loadSequence += 1;
    this.cancelEdit();
    this.removeEventListener();
    this.hostElement.innerHTML = this._original.html;
    restorePropertyGridAttribute(this.hostElement, 'class', this._original.className);
    restorePropertyGridAttribute(this.hostElement, 'style', this._original.style);
    restorePropertyGridAttribute(this.hostElement, 'role', this._original.role);
    restorePropertyGridAttribute(this.hostElement, 'aria-label', this._original.ariaLabel);
    unregisterControl(this.hostElement, this);
    delete this.hostElement.__fabuiPropertyGrid;
    this._rows = [];
    this._listeners = {};
  };

  PropertyGrid.prototype.dispose = PropertyGrid.prototype.destroy;
  PropertyGrid.defaults = defaults;
  PropertyGrid.locales = localePacks;
  PropertyGrid.themes = PROPERTYGRID_THEMES.slice();
  PropertyGrid.addLocale = function(name, messages) {
    if (name && messages) {
      localePacks[String(name)] = propertyGridAssign({}, localePacks.en, messages);
    }
    return PropertyGrid;
  };
  PropertyGrid.getControl = function(element) {
    element = resolvePropertyGridElement(element);
    return element && element.__fabuiPropertyGrid ? element.__fabuiPropertyGrid : null;
  };
  PropertyGrid.normalizeTheme = normalizePropertyGridTheme;
  PropertyGrid.normalizeLocale = normalizePropertyGridLocale;
  return PropertyGrid;
}
