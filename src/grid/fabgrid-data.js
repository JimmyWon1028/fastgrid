export function createDictionary() {
  return Object.create(null);
}

export function isSafeBinding(binding) {
  var parts;
  var i;
  if (binding == null || binding === '') {
    return false;
  }
  parts = String(binding).split('.');
  for (i = 0; i < parts.length; i += 1) {
    if (!parts[i] || parts[i] === '__proto__' || parts[i] === 'prototype' || parts[i] === 'constructor') {
      return false;
    }
  }
  return true;
}

export function getByBinding(item, binding) {
  var parts;
  var i;
  var value = item;
  if (!item || !isSafeBinding(binding)) {
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

export function setByBinding(item, binding, value) {
  var parts = String(binding).split('.');
  var target = item;
  var i;
  if (!item || !isSafeBinding(binding)) {
    return false;
  }
  for (i = 0; i < parts.length - 1; i += 1) {
    if (!Object.prototype.hasOwnProperty.call(target, parts[i]) || target[parts[i]] == null) {
      target[parts[i]] = {};
    }
    if (typeof target[parts[i]] !== 'object' && typeof target[parts[i]] !== 'function') {
      return false;
    }
    target = target[parts[i]];
  }
  target[parts[parts.length - 1]] = value;
  return true;
}

export function compareValues(a, b, type) {
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

export function normalizePagination(pageNumber, pageSize, total, defaultPageSize) {
  var normalizedSize = Math.max(1, Math.floor(toFiniteNumber(pageSize, defaultPageSize || 10)));
  var pageCount = Math.max(1, Math.ceil(Math.max(0, toFiniteNumber(total, 0)) / normalizedSize));
  return {
    pageNumber: clampNumber(Math.floor(toFiniteNumber(pageNumber, 1)), 1, pageCount),
    pageSize: normalizedSize,
    pageCount: pageCount
  };
}

export function createRemoteSortParams(sortStates) {
  var fields = [];
  var orders = [];
  (sortStates || []).forEach(function(sortState) {
    if (sortState && sortState.column && typeof sortState.column.binding === 'string' && sortState.column.binding) {
      fields.push(sortState.column.binding);
      orders.push(sortState.direction === -1 ? 'desc' : 'asc');
    }
  });
  return fields.length ? { sort: fields.join(','), order: orders.join(',') } : {};
}

export function normalizeRemoteData(data) {
  var rows = data && Array.isArray(data.rows) ? data.rows : [];
  return { rows: rows, total: Math.max(0, toFiniteNumber(data && data.total, rows.length)) };
}

export function createRemoteRequest(url, method, params) {
  var normalizedMethod = String(method || 'get').toUpperCase();
  var requestUrl = String(url || '');
  var headers = { Accept: 'application/json' };
  var body = new URLSearchParams();
  Object.keys(params || {}).forEach(function(key) {
    if (params[key] != null) body.append(key, params[key]);
  });
  if (normalizedMethod === 'GET') {
    requestUrl += (requestUrl.indexOf('?') >= 0 ? '&' : '?') + body.toString();
  } else if (normalizedMethod === 'POST') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
  } else {
    throw new Error('Remote method must be GET or POST.');
  }
  return {
    url: requestUrl,
    options: {
      method: normalizedMethod,
      headers: headers,
      body: normalizedMethod === 'POST' ? body.toString() : undefined
    }
  };
}

export function normalizeGroupConfigs(groups, maxLevels) {
  var source = Array.isArray(groups) ? groups : [];
  var configs = [];
  var limit = Math.max(0, maxLevels == null ? 3 : maxLevels);
  var i;
  for (i = 0; i < source.length && configs.length < limit; i += 1) {
    if (source[i]) configs.push(source[i]);
  }
  return configs;
}

export function getGroupStateKey(parentStateKey, key, level) {
  return !parentStateKey && level === 0 ? key : parentStateKey + '\u001f' + level + ':' + key;
}

export function getGroupKey(item, config, index, grid) {
  var getter = config.key || config.getKey;
  var bindings = config.bindings || config.binding || config.fields || config.field;
  var values = [];
  var i;
  if (typeof getter === 'function') return String(getter({ grid: grid, item: item, row: index }));
  if (!Array.isArray(bindings)) bindings = bindings == null ? [] : [bindings];
  for (i = 0; i < bindings.length; i += 1) values.push(getByBinding(item, bindings[i]));
  return values.join('_');
}

export function createGroupBuckets(rows, config, grid) {
  var buckets = [];
  var lookup = createDictionary();
  var item;
  var key;
  var bucket;
  var i;
  for (i = 0; i < rows.length; i += 1) {
    item = rows[i];
    key = getGroupKey(item, config, i, grid);
    if (!Object.prototype.hasOwnProperty.call(lookup, key)) {
      bucket = { key: key, items: [], firstItem: item };
      lookup[key] = bucket;
      buckets.push(bucket);
    }
    lookup[key].items.push(item);
  }
  return buckets;
}

export function calculateAggregate(aggregate, column, rows, grid) {
  var count = 0;
  var sum = 0;
  var min = null;
  var max = null;
  var i;
  var value;
  var number;
  var name;
  if (typeof aggregate === 'function') {
    return aggregate({ grid: grid, column: column, rows: rows, getValue: function(item) { return getByBinding(item, column.binding); } });
  }
  name = String(aggregate).toLowerCase();
  if (name === 'count') return rows.length;
  for (i = 0; i < rows.length; i += 1) {
    value = getByBinding(rows[i], column.binding);
    if (value == null || value === '') continue;
    number = Number(value);
    if (isNaN(number)) continue;
    sum += number;
    count += 1;
    if (min == null || number < min) min = number;
    if (max == null || number > max) max = number;
  }
  if (name === 'avg' || name === 'average') return count ? sum / count : null;
  if (name === 'min') return min;
  if (name === 'max') return max;
  return count ? sum : null;
}

function toFiniteNumber(value, fallback) {
  var number = Number(value);
  return isFinite(number) ? number : fallback;
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeExcelFilter(filter, normalizeOperator) {
  var type;
  var values;
  if (!filter || typeof filter !== 'object') {
    return null;
  }
  type = String(filter.type || filter.mode || '').toLowerCase();
  if (type === 'values') {
    values = Array.isArray(filter.values) ? filter.values.slice() : [];
    return { type: 'values', values: values };
  }
  return null;
}

function cloneExcelFilter(filter) {
  if (!filter) {
    return null;
  }
  return filter.type === 'values' ? {
    type: 'values',
    values: Array.isArray(filter.values) ? filter.values.slice() : []
  } : null;
}

function cloneExcelFilters(filters) {
  var result = {};
  var key;
  var filter;
  for (key in filters) {
    if (Object.prototype.hasOwnProperty.call(filters, key)) {
      filter = cloneExcelFilter(filters[key]);
      if (filter) {
        result[key] = filter;
      }
    }
  }
  return result;
}

function hasExcelFilters(filters) {
  var key;
  for (key in filters || {}) {
    if (Object.prototype.hasOwnProperty.call(filters, key) && filters[key]) {
      return true;
    }
  }
  return false;
}


export function installFabGridData(FabGrid, context) {
  var DEFAULT_OPTIONS = context.DEFAULT_OPTIONS;
  var formatNumberDisplayText = context.formatNumberDisplayText;
  var getActiveFilterMode = context.getActiveFilterMode;
  var getColumnSearchKey = context.getColumnSearchKey;
  var hasFilterMode = context.hasFilterMode;
  var mergeOptions = context.mergeOptions;
  var normalizeColumnSearchOperator = context.normalizeColumnSearchOperator;
  var rowMatchesExcelFilters = context.rowMatchesExcelFilters;
  var rowMatchesColumnSearch = context.rowMatchesColumnSearch;
  var rowMatchesSearch = context.rowMatchesSearch;

  function normalizeRemotePatternOperator(operator) {
    operator = String(operator || '').trim();
    if (operator === '%..%') {
      return 'contains';
    }
    if (operator === '..%') {
      return 'starts';
    }
    if (operator === '%..') {
      return 'ends';
    }
    if (operator === '!%..%') {
      return 'not-contains';
    }
    if (operator === '!..%') {
      return 'not-starts';
    }
    if (operator === '!%..') {
      return 'not-ends';
    }
    if (operator === '>=') {
      return 'gte';
    }
    if (operator === '>') {
      return 'gt';
    }
    if (operator === '<=') {
      return 'lte';
    }
    if (operator === '<') {
      return 'lt';
    }
    if (operator === '<>') {
      return 'ne';
    }
    if (operator === '=') {
      return 'eq';
    }
    if (operator.toLowerCase() === 'in') {
      return 'in';
    }
    return normalizeColumnSearchOperator(operator);
  }

  function serializeRemoteFilterOperator(operator) {
    var source = String(operator || '').trim();
    var normalized = normalizeRemotePatternOperator(source);
    if (normalized === 'starts') {
      return '..%';
    }
    if (normalized === 'contains') {
      return '%..%';
    }
    if (normalized === 'ends') {
      return '%..';
    }
    if (normalized === 'not-starts') {
      return '!..%';
    }
    if (normalized === 'not-contains') {
      return '!%..%';
    }
    if (normalized === 'not-ends') {
      return '!%..';
    }
    if (normalized === 'gte') {
      return '>=';
    }
    if (normalized === 'gt') {
      return '>';
    }
    if (normalized === 'lte') {
      return '<=';
    }
    if (normalized === 'lt') {
      return '<';
    }
    if (normalized === 'ne') {
      return '<>';
    }
    if (normalized === 'eq') {
      return '=';
    }
    return source;
  }

  function serializeRemoteInValue(value) {
    return (Array.isArray(value) ? value : [value]).map(function(item) {
      return String(item == null ? '' : item).trim();
    }).filter(function(item) {
      return item !== '';
    }).join(',');
  }

  FabGrid.prototype.setRowGroups = function(groups, silent) {
    this.options.rowGroups = Array.isArray(groups) ? groups.slice() : [];
    this.applyView();
    this.resetVerticalScroll();
    if (!silent) {
      this.refresh();
    }
  };

  FabGrid.prototype.createGroupedView = function(rows) {
    var configs = normalizeGroupConfigs(this.options.rowGroups, 3);
    var output = [];
    if (!configs.length) {
      return rows;
    }

    this.appendGroupedRows(output, rows, configs, 0, '');
    return output;
  };

  FabGrid.prototype.appendGroupedRows = function(output, rows, configs, level, parentStateKey) {
    var config = configs[level];
    var buckets;
    var item;
    var bucket;
    var stateKey;
    var i;
    if (!config) {
      return;
    }
    buckets = createGroupBuckets(rows, config, this);
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

  FabGrid.prototype.getRowGroupStateKey = function(parentStateKey, key, level) {
    return getGroupStateKey(parentStateKey, key, level);
  };

  FabGrid.prototype.getRowGroupKey = function(item, config, index) {
    return getGroupKey(item, config, index, this);
  };

  FabGrid.prototype.createRowGroupItem = function(bucket, config, level, stateKey) {
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

  FabGrid.prototype.getRowGroupHeaderText = function(config) {
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

  FabGrid.prototype.createRowGroupFooterItem = function(group) {
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

  FabGrid.prototype.calculateRowGroupAggregates = function(rows) {
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

  FabGrid.prototype.calculateAggregate = function(aggregate, column) {
    return this.calculateAggregateForRows(aggregate, column, this.dataView || this.view);
  };

  FabGrid.prototype.calculateAggregateForRows = function(aggregate, column, rows) {
    return calculateAggregate(aggregate, column, rows, this);
  };

  FabGrid.prototype.formatAggregateValue = function(value, column, rows) {
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

  FabGrid.prototype.isRowGroup = function(item) {
    return !!(item && item.__fgRowType === 'group');
  };

  FabGrid.prototype.isRowGroupFooter = function(item) {
    return !!(item && item.__fgRowType === 'groupFooter');
  };

  FabGrid.prototype.getRowGroupAggregateValue = function(group, column) {
    if (column.binding && Object.prototype.hasOwnProperty.call(group.aggregates, column.binding)) {
      return group.aggregates[column.binding];
    }
    return this.calculateAggregateForRows(column.aggregate, column, group.items || []);
  };

  FabGrid.prototype.getRowGroupFooterValue = function(footer, column) {
    if (!footer || !column || !column.aggregate) {
      return '';
    }
    return this.getRowGroupAggregateValue(footer, column);
  };

  FabGrid.prototype.toggleRowGroup = function(rowIndex) {
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
    this.emit('groupCollapsedChanged', {
      group: group,
      collapsed: this.rowGroupState[group.stateKey || group.key] === true
    });
  };

  FabGrid.prototype.toggleAllRowGroups = function() {
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
      this.rowGroupState = createDictionary();
    }
    this.applyView();
    this.clampSelection();
    this.render();
  };

  FabGrid.prototype.setItemsSource = function(rows, silent) {
    if (!silent && this.emit('itemsSourceChanging', { rows: rows || [] }) === false) {
      return;
    }
    if (!silent && this.emit('loadingRows', { rows: rows || [] }) === false) {
      return;
    }
    if (typeof this.resetTreeState === 'function') {
      this.resetTreeState();
    }
    this.source = this.createObservedItemsSource(rows || []);
    this.applyView();
    if (!silent) {
      this.emit('itemsSourceChanged', { rows: this.source });
      this.emit('loadedRows', { rows: this.view });
      this.refresh();
    }
  };

  FabGrid.prototype.load = function(params) {
    var self = this;
    var loader = this.options.loader;
    var request;
    var seq;
    var result;
    if (this.options.remote !== true || this.disposed) {
      return Promise.resolve(false);
    }
    if (typeof loader !== 'function' && !this.options.url) {
      return Promise.resolve(false);
    }
    request = mergeOptions(params || {}, {
      page: this.options.pageNumber,
      rows: this.options.pageSize
    });
    request = mergeOptions(request, this.getRemoteSortParams());
    request = mergeOptions(request, this.getRemoteFilterParams());
    if (this.emit('beforeLoad', { params: request }) === false) {
      return Promise.resolve(false);
    }
    this._remoteLoadSeq += 1;
    seq = this._remoteLoadSeq;
    this.setRemoteLoading(true);
    try {
      result = typeof loader === 'function'
        ? loader.call(this, request)
        : this.requestRemoteData(request);
    } catch (error) {
      result = Promise.reject(error);
    }
    return Promise.resolve(result).then(function(data) {
      if (self.disposed || seq !== self._remoteLoadSeq) {
        return false;
      }
      self.loadRemoteData(data);
      self.emit('loadSuccess', { data: data, params: request });
      return true;
    }).catch(function(error) {
      if (!self.disposed && seq === self._remoteLoadSeq) {
        self.emit('loadError', { error: error, params: request });
      }
      return false;
    }).then(function(success) {
      if (!self.disposed && seq === self._remoteLoadSeq) {
        self.setRemoteLoading(false);
      }
      return success;
    });
  };

  FabGrid.prototype.requestRemoteData = function(params) {
    var request;
    try {
      request = createRemoteRequest(this.options.url, this.options.method, params);
    } catch (error) {
      return Promise.reject(new Error('Remote method must be GET or POST.'));
    }
    return fetch(request.url, request.options).then(function(response) {
      if (!response.ok) {
        throw new Error('Remote request failed with HTTP ' + response.status + '.');
      }
      return response.json();
    });
  };

  FabGrid.prototype.getRemoteSortParams = function() {
    return createRemoteSortParams(this.getSortStates());
  };

  FabGrid.prototype.getRemoteFilterParams = function() {
    var rules = [];
    var configuredRules = Array.isArray(this.options.filterRules) ? this.options.filterRules : [];
    var columnBindings = createDictionary();
    var configuredFields = createDictionary();
    var self = this;
    this.columns.forEach(function(column) {
      if (column && typeof column.binding === 'string' && column.binding) {
        columnBindings[column.binding] = column;
      }
    });
    configuredRules.forEach(function(rule) {
      var field;
      var column;
      var key;
      var value;
      var operator;
      var currentOperator;
      var configuredUiOperator;
      if (!rule || rule.field == null || rule.value == null) {
        return;
      }
      field = String(rule.field).trim();
      operator = rule.op == null ? '' : String(rule.op).trim();
      if (Array.isArray(rule.value)) {
        if (operator.toLowerCase() !== 'in') {
          return;
        }
        value = serializeRemoteInValue(rule.value);
      } else {
        value = String(rule.value).trim();
      }
      if (!field) {
        return;
      }
      column = columnBindings[field];
      if (column && getActiveFilterMode(self.options) === 'searchRow') {
        key = getColumnSearchKey(column);
        value = String(self.columnSearchValues[key] == null ? '' : self.columnSearchValues[key]).trim();
        if (!value) {
          configuredFields[field] = true;
          return;
        }
        currentOperator = normalizeColumnSearchOperator(self.columnSearchOperators[key]);
        configuredUiOperator = self.options.remote === true ?
          normalizeRemotePatternOperator(operator) : normalizeColumnSearchOperator(operator);
        if (currentOperator && currentOperator !== configuredUiOperator) {
          operator = currentOperator;
        }
      } else if (!value) {
        return;
      }
      rules.push({
        field: field,
        op: self.options.remote === true ?
          serializeRemoteFilterOperator(operator || 'starts') : operator || 'starts',
        value: value
      });
      configuredFields[field] = true;
    });
    if (getActiveFilterMode(this.options) === 'searchRow') {
      this.columns.forEach(function(column) {
        var key = getColumnSearchKey(column);
        var value = self.columnSearchValues[key];
        var operator;
        if (
          typeof column.binding === 'string' &&
          column.binding &&
          !configuredFields[column.binding] &&
          value != null &&
          String(value).trim()
        ) {
          operator = normalizeColumnSearchOperator(self.columnSearchOperators[key]) || 'starts';
          rules.push({
            field: column.binding,
            op: self.options.remote === true ? serializeRemoteFilterOperator(operator) : operator,
            value: String(value).trim()
          });
        }
      });
    } else if (getActiveFilterMode(this.options) === 'excel') {
      this.columns.forEach(function(column) {
        var key = getColumnSearchKey(column);
        var filter = (self.excelFilters || {})[key];
        if (!filter || typeof column.binding !== 'string' || !column.binding) {
          return;
        }
        if (filter.type === 'values' && Array.isArray(filter.values)) {
          rules.push({
            field: column.binding,
            op: 'in',
            value: serializeRemoteInValue(filter.values)
          });
        }
      });
    }
    return {
      q: this.searchText || undefined,
      filterRules: rules.length ? JSON.stringify(rules) : undefined
    };
  };

  FabGrid.prototype.getFilterRules = function() {
    var serialized = this.getRemoteFilterParams().filterRules;
    return serialized ? JSON.parse(serialized) : [];
  };

  FabGrid.prototype.reload = function() {
    return this.load();
  };

  FabGrid.prototype.setRemoteLoading = function(value) {
    this.remoteLoading = value === true;
    this.busy = this.remoteLoading;
    this.root.setAttribute('aria-busy', this.remoteLoading ? 'true' : 'false');
    if (this.remoteLoadText) {
      this.remoteLoadText.textContent = this.options.loadMsg || this.getText('loadMsg');
    }
    if (this.remoteLoadMask) {
      this.remoteLoadMask.style.display = this.remoteLoading ? 'flex' : 'none';
    }
  };

  FabGrid.prototype.loadRemoteData = function(data) {
    var normalized = normalizeRemoteData(data);
    if (typeof this.resetTreeState === 'function') {
      this.resetTreeState();
    }
    this.source = this.createObservedItemsSource(normalized.rows);
    this.paginationTotal = normalized.total;
    this.applyView();
    this.resetVerticalScroll();
    this.refresh();
  };

  FabGrid.prototype.applyPagerOptions = function() {
    var pager = this.options.pager;
    if (!pager || typeof pager !== 'object') {
      return;
    }
    if (pager.pageNumber != null) {
      this.options.pageNumber = pager.pageNumber;
    }
    if (pager.pageSize != null) {
      this.options.pageSize = pager.pageSize;
    }
    if (Array.isArray(pager.pageList)) {
      this.options.pageList = pager.pageList.slice();
    }
    if (pager.showPageList != null) {
      this.options.showPageList = pager.showPageList === true;
    }
    if (pager.showPageInfo != null) {
      this.options.showPageInfo = pager.showPageInfo !== false;
    }
    if (pager.showRefresh != null) {
      this.options.showRefresh = pager.showRefresh !== false;
    }
  };

  FabGrid.prototype.createObservedItemsSource = function(rows) {
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

  FabGrid.prototype.handleObservedItemsSourceChange = function() {
    var grid = this;
    var enqueue;
    if (this.disposed || this._suppressObservedItemChange || this._handlingObservedItemChange || this._observedItemsChangeQueued) {
      return;
    }
    this._observedItemsChangeQueued = true;
    enqueue = typeof queueMicrotask === 'function' ? queueMicrotask : function(callback) {
      Promise.resolve().then(callback);
    };
    enqueue(function() {
      grid._observedItemsChangeQueued = false;
      if (grid.disposed || grid._suppressObservedItemChange || grid._handlingObservedItemChange) {
        return;
      }
      grid._handlingObservedItemChange = true;
      try {
        grid.applyView();
        grid.refresh();
      } finally {
        grid._handlingObservedItemChange = false;
      }
    });
  };

  FabGrid.prototype.setFilter = function(predicate) {
    if (this.options.remote === true && typeof predicate === 'function') {
      throw new Error('setFilter(predicate) is only available when remote is false. Use remote search rules or a custom loader instead.');
    }
    this.filterPredicate = typeof predicate === 'function' ? predicate : null;
    this.applyFilterChange(true, 'setFilter');
  };

  FabGrid.prototype.applyInitialFilterRules = function(rules) {
    var parsedRules = rules;
    var appliedRules = [];
    var normalizedRules = [];
    var rule;
    var column;
    var field;
    var value;
    var rawOperator;
    var operator;
    var uiOperator;
    var storedOperator;
    var key;
    var i;
    var hasConfiguredColumnRule = false;
    var hasColumnSearchValue = false;
    this.options.filterRules = [];
    if (!hasFilterMode(this.options, 'searchRow')) {
      return appliedRules;
    }
    if (typeof parsedRules === 'string') {
      try {
        parsedRules = JSON.parse(parsedRules);
      } catch (error) {
        parsedRules = [];
      }
    }
    if (!Array.isArray(parsedRules)) {
      this.options.filterRules = [];
      return appliedRules;
    }
    for (i = 0; i < parsedRules.length; i += 1) {
      rule = parsedRules[i];
      if (!rule || rule.field == null || rule.value == null) {
        continue;
      }
      field = String(rule.field).trim();
      rawOperator = rule.op == null ? '' : String(rule.op).trim();
      if (Array.isArray(rule.value)) {
        if (this.options.remote !== true || rawOperator.toLowerCase() !== 'in') {
          continue;
        }
        value = serializeRemoteInValue(rule.value);
      } else {
        value = String(rule.value).trim();
      }
      operator = normalizeColumnSearchOperator(rawOperator);
      uiOperator = this.options.remote === true ? normalizeRemotePatternOperator(rawOperator) : operator;
      column = field ? this.getColumn(field) : null;
      if (
        !field ||
        (this.options.remote !== true && (!value || (rawOperator && !operator))) ||
        (this.options.remote === true && !value && (!column || !uiOperator))
      ) {
        continue;
      }
      storedOperator = this.options.remote === true ? rawOperator || 'starts' : operator || 'starts';
      normalizedRules.push({
        field: field,
        op: storedOperator,
        value: value
      });
      if (!column || typeof column.binding !== 'string' || !column.binding) {
        continue;
      }
      key = getColumnSearchKey(column);
      hasConfiguredColumnRule = true;
      if (value) {
        this.columnSearchValues[key] = value;
        hasColumnSearchValue = true;
      }
      if (uiOperator) {
        this.columnSearchOperators[key] = uiOperator;
      }
      if (value) {
        appliedRules.push({
          field: column.binding,
          op: storedOperator,
          value: value
        });
      }
    }
    if (hasConfiguredColumnRule) {
      this.options.filterMode = ['searchRow'].concat(this.options.filterMode.filter(function(mode) {
        return mode !== 'searchRow';
      }));
    }
    this.hasColumnSearch = hasColumnSearchValue;
    this.options.filterRules = normalizedRules.map(function(ruleItem) {
      return {
        field: ruleItem.field,
        op: ruleItem.op,
        value: ruleItem.value
      };
    });
    return appliedRules;
  };

  FabGrid.prototype.setFilterRules = function(rules) {
    this.options.filterRules = [];
    this.columnSearchValues = {};
    this.columnSearchOperators = {};
    this.cancelHeaderSearchTimer();
    this.hideFilterMenu();
    this.applyInitialFilterRules(rules);
    this.updateColumnSearchState();
    this.applyFilterChange(true, 'setFilterRules');
  };

  FabGrid.prototype.clearFilter = function() {
    this.filterPredicate = null;
    this.searchText = '';
    this.options.filterRules = [];
    this.columnSearchValues = {};
    this.columnSearchOperators = {};
    this.excelFilters = {};
    this.cancelHeaderSearchTimer();
    this.hideFilterMenu();
    this.updateColumnSearchState();
    this.applyFilterChange(false, 'clearFilter');
  };

  FabGrid.prototype.setSearch = function(text) {
    this.searchText = String(text || '').toLowerCase();
    this.applyFilterChange(true, 'setSearch');
  };

  FabGrid.prototype.setColumnSearch = function(column, value) {
    var col = typeof column === 'number' ? this.visibleColumns[column] || this.columns[column] : typeof column === 'object' ? column : this.getColumn(column);
    var key;
    if (!col || getActiveFilterMode(this.options) !== 'searchRow') {
      return false;
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
    this.applyFilterChange(false, 'setColumnSearch');
    return true;
  };

  FabGrid.prototype.setColumnSearchOperator = function(column, operator) {
    var col = typeof column === 'number' ? this.visibleColumns[column] || this.columns[column] : typeof column === 'object' ? column : this.getColumn(column);
    var key;
    if (!col || getActiveFilterMode(this.options) !== 'searchRow') {
      return false;
    }
    key = getColumnSearchKey(col);
    operator = normalizeColumnSearchOperator(operator);
    if (operator) {
      this.columnSearchOperators[key] = operator;
    } else {
      delete this.columnSearchOperators[key];
    }
    this.hideFilterMenu();
    this.applyFilterChange(false, 'setColumnSearchOperator');
    return true;
  };

  FabGrid.prototype.applyHeaderSearch = function(colIndex, selectionStart, selectionEnd) {
    this.applyFilterChange(false, 'headerSearch');
    this.focusHeaderSearchInput(colIndex, selectionStart, selectionEnd);
  };

  FabGrid.prototype.clearColumnSearch = function() {
    this.options.filterRules = [];
    this.columnSearchValues = {};
    this.columnSearchOperators = {};
    this.cancelHeaderSearchTimer();
    this.updateColumnSearchState();
    this.applyFilterChange(true, 'clearColumnSearch');
  };

  FabGrid.prototype.setExcelFilter = function(column, filter) {
    var col = typeof column === 'number' ? this.visibleColumns[column] || this.columns[column] : typeof column === 'object' ? column : this.getColumn(column);
    var key;
    var normalized;
    if (!col || getActiveFilterMode(this.options) !== 'excel') {
      return false;
    }
    this.excelFilters = this.excelFilters || {};
    key = getColumnSearchKey(col);
    normalized = normalizeExcelFilter(filter, normalizeColumnSearchOperator);
    if (normalized) {
      this.excelFilters[key] = normalized;
    } else {
      delete this.excelFilters[key];
    }
    this.hideFilterMenu();
    this.applyFilterChange(false, 'setExcelFilter');
    return true;
  };

  FabGrid.prototype.getExcelFilter = function(column) {
    var col = typeof column === 'number' ? this.visibleColumns[column] || this.columns[column] : typeof column === 'object' ? column : this.getColumn(column);
    var filter;
    if (!col) {
      return null;
    }
    filter = (this.excelFilters || {})[getColumnSearchKey(col)];
    return filter ? cloneExcelFilter(filter) : null;
  };

  FabGrid.prototype.clearExcelFilter = function(column) {
    var col = typeof column === 'number' ? this.visibleColumns[column] || this.columns[column] : typeof column === 'object' ? column : this.getColumn(column);
    var key;
    if (!col) {
      return false;
    }
    this.excelFilters = this.excelFilters || {};
    key = getColumnSearchKey(col);
    if (!Object.prototype.hasOwnProperty.call(this.excelFilters, key)) {
      this.hideFilterMenu();
      return false;
    }
    delete this.excelFilters[key];
    this.hideFilterMenu();
    this.applyFilterChange(false, 'clearExcelFilter');
    return true;
  };

  FabGrid.prototype.clearExcelFilters = function(source) {
    this.excelFilters = {};
    this.hideFilterMenu();
    this.applyFilterChange(false, source || 'clearExcelFilters');
  };

  FabGrid.prototype.clearSearchConditions = function(source) {
    this.searchText = '';
    this.options.filterRules = [];
    this.columnSearchValues = {};
    this.columnSearchOperators = {};
    this.cancelHeaderSearchTimer();
    this.hideFilterMenu();
    this.updateColumnSearchState();
    this.applyFilterChange(false, source || 'clearSearchConditions');
    this.emit('searchCleared', { source: source || 'api' });
  };

  FabGrid.prototype.applyFilterChange = function(resetHorizontalScroll, source) {
    var columnSearchValues;
    var columnSearchOperators;
    var columnSearchActive;
    var excelFilterActive;
    var excelFilters;
    var active;
    if (this.options.remote === true) {
      this.options.pageNumber = 1;
      if (this.options.pager) {
        this.options.pager.pageNumber = 1;
      }
    }
    this.applyView();
    if (resetHorizontalScroll === true) {
      this.resetScroll();
    } else {
      this.resetVerticalScroll();
    }
    this.refresh();
    columnSearchValues = mergeOptions({}, this.columnSearchValues || {});
    columnSearchOperators = mergeOptions({}, this.columnSearchOperators || {});
    columnSearchActive = getActiveFilterMode(this.options) === 'searchRow' && Object.keys(columnSearchValues).some(function(key) {
      return String(columnSearchValues[key] == null ? '' : columnSearchValues[key]).trim() !== '';
    });
    excelFilters = cloneExcelFilters(this.excelFilters || {});
    excelFilterActive = getActiveFilterMode(this.options) === 'excel' && hasExcelFilters(excelFilters);
    active = typeof this.filterPredicate === 'function' || Boolean(this.searchText) || columnSearchActive || excelFilterActive;
    if (source) {
      this.emit('filterChanged', {
        source: source,
        active: active,
        cleared: !active,
        remote: this.options.remote === true,
        filterPredicate: this.filterPredicate,
        searchText: this.searchText || '',
        columnSearchValues: columnSearchValues,
        columnSearchOperators: columnSearchOperators,
        excelFilters: excelFilters,
        view: this.view,
        viewRowCount: this.view.length
      });
    }
    if (this.options.remote === true) {
      this.load();
    }
  };

  FabGrid.prototype.applyView = function() {
    var rows = this.source.slice();
    var filterPredicate = this.filterPredicate;
    var searchText = this.searchText;
    var columnSearchValues = getActiveFilterMode(this.options) === 'searchRow' && this.hasColumnSearch ? this.columnSearchValues : null;
    var columnSearchOperators = getActiveFilterMode(this.options) === 'searchRow' && this.hasColumnSearch ? this.columnSearchOperators : null;
    var excelFilters = getActiveFilterMode(this.options) === 'excel' && hasExcelFilters(this.excelFilters) ? this.excelFilters : null;
    var columns = this.columns;
    var sortStates = this.getSortStates();
    var selectionState = this.captureSelectionState();
    var indexedRows;
    var treeOptions;
    var filtering;

    if (typeof this.isTreeGrid === 'function' && this.isTreeGrid()) {
      filtering = this.options.remote !== true && Boolean(filterPredicate || searchText || columnSearchValues || excelFilters);
      treeOptions = {
        filtering: filtering,
        pagination: false,
        pageNumber: this.options.pageNumber,
        pageSize: this.options.pageSize,
        matches: function(item) {
          if (filterPredicate && !filterPredicate(item)) {
            return false;
          }
          if (!searchText) {
            return (!columnSearchValues || rowMatchesColumnSearch(item, columns, columnSearchValues, columnSearchOperators)) &&
              (!excelFilters || rowMatchesExcelFilters(item, columns, excelFilters));
          }
          return rowMatchesSearch(item, columns, searchText) &&
            (!columnSearchValues || rowMatchesColumnSearch(item, columns, columnSearchValues, columnSearchOperators)) &&
            (!excelFilters || rowMatchesExcelFilters(item, columns, excelFilters));
        },
        compare: sortStates.length && this.options.remote !== true ? function(a, b) {
          var comparison;
          var sortState;
          var i;
          for (i = 0; i < sortStates.length; i += 1) {
            sortState = sortStates[i];
            comparison = compareValues(
              getByBinding(a, sortState.column.binding),
              getByBinding(b, sortState.column.binding),
              sortState.column.dataType
            ) * sortState.direction;
            if (comparison) {
              return comparison;
            }
          }
          return 0;
        } : null
      };
      rows = this.createTreeView(rows, treeOptions);
      if (this.options.remote !== true) {
        this.paginationTotal = this._treeRootCount;
      }
      if (this.options.pagination === true && this.options.remote !== true) {
        this.normalizePaginationOptions();
        treeOptions.pagination = true;
        treeOptions.pageNumber = this.options.pageNumber;
        treeOptions.pageSize = this.options.pageSize;
        rows = this.createTreeView(this.source.slice(), treeOptions);
      }
      this.dataView = rows;
      this.view = rows;
    } else {
      if (this.options.remote !== true && (filterPredicate || searchText || columnSearchValues || excelFilters)) {
        rows = rows.filter(function(item, index) {
          if (filterPredicate && !filterPredicate(item, index)) {
            return false;
          }
          if (!searchText) {
            return (!columnSearchValues || rowMatchesColumnSearch(item, columns, columnSearchValues, columnSearchOperators)) &&
              (!excelFilters || rowMatchesExcelFilters(item, columns, excelFilters));
          }
          return rowMatchesSearch(item, columns, searchText) &&
            (!columnSearchValues || rowMatchesColumnSearch(item, columns, columnSearchValues, columnSearchOperators)) &&
            (!excelFilters || rowMatchesExcelFilters(item, columns, excelFilters));
        });
      }

      if (sortStates.length && this.options.remote !== true) {
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

      if (this.options.remote !== true) {
        this.paginationTotal = rows.length;
      }
      if (this.options.pagination === true && this.options.remote !== true) {
        this.normalizePaginationOptions();
        rows = rows.slice(
          (this.options.pageNumber - 1) * this.options.pageSize,
          this.options.pageNumber * this.options.pageSize
        );
      }
      this.dataView = rows;
      this.view = this.createGroupedView(rows);
    }
    this._rowCollection = null;
    this.refreshInvalidItemRows();
    this.restoreSelectionState(selectionState);
    this.clampSelection();
    this.syncEditingWithView();
  };

  FabGrid.prototype.normalizePaginationOptions = function() {
    var pagination = normalizePagination(this.options.pageNumber, this.options.pageSize, this.paginationTotal, DEFAULT_OPTIONS.pageSize);
    this.options.pageSize = pagination.pageSize;
    this.options.pageNumber = pagination.pageNumber;
    if (this.options.pager && typeof this.options.pager === 'object') {
      this.options.pager.pageNumber = this.options.pageNumber;
      this.options.pager.pageSize = this.options.pageSize;
    }
  };

  FabGrid.prototype.toggleSort = function(colIndex, multiSort) {
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
    if (this.options.remote === true) {
      this.options.pageNumber = 1;
      if (this.options.pager) {
        this.options.pager.pageNumber = 1;
      }
    }
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
    if (this.options.remote === true) {
      this.load();
    }
  };

  FabGrid.prototype.getSortGlyph = function(column) {
    var direction = this.getSortDirection(column);
    if (!direction) {
      return '';
    }
    return direction === 1 ? '▲' : '▼';
  };

  FabGrid.prototype.getSortDirection = function(column) {
    var index = this.getSortIndex(column);
    var sortStates = this.getSortStates();
    return index >= 0 ? sortStates[index].direction : 0;
  };

  FabGrid.prototype.getSortIndex = function(column) {
    var sortStates = this.getSortStates();
    var i;
    for (i = 0; i < sortStates.length; i += 1) {
      if (sortStates[i].column === column) {
        return i;
      }
    }
    return -1;
  };

  FabGrid.prototype.getSortStates = function() {
    if (Array.isArray(this.sortStates) && this.sortStates.length) {
      return this.sortStates;
    }
    return this.sortState && this.sortState.direction ? [this.sortState] : [];
  };
}
