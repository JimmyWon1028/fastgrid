var RADIOBUTTON_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];
var radioButtonSequence = 0;

function radioButtonAssign(target) {
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

function radioButtonBoolean(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    value = value.trim().toLowerCase();
    if (value === 'false' || value === '0' || value === 'no') return false;
    if (value === 'true' || value === '1' || value === 'yes' || value === '') return true;
  }
  return Boolean(value);
}

function radioButtonSize(value, fallback) {
  if (value == null || value === '') value = fallback;
  if (value === 'auto') return 'auto';
  return typeof value === 'number' ? value + 'px' : String(value);
}

function resolveRadioButtonElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function normalizeRadioButtonLocale(value) {
  value = String(value || 'en').trim().replace(/_/g, '-');
  if (/^zh-(?:TW|Hant)(?:-|$)/i.test(value)) return 'zh-TW';
  if (/^zh-(?:CN|Hans)(?:-|$)/i.test(value) || /^zh$/i.test(value)) return 'zh-CN';
  return 'en';
}

export function normalizeRadioButtonTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return RADIOBUTTON_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

export function normalizeRadioButtonLabelPosition(value) {
  value = String(value || 'after').toLowerCase();
  return value === 'before' || value === 'top' ? value : 'after';
}

export function normalizeRadioButtonLabelAlign(value) {
  return String(value || 'left').toLowerCase() === 'right' ? 'right' : 'left';
}

function findRadioButtonTheme(element) {
  var current = resolveRadioButtonElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < RADIOBUTTON_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + RADIOBUTTON_THEMES[index])) {
        return RADIOBUTTON_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

function restoreRadioButtonAttribute(element, name, value) {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

export function createRadioButtonFactory(Control, registerControl, unregisterControl) {
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
      radiobutton: 'Radio button'
    },
    'zh-TW': {
      radiobutton: '選項按鈕'
    },
    'zh-CN': {
      radiobutton: '单选按钮'
    }
  };

  function RadioButton(element, options) {
    if (!(this instanceof RadioButton)) return new RadioButton(element, options);
    this.hostElement = resolveRadioButtonElement(element);
    if (
      !this.hostElement ||
      this.hostElement.tagName !== 'INPUT' ||
      String(this.hostElement.type || '').toLowerCase() !== 'radio'
    ) {
      throw new Error('fabui.RadioButton requires an input[type="radio"] element.');
    }
    if (this.hostElement.__fabuiRadioButton) return this.hostElement.__fabuiRadioButton;
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
    this._options = radioButtonAssign({}, defaults, this._readElementOptions(), options || {});
    this._normalizeOptions();
    this._initialChecked = this._options.checked;
    this._initialValue = this._options.value;
    this._build();
    this._bind();
    this._applyOptions(true);
    this.hostElement.__fabuiRadioButton = this;
    registerControl(this.hostElement, this);
    this._syncGroup(null, true);
  }

  RadioButton.prototype = Object.create(Control.prototype);
  RadioButton.prototype.constructor = RadioButton;

  RadioButton.prototype._readElementOptions = function() {
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

  RadioButton.prototype._normalizeOptions = function() {
    this._options.checked = radioButtonBoolean(this._options.checked, false);
    this._options.disabled = radioButtonBoolean(this._options.disabled, false);
    this._options.labelPosition = normalizeRadioButtonLabelPosition(
      this._options.labelPosition
    );
    this._options.labelAlign = normalizeRadioButtonLabelAlign(this._options.labelAlign);
    this._options.locale = normalizeRadioButtonLocale(this._options.locale);
  };

  RadioButton.prototype._text = function(key) {
    var pack = localePacks[this._options.locale] || localePacks.en;
    return pack[key] || localePacks.en[key] || key;
  };

  RadioButton.prototype._build = function() {
    var parent = this.hostElement.parentNode;
    if (!parent) throw new Error('fabui.RadioButton input must be attached to the document.');
    if (!this.hostElement.id) {
      radioButtonSequence += 1;
      this.hostElement.id = 'fui-radiobutton-' + radioButtonSequence;
    }
    this.wrapper = document.createElement('span');
    this.wrapper.className = 'fui-radiobutton';
    this.control = document.createElement('span');
    this.control.className = 'fui-radiobutton-control';
    this.box = document.createElement('span');
    this.box.className = 'fui-radiobutton-box';
    this.box.setAttribute('aria-hidden', 'true');
    this.labelElement = document.createElement('label');
    this.labelElement.className = 'fui-radiobutton-label';
    this.labelElement.setAttribute('for', this.hostElement.id);
    parent.insertBefore(this.wrapper, this.hostElement);
    this.control.appendChild(this.hostElement);
    this.control.appendChild(this.box);
    this.wrapper.appendChild(this.control);
    this.wrapper.appendChild(this.labelElement);
    this.hostElement.classList.add('fui-radiobutton-input');
  };

  RadioButton.prototype._bind = function() {
    var self = this;
    this.addEventListener(this.hostElement, 'change', function(event) {
      if (self._changing) return;
      self._syncGroup(event, false);
    });
    if (this.hostElement.form) {
      this.addEventListener(this.hostElement.form, 'reset', function() {
        setTimeout(function() {
          if (self._destroyed) return;
          self.setValue(self._initialValue);
          self.hostElement.checked = self._initialChecked;
          self._syncGroup(null, true);
        }, 0);
      });
    }
  };

  RadioButton.prototype._getGroupInputs = function() {
    var input = this.hostElement;
    var name = input.name;
    var root = input.form || document;
    if (!name || !root || !root.querySelectorAll) return [input];
    return Array.prototype.filter.call(
      root.querySelectorAll('input[type="radio"]'),
      function(candidate) {
        return candidate.name === name && candidate.form === input.form;
      }
    );
  };

  RadioButton.prototype._syncGroup = function(originalEvent, silent) {
    this._getGroupInputs().forEach(function(input) {
      var control = input.__fabuiRadioButton;
      if (control) control._setChecked(input.checked, silent, originalEvent);
    });
    return this;
  };

  RadioButton.prototype._applyOptions = function(initial) {
    var label = this._options.label == null ? '' : String(this._options.label);
    this.wrapper.className = 'fui-radiobutton' +
      (this._options.cls ? ' ' + String(this._options.cls) : '');
    this.wrapper.classList.add('fui-radiobutton-label-' + this._options.labelPosition);
    this.wrapper.classList.toggle('fui-radiobutton-with-label', Boolean(label));
    this.labelElement.textContent = label;
    this.labelElement.hidden = !label;
    this.labelElement.style.width = radioButtonSize(this._options.labelWidth, 'auto');
    this.labelElement.style.textAlign = this._options.labelAlign;
    this.resize(this._options.width, this._options.height);
    this.hostElement.disabled = this._options.disabled;
    this.wrapper.classList.toggle('fui-radiobutton-disabled', this._options.disabled);
    if (this._options.value != null) this.hostElement.value = String(this._options.value);
    else if (this._original.value == null) this.hostElement.removeAttribute('value');
    this.hostElement.checked = this._options.checked;
    this.wrapper.classList.toggle('fui-radiobutton-checked', this._options.checked);
    this.hostElement.setAttribute(
      'aria-label',
      this._options.ariaLabel || label || this._text('radiobutton')
    );
    this.setTheme(this._options.theme);
    if (!initial) {
      this._syncGroup(null, true);
      this._emit('refresh', { options: this.options() });
    }
    return this;
  };

  RadioButton.prototype._invoke = function(name) {
    var handler = this._options[name];
    var args = Array.prototype.slice.call(arguments, 1);
    return typeof handler === 'function' ? handler.apply(this, args) : undefined;
  };

  RadioButton.prototype._emit = function(type, detail) {
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

  RadioButton.prototype.on = function(type, listener) {
    if (type && typeof listener === 'function') {
      (this._listeners[String(type)] || (this._listeners[String(type)] = [])).push(listener);
    }
    return this;
  };

  RadioButton.prototype.off = function(type, listener) {
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

  RadioButton.prototype._setChecked = function(checked, silent, originalEvent) {
    var changed;
    checked = Boolean(checked);
    changed = this._options.checked !== checked;
    this._options.checked = checked;
    this._changing = true;
    this.hostElement.checked = checked;
    this._changing = false;
    this.wrapper.classList.toggle('fui-radiobutton-checked', checked);
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

  RadioButton.prototype.options = function() {
    return radioButtonAssign({}, this._options);
  };

  RadioButton.prototype.setOptions = function(options) {
    radioButtonAssign(this._options, options || {});
    this._normalizeOptions();
    return this._applyOptions(false);
  };

  RadioButton.prototype.getValue = function() {
    return this.hostElement.value;
  };

  RadioButton.prototype.setValue = function(value) {
    this._options.value = value;
    if (value == null) this.hostElement.removeAttribute('value');
    else this.hostElement.value = String(value);
    return this;
  };

  RadioButton.prototype.isChecked = function() {
    return this._options.checked;
  };

  RadioButton.prototype.check = function() {
    this.hostElement.checked = true;
    return this._syncGroup(null, false);
  };

  RadioButton.prototype.uncheck = function() {
    this.hostElement.checked = false;
    return this._syncGroup(null, false);
  };

  RadioButton.prototype.clear = function() {
    return this.uncheck();
  };

  RadioButton.prototype.reset = function() {
    this.setValue(this._initialValue);
    this.hostElement.checked = this._initialChecked;
    return this._syncGroup(null, false);
  };

  RadioButton.prototype.disable = function() {
    this._options.disabled = true;
    this.hostElement.disabled = true;
    this.wrapper.classList.add('fui-radiobutton-disabled');
    return this;
  };

  RadioButton.prototype.enable = function() {
    this._options.disabled = false;
    this.hostElement.disabled = false;
    this.wrapper.classList.remove('fui-radiobutton-disabled');
    return this;
  };

  RadioButton.prototype.resize = function(width, height) {
    if (width != null) this._options.width = width;
    if (height != null) this._options.height = height;
    this.control.style.width = radioButtonSize(this._options.width, 20);
    this.control.style.height = radioButtonSize(this._options.height, 20);
    this.box.style.width = radioButtonSize(this._options.width, 20);
    this.box.style.height = radioButtonSize(this._options.height, 20);
    return this;
  };

  RadioButton.prototype.setLabel = function(label) {
    this._options.label = label;
    return this._applyOptions(false);
  };

  RadioButton.prototype.setLocale = function(locale, messages) {
    if (locale && messages) {
      localePacks[String(locale)] = radioButtonAssign({}, localePacks.en, messages);
    }
    this._options.locale = normalizeRadioButtonLocale(locale);
    this.hostElement.setAttribute(
      'aria-label',
      this._options.ariaLabel || this._options.label || this._text('radiobutton')
    );
    return this;
  };

  RadioButton.prototype.setTheme = function(theme) {
    var index;
    this._options.theme = theme == null ? 'inherit' : theme;
    this.theme = this._options.theme === 'inherit' ?
      findRadioButtonTheme(this._themeSource) :
      normalizeRadioButtonTheme(this._options.theme);
    for (index = 0; index < RADIOBUTTON_THEMES.length; index += 1) {
      this.wrapper.classList.remove('fg-theme-' + RADIOBUTTON_THEMES[index]);
    }
    this.wrapper.classList.add('fg-theme-' + this.theme);
    return this;
  };

  RadioButton.prototype.destroy = function() {
    var parent;
    if (this._destroyed) return;
    this._destroyed = true;
    this.removeEventListener();
    parent = this.wrapper.parentNode;
    if (parent) {
      parent.insertBefore(this.hostElement, this.wrapper);
      parent.removeChild(this.wrapper);
    }
    restoreRadioButtonAttribute(this.hostElement, 'class', this._original.className);
    restoreRadioButtonAttribute(this.hostElement, 'style', this._original.style);
    restoreRadioButtonAttribute(this.hostElement, 'id', this._original.id);
    restoreRadioButtonAttribute(this.hostElement, 'value', this._original.value);
    restoreRadioButtonAttribute(
      this.hostElement,
      'checked',
      this._original.checkedAttribute
    );
    restoreRadioButtonAttribute(
      this.hostElement,
      'disabled',
      this._original.disabledAttribute
    );
    restoreRadioButtonAttribute(this.hostElement, 'aria-label', this._original.ariaLabel);
    restoreRadioButtonAttribute(this.hostElement, 'tabindex', this._original.tabIndex);
    this.hostElement.checked = this._original.checked;
    this.hostElement.disabled = this._original.disabled;
    unregisterControl(this.hostElement, this);
    delete this.hostElement.__fabuiRadioButton;
    this._listeners = {};
    this.wrapper = null;
    this.control = null;
    this.box = null;
    this.labelElement = null;
  };

  RadioButton.prototype.dispose = RadioButton.prototype.destroy;
  RadioButton.defaults = defaults;
  RadioButton.locales = localePacks;
  RadioButton.themes = RADIOBUTTON_THEMES.slice();
  RadioButton.addLocale = function(name, messages) {
    if (name && messages) {
      localePacks[String(name)] = radioButtonAssign({}, localePacks.en, messages);
    }
    return RadioButton;
  };
  RadioButton.getControl = function(element) {
    element = resolveRadioButtonElement(element);
    return element && element.__fabuiRadioButton ? element.__fabuiRadioButton : null;
  };
  RadioButton.normalizeTheme = normalizeRadioButtonTheme;
  RadioButton.normalizeLocale = normalizeRadioButtonLocale;
  return RadioButton;
}
