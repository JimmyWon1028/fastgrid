function assignSplitButtonOptions(target) {
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

function resolveSplitButtonElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

export function createSplitButtonFactory(
  Control,
  registerControl,
  unregisterControl,
  MenuButton
) {
  if (typeof MenuButton !== 'function') {
    throw new Error('fabui.SplitButton requires fabui.MenuButton.');
  }

  function FabSplitButton(element, options) {
    var host = resolveSplitButtonElement(element);
    var menuButtonOptions;
    if (!(this instanceof FabSplitButton)) return new FabSplitButton(element, options);
    if (!host) throw new Error('fabui.SplitButton requires a host element.');
    if (host.__fabuiSplitButton) return host.__fabuiSplitButton;
    if (host.__fabuiMenuButton) {
      throw new Error('fabui.SplitButton cannot reuse an initialized fabui.MenuButton host.');
    }
    Control.call(this);
    this.hostElement = host;
    this._listeners = {};
    this._destroyed = false;
    this._showTimer = null;
    options = options || {};
    menuButtonOptions = assignSplitButtonOptions({}, options, {
      showEvent: 'fui-splitbutton-open',
      hideEvent: 'mouseleave',
      hasDownArrow: true,
      onClick: null,
      onShow: null,
      onHide: null,
      onMenuClick: null
    });
    this.menuButton = new MenuButton(host, menuButtonOptions);
    this.button = this.menuButton.button;
    this.menu = this.menuButton.menu;
    this.arrowElement = this.menuButton.arrowElement;
    this._options = assignSplitButtonOptions(
      {},
      FabSplitButton.defaults,
      this.menuButton.options(),
      options
    );
    this._options.duration = Math.max(0, Number(this._options.duration) || 0);
    this._options.hasDownArrow = true;
    this.theme = this.menuButton.theme;
    this.menuButton.button.off('click', this.menuButton._onTriggerClick);
    this._build();
    this._bind();
    host.__fabuiSplitButton = this;
    registerControl(host, this);
  }

  FabSplitButton.prototype = Object.create(Control.prototype);
  FabSplitButton.prototype.constructor = FabSplitButton;

  FabSplitButton.prototype._build = function() {
    this.hostElement.classList.add('fui-split-button');
    this.arrowElement.classList.add('fui-split-button-arrow');
    this.arrowElement.hidden = false;
  };

  FabSplitButton.prototype._bind = function() {
    var self = this;
    this._onButtonClick = function(args) {
      var event = args.originalEvent;
      var target = event && event.target;
      var arrowClick = target && (
        target === self.arrowElement ||
        self.arrowElement.contains(target)
      );
      self._cancelShow();
      if (arrowClick) {
        if (self._fire('ArrowClick', { originalEvent: event }) !== false) {
          if (self.menu.hostElement.hidden) self.show(event);
          else self.hide(event);
        }
        return false;
      }
      return self._fire('Click', {
        originalEvent: event,
        selected: self.button.options.selected
      });
    };
    this._onArrowEnter = function(event) {
      if (self._options.disabled) return;
      self.menuButton._cancelHide();
      self._scheduleShow(event);
    };
    this._onArrowLeave = function() {
      self._cancelShow();
    };
    this._onHostLeave = function() {
      self._cancelShow();
    };
    this._onMenuKeyDown = function(event) {
      if (event.key === 'Escape') self.hostElement.focus();
    };
    this._onMenuShow = function(args) {
      self._fire('Show', {
        originalEvent: args.originalEvent || null
      });
    };
    this._onMenuHide = function(args) {
      self._fire('Hide', {
        originalEvent: args.originalEvent || null
      });
    };
    this._onMenuClick = function(args) {
      self._fire('MenuClick', {
        item: args.item,
        originalEvent: args.originalEvent || null
      });
    };
    this.button.on('click', this._onButtonClick);
    this.addEventListener(this.arrowElement, 'pointerenter', this._onArrowEnter);
    this.addEventListener(this.arrowElement, 'pointerleave', this._onArrowLeave);
    this.addEventListener(this.hostElement, 'mouseleave', this._onHostLeave);
    this.addEventListener(this.menu.hostElement, 'keydown', this._onMenuKeyDown);
    this.menuButton.on('show', this._onMenuShow);
    this.menuButton.on('hide', this._onMenuHide);
    this.menuButton.on('menuclick', this._onMenuClick);
  };

  FabSplitButton.prototype._fire = function(name, detail) {
    var callback = this._options['on' + name];
    var listeners = (this._listeners[name.toLowerCase()] || []).slice();
    var args = assignSplitButtonOptions({
      splitButton: this,
      menuButton: this.menuButton,
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

  FabSplitButton.prototype._cancelShow = function() {
    if (this._showTimer == null) return;
    clearTimeout(this._showTimer);
    this._showTimer = null;
  };

  FabSplitButton.prototype._scheduleShow = function(event) {
    var self = this;
    this._cancelShow();
    this._showTimer = setTimeout(function() {
      self._showTimer = null;
      self.show(event);
    }, this._options.duration);
  };

  FabSplitButton.prototype.options = function() {
    return this._options;
  };

  FabSplitButton.prototype.show = function(event) {
    if (this._destroyed || this._options.disabled) return this;
    this._cancelShow();
    this.menuButton.show(event);
    return this;
  };

  FabSplitButton.prototype.hide = function(event) {
    this._cancelShow();
    this.menuButton.hide(event);
    return this;
  };

  FabSplitButton.prototype.disable = function() {
    if (this._options.disabled) return this;
    this._options.disabled = true;
    this.menuButton.disable();
    return this;
  };

  FabSplitButton.prototype.enable = function() {
    if (!this._options.disabled) return this;
    this._options.disabled = false;
    this.menuButton.enable();
    return this;
  };

  FabSplitButton.prototype.resize = function(param) {
    this.menuButton.resize(param);
    if (param && Object.prototype.hasOwnProperty.call(param, 'width')) {
      this._options.width = param.width;
    }
    if (param && Object.prototype.hasOwnProperty.call(param, 'height')) {
      this._options.height = param.height;
    }
    return this;
  };

  FabSplitButton.prototype.setText = function(text) {
    this._options.text = text == null ? '' : String(text);
    this.menuButton.setText(this._options.text);
    return this;
  };

  FabSplitButton.prototype.setIcon = function(iconCls, iconAlign) {
    this._options.iconCls = iconCls == null ? null : String(iconCls).trim();
    if (iconAlign != null) this._options.iconAlign = iconAlign;
    this.menuButton.setIcon(this._options.iconCls, iconAlign);
    return this;
  };

  FabSplitButton.prototype.setTheme = function(theme) {
    this._options.theme = theme == null ? 'inherit' : theme;
    this.menuButton.setTheme(this._options.theme);
    this.theme = this.menuButton.theme;
    return this;
  };

  FabSplitButton.prototype.on = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!name || typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  FabSplitButton.prototype.off = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!this._listeners[name]) return this;
    this._listeners[name] = listener ?
      this._listeners[name].filter(function(item) { return item !== listener; }) :
      [];
    return this;
  };

  FabSplitButton.prototype.destroy = function() {
    var host = this.hostElement;
    if (this._destroyed) return;
    this._destroyed = true;
    this._cancelShow();
    this.removeEventListener();
    this.button.off('click', this._onButtonClick);
    this.menuButton.off('show', this._onMenuShow);
    this.menuButton.off('hide', this._onMenuHide);
    this.menuButton.off('menuclick', this._onMenuClick);
    this.menuButton.destroy();
    unregisterControl(host, this);
    delete host.__fabuiSplitButton;
    this._listeners = {};
  };

  FabSplitButton.prototype.dispose = FabSplitButton.prototype.destroy;

  FabSplitButton.defaults = {
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
    onClick: null,
    onArrowClick: null,
    onShow: null,
    onHide: null,
    onMenuClick: null,
    onResize: null
  };
  FabSplitButton.getControl = function(element) {
    element = resolveSplitButtonElement(element);
    return element && element.__fabuiSplitButton ? element.__fabuiSplitButton : null;
  };
  return FabSplitButton;
}
