var CHECKGROUP_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];

function checkGroupAssign(target) {
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

function resolveCheckGroupElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function checkGroupBoolean(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    value = value.trim().toLowerCase();
    if (value === 'false' || value === '0' || value === 'no') return false;
    if (value === 'true' || value === '1' || value === 'yes' || value === '') return true;
  }
  return Boolean(value);
}

function normalizeCheckGroupLocale(value) {
  value = String(value || 'en').trim().replace(/_/g, '-');
  if (/^zh-(?:TW|Hant)(?:-|$)/i.test(value)) return 'zh-TW';
  if (/^zh-(?:CN|Hans)(?:-|$)/i.test(value) || /^zh$/i.test(value)) return 'zh-CN';
  return 'en';
}

export function normalizeCheckGroupTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return CHECKGROUP_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

export function normalizeCheckGroupDirection(value) {
  return String(value || 'h').toLowerCase() === 'v' ? 'v' : 'h';
}

export function normalizeCheckGroupLabelPosition(value) {
  return String(value || 'after').toLowerCase() === 'before' ? 'before' : 'after';
}

export function normalizeCheckGroupLabelAlign(value) {
  return String(value || 'left').toLowerCase() === 'right' ? 'right' : 'left';
}

function findCheckGroupTheme(element) {
  var current = resolveCheckGroupElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < CHECKGROUP_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + CHECKGROUP_THEMES[index])) {
        return CHECKGROUP_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

function normalizeCheckGroupValues(values) {
  if (values == null || values === '') return [];
  if (Array.isArray(values)) return values.slice();
  return [values];
}

function checkGroupValueKey(value) {
  return String(value == null ? '' : value);
}

function checkGroupValuesEqual(left, right) {
  var index;
  if (left.length !== right.length) return false;
  for (index = 0; index < left.length; index += 1) {
    if (checkGroupValueKey(left[index]) !== checkGroupValueKey(right[index])) return false;
  }
  return true;
}

export function normalizeCheckGroupData(data) {
  if (!Array.isArray(data)) return [];
  return data.map(function(item, index) {
    var source = item && typeof item === 'object' ?
      item :
      { value: item, label: item };
    var value = Object.prototype.hasOwnProperty.call(source, 'value') ?
      source.value :
      index;
    return {
      value: value,
      label: source.label == null ? String(value == null ? '' : value) : String(source.label),
      disabled: checkGroupBoolean(source.disabled, false)
    };
  });
}

function checkGroupStyleValue(name, value) {
  var unitless = {
    flex: true,
    flexGrow: true,
    flexShrink: true,
    fontWeight: true,
    lineHeight: true,
    opacity: true,
    order: true,
    zIndex: true
  };
  if (value == null) return '';
  return typeof value === 'number' && !unitless[name] ? value + 'px' : String(value);
}

function restoreCheckGroupAttribute(element, name, value) {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

export function createCheckGroupFactory(Control, registerControl, unregisterControl, CheckBox) {
  'use strict';

  var defaults = {
    name: '',
    value: [],
    data: [],
    dir: 'h',
    itemStyle: { height: 30 },
    labelWidth: 'auto',
    labelPosition: 'after',
    labelAlign: 'left',
    disabled: false,
    cls: '',
    locale: 'en',
    theme: 'inherit',
    ariaLabel: '',
    onChange: null
  };
  var localePacks = {
    en: {
      group: 'Checkbox group'
    },
    'zh-TW': {
      group: '核取方塊群組'
    },
    'zh-CN': {
      group: '复选框组'
    }
  };

  function CheckGroup(element, options) {
    var host = resolveCheckGroupElement(element);
    if (!(this instanceof CheckGroup)) return new CheckGroup(element, options);
    if (!host) throw new Error('fabui.CheckGroup requires a host element.');
    if (host.__fabuiCheckGroup) return host.__fabuiCheckGroup;
    if (typeof CheckBox !== 'function') {
      throw new Error('fabui.CheckGroup requires fabui.CheckBox.');
    }
    Control.call(this);
    this.hostElement = host;
    this._listeners = {};
    this._records = [];
    this._destroyed = false;
    this._suspendChange = false;
    this._original = {
      html: host.innerHTML,
      className: host.getAttribute('class'),
      style: host.getAttribute('style'),
      role: host.getAttribute('role'),
      ariaLabel: host.getAttribute('aria-label')
    };
    this._themeSource = host.parentElement || document.body;
    this._options = checkGroupAssign(
      {},
      defaults,
      this._readElementOptions(),
      options || {}
    );
    this._normalizeOptions();
    this._initialValue = this._options.value.slice();
    this._build();
    this._bind();
    this.setValue(this._initialValue, true);
    host.__fabuiCheckGroup = this;
    registerControl(host, this);
  }

  CheckGroup.prototype = Object.create(Control.prototype);
  CheckGroup.prototype.constructor = CheckGroup;

  CheckGroup.prototype._readElementOptions = function() {
    var host = this.hostElement;
    var result = {};
    var value;
    value = host.getAttribute('name') || host.getAttribute('data-name');
    if (value != null) result.name = value;
    value = host.getAttribute('dir') || host.getAttribute('data-dir');
    if (value != null) result.dir = value;
    value = host.getAttribute('labelWidth') || host.getAttribute('data-label-width');
    if (value != null) result.labelWidth = value;
    value = host.getAttribute('labelPosition') || host.getAttribute('data-label-position');
    if (value != null) result.labelPosition = value;
    value = host.getAttribute('labelAlign') || host.getAttribute('data-label-align');
    if (value != null) result.labelAlign = value;
    value = host.getAttribute('data-disabled');
    if (value != null) result.disabled = value;
    value = host.getAttribute('data-locale') || host.getAttribute('locale');
    if (value != null) result.locale = value;
    value = host.getAttribute('data-theme') || host.getAttribute('theme');
    if (value != null) result.theme = value;
    value = host.getAttribute('aria-label');
    if (value != null) result.ariaLabel = value;
    value = host.getAttribute('data-value');
    if (value != null) {
      try {
        result.value = JSON.parse(value);
      } catch (error) {
        result.value = value.split(',').map(function(item) {
          return item.trim();
        }).filter(Boolean);
      }
    }
    value = host.getAttribute('data-items');
    if (value != null) {
      try {
        result.data = JSON.parse(value);
      } catch (error) {
        result.data = [];
      }
    }
    return result;
  };

  CheckGroup.prototype._normalizeOptions = function() {
    this._options.value = normalizeCheckGroupValues(this._options.value);
    this._options.data = normalizeCheckGroupData(this._options.data);
    this._options.dir = normalizeCheckGroupDirection(this._options.dir);
    this._options.labelPosition = normalizeCheckGroupLabelPosition(
      this._options.labelPosition
    );
    this._options.labelAlign = normalizeCheckGroupLabelAlign(
      this._options.labelAlign
    );
    this._options.disabled = checkGroupBoolean(this._options.disabled, false);
    this._options.locale = normalizeCheckGroupLocale(this._options.locale);
    this._options.itemStyle = this._options.itemStyle &&
      typeof this._options.itemStyle === 'object' ?
      checkGroupAssign({}, this._options.itemStyle) :
      { height: 30 };
  };

  CheckGroup.prototype._text = function(key) {
    var pack = localePacks[this._options.locale] || localePacks.en;
    return pack[key] || localePacks.en[key] || key;
  };

  CheckGroup.prototype._build = function() {
    this.hostElement.textContent = '';
    this.hostElement.className = 'fui-checkgroup' +
      (this._original.className ? ' ' + this._original.className : '') +
      (this._options.cls ? ' ' + String(this._options.cls) : '');
    this.hostElement.classList.add('fui-checkgroup-' + this._options.dir);
    this.hostElement.classList.toggle(
      'fui-checkgroup-disabled',
      this._options.disabled
    );
    this.hostElement.setAttribute('role', 'group');
    this.hostElement.setAttribute(
      'aria-label',
      this._options.ariaLabel || this._text('group')
    );
    this._renderItems();
    this.setTheme(this._options.theme);
  };

  CheckGroup.prototype._renderItems = function() {
    var self = this;
    this._disposeItems();
    this.hostElement.textContent = '';
    this._options.data.forEach(function(item, index) {
      var itemElement = document.createElement('div');
      var input = document.createElement('input');
      var control;
      itemElement.className = 'fui-checkgroup-item';
      itemElement.setAttribute('data-index', String(index));
      Object.keys(self._options.itemStyle).forEach(function(name) {
        itemElement.style[name] = checkGroupStyleValue(
          name,
          self._options.itemStyle[name]
        );
      });
      input.type = 'checkbox';
      if (self._options.name) input.name = self._options.name;
      input.value = item.value == null ? '' : String(item.value);
      itemElement.appendChild(input);
      self.hostElement.appendChild(itemElement);
      control = new CheckBox(input, {
        label: item.label,
        labelWidth: self._options.labelWidth,
        labelPosition: self._options.labelPosition,
        labelAlign: self._options.labelAlign,
        value: input.value,
        checked: false,
        disabled: self._options.disabled || item.disabled,
        locale: self._options.locale,
        theme: 'inherit',
        onChange: function() {
          self._handleItemChange();
        }
      });
      self._records.push({
        data: item,
        element: itemElement,
        input: input,
        control: control
      });
    });
  };

  CheckGroup.prototype._disposeItems = function() {
    this._records.forEach(function(record) {
      record.control.destroy();
    });
    this._records = [];
  };

  CheckGroup.prototype._bind = function() {
    var self = this;
    var form = this.hostElement.closest('form');
    if (form) {
      this.addEventListener(form, 'reset', function() {
        setTimeout(function() {
          if (self._destroyed) return;
          self.setValue(self._initialValue);
        }, 0);
      });
    }
  };

  CheckGroup.prototype._handleItemChange = function() {
    var oldValues;
    var newValues;
    if (this._suspendChange) return;
    oldValues = this._options.value.slice();
    newValues = this._collectValues();
    this._options.value = newValues.slice();
    if (!checkGroupValuesEqual(oldValues, newValues)) {
      this._invoke('onChange', newValues.slice());
      this._emit('change', {
        values: newValues.slice(),
        oldValues: oldValues
      });
    }
  };

  CheckGroup.prototype._collectValues = function() {
    return this._records.filter(function(record) {
      return record.control.isChecked();
    }).map(function(record) {
      return record.data.value;
    });
  };

  CheckGroup.prototype._invoke = function(name) {
    var handler = this._options[name];
    return typeof handler === 'function' ?
      handler.apply(this, Array.prototype.slice.call(arguments, 1)) :
      undefined;
  };

  CheckGroup.prototype._emit = function(type, detail) {
    var listeners = (this._listeners[type] || []).slice();
    var event = {
      type: type,
      target: this,
      detail: detail
    };
    listeners.forEach(function(listener) {
      listener.call(this, event);
    }, this);
  };

  CheckGroup.prototype.on = function(type, listener) {
    if (type && typeof listener === 'function') {
      (this._listeners[String(type)] || (this._listeners[String(type)] = [])).push(listener);
    }
    return this;
  };

  CheckGroup.prototype.off = function(type, listener) {
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

  CheckGroup.prototype.options = function() {
    var options = checkGroupAssign({}, this._options);
    options.value = this._options.value.slice();
    options.data = normalizeCheckGroupData(this._options.data);
    options.itemStyle = checkGroupAssign({}, this._options.itemStyle);
    return options;
  };

  CheckGroup.prototype.setOptions = function(options) {
    var hasValue = Boolean(
      options && Object.prototype.hasOwnProperty.call(options, 'value')
    );
    var values = hasValue ? options.value : this.getValue();
    checkGroupAssign(this._options, options || {});
    this._options.value = normalizeCheckGroupValues(values);
    this._normalizeOptions();
    this._build();
    this.setValue(this._options.value, true);
    this._emit('refresh', { options: this.options() });
    return this;
  };

  CheckGroup.prototype.setValue = function(values, silent) {
    var oldValues = this.getValue();
    var normalized = normalizeCheckGroupValues(values);
    var selected = Object.create(null);
    var newValues;
    normalized.forEach(function(value) {
      selected[checkGroupValueKey(value)] = true;
    });
    this._suspendChange = true;
    this._records.forEach(function(record) {
      var checked = Boolean(selected[checkGroupValueKey(record.data.value)]);
      if (checked) record.control.check();
      else record.control.uncheck();
    });
    this._suspendChange = false;
    newValues = this._collectValues();
    this._options.value = newValues.slice();
    if (!silent && !checkGroupValuesEqual(oldValues, newValues)) {
      this._invoke('onChange', newValues.slice());
      this._emit('change', {
        values: newValues.slice(),
        oldValues: oldValues
      });
    }
    return this;
  };

  CheckGroup.prototype.getValue = function() {
    return this._collectValues();
  };

  CheckGroup.prototype.getData = function() {
    return normalizeCheckGroupData(this._options.data);
  };

  CheckGroup.prototype.getCheckBox = function(value) {
    var key = checkGroupValueKey(value);
    var record = this._records.find(function(item) {
      return checkGroupValueKey(item.data.value) === key;
    });
    return record ? record.control : null;
  };

  CheckGroup.prototype.loadData = function(data, values) {
    this._options.data = normalizeCheckGroupData(data);
    this._renderItems();
    return this.setValue(values == null ? this._options.value : values);
  };

  CheckGroup.prototype.check = function(value) {
    var values = this.getValue();
    var key = checkGroupValueKey(value);
    if (!values.some(function(item) {
      return checkGroupValueKey(item) === key;
    })) {
      values.push(value);
    }
    return this.setValue(values);
  };

  CheckGroup.prototype.uncheck = function(value) {
    var key = checkGroupValueKey(value);
    return this.setValue(this.getValue().filter(function(item) {
      return checkGroupValueKey(item) !== key;
    }));
  };

  CheckGroup.prototype.clear = function() {
    return this.setValue([]);
  };

  CheckGroup.prototype.reset = function() {
    return this.setValue(this._initialValue);
  };

  CheckGroup.prototype.disable = function() {
    this._options.disabled = true;
    this.hostElement.classList.add('fui-checkgroup-disabled');
    this._records.forEach(function(record) {
      record.control.disable();
    });
    return this;
  };

  CheckGroup.prototype.enable = function() {
    this._options.disabled = false;
    this.hostElement.classList.remove('fui-checkgroup-disabled');
    this._records.forEach(function(record) {
      if (record.data.disabled) record.control.disable();
      else record.control.enable();
    });
    return this;
  };

  CheckGroup.prototype.setLocale = function(locale, messages) {
    if (locale && messages) {
      localePacks[String(locale)] = checkGroupAssign({}, localePacks.en, messages);
    }
    this._options.locale = normalizeCheckGroupLocale(locale);
    this.hostElement.setAttribute(
      'aria-label',
      this._options.ariaLabel || this._text('group')
    );
    this._records.forEach(function(record) {
      record.control.setLocale(locale);
    });
    return this;
  };

  CheckGroup.prototype.setTheme = function(theme) {
    var index;
    this._options.theme = theme == null ? 'inherit' : theme;
    this.theme = this._options.theme === 'inherit' ?
      findCheckGroupTheme(this._themeSource) :
      normalizeCheckGroupTheme(this._options.theme);
    for (index = 0; index < CHECKGROUP_THEMES.length; index += 1) {
      this.hostElement.classList.remove('fg-theme-' + CHECKGROUP_THEMES[index]);
    }
    this.hostElement.classList.add('fg-theme-' + this.theme);
    this._records.forEach(function(record) {
      record.control.setTheme('inherit');
    });
    return this;
  };

  CheckGroup.prototype.destroy = function() {
    if (this._destroyed) return;
    this._destroyed = true;
    this.removeEventListener();
    this._disposeItems();
    this.hostElement.innerHTML = this._original.html;
    restoreCheckGroupAttribute(this.hostElement, 'class', this._original.className);
    restoreCheckGroupAttribute(this.hostElement, 'style', this._original.style);
    restoreCheckGroupAttribute(this.hostElement, 'role', this._original.role);
    restoreCheckGroupAttribute(this.hostElement, 'aria-label', this._original.ariaLabel);
    unregisterControl(this.hostElement, this);
    delete this.hostElement.__fabuiCheckGroup;
    this._listeners = {};
  };

  CheckGroup.prototype.dispose = CheckGroup.prototype.destroy;
  CheckGroup.defaults = defaults;
  CheckGroup.locales = localePacks;
  CheckGroup.themes = CHECKGROUP_THEMES.slice();
  CheckGroup.addLocale = function(name, messages) {
    if (name && messages) {
      localePacks[String(name)] = checkGroupAssign({}, localePacks.en, messages);
    }
    return CheckGroup;
  };
  CheckGroup.getControl = function(element) {
    element = resolveCheckGroupElement(element);
    return element && element.__fabuiCheckGroup ? element.__fabuiCheckGroup : null;
  };
  CheckGroup.normalizeTheme = normalizeCheckGroupTheme;
  CheckGroup.normalizeLocale = normalizeCheckGroupLocale;
  return CheckGroup;
}
