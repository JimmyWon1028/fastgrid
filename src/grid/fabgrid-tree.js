export function getTreeChildren(item, childItemsPath, getByBinding, grid) {
  var children;
  if (!item || !childItemsPath) {
    return [];
  }
  if (typeof childItemsPath === 'function') {
    children = childItemsPath(item, grid);
  } else {
    children = getByBinding(item, childItemsPath);
  }
  return Array.isArray(children) ? children : [];
}

export function findTreeItemLocation(items, item, getChildren) {
  var visited = [];
  return find(Array.isArray(items) ? items : [], null);

  function find(rows, parentItem) {
    var current;
    var children;
    var result;
    var i;
    for (i = 0; i < rows.length; i += 1) {
      current = rows[i];
      if (current === item) {
        return {
          items: rows,
          index: i,
          parentItem: parentItem
        };
      }
      if (current && typeof current === 'object' && visited.indexOf(current) >= 0) {
        continue;
      }
      if (current && typeof current === 'object') {
        visited.push(current);
      }
      children = getChildren(current);
      result = find(children, current);
      if (result) {
        return result;
      }
    }
    return null;
  }
}

export function isTreeItemDescendant(item, candidate, getChildren) {
  var visited = [];
  return contains(item);

  function contains(current) {
    var children;
    var i;
    if (!current || visited.indexOf(current) >= 0) {
      return false;
    }
    visited.push(current);
    children = getChildren(current);
    for (i = 0; i < children.length; i += 1) {
      if (children[i] === candidate || contains(children[i])) {
        return true;
      }
    }
    return false;
  }
}

export function moveTreeItemInSource(items, item, targetItem, position, getChildren, ensureChildren) {
  var roots = Array.isArray(items) ? items : [];
  var normalizedPosition = normalizeTreeDropPosition(position);
  var sourceLocation = findTreeItemLocation(roots, item, getChildren);
  var targetLocation;
  var destination;
  var destinationIndex;
  var sourceParent = sourceLocation ? sourceLocation.parentItem : null;
  if (!item || item === targetItem || (targetItem && isTreeItemDescendant(item, targetItem, getChildren))) {
    return null;
  }
  if (targetItem && normalizedPosition !== 'inside' &&
    !findTreeItemLocation(roots, targetItem, getChildren)) {
    return null;
  }
  if (targetItem && normalizedPosition === 'inside') {
    destination = ensureChildren(targetItem);
    if (!Array.isArray(destination)) {
      return null;
    }
  }
  if (sourceLocation) {
    sourceLocation.items.splice(sourceLocation.index, 1);
  }
  if (!targetItem) {
    destination = roots;
    destinationIndex = destination.length;
    normalizedPosition = 'after';
  } else if (normalizedPosition === 'inside') {
    destinationIndex = destination.length;
  } else {
    targetLocation = findTreeItemLocation(roots, targetItem, getChildren);
    if (!targetLocation) {
      if (sourceLocation) {
        sourceLocation.items.splice(sourceLocation.index, 0, item);
      }
      return null;
    }
    destination = targetLocation.items;
    destinationIndex = targetLocation.index + (normalizedPosition === 'after' ? 1 : 0);
  }
  destination.splice(destinationIndex, 0, item);
  return {
    item: item,
    sourceParent: sourceParent,
    parentItem: normalizedPosition === 'inside' ? targetItem :
      targetItem ? findTreeItemLocation(roots, item, getChildren).parentItem : null,
    targetItem: targetItem || null,
    position: normalizedPosition,
    index: destinationIndex,
    external: !sourceLocation
  };
}

function normalizeTreeDropPosition(position) {
  position = position == null ? '' : String(position).toLowerCase();
  if (position === 'before' || position === 'inside' || position === 'after') {
    return position;
  }
  return 'inside';
}

export function buildVisibleTreeRows(items, options) {
  options = options || {};
  options.getChildren = typeof options.getChildren === 'function' ? options.getChildren : function() { return []; };
  options.isCollapsed = typeof options.isCollapsed === 'function' ? options.isCollapsed : function() { return false; };
  options.matches = typeof options.matches === 'function' ? options.matches : function() { return true; };
  var source = Array.isArray(items) ? items : [];
  var nextRowNumber = 1;
  var nodes = buildNodes(source, 0, null, []);
  var totalRoots = nodes.length;
  var rows = [];
  var infos = [];
  var start;
  var end;

  if (options.pagination === true) {
    start = Math.max(0, (options.pageNumber - 1) * options.pageSize);
    end = start + options.pageSize;
    nodes = nodes.slice(start, end);
  }
  appendNodes(nodes, rows, infos);
  return {
    rows: rows,
    infos: infos,
    totalRoots: totalRoots
  };

  function buildNodes(rows, level, parentItem, ancestors) {
    var ordered = stableSort(rows, options.compare);
    var output = [];
    var item;
    var children;
    var childNodes;
    var nextAncestors;
    var matches;
    var rowNumber;
    var i;
    for (i = 0; i < ordered.length; i += 1) {
      item = ordered[i];
      if (item && typeof item === 'object' && ancestors.indexOf(item) >= 0) {
        continue;
      }
      rowNumber = nextRowNumber;
      nextRowNumber += 1;
      children = options.getChildren(item);
      nextAncestors = item && typeof item === 'object' ? ancestors.concat([item]) : ancestors;
      childNodes = buildNodes(children, level + 1, item, nextAncestors);
      matches = options.filtering !== true || options.matches(item) || childNodes.length > 0;
      if (matches) {
        output.push({
          item: item,
          level: level,
          parentItem: parentItem,
          children: children,
          childNodes: childNodes,
          rowNumber: rowNumber
        });
      }
    }
    return output;
  }

  function appendNodes(nodesToAppend, outputRows, outputInfos) {
    var node;
    var collapsed;
    var info;
    var i;
    for (i = 0; i < nodesToAppend.length; i += 1) {
      node = nodesToAppend[i];
      collapsed = options.filtering === true ? false : options.isCollapsed(node.item);
      info = {
        item: node.item,
        level: node.level,
        parentItem: node.parentItem,
        children: node.children,
        hasChildren: node.children.length > 0,
        collapsed: collapsed,
        filtered: options.filtering === true,
        rowNumber: node.rowNumber
      };
      outputRows.push(node.item);
      outputInfos.push(info);
      if (!collapsed && node.childNodes.length) {
        appendNodes(node.childNodes, outputRows, outputInfos);
      }
    }
  }
}

function stableSort(items, compare) {
  var rows = Array.isArray(items) ? items.slice() : [];
  if (typeof compare !== 'function') {
    return rows;
  }
  return rows.map(function(item, index) {
    return { item: item, index: index };
  }).sort(function(a, b) {
    return compare(a.item, b.item) || a.index - b.index;
  }).map(function(entry) {
    return entry.item;
  });
}

export function installFabGridTree(FabGrid, context) {
  var closest = context.closest;
  var getByBinding = context.getByBinding;
  var setByBinding = context.setByBinding;
  var toNumber = context.toNumber;

  FabGrid.prototype.isTreeGrid = function() {
    return typeof this.options.childItemsPath === 'function' ||
      (typeof this.options.childItemsPath === 'string' && this.options.childItemsPath.length > 0);
  };

  FabGrid.prototype.resetTreeState = function() {
    this._treeCollapsedItems = [];
    this._treeCollapsedSet = typeof WeakSet === 'function' ? new WeakSet() : null;
    this._treeRowInfos = [];
    this._treeInfoItems = [];
    this._treeInfoValues = [];
    this._treeInfoMap = typeof WeakMap === 'function' ? new WeakMap() : null;
    this._treeRootCount = 0;
  };

  FabGrid.prototype.rebuildTreeCollapsedSet = function() {
    var items = this._treeCollapsedItems || [];
    var set = typeof WeakSet === 'function' ? new WeakSet() : null;
    var i;
    if (set) {
      for (i = 0; i < items.length; i += 1) {
        if (items[i] && (typeof items[i] === 'object' || typeof items[i] === 'function')) {
          set.add(items[i]);
        }
      }
    }
    this._treeCollapsedSet = set;
  };

  FabGrid.prototype.getTreeChildren = function(item) {
    return getTreeChildren(item, this.options.childItemsPath, getByBinding, this);
  };

  FabGrid.prototype.ensureTreeChildren = function(item) {
    var path = this.options.childItemsPath;
    var children;
    if (!item) {
      return null;
    }
    if (typeof path === 'function') {
      children = path(item, this);
      return Array.isArray(children) ? children : null;
    }
    children = getByBinding(item, path);
    if (Array.isArray(children)) {
      return children;
    }
    if (typeof path !== 'string' || !path || typeof setByBinding !== 'function') {
      return null;
    }
    children = [];
    return setByBinding(item, path, children) ? children : null;
  };

  FabGrid.prototype.findTreeItemLocation = function(item) {
    var grid = this;
    return findTreeItemLocation(this.source, item, function(current) {
      return grid.getTreeChildren(current);
    });
  };

  FabGrid.prototype.isTreeItemDescendant = function(item, candidate) {
    var grid = this;
    return isTreeItemDescendant(item, candidate, function(current) {
      return grid.getTreeChildren(current);
    });
  };

  FabGrid.prototype.canMoveTreeItem = function(item, targetItem, position) {
    var path = this.options.childItemsPath;
    var children;
    if (!this.isTreeGrid() || !item || item === targetItem ||
      (targetItem && this.isTreeItemDescendant(item, targetItem))) {
      return false;
    }
    if (targetItem && !this.findTreeItemLocation(targetItem)) {
      return false;
    }
    if (targetItem && normalizeTreeDropPosition(position) === 'inside') {
      if (typeof path === 'function') {
        children = path(targetItem, this);
        return Array.isArray(children);
      }
      return typeof path === 'string' && path.length > 0;
    }
    return true;
  };

  FabGrid.prototype.moveTreeItem = function(item, targetItem, position, silent) {
    var grid = this;
    var result;
    if (!this.isTreeGrid()) {
      return false;
    }
    result = moveTreeItemInSource(
      this.source,
      item,
      targetItem,
      position,
      function(current) {
        return grid.getTreeChildren(current);
      },
      function(current) {
        return grid.ensureTreeChildren(current);
      }
    );
    if (!result) {
      return false;
    }
    if (result.parentItem) {
      this.setTreeItemCollapsed(result.parentItem, false);
    }
    if (!silent) {
      this.refreshTree();
    }
    return result;
  };

  FabGrid.prototype.insertTreeItem = function(item, parentItem, index, silent) {
    var destination;
    if (!this.isTreeGrid() || !item ||
      (parentItem && !this.findTreeItemLocation(parentItem)) || this.findTreeItemLocation(item)) {
      return false;
    }
    destination = parentItem ? this.ensureTreeChildren(parentItem) : this.source;
    if (!Array.isArray(destination)) {
      return false;
    }
    index = index == null ? destination.length : Math.max(0, Math.min(destination.length, Number(index) || 0));
    destination.splice(index, 0, item);
    if (parentItem) {
      this.setTreeItemCollapsed(parentItem, false);
    }
    if (!silent) {
      this.refreshTree();
    }
    return true;
  };

  FabGrid.prototype.removeTreeItem = function(item, silent) {
    var location;
    if (!this.isTreeGrid()) {
      return false;
    }
    location = this.findTreeItemLocation(item);
    if (!location) {
      return false;
    }
    location.items.splice(location.index, 1);
    this.setTreeItemCollapsed(item, false);
    if (!silent) {
      this.refreshTree();
    }
    return true;
  };

  FabGrid.prototype.isTreeItemCollapsed = function(item) {
    if (this._treeCollapsedSet && item && (typeof item === 'object' || typeof item === 'function')) {
      return this._treeCollapsedSet.has(item);
    }
    return this._treeCollapsedItems.indexOf(item) >= 0;
  };

  FabGrid.prototype.setTreeItemCollapsed = function(item, collapsed) {
    var index = this._treeCollapsedItems.indexOf(item);
    if (collapsed && index < 0) {
      this._treeCollapsedItems.push(item);
      if (this._treeCollapsedSet && item && (typeof item === 'object' || typeof item === 'function')) {
        this._treeCollapsedSet.add(item);
      }
    } else if (!collapsed && index >= 0) {
      this._treeCollapsedItems.splice(index, 1);
      if (this._treeCollapsedSet && item && (typeof item === 'object' || typeof item === 'function')) {
        this._treeCollapsedSet.delete(item);
      }
    }
  };

  FabGrid.prototype.createTreeView = function(rows, options) {
    var grid = this;
    options = options || {};
    var result = buildVisibleTreeRows(rows, {
      compare: options.compare,
      filtering: options.filtering,
      matches: options.matches,
      pagination: options.pagination,
      pageNumber: options.pageNumber,
      pageSize: options.pageSize,
      getChildren: function(item) {
        return grid.getTreeChildren(item);
      },
      isCollapsed: function(item) {
        return grid.isTreeItemCollapsed(item);
      }
    });
    this._treeRowInfos = result.infos;
    this._treeRootCount = result.totalRoots;
    this._treeInfoItems = [];
    this._treeInfoValues = [];
    this._treeInfoMap = typeof WeakMap === 'function' ? new WeakMap() : null;
    result.infos.forEach(function(info) {
      if (info.item && typeof info.item === 'object' && grid._treeInfoMap) {
        grid._treeInfoMap.set(info.item, info);
      } else {
        grid._treeInfoItems.push(info.item);
        grid._treeInfoValues.push(info);
      }
    });
    return result.rows;
  };

  FabGrid.prototype.getTreeRowInfo = function(rowOrItem) {
    var item = rowOrItem;
    var index;
    if (typeof rowOrItem === 'number') {
      return this._treeRowInfos[rowOrItem] || null;
    }
    if (item && typeof item === 'object' && this._treeInfoMap) {
      return this._treeInfoMap.get(item) || null;
    }
    index = this._treeInfoItems.indexOf(item);
    return index >= 0 ? this._treeInfoValues[index] : null;
  };

  FabGrid.prototype.getTreeRow = function(rowIndex) {
    var grid = this;
    var info = this.getTreeRowInfo(rowIndex);
    var descriptor;
    if (!info) {
      return null;
    }
    descriptor = {
      index: rowIndex,
      dataItem: info.item,
      level: info.level,
      parentItem: info.parentItem,
      hasChildren: info.hasChildren,
      rowNumber: info.rowNumber
    };
    Object.defineProperty(descriptor, 'isCollapsed', {
      enumerable: true,
      get: function() {
        return grid.isTreeItemCollapsed(info.item);
      },
      set: function(value) {
        grid.setTreeItemCollapsed(info.item, value === true);
        grid.refreshTree();
      }
    });
    return descriptor;
  };

  FabGrid.prototype.getTreeRowNumber = function(rowOrItem) {
    var info = this.getTreeRowInfo(rowOrItem);
    return info && info.rowNumber != null ? info.rowNumber : null;
  };

  FabGrid.prototype.getTreeColumnIndex = function() {
    var value = this.options.treeColumn;
    var column;
    if (!this.visibleColumns || !this.visibleColumns.length) {
      return -1;
    }
    if (value == null || value === '') {
      return 0;
    }
    if (typeof value === 'number') {
      return Math.max(0, Math.min(this.visibleColumns.length - 1, Math.floor(value)));
    }
    column = typeof value === 'object' ? value : this.getColumn(value);
    return column ? this.visibleColumns.indexOf(column) : 0;
  };

  FabGrid.prototype.isTreeColumn = function(column) {
    return this.isTreeGrid() && this.visibleColumns[this.getTreeColumnIndex()] === column;
  };

  FabGrid.prototype.hasExpandedTreeNode = function() {
    var info;
    var i;
    for (i = 0; i < this.view.length; i += 1) {
      info = this.getTreeRowInfo(i);
      if (info && info.hasChildren && !info.collapsed) {
        return true;
      }
    }
    return false;
  };

  FabGrid.prototype.getTreeContextMenuItem = function() {
    var collapse = this.hasExpandedTreeNode();
    return {
      action: collapse ? 'tree-collapse-all' : 'tree-expand-all',
      icon: collapse ? '▸' : '▾',
      label: this.getText(collapse ? 'tree.collapseAll' : 'tree.expandAll')
    };
  };

  FabGrid.prototype.handleTreeContextMenu = function(event) {
    var cell = closest(event.target, 'fg-tree-cell');
    var rowIndex;
    var colIndex;
    if (!cell) {
      return false;
    }
    rowIndex = toNumber(cell.getAttribute('data-row'), -1);
    colIndex = toNumber(cell.getAttribute('data-col'), -1);
    if (rowIndex < 0 || colIndex !== this.getTreeColumnIndex() || !this.getTreeRowInfo(rowIndex)) {
      return false;
    }
    event.preventDefault();
    event.stopPropagation();
    this.showTopLeftMenu(event.clientX, event.clientY, 'tree');
    return true;
  };

  FabGrid.prototype.renderTreeContextMenu = function() {
    var definition;
    var item;
    var icon;
    var label;
    if (!this.topLeftMenu) {
      return;
    }
    definition = this.getTreeContextMenuItem();
    item = document.createElement('button');
    icon = document.createElement('span');
    label = document.createElement('span');
    item.type = 'button';
    item.className = 'fg-top-left-menu-item';
    item.setAttribute('role', 'menuitem');
    item.setAttribute('data-action', definition.action);
    icon.className = 'fg-top-left-menu-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = definition.icon;
    label.className = 'fg-top-left-menu-label';
    label.textContent = definition.label;
    item.appendChild(icon);
    item.appendChild(label);
    this.topLeftMenu.setAttribute('aria-label', this.getText('tree.contextMenuAriaLabel'));
    this.topLeftMenu.innerHTML = '';
    this.topLeftMenu.appendChild(item);
  };

  FabGrid.prototype.handleTreeContextMenuAction = function(action) {
    var collapsed;
    if (action !== 'tree-collapse-all' && action !== 'tree-expand-all') {
      return false;
    }
    collapsed = action === 'tree-collapse-all';
    if (collapsed) {
      this.collapseGroupsToLevel(0);
    } else {
      this.expandAllTreeNodes();
    }
    this.emit('treeContextMenuAction', {
      tree: true,
      action: action,
      collapsed: collapsed
    });
    return true;
  };

  FabGrid.prototype.toggleTreeNode = function(rowIndex, collapsed) {
    var info = this.getTreeRowInfo(rowIndex);
    var item;
    var nextCollapsed;
    var args;
    var nextRow;
    if (!info || !info.hasChildren) {
      return false;
    }
    item = info.item;
    nextCollapsed = collapsed == null ? !this.isTreeItemCollapsed(item) : collapsed === true;
    args = {
      tree: true,
      row: rowIndex,
      rowIndex: rowIndex,
      item: item,
      dataItem: item,
      level: info.level,
      collapsed: nextCollapsed
    };
    if (this.emit('groupCollapsedChanging', args) === false) {
      return false;
    }
    this.selection.row = rowIndex;
    this.selectionAnchor = { row: rowIndex, col: this.selection.col };
    this.rowSelection = rowIndex;
    this._rowSelectionCleared = false;
    this.setTreeItemCollapsed(item, nextCollapsed);
    this.applyView();
    nextRow = this.view.indexOf(item);
    if (nextRow >= 0) {
      this.selection.row = nextRow;
      this.selectionAnchor = { row: nextRow, col: this.selection.col };
      this.rowSelection = nextRow;
      this._rowSelectionCleared = false;
    }
    this.clampSelection();
    this.render();
    args.row = nextRow;
    args.rowIndex = nextRow;
    args.collapsed = this.isTreeItemCollapsed(item);
    this.emit('groupCollapsedChanged', args);
    return true;
  };

  FabGrid.prototype.collapseGroupsToLevel = function(level) {
    var grid = this;
    var targetLevel = Math.max(0, Number(level) || 0);
    var collapsedItems = [];
    var visited = [];
    if (!this.isTreeGrid()) {
      return false;
    }
    walk(this.source, 0);
    this._treeCollapsedItems = collapsedItems;
    this.rebuildTreeCollapsedSet();
    this.applyView();
    this.clampSelection();
    this.render();
    return true;

    function walk(items, currentLevel) {
      var item;
      var children;
      var i;
      for (i = 0; i < items.length; i += 1) {
        item = items[i];
        if (item && typeof item === 'object' && visited.indexOf(item) >= 0) {
          continue;
        }
        if (item && typeof item === 'object') {
          visited.push(item);
        }
        children = grid.getTreeChildren(item);
        if (children.length && currentLevel >= targetLevel) {
          collapsedItems.push(item);
        }
        walk(children, currentLevel + 1);
      }
    }
  };

  FabGrid.prototype.expandAllTreeNodes = function() {
    if (!this.isTreeGrid()) {
      return false;
    }
    this._treeCollapsedItems = [];
    this.rebuildTreeCollapsedSet();
    this.applyView();
    this.clampSelection();
    this.render();
    return true;
  };

  FabGrid.prototype.refreshTree = function() {
    if (!this.isTreeGrid()) {
      return false;
    }
    this.applyView();
    this.clampSelection();
    this.emit('loadedRows', { rows: this.view, tree: true });
    this.refresh();
    return true;
  };

  FabGrid.prototype.setChildItemsPath = function(path, silent) {
    this.options.childItemsPath = path || null;
    this.resetTreeState();
    this.applyView();
    this.resetVerticalScroll();
    if (!silent) {
      this.refresh();
    }
    return this;
  };

  FabGrid.prototype.decorateTreeCell = function(cell, item, column, rowIndex) {
    var info;
    var expander;
    var content;
    var indent;
    if (!this.isTreeColumn(column)) {
      return;
    }
    info = this.getTreeRowInfo(rowIndex);
    if (!info) {
      return;
    }
    content = document.createElement('span');
    content.className = 'fg-tree-cell-content';
    while (cell.firstChild) {
      content.appendChild(cell.firstChild);
    }
    expander = document.createElement('span');
    expander.className = 'fg-tree-expander';
    if (info.hasChildren) {
      expander.setAttribute('role', 'button');
      expander.setAttribute('aria-expanded', info.collapsed ? 'false' : 'true');
      expander.setAttribute('aria-label', this.getText(info.collapsed ? 'aria.expandNode' : 'aria.collapseNode'));
      expander.textContent = info.collapsed ? '▸' : '▾';
    } else {
      expander.className += ' fg-tree-expander-placeholder';
      expander.setAttribute('aria-hidden', 'true');
    }
    cell.className += ' fg-tree-cell';
    indent = Math.max(0, Number(this.options.treeIndent) || 20);
    cell.style.setProperty('--fg-tree-level', String(info.level));
    cell.style.paddingLeft = (7 + info.level * indent) + 'px';
    cell.setAttribute('aria-level', String(info.level + 1));
    cell.insertBefore(expander, cell.firstChild);
    cell.appendChild(content);
  };

  FabGrid.prototype.getTreeAutoSizeExtra = function(item, column) {
    var info;
    var indent;
    if (!this.isTreeColumn(column)) {
      return 0;
    }
    info = this.getTreeRowInfo(item);
    indent = Math.max(0, Number(this.options.treeIndent) || 20);
    return info ? info.level * indent + 23 : 23;
  };

  FabGrid.prototype.handleTreeKeyDown = function(event, row, col) {
    var info;
    var parentRow;
    var nextInfo;
    if (!this.isTreeGrid() || col !== this.getTreeColumnIndex() ||
      event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
      (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) {
      return false;
    }
    info = this.getTreeRowInfo(row);
    if (!info) {
      return false;
    }
    if (event.key === 'ArrowRight') {
      if (info.hasChildren && info.collapsed) {
        event.preventDefault();
        this.toggleTreeNode(row, false);
        return true;
      }
      nextInfo = this.getTreeRowInfo(row + 1);
      if (info.hasChildren && nextInfo && nextInfo.level > info.level) {
        event.preventDefault();
        this.moveVertical(row + 1, col);
        return true;
      }
      return false;
    }
    if (info.hasChildren && !info.collapsed) {
      event.preventDefault();
      this.toggleTreeNode(row, true);
      return true;
    }
    parentRow = this.view.indexOf(info.parentItem);
    if (parentRow >= 0) {
      event.preventDefault();
      this.moveVertical(parentRow, col);
      return true;
    }
    return false;
  };

  Object.defineProperty(FabGrid.prototype, 'childItemsPath', {
    configurable: true,
    enumerable: true,
    get: function() {
      return this.options.childItemsPath;
    },
    set: function(value) {
      this.setChildItemsPath(value);
    }
  });
}
