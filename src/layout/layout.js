var LAYOUT_REGIONS = ['north', 'south', 'east', 'west', 'center'];
var LAYOUT_EDGE_REGIONS = ['north', 'south', 'east', 'west'];
var LAYOUT_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];

function assignLayoutOptions(target) {
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

function resolveLayoutElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function layoutNumber(value, fallback) {
  value = parseFloat(value);
  return isFinite(value) ? value : fallback;
}

function clampLayoutValue(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function findLayoutTheme(element) {
  var current = resolveLayoutElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < LAYOUT_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + LAYOUT_THEMES[index])) {
        return LAYOUT_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

export function normalizeLayoutRegion(value) {
  value = String(value || '').toLowerCase();
  return LAYOUT_REGIONS.indexOf(value) >= 0 ? value : null;
}

export function calculateLayoutRects(size, regions) {
  var width = Math.max(0, layoutNumber(size && size.width, 0));
  var height = Math.max(0, layoutNumber(size && size.height, 0));
  var top = 0;
  var bottom = height;
  var left = 0;
  var right = width;
  var result = {};

  function getRegion(name) {
    var region = regions && regions[name];
    var splitter = region && region.split && !region.collapsed ?
      Math.max(0, layoutNumber(region.splitSize, 5)) :
      0;
    var extent = region && region.collapsed ?
      Math.max(0, layoutNumber(region.collapsedSize, 28)) :
      Math.max(0, layoutNumber(region && region.size, 0));
    return {
      exists: Boolean(region && region.exists !== false),
      collapsed: Boolean(region && region.collapsed),
      extent: extent,
      splitter: splitter
    };
  }

  function setVertical(name, edge) {
    var region = getRegion(name);
    if (!region.exists) return;
    region.extent = Math.min(region.extent, Math.max(0, bottom - top));
    if (edge === 'top') {
      result[name] = { left: 0, top: top, width: width, height: region.extent };
      top += region.extent;
      if (region.splitter) {
        result[name + 'Splitter'] = {
          left: 0,
          top: top,
          width: width,
          height: region.splitter
        };
        top += region.splitter;
      }
    } else {
      result[name] = {
        left: 0,
        top: bottom - region.extent,
        width: width,
        height: region.extent
      };
      bottom -= region.extent;
      if (region.splitter) {
        bottom -= region.splitter;
        result[name + 'Splitter'] = {
          left: 0,
          top: bottom,
          width: width,
          height: region.splitter
        };
      }
    }
  }

  function setHorizontal(name, edge) {
    var region = getRegion(name);
    if (!region.exists) return;
    region.extent = Math.min(region.extent, Math.max(0, right - left));
    if (edge === 'left') {
      result[name] = {
        left: left,
        top: top,
        width: region.extent,
        height: Math.max(0, bottom - top)
      };
      left += region.extent;
      if (region.splitter) {
        result[name + 'Splitter'] = {
          left: left,
          top: top,
          width: region.splitter,
          height: Math.max(0, bottom - top)
        };
        left += region.splitter;
      }
    } else {
      result[name] = {
        left: right - region.extent,
        top: top,
        width: region.extent,
        height: Math.max(0, bottom - top)
      };
      right -= region.extent;
      if (region.splitter) {
        right -= region.splitter;
        result[name + 'Splitter'] = {
          left: right,
          top: top,
          width: region.splitter,
          height: Math.max(0, bottom - top)
        };
      }
    }
  }

  setVertical('north', 'top');
  setVertical('south', 'bottom');
  setHorizontal('west', 'left');
  setHorizontal('east', 'right');
  result.center = {
    left: left,
    top: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top)
  };
  return result;
}

export function createLayoutFactory(Control, registerControl, unregisterControl, Panel) {
  var localePacks = {
    en: {
      collapseNorth: 'Collapse north',
      collapseSouth: 'Collapse south',
      collapseEast: 'Collapse east',
      collapseWest: 'Collapse west',
      expandNorth: 'Expand north',
      expandSouth: 'Expand south',
      expandEast: 'Expand east',
      expandWest: 'Expand west'
    },
    'zh-TW': {
      collapseNorth: '收合上方區域',
      collapseSouth: '收合下方區域',
      collapseEast: '收合右方區域',
      collapseWest: '收合左方區域',
      expandNorth: '展開上方區域',
      expandSouth: '展開下方區域',
      expandEast: '展開右方區域',
      expandWest: '展開左方區域'
    },
    'zh-CN': {
      collapseNorth: '收合上方区域',
      collapseSouth: '收合下方区域',
      collapseEast: '收合右方区域',
      collapseWest: '收合左方区域',
      expandNorth: '展开上方区域',
      expandSouth: '展开下方区域',
      expandEast: '展开右方区域',
      expandWest: '展开左方区域'
    }
  };

  function normalizeLocale(value) {
    value = String(value || 'en').trim().replace(/_/g, '-');
    if (localePacks[value]) return value;
    if (/^zh-(?:tw|hant)(?:-|$)/i.test(value)) return 'zh-TW';
    if (/^zh-(?:cn|hans)(?:-|$)/i.test(value) || /^zh$/i.test(value)) return 'zh-CN';
    return 'en';
  }

  function titleCase(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function FabLayout(element, options) {
    var host = resolveLayoutElement(element);
    if (!(this instanceof FabLayout)) return new FabLayout(element, options);
    if (!host) throw new Error('fabui.Layout requires a host element.');
    if (host.__fabuiLayout) return host.__fabuiLayout;
    Control.call(this);
    this.hostElement = host;
    this.options = assignLayoutOptions({}, FabLayout.defaults, options || {});
    this.options.locale = normalizeLocale(this.options.locale);
    this.regions = {};
    this._listeners = {};
    this._splitters = {};
    this._expandBars = {};
    this._interaction = null;
    this._animationState = null;
    this._destroyed = false;
    this._createdElements = [];
    this._originalStyle = host.getAttribute('style');
    this._originalClass = host.getAttribute('class');
    this._build();
    host.__fabuiLayout = this;
    registerControl(host, this);
    this.setLocale(this.options.locale, this.options.messages);
    this.setTheme(this.options.theme);
    this._initializeRegions();
    if (!this.regions.center) {
      this.destroy();
      throw new Error('fabui.Layout requires a center region.');
    }
    this._bindResizeObserver();
    this.resize({
      width: this.options.width,
      height: this.options.height
    });
  }

  FabLayout.prototype = Object.create(Control.prototype);
  FabLayout.prototype.constructor = FabLayout;

  FabLayout.prototype._build = function() {
    this.hostElement.classList.add('fui-layout');
    if (this.options.cls) this.hostElement.classList.add(this.options.cls);
    if (this.options.fit || this.hostElement === document.body) {
      this.hostElement.classList.add('fui-layout-fit');
    }
  };

  FabLayout.prototype._initializeRegions = function() {
    var self = this;
    var configured = this.options.regions || {};
    var elements = Array.prototype.slice.call(this.hostElement.children);
    var seen = {};
    elements.forEach(function(element) {
      var region = normalizeLayoutRegion(element.getAttribute('data-region'));
      var config;
      if (!region || seen[region]) return;
      config = assignLayoutOptions({}, configured[region] || {}, {
        region: region,
        element: element
      });
      self.add(config, true);
      seen[region] = true;
    });
    LAYOUT_REGIONS.forEach(function(region) {
      var config = configured[region];
      if (!config || seen[region]) return;
      self.add(assignLayoutOptions({}, config, { region: region }), true);
      seen[region] = true;
    });
  };

  FabLayout.prototype._readRegionElementOptions = function(element, region) {
    var horizontal = region === 'east' || region === 'west';
    return {
      title: element.getAttribute('title') || '',
      width: horizontal ? (element.style.width || null) : null,
      height: horizontal ? null : (element.style.height || null),
      split: element.getAttribute('data-split') === 'true',
      collapsed: element.getAttribute('data-collapsed') === 'true'
    };
  };

  FabLayout.prototype._normalizeRegionOptions = function(options, element) {
    var region = normalizeLayoutRegion(options.region);
    var defaults = assignLayoutOptions({}, FabLayout.regionDefaults);
    defaults.collapseDelay = this.options.collapseDelay;
    var elementOptions = this._readRegionElementOptions(element, region);
    var result = assignLayoutOptions({}, defaults, elementOptions, options);
    var horizontal = region === 'east' || region === 'west';
    result.region = region;
    result.split = region === 'center' ? false : result.split === true;
    result.collapsible = region === 'center' ? false : result.collapsible !== false;
    result.width = horizontal ?
      layoutNumber(result.width, 180) :
      result.width;
    result.height = horizontal ?
      result.height :
      layoutNumber(result.height, region === 'center' ? 0 : 100);
    result.minWidth = Math.max(10, layoutNumber(result.minWidth, 10));
    result.minHeight = Math.max(10, layoutNumber(result.minHeight, 10));
    result.maxWidth = Math.max(result.minWidth, layoutNumber(result.maxWidth, 10000));
    result.maxHeight = Math.max(result.minHeight, layoutNumber(result.maxHeight, 10000));
    result.collapsedSize = Math.max(18, layoutNumber(result.collapsedSize, 28));
    result.splitSize = Math.max(3, layoutNumber(result.splitSize, this.options.splitSize));
    return result;
  };

  FabLayout.prototype._collapseTool = function(region) {
    var self = this;
    var direction = {
      north: 'up',
      south: 'down',
      east: 'right',
      west: 'left'
    }[region];
    return {
      iconCls: 'fui-layout-button-' + direction,
      ariaLabel: this.messages['collapse' + titleCase(region)],
      title: this.messages['collapse' + titleCase(region)],
      onClick: function() {
        self.collapse(region);
      }
    };
  };

  FabLayout.prototype.add = function(options, silent) {
    var self = this;
    var region = normalizeLayoutRegion(options && options.region);
    var element = resolveLayoutElement(options && options.element);
    var regionOptions;
    var panelOptions;
    var panel;
    var record;
    if (!region) throw new Error('Layout region must be north, south, east, west, or center.');
    if (this.regions[region]) return this.regions[region].panel;
    if (!element) {
      element = document.createElement('div');
      this.hostElement.appendChild(element);
      this._createdElements.push(element);
    }
    element.setAttribute('data-region', region);
    regionOptions = this._normalizeRegionOptions(options || {}, element);
    panelOptions = assignLayoutOptions({}, regionOptions);
    panelOptions.cls = ((panelOptions.cls || '') + ' fui-layout-region fui-layout-region-' + region).trim();
    panelOptions.bodyCls = ((panelOptions.bodyCls || '') + ' fui-layout-body').trim();
    panelOptions.fit = false;
    panelOptions.left = 0;
    panelOptions.top = 0;
    panelOptions.collapsible = false;
    panelOptions.minimizable = false;
    panelOptions.maximizable = false;
    panelOptions.closable = false;
    panelOptions.collapsed = false;
    panelOptions.theme = this.options.theme;
    panelOptions.locale = this.options.locale;
    panelOptions.tools = Array.isArray(panelOptions.tools) ? panelOptions.tools.slice() : [];
    if (regionOptions.collapsible !== false && region !== 'center') {
      panelOptions.tools.push(this._collapseTool(region));
    }
    panel = new Panel(element, panelOptions);
    record = {
      element: element,
      panel: panel,
      options: regionOptions,
      collapsed: regionOptions.collapsed === true,
      floating: false
    };
    if (region !== 'center') {
      record.onFloatEnter = function() {
        self.stopCollapsing();
      };
      record.onFloatLeave = function() {
        if (!record.floating) return;
        self.stopCollapsing();
        self._collapseTimer = setTimeout(function() {
          record.floating = false;
          record.panel.options.collapsed = true;
          record.panel.close(true);
          record.panel.panel().classList.remove('fui-layout-region-floating');
        }, Math.max(0, layoutNumber(record.options.collapseDelay, 100)));
      };
      panel.panel().addEventListener('mouseenter', record.onFloatEnter);
      panel.panel().addEventListener('mouseleave', record.onFloatLeave);
    }
    this.regions[region] = record;
    this._createSplitter(region);
    this._createExpandBar(region);
    if (!silent) {
      this.resize();
      this._fire('Add', { region: region, panel: panel });
    }
    return panel;
  };

  FabLayout.prototype._createSplitter = function(region) {
    var self = this;
    var record = this.regions[region];
    var splitter;
    if (!record || region === 'center') return;
    splitter = document.createElement('div');
    splitter.className = 'fui-layout-splitter fui-layout-splitter-' + region;
    splitter.tabIndex = 0;
    splitter.setAttribute('role', 'separator');
    splitter.setAttribute(
      'aria-orientation',
      region === 'north' || region === 'south' ? 'horizontal' : 'vertical'
    );
    splitter.addEventListener('pointerdown', function(event) {
      self._startSplit(event, region);
    });
    splitter.addEventListener('keydown', function(event) {
      self._handleSplitterKey(event, region);
    });
    this.hostElement.appendChild(splitter);
    this._splitters[region] = splitter;
  };

  FabLayout.prototype._createExpandBar = function(region) {
    var self = this;
    var record = this.regions[region];
    var bar;
    var title;
    var button;
    if (!record || region === 'center') return;
    bar = document.createElement('div');
    bar.className = 'fui-layout-expand fui-layout-expand-' + region;
    bar.hidden = true;
    bar.setAttribute('data-layout-expand', region);
    title = document.createElement('span');
    title.className = 'fui-layout-expand-title';
    title.textContent = record.options.hideCollapsedContent ?
      '' :
      (typeof record.options.collapsedContent === 'function' ?
        record.options.collapsedContent.call(record.element, record.options.title) :
        (record.options.collapsedContent || record.options.title || ''));
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'fui-layout-expand-button fui-layout-button-' + ({
      north: 'down',
      south: 'up',
      east: 'left',
      west: 'right'
    }[region]);
    button.title = this.messages['expand' + titleCase(region)];
    button.setAttribute('aria-label', this.messages['expand' + titleCase(region)]);
    button.addEventListener('click', function(event) {
      event.stopPropagation();
      self.expand(region);
    });
    bar.addEventListener('click', function() {
      if (record.options.expandMode === 'dock') self.expand(region);
      else if (record.options.expandMode === 'float') self._floatRegion(region);
    });
    bar.appendChild(title);
    if (!record.options.hideExpandTool) bar.appendChild(button);
    this.hostElement.appendChild(bar);
    this._expandBars[region] = bar;
  };

  FabLayout.prototype._regionGeometry = function() {
    var geometry = {};
    var self = this;
    LAYOUT_REGIONS.forEach(function(region) {
      var record = self.regions[region];
      if (!record) return;
      geometry[region] = {
        exists: true,
        collapsed: record.collapsed,
        size: region === 'north' || region === 'south' ?
          record.options.height :
          record.options.width,
        split: record.options.split,
        splitSize: record.options.splitSize,
        collapsedSize: record.options.collapsedSize
      };
    });
    return geometry;
  };

  FabLayout.prototype._applyRect = function(element, rect) {
    if (!element || !rect) return;
    element.style.left = Math.round(rect.left) + 'px';
    element.style.top = Math.round(rect.top) + 'px';
    element.style.width = Math.max(0, Math.round(rect.width)) + 'px';
    element.style.height = Math.max(0, Math.round(rect.height)) + 'px';
  };

  FabLayout.prototype._getAnimationDuration = function() {
    if (this.options.animate === false) return 0;
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return 0;
    return Math.max(0, layoutNumber(this.options.animationDuration, 180));
  };

  FabLayout.prototype._measureLayoutRects = function() {
    var hostRect = this.hostElement.getBoundingClientRect();
    var rects = {};
    var self = this;
    LAYOUT_REGIONS.forEach(function(region) {
      var record = self.regions[region];
      var panelElement;
      var panelRect;
      var splitter;
      var splitterRect;
      if (!record) return;
      panelElement = record.panel.panel();
      if (!panelElement.hidden) {
        panelRect = panelElement.getBoundingClientRect();
        rects[region] = {
          left: panelRect.left - hostRect.left,
          top: panelRect.top - hostRect.top,
          width: panelRect.width,
          height: panelRect.height
        };
      } else if (self._rects && self._rects[region]) {
        rects[region] = assignLayoutOptions({}, self._rects[region]);
      }
      splitter = self._splitters[region];
      if (splitter && !splitter.hidden) {
        splitterRect = splitter.getBoundingClientRect();
        rects[region + 'Splitter'] = {
          left: splitterRect.left - hostRect.left,
          top: splitterRect.top - hostRect.top,
          width: splitterRect.width,
          height: splitterRect.height
        };
      }
    });
    return rects;
  };

  FabLayout.prototype._freezeLayoutRects = function(rects) {
    var self = this;
    LAYOUT_REGIONS.forEach(function(region) {
      var record = self.regions[region];
      var splitter = self._splitters[region];
      if (record && rects[region] && !record.panel.panel().hidden) {
        record.panel.resize(rects[region], true);
      }
      if (splitter && rects[region + 'Splitter'] && !splitter.hidden) {
        self._applyRect(splitter, rects[region + 'Splitter']);
      }
    });
  };

  FabLayout.prototype._finishRegionAnimation = function(runComplete, applyFinalState) {
    var state = this._animationState;
    var expandBar;
    var splitter;
    if (!state) return;
    if (state.startTimer != null) clearTimeout(state.startTimer);
    if (state.endTimer != null) clearTimeout(state.endTimer);
    this._animationState = null;
    this.hostElement.classList.remove('fui-layout-animating');
    this.hostElement.style.removeProperty('--fui-layout-animation-duration');
    expandBar = this._expandBars[state.region];
    splitter = this._splitters[state.region];
    if (expandBar) {
      expandBar.style.removeProperty('opacity');
      expandBar.style.removeProperty('pointer-events');
    }
    if (splitter) splitter.style.removeProperty('opacity');
    if (applyFinalState !== false) this._layoutRegions();
    if (runComplete !== false && state.complete) state.complete();
  };

  FabLayout.prototype._cancelRegionAnimation = function(runComplete, applyFinalState) {
    if (this._animationState) {
      this._finishRegionAnimation(runComplete, applyFinalState);
    }
  };

  FabLayout.prototype._animateRegionState = function(region, collapsed, complete) {
    var self = this;
    var record = this.regions[region];
    var duration;
    var startRects;
    var targetRects;
    var expandBar;
    var splitter;
    if (!record) return;
    if (this._animationState) {
      startRects = this._measureLayoutRects();
      this._freezeLayoutRects(startRects);
      this._cancelRegionAnimation(false, false);
    } else {
      startRects = this._rects || calculateLayoutRects(
        {
          width: this.hostElement.clientWidth,
          height: this.hostElement.clientHeight
        },
        this._regionGeometry()
      );
    }
    record.collapsed = collapsed;
    record.floating = false;
    record.panel.options.collapsed = collapsed;
    targetRects = calculateLayoutRects(
      {
        width: this.hostElement.clientWidth,
        height: this.hostElement.clientHeight
      },
      this._regionGeometry()
    );
    duration = this._getAnimationDuration();
    if (!duration) {
      this._rects = targetRects;
      this._layoutRegions();
      if (complete) complete();
      return;
    }

    expandBar = this._expandBars[region];
    splitter = this._splitters[region];
    record.panel.hostElement.hidden = false;
    if (!record.panel.isOpen()) record.panel.open(true);
    record.panel.resize(startRects[region], true);
    if (expandBar) {
      expandBar.hidden = false;
      this._applyRect(expandBar, collapsed ? targetRects[region] : startRects[region]);
      expandBar.style.opacity = collapsed ? '0' : '1';
      expandBar.style.pointerEvents = 'none';
    }
    if (splitter) {
      splitter.hidden = false;
      if (startRects[region + 'Splitter']) {
        this._applyRect(splitter, startRects[region + 'Splitter']);
      } else if (targetRects[region + 'Splitter']) {
        this._applyRect(splitter, targetRects[region + 'Splitter']);
      }
      splitter.style.opacity = collapsed ? '1' : '0';
    }

    this.hostElement.style.setProperty('--fui-layout-animation-duration', duration + 'ms');
    this.hostElement.classList.add('fui-layout-animating');
    this.hostElement.offsetWidth;
    this._animationState = {
      region: region,
      collapsed: collapsed,
      complete: complete,
      startTimer: null,
      endTimer: null
    };
    this._animationState.startTimer = setTimeout(function() {
      var state = self._animationState;
      if (!state || state.region !== region || state.collapsed !== collapsed) return;
      state.startTimer = null;
      LAYOUT_REGIONS.forEach(function(name) {
        var item = self.regions[name];
        var rect = targetRects[name];
        if (!item || !rect || (item.collapsed && name !== region)) return;
        item.panel.resize(rect, true);
      });
      if (expandBar) expandBar.style.opacity = collapsed ? '1' : '0';
      if (splitter) splitter.style.opacity = collapsed ? '0' : '1';
      self._rects = targetRects;
      state.endTimer = setTimeout(function() {
        self._finishRegionAnimation(true);
      }, duration + 34);
    }, 16);
  };

  FabLayout.prototype._layoutRegions = function() {
    var width = this.hostElement.clientWidth;
    var height = this.hostElement.clientHeight;
    var rects = calculateLayoutRects({ width: width, height: height }, this._regionGeometry());
    var self = this;
    if (this._animationState) return;
    LAYOUT_REGIONS.forEach(function(region) {
      var record = self.regions[region];
      var rect = rects[region];
      var splitter = self._splitters[region];
      var expandBar = self._expandBars[region];
      if (!record || !rect) return;
      if (record.collapsed) {
        record.panel.options.collapsed = true;
        if (record.panel.isOpen()) record.panel.close(true);
        if (expandBar) {
          expandBar.hidden = false;
          self._applyRect(expandBar, rect);
        }
      } else {
        if (expandBar) expandBar.hidden = true;
        record.panel.options.collapsed = false;
        record.panel.hostElement.hidden = false;
        if (!record.panel.isOpen()) record.panel.open(true);
        record.panel.resize({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        }, true);
      }
      if (splitter) {
        splitter.hidden = !record.options.split || record.collapsed;
        if (!splitter.hidden) self._applyRect(splitter, rects[region + 'Splitter']);
      }
    });
    this._rects = rects;
    this._fire('Resize', { width: width, height: height });
  };

  FabLayout.prototype._startSplit = function(event, region) {
    var record = this.regions[region];
    var rect;
    var splitter;
    if (
      event.button !== 0 ||
      !record ||
      !record.options.split ||
      record.collapsed
    ) return;
    event.preventDefault();
    rect = record.panel.panel().getBoundingClientRect();
    this._interaction = {
      region: region,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      size: region === 'north' || region === 'south' ? rect.height : rect.width,
      pendingSize: region === 'north' || region === 'south' ?
        rect.height :
        rect.width
    };
    splitter = this._splitters[region];
    if (splitter) splitter.classList.add('fui-layout-splitter-dragging');
    this.hostElement.classList.add('fui-layout-resizing');
    this._bindDocumentSplit();
  };

  FabLayout.prototype._bindDocumentSplit = function() {
    var self = this;
    this._unbindDocumentSplit();
    this._onDocumentPointerMove = function(event) { self._handleSplitMove(event); };
    this._onDocumentPointerEnd = function(event) { self._finishSplit(event); };
    document.addEventListener('pointermove', this._onDocumentPointerMove);
    document.addEventListener('pointerup', this._onDocumentPointerEnd);
    document.addEventListener('pointercancel', this._onDocumentPointerEnd);
  };

  FabLayout.prototype._unbindDocumentSplit = function() {
    if (!this._onDocumentPointerMove) return;
    document.removeEventListener('pointermove', this._onDocumentPointerMove);
    document.removeEventListener('pointerup', this._onDocumentPointerEnd);
    document.removeEventListener('pointercancel', this._onDocumentPointerEnd);
    this._onDocumentPointerMove = null;
    this._onDocumentPointerEnd = null;
  };

  FabLayout.prototype._setRegionSize = function(region, size) {
    var record = this.regions[region];
    var vertical = region === 'north' || region === 'south';
    if (!record) return;
    size = this._normalizeRegionSize(region, size);
    if (vertical) record.options.height = size;
    else record.options.width = size;
    this._layoutRegions();
  };

  FabLayout.prototype._normalizeRegionSize = function(region, size) {
    var record = this.regions[region];
    var vertical = region === 'north' || region === 'south';
    if (!record) return 0;
    return clampLayoutValue(
      size,
      vertical ? record.options.minHeight : record.options.minWidth,
      vertical ? record.options.maxHeight : record.options.maxWidth
    );
  };

  FabLayout.prototype._handleSplitMove = function(event) {
    var state = this._interaction;
    var delta;
    var offset;
    var size;
    var splitter;
    if (!state || event.pointerId !== state.pointerId) return;
    event.preventDefault();
    if (state.region === 'north' || state.region === 'south') {
      delta = event.clientY - state.startY;
      size = state.size + (state.region === 'north' ? delta : -delta);
    } else {
      delta = event.clientX - state.startX;
      size = state.size + (state.region === 'west' ? delta : -delta);
    }
    size = this._normalizeRegionSize(state.region, size);
    offset = size - state.size;
    if (state.region === 'south' || state.region === 'east') offset *= -1;
    state.pendingSize = size;
    splitter = this._splitters[state.region];
    if (splitter) {
      splitter.style.transform =
        state.region === 'north' || state.region === 'south' ?
          'translateY(' + offset + 'px)' :
          'translateX(' + offset + 'px)';
    }
  };

  FabLayout.prototype._finishSplit = function(event) {
    var state = this._interaction;
    var cancelled;
    var record;
    var splitter;
    if (!state || event.pointerId !== state.pointerId) return;
    cancelled = event.type === 'pointercancel';
    if (!cancelled) this._handleSplitMove(event);
    record = this.regions[state.region];
    splitter = this._splitters[state.region];
    if (splitter) {
      splitter.classList.remove('fui-layout-splitter-dragging');
      splitter.style.removeProperty('transform');
    }
    this._interaction = null;
    this.hostElement.classList.remove('fui-layout-resizing');
    this._unbindDocumentSplit();
    if (cancelled || !record) return;
    if (Math.abs(state.pendingSize - state.size) > 0.01) {
      this._setRegionSize(state.region, state.pendingSize);
    }
    this._fire('RegionResize', {
      region: state.region,
      width: record.panel.panel().offsetWidth,
      height: record.panel.panel().offsetHeight
    });
  };

  FabLayout.prototype._handleSplitterKey = function(event, region) {
    var record = this.regions[region];
    var vertical = region === 'north' || region === 'south';
    var size = vertical ? record.options.height : record.options.width;
    var delta = 0;
    if (vertical && event.key === 'ArrowUp') delta = region === 'north' ? -10 : 10;
    if (vertical && event.key === 'ArrowDown') delta = region === 'north' ? 10 : -10;
    if (!vertical && event.key === 'ArrowLeft') delta = region === 'west' ? -10 : 10;
    if (!vertical && event.key === 'ArrowRight') delta = region === 'west' ? 10 : -10;
    if (!delta) return;
    event.preventDefault();
    this._setRegionSize(region, size + delta);
    this._fire('RegionResize', {
      region: region,
      width: record.panel.panel().offsetWidth,
      height: record.panel.panel().offsetHeight
    });
  };

  FabLayout.prototype._floatRegion = function(region) {
    var record = this.regions[region];
    var rect;
    var center = this._rects && this._rects.center;
    if (!record || !record.collapsed || !center) return this;
    rect = assignLayoutOptions({}, center);
    if (region === 'west') rect.width = record.options.width;
    if (region === 'east') {
      rect.left = center.left + center.width - record.options.width;
      rect.width = record.options.width;
    }
    if (region === 'north') rect.height = record.options.height;
    if (region === 'south') {
      rect.top = center.top + center.height - record.options.height;
      rect.height = record.options.height;
    }
    record.floating = true;
    record.panel.options.collapsed = false;
    record.panel.hostElement.hidden = false;
    record.panel.open(true);
    record.panel.panel().classList.add('fui-layout-region-floating');
    record.panel.resize(rect, true);
    return this;
  };

  FabLayout.prototype.collapse = function(region) {
    var normalized = normalizeLayoutRegion(region);
    var record = this.regions[normalized];
    var self = this;
    if (!record || normalized === 'center' || record.collapsed || record.options.collapsible === false) return this;
    if (record.panel._fireBefore && !record.panel._fireBefore('Collapse')) return this;
    record.panel.panel().classList.remove('fui-layout-region-floating');
    this._animateRegionState(normalized, true, function() {
      record.panel._fire('Collapse');
      self._fire('Collapse', { region: normalized, panel: record.panel });
    });
    return this;
  };

  FabLayout.prototype.expand = function(region) {
    var normalized = normalizeLayoutRegion(region);
    var record = this.regions[normalized];
    var self = this;
    if (!record || normalized === 'center' || !record.collapsed) return this;
    if (record.panel._fireBefore && !record.panel._fireBefore('Expand')) return this;
    record.panel.panel().classList.remove('fui-layout-region-floating');
    this._animateRegionState(normalized, false, function() {
      record.panel._fire('Expand');
      self._fire('Expand', { region: normalized, panel: record.panel });
    });
    return this;
  };

  FabLayout.prototype.remove = function(region) {
    var normalized = normalizeLayoutRegion(region);
    var record = this.regions[normalized];
    var element;
    if (!record || normalized === 'center') return this;
    this._cancelRegionAnimation(true);
    element = record.element;
    if (record.onFloatEnter) {
      record.panel.panel().removeEventListener('mouseenter', record.onFloatEnter);
      record.panel.panel().removeEventListener('mouseleave', record.onFloatLeave);
    }
    record.panel.destroy(true);
    if (element.parentNode) element.parentNode.removeChild(element);
    if (this._splitters[normalized] && this._splitters[normalized].parentNode) {
      this._splitters[normalized].parentNode.removeChild(this._splitters[normalized]);
    }
    if (this._expandBars[normalized] && this._expandBars[normalized].parentNode) {
      this._expandBars[normalized].parentNode.removeChild(this._expandBars[normalized]);
    }
    delete this.regions[normalized];
    delete this._splitters[normalized];
    delete this._expandBars[normalized];
    this.resize();
    this._fire('Remove', { region: normalized });
    return this;
  };

  FabLayout.prototype.split = function(region) {
    var record = this.regions[normalizeLayoutRegion(region)];
    if (!record || region === 'center') return this;
    record.options.split = true;
    this.resize();
    return this;
  };

  FabLayout.prototype.unsplit = function(region) {
    var record = this.regions[normalizeLayoutRegion(region)];
    if (!record || region === 'center') return this;
    record.options.split = false;
    this.resize();
    return this;
  };

  FabLayout.prototype.stopCollapsing = function() {
    if (this._collapseTimer) clearTimeout(this._collapseTimer);
    this._collapseTimer = null;
    return this;
  };

  FabLayout.prototype.panel = function(region) {
    var record = this.regions[normalizeLayoutRegion(region)];
    return record ? record.panel : null;
  };

  FabLayout.prototype.resize = function(options) {
    options = options || {};
    this._cancelRegionAnimation(true);
    if (options.width != null) this.options.width = options.width;
    if (options.height != null) this.options.height = options.height;
    if (this.options.fit || this.hostElement === document.body) {
      this.hostElement.style.width = '100%';
      this.hostElement.style.height = '100%';
    } else {
      if (this.options.width != null) {
        this.hostElement.style.width = typeof this.options.width === 'number' ?
          this.options.width + 'px' :
          this.options.width;
      }
      if (this.options.height != null) {
        this.hostElement.style.height = typeof this.options.height === 'number' ?
          this.options.height + 'px' :
          this.options.height;
      }
    }
    this._layoutRegions();
    return this;
  };

  FabLayout.prototype._bindResizeObserver = function() {
    var self = this;
    if (typeof ResizeObserver !== 'function') return;
    this._resizeObserver = new ResizeObserver(function() {
      if (!self._destroyed && !self._interaction && !self._animationState) {
        self._layoutRegions();
      }
    });
    this._resizeObserver.observe(this.hostElement);
  };

  FabLayout.prototype.setTheme = function(theme) {
    var self = this;
    var previous = this._themeClass;
    this.options.theme = theme == null ? 'inherit' : theme;
    if (previous) this.hostElement.classList.remove(previous);
    this._themeClass = 'fg-theme-' + (
      this.options.theme === 'inherit' ?
        findLayoutTheme(this.hostElement.parentElement) :
        (LAYOUT_THEMES.indexOf(this.options.theme) >= 0 ? this.options.theme : 'default')
    );
    this.hostElement.classList.add(this._themeClass);
    LAYOUT_REGIONS.forEach(function(region) {
      if (self.regions[region]) self.regions[region].panel.setTheme(self.options.theme);
    });
    return this;
  };

  FabLayout.prototype.setLocale = function(locale, messages) {
    var self = this;
    this.options.locale = normalizeLocale(locale);
    this.options.messages = messages || this.options.messages;
    this.messages = assignLayoutOptions({}, localePacks[this.options.locale], this.options.messages || {});
    LAYOUT_EDGE_REGIONS.forEach(function(region) {
      var record = self.regions[region];
      var bar = self._expandBars[region];
      var button = bar && bar.querySelector('.fui-layout-expand-button');
      if (record) record.panel.setLocale(self.options.locale);
      if (record) {
        var collapseTool = record.panel.toolsElement.querySelector(
          '.fui-layout-button-' + ({
            north: 'up',
            south: 'down',
            east: 'right',
            west: 'left'
          }[region])
        );
        if (collapseTool) {
          collapseTool.title = self.messages['collapse' + titleCase(region)];
          collapseTool.setAttribute('aria-label', self.messages['collapse' + titleCase(region)]);
        }
      }
      if (button) {
        button.title = self.messages['expand' + titleCase(region)];
        button.setAttribute('aria-label', self.messages['expand' + titleCase(region)]);
      }
    });
    if (this.regions.center) this.regions.center.panel.setLocale(this.options.locale);
    return this;
  };

  FabLayout.prototype._fire = function(name, detail) {
    var callback = this.options['on' + name];
    var listeners = (this._listeners[name.toLowerCase()] || []).slice();
    var eventDetail = assignLayoutOptions({ layout: this }, detail || {});
    if (typeof callback === 'function') callback.call(this.hostElement, this, eventDetail);
    listeners.forEach(function(listener) { listener.call(this, eventDetail); }, this);
  };

  FabLayout.prototype.on = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!name || typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  FabLayout.prototype.off = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!this._listeners[name]) return this;
    this._listeners[name] = listener ?
      this._listeners[name].filter(function(item) { return item !== listener; }) :
      [];
    return this;
  };

  FabLayout.prototype.destroy = function() {
    var self = this;
    if (this._destroyed) return;
    this._destroyed = true;
    this.stopCollapsing();
    this._cancelRegionAnimation(false, false);
    this._unbindDocumentSplit();
    if (this._resizeObserver) this._resizeObserver.disconnect();
    LAYOUT_REGIONS.forEach(function(region) {
      var record = self.regions[region];
      if (!record) return;
      if (record.onFloatEnter) {
        record.panel.panel().removeEventListener('mouseenter', record.onFloatEnter);
        record.panel.panel().removeEventListener('mouseleave', record.onFloatLeave);
      }
      record.panel.destroy(true);
    });
    Object.keys(this._splitters).forEach(function(region) {
      var splitter = self._splitters[region];
      if (splitter.parentNode) splitter.parentNode.removeChild(splitter);
    });
    Object.keys(this._expandBars).forEach(function(region) {
      var bar = self._expandBars[region];
      if (bar.parentNode) bar.parentNode.removeChild(bar);
    });
    this._createdElements.forEach(function(element) {
      if (element.parentNode) element.parentNode.removeChild(element);
    });
    unregisterControl(this.hostElement, this);
    delete this.hostElement.__fabuiLayout;
    if (this._originalClass == null) this.hostElement.removeAttribute('class');
    else this.hostElement.setAttribute('class', this._originalClass);
    if (this._originalStyle == null) this.hostElement.removeAttribute('style');
    else this.hostElement.setAttribute('style', this._originalStyle);
    this._fire('Destroy');
    this.regions = {};
    this._splitters = {};
    this._expandBars = {};
    this._createdElements = [];
    this._listeners = {};
  };

  FabLayout.prototype.dispose = FabLayout.prototype.destroy;

  FabLayout.defaults = {
    width: null,
    height: null,
    fit: false,
    cls: '',
    splitSize: 5,
    collapseDelay: 100,
    animate: true,
    animationDuration: 180,
    regions: null,
    theme: 'inherit',
    locale: 'en',
    messages: null
  };
  FabLayout.regionDefaults = {
    title: '',
    border: true,
    split: false,
    collapsible: true,
    minWidth: 10,
    minHeight: 10,
    maxWidth: 10000,
    maxHeight: 10000,
    expandMode: 'float',
    collapseDelay: 100,
    collapsedSize: 28,
    hideExpandTool: false,
    hideCollapsedContent: true,
    collapsedContent: '',
    width: null,
    height: null,
    tools: null,
    collapsed: false
  };
  FabLayout.locales = localePacks;
  FabLayout.themes = LAYOUT_THEMES.slice();
  FabLayout.normalizeLocale = normalizeLocale;
  FabLayout.getControl = function(element) {
    element = resolveLayoutElement(element);
    return element && element.__fabuiLayout ? element.__fabuiLayout : null;
  };
  return FabLayout;
}
