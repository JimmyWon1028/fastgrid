var activeComboPopup = null;
var COMBO_POPUP_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];

function assignComboPopupOptions(target) {
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

function resolveComboPopupElement(element) {
  return typeof element === 'string' ? document.querySelector(element) : element;
}

function normalizeComboPopupTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return COMBO_POPUP_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

function findComboPopupTheme(element) {
  var current = resolveComboPopupElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < COMBO_POPUP_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + COMBO_POPUP_THEMES[index])) {
        return COMBO_POPUP_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

function comboPopupCssSize(value, fallback) {
  if (value == null || value === '') return fallback == null ? '' : fallback + 'px';
  return typeof value === 'number' ? value + 'px' : String(value);
}

function appendComboPopupContent(element, content) {
  if (content && content.nodeType) {
    element.appendChild(content);
  } else {
    element.insertAdjacentHTML(
      'beforeend',
      content == null ? '' : String(content)
    );
  }
}

export function ComboPopup(options) {
  if (!(this instanceof ComboPopup)) return new ComboPopup(options);
  this.options = assignComboPopupOptions({}, ComboPopup.defaults, options || {});
  this.destroyed = false;
  this.visible = false;
  this._openEventsBound = false;
  this.items = [];
  this.activeIndex = -1;
  this._normalizeOptions();
  this._build();
  this.setTheme(this.options.theme);
  this._bind();
  this.render();
}

ComboPopup.defaults = {
  anchor: null,
  theme: 'inherit',
  themeSource: null,
  className: '',
  ariaLabel: 'Combo box options',
  panelWidth: null,
  panelHeight: 300,
  panelMinWidth: null,
  panelMaxWidth: null,
  panelMinHeight: null,
  panelMaxHeight: null,
  panelAlign: 'left',
  panelValign: 'auto',
  fitContent: false,
  multiple: false,
  closeOnSelect: true,
  emptyText: '',
  items: [],
  containsTarget: null,
  openClassHost: null,
  renderItem: null,
  renderGroup: null,
  onSelect: null,
  onActiveChange: null,
  onShow: null,
  onHide: null
};

ComboPopup.prototype._normalizeOptions = function() {
  this.options.items = Array.isArray(this.options.items) ?
    this.options.items.slice() :
    [];
  this.options.multiple = this.options.multiple === true;
  this.options.closeOnSelect = this.options.closeOnSelect !== false;
  this.options.panelAlign = this.options.panelAlign === 'right' ? 'right' : 'left';
  this.options.panelValign = this.options.panelValign === 'top' ?
    'top' :
    'auto';
};

ComboPopup.prototype._build = function() {
  var panel = document.createElement('div');
  panel.className = ('fui-combobox-panel ' + (this.options.className || '')).trim();
  panel.hidden = true;
  panel.setAttribute('role', 'listbox');
  panel.setAttribute(
    'aria-multiselectable',
    this.options.multiple ? 'true' : 'false'
  );
  panel.setAttribute('aria-label', this.options.ariaLabel);
  document.body.appendChild(panel);
  this.panel = panel;
};

ComboPopup.prototype._bind = function() {
  var self = this;
  this._onPanelMouseDown = function(event) {
    event.preventDefault();
  };
  this._onPanelClick = function(event) {
    var element = event.target.closest('.fui-combobox-item');
    var index;
    var item;
    if (!element || element.classList.contains('fui-combobox-item-disabled')) {
      return;
    }
    index = Number(element.getAttribute('data-index'));
    item = self.items[index];
    if (!item) return;
    self.setActiveIndex(index, 'pointer');
    if (typeof self.options.onSelect === 'function') {
      self.options.onSelect(item, index, self, event);
    }
    if (self.options.closeOnSelect) self.hide();
  };
  this._onPanelMouseOver = function(event) {
    var element = event.target.closest('.fui-combobox-item');
    if (!element || element.classList.contains('fui-combobox-item-disabled')) {
      return;
    }
    self.setActiveIndex(
      Number(element.getAttribute('data-index')),
      'pointer'
    );
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
  this.panel.addEventListener('mousedown', this._onPanelMouseDown);
  this.panel.addEventListener('click', this._onPanelClick);
  this.panel.addEventListener('mouseover', this._onPanelMouseOver);
};

ComboPopup.prototype._bindOpenEvents = function() {
  if (this._openEventsBound) return;
  this._openEventsBound = true;
  document.addEventListener('pointerdown', this._onDocumentPointerDown, true);
  document.addEventListener('keydown', this._onDocumentKeyDown);
  window.addEventListener('resize', this._onWindowChange);
  window.addEventListener('scroll', this._onWindowChange, true);
};

ComboPopup.prototype._unbindOpenEvents = function() {
  if (!this._openEventsBound) return;
  this._openEventsBound = false;
  document.removeEventListener('pointerdown', this._onDocumentPointerDown, true);
  document.removeEventListener('keydown', this._onDocumentKeyDown);
  window.removeEventListener('resize', this._onWindowChange);
  window.removeEventListener('scroll', this._onWindowChange, true);
};

ComboPopup.prototype._containsTarget = function(target) {
  var anchor = resolveComboPopupElement(this.options.anchor);
  if (anchor && (anchor === target || anchor.contains(target))) return true;
  return typeof this.options.containsTarget === 'function' &&
    this.options.containsTarget(target) === true;
};

ComboPopup.prototype.setOptions = function(options) {
  assignComboPopupOptions(this.options, options || {});
  this._normalizeOptions();
  this.panel.className = ('fui-combobox-panel ' + (this.options.className || '')).trim();
  this.setTheme(this.options.theme);
  this.panel.setAttribute('aria-label', this.options.ariaLabel);
  this.panel.setAttribute(
    'aria-multiselectable',
    this.options.multiple ? 'true' : 'false'
  );
  this.items = this.options.items.slice();
  this.render();
  return this;
};

ComboPopup.prototype.setLayout = function(options) {
  assignComboPopupOptions(this.options, options || {});
  return this;
};

ComboPopup.prototype.setTheme = function(theme) {
  var index;
  var source;
  this.options.theme = theme == null ? 'inherit' : String(theme);
  source = this.options.themeSource || this.options.anchor;
  this.theme = this.options.theme === 'inherit' ?
    findComboPopupTheme(source) :
    normalizeComboPopupTheme(this.options.theme);
  for (index = 0; index < COMBO_POPUP_THEMES.length; index += 1) {
    this.panel.classList.remove('fg-theme-' + COMBO_POPUP_THEMES[index]);
  }
  this.panel.classList.add('fg-theme-' + this.theme);
  return this;
};

ComboPopup.prototype.setItems = function(items) {
  this.items = Array.isArray(items) ? items.slice() : [];
  this.options.items = this.items.slice();
  this.render();
  return this;
};

ComboPopup.prototype.render = function() {
  var lastGroup;
  var index;
  var descriptor;
  var group;
  var groupElement;
  var itemElement;
  var icon;
  var text;
  var value;
  var empty;
  this.panel.textContent = '';
  this.activeIndex = -1;
  for (index = 0; index < this.items.length; index += 1) {
    descriptor = this.items[index] || {};
    group = descriptor.group;
    if (group != null && group !== lastGroup) {
      groupElement = document.createElement('div');
      groupElement.className = 'fui-combobox-group' +
        (descriptor.groupSticky ? ' fui-combobox-group-sticky' : '');
      if (typeof this.options.renderGroup === 'function') {
        appendComboPopupContent(
          groupElement,
          this.options.renderGroup(group, descriptor, this)
        );
      } else {
        groupElement.textContent = String(group);
      }
      this.panel.appendChild(groupElement);
      lastGroup = group;
    }
    itemElement = document.createElement('div');
    itemElement.className = 'fui-combobox-item' +
      (group != null ? ' fui-combobox-group-item' : '');
    itemElement.setAttribute('data-index', index);
    itemElement.setAttribute(
      'data-value',
      descriptor.value == null ? '' : String(descriptor.value)
    );
    itemElement.setAttribute('role', 'option');
    itemElement.setAttribute(
      'aria-selected',
      descriptor.selected ? 'true' : 'false'
    );
    if (descriptor.disabled) {
      itemElement.classList.add('fui-combobox-item-disabled');
      itemElement.setAttribute('aria-disabled', 'true');
    }
    if (descriptor.selected) {
      itemElement.classList.add('fui-combobox-item-selected');
    }
    if (descriptor.iconClass) {
      icon = document.createElement('span');
      icon.className = 'fui-combobox-item-icon ' + descriptor.iconClass;
      itemElement.appendChild(icon);
    }
    if (Object.prototype.hasOwnProperty.call(descriptor, 'content')) {
      appendComboPopupContent(itemElement, descriptor.content);
    } else if (typeof this.options.renderItem === 'function') {
      appendComboPopupContent(
        itemElement,
        this.options.renderItem(descriptor, itemElement, this)
      );
    } else {
      text = document.createElement('span');
      text.className = 'fui-combobox-item-text';
      text.textContent = descriptor.text == null ? '' : String(descriptor.text);
      itemElement.appendChild(text);
      if (descriptor.secondaryText != null &&
        String(descriptor.secondaryText) !== '') {
        value = document.createElement('span');
        value.className = 'fui-combobox-item-value';
        value.textContent = String(descriptor.secondaryText);
        itemElement.appendChild(value);
        itemElement.setAttribute(
          'aria-label',
          text.textContent + ' ' + value.textContent
        );
      }
    }
    this.panel.appendChild(itemElement);
  }
  if (!this.items.length) {
    empty = document.createElement('div');
    empty.className = 'fui-combobox-empty';
    empty.textContent = this.options.emptyText || '';
    this.panel.appendChild(empty);
  }
  return this;
};

ComboPopup.prototype.setActiveIndex = function(index, reason) {
  var elements;
  var element;
  var next;
  var attempts;
  var item;
  if (!this.items.length) {
    this.activeIndex = -1;
    return this;
  }
  next = Math.max(0, Math.min(this.items.length - 1, Number(index) || 0));
  attempts = 0;
  while (this.items[next] && this.items[next].disabled &&
    attempts < this.items.length) {
    next = (next + 1) % this.items.length;
    attempts += 1;
  }
  this.activeIndex = next;
  elements = this.panel.querySelectorAll('.fui-combobox-item');
  Array.prototype.forEach.call(elements, function(candidate, itemIndex) {
    candidate.classList.toggle(
      'fui-combobox-item-active',
      itemIndex === next
    );
  });
  element = this.panel.querySelector(
    '.fui-combobox-item[data-index="' + next + '"]'
  );
  if (element && element.scrollIntoView) {
    element.scrollIntoView({ block: 'nearest' });
  }
  item = this.items[next] || null;
  if (typeof this.options.onActiveChange === 'function') {
    this.options.onActiveChange(next, item, reason || 'api', this);
  }
  return this;
};

ComboPopup.prototype.moveActive = function(direction) {
  var length = this.items.length;
  var next;
  var attempts = 0;
  if (!length) return this;
  next = this.activeIndex;
  do {
    next = (next + direction + length) % length;
    attempts += 1;
  } while (this.items[next] && this.items[next].disabled && attempts <= length);
  return this.setActiveIndex(next, 'keyboard');
};

ComboPopup.prototype.selectActive = function() {
  var item = this.items[this.activeIndex];
  if (!item || item.disabled) return this;
  if (typeof this.options.onSelect === 'function') {
    this.options.onSelect(item, this.activeIndex, this, null);
  }
  if (this.options.closeOnSelect) this.hide();
  return this;
};

ComboPopup.prototype.show = function() {
  var openClassHost;
  if (this.destroyed || this.visible) return this;
  if (activeComboPopup && activeComboPopup !== this) activeComboPopup.hide();
  this.setTheme(this.options.theme);
  this.visible = true;
  this.panel.hidden = false;
  this._bindOpenEvents();
  activeComboPopup = this;
  openClassHost = resolveComboPopupElement(this.options.openClassHost);
  if (openClassHost) openClassHost.classList.add('fui-combobox-open');
  this.position();
  if (typeof this.options.onShow === 'function') this.options.onShow(this);
  return this;
};

ComboPopup.themes = COMBO_POPUP_THEMES.slice();

ComboPopup.prototype.hide = function() {
  var openClassHost;
  if (!this.visible) return this;
  this.visible = false;
  this.activeIndex = -1;
  this.panel.hidden = true;
  this._unbindOpenEvents();
  if (activeComboPopup === this) activeComboPopup = null;
  openClassHost = resolveComboPopupElement(this.options.openClassHost);
  if (openClassHost) openClassHost.classList.remove('fui-combobox-open');
  if (typeof this.options.onHide === 'function') this.options.onHide(this);
  return this;
};

ComboPopup.prototype.toggle = function() {
  return this.visible ? this.hide() : this.show();
};

ComboPopup.prototype.isOpen = function() {
  return this.visible;
};

ComboPopup.prototype.handleKeyDown = function(event) {
  var key = event.key;
  if ((key === 'ArrowDown' && (event.altKey || event.metaKey)) || key === 'F4') {
    event.preventDefault();
    this.show();
    return true;
  }
  if (!this.visible) return false;
  if (key === 'ArrowDown' || key === 'ArrowUp') {
    event.preventDefault();
    this.moveActive(key === 'ArrowDown' ? 1 : -1);
    return true;
  }
  if (key === 'Enter') {
    event.preventDefault();
    this.selectActive();
    return true;
  }
  if (key === 'Escape') {
    event.preventDefault();
    this.hide();
    return true;
  }
  return false;
};

ComboPopup.prototype.measureContentWidth = function() {
  var previousWidth = this.panel.style.width;
  var width;
  this.panel.style.width = 'auto';
  width = Math.ceil(this.panel.scrollWidth || this.panel.offsetWidth || 0) + 2;
  this.panel.style.width = previousWidth;
  return width;
};

ComboPopup.prototype.position = function() {
  var anchor = resolveComboPopupElement(this.options.anchor);
  var rect;
  var width;
  var height;
  var left;
  var top;
  var viewportLeft;
  var viewportTop;
  var viewportWidth;
  var viewportHeight;
  if (!this.visible || !anchor) return this;
  rect = anchor.getBoundingClientRect();
  viewportLeft = window.pageXOffset;
  viewportTop = window.pageYOffset;
  viewportWidth = document.documentElement.clientWidth;
  viewportHeight = document.documentElement.clientHeight;
  width = this.options.panelWidth == null ?
    rect.width :
    parseFloat(this.options.panelWidth) || rect.width;
  if (this.options.fitContent) {
    width = Math.max(width, this.measureContentWidth());
  }
  if (this.options.panelMinWidth != null) {
    width = Math.max(width, parseFloat(this.options.panelMinWidth) || 0);
  }
  if (this.options.panelMaxWidth != null) {
    width = Math.min(width, parseFloat(this.options.panelMaxWidth) || width);
  }
  width = Math.min(width, Math.max(0, viewportWidth - 12));
  this.panel.style.width = comboPopupCssSize(width, rect.width);
  this.panel.style.height = this.options.panelHeight === 'auto' ?
    'auto' :
    comboPopupCssSize(this.options.panelHeight, 300);
  this.panel.style.minWidth = comboPopupCssSize(this.options.panelMinWidth, null);
  this.panel.style.maxWidth = comboPopupCssSize(this.options.panelMaxWidth, null);
  this.panel.style.minHeight = comboPopupCssSize(this.options.panelMinHeight, null);
  this.panel.style.maxHeight = comboPopupCssSize(this.options.panelMaxHeight, null);
  height = this.panel.offsetHeight;
  left = this.options.panelAlign === 'right' ?
    rect.right + viewportLeft - width :
    rect.left + viewportLeft;
  top = rect.bottom + viewportTop;
  if (this.options.panelValign === 'top' ||
    (this.options.panelValign === 'auto' &&
      rect.bottom + height > viewportHeight &&
      rect.top > height)) {
    top = rect.top + viewportTop - height;
  }
  if (left + width > viewportLeft + viewportWidth - 6) {
    left = Math.max(
      viewportLeft + 6,
      viewportLeft + viewportWidth - width - 6
    );
  }
  if (left < viewportLeft + 6) left = viewportLeft + 6;
  this.panel.style.left = Math.round(left) + 'px';
  this.panel.style.top = Math.round(top) + 'px';
  return this;
};

ComboPopup.prototype.destroy = function() {
  if (this.destroyed) return;
  this.hide();
  this.destroyed = true;
  this.panel.removeEventListener('mousedown', this._onPanelMouseDown);
  this.panel.removeEventListener('click', this._onPanelClick);
  this.panel.removeEventListener('mouseover', this._onPanelMouseOver);
  this._unbindOpenEvents();
  if (this.panel.parentNode) this.panel.parentNode.removeChild(this.panel);
};
