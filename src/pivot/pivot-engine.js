import {
  createPivotPathKey,
  pivotValuesEqual
} from './pivot-utils.js?v=20260717-pivot-typed-values-v1';

export var PivotAggregate = Object.freeze({
  Sum: 'Sum',
  Count: 'Count',
  Average: 'Average',
  WeightedAverage: 'WeightedAverage',
  Min: 'Min',
  Max: 'Max'
});

export var PivotShowAs = Object.freeze({
  NoCalculation: 'NoCalculation',
  PercentOfGrandTotal: 'PercentOfGrandTotal',
  PercentOfRowTotal: 'PercentOfRowTotal',
  PercentOfColumnTotal: 'PercentOfColumnTotal',
  DifferenceFromPrevious: 'DifferenceFromPrevious',
  PercentDifferenceFromPrevious: 'PercentDifferenceFromPrevious',
  RunningTotal: 'RunningTotal'
});

export var PivotShowTotals = Object.freeze({
  None: 'None',
  GrandTotals: 'GrandTotals',
  Subtotals: 'Subtotals'
});

function PivotEvent() {
  this.handlers = [];
}

PivotEvent.prototype.addHandler = function(handler, self) {
  if (typeof handler === 'function') {
    this.handlers.push({ handler: handler, self: self || null });
  }
  return this;
};

PivotEvent.prototype.removeHandler = function(handler, self) {
  var matchSelf = arguments.length > 1;
  var i;
  for (i = this.handlers.length - 1; i >= 0; i -= 1) {
    if (this.handlers[i].handler === handler && (!matchSelf || this.handlers[i].self === self)) {
      this.handlers.splice(i, 1);
    }
  }
  return this;
};

PivotEvent.prototype.raise = function(sender, args) {
  var handlers = this.handlers.slice();
  var i;
  for (i = 0; i < handlers.length; i += 1) {
    handlers[i].handler.call(handlers[i].self || sender, sender, args || {});
  }
};

function getPivotBindingValue(item, binding) {
  var parts;
  var value = item;
  var i;
  if (!binding) {
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

function inferDataType(value) {
  if (value instanceof Date) {
    return 'date';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  return 'string';
}

function createHeader(binding) {
  return String(binding || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, function(character) {
      return character.toUpperCase();
    });
}

function normalizeAggregate(value, dataType) {
  var text = String(value || '').toLowerCase();
  if (text === 'count') return PivotAggregate.Count;
  if (text === 'average' || text === 'avg') return PivotAggregate.Average;
  if (text === 'weightedaverage' || text === 'weighted average' || text === 'weightedavg') {
    return PivotAggregate.WeightedAverage;
  }
  if (text === 'min') return PivotAggregate.Min;
  if (text === 'max') return PivotAggregate.Max;
  if (text === 'sum') return PivotAggregate.Sum;
  return dataType === 'number' ? PivotAggregate.Sum : PivotAggregate.Count;
}

function normalizeTotals(value, fallback) {
  var text = String(value || '').toLowerCase();
  if (text === 'none') return PivotShowTotals.None;
  if (text === 'subtotals' || text === 'subtotal') return PivotShowTotals.Subtotals;
  if (text === 'grandtotals' || text === 'grandtotal') return PivotShowTotals.GrandTotals;
  return fallback;
}

function normalizeDate(value) {
  var date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function getGroupedValue(value, groupBy) {
  var date;
  var month;
  var quarter;
  var type;
  if (typeof groupBy === 'function') {
    return groupBy(value);
  }
  if (!groupBy) {
    return value;
  }
  type = String(groupBy).toLowerCase();
  date = normalizeDate(value);
  if (!date) {
    return value;
  }
  month = date.getMonth() + 1;
  if (type === 'year') {
    return date.getFullYear();
  }
  if (type === 'quarter') {
    quarter = Math.floor((month - 1) / 3) + 1;
    return date.getFullYear() + ' Q' + quarter;
  }
  if (type === 'month') {
    return date.getFullYear() + '-' + String(month).padStart(2, '0');
  }
  if (type === 'day') {
    return date.getFullYear() + '-' + String(month).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  return value;
}

export function PivotField(engine, binding, header, options) {
  var hasDescending;
  var hasSortDirection;
  options = options || {};
  hasDescending = Object.prototype.hasOwnProperty.call(options, 'descending');
  hasSortDirection = Object.prototype.hasOwnProperty.call(options, 'sortDirection');
  this.engine = engine || null;
  this.binding = binding || options.binding || '';
  this.key = options.key || options.header || header || this.binding;
  this.header = options.header || header || createHeader(this.binding);
  this.dataType = String(options.dataType || 'string').toLowerCase();
  this.aggregate = normalizeAggregate(options.aggregate, this.dataType);
  this.format = options.format || '';
  this.align = options.align || (this.dataType === 'number' ? 'right' : 'left');
  this.sortDirection = hasSortDirection ? normalizePivotSortDirection(options.sortDirection) :
    (hasDescending ? (options.descending === true ? -1 : 1) : 0);
  Object.defineProperty(this, 'descending', {
    configurable: true,
    enumerable: true,
    get: function() {
      return normalizePivotSortDirection(this.sortDirection) === -1;
    },
    set: function(value) {
      this.sortDirection = value === true ? -1 : 1;
    }
  });
  this.filter = options.filter || null;
  this.groupBy = options.groupBy || null;
  this.getValue = typeof options.getValue === 'function' ? options.getValue :
    (typeof options.calculate === 'function' ? options.calculate : null);
  this.calculate = this.getValue;
  this.weightBinding = options.weightBinding || '';
  this.getWeight = typeof options.getWeight === 'function' ? options.getWeight : null;
  this.showAs = normalizeShowAs(options.showAs);
  this.width = Math.max(48, Number(options.width) || (this.dataType === 'number' ? 112 : 132));
  this.visible = options.visible !== false;
}

PivotField.prototype.getItemValue = function(item) {
  var value = this.getValue ? this.getValue(item) : getPivotBindingValue(item, this.binding);
  return getGroupedValue(value, this.groupBy);
};

PivotField.prototype.getWeightValue = function(item) {
  if (this.getWeight) {
    return this.getWeight(item);
  }
  return this.weightBinding ? getPivotBindingValue(item, this.weightBinding) : 1;
};

function normalizeShowAs(value) {
  var text = String(value || '').replace(/[\s_-]+/g, '').toLowerCase();
  if (text === 'percentofgrandtotal') return PivotShowAs.PercentOfGrandTotal;
  if (text === 'percentofrowtotal') return PivotShowAs.PercentOfRowTotal;
  if (text === 'percentofcolumntotal') return PivotShowAs.PercentOfColumnTotal;
  if (text === 'differencefromprevious') return PivotShowAs.DifferenceFromPrevious;
  if (text === 'percentdifferencefromprevious') return PivotShowAs.PercentDifferenceFromPrevious;
  if (text === 'runningtotal') return PivotShowAs.RunningTotal;
  return PivotShowAs.NoCalculation;
}

function createAggregatePaths(path, totals) {
  var result = [path.slice()];
  var i;
  if (!path.length) {
    return result;
  }
  if (totals === PivotShowTotals.Subtotals) {
    for (i = path.length - 1; i > 0; i -= 1) {
      result.push(path.slice(0, i));
    }
  }
  if (totals !== PivotShowTotals.None) {
    result.push([]);
  }
  return result;
}

function comparePivotValues(left, right) {
  var leftValue = left instanceof Date ? left.getTime() : left;
  var rightValue = right instanceof Date ? right.getTime() : right;
  if (leftValue == null && rightValue == null) return 0;
  if (leftValue == null) return -1;
  if (rightValue == null) return 1;
  if (typeof leftValue === 'number' && typeof rightValue === 'number') {
    return leftValue === rightValue ? 0 : leftValue < rightValue ? -1 : 1;
  }
  return String(leftValue).localeCompare(String(rightValue), undefined, {
    numeric: true,
    sensitivity: 'base'
  });
}

function normalizePivotSortDirection(value) {
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

function getPivotFieldSortDirection(field) {
  return field ? normalizePivotSortDirection(field.sortDirection) : 0;
}

function createEntryValueOrders(entries, fieldCount) {
  var orders = [];
  var entry;
  var key;
  var i;
  var e;
  for (i = 0; i < fieldCount; i += 1) {
    orders.push(new Map());
  }
  for (e = 0; e < entries.length; e += 1) {
    entry = entries[e];
    for (i = 0; i < entry.path.length && i < fieldCount; i += 1) {
      key = createPivotPathKey([entry.path[i]]);
      if (!orders[i].has(key)) {
        orders[i].set(key, orders[i].size);
      }
    }
  }
  return orders;
}

function comparePivotValueOrder(left, right, order) {
  var leftOrder = order && order.get(createPivotPathKey([left]));
  var rightOrder = order && order.get(createPivotPathKey([right]));
  if (leftOrder == null || rightOrder == null) {
    return null;
  }
  return leftOrder - rightOrder;
}

function compareEntries(left, right, fields, totalsBeforeData, valueOrders) {
  var length = Math.min(left.path.length, right.path.length);
  var direction;
  var orderCompared;
  var compared;
  var i;
  for (i = 0; i < length; i += 1) {
    compared = comparePivotValues(left.path[i], right.path[i]);
    if (compared) {
      direction = getPivotFieldSortDirection(fields[i]);
      if (direction) {
        return compared * direction;
      }
      orderCompared = comparePivotValueOrder(left.path[i], right.path[i], valueOrders[i]);
      return orderCompared == null ? compared : orderCompared;
    }
  }
  if (left.path.length === right.path.length) {
    return 0;
  }
  if (left.path.length < right.path.length) {
    return totalsBeforeData ? -1 : 1;
  }
  return totalsBeforeData ? 1 : -1;
}

function createAccumulator() {
  return {
    count: 0,
    numericCount: 0,
    sum: 0,
    weightedSum: 0,
    weightSum: 0,
    min: null,
    max: null
  };
}

function accumulateValue(accumulator, value, aggregate, weight) {
  var number;
  var numericWeight;
  if (value == null || value === '') {
    return;
  }
  accumulator.count += 1;
  if (aggregate === PivotAggregate.Sum || aggregate === PivotAggregate.Average) {
    number = Number(value);
    if (!isNaN(number)) {
      accumulator.sum += number;
      accumulator.numericCount += 1;
    }
  }
  if (aggregate === PivotAggregate.WeightedAverage) {
    number = Number(value);
    numericWeight = Number(weight);
    if (!isNaN(number) && !isNaN(numericWeight)) {
      accumulator.weightedSum += number * numericWeight;
      accumulator.weightSum += numericWeight;
    }
  }
  if (accumulator.min == null || comparePivotValues(value, accumulator.min) < 0) {
    accumulator.min = value;
  }
  if (accumulator.max == null || comparePivotValues(value, accumulator.max) > 0) {
    accumulator.max = value;
  }
}

function finalizeAccumulator(accumulator, aggregate) {
  if (!accumulator || !accumulator.count) {
    return aggregate === PivotAggregate.Count ? 0 : null;
  }
  if (aggregate === PivotAggregate.Count) return accumulator.count;
  if (aggregate === PivotAggregate.Average) {
    return accumulator.numericCount ? accumulator.sum / accumulator.numericCount : null;
  }
  if (aggregate === PivotAggregate.WeightedAverage) {
    return accumulator.weightSum ? accumulator.weightedSum / accumulator.weightSum : null;
  }
  if (aggregate === PivotAggregate.Min) return accumulator.min;
  if (aggregate === PivotAggregate.Max) return accumulator.max;
  return accumulator.sum;
}

function matchesFieldFilter(field, item) {
  var filter = field.filter;
  var value;
  var values;
  if (!filter) {
    return true;
  }
  value = field.getItemValue(item);
  if (typeof filter === 'function') {
    return filter(value, item) !== false;
  }
  if (Array.isArray(filter)) {
    return filter.some(function(filterValue) {
      return pivotValuesEqual(filterValue, value, field.dataType);
    });
  }
  if (typeof filter.predicate === 'function' && filter.predicate(value, item) === false) {
    return false;
  }
  values = Array.isArray(filter.values) ? filter.values : null;
  return !values || values.some(function(filterValue) {
    return pivotValuesEqual(filterValue, value, field.dataType);
  });
}

function pathMatches(item, fields, path) {
  var i;
  for (i = 0; i < path.length; i += 1) {
    if (!pivotValuesEqual(fields[i].getItemValue(item), path[i], fields[i].dataType)) {
      return false;
    }
  }
  return true;
}

function copyDefinitionField(field) {
  var filter = field.filter && Array.isArray(field.filter.values) ? {
    values: field.filter.values.slice()
  } : null;
  return {
    key: field.key,
    binding: field.binding,
    header: field.header,
    dataType: field.dataType,
    aggregate: field.aggregate,
    format: field.format,
    align: field.align,
    sortDirection: getPivotFieldSortDirection(field),
    descending: field.descending,
    filter: filter,
    groupBy: typeof field.groupBy === 'string' ? field.groupBy : null,
    weightBinding: field.weightBinding,
    showAs: field.showAs,
    width: field.width,
    visible: field.visible
  };
}

function createPivotAbortError() {
  var error = new Error('Pivot refresh was cancelled.');
  error.name = 'AbortError';
  return error;
}

function schedulePivotBatch(callback) {
  return setTimeout(callback, 0);
}

export function PivotEngine(options) {
  options = options || {};
  this.events = {};
  this._updateLevel = 0;
  this._pendingRefresh = false;
  this._asyncRefreshToken = null;
  this._asyncRefreshSequence = 0;
  this._disposed = false;
  this.asyncBatchSize = Math.max(1, Math.floor(Number(options.asyncBatchSize) || 1000));
  this._itemsSource = Array.isArray(options.itemsSource) ? options.itemsSource : [];
  this.autoGenerateFields = options.autoGenerateFields !== false;
  this.showRowTotals = normalizeTotals(options.showRowTotals, PivotShowTotals.GrandTotals);
  this.showColumnTotals = normalizeTotals(options.showColumnTotals, PivotShowTotals.GrandTotals);
  this.totalsBeforeData = options.totalsBeforeData === true;
  this.showZeros = options.showZeros === true;
  this.isUpdating = false;
  this.fields = [];
  this.rowFields = [];
  this.columnFields = [];
  this.valueFields = [];
  this.filterFields = [];
  this.pivotView = createEmptyPivotView(this);
  this._createEvents(options);
  this.setFields(options.fields || [], true);
  if (!this.fields.length && this.autoGenerateFields) {
    this.generateFields();
  }
  this.setViewFields('rowFields', options.rowFields || [], true);
  this.setViewFields('columnFields', options.columnFields || [], true);
  this.setViewFields('valueFields', options.valueFields || [], true);
  this.setViewFields('filterFields', options.filterFields || [], true);
  this.refresh();
}

function createEmptyPivotView(engine) {
  return {
    engine: engine,
    rows: [],
    rowEntries: [],
    columnEntries: [],
    dataColumns: [],
    filterFields: engine.filterFields.slice(),
    rowFields: [],
    columnFields: [],
    valueFields: []
  };
}

PivotEngine.prototype._createEvents = function(options) {
  var names = [
    'itemsSourceChanged',
    'viewDefinitionChanged',
    'updatingView',
    'updatedView',
    'progress',
    'error'
  ];
  var i;
  for (i = 0; i < names.length; i += 1) {
    this[names[i]] = new PivotEvent();
    if (typeof options[names[i]] === 'function') {
      this[names[i]].addHandler(options[names[i]], this);
    }
  }
};

PivotEngine.prototype.on = function(name, handler) {
  if (!this.events[name]) {
    this.events[name] = [];
  }
  if (typeof handler === 'function') {
    this.events[name].push(handler);
  }
  return this;
};

PivotEngine.prototype.off = function(name, handler) {
  var handlers = this.events[name] || [];
  var i;
  for (i = handlers.length - 1; i >= 0; i -= 1) {
    if (handlers[i] === handler) {
      handlers.splice(i, 1);
    }
  }
  return this;
};

PivotEngine.prototype.emit = function(name, args) {
  var handlers = (this.events[name] || []).slice();
  var event = this[name];
  var i;
  for (i = 0; i < handlers.length; i += 1) {
    handlers[i](args || {});
  }
  if (event && typeof event.raise === 'function') {
    event.raise(this, args || {});
  }
};

PivotEngine.prototype.setFields = function(definitions, silent) {
  var areaNames = ['rowFields', 'columnFields', 'valueFields', 'filterFields'];
  var areaKeys = {};
  var usedKeys = Object.create(null);
  var definition;
  var field;
  var key;
  var name;
  var i;
  definitions = Array.isArray(definitions) ? definitions : [];
  for (i = 0; i < areaNames.length; i += 1) {
    name = areaNames[i];
    areaKeys[name] = (this[name] || []).map(function(item) {
      return item.key;
    });
  }
  this.fields = [];
  for (i = 0; i < definitions.length; i += 1) {
    definition = definitions[i] || {};
    field = definition instanceof PivotField ? definition : new PivotField(
      this,
      definition.binding || '',
      definition.header,
      definition
    );
    field.engine = this;
    key = String(field.key || field.binding || ('field' + i));
    while (usedKeys[key]) {
      key += '_' + (i + 1);
    }
    field.key = key;
    usedKeys[key] = true;
    this.fields.push(field);
  }
  for (i = 0; i < areaNames.length; i += 1) {
    name = areaNames[i];
    this.setViewFields(name, areaKeys[name], true);
  }
  if (!silent) {
    this.emit('viewDefinitionChanged', { property: 'fields' });
    this.refresh();
  }
};

PivotEngine.prototype.generateFields = function() {
  var sample = this._itemsSource.length ? this._itemsSource[0] : null;
  var definitions = [];
  var keys;
  var i;
  if (!sample || typeof sample !== 'object') {
    return;
  }
  keys = Object.keys(sample);
  for (i = 0; i < keys.length; i += 1) {
    definitions.push({
      key: keys[i],
      binding: keys[i],
      header: createHeader(keys[i]),
      dataType: inferDataType(sample[keys[i]])
    });
  }
  this.setFields(definitions, true);
};

PivotEngine.prototype.getField = function(reference) {
  var text;
  var i;
  if (reference instanceof PivotField) {
    return reference.engine === this ? reference : null;
  }
  if (reference && typeof reference === 'object') {
    reference = reference.key || reference.header || reference.binding;
  }
  text = String(reference == null ? '' : reference);
  for (i = 0; i < this.fields.length; i += 1) {
    if (this.fields[i].key === text || this.fields[i].header === text || this.fields[i].binding === text) {
      return this.fields[i];
    }
  }
  return null;
};

PivotEngine.prototype.setViewFields = function(name, references, silent) {
  var result = [];
  var field;
  var i;
  references = Array.isArray(references) ? references : [];
  for (i = 0; i < references.length; i += 1) {
    field = this.getField(references[i]);
    if (field && result.indexOf(field) < 0) {
      result.push(field);
    }
  }
  this[name] = result;
  if (!silent) {
    this.emit('viewDefinitionChanged', { property: name });
    this.refresh();
  }
};

PivotEngine.prototype.setItemsSource = function(itemsSource, silent) {
  this._itemsSource = Array.isArray(itemsSource) ? itemsSource : [];
  if (this.autoGenerateFields && !this.fields.length) {
    this.generateFields();
  }
  if (!silent) {
    this.emit('itemsSourceChanged', { itemsSource: this._itemsSource });
    this.refresh();
  }
};

PivotEngine.prototype.beginUpdate = function() {
  this._updateLevel += 1;
};

PivotEngine.prototype.endUpdate = function() {
  if (this._updateLevel > 0) {
    this._updateLevel -= 1;
  }
  if (!this._updateLevel && this._pendingRefresh) {
    this._pendingRefresh = false;
    this.refresh();
  }
};

PivotEngine.prototype.deferUpdate = function(callback) {
  var result;
  var self = this;
  this.beginUpdate();
  try {
    result = callback();
  } catch (error) {
    this.endUpdate();
    throw error;
  }
  if (result && typeof result.then === 'function') {
    return result.then(function(value) {
      self.endUpdate();
      return value;
    }, function(error) {
      self.endUpdate();
      throw error;
    });
  }
  this.endUpdate();
  return result;
};

PivotEngine.prototype.refresh = function() {
  var view;
  if (this._updateLevel) {
    this._pendingRefresh = true;
    return this.pivotView;
  }
  this.cancelRefresh();
  this.isUpdating = true;
  this.emit('updatingView', {});
  try {
    view = this._buildPivotView();
    this.pivotView = view;
    this.emit('progress', { progress: 1 });
    this.emit('updatedView', { pivotView: view });
    return view;
  } catch (error) {
    this.emit('error', { error: error });
    throw error;
  } finally {
    this.isUpdating = false;
  }
};

PivotEngine.prototype.refreshAsync = function(options) {
  var self = this;
  var token;
  var state;
  var batchSize;
  var total;
  options = options || {};
  if (this._updateLevel) {
    this._pendingRefresh = true;
    return Promise.resolve(this.pivotView);
  }
  this.cancelRefresh();
  batchSize = Math.max(1, Math.floor(Number(options.batchSize) || this.asyncBatchSize));
  total = this._itemsSource.length;
  token = {
    id: this._asyncRefreshSequence += 1,
    cancelled: false
  };
  this._asyncRefreshToken = token;
  this.isUpdating = true;
  this.emit('updatingView', { async: true, total: total });
  state = this._createPivotBuildState();
  return new Promise(function(resolve, reject) {
    function finishError(error) {
      if (self._asyncRefreshToken === token) {
        self._asyncRefreshToken = null;
        self.isUpdating = false;
      }
      if (error && error.name !== 'AbortError') {
        self.emit('error', { error: error, async: true });
      }
      reject(error);
    }

    function runBatch() {
      var end;
      var progress;
      var view;
      if (token.cancelled || self._disposed) {
        finishError(createPivotAbortError());
        return;
      }
      try {
        end = Math.min(total, state.index + batchSize);
        while (state.index < end) {
          self._accumulatePivotItem(state, self._itemsSource[state.index]);
          state.index += 1;
        }
        progress = total ? state.index / total : 1;
        self.emit('progress', {
          async: true,
          progress: progress,
          processed: state.index,
          total: total
        });
        if (state.index < total) {
          schedulePivotBatch(runBatch);
          return;
        }
        view = self._finalizePivotBuildState(state);
        if (token.cancelled || self._disposed) {
          finishError(createPivotAbortError());
          return;
        }
        self.pivotView = view;
        if (self._asyncRefreshToken === token) {
          self._asyncRefreshToken = null;
          self.isUpdating = false;
        }
        self.emit('updatedView', { pivotView: view, async: true });
        resolve(view);
      } catch (error) {
        finishError(error);
      }
    }

    schedulePivotBatch(runBatch);
  });
};

PivotEngine.prototype.cancelRefresh = function() {
  if (!this._asyncRefreshToken) {
    return false;
  }
  this._asyncRefreshToken.cancelled = true;
  return true;
};

PivotEngine.prototype._buildPivotView = function() {
  var state = this._createPivotBuildState();
  while (state.index < this._itemsSource.length) {
    this._accumulatePivotItem(state, this._itemsSource[state.index]);
    state.index += 1;
  }
  return this._finalizePivotBuildState(state);
};

PivotEngine.prototype._createPivotBuildState = function() {
  return {
    index: 0,
    rowEntryMap: new Map(),
    columnEntryMap: new Map(),
    accumulatorMap: new Map(),
    filteredItems: []
  };
};

PivotEngine.prototype._accumulatePivotItem = function(state, item) {
  var rowPath;
  var columnPath;
  var rowPaths;
  var columnPaths;
  var rowKey;
  var columnKey;
  var accumulatorKey;
  var accumulator;
  var field;
  var r;
  var c;
  var v;
  if (!this._itemMatchesFilters(item)) {
    return;
  }
  state.filteredItems.push(item);
  rowPath = this.rowFields.map(function(rowField) {
    return rowField.getItemValue(item);
  });
  columnPath = this.columnFields.map(function(columnField) {
    return columnField.getItemValue(item);
  });
  rowPaths = createAggregatePaths(rowPath, this.showRowTotals);
  columnPaths = createAggregatePaths(columnPath, this.showColumnTotals);
  for (r = 0; r < rowPaths.length; r += 1) {
    rowKey = createPivotPathKey(rowPaths[r]);
    if (!state.rowEntryMap.has(rowKey)) {
      state.rowEntryMap.set(rowKey, createEntry(rowPaths[r], this.rowFields.length));
    }
    for (c = 0; c < columnPaths.length; c += 1) {
      columnKey = createPivotPathKey(columnPaths[c]);
      if (!state.columnEntryMap.has(columnKey)) {
        state.columnEntryMap.set(columnKey, createEntry(columnPaths[c], this.columnFields.length));
      }
      for (v = 0; v < this.valueFields.length; v += 1) {
        field = this.valueFields[v];
        accumulatorKey = rowKey + '\u001f' + columnKey + '\u001f' + field.key;
        accumulator = state.accumulatorMap.get(accumulatorKey);
        if (!accumulator) {
          accumulator = createAccumulator();
          state.accumulatorMap.set(accumulatorKey, accumulator);
        }
        accumulateValue(
          accumulator,
          field.getItemValue(item),
          field.aggregate,
          field.getWeightValue(item)
        );
      }
    }
  }
};

PivotEngine.prototype._finalizePivotBuildState = function(state) {
  var rowEntryMap = new Map();
  var columnEntryMap = new Map();
  var accumulatorMap = new Map();
  var filteredItems = [];
  var rowEntries;
  var columnEntries;
  var dataColumns = [];
  var rows = [];
  var accumulatorKey;
  var row;
  var dataColumn;
  var i;
  var r;
  var c;
  var v;
  rowEntryMap = state.rowEntryMap;
  columnEntryMap = state.columnEntryMap;
  accumulatorMap = state.accumulatorMap;
  filteredItems = state.filteredItems;
  if (!this.rowFields.length && !rowEntryMap.size) {
    rowEntryMap.set(createPivotPathKey([]), createEntry([], 0));
  }
  if (!this.columnFields.length && !columnEntryMap.size) {
    columnEntryMap.set(createPivotPathKey([]), createEntry([], 0));
  }
  rowEntries = Array.from(rowEntryMap.values());
  columnEntries = Array.from(columnEntryMap.values());
  rowEntries.sort(this._createEntryComparer(this.rowFields, rowEntries));
  columnEntries.sort(this._createEntryComparer(this.columnFields, columnEntries));
  for (c = 0; c < columnEntries.length; c += 1) {
    for (v = 0; v < this.valueFields.length; v += 1) {
      dataColumns.push({
        binding: '__pivot_value_' + c + '_' + v,
        entry: columnEntries[c],
        valueField: this.valueFields[v],
        columnEntryIndex: c,
        valueFieldIndex: v
      });
    }
  }
  for (r = 0; r < rowEntries.length; r += 1) {
    row = {};
    Object.defineProperty(row, '__pivotMeta', {
      configurable: true,
      enumerable: false,
      value: rowEntries[r]
    });
    for (i = 0; i < this.rowFields.length; i += 1) {
      row['__pivot_row_' + i] = i < rowEntries[r].path.length ? rowEntries[r].path[i] : null;
    }
    for (c = 0; c < dataColumns.length; c += 1) {
      dataColumn = dataColumns[c];
      accumulatorKey = rowEntries[r].key + '\u001f' + dataColumn.entry.key + '\u001f' + dataColumn.valueField.key;
      row[dataColumn.binding] = finalizeAccumulator(
        accumulatorMap.get(accumulatorKey),
        dataColumn.valueField.aggregate
      );
      if (row[dataColumn.binding] == null && this.showZeros) {
        row[dataColumn.binding] = 0;
      }
    }
    rows.push(row);
  }
  applyShowAsValues(rows, rowEntries, dataColumns);
  this._filteredItems = filteredItems;
  return {
    engine: this,
    rows: rows,
    rowEntries: rowEntries,
    columnEntries: columnEntries,
    dataColumns: dataColumns,
    rowFields: this.rowFields.slice(),
    columnFields: this.columnFields.slice(),
    valueFields: this.valueFields.slice(),
    filterFields: this.filterFields.slice(),
    sourceCount: this._itemsSource.length,
    filteredCount: filteredItems.length
  };
};

function dividePivotValue(value, total) {
  value = Number(value);
  total = Number(total);
  if (!isFinite(value) || !isFinite(total) || total === 0) {
    return null;
  }
  return value / total;
}

function applyShowAsValues(rows, rowEntries, dataColumns) {
  var rawRows = rows.map(function(row) {
    var copy = {};
    dataColumns.forEach(function(column) {
      copy[column.binding] = row[column.binding];
    });
    return copy;
  });
  var grandRowIndex = rowEntries.findIndex(function(entry) {
    return entry.path.length === 0;
  });
  var rowTotalColumns = Object.create(null);
  var previousByField;
  var runningByField;
  var column;
  var field;
  var rawValue;
  var previous;
  var running;
  var r;
  var c;
  for (c = 0; c < dataColumns.length; c += 1) {
    column = dataColumns[c];
    if (column.entry.path.length === 0) {
      rowTotalColumns[column.valueField.key] = column;
    }
  }
  for (r = 0; r < rows.length; r += 1) {
    previousByField = Object.create(null);
    runningByField = Object.create(null);
    for (c = 0; c < dataColumns.length; c += 1) {
      column = dataColumns[c];
      field = column.valueField;
      rawValue = rawRows[r][column.binding];
      if (field.showAs === PivotShowAs.PercentOfGrandTotal) {
        rows[r][column.binding] = grandRowIndex >= 0 && rowTotalColumns[field.key] ?
          dividePivotValue(rawValue, rawRows[grandRowIndex][rowTotalColumns[field.key].binding]) : null;
      } else if (field.showAs === PivotShowAs.PercentOfRowTotal) {
        rows[r][column.binding] = rowTotalColumns[field.key] ?
          dividePivotValue(rawValue, rawRows[r][rowTotalColumns[field.key].binding]) : null;
      } else if (field.showAs === PivotShowAs.PercentOfColumnTotal) {
        rows[r][column.binding] = grandRowIndex >= 0 ?
          dividePivotValue(rawValue, rawRows[grandRowIndex][column.binding]) : null;
      } else if (field.showAs === PivotShowAs.DifferenceFromPrevious) {
        if (!column.entry.isLeaf) {
          continue;
        }
        previous = previousByField[field.key];
        rows[r][column.binding] = previous == null || rawValue == null ? null :
          Number(rawValue) - Number(previous);
      } else if (field.showAs === PivotShowAs.PercentDifferenceFromPrevious) {
        if (!column.entry.isLeaf) {
          continue;
        }
        previous = previousByField[field.key];
        rows[r][column.binding] = previous == null || rawValue == null ? null :
          dividePivotValue(Number(rawValue) - Number(previous), previous);
      } else if (field.showAs === PivotShowAs.RunningTotal) {
        if (!column.entry.isLeaf) {
          continue;
        }
        running = Number(runningByField[field.key]) || 0;
        running += Number(rawValue) || 0;
        runningByField[field.key] = running;
        rows[r][column.binding] = running;
      }
      previousByField[field.key] = rawValue;
    }
  }
}

function createEntry(path, fieldCount) {
  return {
    key: createPivotPathKey(path),
    path: path.slice(),
    level: path.length,
    isSubtotal: path.length > 0 && path.length < fieldCount,
    isGrandTotal: fieldCount > 0 && path.length === 0,
    isLeaf: path.length === fieldCount
  };
}

PivotEngine.prototype._createEntryComparer = function(fields, entries) {
  var totalsBeforeData = this.totalsBeforeData;
  var valueOrders = createEntryValueOrders(entries || [], fields.length);
  return function(left, right) {
    return compareEntries(left, right, fields, totalsBeforeData, valueOrders);
  };
};

PivotEngine.prototype._itemMatchesFilters = function(item) {
  var i;
  for (i = 0; i < this.fields.length; i += 1) {
    if (!matchesFieldFilter(this.fields[i], item)) {
      return false;
    }
  }
  return true;
};

PivotEngine.prototype.getDetail = function(row, column) {
  var rowEntry = row && row.__pivotMeta ? row.__pivotMeta : row;
  var columnEntry = column && column.entry ? column.entry : column;
  var source = this._filteredItems || [];
  var result = [];
  var item;
  var i;
  if (!rowEntry || !columnEntry) {
    return result;
  }
  for (i = 0; i < source.length; i += 1) {
    item = source[i];
    if (pathMatches(item, this.rowFields, rowEntry.path) &&
      pathMatches(item, this.columnFields, columnEntry.path)) {
      result.push(item);
    }
  }
  return result;
};

PivotEngine.prototype.getKeys = function(row, column) {
  var rowEntry = row && row.__pivotMeta ? row.__pivotMeta : row;
  var columnEntry = column && column.entry ? column.entry : column;
  return {
    rowKey: {
      fields: this.rowFields.map(function(field) { return field.key; }).slice(0, rowEntry ? rowEntry.path.length : 0),
      values: rowEntry ? rowEntry.path.slice() : []
    },
    columnKey: {
      fields: this.columnFields.map(function(field) { return field.key; }).slice(0, columnEntry ? columnEntry.path.length : 0),
      values: columnEntry ? columnEntry.path.slice() : []
    }
  };
};

PivotEngine.prototype.removeField = function(reference) {
  var field = this.getField(reference);
  var lists = ['rowFields', 'columnFields', 'valueFields', 'filterFields'];
  var index;
  var i;
  if (!field) {
    return false;
  }
  for (i = 0; i < lists.length; i += 1) {
    index = this[lists[i]].indexOf(field);
    if (index >= 0) {
      this[lists[i]].splice(index, 1);
    }
  }
  this.emit('viewDefinitionChanged', { property: 'fields', field: field });
  this.refresh();
  return true;
};

Object.defineProperties(PivotEngine.prototype, {
  itemsSource: {
    get: function() {
      return this._itemsSource;
    },
    set: function(value) {
      this.setItemsSource(value);
    }
  },
  viewDefinition: {
    get: function() {
      return {
        fields: this.fields.map(copyDefinitionField),
        rowFields: this.rowFields.map(function(field) { return field.key; }),
        columnFields: this.columnFields.map(function(field) { return field.key; }),
        valueFields: this.valueFields.map(function(field) { return field.key; }),
        filterFields: this.filterFields.map(function(field) { return field.key; }),
        showRowTotals: this.showRowTotals,
        showColumnTotals: this.showColumnTotals,
        totalsBeforeData: this.totalsBeforeData,
        showZeros: this.showZeros
      };
    },
    set: function(definition) {
      definition = definition || {};
      this.beginUpdate();
      try {
        if (Array.isArray(definition.fields)) {
          this.setFields(definition.fields, true);
        }
        this.setViewFields('rowFields', definition.rowFields || [], true);
        this.setViewFields('columnFields', definition.columnFields || [], true);
        this.setViewFields('valueFields', definition.valueFields || [], true);
        this.setViewFields('filterFields', definition.filterFields || [], true);
        this.showRowTotals = normalizeTotals(definition.showRowTotals, this.showRowTotals);
        this.showColumnTotals = normalizeTotals(definition.showColumnTotals, this.showColumnTotals);
        this.totalsBeforeData = definition.totalsBeforeData === true;
        this.showZeros = definition.showZeros === true;
        this._pendingRefresh = true;
      } finally {
        this.endUpdate();
      }
      this.emit('viewDefinitionChanged', { property: 'viewDefinition' });
    }
  }
});

PivotEngine.prototype.formatFieldValue = function(field, value, locale) {
  var date;
  if (value == null) {
    return '';
  }
  if (field && field.dataType === 'date') {
    date = normalizeDate(value);
    if (!date) {
      return String(value);
    }
    try {
      return date.toLocaleDateString(locale || undefined);
    } catch (error) {
      return date.toLocaleDateString();
    }
  }
  return String(value);
};

PivotEngine.prototype.dispose = function() {
  var name;
  this._disposed = true;
  this.cancelRefresh();
  for (name in this.events) {
    if (Object.prototype.hasOwnProperty.call(this.events, name)) {
      this.events[name].length = 0;
    }
  }
  ['itemsSourceChanged', 'viewDefinitionChanged', 'updatingView', 'updatedView', 'progress', 'error'].forEach(function(name) {
    if (this[name]) {
      this[name].handlers.length = 0;
    }
  }, this);
  this._itemsSource = [];
  this._filteredItems = [];
  this.pivotView = createEmptyPivotView(this);
};
