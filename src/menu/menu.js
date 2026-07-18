var MENU_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black'
];
var activeMenu = null;
var menuZIndex = 110000;

function assignMenuOptions(target) {
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

function resolveMenuElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function menuNumber(value, fallback) {
  value = Number(value);
  return isFinite(value) ? value : fallback;
}

function menuBoolean(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    value = value.trim().toLowerCase();
    if (value === 'false' || value === '0' || value === 'no') return false;
    if (value === 'true' || value === '1' || value === 'yes' || value === '') return true;
  }
  return Boolean(value);
}

function restoreMenuAttribute(element, name, value) {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

function directElementChildren(element) {
  return Array.prototype.filter.call(element.children || [], function(child) {
    return child.nodeType === 1;
  });
}

function directChildByTag(element, tagName) {
  var children = directElementChildren(element);
  var index;
  for (index = 0; index < children.length; index += 1) {
    if (children[index].tagName === tagName) return children[index];
  }
  return null;
}

function directChildByClass(element, className) {
  var children = directElementChildren(element);
  var index;
  for (index = 0; index < children.length; index += 1) {
    if (children[index].classList.contains(className)) return children[index];
  }
  return null;
}

function readMenuItemText(element) {
  var label = directChildByTag(element, 'SPAN');
  var clone;
  var nested;
  if (label) return label.textContent == null ? '' : label.textContent.trim();
  clone = element.cloneNode(true);
  nested = directElementChildren(clone);
  nested.forEach(function(child) {
    if (child.tagName === 'DIV') child.remove();
  });
  return clone.textContent == null ? '' : clone.textContent.trim();
}

function parseMenuDataValue(value) {
  value = String(value == null ? '' : value).trim();
  if (!value) return '';
  if (
    (value.charAt(0) === '\'' && value.charAt(value.length - 1) === '\'') ||
    (value.charAt(0) === '"' && value.charAt(value.length - 1) === '"')
  ) {
    return value.slice(1, -1);
  }
  if (/^(?:true|false)$/i.test(value)) return value.toLowerCase() === 'true';
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  return value;
}

export function parseMenuDataOptions(source) {
  var options = {};
  var pattern = /([A-Za-z_$][\w$-]*)\s*:\s*("(?:\\.|[^"])*"|'(?:\\.|[^'])*'|[^,]+)/g;
  var match;
  source = String(source == null ? '' : source);
  while ((match = pattern.exec(source))) {
    options[match[1]] = parseMenuDataValue(match[2]);
  }
  return options;
}

export function normalizeMenuTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return MENU_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

export function normalizeMenuAlign(value) {
  return String(value || 'left').toLowerCase() === 'right' ? 'right' : 'left';
}

export function normalizeMenuLocale(value) {
  value = String(value || 'en');
  return value === 'zh-TW' || value === 'zh-CN' ? value : 'en';
}

function findMenuTheme(element) {
  var current = resolveMenuElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < MENU_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + MENU_THEMES[index])) {
        return MENU_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

export function createMenuFactory(Control, registerControl, unregisterControl) {
  var localePacks = {
    en: {
      menu: 'Menu',
      submenu: 'Submenu'
    },
    'zh-TW': {
      menu: '選單',
      submenu: '子選單'
    },
    'zh-CN': {
      menu: '菜单',
      submenu: '子菜单'
    }
  };

  function FabMenu(element, options) {
    var host = resolveMenuElement(element);
    var markupItems;
    if (!(this instanceof FabMenu)) return new FabMenu(element, options);
    if (!host) throw new Error('fabui.Menu requires a host element.');
    if (host.__fabuiMenu) return host.__fabuiMenu;
    Control.call(this);
    this.hostElement = host;
    this._listeners = {};
    this._destroyed = false;
    this._visible = false;
    this._activeItem = null;
    this._pointerInside = false;
    this._hideTimer = null;
    this._openEventsBound = false;
    this._itemId = 1;
    this._original = {
      html: host.innerHTML,
      className: host.getAttribute('class'),
      style: host.getAttribute('style'),
      role: host.getAttribute('role'),
      tabIndex: host.getAttribute('tabindex'),
      ariaLabel: host.getAttribute('aria-label'),
      hidden: host.hidden,
      parent: host.parentNode,
      nextSibling: host.nextSibling
    };
    this._themeSource = host.parentElement || document.body;
    this._options = assignMenuOptions({}, FabMenu.defaults, this._readElementOptions(), options || {});
    this._options.align = normalizeMenuAlign(this._options.align);
    this._options.locale = normalizeMenuLocale(this._options.locale);
    this._options.minWidth = Math.max(0, menuNumber(this._options.minWidth, 120));
    this._options.itemHeight = Math.max(22, menuNumber(this._options.itemHeight, 32));
    this._options.duration = Math.max(0, menuNumber(this._options.duration, 100));
    this._options.hideOnUnhover = menuBoolean(this._options.hideOnUnhover, true);
    this._options.inline = menuBoolean(this._options.inline, false);
    this._options.fit = menuBoolean(this._options.fit, false);
    markupItems = this._readMarkupItems(host);
    this.items = markupItems.length ? markupItems : this._normalizeItems(this._options.items, null);
    this._build();
    this._render();
    this._bind();
    host.__fabuiMenu = this;
    registerControl(host, this);
    this.setTheme(this._options.theme);
    if (this._options.inline) this.show();
  }

  FabMenu.prototype = Object.create(Control.prototype);
  FabMenu.prototype.constructor = FabMenu;

  FabMenu.prototype._getText = function(key) {
    return localePacks[this._options.locale][key] || localePacks.en[key] || key;
  };

  FabMenu.prototype._readElementOptions = function() {
    var host = this.hostElement;
    var options = {};
    var value;
    var parsed;
    value = host.getAttribute('theme') || host.getAttribute('data-theme');
    if (value) options.theme = value;
    value = host.getAttribute('locale') || host.getAttribute('data-locale');
    if (value) options.locale = value;
    value = host.getAttribute('align') || host.getAttribute('data-align');
    if (value) options.align = value;
    value = host.getAttribute('aria-label');
    if (value) options.ariaLabel = value;
    ['minWidth', 'itemHeight', 'duration', 'zIndex', 'left', 'top'].forEach(function(name) {
      var attribute = host.getAttribute(name);
      if (attribute == null) attribute = host.getAttribute('data-' + name.replace(/[A-Z]/g, function(letter) {
        return '-' + letter.toLowerCase();
      }));
      if (attribute != null && attribute !== '') options[name] = Number(attribute);
    });
    ['hideOnUnhover', 'inline', 'fit'].forEach(function(name) {
      var attribute = host.getAttribute(name);
      if (attribute == null) attribute = host.getAttribute('data-' + name.replace(/[A-Z]/g, function(letter) {
        return '-' + letter.toLowerCase();
      }));
      if (attribute != null) options[name] = menuBoolean(attribute, false);
    });
    parsed = parseMenuDataOptions(host.getAttribute('data-options'));
    return assignMenuOptions(options, parsed);
  };

  FabMenu.prototype._readMarkupItem = function(element, parent) {
    var data;
    var nested;
    var customContent;
    var item;
    var children;
    if (element.classList.contains('menu-sep') || element.classList.contains('fui-menu-separator')) {
      return this._normalizeItem({ separator: true }, parent);
    }
    data = parseMenuDataOptions(element.getAttribute('data-options'));
    nested = directElementChildren(element).filter(function(child) {
      return child.tagName === 'DIV' && !child.classList.contains('menu-content');
    })[0] || null;
    customContent = directChildByClass(element, 'menu-content');
    item = this._normalizeItem(assignMenuOptions({
      id: element.id || null,
      text: readMenuItemText(element),
      iconCls: element.getAttribute('iconCls') ||
        element.getAttribute('data-icon-cls') ||
        null,
      name: element.getAttribute('name') || element.getAttribute('data-name') || null,
      href: element.getAttribute('href') || element.getAttribute('data-href') || null,
      disabled: element.classList.contains('menu-item-disabled') ||
        menuBoolean(element.getAttribute('disabled'), false),
      hidden: element.hidden
    }, data), parent);
    if (customContent) item.content = customContent.innerHTML;
    if (nested) {
      children = this._readMarkupItems(nested, item);
      item.children = children;
      item.submenuWidth = nested.style.width || item.submenuWidth;
    }
    return item;
  };

  FabMenu.prototype._readMarkupItems = function(container, parent) {
    var self = this;
    return directElementChildren(container).map(function(element) {
      return self._readMarkupItem(element, parent || null);
    });
  };

  FabMenu.prototype._normalizeItems = function(items, parent) {
    var self = this;
    return (Array.isArray(items) ? items : []).map(function(item) {
      return self._normalizeItem(item, parent);
    });
  };

  FabMenu.prototype._normalizeItem = function(options, parent) {
    var item = assignMenuOptions({
      id: null,
      name: null,
      text: '',
      iconCls: null,
      href: null,
      disabled: false,
      hidden: false,
      separator: false,
      onclick: null,
      onClick: null,
      content: null,
      submenuWidth: null,
      children: [],
      parent: parent || null,
      target: null
    }, options || {});
    item._menuKey = this._itemId;
    this._itemId += 1;
    item.text = item.text == null ? '' : String(item.text);
    item.disabled = menuBoolean(item.disabled, false);
    item.hidden = menuBoolean(item.hidden, false);
    item.separator = menuBoolean(item.separator, false);
    item.submenuWidth = item.submenuWidth || null;
    item.parent = parent || null;
    item.children = this._normalizeItems(item.children, item);
    return item;
  };

  FabMenu.prototype._build = function() {
    var host = this.hostElement;
    if (!this._options.inline && host.parentNode !== document.body) {
      document.body.appendChild(host);
    }
    host.textContent = '';
    host.className = (
      (this._original.className ? this._original.className + ' ' : '') +
      'fui-menu' +
      (this._options.inline ? ' fui-menu-inline' : '')
    ).trim();
    host.setAttribute('role', 'menu');
    host.setAttribute('aria-label', this._options.ariaLabel || this._getText('menu'));
    host.tabIndex = -1;
    host.hidden = !this._options.inline;
    host.style.minWidth = this._options.minWidth + 'px';
    host.style.setProperty('--fui-menu-item-height', this._options.itemHeight + 'px');
    host.style.zIndex = String(menuNumber(this._options.zIndex, 110000));
    this.listElement = document.createElement('div');
    this.listElement.className = 'fui-menu-list';
    this.listElement.setAttribute('role', 'presentation');
    host.appendChild(this.listElement);
  };

  FabMenu.prototype._render = function() {
    var fragment = document.createDocumentFragment();
    var self = this;
    this._closeSubmenus();
    this._activeItem = null;
    this.listElement.textContent = '';
    this.items.forEach(function(item) {
      fragment.appendChild(self._renderItem(item));
    });
    this.listElement.appendChild(fragment);
    if (this._options.fit && this._options.inline && this.hostElement.parentElement) {
      this.hostElement.style.width = '100%';
    }
    return this;
  };

  FabMenu.prototype._renderItem = function(item) {
    var element = document.createElement('div');
    var iconCell;
    var icon;
    var text;
    var arrow;
    var submenu;
    var content;
    var self = this;
    if (item.separator) {
      element.className = 'fui-menu-separator';
      element.setAttribute('role', 'separator');
      element.hidden = item.hidden;
      item.target = element;
      element.__fabuiMenuItem = item;
      return element;
    }
    element.className = 'fui-menu-item';
    element.setAttribute('role', 'menuitem');
    element.setAttribute('data-menu-key', item._menuKey);
    element.tabIndex = -1;
    element.hidden = item.hidden;
    if (item.id) element.id = item.id;
    if (item.disabled) {
      element.classList.add('fui-menu-item-disabled');
      element.setAttribute('aria-disabled', 'true');
    }
    iconCell = document.createElement('span');
    iconCell.className = 'fui-menu-icon-cell';
    icon = document.createElement('span');
    icon.className = 'fui-menu-icon' + (item.iconCls ? ' ' + item.iconCls : '');
    iconCell.appendChild(icon);
    text = document.createElement('span');
    text.className = 'fui-menu-text';
    text.textContent = item.text;
    arrow = document.createElement('span');
    arrow.className = 'fui-menu-arrow';
    element.appendChild(iconCell);
    element.appendChild(text);
    element.appendChild(arrow);
    item.target = element;
    item.iconElement = icon;
    item.textElement = text;
    item.arrowElement = arrow;
    element.__fabuiMenuItem = item;
    if (item.children.length || item.content != null) {
      element.classList.add('fui-menu-item-parent');
      element.setAttribute('aria-haspopup', 'menu');
      element.setAttribute('aria-expanded', 'false');
      arrow.setAttribute('aria-label', this._getText('submenu'));
      submenu = document.createElement('div');
      submenu.className = 'fui-menu-submenu';
      submenu.setAttribute('role', item.content != null ? 'presentation' : 'menu');
      submenu.hidden = true;
      if (item.submenuWidth) submenu.style.width = String(item.submenuWidth);
      if (item.content != null) {
        content = document.createElement('div');
        content.className = 'fui-menu-content';
        if (item.content && item.content.nodeType === 1) content.appendChild(item.content);
        else content.innerHTML = String(item.content);
        submenu.appendChild(content);
      } else {
        item.children.forEach(function(child) {
          submenu.appendChild(self._renderItem(child));
        });
      }
      element.appendChild(submenu);
      item.submenuElement = submenu;
    } else {
      arrow.hidden = true;
      item.submenuElement = null;
    }
    return element;
  };

  FabMenu.prototype._bind = function() {
    var self = this;
    this._onPointerOver = function(event) {
      var element = event.target.closest('.fui-menu-item');
      if (!element || !self.hostElement.contains(element)) return;
      self._pointerInside = true;
      self._cancelHide();
      self._activateItem(element.__fabuiMenuItem, false);
      if (element.__fabuiMenuItem.submenuElement) self._openSubmenu(element.__fabuiMenuItem);
      else self._closeSiblingSubmenus(element.__fabuiMenuItem);
    };
    this._onPointerLeave = function() {
      if (
        self._pointerInside &&
        self._options.hideOnUnhover &&
        !self._options.inline
      ) {
        self._pointerInside = false;
        self._scheduleHide();
      }
    };
    this._onPointerEnter = function() {
      self._pointerInside = true;
      self._cancelHide();
    };
    this._onClick = function(event) {
      var element = event.target.closest('.fui-menu-item');
      if (event.target.closest('.fui-menu-content')) return;
      if (!element || !self.hostElement.contains(element)) return;
      event.preventDefault();
      self._activateItem(element.__fabuiMenuItem, true);
      self._selectItem(element.__fabuiMenuItem, event);
    };
    this._onKeyDown = function(event) {
      if (
        event.target.closest &&
        event.target.closest('.fui-menu-content') &&
        event.key !== 'Escape'
      ) return;
      self._handleKeyDown(event);
    };
    this._onDocumentPointerDown = function(event) {
      if (self.hostElement.contains(event.target)) return;
      if (self._triggerElement && self._triggerElement.contains(event.target)) return;
      self.hide(event);
    };
    this._onDocumentKeyDown = function(event) {
      if (event.key === 'Escape') self.hide(event);
    };
    this._onViewportChange = function() {
      if (self._visible && !self._options.inline) self.hide();
    };
    this.addEventListener(this.hostElement, 'pointerover', this._onPointerOver);
    this.addEventListener(this.hostElement, 'pointerenter', this._onPointerEnter);
    this.addEventListener(this.hostElement, 'pointerleave', this._onPointerLeave);
    this.addEventListener(this.hostElement, 'click', this._onClick);
    this.addEventListener(this.hostElement, 'keydown', this._onKeyDown);
  };

  FabMenu.prototype._bindOpenEvents = function() {
    if (this._openEventsBound || this._options.inline) return;
    this._openEventsBound = true;
    this.addEventListener(document, 'pointerdown', this._onDocumentPointerDown, true);
    this.addEventListener(document, 'keydown', this._onDocumentKeyDown);
    this.addEventListener(window, 'resize', this._onViewportChange);
    this.addEventListener(window, 'scroll', this._onViewportChange, true);
  };

  FabMenu.prototype._unbindOpenEvents = function() {
    if (!this._openEventsBound) return;
    this._openEventsBound = false;
    this.removeEventListener(document, 'pointerdown', this._onDocumentPointerDown, true);
    this.removeEventListener(document, 'keydown', this._onDocumentKeyDown);
    this.removeEventListener(window, 'resize', this._onViewportChange);
    this.removeEventListener(window, 'scroll', this._onViewportChange, true);
  };

  FabMenu.prototype._cancelHide = function() {
    if (this._hideTimer == null) return;
    clearTimeout(this._hideTimer);
    this._hideTimer = null;
  };

  FabMenu.prototype._scheduleHide = function() {
    var self = this;
    this._cancelHide();
    this._pointerInside = false;
    this._hideTimer = setTimeout(function() {
      self._hideTimer = null;
      self.hide();
    }, this._options.duration);
  };

  FabMenu.prototype._itemsForPanel = function(panel) {
    var items = [];
    var elements = panel ? panel.children : [];
    var index;
    var item;
    for (index = 0; index < elements.length; index += 1) {
      item = elements[index].__fabuiMenuItem;
      if (
        item &&
        !item.separator &&
        !item.disabled &&
        !item.hidden
      ) items.push(item);
    }
    return items;
  };

  FabMenu.prototype._activePanel = function() {
    if (this._activeItem && this._activeItem.parent && this._activeItem.parent.submenuElement) {
      return this._activeItem.parent.submenuElement;
    }
    return this.listElement;
  };

  FabMenu.prototype._activateItem = function(item, focus) {
    if (!item || item.separator || item.disabled || item.hidden) return false;
    if (this._activeItem && this._activeItem.target) {
      this._activeItem.target.classList.remove('fui-menu-item-active');
    }
    this._activeItem = item;
    item.target.classList.add('fui-menu-item-active');
    if (focus) item.target.focus();
    return true;
  };

  FabMenu.prototype._activateRelative = function(delta) {
    var panel = this._activePanel();
    var items = this._itemsForPanel(panel);
    var index = items.indexOf(this._activeItem);
    if (!items.length) return;
    if (index < 0) index = delta > 0 ? -1 : 0;
    index = (index + delta + items.length) % items.length;
    this._activateItem(items[index], true);
    this._closeSiblingSubmenus(items[index]);
  };

  FabMenu.prototype._activateEdge = function(last) {
    var items = this._itemsForPanel(this._activePanel());
    if (items.length) this._activateItem(items[last ? items.length - 1 : 0], true);
  };

  FabMenu.prototype._closeSiblingSubmenus = function(item) {
    var siblings = item.parent ? item.parent.children : this.items;
    siblings.forEach(function(sibling) {
      if (sibling !== item) this._closeItemSubmenu(sibling, true);
    }, this);
  };

  FabMenu.prototype._closeItemSubmenu = function(item, recursive) {
    if (recursive) {
      item.children.forEach(function(child) {
        this._closeItemSubmenu(child, true);
      }, this);
    }
    if (!item.submenuElement) return;
    item.submenuElement.hidden = true;
    item.target.classList.remove('fui-menu-item-open');
    item.target.setAttribute('aria-expanded', 'false');
  };

  FabMenu.prototype._closeSubmenus = function() {
    this.items.forEach(function(item) {
      this._closeItemSubmenu(item, true);
    }, this);
  };

  FabMenu.prototype._positionSubmenu = function(item) {
    var submenu = item.submenuElement;
    var itemRect;
    var submenuRect;
    var viewportWidth;
    var viewportHeight;
    var opensLeft;
    if (!submenu) return;
    submenu.style.left = '';
    submenu.style.right = '';
    submenu.style.top = '';
    submenu.hidden = false;
    itemRect = item.target.getBoundingClientRect();
    submenuRect = submenu.getBoundingClientRect();
    viewportWidth = document.documentElement.clientWidth;
    viewportHeight = document.documentElement.clientHeight;
    opensLeft = this._options.align === 'right';
    if (this._options.align === 'right') {
      submenu.style.left = 'auto';
      submenu.style.right = 'calc(100% - 4px)';
    } else {
      submenu.style.left = 'calc(100% - 4px)';
      submenu.style.right = 'auto';
    }
    if (
      this._options.align !== 'right' &&
      itemRect.right + submenuRect.width > viewportWidth &&
      itemRect.left >= submenuRect.width
    ) {
      submenu.style.left = 'auto';
      submenu.style.right = 'calc(100% - 4px)';
      opensLeft = true;
    } else if (
      this._options.align === 'right' &&
      itemRect.left - submenuRect.width < 0 &&
      viewportWidth - itemRect.right >= submenuRect.width
    ) {
      submenu.style.right = 'auto';
      submenu.style.left = 'calc(100% - 4px)';
      opensLeft = false;
    }
    if (itemRect.top + submenuRect.height > viewportHeight) {
      submenu.style.top = Math.min(0, viewportHeight - itemRect.top - submenuRect.height - 4) + 'px';
    }
    item.target.classList.toggle('fui-menu-item-submenu-left', opensLeft);
  };

  FabMenu.prototype._openSubmenu = function(item) {
    if (!item || !item.submenuElement || item.disabled) return false;
    this._closeSiblingSubmenus(item);
    item.target.classList.add('fui-menu-item-open');
    item.target.setAttribute('aria-expanded', 'true');
    this._positionSubmenu(item);
    return true;
  };

  FabMenu.prototype._handleKeyDown = function(event) {
    var item = this._activeItem;
    var childItems;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this._activateRelative(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this._activateRelative(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this._activateEdge(false);
    } else if (event.key === 'End') {
      event.preventDefault();
      this._activateEdge(true);
    } else if (event.key === 'ArrowRight' && item && item.submenuElement) {
      event.preventDefault();
      this._openSubmenu(item);
      childItems = this._itemsForPanel(item.submenuElement);
      if (childItems.length) this._activateItem(childItems[0], true);
    } else if (event.key === 'ArrowLeft' && item && item.parent) {
      event.preventDefault();
      this._closeItemSubmenu(item.parent, true);
      this._activateItem(item.parent, true);
    } else if ((event.key === 'Enter' || event.key === ' ') && item) {
      event.preventDefault();
      this._selectItem(item, event);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (this._options.inline) {
        this._closeSubmenus();
        this._activeItem = null;
      } else {
        this.hide(event);
      }
    }
  };

  FabMenu.prototype._selectItem = function(item, event) {
    var callback;
    if (!item || item.separator || item.disabled || item.hidden) return false;
    if (item.submenuElement) {
      this._openSubmenu(item);
      return true;
    }
    callback = typeof item.onclick === 'function' ? item.onclick : item.onClick;
    if (typeof callback === 'function') callback.call(item.target, item);
    this._fire('Click', {
      item: item,
      originalEvent: event || null
    });
    if (item.href && typeof window !== 'undefined') window.location.href = item.href;
    if (!this._options.inline) this.hide(event);
    return true;
  };

  FabMenu.prototype._fire = function(name, detail) {
    var args = assignMenuOptions({ menu: this }, detail || {});
    var callback = this._options['on' + name];
    var eventName = name.toLowerCase();
    if (typeof callback === 'function') {
      if (name === 'Click') callback.call(this.hostElement, args.item);
      else callback.call(this.hostElement);
    }
    (this._listeners[eventName] || []).slice().forEach(function(listener) {
      listener.call(this, args);
    }, this);
  };

  FabMenu.prototype._positionRoot = function(left, top) {
    var host = this.hostElement;
    var pageLeft = window.pageXOffset || document.documentElement.scrollLeft || 0;
    var pageTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    var viewportRight = pageLeft + document.documentElement.clientWidth;
    var viewportBottom = pageTop + document.documentElement.clientHeight;
    var rect;
    host.style.left = Math.round(menuNumber(left, 0)) + 'px';
    host.style.top = Math.round(menuNumber(top, 0)) + 'px';
    rect = host.getBoundingClientRect();
    left = Math.max(pageLeft, Math.min(menuNumber(left, 0), viewportRight - rect.width));
    top = Math.max(pageTop, Math.min(menuNumber(top, 0), viewportBottom - rect.height));
    host.style.left = Math.round(left) + 'px';
    host.style.top = Math.round(top) + 'px';
  };

  FabMenu.prototype.show = function(position) {
    var wasVisible = this._visible;
    if (this._destroyed) return this;
    this._cancelHide();
    if (activeMenu && activeMenu !== this && !activeMenu._options.inline) activeMenu.hide();
    activeMenu = this;
    position = position || {};
    if (position.left != null) this._options.left = position.left;
    if (position.top != null) this._options.top = position.top;
    this.hostElement.hidden = false;
    this.hostElement.style.visibility = 'hidden';
    menuZIndex = Math.max(menuZIndex + 1, menuNumber(this._options.zIndex, 110000));
    this.hostElement.style.zIndex = String(menuZIndex);
    if (!this._options.inline) this._positionRoot(this._options.left, this._options.top);
    this.hostElement.style.visibility = '';
    this._visible = true;
    this._bindOpenEvents();
    if (!this._options.inline) this.hostElement.focus();
    if (!wasVisible) this._fire('Show');
    return this;
  };

  FabMenu.prototype.hide = function() {
    if (this._destroyed || this._options.inline) return this;
    this._cancelHide();
    if (!this._visible) {
      if (activeMenu === this) activeMenu = null;
      return this;
    }
    this._closeSubmenus();
    if (this._activeItem && this._activeItem.target) {
      this._activeItem.target.classList.remove('fui-menu-item-active');
    }
    this._activeItem = null;
    this._pointerInside = false;
    this.hostElement.hidden = true;
    this._visible = false;
    this._unbindOpenEvents();
    if (activeMenu === this) activeMenu = null;
    this._fire('Hide');
    return this;
  };

  FabMenu.prototype.options = function() {
    return this._options;
  };

  FabMenu.prototype.getItem = function(target) {
    target = resolveMenuElement(target);
    return target && target.__fabuiMenuItem ? target.__fabuiMenuItem : null;
  };

  FabMenu.prototype.navItems = function(callback) {
    function visit(items) {
      var index;
      for (index = 0; index < items.length; index += 1) {
        if (callback(items[index]) === false) return false;
        if (visit(items[index].children) === false) return false;
      }
      return true;
    }
    if (typeof callback === 'function') visit(this.items);
    return this;
  };

  FabMenu.prototype.findItems = function(criteria) {
    var matches = [];
    this.navItems(function(item) {
      var matched = false;
      if (typeof criteria === 'function') matched = criteria(item) === true;
      else if (criteria && typeof criteria === 'object') {
        matched = Object.keys(criteria).every(function(key) {
          return item[key] === criteria[key];
        });
      } else {
        matched = item.text === criteria || item.name === criteria || item.id === criteria;
      }
      if (matched) matches.push(item);
    });
    return matches;
  };

  FabMenu.prototype.findItem = function(criteria) {
    return this.findItems(criteria)[0] || null;
  };

  FabMenu.prototype.setText = function(parameter) {
    var item = parameter && this.getItem(parameter.target);
    if (!item) return this;
    item.text = parameter.text == null ? '' : String(parameter.text);
    if (item.textElement) item.textElement.textContent = item.text;
    return this;
  };

  FabMenu.prototype.setIcon = function(parameter) {
    var item = parameter && this.getItem(parameter.target);
    if (!item) return this;
    item.iconCls = parameter.iconCls || null;
    if (item.iconElement) item.iconElement.className = 'fui-menu-icon' + (item.iconCls ? ' ' + item.iconCls : '');
    return this;
  };

  FabMenu.prototype.appendItem = function(options) {
    var parent = options && options.parent ?
      (options.parent.__fabuiMenuItem || options.parent) :
      null;
    var item = this._normalizeItem(options, parent);
    if (parent && parent.children) parent.children.push(item);
    else this.items.push(item);
    this._render();
    return item;
  };

  FabMenu.prototype.removeItem = function(target) {
    var item = target && target.__fabuiMenuItem ? target.__fabuiMenuItem : target;
    var items;
    var index;
    if (!item) return this;
    items = item.parent ? item.parent.children : this.items;
    index = items.indexOf(item);
    if (index >= 0) {
      items.splice(index, 1);
      this._render();
    }
    return this;
  };

  FabMenu.prototype.enableItem = function(target) {
    var item = target && target.__fabuiMenuItem ? target.__fabuiMenuItem : target;
    if (!item) return this;
    item.disabled = false;
    if (item.target) {
      item.target.classList.remove('fui-menu-item-disabled');
      item.target.removeAttribute('aria-disabled');
    }
    return this;
  };

  FabMenu.prototype.disableItem = function(target) {
    var item = target && target.__fabuiMenuItem ? target.__fabuiMenuItem : target;
    if (!item) return this;
    item.disabled = true;
    this._closeItemSubmenu(item, true);
    if (item.target) {
      item.target.classList.add('fui-menu-item-disabled');
      item.target.setAttribute('aria-disabled', 'true');
    }
    return this;
  };

  FabMenu.prototype.showItem = function(target) {
    var item = target && target.__fabuiMenuItem ? target.__fabuiMenuItem : target;
    if (!item) return this;
    item.hidden = false;
    if (item.target) item.target.hidden = false;
    return this;
  };

  FabMenu.prototype.hideItem = function(target) {
    var item = target && target.__fabuiMenuItem ? target.__fabuiMenuItem : target;
    if (!item) return this;
    item.hidden = true;
    this._closeItemSubmenu(item, true);
    if (item.target) item.target.hidden = true;
    return this;
  };

  FabMenu.prototype.resize = function(target) {
    var element = resolveMenuElement(target) || this.hostElement;
    if (!element) return this;
    if (element === this.hostElement) {
      element.style.minWidth = this._options.minWidth + 'px';
      if (this._visible && !this._options.inline) {
        this._positionRoot(this._options.left, this._options.top);
      }
    }
    return this;
  };

  FabMenu.prototype.setTheme = function(theme) {
    var index;
    this._options.theme = theme == null ? 'inherit' : theme;
    this.theme = this._options.theme === 'inherit' ?
      findMenuTheme(this._themeSource) :
      normalizeMenuTheme(this._options.theme);
    for (index = 0; index < MENU_THEMES.length; index += 1) {
      this.hostElement.classList.remove('fg-theme-' + MENU_THEMES[index]);
    }
    this.hostElement.classList.add('fg-theme-' + this.theme);
    return this;
  };

  FabMenu.prototype.setLocale = function(locale) {
    this._options.locale = normalizeMenuLocale(locale);
    this.hostElement.setAttribute('aria-label', this._options.ariaLabel || this._getText('menu'));
    return this;
  };

  FabMenu.prototype.on = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!name || typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  FabMenu.prototype.off = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!this._listeners[name]) return this;
    this._listeners[name] = listener ?
      this._listeners[name].filter(function(item) { return item !== listener; }) :
      [];
    return this;
  };

  FabMenu.prototype.destroy = function() {
    var host = this.hostElement;
    var parent = this._original.parent;
    if (this._destroyed) return;
    this.hide();
    this._destroyed = true;
    this._cancelHide();
    this._unbindOpenEvents();
    if (activeMenu === this) activeMenu = null;
    this.removeEventListener();
    unregisterControl(host, this);
    delete host.__fabuiMenu;
    if (parent && host.parentNode !== parent) {
      if (this._original.nextSibling && this._original.nextSibling.parentNode === parent) {
        parent.insertBefore(host, this._original.nextSibling);
      } else {
        parent.appendChild(host);
      }
    }
    host.innerHTML = this._original.html;
    restoreMenuAttribute(host, 'class', this._original.className);
    restoreMenuAttribute(host, 'style', this._original.style);
    restoreMenuAttribute(host, 'role', this._original.role);
    restoreMenuAttribute(host, 'tabindex', this._original.tabIndex);
    restoreMenuAttribute(host, 'aria-label', this._original.ariaLabel);
    host.hidden = this._original.hidden;
    this._fire('Destroy');
    this._listeners = {};
    this.items = [];
    this.listElement = null;
  };

  FabMenu.prototype.dispose = FabMenu.prototype.destroy;

  FabMenu.defaults = {
    zIndex: 110000,
    left: 0,
    top: 0,
    align: 'left',
    minWidth: 120,
    itemHeight: 32,
    duration: 100,
    hideOnUnhover: true,
    inline: false,
    fit: false,
    items: [],
    locale: 'en',
    theme: 'inherit',
    ariaLabel: null,
    onShow: null,
    onHide: null,
    onClick: null,
    onDestroy: null
  };
  FabMenu.locales = localePacks;
  FabMenu.themes = MENU_THEMES.slice();
  FabMenu.getControl = function(element) {
    element = resolveMenuElement(element);
    return element && element.__fabuiMenu ? element.__fabuiMenu : null;
  };
  FabMenu.normalizeTheme = normalizeMenuTheme;
  FabMenu.normalizeAlign = normalizeMenuAlign;
  FabMenu.normalizeLocale = normalizeMenuLocale;
  return FabMenu;
}
