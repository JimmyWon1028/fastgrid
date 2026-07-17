export function createNumberBoxFactory(TextBox, editorDefinitions) {
  'use strict';

  if (typeof TextBox !== 'function') {
    throw new Error('fabui.NumberBox requires fabui.TextBox.');
  }

  editorDefinitions = editorDefinitions || {};
  var editorDefinition = editorDefinitions.number || editorDefinitions.numberbox || null;

  var numberDefaults = {
    min: null,
    max: null,
    precision: null,
    thousandsSeparator: false,
    decimalSeparator: '.',
    groupSeparator: '',
    prefix: '',
    suffix: '',
    parser: null,
    formatter: null,
    filter: null,
    onChange: null
  };

  function assign(target) {
    var index;
    var source;
    var key;
    for (index = 1; index < arguments.length; index += 1) {
      source = arguments[index] || {};
      for (key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  }

  function resolveElement(element) {
    return typeof element === 'string' ? document.querySelector(element) : element;
  }

  function readNumberAttribute(element, name) {
    var value = element.getAttribute(name);
    return value == null || value === '' || !isFinite(Number(value)) ? undefined : Number(value);
  }

  function readElementOptions(element) {
    var options = {};
    var names = ['decimalSeparator', 'groupSeparator', 'prefix', 'suffix'];
    var index;
    var value;
    value = readNumberAttribute(element, 'min');
    if (value !== undefined) options.min = value;
    value = readNumberAttribute(element, 'max');
    if (value !== undefined) options.max = value;
    value = readNumberAttribute(element, 'precision');
    if (value !== undefined) options.precision = value;
    for (index = 0; index < names.length; index += 1) {
      value = element.getAttribute(names[index]);
      if (value != null) options[names[index]] = value;
    }
    return options;
  }

  function removeAll(text, token) {
    return token ? text.split(token).join('') : text;
  }

  function normalizePrecision(value) {
    if (editorDefinition && typeof editorDefinition.normalizePrecision === 'function') {
      return editorDefinition.normalizePrecision(value);
    }
    if (value == null || value === false || value === '') return null;
    value = Math.floor(Number(value));
    return isFinite(value) && value >= 0 ? Math.min(20, value) : null;
  }

  function NumberBox(element, options) {
    var sourceValue;
    var textBoxOptions;
    if (!(this instanceof NumberBox)) {
      return new NumberBox(element, options);
    }
    this._source = resolveElement(element);
    if (!this._source || this._source.tagName !== 'INPUT') {
      throw new Error('fabui.NumberBox requires an input element.');
    }
    if (this._source.__fabuiNumberBox) {
      return this._source.__fabuiNumberBox;
    }

    options = options || {};
    sourceValue = Object.prototype.hasOwnProperty.call(options, 'value') ? options.value : this._source.value;
    this._options = assign({}, TextBox.defaults || {}, numberDefaults, readElementOptions(this._source), options);
    this._options.precision = normalizePrecision(this._options.precision);
    if (!this._options.groupSeparator && (
      this._options.thousandsSeparator === true ||
      this._options.useThousandsSeparator === true ||
      this._options.showThousandsSeparator === true
    )) {
      this._options.groupSeparator = ',';
    }
    this._listeners = {};
    this._destroyed = false;
    textBoxOptions = assign({}, options, {
      cls: 'fui-numberbox' + (options.cls ? ' ' + options.cls : ''),
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
      this._editor.classList.add('textbox-f', 'numberbox-f', 'fg-editor-numberbox');
    }
    this._editor.inputMode = editorDefinition && editorDefinition.inputMode ? editorDefinition.inputMode : 'decimal';
    this._initialValue = this._normalizeValue(sourceValue);
    this._lastCommittedValue = '';
    this._bind();
    this._source.__fabuiNumberBox = this;
    this.setValue(sourceValue, true);
  }

  NumberBox.prototype._bind = function() {
    var self = this;
    this._onFocus = function() {
      self._editor.value = self._getEditingText(self.getValue());
      self._editor.select();
    };
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
    this._onFormReset = function() {
      window.setTimeout(function() {
        if (!self._destroyed) self.reset();
      }, 0);
    };
    this._editor.addEventListener('focus', this._onFocus);
    this._editor.addEventListener('blur', this._onBlur);
    this._editor.addEventListener('keydown', this._onKeyDown);
    this._editor.addEventListener('input', this._onInput);
    this._editor.addEventListener('copy', this._onCopy);
    if (this._source.form) this._source.form.addEventListener('reset', this._onFormReset);
  };

  NumberBox.prototype._handleKeyDown = function(event) {
    var key = event.key;
    var text = this._editor.value;
    var selectionStart = this._editor.selectionStart == null ? text.length : this._editor.selectionStart;
    var selectionEnd = this._editor.selectionEnd == null ? selectionStart : this._editor.selectionEnd;
    var selectedText = text.slice(selectionStart, selectionEnd);
    if (key === 'Enter') {
      event.preventDefault();
      this.fix();
      this._editor.select();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing || key.length !== 1) {
      return;
    }
    if (typeof this._options.filter === 'function') {
      if (this._options.filter.call(this._source, event) === false) {
        event.preventDefault();
      }
      return;
    }
    if (editorDefinition && typeof editorDefinition.isTextAllowed === 'function') {
      if (!editorDefinition.isTextAllowed(this._editor, key, this._options)) event.preventDefault();
      return;
    }
    if (key >= '0' && key <= '9') {
      return;
    }
    if (key === '-' && !(this._options.min != null && Number(this._options.min) >= 0)) {
      if (text.indexOf('-') < 0 || selectedText.indexOf('-') >= 0) {
        return;
      }
    }
    if (key === this._options.decimalSeparator && this._options.precision > 0) {
      if (text.indexOf(key) < 0 || selectedText.indexOf(key) >= 0) {
        return;
      }
    }
    if (this._options.groupSeparator && key === this._options.groupSeparator) {
      return;
    }
    event.preventDefault();
  };

  NumberBox.prototype._syncLiveValue = function() {
    var text;
    var number;
    this._sanitizeEditingText();
    text = this._stripFormatting(this._editor.value);
    number = editorDefinition && typeof editorDefinition.parse === 'function' ? editorDefinition.parse(text, this._options) : parseFloat(text);
    this._source.value = number != null && isFinite(number) ? String(number) : '';
  };

  NumberBox.prototype._sanitizeEditingText = function() {
    var text;
    var result = '';
    var sign = '';
    var hasDecimal = false;
    var decimalSeparator = String(this._options.decimalSeparator || '.');
    var groupSeparator = String(this._options.groupSeparator || '');
    var selectionStart;
    var index;
    var character;
    if (typeof this._options.filter === 'function') {
      return;
    }
    text = this._editor.value;
    selectionStart = this._editor.selectionStart == null ? text.length : this._editor.selectionStart;
    if (editorDefinition && typeof editorDefinition.sanitize === 'function') {
      result = editorDefinition.sanitize(text, this._options);
      result = editorDefinition.format(result, assign({}, this._options, { precision: null }));
      if (result !== text) {
        this._editor.value = result;
        if (this._editor.setSelectionRange) {
          selectionStart = Math.min(selectionStart, result.length);
          this._editor.setSelectionRange(selectionStart, selectionStart);
        }
      }
      return;
    }
    for (index = 0; index < text.length; index += 1) {
      character = text.charAt(index);
      if (character >= '0' && character <= '9') {
        result += character;
      } else if (character === '-' && !sign && !(this._options.min != null && Number(this._options.min) >= 0)) {
        sign = '-';
      } else if (character === decimalSeparator && this._options.precision > 0 && !hasDecimal) {
        result += character;
        hasDecimal = true;
      } else if (groupSeparator && character === groupSeparator) {
        result += character;
      }
    }
    result = sign + result;
    if (result !== text) {
      this._editor.value = result;
      if (this._editor.setSelectionRange) {
        selectionStart = Math.min(selectionStart, result.length);
        this._editor.setSelectionRange(selectionStart, selectionStart);
      }
    }
  };

  NumberBox.prototype._stripFormatting = function(value) {
    var text = value == null ? '' : String(value).trim();
    text = removeAll(text, String(this._options.prefix || '').trim());
    text = removeAll(text, String(this._options.suffix || '').trim());
    if (editorDefinition && typeof editorDefinition.stripFormatting === 'function') {
      return editorDefinition.stripFormatting(text, this._options);
    }
    text = removeAll(text, this._options.groupSeparator);
    if (this._options.decimalSeparator && this._options.decimalSeparator !== '.') {
      text = text.replace(this._options.decimalSeparator, '.');
    }
    return text.replace(/\s/g, '');
  };

  NumberBox.prototype._normalizeValue = function(value) {
    var parsed = value;
    var number;
    var precision = this._options.precision;
    if (value == null || value === '') {
      return '';
    }
    if (typeof this._options.parser === 'function') {
      parsed = this._options.parser.call(this._source, value);
    } else if (editorDefinition && typeof editorDefinition.parse === 'function') {
      parsed = this._stripFormatting(value);
      number = editorDefinition.parse(parsed, this._options);
      parsed = number;
    } else {
      parsed = this._stripFormatting(value);
    }
    if (number == null) number = parseFloat(parsed);
    if (!isFinite(number)) {
      return '';
    }
    if (this._options.min != null) {
      number = Math.max(Number(this._options.min), number);
    }
    if (this._options.max != null) {
      number = Math.min(Number(this._options.max), number);
    }
    if (number === 0) {
      number = 0;
    }
    return precision == null ? String(number) : number.toFixed(precision);
  };

  NumberBox.prototype._formatValue = function(value) {
    var parts;
    var integer;
    var fraction;
    var sign = '';
    if (value == null || value === '') {
      return '';
    }
    if (typeof this._options.formatter === 'function') {
      return String(this._options.formatter.call(this._source, value));
    }
    if (editorDefinition && typeof editorDefinition.format === 'function') {
      return String(this._options.prefix || '') + editorDefinition.format(value, this._options) + String(this._options.suffix || '');
    }
    parts = String(value).split('.');
    integer = parts[0];
    fraction = parts[1] || '';
    if (integer.charAt(0) === '-') {
      sign = '-';
      integer = integer.slice(1);
    }
    if (this._options.groupSeparator) {
      integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, this._options.groupSeparator);
    }
    return String(this._options.prefix || '') + sign + integer +
      (fraction ? String(this._options.decimalSeparator || '.') + fraction : '') +
      String(this._options.suffix || '');
  };

  NumberBox.prototype._getEditingText = function(value) {
    if (value == null || value === '') {
      return '';
    }
    return this._options.decimalSeparator === '.' ? String(value) : String(value).replace('.', this._options.decimalSeparator);
  };

  NumberBox.prototype._handleCopy = function(event) {
    var start = this._editor.selectionStart;
    var end = this._editor.selectionEnd;
    var text;
    var clipboardData;
    if (!editorDefinition || typeof editorDefinition.getCopyText !== 'function' || start == null || end == null || start === end) return;
    text = this._stripFormatting(this._editor.value.slice(Math.min(start, end), Math.max(start, end)));
    clipboardData = event.clipboardData || window.clipboardData;
    if (!clipboardData || !clipboardData.setData) return;
    clipboardData.setData('text/plain', text);
    event.preventDefault();
    event.stopPropagation();
  };

  NumberBox.prototype._emit = function(name, detail) {
    var listeners = (this._listeners[name] || []).slice();
    listeners.forEach(function(listener) {
      listener(detail);
    });
  };

  NumberBox.prototype.options = function() {
    return this._options;
  };

  NumberBox.prototype.textbox = function() {
    return this._editor;
  };

  NumberBox.prototype.button = function() {
    return this._textbox.button();
  };

  NumberBox.prototype.getIcon = function(index) {
    return this._textbox.getIcon(index);
  };

  NumberBox.prototype.getText = function() {
    return this._editor.value;
  };

  NumberBox.prototype.setText = function(value) {
    this._editor.value = value == null ? '' : String(value);
    this._syncLiveValue();
    return this;
  };

  NumberBox.prototype.getValue = function() {
    return this._source.value;
  };

  NumberBox.prototype.getNumber = function() {
    return this.getValue() === '' ? null : Number(this.getValue());
  };

  NumberBox.prototype.setValue = function(value, silent) {
    var oldValue = this._lastCommittedValue;
    var normalized = this._normalizeValue(value);
    var text = this._formatValue(normalized);
    this._textbox.setValue(text, true);
    this._source.value = normalized;
    this._options.value = normalized;
    this._lastCommittedValue = normalized;
    if (!silent && normalized !== oldValue) {
      if (typeof this._options.onChange === 'function') {
        this._options.onChange.call(this, normalized, oldValue);
      }
      this._emit('change', { value: normalized, oldValue: oldValue });
    }
    return this;
  };

  NumberBox.prototype.fix = function() {
    return this.setValue(this._editor.value);
  };

  NumberBox.prototype.initValue = function(value) {
    this._initialValue = this._normalizeValue(value);
    return this.setValue(this._initialValue, true);
  };

  NumberBox.prototype.clear = function() {
    return this.setValue('');
  };

  NumberBox.prototype.reset = function() {
    return this.setValue(this._initialValue);
  };

  NumberBox.prototype.focus = function() {
    this._textbox.focus();
    return this;
  };

  NumberBox.prototype.resize = function(width, height) {
    this._textbox.resize(width, height);
    this._options.width = this._textbox.options().width;
    this._options.height = this._textbox.options().height;
    return this;
  };

  NumberBox.prototype.disable = function() {
    this._textbox.disable();
    this._options.disabled = true;
    return this;
  };

  NumberBox.prototype.enable = function() {
    this._textbox.enable();
    this._options.disabled = false;
    return this;
  };

  NumberBox.prototype.readonly = function(mode) {
    this._textbox.readonly(mode);
    this._options.readonly = mode !== false;
    return this;
  };

  NumberBox.prototype.setEditable = function(mode) {
    this._textbox.setEditable(mode);
    this._options.editable = mode !== false;
    return this;
  };

  NumberBox.prototype.on = function(name, listener) {
    if (typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  NumberBox.prototype.off = function(name, listener) {
    var listeners = this._listeners[name];
    if (!listeners) return this;
    this._listeners[name] = listener ? listeners.filter(function(item) {
      return item !== listener;
    }) : [];
    return this;
  };

  NumberBox.prototype.destroy = function() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._editor.removeEventListener('focus', this._onFocus);
    this._editor.removeEventListener('blur', this._onBlur);
    this._editor.removeEventListener('keydown', this._onKeyDown);
    this._editor.removeEventListener('input', this._onInput);
    this._editor.removeEventListener('copy', this._onCopy);
    if (this._source.form) this._source.form.removeEventListener('reset', this._onFormReset);
    delete this._source.__fabuiNumberBox;
    this._textbox.destroy();
    this._listeners = {};
  };

  NumberBox.defaults = assign({}, TextBox.defaults || {}, numberDefaults);
  NumberBox.editorDefinition = editorDefinition;
  return NumberBox;
}
