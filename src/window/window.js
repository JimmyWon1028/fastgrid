var WINDOW_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];
var nextWindowZIndex = 9000;

function assignWindowOptions(target) {
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

function resolveWindowElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function toNumber(value, fallback) {
  value = Number(value);
  return isFinite(value) ? value : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function restoreWindowAttribute(element, name, value) {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

export function normalizeWindowTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return WINDOW_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

export function constrainWindowRect(rect, bounds, minimums) {
  var result = assignWindowOptions({}, rect);
  var maxWidth = Math.max(0, toNumber(bounds && bounds.width, result.width));
  var maxHeight = Math.max(0, toNumber(bounds && bounds.height, result.height));
  var minWidth = Math.min(maxWidth, Math.max(80, toNumber(minimums && minimums.width, 200)));
  var minHeight = Math.min(maxHeight, Math.max(48, toNumber(minimums && minimums.height, 100)));
  result.width = clamp(toNumber(result.width, minWidth), minWidth, maxWidth);
  result.height = clamp(toNumber(result.height, minHeight), minHeight, maxHeight);
  result.left = clamp(toNumber(result.left, 0), 0, Math.max(0, maxWidth - result.width));
  result.top = clamp(toNumber(result.top, 0), 0, Math.max(0, maxHeight - result.height));
  return result;
}

export function calculateWindowResizeRect(rect, dx, dy, direction) {
  var result = assignWindowOptions({}, rect);
  direction = String(direction || '').toLowerCase();
  dx = toNumber(dx, 0);
  dy = toNumber(dy, 0);
  if (direction.indexOf('e') >= 0) result.width += dx;
  if (direction.indexOf('s') >= 0) result.height += dy;
  if (direction.indexOf('w') >= 0) {
    result.left += dx;
    result.width -= dx;
  }
  if (direction.indexOf('n') >= 0) {
    result.top += dy;
    result.height -= dy;
  }
  return result;
}

export function calculateMinimizedWindowRect(bounds, preferredWidth) {
  var width = Math.max(0, toNumber(bounds && bounds.width, 0));
  var height = Math.max(0, toNumber(bounds && bounds.height, 0));
  var minimizedHeight = Math.min(38, height);
  var minimizedWidth = Math.min(
    width,
    Math.max(80, Math.min(220, toNumber(preferredWidth, 220)))
  );
  return {
    left: 0,
    top: Math.max(0, height - minimizedHeight),
    width: minimizedWidth,
    height: minimizedHeight
  };
}

export function calculateMinimizedTargetRect(target, bounds) {
  var boundsWidth = Math.max(0, toNumber(bounds && bounds.width, 0));
  var boundsHeight = Math.max(0, toNumber(bounds && bounds.height, 0));
  var width = toNumber(target && target.width, 0);
  var height = toNumber(target && target.height, 0);
  var left;
  var top;
  if (boundsWidth <= 0 || boundsHeight <= 0 || width <= 0 || height <= 0) {
    return null;
  }
  width = Math.min(boundsWidth, width);
  height = Math.min(boundsHeight, height);
  left = clamp(
    toNumber(target && target.left, 0),
    0,
    Math.max(0, boundsWidth - width)
  );
  top = clamp(
    toNumber(target && target.top, 0),
    0,
    Math.max(0, boundsHeight - height)
  );
  return {
    left: left,
    top: top,
    width: width,
    height: height
  };
}

function findWindowTheme(element) {
  var current = resolveWindowElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < WINDOW_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + WINDOW_THEMES[index])) {
        return WINDOW_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

export function createWindowFactory(Control, registerControl, unregisterControl) {
  var localePacks = {
    en: {
      close: 'Close',
      collapse: 'Collapse',
      expand: 'Expand',
      minimize: 'Minimize',
      maximize: 'Maximize',
      restore: 'Restore'
    },
    'zh-TW': {
      close: '關閉',
      collapse: '收合',
      expand: '展開',
      minimize: '最小化',
      maximize: '最大化',
      restore: '還原'
    },
    'zh-CN': {
      close: '关闭',
      collapse: '收合',
      expand: '展开',
      minimize: '最小化',
      maximize: '最大化',
      restore: '还原'
    }
  };

  function normalizeLocale(value) {
    value = String(value || 'en').trim().replace(/_/g, '-');
    if (localePacks[value]) return value;
    if (/^zh-(?:tw|hant)(?:-|$)/i.test(value)) return 'zh-TW';
    if (/^zh-(?:cn|hans)(?:-|$)/i.test(value) || /^zh$/i.test(value)) return 'zh-CN';
    return 'en';
  }

  function FabWindow(element, options) {
    var host = resolveWindowElement(element);
    var initiallyCollapsed;
    var initiallyMaximized;
    var initiallyMinimized;
    if (!(this instanceof FabWindow)) return new FabWindow(element, options);
    if (!host) throw new Error('fabui.Window requires a host element.');
    if (host.__fabuiWindow) return host.__fabuiWindow;
    Control.call(this);
    this.hostElement = host;
    this._listeners = {};
    this._destroyed = false;
    this._interaction = null;
    this._animationStartTimer = null;
    this._animationEndTimer = null;
    this._normalRect = null;
    this._minimizedRestoreRect = null;
    this._minimizeTargetActive = false;
    this._resizeProxy = null;
    this._onMinimizedViewportResize = null;
    this._originalParent = host.parentNode;
    this._originalNextSibling = host.nextSibling;
    this._originalStyle = host.getAttribute('style');
    this._originalClass = host.getAttribute('class');
    this._originalTitle = host.getAttribute('title');
    this._themeSource = this._originalParent && this._originalParent.nodeType === 1 ?
      this._originalParent :
      document.body;
    this.options = assignWindowOptions({}, FabWindow.defaults, this._readElementOptions(), options || {});
    this.options.locale = normalizeLocale(this.options.locale);
    initiallyCollapsed = this.options.collapsed === true;
    initiallyMaximized = this.options.maximized === true;
    initiallyMinimized = this.options.minimized === true;
    this.options.collapsed = false;
    this.options.maximized = false;
    this.options.minimized = false;
    this._build();
    this._bind();
    host.__fabuiWindow = this;
    registerControl(host, this);
    registerControl(this.windowElement, this);
    this.setTitle(this.options.title);
    this.setLocale(this.options.locale, this.options.messages);
    this.setTheme(this.options.theme);
    this.resize(this.options.width, this.options.height, true);
    if (this.options.left == null || this.options.top == null) {
      this.center(true);
    } else {
      this.move({ left: this.options.left, top: this.options.top }, true);
    }
    if (this.options.closed) {
      this._setVisible(false);
    } else {
      this.open(true);
      if (initiallyCollapsed) this.collapse();
      if (initiallyMaximized) this.maximize();
      if (initiallyMinimized) this.minimize();
    }
  }

  FabWindow.prototype = Object.create(Control.prototype);
  FabWindow.prototype.constructor = FabWindow;

  FabWindow.prototype._readElementOptions = function() {
    var host = this.hostElement;
    var options = {};
    var title = host.getAttribute('title');
    var width = parseFloat(host.style.width);
    var height = parseFloat(host.style.height);
    if (title) options.title = title;
    if (isFinite(width)) options.width = width;
    if (isFinite(height)) options.height = height;
    return options;
  };

  FabWindow.prototype._build = function() {
    var wrapper = document.createElement('div');
    var mask = document.createElement('div');
    var header = document.createElement('div');
    var icon = document.createElement('span');
    var title = document.createElement('div');
    var tools = document.createElement('div');
    var footer = document.createElement('div');
    var container = this.options.inline && this._originalParent ?
      this._originalParent :
      document.body;
    wrapper.className = 'fui-window' + (this.options.cls ? ' ' + this.options.cls : '');
    wrapper.tabIndex = -1;
    wrapper.setAttribute('role', 'dialog');
    mask.className = 'fui-window-mask';
    header.className = 'fui-window-header';
    icon.className = 'fui-window-icon';
    title.className = 'fui-window-title';
    tools.className = 'fui-window-tools';
    footer.className = 'fui-window-footer';
    header.appendChild(icon);
    header.appendChild(title);
    header.appendChild(tools);
    wrapper.appendChild(header);
    wrapper.appendChild(this.hostElement);
    wrapper.appendChild(footer);
    container.appendChild(mask);
    container.appendChild(wrapper);
    this.hostElement.classList.add('fui-window-body');
    this.hostElement.removeAttribute('title');
    this.hostElement.style.display = '';
    this.windowElement = wrapper;
    this.maskElement = mask;
    this.headerElement = header;
    this.iconElement = icon;
    this.titleElement = title;
    this.toolsElement = tools;
    this.footerElement = footer;
    this._renderTools();
    this._renderFooter();
    this._renderResizeHandles();
    this._applyStructureOptions();
  };

  FabWindow.prototype._applyStructureOptions = function() {
    var border = this.options.border;
    this.windowElement.classList.toggle('fui-window-no-border', border === false);
    this.windowElement.classList.toggle('fui-window-thin-border', border === 'thin');
    this.windowElement.classList.toggle('fui-window-shadow', this.options.shadow !== false);
    this.windowElement.classList.toggle('fui-window-inline', this.options.inline === true);
    this.maskElement.classList.toggle('fui-window-inline', this.options.inline === true);
    this.windowElement.classList.toggle('fui-window-fixed', this.options.fixed === true);
    this.windowElement.setAttribute('aria-modal', this.options.modal === true ? 'true' : 'false');
    this.headerElement.hidden = this.options.noheader === true;
    this.setIcon(this.options.iconCls);
  };

  FabWindow.prototype._createTool = function(type, enabled, handler) {
    var self = this;
    var button;
    if (!enabled) return;
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'fui-window-tool fui-window-tool-' + type;
    button.setAttribute('data-window-tool', type);
    button.addEventListener('click', function(event) {
      event.stopPropagation();
      handler.call(self);
    });
    this.toolsElement.appendChild(button);
  };

  FabWindow.prototype._renderTools = function() {
    var self = this;
    var customTools = Array.isArray(this.options.tools) ? this.options.tools : [];
    this.toolsElement.textContent = '';
    customTools.forEach(function(tool, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = ('fui-window-tool fui-window-tool-custom ' + (tool.iconCls || '')).trim();
      button.textContent = tool.text || '';
      button.title = tool.title || tool.text || '';
      button.setAttribute('aria-label', tool.ariaLabel || tool.title || tool.text || ('Tool ' + (index + 1)));
      button.addEventListener('click', function(event) {
        event.stopPropagation();
        if (typeof tool.onClick === 'function') tool.onClick.call(self, event, self);
        else if (typeof tool.handler === 'function') tool.handler.call(self, event, self);
      });
      self.toolsElement.appendChild(button);
    });
    this._createTool('collapse', this.options.collapsible, function() {
      if (this.options.collapsed) this.expand();
      else this.collapse();
    });
    this._createTool('minimize', this.options.minimizable, function() {
      if (this.options.minimized) this.restore();
      else this.minimize();
    });
    this._createTool('maximize', this.options.maximizable, function() {
      if (this.options.maximized) this.restore();
      else this.maximize();
    });
    this._createTool('close', this.options.closable, this.close);
    this.headerElement.style.setProperty(
      '--fui-window-tools-width',
      Math.max(0, this.toolsElement.childNodes.length * 20 + 4) + 'px'
    );
  };

  FabWindow.prototype._renderFooter = function() {
    var footer = this.options.footer;
    this.footerElement.textContent = '';
    if (footer && footer.nodeType === 1) {
      this.footerElement.appendChild(footer);
    } else if (footer != null && footer !== '') {
      this.footerElement.textContent = String(footer);
    }
    this.footerElement.hidden = !this.footerElement.childNodes.length;
  };

  FabWindow.prototype._renderResizeHandles = function() {
    var self = this;
    ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'].forEach(function(direction) {
      var handle = document.createElement('div');
      handle.className = 'fui-window-resize fui-window-resize-' + direction;
      handle.setAttribute('data-resize-direction', direction);
      self.windowElement.appendChild(handle);
    });
  };

  FabWindow.prototype._showResizeProxy = function(rect) {
    var computed = window.getComputedStyle(this.windowElement);
    var proxy = document.createElement('div');
    this._removeResizeProxy();
    proxy.className = 'fui-window-resize-proxy';
    proxy.style.position = computed.position === 'fixed' ? 'fixed' : 'absolute';
    proxy.style.zIndex = String(
      toNumber(this.windowElement.style.zIndex, this.options.zIndex) + 1
    );
    proxy.style.borderColor =
      computed.getPropertyValue('--fui-window-border').trim() ||
      computed.borderTopColor;
    proxy.style.borderRadius = computed.borderRadius;
    this.windowElement.parentElement.appendChild(proxy);
    this._resizeProxy = proxy;
    this._applyResizeProxyRect(rect);
  };

  FabWindow.prototype._applyResizeProxyRect = function(rect) {
    if (!this._resizeProxy) return;
    this._resizeProxy.style.left = Math.round(rect.left) + 'px';
    this._resizeProxy.style.top = Math.round(rect.top) + 'px';
    this._resizeProxy.style.width = Math.round(rect.width) + 'px';
    this._resizeProxy.style.height = Math.round(rect.height) + 'px';
  };

  FabWindow.prototype._removeResizeProxy = function() {
    if (!this._resizeProxy) return;
    if (this._resizeProxy.parentNode) {
      this._resizeProxy.parentNode.removeChild(this._resizeProxy);
    }
    this._resizeProxy = null;
  };

  FabWindow.prototype._bind = function() {
    var self = this;
    this._onHeaderPointerDown = function(event) {
      if (event.button !== 0 || event.target.closest('.fui-window-tool')) return;
      self._startInteraction(event, 'move', '');
    };
    this._onWindowPointerDown = function(event) {
      var handle = event.target.closest('[data-resize-direction]');
      self.bringToFront();
      if (handle) self._startInteraction(event, 'resize', handle.getAttribute('data-resize-direction'));
    };
    this.headerElement.addEventListener('pointerdown', this._onHeaderPointerDown);
    this.windowElement.addEventListener('pointerdown', this._onWindowPointerDown);
  };

  FabWindow.prototype._startInteraction = function(event, type, direction) {
    var rect;
    if (
      (
        type === 'move' &&
        (!this.options.draggable || this.options.maximized || this.options.minimized)
      ) ||
      (type === 'resize' && (!this.options.resizable || this.options.maximized || this.options.collapsed))
    ) return;
    event.preventDefault();
    this._cancelStateAnimation(true);
    rect = this._getRect();
    this._interaction = {
      type: type,
      direction: direction,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      rect: rect,
      previewRect: rect
    };
    this.windowElement.classList.add('fui-window-interacting');
    if (type === 'resize') this._showResizeProxy(rect);
    this._bindDocumentInteraction();
  };

  FabWindow.prototype._bindDocumentInteraction = function() {
    var self = this;
    this._unbindDocumentInteraction();
    this._onDocumentPointerMove = function(event) { self._handleInteractionMove(event); };
    this._onDocumentPointerEnd = function(event) { self._finishInteraction(event); };
    document.addEventListener('pointermove', this._onDocumentPointerMove);
    document.addEventListener('pointerup', this._onDocumentPointerEnd);
    document.addEventListener('pointercancel', this._onDocumentPointerEnd);
  };

  FabWindow.prototype._unbindDocumentInteraction = function() {
    if (!this._onDocumentPointerMove) return;
    document.removeEventListener('pointermove', this._onDocumentPointerMove);
    document.removeEventListener('pointerup', this._onDocumentPointerEnd);
    document.removeEventListener('pointercancel', this._onDocumentPointerEnd);
    this._onDocumentPointerMove = null;
    this._onDocumentPointerEnd = null;
  };

  FabWindow.prototype._handleInteractionMove = function(event) {
    var state = this._interaction;
    var dx;
    var dy;
    var rect;
    if (!state || event.pointerId !== state.pointerId) return;
    event.preventDefault();
    dx = event.clientX - state.startX;
    dy = event.clientY - state.startY;
    if (state.type === 'move') {
      rect = assignWindowOptions({}, state.rect);
      rect.left += dx;
      rect.top += dy;
      rect = this._normalizeRect(rect);
      this._applyRect(rect);
    } else {
      rect = calculateWindowResizeRect(state.rect, dx, dy, state.direction);
      rect = this._normalizeRect(rect);
      state.previewRect = rect;
      this._applyResizeProxyRect(rect);
    }
  };

  FabWindow.prototype._finishInteraction = function(event) {
    var state = this._interaction;
    var cancelled;
    var rect;
    if (!state || event.pointerId !== state.pointerId) return;
    cancelled = event.type === 'pointercancel';
    if (state.type === 'resize' && !cancelled) {
      this._handleInteractionMove(event);
    }
    rect = state.type === 'resize' ?
      state.previewRect :
      this._getRect();
    this._interaction = null;
    this.windowElement.classList.remove('fui-window-interacting');
    this._unbindDocumentInteraction();
    this._removeResizeProxy();
    if (state.type === 'move') {
      this._fire('Move', { left: rect.left, top: rect.top });
    } else if (!cancelled) {
      this._applyRect(rect);
      this._fire('Resize', { width: rect.width, height: rect.height });
    }
  };

  FabWindow.prototype._getBounds = function() {
    var container = this.options.inline ? this.windowElement.parentElement : null;
    return {
      width: container ? container.clientWidth : document.documentElement.clientWidth,
      height: container ? container.clientHeight : document.documentElement.clientHeight
    };
  };

  FabWindow.prototype._normalizeRect = function(rect) {
    if (!this.options.constrain) {
      rect.width = Math.max(this.options.minWidth, rect.width);
      rect.height = Math.max(this.options.minHeight, rect.height);
      return rect;
    }
    return constrainWindowRect(rect, this._getBounds(), {
      width: this.options.minWidth,
      height: this.options.minHeight
    });
  };

  FabWindow.prototype._getRect = function() {
    return {
      left: toNumber(this.options.left, 0),
      top: toNumber(this.options.top, 0),
      width: toNumber(this.options.width, this.windowElement.offsetWidth),
      height: toNumber(this.options.height, this.windowElement.offsetHeight)
    };
  };

  FabWindow.prototype._applyRect = function(rect) {
    this.options.left = rect.left;
    this.options.top = rect.top;
    this.options.width = rect.width;
    this.options.height = rect.height;
    this.windowElement.style.left = Math.round(rect.left) + 'px';
    this.windowElement.style.top = Math.round(rect.top) + 'px';
    this.windowElement.style.width = Math.round(rect.width) + 'px';
    this.windowElement.style.height = this.options.collapsed ? 'auto' : Math.round(rect.height) + 'px';
  };

  FabWindow.prototype._setVisible = function(visible) {
    this.windowElement.hidden = !visible;
    this.maskElement.hidden = !visible || !this.options.modal;
  };

  FabWindow.prototype._getAnimationDuration = function() {
    if (this.options.animate === false) return 0;
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return 0;
    return Math.max(0, toNumber(this.options.animationDuration, 180));
  };

  FabWindow.prototype._cancelStateAnimation = function(removeVisualState) {
    if (this._animationStartTimer != null) clearTimeout(this._animationStartTimer);
    if (this._animationEndTimer != null) clearTimeout(this._animationEndTimer);
    this._animationStartTimer = null;
    this._animationEndTimer = null;
    if (!this.windowElement) return;
    this.windowElement.classList.remove('fui-window-transitioning');
    if (removeVisualState !== false) {
      this.windowElement.classList.remove('fui-window-minimized-visual');
    }
  };

  FabWindow.prototype._animateState = function(change, complete) {
    var self = this;
    var duration = this._getAnimationDuration();
    this._cancelStateAnimation(false);
    if (!duration) {
      change();
      if (complete) complete();
      return;
    }
    this.windowElement.style.setProperty('--fui-window-animation-duration', duration + 'ms');
    this.windowElement.classList.add('fui-window-transitioning');
    this.windowElement.offsetWidth;
    this._animationStartTimer = setTimeout(function() {
      self._animationStartTimer = null;
      change();
      self._animationEndTimer = setTimeout(function() {
        self._animationEndTimer = null;
        self.windowElement.classList.remove('fui-window-transitioning');
        if (complete) complete();
      }, duration + 34);
    }, 16);
  };

  FabWindow.prototype._animateRect = function(rect, complete) {
    var self = this;
    this._animateState(function() {
      self._applyRect(rect);
    }, complete);
  };

  FabWindow.prototype._getCollapsedHeight = function() {
    var style = window.getComputedStyle(this.windowElement);
    var frameHeight =
      toNumber(style.paddingTop, 0) +
      toNumber(style.paddingBottom, 0) +
      toNumber(style.borderTopWidth, 0) +
      toNumber(style.borderBottomWidth, 0);
    return Math.max(38, this.headerElement.hidden ? 0 : this.headerElement.offsetHeight + frameHeight);
  };

  FabWindow.prototype._getMinimizedRect = function() {
    var target = this.options.minimizeTarget;
    var targetRect;
    var container;
    var containerRect;
    var restoreWidth = this._minimizedRestoreRect ?
      this._minimizedRestoreRect.width :
      this.options.width;
    if (typeof target === 'function') target = target.call(this, this);
    if (typeof target === 'string') {
      try {
        target = document.querySelector(target);
      } catch (error) {
        target = null;
      }
    }
    if (target && target.nodeType === 1) {
      targetRect = target.getBoundingClientRect();
      if (this.options.inline) {
        container = this.windowElement.parentElement;
        containerRect = container.getBoundingClientRect();
        targetRect = {
          left: targetRect.left - containerRect.left + container.scrollLeft,
          top: targetRect.top - containerRect.top + container.scrollTop,
          width: targetRect.width,
          height: targetRect.height
        };
      }
    } else {
      targetRect = target;
    }
    targetRect = calculateMinimizedTargetRect(targetRect, this._getBounds());
    this._minimizeTargetActive = targetRect != null;
    if (targetRect) return targetRect;
    return calculateMinimizedWindowRect(this._getBounds(), restoreWidth);
  };

  FabWindow.prototype._bindMinimizedViewportResize = function() {
    var self = this;
    this._unbindMinimizedViewportResize();
    this._onMinimizedViewportResize = function() {
      var minimizedRect;
      if (!self.options.minimized || self.options.closed) return;
      self._cancelStateAnimation(true);
      minimizedRect = self._getMinimizedRect();
      self.windowElement.classList.toggle(
        'fui-window-minimized-target',
        self._minimizeTargetActive
      );
      self._applyRect(minimizedRect);
    };
    window.addEventListener('resize', this._onMinimizedViewportResize);
  };

  FabWindow.prototype._unbindMinimizedViewportResize = function() {
    if (!this._onMinimizedViewportResize) return;
    window.removeEventListener('resize', this._onMinimizedViewportResize);
    this._onMinimizedViewportResize = null;
  };

  FabWindow.prototype._restoreMinimized = function(animate) {
    var rect;
    if (!this.options.minimized) return false;
    rect = this._minimizedRestoreRect;
    this._cancelStateAnimation(true);
    if (this.options.minimizeTarget) {
      this._applyRect(this._getMinimizedRect());
    }
    this.options.minimized = false;
    this.windowElement.classList.remove('fui-window-minimized');
    this.windowElement.classList.remove('fui-window-minimized-target');
    this._minimizeTargetActive = false;
    this._unbindMinimizedViewportResize();
    this.hostElement.hidden = this.options.collapsed;
    this.footerElement.hidden =
      this.options.collapsed ||
      !this.footerElement.childNodes.length;
    if (rect) {
      if (animate === false) this._applyRect(rect);
      else this._animateRect(rect);
    }
    this._minimizedRestoreRect = null;
    this._syncToolStates();
    return true;
  };

  FabWindow.prototype._fireBefore = function(name, detail) {
    var callback = this.options['onBefore' + name];
    var listeners = (this._listeners['before' + name.toLowerCase()] || []).slice();
    var allowed = true;
    var index;
    if (typeof callback === 'function' && callback.call(this.hostElement, this, detail) === false) {
      allowed = false;
    }
    for (index = 0; index < listeners.length; index += 1) {
      if (listeners[index].call(this, detail) === false) allowed = false;
    }
    return allowed;
  };

  FabWindow.prototype._fire = function(name, detail) {
    var callback = this.options['on' + name];
    var listeners = (this._listeners[name.toLowerCase()] || []).slice();
    var eventDetail = assignWindowOptions({ window: this }, detail || {});
    if (typeof callback === 'function') callback.call(this.hostElement, this, eventDetail);
    listeners.forEach(function(listener) { listener.call(this, eventDetail); }, this);
  };

  FabWindow.prototype.open = function(force) {
    var wasMinimized = this.options.minimized;
    if (!force && !this._fireBefore('Open')) return this;
    this._cancelStateAnimation(true);
    this.options.closed = false;
    this._setVisible(true);
    this.bringToFront();
    this.windowElement.focus();
    if (wasMinimized) this._restoreMinimized(true);
    this._fire('Open');
    return this;
  };

  FabWindow.prototype.close = function(force) {
    if (this.options.closed) return this;
    if (!force && !this._fireBefore('Close')) return this;
    this._cancelStateAnimation(true);
    this._unbindMinimizedViewportResize();
    this.options.closed = true;
    this._setVisible(false);
    this._fire('Close');
    return this;
  };

  FabWindow.prototype.minimize = function() {
    var minimizedRect;
    if (this.options.minimized) return this;
    this._cancelStateAnimation(true);
    this._minimizedRestoreRect = this._getRect();
    this.options.minimized = true;
    this.hostElement.hidden = true;
    this.footerElement.hidden = true;
    this.windowElement.classList.add('fui-window-minimized');
    minimizedRect = this._getMinimizedRect();
    this.windowElement.classList.toggle(
      'fui-window-minimized-target',
      this._minimizeTargetActive
    );
    this._setVisible(true);
    this.bringToFront();
    this._bindMinimizedViewportResize();
    this._animateRect(minimizedRect);
    this._syncToolStates();
    this._fire('Minimize');
    return this;
  };

  FabWindow.prototype.maximize = function() {
    var bounds;
    if (this.options.minimized) this._restoreMinimized(false);
    if (this.options.maximized) return this;
    this._cancelStateAnimation(true);
    this._normalRect = this._getRect();
    bounds = this._getBounds();
    this.options.maximized = true;
    this.options.collapsed = false;
    this.hostElement.hidden = false;
    this.footerElement.hidden = !this.footerElement.childNodes.length;
    this.windowElement.classList.add('fui-window-maximized');
    this.windowElement.classList.remove('fui-window-collapsed');
    this._animateRect({ left: 0, top: 0, width: bounds.width, height: bounds.height });
    this._syncToolStates();
    this._fire('Maximize');
    return this;
  };

  FabWindow.prototype.restore = function() {
    var normalRect;
    if (this._restoreMinimized(true)) {
      this._fire('Restore');
      return this;
    }
    if (!this.options.maximized || !this._normalRect) return this;
    this._cancelStateAnimation(true);
    normalRect = this._normalRect;
    this.options.maximized = false;
    this.windowElement.classList.remove('fui-window-maximized');
    this._animateRect(normalRect);
    this._normalRect = null;
    this._syncToolStates();
    this._fire('Restore');
    return this;
  };

  FabWindow.prototype.collapse = function() {
    var self = this;
    var startHeight;
    var collapsedHeight;
    if (this.options.collapsed || !this._fireBefore('Collapse')) return this;
    this._cancelStateAnimation(true);
    startHeight = this.windowElement.offsetHeight || this.options.height;
    this.windowElement.style.height = Math.round(startHeight) + 'px';
    this.options.collapsed = true;
    this.hostElement.hidden = true;
    this.footerElement.hidden = true;
    this.windowElement.classList.add('fui-window-collapsed');
    collapsedHeight = this._getCollapsedHeight();
    this._animateState(function() {
      self.windowElement.style.height = Math.round(collapsedHeight) + 'px';
    }, function() {
      self.windowElement.style.height = 'auto';
    });
    this._syncToolStates();
    this._fire('Collapse');
    return this;
  };

  FabWindow.prototype.expand = function() {
    var self = this;
    var startHeight;
    if (!this.options.collapsed || !this._fireBefore('Expand')) return this;
    this._cancelStateAnimation(true);
    startHeight = this.windowElement.offsetHeight || this._getCollapsedHeight();
    this.windowElement.style.height = Math.round(startHeight) + 'px';
    this.options.collapsed = false;
    this.hostElement.hidden = false;
    this.footerElement.hidden = !this.footerElement.childNodes.length;
    this.windowElement.classList.remove('fui-window-collapsed');
    this._animateState(function() {
      self.windowElement.style.height = Math.round(self.options.height) + 'px';
    });
    this._syncToolStates();
    this._fire('Expand');
    return this;
  };

  FabWindow.prototype._syncToolStates = function() {
    var collapse = this.toolsElement.querySelector('[data-window-tool="collapse"]');
    var minimize = this.toolsElement.querySelector('[data-window-tool="minimize"]');
    var maximize = this.toolsElement.querySelector('[data-window-tool="maximize"]');
    if (collapse) {
      collapse.classList.toggle('fui-window-tool-expand', this.options.collapsed);
      collapse.setAttribute('aria-label', this.options.collapsed ? this.messages.expand : this.messages.collapse);
      collapse.title = this.options.collapsed ? this.messages.expand : this.messages.collapse;
    }
    if (minimize) {
      minimize.classList.toggle('fui-window-tool-restore', this.options.minimized);
      minimize.setAttribute(
        'aria-label',
        this.options.minimized ? this.messages.restore : this.messages.minimize
      );
      minimize.title = this.options.minimized ? this.messages.restore : this.messages.minimize;
    }
    if (maximize) {
      maximize.classList.toggle('fui-window-tool-restore', this.options.maximized);
      maximize.setAttribute('aria-label', this.options.maximized ? this.messages.restore : this.messages.maximize);
      maximize.title = this.options.maximized ? this.messages.restore : this.messages.maximize;
    }
  };

  FabWindow.prototype.bringToFront = function() {
    var zIndex = Math.max(nextWindowZIndex, toNumber(this.options.zIndex, 9000));
    nextWindowZIndex = zIndex + 2;
    this.options.zIndex = zIndex + 1;
    this.maskElement.style.zIndex = zIndex;
    this.windowElement.style.zIndex = zIndex + 1;
    return this;
  };

  FabWindow.prototype.move = function(position, silent) {
    var rect = this._getRect();
    position = position || {};
    rect.left = toNumber(position.left, rect.left);
    rect.top = toNumber(position.top, rect.top);
    rect = this._normalizeRect(rect);
    this._applyRect(rect);
    if (!silent) this._fire('Move', { left: rect.left, top: rect.top });
    return this;
  };

  FabWindow.prototype.resize = function(width, height, silent) {
    var rect = this._getRect();
    if (width && typeof width === 'object') {
      height = width.height;
      width = width.width;
    }
    rect.width = Math.max(this.options.minWidth, toNumber(width, rect.width));
    rect.height = Math.max(this.options.minHeight, toNumber(height, rect.height));
    rect = this._normalizeRect(rect);
    this._applyRect(rect);
    if (!silent) this._fire('Resize', { width: rect.width, height: rect.height });
    return this;
  };

  FabWindow.prototype.hcenter = function(silent) {
    var bounds = this._getBounds();
    return this.move({ left: Math.max(0, (bounds.width - this.options.width) / 2) }, silent);
  };

  FabWindow.prototype.vcenter = function(silent) {
    var bounds = this._getBounds();
    return this.move({ top: Math.max(0, (bounds.height - this.options.height) / 2) }, silent);
  };

  FabWindow.prototype.center = function(silent) {
    var bounds = this._getBounds();
    return this.move({
      left: Math.max(0, (bounds.width - this.options.width) / 2),
      top: Math.max(0, (bounds.height - this.options.height) / 2)
    }, silent);
  };

  FabWindow.prototype.setTitle = function(title) {
    this.options.title = title == null ? '' : String(title);
    this.titleElement.textContent = this.options.title;
    this.windowElement.setAttribute('aria-label', this.options.title || 'Window');
    return this;
  };

  FabWindow.prototype.setIcon = function(iconCls) {
    this.options.iconCls = iconCls == null ? '' : String(iconCls).trim();
    this.iconElement.className = ('fui-window-icon ' + this.options.iconCls).trim();
    this.iconElement.hidden = !this.options.iconCls;
    this.titleElement.classList.toggle('fui-window-title-with-icon', Boolean(this.options.iconCls));
    return this;
  };

  FabWindow.prototype.setContent = function(content) {
    if (content && content.nodeType) {
      this.hostElement.textContent = '';
      this.hostElement.appendChild(content);
    } else {
      this.hostElement.textContent = content == null ? '' : String(content);
    }
    return this;
  };

  FabWindow.prototype.setLocale = function(locale, messages) {
    this.options.locale = normalizeLocale(locale);
    this.options.messages = messages || this.options.messages;
    this.messages = assignWindowOptions({}, localePacks[this.options.locale], this.options.messages || {});
    this._syncToolStates();
    var close = this.toolsElement.querySelector('[data-window-tool="close"]');
    if (close) {
      close.title = this.messages.close;
      close.setAttribute('aria-label', this.messages.close);
    }
    return this;
  };

  FabWindow.prototype.setTheme = function(theme) {
    var index;
    this.options.theme = theme == null ? 'inherit' : theme;
    this.theme = this.options.theme === 'inherit' ?
      findWindowTheme(this._themeSource) :
      normalizeWindowTheme(this.options.theme);
    for (index = 0; index < WINDOW_THEMES.length; index += 1) {
      this.windowElement.classList.remove('fg-theme-' + WINDOW_THEMES[index]);
      this.maskElement.classList.remove('fg-theme-' + WINDOW_THEMES[index]);
    }
    this.windowElement.classList.add('fg-theme-' + this.theme);
    this.maskElement.classList.add('fg-theme-' + this.theme);
    return this;
  };

  FabWindow.prototype.window = function() { return this.windowElement; };
  FabWindow.prototype.panel = FabWindow.prototype.window;
  FabWindow.prototype.header = function() { return this.headerElement; };
  FabWindow.prototype.body = function() { return this.hostElement; };
  FabWindow.prototype.footer = function() { return this.footerElement; };
  FabWindow.prototype.isOpen = function() { return !this.options.closed && !this.options.minimized; };

  FabWindow.prototype.on = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!name || typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  FabWindow.prototype.off = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!this._listeners[name]) return this;
    this._listeners[name] = listener ?
      this._listeners[name].filter(function(item) { return item !== listener; }) :
      [];
    return this;
  };

  FabWindow.prototype.destroy = function(force) {
    if (this._destroyed || (!force && !this._fireBefore('Destroy'))) return;
    this._destroyed = true;
    this._cancelStateAnimation(true);
    this._unbindDocumentInteraction();
    this._removeResizeProxy();
    this._interaction = null;
    this._unbindMinimizedViewportResize();
    this.headerElement.removeEventListener('pointerdown', this._onHeaderPointerDown);
    this.windowElement.removeEventListener('pointerdown', this._onWindowPointerDown);
    unregisterControl(this.hostElement, this);
    unregisterControl(this.windowElement, this);
    delete this.hostElement.__fabuiWindow;
    restoreWindowAttribute(this.hostElement, 'class', this._originalClass);
    restoreWindowAttribute(this.hostElement, 'style', this._originalStyle);
    restoreWindowAttribute(this.hostElement, 'title', this._originalTitle);
    if (this._originalParent) {
      this._originalParent.insertBefore(this.hostElement, this._originalNextSibling);
    }
    if (this.maskElement.parentNode) this.maskElement.parentNode.removeChild(this.maskElement);
    if (this.windowElement.parentNode) this.windowElement.parentNode.removeChild(this.windowElement);
    this._fire('Destroy');
    this._listeners = {};
  };

  FabWindow.prototype.dispose = FabWindow.prototype.destroy;

  FabWindow.defaults = {
    title: 'New Window',
    width: 600,
    height: 400,
    left: null,
    top: null,
    minWidth: 200,
    minHeight: 100,
    zIndex: 9000,
    draggable: true,
    resizable: true,
    shadow: true,
    modal: false,
    border: true,
    inline: false,
    fixed: false,
    constrain: false,
    collapsible: false,
    minimizable: false,
    maximizable: true,
    closable: true,
    closed: false,
    collapsed: false,
    minimized: false,
    minimizeTarget: null,
    maximized: false,
    noheader: false,
    iconCls: '',
    cls: '',
    animate: true,
    animationDuration: 180,
    tools: null,
    footer: null,
    theme: 'inherit',
    locale: 'en',
    messages: null
  };
  FabWindow.locales = localePacks;
  FabWindow.themes = WINDOW_THEMES.slice();
  FabWindow.normalizeLocale = normalizeLocale;
  FabWindow.getControl = function(element) {
    element = resolveWindowElement(element);
    return element && element.__fabuiWindow ? element.__fabuiWindow : null;
  };
  return FabWindow;
}
