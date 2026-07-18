var activeRowDrag = null;
var rowDragGrids = [];

export function calculateRowDropIndicatorWidth(bodyWidth, fixedLeftWidth, totalColumnWidth, verticalScrollbarGutterSize) {
  var availableWidth = Math.max(0, Number(bodyWidth) || 0) -
    Math.max(0, Number(verticalScrollbarGutterSize) || 0);
  var columnAreaWidth = Math.max(0, Number(fixedLeftWidth) || 0) +
    Math.max(0, Number(totalColumnWidth) || 0);
  return Math.max(0, Math.min(availableWidth, columnAreaWidth));
}

export function installFabGridDrag(FabGrid, context) {
  var bind = context.bind;
  var closest = context.closest;
  var toNumber = context.toNumber;

  FabGrid.prototype.canDragRows = function() {
    var mode = this.options.allowDragging;
    if (mode === true) {
      return this.options.remote !== true;
    }
    mode = mode == null ? '' : String(mode).toLowerCase();
    return this.options.remote !== true &&
      (mode === 'rows' || mode === 'row' || mode === 'all');
  };

  FabGrid.prototype.bindRowDragEvents = function() {
    this._boundRowPointerDown = bind(this, this.handleRowPointerDown);
    this._boundRowPointerMove = bind(this, this.handleRowPointerMove);
    this._boundRowPointerUp = bind(this, this.handleRowPointerUp);
    this._boundRowPointerCancel = bind(this, this.handleRowPointerCancel);
    this._boundRowDragClick = bind(this, this.handleRowDragClick);
    this.root.addEventListener('pointerdown', this._boundRowPointerDown);
    this.root.addEventListener('click', this._boundRowDragClick, true);
    rowDragGrids.push(this);
  };

  FabGrid.prototype.bindActiveRowDragEvents = function() {
    if (this.activeRowDragEventsBound) {
      return;
    }
    document.addEventListener('pointermove', this._boundRowPointerMove);
    document.addEventListener('pointerup', this._boundRowPointerUp);
    document.addEventListener('pointercancel', this._boundRowPointerCancel);
    this.activeRowDragEventsBound = true;
  };

  FabGrid.prototype.unbindActiveRowDragEvents = function() {
    if (!this.activeRowDragEventsBound) {
      return;
    }
    document.removeEventListener('pointermove', this._boundRowPointerMove);
    document.removeEventListener('pointerup', this._boundRowPointerUp);
    document.removeEventListener('pointercancel', this._boundRowPointerCancel);
    this.activeRowDragEventsBound = false;
  };

  FabGrid.prototype.unbindRowDragEvents = function() {
    var index;
    if (!this.root || !this._boundRowPointerDown) {
      return;
    }
    this.root.removeEventListener('pointerdown', this._boundRowPointerDown);
    this.root.removeEventListener('click', this._boundRowDragClick, true);
    this.unbindActiveRowDragEvents();
    this.clearRowDropIndicator();
    if (activeRowDrag && activeRowDrag.sourceGrid === this) {
      this.finishRowPointerDrag(activeRowDrag);
    }
    index = rowDragGrids.indexOf(this);
    if (index >= 0) {
      rowDragGrids.splice(index, 1);
    }
  };

  FabGrid.prototype.applyRowDraggable = function(cell, rowIndex) {
    var item = this.view[rowIndex];
    if (!cell || !this.canDragRows() || this.isRowGroup(item) || this.isRowGroupFooter(item)) {
      return;
    }
    cell.className += ' fg-row-draggable';
  };

  FabGrid.prototype.isRowDragInteractiveTarget = function(target) {
    var tagName = target && target.tagName ? target.tagName.toLowerCase() : '';
    return tagName === 'button' || tagName === 'input' || tagName === 'select' ||
      tagName === 'textarea' || closest(target, 'fg-tree-expander') || closest(target, 'fg-editor');
  };

  FabGrid.prototype.handleRowPointerDown = function(event) {
    var rowElement = closest(event.target, 'fg-cell') || closest(event.target, 'fg-row-header-cell');
    var rowIndex;
    var item;
    var info;
    if (!this.canDragRows() || !rowElement || this.isRowDragInteractiveTarget(event.target) ||
      (event.button != null && event.button !== 0)) {
      return;
    }
    rowIndex = toNumber(rowElement.getAttribute('data-row'), -1);
    item = this.view[rowIndex];
    if (rowIndex < 0 || item == null || this.isRowGroup(item) || this.isRowGroupFooter(item)) {
      return;
    }
    info = this.isTreeGrid() ? this.getTreeRowInfo(item) : null;
    activeRowDrag = {
      sourceGrid: this,
      sourceRow: rowIndex,
      item: item,
      sourceTreeInfo: info,
      sourceElement: rowElement,
      startX: event.clientX,
      startY: event.clientY,
      pointerId: event.pointerId,
      active: false,
      targetGrid: null,
      target: null
    };
    this.rowDragState = activeRowDrag;
    this.bindActiveRowDragEvents();
  };

  FabGrid.prototype.getRowDragText = function(item) {
    var column = this.visibleColumns[this.isTreeGrid() ? this.getTreeColumnIndex() : 0];
    var value = column && column.binding ? context.getByBinding(item, column.binding) : '';
    return value == null || value === '' ? this.getText('aria.rowDragItem') : String(value);
  };

  FabGrid.prototype.activateRowPointerDrag = function(state, event) {
    var args = {
      phase: 'start',
      sourceGrid: this,
      targetGrid: null,
      row: state.sourceRow,
      rowIndex: state.sourceRow,
      item: state.item,
      dataItem: state.item,
      level: state.sourceTreeInfo ? state.sourceTreeInfo.level : 0,
      tree: this.isTreeGrid()
    };
    if (this.emit('draggingRow', args) === false) {
      return false;
    }
    state.active = true;
    this.root.classList.add('fg-row-dragging');
    state.sourceElement.classList.add('fg-row-drag-source');
    this.showRowDragPreview(state, event);
    document.body.classList.add('fg-row-drag-document');
    return true;
  };

  FabGrid.prototype.showRowDragPreview = function(state, event) {
    var sourceRect = state.sourceElement.getBoundingClientRect();
    var preview = document.createElement('div');
    preview.className = 'fg-row-drag-preview';
    preview.textContent = this.getRowDragText(state.item);
    preview.style.width = Math.max(140, Math.min(260, sourceRect.width)) + 'px';
    document.body.appendChild(preview);
    state.preview = preview;
    this.updateRowDragPreview(state, event);
  };

  FabGrid.prototype.updateRowDragPreview = function(state, event) {
    if (!state.preview) {
      return;
    }
    state.preview.style.left = event.clientX + 14 + 'px';
    state.preview.style.top = event.clientY + 10 + 'px';
  };

  FabGrid.prototype.getRowDragGridAtPoint = function(clientX, clientY) {
    var grid;
    var rect;
    var i;
    for (i = rowDragGrids.length - 1; i >= 0; i -= 1) {
      grid = rowDragGrids[i];
      if (grid.disposed || !grid.canDragRows()) {
        continue;
      }
      rect = grid.root.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        return grid;
      }
    }
    return null;
  };

  FabGrid.prototype.getRowDropTargetAtPoint = function(clientX, clientY, state) {
    var targetElement = document.elementFromPoint(clientX, clientY);
    var rowElement = closest(targetElement, 'fg-cell') || closest(targetElement, 'fg-row-header-cell');
    var rowIndex;
    var item;
    var rect;
    var ratio;
    var position;
    if (!state || !this.canDragRows()) {
      return null;
    }
    if (!rowElement) {
      if (closest(targetElement, 'fg-body') || closest(targetElement, 'fg-body-scroll')) {
        return {
          row: this.view.length,
          rowIndex: this.view.length,
          item: null,
          targetItem: null,
          position: 'after',
          element: null
        };
      }
      return null;
    }
    rowIndex = toNumber(rowElement.getAttribute('data-row'), -1);
    item = this.view[rowIndex];
    if (rowIndex < 0 || item == null || item === state.item ||
      this.isRowGroup(item) || this.isRowGroupFooter(item)) {
      return null;
    }
    rect = rowElement.getBoundingClientRect();
    ratio = rect.height ? (clientY - rect.top) / rect.height : 0.5;
    if (this.isTreeGrid()) {
      position = ratio < 0.25 ? 'before' : ratio > 0.75 ? 'after' : 'inside';
      if (!this.canMoveTreeItem(state.item, item, position)) {
        return null;
      }
    } else {
      position = ratio < 0.5 ? 'before' : 'after';
    }
    return {
      row: rowIndex,
      rowIndex: rowIndex,
      item: item,
      targetItem: item,
      position: position,
      element: rowElement
    };
  };

  FabGrid.prototype.updateRowPointerDropTarget = function(state, target) {
    var changed;
    var args;
    if (!target) {
      this.clearRowDropIndicator();
      state.targetGrid = null;
      state.target = null;
      return false;
    }
    changed = !this.rowDropTarget || this.rowDropTarget.item !== target.item ||
      this.rowDropTarget.position !== target.position;
    if (changed) {
      args = this.createRowDragEventArgs(state, target, 'over');
      if (this.emit('draggingRow', args) === false) {
        this.clearRowDropIndicator();
        state.targetGrid = null;
        state.target = null;
        return false;
      }
    }
    state.targetGrid = this;
    state.target = target;
    this.rowDropTarget = target;
    this.showRowDropIndicator(target);
    return true;
  };

  FabGrid.prototype.handleRowPointerMove = function(event) {
    var state = activeRowDrag;
    var targetGrid;
    var target;
    if (!state || state.sourceGrid !== this ||
      (state.pointerId != null && event.pointerId != null && state.pointerId !== event.pointerId)) {
      return;
    }
    if (!state.active) {
      if (Math.abs(event.clientX - state.startX) < 5 && Math.abs(event.clientY - state.startY) < 5) {
        return;
      }
      if (!this.activateRowPointerDrag(state, event)) {
        this.finishRowPointerDrag(state);
        return;
      }
    }
    event.preventDefault();
    this.updateRowDragPreview(state, event);
    targetGrid = this.getRowDragGridAtPoint(event.clientX, event.clientY);
    if (state.targetGrid && state.targetGrid !== targetGrid) {
      state.targetGrid.clearRowDropIndicator();
    }
    if (!targetGrid) {
      state.targetGrid = null;
      state.target = null;
      return;
    }
    target = targetGrid.getRowDropTargetAtPoint(event.clientX, event.clientY, state);
    targetGrid.updateRowPointerDropTarget(state, target);
  };

  FabGrid.prototype.handleRowPointerUp = function(event) {
    var state = activeRowDrag;
    if (!state || state.sourceGrid !== this ||
      (state.pointerId != null && event.pointerId != null && state.pointerId !== event.pointerId)) {
      return;
    }
    if (state.active) {
      event.preventDefault();
      this.suppressRowDragClickUntil = Date.now() + 120;
      if (state.targetGrid && state.target) {
        state.completed = state.targetGrid.performRowDrop(state, state.target);
      }
    }
    this.finishRowPointerDrag(state);
  };

  FabGrid.prototype.handleRowPointerCancel = function(event) {
    var state = activeRowDrag;
    if (!state || state.sourceGrid !== this ||
      (state.pointerId != null && event.pointerId != null && state.pointerId !== event.pointerId)) {
      return;
    }
    this.finishRowPointerDrag(state);
  };

  FabGrid.prototype.handleRowDragClick = function(event) {
    if (this.suppressRowDragClickUntil && Date.now() <= this.suppressRowDragClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      this.suppressRowDragClickUntil = 0;
    }
  };

  FabGrid.prototype.finishRowPointerDrag = function(state) {
    if (state && state.targetGrid) {
      state.targetGrid.clearRowDropIndicator();
    }
    if (state && state.sourceElement) {
      state.sourceElement.classList.remove('fg-row-drag-source');
    }
    if (state && state.preview && state.preview.parentNode) {
      state.preview.parentNode.removeChild(state.preview);
    }
    if (state && state.sourceGrid) {
      state.sourceGrid.root.classList.remove('fg-row-dragging');
      state.sourceGrid.rowDragState = null;
      state.sourceGrid.unbindActiveRowDragEvents();
    }
    document.body.classList.remove('fg-row-drag-document');
    activeRowDrag = null;
  };

  FabGrid.prototype.createRowDragEventArgs = function(state, target, phase) {
    return {
      phase: phase,
      sourceGrid: state.sourceGrid,
      targetGrid: this,
      from: state.sourceRow,
      to: target.row,
      row: target.row,
      rowIndex: target.row,
      item: state.item,
      dataItem: state.item,
      targetItem: target.item,
      position: target.position,
      tree: this.isTreeGrid()
    };
  };

  FabGrid.prototype.performRowDrop = function(state, target) {
    var sourceGrid = state.sourceGrid;
    var targetGrid = this;
    var result;
    var removed;
    var args;
    if (sourceGrid === targetGrid) {
      result = targetGrid.isTreeGrid() ?
        targetGrid.moveTreeItem(state.item, target.item, target.position, true) :
        targetGrid.moveFlatRowItem(state.item, target.item, target.position, true);
    } else {
      result = targetGrid.isTreeGrid() ?
        targetGrid.moveTreeItem(state.item, target.item, target.position, true) :
        targetGrid.insertFlatRowItem(state.item, target.item, target.position, true);
      if (result) {
        removed = sourceGrid.removeRowItem(state.item, true);
        if (!removed) {
          targetGrid.removeRowItem(state.item, true);
          result = false;
        }
      }
    }
    if (!result) {
      return false;
    }
    sourceGrid.refreshRowsAfterDrop();
    if (sourceGrid !== targetGrid) {
      targetGrid.refreshRowsAfterDrop();
    }
    args = targetGrid.createRowDragEventArgs(state, target, 'drop');
    args.result = result;
    args.role = sourceGrid === targetGrid ? 'both' : 'target';
    targetGrid.emit('draggedRow', args);
    if (sourceGrid !== targetGrid) {
      args.role = 'source';
      sourceGrid.emit('draggedRow', args);
    }
    return true;
  };

  FabGrid.prototype.moveFlatRowItem = function(item, targetItem, position, silent) {
    var sourceIndex = this.source.indexOf(item);
    var targetIndex;
    if (sourceIndex < 0 || item === targetItem) {
      return false;
    }
    this.source.splice(sourceIndex, 1);
    targetIndex = targetItem == null ? this.source.length : this.source.indexOf(targetItem);
    if (targetIndex < 0) {
      this.source.splice(sourceIndex, 0, item);
      return false;
    }
    if (position === 'after') {
      targetIndex += 1;
    }
    this.source.splice(targetIndex, 0, item);
    if (!silent) {
      this.refreshRowsAfterDrop();
    }
    return {
      item: item,
      index: targetIndex,
      position: position
    };
  };

  FabGrid.prototype.insertFlatRowItem = function(item, targetItem, position, silent) {
    var targetIndex;
    if (!item || this.source.indexOf(item) >= 0) {
      return false;
    }
    targetIndex = targetItem == null ? this.source.length : this.source.indexOf(targetItem);
    if (targetIndex < 0) {
      return false;
    }
    if (position === 'after') {
      targetIndex += 1;
    }
    this.source.splice(targetIndex, 0, item);
    if (!silent) {
      this.refreshRowsAfterDrop();
    }
    return {
      item: item,
      index: targetIndex,
      position: position
    };
  };

  FabGrid.prototype.removeRowItem = function(item, silent) {
    var index;
    if (this.isTreeGrid()) {
      return this.removeTreeItem(item, silent);
    }
    index = this.source.indexOf(item);
    if (index < 0) {
      return false;
    }
    this.source.splice(index, 1);
    if (!silent) {
      this.refreshRowsAfterDrop();
    }
    return true;
  };

  FabGrid.prototype.refreshRowsAfterDrop = function() {
    if (this.isTreeGrid()) {
      this.refreshTree();
      return;
    }
    this.applyView();
    this.clampSelection();
    this.refresh();
  };

  FabGrid.prototype.showRowDropIndicator = function(target) {
    var rootRect;
    var bodyRect;
    var rowRect;
    var fixedLeftWidth;
    var verticalScrollbarGutterSize;
    var indicatorWidth;
    var top;
    if (!this.rowDropIndicator) {
      this.rowDropIndicator = document.createElement('div');
      this.rowDropIndicator.setAttribute('aria-hidden', 'true');
      this.root.appendChild(this.rowDropIndicator);
    }
    rootRect = this.root.getBoundingClientRect();
    bodyRect = this.body.getBoundingClientRect();
    rowRect = target.element ? target.element.getBoundingClientRect() : null;
    fixedLeftWidth = typeof this.getFixedLeftWidth === 'function' ? this.getFixedLeftWidth() : 0;
    verticalScrollbarGutterSize = typeof this.getVerticalScrollbarGutterSize === 'function' ?
      this.getVerticalScrollbarGutterSize() :
      0;
    indicatorWidth = calculateRowDropIndicatorWidth(
      bodyRect.width,
      fixedLeftWidth,
      this.totalWidth,
      verticalScrollbarGutterSize
    );
    this.rowDropIndicator.className = 'fg-row-drop-indicator fg-row-drop-' + target.position;
    this.rowDropIndicator.style.left = Math.max(0, bodyRect.left - rootRect.left) + 'px';
    this.rowDropIndicator.style.width = indicatorWidth + 'px';
    if (target.position === 'inside' && rowRect) {
      this.rowDropIndicator.style.top = rowRect.top - rootRect.top + 'px';
      this.rowDropIndicator.style.height = rowRect.height + 'px';
    } else {
      top = rowRect ? (target.position === 'before' ? rowRect.top : rowRect.bottom) : bodyRect.bottom;
      this.rowDropIndicator.style.top = top - rootRect.top - 1 + 'px';
      this.rowDropIndicator.style.height = '2px';
    }
    this.rowDropIndicator.style.display = 'block';
    this.root.classList.add('fg-row-drop-active');
  };

  FabGrid.prototype.clearRowDropIndicator = function() {
    if (this.rowDropIndicator) {
      this.rowDropIndicator.style.display = 'none';
    }
    if (this.root) {
      this.root.classList.remove('fg-row-drop-active');
    }
    this.rowDropTarget = null;
  };
}
