var PANEL_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];

function assignPanelOptions(target) {
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

function resolvePanelElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function panelNumber(value, fallback) {
  value = Number(value);
  return isFinite(value) ? value : fallback;
}

function panelSizeValue(value) {
  if (value == null || value === '' || value === 'auto') return '';
  return typeof value === 'number' ? Math.max(0, value) + 'px' : String(value);
}

function restorePanelAttribute(element, name, value) {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

export function normalizePanelTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return PANEL_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

function findPanelTheme(element) {
  var current = resolvePanelElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < PANEL_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + PANEL_THEMES[index])) {
        return PANEL_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

export function normalizePanelHalign(value) {
  value = String(value || 'top').toLowerCase();
  return value === 'left' || value === 'right' ? value : 'top';
}

export function createPanelFactory(Control, registerControl, unregisterControl) {
  var localePacks = {
    en: {
      close: 'Close',
      collapse: 'Collapse',
      expand: 'Expand',
      minimize: 'Minimize',
      maximize: 'Maximize',
      restore: 'Restore',
      loading: 'Loading...'
    },
    'zh-TW': {
      close: '關閉',
      collapse: '收合',
      expand: '展開',
      minimize: '最小化',
      maximize: '最大化',
      restore: '還原',
      loading: '載入中...'
    },
    'zh-CN': {
      close: '关闭',
      collapse: '收合',
      expand: '展开',
      minimize: '最小化',
      maximize: '最大化',
      restore: '还原',
      loading: '加载中...'
    }
  };

  function normalizeLocale(value) {
    value = String(value || 'en').trim().replace(/_/g, '-');
    if (localePacks[value]) return value;
    if (/^zh-(?:tw|hant)(?:-|$)/i.test(value)) return 'zh-TW';
    if (/^zh-(?:cn|hans)(?:-|$)/i.test(value) || /^zh$/i.test(value)) return 'zh-CN';
    return 'en';
  }

  function FabPanel(element, options) {
    var host = resolvePanelElement(element);
    var initiallyCollapsed;
    var initiallyMaximized;
    var initiallyMinimized;
    if (!(this instanceof FabPanel)) return new FabPanel(element, options);
    if (!host) throw new Error('fabui.Panel requires a host element.');
    if (host.__fabuiPanel) return host.__fabuiPanel;
    Control.call(this);
    this.hostElement = host;
    this._listeners = {};
    this._destroyed = false;
    this._loaded = false;
    this._loadController = null;
    this._loadSequence = 0;
    this._animationStartTimer = null;
    this._animationEndTimer = null;
    this._animationComplete = null;
    this._normalRect = null;
    this._originalParent = host.parentNode;
    this._originalNextSibling = host.nextSibling;
    this._originalStyle = host.getAttribute('style');
    this._originalClass = host.getAttribute('class');
    this._originalId = host.getAttribute('id');
    this._originalTitle = host.getAttribute('title');
    this._themeSource = this._originalParent && this._originalParent.nodeType === 1 ?
      this._originalParent :
      document.body;
    this.options = assignPanelOptions({}, FabPanel.defaults, this._readElementOptions(), options || {});
    this.options.locale = normalizeLocale(this.options.locale);
    this.options.halign = normalizePanelHalign(this.options.halign);
    initiallyCollapsed = this.options.collapsed === true;
    initiallyMaximized = this.options.maximized === true;
    initiallyMinimized = this.options.minimized === true;
    this.options.collapsed = false;
    this.options.maximized = false;
    this.options.minimized = false;
    this._build();
    host.__fabuiPanel = this;
    registerControl(host, this);
    registerControl(this.panelElement, this);
    this.setLocale(this.options.locale, this.options.messages);
    this.setTheme(this.options.theme);
    this.resize(this.options, true);
    if (this.options.closed) {
      this._setVisible(false);
    } else {
      this.open(true);
      if (initiallyCollapsed) this.collapse();
      if (initiallyMaximized) this.maximize();
      if (initiallyMinimized) this.minimize();
    }
  }

  FabPanel.prototype = Object.create(Control.prototype);
  FabPanel.prototype.constructor = FabPanel;

  FabPanel.prototype._readElementOptions = function() {
    var host = this.hostElement;
    var options = {};
    var title = host.getAttribute('title');
    var width = host.style.width;
    var height = host.style.height;
    if (title) options.title = title;
    if (width) options.width = width;
    if (height) options.height = height;
    return options;
  };

  FabPanel.prototype._build = function() {
    var panel = document.createElement('div');
    var header = document.createElement('div');
    var icon = document.createElement('span');
    var title = document.createElement('div');
    var tools = document.createElement('div');
    var footer = document.createElement('div');
    panel.className = 'fui-panel' + (this.options.cls ? ' ' + this.options.cls : '');
    panel.setAttribute('role', 'region');
    header.className = 'fui-panel-header' + (this.options.headerCls ? ' ' + this.options.headerCls : '');
    icon.className = 'fui-panel-icon';
    title.className = 'fui-panel-title';
    tools.className = 'fui-panel-tools';
    footer.className = 'fui-panel-footer';
    header.appendChild(icon);
    header.appendChild(title);
    header.appendChild(tools);
    panel.appendChild(header);
    panel.appendChild(this.hostElement);
    panel.appendChild(footer);
    if (this._originalParent) this._originalParent.insertBefore(panel, this._originalNextSibling);
    this.hostElement.classList.add('fui-panel-body');
    if (this.options.bodyCls) this.hostElement.classList.add(this.options.bodyCls);
    this.hostElement.removeAttribute('title');
    this.hostElement.style.display = '';
    this.panelElement = panel;
    this.headerElement = header;
    this.iconElement = icon;
    this.titleElement = title;
    this.toolsElement = tools;
    this.footerElement = footer;
    if (this.options.id) this.hostElement.id = this.options.id;
    if (this.options.content != null) this.setContent(this.options.content);
    this.setTitle(this.options.title);
    this._renderTools();
    this._renderFooter();
    this._applyStructureOptions();
  };

  FabPanel.prototype._applyStructureOptions = function() {
    var style = this.options.style || {};
    var key;
    this.panelElement.classList.toggle('fui-panel-no-border', this.options.border === false);
    this.panelElement.classList.remove('fui-panel-halign-top', 'fui-panel-halign-left', 'fui-panel-halign-right');
    this.panelElement.classList.add('fui-panel-halign-' + this.options.halign);
    this.panelElement.classList.toggle('fui-panel-title-up', this.options.titleDirection === 'up');
    this.headerElement.hidden = this.options.noheader === true ||
      (!this.options.title && !this.options.iconCls && !this.toolsElement.childNodes.length);
    this.iconElement.className = ('fui-panel-icon ' + (this.options.iconCls || '')).trim();
    this.iconElement.hidden = !this.options.iconCls;
    this.titleElement.classList.toggle('fui-panel-title-with-icon', Boolean(this.options.iconCls));
    for (key in style) {
      if (Object.prototype.hasOwnProperty.call(style, key)) this.panelElement.style[key] = style[key];
    }
  };

  FabPanel.prototype._createTool = function(type, enabled, handler) {
    var self = this;
    var button;
    if (!enabled) return;
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'fui-panel-tool fui-panel-tool-' + type;
    button.setAttribute('data-panel-tool', type);
    button.addEventListener('click', function(event) {
      event.stopPropagation();
      handler.call(self);
    });
    this.toolsElement.appendChild(button);
  };

  FabPanel.prototype._renderTools = function() {
    var self = this;
    var customTools = Array.isArray(this.options.tools) ? this.options.tools : [];
    this.toolsElement.textContent = '';
    customTools.forEach(function(tool, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = ('fui-panel-tool fui-panel-tool-custom ' + (tool.iconCls || '')).trim();
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
    this._createTool('minimize', this.options.minimizable, this.minimize);
    this._createTool('maximize', this.options.maximizable, function() {
      if (this.options.maximized) this.restore();
      else this.maximize();
    });
    this._createTool('close', this.options.closable, this.close);
  };

  FabPanel.prototype._renderFooter = function() {
    var footer = this.options.footer;
    this.footerElement.textContent = '';
    if (footer && footer.nodeType === 1) {
      this.footerElement.appendChild(footer);
    } else if (footer != null && footer !== '') {
      this.footerElement.textContent = String(footer);
    }
    this.footerElement.hidden = !this.footerElement.childNodes.length;
  };

  FabPanel.prototype._setVisible = function(visible) {
    this.panelElement.hidden = !visible;
  };

  FabPanel.prototype._getAnimationDuration = function() {
    if (this.options.animate === false) return 0;
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return 0;
    return Math.max(0, panelNumber(this.options.animationDuration, 180));
  };

  FabPanel.prototype._finishStateAnimation = function(runComplete) {
    var complete = this._animationComplete;
    if (this._animationStartTimer != null) clearTimeout(this._animationStartTimer);
    if (this._animationEndTimer != null) clearTimeout(this._animationEndTimer);
    this._animationStartTimer = null;
    this._animationEndTimer = null;
    this._animationComplete = null;
    if (this.panelElement) {
      this.panelElement.classList.remove('fui-panel-transitioning');
      this.panelElement.style.removeProperty('--fui-panel-animation-duration');
    }
    if (runComplete !== false && complete) complete();
  };

  FabPanel.prototype._cancelStateAnimation = function(runComplete) {
    if (
      this._animationStartTimer != null ||
      this._animationEndTimer != null ||
      this._animationComplete
    ) {
      this._finishStateAnimation(runComplete);
    } else if (this.panelElement) {
      this.panelElement.classList.remove('fui-panel-transitioning');
      this.panelElement.style.removeProperty('--fui-panel-animation-duration');
    }
  };

  FabPanel.prototype._animateState = function(change, complete) {
    var self = this;
    var duration = this._getAnimationDuration();
    this._cancelStateAnimation(true);
    if (!duration) {
      change();
      if (complete) complete();
      return;
    }
    this._animationComplete = complete || null;
    this.panelElement.style.setProperty('--fui-panel-animation-duration', duration + 'ms');
    this.panelElement.classList.add('fui-panel-transitioning');
    this.panelElement.offsetWidth;
    this._animationStartTimer = setTimeout(function() {
      self._animationStartTimer = null;
      change();
      self._animationEndTimer = setTimeout(function() {
        self._finishStateAnimation(true);
      }, duration + 34);
    }, 16);
  };

  FabPanel.prototype._restoreConfiguredSize = function() {
    if (this.options.fit) {
      this.panelElement.style.width = '100%';
      this.panelElement.style.height = '100%';
      return;
    }
    this.panelElement.style.width = panelSizeValue(this.options.width);
    this.panelElement.style.height = panelSizeValue(this.options.height);
  };

  FabPanel.prototype._measureCollapsedSize = function() {
    var bodyHidden = this.hostElement.hidden;
    var footerHidden = this.footerElement.hidden;
    var width = this.panelElement.style.width;
    var height = this.panelElement.style.height;
    var wasCollapsed = this.panelElement.classList.contains('fui-panel-collapsed');
    this.hostElement.hidden = true;
    this.footerElement.hidden = true;
    this.panelElement.classList.add('fui-panel-collapsed');
    this._restoreConfiguredSize();
    var collapsedSize = {
      width: this.panelElement.offsetWidth,
      height: this.panelElement.offsetHeight
    };
    this.hostElement.hidden = bodyHidden;
    this.footerElement.hidden = footerHidden;
    if (!wasCollapsed) this.panelElement.classList.remove('fui-panel-collapsed');
    this.panelElement.style.width = width;
    this.panelElement.style.height = height;
    return {
      width: Math.max(0, collapsedSize.width),
      height: Math.max(0, collapsedSize.height)
    };
  };

  FabPanel.prototype._fireBefore = function(name, detail) {
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

  FabPanel.prototype._fire = function(name, detail) {
    var callback = this.options['on' + name];
    var listeners = (this._listeners[name.toLowerCase()] || []).slice();
    var eventDetail = assignPanelOptions({ panel: this }, detail || {});
    if (typeof callback === 'function') callback.call(this.hostElement, this, eventDetail);
    listeners.forEach(function(listener) { listener.call(this, eventDetail); }, this);
  };

  FabPanel.prototype._load = function() {
    var self = this;
    var options = this.options;
    var params = assignPanelOptions({}, options.queryParams || {});
    var method = String(options.method || 'get').toUpperCase();
    var url = options.href;
    var request;
    var success;
    var failure;
    var loading;
    var sequence;
    if (!url || (this._loaded && options.cache !== false)) return Promise.resolve(this);
    if (!this._fireBefore('Load', { params: params, href: url })) return Promise.resolve(this);
    if (this._loadController) this._loadController.abort();
    sequence = ++this._loadSequence;
    this.hostElement.textContent = '';
    loading = document.createElement('div');
    loading.className = 'fui-panel-loading';
    loading.textContent = String(options.loadingMessage || this.messages.loading);
    this.hostElement.appendChild(loading);
    success = function(data) {
      var content;
      if (self._destroyed || sequence !== self._loadSequence) return self;
      content = typeof options.extractor === 'function' ?
        options.extractor.call(self.hostElement, data) :
        data;
      self._loadController = null;
      self.hostElement.innerHTML = content == null ? '' : String(content);
      self._loaded = true;
      self._fire('Load', { data: data });
      self.doLayout();
      return self;
    };
    failure = function(error) {
      if (self._destroyed || sequence !== self._loadSequence) return self;
      self._loadController = null;
      if (error && error.name === 'AbortError') return self;
      self._fire('LoadError', { error: error });
      return self;
    };
    if (typeof options.loader === 'function') {
      request = new Promise(function(resolve, reject) {
        var result = options.loader.call(self.hostElement, params, resolve, reject);
        if (result === false) resolve(null);
        else if (result && typeof result.then === 'function') result.then(resolve, reject);
      }).then(success, failure);
    } else if (typeof fetch === 'function') {
      this._loadController = typeof AbortController === 'function' ? new AbortController() : null;
      if (method === 'GET') {
        var query = new URLSearchParams(params).toString();
        if (query) url += (url.indexOf('?') >= 0 ? '&' : '?') + query;
      }
      request = fetch(url, {
        method: method,
        body: method === 'GET' ? undefined : new URLSearchParams(params),
        signal: this._loadController ? this._loadController.signal : undefined
      }).then(function(response) {
        if (!response.ok) throw new Error('Panel load failed with status ' + response.status + '.');
        return response.text();
      }).then(success, failure);
    } else {
      request = Promise.resolve(failure(new Error('Fetch API is unavailable.')));
    }
    this.loadPromise = request;
    return request;
  };

  FabPanel.prototype.open = function(force) {
    if (!force && !this._fireBefore('Open')) return this;
    this.options.closed = false;
    this.options.minimized = false;
    this._setVisible(true);
    this._fire('Open');
    if (!this.options.collapsed) this._load();
    return this;
  };

  FabPanel.prototype.close = function(force) {
    if (this.options.closed) return this;
    if (!force && !this._fireBefore('Close')) return this;
    this.options.closed = true;
    this._setVisible(false);
    this._fire('Close');
    return this;
  };

  FabPanel.prototype.minimize = function() {
    if (this.options.minimized) return this;
    this.options.minimized = true;
    this._setVisible(false);
    this._fire('Minimize');
    return this;
  };

  FabPanel.prototype.maximize = function() {
    var self = this;
    if (this.options.maximized) return this;
    this._cancelStateAnimation(true);
    this._normalRect = {
      width: this.options.width,
      height: this.options.height,
      left: this.options.left,
      top: this.options.top
    };
    this.options.maximized = true;
    this.options.collapsed = false;
    this.hostElement.hidden = false;
    this.footerElement.hidden = !this.footerElement.childNodes.length;
    this.panelElement.classList.add('fui-panel-maximized');
    this.panelElement.classList.remove('fui-panel-collapsed', 'fui-panel-content-hidden');
    this._animateState(function() {
      self.resize({ width: '100%', height: '100%', left: 0, top: 0 }, true);
    });
    this._syncToolStates();
    this._fire('Maximize');
    return this;
  };

  FabPanel.prototype.restore = function() {
    var self = this;
    var normalRect;
    if (!this.options.maximized || !this._normalRect) return this;
    this._cancelStateAnimation(true);
    normalRect = this._normalRect;
    this.options.maximized = false;
    this._animateState(function() {
      self.resize(normalRect, true);
    }, function() {
      self.panelElement.classList.remove('fui-panel-maximized');
      self.resize(normalRect, true);
      self._normalRect = null;
    });
    this._syncToolStates();
    this._fire('Restore');
    return this;
  };

  FabPanel.prototype.collapse = function() {
    var self = this;
    var startSize;
    var collapsedSize;
    if (this.options.collapsed || !this._fireBefore('Collapse')) return this;
    this._cancelStateAnimation(true);
    startSize = {
      width: this.panelElement.offsetWidth,
      height: this.panelElement.offsetHeight
    };
    collapsedSize = this._measureCollapsedSize();
    this.panelElement.style.width = Math.max(0, Math.round(startSize.width)) + 'px';
    this.panelElement.style.height = Math.max(0, Math.round(startSize.height)) + 'px';
    this.options.collapsed = true;
    this._animateState(function() {
      self.panelElement.classList.add('fui-panel-content-hidden');
      self.panelElement.style.width = Math.max(0, Math.round(collapsedSize.width)) + 'px';
      self.panelElement.style.height = Math.max(0, Math.round(collapsedSize.height)) + 'px';
    }, function() {
      self.hostElement.hidden = true;
      self.footerElement.hidden = true;
      self.panelElement.classList.add('fui-panel-collapsed');
      self.panelElement.classList.remove('fui-panel-content-hidden');
      self._restoreConfiguredSize();
    });
    this._syncToolStates();
    this._fire('Collapse');
    return this;
  };

  FabPanel.prototype.expand = function() {
    var self = this;
    var startSize;
    var expandedSize;
    if (!this.options.collapsed || !this._fireBefore('Expand')) return this;
    this._cancelStateAnimation(true);
    startSize = {
      width: this.panelElement.offsetWidth,
      height: this.panelElement.offsetHeight
    };
    this.options.collapsed = false;
    this.hostElement.hidden = false;
    this.footerElement.hidden = !this.footerElement.childNodes.length;
    this.panelElement.classList.remove('fui-panel-collapsed');
    this._restoreConfiguredSize();
    expandedSize = {
      width: this.panelElement.offsetWidth,
      height: this.panelElement.offsetHeight
    };
    this.panelElement.style.width = Math.max(0, Math.round(startSize.width)) + 'px';
    this.panelElement.style.height = Math.max(0, Math.round(startSize.height)) + 'px';
    this.panelElement.classList.add('fui-panel-content-hidden');
    this._animateState(function() {
      self.panelElement.classList.remove('fui-panel-content-hidden');
      self.panelElement.style.width = Math.max(0, Math.round(expandedSize.width)) + 'px';
      self.panelElement.style.height = Math.max(0, Math.round(expandedSize.height)) + 'px';
    }, function() {
      self._restoreConfiguredSize();
      self.doLayout();
    });
    this._syncToolStates();
    this._fire('Expand');
    this._load();
    return this;
  };

  FabPanel.prototype._syncToolStates = function() {
    var collapse = this.toolsElement.querySelector('[data-panel-tool="collapse"]');
    var maximize = this.toolsElement.querySelector('[data-panel-tool="maximize"]');
    if (collapse) {
      collapse.classList.toggle('fui-panel-tool-expand', this.options.collapsed);
      collapse.setAttribute('aria-label', this.options.collapsed ? this.messages.expand : this.messages.collapse);
      collapse.title = this.options.collapsed ? this.messages.expand : this.messages.collapse;
    }
    if (maximize) {
      maximize.classList.toggle('fui-panel-tool-restore', this.options.maximized);
      maximize.setAttribute('aria-label', this.options.maximized ? this.messages.restore : this.messages.maximize);
      maximize.title = this.options.maximized ? this.messages.restore : this.messages.maximize;
    }
  };

  FabPanel.prototype.move = function(position, silent) {
    position = position || {};
    if (Object.prototype.hasOwnProperty.call(position, 'left')) this.options.left = position.left;
    if (Object.prototype.hasOwnProperty.call(position, 'top')) this.options.top = position.top;
    this.panelElement.style.left = panelSizeValue(this.options.left);
    this.panelElement.style.top = panelSizeValue(this.options.top);
    if (this.options.left != null || this.options.top != null) {
      this.panelElement.classList.add('fui-panel-positioned');
    } else {
      this.panelElement.classList.remove('fui-panel-positioned');
    }
    if (!silent) {
      this._fire('Move', {
        left: panelNumber(this.options.left, 0),
        top: panelNumber(this.options.top, 0)
      });
    }
    return this;
  };

  FabPanel.prototype.resize = function(options, silent) {
    var width;
    var height;
    options = options || {};
    if (typeof options !== 'object') {
      width = options;
      height = arguments[1];
      silent = arguments[2];
      options = { width: width, height: height };
    }
    if (options.width != null) this.options.width = options.width;
    if (options.height != null) this.options.height = options.height;
    if (options.minWidth != null) this.options.minWidth = options.minWidth;
    if (options.maxWidth != null) this.options.maxWidth = options.maxWidth;
    if (options.minHeight != null) this.options.minHeight = options.minHeight;
    if (options.maxHeight != null) this.options.maxHeight = options.maxHeight;
    if (this.options.fit) {
      this.panelElement.style.width = '100%';
      this.panelElement.style.height = '100%';
    } else {
      this.panelElement.style.width = panelSizeValue(this.options.width);
      this.panelElement.style.height = panelSizeValue(this.options.height);
    }
    this.panelElement.style.minWidth = panelSizeValue(this.options.minWidth);
    this.panelElement.style.maxWidth = panelSizeValue(this.options.maxWidth);
    this.panelElement.style.minHeight = panelSizeValue(this.options.minHeight);
    this.panelElement.style.maxHeight = panelSizeValue(this.options.maxHeight);
    if (
      Object.prototype.hasOwnProperty.call(options, 'left') ||
      Object.prototype.hasOwnProperty.call(options, 'top')
    ) {
      this.move(options, true);
    }
    if (!silent) {
      this._fire('Resize', {
        width: this.panelElement.offsetWidth,
        height: this.panelElement.offsetHeight
      });
    }
    this.doLayout();
    return this;
  };

  FabPanel.prototype.doLayout = function() {
    var self = this;
    Array.prototype.forEach.call(this.hostElement.querySelectorAll('*'), function(element) {
      var control = Control.getControl ? Control.getControl(element) : null;
      if (!control || control === self) return;
      if (typeof control.refresh === 'function') control.refresh();
      else if (typeof control.resize === 'function') control.resize();
    });
    return this;
  };

  FabPanel.prototype.clear = function() {
    this.hostElement.textContent = '';
    this._loaded = false;
    return this;
  };

  FabPanel.prototype.refresh = function(href) {
    if (href != null) this.options.href = href;
    this._loaded = false;
    this._load();
    return this;
  };

  FabPanel.prototype.setTitle = function(title) {
    this.options.title = title == null ? '' : String(title);
    this.titleElement.textContent = this.options.title;
    this.panelElement.setAttribute('aria-label', this.options.title || 'Panel');
    return this;
  };

  FabPanel.prototype.setContent = function(content) {
    this.clear();
    if (content && content.nodeType) this.hostElement.appendChild(content);
    else this.hostElement.innerHTML = content == null ? '' : String(content);
    return this;
  };

  FabPanel.prototype.setLocale = function(locale, messages) {
    var minimize;
    var close;
    this.options.locale = normalizeLocale(locale);
    this.options.messages = messages || this.options.messages;
    this.messages = assignPanelOptions({}, localePacks[this.options.locale], this.options.messages || {});
    this._syncToolStates();
    minimize = this.toolsElement.querySelector('[data-panel-tool="minimize"]');
    close = this.toolsElement.querySelector('[data-panel-tool="close"]');
    if (minimize) {
      minimize.title = this.messages.minimize;
      minimize.setAttribute('aria-label', this.messages.minimize);
    }
    if (close) {
      close.title = this.messages.close;
      close.setAttribute('aria-label', this.messages.close);
    }
    return this;
  };

  FabPanel.prototype.setTheme = function(theme) {
    var index;
    this.options.theme = theme == null ? 'inherit' : theme;
    this.theme = this.options.theme === 'inherit' ?
      findPanelTheme(this._themeSource) :
      normalizePanelTheme(this.options.theme);
    for (index = 0; index < PANEL_THEMES.length; index += 1) {
      this.panelElement.classList.remove('fg-theme-' + PANEL_THEMES[index]);
    }
    this.panelElement.classList.add('fg-theme-' + this.theme);
    return this;
  };

  FabPanel.prototype.panel = function() { return this.panelElement; };
  FabPanel.prototype.header = function() { return this.headerElement; };
  FabPanel.prototype.body = function() { return this.hostElement; };
  FabPanel.prototype.footer = function() { return this.footerElement; };
  FabPanel.prototype.isOpen = function() { return !this.options.closed && !this.options.minimized; };

  FabPanel.prototype.on = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!name || typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  FabPanel.prototype.off = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!this._listeners[name]) return this;
    this._listeners[name] = listener ?
      this._listeners[name].filter(function(item) { return item !== listener; }) :
      [];
    return this;
  };

  FabPanel.prototype.destroy = function(force) {
    if (this._destroyed || (!force && !this._fireBefore('Destroy'))) return;
    this._destroyed = true;
    this._loadSequence += 1;
    this._cancelStateAnimation(false);
    if (this._loadController) this._loadController.abort();
    unregisterControl(this.hostElement, this);
    unregisterControl(this.panelElement, this);
    delete this.hostElement.__fabuiPanel;
    restorePanelAttribute(this.hostElement, 'class', this._originalClass);
    restorePanelAttribute(this.hostElement, 'style', this._originalStyle);
    restorePanelAttribute(this.hostElement, 'id', this._originalId);
    restorePanelAttribute(this.hostElement, 'title', this._originalTitle);
    if (this._originalParent) {
      this._originalParent.insertBefore(this.hostElement, this._originalNextSibling);
    }
    if (this.panelElement.parentNode) this.panelElement.parentNode.removeChild(this.panelElement);
    this._fire('Destroy');
    this._listeners = {};
  };

  FabPanel.prototype.dispose = FabPanel.prototype.destroy;

  FabPanel.defaults = {
    id: null,
    title: '',
    iconCls: '',
    width: 'auto',
    height: 'auto',
    left: null,
    top: null,
    minWidth: null,
    maxWidth: null,
    minHeight: null,
    maxHeight: null,
    cls: '',
    headerCls: '',
    bodyCls: '',
    style: null,
    fit: false,
    border: true,
    noheader: false,
    content: null,
    halign: 'top',
    titleDirection: 'down',
    collapsible: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    tools: null,
    footer: null,
    collapsed: false,
    minimized: false,
    maximized: false,
    closed: false,
    href: null,
    cache: true,
    loadingMessage: '',
    extractor: function(data) {
      var match = /<body[^>]*>([\s\S]*)<\/body>/i.exec(String(data == null ? '' : data));
      return match ? match[1] : data;
    },
    method: 'get',
    queryParams: null,
    loader: null,
    theme: 'inherit',
    locale: 'en',
    messages: null,
    animate: true,
    animationDuration: 180
  };
  FabPanel.locales = localePacks;
  FabPanel.themes = PANEL_THEMES.slice();
  FabPanel.normalizeLocale = normalizeLocale;
  FabPanel.getControl = function(element) {
    element = resolvePanelElement(element);
    return element && element.__fabuiPanel ? element.__fabuiPanel : null;
  };
  return FabPanel;
}
