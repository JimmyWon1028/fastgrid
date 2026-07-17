export function createTextBoxFactory(editorDefinitions) {
  'use strict';

  editorDefinitions = editorDefinitions || {};
  var editorDefinition = editorDefinitions.text || editorDefinitions.textbox || null;

  var defaults = {
    width: 200,
    height: 30,
    cls: '',
    prompt: '',
    value: '',
    autoUnmask: true,
    type: 'text',
    label: '',
    labelWidth: 80,
    labelPosition: 'before',
    labelAlign: 'left',
    multiline: false,
    editable: true,
    disabled: false,
    readonly: false,
    required: false,
    icons: [],
    iconWidth: 18,
    buttonText: '',
    buttonIcon: '',
    buttonAlign: 'right',
    clearButton: false,
    onChange: null,
    onResize: null,
    onClickButton: null,
    onClickIcon: null
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
    if (typeof element === 'string') {
      return document.querySelector(element);
    }
    return element;
  }

  function cssSize(value, fallback) {
    if (value == null || value === '') {
      return fallback + 'px';
    }
    return typeof value === 'number' ? value + 'px' : String(value);
  }

  function normalizePosition(value, allowed, fallback) {
    return allowed.indexOf(value) >= 0 ? value : fallback;
  }

  function TextBox(element, options) {
    if (!(this instanceof TextBox)) {
      return new TextBox(element, options);
    }
    this._source = resolveElement(element);
    if (!this._source || !/^(INPUT|TEXTAREA)$/.test(this._source.tagName)) {
      throw new Error('fabui.TextBox requires an input or textarea element.');
    }
    if (this._source.__fabuiTextBox) {
      return this._source.__fabuiTextBox;
    }

    this._listeners = {};
    this._iconElements = [];
    this._destroyed = false;
    this._originalDisplay = this._source.style.display;
    this._initialValue = this._source.value || '';
    this._options = assign({}, defaults, this._readElementOptions(), options || {});
    if (options && Object.prototype.hasOwnProperty.call(options, 'value')) {
      this._initialValue = options.value == null ? '' : String(options.value);
    } else {
      this._options.value = this._initialValue;
    }
    this._build();
    this._bind();
    this._source.__fabuiTextBox = this;
    this.setValue(this._options.value, true);
    this._applyState();
    this.resize(this._options.width, this._options.height, true);
  }

  TextBox.prototype._readElementOptions = function() {
    var source = this._source;
    return {
      prompt: source.getAttribute('placeholder') || '',
      type: source.getAttribute('type') || 'text',
      multiline: source.tagName === 'TEXTAREA',
      editable: !source.hasAttribute('readonly'),
      disabled: source.disabled,
      readonly: source.readOnly,
      required: source.required,
      value: source.value || ''
    };
  };

  TextBox.prototype._build = function() {
    var options = this._options;
    var parent = this._source.parentNode;
    var field = document.createElement('span');
    var label = null;
    var shell = document.createElement('span');
    var editor = document.createElement(options.multiline ? 'textarea' : 'input');
    var before = document.createElement('span');
    var after = document.createElement('span');

    field.className = 'fui-textbox-field';
    if (options.cls) {
      field.className += ' ' + options.cls;
    }
    shell.className = 'fui-textbox';
    before.className = 'fui-textbox-addon fui-textbox-addon-left';
    after.className = 'fui-textbox-addon fui-textbox-addon-right';
    editor.className = 'fui-textbox-text' + (editorDefinition && editorDefinition.className ? ' ' + editorDefinition.className : ' textbox-f fg-editor-textbox');
    editor.setAttribute('autocomplete', this._source.getAttribute('autocomplete') || 'off');
    editor.setAttribute('placeholder', options.prompt || '');
    editor.setAttribute('aria-label', options.label || this._source.getAttribute('aria-label') || options.prompt || 'TextBox');
    if (!options.multiline) {
      editor.type = options.type || 'text';
    }
    editor.inputMode = editorDefinition && editorDefinition.inputMode ? editorDefinition.inputMode : 'text';

    if (options.label) {
      label = document.createElement('label');
      label.className = 'fui-textbox-label fui-textbox-label-' + normalizePosition(options.labelPosition, ['before', 'after', 'top'], 'before');
      label.textContent = options.label;
      label.style.textAlign = normalizePosition(options.labelAlign, ['left', 'center', 'right'], 'left');
      label.style.width = cssSize(options.labelWidth, 80);
      label.addEventListener('click', function() {
        editor.focus();
      });
    }

    shell.appendChild(before);
    shell.appendChild(editor);
    shell.appendChild(after);
    if (options.labelPosition === 'after') {
      field.appendChild(shell);
      if (label) field.appendChild(label);
    } else {
      if (label) field.appendChild(label);
      field.appendChild(shell);
    }
    parent.insertBefore(field, this._source);
    field.appendChild(this._source);
    this._source.style.display = 'none';
    this._source.setAttribute('aria-hidden', 'true');

    this._field = field;
    this._label = label;
    this._shell = shell;
    this._editor = editor;
    this._beforeAddon = before;
    this._afterAddon = after;
    this._renderAddons();
  };

  TextBox.prototype._renderAddons = function() {
    var options = this._options;
    var icons = Array.isArray(options.icons) ? options.icons.slice() : [];
    var index;
    var descriptor;
    var iconClassName;
    var icon;
    var addon;
    this._iconElements = [];
    this._beforeAddon.textContent = '';
    this._afterAddon.textContent = '';

    if (options.clearButton) {
      icons.push({
        iconCls: 'fui-textbox-clear-icon',
        align: 'right',
        clear: true,
        title: 'Clear'
      });
    }

    for (index = 0; index < icons.length; index += 1) {
      descriptor = assign({}, icons[index]);
      addon = descriptor.align === 'left' ? this._beforeAddon : this._afterAddon;
      icon = document.createElement('button');
      icon.type = 'button';
      iconClassName = descriptor.iconCls || descriptor.className ||
        descriptor.iconClass || descriptor.icon || '';
      icon.className = 'fui-textbox-icon' + (iconClassName ? ' ' + iconClassName : '');
      icon.style.width = cssSize(descriptor.width || options.iconWidth, 18);
      icon.setAttribute(
        'aria-label',
        descriptor.ariaLabel || descriptor.label || descriptor.title ||
          'TextBox icon ' + (index + 1)
      );
      icon.title = descriptor.title || '';
      icon.textContent = descriptor.text || '';
      icon.disabled = Boolean(descriptor.disabled);
      icon.__fabuiIcon = descriptor;
      icon.__fabuiIconIndex = index;
      addon.appendChild(icon);
      this._iconElements.push(icon);
    }

    if (options.buttonText || options.buttonIcon) {
      this._button = document.createElement('button');
      this._button.type = 'button';
      this._button.className = 'fui-textbox-button' + (options.buttonIcon ? ' ' + options.buttonIcon : '');
      this._button.classList.add(options.buttonText && options.buttonIcon ? 'fui-textbox-button-with-icon' : 'fui-textbox-button-icon-only');
      this._button.textContent = options.buttonText || '';
      this._button.setAttribute('aria-label', options.buttonText || 'TextBox button');
      if (options.buttonAlign === 'left') {
        this._beforeAddon.insertBefore(this._button, this._beforeAddon.firstChild);
      } else {
        this._afterAddon.appendChild(this._button);
      }
    } else {
      this._button = null;
    }
    this._updateClearButton();
  };

  TextBox.prototype._bind = function() {
    var self = this;
    this._onInput = function() {
      self._commitEditorValue();
    };
    this._onFocus = function() {
      self._shell.classList.add('fui-textbox-focused');
    };
    this._onBlur = function() {
      self._shell.classList.remove('fui-textbox-focused');
    };
    this._onAddonClick = function(event) {
      var target = event.target.closest('.fui-textbox-icon');
      var descriptor;
      var callback;
      if (!target || target.disabled || self._options.disabled || self._options.readonly) return;
      descriptor = target.__fabuiIcon || {};
      event.data = assign({}, event.data || {}, {
        target: self._source,
        textbox: self,
        icon: target,
        index: target.__fabuiIconIndex
      });
      if (descriptor.clear) {
        self.clear();
        self.focus();
      }
      callback = descriptor.onClick || descriptor.click || descriptor.handler;
      if (typeof callback === 'function') {
        callback.call(self, event);
      }
      self._invoke('onClickIcon', target.__fabuiIconIndex);
      self._emit('iconClick', { index: target.__fabuiIconIndex, icon: target });
    };
    this._onButtonClick = function() {
      if (self._options.disabled) return;
      self._invoke('onClickButton');
      self._emit('buttonClick', { button: self._button });
    };
    this._onFormReset = function() {
      window.setTimeout(function() {
        if (!self._destroyed) self.reset();
      }, 0);
    };
    this._editor.addEventListener('input', this._onInput);
    this._editor.addEventListener('focus', this._onFocus);
    this._editor.addEventListener('blur', this._onBlur);
    this._beforeAddon.addEventListener('click', this._onAddonClick);
    this._afterAddon.addEventListener('click', this._onAddonClick);
    if (this._button) this._button.addEventListener('click', this._onButtonClick);
    if (this._source.form) this._source.form.addEventListener('reset', this._onFormReset);
  };

  TextBox.prototype._commitEditorValue = function() {
    var oldValue = this._source.value;
    var newValue = this._editor.value;
    this._source.value = newValue;
    this._options.value = newValue;
    this._updateClearButton();
    if (newValue !== oldValue) {
      this._invoke('onChange', newValue, oldValue);
      this._emit('change', { value: newValue, oldValue: oldValue });
    }
  };

  TextBox.prototype._applyState = function() {
    var disabled = Boolean(this._options.disabled);
    var readonly = Boolean(this._options.readonly);
    this._editor.disabled = disabled;
    this._editor.readOnly = readonly || !this._options.editable;
    this._editor.required = Boolean(this._options.required);
    this._source.disabled = disabled;
    this._source.readOnly = readonly;
    this._field.classList.toggle('fui-textbox-disabled', disabled);
    this._field.classList.toggle('fui-textbox-readonly', readonly);
    if (this._label) this._label.classList.toggle('fui-textbox-label-disabled', disabled);
    this._iconElements.forEach(function(icon) {
      icon.classList.toggle('fui-textbox-icon-readonly', readonly);
    });
    if (this._button) this._button.disabled = disabled;
  };

  TextBox.prototype._updateClearButton = function() {
    var hasValue = Boolean(this._editor && this._editor.value);
    this._iconElements.forEach(function(icon) {
      if (icon.__fabuiIcon && icon.__fabuiIcon.clear) {
        icon.classList.toggle('fui-textbox-icon-hidden', !hasValue);
      }
    });
  };

  TextBox.prototype._invoke = function(name) {
    var callback = this._options[name];
    if (typeof callback === 'function') {
      return callback.apply(this, Array.prototype.slice.call(arguments, 1));
    }
    return undefined;
  };

  TextBox.prototype._emit = function(name, detail) {
    var listeners = (this._listeners[name] || []).slice();
    listeners.forEach(function(listener) {
      listener(detail);
    });
  };

  TextBox.prototype.options = function() {
    return this._options;
  };

  TextBox.prototype.textbox = function() {
    return this._editor;
  };

  TextBox.prototype.button = function() {
    return this._button;
  };

  TextBox.prototype.getIcon = function(index) {
    return this._iconElements[index] || null;
  };

  TextBox.prototype.getText = function() {
    return this._editor.value;
  };

  TextBox.prototype.setText = function(value) {
    return this.setValue(value);
  };

  TextBox.prototype.getValue = function() {
    return this._source.value;
  };

  TextBox.prototype.setValue = function(value, silent) {
    var oldValue = this._source.value;
    var newValue = editorDefinition && typeof editorDefinition.normalize === 'function' ? editorDefinition.normalize(value) : (value == null ? '' : String(value));
    this._editor.value = newValue;
    this._source.value = newValue;
    this._options.value = newValue;
    this._updateClearButton();
    if (!silent && newValue !== oldValue) {
      this._invoke('onChange', newValue, oldValue);
      this._emit('change', { value: newValue, oldValue: oldValue });
    }
    return this;
  };

  TextBox.prototype.initValue = function(value) {
    this._initialValue = value == null ? '' : String(value);
    return this.setValue(this._initialValue, true);
  };

  TextBox.prototype.clear = function() {
    return this.setValue('');
  };

  TextBox.prototype.reset = function() {
    return this.setValue(this._initialValue);
  };

  TextBox.prototype.focus = function() {
    this._editor.focus();
    return this;
  };

  TextBox.prototype.disable = function() {
    this._options.disabled = true;
    this._applyState();
    return this;
  };

  TextBox.prototype.enable = function() {
    this._options.disabled = false;
    this._applyState();
    return this;
  };

  TextBox.prototype.readonly = function(mode) {
    this._options.readonly = mode !== false;
    this._applyState();
    return this;
  };

  TextBox.prototype.setEditable = function(mode) {
    this._options.editable = mode !== false;
    this._applyState();
    return this;
  };

  TextBox.prototype.resize = function(width, height, silent) {
    this._options.width = width == null ? this._options.width : width;
    this._options.height = height == null ? this._options.height : height;
    this._shell.style.width = cssSize(this._options.width, 200);
    this._shell.style.height = cssSize(this._options.height, 30);
    this._field.classList.toggle('fui-textbox-label-top-field', this._options.labelPosition === 'top');
    if (!silent) {
      this._invoke('onResize', this._options.width, this._options.height);
      this._emit('resize', { width: this._options.width, height: this._options.height });
    }
    return this;
  };

  TextBox.prototype.on = function(name, listener) {
    if (typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  TextBox.prototype.off = function(name, listener) {
    var listeners = this._listeners[name];
    if (!listeners) return this;
    this._listeners[name] = listener ? listeners.filter(function(item) {
      return item !== listener;
    }) : [];
    return this;
  };

  TextBox.prototype.destroy = function() {
    var parent;
    if (this._destroyed) return;
    this._destroyed = true;
    this._editor.removeEventListener('input', this._onInput);
    this._editor.removeEventListener('focus', this._onFocus);
    this._editor.removeEventListener('blur', this._onBlur);
    this._beforeAddon.removeEventListener('click', this._onAddonClick);
    this._afterAddon.removeEventListener('click', this._onAddonClick);
    if (this._button) this._button.removeEventListener('click', this._onButtonClick);
    if (this._source.form) this._source.form.removeEventListener('reset', this._onFormReset);
    parent = this._field.parentNode;
    this._source.style.display = this._originalDisplay;
    this._source.removeAttribute('aria-hidden');
    delete this._source.__fabuiTextBox;
    parent.insertBefore(this._source, this._field);
    parent.removeChild(this._field);
    this._listeners = {};
  };

  TextBox.defaults = defaults;
  TextBox.editorDefinition = editorDefinition;
  return TextBox;
}
