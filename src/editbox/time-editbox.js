export function createTimeBoxFactory(TextBox, editorDefinitions) {
  'use strict';

  if (typeof TextBox !== 'function') {
    throw new Error('fabui.TimeBox requires fabui.TextBox.');
  }

  editorDefinitions = editorDefinitions || {};
  var editorDefinition = editorDefinitions.time || editorDefinitions.timebox || null;
  var localePacks = {
    en: {
      increaseValueText: 'Increase value',
      decreaseValueText: 'Decrease value',
      invalidTimeText: 'Please enter a valid time.'
    },
    'zh-TW': {
      increaseValueText: '增加數值',
      decreaseValueText: '減少數值',
      invalidTimeText: '請輸入有效時間。'
    },
    'zh-CN': {
      increaseValueText: '增加数值',
      decreaseValueText: '减少数值',
      invalidTimeText: '请输入有效时间。'
    }
  };
  var timeDefaults = {
    mask: '99:99',
    autoUnmask: true,
    spinner: false,
    iconWidth: 28,
    locale: 'en',
    increaseValueText: null,
    decreaseValueText: null,
    invalidTimeText: null,
    onChange: null
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

  function normalizeLocale(value) {
    var name = String(value || 'en').trim().replace(/_/g, '-');
    var lower = name.toLowerCase();
    if (lower === 'zh-hant' || lower === 'zh-hant-tw' || lower === 'zh-tw') return 'zh-TW';
    if (lower === 'zh-hans' || lower === 'zh-hans-cn' || lower === 'zh-cn') return 'zh-CN';
    return localePacks[name] ? name : 'en';
  }

  function normalizeMask(value) {
    if (editorDefinition && typeof editorDefinition.normalizeMask === 'function') {
      return editorDefinition.normalizeMask(value);
    }
    return String(value || '') === '99:99:99' ? '99:99:99' : '99:99';
  }

  function normalizeSpinner(value) {
    if (editorDefinition && typeof editorDefinition.normalizeSpinner === 'function') {
      return editorDefinition.normalizeSpinner(value);
    }
    if (value === true || String(value).toLowerCase() === 'right') return 'right';
    if (String(value).toLowerCase() === 'left') return 'left';
    return false;
  }

  function cssSize(value, fallback) {
    if (value == null || value === '') return fallback + 'px';
    return typeof value === 'number' ? value + 'px' : String(value);
  }

  function TimeBox(element, options) {
    var sourceValue;
    var textBoxOptions;
    var locale;
    if (!(this instanceof TimeBox)) return new TimeBox(element, options);
    this._source = resolveElement(element);
    if (!this._source || this._source.tagName !== 'INPUT') {
      throw new Error('fabui.TimeBox requires an input element.');
    }
    if (this._source.__fabuiTimeBox) return this._source.__fabuiTimeBox;

    options = options || {};
    sourceValue = Object.prototype.hasOwnProperty.call(options, 'value') ? options.value : this._source.value;
    this._options = assign({}, TextBox.defaults || {}, timeDefaults, options);
    if (!Object.prototype.hasOwnProperty.call(options, 'disabled')) this._options.disabled = this._source.disabled;
    if (!Object.prototype.hasOwnProperty.call(options, 'readonly')) this._options.readonly = this._source.readOnly;
    this._options.mask = normalizeMask(this._options.mask);
    this._options.spinner = normalizeSpinner(this._options.spinner);
    this._options.locale = normalizeLocale(this._options.locale);
    locale = localePacks[this._options.locale];
    if (!Object.prototype.hasOwnProperty.call(options, 'increaseValueText')) {
      this._options.increaseValueText = locale.increaseValueText;
    }
    if (!Object.prototype.hasOwnProperty.call(options, 'decreaseValueText')) {
      this._options.decreaseValueText = locale.decreaseValueText;
    }
    if (!Object.prototype.hasOwnProperty.call(options, 'invalidTimeText')) {
      this._options.invalidTimeText = locale.invalidTimeText;
    }
    this._listeners = {};
    this._destroyed = false;
    this._spinnerSegment = 0;
    textBoxOptions = assign({}, options, {
      cls: 'fui-timebox' + (options.cls ? ' ' + options.cls : ''),
      value: '',
      type: 'text',
      multiline: false,
      onChange: null
    });
    this._textbox = new TextBox(this._source, textBoxOptions);
    this._editor = this._textbox.textbox();
    if (editorDefinition && editorDefinition.className) {
      editorDefinition.className.split(/\s+/).forEach(function(className) {
        if (className) this._editor.classList.add(className);
      }, this);
    } else {
      this._editor.classList.add('textbox-f', 'timebox-f', 'fg-editor-timebox');
    }
    this._editor.inputMode = editorDefinition && editorDefinition.inputMode ? editorDefinition.inputMode : 'numeric';
    this._initialValue = this._getDataValue(this._formatValue(sourceValue));
    this._lastCommittedValue = '';
    this._buildSpinner();
    this._bind();
    this._source.__fabuiTimeBox = this;
    this.setValue(sourceValue, true);
  }

  TimeBox.prototype._formatValue = function(value) {
    if (editorDefinition && typeof editorDefinition.format === 'function') {
      return editorDefinition.format(value, this._options);
    }
    return String(value == null ? '' : value).replace(/[^0-9]/g, '').slice(0, 4)
      .replace(/^(\d{2})(\d)/, '$1:$2');
  };

  TimeBox.prototype._getDataValue = function(value) {
    if (editorDefinition && typeof editorDefinition.getDataValue === 'function') {
      return editorDefinition.getDataValue(value, this._options);
    }
    return this._options.autoUnmask === false ? this._formatValue(value) : String(value || '').replace(/[^0-9]/g, '');
  };

  TimeBox.prototype._isValid = function(value) {
    if (editorDefinition && typeof editorDefinition.isValid === 'function') {
      return editorDefinition.isValid(value, this._options);
    }
    return value == null || value === '' || /^(?:[01]\d|2[0-3]):[0-5]\d$|^24:00$/.test(String(value));
  };

  TimeBox.prototype._buildSpinner = function() {
    var addon;
    var spinner;
    var increaseButton;
    var decreaseButton;
    if (!this._options.spinner) return;
    addon = this._options.spinner === 'left' ? this._textbox._beforeAddon : this._textbox._afterAddon;
    spinner = document.createElement('span');
    increaseButton = document.createElement('button');
    decreaseButton = document.createElement('button');
    spinner.className = 'fui-numberbox-spinner fui-timebox-spinner fui-numberbox-spinner-' + this._options.spinner;
    spinner.style.width = cssSize(this._options.iconWidth, 28);
    spinner.style.flexBasis = cssSize(this._options.iconWidth, 28);
    increaseButton.type = 'button';
    increaseButton.className = 'fui-numberbox-spinner-button fui-numberbox-spinner-up';
    increaseButton.title = this._options.increaseValueText;
    increaseButton.setAttribute('aria-label', this._options.increaseValueText);
    decreaseButton.type = 'button';
    decreaseButton.className = 'fui-numberbox-spinner-button fui-numberbox-spinner-down';
    decreaseButton.title = this._options.decreaseValueText;
    decreaseButton.setAttribute('aria-label', this._options.decreaseValueText);
    spinner.appendChild(increaseButton);
    spinner.appendChild(decreaseButton);
    if (this._options.spinner === 'left') addon.insertBefore(spinner, addon.firstChild);
    else addon.appendChild(spinner);
    this._spinner = spinner;
    this._increaseButton = increaseButton;
    this._decreaseButton = decreaseButton;
    this._updateSpinnerState();
  };

  TimeBox.prototype._bind = function() {
    var self = this;
    this._onBlur = function() {
      self.fix();
    };
    this._onKeyDown = function(event) {
      self._handleKeyDown(event);
    };
    this._onInput = function() {
      self._syncLiveValue();
    };
    this._onCopy = function(event) {
      self._handleCopy(event);
    };
    this._onSpinnerPointerDown = function(event) {
      self._spinnerSegment = self._getActiveSegment();
      event.preventDefault();
    };
    this._onSpinnerClick = function(event) {
      var button = event.target.closest('.fui-numberbox-spinner-button');
      if (!button || button.disabled) return;
      self._spin(button === self._increaseButton ? 1 : -1, self._spinnerSegment);
    };
    this._onFormReset = function() {
      window.setTimeout(function() {
        if (!self._destroyed) self.reset();
      }, 0);
    };
    this._editor.addEventListener('blur', this._onBlur);
    this._editor.addEventListener('keydown', this._onKeyDown);
    this._editor.addEventListener('input', this._onInput);
    this._editor.addEventListener('copy', this._onCopy);
    if (this._spinner) {
      this._spinner.addEventListener('pointerdown', this._onSpinnerPointerDown);
      this._spinner.addEventListener('click', this._onSpinnerClick);
    }
    if (this._source.form) this._source.form.addEventListener('reset', this._onFormReset);
  };

  TimeBox.prototype._handleKeyDown = function(event) {
    var key = event.key;
    if (key === 'Enter') {
      event.preventDefault();
      this.fix();
      return;
    }
    if (this._spinner && (key === 'ArrowUp' || key === 'ArrowDown')) {
      event.preventDefault();
      this._spin(key === 'ArrowUp' ? 1 : -1, this._getActiveSegment());
      return;
    }
    if ((key === 'Backspace' || key === 'Delete') && editorDefinition && typeof editorDefinition.handleDelete === 'function') {
      event.preventDefault();
      editorDefinition.handleDelete(this._editor, key, this._options);
      this._syncLiveValue(true);
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing || key.length !== 1) return;
    if (!editorDefinition || typeof editorDefinition.isTextAllowed !== 'function' ||
      !editorDefinition.isTextAllowed(this._editor, key, this._options)) {
      event.preventDefault();
    }
  };

  TimeBox.prototype._syncLiveValue = function(preserveCaret) {
    var original = this._editor.value;
    var caret = this._editor.selectionStart == null ? original.length : this._editor.selectionStart;
    var rawIndex = original.slice(0, caret).replace(/[^0-9]/g, '').length;
    var formatted = this._formatValue(original);
    var nextCaret;
    if (formatted !== original) this._editor.value = formatted;
    if (this._editor.setSelectionRange && (formatted !== original || preserveCaret)) {
      nextCaret = editorDefinition && typeof editorDefinition.getCaretPosition === 'function' ?
        editorDefinition.getCaretPosition(formatted, rawIndex) : Math.min(caret, formatted.length);
      this._editor.setSelectionRange(nextCaret, nextCaret);
    }
    this._source.value = this._getDataValue(formatted);
    this._options.value = this._source.value;
    this._syncValidity(formatted);
  };

  TimeBox.prototype._syncValidity = function(value) {
    var invalid = value !== '' && !this._isValid(value);
    var message = invalid ? this._options.invalidTimeText : '';
    this._source.setCustomValidity(message);
    this._editor.setCustomValidity(message);
    if (invalid) this._editor.setAttribute('aria-invalid', 'true');
    else this._editor.removeAttribute('aria-invalid');
  };

  TimeBox.prototype._getActiveSegment = function() {
    var caret = this._editor.selectionStart == null ? this._editor.value.length : this._editor.selectionStart;
    if (editorDefinition && typeof editorDefinition.getSegmentAtCaret === 'function') {
      return editorDefinition.getSegmentAtCaret(caret, this._options);
    }
    return caret <= 2 ? 0 : 1;
  };

  TimeBox.prototype._selectSegment = function(segment) {
    var ranges = [[0, 2], [3, 5], [6, 8]];
    var range = ranges[segment] || ranges[0];
    if (this._editor.setSelectionRange) {
      this._editor.setSelectionRange(
        Math.min(range[0], this._editor.value.length),
        Math.min(range[1], this._editor.value.length)
      );
    }
  };

  TimeBox.prototype._spin = function(direction, segment) {
    var nextValue;
    if (!this._spinner || this._options.disabled || this._options.readonly) return this;
    segment = segment == null ? this._getActiveSegment() : segment;
    if (editorDefinition && typeof editorDefinition.getSpinValue === 'function') {
      nextValue = editorDefinition.getSpinValue(this._editor.value, segment, direction, this._options);
    } else {
      nextValue = this._editor.value || '00:00';
    }
    this.setValue(nextValue);
    this._editor.focus();
    this._selectSegment(segment);
    return this;
  };

  TimeBox.prototype._updateSpinnerState = function() {
    var disabled;
    if (!this._spinner) return;
    disabled = Boolean(this._options.disabled || this._options.readonly);
    this._increaseButton.disabled = disabled;
    this._decreaseButton.disabled = disabled;
  };

  TimeBox.prototype._handleCopy = function(event) {
    var start = this._editor.selectionStart;
    var end = this._editor.selectionEnd;
    var text;
    var clipboardData;
    if (start == null || end == null || start === end) return;
    text = this._editor.value.slice(Math.min(start, end), Math.max(start, end));
    if (this._options.autoUnmask !== false) text = text.replace(/[^0-9]/g, '');
    clipboardData = event.clipboardData || window.clipboardData;
    if (!clipboardData || !clipboardData.setData) return;
    clipboardData.setData('text/plain', text);
    event.preventDefault();
    event.stopPropagation();
  };

  TimeBox.prototype._emit = function(name, detail) {
    (this._listeners[name] || []).slice().forEach(function(listener) {
      listener(detail);
    });
  };

  TimeBox.prototype.options = function() {
    return this._options;
  };

  TimeBox.prototype.textbox = function() {
    return this._editor;
  };

  TimeBox.prototype.button = function() {
    return this._textbox.button();
  };

  TimeBox.prototype.getIcon = function(index) {
    return this._textbox.getIcon(index);
  };

  TimeBox.prototype.getText = function() {
    return this._editor.value;
  };

  TimeBox.prototype.setText = function(value) {
    return this.setValue(value);
  };

  TimeBox.prototype.getValue = function() {
    return this._source.value;
  };

  TimeBox.prototype.getTime = function() {
    if (!editorDefinition || typeof editorDefinition.parse !== 'function') return null;
    return editorDefinition.parse(this._editor.value, this._options);
  };

  TimeBox.prototype.setValue = function(value, silent) {
    var oldValue = this._lastCommittedValue;
    var formatted = this._formatValue(value);
    var dataValue = this._getDataValue(formatted);
    this._textbox.setValue(formatted, true);
    this._source.value = dataValue;
    this._options.value = dataValue;
    this._lastCommittedValue = dataValue;
    this._syncValidity(formatted);
    if (!silent && dataValue !== oldValue) {
      if (typeof this._options.onChange === 'function') {
        this._options.onChange.call(this, dataValue, oldValue);
      }
      this._emit('change', { value: dataValue, oldValue: oldValue });
    }
    return this;
  };

  TimeBox.prototype.fix = function() {
    return this.setValue(this._editor.value);
  };

  TimeBox.prototype.initValue = function(value) {
    this._initialValue = this._getDataValue(this._formatValue(value));
    return this.setValue(value, true);
  };

  TimeBox.prototype.clear = function() {
    return this.setValue('');
  };

  TimeBox.prototype.reset = function() {
    return this.setValue(this._initialValue);
  };

  TimeBox.prototype.focus = function() {
    this._textbox.focus();
    return this;
  };

  TimeBox.prototype.resize = function(width, height) {
    this._textbox.resize(width, height);
    this._options.width = this._textbox.options().width;
    this._options.height = this._textbox.options().height;
    return this;
  };

  TimeBox.prototype.disable = function() {
    this._textbox.disable();
    this._options.disabled = true;
    this._updateSpinnerState();
    return this;
  };

  TimeBox.prototype.enable = function() {
    this._textbox.enable();
    this._options.disabled = false;
    this._updateSpinnerState();
    return this;
  };

  TimeBox.prototype.readonly = function(mode) {
    this._textbox.readonly(mode);
    this._options.readonly = mode !== false;
    this._updateSpinnerState();
    return this;
  };

  TimeBox.prototype.setEditable = function(mode) {
    this._textbox.setEditable(mode);
    this._options.editable = mode !== false;
    return this;
  };

  TimeBox.prototype.setLocale = function(locale, messages) {
    var name = String(locale || 'en').trim().replace(/_/g, '-');
    var pack;
    if (messages) localePacks[name] = assign({}, localePacks.en, messages);
    this._options.locale = normalizeLocale(name);
    pack = localePacks[this._options.locale] || localePacks.en;
    this._options.increaseValueText = pack.increaseValueText;
    this._options.decreaseValueText = pack.decreaseValueText;
    this._options.invalidTimeText = pack.invalidTimeText;
    if (this._increaseButton) {
      this._increaseButton.title = this._options.increaseValueText;
      this._increaseButton.setAttribute('aria-label', this._options.increaseValueText);
      this._decreaseButton.title = this._options.decreaseValueText;
      this._decreaseButton.setAttribute('aria-label', this._options.decreaseValueText);
    }
    this._syncValidity(this._editor.value);
    return this;
  };

  TimeBox.prototype.on = function(name, listener) {
    if (typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  TimeBox.prototype.off = function(name, listener) {
    var listeners = this._listeners[name];
    if (!listeners) return this;
    this._listeners[name] = listener ? listeners.filter(function(item) {
      return item !== listener;
    }) : [];
    return this;
  };

  TimeBox.prototype.destroy = function() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._editor.removeEventListener('blur', this._onBlur);
    this._editor.removeEventListener('keydown', this._onKeyDown);
    this._editor.removeEventListener('input', this._onInput);
    this._editor.removeEventListener('copy', this._onCopy);
    if (this._spinner) {
      this._spinner.removeEventListener('pointerdown', this._onSpinnerPointerDown);
      this._spinner.removeEventListener('click', this._onSpinnerClick);
    }
    if (this._source.form) this._source.form.removeEventListener('reset', this._onFormReset);
    this._source.setCustomValidity('');
    delete this._source.__fabuiTimeBox;
    this._textbox.destroy();
    this._listeners = {};
  };

  TimeBox.defaults = assign({}, TextBox.defaults || {}, timeDefaults);
  TimeBox.editorDefinition = editorDefinition;
  TimeBox.locales = localePacks;
  TimeBox.extendLocale = function(name, pack) {
    if (name && pack) localePacks[name] = assign({}, localePacks.en, pack);
  };
  return TimeBox;
}
