export function createColorEditBoxFactory(TextBox, editorDefinitions) {
  'use strict';

  if (typeof TextBox !== 'function') {
    throw new Error('fabui.ColorEditBox requires fabui.TextBox.');
  }

  editorDefinitions = editorDefinitions || {};
  var editorDefinition = editorDefinitions.color || null;

  var localePacks = {
    en: {
      openColorText: 'Open color palette',
      saturationText: 'Saturation and brightness',
      hueText: 'Hue',
      alphaText: 'Alpha'
    },
    'zh-TW': {
      openColorText: '開啟色盤',
      saturationText: '飽和度與明度',
      hueText: '色相',
      alphaText: '透明度'
    },
    'zh-CN': {
      openColorText: '打开色板',
      saturationText: '饱和度与明度',
      hueText: '色相',
      alphaText: '透明度'
    }
  };

  var defaultPalette = [
    '#ffffff', '#000000', '#ff0000', '#ffc000', '#ffff00', '#92d050', '#00b050', '#00b0f0', '#0070c0', '#7030a0',
    '#f2f2f2', '#737373', '#ffe5e5', '#fff9e5', '#ffffe5', '#f3ffe5', '#e5fff1', '#e5f8ff', '#e5f4ff', '#f4e5ff',
    '#d9d9d9', '#595959', '#e6a1a1', '#e6d4a1', '#e5e6a1', '#c4e6a1', '#a1e6c0', '#a1d3e6', '#a1c9e6', '#c8a1e6',
    '#bfbfbf', '#404040', '#cc6666', '#ccb366', '#cccc66', '#9bcc66', '#66cc94', '#66b1cc', '#66a2cc', '#a066cc',
    '#a6a6a6', '#262626', '#b23636', '#b29436', '#b2b236', '#76b236', '#36b26e', '#3691b2', '#367eb2', '#7d36b2',
    '#8c8c8c', '#0d0d0d', '#990f0f', '#99770f', '#99990f', '#56990f', '#0f994e', '#0f7499', '#0f6099', '#5e0f99'
  ];

  var defaults = {
    iconWidth: 28,
    panelWidth: 420,
    locale: 'en',
    openColorText: null,
    saturationText: null,
    hueText: null,
    alphaText: null,
    palette: defaultPalette,
    colors: null,
    showAlpha: true,
    onChange: null,
    onSelect: null,
    onShowPanel: null,
    onHidePanel: null
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

  function normalizeLocale(name) {
    if (localePacks[name]) return name;
    if (/^zh(?:-|_)?tw/i.test(name || '')) return 'zh-TW';
    if (/^zh/i.test(name || '')) return 'zh-CN';
    return 'en';
  }

  function cssSize(value, fallback) {
    if (value == null || value === '') return fallback + 'px';
    return typeof value === 'number' ? value + 'px' : String(value);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rgbToHsv(red, green, blue) {
    var r = red / 255;
    var g = green / 255;
    var b = blue / 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var delta = max - min;
    var hue = 0;
    if (delta) {
      if (max === r) {
        hue = ((g - b) / delta) % 6;
      } else if (max === g) {
        hue = (b - r) / delta + 2;
      } else {
        hue = (r - g) / delta + 4;
      }
      hue *= 60;
      if (hue < 0) hue += 360;
    }
    return {
      h: hue,
      s: max === 0 ? 0 : delta / max,
      v: max
    };
  }

  function hsvToRgb(hue, saturation, value) {
    var chroma = value * saturation;
    var section = hue / 60;
    var x = chroma * (1 - Math.abs(section % 2 - 1));
    var m = value - chroma;
    var r = 0;
    var g = 0;
    var b = 0;
    if (section < 1) {
      r = chroma;
      g = x;
    } else if (section < 2) {
      r = x;
      g = chroma;
    } else if (section < 3) {
      g = chroma;
      b = x;
    } else if (section < 4) {
      g = x;
      b = chroma;
    } else if (section < 5) {
      r = x;
      b = chroma;
    } else {
      r = chroma;
      b = x;
    }
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }

  function createColorState(value, normalize) {
    var color = normalize(value) || '#ff0000';
    var hex = color.slice(1);
    var rgb;
    var state;
    if (hex.length === 6) hex += 'ff';
    rgb = {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16)
    };
    state = rgbToHsv(rgb.r, rgb.g, rgb.b);
    state.a = parseInt(hex.slice(6, 8), 16) / 255;
    return state;
  }

  function toHexColorPart(value) {
    var text = clamp(Math.round(value), 0, 255).toString(16);
    return text.length < 2 ? '0' + text : text;
  }

  function colorStateToHex(state, showAlpha) {
    var rgb = hsvToRgb(state.h, state.s, state.v);
    var alpha = clamp(state.a == null ? 1 : state.a, 0, 1);
    var value = '#' + toHexColorPart(rgb.r) + toHexColorPart(rgb.g) + toHexColorPart(rgb.b);
    if (showAlpha && alpha < 0.999) value += toHexColorPart(Math.round(alpha * 255));
    return value;
  }

  function ColorEditBox(element, options) {
    var source = resolveElement(element);
    var userOptions = options || {};
    var textOptions;
    var icons;
    var self = this;
    if (!(this instanceof ColorEditBox)) return new ColorEditBox(element, options);
    if (!source || !/^(INPUT|TEXTAREA)$/.test(source.tagName)) {
      throw new Error('fabui.ColorEditBox requires an input or textarea element.');
    }
    if (source.__fabuiColorEditBox) return source.__fabuiColorEditBox;

    this._source = source;
    this._listeners = {};
    this._panelVisible = false;
    this._destroyed = false;
    this._options = assign({}, defaults, userOptions);
    this._options.locale = normalizeLocale(this._options.locale);
    if (!Object.prototype.hasOwnProperty.call(userOptions, 'openColorText')) {
      this._options.openColorText = localePacks[this._options.locale].openColorText;
    }
    if (!Object.prototype.hasOwnProperty.call(userOptions, 'saturationText')) {
      this._options.saturationText = localePacks[this._options.locale].saturationText;
    }
    if (!Object.prototype.hasOwnProperty.call(userOptions, 'hueText')) {
      this._options.hueText = localePacks[this._options.locale].hueText;
    }
    if (!Object.prototype.hasOwnProperty.call(userOptions, 'alphaText')) {
      this._options.alphaText = localePacks[this._options.locale].alphaText;
    }
    this._options.palette = Array.isArray(this._options.palette) ?
      this._options.palette.slice() : defaultPalette.slice();
    if (Array.isArray(this._options.colors) && this._options.colors.length) {
      this._options.palette = this._options.colors.slice();
    }
    this._options.showAlpha = this._options.showAlpha !== false;

    icons = Array.isArray(this._options.icons) ? this._options.icons.slice() : [];
    icons.push({
      iconCls: 'fui-colorbox-trigger',
      align: 'right',
      width: this._options.iconWidth,
      title: this._options.openColorText,
      onClick: function() { self.togglePanel(); }
    });
    textOptions = assign({}, userOptions, {
      cls: ((this._options.cls || '') + ' fui-colorbox').trim(),
      icons: icons,
      onChange: function(newValue, oldValue) {
        self._syncColor();
        self._invoke('onChange', newValue, oldValue);
        self._emit('change', { value: newValue, oldValue: oldValue });
      }
    });
    this._textbox = new TextBox(source, textOptions);
    this._editor = this._textbox.textbox();
    if (editorDefinition && editorDefinition.className) {
      editorDefinition.className.split(/\s+/).forEach(function(className) {
        if (className) self._editor.classList.add(className);
      });
    }
    this._field = this._editor.closest('.fui-textbox-field');
    this._shell = this._editor.closest('.fui-textbox');
    this._trigger = this._textbox.getIcon(icons.length - 1);
    this._buildPanel();
    this._bind();
    this._syncColor();
    source.__fabuiColorEditBox = this;
  }

  ColorEditBox.prototype._buildPanel = function() {
    var self = this;
    var panel = document.createElement('div');
    var palette = document.createElement('div');
    var controls = document.createElement('div');
    var sv = document.createElement('div');
    var svMarker = document.createElement('span');
    var hue = document.createElement('div');
    var hueMarker = document.createElement('span');
    var alpha = document.createElement('div');
    var alphaFill = document.createElement('span');
    var alphaMarker = document.createElement('span');
    panel.className = 'fui-colorbox-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', this._options.openColorText);
    panel.style.width = cssSize(this._options.panelWidth, 420);
    palette.className = 'fui-colorbox-palette';
    palette.setAttribute('role', 'listbox');
    this._options.palette.forEach(function(color) {
      var normalized = self._normalizeColor(color);
      var swatch;
      if (!normalized) return;
      swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'fui-colorbox-swatch';
      swatch.setAttribute('role', 'option');
      swatch.setAttribute('aria-label', String(color));
      swatch.title = String(color);
      swatch.dataset.value = String(color);
      swatch.dataset.normalizedValue = normalized;
      swatch.style.backgroundColor = normalized;
      palette.appendChild(swatch);
    });
    controls.className = 'fui-colorbox-controls';
    sv.className = 'fui-colorbox-sv';
    sv.setAttribute('aria-label', this._options.saturationText);
    svMarker.className = 'fui-colorbox-marker fui-colorbox-sv-marker';
    sv.appendChild(svMarker);
    hue.className = 'fui-colorbox-hue';
    hue.setAttribute('aria-label', this._options.hueText);
    hueMarker.className = 'fui-colorbox-marker fui-colorbox-hue-marker';
    hue.appendChild(hueMarker);
    alpha.className = 'fui-colorbox-alpha';
    alpha.setAttribute('aria-label', this._options.alphaText);
    alphaFill.className = 'fui-colorbox-alpha-fill';
    alphaMarker.className = 'fui-colorbox-marker fui-colorbox-alpha-marker';
    alpha.appendChild(alphaFill);
    alpha.appendChild(alphaMarker);
    controls.appendChild(sv);
    controls.appendChild(hue);
    if (this._options.showAlpha) controls.appendChild(alpha);
    panel.appendChild(palette);
    panel.appendChild(controls);
    panel.setAttribute('aria-hidden', 'true');
    document.body.appendChild(panel);
    this._panel = panel;
    this._palette = palette;
    this._sv = sv;
    this._hue = hue;
    this._alpha = alpha;
  };

  ColorEditBox.prototype._bind = function() {
    var self = this;
    this._onPanelPointerDown = function(event) {
      var swatch = event.target.closest('.fui-colorbox-swatch');
      var area;
      var mode;
      if (swatch) {
        event.preventDefault();
        self.setValue(swatch.dataset.value);
        self._invoke('onSelect', self.getValue());
        self._emit('select', { value: self.getValue() });
        return;
      }
      area = event.target.closest('.fui-colorbox-sv');
      mode = 'sv';
      if (!area) {
        area = event.target.closest('.fui-colorbox-hue');
        mode = 'hue';
      }
      if (!area) {
        area = event.target.closest('.fui-colorbox-alpha');
        mode = 'alpha';
      }
      if (!area) return;
      event.preventDefault();
      self._colorDragState = {
        mode: mode,
        element: area,
        pointerId: event.pointerId
      };
      if (area.setPointerCapture && event.pointerId != null) {
        area.setPointerCapture(event.pointerId);
      }
      self._updateColorFromPointer(event);
    };
    this._onPanelPointerMove = function(event) {
      if (!self._colorDragState) return;
      event.preventDefault();
      self._updateColorFromPointer(event);
    };
    this._onPanelPointerUp = function(event) {
      var drag = self._colorDragState;
      if (!drag) return;
      if (drag.element.releasePointerCapture && drag.pointerId != null) {
        try {
          drag.element.releasePointerCapture(drag.pointerId);
        } catch (error) {
          // Pointer capture may already be released.
        }
      }
      self._colorDragState = null;
    };
    this._onDocumentPointerDown = function(event) {
      if (!self._panelVisible) return;
      if (self._panel.contains(event.target) || self._shell.contains(event.target)) return;
      self.hidePanel();
    };
    this._onDocumentKeyDown = function(event) {
      if (event.key === 'Escape' && self._panelVisible) {
        event.preventDefault();
        self.hidePanel();
        self.focus();
      }
    };
    this._onWindowResize = function() {
      if (self._panelVisible) self._positionPanel();
    };
    this._onWindowScroll = this._onWindowResize;
    this._panel.addEventListener('pointerdown', this._onPanelPointerDown);
    this._panel.addEventListener('pointermove', this._onPanelPointerMove);
    this._panel.addEventListener('pointerup', this._onPanelPointerUp);
    this._panel.addEventListener('pointercancel', this._onPanelPointerUp);
    document.addEventListener('pointerdown', this._onDocumentPointerDown, true);
    document.addEventListener('keydown', this._onDocumentKeyDown);
    window.addEventListener('resize', this._onWindowResize);
    window.addEventListener('scroll', this._onWindowScroll, true);
  };

  ColorEditBox.prototype._normalizeColor = function(value) {
    if (!editorDefinition || typeof editorDefinition.normalize !== 'function') {
      return value == null ? '' : String(value);
    }
    return editorDefinition.normalize(value);
  };

  ColorEditBox.prototype._parseColor = function(value) {
    if (!editorDefinition || typeof editorDefinition.parse !== 'function') {
      return value == null ? '' : String(value);
    }
    return editorDefinition.parse(value);
  };

  ColorEditBox.prototype._syncColor = function() {
    var normalized = this._normalizeColor(this.getValue());
    if (this._trigger) {
      this._trigger.style.setProperty('--fui-colorbox-value', normalized || 'transparent');
    }
    this._editor.style.setProperty('--fui-colorbox-value', normalized || 'transparent');
    this._editor.style.setProperty('--fg-editor-color', normalized || 'transparent');
    if (!this._colorDragState) {
      this._colorState = createColorState(normalized || '#ff0000', this._normalizeColor.bind(this));
    }
    Array.prototype.forEach.call(this._palette.children, function(swatch) {
      var selected = Boolean(normalized) && swatch.dataset.normalizedValue === normalized;
      swatch.classList.toggle('fui-colorbox-swatch-selected', selected);
      swatch.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
    this._updateColorPanelVisuals();
  };

  ColorEditBox.prototype._updateColorPanelVisuals = function() {
    var state = this._colorState || createColorState('#ff0000', this._normalizeColor.bind(this));
    var rgb = hsvToRgb(state.h, state.s, state.v);
    var svMarker = this._panel.querySelector('.fui-colorbox-sv-marker');
    var hueMarker = this._panel.querySelector('.fui-colorbox-hue-marker');
    var alphaFill = this._panel.querySelector('.fui-colorbox-alpha-fill');
    var alphaMarker = this._panel.querySelector('.fui-colorbox-alpha-marker');
    this._sv.style.backgroundColor = 'hsl(' + Math.round(state.h) + ', 100%, 50%)';
    svMarker.style.left = (state.s * 100) + '%';
    svMarker.style.top = ((1 - state.v) * 100) + '%';
    hueMarker.style.top = (state.h / 360 * 100) + '%';
    if (alphaFill) {
      alphaFill.style.backgroundImage = 'linear-gradient(to right, rgba(' +
        rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0), rgb(' +
        rgb.r + ', ' + rgb.g + ', ' + rgb.b + '))';
    }
    if (alphaMarker) alphaMarker.style.left = (state.a * 100) + '%';
  };

  ColorEditBox.prototype._updateColorFromPointer = function(event) {
    var drag = this._colorDragState;
    var rect;
    var x;
    var y;
    if (!drag || !drag.element) return;
    rect = drag.element.getBoundingClientRect();
    x = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    y = clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
    this._colorState = this._colorState ||
      createColorState(this.getValue() || '#ff0000', this._normalizeColor.bind(this));
    if (drag.mode === 'sv') {
      this._colorState.s = x;
      this._colorState.v = 1 - y;
    } else if (drag.mode === 'hue') {
      this._colorState.h = Math.min(359.999, y * 360);
    } else if (drag.mode === 'alpha') {
      this._colorState.a = x;
    }
    this._textbox.setValue(
      colorStateToHex(this._colorState, this._options.showAlpha)
    );
    this._updateColorPanelVisuals();
  };

  ColorEditBox.prototype._positionPanel = function() {
    var rect;
    var width;
    var height;
    var left;
    var top;
    if (!this._panelVisible) return;
    rect = this._shell.getBoundingClientRect();
    width = this._panel.offsetWidth;
    height = this._panel.offsetHeight;
    left = rect.left;
    top = rect.bottom + 2;
    if (left + width > window.innerWidth - 6) left = Math.max(6, window.innerWidth - width - 6);
    if (top + height > window.innerHeight - 6 && rect.top > height + 8) {
      top = rect.top - height - 2;
    }
    this._panel.style.left = Math.round(left) + 'px';
    this._panel.style.top = Math.round(top) + 'px';
  };

  ColorEditBox.prototype._invoke = function(name) {
    var callback = this._options[name];
    if (typeof callback === 'function') {
      return callback.apply(this, Array.prototype.slice.call(arguments, 1));
    }
    return undefined;
  };

  ColorEditBox.prototype._emit = function(name, detail) {
    (this._listeners[name] || []).slice().forEach(function(listener) {
      listener(detail);
    });
  };

  ColorEditBox.prototype.options = function() { return this._options; };
  ColorEditBox.prototype.textbox = function() { return this._textbox.textbox(); };
  ColorEditBox.prototype.button = function() { return this._textbox.button(); };
  ColorEditBox.prototype.panel = function() { return this._panel; };
  ColorEditBox.prototype.getIcon = function(index) { return this._textbox.getIcon(index); };
  ColorEditBox.prototype.getText = function() { return this._textbox.getText(); };
  ColorEditBox.prototype.getValue = function() { return this._textbox.getValue(); };

  ColorEditBox.prototype.setText = function(value) {
    return this.setValue(value);
  };

  ColorEditBox.prototype.setValue = function(value, silent) {
    this._textbox.setValue(this._parseColor(value), silent);
    this._syncColor();
    return this;
  };

  ColorEditBox.prototype.initValue = function(value) {
    this._textbox.initValue(this._parseColor(value));
    this._syncColor();
    return this;
  };

  ColorEditBox.prototype.clear = function() {
    return this.setValue('');
  };

  ColorEditBox.prototype.reset = function() {
    this._textbox.reset();
    this._syncColor();
    return this;
  };

  ColorEditBox.prototype.focus = function() {
    this._textbox.focus();
    return this;
  };

  ColorEditBox.prototype.showPanel = function() {
    if (this._panelVisible || this._options.disabled || this._options.readonly) return this;
    this._panelVisible = true;
    this._colorState = createColorState(
      this.getValue() || '#ff0000',
      this._normalizeColor.bind(this)
    );
    this._updateColorPanelVisuals();
    this._panel.style.display = 'flex';
    this._panel.setAttribute('aria-hidden', 'false');
    this._positionPanel();
    this._invoke('onShowPanel');
    this._emit('showPanel', { panel: this._panel });
    return this;
  };

  ColorEditBox.prototype.hidePanel = function() {
    if (!this._panelVisible) return this;
    this._panelVisible = false;
    this._panel.style.display = 'none';
    this._panel.setAttribute('aria-hidden', 'true');
    this._invoke('onHidePanel');
    this._emit('hidePanel', { panel: this._panel });
    return this;
  };

  ColorEditBox.prototype.togglePanel = function() {
    return this._panelVisible ? this.hidePanel() : this.showPanel();
  };

  ColorEditBox.prototype.resize = function(width, height) {
    if (width != null) this._options.width = width;
    if (height != null) this._options.height = height;
    this._textbox.resize(width, height);
    this._positionPanel();
    return this;
  };

  ColorEditBox.prototype.disable = function() {
    this.hidePanel();
    this._options.disabled = true;
    this._textbox.disable();
    return this;
  };

  ColorEditBox.prototype.enable = function() {
    this._options.disabled = false;
    this._textbox.enable();
    return this;
  };

  ColorEditBox.prototype.readonly = function(mode) {
    this._options.readonly = mode !== false;
    if (this._options.readonly) this.hidePanel();
    this._textbox.readonly(mode);
    return this;
  };

  ColorEditBox.prototype.setEditable = function(mode) {
    this._options.editable = mode !== false;
    this._textbox.setEditable(mode);
    return this;
  };

  ColorEditBox.prototype.on = function(name, listener) {
    if (typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  ColorEditBox.prototype.off = function(name, listener) {
    var listeners = this._listeners[name];
    if (!listeners) return this;
    this._listeners[name] = listener ? listeners.filter(function(item) {
      return item !== listener;
    }) : [];
    return this;
  };

  ColorEditBox.prototype.destroy = function() {
    if (this._destroyed) return;
    this._destroyed = true;
    this.hidePanel();
    this._panel.removeEventListener('pointerdown', this._onPanelPointerDown);
    this._panel.removeEventListener('pointermove', this._onPanelPointerMove);
    this._panel.removeEventListener('pointerup', this._onPanelPointerUp);
    this._panel.removeEventListener('pointercancel', this._onPanelPointerUp);
    document.removeEventListener('pointerdown', this._onDocumentPointerDown, true);
    document.removeEventListener('keydown', this._onDocumentKeyDown);
    window.removeEventListener('resize', this._onWindowResize);
    window.removeEventListener('scroll', this._onWindowScroll, true);
    if (this._panel.parentNode) this._panel.parentNode.removeChild(this._panel);
    delete this._source.__fabuiColorEditBox;
    this._textbox.destroy();
    this._listeners = {};
  };

  ColorEditBox.defaults = defaults;
  ColorEditBox.editorDefinition = editorDefinition;
  return ColorEditBox;
}
