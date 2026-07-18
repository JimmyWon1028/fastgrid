import { parseMenuDataOptions } from '../menu/menu.js?v=20260718-menu-trigger-v3';

var menuButtonId = 1;

function assignMenuButtonOptions(target) {
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

function resolveMenuButtonElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function restoreMenuButtonAttribute(element, name, value) {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

function normalizeMenuButtonEvent(value, fallback) {
  value = String(value == null ? fallback : value).trim().toLowerCase();
  return /^[a-z][a-z0-9:-]*$/.test(value) ? value : fallback;
}

export function normalizeMenuButtonAlign(value) {
  return String(value || 'left').toLowerCase() === 'right' ? 'right' : 'left';
}

export function getMenuButtonHoverEvents(hideEvent) {
  if (String(hideEvent || '').toLowerCase().indexOf('pointer') === 0) {
    return {
      enter: 'pointerenter',
      leave: 'pointerleave'
    };
  }
  return {
    enter: 'mouseenter',
    leave: 'mouseleave'
  };
}

export function createMenuButtonFactory(
  Control,
  registerControl,
  unregisterControl,
  Button,
  Menu
) {
  function FabMenuButton(element, options) {
    var host = resolveMenuButtonElement(element);
    var menuHost;
    var menuOption;
    var buttonOptions;
    var menuOptions;
    if (!(this instanceof FabMenuButton)) return new FabMenuButton(element, options);
    if (!host) throw new Error('fabui.MenuButton requires a host element.');
    if (host.__fabuiMenuButton) return host.__fabuiMenuButton;
    if (!/^(?:A|BUTTON)$/i.test(host.tagName)) {
      throw new Error('fabui.MenuButton host must be an anchor or button element.');
    }
    if (typeof Button !== 'function' || typeof Menu !== 'function') {
      throw new Error('fabui.MenuButton requires fabui.Button and fabui.Menu.');
    }
    Control.call(this);
    this.hostElement = host;
    this._listeners = {};
    this._destroyed = false;
    this._showTimer = null;
    this._hideTimer = null;
    this._ownsMenu = false;
    this._menuOriginalId = null;
    this._menuOriginalTrigger = null;
    this._original = {
      ariaControls: host.getAttribute('aria-controls'),
      ariaExpanded: host.getAttribute('aria-expanded'),
      ariaHasPopup: host.getAttribute('aria-haspopup')
    };
    this._options = assignMenuButtonOptions(
      {},
      FabMenuButton.defaults,
      this._readElementOptions(),
      options || {}
    );
    this._options.menuAlign = normalizeMenuButtonAlign(this._options.menuAlign);
    this._options.duration = Math.max(0, Number(this._options.duration) || 0);
    this._options.showEvent = normalizeMenuButtonEvent(this._options.showEvent, 'mouseenter');
    this._options.hideEvent = normalizeMenuButtonEvent(this._options.hideEvent, 'mouseleave');
    this._options.hasDownArrow = this._options.hasDownArrow !== false;
    this._menuHoverEvents = getMenuButtonHoverEvents(this._options.hideEvent);
    menuOption = this._options.menu;
    if (menuOption && menuOption.hostElement && menuOption instanceof Menu) {
      this.menu = menuOption;
      menuHost = menuOption.hostElement;
    } else {
      menuHost = resolveMenuButtonElement(menuOption);
      if (!menuHost) {
        throw new Error('fabui.MenuButton requires a valid menu selector, element, or fabui.Menu.');
      }
      menuOptions = assignMenuButtonOptions({}, this._options.menuOptions || {}, {
        hideOnUnhover: false,
        inline: false,
        theme: this._options.theme
      });
      this.menu = new Menu(menuHost, menuOptions);
      this._ownsMenu = true;
    }
    this._menuOriginalId = menuHost.getAttribute('id');
    this._menuOriginalTrigger = this.menu._triggerElement || null;
    this.menu._triggerElement = host;
    if (!menuHost.id) {
      menuHost.id = 'fui-menu-button-menu-' + menuButtonId;
      menuButtonId += 1;
    }
    buttonOptions = assignMenuButtonOptions({}, this._options, {
      menu: undefined,
      menuOptions: undefined,
      duration: undefined,
      showEvent: undefined,
      hideEvent: undefined,
      hasDownArrow: undefined,
      menuAlign: undefined,
      onClick: null,
      onShow: null,
      onHide: null,
      onMenuClick: null
    });
    this.button = new Button(host, buttonOptions);
    this._build();
    this._bind();
    host.__fabuiMenuButton = this;
    registerControl(host, this);
    this.setTheme(this._options.theme);
  }

  FabMenuButton.prototype = Object.create(Control.prototype);
  FabMenuButton.prototype.constructor = FabMenuButton;

  FabMenuButton.prototype._readElementOptions = function() {
    var host = this.hostElement;
    var options = parseMenuDataOptions(host.getAttribute('data-options'));
    var value;
    var text = host.textContent == null ? '' : host.textContent.trim();
    if (text) options.text = text;
    value = host.getAttribute('iconCls') ||
      host.getAttribute('icon') ||
      host.getAttribute('data-icon-cls');
    if (value) options.iconCls = value;
    if (host.style.width) options.width = host.style.width;
    if (host.style.height) options.height = host.style.height;
    if (host.disabled || host.hasAttribute('disabled')) options.disabled = true;
    value = host.getAttribute('data-icon-align');
    if (value) options.iconAlign = value;
    value = host.getAttribute('data-size');
    if (value) options.size = value;
    ['plain', 'outline', 'fit'].forEach(function(name) {
      var attribute = host.getAttribute('data-' + name);
      if (attribute != null) options[name] = attribute !== 'false' && attribute !== '0';
    });
    value = host.getAttribute('menu') || host.getAttribute('data-menu');
    if (value) options.menu = value;
    value = host.getAttribute('data-menu-align');
    if (value) options.menuAlign = value;
    value = host.getAttribute('data-show-event');
    if (value) options.showEvent = value;
    value = host.getAttribute('data-hide-event');
    if (value) options.hideEvent = value;
    value = host.getAttribute('data-duration');
    if (value != null && value !== '') options.duration = Number(value);
    value = host.getAttribute('data-has-down-arrow');
    if (value != null) options.hasDownArrow = value !== 'false' && value !== '0';
    return options;
  };

  FabMenuButton.prototype._build = function() {
    var host = this.hostElement;
    this.arrowElement = document.createElement('span');
    this.arrowElement.className = 'fui-menu-button-arrow';
    this.arrowElement.setAttribute('aria-hidden', 'true');
    this.arrowElement.hidden = !this._options.hasDownArrow;
    host.classList.add('fui-menu-button');
    host.classList.toggle('fui-menu-button-no-arrow', !this._options.hasDownArrow);
    host.appendChild(this.arrowElement);
    host.setAttribute('aria-haspopup', 'menu');
    host.setAttribute('aria-expanded', 'false');
    host.setAttribute('aria-controls', this.menu.hostElement.id);
  };

  FabMenuButton.prototype._bind = function() {
    var self = this;
    this._onTriggerClick = function(args) {
      if (self._options.disabled) return false;
      self._cancelTimers();
      if (self.menu.hostElement.hidden) self.show(args.originalEvent);
      else self.hide(args.originalEvent);
      return self._fire('Click', { originalEvent: args.originalEvent });
    };
    this._onShowEvent = function(event) {
      if (self._options.disabled) return;
      self._cancelHide();
      if (self._options.showEvent === 'click') return;
      self._scheduleShow(event);
    };
    this._onHideEvent = function(event) {
      if (self._options.hideEvent === 'click') return;
      self._cancelShow();
      self._scheduleHide(event);
    };
    this._onMenuEnter = function() {
      self._cancelHide();
    };
    this._onMenuLeave = function(event) {
      self._scheduleHide(event);
    };
    this._onKeyDown = function(event) {
      if (self._options.disabled) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        self.show(event);
        self.menu.hostElement.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          bubbles: true
        }));
      } else if (event.key === 'Escape') {
        self.hide(event);
        self.hostElement.focus();
      }
    };
    this._onMenuShow = function(args) {
      self.hostElement.classList.add('fui-menu-button-open');
      self.hostElement.setAttribute('aria-expanded', 'true');
      self._fire('Show', { menu: self.menu, originalEvent: args.originalEvent || null });
    };
    this._onMenuHide = function(args) {
      self.hostElement.classList.remove('fui-menu-button-open');
      self.hostElement.setAttribute('aria-expanded', 'false');
      self._fire('Hide', { menu: self.menu, originalEvent: args.originalEvent || null });
    };
    this._onMenuClick = function(args) {
      self._fire('MenuClick', {
        menu: self.menu,
        item: args.item,
        originalEvent: args.originalEvent || null
      });
      self.hostElement.focus();
    };
    this.button.on('click', this._onTriggerClick);
    this.addEventListener(this.hostElement, this._options.showEvent, this._onShowEvent);
    this.addEventListener(this.hostElement, this._options.hideEvent, this._onHideEvent);
    this.addEventListener(this.hostElement, 'keydown', this._onKeyDown);
    this.addEventListener(
      this.menu.hostElement,
      this._menuHoverEvents.enter,
      this._onMenuEnter
    );
    this.addEventListener(
      this.menu.hostElement,
      this._menuHoverEvents.leave,
      this._onMenuLeave
    );
    this.menu.on('show', this._onMenuShow);
    this.menu.on('hide', this._onMenuHide);
    this.menu.on('click', this._onMenuClick);
  };

  FabMenuButton.prototype._fire = function(name, detail) {
    var callback = this._options['on' + name];
    var listeners = (this._listeners[name.toLowerCase()] || []).slice();
    var args = assignMenuButtonOptions({
      menuButton: this,
      button: this.button,
      menu: this.menu
    }, detail || {});
    var allowed = true;
    if (typeof callback === 'function' && callback.call(this.hostElement, this, args) === false) {
      allowed = false;
    }
    listeners.forEach(function(listener) {
      if (listener.call(this, args) === false) allowed = false;
    }, this);
    return allowed;
  };

  FabMenuButton.prototype._cancelShow = function() {
    if (this._showTimer == null) return;
    clearTimeout(this._showTimer);
    this._showTimer = null;
  };

  FabMenuButton.prototype._cancelHide = function() {
    if (this._hideTimer == null) return;
    clearTimeout(this._hideTimer);
    this._hideTimer = null;
  };

  FabMenuButton.prototype._cancelTimers = function() {
    this._cancelShow();
    this._cancelHide();
  };

  FabMenuButton.prototype._scheduleShow = function(event) {
    var self = this;
    this._cancelShow();
    this._showTimer = setTimeout(function() {
      self._showTimer = null;
      self.show(event);
    }, this._options.duration);
  };

  FabMenuButton.prototype._scheduleHide = function(event) {
    var self = this;
    this._cancelHide();
    this._hideTimer = setTimeout(function() {
      self._hideTimer = null;
      self.hide(event);
    }, this._options.duration);
  };

  FabMenuButton.prototype.options = function() {
    return this._options;
  };

  FabMenuButton.prototype.show = function(event) {
    var rect;
    var left;
    var top;
    var menuOptions;
    if (this._destroyed || this._options.disabled) return this;
    this._cancelTimers();
    rect = this.hostElement.getBoundingClientRect();
    left = rect.left + (window.pageXOffset || 0);
    top = rect.bottom + (window.pageYOffset || 0);
    this.menu.show({ left: left, top: top });
    if (this._options.menuAlign === 'right') {
      left = rect.right + (window.pageXOffset || 0) - this.menu.hostElement.getBoundingClientRect().width;
      menuOptions = this.menu.options();
      menuOptions.left = left;
      this.menu.resize();
    }
    return this;
  };

  FabMenuButton.prototype.hide = function() {
    this._cancelTimers();
    this.menu.hide();
    return this;
  };

  FabMenuButton.prototype.disable = function() {
    if (this._options.disabled) return this;
    this._options.disabled = true;
    this.button.disable();
    this.hide();
    return this;
  };

  FabMenuButton.prototype.enable = function() {
    if (!this._options.disabled) return this;
    this._options.disabled = false;
    this.button.enable();
    return this;
  };

  FabMenuButton.prototype.resize = function(param) {
    this.button.resize(param);
    if (param && Object.prototype.hasOwnProperty.call(param, 'width')) {
      this._options.width = param.width;
    }
    if (param && Object.prototype.hasOwnProperty.call(param, 'height')) {
      this._options.height = param.height;
    }
    return this;
  };

  FabMenuButton.prototype.setText = function(text) {
    this._options.text = text == null ? '' : String(text);
    this.button.setText(this._options.text);
    return this;
  };

  FabMenuButton.prototype.setIcon = function(iconCls, iconAlign) {
    this._options.iconCls = iconCls == null ? null : String(iconCls).trim();
    if (iconAlign != null) this._options.iconAlign = iconAlign;
    this.button.setIcon(this._options.iconCls, iconAlign);
    return this;
  };

  FabMenuButton.prototype.setTheme = function(theme) {
    this._options.theme = theme == null ? 'inherit' : theme;
    this.button.setTheme(this._options.theme);
    this.menu.setTheme(this._options.theme);
    this.theme = this.button.theme;
    return this;
  };

  FabMenuButton.prototype.on = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!name || typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  FabMenuButton.prototype.off = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!this._listeners[name]) return this;
    this._listeners[name] = listener ?
      this._listeners[name].filter(function(item) { return item !== listener; }) :
      [];
    return this;
  };

  FabMenuButton.prototype.destroy = function() {
    var host = this.hostElement;
    if (this._destroyed) return;
    this._destroyed = true;
    this._cancelTimers();
    this.removeEventListener();
    this.button.off('click', this._onTriggerClick);
    this.menu.off('show', this._onMenuShow);
    this.menu.off('hide', this._onMenuHide);
    this.menu.off('click', this._onMenuClick);
    this.menu.hide();
    this.menu._triggerElement = this._menuOriginalTrigger;
    if (this._ownsMenu) this.menu.destroy();
    restoreMenuButtonAttribute(this.menu.hostElement, 'id', this._menuOriginalId);
    this.button.destroy();
    restoreMenuButtonAttribute(host, 'aria-controls', this._original.ariaControls);
    restoreMenuButtonAttribute(host, 'aria-expanded', this._original.ariaExpanded);
    restoreMenuButtonAttribute(host, 'aria-haspopup', this._original.ariaHasPopup);
    unregisterControl(host, this);
    delete host.__fabuiMenuButton;
    this._listeners = {};
  };

  FabMenuButton.prototype.dispose = FabMenuButton.prototype.destroy;

  FabMenuButton.defaults = {
    width: null,
    height: null,
    id: null,
    disabled: false,
    toggle: false,
    selected: false,
    group: null,
    plain: true,
    outline: false,
    text: '',
    iconCls: null,
    iconAlign: 'left',
    size: 'small',
    fit: false,
    cls: '',
    theme: 'inherit',
    menu: null,
    menuOptions: null,
    menuAlign: 'left',
    duration: 100,
    showEvent: 'mouseenter',
    hideEvent: 'mouseleave',
    hasDownArrow: true,
    onClick: null,
    onShow: null,
    onHide: null,
    onMenuClick: null,
    onResize: null
  };
  FabMenuButton.getControl = function(element) {
    element = resolveMenuButtonElement(element);
    return element && element.__fabuiMenuButton ? element.__fabuiMenuButton : null;
  };
  FabMenuButton.normalizeMenuAlign = normalizeMenuButtonAlign;
  return FabMenuButton;
}
