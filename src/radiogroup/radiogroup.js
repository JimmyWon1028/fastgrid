var RADIOGROUP_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];

function radioGroupAssign(target) {
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

function resolveRadioGroupElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function radioGroupBoolean(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    value = value.trim().toLowerCase();
    if (value === 'false' || value === '0' || value === 'no') return false;
    if (value === 'true' || value === '1' || value === 'yes' || value === '') return true;
  }
  return Boolean(value);
}

function normalizeRadioGroupLocale(value) {
  value = String(value || 'en').trim().replace(/_/g, '-');
  if (/^zh-(?:TW|Hant)(?:-|$)/i.test(value)) return 'zh-TW';
  if (/^zh-(?:CN|Hans)(?:-|$)/i.test(value) || /^zh$/i.test(value)) return 'zh-CN';
  return 'en';
}

export function normalizeRadioGroupTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return RADIOGROUP_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

export function normalizeRadioGroupDirection(value) {
  return String(value || 'h').toLowerCase() === 'v' ? 'v' : 'h';
}

export function normalizeRadioGroupLabelPosition(value) {
  return String(value || 'after').toLowerCase() === 'before' ? 'before' : 'after';
}

export function normalizeRadioGroupLabelAlign(value) {
  return String(value || 'left').toLowerCase() === 'right' ? 'right' : 'left';
}

function findRadioGroupTheme(element) {
  var current = resolveRadioGroupElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < RADIOGROUP_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + RADIOGROUP_THEMES[index])) {
        return RADIOGROUP_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

function radioGroupValueKey(value) {
  return String(value == null ? '' : value);
}

function radioGroupValuesEqual(left, right) {
  if (left == null || right == null) return left == null && right == null;
  return radioGroupValueKey(left) === radioGroupValueKey(right);
}

export function normalizeRadioGroupData(data) {
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
      disabled: radioGroupBoolean(source.disabled, false)
    };
  });
}

function radioGroupStyleValue(name, value) {
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

function restoreRadioGroupAttribute(element, name, value) {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

export function createRadioGroupFactory(
  Control,
  registerControl,
  unregisterControl,
  RadioButton
) {
  'use strict';

  var defaults = {
    name: '',
    value: null,
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
      group: 'Radio group'
    },
    'zh-TW': {
      group: '單選群組'
    },
    'zh-CN': {
      group: '单选组'
    }
  };

  function RadioGroup(element, options) {
    var host = resolveRadioGroupElement(element);
    if (!(this instanceof RadioGroup)) return new RadioGroup(element, options);
    if (!host) throw new Error('fabui.RadioGroup requires a host element.');
    if (host.__fabuiRadioGroup) return host.__fabuiRadioGroup;
    if (typeof RadioButton !== 'function') {
      throw new Error('fabui.RadioGroup requires fabui.RadioButton.');
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
    this._options = radioGroupAssign(
      {},
      defaults,
      this._readElementOptions(),
      options || {}
    );
    this._normalizeOptions();
    this._initialValue = this._options.value;
    this._build();
    this._bind();
    this.setValue(this._initialValue, true);
    host.__fabuiRadioGroup = this;
    registerControl(host, this);
  }

  RadioGroup.prototype = Object.create(Control.prototype);
  RadioGroup.prototype.constructor = RadioGroup;

  RadioGroup.prototype._readElementOptions = function() {
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
    if (value != null) result.value = value;
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

  RadioGroup.prototype._normalizeOptions = function() {
    this._options.data = normalizeRadioGroupData(this._options.data);
    this._options.dir = normalizeRadioGroupDirection(this._options.dir);
    this._options.labelPosition = normalizeRadioGroupLabelPosition(
      this._options.labelPosition
    );
    this._options.labelAlign = normalizeRadioGroupLabelAlign(
      this._options.labelAlign
    );
    this._options.disabled = radioGroupBoolean(this._options.disabled, false);
    this._options.locale = normalizeRadioGroupLocale(this._options.locale);
    this._options.itemStyle = this._options.itemStyle &&
      typeof this._options.itemStyle === 'object' ?
      radioGroupAssign({}, this._options.itemStyle) :
      { height: 30 };
  };

  RadioGroup.prototype._text = function(key) {
    var pack = localePacks[this._options.locale] || localePacks.en;
    return pack[key] || localePacks.en[key] || key;
  };

  RadioGroup.prototype._build = function() {
    this.hostElement.textContent = '';
    this.hostElement.className = 'fui-radiogroup' +
      (this._original.className ? ' ' + this._original.className : '') +
      (this._options.cls ? ' ' + String(this._options.cls) : '');
    this.hostElement.classList.add('fui-radiogroup-' + this._options.dir);
    this.hostElement.classList.toggle(
      'fui-radiogroup-disabled',
      this._options.disabled
    );
    this.hostElement.setAttribute('role', 'radiogroup');
    this.hostElement.setAttribute(
      'aria-label',
      this._options.ariaLabel || this._text('group')
    );
    this._renderItems();
    this.setTheme(this._options.theme);
  };

  RadioGroup.prototype._renderItems = function() {
    var self = this;
    this._disposeItems();
    this.hostElement.textContent = '';
    this._options.data.forEach(function(item, index) {
      var itemElement = document.createElement('div');
      var input = document.createElement('input');
      var control;
      itemElement.className = 'fui-radiogroup-item';
      itemElement.setAttribute('data-index', String(index));
      Object.keys(self._options.itemStyle).forEach(function(name) {
        itemElement.style[name] = radioGroupStyleValue(
          name,
          self._options.itemStyle[name]
        );
      });
      input.type = 'radio';
      if (self._options.name) input.name = self._options.name;
      input.value = item.value == null ? '' : String(item.value);
      itemElement.appendChild(input);
      self.hostElement.appendChild(itemElement);
      control = new RadioButton(input, {
        label: item.label,
        labelWidth: self._options.labelWidth,
        labelPosition: self._options.labelPosition,
        labelAlign: self._options.labelAlign,
        value: input.value,
        checked: false,
        disabled: self._options.disabled || item.disabled,
        locale: self._options.locale,
        theme: 'inherit',
        onChange: function(checked) {
          if (checked) self._handleItemChange(item.value);
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

  RadioGroup.prototype._disposeItems = function() {
    this._records.forEach(function(record) {
      record.control.destroy();
    });
    this._records = [];
  };

  RadioGroup.prototype._bind = function() {
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

  RadioGroup.prototype._handleItemChange = function(value) {
    if (this._suspendChange) return;
    this.setValue(value);
  };

  RadioGroup.prototype._collectValue = function() {
    var record = this._records.find(function(item) {
      return item.control.isChecked();
    });
    return record ? record.data.value : null;
  };

  RadioGroup.prototype._invoke = function(name) {
    var handler = this._options[name];
    return typeof handler === 'function' ?
      handler.apply(this, Array.prototype.slice.call(arguments, 1)) :
      undefined;
  };

  RadioGroup.prototype._emit = function(type, detail) {
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

  RadioGroup.prototype.on = function(type, listener) {
    if (type && typeof listener === 'function') {
      (this._listeners[String(type)] || (this._listeners[String(type)] = [])).push(listener);
    }
    return this;
  };

  RadioGroup.prototype.off = function(type, listener) {
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

  RadioGroup.prototype.options = function() {
    var options = radioGroupAssign({}, this._options);
    options.data = normalizeRadioGroupData(this._options.data);
    options.itemStyle = radioGroupAssign({}, this._options.itemStyle);
    return options;
  };

  RadioGroup.prototype.setOptions = function(options) {
    var hasValue = Boolean(
      options && Object.prototype.hasOwnProperty.call(options, 'value')
    );
    var value = hasValue ? options.value : this.getValue();
    radioGroupAssign(this._options, options || {});
    this._options.value = value;
    this._normalizeOptions();
    this._build();
    this.setValue(this._options.value, true);
    this._emit('refresh', { options: this.options() });
    return this;
  };

  RadioGroup.prototype.setValue = function(value, silent) {
    var oldValue = this._options.value;
    var selectedKey = value == null ? null : radioGroupValueKey(value);
    var matched = false;
    var newValue;
    this._suspendChange = true;
    this._records.forEach(function(record) {
      var checked = selectedKey != null &&
        radioGroupValueKey(record.data.value) === selectedKey;
      if (checked) matched = true;
      if (checked) record.control.check();
      else record.control.uncheck();
    });
    this._suspendChange = false;
    if (!matched) {
      this._records.forEach(function(record) {
        record.control.uncheck();
      });
    }
    newValue = this._collectValue();
    this._options.value = newValue;
    if (!silent && !radioGroupValuesEqual(oldValue, newValue)) {
      this._invoke('onChange', newValue);
      this._emit('change', {
        value: newValue,
        oldValue: oldValue
      });
    }
    return this;
  };

  RadioGroup.prototype.getValue = function() {
    return this._collectValue();
  };

  RadioGroup.prototype.getData = function() {
    return normalizeRadioGroupData(this._options.data);
  };

  RadioGroup.prototype.getRadioButton = function(value) {
    var key = radioGroupValueKey(value);
    var record = this._records.find(function(item) {
      return radioGroupValueKey(item.data.value) === key;
    });
    return record ? record.control : null;
  };

  RadioGroup.prototype.loadData = function(data, value) {
    this._options.data = normalizeRadioGroupData(data);
    this._renderItems();
    return this.setValue(value === undefined ? this._options.value : value);
  };

  RadioGroup.prototype.check = function(value) {
    return this.setValue(value);
  };

  RadioGroup.prototype.clear = function() {
    return this.setValue(null);
  };

  RadioGroup.prototype.reset = function() {
    return this.setValue(this._initialValue);
  };

  RadioGroup.prototype.disable = function() {
    this._options.disabled = true;
    this.hostElement.classList.add('fui-radiogroup-disabled');
    this._records.forEach(function(record) {
      record.control.disable();
    });
    return this;
  };

  RadioGroup.prototype.enable = function() {
    this._options.disabled = false;
    this.hostElement.classList.remove('fui-radiogroup-disabled');
    this._records.forEach(function(record) {
      if (record.data.disabled) record.control.disable();
      else record.control.enable();
    });
    return this;
  };

  RadioGroup.prototype.setLocale = function(locale, messages) {
    if (locale && messages) {
      localePacks[String(locale)] = radioGroupAssign({}, localePacks.en, messages);
    }
    this._options.locale = normalizeRadioGroupLocale(locale);
    this.hostElement.setAttribute(
      'aria-label',
      this._options.ariaLabel || this._text('group')
    );
    this._records.forEach(function(record) {
      record.control.setLocale(locale);
    });
    return this;
  };

  RadioGroup.prototype.setTheme = function(theme) {
    var index;
    this._options.theme = theme == null ? 'inherit' : theme;
    this.theme = this._options.theme === 'inherit' ?
      findRadioGroupTheme(this._themeSource) :
      normalizeRadioGroupTheme(this._options.theme);
    for (index = 0; index < RADIOGROUP_THEMES.length; index += 1) {
      this.hostElement.classList.remove('fg-theme-' + RADIOGROUP_THEMES[index]);
    }
    this.hostElement.classList.add('fg-theme-' + this.theme);
    this._records.forEach(function(record) {
      record.control.setTheme('inherit');
    });
    return this;
  };

  RadioGroup.prototype.destroy = function() {
    if (this._destroyed) return;
    this._destroyed = true;
    this.removeEventListener();
    this._disposeItems();
    this.hostElement.innerHTML = this._original.html;
    restoreRadioGroupAttribute(this.hostElement, 'class', this._original.className);
    restoreRadioGroupAttribute(this.hostElement, 'style', this._original.style);
    restoreRadioGroupAttribute(this.hostElement, 'role', this._original.role);
    restoreRadioGroupAttribute(
      this.hostElement,
      'aria-label',
      this._original.ariaLabel
    );
    unregisterControl(this.hostElement, this);
    delete this.hostElement.__fabuiRadioGroup;
    this._listeners = {};
  };

  RadioGroup.prototype.dispose = RadioGroup.prototype.destroy;
  RadioGroup.defaults = defaults;
  RadioGroup.locales = localePacks;
  RadioGroup.themes = RADIOGROUP_THEMES.slice();
  RadioGroup.addLocale = function(name, messages) {
    if (name && messages) {
      localePacks[String(name)] = radioGroupAssign({}, localePacks.en, messages);
    }
    return RadioGroup;
  };
  RadioGroup.getControl = function(element) {
    element = resolveRadioGroupElement(element);
    return element && element.__fabuiRadioGroup ? element.__fabuiRadioGroup : null;
  };
  RadioGroup.normalizeTheme = normalizeRadioGroupTheme;
  RadioGroup.normalizeLocale = normalizeRadioGroupLocale;
  return RadioGroup;
}
