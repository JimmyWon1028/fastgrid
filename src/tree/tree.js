var TREE_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];

function treeAssign(target) {
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

function treeBoolean(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    value = value.trim().toLowerCase();
    if (value === 'false' || value === '0' || value === 'no') return false;
    if (value === 'true' || value === '1' || value === 'yes' || value === '') return true;
  }
  return Boolean(value);
}

function treeNumber(value, fallback) {
  value = Number(value);
  return isFinite(value) ? value : fallback;
}

function resolveTreeElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function normalizeTreeLocale(value) {
  value = String(value || 'en').trim().replace(/_/g, '-');
  if (/^zh-(?:TW|Hant)(?:-|$)/i.test(value)) return 'zh-TW';
  if (/^zh-(?:CN|Hans)(?:-|$)/i.test(value) || /^zh$/i.test(value)) return 'zh-CN';
  return 'en';
}

export function normalizeTreeTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return TREE_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

function findTreeTheme(element) {
  var current = resolveTreeElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < TREE_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + TREE_THEMES[index])) {
        return TREE_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

function copyTreeNode(source, parent, sequence) {
  var node = {};
  var key;
  var children;
  var index;
  source = source && typeof source === 'object' ? source : { text: source };
  for (key in source) {
    if (
      Object.prototype.hasOwnProperty.call(source, key) &&
      key !== 'children' &&
      key !== 'target' &&
      key.charAt(0) !== '_'
    ) {
      node[key] = source[key];
    }
  }
  node.id = source.id != null ? source.id : 'fui-tree-node-' + sequence.value;
  sequence.value += 1;
  node.text = source.text == null ? '' : String(source.text);
  node.state = String(source.state || 'open').toLowerCase() === 'closed' ? 'closed' : 'open';
  node.checked = source.checked === true;
  node.attributes = source.attributes && typeof source.attributes === 'object' ?
    treeAssign({}, source.attributes) :
    {};
  node.children = [];
  node._parent = parent || null;
  node._loaded = source._loaded !== false;
  node._loading = false;
  node._hidden = false;
  node._matched = true;
  node._checkState = node.checked ? 'checked' : 'unchecked';
  node.target = null;
  children = Array.isArray(source.children) ? source.children : [];
  for (index = 0; index < children.length; index += 1) {
    node.children.push(copyTreeNode(children[index], node, sequence));
  }
  if (!children.length && node.state === 'closed' && source.children == null) {
    node._loaded = false;
  }
  return node;
}

export function normalizeTreeData(data) {
  var sequence = { value: 1 };
  return (Array.isArray(data) ? data : []).map(function(item) {
    return copyTreeNode(item, null, sequence);
  });
}

export function flattenTreeData(roots, visibleOnly) {
  var result = [];
  function visit(nodes, level) {
    nodes.forEach(function(node) {
      if (!node._hidden) {
        result.push({ node: node, level: level });
        if (!visibleOnly || node.state !== 'closed') visit(node.children || [], level + 1);
      }
    });
  }
  visit(Array.isArray(roots) ? roots : [], 1);
  return result;
}

function getNodeCollection(roots, node) {
  return node && node._parent ? node._parent.children : roots;
}

function isTreeDescendant(node, possibleAncestor) {
  var current = node;
  while (current) {
    if (current === possibleAncestor) return true;
    current = current._parent;
  }
  return false;
}

export function moveTreeDataNode(roots, source, target, point) {
  var sourceCollection;
  var targetCollection;
  var sourceIndex;
  var targetIndex;
  if (!source || !target || source === target || isTreeDescendant(target, source)) return false;
  point = point === 'top' || point === 'before' ?
    'before' :
    point === 'bottom' || point === 'after' ? 'after' : 'append';
  sourceCollection = getNodeCollection(roots, source);
  sourceIndex = sourceCollection.indexOf(source);
  if (sourceIndex < 0) return false;
  sourceCollection.splice(sourceIndex, 1);
  if (point === 'append') {
    target.children.push(source);
    source._parent = target;
    target.state = 'open';
    target._loaded = true;
    return true;
  }
  targetCollection = getNodeCollection(roots, target);
  targetIndex = targetCollection.indexOf(target);
  if (targetIndex < 0) {
    sourceCollection.splice(sourceIndex, 0, source);
    return false;
  }
  if (point === 'after') targetIndex += 1;
  targetCollection.splice(targetIndex, 0, source);
  source._parent = target._parent || null;
  return true;
}

export function createTreeFactory(Control, registerControl, unregisterControl) {
  var defaults = {
    url: null,
    method: 'post',
    animate: false,
    checkbox: false,
    cascadeCheck: true,
    onlyLeafCheck: false,
    lines: false,
    dnd: false,
    data: null,
    queryParams: {},
    formatter: null,
    filter: null,
    loader: null,
    loadFilter: null,
    locale: 'en',
    theme: 'inherit',
    ariaLabel: '',
    onClick: null,
    onDblClick: null,
    onBeforeLoad: null,
    onLoadSuccess: null,
    onLoadError: null,
    onBeforeExpand: null,
    onExpand: null,
    onBeforeCollapse: null,
    onCollapse: null,
    onBeforeCheck: null,
    onCheck: null,
    onBeforeSelect: null,
    onSelect: null,
    onContextMenu: null,
    onBeforeDrag: null,
    onStartDrag: null,
    onStopDrag: null,
    onDragEnter: null,
    onDragOver: null,
    onDragLeave: null,
    onBeforeDrop: null,
    onDrop: null,
    onBeforeEdit: null,
    onAfterEdit: null,
    onCancelEdit: null
  };
  var localePacks = {
    en: {
      tree: 'Tree',
      expand: 'Expand {text}',
      collapse: 'Collapse {text}',
      check: 'Check {text}',
      uncheck: 'Uncheck {text}',
      loading: 'Loading',
      edit: 'Edit {text}'
    },
    'zh-TW': {
      tree: '樹狀清單',
      expand: '展開{text}',
      collapse: '收合{text}',
      check: '勾選{text}',
      uncheck: '取消勾選{text}',
      loading: '載入中',
      edit: '編輯{text}'
    },
    'zh-CN': {
      tree: '树状列表',
      expand: '展开{text}',
      collapse: '收起{text}',
      check: '勾选{text}',
      uncheck: '取消勾选{text}',
      loading: '加载中',
      edit: '编辑{text}'
    }
  };

  function formatTreeText(text, values) {
    return String(text || '').replace(/\{([^}]+)\}/g, function(match, key) {
      return values && values[key] != null ? values[key] : match;
    });
  }

  function restoreTreeAttribute(element, name, value) {
    if (value == null) element.removeAttribute(name);
    else element.setAttribute(name, value);
  }

  function readMarkupData(host) {
    var sequence = { value: 1 };
    function directChildren(element, tagName) {
      return Array.prototype.filter.call(element.children || [], function(child) {
        return child.tagName === tagName;
      });
    }
    function readList(list, parent) {
      return directChildren(list, 'LI').map(function(item) {
        var nested = directChildren(item, 'UL')[0] || null;
        var label = directChildren(item, 'SPAN')[0] || null;
        var source = {};
        var node;
        source.id = item.getAttribute('data-id') || item.id || undefined;
        source.text = label ? label.textContent.trim() : Array.prototype.reduce.call(
          item.childNodes,
          function(text, child) {
            return child.nodeType === 3 ? text + child.nodeValue : text;
          },
          ''
        ).trim();
        source.state = item.getAttribute('data-state') || item.getAttribute('state') || 'open';
        source.checked = treeBoolean(
          item.getAttribute('data-checked') || item.getAttribute('checked'),
          false
        );
        source.iconCls = item.getAttribute('data-icon-cls') || item.getAttribute('iconCls') || '';
        node = copyTreeNode(source, parent, sequence);
        if (nested) {
          node.children = readList(nested, node);
          node._loaded = true;
        }
        return node;
      });
    }
    return readList(host, null);
  }

  function FabTree(element, options) {
    var markupData;
    if (!(this instanceof FabTree)) return new FabTree(element, options);
    this.hostElement = resolveTreeElement(element);
    if (!this.hostElement) throw new Error('fabui.Tree requires a host element.');
    if (this.hostElement.__fabuiTree) return this.hostElement.__fabuiTree;
    Control.call(this);
    this._listeners = {};
    this._selectedNode = null;
    this._editingNode = null;
    this._dragNode = null;
    this._dragTarget = null;
    this._dragPoint = null;
    this._destroyed = false;
    this._loadSequence = 0;
    this._themeSource = this.hostElement.parentElement || document.body;
    this._original = {
      html: this.hostElement.innerHTML,
      className: this.hostElement.getAttribute('class'),
      style: this.hostElement.getAttribute('style'),
      role: this.hostElement.getAttribute('role'),
      tabIndex: this.hostElement.getAttribute('tabindex'),
      ariaLabel: this.hostElement.getAttribute('aria-label')
    };
    this._options = treeAssign({}, defaults, this._readElementOptions(), options || {});
    this._normalizeOptions();
    markupData = readMarkupData(this.hostElement);
    this._roots = normalizeTreeData(
      Array.isArray(this._options.data) ? this._options.data : markupData
    );
    this._syncAllCheckStates();
    this._build();
    this._bind();
    this.render();
    this.hostElement.__fabuiTree = this;
    registerControl(this.hostElement, this);
    this.setTheme(this._options.theme);
    if (!this._roots.length && (this._options.url || this._options.loader)) this.reload();
  }

  FabTree.prototype = Object.create(Control.prototype);
  FabTree.prototype.constructor = FabTree;

  FabTree.prototype._readElementOptions = function() {
    var host = this.hostElement;
    var result = {};
    var value;
    value = host.getAttribute('data-theme') || host.getAttribute('theme');
    if (value) result.theme = value;
    value = host.getAttribute('data-locale') || host.getAttribute('locale');
    if (value) result.locale = value;
    value = host.getAttribute('data-url') || host.getAttribute('url');
    if (value) result.url = value;
    value = host.getAttribute('aria-label');
    if (value) result.ariaLabel = value;
    ['animate', 'checkbox', 'cascadeCheck', 'onlyLeafCheck', 'lines', 'dnd'].forEach(function(name) {
      var attribute = host.getAttribute('data-' + name.replace(/[A-Z]/g, function(letter) {
        return '-' + letter.toLowerCase();
      }));
      if (attribute == null) attribute = host.getAttribute(name);
      if (attribute != null) result[name] = treeBoolean(attribute, false);
    });
    return result;
  };

  FabTree.prototype._normalizeOptions = function() {
    this._options.animate = treeBoolean(this._options.animate, false);
    this._options.cascadeCheck = treeBoolean(this._options.cascadeCheck, true);
    this._options.onlyLeafCheck = treeBoolean(this._options.onlyLeafCheck, false);
    this._options.lines = treeBoolean(this._options.lines, false);
    this._options.dnd = treeBoolean(this._options.dnd, false);
    this._options.locale = normalizeTreeLocale(this._options.locale);
    this._options.method = String(this._options.method || 'post').toLowerCase();
  };

  FabTree.prototype._getText = function(key, values) {
    return formatTreeText(
      (localePacks[this._options.locale] || localePacks.en)[key] || localePacks.en[key] || key,
      values
    );
  };

  FabTree.prototype._build = function() {
    this.hostElement.textContent = '';
    this.hostElement.classList.add('fui-tree');
    this.hostElement.classList.toggle('fui-tree-animate', this._options.animate);
    this.hostElement.classList.toggle('fui-tree-lines', this._options.lines);
    this.hostElement.setAttribute('role', 'tree');
    this.hostElement.setAttribute(
      'aria-label',
      this._options.ariaLabel || this._getText('tree')
    );
    if (!this.hostElement.hasAttribute('tabindex')) this.hostElement.tabIndex = 0;
  };

  FabTree.prototype._bind = function() {
    this.addEventListener(this.hostElement, 'click', this._handleClick.bind(this));
    this.addEventListener(this.hostElement, 'dblclick', this._handleDblClick.bind(this));
    this.addEventListener(this.hostElement, 'contextmenu', this._handleContextMenu.bind(this));
    this.addEventListener(this.hostElement, 'keydown', this._handleKeyDown.bind(this));
    this.addEventListener(this.hostElement, 'dragstart', this._handleDragStart.bind(this));
    this.addEventListener(this.hostElement, 'dragover', this._handleDragOver.bind(this));
    this.addEventListener(this.hostElement, 'dragleave', this._handleDragLeave.bind(this));
    this.addEventListener(this.hostElement, 'drop', this._handleDrop.bind(this));
    this.addEventListener(this.hostElement, 'dragend', this._handleDragEnd.bind(this));
  };

  FabTree.prototype._rowFromTarget = function(target) {
    var row = target && target.closest ? target.closest('.fui-tree-node') : null;
    return row && this.hostElement.contains(row) ? row : null;
  };

  FabTree.prototype._nodeFromTarget = function(target) {
    var row = this._rowFromTarget(target);
    return row ? this.getNode(row) : null;
  };

  FabTree.prototype._invoke = function(name) {
    var handler = this._options[name];
    var args = Array.prototype.slice.call(arguments, 1);
    return typeof handler === 'function' ? handler.apply(this, args) : undefined;
  };

  FabTree.prototype._emit = function(type, detail, cancelable) {
    var listeners = (this._listeners[type] || []).slice();
    var event = {
      type: type,
      target: this,
      detail: detail,
      defaultPrevented: false,
      preventDefault: function() {
        if (cancelable) this.defaultPrevented = true;
      }
    };
    listeners.forEach(function(listener) {
      listener.call(this, event);
    }, this);
    return !event.defaultPrevented;
  };

  FabTree.prototype.on = function(type, listener) {
    if (!type || typeof listener !== 'function') return this;
    (this._listeners[String(type)] || (this._listeners[String(type)] = [])).push(listener);
    return this;
  };

  FabTree.prototype.off = function(type, listener) {
    var list = this._listeners[String(type)] || [];
    var index;
    if (!listener) {
      delete this._listeners[String(type)];
      return this;
    }
    for (index = list.length - 1; index >= 0; index -= 1) {
      if (list[index] === listener) list.splice(index, 1);
    }
    return this;
  };

  FabTree.prototype._canShowCheckbox = function(node) {
    if (typeof this._options.checkbox === 'function') return this._options.checkbox.call(this, node);
    if (!this._options.checkbox) return false;
    return !this._options.onlyLeafCheck || this.isLeaf(node);
  };

  FabTree.prototype._createIndent = function(container, node) {
    var ancestors = [];
    var parent = node._parent;
    var indent;
    while (parent) {
      ancestors.unshift(parent);
      parent = parent._parent;
    }
    ancestors.forEach(function(ancestor) {
      indent = document.createElement('span');
      indent.className = 'fui-tree-indent';
      if (ancestor._parent && ancestor !== ancestor._parent.children[ancestor._parent.children.length - 1]) {
        indent.classList.add('fui-tree-indent-line');
      }
      container.appendChild(indent);
    });
  };

  FabTree.prototype._createRow = function(node, level) {
    var item = document.createElement('li');
    var row = document.createElement('div');
    var expander = document.createElement('button');
    var checkbox;
    var icon = document.createElement('span');
    var title = document.createElement('span');
    var hasChildren = node.children.length > 0 || node._loaded === false;
    var isClosed = node.state === 'closed';
    var formatted;
    item.className = 'fui-tree-item';
    item.setAttribute('role', 'none');
    row.className = 'fui-tree-node';
    row.setAttribute('role', 'treeitem');
    row.setAttribute('aria-level', String(level));
    row.setAttribute('aria-selected', node === this._selectedNode ? 'true' : 'false');
    row.tabIndex = node === this._selectedNode ? 0 : -1;
    row.draggable = this._options.dnd;
    if (hasChildren) row.setAttribute('aria-expanded', isClosed ? 'false' : 'true');
    if (node._checkState !== 'unchecked' && this._canShowCheckbox(node)) {
      row.setAttribute('aria-checked', node._checkState === 'mixed' ? 'mixed' : 'true');
    } else if (this._canShowCheckbox(node)) {
      row.setAttribute('aria-checked', 'false');
    }
    if (node === this._selectedNode) row.classList.add('fui-tree-node-selected');
    if (node._loading) row.classList.add('fui-tree-node-loading');
    this._createIndent(row, node);
    expander.type = 'button';
    expander.className = 'fui-tree-expander';
    expander.tabIndex = -1;
    expander.setAttribute('aria-hidden', hasChildren ? 'false' : 'true');
    expander.setAttribute(
      'aria-label',
      this._getText(isClosed ? 'expand' : 'collapse', { text: node.text })
    );
    if (!hasChildren) expander.classList.add('fui-tree-expander-empty');
    else expander.classList.add(isClosed ? 'fui-tree-expander-closed' : 'fui-tree-expander-open');
    row.appendChild(expander);
    if (this._canShowCheckbox(node)) {
      checkbox = document.createElement('button');
      checkbox.type = 'button';
      checkbox.className = 'fui-tree-checkbox fui-tree-checkbox-' + node._checkState;
      checkbox.tabIndex = -1;
      checkbox.setAttribute(
        'aria-label',
        this._getText(node._checkState === 'checked' ? 'uncheck' : 'check', { text: node.text })
      );
      row.appendChild(checkbox);
    }
    icon.className = 'fui-tree-icon ' + (
      node.iconCls ||
      (hasChildren ? (isClosed ? 'fui-tree-icon-folder' : 'fui-tree-icon-folder-open') : 'fui-tree-icon-file')
    );
    icon.setAttribute('aria-hidden', 'true');
    row.appendChild(icon);
    title.className = 'fui-tree-title';
    if (typeof this._options.formatter === 'function') {
      formatted = this._options.formatter.call(this, node);
      if (formatted && formatted.nodeType) title.appendChild(formatted);
      else title.innerHTML = formatted == null ? '' : String(formatted);
    } else {
      title.textContent = node.text;
    }
    row.appendChild(title);
    item.appendChild(row);
    node.target = row;
    if (node._loading) {
      title.setAttribute('aria-label', node.text + ' ' + this._getText('loading'));
    }
    return item;
  };

  FabTree.prototype._renderList = function(nodes, level) {
    var list = document.createElement('ul');
    list.className = level === 1 ? 'fui-tree-root' : 'fui-tree-children';
    list.setAttribute('role', level === 1 ? 'none' : 'group');
    nodes.forEach(function(node) {
      var item;
      var children;
      if (node._hidden) return;
      item = this._createRow(node, level);
      if (node.children.length) {
        children = this._renderList(node.children, level + 1);
        children.hidden = node.state === 'closed';
        item.appendChild(children);
      }
      list.appendChild(item);
    }, this);
    return list;
  };

  FabTree.prototype.render = function() {
    var activeId = this._selectedNode && this._selectedNode.id;
    this.hostElement.textContent = '';
    this.hostElement.classList.toggle('fui-tree-animate', this._options.animate);
    this.hostElement.classList.toggle('fui-tree-lines', this._options.lines);
    this.hostElement.classList.toggle('fui-tree-dnd', this._options.dnd);
    this.hostElement.appendChild(this._renderList(this._roots, 1));
    if (activeId != null) {
      this._selectedNode = this.find(activeId) || null;
    }
    return this;
  };

  FabTree.prototype._handleClick = function(event) {
    var row = this._rowFromTarget(event.target);
    var node;
    if (!row) return;
    node = this.getNode(row);
    if (!node) return;
    if (event.target.closest('.fui-tree-expander')) {
      this.toggle(node);
      return;
    }
    if (event.target.closest('.fui-tree-checkbox')) {
      if (node._checkState === 'checked') this.uncheck(node);
      else this.check(node);
      return;
    }
    this.select(node);
    this._invoke('onClick', node);
    this._emit('click', { node: node, originalEvent: event });
  };

  FabTree.prototype._handleDblClick = function(event) {
    var node = this._nodeFromTarget(event.target);
    if (!node || event.target.closest('button')) return;
    this._invoke('onDblClick', node);
    this._emit('dblclick', { node: node, originalEvent: event });
  };

  FabTree.prototype._handleContextMenu = function(event) {
    var node = this._nodeFromTarget(event.target);
    if (!node) return;
    this._invoke('onContextMenu', event, node);
    this._emit('contextmenu', { node: node, originalEvent: event });
  };

  FabTree.prototype._visibleNodes = function() {
    return flattenTreeData(this._roots, true).map(function(record) {
      return record.node;
    });
  };

  FabTree.prototype._handleKeyDown = function(event) {
    var node = this._nodeFromTarget(event.target) || this._selectedNode;
    var visible = this._visibleNodes();
    var index = visible.indexOf(node);
    var target;
    if (this._editingNode) return;
    if (!node && visible.length) node = visible[0];
    if (!node) return;
    if (event.key === 'ArrowDown') target = visible[Math.min(visible.length - 1, index + 1)];
    else if (event.key === 'ArrowUp') target = visible[Math.max(0, index - 1)];
    else if (event.key === 'Home') target = visible[0];
    else if (event.key === 'End') target = visible[visible.length - 1];
    else if (event.key === 'ArrowRight') {
      if (!this.isLeaf(node) && node.state === 'closed') this.expand(node);
      else if (node.children.length) target = node.children[0];
    } else if (event.key === 'ArrowLeft') {
      if (!this.isLeaf(node) && node.state !== 'closed') this.collapse(node);
      else if (node._parent) target = node._parent;
    } else if (event.key === 'Enter') {
      this.select(node);
    } else if (event.key === ' ' && this._canShowCheckbox(node)) {
      if (node._checkState === 'checked') this.uncheck(node);
      else this.check(node);
    } else if (event.key === 'F2') {
      this.beginEdit(node);
    } else {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (target) {
      this.select(target);
      if (target.target) target.target.focus();
    }
  };

  FabTree.prototype._updateNodeExpansion = function(node, expanded) {
    var row = node && node.target;
    var item = row && row.parentElement;
    var children = item && row.nextElementSibling;
    var expander = row && row.querySelector('.fui-tree-expander');
    var icon = row && row.querySelector('.fui-tree-icon');
    var animation;
    var height;
    if (!row || !children || !children.classList.contains('fui-tree-children')) {
      this.render();
      return;
    }
    row.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    if (expander) {
      expander.classList.toggle('fui-tree-expander-open', expanded);
      expander.classList.toggle('fui-tree-expander-closed', !expanded);
      expander.setAttribute(
        'aria-label',
        this._getText(expanded ? 'collapse' : 'expand', { text: node.text })
      );
    }
    if (icon && !node.iconCls) {
      icon.classList.toggle('fui-tree-icon-folder-open', expanded);
      icon.classList.toggle('fui-tree-icon-folder', !expanded);
    }
    if (!this._options.animate || typeof children.animate !== 'function') {
      children.hidden = !expanded;
      return;
    }
    if (children.getAnimations) {
      children.getAnimations().forEach(function(current) {
        current.cancel();
      });
    }
    if (expanded) {
      children.hidden = false;
      height = children.scrollHeight;
      animation = children.animate([
        { height: '0px', opacity: 0, overflow: 'hidden' },
        { height: height + 'px', opacity: 1, overflow: 'hidden' }
      ], {
        duration: 180,
        easing: 'ease-out'
      });
      animation.onfinish = function() {
        children.style.height = '';
        children.style.opacity = '';
        children.style.overflow = '';
      };
      return;
    }
    height = children.scrollHeight;
    animation = children.animate([
      { height: height + 'px', opacity: 1, overflow: 'hidden' },
      { height: '0px', opacity: 0, overflow: 'hidden' }
    ], {
      duration: 180,
      easing: 'ease-in'
    });
    animation.onfinish = function() {
      if (node.state === 'closed') children.hidden = true;
      children.style.height = '';
      children.style.opacity = '';
      children.style.overflow = '';
    };
  };

  FabTree.prototype._dropPoint = function(row, clientY) {
    var rect = row.getBoundingClientRect();
    var ratio = rect.height ? (clientY - rect.top) / rect.height : 0.5;
    return ratio < 0.25 ? 'top' : ratio > 0.75 ? 'bottom' : 'append';
  };

  FabTree.prototype._clearDropState = function() {
    var rows = this.hostElement.querySelectorAll(
      '.fui-tree-drop-before,.fui-tree-drop-after,.fui-tree-drop-append'
    );
    Array.prototype.forEach.call(rows, function(row) {
      row.classList.remove('fui-tree-drop-before', 'fui-tree-drop-after', 'fui-tree-drop-append');
    });
    this._dragTarget = null;
    this._dragPoint = null;
  };

  FabTree.prototype._handleDragStart = function(event) {
    var node = this._nodeFromTarget(event.target);
    if (!this._options.dnd || !node) return;
    if (
      this._invoke('onBeforeDrag', node) === false ||
      !this._emit('beforedrag', { node: node, originalEvent: event }, true)
    ) {
      event.preventDefault();
      return;
    }
    this._dragNode = node;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(node.id));
    }
    node.target.classList.add('fui-tree-node-dragging');
    this._invoke('onStartDrag', node);
    this._emit('startdrag', { node: node, originalEvent: event });
  };

  FabTree.prototype._handleDragOver = function(event) {
    var row = this._rowFromTarget(event.target);
    var node;
    var point;
    if (!row || !this._dragNode) return;
    node = this.getNode(row);
    if (!node || node === this._dragNode || isTreeDescendant(node, this._dragNode)) return;
    point = this._dropPoint(row, event.clientY);
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    if (this._dragTarget !== node) {
      this._invoke('onDragEnter', node, this._dragNode);
      this._emit('dragenter', { target: node, source: this._dragNode, originalEvent: event });
    }
    this._clearDropState();
    this._dragTarget = node;
    this._dragPoint = point;
    row.classList.add(
      point === 'top' ?
        'fui-tree-drop-before' :
        point === 'bottom' ? 'fui-tree-drop-after' : 'fui-tree-drop-append'
    );
    this._invoke('onDragOver', node, this._dragNode);
    this._emit('dragover', {
      target: node,
      source: this._dragNode,
      point: point,
      originalEvent: event
    });
  };

  FabTree.prototype._handleDragLeave = function(event) {
    var row = this._rowFromTarget(event.target);
    if (!row || row.contains(event.relatedTarget)) return;
    if (this._dragTarget) {
      this._invoke('onDragLeave', this._dragTarget, this._dragNode);
      this._emit('dragleave', {
        target: this._dragTarget,
        source: this._dragNode,
        originalEvent: event
      });
    }
  };

  FabTree.prototype._handleDrop = function(event) {
    var source = this._dragNode;
    var target = this._dragTarget;
    var point = this._dragPoint;
    var moved;
    if (!source || !target || !point) return;
    event.preventDefault();
    if (
      this._invoke('onBeforeDrop', target, source, point) === false ||
      !this._emit('beforedrop', {
        target: target,
        source: source,
        point: point,
        originalEvent: event
      }, true)
    ) {
      this._clearDropState();
      return;
    }
    moved = moveTreeDataNode(this._roots, source, target, point);
    this._clearDropState();
    if (!moved) return;
    this.render();
    this.select(source);
    this._invoke('onDrop', target, source, point);
    this._emit('drop', {
      target: target,
      source: source,
      point: point,
      originalEvent: event
    });
  };

  FabTree.prototype._handleDragEnd = function(event) {
    var node = this._dragNode;
    if (node && node.target) node.target.classList.remove('fui-tree-node-dragging');
    this._clearDropState();
    this._dragNode = null;
    if (node) {
      this._invoke('onStopDrag', node);
      this._emit('stopdrag', { node: node, originalEvent: event });
    }
  };

  FabTree.prototype._syncNodeCheckState = function(node) {
    var states;
    if (!node.children.length) {
      node._checkState = node.checked ? 'checked' : 'unchecked';
      return node._checkState;
    }
    states = node.children.map(function(child) {
      return this._syncNodeCheckState(child);
    }, this);
    if (states.every(function(state) { return state === 'checked'; })) {
      node._checkState = 'checked';
      node.checked = true;
    } else if (states.every(function(state) { return state === 'unchecked'; }) && !node.checked) {
      node._checkState = 'unchecked';
      node.checked = false;
    } else {
      node._checkState = 'mixed';
      node.checked = false;
    }
    return node._checkState;
  };

  FabTree.prototype._syncAllCheckStates = function() {
    if (this._options.cascadeCheck) {
      this._roots.forEach(function visit(node) {
        if (node.checked) {
          this._setDescendantCheck(node, true);
          return;
        }
        node.children.forEach(visit.bind(this));
      }, this);
    }
    this._roots.forEach(function(node) {
      this._syncNodeCheckState(node);
    }, this);
  };

  FabTree.prototype._setDescendantCheck = function(node, checked) {
    node.checked = checked;
    node._checkState = checked ? 'checked' : 'unchecked';
    node.children.forEach(function(child) {
      this._setDescendantCheck(child, checked);
    }, this);
  };

  FabTree.prototype._syncAncestorChecks = function(node) {
    var parent = node._parent;
    while (parent) {
      this._syncNodeCheckState(parent);
      parent = parent._parent;
    }
  };

  FabTree.prototype._setCheck = function(target, checked) {
    var node = this._resolveNode(target);
    if (!node || !this._canShowCheckbox(node)) return this;
    if (
      this._invoke('onBeforeCheck', node, checked) === false ||
      !this._emit('beforecheck', { node: node, checked: checked }, true)
    ) return this;
    if (this._options.cascadeCheck) this._setDescendantCheck(node, checked);
    else {
      node.checked = checked;
      node._checkState = checked ? 'checked' : 'unchecked';
    }
    this._syncAncestorChecks(node);
    this.render();
    this._invoke('onCheck', node, checked);
    this._emit('check', { node: node, checked: checked });
    return this;
  };

  FabTree.prototype._resolveNode = function(target) {
    if (!target) return null;
    if (target.nodeType === 1) return this.getNode(target);
    if (typeof target === 'object' && target.id != null) {
      return this.find(target.id) || target;
    }
    return this.find(target);
  };

  FabTree.prototype._load = function(node) {
    var sequence = ++this._loadSequence;
    var param = treeAssign({}, this._options.queryParams || {});
    var parent = node || null;
    var loader = this._options.loader || this._defaultLoader.bind(this);
    var completed = false;
    var result;
    if (node) param.id = node.id;
    if (
      this._invoke('onBeforeLoad', parent, param) === false ||
      !this._emit('beforeload', { node: parent, param: param }, true)
    ) return Promise.resolve(false);
    if (node) {
      node._loading = true;
      this.render();
    }
    return new Promise(function(resolve) {
      function success(data) {
        var normalized;
        if (completed || sequence !== this._loadSequence || this._destroyed) return;
        completed = true;
        if (typeof this._options.loadFilter === 'function') {
          data = this._options.loadFilter.call(this, data, parent);
        }
        normalized = normalizeTreeData(Array.isArray(data) ? data : []);
        normalized.forEach(function(child) {
          child._parent = parent;
        });
        if (parent) {
          parent.children = normalized;
          parent._loaded = true;
          parent._loading = false;
          parent.state = 'open';
        } else {
          this._roots = normalized;
        }
        this._syncAllCheckStates();
        this.render();
        this._invoke('onLoadSuccess', parent, data);
        this._emit('loadsuccess', { node: parent, data: data });
        resolve(true);
      }
      function failure(error) {
        if (completed || sequence !== this._loadSequence || this._destroyed) return;
        completed = true;
        if (parent) parent._loading = false;
        this.render();
        this._invoke('onLoadError', error, parent);
        this._emit('loaderror', { node: parent, error: error });
        resolve(false);
      }
      try {
        result = loader.call(this, param, success.bind(this), failure.bind(this));
        if (result && typeof result.then === 'function') {
          result.then(success.bind(this), failure.bind(this));
        }
      } catch (error) {
        failure.call(this, error);
      }
    }.bind(this));
  };

  FabTree.prototype._defaultLoader = function(param, success, error) {
    var url = this._options.url;
    var method = this._options.method === 'get' ? 'GET' : 'POST';
    var query = new URLSearchParams();
    var fetchUrl = url;
    var fetchOptions = { method: method, headers: {} };
    if (!url || typeof fetch !== 'function') {
      error(new Error('Tree loader requires url or a custom loader.'));
      return false;
    }
    Object.keys(param || {}).forEach(function(key) {
      if (param[key] != null) query.append(key, String(param[key]));
    });
    if (method === 'GET') {
      fetchUrl += (fetchUrl.indexOf('?') >= 0 ? '&' : '?') + query.toString();
    } else {
      fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
      fetchOptions.body = query.toString();
    }
    return fetch(fetchUrl, fetchOptions).then(function(response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    }).then(success, error);
  };

  FabTree.prototype.options = function() {
    return this._options;
  };

  FabTree.prototype.setOptions = function(options) {
    treeAssign(this._options, options || {});
    this._normalizeOptions();
    this.hostElement.classList.toggle('fui-tree-animate', this._options.animate);
    this.hostElement.classList.toggle('fui-tree-lines', this._options.lines);
    this.setTheme(this._options.theme);
    return this.render();
  };

  FabTree.prototype.loadData = function(data) {
    this._selectedNode = null;
    this._roots = normalizeTreeData(data);
    this._syncAllCheckStates();
    this.render();
    this._invoke('onLoadSuccess', null, data);
    this._emit('loadsuccess', { node: null, data: data });
    return this;
  };

  FabTree.prototype.getNode = function(target) {
    var row = this._rowFromTarget(target);
    var found = null;
    if (!row) return null;
    flattenTreeData(this._roots, false).some(function(record) {
      if (record.node.target === row) {
        found = record.node;
        return true;
      }
      return false;
    });
    return found;
  };

  FabTree.prototype.getData = function(target) {
    var node = this._resolveNode(target);
    return node || null;
  };

  FabTree.prototype.reload = function(target) {
    var node = target ? this._resolveNode(target) : null;
    if (target && !node) return Promise.resolve(false);
    if (node) {
      node.children = [];
      node._loaded = false;
    }
    return this._load(node);
  };

  FabTree.prototype.getRoot = function() {
    return this._roots[0] || null;
  };

  FabTree.prototype.getRoots = function() {
    return this._roots.slice();
  };

  FabTree.prototype.getParent = function(target) {
    var node = this._resolveNode(target);
    return node ? node._parent : null;
  };

  FabTree.prototype.getChildren = function(target) {
    var node = target ? this._resolveNode(target) : null;
    if (target && !node) return [];
    return flattenTreeData(node ? node.children : this._roots, false).map(function(record) {
      return record.node;
    });
  };

  FabTree.prototype.getChecked = function(state) {
    var accepted = Array.isArray(state) ? state : [state || 'checked'];
    accepted = accepted.map(function(item) {
      item = String(item || 'checked').toLowerCase();
      return item === 'indeterminate' ? 'mixed' : item;
    });
    return flattenTreeData(this._roots, false).map(function(record) {
      return record.node;
    }).filter(function(node) {
      return accepted.indexOf(node._checkState) >= 0;
    });
  };

  FabTree.prototype.getSelected = function() {
    return this._selectedNode;
  };

  FabTree.prototype.isLeaf = function(target) {
    var node = this._resolveNode(target);
    return Boolean(node && node._loaded !== false && !node.children.length);
  };

  FabTree.prototype.find = function(id) {
    var found = null;
    flattenTreeData(this._roots, false).some(function(record) {
      if (String(record.node.id) === String(id)) {
        found = record.node;
        return true;
      }
      return false;
    });
    return found;
  };

  FabTree.prototype.findBy = function(field, value) {
    var found = null;
    flattenTreeData(this._roots, false).some(function(record) {
      if (record.node[field] === value) {
        found = record.node;
        return true;
      }
      return false;
    });
    return found;
  };

  FabTree.prototype.select = function(target) {
    var node = this._resolveNode(target);
    if (!node || node === this._selectedNode) return this;
    if (
      this._invoke('onBeforeSelect', node) === false ||
      !this._emit('beforeselect', { node: node }, true)
    ) return this;
    this._selectedNode = node;
    this.render();
    if (node.target) node.target.tabIndex = 0;
    this._invoke('onSelect', node);
    this._emit('select', { node: node });
    return this;
  };

  FabTree.prototype.check = function(target) {
    return this._setCheck(target, true);
  };

  FabTree.prototype.uncheck = function(target) {
    return this._setCheck(target, false);
  };

  FabTree.prototype.expand = function(target) {
    var node = this._resolveNode(target);
    if (!node || (this.isLeaf(node) && node._loaded !== false) || node.state !== 'closed') return this;
    if (
      this._invoke('onBeforeExpand', node) === false ||
      !this._emit('beforeexpand', { node: node }, true)
    ) return this;
    if (node._loaded === false) {
      this._load(node).then(function(loaded) {
        if (!loaded) return;
        this._invoke('onExpand', node);
        this._emit('expand', { node: node });
      }.bind(this));
      return this;
    }
    node.state = 'open';
    this._updateNodeExpansion(node, true);
    this._invoke('onExpand', node);
    this._emit('expand', { node: node });
    return this;
  };

  FabTree.prototype.collapse = function(target) {
    var node = this._resolveNode(target);
    if (!node || this.isLeaf(node) || node.state === 'closed') return this;
    if (
      this._invoke('onBeforeCollapse', node) === false ||
      !this._emit('beforecollapse', { node: node }, true)
    ) return this;
    node.state = 'closed';
    this._updateNodeExpansion(node, false);
    this._invoke('onCollapse', node);
    this._emit('collapse', { node: node });
    return this;
  };

  FabTree.prototype.toggle = function(target) {
    var node = this._resolveNode(target);
    if (!node) return this;
    return node.state === 'closed' ? this.expand(node) : this.collapse(node);
  };

  FabTree.prototype.collapseAll = function(target) {
    var node = target ? this._resolveNode(target) : null;
    var nodes = node ? [node].concat(this.getChildren(node)) : this.getChildren();
    nodes.forEach(function(item) {
      if (item.children.length || item._loaded === false) item.state = 'closed';
    });
    return this.render();
  };

  FabTree.prototype.expandAll = function(target) {
    var node = target ? this._resolveNode(target) : null;
    var nodes = node ? [node].concat(this.getChildren(node)) : this.getChildren();
    nodes.forEach(function(item) {
      if (item.children.length) item.state = 'open';
    });
    return this.render();
  };

  FabTree.prototype.expandTo = function(target) {
    var node = this._resolveNode(target);
    var parent;
    if (!node) return this;
    parent = node._parent;
    while (parent) {
      parent.state = 'open';
      parent = parent._parent;
    }
    return this.render();
  };

  FabTree.prototype.scrollTo = function(target) {
    var node = this._resolveNode(target);
    if (!node) return this;
    this.expandTo(node);
    if (node.target && typeof node.target.scrollIntoView === 'function') {
      node.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    return this;
  };

  FabTree.prototype.append = function(param) {
    var parent = param && param.parent ? this._resolveNode(param.parent) : null;
    var data = param && Array.isArray(param.data) ? param.data : [];
    var nodes = normalizeTreeData(data);
    nodes.forEach(function(node) {
      node._parent = parent;
      if (parent) parent.children.push(node);
      else this._roots.push(node);
    }, this);
    if (parent) {
      parent._loaded = true;
      parent.state = 'open';
    }
    this._syncAllCheckStates();
    return this.render();
  };

  FabTree.prototype.insert = function(param) {
    var reference = param && (param.before || param.after);
    var target = this._resolveNode(reference);
    var collection;
    var index;
    var node;
    if (!target || !param || !param.data) return this;
    node = normalizeTreeData([param.data])[0];
    collection = getNodeCollection(this._roots, target);
    index = collection.indexOf(target);
    if (param.after) index += 1;
    node._parent = target._parent;
    collection.splice(index, 0, node);
    this._syncAllCheckStates();
    return this.render();
  };

  FabTree.prototype.remove = function(target) {
    var node = this._resolveNode(target);
    var collection;
    var index;
    if (!node) return this;
    collection = getNodeCollection(this._roots, node);
    index = collection.indexOf(node);
    if (index >= 0) collection.splice(index, 1);
    if (this._selectedNode === node || isTreeDescendant(this._selectedNode, node)) {
      this._selectedNode = null;
    }
    this._syncAllCheckStates();
    return this.render();
  };

  FabTree.prototype.pop = function(target) {
    var node = this._resolveNode(target);
    var snapshot;
    if (!node) return null;
    snapshot = this._serializeNode(node);
    this.remove(node);
    return snapshot;
  };

  FabTree.prototype._serializeNode = function(node) {
    var result = {};
    var key;
    for (key in node) {
      if (
        Object.prototype.hasOwnProperty.call(node, key) &&
        key.charAt(0) !== '_' &&
        key !== 'target' &&
        key !== 'children'
      ) {
        result[key] = node[key];
      }
    }
    result.children = node.children.map(this._serializeNode.bind(this));
    return result;
  };

  FabTree.prototype.update = function(param) {
    var node = param && this._resolveNode(param.target || param.id);
    var key;
    if (!node || !param) return this;
    for (key in param) {
      if (
        Object.prototype.hasOwnProperty.call(param, key) &&
        key !== 'target' &&
        key !== 'children' &&
        key.charAt(0) !== '_'
      ) {
        node[key] = param[key];
      }
    }
    if (Array.isArray(param.children)) {
      node.children = normalizeTreeData(param.children);
      node.children.forEach(function(child) { child._parent = node; });
      node._loaded = true;
    }
    node.text = node.text == null ? '' : String(node.text);
    node.state = node.state === 'closed' ? 'closed' : 'open';
    node.checked = node.checked === true;
    this._syncAllCheckStates();
    return this.render();
  };

  FabTree.prototype.enableDnd = function() {
    this._options.dnd = true;
    return this.render();
  };

  FabTree.prototype.disableDnd = function() {
    this._options.dnd = false;
    this._handleDragEnd({});
    return this.render();
  };

  FabTree.prototype.beginEdit = function(target) {
    var node = this._resolveNode(target);
    var title;
    var input;
    if (!node || this._editingNode) return this;
    if (
      this._invoke('onBeforeEdit', node) === false ||
      !this._emit('beforeedit', { node: node }, true)
    ) return this;
    this.expandTo(node);
    title = node.target && node.target.querySelector('.fui-tree-title');
    if (!title) return this;
    this._editingNode = node;
    input = document.createElement('input');
    input.className = 'fui-tree-editor';
    input.type = 'text';
    input.value = node.text;
    input.setAttribute('aria-label', this._getText('edit', { text: node.text }));
    title.textContent = '';
    title.appendChild(input);
    input.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.endEdit(node);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.cancelEdit(node);
      }
    }.bind(this));
    input.addEventListener('blur', function() {
      if (this._editingNode === node) this.endEdit(node);
    }.bind(this), { once: true });
    input.focus();
    input.select();
    return this;
  };

  FabTree.prototype.endEdit = function(target) {
    var node = this._resolveNode(target);
    var input;
    if (!node || this._editingNode !== node) return this;
    input = node.target && node.target.querySelector('.fui-tree-editor');
    if (input) node.text = input.value;
    this._editingNode = null;
    this.render();
    this.select(node);
    this._invoke('onAfterEdit', node);
    this._emit('afteredit', { node: node });
    return this;
  };

  FabTree.prototype.cancelEdit = function(target) {
    var node = this._resolveNode(target);
    if (!node || this._editingNode !== node) return this;
    this._editingNode = null;
    this.render();
    this.select(node);
    this._invoke('onCancelEdit', node);
    this._emit('canceledit', { node: node });
    return this;
  };

  FabTree.prototype.doFilter = function(query) {
    var filter = typeof this._options.filter === 'function' ?
      this._options.filter :
      function(value, node) {
        return String(node.text || '').toLowerCase().indexOf(String(value || '').toLowerCase()) >= 0;
      };
    function visit(node) {
      var childMatched = false;
      var selfMatched;
      node.children.forEach(function(child) {
        if (visit(child)) childMatched = true;
      });
      selfMatched = filter.call(this, query, node) !== false;
      node._matched = selfMatched;
      node._hidden = !(selfMatched || childMatched);
      if (childMatched) node.state = 'open';
      return !node._hidden;
    }
    this._roots.forEach(visit.bind(this));
    return this.render();
  };

  FabTree.prototype.setLocale = function(locale, messages) {
    if (messages && locale) {
      localePacks[String(locale)] = treeAssign({}, localePacks.en, messages);
    }
    this._options.locale = normalizeTreeLocale(locale);
    this.hostElement.setAttribute(
      'aria-label',
      this._options.ariaLabel || this._getText('tree')
    );
    return this.render();
  };

  FabTree.prototype.setTheme = function(theme) {
    var index;
    this._options.theme = theme == null ? 'inherit' : theme;
    this.theme = this._options.theme === 'inherit' ?
      findTreeTheme(this._themeSource) :
      normalizeTreeTheme(this._options.theme);
    for (index = 0; index < TREE_THEMES.length; index += 1) {
      this.hostElement.classList.remove('fg-theme-' + TREE_THEMES[index]);
    }
    this.hostElement.classList.add('fg-theme-' + this.theme);
    return this;
  };

  FabTree.prototype.destroy = function() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._loadSequence += 1;
    this.removeEventListener();
    this.hostElement.innerHTML = this._original.html;
    restoreTreeAttribute(this.hostElement, 'class', this._original.className);
    restoreTreeAttribute(this.hostElement, 'style', this._original.style);
    restoreTreeAttribute(this.hostElement, 'role', this._original.role);
    restoreTreeAttribute(this.hostElement, 'tabindex', this._original.tabIndex);
    restoreTreeAttribute(this.hostElement, 'aria-label', this._original.ariaLabel);
    unregisterControl(this.hostElement, this);
    delete this.hostElement.__fabuiTree;
    this._roots = [];
    this._selectedNode = null;
    this._listeners = {};
  };

  FabTree.defaults = defaults;
  FabTree.locales = localePacks;
  FabTree.themes = TREE_THEMES.slice();
  FabTree.addLocale = function(name, messages) {
    if (name && messages) localePacks[String(name)] = treeAssign({}, localePacks.en, messages);
    return FabTree;
  };
  FabTree.getControl = function(element) {
    element = resolveTreeElement(element);
    return element && element.__fabuiTree ? element.__fabuiTree : null;
  };
  FabTree.normalizeTheme = normalizeTreeTheme;
  FabTree.normalizeLocale = normalizeTreeLocale;
  return FabTree;
}
