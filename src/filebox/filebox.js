var FILEBOX_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];
var fileBoxSequence = 0;

function fileBoxAssign(target) {
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

function resolveFileBoxElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function fileBoxBoolean(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    value = value.trim().toLowerCase();
    if (value === 'false' || value === '0' || value === 'no') return false;
    if (value === 'true' || value === '1' || value === 'yes' || value === '') return true;
  }
  return Boolean(value);
}

function fileBoxAttribute(element, names) {
  var index;
  var value;
  for (index = 0; index < names.length; index += 1) {
    value = element.getAttribute(names[index]);
    if (value != null) return value;
  }
  return null;
}

function restoreFileBoxAttribute(element, name, value) {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

function normalizeFileBoxLocale(value) {
  value = String(value || 'en').trim().replace(/_/g, '-');
  if (/^zh-(?:TW|Hant)(?:-|$)/i.test(value)) return 'zh-TW';
  if (/^zh-(?:CN|Hans)(?:-|$)/i.test(value) || /^zh$/i.test(value)) return 'zh-CN';
  return 'en';
}

export function normalizeFileBoxTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return FILEBOX_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

export function normalizeFileBoxButtonAlign(value) {
  return String(value || 'right').toLowerCase() === 'left' ? 'left' : 'right';
}

export function normalizeFileBoxLabelPosition(value) {
  value = String(value || 'before').toLowerCase();
  return value === 'after' || value === 'top' ? value : 'before';
}

function findFileBoxTheme(element) {
  var current = resolveFileBoxElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < FILEBOX_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + FILEBOX_THEMES[index])) {
        return FILEBOX_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

export function createFileBoxFactory(Control, registerControl, unregisterControl, EditBox) {
  'use strict';

  var defaults = {
    width: 200,
    height: 30,
    cls: '',
    prompt: '',
    label: '',
    labelWidth: 80,
    labelPosition: 'before',
    labelAlign: 'left',
    buttonText: 'Choose File',
    buttonIcon: null,
    buttonAlign: 'right',
    accept: '',
    multiple: false,
    separator: ',',
    capture: null,
    disabled: false,
    readonly: false,
    required: false,
    locale: 'en',
    theme: 'inherit',
    ariaLabel: '',
    onChange: null,
    onResize: null,
    onClickButton: null
  };
  var localePacks = {
    en: {
      chooseFile: 'Choose File',
      fileBox: 'File upload'
    },
    'zh-TW': {
      chooseFile: '選擇檔案',
      fileBox: '檔案上傳'
    },
    'zh-CN': {
      chooseFile: '选择文件',
      fileBox: '文件上传'
    }
  };

  function FileBox(element, options) {
    var host = resolveFileBoxElement(element);
    if (!(this instanceof FileBox)) return new FileBox(element, options);
    if (
      !host ||
      host.tagName !== 'INPUT' ||
      String(host.type || '').toLowerCase() !== 'file'
    ) {
      throw new Error('fabui.FileBox requires an input[type="file"] element.');
    }
    if (!host.parentNode) {
      throw new Error('fabui.FileBox input must be attached to the document.');
    }
    if (host.__fabuiFileBox) return host.__fabuiFileBox;
    if (typeof EditBox !== 'function') {
      throw new Error('fabui.FileBox requires fabui.EditBox.');
    }
    Control.call(this);
    this.hostElement = host;
    this._listeners = {};
    this._destroyed = false;
    this._customButtonText = Boolean(
      options && Object.prototype.hasOwnProperty.call(options, 'buttonText')
    );
    this._original = {
      className: host.getAttribute('class'),
      style: host.getAttribute('style'),
      id: host.getAttribute('id'),
      accept: host.getAttribute('accept'),
      multiple: host.getAttribute('multiple'),
      capture: host.getAttribute('capture'),
      disabledAttribute: host.getAttribute('disabled'),
      requiredAttribute: host.getAttribute('required'),
      ariaLabel: host.getAttribute('aria-label'),
      ariaHidden: host.getAttribute('aria-hidden'),
      tabIndex: host.getAttribute('tabindex'),
      value: host.getAttribute('value'),
      disabled: host.disabled,
      required: host.required,
      multipleProperty: host.multiple
    };
    this._themeSource = host.parentElement || document.body;
    this._options = fileBoxAssign({}, defaults, this._readElementOptions(), options || {});
    this._normalizeOptions();
    if (!this._customButtonText && this._options.locale !== 'en') {
      this._options.buttonText = this._text('chooseFile');
    }
    this._build();
    this._bind();
    this._applyOptions(true);
    this._syncFiles(true);
    host.__fabuiFileBox = this;
    registerControl(host, this);
  }

  FileBox.prototype = Object.create(Control.prototype);
  FileBox.prototype.constructor = FileBox;

  FileBox.prototype._readElementOptions = function() {
    var host = this.hostElement;
    var result = {
      accept: host.getAttribute('accept') || '',
      multiple: host.multiple,
      disabled: host.disabled,
      required: host.required,
      ariaLabel: host.getAttribute('aria-label') || ''
    };
    var value;
    value = fileBoxAttribute(host, ['data-width']);
    if (value != null) result.width = value;
    else if (host.style.width) result.width = host.style.width;
    value = fileBoxAttribute(host, ['data-height']);
    if (value != null) result.height = value;
    else if (host.style.height) result.height = host.style.height;
    value = fileBoxAttribute(host, ['prompt', 'data-prompt', 'placeholder']);
    if (value != null) result.prompt = value;
    value = fileBoxAttribute(host, ['label', 'data-label']);
    if (value != null) result.label = value;
    value = fileBoxAttribute(host, ['labelWidth', 'data-label-width']);
    if (value != null) result.labelWidth = value;
    value = fileBoxAttribute(host, ['labelPosition', 'data-label-position']);
    if (value != null) result.labelPosition = value;
    value = fileBoxAttribute(host, ['labelAlign', 'data-label-align']);
    if (value != null) result.labelAlign = value;
    value = fileBoxAttribute(host, ['buttonText', 'data-button-text']);
    if (value != null) {
      result.buttonText = value;
      this._customButtonText = true;
    }
    value = fileBoxAttribute(host, ['buttonIcon', 'data-button-icon']);
    if (value != null) result.buttonIcon = value;
    value = fileBoxAttribute(host, ['buttonAlign', 'data-button-align']);
    if (value != null) result.buttonAlign = value;
    value = fileBoxAttribute(host, ['separator', 'data-separator']);
    if (value != null) result.separator = value;
    value = fileBoxAttribute(host, ['capture', 'data-capture']);
    if (value != null) result.capture = value;
    value = fileBoxAttribute(host, ['data-readonly']);
    if (value != null) result.readonly = value;
    value = fileBoxAttribute(host, ['data-theme', 'theme']);
    if (value) result.theme = value;
    value = fileBoxAttribute(host, ['data-locale', 'locale']);
    if (value) result.locale = value;
    return result;
  };

  FileBox.prototype._normalizeOptions = function() {
    this._options.buttonAlign = normalizeFileBoxButtonAlign(this._options.buttonAlign);
    this._options.labelPosition = normalizeFileBoxLabelPosition(this._options.labelPosition);
    this._options.locale = normalizeFileBoxLocale(this._options.locale);
    this._options.multiple = fileBoxBoolean(this._options.multiple, false);
    this._options.disabled = fileBoxBoolean(this._options.disabled, false);
    this._options.readonly = fileBoxBoolean(this._options.readonly, false);
    this._options.required = fileBoxBoolean(this._options.required, false);
    this._options.separator = this._options.separator == null ? ',' : String(this._options.separator);
  };

  FileBox.prototype._text = function(key) {
    var pack = localePacks[this._options.locale] || localePacks.en;
    return pack[key] || localePacks.en[key] || key;
  };

  FileBox.prototype._build = function() {
    var parent = this.hostElement.parentNode;
    var self = this;
    if (!this.hostElement.id) {
      fileBoxSequence += 1;
      this.hostElement.id = 'fui-filebox-' + fileBoxSequence;
    }
    this.proxyElement = document.createElement('input');
    this.proxyElement.type = 'text';
    this.proxyElement.className = 'fui-filebox-proxy';
    parent.insertBefore(this.proxyElement, this.hostElement);
    this.editBox = new EditBox(this.proxyElement, {
      editor: 'text',
      width: this._options.width,
      height: this._options.height,
      cls: 'fui-filebox' + (this._options.cls ? ' ' + String(this._options.cls) : ''),
      prompt: this._options.prompt,
      label: this._options.label || '\u200b',
      labelWidth: this._options.labelWidth,
      labelPosition: this._options.labelPosition,
      labelAlign: this._options.labelAlign,
      editable: false,
      readonly: this._options.readonly,
      disabled: this._options.disabled,
      required: false,
      buttonText: this._options.buttonText,
      buttonIcon: this._options.buttonIcon || '',
      buttonAlign: this._options.buttonAlign,
      ariaLabel: this._options.ariaLabel || this._options.label || this._text('fileBox'),
      onClickButton: function() {
        self._invoke('onClickButton');
        self._emit('buttonClick', { button: self.button() });
        self._openPicker();
      },
      onResize: function(width, height) {
        self._invoke('onResize', width, height);
        self._emit('resize', { width: width, height: height });
      }
    });
    this.fieldElement = this.proxyElement.closest('.fui-textbox-field');
    this.textboxElement = this.editBox.textbox();
    this.buttonElement = this.editBox.button();
    this.labelElement = this.fieldElement.querySelector('.fui-textbox-label');
    this._appliedCustomClasses = String(this._options.cls || '').split(/\s+/).filter(Boolean);
    this.fieldElement.appendChild(this.hostElement);
    this.hostElement.classList.add('fui-filebox-native');
    this.hostElement.setAttribute('aria-hidden', 'true');
    this.hostElement.tabIndex = -1;
    this.textboxElement.setAttribute('role', 'button');
    this.textboxElement.setAttribute('aria-controls', this.hostElement.id);
    this._applyLabel();
  };

  FileBox.prototype._bind = function() {
    var self = this;
    this.addEventListener(this.hostElement, 'change', function(event) {
      self._syncFiles(false, event);
    });
    this.addEventListener(this.textboxElement, 'click', function() {
      self._openPicker();
    });
    this.addEventListener(this.textboxElement, 'keydown', function(event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      self._openPicker();
    });
    if (this.hostElement.form) {
      this.addEventListener(this.hostElement.form, 'reset', function() {
        setTimeout(function() {
          if (!self._destroyed) self._syncFiles(false);
        }, 0);
      });
    }
  };

  FileBox.prototype._openPicker = function() {
    if (this._options.disabled || this._options.readonly) return this;
    this.hostElement.click();
    return this;
  };

  FileBox.prototype._fileNames = function() {
    var fileList = this.hostElement.files;
    var names = [];
    var value;
    var index;
    if (fileList && typeof fileList.length === 'number') {
      for (index = 0; index < fileList.length; index += 1) {
        if (fileList[index]) names.push(fileList[index].name || '');
      }
    }
    if (names.length) return names.join(this._options.separator);
    value = this.hostElement.value || '';
    return value.replace(/^.*[\\/]/, '');
  };

  FileBox.prototype._syncFiles = function(silent, originalEvent) {
    var oldValue = this.editBox.getValue();
    var newValue = this._fileNames();
    this.editBox.setValue(newValue, true);
    if (!silent && newValue !== oldValue) {
      this._invoke('onChange', newValue, oldValue);
      this._emit('change', {
        value: newValue,
        oldValue: oldValue,
        files: this.files(),
        originalEvent: originalEvent || null
      });
    }
    return this;
  };

  FileBox.prototype._applyLabel = function() {
    var label = this._options.label == null ? '' : String(this._options.label);
    var position = this._options.labelPosition;
    var shell = this.fieldElement.querySelector('.fui-textbox');
    this.labelElement.textContent = label || '\u200b';
    this.labelElement.hidden = !label;
    this.labelElement.className = 'fui-textbox-label fui-textbox-label-' + position;
    this.labelElement.style.textAlign = this._options.labelAlign;
    this.labelElement.style.width = typeof this._options.labelWidth === 'number' ?
      this._options.labelWidth + 'px' :
      String(this._options.labelWidth == null ? 80 : this._options.labelWidth);
    this.fieldElement.classList.toggle('fui-textbox-label-top-field', position === 'top');
    if (position === 'after') {
      this.fieldElement.insertBefore(shell, this.labelElement);
    } else {
      this.fieldElement.insertBefore(this.labelElement, shell);
    }
  };

  FileBox.prototype._applyButton = function() {
    var button = this.buttonElement;
    var before = this.fieldElement.querySelector('.fui-textbox-addon-left');
    var after = this.fieldElement.querySelector('.fui-textbox-addon-right');
    var icon = this._options.buttonIcon || '';
    button.textContent = this._options.buttonText == null ? '' : String(this._options.buttonText);
    button.className = 'fui-textbox-button' +
      (icon ? ' ' + String(icon) : '') +
      (button.textContent && icon ?
        ' fui-textbox-button-with-icon' :
        ' fui-textbox-button-icon-only');
    if (this._options.buttonAlign === 'left') before.insertBefore(button, before.firstChild);
    else after.appendChild(button);
    button.setAttribute('aria-label', button.textContent || this._text('chooseFile'));
  };

  FileBox.prototype._applyClass = function() {
    var field = this.fieldElement;
    var next = String(this._options.cls || '').split(/\s+/).filter(Boolean);
    (this._appliedCustomClasses || []).forEach(function(className) {
      field.classList.remove(className);
    });
    next.forEach(function(className) {
      field.classList.add(className);
    });
    this._appliedCustomClasses = next;
  };

  FileBox.prototype._applyOptions = function(initial) {
    var accept = this._options.accept == null ? '' : String(this._options.accept);
    var capture = this._options.capture;
    this.hostElement.accept = accept;
    this.hostElement.multiple = this._options.multiple;
    this.hostElement.disabled = this._options.disabled;
    this.hostElement.required = this._options.required;
    if (capture == null || capture === false || capture === '') {
      this.hostElement.removeAttribute('capture');
    } else {
      this.hostElement.setAttribute('capture', capture === true ? '' : String(capture));
    }
    this.textboxElement.placeholder = this._options.prompt || '';
    this.textboxElement.setAttribute(
      'aria-label',
      this._options.ariaLabel || this._options.label || this._text('fileBox')
    );
    this.textboxElement.setAttribute('aria-disabled', String(this._options.disabled));
    this.textboxElement.setAttribute('aria-readonly', String(this._options.readonly));
    if (this._options.disabled) this.editBox.disable();
    else this.editBox.enable();
    this.editBox.readonly(this._options.readonly);
    if (!initial) this.editBox.resize(this._options.width, this._options.height);
    this._applyClass();
    this._applyLabel();
    this._applyButton();
    this.setTheme(this._options.theme);
    if (!initial) {
      this._syncFiles(true);
      this._emit('refresh', { options: this.options() });
    }
    return this;
  };

  FileBox.prototype._invoke = function(name) {
    var handler = this._options[name];
    return typeof handler === 'function' ?
      handler.apply(this, Array.prototype.slice.call(arguments, 1)) :
      undefined;
  };

  FileBox.prototype._emit = function(type, detail) {
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

  FileBox.prototype.on = function(type, listener) {
    if (type && typeof listener === 'function') {
      (this._listeners[String(type)] || (this._listeners[String(type)] = [])).push(listener);
    }
    return this;
  };

  FileBox.prototype.off = function(type, listener) {
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

  FileBox.prototype.options = function() {
    return fileBoxAssign({}, this._options);
  };

  FileBox.prototype.setOptions = function(options) {
    var localeChanged = Boolean(
      options && Object.prototype.hasOwnProperty.call(options, 'locale')
    );
    if (options && Object.prototype.hasOwnProperty.call(options, 'buttonText')) {
      this._customButtonText = true;
    }
    fileBoxAssign(this._options, options || {});
    this._normalizeOptions();
    if (localeChanged && !this._customButtonText) {
      this._options.buttonText = this._text('chooseFile');
    }
    return this._applyOptions(false);
  };

  FileBox.prototype.textbox = function() {
    return this.textboxElement;
  };

  FileBox.prototype.button = function() {
    return this.buttonElement;
  };

  FileBox.prototype.files = function() {
    return this.hostElement.files;
  };

  FileBox.prototype.getValue = function() {
    return this.editBox.getValue();
  };

  FileBox.prototype.setValue = function(value) {
    if (value != null && String(value) !== '') {
      throw new Error('fabui.FileBox cannot set a non-empty file value for browser security.');
    }
    return this.clear();
  };

  FileBox.prototype.clear = function() {
    var oldValue = this.getValue();
    this.hostElement.value = '';
    this.editBox.setValue('', true);
    if (oldValue !== '') {
      this._invoke('onChange', '', oldValue);
      this._emit('change', {
        value: '',
        oldValue: oldValue,
        files: this.files(),
        originalEvent: null
      });
    }
    return this;
  };

  FileBox.prototype.reset = function() {
    return this.clear();
  };

  FileBox.prototype.focus = function() {
    this.editBox.focus();
    return this;
  };

  FileBox.prototype.resize = function(width, height) {
    if (width != null) this._options.width = width;
    if (height != null) this._options.height = height;
    this.editBox.resize(this._options.width, this._options.height);
    return this;
  };

  FileBox.prototype.disable = function() {
    this._options.disabled = true;
    this.hostElement.disabled = true;
    this.editBox.disable();
    this.textboxElement.setAttribute('aria-disabled', 'true');
    return this;
  };

  FileBox.prototype.enable = function() {
    this._options.disabled = false;
    this.hostElement.disabled = false;
    this.editBox.enable();
    this.textboxElement.setAttribute('aria-disabled', 'false');
    return this;
  };

  FileBox.prototype.readonly = function(mode) {
    this._options.readonly = mode !== false;
    this.editBox.readonly(this._options.readonly);
    this.textboxElement.setAttribute('aria-readonly', String(this._options.readonly));
    return this;
  };

  FileBox.prototype.setLocale = function(locale, messages) {
    if (locale && messages) {
      localePacks[String(locale)] = fileBoxAssign({}, localePacks.en, messages);
    }
    this._options.locale = normalizeFileBoxLocale(locale);
    if (!this._customButtonText) {
      this._options.buttonText = this._text('chooseFile');
      this._applyButton();
    }
    this.textboxElement.setAttribute(
      'aria-label',
      this._options.ariaLabel || this._options.label || this._text('fileBox')
    );
    return this;
  };

  FileBox.prototype.setTheme = function(theme) {
    var index;
    this._options.theme = theme == null ? 'inherit' : theme;
    this.theme = this._options.theme === 'inherit' ?
      findFileBoxTheme(this._themeSource) :
      normalizeFileBoxTheme(this._options.theme);
    for (index = 0; index < FILEBOX_THEMES.length; index += 1) {
      this.fieldElement.classList.remove('fg-theme-' + FILEBOX_THEMES[index]);
    }
    this.fieldElement.classList.add('fg-theme-' + this.theme);
    return this;
  };

  FileBox.prototype.destroy = function() {
    var parent;
    if (this._destroyed) return;
    this._destroyed = true;
    this.removeEventListener();
    parent = this.fieldElement && this.fieldElement.parentNode;
    if (parent) parent.insertBefore(this.hostElement, this.fieldElement);
    if (this.editBox) this.editBox.destroy();
    if (this.proxyElement && this.proxyElement.parentNode) {
      this.proxyElement.parentNode.removeChild(this.proxyElement);
    }
    restoreFileBoxAttribute(this.hostElement, 'class', this._original.className);
    restoreFileBoxAttribute(this.hostElement, 'style', this._original.style);
    restoreFileBoxAttribute(this.hostElement, 'id', this._original.id);
    restoreFileBoxAttribute(this.hostElement, 'accept', this._original.accept);
    restoreFileBoxAttribute(this.hostElement, 'multiple', this._original.multiple);
    restoreFileBoxAttribute(this.hostElement, 'capture', this._original.capture);
    restoreFileBoxAttribute(this.hostElement, 'disabled', this._original.disabledAttribute);
    restoreFileBoxAttribute(this.hostElement, 'required', this._original.requiredAttribute);
    restoreFileBoxAttribute(this.hostElement, 'aria-label', this._original.ariaLabel);
    restoreFileBoxAttribute(this.hostElement, 'aria-hidden', this._original.ariaHidden);
    restoreFileBoxAttribute(this.hostElement, 'tabindex', this._original.tabIndex);
    restoreFileBoxAttribute(this.hostElement, 'value', this._original.value);
    this.hostElement.disabled = this._original.disabled;
    this.hostElement.required = this._original.required;
    this.hostElement.multiple = this._original.multipleProperty;
    unregisterControl(this.hostElement, this);
    delete this.hostElement.__fabuiFileBox;
    this._listeners = {};
    this.editBox = null;
    this.proxyElement = null;
    this.fieldElement = null;
    this.textboxElement = null;
    this.buttonElement = null;
    this.labelElement = null;
  };

  FileBox.prototype.dispose = FileBox.prototype.destroy;
  FileBox.defaults = defaults;
  FileBox.locales = localePacks;
  FileBox.themes = FILEBOX_THEMES.slice();
  FileBox.addLocale = function(name, messages) {
    if (name && messages) {
      localePacks[String(name)] = fileBoxAssign({}, localePacks.en, messages);
    }
    return FileBox;
  };
  FileBox.getControl = function(element) {
    element = resolveFileBoxElement(element);
    return element && element.__fabuiFileBox ? element.__fabuiFileBox : null;
  };
  FileBox.normalizeTheme = normalizeFileBoxTheme;
  FileBox.normalizeLocale = normalizeFileBoxLocale;
  return FileBox;
}
