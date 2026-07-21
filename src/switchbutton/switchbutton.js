var SWITCHBUTTON_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];
var switchButtonSequence = 0;

function switchButtonAssign(target) {
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

function switchButtonBoolean(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    value = value.trim().toLowerCase();
    if (value === 'false' || value === '0' || value === 'no') return false;
    if (value === 'true' || value === '1' || value === 'yes' || value === '') return true;
  }
  return Boolean(value);
}

function switchButtonNumber(value, fallback, minimum) {
  var number = parseFloat(value);
  if (!Number.isFinite(number)) number = fallback;
  return Math.max(minimum == null ? 0 : minimum, number);
}

function resolveSwitchButtonElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function normalizeSwitchButtonLocale(value) {
  value = String(value || 'en').trim().replace(/_/g, '-');
  if (/^zh-(?:TW|Hant)(?:-|$)/i.test(value)) return 'zh-TW';
  if (/^zh-(?:CN|Hans)(?:-|$)/i.test(value) || /^zh$/i.test(value)) return 'zh-CN';
  return 'en';
}

export function normalizeSwitchButtonTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return SWITCHBUTTON_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

export function normalizeSwitchButtonLabelPosition(value) {
  value = String(value || 'before').toLowerCase();
  return value === 'after' || value === 'top' ? value : 'before';
}

export function normalizeSwitchButtonLabelAlign(value) {
  return String(value || 'left').toLowerCase() === 'right' ? 'right' : 'left';
}

function findSwitchButtonTheme(element) {
  var current = resolveSwitchButtonElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < SWITCHBUTTON_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + SWITCHBUTTON_THEMES[index])) {
        return SWITCHBUTTON_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

function restoreSwitchButtonAttribute(element, name, value) {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

export function createSwitchButtonFactory(Control, registerControl, unregisterControl) {
  'use strict';

  var defaults = {
    handleWidth: 'auto',
    width: 60,
    height: 30,
    checked: false,
    disabled: false,
    readonly: false,
    reversed: false,
    onText: 'ON',
    offText: 'OFF',
    handleText: '',
    value: 'on',
    label: null,
    labelWidth: 'auto',
    labelPosition: 'before',
    labelAlign: 'left',
    locale: 'en',
    theme: 'inherit',
    cls: '',
    ariaLabel: '',
    onChange: null
  };
  var localePacks = {
    en: {
      switchbutton: 'Switch button'
    },
    'zh-TW': {
      switchbutton: '切換按鈕'
    },
    'zh-CN': {
      switchbutton: '切换按钮'
    }
  };

  function SwitchButton(element, options) {
    if (!(this instanceof SwitchButton)) return new SwitchButton(element, options);
    this.hostElement = resolveSwitchButtonElement(element);
    if (
      !this.hostElement ||
      this.hostElement.tagName !== 'INPUT' ||
      String(this.hostElement.type || '').toLowerCase() !== 'checkbox'
    ) {
      throw new Error('fabui.SwitchButton requires an input[type="checkbox"] element.');
    }
    if (this.hostElement.__fabuiSwitchButton) {
      return this.hostElement.__fabuiSwitchButton;
    }
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
      readOnly: this.hostElement.readOnly,
      readonlyAttribute: this.hostElement.getAttribute('readonly'),
      ariaLabel: this.hostElement.getAttribute('aria-label'),
      ariaReadonly: this.hostElement.getAttribute('aria-readonly'),
      tabIndex: this.hostElement.getAttribute('tabindex')
    };
    this._themeSource = this.hostElement.parentElement || document.body;
    this._options = switchButtonAssign(
      {},
      defaults,
      this._readElementOptions(),
      options || {}
    );
    this._normalizeOptions();
    this._initialChecked = this._options.checked;
    this._initialValue = this._options.value;
    this._build();
    this._bind();
    this._applyOptions(true);
    this.hostElement.__fabuiSwitchButton = this;
    registerControl(this.hostElement, this);
  }

  SwitchButton.prototype = Object.create(Control.prototype);
  SwitchButton.prototype.constructor = SwitchButton;

  SwitchButton.prototype._readElementOptions = function() {
    var input = this.hostElement;
    var result = {
      checked: input.checked,
      disabled: input.disabled,
      readonly: input.readOnly
    };
    var names = [
      ['value', 'value'],
      ['label', 'label'],
      ['labelWidth', 'label-width'],
      ['labelPosition', 'label-position'],
      ['labelAlign', 'label-align'],
      ['onText', 'on-text'],
      ['offText', 'off-text'],
      ['handleText', 'handle-text'],
      ['handleWidth', 'handle-width'],
      ['width', 'width'],
      ['height', 'height'],
      ['theme', 'theme'],
      ['locale', 'locale'],
      ['ariaLabel', 'aria-label']
    ];
    var index;
    var value;
    for (index = 0; index < names.length; index += 1) {
      value = input.getAttribute(names[index][0]);
      if (value == null) value = input.getAttribute('data-' + names[index][1]);
      if (value != null) result[names[index][0]] = value;
    }
    value = input.getAttribute('reversed');
    if (value == null) value = input.getAttribute('data-reversed');
    if (value != null) result.reversed = value;
    return result;
  };

  SwitchButton.prototype._normalizeOptions = function() {
    this._options.width = switchButtonNumber(this._options.width, 60, 1);
    this._options.height = switchButtonNumber(this._options.height, 30, 1);
    if (this._options.handleWidth !== 'auto') {
      this._options.handleWidth = switchButtonNumber(
        this._options.handleWidth,
        this._options.height,
        1
      );
    }
    this._options.checked = switchButtonBoolean(this._options.checked, false);
    this._options.disabled = switchButtonBoolean(this._options.disabled, false);
    this._options.readonly = switchButtonBoolean(this._options.readonly, false);
    this._options.reversed = switchButtonBoolean(this._options.reversed, false);
    this._options.labelPosition = normalizeSwitchButtonLabelPosition(
      this._options.labelPosition
    );
    this._options.labelAlign = normalizeSwitchButtonLabelAlign(
      this._options.labelAlign
    );
    this._options.locale = normalizeSwitchButtonLocale(this._options.locale);
  };

  SwitchButton.prototype._text = function(key) {
    var pack = localePacks[this._options.locale] || localePacks.en;
    return pack[key] || localePacks.en[key] || key;
  };

  SwitchButton.prototype._build = function() {
    var parent = this.hostElement.parentNode;
    if (!parent) {
      throw new Error('fabui.SwitchButton input must be attached to the document.');
    }
    if (!this.hostElement.id) {
      switchButtonSequence += 1;
      this.hostElement.id = 'fui-switchbutton-' + switchButtonSequence;
    }
    this.wrapper = document.createElement('span');
    this.wrapper.className = 'fui-switchbutton';
    this.control = document.createElement('span');
    this.control.className = 'fui-switchbutton-control';
    this.inner = document.createElement('span');
    this.inner.className = 'fui-switchbutton-inner';
    this.onElement = document.createElement('span');
    this.onElement.className = 'fui-switchbutton-on';
    this.handleElement = document.createElement('span');
    this.handleElement.className = 'fui-switchbutton-handle';
    this.offElement = document.createElement('span');
    this.offElement.className = 'fui-switchbutton-off';
    this.labelElement = document.createElement('label');
    this.labelElement.className = 'fui-switchbutton-label';
    this.labelElement.setAttribute('for', this.hostElement.id);
    this.inner.setAttribute('aria-hidden', 'true');
    parent.insertBefore(this.wrapper, this.hostElement);
    this.inner.appendChild(this.onElement);
    this.inner.appendChild(this.handleElement);
    this.inner.appendChild(this.offElement);
    this.control.appendChild(this.inner);
    this.control.appendChild(this.hostElement);
    this.wrapper.appendChild(this.control);
    this.wrapper.appendChild(this.labelElement);
    this.hostElement.classList.add('fui-switchbutton-input');
  };

  SwitchButton.prototype._bind = function() {
    var self = this;
    this.addEventListener(this.hostElement, 'click', function(event) {
      if (!self._options.readonly) return;
      event.preventDefault();
      self.hostElement.checked = self._options.checked;
    });
    this.addEventListener(this.hostElement, 'change', function(event) {
      if (self._changing) return;
      if (self._options.readonly) {
        self.hostElement.checked = self._options.checked;
        return;
      }
      self._setChecked(self.hostElement.checked, false, event);
    });
    if (this.hostElement.form) {
      this.addEventListener(this.hostElement.form, 'reset', function() {
        setTimeout(function() {
          if (self._destroyed) return;
          self.setValue(self._initialValue);
          self._setChecked(self._initialChecked, true);
        }, 0);
      });
    }
  };

  SwitchButton.prototype._layout = function() {
    var width = this._options.width;
    var height = this._options.height;
    var handleWidth = this._options.handleWidth === 'auto' ?
      height :
      Math.min(width, this._options.handleWidth);
    var labelWidth = width - handleWidth / 2;
    var marginWidth = width - handleWidth;
    var offset = this._options.reversed ?
      (this._options.checked ? marginWidth : 0) :
      (this._options.checked ? 0 : marginWidth);
    this.control.style.width = width + 'px';
    this.control.style.height = height + 'px';
    this.inner.style.width = (width * 2 - handleWidth) + 'px';
    this.inner.style.height = height + 'px';
    this.inner.style.lineHeight = height + 'px';
    this.inner.style.marginLeft = -offset + 'px';
    this.onElement.style.width = labelWidth + 'px';
    this.offElement.style.width = labelWidth + 'px';
    this.handleElement.style.width = handleWidth + 'px';
    this.handleElement.style.height = height + 'px';
    this.handleElement.style.marginLeft = -(handleWidth / 2) + 'px';
    this.onElement.style.textIndent = (
      this._options.reversed ? handleWidth / 2 : -handleWidth / 2
    ) + 'px';
    this.offElement.style.textIndent = (
      this._options.reversed ? -handleWidth / 2 : handleWidth / 2
    ) + 'px';
  };

  SwitchButton.prototype._applyOptions = function(initial) {
    var label = this._options.label == null ? '' : String(this._options.label);
    this.wrapper.className = 'fui-switchbutton' +
      (this._options.cls ? ' ' + String(this._options.cls) : '');
    this.wrapper.classList.add(
      'fui-switchbutton-label-' + this._options.labelPosition
    );
    this.wrapper.classList.toggle('fui-switchbutton-with-label', Boolean(label));
    this.wrapper.classList.toggle('fui-switchbutton-checked', this._options.checked);
    this.wrapper.classList.toggle('fui-switchbutton-disabled', this._options.disabled);
    this.wrapper.classList.toggle('fui-switchbutton-readonly', this._options.readonly);
    this.wrapper.classList.toggle('fui-switchbutton-reversed', this._options.reversed);
    this.onElement.textContent = String(this._options.onText == null ? '' : this._options.onText);
    this.offElement.textContent = String(this._options.offText == null ? '' : this._options.offText);
    this.handleElement.textContent = String(
      this._options.handleText == null ? '' : this._options.handleText
    );
    if (this._options.reversed) {
      this.inner.appendChild(this.offElement);
      this.inner.appendChild(this.handleElement);
      this.inner.appendChild(this.onElement);
    } else {
      this.inner.appendChild(this.onElement);
      this.inner.appendChild(this.handleElement);
      this.inner.appendChild(this.offElement);
    }
    this.labelElement.textContent = label;
    this.labelElement.hidden = !label;
    this.labelElement.style.width = this._options.labelWidth === 'auto' ?
      'auto' :
      switchButtonNumber(this._options.labelWidth, 0, 0) + 'px';
    this.labelElement.style.textAlign = this._options.labelAlign;
    this.hostElement.disabled = this._options.disabled;
    this.hostElement.readOnly = this._options.readonly;
    this.hostElement.setAttribute('aria-readonly', String(this._options.readonly));
    this.hostElement.setAttribute(
      'aria-label',
      this._options.ariaLabel || label || this._text('switchbutton')
    );
    if (this._options.value != null) this.hostElement.value = String(this._options.value);
    else if (this._original.value == null) this.hostElement.removeAttribute('value');
    this.hostElement.checked = this._options.checked;
    this._layout();
    this.setTheme(this._options.theme);
    if (!initial) this._emit('refresh', { options: this.options() });
    return this;
  };

  SwitchButton.prototype._invoke = function(name) {
    var handler = this._options[name];
    var args = Array.prototype.slice.call(arguments, 1);
    return typeof handler === 'function' ? handler.apply(this, args) : undefined;
  };

  SwitchButton.prototype._emit = function(type, detail) {
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

  SwitchButton.prototype.on = function(type, listener) {
    if (type && typeof listener === 'function') {
      (this._listeners[String(type)] || (this._listeners[String(type)] = [])).push(listener);
    }
    return this;
  };

  SwitchButton.prototype.off = function(type, listener) {
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

  SwitchButton.prototype._setChecked = function(checked, silent, originalEvent) {
    var changed;
    checked = Boolean(checked);
    changed = this._options.checked !== checked;
    this._options.checked = checked;
    this._changing = true;
    this.hostElement.checked = checked;
    this._changing = false;
    this.wrapper.classList.toggle('fui-switchbutton-checked', checked);
    this._layout();
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

  SwitchButton.prototype.options = function() {
    return switchButtonAssign({}, this._options);
  };

  SwitchButton.prototype.setOptions = function(options) {
    switchButtonAssign(this._options, options || {});
    this._normalizeOptions();
    return this._applyOptions(false);
  };

  SwitchButton.prototype.getValue = function() {
    return this.hostElement.value;
  };

  SwitchButton.prototype.setValue = function(value) {
    this._options.value = value;
    if (value == null) this.hostElement.removeAttribute('value');
    else this.hostElement.value = String(value);
    return this;
  };

  SwitchButton.prototype.isChecked = function() {
    return this._options.checked;
  };

  SwitchButton.prototype.check = function() {
    return this._setChecked(true, false);
  };

  SwitchButton.prototype.uncheck = function() {
    return this._setChecked(false, false);
  };

  SwitchButton.prototype.clear = function() {
    return this.uncheck();
  };

  SwitchButton.prototype.reset = function() {
    this.setValue(this._initialValue);
    return this._setChecked(this._initialChecked, false);
  };

  SwitchButton.prototype.disable = function() {
    this._options.disabled = true;
    this.hostElement.disabled = true;
    this.wrapper.classList.add('fui-switchbutton-disabled');
    return this;
  };

  SwitchButton.prototype.enable = function() {
    this._options.disabled = false;
    this.hostElement.disabled = false;
    this.wrapper.classList.remove('fui-switchbutton-disabled');
    return this;
  };

  SwitchButton.prototype.readonly = function(mode) {
    this._options.readonly = mode == null ? true : Boolean(mode);
    this.hostElement.readOnly = this._options.readonly;
    this.hostElement.setAttribute('aria-readonly', String(this._options.readonly));
    this.wrapper.classList.toggle('fui-switchbutton-readonly', this._options.readonly);
    return this;
  };

  SwitchButton.prototype.resize = function(width, height) {
    if (width && typeof width === 'object') {
      if (width.width != null) this._options.width = width.width;
      if (width.height != null) this._options.height = width.height;
      if (width.handleWidth != null) this._options.handleWidth = width.handleWidth;
    } else {
      if (width != null) this._options.width = width;
      if (height != null) this._options.height = height;
    }
    this._normalizeOptions();
    this._layout();
    return this;
  };

  SwitchButton.prototype.setLabel = function(label) {
    this._options.label = label;
    return this._applyOptions(false);
  };

  SwitchButton.prototype.setLocale = function(locale, messages) {
    if (locale && messages) {
      localePacks[String(locale)] = switchButtonAssign({}, localePacks.en, messages);
    }
    this._options.locale = normalizeSwitchButtonLocale(locale);
    this.hostElement.setAttribute(
      'aria-label',
      this._options.ariaLabel || this._options.label || this._text('switchbutton')
    );
    return this;
  };

  SwitchButton.prototype.setTheme = function(theme) {
    var index;
    this._options.theme = theme == null ? 'inherit' : theme;
    this.theme = this._options.theme === 'inherit' ?
      findSwitchButtonTheme(this._themeSource) :
      normalizeSwitchButtonTheme(this._options.theme);
    for (index = 0; index < SWITCHBUTTON_THEMES.length; index += 1) {
      this.wrapper.classList.remove('fg-theme-' + SWITCHBUTTON_THEMES[index]);
    }
    this.wrapper.classList.add('fg-theme-' + this.theme);
    return this;
  };

  SwitchButton.prototype.destroy = function() {
    var parent;
    if (this._destroyed) return;
    this._destroyed = true;
    this.removeEventListener();
    parent = this.wrapper.parentNode;
    if (parent) {
      parent.insertBefore(this.hostElement, this.wrapper);
      parent.removeChild(this.wrapper);
    }
    restoreSwitchButtonAttribute(this.hostElement, 'class', this._original.className);
    restoreSwitchButtonAttribute(this.hostElement, 'style', this._original.style);
    restoreSwitchButtonAttribute(this.hostElement, 'id', this._original.id);
    restoreSwitchButtonAttribute(this.hostElement, 'value', this._original.value);
    restoreSwitchButtonAttribute(
      this.hostElement,
      'checked',
      this._original.checkedAttribute
    );
    restoreSwitchButtonAttribute(
      this.hostElement,
      'disabled',
      this._original.disabledAttribute
    );
    restoreSwitchButtonAttribute(
      this.hostElement,
      'readonly',
      this._original.readonlyAttribute
    );
    restoreSwitchButtonAttribute(this.hostElement, 'aria-label', this._original.ariaLabel);
    restoreSwitchButtonAttribute(
      this.hostElement,
      'aria-readonly',
      this._original.ariaReadonly
    );
    restoreSwitchButtonAttribute(this.hostElement, 'tabindex', this._original.tabIndex);
    this.hostElement.checked = this._original.checked;
    this.hostElement.disabled = this._original.disabled;
    this.hostElement.readOnly = this._original.readOnly;
    unregisterControl(this.hostElement, this);
    delete this.hostElement.__fabuiSwitchButton;
    this._listeners = {};
    this.wrapper = null;
    this.control = null;
    this.inner = null;
    this.onElement = null;
    this.offElement = null;
    this.handleElement = null;
    this.labelElement = null;
  };

  SwitchButton.prototype.dispose = SwitchButton.prototype.destroy;
  SwitchButton.defaults = defaults;
  SwitchButton.locales = localePacks;
  SwitchButton.themes = SWITCHBUTTON_THEMES.slice();
  SwitchButton.addLocale = function(name, messages) {
    if (name && messages) {
      localePacks[String(name)] = switchButtonAssign({}, localePacks.en, messages);
    }
    return SwitchButton;
  };
  SwitchButton.getControl = function(element) {
    element = resolveSwitchButtonElement(element);
    return element && element.__fabuiSwitchButton ?
      element.__fabuiSwitchButton :
      null;
  };
  SwitchButton.normalizeTheme = normalizeSwitchButtonTheme;
  SwitchButton.normalizeLocale = normalizeSwitchButtonLocale;
  return SwitchButton;
}
