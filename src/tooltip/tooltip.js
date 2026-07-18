var TOOLTIP_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black'
];

function assignTooltipOptions(target) {
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

function resolveTooltipElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function tooltipNumber(value, fallback) {
  value = Number(value);
  return isFinite(value) ? value : fallback;
}

function tooltipBooleanAttribute(element, name) {
  var value = element.getAttribute(name);
  if (value == null) return undefined;
  return value === '' || value === name || value === 'true' || value === '1';
}

function restoreTooltipAttribute(element, name, value) {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

export function normalizeTooltipTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return TOOLTIP_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

export function normalizeTooltipPosition(value) {
  value = String(value || 'bottom').toLowerCase();
  return ['left', 'right', 'top', 'bottom'].indexOf(value) >= 0 ? value : 'bottom';
}

export function normalizeTooltipValign(value) {
  return String(value || 'middle').toLowerCase() === 'top' ? 'top' : 'middle';
}

function findTooltipTheme(element) {
  var current = resolveTooltipElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < TOOLTIP_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + TOOLTIP_THEMES[index])) {
        return TOOLTIP_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

export function createTooltipFactory(Control, registerControl, unregisterControl) {
  var activeTooltip = null;

  function FabTooltip(element, options) {
    var host = resolveTooltipElement(element);
    if (!(this instanceof FabTooltip)) return new FabTooltip(element, options);
    if (!host) throw new Error('fabui.Tooltip requires a host element.');
    if (host.__fabuiTooltip) return host.__fabuiTooltip;
    Control.call(this);
    this.hostElement = host;
    this._listeners = {};
    this._destroyed = false;
    this._visible = false;
    this._showTimer = null;
    this._hideTimer = null;
    this._positionFrame = null;
    this._trackPoint = null;
    this._openEventsBound = false;
    this._original = {
      title: host.getAttribute('title'),
      ariaDescribedBy: host.getAttribute('aria-describedby'),
      className: host.getAttribute('class')
    };
    this._themeSource = host.parentElement || document.body;
    this._options = assignTooltipOptions(
      {},
      FabTooltip.defaults,
      this._readElementOptions(),
      options || {}
    );
    this._options.position = normalizeTooltipPosition(this._options.position);
    this._options.valign = normalizeTooltipValign(this._options.valign);
    this._options.showDelay = Math.max(0, tooltipNumber(this._options.showDelay, 200));
    this._options.hideDelay = Math.max(0, tooltipNumber(this._options.hideDelay, 100));
    this._options.deltaX = this._options.deltaX == null ? 0 : this._options.deltaX;
    this._options.deltaY = this._options.deltaY == null ? 0 : this._options.deltaY;
    this._build();
    this._bind();
    host.__fabuiTooltip = this;
    registerControl(host, this);
    this.setTheme(this._options.theme);
  }

  FabTooltip.prototype = Object.create(Control.prototype);
  FabTooltip.prototype.constructor = FabTooltip;

  FabTooltip.prototype._readElementOptions = function() {
    var host = this.hostElement;
    var options = {};
    var value;
    var parsed;
    value = host.getAttribute('position') || host.getAttribute('data-position');
    if (value) options.position = value;
    value = host.getAttribute('valign') || host.getAttribute('data-valign');
    if (value) options.valign = value;
    value = host.getAttribute('content') || host.getAttribute('data-content');
    if (value != null) options.content = value;
    value = host.getAttribute('showEvent') || host.getAttribute('data-show-event');
    if (value) options.showEvent = value;
    value = host.getAttribute('hideEvent') || host.getAttribute('data-hide-event');
    if (value) options.hideEvent = value;
    value = host.getAttribute('theme') || host.getAttribute('data-theme');
    if (value) options.theme = value;
    parsed = tooltipBooleanAttribute(host, 'trackMouse');
    if (parsed == null) parsed = tooltipBooleanAttribute(host, 'data-track-mouse');
    if (parsed != null) options.trackMouse = parsed;
    [
      ['deltaX', 'data-delta-x'],
      ['deltaY', 'data-delta-y'],
      ['showDelay', 'data-show-delay'],
      ['hideDelay', 'data-hide-delay']
    ].forEach(function(names) {
      var attribute = host.getAttribute(names[0]);
      if (attribute == null) attribute = host.getAttribute(names[1]);
      if (attribute != null && attribute !== '') options[names[0]] = Number(attribute);
    });
    if (options.content == null) options.content = this._original.title;
    return options;
  };

  FabTooltip.prototype._build = function() {
    this.hostElement.classList.add('fui-tooltip-target');
    if (this._original.title != null) this.hostElement.removeAttribute('title');
  };

  FabTooltip.prototype._bindEventNames = function(value, handler) {
    var self = this;
    String(value || '').split(/\s+/).forEach(function(name) {
      if (name) self.addEventListener(self.hostElement, name, handler);
    });
  };

  FabTooltip.prototype._bind = function() {
    var self = this;
    this._onShowEvent = function(event) {
      self.show(event);
    };
    this._onHideEvent = function(event) {
      self.hide(event);
    };
    this._onMouseMove = function(event) {
      self._trackPoint = {
        pageX: event.pageX,
        pageY: event.pageY
      };
      if (self._options.trackMouse && self._visible) self._scheduleReposition();
    };
    this._onDocumentPointerDown = function(event) {
      if (
        self.hostElement.contains(event.target) ||
        (self.tipElement && self.tipElement.contains(event.target))
      ) {
        return;
      }
      self._hideNow(event);
    };
    this._onDocumentKeyDown = function(event) {
      if (event.key === 'Escape') self._hideNow(event);
    };
    this._onViewportChange = function() {
      if (self._visible) self._scheduleReposition();
    };
    this._bindEventNames(this._options.showEvent, this._onShowEvent);
    this._bindEventNames(this._options.hideEvent, this._onHideEvent);
    this.addEventListener(this.hostElement, 'mousemove', this._onMouseMove);
  };

  FabTooltip.prototype._bindOpenEvents = function() {
    if (this._openEventsBound) return;
    this._openEventsBound = true;
    this.addEventListener(document, 'pointerdown', this._onDocumentPointerDown, true);
    this.addEventListener(document, 'keydown', this._onDocumentKeyDown);
    this.addEventListener(window, 'resize', this._onViewportChange);
    this.addEventListener(window, 'scroll', this._onViewportChange, true);
  };

  FabTooltip.prototype._unbindOpenEvents = function() {
    if (!this._openEventsBound) return;
    this._openEventsBound = false;
    this.removeEventListener(document, 'pointerdown', this._onDocumentPointerDown, true);
    this.removeEventListener(document, 'keydown', this._onDocumentKeyDown);
    this.removeEventListener(window, 'resize', this._onViewportChange);
    this.removeEventListener(window, 'scroll', this._onViewportChange, true);
  };

  FabTooltip.prototype._ensureTip = function() {
    var tip;
    var content;
    var outer;
    var arrow;
    if (this.tipElement) return this.tipElement;
    tip = document.createElement('div');
    content = document.createElement('div');
    outer = document.createElement('div');
    arrow = document.createElement('div');
    tip.id = 'fui-tooltip-' + FabTooltip._nextId;
    FabTooltip._nextId += 1;
    tip.className = 'fui-tooltip';
    tip.setAttribute('role', 'tooltip');
    tip.tabIndex = -1;
    tip.hidden = true;
    content.className = 'fui-tooltip-content';
    outer.className = 'fui-tooltip-arrow-outer';
    arrow.className = 'fui-tooltip-arrow';
    tip.appendChild(content);
    tip.appendChild(outer);
    tip.appendChild(arrow);
    document.body.appendChild(tip);
    this.tipElement = tip;
    this.contentElement = content;
    this.arrowOuterElement = outer;
    this.arrowElement = arrow;
    this.hostElement.setAttribute('aria-describedby', tip.id);
    registerControl(tip, this);
    this.setTheme(this._options.theme);
    return tip;
  };

  FabTooltip.prototype._clearTimers = function() {
    if (this._showTimer != null) {
      clearTimeout(this._showTimer);
      this._showTimer = null;
    }
    if (this._hideTimer != null) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }
  };

  FabTooltip.prototype._scheduleReposition = function() {
    var self = this;
    if (this._positionFrame != null) return;
    this._positionFrame = requestAnimationFrame(function() {
      self._positionFrame = null;
      if (self._visible) self.reposition();
    });
  };

  FabTooltip.prototype._resolveContent = function() {
    return typeof this._options.content === 'function' ?
      this._options.content.call(this.hostElement) :
      this._options.content;
  };

  FabTooltip.prototype._resolveDelta = function(value, position) {
    if (typeof value === 'function') value = value.call(this.hostElement, position);
    return tooltipNumber(value, 0);
  };

  FabTooltip.prototype._measurePosition = function(position) {
    var tipRect = this.tipElement.getBoundingClientRect();
    var hostRect = this.hostElement.getBoundingClientRect();
    var trackMouse = this._options.trackMouse && this._trackPoint;
    var deltaX = this._resolveDelta(this._options.deltaX, position);
    var deltaY = this._resolveDelta(this._options.deltaY, position);
    var pageLeft = window.pageXOffset || document.documentElement.scrollLeft || 0;
    var pageTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    var hostLeft = trackMouse ? this._trackPoint.pageX : hostRect.left + pageLeft;
    var hostTop = trackMouse ? this._trackPoint.pageY : hostRect.top + pageTop;
    var hostWidth = trackMouse ? 0 : hostRect.width;
    var hostHeight = trackMouse ? 0 : hostRect.height;
    var gap = 12 + (trackMouse ? 12 : 0);
    var left = hostLeft + deltaX;
    var top = hostTop + deltaY;
    if (position === 'right') {
      left += hostWidth + gap;
      if (this._options.valign === 'middle') top -= (tipRect.height - hostHeight) / 2;
    } else if (position === 'left') {
      left -= tipRect.width + gap;
      if (this._options.valign === 'middle') top -= (tipRect.height - hostHeight) / 2;
    } else if (position === 'top') {
      left -= (tipRect.width - hostWidth) / 2;
      top -= tipRect.height + gap;
    } else {
      left -= (tipRect.width - hostWidth) / 2;
      top += hostHeight + gap;
    }
    return {
      left: left,
      top: top,
      width: tipRect.width,
      height: tipRect.height,
      anchorX: hostLeft + hostWidth / 2,
      anchorY: hostTop + hostHeight / 2
    };
  };

  FabTooltip.prototype._choosePosition = function(position) {
    var pageLeft = window.pageXOffset || document.documentElement.scrollLeft || 0;
    var pageTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    var viewportRight = pageLeft + document.documentElement.clientWidth;
    var viewportBottom = pageTop + document.documentElement.clientHeight;
    var measured = this._measurePosition(position);
    var opposite;
    if (position === 'top' && measured.top < pageTop) opposite = 'bottom';
    if (position === 'bottom' && measured.top + measured.height > viewportBottom) opposite = 'top';
    if (position === 'left' && measured.left < pageLeft) opposite = 'right';
    if (position === 'right' && measured.left + measured.width > viewportRight) opposite = 'left';
    if (opposite) {
      position = opposite;
      measured = this._measurePosition(position);
    }
    measured.left = Math.max(pageLeft, Math.min(measured.left, viewportRight - measured.width));
    measured.top = Math.max(pageTop, Math.min(measured.top, viewportBottom - measured.height));
    measured.position = position;
    return measured;
  };

  FabTooltip.prototype._applyArrowPosition = function(measured) {
    var tip = this.tipElement;
    var offset;
    tip.classList.remove(
      'fui-tooltip-left',
      'fui-tooltip-right',
      'fui-tooltip-top',
      'fui-tooltip-bottom'
    );
    tip.classList.add('fui-tooltip-' + measured.position);
    this.arrowOuterElement.style.left = '';
    this.arrowOuterElement.style.top = '';
    this.arrowElement.style.left = '';
    this.arrowElement.style.top = '';
    if (measured.position === 'top' || measured.position === 'bottom') {
      offset = measured.anchorX - measured.left;
      offset = Math.max(7, Math.min(offset, measured.width - 7));
      this.arrowOuterElement.style.left = offset + 'px';
      this.arrowElement.style.left = offset + 'px';
    } else {
      offset = measured.anchorY - measured.top;
      offset = Math.max(7, Math.min(offset, measured.height - 7));
      this.arrowOuterElement.style.top = offset + 'px';
      this.arrowElement.style.top = offset + 'px';
    }
  };

  FabTooltip.prototype._fire = function(name, detail) {
    var callback = this._options['on' + name];
    var eventName = name.toLowerCase();
    var args = assignTooltipOptions({ tooltip: this }, detail || {});
    if (typeof callback === 'function') {
      if (name === 'Update') callback.call(this.hostElement, args.content);
      else if (name === 'Position') callback.call(this.hostElement, args.left, args.top);
      else if (name === 'Destroy') callback.call(this.hostElement);
      else callback.call(this.hostElement, args.originalEvent);
    }
    (this._listeners[eventName] || []).slice().forEach(function(listener) {
      listener.call(this, args);
    }, this);
  };

  FabTooltip.prototype.show = function(event) {
    var self = this;
    var performShow;
    if (this._destroyed || !this.hostElement.isConnected) return this;
    if (event && event.pageX != null && event.pageY != null) {
      this._trackPoint = { pageX: event.pageX, pageY: event.pageY };
    }
    this._clearTimers();
    if (activeTooltip && activeTooltip !== this) activeTooltip._hideNow(event);
    activeTooltip = this;
    performShow = function() {
      self._showTimer = null;
      self._ensureTip();
      self.update();
      self.tipElement.hidden = false;
      self.tipElement.style.visibility = 'hidden';
      self.reposition();
      self.tipElement.style.visibility = '';
      self._visible = true;
      self._bindOpenEvents();
      self._fire('Show', {
        originalEvent: event || null,
        tip: self.tipElement
      });
    };
    if (this._options.showDelay > 0) {
      this._showTimer = setTimeout(performShow, this._options.showDelay);
    } else {
      performShow();
    }
    return this;
  };

  FabTooltip.prototype.hide = function(event) {
    var self = this;
    var performHide;
    if (this._destroyed) return this;
    if (this._showTimer != null) {
      clearTimeout(this._showTimer);
      this._showTimer = null;
    }
    if (!this.tipElement || !this._visible) {
      if (activeTooltip === this) activeTooltip = null;
      return this;
    }
    if (this._hideTimer != null) clearTimeout(this._hideTimer);
    performHide = function() {
      self._hideTimer = null;
      self._hideNow(event);
    };
    if (this._options.hideDelay > 0) {
      this._hideTimer = setTimeout(performHide, this._options.hideDelay);
    } else {
      performHide();
    }
    return this;
  };

  FabTooltip.prototype._hideNow = function(event) {
    this._clearTimers();
    if (this._positionFrame != null) {
      cancelAnimationFrame(this._positionFrame);
      this._positionFrame = null;
    }
    if (!this.tipElement || !this._visible) {
      if (activeTooltip === this) activeTooltip = null;
      return this;
    }
    this.tipElement.hidden = true;
    this._visible = false;
    this._unbindOpenEvents();
    if (activeTooltip === this) activeTooltip = null;
    this._fire('Hide', {
      originalEvent: event || null,
      tip: this.tipElement
    });
    return this;
  };

  FabTooltip.prototype.update = function(content) {
    var resolved;
    if (arguments.length) this._options.content = content;
    if (!this.tipElement) return this;
    resolved = this._resolveContent();
    this.contentElement.innerHTML = resolved == null ? '' : String(resolved);
    this._fire('Update', {
      content: resolved,
      tip: this.tipElement
    });
    if (this._visible) this.reposition();
    return this;
  };

  FabTooltip.prototype.reposition = function() {
    var measured;
    if (!this.tipElement || this.tipElement.hidden || !this.hostElement.isConnected) return this;
    measured = this._choosePosition(normalizeTooltipPosition(this._options.position));
    this._applyArrowPosition(measured);
    this.tipElement.style.left = Math.round(measured.left) + 'px';
    this.tipElement.style.top = Math.round(measured.top) + 'px';
    this.tipElement.style.zIndex = String(tooltipNumber(this._options.zIndex, 9900000));
    this.position = measured.position;
    this._fire('Position', {
      left: Math.round(measured.left),
      top: Math.round(measured.top),
      position: measured.position,
      tip: this.tipElement
    });
    return this;
  };

  FabTooltip.prototype.tip = function() {
    return this.tipElement || null;
  };

  FabTooltip.prototype.arrow = function() {
    if (!this.tipElement) return null;
    return {
      outer: this.arrowOuterElement,
      inner: this.arrowElement
    };
  };

  FabTooltip.prototype.options = function() {
    return this._options;
  };

  FabTooltip.prototype.setTheme = function(theme) {
    var index;
    this._options.theme = theme == null ? 'inherit' : theme;
    this.theme = this._options.theme === 'inherit' ?
      findTooltipTheme(this._themeSource) :
      normalizeTooltipTheme(this._options.theme);
    if (!this.tipElement) return this;
    for (index = 0; index < TOOLTIP_THEMES.length; index += 1) {
      this.tipElement.classList.remove('fg-theme-' + TOOLTIP_THEMES[index]);
    }
    this.tipElement.classList.add('fg-theme-' + this.theme);
    return this;
  };

  FabTooltip.prototype.on = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!name || typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  FabTooltip.prototype.off = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!this._listeners[name]) return this;
    this._listeners[name] = listener ?
      this._listeners[name].filter(function(item) { return item !== listener; }) :
      [];
    return this;
  };

  FabTooltip.prototype.destroy = function() {
    var host = this.hostElement;
    if (this._destroyed) return;
    this._destroyed = true;
    this._hideNow();
    this.removeEventListener();
    unregisterControl(host, this);
    if (this.tipElement) {
      unregisterControl(this.tipElement, this);
      this.tipElement.remove();
    }
    delete host.__fabuiTooltip;
    restoreTooltipAttribute(host, 'class', this._original.className);
    restoreTooltipAttribute(host, 'title', this._original.title);
    restoreTooltipAttribute(host, 'aria-describedby', this._original.ariaDescribedBy);
    this._fire('Destroy');
    this._listeners = {};
    this.tipElement = null;
    this.contentElement = null;
    this.arrowOuterElement = null;
    this.arrowElement = null;
  };

  FabTooltip.prototype.dispose = FabTooltip.prototype.destroy;

  FabTooltip._nextId = 1;
  FabTooltip.defaults = {
    position: 'bottom',
    valign: 'middle',
    content: null,
    trackMouse: false,
    deltaX: 0,
    deltaY: 0,
    showEvent: 'mouseenter',
    hideEvent: 'mouseleave',
    showDelay: 200,
    hideDelay: 100,
    zIndex: 9900000,
    theme: 'inherit',
    onShow: null,
    onHide: null,
    onUpdate: null,
    onPosition: null,
    onDestroy: null
  };
  FabTooltip.getControl = function(element) {
    element = resolveTooltipElement(element);
    return element && element.__fabuiTooltip ? element.__fabuiTooltip : null;
  };
  FabTooltip.normalizeTheme = normalizeTooltipTheme;
  return FabTooltip;
}
