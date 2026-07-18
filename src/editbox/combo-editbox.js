import { ComboPopup } from './combo-popup.js?v=20260718-final-audit-v1';
import { normalizeEditorIconDescriptors } from './editor-icons.js?v=20260718-editor-icons-v1';

export function createComboBoxFactory(TextBox, editorDefinitions) {
  'use strict';

  if (typeof TextBox !== 'function') {
    throw new Error('fabui.ComboBox requires fabui.TextBox.');
  }

  editorDefinitions = editorDefinitions || {};
  var editorDefinition = editorDefinitions.combo || editorDefinitions.combobox || null;

  var localePacks = {
    en: { openListText: 'Open list' },
    'zh-TW': { openListText: '開啟清單' },
    'zh-CN': { openListText: '打开列表' }
  };

  var comboDefaults = {
    iconWidth: 28,
    valueField: 'value',
    textField: 'text',
    groupField: null,
    groupPosition: 'static',
    groupFormatter: null,
    mode: 'local',
    method: 'post',
    url: null,
    data: null,
    queryParams: {},
    panelWidth: null,
    panelHeight: 300,
    panelMinWidth: null,
    panelMaxWidth: null,
    panelMinHeight: null,
    panelMaxHeight: null,
    panelAlign: 'left',
    panelValign: 'auto',
    multiple: false,
    multiline: false,
    separator: ',',
    hasDownArrow: true,
    selectOnNavigation: true,
    showItemIcon: false,
    showValueInList: false,
    limitToList: false,
    delay: 200,
    locale: 'en',
    openListText: null,
    filter: null,
    formatter: null,
    loader: null,
    loadFilter: null,
    onBeforeLoad: null,
    onLoadSuccess: null,
    onLoadError: null,
    onSelect: null,
    onUnselect: null,
    onClick: null,
    onChange: null,
    onShowPanel: null,
    onHidePanel: null
  };

  function assign(target) {
    var index;
    var source;
    var key;
    for (index = 1; index < arguments.length; index += 1) {
      source = arguments[index] || {};
      for (key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
      }
    }
    return target;
  }

  function resolveElement(element) {
    return typeof element === 'string' ? document.querySelector(element) : element;
  }

  function uniqueStrings(values) {
    var result = [];
    (values || []).forEach(function(value) {
      value = value == null ? '' : String(value);
      if (result.indexOf(value) < 0) result.push(value);
    });
    return result;
  }

  function readElementOptions(element) {
    var options = {};
    var stringNames = ['valueField', 'textField', 'groupField', 'groupPosition', 'mode', 'method', 'url', 'separator', 'panelAlign', 'panelValign'];
    var numberNames = ['panelWidth', 'panelHeight', 'panelMinWidth', 'panelMaxWidth', 'panelMinHeight', 'panelMaxHeight', 'delay'];
    var booleanNames = ['multiple', 'multiline', 'hasDownArrow', 'selectOnNavigation', 'showItemIcon', 'showValueInList', 'limitToList'];
    var index;
    var value;
    for (index = 0; index < stringNames.length; index += 1) {
      value = element.getAttribute(stringNames[index]);
      if (value != null && value !== '') options[stringNames[index]] = value;
    }
    for (index = 0; index < numberNames.length; index += 1) {
      value = element.getAttribute(numberNames[index]);
      if (value != null && value !== '') options[numberNames[index]] = isFinite(Number(value)) ? Number(value) : value;
    }
    for (index = 0; index < booleanNames.length; index += 1) {
      value = element.getAttribute(booleanNames[index]);
      if (value != null) options[booleanNames[index]] = value !== 'false';
    }
    if (element.hasAttribute('multiple')) options.multiple = true;
    options.disabled = element.disabled;
    options.readonly = element.readOnly;
    options.required = element.required;
    value = element.getAttribute('label');
    if (value) options.label = value;
    value = element.getAttribute('labelPosition');
    if (value) options.labelPosition = value;
    return options;
  }

  function normalizeLocale(name) {
    if (localePacks[name]) return name;
    if (/^zh(?:-|_)?tw/i.test(name || '')) return 'zh-TW';
    if (/^zh/i.test(name || '')) return 'zh-CN';
    return 'en';
  }

  function encodeParams(params) {
    var parts = [];
    Object.keys(params || {}).forEach(function(key) {
      var value = params[key];
      if (value == null) return;
      parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)));
    });
    return parts.join('&');
  }

  function ComboBox(element, options) {
    var source = resolveElement(element);
    var userOptions = options || {};
    var markupOptions;
    var textOptions;
    var icons;
    var self = this;
    if (!(this instanceof ComboBox)) return new ComboBox(element, options);
    if (!source || !/^(INPUT|SELECT|TEXTAREA)$/.test(source.tagName)) {
      throw new Error('fabui.ComboBox requires an input, select, or textarea element.');
    }
    if (source.__fabuiComboBox) return source.__fabuiComboBox;

    this._source = source;
    this._listeners = {};
    this._data = [];
    this._filteredData = [];
    this._values = [];
    this._activeIndex = -1;
    this._panelVisible = false;
    this._destroyed = false;
    this._queryTimer = null;
    this._requestToken = 0;
    this._originalDisplay = source.style.display;
    this._originalAriaHidden = source.getAttribute('aria-hidden');
    markupOptions = readElementOptions(source);
    this._options = assign({}, ComboBox.defaults, markupOptions, userOptions);
    this._options.multiple = Boolean(this._options.multiple);
    this._options.multiline = Boolean(this._options.multiline);
    this._options.mode = this._options.mode === 'remote' ? 'remote' : 'local';
    this._options.method = String(this._options.method || 'post').toLowerCase();
    this._options.locale = normalizeLocale(this._options.locale);
    if (!Object.prototype.hasOwnProperty.call(userOptions, 'openListText')) {
      this._options.openListText = localePacks[this._options.locale].openListText;
    }
    this._options.filter = typeof this._options.filter === 'function' ? this._options.filter : function(query, row) {
      return String(row[this._options.textField] == null ? '' : row[this._options.textField]).toLowerCase().indexOf(String(query || '').toLowerCase()) >= 0;
    };
    this._options.loadFilter = typeof this._options.loadFilter === 'function' ? this._options.loadFilter : function(data) { return data; };
    this._selectData = source.tagName === 'SELECT' ? this._readSelectData(source) : [];
    this._initialValues = this._readInitialValues(userOptions);

    if (source.tagName === 'SELECT') {
      this._textboxSource = document.createElement('input');
      this._textboxSource.type = 'text';
      source.parentNode.insertBefore(this._textboxSource, source);
      source.style.display = 'none';
      source.setAttribute('aria-hidden', 'true');
    } else {
      this._textboxSource = source;
    }

    icons = normalizeEditorIconDescriptors(this._options.icons);
    if (this._options.hasDownArrow) {
      icons.push({
        iconCls: 'fui-combobox-arrow',
        align: 'right',
        width: this._options.iconWidth,
        title: this._options.openListText,
        onClick: function() { self.togglePanel(); }
      });
    }
    textOptions = assign({}, markupOptions, userOptions, {
      cls: ((this._options.cls || '') + ' fui-combobox').trim(),
      multiple: undefined,
      multiline: this._options.multiline,
      icons: icons,
      editable: this._options.editable,
      disabled: this._options.disabled,
      readonly: this._options.readonly,
      value: '',
      onChange: null
    });
    this._textbox = new TextBox(this._textboxSource, textOptions);
    this._editor = this._textbox.textbox();
    if (editorDefinition && editorDefinition.className) {
      editorDefinition.className.split(/\s+/).forEach(function(className) {
        if (className) this._editor.classList.add(className);
      }, this);
    }
    if (editorDefinition && editorDefinition.inputMode) {
      this._editor.inputMode = editorDefinition.inputMode;
    }
    this._field = this._editor.closest('.fui-textbox-field');
    this._shell = this._editor.closest('.fui-textbox');
    this._comboPopup = new ComboPopup({
      anchor: this._shell,
      openClassHost: this._shell,
      ariaLabel: this._options.openListText,
      multiple: this._options.multiple,
      closeOnSelect: !this._options.multiple,
      containsTarget: function(target) {
        return self._shell.contains(target);
      },
      onSelect: function(descriptor) {
        var row = descriptor.data;
        if (!row) return;
        if (typeof self._options.onClick === 'function') {
          self._options.onClick.call(self._source, row);
        }
        self._emit('click', { record: row });
        self._chooseRow(row);
      },
      onActiveChange: function(index) {
        self._activeIndex = index;
      },
      onShow: function() {
        self._panelVisible = true;
        if (typeof self._options.onShowPanel === 'function') {
          self._options.onShowPanel.call(self);
        }
        self._emit('showPanel', { panel: self._comboPopup.panel });
      },
      onHide: function() {
        self._panelVisible = false;
        self._activeIndex = -1;
        if (typeof self._options.onHidePanel === 'function') {
          self._options.onHidePanel.call(self);
        }
        self._emit('hidePanel', { panel: self._comboPopup.panel });
      }
    });
    this._panel = this._comboPopup.panel;
    this._bind();
    source.__fabuiComboBox = this;

    if (this._options.data) {
      this.loadData(this._options.data, true);
    } else if (this._selectData.length) {
      this.loadData(this._selectData, true);
    } else {
      this.setValues(this._initialValues, true);
    }
    if (!this._options.data && !this._selectData.length && (this._options.url || this._options.loader)) {
      this.reload();
    }
  }

  ComboBox.prototype._readSelectData = function(select) {
    var options = this._options;
    var data = [];
    Array.prototype.forEach.call(select.children, function(child) {
      var group = child.tagName === 'OPTGROUP' ? child.label : null;
      var elements = child.tagName === 'OPTGROUP' ? child.children : [child];
      Array.prototype.forEach.call(elements, function(option) {
        if (option.tagName !== 'OPTION') return;
        var row = {};
        row[options.valueField] = option.value || option.textContent;
        row[options.textField] = option.textContent;
        row.selected = option.selected;
        row.disabled = option.disabled;
        row.iconCls = option.getAttribute('iconCls') || '';
        if (group) {
          options.groupField = options.groupField || 'group';
          row[options.groupField] = group;
        }
        data.push(row);
      });
    });
    return data;
  };

  ComboBox.prototype._readInitialValues = function(userOptions) {
    var value;
    var values = [];
    if (Object.prototype.hasOwnProperty.call(userOptions, 'value')) {
      value = userOptions.value;
      values = Array.isArray(value) ? value : String(value == null ? '' : value).split(this._options.separator);
    } else if (this._source.tagName === 'SELECT') {
      Array.prototype.forEach.call(this._source.options, function(option) {
        if (option.selected) values.push(option.value || option.textContent);
      });
    } else if (this._source.value) {
      values = this._options.multiple ? this._source.value.split(this._options.separator) : [this._source.value];
    }
    return uniqueStrings(values.filter(function(item) { return item !== ''; }));
  };

  ComboBox.prototype._bind = function() {
    var self = this;
    this._onInput = function() { self._handleInput(); };
    this._onKeyDown = function(event) { self._handleKeyDown(event); };
    this._onBlur = function() {
      window.setTimeout(function() {
        if (!self._destroyed && !self._panel.contains(document.activeElement)) {
          self._fixInput();
          self.hidePanel();
        }
      }, 60);
    };
    this._onFormReset = function() {
      window.setTimeout(function() { if (!self._destroyed) self.reset(); }, 0);
    };
    this._editor.addEventListener('input', this._onInput);
    this._editor.addEventListener('keydown', this._onKeyDown);
    this._editor.addEventListener('blur', this._onBlur);
    if (this._source.form) this._source.form.addEventListener('reset', this._onFormReset);
  };

  ComboBox.prototype._handleInput = function() {
    var self = this;
    var query = this._getQueryText();
    window.clearTimeout(this._queryTimer);
    this._setTypedValues(this._editor.value);
    this.showPanel();
    this._queryTimer = window.setTimeout(function() {
      if (self._options.mode === 'remote') {
        self._request({ q: query }, true);
      } else {
        self._filterData(query);
      }
    }, Math.max(0, Number(this._options.delay) || 0));
  };

  ComboBox.prototype._getQueryText = function() {
    var text = this._editor.value;
    if (!this._options.multiple) return text.trim();
    return text.split(this._options.separator).pop().trim();
  };

  ComboBox.prototype._setTypedValues = function(text) {
    var values = this._options.multiple ? String(text).split(this._options.separator) : [text];
    var old = this._values.slice();
    values = values.map(function(value) { return value.trim(); }).filter(function(value) { return value !== ''; });
    if (!this._options.multiple && !values.length) values = [];
    this._values = uniqueStrings(values);
    this._syncSourceValue();
    this._notifyChange(old);
  };

  ComboBox.prototype._filterData = function(query) {
    var self = this;
    var exact;
    this._filteredData = this._data.filter(function(row) {
      return self._options.filter.call(self, query, row) !== false;
    });
    this._activeIndex = -1;
    this._renderPanel();
    if (!this._options.multiple && query) {
      exact = this._findRowByText(query);
      if (exact) this.setValue(exact[this._options.valueField]);
    }
  };

  ComboBox.prototype._handleKeyDown = function(event) {
    var key = event.key;
    if ((key === 'ArrowDown' && (event.altKey || event.metaKey)) || key === 'F4') {
      event.preventDefault();
      this.showPanel();
      return;
    }
    if (key === 'Escape' && this._panelVisible) {
      event.preventDefault();
      this.hidePanel();
      return;
    }
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      this.showPanel();
      this._moveActive(key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (key === 'Enter' && this._panelVisible) {
      event.preventDefault();
      if (this._activeIndex >= 0) this._chooseRow(this._filteredData[this._activeIndex]);
      if (!this._options.multiple) this.hidePanel();
      return;
    }
    if (key === 'Enter') {
      event.preventDefault();
      this._fixInput();
    }
  };

  ComboBox.prototype._moveActive = function(direction) {
    var length = this._filteredData.length;
    var index = this._activeIndex;
    var attempts = 0;
    if (!length) return;
    do {
      index = (index + direction + length) % length;
      attempts += 1;
    } while (this._filteredData[index] && this._filteredData[index].disabled && attempts <= length);
    this._setActiveIndex(index, this._options.selectOnNavigation);
  };

  ComboBox.prototype._setActiveIndex = function(index, selectRow) {
    this._comboPopup.setActiveIndex(index);
    this._activeIndex = this._comboPopup.activeIndex;
    if (selectRow && this._filteredData[this._activeIndex]) {
      this._chooseRow(this._filteredData[this._activeIndex], true);
      this._comboPopup.setActiveIndex(index);
      this._activeIndex = this._comboPopup.activeIndex;
    }
  };

  ComboBox.prototype._chooseRow = function(row, remainOpen) {
    var value = String(row[this._options.valueField]);
    if (this._options.multiple && this._values.indexOf(value) >= 0) {
      this.unselect(value);
    } else {
      this.select(value);
    }
    if (!remainOpen && !this._options.multiple) this.hidePanel();
  };

  ComboBox.prototype._fixInput = function() {
    var self = this;
    var values;
    if (this._options.limitToList) {
      values = this._values.map(function(value) {
        var row = self._findRow(value) || self._findRowByText(value);
        return row ? String(row[self._options.valueField]) : null;
      }).filter(function(value) { return value != null; });
      this.setValues(values);
    } else {
      this.setValues(this._values);
    }
  };

  ComboBox.prototype._renderPanel = function() {
    var self = this;
    var lastGroup;
    var descriptors = [];
    this._filteredData.forEach(function(row) {
      var group = self._options.groupField ? row[self._options.groupField] : null;
      var text;
      var code;
      var output;
      var value = String(row[self._options.valueField]);
      var descriptor = {
        value: value,
        text: '',
        data: row,
        disabled: row.disabled === true,
        selected: self._values.indexOf(value) >= 0,
        group: group,
        groupSticky: self._options.groupPosition === 'sticky',
        iconClass: self._options.showItemIcon && row.iconCls ?
          row.iconCls :
          ''
      };
      if (group != null && group !== lastGroup) {
        if (typeof self._options.groupFormatter === 'function') {
          descriptor.groupContent = self._options.groupFormatter.call(
            self._source,
            group
          );
        } else {
          descriptor.groupContent = String(group);
        }
        lastGroup = group;
      }
      if (typeof self._options.formatter === 'function') {
        output = self._options.formatter.call(self._source, row);
        descriptor.content = output;
      } else {
        text = String(row[self._options.textField] == null ? '' : row[self._options.textField]);
        code = String(row[self._options.valueField] == null ? '' : row[self._options.valueField]);
        descriptor.text = text;
        if (self._options.showValueInList && code && code !== text) {
          descriptor.secondaryText = '(' + code + ')';
        }
      }
      descriptors.push(descriptor);
    });
    this._comboPopup.setOptions({
      anchor: this._shell,
      openClassHost: this._shell,
      ariaLabel: this._options.openListText,
      panelWidth: this._options.panelWidth,
      panelHeight: this._options.panelHeight,
      panelMinWidth: this._options.panelMinWidth,
      panelMaxWidth: this._options.panelMaxWidth,
      panelMinHeight: this._options.panelMinHeight,
      panelMaxHeight: this._options.panelMaxHeight,
      panelAlign: this._options.panelAlign,
      panelValign: this._options.panelValign,
      multiple: this._options.multiple,
      closeOnSelect: !this._options.multiple,
      items: descriptors,
      renderGroup: function(group, descriptor) {
        return Object.prototype.hasOwnProperty.call(descriptor, 'groupContent') ?
          descriptor.groupContent :
          String(group);
      }
    });
  };

  ComboBox.prototype._findRow = function(value) {
    var field = this._options.valueField;
    var stringValue = String(value);
    var index;
    for (index = 0; index < this._data.length; index += 1) {
      if (String(this._data[index][field]) === stringValue) return this._data[index];
    }
    return null;
  };

  ComboBox.prototype._findRowByText = function(text) {
    var field = this._options.textField;
    var query = String(text).toLowerCase();
    var index;
    for (index = 0; index < this._data.length; index += 1) {
      if (String(this._data[index][field]).toLowerCase() === query) return this._data[index];
    }
    return null;
  };

  ComboBox.prototype._syncText = function() {
    var self = this;
    var texts = this._values.map(function(value) {
      var row = self._findRow(value);
      return row ? String(row[self._options.textField]) : String(value);
    });
    this._textbox.setValue(texts.join(this._options.separator), true);
    this._syncSourceValue();
    this._updateTextboxIcon();
  };

  ComboBox.prototype._syncSourceValue = function() {
    var self = this;
    if (this._source.tagName === 'SELECT') {
      Array.prototype.forEach.call(this._source.options, function(option) {
        option.selected = self._values.indexOf(String(option.value || option.textContent)) >= 0;
      });
      this._textboxSource.value = this._values.join(this._options.separator);
    } else {
      this._source.value = this._options.multiple ? this._values.join(this._options.separator) : (this._values[0] || '');
    }
  };

  ComboBox.prototype._updateTextboxIcon = function() {
    var row = this._values.length ? this._findRow(this._values[this._values.length - 1]) : null;
    if (this._textboxIconCls) this._editor.classList.remove(this._textboxIconCls);
    this._textboxIconCls = '';
    this._editor.classList.remove('fui-combobox-text-icon');
    if (this._options.showItemIcon && row && row.iconCls) {
      this._textboxIconCls = row.iconCls;
      this._editor.classList.add('fui-combobox-text-icon', row.iconCls);
    }
  };

  ComboBox.prototype._notifyChange = function(oldValues) {
    var oldValue = this._options.multiple ? oldValues.slice() : (oldValues[0] || '');
    var newValue = this._options.multiple ? this._values.slice() : (this._values[0] || '');
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;
    if (typeof this._options.onChange === 'function') this._options.onChange.call(this, newValue, oldValue);
    this._emit('change', { value: newValue, oldValue: oldValue });
  };

  ComboBox.prototype._positionPanel = function() {
    if (this._comboPopup) this._comboPopup.position();
  };

  ComboBox.prototype._emit = function(name, detail) {
    var listeners = (this._listeners[name] || []).slice();
    listeners.forEach(function(listener) { listener(detail); });
  };

  ComboBox.prototype.options = function() { return this._options; };
  ComboBox.prototype.panel = function() { return this._panel; };
  ComboBox.prototype.textbox = function() { return this._editor; };
  ComboBox.prototype.getIcon = function(index) { return this._textbox.getIcon(index); };
  ComboBox.prototype.getData = function() { return this._data.slice(); };
  ComboBox.prototype.getValue = function() { return this._values[0] || ''; };
  ComboBox.prototype.getValues = function() { return this._values.slice(); };
  ComboBox.prototype.getText = function() { return this._editor.value; };

  ComboBox.prototype.setText = function(text) {
    this._textbox.setValue(text == null ? '' : String(text), true);
    this._setTypedValues(this._editor.value);
    return this;
  };

  ComboBox.prototype.setValue = function(value, silent) {
    return this.setValues(Array.isArray(value) ? value : [value], silent);
  };

  ComboBox.prototype.setValues = function(values, silent) {
    var self = this;
    var old = this._values.slice();
    var normalized = Array.isArray(values) ? values : String(values == null ? '' : values).split(this._options.separator);
    normalized = uniqueStrings(normalized.filter(function(value) { return value != null && String(value) !== ''; }));
    if (!this._options.multiple && normalized.length > 1) normalized = [normalized[0]];
    if (this._options.limitToList) normalized = normalized.filter(function(value) { return self._findRow(value) != null; });
    old.forEach(function(value) {
      if (normalized.indexOf(value) < 0) {
        var row = self._findRow(value);
        if (row && typeof self._options.onUnselect === 'function') self._options.onUnselect.call(self._source, row);
        if (row) self._emit('unselect', { record: row });
      }
    });
    normalized.forEach(function(value) {
      if (old.indexOf(value) < 0) {
        var row = self._findRow(value);
        if (row && typeof self._options.onSelect === 'function') self._options.onSelect.call(self._source, row);
        if (row) self._emit('select', { record: row });
      }
    });
    this._values = normalized;
    this._syncText();
    this._renderPanel();
    if (!silent) this._notifyChange(old);
    return this;
  };

  ComboBox.prototype.select = function(value) {
    var values = this._options.multiple ? this._values.concat([String(value)]) : [String(value)];
    return this.setValues(values);
  };

  ComboBox.prototype.unselect = function(value) {
    value = String(value);
    return this.setValues(this._values.filter(function(item) { return item !== value; }));
  };

  ComboBox.prototype.clear = function() { return this.setValues([]); };
  ComboBox.prototype.initValue = function(value) {
    this._initialValues = Array.isArray(value) ? uniqueStrings(value) : uniqueStrings([value]);
    if (!this._options.multiple && this._initialValues.length > 1) {
      this._initialValues = [this._initialValues[0]];
    }
    return this.setValues(this._initialValues, true);
  };
  ComboBox.prototype.reset = function() { return this.setValues(this._initialValues); };

  ComboBox.prototype.loadData = function(data, silent) {
    var filtered = this._options.loadFilter.call(this._source, data);
    var selected = [];
    var current = this._values.length ? this._values.slice() : this._initialValues.slice();
    this._data = Array.isArray(filtered) ? filtered.slice() : (filtered && Array.isArray(filtered.rows) ? filtered.rows.slice() : []);
    this._data.forEach(function(row) {
      if (row && row.selected) selected.push(String(row[this._options.valueField]));
    }, this);
    if (selected.length) current = this._options.multiple ? uniqueStrings(current.concat(selected)) : [selected[selected.length - 1]];
    this._filteredData = this._data.slice();
    this._renderPanel();
    this.setValues(current, silent !== false);
    if (typeof this._options.onLoadSuccess === 'function') this._options.onLoadSuccess.call(this._source, data);
    this._emit('loadSuccess', { data: data });
    return this;
  };

  ComboBox.prototype._request = function(params, remainText, url) {
    var self = this;
    var requestParams = assign({}, this._options.queryParams || {}, params || {});
    var token = ++this._requestToken;
    var success = function(data) {
      if (token !== self._requestToken || self._destroyed) return;
      var text = self._editor.value;
      self.loadData(data, true);
      if (remainText) self._textbox.setValue(text, true);
    };
    var error = function(errorValue) {
      if (token !== self._requestToken || self._destroyed) return;
      if (typeof self._options.onLoadError === 'function') self._options.onLoadError.call(self._source, errorValue);
      self._emit('loadError', { error: errorValue });
    };
    var result;
    if (url) this._options.url = url;
    if (typeof this._options.onBeforeLoad === 'function' && this._options.onBeforeLoad.call(this._source, requestParams) === false) return this;
    if (typeof this._options.loader === 'function') {
      try {
        result = this._options.loader.call(this._source, requestParams, success, error);
        if (result && typeof result.then === 'function') result.then(success, error);
      } catch (loadError) {
        error(loadError);
      }
      return this;
    }
    if (!this._options.url || typeof fetch !== 'function') return this;
    var method = this._options.method === 'get' ? 'GET' : 'POST';
    var query = encodeParams(requestParams);
    var requestUrl = this._options.url;
    var fetchOptions = { method: method, headers: {} };
    if (method === 'GET' && query) requestUrl += (requestUrl.indexOf('?') >= 0 ? '&' : '?') + query;
    if (method === 'POST') {
      fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
      fetchOptions.body = query;
    }
    fetch(requestUrl, fetchOptions).then(function(response) {
      if (!response.ok) throw new Error('ComboBox request failed: ' + response.status);
      return response.json();
    }).then(success, error);
    return this;
  };

  ComboBox.prototype.reload = function(urlOrParams) {
    if (typeof urlOrParams === 'string') return this._request({}, false, urlOrParams);
    if (urlOrParams && typeof urlOrParams === 'object') this._options.queryParams = assign({}, urlOrParams);
    return this._request({}, false);
  };

  ComboBox.prototype.scrollTo = function(value) {
    var stringValue = String(value);
    var item = Array.prototype.filter.call(this._panel.querySelectorAll('.fui-combobox-item'), function(candidate) {
      return candidate.getAttribute('data-value') === stringValue;
    })[0];
    if (item && item.scrollIntoView) item.scrollIntoView({ block: 'nearest' });
    return this;
  };

  ComboBox.prototype.showPanel = function() {
    if (this._options.disabled || this._panelVisible) return this;
    this._filteredData = this._data.slice();
    this._renderPanel();
    this._comboPopup.show();
    this.scrollTo(this.getValue());
    return this;
  };

  ComboBox.prototype.hidePanel = function() {
    if (this._comboPopup) this._comboPopup.hide();
    return this;
  };

  ComboBox.prototype.togglePanel = function() { return this._panelVisible ? this.hidePanel() : this.showPanel(); };
  ComboBox.prototype.focus = function() { this._textbox.focus(); return this; };

  ComboBox.prototype.resize = function(width, height) {
    this._textbox.resize(width, height);
    this._options.width = this._textbox.options().width;
    this._options.height = this._textbox.options().height;
    this._positionPanel();
    return this;
  };

  ComboBox.prototype.disable = function() { this.hidePanel(); this._textbox.disable(); this._options.disabled = true; return this; };
  ComboBox.prototype.enable = function() { this._textbox.enable(); this._options.disabled = false; return this; };
  ComboBox.prototype.readonly = function(mode) { this._textbox.readonly(mode); this._options.readonly = mode !== false; return this; };
  ComboBox.prototype.setEditable = function(mode) { this._textbox.setEditable(mode); this._options.editable = mode !== false; return this; };

  ComboBox.prototype.on = function(name, listener) {
    if (typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  ComboBox.prototype.off = function(name, listener) {
    var listeners = this._listeners[name];
    if (!listeners) return this;
    this._listeners[name] = listener ? listeners.filter(function(item) { return item !== listener; }) : [];
    return this;
  };

  ComboBox.prototype.destroy = function() {
    if (this._destroyed) return;
    this._destroyed = true;
    window.clearTimeout(this._queryTimer);
    this._editor.removeEventListener('input', this._onInput);
    this._editor.removeEventListener('keydown', this._onKeyDown);
    this._editor.removeEventListener('blur', this._onBlur);
    if (this._source.form) this._source.form.removeEventListener('reset', this._onFormReset);
    this._comboPopup.destroy();
    this._textbox.destroy();
    if (this._source.tagName === 'SELECT') {
      if (this._textboxSource.parentNode) this._textboxSource.parentNode.removeChild(this._textboxSource);
      this._source.style.display = this._originalDisplay;
      if (this._originalAriaHidden == null) this._source.removeAttribute('aria-hidden');
      else this._source.setAttribute('aria-hidden', this._originalAriaHidden);
    }
    delete this._source.__fabuiComboBox;
    this._listeners = {};
  };

  ComboBox.defaults = assign({}, TextBox.defaults || {}, comboDefaults);
  ComboBox.locales = localePacks;
  ComboBox.addLocale = function(name, pack) {
    if (name && pack) localePacks[name] = assign({}, localePacks.en, pack);
    return ComboBox;
  };
  return ComboBox;
}
