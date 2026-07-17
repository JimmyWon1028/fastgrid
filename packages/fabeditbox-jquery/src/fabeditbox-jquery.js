var DATA_KEY = 'fabui.fabeditbox';
var EVENT_NAMESPACE = '.fabeditbox';
var EDITBOX_EVENTS = [
  'change',
  'resize',
  'iconClick',
  'buttonClick',
  'select',
  'unselect',
  'click',
  'loadSuccess',
  'loadError',
  'showPanel',
  'hidePanel'
];

function assign(target) {
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

function splitTopLevel(value, delimiter) {
  var parts = [];
  var start = 0;
  var depth = 0;
  var quote = '';
  var escaped = false;
  var index;
  var character;
  for (index = 0; index < value.length; index += 1) {
    character = value.charAt(index);
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = '';
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '[' || character === '{' || character === '(') {
      depth += 1;
    } else if (character === ']' || character === '}' || character === ')') {
      depth = Math.max(0, depth - 1);
    } else if (character === delimiter && depth === 0) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

function findTopLevelColon(value) {
  var parts = splitTopLevel(value, ':');
  return parts.length > 1 ? parts[0].length : -1;
}

function unquote(value) {
  var quote = value.charAt(0);
  var body = value.slice(1, -1);
  return body.replace(/\\(.)/g, function(match, character) {
    if (character === 'n') return '\n';
    if (character === 'r') return '\r';
    if (character === 't') return '\t';
    return character;
  }).replace(new RegExp('\\\\' + quote, 'g'), quote);
}

function parseDataOptionValue(value) {
  var text = String(value == null ? '' : value).trim();
  var number;
  if (!text) return '';
  if (
    (text.charAt(0) === '"' && text.charAt(text.length - 1) === '"') ||
    (text.charAt(0) === "'" && text.charAt(text.length - 1) === "'")
  ) {
    return unquote(text);
  }
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (text === 'null') return null;
  if (/^-?(?:\d+|\d*\.\d+)$/.test(text)) {
    number = Number(text);
    return isNaN(number) ? text : number;
  }
  if (text.charAt(0) === '[' && text.charAt(text.length - 1) === ']') {
    text = text.slice(1, -1).trim();
    return text ? splitTopLevel(text, ',').map(parseDataOptionValue) : [];
  }
  if (text.charAt(0) === '{' && text.charAt(text.length - 1) === '}') {
    return parseFabEditBoxDataOptions(text);
  }
  return text;
}

export function parseFabEditBoxDataOptions(value) {
  var text = String(value == null ? '' : value).trim();
  var options = {};
  if (text.charAt(0) === '{' && text.charAt(text.length - 1) === '}') {
    text = text.slice(1, -1);
  }
  splitTopLevel(text, ',').forEach(function(entry) {
    var colon = findTopLevelColon(entry);
    var key;
    if (colon < 0) return;
    key = entry.slice(0, colon).trim();
    if (
      (key.charAt(0) === '"' && key.charAt(key.length - 1) === '"') ||
      (key.charAt(0) === "'" && key.charAt(key.length - 1) === "'")
    ) {
      key = unquote(key);
    }
    if (!key || key === '__proto__' || key === 'prototype' || key === 'constructor') {
      return;
    }
    options[key] = parseDataOptionValue(entry.slice(colon + 1));
  });
  return options;
}

function hasClass(element, name) {
  var className;
  if (!element) return false;
  if (element.classList && typeof element.classList.contains === 'function') {
    return element.classList.contains(name);
  }
  className = String(element.className || '');
  return (' ' + className + ' ').indexOf(' ' + name + ' ') >= 0;
}

function getDeclarativeEditor(element) {
  if (hasClass(element, 'fab-textbox')) return 'text';
  if (hasClass(element, 'fab-numberbox')) return 'number';
  if (hasClass(element, 'fab-datebox')) return 'date';
  if (hasClass(element, 'fab-combobox')) return 'combo';
  if (hasClass(element, 'fab-colorbox')) return 'color';
  return '';
}

function normalizeEasyUiOptions(options) {
  var normalized = assign({}, options || {});
  if (Object.prototype.hasOwnProperty.call(normalized, 'iconCls')) {
    normalized.icons = normalized.iconCls ? [{
      iconCls: normalized.iconCls,
      align: normalized.iconAlign === 'left' ? 'left' : 'right',
      width: normalized.iconWidth
    }] : [];
  }
  return normalized;
}

function mergeEasyUiOptions(base, override) {
  var merged = assign({}, base || {}, override || {});
  if (
    Object.prototype.hasOwnProperty.call(override || {}, 'icons') &&
    !Object.prototype.hasOwnProperty.call(override || {}, 'iconCls')
  ) {
    delete merged.iconCls;
  }
  return normalizeEasyUiOptions(merged);
}

function getDeclarativeOptions(element) {
  var options = parseFabEditBoxDataOptions(
    element && element.getAttribute ? element.getAttribute('data-options') : ''
  );
  var editor = getDeclarativeEditor(element);
  var style = element && element.style || {};
  if (editor && options.editor == null) options.editor = editor;
  if (options.width == null && style.width) options.width = style.width;
  if (options.height == null && style.height) options.height = style.height;
  return normalizeEasyUiOptions(options);
}

export function toFabEditBoxJQueryEventName(value) {
  return String(value || '').toLowerCase();
}

export function isFabEditBoxPublicMethod(instance, name) {
  return Boolean(
    instance &&
    typeof name === 'string' &&
    name.charAt(0) !== '_' &&
    typeof instance[name] === 'function'
  );
}

export function createFabEditBoxJQuery($, fabui) {
  if (!$ || !$.fn) throw new Error('fabeditbox-jquery requires jQuery.');
  if (!fabui || typeof fabui.EditBox !== 'function') {
    throw new Error('fabeditbox-jquery requires fabui.EditBox.');
  }

  function getInstance(element) {
    return $.data(element, DATA_KEY);
  }

  function setInstance(element, instance) {
    $.data(element, DATA_KEY, instance);
  }

  function removeInstance(element) {
    $.removeData(element, DATA_KEY);
  }

  function triggerLifecycle(element, name, instance) {
    $(element).triggerHandler(name + EVENT_NAMESPACE, [instance]);
  }

  function bindEvents(element, instance) {
    var bindings = [];
    if (typeof instance.on !== 'function') return;
    EDITBOX_EVENTS.forEach(function(name) {
      var handler = function(detail) {
        $(element).triggerHandler(
          toFabEditBoxJQueryEventName(name) + EVENT_NAMESPACE,
          [detail || {}, instance]
        );
      };
      instance.on(name, handler);
      bindings.push({ name: name, handler: handler });
    });
    instance.__fabeditboxJQueryBindings = bindings;
  }

  function unbindEvents(instance) {
    var bindings = instance && instance.__fabeditboxJQueryBindings || [];
    if (instance && typeof instance.off === 'function') {
      bindings.forEach(function(binding) {
        instance.off(binding.name, binding.handler);
      });
    }
    if (instance) delete instance.__fabeditboxJQueryBindings;
  }

  function create(element, options, lifecycle) {
    var resolvedOptions = mergeEasyUiOptions(getDeclarativeOptions(element), options);
    var instance = new fabui.EditBox(element, resolvedOptions);
    instance.__fabeditboxJQueryOptions = assign({}, resolvedOptions);
    if (
      instance.__fabeditboxJQueryOptions.editor == null &&
      typeof instance.getEditorType === 'function'
    ) {
      instance.__fabeditboxJQueryOptions.editor = instance.getEditorType();
    }
    setInstance(element, instance);
    bindEvents(element, instance);
    if (lifecycle !== false) triggerLifecycle(element, 'initialized', instance);
    return instance;
  }

  function disposeInstance(instance) {
    if (!instance) return;
    unbindEvents(instance);
    if (typeof instance.dispose === 'function') instance.dispose();
    else if (typeof instance.destroy === 'function') instance.destroy();
  }

  function destroy(element, instance) {
    if (!instance) return;
    disposeInstance(instance);
    removeInstance(element);
    triggerLifecycle(element, 'destroyed', instance);
  }

  function getOptions(instance) {
    var liveOptions = instance && typeof instance.options === 'function' ?
      instance.options() || {} :
      {};
    return assign(
      {},
      instance && instance.__fabeditboxJQueryOptions || {},
      liveOptions
    );
  }

  function recreate(element, instance, options) {
    var currentOptions = mergeEasyUiOptions(
      getDeclarativeOptions(element),
      getOptions(instance)
    );
    var nextOptions = mergeEasyUiOptions(currentOptions, options);
    disposeInstance(instance);
    return create(element, nextOptions, false);
  }

  function getOption(instance, name) {
    return getOptions(instance)[name];
  }

  function plugin(command) {
    var args = Array.prototype.slice.call(arguments, 1);
    var first = this[0];
    var result;

    if (typeof command !== 'string') {
      return this.each(function() {
        var current = getInstance(this);
        if (current) recreate(this, current, command || {});
        else create(this, command || {});
      });
    }

    if (command === 'instance') return first ? getInstance(first) : undefined;
    if (command === 'option' && args.length === 1 && typeof args[0] === 'string') {
      return first && getInstance(first) ? getOption(getInstance(first), args[0]) : undefined;
    }

    this.each(function() {
      var current = getInstance(this);
      var methodResult;
      var patch;
      if (!current) {
        throw new Error('Cannot call fabeditbox method before initialization: ' + command);
      }
      if (command === 'destroy') {
        destroy(this, current);
        return;
      }
      if (command === 'option') {
        patch = typeof args[0] === 'string' ? {} : args[0] || {};
        if (typeof args[0] === 'string') patch[args[0]] = args[1];
        recreate(this, current, patch);
        return;
      }
      if (!isFabEditBoxPublicMethod(current, command)) {
        throw new Error('Unknown or private fabeditbox method: ' + command);
      }
      methodResult = current[command].apply(current, args);
      if (methodResult !== undefined && methodResult !== current) result = methodResult;
    });

    return result === undefined ? this : result;
  }

  function findDeclarativeElements(context) {
    var selector = [
      '.fab-editbox',
      '.fab-textbox',
      '.fab-numberbox',
      '.fab-datebox',
      '.fab-combobox',
      '.fab-colorbox'
    ].join(',');
    var elements = [];
    if (context && context.matches && context.matches(selector)) elements.push(context);
    if (context && context.querySelectorAll) {
      elements = elements.concat(Array.prototype.slice.call(context.querySelectorAll(selector)));
    }
    return elements;
  }

  function parse(context) {
    var root = context || (typeof document !== 'undefined' ? document : null);
    var elements = findDeclarativeElements(root);
    elements.forEach(function(element) {
      if (!getInstance(element)) create(element, getDeclarativeOptions(element));
    });
    return $(elements);
  }

  $.fn.fabeditbox = plugin;
  $.fn.fabeditbox.parse = parse;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        parse(document);
      }, { once: true });
    } else {
      parse(document);
    }
  }

  return {
    dataKey: DATA_KEY,
    eventNamespace: EVENT_NAMESPACE,
    events: EDITBOX_EVENTS.slice(),
    getInstance: getInstance,
    parse: parse,
    destroy: function(element) {
      destroy(element, getInstance(element));
    }
  };
}

export default createFabEditBoxJQuery;
