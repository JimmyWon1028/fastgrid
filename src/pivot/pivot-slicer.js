function resolvePivotSlicerHostElement(element) {
  if (typeof element === 'string') {
    return typeof document === 'undefined' ? null : document.querySelector(element);
  }
  return element && element.nodeType === 1 ? element : null;
}

function getPivotSlicerMessageValue(source, path) {
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

function getPivotSlicerValueKey(value) {
  if (value instanceof Date) {
    return 'date:' + value.toISOString();
  }
  if (typeof value === 'number' && isNaN(value)) {
    return 'number:NaN';
  }
  return typeof value + ':' + String(value);
}

function formatPivotSlicerValue(field, value, locale) {
  if (value == null || value === '') {
    return '(blank)';
  }
  if (field && field.engine && typeof field.engine.formatFieldValue === 'function') {
    return field.engine.formatFieldValue(field, value, locale);
  }
  return String(value);
}

export function getPivotSlicerValues(engine, field) {
  var values = [];
  var seen = Object.create(null);
  var source = engine && Array.isArray(engine.itemsSource) ? engine.itemsSource : [];
  var value;
  var key;
  var i;
  if (!field) {
    return values;
  }
  for (i = 0; i < source.length; i += 1) {
    value = field.getItemValue(source[i]);
    key = getPivotSlicerValueKey(value);
    if (!seen[key]) {
      seen[key] = true;
      values.push(value);
    }
  }
  return values;
}

export function createPivotSlicerFactory(
  Control,
  registerControl,
  unregisterControl,
  PivotEngine,
  FabGrid
) {
  function PivotSlicer(element, options) {
    var host = resolvePivotSlicerHostElement(element);
    options = options || {};
    if (!host) {
      throw new TypeError('PivotSlicer host element was not found.');
    }
    Control.call(this);
    this.hostElement = host;
    this.options = options;
    this.locale = options.locale || 'en';
    this.messages = options.messages || null;
    this.showSearch = options.showSearch !== false;
    this.deferApply = options.deferApply !== false;
    this._engine = null;
    this._field = null;
    this._draftKeys = Object.create(null);
    this._values = [];
    this._updatedHandler = this.refresh.bind(this);
    this._createDom();
    this._bindEvents();
    registerControl(host, this);
    if (options.engine || options.itemsSource) {
      this.setItemsSource(options.engine || options.itemsSource);
    }
    if (options.field != null) {
      this.setField(options.field);
    } else {
      this.refresh();
    }
  }

  PivotSlicer.prototype = Object.create(Control.prototype);
  PivotSlicer.prototype.constructor = PivotSlicer;

  PivotSlicer.prototype._createDom = function() {
    this.hostElement.innerHTML = '';
    this.hostElement.classList.add('fg-root', 'fg-pivot-slicer');
    this.hostElement.setAttribute('role', 'group');
    this.titleElement = document.createElement('div');
    this.titleElement.className = 'fg-pivot-slicer-title';
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'search';
    this.searchInput.className = 'fg-pivot-slicer-search';
    this.selectAllLabel = document.createElement('label');
    this.selectAllLabel.className = 'fg-pivot-slicer-select-all';
    this.selectAllInput = document.createElement('input');
    this.selectAllInput.type = 'checkbox';
    this.selectAllText = document.createElement('span');
    this.selectAllLabel.appendChild(this.selectAllInput);
    this.selectAllLabel.appendChild(this.selectAllText);
    this.valuesElement = document.createElement('div');
    this.valuesElement.className = 'fg-pivot-slicer-values';
    this.valuesElement.setAttribute('role', 'listbox');
    this.valuesElement.setAttribute('aria-multiselectable', 'true');
    this.footerElement = document.createElement('div');
    this.footerElement.className = 'fg-pivot-slicer-footer';
    this.applyButton = document.createElement('button');
    this.applyButton.type = 'button';
    this.applyButton.setAttribute('data-action', 'apply');
    this.clearButton = document.createElement('button');
    this.clearButton.type = 'button';
    this.clearButton.setAttribute('data-action', 'clear');
    this.footerElement.appendChild(this.clearButton);
    this.footerElement.appendChild(this.applyButton);
    this.hostElement.appendChild(this.titleElement);
    this.hostElement.appendChild(this.searchInput);
    this.hostElement.appendChild(this.selectAllLabel);
    this.hostElement.appendChild(this.valuesElement);
    this.hostElement.appendChild(this.footerElement);
    this.applyLocaleToDom();
  };

  PivotSlicer.prototype._bindEvents = function() {
    this.addEventListener(this.searchInput, 'input', this._renderValues.bind(this));
    this.addEventListener(this.selectAllInput, 'change', this._handleSelectAll.bind(this));
    this.addEventListener(this.valuesElement, 'change', this._handleValueChange.bind(this));
    this.addEventListener(this.footerElement, 'click', this._handleAction.bind(this));
  };

  PivotSlicer.prototype.getText = function(path) {
    var locales = FabGrid.locales || {};
    var localeName = this.locale || 'en';
    var baseName = localeName.split('-')[0];
    return getPivotSlicerMessageValue(this.messages, path) ||
      getPivotSlicerMessageValue(locales[localeName], path) ||
      getPivotSlicerMessageValue(locales[baseName], path) ||
      getPivotSlicerMessageValue(locales.en, path) || path;
  };

  PivotSlicer.prototype.applyLocaleToDom = function() {
    this.hostElement.setAttribute('aria-label', this.getText('pivot.slicer.ariaLabel'));
    this.searchInput.placeholder = this.getText('pivot.slicer.search');
    this.selectAllText.textContent = this.getText('pivot.slicer.selectAll');
    this.applyButton.textContent = this.getText('pivot.slicer.apply');
    this.clearButton.textContent = this.getText('pivot.slicer.clear');
  };

  PivotSlicer.prototype.setLocale = function(locale, messages) {
    this.locale = locale || 'en';
    if (messages !== undefined) {
      this.messages = messages;
    }
    this.applyLocaleToDom();
    this.refresh();
    return this;
  };

  PivotSlicer.prototype.setItemsSource = function(engine) {
    if (!(engine instanceof PivotEngine)) {
      throw new TypeError('PivotSlicer itemsSource must be a fabui.pivot.PivotEngine instance.');
    }
    if (this._engine === engine) {
      return this;
    }
    if (this._engine && this._engine.updatedView) {
      this._engine.updatedView.removeHandler(this._updatedHandler, this);
    }
    this._engine = engine;
    this._engine.updatedView.addHandler(this._updatedHandler, this);
    if (this._field) {
      this._field = this._engine.getField(this._field.key);
    }
    this.refresh();
    return this;
  };

  PivotSlicer.prototype.setField = function(reference) {
    this._field = this._engine ? this._engine.getField(reference) : reference;
    if (reference != null && !this._field) {
      throw new TypeError('PivotSlicer field was not found in the PivotEngine.');
    }
    this.refresh();
    return this;
  };

  PivotSlicer.prototype._syncDraftFromField = function() {
    var selected = this._field && this._field.filter && Array.isArray(this._field.filter.values) ?
      this._field.filter.values : this._values;
    var keys = Object.create(null);
    var i;
    for (i = 0; i < selected.length; i += 1) {
      keys[getPivotSlicerValueKey(selected[i])] = true;
    }
    this._draftKeys = keys;
  };

  PivotSlicer.prototype.refresh = function() {
    this._values = getPivotSlicerValues(this._engine, this._field);
    this._syncDraftFromField();
    this.titleElement.textContent = this._field ? this._field.header : this.getText('pivot.slicer.noField');
    this.searchInput.style.display = this.showSearch ? '' : 'none';
    this._renderValues();
    return this;
  };

  PivotSlicer.prototype._renderValues = function() {
    var search = String(this.searchInput.value || '').toLowerCase();
    var value;
    var key;
    var label;
    var input;
    var text;
    var visibleCount = 0;
    var selectedCount = 0;
    var i;
    this.valuesElement.innerHTML = '';
    for (i = 0; i < this._values.length; i += 1) {
      value = this._values[i];
      key = getPivotSlicerValueKey(value);
      text = formatPivotSlicerValue(this._field, value, this.locale);
      if (search && text.toLowerCase().indexOf(search) < 0) {
        continue;
      }
      label = document.createElement('label');
      label.className = 'fg-pivot-slicer-value';
      label.setAttribute('role', 'option');
      input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = this._draftKeys[key] === true;
      input.setAttribute('data-value-key', key);
      label.setAttribute('aria-selected', input.checked ? 'true' : 'false');
      label.appendChild(input);
      label.appendChild(document.createTextNode(text));
      this.valuesElement.appendChild(label);
      visibleCount += 1;
      if (input.checked) selectedCount += 1;
    }
    this.selectAllInput.checked = visibleCount > 0 && selectedCount === visibleCount;
    this.selectAllInput.indeterminate = selectedCount > 0 && selectedCount < visibleCount;
    this.applyButton.style.display = this.deferApply ? '' : 'none';
  };

  PivotSlicer.prototype._handleSelectAll = function() {
    var inputs = this.valuesElement.querySelectorAll('input[data-value-key]');
    var checked = this.selectAllInput.checked;
    var i;
    for (i = 0; i < inputs.length; i += 1) {
      this._draftKeys[inputs[i].getAttribute('data-value-key')] = checked;
    }
    this._renderValues();
    if (!this.deferApply) {
      this.apply();
    }
  };

  PivotSlicer.prototype._handleValueChange = function(event) {
    var key = event.target.getAttribute('data-value-key');
    if (!key) return;
    this._draftKeys[key] = event.target.checked;
    this._renderValues();
    if (!this.deferApply) {
      this.apply();
    }
  };

  PivotSlicer.prototype._handleAction = function(event) {
    var action = event.target.getAttribute('data-action');
    if (action === 'apply') {
      this.apply();
    } else if (action === 'clear') {
      this.clear();
    }
  };

  PivotSlicer.prototype.apply = function() {
    var selected = this._values.filter(function(value) {
      return this._draftKeys[getPivotSlicerValueKey(value)] === true;
    }, this);
    if (!this._engine || !this._field) {
      return false;
    }
    this._field.filter = selected.length === this._values.length ? null : { values: selected };
    this._engine.emit('viewDefinitionChanged', { property: 'filter', field: this._field });
    this._engine.refresh();
    return true;
  };

  PivotSlicer.prototype.clear = function() {
    if (!this._engine || !this._field) {
      return false;
    }
    this._field.filter = null;
    this._syncDraftFromField();
    this._engine.emit('viewDefinitionChanged', { property: 'filter', field: this._field });
    this._engine.refresh();
    return true;
  };

  PivotSlicer.prototype.dispose = function() {
    if (this._engine && this._engine.updatedView) {
      this._engine.updatedView.removeHandler(this._updatedHandler, this);
    }
    this.removeEventListener();
    unregisterControl(this.hostElement, this);
    this.hostElement.innerHTML = '';
    this.hostElement.classList.remove('fg-root', 'fg-pivot-slicer');
    this._engine = null;
    this._field = null;
  };

  Object.defineProperties(PivotSlicer.prototype, {
    engine: {
      get: function() { return this._engine; },
      set: function(value) { this.setItemsSource(value); }
    },
    itemsSource: {
      get: function() { return this._engine; },
      set: function(value) { this.setItemsSource(value); }
    },
    field: {
      get: function() { return this._field; },
      set: function(value) { this.setField(value); }
    },
    selectedValues: {
      get: function() {
        return this._values.filter(function(value) {
          return this._draftKeys[getPivotSlicerValueKey(value)] === true;
        }, this);
      }
    }
  });

  return PivotSlicer;
}
