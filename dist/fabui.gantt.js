/*! FabUI Gantt browser global | Requires FabUI core */
(function(global) {
if (!global.fabui || typeof global.fabui.Control !== "function") {
  throw new Error("Load fabui.js before fabui.gantt.js.");
}
var GANTT_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono', 'mono-red', 'mono-green'
];

var GANTT_VIEWS = ['day', 'week', 'month', 'year'];
var GANTT_DAY = 86400000;

function ganttAssign(target) {
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

function resolveGanttElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function normalizeGanttLocale(value) {
  value = String(value || 'en').trim().replace(/_/g, '-');
  if (/^zh-(?:TW|Hant)(?:-|$)/i.test(value)) return 'zh-TW';
  if (/^zh-(?:CN|Hans)(?:-|$)/i.test(value) || /^zh$/i.test(value)) return 'zh-CN';
  return 'en';
}

function normalizeGanttTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return GANTT_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

function normalizeGanttView(value) {
  value = String(value || 'week').trim().toLowerCase();
  return GANTT_VIEWS.indexOf(value) >= 0 ? value : 'week';
}

function findGanttTheme(element) {
  var current = resolveGanttElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < GANTT_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + GANTT_THEMES[index])) {
        return GANTT_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

function ganttDate(value, fallback) {
  var date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return isNaN(date.getTime()) ? new Date(fallback == null ? Date.now() : fallback) : date;
}

function startOfDay(value) {
  var date = ganttDate(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfWeek(value) {
  var date = startOfDay(value);
  date.setDate(date.getDate() - date.getDay());
  return date;
}

function startOfMonth(value) {
  var date = startOfDay(value);
  date.setDate(1);
  return date;
}

function startOfYear(value) {
  var date = startOfDay(value);
  date.setMonth(0, 1);
  return date;
}

function addMonths(value, amount) {
  var date = ganttDate(value);
  date.setMonth(date.getMonth() + amount);
  return date;
}

function clampGantt(value, min, max) {
  value = Number(value);
  if (!isFinite(value)) value = min;
  return Math.max(min, Math.min(max, value));
}

function ganttTaskId(value) {
  return value == null ? '' : String(value);
}

function normalizeGanttData(data) {
  var source = Array.isArray(data) ? data : [];
  return source.map(function(item, index) {
    var task = ganttAssign({}, item || {});
    var start = ganttDate(task.start);
    var end = ganttDate(task.end, start.getTime() + GANTT_DAY);
    if (end < start) end = new Date(start.getTime());
    task.id = task.id == null ? index + 1 : task.id;
    task.parentId = task.parentId == null ? null : task.parentId;
    task.orderId = Number.isFinite(Number(task.orderId)) ? Number(task.orderId) : index;
    task.title = task.title == null ? '' : String(task.title);
    task.start = start;
    task.end = end;
    task.percentComplete = clampGantt(
      Number(task.percentComplete) > 1 ? Number(task.percentComplete) / 100 : task.percentComplete,
      0,
      1
    );
    task.summary = task.summary === true;
    task.expanded = task.expanded !== false;
    task.milestone = task.milestone === true || end.getTime() === start.getTime();
    task.resources = Array.isArray(task.resources) ? task.resources.slice() : [];
    return task;
  });
}

function flattenGanttTasks(tasks) {
  var children = Object.create(null);
  var known = Object.create(null);
  var result = [];
  tasks.forEach(function(task) {
    known[ganttTaskId(task.id)] = task;
  });
  tasks.forEach(function(task) {
    var parentKey = task.parentId == null || !known[ganttTaskId(task.parentId)] ?
      '__root__' :
      ganttTaskId(task.parentId);
    if (!children[parentKey]) children[parentKey] = [];
    children[parentKey].push(task);
  });
  Object.keys(children).forEach(function(key) {
    children[key].sort(function(a, b) {
      return a.orderId - b.orderId;
    });
  });
  function visit(parentKey, level) {
    (children[parentKey] || []).forEach(function(task) {
      var taskChildren = children[ganttTaskId(task.id)] || [];
      result.push({
        task: task,
        level: level,
        hasChildren: taskChildren.length > 0
      });
      if (task.expanded !== false) visit(ganttTaskId(task.id), level + 1);
    });
  }
  visit('__root__', 0);
  return result;
}

function ganttFormat(date, locale, options) {
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    return date.toLocaleDateString();
  }
}

function rangeFromTasks(tasks, view, rangeStart, rangeEnd, focusDate) {
  var min = rangeStart == null ? null : ganttDate(rangeStart);
  var max = rangeEnd == null ? null : ganttDate(rangeEnd);
  tasks.forEach(function(task) {
    if (!min || task.start < min) min = ganttDate(task.start);
    if (!max || task.end > max) max = ganttDate(task.end);
  });
  if (!min) min = ganttDate(focusDate || Date.now());
  if (!max) max = ganttDate(min.getTime() + 14 * GANTT_DAY);
  if (view === 'day') {
    min = startOfDay(new Date(min.getTime() - GANTT_DAY));
    max = startOfDay(new Date(max.getTime() + 2 * GANTT_DAY));
  } else if (view === 'week') {
    min = startOfWeek(new Date(min.getTime() - 7 * GANTT_DAY));
    max = new Date(startOfWeek(new Date(max.getTime() + 7 * GANTT_DAY)).getTime() + 7 * GANTT_DAY);
  } else if (view === 'month') {
    min = startOfMonth(addMonths(min, -1));
    max = addMonths(startOfMonth(max), 2);
  } else {
    min = startOfYear(addMonths(min, -3));
    max = addMonths(startOfYear(max), 15);
  }
  if (max <= min) max = new Date(min.getTime() + GANTT_DAY);
  return { start: min, end: max };
}

function tickLabel(view, date, locale) {
  if (view === 'day') {
    return ganttFormat(date, locale, { hour: '2-digit', minute: '2-digit' });
  }
  if (view === 'week') {
    return ganttFormat(date, locale, { weekday: 'short', month: 'numeric', day: 'numeric' });
  }
  if (view === 'month') {
    return ganttFormat(date, locale, { month: 'numeric', day: 'numeric' });
  }
  return ganttFormat(date, locale, { month: 'short' });
}

function groupLabel(view, date, locale) {
  var end;
  if (view === 'day') {
    return ganttFormat(date, locale, { weekday: 'short', month: 'short', day: 'numeric' });
  }
  if (view === 'week') {
    end = new Date(date.getTime() + 6 * GANTT_DAY);
    return ganttFormat(date, locale, { month: 'numeric', day: 'numeric' }) +
      ' – ' +
      ganttFormat(end, locale, { month: 'numeric', day: 'numeric' });
  }
  if (view === 'month') {
    return ganttFormat(date, locale, { year: 'numeric', month: 'long' });
  }
  return ganttFormat(date, locale, { year: 'numeric' });
}

function groupKey(view, date) {
  if (view === 'day') return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
  if (view === 'week') {
    date = startOfWeek(date);
    return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
  }
  if (view === 'month') return date.getFullYear() + '-' + date.getMonth();
  return String(date.getFullYear());
}

function createTimelineScale(tasks, options) {
  var view = normalizeGanttView(options && options.view);
  var locale = normalizeGanttLocale(options && options.locale);
  var range = rangeFromTasks(
    tasks || [],
    view,
    options && options.rangeStart,
    options && options.rangeEnd,
    options && options.date
  );
  var slotWidth = view === 'day' ? 54 : view === 'week' ? 44 : view === 'month' ? 72 : 88;
  var ticks = [];
  var cursor = ganttDate(range.start);
  var next;
  var groupMap = [];
  var currentGroup = null;
  while (cursor < range.end && ticks.length < 2000) {
    if (view === 'day') next = new Date(cursor.getTime() + 6 * 3600000);
    else if (view === 'week') next = new Date(cursor.getTime() + GANTT_DAY);
    else if (view === 'month') next = new Date(cursor.getTime() + 7 * GANTT_DAY);
    else next = addMonths(cursor, 1);
    if (next > range.end) next = ganttDate(range.end);
    ticks.push({
      start: ganttDate(cursor),
      end: ganttDate(next),
      label: tickLabel(view, cursor, locale),
      weekend: cursor.getDay() === 0 || cursor.getDay() === 6
    });
    if (!currentGroup || currentGroup.key !== groupKey(view, cursor)) {
      currentGroup = {
        key: groupKey(view, cursor),
        label: groupLabel(view, cursor, locale),
        count: 0
      };
      groupMap.push(currentGroup);
    }
    currentGroup.count += 1;
    cursor = next;
  }
  function x(value) {
    var time = ganttDate(value).getTime();
    var index;
    var tick;
    if (time <= range.start.getTime()) return 0;
    if (time >= range.end.getTime()) return ticks.length * slotWidth;
    for (index = 0; index < ticks.length; index += 1) {
      tick = ticks[index];
      if (time >= tick.start.getTime() && time <= tick.end.getTime()) {
        return index * slotWidth +
          (time - tick.start.getTime()) /
          Math.max(1, tick.end.getTime() - tick.start.getTime()) *
          slotWidth;
      }
    }
    return 0;
  }
  function dateAt(position) {
    var index = clampGantt(Math.floor(position / slotWidth), 0, Math.max(0, ticks.length - 1));
    var tick = ticks[index];
    var ratio = clampGantt((position - index * slotWidth) / slotWidth, 0, 1);
    return new Date(
      tick.start.getTime() +
      ratio * (tick.end.getTime() - tick.start.getTime())
    );
  }
  return {
    view: view,
    start: range.start,
    end: range.end,
    slotWidth: slotWidth,
    ticks: ticks,
    groups: groupMap,
    width: ticks.length * slotWidth,
    x: x,
    dateAt: dateAt
  };
}

function createGanttElement(tag, className, text) {
  var element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = String(text);
  return element;
}

function dependencyType(value) {
  var types = ['FF', 'FS', 'SF', 'SS'];
  if (typeof value === 'number') return types[value] || 'FS';
  value = String(value || 'FS').toUpperCase().replace(/[^FS]/g, '');
  return types.indexOf(value) >= 0 ? value : 'FS';
}

function createGanttFactory(fabui, registerControl, unregisterControl) {
  if (!fabui || typeof fabui.Control !== 'function') {
    throw new Error('fabui.Gantt requires the FabUI core bundle.');
  }
  if (
    typeof fabui.Button !== 'function' ||
    typeof fabui.EditBox !== 'function' ||
    typeof fabui.Window !== 'function'
  ) {
    throw new Error('fabui.Gantt requires fabui.Button, fabui.EditBox and fabui.Window.');
  }
  registerControl = typeof registerControl === 'function' ?
    registerControl :
    fabui.Control._registerControl;
  unregisterControl = typeof unregisterControl === 'function' ?
    unregisterControl :
    fabui.Control._unregisterControl;
  if (
    typeof registerControl !== 'function' ||
    typeof unregisterControl !== 'function'
  ) {
    throw new Error('fabui.Gantt requires the FabUI Control registry.');
  }

  var localePacks = {
    en: {
      gantt: 'Gantt',
      addTask: 'Add task',
      day: 'Day',
      week: 'Week',
      month: 'Month',
      year: 'Year',
      task: 'Task',
      start: 'Start',
      end: 'End',
      complete: '% Complete',
      newTask: 'New task',
      editTask: 'Edit task',
      title: 'Title',
      progress: 'Progress',
      save: 'Save',
      cancel: 'Cancel',
      remove: 'Delete',
      expand: 'Expand {title}',
      collapse: 'Collapse {title}',
      noTasks: 'No tasks',
      splitter: 'Resize task list',
      selected: 'Selected {title}'
    },
    'zh-TW': {
      gantt: '甘特圖',
      addTask: '新增任務',
      day: '日',
      week: '週',
      month: '月',
      year: '年',
      task: '任務',
      start: '開始',
      end: '結束',
      complete: '完成度',
      newTask: '新任務',
      editTask: '編輯任務',
      title: '標題',
      progress: '進度',
      save: '儲存',
      cancel: '取消',
      remove: '刪除',
      expand: '展開「{title}」',
      collapse: '收合「{title}」',
      noTasks: '沒有任務',
      splitter: '調整任務清單寬度',
      selected: '已選取「{title}」'
    },
    'zh-CN': {
      gantt: '甘特图',
      addTask: '新增任务',
      day: '日',
      week: '周',
      month: '月',
      year: '年',
      task: '任务',
      start: '开始',
      end: '结束',
      complete: '完成度',
      newTask: '新任务',
      editTask: '编辑任务',
      title: '标题',
      progress: '进度',
      save: '保存',
      cancel: '取消',
      remove: '删除',
      expand: '展开“{title}”',
      collapse: '收起“{title}”',
      noTasks: '没有任务',
      splitter: '调整任务列表宽度',
      selected: '已选择“{title}”'
    }
  };

  function Gantt(element, options) {
    var host = resolveGanttElement(element);
    if (!(this instanceof Gantt)) return new Gantt(element, options);
    if (!host) throw new Error('fabui.Gantt requires a host element.');
    if (host.__fabuiGantt) return host.__fabuiGantt;
    fabui.Control.call(this);
    this.hostElement = host;
    this._originalClass = host.getAttribute('class');
    this._originalStyle = host.getAttribute('style');
    this._originalHtml = host.innerHTML;
    this._listeners = {};
    this._buttonControls = [];
    this._editorControls = [];
    this._interaction = null;
    this._selectedId = null;
    this._syncingScroll = false;
    this.options = ganttAssign({}, Gantt.defaults, options || {});
    this.options.locale = normalizeGanttLocale(this.options.locale);
    this.options.view = normalizeGanttView(this.options.view);
    this.options.listWidth = clampGantt(this.options.listWidth, this.options.minListWidth, 1200);
    this.options.rowHeight = clampGantt(this.options.rowHeight, 28, 80);
    this.tasks = normalizeGanttData(this.options.dataSource);
    this.dependencies = Array.isArray(this.options.dependencies) ?
      this.options.dependencies.map(function(item, index) {
        return ganttAssign({ id: index + 1, type: 'FS' }, item || {});
      }) :
      [];
    this._build();
    this._bind();
    host.__fabuiGantt = this;
    registerControl(host, this);
    this.setTheme(this.options.theme);
    this.refresh();
  }

  Gantt.prototype = Object.create(fabui.Control.prototype);
  Gantt.prototype.constructor = Gantt;

  Gantt.prototype.getText = function(key, values) {
    var pack = localePacks[this.options.locale] || localePacks.en;
    return String(pack[key] || localePacks.en[key] || key).replace(/\{([^}]+)\}/g, function(match, name) {
      return values && values[name] != null ? values[name] : match;
    });
  };

  Gantt.prototype._build = function() {
    var host = this.hostElement;
    host.innerHTML = '';
    host.classList.add('fui-gantt');
    host.setAttribute('role', 'application');
    host.setAttribute('tabindex', '0');
    this.toolbarElement = createGanttElement('div', 'fui-gantt-toolbar');
    this.contentElement = createGanttElement('div', 'fui-gantt-content');
    this.listPane = createGanttElement('section', 'fui-gantt-list');
    this.listHeader = createGanttElement('div', 'fui-gantt-list-header');
    this.listBody = createGanttElement('div', 'fui-gantt-list-body');
    this.splitter = createGanttElement('div', 'fui-gantt-splitter');
    this.timelinePane = createGanttElement('section', 'fui-gantt-timeline');
    this.timelineHeader = createGanttElement('div', 'fui-gantt-timeline-header');
    this.timelineHeaderCanvas = createGanttElement('div', 'fui-gantt-timeline-header-canvas');
    this.timelineBody = createGanttElement('div', 'fui-gantt-timeline-body');
    this.timelineCanvas = createGanttElement('div', 'fui-gantt-timeline-canvas');
    this.liveRegion = createGanttElement('div', 'fui-gantt-live');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.splitter.setAttribute('role', 'separator');
    this.splitter.setAttribute('tabindex', '0');
    this.splitter.setAttribute('aria-orientation', 'vertical');
    this.listPane.appendChild(this.listHeader);
    this.listPane.appendChild(this.listBody);
    this.timelineHeader.appendChild(this.timelineHeaderCanvas);
    this.timelineBody.appendChild(this.timelineCanvas);
    this.timelinePane.appendChild(this.timelineHeader);
    this.timelinePane.appendChild(this.timelineBody);
    this.contentElement.appendChild(this.listPane);
    this.contentElement.appendChild(this.splitter);
    this.contentElement.appendChild(this.timelinePane);
    host.appendChild(this.toolbarElement);
    host.appendChild(this.contentElement);
    host.appendChild(this.liveRegion);
    this._buildToolbar();
  };

  Gantt.prototype._createButton = function(text, options) {
    var host = createGanttElement('a', '', text);
    var control;
    host.href = 'javascript:void(0)';
    this.toolbarElement.appendChild(host);
    control = new fabui.Button(host, ganttAssign({
      text: text,
      theme: 'inherit',
      plain: true
    }, options || {}));
    this._buttonControls.push(control);
    return control;
  };

  Gantt.prototype._buildToolbar = function() {
    var self = this;
    var spacer;
    this.toolbarElement.innerHTML = '';
    this._buttonControls.forEach(function(control) { control.dispose(); });
    this._buttonControls = [];
    if (this.options.editable) {
      this.addButton = this._createButton(this.getText('addTask'), {
        iconCls: 'icon-add',
        onClick: function() {
          var task = self.addTask({
            title: self.getText('newTask'),
            start: self.options.date || new Date(),
            end: new Date(ganttDate(self.options.date || Date.now()).getTime() + GANTT_DAY),
            percentComplete: 0
          });
          self.editTask(task);
        }
      });
    }
    spacer = createGanttElement('span', 'fui-gantt-toolbar-spacer');
    this.toolbarElement.appendChild(spacer);
    this.viewButtons = {};
    GANTT_VIEWS.forEach(function(view) {
      self.viewButtons[view] = self._createButton(self.getText(view), {
        toggle: true,
        selected: self.options.view === view,
        group: 'fui-gantt-view-' + self._instanceId(),
        onClick: function() {
          self.setView(view);
        }
      });
    });
    this.toolbarElement.hidden = this.options.showToolbar === false;
  };

  Gantt.prototype._instanceId = function() {
    if (!this.__ganttId) {
      Gantt._sequence += 1;
      this.__ganttId = Gantt._sequence;
    }
    return this.__ganttId;
  };

  Gantt.prototype._bind = function() {
    var self = this;
    this.addEventListener(this.listBody, 'scroll', function() {
      if (self._syncingScroll) return;
      self._syncingScroll = true;
      self.timelineBody.scrollTop = self.listBody.scrollTop;
      self._syncingScroll = false;
    }, false, true);
    this.addEventListener(this.timelineBody, 'scroll', function() {
      self.timelineHeaderCanvas.style.transform = 'translateX(' + (-self.timelineBody.scrollLeft) + 'px)';
      if (self._syncingScroll) return;
      self._syncingScroll = true;
      self.listBody.scrollTop = self.timelineBody.scrollTop;
      self._syncingScroll = false;
    }, false, true);
    this.addEventListener(this.splitter, 'pointerdown', function(event) {
      self._startSplitterResize(event);
    });
    this.addEventListener(this.splitter, 'keydown', function(event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      self.setListWidth(self.options.listWidth + (event.key === 'ArrowLeft' ? -16 : 16));
    });
    this.addEventListener(this.hostElement, 'keydown', function(event) {
      self._onKeyDown(event);
    });
  };

  Gantt.prototype._bindDocumentInteraction = function(move, end, cancel) {
    this._clearDocumentInteraction(true);
    this._interaction = {
      move: move,
      end: end,
      cancel: cancel
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', end);
    document.addEventListener('pointercancel', end);
  };

  Gantt.prototype._clearDocumentInteraction = function(cancelled) {
    var interaction = this._interaction;
    if (!interaction) return;
    this._interaction = null;
    document.removeEventListener('pointermove', interaction.move);
    document.removeEventListener('pointerup', interaction.end);
    document.removeEventListener('pointercancel', interaction.end);
    if (cancelled && typeof interaction.cancel === 'function') {
      interaction.cancel();
    }
  };

  Gantt.prototype._startSplitterResize = function(event) {
    var self = this;
    var startX = event.clientX;
    var startWidth = this.options.listWidth;
    var pointerId = event.pointerId;
    function move(moveEvent) {
      if (pointerId != null && moveEvent.pointerId !== pointerId) return;
      self.setListWidth(startWidth + moveEvent.clientX - startX, true);
    }
    function finish(finishEvent) {
      if (pointerId != null && finishEvent.pointerId !== pointerId) return;
      if (finishEvent.type === 'pointercancel') {
        self._clearDocumentInteraction(true);
        return;
      }
      self._clearDocumentInteraction(false);
      self._fire('Resize', { listWidth: self.options.listWidth });
    }
    event.preventDefault();
    this._bindDocumentInteraction(move, finish, function() {
      self.setListWidth(startWidth, true);
    });
  };

  Gantt.prototype._onKeyDown = function(event) {
    var target = event.target;
    var index;
    var task;
    if (target && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName)) return;
    if (!this._flat.length) return;
    index = this._flat.findIndex(function(item) {
      return ganttTaskId(item.task.id) === ganttTaskId(this._selectedId);
    }, this);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      index = index < 0 ? 0 : clampGantt(index + (event.key === 'ArrowDown' ? 1 : -1), 0, this._flat.length - 1);
      this.select(this._flat[index].task.id);
      return;
    }
    task = this.getTask(this._selectedId);
    if (!task) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      task.expanded = event.key === 'ArrowRight';
      this.refresh();
    } else if (event.key === 'Enter' && this.options.editable) {
      event.preventDefault();
      this.editTask(task);
    } else if ((event.key === 'Delete' || event.key === 'Backspace') && this.options.editable) {
      event.preventDefault();
      this.removeTask(task.id);
    }
  };

  Gantt.prototype._renderListHeader = function() {
    var self = this;
    var columns = Array.isArray(this.options.columns) && this.options.columns.length ?
      this.options.columns :
      Gantt.defaults.columns;
    this.listHeader.innerHTML = '';
    this.listHeader.style.gridTemplateColumns = columns.map(function(column) {
      return typeof column.width === 'number' ? column.width + 'px' : String(column.width || '1fr');
    }).join(' ');
    columns.forEach(function(column) {
      self.listHeader.appendChild(createGanttElement(
        'div',
        'fui-gantt-header-cell',
        column.title || self.getText(column.titleKey || column.field)
      ));
    });
  };

  Gantt.prototype._renderList = function() {
    var self = this;
    var columns = Array.isArray(this.options.columns) && this.options.columns.length ?
      this.options.columns :
      Gantt.defaults.columns;
    this.listBody.innerHTML = '';
    if (!this._flat.length) {
      this.listBody.appendChild(createGanttElement('div', 'fui-gantt-empty', this.getText('noTasks')));
      return;
    }
    this._flat.forEach(function(item, rowIndex) {
      var row = createGanttElement('div', 'fui-gantt-list-row');
      row.dataset.taskId = ganttTaskId(item.task.id);
      row.setAttribute('role', 'row');
      row.style.height = self.options.rowHeight + 'px';
      row.style.gridTemplateColumns = columns.map(function(column) {
        return typeof column.width === 'number' ? column.width + 'px' : String(column.width || '1fr');
      }).join(' ');
      if (ganttTaskId(item.task.id) === ganttTaskId(self._selectedId)) {
        row.classList.add('fui-gantt-selected');
        row.setAttribute('aria-selected', 'true');
      }
      columns.forEach(function(column, columnIndex) {
        var cell = createGanttElement('div', 'fui-gantt-cell');
        var value = item.task[column.field];
        if (columnIndex === 0) {
          var indent = createGanttElement('span', 'fui-gantt-indent');
          indent.style.width = item.level * 18 + 'px';
          cell.appendChild(indent);
          if (item.hasChildren) {
            var expander = createGanttElement(
              'button',
              'fui-gantt-expander ' + (item.task.expanded ? 'fui-gantt-expander-open' : 'fui-gantt-expander-closed')
            );
            expander.type = 'button';
            expander.setAttribute('aria-label', self.getText(item.task.expanded ? 'collapse' : 'expand', {
              title: item.task.title
            }));
            expander.setAttribute('aria-expanded', item.task.expanded ? 'true' : 'false');
            expander.addEventListener('click', function(event) {
              event.stopPropagation();
              item.task.expanded = !item.task.expanded;
              self.refresh();
            });
            cell.appendChild(expander);
          } else {
            cell.appendChild(createGanttElement('span', 'fui-gantt-expander-placeholder'));
          }
          cell.appendChild(createGanttElement(
            'span',
            item.task.summary ? 'fui-gantt-task-title fui-gantt-task-title-summary' : 'fui-gantt-task-title',
            item.task.title
          ));
        } else if (value instanceof Date) {
          cell.textContent = ganttFormat(value, self.options.locale, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
          });
        } else if (column.field === 'percentComplete') {
          cell.textContent = Math.round(item.task.percentComplete * 100) + '%';
        } else {
          cell.textContent = value == null ? '' : String(value);
        }
        row.appendChild(cell);
      });
      row.addEventListener('click', function() {
        self.select(item.task.id);
      });
      row.addEventListener('dblclick', function() {
        if (self.options.editable) self.editTask(item.task);
      });
      self.listBody.appendChild(row);
    });
  };

  Gantt.prototype._renderTimelineHeader = function() {
    var upper = createGanttElement('div', 'fui-gantt-time-row fui-gantt-time-row-upper');
    var lower = createGanttElement('div', 'fui-gantt-time-row fui-gantt-time-row-lower');
    var self = this;
    this.timelineHeaderCanvas.innerHTML = '';
    this.timelineHeaderCanvas.style.width = this._scale.width + 'px';
    this._scale.groups.forEach(function(group) {
      var cell = createGanttElement('div', 'fui-gantt-time-cell', group.label);
      cell.style.width = group.count * self._scale.slotWidth + 'px';
      upper.appendChild(cell);
    });
    this._scale.ticks.forEach(function(tick) {
      var cell = createGanttElement(
        'div',
        'fui-gantt-time-cell' + (tick.weekend ? ' fui-gantt-weekend' : ''),
        tick.label
      );
      cell.style.width = self._scale.slotWidth + 'px';
      lower.appendChild(cell);
    });
    this.timelineHeaderCanvas.appendChild(upper);
    this.timelineHeaderCanvas.appendChild(lower);
  };

  Gantt.prototype._renderTimeline = function() {
    var self = this;
    var height = Math.max(this.options.rowHeight, this._flat.length * this.options.rowHeight);
    var barMap = Object.create(null);
    this.timelineCanvas.innerHTML = '';
    this.timelineCanvas.style.width = this._scale.width + 'px';
    this.timelineCanvas.style.height = height + 'px';
    this._scale.ticks.forEach(function(tick, index) {
      var line = createGanttElement('span', 'fui-gantt-grid-line' + (tick.weekend ? ' fui-gantt-weekend' : ''));
      line.style.left = index * self._scale.slotWidth + 'px';
      line.style.width = self._scale.slotWidth + 'px';
      self.timelineCanvas.appendChild(line);
    });
    this._flat.forEach(function(item, rowIndex) {
      var row = createGanttElement('div', 'fui-gantt-timeline-row');
      var task = item.task;
      var left = self._scale.x(task.start);
      var right = self._scale.x(task.end);
      var width = Math.max(task.milestone ? 16 : 10, right - left);
      var bar = createGanttElement('div', 'fui-gantt-task');
      row.style.top = rowIndex * self.options.rowHeight + 'px';
      row.style.height = self.options.rowHeight + 'px';
      row.dataset.taskId = ganttTaskId(task.id);
      if (ganttTaskId(task.id) === ganttTaskId(self._selectedId)) row.classList.add('fui-gantt-selected');
      bar.dataset.taskId = ganttTaskId(task.id);
      bar.style.left = (task.milestone ? left - 8 : left) + 'px';
      bar.style.width = width + 'px';
      if (task.summary) bar.classList.add('fui-gantt-task-summary');
      if (task.milestone) bar.classList.add('fui-gantt-task-milestone');
      if (!task.milestone) {
        var progress = createGanttElement('span', 'fui-gantt-task-progress');
        progress.style.width = task.percentComplete * 100 + '%';
        bar.appendChild(progress);
        if (self.options.editable) {
          bar.appendChild(createGanttElement('span', 'fui-gantt-resize-handle fui-gantt-resize-start'));
          bar.appendChild(createGanttElement('span', 'fui-gantt-resize-handle fui-gantt-resize-end'));
          var progressHandle = createGanttElement('span', 'fui-gantt-progress-handle');
          progressHandle.style.left = task.percentComplete * 100 + '%';
          bar.appendChild(progressHandle);
        }
      }
      bar.setAttribute('role', 'treeitem');
      bar.setAttribute('aria-label', task.title);
      bar.title = task.title;
      bar.addEventListener('click', function(event) {
        event.stopPropagation();
        self.select(task.id);
      });
      bar.addEventListener('dblclick', function(event) {
        event.stopPropagation();
        if (self.options.editable) self.editTask(task);
      });
      if (self.options.editable) {
        bar.addEventListener('pointerdown', function(event) {
          self._startTaskInteraction(event, task, bar, width);
        });
      }
      row.addEventListener('click', function() {
        self.select(task.id);
      });
      row.appendChild(bar);
      if (task.resources.length) {
        var resources = createGanttElement('span', 'fui-gantt-resources', task.resources.join(', '));
        resources.style.left = (task.milestone ? left + 14 : left + width + 8) + 'px';
        row.appendChild(resources);
      }
      self.timelineCanvas.appendChild(row);
      barMap[ganttTaskId(task.id)] = {
        task: task,
        left: task.milestone ? left - 8 : left,
        right: task.milestone ? left + 8 : left + width,
        y: rowIndex * self.options.rowHeight + self.options.rowHeight / 2
      };
    });
    if (this.options.showDependencies !== false) this._renderDependencies(barMap, height);
    this._renderCurrentTime(height);
  };

  Gantt.prototype._renderDependencies = function(barMap, height) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    var marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    var arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    var markerId = 'fui-gantt-arrow-' + this._instanceId();
    svg.setAttribute('class', 'fui-gantt-dependencies');
    svg.setAttribute('width', this._scale.width);
    svg.setAttribute('height', height);
    svg.setAttribute('aria-hidden', 'true');
    marker.setAttribute('id', markerId);
    marker.setAttribute('viewBox', '0 0 8 8');
    marker.setAttribute('refX', '7');
    marker.setAttribute('refY', '4');
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '8');
    marker.setAttribute('orient', 'auto');
    arrow.setAttribute('d', 'M 0 0 L 8 4 L 0 8 z');
    marker.appendChild(arrow);
    defs.appendChild(marker);
    svg.appendChild(defs);
    this.dependencies.forEach(function(dependency) {
      var predecessor = barMap[ganttTaskId(dependency.predecessorId)];
      var successor = barMap[ganttTaskId(dependency.successorId)];
      var type = dependencyType(dependency.type);
      var startX;
      var endX;
      var bendX;
      var path;
      if (!predecessor || !successor) return;
      startX = type.charAt(0) === 'S' ? predecessor.left : predecessor.right;
      endX = type.charAt(1) === 'S' ? successor.left : successor.right;
      bendX = startX + (endX >= startX ? 14 : -14);
      path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute(
        'd',
        'M ' + startX + ' ' + predecessor.y +
        ' L ' + bendX + ' ' + predecessor.y +
        ' L ' + bendX + ' ' + successor.y +
        ' L ' + endX + ' ' + successor.y
      );
      path.setAttribute('marker-end', 'url(#' + markerId + ')');
      svg.appendChild(path);
    });
    this.timelineCanvas.appendChild(svg);
  };

  Gantt.prototype._renderCurrentTime = function(height) {
    var x;
    var marker;
    if (this.options.currentTimeMarker === false) return;
    x = this._scale.x(new Date());
    if (x <= 0 || x >= this._scale.width) return;
    marker = createGanttElement('span', 'fui-gantt-current-time');
    marker.style.left = x + 'px';
    marker.style.height = height + 'px';
    this.timelineCanvas.appendChild(marker);
  };

  Gantt.prototype._startTaskInteraction = function(event, task, bar, width) {
    var self = this;
    var target = event.target;
    var action = target.classList.contains('fui-gantt-resize-start') ?
      'start' :
      target.classList.contains('fui-gantt-resize-end') ?
        'end' :
        target.classList.contains('fui-gantt-progress-handle') ? 'progress' : 'move';
    var startX = event.clientX;
    var originalStart = task.start.getTime();
    var originalEnd = task.end.getTime();
    var originalProgress = task.percentComplete;
    var previewDelta = 0;
    var pointerId = event.pointerId;
    function move(moveEvent) {
      var delta;
      var startDate;
      var endDate;
      if (pointerId != null && moveEvent.pointerId !== pointerId) return;
      delta = moveEvent.clientX - startX;
      startDate = self._scale.dateAt(Math.max(0, self._scale.x(originalStart) + delta));
      endDate = self._scale.dateAt(Math.max(0, self._scale.x(originalEnd) + delta));
      previewDelta = delta;
      if (action === 'move') bar.style.transform = 'translateX(' + delta + 'px)';
      if (action === 'start') {
        var newLeft = self._scale.x(startDate);
        var oldRight = self._scale.x(originalEnd);
        bar.style.left = Math.min(newLeft, oldRight - 10) + 'px';
        bar.style.width = Math.max(10, oldRight - newLeft) + 'px';
      }
      if (action === 'end') bar.style.width = Math.max(10, width + delta) + 'px';
      if (action === 'progress') {
        var value = clampGantt(originalProgress + delta / Math.max(1, width), 0, 1);
        bar.querySelector('.fui-gantt-task-progress').style.width = value * 100 + '%';
        target.style.left = value * 100 + '%';
      }
    }
    function finish(finishEvent) {
      var delta = finishEvent.type === 'pointercancel' ? 0 : previewDelta;
      var startDate;
      var endDate;
      if (pointerId != null && finishEvent.pointerId !== pointerId) return;
      if (finishEvent.type === 'pointercancel') {
        self._clearDocumentInteraction(true);
        return;
      }
      self._clearDocumentInteraction(false);
      startDate = self._scale.dateAt(Math.max(0, self._scale.x(originalStart) + delta));
      endDate = self._scale.dateAt(Math.max(0, self._scale.x(originalEnd) + delta));
      if (action === 'move') {
        task.start = startDate;
        task.end = endDate;
      } else if (action === 'start') {
        task.start = new Date(Math.min(startDate.getTime(), originalEnd - 60000));
      } else if (action === 'end') {
        task.end = new Date(Math.max(originalStart + 60000, endDate.getTime()));
      } else {
        task.percentComplete = clampGantt(originalProgress + delta / Math.max(1, width), 0, 1);
      }
      self.refresh();
      self._fire('Update', { task: task, action: action });
    }
    event.preventDefault();
    event.stopPropagation();
    this.select(task.id);
    this._bindDocumentInteraction(move, finish, function() {
      self.refresh();
    });
  };

  Gantt.prototype.refresh = function() {
    var oldLeft = this.timelineBody.scrollLeft;
    var oldTop = this.timelineBody.scrollTop;
    this._flat = flattenGanttTasks(this.tasks);
    this._scale = createTimelineScale(this.tasks, this.options);
    this.listPane.style.width = this.options.listWidth + 'px';
    this.contentElement.style.height = typeof this.options.height === 'number' ?
      this.options.height + 'px' :
      String(this.options.height);
    this.splitter.setAttribute('aria-label', this.getText('splitter'));
    this.splitter.setAttribute('aria-valuenow', String(this.options.listWidth));
    this.hostElement.setAttribute('aria-label', this.options.ariaLabel || this.getText('gantt'));
    this._renderListHeader();
    this._renderList();
    this._renderTimelineHeader();
    this._renderTimeline();
    this.timelineBody.scrollLeft = oldLeft;
    this.timelineBody.scrollTop = oldTop;
    this.listBody.scrollTop = oldTop;
    this.timelineHeaderCanvas.style.transform = 'translateX(' + (-oldLeft) + 'px)';
    this._fire('DataBound', { tasks: this.tasks, view: this.options.view });
    return this;
  };

  Gantt.prototype._fire = function(name, detail) {
    var callback = this.options['on' + name];
    var listeners = (this._listeners[name.toLowerCase()] || []).slice();
    var args = ganttAssign({ gantt: this }, detail || {});
    if (typeof callback === 'function') callback.call(this.hostElement, this, args);
    listeners.forEach(function(listener) {
      listener.call(this, args);
    }, this);
  };

  Gantt.prototype.on = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!name || typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  Gantt.prototype.off = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!this._listeners[name]) return this;
    this._listeners[name] = listener ?
      this._listeners[name].filter(function(item) { return item !== listener; }) :
      [];
    return this;
  };

  Gantt.prototype.getTask = function(id) {
    var key = ganttTaskId(id);
    return this.tasks.find(function(task) {
      return ganttTaskId(task.id) === key;
    }) || null;
  };

  Gantt.prototype.getDataSource = function() {
    return this.tasks;
  };

  Gantt.prototype.setDataSource = function(data) {
    this.tasks = normalizeGanttData(data);
    this._selectedId = null;
    return this.refresh();
  };

  Gantt.prototype.getDependencies = function() {
    return this.dependencies;
  };

  Gantt.prototype.setDependencies = function(data) {
    this.dependencies = Array.isArray(data) ? data.map(function(item) {
      return ganttAssign({}, item || {});
    }) : [];
    return this.refresh();
  };

  Gantt.prototype.addTask = function(task, parentId) {
    var maxId = this.tasks.reduce(function(max, item) {
      var value = Number(item.id);
      return isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    var normalized = normalizeGanttData([ganttAssign({
      id: maxId + 1,
      parentId: parentId == null ? null : parentId,
      orderId: this.tasks.length,
      title: this.getText('newTask'),
      start: new Date(),
      end: new Date(Date.now() + GANTT_DAY),
      percentComplete: 0
    }, task || {})])[0];
    this.tasks.push(normalized);
    this.refresh();
    this.select(normalized.id);
    this._fire('Add', { task: normalized });
    return normalized;
  };

  Gantt.prototype.updateTask = function(id, changes) {
    var task = this.getTask(id);
    if (!task) return null;
    ganttAssign(task, changes || {});
    if (changes && Object.prototype.hasOwnProperty.call(changes, 'start')) task.start = ganttDate(changes.start);
    if (changes && Object.prototype.hasOwnProperty.call(changes, 'end')) task.end = ganttDate(changes.end);
    if (task.end < task.start) task.end = new Date(task.start.getTime());
    task.percentComplete = clampGantt(
      Number(task.percentComplete) > 1 ? Number(task.percentComplete) / 100 : task.percentComplete,
      0,
      1
    );
    task.milestone = task.milestone === true || task.end.getTime() === task.start.getTime();
    this.refresh();
    this._fire('Update', { task: task, action: 'api' });
    return task;
  };

  Gantt.prototype.removeTask = function(id) {
    var key = ganttTaskId(id);
    var removed = [];
    var pending = [key];
    while (pending.length) {
      key = pending.pop();
      this.tasks.forEach(function(task) {
        if (ganttTaskId(task.parentId) === key) pending.push(ganttTaskId(task.id));
      });
      removed.push(key);
    }
    this.tasks = this.tasks.filter(function(task) {
      return removed.indexOf(ganttTaskId(task.id)) < 0;
    });
    this.dependencies = this.dependencies.filter(function(item) {
      return removed.indexOf(ganttTaskId(item.predecessorId)) < 0 &&
        removed.indexOf(ganttTaskId(item.successorId)) < 0;
    });
    if (removed.indexOf(ganttTaskId(this._selectedId)) >= 0) this._selectedId = null;
    this.refresh();
    this._fire('Remove', { ids: removed.slice() });
    return removed.length > 0;
  };

  Gantt.prototype.select = function(id) {
    var task = this.getTask(id);
    var row;
    if (!task) return null;
    this._selectedId = task.id;
    this.hostElement.querySelectorAll('.fui-gantt-selected').forEach(function(element) {
      element.classList.remove('fui-gantt-selected');
      element.removeAttribute('aria-selected');
    });
    this.hostElement.querySelectorAll('[data-task-id="' + CSS.escape(ganttTaskId(task.id)) + '"]').forEach(function(element) {
      element.classList.add('fui-gantt-selected');
      if (element.classList.contains('fui-gantt-list-row')) element.setAttribute('aria-selected', 'true');
    });
    row = this.listBody.querySelector('[data-task-id="' + CSS.escape(ganttTaskId(task.id)) + '"]');
    if (row) row.scrollIntoView({ block: 'nearest' });
    this.liveRegion.textContent = this.getText('selected', { title: task.title });
    this._fire('Change', { task: task });
    return task;
  };

  Gantt.prototype.clearSelection = function() {
    this._selectedId = null;
    this.hostElement.querySelectorAll('.fui-gantt-selected').forEach(function(element) {
      element.classList.remove('fui-gantt-selected');
      element.removeAttribute('aria-selected');
    });
    return this;
  };

  Gantt.prototype.getView = function() {
    return this.options.view;
  };

  Gantt.prototype.setView = function(view) {
    view = normalizeGanttView(view);
    if (view === this.options.view) return this;
    this.options.view = view;
    Object.keys(this.viewButtons || {}).forEach(function(name) {
      if (name === view) this.viewButtons[name].select(true);
      else this.viewButtons[name].unselect(true);
    }, this);
    this.refresh();
    this._fire('ViewChange', { view: view });
    return this;
  };

  Gantt.prototype.range = function() {
    return {
      start: ganttDate(this._scale.start),
      end: ganttDate(this._scale.end)
    };
  };

  Gantt.prototype.scrollToDate = function(value) {
    this.timelineBody.scrollLeft = Math.max(0, this._scale.x(value) - this.timelineBody.clientWidth / 2);
    return this;
  };

  Gantt.prototype.expand = function(id) {
    var task = this.getTask(id);
    if (task) {
      task.expanded = true;
      this.refresh();
    }
    return this;
  };

  Gantt.prototype.collapse = function(id) {
    var task = this.getTask(id);
    if (task) {
      task.expanded = false;
      this.refresh();
    }
    return this;
  };

  Gantt.prototype.expandAll = function() {
    this.tasks.forEach(function(task) { task.expanded = true; });
    return this.refresh();
  };

  Gantt.prototype.collapseAll = function() {
    this.tasks.forEach(function(task) { task.expanded = false; });
    return this.refresh();
  };

  Gantt.prototype.setListWidth = function(value, silent) {
    this.options.listWidth = clampGantt(value, this.options.minListWidth, 1200);
    this.listPane.style.width = this.options.listWidth + 'px';
    this.splitter.setAttribute('aria-valuenow', String(this.options.listWidth));
    if (!silent) this._fire('Resize', { listWidth: this.options.listWidth });
    return this;
  };

  Gantt.prototype.setTheme = function(theme) {
    var normalized = theme === 'inherit' || theme == null ? findGanttTheme(this.hostElement.parentElement) : normalizeGanttTheme(theme);
    GANTT_THEMES.forEach(function(name) {
      this.hostElement.classList.remove('fg-theme-' + name);
    }, this);
    this.theme = normalized;
    this.options.theme = theme == null ? 'inherit' : theme;
    this.hostElement.classList.add('fg-theme-' + normalized);
    this._buttonControls.forEach(function(control) { control.setTheme('inherit'); });
    if (this._editorWindow) this._editorWindow.setTheme(normalized);
    return this;
  };

  Gantt.prototype.setLocale = function(locale) {
    this.options.locale = normalizeGanttLocale(locale);
    this._buildToolbar();
    if (this._editorWindow) {
      this._destroyEditor();
    }
    return this.refresh();
  };

  Gantt.prototype.editTask = function(taskOrId) {
    var task = typeof taskOrId === 'object' ? taskOrId : this.getTask(taskOrId);
    var self = this;
    if (!this.options.editable || !task) return this;
    this._ensureEditor();
    this._editingTask = task;
    this._editorWindow.setTitle(this.getText('editTask'));
    this._editorFields.title.setValue(task.title, true);
    this._editorFields.start.setDate(task.start, true);
    this._editorFields.end.setDate(task.end, true);
    this._editorFields.progress.setValue(Math.round(task.percentComplete * 100), true);
    this._editorDelete.hostElement.hidden = false;
    this._editorSave.options.onClick = function() {
      var start = self._editorFields.start.getDate();
      var end = self._editorFields.end.getDate();
      if (!start || !end) return;
      self.updateTask(task.id, {
        title: self._editorFields.title.getValue(),
        start: start,
        end: end,
        percentComplete: Number(self._editorFields.progress.getValue()) / 100
      });
      self._editorWindow.close();
    };
    this._editorDelete.options.onClick = function() {
      self.removeTask(task.id);
      self._editorWindow.close();
    };
    this._editorWindow.open().center();
    return this;
  };

  Gantt.prototype._ensureEditor = function() {
    var self = this;
    var host;
    var form;
    var actions;
    function field(label, type) {
      var row = createGanttElement('label', 'fui-gantt-editor-row');
      var text = createGanttElement('span', 'fui-gantt-editor-label', label);
      var input = createGanttElement('input', 'fui-gantt-editor-input');
      row.appendChild(text);
      row.appendChild(input);
      form.appendChild(row);
      return new fabui.EditBox(input, {
        editor: type,
        width: '100%',
        theme: 'inherit',
        min: type === 'number' ? 0 : null,
        max: type === 'number' ? 100 : null,
        precision: type === 'number' ? 0 : null
      });
    }
    function action(text) {
      var anchor = createGanttElement('a', '', text);
      anchor.href = 'javascript:void(0)';
      actions.appendChild(anchor);
      return new fabui.Button(anchor, { text: text, theme: 'inherit' });
    }
    if (this._editorWindow) return;
    host = createGanttElement('div', 'fui-gantt-editor');
    form = createGanttElement('div', 'fui-gantt-editor-form');
    actions = createGanttElement('div', 'fui-gantt-editor-actions');
    host.appendChild(form);
    host.appendChild(actions);
    document.body.appendChild(host);
    this._editorHost = host;
    this._editorFields = {
      title: field(this.getText('title'), 'text'),
      start: field(this.getText('start'), 'date'),
      end: field(this.getText('end'), 'date'),
      progress: field(this.getText('progress'), 'number')
    };
    this._editorDelete = action(this.getText('remove'));
    this._editorCancel = action(this.getText('cancel'));
    this._editorSave = action(this.getText('save'));
    this._editorDelete.hostElement.classList.add('fui-gantt-editor-delete');
    this._editorCancel.options.onClick = function() {
      self._editorWindow.close();
    };
    this._editorControls = Object.keys(this._editorFields).map(function(key) {
      return self._editorFields[key];
    }).concat([this._editorDelete, this._editorCancel, this._editorSave]);
    this._editorWindow = new fabui.Window(host, {
      title: this.getText('editTask'),
      width: 440,
      height: 360,
      modal: true,
      constrain: true,
      maximizable: false,
      closed: true,
      theme: this.theme,
      locale: this.options.locale
    });
  };

  Gantt.prototype._destroyEditor = function() {
    if (!this._editorWindow) return;
    this._editorControls.forEach(function(control) {
      if (control && typeof control.dispose === 'function') control.dispose();
    });
    this._editorWindow.dispose();
    this._editorWindow = null;
    this._editorControls = [];
    this._editorFields = null;
    this._editorHost = null;
  };

  Gantt.prototype.dispose = function() {
    var host = this.hostElement;
    this._clearDocumentInteraction(true);
    this._destroyEditor();
    this._buttonControls.forEach(function(control) { control.dispose(); });
    this._buttonControls = [];
    this.removeEventListener();
    unregisterControl(host, this);
    delete host.__fabuiGantt;
    host.innerHTML = this._originalHtml;
    if (this._originalClass == null) host.removeAttribute('class');
    else host.setAttribute('class', this._originalClass);
    if (this._originalStyle == null) host.removeAttribute('style');
    else host.setAttribute('style', this._originalStyle);
    host.removeAttribute('role');
    host.removeAttribute('tabindex');
    host.removeAttribute('aria-label');
    this._listeners = {};
  };

  Gantt.prototype.destroy = Gantt.prototype.dispose;

  Gantt.defaults = {
    dataSource: [],
    dependencies: [],
    columns: [
      { field: 'title', title: '', width: 'minmax(220px, 1fr)' },
      { field: 'start', title: '', width: 112 },
      { field: 'end', title: '', width: 112 },
      { field: 'percentComplete', title: '', titleKey: 'complete', width: 88 }
    ],
    view: 'week',
    views: GANTT_VIEWS.slice(),
    date: null,
    rangeStart: null,
    rangeEnd: null,
    height: 620,
    listWidth: 540,
    minListWidth: 260,
    rowHeight: 38,
    editable: true,
    showToolbar: true,
    showDependencies: true,
    currentTimeMarker: true,
    locale: 'en',
    theme: 'inherit',
    ariaLabel: '',
    onAdd: null,
    onUpdate: null,
    onRemove: null,
    onChange: null,
    onResize: null,
    onViewChange: null,
    onDataBound: null
  };
  Gantt.locales = localePacks;
  Gantt.themes = GANTT_THEMES.slice();
  Gantt.views = GANTT_VIEWS.slice();
  Gantt.normalizeLocale = normalizeGanttLocale;
  Gantt.normalizeTheme = normalizeGanttTheme;
  Gantt.normalizeView = normalizeGanttView;
  Gantt.getControl = function(element) {
    element = resolveGanttElement(element);
    return element && element.__fabuiGantt ? element.__fabuiGantt : null;
  };
  Gantt._sequence = 0;
  return Gantt;
}

global.fabui.Gantt = createGanttFactory(global.fabui);
}(typeof window !== "undefined" ? window : this));
