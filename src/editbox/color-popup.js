var activeColorPopup = null;
var COLOR_POPUP_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];

function assignColorPopupOptions(target) {
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

function resolveColorPopupElement(element) {
  return typeof element === 'string' ? document.querySelector(element) : element;
}

function normalizeColorPopupTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return COLOR_POPUP_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

function findColorPopupTheme(element) {
  var current = resolveColorPopupElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < COLOR_POPUP_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + COLOR_POPUP_THEMES[index])) {
        return COLOR_POPUP_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

function clampColorPopup(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rgbToColorPopupHsv(red, green, blue) {
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

function hsvToColorPopupRgb(hue, saturation, value) {
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

function createColorPopupState(value, normalize) {
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
  state = rgbToColorPopupHsv(rgb.r, rgb.g, rgb.b);
  state.a = parseInt(hex.slice(6, 8), 16) / 255;
  return state;
}

function toColorPopupHexPart(value) {
  var text = clampColorPopup(Math.round(value), 0, 255).toString(16);
  return text.length < 2 ? '0' + text : text;
}

function colorPopupStateToHex(state, showAlpha) {
  var rgb = hsvToColorPopupRgb(state.h, state.s, state.v);
  var alpha = clampColorPopup(state.a == null ? 1 : state.a, 0, 1);
  var value = '#' +
    toColorPopupHexPart(rgb.r) +
    toColorPopupHexPart(rgb.g) +
    toColorPopupHexPart(rgb.b);
  if (showAlpha && alpha < 0.999) {
    value += toColorPopupHexPart(Math.round(alpha * 255));
  }
  return value;
}

export function ColorPopup(options) {
  if (!(this instanceof ColorPopup)) return new ColorPopup(options);
  this.options = assignColorPopupOptions({}, ColorPopup.defaults, options || {});
  this.destroyed = false;
  this.visible = false;
  this._openEventsBound = false;
  this.dragState = null;
  this.value = '';
  this.state = null;
  this._normalizeOptions();
  this._build();
  this.setTheme(this.options.theme);
  this._bind();
  this.render();
}

ColorPopup.defaults = {
  anchor: null,
  theme: 'inherit',
  themeSource: null,
  className: '',
  panelWidth: 420,
  ariaLabel: 'Color picker',
  saturationText: 'Saturation and brightness',
  hueText: 'Hue',
  alphaText: 'Alpha',
  palette: [],
  showAlpha: true,
  normalize: function(value) {
    return value == null ? '' : String(value);
  },
  containsTarget: null,
  openClassHost: null,
  closeOnSelect: false,
  closeOnDragEnd: false,
  onInput: null,
  onSelect: null,
  onShow: null,
  onHide: null
};

ColorPopup.prototype._normalizeOptions = function() {
  this.options.palette = Array.isArray(this.options.palette) ?
    this.options.palette.slice() :
    [];
  this.options.showAlpha = this.options.showAlpha !== false;
  if (typeof this.options.normalize !== 'function') {
    this.options.normalize = ColorPopup.defaults.normalize;
  }
};

ColorPopup.prototype._build = function() {
  var panel = document.createElement('div');
  panel.className = ('fui-colorbox-panel ' + (this.options.className || '')).trim();
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-label', this.options.ariaLabel);
  document.body.appendChild(panel);
  this.panel = panel;
};

ColorPopup.prototype._bind = function() {
  var self = this;
  this._onPanelPointerDown = function(event) {
    self._handlePointerDown(event);
  };
  this._onPanelPointerMove = function(event) {
    self._handlePointerMove(event);
  };
  this._onPanelPointerUp = function(event) {
    self._handlePointerUp(event);
  };
  this._onDocumentPointerDown = function(event) {
    if (self.visible &&
      !self.panel.contains(event.target) &&
      !self._containsTarget(event.target)) {
      self.hide();
    }
  };
  this._onDocumentKeyDown = function(event) {
    if (event.key === 'Escape' && self.visible) {
      event.preventDefault();
      self.hide();
    }
  };
  this._onWindowChange = function() {
    if (self.visible) self.position();
  };
  this.panel.addEventListener('pointerdown', this._onPanelPointerDown);
  this.panel.addEventListener('pointermove', this._onPanelPointerMove);
  this.panel.addEventListener('pointerup', this._onPanelPointerUp);
  this.panel.addEventListener('pointercancel', this._onPanelPointerUp);
};

ColorPopup.prototype._bindOpenEvents = function() {
  if (this._openEventsBound) return;
  this._openEventsBound = true;
  document.addEventListener('pointerdown', this._onDocumentPointerDown, true);
  document.addEventListener('keydown', this._onDocumentKeyDown);
  window.addEventListener('resize', this._onWindowChange);
  window.addEventListener('scroll', this._onWindowChange, true);
};

ColorPopup.prototype._unbindOpenEvents = function() {
  if (!this._openEventsBound) return;
  this._openEventsBound = false;
  document.removeEventListener('pointerdown', this._onDocumentPointerDown, true);
  document.removeEventListener('keydown', this._onDocumentKeyDown);
  window.removeEventListener('resize', this._onWindowChange);
  window.removeEventListener('scroll', this._onWindowChange, true);
};

ColorPopup.prototype._containsTarget = function(target) {
  var anchor = resolveColorPopupElement(this.options.anchor);
  if (anchor && (anchor === target || anchor.contains(target))) return true;
  return typeof this.options.containsTarget === 'function' &&
    this.options.containsTarget(target) === true;
};

ColorPopup.prototype.setOptions = function(options) {
  assignColorPopupOptions(this.options, options || {});
  this._normalizeOptions();
  this.panel.className = ('fui-colorbox-panel ' + (this.options.className || '')).trim();
  this.setTheme(this.options.theme);
  this.panel.setAttribute('aria-label', this.options.ariaLabel);
  this.render();
  return this;
};

ColorPopup.prototype.setTheme = function(theme) {
  var index;
  var source;
  this.options.theme = theme == null ? 'inherit' : String(theme);
  source = this.options.themeSource || this.options.anchor;
  this.theme = this.options.theme === 'inherit' ?
    findColorPopupTheme(source) :
    normalizeColorPopupTheme(this.options.theme);
  for (index = 0; index < COLOR_POPUP_THEMES.length; index += 1) {
    this.panel.classList.remove('fg-theme-' + COLOR_POPUP_THEMES[index]);
  }
  this.panel.classList.add('fg-theme-' + this.theme);
  return this;
};

ColorPopup.prototype.setValue = function(value) {
  var normalized = this.options.normalize(value);
  this.value = value == null ? '' : String(value);
  if (!this.dragState) {
    this.state = createColorPopupState(normalized || '#ff0000', this.options.normalize);
  }
  this._updateSelection(normalized);
  this._updateVisuals();
  return this;
};

ColorPopup.prototype.render = function() {
  var palette = document.createElement('div');
  var controls = document.createElement('div');
  var sv = document.createElement('div');
  var svMarker = document.createElement('span');
  var hue = document.createElement('div');
  var hueMarker = document.createElement('span');
  var alpha = document.createElement('div');
  var alphaFill = document.createElement('span');
  var alphaMarker = document.createElement('span');
  var index;
  var raw;
  var normalized;
  var swatch;
  palette.className = 'fui-colorbox-palette';
  palette.setAttribute('role', 'listbox');
  for (index = 0; index < this.options.palette.length; index += 1) {
    raw = this.options.palette[index];
    normalized = this.options.normalize(raw);
    if (!normalized) continue;
    swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'fui-colorbox-swatch';
    swatch.setAttribute('role', 'option');
    swatch.setAttribute('aria-label', String(raw));
    swatch.title = String(raw);
    swatch.dataset.value = String(raw);
    swatch.dataset.normalizedValue = normalized;
    swatch.style.backgroundColor = normalized;
    palette.appendChild(swatch);
  }
  controls.className = 'fui-colorbox-controls';
  sv.className = 'fui-colorbox-sv';
  sv.setAttribute('aria-label', this.options.saturationText);
  svMarker.className = 'fui-colorbox-marker fui-colorbox-sv-marker';
  sv.appendChild(svMarker);
  hue.className = 'fui-colorbox-hue';
  hue.setAttribute('aria-label', this.options.hueText);
  hueMarker.className = 'fui-colorbox-marker fui-colorbox-hue-marker';
  hue.appendChild(hueMarker);
  alpha.className = 'fui-colorbox-alpha';
  alpha.setAttribute('aria-label', this.options.alphaText);
  alphaFill.className = 'fui-colorbox-alpha-fill';
  alphaMarker.className = 'fui-colorbox-marker fui-colorbox-alpha-marker';
  alpha.appendChild(alphaFill);
  alpha.appendChild(alphaMarker);
  controls.appendChild(sv);
  controls.appendChild(hue);
  if (this.options.showAlpha) controls.appendChild(alpha);
  this.panel.textContent = '';
  this.panel.appendChild(palette);
  this.panel.appendChild(controls);
  this.paletteElement = palette;
  this.saturationElement = sv;
  this.hueElement = hue;
  this.alphaElement = alpha;
  this.panel.style.width = typeof this.options.panelWidth === 'number' ?
    this.options.panelWidth + 'px' :
    String(this.options.panelWidth || ColorPopup.defaults.panelWidth + 'px');
  this._updateSelection(this.options.normalize(this.value));
  this._updateVisuals();
  return this;
};

ColorPopup.prototype._updateSelection = function(normalized) {
  if (!this.paletteElement) return;
  Array.prototype.forEach.call(this.paletteElement.children, function(swatch) {
    var selected = Boolean(normalized) &&
      swatch.dataset.normalizedValue === normalized;
    swatch.classList.toggle('fui-colorbox-swatch-selected', selected);
    swatch.setAttribute('aria-selected', selected ? 'true' : 'false');
  });
};

ColorPopup.prototype._updateVisuals = function() {
  var state = this.state ||
    createColorPopupState('#ff0000', this.options.normalize);
  var rgb = hsvToColorPopupRgb(state.h, state.s, state.v);
  var svMarker = this.panel.querySelector('.fui-colorbox-sv-marker');
  var hueMarker = this.panel.querySelector('.fui-colorbox-hue-marker');
  var alphaFill = this.panel.querySelector('.fui-colorbox-alpha-fill');
  var alphaMarker = this.panel.querySelector('.fui-colorbox-alpha-marker');
  if (this.saturationElement) {
    this.saturationElement.style.backgroundColor =
      'hsl(' + Math.round(state.h) + ', 100%, 50%)';
  }
  if (svMarker) {
    svMarker.style.left = (state.s * 100) + '%';
    svMarker.style.top = ((1 - state.v) * 100) + '%';
  }
  if (hueMarker) hueMarker.style.top = (state.h / 360 * 100) + '%';
  if (alphaFill) {
    alphaFill.style.backgroundImage = 'linear-gradient(to right, rgba(' +
      rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0), rgb(' +
      rgb.r + ', ' + rgb.g + ', ' + rgb.b + '))';
  }
  if (alphaMarker) alphaMarker.style.left = (state.a * 100) + '%';
};

ColorPopup.prototype._handlePointerDown = function(event) {
  var swatch = event.target.closest('.fui-colorbox-swatch');
  var area;
  var mode;
  var value;
  if (!this.visible) return;
  event.preventDefault();
  event.stopPropagation();
  if (swatch) {
    value = swatch.dataset.value;
    this.setValue(value);
    if (typeof this.options.onSelect === 'function') {
      this.options.onSelect(value, this);
    }
    if (this.options.closeOnSelect) this.hide();
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
  this.dragState = {
    mode: mode,
    element: area,
    pointerId: event.pointerId
  };
  if (area.setPointerCapture && event.pointerId != null) {
    area.setPointerCapture(event.pointerId);
  }
  this._updateFromPointer(event);
};

ColorPopup.prototype._handlePointerMove = function(event) {
  if (!this.dragState) return;
  event.preventDefault();
  this._updateFromPointer(event);
};

ColorPopup.prototype._handlePointerUp = function(event) {
  var drag = this.dragState;
  if (!drag) return;
  if (drag.element.releasePointerCapture && drag.pointerId != null) {
    try {
      drag.element.releasePointerCapture(drag.pointerId);
    } catch (error) {
      // Pointer capture may already be released.
    }
  }
  this.dragState = null;
  event.preventDefault();
  if (this.options.closeOnDragEnd) this.hide();
};

ColorPopup.prototype._updateFromPointer = function(event) {
  var drag = this.dragState;
  var rect;
  var x;
  var y;
  var value;
  if (!drag || !drag.element) return;
  rect = drag.element.getBoundingClientRect();
  x = clampColorPopup(
    (event.clientX - rect.left) / Math.max(1, rect.width),
    0,
    1
  );
  y = clampColorPopup(
    (event.clientY - rect.top) / Math.max(1, rect.height),
    0,
    1
  );
  this.state = this.state ||
    createColorPopupState(this.value || '#ff0000', this.options.normalize);
  if (drag.mode === 'sv') {
    this.state.s = x;
    this.state.v = 1 - y;
  } else if (drag.mode === 'hue') {
    this.state.h = Math.min(359.999, y * 360);
  } else if (drag.mode === 'alpha') {
    this.state.a = x;
  }
  value = colorPopupStateToHex(this.state, this.options.showAlpha);
  this.value = value;
  this._updateSelection(this.options.normalize(value));
  this._updateVisuals();
  if (typeof this.options.onInput === 'function') {
    this.options.onInput(value, this);
  }
};

ColorPopup.prototype.show = function() {
  var openClassHost;
  if (this.destroyed || this.visible) return this;
  if (activeColorPopup && activeColorPopup !== this) activeColorPopup.hide();
  this.setTheme(this.options.theme);
  this.visible = true;
  this.panel.hidden = false;
  this._bindOpenEvents();
  activeColorPopup = this;
  openClassHost = resolveColorPopupElement(this.options.openClassHost);
  if (openClassHost) openClassHost.classList.add('fui-colorbox-open');
  this.position();
  if (typeof this.options.onShow === 'function') this.options.onShow(this);
  return this;
};

ColorPopup.themes = COLOR_POPUP_THEMES.slice();

ColorPopup.prototype.hide = function() {
  var openClassHost;
  if (!this.visible) return this;
  this.visible = false;
  this.dragState = null;
  this.panel.hidden = true;
  this._unbindOpenEvents();
  if (activeColorPopup === this) activeColorPopup = null;
  openClassHost = resolveColorPopupElement(this.options.openClassHost);
  if (openClassHost) openClassHost.classList.remove('fui-colorbox-open');
  if (typeof this.options.onHide === 'function') this.options.onHide(this);
  return this;
};

ColorPopup.prototype.toggle = function() {
  return this.visible ? this.hide() : this.show();
};

ColorPopup.prototype.isOpen = function() {
  return this.visible;
};

ColorPopup.prototype.handleKeyDown = function(event) {
  if ((event.key === 'ArrowDown' && (event.altKey || event.metaKey)) ||
    event.key === 'F4') {
    event.preventDefault();
    this.show();
    return true;
  }
  if (event.key === 'Escape' && this.visible) {
    event.preventDefault();
    this.hide();
    return true;
  }
  return false;
};

ColorPopup.prototype.position = function() {
  var anchor = resolveColorPopupElement(this.options.anchor);
  var rect;
  var width;
  var height;
  var left;
  var top;
  if (!this.visible || !anchor) return this;
  rect = anchor.getBoundingClientRect();
  width = this.panel.offsetWidth;
  height = this.panel.offsetHeight;
  left = rect.left;
  top = rect.bottom + 2;
  if (left + width > window.innerWidth - 6) {
    left = Math.max(6, window.innerWidth - width - 6);
  }
  if (top + height > window.innerHeight - 6 && rect.top > height + 8) {
    top = rect.top - height - 2;
  }
  this.panel.style.left = Math.round(left) + 'px';
  this.panel.style.top = Math.round(top) + 'px';
  return this;
};

ColorPopup.prototype.destroy = function() {
  if (this.destroyed) return;
  this.hide();
  this.destroyed = true;
  this.panel.removeEventListener('pointerdown', this._onPanelPointerDown);
  this.panel.removeEventListener('pointermove', this._onPanelPointerMove);
  this.panel.removeEventListener('pointerup', this._onPanelPointerUp);
  this.panel.removeEventListener('pointercancel', this._onPanelPointerUp);
  this._unbindOpenEvents();
  if (this.panel.parentNode) this.panel.parentNode.removeChild(this.panel);
};
