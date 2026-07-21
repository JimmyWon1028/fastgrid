var TABS_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];

export function normalizeTabsTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return TABS_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

export function reorderTabRecords(records, fromIndex, toIndex) {
  var record;
  if (!Array.isArray(records) || !records.length) return false;
  fromIndex = Math.floor(Number(fromIndex));
  toIndex = Math.floor(Number(toIndex));
  if (
    !isFinite(fromIndex) ||
    !isFinite(toIndex) ||
    fromIndex < 0 ||
    fromIndex >= records.length
  ) return false;
  toIndex = Math.max(0, Math.min(records.length - 1, toIndex));
  if (fromIndex === toIndex) return false;
  record = records.splice(fromIndex, 1)[0];
  records.splice(toIndex, 0, record);
  return true;
}

export function resolveTabDropIndex(fromIndex, targetIndex, length) {
  var insertIndex;
  var insertBefore;
  fromIndex = Math.floor(Number(fromIndex));
  targetIndex = Math.floor(Number(targetIndex));
  length = Math.max(0, Math.floor(Number(length)));
  if (
    !isFinite(fromIndex) ||
    !isFinite(targetIndex) ||
    !length ||
    fromIndex < 0 ||
    fromIndex >= length ||
    targetIndex < 0 ||
    targetIndex >= length
  ) return -1;
  insertBefore = targetIndex < fromIndex;
  insertIndex = targetIndex + (insertBefore ? 0 : 1);
  if (insertIndex > fromIndex) insertIndex -= 1;
  return Math.max(0, Math.min(length - 1, insertIndex));
}

export function resolveTabDropSide(fromIndex, targetIndex) {
  fromIndex = Math.floor(Number(fromIndex));
  targetIndex = Math.floor(Number(targetIndex));
  if (!isFinite(fromIndex) || !isFinite(targetIndex) || fromIndex === targetIndex) {
    return null;
  }
  return targetIndex < fromIndex ? 'before' : 'after';
}

function findTabsTheme(element) {
  var current = element;
  var index;
  while (current && current.classList) {
    for (index = 0; index < TABS_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + TABS_THEMES[index])) {
        return TABS_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

export function createTabsFactory(Control, registerControl, unregisterControl) {
  'use strict';

  var defaults = {
    width: 'auto',
    height: 'auto',
    fit: false,
    border: true,
    scrollIncrement: 100,
    scrollDuration: 400,
    plain: false,
    narrow: false,
    pill: false,
    justified: false,
    draggable: false,
    tabPosition: 'top',
    toolPosition: 'right',
    headerWidth: 150,
    tabWidth: 'auto',
    tabHeight: 28,
    selected: 0,
    locale: 'en',
    theme: 'inherit',
    cls: '',
    showHeader: true,
    tools: [],
    tabs: [],
    onBeforeSelect: null,
    onSelect: null,
    onUnselect: null,
    onBeforeClose: null,
    onClose: null,
    onAdd: null,
    onUpdate: null,
    onLoad: null,
    onContextMenu: null,
    onReorder: null
  };
  var localePacks = {
    en: {
      untitled: 'Untitled',
      previous: 'Previous tabs',
      next: 'Next tabs',
      close: 'Close {title}',
      tool: 'Tab tool {index}',
      loadError: 'Unable to load tab content: {status}'
    },
    'zh-TW': {
      untitled: '未命名',
      previous: '上一組頁籤',
      next: '下一組頁籤',
      close: '關閉 {title}',
      tool: '頁籤工具 {index}',
      loadError: '無法載入頁籤內容：{status}'
    },
    'zh-CN': {
      untitled: '未命名',
      previous: '上一组页签',
      next: '下一组页签',
      close: '关闭 {title}',
      tool: '页签工具 {index}',
      loadError: '无法加载页签内容：{status}'
    }
  };

  function assign(target) {
    var source;
    var key;
    var i;
    for (i = 1; i < arguments.length; i += 1) {
      source = arguments[i] || {};
      for (key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
      }
    }
    return target;
  }

  function resolveElement(element) {
    if (typeof element === 'string') {
      try {
        return document.querySelector(element);
      } catch (error) {
        return null;
      }
    }
    return element;
  }

  function cssSize(value) {
    if (value == null || value === '' || value === 'auto') return 'auto';
    return typeof value === 'number' ? value + 'px' : String(value);
  }

  function normalizePosition(value) {
    value = String(value || 'top').toLowerCase();
    return ['top', 'bottom', 'left', 'right'].indexOf(value) >= 0 ? value : 'top';
  }

  function normalizeToolPosition(value) {
    value = String(value || 'right').toLowerCase();
    return ['left', 'right', 'top', 'bottom'].indexOf(value) >= 0 ? value : 'right';
  }

  function normalizeLocale(value) {
    value = String(value || 'en').trim().replace(/_/g, '-');
    if (localePacks[value]) return value;
    if (/^zh-(?:TW|Hant)(?:-|$)/i.test(value)) return 'zh-TW';
    if (/^zh-(?:CN|Hans)(?:-|$)/i.test(value) || /^zh$/i.test(value)) return 'zh-CN';
    return 'en';
  }

  function formatText(text, values) {
    return String(text || '').replace(/\{([^}]+)\}/g, function(match, key) {
      return values && values[key] != null ? values[key] : match;
    });
  }

  function readBoolean(element, name, fallback) {
    var value = element.getAttribute(name);
    if (value == null) return fallback;
    return value === '' || value === name || value === 'true' || value === '1';
  }

  function isElementNode(value) {
    return value && value.nodeType === 1;
  }

  function Tabs(element, options) {
    var children;
    var configuredTabs;
    var i;
    if (!(this instanceof Tabs)) return new Tabs(element, options);
    this.element = resolveElement(element);
    if (!this.element || this.element.nodeType !== 1) {
      throw new Error('fabui.Tabs requires a container element.');
    }
    if (this.element.__fabuiTabs) return this.element.__fabuiTabs;
    Control.call(this);
    this.hostElement = this.element;
    this._listeners = {};
    this._tabs = [];
    this._selectedIndex = -1;
    this._destroyed = false;
    this._dragState = null;
    this._dragImage = null;
    this._dragBlocked = false;
    this._originalClassName = this.element.className;
    this._originalStyle = this.element.getAttribute('style');
    this._originalHtml = this.element.innerHTML;
    this._themeSource = this.element.parentElement || document.body;
    this._options = assign({}, defaults, this._readElementOptions(), options || {});
    this._options.tabPosition = normalizePosition(this._options.tabPosition);
    this._options.toolPosition = normalizeToolPosition(this._options.toolPosition);
    this._options.locale = normalizeLocale(this._options.locale);
    children = Array.prototype.slice.call(this.element.children);
    this._build();
    for (i = 0; i < children.length; i += 1) {
      this._appendExistingPanel(children[i]);
    }
    configuredTabs = Array.isArray(this._options.tabs) ? this._options.tabs : [];
    for (i = 0; i < configuredTabs.length; i += 1) {
      this.add(assign({}, configuredTabs[i], { selected: false }), true);
    }
    this._renderTools();
    this._applyOptions();
    if (this._tabs.length) this.select(this._options.selected, true);
    this.element.__fabuiTabs = this;
    registerControl(this.element, this);
    this.setTheme(this._options.theme);
  }

  Tabs.prototype = Object.create(Control.prototype);
  Tabs.prototype.constructor = Tabs;

  Tabs.prototype._readElementOptions = function() {
    var options = {};
    var width = this.element.style.width;
    var height = this.element.style.height;
    var value;
    if (width) options.width = width;
    if (height) options.height = height;
    value = this.element.getAttribute('tabPosition');
    if (value) options.tabPosition = value;
    value = this.element.getAttribute('toolPosition');
    if (value) options.toolPosition = value;
    value = this.element.getAttribute('theme');
    if (value) options.theme = value;
    value = this.element.getAttribute('locale');
    if (value) options.locale = value;
    ['fit', 'border', 'plain', 'narrow', 'pill', 'justified', 'draggable', 'showHeader'].forEach(function(name) {
      var parsed = readBoolean(this.element, name, null);
      if (parsed != null) options[name] = parsed;
    }, this);
    return options;
  };

  Tabs.prototype._build = function() {
    var header = document.createElement('div');
    var strip = document.createElement('div');
    var previous = document.createElement('button');
    var next = document.createElement('button');
    var viewport = document.createElement('div');
    var list = document.createElement('div');
    var tools = document.createElement('div');
    var panels = document.createElement('div');
    this.element.textContent = '';
    this.element.className = (
      (this._originalClassName ? this._originalClassName + ' ' : '') +
      'fui-tabs ' +
      (this._options.cls || '')
    ).trim();
    header.className = 'fui-tabs-header';
    strip.className = 'fui-tabs-strip';
    previous.type = 'button';
    previous.className = 'fui-tabs-scroll fui-tabs-scroll-prev';
    previous.setAttribute('aria-label', this._getText('previous'));
    next.type = 'button';
    next.className = 'fui-tabs-scroll fui-tabs-scroll-next';
    next.setAttribute('aria-label', this._getText('next'));
    viewport.className = 'fui-tabs-viewport';
    list.className = 'fui-tabs-list';
    list.setAttribute('role', 'tablist');
    tools.className = 'fui-tabs-tools';
    panels.className = 'fui-tabs-panels';
    viewport.appendChild(list);
    strip.appendChild(previous);
    strip.appendChild(viewport);
    strip.appendChild(next);
    header.appendChild(strip);
    header.appendChild(tools);
    this.element.appendChild(header);
    this.element.appendChild(panels);
    this.header = header;
    this.strip = strip;
    this.previousButton = previous;
    this.nextButton = next;
    this.viewport = viewport;
    this.list = list;
    this.tools = tools;
    this.panels = panels;
    this._bind();
  };

  Tabs.prototype._bind = function() {
    var self = this;
    this._onTabClick = function(event) {
      var close = event.target.closest('.fui-tabs-close');
      var panelTool = event.target.closest('.fui-tabs-panel-tool');
      var tab = event.target.closest('.fui-tabs-tab');
      var index;
      var toolIndex;
      var tool;
      if (!tab || !self.list.contains(tab)) return;
      index = Number(tab.getAttribute('data-index'));
      if (panelTool) {
        event.preventDefault();
        event.stopPropagation();
        toolIndex = Number(panelTool.getAttribute('data-tool-index'));
        tool = self._tabs[index] && self._tabs[index].panelTools[toolIndex];
        if (tool) {
          if (typeof tool.handler === 'function') tool.handler.call(self, event, self._tabs[index].panel);
          else if (typeof tool.onClick === 'function') tool.onClick.call(self, event, self._tabs[index].panel);
        }
        return;
      }
      if (close) {
        event.preventDefault();
        event.stopPropagation();
        self.close(index);
        return;
      }
      self.select(index);
    };
    this._onContextMenu = function(event) {
      var tab = event.target.closest('.fui-tabs-tab');
      var index;
      if (!tab || !self.list.contains(tab)) return;
      index = Number(tab.getAttribute('data-index'));
      self._invoke('onContextMenu', event, self._tabs[index].options.title, index);
      self._emit('contextmenu', {
        originalEvent: event,
        title: self._tabs[index].options.title,
        index: index,
        tab: self._tabs[index].panel
      });
    };
    this._onTabKeyDown = function(event) {
      var tab = event.target.closest('.fui-tabs-tab');
      var index;
      var nextIndex;
      if (!tab) return;
      index = Number(tab.getAttribute('data-index'));
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = self._findEnabled(index, 1);
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = self._findEnabled(index, -1);
      if (event.key === 'Home') nextIndex = self._findEnabled(-1, 1);
      if (event.key === 'End') nextIndex = self._findEnabled(0, -1);
      if (event.key === 'Delete' && self._tabs[index] && self._tabs[index].options.closable) {
        event.preventDefault();
        self.close(index);
        return;
      }
      if (nextIndex != null && nextIndex >= 0) {
        event.preventDefault();
        self.select(nextIndex);
        self._tabs[nextIndex].tab.focus();
      }
    };
    this._onTabPointerDown = function(event) {
      self._dragBlocked = Boolean(
        event.target.closest('.fui-tabs-close') ||
        event.target.closest('.fui-tabs-panel-tool')
      );
    };
    this._onTabPointerUp = function() {
      self._dragBlocked = false;
    };
    this._onTabDragStart = function(event) {
      var title = event.target.closest('.fui-tabs-title');
      var tab = title && title.closest('.fui-tabs-tab');
      var index;
      if (
        !self._isHorizontalDragEnabled() ||
        self._dragBlocked ||
        !title ||
        !tab ||
        !self.list.contains(tab)
      ) {
        event.preventDefault();
        return;
      }
      index = Number(tab.getAttribute('data-index'));
      if (!self._tabs[index] || self._tabs[index].options.disabled) {
        event.preventDefault();
        return;
      }
      self._dragState = {
        fromIndex: index,
        dropIndex: index,
        tab: tab
      };
      tab.classList.add('fui-tabs-tab-dragging');
      self.element.classList.add('fui-tabs-dragging');
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(index));
        self._createTabDragImage(tab, event);
        if (self._dragImage) {
          event.dataTransfer.setDragImage(
            self._dragImage,
            self._dragImageOffsetX,
            self._dragImageOffsetY
          );
        }
      }
    };
    this._onTabDragOver = function(event) {
      var state = self._dragState;
      var target;
      var targetIndex;
      var insertIndex;
      var dropSide;
      var viewportRect;
      if (!state || !self._isHorizontalDragEnabled()) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      target = event.target.closest('.fui-tabs-tab');
      self._clearDropIndicators();
      if (target === state.tab) {
        state.dropIndex = state.fromIndex;
        return;
      }
      if (target && self.list.contains(target)) {
        targetIndex = Number(target.getAttribute('data-index'));
        insertIndex = resolveTabDropIndex(state.fromIndex, targetIndex, self._tabs.length);
        dropSide = resolveTabDropSide(state.fromIndex, targetIndex);
        if (dropSide) target.classList.add('fui-tabs-drop-' + dropSide);
      } else {
        insertIndex = event.clientX < self.list.getBoundingClientRect().left ?
          0 :
          self._tabs.length;
        if (insertIndex > state.fromIndex) insertIndex -= 1;
        insertIndex = Math.max(0, Math.min(self._tabs.length - 1, insertIndex));
      }
      state.dropIndex = insertIndex;
      viewportRect = self.viewport.getBoundingClientRect();
      if (event.clientX < viewportRect.left + 24) self.viewport.scrollLeft -= 18;
      else if (event.clientX > viewportRect.right - 24) self.viewport.scrollLeft += 18;
    };
    this._onTabDrop = function(event) {
      var state = self._dragState;
      if (!state) return;
      event.preventDefault();
      self._moveTab(state.fromIndex, state.dropIndex);
      self._clearTabDrag();
    };
    this._onTabDragEnd = function() {
      self._clearTabDrag();
    };
    this._onPrevious = function() { self.scrollBy(Math.abs(Number(self._options.scrollIncrement) || 100)); };
    this._onNext = function() { self.scrollBy(-Math.abs(Number(self._options.scrollIncrement) || 100)); };
    this._onTabScroll = function() { self._syncOverflow(); };
    this._onResize = function() { self.resize(); };
    this.addEventListener(this.list, 'click', this._onTabClick);
    this.addEventListener(this.list, 'pointerdown', this._onTabPointerDown);
    this.addEventListener(this.list, 'pointerup', this._onTabPointerUp);
    this.addEventListener(this.list, 'pointercancel', this._onTabPointerUp);
    this.addEventListener(this.list, 'dragstart', this._onTabDragStart);
    this.addEventListener(this.list, 'dragover', this._onTabDragOver);
    this.addEventListener(this.list, 'drop', this._onTabDrop);
    this.addEventListener(this.list, 'dragend', this._onTabDragEnd);
    this.addEventListener(this.list, 'keydown', this._onTabKeyDown);
    this.addEventListener(this.list, 'contextmenu', this._onContextMenu);
    this.addEventListener(this.viewport, 'scroll', this._onTabScroll);
    this.addEventListener(this.previousButton, 'click', this._onPrevious);
    this.addEventListener(this.nextButton, 'click', this._onNext);
    this.addEventListener(window, 'resize', this._onResize);
  };

  Tabs.prototype._appendExistingPanel = function(panel) {
    var options = {
      title: panel.getAttribute('title') || panel.getAttribute('data-title') || 'Tab ' + (this._tabs.length + 1),
      closable: readBoolean(panel, 'data-closable', readBoolean(panel, 'closable', false)),
      disabled: readBoolean(panel, 'data-disabled', readBoolean(panel, 'disabled', false)),
      iconCls: panel.getAttribute('data-icon-cls') || panel.getAttribute('iconCls') || '',
      selected: readBoolean(panel, 'data-selected', readBoolean(panel, 'selected', false)),
      href: panel.getAttribute('data-href') || panel.getAttribute('href') || '',
      tools: panel.getAttribute('data-tools') || panel.getAttribute('tools') || null
    };
    panel.removeAttribute('title');
    this._createRecord(panel, options);
    if (options.selected) this._options.selected = this._tabs.length - 1;
  };

  Tabs.prototype._createRecord = function(panel, options) {
    var insertIndex;
    var record = { panel: panel, options: assign({
      title: this._getText('untitled'),
      closable: false,
      disabled: false,
      iconCls: '',
      selected: false,
      tabWidth: null,
      href: '',
      content: null,
      cache: true,
      method: 'GET',
      tools: []
    }, options || {}), loaded: false, panelTools: [] };
    panel.classList.add('fui-tabs-panel');
    panel.setAttribute('role', 'tabpanel');
    panel.hidden = true;
    this.panels.appendChild(panel);
    insertIndex = Number(record.options.index);
    if (!isFinite(insertIndex) || insertIndex < 0 || insertIndex > this._tabs.length) {
      insertIndex = this._tabs.length;
    }
    if (insertIndex <= this._selectedIndex) this._selectedIndex += 1;
    this._tabs.splice(insertIndex, 0, record);
    this._renderRecord(record, insertIndex);
    this._syncIndexes();
    return record;
  };

  Tabs.prototype._renderRecord = function(record, index) {
    var tab = record.tab || document.createElement('button');
    var icon;
    var title;
    var close;
    tab.type = 'button';
    tab.className = 'fui-tabs-tab';
    tab.setAttribute('role', 'tab');
    tab.textContent = '';
    if (record.options.iconCls) {
      icon = document.createElement('span');
      icon.className = 'fui-tabs-icon ' + record.options.iconCls;
      icon.setAttribute('aria-hidden', 'true');
      tab.appendChild(icon);
    }
    title = document.createElement('span');
    title.className = 'fui-tabs-title';
    title.textContent = record.options.title;
    title.draggable = this._isHorizontalDragEnabled() && !record.options.disabled;
    tab.appendChild(title);
    record.panelTools = this._resolveTools(record.options.tools);
    record.panelTools.forEach(function(tool, toolIndex) {
      var toolElement = document.createElement('span');
      toolElement.className = ('fui-tabs-panel-tool ' + (tool.iconCls || '')).trim();
      toolElement.setAttribute('role', 'button');
      toolElement.setAttribute('data-tool-index', toolIndex);
      toolElement.setAttribute('aria-label', tool.ariaLabel || tool.title || tool.text || ('Tool ' + (toolIndex + 1)));
      toolElement.title = tool.title || tool.text || '';
      if (tool.text) toolElement.textContent = tool.text;
      tab.appendChild(toolElement);
    });
    if (record.options.closable) {
      close = document.createElement('span');
      close.className = 'fui-tabs-close';
      close.setAttribute('aria-label', formatText(this._getText('close'), { title: record.options.title }));
      close.textContent = '×';
      tab.appendChild(close);
    }
    tab.disabled = Boolean(record.options.disabled);
    tab.draggable = false;
    tab.classList.toggle('fui-tabs-disabled', Boolean(record.options.disabled));
    tab.style.width = cssSize(record.options.tabWidth != null ? record.options.tabWidth : this._options.tabWidth);
    tab.style.height = cssSize(this._options.tabHeight);
    tab.style.lineHeight = cssSize(this._options.tabHeight);
    tab.setAttribute('data-index', index);
    tab.id = this._getId() + '-tab-' + index;
    record.panel.id = record.panel.id || this._getId() + '-panel-' + index;
    tab.setAttribute('aria-controls', record.panel.id);
    record.panel.setAttribute('aria-labelledby', tab.id);
    if (!record.tab) this.list.insertBefore(tab, this.list.children[index] || null);
    record.tab = tab;
    tab.classList.toggle('fui-tabs-selected', index === this._selectedIndex);
    tab.setAttribute('aria-selected', index === this._selectedIndex ? 'true' : 'false');
    tab.tabIndex = index === this._selectedIndex ? 0 : -1;
    record.panel.hidden = index !== this._selectedIndex;
  };

  Tabs.prototype._resolveTools = function(value) {
    var host;
    if (Array.isArray(value)) return value.slice();
    if (typeof value !== 'string') return [];
    try {
      host = document.querySelector(value);
    } catch (error) {
      host = null;
    }
    if (!host) return [];
    return Array.prototype.map.call(host.children, function(element) {
      return {
        element: element,
        iconCls: element.getAttribute('iconCls') ||
          element.getAttribute('data-icon-cls') ||
          element.className ||
          '',
        title: element.getAttribute('title') || element.getAttribute('aria-label') || '',
        handler: function(event) {
          element.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          }));
        }
      };
    });
  };

  Tabs.prototype._getId = function() {
    if (!this._id) this._id = 'fui-tabs-' + Tabs._nextId++;
    return this._id;
  };

  Tabs.prototype._applyOptions = function() {
    var position = normalizePosition(this._options.tabPosition);
    var toolPosition = normalizeToolPosition(this._options.toolPosition);
    this._options.tabPosition = position;
    this._options.toolPosition = toolPosition;
    this.element.classList.toggle('fui-tabs-borderless', this._options.border === false);
    this.element.classList.toggle('fui-tabs-plain', Boolean(this._options.plain));
    this.element.classList.toggle('fui-tabs-narrow', Boolean(this._options.narrow));
    this.element.classList.toggle('fui-tabs-pill', Boolean(this._options.pill));
    this.element.classList.toggle('fui-tabs-justified', Boolean(this._options.justified));
    this.element.classList.toggle(
      'fui-tabs-draggable',
      Boolean(this._options.draggable) && (position === 'top' || position === 'bottom')
    );
    this.element.classList.remove('fui-tabs-top', 'fui-tabs-bottom', 'fui-tabs-left', 'fui-tabs-right');
    this.element.classList.add('fui-tabs-' + position);
    this.header.classList.remove(
      'fui-tabs-tool-left',
      'fui-tabs-tool-right',
      'fui-tabs-tool-top',
      'fui-tabs-tool-bottom'
    );
    this.header.classList.add('fui-tabs-tool-' + toolPosition);
    this.header.style.width = position === 'left' || position === 'right' ?
      cssSize(this._options.headerWidth) :
      '';
    this.viewport.style.scrollBehavior = Number(this._options.scrollDuration) > 0 ? 'smooth' : 'auto';
    this.header.hidden = this._options.showHeader === false;
    this.element.insertBefore(this.header, this.panels);
    this.resize(this._options.width, this._options.height);
    this._tabs.forEach(function(record, index) {
      this._renderRecord(record, index);
    }, this);
    this._syncOverflow();
  };

  Tabs.prototype._renderTools = function() {
    var self = this;
    var tools = this._resolveTools(this._options.tools);
    this.tools.textContent = '';
    tools.forEach(function(tool, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'fui-tabs-tool' + (tool.iconCls ? ' ' + tool.iconCls : '');
      button.title = tool.title || '';
      button.setAttribute('aria-label', tool.title || formatText(self._getText('tool'), { index: index + 1 }));
      if (tool.text) button.textContent = tool.text;
      button.addEventListener('click', function(event) {
        if (typeof tool.onClick === 'function' || typeof tool.handler === 'function') {
          event.data = { target: self.element, tabs: self, index: index, tool: button };
          if (typeof tool.onClick === 'function') tool.onClick.call(self, event);
          else tool.handler.call(self, event);
        }
      });
      self.tools.appendChild(button);
    });
    this.tools.hidden = tools.length === 0 || this._toolVisible === false;
  };

  Tabs.prototype._syncIndexes = function() {
    this._tabs.forEach(function(record, index) {
      record.tab.setAttribute('data-index', index);
      record.tab.id = this._getId() + '-tab-' + index;
      record.tab.setAttribute('aria-controls', record.panel.id);
      record.panel.setAttribute('aria-labelledby', record.tab.id);
    }, this);
  };

  Tabs.prototype._isHorizontalDragEnabled = function() {
    return this._options.draggable === true &&
      (this._options.tabPosition === 'top' || this._options.tabPosition === 'bottom');
  };

  Tabs.prototype._clearDropIndicators = function() {
    if (!this.list) return;
    Array.prototype.forEach.call(
      this.list.querySelectorAll('.fui-tabs-drop-before, .fui-tabs-drop-after'),
      function(tab) {
        tab.classList.remove('fui-tabs-drop-before');
        tab.classList.remove('fui-tabs-drop-after');
      }
    );
  };

  Tabs.prototype._createTabDragImage = function(tab, event) {
    var rect;
    var dragImage;
    var pointerX;
    var pointerY;
    this._removeTabDragImage();
    if (!tab || !this.element) return;
    rect = tab.getBoundingClientRect();
    dragImage = tab.cloneNode(true);
    dragImage.removeAttribute('id');
    dragImage.removeAttribute('aria-controls');
    dragImage.removeAttribute('aria-selected');
    dragImage.removeAttribute('tabindex');
    dragImage.setAttribute('aria-hidden', 'true');
    dragImage.classList.remove('fui-tabs-tab-dragging');
    dragImage.classList.add('fui-tabs-drag-image');
    dragImage.style.width = rect.width + 'px';
    dragImage.style.height = rect.height + 'px';
    this.element.appendChild(dragImage);
    this._dragImage = dragImage;
    pointerX = Number(event && event.clientX);
    pointerY = Number(event && event.clientY);
    if (!isFinite(pointerX)) pointerX = rect.left + (rect.width / 2);
    if (!isFinite(pointerY)) pointerY = rect.top + (rect.height / 2);
    this._dragImageOffsetX = Math.max(
      0,
      Math.min(rect.width, pointerX - rect.left)
    );
    this._dragImageOffsetY = Math.max(
      0,
      Math.min(rect.height, pointerY - rect.top)
    );
  };

  Tabs.prototype._removeTabDragImage = function() {
    if (this._dragImage && this._dragImage.parentNode) {
      this._dragImage.parentNode.removeChild(this._dragImage);
    }
    this._dragImage = null;
    this._dragImageOffsetX = 0;
    this._dragImageOffsetY = 0;
  };

  Tabs.prototype._clearTabDrag = function() {
    this._clearDropIndicators();
    this._removeTabDragImage();
    if (this._dragState && this._dragState.tab) {
      this._dragState.tab.classList.remove('fui-tabs-tab-dragging');
    }
    if (this.element) this.element.classList.remove('fui-tabs-dragging');
    this._dragState = null;
    this._dragBlocked = false;
  };

  Tabs.prototype._moveTab = function(fromIndex, toIndex) {
    var selected = this._tabs[this._selectedIndex];
    var moved = this._tabs[fromIndex];
    if (!moved || !reorderTabRecords(this._tabs, fromIndex, toIndex)) return false;
    this._tabs.forEach(function(record) {
      this.list.appendChild(record.tab);
      this.panels.appendChild(record.panel);
    }, this);
    this._selectedIndex = selected ? this._tabs.indexOf(selected) : -1;
    this._syncIndexes();
    this._syncOverflow();
    this._invoke('onReorder', moved.options.title, fromIndex, toIndex, moved.panel);
    this._emit('reorder', {
      title: moved.options.title,
      fromIndex: fromIndex,
      toIndex: toIndex,
      tab: moved.panel
    });
    return true;
  };

  Tabs.prototype._resolveIndex = function(which) {
    var i;
    if (typeof which === 'number' && isFinite(which)) return which >= 0 && which < this._tabs.length ? which : -1;
    if (typeof which === 'string') {
      for (i = 0; i < this._tabs.length; i += 1) {
        if (this._tabs[i].options.title === which) return i;
      }
    }
    for (i = 0; i < this._tabs.length; i += 1) {
      if (this._tabs[i] === which || this._tabs[i].panel === which || this._tabs[i].tab === which) return i;
    }
    return -1;
  };

  Tabs.prototype._findEnabled = function(start, direction) {
    var length = this._tabs.length;
    var i;
    var index;
    if (!length) return -1;
    for (i = 1; i <= length; i += 1) {
      index = (start + direction * i + length) % length;
      if (!this._tabs[index].options.disabled) return index;
    }
    return -1;
  };

  Tabs.prototype._load = function(record) {
    var self = this;
    if (!record.options.href || (record.loaded && record.options.cache !== false)) return;
    record.panel.classList.add('fui-tabs-loading');
    fetch(record.options.href, { method: record.options.method || 'GET' }).then(function(response) {
      if (!response.ok) throw new Error(formatText(self._getText('loadError'), { status: response.status }));
      return response.text();
    }).then(function(html) {
      record.panel.innerHTML = html;
      record.loaded = true;
      record.panel.classList.remove('fui-tabs-loading');
      self._invoke('onLoad', record.panel, record.options.title);
      self._emit('load', { tab: record.panel, title: record.options.title });
    }).catch(function(error) {
      record.panel.classList.remove('fui-tabs-loading');
      record.panel.textContent = error.message;
    });
  };

  Tabs.prototype._scrollTabs = function(distance) {
    this.viewport.scrollLeft += distance;
    this._syncOverflow();
  };

  Tabs.prototype._syncOverflow = function() {
    var overflows;
    if (!this.viewport || this._destroyed) return;
    overflows = this.viewport.scrollWidth > this.viewport.clientWidth + 1;
    this.element.classList.toggle('fui-tabs-overflow', overflows);
    this.previousButton.disabled = !overflows || this.viewport.scrollLeft <= 0;
    this.nextButton.disabled = !overflows || this.viewport.scrollLeft + this.viewport.clientWidth >= this.viewport.scrollWidth - 1;
  };

  Tabs.prototype._invoke = function(name) {
    var callback = this._options[name];
    if (typeof callback === 'function') {
      return callback.apply(this.element, Array.prototype.slice.call(arguments, 1));
    }
    return undefined;
  };

  Tabs.prototype._getText = function(key) {
    var locale = localePacks[normalizeLocale(this._options && this._options.locale)] || localePacks.en;
    return locale[key] == null ? localePacks.en[key] : locale[key];
  };

  Tabs.prototype._emit = function(name, detail) {
    name = String(name || '').toLowerCase();
    (this._listeners[name] || []).slice().forEach(function(listener) {
      listener.call(this, detail);
    }, this);
  };

  Tabs.prototype.on = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  Tabs.prototype.off = function(name, listener) {
    name = String(name || '').toLowerCase();
    var list = this._listeners[name] || [];
    if (!listener) {
      this._listeners[name] = [];
      return this;
    }
    var index = list.indexOf(listener);
    if (index >= 0) list.splice(index, 1);
    return this;
  };

  Tabs.prototype.select = function(which, silent) {
    var index = this._resolveIndex(which);
    var currentIndex = this._selectedIndex;
    var current = this._tabs[this._selectedIndex];
    var next = this._tabs[index];
    if (!next || next.options.disabled || index === this._selectedIndex) return next ? next.panel : null;
    if (!silent && this._invoke('onBeforeSelect', next.options.title, index, next.panel) === false) return null;
    if (current) {
      current.tab.classList.remove('fui-tabs-selected');
      current.tab.setAttribute('aria-selected', 'false');
      current.tab.tabIndex = -1;
      current.panel.hidden = true;
      if (!silent) {
        this._invoke('onUnselect', current.options.title, currentIndex, current.panel);
        this._emit('unselect', {
          title: current.options.title,
          index: currentIndex,
          tab: current.panel
        });
      }
    }
    this._selectedIndex = index;
    next.tab.classList.add('fui-tabs-selected');
    next.tab.setAttribute('aria-selected', 'true');
    next.tab.tabIndex = 0;
    next.panel.hidden = false;
    this._load(next);
    if (next.tab.scrollIntoView) next.tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (!silent) {
      this._invoke('onSelect', next.options.title, index, next.panel);
      this._emit('select', { title: next.options.title, index: index, tab: next.panel });
    }
    this._syncOverflow();
    return next.panel;
  };

  Tabs.prototype.add = function(options, silent) {
    var panel = document.createElement('div');
    var record;
    var index;
    options = assign({}, options || {});
    if (isElementNode(options.content)) panel.appendChild(options.content);
    else if (options.content != null) panel.innerHTML = String(options.content);
    if (options.id) panel.id = String(options.id);
    record = this._createRecord(panel, options);
    index = this._resolveIndex(record);
    if (options.style && typeof options.style === 'object') assign(panel.style, options.style);
    if (options.selected !== false || this._selectedIndex < 0) this.select(index, silent);
    this._syncOverflow();
    if (!silent) {
      this._invoke('onAdd', record.options.title, index, panel);
      this._emit('add', { title: record.options.title, index: index, tab: panel });
    }
    return panel;
  };

  Tabs.prototype.close = function(which) {
    var index = this._resolveIndex(which);
    var record = this._tabs[index];
    var wasSelected = index === this._selectedIndex;
    var nextIndex;
    if (!record) return false;
    if (this._invoke('onBeforeClose', record.options.title, index, record.panel) === false) return false;
    record.tab.remove();
    record.panel.remove();
    this._tabs.splice(index, 1);
    if (wasSelected) this._selectedIndex = -1;
    else if (index < this._selectedIndex) this._selectedIndex -= 1;
    this._syncIndexes();
    if (wasSelected && this._tabs.length) {
      nextIndex = Math.min(index, this._tabs.length - 1);
      if (this._tabs[nextIndex].options.disabled) nextIndex = this._findEnabled(nextIndex, 1);
      if (nextIndex >= 0) this.select(nextIndex, true);
    }
    this._syncOverflow();
    this._invoke('onClose', record.options.title, index);
    this._emit('close', { title: record.options.title, index: index });
    return true;
  };

  Tabs.prototype.update = function(which, options) {
    if (which && typeof which === 'object' && which.tab) {
      options = which.options || {};
      which = which.tab;
    }
    var index = this._resolveIndex(which);
    var record = this._tabs[index];
    if (!record) return null;
    options = options || {};
    assign(record.options, options);
    if (Object.prototype.hasOwnProperty.call(options, 'content')) {
      record.panel.innerHTML = '';
      if (isElementNode(options.content)) record.panel.appendChild(options.content);
      else record.panel.innerHTML = String(options.content == null ? '' : options.content);
    }
    if (Object.prototype.hasOwnProperty.call(options, 'href')) record.loaded = false;
    this._renderRecord(record, index);
    this._invoke('onUpdate', record.options.title, index, record.panel);
    this._emit('update', { title: record.options.title, index: index, tab: record.panel });
    this._syncOverflow();
    return record.panel;
  };

  Tabs.prototype.disableTab = function(which) {
    var index = this._resolveIndex(which);
    if (index < 0) return this;
    this._tabs[index].options.disabled = true;
    this._renderRecord(this._tabs[index], index);
    if (index === this._selectedIndex) {
      index = this._findEnabled(index, 1);
      if (index >= 0) this.select(index);
    }
    return this;
  };

  Tabs.prototype.enableTab = function(which) {
    var index = this._resolveIndex(which);
    if (index < 0) return this;
    this._tabs[index].options.disabled = false;
    this._renderRecord(this._tabs[index], index);
    return this;
  };

  Tabs.prototype.getSelected = function() {
    return this._tabs[this._selectedIndex] ? this._tabs[this._selectedIndex].panel : null;
  };

  Tabs.prototype.getTab = function(which) {
    var index = this._resolveIndex(which);
    return index >= 0 ? this._tabs[index].panel : null;
  };

  Tabs.prototype.getTabOptions = function(which) {
    var index = this._resolveIndex(which);
    return index >= 0 ? this._tabs[index].options : null;
  };

  Tabs.prototype.getTabIndex = function(tab) {
    return this._resolveIndex(tab);
  };

  Tabs.prototype.getTabs = function() {
    return this._tabs.map(function(record) { return record.panel; });
  };

  Tabs.prototype.tabs = Tabs.prototype.getTabs;

  Tabs.prototype.exists = function(which) {
    return this._resolveIndex(which) >= 0;
  };

  Tabs.prototype.resize = function(width, height) {
    if (width && typeof width === 'object') {
      height = width.height;
      width = width.width;
    }
    if (width != null) this._options.width = width;
    if (height != null) this._options.height = height;
    this.element.style.width = this._options.fit ? '100%' : cssSize(this._options.width);
    this.element.style.height = this._options.fit ? '100%' : cssSize(this._options.height);
    this.element.classList.toggle('fui-tabs-auto-height', this.element.style.height === 'auto');
    this._syncOverflow();
    return this;
  };

  Tabs.prototype.unselect = function(which) {
    var index = this._resolveIndex(which);
    var record = this._tabs[index];
    if (!record || index !== this._selectedIndex) return this;
    record.tab.classList.remove('fui-tabs-selected');
    record.tab.setAttribute('aria-selected', 'false');
    record.tab.tabIndex = -1;
    record.panel.hidden = true;
    this._selectedIndex = -1;
    this._invoke('onUnselect', record.options.title, index, record.panel);
    this._emit('unselect', {
      title: record.options.title,
      index: index,
      tab: record.panel
    });
    return this;
  };

  Tabs.prototype.showHeader = function() {
    this._options.showHeader = true;
    this.header.hidden = false;
    return this.resize();
  };

  Tabs.prototype.hideHeader = function() {
    this._options.showHeader = false;
    this.header.hidden = true;
    return this.resize();
  };

  Tabs.prototype.showTool = function() {
    this._toolVisible = true;
    this._renderTools();
    return this.resize();
  };

  Tabs.prototype.hideTool = function() {
    this._toolVisible = false;
    this.tools.hidden = true;
    return this.resize();
  };

  Tabs.prototype.scrollBy = function(deltaX) {
    deltaX = Number(deltaX) || 0;
    this._scrollTabs(-deltaX);
    return this;
  };

  Tabs.prototype.setLocale = function(locale, messages) {
    if (messages && locale) {
      localePacks[String(locale)] = assign({}, localePacks.en, messages);
    }
    this._options.locale = normalizeLocale(locale);
    this.previousButton.setAttribute('aria-label', this._getText('previous'));
    this.nextButton.setAttribute('aria-label', this._getText('next'));
    this._tabs.forEach(function(record, index) {
      this._renderRecord(record, index);
    }, this);
    this._renderTools();
    return this;
  };

  Tabs.prototype.setTheme = function(theme) {
    var index;
    this._options.theme = theme == null ? 'inherit' : theme;
    this.theme = this._options.theme === 'inherit' ?
      findTabsTheme(this._themeSource) :
      normalizeTabsTheme(this._options.theme);
    for (index = 0; index < TABS_THEMES.length; index += 1) {
      this.element.classList.remove('fg-theme-' + TABS_THEMES[index]);
    }
    this.element.classList.add('fg-theme-' + this.theme);
    return this;
  };

  Tabs.prototype.setOptions = function(options) {
    assign(this._options, options || {});
    this._options.locale = normalizeLocale(this._options.locale);
    this._options.tabPosition = normalizePosition(this._options.tabPosition);
    this._options.toolPosition = normalizeToolPosition(this._options.toolPosition);
    this.setLocale(this._options.locale);
    this._applyOptions();
    this.setTheme(this._options.theme);
    return this;
  };

  Tabs.prototype.options = function() {
    return this._options;
  };

  Tabs.prototype.destroy = function() {
    if (this._destroyed) return;
    this._clearTabDrag();
    this._destroyed = true;
    this.removeEventListener();
    this.element.innerHTML = this._originalHtml;
    this.element.className = this._originalClassName;
    if (this._originalStyle == null) this.element.removeAttribute('style');
    else this.element.setAttribute('style', this._originalStyle);
    unregisterControl(this.element, this);
    delete this.element.__fabuiTabs;
    this._tabs = [];
    this._selectedIndex = -1;
    this._listeners = {};
  };

  Tabs.prototype.dispose = Tabs.prototype.destroy;

  Tabs._nextId = 1;
  Tabs.defaults = defaults;
  Tabs.locales = localePacks;
  Tabs.themes = TABS_THEMES.slice();
  Tabs.addLocale = function(name, messages) {
    if (name && messages) localePacks[String(name)] = assign({}, localePacks.en, messages);
    return Tabs;
  };
  Tabs.getControl = function(element) {
    element = resolveElement(element);
    return element && element.__fabuiTabs ? element.__fabuiTabs : null;
  };
  Tabs.normalizeTheme = normalizeTabsTheme;
  Tabs.normalizeLocale = normalizeLocale;
  return Tabs;
}
