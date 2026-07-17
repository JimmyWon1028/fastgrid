/*! FabUI ES module | Pure JavaScript UI bundle */
var controlRegistry = new WeakMap();

function resolveControlElement(element) {
  if (typeof element === 'string') {
    if (typeof document === 'undefined') {
      return null;
    }
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function Control() {
  this._managedEventListeners = [];
}

Control.prototype.addEventListener = function(target, type, fn, capture, passive) {
  var listeners;
  var useCapture = capture === true;
  var options = passive == null ? useCapture : {
    capture: useCapture,
    passive: passive === true
  };
  var i;
  if (!target || typeof target.addEventListener !== 'function') {
    throw new TypeError('Event target must support addEventListener.');
  }
  if (typeof fn !== 'function' && (!fn || typeof fn.handleEvent !== 'function')) {
    throw new TypeError('Event listener must be a function or EventListener object.');
  }
  listeners = this._managedEventListeners || (this._managedEventListeners = []);
  for (i = 0; i < listeners.length; i += 1) {
    if (listeners[i].target === target &&
      listeners[i].type === type &&
      listeners[i].fn === fn &&
      listeners[i].capture === useCapture) {
      return;
    }
  }
  target.addEventListener(type, fn, options);
  listeners.push({
    target: target,
    type: type,
    fn: fn,
    capture: useCapture
  });
};

Control.prototype.removeEventListener = function(target, type, fn, capture) {
  var listeners = this._managedEventListeners || [];
  var matchCapture = arguments.length > 3;
  var removed = 0;
  var item;
  var i;
  for (i = listeners.length - 1; i >= 0; i -= 1) {
    item = listeners[i];
    if ((target == null || item.target === target) &&
      (type == null || item.type === type) &&
      (fn == null || item.fn === fn) &&
      (!matchCapture || item.capture === (capture === true))) {
      item.target.removeEventListener(item.type, item.fn, item.capture);
      listeners.splice(i, 1);
      removed += 1;
    }
  }
  return removed;
};

Control.getControl = function(element) {
  var host = resolveControlElement(element);
  return host ? controlRegistry.get(host) || null : null;
};

function registerControl(element, control) {
  if (element && element.nodeType === 1 && control) {
    controlRegistry.set(element, control);
  }
}

function unregisterControl(element, control) {
  if (element && controlRegistry.get(element) === control) {
    controlRegistry.delete(element);
  }
}

function normalizeChartType(type) {
  type = String(type || 'column').toLowerCase();
  if (type === 'linesymbols') return 'line';
  return type === 'bar' || type === 'line' || type === 'pie' ? type : 'column';
}

function createChartFactory() {
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var DEFAULT_COLORS = [
    'rgba(136, 189, 230, .72)',
    'rgba(251, 178, 88, .72)',
    'rgba(144, 205, 151, .72)',
    'rgba(246, 170, 201, .72)',
    'rgba(191, 165, 84, .72)',
    'rgba(188, 153, 199, .72)',
    'rgba(100, 181, 205, .72)',
    'rgba(250, 220, 140, .72)'
  ];
  var DEFAULT_MESSAGES = {
    en: { emptyText: 'No data', value: 'Value', percent: 'Percent' },
    'zh-TW': { emptyText: '沒有資料', value: '數值', percent: '百分比' },
    'zh-CN': { emptyText: '没有数据', value: '数值', percent: '百分比' }
  };

  function Chart(element, options) {
    this.host = typeof element === 'string' ? document.querySelector(element) : element;
    if (!this.host) throw new Error('fabui.Chart host element was not found.');
    this.options = mergeOptions({
      chartType: null, type: 'column', header: '', footer: '', title: '', itemsSource: null,
      bindingX: '', bindingName: '', binding: '', categories: [], series: [], palette: null, colors: DEFAULT_COLORS,
      legend: true, tooltip: true, padding: 16, locale: 'en', animation: true,
      observeData: true, dataRefreshInterval: 120,
      axisX: {}, axisY: {}, selectionMode: 'None', selection: null, selectedIndex: -1, selectionSource: null,
      selectedItemOffset: .1, selectedItemPosition: 'Top', isAnimated: true,
      dataLabel: null, formatValue: null, formatTooltip: null, emptyText: null
    }, options || {});
    this.events = {};
    defineOptionProperties(this, ['chartType', 'itemsSource', 'bindingX', 'bindingName', 'binding', 'header', 'footer', 'series', 'axisX', 'axisY', 'legend', 'tooltip', 'palette', 'selectionMode', 'selection', 'selectedIndex', 'selectedItemOffset', 'selectedItemPosition', 'isAnimated', 'dataLabel', 'animation', 'observeData', 'dataRefreshInterval']);
    this.disposed = false;
    this._selectionSource = null;
    this._selectionSourceHandler = null;
    this.raf = 0;
    this._boundPointerMove = this.handlePointerMove.bind(this);
    this._boundPointerLeave = this.hideTooltip.bind(this);
    this._boundClick = this.handleClick.bind(this);
    this.createDom();
    this.bindEvents();
    this.refresh();
    this.startDataObserver();
    this.bindSelectionSource(this.options.selectionSource);
  }

  Chart.prototype.createDom = function() {
    this.host.innerHTML = '';
    this.root = document.createElement('div');
    this.root.className = 'fui-chart';
    this.title = document.createElement('div');
    this.title.className = 'fui-chart-title';
    this.body = document.createElement('div');
    this.body.className = 'fui-chart-body';
    this.svg = document.createElementNS(SVG_NS, 'svg');
    this.svg.setAttribute('class', 'fui-chart-svg');
    this.svg.setAttribute('role', 'img');
    this.legendElement = document.createElement('div');
    this.legendElement.className = 'fui-chart-legend';
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'fui-chart-tooltip';
    this.tooltip.setAttribute('role', 'tooltip');
    this.body.appendChild(this.svg);
    this.root.appendChild(this.title);
    this.root.appendChild(this.body);
    this.root.appendChild(this.legendElement);
    this.root.appendChild(this.tooltip);
    this.host.appendChild(this.root);
  };

  Chart.prototype.bindEvents = function() {
    this.svg.addEventListener('pointermove', this._boundPointerMove);
    this.svg.addEventListener('pointerleave', this._boundPointerLeave);
    this.svg.addEventListener('click', this._boundClick);
    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(this.invalidate.bind(this));
      this.resizeObserver.observe(this.host);
    }
  };

  Chart.prototype.setType = function(type) { this.options.chartType = type; this.options.type = type; this.refresh(); return this; };
  Chart.prototype.setItemsSource = function(itemsSource) { this.options.itemsSource = Array.isArray(itemsSource) ? itemsSource : []; this.refresh(); return this; };
  Chart.prototype.setOptions = function(options) { this.options = mergeOptions(this.options, options || {}); if (Object.prototype.hasOwnProperty.call(options || {}, 'selectionSource')) this.bindSelectionSource(this.options.selectionSource); this.refresh(); return this; };
  Chart.prototype.setSeries = function(series) { this.options.series = Array.isArray(series) ? series : []; this.refresh(); return this; };
  Chart.prototype.setData = function(data) {
    data = data || {};
    if (Array.isArray(data.categories)) this.options.categories = data.categories;
    if (Array.isArray(data.series)) this.options.series = data.series;
    this.refresh(); return this;
  };
  Chart.prototype.resize = function() { this.refresh(); return this; };
  Chart.prototype.bindSelectionSource = function(source) {
    var self = this;
    this.unbindSelectionSource();
    this.options.selectionSource = source || null;
    if (!source || !source.selectionChanged || typeof source.selectionChanged.addHandler !== 'function') return this;
    this._selectionSource = source;
    this._selectionSourceHandler = function() { if (source.selection && source.selection.row != null) self.selectPoint(source.selection.row); };
    source.selectionChanged.addHandler(this._selectionSourceHandler, this);
    if (source.selection && source.selection.row != null) this.selectPoint(source.selection.row);
    return this;
  };
  Chart.prototype.unbindSelectionSource = function() {
    if (this._selectionSource && this._selectionSourceHandler && this._selectionSource.selectionChanged && typeof this._selectionSource.selectionChanged.removeHandler === 'function') this._selectionSource.selectionChanged.removeHandler(this._selectionSourceHandler, this);
    this._selectionSource = null;
    this._selectionSourceHandler = null;
    return this;
  };
  Chart.prototype.selectPoint = function(index, seriesIndex) {
    var nextSeriesIndex = seriesIndex == null ? null : Number(seriesIndex);
    var currentSelection = this.options.selection;
    index = Number(index);
    if (currentSelection && Number(currentSelection.pointIndex) === index && (normalizeChartType(this.options.chartType || this.options.type) === 'pie' || (currentSelection.seriesIndex == null ? nextSeriesIndex == null : Number(currentSelection.seriesIndex) === nextSeriesIndex))) return this;
    this.options.selectedIndex = isFinite(index) ? index : -1;
    this.options.selection = this.options.selectedIndex < 0 ? null : { pointIndex: this.options.selectedIndex, seriesIndex: nextSeriesIndex };
    if (normalizeChartType(this.options.chartType || this.options.type) === 'pie') this.refresh();
    else this.applySelection();
    return this;
  };
  Chart.prototype.on = function(name, handler) { if (typeof handler === 'function') (this.events[name] || (this.events[name] = [])).push(handler); return this; };
  Chart.prototype.off = function(name, handler) { this.events[name] = (this.events[name] || []).filter(function(item) { return item !== handler; }); return this; };
  Chart.prototype.emit = function(name, args) { (this.events[name] || []).slice().forEach(function(handler) { handler(args); }); };
  Chart.prototype.invalidate = function() {
    var self = this;
    if (this.disposed || this.raf) return;
    this.raf = requestAnimationFrame(function() { self.raf = 0; self.render(); });
  };
  Chart.prototype.refresh = function() { if (!this.disposed) this.render(); return this; };

  Chart.prototype.startDataObserver = function() {
    var self = this;
    this.dataSignature = getDataSignature(this.options);
    this.dataObserver = setInterval(function() {
      var signature;
      if (self.disposed || self.options.observeData === false) return;
      signature = getDataSignature(self.options);
      if (signature !== self.dataSignature) {
        self.dataSignature = signature;
        self.refresh();
      }
    }, Math.max(50, Number(this.options.dataRefreshInterval) || 120));
  };

  Chart.prototype.render = function() {
    var type = normalizeChartType(this.options.chartType || this.options.type);
    var model = createDataModel(this.options, type);
    var width = Math.max(240, this.body.clientWidth || this.host.clientWidth || 640);
    var height = Math.max(180, this.body.clientHeight || this.host.clientHeight || 360);
    this.svg.innerHTML = '';
    this.svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    this.emit('rendering', { chart: this });
    this.title.textContent = this.options.header || this.options.title || '';
    this.title.style.display = this.title.textContent ? '' : 'none';
    this.root.setAttribute('data-chart-type', type);
    this.dataSignature = getDataSignature(this.options);
    if (!hasData(model.series)) {
      this.renderEmpty(width, height);
      this.renderLegend([]);
      this.renderFooter(); this.emit('rendered', { chart: this }); return;
    }
    if (type === 'pie') this.renderPie(width, height, model);
    else this.renderCartesian(type, width, height, model);
    this.renderLegend(type === 'pie' ? model.pieLegend : model.series);
    this.renderFooter();
    this.applySelection();
    this.playAnimation();
    this.emit('rendered', { chart: this });
  };

  Chart.prototype.playAnimation = function() {
    if (this.options.animation === false) return;
    this.root.classList.remove('fui-chart-animate');
    void this.root.offsetWidth;
    this.root.classList.add('fui-chart-animate');
  };

  Chart.prototype.renderFooter = function() {
    if (!this.footerElement) {
      this.footerElement = document.createElement('div');
      this.footerElement.className = 'fui-chart-footer';
      this.root.insertBefore(this.footerElement, this.legendElement);
    }
    this.footerElement.textContent = this.options.footer || '';
    this.footerElement.style.display = this.options.footer ? '' : 'none';
  };

  Chart.prototype.renderEmpty = function(width, height) {
    var text = svgElement('text', { x: width / 2, y: height / 2, class: 'fui-chart-empty', 'text-anchor': 'middle' });
    text.textContent = this.options.emptyText || this.getMessage('emptyText');
    this.svg.appendChild(text);
  };

  Chart.prototype.renderCartesian = function(type, width, height, model) {
    var margin = { top: 16, right: 20, bottom: 44, left: 72 };
    var plot = { x: margin.left, y: margin.top, width: width - margin.left - margin.right, height: height - margin.top - margin.bottom };
    var categories = model.categories;
    var series = model.series;
    var range = getValueRange(series, this.options.axisY);
    var zero = valueToY(0, range, plot);
    var i;
    this.renderGrid(plot, range, type);
    if (type === 'line') this.renderLines(plot, range, categories, series);
    else this.renderBars(type, plot, range, categories, series, zero);
    for (i = 0; i < categories.length; i += 1) this.renderCategoryLabel(type, plot, categories, i);
  };

  Chart.prototype.renderGrid = function(plot, range, type) {
    var i;
    var ratio;
    var value;
    var line;
    var text;
    for (i = 0; i <= 5; i += 1) {
      ratio = i / 5;
      value = range.max - (range.max - range.min) * ratio;
      if (type === 'bar') {
        line = svgElement('line', { x1: plot.x + plot.width * ratio, y1: plot.y, x2: plot.x + plot.width * ratio, y2: plot.y + plot.height, class: 'fui-chart-grid-line' });
        text = svgElement('text', { x: plot.x + plot.width * ratio, y: plot.y + plot.height + 18, class: 'fui-chart-axis-label', 'text-anchor': 'middle' });
      } else {
        line = svgElement('line', { x1: plot.x, y1: plot.y + plot.height * ratio, x2: plot.x + plot.width, y2: plot.y + plot.height * ratio, class: 'fui-chart-grid-line' });
        text = svgElement('text', { x: plot.x - 8, y: plot.y + plot.height * ratio + 4, class: 'fui-chart-axis-label', 'text-anchor': 'end' });
      }
      text.textContent = this.formatValue(value);
      this.svg.appendChild(line); this.svg.appendChild(text);
    }
  };

  Chart.prototype.renderBars = function(type, plot, range, categories, series) {
    var count = Math.max(categories.length, getMaxDataLength(series));
    var groupSize = (type === 'bar' ? plot.height : plot.width) / Math.max(count, 1);
    var barSize = Math.max(2, groupSize * 0.72 / Math.max(series.length, 1));
    var s; var i; var value; var rect; var attrs;
    for (s = 0; s < series.length; s += 1) {
      for (i = 0; i < count; i += 1) {
        value = Number(series[s].data && series[s].data[i]);
        if (!isFinite(value)) continue;
        if (type === 'bar') attrs = getHorizontalBar(plot, range, groupSize, barSize, s, i, value);
        else attrs = getVerticalBar(plot, range, groupSize, barSize, s, i, value);
        attrs.fill = this.getColor(s); attrs.class = 'fui-chart-mark fui-chart-bar';
        rect = svgElement('rect', attrs);
        setDatum(rect, series[s].name || '', categories[i] || String(i + 1), value, null, i, s);
        this.svg.appendChild(rect);
      }
    }
  };

  Chart.prototype.renderLines = function(plot, range, categories, series) {
    var s; var i; var value; var points; var x; var y; var path; var circle;
    var count = Math.max(categories.length, getMaxDataLength(series));
    for (s = 0; s < series.length; s += 1) {
      points = [];
      for (i = 0; i < count; i += 1) {
        value = Number(series[s].data && series[s].data[i]);
        if (!isFinite(value)) { points.push(null); continue; }
        x = plot.x + (count <= 1 ? plot.width / 2 : plot.width * i / (count - 1));
        y = valueToY(value, range, plot);
        points.push([x, y]);
        circle = svgElement('circle', { cx: x, cy: y, r: 4, fill: this.getColor(s), class: 'fui-chart-mark fui-chart-point' });
        setDatum(circle, series[s].name || '', categories[i] || String(i + 1), value, null, i, s);
        this.svg.appendChild(circle);
      }
      path = svgElement('path', { d: linePath(points), fill: 'none', stroke: this.getColor(s), class: 'fui-chart-line' });
      this.svg.insertBefore(path, this.svg.firstChild);
    }
  };

  Chart.prototype.renderPie = function(width, height, model) {
    var data = model.series[0] && model.series[0].data || [];
    var values = data.map(pieValue);
    var total = values.reduce(function(sum, value) { return sum + Math.max(0, value); }, 0);
    var cx = width / 2; var cy = height / 2; var radius = Math.max(20, Math.min(width, height) * 0.36);
    var previousAngle = this.pieStartAngle;
    var angle = getPieStartAngle(values, total, this.options.selection, this.options.selectedItemPosition); var startAngle = angle; var next; var i; var path; var percent; var sliceCx; var sliceCy; var midAngle;
    var group = svgElement('g', { class: 'fui-chart-pie-group' });
    if (!total) { this.renderEmpty(width, height); return; }
    this.svg.appendChild(group);
    for (i = 0; i < data.length; i += 1) {
      if (values[i] <= 0) continue;
      next = angle + Math.PI * 2 * values[i] / total;
      midAngle = angle + (next - angle) / 2;
      sliceCx = cx;
      sliceCy = cy;
      if (this.options.selection && Number(this.options.selection.pointIndex) === i) {
        sliceCx += Math.cos(midAngle) * radius * clampOffset(this.options.selectedItemOffset);
        sliceCy += Math.sin(midAngle) * radius * clampOffset(this.options.selectedItemOffset);
      }
      path = svgElement('path', { d: piePath(sliceCx, sliceCy, radius, angle, next), fill: this.getColor(i), class: 'fui-chart-mark fui-chart-slice' });
      percent = values[i] / total * 100;
      setDatum(path, model.series[0].name || '', pieName(data[i], i), values[i], percent, i, 0);
      group.appendChild(path);
      this.renderPieDataLabel(group, sliceCx, sliceCy, radius, midAngle, data[i], values[i], percent, i);
      angle = next;
    }
    this.animatePieSelection(group, previousAngle, startAngle);
    this.pieStartAngle = startAngle;
  };

  Chart.prototype.renderPieDataLabel = function(group, cx, cy, radius, angle, item, value, percent, index) {
    var config = this.options.dataLabel;
    var position;
    var label;
    var content;
    var data;
    if (!config) return;
    data = { name: pieName(item, index), value: value, percent: percent, index: index, item: item };
    content = typeof config.content === 'function' ? config.content(data) : formatDataLabel(config.content == null ? '{percent}%' : config.content, data);
    if (content == null || content === '') return;
    position = String(config.position || 'Inside').toLowerCase() === 'outside' ? 1.08 : .62;
    label = svgElement('text', {
      x: cx + Math.cos(angle) * radius * position,
      y: cy + Math.sin(angle) * radius * position + 4,
      class: 'fui-chart-data-label',
      'text-anchor': 'middle'
    });
    label.textContent = String(content);
    group.appendChild(label);
  };

  Chart.prototype.animatePieSelection = function(group, previousAngle, nextAngle) {
    var delta;
    var self = this;
    if (!group || previousAngle == null || this.options.isAnimated === false) return;
    delta = normalizeAngle(previousAngle - nextAngle) * 180 / Math.PI;
    if (Math.abs(delta) < .01) return;
    group.style.transition = 'none';
    group.style.transform = 'rotate(' + delta + 'deg)';
    void group.getBoundingClientRect().width;
    if (this.pieAnimationRaf) cancelAnimationFrame(this.pieAnimationRaf);
    this.pieAnimationRaf = requestAnimationFrame(function() {
      self.pieAnimationRaf = 0;
      group.style.transition = 'transform .75s cubic-bezier(.22, .8, .3, 1)';
      group.style.transform = 'rotate(0deg)';
    });
  };

  Chart.prototype.renderCategoryLabel = function(type, plot, categories, index) {
    var count = Math.max(categories.length, 1);
    var maxLabels = type === 'bar' ? count : Math.max(2, Math.floor(plot.width / 100));
    var step = Math.max(1, Math.ceil(count / maxLabels));
    var text;
    if (type !== 'bar' && index % step !== 0 && index !== count - 1) return;
    if (type === 'bar') text = svgElement('text', { x: plot.x - 8, y: plot.y + plot.height * (index + 0.5) / count + 4, class: 'fui-chart-category-label', 'text-anchor': 'end' });
    else text = svgElement('text', { x: plot.x + plot.width * (index + 0.5) / count, y: plot.y + plot.height + 28, class: 'fui-chart-category-label', 'text-anchor': 'middle' });
    text.textContent = categories[index]; this.svg.appendChild(text);
  };

  Chart.prototype.renderLegend = function(series) {
    var self = this;
    this.legendElement.innerHTML = '';
    var position = getLegendPosition(this.options.legend);
    this.root.setAttribute('data-legend-position', position.toLowerCase());
    this.legendElement.style.display = position === 'None' ? 'none' : '';
    if (position === 'None') return;
    series.forEach(function(item, index) {
      var entry = document.createElement('span'); var swatch = document.createElement('i');
      entry.className = 'fui-chart-legend-item'; swatch.style.backgroundColor = self.getColor(index);
      entry.appendChild(swatch); entry.appendChild(document.createTextNode(item.name || ('Series ' + (index + 1)))); self.legendElement.appendChild(entry);
    });
  };

  Chart.prototype.handleClick = function(event) {
    var target = event.target.closest ? event.target.closest('.fui-chart-mark') : null;
    if (!target || String(this.options.selectionMode || 'None').toLowerCase() === 'none') return;
    this.options.selectedIndex = Number(target.dataset.pointIndex);
    this.options.selection = { seriesIndex: Number(target.dataset.seriesIndex), pointIndex: this.options.selectedIndex };
    if (normalizeChartType(this.options.chartType || this.options.type) === 'pie') this.refresh();
    else this.applySelection();
    this.emit('selectionChanged', { chart: this, selection: this.options.selection });
    if (this._selectionSource && typeof this._selectionSource.select === 'function') this._selectionSource.select(this.options.selectedIndex, this._selectionSource.selection && this._selectionSource.selection.col || 0);
  };

  Chart.prototype.applySelection = function() {
    var selection = this.options.selection;
    Array.prototype.forEach.call(this.svg.querySelectorAll('.fui-chart-mark'), function(mark) {
      var selected = selection && Number(mark.dataset.pointIndex) === Number(selection.pointIndex) && (selection.seriesIndex == null || Number(mark.dataset.seriesIndex) === Number(selection.seriesIndex));
      mark.classList.toggle('fui-chart-selected', !!selected);
    });
  };

  Chart.prototype.handlePointerMove = function(event) {
    var target = event.target.closest ? event.target.closest('.fui-chart-mark') : null;
    var content;
    if (!target || this.options.tooltip === false) { this.hideTooltip(); return; }
    content = { series: target.dataset.series, category: target.dataset.category, value: Number(target.dataset.value), percent: target.dataset.percent ? Number(target.dataset.percent) : null };
    this.tooltip.textContent = typeof this.options.formatTooltip === 'function' ? this.options.formatTooltip(content) :
      this.options.tooltip && typeof this.options.tooltip.content === 'function' ? this.options.tooltip.content(content) :
      this.options.tooltip && typeof this.options.tooltip.content === 'string' ? formatTemplate(this.options.tooltip.content, content) :
      (content.series ? content.series + ' · ' : '') + content.category + ': ' + this.formatValue(content.value) + (content.percent == null ? '' : ' (' + content.percent.toFixed(1) + '%)');
    this.tooltip.style.left = event.offsetX + 12 + 'px'; this.tooltip.style.top = event.offsetY + 12 + 'px'; this.tooltip.classList.add('fui-chart-tooltip-visible');
  };
  Chart.prototype.hideTooltip = function() { if (this.tooltip) this.tooltip.classList.remove('fui-chart-tooltip-visible'); };
  Chart.prototype.formatValue = function(value) { return typeof this.options.formatValue === 'function' ? String(this.options.formatValue(value)) : String(Math.round(value * 100) / 100); };
  Chart.prototype.getColor = function(index) { var colors = this.options.palette || this.options.colors; colors = colors && colors.length ? colors : DEFAULT_COLORS; return colors[index % colors.length]; };
  Chart.prototype.getMessage = function(key) { var locale = DEFAULT_MESSAGES[this.options.locale] || DEFAULT_MESSAGES.en; return locale[key] || DEFAULT_MESSAGES.en[key] || key; };
  Chart.prototype.dispose = function() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.pieAnimationRaf) cancelAnimationFrame(this.pieAnimationRaf);
    if (this.dataObserver) clearInterval(this.dataObserver);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.unbindSelectionSource();
    this.svg.removeEventListener('pointermove', this._boundPointerMove);
    this.svg.removeEventListener('pointerleave', this._boundPointerLeave);
    this.svg.removeEventListener('click', this._boundClick);
    this.host.innerHTML = '';
  };

  function svgElement(name, attrs) { var element = document.createElementNS(SVG_NS, name); Object.keys(attrs || {}).forEach(function(key) { element.setAttribute(key, attrs[key]); }); return element; }
  function defineOptionProperties(chart, names) { names.forEach(function(name) { Object.defineProperty(chart, name, { configurable: true, enumerable: true, get: function() { return chart.options[name]; }, set: function(value) { chart.options[name] = value; chart.invalidate(); } }); }); }
  function mergeOptions(base, override) { var result = {}; Object.keys(base || {}).forEach(function(key) { result[key] = base[key]; }); Object.keys(override || {}).forEach(function(key) { result[key] = override[key]; }); return result; }
  function hasData(series) { return Array.isArray(series) && series.some(function(item) { return Array.isArray(item.data) && item.data.length; }); }
  function getMaxDataLength(series) { return series.reduce(function(max, item) { return Math.max(max, item.data && item.data.length || 0); }, 0); }
  function getValueRange(series, axis) { var values = []; series.forEach(function(item) { (item.data || []).forEach(function(value) { value = Number(value); if (isFinite(value)) values.push(value); }); }); var min = axis && isFinite(Number(axis.min)) ? Number(axis.min) : Math.min.apply(Math, values.concat([0])); var max = axis && isFinite(Number(axis.max)) ? Number(axis.max) : Math.max.apply(Math, values.concat([0])); if (min === max) max = min + 1; return { min: min, max: max }; }
  function valueToY(value, range, plot) { return plot.y + (range.max - value) / (range.max - range.min) * plot.height; }
  function valueToX(value, range, plot) { return plot.x + (value - range.min) / (range.max - range.min) * plot.width; }
  function getVerticalBar(plot, range, groupSize, barSize, seriesIndex, index, value) { var x = plot.x + index * groupSize + groupSize * 0.14 + seriesIndex * barSize; var y = valueToY(Math.max(value, 0), range, plot); var zero = valueToY(0, range, plot); return { x: x, y: Math.min(y, zero), width: Math.max(1, barSize - 1), height: Math.max(1, Math.abs(zero - valueToY(value, range, plot))) }; }
  function getHorizontalBar(plot, range, groupSize, barSize, seriesIndex, index, value) { var zero = valueToX(0, range, plot); var end = valueToX(value, range, plot); return { x: Math.min(zero, end), y: plot.y + index * groupSize + groupSize * 0.14 + seriesIndex * barSize, width: Math.max(1, Math.abs(end - zero)), height: Math.max(1, barSize - 1) }; }
  function linePath(points) { var output = ''; var open = false; points.forEach(function(point) { if (!point) { open = false; return; } output += (open ? ' L ' : 'M ') + point[0] + ' ' + point[1]; open = true; }); return output; }
  function pieValue(item) { return Math.max(0, Number(item && typeof item === 'object' ? item.value : item) || 0); }
  function pieName(item, index) { return item && typeof item === 'object' && item.name != null ? String(item.name) : String(index + 1); }
  function getPieStartAngle(values, total, selection, position) {
    var selectedIndex;
    var before = 0;
    var selectedValue;
    var i;
    if (!selection || selection.pointIndex == null || String(position || 'None').toLowerCase() === 'none') return -Math.PI / 2;
    selectedIndex = Number(selection.pointIndex);
    if (!isFinite(selectedIndex) || selectedIndex < 0 || selectedIndex >= values.length || !total) return -Math.PI / 2;
    for (i = 0; i < selectedIndex; i += 1) before += Math.max(0, values[i]);
    selectedValue = Math.max(0, values[selectedIndex]);
    return getPositionAngle(position) - Math.PI * 2 * (before + selectedValue / 2) / total;
  }
  function getPositionAngle(position) { var value = String(position || 'Top').toLowerCase(); if (value === 'right') return 0; if (value === 'bottom') return Math.PI / 2; if (value === 'left') return Math.PI; return -Math.PI / 2; }
  function clampOffset(value) { value = Number(value); return isFinite(value) ? Math.max(0, Math.min(value, 1)) : 0; }
  function normalizeAngle(value) { while (value > Math.PI) value -= Math.PI * 2; while (value < -Math.PI) value += Math.PI * 2; return value; }
  function polar(cx, cy, r, angle) { return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]; }
  function piePath(cx, cy, r, start, end) { var a = polar(cx, cy, r, start); var b = polar(cx, cy, r, end); return 'M ' + cx + ' ' + cy + ' L ' + a[0] + ' ' + a[1] + ' A ' + r + ' ' + r + ' 0 ' + (end - start > Math.PI ? 1 : 0) + ' 1 ' + b[0] + ' ' + b[1] + ' Z'; }
  function setDatum(element, series, category, value, percent, pointIndex, seriesIndex) { element.dataset.series = series; element.dataset.category = category; element.dataset.value = value; element.dataset.pointIndex = pointIndex == null ? 0 : pointIndex; element.dataset.seriesIndex = seriesIndex == null ? 0 : seriesIndex; if (percent != null) element.dataset.percent = percent; }

  function createDataModel(options, type) {
    var items = Array.isArray(options.itemsSource) ? options.itemsSource : null;
    var series = options.series || [];
    var categories;
    if (!items) return { categories: options.categories || [], series: series, pieLegend: series };
    if (type === 'pie') {
      var data = items.map(function(item, index) { return { name: getBoundValue(item, options.bindingName) == null ? String(index + 1) : getBoundValue(item, options.bindingName), value: getBoundValue(item, options.binding) }; });
      return { categories: [], series: [{ name: options.header || '', data: data }], pieLegend: data.map(function(item) { return { name: item.name }; }) };
    }
    categories = items.map(function(item, index) { var value = getBoundValue(item, options.bindingX); return value == null ? String(index + 1) : value; });
    series = series.map(function(item) { return mergeOptions(item, { data: items.map(function(source) { return getBoundValue(source, item.binding); }) }); });
    return { categories: categories, series: series, pieLegend: [] };
  }
  function getBoundValue(item, binding) { if (!binding) return item; return String(binding).split('.').reduce(function(value, key) { return value == null ? value : value[key]; }, item); }
  function getLegendPosition(legend) { if (legend === false || legend && String(legend.position).toLowerCase() === 'none') return 'None'; return legend && legend.position ? String(legend.position) : 'Bottom'; }
  function formatTemplate(template, data) { return template.replace(/\{(seriesName|series|x|category|y|value|name|percent)\}/g, function(_, key) { var map = { seriesName: 'series', x: 'category', y: 'value', name: 'category' }; var value = data[map[key] || key]; return value == null ? '' : value; }); }
  function formatDataLabel(template, data) { return String(template).replace(/\{(name|value|percent)\}/g, function(_, key) { return key === 'percent' ? String(Math.round(data.percent * 10) / 10) : String(data[key] == null ? '' : data[key]); }); }
  function getDataSignature(options) {
    var items = Array.isArray(options.itemsSource) ? options.itemsSource : [];
    var bindings = [options.bindingX, options.bindingName, options.binding].concat((options.series || []).map(function(item) { return item.binding; })).filter(Boolean);
    if (!bindings.length) return JSON.stringify([options.categories, options.series]);
    return JSON.stringify(items.map(function(item) { return bindings.map(function(binding) { return getBoundValue(item, binding); }); }));
  }

  Chart.locales = DEFAULT_MESSAGES;
  Chart.ChartType = { Column: 'Column', Bar: 'Bar', Line: 'Line', Pie: 'Pie' };
  Chart.Position = { None: 'None', Left: 'Left', Top: 'Top', Right: 'Right', Bottom: 'Bottom' };
  Chart.SelectionMode = { None: 'None', Point: 'Point', Series: 'Series' };
  return Chart;
}

var CellType = Object.freeze({
  None: 0,
  Cell: 1,
  ColumnHeader: 2,
  RowHeader: 3,
  TopLeft: 4,
  ColumnFooter: 5,
  BottomLeft: 6
});

function Row(grid, index, dataItem) {
  this.grid = grid || null;
  this.index = index == null ? -1 : index;
  this.dataItem = dataItem;
  this.visible = true;
  this.isReadOnly = false;
}

Object.defineProperties(Row.prototype, {
  dataIndex: {
    get: function() {
      return this.index;
    }
  },
  collectionView: {
    get: function() {
      return this.grid ? this.grid.collectionView : null;
    }
  }
});

function GroupRow(grid, index, dataItem) {
  Row.call(this, grid, index, dataItem);
}

GroupRow.prototype = Object.create(Row.prototype);
GroupRow.prototype.constructor = GroupRow;

Object.defineProperties(GroupRow.prototype, {
  level: {
    get: function() {
      return this.dataItem && this.dataItem.level != null ? this.dataItem.level : 0;
    }
  },
  hasChildren: {
    get: function() {
      return !!(this.dataItem && this.dataItem.__fgRowType === 'group' &&
        this.dataItem.items && this.dataItem.items.length);
    }
  },
  isCollapsed: {
    get: function() {
      return !!(this.dataItem && this.dataItem.__fgRowType === 'group' && this.dataItem.collapsed);
    }
  },
  isGroupFooter: {
    get: function() {
      return !!(this.dataItem && this.dataItem.__fgRowType === 'groupFooter');
    }
  }
});

function createGridPanel(grid, cellType) {
  var panel = {
    grid: grid,
    cellType: cellType,
    getCellData: function(row, col, formatted) {
      return grid.getPanelCellData(panel, row, col, formatted === true);
    }
  };

  Object.defineProperties(panel, {
    rows: {
      get: function() {
        return grid.rows;
      }
    },
    columns: {
      get: function() {
        return grid.columns;
      }
    }
  });

  return panel;
}

function createDictionary() {
  return Object.create(null);
}

function isSafeBinding(binding) {
  var parts;
  var i;
  if (binding == null || binding === '') {
    return false;
  }
  parts = String(binding).split('.');
  for (i = 0; i < parts.length; i += 1) {
    if (!parts[i] || parts[i] === '__proto__' || parts[i] === 'prototype' || parts[i] === 'constructor') {
      return false;
    }
  }
  return true;
}

function getByBinding(item, binding) {
  var parts;
  var i;
  var value = item;
  if (!item || !isSafeBinding(binding)) {
    return undefined;
  }
  parts = String(binding).split('.');
  for (i = 0; i < parts.length; i += 1) {
    if (value == null) {
      return undefined;
    }
    value = value[parts[i]];
  }
  return value;
}

function setByBinding(item, binding, value) {
  var parts = String(binding).split('.');
  var target = item;
  var i;
  if (!item || !isSafeBinding(binding)) {
    return false;
  }
  for (i = 0; i < parts.length - 1; i += 1) {
    if (!Object.prototype.hasOwnProperty.call(target, parts[i]) || target[parts[i]] == null) {
      target[parts[i]] = {};
    }
    if (typeof target[parts[i]] !== 'object' && typeof target[parts[i]] !== 'function') {
      return false;
    }
    target = target[parts[i]];
  }
  target[parts[parts.length - 1]] = value;
  return true;
}

function compareValues(a, b, type) {
  if (a == null && b == null) {
    return 0;
  }
  if (a == null) {
    return -1;
  }
  if (b == null) {
    return 1;
  }
  if (type === 'number') {
    return Number(a) - Number(b);
  }
  if (type === 'date') {
    return new Date(a).getTime() - new Date(b).getTime();
  }
  if (type === 'boolean') {
    return (a ? 1 : 0) - (b ? 1 : 0);
  }
  a = String(a).toLowerCase();
  b = String(b).toLowerCase();
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

function normalizePagination(pageNumber, pageSize, total, defaultPageSize) {
  var normalizedSize = Math.max(1, Math.floor(toFiniteNumber(pageSize, defaultPageSize || 10)));
  var pageCount = Math.max(1, Math.ceil(Math.max(0, toFiniteNumber(total, 0)) / normalizedSize));
  return {
    pageNumber: clampNumber(Math.floor(toFiniteNumber(pageNumber, 1)), 1, pageCount),
    pageSize: normalizedSize,
    pageCount: pageCount
  };
}

function createRemoteSortParams(sortStates) {
  var fields = [];
  var orders = [];
  (sortStates || []).forEach(function(sortState) {
    if (sortState && sortState.column && typeof sortState.column.binding === 'string' && sortState.column.binding) {
      fields.push(sortState.column.binding);
      orders.push(sortState.direction === -1 ? 'desc' : 'asc');
    }
  });
  return fields.length ? { sort: fields.join(','), order: orders.join(',') } : {};
}

function normalizeRemoteData(data) {
  var rows = data && Array.isArray(data.rows) ? data.rows : [];
  return { rows: rows, total: Math.max(0, toFiniteNumber(data && data.total, rows.length)) };
}

function createRemoteRequest(url, method, params) {
  var normalizedMethod = String(method || 'get').toUpperCase();
  var requestUrl = String(url || '');
  var headers = { Accept: 'application/json' };
  var body = new URLSearchParams();
  Object.keys(params || {}).forEach(function(key) {
    if (params[key] != null) body.append(key, params[key]);
  });
  if (normalizedMethod === 'GET') {
    requestUrl += (requestUrl.indexOf('?') >= 0 ? '&' : '?') + body.toString();
  } else if (normalizedMethod === 'POST') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
  } else {
    throw new Error('Remote method must be GET or POST.');
  }
  return {
    url: requestUrl,
    options: {
      method: normalizedMethod,
      headers: headers,
      body: normalizedMethod === 'POST' ? body.toString() : undefined
    }
  };
}

function normalizeGroupConfigs(groups, maxLevels) {
  var source = Array.isArray(groups) ? groups : [];
  var configs = [];
  var limit = Math.max(0, maxLevels == null ? 3 : maxLevels);
  var i;
  for (i = 0; i < source.length && configs.length < limit; i += 1) {
    if (source[i]) configs.push(source[i]);
  }
  return configs;
}

function getGroupStateKey(parentStateKey, key, level) {
  return !parentStateKey && level === 0 ? key : parentStateKey + '\u001f' + level + ':' + key;
}

function getGroupKey(item, config, index, grid) {
  var getter = config.key || config.getKey;
  var bindings = config.bindings || config.binding || config.fields || config.field;
  var values = [];
  var i;
  if (typeof getter === 'function') return String(getter({ grid: grid, item: item, row: index }));
  if (!Array.isArray(bindings)) bindings = bindings == null ? [] : [bindings];
  for (i = 0; i < bindings.length; i += 1) values.push(getByBinding(item, bindings[i]));
  return values.join('_');
}

function createGroupBuckets(rows, config, grid) {
  var buckets = [];
  var lookup = createDictionary();
  var item;
  var key;
  var bucket;
  var i;
  for (i = 0; i < rows.length; i += 1) {
    item = rows[i];
    key = getGroupKey(item, config, i, grid);
    if (!Object.prototype.hasOwnProperty.call(lookup, key)) {
      bucket = { key: key, items: [], firstItem: item };
      lookup[key] = bucket;
      buckets.push(bucket);
    }
    lookup[key].items.push(item);
  }
  return buckets;
}

function calculateAggregate(aggregate, column, rows, grid) {
  var count = 0;
  var sum = 0;
  var min = null;
  var max = null;
  var i;
  var value;
  var number;
  var name;
  if (typeof aggregate === 'function') {
    return aggregate({ grid: grid, column: column, rows: rows, getValue: function(item) { return getByBinding(item, column.binding); } });
  }
  name = String(aggregate).toLowerCase();
  if (name === 'count') return rows.length;
  for (i = 0; i < rows.length; i += 1) {
    value = getByBinding(rows[i], column.binding);
    if (value == null || value === '') continue;
    number = Number(value);
    if (isNaN(number)) continue;
    sum += number;
    count += 1;
    if (min == null || number < min) min = number;
    if (max == null || number > max) max = number;
  }
  if (name === 'avg' || name === 'average') return count ? sum / count : null;
  if (name === 'min') return min;
  if (name === 'max') return max;
  return count ? sum : null;
}

function toFiniteNumber(value, fallback) {
  var number = Number(value);
  return isFinite(number) ? number : fallback;
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeExcelFilter(filter, normalizeOperator) {
  var type;
  var values;
  if (!filter || typeof filter !== 'object') {
    return null;
  }
  type = String(filter.type || filter.mode || '').toLowerCase();
  if (type === 'values') {
    values = Array.isArray(filter.values) ? filter.values.slice() : [];
    return { type: 'values', values: values };
  }
  return null;
}

function cloneExcelFilter(filter) {
  if (!filter) {
    return null;
  }
  return filter.type === 'values' ? {
    type: 'values',
    values: Array.isArray(filter.values) ? filter.values.slice() : []
  } : null;
}

function cloneExcelFilters(filters) {
  var result = {};
  var key;
  var filter;
  for (key in filters) {
    if (Object.prototype.hasOwnProperty.call(filters, key)) {
      filter = cloneExcelFilter(filters[key]);
      if (filter) {
        result[key] = filter;
      }
    }
  }
  return result;
}

function hasExcelFilters(filters) {
  var key;
  for (key in filters || {}) {
    if (Object.prototype.hasOwnProperty.call(filters, key) && filters[key]) {
      return true;
    }
  }
  return false;
}


function installFabGridData(FabGrid, context) {
  var DEFAULT_OPTIONS = context.DEFAULT_OPTIONS;
  var formatNumberDisplayText = context.formatNumberDisplayText;
  var getColumnSearchKey = context.getColumnSearchKey;
  var mergeOptions = context.mergeOptions;
  var normalizeColumnSearchOperator = context.normalizeColumnSearchOperator;
  var rowMatchesExcelFilters = context.rowMatchesExcelFilters;
  var rowMatchesColumnSearch = context.rowMatchesColumnSearch;
  var rowMatchesSearch = context.rowMatchesSearch;

  FabGrid.prototype.setRowGroups = function(groups, silent) {
    this.options.rowGroups = Array.isArray(groups) ? groups.slice() : [];
    this.applyView();
    this.resetVerticalScroll();
    if (!silent) {
      this.refresh();
    }
  };

  FabGrid.prototype.createGroupedView = function(rows) {
    var configs = normalizeGroupConfigs(this.options.rowGroups, 3);
    var output = [];
    if (!configs.length) {
      return rows;
    }

    this.appendGroupedRows(output, rows, configs, 0, '');
    return output;
  };

  FabGrid.prototype.appendGroupedRows = function(output, rows, configs, level, parentStateKey) {
    var config = configs[level];
    var buckets;
    var item;
    var bucket;
    var stateKey;
    var i;
    if (!config) {
      return;
    }
    buckets = createGroupBuckets(rows, config, this);
    for (i = 0; i < buckets.length; i += 1) {
      bucket = buckets[i];
      stateKey = this.getRowGroupStateKey(parentStateKey, bucket.key, level);
      item = this.createRowGroupItem(bucket, config, level, stateKey);
      output.push(item);
      if (!item.collapsed) {
        if (level + 1 < configs.length) {
          this.appendGroupedRows(output, bucket.items, configs, level + 1, stateKey);
        } else {
          Array.prototype.push.apply(output, bucket.items);
        }
      }
    }
  };

  FabGrid.prototype.getRowGroupStateKey = function(parentStateKey, key, level) {
    return getGroupStateKey(parentStateKey, key, level);
  };

  FabGrid.prototype.getRowGroupKey = function(item, config, index) {
    return getGroupKey(item, config, index, this);
  };

  FabGrid.prototype.createRowGroupItem = function(bucket, config, level, stateKey) {
    var formatter = config.header || config.formatter || config.label;
    var headerText = this.getRowGroupHeaderText(config);
    var label;
    var item = {
      __fgRowType: 'group',
      key: bucket.key,
      stateKey: stateKey,
      level: level,
      items: bucket.items,
      count: bucket.items.length,
      collapsed: this.rowGroupState[stateKey] === true,
      aggregates: this.calculateRowGroupAggregates(bucket.items)
    };
    if (typeof formatter === 'function') {
      label = formatter({
        grid: this,
        key: bucket.key,
        item: bucket.firstItem,
        items: bucket.items,
        count: bucket.items.length,
        level: level,
        config: config,
        header: headerText
      });
    } else {
      label = headerText ? headerText + ': ' + bucket.key : bucket.key;
    }
    item.label = label == null ? '' : String(label);
    return item;
  };

  FabGrid.prototype.getRowGroupHeaderText = function(config) {
    var bindings = config && (config.bindings || config.binding || config.fields || config.field);
    var labels = [];
    var column;
    var i;
    if (!Array.isArray(bindings)) {
      bindings = bindings == null ? [] : [bindings];
    }
    for (i = 0; i < bindings.length; i += 1) {
      column = this.getColumn(bindings[i]);
      labels.push(column && column.header ? column.header : String(bindings[i]));
    }
    return labels.join(' + ');
  };

  FabGrid.prototype.createRowGroupFooterItem = function(group) {
    return {
      __fgRowType: 'groupFooter',
      key: group.key,
      stateKey: group.stateKey,
      level: group.level,
      group: group,
      items: group.items,
      count: group.count,
      aggregates: group.aggregates
    };
  };

  FabGrid.prototype.calculateRowGroupAggregates = function(rows) {
    var values = {};
    var i;
    var column;
    for (i = 0; i < this.columns.length; i += 1) {
      column = this.columns[i];
      if (column.aggregate && column.binding) {
        values[column.binding] = this.calculateAggregateForRows(column.aggregate, column, rows);
      }
    }
    return values;
  };

  FabGrid.prototype.calculateAggregate = function(aggregate, column) {
    return this.calculateAggregateForRows(aggregate, column, this.dataView || this.view);
  };

  FabGrid.prototype.calculateAggregateForRows = function(aggregate, column, rows) {
    return calculateAggregate(aggregate, column, rows, this);
  };

  FabGrid.prototype.formatAggregateValue = function(value, column, rows) {
    var formatted;
    if (value == null) {
      return '';
    }
    if (typeof column.footerFormatter === 'function') {
      formatted = column.footerFormatter(value, column, rows || this.dataView || this.view);
      return formatted == null ? '' : String(formatted);
    }
    if (typeof column.formatter === 'function') {
      formatted = column.formatter(value, null, column);
      return formatted == null ? '' : String(formatted);
    }
    if (column && column.dataType === 'number') {
      return formatNumberDisplayText(value, column);
    }
    return String(value);
  };

  FabGrid.prototype.isRowGroup = function(item) {
    return !!(item && item.__fgRowType === 'group');
  };

  FabGrid.prototype.isRowGroupFooter = function(item) {
    return !!(item && item.__fgRowType === 'groupFooter');
  };

  FabGrid.prototype.getRowGroupAggregateValue = function(group, column) {
    if (column.binding && Object.prototype.hasOwnProperty.call(group.aggregates, column.binding)) {
      return group.aggregates[column.binding];
    }
    return this.calculateAggregateForRows(column.aggregate, column, group.items || []);
  };

  FabGrid.prototype.getRowGroupFooterValue = function(footer, column) {
    if (!footer || !column || !column.aggregate) {
      return '';
    }
    return this.getRowGroupAggregateValue(footer, column);
  };

  FabGrid.prototype.toggleRowGroup = function(rowIndex) {
    var group = this.view[rowIndex];
    if (!this.isRowGroup(group)) {
      return;
    }
    if (this.emit('groupCollapsedChanging', { group: group, collapsed: !group.collapsed }) === false) {
      return;
    }
    this.rowGroupState[group.stateKey || group.key] = !group.collapsed;
    this.applyView();
    this.clampSelection();
    this.render();
    this.emit('groupCollapsedChanged', {
      group: group,
      collapsed: this.rowGroupState[group.stateKey || group.key] === true
    });
  };

  FabGrid.prototype.toggleAllRowGroups = function() {
    var groups = [];
    var shouldCollapse = false;
    var i;
    var group;
    for (i = 0; i < this.view.length; i += 1) {
      group = this.view[i];
      if (this.isRowGroup(group)) {
        groups.push(group);
        if (!group.collapsed) {
          shouldCollapse = true;
        }
      }
    }
    if (!groups.length) {
      return;
    }
    if (shouldCollapse) {
      for (i = 0; i < groups.length; i += 1) {
        this.rowGroupState[groups[i].stateKey || groups[i].key] = true;
      }
    } else {
      this.rowGroupState = createDictionary();
    }
    this.applyView();
    this.clampSelection();
    this.render();
  };

  FabGrid.prototype.setItemsSource = function(rows, silent) {
    if (!silent && this.emit('itemsSourceChanging', { rows: rows || [] }) === false) {
      return;
    }
    if (!silent && this.emit('loadingRows', { rows: rows || [] }) === false) {
      return;
    }
    if (typeof this.resetTreeState === 'function') {
      this.resetTreeState();
    }
    this.source = this.createObservedItemsSource(rows || []);
    this.applyView();
    if (!silent) {
      this.emit('itemsSourceChanged', { rows: this.source });
      this.emit('loadedRows', { rows: this.view });
      this.refresh();
    }
  };

  FabGrid.prototype.load = function(params) {
    var self = this;
    var loader = this.options.loader;
    var request;
    var seq;
    var result;
    if (this.options.remote !== true || this.disposed) {
      return Promise.resolve(false);
    }
    if (typeof loader !== 'function' && !this.options.url) {
      return Promise.resolve(false);
    }
    request = mergeOptions(params || {}, {
      page: this.options.pageNumber,
      rows: this.options.pageSize
    });
    request = mergeOptions(request, this.getRemoteSortParams());
    request = mergeOptions(request, this.getRemoteFilterParams());
    if (this.emit('beforeLoad', { params: request }) === false) {
      return Promise.resolve(false);
    }
    this._remoteLoadSeq += 1;
    seq = this._remoteLoadSeq;
    this.setRemoteLoading(true);
    try {
      result = typeof loader === 'function'
        ? loader.call(this, request)
        : this.requestRemoteData(request);
    } catch (error) {
      result = Promise.reject(error);
    }
    return Promise.resolve(result).then(function(data) {
      if (self.disposed || seq !== self._remoteLoadSeq) {
        return false;
      }
      self.loadRemoteData(data);
      self.emit('loadSuccess', { data: data, params: request });
      return true;
    }).catch(function(error) {
      if (!self.disposed && seq === self._remoteLoadSeq) {
        self.emit('loadError', { error: error, params: request });
      }
      return false;
    }).then(function(success) {
      if (!self.disposed && seq === self._remoteLoadSeq) {
        self.setRemoteLoading(false);
      }
      return success;
    });
  };

  FabGrid.prototype.requestRemoteData = function(params) {
    var request;
    try {
      request = createRemoteRequest(this.options.url, this.options.method, params);
    } catch (error) {
      return Promise.reject(new Error('Remote method must be GET or POST.'));
    }
    return fetch(request.url, request.options).then(function(response) {
      if (!response.ok) {
        throw new Error('Remote request failed with HTTP ' + response.status + '.');
      }
      return response.json();
    });
  };

  FabGrid.prototype.getRemoteSortParams = function() {
    return createRemoteSortParams(this.getSortStates());
  };

  FabGrid.prototype.getRemoteFilterParams = function() {
    var rules = [];
    var self = this;
    if (this.options.allowFiltering !== false && this.options.showSearchRow === true) {
      this.columns.forEach(function(column) {
        var key = getColumnSearchKey(column);
        var value = self.columnSearchValues[key];
        if (typeof column.binding === 'string' && column.binding && value != null && String(value).trim()) {
          rules.push({
            field: column.binding,
            op: normalizeColumnSearchOperator(self.columnSearchOperators[key]) || 'starts',
            value: String(value).trim()
          });
        }
      });
    } else if (this.options.allowFiltering !== false) {
      this.columns.forEach(function(column) {
        var key = getColumnSearchKey(column);
        var filter = (self.excelFilters || {})[key];
        if (!filter || typeof column.binding !== 'string' || !column.binding) {
          return;
        }
        if (filter.type === 'values' && Array.isArray(filter.values)) {
          rules.push({
            field: column.binding,
            op: 'in',
            value: filter.values.slice()
          });
        }
      });
    }
    return {
      q: this.searchText || undefined,
      filterRules: rules.length ? JSON.stringify(rules) : undefined
    };
  };

  FabGrid.prototype.reload = function() {
    return this.load();
  };

  FabGrid.prototype.setRemoteLoading = function(value) {
    this.remoteLoading = value === true;
    this.busy = this.remoteLoading;
    this.root.setAttribute('aria-busy', this.remoteLoading ? 'true' : 'false');
    if (this.remoteLoadText) {
      this.remoteLoadText.textContent = this.options.loadMsg || this.getText('loadMsg');
    }
    if (this.remoteLoadMask) {
      this.remoteLoadMask.style.display = this.remoteLoading ? 'flex' : 'none';
    }
  };

  FabGrid.prototype.loadRemoteData = function(data) {
    var normalized = normalizeRemoteData(data);
    if (typeof this.resetTreeState === 'function') {
      this.resetTreeState();
    }
    this.source = this.createObservedItemsSource(normalized.rows);
    this.paginationTotal = normalized.total;
    this.applyView();
    this.resetVerticalScroll();
    this.refresh();
  };

  FabGrid.prototype.applyPagerOptions = function() {
    var pager = this.options.pager;
    if (!pager || typeof pager !== 'object') {
      return;
    }
    if (pager.pageNumber != null) {
      this.options.pageNumber = pager.pageNumber;
    }
    if (pager.pageSize != null) {
      this.options.pageSize = pager.pageSize;
    }
    if (Array.isArray(pager.pageList)) {
      this.options.pageList = pager.pageList.slice();
    }
    if (pager.showPageList != null) {
      this.options.showPageList = pager.showPageList === true;
    }
    if (pager.showPageInfo != null) {
      this.options.showPageInfo = pager.showPageInfo !== false;
    }
    if (pager.showRefresh != null) {
      this.options.showRefresh = pager.showRefresh !== false;
    }
  };

  FabGrid.prototype.createObservedItemsSource = function(rows) {
    var grid = this;
    var proxyCache;
    var proxySet;

    if (this.options.observeItemsSource !== true || typeof Proxy !== 'function' || !Array.isArray(rows)) {
      return rows;
    }

    proxyCache = typeof WeakMap === 'function' ? new WeakMap() : null;
    proxySet = typeof WeakSet === 'function' ? new WeakSet() : null;

    function canObserve(value) {
      return value && typeof value === 'object' &&
        (Array.isArray(value) || Object.prototype.toString.call(value) === '[object Object]');
    }

    function isInternalProperty(property) {
      return typeof property === 'string' && property.indexOf('__fg') === 0;
    }

    function observe(value) {
      var proxy;
      if (!canObserve(value)) {
        return value;
      }
      if (proxySet && proxySet.has(value)) {
        return value;
      }
      if (proxyCache && proxyCache.has(value)) {
        return proxyCache.get(value);
      }
      proxy = new Proxy(value, {
        get: function(target, property) {
          return observe(target[property]);
        },
        set: function(target, property, nextValue) {
          var previousValue = target[property];
          var observedValue = observe(nextValue);
          target[property] = observedValue;
          if (previousValue !== observedValue && !isInternalProperty(property)) {
            grid.handleObservedItemsSourceChange();
          }
          return true;
        },
        deleteProperty: function(target, property) {
          var changed = Object.prototype.hasOwnProperty.call(target, property);
          delete target[property];
          if (changed && !isInternalProperty(property)) {
            grid.handleObservedItemsSourceChange();
          }
          return true;
        }
      });
      if (proxyCache) {
        proxyCache.set(value, proxy);
      }
      if (proxySet) {
        proxySet.add(proxy);
      }
      return proxy;
    }

    return observe(rows);
  };

  FabGrid.prototype.handleObservedItemsSourceChange = function() {
    var grid = this;
    var enqueue;
    if (this.disposed || this._suppressObservedItemChange || this._handlingObservedItemChange || this._observedItemsChangeQueued) {
      return;
    }
    this._observedItemsChangeQueued = true;
    enqueue = typeof queueMicrotask === 'function' ? queueMicrotask : function(callback) {
      Promise.resolve().then(callback);
    };
    enqueue(function() {
      grid._observedItemsChangeQueued = false;
      if (grid.disposed || grid._suppressObservedItemChange || grid._handlingObservedItemChange) {
        return;
      }
      grid._handlingObservedItemChange = true;
      try {
        grid.applyView();
        grid.refresh();
      } finally {
        grid._handlingObservedItemChange = false;
      }
    });
  };

  FabGrid.prototype.setFilter = function(predicate) {
    if (this.options.remote === true && typeof predicate === 'function') {
      throw new Error('setFilter(predicate) is only available when remote is false. Use remote search rules or a custom loader instead.');
    }
    this.filterPredicate = typeof predicate === 'function' ? predicate : null;
    this.applyFilterChange(true, 'setFilter');
  };

  FabGrid.prototype.clearFilter = function() {
    this.filterPredicate = null;
    this.searchText = '';
    this.columnSearchValues = {};
    this.columnSearchOperators = {};
    this.excelFilters = {};
    this.cancelHeaderSearchTimer();
    this.hideFilterMenu();
    this.updateColumnSearchState();
    this.applyFilterChange(false, 'clearFilter');
  };

  FabGrid.prototype.setSearch = function(text) {
    this.searchText = String(text || '').toLowerCase();
    this.applyFilterChange(true, 'setSearch');
  };

  FabGrid.prototype.setColumnSearch = function(column, value) {
    var col = typeof column === 'number' ? this.visibleColumns[column] || this.columns[column] : typeof column === 'object' ? column : this.getColumn(column);
    var key;
    if (!col || this.options.allowFiltering === false) {
      return false;
    }
    this.cancelHeaderSearchTimer();
    key = getColumnSearchKey(col);
    value = String(value == null ? '' : value).trim();
    if (value) {
      this.columnSearchValues[key] = value;
    } else {
      delete this.columnSearchValues[key];
    }
    this.updateColumnSearchState();
    this.applyFilterChange(false, 'setColumnSearch');
    return true;
  };

  FabGrid.prototype.setColumnSearchOperator = function(column, operator) {
    var col = typeof column === 'number' ? this.visibleColumns[column] || this.columns[column] : typeof column === 'object' ? column : this.getColumn(column);
    var key;
    if (!col || this.options.allowFiltering === false) {
      return false;
    }
    key = getColumnSearchKey(col);
    operator = normalizeColumnSearchOperator(operator);
    if (operator) {
      this.columnSearchOperators[key] = operator;
    } else {
      delete this.columnSearchOperators[key];
    }
    this.hideFilterMenu();
    this.applyFilterChange(false, 'setColumnSearchOperator');
    return true;
  };

  FabGrid.prototype.applyHeaderSearch = function(colIndex, selectionStart, selectionEnd) {
    this.applyFilterChange(false, 'headerSearch');
    this.focusHeaderSearchInput(colIndex, selectionStart, selectionEnd);
  };

  FabGrid.prototype.clearColumnSearch = function() {
    this.columnSearchValues = {};
    this.columnSearchOperators = {};
    this.cancelHeaderSearchTimer();
    this.updateColumnSearchState();
    this.applyFilterChange(true, 'clearColumnSearch');
  };

  FabGrid.prototype.setExcelFilter = function(column, filter) {
    var col = typeof column === 'number' ? this.visibleColumns[column] || this.columns[column] : typeof column === 'object' ? column : this.getColumn(column);
    var key;
    var normalized;
    if (!col || this.options.allowFiltering === false || this.options.showSearchRow === true) {
      return false;
    }
    this.excelFilters = this.excelFilters || {};
    key = getColumnSearchKey(col);
    normalized = normalizeExcelFilter(filter, normalizeColumnSearchOperator);
    if (normalized) {
      this.excelFilters[key] = normalized;
    } else {
      delete this.excelFilters[key];
    }
    this.hideFilterMenu();
    this.applyFilterChange(false, 'setExcelFilter');
    return true;
  };

  FabGrid.prototype.getExcelFilter = function(column) {
    var col = typeof column === 'number' ? this.visibleColumns[column] || this.columns[column] : typeof column === 'object' ? column : this.getColumn(column);
    var filter;
    if (!col) {
      return null;
    }
    filter = (this.excelFilters || {})[getColumnSearchKey(col)];
    return filter ? cloneExcelFilter(filter) : null;
  };

  FabGrid.prototype.clearExcelFilter = function(column) {
    var col = typeof column === 'number' ? this.visibleColumns[column] || this.columns[column] : typeof column === 'object' ? column : this.getColumn(column);
    var key;
    if (!col) {
      return false;
    }
    this.excelFilters = this.excelFilters || {};
    key = getColumnSearchKey(col);
    if (!Object.prototype.hasOwnProperty.call(this.excelFilters, key)) {
      this.hideFilterMenu();
      return false;
    }
    delete this.excelFilters[key];
    this.hideFilterMenu();
    this.applyFilterChange(false, 'clearExcelFilter');
    return true;
  };

  FabGrid.prototype.clearExcelFilters = function(source) {
    this.excelFilters = {};
    this.hideFilterMenu();
    this.applyFilterChange(false, source || 'clearExcelFilters');
  };

  FabGrid.prototype.clearSearchConditions = function(source) {
    this.searchText = '';
    this.columnSearchValues = {};
    this.columnSearchOperators = {};
    this.cancelHeaderSearchTimer();
    this.hideFilterMenu();
    this.updateColumnSearchState();
    this.applyFilterChange(false, source || 'clearSearchConditions');
    this.emit('searchCleared', { source: source || 'api' });
  };

  FabGrid.prototype.applyFilterChange = function(resetHorizontalScroll, source) {
    var columnSearchValues;
    var columnSearchOperators;
    var columnSearchActive;
    var excelFilterActive;
    var excelFilters;
    var active;
    if (this.options.remote === true) {
      this.options.pageNumber = 1;
      if (this.options.pager) {
        this.options.pager.pageNumber = 1;
      }
    }
    this.applyView();
    if (resetHorizontalScroll === true) {
      this.resetScroll();
    } else {
      this.resetVerticalScroll();
    }
    this.refresh();
    columnSearchValues = mergeOptions({}, this.columnSearchValues || {});
    columnSearchOperators = mergeOptions({}, this.columnSearchOperators || {});
    columnSearchActive = this.options.allowFiltering !== false && this.options.showSearchRow === true && Object.keys(columnSearchValues).some(function(key) {
      return String(columnSearchValues[key] == null ? '' : columnSearchValues[key]).trim() !== '';
    });
    excelFilters = cloneExcelFilters(this.excelFilters || {});
    excelFilterActive = this.options.allowFiltering !== false && this.options.showSearchRow !== true && hasExcelFilters(excelFilters);
    active = typeof this.filterPredicate === 'function' || Boolean(this.searchText) || columnSearchActive || excelFilterActive;
    if (source) {
      this.emit('filterChanged', {
        source: source,
        active: active,
        cleared: !active,
        remote: this.options.remote === true,
        filterPredicate: this.filterPredicate,
        searchText: this.searchText || '',
        columnSearchValues: columnSearchValues,
        columnSearchOperators: columnSearchOperators,
        excelFilters: excelFilters,
        view: this.view,
        viewRowCount: this.view.length
      });
    }
    if (this.options.remote === true) {
      this.load();
    }
  };

  FabGrid.prototype.applyView = function() {
    var rows = this.source.slice();
    var filterPredicate = this.filterPredicate;
    var searchText = this.searchText;
    var columnSearchValues = this.options.allowFiltering !== false && this.options.showSearchRow === true && this.hasColumnSearch ? this.columnSearchValues : null;
    var columnSearchOperators = this.options.allowFiltering !== false && this.options.showSearchRow === true && this.hasColumnSearch ? this.columnSearchOperators : null;
    var excelFilters = this.options.allowFiltering !== false && this.options.showSearchRow !== true && hasExcelFilters(this.excelFilters) ? this.excelFilters : null;
    var columns = this.columns;
    var sortStates = this.getSortStates();
    var selectionState = this.captureSelectionState();
    var indexedRows;
    var treeOptions;
    var filtering;

    if (typeof this.isTreeGrid === 'function' && this.isTreeGrid()) {
      filtering = this.options.remote !== true && Boolean(filterPredicate || searchText || columnSearchValues || excelFilters);
      treeOptions = {
        filtering: filtering,
        pagination: false,
        pageNumber: this.options.pageNumber,
        pageSize: this.options.pageSize,
        matches: function(item) {
          if (filterPredicate && !filterPredicate(item)) {
            return false;
          }
          if (!searchText) {
            return (!columnSearchValues || rowMatchesColumnSearch(item, columns, columnSearchValues, columnSearchOperators)) &&
              (!excelFilters || rowMatchesExcelFilters(item, columns, excelFilters));
          }
          return rowMatchesSearch(item, columns, searchText) &&
            (!columnSearchValues || rowMatchesColumnSearch(item, columns, columnSearchValues, columnSearchOperators)) &&
            (!excelFilters || rowMatchesExcelFilters(item, columns, excelFilters));
        },
        compare: sortStates.length && this.options.remote !== true ? function(a, b) {
          var comparison;
          var sortState;
          var i;
          for (i = 0; i < sortStates.length; i += 1) {
            sortState = sortStates[i];
            comparison = compareValues(
              getByBinding(a, sortState.column.binding),
              getByBinding(b, sortState.column.binding),
              sortState.column.dataType
            ) * sortState.direction;
            if (comparison) {
              return comparison;
            }
          }
          return 0;
        } : null
      };
      rows = this.createTreeView(rows, treeOptions);
      if (this.options.remote !== true) {
        this.paginationTotal = this._treeRootCount;
      }
      if (this.options.pagination === true && this.options.remote !== true) {
        this.normalizePaginationOptions();
        treeOptions.pagination = true;
        treeOptions.pageNumber = this.options.pageNumber;
        treeOptions.pageSize = this.options.pageSize;
        rows = this.createTreeView(this.source.slice(), treeOptions);
      }
      this.dataView = rows;
      this.view = rows;
    } else {
      if (this.options.remote !== true && (filterPredicate || searchText || columnSearchValues || excelFilters)) {
        rows = rows.filter(function(item, index) {
          if (filterPredicate && !filterPredicate(item, index)) {
            return false;
          }
          if (!searchText) {
            return (!columnSearchValues || rowMatchesColumnSearch(item, columns, columnSearchValues, columnSearchOperators)) &&
              (!excelFilters || rowMatchesExcelFilters(item, columns, excelFilters));
          }
          return rowMatchesSearch(item, columns, searchText) &&
            (!columnSearchValues || rowMatchesColumnSearch(item, columns, columnSearchValues, columnSearchOperators)) &&
            (!excelFilters || rowMatchesExcelFilters(item, columns, excelFilters));
        });
      }

      if (sortStates.length && this.options.remote !== true) {
        indexedRows = rows.map(function(item, index) {
          return { item: item, index: index };
        });
        indexedRows.sort(function(a, b) {
          var comparison;
          var sortState;
          var i;
          for (i = 0; i < sortStates.length; i += 1) {
            sortState = sortStates[i];
            comparison = compareValues(
              getByBinding(a.item, sortState.column.binding),
              getByBinding(b.item, sortState.column.binding),
              sortState.column.dataType
            ) * sortState.direction;
            if (comparison) {
              return comparison;
            }
          }
          return a.index - b.index;
        });
        rows = indexedRows.map(function(entry) {
          return entry.item;
        });
      }

      if (this.options.remote !== true) {
        this.paginationTotal = rows.length;
      }
      if (this.options.pagination === true && this.options.remote !== true) {
        this.normalizePaginationOptions();
        rows = rows.slice(
          (this.options.pageNumber - 1) * this.options.pageSize,
          this.options.pageNumber * this.options.pageSize
        );
      }
      this.dataView = rows;
      this.view = this.createGroupedView(rows);
    }
    this._rowCollection = null;
    this.refreshInvalidItemRows();
    this.restoreSelectionState(selectionState);
    this.clampSelection();
    this.syncEditingWithView();
  };

  FabGrid.prototype.normalizePaginationOptions = function() {
    var pagination = normalizePagination(this.options.pageNumber, this.options.pageSize, this.paginationTotal, DEFAULT_OPTIONS.pageSize);
    this.options.pageSize = pagination.pageSize;
    this.options.pageNumber = pagination.pageNumber;
    if (this.options.pager && typeof this.options.pager === 'object') {
      this.options.pager.pageNumber = this.options.pageNumber;
      this.options.pager.pageSize = this.options.pageSize;
    }
  };

  FabGrid.prototype.toggleSort = function(colIndex, multiSort) {
    var column = this.visibleColumns[colIndex];
    var sortStates = this.getSortStates();
    var sortIndex;
    var currentState;
    var nextSortStates;
    var direction = 1;
    if (!column) {
      return;
    }
    sortIndex = this.getSortIndex(column);
    currentState = sortIndex >= 0 ? sortStates[sortIndex] : null;
    if (currentState) {
      if (currentState.direction === 1) {
        direction = -1;
      } else if (currentState.direction === -1) {
        direction = 0;
      }
    }
    if (this.emit('sortingColumn', {
      column: column,
      direction: direction,
      multiSort: multiSort === true,
      sortIndex: sortIndex
    }) === false) {
      return;
    }
    nextSortStates = multiSort === true ? sortStates.slice() : [];
    if (direction) {
      if (multiSort === true && sortIndex >= 0) {
        nextSortStates[sortIndex] = { column: column, direction: direction };
      } else if (multiSort === true) {
        nextSortStates.push({ column: column, direction: direction });
      } else {
        nextSortStates = [{ column: column, direction: direction }];
      }
    } else if (multiSort === true && sortIndex >= 0) {
      nextSortStates.splice(sortIndex, 1);
    }
    this.sortStates = nextSortStates;
    this.sortState = nextSortStates.length ? nextSortStates[0] : null;
    if (this.options.remote === true) {
      this.options.pageNumber = 1;
      if (this.options.pager) {
        this.options.pager.pageNumber = 1;
      }
    }
    this.applyView();
    this.resetScroll();
    this.render();
    this.emit('sortedColumn', {
      column: column,
      direction: direction,
      multiSort: multiSort === true,
      sortIndex: this.getSortIndex(column),
      sortStates: this.getSortStates().slice()
    });
    if (this.options.remote === true) {
      this.load();
    }
  };

  FabGrid.prototype.getSortGlyph = function(column) {
    var direction = this.getSortDirection(column);
    if (!direction) {
      return '';
    }
    return direction === 1 ? '▲' : '▼';
  };

  FabGrid.prototype.getSortDirection = function(column) {
    var index = this.getSortIndex(column);
    var sortStates = this.getSortStates();
    return index >= 0 ? sortStates[index].direction : 0;
  };

  FabGrid.prototype.getSortIndex = function(column) {
    var sortStates = this.getSortStates();
    var i;
    for (i = 0; i < sortStates.length; i += 1) {
      if (sortStates[i].column === column) {
        return i;
      }
    }
    return -1;
  };

  FabGrid.prototype.getSortStates = function() {
    if (Array.isArray(this.sortStates) && this.sortStates.length) {
      return this.sortStates;
    }
    return this.sortState && this.sortState.direction ? [this.sortState] : [];
  };
}

function getTreeChildren(item, childItemsPath, getByBinding, grid) {
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

function findTreeItemLocation(items, item, getChildren) {
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

function isTreeItemDescendant(item, candidate, getChildren) {
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

function moveTreeItemInSource(items, item, targetItem, position, getChildren, ensureChildren) {
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

function buildVisibleTreeRows(items, options) {
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

function installFabGridTree(FabGrid, context) {
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
    this._treeRowInfos = [];
    this._treeInfoItems = [];
    this._treeInfoValues = [];
    this._treeInfoMap = typeof WeakMap === 'function' ? new WeakMap() : null;
    this._treeRootCount = 0;
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
    return this._treeCollapsedItems.indexOf(item) >= 0;
  };

  FabGrid.prototype.setTreeItemCollapsed = function(item, collapsed) {
    var index = this._treeCollapsedItems.indexOf(item);
    if (collapsed && index < 0) {
      this._treeCollapsedItems.push(item);
    } else if (!collapsed && index >= 0) {
      this._treeCollapsedItems.splice(index, 1);
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
    this.setTreeItemCollapsed(item, nextCollapsed);
    this.applyView();
    nextRow = this.view.indexOf(item);
    if (nextRow >= 0) {
      this.selection.row = nextRow;
      this.selectionAnchor = { row: nextRow, col: this.selection.col };
      this.rowSelection = nextRow;
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

var activeRowDrag = null;
var rowDragGrids = [];

function installFabGridDrag(FabGrid, context) {
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
    var top;
    if (!this.rowDropIndicator) {
      this.rowDropIndicator = document.createElement('div');
      this.rowDropIndicator.setAttribute('aria-hidden', 'true');
      this.root.appendChild(this.rowDropIndicator);
    }
    rootRect = this.root.getBoundingClientRect();
    bodyRect = this.body.getBoundingClientRect();
    rowRect = target.element ? target.element.getBoundingClientRect() : null;
    this.rowDropIndicator.className = 'fg-row-drop-indicator fg-row-drop-' + target.position;
    this.rowDropIndicator.style.left = Math.max(0, bodyRect.left - rootRect.left) + 'px';
    this.rowDropIndicator.style.width = Math.max(0, bodyRect.width) + 'px';
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

function getMaskCopyText(value, column) {
  return isMaskValueIncludingLiterals(column) ? formatMaskText(value, column) : extractMaskCharacters(value, column.mask);
}

function formatMaskText(value, column) {
  return applyMask(extractMaskCharacters(value, column.mask), column.mask);
}

function countMaskCharactersBeforeCaret(value, mask, caret) {
  return extractMaskCharacters(String(value == null ? '' : value).slice(0, caret), mask).length;
}

function getMaskCaretPosition(value, mask, rawIndex) {
  var text = String(value == null ? '' : value);
  var tokenIndex = 0;
  var tokens = getMaskTokens(mask);
  var i;
  var ch;
  if (rawIndex <= 0) {
    return 0;
  }
  for (i = 0; i < text.length && tokenIndex < tokens.length; i += 1) {
    ch = text.charAt(i);
    if (isMaskCharAllowed(ch, tokens[tokenIndex])) {
      tokenIndex += 1;
      if (tokenIndex >= rawIndex) {
        return i + 1;
      }
    }
  }
  return text.length;
}

function isMaskValueIncludingLiterals(column) {
  return !isMaskAutoUnmask(column);
}

function isMaskAutoUnmask(column) {
  if (column.autoUnmask === true) {
    return true;
  }
  if (column.autoUnmask === false) {
    return false;
  }
  return column.maskValueIncludesLiterals === false ||
    column.maskIncludesLiterals === false ||
    column.maskLiteralsInValue === false;
}

function extractMaskCharacters(value, mask) {
  var text = value == null ? '' : String(value);
  var chars = [];
  var tokenIndex = 0;
  var tokens = getMaskTokens(mask);
  var i;
  var ch;
  if (!mask || !tokens.length) {
    return text;
  }
  for (i = 0; i < text.length && tokenIndex < tokens.length; i += 1) {
    ch = text.charAt(i);
    if (isMaskCharAllowed(ch, tokens[tokenIndex])) {
      chars.push(ch);
      tokenIndex += 1;
    }
  }
  return chars.join('');
}

function applyMask(raw, mask) {
  var value = raw == null ? '' : String(raw);
  var output = '';
  var rawIndex = 0;
  var i;
  var token;
  var ch;
  if (!mask) {
    return value;
  }
  for (i = 0; i < mask.length; i += 1) {
    token = getMaskToken(mask.charAt(i));
    if (!token) {
      if (rawIndex > 0) {
        output += mask.charAt(i);
      }
      continue;
    }
    ch = findNextMaskChar(value, rawIndex, token);
    if (!ch) {
      break;
    }
    output += ch.value;
    rawIndex = ch.nextIndex;
  }
  return output;
}

function getMaskTokens(mask) {
  var tokens = [];
  var i;
  var token;
  for (i = 0; i < String(mask || '').length; i += 1) {
    token = getMaskToken(mask.charAt(i));
    if (token) {
      tokens.push(token);
    }
  }
  return tokens;
}

function isMaskCharAllowed(ch, token) {
  if (token === 'digit') return /[0-9]/.test(ch);
  if (token === 'letter') return /[A-Za-z]/.test(ch);
  if (token === 'alphanumeric') return /[0-9A-Za-z]/.test(ch);
  return false;
}

function findNextMaskChar(value, start, token) {
  var i;
  var ch;
  for (i = start; i < value.length; i += 1) {
    ch = value.charAt(i);
    if (isMaskCharAllowed(ch, token)) {
      return { value: ch, nextIndex: i + 1 };
    }
  }
  return null;
}

function getMaskToken(ch) {
  if (ch === '9') return 'digit';
  if (ch === 'A') return 'letter';
  if (ch === '*') return 'alphanumeric';
  return '';
}

function isPromiseLike(value) {
  return value && typeof value.then === 'function';
}

function normalizeValidationResult(result, value, type, defaultMessage) {
  var base;
  var key;
  if (result == null || result === false || result === '') {
    return null;
  }
  base = {
    type: type || 'custom',
    message: defaultMessage || 'Invalid value',
    value: value
  };
  if (typeof result === 'string') {
    base.message = result;
    return base;
  }
  if (result === true) {
    return base;
  }
  if (typeof result === 'object') {
    for (key in result) {
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        base[key] = result[key];
      }
    }
    return base;
  }
  return null;
}

var exportContext = {};

function exportGetByBinding(item, binding) {
  return exportContext.getByBinding ? exportContext.getByBinding(item, binding) : undefined;
}

function exportToNumber(value, fallback) {
  return exportContext.toNumber ? exportContext.toNumber(value, fallback) : (isFinite(Number(value)) ? Number(value) : fallback);
}

function exportGetNumberPrecision(column) {
  return exportContext.getNumberPrecision ? exportContext.getNumberPrecision(column) : null;
}

function exportShouldUseThousandsSeparator(column) {
  return exportContext.shouldUseThousandsSeparator ? exportContext.shouldUseThousandsSeparator(column) : false;
}

function exportParseValue(value, type) {
  if (exportContext.parseValue) return exportContext.parseValue(value, type);
  if (type === 'boolean') return value === true || value === 'true' || value === '1' || value === 'yes' || value === 'Y';
  return value;
}

function csvEscape(value) {
  var text = value == null ? '' : String(value);
  if (text.indexOf('"') >= 0 || text.indexOf(',') >= 0 || text.indexOf('\n') >= 0) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function normalizeJsonRows(value) {
  var parsed = value;
  if (typeof parsed === 'string') {
    parsed = JSON.parse(parsed);
  }
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && Array.isArray(parsed.rows)) {
    return parsed.rows;
  }
  if (parsed && Array.isArray(parsed.itemsSource)) {
    return parsed.itemsSource;
  }
  throw new TypeError('FabGrid JSON data must be an array or an object containing a rows or itemsSource array.');
}

function readJsonSource(source) {
  if (typeof Blob !== 'undefined' && source instanceof Blob) {
    if (typeof source.text === 'function') {
      return source.text();
    }
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function() { resolve(reader.result); };
      reader.onerror = function() { reject(reader.error || new Error('Unable to read the JSON file.')); };
      reader.readAsText(source);
    });
  }
  return Promise.resolve(source);
}

function getExcelColumnName(index) {
  var name = '';
  var number = index;
  while (number > 0) {
    number -= 1;
    name = String.fromCharCode(65 + (number % 26)) + name;
    number = Math.floor(number / 26);
  }
  return name;
}

function getXmlSpaceAttribute(value) {
  var text = String(value);
  return /^\s|\s$|\s\s/.test(text) ? ' xml:space="preserve"' : '';
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cssColorToExcelColor(value) {
  var match;
  var hex;
  if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return '';
  if (value.charAt(0) === '#') {
    hex = value.length === 4 ?
      value.charAt(1) + value.charAt(1) + value.charAt(2) + value.charAt(2) + value.charAt(3) + value.charAt(3) :
      value.slice(1, 7);
    return 'FF' + hex.toUpperCase();
  }
  match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
  if (!match || match[4] === '0') return '';
  return 'FF' + toHexByte(match[1]) + toHexByte(match[2]) + toHexByte(match[3]);
}

function normalizeExcelStyle(style) {
  return {
    color: cssColorToExcelColor(style.color || style.textColor || ''),
    backgroundColor: cssColorToExcelColor(style.backgroundColor || style.background || ''),
    bold: style.bold === true || style.fontWeight === 'bold' || Number(style.fontWeight) >= 600,
    align: normalizeExcelAlign(style.align || style.textAlign || ''),
    numFmtCode: style.numFmtCode || style.numberFormat || ''
  };
}

function mergeExcelStyle(base, override) {
  var result = {};
  var key;
  for (key in base) {
    if (Object.prototype.hasOwnProperty.call(base, key)) result[key] = base[key];
  }
  for (key in override) {
    if (Object.prototype.hasOwnProperty.call(override, key) && override[key]) result[key] = override[key];
  }
  return result;
}

function normalizeExcelAlign(value) {
  return value === 'right' || value === 'center' || value === 'left' ? value : '';
}

function createExcelCell(row, col, value, type, styleId) {
  var ref = getExcelColumnName(col) + row;
  var style = styleId ? ' s="' + styleId + '"' : '';
  if (value == null) return '<c r="' + ref + '"' + style + ' t="inlineStr"><is><t></t></is></c>';
  if (type === 'number' && typeof value !== 'boolean' && isFinite(Number(value))) {
    return '<c r="' + ref + '"' + style + '><v>' + Number(value) + '</v></c>';
  }
  if (type === 'boolean') {
    return '<c r="' + ref + '"' + style + ' t="b"><v>' + (exportParseValue(value, 'boolean') ? '1' : '0') + '</v></c>';
  }
  return '<c r="' + ref + '"' + style + ' t="inlineStr"><is><t' + getXmlSpaceAttribute(value) + '>' + xmlEscape(value) + '</t></is></c>';
}

function toHexByte(value) {
  var hex = Math.max(0, Math.min(255, Number(value))).toString(16).toUpperCase();
  return hex.length === 1 ? '0' + hex : hex;
}

function installFabGridExport(FabGrid, context) {
  exportContext = context || {};
  var getByBinding = context.getByBinding;

  FabGrid.prototype._getExcelExportRows = function() {
    return this.view || this.dataView;
  };

  FabGrid.prototype._isExcelExportRowHidden = function() {
    return false;
  };

  FabGrid.prototype.getCsv = function(visibleOnly) {
    var columns = visibleOnly === false ? this.columns : this.visibleColumns;
    var lines = [];
    var i;
    var r;
    var row;
    var values;
    lines.push(columns.map(function(col) {
      return csvEscape(col.header || col.binding);
    }).join(','));
    for (r = 0; r < this.view.length; r += 1) {
      row = this.view[r];
      if (this.isRowGroup(row) || this.isRowGroupFooter(row)) continue;
      values = [];
      for (i = 0; i < columns.length; i += 1) {
        values.push(csvEscape(getByBinding(row, columns[i].binding)));
      }
      lines.push(values.join(','));
    }
    return lines.join('\n');
  };

  FabGrid.prototype.exportCsv = function(filename, visibleOnly) {
    var csv = this.getCsv(visibleOnly);
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename || 'fabgrid.csv');
  };

  FabGrid.prototype.getJson = function(options) {
    var rows;
    options = options || {};
    rows = options.viewOnly === true ? this.view.filter(function(row) {
      return !this.isRowGroup(row) && !this.isRowGroupFooter(row);
    }, this) : this.source;
    return JSON.stringify(rows || [], options.replacer == null ? null : options.replacer, options.space == null ? 0 : options.space);
  };

  FabGrid.prototype.exportJson = function(filename, options) {
    var json = this.getJson(options);
    var blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    downloadBlob(blob, filename || 'fabgrid.json');
  };

  FabGrid.prototype.importJson = function(source) {
    var grid = this;
    return readJsonSource(source).then(function(value) {
      var rows = normalizeJsonRows(value);
      grid.setItemsSource(rows);
      return true;
    });
  };

  FabGrid.prototype.getExcelBlob = function(visibleOnly) {
    var columns = visibleOnly === true ? this.visibleColumns : this.columns;
    var rows = this._getExcelExportRows();
    var grid = this;
    var files = createXlsxFiles(columns, rows, {
      frozenColumns: visibleOnly === true ? this.frozenColumns : this.getExcelFrozenColumnCount(),
      headerDisplayMode: this.getHeaderDisplayMode(),
      grid: this,
      formatCell: this.options.formatCell,
      excelCellStyle: this.options.excelCellStyle,
      includeFooter: this.getFooterHeight() > 0,
      isRowHidden: function(row, rowIndex) {
        return grid._isExcelExportRowHidden(row, rowIndex);
      }
    });
    return new Blob([createZip(files)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  };


  FabGrid.prototype.getExcelFrozenColumnCount = function() {
    var lastFrozenColumn;
    var sourceIndex;
    if (!this.frozenColumns) return 0;
    lastFrozenColumn = this.visibleColumns[this.frozenColumns - 1];
    sourceIndex = this.columns.indexOf(lastFrozenColumn);
    return sourceIndex < 0 ? 0 : sourceIndex + 1;
  };

  FabGrid.prototype.exportExcel = function(filename, visibleOnly) {
    var self = this;
    var outputName = filename || 'fabgrid.xlsx';
    if (this.busy) return Promise.resolve(false);
    this.setBusy(true, this.options.exportBusyText || this.getText('exportBusyText'));
    this.emit('excelExporting', { filename: outputName });
    return new Promise(function(resolve, reject) {
      requestAnimationFrame(function() {
        setTimeout(function() {
          var blob;
          try {
            blob = self.getExcelBlob(visibleOnly);
            downloadBlob(blob, outputName);
            self.emit('excelExported', { filename: outputName, blob: blob });
            resolve(true);
          } catch (error) {
            self.emit('excelExportFailed', { filename: outputName, error: error });
            reject(error);
          } finally {
            self.setBusy(false);
          }
        }, 0);
      });
    });
  };
}

function downloadBlob(blob, filename) {
  var link = document.createElement('a');
  var url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function createXlsxFiles(columns, rows, options) {
  var now = new Date().toISOString();
  var registry = createExcelStyleRegistry();
  var worksheet = createWorksheetXml(columns, rows, options || {}, registry);
  return [
    {
      name: '[Content_Types].xml',
      content: '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '</Types>'
    },
    {
      name: '_rels/.rels',
      content: '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
        '</Relationships>'
    },
    {
      name: 'docProps/app.xml',
      content: '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
        '<Application>FabGrid</Application>' +
        '</Properties>'
    },
    {
      name: 'docProps/core.xml',
      content: '<?xml version="1.0" encoding="UTF-8"?>' +
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
        '<dc:creator>FabGrid</dc:creator>' +
        '<cp:lastModifiedBy>FabGrid</cp:lastModifiedBy>' +
        '<dcterms:created xsi:type="dcterms:W3CDTF">' + now + '</dcterms:created>' +
        '<dcterms:modified xsi:type="dcterms:W3CDTF">' + now + '</dcterms:modified>' +
        '</cp:coreProperties>'
    },
    {
      name: 'xl/workbook.xml',
      content: '<?xml version="1.0" encoding="UTF-8"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>' +
        '</workbook>'
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '</Relationships>'
    },
    {
      name: 'xl/styles.xml',
      content: createExcelStylesXml(registry)
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      content: worksheet
    }
  ];
}

function createExcelStyleRegistry() {
  var registry = {
    fonts: [
      { bold: false, color: null },
      { bold: true, color: 'FF1F2937' }
    ],
    fills: [
      null,
      { gray125: true },
      { color: 'FFF5F7FA' }
    ],
    xfs: [
      { fontId: 0, fillId: 0, borderId: 0, align: '', numFmtId: 0 },
      { fontId: 1, fillId: 2, borderId: 1, align: 'center', numFmtId: 0 },
      { fontId: 0, fillId: 0, borderId: 1, align: '', numFmtId: 0 },
      { fontId: 0, fillId: 0, borderId: 1, align: 'right', numFmtId: 0 },
      { fontId: 0, fillId: 0, borderId: 1, align: 'center', numFmtId: 0 }
    ],
    numFmts: [],
    fontMap: { 'normal|': 0, 'bold|FF1F2937': 1 },
    fillMap: { none: 0, gray125: 1, FFF5F7FA: 2 },
    numFmtMap: {},
    nextNumFmtId: 164,
    xfMap: {
      '0|0|0|0|': 0,
      '1|2|1|center|0': 1,
      '0|0|1||0': 2,
      '0|0|1|right|0': 3,
      '0|0|1|center|0': 4
    }
  };
  return registry;
}

function createExcelStylesXml(registry) {
  var xml = [];
  var i;
  xml.push('<?xml version="1.0" encoding="UTF-8"?>');
  xml.push('<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">');
  if (registry.numFmts.length) {
    xml.push('<numFmts count="' + registry.numFmts.length + '">');
    for (i = 0; i < registry.numFmts.length; i += 1) {
      xml.push('<numFmt numFmtId="' + registry.numFmts[i].id + '" formatCode="' + xmlEscape(registry.numFmts[i].code) + '"/>');
    }
    xml.push('</numFmts>');
  }
  xml.push('<fonts count="' + registry.fonts.length + '">');
  for (i = 0; i < registry.fonts.length; i += 1) {
    xml.push(createExcelFontXml(registry.fonts[i]));
  }
  xml.push('</fonts>');
  xml.push('<fills count="' + registry.fills.length + '">');
  for (i = 0; i < registry.fills.length; i += 1) {
    xml.push(createExcelFillXml(registry.fills[i]));
  }
  xml.push('</fills>');
  xml.push('<borders count="2">');
  xml.push('<border><left/><right/><top/><bottom/><diagonal/></border>');
  xml.push('<border>');
  xml.push('<left style="thin"><color rgb="FFD7DEE8"/></left>');
  xml.push('<right style="thin"><color rgb="FFD7DEE8"/></right>');
  xml.push('<top style="thin"><color rgb="FFD7DEE8"/></top>');
  xml.push('<bottom style="thin"><color rgb="FFD7DEE8"/></bottom>');
  xml.push('<diagonal/>');
  xml.push('</border>');
  xml.push('</borders>');
  xml.push('<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>');
  xml.push('<cellXfs count="' + registry.xfs.length + '">');
  for (i = 0; i < registry.xfs.length; i += 1) {
    xml.push(createExcelXfXml(registry.xfs[i]));
  }
  xml.push('</cellXfs>');
  xml.push('<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>');
  xml.push('</styleSheet>');
  return xml.join('');
}

function createExcelFontXml(font) {
  var xml = ['<font>'];
  if (font.bold) {
    xml.push('<b/>');
  }
  xml.push('<sz val="11"/>');
  if (font.color) {
    xml.push('<color rgb="' + font.color + '"/>');
  }
  xml.push('<name val="Arial"/>');
  xml.push('</font>');
  return xml.join('');
}

function createExcelFillXml(fill) {
  if (!fill) {
    return '<fill><patternFill patternType="none"/></fill>';
  }
  if (fill.gray125) {
    return '<fill><patternFill patternType="gray125"/></fill>';
  }
  return '<fill><patternFill patternType="solid"><fgColor rgb="' + fill.color + '"/><bgColor indexed="64"/></patternFill></fill>';
}

function createExcelXfXml(xf) {
  var numFmtId = xf.numFmtId || 0;
  var xml = '<xf numFmtId="' + numFmtId + '" fontId="' + xf.fontId + '" fillId="' + xf.fillId + '" borderId="' + xf.borderId + '" xfId="0"';
  if (numFmtId) {
    xml += ' applyNumberFormat="1"';
  }
  if (xf.fontId) {
    xml += ' applyFont="1"';
  }
  if (xf.fillId) {
    xml += ' applyFill="1"';
  }
  if (xf.borderId) {
    xml += ' applyBorder="1"';
  }
  if (xf.align) {
    xml += ' applyAlignment="1"><alignment horizontal="' + xf.align + '" vertical="center"/></xf>';
    return xml;
  }
  if (xf.borderId) {
    xml += ' applyAlignment="1"><alignment vertical="center"/></xf>';
    return xml;
  }
  return xml + '/>';
}

function registerExcelCellStyle(registry, style) {
  var fontId = registerExcelFont(registry, style);
  var fillId = registerExcelFill(registry, style);
  var numFmtId = registerExcelNumberFormat(registry, style.numFmtCode || style.numberFormat || '');
  var borderId = 1;
  var align = style.align || '';
  var key = fontId + '|' + fillId + '|' + borderId + '|' + align + '|' + numFmtId;
  if (registry.xfMap[key] != null) {
    return registry.xfMap[key];
  }
  registry.xfs.push({
    fontId: fontId,
    fillId: fillId,
    borderId: borderId,
    align: align,
    numFmtId: numFmtId
  });
  registry.xfMap[key] = registry.xfs.length - 1;
  return registry.xfs.length - 1;
}

function registerExcelFont(registry, style) {
  var color = style.color || null;
  var bold = style.bold === true;
  var key = (bold ? 'bold' : 'normal') + '|' + (color || '');
  if (registry.fontMap[key] != null) {
    return registry.fontMap[key];
  }
  registry.fonts.push({ bold: bold, color: color });
  registry.fontMap[key] = registry.fonts.length - 1;
  return registry.fonts.length - 1;
}

function registerExcelFill(registry, style) {
  var color = style.backgroundColor || null;
  if (!color) {
    return 0;
  }
  if (registry.fillMap[color] != null) {
    return registry.fillMap[color];
  }
  registry.fills.push({ color: color });
  registry.fillMap[color] = registry.fills.length - 1;
  return registry.fills.length - 1;
}

function registerExcelNumberFormat(registry, code) {
  code = code || '';
  if (!code) {
    return 0;
  }
  if (registry.numFmtMap[code] != null) {
    return registry.numFmtMap[code];
  }
  registry.numFmts.push({
    id: registry.nextNumFmtId,
    code: code
  });
  registry.numFmtMap[code] = registry.nextNumFmtId;
  registry.nextNumFmtId += 1;
  return registry.numFmtMap[code];
}

function createWorksheetXml(columns, rows, options, registry) {
  var includeFooter = options.includeFooter === true && options.grid;
  var dataMaxRow = rows.length + 1;
  var maxRow = dataMaxRow + (includeFooter ? 1 : 0);
  var maxCol = Math.max(columns.length, 1);
  var xml = [];
  var r;
  var c;
  var row;
  var styleResolver = createExcelStyleResolver(options);
  xml.push('<?xml version="1.0" encoding="UTF-8"?>');
  xml.push('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">');
  xml.push('<dimension ref="A1:' + getExcelColumnName(maxCol) + maxRow + '"/>');
  xml.push(createSheetViewsXml(Math.min(exportToNumber(options.frozenColumns, 0), columns.length)));
  xml.push(createColumnWidthXml(columns));
  xml.push('<sheetData>');
  xml.push('<row r="1" ht="22" customHeight="1">');
  for (c = 0; c < columns.length; c += 1) {
    xml.push(createExcelCell(
      1,
      c + 1,
      options.headerDisplayMode === 'binding' ? columns[c].binding : (columns[c].header || columns[c].binding),
      'string',
      1
    ));
  }
  xml.push('</row>');
  for (r = 0; r < rows.length; r += 1) {
    row = rows[r];
    if (options.grid && options.grid.isRowGroup(row)) {
      xml.push(createExcelGroupRowXml(r + 2, row, columns, options.grid, registry));
      continue;
    }
    if (options.grid && options.grid.isRowGroupFooter(row)) {
      continue;
    }
    xml.push('<row r="' + (r + 2) + '"' +
      (typeof options.isRowHidden === 'function' && options.isRowHidden(row, r) ? ' hidden="1"' : '') + '>');
    for (c = 0; c < columns.length; c += 1) {
      xml.push(createExcelCell(
        r + 2,
        c + 1,
        exportGetByBinding(row, columns[c].binding),
        columns[c].dataType,
        getExcelCellStyle(columns[c], row, r, c, options, registry, styleResolver)
      ));
    }
    xml.push('</row>');
  }
  if (includeFooter) {
    xml.push(createExcelFooterRowXml(rows.length + 2, columns, options.grid));
  }
  if (styleResolver.dispose) {
    styleResolver.dispose();
  }
  xml.push('</sheetData>');
  xml.push('<autoFilter ref="A1:' + getExcelColumnName(maxCol) + dataMaxRow + '"/>');
  xml.push('</worksheet>');
  return xml.join('');
}

function createExcelGroupRowXml(rowIndex, group, columns, grid, registry) {
  var xml = [];
  var labelColumnIndex = 0;
  var level = Math.max(0, Math.min(7, exportToNumber(group.level, 0)));
  var value;
  var isLabel;
  var c;
  for (c = 0; c < columns.length; c += 1) {
    if (columns[c].visible !== false) {
      labelColumnIndex = c;
      break;
    }
  }
  xml.push('<row r="' + rowIndex + '" outlineLevel="' + level + '">');
  for (c = 0; c < columns.length; c += 1) {
    isLabel = c === labelColumnIndex;
    value = isLabel ? repeatString('  ', level) + group.label :
      (columns[c].aggregate ?
        grid.formatAggregateValue(grid.getRowGroupAggregateValue(group, columns[c]), columns[c], group.items) :
        '');
    xml.push(createExcelCell(
      rowIndex,
      c + 1,
      value,
      isLabel || columns[c].aggregate ? 'string' : columns[c].dataType,
      getExcelGroupCellStyle(columns[c], isLabel, registry)
    ));
  }
  xml.push('</row>');
  return xml.join('');
}

function createExcelFooterRowXml(rowIndex, columns, grid) {
  var xml = [];
  var c;
  var value;
  xml.push('<row r="' + rowIndex + '">');
  for (c = 0; c < columns.length; c += 1) {
    value = grid.getFooterCellText(columns[c]);
    xml.push(createExcelCell(rowIndex, c + 1, value, 'string', getExcelFooterCellStyle(columns[c])));
  }
  xml.push('</row>');
  return xml.join('');
}

function createSheetViewsXml(frozenColumns) {
  var topLeftCell = getExcelColumnName(frozenColumns + 1) + '2';
  var activePane = frozenColumns > 0 ? 'bottomRight' : 'bottomLeft';
  var pane = '<pane ySplit="1"';
  if (frozenColumns > 0) {
    pane += ' xSplit="' + frozenColumns + '"';
  }
  pane += ' topLeftCell="' + topLeftCell + '" activePane="' + activePane + '" state="frozen"/>';
  return '<sheetViews><sheetView workbookViewId="0">' + pane + '</sheetView></sheetViews>';
}

function createColumnWidthXml(columns) {
  var xml = [];
  var width;
  var i;
  if (!columns.length) {
    return '';
  }
  xml.push('<cols>');
  for (i = 0; i < columns.length; i += 1) {
    width = Math.max(8, Math.min(80, Math.round(exportToNumber(columns[i]._width || columns[i].width, 120) / 7)));
    xml.push('<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + width + '" customWidth="1"' +
      (columns[i].visible === false ? ' hidden="1"' : '') + '/>');
  }
  xml.push('</cols>');
  return xml.join('');
}

function getExcelCellStyle(column, item, rowIndex, colIndex, options, registry, styleResolver) {
  var baseStyle = getExcelBaseCellStyle(column);
  var extraStyle = styleResolver(item, column, rowIndex, colIndex);
  if (extraStyle) {
    if (!extraStyle.align) {
      extraStyle.align = baseStyle.align;
    }
    if (!extraStyle.numFmtCode && !extraStyle.numberFormat && baseStyle.numFmtCode) {
      extraStyle.numFmtCode = baseStyle.numFmtCode;
    }
    return registerExcelCellStyle(registry, extraStyle);
  }
  if (baseStyle.numFmtCode) {
    return registerExcelCellStyle(registry, baseStyle);
  }
  if (baseStyle.id) {
    return baseStyle.id;
  }
  return 2;
}

function getExcelGroupCellStyle(column, isLabel, registry) {
  var baseStyle = getExcelBaseCellStyle(column);
  var style = {
    bold: isLabel,
    backgroundColor: 'FFE1E1E1',
    align: isLabel ? '' : baseStyle.align,
    numFmtCode: baseStyle.numFmtCode || ''
  };
  if (column.color) {
    style.color = cssColorToExcelColor(column.color);
  }
  return registerExcelCellStyle(registry, style);
}

function getExcelBaseCellStyle(column) {
  var numberFormat;
  if (column.align === 'right' || column.dataType === 'number') {
    numberFormat = getExcelNumberFormatCode(column);
    if (numberFormat) {
      return { align: 'right', numFmtCode: numberFormat };
    }
    return { id: 3, align: 'right' };
  }
  if (column.align === 'center' || column.dataType === 'boolean') {
    return { id: 4, align: 'center' };
  }
  return { id: 2, align: '' };
}

function getExcelFooterCellStyle(column) {
  if (column.align === 'right' || column.dataType === 'number') {
    return 3;
  }
  if (column.align === 'center' || column.dataType === 'boolean') {
    return 4;
  }
  return 2;
}

function getExcelNumberFormatCode(column) {
  var precision;
  var decimalPart = '';
  var integerPart;
  if (!column || column.dataType !== 'number') {
    return '';
  }
  precision = exportGetNumberPrecision(column);
  integerPart = exportShouldUseThousandsSeparator(column) ? '#,##0' : '0';
  if (precision != null) {
    decimalPart = precision > 0 ? '.' + repeatString('0', precision) : '';
  } else if (exportShouldUseThousandsSeparator(column)) {
    decimalPart = '.############';
  } else {
    return '';
  }
  return integerPart + decimalPart;
}

function repeatString(text, count) {
  var output = '';
  while (count > 0) {
    output += text;
    count -= 1;
  }
  return output;
}

function createExcelStyleResolver(options) {
  var sampleCell = null;
  var formatCell = options.formatCell;
  var customStyle = options.excelCellStyle;
  var grid = options.grid;
  var resolver;
  if (grid && grid.root && typeof document !== 'undefined' && typeof formatCell === 'function') {
    sampleCell = document.createElement('div');
    sampleCell.style.position = 'absolute';
    sampleCell.style.visibility = 'hidden';
    sampleCell.style.pointerEvents = 'none';
    sampleCell.style.top = '-10000px';
    sampleCell.style.left = '-10000px';
    grid.root.appendChild(sampleCell);
  }
  resolver = function(item, column, rowIndex, colIndex) {
    var value = exportGetByBinding(item, column.binding);
    var style = null;
    var fromCell;
    var override;
    if (sampleCell) {
      sampleCell.removeAttribute('style');
      sampleCell.style.position = 'absolute';
      sampleCell.style.visibility = 'hidden';
      sampleCell.style.pointerEvents = 'none';
      sampleCell.style.top = '-10000px';
      sampleCell.style.left = '-10000px';
      sampleCell.className = 'fg-cell' + (column.align ? ' fg-align-' + column.align : '');
      sampleCell.removeAttribute('data-row');
      sampleCell.removeAttribute('data-col');
      sampleCell.textContent = value == null ? '' : String(value);
      formatCell({
        grid: grid,
        cell: sampleCell,
        item: item,
        column: column,
        value: value,
        rowIndex: rowIndex,
        colIndex: colIndex
      });
      fromCell = getExcelStyleFromComputedCell(sampleCell);
      if (fromCell) {
        style = fromCell;
      }
    }
    if (typeof customStyle === 'function') {
      override = customStyle({
        grid: grid,
        item: item,
        column: column,
        value: value,
        rowIndex: rowIndex,
        colIndex: colIndex,
        style: style || {}
      });
      if (override) {
        style = mergeExcelStyle(style || {}, normalizeExcelStyle(override));
      }
    }
    return style;
  };
  if (sampleCell) {
    resolver.dispose = function() {
      if (sampleCell && sampleCell.parentNode) {
        sampleCell.parentNode.removeChild(sampleCell);
      }
    };
  }
  return resolver;
}

function getExcelStyleFromComputedCell(cell) {
  var computed = window.getComputedStyle(cell);
  var style = {};
  var color = cssColorToExcelColor(computed.color);
  var backgroundColor = cssColorToExcelColor(computed.backgroundColor);
  if (color && color !== 'FF1F2937' && color !== 'FF111827') {
    style.color = color;
  }
  if (backgroundColor && backgroundColor !== 'FFFFFFFF') {
    style.backgroundColor = backgroundColor;
  }
  if (Number(computed.fontWeight) >= 600 || computed.fontWeight === 'bold') {
    style.bold = true;
  }
  if (computed.textAlign === 'right' || computed.justifyContent === 'flex-end') {
    style.align = 'right';
  } else if (computed.textAlign === 'center' || computed.justifyContent === 'center') {
    style.align = 'center';
  }
  return Object.keys(style).length ? style : null;
}

function createZip(files) {
  var localParts = [];
  var centralParts = [];
  var offset = 0;
  var i;
  var file;
  var data;
  var nameBytes;
  var crc;
  var dateParts = getZipDateParts(new Date());
  for (i = 0; i < files.length; i += 1) {
    file = files[i];
    data = stringToUtf8Bytes(file.content);
    nameBytes = stringToUtf8Bytes(file.name);
    crc = crc32(data);
    localParts.push(createZipLocalHeader(nameBytes, data, crc, dateParts));
    localParts.push(data);
    centralParts.push(createZipCentralHeader(nameBytes, data, crc, offset, dateParts));
    offset += localParts[localParts.length - 2].length + data.length;
  }
  return concatUint8Arrays(localParts.concat(centralParts, [
    createZipEndRecord(centralParts, offset)
  ]));
}

function createZipLocalHeader(nameBytes, data, crc, dateParts) {
  var header = new Uint8Array(30 + nameBytes.length);
  writeUint32(header, 0, 0x04034b50);
  writeUint16(header, 4, 20);
  writeUint16(header, 6, 2048);
  writeUint16(header, 8, 0);
  writeUint16(header, 10, dateParts.time);
  writeUint16(header, 12, dateParts.date);
  writeUint32(header, 14, crc);
  writeUint32(header, 18, data.length);
  writeUint32(header, 22, data.length);
  writeUint16(header, 26, nameBytes.length);
  writeUint16(header, 28, 0);
  header.set(nameBytes, 30);
  return header;
}

function createZipCentralHeader(nameBytes, data, crc, offset, dateParts) {
  var header = new Uint8Array(46 + nameBytes.length);
  writeUint32(header, 0, 0x02014b50);
  writeUint16(header, 4, 20);
  writeUint16(header, 6, 20);
  writeUint16(header, 8, 2048);
  writeUint16(header, 10, 0);
  writeUint16(header, 12, dateParts.time);
  writeUint16(header, 14, dateParts.date);
  writeUint32(header, 16, crc);
  writeUint32(header, 20, data.length);
  writeUint32(header, 24, data.length);
  writeUint16(header, 28, nameBytes.length);
  writeUint16(header, 30, 0);
  writeUint16(header, 32, 0);
  writeUint16(header, 34, 0);
  writeUint16(header, 36, 0);
  writeUint32(header, 38, 0);
  writeUint32(header, 42, offset);
  header.set(nameBytes, 46);
  return header;
}

function createZipEndRecord(centralParts, centralOffset) {
  var size = 0;
  var i;
  var header = new Uint8Array(22);
  for (i = 0; i < centralParts.length; i += 1) {
    size += centralParts[i].length;
  }
  writeUint32(header, 0, 0x06054b50);
  writeUint16(header, 8, centralParts.length);
  writeUint16(header, 10, centralParts.length);
  writeUint32(header, 12, size);
  writeUint32(header, 16, centralOffset);
  writeUint16(header, 20, 0);
  return header;
}

function getZipDateParts(date) {
  var year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  };
}

function writeUint16(bytes, offset, value) {
  bytes[offset] = value & 255;
  bytes[offset + 1] = (value >>> 8) & 255;
}

function writeUint32(bytes, offset, value) {
  bytes[offset] = value & 255;
  bytes[offset + 1] = (value >>> 8) & 255;
  bytes[offset + 2] = (value >>> 16) & 255;
  bytes[offset + 3] = (value >>> 24) & 255;
}

function stringToUtf8Bytes(text) {
  var encoded;
  var bytes;
  var i;
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text);
  }
  encoded = unescape(encodeURIComponent(text));
  bytes = new Uint8Array(encoded.length);
  for (i = 0; i < encoded.length; i += 1) {
    bytes[i] = encoded.charCodeAt(i);
  }
  return bytes;
}

function concatUint8Arrays(parts) {
  var total = 0;
  var output;
  var offset = 0;
  var i;
  for (i = 0; i < parts.length; i += 1) {
    total += parts[i].length;
  }
  output = new Uint8Array(total);
  for (i = 0; i < parts.length; i += 1) {
    output.set(parts[i], offset);
    offset += parts[i].length;
  }
  return output;
}

function crc32(bytes) {
  var table = getCrcTable();
  var crc = -1;
  var i;
  for (i = 0; i < bytes.length; i += 1) {
    crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 255];
  }
  return (crc ^ -1) >>> 0;
}

function getCrcTable() {
  var table = [];
  var c;
  var n;
  var k;
  if (getCrcTable.cache) {
    return getCrcTable.cache;
  }
  for (n = 0; n < 256; n += 1) {
    c = n;
    for (k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  getCrcTable.cache = table;
  return table;
}

function installFabGridView(FabGrid, context) {
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

    this.sizeLayer.style.width = Math.max(metrics.width, fixedLeftWidth + this.frozenWidth + this.scrollableWidth + this.frozenRightWidth) + 'px';
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
    if (!this.pager || !this.pagination) {
      return;
    }
    this.pager.style.height = height + 'px';
    this.pager.style.display = height ? 'block' : 'none';
    this.pagination.style.height = '100%';
    this.pagination.style.display = height ? 'flex' : 'none';
    if (!height) {
      this.pagination.innerHTML = '';
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
    this.pagination.innerHTML =
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
      (this.options.allowFiltering !== false && this.options.showSearchRow === true && this.hasColumnSearch) ||
      (this.options.allowFiltering !== false && this.options.showSearchRow !== true && hasExcelFilterEntries(this.excelFilters));
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
      (this.options.allowFiltering !== false ? ' fg-header-title-filterable' : '');
    if (this.options.allowFiltering !== false) {
      headerContentWidth = this.measureAutoSizeText(headerText, textMeasureContext) +
        (sortDirection ? 13 : 0);
      if (headerContentWidth + 30 > column._width) {
        title.className += ' fg-header-title-filter-narrow';
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
    if (this.options.allowFiltering !== false) {
      filterIcon.className = 'fg-filter-icon' +
        (this.options.showSearchRow === true && searchOperator ? ' fg-filter-icon-active' : '') +
        (this.options.showSearchRow !== true && excelFilterActive ? ' fg-filter-icon-excel-active' : '');
      filterIcon.textContent = this.options.showSearchRow === true && searchOperator ? getColumnSearchOperatorSymbol(searchOperator) : '';
      filterIcon.setAttribute('data-col', column._viewIndex);
      filterIcon.setAttribute('role', 'button');
      filterIcon.setAttribute('aria-label', this.getText('filter.openMenu', { column: headerText }));
      filterIcon.setAttribute('aria-haspopup', 'menu');
      filterIcon.setAttribute('aria-expanded', this.filterMenuColumn === column && this.isFilterMenuOpen() ? 'true' : 'false');
      title.appendChild(filterIcon);
    }
    if (this.options.allowFiltering !== false && this.options.showSearchRow === true) {
      searchEditorConfig = getColumnEditorConfig(column);
      searchIcons = getColumnSearchIconConfigs(column);
      search = document.createElement('span');
      input = document.createElement('input');
      search.className = 'fg-header-search';
      search.style.height = this.getSearchRowHeight() + 'px';
      input.className = 'fg-header-search-input';
      input.type = 'text';
      input.inputMode = column.dataType === 'number' ? 'decimal' : isDateLikeEditorType(searchEditorConfig.type) ? 'numeric' : 'search';
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
      button.className = trimText('fg-header-search-icon fg-editor-trigger-custom ' + normalizeClassName(icon.iconCls || icon.className || icon.iconClass || icon.icon || ''));
      button.setAttribute('data-col', column._viewIndex);
      button.setAttribute('data-icon-index', i);
      button.setAttribute('aria-label', icon.ariaLabel || icon.label || icon.title || this.getHeaderCellText(column));
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
    if (editorConfig.type === 'combobox') {
      text = getComboboxTextByValue(value, editorConfig);
    }
    if (column.dataType === 'number' && value != null && value !== '' &&
      (shouldUseThousandsSeparator(column) || getNumberPrecision(column) != null)) {
      text = formatNumberDisplayText(value, column);
    }
    if (getExplicitEditorMask(column)) {
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

function installFabGridFilterUi(FabGrid, context) {
  var applyMask = context.applyMask;
  var closest = context.closest;
  var countMaskCharactersBeforeCaret = context.countMaskCharactersBeforeCaret;
  var createColorState = context.createColorState;
  var createDictionary = context.createDictionary;
  var createFilterMenuItemHandler = context.createFilterMenuItemHandler;
  var extractMaskCharacters = context.extractMaskCharacters;
  var formatMaskText = context.formatMaskText;
  var getByBinding = context.getByBinding;
  var getColumnEditorConfig = context.getColumnEditorConfig;
  var getColumnSearchIconConfigs = context.getColumnSearchIconConfigs;
  var getColumnSearchKey = context.getColumnSearchKey;
  var getColumnSearchOperatorDefinitions = context.getColumnSearchOperatorDefinitions;
  var getComboboxTextByValue = context.getComboboxTextByValue;
  var getEditorMask = context.getEditorMask;
  var getExcelFilterValueKey = context.getExcelFilterValueKey;
  var getMaskCaretPosition = context.getMaskCaretPosition;
  var hasClass = context.hasClass;
  var isDateLikeEditorType = context.isDateLikeEditorType;
  var normalizeColorValue = context.normalizeColorValue;
  var sanitizeDateEditorText = context.sanitizeDateEditorText;
  var toNumber = context.toNumber;
  var trimText = context.trimText;

  FabGrid.prototype.handleContextMenu = function(event) {
    var headerTitle = closest(event.target, 'fg-header-title');
    if (!headerTitle) {
      if (typeof this.handleTreeContextMenu === 'function' && this.handleTreeContextMenu(event)) {
        return;
      }
      this.hideTopLeftMenu();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.showTopLeftMenu(event.clientX, event.clientY, 'grid');
  };

  FabGrid.prototype.showTopLeftMenu = function(clientX, clientY, mode) {
    var rootRect;
    var menuWidth;
    var menuHeight;
    var left;
    var top;
    if (!this.topLeftMenu) {
      return;
    }
    this.hideFilterMenu();
    this.hideColumnChooser();
    this.topLeftMenuMode = mode || 'grid';
    this.renderActiveTopLeftMenu();
    this.topLeftMenu.style.visibility = 'hidden';
    this.topLeftMenu.style.display = 'block';
    rootRect = this.root.getBoundingClientRect();
    menuWidth = this.topLeftMenu.offsetWidth;
    menuHeight = this.topLeftMenu.offsetHeight;
    left = clientX - rootRect.left;
    top = clientY - rootRect.top;
    left = Math.max(2, Math.min(left, rootRect.width - menuWidth - 2));
    top = Math.max(2, Math.min(top, rootRect.height - menuHeight - 2));
    this.topLeftMenu.style.left = left + 'px';
    this.topLeftMenu.style.top = top + 'px';
    this.topLeftMenu.style.visibility = '';
  };

  FabGrid.prototype.renderActiveTopLeftMenu = function() {
    if (this.topLeftMenuMode === 'tree' && typeof this.renderTreeContextMenu === 'function') {
      this.renderTreeContextMenu();
      return;
    }
    this.topLeftMenuMode = 'grid';
    this.renderTopLeftMenu();
  };

  FabGrid.prototype.renderTopLeftMenu = function() {
    var rowHeaderMode = this.options.showRowHeaders;
    var rowHeaderItems = [
      {
        action: 'row-headers-off',
        label: this.getText('topLeftMenu.rowHeadersOff'),
        checked: rowHeaderMode === false
      },
      {
        action: 'row-headers-numbers',
        label: this.getText('topLeftMenu.rowHeadersNumbers'),
        checked: rowHeaderMode === true
      },
      {
        action: 'row-headers-cell',
        label: this.getText('topLeftMenu.rowHeadersCellOnly'),
        checked: rowHeaderMode === 'cell'
      }
    ];
    var items = [];
    if (this.options.allowFiltering !== false) {
      items.push({
        action: 'toggle-search-row',
        iconClass: 'icon-search',
        label: this.getText(this.options.showSearchRow === true ? 'topLeftMenu.hideSearchRow' : 'topLeftMenu.showSearchRow')
      });
    }
    items.push(
      {
        action: 'clear-filter',
        iconClass: 'icon-clear',
        label: this.getText('topLeftMenu.clearFilter')
      },
      {
        action: 'row-headers-menu',
        iconClass: 'icon-row-number',
        label: this.getText('topLeftMenu.rowHeaders'),
        children: rowHeaderItems
      },
      { action: 'export-excel', iconClass: 'icon-excel', label: this.getText('topLeftMenu.exportExcel') },
      { action: 'export-csv', iconClass: 'icon-export', label: this.getText('topLeftMenu.exportCsv') },
      {
        action: 'fullscreen',
        iconClass: 'icon-fullscreen',
        label: this.getText(this.isFullscreen() ? 'topLeftMenu.exitFullscreen' : 'topLeftMenu.fullscreen'),
        disabled: !this.isFullscreenAvailable()
      }
    );
    var fragment = document.createDocumentFragment();
    var item;
    var icon;
    var label;
    var arrow;
    var submenuWrap;
    var submenu;
    var child;
    var childItem;
    var i;
    var j;
    if (!this.topLeftMenu) {
      return;
    }
    this.topLeftMenu.setAttribute('aria-label', this.getText('topLeftMenu.ariaLabel'));
    this.topLeftMenu.innerHTML = '';
    for (i = 0; i < items.length; i += 1) {
      item = document.createElement('button');
      icon = document.createElement('span');
      label = document.createElement('span');
      item.type = 'button';
      item.className = 'fg-top-left-menu-item' + (items[i].checked ? ' fg-top-left-menu-item-active' : '');
      item.setAttribute('role', items[i].checked == null ? 'menuitem' : 'menuitemradio');
      if (items[i].checked != null) {
        item.setAttribute('aria-checked', items[i].checked ? 'true' : 'false');
      }
      item.setAttribute('data-action', items[i].action);
      item.disabled = items[i].disabled === true;
      icon.className = 'fg-top-left-menu-icon' + (items[i].iconClass ? ' ' + items[i].iconClass : '');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = items[i].checked ? '✓' : '';
      label.className = 'fg-top-left-menu-label';
      label.textContent = items[i].label;
      item.appendChild(icon);
      item.appendChild(label);
      if (!items[i].children) {
        fragment.appendChild(item);
        continue;
      }
      item.setAttribute('aria-haspopup', 'menu');
      item.setAttribute('aria-expanded', 'false');
      arrow = document.createElement('span');
      arrow.className = 'fg-top-left-menu-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '›';
      item.appendChild(arrow);
      submenuWrap = document.createElement('div');
      submenuWrap.className = 'fg-top-left-menu-submenu-wrap';
      submenu = document.createElement('div');
      submenu.className = 'fg-top-left-menu fg-top-left-submenu';
      submenu.setAttribute('role', 'menu');
      submenu.setAttribute('aria-label', items[i].label);
      for (j = 0; j < items[i].children.length; j += 1) {
        child = items[i].children[j];
        icon = document.createElement('span');
        label = document.createElement('span');
        childItem = document.createElement('button');
        childItem.type = 'button';
        childItem.className = 'fg-top-left-menu-item' +
          (child.checked ? ' fg-top-left-menu-item-active' : '');
        childItem.setAttribute('role', 'menuitemradio');
        childItem.setAttribute('aria-checked', child.checked ? 'true' : 'false');
        childItem.setAttribute('data-action', child.action);
        icon.className = 'fg-top-left-menu-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = child.checked ? '✓' : '';
        label.className = 'fg-top-left-menu-label';
        label.textContent = child.label;
        childItem.appendChild(icon);
        childItem.appendChild(label);
        submenu.appendChild(childItem);
      }
      submenuWrap.appendChild(item);
      submenuWrap.appendChild(submenu);
      fragment.appendChild(submenuWrap);
    }
    this.topLeftMenu.appendChild(fragment);
  };

  FabGrid.prototype.hideTopLeftMenu = function() {
    if (this.topLeftMenu) {
      this.topLeftMenu.style.display = 'none';
    }
    this.topLeftMenuMode = null;
  };

  FabGrid.prototype.isTopLeftMenuOpen = function() {
    return !!(this.topLeftMenu && this.topLeftMenu.style.display === 'block');
  };

  FabGrid.prototype.handleTopLeftMenuClick = function(event) {
    var item = closest(event.target, 'fg-top-left-menu-item');
    var action;
    var submenuWrap;
    var expanded;
    var result;
    if (!item || item.disabled) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    action = item.getAttribute('data-action');
    if (action === 'row-headers-menu') {
      submenuWrap = closest(item, 'fg-top-left-menu-submenu-wrap');
      expanded = submenuWrap && !submenuWrap.classList.contains('fg-top-left-menu-submenu-open');
      if (submenuWrap) {
        submenuWrap.classList.toggle('fg-top-left-menu-submenu-open', expanded);
      }
      item.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      return;
    }
    this.hideTopLeftMenu();
    if (typeof this.handleTreeContextMenuAction === 'function' &&
      this.handleTreeContextMenuAction(action)) {
      return;
    }
    if (action === 'toggle-search-row') {
      this.setShowSearchRow(this.options.showSearchRow !== true);
      return;
    }
    if (action === 'clear-filter') {
      this.clearFilter();
      return;
    }
    if (action === 'row-headers-off') {
      this.setShowRowHeaders(false);
      return;
    }
    if (action === 'row-headers-numbers') {
      this.setShowRowHeaders(true);
      return;
    }
    if (action === 'row-headers-cell') {
      this.setShowRowHeaders('cell');
      return;
    }
    if (action === 'export-excel') {
      result = this.exportExcel();
      if (result && typeof result.catch === 'function') {
        result.catch(function() {});
      }
      return;
    }
    if (action === 'export-csv') {
      this.exportCsv();
      return;
    }
    if (action === 'fullscreen') {
      this.toggleFullscreen();
    }
  };

  FabGrid.prototype.getFullscreenElement = function() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  };

  FabGrid.prototype.isFullscreen = function() {
    return this.getFullscreenElement() === this.root;
  };

  FabGrid.prototype.isFullscreenAvailable = function() {
    return this.isFullscreen() || typeof this.root.requestFullscreen === 'function' ||
      typeof this.root.webkitRequestFullscreen === 'function';
  };

  FabGrid.prototype.toggleFullscreen = function() {
    var action;
    var context;
    var result;
    if (this.isFullscreen()) {
      action = document.exitFullscreen || document.webkitExitFullscreen;
      context = document;
    } else {
      action = this.root.requestFullscreen || this.root.webkitRequestFullscreen;
      context = this.root;
    }
    if (typeof action !== 'function') {
      return false;
    }
    try {
      result = action.call(context);
      if (result && typeof result.catch === 'function') {
        result.catch(function() {});
      }
      return result || true;
    } catch (error) {
      return false;
    }
  };

  FabGrid.prototype.handleFullscreenChange = function() {
    if (this.disposed) {
      return;
    }
    if (this.isTopLeftMenuOpen()) {
      this.renderTopLeftMenu();
    }
    this.invalidate();
  };

  FabGrid.prototype.showFilterMenu = function(colIndex, anchor) {
    var column = this.visibleColumns[colIndex];
    if (this.options.allowFiltering === false || !column || !this.filterMenu) {
      return;
    }
    if (this.filterMenuColumn === column && this.isFilterMenuOpen()) {
      this.hideFilterMenu();
      return;
    }
    this.filterMenuColumn = column;
    this.filterMenuAnchor = anchor;
    this.renderFilterMenu(column);
    this.filterMenu.style.display = 'block';
    this.positionFilterMenu(anchor);
    if (anchor) {
      anchor.setAttribute('aria-expanded', 'true');
    }
  };

  FabGrid.prototype.renderFilterMenu = function(column) {
    if (this.options.showSearchRow !== true) {
      this.renderExcelFilterMenu(column);
      return;
    }
    this.filterMenu.className = 'fg-filter-menu';
    this.filterMenu.setAttribute('role', 'menu');
    this.filterMenu.setAttribute('aria-label', this.getText('filter.openMenu', { column: this.getHeaderCellText(column) }));
    var items = this.getColumnSearchOperatorItems(column);
    var active = this.getColumnSearchOperator(column);
    var colIndex = column ? column._viewIndex : -1;
    var fragment = document.createDocumentFragment();
    var item;
    var icon;
    var label;
    var i;
    var self = this;
    var handler;
    this.filterMenu.innerHTML = '';
    for (i = 0; i < items.length; i += 1) {
      item = document.createElement('div');
      icon = document.createElement('span');
      label = document.createElement('span');
      item.className = 'fg-filter-menu-item' +
        (items[i].operator ? '' : ' fg-filter-menu-clear') +
        (items[i].operator && items[i].operator === active ? ' fg-filter-menu-item-active' : '');
      item.setAttribute('role', 'menuitem');
      item.setAttribute('data-col', colIndex);
      item.setAttribute('data-operator', items[i].operator);
      item.setAttribute('tabindex', '-1');
      icon.className = 'fg-filter-menu-funnel';
      icon.setAttribute('aria-hidden', 'true');
      label.className = 'fg-filter-menu-label';
      label.textContent = items[i].label;
      item.appendChild(icon);
      item.appendChild(label);
      handler = createFilterMenuItemHandler(self, column, items[i].operator);
      item.addEventListener('pointerdown', handler, true);
      item.addEventListener('mousedown', handler, true);
      item.addEventListener('mouseup', handler, true);
      item.addEventListener('click', handler, true);
      fragment.appendChild(item);
    }
    this.filterMenu.appendChild(fragment);
  };

  FabGrid.prototype.renderExcelFilterMenu = function(column) {
    var filter = this.getExcelFilter(column);
    var valueItems = this.getExcelFilterValueItems(column);
    var selectedKeys = createDictionary();
    var selectedValues = filter && filter.type === 'values' ? filter.values : null;
    var container = document.createElement('div');
    var valuesPane = document.createElement('div');
    var footer = document.createElement('div');
    var i;
    var key;

    if (!this.excelFilterDraft || this.excelFilterDraft.column !== column) {
      if (selectedValues) {
        for (i = 0; i < selectedValues.length; i += 1) {
          selectedKeys[getExcelFilterValueKey(selectedValues[i])] = true;
        }
      } else {
        for (i = 0; i < valueItems.length; i += 1) {
          selectedKeys[valueItems[i].key] = true;
        }
      }
      this.excelFilterDraft = {
        column: column,
        search: '',
        valueItems: valueItems,
        selectedKeys: selectedKeys,
        defaultSelected: !selectedValues,
        truncated: valueItems.truncated === true
      };
    } else {
      this.excelFilterDraft.valueItems = valueItems;
      this.excelFilterDraft.truncated = valueItems.truncated === true;
      for (i = 0; i < valueItems.length; i += 1) {
        key = valueItems[i].key;
        if (!Object.prototype.hasOwnProperty.call(this.excelFilterDraft.selectedKeys, key) && !selectedValues) {
          this.excelFilterDraft.selectedKeys[key] = true;
        }
      }
    }

    container.className = 'fg-excel-filter';
    valuesPane.className = 'fg-excel-filter-pane fg-excel-filter-values-pane';
    this.renderExcelFilterValuesPane(valuesPane);

    footer.className = 'fg-excel-filter-footer';
    footer.appendChild(this.createExcelFilterButton('apply', this.getText('filter.apply')));
    footer.appendChild(this.createExcelFilterButton('cancel', this.getText('filter.cancel')));
    footer.appendChild(this.createExcelFilterButton('clear', this.getText('filter.clear')));

    container.appendChild(valuesPane);
    container.appendChild(footer);
    this.filterMenu.className = 'fg-filter-menu fg-excel-filter-menu';
    this.filterMenu.setAttribute('role', 'dialog');
    this.filterMenu.setAttribute('aria-label', this.getText('filter.openMenu', { column: this.getHeaderCellText(column) }));
    this.filterMenu.innerHTML = '';
    this.filterMenu.appendChild(container);
  };

  FabGrid.prototype.createExcelFilterButton = function(action, label, className) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = trimText((className || 'fg-excel-filter-action') + ' fg-excel-filter-button');
    button.setAttribute('data-excel-action', action);
    button.textContent = label;
    return button;
  };

  FabGrid.prototype.renderExcelFilterValuesPane = function(pane) {
    var search = document.createElement('input');
    var selectAllLabel = document.createElement('label');
    var selectAll = document.createElement('input');
    var selectAllText = document.createElement('span');
    var list = document.createElement('div');
    var item;
    var check;
    var text;
    var i;

    search.type = 'search';
    search.className = 'fg-excel-filter-search';
    search.value = this.excelFilterDraft.search;
    search.placeholder = this.getText('filter.searchValues');
    search.setAttribute('aria-label', this.getText('filter.searchValues'));

    selectAllLabel.className = 'fg-excel-filter-select-all';
    selectAll = document.createElement('input');
    selectAll.type = 'checkbox';
    selectAll.className = 'fg-excel-filter-select-all-check';
    selectAllText.textContent = this.getText('filter.selectAll');
    selectAllLabel.appendChild(selectAll);
    selectAllLabel.appendChild(selectAllText);

    list.className = 'fg-excel-filter-value-list';
    for (i = 0; i < this.excelFilterDraft.valueItems.length; i += 1) {
      item = document.createElement('label');
      check = document.createElement('input');
      text = document.createElement('span');
      item.className = 'fg-excel-filter-value-item';
      item.setAttribute('data-value-index', i);
      check.type = 'checkbox';
      check.className = 'fg-excel-filter-value-check';
      check.checked = this.excelFilterDraft.selectedKeys[this.excelFilterDraft.valueItems[i].key] === true;
      check.setAttribute('data-value-index', i);
      text.textContent = this.excelFilterDraft.valueItems[i].label;
      item.appendChild(check);
      item.appendChild(text);
      list.appendChild(item);
    }

    pane.appendChild(search);
    pane.appendChild(selectAllLabel);
    pane.appendChild(list);
    this.filterExcelValueList(this.excelFilterDraft.search, pane);
  };

  FabGrid.prototype.getExcelFilterValueItems = function(column, maxValues) {
    var rows = this.getExcelFilterRows();
    var seen = createDictionary();
    var result = [];
    var limit = maxValues === Infinity ? Infinity : Math.max(1, toNumber(maxValues, toNumber(this.options.excelFilterMaxValues, 1000)));
    var value;
    var key;
    var label;
    var i;
    var truncated = false;
    for (i = 0; i < rows.length; i += 1) {
      value = getByBinding(rows[i], column.binding);
      key = getExcelFilterValueKey(value);
      if (seen[key]) {
        continue;
      }
      seen[key] = true;
      if (result.length >= limit) {
        truncated = true;
        break;
      }
      label = this.getCellDisplayText(rows[i], column, value);
      result.push({
        key: key,
        value: value,
        label: label || this.getText('filter.blankValue')
      });
    }
    result.truncated = truncated;
    return result;
  };

  FabGrid.prototype.getExcelFilterRows = function() {
    var result = [];
    var self = this;
    function append(rows) {
      var children;
      var i;
      for (i = 0; i < (rows || []).length; i += 1) {
        result.push(rows[i]);
        if (typeof self.isTreeGrid === 'function' && self.isTreeGrid()) {
          children = self.getTreeChildren(rows[i]);
          if (children && children.length) {
            append(children);
          }
        }
      }
    }
    append(this.source);
    return result;
  };

  FabGrid.prototype.filterExcelValueList = function(searchText, pane) {
    var host = pane || this.filterMenu;
    var items = host ? host.querySelectorAll('.fg-excel-filter-value-item') : [];
    var search = String(searchText || '').toLowerCase();
    var i;
    for (i = 0; i < items.length; i += 1) {
      items[i].style.display = !search || items[i].textContent.toLowerCase().indexOf(search) >= 0 ? 'flex' : 'none';
    }
    this.syncExcelFilterSelectAllState(host);
  };

  FabGrid.prototype.syncExcelFilterSelectAllState = function(host) {
    var root = host || this.filterMenu;
    var selectAll = root ? root.querySelector('.fg-excel-filter-select-all-check') : null;
    var items = root ? root.querySelectorAll('.fg-excel-filter-value-item') : [];
    var visible = 0;
    var checked = 0;
    var check;
    var i;
    if (!selectAll) {
      return;
    }
    for (i = 0; i < items.length; i += 1) {
      if (items[i].style.display === 'none') {
        continue;
      }
      visible += 1;
      check = items[i].querySelector('.fg-excel-filter-value-check');
      if (check && check.checked) {
        checked += 1;
      }
    }
    selectAll.checked = visible > 0 && checked === visible;
    selectAll.indeterminate = checked > 0 && checked < visible;
  };

  FabGrid.prototype.getColumnSearchOperatorItems = function(column) {
    var definitions = getColumnSearchOperatorDefinitions(column);
    var items = [];
    var i;
    var definition;
    for (i = 0; i < definitions.length; i += 1) {
      definition = definitions[i];
      items.push({
        operator: definition.operator,
        symbol: definition.symbol,
        label: this.getColumnSearchOperatorLabel(definition)
      });
    }
    return items;
  };

  FabGrid.prototype.getColumnSearchOperatorLabel = function(definition) {
    var label;
    if (!definition.operator) {
      return this.getText('filter.clear') || 'Clear';
    }
    label = this.getText(definition.labelKey, { symbol: definition.symbol });
    return label || definition.symbol;
  };

  FabGrid.prototype.positionFilterMenu = function(anchor) {
    var rootRect;
    var anchorRect;
    var headerCell;
    var headerRect;
    var viewportWidth;
    var viewportHeight;
    var visibleLeft;
    var visibleRight;
    var visibleTop;
    var visibleBottom;
    var preferredLeft;
    var preferredTop;
    var belowTop;
    var aboveBottom;
    var availableBelow;
    var availableAbove;
    var availableHeight;
    var opensAbove;
    var valueList;
    var menuChromeHeight;
    var desiredHeight;
    var bottomShadowSpace;
    var isExcelFilterMenu;
    var menuWidth;
    var menuHeight;
    var left;
    var top;
    if (!this.filterMenu || !anchor || this.filterMenu.style.display !== 'block') {
      return;
    }
    this.filterMenu.style.height = '';
    rootRect = this.root.getBoundingClientRect();
    anchorRect = anchor.getBoundingClientRect();
    headerCell = closest(anchor, 'fg-header-cell');
    headerRect = headerCell ? headerCell.getBoundingClientRect() : anchorRect;
    viewportWidth = Math.max(0, window.innerWidth || document.documentElement.clientWidth || rootRect.right);
    viewportHeight = Math.max(0, window.innerHeight || document.documentElement.clientHeight || rootRect.bottom);
    isExcelFilterMenu = hasClass(this.filterMenu, 'fg-excel-filter-menu');
    bottomShadowSpace = isExcelFilterMenu ? 12 : 0;
    visibleLeft = Math.max(rootRect.left, 8);
    visibleRight = Math.min(rootRect.right, viewportWidth - 8);
    visibleTop = Math.max(rootRect.top, 8);
    visibleBottom = Math.max(
      visibleTop,
      Math.min(rootRect.bottom - bottomShadowSpace, viewportHeight - 8 - bottomShadowSpace)
    );
    menuWidth = this.filterMenu.offsetWidth;
    menuHeight = this.filterMenu.offsetHeight;
    belowTop = Math.max(anchorRect.bottom + 2, visibleTop);
    aboveBottom = Math.min(anchorRect.top - 2, visibleBottom);
    availableBelow = Math.max(0, visibleBottom - belowTop);
    availableAbove = Math.max(0, aboveBottom - visibleTop);
    desiredHeight = menuHeight;

    if (isExcelFilterMenu) {
      valueList = this.filterMenu.querySelector('.fg-excel-filter-value-list');
      if (valueList) {
        menuChromeHeight = Math.max(0, menuHeight - valueList.offsetHeight);
        desiredHeight = menuChromeHeight + valueList.scrollHeight;
      }
    }

    opensAbove = availableBelow < Math.min(desiredHeight, 280) && availableAbove > availableBelow;
    availableHeight = opensAbove ? availableAbove : availableBelow;
    if (isExcelFilterMenu) {
      menuHeight = Math.max(0, Math.min(desiredHeight, availableHeight));
      this.filterMenu.style.height = Math.floor(menuHeight) + 'px';
    }

    preferredLeft = isExcelFilterMenu ?
      headerRect.left :
      anchorRect.left - menuWidth + anchorRect.width + 4;
    preferredTop = opensAbove ? aboveBottom - menuHeight : belowTop;
    left = Math.max(visibleLeft, Math.min(preferredLeft, visibleRight - menuWidth)) - rootRect.left;
    top = Math.max(visibleTop, Math.min(preferredTop, visibleBottom - menuHeight)) - rootRect.top;
    this.filterMenu.style.left = left + 'px';
    this.filterMenu.style.top = top + 'px';
  };

  FabGrid.prototype.hideFilterMenu = function() {
    if (this.filterMenuAnchor) {
      this.filterMenuAnchor.setAttribute('aria-expanded', 'false');
    }
    if (this.filterMenu) {
      this.filterMenu.style.display = 'none';
      this.filterMenu.innerHTML = '';
    }
    this.filterMenuColumn = null;
    this.filterMenuAnchor = null;
    this.excelFilterDraft = null;
  };

  FabGrid.prototype.isFilterMenuOpen = function() {
    return !!(this.filterMenu && this.filterMenu.style.display === 'block');
  };

  FabGrid.prototype.toggleColumnChooser = function(anchor) {
    if (this.isColumnChooserOpen()) {
      this.hideColumnChooser();
      return;
    }
    this.showColumnChooser(anchor);
  };

  FabGrid.prototype.showColumnChooser = function(anchor) {
    if (!this.columnChooser || !anchor) {
      return;
    }
    this.hideFilterMenu();
    this.columnChooserAnchor = anchor;
    this.renderColumnChooser();
    this.columnChooser.style.display = 'grid';
    this.positionColumnChooser(anchor);
    this.renderColumnChooserTrigger();
  };

  FabGrid.prototype.renderColumnChooser = function() {
    var fragment;
    var item;
    var check;
    var label;
    var column;
    var columnCount;
    var rowsPerColumn;
    var i;
    if (!this.columnChooser) {
      return;
    }
    fragment = document.createDocumentFragment();
    columnCount = this.root && this.root.clientWidth <= 640 ? 2 : 4;
    rowsPerColumn = Math.ceil(this.columns.length / columnCount);
    this.columnChooser.style.gridTemplateRows = 'repeat(' + rowsPerColumn + ', max-content)';
    for (i = 0; i < this.columns.length; i += 1) {
      column = this.columns[i];
      item = document.createElement('label');
      check = document.createElement('input');
      label = document.createElement('span');
      item.className = 'fg-column-chooser-item';
      check.className = 'fg-column-chooser-check';
      check.type = 'checkbox';
      check.checked = column.visible !== false;
      check.setAttribute('data-column-index', i);
      label.className = 'fg-column-chooser-label';
      label.textContent = this.getHeaderCellText(column) || column.binding || String(i + 1);
      item.appendChild(check);
      item.appendChild(label);
      fragment.appendChild(item);
    }
    this.columnChooser.innerHTML = '';
    this.columnChooser.appendChild(fragment);
  };

  FabGrid.prototype.positionColumnChooser = function(anchor) {
    var rootRect;
    var anchorRect;
    var panelWidth;
    var panelHeight;
    var left;
    var top;
    if (!this.columnChooser || !anchor || this.columnChooser.style.display !== 'grid') {
      return;
    }
    rootRect = this.root.getBoundingClientRect();
    anchorRect = anchor.getBoundingClientRect();
    panelWidth = this.columnChooser.offsetWidth;
    panelHeight = this.columnChooser.offsetHeight;
    left = anchorRect.left - rootRect.left + 2;
    top = anchorRect.bottom - rootRect.top + 2;
    left = Math.max(2, Math.min(left, rootRect.width - panelWidth - 2));
    top = Math.max(2, Math.min(top, rootRect.height - panelHeight - 2));
    this.columnChooser.style.left = left + 'px';
    this.columnChooser.style.top = top + 'px';
  };

  FabGrid.prototype.hideColumnChooser = function() {
    var trigger;
    if (this.columnChooser) {
      this.columnChooser.style.display = 'none';
      this.columnChooser.innerHTML = '';
    }
    this.columnChooserAnchor = null;
    trigger = this.rowHeaderTop && this.rowHeaderTop.querySelector('.fg-column-chooser-trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }
  };

  FabGrid.prototype.isColumnChooserOpen = function() {
    return !!(this.columnChooser && this.columnChooser.style.display === 'grid');
  };

  FabGrid.prototype.handleColumnChooserChange = function(event) {
    var check = closest(event.target, 'fg-column-chooser-check');
    var columnIndex;
    if (!check) {
      return;
    }
    columnIndex = toNumber(check.getAttribute('data-column-index'), -1);
    if (!this.setColumnVisible(this.columns[columnIndex], check.checked)) {
      return;
    }
    this.renderColumnChooser();
    this.positionColumnChooser(this.columnChooserAnchor);
  };

  FabGrid.prototype.handleFilterMenuClick = function(event) {
    var excelAction = closest(event.target, 'fg-excel-filter-button');
    var item = closest(event.target, 'fg-filter-menu-item') || this.getFilterMenuItemAtEvent(event);
    var operator;
    var colIndex;
    var column;
    if (this.isTopLeftMenuOpen() && !closest(event.target, 'fg-top-left-menu')) {
      this.hideTopLeftMenu();
    }
    if (this.isFilterMenuOpen() &&
      !closest(event.target, 'fg-filter-menu') &&
      !closest(event.target, 'fg-filter-icon')) {
      this.hideFilterMenu();
    }
    if (this.isColumnChooserOpen() &&
      !closest(event.target, 'fg-column-chooser') &&
      !closest(event.target, 'fg-column-chooser-trigger')) {
      this.hideColumnChooser();
    }
    if (excelAction) {
      event.preventDefault();
      event.stopPropagation();
      if (event.type === 'click') {
        this.handleExcelFilterMenuAction(excelAction);
      }
      return;
    }
    if (!item) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    operator = item.getAttribute('data-operator') || '';
    colIndex = toNumber(item.getAttribute('data-col'), -1);
    column = this.visibleColumns[colIndex] || this.filterMenuColumn;
    if (!column) {
      this.hideFilterMenu();
      return;
    }
    this.selectFilterMenuOperator(column, operator, event);
  };

  FabGrid.prototype.handleExcelFilterMenuAction = function(target) {
    var action = target.getAttribute('data-excel-action') || '';
    var draft = this.excelFilterDraft;
    var selectedValues = [];
    var valueItems;
    var selected;
    var i;
    if (!draft || !draft.column) {
      this.hideFilterMenu();
      return;
    }
    if (action === 'cancel') {
      this.hideFilterMenu();
      return;
    }
    if (action === 'clear') {
      this.clearExcelFilter(draft.column);
      return;
    }
    if (action !== 'apply') {
      return;
    }
    valueItems = draft.truncated ? this.getExcelFilterValueItems(draft.column, Infinity) : draft.valueItems;
    for (i = 0; i < valueItems.length; i += 1) {
      selected = Object.prototype.hasOwnProperty.call(draft.selectedKeys, valueItems[i].key) ?
        draft.selectedKeys[valueItems[i].key] === true : draft.defaultSelected === true;
      if (selected) {
        selectedValues.push(valueItems[i].value);
      }
    }
    if (selectedValues.length === valueItems.length) {
      this.clearExcelFilter(draft.column);
      return;
    }
    this.setExcelFilter(draft.column, {
      type: 'values',
      values: selectedValues
    });
  };

  FabGrid.prototype.handleExcelFilterMenuInput = function(event) {
    var draft = this.excelFilterDraft;
    var target = event.target;
    var index;
    var item;
    var visibleItems;
    var check;
    var i;
    if (!draft || !target) {
      return;
    }
    if (hasClass(target, 'fg-excel-filter-search')) {
      draft.search = target.value;
      this.filterExcelValueList(target.value);
      return;
    }
    if (hasClass(target, 'fg-excel-filter-value-check')) {
      index = toNumber(target.getAttribute('data-value-index'), -1);
      item = draft.valueItems[index];
      if (item) {
        draft.selectedKeys[item.key] = target.checked === true;
      }
      this.syncExcelFilterSelectAllState();
      return;
    }
    if (!hasClass(target, 'fg-excel-filter-select-all-check')) {
      return;
    }
    visibleItems = this.filterMenu.querySelectorAll('.fg-excel-filter-value-item');
    for (i = 0; i < visibleItems.length; i += 1) {
      if (visibleItems[i].style.display === 'none') {
        continue;
      }
      check = visibleItems[i].querySelector('.fg-excel-filter-value-check');
      index = toNumber(visibleItems[i].getAttribute('data-value-index'), -1);
      item = draft.valueItems[index];
      if (check && item) {
        check.checked = target.checked === true;
        draft.selectedKeys[item.key] = target.checked === true;
      }
    }
    this.syncExcelFilterSelectAllState();
  };

  FabGrid.prototype.selectFilterMenuOperator = function(column, operator, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!column) {
      this.hideFilterMenu();
      return;
    }
    this.setColumnSearchOperator(column, operator);
  };

  FabGrid.prototype.getFilterMenuItemAtEvent = function(event) {
    var x;
    var y;
    var element;
    var items;
    var rect;
    var i;
    if (!this.isFilterMenuOpen() || event.clientX == null || event.clientY == null) {
      return null;
    }
    x = event.clientX;
    y = event.clientY;
    if (document.elementFromPoint) {
      element = document.elementFromPoint(x, y);
      element = closest(element, 'fg-filter-menu-item');
      if (element) {
        return element;
      }
    }
    items = this.filterMenu.querySelectorAll('.fg-filter-menu-item');
    for (i = 0; i < items.length; i += 1) {
      rect = items[i].getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return items[i];
      }
    }
    return null;
  };

  FabGrid.prototype.handleHeaderSearchBeforeInput = function(event) {
    var input = closest(event.target, 'fg-header-search-input');
    var colIndex;
    var column;
    var config;
    var text;
    if (!input || event.isComposing || event.data == null) {
      return;
    }
    colIndex = toNumber(input.getAttribute('data-col'), -1);
    column = this.visibleColumns[colIndex];
    if (!column) {
      return;
    }
    config = getColumnEditorConfig(column);
    text = String(event.data);
    if (isDateLikeEditorType(config.type) && /[^0-9]/.test(text)) {
      event.preventDefault();
    }
  };

  FabGrid.prototype.handleHeaderSearchInput = function(event) {
    var input = closest(event.target, 'fg-header-search-input');
    var colIndex;
    var column;
    var selectionStart;
    var selectionEnd;
    var config;
    var mask;
    var formatted;
    var key;
    var color;
    var value;
    if (!input || event.isComposing === true) {
      return;
    }
    colIndex = toNumber(input.getAttribute('data-col'), -1);
    column = this.visibleColumns[colIndex];
    if (!column) {
      return;
    }
    config = getColumnEditorConfig(column);
    mask = getEditorMask(column);
    if (mask) {
      formatted = formatMaskText(input.value, { mask: mask });
      if (formatted !== input.value) {
        input.value = formatted;
        input.setSelectionRange(formatted.length, formatted.length);
      }
    } else if (isDateLikeEditorType(config.type)) {
      formatted = sanitizeDateEditorText(input.value);
      if (formatted !== input.value) {
        input.value = formatted;
        input.setSelectionRange(formatted.length, formatted.length);
      }
    }
    if (this.dateboxTarget && this.dateboxTarget.type === 'search' && this.dateboxTarget.input === input) {
      this.syncDateboxPanelToTarget(this.dateboxTarget);
      if (this.isDateboxPanelOpen()) {
        this.renderDateboxPanel();
      }
    }
    if (this.comboboxTarget && this.comboboxTarget.type === 'search' && this.comboboxTarget.input === input && this.isComboboxPanelOpen()) {
      this.renderComboboxPanel(false);
      this.setComboboxActiveIndex(this.getComboboxInitialActiveIndex());
      this.positionHeaderSearchComboboxPanel(input);
    }
    if (this.colorTarget && this.colorTarget.type === 'search' && this.colorTarget.input === input && this.isColorPanelOpen()) {
      color = normalizeColorValue(input.value);
      if (color && !this.colorDragState) {
        this.colorState = createColorState(color);
        this.renderColorPanel();
        this.positionHeaderSearchColorPanel(input);
      }
    }
    selectionStart = input.selectionStart;
    selectionEnd = input.selectionEnd;
    key = getColumnSearchKey(column);
    value = String(input.value || '').trim();
    if (value) {
      this.columnSearchValues[key] = value;
    } else {
      delete this.columnSearchValues[key];
    }
    this.updateColumnSearchState();
    this.scheduleHeaderSearch(colIndex, selectionStart, selectionEnd);
  };

  FabGrid.prototype.handleHeaderSearchCompositionStart = function(event) {
    if (closest(event.target, 'fg-header-search-input')) {
      this.cancelHeaderSearchTimer();
    }
  };

  FabGrid.prototype.handleHeaderSearchCompositionEnd = function(event) {
    if (closest(event.target, 'fg-header-search-input')) {
      this.handleHeaderSearchInput(event);
    }
  };

  FabGrid.prototype.handleHeaderSearchIconClick = function(event, button) {
    var colIndex = toNumber(button.getAttribute('data-col'), -1);
    var column = this.visibleColumns[colIndex];
    var icons;
    var iconIndex;
    var iconConfig;
    var handler;
    var input;
    var result;
    if (!column) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    icons = getColumnSearchIconConfigs(column);
    iconIndex = toNumber(button.getAttribute('data-icon-index'), -1);
    iconConfig = icons[iconIndex];
    handler = iconConfig && (iconConfig.onClick || iconConfig.click || iconConfig.handler);
    input = this.header.querySelector('.fg-header-search-input[data-col="' + colIndex + '"]');
    if (iconConfig && iconConfig.builtin === 'datebox') {
      this.showHeaderSearchDateboxPanel(input, column);
      return;
    }
    if (iconConfig && iconConfig.builtin === 'combobox') {
      this.showHeaderSearchComboboxPanel(input, column, true);
      return;
    }
    if (iconConfig && iconConfig.builtin === 'color') {
      if (this.isColorPanelOpen() && this.colorTarget && this.colorTarget.input === input) {
        this.hideColorPanel();
      } else {
        this.showHeaderSearchColorPanel(input, column);
      }
      return;
    }
    if (typeof handler === 'function') {
      result = handler.call(this, this.createHeaderSearchIconArgs(event, button, input, column, iconConfig, iconIndex));
    }
    if (result !== false && (!iconConfig || iconConfig.keepFocus !== false) && input) {
      input.focus();
    }
  };

  FabGrid.prototype.createHeaderSearchIconArgs = function(event, button, input, column, iconConfig, iconIndex) {
    return {
      grid: this,
      column: column,
      col: column ? column._viewIndex : -1,
      input: input || null,
      editor: input || null,
      value: input ? input.value : '',
      text: input ? input.value : '',
      button: button,
      icon: iconConfig || null,
      iconIndex: iconIndex == null ? -1 : iconIndex,
      icons: column ? getColumnSearchIconConfigs(column) : [],
      event: event
    };
  };

  FabGrid.prototype.handleHeaderSearchKeyDown = function(event, input) {
    var colIndex;
    var column;
    var direction;
    var nextCol;
    if (this.handleMaskedHeaderSearchDelete(event, input)) {
      return true;
    }
    if (this.handleHeaderSearchComboboxKeyDown(event, input)) {
      return true;
    }
    if (this.handleHeaderSearchColorKeyDown(event, input)) {
      return true;
    }
    if (event.key !== 'Enter' && event.key !== 'Tab') {
      return false;
    }
    colIndex = toNumber(input.getAttribute('data-col'), -1);
    if (colIndex < 0) {
      return false;
    }
    column = this.visibleColumns[colIndex];
    event.preventDefault();
    event.stopPropagation();
    this.normalizeHeaderSearchComboboxText(input, column);
    direction = event.shiftKey ? -1 : 1;
    nextCol = colIndex + direction;
    this.cancelHeaderSearchTimer();
    this.applyFilterChange(false, 'headerSearch');
    if (nextCol < 0 || nextCol >= this.visibleColumns.length) {
      this.focusHeaderSearchInput(colIndex);
    } else {
      this.moveHeaderSearchFocus(colIndex, direction);
    }
    return true;
  };

  FabGrid.prototype.normalizeHeaderSearchComboboxText = function(input, column) {
    var config;
    var value;
    var text;
    var key;
    if (!input || !column) {
      return;
    }
    config = getColumnEditorConfig(column);
    if (!config || config.type !== 'combobox') {
      return;
    }
    value = String(input.value || '').trim();
    if (!value) {
      return;
    }
    text = getComboboxTextByValue(value, config);
    if (text !== input.value) {
      input.value = text;
      key = getColumnSearchKey(column);
      this.columnSearchValues[key] = String(text).trim();
      this.updateColumnSearchState();
    }
  };

  FabGrid.prototype.handleHeaderSearchComboboxKeyDown = function(event, input) {
    var colIndex;
    var column;
    if (!input) {
      return false;
    }
    colIndex = toNumber(input.getAttribute('data-col'), -1);
    column = this.visibleColumns[colIndex];
    if (!column || getColumnEditorConfig(column).type !== 'combobox') {
      return false;
    }
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      this.showHeaderSearchComboboxPanel(input, column, true);
      return true;
    }
    if (!this.isComboboxPanelOpen() || !this.comboboxTarget || this.comboboxTarget.input !== input) {
      return false;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.setComboboxActiveIndex(this.comboboxActiveIndex + 1);
      return true;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.setComboboxActiveIndex(this.comboboxActiveIndex - 1);
      return true;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.selectComboboxActiveOption();
      return true;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.hideComboboxPanel();
      input.focus();
      return true;
    }
    return false;
  };

  FabGrid.prototype.handleHeaderSearchColorKeyDown = function(event, input) {
    var colIndex;
    var column;
    if (!input) {
      return false;
    }
    colIndex = toNumber(input.getAttribute('data-col'), -1);
    column = this.visibleColumns[colIndex];
    if (!column || getColumnEditorConfig(column).type !== 'color') {
      return false;
    }
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      this.showHeaderSearchColorPanel(input, column);
      return true;
    }
    if (event.key === 'Escape' && this.isColorPanelOpen() && this.colorTarget && this.colorTarget.input === input) {
      event.preventDefault();
      this.hideColorPanel();
      input.focus();
      return true;
    }
    return false;
  };

  FabGrid.prototype.handleMaskedHeaderSearchDelete = function(event, input) {
    var colIndex;
    var column;
    var mask;
    var raw;
    var start;
    var end;
    var deleteStart;
    var deleteEnd;
    var nextRaw;
    var nextText;
    var nextCaret;
    if (!input || (event.key !== 'Backspace' && event.key !== 'Delete')) {
      return false;
    }
    colIndex = toNumber(input.getAttribute('data-col'), -1);
    column = this.visibleColumns[colIndex];
    mask = getEditorMask(column);
    if (!column || !mask) {
      return false;
    }
    event.preventDefault();
    event.stopPropagation();
    start = input.selectionStart == null ? input.value.length : input.selectionStart;
    end = input.selectionEnd == null ? start : input.selectionEnd;
    raw = extractMaskCharacters(input.value, mask);
    deleteStart = countMaskCharactersBeforeCaret(input.value, mask, start);
    deleteEnd = countMaskCharactersBeforeCaret(input.value, mask, end);
    if (start === end) {
      if (event.key === 'Backspace') {
        if (deleteStart <= 0) {
          return true;
        }
        deleteStart -= 1;
      } else if (deleteStart >= raw.length) {
        return true;
      } else {
        deleteEnd += 1;
      }
    }
    nextRaw = raw.slice(0, deleteStart) + raw.slice(deleteEnd);
    nextText = applyMask(nextRaw, mask);
    nextCaret = getMaskCaretPosition(nextText, mask, deleteStart);
    input.value = nextText;
    input.setSelectionRange(nextCaret, nextCaret);
    this.handleHeaderSearchInput({ target: input });
    return true;
  };

  FabGrid.prototype.moveHeaderSearchFocus = function(colIndex, direction) {
    var nextCol = colIndex + direction;
    if (nextCol < 0 || nextCol >= this.visibleColumns.length) {
      return;
    }
    this.scrollHeaderSearchColumnIntoView(nextCol, direction);
    this.render();
    this.requestHeaderSearchFocus(nextCol);
  };

  FabGrid.prototype.scrollHeaderSearchColumnIntoView = function(col, direction) {
    var column = this.visibleColumns[col];
    var viewportWidth;
    var scrollLeft;
    var columnLeft;
    var columnRight;
    var margin = 12;
    if (!column || col < this.frozenColumns || col >= this.scrollableColumnEnd) {
      return;
    }
    viewportWidth = Math.max(0, this.bodyScroll.clientWidth - this.getFixedLeftWidth() - this.frozenWidth - this.frozenRightWidth);
    scrollLeft = this.bodyScroll.scrollLeft;
    columnLeft = column._left - this.frozenWidth;
    columnRight = columnLeft + column._width;
    if (direction > 0 && columnRight + margin > scrollLeft + viewportWidth) {
      this.bodyScroll.scrollLeft = Math.max(0, columnRight - viewportWidth + margin);
    } else if (direction < 0 && columnLeft - margin < scrollLeft) {
      this.bodyScroll.scrollLeft = Math.max(0, columnLeft - margin);
    } else if (columnLeft < scrollLeft) {
      this.bodyScroll.scrollLeft = Math.max(0, columnLeft);
    } else if (columnRight > scrollLeft + viewportWidth) {
      this.bodyScroll.scrollLeft = Math.max(0, columnRight - viewportWidth);
    }
  };

  FabGrid.prototype.getActiveHeaderSearchInput = function() {
    var active = document.activeElement;
    if (!active || !this.header || !this.header.contains(active)) {
      return null;
    }
    return closest(active, 'fg-header-search-input');
  };

  FabGrid.prototype.focusHeaderSearchInput = function(colIndex, selectionStart, selectionEnd) {
    var input = this.header.querySelector('.fg-header-search-input[data-col="' + colIndex + '"]');
    if (!input) {
      return false;
    }
    this.headerScroll.scrollLeft = 0;
    try {
      input.focus({ preventScroll: true });
    } catch (error) {
      input.focus();
    }
    this.headerScroll.scrollLeft = 0;
    if (selectionStart != null && input.setSelectionRange) {
      input.setSelectionRange(selectionStart, selectionEnd == null ? selectionStart : selectionEnd);
    }
    return true;
  };

  FabGrid.prototype.focusHeaderSearchInputLater = function(colIndex, selectionStart, selectionEnd) {
    this.requestHeaderSearchFocus(colIndex, selectionStart, selectionEnd);
  };

  FabGrid.prototype.requestHeaderSearchFocus = function(colIndex, selectionStart, selectionEnd) {
    this.headerSearchFocusRequest = {
      col: colIndex,
      selectionStart: selectionStart,
      selectionEnd: selectionEnd,
      attempts: 4
    };
    this.restoreHeaderSearchFocus();
    this.scheduleHeaderSearchFocusRestore();
  };

  FabGrid.prototype.scheduleHeaderSearchFocusRestore = function() {
    var self = this;
    if (this.headerSearchFocusRaf || !this.headerSearchFocusRequest || this.disposed) {
      return;
    }
    this.headerSearchFocusRaf = window.requestAnimationFrame(function() {
      self.headerSearchFocusRaf = 0;
      self.restoreHeaderSearchFocus();
      if (self.headerSearchFocusRequest) {
        self.scheduleHeaderSearchFocusRestore();
      }
    });
  };

  FabGrid.prototype.restoreHeaderSearchFocus = function() {
    var request = this.headerSearchFocusRequest;
    if (!request) {
      return;
    }
    this.focusHeaderSearchInput(request.col, request.selectionStart, request.selectionEnd);
    request.attempts -= 1;
    if (request.attempts <= 0) {
      this.headerSearchFocusRequest = null;
    }
  };

  FabGrid.prototype.updateColumnSearchState = function() {
    var key;
    this.hasColumnSearch = false;
    for (key in this.columnSearchValues) {
      if (Object.prototype.hasOwnProperty.call(this.columnSearchValues, key) && String(this.columnSearchValues[key] || '').trim()) {
        this.hasColumnSearch = true;
        return;
      }
    }
  };
}

function installFabGridSelection(FabGrid, context) {
  var DEFAULT_OPTIONS = context.DEFAULT_OPTIONS;
  var clamp = context.clamp;
  var closest = context.closest;
  var findRowIndexByItem = context.findRowIndexByItem;
  var getByBinding = context.getByBinding;
  var getColumnEditorConfig = context.getColumnEditorConfig;
  var getExplicitEditorMask = context.getExplicitEditorMask;
  var getMaskCopyText = context.getMaskCopyText;
  var getMaskDataValue = context.getMaskDataValue;
  var getMaskOptions = context.getMaskOptions;
  var getNumberCopyText = context.getNumberCopyText;
  var isHotKey = context.isHotKey;
  var isSafeBinding = context.isSafeBinding;
  var isWeakSetValue = context.isWeakSetValue;
  var parseValue = context.parseValue;
  var setByBinding = context.setByBinding;
  var toNumber = context.toNumber;

  function createCellRange(anchorRow, anchorCol, activeRow, activeCol) {
    return {
      row: Math.min(anchorRow, activeRow),
      col: Math.min(anchorCol, activeCol),
      row2: Math.max(anchorRow, activeRow),
      col2: Math.max(anchorCol, activeCol)
    };
  }

  FabGrid.prototype.isCellRangeSelectionMode = function() {
    return String(this.options.selectionMode || 'Cell').toLowerCase() === 'cellrange';
  };

  FabGrid.prototype.getSelectionRange = function() {
    var anchor = this.selectionAnchor || this.selection;
    return createCellRange(anchor.row, anchor.col, this.selection.row, this.selection.col);
  };

  FabGrid.prototype.getSelectionEventArgs = function(row, col, anchorRow, anchorCol) {
    var range = createCellRange(anchorRow, anchorCol, row, col);
    return {
      row: row,
      col: col,
      row2: range.row2,
      col2: range.col2,
      anchorRow: anchorRow,
      anchorCol: anchorCol,
      activeRow: row,
      activeCol: col,
      range: range
    };
  };

  FabGrid.prototype.isCellInSelectionRange = function(row, col) {
    var range;
    if (!this.isCellRangeSelectionMode() || this.isRowGroup(this.view[row]) || this.isRowGroupFooter(this.view[row])) {
      return false;
    }
    range = this.getSelectionRange();
    return row >= range.row && row <= range.row2 && col >= range.col && col <= range.col2;
  };

  FabGrid.prototype.shouldHighlightRow = function(row) {
    if (this.options.multiSelectRows === true && this.isRowSelected(row)) {
      return true;
    }
    return this.options.highlightActiveRow !== false && this.selection.row === row;
  };

  FabGrid.prototype.handleClick = function(event) {
    var filterMenuItem = closest(event.target, 'fg-filter-menu-item');
    var columnChooserTrigger = closest(event.target, 'fg-column-chooser-trigger');
    var searchIcon = closest(event.target, 'fg-header-search-icon');
    var searchInput = closest(event.target, 'fg-header-search-input');
    var filterIcon = closest(event.target, 'fg-filter-icon');
    var resize = closest(event.target, 'fg-resize');
    var selectAll = closest(event.target, 'fg-selection-check-all');
    var selectionCheck = closest(event.target, 'fg-selection-check');
    var header = closest(event.target, 'fg-header-cell');
    var rowHeader = closest(event.target, 'fg-row-header-cell');
    var selectionCell = closest(event.target, 'fg-selection-cell');
    var groupExpander = closest(event.target, 'fg-row-group-expander');
    var treeExpander = closest(event.target, 'fg-tree-expander');
    var cell = closest(event.target, 'fg-cell');
    var colIndex;
    var rowIndex;

    if (this.busy) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (this.fixedPaneTouchClickUntil && Date.now() < this.fixedPaneTouchClickUntil) {
      this.fixedPaneTouchClickUntil = 0;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (filterMenuItem) {
      this.handleFilterMenuClick(event);
      return;
    }

    if (columnChooserTrigger) {
      event.preventDefault();
      event.stopPropagation();
      this.toggleColumnChooser(columnChooserTrigger);
      return;
    }

    if (searchIcon) {
      this.handleHeaderSearchIconClick(event, searchIcon);
      return;
    }

    if (searchInput) {
      event.stopPropagation();
      return;
    }

    if (filterIcon) {
      event.preventDefault();
      event.stopPropagation();
      colIndex = toNumber((header || filterIcon).getAttribute('data-col'), -1);
      if (colIndex < 0 && header) {
        colIndex = toNumber(header.getAttribute('data-col'), -1);
      }
      this.showFilterMenu(colIndex, filterIcon);
      return;
    }

    if (this.suppressClick && (resize || header)) {
      this.suppressClick = false;
      event.preventDefault();
      return;
    }
    this.suppressClick = false;

    if (resize) {
      event.preventDefault();
      return;
    }

    if (selectAll) {
      event.preventDefault();
      event.stopPropagation();
      this.setAllRowsSelected(selectAll.checked);
      this.root.focus();
      return;
    }

    if (selectionCheck || selectionCell) {
      event.preventDefault();
      event.stopPropagation();
      rowIndex = toNumber((selectionCheck || selectionCell).getAttribute('data-row'), 0);
      this.toggleRowSelection(rowIndex);
      this.root.focus();
      return;
    }

    if (header && this.options.allowSorting) {
      colIndex = toNumber(header.getAttribute('data-col'), -1);
      this.toggleSort(colIndex, event.shiftKey === true);
      return;
    }

    if (rowHeader) {
      rowIndex = toNumber(rowHeader.getAttribute('data-row'), 0);
      if (this.isRowGroup(this.view[rowIndex]) || this.isRowGroupFooter(this.view[rowIndex])) {
        this.root.focus();
        return;
      }
      this.toggleRowSelection(rowIndex);
      this.root.focus();
      return;
    }

    if (cell) {
      rowIndex = toNumber(cell.getAttribute('data-row'), 0);
      colIndex = toNumber(cell.getAttribute('data-col'), 0);
      if (treeExpander && treeExpander.className.indexOf('fg-tree-expander-placeholder') < 0) {
        event.preventDefault();
        event.stopPropagation();
        this.toggleTreeNode(rowIndex);
        this.root.focus();
        return;
      }
      if (this.isRowGroup(this.view[rowIndex])) {
        if (groupExpander) {
          this.toggleRowGroup(rowIndex);
        } else {
          this.select(rowIndex, this.selection.col);
          this.scrollIntoView(rowIndex, this.selection.col);
        }
        this.root.focus();
        return;
      }
      if (this.isRowGroupFooter(this.view[rowIndex])) {
        this.root.focus();
        return;
      }
      if (this.editing && (this.editing.row !== rowIndex || this.editing.col !== colIndex)) {
        if (this.finishEditing(true) === false) {
          event.preventDefault();
          return;
        }
      }
      if (event.detail === 2 && !this.isCellRangeSelectionMode()) {
        this.scheduleCellDblClick(event, rowIndex, colIndex);
      }
      if (this.isCellRangeSelectionMode()) {
        if (this.suppressCellRangeClick) {
          var suppressCellRangeClickEvent = this.suppressCellRangeClickEvent;
          this.suppressCellRangeClick = false;
          this.suppressCellRangeClickEvent = false;
          if (suppressCellRangeClickEvent) {
            event.preventDefault();
            event.stopPropagation();
          }
          this.root.focus();
          return;
        }
        if (event.shiftKey === true) {
          this.extendCellRangeSelection(rowIndex, colIndex);
        } else {
          this.select(rowIndex, colIndex);
        }
        this.scrollIntoView(rowIndex, colIndex);
        this.root.focus();
        return;
      }
      if (this.shouldEditOnSelect(rowIndex, colIndex)) {
        this.selectRow(rowIndex, colIndex);
      } else {
        this.toggleRowSelection(rowIndex, colIndex);
      }
      this.scrollIntoView(rowIndex, colIndex);
      if (this.shouldEditOnSelect(rowIndex, colIndex)) {
        if (this.startEditing(rowIndex, colIndex)) {
          return;
        }
      }
      this.root.focus();
    }
  };

  FabGrid.prototype.canDragColumns = function() {
    var mode = this.options.allowDragging;
    if (mode === true) {
      return true;
    }
    mode = mode == null ? '' : String(mode).toLowerCase();
    return mode === 'columns' || mode === 'column' || mode === 'all';
  };

  FabGrid.prototype.startColumnDrag = function(event, header, colIndex) {
    var column = this.visibleColumns[colIndex];
    var headerRect;
    var title;
    var titleRect;
    if (!column || !this.canDragColumns()) {
      return;
    }
    headerRect = header.getBoundingClientRect();
    title = header.querySelector('.fg-header-title');
    titleRect = title ? title.getBoundingClientRect() : headerRect;
    this.columnDragState = {
      column: column,
      sourceIndex: colIndex,
      partition: this.getColumnDragPartition(colIndex),
      startX: event.clientX,
      startY: event.clientY,
      pointerOffsetX: event.clientX - headerRect.left,
      pointerOffsetY: event.clientY - titleRect.top,
      sourceLeft: headerRect.left,
      sourceTop: titleRect.top,
      previewWidth: headerRect.width,
      previewHeight: titleRect.height,
      pointerId: event.pointerId,
      pointerTarget: header,
      active: false,
      target: null
    };
    this.bindPointerInteractionEvents();
  };

  FabGrid.prototype.getColumnDragPartition = function(colIndex) {
    if (colIndex < this.frozenColumns) {
      return 'left';
    }
    if (colIndex >= this.scrollableColumnEnd) {
      return 'right';
    }
    return 'main';
  };

  FabGrid.prototype.getColumnDragPartitionRange = function(partition) {
    if (partition === 'left') {
      return { start: 0, end: this.frozenColumns };
    }
    if (partition === 'right') {
      return { start: this.scrollableColumnEnd, end: this.visibleColumns.length };
    }
    return { start: this.frozenColumns, end: this.scrollableColumnEnd };
  };

  FabGrid.prototype.getColumnDragTarget = function(clientX, clientY, state) {
    var range = this.getColumnDragPartitionRange(state.partition);
    var headerRect = this.header.getBoundingClientRect();
    var cell;
    var rect;
    var column;
    var beforeColumn;
    var position;
    var i;
    if (clientY < headerRect.top || clientY > headerRect.bottom) {
      return null;
    }
    for (i = range.start; i < range.end; i += 1) {
      cell = this.root.querySelector('.fg-header-cell[data-col="' + i + '"]');
      if (!cell) {
        continue;
      }
      rect = cell.getBoundingClientRect();
      if (clientX < rect.left || clientX > rect.right) {
        continue;
      }
      column = this.visibleColumns[i];
      position = clientX < rect.left + rect.width / 2 ? 'before' : 'after';
      beforeColumn = position === 'before' ? column :
        i + 1 < range.end ? this.visibleColumns[i + 1] : this.visibleColumns[range.end] || null;
      return {
        index: i,
        position: position,
        beforeColumn: beforeColumn,
        cell: cell
      };
    }
    return null;
  };

  FabGrid.prototype.getColumnDragDestinationIndex = function(column, beforeColumn) {
    var sourceIndex = this.columns.indexOf(column);
    var targetIndex = beforeColumn ? this.columns.indexOf(beforeColumn) : this.columns.length;
    if (sourceIndex < 0) {
      return -1;
    }
    if (targetIndex > sourceIndex) {
      targetIndex -= 1;
    }
    return targetIndex;
  };

  FabGrid.prototype.isColumnDragMoveNeeded = function(state, target) {
    return this.getColumnDragDestinationIndex(state.column, target.beforeColumn) !== this.columns.indexOf(state.column);
  };

  FabGrid.prototype.setColumnDragTarget = function(target) {
    if (this.columnDragTargetCell) {
      this.columnDragTargetCell.classList.remove('fg-column-drag-before', 'fg-column-drag-after');
    }
    this.columnDragTargetCell = target ? target.cell : null;
    this.updateColumnDragIndicator(target);
  };

  FabGrid.prototype.updateColumnDragIndicator = function(target) {
    var rootRect;
    var headerRect;
    var cellRect;
    var left;
    if (!target) {
      if (this.columnDragIndicator) {
        this.columnDragIndicator.style.display = 'none';
      }
      return;
    }
    if (!this.columnDragIndicator) {
      this.columnDragIndicator = document.createElement('div');
      this.columnDragIndicator.className = 'fg-column-drop-indicator';
      this.root.appendChild(this.columnDragIndicator);
    }
    rootRect = this.root.getBoundingClientRect();
    headerRect = this.header.getBoundingClientRect();
    cellRect = target.cell.getBoundingClientRect();
    left = (target.position === 'before' ? cellRect.left : cellRect.right) - rootRect.left;
    this.columnDragIndicator.style.display = 'block';
    this.columnDragIndicator.style.left = Math.round(left) + 'px';
    this.columnDragIndicator.style.top = Math.round(headerRect.top - rootRect.top) + 'px';
    this.columnDragIndicator.style.height = Math.round(headerRect.height) + 'px';
  };

  FabGrid.prototype.showColumnDragPreview = function(state) {
    var preview;
    var title;
    if (state.preview) {
      return;
    }
    preview = document.createElement('div');
    preview.className = state.pointerTarget.className + ' fg-column-drag-preview';
    preview.setAttribute('aria-hidden', 'true');
    title = state.pointerTarget.querySelector('.fg-header-title');
    if (title) {
      preview.appendChild(title.cloneNode(true));
    }
    preview.style.width = state.previewWidth + 'px';
    preview.style.height = state.previewHeight + 'px';
    this.root.appendChild(preview);
    state.preview = preview;
  };

  FabGrid.prototype.updateColumnDragPreview = function(event, state) {
    if (!state.preview) {
      return;
    }
    state.preview.style.left = event.clientX - state.pointerOffsetX + 'px';
    state.preview.style.top = event.clientY - state.pointerOffsetY + 'px';
  };

  FabGrid.prototype.removeColumnDragPreview = function(state) {
    if (state.preview && state.preview.parentNode) {
      state.preview.parentNode.removeChild(state.preview);
    }
    state.preview = null;
  };

  FabGrid.prototype.returnColumnDragPreview = function(state) {
    var preview = state.preview;
    var headerRect;
    var title;
    var titleRect;
    if (!preview) {
      return;
    }
    if (state.pointerTarget && state.pointerTarget.isConnected) {
      headerRect = state.pointerTarget.getBoundingClientRect();
      title = state.pointerTarget.querySelector('.fg-header-title');
      titleRect = title ? title.getBoundingClientRect() : headerRect;
      state.sourceLeft = headerRect.left;
      state.sourceTop = titleRect.top;
    }
    preview.getBoundingClientRect();
    preview.classList.add('fg-column-drag-returning');
    preview.style.left = state.sourceLeft + 'px';
    preview.style.top = state.sourceTop + 'px';
    window.setTimeout(function() {
      if (preview.parentNode) {
        preview.parentNode.removeChild(preview);
      }
    }, 230);
    state.preview = null;
  };

  FabGrid.prototype.updateColumnDrag = function(event) {
    var state = this.columnDragState;
    var target;
    var from;
    var to;
    if (!state || (state.pointerId != null && event.pointerId != null && state.pointerId !== event.pointerId)) {
      return;
    }
    if (!state.active) {
      if (Math.abs(event.clientX - state.startX) < 5 && Math.abs(event.clientY - state.startY) < 5) {
        return;
      }
      state.active = true;
      this.root.classList.add('fg-column-dragging');
      this.showColumnDragPreview(state);
      if (state.pointerTarget && state.pointerTarget.setPointerCapture && event.pointerId != null) {
        state.pointerTarget.setPointerCapture(event.pointerId);
      }
    }
    event.preventDefault();
    this.updateColumnDragPreview(event, state);
    target = this.getColumnDragTarget(event.clientX, event.clientY, state);
    if (!target || !this.isColumnDragMoveNeeded(state, target)) {
      target = null;
    }
    if (state.target && target && state.target.beforeColumn === target.beforeColumn && state.target.position === target.position) {
      return;
    }
    from = state.sourceIndex;
    to = target ? this.getColumnDragDestinationIndex(state.column, target.beforeColumn) : -1;
    if (target && this.emit('draggingColumn', {
      column: state.column,
      from: from,
      to: to,
      position: target.position
    }) === false) {
      target = null;
    }
    state.target = target;
    this.setColumnDragTarget(target);
  };

  FabGrid.prototype.moveColumnBefore = function(column, beforeColumn) {
    var sourceIndex = this.columns.indexOf(column);
    var destinationIndex = this.getColumnDragDestinationIndex(column, beforeColumn);
    var selectedColumn = this.visibleColumns[this.selection.col] || null;
    var anchorColumn = this.visibleColumns[(this.selectionAnchor || this.selection).col] || null;
    if (sourceIndex < 0 || destinationIndex < 0 || sourceIndex === destinationIndex) {
      return false;
    }
    this.columns.splice(sourceIndex, 1);
    this.columns.splice(destinationIndex, 0, column);
    this.updateLayout();
    if (selectedColumn) {
      this.selection.col = Math.max(0, this.visibleColumns.indexOf(selectedColumn));
    }
    if (anchorColumn) {
      this.selectionAnchor.col = Math.max(0, this.visibleColumns.indexOf(anchorColumn));
    }
    this.render();
    return true;
  };

  FabGrid.prototype.finishColumnDrag = function(event) {
    var state = this.columnDragState;
    var moved = false;
    var shouldReturn = false;
    var destinationIndex;
    if (!state || (state.pointerId != null && event.pointerId != null && state.pointerId !== event.pointerId)) {
      return false;
    }
    if (state.active) {
      event.preventDefault();
      this.suppressClick = true;
      if (state.target && this.isColumnDragMoveNeeded(state, state.target)) {
        if (!this.editing || this.finishEditing(true) !== false) {
          destinationIndex = this.getColumnDragDestinationIndex(state.column, state.target.beforeColumn);
          moved = this.moveColumnBefore(state.column, state.target.beforeColumn);
          if (moved) {
            this.emit('draggedColumn', {
              column: state.column,
              from: state.sourceIndex,
              to: destinationIndex,
              position: state.target.position
            });
          }
        }
      }
      shouldReturn = !moved;
    }
    if (state.pointerTarget && state.pointerTarget.releasePointerCapture && event.pointerId != null) {
      try {
        state.pointerTarget.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Ignore a pointer that was already released by the browser.
      }
    }
    this.setColumnDragTarget(null);
    if (shouldReturn) {
      this.returnColumnDragPreview(state);
    } else {
      this.removeColumnDragPreview(state);
    }
    this.root.classList.remove('fg-column-dragging');
    this.columnDragState = null;
    return true;
  };

  FabGrid.prototype.bindPointerInteractionEvents = function() {
    if (this.pointerInteractionEventsBound) {
      return;
    }
    document.addEventListener('pointermove', this._boundPointerMove);
    document.addEventListener('pointerup', this._boundPointerUp);
    document.addEventListener('pointercancel', this._boundPointerUp);
    this.pointerInteractionEventsBound = true;
  };

  FabGrid.prototype.unbindPointerInteractionEvents = function() {
    if (!this.pointerInteractionEventsBound) {
      return;
    }
    document.removeEventListener('pointermove', this._boundPointerMove);
    document.removeEventListener('pointerup', this._boundPointerUp);
    document.removeEventListener('pointercancel', this._boundPointerUp);
    this.pointerInteractionEventsBound = false;
  };

  FabGrid.prototype.handlePointerDown = function(event) {
    var resize = closest(event.target, 'fg-resize');
    var header = closest(event.target, 'fg-header-cell');
    var cell = closest(event.target, 'fg-cell');
    var colIndex;
    if (this.busy) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.button != null && event.button !== 0) {
      return;
    }
    if (resize && this.options.allowResizing !== false) {
      this.startResize(event, toNumber(resize.getAttribute('data-resize-col'), 0));
      return;
    }
    if (cell && this.isCellRangeSelectionMode() && !this.canDragRows() &&
        !closest(event.target, 'fg-tree-expander') && !closest(event.target, 'fg-row-group-expander')) {
      if (this.startCellRangeDrag(event, cell)) {
        return;
      }
    }
    if (!header || closest(event.target, 'fg-header-search') || closest(event.target, 'fg-filter-icon')) {
      return;
    }
    colIndex = toNumber(header.getAttribute('data-col'), -1);
    if (colIndex >= 0) {
      this.startColumnDrag(event, header, colIndex);
    }
  };

  FabGrid.prototype.getCellRangeTargetAtPoint = function(clientX, clientY) {
    var target = typeof document.elementFromPoint === 'function' ? document.elementFromPoint(clientX, clientY) : null;
    var cell = closest(target, 'fg-cell');
    var row;
    var col;
    if (!cell || !this.root.contains(cell)) {
      return null;
    }
    row = toNumber(cell.getAttribute('data-row'), -1);
    col = toNumber(cell.getAttribute('data-col'), -1);
    if (row < 0 || col < 0 || !this.view[row] ||
        this.isRowGroup(this.view[row]) || this.isRowGroupFooter(this.view[row])) {
      return null;
    }
    return { row: row, col: col };
  };

  FabGrid.prototype.startCellRangeDrag = function(event, cell) {
    var row = toNumber(cell.getAttribute('data-row'), -1);
    var col = toNumber(cell.getAttribute('data-col'), -1);
    var isDoubleClick;
    if (row < 0 || col < 0 || !this.view[row] ||
        this.isRowGroup(this.view[row]) || this.isRowGroupFooter(this.view[row])) {
      return false;
    }
    isDoubleClick = this.isCellRangePointerDoubleClick(event, row, col);
    this.suppressCellRangeClick = false;
    this.suppressCellRangeClickEvent = false;
    if (event.shiftKey === true) {
      this.extendCellRangeSelection(row, col);
    } else {
      this.select(row, col);
    }
    this.cellRangeDragState = {
      pointerId: event.pointerId,
      startRow: row,
      startCol: col,
      clientX: event.clientX,
      clientY: event.clientY,
      isDoubleClick: isDoubleClick,
      didMove: false
    };
    this.bindPointerInteractionEvents();
    event.preventDefault();
    this.root.focus();
    return true;
  };

  FabGrid.prototype.isCellRangePointerDoubleClick = function(event, row, col) {
    var previous = this.cellRangeClickCandidate;
    var time = toNumber(event.timeStamp, Date.now());
    var detail = toNumber(event.detail, 0);
    var sameCell = !!(previous && previous.row === row && previous.col === col);
    var isDoubleClick = sameCell && (detail === 2 || (
      time - previous.time >= 0 &&
      time - previous.time <= 500 &&
      Math.abs((event.clientX || 0) - previous.clientX) <= 8 &&
      Math.abs((event.clientY || 0) - previous.clientY) <= 8
    ));
    if (isDoubleClick) {
      this.cellRangeClickCandidate = null;
      return true;
    }
    this.cellRangeClickCandidate = {
      row: row,
      col: col,
      time: time,
      clientX: event.clientX || 0,
      clientY: event.clientY || 0
    };
    return false;
  };

  FabGrid.prototype.getCellRangeAutoScrollDelta = function(clientX, clientY) {
    var rect;
    var threshold = 24;
    var deltaX = 0;
    var deltaY = 0;
    var scrollableLeft;
    var scrollableRight;
    if (!this.bodyScroll) {
      return { x: 0, y: 0 };
    }
    rect = this.bodyScroll.getBoundingClientRect();
    scrollableLeft = rect.left + this.getFixedLeftWidth() + this.frozenWidth;
    scrollableRight = rect.right - this.frozenRightWidth;
    if (clientY < rect.top + threshold) {
      deltaY = -this.options.rowHeight;
    } else if (clientY > rect.bottom - threshold) {
      deltaY = this.options.rowHeight;
    }
    if (clientX >= scrollableLeft && clientX < scrollableLeft + threshold) {
      deltaX = -32;
    } else if (clientX <= scrollableRight && clientX > scrollableRight - threshold) {
      deltaX = 32;
    }
    return { x: deltaX, y: deltaY };
  };

  FabGrid.prototype.updateCellRangeDragTarget = function(clientX, clientY) {
    var rect = this.bodyScroll.getBoundingClientRect();
    var x = clamp(clientX, rect.left + 1, rect.right - 1);
    var y = clamp(clientY, rect.top + 1, rect.bottom - 1);
    var target = this.getCellRangeTargetAtPoint(x, y);
    var state = this.cellRangeDragState;
    if (!target || !state) {
      return false;
    }
    if (target.row === this.selection.row && target.col === this.selection.col) {
      return false;
    }
    state.didMove = state.didMove || target.row !== state.startRow || target.col !== state.startCol;
    this.extendCellRangeSelection(target.row, target.col);
    return true;
  };

  FabGrid.prototype.scrollCellRangeDrag = function() {
    var state = this.cellRangeDragState;
    var delta;
    var previousLeft;
    var previousTop;
    if (!state || !this.bodyScroll) {
      return false;
    }
    delta = this.getCellRangeAutoScrollDelta(state.clientX, state.clientY);
    if (!delta.x && !delta.y) {
      return false;
    }
    previousLeft = this.bodyScroll.scrollLeft;
    previousTop = this.bodyScroll.scrollTop;
    this.bodyScroll.scrollLeft += delta.x;
    this.bodyScroll.scrollTop += delta.y;
    if (previousLeft === this.bodyScroll.scrollLeft && previousTop === this.bodyScroll.scrollTop) {
      return false;
    }
    this.render();
    this.updateCellRangeDragTarget(state.clientX, state.clientY);
    return true;
  };

  FabGrid.prototype.scheduleCellRangeAutoScroll = function() {
    var self = this;
    if (this.cellRangeAutoScrollRaf || !this.cellRangeDragState) {
      return;
    }
    this.cellRangeAutoScrollRaf = requestAnimationFrame(function() {
      self.cellRangeAutoScrollRaf = 0;
      if (self.scrollCellRangeDrag()) {
        self.scheduleCellRangeAutoScroll();
      }
    });
  };

  FabGrid.prototype.updateCellRangeDrag = function(event) {
    var state = this.cellRangeDragState;
    if (!state || (state.pointerId != null && event.pointerId != null && state.pointerId !== event.pointerId)) {
      return false;
    }
    state.clientX = event.clientX;
    state.clientY = event.clientY;
    this.updateCellRangeDragTarget(event.clientX, event.clientY);
    if (this.scrollCellRangeDrag()) {
      this.scheduleCellRangeAutoScroll();
    }
    event.preventDefault();
    return true;
  };

  FabGrid.prototype.finishCellRangeDrag = function(event) {
    var self = this;
    var state = this.cellRangeDragState;
    var canceled;
    if (!state || (state.pointerId != null && event.pointerId != null && state.pointerId !== event.pointerId)) {
      return false;
    }
    canceled = event.type === 'pointercancel';
    if (this.cellRangeAutoScrollRaf) {
      cancelAnimationFrame(this.cellRangeAutoScrollRaf);
      this.cellRangeAutoScrollRaf = 0;
    }
    this.cellRangeDragState = null;
    this.suppressCellRangeClick = !canceled;
    this.suppressCellRangeClickEvent = !canceled && state.didMove;
    if (canceled || state.didMove) {
      this.cellRangeClickCandidate = null;
    } else if (state.isDoubleClick) {
      this.scheduleCellDblClick(event, state.startRow, state.startCol);
    }
    if (!canceled) {
      setTimeout(function() {
        self.suppressCellRangeClick = false;
        self.suppressCellRangeClickEvent = false;
      }, 0);
    }
    return true;
  };

  FabGrid.prototype.cancelPendingCellDblClick = function() {
    if (this.cellDblClickTimer) {
      window.clearTimeout(this.cellDblClickTimer);
      this.cellDblClickTimer = 0;
    }
    this.pendingCellDblClick = null;
  };

  FabGrid.prototype.scheduleCellDblClick = function(event, row, col) {
    var self = this;
    this.cancelPendingCellDblClick();
    this.pendingCellDblClick = {
      row: row,
      col: col,
      screenX: event.screenX || 0,
      screenY: event.screenY || 0,
      clientX: event.clientX || 0,
      clientY: event.clientY || 0,
      ctrlKey: event.ctrlKey === true,
      altKey: event.altKey === true,
      shiftKey: event.shiftKey === true,
      metaKey: event.metaKey === true,
      button: event.button || 0
    };
    this.cellDblClickTimer = window.setTimeout(function() {
      var pending = self.pendingCellDblClick;
      var cell;
      var dblClickEvent;
      if (!pending || self.disposed) {
        self.cancelPendingCellDblClick();
        return;
      }
      self.cellDblClickTimer = 0;
      self.pendingCellDblClick = null;
      if (!self.view[pending.row] || self.isRowGroup(self.view[pending.row]) || self.isRowGroupFooter(self.view[pending.row])) {
        return;
      }
      cell = self.root.querySelector(
        '.fg-cell[data-row="' + pending.row + '"][data-col="' + pending.col + '"]'
      );
      if (!cell) {
        return;
      }
      if (typeof MouseEvent === 'function') {
        dblClickEvent = new MouseEvent('dblclick', {
          bubbles: true,
          cancelable: true,
          view: window,
          detail: 2,
          screenX: pending.screenX,
          screenY: pending.screenY,
          clientX: pending.clientX,
          clientY: pending.clientY,
          ctrlKey: pending.ctrlKey,
          altKey: pending.altKey,
          shiftKey: pending.shiftKey,
          metaKey: pending.metaKey,
          button: pending.button
        });
      } else {
        dblClickEvent = document.createEvent('MouseEvents');
        dblClickEvent.initMouseEvent(
          'dblclick',
          true,
          true,
          window,
          2,
          pending.screenX,
          pending.screenY,
          pending.clientX,
          pending.clientY,
          pending.ctrlKey,
          pending.altKey,
          pending.shiftKey,
          pending.metaKey,
          pending.button,
          null
        );
      }
      cell.dispatchEvent(dblClickEvent);
    }, 0);
  };

  FabGrid.prototype.handleDblClick = function(event) {
    var resize = closest(event.target, 'fg-resize');
    var cell = closest(event.target, 'fg-cell');
    var rowHeader = closest(event.target, 'fg-row-header-cell');
    var rowIndex;
    if (this.busy) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (this.pendingCellDblClick) {
      if (cell) {
        this.cancelPendingCellDblClick();
      } else {
        event.stopPropagation();
        return;
      }
    }
    if (resize && this.options.allowResizing !== false) {
      event.preventDefault();
      event.stopPropagation();
      this.autoSizeColumn(toNumber(resize.getAttribute('data-resize-col'), -1));
      return;
    }
    if (this.handleTopLeftSearchDblClick(event)) {
      return;
    }
    if (rowHeader) {
      rowIndex = toNumber(rowHeader.getAttribute('data-row'), -1);
      if (rowIndex === 0 && this.isRowGroup(this.view[rowIndex])) {
        event.preventDefault();
        event.stopPropagation();
        this.toggleAllRowGroups();
        this.root.focus();
      }
      return;
    }
    if (!cell || !this.options.allowEditing) {
      return;
    }
    this.startEditing(toNumber(cell.getAttribute('data-row'), 0), toNumber(cell.getAttribute('data-col'), 0));
  };

  FabGrid.prototype.handleTopLeftSearchDblClick = function(event) {
    var topCell;
    var rect;
    if (this.options.allowFiltering === false || this.options.showSearchRow !== true) {
      return false;
    }
    topCell = closest(event.target, 'fg-row-header-top') || closest(event.target, 'fg-selection-top');
    if (topCell !== this.rowHeaderTop && topCell !== this.selectionTop) {
      return false;
    }
    rect = topCell.getBoundingClientRect();
    if (event.clientY < rect.top + this.getHeaderTitleHeight()) {
      return false;
    }
    event.preventDefault();
    event.stopPropagation();
    this.clearSearchConditions('topLeftSearchCell');
    return true;
  };

  FabGrid.prototype.handleMouseMove = function(event) {
    var rowHeader = closest(event.target, 'fg-row-header-cell');
    var selectionCell = closest(event.target, 'fg-selection-cell');
    var cell = closest(event.target, 'fg-cell');
    var nextRow = null;
    if (rowHeader) {
      nextRow = toNumber(rowHeader.getAttribute('data-row'), null);
    } else if (selectionCell) {
      nextRow = toNumber(selectionCell.getAttribute('data-row'), null);
    } else if (cell) {
      nextRow = toNumber(cell.getAttribute('data-row'), null);
    }
    this.updateInvalidTip(cell);
    if (this.hoverRow !== nextRow) {
      this.hoverRow = nextRow;
      this.renderVisibleRows();
    }
  };

  FabGrid.prototype.handleMouseLeave = function() {
    this.hideInvalidTip();
    if (this.hoverRow !== null) {
      this.hoverRow = null;
      this.renderVisibleRows();
    }
  };

  FabGrid.prototype.updateInvalidTip = function(cell) {
    var rowIndex;
    var colIndex;
    var row;
    var column;
    var error;
    if (!cell || !this.invalidTip || cell.className.indexOf('fg-cell-invalid') < 0) {
      this.hideInvalidTip();
      return;
    }
    rowIndex = toNumber(cell.getAttribute('data-row'), -1);
    colIndex = toNumber(cell.getAttribute('data-col'), -1);
    row = this.view[rowIndex];
    column = this.visibleColumns[colIndex];
    error = this.getCellValidationError(row, column);
    if (!error) {
      this.hideInvalidTip();
      return;
    }
    this.showInvalidTip(cell, error.message || this.getText('validation.invalidValue'));
  };

  FabGrid.prototype.showInvalidTip = function(cell, message) {
    var cellRect = cell.getBoundingClientRect();
    var bodyRect = this.body.getBoundingClientRect();
    var tip = this.invalidTip;
    var left;
    var top;
    var maxLeft;
    if (!tip) {
      return;
    }
    tip.textContent = message;
    tip.style.display = 'block';
    left = cellRect.right - bodyRect.left + 8;
    top = cellRect.top - bodyRect.top + Math.max(4, (cellRect.height - tip.offsetHeight) / 2);
    maxLeft = this.body.clientWidth - tip.offsetWidth - 8;
    if (left > maxLeft) {
      left = cellRect.left - bodyRect.left - tip.offsetWidth - 8;
    }
    if (left < 8) {
      left = Math.min(maxLeft, Math.max(8, cellRect.left - bodyRect.left));
      top = cellRect.bottom - bodyRect.top + 6;
    }
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  };

  FabGrid.prototype.hideInvalidTip = function() {
    if (this.invalidTip) {
      this.invalidTip.style.display = 'none';
    }
  };

  FabGrid.prototype.isHeaderToggleKey = function(event) {
    return isHotKey(event, this.options.headerToggleKey);
  };

  FabGrid.prototype.isMacPlatform = function() {
    var platform = '';
    if (typeof navigator !== 'undefined') {
      platform = navigator.userAgentData && navigator.userAgentData.platform ?
        navigator.userAgentData.platform :
        navigator.platform || navigator.userAgent || '';
    }
    return /mac/i.test(platform);
  };

  FabGrid.prototype.getVerticalBoundaryHotKeyDirection = function(event) {
    if (this.isMacPlatform()) {
      if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.key === 'PageUp') {
        return -1;
      }
      if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.key === 'PageDown') {
        return 1;
      }
      return 0;
    }
    if (event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey && event.key === 'ArrowUp') {
      return -1;
    }
    if (event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey && event.key === 'ArrowDown') {
      return 1;
    }
    return 0;
  };

  FabGrid.prototype.getHorizontalBoundaryHotKeyDirection = function(event) {
    if (this.isMacPlatform()) {
      if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.key === 'Home') {
        return -1;
      }
      if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.key === 'End') {
        return 1;
      }
      if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.key === 'Home') {
        return -1;
      }
      if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.key === 'End') {
        return 1;
      }
      return 0;
    }
    if (event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey && event.key === 'ArrowLeft') {
      return -1;
    }
    if (event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey && event.key === 'ArrowRight') {
      return 1;
    }
    return 0;
  };

  FabGrid.prototype.handleKeyDown = function(event) {
    var row = this.selection.row;
    var col = this.selection.col;
    var boundaryDirection;
    var horizontalBoundaryDirection;
    var targetName = event.target && event.target.tagName ? event.target.tagName.toUpperCase() : '';
    var searchInput = closest(event.target, 'fg-header-search-input');

    if (this.busy) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (event.key === 'Escape' && this.isFilterMenuOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.hideFilterMenu();
      return;
    }

    if (event.key === 'Escape' && this.isTopLeftMenuOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.hideTopLeftMenu();
      return;
    }

    if (event.key === 'Escape' && this.isColumnChooserOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.hideColumnChooser();
      return;
    }

    if (searchInput && this.handleHeaderSearchKeyDown(event, searchInput)) {
      return;
    }

    if (this.isHeaderToggleKey(event)) {
      event.preventDefault();
      event.stopPropagation();
      this.toggleHeaderDisplayMode();
      return;
    }

    if (this.editing) {
      if (event.target === this.editor && this.handleMaskedEditorDelete(event)) {
        return;
      }
      if (event.target === this.editor && this.handleComboboxKeyDown(event)) {
        return;
      }
      if (event.target === this.editor && this.handleColorKeyDown(event)) {
        return;
      }
      if (event.target === this.editor && this.shouldBlockEditorKey(event)) {
        event.preventDefault();
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        if (event.shiftKey) {
          this.commitEditingAndMoveLeft();
        } else {
          this.commitEditingAndMoveRight();
        }
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.commitEditingAndMoveVertical(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.commitEditingAndMoveVertical(-1);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.finishEditing(false);
      }
      return;
    }

    if (targetName === 'INPUT' && event.target !== this.editor) {
      return;
    }

    if (this.options.autoClipboard !== false && (event.ctrlKey || event.metaKey) && !event.altKey && String(event.key).toLowerCase() === 'c') {
      event.preventDefault();
      this.copySelection();
      return;
    }

    if (event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space') {
      event.preventDefault();
      if (this.options.multiSelectRows === true && this.view.length) {
        this.toggleRowSelection(row, col);
        this.scrollIntoView(row, col);
      }
      return;
    }

    if (this.handleCellRangeKeyDown(event)) {
      return;
    }

    boundaryDirection = this.getVerticalBoundaryHotKeyDirection(event);
    if (boundaryDirection) {
      event.preventDefault();
      this.moveVertical(boundaryDirection < 0 ? 0 : this.view.length - 1, col);
      return;
    }

    horizontalBoundaryDirection = this.getHorizontalBoundaryHotKeyDirection(event);
    if (horizontalBoundaryDirection) {
      event.preventDefault();
      this.moveHorizontalBoundary(horizontalBoundaryDirection, row);
      return;
    }

    if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && (event.key === 'PageDown' || event.key === 'PageUp')) {
      event.preventDefault();
      this.movePage(event.key === 'PageDown' ? 1 : -1);
      return;
    }

    if (this.handleTreeKeyDown(event, row, col)) {
      return;
    }

    if (event.key === 'ArrowDown') {
      row += 1;
      event.preventDefault();
      this.moveVertical(row, col);
      return;
    } else if (event.key === 'ArrowUp') {
      row -= 1;
      event.preventDefault();
      this.moveVertical(row, col);
      return;
    } else if (event.key === 'ArrowRight') {
      col += 1;
    } else if (event.key === 'ArrowLeft') {
      col -= 1;
    } else if (event.key === 'Enter' || event.key === 'F2') {
      if (this.options.allowEditing) {
        event.preventDefault();
        this.startEditing(row, col);
      }
      return;
    } else {
      return;
    }
    event.preventDefault();
    this.moveCell(row, col);
  };

  FabGrid.prototype.handleCellRangeKeyDown = function(event) {
    var row = this.selection.row;
    var col = this.selection.col;
    var rowStep = 0;
    if (!this.isCellRangeSelectionMode() || event.shiftKey !== true ||
        event.ctrlKey || event.metaKey || event.altKey) {
      return false;
    }
    if (event.key === 'ArrowDown') {
      rowStep = 1;
      row += 1;
    } else if (event.key === 'ArrowUp') {
      rowStep = -1;
      row -= 1;
    } else if (event.key === 'ArrowRight') {
      col += 1;
    } else if (event.key === 'ArrowLeft') {
      col -= 1;
    } else {
      return false;
    }
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    while (rowStep && row >= 0 && row < this.view.length &&
        (this.isRowGroup(this.view[row]) || this.isRowGroupFooter(this.view[row]))) {
      row += rowStep;
    }
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    if (this.isRowGroup(this.view[row]) || this.isRowGroupFooter(this.view[row])) {
      return true;
    }
    event.preventDefault();
    this.extendCellRangeSelection(row, col);
    this.scrollIntoView(row, col, { directionY: rowStep });
    return true;
  };

  FabGrid.prototype.moveCell = function(row, col) {
    var next;
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    if (this.options.editOnSelect === true) {
      next = this.findEditableCellInRow(row, col, col >= this.selection.col ? 1 : -1);
      if (next) {
        row = next.row;
        col = next.col;
      }
      this.select(row, col);
      this.scrollIntoView(row, col);
      if (this.shouldEditOnSelect(row, col)) {
        this.startEditing(row, col, { selectRow: this.options.multiSelectRows !== true });
      }
      return;
    }
    this.selectRow(row, col);
    this.scrollIntoView(row, col);
  };

  FabGrid.prototype.moveVertical = function(row, col) {
    var next;
    var direction = row > this.selection.row ? 1 : row < this.selection.row ? -1 : 0;
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    if (this.options.editOnSelect === true) {
      if (!this.isCellEditable(this.selection.row, this.selection.col)) {
        if (this.options.multiSelectRows === true) {
          this.select(row, col);
        } else {
          this.selectRow(row, col);
        }
        this.scrollIntoView(row, col, { directionY: direction });
        return;
      }
      next = this.findEditableCellInRow(row, col, 1);
      if (next) {
        this.select(next.row, next.col);
        this.scrollIntoView(next.row, next.col, { directionY: direction });
        this.startEditing(next.row, next.col, { selectRow: this.options.multiSelectRows !== true });
      }
      return;
    }
    if (this.options.multiSelectRows === true) {
      this.select(row, col);
      this.scrollIntoView(row, col, { directionY: direction });
      return;
    }
    this.selectRow(row, col);
    this.scrollIntoView(row, col, { directionY: direction });
  };

  FabGrid.prototype.movePage = function(direction) {
    var rowHeight;
    var visibleRows;
    var currentRow;
    var targetRow;
    var relativeTop;
    var targetScrollTop;
    var maxScrollTop;
    if (!this.view.length || !this.bodyScroll || !direction) {
      return;
    }
    direction = direction > 0 ? 1 : -1;
    rowHeight = Math.max(1, toNumber(this.options.rowHeight, DEFAULT_OPTIONS.rowHeight));
    visibleRows = Math.max(1, Math.floor(this.getScrollableContentHeight() / rowHeight));
    currentRow = this.selection.row;
    targetRow = clamp(currentRow + direction * visibleRows, 0, this.view.length - 1);
    relativeTop = currentRow * rowHeight - this.bodyScroll.scrollTop;
    this.moveVertical(targetRow, this.selection.col);
    if (this.selection.row !== targetRow) {
      return;
    }
    maxScrollTop = Math.max(0, this.bodyScroll.scrollHeight - this.bodyScroll.clientHeight);
    targetScrollTop = clamp(targetRow * rowHeight - relativeTop, 0, maxScrollTop);
    this.bodyScroll.scrollTop = targetScrollTop;
    this.render();
  };

  FabGrid.prototype.moveHorizontalBoundary = function(direction, row) {
    var targetCol;
    var maxScrollLeft;
    if (!this.visibleColumns.length || !this.bodyScroll || !direction) {
      return;
    }
    direction = direction > 0 ? 1 : -1;
    targetCol = direction > 0 ? this.visibleColumns.length - 1 : 0;
    this.moveCell(row, targetCol);
    if (this.selection.col !== targetCol) {
      return;
    }
    maxScrollLeft = Math.max(0, this.bodyScroll.scrollWidth - this.bodyScroll.clientWidth);
    this.bodyScroll.scrollLeft = direction > 0 ? maxScrollLeft : 0;
    this.render();
  };

  FabGrid.prototype.select = function(row, col) {
    return this.applyCellSelection(row, col, row, col);
  };

  FabGrid.prototype.selectRange = function(row, col, row2, col2) {
    if (!this.isCellRangeSelectionMode()) {
      return this.select(row2, col2);
    }
    return this.applyCellSelection(row, col, row2, col2);
  };

  FabGrid.prototype.extendCellRangeSelection = function(row, col) {
    var anchor = this.selectionAnchor || this.selection;
    if (!this.isCellRangeSelectionMode()) {
      return this.select(row, col);
    }
    return this.applyCellSelection(anchor.row, anchor.col, row, col);
  };

  FabGrid.prototype.applyCellSelection = function(anchorRow, anchorCol, row, col) {
    var nextRowSelection;
    var rowSelectionChanged;
    var args;
    var currentAnchor = this.selectionAnchor || this.selection;
    anchorRow = clamp(anchorRow, 0, Math.max(0, this.view.length - 1));
    anchorCol = clamp(anchorCol, 0, Math.max(0, this.visibleColumns.length - 1));
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    nextRowSelection = this.options.multiSelectRows === true ? null : row;
    rowSelectionChanged = this.rowSelection !== nextRowSelection;
    if (this.selection.row === row && this.selection.col === col &&
        currentAnchor.row === anchorRow && currentAnchor.col === anchorCol && !rowSelectionChanged) {
      return true;
    }
    args = this.getSelectionEventArgs(row, col, anchorRow, anchorCol);
    if (this.emit('selectionChanging', args) === false) {
      return false;
    }
    if (rowSelectionChanged && this.options.multiSelectRows !== true && this.emit('rowSelectionChanging', { row: nextRowSelection }) === false) {
      return false;
    }
    this.rowSelection = nextRowSelection;
    this.selectionAnchor = { row: anchorRow, col: anchorCol };
    this.selection = { row: row, col: col };
    this.emit('selectionChanged', args);
    if (rowSelectionChanged && this.options.multiSelectRows !== true) {
      this.emit('rowSelectionChanged', { row: nextRowSelection });
    }
    this.render();
    return true;
  };

  FabGrid.prototype.selectRow = function(row, col) {
    var item;
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = col == null ? this.selection.col : col;
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    if (this.emit('rowSelectionChanging', { row: row }) === false) {
      return;
    }
    this.rowSelection = row;
    if (this.options.multiSelectRows === true) {
      this.selectedRowMap[row] = true;
      item = this.view[row];
      if (!this.isRowGroup(item) && !this.isRowGroupFooter(item)) {
        this.setItemSelectionState(item, true);
      }
    }
    this.selection = {
      row: row,
      col: col
    };
    this.selectionAnchor = { row: row, col: col };
    this.emit('selectionChanged', this.getSelectionEventArgs(row, col, row, col));
    this.emit('rowSelectionChanged', { row: row });
    this.render();
  };

  FabGrid.prototype.toggleRowSelection = function(row, col) {
    var item;
    var groupState;
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = col == null ? this.selection.col : col;
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    if (this.options.multiSelectRows !== true) {
      this.selectRow(row, col);
      return;
    }
    item = this.view[row];
    if (this.isRowGroup(item)) {
      groupState = this.getRowGroupSelectionState(item);
      this.setItemsSelectionState(item.items || [], !groupState.checked);
    } else {
      this.setItemSelectionState(item, !this.isItemSelected(item));
    }
    this.rebuildSelectedRowMap();
    this.rowSelection = row;
    this.selection = { row: row, col: col };
    this.selectionAnchor = { row: row, col: col };
    this.emit('selectionChanged', this.getSelectionEventArgs(row, col, row, col));
    this.emit('rowSelectionChanged', { row: row });
    this.render();
  };

  FabGrid.prototype.setAllRowsSelected = function(selected) {
    this.resetSelectedItemSelection(this.options.multiSelectRows === true && selected ? (this.dataView || []).slice() : []);
    this.rebuildSelectedRowMap();
    this.emit('selectionChanged', { allRows: selected === true });
    this.render();
  };

  FabGrid.prototype.isRowSelected = function(row) {
    if (this.options.multiSelectRows === true) {
      return this.selectedRowMap[row] === true;
    }
    return this.rowSelection === row;
  };

  FabGrid.prototype.getSelectedRowCount = function() {
    var count = 0;
    var key;
    for (key in this.selectedRowMap) {
      if (Object.prototype.hasOwnProperty.call(this.selectedRowMap, key) && this.selectedRowMap[key]) {
        count += 1;
      }
    }
    return count;
  };

  FabGrid.prototype.isItemSelected = function(item) {
    if (!item) {
      return false;
    }
    if (this._selectedItemSet && isWeakSetValue(item)) {
      return this._selectedItemSet.has(item);
    }
    return this.selectedItemRefs.indexOf(item) >= 0;
  };

  FabGrid.prototype.setItemSelectionState = function(item, selected) {
    var index;
    if (!item || this.isRowGroup(item) || this.isRowGroupFooter(item)) {
      return;
    }
    index = this.selectedItemRefs.indexOf(item);
    if (selected && index < 0) {
      this.selectedItemRefs.push(item);
      if (this._selectedItemSet && isWeakSetValue(item)) {
        this._selectedItemSet.add(item);
      }
    } else if (!selected && index >= 0) {
      this.selectedItemRefs.splice(index, 1);
      if (this._selectedItemSet && isWeakSetValue(item)) {
        this._selectedItemSet.delete(item);
      }
    }
  };

  FabGrid.prototype.resetSelectedItemSelection = function(items) {
    var item;
    var i;
    items = Array.isArray(items) ? items : [];
    this.selectedItemRefs = [];
    this._selectedItemSet = typeof WeakSet === 'function' ? new WeakSet() : null;
    for (i = 0; i < items.length; i += 1) {
      item = items[i];
      if (this._selectedItemSet && isWeakSetValue(item)) {
        if (this._selectedItemSet.has(item)) {
          continue;
        }
        this._selectedItemSet.add(item);
      } else if (this.selectedItemRefs.indexOf(item) >= 0) {
        continue;
      }
      this.selectedItemRefs.push(item);
    }
  };

  FabGrid.prototype.setItemsSelectionState = function(items, selected) {
    var i;
    for (i = 0; i < items.length; i += 1) {
      this.setItemSelectionState(items[i], selected);
    }
  };

  FabGrid.prototype.getRowGroupSelectionState = function(group) {
    var items = group && Array.isArray(group.items) ? group.items : [];
    var selectedCount = 0;
    var i;
    for (i = 0; i < items.length; i += 1) {
      if (this.isItemSelected(items[i])) {
        selectedCount += 1;
      }
    }
    return {
      checked: items.length > 0 && selectedCount === items.length,
      indeterminate: selectedCount > 0 && selectedCount < items.length,
      selectedCount: selectedCount,
      totalCount: items.length
    };
  };

  FabGrid.prototype.syncSelectedItemRefsFromView = function() {
    var item;
    var i;
    if (this.options.multiSelectRows !== true) {
      return;
    }
    for (i = 0; i < this.view.length; i += 1) {
      item = this.view[i];
      if (!this.isRowGroup(item) && !this.isRowGroupFooter(item)) {
        this.setItemSelectionState(item, this.selectedRowMap[i] === true);
      }
    }
  };

  FabGrid.prototype.rebuildSelectedRowMap = function() {
    var next = {};
    var item;
    var i;
    if (this.options.multiSelectRows !== true) {
      this.selectedRowMap = next;
      return;
    }
    for (i = 0; i < this.view.length; i += 1) {
      item = this.view[i];
      if ((this.isRowGroup(item) && this.getRowGroupSelectionState(item).checked) ||
          (!this.isRowGroup(item) && !this.isRowGroupFooter(item) && this.isItemSelected(item))) {
        next[i] = true;
      }
    }
    this.selectedRowMap = next;
  };

  FabGrid.prototype.captureSelectionState = function() {
    var selectedItems = [];
    var key;
    var index;
    if (this.options.multiSelectRows === true) {
      this.syncSelectedItemRefsFromView();
      for (key in this.selectedRowMap) {
        if (Object.prototype.hasOwnProperty.call(this.selectedRowMap, key) && this.selectedRowMap[key]) {
          index = toNumber(key, -1);
          if (index >= 0 && index < this.view.length) {
            selectedItems.push(this.view[index]);
          }
        }
      }
    }
    return {
      rowSelectionItem: this.rowSelection != null ? this.view[this.rowSelection] : null,
      activeItem: this.view[this.selection.row] || null,
      anchorItem: this.view[(this.selectionAnchor || this.selection).row] || null,
      anchorCol: (this.selectionAnchor || this.selection).col,
      selectedItems: selectedItems
    };
  };

  FabGrid.prototype.restoreSelectionState = function(state) {
    var rowIndex;
    var activeIndex;
    var anchorIndex;
    var i;
    if (!state) {
      return;
    }
    if (this.options.multiSelectRows === true) {
      for (i = 0; i < state.selectedItems.length; i += 1) {
        if (!this.isRowGroup(state.selectedItems[i]) && !this.isRowGroupFooter(state.selectedItems[i])) {
          this.setItemSelectionState(state.selectedItems[i], true);
        }
      }
      this.rebuildSelectedRowMap();
    }
    rowIndex = findRowIndexByItem(this.view, state.rowSelectionItem);
    this.rowSelection = rowIndex >= 0 ? rowIndex : null;
    activeIndex = findRowIndexByItem(this.view, state.activeItem);
    if (activeIndex >= 0) {
      this.selection.row = activeIndex;
    } else if (this.rowSelection != null) {
      this.selection.row = this.rowSelection;
    }
    anchorIndex = findRowIndexByItem(this.view, state.anchorItem);
    this.selectionAnchor = {
      row: anchorIndex >= 0 ? anchorIndex : this.selection.row,
      col: state.anchorCol == null ? this.selection.col : state.anchorCol
    };
  };

  FabGrid.prototype.pruneSelectedRows = function() {
    this.syncSelectedItemRefsFromView();
    this.rebuildSelectedRowMap();
  };

  FabGrid.prototype.copySelection = function() {
    var text = this.getSelectedText();
    var args;
    if (text == null) {
      return false;
    }
    args = {
      row: this.selection.row,
      col: this.selection.col,
      text: text,
      data: text
    };
    if (this.emit('copying', args) === false) {
      return false;
    }
    if (this.emit('copyingCell', args) === false) {
      return false;
    }
    text = args.text == null ? '' : String(args.text);
    this.copyText(text);
    args.text = text;
    args.data = text;
    this.emit('copied', args);
    this.emit('copiedCell', args);
    this.emit('cellCopied', {
      row: this.selection.row,
      col: this.selection.col,
      text: text
    });
    return true;
  };

  FabGrid.prototype.getSelectedText = function() {
    var range;
    var lines;
    var values;
    var row;
    var col;
    if (!this.isCellRangeSelectionMode()) {
      return this.getCellCopyText(this.selection.row, this.selection.col);
    }
    range = this.getSelectionRange();
    lines = [];
    for (row = range.row; row <= range.row2; row += 1) {
      if (this.isRowGroup(this.view[row]) || this.isRowGroupFooter(this.view[row])) {
        continue;
      }
      values = [];
      for (col = range.col; col <= range.col2; col += 1) {
        values.push(this.getCellCopyText(row, col));
      }
      lines.push(values.join('\t'));
    }
    return lines.join('\n');
  };

  FabGrid.prototype.getCellCopyText = function(row, col) {
    var value = this.getCellData(row, col);
    var column = this.visibleColumns[col];
    var mask = getExplicitEditorMask(column);
    if (mask) {
      return getMaskCopyText(value, getMaskOptions(column, mask));
    }
    if (column && column.dataType === 'number') {
      return getNumberCopyText(value);
    }
    return value == null ? '' : String(value);
  };

  FabGrid.prototype.copyText = function(text) {
    var self = this;
    this.copyBuffer = text;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function() {
        self.copyTextWithTextarea(text);
      });
      return;
    }
    this.copyTextWithTextarea(text);
  };

  FabGrid.prototype.copyTextWithTextarea = function(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.left = '-1000px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (error) {
      this.emit('copyFailed', { error: error, text: text });
    }
    document.body.removeChild(textarea);
    this.root.focus();
  };

  FabGrid.prototype.clampSelection = function() {
    this.selection.row = clamp(this.selection.row, 0, Math.max(0, this.view.length - 1));
    this.selection.col = clamp(this.selection.col, 0, Math.max(0, this.visibleColumns ? this.visibleColumns.length - 1 : 0));
    this.selectionAnchor = this.selectionAnchor || { row: this.selection.row, col: this.selection.col };
    this.selectionAnchor.row = clamp(this.selectionAnchor.row, 0, Math.max(0, this.view.length - 1));
    this.selectionAnchor.col = clamp(this.selectionAnchor.col, 0, Math.max(0, this.visibleColumns ? this.visibleColumns.length - 1 : 0));
    if (!this.isCellRangeSelectionMode()) {
      this.selectionAnchor.row = this.selection.row;
      this.selectionAnchor.col = this.selection.col;
    }
    if (this.options.multiSelectRows !== true && this.rowSelection == null && this.view.length) {
      this.rowSelection = this.selection.row;
    }
    if (this.rowSelection != null && this.rowSelection >= this.view.length) {
      this.rowSelection = this.view.length ? this.view.length - 1 : null;
    }
  };

  FabGrid.prototype.scrollIntoView = function(row, col, options) {
    var rowTop = row * this.options.rowHeight;
    var rowBottom = rowTop + this.options.rowHeight;
    var colObj = this.visibleColumns[col];
    var contentHeight = this.getScrollableContentHeight();
    var currentTop = this.bodyScroll.scrollTop;
    var currentBottom = currentTop + contentHeight;
    var lastFullRowTop = currentBottom - this.options.rowHeight;
    var partialBottomHeight;
    var scrollableViewportWidth = Math.max(0, this.bodyScroll.clientWidth - this.getFixedLeftWidth() - this.frozenWidth - this.frozenRightWidth);
    var scrollLeft;
    if (!colObj) {
      return;
    }
    options = options || {};
    if (options.directionY > 0 && rowTop >= lastFullRowTop) {
      this.bodyScroll.scrollTop = Math.max(0, rowBottom - contentHeight);
    } else if (rowTop < currentTop) {
      this.bodyScroll.scrollTop = rowTop;
    } else if (rowBottom > currentBottom) {
      this.bodyScroll.scrollTop = rowBottom - contentHeight;
    } else if (options.directionY > 0 && contentHeight > this.options.rowHeight) {
      partialBottomHeight = currentBottom - rowBottom;
      if (partialBottomHeight > 0 && partialBottomHeight < this.options.rowHeight) {
        this.bodyScroll.scrollTop = Math.max(0, rowBottom - contentHeight);
      }
    }
    if (col >= this.frozenColumns && col < this.scrollableColumnEnd) {
      scrollLeft = this.bodyScroll.scrollLeft;
      if (colObj._left - this.frozenWidth < scrollLeft) {
        this.bodyScroll.scrollLeft = colObj._left - this.frozenWidth;
      } else if (colObj._left + colObj._width - this.frozenWidth > scrollLeft + scrollableViewportWidth) {
        this.bodyScroll.scrollLeft = colObj._left + colObj._width - this.frozenWidth - scrollableViewportWidth;
      }
    }
    this.render();
  };

  FabGrid.prototype.getAutoSizeCanvasContext = function() {
    var style;
    var font;
    if (!this._autoSizeCanvas) {
      this._autoSizeCanvas = document.createElement('canvas');
      this._autoSizeContext = this._autoSizeCanvas.getContext && this._autoSizeCanvas.getContext('2d');
    }
    if (!this._autoSizeContext) {
      return null;
    }
    style = window.getComputedStyle(this.root);
    font = style.font;
    if (!font || font === 'normal normal normal normal medium / normal serif') {
      font = [
        style.fontStyle || 'normal',
        style.fontWeight || '400',
        style.fontSize || '14px',
        style.fontFamily || 'sans-serif'
      ].join(' ');
    }
    this._autoSizeContext.font = font;
    return this._autoSizeContext;
  };

  FabGrid.prototype.measureAutoSizeText = function(text, context) {
    var normalized = String(text == null ? '' : text).replace(/\s+/g, ' ');
    var style;
    var fontSize;
    if (context && typeof context.measureText === 'function') {
      return context.measureText(normalized).width;
    }
    style = window.getComputedStyle(this.root);
    fontSize = Math.max(1, parseFloat(style.fontSize) || 14);
    return normalized.length * fontSize * 0.6;
  };

  FabGrid.prototype.getAutoSizeColumnWidth = function(column) {
    var context = this.getAutoSizeCanvasContext();
    var editorConfig = getColumnEditorConfig(column);
    var cellExtraWidth = editorConfig.type === 'color' && typeof column.formatter !== 'function' ? 35 : 15;
    var width = this.measureAutoSizeText(this.getHeaderCellText(column), context) + 35;
    var footerText;
    var item;
    var value;
    var text;
    var i;
    for (i = 0; i < this.view.length; i += 1) {
      item = this.view[i];
      if (this.isRowGroup(item)) {
        if (!column.aggregate) {
          continue;
        }
        value = this.getRowGroupAggregateValue(item, column);
        text = this.formatAggregateValue(value, column, item.items);
      } else {
        value = this.isRowGroupFooter(item) ?
          this.getRowGroupFooterValue(item, column) :
          getByBinding(item, column.binding);
        text = this.getCellDisplayText(item, column, value);
      }
      width = Math.max(width, this.measureAutoSizeText(text, context) + cellExtraWidth + this.getTreeAutoSizeExtra(item, column));
    }
    if (this.options.showFooter === true) {
      footerText = this.getFooterCellText(column);
      width = Math.max(width, this.measureAutoSizeText(footerText, context) + 21);
    }
    return Math.max(toNumber(column.minWidth, 48), Math.ceil(width));
  };

  FabGrid.prototype.autoSizeColumn = function(column) {
    var target = typeof column === 'object' ? column : this.getColumn(column);
    var previousWidth;
    var args;
    var width;
    if (!target || this.columns.indexOf(target) < 0) {
      return false;
    }
    previousWidth = target._width;
    args = {
      column: target,
      previousWidth: previousWidth,
      width: this.getAutoSizeColumnWidth(target)
    };
    if (this.emit('autoSizingColumn', args) === false) {
      return false;
    }
    width = Math.max(toNumber(target.minWidth, 48), toNumber(args.width, previousWidth));
    target._width = width;
    target.width = width;
    this.updateLayout();
    this.render();
    this.emit('autoSizedColumn', {
      column: target,
      previousWidth: previousWidth,
      width: width
    });
    return width;
  };

  FabGrid.prototype.startResize = function(event, colIndex) {
    var column = this.visibleColumns[colIndex];
    if (!column) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (event.target && event.target.setPointerCapture && event.pointerId != null) {
      event.target.setPointerCapture(event.pointerId);
    }
    this.resizeState = {
      column: column,
      startX: event.clientX,
      startWidth: column._width,
      pointerId: event.pointerId
    };
    this.bindPointerInteractionEvents();
    document.body.classList.add('fg-resizing-active');
  };

  FabGrid.prototype.handlePointerMove = function(event) {
    var state = this.resizeState;
    var width;
    if (this.updateCellRangeDrag(event)) {
      return;
    }
    if (!state) {
      this.updateColumnDrag(event);
      return;
    }
    event.preventDefault();
    width = Math.max(toNumber(state.column.minWidth, 48), state.startWidth + event.clientX - state.startX);
    if (this.emit('resizingColumn', { column: state.column, width: width }) === false) {
      return;
    }
    state.column._width = width;
    state.column.width = width;
    this.updateLayout();
    this.render();
  };

  FabGrid.prototype.handlePointerUp = function(event) {
    if (this.finishCellRangeDrag(event)) {
      this.unbindPointerInteractionEvents();
      return;
    }
    if (!this.resizeState) {
      if (this.finishColumnDrag(event)) {
        this.unbindPointerInteractionEvents();
      }
      return;
    }
    if (this.resizeState.pointerId != null && event.pointerId != null && this.resizeState.pointerId !== event.pointerId) {
      return;
    }
    this.emit('resizedColumn', { column: this.resizeState.column });
    this.suppressClick = true;
    this.resizeState = null;
    document.body.classList.remove('fg-resizing-active');
    this.unbindPointerInteractionEvents();
  };

  FabGrid.prototype.getCellData = function(row, col) {
    var item = this.view[row];
    var column = this.visibleColumns[col];
    if (this.isRowGroup(item)) {
      return undefined;
    }
    if (this.isRowGroupFooter(item)) {
      return this.getRowGroupFooterValue(item, column);
    }
    return item && column ? getByBinding(item, column.binding) : undefined;
  };

  FabGrid.prototype.setCellData = function(row, col, value) {
    var item = this.view[row];
    var column = this.visibleColumns[col];
    if (!item || !column || !isSafeBinding(column.binding) || this.isRowGroup(item) || this.isRowGroupFooter(item)) {
      return false;
    }
    this._suppressObservedItemChange += 1;
    try {
      setByBinding(item, column.binding, parseValue(getExplicitEditorMask(column) ?
        getMaskDataValue(value, getMaskOptions(column, getExplicitEditorMask(column))) :
        value, column.dataType));
    } finally {
      this._suppressObservedItemChange -= 1;
    }
    this.applyView();
    this.render();
    return true;
  };

  FabGrid.prototype.getColumn = function(value) {
    var i;
    if (typeof value === 'number') {
      return this.visibleColumns[value] || this.columns[value] || null;
    }
    for (i = 0; i < this.columns.length; i += 1) {
      if (this.columns[i].binding === value || this.columns[i].header === value || this.columns[i].name === value) {
        return this.columns[i];
      }
    }
    return null;
  };

  FabGrid.prototype.getClipString = function() {
    return this.getSelectedText();
  };

  FabGrid.prototype.setClipString = function(text) {
    return this.setCellData(this.selection.row, this.selection.col, text);
  };

  FabGrid.prototype.selectAll = function() {
    this.rowSelection = null;
    this.selection = { row: 0, col: 0 };
    this.selectionAnchor = { row: 0, col: 0 };
    this.emit('selectionChanged', Object.assign(this.getSelectionEventArgs(0, 0, 0, 0), { all: true }));
    this.render();
  };
}

function installFabGridEditorRuntime(FabGrid, context) {
  var applyMask = context.applyMask;
  var clamp = context.clamp;
  var closest = context.closest;
  var colorStateToHex = context.colorStateToHex;
  var countMaskCharactersBeforeCaret = context.countMaskCharactersBeforeCaret;
  var createColorState = context.createColorState;
  var editorDefinitions = context.editorDefinitions;
  var escapeHtml = context.escapeHtml;
  var extractMaskCharacters = context.extractMaskCharacters;
  var formatDateIso = context.formatDateIso;
  var formatDateboxEditorText = context.formatDateboxEditorText;
  var formatLocaleText = context.formatLocaleText;
  var formatMaskText = context.formatMaskText;
  var formatNumberEditorText = context.formatNumberEditorText;
  var formatYearMonthDataText = context.formatYearMonthDataText;
  var formatYearMonthEditorText = context.formatYearMonthEditorText;
  var getByBinding = context.getByBinding;
  var getColorPalette = context.getColorPalette;
  var getColorShowAlpha = context.getColorShowAlpha;
  var getColumnEditorConfig = context.getColumnEditorConfig;
  var getComboboxData = context.getComboboxData;
  var getComboboxDataValue = context.getComboboxDataValue;
  var getComboboxItemText = context.getComboboxItemText;
  var getComboboxItemValue = context.getComboboxItemValue;
  var getComboboxTextByValue = context.getComboboxTextByValue;
  var getDateboxDataValue = context.getDateboxDataValue;
  var getEditorIconConfigWidth = context.getEditorIconConfigWidth;
  var getEditorIconConfigs = context.getEditorIconConfigs;
  var getEditorMask = context.getEditorMask;
  var getExplicitEditorMask = context.getExplicitEditorMask;
  var getMaskCaretPosition = context.getMaskCaretPosition;
  var getMaskCopyText = context.getMaskCopyText;
  var getMaskDataValue = context.getMaskDataValue;
  var getMaskOptions = context.getMaskOptions;
  var getNumberCopyText = context.getNumberCopyText;
  var getNumberPrecision = context.getNumberPrecision;
  var getValidationRowId = context.getValidationRowId;
  var hasClass = context.hasClass;
  var hsvToRgb = context.hsvToRgb;
  var isColorValueValid = context.isColorValueValid;
  var isComboboxValueInList = context.isComboboxValueInList;
  var isDateLikeEditorType = context.isDateLikeEditorType;
  var isDigitKey = context.isDigitKey;
  var isNumberEditorTextAllowed = context.isNumberEditorTextAllowed;
  var isPromiseLike = context.isPromiseLike;
  var isSafeBinding = context.isSafeBinding;
  var isYearMonthDateboxConfig = context.isYearMonthDateboxConfig;
  var isYearMonthDateboxTarget = context.isYearMonthDateboxTarget;
  var mergeOptions = context.mergeOptions;
  var normalizeClassName = context.normalizeClassName;
  var normalizeColorValue = context.normalizeColorValue;
  var normalizeTextAlign = context.normalizeTextAlign;
  var normalizeValidationResult = context.normalizeValidationResult;
  var parseColorValue = context.parseColorValue;
  var parseDateValue = context.parseDateValue;
  var parseDateboxEditorValue = context.parseDateboxEditorValue;
  var parseValue = context.parseValue;
  var parseYearMonthValue = context.parseYearMonthValue;
  var renderComboboxOptionContent = context.renderComboboxOptionContent;
  var roundNumberValue = context.roundNumberValue;
  var sanitizeDateEditorText = context.sanitizeDateEditorText;
  var sanitizeNumberEditorText = context.sanitizeNumberEditorText;
  var setByBinding = context.setByBinding;
  var shouldUseThousandsSeparator = context.shouldUseThousandsSeparator;
  var toNumber = context.toNumber;
  var trimText = context.trimText;

  FabGrid.prototype.startEditing = function(row, col, options) {
    var column = this.visibleColumns[col];
    var item = this.view[row];
    var args;
    var value;
    var shouldSelectRow = !options || options.selectRow !== false;
    if (!this.isCellEditable(row, col) || !item) {
      return false;
    }
    args = { row: row, col: col, column: column, item: item };
    if (this.emit('beginningEdit', args) === false) {
      return false;
    }
    if (this.emit('cellEditStarting', args) === false) {
      return false;
    }
    value = getByBinding(item, column.binding);
    if (shouldSelectRow) {
      this.rowSelection = row;
      if (this.options.multiSelectRows === true) {
        this.selectedRowMap[row] = true;
        this.setItemSelectionState(item, true);
      }
    }
    this.selection = { row: row, col: col };
    this.editorConfig = getColumnEditorConfig(column);
    this.editing = { row: row, col: col, item: item, original: value, editor: this.editorConfig };
    this.configureEditor(column);
    this.editor.value = this.getEditorText(value, column);
    if (this.editorConfig.type === 'combobox') {
      this.editing.comboboxValue = value;
    }
    if (this.editorConfig.type === 'color') {
      this.syncColorEditorAppearance();
    }
    this.editor.style.textAlign = normalizeTextAlign(column.align);
    this.editor.style.display = 'block';
    this.render();
    this.positionEditor();
    this.editor.focus();
    this.editor.select();
    return true;
  };

  FabGrid.prototype.configureEditor = function(column) {
    var config = getColumnEditorConfig(column);
    var type = config.type;
    var definition = editorDefinitions[type] || null;
    var editorClassName = definition && definition.className ? definition.className : 'textbox-f fg-editor-' + type + ' ' + type + '-f';
    var hasBuiltInEditorIcon = isDateLikeEditorType(type) || type === 'combobox' || type === 'color';
    var iconConfigs = hasBuiltInEditorIcon ? [] : getEditorIconConfigs(config);
    var hasEditorIcons = hasBuiltInEditorIcon || iconConfigs.length > 0;
    this.editorConfig = config;
    this.editorIconConfigs = iconConfigs;
    this.renderEditorIcons(type, iconConfigs);
    this.editor.className = 'fg-editor ' + editorClassName + (hasEditorIcons ? ' fg-editor-with-icons' : '');
    this.editor.setAttribute('data-editor-type', type);
    this.editor.setAttribute('autocomplete', 'off');
    this.editor.type = 'text';
    this.editor.inputMode = definition && definition.inputMode ? definition.inputMode : (isDateLikeEditorType(type) ? 'numeric' : 'text');
    this.editor.style.paddingRight = hasEditorIcons ? (getEditorIconConfigWidth(iconConfigs, type) + 6) + 'px' : '';
    this.editorIconHost.style.display = hasEditorIcons ? 'flex' : 'none';
    if (!isDateLikeEditorType(type)) {
      this.hideDateboxPanel();
    }
    if (type !== 'combobox') {
      this.hideComboboxPanel();
    }
    if (type !== 'color') {
      this.hideColorPanel();
    }
  };

  FabGrid.prototype.renderEditorIcons = function(type, iconConfigs) {
    var fragment = document.createDocumentFragment();
    var button;
    var icon;
    var i;
    this.editorIconHost.innerHTML = '';
    if (iconConfigs && iconConfigs.length) {
      for (i = 0; i < iconConfigs.length; i += 1) {
        icon = iconConfigs[i];
        button = document.createElement('button');
        button.type = 'button';
        button.className = trimText('fg-editor-trigger fg-editor-trigger-custom ' + normalizeClassName(icon.iconCls || icon.className || icon.iconClass || icon.icon || ''));
        button.setAttribute('data-icon-index', i);
        button.setAttribute('aria-label', icon.ariaLabel || icon.label || icon.title || this.getText('aria.cellEditor'));
        button.title = icon.title || '';
        button.textContent = icon.text || '';
        button.style.width = Math.max(18, toNumber(icon.width, 22)) + 'px';
        fragment.appendChild(button);
      }
    } else {
      button = document.createElement('button');
      button.type = 'button';
      button.className = trimText('fg-editor-trigger fg-editor-trigger-' + type + (isDateLikeEditorType(type) ? ' icon-datebox' : ''));
      button.setAttribute('aria-label', this.getEditorTriggerLabel());
      button.style.width = '22px';
      fragment.appendChild(button);
    }
    this.editorIconHost.appendChild(fragment);
    this.editorTrigger = this.editorIconHost.querySelector('.fg-editor-trigger');
  };

  FabGrid.prototype.getEditorText = function(value, column) {
    var config = getColumnEditorConfig(column);
    var mask = getExplicitEditorMask(column);
    if (value == null) {
      return '';
    }
    if (mask) {
      return formatMaskText(value, getMaskOptions(column, mask));
    }
    if (config.type === 'numberbox') {
      return formatNumberEditorText(value, shouldUseThousandsSeparator(column), getNumberPrecision(column));
    }
    if (config.type === 'datebox') {
      return formatDateboxEditorText(value, config, column);
    }
    if (config.type === 'combobox') {
      return getComboboxTextByValue(value, config);
    }
    if (config.type === 'color') {
      return parseColorValue(value);
    }
    return String(value);
  };

  FabGrid.prototype.shouldBlockEditorKey = function(event) {
    var edit = this.editing;
    var column;
    var config;
    var key;
    if (!edit || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) {
      return false;
    }
    key = event.key || '';
    if (key.length !== 1) {
      return false;
    }
    column = this.visibleColumns[edit.col];
    if (!column) {
      return false;
    }
    config = getColumnEditorConfig(column);
    if (isDateLikeEditorType(config.type)) {
      if (editorDefinitions[config.type] && typeof editorDefinitions[config.type].isTextAllowed === 'function') {
        return !editorDefinitions[config.type].isTextAllowed(this.editor, key, config.options || {});
      }
      return !isDigitKey(key);
    }
    if (config.type === 'numberbox') {
      return !isNumberEditorTextAllowed(this.editor, key);
    }
    return false;
  };

  FabGrid.prototype.handleMaskedEditorDelete = function(event) {
    var edit = this.editing;
    var column;
    var mask;
    var raw;
    var start;
    var end;
    var deleteStart;
    var deleteEnd;
    var nextRaw;
    var nextText;
    var nextCaret;
    if (!edit || (event.key !== 'Backspace' && event.key !== 'Delete')) {
      return false;
    }
    column = this.visibleColumns[edit.col];
    mask = getEditorMask(column);
    if (!column || !mask) {
      return false;
    }
    var dateDefinition = editorDefinitions[getColumnEditorConfig(column).type];
    if (isDateLikeEditorType(getColumnEditorConfig(column).type) && dateDefinition && typeof dateDefinition.handleDelete === 'function') {
      event.preventDefault();
      dateDefinition.handleDelete(this.editor, event.key, mergeOptions(getColumnEditorConfig(column).options || {}, { mask: mask }));
      return true;
    }
    event.preventDefault();
    start = this.editor.selectionStart == null ? this.editor.value.length : this.editor.selectionStart;
    end = this.editor.selectionEnd == null ? start : this.editor.selectionEnd;
    raw = extractMaskCharacters(this.editor.value, mask);
    deleteStart = countMaskCharactersBeforeCaret(this.editor.value, mask, start);
    deleteEnd = countMaskCharactersBeforeCaret(this.editor.value, mask, end);
    if (start === end) {
      if (event.key === 'Backspace') {
        if (deleteStart <= 0) {
          return true;
        }
        deleteStart -= 1;
      } else if (deleteStart >= raw.length) {
        return true;
      } else {
        deleteEnd += 1;
      }
    }
    nextRaw = raw.slice(0, deleteStart) + raw.slice(deleteEnd);
    nextText = applyMask(nextRaw, mask);
    nextCaret = getMaskCaretPosition(nextText, mask, deleteStart);
    this.editor.value = nextText;
    this.editor.setSelectionRange(nextCaret, nextCaret);
    return true;
  };

  FabGrid.prototype.handleEditorBeforeInput = function(event) {
    var edit = this.editing;
    var column;
    var config;
    var text;
    if (!edit || event.isComposing || event.data == null) {
      return;
    }
    column = this.visibleColumns[edit.col];
    if (!column) {
      return;
    }
    config = getColumnEditorConfig(column);
    text = String(event.data);
    if (isDateLikeEditorType(config.type) && /[^0-9]/.test(text)) {
      event.preventDefault();
      return;
    }
    if (config.type === 'numberbox' && !isNumberEditorTextAllowed(this.editor, text)) {
      event.preventDefault();
    }
  };

  FabGrid.prototype.handleEditorInput = function() {
    var edit = this.editing;
    var column;
    var config;
    var formatted;
    var mask;
    if (!edit) {
      return;
    }
    column = this.visibleColumns[edit.col];
    config = column ? getColumnEditorConfig(column) : null;
    mask = getEditorMask(column);
    if (mask) {
      formatted = formatMaskText(this.editor.value, { mask: mask });
      if (formatted !== this.editor.value) {
        this.editor.value = formatted;
        this.editor.setSelectionRange(formatted.length, formatted.length);
      }
      if (config && isDateLikeEditorType(config.type)) {
        this.syncDateboxPanelToEditor();
      }
      return;
    }
    if (!column || !config) {
      return;
    }
    if (config.type === 'color') {
      this.syncColorEditorAppearance();
      if (this.isColorPanelOpen() && normalizeColorValue(this.editor.value)) {
        this.colorState = createColorState(this.editor.value);
        this.renderColorPanel();
        this.positionEditor();
      }
      return;
    }
    if (config.type === 'datebox') {
      formatted = sanitizeDateEditorText(this.editor.value);
      if (formatted !== this.editor.value) {
        this.editor.value = formatted;
        this.editor.setSelectionRange(formatted.length, formatted.length);
      }
      this.syncDateboxPanelToEditor();
      return;
    }
    if (config.type === 'combobox') {
      if (this.editing) {
        this.editing.comboboxValue = null;
      }
      if (this.isComboboxPanelOpen()) {
        this.renderComboboxPanel(false);
        this.setComboboxActiveIndex(this.getComboboxInitialActiveIndex());
        this.positionEditor();
      }
      return;
    }
    if (config.type === 'numberbox') {
      formatted = formatNumberEditorText(sanitizeNumberEditorText(this.editor.value), shouldUseThousandsSeparator(column));
      if (formatted !== this.editor.value) {
        this.editor.value = formatted;
        this.editor.setSelectionRange(formatted.length, formatted.length);
      }
    }
  };

  FabGrid.prototype.handleEditorCopy = function(event) {
    var edit = this.editing;
    var column;
    var start;
    var end;
    var next;
    var text;
    var clipboardData;
    if (!edit) {
      return;
    }
    column = this.visibleColumns[edit.col];
    if (column && getColumnEditorConfig(column).type === 'numberbox') {
      start = this.editor.selectionStart;
      end = this.editor.selectionEnd;
      if (start == null || end == null || start === end) {
        return;
      }
      if (start > end) {
        next = start;
        start = end;
        end = next;
      }
      text = getNumberCopyText(this.editor.value.slice(start, end));
      clipboardData = event.clipboardData || window.clipboardData;
      if (!clipboardData || !clipboardData.setData) {
        return;
      }
      clipboardData.setData('text/plain', text);
      this.copyBuffer = text;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (!column || !getExplicitEditorMask(column)) {
      return;
    }
    start = this.editor.selectionStart;
    end = this.editor.selectionEnd;
    if (start == null || end == null || start === end) {
      return;
    }
    if (start > end) {
      next = start;
      start = end;
      end = next;
    }
    text = getMaskCopyText(this.editor.value.slice(start, end), getMaskOptions(column, getExplicitEditorMask(column)));
    clipboardData = event.clipboardData || window.clipboardData;
    if (!clipboardData || !clipboardData.setData) {
      return;
    }
    clipboardData.setData('text/plain', text);
    this.copyBuffer = text;
    event.preventDefault();
    event.stopPropagation();
  };

  FabGrid.prototype.handleEditorTriggerClick = function(event) {
    var button = closest(event.target, 'fg-editor-trigger');
    var iconConfig;
    var iconIndex;
    var handler;
    var result;
    if (!button) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (!this.editing || !this.editorConfig) {
      return;
    }
    iconIndex = button.hasAttribute('data-icon-index') ? toNumber(button.getAttribute('data-icon-index'), -1) : -1;
    if (iconIndex >= 0) {
      iconConfig = this.editorIconConfigs[iconIndex];
      handler = iconConfig && (iconConfig.onClick || iconConfig.click || iconConfig.handler);
      if (typeof handler === 'function') {
        result = handler.call(this, this.createEditorButtonArgs(event, button, iconConfig, iconIndex));
      }
      if (result !== false && (!iconConfig || iconConfig.keepFocus !== false)) {
        this.editor.focus();
      }
      return;
    }
    if (isDateLikeEditorType(this.editorConfig.type)) {
      if (this.dateboxPanel.style.display === 'block') {
        this.hideDateboxPanel();
      } else {
        this.showDateboxPanel();
      }
      this.editor.focus();
      return;
    }
    if (this.editorConfig.type === 'combobox') {
      if (this.comboboxPanel.style.display === 'block') {
        this.hideComboboxPanel();
      } else {
        this.showComboboxPanel(true);
      }
      this.editor.focus();
      return;
    }
    if (this.editorConfig.type === 'color') {
      if (this.isColorPanelOpen()) {
        this.hideColorPanel();
      } else {
        this.showColorPanel();
      }
      this.editor.focus();
    }
  };

  FabGrid.prototype.createEditorButtonArgs = function(event, button, iconConfig, iconIndex) {
    var edit = this.editing || {};
    var column = this.visibleColumns[edit.col] || null;
    var item = this.view[edit.row] || null;
    return {
      grid: this,
      row: edit.row,
      col: edit.col,
      column: column,
      item: item,
      value: this.getEditorValue(),
      text: this.editor ? this.editor.value : '',
      original: edit.original,
      editor: this.editor,
      button: button || this.editorTrigger,
      icon: iconConfig || null,
      iconIndex: iconIndex == null ? -1 : iconIndex,
      icons: this.editorIconConfigs || [],
      event: event
    };
  };

  FabGrid.prototype.handleDateboxClick = function(event) {
    var day = closest(event.target, 'fg-datebox-day');
    var monthButton = closest(event.target, 'fg-datebox-month');
    var control = closest(event.target, 'fg-datebox-control');
    var target = this.dateboxTarget;
    var action;
    var date;
    var month;
    if (!target || !target.input || !target.config || !isDateLikeEditorType(target.config.type)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (monthButton) {
      month = toNumber(monthButton.getAttribute('data-month'), this.dateboxState ? this.dateboxState.month : 0);
      if (isYearMonthDateboxTarget(target)) {
        this.applyDateboxTargetDate(new Date(this.dateboxState ? this.dateboxState.year : new Date().getFullYear(), clamp(month, 0, 11), 1));
        return;
      }
      this.dateboxState = {
        year: this.dateboxState ? this.dateboxState.year : new Date().getFullYear(),
        month: clamp(month, 0, 11),
        selected: this.dateboxState ? this.dateboxState.selected : null,
        mode: 'calendar'
      };
      this.renderDateboxPanel();
      return;
    }
    if (day && !hasClass(day, 'fg-datebox-disabled')) {
      date = parseDateValue(day.getAttribute('data-date'));
      if (date) {
        this.applyDateboxTargetDate(date);
      }
      return;
    }
    if (!control) {
      return;
    }
    action = control.getAttribute('data-action');
    if (action === 'months') {
      this.dateboxState.mode = 'months';
      this.renderDateboxPanel();
      return;
    }
    if (action === 'close') {
      this.hideDateboxPanel();
      target.input.focus();
      return;
    }
    if (action === 'today') {
      date = new Date();
      this.dateboxState = {
        year: date.getFullYear(),
        month: date.getMonth(),
        selected: date,
        mode: 'calendar'
      };
      this.renderDateboxPanel();
      this.applyDateboxTargetDate(date);
      return;
    }
    this.moveDateboxMonth(action);
  };

  FabGrid.prototype.handleDateboxChange = function(event) {
    var input = closest(event.target, 'fg-datebox-year-input');
    var target = this.dateboxTarget;
    var year;
    if (!input || !target || !target.config || !isDateLikeEditorType(target.config.type)) {
      return;
    }
    year = clamp(toNumber(input.value, this.dateboxState ? this.dateboxState.year : new Date().getFullYear()), 1, 9999);
    this.dateboxState = this.dateboxState || {
      year: year,
      month: new Date().getMonth(),
      selected: null,
      mode: 'months'
    };
    this.dateboxState.year = year;
    this.dateboxState.mode = 'months';
    this.renderDateboxPanel();
  };

  FabGrid.prototype.handleDocumentMouseDown = function(event) {
    var filterMenuItem;
    if (this.isTopLeftMenuOpen() && !closest(event.target, 'fg-top-left-menu')) {
      this.hideTopLeftMenu();
    }
    filterMenuItem = closest(event.target, 'fg-filter-menu-item') || this.getFilterMenuItemAtEvent(event);
    if (filterMenuItem) {
      this.handleFilterMenuClick(event);
    }
    if (this.filterMenu && this.filterMenu.style.display === 'block' &&
      !closest(event.target, 'fg-filter-menu') &&
      !closest(event.target, 'fg-filter-icon')) {
      this.hideFilterMenu();
    }
    if (this.isColumnChooserOpen() &&
      !closest(event.target, 'fg-column-chooser') &&
      !closest(event.target, 'fg-column-chooser-trigger')) {
      this.hideColumnChooser();
    }
    if (this.dateboxPanel && this.dateboxPanel.style.display === 'block' &&
      !(
        (this.dateboxTarget && event.target === this.dateboxTarget.input) ||
        event.target === this.editor ||
        closest(event.target, 'fg-editor-icons') ||
        closest(event.target, 'fg-header-search-icons') ||
        closest(event.target, 'fg-datebox-panel')
      )) {
      this.hideDateboxPanel();
    }
    if (this.comboboxPanel && this.comboboxPanel.style.display === 'block' &&
      !(
        (this.comboboxTarget && event.target === this.comboboxTarget.input) ||
        event.target === this.editor ||
        closest(event.target, 'fg-editor-icons') ||
        closest(event.target, 'fg-header-search-icons') ||
        closest(event.target, 'fg-combobox-panel')
      )) {
      this.hideComboboxPanel();
    }
    if (this.isColorPanelOpen() &&
      !(
        (this.colorTarget && event.target === this.colorTarget.input) ||
        event.target === this.editor ||
        closest(event.target, 'fg-editor-icons') ||
        closest(event.target, 'fg-header-search-icons') ||
        closest(event.target, 'fg-color-panel')
      )) {
      this.hideColorPanel();
    }
    if (!this.editing) {
      return;
    }
  };

  FabGrid.prototype.handleComboboxKeyDown = function(event) {
    if (!this.editorConfig || this.editorConfig.type !== 'combobox') {
      return false;
    }
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      this.showComboboxPanel(true);
      return true;
    }
    if (!this.isComboboxPanelOpen()) {
      return false;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.setComboboxActiveIndex(this.comboboxActiveIndex + 1);
      return true;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.setComboboxActiveIndex(this.comboboxActiveIndex - 1);
      return true;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.selectComboboxActiveOption();
      return true;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.hideComboboxPanel();
      return true;
    }
    return false;
  };

  FabGrid.prototype.handleColorKeyDown = function(event) {
    if (!this.editorConfig || this.editorConfig.type !== 'color') {
      return false;
    }
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      this.showColorPanel();
      return true;
    }
    if (event.key === 'Escape' && this.isColorPanelOpen()) {
      event.preventDefault();
      this.hideColorPanel();
      this.editor.focus();
      return true;
    }
    return false;
  };

  FabGrid.prototype.shouldEditOnSelect = function(row, col) {
    return this.options.editOnSelect === true && this.isCellEditable(row, col);
  };

  FabGrid.prototype.isCellEditable = function(row, col) {
    var column = this.visibleColumns[col];
    return this.options.allowEditing !== false &&
      row >= 0 &&
      row < this.view.length &&
      !this.isRowGroup(this.view[row]) &&
      !this.isRowGroupFooter(this.view[row]) &&
      !!column &&
      column.readOnly !== true;
  };

  FabGrid.prototype.commitEditingAndMoveRight = function() {
    var edit = this.editing;
    var next;
    if (!edit) {
      return false;
    }
    next = this.findNextEditableCell(edit.row, edit.col + 1);
    if (this.finishEditing(true) === false) {
      return false;
    }
    if (next) {
      this.select(next.row, next.col);
      this.scrollIntoView(next.row, next.col);
      this.startEditing(next.row, next.col, { selectRow: this.options.multiSelectRows !== true });
    }
    return true;
  };

  FabGrid.prototype.commitEditingAndMoveLeft = function() {
    var edit = this.editing;
    var next;
    if (!edit) {
      return false;
    }
    next = this.findPreviousEditableCell(edit.row, edit.col - 1);
    if (this.finishEditing(true) === false) {
      return false;
    }
    if (next) {
      this.select(next.row, next.col);
      this.scrollIntoView(next.row, next.col);
      this.startEditing(next.row, next.col, { selectRow: this.options.multiSelectRows !== true });
    }
    return true;
  };

  FabGrid.prototype.commitEditingAndMoveVertical = function(direction) {
    var edit = this.editing;
    var next;
    if (!edit) {
      return false;
    }
    next = this.findEditableCellInRow(edit.row + direction, edit.col, direction >= 0 ? 1 : -1);
    if (this.finishEditing(true) === false) {
      return false;
    }
    if (next) {
      this.select(next.row, next.col);
      this.scrollIntoView(next.row, next.col, { directionY: direction });
      this.startEditing(next.row, next.col, { selectRow: this.options.multiSelectRows !== true });
    }
    return true;
  };

  FabGrid.prototype.findNextEditableCell = function(row, col) {
    var r;
    var c;
    for (r = row; r < this.view.length; r += 1) {
      for (c = r === row ? col : 0; c < this.visibleColumns.length; c += 1) {
        if (this.isCellEditable(r, c)) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  };

  FabGrid.prototype.findPreviousEditableCell = function(row, col) {
    var r;
    var c;
    for (r = row; r >= 0; r -= 1) {
      for (c = r === row ? col : this.visibleColumns.length - 1; c >= 0; c -= 1) {
        if (this.isCellEditable(r, c)) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  };

  FabGrid.prototype.findEditableCellInRow = function(row, col, direction) {
    var c;
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    if (this.isCellEditable(row, col)) {
      return { row: row, col: col };
    }
    direction = direction < 0 ? -1 : 1;
    for (c = col + direction; c >= 0 && c < this.visibleColumns.length; c += direction) {
      if (this.isCellEditable(row, c)) {
        return { row: row, col: c };
      }
    }
    for (c = col - direction; c >= 0 && c < this.visibleColumns.length; c -= direction) {
      if (this.isCellEditable(row, c)) {
        return { row: row, col: c };
      }
    }
    return null;
  };

  FabGrid.prototype.positionEditor = function() {
    var edit = this.editing;
    var column;
    var cell;
    var cellRect;
    var bodyRect;
    var left;
    var top;
    var width;
    var height;
    var isScrollableEditor;
    if (!edit) {
      return;
    }
    column = this.visibleColumns[edit.col];
    if (!column) {
      return;
    }
    cell = this.root.querySelector('.fg-cell[data-row="' + edit.row + '"][data-col="' + edit.col + '"]');
    if (cell) {
      cellRect = cell.getBoundingClientRect();
      bodyRect = this.body.getBoundingClientRect();
      left = cellRect.left - bodyRect.left;
      top = cellRect.top - bodyRect.top;
      width = cellRect.width;
      height = cellRect.height;
    } else if (edit.col < this.frozenColumns) {
      left = this.getFixedLeftWidth() + column._left;
      top = edit.row * this.options.rowHeight - this.bodyScroll.scrollTop;
      width = column._width;
      height = this.options.rowHeight;
    } else if (edit.col >= this.scrollableColumnEnd) {
      left = this.bodyScroll.clientWidth - this.frozenRightWidth + column._left - this.frozenRightStartLeft;
      top = edit.row * this.options.rowHeight - this.bodyScroll.scrollTop;
      width = column._width;
      height = this.options.rowHeight;
    } else {
      left = this.getFixedLeftWidth() + column._left - this.bodyScroll.scrollLeft;
      top = edit.row * this.options.rowHeight - this.bodyScroll.scrollTop;
      width = column._width;
      height = this.options.rowHeight;
    }
    this.editor.style.left = left + 'px';
    this.editor.style.top = top + 'px';
    this.editor.style.width = width + 'px';
    this.editor.style.height = height + 'px';
    isScrollableEditor = edit.col >= this.frozenColumns && edit.col < this.scrollableColumnEnd;
    this.editor.style.zIndex = isScrollableEditor ? '3' : '10';
    this.editorIconHost.style.zIndex = isScrollableEditor ? '3' : '11';
    if (this.editorConfig && (isDateLikeEditorType(this.editorConfig.type) || this.editorConfig.type === 'combobox' || this.editorConfig.type === 'color' || (this.editorIconConfigs && this.editorIconConfigs.length))) {
      this.editorIconHost.style.left = (left + width - this.getEditorIconHostWidth() - 2) + 'px';
      this.editorIconHost.style.top = top + 'px';
      this.editorIconHost.style.height = height + 'px';
    }
    if (this.editorConfig && isDateLikeEditorType(this.editorConfig.type)) {
      this.positionDateboxPanel(left, top + height, width);
    }
    if (this.editorConfig && this.editorConfig.type === 'combobox') {
      this.positionComboboxPanel(left, top + height, width);
    }
    if (this.editorConfig && this.editorConfig.type === 'color') {
      this.positionColorPanel(left, top + height);
    }
  };

  FabGrid.prototype.showDateboxPanel = function() {
    if (!this.editing || !this.editorConfig || !isDateLikeEditorType(this.editorConfig.type)) {
      return;
    }
    this.dateboxTarget = {
      type: 'editor',
      input: this.editor,
      column: this.visibleColumns[this.editing.col],
      config: this.editorConfig
    };
    this.hideColorPanel();
    this.syncDateboxPanelToEditor();
    this.renderDateboxPanel();
    this.dateboxPanel.style.display = 'block';
    this.positionEditor();
  };

  FabGrid.prototype.showHeaderSearchDateboxPanel = function(input, column) {
    var config = getColumnEditorConfig(column);
    if (!input || !column || !config || !isDateLikeEditorType(config.type)) {
      return;
    }
    this.dateboxTarget = {
      type: 'search',
      input: input,
      column: column,
      config: config
    };
    this.hideComboboxPanel();
    this.hideColorPanel();
    this.syncDateboxPanelToTarget(this.dateboxTarget);
    this.renderDateboxPanel();
    this.dateboxPanel.style.display = 'block';
    this.positionHeaderSearchDateboxPanel(input);
    input.focus();
  };

  FabGrid.prototype.showComboboxPanel = function(showAll) {
    if (!this.editing || !this.editorConfig || this.editorConfig.type !== 'combobox') {
      return;
    }
    this.comboboxTarget = {
      type: 'editor',
      input: this.editor,
      column: this.visibleColumns[this.editing.col],
      config: this.editorConfig
    };
    this.hideDateboxPanel();
    this.hideColorPanel();
    this.renderComboboxPanel(showAll === true);
    this.comboboxPanel.style.display = 'block';
    this.setComboboxActiveIndex(this.getComboboxInitialActiveIndex());
    this.positionEditor();
  };

  FabGrid.prototype.showHeaderSearchComboboxPanel = function(input, column, showAll) {
    var config = getColumnEditorConfig(column);
    if (!input || !column || !config || config.type !== 'combobox') {
      return;
    }
    this.comboboxTarget = {
      type: 'search',
      input: input,
      column: column,
      config: config
    };
    this.hideDateboxPanel();
    this.hideColorPanel();
    this.renderComboboxPanel(showAll === true);
    this.comboboxPanel.style.display = 'block';
    this.setComboboxActiveIndex(this.getComboboxInitialActiveIndex());
    this.positionHeaderSearchComboboxPanel(input);
    input.focus();
  };

  FabGrid.prototype.hideDateboxPanel = function() {
    if (this.dateboxPanel) {
      this.dateboxPanel.style.display = 'none';
    }
    this.dateboxTarget = null;
  };

  FabGrid.prototype.hideComboboxPanel = function() {
    if (this.comboboxPanel) {
      this.comboboxPanel.style.display = 'none';
    }
    this.comboboxTarget = null;
    this.comboboxActiveIndex = -1;
  };

  FabGrid.prototype.getEditorIconHostWidth = function() {
    if (!this.editorIconHost || this.editorIconHost.style.display === 'none') {
      return 0;
    }
    return Math.max(18, Math.ceil(this.editorIconHost.offsetWidth || 0));
  };

  FabGrid.prototype.isDateboxPanelOpen = function() {
    return !!this.dateboxPanel && this.dateboxPanel.style.display === 'block';
  };

  FabGrid.prototype.positionHeaderSearchDateboxPanel = function(input) {
    var inputRect;
    var bodyRect;
    var left;
    var top;
    if (!input || !this.body) {
      return;
    }
    inputRect = input.getBoundingClientRect();
    bodyRect = this.body.getBoundingClientRect();
    left = inputRect.left - bodyRect.left;
    top = inputRect.bottom - bodyRect.top;
    this.positionDateboxPanel(left, top, inputRect.width);
  };

  FabGrid.prototype.positionHeaderSearchComboboxPanel = function(input) {
    var inputRect;
    var bodyRect;
    var left;
    var top;
    if (!input || !this.body) {
      return;
    }
    inputRect = input.getBoundingClientRect();
    bodyRect = this.body.getBoundingClientRect();
    left = inputRect.left - bodyRect.left;
    top = inputRect.bottom - bodyRect.top;
    this.positionComboboxPanel(left, top, inputRect.width);
  };

  FabGrid.prototype.positionHeaderSearchColorPanel = function(input) {
    var inputRect;
    var bodyRect;
    var left;
    var top;
    if (!input || !this.body) {
      return;
    }
    inputRect = input.getBoundingClientRect();
    bodyRect = this.body.getBoundingClientRect();
    left = inputRect.left - bodyRect.left;
    top = inputRect.bottom - bodyRect.top;
    this.positionColorPanel(left, top);
  };

  FabGrid.prototype.isComboboxPanelOpen = function() {
    return !!this.comboboxPanel && this.comboboxPanel.style.display === 'block';
  };

  FabGrid.prototype.getColorTarget = function() {
    if (this.colorTarget) {
      return this.colorTarget;
    }
    if (!this.editing || !this.editorConfig || this.editorConfig.type !== 'color') {
      return null;
    }
    return {
      type: 'editor',
      input: this.editor,
      column: this.visibleColumns[this.editing.col],
      config: this.editorConfig
    };
  };

  FabGrid.prototype.getColorPanelConfig = function() {
    var target = this.getColorTarget();
    return target && target.config ? target.config : this.editorConfig;
  };

  FabGrid.prototype.showColorPanel = function() {
    if (!this.editing || !this.editorConfig || this.editorConfig.type !== 'color') {
      return;
    }
    this.colorTarget = {
      type: 'editor',
      input: this.editor,
      column: this.visibleColumns[this.editing.col],
      config: this.editorConfig
    };
    this.hideDateboxPanel();
    this.hideComboboxPanel();
    this.colorState = createColorState(this.editor.value || this.editing.original);
    this.renderColorPanel();
    this.colorPanel.style.display = 'flex';
    this.positionEditor();
  };

  FabGrid.prototype.showHeaderSearchColorPanel = function(input, column) {
    var config = getColumnEditorConfig(column);
    if (!input || !column || !config || config.type !== 'color') {
      return;
    }
    this.colorTarget = {
      type: 'search',
      input: input,
      column: column,
      config: config
    };
    this.hideDateboxPanel();
    this.hideComboboxPanel();
    this.colorState = createColorState(input.value || '#ff0000');
    this.renderColorPanel();
    this.colorPanel.style.display = 'flex';
    this.positionHeaderSearchColorPanel(input);
    input.focus();
  };

  FabGrid.prototype.hideColorPanel = function() {
    if (this.colorPanel) {
      this.colorPanel.style.display = 'none';
    }
    this.colorDragState = null;
    this.colorTarget = null;
  };

  FabGrid.prototype.isColorPanelOpen = function() {
    return !!this.colorPanel && this.colorPanel.style.display === 'flex';
  };

  FabGrid.prototype.renderColorPanel = function() {
    var config = this.getColorPanelConfig();
    var palette = getColorPalette(config);
    var paletteElement = document.createElement('div');
    var controls = document.createElement('div');
    var sv = document.createElement('div');
    var svMarker = document.createElement('span');
    var hue = document.createElement('div');
    var hueMarker = document.createElement('span');
    var alpha = document.createElement('div');
    var alphaFill = document.createElement('span');
    var alphaMarker = document.createElement('span');
    var swatch;
    var color;
    var i;
    this.colorPanel.innerHTML = '';
    paletteElement.className = 'fg-color-palette';
    for (i = 0; i < palette.length; i += 1) {
      color = normalizeColorValue(palette[i]);
      if (!color) {
        continue;
      }
      swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'fg-color-palette-swatch';
      swatch.setAttribute('data-color', color);
      swatch.setAttribute('aria-label', color);
      swatch.title = color;
      swatch.style.backgroundColor = color;
      paletteElement.appendChild(swatch);
    }

    controls.className = 'fg-color-controls';
    sv.className = 'fg-color-sv';
    svMarker.className = 'fg-color-marker fg-color-sv-marker';
    sv.appendChild(svMarker);
    hue.className = 'fg-color-hue';
    hueMarker.className = 'fg-color-marker fg-color-hue-marker';
    hue.appendChild(hueMarker);
    alpha.className = 'fg-color-alpha';
    alphaFill.className = 'fg-color-alpha-fill';
    alphaMarker.className = 'fg-color-marker fg-color-alpha-marker';
    alpha.appendChild(alphaFill);
    alpha.appendChild(alphaMarker);
    controls.appendChild(sv);
    controls.appendChild(hue);
    if (getColorShowAlpha(config)) {
      controls.appendChild(alpha);
    }
    this.colorPanel.appendChild(paletteElement);
    this.colorPanel.appendChild(controls);
    this.updateColorPanelVisuals();
  };

  FabGrid.prototype.updateColorPanelVisuals = function() {
    var state = this.colorState || createColorState('#ff0000');
    var rgb = hsvToRgb(state.h, state.s, state.v);
    var sv = this.colorPanel.querySelector('.fg-color-sv');
    var svMarker = this.colorPanel.querySelector('.fg-color-sv-marker');
    var hueMarker = this.colorPanel.querySelector('.fg-color-hue-marker');
    var alphaFill = this.colorPanel.querySelector('.fg-color-alpha-fill');
    var alphaMarker = this.colorPanel.querySelector('.fg-color-alpha-marker');
    if (sv) {
      sv.style.backgroundColor = 'hsl(' + Math.round(state.h) + ', 100%, 50%)';
    }
    if (svMarker) {
      svMarker.style.left = (state.s * 100) + '%';
      svMarker.style.top = ((1 - state.v) * 100) + '%';
    }
    if (hueMarker) {
      hueMarker.style.top = (state.h / 360 * 100) + '%';
    }
    if (alphaFill) {
      alphaFill.style.backgroundImage = 'linear-gradient(to right, rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0), rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + '))';
    }
    if (alphaMarker) {
      alphaMarker.style.left = (state.a * 100) + '%';
    }
  };

  FabGrid.prototype.handleColorPanelPointerDown = function(event) {
    var paletteSwatch = closest(event.target, 'fg-color-palette-swatch');
    var area;
    var mode;
    var target = this.getColorTarget();
    var value;
    if (!this.isColorPanelOpen()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (paletteSwatch) {
      value = paletteSwatch.getAttribute('data-color') || '';
      this.colorState = createColorState(value);
      this.applyColorValueToTarget(value);
      this.updateColorPanelVisuals();
      if (target && target.type === 'search') {
        this.hideColorPanel();
        target.input.focus();
      }
      return;
    }
    area = closest(event.target, 'fg-color-sv');
    mode = 'sv';
    if (!area) {
      area = closest(event.target, 'fg-color-hue');
      mode = 'hue';
    }
    if (!area) {
      area = closest(event.target, 'fg-color-alpha');
      mode = 'alpha';
    }
    if (!area) {
      return;
    }
    this.colorDragState = { mode: mode, element: area, pointerId: event.pointerId };
    if (area.setPointerCapture && event.pointerId != null) {
      area.setPointerCapture(event.pointerId);
    }
    this.updateColorFromPointer(event);
  };

  FabGrid.prototype.handleColorPanelPointerMove = function(event) {
    if (!this.colorDragState) {
      return;
    }
    event.preventDefault();
    this.updateColorFromPointer(event);
  };

  FabGrid.prototype.handleColorPanelPointerUp = function(event) {
    var drag = this.colorDragState;
    var target = this.getColorTarget();
    if (!drag) {
      return;
    }
    if (drag.element.releasePointerCapture && drag.pointerId != null) {
      try {
        drag.element.releasePointerCapture(drag.pointerId);
      } catch (error) {
        // The pointer capture may already be released by the browser.
      }
    }
    this.colorDragState = null;
    if (target && target.type === 'search') {
      this.hideColorPanel();
      target.input.focus();
    }
    event.preventDefault();
  };

  FabGrid.prototype.updateColorFromPointer = function(event) {
    var drag = this.colorDragState;
    var rect;
    var x;
    var y;
    if (!drag || !drag.element) {
      return;
    }
    rect = drag.element.getBoundingClientRect();
    x = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    y = clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
    this.colorState = this.colorState || createColorState('#ff0000');
    if (drag.mode === 'sv') {
      this.colorState.s = x;
      this.colorState.v = 1 - y;
    } else if (drag.mode === 'hue') {
      this.colorState.h = Math.min(359.999, y * 360);
    } else if (drag.mode === 'alpha') {
      this.colorState.a = x;
    }
    this.applyColorStateToEditor();
    this.updateColorPanelVisuals();
  };

  FabGrid.prototype.applyColorStateToEditor = function() {
    var target = this.getColorTarget();
    var config;
    if (!this.colorState || !target || !target.input) {
      return;
    }
    config = target.config || this.editorConfig;
    this.applyColorValueToTarget(colorStateToHex(this.colorState, getColorShowAlpha(config)));
  };

  FabGrid.prototype.applyColorValueToTarget = function(value) {
    var target = this.getColorTarget();
    if (!target || !target.input) {
      return;
    }
    target.input.value = value;
    if (target.type === 'search') {
      target.input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      this.syncColorEditorAppearance();
    }
  };

  FabGrid.prototype.syncColorEditorAppearance = function() {
    var color = this.editor ? normalizeColorValue(this.editor.value) : '';
    if (this.editor) {
      this.editor.style.setProperty('--fg-editor-color', color || 'transparent');
    }
  };

  FabGrid.prototype.renderComboboxPanel = function(showAll) {
    var target = this.comboboxTarget || {
      type: 'editor',
      input: this.editor,
      column: this.editing ? this.visibleColumns[this.editing.col] : null,
      config: this.editorConfig
    };
    var config = target && target.config ? target.config : {};
    var items = getComboboxData(config);
    var query = showAll === true || !target || !target.input ? '' : String(target.input.value || '').toLowerCase();
    var fragment = document.createDocumentFragment();
    var item;
    var text;
    var value;
    var option;
    var matched = 0;
    var i;
    this.comboboxItems = [];
    this.comboboxActiveIndex = -1;
    this.comboboxPanel.innerHTML = '';
    for (i = 0; i < items.length; i += 1) {
      item = items[i];
      text = getComboboxItemText(item, config);
      value = String(getComboboxItemValue(item, config));
      if (query && text.toLowerCase().indexOf(query) < 0 && value.toLowerCase().indexOf(query) < 0) {
        continue;
      }
      option = document.createElement('button');
      option.type = 'button';
      option.className = 'fg-combobox-option';
      option.setAttribute('role', 'option');
      option.setAttribute('data-index', this.comboboxItems.length);
      renderComboboxOptionContent(option, text, value, config);
      fragment.appendChild(option);
      this.comboboxItems.push(item);
      matched += 1;
    }
    if (!matched) {
      option = document.createElement('div');
      option.className = 'fg-combobox-empty';
      option.textContent = '沒有符合項目';
      fragment.appendChild(option);
    }
    this.comboboxPanel.appendChild(fragment);
  };

  FabGrid.prototype.handleComboboxMouseDown = function(event) {
    var option = closest(event.target, 'fg-combobox-option');
    var index;
    if (!option || !this.comboboxTarget || !this.comboboxTarget.config || this.comboboxTarget.config.type !== 'combobox') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    index = toNumber(option.getAttribute('data-index'), -1);
    this.selectComboboxOption(index);
  };

  FabGrid.prototype.getComboboxInitialActiveIndex = function() {
    var target = this.comboboxTarget || {
      type: 'editor',
      input: this.editor,
      column: this.editing ? this.visibleColumns[this.editing.col] : null,
      config: this.editorConfig
    };
    var config = target && target.config ? target.config : {};
    var text = target && target.input ? String(target.input.value || '') : '';
    var i;
    for (i = 0; i < this.comboboxItems.length; i += 1) {
      if (getComboboxItemText(this.comboboxItems[i], config) === text ||
        String(getComboboxItemValue(this.comboboxItems[i], config)) === text) {
        return i;
      }
    }
    return this.comboboxItems.length ? 0 : -1;
  };

  FabGrid.prototype.setComboboxActiveIndex = function(index) {
    var options;
    var i;
    var option;
    if (!this.comboboxItems.length) {
      this.comboboxActiveIndex = -1;
      return;
    }
    index = clamp(index, 0, this.comboboxItems.length - 1);
    this.comboboxActiveIndex = index;
    options = this.comboboxPanel.querySelectorAll('.fg-combobox-option');
    for (i = 0; i < options.length; i += 1) {
      option = options[i];
      if (i === index) {
        option.className = 'fg-combobox-option fg-combobox-active';
        option.setAttribute('aria-selected', 'true');
        if (option.scrollIntoView) {
          option.scrollIntoView({ block: 'nearest' });
        }
      } else {
        option.className = 'fg-combobox-option';
        option.setAttribute('aria-selected', 'false');
      }
    }
  };

  FabGrid.prototype.selectComboboxActiveOption = function() {
    if (this.comboboxActiveIndex < 0) {
      return;
    }
    this.selectComboboxOption(this.comboboxActiveIndex);
  };

  FabGrid.prototype.selectComboboxOption = function(index) {
    var item = this.comboboxItems[index];
    var target = this.comboboxTarget || {
      type: 'editor',
      input: this.editor,
      column: this.editing ? this.visibleColumns[this.editing.col] : null,
      config: this.editorConfig
    };
    var config = target && target.config ? target.config : {};
    if (item == null) {
      return;
    }
    if (target.type === 'editor' && this.editing) {
      this.editing.comboboxValue = getComboboxItemValue(item, config);
      target.input.value = getComboboxItemText(item, config);
    } else if (target.input) {
      target.input.value = getComboboxItemText(item, config);
      target.input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    this.hideComboboxPanel();
    if (target.input) {
      target.input.focus();
    }
  };

  FabGrid.prototype.syncDateboxPanelToEditor = function() {
    this.syncDateboxPanelToTarget(this.dateboxTarget || {
      type: 'editor',
      input: this.editor,
      column: this.editing ? this.visibleColumns[this.editing.col] : null,
      config: this.editorConfig
    });
  };

  FabGrid.prototype.syncDateboxPanelToTarget = function(target) {
    var date;
    if (!target || !target.input || !target.config) {
      date = null;
    } else {
      date = parseDateboxEditorValue(target.input.value, target.config, target.column);
    }
    if (!date && target && target.type === 'editor' && this.editing) {
      date = isYearMonthDateboxTarget(target) ?
        parseYearMonthValue(this.editing.yearMonthValue || this.editing.original) :
        parseDateValue(this.editing.dateboxValue || this.editing.original);
    }
    if (!date) {
      date = new Date();
    }
    this.dateboxState = {
      year: date.getFullYear(),
      month: date.getMonth(),
      selected: date,
      mode: isYearMonthDateboxTarget(target) ? 'months' : 'calendar'
    };
  };

  FabGrid.prototype.applyDateboxTargetDate = function(date) {
    var target = this.dateboxTarget;
    var text;
    if (!target || !target.input || !target.config) {
      return;
    }
    if (target.type === 'editor' && this.editing) {
      if (isYearMonthDateboxTarget(target)) {
        this.editing.yearMonthValue = formatYearMonthDataText(date, target.column);
        target.input.value = formatYearMonthEditorText(date, target.config, target.column);
      } else {
        this.editing.dateboxValue = formatDateIso(date);
        target.input.value = formatDateboxEditorText(date, target.config, target.column);
      }
    } else {
      text = isYearMonthDateboxTarget(target) ?
        formatYearMonthEditorText(date, target.config, target.column) :
        formatDateboxEditorText(date, target.config, target.column);
      target.input.value = text;
      target.input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    this.hideDateboxPanel();
    target.input.focus();
  };

  FabGrid.prototype.moveDateboxMonth = function(action) {
    var state = this.dateboxState || {
      year: new Date().getFullYear(),
      month: new Date().getMonth(),
      selected: null,
      mode: 'calendar'
    };
    var date = new Date(state.year, state.month, 1);
    if (action === 'prev-year') {
      date.setFullYear(date.getFullYear() - 1);
    } else if (action === 'next-year') {
      date.setFullYear(date.getFullYear() + 1);
    } else if (action === 'prev-month') {
      date.setMonth(date.getMonth() - 1);
    } else if (action === 'next-month') {
      date.setMonth(date.getMonth() + 1);
    }
    this.dateboxState = {
      year: date.getFullYear(),
      month: date.getMonth(),
      selected: state.selected,
      mode: state.mode || 'calendar'
    };
    this.renderDateboxPanel();
  };

  FabGrid.prototype.renderDateboxPanel = function() {
    var state = this.dateboxState || {};
    var year = state.year || new Date().getFullYear();
    var month = state.month == null ? new Date().getMonth() : state.month;
    var mode = state.mode || 'calendar';
    var selectedIso = state.selected ? formatDateIso(state.selected) : '';
    var todayIso = formatDateIso(new Date());
    var first = new Date(year, month, 1);
    var start = new Date(year, month, 1 - first.getDay());
    var labels = this.getWeekdayNames();
    var html = [];
    var i;
    var d;
    var iso;
    var className;
    html.push('<div class="fg-datebox-header">');
    html.push('<button type="button" class="fg-datebox-control" data-action="prev-year">«</button>');
    html.push('<button type="button" class="fg-datebox-control" data-action="prev-month">‹</button>');
    html.push('<button type="button" class="fg-datebox-control fg-datebox-title fg-datebox-title-button" data-action="months">' + this.getMonthTitle(year, month) + '</button>');
    html.push('<button type="button" class="fg-datebox-control" data-action="next-month">›</button>');
    html.push('<button type="button" class="fg-datebox-control" data-action="next-year">»</button>');
    html.push('</div>');
    if (mode === 'months') {
      this.renderDateboxMonthView(html, year, month);
      if (!isYearMonthDateboxTarget(this.dateboxTarget)) {
        this.renderDateboxFooter(html);
      }
      this.dateboxPanel.innerHTML = html.join('');
      return;
    }
    html.push('<div class="fg-datebox-weekdays">');
    for (i = 0; i < labels.length; i += 1) {
      html.push('<span>' + escapeHtml(labels[i]) + '</span>');
    }
    html.push('</div>');
    html.push('<div class="fg-datebox-days">');
    for (i = 0; i < 42; i += 1) {
      d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      iso = formatDateIso(d);
      className = 'fg-datebox-day';
      if (d.getMonth() !== month) {
        className += ' fg-datebox-other-month';
      }
      if (d.getDay() === 0) {
        className += ' fg-datebox-sunday';
      } else if (d.getDay() === 6) {
        className += ' fg-datebox-saturday';
      }
      if (iso === todayIso) {
        className += ' fg-datebox-today';
      }
      if (iso === selectedIso) {
        className += ' fg-datebox-selected';
      }
      html.push('<button type="button" class="' + className + '" data-date="' + iso + '">' + d.getDate() + '</button>');
    }
    html.push('</div>');
    this.renderDateboxFooter(html);
    this.dateboxPanel.innerHTML = html.join('');
  };

  FabGrid.prototype.renderDateboxMonthView = function(html, year, month) {
    var labels = this.getMonthNames();
    var i;
    var className;
    html.push('<div class="fg-datebox-month-view">');
    html.push('<div class="fg-datebox-year-row">');
    html.push('<button type="button" class="fg-datebox-control fg-datebox-year-control" data-action="prev-year">«</button>');
    html.push('<input class="fg-datebox-year-input" type="number" min="1" max="9999" value="' + year + '" aria-label="' + escapeHtml(this.getText('aria.year')) + '">');
    html.push('<button type="button" class="fg-datebox-control fg-datebox-year-control" data-action="next-year">»</button>');
    html.push('</div>');
    html.push('<div class="fg-datebox-months">');
    for (i = 0; i < labels.length; i += 1) {
      className = 'fg-datebox-month';
      if (i === month) {
        className += ' fg-datebox-month-selected';
      }
      html.push('<button type="button" class="' + className + '" data-month="' + i + '">' + escapeHtml(labels[i]) + '</button>');
    }
    html.push('</div>');
    html.push('</div>');
  };

  FabGrid.prototype.renderDateboxFooter = function(html) {
    html.push('<div class="fg-datebox-footer">');
    html.push('<button type="button" class="fg-datebox-control fg-datebox-footer-button" data-action="today">' + escapeHtml(this.getText('datebox.today')) + '</button>');
    html.push('<button type="button" class="fg-datebox-control fg-datebox-footer-button" data-action="close">' + escapeHtml(this.getText('datebox.close')) + '</button>');
    html.push('</div>');
  };

  FabGrid.prototype.getMonthNames = function() {
    var names = this.getText('datebox.months');
    return names && names.length ? names : [];
  };

  FabGrid.prototype.getWeekdayNames = function() {
    var names = this.getText('datebox.weekdays');
    return names && names.length ? names : [];
  };

  FabGrid.prototype.getMonthTitle = function(year, month) {
    var names = this.getMonthNames();
    return escapeHtml(formatLocaleText(this.getText('datebox.monthTitle'), {
      month: names[month] || String(month + 1),
      year: year
    }));
  };

  FabGrid.prototype.positionDateboxPanel = function(left, top, width) {
    var panelWidth = Math.max(250, width);
    var maxLeft = Math.max(0, this.root.clientWidth - panelWidth - 2);
    var maxTop = Math.max(0, this.root.clientHeight - 282);
    this.dateboxPanel.style.left = clamp(left, 0, maxLeft) + 'px';
    this.dateboxPanel.style.top = clamp(top, 0, maxTop) + 'px';
    this.dateboxPanel.style.width = panelWidth + 'px';
  };

  FabGrid.prototype.positionComboboxPanel = function(left, top, width) {
    var maxWidth = Math.max(120, this.root.clientWidth - 4);
    var contentWidth = this.measureComboboxPanelWidth();
    var panelWidth = Math.min(maxWidth, Math.max(120, width, contentWidth));
    var maxLeft = Math.max(0, this.root.clientWidth - panelWidth - 2);
    var maxTop = Math.max(0, this.root.clientHeight - 180);
    this.comboboxPanel.style.left = clamp(left, 0, maxLeft) + 'px';
    this.comboboxPanel.style.top = clamp(top, 0, maxTop) + 'px';
    this.comboboxPanel.style.width = panelWidth + 'px';
  };

  FabGrid.prototype.positionColorPanel = function(left, top) {
    var panelWidth = Math.min(420, Math.max(260, this.root.clientWidth - 4));
    var panelHeight = Math.max(190, this.colorPanel.offsetHeight || 210);
    var maxLeft = Math.max(0, this.root.clientWidth - panelWidth - 2);
    var maxTop = Math.max(0, this.root.clientHeight - panelHeight - 2);
    this.colorPanel.style.left = clamp(left, 0, maxLeft) + 'px';
    this.colorPanel.style.top = clamp(top, 0, maxTop) + 'px';
    this.colorPanel.style.width = panelWidth + 'px';
  };

  FabGrid.prototype.measureComboboxPanelWidth = function() {
    var previousWidth;
    var width;
    if (!this.comboboxPanel) {
      return 0;
    }
    previousWidth = this.comboboxPanel.style.width;
    this.comboboxPanel.style.width = 'auto';
    width = Math.ceil(this.comboboxPanel.scrollWidth || this.comboboxPanel.offsetWidth || 0);
    this.comboboxPanel.style.width = previousWidth;
    return width + 2;
  };

  FabGrid.prototype.clearEditingState = function() {
    this.editing = null;
    this.editorConfig = null;
    this.editorIconConfigs = [];
    this.dateboxState = null;
    this.comboboxItems = [];
    this.colorState = null;
    this.colorDragState = null;
    if (this.editor) {
      this.editor.style.display = 'none';
    }
    if (this.editorIconHost) {
      this.editorIconHost.style.display = 'none';
    }
    this.hideInvalidTip();
    this.hideDateboxPanel();
    this.hideComboboxPanel();
    this.hideColorPanel();
  };

  FabGrid.prototype.syncEditingWithView = function() {
    var edit = this.editing;
    if (!edit) {
      return;
    }
    if (edit.row < 0 || edit.row >= this.view.length || (edit.item && this.view[edit.row] !== edit.item)) {
      this.clearEditingState();
    }
  };

  FabGrid.prototype.finishEditing = function(commit) {
    var edit = this.editing;
    var column;
    var item;
    var value;
    var validationValue;
    var validationError;
    var args;
    if (!edit) {
      return false;
    }
    column = this.visibleColumns[edit.col];
    item = this.view[edit.row];
    if (commit && item && column) {
      if (!isSafeBinding(column.binding)) {
        return false;
      }
      value = this.getEditorValue(column);
      if (column.dataType === 'number') {
        value = roundNumberValue(parseValue(value, column.dataType), column);
        validationValue = value;
      } else {
        validationValue = value;
        value = parseValue(value, column.dataType);
      }
      validationError = this.validateCellValue(item, column, validationValue, edit.row, edit.col);
      args = {
        row: edit.row,
        col: edit.col,
        column: column,
        item: item,
        value: value,
        previousValue: edit.original,
        validationError: validationError
      };
      if (this.emit('cellEditEnding', args) === false) {
        return false;
      }
      this._suppressObservedItemChange += 1;
      try {
        setByBinding(item, column.binding, args.value);
      } finally {
        this._suppressObservedItemChange -= 1;
      }
      if (isPromiseLike(args.validationError)) {
        this.setPendingCellValidation(item, column, args.validationError, args.value, edit.row, edit.col);
      } else if (args.validationError) {
        this.setCellValidationError(item, column, args.validationError, edit.row, edit.col);
      } else {
        this.clearCellValidationError(item, column);
      }
      this.emit('cellEditEnded', args);
    }
    this.clearEditingState();
    this.applyView();
    this.render();
    this.root.focus();
    return true;
  };

  FabGrid.prototype.validateCellValue = function(item, column, value, rowIndex, colIndex) {
    var self = this;
    var config = getColumnEditorConfig(column);
    var args;
    var result;
    if (!item || !column) {
      return null;
    }
    if (typeof column.validate === 'function') {
      args = {
        grid: this,
        item: item,
        column: column,
        value: value,
        binding: column.binding,
        rowIndex: rowIndex,
        rowNumber: rowIndex >= 0 ? rowIndex + 1 : null,
        colIndex: colIndex,
        colNumber: colIndex >= 0 ? colIndex + 1 : null
      };
      result = column.validate(args);
      if (isPromiseLike(result)) {
        return result.then(function(nextResult) {
          return normalizeValidationResult(nextResult, value, 'custom', self.getText('validation.invalidValue')) || getDefaultValidationErrorForGrid(self, config, value, column);
        });
      }
      result = normalizeValidationResult(result, value, 'custom', this.getText('validation.invalidValue'));
      if (result) {
        return result;
      }
    }
    return getDefaultValidationErrorForGrid(this, config, value, column);
  };

  FabGrid.prototype.validateRow = function(row) {
    var self = this;
    var item;
    var rowIndex;
    var validations = [];
    var column;
    var value;
    var colIndex;
    var validationResult;
    var i;
    row = Math.floor(toNumber(row, -1));
    if (row < 0 || row >= this.source.length) {
      return Promise.resolve(false);
    }
    this.applyView();
    item = this.source[row];
    if (!item || this.isRowGroup(item) || this.isRowGroupFooter(item)) {
      return Promise.resolve(false);
    }
    rowIndex = this.view.indexOf(item);
    for (i = 0; i < this.columns.length; i += 1) {
      column = this.columns[i];
      value = getByBinding(item, column.binding);
      colIndex = this.visibleColumns.indexOf(column);
      try {
        validationResult = this.validateCellValue(item, column, value, rowIndex, colIndex);
      } catch (error) {
        return Promise.reject(error);
      }
      (function(targetColumn, targetValue, targetColIndex, result) {
        validations.push(Promise.resolve(result).then(function(error) {
          return {
            column: targetColumn,
            value: targetValue,
            colIndex: targetColIndex,
            error: error
          };
        }));
      }(column, value, colIndex, validationResult));
    }
    return Promise.all(validations).then(function(results) {
      var valid = true;
      var result;
      var j;
      for (j = 0; j < results.length; j += 1) {
        result = results[j];
        if (result.error) {
          valid = false;
          self.setCellValidationError(item, result.column, result.error, rowIndex, result.colIndex);
        } else {
          self.clearCellValidationError(item, result.column);
        }
      }
      if (!self.disposed) {
        self.render();
      }
      return valid;
    });
  };

  FabGrid.prototype.setPendingCellValidation = function(item, column, promise, value, rowIndex, colIndex) {
    var self = this;
    var key = this.getValidationErrorKey(item, column);
    var seq;
    if (!key) {
      return;
    }
    this._asyncValidationSeq += 1;
    seq = this._asyncValidationSeq;
    this._asyncValidationMap[key] = seq;
    promise.then(function(result) {
      if (self.disposed || self._asyncValidationMap[key] !== seq) {
        return;
      }
      if (result) {
        self.setCellValidationError(item, column, result, rowIndex, colIndex);
      } else {
        self.clearCellValidationError(item, column);
      }
      self.applyView();
      self.render();
    }).catch(function(error) {
      if (self.disposed || self._asyncValidationMap[key] !== seq) {
        return;
      }
      self.setCellValidationError(item, column, {
        type: 'async',
        message: error && error.message ? error.message : self.getText('validation.invalidValue'),
        value: value
      }, rowIndex, colIndex);
      self.applyView();
      self.render();
    });
  };

  function getDefaultValidationErrorForGrid(grid, config, value, column) {
    var options = config && config.options ? config.options : {};
    var text;
    var validDate;
    var message;
    var isYearMonth;
    if (!config) {
      return null;
    }
    if (config.type === 'combobox' && options.limitToList === true) {
      text = value == null ? '' : String(value).trim();
      if (text === '' || isComboboxValueInList(value, config)) {
        return null;
      }
      message = grid ? grid.getText('validation.comboboxLimitToList') : 'Please select a valid item';
      return {
        type: 'combobox',
        message: options.limitToListMessage || message,
        value: value
      };
    }
    if (config.type === 'color') {
      text = value == null ? '' : String(value).trim();
      if (text === '' || isColorValueValid(text)) {
        return null;
      }
      return {
        type: 'color',
        message: grid ? grid.getText('validation.invalidColor') : 'Invalid color',
        value: value
      };
    }
    isYearMonth = isYearMonthDateboxConfig(config, column);
    if (config.type !== 'datebox') {
      return null;
    }
    text = value == null ? '' : String(value).trim();
    if (text === '') {
      return null;
    }
    validDate = isYearMonth ? parseYearMonthValue(text) : parseDateValue(text);
    if (validDate) {
      return null;
    }
    return {
      type: isYearMonth ? 'yearMonth' : 'date',
      message: grid ?
        grid.getText(isYearMonth ? 'validation.invalidYearMonth' : 'validation.invalidDate') :
        (isYearMonth ? 'Invalid year and month' : 'Invalid date'),
      value: value
    };
  }

  FabGrid.prototype.getValidationErrorKey = function(item, column) {
    var id;
    var nextId;
    if (!item || !column) {
      return '';
    }
    if (!item.__fgValidationId) {
      this._validationErrorSeq += 1;
      nextId = 'r' + this._validationErrorSeq;
      try {
        Object.defineProperty(item, '__fgValidationId', {
          value: nextId,
          enumerable: false
        });
      } catch (error) {
        try {
          item.__fgValidationId = nextId;
        } catch (assignError) {
          return this.getFallbackValidationId(item) + '::' + (column.binding || column.header || column._index);
        }
      }
    }
    id = item.__fgValidationId;
    return id + '::' + (column.binding || column.header || column._index);
  };

  FabGrid.prototype.getFallbackValidationId = function(item) {
    var i;
    for (i = 0; i < this._validationItems.length; i += 1) {
      if (this._validationItems[i] === item) {
        return this._validationItemIds[i];
      }
    }
    this._validationErrorSeq += 1;
    this._validationItems.push(item);
    this._validationItemIds.push('r' + this._validationErrorSeq);
    return this._validationItemIds[this._validationItemIds.length - 1];
  };

  FabGrid.prototype.setCellValidationError = function(item, column, error, rowIndex, colIndex) {
    var key = this.getValidationErrorKey(item, column);
    var existingIndex;
    var next;
    if (!key) {
      return;
    }
    delete this._asyncValidationMap[key];
    rowIndex = toNumber(rowIndex, -1);
    colIndex = toNumber(colIndex, column ? column._viewIndex : -1);
    next = mergeOptions({
      key: key,
      item: item,
      column: column,
      binding: column.binding,
      rowIndex: rowIndex,
      rowNumber: rowIndex >= 0 ? rowIndex + 1 : null,
      colIndex: colIndex,
      colNumber: colIndex >= 0 ? colIndex + 1 : null,
      message: this.getText('validation.invalidValue'),
      value: null
    }, error || {});
    if (Object.prototype.hasOwnProperty.call(this._invalidItemMap, key)) {
      existingIndex = this._invalidItemMap[key];
      this.invalidItems[existingIndex] = next;
      return;
    }
    this._invalidItemMap[key] = this.invalidItems.length;
    this.invalidItems.push(next);
  };

  FabGrid.prototype.clearCellValidationError = function(item, column) {
    var key = this.getValidationErrorKey(item, column);
    var index;
    var last;
    if (key) {
      delete this._asyncValidationMap[key];
    }
    if (key && Object.prototype.hasOwnProperty.call(this._invalidItemMap, key)) {
      index = this._invalidItemMap[key];
      last = this.invalidItems.pop();
      delete this._invalidItemMap[key];
      if (last && index < this.invalidItems.length) {
        this.invalidItems[index] = last;
        this._invalidItemMap[last.key] = index;
      }
    }
  };

  FabGrid.prototype.getCellValidationError = function(item, column) {
    var key = this.getValidationErrorKey(item, column);
    if (!key || !Object.prototype.hasOwnProperty.call(this._invalidItemMap, key)) {
      return null;
    }
    return this.invalidItems[this._invalidItemMap[key]] || null;
  };

  FabGrid.prototype.refreshInvalidItemRows = function() {
    var rowLookup = {};
    var i;
    var item;
    var id;
    var rowIndex;
    var entry;
    if (!this.invalidItems.length) {
      return;
    }
    for (i = 0; i < this.view.length; i += 1) {
      item = this.view[i];
      id = this.getExistingValidationId(item);
      if (id) {
        rowLookup[id] = i;
      }
    }
    for (i = 0; i < this.invalidItems.length; i += 1) {
      entry = this.invalidItems[i];
      rowIndex = Object.prototype.hasOwnProperty.call(rowLookup, getValidationRowId(entry.key)) ?
        rowLookup[getValidationRowId(entry.key)] :
        -1;
      entry.rowIndex = rowIndex;
      entry.rowNumber = rowIndex >= 0 ? rowIndex + 1 : null;
    }
  };

  FabGrid.prototype.getExistingValidationId = function(item) {
    var i;
    if (!item) {
      return '';
    }
    if (item.__fgValidationId) {
      return item.__fgValidationId;
    }
    for (i = 0; i < this._validationItems.length; i += 1) {
      if (this._validationItems[i] === item) {
        return this._validationItemIds[i];
      }
    }
    return '';
  };

  FabGrid.prototype.getEditorValue = function(column) {
    if (!column && this.editing) {
      column = this.visibleColumns[this.editing.col];
    }
    var config = getColumnEditorConfig(column);
    var mask = getExplicitEditorMask(column);
    if (mask) {
      return getMaskDataValue(this.editor.value, getMaskOptions(column, mask));
    }
    if (config.type === 'datebox') {
      return getDateboxDataValue(this.editor.value, config, this.editing);
    }
    if (config.type === 'combobox') {
      return getComboboxDataValue(this.editor.value, config, this.editing);
    }
    if (config.type === 'color') {
      return parseColorValue(this.editor.value);
    }
    return this.editor.value;
  };
}

function createEditorDefinitions() {
  'use strict';

  function removeAll(text, token) {
    return token ? String(text).split(token).join('') : String(text);
  }

  function normalizePrecision(value) {
    if (value == null || value === false || value === '') return null;
    value = Math.floor(Number(value));
    return isFinite(value) && value >= 0 ? Math.min(20, value) : null;
  }

  function getGroupSeparator(options) {
    options = options || {};
    if (options.groupSeparator != null && options.groupSeparator !== '') return String(options.groupSeparator);
    if (options.thousandsSeparator === true || options.useThousandsSeparator === true || options.showThousandsSeparator === true) return ',';
    return '';
  }

  function getDecimalSeparator(options) {
    return options && options.decimalSeparator ? String(options.decimalSeparator) : '.';
  }

  function stripNumberFormatting(value, options) {
    var text = value == null ? '' : String(value).trim();
    var groupSeparator = getGroupSeparator(options);
    var decimalSeparator = getDecimalSeparator(options);
    text = removeAll(text, groupSeparator);
    if (decimalSeparator !== '.') text = text.replace(decimalSeparator, '.');
    return text.replace(/\s/g, '');
  }

  function sanitizeNumber(value, options) {
    var text = stripNumberFormatting(value, options);
    var output = '';
    var hasDecimal = false;
    var allowNegative = !options || options.min == null || Number(options.min) < 0;
    var index;
    var character;
    for (index = 0; index < text.length; index += 1) {
      character = text.charAt(index);
      if (character >= '0' && character <= '9') {
        output += character;
      } else if (character === '.' && !hasDecimal) {
        output += character;
        hasDecimal = true;
      } else if (character === '-' && allowNegative && output === '') {
        output = '-';
      }
    }
    return output;
  }

  function formatNumber(value, options) {
    var text = stripNumberFormatting(value, options);
    var precision = normalizePrecision(options && options.precision);
    var groupSeparator = getGroupSeparator(options);
    var decimalSeparator = getDecimalSeparator(options);
    var number;
    var sign = '';
    var hasDecimal;
    var parts;
    var integer;
    var decimal;
    if (text === '' || text === '-') return text;
    if (!/^-?\d*(?:\.\d*)?$/.test(text)) return String(value);
    if (precision != null) {
      number = Number(text);
      if (isFinite(number)) text = number.toFixed(precision);
    }
    if (text.charAt(0) === '-') {
      sign = '-';
      text = text.slice(1);
    }
    hasDecimal = text.indexOf('.') >= 0;
    parts = text.split('.');
    integer = parts[0] || '0';
    decimal = parts.length > 1 ? parts[1] : '';
    integer = integer.replace(/^0+(?=\d)/, '');
    if (groupSeparator) integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
    return sign + integer + (hasDecimal ? decimalSeparator + decimal : '');
  }

  function parseNumber(value, options) {
    var text = sanitizeNumber(value, options);
    var number;
    if (text === '' || text === '-' || text === '.' || text === '-.') return null;
    number = Number(text);
    return isFinite(number) ? number : null;
  }

  function isNumberTextAllowed(editor, text, options) {
    var start = editor.selectionStart == null ? editor.value.length : editor.selectionStart;
    var end = editor.selectionEnd == null ? start : editor.selectionEnd;
    var next = editor.value.slice(0, start) + text + editor.value.slice(end);
    return stripNumberFormatting(next, options) === sanitizeNumber(next, options);
  }

  function pad2(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function parseDate(value) {
    var text;
    var match;
    var year;
    var month;
    var day;
    var date;
    if (value instanceof Date && isFinite(value.getTime())) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    if (value == null || value === '') return null;
    text = String(value).trim();
    match = text.match(/^(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})$/);
    if (!match) {
      match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
      if (match) {
        year = Number(match[3]);
        month = Number(match[1]) - 1;
        day = Number(match[2]);
      }
    } else {
      year = Number(match[1]);
      month = Number(match[2]) - 1;
      day = Number(match[3]);
    }
    if (!match) return null;
    date = new Date(year, month, day);
    return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : null;
  }

  function extractDateDigits(value) {
    var date = parseDate(value);
    if (date) return date.getFullYear() + pad2(date.getMonth() + 1) + pad2(date.getDate());
    return String(value == null ? '' : value).replace(/[^0-9]/g, '').slice(0, 8);
  }

  function applyDateMask(raw, mask) {
    var digits = String(raw || '').replace(/[^0-9]/g, '').slice(0, 8);
    var output = '';
    var index = 0;
    var maskIndex;
    mask = String(mask || '9999/99/99');
    for (maskIndex = 0; maskIndex < mask.length; maskIndex += 1) {
      if (mask.charAt(maskIndex) === '9') {
        if (index >= digits.length) break;
        output += digits.charAt(index);
        index += 1;
      } else if (index > 0) {
        output += mask.charAt(maskIndex);
      }
    }
    return output;
  }

  function formatDate(value, options) {
    return applyDateMask(extractDateDigits(value), options && options.mask);
  }

  function getDateDataValue(value) {
    var date = parseDate(value);
    return date ? date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate()) : (value == null ? '' : String(value));
  }

  function getDateCopyText(value, options) {
    if (options && (options.autoUnmask === true || options.maskValueIncludesLiterals === false || options.maskIncludesLiterals === false || options.maskLiteralsInValue === false)) {
      return extractDateDigits(value);
    }
    return formatDate(value, options);
  }

  function countDateDigitsBeforeCaret(value, caret) {
    return String(value == null ? '' : value).slice(0, caret).replace(/[^0-9]/g, '').length;
  }

  function getDateCaretPosition(value, rawIndex) {
    var text = String(value || '');
    var count = 0;
    var index;
    if (rawIndex <= 0) return 0;
    for (index = 0; index < text.length; index += 1) {
      if (/[0-9]/.test(text.charAt(index))) {
        count += 1;
        if (count >= rawIndex) return index + 1;
      }
    }
    return text.length;
  }

  function handleDateDelete(editor, key, options) {
    var start = editor.selectionStart == null ? editor.value.length : editor.selectionStart;
    var end = editor.selectionEnd == null ? start : editor.selectionEnd;
    var raw = extractDateDigits(editor.value);
    var deleteStart = countDateDigitsBeforeCaret(editor.value, start);
    var deleteEnd = countDateDigitsBeforeCaret(editor.value, end);
    var nextRaw;
    var nextText;
    var nextCaret;
    if (start === end) {
      if (key === 'Backspace') {
        if (deleteStart <= 0) return true;
        deleteStart -= 1;
      } else if (deleteStart >= raw.length) {
        return true;
      } else {
        deleteEnd += 1;
      }
    }
    nextRaw = raw.slice(0, deleteStart) + raw.slice(deleteEnd);
    nextText = applyDateMask(nextRaw, options && options.mask);
    nextCaret = getDateCaretPosition(nextText, deleteStart);
    editor.value = nextText;
    if (editor.setSelectionRange) editor.setSelectionRange(nextCaret, nextCaret);
    return true;
  }

  function parseYymm(value) {
    var text;
    var match;
    var year;
    var month;
    if (value instanceof Date && isFinite(value.getTime())) return new Date(value.getFullYear(), value.getMonth(), 1);
    if (value == null || value === '') return null;
    text = String(value).trim();
    match = text.match(/^(\d{4})(?:[-\/](\d{1,2})|(\d{2}))$/);
    if (!match) return null;
    year = Number(match[1]);
    month = Number(match[2] || match[3]) - 1;
    return year >= 1 && month >= 0 && month <= 11 ? new Date(year, month, 1) : null;
  }

  function extractYymmDigits(value) {
    var date = parseYymm(value);
    if (date) return date.getFullYear() + pad2(date.getMonth() + 1);
    return String(value == null ? '' : value).replace(/[^0-9]/g, '').slice(0, 6);
  }

  function formatYymm(value, options) {
    return applyDateMask(extractYymmDigits(value), options && options.mask ? options.mask : '9999/99');
  }

  function getYymmDataValue(value) {
    var date = parseYymm(value);
    return date ? date.getFullYear() + pad2(date.getMonth() + 1) : (value == null ? '' : String(value));
  }

  function getYymmCopyText(value, options) {
    if (options && (options.autoUnmask === true || options.maskValueIncludesLiterals === false || options.maskIncludesLiterals === false || options.maskLiteralsInValue === false)) {
      return extractYymmDigits(value);
    }
    return formatYymm(value, options);
  }

  function handleYymmDelete(editor, key, options) {
    var yymmOptions = {};
    var name;
    options = options || {};
    for (name in options) {
      if (Object.prototype.hasOwnProperty.call(options, name)) yymmOptions[name] = options[name];
    }
    yymmOptions.mask = options.mask || '9999/99';
    return handleDateDelete(editor, key, yymmOptions);
  }

  function isYearMonthMask(options) {
    var mask = options && options.mask ? String(options.mask) : '';
    return mask === '9999/99' || mask === '9999-99';
  }

  // CSS named colors use their standard sRGB hex values.
  var CSS_NAMED_COLORS = {
    aliceblue: 'f0f8ff',
    antiquewhite: 'faebd7',
    aqua: '00ffff',
    aquamarine: '7fffd4',
    azure: 'f0ffff',
    beige: 'f5f5dc',
    bisque: 'ffe4c4',
    black: '000000',
    blanchedalmond: 'ffebcd',
    blue: '0000ff',
    blueviolet: '8a2be2',
    brown: 'a52a2a',
    burlywood: 'deb887',
    cadetblue: '5f9ea0',
    chartreuse: '7fff00',
    chocolate: 'd2691e',
    coral: 'ff7f50',
    cornflowerblue: '6495ed',
    cornsilk: 'fff8dc',
    crimson: 'dc143c',
    cyan: '00ffff',
    darkblue: '00008b',
    darkcyan: '008b8b',
    darkgoldenrod: 'b8860b',
    darkgray: 'a9a9a9',
    darkgreen: '006400',
    darkgrey: 'a9a9a9',
    darkkhaki: 'bdb76b',
    darkmagenta: '8b008b',
    darkolivegreen: '556b2f',
    darkorange: 'ff8c00',
    darkorchid: '9932cc',
    darkred: '8b0000',
    darksalmon: 'e9967a',
    darkseagreen: '8fbc8f',
    darkslateblue: '483d8b',
    darkslategray: '2f4f4f',
    darkslategrey: '2f4f4f',
    darkturquoise: '00ced1',
    darkviolet: '9400d3',
    deeppink: 'ff1493',
    deepskyblue: '00bfff',
    dimgray: '696969',
    dimgrey: '696969',
    dodgerblue: '1e90ff',
    firebrick: 'b22222',
    floralwhite: 'fffaf0',
    forestgreen: '228b22',
    fuchsia: 'ff00ff',
    gainsboro: 'dcdcdc',
    ghostwhite: 'f8f8ff',
    gold: 'ffd700',
    goldenrod: 'daa520',
    gray: '808080',
    green: '008000',
    greenyellow: 'adff2f',
    grey: '808080',
    honeydew: 'f0fff0',
    hotpink: 'ff69b4',
    indianred: 'cd5c5c',
    indigo: '4b0082',
    ivory: 'fffff0',
    khaki: 'f0e68c',
    lavender: 'e6e6fa',
    lavenderblush: 'fff0f5',
    lawngreen: '7cfc00',
    lemonchiffon: 'fffacd',
    lightblue: 'add8e6',
    lightcoral: 'f08080',
    lightcyan: 'e0ffff',
    lightgoldenrodyellow: 'fafad2',
    lightgray: 'd3d3d3',
    lightgreen: '90ee90',
    lightgrey: 'd3d3d3',
    lightpink: 'ffb6c1',
    lightsalmon: 'ffa07a',
    lightseagreen: '20b2aa',
    lightskyblue: '87cefa',
    lightslategray: '778899',
    lightslategrey: '778899',
    lightsteelblue: 'b0c4de',
    lightyellow: 'ffffe0',
    lime: '00ff00',
    limegreen: '32cd32',
    linen: 'faf0e6',
    magenta: 'ff00ff',
    maroon: '800000',
    mediumaquamarine: '66cdaa',
    mediumblue: '0000cd',
    mediumorchid: 'ba55d3',
    mediumpurple: '9370db',
    mediumseagreen: '3cb371',
    mediumslateblue: '7b68ee',
    mediumspringgreen: '00fa9a',
    mediumturquoise: '48d1cc',
    mediumvioletred: 'c71585',
    midnightblue: '191970',
    mintcream: 'f5fffa',
    mistyrose: 'ffe4e1',
    moccasin: 'ffe4b5',
    navajowhite: 'ffdead',
    navy: '000080',
    oldlace: 'fdf5e6',
    olive: '808000',
    olivedrab: '6b8e23',
    orange: 'ffa500',
    orangered: 'ff4500',
    orchid: 'da70d6',
    palegoldenrod: 'eee8aa',
    palegreen: '98fb98',
    paleturquoise: 'afeeee',
    palevioletred: 'db7093',
    papayawhip: 'ffefd5',
    peachpuff: 'ffdab9',
    peru: 'cd853f',
    pink: 'ffc0cb',
    plum: 'dda0dd',
    powderblue: 'b0e0e6',
    purple: '800080',
    rebeccapurple: '663399',
    red: 'ff0000',
    rosybrown: 'bc8f8f',
    royalblue: '4169e1',
    saddlebrown: '8b4513',
    salmon: 'fa8072',
    sandybrown: 'f4a460',
    seagreen: '2e8b57',
    seashell: 'fff5ee',
    sienna: 'a0522d',
    silver: 'c0c0c0',
    skyblue: '87ceeb',
    slateblue: '6a5acd',
    slategray: '708090',
    slategrey: '708090',
    snow: 'fffafa',
    springgreen: '00ff7f',
    steelblue: '4682b4',
    tan: 'd2b48c',
    teal: '008080',
    thistle: 'd8bfd8',
    tomato: 'ff6347',
    transparent: '00000000',
    turquoise: '40e0d0',
    violet: 'ee82ee',
    wheat: 'f5deb3',
    white: 'ffffff',
    whitesmoke: 'f5f5f5',
    yellow: 'ffff00',
    yellowgreen: '9acd32'
  };

  function normalizeColor(value) {
    var text = value == null ? '' : String(value).trim().toLowerCase();
    var hex;
    if (!text) return '';
    if (Object.prototype.hasOwnProperty.call(CSS_NAMED_COLORS, text)) {
      return '#' + CSS_NAMED_COLORS[text];
    }
    if (text.charAt(0) !== '#') text = '#' + text;
    hex = text.slice(1);
    if (!/^(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(hex)) return '';
    if (hex.length === 3 || hex.length === 4) {
      hex = hex.replace(/./g, function(character) { return character + character; });
    }
    return '#' + hex;
  }

  function parseColor(value) {
    var text = value == null ? '' : String(value).trim();
    var normalized = normalizeColor(value);
    if (Object.prototype.hasOwnProperty.call(CSS_NAMED_COLORS, text.toLowerCase())) {
      return text;
    }
    return normalized || text;
  }

  return {
    textbox: {
      type: 'textbox',
      className: 'textbox-f fg-editor-textbox',
      inputMode: 'text',
      normalize: function(value) { return value == null ? '' : String(value); }
    },
    numberbox: {
      type: 'numberbox',
      className: 'textbox-f numberbox-f fg-editor-numberbox',
      inputMode: 'decimal',
      normalizePrecision: normalizePrecision,
      getGroupSeparator: getGroupSeparator,
      stripFormatting: stripNumberFormatting,
      sanitize: sanitizeNumber,
      format: formatNumber,
      parse: parseNumber,
      getCopyText: stripNumberFormatting,
      isTextAllowed: isNumberTextAllowed
    },
    datebox: {
      type: 'datebox',
      className: 'textbox-f datebox-f fg-editor-datebox',
      inputMode: 'numeric',
      mask: '9999/99/99',
      sanitize: function(value, options) {
        return isYearMonthMask(options) ? formatYymm(value, options) : formatDate(value, options);
      },
      format: function(value, options) {
        return isYearMonthMask(options) ? formatYymm(value, options) : formatDate(value, options);
      },
      parse: function(value, options) {
        return isYearMonthMask(options) ? parseYymm(value) : parseDate(value);
      },
      getDataValue: function(value, options) {
        return isYearMonthMask(options) ? getYymmDataValue(value) : getDateDataValue(value);
      },
      getCopyText: function(value, options) {
        return isYearMonthMask(options) ? getYymmCopyText(value, options) : getDateCopyText(value, options);
      },
      handleDelete: function(editor, key, options) {
        return isYearMonthMask(options) ? handleYymmDelete(editor, key, options) : handleDateDelete(editor, key, options);
      },
      isTextAllowed: function(editor, text) { return /^[0-9]+$/.test(String(text || '')); }
    },
    color: {
      type: 'color',
      className: 'textbox-f color-f fg-editor-color',
      inputMode: 'text',
      normalize: normalizeColor,
      parse: parseColor,
      isValid: function(value) {
        return value == null || String(value).trim() === '' || Boolean(normalizeColor(value));
      }
    }
  };
}














function createFabGridFactory(editorDefinitions) {
  'use strict';

  editorDefinitions = editorDefinitions || {};

  var SELECTION_MODE = Object.freeze({
    Cell: 'Cell',
    CellRange: 'CellRange'
  });

  var DEFAULT_OPTIONS = {
    rowHeight: 32,
    headerHeight: 32,
    overscanRows: 8,
    fastScrollOverscanRows: 64,
    overscanColumns: 3,
    frozenColumns: 0,
    frozenRightColumns: 0,
    rowHeaderWidth: 60,
    rowHeaderHeader: '',
    showRowHeaders: true,
    showColumnChooser: true,
    showFooter: false,
    footerHeight: 32,
    footerLabel: '',
    multiSelectRows: false,
    selectionCheckboxWidth: 44,
    allowSorting: true,
    allowFiltering: true,
    allowEditing: true,
    editOnSelect: false,
    allowResizing: true,
    allowDragging: 'None',
    allowMerging: 'None',
    allowPinning: false,
    headerDisplayMode: 'header',
    headerToggleKey: false,
    showSearchRow: false,
    searchRowHeight: null,
    searchDelay: 200,
    excelFilterMaxValues: 1000,
    alternatingRowStep: 1,
    autoClipboard: true,
    copyHeaders: 'None',
    locale: null,
    messages: null,
    exportBusyText: null,
    frozenRows: 0,
    syncScrollRender: true,
    itemFormatter: null,
    selectionMode: SELECTION_MODE.Cell,
    highlightActiveRow: true,
    activeCellBorder: 2,
    childItemsPath: null,
    treeColumn: null,
    treeIndent: 20,
    rowGroups: [],
    columns: [],
    observeItemsSource: false,
    remote: false,
    url: null,
    method: 'get',
    loader: null,
    loadMsg: null,
    pagination: false,
    pager: null,
    pageNumber: 1,
    pageSize: 10,
    pageList: [10, 20, 30, 40, 50],
    showPageList: false,
    showPageInfo: true,
    showRefresh: true,
    paginationHeight: 35,
    itemsSource: []
  };
  var FABGRID_INTERNAL_LOCALES = {};
  var DEFAULT_COLOR_PALETTE = [
    '#ffffff', '#000000', '#ff0000', '#ffc000', '#ffff00', '#92d050', '#00b050', '#00b0f0', '#0070c0', '#7030a0',
    '#f2f2f2', '#737373', '#ffe5e5', '#fff9e5', '#ffffe5', '#f3ffe5', '#e5fff1', '#e5f8ff', '#e5f4ff', '#f4e5ff',
    '#d9d9d9', '#595959', '#e6a1a1', '#e6d4a1', '#e5e6a1', '#c4e6a1', '#a1e6c0', '#a1d3e6', '#a1c9e6', '#c8a1e6',
    '#bfbfbf', '#404040', '#cc6666', '#ccb366', '#cccc66', '#9bcc66', '#66cc94', '#66b1cc', '#66a2cc', '#a066cc',
    '#a6a6a6', '#262626', '#b23636', '#b29436', '#b2b236', '#76b236', '#36b26e', '#3691b2', '#367eb2', '#7d36b2',
    '#8c8c8c', '#0d0d0d', '#990f0f', '#99770f', '#99990f', '#56990f', '#0f994e', '#0f7499', '#0f6099', '#5e0f99'
  ];

  function FabGrid(element, options) {
    Control.call(this);
    this.host = typeof element === 'string' ? document.querySelector(element) : element;
    if (!this.host) {
      throw new Error('FabGrid host element was not found.');
    }

    this.options = mergeOptions(DEFAULT_OPTIONS, options || {});
    normalizeGridOptions(this.options);
    this.applyPagerOptions();
    this.options.showRowHeaders = normalizeRowHeaderMode(this.options.showRowHeaders);
    this.setLocale(this.options.locale, this.options.messages, true);
    if (this.options.isReadOnly === true) {
      this.options.allowEditing = false;
    }
    this.events = {};
    this.wijmoEvents = {};
    this.columns = [];
    this.source = [];
    this.view = [];
    this._rowCollection = null;
    this.dataView = [];
    this.paginationTotal = 0;
    this.remoteLoading = false;
    this._remoteLoadSeq = 0;
    this.rowGroupState = createDictionary();
    this._treeCollapsedItems = [];
    this._treeRowInfos = [];
    this._treeInfoItems = [];
    this._treeInfoValues = [];
    this._treeInfoMap = typeof WeakMap === 'function' ? new WeakMap() : null;
    this._treeRootCount = 0;
    this.filterPredicate = null;
    this.searchText = '';
    this.columnSearchValues = {};
    this.columnSearchOperators = {};
    this.hasColumnSearch = false;
    this.excelFilters = {};
    this.sortState = null;
    this.sortStates = [];
    this.headerDisplayMode = normalizeHeaderDisplayMode(this.options.headerDisplayMode);
    this.columnOffsets = [];
    this.totalWidth = 0;
    this._frozenColumns = 0;
    this._frozenRightColumns = 0;
    this.frozenWidth = 0;
    this.frozenRightWidth = 0;
    this.frozenRightStartLeft = 0;
    this.scrollableColumnEnd = 0;
    this.scrollableWidth = 0;
    this.nativeScrollbarGutters = null;
    this.useScrollLinkedHorizontal = supportsScrollLinkedHorizontal();
    this.rowRange = { start: 0, end: 0 };
    this.columnRange = { start: 0, end: 0 };
    this.renderContentHeight = 0;
    this._layoutReadyForRender = false;
    this.scrollState = {
      top: 0,
      left: 0,
      directionY: 0,
      extraRows: 0
    };
    this.renderedScrollTop = 0;
    this.selection = { row: 0, col: 0 };
    this.selectionAnchor = { row: 0, col: 0 };
    this.cellRangeDragState = null;
    this.cellRangeAutoScrollRaf = 0;
    this.suppressCellRangeClick = false;
    this.suppressCellRangeClickEvent = false;
    this.rowSelection = null;
    this.selectedRowMap = {};
    this.selectedItemRefs = [];
    this._selectedItemSet = typeof WeakSet === 'function' ? new WeakSet() : null;
    this.hoverRow = null;
    this.editing = null;
    this.editorConfig = null;
    this.editorIconConfigs = [];
    this.dateboxState = null;
    this.dateboxTarget = null;
    this.comboboxTarget = null;
    this.colorState = null;
    this.colorDragState = null;
    this.colorTarget = null;
    this.headerSearchFocusRequest = null;
    this.headerSearchFocusRaf = 0;
    this.comboboxItems = [];
    this.comboboxActiveIndex = -1;
    this.filterMenuColumn = null;
    this.filterMenuAnchor = null;
    this.excelFilterDraft = null;
    this.columnChooserAnchor = null;
    this.topLeftMenuMode = null;
    this.invalidItems = [];
    this._invalidItemMap = {};
    this._validationErrorSeq = 0;
    this._asyncValidationSeq = 0;
    this._asyncValidationMap = {};
    this._validationItems = [];
    this._validationItemIds = [];
    this.busy = false;
    this.raf = 0;
    this.scrollLinkedHorizontalRaf = 0;
    this.disposed = false;
    this.resizeState = null;
    this.columnDragState = null;
    this.columnDragTargetCell = null;
    this.columnDragIndicator = null;
    this.verticalScrollbarDrag = null;
    this.horizontalScrollbarDrag = null;
    this.pointerInteractionEventsBound = false;
    this.verticalScrollbarDragEventsBound = false;
    this.horizontalScrollbarDragEventsBound = false;
    this.fixedPaneTouchTap = null;
    this.fixedPaneTouchClickUntil = 0;
    this.suppressClick = false;
    this.cellRangeClickCandidate = null;
    this.copyBuffer = '';
    this.headerSearchTimer = 0;
    this.cellDblClickTimer = 0;
    this.pendingCellDblClick = null;
    this._autoSizeCanvas = null;
    this._autoSizeContext = null;
    this._suppressObservedItemChange = 0;
    this._handlingObservedItemChange = false;
    this._observedItemsChangeQueued = false;
    this.cells = createGridPanel(this, CellType.Cell);
    this.columnHeaders = createGridPanel(this, CellType.ColumnHeader);
    this.rowHeaders = createGridPanel(this, CellType.RowHeader);
    this.topLeftCells = createGridPanel(this, CellType.TopLeft);
    this.columnFooters = createGridPanel(this, CellType.ColumnFooter);
    this.bottomLeftCells = createGridPanel(this, CellType.BottomLeft);

    this._boundScroll = bind(this, this.handleScroll);
    this._boundClick = bind(this, this.handleClick);
    this._boundDblClick = bind(this, this.handleDblClick);
    this._boundContextMenu = bind(this, this.handleContextMenu);
    this._boundKeyDown = bind(this, this.handleKeyDown);
    this._boundMouseMove = bind(this, this.handleMouseMove);
    this._boundMouseLeave = bind(this, this.handleMouseLeave);
    this._boundPointerDown = bind(this, this.handlePointerDown);
    this._boundPointerMove = bind(this, this.handlePointerMove);
    this._boundPointerUp = bind(this, this.handlePointerUp);
    this._boundVerticalScrollbarPointerDown = bind(this, this.handleVerticalScrollbarPointerDown);
    this._boundVerticalScrollbarPointerMove = bind(this, this.handleVerticalScrollbarPointerMove);
    this._boundVerticalScrollbarPointerUp = bind(this, this.handleVerticalScrollbarPointerUp);
    this._boundVerticalScrollbarWheel = bind(this, this.handleVerticalScrollbarWheel);
    this._boundHorizontalScrollbarPointerDown = bind(this, this.handleHorizontalScrollbarPointerDown);
    this._boundHorizontalScrollbarPointerMove = bind(this, this.handleHorizontalScrollbarPointerMove);
    this._boundHorizontalScrollbarPointerUp = bind(this, this.handleHorizontalScrollbarPointerUp);
    this._boundFixedPaneWheel = bind(this, this.handleFixedPaneWheel);
    this._boundFixedPaneTouchStart = bind(this, this.handleFixedPaneTouchStart);
    this._boundFixedPaneTouchEnd = bind(this, this.handleFixedPaneTouchEnd);
    this._boundEditorBeforeInput = bind(this, this.handleEditorBeforeInput);
    this._boundEditorInput = bind(this, this.handleEditorInput);
    this._boundEditorCopy = bind(this, this.handleEditorCopy);
    this._boundHeaderSearchBeforeInput = bind(this, this.handleHeaderSearchBeforeInput);
    this._boundHeaderSearchInput = bind(this, this.handleHeaderSearchInput);
    this._boundHeaderSearchCompositionStart = bind(this, this.handleHeaderSearchCompositionStart);
    this._boundHeaderSearchCompositionEnd = bind(this, this.handleHeaderSearchCompositionEnd);
    this._boundEditorTriggerClick = bind(this, this.handleEditorTriggerClick);
    this._boundDateboxClick = bind(this, this.handleDateboxClick);
    this._boundDateboxChange = bind(this, this.handleDateboxChange);
    this._boundComboboxMouseDown = bind(this, this.handleComboboxMouseDown);
    this._boundColorPanelPointerDown = bind(this, this.handleColorPanelPointerDown);
    this._boundColorPanelPointerMove = bind(this, this.handleColorPanelPointerMove);
    this._boundColorPanelPointerUp = bind(this, this.handleColorPanelPointerUp);
    this._boundFilterMenuClick = bind(this, this.handleFilterMenuClick);
    this._boundExcelFilterMenuInput = bind(this, this.handleExcelFilterMenuInput);
    this._boundColumnChooserChange = bind(this, this.handleColumnChooserChange);
    this._boundTopLeftMenuClick = bind(this, this.handleTopLeftMenuClick);
    this._boundPaginationClick = bind(this, this.handlePaginationClick);
    this._boundPaginationChange = bind(this, this.handlePaginationChange);
    this._boundPaginationKeyDown = bind(this, this.handlePaginationKeyDown);
    this._boundDocumentMouseDown = bind(this, this.handleDocumentMouseDown);
    this._boundFullscreenChange = bind(this, this.handleFullscreenChange);
    this._boundBusyEvent = bind(this, this.blockBusyEvent);
    this._boundResize = bind(this, this.invalidate);

    this.setColumns(this.options.columns || [], true);
    this.setItemsSource(this.options.remote === true ? [] : (this.options.itemsSource || []), true);
    this.createWijmoEvents();
    this.bindOptionEvent('updatedView');
    this.createDom();
    this.bindDomEvents();
    this.bindRowDragEvents();
    this.refresh();
    registerControl(this.host, this);
    if (this.options.remote === true) {
      this.load();
    }
  }

  FabGrid.prototype = Object.create(Control.prototype);
  FabGrid.prototype.constructor = FabGrid;

  function supportsScrollLinkedHorizontal() {
    return typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('animation-timeline: scroll()') &&
      CSS.supports('scroll-timeline-name: --fg-horizontal-scroll') &&
      CSS.supports('timeline-scope: --fg-horizontal-scroll');
  }

  function measureNativeScrollbarGutters() {
    var probe;
    var content;
    var gutters = { width: 0, height: 0 };
    if (!document.body) {
      return gutters;
    }
    probe = document.createElement('div');
    content = document.createElement('div');
    probe.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:100px;height:100px;overflow:scroll;visibility:hidden;';
    content.style.cssText = 'width:200px;height:200px;';
    probe.appendChild(content);
    document.body.appendChild(probe);
    gutters.width = Math.max(0, probe.offsetWidth - probe.clientWidth);
    gutters.height = Math.max(0, probe.offsetHeight - probe.clientHeight);
    probe.remove();
    return gutters;
  }

  function findClosestGridElement(target, classNames, boundary) {
    var node = target && target.nodeType === 1 ? target : target ? target.parentElement : null;
    var i;
    while (node) {
      if (node.classList) {
        for (i = 0; i < classNames.length; i += 1) {
          if (node.classList.contains(classNames[i])) {
            return node;
          }
        }
      }
      if (node === boundary) {
        break;
      }
      node = node.parentElement;
    }
    return null;
  }

  function findClosestGridAttribute(target, name, boundary) {
    var node = target && target.nodeType === 1 ? target : target ? target.parentElement : null;
    while (node) {
      if (typeof node.hasAttribute === 'function' && node.hasAttribute(name)) {
        return node;
      }
      if (node === boundary) {
        break;
      }
      node = node.parentElement;
    }
    return null;
  }

  function isFiniteNumber(value) {
    return typeof value === 'number' && isFinite(value);
  }

  function getHitTestTarget(point, y) {
    var clientX;
    var clientY;
    if (point && point.target) {
      return point.target;
    }
    if (point && point.nodeType) {
      return point;
    }
    if (typeof document === 'undefined' || typeof document.elementFromPoint !== 'function') {
      return null;
    }
    if (typeof point === 'number') {
      clientX = point - (typeof window !== 'undefined' ? window.pageXOffset || 0 : 0);
      clientY = Number(y) - (typeof window !== 'undefined' ? window.pageYOffset || 0 : 0);
    } else if (point && typeof point === 'object') {
      clientX = point.clientX == null ? Number(point.x) - (typeof window !== 'undefined' ? window.pageXOffset || 0 : 0) : Number(point.clientX);
      clientY = point.clientY == null ? Number(point.y) - (typeof window !== 'undefined' ? window.pageYOffset || 0 : 0) : Number(point.clientY);
    }
    return isFiniteNumber(clientX) && isFiniteNumber(clientY) ? document.elementFromPoint(clientX, clientY) : null;
  }

  function getHitTestPoint(point, target) {
    var rect;
    var pageXOffset = typeof window !== 'undefined' ? window.pageXOffset || 0 : 0;
    var pageYOffset = typeof window !== 'undefined' ? window.pageYOffset || 0 : 0;
    if (point && point.pageX != null && point.pageY != null) {
      return { x: Number(point.pageX), y: Number(point.pageY) };
    }
    if (point && point.clientX != null && point.clientY != null) {
      return { x: Number(point.clientX) + pageXOffset, y: Number(point.clientY) + pageYOffset };
    }
    if (point && point.x != null && point.y != null) {
      return { x: Number(point.x), y: Number(point.y) };
    }
    if (target && typeof target.getBoundingClientRect === 'function') {
      rect = target.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 + pageXOffset,
        y: rect.top + rect.height / 2 + pageYOffset
      };
    }
    return { x: 0, y: 0 };
  }

  function createEmptyHitTestInfo(grid, target, point) {
    return {
      grid: grid,
      panel: null,
      cellType: CellType.None,
      row: -1,
      col: -1,
      viewCol: -1,
      column: null,
      range: null,
      target: target || null,
      point: point,
      isSearchRow: false,
      edgeTop: false,
      edgeRight: false,
      edgeBottom: false,
      edgeLeft: false,
      edgeFarTop: false,
      edgeFarRight: false,
      edgeFarBottom: false,
      edgeFarLeft: false
    };
  }

  FabGrid.prototype.on = function(name, handler) {
    if (!this.events[name]) {
      this.events[name] = [];
    }
    this.events[name].push(handler);
    return this;
  };

  FabGrid.prototype.off = function(name, handler) {
    var list = this.events[name];
    var i;
    if (!list) {
      return this;
    }
    for (i = list.length - 1; i >= 0; i -= 1) {
      if (list[i] === handler) {
        list.splice(i, 1);
      }
    }
    return this;
  };

  FabGrid.prototype.emit = function(name, detail) {
    var list = this.events[name];
    var wijmoEvent = this.wijmoEvents ? this.wijmoEvents[name] : null;
    var i;
    detail = detail || {};
    if (list) {
      list = list.slice();
      for (i = 0; i < list.length; i += 1) {
        if (list[i](detail) === false) {
          detail.cancel = true;
        }
      }
    }
    if (wijmoEvent && wijmoEvent.raise(this, detail) === false) {
      detail.cancel = true;
    }
    return detail.cancel !== true;
  };

  FabGrid.prototype.createWijmoEvents = function() {
    var names = [
      'autoGeneratedColumns',
      'autoSizedColumn',
      'autoSizedRow',
      'autoSizingColumn',
      'autoSizingRow',
      'beforeLoad',
      'beginningEdit',
      'bigCheckboxesChanged',
      'cellEditEnding',
      'cellEditEnded',
      'columnGroupCollapsedChanged',
      'columnGroupCollapsedChanging',
      'copied',
      'copiedCell',
      'copying',
      'copyingCell',
      'deletedRow',
      'deletingRow',
      'draggedColumn',
      'draggedRow',
      'draggingColumn',
      'draggingRow',
      'filterChanged',
      'formatItem',
      'groupCollapsedChanged',
      'groupCollapsedChanging',
      'itemsSourceChanged',
      'itemsSourceChanging',
      'loadedRows',
      'loadingRows',
      'loadError',
      'loadSuccess',
      'pasted',
      'pastedCell',
      'pasting',
      'pastingCell',
      'pageChanged',
      'pageChanging',
      'prepareCellForEdit',
      'refreshed',
      'refreshing',
      'resizedColumn',
      'resizedRow',
      'resizingColumn',
      'resizingRow',
      'rowAdded',
      'rowEditEnded',
      'rowEditEnding',
      'rowEditStarted',
      'rowEditStarting',
      'scrollPositionChanged',
      'selectionChanged',
      'selectionChanging',
      'sortedColumn',
      'sortingColumn',
      'updatedLayout',
      'updatedView',
      'updatingLayout',
      'updatingView'
    ];
    var i;
    var event;
    for (i = 0; i < names.length; i += 1) {
      event = createWijmoEvent(this, names[i]);
      this.wijmoEvents[names[i]] = event;
      this[names[i]] = event;
    }
  };

  FabGrid.prototype.bindOptionEvent = function(name) {
    var event = this.wijmoEvents ? this.wijmoEvents[name] : null;
    var handler = this.options ? this.options[name] : null;
    if (event && typeof event.addHandler === 'function' && typeof handler === 'function') {
      event.addHandler(handler, this);
    }
  };

  FabGrid.prototype.setLocale = function(locale, messages, silent) {
    this.options.locale = normalizeLocaleName(locale || this.options.locale || getDefaultLocaleName());
    this.options.messages = messages || this.options.messages || null;
    this.locale = this.options.locale;
    this.messages = createLocaleMessages(this.locale, this.options.messages);
    if (!silent && this.root) {
      this.applyLocaleToDom();
      if (this.dateboxPanel && window.getComputedStyle(this.dateboxPanel).display !== 'none') {
        this.renderDateboxPanel();
      }
    if (this.filterMenuColumn && this.isFilterMenuOpen()) {
      this.renderFilterMenu(this.filterMenuColumn);
    }
    if (this.isColumnChooserOpen()) {
      this.renderColumnChooser();
      this.positionColumnChooser(this.columnChooserAnchor);
    }
    if (this.isTopLeftMenuOpen()) {
      this.renderActiveTopLeftMenu();
    }
    this.render();
    }
  };

  FabGrid.prototype.getText = function(path, data) {
    return formatLocaleText(getLocaleValue(this.messages, path), data);
  };

  FabGrid.prototype.createDom = function() {
    var root = document.createElement('div');
    root.className = 'fg-root' + (this.useScrollLinkedHorizontal ? ' fg-scroll-linked-horizontal' : '');
    root.tabIndex = 0;
    root.setAttribute('role', 'grid');

    root.innerHTML =
      '<div class="fg-header">' +
        '<div class="fg-row-header-top"></div>' +
        '<div class="fg-selection-top"></div>' +
        '<div class="fg-header-frozen"></div>' +
        '<div class="fg-header-frozen-right"></div>' +
        '<div class="fg-header-scroll"><div class="fg-header-canvas"></div></div>' +
      '</div>' +
      '<div class="fg-body">' +
        '<div class="fg-body-scroll">' +
          '<div class="fg-size-layer"></div>' +
          '<div class="fg-cell-layer"></div>' +
        '</div>' +
        '<div class="fg-scrollbar-v"><div class="fg-scrollbar-v-track"><div class="fg-scrollbar-v-thumb"></div></div></div>' +
        '<div class="fg-scrollbar-h"><div class="fg-scrollbar-h-track"><div class="fg-scrollbar-h-thumb"></div></div></div>' +
        '<div class="fg-row-header-pane"><div class="fg-row-header-layer"></div></div>' +
        '<div class="fg-selection-pane"><div class="fg-selection-layer"></div></div>' +
        '<div class="fg-frozen-pane"><div class="fg-frozen-layer"></div></div>' +
        '<div class="fg-frozen-pane-right"><div class="fg-frozen-layer-right"></div></div>' +
        '<input class="fg-editor textbox-f" type="text">' +
        '<div class="fg-editor-icons"><button class="fg-editor-trigger" type="button"></button></div>' +
        '<div class="fg-datebox-panel" role="dialog"></div>' +
        '<div class="fg-combobox-panel" role="listbox"></div>' +
        '<div class="fg-color-panel" role="dialog"></div>' +
        '<div class="fg-invalid-tip" role="tooltip"></div>' +
        '<div class="fg-empty"></div>' +
        '<div class="fg-busy-overlay" aria-live="polite"><div class="fg-busy-panel"><span class="fg-busy-spinner"></span><span class="fg-busy-text"></span></div></div>' +
      '</div>' +
      '<div class="fg-filter-menu" role="menu"></div>' +
      '<div class="fg-top-left-menu" role="menu"></div>' +
      '<div class="fg-column-chooser" role="dialog"></div>' +
      '<div class="fg-footer">' +
        '<div class="fg-footer-row-header"></div>' +
        '<div class="fg-footer-selection"></div>' +
        '<div class="fg-footer-frozen"></div>' +
        '<div class="fg-footer-frozen-right"></div>' +
        '<div class="fg-footer-scroll"><div class="fg-footer-canvas"></div></div>' +
      '</div>' +
      '<div class="fg-pager"><div class="fg-pagination" aria-label="Pagination"></div></div>' +
      '<div class="fg-remote-load-mask" aria-live="polite"><div class="fg-remote-load-panel"><span class="fg-remote-load-spinner pagination-loading"></span><span class="fg-remote-load-text"></span></div></div>';

    this.host.innerHTML = '';
    this.host.appendChild(root);

    this.root = root;
    this.header = root.querySelector('.fg-header');
    this.rowHeaderTop = root.querySelector('.fg-row-header-top');
    this.selectionTop = root.querySelector('.fg-selection-top');
    this.headerFrozen = root.querySelector('.fg-header-frozen');
    this.headerFrozenRight = root.querySelector('.fg-header-frozen-right');
    this.headerScroll = root.querySelector('.fg-header-scroll');
    this.headerCanvas = root.querySelector('.fg-header-canvas');
    this.body = root.querySelector('.fg-body');
    this.bodyScroll = root.querySelector('.fg-body-scroll');
    this.sizeLayer = root.querySelector('.fg-size-layer');
    this.cellLayer = root.querySelector('.fg-cell-layer');
    this.verticalScrollbar = root.querySelector('.fg-scrollbar-v');
    this.verticalScrollbarTrack = root.querySelector('.fg-scrollbar-v-track');
    this.verticalScrollbarThumb = root.querySelector('.fg-scrollbar-v-thumb');
    this.horizontalScrollbar = root.querySelector('.fg-scrollbar-h');
    this.horizontalScrollbarTrack = root.querySelector('.fg-scrollbar-h-track');
    this.horizontalScrollbarThumb = root.querySelector('.fg-scrollbar-h-thumb');
    this.rowHeaderPane = root.querySelector('.fg-row-header-pane');
    this.rowHeaderLayer = root.querySelector('.fg-row-header-layer');
    this.selectionPane = root.querySelector('.fg-selection-pane');
    this.selectionLayer = root.querySelector('.fg-selection-layer');
    this.frozenPane = root.querySelector('.fg-frozen-pane');
    this.frozenLayer = root.querySelector('.fg-frozen-layer');
    this.frozenRightPane = root.querySelector('.fg-frozen-pane-right');
    this.frozenRightLayer = root.querySelector('.fg-frozen-layer-right');
    this.editor = root.querySelector('.fg-editor');
    this.editorIconHost = root.querySelector('.fg-editor-icons');
    this.editorTrigger = root.querySelector('.fg-editor-trigger');
    this.dateboxPanel = root.querySelector('.fg-datebox-panel');
    this.comboboxPanel = root.querySelector('.fg-combobox-panel');
    this.colorPanel = root.querySelector('.fg-color-panel');
    this.filterMenu = root.querySelector('.fg-filter-menu');
    this.topLeftMenu = root.querySelector('.fg-top-left-menu');
    this.columnChooser = root.querySelector('.fg-column-chooser');
    this.invalidTip = root.querySelector('.fg-invalid-tip');
    this.footer = root.querySelector('.fg-footer');
    this.footerRowHeader = root.querySelector('.fg-footer-row-header');
    this.footerSelection = root.querySelector('.fg-footer-selection');
    this.footerFrozen = root.querySelector('.fg-footer-frozen');
    this.footerFrozenRight = root.querySelector('.fg-footer-frozen-right');
    this.footerScroll = root.querySelector('.fg-footer-scroll');
    this.footerCanvas = root.querySelector('.fg-footer-canvas');
    this.empty = root.querySelector('.fg-empty');
    this.busyOverlay = root.querySelector('.fg-busy-overlay');
    this.busyText = root.querySelector('.fg-busy-text');
    this.pager = root.querySelector('.fg-pager');
    this.pagination = root.querySelector('.fg-pagination');
    this.remoteLoadMask = root.querySelector('.fg-remote-load-mask');
    this.remoteLoadText = root.querySelector('.fg-remote-load-text');
    this.syncHeaderLayout();
    this.applyLocaleToDom();
    this.applyThemeOptions();
  };

  FabGrid.prototype.applyLocaleToDom = function() {
    if (this.editor) {
      this.editor.setAttribute('aria-label', this.getText('aria.cellEditor'));
    }
    if (this.editorTrigger) {
      this.editorTrigger.setAttribute('aria-label', this.getEditorTriggerLabel());
    }
    if (this.dateboxPanel) {
      this.dateboxPanel.setAttribute('aria-label', this.getText('aria.datePicker'));
    }
    if (this.comboboxPanel) {
      this.comboboxPanel.setAttribute('aria-label', this.getText('aria.comboBoxOptions'));
    }
    if (this.colorPanel) {
      this.colorPanel.setAttribute('aria-label', this.getText('aria.colorPicker'));
    }
    if (this.columnChooser) {
      this.columnChooser.setAttribute('aria-label', this.getText('aria.columnChooser'));
    }
    if (this.topLeftMenu) {
      this.topLeftMenu.setAttribute('aria-label', this.getText('topLeftMenu.ariaLabel'));
    }
    if (this.empty) {
      this.empty.textContent = this.getText('emptyText');
    }
    if (this.pagination) {
      this.pagination.setAttribute('aria-label', this.getText('pagination.ariaLabel'));
    }
  };

  FabGrid.prototype.getEditorTriggerLabel = function() {
    if (this.editorIconConfigs && this.editorIconConfigs.length) {
      return this.editorIconConfigs[0].ariaLabel || this.editorIconConfigs[0].label || this.editorIconConfigs[0].title || this.getText('aria.cellEditor');
    }
    if (this.editorConfig && this.editorConfig.type === 'combobox') {
      return this.getText('aria.openComboBox');
    }
    if (this.editorConfig && this.editorConfig.type === 'color') {
      return this.getText('aria.openColorPicker');
    }
    return this.getText('aria.openDatePicker');
  };

  FabGrid.prototype.applyThemeOptions = function() {
    if (this.root) {
      this.root.style.setProperty('--fg-active-cell-border', Math.max(0, toNumber(this.options.activeCellBorder, 2)) + 'px');
    }
  };

  FabGrid.prototype.bindDomEvents = function() {
    this.bodyScroll.addEventListener('scroll', this._boundScroll);
    this.verticalScrollbar.addEventListener('pointerdown', this._boundVerticalScrollbarPointerDown);
    this.verticalScrollbar.addEventListener('wheel', this._boundVerticalScrollbarWheel, { passive: false });
    this.horizontalScrollbar.addEventListener('pointerdown', this._boundHorizontalScrollbarPointerDown);
    this.root.addEventListener('click', this._boundClick);
    this.root.addEventListener('pointerdown', this._boundFilterMenuClick, true);
    this.root.addEventListener('mousedown', this._boundFilterMenuClick, true);
    this.root.addEventListener('dblclick', this._boundDblClick);
    this.root.addEventListener('contextmenu', this._boundContextMenu);
    this.root.addEventListener('keydown', this._boundKeyDown);
    this.root.addEventListener('mousemove', this._boundMouseMove);
    this.root.addEventListener('mouseleave', this._boundMouseLeave);
    this.root.addEventListener('pointerdown', this._boundPointerDown);
    this.root.addEventListener('wheel', this._boundFixedPaneWheel, { passive: false });
    this.root.addEventListener('touchstart', this._boundFixedPaneTouchStart, { passive: true });
    this.root.addEventListener('touchend', this._boundFixedPaneTouchEnd, { passive: true });
    this.root.addEventListener('touchcancel', this._boundFixedPaneTouchEnd, { passive: true });
    this.root.addEventListener('wheel', this._boundBusyEvent, { passive: false });
    this.root.addEventListener('touchmove', this._boundBusyEvent, { passive: false });
    this.editor.addEventListener('input', this._boundEditorInput);
    this.editor.addEventListener('copy', this._boundEditorCopy);
    this.header.addEventListener('beforeinput', this._boundHeaderSearchBeforeInput);
    this.header.addEventListener('input', this._boundHeaderSearchInput);
    this.header.addEventListener('compositionstart', this._boundHeaderSearchCompositionStart);
    this.header.addEventListener('compositionend', this._boundHeaderSearchCompositionEnd);
    this.editorIconHost.addEventListener('click', this._boundEditorTriggerClick);
    this.dateboxPanel.addEventListener('click', this._boundDateboxClick);
    this.dateboxPanel.addEventListener('change', this._boundDateboxChange);
    this.comboboxPanel.addEventListener('mousedown', this._boundComboboxMouseDown);
    this.colorPanel.addEventListener('pointerdown', this._boundColorPanelPointerDown);
    this.colorPanel.addEventListener('pointermove', this._boundColorPanelPointerMove);
    this.colorPanel.addEventListener('pointerup', this._boundColorPanelPointerUp);
    this.colorPanel.addEventListener('pointercancel', this._boundColorPanelPointerUp);
    this.filterMenu.addEventListener('pointerdown', this._boundFilterMenuClick, true);
    this.filterMenu.addEventListener('mousedown', this._boundFilterMenuClick, true);
    this.filterMenu.addEventListener('click', this._boundFilterMenuClick);
    this.filterMenu.addEventListener('input', this._boundExcelFilterMenuInput);
    this.filterMenu.addEventListener('change', this._boundExcelFilterMenuInput);
    this.columnChooser.addEventListener('change', this._boundColumnChooserChange);
    this.topLeftMenu.addEventListener('click', this._boundTopLeftMenuClick);
    this.pagination.addEventListener('click', this._boundPaginationClick);
    this.pagination.addEventListener('change', this._boundPaginationChange);
    this.pagination.addEventListener('keydown', this._boundPaginationKeyDown);
    document.addEventListener('pointerdown', this._boundFilterMenuClick, true);
    document.addEventListener('mousedown', this._boundFilterMenuClick, true);
    document.addEventListener('click', this._boundFilterMenuClick, true);
    document.addEventListener('mousedown', this._boundDocumentMouseDown);
    document.addEventListener('fullscreenchange', this._boundFullscreenChange);
    document.addEventListener('webkitfullscreenchange', this._boundFullscreenChange);
    this.editor.addEventListener('beforeinput', this._boundEditorBeforeInput);
    window.addEventListener('resize', this._boundResize);
  };























  FabGrid.prototype.setColumns = function(columns, silent) {
    var i;
    var col;
    this.columns = [];
    for (i = 0; i < (columns || []).length; i += 1) {
      col = mergeOptions({
        binding: '',
        header: '',
        width: 120,
        minWidth: 48,
        align: '',
        dataType: 'string',
        visible: true,
        formatter: null,
        cellTemplate: null,
        footer: null,
        footerFormatter: null,
        aggregate: null,
        editor: null,
        thousandsSeparator: null,
        mask: '',
        autoUnmask: false,
        maskValueIncludesLiterals: null,
        readOnly: false
      }, columns[i]);
      defineColumnCellTemplate(this, col, col.cellTemplate);
      col.editor = normalizeEditorConfig(col.editor, col);
      col._index = i;
      col._width = Math.max(1, toNumber(col.width, 120), toNumber(col.minWidth, 48));
      this.columns.push(col);
    }
    this.updateLayout();
    if (!silent) {
      this.refresh();
    }
  };

  function defineColumnCellTemplate(grid, column, initialValue) {
    var template = normalizeCellTemplate(initialValue);
    Object.defineProperty(column, 'cellTemplate', {
      configurable: true,
      enumerable: true,
      get: function() {
        return template;
      },
      set: function(value) {
        var normalized = normalizeCellTemplate(value);
        if (template === normalized) {
          return;
        }
        template = normalized;
        column._cellTemplateSource = null;
        column._cellTemplateRenderer = null;
        if (!grid.disposed && typeof grid.invalidate === 'function') {
          grid.invalidate();
        }
      }
    });
  }

  function normalizeCellTemplate(value) {
    return typeof value === 'function' || typeof value === 'string' ? value : null;
  }

  FabGrid.prototype.setColumnVisible = function(column, visible) {
    var target = column;
    var wasEditingTarget;
    if (typeof column === 'number') {
      target = this.columns[column] || this.visibleColumns[column];
    }
    if (!target || this.columns.indexOf(target) < 0) {
      return false;
    }
    wasEditingTarget = this.editing && this.visibleColumns[this.editing.col] === target;
    target.visible = visible !== false;
    this.updateLayout();
    if (wasEditingTarget) {
      this.finishEditing(false);
    }
    this.clampSelection();
    this.refresh();
    this.emit('columnVisibilityChanged', {
      column: target,
      visible: target.visible !== false
    });
    return true;
  };

  FabGrid.prototype.setFrozenColumns = function(count) {
    this.options.frozenColumns = normalizeNonNegativeInteger(count, 0);
    this.refresh();
  };

  FabGrid.prototype.setFrozenRightColumns = function(count) {
    this.options.frozenRightColumns = normalizeNonNegativeInteger(count, 0);
    this.refresh();
  };

  FabGrid.prototype.setRowHeaderWidth = function(width) {
    this.options.rowHeaderWidth = Math.max(0, toNumber(width, DEFAULT_OPTIONS.rowHeaderWidth));
    this.refresh();
  };

  FabGrid.prototype.getRowCollection = function() {
    var grid = this;
    if (!this._rowCollection) {
      this._rowCollection = this.view.map(function(dataItem, index) {
        var RowType = grid.isRowGroup(dataItem) || grid.isRowGroupFooter(dataItem) ? GroupRow : Row;
        return new RowType(grid, index, dataItem);
      });
    }
    return this._rowCollection;
  };

  FabGrid.prototype.setShowRowHeaders = function(value) {
    var mode = normalizeRowHeaderMode(value);
    var changed = this.options.showRowHeaders !== mode;
    this.options.showRowHeaders = mode;
    this.updateLayout();
    this.refresh();
    if (changed) {
      this.emit('rowHeaderModeChanged', {
        mode: mode,
        showRowHeaders: mode
      });
    }
  };

  FabGrid.prototype.setShowFooter = function(value) {
    this.options.showFooter = value === true;
    this.refresh();
  };

  FabGrid.prototype.setAllowFiltering = function(value) {
    var enabled = value !== false;
    var changed = this.options.allowFiltering !== enabled;
    if (!changed) {
      return;
    }
    this.options.allowFiltering = enabled;
    if (!enabled) {
      this.columnSearchValues = {};
      this.columnSearchOperators = {};
      this.hasColumnSearch = false;
      this.excelFilters = {};
    }
    this.cancelHeaderSearchTimer();
    this.hideFilterMenu();
    this.applyFilterChange(true, 'allowFiltering');
  };

  FabGrid.prototype.setShowSearchRow = function(value) {
    var visible = value === true;
    var changed = this.options.showSearchRow !== visible;
    var hadFilter;
    if (!changed) {
      return;
    }
    hadFilter = visible ? hasExcelFilterEntries(this.excelFilters) : this.hasColumnSearch === true;
    if (visible) {
      this.excelFilters = {};
    } else {
      this.columnSearchValues = {};
      this.columnSearchOperators = {};
      this.hasColumnSearch = false;
    }
    this.options.showSearchRow = visible;
    this.cancelHeaderSearchTimer();
    this.hideFilterMenu();
    this.applyFilterChange(true, 'searchRowVisibility');
    this.emit('searchRowVisibilityChanged', {
      visible: visible,
      showSearchRow: visible,
      clearedFilter: hadFilter
    });
  };

  FabGrid.prototype.setEditMode = function(value) {
    var enabled = value === true;
    this.options.allowEditing = enabled;
    this.options.editOnSelect = enabled;
    if (!enabled) {
      this.finishEditing(false);
    }
    this.render();
  };

  FabGrid.prototype.setMultiSelectRows = function(value) {
    this.options.multiSelectRows = value === true;
    if (!this.options.multiSelectRows) {
      this.selectedRowMap = {};
      this.resetSelectedItemSelection([]);
      if (this.rowSelection == null && this.view.length) {
        this.rowSelection = this.selection.row;
      }
    }
    this.updateLayout();
    this.refresh();
  };

  FabGrid.prototype.setPage = function(pageNumber) {
    return this.selectPage(pageNumber, this.options.pageSize);
  };

  FabGrid.prototype.setPageSize = function(pageSize) {
    return this.selectPage(1, pageSize);
  };

  FabGrid.prototype.selectPage = function(pageNumber, pageSize) {
    var nextPageSize;
    var pageCount;
    var nextPageNumber;
    var args;
    nextPageSize = Math.max(1, Math.floor(toNumber(pageSize, this.options.pageSize)));
    pageCount = Math.max(1, Math.ceil(this.paginationTotal / nextPageSize));
    nextPageNumber = clamp(Math.floor(toNumber(pageNumber, 1)), 1, pageCount);
    args = {
      pageNumber: nextPageNumber,
      pageSize: nextPageSize,
      total: this.paginationTotal
    };
    if (this.emit('pageChanging', args) === false) {
      return false;
    }
    this.options.pageNumber = nextPageNumber;
    this.options.pageSize = nextPageSize;
    if (this.options.pager && typeof this.options.pager === 'object') {
      this.options.pager.pageNumber = nextPageNumber;
      this.options.pager.pageSize = nextPageSize;
    }
    if (this.options.remote === true) {
      this.resetVerticalScroll();
      this.renderPagination();
      return this.load().then(function(success) {
        if (success) {
          this.emit('pageChanged', args);
        }
        return success;
      }.bind(this));
    }
    this.applyView();
    this.resetVerticalScroll();
    this.refresh();
    this.emit('pageChanged', args);
    return true;
  };

  FabGrid.prototype.getPager = function() {
    return this.pager;
  };

  FabGrid.prototype.setHeaderDisplayMode = function(mode) {
    mode = normalizeHeaderDisplayMode(mode);
    this.options.headerDisplayMode = mode;
    this.headerDisplayMode = mode;
    if (this.root) {
      this.renderHeaders(this.columnRange);
    }
  };

  FabGrid.prototype.toggleHeaderDisplayMode = function() {
    this.setHeaderDisplayMode(this.headerDisplayMode === 'binding' ? 'header' : 'binding');
    return this.headerDisplayMode;
  };

  FabGrid.prototype.getHeaderDisplayMode = function() {
    return this.headerDisplayMode || 'header';
  };



















  FabGrid.prototype.cancelHeaderSearchTimer = function() {
    if (this.headerSearchTimer) {
      window.clearTimeout(this.headerSearchTimer);
      this.headerSearchTimer = 0;
    }
  };

  FabGrid.prototype.scheduleHeaderSearch = function(colIndex, selectionStart, selectionEnd) {
    var self = this;
    var delay = Math.max(0, toNumber(this.options.searchDelay, DEFAULT_OPTIONS.searchDelay));
    this.cancelHeaderSearchTimer();
    if (delay === 0) {
      this.applyHeaderSearch(colIndex, selectionStart, selectionEnd);
      return;
    }
    this.headerSearchTimer = window.setTimeout(function() {
      var activeInput = self.getActiveHeaderSearchInput();
      self.headerSearchTimer = 0;
      if (activeInput) {
        colIndex = toNumber(activeInput.getAttribute('data-col'), colIndex);
        selectionStart = activeInput.selectionStart;
        selectionEnd = activeInput.selectionEnd;
        self.applyHeaderSearch(colIndex, selectionStart, selectionEnd);
      } else {
        self.applyFilterChange(false, 'headerSearch');
      }
    }, delay);
  };

  FabGrid.prototype.refresh = function() {
    if (this.emit('refreshing', {}) === false) {
      return;
    }
    this.render();
    this.emit('refreshed', {});
  };

  FabGrid.prototype.invalidate = function() {
    this.scheduleRender();
  };

  FabGrid.prototype.hitTest = function(point, y) {
    var target = getHitTestTarget(point, y);
    var hitPoint = getHitTestPoint(point, target);
    var info = createEmptyHitTestInfo(this, target, hitPoint);
    var ownerRoot = findClosestGridElement(target, ['fg-root'], this.host);
    var cell;
    var indexedElement;
    var rect;
    var pageXOffset = typeof window !== 'undefined' ? window.pageXOffset || 0 : 0;
    var pageYOffset = typeof window !== 'undefined' ? window.pageYOffset || 0 : 0;
    var x;
    var yPosition;
    var row;
    var col;
    var column;
    if (!target || ownerRoot !== this.root) {
      return info;
    }
    cell = findClosestGridElement(target, [
      'fg-cell',
      'fg-row-header-cell',
      'fg-selection-cell',
      'fg-header-cell',
      'fg-row-header-top',
      'fg-selection-top',
      'fg-footer-cell',
      'fg-footer-row-header',
      'fg-footer-selection'
    ], this.root);
    if (!cell) {
      return info;
    }
    if (cell.classList.contains('fg-header-cell')) {
      info.panel = this.columnHeaders;
      info.isSearchRow = !!findClosestGridElement(target, ['fg-header-search'], cell);
      if (!info.isSearchRow && this.getSearchRowHeight() > 0 && typeof cell.getBoundingClientRect === 'function') {
        rect = cell.getBoundingClientRect();
        info.isSearchRow = hitPoint.y - pageYOffset >= rect.top + this.getHeaderTitleHeight();
      }
      info.row = info.isSearchRow ? 1 : 0;
    } else if (cell.classList.contains('fg-row-header-cell') || cell.classList.contains('fg-selection-cell')) {
      info.panel = this.rowHeaders;
      row = parseInt(cell.getAttribute('data-row'), 10);
      info.row = isFiniteNumber(row) ? row : -1;
      info.col = 0;
    } else if (cell.classList.contains('fg-row-header-top') || cell.classList.contains('fg-selection-top')) {
      info.panel = this.topLeftCells;
      info.row = 0;
      info.col = 0;
    } else if (cell.classList.contains('fg-footer-cell')) {
      info.panel = this.columnFooters;
      info.row = 0;
    } else if (cell.classList.contains('fg-footer-row-header') || cell.classList.contains('fg-footer-selection')) {
      info.panel = this.bottomLeftCells;
      info.row = 0;
      info.col = 0;
    } else {
      info.panel = this.cells;
      row = parseInt(cell.getAttribute('data-row'), 10);
      info.row = isFiniteNumber(row) ? row : -1;
    }
    info.cellType = info.panel ? info.panel.cellType : CellType.None;
    if (info.col < 0) {
      indexedElement = findClosestGridAttribute(target, 'data-col', cell);
      col = parseInt(indexedElement ? indexedElement.getAttribute('data-col') : cell.getAttribute('data-col'), 10);
      info.viewCol = isFiniteNumber(col) ? col : -1;
      column = info.viewCol >= 0 && this.visibleColumns ? this.visibleColumns[info.viewCol] : null;
      info.column = column || null;
      info.col = column && column._index != null ? column._index : info.viewCol;
    }
    info.range = info.row >= 0 && info.col >= 0 ? {
      row: info.row,
      col: info.col,
      row2: info.row,
      col2: info.col
    } : null;
    info.mergedRange = null;
    info.cell = cell;
    if (typeof cell.getBoundingClientRect === 'function') {
      rect = cell.getBoundingClientRect();
      x = hitPoint.x - pageXOffset;
      yPosition = hitPoint.y - pageYOffset;
      info.edgeTop = Math.abs(yPosition - rect.top) <= 4;
      info.edgeRight = Math.abs(x - rect.right) <= 4;
      info.edgeBottom = Math.abs(yPosition - rect.bottom) <= 4;
      info.edgeLeft = Math.abs(x - rect.left) <= 4;
      info.edgeFarTop = Math.abs(yPosition - rect.top) <= 1;
      info.edgeFarRight = Math.abs(x - rect.right) <= 1;
      info.edgeFarBottom = Math.abs(yPosition - rect.bottom) <= 1;
      info.edgeFarLeft = Math.abs(x - rect.left) <= 1;
    }
    return info;
  };

  FabGrid.prototype.getHeaderHeight = function() {
    return toNumber(this.options.headerHeight, DEFAULT_OPTIONS.headerHeight) + this.getSearchRowHeight();
  };

  FabGrid.prototype.getHeaderTitleHeight = function() {
    return toNumber(this.options.headerHeight, DEFAULT_OPTIONS.headerHeight);
  };

  FabGrid.prototype.getSearchRowHeight = function() {
    var fallback = toNumber(this.options.rowHeight, DEFAULT_OPTIONS.rowHeight);
    var height = this.options.searchRowHeight == null ? fallback : toNumber(this.options.searchRowHeight, fallback);
    return this.options.allowFiltering !== false && this.options.showSearchRow === true ? Math.max(22, height) : 0;
  };

  FabGrid.prototype.syncHeaderLayout = function() {
    var height = this.getHeaderHeight();
    var titleHeight = this.getHeaderTitleHeight();
    var searchHeight = this.getSearchRowHeight();
    if (!this.header || !this.body) {
      return;
    }
    this.root.style.setProperty('--fg-header-title-height', titleHeight + 'px');
    this.root.style.setProperty('--fg-search-row-height', searchHeight + 'px');
    this.header.style.height = height + 'px';
    this.body.style.top = height + 'px';
  };

  FabGrid.prototype.dispose = function() {
    var name;
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    unregisterControl(this.host, this);
    if (this.raf) {
      cancelAnimationFrame(this.raf);
    }
    if (this.scrollLinkedHorizontalRaf) {
      cancelAnimationFrame(this.scrollLinkedHorizontalRaf);
      this.scrollLinkedHorizontalRaf = 0;
    }
    if (this.headerSearchFocusRaf) {
      cancelAnimationFrame(this.headerSearchFocusRaf);
      this.headerSearchFocusRaf = 0;
    }
    if (this.cellRangeAutoScrollRaf) {
      cancelAnimationFrame(this.cellRangeAutoScrollRaf);
      this.cellRangeAutoScrollRaf = 0;
    }
    this.cellRangeDragState = null;
    this.cellRangeClickCandidate = null;
    this.suppressCellRangeClick = false;
    this.suppressCellRangeClickEvent = false;
    this.cancelPendingCellDblClick();
    this.cancelHeaderSearchTimer();
    this.finishEditing(false);
    this.unbindPointerInteractionEvents();
    this.unbindVerticalScrollbarDragEvents();
    this.unbindHorizontalScrollbarDragEvents();
    this.unbindRowDragEvents();
    this.removeEventListener();
    this.bodyScroll.removeEventListener('scroll', this._boundScroll);
    this.verticalScrollbar.removeEventListener('pointerdown', this._boundVerticalScrollbarPointerDown);
    this.verticalScrollbar.removeEventListener('wheel', this._boundVerticalScrollbarWheel);
    this.horizontalScrollbar.removeEventListener('pointerdown', this._boundHorizontalScrollbarPointerDown);
    this.root.removeEventListener('click', this._boundClick);
    this.root.removeEventListener('pointerdown', this._boundFilterMenuClick, true);
    this.root.removeEventListener('mousedown', this._boundFilterMenuClick, true);
    this.root.removeEventListener('dblclick', this._boundDblClick);
    this.root.removeEventListener('contextmenu', this._boundContextMenu);
    this.root.removeEventListener('keydown', this._boundKeyDown);
    this.root.removeEventListener('mousemove', this._boundMouseMove);
    this.root.removeEventListener('mouseleave', this._boundMouseLeave);
    this.root.removeEventListener('pointerdown', this._boundPointerDown);
    this.root.removeEventListener('wheel', this._boundFixedPaneWheel);
    this.root.removeEventListener('touchstart', this._boundFixedPaneTouchStart);
    this.root.removeEventListener('touchend', this._boundFixedPaneTouchEnd);
    this.root.removeEventListener('touchcancel', this._boundFixedPaneTouchEnd);
    this.root.removeEventListener('wheel', this._boundBusyEvent);
    this.root.removeEventListener('touchmove', this._boundBusyEvent);
    this.editor.removeEventListener('input', this._boundEditorInput);
    this.editor.removeEventListener('copy', this._boundEditorCopy);
    this.header.removeEventListener('beforeinput', this._boundHeaderSearchBeforeInput);
    this.header.removeEventListener('input', this._boundHeaderSearchInput);
    this.header.removeEventListener('compositionstart', this._boundHeaderSearchCompositionStart);
    this.header.removeEventListener('compositionend', this._boundHeaderSearchCompositionEnd);
    this.editorIconHost.removeEventListener('click', this._boundEditorTriggerClick);
    this.dateboxPanel.removeEventListener('click', this._boundDateboxClick);
    this.dateboxPanel.removeEventListener('change', this._boundDateboxChange);
    this.comboboxPanel.removeEventListener('mousedown', this._boundComboboxMouseDown);
    this.colorPanel.removeEventListener('pointerdown', this._boundColorPanelPointerDown);
    this.colorPanel.removeEventListener('pointermove', this._boundColorPanelPointerMove);
    this.colorPanel.removeEventListener('pointerup', this._boundColorPanelPointerUp);
    this.colorPanel.removeEventListener('pointercancel', this._boundColorPanelPointerUp);
    this.filterMenu.removeEventListener('pointerdown', this._boundFilterMenuClick, true);
    this.filterMenu.removeEventListener('mousedown', this._boundFilterMenuClick, true);
    this.filterMenu.removeEventListener('click', this._boundFilterMenuClick);
    this.filterMenu.removeEventListener('input', this._boundExcelFilterMenuInput);
    this.filterMenu.removeEventListener('change', this._boundExcelFilterMenuInput);
    this.columnChooser.removeEventListener('change', this._boundColumnChooserChange);
    this.topLeftMenu.removeEventListener('click', this._boundTopLeftMenuClick);
    this.pagination.removeEventListener('click', this._boundPaginationClick);
    this.pagination.removeEventListener('change', this._boundPaginationChange);
    this.pagination.removeEventListener('keydown', this._boundPaginationKeyDown);
    document.removeEventListener('pointerdown', this._boundFilterMenuClick, true);
    document.removeEventListener('mousedown', this._boundFilterMenuClick, true);
    document.removeEventListener('click', this._boundFilterMenuClick, true);
    document.removeEventListener('mousedown', this._boundDocumentMouseDown);
    document.removeEventListener('fullscreenchange', this._boundFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', this._boundFullscreenChange);
    this.editor.removeEventListener('beforeinput', this._boundEditorBeforeInput);
    window.removeEventListener('resize', this._boundResize);
    this._autoSizeCanvas = null;
    this._autoSizeContext = null;
    this.host.innerHTML = '';
    this.events = {};
    for (name in this.wijmoEvents) {
      if (Object.prototype.hasOwnProperty.call(this.wijmoEvents, name)) {
        this.wijmoEvents[name].clearHandlers();
      }
    }
  };

  FabGrid.prototype.setBusy = function(value, text) {
    this.busy = value === true;
    if (!this.busyOverlay) {
      return;
    }
    this.root.setAttribute('aria-busy', this.busy ? 'true' : 'false');
    if (this.busyText) {
      this.busyText.textContent = text || this.options.exportBusyText || this.getText('workingText');
    }
    this.busyOverlay.style.display = this.busy ? 'flex' : 'none';
  };

  FabGrid.prototype.blockBusyEvent = function(event) {
    if (!this.busy) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  FabGrid.prototype.handleFixedPaneTouchStart = function(event) {
    var touch;
    var target;
    this.fixedPaneTouchTap = null;
    if (this.busy || !this.bodyScroll || event.touches.length !== 1) {
      return;
    }
    touch = event.touches[0];
    target = this.getFixedPaneTouchTarget(touch.clientX, touch.clientY);
    if (!target) {
      return;
    }
    this.fixedPaneTouchTap = {
      x: touch.clientX,
      y: touch.clientY,
      row: target.row,
      col: target.col,
      area: target.area
    };
  };

  FabGrid.prototype.handleFixedPaneTouchEnd = function(event) {
    var state = this.fixedPaneTouchTap;
    var touch;
    var dx;
    var dy;
    if (!state || this.busy || event.type === 'touchcancel') {
      this.fixedPaneTouchTap = null;
      return;
    }
    touch = event.changedTouches && event.changedTouches[0];
    this.fixedPaneTouchTap = null;
    if (!touch) {
      return;
    }
    dx = Math.abs(touch.clientX - state.x);
    dy = Math.abs(touch.clientY - state.y);
    if (dx > 8 || dy > 8) {
      return;
    }
    this.selectFixedPaneTouchRow(state.row, state.col, state.area);
  };

  FabGrid.prototype.selectFixedPaneTouchRow = function(rowIndex, colIndex, area) {
    if (rowIndex < 0 || rowIndex >= this.view.length) {
      return;
    }
    if (this.editing && (this.editing.row !== rowIndex || this.editing.col !== colIndex)) {
      if (this.finishEditing(true) === false) {
        return;
      }
    }
    if (area === 'selection' || area === 'rowHeader') {
      this.toggleRowSelection(rowIndex, colIndex);
    } else if (this.shouldEditOnSelect(rowIndex, colIndex)) {
      this.selectRow(rowIndex, colIndex);
    } else {
      this.toggleRowSelection(rowIndex, colIndex);
    }
    this.scrollIntoView(rowIndex, colIndex);
    this.fixedPaneTouchClickUntil = Date.now() + 700;
    this.root.focus();
  };

  FabGrid.prototype.getFixedPaneTouchTarget = function(clientX, clientY) {
    var bodyRect;
    var rowIndex;
    var target;
    if (!this.bodyScroll || !this.view.length) {
      return null;
    }
    bodyRect = this.bodyScroll.getBoundingClientRect();
    if (clientY < bodyRect.top || clientY > bodyRect.bottom) {
      return null;
    }
    rowIndex = Math.floor((this.bodyScroll.scrollTop + clientY - bodyRect.top) / this.options.rowHeight);
    if (rowIndex < 0 || rowIndex >= this.view.length) {
      return null;
    }
    target = this.getFixedPaneTouchColumn(clientX, clientY, this.frozenPane, 0, this.frozenColumns, 'left');
    if (target) {
      target.row = rowIndex;
      return target;
    }
    target = this.getFixedPaneTouchColumn(clientX, clientY, this.frozenRightPane, this.scrollableColumnEnd, this.visibleColumns.length, 'right');
    if (target) {
      target.row = rowIndex;
      return target;
    }
    if (isPointInElement(clientX, clientY, this.selectionPane)) {
      return { row: rowIndex, col: this.selection.col, area: 'selection' };
    }
    if (isPointInElement(clientX, clientY, this.rowHeaderPane)) {
      return { row: rowIndex, col: this.selection.col, area: 'rowHeader' };
    }
    return null;
  };

  FabGrid.prototype.getFixedPaneTouchColumn = function(clientX, clientY, pane, startCol, endCol, area) {
    var rect;
    var localX;
    var i;
    var column;
    if (!pane || pane.style.display === 'none' || !isPointInElement(clientX, clientY, pane)) {
      return null;
    }
    rect = pane.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right) {
      return null;
    }
    localX = clientX - rect.left;
    for (i = startCol; i < endCol; i += 1) {
      column = this.visibleColumns[i];
      if (!column) {
        continue;
      }
      if (area === 'right') {
        if (localX >= column._left - this.frozenRightStartLeft && localX < column._left - this.frozenRightStartLeft + column._width) {
          return { col: i, area: area };
        }
      } else if (localX >= column._left && localX < column._left + column._width) {
        return { col: i, area: area };
      }
    }
    return null;
  };

  FabGrid.prototype.handleFixedPaneWheel = function(event) {
    var isFixedTarget;
    var isScrollableTarget;
    var maxScrollTop;
    var maxScrollLeft;
    var deltaFactor = 1;
    var deltaX;
    var deltaY;
    var nextTop;
    var nextLeft;
    if (this.busy || !this.bodyScroll || event.ctrlKey) {
      return;
    }
    isFixedTarget = this.isFixedPaneScrollTarget(event.target);
    isScrollableTarget = !!closest(event.target, 'fg-body-scroll');
    if (!isFixedTarget && !isScrollableTarget) {
      return;
    }
    if (event.deltaMode === 1) {
      deltaFactor = Math.max(1, this.options.rowHeight);
    } else if (event.deltaMode === 2) {
      deltaFactor = Math.max(1, this.getScrollableContentHeight());
    }
    deltaX = event.deltaX * deltaFactor;
    deltaY = event.deltaY * deltaFactor;
    if (event.shiftKey && !deltaX && deltaY) {
      deltaX = deltaY;
      deltaY = 0;
    }
    maxScrollTop = Math.max(0, this.bodyScroll.scrollHeight - this.bodyScroll.clientHeight);
    maxScrollLeft = Math.max(0, this.bodyScroll.scrollWidth - this.bodyScroll.clientWidth);
    nextTop = clamp(this.bodyScroll.scrollTop + deltaY, 0, maxScrollTop);
    nextLeft = clamp(this.bodyScroll.scrollLeft + deltaX, 0, maxScrollLeft);
    if (nextTop === this.bodyScroll.scrollTop && nextLeft === this.bodyScroll.scrollLeft) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.bodyScroll.scrollTop = nextTop;
    this.bodyScroll.scrollLeft = nextLeft;
    this.handleScroll();
  };

  FabGrid.prototype.isFixedPaneScrollTarget = function(target) {
    return !!(
      closest(target, 'fg-frozen-pane') ||
      closest(target, 'fg-frozen-pane-right') ||
      closest(target, 'fg-row-header-pane') ||
      closest(target, 'fg-selection-pane')
    );
  };






  function mergeOptions(base, override) {
    var result = {};
    var key;
    for (key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) {
        result[key] = base[key];
      }
    }
    for (key in override) {
      if (Object.prototype.hasOwnProperty.call(override, key)) {
        result[key] = override[key];
      }
    }
    return result;
  }

  function getLocaleMap() {
    return typeof FABGRID_LOCALES !== 'undefined' ? FABGRID_LOCALES : FABGRID_INTERNAL_LOCALES;
  }

  function getDefaultLocaleName() {
    return typeof FABGRID_DEFAULT_LOCALE !== 'undefined' ? FABGRID_DEFAULT_LOCALE : 'zh-TW';
  }

  function normalizeLocaleName(locale) {
    var name = locale == null ? '' : String(locale);
    var lower = name.toLowerCase();
    var locales = getLocaleMap();
    if (Object.prototype.hasOwnProperty.call(locales, name)) {
      return name;
    }
    if (lower === 'zh' || lower === 'zh-tw' || lower === 'zh-hant' || lower === 'zh-hant-tw' || lower === 'tw') {
      return 'zh-TW';
    }
    if (lower === 'zh-cn' || lower === 'zh-hans' || lower === 'zh-hans-cn' || lower === 'cn') {
      return 'zh-CN';
    }
    if (lower === 'en' || lower.indexOf('en-') === 0) {
      return 'en';
    }
    return Object.prototype.hasOwnProperty.call(locales, getDefaultLocaleName()) ? getDefaultLocaleName() : 'en';
  }

  function normalizeHeaderDisplayMode(mode) {
    mode = mode == null ? 'header' : String(mode).toLowerCase();
    if (mode === 'binding' || mode === 'field' || mode === 'name' || mode === 'binging') {
      return 'binding';
    }
    return 'header';
  }

  function normalizeRowHeaderMode(value) {
    var mode;
    if (value === false || value == null) {
      return false;
    }
    mode = String(value).toLowerCase();
    if (mode === 'false' || mode === 'none' || mode === 'off' || mode === 'hidden') {
      return false;
    }
    if (mode === 'cell' || mode === 'cells' || mode === 'blank') {
      return 'cell';
    }
    return true;
  }

  function isHotKey(event, hotKey) {
    var keys;
    var i;
    var text;
    var parts;
    var key = '';
    var expected = {
      alt: false,
      ctrl: false,
      meta: false,
      shift: false
    };
    if (!hotKey || hotKey === 'none') {
      return false;
    }
    if (typeof hotKey === 'function') {
      return hotKey(event) === true;
    }
    if (Array.isArray(hotKey)) {
      for (i = 0; i < hotKey.length; i += 1) {
        if (isHotKey(event, hotKey[i])) {
          return true;
        }
      }
      return false;
    }
    text = String(hotKey).toLowerCase().replace(/\s+/g, '');
    if (!text) {
      return false;
    }
    parts = text.split('+');
    for (i = 0; i < parts.length; i += 1) {
      if (parts[i] === 'alt' || parts[i] === 'option') {
        expected.alt = true;
      } else if (parts[i] === 'ctrl' || parts[i] === 'control') {
        expected.ctrl = true;
      } else if (parts[i] === 'cmd' || parts[i] === 'command' || parts[i] === 'meta') {
        expected.meta = true;
      } else if (parts[i] === 'shift') {
        expected.shift = true;
      } else {
        key = parts[i];
      }
    }
    if (event.altKey !== expected.alt || event.ctrlKey !== expected.ctrl || event.metaKey !== expected.meta || event.shiftKey !== expected.shift) {
      return false;
    }
    keys = [
      String(event.key || '').toLowerCase(),
      String(event.code || '').toLowerCase()
    ];
    return keys.indexOf(key) >= 0;
  }

  function createLocaleMessages(locale, overrides) {
    var locales = getLocaleMap();
    var baseName = normalizeLocaleName(locale);
    var fallbackName = getDefaultLocaleName();
    var messages = {};
    if (locales.en) {
      mergeLocaleMessages(messages, locales.en);
    }
    if (locales[fallbackName] && fallbackName !== 'en') {
      mergeLocaleMessages(messages, locales[fallbackName]);
    }
    if (locales[baseName]) {
      mergeLocaleMessages(messages, locales[baseName]);
    }
    if (overrides) {
      mergeLocaleMessages(messages, overrides);
    }
    return messages;
  }

  function mergeLocaleMessages(target, source) {
    var key;
    var value;
    if (!source) {
      return target;
    }
    for (key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        value = source[key];
        if (isPlainObject(value)) {
          target[key] = mergeLocaleMessages(isPlainObject(target[key]) ? target[key] : {}, value);
        } else if (Array.isArray(value)) {
          target[key] = value.slice();
        } else {
          target[key] = value;
        }
      }
    }
    return target;
  }

  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
  }

  function getLocaleValue(messages, path) {
    var parts = String(path || '').split('.');
    var value = messages;
    var i;
    for (i = 0; i < parts.length; i += 1) {
      if (value == null) {
        return '';
      }
      value = value[parts[i]];
    }
    return value == null ? '' : value;
  }

  function formatLocaleText(value, data) {
    if (typeof value !== 'string') {
      return value;
    }
    if (!data) {
      return value;
    }
    return value.replace(/\{([^}]+)\}/g, function(match, key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : match;
    });
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function trimText(value) {
    return String(value == null ? '' : value).replace(/^\s+|\s+$/g, '');
  }

  function normalizeClassName(value) {
    return trimText(value).replace(/\./g, ' ');
  }

  function normalizeEditorConfig(editor, column) {
    var type;
    var options;
    if (editor == null || editor === true) {
      type = getDefaultEditorType(column);
      options = {};
    } else if (typeof editor === 'string') {
      type = editor;
      options = {};
    } else if (typeof editor === 'object') {
      type = editor.type || getDefaultEditorType(column);
      options = getEditorOptions(editor);
    } else {
      type = getDefaultEditorType(column);
      options = {};
    }
    type = normalizeEditorType(type);
    return {
      type: type,
      options: options
    };
  }

  function getColumnEditorConfig(column) {
    if (column && column.editor) {
      return normalizeEditorConfig(column.editor, column);
    }
    return normalizeEditorConfig(null, column || {});
  }

  function getEditorOptions(editor) {
    var result = {};
    var direct = {};
    var key;
    for (key in editor) {
      if (Object.prototype.hasOwnProperty.call(editor, key) && key !== 'type' && key !== 'options') {
        direct[key] = editor[key];
      }
    }
    result = mergeOptions(result, direct);
    result = mergeOptions(result, editor.options || {});
    return result;
  }

  function getEditorIconConfigs(config) {
    var options = config && config.options ? config.options : {};
    return normalizeIconConfigs(config && config.icons ? config.icons : options.icons);
  }

  function getColumnSearchIconConfigs(column) {
    var search = column && column.search && typeof column.search === 'object' ? column.search : null;
    var config;
    if (search && Object.prototype.hasOwnProperty.call(search, 'icons')) {
      return normalizeIconConfigs(search.icons);
    }
    if (column && Object.prototype.hasOwnProperty.call(column, 'searchIcons')) {
      return normalizeIconConfigs(column.searchIcons);
    }
    config = getColumnEditorConfig(column);
    if (config && isDateLikeEditorType(config.type)) {
      return [{ iconCls: 'icon-datebox', builtin: 'datebox' }];
    }
    if (config && config.type === 'combobox') {
      return [{ iconCls: 'fg-editor-trigger-combobox', builtin: 'combobox' }];
    }
    if (config && config.type === 'color') {
      return [{ iconCls: 'fg-editor-trigger-color', builtin: 'color' }];
    }
    return [];
  }

  function normalizeIconConfigs(icons) {
    var result = [];
    var i;
    var icon;
    if (!icons) {
      return result;
    }
    if (!Array.isArray(icons)) {
      icons = [icons];
    }
    for (i = 0; i < icons.length; i += 1) {
      icon = icons[i];
      if (icon === false || icon == null) {
        continue;
      }
      if (typeof icon === 'function') {
        icon = { onClick: icon };
      } else if (typeof icon === 'string') {
        icon = { iconCls: icon };
      }
      if (typeof icon === 'object') {
        result.push(icon);
      }
    }
    return result;
  }

  function getEditorIconConfigWidth(icons, type) {
    if (!icons || !icons.length) {
      return isDateLikeEditorType(type) || type === 'combobox' || type === 'color' ? 22 : 0;
    }
    return getIconConfigWidth(icons, 22);
  }

  function getIconConfigWidth(icons, fallback) {
    var width = 0;
    var i;
    if (!icons || !icons.length) {
      return 0;
    }
    for (i = 0; i < icons.length; i += 1) {
      width += Math.max(18, toNumber(icons[i].width, fallback));
    }
    return width;
  }

  function getEditorMask(column) {
    var mask = getExplicitEditorMask(column);
    var config;
    if (!column) {
      return '';
    }
    if (mask) {
      return mask;
    }
    config = getColumnEditorConfig(column);
    if (config.type === 'datebox') {
      return '9999/99/99';
    }
    return '';
  }

  function getExplicitEditorMask(column) {
    var config;
    var options;
    if (!column) {
      return '';
    }
    if (column.mask) {
      return column.mask;
    }
    config = getColumnEditorConfig(column);
    options = config && config.options ? config.options : {};
    return config && config.mask ? config.mask : options.mask || '';
  }

  function getMaskOptions(column, mask) {
    var config = getColumnEditorConfig(column);
    var options = config && config.options ? config.options : {};
    return {
      mask: mask || getExplicitEditorMask(column),
      autoUnmask: column && column.autoUnmask != null ? column.autoUnmask : options.autoUnmask,
      maskValueIncludesLiterals: column && column.maskValueIncludesLiterals != null ?
        column.maskValueIncludesLiterals :
        options.maskValueIncludesLiterals,
      maskIncludesLiterals: column && column.maskIncludesLiterals != null ?
        column.maskIncludesLiterals :
        options.maskIncludesLiterals,
      maskLiteralsInValue: column && column.maskLiteralsInValue != null ?
        column.maskLiteralsInValue :
        options.maskLiteralsInValue
    };
  }

  function getDefaultEditorType(column) {
    if (column && column.dataType === 'number') {
      return 'numberbox';
    }
    if (column && column.dataType === 'date') {
      return 'datebox';
    }
    return 'textbox';
  }

  function shouldUseThousandsSeparator(column) {
    var config = getColumnEditorConfig(column);
    var options = config && config.options ? config.options : {};
    if (column && column.thousandsSeparator != null) {
      return column.thousandsSeparator === true;
    }
    if (column && column.useThousandsSeparator != null) {
      return column.useThousandsSeparator === true;
    }
    if (column && column.showThousandsSeparator != null) {
      return column.showThousandsSeparator === true;
    }
    if (options.thousandsSeparator != null) {
      return options.thousandsSeparator === true;
    }
    if (options.useThousandsSeparator != null) {
      return options.useThousandsSeparator === true;
    }
    if (options.showThousandsSeparator != null) {
      return options.showThousandsSeparator === true;
    }
    return false;
  }

  function getNumberPrecision(column) {
    var config = getColumnEditorConfig(column);
    var options = config && config.options ? config.options : {};
    var value = null;
    if (column && column.precision != null) {
      value = column.precision;
    } else if (options.precision != null) {
      value = options.precision;
    }
    if (value == null || value === false || value === '') {
      return null;
    }
    value = Number(value);
    if (!isFinite(value) || value < 0) {
      return null;
    }
    return Math.floor(value);
  }

  function roundNumberValue(value, column) {
    var precision = getNumberPrecision(column);
    var factor;
    if (value == null || precision == null || typeof value !== 'number' || !isFinite(value)) {
      return value;
    }
    factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  function formatNumberDisplayText(value, column) {
    return formatNumberEditorText(value, shouldUseThousandsSeparator(column), getNumberPrecision(column));
  }

  function normalizeEditorType(type) {
    type = String(type || 'textbox').toLowerCase();
    if (type === 'number' || type === 'numeric') {
      return 'numberbox';
    }
    if (type === 'date' || type === 'calendar') {
      return 'datebox';
    }
    if (type === 'combo' || type === 'select' || type === 'dropdown') {
      return 'combobox';
    }
    if (type === 'colour' || type === 'colorbox' || type === 'colourbox') {
      return 'color';
    }
    if (type === 'numberbox' || type === 'datebox' || type === 'combobox' || type === 'color') {
      return type;
    }
    return 'textbox';
  }

  function getComboboxData(config) {
    var options = config && config.options ? config.options : {};
    return Array.isArray(options.data) ? options.data : [];
  }

  function getComboboxValueField(config) {
    var options = config && config.options ? config.options : {};
    return options.valueField || 'value';
  }

  function getComboboxTextField(config) {
    var options = config && config.options ? config.options : {};
    return options.textField || 'text';
  }

  function getComboboxItemValue(item, config) {
    var field = getComboboxValueField(config);
    var textField = getComboboxTextField(config);
    var value;
    if (item && typeof item === 'object') {
      value = getByBinding(item, field);
      if (value == null && textField !== field) {
        value = getByBinding(item, textField);
      }
      return value == null ? '' : value;
    }
    return item == null ? '' : item;
  }

  function getComboboxItemText(item, config) {
    var field = getComboboxTextField(config);
    var valueField = getComboboxValueField(config);
    var text;
    if (item && typeof item === 'object') {
      text = getByBinding(item, field);
      if (text == null && valueField !== field) {
        text = getByBinding(item, valueField);
      }
      return text == null ? '' : String(text);
    }
    return item == null ? '' : String(item);
  }

  function shouldShowComboboxValueInList(config) {
    var options = config && config.options ? config.options : {};
    return options.showValueInList === true || options.showValue === true || options.showCode === true;
  }

  function renderComboboxOptionContent(option, text, value, config) {
    var textSpan;
    var valueSpan;
    option.textContent = '';
    textSpan = document.createElement('span');
    textSpan.className = 'fg-combobox-option-text';
    textSpan.textContent = text;
    option.appendChild(textSpan);
    if (shouldShowComboboxValueInList(config) && value !== '' && value !== text) {
      valueSpan = document.createElement('span');
      valueSpan.className = 'fg-combobox-option-value';
      valueSpan.textContent = '(' + value + ')';
      option.appendChild(valueSpan);
      option.setAttribute('aria-label', text + ' (' + value + ')');
    }
  }

  function getComboboxTextByValue(value, config) {
    var items = getComboboxData(config);
    var item;
    var i;
    for (i = 0; i < items.length; i += 1) {
      item = items[i];
      if (String(getComboboxItemValue(item, config)) === String(value)) {
        return getComboboxItemText(item, config);
      }
    }
    return value == null ? '' : String(value);
  }

  function getComboboxValueByText(text, config) {
    var items = getComboboxData(config);
    var item;
    var i;
    for (i = 0; i < items.length; i += 1) {
      item = items[i];
      if (getComboboxItemText(item, config) === text) {
        return getComboboxItemValue(item, config);
      }
    }
    return text;
  }

  function isComboboxValueInList(value, config) {
    var items = getComboboxData(config);
    var text = value == null ? '' : String(value);
    var item;
    var i;
    for (i = 0; i < items.length; i += 1) {
      item = items[i];
      if (String(getComboboxItemValue(item, config)) === text || getComboboxItemText(item, config) === text) {
        return true;
      }
    }
    return false;
  }

  function getComboboxDataValue(text, config, edit) {
    var selectedText;
    if (edit && edit.comboboxValue != null) {
      selectedText = getComboboxTextByValue(edit.comboboxValue, config);
      if (selectedText === text) {
        return edit.comboboxValue;
      }
    }
    return getComboboxValueByText(text, config);
  }

  function formatDateboxText(value, config) {
    var date = parseDateValue(value);
    var formatter = config && config.options ? config.options.formatter : null;
    if (date && typeof formatter === 'function') {
      return formatter(date);
    }
    if (date) {
      return formatDateIso(date);
    }
    return value == null ? '' : String(value);
  }

  function formatDateboxEditorText(value, config, column) {
    var date = parseDateValue(value);
    var text = date ? formatDateboxText(date, config) : value;
    var mask = getEditorMask(column);
    var formatter = config && config.options ? config.options.formatter : null;
    if (typeof formatter !== 'function' && editorDefinitions.datebox && typeof editorDefinitions.datebox.format === 'function') {
      return editorDefinitions.datebox.format(value, mergeOptions(config && config.options ? config.options : {}, { mask: mask }));
    }
    if (mask) {
      return formatMaskText(text, { mask: mask });
    }
    if (date) {
      return formatDateDigits(date);
    }
    return sanitizeDateEditorText(text);
  }

  function formatYearMonthEditorText(value, config, column) {
    var date = parseYearMonthValue(value);
    var text = date ? formatYearMonthDataText(date, column) : value;
    var mask = getEditorMask(column);
    if (editorDefinitions.datebox && typeof editorDefinitions.datebox.format === 'function') {
      return editorDefinitions.datebox.format(value, mergeOptions(config && config.options ? config.options : {}, { mask: mask || '9999/99' }));
    }
    if (mask) {
      return formatMaskText(text, { mask: mask });
    }
    return sanitizeYearMonthEditorText(text);
  }

  function getDateboxDataValue(value, config, edit) {
    var parser = config && config.options ? config.options.parser : null;
    var parsed;
    if (edit && edit.dateboxValue && value === formatDateboxText(edit.dateboxValue, config)) {
      return edit.dateboxValue;
    }
    if (typeof parser === 'function') {
      parsed = parser(value);
      if (parsed instanceof Date && !isNaN(parsed.getTime())) {
        return formatDateIso(parsed);
      }
      if (parsed != null) {
        return parsed;
      }
    }
    if (editorDefinitions.datebox && typeof editorDefinitions.datebox.getDataValue === 'function') {
      return editorDefinitions.datebox.getDataValue(value, config && config.options ? config.options : {});
    }
    parsed = parseDateValue(value);
    return parsed ? formatDateIso(parsed) : value;
  }

  function parseDateboxEditorValue(value, config, column) {
    var parser = config && config.options ? config.options.parser : null;
    var parsed;
    var options = mergeOptions(config && config.options ? config.options : {}, { mask: getEditorMask(column) });
    if (typeof parser === 'function') {
      parsed = parser(value);
      if (parsed instanceof Date && !isNaN(parsed.getTime())) {
        return parsed;
      }
      return isYearMonthDateboxConfig(config, column) ? parseYearMonthValue(parsed) : parseDateValue(parsed);
    }
    if (config && editorDefinitions[config.type] && typeof editorDefinitions[config.type].parse === 'function') {
      return editorDefinitions[config.type].parse(value, options);
    }
    return isYearMonthDateboxConfig(config, column) ? parseYearMonthValue(value) : parseDateValue(value);
  }

  function parseYearMonthValue(value) {
    var text;
    var match;
    var year;
    var month;
    if (editorDefinitions.datebox && typeof editorDefinitions.datebox.parse === 'function') {
      return editorDefinitions.datebox.parse(value, { mask: '9999/99' });
    }
    if (value instanceof Date && !isNaN(value.getTime())) {
      return new Date(value.getFullYear(), value.getMonth(), 1);
    }
    if (value == null || value === '') {
      return null;
    }
    text = String(value).trim();
    match = text.match(/^(\d{4})[-\/](\d{1,2})$/);
    if (!match) {
      match = text.match(/^(\d{4})(\d{2})$/);
    }
    if (!match) {
      return null;
    }
    year = Number(match[1]);
    month = Number(match[2]) - 1;
    if (year < 1 || month < 0 || month > 11) {
      return null;
    }
    return new Date(year, month, 1);
  }

  function formatYearMonthDataText(value, column) {
    var date = parseYearMonthValue(value);
    var mask;
    var text;
    if (!date) {
      return value == null ? '' : String(value);
    }
    text = date.getFullYear() + pad2(date.getMonth() + 1);
    mask = getEditorMask(column);
    if (mask && !isMaskAutoUnmask(getMaskOptions(column, mask))) {
      return applyMask(text, mask);
    }
    return text;
  }

  function parseDateValue(value) {
    var text;
    var match;
    var year;
    var month;
    var day;
    var date;
    if (editorDefinitions.datebox && typeof editorDefinitions.datebox.parse === 'function') {
      return editorDefinitions.datebox.parse(value, {});
    }
    if (value instanceof Date && !isNaN(value.getTime())) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }
    if (value == null || value === '') {
      return null;
    }
    text = String(value).trim();
    match = text.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
    if (!match) {
      match = text.match(/^(\d{4})(\d{2})(\d{2})$/);
    }
    if (!match) {
      return null;
    }
    year = Number(match[1]);
    month = Number(match[2]) - 1;
    day = Number(match[3]);
    date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      return null;
    }
    return date;
  }

  function formatDateIso(date) {
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
  }

  function formatDateDigits(date) {
    return date.getFullYear() + pad2(date.getMonth() + 1) + pad2(date.getDate());
  }

  function isDateLikeEditorType(type) {
    return type === 'datebox';
  }

  function isYearMonthMask(mask) {
    mask = String(mask || '');
    return mask === '9999/99' || mask === '9999-99';
  }

  function isYearMonthDateboxConfig(config, column) {
    var options = config && config.options ? config.options : {};
    var mask = column ? getEditorMask(column) : options.mask;
    return Boolean(config && config.type === 'datebox' && isYearMonthMask(mask));
  }

  function isYearMonthDateboxTarget(target) {
    return Boolean(target && isYearMonthDateboxConfig(target.config, target.column));
  }

  function pad2(value) {
    value = Number(value);
    return value < 10 ? '0' + value : String(value);
  }

  function bind(context, fn) {
    return function() {
      return fn.apply(context, arguments);
    };
  }

  function createWijmoEvent(grid, name) {
    var handlers = [];
    return {
      addHandler: function(handler, self) {
        if (typeof handler === 'function') {
          handlers.push({ handler: handler, self: self || null });
        }
        return this;
      },
      removeHandler: function(handler, self) {
        var i;
        for (i = handlers.length - 1; i >= 0; i -= 1) {
          if (handlers[i].handler === handler && (self == null || handlers[i].self === self)) {
            handlers.splice(i, 1);
          }
        }
        return this;
      },
      raise: function(sender, args) {
        var i;
        var snapshot = handlers.slice();
        args = args || {};
        for (i = 0; i < snapshot.length; i += 1) {
          if (snapshot[i].handler.call(snapshot[i].self || grid, sender || grid, args) === false) {
            args.cancel = true;
          }
        }
        return args.cancel !== true;
      },
      clearHandlers: function() {
        handlers.length = 0;
      }
    };
  }

  function defineWijmoCompatibility(FabGridCtor) {
    var eventNames = [
      'autoGeneratedColumns',
      'autoSizedColumn',
      'autoSizedRow',
      'autoSizingColumn',
      'autoSizingRow',
      'beforeLoad',
      'beginningEdit',
      'bigCheckboxesChanged',
      'cellEditEnding',
      'cellEditEnded',
      'columnGroupCollapsedChanged',
      'columnGroupCollapsedChanging',
      'copied',
      'copiedCell',
      'copying',
      'copyingCell',
      'deletedRow',
      'deletingRow',
      'draggedColumn',
      'draggedRow',
      'draggingColumn',
      'draggingRow',
      'filterChanged',
      'formatItem',
      'groupCollapsedChanged',
      'groupCollapsedChanging',
      'itemsSourceChanged',
      'itemsSourceChanging',
      'loadedRows',
      'loadingRows',
      'loadError',
      'loadSuccess',
      'pasted',
      'pastedCell',
      'pasting',
      'pastingCell',
      'pageChanged',
      'pageChanging',
      'prepareCellForEdit',
      'refreshed',
      'refreshing',
      'resizedColumn',
      'resizedRow',
      'resizingColumn',
      'resizingRow',
      'rowAdded',
      'rowEditEnded',
      'rowEditEnding',
      'rowEditStarted',
      'rowEditStarting',
      'scrollPositionChanged',
      'selectionChanged',
      'selectionChanging',
      'sortedColumn',
      'sortingColumn',
      'updatedLayout',
      'updatedView',
      'updatingLayout',
      'updatingView'
    ];
    var i;
    var name;

    Object.defineProperties(FabGridCtor.prototype, {
      hostElement: {
        get: function() {
          return this.host;
        }
      },
      itemsSource: {
        get: function() {
          return this.source;
        },
        set: function(value) {
          this.setItemsSource(value || []);
        }
      },
      collectionView: {
        get: function() {
          return this.view;
        }
      },
      rows: {
        get: function() {
          return this.getRowCollection();
        }
      },
      frozenColumns: {
        get: function() {
          return this._frozenColumns || 0;
        },
        set: function(value) {
          this.setFrozenColumns(value);
        }
      },
      frozenRightColumns: {
        get: function() {
          return this._frozenRightColumns || 0;
        },
        set: function(value) {
          this.setFrozenRightColumns(value);
        }
      },
      showRowHeaders: {
        get: function() {
          return this.options.showRowHeaders;
        },
        set: function(value) {
          this.setShowRowHeaders(value);
        }
      },
      showFooter: {
        get: function() {
          return this.options.showFooter === true;
        },
        set: function(value) {
          this.setShowFooter(value);
        }
      },
      editMode: {
        get: function() {
          return this.options.allowEditing !== false && this.options.editOnSelect === true;
        },
        set: function(value) {
          this.setEditMode(value);
        }
      },
      multiSelectRows: {
        get: function() {
          return this.options.multiSelectRows === true;
        },
        set: function(value) {
          this.setMultiSelectRows(value);
        }
      },
      selectedItems: {
        get: function() {
          var rows;
          var item;
          var i;
          if (this.options.multiSelectRows === true) {
            rows = [];
            for (i = 0; i < this.view.length; i += 1) {
              if (this.selectedRowMap[i]) {
                rows.push(this.view[i]);
              }
            }
            return rows;
          }
          item = this.view[this.selection.row];
          return item ? [item] : [];
        }
      },
      selectedRows: {
        get: function() {
          var row = this.rowSelection != null ? this.rowSelection : this.selection.row;
          var item = this.view[row];
          var rowCollection = this.rows;
          var rows;
          var i;
          if (this.options.multiSelectRows === true) {
            rows = [];
            for (i = 0; i < this.view.length; i += 1) {
              if (this.selectedRowMap[i]) {
                rows.push(rowCollection[i]);
              }
            }
            return rows;
          }
          return item ? [rowCollection[row]] : [];
        }
      },
      selectedRanges: {
        get: function() {
          return [this.getSelectionRange()];
        }
      },
      scrollPosition: {
        get: function() {
          return {
            x: this.bodyScroll ? this.bodyScroll.scrollLeft : 0,
            y: this.bodyScroll ? this.bodyScroll.scrollTop : 0
          };
        },
        set: function(value) {
          if (!this.bodyScroll || !value) {
            return;
          }
          this.bodyScroll.scrollLeft = toNumber(value.x, this.bodyScroll.scrollLeft);
          this.bodyScroll.scrollTop = toNumber(value.y, this.bodyScroll.scrollTop);
          this.render();
        }
      },
      scrollSize: {
        get: function() {
          return {
            width: this.totalWidth,
            height: this.view.length * this.options.rowHeight
          };
        }
      },
      viewRange: {
        get: function() {
          return {
            row: this.rowRange.start,
            col: this.columnRange.start,
            row2: Math.max(this.rowRange.start, this.rowRange.end - 1),
            col2: Math.max(this.columnRange.start, this.columnRange.end - 1)
          };
        }
      },
      activeCell: {
        get: function() {
          return this.root ? this.root.querySelector('.fg-cell.fg-selected, .fg-cell.fg-row-group-selected') : null;
        }
      },
      activeEditor: {
        get: function() {
          return this.editing ? this.editor : null;
        }
      },
      isReadOnly: {
        get: function() {
          return this.options.allowEditing === false;
        },
        set: function(value) {
          this.options.allowEditing = value === true ? false : true;
          if (value === true) {
            this.options.editOnSelect = false;
            this.finishEditing(false);
          }
        }
      },
      itemFormatter: {
        get: function() {
          return this.options.itemFormatter;
        },
        set: function(value) {
          this.options.itemFormatter = typeof value === 'function' ? value : null;
          this.render();
        }
      },
      autoClipboard: {
        get: function() {
          return this.options.autoClipboard;
        },
        set: function(value) {
          this.options.autoClipboard = value !== false;
        }
      },
      allowSorting: {
        get: function() {
          return this.options.allowSorting;
        },
        set: function(value) {
          this.options.allowSorting = value !== false;
        }
      },
      allowFiltering: {
        get: function() {
          return this.options.allowFiltering !== false;
        },
        set: function(value) {
          this.setAllowFiltering(value);
        }
      },
      allowResizing: {
        get: function() {
          return this.options.allowResizing;
        },
        set: function(value) {
          this.options.allowResizing = value !== false;
          this.render();
        }
      },
      allowDragging: {
        get: function() {
          return this.options.allowDragging;
        },
        set: function(value) {
          this.options.allowDragging = value;
          this.render();
        }
      },
      allowMerging: {
        get: function() {
          return this.options.allowMerging;
        },
        set: function(value) {
          this.options.allowMerging = value;
        }
      },
      allowPinning: {
        get: function() {
          return this.options.allowPinning;
        },
        set: function(value) {
          this.options.allowPinning = value === true;
        }
      },
      alternatingRowStep: {
        get: function() {
          return normalizeAlternatingRowStep(this.options.alternatingRowStep);
        },
        set: function(value) {
          this.options.alternatingRowStep = normalizeAlternatingRowStep(value);
          this.render();
        }
      },
      activeCellBorder: {
        get: function() {
          return Math.max(0, toNumber(this.options.activeCellBorder, 2));
        },
        set: function(value) {
          this.options.activeCellBorder = Math.max(0, toNumber(value, 2));
          this.applyThemeOptions();
        }
      },
      copyHeaders: {
        get: function() {
          return this.options.copyHeaders;
        },
        set: function(value) {
          this.options.copyHeaders = value;
        }
      },
      frozenRows: {
        get: function() {
          return toNumber(this.options.frozenRows, 0);
        },
        set: function(value) {
          this.options.frozenRows = Math.max(0, toNumber(value, 0));
        }
      },
      selectionMode: {
        get: function() {
          return this.options.selectionMode;
        },
        set: function(value) {
          this.options.selectionMode = normalizeSelectionMode(value);
          if (this.options.selectionMode === SELECTION_MODE.Cell) {
            this.selectionAnchor = {
              row: this.selection.row,
              col: this.selection.col
            };
          }
          this.render();
        }
      },
      highlightActiveRow: {
        get: function() {
          return this.options.highlightActiveRow !== false;
        },
        set: function(value) {
          this.options.highlightActiveRow = value !== false;
          this.render();
        }
      }
    });

    for (i = 0; i < eventNames.length; i += 1) {
      name = eventNames[i];
      defineWijmoOnMethod(FabGridCtor, name);
    }
  }

  function defineWijmoOnMethod(FabGridCtor, eventName) {
    var methodName = 'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
    if (FabGridCtor.prototype[methodName]) {
      return;
    }
    FabGridCtor.prototype[methodName] = function(args) {
      return this.emit(eventName, args || {});
    };
  }

  function toNumber(value, fallback) {
    var number = Number(value);
    return isFinite(number) ? number : fallback;
  }

  function normalizeNonNegativeInteger(value, fallback) {
    return Math.max(0, Math.floor(toNumber(value, fallback)));
  }

  function normalizePositiveNumber(value, fallback) {
    var number = toNumber(value, fallback);
    return number > 0 ? number : fallback;
  }

  function normalizeAlternatingRowStep(value) {
    var number;
    if (value === undefined) {
      return DEFAULT_OPTIONS.alternatingRowStep;
    }
    if (value === false) {
      return false;
    }
    number = Number(value);
    if (!isFinite(number) || number <= 0) {
      return false;
    }
    return Math.max(1, Math.floor(number));
  }

  function normalizeGridOptions(options) {
    options.rowHeight = normalizePositiveNumber(options.rowHeight, DEFAULT_OPTIONS.rowHeight);
    options.overscanRows = normalizeNonNegativeInteger(options.overscanRows, DEFAULT_OPTIONS.overscanRows);
    options.fastScrollOverscanRows = normalizeNonNegativeInteger(options.fastScrollOverscanRows, DEFAULT_OPTIONS.fastScrollOverscanRows);
    options.overscanColumns = normalizeNonNegativeInteger(options.overscanColumns, DEFAULT_OPTIONS.overscanColumns);
    options.frozenColumns = normalizeNonNegativeInteger(options.frozenColumns, DEFAULT_OPTIONS.frozenColumns);
    options.frozenRightColumns = normalizeNonNegativeInteger(options.frozenRightColumns, DEFAULT_OPTIONS.frozenRightColumns);
    options.alternatingRowStep = normalizeAlternatingRowStep(options.alternatingRowStep);
    options.selectionMode = normalizeSelectionMode(options.selectionMode);
    options.highlightActiveRow = options.highlightActiveRow !== false;
    return options;
  }

  function normalizeSelectionMode(value) {
    value = value == null ? '' : String(value).toLowerCase();
    return value === 'cellrange' || value === 'cell-range' || value === 'range' ?
      SELECTION_MODE.CellRange : SELECTION_MODE.Cell;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function closest(target, className) {
    if (target && target.nodeType !== 1) {
      target = target.parentNode;
    }
    while (target && target.nodeType === 1) {
      if (hasClass(target, className)) {
        return target;
      }
      target = target.parentNode;
    }
    return null;
  }

  function isPointInElement(clientX, clientY, element) {
    var rect;
    if (!element) {
      return false;
    }
    rect = element.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  }

  function createFilterMenuItemHandler(grid, column, operator) {
    return function(event) {
      grid.selectFilterMenuOperator(column, operator, event);
    };
  }

  function hasClass(element, className) {
    return (' ' + element.className + ' ').indexOf(' ' + className + ' ') >= 0;
  }

  function normalizeTextAlign(value) {
    value = String(value || '').toLowerCase();
    if (value === 'right' || value === 'center') {
      return value;
    }
    return 'left';
  }

  function normalizeJustifyContent(value) {
    value = String(value || '').toLowerCase();
    if (value === 'right') {
      return 'flex-end';
    }
    if (value === 'center') {
      return 'center';
    }
    return 'flex-start';
  }

  function findRowIndexByItem(rows, item) {
    var i;
    if (item == null) {
      return -1;
    }
    for (i = 0; i < rows.length; i += 1) {
      if (rows[i] === item) {
        return i;
      }
    }
    return -1;
  }

  function isWeakSetValue(value) {
    return value !== null && (typeof value === 'object' || typeof value === 'function');
  }

  function rowMatchesSearch(item, columns, searchText) {
    var i;
    var value;
    for (i = 0; i < columns.length; i += 1) {
      if (columns[i].visible === false) {
        continue;
      }
      value = getByBinding(item, columns[i].binding);
      if (value != null && String(value).toLowerCase().indexOf(searchText) >= 0) {
        return true;
      }
    }
    return false;
  }

  function rowMatchesColumnSearch(item, columns, searchValues, searchOperators) {
    var i;
    var column;
    var text;
    var key;
    var operator;
    for (i = 0; i < columns.length; i += 1) {
      column = columns[i];
      if (column.visible === false) {
        continue;
      }
      key = getColumnSearchKey(column);
      text = searchValues[key];
      if (!text) {
        continue;
      }
      operator = searchOperators ? searchOperators[key] : '';
      if (!columnValueMatchesSearch(getByBinding(item, column.binding), column, text, operator)) {
        return false;
      }
    }
    return true;
  }

  function rowMatchesExcelFilters(item, columns, filters) {
    var selectedKeys;
    var column;
    var filter;
    var key;
    var value;
    var i;
    var j;
    for (i = 0; i < columns.length; i += 1) {
      column = columns[i];
      key = getColumnSearchKey(column);
      filter = filters[key];
      if (!filter) {
        continue;
      }
      value = getByBinding(item, column.binding);
      if (filter.type !== 'values' || !Array.isArray(filter.values)) {
        continue;
      }
      selectedKeys = filter._valueKeyMap;
      if (!selectedKeys) {
        selectedKeys = createDictionary();
        for (j = 0; j < filter.values.length; j += 1) {
          selectedKeys[getExcelFilterValueKey(filter.values[j])] = true;
        }
        try {
          Object.defineProperty(filter, '_valueKeyMap', { value: selectedKeys, configurable: true });
        } catch (error) {
          filter._valueKeyMap = selectedKeys;
        }
      }
      if (selectedKeys[getExcelFilterValueKey(value)] !== true) {
        return false;
      }
    }
    return true;
  }

  function getExcelFilterValueKey(value) {
    var type;
    var json;
    if (value == null) {
      return value === null ? 'null:' : 'undefined:';
    }
    if (value instanceof Date) {
      return 'date:' + value.getTime();
    }
    type = typeof value;
    if (type === 'number') {
      return 'number:' + (isNaN(value) ? 'NaN' : String(value));
    }
    if (type === 'string' || type === 'boolean' || type === 'bigint') {
      return type + ':' + String(value);
    }
    try {
      json = JSON.stringify(value);
    } catch (error) {
      json = String(value);
    }
    return type + ':' + json;
  }

  function hasExcelFilterEntries(filters) {
    var key;
    for (key in filters || {}) {
      if (Object.prototype.hasOwnProperty.call(filters, key) && filters[key]) {
        return true;
      }
    }
    return false;
  }

  function columnValueMatchesSearch(value, column, searchText, operator) {
    var expected;
    var actual;
    var dateConfig;
    var sourceDate;
    var targetDate;
    var sourceText;
    var alternateSourceText;
    var targetText;
    if (searchText == null || String(searchText).trim() === '') {
      return true;
    }
    if (value == null) {
      return false;
    }
    operator = normalizeColumnSearchOperator(operator);
    if (column.dataType === 'number') {
      expected = parseValue(searchText, 'number');
      actual = parseValue(value, 'number');
      if (expected == null || actual == null) {
        return false;
      }
      operator = operator || 'eq';
      if (operator === 'gte') {
        return actual >= expected;
      }
      if (operator === 'gt') {
        return actual > expected;
      }
      if (operator === 'lte') {
        return actual <= expected;
      }
      if (operator === 'lt') {
        return actual < expected;
      }
      if (operator === 'ne') {
        return actual !== expected;
      }
      return actual === expected;
    }
    dateConfig = getColumnEditorConfig(column);
    if (dateConfig && isDateLikeEditorType(dateConfig.type)) {
      operator = operator || 'starts';
      sourceDate = parseDateboxEditorValue(value, dateConfig, column);
      targetDate = parseDateboxEditorValue(searchText, dateConfig, column);
      if (isComparisonSearchOperator(operator) && sourceDate && targetDate) {
        sourceText = isYearMonthDateboxConfig(dateConfig, column) ? formatYearMonthDataText(sourceDate, column) : formatDateIso(sourceDate);
        targetText = isYearMonthDateboxConfig(dateConfig, column) ? formatYearMonthDataText(targetDate, column) : formatDateIso(targetDate);
      } else {
        sourceText = sourceDate ?
          (isYearMonthDateboxConfig(dateConfig, column) ? formatYearMonthEditorText(sourceDate, dateConfig, column) : formatDateboxEditorText(sourceDate, dateConfig, column)).toLowerCase() :
          String(value).toLowerCase();
        targetText = String(searchText).toLowerCase();
      }
    } else if (dateConfig && dateConfig.type === 'combobox') {
      sourceText = getComboboxTextByValue(value, dateConfig).toLowerCase();
      alternateSourceText = String(value).toLowerCase();
      targetText = String(searchText).toLowerCase();
      operator = operator || 'starts';
    } else {
      sourceText = String(value).toLowerCase();
      targetText = String(searchText).toLowerCase();
      operator = operator || 'starts';
    }
    if (alternateSourceText != null && alternateSourceText !== sourceText && searchTextMatchesOperator(alternateSourceText, targetText, operator)) {
      return true;
    }
    return searchTextMatchesOperator(sourceText, targetText, operator);
  }

  function searchTextMatchesOperator(sourceText, targetText, operator) {
    if (operator === 'contains') {
      return sourceText.indexOf(targetText) >= 0;
    }
    if (operator === 'ends') {
      return sourceText.lastIndexOf(targetText) === sourceText.length - targetText.length;
    }
    if (operator === 'not-starts') {
      return sourceText.indexOf(targetText) !== 0;
    }
    if (operator === 'not-contains') {
      return sourceText.indexOf(targetText) < 0;
    }
    if (operator === 'not-ends') {
      return sourceText.lastIndexOf(targetText) !== sourceText.length - targetText.length;
    }
    if (operator === 'gte') {
      return sourceText >= targetText;
    }
    if (operator === 'gt') {
      return sourceText > targetText;
    }
    if (operator === 'lte') {
      return sourceText <= targetText;
    }
    if (operator === 'lt') {
      return sourceText < targetText;
    }
    if (operator === 'ne') {
      return sourceText !== targetText;
    }
    if (operator === 'eq') {
      return sourceText === targetText;
    }
    return sourceText.indexOf(targetText) === 0;
  }

  function isComparisonSearchOperator(operator) {
    return operator === 'gte' ||
      operator === 'gt' ||
      operator === 'lte' ||
      operator === 'lt' ||
      operator === 'ne' ||
      operator === 'eq';
  }

  function getColumnSearchOperatorDefinitions(column) {
    if (isColumnSearchComparable(column)) {
      return [
        { operator: 'gte', symbol: '≥', labelKey: 'filter.greaterThanOrEqual' },
        { operator: 'gt', symbol: '>', labelKey: 'filter.greaterThan' },
        { operator: 'lte', symbol: '≤', labelKey: 'filter.lessThanOrEqual' },
        { operator: 'lt', symbol: '<', labelKey: 'filter.lessThan' },
        { operator: 'ne', symbol: '≠', labelKey: 'filter.notEqual' },
        { operator: 'eq', symbol: '=', labelKey: 'filter.equal' },
        { operator: '', symbol: '', labelKey: 'filter.clear' }
      ];
    }
    return [
      { operator: 'starts', symbol: '^', labelKey: 'filter.startsWith' },
      { operator: 'contains', symbol: '∋', labelKey: 'filter.contains' },
      { operator: 'ends', symbol: '$', labelKey: 'filter.endsWith' },
      { operator: 'not-starts', symbol: '!^', labelKey: 'filter.notStartsWith' },
      { operator: 'not-contains', symbol: '!∋', labelKey: 'filter.notContains' },
      { operator: 'not-ends', symbol: '!$', labelKey: 'filter.notEndsWith' },
      { operator: 'gte', symbol: '≥', labelKey: 'filter.greaterThanOrEqual' },
      { operator: 'gt', symbol: '>', labelKey: 'filter.greaterThan' },
      { operator: 'lte', symbol: '≤', labelKey: 'filter.lessThanOrEqual' },
      { operator: 'lt', symbol: '<', labelKey: 'filter.lessThan' },
      { operator: 'ne', symbol: '≠', labelKey: 'filter.notEqual' },
      { operator: 'eq', symbol: '=', labelKey: 'filter.equal' },
      { operator: '', symbol: '', labelKey: 'filter.clear' }
    ];
  }

  function isColumnSearchComparable(column) {
    var config;
    if (!column) {
      return false;
    }
    if (column.dataType === 'number') {
      return true;
    }
    config = getColumnEditorConfig(column);
    return config && isDateLikeEditorType(config.type);
  }

  function normalizeColumnSearchOperator(operator) {
    operator = String(operator || '').toLowerCase();
    if (
      operator === 'starts' ||
      operator === 'contains' ||
      operator === 'ends' ||
      operator === 'not-starts' ||
      operator === 'not-contains' ||
      operator === 'not-ends' ||
      operator === 'gte' ||
      operator === 'gt' ||
      operator === 'lte' ||
      operator === 'lt' ||
      operator === 'ne' ||
      operator === 'eq'
    ) {
      return operator;
    }
    return '';
  }

  function getColumnSearchOperatorSymbol(operator) {
    operator = normalizeColumnSearchOperator(operator);
    if (operator === 'starts') {
      return '^';
    }
    if (operator === 'contains') {
      return '∋';
    }
    if (operator === 'ends') {
      return '$';
    }
    if (operator === 'not-starts') {
      return '!^';
    }
    if (operator === 'not-contains') {
      return '!∋';
    }
    if (operator === 'not-ends') {
      return '!$';
    }
    if (operator === 'gte') {
      return '≥';
    }
    if (operator === 'gt') {
      return '>';
    }
    if (operator === 'lte') {
      return '≤';
    }
    if (operator === 'lt') {
      return '<';
    }
    if (operator === 'ne') {
      return '≠';
    }
    if (operator === 'eq') {
      return '=';
    }
    return '';
  }

  function getColumnSearchKey(column) {
    if (!column) {
      return '';
    }
    return column.binding != null && column.binding !== '' ? 'binding:' + column.binding : 'index:' + column._index;
  }

  function parseValue(value, type) {
    var text;
    var number;
    if (type === 'number') {
      if (editorDefinitions.numberbox && typeof editorDefinitions.numberbox.parse === 'function') {
        return editorDefinitions.numberbox.parse(value, { groupSeparator: ',' });
      }
      if (value == null) {
        return null;
      }
      text = stripNumberGroupSeparators(value).trim();
      if (text === '' || text === '-' || text === '.' || text === '-.') {
        return null;
      }
      number = Number(text);
      return isFinite(number) ? number : null;
    }
    if (type === 'boolean') {
      return value === true || value === 'true' || value === '1' || value === 'yes' || value === 'Y';
    }
    return value;
  }

  function getMaskDataValue(value, column) {
    var raw = extractMaskCharacters(value, column.mask);
    if (isMaskValueIncludingLiterals(column)) {
      return applyMask(raw, column.mask);
    }
    return raw;
  }

  function getValidationRowId(key) {
    var index = String(key || '').indexOf('::');
    return index >= 0 ? String(key).slice(0, index) : '';
  }

  function stripNumberGroupSeparators(value) {
    if (editorDefinitions.numberbox && typeof editorDefinitions.numberbox.stripFormatting === 'function') {
      return editorDefinitions.numberbox.stripFormatting(value, { groupSeparator: ',' });
    }
    return String(value).replace(/,/g, '');
  }

  function isDigitKey(key) {
    return /^[0-9]$/.test(key);
  }

  function isNumberEditorTextAllowed(editor, text) {
    if (editorDefinitions.numberbox && typeof editorDefinitions.numberbox.isTextAllowed === 'function') {
      return editorDefinitions.numberbox.isTextAllowed(editor, text, { groupSeparator: ',' });
    }
    var start = editor.selectionStart == null ? editor.value.length : editor.selectionStart;
    var end = editor.selectionEnd == null ? start : editor.selectionEnd;
    var next = editor.value.slice(0, start) + text + editor.value.slice(end);
    return stripNumberGroupSeparators(next).trim() === sanitizeNumberEditorText(next);
  }

  function sanitizeNumberEditorText(value) {
    if (editorDefinitions.numberbox && typeof editorDefinitions.numberbox.sanitize === 'function') {
      return editorDefinitions.numberbox.sanitize(value, { groupSeparator: ',' });
    }
    var text = stripNumberGroupSeparators(value).trim();
    var output = '';
    var hasDecimal = false;
    var i;
    var ch;
    for (i = 0; i < text.length; i += 1) {
      ch = text.charAt(i);
      if (isDigitKey(ch)) {
        output += ch;
      } else if (ch === '.' && !hasDecimal) {
        output += ch;
        hasDecimal = true;
      } else if (ch === '-' && output === '') {
        output = '-';
      }
    }
    return output;
  }

  function sanitizeDateEditorText(value) {
    if (editorDefinitions.datebox && typeof editorDefinitions.datebox.sanitize === 'function') {
      return editorDefinitions.datebox.sanitize(value, { mask: editorDefinitions.datebox.mask });
    }
    return String(value == null ? '' : value).replace(/[^0-9]/g, '').slice(0, 8);
  }

  function sanitizeYearMonthEditorText(value) {
    if (editorDefinitions.datebox && typeof editorDefinitions.datebox.sanitize === 'function') {
      return editorDefinitions.datebox.sanitize(value, { mask: '9999/99' });
    }
    return String(value == null ? '' : value).replace(/[^0-9]/g, '').slice(0, 6);
  }

  function getNumberCopyText(value) {
    if (editorDefinitions.numberbox && typeof editorDefinitions.numberbox.getCopyText === 'function') {
      return editorDefinitions.numberbox.getCopyText(value, { groupSeparator: ',' });
    }
    return stripNumberGroupSeparators(value == null ? '' : value).trim();
  }

  function formatNumberEditorText(value, useThousandsSeparator, precision) {
    if (editorDefinitions.numberbox && typeof editorDefinitions.numberbox.format === 'function') {
      return editorDefinitions.numberbox.format(value, {
        thousandsSeparator: useThousandsSeparator === true,
        precision: precision
      });
    }
    var text = stripNumberGroupSeparators(value).trim();
    var number;
    var sign = '';
    var hasDecimal;
    var parts;
    var integer;
    var decimal;
    if (text === '') {
      return '';
    }
    if (text === '-') {
      return text;
    }
    if (!/^-?\d*(?:\.\d*)?$/.test(text)) {
      return String(value);
    }
    if (precision != null) {
      number = Number(text);
      if (isFinite(number)) {
        text = number.toFixed(precision);
      }
    }
    if (text.charAt(0) === '-') {
      sign = text.charAt(0);
      text = text.slice(1);
    }
    hasDecimal = text.indexOf('.') >= 0;
    parts = text.split('.');
    integer = parts[0] || '0';
    decimal = parts.length > 1 ? parts[1] : '';
    integer = integer.replace(/^0+(?=\d)/, '');
    if (useThousandsSeparator === true) {
      integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return sign + integer + (hasDecimal ? '.' + decimal : '');
  }

  function normalizeColorValue(value) {
    if (editorDefinitions.color && typeof editorDefinitions.color.normalize === 'function') {
      return editorDefinitions.color.normalize(value);
    }
    var text = value == null ? '' : String(value).trim().toLowerCase();
    var hex;
    if (!text) return '';
    if (text.charAt(0) !== '#') text = '#' + text;
    hex = text.slice(1);
    if (!/^(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(hex)) return '';
    if (hex.length === 3 || hex.length === 4) {
      hex = hex.replace(/./g, function(character) { return character + character; });
    }
    return '#' + hex;
  }

  function parseColorValue(value) {
    if (editorDefinitions.color && typeof editorDefinitions.color.parse === 'function') {
      return editorDefinitions.color.parse(value);
    }
    return normalizeColorValue(value) || (value == null ? '' : String(value).trim());
  }

  function isColorValueValid(value) {
    if (editorDefinitions.color && typeof editorDefinitions.color.isValid === 'function') {
      return editorDefinitions.color.isValid(value);
    }
    return Boolean(normalizeColorValue(value));
  }

  function getColorPalette(config) {
    var options = config && config.options ? config.options : {};
    return Array.isArray(options.palette) && options.palette.length ? options.palette : DEFAULT_COLOR_PALETTE;
  }

  function getColorShowAlpha(config) {
    var options = config && config.options ? config.options : {};
    return options.showAlpha !== false;
  }

  function createColorState(value) {
    var color = normalizeColorValue(value) || '#ff0000';
    var hex = color.slice(1);
    var rgb;
    var hsv;
    if (hex.length === 6) {
      hex += 'ff';
    }
    rgb = {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16)
    };
    hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    hsv.a = parseInt(hex.slice(6, 8), 16) / 255;
    return hsv;
  }

  function rgbToHsv(red, green, blue) {
    var r = red / 255;
    var g = green / 255;
    var b = blue / 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var delta = max - min;
    var hue = 0;
    if (delta) {
      if (max === r) {
        hue = ((g - b) / delta) % 6;
      } else if (max === g) {
        hue = (b - r) / delta + 2;
      } else {
        hue = (r - g) / delta + 4;
      }
      hue *= 60;
      if (hue < 0) hue += 360;
    }
    return {
      h: hue,
      s: max === 0 ? 0 : delta / max,
      v: max
    };
  }

  function hsvToRgb(hue, saturation, value) {
    var chroma = value * saturation;
    var section = hue / 60;
    var x = chroma * (1 - Math.abs(section % 2 - 1));
    var m = value - chroma;
    var r = 0;
    var g = 0;
    var b = 0;
    if (section < 1) {
      r = chroma;
      g = x;
    } else if (section < 2) {
      r = x;
      g = chroma;
    } else if (section < 3) {
      g = chroma;
      b = x;
    } else if (section < 4) {
      g = x;
      b = chroma;
    } else if (section < 5) {
      r = x;
      b = chroma;
    } else {
      r = chroma;
      b = x;
    }
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }

  function colorStateToHex(state, showAlpha) {
    var rgb = hsvToRgb(state.h, state.s, state.v);
    var alpha = clamp(state.a == null ? 1 : state.a, 0, 1);
    var value = '#' + toHexColorPart(rgb.r) + toHexColorPart(rgb.g) + toHexColorPart(rgb.b);
    if (showAlpha && alpha < 0.999) {
      value += toHexColorPart(Math.round(alpha * 255));
    }
    return value;
  }

  function toHexColorPart(value) {
    var text = clamp(Math.round(value), 0, 255).toString(16);
    return text.length < 2 ? '0' + text : text;
  }

  function findColumnByOffset(columns, start, end, offset) {
    var low = start;
    var high = end - 1;
    var mid;
    var col;
    var result = start;
    while (low <= high) {
      mid = Math.floor((low + high) / 2);
      col = columns[mid];
      if (col._left + col._width <= offset) {
        low = mid + 1;
      } else {
        result = mid;
        high = mid - 1;
      }
    }
    return result;
  }

  installFabGridView(FabGrid, {
    CellType: CellType,
    DEFAULT_OPTIONS: DEFAULT_OPTIONS,
    clamp: clamp,
    closest: closest,
    escapeHtml: escapeHtml,
    findColumnByOffset: findColumnByOffset,
    formatMaskText: formatMaskText,
    formatNumberDisplayText: formatNumberDisplayText,
    getByBinding: getByBinding,
    getColumnEditorConfig: getColumnEditorConfig,
    getColumnSearchIconConfigs: getColumnSearchIconConfigs,
    getColumnSearchKey: getColumnSearchKey,
    getColumnSearchOperatorSymbol: getColumnSearchOperatorSymbol,
    getComboboxTextByValue: getComboboxTextByValue,
    getEditorMask: getEditorMask,
    getExplicitEditorMask: getExplicitEditorMask,
    getIconConfigWidth: getIconConfigWidth,
    getMaskOptions: getMaskOptions,
    getNumberPrecision: getNumberPrecision,
    hasClass: hasClass,
    hasExcelFilterEntries: hasExcelFilterEntries,
    isDateLikeEditorType: isDateLikeEditorType,
    measureNativeScrollbarGutters: measureNativeScrollbarGutters,
    normalizeClassName: normalizeClassName,
    normalizeColorValue: normalizeColorValue,
    normalizeColumnSearchOperator: normalizeColumnSearchOperator,
    normalizeAlternatingRowStep: normalizeAlternatingRowStep,
    normalizeGridOptions: normalizeGridOptions,
    normalizeJustifyContent: normalizeJustifyContent,
    normalizeNonNegativeInteger: normalizeNonNegativeInteger,
    normalizePositiveNumber: normalizePositiveNumber,
    normalizeTextAlign: normalizeTextAlign,
    shouldUseThousandsSeparator: shouldUseThousandsSeparator,
    toNumber: toNumber,
    trimText: trimText
  });
  installFabGridFilterUi(FabGrid, {
    applyMask: applyMask,
    closest: closest,
    countMaskCharactersBeforeCaret: countMaskCharactersBeforeCaret,
    createColorState: createColorState,
    createDictionary: createDictionary,
    createFilterMenuItemHandler: createFilterMenuItemHandler,
    extractMaskCharacters: extractMaskCharacters,
    formatMaskText: formatMaskText,
    getByBinding: getByBinding,
    getColumnEditorConfig: getColumnEditorConfig,
    getColumnSearchIconConfigs: getColumnSearchIconConfigs,
    getColumnSearchKey: getColumnSearchKey,
    getColumnSearchOperatorDefinitions: getColumnSearchOperatorDefinitions,
    getComboboxTextByValue: getComboboxTextByValue,
    getEditorMask: getEditorMask,
    getExcelFilterValueKey: getExcelFilterValueKey,
    getMaskCaretPosition: getMaskCaretPosition,
    hasClass: hasClass,
    isDateLikeEditorType: isDateLikeEditorType,
    normalizeColorValue: normalizeColorValue,
    sanitizeDateEditorText: sanitizeDateEditorText,
    toNumber: toNumber,
    trimText: trimText
  });
  installFabGridSelection(FabGrid, {
    DEFAULT_OPTIONS: DEFAULT_OPTIONS,
    clamp: clamp,
    closest: closest,
    findRowIndexByItem: findRowIndexByItem,
    getByBinding: getByBinding,
    getColumnEditorConfig: getColumnEditorConfig,
    getExplicitEditorMask: getExplicitEditorMask,
    getMaskCopyText: getMaskCopyText,
    getMaskDataValue: getMaskDataValue,
    getMaskOptions: getMaskOptions,
    getNumberCopyText: getNumberCopyText,
    isHotKey: isHotKey,
    isSafeBinding: isSafeBinding,
    isWeakSetValue: isWeakSetValue,
    parseValue: parseValue,
    setByBinding: setByBinding,
    toNumber: toNumber
  });
  installFabGridEditorRuntime(FabGrid, {
    applyMask: applyMask,
    clamp: clamp,
    closest: closest,
    colorStateToHex: colorStateToHex,
    countMaskCharactersBeforeCaret: countMaskCharactersBeforeCaret,
    createColorState: createColorState,
    editorDefinitions: editorDefinitions,
    escapeHtml: escapeHtml,
    extractMaskCharacters: extractMaskCharacters,
    formatDateIso: formatDateIso,
    formatDateboxEditorText: formatDateboxEditorText,
    formatLocaleText: formatLocaleText,
    formatMaskText: formatMaskText,
    formatNumberEditorText: formatNumberEditorText,
    formatYearMonthDataText: formatYearMonthDataText,
    formatYearMonthEditorText: formatYearMonthEditorText,
    getByBinding: getByBinding,
    getColorPalette: getColorPalette,
    getColorShowAlpha: getColorShowAlpha,
    getColumnEditorConfig: getColumnEditorConfig,
    getComboboxData: getComboboxData,
    getComboboxDataValue: getComboboxDataValue,
    getComboboxItemText: getComboboxItemText,
    getComboboxItemValue: getComboboxItemValue,
    getComboboxTextByValue: getComboboxTextByValue,
    getDateboxDataValue: getDateboxDataValue,
    getEditorIconConfigWidth: getEditorIconConfigWidth,
    getEditorIconConfigs: getEditorIconConfigs,
    getEditorMask: getEditorMask,
    getExplicitEditorMask: getExplicitEditorMask,
    getMaskCaretPosition: getMaskCaretPosition,
    getMaskCopyText: getMaskCopyText,
    getMaskDataValue: getMaskDataValue,
    getMaskOptions: getMaskOptions,
    getNumberCopyText: getNumberCopyText,
    getNumberPrecision: getNumberPrecision,
    getValidationRowId: getValidationRowId,
    hasClass: hasClass,
    hsvToRgb: hsvToRgb,
    isColorValueValid: isColorValueValid,
    isComboboxValueInList: isComboboxValueInList,
    isDateLikeEditorType: isDateLikeEditorType,
    isDigitKey: isDigitKey,
    isNumberEditorTextAllowed: isNumberEditorTextAllowed,
    isPromiseLike: isPromiseLike,
    isSafeBinding: isSafeBinding,
    isYearMonthDateboxConfig: isYearMonthDateboxConfig,
    isYearMonthDateboxTarget: isYearMonthDateboxTarget,
    mergeOptions: mergeOptions,
    normalizeClassName: normalizeClassName,
    normalizeColorValue: normalizeColorValue,
    normalizeTextAlign: normalizeTextAlign,
    normalizeValidationResult: normalizeValidationResult,
    parseColorValue: parseColorValue,
    parseDateValue: parseDateValue,
    parseDateboxEditorValue: parseDateboxEditorValue,
    parseValue: parseValue,
    parseYearMonthValue: parseYearMonthValue,
    renderComboboxOptionContent: renderComboboxOptionContent,
    roundNumberValue: roundNumberValue,
    sanitizeDateEditorText: sanitizeDateEditorText,
    sanitizeNumberEditorText: sanitizeNumberEditorText,
    setByBinding: setByBinding,
    shouldUseThousandsSeparator: shouldUseThousandsSeparator,
    toNumber: toNumber,
    trimText: trimText
  });
  defineWijmoCompatibility(FabGrid);
  FabGrid.SelectionMode = SELECTION_MODE;
  FabGrid.CellType = CellType;
  FabGrid.Row = Row;
  FabGrid.GroupRow = GroupRow;
  installFabGridData(FabGrid, {
    DEFAULT_OPTIONS: DEFAULT_OPTIONS,
    formatNumberDisplayText: formatNumberDisplayText,
    getColumnSearchKey: getColumnSearchKey,
    mergeOptions: mergeOptions,
    normalizeColumnSearchOperator: normalizeColumnSearchOperator,
    rowMatchesExcelFilters: rowMatchesExcelFilters,
    rowMatchesColumnSearch: rowMatchesColumnSearch,
    rowMatchesSearch: rowMatchesSearch
  });
  installFabGridTree(FabGrid, {
    closest: closest,
    getByBinding: getByBinding,
    setByBinding: setByBinding,
    toNumber: toNumber
  });
  installFabGridDrag(FabGrid, {
    bind: bind,
    closest: closest,
    getByBinding: getByBinding,
    toNumber: toNumber
  });
  installFabGridExport(FabGrid, {
    getByBinding: getByBinding,
    getNumberPrecision: getNumberPrecision,
    parseValue: parseValue,
    shouldUseThousandsSeparator: shouldUseThousandsSeparator,
    toNumber: toNumber
  });

  FabGrid.locales = getLocaleMap();
  FabGrid.editorDefinitions = editorDefinitions;
  FabGrid.defaultLocale = getDefaultLocaleName();
  FabGrid.addLocale = function(name, messages) {
    if (name && messages) {
      FabGrid.locales[String(name)] = messages;
    }
    return FabGrid;
  };

  return FabGrid;
}

function normalizePivotComparable(value, dataType) {
  var date;
  var type = String(dataType || '').toLowerCase();
  if (type === 'date' || value instanceof Date) {
    date = value instanceof Date ? value : new Date(value);
    if (!isNaN(date.getTime())) {
      return ['date', date.getTime()];
    }
  }
  if (value === null) return ['null', null];
  if (value === undefined) return ['undefined', null];
  if (typeof value === 'number' && isNaN(value)) return ['nan', null];
  return [typeof value, value];
}

function pivotValuesEqual(left, right, dataType) {
  var leftValue = normalizePivotComparable(left, dataType);
  var rightValue = normalizePivotComparable(right, dataType);
  return leftValue[0] === rightValue[0] && leftValue[1] === rightValue[1];
}

function createPivotPathKey(path) {
  return JSON.stringify((path || []).map(function(value) {
    return normalizePivotComparable(value);
  }));
}

function isPivotPathPrefix(parentPath, path) {
  var i;
  parentPath = parentPath || [];
  path = path || [];
  if (parentPath.length > path.length) {
    return false;
  }
  for (i = 0; i < parentPath.length; i += 1) {
    if (!pivotValuesEqual(parentPath[i], path[i])) {
      return false;
    }
  }
  return true;
}



var PivotAggregate = Object.freeze({
  Sum: 'Sum',
  Count: 'Count',
  Average: 'Average',
  Min: 'Min',
  Max: 'Max'
});

var PivotShowTotals = Object.freeze({
  None: 'None',
  GrandTotals: 'GrandTotals',
  Subtotals: 'Subtotals'
});

function PivotEvent() {
  this.handlers = [];
}

PivotEvent.prototype.addHandler = function(handler, self) {
  if (typeof handler === 'function') {
    this.handlers.push({ handler: handler, self: self || null });
  }
  return this;
};

PivotEvent.prototype.removeHandler = function(handler, self) {
  var matchSelf = arguments.length > 1;
  var i;
  for (i = this.handlers.length - 1; i >= 0; i -= 1) {
    if (this.handlers[i].handler === handler && (!matchSelf || this.handlers[i].self === self)) {
      this.handlers.splice(i, 1);
    }
  }
  return this;
};

PivotEvent.prototype.raise = function(sender, args) {
  var handlers = this.handlers.slice();
  var i;
  for (i = 0; i < handlers.length; i += 1) {
    handlers[i].handler.call(handlers[i].self || sender, sender, args || {});
  }
};

function getPivotBindingValue(item, binding) {
  var parts;
  var value = item;
  var i;
  if (!binding) {
    return undefined;
  }
  parts = String(binding).split('.');
  for (i = 0; i < parts.length; i += 1) {
    if (value == null) {
      return undefined;
    }
    value = value[parts[i]];
  }
  return value;
}

function inferDataType(value) {
  if (value instanceof Date) {
    return 'date';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  return 'string';
}

function createHeader(binding) {
  return String(binding || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, function(character) {
      return character.toUpperCase();
    });
}

function normalizeAggregate(value, dataType) {
  var text = String(value || '').toLowerCase();
  if (text === 'count') return PivotAggregate.Count;
  if (text === 'average' || text === 'avg') return PivotAggregate.Average;
  if (text === 'min') return PivotAggregate.Min;
  if (text === 'max') return PivotAggregate.Max;
  if (text === 'sum') return PivotAggregate.Sum;
  return dataType === 'number' ? PivotAggregate.Sum : PivotAggregate.Count;
}

function normalizeTotals(value, fallback) {
  var text = String(value || '').toLowerCase();
  if (text === 'none') return PivotShowTotals.None;
  if (text === 'subtotals' || text === 'subtotal') return PivotShowTotals.Subtotals;
  if (text === 'grandtotals' || text === 'grandtotal') return PivotShowTotals.GrandTotals;
  return fallback;
}

function normalizeDate(value) {
  var date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function getGroupedValue(value, groupBy) {
  var date;
  var month;
  var quarter;
  var type;
  if (typeof groupBy === 'function') {
    return groupBy(value);
  }
  if (!groupBy) {
    return value;
  }
  type = String(groupBy).toLowerCase();
  date = normalizeDate(value);
  if (!date) {
    return value;
  }
  month = date.getMonth() + 1;
  if (type === 'year') {
    return date.getFullYear();
  }
  if (type === 'quarter') {
    quarter = Math.floor((month - 1) / 3) + 1;
    return date.getFullYear() + ' Q' + quarter;
  }
  if (type === 'month') {
    return date.getFullYear() + '-' + String(month).padStart(2, '0');
  }
  if (type === 'day') {
    return date.getFullYear() + '-' + String(month).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  return value;
}

function PivotField(engine, binding, header, options) {
  var hasDescending;
  var hasSortDirection;
  options = options || {};
  hasDescending = Object.prototype.hasOwnProperty.call(options, 'descending');
  hasSortDirection = Object.prototype.hasOwnProperty.call(options, 'sortDirection');
  this.engine = engine || null;
  this.binding = binding || options.binding || '';
  this.key = options.key || options.header || header || this.binding;
  this.header = options.header || header || createHeader(this.binding);
  this.dataType = String(options.dataType || 'string').toLowerCase();
  this.aggregate = normalizeAggregate(options.aggregate, this.dataType);
  this.format = options.format || '';
  this.align = options.align || (this.dataType === 'number' ? 'right' : 'left');
  this.sortDirection = hasSortDirection ? normalizePivotSortDirection(options.sortDirection) :
    (hasDescending ? (options.descending === true ? -1 : 1) : 0);
  Object.defineProperty(this, 'descending', {
    configurable: true,
    enumerable: true,
    get: function() {
      return normalizePivotSortDirection(this.sortDirection) === -1;
    },
    set: function(value) {
      this.sortDirection = value === true ? -1 : 1;
    }
  });
  this.filter = options.filter || null;
  this.groupBy = options.groupBy || null;
  this.getValue = typeof options.getValue === 'function' ? options.getValue : null;
  this.width = Math.max(48, Number(options.width) || (this.dataType === 'number' ? 112 : 132));
  this.visible = options.visible !== false;
}

PivotField.prototype.getItemValue = function(item) {
  var value = this.getValue ? this.getValue(item) : getPivotBindingValue(item, this.binding);
  return getGroupedValue(value, this.groupBy);
};

function createAggregatePaths(path, totals) {
  var result = [path.slice()];
  var i;
  if (!path.length) {
    return result;
  }
  if (totals === PivotShowTotals.Subtotals) {
    for (i = path.length - 1; i > 0; i -= 1) {
      result.push(path.slice(0, i));
    }
  }
  if (totals !== PivotShowTotals.None) {
    result.push([]);
  }
  return result;
}

function comparePivotValues(left, right) {
  var leftValue = left instanceof Date ? left.getTime() : left;
  var rightValue = right instanceof Date ? right.getTime() : right;
  if (leftValue == null && rightValue == null) return 0;
  if (leftValue == null) return -1;
  if (rightValue == null) return 1;
  if (typeof leftValue === 'number' && typeof rightValue === 'number') {
    return leftValue === rightValue ? 0 : leftValue < rightValue ? -1 : 1;
  }
  return String(leftValue).localeCompare(String(rightValue), undefined, {
    numeric: true,
    sensitivity: 'base'
  });
}

function normalizePivotSortDirection(value) {
  var text;
  if (value === 1 || value === -1) {
    return value;
  }
  text = String(value == null ? '' : value).toLowerCase();
  if (text === 'asc' || text === 'ascending') {
    return 1;
  }
  if (text === 'desc' || text === 'descending') {
    return -1;
  }
  return 0;
}

function getPivotFieldSortDirection(field) {
  return field ? normalizePivotSortDirection(field.sortDirection) : 0;
}

function createEntryValueOrders(entries, fieldCount) {
  var orders = [];
  var entry;
  var key;
  var i;
  var e;
  for (i = 0; i < fieldCount; i += 1) {
    orders.push(new Map());
  }
  for (e = 0; e < entries.length; e += 1) {
    entry = entries[e];
    for (i = 0; i < entry.path.length && i < fieldCount; i += 1) {
      key = createPivotPathKey([entry.path[i]]);
      if (!orders[i].has(key)) {
        orders[i].set(key, orders[i].size);
      }
    }
  }
  return orders;
}

function comparePivotValueOrder(left, right, order) {
  var leftOrder = order && order.get(createPivotPathKey([left]));
  var rightOrder = order && order.get(createPivotPathKey([right]));
  if (leftOrder == null || rightOrder == null) {
    return null;
  }
  return leftOrder - rightOrder;
}

function compareEntries(left, right, fields, totalsBeforeData, valueOrders) {
  var length = Math.min(left.path.length, right.path.length);
  var direction;
  var orderCompared;
  var compared;
  var i;
  for (i = 0; i < length; i += 1) {
    compared = comparePivotValues(left.path[i], right.path[i]);
    if (compared) {
      direction = getPivotFieldSortDirection(fields[i]);
      if (direction) {
        return compared * direction;
      }
      orderCompared = comparePivotValueOrder(left.path[i], right.path[i], valueOrders[i]);
      return orderCompared == null ? compared : orderCompared;
    }
  }
  if (left.path.length === right.path.length) {
    return 0;
  }
  if (left.path.length < right.path.length) {
    return totalsBeforeData ? -1 : 1;
  }
  return totalsBeforeData ? 1 : -1;
}

function createAccumulator() {
  return {
    count: 0,
    numericCount: 0,
    sum: 0,
    min: null,
    max: null
  };
}

function accumulateValue(accumulator, value, aggregate) {
  var number;
  if (value == null || value === '') {
    return;
  }
  accumulator.count += 1;
  if (aggregate === PivotAggregate.Sum || aggregate === PivotAggregate.Average) {
    number = Number(value);
    if (!isNaN(number)) {
      accumulator.sum += number;
      accumulator.numericCount += 1;
    }
  }
  if (accumulator.min == null || comparePivotValues(value, accumulator.min) < 0) {
    accumulator.min = value;
  }
  if (accumulator.max == null || comparePivotValues(value, accumulator.max) > 0) {
    accumulator.max = value;
  }
}

function finalizeAccumulator(accumulator, aggregate) {
  if (!accumulator || !accumulator.count) {
    return aggregate === PivotAggregate.Count ? 0 : null;
  }
  if (aggregate === PivotAggregate.Count) return accumulator.count;
  if (aggregate === PivotAggregate.Average) {
    return accumulator.numericCount ? accumulator.sum / accumulator.numericCount : null;
  }
  if (aggregate === PivotAggregate.Min) return accumulator.min;
  if (aggregate === PivotAggregate.Max) return accumulator.max;
  return accumulator.sum;
}

function matchesFieldFilter(field, item) {
  var filter = field.filter;
  var value;
  var values;
  if (!filter) {
    return true;
  }
  value = field.getItemValue(item);
  if (typeof filter === 'function') {
    return filter(value, item) !== false;
  }
  if (Array.isArray(filter)) {
    return filter.some(function(filterValue) {
      return pivotValuesEqual(filterValue, value, field.dataType);
    });
  }
  if (typeof filter.predicate === 'function' && filter.predicate(value, item) === false) {
    return false;
  }
  values = Array.isArray(filter.values) ? filter.values : null;
  return !values || values.some(function(filterValue) {
    return pivotValuesEqual(filterValue, value, field.dataType);
  });
}

function pathMatches(item, fields, path) {
  var i;
  for (i = 0; i < path.length; i += 1) {
    if (!pivotValuesEqual(fields[i].getItemValue(item), path[i], fields[i].dataType)) {
      return false;
    }
  }
  return true;
}

function copyDefinitionField(field) {
  var filter = field.filter && Array.isArray(field.filter.values) ? {
    values: field.filter.values.slice()
  } : null;
  return {
    key: field.key,
    binding: field.binding,
    header: field.header,
    dataType: field.dataType,
    aggregate: field.aggregate,
    format: field.format,
    align: field.align,
    sortDirection: getPivotFieldSortDirection(field),
    descending: field.descending,
    filter: filter,
    groupBy: typeof field.groupBy === 'string' ? field.groupBy : null,
    width: field.width,
    visible: field.visible
  };
}

function PivotEngine(options) {
  options = options || {};
  this.events = {};
  this._updateLevel = 0;
  this._pendingRefresh = false;
  this._itemsSource = Array.isArray(options.itemsSource) ? options.itemsSource : [];
  this.autoGenerateFields = options.autoGenerateFields !== false;
  this.showRowTotals = normalizeTotals(options.showRowTotals, PivotShowTotals.GrandTotals);
  this.showColumnTotals = normalizeTotals(options.showColumnTotals, PivotShowTotals.GrandTotals);
  this.totalsBeforeData = options.totalsBeforeData === true;
  this.showZeros = options.showZeros === true;
  this.isUpdating = false;
  this.fields = [];
  this.rowFields = [];
  this.columnFields = [];
  this.valueFields = [];
  this.filterFields = [];
  this.pivotView = createEmptyPivotView(this);
  this._createEvents(options);
  this.setFields(options.fields || [], true);
  if (!this.fields.length && this.autoGenerateFields) {
    this.generateFields();
  }
  this.setViewFields('rowFields', options.rowFields || [], true);
  this.setViewFields('columnFields', options.columnFields || [], true);
  this.setViewFields('valueFields', options.valueFields || [], true);
  this.setViewFields('filterFields', options.filterFields || [], true);
  this.refresh();
}

function createEmptyPivotView(engine) {
  return {
    engine: engine,
    rows: [],
    rowEntries: [],
    columnEntries: [],
    dataColumns: [],
    filterFields: engine.filterFields.slice(),
    rowFields: [],
    columnFields: [],
    valueFields: []
  };
}

PivotEngine.prototype._createEvents = function(options) {
  var names = [
    'itemsSourceChanged',
    'viewDefinitionChanged',
    'updatingView',
    'updatedView',
    'progress',
    'error'
  ];
  var i;
  for (i = 0; i < names.length; i += 1) {
    this[names[i]] = new PivotEvent();
    if (typeof options[names[i]] === 'function') {
      this[names[i]].addHandler(options[names[i]], this);
    }
  }
};

PivotEngine.prototype.on = function(name, handler) {
  if (!this.events[name]) {
    this.events[name] = [];
  }
  if (typeof handler === 'function') {
    this.events[name].push(handler);
  }
  return this;
};

PivotEngine.prototype.off = function(name, handler) {
  var handlers = this.events[name] || [];
  var i;
  for (i = handlers.length - 1; i >= 0; i -= 1) {
    if (handlers[i] === handler) {
      handlers.splice(i, 1);
    }
  }
  return this;
};

PivotEngine.prototype.emit = function(name, args) {
  var handlers = (this.events[name] || []).slice();
  var event = this[name];
  var i;
  for (i = 0; i < handlers.length; i += 1) {
    handlers[i](args || {});
  }
  if (event && typeof event.raise === 'function') {
    event.raise(this, args || {});
  }
};

PivotEngine.prototype.setFields = function(definitions, silent) {
  var areaNames = ['rowFields', 'columnFields', 'valueFields', 'filterFields'];
  var areaKeys = {};
  var usedKeys = Object.create(null);
  var definition;
  var field;
  var key;
  var name;
  var i;
  definitions = Array.isArray(definitions) ? definitions : [];
  for (i = 0; i < areaNames.length; i += 1) {
    name = areaNames[i];
    areaKeys[name] = (this[name] || []).map(function(item) {
      return item.key;
    });
  }
  this.fields = [];
  for (i = 0; i < definitions.length; i += 1) {
    definition = definitions[i] || {};
    field = definition instanceof PivotField ? definition : new PivotField(
      this,
      definition.binding || '',
      definition.header,
      definition
    );
    field.engine = this;
    key = String(field.key || field.binding || ('field' + i));
    while (usedKeys[key]) {
      key += '_' + (i + 1);
    }
    field.key = key;
    usedKeys[key] = true;
    this.fields.push(field);
  }
  for (i = 0; i < areaNames.length; i += 1) {
    name = areaNames[i];
    this.setViewFields(name, areaKeys[name], true);
  }
  if (!silent) {
    this.emit('viewDefinitionChanged', { property: 'fields' });
    this.refresh();
  }
};

PivotEngine.prototype.generateFields = function() {
  var sample = this._itemsSource.length ? this._itemsSource[0] : null;
  var definitions = [];
  var keys;
  var i;
  if (!sample || typeof sample !== 'object') {
    return;
  }
  keys = Object.keys(sample);
  for (i = 0; i < keys.length; i += 1) {
    definitions.push({
      key: keys[i],
      binding: keys[i],
      header: createHeader(keys[i]),
      dataType: inferDataType(sample[keys[i]])
    });
  }
  this.setFields(definitions, true);
};

PivotEngine.prototype.getField = function(reference) {
  var text;
  var i;
  if (reference instanceof PivotField) {
    return reference.engine === this ? reference : null;
  }
  if (reference && typeof reference === 'object') {
    reference = reference.key || reference.header || reference.binding;
  }
  text = String(reference == null ? '' : reference);
  for (i = 0; i < this.fields.length; i += 1) {
    if (this.fields[i].key === text || this.fields[i].header === text || this.fields[i].binding === text) {
      return this.fields[i];
    }
  }
  return null;
};

PivotEngine.prototype.setViewFields = function(name, references, silent) {
  var result = [];
  var field;
  var i;
  references = Array.isArray(references) ? references : [];
  for (i = 0; i < references.length; i += 1) {
    field = this.getField(references[i]);
    if (field && result.indexOf(field) < 0) {
      result.push(field);
    }
  }
  this[name] = result;
  if (!silent) {
    this.emit('viewDefinitionChanged', { property: name });
    this.refresh();
  }
};

PivotEngine.prototype.setItemsSource = function(itemsSource, silent) {
  this._itemsSource = Array.isArray(itemsSource) ? itemsSource : [];
  if (this.autoGenerateFields && !this.fields.length) {
    this.generateFields();
  }
  if (!silent) {
    this.emit('itemsSourceChanged', { itemsSource: this._itemsSource });
    this.refresh();
  }
};

PivotEngine.prototype.beginUpdate = function() {
  this._updateLevel += 1;
};

PivotEngine.prototype.endUpdate = function() {
  if (this._updateLevel > 0) {
    this._updateLevel -= 1;
  }
  if (!this._updateLevel && this._pendingRefresh) {
    this._pendingRefresh = false;
    this.refresh();
  }
};

PivotEngine.prototype.deferUpdate = function(callback) {
  this.beginUpdate();
  try {
    callback();
  } finally {
    this.endUpdate();
  }
};

PivotEngine.prototype.refresh = function() {
  var view;
  if (this._updateLevel) {
    this._pendingRefresh = true;
    return this.pivotView;
  }
  this.isUpdating = true;
  this.emit('updatingView', {});
  try {
    view = this._buildPivotView();
    this.pivotView = view;
    this.emit('progress', { progress: 1 });
    this.emit('updatedView', { pivotView: view });
    return view;
  } catch (error) {
    this.emit('error', { error: error });
    throw error;
  } finally {
    this.isUpdating = false;
  }
};

PivotEngine.prototype._buildPivotView = function() {
  var rowEntryMap = new Map();
  var columnEntryMap = new Map();
  var accumulatorMap = new Map();
  var filteredItems = [];
  var rowEntries;
  var columnEntries;
  var dataColumns = [];
  var rows = [];
  var item;
  var rowPath;
  var columnPath;
  var rowPaths;
  var columnPaths;
  var rowKey;
  var columnKey;
  var accumulatorKey;
  var accumulator;
  var field;
  var row;
  var dataColumn;
  var i;
  var r;
  var c;
  var v;
  for (i = 0; i < this._itemsSource.length; i += 1) {
    item = this._itemsSource[i];
    if (!this._itemMatchesFilters(item)) {
      continue;
    }
    filteredItems.push(item);
    rowPath = this.rowFields.map(function(rowField) {
      return rowField.getItemValue(item);
    });
    columnPath = this.columnFields.map(function(columnField) {
      return columnField.getItemValue(item);
    });
    rowPaths = createAggregatePaths(rowPath, this.showRowTotals);
    columnPaths = createAggregatePaths(columnPath, this.showColumnTotals);
    for (r = 0; r < rowPaths.length; r += 1) {
      rowKey = createPivotPathKey(rowPaths[r]);
      if (!rowEntryMap.has(rowKey)) {
        rowEntryMap.set(rowKey, createEntry(rowPaths[r], this.rowFields.length));
      }
      for (c = 0; c < columnPaths.length; c += 1) {
        columnKey = createPivotPathKey(columnPaths[c]);
        if (!columnEntryMap.has(columnKey)) {
          columnEntryMap.set(columnKey, createEntry(columnPaths[c], this.columnFields.length));
        }
        for (v = 0; v < this.valueFields.length; v += 1) {
          field = this.valueFields[v];
          accumulatorKey = rowKey + '\u001f' + columnKey + '\u001f' + field.key;
          accumulator = accumulatorMap.get(accumulatorKey);
          if (!accumulator) {
            accumulator = createAccumulator();
            accumulatorMap.set(accumulatorKey, accumulator);
          }
          accumulateValue(accumulator, field.getItemValue(item), field.aggregate);
        }
      }
    }
  }
  if (!this.rowFields.length && !rowEntryMap.size) {
    rowEntryMap.set(createPivotPathKey([]), createEntry([], 0));
  }
  if (!this.columnFields.length && !columnEntryMap.size) {
    columnEntryMap.set(createPivotPathKey([]), createEntry([], 0));
  }
  rowEntries = Array.from(rowEntryMap.values());
  columnEntries = Array.from(columnEntryMap.values());
  rowEntries.sort(this._createEntryComparer(this.rowFields, rowEntries));
  columnEntries.sort(this._createEntryComparer(this.columnFields, columnEntries));
  for (c = 0; c < columnEntries.length; c += 1) {
    for (v = 0; v < this.valueFields.length; v += 1) {
      dataColumns.push({
        binding: '__pivot_value_' + c + '_' + v,
        entry: columnEntries[c],
        valueField: this.valueFields[v],
        columnEntryIndex: c,
        valueFieldIndex: v
      });
    }
  }
  for (r = 0; r < rowEntries.length; r += 1) {
    row = {};
    Object.defineProperty(row, '__pivotMeta', {
      configurable: true,
      enumerable: false,
      value: rowEntries[r]
    });
    for (i = 0; i < this.rowFields.length; i += 1) {
      row['__pivot_row_' + i] = i < rowEntries[r].path.length ? rowEntries[r].path[i] : null;
    }
    for (c = 0; c < dataColumns.length; c += 1) {
      dataColumn = dataColumns[c];
      accumulatorKey = rowEntries[r].key + '\u001f' + dataColumn.entry.key + '\u001f' + dataColumn.valueField.key;
      row[dataColumn.binding] = finalizeAccumulator(
        accumulatorMap.get(accumulatorKey),
        dataColumn.valueField.aggregate
      );
      if (row[dataColumn.binding] == null && this.showZeros) {
        row[dataColumn.binding] = 0;
      }
    }
    rows.push(row);
  }
  this._filteredItems = filteredItems;
  return {
    engine: this,
    rows: rows,
    rowEntries: rowEntries,
    columnEntries: columnEntries,
    dataColumns: dataColumns,
    rowFields: this.rowFields.slice(),
    columnFields: this.columnFields.slice(),
    valueFields: this.valueFields.slice(),
    filterFields: this.filterFields.slice(),
    sourceCount: this._itemsSource.length,
    filteredCount: filteredItems.length
  };
};

function createEntry(path, fieldCount) {
  return {
    key: createPivotPathKey(path),
    path: path.slice(),
    level: path.length,
    isSubtotal: path.length > 0 && path.length < fieldCount,
    isGrandTotal: fieldCount > 0 && path.length === 0,
    isLeaf: path.length === fieldCount
  };
}

PivotEngine.prototype._createEntryComparer = function(fields, entries) {
  var totalsBeforeData = this.totalsBeforeData;
  var valueOrders = createEntryValueOrders(entries || [], fields.length);
  return function(left, right) {
    return compareEntries(left, right, fields, totalsBeforeData, valueOrders);
  };
};

PivotEngine.prototype._itemMatchesFilters = function(item) {
  var i;
  for (i = 0; i < this.fields.length; i += 1) {
    if (!matchesFieldFilter(this.fields[i], item)) {
      return false;
    }
  }
  return true;
};

PivotEngine.prototype.getDetail = function(row, column) {
  var rowEntry = row && row.__pivotMeta ? row.__pivotMeta : row;
  var columnEntry = column && column.entry ? column.entry : column;
  var source = this._filteredItems || [];
  var result = [];
  var item;
  var i;
  if (!rowEntry || !columnEntry) {
    return result;
  }
  for (i = 0; i < source.length; i += 1) {
    item = source[i];
    if (pathMatches(item, this.rowFields, rowEntry.path) &&
      pathMatches(item, this.columnFields, columnEntry.path)) {
      result.push(item);
    }
  }
  return result;
};

PivotEngine.prototype.getKeys = function(row, column) {
  var rowEntry = row && row.__pivotMeta ? row.__pivotMeta : row;
  var columnEntry = column && column.entry ? column.entry : column;
  return {
    rowKey: {
      fields: this.rowFields.map(function(field) { return field.key; }).slice(0, rowEntry ? rowEntry.path.length : 0),
      values: rowEntry ? rowEntry.path.slice() : []
    },
    columnKey: {
      fields: this.columnFields.map(function(field) { return field.key; }).slice(0, columnEntry ? columnEntry.path.length : 0),
      values: columnEntry ? columnEntry.path.slice() : []
    }
  };
};

PivotEngine.prototype.removeField = function(reference) {
  var field = this.getField(reference);
  var lists = ['rowFields', 'columnFields', 'valueFields', 'filterFields'];
  var index;
  var i;
  if (!field) {
    return false;
  }
  for (i = 0; i < lists.length; i += 1) {
    index = this[lists[i]].indexOf(field);
    if (index >= 0) {
      this[lists[i]].splice(index, 1);
    }
  }
  this.emit('viewDefinitionChanged', { property: 'fields', field: field });
  this.refresh();
  return true;
};

Object.defineProperties(PivotEngine.prototype, {
  itemsSource: {
    get: function() {
      return this._itemsSource;
    },
    set: function(value) {
      this.setItemsSource(value);
    }
  },
  viewDefinition: {
    get: function() {
      return {
        fields: this.fields.map(copyDefinitionField),
        rowFields: this.rowFields.map(function(field) { return field.key; }),
        columnFields: this.columnFields.map(function(field) { return field.key; }),
        valueFields: this.valueFields.map(function(field) { return field.key; }),
        filterFields: this.filterFields.map(function(field) { return field.key; }),
        showRowTotals: this.showRowTotals,
        showColumnTotals: this.showColumnTotals,
        totalsBeforeData: this.totalsBeforeData,
        showZeros: this.showZeros
      };
    },
    set: function(definition) {
      definition = definition || {};
      this.beginUpdate();
      try {
        if (Array.isArray(definition.fields)) {
          this.setFields(definition.fields, true);
        }
        this.setViewFields('rowFields', definition.rowFields || [], true);
        this.setViewFields('columnFields', definition.columnFields || [], true);
        this.setViewFields('valueFields', definition.valueFields || [], true);
        this.setViewFields('filterFields', definition.filterFields || [], true);
        this.showRowTotals = normalizeTotals(definition.showRowTotals, this.showRowTotals);
        this.showColumnTotals = normalizeTotals(definition.showColumnTotals, this.showColumnTotals);
        this.totalsBeforeData = definition.totalsBeforeData === true;
        this.showZeros = definition.showZeros === true;
        this._pendingRefresh = true;
      } finally {
        this.endUpdate();
      }
      this.emit('viewDefinitionChanged', { property: 'viewDefinition' });
    }
  }
});

PivotEngine.prototype.formatFieldValue = function(field, value, locale) {
  var date;
  if (value == null) {
    return '';
  }
  if (field && field.dataType === 'date') {
    date = normalizeDate(value);
    if (!date) {
      return String(value);
    }
    try {
      return date.toLocaleDateString(locale || undefined);
    } catch (error) {
      return date.toLocaleDateString();
    }
  }
  return String(value);
};

PivotEngine.prototype.dispose = function() {
  var name;
  for (name in this.events) {
    if (Object.prototype.hasOwnProperty.call(this.events, name)) {
      this.events[name].length = 0;
    }
  }
  ['itemsSourceChanged', 'viewDefinitionChanged', 'updatingView', 'updatedView', 'progress', 'error'].forEach(function(name) {
    if (this[name]) {
      this[name].handlers.length = 0;
    }
  }, this);
  this._itemsSource = [];
  this._filteredItems = [];
  this.pivotView = createEmptyPivotView(this);
};



function resolvePivotChartHostElement(element) {
  if (typeof element === 'string') {
    if (typeof document === 'undefined') {
      return null;
    }
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function getPivotChartMessageValue(source, path) {
  var value = source;
  var parts = String(path || '').split('.');
  var i;
  for (i = 0; i < parts.length; i += 1) {
    if (!value || typeof value !== 'object') {
      return null;
    }
    value = value[parts[i]];
  }
  return typeof value === 'string' ? value : null;
}

function formatPivotChartMessage(text, data) {
  return String(text || '').replace(/\{(\w+)\}/g, function(match, key) {
    return data && data[key] != null ? String(data[key]) : match;
  });
}

function mergeOptions(base, override) {
  var result = {};
  var key;
  for (key in base) {
    if (Object.prototype.hasOwnProperty.call(base, key)) {
      result[key] = base[key];
    }
  }
  for (key in override) {
    if (Object.prototype.hasOwnProperty.call(override, key)) {
      result[key] = override[key];
    }
  }
  return result;
}

function normalizeLimit(value, fallback) {
  value = Math.floor(Number(value));
  return isFinite(value) && value > 0 ? value : fallback;
}

function formatPathValue(value, locale) {
  if (value instanceof Date) {
    try {
      return value.toLocaleDateString(locale || 'en');
    } catch (error) {
      return value.toISOString().slice(0, 10);
    }
  }
  return value == null ? '' : String(value);
}

function formatPath(path, locale, emptyText) {
  var values = (path || []).map(function(value) {
    return formatPathValue(value, locale);
  }).filter(function(value) {
    return value !== '';
  });
  return values.length ? values.join(' / ') : emptyText;
}

function resolvePivotGridCell(grid, model, selection, options) {
  var pointIndex = Math.floor(Number(selection && selection.pointIndex));
  var isPie = String(options && options.chartType || '').toLowerCase() === 'pie';
  var seriesIndex = isPie ?
    Math.floor(Number(options && options.selectedSeries) || 0) :
    Math.floor(Number(selection && selection.seriesIndex));
  var rowKey = model && model.rowKeys && model.rowKeys[pointIndex];
  var series = model && model.series && model.series[seriesIndex];
  var rows = grid && grid.view || [];
  var columns = grid && grid.visibleColumns || [];
  var entry;
  var dataColumn;
  var row = -1;
  var col = -1;
  var i;
  if (!isFinite(pointIndex) || pointIndex < 0 || !isFinite(seriesIndex) || seriesIndex < 0 ||
      rowKey == null || !series) {
    return null;
  }
  for (i = 0; i < rows.length; i += 1) {
    entry = rows[i] && rows[i].__pivotMeta;
    if (entry && entry.key === rowKey) {
      row = i;
      break;
    }
  }
  for (i = 0; i < columns.length; i += 1) {
    dataColumn = columns[i] && columns[i]._pivotDataColumn;
    if (dataColumn && dataColumn.binding === series.binding) {
      col = i;
      break;
    }
  }
  return row >= 0 && col >= 0 ? { row: row, col: col } : null;
}

function resolvePivotChartPoint(grid, model) {
  var selection = grid && grid.selection;
  var row = selection && grid.view && grid.view[selection.row];
  var column = selection && grid.visibleColumns && grid.visibleColumns[selection.col];
  var rowKey = row && row.__pivotMeta && row.__pivotMeta.key;
  var binding = column && column._pivotDataColumn && column._pivotDataColumn.binding;
  var pointIndex = model && model.rowKeys ? model.rowKeys.indexOf(rowKey) : -1;
  var seriesIndex = -1;
  var i;
  if (pointIndex < 0 || !binding || !model || !model.series) {
    return null;
  }
  for (i = 0; i < model.series.length; i += 1) {
    if (model.series[i].binding === binding) {
      seriesIndex = i;
      break;
    }
  }
  return seriesIndex >= 0 ? { pointIndex: pointIndex, seriesIndex: seriesIndex } : null;
}

function formatChartNumber(value, locale) {
  value = Number(value);
  if (!isFinite(value)) {
    return '';
  }
  try {
    return new Intl.NumberFormat(locale || undefined, {
      maximumFractionDigits: 2
    }).format(value);
  } catch (error) {
    return String(Math.round(value * 100) / 100);
  }
}

function createPivotChartOptions(options) {
  return mergeOptions({
    chartType: 'Column',
    showTitle: true,
    showLegend: 'Auto',
    legendPosition: 'Bottom',
    showTotals: false,
    maxPoints: 100,
    maxSeries: 12,
    selectedSeries: 0,
    header: '',
    footer: '',
    locale: 'en',
    messages: null,
    tooltip: true,
    palette: null,
    animation: true,
    dataLabel: { content: '{percent}%', position: 'Inside' },
    axisX: {},
    axisY: {},
    formatValue: null,
    formatTooltip: null,
    emptyText: null,
    selectionMode: 'Point',
    selectionSource: null,
    selectedItemOffset: .1,
    selectedItemPosition: 'Top',
    isAnimated: true
  }, options || {});
}

function isStrictEntryDescendant(entry, parent) {
  var entryPath = entry && entry.path || [];
  var parentPath = parent && parent.path || [];
  return entryPath.length > parentPath.length && isPivotPathPrefix(parentPath, entryPath);
}

function hasVisibleDescendant(entry, visibleEntries) {
  var i;
  for (i = 0; i < visibleEntries.length; i += 1) {
    if (visibleEntries[i] && isStrictEntryDescendant(visibleEntries[i], entry)) {
      return true;
    }
  }
  return false;
}

function includePivotEntry(entry, showTotals, visibleEntries, useVisibleEntries) {
  if (showTotals === true || !entry || entry.isLeaf === true) {
    return true;
  }
  return useVisibleEntries === true && entry.isSubtotal === true &&
    !hasVisibleDescendant(entry, visibleEntries);
}

function createPivotGridChartView(grid, pivotView) {
  var rows = grid && Array.isArray(grid.view) ? grid.view : [];
  var visibleColumns = grid && Array.isArray(grid.visibleColumns) ? grid.visibleColumns : [];
  var dataColumns = [];
  var i;
  for (i = 0; i < visibleColumns.length; i += 1) {
    if (visibleColumns[i] && visibleColumns[i]._pivotDataColumn) {
      dataColumns.push(visibleColumns[i]._pivotDataColumn);
    }
  }
  return {
    engine: pivotView && pivotView.engine || null,
    rows: rows,
    rowEntries: rows.map(function(row) {
      return row && row.__pivotMeta || null;
    }),
    columnEntries: dataColumns.map(function(dataColumn) {
      return dataColumn.entry || null;
    }),
    dataColumns: dataColumns,
    rowFields: pivotView && pivotView.rowFields || [],
    columnFields: pivotView && pivotView.columnFields || [],
    valueFields: pivotView && pivotView.valueFields || [],
    filterFields: pivotView && pivotView.filterFields || [],
    sourceCount: pivotView && pivotView.sourceCount || 0,
    filteredCount: pivotView && pivotView.filteredCount || 0
  };
}

function getSeriesName(dataColumn, pivotView, locale, totalText) {
  var entry = dataColumn.entry || {};
  var valueField = dataColumn.valueField || {};
  var columnName = entry.path && entry.path.length ? formatPath(entry.path, locale, totalText) : '';
  var valueName = valueField.header || valueField.key || valueField.binding || '';
  var hasMultipleValues = (pivotView.valueFields || []).length > 1;
  if (columnName && hasMultipleValues && valueName) {
    return columnName + ' · ' + valueName;
  }
  return columnName || valueName || totalText;
}

function createPivotChartModel(pivotView, options) {
  var rows = pivotView && pivotView.rows || [];
  var rowEntries = pivotView && pivotView.rowEntries || [];
  var dataColumns = pivotView && pivotView.dataColumns || [];
  var locale = options && options.locale || 'en';
  var totalText = options && options.totalText || 'Total';
  var showTotals = options && options.showTotals === true;
  var maxPoints = normalizeLimit(options && options.maxPoints, 100);
  var maxSeries = normalizeLimit(options && options.maxSeries, 12);
  var useVisibleEntries = options && options.useVisibleEntries === true;
  var visibleRowEntries = [];
  var visibleColumnEntries = [];
  var includedRows = [];
  var includedColumns = [];
  var categories;
  var series;
  var entry;
  var i;

  for (i = 0; i < rows.length; i += 1) {
    visibleRowEntries.push(rowEntries[i] || rows[i] && rows[i].__pivotMeta || null);
  }
  for (i = 0; i < dataColumns.length; i += 1) {
    visibleColumnEntries.push(dataColumns[i].entry || null);
  }
  for (i = 0; i < rows.length; i += 1) {
    entry = visibleRowEntries[i];
    if (includePivotEntry(entry, showTotals, visibleRowEntries, useVisibleEntries)) {
      includedRows.push({ row: rows[i], entry: entry });
    }
  }
  for (i = 0; i < dataColumns.length; i += 1) {
    if (includePivotEntry(dataColumns[i].entry, showTotals, visibleColumnEntries, useVisibleEntries) &&
        (!dataColumns[i].valueField || dataColumns[i].valueField.visible !== false)) {
      includedColumns.push(dataColumns[i]);
    }
  }

  categories = includedRows.slice(0, maxPoints).map(function(item) {
    return formatPath(item.entry && item.entry.path, locale, totalText);
  });
  series = includedColumns.slice(0, maxSeries).map(function(dataColumn) {
    return {
      name: getSeriesName(dataColumn, pivotView || {}, locale, totalText),
      binding: dataColumn.binding,
      valueField: dataColumn.valueField || null,
      columnEntry: dataColumn.entry || null,
      data: includedRows.slice(0, maxPoints).map(function(item) {
        var value = item.row ? item.row[dataColumn.binding] : null;
        return value == null ? undefined : value;
      })
    };
  });

  return {
    categories: categories,
    rowKeys: includedRows.slice(0, maxPoints).map(function(item) {
      return item.entry ? item.entry.key : null;
    }),
    series: series,
    pointCount: includedRows.length,
    seriesCount: includedColumns.length,
    pointsTruncated: includedRows.length > maxPoints,
    seriesTruncated: includedColumns.length > maxSeries
  };
}

function createPivotChartFactory(Control, registerControl, unregisterControl, PivotEngine, Chart, FabGrid) {
  function PivotChart(element, options) {
    var host = resolvePivotChartHostElement(element);
    var source;
    options = options || {};
    if (!host) {
      throw new TypeError('PivotChart host element was not found.');
    }
    Control.call(this);
    this.hostElement = host;
    this.root = host;
    this.options = createPivotChartOptions(options);
    this.locale = this.options.locale || 'en';
    this.messages = this.options.messages || null;
    this._engine = null;
    this._selectionSource = null;
    this._raf = 0;
    this._disposed = false;
    this._updatedHandler = this.invalidate.bind(this);
    this._chartSelectionHandler = this._handleChartSelectionChanged.bind(this);
    this._gridSelectionHandler = this._handleGridSelectionChanged.bind(this);
    this._gridRefreshedHandler = this.invalidate.bind(this);
    this._createDom();
    this.chart = new Chart(this.chartHost, {
      observeData: false,
      animation: this.options.animation,
      locale: this.locale
    });
    this.chart.on('selectionChanged', this._chartSelectionHandler);
    this.bindSelectionSource(this.options.selectionSource);
    registerControl(host, this);
    source = options.itemsSource || options.engine || null;
    if (source) {
      this.setItemsSource(source);
    } else {
      this.refresh();
    }
  }

  PivotChart.prototype = Object.create(Control.prototype);
  PivotChart.prototype.constructor = PivotChart;

  PivotChart.prototype._createDom = function() {
    this.hostElement.innerHTML = '';
    this.hostElement.classList.add('fg-root', 'fg-pivot-chart');
    this.hostElement.setAttribute('role', 'region');
    this.chartHost = document.createElement('div');
    this.chartHost.className = 'fg-pivot-chart-host';
    this.hostElement.appendChild(this.chartHost);
    this.applyLocaleToDom();
  };

  PivotChart.prototype.getText = function(path, data) {
    var locales = FabGrid.locales || {};
    var localeName = this.locale || 'en';
    var baseName = localeName.split('-')[0];
    var text = getPivotChartMessageValue(this.messages, path) ||
      getPivotChartMessageValue(locales[localeName], path) ||
      getPivotChartMessageValue(locales[baseName], path) ||
      getPivotChartMessageValue(locales.en, path) || path;
    return formatPivotChartMessage(text, data);
  };

  PivotChart.prototype.applyLocaleToDom = function() {
    this.hostElement.setAttribute('aria-label', this.getText('pivot.chart.ariaLabel'));
  };

  PivotChart.prototype.resolveEngine = function(source) {
    if (source instanceof PivotEngine) {
      return source;
    }
    if (source && source.engine instanceof PivotEngine) {
      return source.engine;
    }
    return null;
  };

  PivotChart.prototype.setItemsSource = function(source) {
    var engine = this.resolveEngine(source);
    if (!engine) {
      throw new TypeError('PivotChart itemsSource must be a fabui.pivot.PivotEngine or PivotPanel instance.');
    }
    if (this._engine === engine) {
      this.refresh();
      return this;
    }
    if (this._engine && this._engine.updatedView) {
      this._engine.updatedView.removeHandler(this._updatedHandler, this);
    }
    this._engine = engine;
    engine.updatedView.addHandler(this._updatedHandler, this);
    this.refresh();
    return this;
  };

  PivotChart.prototype.setOptions = function(options) {
    var source;
    var hasSelectionSource;
    options = options || {};
    source = options.itemsSource || options.engine || null;
    hasSelectionSource = Object.prototype.hasOwnProperty.call(options, 'selectionSource');
    this.options = mergeOptions(this.options, options);
    this.locale = this.options.locale || this.locale || 'en';
    this.messages = this.options.messages || null;
    if (hasSelectionSource) {
      this.bindSelectionSource(options.selectionSource);
    }
    this.applyLocaleToDom();
    if (source) {
      return this.setItemsSource(source);
    }
    this.refresh();
    return this;
  };

  PivotChart.prototype.bindSelectionSource = function(source) {
    if (this._selectionSource && this._selectionSource.selectionChanged &&
        typeof this._selectionSource.selectionChanged.removeHandler === 'function') {
      this._selectionSource.selectionChanged.removeHandler(this._gridSelectionHandler, this);
    }
    if (this._selectionSource && this._selectionSource.refreshed &&
        typeof this._selectionSource.refreshed.removeHandler === 'function') {
      this._selectionSource.refreshed.removeHandler(this._gridRefreshedHandler, this);
    }
    this._selectionSource = source || null;
    this.options.selectionSource = this._selectionSource;
    if (this._selectionSource && this._selectionSource.selectionChanged &&
        typeof this._selectionSource.selectionChanged.addHandler === 'function') {
      this._selectionSource.selectionChanged.addHandler(this._gridSelectionHandler, this);
    }
    if (this._selectionSource && this._selectionSource.refreshed &&
        typeof this._selectionSource.refreshed.addHandler === 'function') {
      this._selectionSource.refreshed.addHandler(this._gridRefreshedHandler, this);
    }
    return this;
  };

  PivotChart.prototype._handleChartSelectionChanged = function(eventArgs) {
    var grid = this._selectionSource;
    var selection = eventArgs && eventArgs.selection;
    var cell;
    if (!grid || typeof grid.select !== 'function' || !selection) {
      return;
    }
    cell = resolvePivotGridCell(grid, this.model, selection, this.options);
    if (!cell) {
      return;
    }
    grid.select(cell.row, cell.col);
    if (typeof grid.scrollIntoView === 'function') {
      grid.scrollIntoView(cell.row, cell.col);
    }
  };

  PivotChart.prototype._handleGridSelectionChanged = function() {
    var point = resolvePivotChartPoint(this._selectionSource, this.model);
    var isPie = String(this.options.chartType || 'Column').toLowerCase() === 'pie';
    if (!point || !this.chart) {
      return;
    }
    if (isPie && this.options.selectedSeries !== point.seriesIndex) {
      this.options.selectedSeries = point.seriesIndex;
      this.refresh();
    }
    this.chart.selectPoint(point.pointIndex, isPie ? null : point.seriesIndex);
  };

  PivotChart.prototype.setType = function(type) {
    this.options.chartType = type || 'Column';
    this.refresh();
    return this;
  };

  PivotChart.prototype.setLocale = function(locale, messages) {
    this.locale = locale || 'en';
    this.options.locale = this.locale;
    if (messages !== undefined) {
      this.messages = messages;
      this.options.messages = messages;
    }
    this.applyLocaleToDom();
    this.refresh();
    return this;
  };

  PivotChart.prototype.getLegendOption = function(seriesCount) {
    var mode = String(this.options.showLegend == null ? 'Auto' : this.options.showLegend).toLowerCase();
    if (this.options.showLegend === false || mode === 'never' || mode === 'none') {
      return false;
    }
    if (mode === 'auto' && seriesCount <= 1) {
      return false;
    }
    return { position: this.options.legendPosition || 'Bottom' };
  };

  PivotChart.prototype.getFooter = function(model) {
    var notices = [];
    if (this.options.footer) {
      notices.push(this.options.footer);
    }
    if (model.pointsTruncated) {
      notices.push(this.getText('pivot.chart.pointsTruncated', {
        count: normalizeLimit(this.options.maxPoints, 100),
        total: model.pointCount
      }));
    }
    if (model.seriesTruncated) {
      notices.push(this.getText('pivot.chart.seriesTruncated', {
        count: normalizeLimit(this.options.maxSeries, 12),
        total: model.seriesCount
      }));
    }
    return notices.join(' · ');
  };

  PivotChart.prototype.getChartSeries = function(model) {
    var type = String(this.options.chartType || 'Column').toLowerCase();
    var selected;
    if (type !== 'pie') {
      return model.series;
    }
    selected = Math.max(0, Math.min(
      Math.floor(Number(this.options.selectedSeries) || 0),
      Math.max(0, model.series.length - 1)
    ));
    if (!model.series[selected]) {
      return [];
    }
    return [{
      name: model.series[selected].name,
      data: model.categories.map(function(category, index) {
        return { name: category, value: model.series[selected].data[index] };
      })
    }];
  };

  PivotChart.prototype.refresh = function() {
    var engineView = this._engine ? this._engine.pivotView : null;
    var useGridView = Boolean(this._selectionSource && this._selectionSource.engine === this._engine);
    var view = useGridView ? createPivotGridChartView(this._selectionSource, engineView) : engineView;
    var model = createPivotChartModel(view, {
      locale: this.locale,
      totalText: this.getText('pivot.grandTotal'),
      showTotals: this.options.showTotals,
      maxPoints: this.options.maxPoints,
      maxSeries: this.options.maxSeries,
      useVisibleEntries: useGridView
    });
    var gridPoint = useGridView ? resolvePivotChartPoint(this._selectionSource, model) : null;
    if (gridPoint && String(this.options.chartType || 'Column').toLowerCase() === 'pie') {
      this.options.selectedSeries = gridPoint.seriesIndex;
    }
    var series = this.getChartSeries(model);
    var isPie = String(this.options.chartType || 'Column').toLowerCase() === 'pie';
    var pieItems = isPie && series[0] ? series[0].data : [];
    if (this._disposed || !this.chart) {
      return this;
    }
    this.model = model;
    this.chart.setOptions({
      chartType: this.options.chartType,
      type: this.options.chartType,
      itemsSource: isPie ? pieItems : null,
      bindingName: isPie ? 'name' : '',
      binding: isPie ? 'value' : '',
      categories: isPie ? [] : model.categories,
      series: isPie ? [] : series,
      header: this.options.showTitle === false ? '' :
        (this.options.header || this.getText('pivot.chart.title')),
      footer: this.getFooter(model),
      legend: this.getLegendOption(isPie ? pieItems.length : series.length),
      tooltip: this.options.tooltip,
      palette: this.options.palette,
      animation: this.options.animation,
      dataLabel: this.options.dataLabel,
      axisX: this.options.axisX,
      axisY: this.options.axisY,
      formatValue: this.options.formatValue || function(value) {
        return formatChartNumber(value, this.locale);
      }.bind(this),
      formatTooltip: this.options.formatTooltip,
      emptyText: this.options.emptyText || this.getText('emptyText'),
      selectionMode: this.options.selectionMode,
      selectedItemOffset: this.options.selectedItemOffset,
      selectedItemPosition: this.options.selectedItemPosition,
      isAnimated: this.options.isAnimated,
      locale: this.locale,
      observeData: false
    });
    if (useGridView) {
      if (gridPoint) {
        this.chart.selectPoint(gridPoint.pointIndex, isPie ? null : gridPoint.seriesIndex);
      } else {
        this.chart.selectPoint(-1);
      }
    }
    return this;
  };

  PivotChart.prototype.invalidate = function() {
    var self = this;
    var schedule;
    if (this._disposed || this._raf) {
      return;
    }
    schedule = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : function(callback) {
      return setTimeout(callback, 0);
    };
    this._raf = schedule(function() {
      self._raf = 0;
      self.refresh();
    });
  };

  PivotChart.prototype.resize = function() {
    if (this.chart) {
      this.chart.resize();
    }
    return this;
  };

  PivotChart.prototype.dispose = function() {
    if (this._disposed) {
      return;
    }
    this._disposed = true;
    if (this._engine && this._engine.updatedView) {
      this._engine.updatedView.removeHandler(this._updatedHandler, this);
    }
    if (this._raf) {
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this._raf);
      } else {
        clearTimeout(this._raf);
      }
      this._raf = 0;
    }
    if (this.chart) {
      this.chart.off('selectionChanged', this._chartSelectionHandler);
      this.chart.dispose();
    }
    this.bindSelectionSource(null);
    this.removeEventListener();
    unregisterControl(this.hostElement, this);
    this.hostElement.innerHTML = '';
    this.hostElement.classList.remove('fg-root', 'fg-pivot-chart');
    this._engine = null;
    this.chart = null;
  };

  Object.defineProperties(PivotChart.prototype, {
    itemsSource: {
      get: function() { return this._engine; },
      set: function(value) { this.setItemsSource(value); }
    },
    engine: {
      get: function() { return this._engine; }
    },
    chartType: {
      get: function() { return this.options.chartType; },
      set: function(value) { this.setType(value); }
    },
    showTitle: {
      get: function() { return this.options.showTitle !== false; },
      set: function(value) { this.options.showTitle = value !== false; this.refresh(); }
    },
    showLegend: {
      get: function() { return this.options.showLegend; },
      set: function(value) { this.options.showLegend = value; this.refresh(); }
    },
    showTotals: {
      get: function() { return this.options.showTotals === true; },
      set: function(value) { this.options.showTotals = value === true; this.refresh(); }
    },
    maxPoints: {
      get: function() { return this.options.maxPoints; },
      set: function(value) { this.options.maxPoints = normalizeLimit(value, 100); this.refresh(); }
    },
    maxSeries: {
      get: function() { return this.options.maxSeries; },
      set: function(value) { this.options.maxSeries = normalizeLimit(value, 12); this.refresh(); }
    },
    selectedSeries: {
      get: function() { return this.options.selectedSeries; },
      set: function(value) { this.options.selectedSeries = Math.max(0, Math.floor(Number(value) || 0)); this.refresh(); }
    },
    selectionSource: {
      get: function() { return this._selectionSource; },
      set: function(value) { this.bindSelectionSource(value); this.refresh(); }
    }
  });

  PivotChart.ChartType = Chart.ChartType;
  return PivotChart;
}



function createPivotGridFactory(FabGrid, PivotEngine) {
  var baseApplyLocaleToDom = FabGrid.prototype.applyLocaleToDom;
  var baseCreateBodyCell = FabGrid.prototype.createBodyCell;
  var baseCreateDom = FabGrid.prototype.createDom;
  var baseDispose = FabGrid.prototype.dispose;
  var baseGetHeaderHeight = FabGrid.prototype.getHeaderHeight;
  var baseHandleClick = FabGrid.prototype.handleClick;
  var baseHandleContextMenu = FabGrid.prototype.handleContextMenu;
  var baseHandleDblClick = FabGrid.prototype.handleDblClick;
  var baseHandleKeyDown = FabGrid.prototype.handleKeyDown;
  var baseHandlePointerDown = FabGrid.prototype.handlePointerDown;
  var baseRenderHeaders = FabGrid.prototype.renderHeaders;
  var baseSetItemsSource = FabGrid.prototype.setItemsSource;
  var baseSetLocale = FabGrid.prototype.setLocale;

  function assign(target, source) {
    var key;
    for (key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
    return target;
  }

  function closestByClass(target, className, boundary) {
    var node = target && target.nodeType === 1 ? target : target ? target.parentElement : null;
    while (node) {
      if (node.classList && node.classList.contains(className)) {
        return node;
      }
      if (node === boundary) {
        break;
      }
      node = node.parentElement;
    }
    return null;
  }

  function getPivotFieldSortDirection(field) {
    var value = field ? field.sortDirection : 0;
    var text;
    if (value === 1 || value === -1) {
      return value;
    }
    text = String(value == null ? '' : value).toLowerCase();
    if (text === 'asc' || text === 'ascending') {
      return 1;
    }
    if (text === 'desc' || text === 'descending') {
      return -1;
    }
    return 0;
  }

  function getPivotSortMenuKey(field) {
    var direction = getPivotFieldSortDirection(field);
    return direction === 0 ? 'pivot.sortAscending' :
      direction === 1 ? 'pivot.sortDescending' : 'pivot.clearSort';
  }

  function getRowGroupMenuState(entriesByKey, collapsed) {
    var hasGroups = false;
    var hasExpanded = false;
    var key;
    entriesByKey = entriesByKey || {};
    collapsed = collapsed || {};
    for (key in entriesByKey) {
      if (entriesByKey[key].isSubtotal) {
        hasGroups = true;
        if (!collapsed[key]) {
          hasExpanded = true;
          break;
        }
      }
    }
    return {
      hasGroups: hasGroups,
      hasExpanded: hasExpanded
    };
  }

  function isHiddenByCollapsedEntry(entry, collapsed) {
    var key;
    var length;
    if (!entry || !entry.path) {
      return false;
    }
    for (length = 1; length < entry.path.length; length += 1) {
      key = createPivotPathKey(entry.path.slice(0, length));
      if (collapsed[key]) {
        return true;
      }
    }
    return false;
  }

  function getNumberDigits(format, fallback) {
    var match = String(format || '').match(/^[ncp](\d+)$/i);
    return match ? Math.max(0, Number(match[1])) : fallback;
  }

  function formatPivotValue(value, field, locale) {
    var format = String(field && field.format || '');
    var type = format.charAt(0).toLowerCase();
    var digits;
    var options;
    if (value == null || value === '') {
      return '';
    }
    if (typeof value !== 'number') {
      return String(value);
    }
    if (type === 'p') {
      digits = getNumberDigits(format, 0);
      return new Intl.NumberFormat(locale || undefined, {
        style: 'percent',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      }).format(value);
    }
    digits = getNumberDigits(format, type === 'c' ? 2 : 0);
    options = {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    };
    if (type === 'c') {
      options.style = 'currency';
      options.currency = field.currency || 'USD';
    }
    return new Intl.NumberFormat(locale || undefined, options).format(value);
  }

  function createMenuItem(action, label, iconClass, active, disabled) {
    var item = document.createElement('button');
    var icon = document.createElement('span');
    var text = document.createElement('span');
    item.type = 'button';
    item.className = 'fg-top-left-menu-item' + (active ? ' fg-top-left-menu-item-active' : '');
    item.setAttribute('role', 'menuitem');
    item.setAttribute('data-action', action);
    item.disabled = disabled === true;
    if (disabled === true) {
      item.setAttribute('aria-disabled', 'true');
    }
    icon.className = 'fg-top-left-menu-icon' + (iconClass ? ' ' + iconClass : '');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = active ? '✓' : '';
    text.className = 'fg-top-left-menu-label';
    text.textContent = label;
    item.appendChild(icon);
    item.appendChild(text);
    return item;
  }

  function PivotGrid(element, options) {
    var sourceOptions = options || {};
    var engine = sourceOptions.engine || sourceOptions.itemsSource || null;
    var baseOptions = assign({}, sourceOptions);
    this._pivotConstructing = true;
    this._pivotEngine = null;
    this._pivotView = null;
    this._pivotDataHeaderLevelCount = 1;
    this._pivotHeaderLevelCount = 1;
    this._pivotHeaderRowHeight = Math.max(24, Number(sourceOptions.pivotHeaderHeight || sourceOptions.headerHeight) || 32);
    this._pivotRowCollapsed = Object.create(null);
    this._pivotColumnCollapsed = Object.create(null);
    this._pivotRowEntriesByKey = Object.create(null);
    this._pivotColumnEntriesByKey = Object.create(null);
    this._pivotRowGroups = [];
    this._pivotContext = null;
    this._pivotDetailGrid = null;
    this._pivotUpdatedHandler = this._handlePivotUpdated.bind(this);
    baseOptions.itemsSource = [];
    baseOptions.columns = [];
    baseOptions.allowEditing = false;
    baseOptions.editOnSelect = false;
    baseOptions.allowFiltering = false;
    baseOptions.showSearchRow = false;
    baseOptions.showColumnChooser = false;
    baseOptions.showRowHeaders = false;
    baseOptions.allowSorting = false;
    baseOptions.allowDragging = 'None';
    baseOptions.allowPinning = false;
    baseOptions.pagination = false;
    baseOptions.frozenColumns = 0;
    baseOptions.copyHeaders = sourceOptions.copyHeaders || 'All';
    baseOptions.selectionMode = sourceOptions.selectionMode || 'CellRange';
    FabGrid.call(this, element, baseOptions);
    this._pivotConstructing = false;
    if (engine) {
      this.setPivotEngine(engine);
    }
  }

  PivotGrid.prototype = Object.create(FabGrid.prototype);
  PivotGrid.prototype.constructor = PivotGrid;

  PivotGrid.prototype.createDom = function() {
    var overlay;
    var dialog;
    var header;
    var title;
    var close;
    var body;
    baseCreateDom.call(this);
    this.root.classList.add('fg-pivot-grid');
    overlay = document.createElement('div');
    dialog = document.createElement('div');
    header = document.createElement('div');
    title = document.createElement('strong');
    close = document.createElement('button');
    body = document.createElement('div');
    overlay.className = 'fg-pivot-detail-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    dialog.className = 'fg-pivot-detail-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    header.className = 'fg-pivot-detail-header';
    title.className = 'fg-pivot-detail-title';
    close.className = 'fg-pivot-detail-close';
    close.type = 'button';
    close.textContent = '×';
    body.className = 'fg-pivot-detail-body';
    header.appendChild(title);
    header.appendChild(close);
    dialog.appendChild(header);
    dialog.appendChild(body);
    overlay.appendChild(dialog);
    this.root.appendChild(overlay);
    this.pivotDetailOverlay = overlay;
    this.pivotDetailDialog = dialog;
    this.pivotDetailTitle = title;
    this.pivotDetailClose = close;
    this.pivotDetailBody = body;
    this.addEventListener(this.headerFrozen, 'change', this._handlePivotFilterFieldChange.bind(this));
    this.applyLocaleToDom();
  };

  PivotGrid.prototype.applyLocaleToDom = function() {
    baseApplyLocaleToDom.call(this);
    if (this.pivotDetailDialog) {
      this.pivotDetailDialog.setAttribute('aria-label', this.getText('pivot.detailTitle'));
    }
    if (this.pivotDetailClose) {
      this.pivotDetailClose.setAttribute('aria-label', this.getText('pivot.closeDetail'));
      this.pivotDetailClose.title = this.getText('pivot.closeDetail');
    }
  };

  PivotGrid.prototype.setItemsSource = function(value, silent) {
    if (this._pivotConstructing) {
      return baseSetItemsSource.call(this, value, silent);
    }
    return this.setPivotEngine(value, silent);
  };

  PivotGrid.prototype.setLocale = function(locale, messages, silent) {
    if (!this._pivotConstructing && this._pivotEngine) {
      this._applyPivotView(true);
    }
    baseSetLocale.call(this, locale, messages, silent);
    return this;
  };

  PivotGrid.prototype.setPivotEngine = function(engine, silent) {
    if (!(engine instanceof PivotEngine)) {
      throw new TypeError('PivotGrid itemsSource must be a fabui.pivot.PivotEngine instance.');
    }
    if (this._pivotEngine === engine) {
      return this;
    }
    if (this._pivotEngine && this._pivotEngine.updatedView) {
      this._pivotEngine.updatedView.removeHandler(this._pivotUpdatedHandler, this);
    }
    this._pivotEngine = engine;
    engine.updatedView.addHandler(this._pivotUpdatedHandler, this);
    this._applyPivotView(silent === true);
    return this;
  };

  PivotGrid.prototype._handlePivotUpdated = function() {
    this._applyPivotView(false);
  };

  PivotGrid.prototype._applyPivotView = function(silent) {
    var view = this._pivotEngine ? this._pivotEngine.pivotView : null;
    var selectionState = this._capturePivotSelectionState();
    var selectionChanged;
    var rowEntries;
    var columnEntries;
    var visibleRows = [];
    var columns = [];
    var i;
    this._pivotView = view;
    this._pivotRowEntriesByKey = Object.create(null);
    this._pivotColumnEntriesByKey = Object.create(null);
    this._pivotRowGroups = [];
    if (!view) {
      baseSetItemsSource.call(this, [], true);
      FabGrid.prototype.setColumns.call(this, [], true);
      if (!silent) this.refresh();
      return;
    }
    rowEntries = view.rowEntries;
    columnEntries = view.columnEntries;
    for (i = 0; i < rowEntries.length; i += 1) {
      this._pivotRowEntriesByKey[rowEntries[i].key] = rowEntries[i];
    }
    for (i = 0; i < rowEntries.length; i += 1) {
      if (!isHiddenByCollapsedEntry(rowEntries[i], this._pivotRowCollapsed)) {
        visibleRows.push(view.rows[i]);
      }
    }
    for (i = 0; i < columnEntries.length; i += 1) {
      this._pivotColumnEntriesByKey[columnEntries[i].key] = columnEntries[i];
    }
    columns = this._createPivotColumns(view);
    this._pivotRowGroups = this._buildPivotRowGroups(visibleRows, view.rowFields.length);
    this._pivotDataHeaderLevelCount = this._getPivotDataHeaderLevelCount();
    this._pivotHeaderLevelCount = this._getPivotHeaderLevelCount();
    this.options.frozenColumns = view.rowFields.length;
    FabGrid.prototype.setColumns.call(this, columns, true);
    baseSetItemsSource.call(this, visibleRows, true);
    selectionChanged = this._restorePivotSelectionState(selectionState);
    this.syncHeaderLayout();
    if (!silent) {
      this.refresh();
      if (selectionChanged) {
        this.emit('selectionChanged', this.getSelectionEventArgs(
          this.selection.row,
          this.selection.col,
          this.selectionAnchor.row,
          this.selectionAnchor.col
        ));
      }
    }
  };

  PivotGrid.prototype._capturePivotSelectionState = function() {
    var anchor = this.selectionAnchor || this.selection;
    return {
      activeRowKey: this._getPivotSelectionRowKey(this.selection.row),
      activeColumnKey: this._getPivotSelectionColumnKey(this.selection.col),
      anchorRowKey: this._getPivotSelectionRowKey(anchor.row),
      anchorColumnKey: this._getPivotSelectionColumnKey(anchor.col),
      activeRow: this.selection.row,
      activeCol: this.selection.col,
      anchorRow: anchor.row,
      anchorCol: anchor.col
    };
  };

  PivotGrid.prototype._getPivotSelectionRowKey = function(rowIndex) {
    var row = this.view && this.view[rowIndex];
    return row && row.__pivotMeta ? row.__pivotMeta.key : null;
  };

  PivotGrid.prototype._getPivotSelectionColumnKey = function(columnIndex) {
    var column = this.visibleColumns && this.visibleColumns[columnIndex];
    var dataColumn = column && column._pivotDataColumn;
    if (!column) {
      return null;
    }
    return dataColumn ?
      'value:' + dataColumn.entry.key + ':' + dataColumn.valueField.key :
      'row:' + column.binding;
  };

  PivotGrid.prototype._findPivotSelectionRow = function(key, fallback) {
    var entry;
    var i;
    if (key != null) {
      for (i = 0; i < this.view.length; i += 1) {
        entry = this.view[i] && this.view[i].__pivotMeta;
        if (entry && entry.key === key) {
          return i;
        }
      }
    }
    return fallback;
  };

  PivotGrid.prototype._findPivotSelectionColumn = function(key, fallback) {
    var i;
    if (key != null) {
      for (i = 0; i < this.visibleColumns.length; i += 1) {
        if (this._getPivotSelectionColumnKey(i) === key) {
          return i;
        }
      }
    }
    return fallback;
  };

  PivotGrid.prototype._restorePivotSelectionState = function(state) {
    var previous = {
      row: this.selection.row,
      col: this.selection.col,
      anchorRow: (this.selectionAnchor || this.selection).row,
      anchorCol: (this.selectionAnchor || this.selection).col
    };
    if (state) {
      this.selection = {
        row: this._findPivotSelectionRow(state.activeRowKey, state.activeRow),
        col: this._findPivotSelectionColumn(state.activeColumnKey, state.activeCol)
      };
      this.selectionAnchor = {
        row: this._findPivotSelectionRow(state.anchorRowKey, state.anchorRow),
        col: this._findPivotSelectionColumn(state.anchorColumnKey, state.anchorCol)
      };
    }
    this.clampSelection();
    this.rowSelection = this.view.length ? this.selection.row : null;
    return previous.row !== this.selection.row ||
      previous.col !== this.selection.col ||
      previous.anchorRow !== this.selectionAnchor.row ||
      previous.anchorCol !== this.selectionAnchor.col;
  };

  PivotGrid.prototype._createPivotColumns = function(view) {
    var columns = [];
    var self = this;
    var field;
    var dataColumn;
    var i;
    for (i = 0; i < view.rowFields.length; i += 1) {
      field = view.rowFields[i];
      columns.push({
        binding: '__pivot_row_' + i,
        header: this.options.showRowFieldHeaders === false ? '' : field.header,
        width: field.width,
        minWidth: 72,
        align: field.align || 'left',
        dataType: field.dataType,
        readOnly: true,
        isReadOnly: true,
        _pivotRowField: field,
        _pivotRowFieldIndex: i,
        formatter: createRowFieldFormatter(this, field, i)
      });
    }
    for (i = 0; i < view.dataColumns.length; i += 1) {
      dataColumn = view.dataColumns[i];
      field = dataColumn.valueField;
      columns.push({
        binding: dataColumn.binding,
        header: field.header,
        width: field.width,
        minWidth: 72,
        align: field.align || 'right',
        dataType: field.dataType || 'number',
        format: field.format,
        visible: !isHiddenByCollapsedEntry(dataColumn.entry, this._pivotColumnCollapsed),
        readOnly: true,
        isReadOnly: true,
        _pivotDataColumn: dataColumn,
        formatter: function(value, item, column) {
          return formatPivotValue(value, column._pivotDataColumn.valueField, self.locale);
        }
      });
    }
    return columns;
  };

  PivotGrid.prototype._getExcelExportRows = function() {
    return this._pivotView && Array.isArray(this._pivotView.rows) ? this._pivotView.rows : (this.view || []);
  };

  PivotGrid.prototype._isExcelExportRowHidden = function(row) {
    var entry = row && row.__pivotMeta;
    return Boolean(entry && isHiddenByCollapsedEntry(entry, this._pivotRowCollapsed));
  };

  function createRowFieldFormatter(grid, field, fieldIndex) {
    return function(value, item) {
      var entry = item && item.__pivotMeta;
      if (!entry) {
        return value == null ? '' : String(value);
      }
      if (entry.isGrandTotal) {
        return fieldIndex === 0 ? grid.getText('pivot.grandTotal') : '';
      }
      if (entry.isSubtotal && fieldIndex === entry.path.length) {
        return grid.getText('pivot.total');
      }
      return fieldIndex < entry.path.length ? grid._pivotEngine.formatFieldValue(field, value, grid.locale) : '';
    };
  }

  PivotGrid.prototype._buildPivotRowGroups = function(rows, fieldCount) {
    var groups = [];
    var rowGroups;
    var current;
    var entry;
    var key;
    var fieldIndex;
    var rowIndex;
    rows = rows || [];
    for (fieldIndex = 0; fieldIndex < fieldCount; fieldIndex += 1) {
      rowGroups = [];
      current = null;
      for (rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
        entry = rows[rowIndex] && rows[rowIndex].__pivotMeta;
        if (!entry || entry.isGrandTotal || entry.path.length <= fieldIndex) {
          current = null;
          continue;
        }
        key = createPivotPathKey(entry.path.slice(0, fieldIndex + 1));
        if (!current || current.key !== key) {
          current = {
            key: key,
            fieldIndex: fieldIndex,
            start: rowIndex,
            end: rowIndex,
            toggleKey: null
          };
        } else {
          current.end = rowIndex;
        }
        if (entry.isSubtotal && entry.path.length === fieldIndex + 1) {
          current.toggleKey = entry.key;
        }
        rowGroups[rowIndex] = current;
      }
      groups[fieldIndex] = rowGroups;
    }
    return groups;
  };

  PivotGrid.prototype._getPivotDataHeaderLevelCount = function() {
    var columnFieldCount = this._pivotView ? this._pivotView.columnFields.length : 0;
    var valueFieldCount = this._pivotView ? this._pivotView.valueFields.length : 0;
    return Math.max(1, columnFieldCount + (valueFieldCount > 1 || columnFieldCount === 0 ? 1 : 0));
  };

  PivotGrid.prototype._getPivotHeaderLevelCount = function() {
    var filterFieldCount = this._pivotView ? this._pivotView.filterFields.length : 0;
    return Math.max(this._pivotDataHeaderLevelCount || 1, filterFieldCount + (filterFieldCount ? 1 : 0));
  };

  PivotGrid.prototype.getHeaderHeight = function() {
    if (!this._pivotView) {
      return baseGetHeaderHeight.call(this);
    }
    return this._pivotHeaderLevelCount * this._pivotHeaderRowHeight;
  };

  PivotGrid.prototype.getHeaderTitleHeight = function() {
    return this.getHeaderHeight();
  };

  PivotGrid.prototype.renderHeaders = function(colRange) {
    var frozenFragment;
    var scrollFragment;
    var dataColumns;
    var groups;
    var column;
    var cell;
    var i;
    var level;
    var dataLevelOffset;
    var hasFilterFields;
    var rowFieldTop;
    if (!this._pivotView) {
      baseRenderHeaders.call(this, colRange);
      return;
    }
    this.headerFrozen.innerHTML = '';
    this.headerFrozenRight.innerHTML = '';
    this.headerCanvas.innerHTML = '';
    frozenFragment = document.createDocumentFragment();
    scrollFragment = document.createDocumentFragment();
    hasFilterFields = this._pivotView.filterFields.length > 0;
    rowFieldTop = hasFilterFields ? (this._pivotHeaderLevelCount - 1) * this._pivotHeaderRowHeight : 0;
    if (hasFilterFields && this.frozenWidth > 0) {
      for (level = 0; level < this._pivotView.filterFields.length; level += 1) {
        frozenFragment.appendChild(this._createPivotFilterFieldHeader(
          this._pivotView.filterFields[level],
          level
        ));
      }
    }
    for (i = 0; i < this.frozenColumns; i += 1) {
      column = this.visibleColumns[i];
      cell = this._createPivotHeaderCell({
        label: column.header,
        left: column._left,
        top: rowFieldTop,
        width: column._width,
        height: hasFilterFields ? this._pivotHeaderRowHeight : this.getHeaderHeight(),
        col: i,
        className: 'fg-pivot-row-field-header',
        field: column._pivotRowField,
        sortable: Boolean(column._pivotRowField),
        sortDirection: getPivotFieldSortDirection(column._pivotRowField)
      });
      frozenFragment.appendChild(cell);
    }
    dataColumns = this.visibleColumns.slice(this.frozenColumns, this.scrollableColumnEnd);
    dataLevelOffset = this._pivotHeaderLevelCount - this._pivotDataHeaderLevelCount;
    for (level = 0; level < this._pivotDataHeaderLevelCount; level += 1) {
      groups = this._createPivotHeaderGroups(dataColumns, level, level + dataLevelOffset);
      for (i = 0; i < groups.length; i += 1) {
        if (groups[i].endCol < colRange.start || groups[i].startCol >= colRange.end) {
          continue;
        }
        scrollFragment.appendChild(this._createPivotHeaderCell(groups[i]));
      }
    }
    this.headerFrozen.appendChild(frozenFragment);
    this.headerCanvas.appendChild(scrollFragment);
  };

  PivotGrid.prototype._createPivotFilterFieldHeader = function(field, level) {
    var cell = document.createElement('div');
    var title = document.createElement('span');
    var label = document.createElement('span');
    var select = this._createPivotFilterFieldSelect(field);
    cell.className = 'fg-header-cell fg-pivot-header-cell fg-pivot-filter-field-header';
    cell.style.left = '0px';
    cell.style.top = (level * this._pivotHeaderRowHeight) + 'px';
    cell.style.width = this.frozenWidth + 'px';
    cell.style.height = this._pivotHeaderRowHeight + 'px';
    cell.setAttribute('data-pivot-field', field.key);
    cell.setAttribute('role', 'columnheader');
    cell.title = field.header;
    title.className = 'fg-header-title fg-pivot-header-title';
    title.style.height = this._pivotHeaderRowHeight + 'px';
    label.className = 'fg-header-label fg-pivot-filter-field-label';
    label.textContent = field.header;
    title.appendChild(label);
    title.appendChild(select);
    cell.appendChild(title);
    return cell;
  };

  PivotGrid.prototype._createPivotFilterFieldSelect = function(field) {
    var select = document.createElement('select');
    var all = document.createElement('option');
    var source = this._pivotEngine ? this._pivotEngine.itemsSource : [];
    var filterValues = field.filter && Array.isArray(field.filter.values) ? field.filter.values : null;
    var hasSingleFilter = !!(filterValues && filterValues.length === 1);
    var current = hasSingleFilter ? filterValues[0] : undefined;
    var values = [];
    var value;
    var option;
    var filtered;
    var exists;
    var i;
    var j;
    select.className = 'fg-pivot-filter-field-select';
    select.setAttribute('data-pivot-field', field.key);
    select.setAttribute('aria-label', this.getText('pivot.panel.filterField', { field: field.header }));
    all.value = '';
    all.textContent = this.getText('pivot.panel.allValues');
    all._pivotAllValues = true;
    all.selected = !field.filter;
    select.appendChild(all);
    if (field.filter && !hasSingleFilter) {
      filtered = document.createElement('option');
      filtered.value = '__pivot_filtered__';
      filtered.textContent = this.getText('pivot.filteredValues');
      filtered._pivotKeepFilter = true;
      filtered.selected = true;
      select.appendChild(filtered);
    }
    for (i = 0; i < source.length && values.length < 200; i += 1) {
      value = field.getItemValue(source[i]);
      exists = false;
      for (j = 0; j < values.length; j += 1) {
        if (pivotValuesEqual(values[j], value, field.dataType)) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        values.push(value);
      }
    }
    values.sort(function(left, right) {
      return String(left == null ? '' : left).localeCompare(String(right == null ? '' : right), undefined, { numeric: true });
    });
    for (i = 0; i < values.length; i += 1) {
      option = document.createElement('option');
      option.value = String(i + 1);
      option.textContent = this._pivotEngine.formatFieldValue(field, values[i], this.locale) || this.getText('filter.blankValue');
      option._pivotFilterValue = values[i];
      option.selected = hasSingleFilter && pivotValuesEqual(current, values[i], field.dataType);
      select.appendChild(option);
    }
    return select;
  };

  PivotGrid.prototype._handlePivotFilterFieldChange = function(event) {
    var select = event.target;
    var selected;
    var field;
    if (!select || !select.classList || !select.classList.contains('fg-pivot-filter-field-select') || !this._pivotEngine) {
      return;
    }
    selected = select.selectedOptions && select.selectedOptions[0];
    field = this._pivotEngine.getField(select.getAttribute('data-pivot-field'));
    if (!field || this._pivotEngine.filterFields.indexOf(field) < 0 || !selected || selected._pivotKeepFilter) {
      return;
    }
    field.filter = selected._pivotAllValues ? null : { values: [selected._pivotFilterValue] };
    this._pivotEngine.emit('viewDefinitionChanged', { property: 'filter', field: field });
    this._pivotEngine.refresh();
  };

  PivotGrid.prototype._createPivotHeaderGroups = function(columns, level, topLevel) {
    var groups = [];
    var current = null;
    var descriptor;
    var column;
    var i;
    for (i = 0; i < columns.length; i += 1) {
      column = columns[i];
      descriptor = this._getPivotHeaderDescriptor(column, level);
      if (!current || current.key !== descriptor.key) {
        current = {
          key: descriptor.key,
          label: descriptor.label,
          left: column._left - this.frozenWidth,
          top: (topLevel == null ? level : topLevel) * this._pivotHeaderRowHeight,
          width: column._width,
          height: this._pivotHeaderRowHeight,
          col: column._viewIndex,
          startCol: column._viewIndex,
          endCol: column._viewIndex,
          className: 'fg-pivot-column-header',
          entry: descriptor.entry,
          field: descriptor.field,
          toggle: descriptor.toggle
        };
        groups.push(current);
      } else {
        current.width += column._width;
        current.endCol = column._viewIndex;
      }
    }
    return groups;
  };

  PivotGrid.prototype._getPivotHeaderDescriptor = function(column, level) {
    var dataColumn = column._pivotDataColumn;
    var entry = dataColumn.entry;
    var columnFields = this._pivotView.columnFields;
    var hasValueLevel = this._pivotView.valueFields.length > 1 || columnFields.length === 0;
    var field = level < columnFields.length ? columnFields[level] : dataColumn.valueField;
    var label = '';
    var key;
    var toggle = false;
    if (level < columnFields.length) {
      if (entry.isGrandTotal) {
        label = level === 0 ? this.getText('pivot.grandTotal') : '';
      } else if (level < entry.path.length) {
        label = this._pivotEngine.formatFieldValue(field, entry.path[level], this.locale);
      } else if (entry.isSubtotal && level === entry.path.length) {
        label = this.getText('pivot.total');
        toggle = this.options.collapsibleSubtotals !== false;
      }
      key = 'axis:' + level + ':' + JSON.stringify(entry.path.slice(0, Math.min(level + 1, entry.path.length))) +
        ':' + (entry.isSubtotal ? 'subtotal' : entry.isGrandTotal ? 'grand' : 'leaf') + ':' + label;
    } else if (hasValueLevel) {
      label = dataColumn.valueField.header;
      key = 'value:' + dataColumn.binding;
    } else {
      label = dataColumn.valueField.header;
      key = 'value:' + dataColumn.binding;
    }
    return {
      key: key,
      label: label,
      entry: entry,
      field: field,
      toggle: toggle
    };
  };

  PivotGrid.prototype._createPivotHeaderCell = function(options) {
    var cell = document.createElement('div');
    var title = document.createElement('span');
    var label = document.createElement('span');
    var sortWrap;
    var sortOrder;
    var sort;
    var toggle;
    var resize;
    cell.className = 'fg-header-cell fg-pivot-header-cell ' + (options.className || '');
    cell.style.left = options.left + 'px';
    cell.style.top = options.top + 'px';
    cell.style.width = options.width + 'px';
    cell.style.height = options.height + 'px';
    cell.setAttribute('data-col', options.col);
    cell.setAttribute('role', 'columnheader');
    if (options.field) {
      cell.setAttribute('data-pivot-field', options.field.key);
      cell.title = options.field.header;
    }
    title.className = 'fg-header-title fg-pivot-header-title';
    title.style.height = options.height + 'px';
    label.className = 'fg-header-label';
    label.textContent = options.label || '';
    if (options.toggle && options.entry) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'fg-pivot-toggle fg-pivot-column-toggle';
      toggle.setAttribute('data-pivot-key', options.entry.key);
      toggle.setAttribute('aria-expanded', this._pivotColumnCollapsed[options.entry.key] ? 'false' : 'true');
      toggle.setAttribute('aria-label', this.getText(
        this._pivotColumnCollapsed[options.entry.key] ? 'pivot.expandGroup' : 'pivot.collapseGroup'
      ));
      toggle.textContent = this._pivotColumnCollapsed[options.entry.key] ? '+' : '−';
      title.appendChild(toggle);
    }
    title.appendChild(label);
    if (options.sortable) {
      sortWrap = document.createElement('span');
      sortOrder = document.createElement('span');
      sort = document.createElement('span');
      sortWrap.className = 'fg-sort-wrap' + (options.sortDirection ? '' : ' fg-sort-wrap-none');
      sortOrder.className = 'fg-sort-order';
      sort.className = 'fg-sort' + (options.sortDirection === 1 ? ' fg-sort-asc' :
        options.sortDirection === -1 ? ' fg-sort-desc' : ' fg-sort-none');
      sort.setAttribute('aria-hidden', 'true');
      sortWrap.appendChild(sortOrder);
      sortWrap.appendChild(sort);
      title.appendChild(sortWrap);
    }
    cell.appendChild(title);
    if (this.options.allowResizing !== false && options.startCol === options.endCol) {
      resize = document.createElement('span');
      resize.className = 'fg-resize';
      resize.setAttribute('data-resize-col', options.col);
      cell.appendChild(resize);
    }
    if (typeof this.createFormatItemEventArgs === 'function') {
      this.raiseFormatItem(this.createFormatItemEventArgs(this.columnHeaders, cell,
        Math.floor(options.top / this._pivotHeaderRowHeight), options.col, {
          column: this.visibleColumns[options.col] || null,
          value: options.label
        }));
    }
    return cell;
  };

  PivotGrid.prototype.createBodyCell = function(rowIndex, colIndex, pane, selectionRange) {
    var cell = baseCreateBodyCell.call(this, rowIndex, colIndex, pane, selectionRange);
    var item = this.view[rowIndex];
    var entry = item && item.__pivotMeta;
    var column = this.visibleColumns[colIndex];
    var group;
    var renderStart;
    var renderEnd;
    var label;
    var toggle;
    if (!cell || !entry || !column) {
      return cell;
    }
    if (column._pivotRowField) {
      cell.classList.add('fg-pivot-row-field-cell');
      group = this._pivotRowGroups[column._pivotRowFieldIndex] &&
        this._pivotRowGroups[column._pivotRowFieldIndex][rowIndex];
      if (group && (group.end > group.start || group.toggleKey)) {
        renderStart = Math.max(group.start, this.rowRange ? this.rowRange.start : group.start);
        renderEnd = Math.min(group.end, this.rowRange ? this.rowRange.end - 1 : group.end);
        if (rowIndex !== renderStart) {
          cell.classList.add('fg-pivot-row-merged-covered');
          cell.style.visibility = 'hidden';
        } else {
          cell.classList.add('fg-pivot-row-merged-cell');
          cell.style.height = ((renderEnd - renderStart + 1) * this.options.rowHeight) + 'px';
          cell.style.zIndex = '2';
          cell.setAttribute('aria-rowspan', group.end - group.start + 1);
          label = document.createElement('span');
          label.className = 'fg-pivot-row-merged-label';
          while (cell.firstChild) {
            label.appendChild(cell.firstChild);
          }
          if (group.toggleKey && this.options.collapsibleSubtotals !== false) {
            toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'fg-pivot-toggle fg-pivot-row-toggle';
            toggle.setAttribute('data-pivot-key', group.toggleKey);
            toggle.setAttribute('aria-expanded', this._pivotRowCollapsed[group.toggleKey] ? 'false' : 'true');
            toggle.setAttribute('aria-label', this.getText(
              this._pivotRowCollapsed[group.toggleKey] ? 'pivot.expandGroup' : 'pivot.collapseGroup'
            ));
            toggle.textContent = this._pivotRowCollapsed[group.toggleKey] ? '+' : '−';
            cell.appendChild(toggle);
          }
          cell.appendChild(label);
        }
      }
    }
    if (entry.isSubtotal || entry.isGrandTotal ||
      (column._pivotDataColumn && (column._pivotDataColumn.entry.isSubtotal || column._pivotDataColumn.entry.isGrandTotal))) {
      cell.classList.add('fg-pivot-total-cell');
    }
    return cell;
  };

  PivotGrid.prototype.handlePointerDown = function(event) {
    if (closestByClass(event.target, 'fg-pivot-row-toggle', this.root) ||
        closestByClass(event.target, 'fg-pivot-column-toggle', this.root)) {
      return;
    }
    baseHandlePointerDown.call(this, event);
  };

  PivotGrid.prototype.handleClick = function(event) {
    var detailDialog = closestByClass(event.target, 'fg-pivot-detail-dialog', this.root);
    var rowToggle = closestByClass(event.target, 'fg-pivot-row-toggle', this.root);
    var columnToggle = closestByClass(event.target, 'fg-pivot-column-toggle', this.root);
    var rowHeader = closestByClass(event.target, 'fg-pivot-row-field-header', this.root);
    if (closestByClass(event.target, 'fg-pivot-filter-field-select', this.root)) {
      return;
    }
    if (closestByClass(event.target, 'fg-pivot-detail-close', this.root) || event.target === this.pivotDetailOverlay) {
      event.preventDefault();
      event.stopPropagation();
      this.hideDetail();
      return;
    }
    if (detailDialog) {
      return;
    }
    if (rowToggle) {
      event.preventDefault();
      event.stopPropagation();
      this.toggleRowSubtotal(rowToggle.getAttribute('data-pivot-key'));
      return;
    }
    if (columnToggle) {
      event.preventDefault();
      event.stopPropagation();
      this.toggleColumnSubtotal(columnToggle.getAttribute('data-pivot-key'));
      return;
    }
    if (rowHeader && this._pivotEngine) {
      event.preventDefault();
      event.stopPropagation();
      this.togglePivotFieldSort(rowHeader.getAttribute('data-pivot-field'));
      return;
    }
    baseHandleClick.call(this, event);
  };

  PivotGrid.prototype.handleDblClick = function(event) {
    var dialog = closestByClass(event.target, 'fg-pivot-detail-dialog', this.root);
    var cell = closestByClass(event.target, 'fg-cell', this.root);
    var row;
    var col;
    if (dialog) {
      return;
    }
    if (cell && this.options.showDetailOnDoubleClick !== false) {
      row = Number(cell.getAttribute('data-row'));
      col = Number(cell.getAttribute('data-col'));
      if (this.showDetail(row, col)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
    baseHandleDblClick.call(this, event);
  };

  PivotGrid.prototype.handleKeyDown = function(event) {
    if (event.key === 'Escape' && this.isDetailOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.hideDetail();
      return;
    }
    if (event.key === 'Escape' && this.isTopLeftMenuOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.hideTopLeftMenu();
      return;
    }
    baseHandleKeyDown.call(this, event);
  };

  PivotGrid.prototype.handleContextMenu = function(event) {
    var hit;
    if (this.options.customContextMenu === false) {
      baseHandleContextMenu.call(this, event);
      return;
    }
    hit = this.hitTest(event);
    if (!hit || (hit.cellType !== FabGrid.CellType.Cell && hit.cellType !== FabGrid.CellType.ColumnHeader)) {
      this.hideTopLeftMenu();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this._pivotContext = hit;
    this.showTopLeftMenu(event.clientX, event.clientY);
  };

  PivotGrid.prototype.renderTopLeftMenu = function() {
    var context = this._pivotContext;
    var column = context && context.column;
    var field = column && (column._pivotRowField || column._pivotDataColumn && column._pivotDataColumn.valueField);
    var entry = context && context.cellType === FabGrid.CellType.Cell && this.view[context.row] ? this.view[context.row].__pivotMeta :
      column && column._pivotDataColumn ? column._pivotDataColumn.entry : null;
    var fragment = document.createDocumentFragment();
    var aggregate;
    var aggregates = ['Sum', 'Count', 'Average', 'Min', 'Max'];
    var rowGroupState;
    var columnGroupState;
    var hasGroups;
    var hasExpandedGroups;
    var i;
    this.topLeftMenu.innerHTML = '';
    if (context && context.cellType === FabGrid.CellType.Cell && column && column._pivotDataColumn) {
      fragment.appendChild(createMenuItem('pivot-detail', this.getText('pivot.showDetail'), 'icon-refwin'));
    }
    if (entry && entry.isSubtotal && !(column && column._pivotRowField)) {
      fragment.appendChild(createMenuItem(
        context.cellType === FabGrid.CellType.Cell ? 'pivot-toggle-row' : 'pivot-toggle-column',
        this.getText((context.cellType === FabGrid.CellType.Cell ? this._pivotRowCollapsed : this._pivotColumnCollapsed)[entry.key] ?
          'pivot.expandGroup' : 'pivot.collapseGroup'),
        this._pivotRowCollapsed[entry.key] || this._pivotColumnCollapsed[entry.key] ? 'icon-expand' : 'icon-collapse'
      ));
    }
    if (column && column._pivotRowField) {
      rowGroupState = getRowGroupMenuState(this._pivotRowEntriesByKey, this._pivotRowCollapsed);
      columnGroupState = getRowGroupMenuState(this._pivotColumnEntriesByKey, this._pivotColumnCollapsed);
      hasGroups = rowGroupState.hasGroups || columnGroupState.hasGroups;
      hasExpandedGroups = rowGroupState.hasExpanded || columnGroupState.hasExpanded;
      fragment.appendChild(createMenuItem(
        hasExpandedGroups ? 'pivot-collapse-all' : 'pivot-expand-all',
        this.getText(hasExpandedGroups ? 'pivot.collapseAll' : 'pivot.expandAll'),
        hasExpandedGroups ? 'icon-collapse' : 'icon-expand',
        false,
        !hasGroups
      ));
      fragment.appendChild(createMenuItem('pivot-sort', this.getText(
        getPivotSortMenuKey(column._pivotRowField)
      ), 'icon-sort'));
    }
    if (column && column._pivotDataColumn) {
      for (i = 0; i < aggregates.length; i += 1) {
        aggregate = aggregates[i];
        fragment.appendChild(createMenuItem(
          'pivot-aggregate-' + aggregate.toLowerCase(),
          this.getText('pivot.aggregate') + ': ' + this.getText('pivot.aggregates.' + aggregate.toLowerCase()),
          'icon-measure',
          field.aggregate === aggregate
        ));
      }
    }
    if (field) {
      fragment.appendChild(createMenuItem('pivot-remove-field', this.getText('pivot.removeField'), 'icon-clear'));
    }
    fragment.appendChild(createMenuItem('pivot-export-excel', this.getText('topLeftMenu.exportExcel'), 'icon-excel'));
    fragment.appendChild(createMenuItem('pivot-export-csv', this.getText('topLeftMenu.exportCsv'), 'icon-export'));
    if (context && context.cellType === FabGrid.CellType.ColumnHeader) {
      fragment.appendChild(createMenuItem(
        'pivot-fullscreen',
        this.getText(this.isFullscreen() ? 'topLeftMenu.exitFullscreen' : 'topLeftMenu.fullscreen'),
        'icon-fullscreen',
        false,
        !this.isFullscreenAvailable()
      ));
    }
    this.topLeftMenu.appendChild(fragment);
  };

  PivotGrid.prototype.handleTopLeftMenuClick = function(event) {
    var item = closestByClass(event.target, 'fg-top-left-menu-item', this.topLeftMenu);
    var action;
    var context = this._pivotContext;
    var column = context && context.column;
    var field = column && (column._pivotRowField || column._pivotDataColumn && column._pivotDataColumn.valueField);
    var entry = context && context.cellType === FabGrid.CellType.Cell && this.view[context.row] ? this.view[context.row].__pivotMeta :
      column && column._pivotDataColumn ? column._pivotDataColumn.entry : null;
    if (!item) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    action = item.getAttribute('data-action');
    this.hideTopLeftMenu();
    if (action === 'pivot-detail') {
      this.showDetail(context.row, context.viewCol);
    } else if (action === 'pivot-toggle-row' && entry) {
      this.toggleRowSubtotal(entry.key);
    } else if (action === 'pivot-toggle-column' && entry) {
      this.toggleColumnSubtotal(entry.key);
    } else if (action === 'pivot-expand-all') {
      this.expandAll();
    } else if (action === 'pivot-collapse-all') {
      this.collapseAll();
    } else if (action === 'pivot-sort' && field) {
      this.togglePivotFieldSort(field.key);
    } else if (action.indexOf('pivot-aggregate-') === 0 && field) {
      field.aggregate = action.slice('pivot-aggregate-'.length).replace(/^./, function(character) {
        return character.toUpperCase();
      });
      this._pivotEngine.emit('viewDefinitionChanged', {
        property: 'aggregate',
        field: field
      });
      this._pivotEngine.refresh();
    } else if (action === 'pivot-remove-field' && field) {
      this._pivotEngine.removeField(field);
    } else if (action === 'pivot-export-excel') {
      this.exportExcel('pivot.xlsx');
    } else if (action === 'pivot-export-csv') {
      this.exportCsv('pivot.csv');
    } else if (action === 'pivot-fullscreen') {
      this.toggleFullscreen();
    }
  };

  PivotGrid.prototype.togglePivotFieldSort = function(fieldReference) {
    var field = this._pivotEngine && this._pivotEngine.getField(fieldReference);
    var direction;
    if (!field) {
      return false;
    }
    direction = getPivotFieldSortDirection(field);
    field.sortDirection = direction === 0 ? 1 : direction === 1 ? -1 : 0;
    this._pivotEngine.emit('viewDefinitionChanged', {
      property: 'sortDirection',
      field: field
    });
    this._pivotEngine.refresh();
    return true;
  };

  PivotGrid.prototype.toggleRowSubtotal = function(key) {
    if (!this._pivotRowEntriesByKey[key]) {
      return false;
    }
    this._pivotRowCollapsed[key] = !this._pivotRowCollapsed[key];
    this._applyPivotView(false);
    return true;
  };

  PivotGrid.prototype.toggleColumnSubtotal = function(key) {
    if (!this._pivotColumnEntriesByKey[key]) {
      return false;
    }
    this._pivotColumnCollapsed[key] = !this._pivotColumnCollapsed[key];
    this._applyPivotView(false);
    return true;
  };

  PivotGrid.prototype.expandAll = function() {
    this._pivotRowCollapsed = Object.create(null);
    this._pivotColumnCollapsed = Object.create(null);
    this._applyPivotView(false);
  };

  PivotGrid.prototype.collapseAll = function() {
    var key;
    this._pivotRowCollapsed = Object.create(null);
    this._pivotColumnCollapsed = Object.create(null);
    for (key in this._pivotRowEntriesByKey) {
      if (this._pivotRowEntriesByKey[key].isSubtotal) {
        this._pivotRowCollapsed[key] = true;
      }
    }
    for (key in this._pivotColumnEntriesByKey) {
      if (this._pivotColumnEntriesByKey[key].isSubtotal) {
        this._pivotColumnCollapsed[key] = true;
      }
    }
    this._applyPivotView(false);
  };

  PivotGrid.prototype.getCellKeys = function(row, col) {
    var item = this.view[row];
    var column = this.visibleColumns[col];
    if (!item || !column || !column._pivotDataColumn) {
      return null;
    }
    return this._pivotEngine.getKeys(item, column._pivotDataColumn.entry);
  };

  PivotGrid.prototype.showDetail = function(row, col) {
    var item = this.view[row];
    var column = this.visibleColumns[col];
    var detail;
    var columns;
    var self = this;
    if (!item || !column || !column._pivotDataColumn || !this._pivotEngine) {
      return false;
    }
    detail = this._pivotEngine.getDetail(item, column._pivotDataColumn.entry);
    columns = this._pivotEngine.fields.filter(function(field) {
      return field.visible !== false && field.binding;
    }).map(function(field) {
      return {
        binding: field.binding,
        header: field.header,
        width: field.width,
        dataType: field.dataType,
        format: field.format,
        align: field.align,
        readOnly: true
      };
    });
    this.hideDetail();
    this.pivotDetailTitle.textContent = this.getText('pivot.detailTitle') + ' · ' +
      this.getText('pivot.detailCount', { count: detail.length });
    this.pivotDetailOverlay.style.display = 'flex';
    this.pivotDetailOverlay.setAttribute('aria-hidden', 'false');
    this._pivotDetailGrid = new FabGrid(this.pivotDetailBody, {
      itemsSource: detail,
      columns: columns,
      allowEditing: false,
      allowFiltering: true,
      showSearchRow: false,
      showRowHeaders: true,
      selectionMode: 'CellRange',
      locale: this.locale,
      messages: this.options.messages
    });
    window.setTimeout(function() {
      if (self.pivotDetailClose) {
        self.pivotDetailClose.focus();
      }
    }, 0);
    return true;
  };

  PivotGrid.prototype.hideDetail = function() {
    if (this._pivotDetailGrid) {
      this._pivotDetailGrid.dispose();
      this._pivotDetailGrid = null;
    }
    if (this.pivotDetailBody) {
      this.pivotDetailBody.innerHTML = '';
    }
    if (this.pivotDetailOverlay) {
      this.pivotDetailOverlay.style.display = 'none';
      this.pivotDetailOverlay.setAttribute('aria-hidden', 'true');
    }
  };

  PivotGrid.prototype.isDetailOpen = function() {
    return !!(this.pivotDetailOverlay && this.pivotDetailOverlay.style.display === 'flex');
  };

  PivotGrid.prototype.dispose = function() {
    this.hideDetail();
    if (this._pivotEngine && this._pivotEngine.updatedView) {
      this._pivotEngine.updatedView.removeHandler(this._pivotUpdatedHandler, this);
    }
    this._pivotEngine = null;
    this._pivotRowGroups = [];
    baseDispose.call(this);
  };

  Object.defineProperties(PivotGrid.prototype, {
    engine: {
      get: function() {
        return this._pivotEngine;
      }
    },
    itemsSource: {
      get: function() {
        return this._pivotEngine;
      },
      set: function(value) {
        this.setPivotEngine(value);
      }
    },
    collapsibleSubtotals: {
      get: function() {
        return this.options.collapsibleSubtotals !== false;
      },
      set: function(value) {
        this.options.collapsibleSubtotals = value !== false;
        this.render();
      }
    },
    showDetailOnDoubleClick: {
      get: function() {
        return this.options.showDetailOnDoubleClick !== false;
      },
      set: function(value) {
        this.options.showDetailOnDoubleClick = value !== false;
      }
    }
  });

  PivotGrid.PivotEngine = PivotEngine;
  return PivotGrid;
}

function resolvePivotPanelHostElement(element) {
  if (typeof element === 'string') {
    return typeof document === 'undefined' ? null : document.querySelector(element);
  }
  return element && element.nodeType === 1 ? element : null;
}

function getPivotPanelMessageValue(messages, path) {
  var parts = String(path || '').split('.');
  var value = messages;
  var i;
  for (i = 0; i < parts.length; i += 1) {
    if (!value || typeof value !== 'object') {
      return null;
    }
    value = value[parts[i]];
  }
  return typeof value === 'string' ? value : null;
}

function formatPivotPanelMessage(text, data) {
  return String(text || '').replace(/\{([^}]+)\}/g, function(match, key) {
    return data && data[key] != null ? String(data[key]) : match;
  });
}

function closestWithAttribute(target, attribute, boundary) {
  var node = target && target.nodeType === 1 ? target : target ? target.parentElement : null;
  while (node) {
    if (node.hasAttribute && node.hasAttribute(attribute)) {
      return node;
    }
    if (node === boundary) {
      break;
    }
    node = node.parentElement;
  }
  return null;
}

function createButton(action, label, text) {
  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'fg-pivot-panel-action';
  button.setAttribute('data-action', action);
  button.setAttribute('aria-label', label);
  button.title = label;
  button.textContent = text;
  return button;
}

function createAggregateMenuItem(value, label, active, fieldKey) {
  var item = document.createElement('button');
  var icon = document.createElement('span');
  var text = document.createElement('span');
  item.type = 'button';
  item.className = 'fg-top-left-menu-item' + (active ? ' fg-top-left-menu-item-active' : '');
  item.setAttribute('role', 'menuitemradio');
  item.setAttribute('aria-checked', active ? 'true' : 'false');
  item.setAttribute('data-action', 'set-aggregate');
  item.setAttribute('data-aggregate', value);
  item.setAttribute('data-field-key', fieldKey);
  icon.className = 'fg-top-left-menu-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = active ? '✓' : '';
  text.className = 'fg-top-left-menu-label';
  text.textContent = label;
  item.appendChild(icon);
  item.appendChild(text);
  return item;
}

function normalizePivotPanelSortDirection(value) {
  var text;
  if (value === 1 || value === -1) {
    return value;
  }
  text = String(value == null ? '' : value).toLowerCase();
  if (text === 'asc' || text === 'ascending') {
    return 1;
  }
  if (text === 'desc' || text === 'descending') {
    return -1;
  }
  return 0;
}

function createSortMenuItem(value, label, active, fieldKey) {
  var item = document.createElement('button');
  var icon = document.createElement('span');
  var text = document.createElement('span');
  item.type = 'button';
  item.className = 'fg-top-left-menu-item' + (active ? ' fg-top-left-menu-item-active' : '');
  item.setAttribute('role', 'menuitemradio');
  item.setAttribute('aria-checked', active ? 'true' : 'false');
  item.setAttribute('data-action', 'set-sort-direction');
  item.setAttribute('data-sort-direction', String(value));
  item.setAttribute('data-field-key', fieldKey);
  icon.className = 'fg-top-left-menu-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = active ? '✓' : '';
  text.className = 'fg-top-left-menu-label';
  text.textContent = label;
  item.appendChild(icon);
  item.appendChild(text);
  return item;
}

function createPivotPanelFactory(Control, registerControl, unregisterControl, PivotEngine, FabGrid) {
  var areaDefinitions = [
    { name: 'filterFields', labelKey: 'pivot.panel.filters' },
    { name: 'columnFields', labelKey: 'pivot.panel.columns' },
    { name: 'rowFields', labelKey: 'pivot.panel.rows' },
    { name: 'valueFields', labelKey: 'pivot.panel.values' }
  ];

  function PivotPanel(element, options) {
    var host = resolvePivotPanelHostElement(element);
    options = options || {};
    if (!host) {
      throw new TypeError('PivotPanel host element was not found.');
    }
    Control.call(this);
    this.hostElement = host;
    this.options = options;
    this.locale = options.locale || 'en';
    this.messages = options.messages || null;
    this.restrictDragging = options.restrictDragging === true;
    this._engine = null;
    this._dragFieldKey = null;
    this._dragSourceArea = null;
    this._dragTargetArea = null;
    this._dragTargetIndex = Infinity;
    this._dropIndicator = null;
    this._aggregateMenuFieldKey = null;
    this._sortMenuFieldKey = null;
    this._documentPointerDownBound = false;
    this._documentPointerDownHandler = this._handleDocumentPointerDown.bind(this);
    this._updatedHandler = this.refresh.bind(this);
    this._createDom();
    this._bindEvents();
    registerControl(host, this);
    if (options.itemsSource || options.engine) {
      this.setItemsSource(options.itemsSource || options.engine);
    } else {
      this.refresh();
    }
  }

  PivotPanel.prototype = Object.create(Control.prototype);
  PivotPanel.prototype.constructor = PivotPanel;

  PivotPanel.prototype._createDom = function() {
    var header = document.createElement('div');
    var availableTitle = document.createElement('div');
    var available = document.createElement('div');
    var areas = document.createElement('div');
    var aggregateMenu = document.createElement('div');
    var sortMenu = document.createElement('div');
    var section;
    var title;
    var list;
    var i;
    this.hostElement.innerHTML = '';
    this.hostElement.classList.add('fg-root', 'fg-pivot-panel');
    this.hostElement.setAttribute('role', 'region');
    if (!this.hostElement.hasAttribute('tabindex')) {
      this.hostElement.setAttribute('tabindex', '0');
    }
    header.className = 'fg-pivot-panel-header';
    availableTitle.className = 'fg-pivot-panel-section-title';
    available.className = 'fg-pivot-panel-list fg-pivot-panel-fields';
    available.setAttribute('data-area', 'fields');
    available.setAttribute('role', 'listbox');
    header.appendChild(availableTitle);
    header.appendChild(available);
    areas.className = 'fg-pivot-panel-areas';
    this.areaLists = { fields: available };
    this.areaTitles = { fields: availableTitle };
    for (i = 0; i < areaDefinitions.length; i += 1) {
      section = document.createElement('section');
      title = document.createElement('div');
      list = document.createElement('div');
      section.className = 'fg-pivot-panel-section';
      title.className = 'fg-pivot-panel-section-title';
      list.className = 'fg-pivot-panel-list fg-pivot-panel-drop-list';
      list.setAttribute('data-area', areaDefinitions[i].name);
      list.setAttribute('role', 'listbox');
      section.appendChild(title);
      section.appendChild(list);
      areas.appendChild(section);
      this.areaLists[areaDefinitions[i].name] = list;
      this.areaTitles[areaDefinitions[i].name] = title;
    }
    this.hostElement.appendChild(header);
    this.hostElement.appendChild(areas);
    aggregateMenu.className = 'fg-top-left-menu fg-pivot-panel-aggregate-menu';
    aggregateMenu.setAttribute('role', 'menu');
    aggregateMenu.setAttribute('aria-hidden', 'true');
    this.hostElement.appendChild(aggregateMenu);
    sortMenu.className = 'fg-top-left-menu fg-pivot-panel-sort-menu';
    sortMenu.setAttribute('role', 'menu');
    sortMenu.setAttribute('aria-hidden', 'true');
    this.hostElement.appendChild(sortMenu);
    this.availableFields = available;
    this.areasElement = areas;
    this.aggregateMenu = aggregateMenu;
    this.sortMenu = sortMenu;
    this.applyLocaleToDom();
  };

  PivotPanel.prototype._bindEvents = function() {
    this.addEventListener(this.hostElement, 'change', this._handleChange.bind(this));
    this.addEventListener(this.hostElement, 'click', this._handleClick.bind(this));
    this.addEventListener(this.hostElement, 'contextmenu', this._handleContextMenu.bind(this));
    this.addEventListener(this.hostElement, 'dragstart', this._handleDragStart.bind(this));
    this.addEventListener(this.hostElement, 'dragover', this._handleDragOver.bind(this));
    this.addEventListener(this.hostElement, 'dragleave', this._handleDragLeave.bind(this));
    this.addEventListener(this.hostElement, 'drop', this._handleDrop.bind(this));
    this.addEventListener(this.hostElement, 'dragend', this._clearDragState.bind(this));
    this.addEventListener(this.hostElement, 'keydown', this._handleKeyDown.bind(this));
  };

  PivotPanel.prototype.getText = function(path, data) {
    var locales = FabGrid.locales || {};
    var localeName = this.locale || 'en';
    var baseName = localeName.split('-')[0];
    var text = getPivotPanelMessageValue(this.messages, path) ||
      getPivotPanelMessageValue(locales[localeName], path) ||
      getPivotPanelMessageValue(locales[baseName], path) ||
      getPivotPanelMessageValue(locales.en, path) || path;
    return formatPivotPanelMessage(text, data);
  };

  PivotPanel.prototype.applyLocaleToDom = function() {
    var i;
    this.hostElement.setAttribute('aria-label', this.getText('pivot.panel.ariaLabel'));
    this.aggregateMenu.setAttribute('aria-label', this.getText('pivot.panel.aggregateMenu'));
    this.sortMenu.setAttribute('aria-label', this.getText('pivot.panel.sortMenu'));
    this.areaTitles.fields.textContent = this.getText('pivot.panel.fields');
    this.areaLists.fields.setAttribute('aria-label', this.getText('pivot.panel.fields'));
    for (i = 0; i < areaDefinitions.length; i += 1) {
      this.areaTitles[areaDefinitions[i].name].textContent = this.getText(areaDefinitions[i].labelKey);
      this.areaLists[areaDefinitions[i].name].setAttribute('aria-label', this.getText(areaDefinitions[i].labelKey));
    }
  };

  PivotPanel.prototype.setLocale = function(locale, messages) {
    this.locale = locale || 'en';
    if (messages !== undefined) {
      this.messages = messages;
    }
    this.applyLocaleToDom();
    this.refresh();
    return this;
  };

  PivotPanel.prototype.setItemsSource = function(engine) {
    if (!(engine instanceof PivotEngine)) {
      throw new TypeError('PivotPanel itemsSource must be a fabui.pivot.PivotEngine instance.');
    }
    if (this._engine === engine) {
      return this;
    }
    if (this._engine && this._engine.updatedView) {
      this._engine.updatedView.removeHandler(this._updatedHandler, this);
    }
    this._engine = engine;
    engine.updatedView.addHandler(this._updatedHandler, this);
    this.refresh();
    return this;
  };

  PivotPanel.prototype._getAssignedArea = function(field) {
    var i;
    var index;
    if (!this._engine) {
      return null;
    }
    for (i = 0; i < areaDefinitions.length; i += 1) {
      index = this._engine[areaDefinitions[i].name].indexOf(field);
      if (index >= 0) {
        return areaDefinitions[i].name;
      }
    }
    return null;
  };

  PivotPanel.prototype._createFieldItem = function(field) {
    var item = document.createElement('div');
    var label = document.createElement('label');
    var checkbox = document.createElement('input');
    var type = document.createElement('span');
    var text = document.createElement('span');
    item.className = 'fg-pivot-panel-field';
    item.draggable = true;
    item.setAttribute('data-field-key', field.key);
    item.setAttribute('data-area-item', 'fields');
    item.setAttribute('role', 'option');
    checkbox.type = 'checkbox';
    checkbox.className = 'fg-pivot-panel-field-check';
    checkbox.checked = !!this._getAssignedArea(field);
    checkbox.setAttribute('data-field-key', field.key);
    type.className = 'fg-pivot-panel-field-type';
    type.textContent = field.dataType === 'number' ? '#' : field.dataType === 'date' ? '▣' : 'A';
    type.setAttribute('aria-hidden', 'true');
    text.className = 'fg-pivot-panel-field-label';
    text.textContent = field.header;
    label.appendChild(checkbox);
    label.appendChild(type);
    label.appendChild(text);
    item.appendChild(label);
    return item;
  };

  PivotPanel.prototype._createAreaItem = function(field, area) {
    var item = document.createElement('div');
    var drag = document.createElement('span');
    var label = document.createElement('span');
    var actions = document.createElement('span');
    item.className = 'fg-pivot-panel-item' + (area === 'valueFields' ? ' fg-pivot-panel-value-item' : '');
    item.draggable = true;
    item.setAttribute('data-field-key', field.key);
    item.setAttribute('data-area-item', area);
    item.setAttribute('role', 'option');
    drag.className = 'fg-pivot-panel-drag';
    drag.textContent = '⋮⋮';
    drag.setAttribute('aria-hidden', 'true');
    label.className = 'fg-pivot-panel-item-label';
    label.textContent = field.header;
    label.title = field.header;
    item.appendChild(drag);
    item.appendChild(label);
    actions.className = 'fg-pivot-panel-item-actions';
    actions.appendChild(createButton('remove', this.getText('pivot.panel.removeField'), '×'));
    item.appendChild(actions);
    return item;
  };

  PivotPanel.prototype._renderArea = function(area) {
    var list = this.areaLists[area];
    var fields = this._engine ? this._engine[area] : [];
    var empty;
    var i;
    list.innerHTML = '';
    if (!fields.length) {
      empty = document.createElement('div');
      empty.className = 'fg-pivot-panel-empty';
      empty.textContent = this.getText('pivot.panel.dropFields');
      list.appendChild(empty);
      return;
    }
    for (i = 0; i < fields.length; i += 1) {
      list.appendChild(this._createAreaItem(fields[i], area));
    }
  };

  PivotPanel.prototype.refresh = function() {
    var i;
    this.hideAggregateMenu();
    this.hideSortMenu();
    this.availableFields.innerHTML = '';
    if (this._engine) {
      for (i = 0; i < this._engine.fields.length; i += 1) {
        this.availableFields.appendChild(this._createFieldItem(this._engine.fields[i]));
      }
    }
    if (!this.availableFields.children.length) {
      this.availableFields.innerHTML = '<div class="fg-pivot-panel-empty">' +
        this.getText('pivot.panel.noFields') + '</div>';
    }
    for (i = 0; i < areaDefinitions.length; i += 1) {
      this._renderArea(areaDefinitions[i].name);
    }
    return this;
  };

  PivotPanel.prototype._getAreaKeys = function(area) {
    return this._engine[area].map(function(field) {
      return field.key;
    });
  };

  PivotPanel.prototype._applyAreas = function(areas, property) {
    var i;
    if (!this._engine) {
      return;
    }
    for (i = 0; i < areaDefinitions.length; i += 1) {
      this._engine.setViewFields(areaDefinitions[i].name, areas[areaDefinitions[i].name], true);
    }
    this._engine.emit('viewDefinitionChanged', { property: property || 'fields' });
    this._engine.refresh();
  };

  PivotPanel.prototype.moveField = function(fieldReference, targetArea, targetIndex) {
    var field = this._engine && this._engine.getField(fieldReference);
    var areas = {};
    var keys;
    var index;
    var i;
    if (!field || !this.areaLists[targetArea]) {
      return false;
    }
    if (targetArea !== 'fields' && this.restrictDragging &&
      ((targetArea === 'valueFields' && field.dataType !== 'number') ||
      ((targetArea === 'rowFields' || targetArea === 'columnFields') && field.dataType === 'number'))) {
      return false;
    }
    for (i = 0; i < areaDefinitions.length; i += 1) {
      keys = this._getAreaKeys(areaDefinitions[i].name).filter(function(key) {
        return key !== field.key;
      });
      areas[areaDefinitions[i].name] = keys;
    }
    if (targetArea !== 'fields') {
      keys = areas[targetArea];
      index = Math.max(0, Math.min(keys.length, Number(targetIndex)));
      if (!isFinite(index)) {
        index = keys.length;
      }
      keys.splice(index, 0, field.key);
    }
    if (targetArea !== 'filterFields') {
      field.filter = null;
    }
    this._applyAreas(areas, targetArea);
    return true;
  };

  PivotPanel.prototype.removeField = function(fieldReference, area) {
    var field = this._engine && this._engine.getField(fieldReference);
    var areas = {};
    var i;
    if (!field || !this.areaLists[area] || area === 'fields') {
      return false;
    }
    for (i = 0; i < areaDefinitions.length; i += 1) {
      areas[areaDefinitions[i].name] = this._getAreaKeys(areaDefinitions[i].name);
    }
    areas[area] = areas[area].filter(function(key) { return key !== field.key; });
    if (area === 'filterFields') {
      field.filter = null;
    }
    this._applyAreas(areas, area);
    return true;
  };

  PivotPanel.prototype._handleChange = function(event) {
    var fieldKey = event.target.getAttribute('data-field-key');
    var field;
    if (event.target.classList.contains('fg-pivot-panel-field-check')) {
      field = this._engine && this._engine.getField(fieldKey);
      if (event.target.checked && field) {
        this.moveField(field, field.dataType === 'number' ? 'valueFields' : 'rowFields', Infinity);
      } else if (field) {
        this.moveField(field, 'fields', 0);
      }
    }
  };

  PivotPanel.prototype._handleClick = function(event) {
    var actionElement = closestWithAttribute(event.target, 'data-action', this.hostElement);
    var item;
    var action;
    var area;
    var fieldKey;
    if (!actionElement || actionElement.tagName === 'SELECT') {
      return;
    }
    item = closestWithAttribute(actionElement, 'data-field-key', this.hostElement);
    if (!item) {
      return;
    }
    event.preventDefault();
    action = actionElement.getAttribute('data-action');
    area = item.getAttribute('data-area-item');
    fieldKey = item.getAttribute('data-field-key');
    if (action === 'set-aggregate') {
      this.setAggregate(fieldKey, actionElement.getAttribute('data-aggregate'));
      this.hideAggregateMenu();
    } else if (action === 'set-sort-direction') {
      this.setSortDirection(fieldKey, Number(actionElement.getAttribute('data-sort-direction')));
      this.hideSortMenu();
    } else if (action === 'remove') {
      this.removeField(fieldKey, area);
    }
  };

  PivotPanel.prototype.setAggregate = function(fieldReference, aggregate) {
    var field = this._engine && this._engine.getField(fieldReference);
    var values = ['Sum', 'Count', 'Average', 'Min', 'Max'];
    if (!field || values.indexOf(aggregate) < 0 || this._engine.valueFields.indexOf(field) < 0) {
      return false;
    }
    if (field.aggregate === aggregate) {
      return true;
    }
    field.aggregate = aggregate;
    this._engine.emit('viewDefinitionChanged', { property: 'aggregate', field: field });
    this._engine.refresh();
    return true;
  };

  PivotPanel.prototype.setSortDirection = function(fieldReference, direction) {
    var field = this._engine && this._engine.getField(fieldReference);
    var normalized = normalizePivotPanelSortDirection(direction);
    if (!field || (this._engine.rowFields.indexOf(field) < 0 && this._engine.columnFields.indexOf(field) < 0)) {
      return false;
    }
    if (normalizePivotPanelSortDirection(field.sortDirection) === normalized) {
      return true;
    }
    field.sortDirection = normalized;
    this._engine.emit('viewDefinitionChanged', { property: 'sortDirection', field: field });
    this._engine.refresh();
    return true;
  };

  PivotPanel.prototype._handleContextMenu = function(event) {
    var item = closestWithAttribute(event.target, 'data-field-key', this.hostElement);
    var area = item && item.getAttribute('data-area-item');
    var field = item && this._engine ? this._engine.getField(item.getAttribute('data-field-key')) : null;
    if (field && area === 'valueFields') {
      event.preventDefault();
      event.stopPropagation();
      this.hideSortMenu();
      this.showAggregateMenu(field, event.clientX, event.clientY);
      return;
    }
    if (field && (area === 'rowFields' || area === 'columnFields')) {
      event.preventDefault();
      event.stopPropagation();
      this.hideAggregateMenu();
      this.showSortMenu(field, event.clientX, event.clientY);
      return;
    }
    this.hideAggregateMenu();
    this.hideSortMenu();
  };

  PivotPanel.prototype.showAggregateMenu = function(fieldReference, clientX, clientY) {
    var field = this._engine && this._engine.getField(fieldReference);
    var values = ['Sum', 'Count', 'Average', 'Min', 'Max'];
    var title;
    var hostRect;
    var left;
    var top;
    var i;
    if (!field || this._engine.valueFields.indexOf(field) < 0) {
      return false;
    }
    this.aggregateMenu.innerHTML = '';
    title = document.createElement('div');
    title.className = 'fg-pivot-panel-menu-title';
    title.textContent = field.header;
    title.title = field.header;
    this.aggregateMenu.appendChild(title);
    for (i = 0; i < values.length; i += 1) {
      this.aggregateMenu.appendChild(createAggregateMenuItem(
        values[i],
        this.getText('pivot.aggregates.' + values[i].toLowerCase()),
        field.aggregate === values[i],
        field.key
      ));
    }
    this._aggregateMenuFieldKey = field.key;
    this.aggregateMenu.setAttribute('aria-label', this.getText('pivot.panel.aggregateField', { field: field.header }));
    this.aggregateMenu.style.display = 'block';
    this.aggregateMenu.setAttribute('aria-hidden', 'false');
    hostRect = this.hostElement.getBoundingClientRect();
    left = Number(clientX) - hostRect.left;
    top = Number(clientY) - hostRect.top;
    if (!isFinite(left)) left = 0;
    if (!isFinite(top)) top = 0;
    left = Math.max(0, Math.min(left, this.hostElement.clientWidth - this.aggregateMenu.offsetWidth));
    top = Math.max(0, Math.min(top, this.hostElement.clientHeight - this.aggregateMenu.offsetHeight));
    this.aggregateMenu.style.left = left + 'px';
    this.aggregateMenu.style.top = top + 'px';
    this._syncDocumentMenuPointerListener();
    this.hostElement.focus({ preventScroll: true });
    return true;
  };

  PivotPanel.prototype.hideAggregateMenu = function() {
    if (this.aggregateMenu) {
      this.aggregateMenu.style.display = 'none';
      this.aggregateMenu.setAttribute('aria-hidden', 'true');
    }
    this._aggregateMenuFieldKey = null;
    this._syncDocumentMenuPointerListener();
  };

  PivotPanel.prototype.isAggregateMenuOpen = function() {
    return !!(this.aggregateMenu && this.aggregateMenu.style.display === 'block');
  };

  PivotPanel.prototype.showSortMenu = function(fieldReference, clientX, clientY) {
    var field = this._engine && this._engine.getField(fieldReference);
    var direction;
    var values = [0, 1, -1];
    var labels = [
      'pivot.panel.sortDefault',
      'pivot.sortAscending',
      'pivot.sortDescending'
    ];
    var title;
    var hostRect;
    var left;
    var top;
    var i;
    if (!field || (this._engine.rowFields.indexOf(field) < 0 && this._engine.columnFields.indexOf(field) < 0)) {
      return false;
    }
    direction = normalizePivotPanelSortDirection(field.sortDirection);
    this.sortMenu.innerHTML = '';
    title = document.createElement('div');
    title.className = 'fg-pivot-panel-menu-title';
    title.textContent = field.header;
    title.title = field.header;
    this.sortMenu.appendChild(title);
    for (i = 0; i < values.length; i += 1) {
      this.sortMenu.appendChild(createSortMenuItem(
        values[i],
        this.getText(labels[i]),
        direction === values[i],
        field.key
      ));
    }
    this._sortMenuFieldKey = field.key;
    this.sortMenu.setAttribute('aria-label', this.getText('pivot.panel.sortField', { field: field.header }));
    this.sortMenu.style.display = 'block';
    this.sortMenu.setAttribute('aria-hidden', 'false');
    hostRect = this.hostElement.getBoundingClientRect();
    left = Number(clientX) - hostRect.left;
    top = Number(clientY) - hostRect.top;
    if (!isFinite(left)) left = 0;
    if (!isFinite(top)) top = 0;
    left = Math.max(0, Math.min(left, this.hostElement.clientWidth - this.sortMenu.offsetWidth));
    top = Math.max(0, Math.min(top, this.hostElement.clientHeight - this.sortMenu.offsetHeight));
    this.sortMenu.style.left = left + 'px';
    this.sortMenu.style.top = top + 'px';
    this._syncDocumentMenuPointerListener();
    this.hostElement.focus({ preventScroll: true });
    return true;
  };

  PivotPanel.prototype.hideSortMenu = function() {
    if (this.sortMenu) {
      this.sortMenu.style.display = 'none';
      this.sortMenu.setAttribute('aria-hidden', 'true');
    }
    this._sortMenuFieldKey = null;
    this._syncDocumentMenuPointerListener();
  };

  PivotPanel.prototype.isSortMenuOpen = function() {
    return !!(this.sortMenu && this.sortMenu.style.display === 'block');
  };

  PivotPanel.prototype._syncDocumentMenuPointerListener = function() {
    var shouldBind = this.isAggregateMenuOpen() || this.isSortMenuOpen();
    if (shouldBind && !this._documentPointerDownBound) {
      this.addEventListener(document, 'pointerdown', this._documentPointerDownHandler);
      this._documentPointerDownBound = true;
    } else if (!shouldBind && this._documentPointerDownBound) {
      this.removeEventListener(document, 'pointerdown', this._documentPointerDownHandler);
      this._documentPointerDownBound = false;
    }
  };

  PivotPanel.prototype._handleDocumentPointerDown = function(event) {
    if (this.isAggregateMenuOpen() && !this.aggregateMenu.contains(event.target)) {
      this.hideAggregateMenu();
    }
    if (this.isSortMenuOpen() && !this.sortMenu.contains(event.target)) {
      this.hideSortMenu();
    }
  };

  PivotPanel.prototype._handleDragStart = function(event) {
    var item = closestWithAttribute(event.target, 'data-field-key', this.hostElement);
    if (!item) {
      return;
    }
    this._dragFieldKey = item.getAttribute('data-field-key');
    this._dragSourceArea = item.getAttribute('data-area-item');
    item.classList.add('fg-pivot-panel-dragging');
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', this._dragFieldKey);
    }
  };

  PivotPanel.prototype._handleDragOver = function(event) {
    var list = closestWithAttribute(event.target, 'data-area', this.hostElement);
    var area;
    if (!list || !this._dragFieldKey) {
      return;
    }
    event.preventDefault();
    area = list.getAttribute('data-area');
    this._showDropIndicator(list, area, event.clientY);
    list.classList.add('fg-pivot-panel-drop-active');
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  };

  PivotPanel.prototype._handleDragLeave = function(event) {
    var list = closestWithAttribute(event.target, 'data-area', this.hostElement);
    if (list && (!event.relatedTarget || !list.contains(event.relatedTarget))) {
      list.classList.remove('fg-pivot-panel-drop-active');
      if (this._dragTargetArea === list.getAttribute('data-area')) {
        this._clearDropIndicator();
      }
    }
  };

  PivotPanel.prototype._showDropIndicator = function(list, area, clientY) {
    var items;
    var candidates = [];
    var indicator;
    var anchor = null;
    var index;
    var rect;
    var i;
    this._clearDropIndicator();
    this._dragTargetArea = area;
    if (area === 'fields') {
      this._dragTargetIndex = Infinity;
      return Infinity;
    }
    items = list.querySelectorAll('[data-area-item="' + area + '"]');
    for (i = 0; i < items.length; i += 1) {
      if (items[i].getAttribute('data-field-key') !== this._dragFieldKey) {
        candidates.push(items[i]);
      }
    }
    index = candidates.length;
    for (i = 0; i < candidates.length; i += 1) {
      rect = candidates[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        index = i;
        anchor = candidates[i];
        break;
      }
    }
    indicator = document.createElement('div');
    indicator.className = 'fg-pivot-panel-insert-line';
    indicator.setAttribute('aria-hidden', 'true');
    if (anchor) {
      list.insertBefore(indicator, anchor);
    } else {
      list.appendChild(indicator);
    }
    this._dropIndicator = indicator;
    this._dragTargetIndex = index;
    return index;
  };

  PivotPanel.prototype._clearDropIndicator = function() {
    if (this._dropIndicator && this._dropIndicator.parentNode) {
      this._dropIndicator.parentNode.removeChild(this._dropIndicator);
    }
    this._dropIndicator = null;
    this._dragTargetArea = null;
    this._dragTargetIndex = Infinity;
  };

  PivotPanel.prototype._handleDrop = function(event) {
    var list = closestWithAttribute(event.target, 'data-area', this.hostElement);
    var area;
    var index = Infinity;
    if (!list || !this._dragFieldKey) {
      return;
    }
    event.preventDefault();
    area = list.getAttribute('data-area');
    if (area !== 'fields') {
      index = this._dragTargetArea === area ? this._dragTargetIndex :
        this._showDropIndicator(list, area, event.clientY);
    }
    this.moveField(this._dragFieldKey, area, index);
    this._clearDragState();
  };

  PivotPanel.prototype._handleKeyDown = function(event) {
    if (event.key === 'Escape' && (this.isAggregateMenuOpen() || this.isSortMenuOpen())) {
      event.preventDefault();
      event.stopPropagation();
      this.hideAggregateMenu();
      this.hideSortMenu();
      return;
    }
    if (event.key === 'Escape' && this._dragFieldKey) {
      event.preventDefault();
      this._clearDragState();
    }
  };

  PivotPanel.prototype._clearDragState = function() {
    var active = this.hostElement.querySelectorAll('.fg-pivot-panel-dragging, .fg-pivot-panel-drop-active');
    var i;
    this._clearDropIndicator();
    for (i = 0; i < active.length; i += 1) {
      active[i].classList.remove('fg-pivot-panel-dragging', 'fg-pivot-panel-drop-active');
    }
    this._dragFieldKey = null;
    this._dragSourceArea = null;
  };

  PivotPanel.prototype.dispose = function() {
    if (this._engine && this._engine.updatedView) {
      this._engine.updatedView.removeHandler(this._updatedHandler, this);
    }
    this.hideAggregateMenu();
    this.hideSortMenu();
    this.removeEventListener();
    unregisterControl(this.hostElement, this);
    this.hostElement.innerHTML = '';
    this.hostElement.classList.remove('fg-root', 'fg-pivot-panel');
    this._engine = null;
  };

  Object.defineProperties(PivotPanel.prototype, {
    itemsSource: {
      get: function() { return this._engine; },
      set: function(value) { this.setItemsSource(value); }
    },
    engine: {
      get: function() { return this._engine; },
      set: function(value) { this.setItemsSource(value); }
    },
    fields: { get: function() { return this._engine ? this._engine.fields : []; } },
    filterFields: { get: function() { return this._engine ? this._engine.filterFields : []; } },
    rowFields: { get: function() { return this._engine ? this._engine.rowFields : []; } },
    columnFields: { get: function() { return this._engine ? this._engine.columnFields : []; } },
    valueFields: { get: function() { return this._engine ? this._engine.valueFields : []; } },
    isViewDefined: {
      get: function() {
        return !!(this._engine && this._engine.valueFields.length &&
          (this._engine.rowFields.length || this._engine.columnFields.length));
      }
    },
    viewDefinition: {
      get: function() {
        return this._engine ? JSON.stringify(this._engine.viewDefinition) : '';
      },
      set: function(value) {
        var definition = typeof value === 'string' ? JSON.parse(value) : value;
        if (this._engine) {
          this._engine.viewDefinition = definition;
        }
      }
    }
  });

  return PivotPanel;
}

function resolvePivotWorkspaceHostElement(element) {
  if (typeof element === 'string') {
    if (typeof document === 'undefined') {
      return null;
    }
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function assign(target, source) {
  var key;
  source = source || {};
  for (key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }
  return target;
}

function normalizePositiveNumber(value, fallback) {
  value = Number(value);
  return isFinite(value) && value > 0 ? value : fallback;
}

function normalizeChartSize(value, fallback) {
  var match;
  var fraction;
  var percent;
  if (typeof value === 'string') {
    match = value.trim().match(/^(\d+(?:\.\d+)?)%$/);
    if (match) {
      percent = Number(match[1]);
      if (isFinite(percent) && percent > 0 && percent <= 100) {
        return percent + '%';
      }
    }
    match = value.trim().match(/^(\d+(?:\.\d+)?)fr$/i);
    if (match) {
      fraction = Number(match[1]);
      if (isFinite(fraction) && fraction > 0) {
        return fraction + 'fr';
      }
    }
  }
  value = Number(value);
  return isFinite(value) && value > 0 ? value : fallback;
}

function normalizeLayout(value) {
  value = String(value || 'Auto').toLowerCase();
  if (value === 'horizontal') {
    return 'Horizontal';
  }
  if (value === 'vertical') {
    return 'Vertical';
  }
  return 'Auto';
}

function normalizePivotWorkspaceChartType(value) {
  value = String(value || 'Column').toLowerCase();
  if (value === 'bar') {
    return 'Bar';
  }
  if (value === 'line') {
    return 'Line';
  }
  if (value === 'pie') {
    return 'Pie';
  }
  return 'Column';
}

function getPivotWorkspaceMessageValue(source, path) {
  var value = source;
  var parts = String(path || '').split('.');
  var i;
  for (i = 0; i < parts.length; i += 1) {
    if (!value || typeof value !== 'object') {
      return null;
    }
    value = value[parts[i]];
  }
  return typeof value === 'string' ? value : null;
}

function getEngineOptions(options) {
  var result = assign({}, options.engineOptions);
  var names = [
    'itemsSource',
    'fields',
    'rowFields',
    'columnFields',
    'valueFields',
    'filterFields',
    'showRowTotals',
    'showColumnTotals',
    'totalsBeforeData',
    'showZeros',
    'autoGenerateFields'
  ];
  var i;
  for (i = 0; i < names.length; i += 1) {
    if (Object.prototype.hasOwnProperty.call(options, names[i])) {
      result[names[i]] = options[names[i]];
    }
  }
  return result;
}

function getChildOptions(base, override, engine) {
  var result = assign({}, override);
  if (!Object.prototype.hasOwnProperty.call(result, 'locale')) {
    result.locale = base.locale;
  }
  if (!Object.prototype.hasOwnProperty.call(result, 'messages') && base.messages) {
    result.messages = base.messages;
  }
  result.itemsSource = engine;
  return result;
}

function normalizePivotWorkspaceOptions(options) {
  options = options || {};
  return assign({
    locale: 'en',
    messages: null,
    layout: 'Auto',
    compactBreakpoint: 1050,
    splitterSize: 7,
    splitterStep: 16,
    panelSize: 300,
    chartSize: '40%',
    verticalPanelSize: 190,
    verticalChartSize: 190,
    minPanelSize: 220,
    minGridSize: 320,
    minChartSize: 240,
    minVerticalPanelSize: 120,
    minVerticalGridSize: 180,
    minVerticalChartSize: 120,
    showPanel: true,
    showChart: true,
    showHeaders: true,
    showControls: true,
    panelTitle: null,
    gridTitle: null,
    chartTitle: null,
    panelOptions: {},
    gridOptions: {},
    chartOptions: {},
    engineOptions: {},
    layoutChanged: null,
    paneSizeChanged: null
  }, options);
}

function resolvePivotWorkspaceChartSize(value, constraints) {
  var percentMatch = typeof value === 'string' ? value.match(/^(\d+(?:\.\d+)?)%$/) : null;
  var fractionMatch = typeof value === 'string' ? value.match(/^(\d+(?:\.\d+)?)fr$/i) : null;
  var fraction;
  var splitterCount;
  var available;
  if (!percentMatch && !fractionMatch) {
    return normalizePositiveNumber(value, 350);
  }
  splitterCount = (constraints.panelVisible !== false ? 1 : 0) +
    (constraints.chartVisible !== false ? 1 : 0);
  available = Number(constraints.totalSize) -
    splitterCount * Number(constraints.splitterSize) -
    (constraints.panelVisible !== false ? Number(constraints.panelSize) : 0);
  available = Math.max(0, available);
  if (percentMatch) {
    return Math.round(available * Number(percentMatch[1]) / 100);
  }
  fraction = Number(fractionMatch[1]);
  return Math.round(available * fraction / (1 + fraction));
}

function resolvePivotWorkspaceLayout(layout, width, breakpoint) {
  layout = normalizeLayout(layout);
  if (layout !== 'Auto') {
    return layout;
  }
  return Number(width) < normalizePositiveNumber(breakpoint, 1050) ? 'Vertical' : 'Horizontal';
}

function fitPivotWorkspacePaneSizes(sizes, constraints) {
  var panelVisible = constraints.panelVisible !== false;
  var chartVisible = constraints.chartVisible !== false;
  var splitterCount = (panelVisible ? 1 : 0) + (chartVisible ? 1 : 0);
  var available = Math.max(0, Number(constraints.totalSize) -
    splitterCount * Number(constraints.splitterSize) -
    Number(constraints.minGridSize));
  var panel = panelVisible ? Math.max(Number(constraints.minPanelSize), Number(sizes.panel) || 0) : 0;
  var chart = chartVisible ? Math.max(Number(constraints.minChartSize), Number(sizes.chart) || 0) : 0;
  var overflow = panel + chart - available;
  var amount;
  if (overflow > 0 && chartVisible) {
    amount = Math.min(overflow, Math.max(0, chart - Number(constraints.minChartSize)));
    chart -= amount;
    overflow -= amount;
  }
  if (overflow > 0 && panelVisible) {
    amount = Math.min(overflow, Math.max(0, panel - Number(constraints.minPanelSize)));
    panel -= amount;
    overflow -= amount;
  }
  if (overflow > 0 && chartVisible) {
    amount = Math.min(overflow, chart);
    chart -= amount;
    overflow -= amount;
  }
  if (overflow > 0 && panelVisible) {
    panel = Math.max(0, panel - overflow);
  }
  return {
    panel: Math.round(panel),
    chart: Math.round(chart)
  };
}

function calculatePivotWorkspacePaneSize(kind, startSize, delta, constraints) {
  var panelVisible = constraints.panelVisible !== false;
  var chartVisible = constraints.chartVisible !== false;
  var splitterCount = (panelVisible ? 1 : 0) + (chartVisible ? 1 : 0);
  var otherSize = kind === 'panel' ?
    (chartVisible ? Number(constraints.chartSize) : 0) :
    (panelVisible ? Number(constraints.panelSize) : 0);
  var minimum = kind === 'panel' ? Number(constraints.minPanelSize) : Number(constraints.minChartSize);
  var maximum = Number(constraints.totalSize) -
    splitterCount * Number(constraints.splitterSize) -
    Number(constraints.minGridSize) -
    otherSize;
  var value = Number(startSize) + (kind === 'chart' ? -Number(delta) : Number(delta));
  maximum = Math.max(0, maximum);
  minimum = Math.min(Math.max(0, minimum), maximum);
  return Math.round(Math.max(minimum, Math.min(maximum, value)));
}

function createPivotWorkspaceFactory(
  Control,
  registerControl,
  unregisterControl,
  PivotEngine,
  PivotPanel,
  PivotGrid,
  PivotChart,
  FabGrid
) {
  function PivotWorkspace(element, options) {
    var host = resolvePivotWorkspaceHostElement(element);
    var source;
    if (!host) {
      throw new TypeError('PivotWorkspace host element was not found.');
    }
    Control.call(this);
    this.hostElement = host;
    this.root = host;
    this.options = normalizePivotWorkspaceOptions(options);
    this.options.layout = normalizeLayout(this.options.layout);
    this.locale = this.options.locale || 'en';
    this.messages = this.options.messages || null;
    this._disposed = false;
    this._layout = null;
    this._panelVisible = this.options.showPanel !== false;
    this._chartVisible = this.options.showChart !== false;
    this._horizontalSizes = {
      panel: normalizePositiveNumber(this.options.panelSize, 300),
      chart: normalizePositiveNumber(this.options.chartSize, 350)
    };
    this._horizontalChartSize = normalizeChartSize(this.options.chartSize, '40%');
    this.options.chartSize = this._horizontalChartSize;
    this._verticalSizes = {
      panel: normalizePositiveNumber(this.options.verticalPanelSize, 190),
      chart: normalizePositiveNumber(this.options.verticalChartSize, 190)
    };
    this._dragState = null;
    this._fallbackFullscreenPane = null;
    this._resizeFrame = 0;
    this._documentPointerMoveHandler = this._handleDocumentPointerMove.bind(this);
    this._documentPointerUpHandler = this._handleDocumentPointerUp.bind(this);
    source = this.options.engine || this.options.itemsSource;
    this._engine = source instanceof PivotEngine ? source : new PivotEngine(getEngineOptions(this.options));
    this._createDom();
    this._createChildren();
    this._createControls();
    this._bindEvents();
    this._observeSize();
    registerControl(host, this);
    this.applyLocaleToDom();
    this.resize();
  }

  PivotWorkspace.prototype = Object.create(Control.prototype);
  PivotWorkspace.prototype.constructor = PivotWorkspace;

  PivotWorkspace.prototype._createDom = function() {
    this.hostElement.innerHTML = '';
    this.hostElement.classList.add('fg-root', 'fg-pivot-workspace');
    this.hostElement.setAttribute('role', 'group');
    if (this.options.showHeaders === false) {
      this.hostElement.classList.add('fg-pivot-workspace-headers-hidden');
    }
    this.panelPane = this._createPane('panel');
    this.panelSplitter = this._createSplitter('panel');
    this.gridPane = this._createPane('grid');
    this.chartSplitter = this._createSplitter('chart');
    this.chartPane = this._createPane('chart');
    this.hostElement.appendChild(this.panelPane.pane);
    this.hostElement.appendChild(this.panelSplitter);
    this.hostElement.appendChild(this.gridPane.pane);
    this.hostElement.appendChild(this.chartSplitter);
    this.hostElement.appendChild(this.chartPane.pane);
  };

  PivotWorkspace.prototype._createPane = function(name) {
    var pane = document.createElement('section');
    var header = document.createElement('div');
    var title = document.createElement('span');
    var actions = document.createElement('span');
    var body = document.createElement('div');
    pane.className = 'fg-pivot-workspace-pane fg-pivot-workspace-' + name + '-pane';
    pane.setAttribute('data-pane', name);
    header.className = 'fg-pivot-workspace-pane-header';
    header.setAttribute('role', 'heading');
    header.setAttribute('aria-level', '2');
    title.className = 'fg-pivot-workspace-pane-title';
    actions.className = 'fg-pivot-workspace-pane-actions';
    body.className = 'fg-pivot-workspace-pane-body fg-pivot-workspace-' + name + '-host';
    header.appendChild(title);
    header.appendChild(actions);
    pane.appendChild(header);
    pane.appendChild(body);
    return {
      pane: pane,
      header: header,
      title: title,
      actions: actions,
      body: body
    };
  };

  PivotWorkspace.prototype._createSplitter = function(name) {
    var splitter = document.createElement('div');
    splitter.className = 'fg-pivot-workspace-splitter fg-pivot-workspace-' + name + '-splitter';
    splitter.setAttribute('data-splitter', name);
    splitter.setAttribute('role', 'separator');
    splitter.setAttribute('tabindex', '0');
    splitter.setAttribute('aria-valuemin', '0');
    return splitter;
  };

  PivotWorkspace.prototype._createChildren = function() {
    var panelOptions = getChildOptions(this.options, this.options.panelOptions, this._engine);
    var gridOptions = getChildOptions(this.options, this.options.gridOptions, this._engine);
    var chartOptions = getChildOptions(this.options, this.options.chartOptions, this._engine);
    chartOptions.selectionSource = null;
    this.panel = new PivotPanel(this.panelPane.body, panelOptions);
    this.grid = new PivotGrid(this.gridPane.body, gridOptions);
    chartOptions.selectionSource = this.grid;
    this.chart = new PivotChart(this.chartPane.body, chartOptions);
  };

  PivotWorkspace.prototype._createControls = function() {
    var chartTypes = ['Column', 'Bar', 'Line', 'Pie'];
    var i;
    var option;
    if (this.options.showControls === false) {
      return;
    }
    this.panelToggleButton = document.createElement('button');
    this.panelToggleButton.type = 'button';
    this.panelToggleButton.className = 'fg-pivot-workspace-control';
    this.chartToggleButton = document.createElement('button');
    this.chartToggleButton.type = 'button';
    this.chartToggleButton.className = 'fg-pivot-workspace-control';
    this.chartTypeSelect = document.createElement('select');
    this.chartTypeSelect.className = 'fg-pivot-workspace-control fg-pivot-workspace-chart-type';
    this.gridFullscreenButton = document.createElement('button');
    this.gridFullscreenButton.type = 'button';
    this.gridFullscreenButton.className =
      'fg-pivot-workspace-control fg-pivot-workspace-fullscreen icon-fullscreen';
    this.chartFullscreenButton = document.createElement('button');
    this.chartFullscreenButton.type = 'button';
    this.chartFullscreenButton.className =
      'fg-pivot-workspace-control fg-pivot-workspace-fullscreen icon-fullscreen';
    for (i = 0; i < chartTypes.length; i += 1) {
      option = document.createElement('option');
      option.value = chartTypes[i];
      this.chartTypeSelect.appendChild(option);
    }
    this.gridPane.actions.appendChild(this.panelToggleButton);
    this.gridPane.actions.appendChild(this.chartToggleButton);
    this.gridPane.actions.appendChild(this.gridFullscreenButton);
    this.chartPane.actions.appendChild(this.chartTypeSelect);
    this.chartPane.actions.appendChild(this.chartFullscreenButton);
  };

  PivotWorkspace.prototype._bindEvents = function() {
    this.addEventListener(this.panelSplitter, 'pointerdown', this._handleSplitterPointerDown.bind(this));
    this.addEventListener(this.chartSplitter, 'pointerdown', this._handleSplitterPointerDown.bind(this));
    this.addEventListener(this.panelSplitter, 'keydown', this._handleSplitterKeyDown.bind(this));
    this.addEventListener(this.chartSplitter, 'keydown', this._handleSplitterKeyDown.bind(this));
    if (this.panelToggleButton) {
      this.addEventListener(this.panelToggleButton, 'click', function() {
        this.setPanelVisible(!this._panelVisible);
      }.bind(this));
    }
    if (this.chartToggleButton) {
      this.addEventListener(this.chartToggleButton, 'click', function() {
        this.setChartVisible(!this._chartVisible);
      }.bind(this));
    }
    if (this.chartTypeSelect) {
      this.addEventListener(this.chartTypeSelect, 'change', function(event) {
        this.setChartType(event.target.value);
      }.bind(this));
    }
    if (this.gridFullscreenButton) {
      this.addEventListener(this.gridFullscreenButton, 'click', function() {
        this.togglePaneFullscreen('grid');
      }.bind(this));
    }
    if (this.chartFullscreenButton) {
      this.addEventListener(this.chartFullscreenButton, 'click', function() {
        this.togglePaneFullscreen('chart');
      }.bind(this));
    }
    this.addEventListener(document, 'fullscreenchange', this._handleFullscreenChange.bind(this));
    this.addEventListener(document, 'webkitfullscreenchange', this._handleFullscreenChange.bind(this));
    this.addEventListener(document, 'keydown', this._handleFullscreenKeyDown.bind(this), true);
  };

  PivotWorkspace.prototype._observeSize = function() {
    var self = this;
    if (typeof ResizeObserver === 'function') {
      this._resizeObserver = new ResizeObserver(function() {
        self._scheduleResize();
      });
      this._resizeObserver.observe(this.hostElement);
    } else if (typeof window !== 'undefined') {
      this._windowResizeHandler = this._scheduleResize.bind(this);
      this.addEventListener(window, 'resize', this._windowResizeHandler);
    }
  };

  PivotWorkspace.prototype.getText = function(path) {
    var locales = FabGrid.locales || {};
    var localeName = this.locale || 'en';
    var baseName = localeName.split('-')[0];
    return getPivotWorkspaceMessageValue(this.messages, path) ||
      getPivotWorkspaceMessageValue(locales[localeName], path) ||
      getPivotWorkspaceMessageValue(locales[baseName], path) ||
      getPivotWorkspaceMessageValue(locales.en, path) || path;
  };

  PivotWorkspace.prototype.applyLocaleToDom = function() {
    this.hostElement.setAttribute('aria-label', this.getText('pivot.workspace.ariaLabel'));
    this.panelPane.title.textContent = this.options.panelTitle || this.getText('pivot.workspace.panelTitle');
    this.gridPane.title.textContent = this.options.gridTitle || this.getText('pivot.workspace.gridTitle');
    this.chartPane.title.textContent = this.options.chartTitle || this.getText('pivot.workspace.chartTitle');
    this.panelSplitter.setAttribute('aria-label', this.getText('pivot.workspace.panelSplitter'));
    this.chartSplitter.setAttribute('aria-label', this.getText('pivot.workspace.chartSplitter'));
    this._syncVisibilityControls();
    this._syncChartTypeControl();
    this._syncFullscreenControls();
  };

  PivotWorkspace.prototype._syncVisibilityControls = function() {
    if (this.panelToggleButton) {
      this.panelToggleButton.textContent = this.getText(
        this._panelVisible ? 'pivot.workspace.hidePanel' : 'pivot.workspace.showPanel'
      );
      this.panelToggleButton.setAttribute('aria-expanded', this._panelVisible ? 'true' : 'false');
    }
    if (this.chartToggleButton) {
      this.chartToggleButton.textContent = this.getText(
        this._chartVisible ? 'pivot.workspace.hideChart' : 'pivot.workspace.showChart'
      );
      this.chartToggleButton.setAttribute('aria-expanded', this._chartVisible ? 'true' : 'false');
    }
  };

  PivotWorkspace.prototype._syncChartTypeControl = function() {
    var chartType;
    var options;
    var i;
    if (this.chartTypeSelect) {
      this.chartTypeSelect.setAttribute('aria-label', this.getText('pivot.workspace.chartType'));
      chartType = normalizePivotWorkspaceChartType(this.chart ? this.chart.chartType : null);
      options = this.chartTypeSelect.options;
      for (i = 0; i < options.length; i += 1) {
        options[i].textContent = this.getText(
          'pivot.workspace.chartTypes.' + String(options[i].value).toLowerCase()
        );
      }
      this.chartTypeSelect.value = chartType;
    }
  };

  PivotWorkspace.prototype._getNativeFullscreenElement = function() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  };

  PivotWorkspace.prototype._getFullscreenElement = function() {
    return this._getNativeFullscreenElement() || this._fallbackFullscreenPane;
  };

  PivotWorkspace.prototype._getFullscreenPane = function(name) {
    if (name === 'grid') {
      return this.gridPane.pane;
    }
    if (name === 'chart') {
      return this.chartPane.pane;
    }
    return null;
  };

  PivotWorkspace.prototype.isPaneFullscreen = function(name) {
    return this._getFullscreenElement() === this._getFullscreenPane(name);
  };

  PivotWorkspace.prototype.isPaneFullscreenAvailable = function(name) {
    return Boolean(this._getFullscreenPane(name));
  };

  PivotWorkspace.prototype._syncFullscreenControls = function() {
    var gridFullscreen;
    var chartFullscreen;
    var gridLabel;
    var chartLabel;
    if (!this.gridFullscreenButton || !this.chartFullscreenButton) {
      return;
    }
    gridFullscreen = this.isPaneFullscreen('grid');
    chartFullscreen = this.isPaneFullscreen('chart');
    gridLabel = this.getText(
      gridFullscreen ? 'pivot.workspace.exitFullscreen' : 'pivot.workspace.gridFullscreen'
    );
    chartLabel = this.getText(
      chartFullscreen ? 'pivot.workspace.exitFullscreen' : 'pivot.workspace.chartFullscreen'
    );
    this.gridFullscreenButton.setAttribute('aria-label', gridLabel);
    this.gridFullscreenButton.setAttribute('title', gridLabel);
    this.gridFullscreenButton.setAttribute('aria-pressed', gridFullscreen ? 'true' : 'false');
    this.gridFullscreenButton.disabled = !this.isPaneFullscreenAvailable('grid');
    this.chartFullscreenButton.setAttribute('aria-label', chartLabel);
    this.chartFullscreenButton.setAttribute('title', chartLabel);
    this.chartFullscreenButton.setAttribute('aria-pressed', chartFullscreen ? 'true' : 'false');
    this.chartFullscreenButton.disabled = !this.isPaneFullscreenAvailable('chart');
  };

  PivotWorkspace.prototype.togglePaneFullscreen = function(name) {
    var pane = this._getFullscreenPane(name);
    var action;
    var context;
    var result;
    if (!pane) {
      return false;
    }
    if (this._fallbackFullscreenPane === pane) {
      this._setFallbackFullscreen(null);
      return true;
    }
    if (this.isPaneFullscreen(name)) {
      action = document.exitFullscreen || document.webkitExitFullscreen;
      context = document;
    } else {
      action = pane.requestFullscreen || pane.webkitRequestFullscreen;
      context = pane;
    }
    if (typeof action !== 'function') {
      this._setFallbackFullscreen(pane);
      return true;
    }
    try {
      result = action.call(context);
      if (result && typeof result.catch === 'function') {
        result.catch(function() {
          this._setFallbackFullscreen(pane);
        }.bind(this));
      }
      return result || true;
    } catch (error) {
      this._setFallbackFullscreen(pane);
      return true;
    }
  };

  PivotWorkspace.prototype._setFallbackFullscreen = function(pane) {
    if (this._fallbackFullscreenPane) {
      this._fallbackFullscreenPane.classList.remove('fg-pivot-workspace-pane-fullscreen');
    }
    this._fallbackFullscreenPane = pane || null;
    if (this._fallbackFullscreenPane) {
      this._fallbackFullscreenPane.classList.add('fg-pivot-workspace-pane-fullscreen');
    }
    this._syncFullscreenControls();
    this._scheduleResize();
  };

  PivotWorkspace.prototype._handleFullscreenKeyDown = function(event) {
    if (event.key !== 'Escape' || !this._fallbackFullscreenPane) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this._setFallbackFullscreen(null);
  };

  PivotWorkspace.prototype._handleFullscreenChange = function() {
    if (this._disposed) {
      return;
    }
    this._syncFullscreenControls();
    this._scheduleResize();
  };

  PivotWorkspace.prototype._getActiveSizes = function() {
    return this._layout === 'Vertical' ? this._verticalSizes : this._horizontalSizes;
  };

  PivotWorkspace.prototype._getConstraints = function() {
    var vertical = this._layout === 'Vertical';
    return {
      totalSize: vertical ? this.hostElement.clientHeight : this.hostElement.clientWidth,
      splitterSize: normalizePositiveNumber(this.options.splitterSize, 7),
      minPanelSize: vertical ?
        normalizePositiveNumber(this.options.minVerticalPanelSize, 120) :
        normalizePositiveNumber(this.options.minPanelSize, 220),
      minGridSize: vertical ?
        normalizePositiveNumber(this.options.minVerticalGridSize, 180) :
        normalizePositiveNumber(this.options.minGridSize, 320),
      minChartSize: vertical ?
        normalizePositiveNumber(this.options.minVerticalChartSize, 120) :
        normalizePositiveNumber(this.options.minChartSize, 240),
      panelVisible: this._panelVisible,
      chartVisible: this._chartVisible
    };
  };

  PivotWorkspace.prototype._applyPaneSizes = function() {
    var sizes = this._getActiveSizes();
    var constraints = this._getConstraints();
    var requested = {
      panel: sizes.panel,
      chart: sizes.chart
    };
    var fitted;
    constraints.panelSize = sizes.panel;
    if (this._layout === 'Horizontal' && constraints.chartVisible) {
      requested.chart = resolvePivotWorkspaceChartSize(this._horizontalChartSize, constraints);
    }
    fitted = constraints.totalSize > 0 ?
      fitPivotWorkspacePaneSizes(requested, constraints) : requested;
    if (constraints.panelVisible) {
      sizes.panel = fitted.panel;
    }
    if (constraints.chartVisible) {
      sizes.chart = fitted.chart;
    }
    this.hostElement.style.setProperty('--fg-pivot-workspace-panel-size', sizes.panel + 'px');
    this.hostElement.style.setProperty('--fg-pivot-workspace-chart-size', sizes.chart + 'px');
    this.hostElement.style.setProperty(
      '--fg-pivot-workspace-splitter-size',
      normalizePositiveNumber(this.options.splitterSize, 7) + 'px'
    );
    this.panelSplitter.setAttribute('aria-valuenow', String(sizes.panel));
    this.chartSplitter.setAttribute('aria-valuenow', String(sizes.chart));
    this.panelSplitter.setAttribute('aria-valuemax', String(Math.max(sizes.panel, constraints.totalSize)));
    this.chartSplitter.setAttribute('aria-valuemax', String(Math.max(sizes.chart, constraints.totalSize)));
  };

  PivotWorkspace.prototype._applyVisibility = function() {
    this.hostElement.classList.toggle('fg-pivot-workspace-panel-hidden', !this._panelVisible);
    this.hostElement.classList.toggle('fg-pivot-workspace-chart-hidden', !this._chartVisible);
    this.panelPane.pane.setAttribute('aria-hidden', this._panelVisible ? 'false' : 'true');
    this.chartPane.pane.setAttribute('aria-hidden', this._chartVisible ? 'false' : 'true');
    this._syncVisibilityControls();
  };

  PivotWorkspace.prototype._applyLayout = function(layout) {
    var changed = this._layout !== layout;
    this._layout = layout;
    this.hostElement.classList.toggle('fg-pivot-workspace-horizontal', layout === 'Horizontal');
    this.hostElement.classList.toggle('fg-pivot-workspace-vertical', layout === 'Vertical');
    this.panelSplitter.setAttribute('aria-orientation', layout === 'Horizontal' ? 'vertical' : 'horizontal');
    this.chartSplitter.setAttribute('aria-orientation', layout === 'Horizontal' ? 'vertical' : 'horizontal');
    if (changed && typeof this.options.layoutChanged === 'function') {
      this.options.layoutChanged(this, { layout: layout });
    }
  };

  PivotWorkspace.prototype._scheduleResize = function() {
    var self = this;
    var schedule;
    if (this._disposed || this._resizeFrame) {
      return;
    }
    schedule = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : function(callback) {
      return setTimeout(callback, 0);
    };
    this._resizeFrame = schedule(function() {
      self._resizeFrame = 0;
      self.resize();
    });
  };

  PivotWorkspace.prototype._resizeChildren = function() {
    if (this.grid && typeof this.grid.refresh === 'function') {
      this.grid.refresh();
    }
    if (this.chart && typeof this.chart.resize === 'function') {
      this.chart.resize();
    }
  };

  PivotWorkspace.prototype.resize = function() {
    var layout;
    if (this._disposed) {
      return this;
    }
    layout = resolvePivotWorkspaceLayout(
      this.options.layout,
      this.hostElement.clientWidth,
      this.options.compactBreakpoint
    );
    this._applyLayout(layout);
    this._applyVisibility();
    this._applyPaneSizes();
    this._resizeChildren();
    return this;
  };

  PivotWorkspace.prototype._getPointerCoordinate = function(event) {
    return this._layout === 'Horizontal' ? event.clientX : event.clientY;
  };

  PivotWorkspace.prototype._handleSplitterPointerDown = function(event) {
    var kind;
    var sizes;
    if (event.button != null && event.button !== 0) {
      return;
    }
    kind = event.currentTarget.getAttribute('data-splitter');
    if ((kind === 'panel' && !this._panelVisible) || (kind === 'chart' && !this._chartVisible)) {
      return;
    }
    event.preventDefault();
    sizes = this._getActiveSizes();
    this._dragState = {
      kind: kind,
      pointerId: event.pointerId,
      startCoordinate: this._getPointerCoordinate(event),
      startSize: sizes[kind],
      layout: this._layout
    };
    this.hostElement.classList.add('fg-pivot-workspace-resizing');
    document.addEventListener('pointermove', this._documentPointerMoveHandler, false);
    document.addEventListener('pointerup', this._documentPointerUpHandler, false);
    document.addEventListener('pointercancel', this._documentPointerUpHandler, false);
  };

  PivotWorkspace.prototype._handleDocumentPointerMove = function(event) {
    var state = this._dragState;
    var sizes;
    var constraints;
    var delta;
    if (!state || (state.pointerId != null && event.pointerId !== state.pointerId)) {
      return;
    }
    event.preventDefault();
    if (state.layout !== this._layout) {
      this._endSplitterDrag();
      return;
    }
    sizes = this._getActiveSizes();
    constraints = this._getConstraints();
    constraints.panelSize = sizes.panel;
    constraints.chartSize = sizes.chart;
    delta = this._getPointerCoordinate(event) - state.startCoordinate;
    sizes[state.kind] = calculatePivotWorkspacePaneSize(
      state.kind,
      state.startSize,
      delta,
      constraints
    );
    if (state.kind === 'chart' && this._layout === 'Horizontal') {
      this._horizontalChartSize = sizes.chart;
      this.options.chartSize = sizes.chart;
    }
    this._applyPaneSizes();
    this._scheduleResize();
  };

  PivotWorkspace.prototype._handleDocumentPointerUp = function(event) {
    if (!this._dragState ||
        (this._dragState.pointerId != null && event.pointerId !== this._dragState.pointerId)) {
      return;
    }
    this._endSplitterDrag(true);
  };

  PivotWorkspace.prototype._endSplitterDrag = function(notify) {
    var sizes = this._getActiveSizes();
    document.removeEventListener('pointermove', this._documentPointerMoveHandler, false);
    document.removeEventListener('pointerup', this._documentPointerUpHandler, false);
    document.removeEventListener('pointercancel', this._documentPointerUpHandler, false);
    this.hostElement.classList.remove('fg-pivot-workspace-resizing');
    this._dragState = null;
    if (notify && typeof this.options.paneSizeChanged === 'function') {
      this.options.paneSizeChanged(this, {
        layout: this._layout,
        panelSize: sizes.panel,
        chartSize: sizes.chart
      });
    }
  };

  PivotWorkspace.prototype._handleSplitterKeyDown = function(event) {
    var kind = event.currentTarget.getAttribute('data-splitter');
    var horizontal = this._layout === 'Horizontal';
    var direction = 0;
    var sizes;
    var constraints;
    if ((horizontal && event.key === 'ArrowLeft') || (!horizontal && event.key === 'ArrowUp')) {
      direction = -1;
    } else if ((horizontal && event.key === 'ArrowRight') || (!horizontal && event.key === 'ArrowDown')) {
      direction = 1;
    }
    if (!direction) {
      return;
    }
    event.preventDefault();
    sizes = this._getActiveSizes();
    constraints = this._getConstraints();
    constraints.panelSize = sizes.panel;
    constraints.chartSize = sizes.chart;
    sizes[kind] = calculatePivotWorkspacePaneSize(
      kind,
      sizes[kind],
      direction * normalizePositiveNumber(this.options.splitterStep, 16),
      constraints
    );
    if (kind === 'chart' && this._layout === 'Horizontal') {
      this._horizontalChartSize = sizes.chart;
      this.options.chartSize = sizes.chart;
    }
    this._applyPaneSizes();
    this._resizeChildren();
    if (typeof this.options.paneSizeChanged === 'function') {
      this.options.paneSizeChanged(this, {
        layout: this._layout,
        panelSize: sizes.panel,
        chartSize: sizes.chart
      });
    }
  };

  PivotWorkspace.prototype.setPanelVisible = function(visible) {
    this._panelVisible = visible !== false;
    this.options.showPanel = this._panelVisible;
    this.resize();
    return this;
  };

  PivotWorkspace.prototype.setChartVisible = function(visible) {
    this._chartVisible = visible !== false;
    this.options.showChart = this._chartVisible;
    this.resize();
    return this;
  };

  PivotWorkspace.prototype.setChartType = function(type) {
    type = normalizePivotWorkspaceChartType(type);
    this.chart.setType(type);
    if (this.chartTypeSelect) {
      this.chartTypeSelect.value = type;
    }
    return this;
  };

  PivotWorkspace.prototype.setPaneSizes = function(panelSize, chartSize) {
    var sizes = this._getActiveSizes();
    if (panelSize != null) {
      sizes.panel = normalizePositiveNumber(panelSize, sizes.panel);
    }
    if (chartSize != null) {
      if (this._layout === 'Horizontal') {
        this._horizontalChartSize = normalizeChartSize(chartSize, this._horizontalChartSize);
        this.options.chartSize = this._horizontalChartSize;
        if (typeof this._horizontalChartSize === 'number') {
          sizes.chart = this._horizontalChartSize;
        }
      } else {
        sizes.chart = normalizePositiveNumber(chartSize, sizes.chart);
      }
    }
    this.resize();
    return this;
  };

  PivotWorkspace.prototype.setLocale = function(locale, messages) {
    this.locale = locale || 'en';
    this.options.locale = this.locale;
    if (messages !== undefined) {
      this.messages = messages;
      this.options.messages = messages;
    }
    this.panel.setLocale(this.locale, messages);
    this.grid.setLocale(this.locale, messages);
    this.chart.setLocale(this.locale, messages);
    this.applyLocaleToDom();
    return this;
  };

  PivotWorkspace.prototype.setEngine = function(engine) {
    if (!(engine instanceof PivotEngine)) {
      throw new TypeError('PivotWorkspace engine must be a fabui.pivot.PivotEngine instance.');
    }
    if (this._engine === engine) {
      return this;
    }
    this._engine = engine;
    this.panel.setItemsSource(engine);
    this.grid.setPivotEngine(engine);
    this.chart.setItemsSource(engine);
    return this;
  };

  PivotWorkspace.prototype.setItemsSource = function(source) {
    if (source instanceof PivotEngine) {
      return this.setEngine(source);
    }
    if (!Array.isArray(source)) {
      throw new TypeError('PivotWorkspace itemsSource must be an Array or fabui.pivot.PivotEngine.');
    }
    this._engine.setItemsSource(source);
    return this;
  };

  PivotWorkspace.prototype.dispose = function() {
    if (this._disposed) {
      return;
    }
    this._disposed = true;
    this._endSplitterDrag(false);
    this._setFallbackFullscreen(null);
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._resizeFrame) {
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this._resizeFrame);
      } else {
        clearTimeout(this._resizeFrame);
      }
      this._resizeFrame = 0;
    }
    if (this.chart) {
      this.chart.dispose();
    }
    if (this.grid) {
      this.grid.dispose();
    }
    if (this.panel) {
      this.panel.dispose();
    }
    this.removeEventListener();
    unregisterControl(this.hostElement, this);
    this.hostElement.innerHTML = '';
    this.hostElement.classList.remove(
      'fg-root',
      'fg-pivot-workspace',
      'fg-pivot-workspace-horizontal',
      'fg-pivot-workspace-vertical',
      'fg-pivot-workspace-panel-hidden',
      'fg-pivot-workspace-chart-hidden',
      'fg-pivot-workspace-headers-hidden',
      'fg-pivot-workspace-resizing'
    );
    this._engine = null;
    this.panel = null;
    this.grid = null;
    this.chart = null;
    this.panelToggleButton = null;
    this.chartToggleButton = null;
    this.chartTypeSelect = null;
    this.gridFullscreenButton = null;
    this.chartFullscreenButton = null;
  };

  Object.defineProperties(PivotWorkspace.prototype, {
    engine: {
      get: function() { return this._engine; },
      set: function(value) { this.setEngine(value); }
    },
    itemsSource: {
      get: function() { return this._engine ? this._engine.itemsSource : []; },
      set: function(value) { this.setItemsSource(value); }
    },
    layout: {
      get: function() { return this._layout; },
      set: function(value) {
        this.options.layout = normalizeLayout(value);
        this.resize();
      }
    },
    showPanel: {
      get: function() { return this._panelVisible; },
      set: function(value) { this.setPanelVisible(value); }
    },
    showChart: {
      get: function() { return this._chartVisible; },
      set: function(value) { this.setChartVisible(value); }
    },
    panelSize: {
      get: function() { return this._getActiveSizes().panel; },
      set: function(value) { this.setPaneSizes(value, null); }
    },
    chartSize: {
      get: function() { return this._getActiveSizes().chart; },
      set: function(value) { this.setPaneSizes(null, value); }
    },
    chartType: {
      get: function() {
        return this.chart ? normalizePivotWorkspaceChartType(this.chart.chartType) : 'Column';
      },
      set: function(value) { this.setChartType(value); }
    }
  });

  return PivotWorkspace;
}

var editorDefinitions = createEditorDefinitions();
var Chart = createChartFactory();
var FabGrid = createFabGridFactory(editorDefinitions);
var PivotChart = createPivotChartFactory(Control, registerControl, unregisterControl, PivotEngine, Chart, FabGrid);
var PivotGrid = createPivotGridFactory(FabGrid, PivotEngine);
var PivotPanel = createPivotPanelFactory(Control, registerControl, unregisterControl, PivotEngine, FabGrid);
var PivotWorkspace = createPivotWorkspaceFactory(Control, registerControl, unregisterControl, PivotEngine, PivotPanel, PivotGrid, PivotChart, FabGrid);
var pivotNamespace = {
  PivotAggregate: PivotAggregate,
  PivotChart: PivotChart,
  PivotEngine: PivotEngine,
  PivotField: PivotField,
  PivotGrid: PivotGrid,
  PivotPanel: PivotPanel,
  PivotShowTotals: PivotShowTotals,
  PivotWorkspace: PivotWorkspace
};
var fabui = {
  version: "2026.7.17",
  editorDefinitions: editorDefinitions,
  Control: Control,
  Chart: Chart,
  FabGrid: FabGrid,
  pivot: pivotNamespace,
  CellType: CellType,
  FabGridLocales: FabGrid.locales
};
(function(root, factory) {
  var locale = factory();
  root.fabui = root.fabui || {};
  root.fabui.FabGridLocales = root.fabui.FabGridLocales || {};
  root.fabui.FabGridLocales.en = locale;
  if (root.fabui.FabGrid && root.fabui.FabGrid.addLocale) {
    root.fabui.FabGrid.addLocale('en', locale);
  }
}({ fabui: fabui }, function() {
  return {
    emptyText: 'No data',
    chart: { emptyText: 'No data', value: 'Value', percent: 'Percent' },
    exportBusyText: 'Exporting Excel...',
    workingText: 'Working...',
    loadMsg: 'Processing, please wait...',
    tree: {
      contextMenuAriaLabel: 'TreeGrid expand and collapse',
      expandAll: 'Expand all',
      collapseAll: 'Collapse all'
    },
    pivot: {
      grandTotal: 'Grand Total',
      total: 'Total',
      expandGroup: 'Expand group',
      collapseGroup: 'Collapse group',
      expandAll: 'Expand all',
      collapseAll: 'Collapse all',
      showDetail: 'Show detail',
      detailTitle: 'Detail records',
      detailCount: '{count} records',
      closeDetail: 'Close detail',
      sortAscending: 'Sort ascending',
      sortDescending: 'Sort descending',
      clearSort: 'Clear sort',
      aggregate: 'Aggregate',
      removeField: 'Remove field',
      filteredValues: 'Filtered',
      chart: {
        ariaLabel: 'Pivot chart',
        title: 'Pivot Chart',
        pointsTruncated: 'Showing {count} of {total} categories',
        seriesTruncated: 'Showing {count} of {total} series'
      },
      workspace: {
        ariaLabel: 'Pivot analysis workspace',
        panelTitle: 'Define View',
        gridTitle: 'Pivot Grid',
        chartTitle: 'Pivot Chart',
        panelSplitter: 'Resize definition pane',
        chartSplitter: 'Resize chart pane',
        hidePanel: 'Hide Definition',
        showPanel: 'Show Definition',
        hideChart: 'Hide Chart',
        showChart: 'Show Chart',
        gridFullscreen: 'Pivot Grid fullscreen',
        chartFullscreen: 'Pivot Chart fullscreen',
        exitFullscreen: 'Exit fullscreen',
        chartType: 'Chart type',
        chartTypes: {
          column: 'Column',
          bar: 'Bar',
          line: 'Line',
          pie: 'Pie'
        }
      },
      panel: {
        ariaLabel: 'Pivot view settings',
        fields: 'Fields',
        filters: 'Filters',
        rows: 'Rows',
        columns: 'Columns',
        values: 'Values',
        allValues: 'All',
        filterField: 'Filter {field}',
        aggregateMenu: 'Value aggregation settings',
        aggregateField: 'Set aggregation for {field}',
        sortMenu: 'Dimension sorting settings',
        sortField: 'Set sorting for {field}',
        sortDefault: 'Default order',
        dropFields: 'Drag fields here',
        noFields: 'No fields available',
        removeField: 'Remove field'
      },
      aggregates: {
        sum: 'Sum',
        count: 'Count',
        average: 'Average',
        min: 'Minimum',
        max: 'Maximum'
      }
    },
    pagination: {
      ariaLabel: 'Pagination',
      pageSize: 'Page size',
      pageNumber: 'Page number',
      beforePageText: 'Page',
      afterPageText: 'of {pages}',
      displayMsg: 'Displaying {from} to {to} of {total} items',
      first: 'First page',
      previous: 'Previous page',
      next: 'Next page',
      last: 'Last page',
      refresh: 'Refresh'
    },
    validation: {
      invalidValue: 'Invalid value',
      invalidDate: 'Invalid date',
      invalidYearMonth: 'Invalid year and month',
      invalidColor: 'Invalid color',
      comboboxLimitToList: 'Please select a valid item'
    },
    topLeftMenu: {
      ariaLabel: 'Grid menu',
      showSearchRow: 'Show search row',
      hideSearchRow: 'Hide search row',
      clearFilter: 'Clear filters',
      rowHeaders: 'Row headers',
      rowHeadersOff: 'Row headers: Off',
      rowHeadersNumbers: 'Row headers: Numbers',
      rowHeadersCellOnly: 'Row headers: Cells only',
      exportExcel: 'Export Excel',
      exportCsv: 'Export CSV',
      fullscreen: 'Grid fullscreen',
      exitFullscreen: 'Exit fullscreen'
    },
    aria: {
      cellEditor: 'Cell editor',
      openDatePicker: 'Open date picker',
      datePicker: 'Date picker',
      openComboBox: 'Open combo box',
      comboBoxOptions: 'Combo box options',
      openColorPicker: 'Open color picker',
      colorPicker: 'Color picker',
      openColumnChooser: 'Open column chooser',
      columnChooser: 'Column chooser',
      selectAllRows: 'Select all rows',
      selectRow: 'Select row {rowNumber}',
      rowDragItem: 'Grid row',
      expandNode: 'Expand node',
      collapseNode: 'Collapse node',
      year: 'Year'
    },
    filter: {
      openMenu: 'Open filter menu for {column}',
      searchValues: 'Search',
      selectAll: 'Select All',
      apply: 'Apply',
      cancel: 'Cancel',
      blankValue: '(Blanks)',
      startsWith: 'Starts with ({symbol})',
      contains: 'Contains ({symbol})',
      endsWith: 'Ends with ({symbol})',
      notStartsWith: 'Does not start with ({symbol})',
      notContains: 'Does not contain ({symbol})',
      notEndsWith: 'Does not end with ({symbol})',
      greaterThanOrEqual: '{symbol}',
      greaterThan: '{symbol}',
      lessThanOrEqual: '{symbol}',
      lessThan: '{symbol}',
      notEqual: '{symbol}',
      equal: '{symbol}',
      clear: 'Clear'
    },
    datebox: {
      today: 'Today',
      close: 'Close',
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      months: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ],
      monthTitle: '{month} {year}'
    }
  };
}));

(function(root, factory) {
  var locale = factory();
  root.fabui = root.fabui || {};
  root.fabui.FabGridLocales = root.fabui.FabGridLocales || {};
  root.fabui.FabGridLocales['zh-TW'] = locale;
  if (root.fabui.FabGrid && root.fabui.FabGrid.addLocale) {
    root.fabui.FabGrid.addLocale('zh-TW', locale);
  }
}({ fabui: fabui }, function() {
  return {
    emptyText: '沒有資料',
    chart: { emptyText: '沒有資料', value: '數值', percent: '百分比' },
    exportBusyText: '匯出 Excel 中...',
    workingText: '處理中...',
    loadMsg: '正在處理，請稍候...',
    tree: {
      contextMenuAriaLabel: 'TreeGrid 展開與疊合',
      expandAll: '全部展開',
      collapseAll: '全部疊合'
    },
    pivot: {
      grandTotal: '總計',
      total: '小計',
      expandGroup: '展開群組',
      collapseGroup: '收合群組',
      expandAll: '全部展開',
      collapseAll: '全部疊合',
      showDetail: '查看明細',
      detailTitle: '明細資料',
      detailCount: '共 {count} 筆',
      closeDetail: '關閉明細',
      sortAscending: '升冪排序',
      sortDescending: '降冪排序',
      clearSort: '清除排序',
      aggregate: '彙總方式',
      removeField: '移除欄位',
      filteredValues: '已篩選',
      chart: {
        ariaLabel: 'Pivot 圖表',
        title: 'Pivot 圖表',
        pointsTruncated: '顯示前 {count}／{total} 個分類',
        seriesTruncated: '顯示前 {count}／{total} 個系列'
      },
      workspace: {
        ariaLabel: 'Pivot 分析工作區',
        panelTitle: '定義 View',
        gridTitle: 'Pivot Grid',
        chartTitle: 'Pivot 圖表',
        panelSplitter: '調整定義區大小',
        chartSplitter: '調整圖表區大小',
        hidePanel: '隱藏定義',
        showPanel: '顯示定義',
        hideChart: '隱藏圖表',
        showChart: '顯示圖表',
        gridFullscreen: 'Pivot Grid 全螢幕',
        chartFullscreen: 'Pivot 圖表全螢幕',
        exitFullscreen: '離開全螢幕',
        chartType: '圖形類型',
        chartTypes: {
          column: '直條圖',
          bar: '橫條圖',
          line: '折線圖',
          pie: '圓餅圖'
        }
      },
      panel: {
        ariaLabel: 'Pivot View 設定',
        fields: '欄位',
        filters: '篩選',
        rows: '列',
        columns: '欄',
        values: '數值',
        allValues: '全部',
        filterField: '篩選「{field}」',
        aggregateMenu: '數值彙總設定',
        aggregateField: '設定「{field}」彙總函數',
        sortMenu: '維度排序設定',
        sortField: '設定「{field}」排序',
        sortDefault: '預設順序',
        dropFields: '拖曳欄位到這裡',
        noFields: '沒有可用欄位',
        removeField: '移除欄位'
      },
      aggregates: {
        sum: '加總',
        count: '筆數',
        average: '平均',
        min: '最小值',
        max: '最大值'
      }
    },
    pagination: {
      ariaLabel: '分頁導覽',
      pageSize: '每頁筆數',
      pageNumber: '頁碼',
      beforePageText: '頁',
      afterPageText: '共{pages}頁',
      displayMsg: '顯示{from}到{to},共{total}記錄',
      first: '第一頁',
      previous: '上一頁',
      next: '下一頁',
      last: '最後一頁',
      refresh: '重新整理'
    },
    validation: {
      invalidValue: '輸入值無效',
      invalidDate: '日期格式錯誤',
      invalidYearMonth: '年月格式錯誤',
      invalidColor: '色碼格式錯誤',
      comboboxLimitToList: '請從清單選擇有效項目'
    },
    topLeftMenu: {
      ariaLabel: 'Grid 功能表',
      showSearchRow: '顯示搜尋列',
      hideSearchRow: '隱藏搜尋列',
      clearFilter: '清除篩選',
      rowHeaders: '列號',
      rowHeadersOff: '列號：關閉',
      rowHeadersNumbers: '列號：顯示列號',
      rowHeadersCellOnly: '列號：只顯示 cell',
      exportExcel: '匯出 Excel',
      exportCsv: '匯出 CSV',
      fullscreen: 'Grid 全螢幕',
      exitFullscreen: '離開全螢幕'
    },
    aria: {
      cellEditor: '儲存格編輯器',
      openDatePicker: '開啟日期選擇器',
      datePicker: '日期選擇器',
      openComboBox: '開啟下拉選單',
      comboBoxOptions: '下拉選項',
      openColorPicker: '開啟顏色選擇器',
      colorPicker: '顏色選擇器',
      openColumnChooser: '開啟欄位選擇器',
      columnChooser: '欄位選擇器',
      selectAllRows: '選取所有列',
      selectRow: '選取第 {rowNumber} 列',
      rowDragItem: 'Grid 資料列',
      expandNode: '展開節點',
      collapseNode: '收合節點',
      year: '年份'
    },
    filter: {
      openMenu: '開啟「{column}」篩選選單',
      searchValues: '搜尋',
      selectAll: '全選',
      apply: '套用',
      cancel: '取消',
      blankValue: '(空白)',
      startsWith: '開頭比對({symbol})',
      contains: '包含比對({symbol})',
      endsWith: '結尾比對({symbol})',
      notStartsWith: '隱藏開頭比對({symbol})',
      notContains: '不包含比對({symbol})',
      notEndsWith: '隱藏結尾比對({symbol})',
      greaterThanOrEqual: '{symbol}',
      greaterThan: '{symbol}',
      lessThanOrEqual: '{symbol}',
      lessThan: '{symbol}',
      notEqual: '{symbol}',
      equal: '{symbol}',
      clear: '清除'
    },
    datebox: {
      today: '今天',
      close: '關閉',
      weekdays: ['日', '一', '二', '三', '四', '五', '六'],
      months: [
        '一月',
        '二月',
        '三月',
        '四月',
        '五月',
        '六月',
        '七月',
        '八月',
        '九月',
        '十月',
        '十一月',
        '十二月'
      ],
      monthTitle: '{month} {year}'
    }
  };
}));

(function(root, factory) {
  var locale = factory();
  root.fabui = root.fabui || {};
  root.fabui.FabGridLocales = root.fabui.FabGridLocales || {};
  root.fabui.FabGridLocales['zh-CN'] = locale;
  if (root.fabui.FabGrid && root.fabui.FabGrid.addLocale) {
    root.fabui.FabGrid.addLocale('zh-CN', locale);
  }
}({ fabui: fabui }, function() {
  return {
    emptyText: '没有数据',
    chart: { emptyText: '没有数据', value: '数值', percent: '百分比' },
    exportBusyText: '正在导出 Excel...',
    workingText: '处理中...',
    loadMsg: '正在处理，请稍候...',
    tree: {
      contextMenuAriaLabel: 'TreeGrid 展开与折叠',
      expandAll: '全部展开',
      collapseAll: '全部折叠'
    },
    pivot: {
      grandTotal: '总计',
      total: '小计',
      expandGroup: '展开群组',
      collapseGroup: '折叠群组',
      expandAll: '全部展开',
      collapseAll: '全部折叠',
      showDetail: '查看明细',
      detailTitle: '明细数据',
      detailCount: '共 {count} 条',
      closeDetail: '关闭明细',
      sortAscending: '升序排序',
      sortDescending: '降序排序',
      clearSort: '清除排序',
      aggregate: '汇总方式',
      removeField: '移除字段',
      filteredValues: '已筛选',
      chart: {
        ariaLabel: 'Pivot 图表',
        title: 'Pivot 图表',
        pointsTruncated: '显示前 {count}/{total} 个分类',
        seriesTruncated: '显示前 {count}/{total} 个系列'
      },
      workspace: {
        ariaLabel: 'Pivot 分析工作区',
        panelTitle: '定义 View',
        gridTitle: 'Pivot Grid',
        chartTitle: 'Pivot 图表',
        panelSplitter: '调整定义区大小',
        chartSplitter: '调整图表区大小',
        hidePanel: '隐藏定义',
        showPanel: '显示定义',
        hideChart: '隐藏图表',
        showChart: '显示图表',
        gridFullscreen: 'Pivot Grid 全屏',
        chartFullscreen: 'Pivot 图表全屏',
        exitFullscreen: '退出全屏',
        chartType: '图形类型',
        chartTypes: {
          column: '柱形图',
          bar: '条形图',
          line: '折线图',
          pie: '饼图'
        }
      },
      panel: {
        ariaLabel: 'Pivot View 设置',
        fields: '字段',
        filters: '筛选',
        rows: '行',
        columns: '列',
        values: '数值',
        allValues: '全部',
        filterField: '筛选“{field}”',
        aggregateMenu: '数值汇总设置',
        aggregateField: '设置“{field}”汇总函数',
        sortMenu: '维度排序设置',
        sortField: '设置“{field}”排序',
        sortDefault: '默认顺序',
        dropFields: '拖动字段到这里',
        noFields: '没有可用字段',
        removeField: '移除字段'
      },
      aggregates: {
        sum: '求和',
        count: '计数',
        average: '平均',
        min: '最小值',
        max: '最大值'
      }
    },
    pagination: {
      ariaLabel: '分页导航',
      pageSize: '每页条数',
      pageNumber: '页码',
      beforePageText: '页',
      afterPageText: '共{pages}页',
      displayMsg: '显示{from}到{to},共{total}记录',
      first: '第一页',
      previous: '上一页',
      next: '下一页',
      last: '最后一页',
      refresh: '刷新'
    },
    validation: {
      invalidValue: '输入值无效',
      invalidDate: '日期格式错误',
      invalidYearMonth: '年月格式错误',
      invalidColor: '色码格式错误',
      comboboxLimitToList: '请从列表选择有效项目'
    },
    topLeftMenu: {
      ariaLabel: 'Grid 菜单',
      showSearchRow: '显示搜索行',
      hideSearchRow: '隐藏搜索行',
      clearFilter: '清除筛选',
      rowHeaders: '行号',
      rowHeadersOff: '行号：关闭',
      rowHeadersNumbers: '行号：显示行号',
      rowHeadersCellOnly: '行号：仅显示 cell',
      exportExcel: '导出 Excel',
      exportCsv: '导出 CSV',
      fullscreen: 'Grid 全屏',
      exitFullscreen: '退出全屏'
    },
    aria: {
      cellEditor: '单元格编辑器',
      openDatePicker: '打开日期选择器',
      datePicker: '日期选择器',
      openComboBox: '打开下拉菜单',
      comboBoxOptions: '下拉选项',
      openColorPicker: '打开颜色选择器',
      colorPicker: '颜色选择器',
      openColumnChooser: '打开字段选择器',
      columnChooser: '字段选择器',
      selectAllRows: '选择所有行',
      selectRow: '选择第 {rowNumber} 行',
      rowDragItem: 'Grid 数据行',
      expandNode: '展开节点',
      collapseNode: '折叠节点',
      year: '年份'
    },
    filter: {
      openMenu: '打开“{column}”筛选菜单',
      searchValues: '搜索',
      selectAll: '全选',
      apply: '应用',
      cancel: '取消',
      blankValue: '(空白)',
      startsWith: '开头比对({symbol})',
      contains: '包含比对({symbol})',
      endsWith: '结尾比对({symbol})',
      notStartsWith: '隐藏开头比对({symbol})',
      notContains: '不包含比对({symbol})',
      notEndsWith: '隐藏结尾比对({symbol})',
      greaterThanOrEqual: '{symbol}',
      greaterThan: '{symbol}',
      lessThanOrEqual: '{symbol}',
      lessThan: '{symbol}',
      notEqual: '{symbol}',
      equal: '{symbol}',
      clear: '清除'
    },
    datebox: {
      today: '今天',
      close: '关闭',
      weekdays: ['日', '一', '二', '三', '四', '五', '六'],
      months: [
        '一月',
        '二月',
        '三月',
        '四月',
        '五月',
        '六月',
        '七月',
        '八月',
        '九月',
        '十月',
        '十一月',
        '十二月'
      ],
      monthTitle: '{month} {year}'
    }
  };
}));

export { fabui };
export default fabui;
