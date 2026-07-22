export function applyHeaderCellStyle(targetStyle, customStyle) {
  var key;
  var value;
  if (!targetStyle || !customStyle) {
    return;
  }
  for (key in customStyle) {
    if (!Object.prototype.hasOwnProperty.call(customStyle, key)) {
      continue;
    }
    value = customStyle[key];
    if (value == null) {
      continue;
    }
    if ((key.indexOf('-') >= 0 || key.indexOf('--') === 0) && typeof targetStyle.setProperty === 'function') {
      targetStyle.setProperty(key, String(value));
    } else {
      targetStyle[key] = String(value);
    }
  }
}

export function getSizeLayerWidth(fixedLeftWidth, frozenWidth, scrollableWidth, frozenRightWidth) {
  return Math.max(0, fixedLeftWidth + frozenWidth + scrollableWidth + frozenRightWidth);
}

export function installFabGridView(FabGrid, context) {
  var CellType = context.CellType;
  var DEFAULT_OPTIONS = context.DEFAULT_OPTIONS;
  var clamp = context.clamp;
  var closest = context.closest;
  var escapeHtml = context.escapeHtml;
  var findColumnByOffset = context.findColumnByOffset;
  var formatMaskText = context.formatMaskText;
  var formatNumberDisplayText = context.formatNumberDisplayText;
  var getByBinding = context.getByBinding;
  var getColumnEditorConfig = context.getColumnEditorConfig;
  var getColumnSearchIconConfigs = context.getColumnSearchIconConfigs;
  var getColumnSearchKey = context.getColumnSearchKey;
  var getColumnSearchOperatorSymbol = context.getColumnSearchOperatorSymbol;
  var getActiveFilterMode = context.getActiveFilterMode;
  var getComboboxTextByValue = context.getComboboxTextByValue;
  var getEditorMask = context.getEditorMask;
  var getExplicitEditorMask = context.getExplicitEditorMask;
  var getIconConfigWidth = context.getIconConfigWidth;
  var getMaskOptions = context.getMaskOptions;
  var getNumberPrecision = context.getNumberPrecision;
  var hasClass = context.hasClass;
  var hasExcelFilterEntries = context.hasExcelFilterEntries;
  var isDateLikeEditorType = context.isDateLikeEditorType;
  var measureNativeScrollbarGutters = context.measureNativeScrollbarGutters;
  var normalizeClassName = context.normalizeClassName;
  var normalizeColorValue = context.normalizeColorValue;
  var normalizeColumnSearchOperator = context.normalizeColumnSearchOperator;
  var normalizeAlternatingRowStep = context.normalizeAlternatingRowStep;
  var normalizeGridOptions = context.normalizeGridOptions;
  var normalizeJustifyContent = context.normalizeJustifyContent;
  var normalizeNonNegativeInteger = context.normalizeNonNegativeInteger;
  var normalizePositiveNumber = context.normalizePositiveNumber;
  var normalizeTextAlign = context.normalizeTextAlign;
  var shouldUseThousandsSeparator = context.shouldUseThousandsSeparator;
  var toNumber = context.toNumber;
  var trimText = context.trimText;
  var CELL_TEMPLATE_LAYOUT_STYLES = {
    position: true,
    inset: true,
    'inset-block': true,
    'inset-block-end': true,
    'inset-block-start': true,
    'inset-inline': true,
    'inset-inline-end': true,
    'inset-inline-start': true,
    top: true,
    right: true,
    bottom: true,
    left: true,
    width: true,
    'min-width': true,
    'max-width': true,
    height: true,
    'min-height': true,
    'max-height': true,
    transform: true,
    translate: true,
    rotate: true,
    scale: true,
    'box-sizing': true
  };

  function captureCellInlineStyle(style) {
    var declarations = Object.create(null);
    var order = [];
    var i;
    var name;
    for (i = 0; i < style.length; i += 1) {
      name = style.item(i);
      order.push(name);
      declarations[name] = {
        value: style.getPropertyValue(name),
        priority: style.getPropertyPriority(name)
      };
    }
    return {
      cssText: style.cssText,
      declarations: declarations,
      order: order
    };
  }

  function restoreCellTemplateStyle(cell, originalStyle) {
    var currentStyle = captureCellInlineStyle(cell.style);
    var customStyles = [];
    var original;
    var current;
    var name;
    var i;
    for (i = 0; i < currentStyle.order.length; i += 1) {
      name = currentStyle.order[i];
      if (CELL_TEMPLATE_LAYOUT_STYLES[name]) {
        continue;
      }
      original = originalStyle.declarations[name];
      current = currentStyle.declarations[name];
      if (!original || original.value !== current.value || original.priority !== current.priority) {
        customStyles.push({
          name: name,
          value: current.value,
          priority: current.priority
        });
      }
    }
    cell.style.cssText = originalStyle.cssText;
    for (i = 0; i < customStyles.length; i += 1) {
      cell.style.setProperty(customStyles[i].name, customStyles[i].value, customStyles[i].priority);
    }
  }

  function findCellTemplateExpressionEnd(source, start) {
    var depth = 1;
    var quote = '';
    var escaped = false;
    var i;
    var character;
    for (i = start; i < source.length; i += 1) {
      character = source.charAt(i);
      if (quote) {
        if (escaped) {
          escaped = false;
        } else if (character === '\\') {
          escaped = true;
        } else if (character === quote) {
          quote = '';
        }
      } else if (character === '"' || character === "'" || character === '`') {
        quote = character;
      } else if (character === '{') {
        depth += 1;
      } else if (character === '}') {
        depth -= 1;
        if (depth === 0) {
          return i;
        }
      }
    }
    return -1;
  }

  function compileCellTemplateExpression(expression) {
    return new Function(
      'ctx',
      '"use strict"; var value = ctx.value, text = ctx.text, col = ctx.col, row = ctx.row, item = ctx.item; ' +
        'return (' + expression + ');'
    );
  }

  function compileCellTemplateString(template) {
    var source = String(template);
    var parts = [];
    var index = 0;
    var marker;
    var end;
    var expression;
    while (index < source.length) {
      marker = source.indexOf('${', index);
      if (marker < 0) {
        parts.push(source.slice(index));
        break;
      }
      if (marker > index) {
        parts.push(source.slice(index, marker));
      }
      end = findCellTemplateExpressionEnd(source, marker + 2);
      if (end < 0) {
        throw new SyntaxError('Unclosed cellTemplate expression.');
      }
      expression = source.slice(marker + 2, end).trim();
      parts.push(compileCellTemplateExpression(expression));
      index = end + 1;
    }
    if (!source.length) {
      parts.push('');
    }
    return function(ctx) {
      var output = '';
      var value;
      var i;
      for (i = 0; i < parts.length; i += 1) {
        if (typeof parts[i] === 'function') {
          value = parts[i](ctx);
          output += value == null ? '' : String(value);
        } else {
          output += parts[i];
        }
      }
      return output;
    };
  }

  FabGrid.prototype.updateLayout = function() {
    var i;
    var left = 0;
    var visibleColumns = [];
    var frozenCount;
    var frozenRightCount;

    normalizeGridOptions(this.options);
    this.emit('updatingLayout', {});
    for (i = 0; i < this.columns.length; i += 1) {
      if (this.columns[i].visible !== false) {
        visibleColumns.push(this.columns[i]);
      }
    }
    this.visibleColumns = visibleColumns;
    frozenCount = Math.min(normalizeNonNegativeInteger(this.options.frozenColumns, 0), visibleColumns.length);
    frozenRightCount = Math.min(
      normalizeNonNegativeInteger(this.options.frozenRightColumns, 0),
      Math.max(0, visibleColumns.length - frozenCount)
    );
    this._frozenColumns = frozenCount;
    this._frozenRightColumns = frozenRightCount;
    this.columnOffsets = [];

    for (i = 0; i < visibleColumns.length; i += 1) {
      visibleColumns[i]._viewIndex = i;
      visibleColumns[i]._left = left;
      this.columnOffsets.push(left);
      left += visibleColumns[i]._width;
    }

    this.totalWidth = left;
    this.scrollableColumnEnd = Math.max(frozenCount, visibleColumns.length - frozenRightCount);
    this.frozenWidth = frozenCount > 0 ? visibleColumns[frozenCount - 1]._left + visibleColumns[frozenCount - 1]._width : 0;
    this.frozenRightStartLeft = frozenRightCount > 0 && visibleColumns[this.scrollableColumnEnd] ? visibleColumns[this.scrollableColumnEnd]._left : this.totalWidth;
    this.frozenRightWidth = frozenRightCount > 0 ? this.totalWidth - this.frozenRightStartLeft : 0;
    this.scrollableWidth = Math.max(0, this.totalWidth - this.frozenWidth - this.frozenRightWidth);
    this._layoutReadyForRender = true;
    this.emit('updatedLayout', {});
  };

  FabGrid.prototype.resetScroll = function() {
    if (this.bodyScroll) {
      this.bodyScroll.scrollTop = 0;
      this.bodyScroll.scrollLeft = 0;
    }
  };

  FabGrid.prototype.resetVerticalScroll = function() {
    if (this.bodyScroll) {
      this.bodyScroll.scrollTop = 0;
    }
  };

  FabGrid.prototype.scheduleRender = function() {
    var self = this;
    if (this.raf || this.disposed) {
      return;
    }
    this.raf = requestAnimationFrame(function() {
      self.raf = 0;
      self.render();
    });
  };

  FabGrid.prototype.handleScroll = function() {
    this.hideInvalidTip();
    if (this.isFilterMenuOpen()) {
      this.hideFilterMenu();
    }
    if (this.isColumnChooserOpen()) {
      this.hideColumnChooser();
    }
    if (this.isDateboxPanelOpen()) {
      this.hideDateboxPanel();
    }
    if (this.isComboboxPanelOpen()) {
      this.hideComboboxPanel();
    }
    if (this.isColorPanelOpen()) {
      this.hideColorPanel();
    }
    this.updateScrollState();
    this.syncFixedPaneScrollOffset();
    this.syncHeaderFooterScrollPosition();
    this.updateHorizontalScrollbar();
    this.updateVerticalScrollbar();
    if (this.shouldRenderScrollImmediately()) {
      if (this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
      }
      this.render(true);
    } else if (this.options.syncScrollRender === false) {
      this.scheduleRender();
    }
    if (this.editing) {
      this.positionEditor();
    }
    this.emit('scrollPositionChanged', {
      scrollTop: this.bodyScroll.scrollTop,
      scrollLeft: this.bodyScroll.scrollLeft
    });
  };

  FabGrid.prototype.updateScrollState = function() {
    var top = this.bodyScroll ? this.bodyScroll.scrollTop : 0;
    var left = this.bodyScroll ? this.bodyScroll.scrollLeft : 0;
    var rowHeight = Math.max(1, toNumber(this.options.rowHeight, 32));
    var maxExtraRows = Math.max(0, toNumber(this.options.fastScrollOverscanRows, 64));
    var rowDelta = Math.ceil(Math.abs(top - this.scrollState.top) / rowHeight);
    var targetExtraRows = Math.min(maxExtraRows, rowDelta * 2);
    if (top > this.scrollState.top) {
      this.scrollState.directionY = 1;
    } else if (top < this.scrollState.top) {
      this.scrollState.directionY = -1;
    }
    this.scrollState.extraRows = Math.max(targetExtraRows, Math.floor(this.scrollState.extraRows * 0.65));
    this.scrollState.top = top;
    this.scrollState.left = left;
  };

  FabGrid.prototype.syncFixedPaneScrollOffset = function() {
    var offset;
    var transform;
    if (this.options.syncScrollRender === false || !this.bodyScroll) {
      return;
    }
    offset = this.renderedScrollTop - this.bodyScroll.scrollTop;
    transform = offset ? 'translate3d(0,' + offset + 'px,0)' : '';
    this.frozenLayer.style.transform = transform;
    this.frozenRightLayer.style.transform = transform;
    this.rowHeaderLayer.style.transform = transform;
    this.selectionLayer.style.transform = transform;
  };

  FabGrid.prototype.syncHeaderFooterScrollPosition = function() {
    var scrollLeft;
    var transform;
    if (!this.bodyScroll) {
      return;
    }
    this.headerScroll.scrollLeft = 0;
    this.footerScroll.scrollLeft = 0;
    if (this.useScrollLinkedHorizontal) {
      return;
    }
    scrollLeft = this.bodyScroll.scrollLeft;
    transform = scrollLeft ? 'translate3d(' + (-scrollLeft) + 'px,0,0)' : '';
    this.headerCanvas.style.transform = transform;
    this.footerCanvas.style.transform = transform;
  };

  FabGrid.prototype.updateScrollLinkedHorizontalDistance = function() {
    var maxScrollLeft;
    if (!this.useScrollLinkedHorizontal || !this.bodyScroll) {
      return;
    }
    maxScrollLeft = Math.max(0, this.bodyScroll.scrollWidth - this.bodyScroll.clientWidth);
    this.root.style.setProperty('--fg-scroll-linked-horizontal-distance', (-maxScrollLeft) + 'px');
  };

  FabGrid.prototype.scheduleScrollLinkedHorizontalDistanceUpdate = function() {
    var self = this;
    if (!this.useScrollLinkedHorizontal || !this.bodyScroll || this.scrollLinkedHorizontalRaf || this.disposed) {
      return;
    }
    this.scrollLinkedHorizontalRaf = requestAnimationFrame(function() {
      self.scrollLinkedHorizontalRaf = 0;
      if (!self.disposed) {
        self.updateScrollLinkedHorizontalDistance();
      }
    });
  };

  FabGrid.prototype.resetFixedPaneScrollOffset = function() {
    this.renderedScrollTop = this.bodyScroll ? this.bodyScroll.scrollTop : 0;
    this.frozenLayer.style.transform = '';
    this.frozenRightLayer.style.transform = '';
    this.rowHeaderLayer.style.transform = '';
    this.selectionLayer.style.transform = '';
  };

  FabGrid.prototype.updateVerticalScrollbar = function(metrics, totalHeight, bodyPaneBottom) {
    var footerHeight;
    var scrollbarGutterSize;
    var footerOffsetBottom;
    var trackHeight;
    var contentHeight;
    var maxScrollTop;
    var thumbHeight;
    var maxThumbTop;
    var thumbTop;
    if (!this.verticalScrollbar || !this.verticalScrollbarThumb || !this.bodyScroll) {
      return;
    }
    metrics = metrics || this.getViewportMetrics();
    totalHeight = totalHeight == null ? this.view.length * this.options.rowHeight : totalHeight;
    if (bodyPaneBottom == null) {
      footerHeight = this.getFooterHeight();
      scrollbarGutterSize = this.getScrollbarGutterSize();
      footerOffsetBottom = footerHeight > 0 && totalHeight < metrics.contentHeight ?
        Math.max(0, metrics.height - scrollbarGutterSize - totalHeight - footerHeight) :
        scrollbarGutterSize;
      bodyPaneBottom = footerOffsetBottom + footerHeight;
    }
    trackHeight = Math.max(0, metrics.height - bodyPaneBottom);
    contentHeight = Math.max(0, metrics.contentHeight);
    maxScrollTop = Math.max(0, totalHeight - contentHeight);
    if (trackHeight <= 0 || maxScrollTop <= 0) {
      this.verticalScrollbar.style.display = 'none';
      return;
    }
    thumbHeight = Math.max(24, Math.min(trackHeight, Math.round(trackHeight * contentHeight / Math.max(contentHeight, totalHeight))));
    maxThumbTop = Math.max(0, trackHeight - thumbHeight);
    thumbTop = maxThumbTop > 0 ? Math.round((this.bodyScroll.scrollTop / maxScrollTop) * maxThumbTop) : 0;
    this.verticalScrollbar.style.display = 'block';
    this.verticalScrollbar.style.bottom = bodyPaneBottom + 'px';
    this.verticalScrollbarThumb.style.height = thumbHeight + 'px';
    this.verticalScrollbarThumb.style.transform = 'translate3d(0,' + thumbTop + 'px,0)';
  };

  FabGrid.prototype.updateHorizontalScrollbar = function() {
    var trackWidth;
    var contentWidth;
    var maxScrollLeft;
    var thumbWidth;
    var maxThumbLeft;
    var thumbLeft;
    if (!this.horizontalScrollbar || !this.horizontalScrollbarThumb || !this.bodyScroll) {
      return;
    }
    trackWidth = Math.max(0, this.bodyScroll.clientWidth);
    contentWidth = Math.max(trackWidth, this.bodyScroll.scrollWidth);
    maxScrollLeft = Math.max(0, contentWidth - trackWidth);
    if (trackWidth <= 0 || maxScrollLeft <= 0) {
      this.horizontalScrollbar.style.display = 'none';
      return;
    }
    thumbWidth = Math.max(24, Math.min(trackWidth, Math.round(trackWidth * trackWidth / contentWidth)));
    maxThumbLeft = Math.max(0, trackWidth - thumbWidth);
    thumbLeft = maxThumbLeft > 0 ? Math.round((this.bodyScroll.scrollLeft / maxScrollLeft) * maxThumbLeft) : 0;
    this.horizontalScrollbar.style.display = 'block';
    this.horizontalScrollbar.style.right = this.getVerticalScrollbarGutterSize() + 'px';
    this.horizontalScrollbarThumb.style.width = thumbWidth + 'px';
    this.horizontalScrollbarThumb.style.transform = 'translate3d(' + thumbLeft + 'px,0,0)';
  };

  FabGrid.prototype.getVerticalScrollbarDragInfo = function() {
    var metrics = this.getViewportMetrics();
    var totalHeight = this.view.length * this.options.rowHeight;
    var contentHeight = Math.max(0, metrics.contentHeight);
    var maxScrollTop = Math.max(0, totalHeight - contentHeight);
    var trackRect;
    var thumbRect;
    var trackHeight;
    var thumbHeight;
    if (!this.verticalScrollbarTrack || !this.verticalScrollbarThumb || maxScrollTop <= 0) {
      return null;
    }
    trackRect = this.verticalScrollbarTrack.getBoundingClientRect();
    thumbRect = this.verticalScrollbarThumb.getBoundingClientRect();
    trackHeight = Math.max(0, trackRect.height);
    thumbHeight = Math.max(0, thumbRect.height);
    if (trackHeight <= 0 || thumbHeight <= 0 || trackHeight <= thumbHeight) {
      return null;
    }
    return {
      maxScrollTop: maxScrollTop,
      maxThumbTop: trackHeight - thumbHeight,
      trackTop: trackRect.top,
      thumbHeight: thumbHeight
    };
  };

  FabGrid.prototype.handleVerticalScrollbarPointerDown = function(event) {
    var info;
    var thumbTop;
    if (this.busy || !this.bodyScroll) {
      return;
    }
    info = this.getVerticalScrollbarDragInfo();
    if (!info) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (event.target !== this.verticalScrollbarThumb) {
      thumbTop = clamp(event.clientY - info.trackTop - info.thumbHeight / 2, 0, info.maxThumbTop);
      this.bodyScroll.scrollTop = info.maxScrollTop * (thumbTop / info.maxThumbTop);
    }
    if (this.verticalScrollbar && this.verticalScrollbar.setPointerCapture && event.pointerId != null) {
      this.verticalScrollbar.setPointerCapture(event.pointerId);
    }
    this.verticalScrollbarDrag = {
      startY: event.clientY,
      startScrollTop: this.bodyScroll.scrollTop,
      maxScrollTop: info.maxScrollTop,
      maxThumbTop: info.maxThumbTop,
      pointerId: event.pointerId
    };
    this.bindVerticalScrollbarDragEvents();
    this.root.classList.add('fg-scrollbar-v-dragging');
  };

  FabGrid.prototype.bindVerticalScrollbarDragEvents = function() {
    if (this.verticalScrollbarDragEventsBound) {
      return;
    }
    document.addEventListener('pointermove', this._boundVerticalScrollbarPointerMove);
    document.addEventListener('pointerup', this._boundVerticalScrollbarPointerUp);
    document.addEventListener('pointercancel', this._boundVerticalScrollbarPointerUp);
    this.verticalScrollbarDragEventsBound = true;
  };

  FabGrid.prototype.unbindVerticalScrollbarDragEvents = function() {
    if (!this.verticalScrollbarDragEventsBound) {
      return;
    }
    document.removeEventListener('pointermove', this._boundVerticalScrollbarPointerMove);
    document.removeEventListener('pointerup', this._boundVerticalScrollbarPointerUp);
    document.removeEventListener('pointercancel', this._boundVerticalScrollbarPointerUp);
    this.verticalScrollbarDragEventsBound = false;
  };

  FabGrid.prototype.handleVerticalScrollbarPointerMove = function(event) {
    var state = this.verticalScrollbarDrag;
    var delta;
    if (!state || !this.bodyScroll) {
      return;
    }
    if (state.pointerId != null && event.pointerId != null && state.pointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    delta = event.clientY - state.startY;
    this.bodyScroll.scrollTop = clamp(state.startScrollTop + (delta / state.maxThumbTop) * state.maxScrollTop, 0, state.maxScrollTop);
  };

  FabGrid.prototype.handleVerticalScrollbarPointerUp = function(event) {
    var state = this.verticalScrollbarDrag;
    if (!state || (state.pointerId != null && event.pointerId != null && state.pointerId !== event.pointerId)) {
      return;
    }
    if (this.verticalScrollbar && this.verticalScrollbar.releasePointerCapture && event.pointerId != null) {
      try {
        this.verticalScrollbar.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Pointer capture may already be released by the browser.
      }
    }
    this.verticalScrollbarDrag = null;
    this.root.classList.remove('fg-scrollbar-v-dragging');
    this.unbindVerticalScrollbarDragEvents();
  };

  FabGrid.prototype.handleVerticalScrollbarWheel = function(event) {
    var maxScrollTop;
    var nextTop;
    if (!this.bodyScroll) {
      return;
    }
    maxScrollTop = Math.max(0, this.bodyScroll.scrollHeight - this.bodyScroll.clientHeight);
    nextTop = clamp(this.bodyScroll.scrollTop + event.deltaY, 0, maxScrollTop);
    if (nextTop === this.bodyScroll.scrollTop) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.bodyScroll.scrollTop = nextTop;
  };

  FabGrid.prototype.getHorizontalScrollbarDragInfo = function() {
    var maxScrollLeft = Math.max(0, this.bodyScroll.scrollWidth - this.bodyScroll.clientWidth);
    var trackRect;
    var thumbRect;
    var trackWidth;
    var thumbWidth;
    if (!this.horizontalScrollbarTrack || !this.horizontalScrollbarThumb || maxScrollLeft <= 0) {
      return null;
    }
    trackRect = this.horizontalScrollbarTrack.getBoundingClientRect();
    thumbRect = this.horizontalScrollbarThumb.getBoundingClientRect();
    trackWidth = Math.max(0, trackRect.width);
    thumbWidth = Math.max(0, thumbRect.width);
    if (trackWidth <= 0 || thumbWidth <= 0 || trackWidth <= thumbWidth) {
      return null;
    }
    return {
      maxScrollLeft: maxScrollLeft,
      maxThumbLeft: trackWidth - thumbWidth,
      trackLeft: trackRect.left,
      thumbWidth: thumbWidth
    };
  };

  FabGrid.prototype.handleHorizontalScrollbarPointerDown = function(event) {
    var info;
    var thumbLeft;
    if (this.busy || !this.bodyScroll) {
      return;
    }
    info = this.getHorizontalScrollbarDragInfo();
    if (!info) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (event.target !== this.horizontalScrollbarThumb) {
      thumbLeft = clamp(event.clientX - info.trackLeft - info.thumbWidth / 2, 0, info.maxThumbLeft);
      this.bodyScroll.scrollLeft = info.maxScrollLeft * (thumbLeft / info.maxThumbLeft);
    }
    if (this.horizontalScrollbar && this.horizontalScrollbar.setPointerCapture && event.pointerId != null) {
      this.horizontalScrollbar.setPointerCapture(event.pointerId);
    }
    this.horizontalScrollbarDrag = {
      startX: event.clientX,
      startScrollLeft: this.bodyScroll.scrollLeft,
      maxScrollLeft: info.maxScrollLeft,
      maxThumbLeft: info.maxThumbLeft,
      pointerId: event.pointerId
    };
    this.bindHorizontalScrollbarDragEvents();
    this.root.classList.add('fg-scrollbar-h-dragging');
  };

  FabGrid.prototype.bindHorizontalScrollbarDragEvents = function() {
    if (this.horizontalScrollbarDragEventsBound) {
      return;
    }
    document.addEventListener('pointermove', this._boundHorizontalScrollbarPointerMove);
    document.addEventListener('pointerup', this._boundHorizontalScrollbarPointerUp);
    document.addEventListener('pointercancel', this._boundHorizontalScrollbarPointerUp);
    this.horizontalScrollbarDragEventsBound = true;
  };

  FabGrid.prototype.unbindHorizontalScrollbarDragEvents = function() {
    if (!this.horizontalScrollbarDragEventsBound) {
      return;
    }
    document.removeEventListener('pointermove', this._boundHorizontalScrollbarPointerMove);
    document.removeEventListener('pointerup', this._boundHorizontalScrollbarPointerUp);
    document.removeEventListener('pointercancel', this._boundHorizontalScrollbarPointerUp);
    this.horizontalScrollbarDragEventsBound = false;
  };

  FabGrid.prototype.handleHorizontalScrollbarPointerMove = function(event) {
    var state = this.horizontalScrollbarDrag;
    var delta;
    if (!state || !this.bodyScroll) {
      return;
    }
    if (state.pointerId != null && event.pointerId != null && state.pointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    delta = event.clientX - state.startX;
    this.bodyScroll.scrollLeft = clamp(state.startScrollLeft + (delta / state.maxThumbLeft) * state.maxScrollLeft, 0, state.maxScrollLeft);
  };

  FabGrid.prototype.handleHorizontalScrollbarPointerUp = function(event) {
    var state = this.horizontalScrollbarDrag;
    if (!state || (state.pointerId != null && event.pointerId != null && state.pointerId !== event.pointerId)) {
      return;
    }
    if (this.horizontalScrollbar && this.horizontalScrollbar.releasePointerCapture && event.pointerId != null) {
      try {
        this.horizontalScrollbar.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Pointer capture may already be released by the browser.
      }
    }
    this.horizontalScrollbarDrag = null;
    this.root.classList.remove('fg-scrollbar-h-dragging');
    this.unbindHorizontalScrollbarDragEvents();
  };

  FabGrid.prototype.shouldRenderScrollImmediately = function() {
    var metrics;
    var visibleRowStart;
    var visibleRowEnd;
    var viewportWidth;
    var nextColumnRange;
    if (this.options.syncScrollRender === false || !this.bodyScroll || !this.view.length) {
      return false;
    }
    metrics = this.getViewportMetrics();
    visibleRowStart = Math.floor(metrics.scrollTop / this.options.rowHeight);
    visibleRowEnd = Math.min(this.view.length, Math.ceil((metrics.scrollTop + metrics.contentHeight) / this.options.rowHeight));
    if (
      visibleRowStart < this.rowRange.start ||
      visibleRowEnd > this.rowRange.end
    ) {
      return true;
    }
    viewportWidth = Math.max(
      0,
      metrics.width - this.getFixedLeftWidth() - this.frozenWidth - this.frozenRightWidth
    );
    nextColumnRange = this.getColumnRange(metrics.scrollLeft, viewportWidth);
    return nextColumnRange.start < this.columnRange.start ||
      nextColumnRange.end > this.columnRange.end;
  };

  FabGrid.prototype.render = function(skipLayout) {
    var metrics;
    var rowRange;
    var colRange;
    var scrollLeft;
    var scrollableViewportWidth;
    var totalHeight;
    var renderedCells;
    var rowHeaderWidth;
    var selectionCheckboxWidth;
    var fixedLeftWidth;
    var scrollbarGutterSize;
    var verticalScrollbarGutterSize;
    var footerHeight;
    var footerOffsetBottom;
    var footerTop;
    var bodyPaneBottom;
    var headerHeight;
    var paginationHeight;

    if (this.disposed) {
      return;
    }

    this.captureActiveHeaderSearchFocus();
    if (this.emit('updatingView', {}) === false) {
      return;
    }
    this.resetFixedPaneScrollOffset();
    if (skipLayout === true) {
      this._layoutReadyForRender = false;
    } else if (this._layoutReadyForRender) {
      this._layoutReadyForRender = false;
    } else {
      this.updateLayout();
      this._layoutReadyForRender = false;
    }
    this.syncHeaderLayout();
    footerHeight = this.getFooterHeight();
    paginationHeight = this.getPaginationHeight();
    headerHeight = this.getHeaderHeight();
    this.body.style.bottom = paginationHeight + 'px';
    metrics = this.getViewportMetrics();
    scrollbarGutterSize = this.getScrollbarGutterSize();
    verticalScrollbarGutterSize = this.getVerticalScrollbarGutterSize();
    this.root.style.setProperty('--fg-scrollbar-gutter-size', scrollbarGutterSize + 'px');
    rowHeaderWidth = this.getRowHeaderWidth();
    selectionCheckboxWidth = this.getSelectionCheckboxWidth();
    fixedLeftWidth = rowHeaderWidth + selectionCheckboxWidth;
    rowRange = this.getRowRange(metrics);
    this.renderContentHeight = metrics.contentHeight;
    scrollableViewportWidth = Math.max(0, metrics.width - fixedLeftWidth - this.frozenWidth - this.frozenRightWidth);
    scrollLeft = this.bodyScroll.scrollLeft;
    colRange = this.getColumnRange(scrollLeft, scrollableViewportWidth);

    this.rowRange = rowRange;
    this.columnRange = colRange;
    totalHeight = this.view.length * this.options.rowHeight;
    footerOffsetBottom = footerHeight > 0 && totalHeight < metrics.contentHeight ?
      Math.max(0, metrics.height - scrollbarGutterSize - totalHeight - footerHeight) :
      scrollbarGutterSize;
    footerTop = footerHeight > 0 && footerOffsetBottom > scrollbarGutterSize ?
      headerHeight + totalHeight :
      null;
    bodyPaneBottom = footerOffsetBottom + footerHeight;

    // Let CSS min-width track the live client width after a vertical scrollbar appears.
    this.sizeLayer.style.width = getSizeLayerWidth(
      fixedLeftWidth,
      this.frozenWidth,
      this.scrollableWidth,
      this.frozenRightWidth
    ) + 'px';
    this.sizeLayer.style.height = (totalHeight + footerHeight) + 'px';
    this.rowHeaderTop.style.width = rowHeaderWidth + 'px';
    this.rowHeaderTop.style.height = this.getHeaderHeight() + 'px';
    this.rowHeaderTop.style.display = rowHeaderWidth > 0 ? 'flex' : 'none';
    this.renderTopLeftHeader(this.rowHeaderTop, this.shouldShowRowHeaderText() ? this.options.rowHeaderHeader : '');
    this.renderColumnChooserTrigger();
    if (rowHeaderWidth > 0) {
      this.raiseFormatItem(this.createFormatItemEventArgs(this.topLeftCells, this.rowHeaderTop, 0, 0, {
        value: this.options.rowHeaderHeader
      }));
    }
    this.rowHeaderPane.style.width = rowHeaderWidth + 'px';
    this.rowHeaderPane.style.bottom = bodyPaneBottom + 'px';
    this.rowHeaderPane.style.display = rowHeaderWidth > 0 ? 'block' : 'none';
    this.selectionTop.style.left = rowHeaderWidth + 'px';
    this.selectionTop.style.width = selectionCheckboxWidth + 'px';
    this.selectionTop.style.height = this.getHeaderHeight() + 'px';
    this.selectionTop.style.display = selectionCheckboxWidth > 0 ? 'flex' : 'none';
    this.renderTopLeftHeader(this.selectionTop, '');
    this.selectionPane.style.left = rowHeaderWidth + 'px';
    this.selectionPane.style.width = selectionCheckboxWidth + 'px';
    this.selectionPane.style.bottom = bodyPaneBottom + 'px';
    this.selectionPane.style.display = selectionCheckboxWidth > 0 ? 'block' : 'none';
    this.headerFrozen.style.width = this.frozenWidth + 'px';
    this.headerFrozen.style.left = fixedLeftWidth + 'px';
    this.headerScroll.style.left = (fixedLeftWidth + this.frozenWidth) + 'px';
    this.headerScroll.style.right = (this.frozenRightWidth + verticalScrollbarGutterSize) + 'px';
    this.frozenPane.style.width = this.frozenWidth + 'px';
    this.frozenPane.style.left = fixedLeftWidth + 'px';
    this.frozenPane.style.bottom = bodyPaneBottom + 'px';
    this.frozenPane.style.display = this.frozenWidth > 0 ? 'block' : 'none';
    this.headerFrozenRight.style.width = this.frozenRightWidth + 'px';
    this.headerFrozenRight.style.right = verticalScrollbarGutterSize + 'px';
    this.headerFrozenRight.style.display = this.frozenRightWidth > 0 ? 'block' : 'none';
    this.frozenRightPane.style.width = this.frozenRightWidth + 'px';
    this.frozenRightPane.style.right = verticalScrollbarGutterSize + 'px';
    this.frozenRightPane.style.bottom = bodyPaneBottom + 'px';
    this.frozenRightPane.style.display = this.frozenRightWidth > 0 ? 'block' : 'none';
    this.headerCanvas.style.width = this.scrollableWidth + 'px';
    if (!this.useScrollLinkedHorizontal) {
      this.headerCanvas.style.transform = 'translate3d(' + (-scrollLeft) + 'px,0,0)';
    }
    this.footer.style.height = footerHeight + 'px';
    this.footer.style.top = footerTop == null ? '' : footerTop + 'px';
    this.footer.style.bottom = footerTop == null ? (scrollbarGutterSize + paginationHeight) + 'px' : '';
    this.footer.style.display = footerHeight > 0 ? 'block' : 'none';
    this.footerRowHeader.style.width = rowHeaderWidth + 'px';
    this.footerRowHeader.style.display = rowHeaderWidth > 0 ? 'flex' : 'none';
    this.footerRowHeader.textContent = this.shouldShowRowHeaderText() ? this.options.footerLabel : '';
    if (footerHeight > 0 && rowHeaderWidth > 0) {
      this.raiseFormatItem(this.createFormatItemEventArgs(this.bottomLeftCells, this.footerRowHeader, 0, 0, {
        value: this.options.footerLabel
      }));
    }
    this.footerSelection.style.left = rowHeaderWidth + 'px';
    this.footerSelection.style.width = selectionCheckboxWidth + 'px';
    this.footerSelection.style.display = selectionCheckboxWidth > 0 ? 'block' : 'none';
    this.footerFrozen.style.left = fixedLeftWidth + 'px';
    this.footerFrozen.style.width = this.frozenWidth + 'px';
    this.footerFrozen.style.display = this.frozenWidth > 0 ? 'block' : 'none';
    this.footerScroll.style.left = (fixedLeftWidth + this.frozenWidth) + 'px';
    this.footerScroll.style.right = (this.frozenRightWidth + verticalScrollbarGutterSize) + 'px';
    this.footerFrozenRight.style.right = verticalScrollbarGutterSize + 'px';
    this.footerFrozenRight.style.width = this.frozenRightWidth + 'px';
    this.footerFrozenRight.style.display = this.frozenRightWidth > 0 ? 'block' : 'none';
    this.footerCanvas.style.width = this.scrollableWidth + 'px';
    if (!this.useScrollLinkedHorizontal) {
      this.footerCanvas.style.transform = 'translate3d(' + (-scrollLeft) + 'px,0,0)';
    }
    this.updateVerticalScrollbar(metrics, totalHeight, bodyPaneBottom);
    this.updateHorizontalScrollbar();
    // Read the final scroll width after all pane sizes have been committed.
    this.updateScrollLinkedHorizontalDistance();
    if (skipLayout !== true) {
      this.scheduleScrollLinkedHorizontalDistanceUpdate();
    }

    this.renderHeaders(colRange);
    this.renderFooter(colRange);
    this.renderRowHeaders(rowRange);
    this.renderSelectionCheckboxes(rowRange);
    renderedCells = this.renderBody(rowRange, colRange);
    this.renderSelection();
    this.renderPagination();
    this.empty.style.display = this.view.length ? 'none' : 'flex';

    this.emit('viewportChanged', {
      rowStart: rowRange.start,
      rowEnd: rowRange.end,
      columnStart: colRange.start,
      columnEnd: colRange.end,
      renderedCells: renderedCells,
      totalRows: this.view.length
    });
    this.emit('updatedView', {
      rowStart: rowRange.start,
      rowEnd: rowRange.end,
      columnStart: colRange.start,
      columnEnd: colRange.end,
      renderedCells: renderedCells,
      totalRows: this.view.length
    });
    this.restoreHeaderSearchFocus();
  };

  FabGrid.prototype.getViewportMetrics = function() {
    return {
      width: this.bodyScroll.clientWidth,
      height: this.bodyScroll.clientHeight,
      contentHeight: this.getScrollableContentHeight(),
      scrollTop: this.bodyScroll.scrollTop,
      scrollLeft: this.bodyScroll.scrollLeft
    };
  };

  FabGrid.prototype.getScrollableContentHeight = function() {
    var height = this.bodyScroll ? this.bodyScroll.clientHeight : 0;
    height -= this.getFooterHeight();
    return Math.max(0, height);
  };

  FabGrid.prototype.getRowRange = function(metrics) {
    var rowHeight = normalizePositiveNumber(this.options.rowHeight, DEFAULT_OPTIONS.rowHeight);
    var overscanRows = Math.max(0, toNumber(this.options.overscanRows, 8));
    var extraRows = this.scrollState ? Math.max(0, toNumber(this.scrollState.extraRows, 0)) : 0;
    var beforeRows = overscanRows;
    var afterRows = overscanRows;
    var visibleStart = Math.floor(metrics.scrollTop / rowHeight);
    var visibleCount = Math.ceil(metrics.contentHeight / rowHeight);
    var start;
    var count;
    if (this.scrollState && this.scrollState.directionY > 0) {
      afterRows += extraRows;
    } else if (this.scrollState && this.scrollState.directionY < 0) {
      beforeRows += extraRows;
    } else {
      beforeRows += Math.ceil(extraRows / 2);
      afterRows += Math.ceil(extraRows / 2);
    }
    start = visibleStart - beforeRows;
    count = visibleCount + beforeRows + afterRows + 1;
    start = Math.max(0, start);
    return {
      start: start,
      end: Math.min(this.view.length, start + count)
    };
  };

  FabGrid.prototype.getScrollbarGutterSize = function() {
    var nativeGutter = Math.max(0, this.bodyScroll.offsetHeight - this.bodyScroll.clientHeight);
    var contentWidth = this.getFixedLeftWidth() + this.frozenWidth + this.scrollableWidth + this.frozenRightWidth;
    var hasHorizontalOverflow = contentWidth > this.bodyScroll.clientWidth;
    var measuredGutter = hasHorizontalOverflow ? this.getNativeScrollbarGutters().height : 0;
    var customGutter = hasHorizontalOverflow ?
      Math.max(0, parseFloat(window.getComputedStyle(this.root).getPropertyValue('--fg-scrollbar-size')) || 0) :
      0;
    return Math.max(nativeGutter, measuredGutter, customGutter);
  };

  FabGrid.prototype.getVerticalScrollbarGutterSize = function() {
    var nativeGutter = Math.max(0, this.bodyScroll.offsetWidth - this.bodyScroll.clientWidth);
    var totalHeight = this.view.length * this.options.rowHeight + this.getFooterHeight();
    var hasVerticalOverflow = totalHeight > this.bodyScroll.clientHeight;
    var measuredGutter = hasVerticalOverflow ? this.getNativeScrollbarGutters().width : 0;
    var customGutter = hasVerticalOverflow ?
      Math.max(0, parseFloat(window.getComputedStyle(this.root).getPropertyValue('--fg-scrollbar-size')) || 0) :
      0;
    return Math.max(nativeGutter, measuredGutter, customGutter);
  };

  FabGrid.prototype.getNativeScrollbarGutters = function() {
    if (!this.nativeScrollbarGutters) {
      this.nativeScrollbarGutters = measureNativeScrollbarGutters();
    }
    return this.nativeScrollbarGutters;
  };

  FabGrid.prototype.getColumnRange = function(scrollLeft, viewportWidth) {
    var columns = this.visibleColumns;
    var frozen = this.frozenColumns;
    var scrollEnd = this.scrollableColumnEnd;
    var start;
    var end;
    var limit;
    var i;
    var overscanColumns = normalizeNonNegativeInteger(this.options.overscanColumns, DEFAULT_OPTIONS.overscanColumns);

    if (scrollEnd <= frozen || viewportWidth <= 0) {
      return { start: frozen, end: frozen };
    }

    start = findColumnByOffset(columns, frozen, scrollEnd, this.frozenWidth + scrollLeft);
    start = Math.max(frozen, start - overscanColumns);
    limit = this.frozenWidth + scrollLeft + viewportWidth;
    end = start;
    for (i = start; i < scrollEnd; i += 1) {
      end = i + 1;
      if (columns[i]._left > limit) {
        break;
      }
    }
    end = Math.min(scrollEnd, end + overscanColumns);
    return { start: start, end: end };
  };

  FabGrid.prototype.getRowHeaderWidth = function() {
    if (this.options.showRowHeaders === false) {
      return 0;
    }
    if (this.options.showRowHeaders === 'cell') {
      return 18;
    }
    return Math.max(0, toNumber(this.options.rowHeaderWidth, DEFAULT_OPTIONS.rowHeaderWidth));
  };

  FabGrid.prototype.shouldShowRowHeaderText = function() {
    return this.options.showRowHeaders !== false && this.options.showRowHeaders !== 'cell';
  };

  FabGrid.prototype.getSelectionCheckboxWidth = function() {
    if (this.options.multiSelectRows !== true) {
      return 0;
    }
    return Math.max(28, toNumber(this.options.selectionCheckboxWidth, 44));
  };

  FabGrid.prototype.getFooterHeight = function() {
    if (this.options.showFooter !== true) {
      return 0;
    }
    return Math.max(0, toNumber(this.options.footerHeight, DEFAULT_OPTIONS.footerHeight));
  };

  FabGrid.prototype.getPaginationHeight = function() {
    if (this.options.pagination !== true) {
      return 0;
    }
    return Math.max(28, toNumber(this.options.paginationHeight, DEFAULT_OPTIONS.paginationHeight));
  };

  FabGrid.prototype.renderPagination = function() {
    var height = this.getPaginationHeight();
    var pager = this._pagerElement || (this.pager && this.pager.style ? this.pager : null);
    var pagination = this._paginationElement || (this.pagination && this.pagination.style ? this.pagination : null);
    var total = this.paginationTotal;
    var pageSize = Math.max(1, this.options.pageSize);
    var pageCount = Math.max(1, Math.ceil(total / pageSize));
    var pageNumber = clamp(this.options.pageNumber, 1, pageCount);
    var start = total ? (pageNumber - 1) * pageSize + 1 : 0;
    var end = Math.min(total, pageNumber * pageSize);
    var pageList = Array.isArray(this.options.pageList) && this.options.pageList.length ? this.options.pageList : DEFAULT_OPTIONS.pageList;
    var listHtml = [];
    var pageListHtml = '';
    var pageInfoHtml = '';
    var refreshHtml = '';
    var i;
    var value;
    if (!pager || !pagination) {
      return;
    }
    pager.style.height = height + 'px';
    pager.style.display = height ? 'block' : 'none';
    pagination.setAttribute('aria-label', this.getText('pagination.ariaLabel'));
    pagination.style.height = '100%';
    pagination.style.display = height ? 'flex' : 'none';
    if (!height) {
      pagination.innerHTML = '';
      return;
    }
    for (i = 0; i < pageList.length; i += 1) {
      value = Math.max(1, Math.floor(toNumber(pageList[i], pageSize)));
      listHtml.push('<option value="' + value + '"' + (value === pageSize ? ' selected' : '') + '>' + value + '</option>');
    }
    if (this.options.showPageList === true) {
      pageListHtml = '<select class="fg-pagination-page-list" aria-label="' + escapeHtml(this.getText('pagination.pageSize')) + '">' +
        listHtml.join('') + '</select><span class="fg-pagination-separator"></span>';
    }
    if (this.options.showPageInfo !== false) {
      pageInfoHtml = '<div class="fg-pagination-info">' +
        escapeHtml(this.getText('pagination.displayMsg', { from: start, to: end, total: total })) + '</div>';
    }
    if (this.options.showRefresh !== false) {
      refreshHtml = '<span class="fg-pagination-separator"></span>' +
        this.createPaginationButton('refresh', 'pagination-load', this.getText('pagination.refresh'), false);
    }
    pagination.innerHTML =
      '<div class="fg-pagination-controls">' +
        pageListHtml +
        this.createPaginationButton('first', 'pagination-first', this.getText('pagination.first'), pageNumber <= 1) +
        this.createPaginationButton('prev', 'pagination-prev', this.getText('pagination.previous'), pageNumber <= 1) +
        '<span class="fg-pagination-separator"></span>' +
        '<span class="fg-pagination-before">' + escapeHtml(this.getText('pagination.beforePageText')) + '</span>' +
        '<input class="fg-pagination-number" type="text" inputmode="numeric" value="' + pageNumber + '" aria-label="' + escapeHtml(this.getText('pagination.pageNumber')) + '">' +
        '<span class="fg-pagination-after">' + escapeHtml(this.getText('pagination.afterPageText', { pages: pageCount })) + '</span>' +
        '<span class="fg-pagination-separator"></span>' +
        this.createPaginationButton('next', 'pagination-next', this.getText('pagination.next'), pageNumber >= pageCount) +
        this.createPaginationButton('last', 'pagination-last', this.getText('pagination.last'), pageNumber >= pageCount) +
        refreshHtml +
      '</div>' + pageInfoHtml;
  };

  FabGrid.prototype.createPaginationButton = function(action, iconClass, label, disabled) {
    return '<button class="fg-pagination-button" type="button" data-page-action="' + action + '" aria-label="' +
      escapeHtml(label) + '" title="' + escapeHtml(label) + '"' + (disabled ? ' disabled' : '') + '>' +
      '<span class="fg-pagination-icon ' + iconClass + '" aria-hidden="true"></span></button>';
  };

  FabGrid.prototype.handlePaginationClick = function(event) {
    var button = closest(event.target, 'fg-pagination-button');
    var action;
    var pageCount;
    var nextPage;
    if (!button || button.disabled) {
      return;
    }
    action = button.getAttribute('data-page-action');
    pageCount = Math.max(1, Math.ceil(this.paginationTotal / this.options.pageSize));
    nextPage = this.options.pageNumber;
    if (action === 'first') {
      nextPage = 1;
    } else if (action === 'prev') {
      nextPage -= 1;
    } else if (action === 'next') {
      nextPage += 1;
    } else if (action === 'last') {
      nextPage = pageCount;
    } else if (action === 'refresh') {
      if (this.options.remote === true) {
        this.reload();
        return;
      }
      this.applyView();
      this.resetVerticalScroll();
      this.refresh();
      this.emit('pageChanged', { pageNumber: this.options.pageNumber, pageSize: this.options.pageSize, total: this.paginationTotal, refresh: true });
      return;
    }
    this.selectPage(nextPage, this.options.pageSize);
  };

  FabGrid.prototype.handlePaginationChange = function(event) {
    if (hasClass(event.target, 'fg-pagination-page-list')) {
      this.selectPage(1, event.target.value);
    }
  };

  FabGrid.prototype.handlePaginationKeyDown = function(event) {
    if (event.key === 'Enter' && hasClass(event.target, 'fg-pagination-number')) {
      event.preventDefault();
      this.selectPage(event.target.value, this.options.pageSize);
    }
  };

  FabGrid.prototype.renderTopLeftHeader = function(element, title) {
    var label = element.querySelector('.fg-top-title');
    if (!label) {
      label = document.createElement('span');
      label.className = 'fg-top-title';
      element.insertBefore(label, element.firstChild);
    }
    label.textContent = title || '';
  };

  FabGrid.prototype.renderColumnChooserTrigger = function() {
    var trigger = this.rowHeaderTop.querySelector('.fg-column-chooser-trigger');
    var canShow = this.options.showColumnChooser === true && this.getRowHeaderWidth() > 0;
    if (!canShow) {
      if (trigger) {
        trigger.remove();
      }
      this.hideColumnChooser();
      return;
    }
    if (!trigger) {
      trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'fg-column-chooser-trigger';
      this.rowHeaderTop.appendChild(trigger);
    }
    trigger.title = this.getText('aria.openColumnChooser');
    trigger.setAttribute('aria-label', this.getText('aria.openColumnChooser'));
    trigger.setAttribute('aria-expanded', this.isColumnChooserOpen() ? 'true' : 'false');
  };

  FabGrid.prototype.hasActiveFilter = function() {
    return !!this.filterPredicate ||
      !!this.searchText ||
      (getActiveFilterMode(this.options) === 'searchRow' && this.hasColumnSearch) ||
      (getActiveFilterMode(this.options) === 'excel' && hasExcelFilterEntries(this.excelFilters));
  };

  FabGrid.prototype.getFixedLeftWidth = function() {
    return this.getRowHeaderWidth() + this.getSelectionCheckboxWidth();
  };

  FabGrid.prototype.renderHeaders = function(colRange) {
    var frozenFragment = document.createDocumentFragment();
    var frozenRightFragment = document.createDocumentFragment();
    var scrollFragment = document.createDocumentFragment();
    var textMeasureContext = this.getAutoSizeCanvasContext();
    var i;
    var col;

    this.headerFrozen.innerHTML = '';
    this.headerFrozenRight.innerHTML = '';
    this.headerCanvas.innerHTML = '';

    for (i = 0; i < this.frozenColumns; i += 1) {
      col = this.visibleColumns[i];
      frozenFragment.appendChild(this.createHeaderCell(col, col._left, 'left', textMeasureContext));
    }

    for (i = colRange.start; i < colRange.end; i += 1) {
      col = this.visibleColumns[i];
      scrollFragment.appendChild(this.createHeaderCell(col, col._left - this.frozenWidth, false, textMeasureContext));
    }

    for (i = this.scrollableColumnEnd; i < this.visibleColumns.length; i += 1) {
      col = this.visibleColumns[i];
      frozenRightFragment.appendChild(this.createHeaderCell(
        col,
        col._left - this.frozenRightStartLeft,
        'right',
        textMeasureContext
      ));
    }

    this.headerFrozen.appendChild(frozenFragment);
    this.headerFrozenRight.appendChild(frozenRightFragment);
    this.headerCanvas.appendChild(scrollFragment);
  };

  FabGrid.prototype.renderVisibleRows = function() {
    this.resetFixedPaneScrollOffset();
    this.renderRowHeaders(this.rowRange);
    this.renderSelectionCheckboxes(this.rowRange);
    this.renderBody(this.rowRange, this.columnRange);
    this.renderSelection();
  };

  FabGrid.prototype.renderFooter = function(colRange) {
    var frozenFragment = document.createDocumentFragment();
    var frozenRightFragment = document.createDocumentFragment();
    var scrollFragment = document.createDocumentFragment();
    var i;
    var col;

    this.footerFrozen.innerHTML = '';
    this.footerFrozenRight.innerHTML = '';
    this.footerCanvas.innerHTML = '';
    if (!this.getFooterHeight()) {
      return;
    }

    for (i = 0; i < this.frozenColumns; i += 1) {
      col = this.visibleColumns[i];
      frozenFragment.appendChild(this.createFooterCell(col, col._left, 'left'));
    }

    for (i = colRange.start; i < colRange.end; i += 1) {
      col = this.visibleColumns[i];
      scrollFragment.appendChild(this.createFooterCell(col, col._left - this.frozenWidth, 'scroll'));
    }

    for (i = this.scrollableColumnEnd; i < this.visibleColumns.length; i += 1) {
      col = this.visibleColumns[i];
      frozenRightFragment.appendChild(this.createFooterCell(col, col._left - this.frozenRightStartLeft, 'right'));
    }

    this.footerFrozen.appendChild(frozenFragment);
    this.footerFrozenRight.appendChild(frozenRightFragment);
    this.footerCanvas.appendChild(scrollFragment);
  };

  FabGrid.prototype.createFooterCell = function(column, left, pane) {
    var cell = document.createElement('div');
    var label = document.createElement('span');
    var value = this.getFooterCellValue(column);
    var text = this.formatFooterCellValue(column, value);
    cell.className = 'fg-footer-cell';
    this.decorateFrozenDividerCell(cell, column._viewIndex, pane);
    if (column.align) {
      cell.className += ' fg-align-' + column.align;
    }
    if (column.color) {
      cell.style.color = column.color;
    }
    cell.style.left = left + 'px';
    cell.style.width = column._width + 'px';
    cell.style.height = this.getFooterHeight() + 'px';
    cell.style.textAlign = normalizeTextAlign(column.align);
    cell.style.justifyContent = normalizeJustifyContent(column.align);
    cell.setAttribute('data-col', column._viewIndex);
    label.className = 'fg-footer-label';
    label.style.textAlign = normalizeTextAlign(column.align);
    label.textContent = text;
    cell.appendChild(label);
    this.raiseFormatItem(this.createFormatItemEventArgs(this.columnFooters, cell, 0, column._index, {
      column: column,
      value: value
    }));
    return cell;
  };

  FabGrid.prototype.getFooterCellValue = function(column) {
    var args;
    if (typeof column.footer === 'function') {
      args = {
        grid: this,
        column: column,
        rows: this.view,
        aggregate: column.aggregate
      };
      return column.footer(args);
    }
    if (column.footer != null) {
      return column.footer;
    }
    if (!column.aggregate) {
      return '';
    }
    return this.calculateAggregate(column.aggregate, column);
  };

  FabGrid.prototype.getFooterCellText = function(column) {
    var value = this.getFooterCellValue(column);
    return this.formatFooterCellValue(column, value);
  };

  FabGrid.prototype.formatFooterCellValue = function(column, value) {
    if (value == null) {
      return '';
    }
    if (!column.aggregate || column.footer != null) {
      return String(value);
    }
    return this.formatAggregateValue(value, column);
  };

  FabGrid.prototype.renderRowHeaders = function(rowRange) {
    var fragment = document.createDocumentFragment();
    var r;
    var cell;
    this.rowHeaderLayer.innerHTML = '';
    if (!this.getRowHeaderWidth()) {
      return;
    }
    for (r = rowRange.start; r < rowRange.end; r += 1) {
      cell = this.createRowHeaderCell(r);
      if (cell) {
        fragment.appendChild(cell);
      }
    }
    this.rowHeaderLayer.appendChild(fragment);
  };

  FabGrid.prototype.getDisplayRowNumber = function(rowIndex) {
    var treeRowNumber = typeof this.getTreeRowNumber === 'function' ? this.getTreeRowNumber(rowIndex) : null;
    return treeRowNumber == null ? rowIndex + 1 : treeRowNumber;
  };

  FabGrid.prototype.renderSelectionCheckboxes = function(rowRange) {
    var fragment = document.createDocumentFragment();
    var checkbox;
    var r;
    var cell;
    this.selectionTop.innerHTML = '';
    this.selectionLayer.innerHTML = '';
    if (!this.getSelectionCheckboxWidth()) {
      return;
    }

    checkbox = document.createElement('input');
    checkbox.className = 'fg-selection-checkbox fg-selection-check-all';
    checkbox.type = 'checkbox';
    checkbox.setAttribute('aria-label', this.getText('aria.selectAllRows'));
    checkbox.checked = this.view.length > 0 && this.getSelectedRowCount() === this.view.length;
    checkbox.indeterminate = this.getSelectedRowCount() > 0 && this.getSelectedRowCount() < this.view.length;
    this.selectionTop.appendChild(checkbox);

    for (r = rowRange.start; r < rowRange.end; r += 1) {
      cell = this.createSelectionCell(r);
      if (cell) {
        fragment.appendChild(cell);
      }
    }
    this.selectionLayer.appendChild(fragment);
  };

  FabGrid.prototype.isAlternatingRow = function(rowIndex) {
    var step = normalizeAlternatingRowStep(this.options.alternatingRowStep);
    return step !== false && Math.floor(rowIndex / step) % 2 === 1;
  };

  FabGrid.prototype.createSelectionCell = function(rowIndex) {
    var row = this.view[rowIndex];
    var cell = document.createElement('div');
    var checkbox = document.createElement('input');
    var groupSelectionState = this.isRowGroup(row) ? this.getRowGroupSelectionState(row) : null;
    var top = rowIndex * this.options.rowHeight - this.bodyScroll.scrollTop;
    var height = this.getVisibleRowHeight(top);
    if (height <= 0) {
      return null;
    }
    cell.className = 'fg-selection-cell';
    if (this.isAlternatingRow(rowIndex)) {
      cell.className += ' fg-row-even fg-row-alt';
    }
    if (this.hoverRow === rowIndex) {
      cell.className += ' fg-row-hovered';
    }
    if (this.shouldHighlightRow(rowIndex)) {
      cell.className += ' fg-row-selected';
    }
    if (this.isRowGroupFooter(row)) {
      cell.className += ' fg-row-group-footer-cell';
    }
    cell.style.top = top + 'px';
    cell.style.width = this.getSelectionCheckboxWidth() + 'px';
    cell.style.height = height + 'px';
    cell.setAttribute('data-row', rowIndex);
    if (this.isRowGroupFooter(row)) {
      return cell;
    }
    checkbox.className = 'fg-selection-checkbox fg-selection-check';
    checkbox.type = 'checkbox';
    checkbox.checked = groupSelectionState ? groupSelectionState.checked : this.isRowSelected(rowIndex);
    checkbox.indeterminate = groupSelectionState ? groupSelectionState.indeterminate : false;
    checkbox.setAttribute('aria-label', this.getText('aria.selectRow', { rowNumber: this.getDisplayRowNumber(rowIndex) }));
    checkbox.setAttribute('data-row', rowIndex);
    cell.appendChild(checkbox);
    return cell;
  };

  FabGrid.prototype.createRowHeaderCell = function(rowIndex) {
    var row = this.view[rowIndex];
    var cell = document.createElement('div');
    var top = rowIndex * this.options.rowHeight - this.bodyScroll.scrollTop;
    var height = this.getVisibleRowHeight(top);
    if (height <= 0) {
      return null;
    }
    cell.className = 'fg-row-header-cell';
    if (this.isAlternatingRow(rowIndex)) {
      cell.className += ' fg-row-even fg-row-alt';
    }
    if (this.hoverRow === rowIndex) {
      cell.className += ' fg-row-hovered';
    }
    if (this.shouldHighlightRow(rowIndex)) {
      cell.className += ' fg-row-selected';
    }
    if (this.isRowGroupFooter(row)) {
      cell.className += ' fg-row-group-footer-cell';
    }
    cell.style.top = top + 'px';
    cell.style.width = this.getRowHeaderWidth() + 'px';
    cell.style.height = height + 'px';
    cell.setAttribute('data-row', rowIndex);
    cell.textContent = this.isRowGroupFooter(row) ? '' : this.shouldShowRowHeaderText() ? String(this.getDisplayRowNumber(rowIndex)) : '';
    this.applyRowDraggable(cell, rowIndex);
    this.raiseFormatItem(this.createFormatItemEventArgs(this.rowHeaders, cell, rowIndex, 0, {
      item: row,
      value: this.getDisplayRowNumber(rowIndex)
    }));
    return cell;
  };

  FabGrid.prototype.createHeaderCell = function(column, left, frozen, textMeasureContext) {
    var cell = document.createElement('div');
    var title = document.createElement('span');
    var label = document.createElement('span');
    var sortWrap = document.createElement('span');
    var sortOrder = document.createElement('span');
    var sort = document.createElement('span');
    var filterIcon = document.createElement('span');
    var resize = document.createElement('span');
    var search;
    var input;
    var searchIcons;
    var searchEditorConfig;
    var sortDirection = this.getSortDirection(column);
    var sortIndex = this.getSortIndex(column);
    var sortCount = this.getSortStates().length;
    var searchOperator = this.getColumnSearchOperator(column);
    var excelFilterActive = this.isExcelFilterActive(column);
    var headerText = this.getHeaderCellText(column);
    var headerTextWidth;
    var headerContentWidth;

    cell.className = 'fg-header-cell';
    this.decorateFrozenDividerCell(cell, column._viewIndex, frozen || 'scroll');
    if (column.align) {
      cell.className += ' fg-header-align-' + column.align;
    }
    cell.style.left = left + 'px';
    cell.style.width = column._width + 'px';
    cell.style.height = this.getHeaderHeight() + 'px';
    cell.setAttribute('data-col', column._viewIndex);
    cell.setAttribute('data-frozen', frozen ? '1' : '0');
    title.className = 'fg-header-title' +
      (getActiveFilterMode(this.options) ? ' fg-header-title-filterable' : '') +
      (sortDirection ? ' fg-header-title-sorted' : '');
    if (getActiveFilterMode(this.options)) {
      headerTextWidth = this.measureAutoSizeText(headerText, textMeasureContext);
      headerContentWidth = headerTextWidth + (column.align === 'right' ? 0 : 13);
      if (headerContentWidth + 30 > column._width) {
        title.className += ' fg-header-title-filter-narrow';
        if (column.align === 'right' && headerTextWidth + 13 <= column._width) {
          title.className += ' fg-header-title-filter-right-inset';
        }
      }
    }
    title.style.height = this.getHeaderTitleHeight() + 'px';
    label.className = 'fg-header-label';
    label.textContent = headerText;
    sortWrap.className = 'fg-sort-wrap' + (sortDirection ? '' : ' fg-sort-wrap-none');
    sortOrder.className = 'fg-sort-order';
    sortOrder.textContent = sortCount > 1 && sortIndex >= 0 ? String(sortIndex + 1) : '';
    sort.className = 'fg-sort' + (sortDirection === 1 ? ' fg-sort-asc' : sortDirection === -1 ? ' fg-sort-desc' : ' fg-sort-none');
    sort.setAttribute('aria-hidden', 'true');
    resize.className = 'fg-resize';
    resize.setAttribute('data-resize-col', column._viewIndex);
    title.appendChild(label);
    sortWrap.appendChild(sortOrder);
    sortWrap.appendChild(sort);
    title.appendChild(sortWrap);
    cell.appendChild(title);
    if (getActiveFilterMode(this.options)) {
      filterIcon.className = 'fg-filter-icon' +
        (getActiveFilterMode(this.options) === 'searchRow' && searchOperator ? ' fg-filter-icon-active' : '') +
        (getActiveFilterMode(this.options) === 'excel' && excelFilterActive ? ' fg-filter-icon-excel-active' : '');
      filterIcon.textContent = getActiveFilterMode(this.options) === 'searchRow' && searchOperator ? getColumnSearchOperatorSymbol(searchOperator) : '';
      filterIcon.setAttribute('data-col', column._viewIndex);
      filterIcon.setAttribute('role', 'button');
      filterIcon.setAttribute('aria-label', this.getText('filter.openMenu', { column: headerText }));
      filterIcon.setAttribute('aria-haspopup', 'menu');
      filterIcon.setAttribute('aria-expanded', this.filterMenuColumn === column && this.isFilterMenuOpen() ? 'true' : 'false');
      title.appendChild(filterIcon);
    }
    if (getActiveFilterMode(this.options) === 'searchRow') {
      searchEditorConfig = getColumnEditorConfig(column);
      searchIcons = getColumnSearchIconConfigs(column);
      search = document.createElement('span');
      input = document.createElement('input');
      search.className = 'fg-header-search';
      search.style.height = this.getSearchRowHeight() + 'px';
      input.className = 'fg-header-search-input';
      input.type = 'text';
      input.inputMode = column.dataType === 'number' ? 'decimal' :
        (isDateLikeEditorType(searchEditorConfig.type) || searchEditorConfig.type === 'time' ? 'numeric' : 'search');
      input.value = this.getColumnSearchValue(column);
      input.style.textAlign = normalizeTextAlign(column.align);
      input.style.paddingRight = searchIcons.length ? (getIconConfigWidth(searchIcons, 22) + 8) + 'px' : '';
      input.setAttribute('data-col', column._viewIndex);
      input.setAttribute('aria-label', this.getHeaderCellText(column));
      input.setAttribute('autocomplete', 'off');
      if (searchIcons.length) {
        search.className += ' fg-header-search-with-icons';
      }
      search.appendChild(input);
      this.renderHeaderSearchIcons(search, column, searchIcons);
      cell.appendChild(search);
    }
    if (this.options.allowResizing) {
      cell.appendChild(resize);
    }
    this.raiseFormatItem(this.createFormatItemEventArgs(this.columnHeaders, cell, 0, column._index, {
      column: column,
      value: headerText
    }));
    applyHeaderCellStyle(
      cell.style,
      this.headerCellStyles ? this.headerCellStyles[column.binding] : null
    );
    return cell;
  };

  FabGrid.prototype.decorateFrozenDividerCell = function(cell, colIndex, pane) {
    if (!cell) {
      return;
    }
    if (pane === 'left' && colIndex === this.frozenColumns - 1) {
      cell.className += ' fg-frozen-divider-left';
      return;
    }
    if (pane === 'right' && colIndex === this.scrollableColumnEnd) {
      cell.className += ' fg-frozen-divider-right';
      return;
    }
    if (pane === 'scroll' && this.frozenRightWidth > 0 &&
      this.scrollableColumnEnd > this.frozenColumns && colIndex === this.scrollableColumnEnd - 1) {
      cell.className += ' fg-frozen-divider-right-neighbor';
    }
  };

  FabGrid.prototype.renderHeaderSearchIcons = function(search, column, iconConfigs) {
    var host;
    var button;
    var icon;
    var i;
    if (!iconConfigs || !iconConfigs.length) {
      return;
    }
    host = document.createElement('span');
    host.className = 'fg-header-search-icons';
    for (i = 0; i < iconConfigs.length; i += 1) {
      icon = iconConfigs[i];
      button = document.createElement('button');
      button.type = 'button';
      button.className = trimText('fg-header-search-icon fg-editor-trigger-custom ' + normalizeClassName(icon.iconCls));
      button.setAttribute('data-col', column._viewIndex);
      button.setAttribute('data-icon-index', i);
      button.setAttribute('aria-label', icon.ariaLabel || this.getHeaderCellText(column));
      button.title = icon.title || '';
      button.textContent = icon.text || '';
      button.style.width = Math.max(18, toNumber(icon.width, 22)) + 'px';
      host.appendChild(button);
    }
    search.appendChild(host);
  };

  FabGrid.prototype.getColumnSearchValue = function(column) {
    var value = this.columnSearchValues[getColumnSearchKey(column)];
    var mask = getEditorMask(column);
    if (value == null) {
      return '';
    }
    if (mask) {
      return formatMaskText(value, { mask: mask });
    }
    return String(value);
  };

  FabGrid.prototype.getColumnSearchOperator = function(column) {
    return normalizeColumnSearchOperator(this.columnSearchOperators[getColumnSearchKey(column)]);
  };

  FabGrid.prototype.isExcelFilterActive = function(column) {
    return !!(column && this.excelFilters && this.excelFilters[getColumnSearchKey(column)]);
  };

  FabGrid.prototype.getHeaderCellText = function(column) {
    if (!column) {
      return '';
    }
    if (this.headerDisplayMode === 'binding') {
      return column.binding == null ? '' : String(column.binding);
    }
    return column.header || column.binding || '';
  };

  FabGrid.prototype.renderBody = function(rowRange, colRange) {
    var frozenFragment = document.createDocumentFragment();
    var frozenRightFragment = document.createDocumentFragment();
    var scrollFragment = document.createDocumentFragment();
    var rendered = 0;
    var selectionRange = this.isCellRangeSelectionMode() ? this.getSelectionRange() : null;
    var cell;
    var r;
    var c;

    this.frozenLayer.innerHTML = '';
    this.frozenRightLayer.innerHTML = '';
    this.cellLayer.innerHTML = '';

    for (r = rowRange.start; r < rowRange.end; r += 1) {
      if (this.isRowGroup(this.view[r])) {
        cell = this.createRowGroupCell(r, 'left');
        if (cell) {
          frozenFragment.appendChild(cell);
          rendered += 1;
        }
        cell = this.createRowGroupCell(r, 'scroll');
        if (cell) {
          scrollFragment.appendChild(cell);
          rendered += 1;
        }
        cell = this.createRowGroupCell(r, 'right');
        if (cell) {
          frozenRightFragment.appendChild(cell);
          rendered += 1;
        }
        continue;
      }
      for (c = 0; c < this.frozenColumns; c += 1) {
        cell = this.createBodyCell(r, c, 'left', selectionRange);
        if (cell) {
          frozenFragment.appendChild(cell);
          rendered += 1;
        }
      }
      for (c = colRange.start; c < colRange.end; c += 1) {
        cell = this.createBodyCell(r, c, 'scroll', selectionRange);
        if (cell) {
          scrollFragment.appendChild(cell);
          rendered += 1;
        }
      }
      for (c = this.scrollableColumnEnd; c < this.visibleColumns.length; c += 1) {
        cell = this.createBodyCell(r, c, 'right', selectionRange);
        if (cell) {
          frozenRightFragment.appendChild(cell);
          rendered += 1;
        }
      }
    }

    this.frozenLayer.appendChild(frozenFragment);
    this.frozenRightLayer.appendChild(frozenRightFragment);
    this.cellLayer.appendChild(scrollFragment);
    return rendered;
  };

  FabGrid.prototype.createRowGroupCell = function(rowIndex, pane) {
    var group = this.view[rowIndex];
    var cell = document.createElement('div');
    var expander = document.createElement('span');
    var label = document.createElement('span');
    var summaryInfos;
    var summary;
    var fixedLeftWidth = this.getFixedLeftWidth();
    var top = rowIndex * this.options.rowHeight;
    var viewportTop = top - this.bodyScroll.scrollTop;
    var height = this.getVisibleRowHeight(viewportTop);
    var paneStart = 0;
    var paneEnd = this.visibleColumns.length;
    var paneLeft = fixedLeftWidth;
    var paneWidth = Math.max(this.totalWidth, this.bodyScroll.clientWidth - fixedLeftWidth);
    var paneTop = top;
    var summaryLeftOffset = 0;
    var showLabel = true;
    var isSelected = this.shouldHighlightRow(rowIndex);
    var isFirstPane;
    var isLastPane;
    var i;
    if (!group || height <= 0) {
      return null;
    }

    if (pane === 'left') {
      if (!this.frozenWidth) {
        return null;
      }
      paneEnd = this.frozenColumns;
      paneLeft = 0;
      paneWidth = this.frozenWidth;
      paneTop = viewportTop;
    } else if (pane === 'scroll') {
      if (!this.scrollableWidth) {
        return null;
      }
      paneStart = this.frozenColumns;
      paneEnd = this.scrollableColumnEnd;
      paneLeft = fixedLeftWidth + this.frozenWidth;
      paneWidth = this.scrollableWidth;
      summaryLeftOffset = this.frozenWidth;
      showLabel = this.frozenColumns === 0;
    } else if (pane === 'right') {
      if (!this.frozenRightWidth) {
        return null;
      }
      paneStart = this.scrollableColumnEnd;
      paneLeft = 0;
      paneWidth = this.frozenRightWidth;
      paneTop = viewportTop;
      summaryLeftOffset = this.frozenRightStartLeft;
      showLabel = paneStart === 0;
    }

    isFirstPane = pane === 'left' ||
      (pane === 'scroll' && !this.frozenWidth) ||
      (pane === 'right' && !this.frozenWidth && !this.scrollableWidth);
    isLastPane = pane === 'right' ||
      (pane === 'scroll' && !this.frozenRightWidth) ||
      (pane === 'left' && !this.scrollableWidth && !this.frozenRightWidth);
    cell.className = 'fg-cell fg-row-group-cell fg-row-group-pane-' + pane;
    this.decorateFrozenDividerCell(cell,
      pane === 'left' ? this.frozenColumns - 1 :
        pane === 'right' ? this.scrollableColumnEnd : this.scrollableColumnEnd - 1,
      pane);
    if (isSelected) {
      cell.className += ' fg-row-group-selected';
      if (isFirstPane) {
        cell.className += ' fg-row-group-selected-start';
      }
      if (isLastPane) {
        cell.className += ' fg-row-group-selected-end';
      }
    }
    cell.style.left = paneLeft + 'px';
    cell.style.top = paneTop + 'px';
    cell.style.width = paneWidth + 'px';
    cell.style.height = height + 'px';
    cell.style.setProperty('--fg-row-group-indent', (group.level || 0) * 16 + 'px');
    cell.style.backgroundColor = '#e1e1e1';
    cell.style.backgroundImage = 'none';
    cell.setAttribute('data-row', rowIndex);
    cell.setAttribute('data-row-group', group.key);
    cell.setAttribute('role', showLabel ? 'rowheader' : 'gridcell');
    if (showLabel) {
      expander.className = 'fg-row-group-expander';
      expander.textContent = group.collapsed ? '▸' : '▾';
      label.className = 'fg-row-group-label';
      label.textContent = group.label;
      cell.appendChild(expander);
      cell.appendChild(label);
    }
    summaryInfos = this.getRowGroupSummaryInfos(group);
    for (i = 0; i < summaryInfos.length; i += 1) {
      if (summaryInfos[i].columnIndex < paneStart || summaryInfos[i].columnIndex >= paneEnd) {
        continue;
      }
      summary = document.createElement('span');
      summary.className = 'fg-row-group-summary';
      summary.setAttribute('data-col', summaryInfos[i].columnIndex);
      summary.textContent = summaryInfos[i].text;
      summary.style.left = (summaryInfos[i].left - summaryLeftOffset) + 'px';
      summary.style.width = summaryInfos[i].width + 'px';
      summary.style.textAlign = summaryInfos[i].textAlign;
      summary.style.justifyContent = summaryInfos[i].justifyContent;
      if (summaryInfos[i].color) {
        summary.style.color = summaryInfos[i].color;
      }
      cell.appendChild(summary);
    }
    return cell;
  };

  FabGrid.prototype.getRowGroupSummaryInfos = function(group) {
    var summaries = [];
    var i;
    var column;
    var value;
    if (!group || !group.aggregates) {
      return summaries;
    }
    for (i = 0; i < this.visibleColumns.length; i += 1) {
      column = this.visibleColumns[i];
      if (column && column.aggregate) {
        value = this.getRowGroupAggregateValue(group, column);
        value = this.formatAggregateValue(value, column, group.items);
        if (value) {
          summaries.push({
            columnIndex: i,
            text: value == null ? '' : String(value),
            left: column._left,
            width: column._width,
            textAlign: normalizeTextAlign(column.align),
            justifyContent: normalizeJustifyContent(column.align),
            color: column.color || ''
          });
        }
      }
    }
    return summaries;
  };

  FabGrid.prototype.createBodyCell = function(rowIndex, colIndex, pane, selectionRange) {
    var row = this.view[rowIndex];
    var column = this.visibleColumns[colIndex];
    var value = this.isRowGroupFooter(row) ? this.getRowGroupFooterValue(row, column) : getByBinding(row, column.binding);
    var cell = document.createElement('div');
    var isFrozen = pane === true || pane === 'left' || pane === 'right';
    var left = this.getFixedLeftWidth() + column._left;
    var top = isFrozen ? rowIndex * this.options.rowHeight - this.bodyScroll.scrollTop : rowIndex * this.options.rowHeight;
    var viewportTop = rowIndex * this.options.rowHeight - this.bodyScroll.scrollTop;
    var height = this.getVisibleRowHeight(viewportTop);

    if (height <= 0) {
      return null;
    }

    if (pane === true || pane === 'left') {
      left = column._left;
    } else if (pane === 'right') {
      left = column._left - this.frozenRightStartLeft;
    }

    cell.className = 'fg-cell';
    this.decorateFrozenDividerCell(cell, colIndex, pane === true ? 'left' : pane);
    if (this.isAlternatingRow(rowIndex)) {
      cell.className += ' fg-row-even fg-row-alt';
    }
    if (column.align) {
      cell.className += ' fg-align-' + column.align;
    }
    if (column.color) {
      cell.style.color = column.color;
    }
    if (this.hoverRow === rowIndex) {
      cell.className += ' fg-row-hovered';
    }
    if (this.shouldHighlightRow(rowIndex)) {
      cell.className += ' fg-row-selected';
    }
    if (this.isRowGroupFooter(row)) {
      cell.className += ' fg-row-group-footer-cell';
    }
    if (this.selection.row === rowIndex && this.selection.col === colIndex) {
      cell.className += ' fg-selected';
    }
    if (selectionRange && this.isCellInSelectionRange(rowIndex, colIndex)) {
      cell.className += ' fg-range-selected';
      if (rowIndex === selectionRange.row) {
        cell.className += ' fg-range-top';
      }
      if (rowIndex === selectionRange.row2) {
        cell.className += ' fg-range-bottom';
      }
      if (colIndex === selectionRange.col) {
        cell.className += ' fg-range-left';
      }
      if (colIndex === selectionRange.col2) {
        cell.className += ' fg-range-right';
      }
    }
    if (this.getCellValidationError(row, column)) {
      cell.className += ' fg-cell-invalid';
      cell.setAttribute('aria-invalid', 'true');
    }
    cell.style.left = left + 'px';
    cell.style.top = top + 'px';
    cell.style.width = column._width + 'px';
    cell.style.height = height + 'px';
    cell.setAttribute('data-row', rowIndex);
    cell.setAttribute('data-col', colIndex);
    cell.setAttribute('role', 'gridcell');
    this.applyRowDraggable(cell, rowIndex);
    this.renderCellContent(cell, row, column, value, rowIndex, colIndex);
    this.decorateTreeCell(cell, row, column, rowIndex);
    return cell;
  };

  FabGrid.prototype.getVisibleRowHeight = function(viewportTop) {
    return this.options.rowHeight;
  };

  FabGrid.prototype.getCellDisplayText = function(item, column, value) {
    var text = value == null ? '' : String(value);
    var editorConfig = getColumnEditorConfig(column);
    if (this.isRowGroupFooter(item)) {
      text = column.aggregate ? this.formatAggregateValue(value, column, item.items) : '';
      return text == null ? '' : String(text);
    }
    if (editorConfig.type === 'combo') {
      text = getComboboxTextByValue(value, editorConfig);
    }
    if (column.dataType === 'number' && value != null && value !== '' &&
      (shouldUseThousandsSeparator(column) || getNumberPrecision(column) != null)) {
      text = formatNumberDisplayText(value, column);
    }
    if (editorConfig.type === 'time' && getEditorMask(column)) {
      text = formatMaskText(value, getMaskOptions(column, getEditorMask(column)));
    } else if (getExplicitEditorMask(column)) {
      text = formatMaskText(value, getMaskOptions(column, getExplicitEditorMask(column)));
    }
    if (typeof column.formatter === 'function') {
      text = column.formatter(value, item, column);
    }
    return text == null ? '' : String(text);
  };

  FabGrid.prototype.getPanelCellData = function(panel, row, col, formatted) {
    var column = this.columns[col] || null;
    var item;
    var value;
    if (!panel) {
      return undefined;
    }
    if (panel.cellType === CellType.ColumnHeader) {
      return column ? this.getHeaderCellText(column) : undefined;
    }
    if (panel.cellType === CellType.ColumnFooter) {
      return column ? formatted ? this.getFooterCellText(column) : this.getFooterCellValue(column) : undefined;
    }
    if (panel.cellType === CellType.RowHeader) {
      return row >= 0 && row < this.view.length ? this.getDisplayRowNumber(row) : undefined;
    }
    if (panel.cellType === CellType.TopLeft) {
      return this.options.rowHeaderHeader;
    }
    if (panel.cellType === CellType.BottomLeft) {
      return this.options.footerLabel;
    }
    if (panel.cellType !== CellType.Cell || !column) {
      return undefined;
    }
    item = this.view[row];
    if (!item || this.isRowGroup(item)) {
      return undefined;
    }
    value = this.isRowGroupFooter(item) ? this.getRowGroupFooterValue(item, column) : getByBinding(item, column.binding);
    return formatted ? this.getCellDisplayText(item, column, value) : value;
  };

  FabGrid.prototype.createFormatItemEventArgs = function(panel, cell, row, col, detail) {
    var grid = this;
    var args;
    detail = detail || {};
    args = {
      grid: grid,
      panel: panel,
      range: {
        row: row,
        col: col,
        row2: row,
        col2: col
      },
      row: row,
      col: col,
      rowIndex: row,
      colIndex: col,
      viewCol: detail.viewCol == null ? col : detail.viewCol,
      data: detail.item == null ? null : detail.item,
      item: detail.item == null ? null : detail.item,
      column: detail.column || null,
      value: detail.value,
      cell: cell,
      updateContent: true,
      cancel: false,
      getColumn: function() {
        return args.column;
      },
      getRow: function() {
        return grid.rows[args.row] || null;
      }
    };
    return args;
  };

  FabGrid.prototype.raiseFormatItem = function(args) {
    this.emit('formatItem', args);
    return args;
  };

  FabGrid.prototype.renderCellContent = function(cell, item, column, value, rowIndex, colIndex) {
    var text = this.getCellDisplayText(item, column, value);
    var editorConfig = getColumnEditorConfig(column);
    var templateApplied = this.applyCellTemplate(cell, item, column, value, text, rowIndex);
    var args;
    if (!templateApplied) {
      if (this.isRowGroupFooter(item)) {
        cell.textContent = text;
      } else if (editorConfig.type === 'color' && typeof column.formatter !== 'function') {
        this.renderColorCellContent(cell, text);
      } else {
        cell.textContent = text;
      }
    }
    args = this.createFormatItemEventArgs(this.cells, cell, rowIndex, column._index, {
      item: item,
      column: column,
      value: value,
      viewCol: colIndex
    });
    if (!this.isRowGroupFooter(item)) {
      if (typeof this.options.formatCell === 'function') {
        this.options.formatCell(args);
      }
      if (typeof this.options.itemFormatter === 'function') {
        this.options.itemFormatter(this.cells, rowIndex, colIndex, cell);
      }
    }
    this.raiseFormatItem(args);
  };

  FabGrid.prototype.getCellTemplateRenderer = function(column) {
    var template = column ? column.cellTemplate : null;
    if (typeof template === 'function') {
      return template;
    }
    if (typeof template !== 'string') {
      return null;
    }
    if (column._cellTemplateSource !== template || typeof column._cellTemplateRenderer !== 'function') {
      column._cellTemplateSource = template;
      column._cellTemplateRenderer = compileCellTemplateString(template);
    }
    return column._cellTemplateRenderer;
  };

  FabGrid.prototype.applyCellTemplate = function(cell, item, column, value, text, rowIndex) {
    var renderer = this.getCellTemplateRenderer(column);
    var originalStyle;
    var ctx;
    var result;
    if (!renderer) {
      return false;
    }
    ctx = {
      col: column,
      row: this.rows[rowIndex] || null,
      item: item,
      value: value,
      text: text
    };
    if (typeof column.cellTemplate === 'function' && cell.style && typeof cell.style.item === 'function') {
      originalStyle = captureCellInlineStyle(cell.style);
      try {
        result = renderer(ctx, cell);
      } finally {
        restoreCellTemplateStyle(cell, originalStyle);
      }
    } else {
      result = renderer(ctx, cell);
    }
    if (result != null) {
      cell.innerHTML = String(result);
    }
    return true;
  };

  FabGrid.prototype.renderColorCellContent = function(cell, value) {
    var color = normalizeColorValue(value);
    var swatch;
    var text;
    cell.className += ' fg-color-cell';
    cell.textContent = '';
    if (color) {
      swatch = document.createElement('span');
      swatch.className = 'fg-color-swatch';
      swatch.style.backgroundColor = color;
      cell.appendChild(swatch);
    }
    text = document.createElement('span');
    text.className = 'fg-color-text';
    text.textContent = value == null ? '' : String(value);
    cell.appendChild(text);
  };

  FabGrid.prototype.renderSelection = function() {
    if (this.editing) {
      this.positionEditor();
    }
  };
}
