var FORM_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];

function formAssign(target) {
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

function resolveFormElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function formBoolean(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    value = value.trim().toLowerCase();
    if (value === 'false' || value === '0' || value === 'no') return false;
    if (value === 'true' || value === '1' || value === 'yes' || value === '') return true;
  }
  return Boolean(value);
}

export function normalizeFormTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return FORM_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

function findFormTheme(element) {
  var current = resolveFormElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < FORM_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + FORM_THEMES[index])) {
        return FORM_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

export function normalizeFormLocale(value) {
  value = String(value || 'en').trim().replace(/_/g, '-').toLowerCase();
  if (/^zh-(?:tw|hant)(?:-|$)/.test(value)) {
    return 'zh-TW';
  }
  if (/^zh-(?:cn|hans)(?:-|$)/.test(value) || value === 'zh') {
    return 'zh-CN';
  }
  return 'en';
}

function formatFormMessage(message, values) {
  return String(message || '').replace(/\{([^}]+)\}/g, function(match, key) {
    return Object.prototype.hasOwnProperty.call(values || {}, key) ?
      String(values[key]) :
      match;
  });
}

function formArray(value) {
  return Array.isArray(value) ? value.slice() : [value];
}

function formValueKey(value) {
  return String(value == null ? '' : value);
}

function formValuesEqual(left, right) {
  return JSON.stringify(left || []) === JSON.stringify(right || []);
}

function formFileSignature(file) {
  if (!file) return '';
  return [
    file.name || '',
    file.size == null ? '' : file.size,
    file.type || '',
    file.lastModified == null ? '' : file.lastModified
  ].join(':');
}

function fieldState(field) {
  var type = String(field.type || '').toLowerCase();
  var files;
  var values;
  if (type === 'checkbox' || type === 'radio') {
    return (field.checked ? 'checked:' : 'unchecked:') + formValueKey(field.value);
  }
  if (type === 'file') {
    files = Array.prototype.slice.call(field.files || []);
    return 'files:' + files.map(formFileSignature).join('|');
  }
  if (field.tagName === 'SELECT' && field.multiple) {
    values = Array.prototype.filter.call(field.options || [], function(option) {
      return option.selected;
    }).map(function(option) {
      return option.value;
    });
    return 'values:' + JSON.stringify(values);
  }
  return 'value:' + formValueKey(field.value);
}

function captureFormState(form) {
  var snapshot = Object.create(null);
  Array.prototype.forEach.call(form.elements || [], function(field) {
    var name = field.name;
    if (!name) return;
    if (!snapshot[name]) snapshot[name] = [];
    snapshot[name].push(fieldState(field));
  });
  return snapshot;
}

function queryValue(value) {
  if (value == null) return '';
  if (typeof File !== 'undefined' && value instanceof File) return value.name;
  return String(value);
}

export function appendFormQuery(url, params) {
  var hash = '';
  var hashIndex;
  var query = [];
  var key;
  var values;
  url = String(url || '');
  hashIndex = url.indexOf('#');
  if (hashIndex >= 0) {
    hash = url.slice(hashIndex);
    url = url.slice(0, hashIndex);
  }
  params = params || {};
  for (key in params) {
    if (!Object.prototype.hasOwnProperty.call(params, key)) continue;
    values = Array.isArray(params[key]) ? params[key] : [params[key]];
    values.forEach(function(value) {
      query.push(encodeURIComponent(key) + '=' + encodeURIComponent(queryValue(value)));
    });
  }
  if (query.length) url += (url.indexOf('?') >= 0 ? '&' : '?') + query.join('&');
  return url + hash;
}

export function normalizeFormMethod(value) {
  value = String(value || 'GET').trim().toUpperCase();
  return /^[A-Z]+$/.test(value) ? value : 'GET';
}

function formDataToQuery(data) {
  var params = Object.create(null);
  data.forEach(function(value, key) {
    if (!Object.prototype.hasOwnProperty.call(params, key)) {
      params[key] = value;
    } else if (Array.isArray(params[key])) {
      params[key].push(value);
    } else {
      params[key] = [params[key], value];
    }
  });
  return params;
}

function readNamedFormData(form) {
  var result = {};
  var data = new FormData(form);
  data.forEach(function(value, key) {
    if (!Object.prototype.hasOwnProperty.call(result, key)) {
      result[key] = value;
    } else if (Array.isArray(result[key])) {
      result[key].push(value);
    } else {
      result[key] = [result[key], value];
    }
  });
  return result;
}

export function createFormFactory(Control, registerControl, unregisterControl, EditBox) {
  'use strict';

  var defaults = {
    novalidate: false,
    iframe: true,
    ajax: true,
    dirty: false,
    queryParams: {},
    url: null,
    locale: 'en',
    theme: 'inherit',
    onSubmit: null,
    onProgress: null,
    success: null,
    onBeforeLoad: null,
    onLoadSuccess: null,
    onLoadError: null,
    onChange: null
  };
  var localePacks = {
    en: {
      valueMissing: 'This field is required.',
      typeMismatchEmail: 'Please enter a valid email address.',
      typeMismatchURL: 'Please enter a valid URL.',
      patternMismatch: 'Please match the requested format.',
      tooShort: 'Please enter at least {minLength} characters.',
      tooLong: 'Please enter no more than {maxLength} characters.',
      rangeUnderflow: 'Please enter a value greater than or equal to {min}.',
      rangeOverflow: 'Please enter a value less than or equal to {max}.',
      stepMismatch: 'Please enter a valid value.',
      badInput: 'Please enter a valid value.',
      invalid: 'Please enter a valid value.'
    },
    'zh-TW': {
      valueMissing: '此欄位為必填。',
      typeMismatchEmail: '請輸入有效的電子郵件地址。',
      typeMismatchURL: '請輸入有效的網址。',
      patternMismatch: '請依照要求的格式輸入。',
      tooShort: '請至少輸入 {minLength} 個字元。',
      tooLong: '請勿超過 {maxLength} 個字元。',
      rangeUnderflow: '請輸入大於或等於 {min} 的值。',
      rangeOverflow: '請輸入小於或等於 {max} 的值。',
      stepMismatch: '請輸入有效值。',
      badInput: '請輸入有效值。',
      invalid: '請輸入有效值。'
    },
    'zh-CN': {
      valueMissing: '此字段为必填项。',
      typeMismatchEmail: '请输入有效的电子邮件地址。',
      typeMismatchURL: '请输入有效的网址。',
      patternMismatch: '请按照要求的格式输入。',
      tooShort: '请至少输入 {minLength} 个字符。',
      tooLong: '请勿超过 {maxLength} 个字符。',
      rangeUnderflow: '请输入大于或等于 {min} 的值。',
      rangeOverflow: '请输入小于或等于 {max} 的值。',
      stepMismatch: '请输入有效值。',
      badInput: '请输入有效值。',
      invalid: '请输入有效值。'
    }
  };

  function Form(element, options) {
    var host = resolveFormElement(element);
    if (!(this instanceof Form)) return new Form(element, options);
    if (!host || host.tagName !== 'FORM') {
      throw new Error('fabui.Form requires a form element.');
    }
    if (host.__fabuiForm) return host.__fabuiForm;
    Control.call(this);
    this.hostElement = host;
    this._themeSource = host.parentElement || host;
    this._listeners = {};
    this._destroyed = false;
    this._suspendChange = false;
    this._requests = [];
    this._validationState = [];
    this._validationTip = null;
    this._validationTipContent = null;
    this._validationTipTarget = null;
    this._validationTipAriaDescribedBy = null;
    this._validationTipEvents = null;
    this._controlBindings = [];
    this._original = {
      className: host.getAttribute('class'),
      noValidateAttribute: host.getAttribute('novalidate'),
      noValidate: host.noValidate
    };
    this._options = formAssign({}, defaults, this._readElementOptions(), options || {});
    this._normalizeOptions();
    this._applyOptions();
    this._bind();
    this._bindControlChanges();
    this._initialSnapshot = captureFormState(host);
    this._dirtySnapshot = captureFormState(host);
    host.__fabuiForm = this;
    registerControl(host, this);
  }

  Form.prototype = Object.create(Control.prototype);
  Form.prototype.constructor = Form;

  Form.prototype._readElementOptions = function() {
    var host = this.hostElement;
    var result = {};
    var value = host.getAttribute('data-url');
    if (value != null) result.url = value;
    value = host.getAttribute('data-ajax');
    if (value != null) result.ajax = value;
    value = host.getAttribute('data-dirty');
    if (value != null) result.dirty = value;
    value = host.getAttribute('data-novalidate');
    if (value != null) result.novalidate = value;
    value = host.getAttribute('data-iframe');
    if (value != null) result.iframe = value;
    value = host.getAttribute('data-locale');
    if (value != null) result.locale = value;
    value = host.getAttribute('data-theme');
    if (value != null) result.theme = value;
    return result;
  };

  Form.prototype._normalizeOptions = function() {
    this._options.novalidate = formBoolean(this._options.novalidate, false);
    this._options.iframe = formBoolean(this._options.iframe, true);
    this._options.ajax = formBoolean(this._options.ajax, true);
    this._options.dirty = formBoolean(this._options.dirty, false);
    this._options.queryParams = formAssign({}, this._options.queryParams || {});
    this._options.url = this._options.url == null ? null : String(this._options.url);
    this._options.locale = normalizeFormLocale(this._options.locale);
    this._options.theme = this._options.theme == null ? 'inherit' : String(this._options.theme);
  };

  Form.prototype._validationMessage = function(field) {
    var validity = field && field.validity;
    var pack = localePacks[this._options.locale] || localePacks.en;
    var key = 'invalid';
    var type = String(field && field.type || '').toLowerCase();
    if (!validity) return pack.invalid;
    if (validity.customError && field.validationMessage) return field.validationMessage;
    if (validity.valueMissing) key = 'valueMissing';
    else if (validity.typeMismatch && type === 'email') key = 'typeMismatchEmail';
    else if (validity.typeMismatch && type === 'url') key = 'typeMismatchURL';
    else if (validity.patternMismatch) key = 'patternMismatch';
    else if (validity.tooShort) key = 'tooShort';
    else if (validity.tooLong) key = 'tooLong';
    else if (validity.rangeUnderflow) key = 'rangeUnderflow';
    else if (validity.rangeOverflow) key = 'rangeOverflow';
    else if (validity.stepMismatch) key = 'stepMismatch';
    else if (validity.badInput) key = 'badInput';
    return formatFormMessage(pack[key] || localePacks.en[key], {
      minLength: field.minLength,
      maxLength: field.maxLength,
      min: field.min,
      max: field.max
    });
  };

  Form.prototype._applyOptions = function() {
    this.hostElement.classList.add('fui-form');
    this.hostElement.noValidate = true;
    this.hostElement.setAttribute('novalidate', '');
    this.hostElement.classList.toggle(
      'fui-form-validation-disabled',
      this._options.novalidate
    );
    this.setTheme(this._options.theme);
    return this;
  };

  Form.prototype._bind = function() {
    var self = this;
    this.addEventListener(this.hostElement, 'submit', function(event) {
      event.preventDefault();
      self.submit({
        originalEvent: event,
        submitter: event.submitter || null
      }).catch(function() {
        return false;
      });
    });
    this.addEventListener(this.hostElement, 'change', function(event) {
      if (self._suspendChange || !event.target || !event.target.name) return;
      self._clearValidationTarget(event.target);
      self._notifyChange(event.target, event);
    });
    this.addEventListener(this.hostElement, 'input', function(event) {
      var record = self._findValidationRecord(event.target);
      if (!record || typeof record.target.checkValidity !== 'function') return;
      if (record.target.checkValidity()) {
        self._clearValidationTarget(record.target);
      } else if (self._validationTipTarget === record.target) {
        self._showValidationTip(record.target);
      }
    });
    this.addEventListener(this.hostElement, 'focusin', function(event) {
      self._showValidationTip(event.target);
    });
    this.addEventListener(this.hostElement, 'mouseover', function(event) {
      self._showValidationTip(event.target);
    });
  };

  Form.prototype._bindControlChanges = function() {
    var self = this;
    var instances = [];
    Array.prototype.forEach.call(this.hostElement.elements || [], function(field) {
      var editBox = self._getEditBox(field);
      var listener;
      if (!editBox || instances.indexOf(editBox) >= 0 || typeof editBox.on !== 'function') {
        return;
      }
      instances.push(editBox);
      listener = function(detail) {
        if (self._suspendChange) return;
        self._clearValidationTarget(field);
        self._notifyChange(field, detail && detail.originalEvent || null);
      };
      editBox.on('change', listener);
      self._controlBindings.push({
        control: editBox,
        listener: listener
      });
    });
  };

  Form.prototype._invoke = function(name) {
    var handler = this._options[name];
    return typeof handler === 'function' ?
      handler.apply(this, Array.prototype.slice.call(arguments, 1)) :
      undefined;
  };

  Form.prototype._emit = function(type, detail, cancelable) {
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

  Form.prototype.on = function(type, listener) {
    if (type && typeof listener === 'function') {
      (this._listeners[String(type)] || (this._listeners[String(type)] = [])).push(listener);
    }
    return this;
  };

  Form.prototype.off = function(type, listener) {
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

  Form.prototype._notifyChange = function(target, originalEvent) {
    this._invoke('onChange', target);
    this._emit('change', {
      target: target,
      name: target.name || '',
      value: target.value,
      originalEvent: originalEvent || null
    });
  };

  Form.prototype.options = function() {
    var result = formAssign({}, this._options);
    result.queryParams = formAssign({}, this._options.queryParams);
    return result;
  };

  Form.prototype.setOptions = function(options) {
    formAssign(this._options, options || {});
    this._normalizeOptions();
    this._applyOptions();
    if (this._validationTipTarget) this._showValidationTip(this._validationTipTarget);
    this._emit('refresh', { options: this.options() });
    return this;
  };

  Form.prototype.getData = function() {
    return readNamedFormData(this.hostElement);
  };

  Form.prototype._getEditBox = function(field) {
    return EditBox && typeof EditBox.getControl === 'function' ?
      EditBox.getControl(field) :
      null;
  };

  Form.prototype._getControl = function(field) {
    return Control && typeof Control.getControl === 'function' ?
      Control.getControl(field) :
      null;
  };

  Form.prototype._fieldValidationTarget = function(field) {
    var editBox = this._getEditBox(field);
    var control;
    if (editBox && typeof editBox.textbox === 'function') return editBox.textbox();
    control = this._getControl(field);
    if (control && typeof control.textbox === 'function') return control.textbox();
    return field;
  };

  Form.prototype._validationContainer = function(target) {
    if (!target || typeof target.closest !== 'function') return target;
    return target.closest(
      '.fui-textbox, .fui-filebox-control, .fui-checkbox-control, .fui-checkgroup, ' +
      '.fui-radiobutton-control, .fui-radiogroup'
    ) || target;
  };

  Form.prototype._findValidationRecord = function(target) {
    var index;
    for (index = 0; index < this._validationState.length; index += 1) {
      if (
        this._validationState[index].target === target ||
        this._validationState[index].container === target
      ) {
        return this._validationState[index];
      }
    }
    return null;
  };

  Form.prototype._ensureValidationTip = function() {
    var tip;
    var content;
    if (this._validationTip) return this._validationTip;
    tip = document.createElement('div');
    content = document.createElement('div');
    tip.id = 'fui-form-validation-tip-' + Form._nextValidationTipId;
    Form._nextValidationTipId += 1;
    tip.className = 'fui-form-validation-tip';
    this._applyThemeClass(tip);
    tip.setAttribute('role', 'tooltip');
    tip.hidden = true;
    content.className = 'fui-form-validation-tip-content';
    tip.appendChild(content);
    document.body.appendChild(tip);
    this._validationTip = tip;
    this._validationTipContent = content;
    return tip;
  };

  Form.prototype._positionValidationTip = function() {
    var tip = this._validationTip;
    var target = this._validationTipTarget;
    var targetRect;
    var tipRect;
    var pageLeft;
    var pageTop;
    var viewportRight;
    var viewportBottom;
    var left;
    var top;
    var gap = 8;
    if (!tip || tip.hidden || !target || !target.isConnected) return;
    targetRect = target.getBoundingClientRect();
    tipRect = tip.getBoundingClientRect();
    pageLeft = window.pageXOffset || document.documentElement.scrollLeft || 0;
    pageTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    viewportRight = pageLeft + document.documentElement.clientWidth;
    viewportBottom = pageTop + document.documentElement.clientHeight;
    left = targetRect.left + pageLeft + (targetRect.width - tipRect.width) / 2;
    top = targetRect.bottom + pageTop + gap;
    tip.classList.remove('fui-form-validation-tip-top');
    if (top + tipRect.height > viewportBottom) {
      top = targetRect.top + pageTop - tipRect.height - gap;
      tip.classList.add('fui-form-validation-tip-top');
    }
    left = Math.max(pageLeft + 4, Math.min(left, viewportRight - tipRect.width - 4));
    top = Math.max(pageTop + 4, top);
    tip.style.left = Math.round(left) + 'px';
    tip.style.top = Math.round(top) + 'px';
  };

  Form.prototype._bindValidationTipEvents = function() {
    var self = this;
    if (this._validationTipEvents) return;
    this._validationTipEvents = {
      pointerdown: function(event) {
        var record = self._findValidationRecord(self._validationTipTarget);
        var container = record && record.container;
        if (
          (self._validationTip && self._validationTip.contains(event.target)) ||
          (
            self._validationTipTarget &&
            self._validationTipTarget.contains(event.target)
          ) ||
          (container && container.contains(event.target))
        ) {
          return;
        }
        self._hideValidationTip();
      },
      keydown: function(event) {
        if (event.key === 'Escape') self._hideValidationTip();
      },
      viewport: function() {
        self._positionValidationTip();
      }
    };
    this.addEventListener(
      document,
      'pointerdown',
      this._validationTipEvents.pointerdown,
      true
    );
    this.addEventListener(document, 'keydown', this._validationTipEvents.keydown);
    this.addEventListener(window, 'resize', this._validationTipEvents.viewport);
    this.addEventListener(window, 'scroll', this._validationTipEvents.viewport, true);
  };

  Form.prototype._unbindValidationTipEvents = function() {
    if (!this._validationTipEvents) return;
    this.removeEventListener(
      document,
      'pointerdown',
      this._validationTipEvents.pointerdown,
      true
    );
    this.removeEventListener(document, 'keydown', this._validationTipEvents.keydown);
    this.removeEventListener(window, 'resize', this._validationTipEvents.viewport);
    this.removeEventListener(window, 'scroll', this._validationTipEvents.viewport, true);
    this._validationTipEvents = null;
  };

  Form.prototype._showValidationTip = function(target) {
    var record = this._findValidationRecord(target);
    var tip;
    var message;
    if (!record || this._options.novalidate) return;
    target = record.target;
    message = this._validationMessage(record.field || target);
    if (!message) return;
    if (this._validationTipTarget && this._validationTipTarget !== target) {
      this._hideValidationTip();
    }
    tip = this._ensureValidationTip();
    this._validationTipTarget = target;
    this._validationTipAriaDescribedBy = record.ariaDescribedBy;
    this._validationTipContent.textContent = message;
    target.setAttribute(
      'aria-describedby',
      [record.ariaDescribedBy, tip.id].filter(Boolean).join(' ')
    );
    tip.hidden = false;
    tip.style.visibility = 'hidden';
    this._positionValidationTip();
    tip.style.visibility = '';
    this._bindValidationTipEvents();
  };

  Form.prototype._hideValidationTip = function() {
    if (this._validationTipTarget) {
      if (this._validationTipAriaDescribedBy == null) {
        this._validationTipTarget.removeAttribute('aria-describedby');
      } else {
        this._validationTipTarget.setAttribute(
          'aria-describedby',
          this._validationTipAriaDescribedBy
        );
      }
    }
    if (this._validationTip) this._validationTip.hidden = true;
    this._validationTipTarget = null;
    this._validationTipAriaDescribedBy = null;
    this._unbindValidationTipEvents();
  };

  Form.prototype._markInvalid = function(target, field) {
    var container = this._validationContainer(target);
    var record = this._validationState.find(function(item) {
      return item.target === target;
    });
    if (record) return;
    record = {
      target: target,
      field: field || target,
      container: container,
      ariaInvalid: target.getAttribute('aria-invalid'),
      ariaDescribedBy: target.getAttribute('aria-describedby'),
      message: this._validationMessage(field || target)
    };
    this._validationState.push(record);
    target.setAttribute('aria-invalid', 'true');
    target.classList.add('fui-form-invalid');
    if (container && container !== target) {
      container.classList.add('fui-form-invalid-control');
    }
  };

  Form.prototype._clearValidationTarget = function(field) {
    var target = this._fieldValidationTarget(field);
    var index;
    var record;
    for (index = this._validationState.length - 1; index >= 0; index -= 1) {
      record = this._validationState[index];
      if (
        record.target !== target &&
        record.target !== field &&
        record.field !== target &&
        record.field !== field
      ) {
        continue;
      }
      if (this._validationTipTarget === record.target) this._hideValidationTip();
      record.target.classList.remove('fui-form-invalid');
      if (record.container) record.container.classList.remove('fui-form-invalid-control');
      if (record.ariaInvalid == null) record.target.removeAttribute('aria-invalid');
      else record.target.setAttribute('aria-invalid', record.ariaInvalid);
      if (record.ariaDescribedBy == null) record.target.removeAttribute('aria-describedby');
      else record.target.setAttribute('aria-describedby', record.ariaDescribedBy);
      this._validationState.splice(index, 1);
    }
  };

  Form.prototype.validate = function() {
    var firstInvalid = null;
    var valid = true;
    var seen = [];
    var self = this;
    this.resetValidation();
    if (this._options.novalidate) return true;
    Array.prototype.forEach.call(this.hostElement.elements || [], function(field) {
      var target = self._fieldValidationTarget(field);
      if (!target || seen.indexOf(target) >= 0 || field.disabled) return;
      seen.push(target);
      if (field.willValidate === false || typeof field.checkValidity !== 'function') return;
      if (!field.checkValidity()) {
        valid = false;
        if (!firstInvalid) firstInvalid = target;
        self._markInvalid(target, field);
      }
    });
    this.hostElement.classList.toggle('fui-form-valid', valid);
    this.hostElement.classList.toggle('fui-form-has-invalid', !valid);
    if (firstInvalid) this._showValidationTip(firstInvalid);
    this._emit('validate', { valid: valid, firstInvalid: firstInvalid });
    return valid;
  };

  Form.prototype.enableValidation = function() {
    this._options.novalidate = false;
    this._applyOptions();
    return this;
  };

  Form.prototype.disableValidation = function() {
    this._options.novalidate = true;
    this.resetValidation();
    this._applyOptions();
    return this;
  };

  Form.prototype.setLocale = function(locale) {
    this._options.locale = normalizeFormLocale(locale);
    if (this._validationTipTarget) this._showValidationTip(this._validationTipTarget);
    this._emit('refresh', { options: this.options() });
    return this;
  };

  Form.prototype._applyThemeClass = function(element) {
    var index;
    if (!element || !element.classList) return;
    for (index = 0; index < FORM_THEMES.length; index += 1) {
      element.classList.remove('fg-theme-' + FORM_THEMES[index]);
    }
    element.classList.add('fg-theme-' + this.theme);
  };

  Form.prototype.setTheme = function(theme) {
    this._options.theme = theme == null ? 'inherit' : String(theme);
    this.theme = this._options.theme === 'inherit' ?
      findFormTheme(this._themeSource) :
      normalizeFormTheme(this._options.theme);
    this._applyThemeClass(this.hostElement);
    this._applyThemeClass(this._validationTip);
    return this;
  };

  Form.prototype.resetValidation = function() {
    var record;
    this._hideValidationTip();
    while (this._validationState.length) {
      record = this._validationState.pop();
      record.target.classList.remove('fui-form-invalid');
      if (record.container) record.container.classList.remove('fui-form-invalid-control');
      if (record.ariaInvalid == null) record.target.removeAttribute('aria-invalid');
      else record.target.setAttribute('aria-invalid', record.ariaInvalid);
      if (record.ariaDescribedBy == null) record.target.removeAttribute('aria-describedby');
      else record.target.setAttribute('aria-describedby', record.ariaDescribedBy);
    }
    this.hostElement.classList.remove('fui-form-valid', 'fui-form-has-invalid');
    return this;
  };

  Form.prototype.isDirty = function(name) {
    var current = captureFormState(this.hostElement);
    var keys;
    var index;
    if (name != null) {
      name = String(name);
      return !formValuesEqual(current[name], this._dirtySnapshot[name]);
    }
    keys = Object.keys(formAssign({}, this._dirtySnapshot, current));
    for (index = 0; index < keys.length; index += 1) {
      if (!formValuesEqual(current[keys[index]], this._dirtySnapshot[keys[index]])) {
        return true;
      }
    }
    return false;
  };

  Form.prototype.resetDirty = function() {
    this._dirtySnapshot = captureFormState(this.hostElement);
    this._emit('dirtyreset', { snapshot: this._dirtySnapshot });
    return this;
  };

  Form.prototype._appendSubmitFields = function(data, dirtyOnly) {
    var current = new FormData(this.hostElement);
    var self = this;
    current.forEach(function(value, key) {
      if (!dirtyOnly || self.isDirty(key)) data.append(key, value);
    });
  };

  Form.prototype._createSubmitData = function(params, dirtyOnly, submitter) {
    var data = new FormData();
    var key;
    var values;
    this._appendSubmitFields(data, dirtyOnly);
    if (submitter && submitter.name && !submitter.disabled) {
      data.append(submitter.name, submitter.value == null ? '' : submitter.value);
    }
    for (key in params) {
      if (!Object.prototype.hasOwnProperty.call(params, key)) continue;
      values = formArray(params[key]);
      values.forEach(function(value) {
        data.append(key, value == null ? '' : value);
      });
    }
    return data;
  };

  Form.prototype._removeRequest = function(xhr) {
    var index = this._requests.indexOf(xhr);
    if (index >= 0) this._requests.splice(index, 1);
  };

  Form.prototype._sendAjax = function(url, method, data, submitOptions) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      var requestBody = data;
      var progressHandler = submitOptions.onProgress || self._options.onProgress;
      if (method === 'GET' || method === 'HEAD') {
        url = appendFormQuery(url, formDataToQuery(data));
        requestBody = null;
      }
      xhr.open(method, url, true);
      self._requests.push(xhr);
      if (!formBoolean(submitOptions.iframe, true) && xhr.upload) {
        xhr.upload.addEventListener('progress', function(event) {
          var percent = event.lengthComputable ?
            Math.round((event.loaded / event.total) * 100) :
            0;
          if (typeof progressHandler === 'function') progressHandler.call(self, percent);
          self._emit('progress', { percent: percent, originalEvent: event });
        });
      }
      xhr.addEventListener('load', function() {
        var callback = submitOptions.success || self._options.success;
        self._removeRequest(xhr);
        if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
          self.resetDirty();
          if (typeof callback === 'function') callback.call(self, xhr.responseText);
          self._emit('success', {
            data: xhr.responseText,
            status: xhr.status,
            xhr: xhr
          });
          resolve(xhr.responseText);
          return;
        }
        self._emit('submiterror', { status: xhr.status, xhr: xhr });
        reject(new Error('fabui.Form submit failed with status ' + xhr.status + '.'));
      });
      xhr.addEventListener('error', function() {
        self._removeRequest(xhr);
        self._emit('submiterror', { status: xhr.status, xhr: xhr });
        reject(new Error('fabui.Form submit request failed.'));
      });
      xhr.addEventListener('abort', function() {
        self._removeRequest(xhr);
        reject(new Error('fabui.Form submit request was aborted.'));
      });
      xhr.send(requestBody);
    });
  };

  Form.prototype._submitNative = function(url, method, params) {
    var form = this.hostElement;
    var originalAction = form.getAttribute('action');
    var originalMethod = form.getAttribute('method');
    var fields = [];
    var key;
    var values;
    if (url) form.setAttribute('action', url);
    form.setAttribute('method', method);
    for (key in params) {
      if (!Object.prototype.hasOwnProperty.call(params, key)) continue;
      values = formArray(params[key]);
      values.forEach(function(value) {
        var field = document.createElement('input');
        field.type = 'hidden';
        field.name = key;
        field.value = value == null ? '' : String(value);
        field.setAttribute('data-fui-form-param', '');
        form.appendChild(field);
        fields.push(field);
      });
    }
    HTMLFormElement.prototype.submit.call(form);
    fields.forEach(function(field) {
      if (field.parentNode) field.parentNode.removeChild(field);
    });
    if (originalAction == null) form.removeAttribute('action');
    else form.setAttribute('action', originalAction);
    if (originalMethod == null) form.removeAttribute('method');
    else form.setAttribute('method', originalMethod);
  };

  Form.prototype.submit = function(options) {
    var submitOptions = formAssign({}, this._options, options || {});
    var params = formAssign(
      {},
      this._options.queryParams || {},
      options && options.queryParams || {}
    );
    var callback = options && typeof options.onSubmit === 'function' ?
      options.onSubmit :
      this._options.onSubmit;
    var url = submitOptions.url || this.hostElement.getAttribute('action') || '';
    var method = normalizeFormMethod(
      submitOptions.method || this.hostElement.getAttribute('method') || 'GET'
    );
    var data;
    submitOptions.novalidate = formBoolean(submitOptions.novalidate, false);
    submitOptions.iframe = formBoolean(submitOptions.iframe, true);
    submitOptions.ajax = formBoolean(submitOptions.ajax, true);
    submitOptions.dirty = formBoolean(submitOptions.dirty, false);
    if (!submitOptions.novalidate && !this.validate()) {
      this._emit('submitcancel', { reason: 'validation', params: params });
      return Promise.resolve(false);
    }
    if (typeof callback === 'function' && callback.call(this, params) === false) {
      this._emit('submitcancel', { reason: 'callback', params: params });
      return Promise.resolve(false);
    }
    if (!this._emit('beforesubmit', { params: params, options: submitOptions }, true)) {
      return Promise.resolve(false);
    }
    if (!submitOptions.ajax) {
      this._submitNative(url, method, params);
      return Promise.resolve(true);
    }
    data = this._createSubmitData(
      params,
      submitOptions.dirty,
      submitOptions.submitter || null
    );
    return this._sendAjax(url, method, data, submitOptions);
  };

  Form.prototype._fieldsByName = function(name) {
    return Array.prototype.filter.call(this.hostElement.elements || [], function(field) {
      return field.name === name;
    });
  };

  Form.prototype._setFieldValue = function(field, value, index, count) {
    var editBox = this._getEditBox(field);
    var control = this._getControl(field);
    var values = formArray(value);
    var type = String(field.type || '').toLowerCase();
    var match;
    if (type === 'radio') {
      field.checked = values.some(function(item) {
        return formValueKey(item) === formValueKey(field.value);
      });
      if (control && typeof control.check === 'function' && typeof control.uncheck === 'function') {
        if (field.checked) control.check();
        else control.uncheck();
      }
      return;
    }
    if (type === 'checkbox') {
      match = count === 1 && typeof value === 'boolean' ?
        value :
        values.some(function(item) {
          return formValueKey(item) === formValueKey(field.value);
        });
      field.checked = Boolean(match);
      if (control && typeof control.check === 'function' && typeof control.uncheck === 'function') {
        if (field.checked) control.check();
        else control.uncheck();
      }
      return;
    }
    if (type === 'file') {
      if (value == null || value === '' || Array.isArray(value) && !value.length) {
        if (control && typeof control.clear === 'function') control.clear();
        else field.value = '';
      }
      return;
    }
    if (field.tagName === 'SELECT' && field.multiple) {
      Array.prototype.forEach.call(field.options || [], function(option) {
        option.selected = values.some(function(item) {
          return formValueKey(item) === formValueKey(option.value);
        });
      });
      if (editBox && typeof editBox.setValues === 'function') editBox.setValues(values, true);
      return;
    }
    if (editBox) {
      if (Array.isArray(value) && typeof editBox.setValues === 'function') {
        editBox.setValues(value, true);
      } else {
        editBox.setValue(value == null ? '' : value, true);
      }
      return;
    }
    value = Array.isArray(value) ? value[Math.min(index, value.length - 1)] : value;
    if (control && typeof control.setValue === 'function') {
      control.setValue(value == null ? '' : value);
      return;
    }
    field.value = value == null ? '' : String(value);
  };

  Form.prototype._applyData = function(data) {
    var before = captureFormState(this.hostElement);
    var self = this;
    var fields;
    var after;
    var key;
    this._suspendChange = true;
    try {
      for (key in data) {
        if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
        fields = this._fieldsByName(key);
        fields.forEach(function(field, index) {
          self._setFieldValue(field, data[key], index, fields.length);
        });
      }
    } finally {
      this._suspendChange = false;
    }
    after = captureFormState(this.hostElement);
    Object.keys(data).forEach(function(name) {
      var namedFields;
      if (formValuesEqual(before[name], after[name])) return;
      namedFields = self._fieldsByName(name);
      if (namedFields[0]) self._notifyChange(namedFields[0], null);
    });
    this.resetValidation();
    this.resetDirty();
    this._invoke('onLoadSuccess', data);
    this._emit('loadsuccess', { data: data });
    return this;
  };

  Form.prototype._loadRemote = function(url) {
    var self = this;
    var params = {};
    if (this._invoke('onBeforeLoad', params) === false ||
      !this._emit('beforeload', { params: params, url: url }, true)) {
      return Promise.resolve(false);
    }
    url = appendFormQuery(url, params);
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      self._requests.push(xhr);
      xhr.addEventListener('load', function() {
        var data;
        self._removeRequest(xhr);
        if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) {
          self._invoke('onLoadError');
          self._emit('loaderror', { status: xhr.status, xhr: xhr });
          reject(new Error('fabui.Form load failed with status ' + xhr.status + '.'));
          return;
        }
        try {
          data = JSON.parse(xhr.responseText);
        } catch (error) {
          self._invoke('onLoadError');
          self._emit('loaderror', { error: error, xhr: xhr });
          reject(error);
          return;
        }
        self._applyData(data);
        resolve(data);
      });
      xhr.addEventListener('error', function() {
        self._removeRequest(xhr);
        self._invoke('onLoadError');
        self._emit('loaderror', { status: xhr.status, xhr: xhr });
        reject(new Error('fabui.Form load request failed.'));
      });
      xhr.addEventListener('abort', function() {
        self._removeRequest(xhr);
        reject(new Error('fabui.Form load request was aborted.'));
      });
      xhr.send();
    });
  };

  Form.prototype.load = function(data) {
    if (typeof data === 'string') return this._loadRemote(data);
    if (!data || typeof data !== 'object') {
      throw new TypeError('fabui.Form load() requires an object or URL string.');
    }
    return this._applyData(data);
  };

  Form.prototype.clear = function() {
    var before = captureFormState(this.hostElement);
    var handled = [];
    var self = this;
    var after;
    this._suspendChange = true;
    try {
      Array.prototype.forEach.call(this.hostElement.elements || [], function(field) {
        var editBox;
        var control;
        var type;
        if (!field.name || handled.indexOf(field) >= 0) return;
        editBox = self._getEditBox(field);
        control = self._getControl(field);
        type = String(field.type || '').toLowerCase();
        if (editBox && typeof editBox.clear === 'function') {
          editBox.clear();
        } else if (control && typeof control.clear === 'function') {
          control.clear();
        } else if (type === 'checkbox' || type === 'radio') {
          field.checked = false;
        } else if (field.tagName === 'SELECT' && field.multiple) {
          Array.prototype.forEach.call(field.options || [], function(option) {
            option.selected = false;
          });
        } else if (!/^(button|submit|reset|image)$/i.test(type)) {
          field.value = '';
        }
        handled.push(field);
      });
    } finally {
      this._suspendChange = false;
    }
    after = captureFormState(this.hostElement);
    Object.keys(formAssign({}, before, after)).forEach(function(name) {
      var fields;
      if (formValuesEqual(before[name], after[name])) return;
      fields = self._fieldsByName(name);
      if (fields[0]) self._notifyChange(fields[0], null);
    });
    this.resetValidation();
    return this;
  };

  Form.prototype.reset = function() {
    var before = captureFormState(this.hostElement);
    var controls = [];
    var self = this;
    var after;
    this._suspendChange = true;
    try {
      this.hostElement.reset();
      Array.prototype.forEach.call(this.hostElement.elements || [], function(field) {
        var editBox = self._getEditBox(field);
        var control = self._getControl(field);
        var instance = editBox || control;
        if (!instance || controls.indexOf(instance) >= 0 || typeof instance.reset !== 'function') {
          return;
        }
        controls.push(instance);
        instance.reset();
      });
    } finally {
      this._suspendChange = false;
    }
    after = captureFormState(this.hostElement);
    Object.keys(formAssign({}, before, after)).forEach(function(name) {
      var fields;
      if (formValuesEqual(before[name], after[name])) return;
      fields = self._fieldsByName(name);
      if (fields[0]) self._notifyChange(fields[0], null);
    });
    this.resetValidation();
    this.resetDirty();
    return this;
  };

  Form.prototype.destroy = function() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._requests.slice().forEach(function(xhr) {
      xhr.abort();
    });
    this._requests = [];
    this.resetValidation();
    this._controlBindings.forEach(function(binding) {
      if (binding.control && typeof binding.control.off === 'function') {
        binding.control.off('change', binding.listener);
      }
    });
    this._controlBindings = [];
    this.removeEventListener();
    if (this._validationTip) this._validationTip.remove();
    this._validationTip = null;
    this._validationTipContent = null;
    if (this._original.className == null) this.hostElement.removeAttribute('class');
    else this.hostElement.setAttribute('class', this._original.className);
    if (this._original.noValidateAttribute == null) {
      this.hostElement.removeAttribute('novalidate');
    } else {
      this.hostElement.setAttribute('novalidate', this._original.noValidateAttribute);
    }
    this.hostElement.noValidate = this._original.noValidate;
    unregisterControl(this.hostElement, this);
    delete this.hostElement.__fabuiForm;
    this._listeners = {};
  };

  Form.prototype.dispose = Form.prototype.destroy;
  Form._nextValidationTipId = 1;
  Form.defaults = defaults;
  Form.locales = localePacks;
  Form.themes = FORM_THEMES.slice();
  Form.addLocale = function(name, messages) {
    name = normalizeFormLocale(name);
    localePacks[name] = formAssign({}, localePacks.en, messages || {});
    return Form;
  };
  Form.getControl = function(element) {
    element = resolveFormElement(element);
    return element && element.__fabuiForm ? element.__fabuiForm : null;
  };
  Form.normalizeTheme = normalizeFormTheme;
  Form.normalizeLocale = normalizeFormLocale;
  return Form;
}
