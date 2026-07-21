var MESSAGER_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];

function assignMessagerOptions(target) {
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

function messagerNumber(value, fallback) {
  value = Number(value);
  return isFinite(value) ? value : fallback;
}

function messagerSize(value, fallback) {
  return Math.max(0, messagerNumber(value, fallback));
}

function messagerCssPosition(value) {
  if (value == null || value === '') return '';
  return typeof value === 'number' ? value + 'px' : String(value);
}

export function normalizeMessagerLocale(value) {
  value = String(value || 'en').trim().replace(/_/g, '-');
  if (/^zh-(?:tw|hant)(?:-|$)/i.test(value)) return 'zh-TW';
  if (/^zh-(?:cn|hans)(?:-|$)/i.test(value)) return 'zh-CN';
  if (/^zh/i.test(value)) return 'zh-CN';
  return 'en';
}

export function normalizeMessagerIcon(value) {
  value = String(value || '').trim().toLowerCase();
  return ['error', 'question', 'info', 'warning'].indexOf(value) >= 0 ? value : '';
}

export function normalizeMessagerShowType(value) {
  value = String(value || 'slide').trim().toLowerCase();
  return ['slide', 'fade', 'show'].indexOf(value) >= 0 ? value : 'slide';
}

export function createMessagerFactory(Window, Button) {
  var localePacks = {
    en: {
      ok: 'Ok',
      cancel: 'Cancel',
      alert: 'Alert',
      confirm: 'Confirm',
      prompt: 'Prompt',
      progress: 'Please wait'
    },
    'zh-TW': {
      ok: '確定',
      cancel: '取消',
      alert: '提示',
      confirm: '確認',
      prompt: '輸入',
      progress: '請稍候'
    },
    'zh-CN': {
      ok: '确定',
      cancel: '取消',
      alert: '提示',
      confirm: '确认',
      prompt: '输入',
      progress: '请稍候'
    }
  };
  var dialogs = [];
  var toasts = [];
  var progressState = null;
  var toastResizeBound = false;

  if (typeof Window !== 'function' || typeof Button !== 'function') {
    throw new Error('fabui.Messager requires fabui.Window and fabui.Button.');
  }

  function localeMessages(options, callOptions) {
    var locale = normalizeMessagerLocale(options.locale);
    var pack = localePacks[locale];
    var defaults = Messager.defaults;
    var explicitOk = callOptions && Object.prototype.hasOwnProperty.call(callOptions, 'ok');
    var explicitCancel = callOptions && Object.prototype.hasOwnProperty.call(callOptions, 'cancel');
    return {
      ok: explicitOk || defaults.ok !== 'Ok' ? String(options.ok) : pack.ok,
      cancel: explicitCancel || defaults.cancel !== 'Cancel' ? String(options.cancel) : pack.cancel,
      alert: pack.alert,
      confirm: pack.confirm,
      prompt: pack.prompt,
      progress: pack.progress
    };
  }

  function normalizeCallOptions(type, title, msg, extra, fn) {
    var callOptions;
    var options;
    if (title && typeof title === 'object') {
      callOptions = assignMessagerOptions({}, title);
    } else {
      callOptions = {
        title: title,
        msg: msg
      };
      if (type === 'alert') {
        callOptions.icon = extra;
        callOptions.fn = fn;
      } else {
        callOptions.fn = extra;
      }
    }
    options = assignMessagerOptions({}, Messager.defaults, callOptions);
    options.locale = normalizeMessagerLocale(options.locale);
    options.theme = options.theme == null ? 'inherit' : options.theme;
    options.width = Math.max(240, messagerSize(options.width, 360));
    options.height = Math.max(130, messagerSize(options.height, 180));
    options.icon = normalizeMessagerIcon(options.icon);
    options.messages = localeMessages(options, callOptions);
    if (options.title == null || options.title === '') {
      options.title = options.messages[type] || '';
    }
    return options;
  }

  function createMessageContent(options, type) {
    var content = document.createElement('div');
    var icon;
    var message = document.createElement('div');
    var input;
    content.className = 'fui-messager-content fui-messager-content-' + type;
    if (options.icon) {
      content.classList.add('fui-messager-content-icon');
      icon = document.createElement('span');
      icon.className = 'fui-messager-icon icon-' + options.icon;
      icon.setAttribute('aria-hidden', 'true');
      content.appendChild(icon);
    }
    message.className = 'fui-messager-message';
    if (options.html === true) message.innerHTML = String(options.msg == null ? '' : options.msg);
    else message.textContent = options.msg == null ? '' : String(options.msg);
    content.appendChild(message);
    if (type === 'prompt') {
      input = document.createElement('input');
      input.type = options.inputType || 'text';
      input.className = 'fui-messager-input';
      input.value = options.value == null ? '' : String(options.value);
      input.placeholder = options.placeholder == null ? '' : String(options.placeholder);
      input.setAttribute('aria-label', options.inputLabel || options.msg || options.messages.prompt);
      content.appendChild(input);
    }
    return {
      element: content,
      input: input || null
    };
  }

  function createDialogButtons(options, type, resolve) {
    var footer = document.createElement('div');
    var buttons = [];
    var okElement = document.createElement('a');
    var cancelElement;
    footer.className = 'fui-messager-buttons';
    okElement.href = 'javascript:void(0)';
    footer.appendChild(okElement);
    buttons.push(new Button(okElement, {
      text: options.messages.ok,
      iconCls: options.okIconCls || 'icon-ok',
      theme: options.theme,
      onClick: function() {
        resolve(true);
      }
    }));
    if (type === 'confirm' || type === 'prompt') {
      cancelElement = document.createElement('a');
      cancelElement.href = 'javascript:void(0)';
      footer.appendChild(cancelElement);
      buttons.push(new Button(cancelElement, {
        text: options.messages.cancel,
        iconCls: options.cancelIconCls || 'icon-cancel',
        theme: options.theme,
        onClick: function() {
          resolve(false);
        }
      }));
    }
    return {
      element: footer,
      buttons: buttons
    };
  }

  function focusableElements(element) {
    return Array.prototype.filter.call(
      element.querySelectorAll('a[href]:not([aria-disabled="true"]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'),
      function(item) {
        return !item.hidden && item.offsetParent !== null;
      }
    );
  }

  function bindDialogKeyboard(state) {
    state.onKeyDown = function(event) {
      var focusable;
      var index;
      if (event.key === 'Escape' && state.options.closable !== false) {
        event.preventDefault();
        state.resolve(false);
        return;
      }
      if (event.key === 'Enter' && event.target.tagName !== 'BUTTON') {
        event.preventDefault();
        state.resolve(true);
        return;
      }
      if (event.key !== 'Tab') return;
      focusable = focusableElements(state.window.window());
      if (!focusable.length) return;
      index = focusable.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      } else if (!event.shiftKey && index === focusable.length - 1) {
        event.preventDefault();
        focusable[0].focus();
      }
    };
    state.window.window().addEventListener('keydown', state.onKeyDown);
  }

  function destroyTransientWindow(state) {
    state.window.destroy(true);
    if (state.host && state.host.parentNode) {
      state.host.parentNode.removeChild(state.host);
    }
  }

  function removeDialog(state) {
    var index = dialogs.indexOf(state);
    if (index >= 0) dialogs.splice(index, 1);
    state.window.window().removeEventListener('keydown', state.onKeyDown);
    state.buttons.forEach(function(button) {
      button.destroy();
    });
    destroyTransientWindow(state);
  }

  function createDialog(type, title, msg, extra, fn) {
    var options = normalizeCallOptions(type, title, msg, extra, fn);
    var content = createMessageContent(options, type);
    var host = document.createElement('div');
    var state = {
      type: type,
      options: options,
      input: content.input,
      settled: false,
      buttons: [],
      host: host,
      window: null,
      resolve: null
    };
    var footer;
    host.className = 'fui-messager-host';
    host.appendChild(content.element);
    document.body.appendChild(host);
    state.resolve = function(accepted) {
      var value;
      if (state.settled) return;
      state.settled = true;
      if (type === 'prompt') {
        value = accepted ? state.input.value : null;
      } else if (type === 'confirm') {
        value = accepted === true;
      }
      try {
        if (typeof options.fn === 'function') {
          if (type === 'alert') {
            if (accepted) options.fn();
          } else {
            options.fn(value);
          }
        }
      } finally {
        state.window.close(true);
      }
    };
    footer = createDialogButtons(options, type, state.resolve);
    state.buttons = footer.buttons;
    state.window = new Window(host, {
      title: options.title,
      iconCls: options.windowIconCls || '',
      width: options.width,
      height: options.height,
      minWidth: Math.min(options.width, options.minWidth || 240),
      minHeight: Math.min(options.height, options.minHeight || 130),
      modal: options.modal !== false,
      draggable: options.draggable !== false,
      resizable: options.resizable === true,
      maximizable: false,
      minimizable: false,
      collapsible: false,
      closable: options.closable !== false,
      constrain: true,
      fixed: true,
      footer: footer.element,
      theme: options.theme,
      locale: options.locale,
      animate: options.animate !== false,
      animationDuration: options.animationDuration,
      onClose: function() {
        if (!state.settled) {
          state.settled = true;
          if (typeof options.fn === 'function' && type === 'confirm') options.fn(false);
          if (typeof options.fn === 'function' && type === 'prompt') options.fn(null);
        }
        if (typeof options.onClose === 'function') options.onClose(state.window);
        removeDialog(state);
      }
    });
    state.window.window().classList.add('fui-messager-dialog', 'fui-messager-' + type);
    state.window.messager = state;
    state.window.closeMessage = state.resolve;
    dialogs.push(state);
    bindDialogKeyboard(state);
    state.window.center();
    if (state.input) state.input.focus();
    else if (state.buttons[0]) state.buttons[0].hostElement.focus();
    return state.window;
  }

  function bindToastResize() {
    if (toastResizeBound || typeof window === 'undefined') return;
    window.addEventListener('resize', positionToasts);
    toastResizeBound = true;
  }

  function unbindToastResize() {
    if (!toastResizeBound || toasts.length) return;
    window.removeEventListener('resize', positionToasts);
    toastResizeBound = false;
  }

  function positionToast(state, index) {
    var style = state.options.style || {};
    var element = state.window.window();
    var gap = messagerNumber(state.options.gap, 10);
    var bottom = messagerNumber(style.bottom, 16);
    var offset = 0;
    var itemIndex;
    if (state.options._customPosition) {
      ['left', 'right', 'top', 'bottom'].forEach(function(name) {
        if (Object.prototype.hasOwnProperty.call(style, name)) {
          element.style[name] = messagerCssPosition(style[name]);
        }
      });
      return;
    }
    for (itemIndex = 0; itemIndex < index; itemIndex += 1) {
      if (!toasts[itemIndex].options._customPosition) {
        offset += toasts[itemIndex].options.height + gap;
      }
    }
    element.style.left = 'auto';
    element.style.top = 'auto';
    element.style.right = messagerCssPosition(
      Object.prototype.hasOwnProperty.call(style, 'right') ? style.right : 16
    );
    element.style.bottom = messagerCssPosition(bottom + offset);
  }

  function positionToasts() {
    toasts.forEach(positionToast);
  }

  function removeToast(state) {
    var index = toasts.indexOf(state);
    if (state.timer != null) clearTimeout(state.timer);
    if (index >= 0) toasts.splice(index, 1);
    destroyTransientWindow(state);
    positionToasts();
    unbindToastResize();
  }

  function showToast(input) {
    var callOptions = input && typeof input === 'object' ? input : { msg: input };
    var options = assignMessagerOptions({}, Messager.showDefaults, callOptions);
    var host = document.createElement('div');
    var state;
    options.theme = options.theme == null ? Messager.defaults.theme : options.theme;
    options.locale = normalizeMessagerLocale(options.locale || Messager.defaults.locale);
    options.width = Math.max(160, messagerSize(options.width, 250));
    options.height = Math.max(70, messagerSize(options.height, 100));
    options.timeout = Math.max(0, messagerNumber(options.timeout, 4000));
    options.showSpeed = Math.max(0, messagerNumber(options.showSpeed, 600));
    options.showType = normalizeMessagerShowType(options.showType);
    options._customPosition = options.style && (
      Object.prototype.hasOwnProperty.call(options.style, 'left') ||
      Object.prototype.hasOwnProperty.call(options.style, 'top')
    );
    host.className = 'fui-messager-host fui-messager-toast-host';
    if (options.html === true) host.innerHTML = String(options.msg == null ? '' : options.msg);
    else host.textContent = options.msg == null ? '' : String(options.msg);
    document.body.appendChild(host);
    state = {
      type: 'show',
      options: options,
      host: host,
      timer: null,
      window: null
    };
    state.window = new Window(host, {
      title: options.title || '',
      width: options.width,
      height: options.height,
      modal: false,
      draggable: options.draggable === true,
      resizable: false,
      maximizable: false,
      minimizable: false,
      collapsible: false,
      closable: options.closable !== false,
      constrain: false,
      fixed: true,
      theme: options.theme,
      locale: options.locale,
      animate: false,
      onClose: function() {
        if (typeof options.onClose === 'function') options.onClose(state.window);
        removeToast(state);
      }
    });
    state.window.window().classList.add(
      'fui-messager-toast',
      'fui-messager-toast-' + options.showType
    );
    state.window.window().style.setProperty('--fui-messager-show-speed', options.showSpeed + 'ms');
    state.window.messager = state;
    toasts.push(state);
    bindToastResize();
    positionToasts();
    if (options.timeout > 0) {
      state.timer = setTimeout(function() {
        state.timer = null;
        state.window.close(true);
      }, options.timeout);
    }
    return state.window;
  }

  function createProgressBar(options) {
    var wrapper = document.createElement('div');
    var track = document.createElement('div');
    var value = document.createElement('div');
    var text = document.createElement('div');
    var current = options.value == null ? null : Math.max(0, Math.min(100, Number(options.value)));
    wrapper.className = 'fui-messager-progress';
    track.className = 'fui-messager-progress-track';
    value.className = 'fui-messager-progress-value';
    text.className = 'fui-messager-progress-text';
    track.appendChild(value);
    track.appendChild(text);
    wrapper.appendChild(track);
    function render() {
      var label = options.text;
      track.classList.toggle('fui-messager-progress-indeterminate', current == null);
      value.style.width = current == null ? '35%' : current + '%';
      if (typeof label === 'function') label = label(current);
      if (label == null) label = current == null ? '' : Math.round(current) + '%';
      text.textContent = String(label);
    }
    render();
    return {
      element: wrapper,
      getValue: function() {
        return current;
      },
      setValue: function(next) {
        current = next == null ? null : Math.max(0, Math.min(100, Number(next)));
        render();
        return this;
      },
      setText: function(next) {
        options.text = next;
        render();
        return this;
      }
    };
  }

  function showProgress(input) {
    var callOptions = input && typeof input === 'object' ? input : {};
    var options;
    var messages;
    var host;
    var message;
    var bar;
    if (progressState) return progressState.window;
    options = assignMessagerOptions({}, Messager.progressDefaults, {
      theme: Messager.defaults.theme,
      locale: Messager.defaults.locale
    }, callOptions);
    options.locale = normalizeMessagerLocale(options.locale);
    options.interval = Math.max(0, messagerNumber(options.interval, 300));
    messages = localeMessages(options, callOptions);
    if (options.title == null || options.title === '') options.title = messages.progress;
    options.width = Math.max(260, messagerSize(options.width, 360));
    options.height = Math.max(120, messagerSize(options.height, 150));
    host = document.createElement('div');
    host.className = 'fui-messager-host fui-messager-progress-host';
    message = document.createElement('div');
    message.className = 'fui-messager-progress-message';
    message.textContent = options.msg == null ? '' : String(options.msg);
    bar = createProgressBar(options);
    host.appendChild(message);
    host.appendChild(bar.element);
    document.body.appendChild(host);
    progressState = {
      type: 'progress',
      options: options,
      host: host,
      bar: bar,
      timer: null,
      window: null
    };
    progressState.window = new Window(host, {
      title: options.title,
      width: options.width,
      height: options.height,
      modal: options.modal !== false,
      draggable: options.draggable !== false,
      resizable: false,
      maximizable: false,
      minimizable: false,
      collapsible: false,
      closable: options.closable === true,
      constrain: true,
      fixed: true,
      theme: options.theme,
      locale: options.locale,
      animate: options.animate !== false,
      animationDuration: options.animationDuration,
      onClose: function() {
        var state = progressState;
        progressState = null;
        if (state) {
          if (state.timer != null) clearInterval(state.timer);
          destroyTransientWindow(state);
        }
        if (typeof options.onClose === 'function') options.onClose();
      }
    });
    progressState.window.window().classList.add('fui-messager-dialog', 'fui-messager-progress-window');
    progressState.window.messager = progressState;
    progressState.window.center();
    if (options.interval > 0 && bar.getValue() != null) {
      progressState.timer = setInterval(function() {
        var value = bar.getValue() + 10;
        bar.setValue(value > 100 ? 0 : value);
      }, options.interval);
    }
    return progressState.window;
  }

  var Messager = {
    defaults: {
      ok: 'Ok',
      cancel: 'Cancel',
      width: 360,
      height: 180,
      minWidth: 240,
      minHeight: 130,
      modal: true,
      draggable: true,
      resizable: false,
      closable: true,
      animate: true,
      animationDuration: 180,
      theme: 'inherit',
      locale: 'en',
      html: false
    },
    showDefaults: {
      showType: 'slide',
      showSpeed: 600,
      width: 250,
      height: 100,
      title: '',
      msg: '',
      style: {
        right: 16,
        bottom: 16
      },
      gap: 10,
      timeout: 4000,
      closable: true,
      draggable: false,
      html: false
    },
    progressDefaults: {
      title: '',
      msg: '',
      text: null,
      interval: 300,
      width: 360,
      height: 150,
      value: 0,
      modal: true,
      closable: false
    },
    locales: localePacks,
    themes: MESSAGER_THEMES.slice(),
    normalizeLocale: normalizeMessagerLocale,
    show: showToast,
    alert: function(title, msg, icon, fn) {
      if (typeof icon === 'function' && fn == null) {
        fn = icon;
        icon = '';
      }
      return createDialog('alert', title, msg, icon, fn);
    },
    confirm: function(title, msg, fn) {
      return createDialog('confirm', title, msg, fn);
    },
    prompt: function(title, msg, fn) {
      return createDialog('prompt', title, msg, fn);
    },
    progress: function(options) {
      if (typeof options === 'string') {
        if (options === 'bar') return progressState ? progressState.bar : null;
        if (options === 'close') {
          if (progressState) progressState.window.close(true);
          return null;
        }
      }
      return showProgress(options);
    },
    close: function(handle, result) {
      if (!handle) return Messager;
      if (handle.messager && typeof handle.messager.resolve === 'function') {
        handle.messager.resolve(result === true);
      } else if (typeof handle.close === 'function') {
        handle.close(true);
      }
      return Messager;
    },
    closeAll: function() {
      dialogs.slice().forEach(function(state) {
        state.resolve(false);
      });
      toasts.slice().forEach(function(state) {
        state.window.close(true);
      });
      if (progressState) progressState.window.close(true);
      return Messager;
    },
    setTheme: function(theme) {
      Messager.defaults.theme = theme == null ? 'inherit' : theme;
      dialogs.forEach(function(state) {
        state.options.theme = Messager.defaults.theme;
        state.window.setTheme(Messager.defaults.theme);
        state.buttons.forEach(function(button) {
          button.setTheme(Messager.defaults.theme);
        });
      });
      toasts.forEach(function(state) {
        state.window.setTheme(Messager.defaults.theme);
      });
      if (progressState) progressState.window.setTheme(Messager.defaults.theme);
      return Messager;
    },
    setLocale: function(locale) {
      Messager.defaults.locale = normalizeMessagerLocale(locale);
      return Messager;
    },
    activeDialogs: function() {
      return dialogs.map(function(state) {
        return state.window;
      });
    },
    activeToasts: function() {
      return toasts.map(function(state) {
        return state.window;
      });
    }
  };

  return Messager;
}
