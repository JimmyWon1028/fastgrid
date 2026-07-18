var BUTTON_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black'
];

function assignButtonOptions(target) {
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

function resolveButtonElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function buttonBooleanAttribute(element, name) {
  var value = element.getAttribute(name);
  if (value == null) return undefined;
  return value === '' || value === name || value === 'true' || value === '1';
}

function buttonSizeValue(value) {
  if (value == null || value === '' || value === 'auto') return '';
  return typeof value === 'number' ? Math.max(0, value) + 'px' : String(value);
}

function restoreButtonAttribute(element, name, value) {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

export function normalizeButtonTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return BUTTON_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

export function normalizeButtonIconAlign(value) {
  value = String(value || 'left').toLowerCase();
  return ['left', 'right', 'top', 'bottom'].indexOf(value) >= 0 ? value : 'left';
}

export function normalizeButtonSize(value) {
  return String(value || 'small').toLowerCase() === 'large' ? 'large' : 'small';
}

function findButtonTheme(element) {
  var current = resolveButtonElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < BUTTON_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + BUTTON_THEMES[index])) {
        return BUTTON_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

export function createButtonFactory(Control, registerControl, unregisterControl) {
  var groups = Object.create(null);

  function FabButton(element, options) {
    var host = resolveButtonElement(element);
    var initiallySelected;
    if (!(this instanceof FabButton)) return new FabButton(element, options);
    if (!host) throw new Error('fabui.Button requires a host element.');
    if (host.__fabuiButton) return host.__fabuiButton;
    if (!/^(?:A|BUTTON)$/i.test(host.tagName)) {
      throw new Error('fabui.Button host must be an anchor or button element.');
    }
    Control.call(this);
    this.hostElement = host;
    this._listeners = {};
    this._destroyed = false;
    this._original = {
      html: host.innerHTML,
      className: host.getAttribute('class'),
      style: host.getAttribute('style'),
      id: host.getAttribute('id'),
      role: host.getAttribute('role'),
      tabIndex: host.getAttribute('tabindex'),
      ariaDisabled: host.getAttribute('aria-disabled'),
      ariaPressed: host.getAttribute('aria-pressed'),
      disabled: Boolean(host.disabled)
    };
    this._themeSource = host.parentElement || document.body;
    this.options = assignButtonOptions({}, FabButton.defaults, this._readElementOptions(), options || {});
    this.options.iconAlign = normalizeButtonIconAlign(this.options.iconAlign);
    this.options.size = normalizeButtonSize(this.options.size);
    initiallySelected = this.options.selected === true;
    this.options.selected = false;
    this._build();
    this._registerGroup();
    this._bind();
    host.__fabuiButton = this;
    registerControl(host, this);
    this.setTheme(this.options.theme);
    this._render();
    if (initiallySelected) this.select(true);
  }

  FabButton.prototype = Object.create(Control.prototype);
  FabButton.prototype.constructor = FabButton;

  FabButton.prototype._readElementOptions = function() {
    var host = this.hostElement;
    var options = {};
    var text = host.textContent == null ? '' : host.textContent.trim();
    var iconCls = host.getAttribute('iconCls') ||
      host.getAttribute('icon') ||
      host.getAttribute('data-icon-cls');
    var width = host.style.width;
    var height = host.style.height;
    var value;
    if (host.id) options.id = host.id;
    if (text) options.text = text;
    if (iconCls) options.iconCls = iconCls;
    if (width) options.width = width;
    if (height) options.height = height;
    if (host.disabled || host.hasAttribute('disabled')) options.disabled = true;
    value = host.getAttribute('data-icon-align');
    if (value) options.iconAlign = value;
    value = host.getAttribute('data-size');
    if (value) options.size = value;
    value = host.getAttribute('data-group');
    if (value) options.group = value;
    ['plain', 'outline', 'toggle', 'selected'].forEach(function(name) {
      var parsed = buttonBooleanAttribute(host, 'data-' + name);
      if (parsed != null) options[name] = parsed;
    });
    return options;
  };

  FabButton.prototype._build = function() {
    var host = this.hostElement;
    var inner = document.createElement('span');
    var text = document.createElement('span');
    var icon = document.createElement('span');
    host.textContent = '';
    host.classList.add('fui-button');
    if (this.options.cls) {
      String(this.options.cls).split(/\s+/).forEach(function(className) {
        if (className) host.classList.add(className);
      });
    }
    inner.className = 'fui-button-inner';
    text.className = 'fui-button-text';
    icon.className = 'fui-button-icon';
    icon.setAttribute('aria-hidden', 'true');
    inner.appendChild(icon);
    inner.appendChild(text);
    host.appendChild(inner);
    if (host.tagName === 'A' && !host.hasAttribute('href')) {
      host.setAttribute('role', 'button');
      if (!host.hasAttribute('tabindex')) host.tabIndex = 0;
    }
    this.innerElement = inner;
    this.textElement = text;
    this.iconElement = icon;
    this._enabledTabIndex = host.getAttribute('tabindex');
  };

  FabButton.prototype._bind = function() {
    var self = this;
    this._onClick = function(event) {
      var allowed;
      if (self.options.disabled) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (self.options.toggle) {
        if (self.options.selected) self.unselect();
        else self.select();
      }
      allowed = self._fire('Click', {
        originalEvent: event,
        selected: self.options.selected
      });
      if (allowed === false) event.preventDefault();
    };
    this._onKeyDown = function(event) {
      var isAnchor = self.hostElement.tagName === 'A';
      if (self.options.disabled) return;
      if (
        (event.key === ' ' && isAnchor) ||
        (event.key === 'Enter' && isAnchor && !self.hostElement.hasAttribute('href'))
      ) {
        event.preventDefault();
        self.hostElement.click();
      }
    };
    this.addEventListener(this.hostElement, 'click', this._onClick, true);
    this.addEventListener(this.hostElement, 'keydown', this._onKeyDown);
  };

  FabButton.prototype._registerGroup = function() {
    var group = this.options.group;
    if (!group) return;
    if (!groups[group]) groups[group] = new Set();
    groups[group].add(this);
  };

  FabButton.prototype._unregisterGroup = function() {
    var group = this.options.group;
    if (!group || !groups[group]) return;
    groups[group].delete(this);
    if (!groups[group].size) delete groups[group];
  };

  FabButton.prototype._render = function() {
    var host = this.hostElement;
    var hasText = this.options.text != null && String(this.options.text) !== '';
    host.classList.toggle('fui-button-plain', this.options.plain === true);
    host.classList.toggle('fui-button-outline', this.options.outline === true);
    host.classList.toggle('fui-button-selected', this.options.selected === true);
    host.classList.toggle('fui-button-disabled', this.options.disabled === true);
    host.classList.remove(
      'fui-button-size-small',
      'fui-button-size-large',
      'fui-button-icon-left',
      'fui-button-icon-right',
      'fui-button-icon-top',
      'fui-button-icon-bottom'
    );
    host.classList.add('fui-button-size-' + this.options.size);
    host.classList.add('fui-button-icon-' + this.options.iconAlign);
    this.textElement.textContent = hasText ? String(this.options.text) : '\u00a0';
    this.textElement.classList.toggle('fui-button-empty', !hasText);
    this.iconElement.className = ('fui-button-icon ' + (this.options.iconCls || '')).trim();
    this.iconElement.hidden = !this.options.iconCls;
    host.classList.toggle('fui-button-has-icon', Boolean(this.options.iconCls));
    host.classList.toggle('fui-button-icon-only', Boolean(this.options.iconCls) && !hasText);
    if (this.options.id != null) host.id = String(this.options.id);
    host.setAttribute('aria-disabled', this.options.disabled ? 'true' : 'false');
    if (this.options.toggle) {
      host.setAttribute('aria-pressed', this.options.selected ? 'true' : 'false');
    } else {
      host.removeAttribute('aria-pressed');
    }
    if ('disabled' in host) host.disabled = this.options.disabled === true;
    if (this.options.disabled) {
      host.tabIndex = -1;
    } else if (this._enabledTabIndex == null) {
      if (host.tagName === 'A' && !host.hasAttribute('href')) host.tabIndex = 0;
      else host.removeAttribute('tabindex');
    } else {
      host.setAttribute('tabindex', this._enabledTabIndex);
    }
    this.resize({
      width: this.options.width,
      height: this.options.height
    }, true);
    return this;
  };

  FabButton.prototype._setSelected = function(selected, silent) {
    if (this.options.selected === selected) return this;
    this.options.selected = selected;
    this.hostElement.classList.toggle('fui-button-selected', selected);
    if (this.options.toggle) this.hostElement.setAttribute('aria-pressed', selected ? 'true' : 'false');
    if (!silent) this._fire(selected ? 'Select' : 'Unselect', { selected: selected });
    return this;
  };

  FabButton.prototype._fire = function(name, detail) {
    var callback = this.options['on' + name];
    var listeners = (this._listeners[name.toLowerCase()] || []).slice();
    var args = assignButtonOptions({ button: this }, detail || {});
    var allowed = true;
    if (typeof callback === 'function' && callback.call(this.hostElement, this, args) === false) {
      allowed = false;
    }
    listeners.forEach(function(listener) {
      if (listener.call(this, args) === false) allowed = false;
    }, this);
    return allowed;
  };

  FabButton.prototype.resize = function(param, silent) {
    param = param || {};
    if (Object.prototype.hasOwnProperty.call(param, 'width')) this.options.width = param.width;
    if (Object.prototype.hasOwnProperty.call(param, 'height')) this.options.height = param.height;
    if (this.options.fit) {
      this.hostElement.style.width = '100%';
      this.hostElement.style.height = '100%';
    } else {
      this.hostElement.style.width = buttonSizeValue(this.options.width);
      this.hostElement.style.height = buttonSizeValue(this.options.height);
    }
    if (!silent) {
      this._fire('Resize', {
        width: this.options.width,
        height: this.options.height
      });
    }
    return this;
  };

  FabButton.prototype.disable = function() {
    if (this.options.disabled) return this;
    this.options.disabled = true;
    this._render();
    return this;
  };

  FabButton.prototype.enable = function() {
    if (!this.options.disabled) return this;
    this.options.disabled = false;
    this._render();
    return this;
  };

  FabButton.prototype.select = function(silent) {
    var self = this;
    var group = this.options.group;
    if (group && groups[group]) {
      groups[group].forEach(function(button) {
        if (button !== self && button.options.toggle) button._setSelected(false, silent);
      });
    }
    return this._setSelected(true, silent);
  };

  FabButton.prototype.unselect = function(silent) {
    if (this.options.group) return this;
    return this._setSelected(false, silent);
  };

  FabButton.prototype.setText = function(text) {
    this.options.text = text == null ? '' : String(text);
    return this._render();
  };

  FabButton.prototype.setIcon = function(iconCls, iconAlign) {
    this.options.iconCls = iconCls == null ? null : String(iconCls).trim();
    if (iconAlign != null) this.options.iconAlign = normalizeButtonIconAlign(iconAlign);
    return this._render();
  };

  FabButton.prototype.setTheme = function(theme) {
    var index;
    this.options.theme = theme == null ? 'inherit' : theme;
    this.theme = this.options.theme === 'inherit' ?
      findButtonTheme(this._themeSource) :
      normalizeButtonTheme(this.options.theme);
    for (index = 0; index < BUTTON_THEMES.length; index += 1) {
      this.hostElement.classList.remove('fg-theme-' + BUTTON_THEMES[index]);
    }
    this.hostElement.classList.add('fg-theme-' + this.theme);
    return this;
  };

  FabButton.prototype.on = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!name || typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  FabButton.prototype.off = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!this._listeners[name]) return this;
    this._listeners[name] = listener ?
      this._listeners[name].filter(function(item) { return item !== listener; }) :
      [];
    return this;
  };

  FabButton.prototype.destroy = function() {
    var host = this.hostElement;
    if (this._destroyed) return;
    this._destroyed = true;
    this._unregisterGroup();
    this.removeEventListener();
    unregisterControl(host, this);
    delete host.__fabuiButton;
    host.innerHTML = this._original.html;
    restoreButtonAttribute(host, 'class', this._original.className);
    restoreButtonAttribute(host, 'style', this._original.style);
    restoreButtonAttribute(host, 'id', this._original.id);
    restoreButtonAttribute(host, 'role', this._original.role);
    restoreButtonAttribute(host, 'tabindex', this._original.tabIndex);
    restoreButtonAttribute(host, 'aria-disabled', this._original.ariaDisabled);
    restoreButtonAttribute(host, 'aria-pressed', this._original.ariaPressed);
    if ('disabled' in host) host.disabled = this._original.disabled;
    this._listeners = {};
  };

  FabButton.prototype.dispose = FabButton.prototype.destroy;

  FabButton.defaults = {
    width: null,
    height: null,
    id: null,
    disabled: false,
    toggle: false,
    selected: false,
    group: null,
    plain: false,
    outline: false,
    text: '',
    iconCls: null,
    iconAlign: 'left',
    size: 'small',
    fit: false,
    cls: '',
    theme: 'inherit',
    onClick: null,
    onSelect: null,
    onUnselect: null,
    onResize: null
  };
  FabButton.getControl = function(element) {
    element = resolveButtonElement(element);
    return element && element.__fabuiButton ? element.__fabuiButton : null;
  };
  return FabButton;
}
