var ACCORDION_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];

function assignAccordionOptions(target) {
  var source;
  var key;
  var index;
  for (index = 1; index < arguments.length; index += 1) {
    source = arguments[index] || {};
    for (key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
    }
  }
  return target;
}

function resolveAccordionElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function accordionCssSize(value) {
  if (value == null || value === '' || value === 'auto') return 'auto';
  return typeof value === 'number' ? Math.max(0, value) + 'px' : String(value);
}

function readAccordionBoolean(element, name, fallback) {
  var value = element.getAttribute(name);
  if (value == null) return fallback;
  return value === '' || value === name || value === 'true' || value === '1';
}

function restoreAccordionAttribute(element, name, value) {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

function readDataOption(source, name) {
  var match;
  var value;
  source = String(source || '');
  match = new RegExp(
    '(?:^|[,\\s])' + name + '\\s*:\\s*(' +
    '"(?:[^"\\\\]|\\\\.)*"|' +
    "'(?:[^'\\\\]|\\\\.)*'|" +
    'true|false|null|-?\\d+(?:\\.\\d+)?' +
    ')',
    'i'
  ).exec(source);
  if (!match) return undefined;
  value = match[1];
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (/^-?\d/.test(value)) return Number(value);
  return value.slice(1, -1).replace(/\\(['"\\])/g, '$1');
}

export function normalizeAccordionTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return ACCORDION_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

export function normalizeAccordionHalign(value) {
  value = String(value || 'top').toLowerCase();
  return value === 'left' || value === 'right' ? value : 'top';
}

export function createAccordionFactory(
  Control,
  registerControl,
  unregisterControl,
  Panel
) {
  'use strict';

  var defaults = {
    width: 'auto',
    height: 'auto',
    fit: false,
    border: true,
    animate: true,
    animationDuration: 180,
    multiple: false,
    selected: 0,
    halign: 'top',
    cls: '',
    panels: [],
    locale: 'en',
    theme: 'inherit',
    onSelect: null,
    onUnselect: null,
    onAdd: null,
    onBeforeRemove: null,
    onRemove: null
  };
  var localePacks = {
    en: {
      untitled: 'Untitled',
      expand: 'Expand {title}',
      collapse: 'Collapse {title}'
    },
    'zh-TW': {
      untitled: '未命名',
      expand: '展開「{title}」',
      collapse: '收合「{title}」'
    },
    'zh-CN': {
      untitled: '未命名',
      expand: '展开“{title}”',
      collapse: '收合“{title}”'
    }
  };

  function normalizeLocale(value) {
    value = String(value || 'en').trim().replace(/_/g, '-');
    if (localePacks[value]) return value;
    if (/^zh-(?:tw|hant)(?:-|$)/i.test(value)) return 'zh-TW';
    if (/^zh-(?:cn|hans)(?:-|$)/i.test(value) || /^zh$/i.test(value)) return 'zh-CN';
    return 'en';
  }

  function formatText(text, values) {
    return String(text || '').replace(/\{([^}]+)\}/g, function(match, key) {
      return values && values[key] != null ? values[key] : match;
    });
  }

  function findTheme(element) {
    var current = resolveAccordionElement(element);
    var index;
    while (current && current.classList) {
      for (index = 0; index < ACCORDION_THEMES.length; index += 1) {
        if (current.classList.contains('fg-theme-' + ACCORDION_THEMES[index])) {
          return ACCORDION_THEMES[index];
        }
      }
      current = current.parentElement;
    }
    return 'default';
  }

  function Accordion(element, options) {
    var children;
    var configuredPanels;
    var explicitSelected;
    var markupSelected = -1;
    var index;
    if (!(this instanceof Accordion)) return new Accordion(element, options);
    this.hostElement = resolveAccordionElement(element);
    if (!this.hostElement) throw new Error('fabui.Accordion requires a host element.');
    if (this.hostElement.__fabuiAccordion) return this.hostElement.__fabuiAccordion;
    if (typeof Panel !== 'function') {
      throw new Error('fabui.Accordion requires fabui.Panel.');
    }
    Control.call(this);
    this._listeners = {};
    this._records = [];
    this._destroyed = false;
    this._initializing = true;
    this._originalClass = this.hostElement.getAttribute('class');
    this._originalStyle = this.hostElement.getAttribute('style');
    this._originalRole = this.hostElement.getAttribute('role');
    this._originalHtml = this.hostElement.innerHTML;
    this._themeSource = this.hostElement.parentElement || document.body;
    explicitSelected = Boolean(
      options &&
      Object.prototype.hasOwnProperty.call(options, 'selected')
    );
    this._options = assignAccordionOptions(
      {},
      defaults,
      this._readElementOptions(),
      options || {}
    );
    this._options.halign = normalizeAccordionHalign(this._options.halign);
    this._options.locale = normalizeLocale(this._options.locale);
    children = Array.prototype.slice.call(this.hostElement.children);
    this._build();
    children.forEach(function(child) {
      var panelOptions = this._readPanelOptions(child);
      if (panelOptions.selected === true && markupSelected < 0) {
        markupSelected = this._records.length;
      }
      this._createRecord(child, panelOptions, this._records.length);
    }, this);
    configuredPanels = Array.isArray(this._options.panels) ?
      this._options.panels :
      [];
    configuredPanels.forEach(function(panelOptions) {
      this.add(assignAccordionOptions({}, panelOptions, {
        selected: false
      }), true);
      if (panelOptions && panelOptions.selected === true && markupSelected < 0) {
        markupSelected = this._records.length - 1;
      }
    }, this);
    this.hostElement.__fabuiAccordion = this;
    registerControl(this.hostElement, this);
    this.setTheme(this._options.theme);
    this.setLocale(this._options.locale);
    this.resize();
    if (this._options.multiple) {
      this._records.forEach(function(record, recordIndex) {
        var shouldSelect = record.options.selected === true;
        if (!explicitSelected && markupSelected < 0 && recordIndex === 0) {
          shouldSelect = true;
        }
        if (explicitSelected && recordIndex === Number(this._options.selected)) {
          shouldSelect = true;
        }
        this._setRecordSelected(record, shouldSelect, true);
      }, this);
    } else if (this._records.length) {
      index = explicitSelected ?
        this._resolveIndex(this._options.selected) :
        markupSelected;
      if (index < 0) index = this._resolveIndex(this._options.selected);
      if (index < 0) index = 0;
      this._setRecordSelected(this._records[index], true, true);
    }
    this._syncRecords();
    this._initializing = false;
  }

  Accordion.prototype = Object.create(Control.prototype);
  Accordion.prototype.constructor = Accordion;

  Accordion.prototype._readElementOptions = function() {
    var options = {};
    var width = this.hostElement.style.width;
    var height = this.hostElement.style.height;
    var value;
    if (width) options.width = width;
    if (height) options.height = height;
    value = this.hostElement.getAttribute('selected');
    if (value != null && value !== '') options.selected = Number(value);
    value = this.hostElement.getAttribute('halign');
    if (value) options.halign = value;
    value = this.hostElement.getAttribute('theme');
    if (value) options.theme = value;
    value = this.hostElement.getAttribute('locale');
    if (value) options.locale = value;
    ['fit', 'border', 'animate', 'multiple'].forEach(function(name) {
      var parsed = readAccordionBoolean(this.hostElement, name, null);
      if (parsed != null) options[name] = parsed;
    }, this);
    return options;
  };

  Accordion.prototype._readPanelOptions = function(host) {
    var dataOptions = host.getAttribute('data-options') || '';
    var readOption = function(name, attributeNames, fallback) {
      var value = readDataOption(dataOptions, name);
      var index;
      if (value !== undefined) return value;
      for (index = 0; index < attributeNames.length; index += 1) {
        value = host.getAttribute(attributeNames[index]);
        if (value != null) return value;
      }
      return fallback;
    };
    var readBooleanOption = function(name, attributeNames, fallback) {
      var value = readDataOption(dataOptions, name);
      var index;
      if (value !== undefined) return value === true;
      for (index = 0; index < attributeNames.length; index += 1) {
        if (host.hasAttribute(attributeNames[index])) {
          return readAccordionBoolean(host, attributeNames[index], fallback);
        }
      }
      return fallback;
    };
    return {
      title: readOption(
        'title',
        ['title', 'data-title'],
        this._getText('untitled')
      ),
      iconCls: readOption('iconCls', ['iconCls', 'data-icon-cls'], ''),
      selected: readBooleanOption(
        'selected',
        ['selected', 'data-selected'],
        false
      ),
      collapsible: readBooleanOption(
        'collapsible',
        ['collapsible', 'data-collapsible'],
        true
      ),
      href: readOption('href', ['data-href', 'href'], null),
      cache: readBooleanOption('cache', ['cache', 'data-cache'], true),
      titleDirection: readOption(
        'titleDirection',
        ['titleDirection', 'data-title-direction'],
        'down'
      )
    };
  };

  Accordion.prototype._build = function() {
    var self = this;
    this.hostElement.textContent = '';
    this.hostElement.className = (
      (this._originalClass ? this._originalClass + ' ' : '') +
      'fui-accordion ' +
      (this._options.cls || '')
    ).trim();
    this.hostElement.classList.add(
      'fui-accordion-halign-' + this._options.halign
    );
    this.hostElement.classList.toggle(
      'fui-accordion-multiple',
      this._options.multiple === true
    );
    this.hostElement.classList.toggle(
      'fui-accordion-no-border',
      this._options.border === false
    );
    this._syncAnimationOptions();
    this.hostElement.setAttribute('role', 'presentation');
    this._onHeaderClick = function(event) {
      var header = event.target.closest('.fui-accordion-header');
      var record;
      if (
        !header ||
        !self.hostElement.contains(header) ||
        (
          event.target.closest('.fui-panel-tool') &&
          !event.target.closest('.fui-accordion-toggle')
        )
      ) return;
      record = self._recordFromHeader(header);
      if (!record || record.options.collapsible === false) return;
      if (record.selected) self.unselect(record.panel);
      else self.select(record.panel);
    };
    this._onHeaderKeyDown = function(event) {
      var header = event.target.closest('.fui-accordion-header');
      var record;
      var index;
      var nextIndex;
      if (!header || !self.hostElement.contains(header)) return;
      record = self._recordFromHeader(header);
      index = self._records.indexOf(record);
      if (index < 0) return;
      if (event.key === 'Enter' || event.key === ' ') {
        if (record.options.collapsible !== false) {
          event.preventDefault();
          if (record.selected) self.unselect(index);
          else self.select(index);
        }
        return;
      }
      if (
        event.key === 'ArrowDown' ||
        event.key === 'ArrowRight'
      ) nextIndex = (index + 1) % self._records.length;
      if (
        event.key === 'ArrowUp' ||
        event.key === 'ArrowLeft'
      ) nextIndex = (index - 1 + self._records.length) % self._records.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = self._records.length - 1;
      if (nextIndex != null && self._records[nextIndex]) {
        event.preventDefault();
        self._records[nextIndex].panel.header().focus();
      }
    };
    this._onWindowResize = function() {
      self.resize();
    };
    this.addEventListener(this.hostElement, 'click', this._onHeaderClick);
    this.addEventListener(
      this.hostElement,
      'keydown',
      this._onHeaderKeyDown
    );
    this.addEventListener(window, 'resize', this._onWindowResize);
  };

  Accordion.prototype._syncAnimationOptions = function() {
    var duration = Number(this._options.animationDuration);
    if (!isFinite(duration)) duration = defaults.animationDuration;
    duration = Math.max(0, duration);
    this.hostElement.classList.toggle(
      'fui-accordion-animated',
      this._options.animate !== false && duration > 0
    );
    this.hostElement.style.setProperty(
      '--fui-accordion-animation-duration',
      duration + 'ms'
    );
  };

  Accordion.prototype._createRecord = function(host, options, insertIndex) {
    var remoteHref;
    var panelOptions;
    var panel;
    var toggle;
    var record;
    var beforeRecord;
    options = assignAccordionOptions({
      title: this._getText('untitled'),
      iconCls: '',
      content: null,
      href: null,
      cache: true,
      selected: false,
      collapsible: true,
      tools: null,
      titleDirection: 'down'
    }, options || {});
    insertIndex = Number(insertIndex);
    if (!isFinite(insertIndex)) insertIndex = this._records.length;
    insertIndex = Math.max(0, Math.min(this._records.length, insertIndex));
    beforeRecord = this._records[insertIndex] || null;
    if (beforeRecord) {
      this.hostElement.insertBefore(
        host,
        beforeRecord.panel.panel()
      );
    } else {
      this.hostElement.appendChild(host);
    }
    if (options.content != null) {
      host.textContent = '';
      if (options.content && options.content.nodeType === 1) {
        host.appendChild(options.content);
      } else {
        host.innerHTML = String(options.content);
      }
    }
    remoteHref = options.href;
    panelOptions = assignAccordionOptions({}, options, {
      width: this._options.halign === 'top' ? '100%' : 'auto',
      height: this._options.halign === 'top' ? 'auto' : '100%',
      fit: false,
      border: true,
      halign: this._options.halign,
      collapsible: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      collapsed: false,
      href: null,
      animate: false,
      theme: this.theme || this._options.theme,
      locale: this._options.locale,
      cls: ((options.cls || '') + ' fui-accordion-panel').trim(),
      headerCls: (
        (options.headerCls || '') +
        ' fui-accordion-header'
      ).trim(),
      bodyCls: (
        (options.bodyCls || '') +
        ' fui-accordion-body'
      ).trim()
    });
    panel = new Panel(host, panelOptions);
    panel.options.href = remoteHref;
    panel.options.animate = this._options.animate;
    panel.options.animationDuration = this._options.animationDuration;
    panel.panel().removeAttribute('role');
    panel.header().tabIndex = 0;
    toggle = document.createElement('span');
    toggle.className = 'fui-panel-tool fui-accordion-toggle';
    toggle.setAttribute('data-accordion-toggle', '');
    toggle.setAttribute('aria-hidden', 'true');
    panel.toolsElement.appendChild(toggle);
    record = {
      host: host,
      panel: panel,
      options: options,
      toggle: toggle,
      selected: false
    };
    this._records.splice(insertIndex, 0, record);
    panel.options.animate = false;
    var beforeCollapse = panel.options.onBeforeCollapse;
    var onCollapse = panel.options.onCollapse;
    panel.options.onBeforeCollapse = null;
    panel.options.onCollapse = null;
    panel.collapse();
    panel.options.onBeforeCollapse = beforeCollapse;
    panel.options.onCollapse = onCollapse;
    panel.options.animate = this._options.animate;
    return record;
  };

  Accordion.prototype._recordFromHeader = function(header) {
    var index;
    for (index = 0; index < this._records.length; index += 1) {
      if (this._records[index].panel.header() === header) {
        return this._records[index];
      }
    }
    return null;
  };

  Accordion.prototype._resolveIndex = function(which) {
    var index;
    if (typeof which === 'number') {
      index = Math.floor(which);
      return index >= 0 && index < this._records.length ? index : -1;
    }
    for (index = 0; index < this._records.length; index += 1) {
      if (
        which === this._records[index].panel ||
        which === this._records[index].host ||
        which === this._records[index].panel.panel() ||
        String(which) === String(this._records[index].options.title)
      ) return index;
    }
    return -1;
  };

  Accordion.prototype._getText = function(key) {
    var locale = localePacks[
      normalizeLocale(this._options && this._options.locale)
    ] || localePacks.en;
    return locale[key] == null ? localePacks.en[key] : locale[key];
  };

  Accordion.prototype._invoke = function(name) {
    var callback = this._options[name];
    if (typeof callback === 'function') {
      return callback.apply(
        this.hostElement,
        Array.prototype.slice.call(arguments, 1)
      );
    }
    return undefined;
  };

  Accordion.prototype._emit = function(name, detail) {
    name = String(name || '').toLowerCase();
    (this._listeners[name] || []).slice().forEach(function(listener) {
      listener.call(this, detail);
    }, this);
  };

  Accordion.prototype._setRecordSelected = function(record, selected, silent) {
    var animate;
    var beforeCallbackName;
    var beforeCallback;
    var callbackName;
    var callback;
    var index;
    if (!record || record.selected === selected) return record ?
      record.panel :
      null;
    index = this._records.indexOf(record);
    animate = record.panel.options.animate;
    beforeCallbackName = selected ? 'onBeforeExpand' : 'onBeforeCollapse';
    beforeCallback = record.panel.options[beforeCallbackName];
    callbackName = selected ? 'onExpand' : 'onCollapse';
    callback = record.panel.options[callbackName];
    if (silent && this._initializing) {
      record.panel.options.animate = false;
      record.panel.options[beforeCallbackName] = null;
      record.panel.options[callbackName] = null;
    }
    if (selected) {
      record.panel.expand();
      if (record.panel.options.collapsed) {
        record.panel.options.animate = animate;
        record.panel.options[beforeCallbackName] = beforeCallback;
        record.panel.options[callbackName] = callback;
        return null;
      }
    } else {
      record.panel.collapse();
      if (!record.panel.options.collapsed) {
        record.panel.options.animate = animate;
        record.panel.options[beforeCallbackName] = beforeCallback;
        record.panel.options[callbackName] = callback;
        return null;
      }
    }
    record.panel.options.animate = animate;
    record.panel.options[beforeCallbackName] = beforeCallback;
    record.panel.options[callbackName] = callback;
    record.selected = selected;
    record.options.selected = selected;
    record.panel.panel().classList.toggle(
      'fui-accordion-panel-selected',
      selected
    );
    this._syncRecord(record, index);
    if (!silent) {
      this._invoke(
        selected ? 'onSelect' : 'onUnselect',
        record.options.title,
        index,
        record.panel
      );
      this._emit(selected ? 'select' : 'unselect', {
        title: record.options.title,
        index: index,
        panel: record.panel
      });
    }
    return record.panel;
  };

  Accordion.prototype._syncRecord = function(record, index) {
    var header = record.panel.header();
    var body = record.panel.body();
    var title = record.options.title || this._getText('untitled');
    var action = record.selected ? 'collapse' : 'expand';
    var disabled = record.options.collapsible === false;
    if (!header.id) {
      header.id = 'fui-accordion-header-' + Accordion._nextId;
      Accordion._nextId += 1;
    }
    if (!body.id) {
      body.id = 'fui-accordion-panel-' + Accordion._nextId;
      Accordion._nextId += 1;
    }
    header.setAttribute('role', 'button');
    header.setAttribute('aria-controls', body.id);
    header.setAttribute('aria-expanded', record.selected ? 'true' : 'false');
    header.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    header.setAttribute('aria-label', title);
    header.setAttribute('data-index', String(index));
    body.setAttribute('role', 'region');
    body.setAttribute('aria-labelledby', header.id);
    record.panel.panel().classList.toggle(
      'fui-accordion-panel-last',
      index === this._records.length - 1
    );
    record.toggle.hidden = disabled;
    record.toggle.classList.toggle(
      'fui-accordion-toggle-expanded',
      record.selected
    );
    record.toggle.classList.toggle(
      'fui-accordion-collapse',
      record.selected
    );
    record.toggle.classList.toggle(
      'fui-accordion-expand',
      !record.selected
    );
    header.title = formatText(this._getText(action), {
      title: title
    });
  };

  Accordion.prototype._syncRecords = function() {
    this._records.forEach(function(record, index) {
      this._syncRecord(record, index);
    }, this);
  };

  Accordion.prototype.options = function() {
    return this._options;
  };

  Accordion.prototype.panels = function() {
    return this._records.map(function(record) {
      return record.panel;
    });
  };

  Accordion.prototype.getPanels = Accordion.prototype.panels;

  Accordion.prototype.getPanel = function(which) {
    var index = this._resolveIndex(which);
    return index >= 0 ? this._records[index].panel : null;
  };

  Accordion.prototype.getPanelIndex = function(panel) {
    return this._resolveIndex(panel);
  };

  Accordion.prototype.getSelected = function() {
    var record = this._records.filter(function(item) {
      return item.selected;
    })[0];
    return record ? record.panel : null;
  };

  Accordion.prototype.getSelections = function() {
    return this._records.filter(function(record) {
      return record.selected;
    }).map(function(record) {
      return record.panel;
    });
  };

  Accordion.prototype.select = function(which, silent) {
    var allowed = true;
    var index = this._resolveIndex(which);
    var record = this._records[index];
    if (!record) return null;
    if (!this._options.multiple) {
      this._records.forEach(function(item) {
        if (item !== record && item.selected) {
          this._setRecordSelected(item, false, silent);
          if (item.selected) allowed = false;
        }
      }, this);
    }
    if (!allowed) return null;
    this._setRecordSelected(record, true, silent);
    return record.selected ? record.panel : null;
  };

  Accordion.prototype.unselect = function(which, silent) {
    var index = this._resolveIndex(which);
    var record = this._records[index];
    if (!record) return this;
    this._setRecordSelected(record, false, silent);
    return this;
  };

  Accordion.prototype.add = function(options, silent) {
    var host = document.createElement('div');
    var record;
    var index;
    options = assignAccordionOptions({}, options || {});
    if (options.id) host.id = String(options.id);
    index = options.index == null ?
      this._records.length :
      Number(options.index);
    record = this._createRecord(host, options, index);
    index = this._records.indexOf(record);
    this._syncRecords();
    if (options.selected !== false) {
      this.select(index, silent);
    }
    if (!silent) {
      this._invoke('onAdd', record.options.title, index, record.panel);
      this._emit('add', {
        title: record.options.title,
        index: index,
        panel: record.panel
      });
    }
    return record.panel;
  };

  Accordion.prototype.remove = function(which) {
    var index = this._resolveIndex(which);
    var record = this._records[index];
    var wasSelected;
    var nextIndex;
    if (!record) return false;
    if (
      this._invoke(
        'onBeforeRemove',
        record.options.title,
        index,
        record.panel
      ) === false
    ) return false;
    wasSelected = record.selected;
    this._records.splice(index, 1);
    record.panel.destroy(true);
    if (record.host.parentNode) record.host.parentNode.removeChild(record.host);
    this._syncRecords();
    this._invoke('onRemove', record.options.title, index);
    this._emit('remove', {
      title: record.options.title,
      index: index
    });
    if (
      wasSelected &&
      !this._options.multiple &&
      this._records.length
    ) {
      nextIndex = Math.min(index, this._records.length - 1);
      this.select(nextIndex);
    }
    return true;
  };

  Accordion.prototype.resize = function(width, height) {
    if (width && typeof width === 'object') {
      height = width.height;
      width = width.width;
    }
    if (width != null) this._options.width = width;
    if (height != null) this._options.height = height;
    this.hostElement.style.width = this._options.fit ?
      '100%' :
      accordionCssSize(this._options.width);
    this.hostElement.style.height = this._options.fit ?
      '100%' :
      accordionCssSize(this._options.height);
    this.hostElement.classList.toggle(
      'fui-accordion-auto-height',
      this.hostElement.style.height === 'auto'
    );
    this._records.forEach(function(record) {
      record.panel.doLayout();
    });
    return this;
  };

  Accordion.prototype.setLocale = function(locale, messages) {
    if (messages && locale) {
      localePacks[String(locale)] = assignAccordionOptions(
        {},
        localePacks.en,
        messages
      );
    }
    this._options.locale = normalizeLocale(locale);
    this._records.forEach(function(record) {
      record.panel.setLocale(this._options.locale);
    }, this);
    this._syncRecords();
    return this;
  };

  Accordion.prototype.setTheme = function(theme) {
    var index;
    this._options.theme = theme == null ? 'inherit' : theme;
    this.theme = this._options.theme === 'inherit' ?
      findTheme(this._themeSource) :
      normalizeAccordionTheme(this._options.theme);
    for (index = 0; index < ACCORDION_THEMES.length; index += 1) {
      this.hostElement.classList.remove(
        'fg-theme-' + ACCORDION_THEMES[index]
      );
    }
    this.hostElement.classList.add('fg-theme-' + this.theme);
    this._records.forEach(function(record) {
      record.panel.setTheme(this.theme);
    }, this);
    return this;
  };

  Accordion.prototype.setOptions = function(options) {
    var previousHalign = this._options.halign;
    var selectChanged = Boolean(
      options &&
      Object.prototype.hasOwnProperty.call(options, 'selected')
    );
    assignAccordionOptions(this._options, options || {});
    this._options.halign = normalizeAccordionHalign(this._options.halign);
    this._options.locale = normalizeLocale(this._options.locale);
    this.hostElement.classList.toggle(
      'fui-accordion-multiple',
      this._options.multiple === true
    );
    this.hostElement.classList.toggle(
      'fui-accordion-no-border',
      this._options.border === false
    );
    if (previousHalign !== this._options.halign) {
      this.hostElement.classList.remove(
        'fui-accordion-halign-' + previousHalign
      );
      this.hostElement.classList.add(
        'fui-accordion-halign-' + this._options.halign
      );
      this._records.forEach(function(record) {
        record.panel.options.halign = this._options.halign;
        record.panel.options.width = this._options.halign === 'top' ?
          '100%' :
          'auto';
        record.panel.options.height = this._options.halign === 'top' ?
          'auto' :
          '100%';
        record.panel._applyStructureOptions();
        record.panel.resize(record.panel.options, true);
      }, this);
    }
    this._records.forEach(function(record) {
      record.panel.options.animate = this._options.animate;
      record.panel.options.animationDuration = this._options.animationDuration;
    }, this);
    this._syncAnimationOptions();
    if (!this._options.multiple && this.getSelections().length > 1) {
      this.getSelections().slice(1).forEach(function(panel) {
        this.unselect(panel);
      }, this);
    }
    if (selectChanged) this.select(this._options.selected);
    this.setLocale(this._options.locale);
    this.setTheme(this._options.theme);
    this.resize();
    return this;
  };

  Accordion.prototype.on = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!name || typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  Accordion.prototype.off = function(name, listener) {
    var listeners;
    name = String(name || '').toLowerCase();
    listeners = this._listeners[name] || [];
    if (!listener) {
      this._listeners[name] = [];
      return this;
    }
    this._listeners[name] = listeners.filter(function(item) {
      return item !== listener;
    });
    return this;
  };

  Accordion.prototype.destroy = function() {
    if (this._destroyed) return;
    this._destroyed = true;
    this.removeEventListener();
    this._records.slice().reverse().forEach(function(record) {
      record.panel.destroy(true);
    });
    unregisterControl(this.hostElement, this);
    delete this.hostElement.__fabuiAccordion;
    restoreAccordionAttribute(
      this.hostElement,
      'class',
      this._originalClass
    );
    restoreAccordionAttribute(
      this.hostElement,
      'style',
      this._originalStyle
    );
    restoreAccordionAttribute(
      this.hostElement,
      'role',
      this._originalRole
    );
    this.hostElement.innerHTML = this._originalHtml;
    this._records = [];
    this._listeners = {};
  };

  Accordion.prototype.dispose = Accordion.prototype.destroy;

  Accordion._nextId = 1;
  Accordion.defaults = defaults;
  Accordion.locales = localePacks;
  Accordion.themes = ACCORDION_THEMES.slice();
  Accordion.addLocale = function(name, messages) {
    if (name && messages) {
      localePacks[String(name)] = assignAccordionOptions(
        {},
        localePacks.en,
        messages
      );
    }
    return Accordion;
  };
  Accordion.getControl = function(element) {
    element = resolveAccordionElement(element);
    return element && element.__fabuiAccordion ?
      element.__fabuiAccordion :
      null;
  };
  Accordion.normalizeTheme = normalizeAccordionTheme;
  Accordion.normalizeHalign = normalizeAccordionHalign;
  Accordion.normalizeLocale = normalizeLocale;
  return Accordion;
}
