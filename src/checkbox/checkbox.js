var CHECKBOX_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];
var checkBoxSequence = 0;

function checkBoxAssign(target) {
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

function checkBoxBoolean(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    value = value.trim().toLowerCase();
    if (value === 'false' || value === '0' || value === 'no') return false;
    if (value === 'true' || value === '1' || value === 'yes' || value === '') return true;
  }
  return Boolean(value);
}

function checkBoxSize(value, fallback) {
  if (value == null || value === '') value = fallback;
  if (value === 'auto') return 'auto';
  return typeof value === 'number' ? value + 'px' : String(value);
}

function resolveCheckBoxElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function normalizeCheckBoxLocale(value) {
  value = String(value || 'en').trim().replace(/_/g, '-');
  if (/^zh-(?:TW|Hant)(?:-|$)/i.test(value)) return 'zh-TW';
  if (/^zh-(?:CN|Hans)(?:-|$)/i.test(value) || /^zh$/i.test(value)) return 'zh-CN';
  return 'en';
}

export function normalizeCheckBoxTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return CHECKBOX_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

export function normalizeCheckBoxLabelPosition(value) {
  value = String(value || 'after').toLowerCase();
  return value === 'before' || value === 'top' ? value : 'after';
}

export function normalizeCheckBoxLabelAlign(value) {
  return String(value || 'left').toLowerCase() === 'right' ? 'right' : 'left';
}

function findCheckBoxTheme(element) {
  var current = resolveCheckBoxElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < CHECKBOX_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + CHECKBOX_THEMES[index])) {
        return CHECKBOX_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

function restoreCheckBoxAttribute(element, name, value) {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

export function createCheckBoxFactory(Control, registerControl, unregisterControl) {
  'use strict';

  var defaults = {
    width: 20,
    height: 20,
    value: null,
    checked: false,
    disabled: false,
    label: null,
    labelWidth: 'auto',
    labelPosition: 'after',
    labelAlign: 'left',
    locale: 'en',
    theme: 'inherit',
    cls: '',
    ariaLabel: '',
    onChange: null
  };
  var localePacks = {
    en: {
      checkbox: 'Checkbox'
    },
    'zh-TW': {
      checkbox: '核取方塊'
    },
    'zh-CN': {
      checkbox: '复选框'
    }
  };

  function CheckBox(element, options) {
    if (!(this instanceof CheckBox)) return new CheckBox(element, options);
    this.hostElement = resolveCheckBoxElement(element);
    if (
      !this.hostElement ||
      this.hostElement.tagName !== 'INPUT' ||
      String(this.hostElement.type || '').toLowerCase() !== 'checkbox'
    ) {
      throw new Error('fabui.CheckBox requires an input[type="checkbox"] element.');
    }
    if (this.hostElement.__fabuiCheckBox) return this.hostElement.__fabuiCheckBox;
    Control.call(this);
    this._listeners = {};
    this._destroyed = false;
    this._changing = false;
    this._original = {
      className: this.hostElement.getAttribute('class'),
      style: this.hostElement.getAttribute('style'),
      id: this.hostElement.getAttribute('id'),
      value: this.hostElement.getAttribute('value'),
      checked: this.hostElement.checked,
      checkedAttribute: this.hostElement.getAttribute('checked'),
      disabled: this.hostElement.disabled,
      disabledAttribute: this.hostElement.getAttribute('disabled'),
      ariaLabel: this.hostElement.getAttribute('aria-label'),
      tabIndex: this.hostElement.getAttribute('tabindex')
    };
    this._themeSource = this.hostElement.parentElement || document.body;
    this._options = checkBoxAssign({}, defaults, this._readElementOptions(), options || {});
    this._normalizeOptions();
    this._initialChecked = this._options.checked;
    this._initialValue = this._options.value;
    this._build();
    this._bind();
    this._applyOptions(true);
    this.hostElement.__fabuiCheckBox = this;
    registerControl(this.hostElement, this);
  }

  CheckBox.prototype = Object.create(Control.prototype);
  CheckBox.prototype.constructor = CheckBox;

  CheckBox.prototype._readElementOptions = function() {
    var input = this.hostElement;
    var result = {
      checked: input.checked,
      disabled: input.disabled
    };
    var value;
    value = input.getAttribute('value');
    if (value != null) result.value = value;
    value = input.getAttribute('label') || input.getAttribute('data-label');
    if (value != null) result.label = value;
    value = input.getAttribute('labelWidth') || input.getAttribute('data-label-width');
    if (value != null) result.labelWidth = value;
    value = input.getAttribute('labelPosition') || input.getAttribute('data-label-position');
    if (value != null) result.labelPosition = value;
    value = input.getAttribute('labelAlign') || input.getAttribute('data-label-align');
    if (value != null) result.labelAlign = value;
    value = input.getAttribute('data-width');
    if (value != null) result.width = value;
    value = input.getAttribute('data-height');
    if (value != null) result.height = value;
    value = input.getAttribute('data-theme') || input.getAttribute('theme');
    if (value) result.theme = value;
    value = input.getAttribute('data-locale') || input.getAttribute('locale');
    if (value) result.locale = value;
    value = input.getAttribute('aria-label');
    if (value) result.ariaLabel = value;
    return result;
  };

  CheckBox.prototype._normalizeOptions = function() {
    this._options.checked = checkBoxBoolean(this._options.checked, false);
    this._options.disabled = checkBoxBoolean(this._options.disabled, false);
    this._options.labelPosition = normalizeCheckBoxLabelPosition(this._options.labelPosition);
    this._options.labelAlign = normalizeCheckBoxLabelAlign(this._options.labelAlign);
    this._options.locale = normalizeCheckBoxLocale(this._options.locale);
  };

  CheckBox.prototype._text = function(key) {
    var pack = localePacks[this._options.locale] || localePacks.en;
    return pack[key] || localePacks.en[key] || key;
  };

  CheckBox.prototype._build = function() {
    var parent = this.hostElement.parentNode;
    if (!parent) throw new Error('fabui.CheckBox input must be attached to the document.');
    if (!this.hostElement.id) {
      checkBoxSequence += 1;
      this.hostElement.id = 'fui-checkbox-' + checkBoxSequence;
    }
    this.wrapper = document.createElement('span');
    this.wrapper.className = 'fui-checkbox';
    this.control = document.createElement('span');
    this.control.className = 'fui-checkbox-control';
    this.box = document.createElement('span');
    this.box.className = 'fui-checkbox-box';
    this.box.setAttribute('aria-hidden', 'true');
    this.labelElement = document.createElement('label');
    this.labelElement.className = 'fui-checkbox-label';
    this.labelElement.setAttribute('for', this.hostElement.id);
    parent.insertBefore(this.wrapper, this.hostElement);
    this.control.appendChild(this.hostElement);
    this.control.appendChild(this.box);
    this.wrapper.appendChild(this.control);
    this.wrapper.appendChild(this.labelElement);
    this.hostElement.classList.add('fui-checkbox-input');
  };

  CheckBox.prototype._bind = function() {
    var self = this;
    this.addEventListener(this.hostElement, 'change', function(event) {
      if (self._changing) return;
      self._setChecked(self.hostElement.checked, false, event);
    });
    if (this.hostElement.form) {
      this.addEventListener(this.hostElement.form, 'reset', function() {
        setTimeout(function() {
          if (self._destroyed) return;
          self._setChecked(self._initialChecked, true);
          self.setValue(self._initialValue);
        }, 0);
      });
    }
  };

  CheckBox.prototype._applyOptions = function(initial) {
    var label = this._options.label == null ? '' : String(this._options.label);
    var theme = this._options.theme;
    this.wrapper.className = 'fui-checkbox' +
      (this._options.cls ? ' ' + String(this._options.cls) : '');
    this.wrapper.classList.add('fui-checkbox-label-' + this._options.labelPosition);
    this.wrapper.classList.toggle('fui-checkbox-with-label', Boolean(label));
    this.labelElement.textContent = label;
    this.labelElement.hidden = !label;
    this.labelElement.style.width = checkBoxSize(this._options.labelWidth, 'auto');
    this.labelElement.style.textAlign = this._options.labelAlign;
    this.control.style.width = checkBoxSize(this._options.width, 20);
    this.control.style.height = checkBoxSize(this._options.height, 20);
    this.box.style.width = checkBoxSize(this._options.width, 20);
    this.box.style.height = checkBoxSize(this._options.height, 20);
    this.hostElement.disabled = this._options.disabled;
    this.wrapper.classList.toggle('fui-checkbox-disabled', this._options.disabled);
    if (this._options.value != null) this.hostElement.value = String(this._options.value);
    else if (this._original.value == null) this.hostElement.removeAttribute('value');
    this.hostElement.checked = this._options.checked;
    this.wrapper.classList.toggle('fui-checkbox-checked', this._options.checked);
    this.hostElement.setAttribute(
      'aria-label',
      this._options.ariaLabel || label || this._text('checkbox')
    );
    this.setTheme(theme);
    if (!initial) this._emit('refresh', { options: this.options() });
    return this;
  };

  CheckBox.prototype._invoke = function(name) {
    var handler = this._options[name];
    var args = Array.prototype.slice.call(arguments, 1);
    return typeof handler === 'function' ? handler.apply(this, args) : undefined;
  };

  CheckBox.prototype._emit = function(type, detail) {
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

  CheckBox.prototype.on = function(type, listener) {
    if (type && typeof listener === 'function') {
      (this._listeners[String(type)] || (this._listeners[String(type)] = [])).push(listener);
    }
    return this;
  };

  CheckBox.prototype.off = function(type, listener) {
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

  CheckBox.prototype._setChecked = function(checked, silent, originalEvent) {
    var changed;
    checked = Boolean(checked);
    changed = this._options.checked !== checked;
    this._options.checked = checked;
    this._changing = true;
    this.hostElement.checked = checked;
    this._changing = false;
    this.wrapper.classList.toggle('fui-checkbox-checked', checked);
    if (changed && !silent) {
      this._invoke('onChange', checked);
      this._emit('change', {
        checked: checked,
        value: this.getValue(),
        originalEvent: originalEvent || null
      });
    }
    return this;
  };

  CheckBox.prototype.options = function() {
    return checkBoxAssign({}, this._options);
  };

  CheckBox.prototype.setOptions = function(options) {
    checkBoxAssign(this._options, options || {});
    this._normalizeOptions();
    return this._applyOptions(false);
  };

  CheckBox.prototype.getValue = function() {
    return this.hostElement.value;
  };

  CheckBox.prototype.setValue = function(value) {
    this._options.value = value;
    if (value == null) this.hostElement.removeAttribute('value');
    else this.hostElement.value = String(value);
    return this;
  };

  CheckBox.prototype.isChecked = function() {
    return this._options.checked;
  };

  CheckBox.prototype.check = function() {
    return this._setChecked(true, false);
  };

  CheckBox.prototype.uncheck = function() {
    return this._setChecked(false, false);
  };

  CheckBox.prototype.clear = function() {
    return this.uncheck();
  };

  CheckBox.prototype.reset = function() {
    this.setValue(this._initialValue);
    return this._setChecked(this._initialChecked, false);
  };

  CheckBox.prototype.disable = function() {
    this._options.disabled = true;
    this.hostElement.disabled = true;
    this.wrapper.classList.add('fui-checkbox-disabled');
    return this;
  };

  CheckBox.prototype.enable = function() {
    this._options.disabled = false;
    this.hostElement.disabled = false;
    this.wrapper.classList.remove('fui-checkbox-disabled');
    return this;
  };

  CheckBox.prototype.resize = function(width, height) {
    if (width != null) this._options.width = width;
    if (height != null) this._options.height = height;
    this.control.style.width = checkBoxSize(this._options.width, 20);
    this.control.style.height = checkBoxSize(this._options.height, 20);
    this.box.style.width = checkBoxSize(this._options.width, 20);
    this.box.style.height = checkBoxSize(this._options.height, 20);
    return this;
  };

  CheckBox.prototype.setLabel = function(label) {
    this._options.label = label;
    return this._applyOptions(false);
  };

  CheckBox.prototype.setLocale = function(locale, messages) {
    if (locale && messages) {
      localePacks[String(locale)] = checkBoxAssign({}, localePacks.en, messages);
    }
    this._options.locale = normalizeCheckBoxLocale(locale);
    this.hostElement.setAttribute(
      'aria-label',
      this._options.ariaLabel || this._options.label || this._text('checkbox')
    );
    return this;
  };

  CheckBox.prototype.setTheme = function(theme) {
    var index;
    this._options.theme = theme == null ? 'inherit' : theme;
    this.theme = this._options.theme === 'inherit' ?
      findCheckBoxTheme(this._themeSource) :
      normalizeCheckBoxTheme(this._options.theme);
    for (index = 0; index < CHECKBOX_THEMES.length; index += 1) {
      this.wrapper.classList.remove('fg-theme-' + CHECKBOX_THEMES[index]);
    }
    this.wrapper.classList.add('fg-theme-' + this.theme);
    return this;
  };

  CheckBox.prototype.destroy = function() {
    var parent;
    if (this._destroyed) return;
    this._destroyed = true;
    this.removeEventListener();
    parent = this.wrapper.parentNode;
    if (parent) {
      parent.insertBefore(this.hostElement, this.wrapper);
      parent.removeChild(this.wrapper);
    }
    restoreCheckBoxAttribute(this.hostElement, 'class', this._original.className);
    restoreCheckBoxAttribute(this.hostElement, 'style', this._original.style);
    restoreCheckBoxAttribute(this.hostElement, 'id', this._original.id);
    restoreCheckBoxAttribute(this.hostElement, 'value', this._original.value);
    restoreCheckBoxAttribute(this.hostElement, 'checked', this._original.checkedAttribute);
    restoreCheckBoxAttribute(this.hostElement, 'disabled', this._original.disabledAttribute);
    restoreCheckBoxAttribute(this.hostElement, 'aria-label', this._original.ariaLabel);
    restoreCheckBoxAttribute(this.hostElement, 'tabindex', this._original.tabIndex);
    this.hostElement.checked = this._original.checked;
    this.hostElement.disabled = this._original.disabled;
    unregisterControl(this.hostElement, this);
    delete this.hostElement.__fabuiCheckBox;
    this._listeners = {};
    this.wrapper = null;
    this.control = null;
    this.box = null;
    this.labelElement = null;
  };

  CheckBox.prototype.dispose = CheckBox.prototype.destroy;
  CheckBox.defaults = defaults;
  CheckBox.locales = localePacks;
  CheckBox.themes = CHECKBOX_THEMES.slice();
  CheckBox.addLocale = function(name, messages) {
    if (name && messages) {
      localePacks[String(name)] = checkBoxAssign({}, localePacks.en, messages);
    }
    return CheckBox;
  };
  CheckBox.getControl = function(element) {
    element = resolveCheckBoxElement(element);
    return element && element.__fabuiCheckBox ? element.__fabuiCheckBox : null;
  };
  CheckBox.normalizeTheme = normalizeCheckBoxTheme;
  CheckBox.normalizeLocale = normalizeCheckBoxLocale;
  return CheckBox;
}
